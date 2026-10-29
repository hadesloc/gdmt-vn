/**
 * GDMT-VN Lipid Module - Step 4 Refractory Triple-Therapy Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  findRawMedsWithComponent,
  formatChol,
  formatTargetLdl,
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

function isStep4TripleUncontrolled(ctx: RuleContext): boolean {
  if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
  const safety = assessStatinSafety(ctx);
  if (safety.hardBlockedForStatinInit) return false;
  if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;

  const activeStatin = getActiveStatin(ctx);
  if (!activeStatin || activeStatin.hasDoseViolation) return false;
  const hasOrBypassedEze = hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe');
  if (!hasOrBypassedEze || !hasPcsk9(ctx)) return false;

  const targetInfo = evaluateLdlTargetForPatient(ctx);
  return Boolean(targetInfo && !targetInfo.isTargetAchieved);
}

export const lipidStep4Rules: Rule[] = [
  {
    id: 'lipid.step4.maintain_statin',
    module: 'lipid',
    nameVi: 'Bước 4: Duy trì Statin nền trong phác đồ 3 thuốc hạ LDL-C',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.pcsk9_add_on_secondary'],
    when: (ctx) => isStep4TripleUncontrolled(ctx),
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return null;
      const warnings = buildCommonLipidWarnings(ctx, {
        isStatin: true,
        drugId: activeStatin.drugId
      });
      return {
        id: 'rec_lipid_step4_continue_statin',
        module: 'lipid',
        tier: 'Phác đồ 3 thuốc — Duy trì nền tảng hạ LDL-C',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: activeStatin.rawDrugId,
        title: `Tiếp tục duy trì ${activeStatin.displayName} liều tối đa dung nạp trong phác đồ đa cơ chế`,
        rationale: 'Không ngừng Statin nền khi đang dùng phác đồ 3 thuốc hạ LDL-C.',
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.pcsk9_add_on_secondary'],
        priority: 86
      };
    }
  },

  {
    id: 'lipid.step4.maintain_ezetimibe',
    module: 'lipid',
    nameVi: 'Bước 4: Duy trì Ezetimibe trong phác đồ 3 thuốc hạ LDL-C',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2019.pcsk9_add_on_secondary'],
    when: (ctx) => {
      if (!isStep4TripleUncontrolled(ctx)) return false;
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
        id: 'rec_lipid_step4_continue_ezetimibe',
        module: 'lipid',
        tier: 'Phác đồ 3 thuốc — Duy trì nền tảng hạ LDL-C',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: separateEze.rawDrugId,
        dose: separateEze.isFdc ? undefined : `${ezeDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${separateEze.displayName}${separateEze.isFdc ? '' : ` ${ezeDose} mg/ngày`} trong phác đồ 3 thuốc`,
        rationale: 'Duy trì Ezetimibe phối hợp cùng Statin và thuốc ức chế PCSK9.',
        gates: [],
        citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2019.pcsk9_add_on_secondary'],
        priority: 85
      };
    }
  },

  {
    id: 'lipid.step4.maintain_pcsk9',
    module: 'lipid',
    nameVi: 'Bước 4: Duy trì thuốc ức chế PCSK9 trong phác đồ 3 thuốc hạ LDL-C',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary', 'fda.evolocumab.dose'],
    when: (ctx) => {
      if (!isStep4TripleUncontrolled(ctx)) return false;
      return getActivePcsk9Ids(ctx).some((id) => !hasLipidDrugAllergy(ctx, id));
    },
    produce: (ctx) => {
      const pcsk9Id = getActivePcsk9Ids(ctx).find((id) => !hasLipidDrugAllergy(ctx, id));
      if (!pcsk9Id) return null;
      return {
        id: 'rec_lipid_step4_continue_pcsk9',
        module: 'lipid',
        tier: 'Phác đồ 3 thuốc — Duy trì nền tảng hạ LDL-C',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: pcsk9Id,
        title: `Tiếp tục duy trì ${pcsk9Id} đúng lịch tiêm dưới da`,
        rationale: 'Kiểm tra kỹ kỹ thuật tiêm và lịch tiêm PCSK9i trước khi bổ sung thuốc bậc 4.',
        gates: [],
        citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary', 'fda.evolocumab.dose'],
        priority: 85
      };
    }
  },

  {
    id: 'lipid.step4.consider_bempedoic_or_specialist',
    module: 'lipid',
    nameVi: 'Bước 4: Cân nhắc bổ sung Bempedoic acid & Hội chẩn chuyên khoa FH kháng trị',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2025.non_statin_intolerance_combo',
      'fda.bempedoic.dose',
      'esc.lipid.2019.pcsk9_fh_very_high',
      'acc.lipid.2026.pregnancy_hofh_apheresis'
    ],
    when: (ctx) => isStep4TripleUncontrolled(ctx),
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (ldl === undefined || !targetInfo) return null;
      const safety = assessStatinSafety(ctx);

      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      const canAddBempedoic =
        ctx.settings.profile !== 'VN' &&
        !safety.onDialysis &&
        !hasMed(ctx, 'bempedoic_acid') &&
        !hasLipidDrugAllergy(ctx, 'bempedoic_acid') &&
        !isElevatedUrateOrGout(ctx) &&
        !hasLipidFlag(ctx, 'tendonRuptureHistory');

      if (canAddBempedoic) {
        return {
          id: 'rec_lipid_step4_consider_bempedoic',
          module: 'lipid',
          tier: 'Bước 4 — Bổ sung Bempedoic acid & Hội chẩn FH kháng trị',
          tierOrder: 3,
          action: 'CONSIDER',
          drugId: 'bempedoic_acid',
          dose: `${bempDose} mg 1 lần/ngày`,
          title: `Cân nhắc bổ sung Bempedoic acid (${bempDose} mg/ngày) và hội chẩn chuyên khoa FH khi 3 thuốc chưa đạt đích`,
          rationale: `LDL-C hiện tại (${ldlDisplay}) vẫn trên đích < ${targetDisplay} dù đã phối hợp đa cơ chế; kiểm tra tuân thủ, định lượng Lp(a), loại trừ FH đồng hợp tử và cân nhắc bổ sung Bempedoic acid ${bempDose} mg/ngày.`,
          gates: [],
          citationIds: ['esc.lipid.2025.non_statin_intolerance_combo', 'fda.bempedoic.dose'],
          priority: 79
        };
      }

      return {
        id: 'rec_lipid_step4_adherence_specialist',
        module: 'lipid',
        tier: 'Bước 4 — Hội chẩn chuyên khoa Rối loạn Lipid kháng trị',
        tierOrder: 3,
        action: 'REFER',
        title: `Hội chẩn chuyên khoa Lipid / Tim mạch đánh giá tuân thủ, Lp(a) và FH kháng trị (LDL-C ${ldlDisplay})`,
        rationale: `Bệnh nhân chưa đạt mục tiêu LDL-C (< ${targetDisplay}) dù đã có phác đồ đa thuốc; cần rà soát tuân thủ, nguyên nhân thứ phát, Lp(a) và lọc LDL apheresis nếu FH nặng.`,
        gates: [],
        citationIds: ['esc.lipid.2019.pcsk9_fh_very_high', 'acc.lipid.2026.pregnancy_hofh_apheresis'],
        priority: 78
      };
    }
  }
];
