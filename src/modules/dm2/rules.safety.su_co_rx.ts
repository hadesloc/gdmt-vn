/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Thay thế SU ở Người Cao tuổi & Chỉnh liều SU/Insulin khi Thêm SGLT2i/GLP-1/Insulin
 * Phân quyền: Agent F4
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  BASAL_OR_PREMIX_IDS,
  INCRETIN_RA_IDS,
  SGLT2_IDS,
  SU_IDS,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasActiveFootUlcer,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasHepaticImpairment,
  hasHf,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isOvertreatedFrailDeferral,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  pickFirstNonAllergicCandidate,
  resolveElderlyStatus,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';
import { shouldDeintensifyHypoMeds } from './rules.safety.deintensify';

function isStartingNewCardiorenalAgent(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'outpatient') return false;
  const egfr = getEffectiveEgfr(ctx);
  const sglt2Candidate = pickFirstNonAllergicCandidate(ctx, ['dapagliflozin', 'empagliflozin']);
  const willStartSglt2 =
    Boolean(sglt2Candidate) &&
    !isTakingAnyCanonical(ctx, SGLT2_IDS) &&
    !isOnDialysis(ctx) &&
    !hasHepaticImpairment(ctx) &&
    !hasPlannedSurgery(ctx) &&
    !hasActiveFootUlcer(ctx) &&
    !isOvertreatedFrailDeferral(ctx) &&
    egfr !== undefined &&
    egfr >= thFor('egfr', 'ckd.sglt2i.egfr_initiate_min') &&
    (hasHf(ctx) || hasCkd(ctx) || hasAscvd(ctx));

  const willStartGlp1 =
    !isTakingAnyCanonical(ctx, INCRETIN_RA_IDS) && willStartOrContinueGlp1(ctx);

  return willStartSglt2 || willStartGlp1;
}

function willStartEarlyBasalInsulin(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'outpatient' || !hasDm2Context(ctx)) return false;
  if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || hasPlannedSurgery(ctx)) return false;
  const crisis = evaluateHyperglycemicCrisis(ctx);
  if (crisis.isCrisis || crisis.isIsolatedKetonemia) return false;
  if (shouldDeintensifyHypoMeds(ctx) || isOvertreatedFrailDeferral(ctx)) return false;
  if (extractBasalInsulinInfo(ctx).hasAnyInsulin || isTakingAnyCanonical(ctx, ALL_INSULIN_IDS)) return false;
  const hba1c = need(ctx, 'hba1c');
  const glucose = need(ctx, 'glucose');
  const hasCatabolism = Boolean(ctx.patient.customInputs?.catabolicSymptoms);
  return (
    hasCatabolism ||
    (hba1c !== undefined && hba1c >= thFor('hba1c', 'dm2.early_insulin.hba1c')) ||
    (glucose !== undefined && glucose >= thFor('glucose', 'dm2.early_insulin.glucose_mmol'))
  );
}

function isElderlyHighRiskForSu(ctx: RuleContext, suId: string): boolean {
  if (suId === 'glibenclamide') return true;
  const age = need(ctx, 'age');
  const elderly = resolveElderlyStatus(ctx);
  return (
    elderly === 'complex' ||
    elderly === 'very_complex' ||
    (age !== undefined && age >= thFor('age', 'dm2.elderly.high_risk_age'))
  );
}

