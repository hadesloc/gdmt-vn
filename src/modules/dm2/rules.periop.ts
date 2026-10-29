/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Điều chỉnh Thuốc Chu phẫu Ngoại trú (Sáng Ngày mổ & Đêm Trước mổ)
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  BASAL_INSULIN_IDS,
  BOLUS_INSULIN_IDS,
  DPP4_IDS,
  SU_IDS,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasActiveBladderCancer,
  hasCirrhosis,
  hasDrugAllergy,
  hasHepaticImpairment,
  hasHf,
  hasPancreatitis,
  hasPioglitazoneHepaticContra,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isFdcMed,
  isOnDialysis,
  isPregnant,
  isTakingCanonical,
  parseInsulinMedDailyUnits,
  resolveCanonicalDrugIds,
  resolveDrugNameVi,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';

const PERIOP_MORNING_HOLD_ORAL_IDS = [
  'metformin',
  ...SU_IDS,
  ...DPP4_IDS,
  'pioglitazone',
  'acarbose'
] as const;

const outpatientPeriopOralHoldRules: Rule[] = PERIOP_MORNING_HOLD_ORAL_IDS.map((oralId) => ({
  id: `dm2.outpatient.periop_hold_oral_${oralId}`,
  module: 'dm2',
  nameVi: `Tạm ngừng cử sáng ngày mổ đối với ${resolveDrugNameVi(oralId)}`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!hasPlannedSurgery(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, oralId)) {
      return false;
    }
    if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
    const med = findActiveMedByCanonical(ctx, oralId);
    if (med && isFdcMed(med)) {
      const comps = resolveCanonicalDrugIds(med.drugId, med.name);
      if (comps.some((c) => ['dapagliflozin', 'empagliflozin', 'canagliflozin', 'ertugliflozin'].includes(c))) {
        return false; // Đã được lệnh tạm ngừng 3-4 ngày trước mổ của SGLT2i bao phủ
      }
    }
    const egfr = getEffectiveEgfr(ctx);
    const isSu = (SU_IDS as readonly string[]).includes(oralId);
    if (
      oralId === 'metformin' &&
      (isOnDialysis(ctx) ||
        hasHepaticImpairment(ctx) ||
        (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra')))
    ) {
      return false;
    }
    if (
      (isSu || oralId === 'acarbose') &&
      oralId !== 'repaglinide' &&
      (isOnDialysis(ctx) || (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')))
    ) {
      return false;
    }
    if (isSu && hasHepaticImpairment(ctx)) return false;
    if (oralId === 'pioglitazone' && (hasHf(ctx) || hasPioglitazoneHepaticContra(ctx) || hasActiveBladderCancer(ctx))) return false;
    if (oralId === 'acarbose' && (hasCirrhosis(ctx) || hasHepaticImpairment(ctx))) return false;
    if (oralId === 'saxagliptin' && hasHf(ctx)) return false;
    if (oralId === 'vildagliptin' && hasHepaticImpairment(ctx)) return false;
    if ((DPP4_IDS as readonly string[]).includes(oralId) && (hasPancreatitis(ctx) || willStartOrContinueGlp1(ctx))) {
      return false;
    }
    return isTakingCanonical(ctx, oralId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, oralId);
    const target = resolveTargetRecDrug(oralId, med);
    return {
      id: `rec_dm2_periop_hold_oral_${oralId}`,
      module: 'dm2',
      tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `Chu phẫu: Tạm ngừng ${target.drugNameVi} vào buổi sáng ngày phẫu thuật`,
      rationale:
        `Khuyến cáo ADA 2026 Ch. 16: Tạm ngừng tất cả các thuốc viên hạ đường huyết đường uống (${target.drugNameVi}) vào buổi sáng ngày phẫu thuật hoặc thủ thuật có nhịn ăn để phòng ngừa hạ đường huyết chu phẫu và biến chứng huyết động/thận cấp.`,
      gates: [],
      citationIds: ['ada.dm2.2026.perioperative_oral_basal_25'],
      priority: 95
    };
  },
  citationIds: ['ada.dm2.2026.perioperative_oral_basal_25']
}));

const outpatientPeriopPrandialHoldRules: Rule[] = BOLUS_INSULIN_IDS.map((bolusId) => ({
  id: `dm2.outpatient.periop_hold_bolus_${bolusId}`,
  module: 'dm2',
  nameVi: `Tạm hoãn ${resolveDrugNameVi(bolusId)} vào buổi sáng ngày phẫu thuật khi nhịn ăn (NPO)`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!hasPlannedSurgery(ctx) || isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, bolusId)) return false;
    if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
    return isTakingCanonical(ctx, bolusId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, bolusId);
    const target = resolveTargetRecDrug(bolusId, med);
    return {
      id: `rec_dm2_periop_hold_bolus_${bolusId}`,
      module: 'dm2',
      tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `Chu phẫu: Tạm hoãn mũi ${target.drugNameVi} sáng ngày phẫu thuật khi nhịn ăn (NPO)`,
      rationale:
        'ADA 2026 Ch. 16: Bắt buộc tạm hoãn toàn bộ các mũi tiêm insulin tác dụng nhanh/ngắn theo bữa ăn vào buổi sáng ngày phẫu thuật khi người bệnh nhịn ăn (NPO); chỉ dùng insulin hiệu chỉnh đường huyết mao mạch tại bệnh viện nếu cần.',
      gates: [],
      citationIds: ['ada.dm2.2026.prandial_insulin_eating', 'ada.dm2.2026.perioperative_oral_basal_25'],
      priority: 95
    };
  },
  citationIds: ['ada.dm2.2026.prandial_insulin_eating', 'ada.dm2.2026.perioperative_oral_basal_25']
}));

