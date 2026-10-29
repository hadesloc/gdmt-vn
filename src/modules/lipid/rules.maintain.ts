/**
 * GDMT-VN Lipid Module - Goal Maintenance, Secondary Targets (Non-HDL-C / ApoB) & HF Continuation Rules
 * Phân quyền: Agent I5 (Round 3 Remediation)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  evaluateSecondaryTargets,
  findRawMedsWithComponent,
  formatChol,
  formatTargetLdl,
  getActiveLipidMeds,
  getActivePcsk9Ids,
  getActiveStatin,
  hasAscvdEquivalent,
  hasIsolatedHfWithoutStatinIndication,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  hasPcsk9,
  isElevatedUrateOrGout
} from './helpers';

function isGoalAchievedForMaintenance(ctx: RuleContext): boolean {
  const safety = assessStatinSafety(ctx);
  if (
    safety.isReproContra ||
    safety.hasSevereAlt ||
    safety.hasRhabdoRiskCk ||
    safety.hasModerateCk ||
    safety.hasAcutePancreatitis
  ) {
    return false;
  }
  if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;

  if (hasIsolatedHfWithoutStatinIndication(ctx)) {
    const activeStatin = getActiveStatin(ctx);
    return activeStatin !== null && !activeStatin.hasDoseViolation;
  }

  const tg = need(ctx, 'tg');
  const tgFriedewald = thFor('tg', 'lipid.tg.friedewald_invalid');
  if (
    hasAscvdEquivalent(ctx) &&
    getActiveLipidMeds(ctx).length === 0 &&
    tg !== undefined &&
    tg > tgFriedewald
  ) {
    return false;
  }

  const targetInfo = evaluateLdlTargetForPatient(ctx);
  return Boolean(targetInfo && targetInfo.isTargetAchieved);
}

export const lipidMaintainRules: Rule[] = [
  {
    id: 'lipid.secondary_target.non_hdl_apob',
    module: 'lipid',
    nameVi: 'Đã đạt LDL-C nhưng chưa đạt mục tiêu thứ phát Non-HDL-C / ApoB: Tối ưu hóa thêm',
    citationIds: [
      'esc.lipid.2019.target_non_hdl',
      'esc.lipid.2019.target_apob',
      'esc.lipid.2019.friedewald_tg_4_5'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit) return false;
      if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo || !targetInfo.isTargetAchieved) return false;
      return evaluateSecondaryTargets(ctx, targetInfo.riskTier).hasAnyUnmet;
    },
    produce: (ctx) => {
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo) return null;
      const sec = evaluateSecondaryTargets(ctx, targetInfo.riskTier);
      const activeStatin = getActiveStatin(ctx);
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const tg = need(ctx, 'tg');
      const tgFriedewald = thFor('tg', 'lipid.tg.friedewald_invalid');
      const suggestEze =
        activeStatin !== null &&
        !activeStatin.hasDoseViolation &&
        !hasMed(ctx, 'ezetimibe') &&
        !hasLipidDrugAllergy(ctx, 'ezetimibe');

      const details: string[] = [];
      if (sec.isNonHdlUnmet && sec.nonHdlMmol !== undefined && sec.nonHdlTargetMmol !== undefined) {
        details.push(
          `Non-HDL-C ${formatChol(sec.nonHdlMmol, ctx)} (đích < ${formatChol(
            sec.nonHdlTargetMmol,
            ctx
          )})`
        );
      }
      if (sec.isApobUnmet && sec.apobMgDl !== undefined && sec.apobTargetMgDl !== undefined) {
        details.push(`ApoB ${sec.apobMgDl} mg/dL (đích < ${sec.apobTargetMgDl} mg/dL)`);
      }

      const cids = ['esc.lipid.2019.target_non_hdl', 'esc.lipid.2019.target_apob'];
      let friedewaldNote = '';
      if (tg !== undefined && tg > tgFriedewald) {
        cids.push('esc.lipid.2019.friedewald_tg_4_5');
        friedewaldNote = ` Đặc biệt khi TG > ${tgFriedewald} mmol/L, công thức Friedewald làm LDL-C thấp giả tạo nên Non-HDL-C và ApoB phản ánh chính xác hơn nguy cơ xơ vữa.`;
      }

      return {
        id: 'rec_lipid_secondary_nonhdl_apob_optimize',
        module: 'lipid',
        tier: 'Mục tiêu thứ phát — Non-HDL-C & ApoB tồn dư',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: suggestEze ? 'ezetimibe' : undefined,
        dose: suggestEze ? `${ezeDose} mg 1 lần/ngày` : undefined,
        title: `Cân nhắc tối ưu hóa điều trị do chưa đạt mục tiêu thứ phát (${details.join('; ')})`,
        rationale: `Dù LDL-C đã dưới ngưỡng chính, gánh nặng hạt lipoprotein sinh xơ vữa vẫn cao (${details.join(
          '; '
        )}) — thường gặp ở tăng triglyceride, đái tháo đường hoặc béo phì; cân nhắc tối ưu liều statin và/hoặc phối hợp Ezetimibe.${friedewaldNote}`,
        gates: [],
        citationIds: Array.from(new Set(cids)),
        priority: 74
      };
    }
  },

  {
    id: 'lipid.goal.achieved_maintain',
    module: 'lipid',
    nameVi: 'Đã đạt mục tiêu kép LDL-C: Tiếp tục duy trì Statin hiện tại',
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.monitoring_annual'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isGoalAchievedForMaintenance(ctx)) return false;
      const activeStatin = getActiveStatin(ctx);
      return activeStatin !== null && !activeStatin.hasDoseViolation;
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const ldl = need(ctx, 'ldl');
      if (!activeStatin) return null;
      const warnings = buildCommonLipidWarnings(ctx, {
        isStatin: true,
        drugId: activeStatin.drugId
      });

      if (hasIsolatedHfWithoutStatinIndication(ctx)) {
        return {
          id: 'rec_lipid_goal_achieved_continue',
          module: 'lipid',
          tier: 'Duy trì phác đồ Statin đang dung nạp ổn định',
          tierOrder: 3,
          action: 'CONTINUE',
          drugId: activeStatin.rawDrugId,
          title: `Tiếp tục duy trì ${activeStatin.displayName} liều hiện tại khi dung nạp tốt`,
          rationale:
            'Ở bệnh nhân suy tim đang điều trị ổn định bằng statin từ trước và không có tác dụng bất lợi, có thể tiếp tục duy trì phác đồ hiện tại.',
          gates: [],
          warnings: warnings.length ? warnings : undefined,
          citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.monitoring_annual'],
          priority: 70
        };
      }

      if (!targetInfo || ldl === undefined) return null;
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);
      return {
        id: 'rec_lipid_goal_achieved_continue',
        module: 'lipid',
        tier: 'Duy trì phác đồ đạt mục tiêu',
        tierOrder: 3,
        action: 'CONTINUE',
        drugId: activeStatin.rawDrugId,
        title: `Tiếp tục duy trì ${activeStatin.displayName} liều hiện tại (LDL-C đã đạt mục tiêu < ${targetDisplay})`,
        rationale: `LDL-C hiện tại (${ldlDisplay}) đã đạt đích điều trị (< ${targetDisplay}); tiếp tục duy trì đều đặn phác đồ hiện tại lâu dài để bảo vệ tim mạch bền vững.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.monitoring_annual'],
        priority: 70
      };
    }
  },

  {
    id: 'lipid.goal.achieved_maintain_ezetimibe',
    module: 'lipid',
    nameVi: 'Đã đạt mục tiêu kép LDL-C: Tiếp tục duy trì Ezetimibe hiện tại',
    citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2019.monitoring_annual'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isGoalAchievedForMaintenance(ctx)) return false;
      if (!hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;
      const activeStatin = getActiveStatin(ctx);
      const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) =>
          m.rawDrugId !== activeStatin?.rawDrugId &&
          !hasLipidDrugAllergy(ctx, m.rawDrugId) &&
          !(
            m.allComponents.includes('bempedoic_acid') &&
            (assessStatinSafety(ctx).onDialysis ||
              isElevatedUrateOrGout(ctx) ||
              hasLipidFlag(ctx, 'tendonRuptureHistory'))
          )
      );
      return Boolean(separateEze);
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) => m.rawDrugId !== activeStatin?.rawDrugId && !hasLipidDrugAllergy(ctx, m.rawDrugId)
      );
      if (!separateEze) return null;
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      return {
        id: 'rec_lipid_goal_achieved_continue_ezetimibe',
        module: 'lipid',
        tier: 'Duy trì phác đồ đạt mục tiêu',
        tierOrder: 3,
        action: 'CONTINUE',
        drugId: separateEze.rawDrugId,
        dose: separateEze.isFdc ? undefined : `${ezeDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${separateEze.displayName}${separateEze.isFdc ? '' : ` ${ezeDose} mg/ngày`} trong phác đồ đã đạt mục tiêu LDL-C`,
        rationale:
          'Không tự ý ngưng Ezetimibe khi LDL-C đã đạt mục tiêu để tránh tăng vọt LDL-C trở lại.',
        gates: [],
        citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2019.monitoring_annual'],
        priority: 69
      };
    }
  },

  {
    id: 'lipid.goal.achieved_maintain_pcsk9',
    module: 'lipid',
    nameVi: 'Đã đạt mục tiêu kép LDL-C: Tiếp tục duy trì thuốc ức chế PCSK9 hiện tại',
    citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary', 'esc.lipid.2019.monitoring_annual'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isGoalAchievedForMaintenance(ctx) &&
      hasPcsk9(ctx) &&
      getActivePcsk9Ids(ctx).some((id) => !hasLipidDrugAllergy(ctx, id)),
    produce: (ctx) => {
      const pcsk9Id = getActivePcsk9Ids(ctx).find((id) => !hasLipidDrugAllergy(ctx, id));
      if (!pcsk9Id) return null;
      return {
        id: 'rec_lipid_goal_achieved_continue_pcsk9',
        module: 'lipid',
        tier: 'Duy trì phác đồ đạt mục tiêu',
        tierOrder: 3,
        action: 'CONTINUE',
        drugId: pcsk9Id,
        title: `Tiếp tục duy trì ${pcsk9Id} khi đã đạt mục tiêu LDL-C`,
        rationale:
          'Các thử nghiệm FOURIER và ODYSSEY OUTCOMES chứng minh an toàn và lợi ích tim mạch khi hạ sâu LDL-C bền vững bằng PCSK9i; tiếp tục duy trì phác đồ hiện tại.',
        gates: [],
        citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary', 'esc.lipid.2019.monitoring_annual'],
        priority: 69
      };
    }
  },

  {
    id: 'lipid.goal.achieved_maintain_bempedoic',
    module: 'lipid',
    nameVi: 'Đã đạt mục tiêu kép LDL-C: Tiếp tục duy trì Bempedoic acid hiện tại',
    citationIds: ['esc.lipid.2025.bempedoic_statin_intolerance', 'fda.bempedoic.dose'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isGoalAchievedForMaintenance(ctx) || !hasMed(ctx, 'bempedoic_acid')) return false;
      const safety = assessStatinSafety(ctx);
      if (
        safety.onDialysis ||
        hasLipidDrugAllergy(ctx, 'bempedoic_acid') ||
        isElevatedUrateOrGout(ctx) ||
        hasLipidFlag(ctx, 'tendonRuptureHistory')
      ) {
        return false;
      }
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0];
      if (!bempMatch) return false;
      if (bempMatch.allComponents.includes('ezetimibe')) {
        return false;
      }
      return true;
    },
    produce: (ctx) => {
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0];
      if (!bempMatch) return null;
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      return {
        id: 'rec_lipid_goal_achieved_continue_bempedoic',
        module: 'lipid',
        tier: 'Duy trì phác đồ đạt mục tiêu',
        tierOrder: 3,
        action: 'CONTINUE',
        drugId: bempMatch.rawDrugId,
        dose: bempMatch.isFdc ? undefined : `${bempDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${bempMatch.displayName}${bempMatch.isFdc ? '' : ` ${bempDose} mg/ngày`} khi đã đạt mục tiêu LDL-C`,
        rationale:
          'Duy trì Bempedoic acid lâu dài khi dung nạp tốt để giữ ổn định mục tiêu LDL-C và theo dõi acid uric định kỳ.',
        gates: [],
        citationIds: ['esc.lipid.2025.bempedoic_statin_intolerance', 'fda.bempedoic.dose'],
        priority: 68
      };
    }
  }
];