const elderlyUnsafeSuReplaceRules: Rule[] = SU_IDS.map((suId) => ({
  id: `dm2.outpatient.elderly_unsafe_su_stop_${suId}`,
  module: 'dm2',
  nameVi: `Ngừng ${suId} ở người cao tuổi suy yếu/phức tạp (hoặc Glibenclamide) để chuyển sang thuốc ít hạ đường huyết`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (shouldDeintensifyHypoMeds(ctx)) return false;
    if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || hasPlannedSurgery(ctx)) return false;
    if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
    if (hasHepaticImpairment(ctx) || isOnDialysis(ctx)) return false;
    const egfr = getEffectiveEgfr(ctx);
    if (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')) return false;
    if (!isTakingCanonical(ctx, suId)) return false;
    return isElderlyHighRiskForSu(ctx, suId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, suId);
    const target = resolveTargetRecDrug(suId, med);
    const isGliben = suId === 'glibenclamide';
    const cits = isGliben
      ? ['ada.dm2.2026.glyburide_avoid_older_ckd', 'ada.dm2.2026.older_deintensification']
      : ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.older_overtreatment_su_insulin'];
    return {
      id: `rec_dm2_elderly_unsafe_su_stop_${suId}`,
      module: 'dm2',
      tier: 'An toàn & Tối ưu hóa thuốc người cao tuổi',
      tierOrder: 1,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: isGliben
        ? `NGỪNG ${target.drugNameVi} – Chuyển sang thuốc ít gây hạ đường huyết (Chống chỉ định Glibenclamide ở người lớn tuổi)`
        : `Ngừng ${target.drugNameVi} trên người cao tuổi nhiều bệnh kèm/suy yếu – Chuyển sang phác đồ ít nguy cơ hạ đường huyết`,
      rationale:
        `ADA 2026 Ch. 13 (Khuyến cáo 13.14a): Tránh dùng Sulfonylurea tác dụng kéo dài (${target.drugNameVi}) ở người cao tuổi từ ${thFor('age', 'dm2.elderly.high_risk_age')} tuổi trở lên hoặc sức khỏe phức tạp/rất phức tạp do nguy cơ hạ đường huyết nặng không triệu chứng báo trước; thay thế bằng các thuốc an toàn không gây hạ đường huyết (như Linagliptin, SGLT2i hoặc Metformin tùy chức năng thận).`,
      gates: [],
      citationIds: cits,
      priority: 92
    };
  },
  citationIds: ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.older_overtreatment_su_insulin']
}));

