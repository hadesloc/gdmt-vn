/**
 * GDMT-VN CKD Module - Outpatient Statin Prevention, Renal Cap & Dialysis Continuation (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation & Modularization)
 * Bao phủ: CKD-R4-R1-06, CKD-R4-R1-09, CKD-R4-R2-03/06/08, CKD-R4-R3-07/09/11
 */

import type { Rule, RuleContext } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  extractStatinComponentId,
  fmtShortDose,
  formatCurrentMedDose,
  getMedComponents,
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasConfirmedCkdEvidence,
  isAkiActive,
  isBreastfeedingCkd,
  isChildPughC,
  isKidneyTransplant,
  isOutpatientAcuteCrisis,
  isStatinMed,
  medDisplayName,
  normalizeDrugId,
  parseCurrentDailyDoseMg,
} from './helpers';

function getYoungCvRisk10yPct(ctx: RuleContext): number | undefined {
  if (typeof ctx.derived.cvRisk10y === 'number') return ctx.derived.cvRisk10y;
  const custom = (ctx.normalized.customInputs ?? ctx.patient.customInputs) as Record<string, unknown> | undefined;
  const raw = custom?.statin10yCvRiskPct ?? custom?.score2RiskPct ?? custom?.ascvdRisk10y;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

function isRosuvastatinOverSevereRenalCap(ctx: RuleContext): boolean {
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const severeCkd =
    hasCkdFlag(ctx, 'onDialysis') ||
    (egfr !== undefined && egfr < thFor('egfr', 'ckd.statin.rosuvastatin_severe_ckd_egfr_cutoff')) ||
    (crcl !== undefined && crcl < thFor('crcl', 'ckd.statin.rosuvastatin_severe_ckd_crcl_cutoff'));
  if (!severeCkd) return false;

  const rosuMed = ctx.patient.currentMeds.find(
    (m) => extractStatinComponentId(m) === 'rosuvastatin'
  );
  if (!rosuMed) return false;
  const dailyMg = parseCurrentDailyDoseMg(rosuMed, 'rosuvastatin');
  return (
    dailyMg !== undefined &&
    dailyMg > thFor('dose_mg', 'ckd.statin.rosuvastatin_severe_ckd_max_dose')
  );
}

export const ckdOutpatientStatinRules: Rule[] = [
  // 1. Statin phòng ngừa biến cố tim mạch ở bệnh nhân CKD xác định (KDIGO 2024 1A/1B/2A & ESC 2026 Table 10)
  {
    id: 'ckd.outpatient.statin_indication',
    module: 'ckd',
    nameVi: 'Điều trị Statin phòng ngừa biến cố tim mạch ở CKD',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis')) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      if (!hasCkdFlag(ctx, 'pregnant') && !hasConfirmedCkdEvidence(ctx)) return false;

      const age = need(ctx, 'age');
      if (age === undefined) return false;
      if (ctx.patient.currentMeds.some((m) => isStatinMed(m))) return false;
      if (!hasCkdFlag(ctx, 'pregnant') && need(ctx, 'egfr') === undefined) return false;

      const statinAgeMin = thFor('age', 'ckd.statin.age_min');
      const adultAgeMin = thFor('age', 'ckd.statin.adult_age_min');
      const minCvRisk10y = thFor('percentage', 'ckd.statin.young_cv_risk_10y_min');
      const cvRisk10y = getYoungCvRisk10yPct(ctx);

      const isEligibleAge = age >= statinAgeMin;
      const isTransplantEligible = age >= adultAgeMin && isKidneyTransplant(ctx);
      const isYoungHighRisk =
        age >= adultAgeMin &&
        age < statinAgeMin &&
        (hasCondition(ctx, 'ascvd') ||
          hasCondition(ctx, 'dm') ||
          hasCondition(ctx, 'strokeOrTia') ||
          (cvRisk10y !== undefined && cvRisk10y > minCvRisk10y));

      return isEligibleAge || isYoungHighRisk || isTransplantEligible;
    },
    produce: (ctx) => {
      const age = need(ctx, 'age')!;
      const egfr = need(ctx, 'egfr');
      const atorvaName = drug('atorvastatin').nameVi;

      if (hasCkdFlag(ctx, 'pregnant')) {
        return {
          id: 'rec_ckd_statin_contra_preg',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'atorvastatin',
          drugNameVi: atorvaName,
          dose: undefined,
          title: 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Statin trong thai kỳ',
          rationale:
            'Statin chống chỉ định trong thai kỳ do ức chế tổng hợp cholesterol thiết yếu cho sự phát triển phôi thai.',
          gates: [
            {
              parameter: 'pregnancy',
              passed: false,
              messageVi: 'Đang mang thai: Chống chỉ định dùng nhóm Statin',
            },
          ],
          citationIds: [
            'esc.lipid.2024.ccs_pregnancy',
            'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
          ],
          priority: 100,
        };
      }

      if (isBreastfeedingCkd(ctx)) {
        return {
          id: 'rec_ckd_statin_contra_lactation',
          module: 'ckd',
          tier: 'Cảnh báo an toàn thai kỳ & cho con bú',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'atorvastatin',
          drugNameVi: atorvaName,
          dose: undefined,
          title: 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Statin trong thời kỳ đang cho con bú',
          rationale:
            'Theo ESC/EAS Lipid và nhãn FDA: Không dùng Statin khi đang cho con bú do nguy cơ ức chế tổng hợp cholesterol ở trẻ bú mẹ; trì hoãn khởi trị đến khi cai sữa.',
          gates: [
            {
              parameter: 'lactation',
              passed: false,
              messageVi: 'Đang cho con bú: Chống chỉ định nhóm Statin',
            },
          ],
          citationIds: [
            'esc.lipid.2024.ccs_pregnancy',
            'esc.lipid.2019.pregnancy_all_llt_contra',
          ],
          priority: 98,
        };
      }

      if (isChildPughC(ctx) || hasCondition(ctx, 'activeLiverDisease')) {
        return {
          id: 'rec_ckd_statin_avoid_liver',
          module: 'ckd',
          tier: 'Cảnh báo an toàn gan - thận',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'atorvastatin',
          drugNameVi: atorvaName,
          dose: undefined,
          title: `CHỐNG CHỈ ĐỊNH khởi trị ${atorvaName} trên bệnh gan mất bù / suy gan nặng (Child-Pugh C)`,
          rationale:
            'Theo nhãn FDA Lipitor và ESC Lipid: Chống chỉ định khởi trị Atorvastatin ở suy gan mất bù (Child-Pugh C) hoặc bệnh gan hoạt động.',
          gates: [
            {
              parameter: 'Hepatic',
              passed: false,
              messageVi: 'Suy gan mất bù / bệnh gan hoạt động: Chống chỉ định khởi trị Statin',
            },
          ],
          citationIds: ['esc.lipid.2019.monitoring_alt_elevation'],
          priority: 94,
        };
      }

      if (ctx.patient.currentMeds.some((m) => getMedComponents(m).includes('gemfibrozil'))) {
        return {
          id: 'rec_ckd_statin_avoid_gemfibrozil',
          module: 'ckd',
          tier: 'Cảnh báo tương tác thuốc',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'atorvastatin',
          drugNameVi: atorvaName,
          dose: undefined,
          title: `TRÁNH phối hợp ${atorvaName} khi đang dùng Gemfibrozil (Nguy cơ tiêu cơ vân cấp)`,
          rationale:
            'Theo ACC/AHA 2026 và nhãn FDA Lipitor: Không phối hợp Gemfibrozil với Statin do ức chế glucuronid hóa và OATP1B1 làm tăng vọt nồng độ statin gây tiêu cơ vân và suy thận cấp.',
          gates: [
            {
              parameter: 'DDI_Gemfibrozil',
              passed: false,
              messageVi: 'Đang dùng Gemfibrozil: Tránh khởi trị chồng Statin',
            },
          ],
          citationIds: [
            'acc.lipid.2026.gemfibrozil_statin_contra',
            'fda.atorvastatin.cyclosporine_gemfibrozil_not_rec',
          ],
          priority: 96,
        };
      }

      if (ctx.patient.currentMeds.some((m) => getMedComponents(m).includes('cyclosporine'))) {
        return {
          id: 'rec_ckd_statin_avoid_cyclosporine',
          module: 'ckd',
          tier: 'Cảnh báo tương tác thuốc',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'atorvastatin',
          drugNameVi: atorvaName,
          dose: undefined,
          title: `TRÁNH khởi trị ${atorvaName} khi đang dùng Cyclosporine (Tương tác ức chế miễn dịch nặng)`,
          rationale:
            'Theo nhãn FDA Lipitor và ESC 2026 CVD-CKD: Không khuyến cáo dùng đồng thời Cyclosporine với Atorvastatin do tăng mạnh phơi nhiễm thuốc và nguy cơ tiêu cơ vân; hội chẩn lựa chọn phác đồ hạ lipid tương thích thuốc chống thải ghép.',
          gates: [
            {
              parameter: 'DDI_Cyclosporine',
              passed: false,
              messageVi: 'Đang dùng Cyclosporine: Tránh khởi trị Atorvastatin',
            },
          ],
          citationIds: [
            'fda.atorvastatin.cyclosporine_gemfibrozil_not_rec',
            'esc.2026.ckd.table_10_statin_transplant',
          ],
          priority: 95,
        };
      }

      let chosenStatinId: 'atorvastatin' | 'rosuvastatin' = 'atorvastatin';
      if (hasCkdDrugAllergy(ctx, 'atorvastatin')) {
        if (!hasCkdDrugAllergy(ctx, 'rosuvastatin')) {
          chosenStatinId = 'rosuvastatin';
        } else {
          return {
            id: 'rec_ckd_statin_avoid_allergy',
            module: 'ckd',
            tier: 'Cảnh báo an toàn thuốc',
            tierOrder: 0,
            action: 'AVOID',
            drugId: 'atorvastatin',
            drugNameVi: atorvaName,
            dose: undefined,
            title: 'CHỐNG CHỈ ĐỊNH khởi trị Statin do tiền sử dị ứng / quá mẫn thuốc',
            rationale:
              'Bệnh nhân có tiền sử quá mẫn với nhóm Statin; cân nhắc phác đồ hạ lipid ngoài statin (như Ezetimibe hoặc PCSK9i).',
            gates: [
              {
                parameter: 'Allergy',
                passed: false,
                messageVi: 'Dị ứng Statin: Chống chỉ định dùng lại',
              },
            ],
            citationIds: ['esc.lipid.2025.non_statin_intolerance_combo'],
            priority: 96,
          };
        }
      }

      const chosenName = drug(chosenStatinId).nameVi;
      const rosuCutoff = thFor('egfr', 'ckd.statin.rosuvastatin_severe_ckd_egfr_cutoff');
      const rosuMaxSevere = thFor('dose_mg', 'ckd.statin.rosuvastatin_severe_ckd_max_dose');
      const statinStartDose =
        chosenStatinId === 'rosuvastatin' && egfr !== undefined && egfr < rosuCutoff
          ? `tối đa ${rosuMaxSevere} mg x 1 lần/ngày`
          : fmtShortDose(dose(chosenStatinId, 'start'));

      const statinAgeMin = thFor('age', 'ckd.statin.age_min');
      const adultAgeMin = thFor('age', 'ckd.statin.adult_age_min');
      const minCvRisk10y = thFor('percentage', 'ckd.statin.young_cv_risk_10y_min');
      const cvRisk10y = getYoungCvRisk10yPct(ctx);
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const isTransplant = isKidneyTransplant(ctx);
      const isYoung = age < statinAgeMin;
      const isG1G2 = egfr !== undefined && egfr >= g2Min;

      let loeLabel = '1A (KDIGO 2024 Rec 3.15.1.1)';
      let statinCitations = ['kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60'];
      if (isTransplant) {
        loeLabel = 'Class IIa-B (ESC 2026 Table 10)';
        statinCitations = ['esc.2026.ckd.table_10_statin_transplant'];
      } else if (isYoung) {
        loeLabel = '2A (KDIGO 2024 Rec 3.15.1.3)';
        statinCitations =
          cvRisk10y !== undefined && cvRisk10y > minCvRisk10y
            ? [
                'kdigo.ckd.2024.rec_3_15_1_3_statin_18_49',
                'kdigo.ckd.2024.rec_3_15_1_3_statin_10pct_risk',
              ]
            : ['kdigo.ckd.2024.rec_3_15_1_3_statin_18_49'];
      } else if (isG1G2) {
        loeLabel = '1B (KDIGO 2024 Rec 3.15.1.2)';
        statinCitations = ['kdigo.ckd.2024.rec_3_15_1_2_statin_egfr_ge_60'];
      }
      if (chosenStatinId === 'rosuvastatin') {
        statinCitations.push('fda.rosuvastatin.renal_impairment');
      }

      const ageGateMin = isYoung || isTransplant ? adultAgeMin : statinAgeMin;
      const hasChronicLiverNote = hasCondition(ctx, 'liverDisease')
        ? ' Lưu ý: Tiền sử bệnh gan — kiểm tra AST/ALT nền trước khởi trị.'
        : '';

      const rationale =
        (isTransplant
          ? `Theo ESC 2026 CVD-CKD (${loeLabel}): Ở người trưởng thành ghép thận, cân nhắc điều trị nền tảng statin (${chosenName}) để giảm biến cố tim mạch lớn; rà soát kỹ tương tác thuốc ức chế calcineurin.`
          : isYoung
            ? `Theo KDIGO 2024 (${loeLabel}): Người lớn ${adultAgeMin}–<${statinAgeMin} tuổi mắc CKD kèm ĐTĐ, bệnh mạch vành, đột quỵ thiếu máu não hoặc nguy cơ mạch vành 10 năm > ${minCvRisk10y}%${cvRisk10y !== undefined ? ` (${cvRisk10y.toFixed(1)}%)` : ''} được khuyến nghị dùng statin dự phòng tim mạch.`
            : isG1G2
              ? `Theo KDIGO 2024 (${loeLabel}): Người lớn >= ${statinAgeMin} tuổi mắc CKD G1–G2 có bằng chứng tổn thương thận được khuyến cáo điều trị statin giảm biến cố xơ vữa.`
              : `Theo KDIGO 2024 (${loeLabel}): Người lớn >= ${statinAgeMin} tuổi mắc CKD G3a–G5 chưa lọc máu được khuyến cáo điều trị statin hoặc statin + ezetimibe để giảm tử vong và biến cố tim mạch.`) +
        hasChronicLiverNote;

      const action =
        isTransplant && !hasCondition(ctx, 'ascvd') && !hasCondition(ctx, 'dm')
          ? 'CONSIDER'
          : 'START';

      return {
        id: 'rec_ckd_statin_start',
        module: 'ckd',
        tier: 'Bảo vệ tim mạch & Lipid',
        tierOrder: 2,
        action,
        drugId: chosenStatinId,
        drugNameVi: chosenName,
        dose: statinStartDose,
        title:
          action === 'CONSIDER'
            ? `Cân nhắc khởi trị ${chosenName} (${statinStartDose}) bảo vệ tim mạch sau ghép thận`
            : `Khởi trị ${chosenName} (${statinStartDose}) phòng ngừa biến cố tim mạch`,
        rationale,
        gates: [
          {
            parameter: 'age',
            passed: age >= ageGateMin,
            value: age,
            threshold: ageGateMin,
            messageVi: `Tuổi ${age} >= ${ageGateMin}: Đủ chỉ định statin (${loeLabel})`,
          },
        ],
        citationIds: hasCondition(ctx, 'liverDisease')
          ? [...statinCitations, 'esc.lipid.2019.monitoring_alt_elevation']
          : statinCitations,
        benefitsAlso: ['lipid'],
        priority: 76,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
      'kdigo.ckd.2024.rec_3_15_1_2_statin_egfr_ge_60',
      'kdigo.ckd.2024.rec_3_15_1_3_statin_18_49',
    ],
  },

  // 2. Giới hạn trần liều Rosuvastatin <= 10 mg/ngày khi suy thận nặng G4–G5 (CKD-R4-R3-07)
  {
    id: 'ckd.outpatient.statin_rosuvastatin_renal_cap',
    module: 'ckd',
    nameVi: 'Giảm liều Rosuvastatin vượt trần cho phép ở bệnh nhân suy thận nặng',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || isBreastfeedingCkd(ctx)) return false;
      if (isChildPughC(ctx) || hasCondition(ctx, 'activeLiverDisease')) return false;
      return isRosuvastatinOverSevereRenalCap(ctx);
    },
    produce: (ctx) => {
      const rosuMed = ctx.patient.currentMeds.find(
        (m) => extractStatinComponentId(m) === 'rosuvastatin'
      )!;
      const dailyMg = parseCurrentDailyDoseMg(rosuMed, 'rosuvastatin')!;
      const maxMg = thFor('dose_mg', 'ckd.statin.rosuvastatin_severe_ckd_max_dose');
      const egfr = need(ctx, 'egfr');
      const cutoffEgfr = thFor('egfr', 'ckd.statin.rosuvastatin_severe_ckd_egfr_cutoff');
      const medName = medDisplayName(rosuMed);

      return {
        id: 'rec_ckd_rosuvastatin_renal_cap',
        module: 'ckd',
        tier: 'Cảnh báo liều thận & Tiêu cơ vân',
        tierOrder: 0,
        action: 'REDUCE',
        drugId: normalizeDrugId(rosuMed.drugId),
        drugNameVi: medName,
        dose: `tối đa ${maxMg} mg x 1 lần/ngày`,
        title: `GIẢM LIỀU ${medName} xuống tối đa ${maxMg} mg/ngày (hoặc chuyển sang Atorvastatin) do suy thận nặng`,
        rationale:
          `Theo nhãn FDA Crestor (Mục 2.5 Renal Impairment): Ở bệnh nhân suy thận nặng (eGFR/CrCl < ${cutoffEgfr} mL/phút), phơi nhiễm Rosuvastatin huyết tương tăng gấp ~3 lần nên tổng liều KHÔNG VƯỢT QUÁ ${maxMg} mg/ngày (hiện dùng ${dailyMg} mg/ngày) để phòng bệnh cơ và tiêu cơ vân cấp. Nếu cần hạ LDL-C mạnh hơn, phối hợp Ezetimibe hoặc chuyển sang Atorvastatin.`,
        gates: [
          {
            parameter: 'Rosuvastatin_Renal_Max',
            passed: false,
            value: dailyMg,
            threshold: maxMg,
            messageVi: `Rosuvastatin ${dailyMg} mg/ngày > trần ${maxMg} mg/ngày ở CKD nặng${egfr !== undefined ? ` (eGFR ${egfr.toFixed(0)})` : ''}`,
          },
        ],
        citationIds: ['fda.rosuvastatin.renal_impairment', 'fda.atorvastatin.renal'],
        benefitsAlso: ['lipid'],
        priority: 93,
      };
    },
    citationIds: ['fda.rosuvastatin.renal_impairment', 'fda.atorvastatin.renal'],
  },

  // 3. Tiếp tục duy trì Statin ở bệnh nhân đang lọc máu định kỳ nếu đã dùng liều an toàn trước đó
  {
    id: 'ckd.outpatient.statin_continue_dialysis',
    module: 'ckd',
    nameVi: 'Tiếp tục duy trì Statin đang dùng khi bệnh nhân chuyển sang lọc máu định kỳ',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant') || isBreastfeedingCkd(ctx)) {
        return false;
      }
      if (isChildPughC(ctx) || hasCondition(ctx, 'activeLiverDisease')) return false;
      if (isOutpatientAcuteCrisis(ctx)) return false;
      if (isRosuvastatinOverSevereRenalCap(ctx)) return false;
      if (ctx.patient.currentMeds.some((m) => getMedComponents(m).includes('gemfibrozil'))) {
        return false;
      }
      return ctx.patient.currentMeds.some((m) => isStatinMed(m) && !hasCkdDrugAllergy(ctx, m.drugId));
    },
    produce: (ctx) => {
      const statinMed = ctx.patient.currentMeds.find(
        (m) => isStatinMed(m) && !hasCkdDrugAllergy(ctx, m.drugId)
      )!;
      const statinId = normalizeDrugId(statinMed.drugId);
      const statinName = medDisplayName(statinMed);
      const currentDoseText = formatCurrentMedDose(statinMed) || 'Duy trì liều đang dung nạp';
      return {
        id: 'rec_ckd_statin_continue_dialysis',
        module: 'ckd',
        tier: 'Bảo vệ tim mạch & Lipid',
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: statinId,
        drugNameVi: statinName,
        dose: currentDoseText,
        title: `Tiếp tục duy trì ${statinName} (${currentDoseText}) trên bệnh nhân lọc máu chu kỳ`,
        rationale:
          'Theo ESC 2026 CVD-CKD và KDIGO 2024: Bệnh nhân ĐÃ đang dùng statin (hoặc statin + ezetimibe) trước khi vào lọc máu được khuyến cáo tiếp tục duy trì để bảo vệ tim mạch.',
        gates: [
          {
            parameter: 'dialysis_statin',
            passed: true,
            messageVi: 'Đã dùng statin trước lọc máu: Khuyến cáo tiếp tục duy trì',
          },
        ],
        citationIds: [
          'esc.2026.ckd.statin_continue_dialysis',
          'esc.lipid.2019.ckd_dialysis_continue',
        ],
        priority: 74,
      };
    },
    citationIds: [
      'esc.2026.ckd.statin_continue_dialysis',
      'esc.lipid.2019.ckd_dialysis_continue',
    ],
  },
];
