/**
 * GDMT-VN CKD Module - Inpatient Metabolic Acidosis Management Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Closes Inpatient HCO3- 8.0–17.9 mmol/L Gap)
 * Bao phủ: CKD-R4-R3-01
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  hasCkdFlag,
  isAkiActive,
  normalizeDrugId,
} from './helpers';

export const ckdInpatientAcidosisRules: Rule[] = [
  // Kiểm soát toan chuyển hóa nội viện (HCO3- < 18 mmol/L): Lấp khoảng trống HCO3- 8.0–17.9 mmol/L nội viện (CKD-R4-R3-01)
  {
    id: 'ckd.inpatient.metabolic_acidosis',
    module: 'ckd',
    nameVi: 'Xử trí và bù kiềm toan chuyển hóa nội viện theo mức độ Bicarbonat huyết thanh',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const hco3 = need(ctx, 'hco3');
      return hco3 !== undefined && hco3 < thFor('hco3', 'ckd.acidosis.hco3_min');
    },
    produce: (ctx) => {
      const hco3 = need(ctx, 'hco3')!;
      const minHco3 = thFor('hco3', 'ckd.acidosis.hco3_min');
      const emergHco3 = thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency');
      const ivBicarbMax = thFor('hco3', 'ckd.acidosis.hco3_iv_bicarb_max');
      const rrtHco3 = thFor('hco3', 'ckd.dialysis.hco3_emergency_max');
      const targetMinHco3 = thFor('hco3', 'ckd.acidosis.hco3_target_min');
      const targetMaxHco3 = thFor('hco3', 'ckd.acidosis.hco3_target_max');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const hasCongestion =
        hasCondition(ctx, 'acutePulmonaryEdema') ||
        Boolean(custom?.refractoryPulmonaryEdema) ||
        Boolean(custom?.volumeOverload);

      if (hco3 < emergHco3) {
        const needIvNow = hco3 <= ivBicarbMax;
        return {
          id: 'rec_ckd_inpatient_acidosis_severe',
          module: 'ckd',
          tier: 'Cấp cứu & Rối loạn toan kiềm nội viện',
          tierOrder: 0,
          action: needIvNow ? 'START' : 'CONSIDER',
          dose: undefined,
          title: `Xử trí toan chuyển hóa nặng nội viện (HCO₃⁻ = ${hco3} < ${emergHco3} mmol/L): Khí máu động mạch, tìm nguyên nhân & cân nhắc truyền Natri Bicarbonat đẳng trương`,
          rationale:
            'Theo Hướng dẫn BYT 2024 (Mục 4.10.3.1) và KDIGO 2024:\n' +
            '1. Chẩn đoán khẩn nguyên nhân: Làm ngay khí máu động mạch (pH, PaCO₂), khoảng trống anion (anion gap), lactat máu và ceton máu (loại trừ sốc nhiễm trùng, toan lactic, DKA đẳng đường, ngộ độc hoặc suy thận cấp nặng).\n' +
            `2. Bù kiềm tĩnh mạch có kiểm soát: ${needIvNow ? `Do HCO₃⁻ = ${hco3} <= ${ivBicarbMax} mmol/L` : `Nếu pH máu động mạch giảm nặng hoặc HCO₃⁻ giảm xuống <= ${ivBicarbMax} mmol/L`}, cân nhắc truyền tĩnh mạch dung dịch Natri Bicarbonat đẳng trương (tránh quá tải thể tích, hạ kali máu và hạ canxi ion hóa máu)${hasCongestion || hco3 < rrtHco3 ? `; lưu ý bệnh nhân có ${hco3 < rrtHco3 ? `HCO₃⁻ < ${rrtHco3} mmol/L` : 'quá tải tuần hoàn'} nên cần hội chẩn lọc máu cấp cứu sớm` : ''}.`,
          gates: [
            {
              parameter: 'HCO3',
              passed: true,
              value: hco3,
              threshold: emergHco3,
              messageVi: `HCO3- ${hco3} mmol/L < ${emergHco3} nội viện: Đánh giá khí máu động mạch, lactat/ceton và bù kiềm tĩnh mạch`,
            },
          ],
          citationIds: [
            'byt.ckd.2024.acute_acidosis_iv_bicarb_10',
            'byt.ckd.2024.emergency_acidosis_hco3_8',
            'ada.2024.crises.table_2_dka_severity_12',
          ],
          priority: 94,
        };
      }

      if (isAkiActive(ctx) || hasCongestion || hasCkdFlag(ctx, 'onDialysis')) {
        return {
          id: 'rec_ckd_inpatient_acidosis_moderate',
          module: 'ckd',
          tier: 'Kiểm soát biến chứng & Toan kiềm nội viện',
          tierOrder: 2,
          action: 'MONITOR',
          dose: undefined,
          title: `Theo dõi toan chuyển hóa mức độ vừa nội viện (HCO₃⁻ = ${hco3} mmol/L): Ưu tiên điều trị nguyên nhân & kiểm soát thể tích`,
          rationale:
            `Bicarbonat huyết thanh nội viện HCO₃⁻ = ${hco3} mmol/L (${emergHco3}–<${minHco3} mmol/L) trên bệnh nhân ${hasCkdFlag(ctx, 'onDialysis') ? 'đang lọc máu' : isAkiActive(ctx) ? 'đang trong đợt cấp AKI' : 'có quá tải thể tích tuần hoàn'}. Ưu tiên kiểm tra khí máu/khoảng trống anion, điều trị nguyên nhân nền và cân bằng dịch-điện giải; chỉ khởi trị hoặc duy trì Natri Bicarbonat uống (${targetMinHco3}–${targetMaxHco3} mmol/L) khi bệnh nhân uống được và không có quá tải natri/phù phổi.`,
          gates: [
            {
              parameter: 'HCO3',
              passed: true,
              value: hco3,
              threshold: minHco3,
              messageVi: `HCO3- ${hco3} mmol/L < ${minHco3} trong bệnh cảnh nội viện/AKI: Cá thể hóa bù kiềm theo thể tích tuần hoàn`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
            'byt.ckd.2024.acidosis_bicarbonate_target',
          ],
          priority: 74,
        };
      }

      const bicarbName = drug('sodium_bicarbonate').nameVi;
      const bicarbStart = fmtShortDose(dose('sodium_bicarbonate', 'start'));
      const activeBicarb = ctx.patient.currentMeds.find((m) =>
        normalizeDrugId(m.drugId).includes('bicarbonate')
      );

      return {
        id: 'rec_ckd_inpatient_acidosis_moderate',
        module: 'ckd',
        tier: 'Kiểm soát biến chứng & Toan kiềm nội viện',
        tierOrder: 2,
        action: activeBicarb ? 'CONTINUE' : 'CONSIDER',
        drugId: 'sodium_bicarbonate',
        drugNameVi: bicarbName,
        dose: activeBicarb ? undefined : bicarbStart,
        title: activeBicarb
          ? `Theo dõi đáp ứng ${bicarbName} nội viện (HCO₃⁻ = ${hco3} mmol/L)`
          : `Cân nhắc bù kiềm đường uống ${bicarbName} (${bicarbStart}) khi ổn định nội viện (HCO₃⁻ = ${hco3} < ${minHco3} mmol/L)`,
        rationale:
          `Theo KDIGO 2024 (PP 3.10.1–3.10.2) và BYT 2024 (Mục 3.2): Sau khi loại trừ toan tăng khoảng trống anion cấp tính (lactat, ceton) và xác nhận bệnh nhân uống được, không quá tải dịch, cân nhắc bổ sung ${bicarbName} đường uống hướng tới mục tiêu HCO₃⁻ ${targetMinHco3}–${targetMaxHco3} mmol/L.`,
        gates: [
          {
            parameter: 'HCO3',
            passed: true,
            value: hco3,
            threshold: minHco3,
            messageVi: `HCO3- ${hco3} mmol/L (${emergHco3}–<${minHco3} mmol/L): Đánh giá nguyên nhân và cân nhắc bù kiềm uống`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
          'kdigo.ckd.2024.pp_3_10_2_acidosis_upper_limit',
          'byt.ckd.2024.acidosis_bicarbonate_target',
          'byt.ckd.2024.acidosis_bicarbonate_oral_dose',
        ],
        priority: 74,
      };
    },
    citationIds: [
      'byt.ckd.2024.acute_acidosis_iv_bicarb_10',
      'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
      'byt.ckd.2024.acidosis_bicarbonate_target',
    ],
  },
];