const earlyInsulinSuAdjustRules: Rule[] = SU_IDS.map((suId) => ({
  id: `dm2.outpatient.early_insulin_su_adjust_${suId}`,
  module: 'dm2',
  nameVi: `Giảm liều hoặc ngừng ${suId} khi khởi trị thêm Insulin nền sớm để phòng hạ đường huyết cộng gộp`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!willStartEarlyBasalInsulin(ctx)) return false;
    if (isElderlyHighRiskForSu(ctx, suId)) return false;
    if (hasHepaticImpairment(ctx) || isOnDialysis(ctx)) return false;
    const egfr = getEffectiveEgfr(ctx);
    if (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')) return false;
    return isTakingCanonical(ctx, suId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, suId);
    const target = resolveTargetRecDrug(suId, med);
    return {
      id: `rec_dm2_early_insulin_su_adjust_${suId}`,
      module: 'dm2',
      tier: 'An toàn & Xuống thang điều trị',
      tierOrder: 2,
      action: 'REDUCE',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      dose: `Giảm một nửa liều hiện tại hoặc ngừng ${target.drugNameVi} khi bắt đầu tiêm Insulin nền`,
      title: `Giảm liều / cân nhắc ngừng ${target.drugNameVi} khi khởi trị thêm Insulin nền`,
      rationale:
        `ADA 2026 Ch. 9 & QĐ 5481/QĐ-BYT: Khi khởi trị bổ sung Insulin nền trên bệnh nhân đang dùng Sulfonylurea (${target.drugNameVi}), bắt buộc đánh giá ngừng hoặc giảm ít nhất một nửa liều Sulfonylurea để phòng ngừa hạ đường huyết cộng gộp nặng khi tình trạng ngộ độc đường cải thiện.`,
      gates: [],
      citationIds: ['ada.dm2.2026.older_overtreatment_su_insulin', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
      priority: 90
    };
  },
  citationIds: ['ada.dm2.2026.older_overtreatment_su_insulin', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
}));

const cardiorenalAddonHypoPreventionRules: Rule[] = [
  ...SU_IDS.map((suId): Rule => ({
    id: `dm2.outpatient.cardiorenal_addon_reduce_${suId}`,
    module: 'dm2',
    nameVi: `Giảm liều ${suId} khi bổ sung SGLT2i / GLP-1 RA bảo vệ tim–thận trên nền HbA1c gần đích`,
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (shouldDeintensifyHypoMeds(ctx) || isElderlyHighRiskForSu(ctx, suId)) return false;
      if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || hasPlannedSurgery(ctx) || hasHepaticImpairment(ctx) || isOnDialysis(ctx)) {
        return false;
      }
      const egfr = getEffectiveEgfr(ctx);
      if (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')) return false;
      if (!isTakingCanonical(ctx, suId)) return false;
      if (!isStartingNewCardiorenalAgent(ctx)) return false;
      const hba1c = need(ctx, 'hba1c');
      return hba1c !== undefined && hba1c < thFor('hba1c', 'dm2.hba1c.target_older_very_complex');
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, suId);
      const target = resolveTargetRecDrug(suId, med);
      const hba1c = need(ctx, 'hba1c')!;
      return {
        id: `rec_dm2_cardiorenal_addon_reduce_${suId}`,
        module: 'dm2',
        tier: 'An toàn & Xuống thang điều trị',
        tierOrder: 2,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose: 'Giảm một nửa liều hoặc cân nhắc ngừng Sulfonylurea khi phối hợp thêm SGLT2i / GLP-1 RA',
        title: `Giảm liều / cân nhắc ngừng ${target.drugNameVi} khi thêm thuốc bảo vệ tim–thận (HbA1c ${hba1c.toFixed(1)}%)`,
        rationale:
          `KDIGO 2022: Khi bổ sung SGLT2i hoặc GLP-1 RA vì chỉ định bảo vệ tim–thận ở bệnh nhân có HbA1c đạt hoặc gần đạt đích (${hba1c.toFixed(1)}%), cần chủ động giảm liều hoặc ngừng ${target.drugNameVi} để phòng hạ đường huyết cộng gộp.`,
        gates: [],
        citationIds: ['kdigo.dm2.2022.sglt2_hypo_su_adjust'],
        priority: 89
      };
    },
    citationIds: ['kdigo.dm2.2022.sglt2_hypo_su_adjust']
  })),
  ...BASAL_OR_PREMIX_IDS.map((insId): Rule => ({
    id: `dm2.outpatient.cardiorenal_addon_reduce_${insId}`,
    module: 'dm2',
    nameVi: `Giảm nhẹ liều ${insId} khi bổ sung SGLT2i / GLP-1 RA trên nền đường huyết đã đạt đích`,
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (shouldDeintensifyHypoMeds(ctx) || hasPlannedSurgery(ctx)) return false;
      if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (!isTakingCanonical(ctx, insId)) return false;
      if (!isStartingNewCardiorenalAgent(ctx)) return false;
      const hba1c = need(ctx, 'hba1c');
      return hba1c !== undefined && hba1c <= thFor('hba1c', 'dm2.hba1c.target_standard');
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, insId);
      const target = resolveTargetRecDrug(insId, med);
      const reducePct = thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');
      const hba1c = need(ctx, 'hba1c')!;
      return {
        id: `rec_dm2_cardiorenal_addon_reduce_${insId}`,
        module: 'dm2',
        tier: 'An toàn & Xuống thang điều trị',
        tierOrder: 2,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose: `Giảm khoảng ${reducePct}% liều ${target.drugNameVi} khi khởi trị thêm SGLT2i / GLP-1 RA trên nền HbA1c ${hba1c.toFixed(1)}%`,
        title: `Giảm ${reducePct}% liều ${target.drugNameVi} khi bổ sung thuốc bảo vệ tim–thận (HbA1c ${hba1c.toFixed(1)}%)`,
        rationale:
          `KDIGO 2022 & BYT 5481/2020: Khi khởi trị thêm SGLT2i hoặc GLP-1 RA ở bệnh nhân đang dùng insulin đã đạt đích HbA1c, cần giảm trước ~${reducePct}% liều insulin nền để tránh hạ đường huyết.`,
        gates: [],
        citationIds: ['kdigo.dm2.2022.sglt2_hypo_su_adjust', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
        priority: 88
      };
    },
    citationIds: ['kdigo.dm2.2022.sglt2_hypo_su_adjust', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  }))
];

export const dm2SuCoRxAdjustRules: Rule[] = [
  ...elderlyUnsafeSuReplaceRules,
  ...earlyInsulinSuAdjustRules,
  ...cardiorenalAddonHypoPreventionRules
];
