/**
 * GDMT-VN Lipid Module - Statin Intolerance Non-Statin Escalation Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { RuleContext, Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  findRawMedsWithComponent,
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

function isAllStatinsAllergicOrIntolerant(ctx: RuleContext): boolean {
  if (hasLipidFlag(ctx, 'statinIntolerance')) return true;
  return (
    hasLipidDrugAllergy(ctx, 'atorvastatin') &&
    hasLipidDrugAllergy(ctx, 'rosuvastatin') &&
    hasLipidDrugAllergy(ctx, 'pitavastatin') &&
    hasLipidDrugAllergy(ctx, 'pravastatin')
  );
}

function isIntoleranceEscalationActive(ctx: RuleContext): boolean {
  if (!isAllStatinsAllergicOrIntolerant(ctx)) return false;
  if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
  const safety = assessStatinSafety(ctx);
  if (
    safety.isReproContra ||
    safety.hasSevereAlt ||
    safety.hasRhabdoRiskCk ||
    safety.hasModerateCk ||
    safety.hasAcutePancreatitis ||
    safety.hasUntreatedHypo ||
    (safety.onDialysis && !hasAscvdEquivalent(ctx))
  ) {
    return false;
  }
  const targetInfo = evaluateLdlTargetForPatient(ctx);
  if (!targetInfo || targetInfo.isTargetAchieved) return false;
  return (
    targetInfo.riskTier === 'extreme' ||
    targetInfo.riskTier === 'very_high' ||
    targetInfo.riskTier === 'high'
  );
}

export const lipidIntoleranceAndSecondaryRules: Rule[] = [
  {
    id: 'lipid.intolerance.maintain_ezetimibe',
    module: 'lipid',
    nameVi: 'Không dung nạp Statin: Duy trì Ezetimibe nền trong phác đồ non-statin',
    citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2025.non_statin_intolerance_combo'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isIntoleranceEscalationActive(ctx)) return false;
      if (!hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;
      const ezeMatch = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) =>
          !hasLipidDrugAllergy(ctx, m.rawDrugId) &&
          !(
            m.allComponents.includes('bempedoic_acid') &&
            (assessStatinSafety(ctx).onDialysis ||
              isElevatedUrateOrGout(ctx) ||
              hasLipidFlag(ctx, 'tendonRuptureHistory'))
          )
      );
      return Boolean(ezeMatch);
    },
    produce: (ctx) => {
      const ezeMatch = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) => !hasLipidDrugAllergy(ctx, m.rawDrugId)
      );
      if (!ezeMatch) return null;
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      return {
        id: 'rec_lipid_intol_continue_ezetimibe',
        module: 'lipid',
        tier: 'Không dung nạp Statin — Duy trì thuốc nền',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: ezeMatch.rawDrugId,
        dose: ezeMatch.isFdc ? undefined : `${ezeDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${ezeMatch.displayName}${ezeMatch.isFdc ? '' : ` ${ezeDose} mg/ngày`} trong phác đồ không Statin`,
        rationale:
          'Giữ nguyên Ezetimibe đang dung nạp tốt khi phối hợp thêm Bempedoic acid hoặc thuốc ức chế PCSK9.',
        gates: [],
        citationIds: ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2025.non_statin_intolerance_combo'],
        priority: 85
      };
    }
  },

  {
    id: 'lipid.intolerance.maintain_bempedoic',
    module: 'lipid',
    nameVi: 'Không dung nạp Statin: Duy trì Bempedoic acid nền trong phác đồ non-statin',
    citationIds: [
      'fda.bempedoic.gout_risk',
      'fda.bempedoic.tendon_rupture',
      'esc.lipid.2025.bempedoic_statin_intolerance',
      'fda.bempedoic.dose'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isIntoleranceEscalationActive(ctx) || !hasMed(ctx, 'bempedoic_acid')) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.onDialysis || hasLipidDrugAllergy(ctx, 'bempedoic_acid')) return false;
      if (hasLipidFlag(ctx, 'tendonRuptureHistory') || hasLipidFlag(ctx, 'gout')) {
        return false;
      }
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0];
      if (!bempMatch) return false;
      if (bempMatch.allComponents.includes('ezetimibe') && !isElevatedUrateOrGout(ctx)) {
        return false;
      }
      return true;
    },
    produce: (ctx) => {
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0];
      if (!bempMatch) return null;
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      const uricCutoff = thFor('uricacid', 'lipid.safety.uric_acid_elevated');
      if (isElevatedUrateOrGout(ctx)) {
        return {
          id: 'rec_lipid_intol_hold_bempedoic_gout',
          module: 'lipid',
          tier: 'Cảnh báo Tăng acid uric khi dùng Bempedoic acid',
          tierOrder: 1,
          action: 'HOLD',
          drugId: bempMatch.rawDrugId,
          title: `Tạm ngưng / Đánh giá lại ${bempMatch.displayName} do tăng acid uric máu`,
          rationale: `Bempedoic acid làm tăng acid uric máu (> ${uricCutoff} µmol/L) và nguy cơ khởi phát gút cấp; cần đánh giá ngưng thuốc và chuyển sang Ezetimibe + PCSK9i.`,
          gates: [
            {
              parameter: 'uricAcid',
              passed: false,
              action: 'hold',
              messageVi: 'Tăng acid uric máu khi dùng Bempedoic acid'
            }
          ],
          citationIds: ['fda.bempedoic.gout_risk', 'fda.bempedoic.tendon_rupture'],
          priority: 92
        };
      }
      return {
        id: 'rec_lipid_intol_continue_bempedoic',
        module: 'lipid',
        tier: 'Không dung nạp Statin — Duy trì thuốc nền',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: bempMatch.rawDrugId,
        dose: bempMatch.isFdc ? undefined : `${bempDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${bempMatch.displayName}${bempMatch.isFdc ? '' : ` ${bempDose} mg/ngày`} trong phác đồ không Statin`,
        rationale:
          'Duy trì Bempedoic acid phối hợp cùng Ezetimibe/PCSK9i để tối đa hóa mức hạ LDL-C ở bệnh nhân không dung nạp statin.',
        gates: [],
        citationIds: ['esc.lipid.2025.bempedoic_statin_intolerance', 'fda.bempedoic.dose'],
        priority: 85
      };
    }
  },

  {
    id: 'lipid.intolerance.bempedoic_acid',
    module: 'lipid',
    nameVi: 'Không dung nạp Statin: Khởi trị Bempedoic acid 180 mg/ngày (CLEAR Outcomes)',
    citationIds: [
      'esc.lipid.2025.bempedoic_statin_intolerance',
      'fda.bempedoic.gout_risk',
      'fda.bempedoic.tendon_rupture',
      'fda.bempedoic.dose'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'US'],
    when: (ctx) => {
      if (!isIntoleranceEscalationActive(ctx) || hasMed(ctx, 'bempedoic_acid')) return false;
      const safety = assessStatinSafety(ctx);
      return !safety.onDialysis && !hasLipidDrugAllergy(ctx, 'bempedoic_acid');
    },
    produce: (ctx) => {
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      const uricCutoff = thFor('uricacid', 'lipid.safety.uric_acid_elevated');
      const uricAcid = need(ctx, 'uricAcid');
      const hasGoutOrHighUric = isElevatedUrateOrGout(ctx);
      const hasTendonHistory = hasLipidFlag(ctx, 'tendonRuptureHistory');

      if (hasGoutOrHighUric || hasTendonHistory) {
        return {
          id: 'rec_lipid_intol_defer_bempedoic_gout_tendon',
          module: 'lipid',
          tier: 'Không dung nạp Statin — Cảnh báo an toàn',
          tierOrder: 2,
          action: 'DEFER',
          drugId: 'bempedoic_acid',
          title:
            'Trì hoãn / Tránh khởi trị Bempedoic acid do tiền sử Gút, tăng acid uric máu hoặc tiền sử đứt gân',
          rationale: `Bempedoic acid làm tăng acid uric huyết thanh (> ${uricCutoff} µmol/L), tăng nguy cơ gút cấp và liên quan đến đứt gân Achille; ưu tiên dùng Ezetimibe phối hợp ức chế PCSK9.`,
          gates: [
            {
              parameter: hasGoutOrHighUric ? 'uricAcid' : 'tendonRuptureHistory',
              passed: false,
              action: 'hold',
              value: uricAcid,
              threshold: hasGoutOrHighUric ? uricCutoff : undefined,
              messageVi: hasGoutOrHighUric
                ? 'Tiền sử Gút hoặc tăng acid uric máu: tránh Bempedoic acid'
                : 'Tiền sử đứt gân: tránh Bempedoic acid'
            }
          ],
          citationIds: [
            'esc.lipid.2025.bempedoic_statin_intolerance',
            'fda.bempedoic.gout_risk',
            'fda.bempedoic.tendon_rupture'
          ],
          priority: 86
        };
      }

      const warnings = [
        'Theo dõi acid uric máu định kỳ và dặn bệnh nhân ngừng thuốc ngay nếu đau/sưng gân.',
        ...buildCommonLipidWarnings(ctx, { isStatin: false, drugId: 'bempedoic_acid' })
      ];
      const action =
        targetInfo && isClass2bExtremeOnlyUnmet(ctx, targetInfo) ? 'CONSIDER' : 'START';
      return {
        id: 'rec_lipid_intol_start_bempedoic',
        module: 'lipid',
        tier: 'Không dung nạp Statin — Phác đồ thay thế chứng minh lợi ích tim mạch',
        tierOrder: 2,
        action,
        drugId: 'bempedoic_acid',
        dose: `${bempDose} mg uống 1 lần/ngày`,
        title: `Khởi trị Bempedoic acid (${bempDose} mg/ngày) cho bệnh nhân không dung nạp Statin`,
        rationale:
          'Bempedoic acid là tiền thuốc chỉ hoạt hóa tại gan (tránh độc tính cơ kiểu statin) và đã chứng minh giảm biến cố tim mạch chính trong thử nghiệm CLEAR Outcomes (ESC 2025 Class I-B).',
        gates: [],
        warnings,
        citationIds: [
          'esc.lipid.2025.bempedoic_statin_intolerance',
          'fda.bempedoic.dose',
          'fda.bempedoic.gout_risk',
          'fda.bempedoic.tendon_rupture'
        ],
        priority: 87
      };
    }
  },

  {
    id: 'lipid.intolerance.ezetimibe',
    module: 'lipid',
    nameVi: 'Không dung nạp Statin: Khởi trị Ezetimibe 10 mg/ngày',
    citationIds: [
      'esc.lipid.2019.ezetimibe_add_on',
      'esc.lipid.2025.non_statin_intolerance_combo',
      'fda.ezetimibe.bile_acid_sequestrant'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isIntoleranceEscalationActive(ctx) &&
      !hasMed(ctx, 'ezetimibe') &&
      !hasLipidDrugAllergy(ctx, 'ezetimibe'),
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const beforeH = thFor('interval_hours', 'lipid.dose.ezetimibe_sequestrant_before_h');
      const afterH = thFor('interval_hours', 'lipid.dose.ezetimibe_sequestrant_after_h');
      const warnings = buildCommonLipidWarnings(ctx, { isStatin: false, drugId: 'ezetimibe' });
      const cids = ['esc.lipid.2019.ezetimibe_add_on', 'esc.lipid.2025.non_statin_intolerance_combo'];
      if (safety.hasBileAcidSequestrant) {
        warnings.push(
          `Đang dùng nhựa gắn acid mật: uống Ezetimibe trước ≥ ${beforeH} giờ hoặc sau ≥ ${afterH} giờ.`
        );
        cids.push('fda.ezetimibe.bile_acid_sequestrant');
      }
      const action =
        safety.onDialysis || (targetInfo && isClass2bExtremeOnlyUnmet(ctx, targetInfo))
          ? 'CONSIDER'
          : 'START';
      return {
        id: 'rec_lipid_intol_start_ezetimibe',
        module: 'lipid',
        tier: 'Không dung nạp Statin — Liệu pháp đường uống nền tảng',
        tierOrder: 2,
        action,
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg 1 lần/ngày`,
        title: `Khởi trị Ezetimibe (${ezeDose} mg/ngày) khi không dung nạp Statin`,
        rationale: `Ở bệnh nhân không dung nạp bất kỳ liều statin nào, Ezetimibe ${ezeDose} mg/ngày được khuyến cáo phối hợp cùng Bempedoic acid hoặc thuốc ức chế PCSK9 để đạt đích LDL-C.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: dedupCitations(cids),
        priority: 85
      };
    }
  },

  {
    id: 'lipid.intolerance.pcsk9',
    module: 'lipid',
    nameVi: 'Không dung nạp Statin: Bổ sung thuốc ức chế PCSK9 khi thuốc uống không đủ / bị giới hạn',
    citationIds: [
      'esc.lipid.2019.pcsk9_add_on_secondary',
      'esc.lipid.2025.non_statin_intolerance_combo',
      'esc.lipid.2025.figure2_ldl_reduction_68',
      'fda.evolocumab.dose',
      'acc.lipid.2026.alirocumab_dose',
      'fda.inclisiran.dose'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isIntoleranceEscalationActive(ctx) || hasPcsk9(ctx)) return false;
      if (!pickSafePcsk9(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      const blockedBempedoic =
        safety.onDialysis ||
        hasLipidDrugAllergy(ctx, 'bempedoic_acid') ||
        isElevatedUrateOrGout(ctx) ||
        hasLipidFlag(ctx, 'tendonRuptureHistory');
      const ezeAllergic = hasLipidDrugAllergy(ctx, 'ezetimibe');
      const failedDualOral = hasMed(ctx, 'ezetimibe') && hasMed(ctx, 'bempedoic_acid');
      const failedVnEze = hasMed(ctx, 'ezetimibe') && ctx.settings.profile === 'VN';
      const ldl = need(ctx, 'ldl');
      const vnFarFromGoalCutoff = thFor('nonhdl', 'lipid.target.non_hdl_very_high');
      const vnNaiveFarFromGoal =
        ctx.settings.profile === 'VN' &&
        !hasMed(ctx, 'ezetimibe') &&
        (hasAscvdEquivalent(ctx) || hasClinicalFh(ctx)) &&
        ldl !== undefined &&
        ldl >= vnFarFromGoalCutoff;
      return blockedBempedoic || ezeAllergic || failedDualOral || failedVnEze || vnNaiveFarFromGoal;
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
      const ezePcsk9Pct = thFor('ldl_reduction_pct', 'lipid.reduction.ezetimibe_pcsk9');

      let doseText = `${evoBiweekly} mg tiêm dưới da mỗi 2 tuần`;
      let doseCid = 'fda.evolocumab.dose';
      if (chosen.drugId === 'alirocumab') {
        doseText = `${aliStart}–${aliHigh} mg tiêm dưới da mỗi 2 tuần`;
        doseCid = 'acc.lipid.2026.alirocumab_dose';
      } else if (chosen.drugId === 'inclisiran') {
        doseText = `${inclisiranDose} mg tiêm dưới da ban đầu, sau 3 tháng và mỗi 6 tháng`;
        doseCid = 'fda.inclisiran.dose';
      }

      const failedOral =
        hasLipidDrugAllergy(ctx, 'ezetimibe') ||
        (hasMed(ctx, 'ezetimibe') && hasMed(ctx, 'bempedoic_acid')) ||
        (hasMed(ctx, 'ezetimibe') && ctx.settings.profile === 'VN');
      const isSecondaryOrFh = hasAscvdEquivalent(ctx) || hasClinicalFh(ctx);
      const isClass2b = isClass2bExtremeOnlyUnmet(ctx, targetInfo);
      const action =
        failedOral && isSecondaryOrFh && !isClass2b && !safety.onDialysis ? 'START' : 'CONSIDER';

      return {
        id: 'rec_lipid_intol_pcsk9',
        module: 'lipid',
        tier: 'Không dung nạp Statin — Phối hợp ức chế PCSK9',
        tierOrder: 3,
        action,
        drugId: chosen.drugId,
        dose: doseText,
        title:
          action === 'START'
            ? `Bổ sung thuốc ức chế PCSK9 (${chosen.nameVi}) khi phác đồ đường uống không Statin chưa đạt đích LDL-C`
            : `Cân nhắc bổ sung thuốc ức chế PCSK9 (${chosen.nameVi}) phối hợp Ezetimibe ở bệnh nhân không dung nạp Statin`,
        rationale: `Ở bệnh nhân không dung nạp statin chưa đạt mục tiêu LDL-C (hoặc tại Việt Nam khi đơn trị Ezetimibe không đủ đạt đích sâu), bổ sung ${chosen.nameVi} phối hợp Ezetimibe giúp giảm trung bình ~${ezePcsk9Pct}% LDL-C.`,
        gates: [],
        citationIds: dedupCitations([
          'esc.lipid.2019.pcsk9_add_on_secondary',
          'esc.lipid.2025.non_statin_intolerance_combo',
          'esc.lipid.2025.figure2_ldl_reduction_68',
          doseCid
        ]),
        priority: action === 'START' ? 86 : 80
      };
    }
  }
];
