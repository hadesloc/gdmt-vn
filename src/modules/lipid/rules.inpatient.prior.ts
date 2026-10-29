/**
 * GDMT-VN Lipid Module - Acute ACS Prior Non-Statin Maintenance & Escalation Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { RuleContext, Rule } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  evaluateLdlTargetForPatient,
  findRawMedsWithComponent,
  getActivePcsk9Ids,
  getActiveStatin,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  hasPcsk9,
  isAcuteAcsInpatient,
  isClass2bExtremeOnlyUnmet,
  isElevatedUrateOrGout,
  pickSafePcsk9
} from './helpers';

function isSafeForAcsNonStatin(ctx: RuleContext): boolean {
  if (!isAcuteAcsInpatient(ctx)) return false;
  const safety = assessStatinSafety(ctx);
  return !(
    safety.isReproContra ||
    safety.hasSevereAlt ||
    safety.hasRhabdoRiskCk ||
    safety.hasModerateCk ||
    safety.hasAcutePancreatitis
  );
}

export const lipidInpatientPriorNonStatinRules: Rule[] = [
  {
    id: 'lipid.inpatient.acs.maintain_prior_ezetimibe',
    module: 'lipid',
    nameVi: 'ACS nội viện: Tiếp tục duy trì Ezetimibe đã dùng trước nhập viện',
    citationIds: ['esc.lipid.2025.acs_prior_llt', 'esc.lipid.2019.ezetimibe_add_on'],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isSafeForAcsNonStatin(ctx)) return false;
      if (!hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;
      const activeStatin = getActiveStatin(ctx);
      const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) =>
          (m.rawDrugId !== activeStatin?.rawDrugId || activeStatin?.hasDoseViolation) &&
          !hasLipidDrugAllergy(ctx, m.rawDrugId)
      );
      return Boolean(separateEze);
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) =>
          (m.rawDrugId !== activeStatin?.rawDrugId || activeStatin?.hasDoseViolation) &&
          !hasLipidDrugAllergy(ctx, m.rawDrugId)
      );
      if (!separateEze) return null;
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const needsStandaloneUnbundle =
        separateEze.isFdc && separateEze.rawDrugId === activeStatin?.rawDrugId;
      return {
        id: 'rec_lipid_inpt_acs_continue_ezetimibe',
        module: 'lipid',
        tier: 'Nội viện ACS — Duy trì thuốc hạ lipid nền',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: needsStandaloneUnbundle ? 'ezetimibe' : separateEze.rawDrugId,
        dose: !separateEze.isFdc || needsStandaloneUnbundle ? `${ezeDose} mg 1 lần/ngày` : undefined,
        title: needsStandaloneUnbundle
          ? `Tách riêng và tiếp tục duy trì Ezetimibe đơn chất ${ezeDose} mg/ngày khi đổi Statin`
          : `Tiếp tục duy trì ${separateEze.displayName}${separateEze.isFdc ? '' : ` ${ezeDose} mg/ngày`} đang dùng từ trước nhập viện`,
        rationale:
          'Không gián đoạn Ezetimibe đang dùng trước nhập viện ở bệnh nhân hội chứng vành cấp.',
        gates: [],
        citationIds: ['esc.lipid.2025.acs_prior_llt', 'esc.lipid.2019.ezetimibe_add_on'],
        priority: 89
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.maintain_prior_pcsk9',
    module: 'lipid',
    nameVi: 'ACS nội viện: Tiếp tục duy trì thuốc ức chế PCSK9 đã dùng trước nhập viện',
    citationIds: ['esc.lipid.2025.acs_prior_llt', 'esc.lipid.2019.pcsk9_add_on_secondary'],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isSafeForAcsNonStatin(ctx) &&
      hasPcsk9(ctx) &&
      getActivePcsk9Ids(ctx).some((id) => !hasLipidDrugAllergy(ctx, id)),
    produce: (ctx) => {
      const pcsk9Id = getActivePcsk9Ids(ctx).find((id) => !hasLipidDrugAllergy(ctx, id));
      if (!pcsk9Id) return null;
      return {
        id: 'rec_lipid_inpt_acs_continue_pcsk9',
        module: 'lipid',
        tier: 'Nội viện ACS — Duy trì thuốc hạ lipid nền',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: pcsk9Id,
        title: `Tiếp tục duy trì ${pcsk9Id} đang dùng từ trước nhập viện`,
        rationale:
          'Duy trì không gián đoạn liệu pháp ức chế PCSK9 ở bệnh nhân nhập viện vì hội chứng vành cấp.',
        gates: [],
        citationIds: ['esc.lipid.2025.acs_prior_llt', 'esc.lipid.2019.pcsk9_add_on_secondary'],
        priority: 89
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.maintain_prior_bempedoic',
    module: 'lipid',
    nameVi: 'ACS nội viện: Tiếp tục duy trì Bempedoic acid đã dùng trước nhập viện',
    citationIds: ['esc.lipid.2025.acs_prior_llt', 'fda.bempedoic.dose'],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isSafeForAcsNonStatin(ctx) || !hasMed(ctx, 'bempedoic_acid')) return false;
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
      if (bempMatch.allComponents.includes('ezetimibe')) return false;
      return true;
    },
    produce: (ctx) => {
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0];
      if (!bempMatch) return null;
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      return {
        id: 'rec_lipid_inpt_acs_continue_bempedoic',
        module: 'lipid',
        tier: 'Nội viện ACS — Duy trì thuốc hạ lipid nền',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: bempMatch.rawDrugId,
        dose: bempMatch.isFdc ? undefined : `${bempDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${bempMatch.displayName}${bempMatch.isFdc ? '' : ` ${bempDose} mg/ngày`} đang dung nạp an toàn`,
        rationale: 'Giữ nguyên Bempedoic acid đang dùng trước nhập viện ở bệnh nhân ACS.',
        gates: [],
        citationIds: ['esc.lipid.2025.acs_prior_llt', 'fda.bempedoic.dose'],
        priority: 88
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.prior_llt_ezetimibe',
    module: 'lipid',
    nameVi: 'ACS nội viện trên nền Statin: Bổ sung ngay Ezetimibe nội viện',
    citationIds: [
      'esc.lipid.2025.acs_prior_llt',
      'esc.lipid.2019.ezetimibe_add_on',
      'acc.lipid.2026.ezetimibe_secondary_very_high'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (
        !isSafeForAcsNonStatin(ctx) ||
        hasMed(ctx, 'ezetimibe') ||
        hasLipidDrugAllergy(ctx, 'ezetimibe')
      ) {
        return false;
      }
      const safety = assessStatinSafety(ctx);
      if (safety.onDialysis) return false;
      const hasPriorLlt =
        getActiveStatin(ctx) !== null ||
        hasLipidFlag(ctx, 'statinIntolerance') ||
        hasMed(ctx, 'bempedoic_acid') ||
        hasPcsk9(ctx);
      if (!hasPriorLlt) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo) return true;
      return !targetInfo.isTargetAchieved;
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const isAlreadyMaxStatinOrIntol =
        hasLipidFlag(ctx, 'statinIntolerance') ||
        Boolean(activeStatin && (activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose));
      const isClass2b = Boolean(targetInfo && isClass2bExtremeOnlyUnmet(ctx, targetInfo));
      const action = isAlreadyMaxStatinOrIntol && !isClass2b ? 'START' : 'CONSIDER';

      return {
        id: 'rec_lipid_inpt_acs_prior_llt_ezetimibe',
        module: 'lipid',
        tier: 'Nội viện ACS — Tăng cường phối hợp Ezetimibe tại viện (ESC 2025 Class I)',
        tierOrder: 2,
        action,
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg uống 1 lần/ngày`,
        title:
          action === 'START'
            ? `Phối hợp ngay Ezetimibe (${ezeDose} mg/ngày) trong đợt nằm viện ACS`
            : `Cân nhắc phối hợp sớm Ezetimibe (${ezeDose} mg/ngày) ngay tại viện cùng Statin cường độ cao`,
        rationale:
          'Theo ESC/EAS 2025 (Class I-C), bệnh nhân nhập viện vì ACS đang dùng liệu pháp hạ lipid nhưng chưa đạt mục tiêu LDL-C cần được tăng cường phối hợp Ezetimibe ngay trước xuất viện.',
        gates: [],
        citationIds: [
          'esc.lipid.2025.acs_prior_llt',
          'esc.lipid.2019.ezetimibe_add_on',
          'acc.lipid.2026.ezetimibe_secondary_very_high'
        ],
        priority: 90
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.prior_llt_pcsk9',
    module: 'lipid',
    nameVi: 'ACS nội viện trên nền Statin + Ezetimibe chưa đạt đích: Bổ sung sớm ức chế PCSK9',
    citationIds: [
      'esc.lipid.2025.acs_prior_llt',
      'esc.lipid.2019.pcsk9_add_on_secondary',
      'fda.evolocumab.dose',
      'acc.lipid.2026.alirocumab_dose',
      'fda.inclisiran.dose'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isSafeForAcsNonStatin(ctx) || hasPcsk9(ctx)) return false;
      if (!pickSafePcsk9(ctx)) return false;
      const hasOrBypassedEze = hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe');
      if (!hasOrBypassedEze) return false;
      const activeStatin = getActiveStatin(ctx);
      const onMaxStatinOrIntol =
        hasLipidFlag(ctx, 'statinIntolerance') ||
        Boolean(
          activeStatin &&
            !activeStatin.hasDoseViolation &&
            (activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose)
        );
      if (!onMaxStatinOrIntol) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      return Boolean(targetInfo && !targetInfo.isTargetAchieved);
    },
    produce: (ctx) => {
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const chosen = pickSafePcsk9(ctx);
      if (!targetInfo || !chosen) return null;
      const safety = assessStatinSafety(ctx);
      const evoBiweekly = thFor('dose_mg', 'lipid.dose.evolocumab_biweekly');
      const aliStart = thFor('dose_mg', 'lipid.dose.alirocumab_start');
      const aliHigh = thFor('dose_mg', 'lipid.dose.alirocumab_high');
      const inclisiranDose = thFor('dose_mg', 'lipid.dose.inclisiran_standard');

      let doseText = `${evoBiweekly} mg tiêm dưới da mỗi 2 tuần`;
      let doseCid = 'fda.evolocumab.dose';
      if (chosen.drugId === 'alirocumab') {
        doseText = `${aliStart}–${aliHigh} mg tiêm dưới da mỗi 2 tuần`;
        doseCid = 'acc.lipid.2026.alirocumab_dose';
      } else if (chosen.drugId === 'inclisiran') {
        doseText = `${inclisiranDose} mg tiêm dưới da ban đầu, sau 3 tháng và mỗi 6 tháng`;
        doseCid = 'fda.inclisiran.dose';
      }

      const action =
        isClass2bExtremeOnlyUnmet(ctx, targetInfo) || safety.onDialysis ? 'CONSIDER' : 'START';
      return {
        id: 'rec_lipid_inpt_acs_prior_llt_pcsk9',
        module: 'lipid',
        tier: 'Nội viện ACS — Bổ sung ức chế PCSK9 tại viện (ESC Class I)',
        tierOrder: 2,
        action,
        drugId: chosen.drugId,
        dose: doseText,
        title:
          action === 'START'
            ? `Bổ sung sớm thuốc ức chế PCSK9 (${chosen.nameVi}) ngay trong đợt nằm viện ACS do phác đồ nền chưa đạt đích`
            : `Cân nhắc bổ sung thuốc ức chế PCSK9 (${chosen.nameVi}) hướng tới đích LDL-C hạ sâu sau tái phát ACS`,
        rationale:
          'Bệnh nhân tái phát ACS dù đã dùng Statin tối đa dung nạp (hoặc không dung nạp statin) kèm Ezetimibe nhưng LDL-C vẫn trên mục tiêu được khuyến cáo khởi trị sớm PCSK9i ngay trong đợt nằm viện.',
        gates: [],
        citationIds: [
          'esc.lipid.2025.acs_prior_llt',
          'esc.lipid.2019.pcsk9_add_on_secondary',
          doseCid
        ],
        priority: action === 'START' ? 91 : 83
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.prior_triple_step4',
    module: 'lipid',
    nameVi: 'ACS nội viện kháng trị trên phác đồ 3 thuốc: Cân nhắc Bempedoic acid / Hội chẩn chuyên khoa',
    citationIds: [
      'esc.lipid.2025.acs_prior_llt',
      'fda.bempedoic.dose',
      'esc.lipid.2019.pcsk9_fh_very_high'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isSafeForAcsNonStatin(ctx)) return false;
      const hasOrBypassedEze = hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe');
      if (!hasOrBypassedEze || !hasPcsk9(ctx) || hasMed(ctx, 'bempedoic_acid')) {
        return false;
      }
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      return Boolean(targetInfo && !targetInfo.isTargetAchieved);
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      const canUseBempedoic =
        ctx.settings.profile !== 'VN' &&
        !safety.onDialysis &&
        !hasLipidDrugAllergy(ctx, 'bempedoic_acid') &&
        !isElevatedUrateOrGout(ctx) &&
        !hasLipidFlag(ctx, 'tendonRuptureHistory');
      if (canUseBempedoic) {
        return {
          id: 'rec_lipid_inpt_acs_step4_bempedoic',
          module: 'lipid',
          tier: 'Nội viện ACS — Tối ưu hóa bậc 4 trên nền 3 thuốc',
          tierOrder: 3,
          action: 'CONSIDER',
          drugId: 'bempedoic_acid',
          dose: `${bempDose} mg 1 lần/ngày`,
          title: `Cân nhắc bổ sung Bempedoic acid (${bempDose} mg/ngày) và rà soát tuân thủ khi 3 thuốc chưa đạt đích ở bệnh nhân ACS`,
          rationale:
            'Bệnh nhân ACS chưa đạt mục tiêu LDL-C dù đã có Statin + Ezetimibe + PCSK9i; kiểm tra tuân thủ, xét nghiệm Lp(a), tầm soát FH nặng và cân nhắc bổ sung Bempedoic acid.',
          gates: [],
          citationIds: ['esc.lipid.2025.acs_prior_llt', 'fda.bempedoic.dose'],
          priority: 80
        };
      }
      return {
        id: 'rec_lipid_inpt_acs_step4_specialist',
        module: 'lipid',
        tier: 'Nội viện ACS — Hội chẩn chuyên sâu Rối loạn Lipid kháng trị',
        tierOrder: 3,
        action: 'REFER',
        title: 'Hội chẩn chuyên khoa Tim mạch / Lipid đánh giá tuân thủ, Lp(a) và FH kháng trị trước xuất viện',
        rationale:
          'Bệnh nhân ACS chưa đạt mục tiêu LDL-C dù đã phối hợp đa thuốc tích cực; cần đánh giá tuân thủ tiêm PCSK9i, đo Lp(a) và xem xét chỉ định chuyên sâu.',
        gates: [],
        citationIds: ['esc.lipid.2025.acs_prior_llt', 'esc.lipid.2019.pcsk9_fh_very_high'],
        priority: 79
      };
    }
  }
];
