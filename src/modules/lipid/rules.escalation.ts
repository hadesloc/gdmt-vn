/**
 * GDMT-VN Lipid Module - Step 2 (Ezetimibe Add-On & US Standard-Risk ASCVD Sub-55) Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import { CHOL_CONVERSION_FACTOR } from '../../engine/units';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  evaluateLipidRiskBundle,
  formatChol,
  formatTargetLdl,
  getActiveStatin,
  hasAscvdEquivalent,
  hasIsolatedHfWithoutStatinIndication,
  hasLipidDrugAllergy,
  hasMed,
  isClass2bExtremeOnlyUnmet
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function isModerateStatinAtCap(ctx: RuleContext): boolean {
  const activeStatin = getActiveStatin(ctx);
  if (!activeStatin || activeStatin.hasDoseViolation || activeStatin.doseMg === undefined) {
    return false;
  }
  const modCapMap: Record<string, number> = {
    atorvastatin: thFor('dose_mg', 'lipid.dose.atorva_moderate_max'),
    rosuvastatin: thFor('dose_mg', 'lipid.dose.rosuva_moderate_max'),
    simvastatin: thFor('dose_mg', 'lipid.dose.simva_max'),
    pravastatin: thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max'),
    pitavastatin: thFor('dose_mg', 'lipid.dose.pita_max')
  };
  const cap = modCapMap[activeStatin.drugId];
  return cap !== undefined && activeStatin.doseMg >= cap;
}

function isStep2Eligible(ctx: RuleContext): boolean {
  if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
  const safety = assessStatinSafety(ctx);
  if (safety.hardBlockedForStatinInit) return false;
  if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;
  if (hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;

  const activeStatin = getActiveStatin(ctx);
  if (!activeStatin || activeStatin.hasDoseViolation || hasMed(ctx, 'ezetimibe')) {
    return false;
  }

  const targetInfo = evaluateLdlTargetForPatient(ctx);
  if (!targetInfo || targetInfo.isTargetAchieved) return false;

  if (targetInfo.riskTier === 'moderate') {
    return isModerateStatinAtCap(ctx);
  }
  if (
    targetInfo.riskTier !== 'extreme' &&
    targetInfo.riskTier !== 'very_high' &&
    targetInfo.riskTier !== 'high'
  ) {
    return false;
  }
  return activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose;
}

export const lipidEscalationRules: Rule[] = [
  {
    id: 'lipid.step2.maintain_statin',
    module: 'lipid',
    nameVi: 'Bước 2: Duy trì Statin nền tối đa dung nạp khi phối hợp Ezetimibe',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.ezetimibe_add_on'],
    when: (ctx) => isStep2Eligible(ctx),
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return null;
      const warnings = buildCommonLipidWarnings(ctx, {
        isStatin: true,
        drugId: activeStatin.drugId
      });
      return {
        id: 'rec_lipid_step2_continue_statin',
        module: 'lipid',
        tier: 'Bước 1 — Duy trì Statin nền tối đa dung nạp',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: activeStatin.rawDrugId,
        title: `Tiếp tục duy trì ${activeStatin.displayName} liều tối đa dung nạp làm nền tảng`,
        rationale:
          'Duy trì liều statin tối đa an toàn hiện tại và phối hợp thêm Ezetimibe thay vì ngừng statin.',
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.ezetimibe_add_on'],
        priority: 87
      };
    }
  },

  {
    id: 'lipid.step2.add_ezetimibe',
    module: 'lipid',
    nameVi: 'Bước 2: Phối hợp Ezetimibe khi Statin tối đa dung nạp chưa đạt đích LDL-C',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2019.ezetimibe_add_on',
      'acc.lipid.2026.ezetimibe_secondary_very_high',
      'acc.lipid.2026.ascvd_not_very_high_70',
      'acc.lipid.2026.ezetimibe_outpatient_addon',
      'esc.ckd.2026.dialysis_ascvd_statin_consider',
      'fda.ezetimibe.bile_acid_sequestrant'
    ],
    when: (ctx) => isStep2Eligible(ctx),
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const bundle = evaluateLipidRiskBundle(ctx);
      if (ldl === undefined || !bundle) return null;
      const { targetInfo } = bundle;

      const safety = assessStatinSafety(ctx);
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const comboPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high_ezetimibe');
      const beforeH = thFor('interval_hours', 'lipid.dose.ezetimibe_sequestrant_before_h');
      const afterH = thFor('interval_hours', 'lipid.dose.ezetimibe_sequestrant_after_h');
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      const isConsiderOnly =
        safety.onDialysis ||
        isClass2bExtremeOnlyUnmet(ctx, targetInfo) ||
        targetInfo.riskTier === 'moderate';
      const action = isConsiderOnly ? 'CONSIDER' : 'START';

      const warnings = buildCommonLipidWarnings(ctx, { isStatin: false, drugId: 'ezetimibe' });
      const cids = [
        'esc.lipid.2019.ezetimibe_add_on',
        hasAscvdEquivalent(ctx)
          ? bundle.isUsStandardRiskAscvd
            ? 'acc.lipid.2026.ascvd_not_very_high_70'
            : 'acc.lipid.2026.ezetimibe_secondary_very_high'
          : 'acc.lipid.2026.ezetimibe_outpatient_addon'
      ];
      if (safety.onDialysis) {
        cids.push('esc.ckd.2026.dialysis_ascvd_statin_consider');
        warnings.push(
          'Bệnh nhân đang lọc máu chu kỳ kèm ASCVD: Cá thể hóa phối hợp Ezetimibe trên nền statin liều trung bình (tham chiếu thử nghiệm SHARP; không ép tăng statin cường độ cao).'
        );
      }
      if (isClass2bExtremeOnlyUnmet(ctx, targetInfo)) {
        cids.push('esc.lipid.2019.target_recurrent_acs', 'esc.lipid.2025.extreme_risk_polyvascular');
      }
      if (safety.hasBileAcidSequestrant) {
        warnings.push(
          `Đang dùng nhựa gắn acid mật: uống Ezetimibe trước ≥ ${beforeH} giờ hoặc sau ≥ ${afterH} giờ.`
        );
        cids.push('fda.ezetimibe.bile_acid_sequestrant');
      }

      return {
        id: 'rec_lipid_step2_add_ezetimibe',
        module: 'lipid',
        tier: 'Bước 2 — Phối hợp Ezetimibe trên nền Statin tối đa dung nạp',
        tierOrder: 2,
        action,
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg 1 lần/ngày`,
        title:
          action === 'CONSIDER'
            ? `Cân nhắc phối hợp thêm Ezetimibe (${ezeDose} mg/ngày) để hướng tới đích LDL-C < ${targetDisplay}`
            : `Phối hợp thêm Ezetimibe (${ezeDose} mg/ngày) khi Statin tối đa dung nạp chưa đạt đích LDL-C`,
        rationale:
          `Bệnh nhân đang dùng statin liều tối đa an toàn nhưng LDL-C (${ldlDisplay}) chưa đạt mục tiêu (< ${targetDisplay}); bổ sung Ezetimibe ${ezeDose} mg/ngày giúp hạ tổng cộng ~${comboPct}% LDL-C${
            safety.hasBileAcidSequestrant
              ? ` (uống cách nhựa gắn acid mật trước ≥ ${beforeH} giờ hoặc sau ≥ ${afterH} giờ)`
              : ''
          }.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: dedupCitations(cids),
        priority: action === 'START' ? 89 : 81
      };
    }
  },

  {
    id: 'lipid.step2.us_standard_ascvd_consider_sub55',
    module: 'lipid',
    nameVi: 'Hồ sơ US — ASCVD nguy cơ chuẩn đã đạt < 70 mg/dL nhưng ≥ 55 mg/dL: Cân nhắc tối ưu sâu hơn',
    setting: 'outpatient',
    profiles: ['US'],
    citationIds: ['acc.lipid.2026.ascvd_not_very_high_70', 'esc.lipid.2019.target_very_high', 'esc.lipid.2019.ezetimibe_add_on'],
    when: (ctx) => {
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.onDialysis) return false;
      if (hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin || activeStatin.hasDoseViolation) return false;
      const bundle = evaluateLipidRiskBundle(ctx);
      if (!bundle || !bundle.isUsStandardRiskAscvd || !bundle.targetInfo.isTargetAchieved) {
        return false;
      }
      const ldl = need(ctx, 'ldl');
      if (ldl === undefined) return false;
      const vhMmol = thFor('ldl', 'lipid.target.very_high_ldl');
      const vhMgDl = thFor('ldl_mgdl', 'lipid.target.very_high_ldl_mgdl');
      return ctx.settings.units.lipid === 'mg_dL'
        ? Math.round(ldl * CHOL_CONVERSION_FACTOR) >= vhMgDl
        : ldl >= vhMmol;
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      if (ldl === undefined) return null;
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const usTarget = thFor('ldl_mgdl', 'lipid.target.high_ldl_mgdl');
      const vhTarget = thFor('ldl_mgdl', 'lipid.target.very_high_ldl_mgdl');
      const ldlDisplay = formatChol(ldl, ctx);
      return {
        id: 'rec_lipid_us_standard_ascvd_consider_sub55',
        module: 'lipid',
        tier: 'Tối ưu hóa sâu tùy chọn theo ACC/AHA 2026 (COR 2a)',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg 1 lần/ngày`,
        title: `Đã đạt ngưỡng chuẩn ACC/AHA (< ${usTarget} mg/dL) — Có thể cân nhắc phối hợp Ezetimibe (${ezeDose} mg/ngày) nếu muốn hạ sâu < ${vhTarget} mg/dL`,
        rationale: `Theo ACC/AHA 2026, bệnh nhân ASCVD lâm sàng chưa thuộc nhóm nguy cơ rất cao đã đạt ngưỡng mục tiêu chính < ${usTarget} mg/dL (LDL-C hiện tại ${ldlDisplay}); có thể thảo luận cùng người bệnh cân nhắc bổ sung Ezetimibe ${ezeDose} mg/ngày để hạ sâu hơn (< ${vhTarget} mg/dL) giảm thêm nguy cơ tồn dư.`,
        gates: [],
        citationIds: [
          'acc.lipid.2026.ascvd_not_very_high_70',
          'esc.lipid.2019.target_very_high',
          'esc.lipid.2019.ezetimibe_add_on'
        ],
        priority: 62
      };
    }
  }
];
