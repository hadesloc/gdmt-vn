/**
 * GDMT-VN CKD Module - Inpatient Severe Hyperkalemia Emergency & ECG Verification Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - UKKA 2022 K+ Verification Gate & Step 1 IV Calcium ECG Gate)
 * Bao phủ: CKD-R4-R1-02
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  hasHyperkalemicEcg,
  isKBinderMed,
} from './helpers';

export const ckdInpatientHyperkalemiaRules: Rule[] = [
  // 0a. Biến đổi ECG nghi tăng kali nhưng CHƯA có kết quả K+ máu: Bắt buộc xét nghiệm POC khí máu khẩn (CKD-R4-R1-02)
  {
    id: 'ckd.inpatient.hyperkalemia_ecg_missing_k',
    module: 'ckd',
    nameVi: 'Xác nhận khẩn cấp K+ khí máu tại chỗ (POC) khi có biến đổi ECG nhưng chưa có K+ máu',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => hasHyperkalemicEcg(ctx) && need(ctx, 'k') === undefined,
    produce: () => ({
      id: 'rec_ckd_hyperkalemia_ecg_missing_k',
      module: 'ckd',
      tier: 'CẤP CỨU HỒI SỨC & TĂNG KALI MÁU',
      tierOrder: 0,
      action: 'DEFER',
      dose: undefined,
      title: 'CẢNH BÁO AN TOÀN: Có biến đổi ECG nghi tăng kali nhưng CHƯA CÓ K⁺ — Xét nghiệm nhanh K⁺ khí máu tại chỗ (POC) trước khi truyền Insulin-Glucose/Salbutamol',
      rationale:
        'Theo UKKA 2022 (Guideline 15.2, 1B): Khi nghi ngờ tăng kali máu trên điện tâm đồ nhưng chưa có trị số K⁺ huyết thanh, bắt buộc lấy mẫu xét nghiệm K⁺ trên máy khí máu tại chỗ (point-of-care blood gas analyzer — có kết quả trong vài phút) song song với mẫu tĩnh mạch phòng xét nghiệm để xác nhận tăng kali thực sự và loại trừ sóng T tối cấp do nhồi máu cơ tim cấp (STEMI) TRƯỚC KHI truyền Insulin-Glucose, khí dung Salbutamol hoặc cho uống SZC (tránh gây hạ kali máu nặng do thầy thuốc nếu K⁺ nền bình thường/thấp). Mắc monitor điện tim liên tục và chuẩn bị sẵn phương tiện cấp cứu tại giường.',
      gates: [
        {
          parameter: 'K+',
          passed: false,
          messageVi: 'Thiếu xét nghiệm K+: Bắt buộc đo nhanh K+ trên máy khí máu tại chỗ (UKKA 2022 15.2) trước khi dùng thuốc hạ kali',
        },
      ],
      citationIds: [
        'ukka.2022.guideline_15_2_poc_blood_gas',
        'ukka.2022.guideline_16_2_calcium_salts',
      ],
      priority: 99,
    }),
    citationIds: ['ukka.2022.guideline_15_2_poc_blood_gas'],
  },

  // 0b. Có cờ biến đổi ECG nhưng K+ máu xác nhận KHÔNG tăng (<= 5.0 mmol/L): Cảnh báo chẩn đoán phân biệt STEMI (CKD-R4-R1-02)
  {
    id: 'ckd.inpatient.hyperkalemia_ecg_normokalemia_alert',
    module: 'ckd',
    nameVi: 'Cảnh báo chẩn đoán phân biệt ECG khi Kali máu không tăng',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      return (
        hasHyperkalemicEcg(ctx) &&
        k !== undefined &&
        k <= thFor('k', 'ckd.rasi.k_uptitrate_max')
      );
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const kNormMax = thFor('k', 'ckd.rasi.k_uptitrate_max');
      return {
        id: 'rec_ckd_hyperkalemia_ecg_normokalemia_alert',
        module: 'ckd',
        tier: 'CẤP CỨU HỒI SỨC & CHẨN ĐOÁN PHÂN BIỆT ECG',
        tierOrder: 0,
        action: 'MONITOR',
        dose: undefined,
        title: `CẢNH BÁO AN TOÀN: K⁺ = ${k} mmol/L KHÔNG TĂNG (<= ${kNormMax} mmol/L) — TUYỆT ĐỐI KHÔNG dùng phác đồ hạ kali, loại trừ khẩn STEMI`,
        rationale:
          `Trị số kali máu K⁺ = ${k} mmol/L (<= ${kNormMax} mmol/L) bác bỏ tăng kali máu thực sự. TUYỆT ĐỐI KHÔNG tiêm Calcium Gluconate, KHÔNG truyền Insulin-Glucose, Salbutamol hay thuốc gắn kali (nguy cơ gây hạ kali máu cấp đe dọa rung thất). Cần:\n` +
          '1. Đánh giá khẩn cấp hội chứng vành cấp / sóng T tối cấp của nhồi máu cơ tim cấp (STEMI / hội chứng De Winter), blốc nhánh, hội chứng Brugada hoặc phì đại thất trái (xét nghiệm Troponin độ nhạy cao, đo lặp lại ECG 12 chuyển đạo).\n' +
          '2. Nếu nghi ngờ mẫu máu bị hòa loãng dịch truyền, đối chiếu ngay bằng K⁺ trên máy khí máu tại chỗ (UKKA 2022 Guideline 15.2).',
        gates: [
          {
            parameter: 'K+',
            passed: false,
            value: k,
            threshold: kNormMax,
            messageVi: `K+ = ${k} <= ${kNormMax} mmol/L: Không phải tăng kali máu — chống chỉ định dùng thuốc hạ kali`,
          },
        ],
        citationIds: [
          'ukka.2022.guideline_15_2_poc_blood_gas',
          'kdigo.ckd.2024.sec_3_11_hyperkalemia_def_5_0',
        ],
        priority: 98,
      };
    },
    citationIds: [
      'ukka.2022.guideline_15_2_poc_blood_gas',
      'kdigo.ckd.2024.sec_3_11_hyperkalemia_def_5_0',
    ],
  },

  // 1a. Tăng Kali cấp cứu mức độ nặng (K+ >= 6.5 mmol/L HOẶC K+ > 5.0 mmol/L kèm biến đổi ECG) (UKKA 2022 & BYT 2024)
  {
    id: 'ckd.inpatient.hyperkalemia_severe',
    module: 'ckd',
    nameVi: 'Cấp cứu tăng kali máu nặng theo phác đồ 5 bước UKKA 2022',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      if (k === undefined) return false;
      const ecgChanges = hasHyperkalemicEcg(ctx);
      return (
        k >= thFor('k', 'ckd.hyperkalemia.severe_min') ||
        (ecgChanges && k > thFor('k', 'ckd.rasi.k_uptitrate_max'))
      );
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const ecgChanges = hasHyperkalemicEcg(ctx);
      const isVn = ctx.settings.profile === 'VN';

      const severeMin = thFor('k', 'ckd.hyperkalemia.severe_min');
      const bytCaMin = thFor('k', 'ckd.hyperkalemia.byt_calcium_k_min');
      const caDose = thFor('dose_mmol', 'ckd.hyperkalemia.calcium_gluconate_dose');
      const insUnits = thFor('dose_units', 'ckd.hyperkalemia.insulin_units');
      const glucGrams = thFor('dose_g', 'ckd.hyperkalemia.glucose_grams');
      const salbMin = thFor('dose_mg', 'ckd.hyperkalemia.salbutamol_min');
      const salbMax = thFor('dose_mg', 'ckd.hyperkalemia.salbutamol_max');
      const szcDose = thFor('dose_g', 'ckd.hyperkalemia.szc_start_dose');

      const giveIvCalciumNow = ecgChanges || (isVn && k > bytCaMin);
      const step1Text = giveIvCalciumNow
        ? `1. Bảo vệ màng cơ tim NGAY: Tiêm TM chậm Calcium Gluconate 10% 30 mL (tương đương ${caDose} mmol Ca²⁺) trong 5–10 phút${ecgChanges ? ' do có biến đổi ECG độc tính tim (UKKA 2022 16.2)' : ` do K⁺ > ${bytCaMin} mmol/L (BYT 2024)`}; truyền chậm thận trọng dưới monitor ECG nếu bệnh nhân đang dùng Digoxin.`
        : `1. Đánh giá ECG 12 chuyển đạo & Monitor điện tim liên tục (UKKA 2022 Guideline 16.2): Hiện CHƯA có biến đổi ECG độc tính tim nên KHÔNG tiêm thường quy Canxi tĩnh mạch ngay${isVn ? ` (BYT 2024 chỉ định khi có biến đổi ECG hoặc K⁺ > ${bytCaMin} mmol/L)` : ''}; chuẩn bị sẵn tại giường và tiêm ngay Calcium Gluconate 10% 30 mL (${caDose} mmol Ca²⁺) trong 5–10 phút nếu xuất hiện sóng T cao nhọn, mất P hoặc QRS giãn rộng.`;

      const titleText = `CẤP CỨU TĂNG KALI MÁU NẶNG (K⁺ = ${k} mmol/L${ecgChanges ? ' + Biến đổi ECG' : ''})`;
      const rationale =
        'Theo Hướng dẫn UKKA 2022 (Khuyến cáo 16.1–16.6.1) và BYT 2024: Xử trí cấp cứu theo trình tự 5 bước:\n' +
        `${step1Text}\n` +
        `2. Chuyển kali vào tế bào: Truyền tĩnh mạch Insulin tác dụng nhanh ${insUnits} IU pha trong ${glucGrams} g Glucose (125 mL Glucose 20%) trong 15–30 phút.\n` +
        `3. Hỗ trợ chuyển kali: Khí dung Salbutamol ${salbMin}–${salbMax} mg.\n` +
        '4. Theo dõi đường huyết mao mạch: Lúc 0, 15, 30, 60, 90, 120, 180, 240, 360 phút để phòng hạ đường huyết.\n' +
        `5. Đào thải kali: Khởi trị chất gắn kali khởi phát nhanh (SZC ${szcDose} g x 3 lần/ngày theo UKKA 16.6.1) và hội chẩn khẩn Thận nhân tạo / Hồi sức tích cực để lọc máu cấp cứu nếu đang lọc máu chu kỳ, vô niệu hoặc kháng trị nội khoa (UKKA 18.1 & 19.6).`;

      const gateMsg =
        k >= severeMin
          ? `K+ ${k} mmol/L >= ${severeMin}: Nguy cơ rung thất và vô tâm thu`
          : `K+ ${k} mmol/L kèm biến đổi ECG độc tính tim cấp cứu: Bắt buộc tiêm Canxi tĩnh mạch bảo vệ cơ tim ngay dù K+ < ${severeMin}`;

      return {
        id: 'rec_ckd_hyperkalemia_severe_bundle',
        module: 'ckd',
        tier: 'CẤP CỨU HỒI SỨC & TĂNG KALI MÁU',
        tierOrder: 0,
        action: 'START',
        dose: undefined,
        title: titleText,
        rationale,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            threshold: severeMin,
            messageVi: gateMsg,
          },
        ],
        citationIds: [
          'ukka.2022.guideline_16_2_calcium_salts',
          'byt.ckd.2024.hyperkalemia_calcium_gt_7',
          'ukka.2022.guideline_16_3_1_insulin_glucose_severe',
          'ukka.2022.guideline_16_4_1_salbutamol_nebulised',
          'ukka.2022.guideline_17_2_glucose_monitoring',
          'ukka.2022.guideline_16_6_1_szc_emergency',
          'ukka.2022.guideline_18_1_emergency_dialysis',
        ],
        priority: 100,
      };
    },
    citationIds: [
      'ukka.2022.guideline_16_2_calcium_salts',
      'byt.ckd.2024.hyperkalemia_calcium_gt_7',
      'ukka.2022.guideline_16_3_1_insulin_glucose_severe',
      'ukka.2022.guideline_16_4_1_salbutamol_nebulised',
      'ukka.2022.guideline_16_6_1_szc_emergency',
    ],
  },

  // 1b. Y lệnh Sodium Zirconium Cyclosilicate (Lokelma) đào thải kali trong cấp cứu tăng kali máu nặng
  {
    id: 'ckd.inpatient.hyperkalemia_severe_szc_order',
    module: 'ckd',
    nameVi: 'Y lệnh Sodium Zirconium Cyclosilicate (Lokelma) đào thải kali trong cấp cứu tăng kali máu nặng',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      if (k === undefined) return false;
      if (ctx.patient.currentMeds.some((m) => isKBinderMed(m))) return false;
      const ecgChanges = hasHyperkalemicEcg(ctx);
      return (
        k >= thFor('k', 'ckd.hyperkalemia.severe_min') ||
        (ecgChanges && k > thFor('k', 'ckd.rasi.k_uptitrate_max'))
      );
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const szcEntry = drug('sodium_zirconium_cyclosilicate');
      const szcStart = fmtShortDose(dose('sodium_zirconium_cyclosilicate', 'start'));
      const szcDoseG = thFor('dose_g', 'ckd.hyperkalemia.szc_start_dose');

      return {
        id: 'rec_ckd_hyperkalemia_severe_szc_order',
        module: 'ckd',
        tier: 'CẤP CỨU HỒI SỨC & TĂNG KALI MÁU',
        tierOrder: 0,
        action: 'START',
        drugId: 'sodium_zirconium_cyclosilicate',
        drugNameVi: szcEntry.nameVi,
        dose: szcStart,
        title: `Khởi trị ${szcEntry.nameVi} (${szcDoseG} g x 3 lần/ngày) đào thải Kali cấp cứu (Bước 3 UKKA 2022)`,
        rationale:
          `Theo UKKA 2022 Guideline 16.6.1 (1B) và nhãn FDA Lokelma: Khuyến cáo sử dụng Sodium Zirconium Cyclosilicate (${szcStart}, tối đa 48 giờ) phối hợp song song với Insulin-Glucose để đào thải thực sự ion K⁺ qua đường tiêu hóa (khởi phát hạ kali trong vòng 1 giờ). UKKA 2022 Guideline 16.6.3 khuyến nghị KHÔNG dùng nhựa trao đổi ion Calcium Resonium để cấp cứu tăng kali máu nặng do khởi phát chậm và nguy cơ biến chứng hoại tử ruột.`,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            messageVi: 'Bước đào thải kali (Step 3 UKKA 2022): Ưu tiên SZC khởi phát nhanh, uống cách thuốc khác >= 2 giờ',
          },
        ],
        profileDiff: {
          INTL: `UKKA 2022 Guideline 16.6.1 (1B): Ưu tiên SZC ${szcDoseG} g x 3 lần/ngày; không dùng Calcium Resonium trong tăng kali nặng cấp cứu (16.6.3).`,
          US: `FDA Lokelma: ${szcDoseG} g x 3 lần/ngày tối đa 48 giờ phối hợp điều trị cấp cứu chuẩn (không dùng đơn độc thay thế Insulin-Glucose).`,
          VN: `BYT 2024 & UKKA 2022: Ưu tiên Lokelma (SZC ${szcDoseG} g x 3 lần/ngày) tại bệnh viện có sẵn thuốc; nếu cơ sở không có SZC, ưu tiên lợi tiểu quai tĩnh mạch (khi còn nước tiểu) hoặc lọc máu cấp cứu thay vì trông đợi nhựa trao đổi ion khởi phát chậm.`,
        },
        citationIds: [
          'ukka.2022.guideline_16_6_1_szc_emergency',
          'ukka.2022.guideline_16_6_3_cps_not_emergency',
          'fda.szc.starting_dose',
        ],
        priority: 94,
      };
    },
    citationIds: [
      'ukka.2022.guideline_16_6_1_szc_emergency',
      'ukka.2022.guideline_16_6_3_cps_not_emergency',
      'fda.szc.starting_dose',
    ],
  },
];
