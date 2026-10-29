/**
 * GDMT-VN CKD Module - Outpatient & Cross-Setting Acute Safety Rules
 * Phân quyền: Agent E (Round 4 Remediation - FDC-aware Teratogen/HyperK/AKI Gates & Outpatient ECG Hyperkalemia Triage)
 * Bao phủ: CKD-R4-R1-02, CKD-R4-R2-01, CKD-R4-R2-08, CKD-R4-R3-02, CKD-R4-R3-05
 */

import type { CurrentMed, Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  hasCkdFlag,
  hasHyperkalemicEcg,
  hasMetforminComponent,
  isAkiActive,
  isDriMed,
  isGlp1RaMed,
  isKSparingOrSteroidalMraMed,
  isLoopOrThiazideDiureticMed,
  isRasiOrArniMed,
  isSglt2iMed,
  isStatinMed,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

const MED_SLOTS = [0, 1, 2, 3, 4] as const; // qa-allow: index - chỉ số danh sách thuốc hiện dùng

function isPregnancyTeratogenMed(med: CurrentMed): boolean {
  return (
    isRasiOrArniMed(med) ||
    isDriMed(med) ||
    isSglt2iMed(med) ||
    normalizeDrugId(med.drugId) === 'finerenone' ||
    isKSparingOrSteroidalMraMed(med) ||
    isStatinMed(med) ||
    isGlp1RaMed(med)
  );
}

function isKRetainingHoldMed(med: CurrentMed): boolean {
  return (
    isRasiOrArniMed(med) ||
    isDriMed(med) ||
    normalizeDrugId(med.drugId) === 'finerenone' ||
    isKSparingOrSteroidalMraMed(med)
  );
}

function isOutpatientAkiHoldMed(med: CurrentMed): boolean {
  return (
    isSglt2iMed(med) ||
    isRasiOrArniMed(med) ||
    isDriMed(med) ||
    normalizeDrugId(med.drugId) === 'finerenone' ||
    isKSparingOrSteroidalMraMed(med) ||
    hasMetforminComponent(med) ||
    isLoopOrThiazideDiureticMed(med)
  );
}

export const ckdOutpatientSafetyRules: Rule[] = [
  // 1. Cảnh báo NGỪNG KHẨN CẤP từng thuốc độc phôi thai (kể cả viên phối hợp FDC) đang dùng khi mang thai
  // Đặt ở đầu mảng để ID rec_ckd_pregnancy_stop_teratogens luôn là primary khi gộp (ckd_38)
  ...MED_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.outpatient.pregnancy_stop_slot_${slotIdx}`,
    module: 'ckd',
    nameVi: `Ngừng khẩn cấp thuốc chống chỉ định thai kỳ (vị trí ${slotIdx})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasCkdFlag(ctx, 'pregnant')) return false;
      const activeTeratogens = ctx.patient.currentMeds.filter((m) => isPregnancyTeratogenMed(m));
      return slotIdx < activeTeratogens.length;
    },
    produce: (ctx) => {
      const activeTeratogens = ctx.patient.currentMeds.filter((m) => isPregnancyTeratogenMed(m));
      const targetMed = activeTeratogens[slotIdx];
      if (!targetMed) return null;

      const targetId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      const recId =
        slotIdx === 0 ? 'rec_ckd_pregnancy_stop_teratogens' : `rec_ckd_pregnancy_stop_${targetId}`;
      const titleText = `NGỪNG KHẨN CẤP ${medName} (Chống chỉ định / Tránh dùng trong thai kỳ)`;

      return {
        id: recId,
        module: 'ckd',
        tier: 'CẢNH BÁO AN TOÀN THAI KỲ',
        tierOrder: 0,
        action: 'STOP',
        drugId: targetId,
        drugNameVi: medName,
        dose: undefined,
        title: titleText,
        rationale: `Bệnh nhân đang mang thai và đang sử dụng ${medName}. Bắt buộc NGỪNG NGAY do nguy cơ độc tính phôi thai / thận thai nhi (thiểu ối, giảm sản sọ và tử vong chu sinh đối với RASi/ARNI/Aliskiren — kể cả viên phối hợp cố định liều; chống chỉ định/tránh dùng đối với Statin, SGLT2i, Finerenone, MRA và GLP-1 RA); chuyển sang phác đồ hạ áp an toàn cho thai kỳ (Labetalol, Nifedipine phóng thích kéo dài hoặc Methyldopa) và hội chẩn Sản - Thận học.`,
        gates: [
          {
            parameter: 'pregnancy',
            passed: false,
            messageVi: `Đang mang thai: Phải ngừng ngay ${medName}`,
          },
        ],
        citationIds: [
          'fda.losartan.boxed_pregnancy',
          'ema.perindopril.pregnancy',
          'fda.dapagliflozin.pregnancy',
          'fda.finerenone.pregnancy',
        ],
        priority: 105,
      };
    },
    citationIds: [
      'fda.losartan.boxed_pregnancy',
      'ema.perindopril.pregnancy',
      'fda.dapagliflozin.pregnancy',
      'fda.finerenone.pregnancy',
    ],
  })),

  // 2. Tăng Kali máu K+ > 5.5 mmol/L (hoặc K+ > 5.0 kèm biến đổi ECG): Phát lệnh HOLD cho từng thuốc giữ Kali (kể cả FDC & Aliskiren)
  ...MED_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.outpatient.hyperkalemia_hold_slot_${slotIdx}`,
    module: 'ckd',
    nameVi: `Tạm ngừng thuốc giữ Kali (vị trí ${slotIdx}) khi Kali máu vượt ngưỡng an toàn`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isAkiActive(ctx) || hasCkdFlag(ctx, 'pregnant')) return false;
      const k = need(ctx, 'k');
      if (k === undefined) return false;
      const kHold = thFor('k', 'ckd.rasi.k_hold_threshold');
      const kEcgMin = thFor('k', 'ckd.rasi.k_uptitrate_max');
      const shouldHold = k > kHold || (hasHyperkalemicEcg(ctx) && k > kEcgMin);
      if (!shouldHold) return false;
      const heldMeds = ctx.patient.currentMeds.filter((m) => isKRetainingHoldMed(m));
      return slotIdx < heldMeds.length;
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const kHold = thFor('k', 'ckd.rasi.k_hold_threshold');
      const kModMin = thFor('k', 'ckd.hyperkalemia.moderate_min');
      const ecgChanges = hasHyperkalemicEcg(ctx);
      const heldMeds = ctx.patient.currentMeds.filter((m) => isKRetainingHoldMed(m));
      const targetMed = heldMeds[slotIdx];
      if (!targetMed) return null;

      const targetId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      const recId =
        slotIdx === 0 ? 'rec_ckd_outpatient_hold_k_meds' : `rec_ckd_outpatient_hold_${targetId}`;
      const isSevere = k >= kModMin || ecgChanges;
      const titleText = `TẠM NGỪNG thuốc giữ Kali (${medName}) do K⁺ = ${k} mmol/L${ecgChanges ? ' kèm biến đổi ECG' : ''}`;

      return {
        id: recId,
        module: 'ckd',
        tier: ctx.settings.setting === 'inpatient' ? 'Cảnh báo an toàn nội viện' : 'Cảnh báo an toàn ngoại trú',
        tierOrder: 0,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: medName,
        dose: undefined,
        title: titleText,
        rationale: `Kali máu ${k} mmol/L${ecgChanges ? ' kèm biến đổi ECG nghi tăng kali' : ` > ${kHold} mmol/L`}. Theo KDIGO 2024 (PP 3.6.5, Figure 32) và nhãn FDA: Tạm ngừng ${medName} (gồm cả viên phối hợp chứa hoạt chất giữ kali) để phòng rối loạn nhịp thất. ${isSevere ? 'Cấp cứu tim mạch, cần xử trí nội viện ngay!' : 'Kiểm soát kali và kiểm tra lại điện giải sau 3–5 ngày.'}`,
        gates: [
          {
            parameter: 'K+',
            passed: false,
            value: k,
            threshold: kHold,
            messageVi: `K+ ${k} mmol/L${ecgChanges ? ' + biến đổi ECG' : ` > ${kHold}`}: Tạm ngừng ${medName}`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.fig_32_hyperkalemia_5_5',
          'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
          'fda.finerenone.table_2_dose_adjustment',
        ],
        priority: 98,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.fig_32_hyperkalemia_5_5',
      'fda.finerenone.table_2_dose_adjustment',
    ],
  })),

  // 3a. Tăng Kali máu nặng ngoại trú (K+ >= 6.0 mmol/L HOẶC K+ > 5.0 mmol/L kèm biến đổi ECG): Chuyển Cấp cứu khẩn cấp (CKD-R4-R3-02)
  {
    id: 'ckd.outpatient.hyperkalemia_emergency_refer',
    module: 'ckd',
    nameVi: 'Chuyển Cấp cứu khẩn cấp khi Tăng Kali máu nặng hoặc có biến đổi ECG tại ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      if (k === undefined) return false;
      return (
        k >= thFor('k', 'ckd.hyperkalemia.moderate_min') ||
        (hasHyperkalemicEcg(ctx) && k > thFor('k', 'ckd.rasi.k_uptitrate_max'))
      );
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const kModMin = thFor('k', 'ckd.hyperkalemia.moderate_min');
      const ecgChanges = hasHyperkalemicEcg(ctx);
      const titleText = `CHUYỂN CẤP CỨU KHẨN CẤP: Tăng Kali máu nguy kịch (K⁺ = ${k} mmol/L${ecgChanges ? ' + Biến đổi ECG' : ''})`;

      return {
        id: 'rec_ckd_outpatient_hyperk_emergency_refer',
        module: 'ckd',
        tier: 'CẤP CỨU NGOẠI TRÚ',
        tierOrder: 0,
        action: 'REFER',
        dose: undefined,
        title: titleText,
        rationale: `Theo Hướng dẫn UKKA 2022 (Guideline 16.2 & 16.3.2): Nồng độ Kali máu ${k} mmol/L${ecgChanges ? ' kèm biến đổi điện tâm đồ độc tính cơ tim (sóng T cao nhọn, mất P, QRS giãn rộng)' : ` >= ${kModMin} mmol/L`} tại phòng khám ngoại trú có nguy cơ cao bùng phát rung thất / vô tâm thu đe dọa tử vong. TUYỆT ĐỐI KHÔNG kê nhựa gắn kali ngoại trú cho về nhà; yêu cầu chuyển ngay tới Khoa Cấp cứu để mắc monitor tim liên tục, tiêm Calcium Gluconate tĩnh mạch bảo vệ màng cơ tim và truyền Insulin-Glucose.`,
        gates: [
          {
            parameter: 'K+',
            passed: false,
            value: k,
            threshold: kModMin,
            messageVi: ecgChanges
              ? `K+ ${k} mmol/L kèm biến đổi ECG độc tính tim: Cấp cứu tối khẩn`
              : `K+ ${k} mmol/L >= ${kModMin}: Nguy hiểm tính mạng`,
          },
        ],
        citationIds: [
          'ukka.2022.guideline_16_2_calcium_salts',
          'ukka.2022.guideline_16_3_2_insulin_glucose_moderate',
        ],
        priority: 100,
      };
    },
    citationIds: [
      'ukka.2022.guideline_16_2_calcium_salts',
      'ukka.2022.guideline_16_3_2_insulin_glucose_moderate',
    ],
  },

  // 3b. Ngoại trú có biến đổi ECG nghi tăng kali nhưng CHƯA có K+ máu: Chuyển Cấp cứu / POC K+ khẩn (CKD-R4-R3-02)
  {
    id: 'ckd.outpatient.hyperkalemia_ecg_missing_k_refer',
    module: 'ckd',
    nameVi: 'Chuyển cấp cứu và đo nhanh K+ khí máu khi có biến đổi ECG ngoại trú chưa rõ K+',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => hasHyperkalemicEcg(ctx) && need(ctx, 'k') === undefined,
    produce: () => ({
      id: 'rec_ckd_outpatient_hyperk_ecg_missing_k',
      module: 'ckd',
      tier: 'CẤP CỨU NGOẠI TRÚ',
      tierOrder: 0,
      action: 'REFER',
      dose: undefined,
      title: 'CHUYỂN CẤP CỨU NGAY: Biến đổi ECG nghi tăng kali máu chưa có K⁺ — Xét nghiệm nhanh K⁺ khí máu tại chỗ (POC)',
      rationale:
        'Theo UKKA 2022 (Guideline 15.2 & 16.2): Bệnh nhân ngoại trú có dấu hiệu điện tâm đồ nghi ngờ tăng kali máu nhưng chưa có kết quả K⁺ huyết thanh cần được chuyển ngay vào Khoa Cấp cứu, mắc monitor điện tim liên tục và đo khẩn K⁺ trên máy khí máu tại chỗ (POC) để xác nhận tăng kali thực sự và loại trừ nhồi máu cơ tim cấp (STEMI) trước khi dùng thuốc hạ kali.',
      gates: [
        {
          parameter: 'ECG_HyperK',
          passed: false,
          messageVi: 'Biến đổi ECG nguy kịch chưa có K+: Chuyển cấp cứu và xét nghiệm POC K+ ngay',
        },
      ],
      citationIds: [
        'ukka.2022.guideline_15_2_poc_blood_gas',
        'ukka.2022.guideline_16_2_calcium_salts',
      ],
      priority: 100,
    }),
    citationIds: ['ukka.2022.guideline_15_2_poc_blood_gas'],
  },

  // 3c. Ngoại trú có cờ ECG nhưng K+ xác nhận bình thường (<= 5.0 mmol/L): Cảnh báo loại trừ STEMI
  {
    id: 'ckd.outpatient.hyperkalemia_ecg_normok_alert',
    module: 'ckd',
    nameVi: 'Cảnh báo loại trừ STEMI khi có biến đổi sóng T/QRS ngoại trú nhưng K+ <= 5.0 mmol/L',
    setting: 'outpatient',
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
      const kNorm = thFor('k', 'ckd.rasi.k_uptitrate_max');
      return {
        id: 'rec_ckd_outpatient_ecg_normok_alert',
        module: 'ckd',
        tier: 'CẢNH BÁO CHẨN ĐOÁN PHÂN BIỆT ECG',
        tierOrder: 0,
        action: 'MONITOR',
        dose: undefined,
        title: `CẢNH BÁO ECG: K⁺ = ${k} mmol/L bình thường (<= ${kNorm} mmol/L) — KHÔNG dùng thuốc hạ kali, đánh giá khẩn hội chứng vành cấp (STEMI)`,
        rationale:
          `Trị số K⁺ = ${k} mmol/L bác bỏ tăng kali máu. Không kê thuốc gắn kali và cần đánh giá khẩn cấp nguyên nhân biến đổi sóng T cao nhọn / QRS giãn rộng do thiếu máu cơ tim tối cấp (STEMI / De Winter), blốc nhánh hoặc phì đại thất trái.`,
        gates: [
          {
            parameter: 'K+',
            passed: false,
            value: k,
            threshold: kNorm,
            messageVi: `K+ = ${k} <= ${kNorm} mmol/L: Không phải tăng kali máu, loại trừ STEMI`,
          },
        ],
        citationIds: [
          'ukka.2022.guideline_15_2_poc_blood_gas',
          'kdigo.ckd.2024.sec_3_11_hyperkalemia_def_5_0',
        ],
        priority: 97,
      };
    },
    citationIds: ['ukka.2022.guideline_15_2_poc_blood_gas'],
  },

  // 4. Cảnh báo tụt huyết áp cấp tính tại ngoại trú (80 <= SBP < 90 mmHg)
  {
    id: 'ckd.outpatient.hypotension_crisis_refer',
    module: 'ckd',
    nameVi: 'Đánh giá cấp cứu tụt huyết áp nặng tại ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const sbp = need(ctx, 'sbp');
      const shockCutoff = thFor('sbp', 'ckd.bp.shock_sbp_engine_cutoff');
      const crisisSbp = thFor('sbp', 'ckd.bp.hypotension_crisis_sbp');
      return sbp !== undefined && sbp >= shockCutoff && sbp < crisisSbp;
    },
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp')!;
      const crisisSbp = thFor('sbp', 'ckd.bp.hypotension_crisis_sbp');
      return {
        id: 'rec_ckd_outpatient_hypotension_refer',
        module: 'ckd',
        tier: 'CẤP CỨU NGOẠI TRÚ',
        tierOrder: 0,
        action: 'REFER',
        dose: undefined,
        title: `ĐÁNH GIÁ CẤP CỨU TỤT HUYẾT ÁP NẶNG NGOẠI TRÚ (SBP = ${sbp} < ${crisisSbp} mmHg)`,
        rationale:
          `Huyết áp tâm thu tại phòng khám giảm thấp ${sbp} mmHg (< ${crisisSbp} mmHg) có nguy cơ giảm tưới máu thận cấp tính (AKI trước thận), thiếu máu cơ tim/não và sốc. Cần tạm hoãn toàn bộ việc khởi trị mới các thuốc mạn tính, tạm ngừng thuốc hạ áp/lợi tiểu/SGLT2i đang dùng và chuyển đánh giá cấp cứu nguyên nhân.`,
        gates: [
          {
            parameter: 'SBP',
            passed: false,
            value: sbp,
            threshold: crisisSbp,
            messageVi: `SBP ${sbp} mmHg < ${crisisSbp}: Tụt huyết áp nặng — ưu tiên ổn định huyết động cấp cứu`,
          },
        ],
        citationIds: [
          'esc.hf.2026.bb_guidance_table_s6',
          'kdigo.2021.bp.sbp_low_100',
          'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
        ],
        priority: 99,
      };
    },
    citationIds: ['esc.hf.2026.bb_guidance_table_s6', 'kdigo.2021.bp.sbp_low_100'],
  },

  // 5. Phát hiện AKI cấp tính ngay tại phòng khám ngoại trú: Chuyển nội viện & tạm ngừng thuốc ngày ốm (nhận diện cả FDC)
  {
    id: 'ckd.outpatient.aki_detected_refer',
    module: 'ckd',
    nameVi: 'Chuyển đánh giá nội viện khẩn khi phát hiện AKI trên nền CKD tại ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAkiActive(ctx),
    produce: () => ({
      id: 'rec_ckd_outpatient_aki_refer',
      module: 'ckd',
      tier: 'CẤP CỨU & TỔN THƯƠNG THẬN CẤP',
      tierOrder: 0,
      action: 'REFER',
      dose: undefined,
      title:
        'PHÁT HIỆN ĐỢT CẤP TỔN THƯƠNG THẬN CẤP (AKI trên nền CKD): Chuyển đánh giá nội viện & tạm ngừng thuốc ngày ốm',
      rationale:
        'Theo KDIGO 2024 (PP 3.7.2) và KDIGO 2012 AKI: Bệnh nhân có dấu hiệu tổn thương thận cấp tiến triển (tăng nhanh Creatinin so với nền hoặc thiểu/vô niệu). Không duy trì hoặc khởi trị mới phác đồ ngoại trú thường quy; cần tạm ngừng ngay nhóm thuốc ngày ốm (SGLT2i, RASi/ARNI/Aliskiren, MRA, Metformin, lợi tiểu khi thiếu dịch, NSAID — kể cả viên phối hợp FDC) và nhập viện đánh giá nguyên nhân.',
      gates: [
        {
          parameter: 'AKI_Outpatient',
          passed: false,
          messageVi: 'Đang có đợt cấp AKI trên nền CKD: Ưu tiên xử trí cấp tính và tạm ngừng thuốc ngày ốm',
        },
      ],
      citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold', 'kdigo.aki.2012.table_2_staging'],
      priority: 99,
    }),
    citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold', 'kdigo.aki.2012.table_2_staging'],
  },
  ...MED_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.outpatient.aki_hold_slot_${slotIdx}`,
    module: 'ckd',
    nameVi: `Tạm ngừng thuốc ngày ốm (vị trí ${slotIdx}) khi phát hiện AKI tại ngoại trú`,
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAkiActive(ctx)) return false;
      const akiMeds = ctx.patient.currentMeds.filter((m) => isOutpatientAkiHoldMed(m));
      return slotIdx < akiMeds.length;
    },
    produce: (ctx) => {
      const akiMeds = ctx.patient.currentMeds.filter((m) => isOutpatientAkiHoldMed(m));
      const med = akiMeds[slotIdx];
      if (!med) return null;

      const targetId = normalizeDrugId(med.drugId);
      const mName = medDisplayName(med);
      const isDiur = isLoopOrThiazideDiureticMed(med) && !isRasiOrArniMed(med);
      const isSglt2 = isSglt2iMed(med);
      const rationaleText = isDiur
        ? 'Theo KDIGO 2012 AKI (Rec 3.4.1–3.4.2) & KDIGO 2024 (PP 3.7.2): Tạm ngừng thuốc lợi tiểu khi có AKI mất nước/chưa có phù phổi cấp để phục hồi thể tích tuần hoàn hữu hiệu.'
        : isSglt2
          ? 'Theo KDIGO 2024 (PP 3.7.2): Tạm ngừng thuốc chứa SGLT2i trong đợt bệnh cấp tính / AKI để phòng toan ceton đường huyết bình thường và giảm thể tích.'
          : 'Theo KDIGO 2024 (PP 3.7.2 & 3.6.5): Tạm ngừng thuốc nhóm ngày ốm (bao gồm cả viên phối hợp FDC) trong đợt cấp AKI để phục hồi huyết động cầu thận, tránh tăng kali máu và tích lũy độc tính.';
      return {
        id: `rec_ckd_outpatient_aki_hold_${targetId}`,
        module: 'ckd',
        tier: 'Cảnh báo an toàn ngoại trú',
        tierOrder: 0,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: mName,
        dose: undefined,
        title: `TẠM NGỪNG ${mName} trong đợt cấp tổn thương thận cấp (AKI)`,
        rationale: rationaleText,
        gates: [
          {
            parameter: 'AKI',
            passed: false,
            messageVi: `Đợt cấp AKI: Tạm ngừng ${mName}`,
          },
        ],
        citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
        priority: 98,
      };
    },
    citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
  })),
];
