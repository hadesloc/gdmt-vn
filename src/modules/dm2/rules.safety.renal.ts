/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - An toàn Thận, Lọc máu, DKA SGLT2i & Tạm ngừng Chu phẫu SGLT2i
 * Phân quyền: Agent F4
 */

import type { CurrentMed, Rule, RuleContext } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  RENAL_CONTRA_ORAL_IDS,
  SGLT2_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasActiveFootUlcer,
  hasHepaticImpairment,
  hasHf,
  hasPlannedSurgery,
  isBreastfeeding,
  isFdcMed,
  isOnDialysis,
  isPregnant,
  isTakingCanonical,
  resolveCanonicalDrugIds,
  resolveDrugNameVi,
  resolveTargetRecDrug
} from './helpers';

export function isFdcAlreadyPermanentlyStopped(ctx: RuleContext, med?: CurrentMed): boolean {
  if (!med || !isFdcMed(med)) return false;
  const comps = resolveCanonicalDrugIds(med.drugId, med.name);
  const egfr = getEffectiveEgfr(ctx);
  if (comps.includes('metformin')) {
    if (isOnDialysis(ctx) || hasHepaticImpairment(ctx) || (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra'))) {
      return true;
    }
  }
  if (comps.includes('saxagliptin') && hasHf(ctx)) return true;
  if (comps.includes('pioglitazone') && hasHf(ctx)) return true;
  if (comps.includes('canagliflozin') && hasActiveFootUlcer(ctx)) return true;
  return false;
}

// 1A. NGỪNG VĨNH VIỄN SGLT2i KHI ĐÃ XÁC ĐỊNH DKA / EUGLYCEMIC DKA / TĂNG CETON MÁU NẶNG
const dkaPermanentStopSglt2iRules: Rule[] = SGLT2_IDS.map((sglt2Id) => ({
  id: `dm2.safety.dka_stop_sglt2i_${sglt2Id}`,
  module: 'dm2',
  nameVi: `Ngừng vĩnh viễn ${resolveDrugNameVi(sglt2Id)} do biến chứng Toan ceton xác định (DKA / Euglycemic DKA)`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx)) return false;
    const crisis = evaluateHyperglycemicCrisis(ctx);
    const hasConfirmedKetoticCrisis =
      crisis.isDka || crisis.isEuDka || crisis.isMixedDkaHhs || crisis.isIsolatedKetonemia;
    return hasConfirmedKetoticCrisis && isTakingCanonical(ctx, sglt2Id);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, sglt2Id);
    const target = resolveTargetRecDrug(sglt2Id, med);
    return {
      id: `rec_dm2_dka_stop_sglt2i_${sglt2Id}`,
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG VĨNH VIỄN ${target.drugNameVi} do biến chứng Toan ceton / Euglycemic DKA`,
      rationale:
        `Đồng thuận Quốc tế 2024 & ADA 2026: Ở bệnh nhân xuất hiện DKA, Euglycemic DKA hoặc tăng ceton máu nặng liên quan SGLT2i (${target.drugNameVi}), bắt buộc ngừng thuốc ngay và KHÔNG khuyến cáo dùng lại sau khi khỏi do nguy cơ tái phát toan ceton đe dọa tính mạng.`,
      gates: [{ parameter: 'ketones_dka', passed: false, threshold: 1, messageVi: `DKA/Ceton cao: Ngừng hẳn ${target.drugNameVi}` }],
      citationIds: ['ada.dm2.2024.dka_sglt2i_stop_permanent', 'ada.dm2.2026.sglt2i_avoid_severe_illness'],
      priority: 100
    };
  },
  citationIds: ['ada.dm2.2024.dka_sglt2i_stop_permanent', 'ada.dm2.2026.sglt2i_avoid_severe_illness']
}));

// 1B. TẠM NGỪNG KHẨN SGLT2i KHI NGHI NGỜ DKA CHƯA CÓ BHB HOẶC HHS ĐƠN THUẦN NGOẠI TRÚ
const dkaSuspectedHoldSglt2iRules: Rule[] = SGLT2_IDS.map((sglt2Id) => ({
  id: `dm2.safety.dka_suspected_hold_sglt2i_${sglt2Id}`,
  module: 'dm2',
  nameVi: `Tạm ngừng khẩn cấp ${resolveDrugNameVi(sglt2Id)} khi nghi ngờ DKA / HHS chờ kết quả ceton máu`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || isOnDialysis(ctx)) return false;
    if (sglt2Id === 'canagliflozin' && hasActiveFootUlcer(ctx)) return false;
    const med = findActiveMedByCanonical(ctx, sglt2Id);
    if (isFdcAlreadyPermanentlyStopped(ctx, med)) return false;
    const crisis = evaluateHyperglycemicCrisis(ctx);
    if (crisis.isDka || crisis.isEuDka || crisis.isMixedDkaHhs || crisis.isIsolatedKetonemia) return false;
    const needsHold = crisis.isSuspectedUnconfirmed || crisis.isPureHhs || (ctx.settings.setting === 'outpatient' && crisis.isSuspected);
    return needsHold && isTakingCanonical(ctx, sglt2Id);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, sglt2Id);
    const target = resolveTargetRecDrug(sglt2Id, med);
    return {
      id: `rec_dm2_dka_suspected_hold_sglt2i_${sglt2Id}`,
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `TẠM NGỪNG KHẨN CẤP ${target.drugNameVi} – Xét nghiệm ngay β-hydroxybutyrate máu (Ngừng vĩnh viễn nếu xác nhận DKA)`,
      rationale:
        `Đồng thuận Quốc tế 2024: Khi lâm sàng nghi ngờ DKA/HHS hoặc có toan chuyển hóa cấp chưa đo ceton máu, phải tạm ngừng ngay ${target.drugNameVi} và xét nghiệm β-hydroxybutyrate khẩn cấp; nếu xác nhận DKA/euDKA phải chuyển sang NGỪNG VĨNH VIỄN.`,
      gates: [],
      citationIds: ['ada.dm2.2024.dka_sglt2i_stop_permanent', 'ada.dm2.2026.sglt2i_avoid_severe_illness'],
      priority: 99
    };
  },
  citationIds: ['ada.dm2.2024.dka_sglt2i_stop_permanent', 'ada.dm2.2026.sglt2i_avoid_severe_illness']
}));

// 2. NGỪNG SGLT2i KHI ĐÃ BẮT ĐẦU LỌC MÁU CHU KỲ
const dialysisStopSglt2iRules: Rule[] = SGLT2_IDS.map((sglt2Id) => ({
  id: `dm2.safety.dialysis_stop_sglt2i_${sglt2Id}`,
  module: 'dm2',
  nameVi: `Ngừng ${resolveDrugNameVi(sglt2Id)} ở bệnh nhân đang lọc máu chu kỳ`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx)) return false;
    const crisis = evaluateHyperglycemicCrisis(ctx);
    if (crisis.isDka || crisis.isEuDka || crisis.isMixedDkaHhs || crisis.isIsolatedKetonemia) return false;
    return isOnDialysis(ctx) && isTakingCanonical(ctx, sglt2Id);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, sglt2Id);
    const target = resolveTargetRecDrug(sglt2Id, med);
    return {
      id: `rec_dm2_dialysis_stop_sglt2i_${sglt2Id}`,
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG ${target.drugNameVi} do bệnh nhân đang lọc máu chu kỳ (Suy thận giai đoạn cuối)`,
      rationale:
        'ADA 2026 Ch. 11: Thuốc ức chế SGLT2 có thể duy trì khi eGFR giảm thấp lúc chưa lọc máu, nhưng bắt buộc ngừng khi người bệnh đã khởi đầu lọc máu chu kỳ (dialysis).',
      gates: [{ parameter: 'dialysis', passed: false, threshold: 1, messageVi: `Đang lọc máu: Ngừng ${target.drugNameVi}` }],
      citationIds: ['ada.dm2.2026.sglt2_stop_kidney_failure'],
      priority: 99
    };
  },
  citationIds: ['ada.dm2.2026.sglt2_stop_kidney_failure']
}));

