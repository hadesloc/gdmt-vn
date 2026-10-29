/** CKD SGLT2i: initiation, continuation and final renal-dose consistency. */
import type { CurrentMed, Rule } from '../../engine/types';
import { withCurrentRenalDoseSafety, sglt2iLabelCitation } from '../../engine/safety/renalDoseAdjustment';
import { hasCondition, need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  extractSglt2iComponentId,
  fmtShortDose,
  formatCurrentMedDose,
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasMetforminComponent,
  isAkiActive,
  isBreastfeedingCkd,
  isChildPughC,
  isOutpatientAcuteCrisis,
  isSglt2iMed,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

function isContinuableSglt2iMed(ctx: Parameters<Rule['when']>[0], med: CurrentMed): boolean {
  if (!isSglt2iMed(med)) return false;
  if (hasCkdDrugAllergy(ctx, med.drugId)) return false;
  if (isBreastfeedingCkd(ctx)) return false;
  const compId = extractSglt2iComponentId(med);
  if (compId === 'canagliflozin' && isChildPughC(ctx)) return false;
  const egfr = need(ctx, 'egfr');
  if (hasMetforminComponent(med) && egfr !== undefined && egfr < thFor('egfr', 'ckd.egfr.g3b_min')) {
    return false;
  }
  return true;
}

export const ckdOutpatientSglt2iRules: Rule[] = [
  // 1. SGLT2i: Khởi trị bảo vệ tim - thận (KDIGO 2024 1A / 2B)
  {
    id: 'ckd.outpatient.sglt2i_initiate',
    module: 'ckd',
    nameVi: 'Khởi trị thuốc ức chế SGLT2 bảo vệ tim - thận',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const egfr = need(ctx, 'egfr');
      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      if (egfr === undefined || egfr < minEgfr) return false;

      if (ctx.patient.currentMeds.some((m) => isContinuableSglt2iMed(ctx, m))) return false;
      if (isBreastfeedingCkd(ctx) && ctx.patient.currentMeds.some((m) => isSglt2iMed(m))) {
        return false;
      }

      const uacr = need(ctx, 'uacr');
      const minUacr = thFor('uacr', 'ckd.sglt2i.uacr_initiate_min_mgmmol');
      const maxIntermEgfr = thFor('egfr', 'ckd.sglt2i.egfr_intermediate_max');

      return (
        hasCondition(ctx, 'dm') ||
        (uacr !== undefined && uacr >= minUacr) ||
        hasCondition(ctx, 'hf') ||
        (egfr >= minEgfr && egfr <= maxIntermEgfr)
      );
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr')!;
      const uacr = need(ctx, 'uacr');
      const sbp = need(ctx, 'sbp');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const hasDiabetes = hasCondition(ctx, 'dm');
      const hasHf = hasCondition(ctx, 'hf');

      if (isBreastfeedingCkd(ctx)) {
        const dapaName = drug('dapagliflozin').nameVi;
        return {
          id: 'rec_ckd_sglt2i_avoid_lactation',
          module: 'ckd',
          tier: 'Cảnh báo an toàn thời kỳ cho con bú',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'dapagliflozin',
          drugNameVi: dapaName,
          dose: undefined,
          title: `TRÁNH khởi trị nhóm SGLT2i (${dapaName}) khi đang cho con bú`,
          rationale:
            'Theo nhãn FDA Farxiga/Jardiance (Section 8.2 Lactation): Không khuyến cáo dùng thuốc ức chế SGLT2 trong thời kỳ cho con bú do nguy cơ ảnh hưởng lên sự trưởng thành ống thận đang phát triển của trẻ nhũ nhi.',
          gates: [
            {
              parameter: 'lactation',
              passed: false,
              messageVi: 'Đang cho con bú: Tránh khởi trị SGLT2i',
            },
          ],
          citationIds: ['fda.dapagliflozin.pregnancy'],
          priority: 95,
        };
      }

      const stoppedFdcSglt2 = ctx.patient.currentMeds.find(
        (m) =>
          isSglt2iMed(m) &&
          hasMetforminComponent(m) &&
          egfr < thFor('egfr', 'ckd.egfr.g3b_min')
      );
      const preferredFromFdc = extractSglt2iComponentId(stoppedFdcSglt2);
      const candidateOrder =
        preferredFromFdc === 'empagliflozin'
          ? (['empagliflozin', 'dapagliflozin'] as const)
          : (['dapagliflozin', 'empagliflozin'] as const);
      const chosenId = candidateOrder.find((id) => !hasCkdDrugAllergy(ctx, id));

      if (!chosenId) {
        const dapaName = drug('dapagliflozin').nameVi;
        return {
          id: 'rec_ckd_sglt2i_avoid_allergy',
          module: 'ckd',
          tier: 'Cảnh báo dị ứng thuốc',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'dapagliflozin',
          drugNameVi: dapaName,
          dose: undefined,
          title: 'CHỐNG CHỈ ĐỊNH khởi trị SGLT2i do tiền sử dị ứng thuốc',
          rationale:
            'Bệnh nhân có tiền sử quá mẫn / dị ứng với các hoạt chất nhóm ức chế SGLT2. Chống chỉ định tái sử dụng; tối ưu các trụ cột bảo vệ thận còn lại (RASi, Finerenone, GLP-1 RA nếu có chỉ định).',
          gates: [
            {
              parameter: 'allergy',
              passed: false,
              messageVi: 'Tiền sử dị ứng nhóm SGLT2i: Chống chỉ định khởi trị',
            },
          ],
          citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d', 'fda.dapagliflozin.ckd_dose'],
          priority: 95,
        };
      }

      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const maxIntermEgfr = thFor('egfr', 'ckd.sglt2i.egfr_intermediate_max');
      const minUacr = thFor('uacr', 'ckd.sglt2i.uacr_initiate_min_mgmmol');
      const minSbp = thFor('sbp', 'ckd.sglt2i.sbp_initiate_min');
      const contrastDeferCutoff = thFor('egfr', 'ckd.contrast.defer_gdmt_egfr_cutoff');

      const contrastPlanned = Boolean(custom?.contrastPlanned);
      const intraArterial =
        Boolean(custom?.contrastRouteIntraArterial) ||
        String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
      const deferForContrast = contrastPlanned && (intraArterial || egfr < contrastDeferCutoff);

      const isClass2BOnly =
        !hasDiabetes &&
        !hasHf &&
        (uacr === undefined || uacr < minUacr) &&
        egfr <= maxIntermEgfr;
      const loeLabel = isClass2BOnly ? '2B (KDIGO 2024)' : '1A (KDIGO 2024)';

      let rationale = `Khuyến cáo nhóm ${loeLabel} giúp làm chậm tiến triển suy thận và giảm tử vong tim mạch.`;
      if (stoppedFdcSglt2) {
        rationale += ` Sau khi ngừng viên phối hợp ${medDisplayName(stoppedFdcSglt2)} (do chống chỉ định thành phần Metformin khi eGFR < ${thFor('egfr', 'ckd.egfr.g3b_min')}), chuyển sang viên đơn chất ${drug(chosenId).nameVi} để tiếp tục bảo vệ tim - thận an toàn.`;
      } else if (chosenId === 'empagliflozin' && hasCkdDrugAllergy(ctx, 'dapagliflozin')) {
        rationale += ' Chọn Empagliflozin thay thế do tiền sử dị ứng Dapagliflozin.';
      } else if (hasDiabetes) {
        rationale += ' Chỉ định ưu tiên trên bệnh nhân ĐTĐ típ 2 có CKD (1A).';
      } else if (hasHf) {
        rationale += ' Bệnh nhân kèm suy tim bất kể mức albumin niệu (1A).';
      } else if (uacr !== undefined && uacr >= minUacr) {
        rationale += ` Bệnh nhân CKD có albumin niệu tăng nặng (ACR >= ${minUacr} mg/mmol) (1A).`;
      } else if (isClass2BOnly) {
        rationale += ` Bệnh nhân CKD có eGFR ${egfr.toFixed(0)} trong khoảng ${minEgfr}–${maxIntermEgfr} mL/phút/1.73m² (2B).`;
      }

      if (isChildPughC(ctx)) {
        rationale += ` Lưu ý suy gan nặng (Child-Pugh C): Thận trọng theo dõi dung nạp ${drug(chosenId).nameVi} (tránh Canagliflozin theo nhãn FDA).`;
      }

      if (deferForContrast) {
        rationale += ` TẠM HOÃN quanh thủ thuật cản quang iod: Chờ 48–72 giờ sau thủ thuật khi xác nhận SCr/eGFR ổn định và đủ thể tích mới khởi trị SGLT2i.`;
      } else if (sbp === undefined) {
        rationale += ' Chưa có số đo Huyết áp tâm thu: Cần đo HA xác nhận huyết động ổn định trước khởi trị (Fail-closed).';
      } else if (sbp < minSbp) {
        rationale += ` Huyết áp tâm thu ${sbp} mmHg < ${minSbp} mmHg: Tạm hoãn khởi trị để tránh tụt huyết áp và giảm thể tích.`;
      }

      const passedEgfr = egfr >= minEgfr;
      const passedSbp = sbp !== undefined && sbp >= minSbp;
      const canStartNow = passedEgfr && passedSbp && !deferForContrast;
      const chosenStart = fmtShortDose(dose(chosenId, 'start'));
      const chosenName = drug(chosenId).nameVi;

      const titleText = canStartNow
        ? `Khởi trị ${chosenName} (${chosenStart})`
        : deferForContrast
          ? `Tạm hoãn khởi trị ${chosenName} đến 48–72 giờ sau thủ thuật cản quang iod`
          : `Tạm hoãn khởi trị ${chosenName}: Cần xác nhận huyết áp tâm thu >= ${minSbp} mmHg`;

      return {
        id: 'rec_ckd_sglt2i_start',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: canStartNow ? 'START' : 'DEFER',
        drugId: chosenId,
        drugNameVi: chosenName,
        dose: canStartNow ? chosenStart : undefined,
        title: titleText,
        rationale,
        gates: [
          {
            parameter: 'eGFR',
            passed: passedEgfr,
            value: egfr,
            threshold: minEgfr,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² ≥ ${minEgfr}: Đủ điều kiện an toàn khởi trị`,
          },
          {
            parameter: 'SBP',
            passed: passedSbp && !deferForContrast,
            value: sbp,
            threshold: minSbp,
            messageVi: deferForContrast
              ? 'Sắp tiêm cản quang iod nguy cơ cao: Tạm hoãn khởi trị mới đến sau thủ thuật 48–72h'
              : passedSbp
                ? `Huyết áp tâm thu ${sbp} mmHg ≥ ${minSbp}: An toàn huyết động`
                : sbp === undefined
                  ? 'Chưa có số đo Huyết áp tâm thu: Không đạt cổng an toàn (Fail-closed)'
                  : `Huyết áp tâm thu ${sbp} mmHg < ${minSbp}: Nguy cơ tụt huyết áp, tạm hoãn`,
          },
        ],
        citationIds: isClass2BOnly
          ? ['kdigo.ckd.2024.rec_3_7_3_sglt2i_egfr_20_45', sglt2iLabelCitation(chosenId)]
          : [
              'kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d',
              'kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf',
              sglt2iLabelCitation(chosenId),
            ],
        benefitsAlso: ['dm2', 'hf'],
        priority: 95,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d',
      'kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf',
    ],
  },

  // 2. SGLT2i: Tiếp tục duy trì khi eGFR >= 20 (chặn FDC chứa Metformin khi eGFR < 30 hoặc toan nặng HCO3- < 12)
  {
    id: 'ckd.outpatient.sglt2i_continue',
    module: 'ckd',
    nameVi: 'Tiếp tục duy trì thuốc ức chế SGLT2 đang dùng',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const egfr = need(ctx, 'egfr');
      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      if (egfr === undefined || egfr < minEgfr) return false;

      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const activeSglt2i = ctx.patient.currentMeds.find((m) => isContinuableSglt2iMed(ctx, m));
      if (!activeSglt2i) return false;
      const intraArterial =
        Boolean(custom?.contrastRouteIntraArterial) ||
        String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
      if (
        Boolean(custom?.contrastPlanned) &&
        hasMetforminComponent(activeSglt2i) &&
        (egfr < thFor('egfr', 'ckd.contrast.egfr_risk_threshold') || intraArterial)
      ) {
        return false;
      }
      return true;
    },
    produce: (ctx) => {
      const activeSglt2i = ctx.patient.currentMeds.find((m) => isContinuableSglt2iMed(ctx, m))!;
      const egfr = need(ctx, 'egfr')!;
      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const sglt2Id = normalizeDrugId(activeSglt2i.drugId);
      const compId = extractSglt2iComponentId(activeSglt2i) ?? 'dapagliflozin';
      const medName = medDisplayName(activeSglt2i);
      const continueDose =
        formatCurrentMedDose(activeSglt2i) || undefined;

      return withCurrentRenalDoseSafety({
        id: 'rec_ckd_sglt2i_continue_standard',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: sglt2Id,
        drugNameVi: medName,
        dose: continueDose,
        title: `Tiếp tục duy trì ${medName}`,
        rationale: `Bệnh nhân đang dung nạp tốt SGLT2i và có eGFR ${egfr.toFixed(0)} mL/phút/1.73m² ≥ ${minEgfr}. Tiếp tục duy trì để bảo tồn chức năng thận và giảm biến cố tim mạch.`,
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: minEgfr,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² ≥ ${minEgfr}: Đủ điều kiện duy trì an toàn`,
          },
        ],
        citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d', sglt2iLabelCitation(compId)],
        benefitsAlso: ['dm2', 'hf'],
        priority: 88,
      }, ctx.patient, ctx.derived);
    },
    citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'],
  },

  // 3. SGLT2i: Duy trì đơn chất khi eGFR giảm dưới 20 (KDIGO 2024 PP 3.7.1 — loại trừ viên phối hợp chứa Metformin)
  {
    id: 'ckd.outpatient.sglt2i_continue_below_20',
    module: 'ckd',
    nameVi: 'Tiếp tục duy trì SGLT2i đơn chất khi eGFR dưới ngưỡng khởi trị mới',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const egfr = need(ctx, 'egfr');
      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      if (egfr === undefined || egfr >= minEgfr || egfr <= 0) return false;

      return ctx.patient.currentMeds.some((m) => isContinuableSglt2iMed(ctx, m));
    },
    produce: (ctx) => {
      const currentMed = ctx.patient.currentMeds.find((m) => isContinuableSglt2iMed(ctx, m))!;
      const egfr = need(ctx, 'egfr')!;
      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const medName = medDisplayName(currentMed);
      const continueDose = formatCurrentMedDose(currentMed) || 'Duy trì liều hiện tại';

      return withCurrentRenalDoseSafety({
        id: 'rec_ckd_sglt2i_continue',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: normalizeDrugId(currentMed.drugId),
        drugNameVi: medName,
        dose: continueDose,
        title: `Tiếp tục duy trì ${medName} dù eGFR < ${minEgfr}`,
        rationale: `Theo KDIGO 2024 (Practice Point 3.7.1): khi đã được khởi trị, tiếp tục duy trì SGLT2i đơn chất ngay cả khi eGFR giảm xuống dưới ${minEgfr} mL/phút/1.73m² cho đến khi bắt đầu lọc máu hoặc ghép thận.`,
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: minEgfr,
            messageVi: `eGFR ${egfr.toFixed(0)} < ${minEgfr}: Cho phép tiếp tục duy trì nếu dung nạp tốt, chưa lọc máu`,
          },
        ],
        citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20', sglt2iLabelCitation(extractSglt2iComponentId(currentMed)!)],
        priority: 85,
      }, ctx.patient, ctx.derived);
    },
    citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20'],
  },

  // 4. Ngừng Canagliflozin (kể cả FDC) khi suy gan nặng Child-Pugh C (FDA Invokana Section 8.7)
  {
    id: 'ckd.outpatient.canagliflozin_hepatic_stop',
    module: 'ckd',
    nameVi: 'Ngừng Canagliflozin ở bệnh nhân suy gan nặng Child-Pugh C',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || !isChildPughC(ctx)) return false;
      return ctx.patient.currentMeds.some(
        (m) => extractSglt2iComponentId(m) === 'canagliflozin'
      );
    },
    produce: (ctx) => {
      const canaMed = ctx.patient.currentMeds.find(
        (m) => extractSglt2iComponentId(m) === 'canagliflozin'
      )!;
      const canaName = medDisplayName(canaMed);
      return {
        id: 'rec_ckd_canagliflozin_stop_hepatic',
        module: 'ckd',
        tier: 'Cảnh báo an toàn gan - thận',
        tierOrder: 0,
        action: 'STOP',
        drugId: normalizeDrugId(canaMed.drugId),
        drugNameVi: canaName,
        dose: undefined,
        title: `NGỪNG / TRÁNH DÙNG ${canaName} ở bệnh nhân suy gan nặng (Child-Pugh C)`,
        rationale:
          'Theo nhãn FDA Invokana (Section 8.7 Hepatic Impairment): Canagliflozin chưa được nghiên cứu ở bệnh nhân suy gan nặng (Child-Pugh C) và không khuyến cáo sử dụng.',
        gates: [
          {
            parameter: 'Child_Pugh',
            passed: false,
            value: 'C',
            messageVi: 'Suy gan nặng Child-Pugh C: Không khuyến cáo sử dụng Canagliflozin',
          },
        ],
        citationIds: ['fda.canagliflozin.hepatic_impairment'],
        priority: 101,
      };
    },
    citationIds: ['fda.canagliflozin.hepatic_impairment'],
  },

  // 5. Ngừng SGLT2i khi bệnh nhân bắt đầu lọc máu định kỳ (KDIGO 2024 PP 3.7.1)
  {
    id: 'ckd.outpatient.sglt2i_stop_dialysis',
    module: 'ckd',
    nameVi: 'Ngừng thuốc ức chế SGLT2 trên bệnh nhân đang lọc máu định kỳ',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      return ctx.patient.currentMeds.some((m) => isSglt2iMed(m) && !hasMetforminComponent(m));
    },
    produce: (ctx) => {
      const sgltMed = ctx.patient.currentMeds.find(
        (m) => isSglt2iMed(m) && !hasMetforminComponent(m)
      )!;
      const sgltId = normalizeDrugId(sgltMed.drugId);
      const sgltName = medDisplayName(sgltMed);

      return {
        id: 'rec_ckd_sglt2i_stop_dialysis',
        module: 'ckd',
        tier: 'Cảnh báo an toàn lọc máu',
        tierOrder: 0,
        action: 'STOP',
        drugId: sgltId,
        drugNameVi: sgltName,
        dose: undefined,
        title: `NGỪNG ${sgltName} khi bệnh nhân đang lọc máu định kỳ / điều trị thay thế thận`,
        rationale:
          'Theo KDIGO 2024 (Practice Point 3.7.1) và nhãn FDA: Thuốc ức chế SGLT2 được tiếp tục duy trì khi eGFR giảm dưới 20 mL/phút/1.73m², nhưng cần ngừng thuốc khi bệnh nhân bắt đầu lọc máu định kỳ.',
        gates: [
          {
            parameter: 'dialysis',
            passed: false,
            messageVi: 'Đang lọc máu định kỳ (HD/PD): Ngừng thuốc ức chế SGLT2 đang dùng',
          },
        ],
        citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20'],
        priority: 102,
      };
    },
    citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20'],
  },
];
