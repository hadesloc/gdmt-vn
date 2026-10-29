/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Xuống thang Điều trị (Deintensification) khi Hạ ĐH hoặc Quá chặt
 * Phân quyền: Agent F4
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  SU_IDS,
  computeIndividualizedHba1cTarget,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasDm2Context,
  hasHepaticImpairment,
  hasHypoglycemiaOrOvertreatment,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  resolveElderlyStatus,
  resolveTargetRecDrug
} from './helpers';

export function shouldDeintensifyHypoMeds(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'outpatient' || !hasDm2Context(ctx)) return false;
  if (
    isPregnant(ctx) ||
    isBreastfeeding(ctx) ||
    isActivelyHypoglycemic(ctx) ||
    evaluateHyperglycemicCrisis(ctx).isCrisis
  ) {
    return false;
  }
  const egfr = getEffectiveEgfr(ctx);
  const hasActionableMed =
    SU_IDS.some(
      (id) =>
        isTakingCanonical(ctx, id) &&
        !isOnDialysis(ctx) &&
        !hasHepaticImpairment(ctx) &&
        (egfr === undefined || egfr >= thFor('egfr', 'dm2.su_agi.egfr_contra'))
    ) ||
    isTakingAnyCanonical(ctx, ALL_INSULIN_IDS) ||
    extractBasalInsulinInfo(ctx).hasAnyInsulin;

  if (!hasActionableMed) return false;
  return hasHypoglycemiaOrOvertreatment(ctx);
}

function shouldHardStopSuOnDeintensify(ctx: RuleContext, suId?: string): boolean {
  if (suId === 'glibenclamide') return true;
  const elderly = resolveElderlyStatus(ctx);
  if (elderly === 'very_complex') return true;
  const hba1c = need(ctx, 'hba1c');
  const age = need(ctx, 'age');
  return Boolean(
    hba1c !== undefined &&
      hba1c < thFor('hba1c', 'dm2.hba1c.target_young') &&
      age !== undefined &&
      age >= thFor('age', 'dm2.elderly.age_threshold')
  );
}

const deintensifySuHardStopRules: Rule[] = SU_IDS.map((suId) => ({
  id: `dm2.outpatient.deintensify_stop_su_${suId}`,
  module: 'dm2',
  nameVi: `Ngừng ${suId} ở người cao tuổi suy yếu nặng hoặc kiểm soát đường huyết quá chặt / hạ đường huyết`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!shouldDeintensifyHypoMeds(ctx) || !shouldHardStopSuOnDeintensify(ctx, suId)) return false;
    if (hasPlannedSurgery(ctx) || hasHepaticImpairment(ctx) || isOnDialysis(ctx)) return false;
    const egfr = getEffectiveEgfr(ctx);
    if (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')) return false;
    return isTakingCanonical(ctx, suId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, suId);
    const target = resolveTargetRecDrug(suId, med);
    const hba1c = need(ctx, 'hba1c');
    const targetA1c = computeIndividualizedHba1cTarget(ctx);
    const isLowA1c = hba1c !== undefined && hba1c < targetA1c;
    const reasonTag = isLowA1c
      ? `Người cao tuổi suy yếu / HbA1c thấp ${hba1c.toFixed(1)}%`
      : 'Biến cố hạ đường huyết trên người cao tuổi nguy cơ cao';
    return {
      id: `rec_dm2_deintensify_stop_su_${suId}`,
      module: 'dm2',
      tier: 'An toàn & Xuống thang điều trị',
      tierOrder: 1,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `Xuống thang khẩn: NGỪNG ${target.drugNameVi} (${reasonTag})`,
      rationale:
        `ADA 2026 Ch. 13 (Khuyến cáo 13.14a): Ở người cao tuổi suy yếu/kỳ vọng sống hạn chế, có biến cố hạ đường huyết hoặc dùng Glibenclamide/HbA1c quá thấp, bắt buộc ngừng hẳn ${target.drugNameVi} thay vì chỉ giảm liều để phòng hạ đường huyết kéo dài đe dọa tính mạng.`,
      gates: [],
      citationIds: ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.older_overtreatment_su_insulin'],
      priority: 95
    };
  },
  citationIds: ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.older_overtreatment_su_insulin']
}));

