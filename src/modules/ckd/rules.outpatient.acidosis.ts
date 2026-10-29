/**
 * GDMT-VN CKD Module - Outpatient & Cross-Setting Metabolic Acidosis Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Multi-daily NaHCO3 ceiling & Severe Acidosis SGLT2i/Metformin HOLD)
 * Bao phủ: CKD-R4-R1-01, CKD-R4-R2-02, CKD-R4-R3-01
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  getAbsoluteMaxDailyDoseMg,
  getDrugSafe,
  getTargetMaxDailyDoseMg,
  hasMetforminComponent,
  isAkiActive,
  isDkaSuspected,
  isOutpatientAcuteCrisis,
  isSglt2iMed,
  medDisplayName,
  normalizeDrugId,
  parseCurrentDailyDoseMg,
} from './helpers';

const ACIDOSIS_MED_SLOTS = [0, 1, 2, 3] as const; // qa-allow: index - chỉ số thuốc SGLT2i/Metformin cần tạm ngừng khi toan nặng

function getAcidosisDangerMeds(ctx: Parameters<Rule['when']>[0]) {
  return ctx.patient.currentMeds.filter((m) => isSglt2iMed(m) || hasMetforminComponent(m));
}

export const ckdOutpatientAcidosisRules: Rule[] = [
  // 1. Chuyển cấp cứu ngoại trú khi Toan chuyển hóa nặng cấp tính (HCO3- < 12 mmol/L)
  {
    id: 'ckd.outpatient.metabolic_acidosis_emergency_refer',
    module: 'ckd',
    nameVi: 'Chuyển cấp cứu nội viện khi toan chuyển hóa nặng cấp tính tại ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const hco3 = need(ctx, 'hco3');
      return (
        hco3 !== undefined &&
        hco3 < thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency')
      );
    },
    produce: (ctx) => {
      const hco3 = need(ctx, 'hco3')!;
      const emergHco3 = thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency');
      const rrtHco3 = thFor('hco3', 'ckd.dialysis.hco3_emergency_max');
      return {
        id: 'rec_ckd_acidosis_emergency_refer',
        module: 'ckd',
        tier: 'CẤP CỨU NGOẠI TRÚ',
        tierOrder: 0,
        action: 'REFER',
        dose: undefined,
        title: `CHUYỂN CẤP CỨU NỘI VIỆN KHẨN: Toan chuyển hóa nặng (HCO₃⁻ = ${hco3} < ${emergHco3} mmol/L)`,
        rationale:
          `Theo Hướng dẫn BYT 2024 (Mục 4.10.3.1) và đồng thuận ADA 2024 Crises (Bảng 2 — ngưỡng toan chuyển hóa/DKA mức độ vừa–nặng khi HCO₃⁻ < ${emergHco3} mmol/L): Bicarbonat huyết thanh ${hco3} mmol/L (< ${emergHco3} mmol/L${hco3 < rrtHco3 ? `, đặc biệt < ${rrtHco3} mmol/L` : ''}) tại phòng khám ngoại trú là tình trạng cấp cứu nội khoa, KHÔNG xử trí đơn thuần bằng viên uống Natri Bicarbonat hay duy trì SGLT2i/Metformin ngoại trú. Bắt buộc chuyển nhập viện ngay để làm khí máu động mạch, khoảng trống anion, ceton/lactat máu, bù kiềm tĩnh mạch hoặc lọc máu cấp cứu.`,
        gates: [
          {
            parameter: 'HCO3',
            passed: false,
            value: hco3,
            threshold: emergHco3,
            messageVi: `HCO3- ${hco3} mmol/L < ${emergHco3}: Toan chuyển hóa nặng cần xử trí nội viện`,
          },
        ],
        citationIds: [
          'byt.ckd.2024.acute_acidosis_iv_bicarb_10',
          'byt.ckd.2024.emergency_acidosis_hco3_8',
          'ada.2024.crises.table_2_dka_severity_12',
        ],
        priority: 100,
      };
    },
    citationIds: [
      'byt.ckd.2024.acute_acidosis_iv_bicarb_10',
      'ada.2024.crises.table_2_dka_severity_12',
    ],
  },

  // 2. Tạm ngừng KHẨN CẤP SGLT2i & Metformin (kể cả viên phối hợp FDC) khi HCO3- < 12 mmol/L hoặc nghi DKA (CKD-R4-R3-01)
  ...ACIDOSIS_MED_SLOTS.map(
    (slotIdx): Rule => ({
      id: `ckd.acidosis.severe_hold_med_${slotIdx}`,
      module: 'ckd',
      nameVi: `Tạm ngừng thuốc nguy cơ toan ceton hoặc toan lactic (vị trí ${slotIdx}) khi toan chuyển hóa nặng`,
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        const hco3 = need(ctx, 'hco3');
        const isSevereAcidosis =
          (hco3 !== undefined && hco3 < thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency')) ||
          isDkaSuspected(ctx);
        if (!isSevereAcidosis) return false;
        const meds = getAcidosisDangerMeds(ctx);
        return slotIdx < meds.length;
      },
      produce: (ctx) => {
        const meds = getAcidosisDangerMeds(ctx);
        const targetMed = meds[slotIdx];
        if (!targetMed) return null;

        const hco3 = need(ctx, 'hco3');
        const emergHco3 = thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency');
        const medName = medDisplayName(targetMed);
        const normId = normalizeDrugId(targetMed.drugId);
        const hasSglt2 = isSglt2iMed(targetMed);
        const hasMet = hasMetforminComponent(targetMed);

        const hazardLabel =
          hasSglt2 && hasMet
            ? 'nhiễm toan ceton đẳng đường (euglycemic DKA) và nhiễm toan lactic (MALA)'
            : hasSglt2
              ? 'nhiễm toan ceton đẳng đường do SGLT2i (euglycemic DKA)'
              : 'nhiễm toan lactic liên quan Metformin (MALA)';

        return {
          id: `rec_ckd_acidosis_hold_${normId}_${slotIdx}`,
          module: 'ckd',
          tier: 'Cảnh báo an toàn khẩn cấp',
          tierOrder: 0,
          action: 'HOLD',
          drugId: normId,
          drugNameVi: medName,
          dose: undefined,
          title: `TẠM NGỪNG NGAY ${medName} do toan chuyển hóa nặng${hco3 !== undefined ? ` (HCO₃⁻ = ${hco3} < ${emergHco3} mmol/L)` : ''} — loại trừ ${hazardLabel}`,
          rationale:
            `Theo KDIGO 2024 (Practice Point 3.7.2), ADA 2024 Crises (Bảng 2 — ngưỡng DKA khi HCO₃⁻ < ${emergHco3} mmol/L) và cảnh báo an toàn FDA: Ở bệnh nhân đang toan chuyển hóa nặng${hco3 !== undefined ? ` (HCO₃⁻ = ${hco3} mmol/L)` : ''}, bắt buộc TẠM NGỪNG NGAY ${medName} và xét nghiệm khẩn cấp khí máu động mạch, khoảng trống anion, ceton máu (beta-hydroxybutyrate) và lactat máu để loại trừ ${hazardLabel}. Tuyệt đối không tiếp tục dùng thuốc cho tới khi tình trạng toan chuyển hóa được giải quyết hoàn toàn và chức năng thận ổn định.`,
          gates: [
            {
              parameter: 'HCO3',
              passed: false,
              value: hco3,
              threshold: emergHco3,
              messageVi: `Toan chuyển hóa nặng: Bắt buộc tạm ngừng ${medName} để loại trừ euglycemic DKA / MALA`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
            'ada.2024.crises.table_2_dka_severity_12',
            ...(hasMet ? ['fda.metformin.contra_renal_acidosis'] : []),
          ],
          priority: 99,
        };
      },
      citationIds: [
        'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
        'ada.2024.crises.table_2_dka_severity_12',
      ],
    })
  ),

  // 3. Kiểm soát toan chuyển hóa mạn tính ngoại trú (12 <= HCO3- < 18 mmol/L): Kiểm tra trần liều NaHCO3 (CKD-R4-R1-01)
  {
    id: 'ckd.outpatient.metabolic_acidosis',
    module: 'ckd',
    nameVi: 'Kiểm soát toan chuyển hóa mạn tính bằng Natri Bicarbonat đường uống',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      const hco3 = need(ctx, 'hco3');
      return (
        hco3 !== undefined &&
        hco3 >= thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency') &&
        hco3 < thFor('hco3', 'ckd.acidosis.hco3_min')
      );
    },
    produce: (ctx) => {
      const hco3 = need(ctx, 'hco3')!;
      const minHco3 = thFor('hco3', 'ckd.acidosis.hco3_min');
      const targetMinHco3 = thFor('hco3', 'ckd.acidosis.hco3_target_min');
      const targetMaxHco3 = thFor('hco3', 'ckd.acidosis.hco3_target_max');
      const bicarbEntry = getDrugSafe('sodium_bicarbonate');
      const bicarbName = drug('sodium_bicarbonate').nameVi;
      const activeBicarb = ctx.patient.currentMeds.find((m) =>
        normalizeDrugId(m.drugId).includes('bicarbonate')
      );
      const currentBicarbMg = parseCurrentDailyDoseMg(activeBicarb);
      const targetBicarbMg = getTargetMaxDailyDoseMg(bicarbEntry);
      const maxBicarbMg = getAbsoluteMaxDailyDoseMg(bicarbEntry);

      if (
        activeBicarb &&
        currentBicarbMg !== undefined &&
        maxBicarbMg !== undefined &&
        currentBicarbMg >= maxBicarbMg
      ) {
        const currentDoseLabel = `${currentBicarbMg} mg/ngày`;
        return {
          id: 'rec_ckd_acidosis_bicarb',
          module: 'ckd',
          tier: 'Kiểm soát biến chứng & Toan kiềm',
          tierOrder: 2,
          action: 'MONITOR',
          drugId: 'sodium_bicarbonate',
          drugNameVi: bicarbName,
          dose: currentDoseLabel,
          title: `Toan chuyển hóa dai dẳng (HCO₃⁻ = ${hco3} mmol/L) dù đã dùng tối đa ${bicarbName} (${currentDoseLabel}): Rà soát tuân thủ & hội chẩn chuyên khoa`,
          rationale:
            `Bệnh nhân đã dùng ${bicarbName} đạt trần liều uống thông thường (${currentDoseLabel}, tối đa ${maxBicarbMg} mg/ngày theo BYT 2024) nhưng HCO₃⁻ vẫn ${hco3} < ${minHco3} mmol/L. Không tăng liều mù quáng để tránh quá tải natri, phù và tăng huyết áp; cần đánh giá tuân thủ thuốc, lượng acid nhập từ đạm động vật, loại trừ mất bicarbonat qua tiêu hóa/ống thận và hội chẩn chuyên khoa Thận học.`,
          gates: [
            {
              parameter: 'HCO3',
              passed: false,
              value: hco3,
              threshold: minHco3,
              messageVi: `HCO3- ${hco3} mmol/L < ${minHco3} dù đã đạt trần ${maxBicarbMg} mg/ngày: Đánh giá nguyên nhân kháng trị & gánh nặng natri`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
            'kdigo.ckd.2024.pp_3_10_2_acidosis_upper_limit',
            'byt.ckd.2024.acidosis_bicarbonate_oral_dose',
          ],
          priority: 75,
        };
      }

      const isAboveStdTarget =
        activeBicarb !== undefined &&
        currentBicarbMg !== undefined &&
        targetBicarbMg !== undefined &&
        currentBicarbMg >= targetBicarbMg &&
        maxBicarbMg !== undefined;

      const action = activeBicarb ? 'UPTITRATE' : 'START';
      const bicarbDose = isAboveStdTarget
        ? `tối đa ${maxBicarbMg} mg/ngày chia nhiều lần`
        : activeBicarb
          ? fmtShortDose(dose('sodium_bicarbonate', 'target'))
          : fmtShortDose(dose('sodium_bicarbonate', 'start'));

      return {
        id: 'rec_ckd_acidosis_bicarb',
        module: 'ckd',
        tier: 'Kiểm soát biến chứng & Toan kiềm',
        tierOrder: 2,
        action,
        drugId: 'sodium_bicarbonate',
        drugNameVi: bicarbName,
        dose: bicarbDose,
        title: `${activeBicarb ? 'Tăng liều' : 'Khởi trị'} ${bicarbName} (${bicarbDose})`,
        rationale: `Bicarbonat huyết thanh ${hco3} mmol/L < ${minHco3}: Theo KDIGO 2024 (PP 3.10.1–3.10.2) và BYT 2024 (Mục 3.2), cần bổ sung natri bicarbonat đường uống để phòng ngừa dị hóa cơ, loãng xương và làm chậm suy giảm chức năng thận. Mục tiêu duy trì HCO₃⁻ đạt ≥ ${targetMinHco3} mmol/L và không vượt quá giới hạn trên bình thường (${targetMaxHco3} mmol/L); theo dõi sát huyết áp và phù.`,
        gates: [
          {
            parameter: 'HCO3',
            passed: true,
            value: hco3,
            threshold: minHco3,
            messageVi: `HCO3- ${hco3} mmol/L < ${minHco3}: Có chỉ định bù kiềm đường uống`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
          'kdigo.ckd.2024.pp_3_10_2_acidosis_upper_limit',
          'byt.ckd.2024.acidosis_bicarbonate_target',
          'byt.ckd.2024.acidosis_bicarbonate_oral_dose',
        ],
        priority: 75,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
      'byt.ckd.2024.acidosis_bicarbonate_target',
    ],
  },

  // 4. Tạm ngừng / Giảm liều Natri Bicarbonat khi HCO3- vượt giới hạn trên (> 26 mmol/L)
  {
    id: 'ckd.outpatient.metabolic_alkalosis_hold_bicarb',
    module: 'ckd',
    nameVi: 'Tạm ngừng hoặc giảm liều Natri Bicarbonat khi Bicarbonat vượt giới hạn trên bình thường',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const hco3 = need(ctx, 'hco3');
      if (hco3 === undefined || hco3 <= thFor('hco3', 'ckd.acidosis.hco3_target_max')) {
        return false;
      }
      return ctx.patient.currentMeds.some((m) =>
        normalizeDrugId(m.drugId).includes('bicarbonate')
      );
    },
    produce: (ctx) => {
      const hco3 = need(ctx, 'hco3')!;
      const maxHco3 = thFor('hco3', 'ckd.acidosis.hco3_target_max');
      const bicarbMed = ctx.patient.currentMeds.find((m) =>
        normalizeDrugId(m.drugId).includes('bicarbonate')
      )!;
      const bicarbName = medDisplayName(bicarbMed);
      return {
        id: 'rec_ckd_hold_bicarb_alkalosis',
        module: 'ckd',
        tier: 'Kiểm soát biến chứng & Toan kiềm',
        tierOrder: 1,
        action: 'HOLD',
        drugId: 'sodium_bicarbonate',
        drugNameVi: bicarbName,
        dose: undefined,
        title: `TẠM NGỪNG / GIẢM LIỀU ${bicarbName} do HCO₃⁻ = ${hco3} > ${maxHco3} mmol/L (Nguy cơ kiềm chuyển hóa)`,
        rationale:
          `Theo KDIGO 2024 (Practice Point 3.10.2 & Bảng 23): Điều trị kiềm hóa bằng ${bicarbName} cần tránh làm tăng HCO₃⁻ huyết thanh vượt quá giới hạn trên bình thường (${maxHco3} mmol/L) do nguy cơ nhiễm kiềm chuyển hóa, quá tải natri/thể tích và thúc đẩy vôi hóa mạch máu.`,
        gates: [
          {
            parameter: 'HCO3',
            passed: false,
            value: hco3,
            threshold: maxHco3,
            messageVi: `HCO3- ${hco3} mmol/L > ${maxHco3}: Vượt giới hạn trên bình thường, tạm ngừng/giảm liều bù kiềm`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.pp_3_10_2_acidosis_upper_limit',
          'kdigo.ckd.2024.table_23_bicarbonate_normal',
        ],
        priority: 92,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_10_2_acidosis_upper_limit',
      'kdigo.ckd.2024.table_23_bicarbonate_normal',
    ],
  },
];