const outpatientPeriopPremixAdjustRule: Rule = {
  id: 'dm2.outpatient.periop_adjust_premix',
  module: 'dm2',
  nameVi: 'Điều chỉnh / Hoãn Insulin trộn sẵn (Premix) sáng ngày phẫu thuật để phòng hạ đường huyết khi NPO',
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!hasPlannedSurgery(ctx) || isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, 'insulin_premix')) return false;
    if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
    return isTakingCanonical(ctx, 'insulin_premix');
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, 'insulin_premix');
    const target = resolveTargetRecDrug('insulin_premix', med);
    const reducePct = thFor('percentage', 'dm2.perioperative.basal_reduce_pct');
    return {
      id: 'rec_dm2_periop_adjust_premix',
      module: 'dm2',
      tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
      tierOrder: 1,
      action: 'REDUCE',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      dose: `Giảm ${reducePct}% cử tối trước mổ; KHÔNG tiêm nguyên liều Premix sáng ngày mổ khi nhịn ăn (chuyển sang tiêm 50% thành phần nền bằng NPH hoặc chuyển phác đồ Basal tại viện)`,
      title: `Chu phẫu: Không tiêm nguyên liều ${target.drugNameVi} sáng ngày phẫu thuật khi NPO`,
      rationale:
        `ADA 2026 Ch. 16: Insulin trộn sẵn (${target.drugNameVi}) chứa thành phần insulin nhanh cố định gây hạ đường huyết nặng nếu tiêm lúc nhịn ăn sáng ngày mổ. Cần giảm ${reducePct}% liều tối trước mổ và thay cử sáng ngày mổ bằng một nửa phần insulin nền (NPH/Glargine) tại bệnh viện.`,
      gates: [],
      citationIds: ['ada.dm2.2026.inpatient_premix_avoid', 'ada.dm2.2026.perioperative_oral_basal_25'],
      priority: 94
    };
  },
  citationIds: ['ada.dm2.2026.inpatient_premix_avoid', 'ada.dm2.2026.perioperative_oral_basal_25']
};

const outpatientPeriopBasalReduceRules: Rule[] = BASAL_INSULIN_IDS.map((basalId) => ({
  id: `dm2.outpatient.periop_reduce_basal_${basalId}`,
  module: 'dm2',
  nameVi: `Giảm liều ${resolveDrugNameVi(basalId)} tối trước phẫu thuật chương trình`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!hasPlannedSurgery(ctx) || isPregnant(ctx) || isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, basalId)) return false;
    if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
    const med = findActiveMedByCanonical(ctx, basalId);
    if (med && isFdcMed(med)) return false;
    return isTakingCanonical(ctx, basalId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, basalId);
    const target = resolveTargetRecDrug(basalId, med);
    const reducePct = thFor('percentage', 'dm2.perioperative.basal_reduce_pct');
    const isNph = basalId === 'insulin_nph';
    const basalInfo = extractBasalInsulinInfo(ctx);
    const homeUnits = basalInfo.canonicalId === basalId ? basalInfo.basalDoseUnits : parseInsulinMedDailyUnits(med);
    const reducedUnits =
      homeUnits !== undefined && homeUnits > 0
        ? Math.max(1, Math.round(homeUnits * (1 - reducePct / 100))) // qa-allow: unit-conversion - Tính liều giảm 25% trước mổ
        : undefined;
    return {
      id: `rec_dm2_periop_reduce_basal_${basalId}`,
      module: 'dm2',
      tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
      tierOrder: 1,
      action: 'REDUCE',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      dose: isNph
        ? `Giảm nửa liều NPH sáng ngày mổ (hoặc giảm ${reducePct}% liều tối trước mổ)`
        : reducedUnits !== undefined
          ? `Giảm ${reducePct}% liều tiêm trước mổ (từ ${homeUnits} đơn vị xuống ~${reducedUnits} đơn vị)`
          : `Giảm ${reducePct}% liều tiêm buổi tối trước ngày phẫu thuật (dùng 75–80% liều thường ngày để giữ nền)`,
      title: `Chu phẫu: Giảm ${reducePct}% liều ${target.drugNameVi} trước phẫu thuật để phòng hạ đường huyết khi nhịn ăn`,
      rationale:
        `Khuyến cáo ADA 2026 Ch. 16: Ở người bệnh đang dùng insulin nền chuẩn bị phẫu thuật chương trình, giảm ${reducePct}% liều insulin tác dụng dài vào buổi tối trước mổ (hoặc dùng nửa liều NPH sáng ngày mổ) giúp kiểm soát đường huyết chu phẫu tối ưu và giảm nguy cơ hạ đường huyết trong lúc NPO.`,
      gates: [],
      citationIds: [
        'ada.dm2.2026.perioperative_oral_basal_25',
        'ada.dm2.2026.perioperative_basal_reduce_25_quote'
      ],
      priority: 94
    };
  },
  citationIds: [
    'ada.dm2.2026.perioperative_oral_basal_25',
    'ada.dm2.2026.perioperative_basal_reduce_25_quote'
  ]
}));

export const dm2PeriopOutpatientRules: Rule[] = [
  ...outpatientPeriopOralHoldRules,
  ...outpatientPeriopPrandialHoldRules,
  outpatientPeriopPremixAdjustRule,
  ...outpatientPeriopBasalReduceRules
];