export const dm2DeintensifyRules: Rule[] = [
  ...deintensifySuHardStopRules,
  {
    id: 'dm2.outpatient.deintensification',
    module: 'dm2',
    nameVi: 'Xuống thang thuốc nguy cơ hạ đường huyết khi điều trị quá mức hoặc sau biến cố hạ đường huyết',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => shouldDeintensifyHypoMeds(ctx) && !hasPlannedSurgery(ctx),
    produce: (ctx) => {
      const egfr = getEffectiveEgfr(ctx);
      const reducePct = thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');
      const activeSuId = SU_IDS.find(
        (id) =>
          isTakingCanonical(ctx, id) &&
          !isOnDialysis(ctx) &&
          !hasHepaticImpairment(ctx) &&
          (egfr === undefined || egfr >= thFor('egfr', 'dm2.su_agi.egfr_contra'))
      );

      if (activeSuId && !shouldHardStopSuOnDeintensify(ctx, activeSuId)) {
        const med = findActiveMedByCanonical(ctx, activeSuId);
        const target = resolveTargetRecDrug(activeSuId, med);
        return {
          id: 'rec_dm2_deintensification',
          module: 'dm2',
          tier: 'An toàn & Xuống thang điều trị',
          tierOrder: 4,
          action: 'REDUCE',
          drugId: target.drugId,
          drugNameVi: target.drugNameVi,
          dose: `Giảm một nửa liều hiện tại hoặc ngừng hẳn ${target.drugNameVi}`,
          title: `Xuống thang / Giảm liều hoặc ngừng ${target.drugNameVi} (Phòng ngừa hạ đường huyết)`,
          rationale:
            `ADA 2026 Ch. 13 (Khuyến cáo 13.14a): Khi có biến cố hạ đường huyết gần đây hoặc kiểm soát quá chặt dưới đích an toàn, chủ động giảm liều hoặc ngừng ${target.drugNameVi} để phòng ngừa hạ đường huyết kéo dài.`,
          gates: [],
          citationIds: ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.older_overtreatment_su_insulin'],
          priority: 94
        };
      }

      const basalInfo = extractBasalInsulinInfo(ctx);
      if (basalInfo.hasAnyInsulin || isTakingAnyCanonical(ctx, ALL_INSULIN_IDS)) {
        const insId = basalInfo.activeBasalDrugId || ALL_INSULIN_IDS.find((id) => isTakingCanonical(ctx, id)) || 'insulin_glargine';
        const insMed = findActiveMedByCanonical(ctx, insId);
        const target = resolveTargetRecDrug(insId, insMed);
        const currentUnits = basalInfo.basalDoseUnits;
        const reducedUnits =
          currentUnits !== undefined && currentUnits > 0
            ? Math.max(1, Math.round(currentUnits * (1 - reducePct / 100))) // qa-allow: unit-conversion - Tính liều giảm 20%
            : undefined;
        return {
          id: 'rec_dm2_deintensification',
          module: 'dm2',
          tier: 'An toàn & Xuống thang điều trị',
          tierOrder: 4,
          action: 'REDUCE',
          drugId: target.drugId,
          drugNameVi: target.drugNameVi,
          dose:
            reducedUnits !== undefined
              ? `Giảm ${reducePct}% tổng liều hiện tại (từ ${currentUnits} đơn vị xuống ~${reducedUnits} đơn vị/ngày)`
              : `Giảm ${reducePct}% tổng liều insulin hiện tại`,
          title: `Xuống thang ${target.drugNameVi}: Giảm ${reducePct}% liều để phòng ngừa hạ đường huyết`,
          rationale:
            `ADA 2026 Ch. 13 & BYT 5481/2020: Giảm ${reducePct}% liều ${target.drugNameVi} và đơn giản hóa phác đồ tiêm ở người bệnh vừa xảy ra hạ đường huyết hoặc kiểm soát quá chặt dưới ngưỡng an toàn.`,
          gates: [],
          citationIds: ['ada.dm2.2026.older_deintensification', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
          priority: 94
        };
      }

      return {
        id: 'rec_dm2_deintensification',
        module: 'dm2',
        tier: 'An toàn & Xuống thang điều trị',
        tierOrder: 4,
        action: 'REDUCE',
        title: 'Xuống thang điều trị & Nới lỏng mục tiêu đường huyết ở người cao tuổi suy yếu',
        rationale:
          'ADA 2026 Ch. 13: Đơn giản hóa phác đồ, loại bỏ thuốc gây hạ đường huyết và tránh thêm thuốc mới không cần thiết ở người bệnh suy yếu / HbA1c thấp.',
        gates: [],
        citationIds: ['ada.dm2.2026.older_deintensification'],
        priority: 90
      };
    },
    citationIds: ['ada.dm2.2026.older_deintensification', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  },
  {
    id: 'dm2.outpatient.deintensification_insulin_companion',
    module: 'dm2',
    nameVi: 'Giảm liều Insulin nền đồng thời khi bệnh nhân dùng phối hợp cả Sulfonylurea và Insulin có hạ đường huyết',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!shouldDeintensifyHypoMeds(ctx) || hasPlannedSurgery(ctx)) return false;
      const egfr = getEffectiveEgfr(ctx);
      const activeSuId = SU_IDS.find(
        (id) =>
          isTakingCanonical(ctx, id) &&
          !isOnDialysis(ctx) &&
          !hasHepaticImpairment(ctx) &&
          (egfr === undefined || egfr >= thFor('egfr', 'dm2.su_agi.egfr_contra'))
      );
      if (!activeSuId || shouldHardStopSuOnDeintensify(ctx, activeSuId)) return false;
      return extractBasalInsulinInfo(ctx).hasAnyInsulin || isTakingAnyCanonical(ctx, ALL_INSULIN_IDS);
    },
    produce: (ctx) => {
      const reducePct = thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');
      const basalInfo = extractBasalInsulinInfo(ctx);
      const insId = basalInfo.activeBasalDrugId || ALL_INSULIN_IDS.find((id) => isTakingCanonical(ctx, id)) || 'insulin_glargine';
      const insMed = findActiveMedByCanonical(ctx, insId);
      const target = resolveTargetRecDrug(insId, insMed);
      const currentUnits = basalInfo.basalDoseUnits;
      const reducedUnits =
        currentUnits !== undefined && currentUnits > 0
          ? Math.max(1, Math.round(currentUnits * (1 - reducePct / 100))) // qa-allow: unit-conversion - Tính liều giảm 20%
          : undefined;
      return {
        id: 'rec_dm2_deintensification_insulin',
        module: 'dm2',
        tier: 'An toàn & Xuống thang điều trị',
        tierOrder: 4,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose:
          reducedUnits !== undefined
            ? `Giảm ${reducePct}% liều hiện tại (từ ${currentUnits} đơn vị xuống ~${reducedUnits} đơn vị/ngày)`
            : `Giảm ${reducePct}% tổng liều insulin hiện tại`,
        title: `Giảm ${reducePct}% liều ${target.drugNameVi} (Phối hợp xuống thang cùng Sulfonylurea)`,
        rationale:
          `ADA 2026 Ch. 13 & BYT 5481/2020: Trên bệnh nhân dùng đồng thời cả Sulfonylurea và Insulin có hạ đường huyết/quá chặt, cần đồng thời giảm ${reducePct}% liều ${target.drugNameVi} và theo dõi sát đường huyết đói.`,
        gates: [],
        citationIds: ['ada.dm2.2026.older_deintensification', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
        priority: 93
      };
    },
    citationIds: ['ada.dm2.2026.older_deintensification', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  }
];
