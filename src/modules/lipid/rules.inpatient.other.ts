/**
 * GDMT-VN Lipid Module - Non-ACS Inpatient Secondary Prevention Rules (Stroke/TIA/ASCVD/Intolerance)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildCommonLipidWarnings,
  buildFdcUnbundleGuidanceVi,
  evaluateLdlTargetForPatient,
  findRawMedsWithComponent,
  formatChol,
  formatTargetLdl,
  getActiveStatin,
  hasAscvdEquivalent,
  hasIsolatedHfWithoutStatinIndication,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  isAsianPatient,
  pickSafeHighStatin
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function hasCerebrovascularAdmissionOrHistory(ctx: RuleContext): boolean {
  return (
    hasLipidFlag(ctx, 'stroke') ||
    hasLipidFlag(ctx, 'tia') ||
    hasLipidFlag(ctx, 'strokeOrTia') ||
    hasLipidFlag(ctx, 'acuteIschemicStroke')
  );
}

export const lipidInpatientOtherRules: Rule[] = [
  {
    id: 'lipid.inpatient.non_acs_secondary_statin',
    module: 'lipid',
    nameVi: 'Nội viện ngoài ACS có ASCVD / nguy cơ cao–rất cao: Khởi trị Statin trước xuất viện',
    citationIds: [
      'esc.ckd.2026.dialysis_ascvd_statin_consider',
      'acc.lipid.2026.statin_doses',
      'esc.lipid.2019.statin_high_dose_rec',
      'esc.lipid.2019.stroke_tia_intensive',
      'esc.lipid.2019.target_very_high',
      'fda.rosuvastatin.asian_dose',
      'fda.rosuvastatin.ticagrelor_limit_20mg'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasLipidFlag(ctx, 'acuteAcsWithin24h')) return false;
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.ddiBlocksStandardStatinStart) return false;
      if (getActiveStatin(ctx) !== null) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo || targetInfo.isTargetAchieved) return false;
      if (
        targetInfo.riskTier !== 'extreme' &&
        targetInfo.riskTier !== 'very_high' &&
        targetInfo.riskTier !== 'high'
      ) {
        return false;
      }
      if (safety.onDialysis) {
        return hasAscvdEquivalent(ctx) && !hasLipidDrugAllergy(ctx, 'atorvastatin');
      }
      return pickSafeHighStatin(ctx, safety) !== null;
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (ldl === undefined || !targetInfo) return null;

      const safety = assessStatinSafety(ctx);
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
      const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      if (safety.onDialysis && hasAscvdEquivalent(ctx)) {
        return {
          id: 'rec_lipid_inpt_dialysis_ascvd_consider_statin',
          module: 'lipid',
          tier: 'Nội viện — Dự phòng thứ phát trên nền lọc máu chu kỳ',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: 'atorvastatin',
          dose: `${atorvaModMin}–${atorvaModMax} mg 1 lần/ngày`,
          title: `Cân nhắc khởi trị Atorvastatin (${atorvaModMin}–${atorvaModMax} mg/ngày) trước xuất viện cho bệnh nhân lọc máu kèm ASCVD`,
          rationale: `Ở bệnh nhân lọc máu chu kỳ có bệnh tim mạch do xơ vữa (LDL-C ${ldlDisplay}), ESC 2026 cho phép cân nhắc khởi trị statin liều thấp – trung bình và theo dõi CK.`,
          gates: [],
          citationIds: ['esc.ckd.2026.dialysis_ascvd_statin_consider', 'acc.lipid.2026.statin_doses'],
          priority: 84
        };
      }

      const chosen = pickSafeHighStatin(ctx, safety);
      if (!chosen) return null;
      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: chosen.drugId });
      const cids = [
        'esc.lipid.2019.statin_high_dose_rec',
        'acc.lipid.2026.statin_doses',
        'esc.lipid.2019.target_very_high'
      ];
      if (hasCerebrovascularAdmissionOrHistory(ctx)) {
        cids.push('esc.lipid.2019.stroke_tia_intensive');
      }

      if (chosen.drugId === 'rosuvastatin') {
        const isTicag = safety.hasTicagrelorOrFebuxostat;
        if (isAsianPatient(ctx)) cids.push('fda.rosuvastatin.asian_dose');
        if (isTicag) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
        return {
          id: 'rec_lipid_inpt_secondary_high_statin',
          module: 'lipid',
          tier: 'Nội viện — Khởi trị Statin dự phòng biến cố trước xuất viện',
          tierOrder: 1,
          action: 'START',
          drugId: 'rosuvastatin',
          dose: isTicag
            ? `${rosuvaMin} mg uống 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày)`
            : `${rosuvaMin}–${rosuvaMax} mg uống 1 lần/ngày`,
          title: `Khởi trị Statin cường độ cao (Rosuvastatin ${isTicag ? `${rosuvaMin}` : `${rosuvaMin}–${rosuvaMax}`} mg/ngày) trước khi xuất viện`,
          rationale: `Bệnh nhân nội viện thuộc tầng nguy cơ cao / rất cao (LDL-C ${ldlDisplay}, mục tiêu < ${targetDisplay}) có dị ứng/chống chỉ định với Atorvastatin; khởi trị ngay Rosuvastatin cường độ cao trước xuất viện.`,
          gates: [],
          warnings: warnings.length ? warnings : undefined,
          citationIds: dedupCitations(cids),
          priority: 90
        };
      }

      const altNote = hasLipidDrugAllergy(ctx, 'rosuvastatin')
        ? 'Tránh dùng Rosuvastatin do tiền sử dị ứng.'
        : safety.hasSevereCkd
          ? `Ưu tiên Atorvastatin vì không cần chỉnh liều ở eGFR < ${egfrSevere} mL/phút/1.73m².`
          : safety.egfr === undefined
            ? 'Ưu tiên Atorvastatin khi chưa có Creatinine/eGFR nền.'
            : safety.hasTicagrelorOrFebuxostat
              ? `Hoặc Rosuvastatin ${rosuvaMin} mg/ngày (tối đa ${rosuvaTicagCap} mg/ngày do dùng kèm Ticagrelor/Febuxostat).`
              : `Hoặc Rosuvastatin ${rosuvaMin}–${rosuvaMax} mg/ngày.`;

      return {
        id: 'rec_lipid_inpt_secondary_high_statin',
        module: 'lipid',
        tier: 'Nội viện — Khởi trị Statin dự phòng biến cố trước xuất viện',
        tierOrder: 1,
        action: 'START',
        drugId: 'atorvastatin',
        dose: `${atorvaMin}–${atorvaMax} mg uống 1 lần/ngày`,
        title: `Khởi trị Statin cường độ cao (Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày) trước khi xuất viện`,
        rationale: `Bệnh nhân nội viện thuộc tầng nguy cơ cao / rất cao (LDL-C ${ldlDisplay}, mục tiêu < ${targetDisplay}). Khởi trị ngay trước xuất viện giúp tăng tỷ lệ duy trì GDMT dài hạn. ${altNote}`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: dedupCitations(cids),
        priority: 90
      };
    }
  },

  {
    id: 'lipid.inpatient.non_acs_prior_statin_optimize',
    module: 'lipid',
    nameVi: 'Nội viện ngoài ACS đã dùng Statin: Duy trì hoặc tối ưu hóa liều Statin trước xuất viện',
    citationIds: [
      'esc.lipid.2019.statin_high_dose_rec',
      'esc.lipid.2019.stroke_tia_intensive',
      'acc.lipid.2026.statin_doses',
      'esc.lipid.2019.monitoring_annual',
      'fda.rosuvastatin.ticagrelor_limit_20mg'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasLipidFlag(ctx, 'acuteAcsWithin24h')) return false;
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasAcutePancreatitis ||
        hasLipidFlag(ctx, 'statinIntolerance')
      ) {
        return false;
      }
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin || activeStatin.hasDoseViolation) return false;
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return true;
      return evaluateLdlTargetForPatient(ctx) !== null;
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return null;
      const safety = assessStatinSafety(ctx);
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');

      const cids = ['esc.lipid.2019.statin_high_dose_rec', 'acc.lipid.2026.statin_doses'];
      if (hasCerebrovascularAdmissionOrHistory(ctx)) {
        cids.push('esc.lipid.2019.stroke_tia_intensive');
      }

      const needsHighEscalation =
        !hasIsolatedHfWithoutStatinIndication(ctx) &&
        !safety.onDialysis &&
        targetInfo !== null &&
        !targetInfo.isTargetAchieved &&
        (targetInfo.riskTier === 'extreme' ||
          targetInfo.riskTier === 'very_high' ||
          targetInfo.riskTier === 'high') &&
        !activeStatin.isHighIntensity &&
        !activeStatin.isAtMaxSafeDose;

      if (!needsHighEscalation) {
        return {
          id: 'rec_lipid_inpt_non_acs_continue_statin',
          module: 'lipid',
          tier: 'Nội viện — Duy trì phác đồ Statin nền',
          tierOrder: 2,
          action: 'CONTINUE',
          drugId: activeStatin.rawDrugId,
          title: `Tiếp tục duy trì ${activeStatin.displayName} trong thời gian nằm viện và khi xuất viện`,
          rationale:
            'Duy trì đều đặn liệu pháp Statin nền đang dung nạp an toàn trong suốt đợt nằm viện để tránh hiện tượng dội ngược biến cố mạch máu.',
          gates: [],
          citationIds: dedupCitations([...cids, 'esc.lipid.2019.monitoring_annual']),
          priority: 82
        };
      }

      if (activeStatin.drugId === 'atorvastatin') {
        return {
          id: 'rec_lipid_inpt_non_acs_uptitrate_statin',
          module: 'lipid',
          tier: 'Nội viện — Tối ưu hóa Statin trước xuất viện',
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          dose: `Atorvastatin ${atorvaMin}–${atorvaMax} mg 1 lần/ngày`,
          title: `Tăng liều ${activeStatin.displayName} lên cường độ cao (${atorvaMin}–${atorvaMax} mg/ngày) trước xuất viện`,
          rationale:
            'Bệnh nhân nội viện nguy cơ cao/rất cao (đặc biệt đột quỵ thiếu máu não/TIA/ASCVD) chưa đạt mục tiêu LDL-C trên liều statin trung bình cần được tối ưu lên cường độ cao trước khi ra viện.',
          gates: [],
          citationIds: dedupCitations(cids),
          priority: 88
        };
      }

      if (activeStatin.drugId === 'rosuvastatin' && !safety.hasSevereCkd && safety.egfr !== undefined) {
        const isTicag = safety.hasTicagrelorOrFebuxostat;
        if (isTicag) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
        return {
          id: 'rec_lipid_inpt_non_acs_uptitrate_statin',
          module: 'lipid',
          tier: 'Nội viện — Tối ưu hóa Statin trước xuất viện',
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          dose: isTicag
            ? `Rosuvastatin ${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày)`
            : `Rosuvastatin ${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`,
          title: `Tăng liều ${activeStatin.displayName} lên cường độ cao trước xuất viện`,
          rationale:
            'Tối ưu hóa liều Rosuvastatin cường độ cao ngay trước xuất viện để đạt mục tiêu hạ LDL-C dự phòng biến cố tái phát.',
          gates: [],
          citationIds: dedupCitations(cids),
          priority: 88
        };
      }

      const chosen = pickSafeHighStatin(ctx, safety);
      if (!chosen) return null;
      const rawMatch = findRawMedsWithComponent(ctx, activeStatin.drugId)[0];
      const unbundle = rawMatch ? buildFdcUnbundleGuidanceVi(rawMatch, STATIN_DRUG_IDS) : '';
      const isTicag = chosen.drugId === 'rosuvastatin' && safety.hasTicagrelorOrFebuxostat;
      if (isTicag) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
      const switchDose =
        chosen.drugId === 'rosuvastatin'
          ? isTicag
            ? `${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày)`
            : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`
          : `${atorvaMin}–${atorvaMax} mg 1 lần/ngày`;
      return {
        id: 'rec_lipid_inpt_non_acs_switch_high_statin',
        module: 'lipid',
        tier: 'Nội viện — Chuyển sang Statin cường độ cao trước xuất viện',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: chosen.drugId,
        switchFrom: activeStatin.rawDrugId,
        dose: switchDose,
        title: `Chuyển đổi từ ${activeStatin.displayName} sang ${chosen.nameVi} cường độ cao (${switchDose}) trước xuất viện`,
        rationale:
          `Chuyển từ statin hiệu lực thấp/trung bình sang ${chosen.nameVi} cường độ cao để đạt mục tiêu hạ LDL-C dự phòng thứ phát.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [],
        citationIds: dedupCitations(cids),
        priority: 88
      };
    }
  },

  {
    id: 'lipid.inpatient.non_acs_ezetimibe_or_intolerance',
    module: 'lipid',
    nameVi: 'Nội viện ngoài ACS trên Statin tối đa hoặc không dung nạp Statin: Duy trì / Phối hợp Ezetimibe',
    citationIds: [
      'esc.lipid.2019.ezetimibe_add_on',
      'esc.lipid.2025.non_statin_intolerance_combo',
      'acc.lipid.2026.ezetimibe_secondary_very_high'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasLipidFlag(ctx, 'acuteAcsWithin24h')) return false;
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasAcutePancreatitis ||
        hasLipidDrugAllergy(ctx, 'ezetimibe')
      ) {
        return false;
      }
      if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;

      if (hasMed(ctx, 'ezetimibe')) {
        const activeStatin = getActiveStatin(ctx);
        const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
          (m) => m.rawDrugId !== activeStatin?.rawDrugId && !hasLipidDrugAllergy(ctx, m.rawDrugId)
        );
        return Boolean(separateEze);
      }

      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo || targetInfo.isTargetAchieved) return false;
      if (
        targetInfo.riskTier !== 'extreme' &&
        targetInfo.riskTier !== 'very_high' &&
        targetInfo.riskTier !== 'high'
      ) {
        return false;
      }
      const activeStatin = getActiveStatin(ctx);
      return (
        hasLipidFlag(ctx, 'statinIntolerance') ||
        Boolean(
          activeStatin &&
            !activeStatin.hasDoseViolation &&
            (activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose)
        )
      );
    },
    produce: (ctx) => {
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const safety = assessStatinSafety(ctx);
      const activeStatin = getActiveStatin(ctx);

      if (hasMed(ctx, 'ezetimibe')) {
        const separateEze = findRawMedsWithComponent(ctx, 'ezetimibe').find(
          (m) => m.rawDrugId !== activeStatin?.rawDrugId && !hasLipidDrugAllergy(ctx, m.rawDrugId)
        );
        if (!separateEze) return null;
        return {
          id: 'rec_lipid_inpt_non_acs_continue_ezetimibe',
          module: 'lipid',
          tier: 'Nội viện — Duy trì Ezetimibe nền',
          tierOrder: 2,
          action: 'CONTINUE',
          drugId: separateEze.rawDrugId,
          dose: separateEze.isFdc ? undefined : `${ezeDose} mg 1 lần/ngày`,
          title: `Tiếp tục duy trì ${separateEze.displayName}${separateEze.isFdc ? '' : ` ${ezeDose} mg/ngày`} trong đợt nằm viện`,
          rationale: 'Giữ ổn định Ezetimibe đang dùng an toàn để duy trì kiểm soát LDL-C.',
          gates: [],
          citationIds: ['esc.lipid.2019.ezetimibe_add_on'],
          priority: 81
        };
      }

      const action = safety.onDialysis ? 'CONSIDER' : 'START';
      return {
        id: 'rec_lipid_inpt_non_acs_add_ezetimibe',
        module: 'lipid',
        tier: 'Nội viện — Phối hợp / Thay thế bằng Ezetimibe trước xuất viện',
        tierOrder: 2,
        action,
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg uống 1 lần/ngày`,
        title:
          hasLipidFlag(ctx, 'statinIntolerance')
            ? `Khởi trị Ezetimibe (${ezeDose} mg/ngày) cho bệnh nhân nội viện không dung nạp Statin`
            : `Phối hợp thêm Ezetimibe (${ezeDose} mg/ngày) trước xuất viện khi Statin tối đa dung nạp chưa đạt đích`,
        rationale:
          'Bổ sung Ezetimibe ngay trước khi ra viện cho bệnh nhân nguy cơ cao/rất cao chưa đạt mục tiêu LDL-C trên liều statin tối đa dung nạp hoặc không dung nạp statin.',
        gates: [],
        citationIds: [
          'esc.lipid.2019.ezetimibe_add_on',
          'esc.lipid.2025.non_statin_intolerance_combo',
          'acc.lipid.2026.ezetimibe_secondary_very_high'
        ],
        priority: 85
      };
    }
  }
];
