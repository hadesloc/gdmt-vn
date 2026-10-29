/**
 * GDMT-VN CKD Module - Pillar 4: GLP-1 RA (Semaglutide SC) Cardiorenal & Safety Rules
 * Phân quyền: Agent E (Round 4 Remediation & < 20 KB Modularization)
 * Bao phủ: CKD-R4-R2-03/06/08, CKD-R4-R3-09
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import { exendinComponent, glp1ReplacementState } from './helpers.glp1';
import {
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasMtcOrMen2,
  hasPancreatitisHistory,
  isAkiActive,
  isBreastfeedingCkd,
  isDpp4iMed,
  isGlp1RaMed,
  isOutpatientAcuteCrisis,
  isSglt2iMed,
  isTakingHypoglycemiaRiskMed,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

export const ckdOutpatientGlp1raRules: Rule[] = [
  // 1. NGỪNG ngay GLP-1 RA đang dùng nếu có tiền sử MTC / MEN 2 hoặc viêm tụy cấp
  {
    id: 'ckd.outpatient.glp1ra_stop_contra',
    module: 'ckd',
    nameVi: 'Ngừng đồng vận thụ thể GLP-1 khi có tiền sử MTC / MEN 2 hoặc viêm tụy cấp',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (!ctx.patient.currentMeds.some((m) => isGlp1RaMed(m))) return false;
      return hasMtcOrMen2(ctx) || hasPancreatitisHistory(ctx);
    },
    produce: (ctx) => {
      const glpMed = ctx.patient.currentMeds.find((m) => isGlp1RaMed(m))!;
      const glpId = normalizeDrugId(glpMed.drugId);
      const glpName = medDisplayName(glpMed);
      const isMtc = hasMtcOrMen2(ctx);

      if (isMtc) {
        return {
          id: 'rec_ckd_glp1ra_stop_contra',
          module: 'ckd',
          tier: 'Cảnh báo an toàn nghiêm trọng',
          tierOrder: 0,
          action: 'STOP',
          drugId: glpId,
          drugNameVi: glpName,
          dose: undefined,
          title: `NGỪNG NGAY ${glpName}: Chống chỉ định tuyệt đối (Tiền sử MTC hoặc hội chứng MEN 2)`,
          rationale:
            'Theo Cảnh báo hộp đen FDA (Boxed Warning): Chống chỉ định tuyệt đối Semaglutide và các đồng vận thụ thể GLP-1 ở bệnh nhân có tiền sử bản thân hoặc gia đình mắc ung thư biểu mô tuyến giáp thể tủy (MTC) hoặc hội chứng đa u tuyến nội tiết típ 2 (MEN 2). Bắt buộc ngừng thuốc ngay lập tức.',
          gates: [
            {
              parameter: 'MTC_MEN2',
              passed: false,
              messageVi: 'Tiền sử MTC / MEN 2: Bắt buộc ngừng ngay GLP-1 RA',
            },
          ],
          citationIds: ['fda.semaglutide.boxed_warning_mtc'],
          priority: 105,
        };
      }

      return {
        id: 'rec_ckd_glp1ra_stop_contra',
        module: 'ckd',
        tier: 'Cảnh báo an toàn nghiêm trọng',
        tierOrder: 0,
        action: 'STOP',
        drugId: glpId,
        drugNameVi: glpName,
        dose: undefined,
        title: `NGỪNG ${glpName}: Tiền sử hoặc nghi ngờ viêm tụy cấp`,
        rationale:
          'Theo nhãn FDA Ozempic và ADA 2026: Ngừng đồng vận thụ thể GLP-1 và không khởi trị lại ở bệnh nhân có tiền sử hoặc xác nhận viêm tụy cấp; chuyển sang phác đồ hạ đường huyết và bảo vệ thận không thuộc nhóm incretin.',
        gates: [
          {
            parameter: 'Pancreatitis',
            passed: false,
            messageVi: 'Tiền sử viêm tụy cấp: Ngừng và tránh dùng lại GLP-1 RA',
          },
        ],
        citationIds: ['fda.semaglutide.pancreatitis', 'ada.dm2.2026.incretin_pancreatitis'],
        priority: 104,
      };
    },
    citationIds: ['fda.semaglutide.boxed_warning_mtc', 'fda.semaglutide.pancreatitis'],
  },

  // 2. Trụ cột thứ 4: Đồng vận thụ thể GLP-1 (Semaglutide SC) ở ĐTĐ típ 2 + CKD
  {
    id: 'ckd.outpatient.glp1ra_indication',
    module: 'ckd',
    nameVi: 'Chỉ định đồng vận thụ thể GLP-1 (Semaglutide tiêm dưới da) bảo vệ tim - thận ở ĐTĐ típ 2 kèm CKD',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      if (!hasCondition(ctx, 'dm')) return false;
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      if (custom?.diabetesType === 't1dm') return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const currentGlp1 = ctx.patient.currentMeds.filter(isGlp1RaMed);
      if (currentGlp1.length > 0 && !currentGlp1.some(exendinComponent)) return false;

      const egfr = need(ctx, 'egfr');
      const minGlp1Egfr = thFor('egfr', 'ckd.glp1ra.egfr_min');
      if (egfr === undefined || egfr < minGlp1Egfr) return false;

      const uacr = need(ctx, 'uacr');
      const hba1c = need(ctx, 'hba1c');
      const flowMidEgfrMin = thFor('egfr', 'ckd.glp1ra.flow_egfr_mid_min');
      const flowHighEgfrMin = thFor('egfr', 'ckd.glp1ra.flow_egfr_high_min');
      const flowHighEgfrMax = thFor('egfr', 'ckd.glp1ra.flow_egfr_high_max');
      const flowMidUacr = thFor('uacr', 'ckd.glp1ra.flow_uacr_mid_mgmmol');
      const flowHighUacr = thFor('uacr', 'ckd.glp1ra.flow_uacr_high_mgmmol');
      const sglt2InitMin = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const a1Max = thFor('uacr', 'ckd.uacr.a1_max_mgmmol');
      const hba1cTarget = thFor('hba1c', 'ckd.glp1ra.hba1c_target');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');

      const isFlowBandMid =
        egfr >= flowMidEgfrMin &&
        egfr < flowHighEgfrMin &&
        uacr !== undefined &&
        uacr >= flowMidUacr;
      const isFlowBandHigh =
        egfr >= flowHighEgfrMin &&
        egfr <= flowHighEgfrMax &&
        uacr !== undefined &&
        uacr >= flowHighUacr;
      const isG4UnableMetforminAndSglt2i =
        egfr < sglt2InitMin && !ctx.patient.currentMeds.some((m) => isSglt2iMed(m));
      const isG4Albuminuric =
        egfr < flowMidEgfrMin && uacr !== undefined && uacr >= a1Max;

      const isCardiorenalEligible =
        isFlowBandMid || isFlowBandHigh || isG4UnableMetforminAndSglt2i || isG4Albuminuric;
      const hasUnmetGlycemicGoal = hba1c !== undefined && hba1c > hba1cTarget;
      const hasHighAscvdCkdRisk = hasCondition(ctx, 'ascvd') && egfr < g2Min;

      return isCardiorenalEligible || hasUnmetGlycemicGoal || hasHighAscvdCkdRisk;
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr')!;
      const uacr = need(ctx, 'uacr');
      const hba1c = need(ctx, 'hba1c');
      const sbp = need(ctx, 'sbp');
      const semaEntry = drug('semaglutide');

      if (hasMtcOrMen2(ctx)) {
        return {
          id: 'rec_ckd_glp1ra_contra_mtc',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'semaglutide',
          drugNameVi: semaEntry.nameVi,
          dose: undefined,
          title: `CHỐNG CHỈ ĐỊNH ${semaEntry.nameVi} (Tiền sử MTC hoặc hội chứng MEN 2)`,
          rationale:
            'Cảnh báo hộp đen FDA (Boxed Warning): Chống chỉ định tuyệt đối Semaglutide và các đồng vận thụ thể GLP-1 ở người có tiền sử cá nhân/gia đình mắc ung thư biểu mô tuyến giáp thể tủy (MTC) hoặc hội chứng đa u tuyến nội tiết típ 2 (MEN 2).',
          gates: [
            {
              parameter: 'MTC_MEN2',
              passed: false,
              messageVi: 'Tiền sử MTC / MEN 2: Chống chỉ định tuyệt đối GLP-1 RA',
            },
          ],
          citationIds: ['fda.semaglutide.boxed_warning_mtc'],
          priority: 100,
        };
      }

      if (hasPancreatitisHistory(ctx)) {
        return {
          id: 'rec_ckd_glp1ra_contra_pancreatitis',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'semaglutide',
          drugNameVi: semaEntry.nameVi,
          dose: undefined,
          title: `TRÁNH khởi trị ${semaEntry.nameVi} (Tiền sử viêm tụy cấp)`,
          rationale:
            'Theo nhãn FDA Ozempic và ADA 2026: Không khuyến cáo khởi trị Semaglutide ở bệnh nhân có tiền sử viêm tụy cấp do nguy cơ tái phát viêm tụy nặng; ưu tiên lựa chọn liệu pháp hạ đường huyết khác an toàn trên thận.',
          gates: [
            {
              parameter: 'Pancreatitis',
              passed: false,
              messageVi: 'Tiền sử viêm tụy cấp: Tránh sử dụng đồng vận thụ thể GLP-1',
            },
          ],
          citationIds: ['fda.semaglutide.pancreatitis', 'ada.dm2.2026.incretin_pancreatitis'],
          priority: 99,
        };
      }

      if (isBreastfeedingCkd(ctx)) {
        return {
          id: 'rec_ckd_glp1ra_contra_lactation',
          module: 'ckd',
          tier: 'Cảnh báo an toàn thai kỳ & cho con bú',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'semaglutide',
          drugNameVi: semaEntry.nameVi,
          dose: undefined,
          title: `TRÁNH khởi trị ${semaEntry.nameVi} trong thời kỳ đang cho con bú`,
          rationale:
            'Theo ADA 2026 và nhãn FDA: Không khuyến cáo sử dụng đồng vận thụ thể GLP-1 trong thời gian đang cho con bú do thiếu dữ liệu an toàn trên trẻ sơ sinh.',
          gates: [
            {
              parameter: 'lactation',
              passed: false,
              messageVi: 'Đang cho con bú: Không khuyến cáo dùng GLP-1 RA',
            },
          ],
          citationIds: ['ada.dm2.2026.pregnancy_glp1'],
          priority: 98,
        };
      }

      if (hasCkdDrugAllergy(ctx, 'semaglutide')) {
        return {
          id: 'rec_ckd_glp1ra_contra_allergy',
          module: 'ckd',
          tier: 'Cảnh báo an toàn thuốc',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'semaglutide',
          drugNameVi: semaEntry.nameVi,
          dose: undefined,
          title: `CHỐNG CHỈ ĐỊNH ${semaEntry.nameVi} do tiền sử dị ứng / quá mẫn thuốc`,
          rationale:
            'Chống chỉ định khởi trị Semaglutide ở bệnh nhân có tiền sử quá mẫn nghiêm trọng (phản vệ, phù mạch) với hoạt chất hoặc tá dược của thuốc.',
          gates: [
            {
              parameter: 'Allergy',
              passed: false,
              messageVi: 'Dị ứng Semaglutide: Chống chỉ định dùng lại',
            },
          ],
          citationIds: ['fda.semaglutide.boxed_warning_mtc'],
          priority: 98,
        };
      }

      const minGlp1Egfr = thFor('egfr', 'ckd.glp1ra.egfr_min');
      const flowMidEgfrMin = thFor('egfr', 'ckd.glp1ra.flow_egfr_mid_min');
      const flowHighEgfrMin = thFor('egfr', 'ckd.glp1ra.flow_egfr_high_min');
      const flowHighEgfrMax = thFor('egfr', 'ckd.glp1ra.flow_egfr_high_max');
      const flowMidUacr = thFor('uacr', 'ckd.glp1ra.flow_uacr_mid_mgmmol');
      const flowHighUacr = thFor('uacr', 'ckd.glp1ra.flow_uacr_high_mgmmol');
      const sglt2InitMin = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const hba1cTarget = thFor('hba1c', 'ckd.glp1ra.hba1c_target');
      const minSbp = thFor('sbp', 'ckd.sglt2i.sbp_initiate_min');

      const isFlowEligible =
        (egfr >= flowMidEgfrMin && egfr < flowHighEgfrMin && uacr !== undefined && uacr >= flowMidUacr) ||
        (egfr >= flowHighEgfrMin && egfr <= flowHighEgfrMax && uacr !== undefined && uacr >= flowHighUacr);
      const isG4Bridge = egfr < flowMidEgfrMin;
      const hasDpp4i = ctx.patient.currentMeds.some((m) => isDpp4iMed(m));
      const dpp4Med = ctx.patient.currentMeds.find((m) => isDpp4iMed(m));
      const hasHypoRiskMed = isTakingHypoglycemiaRiskMed(ctx);
      const passedSbp = sbp !== undefined && sbp >= minSbp;
      const replacement = glp1ReplacementState(ctx);
      const canProceed = passedSbp && !replacement.blocked;

      const semaStartObj = dose('semaglutide', 'start');
      const semaTargetObj = dose('semaglutide', 'target');
      const startAmount = typeof semaStartObj === 'object' ? semaStartObj.amount : '';
      const targetAmount = typeof semaTargetObj === 'object' ? semaTargetObj.amount : '';
      const semaDoseShort = `${startAmount} mg tiêm dưới da 1 lần/tuần (tăng dần lên liều đích bảo vệ thận ${targetAmount} mg/tuần)`;

      let rationaleText = isFlowEligible
        ? `Theo ESC 2026 CVD-CKD (Bảng 12, Class I, Level A), ADA 2026 (Khuyến cáo 11.7b, Mức A — thử nghiệm FLOW) và KDIGO 2024 (Rec 3.9.1, 1B): Semaglutide tiêm dưới da giảm 24% biến cố thận chính và tử vong tim mạch ở bệnh nhân ĐTĐ típ 2 kèm CKD có albumin niệu (eGFR ${egfr.toFixed(0)} mL/phút/1.73m² >= ${minGlp1Egfr}).`
        : isG4Bridge
          ? `Theo ADA 2026 (Khuyến cáo 11.7b, Mức A) và KDIGO 2024 (Rec 3.9.1, 1B): Ở bệnh nhân ĐTĐ típ 2 kèm CKD G4 (eGFR ${egfr.toFixed(0)} mL/phút/1.73m², dải ${minGlp1Egfr}–<${flowMidEgfrMin}${egfr < sglt2InitMin ? `, không còn đủ ngưỡng khởi trị mới Metformin và SGLT2i < ${sglt2InitMin}` : ''}), khuyến cáo khởi trị GLP-1 RA có lợi ích tim-thận đã chứng minh (${semaEntry.nameVi}, không cần chỉnh liều tới eGFR >= ${minGlp1Egfr}) để làm chậm tiến triển bệnh thận và kiểm soát đường huyết an toàn.`
          : `Theo KDIGO 2024 (Khuyến cáo 3.9.1, 1B), ADA 2026 (Khuyến cáo 11.7b) và Hướng dẫn BYT 2024 (Bảng 45): Khuyến cáo bổ sung đồng vận thụ thể GLP-1 tác dụng kéo dài có lợi ích tim-thận đã chứng minh (${semaEntry.nameVi}) ở bệnh nhân ĐTĐ típ 2 kèm CKD chưa đạt mục tiêu đường huyết cá thể hóa${hba1c !== undefined ? ` (HbA1c hiện tại ${hba1c}% > ${hba1cTarget}%)` : ''} hoặc có bệnh tim mạch xơ vữa.`;

      if (replacement.med || replacement.blocked) {
        rationaleText += replacement.blocked ? ` Tạm hoãn chuyển thuốc: ${replacement.blocked}`
          : ` Xem xét thay ${medDisplayName(replacement.med!)} bằng ${semaEntry.nameVi} vì exenatide/lixisenatide chưa chứng minh lợi ích tim mạch như các lựa chọn được ưu tiên. Đây là thay thế, không dùng đồng thời hai GLP-1. Xác nhận liều cuối, dung nạp, khả năng tiếp cận và thời điểm chuyển với bác sĩ; không quy đổi liều tương đương giữa hai hoạt chất.`;
      }

      if (sbp === undefined) {
        rationaleText += ' Chưa có số đo Huyết áp tâm thu: Tạm hoãn khởi trị cho tới khi xác nhận huyết động ổn định (Fail-closed).';
      } else if (sbp < minSbp) {
        rationaleText += ` Huyết áp tâm thu ${sbp} mmHg < ${minSbp} mmHg: Tạm hoãn khởi trị cho tới khi huyết động ổn định.`;
      }

      if (hasDpp4i && dpp4Med) {
        rationaleText += ` LƯU Ý BẮT BUỘC: Ngừng thuốc ức chế DPP-4 đang dùng (${medDisplayName(dpp4Med)}) khi bắt đầu ${semaEntry.nameVi} do trùng cơ chế incretin không tăng thêm lợi ích.`;
      }

      if (hasHypoRiskMed) {
        rationaleText +=
          ' CẢNH BÁO HẠ ĐƯỜNG HUYẾT (KDIGO 2024 / nhãn FDA): Bệnh nhân đang dùng Sulfonylurea hoặc Insulin — cần chủ động đánh giá giảm liều Sulfonylurea/Insulin và tăng cường theo dõi đường huyết mao mạch khi phối hợp Semaglutide ở nền CKD.';
      }

      const cids = hasDpp4i
        ? [
            'esc.2026.ckd.table_12_semaglutide',
            'ada.2026.soc11.rec_11_7b_glp1ra',
            'ada.2026.soc11.flow_semaglutide',
            'kdigo.ckd.2024.rec_3_9_1_glp1ra_t2d',
            'byt.ckd.2024.table_45_glp1ra_ckd',
            'ada.dm2.2026.no_dpp4_plus_glp1',
          ]
        : [
            'esc.2026.ckd.table_12_semaglutide',
            'ada.2026.soc11.rec_11_7b_glp1ra',
            'ada.2026.soc11.flow_semaglutide',
            'kdigo.ckd.2024.rec_3_9_1_glp1ra_t2d',
            'byt.ckd.2024.table_45_glp1ra_ckd',
            'kdigo.dm2.2022.semaglutide_sc_dosing',
          ];
      if (replacement.med || replacement.blocked) cids.push('kdigo.dm2.2022.glp1_preferred_agents');

      return {
        id: 'rec_ckd_glp1ra_start',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: canProceed ? replacement.med ? 'SWITCH' : 'START' : 'DEFER',
        switchFrom: canProceed ? replacement.med?.drugId : undefined,
        drugId: 'semaglutide',
        drugNameVi: semaEntry.nameVi,
        dose: canProceed ? semaDoseShort : undefined,
        title: canProceed
          ? replacement.med ? `Chuyển ${medDisplayName(replacement.med)} sang ${semaEntry.nameVi} để bảo vệ tim - thận`
            : `Khởi trị ${semaEntry.nameVi} — Trụ cột bảo vệ tim - thận ở ĐTĐ típ 2 kèm CKD`
          : `Tạm hoãn ${replacement.med || replacement.blocked ? 'chuyển sang' : 'khởi trị'} ${semaEntry.nameVi}: ${replacement.blocked ? 'Cần xác minh phác đồ đang dùng' : 'Chờ ổn định huyết động'}`,
        rationale: rationaleText,
        gates: [
          { parameter: 'GLP1_Replacement', passed: !replacement.blocked,
            messageVi: replacement.blocked ?? 'Không phối hợp hai GLP-1; thuốc cũ được thay thế nếu chuyển phác đồ.' },
          {
            parameter: 'eGFR',
            passed: egfr >= minGlp1Egfr,
            value: egfr,
            threshold: minGlp1Egfr,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² >= ${minGlp1Egfr}: Không cần chỉnh liều thận, đủ điều kiện dùng`,
          },
          {
            parameter: 'SBP',
            passed: passedSbp,
            value: sbp,
            threshold: minSbp,
            messageVi: passedSbp
              ? `Huyết áp tâm thu ${sbp} mmHg >= ${minSbp}: Đủ điều kiện huyết động`
              : sbp === undefined
                ? 'Chưa có số đo Huyết áp tâm thu: Không đạt cổng an toàn (Fail-closed)'
                : `Huyết áp tâm thu ${sbp} mmHg < ${minSbp}: Tạm hoãn khởi trị`,
          },
        ],
        profileDiff: {
          INTL: `ESC 2026 (Bảng 12, Class I, Level A) & KDIGO 2024 (1B): Khuyến cáo Semaglutide đích ${targetAmount} mg/tuần bảo vệ tim-thận ở ĐTĐ2 + CKD.`,
          US: 'ADA 2026 SOC 11 (Khuyến cáo 11.7b, Mức A — FLOW): Khuyến cáo GLP-1 RA có lợi ích thận chứng minh để giảm tiến triển bệnh thận và biến cố tim mạch độc lập với HbA1c.',
          VN: `BYT 2024 (Mục 4.1.2 & Bảng 45): Phối hợp GLP-1 RA tác dụng kéo dài bảo vệ tim mạch và giảm tiến triển albumin niệu đại lượng (tới ngưỡng ${minGlp1Egfr} mL/phút/1.73m²).`,
        },
        citationIds: cids,
        benefitsAlso: ['dm2'],
        priority: 87,
      };
    },
    citationIds: [
      'esc.2026.ckd.table_12_semaglutide',
      'ada.2026.soc11.rec_11_7b_glp1ra',
      'kdigo.ckd.2024.rec_3_9_1_glp1ra_t2d',
      'byt.ckd.2024.table_45_glp1ra_ckd',
    ],
  },
];