// 3. TẠM NGỪNG SGLT2i CHU PHẪU (3 NGÀY VỚI DAPA/EMPA/CANA; 4 NGÀY VỚI ERTUGLIFLOZIN) & NỘI VIỆN CẤP TÍNH
const perioperativeSglt2iHoldRules: Rule[] = SGLT2_IDS.map((sglt2Id) => {
  const isErtu = sglt2Id === 'ertugliflozin';
  return {
    id: sglt2Id === 'dapagliflozin' ? 'dm2.inpatient.hold_sglt2i_surgery' : `dm2.inpatient.hold_sglt2i_surgery_${sglt2Id}`,
    module: 'dm2',
    nameVi: `Tạm ngừng ${resolveDrugNameVi(sglt2Id)} trước phẫu thuật chương trình`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || isOnDialysis(ctx) || !hasPlannedSurgery(ctx)) return false;
      if (sglt2Id === 'canagliflozin' && hasActiveFootUlcer(ctx)) return false;
      const med = findActiveMedByCanonical(ctx, sglt2Id);
      if (isFdcAlreadyPermanentlyStopped(ctx, med)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed || crisis.isIsolatedKetonemia) return false;
      return isTakingCanonical(ctx, sglt2Id);
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, sglt2Id);
      const target = resolveTargetRecDrug(sglt2Id, med);
      const withholdDays = isErtu
        ? thFor('duration_days', 'dm2.ertugliflozin.surgery_withhold_days')
        : thFor('duration_days', 'dm2.sglt2i.surgery_withhold_days');
      return {
        id: sglt2Id === 'dapagliflozin' ? 'rec_dm2_inpatient_hold_sglt2i' : `rec_dm2_hold_sglt2i_surgery_${sglt2Id}`,
        module: 'dm2',
        tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
        tierOrder: 0,
        action: 'HOLD',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Tạm ngừng ${target.drugNameVi} ít nhất ${withholdDays} ngày trước phẫu thuật`,
        rationale:
          `ADA 2026 Ch. 16 & Nhãn FDA: Tạm ngừng ${target.drugNameVi} ít nhất ${withholdDays} ngày trước phẫu thuật chương trình để phòng ngừa euglycemic DKA; chỉ dùng lại sau mổ khi huyết động ổn định, ăn uống bình thường và không toan ceton.`,
        gates: [],
        citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery'],
        priority: 98
      };
    },
    citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery']
  };
});

const inpatientAcuteSglt2iHoldRules: Rule[] = SGLT2_IDS.map((sglt2Id) => ({
  id: `dm2.inpatient.hold_sglt2i_acute_${sglt2Id}`,
  module: 'dm2',
  nameVi: `Tạm ngừng ${resolveDrugNameVi(sglt2Id)} trong đợt bệnh cấp tính nội viện`,
  setting: 'inpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || isOnDialysis(ctx) || hasPlannedSurgery(ctx)) return false;
    if (sglt2Id === 'canagliflozin' && hasActiveFootUlcer(ctx)) return false;
    const med = findActiveMedByCanonical(ctx, sglt2Id);
    if (isFdcAlreadyPermanentlyStopped(ctx, med)) return false;
    const crisis = evaluateHyperglycemicCrisis(ctx);
    if (crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed || crisis.isIsolatedKetonemia) return false;
    return isTakingCanonical(ctx, sglt2Id);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, sglt2Id);
    const target = resolveTargetRecDrug(sglt2Id, med);
    const hasHeartFailure = hasHf(ctx);
    const hfNote = hasHeartFailure
      ? ' Lưu ý ADA 2026 Ch. 16 (Khuyến cáo 16.11): Ở người bệnh ĐTĐ kèm Suy tim, ngay khi đã hồi phục huyết động ổn định, ăn uống lại bình thường và loại trừ nguy cơ toan ceton, cần xem xét tiếp tục/khởi động lại SGLT2i đơn chất trước khi xuất viện để giảm tái nhập viện suy tim.'
      : '';
    const citations: string[] = [
      'ada.dm2.2026.sglt2i_avoid_severe_illness',
      'byt.dm2.2020.inpatient_hold_su_sglt2'
    ];
    if (hasHeartFailure) citations.push('ada.dm2.2026.hf_inpatient_sglt2i_resume_16_11');
    return {
      id: `rec_dm2_inpatient_hold_acute_${sglt2Id}`,
      module: 'dm2',
      tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `Tạm ngừng ${target.drugNameVi} trong giai đoạn bệnh cấp tính nội viện`,
      rationale:
        `ADA 2026 Ch. 16 & BYT 5481/2020: Tạm ngừng SGLT2i ở bệnh nhân nhập viện cấp tính, nhịn ăn hoặc nằm ICU nhằm phòng ngừa euglycemic DKA và giảm thể tích tuần hoàn.${hfNote}`,
      gates: [],
      citationIds: citations,
      priority: 97
    };
  },
  citationIds: ['ada.dm2.2026.sglt2i_avoid_severe_illness', 'byt.dm2.2020.inpatient_hold_su_sglt2']
}));

// 4. SUY THẬN NẶNG HOẶC LỌC MÁU: NGỪNG SU & ACARBOSE
const severeRenalStopRules: Rule[] = RENAL_CONTRA_ORAL_IDS.map((drugId) => ({
  id: `dm2.safety.renal_contra_stop_${drugId}`,
  module: 'dm2',
  nameVi: `Ngừng ${resolveDrugNameVi(drugId)} khi suy thận nặng hoặc lọc máu`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx)) return false;
    const egfr = getEffectiveEgfr(ctx);
    const isSevereRenal = isOnDialysis(ctx) || (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra'));
    return isSevereRenal && isTakingCanonical(ctx, drugId);
  },
  produce: (ctx) => {
    const egfr = getEffectiveEgfr(ctx)!;
    const minEgfr = thFor('egfr', 'dm2.su_agi.egfr_contra');
    const med = findActiveMedByCanonical(ctx, drugId);
    const target = resolveTargetRecDrug(drugId, med);
    const onHd = isOnDialysis(ctx);
    const isAcarbose = drugId === 'acarbose';
    const cits = isAcarbose
      ? ['kdigo.dm2.2022.agi_avoid_severe_ckd']
      : ['ema.gliclazide.severe_renal_contra', 'kdigo.dm2.2022.su_avoid_low_egfr'];
    return {
      id: `rec_dm2_renal_stop_${drugId}`,
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: onHd
        ? `NGỪNG ${target.drugNameVi} do bệnh nhân đang lọc máu chu kỳ`
        : `NGỪNG ${target.drugNameVi} do suy thận nặng (eGFR ${egfr.toFixed(0)} dưới ${minEgfr} mL/phút/1.73m²)`,
      rationale: isAcarbose
        ? `KDIGO 2022 & BYT 5481/2020: Tránh/chống chỉ định dùng Acarbose khi eGFR dưới ${minEgfr} mL/phút/1.73m² hoặc đang lọc máu do tích lũy thuốc.`
        : `EMA SmPC & KDIGO 2022: Chống chỉ định dùng ${target.drugNameVi} ở bệnh nhân suy thận nặng (eGFR dưới ${minEgfr} mL/phút/1.73m² hoặc lọc máu) do nguy cơ hạ đường huyết ác tính kéo dài; chuyển sang Linagliptin hoặc Insulin.`,
      gates: [{ parameter: 'eGFR', passed: false, value: egfr, threshold: minEgfr, messageVi: `Suy thận nặng: Ngừng ${target.drugNameVi}` }],
      citationIds: cits,
      priority: 99
    };
  },
  citationIds: ['ema.gliclazide.severe_renal_contra', 'kdigo.dm2.2022.agi_avoid_severe_ckd']
}));

export const dm2SafetyRenalRules: Rule[] = [
  ...dkaPermanentStopSglt2iRules,
  ...dkaSuspectedHoldSglt2iRules,
  ...dialysisStopSglt2iRules,
  ...perioperativeSglt2iHoldRules,
  ...inpatientAcuteSglt2iHoldRules,
  ...severeRenalStopRules
];
