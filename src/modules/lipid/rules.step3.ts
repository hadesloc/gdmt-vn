/**
 * GDMT-VN Lipid Module - Step 3 (PCSK9i / Bempedoic Acid) Escalation Rules
 * Phân quyền: Agent I5 (Round 3 Remediation — split from rules.escalation.ts)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  evaluateLipidRiskBundle,
  findRawMedsWithComponent,
  formatChol,
  formatTargetLdl,
  getActiveStatin,
  hasAscvdEquivalent,
  hasClinicalFh,
  hasIsolatedHfWithoutStatinIndication,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  hasPcsk9,
  isClass2bExtremeOnlyUnmet,
  isElevatedUrateOrGout,
  pickSafePcsk9
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function isMaxStatinPlusEzeUncontrolled(ctx: RuleContext): boolean {
  if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
  const safety = assessStatinSafety(ctx);
  if (safety.hardBlockedForStatinInit) return false;
  if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;

  const activeStatin = getActiveStatin(ctx);
  if (
    !activeStatin ||
    activeStatin.hasDoseViolation ||
    !(activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose)
  ) {
    return false;
  }
  const hasOrBypassedEze = hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe');
  if (!hasOrBypassedEze || hasPcsk9(ctx)) return false;

  const targetInfo = evaluateLdlTargetForPatient(ctx);
  if (!targetInfo || targetInfo.isTargetAchieved) return false;

  return (
    targetInfo.riskTier === 'extreme' ||
    targetInfo.riskTier === 'very_high' ||
    targetInfo.riskTier === 'high'
  );
}

export const lipidStep3Rules: Rule[] = [
  {
    id: 'lipid.step3.maintain_statin',
    module: 'lipid',
    nameVi: 'Bước 3: Duy trì Statin nền tối đa dung nạp khi nâng bậc bước 3',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.pcsk9_add_on_secondary'],
    when: (ctx) => isMaxStatinPlusEzeUncontrolled(ctx),
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return null;
      const warnings = buildCommonLipidWarnings(ctx, {
        isStatin: true,
        drugId: activeStatin.drugId
      });
      return {
        id: 'rec_lipid_step3_continue_statin',
        module: 'lipid',
        tier: 'Bước 1–2 — Duy trì phác đồ nền Statin + Ezetimibe',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: activeStatin.rawDrugId,
        title: `Tiếp tục duy trì ${activeStatin.displayName} liều tối đa dung nạp`,
        rationale: 'Giữ vững nền tảng Statin tối đa an toàn khi nâng bậc phối hợp bước 3.',
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.pcsk9_add_on_secondary'],
        priority: 86
      };
    }
  },

  {
    id: 'lipid.step3.maintain_ezetimibe',
    module: 'lipid',
    nameVi: 'Bước 3: Duy trì Ezetimibe khi bổ sung thuốc hạ lipid bậc 3',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2019.pcsk9_add_on_secondary'],
    when: (ctx) => {
      if (!isMaxStatinPlusEzeUncontrolled(ctx)) return false;
      if (!hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;
      const activeStatin = getActiveStatin(ctx);
      const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) => m.rawDrugId !== activeStatin?.rawDrugId && !hasLipidDrugAllergy(ctx, m.rawDrugId)
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
        id: 'rec_lipid_step3_continue_ezetimibe',
        module: 'lipid',
        tier: 'Bước 1–2 — Duy trì phác đồ nền Statin + Ezetimibe',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: separateEze.rawDrugId,
        dose: separateEze.isFdc ? undefined : `${ezeDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${separateEze.displayName}${separateEze.isFdc ? '' : ` ${ezeDose} mg/ngày`} trong phác đồ phối hợp đa cơ chế`,
        rationale: 'Tiếp tục Ezetimibe cùng Statin tối đa dung nạp khi bổ sung thuốc bước 3.',
        gates: [],
        citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2019.pcsk9_add_on_secondary'],
        priority: 85
      };
    }
  },

  {
    id: 'lipid.step3.add_pcsk9i',
    module: 'lipid',
    nameVi: 'Bước 3: Bổ sung thuốc ức chế PCSK9 ở nhóm nguy cơ rất cao / FH',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2019.pcsk9_add_on_secondary',
      'esc.lipid.2019.pcsk9_fh_very_high',
      'esc.lipid.2019.pcsk9_primary_very_high_no_fh',
      'fda.evolocumab.dose',
      'acc.lipid.2026.alirocumab_dose',
      'fda.inclisiran.dose'
    ],
    when: (ctx) => {
      if (!isMaxStatinPlusEzeUncontrolled(ctx)) return false;
      if (!pickSafePcsk9(ctx)) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo) return false;
      return (
        targetInfo.riskTier === 'extreme' ||
        targetInfo.riskTier === 'very_high' ||
        (targetInfo.riskTier === 'high' && (hasClinicalFh(ctx) || hasAscvdEquivalent(ctx)))
      );
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const bundle = evaluateLipidRiskBundle(ctx);
      const chosen = pickSafePcsk9(ctx);
      if (ldl === undefined || !bundle || !chosen) return null;
      const { targetInfo } = bundle;
      const safety = assessStatinSafety(ctx);

      const evoBiweekly = thFor('dose_mg', 'lipid.dose.evolocumab_biweekly');
      const evoMonthly = thFor('dose_mg', 'lipid.dose.evolocumab_monthly');
      const aliStart = thFor('dose_mg', 'lipid.dose.alirocumab_start');
      const aliHigh = thFor('dose_mg', 'lipid.dose.alirocumab_high');
      const aliMonthly = thFor('dose_mg', 'lipid.dose.alirocumab_monthly');
      const inclisiranDose = thFor('dose_mg', 'lipid.dose.inclisiran_standard');
      const triplePct = thFor('ldl_reduction_pct', 'lipid.reduction.pcsk9_high_statin_ezetimibe');
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      const isSecondaryOrFh = hasAscvdEquivalent(ctx) || hasClinicalFh(ctx);
      const isClass2bExtreme = isClass2bExtremeOnlyUnmet(ctx, targetInfo);
      const action =
        isSecondaryOrFh && !isClass2bExtreme && !safety.onDialysis && !bundle.isUsStandardRiskAscvd
          ? 'START'
          : 'CONSIDER';

      let doseText = `${evoBiweekly} mg tiêm dưới da mỗi 2 tuần (hoặc ${evoMonthly} mg mỗi tháng)`;
      let doseCid = 'fda.evolocumab.dose';
      if (chosen.drugId === 'alirocumab') {
        doseText = `${aliStart}–${aliHigh} mg tiêm dưới da mỗi 2 tuần (hoặc ${aliMonthly} mg mỗi 4 tuần)`;
        doseCid = 'acc.lipid.2026.alirocumab_dose';
      } else if (chosen.drugId === 'inclisiran') {
        doseText = `${inclisiranDose} mg tiêm dưới da ban đầu, nhắc lại sau 3 tháng và mỗi 6 tháng`;
        doseCid = 'fda.inclisiran.dose';
      }

      const warnings: string[] = [];
      if (safety.onDialysis) {
        warnings.push(
          'Bệnh nhân đang lọc máu chu kỳ: Các thử nghiệm FOURIER và ODYSSEY OUTCOMES loại trừ bệnh nhân suy thận giai đoạn cuối lọc máu; quyết định phối hợp PCSK9i cần hội chẩn chuyên khoa Tim mạch – Thận học.'
        );
      }
      if (hasLipidDrugAllergy(ctx, 'ezetimibe')) {
        warnings.push(
          'Bệnh nhân có tiền sử dị ứng Ezetimibe: Bỏ qua Bước 2 (Ezetimibe) và nâng bậc trực tiếp lên thuốc ức chế PCSK9.'
        );
      }

      const cids = isSecondaryOrFh
        ? [
            'esc.lipid.2019.pcsk9_add_on_secondary',
            'esc.lipid.2019.pcsk9_fh_very_high',
            doseCid,
            'acc.lipid.2026.alirocumab_dose',
            'fda.inclisiran.dose'
          ]
        : ['esc.lipid.2019.pcsk9_primary_very_high_no_fh', doseCid];
      if (bundle.isUsStandardRiskAscvd) {
        cids.push('acc.lipid.2026.ascvd_not_very_high_70');
      }
      if (isClass2bExtreme) {
        cids.push('esc.lipid.2019.target_recurrent_acs', 'esc.lipid.2025.extreme_risk_polyvascular');
      }

      return {
        id: 'rec_lipid_step3_add_pcsk9i',
        module: 'lipid',
        tier: 'Bước 3 — Bổ sung ức chế PCSK9',
        tierOrder: 3,
        action,
        drugId: chosen.drugId,
        dose: doseText,
        title:
          action === 'START'
            ? `Bổ sung thuốc ức chế PCSK9 (${chosen.nameVi}) khi phác đồ đường uống tối đa chưa đạt đích`
            : `Cân nhắc bổ sung thuốc ức chế PCSK9 (${chosen.nameVi}) sau thảo luận lợi ích – chi phí`,
        rationale:
          `Trên nền điều trị đường uống tối đa dung nạp nhưng LDL-C (${ldlDisplay}) vẫn chưa đạt đích (< ${targetDisplay}). ` +
          `Bổ sung ${chosen.nameVi} (${doseText}; lựa chọn nhóm PCSK9 gồm Evolocumab ${evoBiweekly} mg, Alirocumab ${aliStart}–${aliHigh} mg hoặc Inclisiran ${inclisiranDose} mg) giúp giảm tổng cộng ~${triplePct}% LDL-C.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: dedupCitations(cids),
        priority: action === 'START' ? 88 : 79
      };
    }
  },

  {
    id: 'lipid.step3.high_non_fh_escalation',
    module: 'lipid',
    nameVi: 'Bước 3 nhóm nguy cơ cao không kèm FH/ASCVD: Bempedoic acid & Rà soát chuyên khoa',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2025.non_statin_intolerance_combo',
      'fda.bempedoic.dose',
      'esc.lipid.2019.target_high'
    ],
    when: (ctx) => {
      if (!isMaxStatinPlusEzeUncontrolled(ctx)) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      return Boolean(
        targetInfo &&
          targetInfo.riskTier === 'high' &&
          !hasClinicalFh(ctx) &&
          !hasAscvdEquivalent(ctx)
      );
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (ldl === undefined || !targetInfo) return null;
      const safety = assessStatinSafety(ctx);

      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      const canUseBempedoic =
        ctx.settings.profile !== 'VN' &&
        !safety.onDialysis &&
        !hasMed(ctx, 'bempedoic_acid') &&
        !hasLipidDrugAllergy(ctx, 'bempedoic_acid') &&
        !isElevatedUrateOrGout(ctx) &&
        !hasLipidFlag(ctx, 'tendonRuptureHistory');

      if (canUseBempedoic) {
        return {
          id: 'rec_lipid_high_non_fh_consider_bempedoic',
          module: 'lipid',
          tier: 'Bước 3 — Tối ưu hóa hạ LDL-C nhóm nguy cơ cao',
          tierOrder: 3,
          action: 'CONSIDER',
          drugId: 'bempedoic_acid',
          dose: `${bempDose} mg 1 lần/ngày`,
          title: `Cân nhắc bổ sung Bempedoic acid (${bempDose} mg/ngày) và rà soát tuân thủ khi Statin + Ezetimibe chưa đạt đích`,
          rationale: `Bệnh nhân nguy cơ cao không kèm FH có LDL-C ${ldlDisplay} (mục tiêu < ${targetDisplay}) dù đã tối ưu Statin + Ezetimibe; rà soát tuân thủ, sàng lọc FH/Lp(a) và cân nhắc bổ sung Bempedoic acid ${bempDose} mg/ngày.`,
          gates: [],
          citationIds: ['esc.lipid.2025.non_statin_intolerance_combo', 'fda.bempedoic.dose'],
          priority: 78
        };
      }

      return {
        id: 'rec_lipid_high_non_fh_specialist',
        module: 'lipid',
        tier: 'Bước 3 — Hội chẩn chuyên khoa Rối loạn Lipid',
        tierOrder: 3,
        action: 'MONITOR',
        title: `Rà soát tuân thủ điều trị, tầm soát FH / Lp(a) và hội chẩn chuyên khoa (LDL-C ${ldlDisplay} ≥ ${targetDisplay})`,
        rationale: `Bệnh nhân nguy cơ cao đang điều trị tối ưu nhưng LDL-C (${ldlDisplay}) chưa đạt đích < ${targetDisplay}; cần kiểm tra tuân thủ, xét nghiệm Lp(a), tính điểm DLCN và hội chẩn chuyên khoa.`,
        gates: [],
        citationIds: ['esc.lipid.2019.target_high', 'esc.lipid.2019.ezetimibe_add_on'],
        priority: 76
      };
    }
  }
];
