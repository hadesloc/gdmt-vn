/**
 * GDMT-VN CKD Module - Inpatient Moderate & Mild Hyperkalemia Management Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - CPS Bowel/HyperCa Contraindication Gate & Modularization)
 * Bao phủ: CKD-R4-R1-02, CKD-R4-R2-06
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  hasCpsContraindication,
  hasHyperkalemicEcg,
  isDriMed,
  isKBinderMed,
  isKSparingOrSteroidalMraMed,
  isRasiOrArniMed,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

export const ckdInpatientHyperkalemiaModerateRules: Rule[] = [
  // 2a. Tăng Kali máu mức độ trung bình nội viện (K+ 6.0 – 6.4 mmol/L, không biến đổi ECG)
  {
    id: 'ckd.inpatient.hyperkalemia_moderate',
    module: 'ckd',
    nameVi: 'Xử trí tăng kali máu trung bình nội trú (K+ 6.0–6.4 mmol/L)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      const ecgChanges = hasHyperkalemicEcg(ctx);
      return (
        k !== undefined &&
        k >= thFor('k', 'ckd.hyperkalemia.moderate_min') &&
        k < thFor('k', 'ckd.hyperkalemia.severe_min') &&
        !ecgChanges
      );
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const modMin = thFor('k', 'ckd.hyperkalemia.moderate_min');
      const modMax = thFor('k', 'ckd.hyperkalemia.moderate_max');
      const insUnits = thFor('dose_units', 'ckd.hyperkalemia.insulin_units');
      const glucGrams = thFor('dose_g', 'ckd.hyperkalemia.glucose_grams');
      const szcDose = thFor('dose_g', 'ckd.hyperkalemia.szc_start_dose');
      const resineMax = thFor('dose_g', 'ckd.hyperkalemia.resine_max_dose');

      const alreadyOnBinder = ctx.patient.currentMeds.some((m) => isKBinderMed(m));
      const isVn = ctx.settings.profile === 'VN';
      const cpsContra = hasCpsContraindication(ctx);
      const binderId =
        isVn && !cpsContra ? 'calcium_polystyrene_sulfonate' : 'sodium_zirconium_cyclosilicate';
      const binderEntry = drug(binderId);
      const binderDoseStr = fmtShortDose(dose(binderId, 'start'));
      const cpsName = drug('calcium_polystyrene_sulfonate').nameVi;

      const cpsContraNote = cpsContra
        ? ` Lưu ý an toàn: Chống chỉ định tuyệt đối ${cpsName} trên bệnh nhân có tắc ruột / liệt ruột / sau phẫu thuật bụng hoặc tăng canxi máu (nguy cơ hoại tử đại tràng theo UKKA 2022 Appendix 3F) — bắt buộc dùng SZC hoặc lợi tiểu quai/lọc máu.`
        : '';

      return {
        id: 'rec_ckd_hyperkalemia_mod',
        module: 'ckd',
        tier: 'CẤP CỨU HỒI SỨC & TĂNG KALI MÁU',
        tierOrder: 0,
        action: 'START',
        drugId: alreadyOnBinder ? undefined : binderId,
        drugNameVi: alreadyOnBinder ? undefined : binderEntry.nameVi,
        dose: alreadyOnBinder ? undefined : binderDoseStr,
        title: `Xử trí Tăng kali máu trung bình nội viện (K⁺ = ${k} mmol/L)`,
        rationale:
          `Theo UKKA 2022 (Khuyến nghị 16.3.2 & 16.6.3): Truyền tĩnh mạch Insulin-Glucose (${insUnits} IU insulin trong ${glucGrams} g glucose) kết hợp chất gắn kali đường uống (${binderId === 'calcium_polystyrene_sulfonate' ? `${cpsName} ${resineMax} g hoặc SZC ${szcDose} g` : `SZC ${szcDose} g x 3 lần/ngày`}) và rà soát tạm ngừng thuốc giữ kali. Theo dõi đường huyết mao mạch trong 6 giờ sau truyền.${cpsContraNote}`,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            threshold: modMin,
            messageVi: `K+ ${k} mmol/L (dải ${modMin}–${modMax}): Tăng kali mức độ trung bình`,
          },
        ],
        profileDiff: {
          INTL: `UKKA 2022: Truyền Insulin-Glucose + ưu tiên SZC ${szcDose} g x 3 lần/ngày (hoặc Patiromer); Calcium Resonium chỉ là lựa chọn thứ yếu khi không có chất gắn thế hệ mới (16.6.3).`,
          US: `FDA / AHA: Truyền Insulin-Glucose + ưu tiên SZC ${szcDose} g x 3 lần/ngày để hạ kali nhanh trong 1–2 giờ.`,
          VN: `BYT 2024: Truyền Insulin-Glucose kết hợp ${cpsContra ? `Lokelma (SZC) ${szcDose} g x 3 lần/ngày (chống chỉ định ${cpsName} khi tắc/liệt ruột hoặc tăng canxi máu)` : `${cpsName} ${resineMax} g x 2–3 lần/ngày uống cách thuốc khác >= 3 giờ (không pha sorbitol, chống chỉ định khi tắc/liệt ruột) hoặc Lokelma ${szcDose} g x 3 lần/ngày`}.`,
        },
        citationIds: [
          'ukka.2022.guideline_16_3_2_insulin_glucose_moderate',
          'ukka.2022.guideline_16_6_3_cps_not_emergency',
          'ukka.2022.appendix_3f_cps_contra_bowel',
          'ukka.2022.guideline_17_2_glucose_monitoring',
          'fda.szc.starting_dose',
          'byt.ckd.2024.potassium_resine_dose',
        ],
        priority: 95,
      };
    },
    citationIds: [
      'ukka.2022.guideline_16_3_2_insulin_glucose_moderate',
      'ukka.2022.guideline_16_6_3_cps_not_emergency',
      'ukka.2022.appendix_3f_cps_contra_bowel',
      'ukka.2022.guideline_17_2_glucose_monitoring',
    ],
  },

  // 2b. Tăng Kali máu mức độ nhẹ nội viện (5.0 < K+ < 6.0 mmol/L, không biến đổi ECG)
  {
    id: 'ckd.inpatient.hyperkalemia_mild',
    module: 'ckd',
    nameVi: 'Xử trí và theo dõi tăng kali máu nhẹ nội trú (5.1–5.9 mmol/L)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      const ecgChanges = hasHyperkalemicEcg(ctx);
      return (
        k !== undefined &&
        k > thFor('k', 'ckd.rasi.k_uptitrate_max') &&
        k < thFor('k', 'ckd.hyperkalemia.moderate_min') &&
        !ecgChanges
      );
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const holdK = thFor('k', 'ckd.rasi.k_hold_threshold');
      const modMin = thFor('k', 'ckd.hyperkalemia.moderate_min');
      const kDef = thFor('k', 'ckd.rasi.k_uptitrate_max');

      const kRetainingMeds = ctx.patient.currentMeds.filter(
        (m) =>
          isRasiOrArniMed(m) ||
          isDriMed(m) ||
          isKSparingOrSteroidalMraMed(m) ||
          normalizeDrugId(m.drugId) === 'finerenone'
      );
      const medListNote =
        kRetainingMeds.length > 0
          ? `Rà soát tạm ngừng/giảm liều thuốc giữ kali đang dùng (${kRetainingMeds.map((m) => medDisplayName(m)).join(', ')})`
          : 'Rà soát loại bỏ dịch truyền chứa kali (Ringer Lactate), NSAID, trimethoprim, heparin';

      const needBinder = k > holdK && !ctx.patient.currentMeds.some((m) => isKBinderMed(m));
      const isVn = ctx.settings.profile === 'VN';
      const cpsContra = hasCpsContraindication(ctx);
      const binderId =
        isVn && !cpsContra ? 'calcium_polystyrene_sulfonate' : 'sodium_zirconium_cyclosilicate';
      const binderEntry = drug(binderId);
      const binderDoseStr = fmtShortDose(dose(binderId, 'start'));

      const titleText = needBinder
        ? `Xử trí tăng kali máu nội viện (K⁺ = ${k} mmol/L): Khởi trị ${binderEntry.nameVi} & rà soát thuốc giữ kali`
        : `Theo dõi & xử trí tăng kali máu nhẹ nội viện (K⁺ = ${k} mmol/L)`;
      const rationaleText =
        `Nồng độ kali máu nội viện K⁺ = ${k} mmol/L (dải > ${kDef} đến < ${modMin} mmol/L, chưa có biến đổi ECG): ` +
        '1. Ghi điện tâm đồ 12 chuyển đạo kiểm tra và xét nghiệm lặp lại K⁺ loại trừ tán huyết giả.\n' +
        `2. ${medListNote}; điều chỉnh toan chuyển hóa hoặc táo bón đi kèm.\n` +
        (needBinder
          ? `3. Do K⁺ > ${holdK} mmol/L, khởi trị chất gắn kali đường tiêu hóa (${binderEntry.nameVi} ${binderDoseStr}) để hạ K⁺ an toàn về <= ${kDef} mmol/L${cpsContra ? ' (tránh Calcium Polystyrene Sulfonate do có tắc/liệt ruột hoặc tăng canxi máu)' : ''}.`
          : '3. Hạn chế kali nhập và theo dõi lại điện giải đồ sau 6–12 giờ.');

      return {
        id: 'rec_ckd_inpatient_hyperkalemia_mild',
        module: 'ckd',
        tier: 'Kiểm soát điện giải nội viện',
        tierOrder: 1,
        action: needBinder ? 'START' : 'MONITOR',
        drugId: needBinder ? binderId : undefined,
        drugNameVi: needBinder ? binderEntry.nameVi : undefined,
        dose: needBinder ? binderDoseStr : undefined,
        title: titleText,
        rationale: rationaleText,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            threshold: kDef,
            messageVi: `K+ ${k} mmol/L (> ${kDef} và < ${modMin} mmol/L): Tăng kali máu mức độ nhẹ–vừa nội trú`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.sec_3_11_hyperkalemia_def_5_0',
          'kdigo.ckd.2024.fig_32_hyperkalemia_5_5',
          'ukka.2022.guideline_8_1_cps_target_5',
          'ukka.2022.appendix_3f_cps_contra_bowel',
          'fda.szc.starting_dose',
          'byt.ckd.2024.potassium_resine_dose',
        ],
        priority: needBinder ? 88 : 80,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.sec_3_11_hyperkalemia_def_5_0',
      'kdigo.ckd.2024.fig_32_hyperkalemia_5_5',
      'ukka.2022.guideline_8_1_cps_target_5',
    ],
  },
];
