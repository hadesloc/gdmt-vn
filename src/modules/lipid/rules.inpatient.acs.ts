/**
 * GDMT-VN Lipid Module - Acute ACS Inpatient Rules (Early Panel, Naive Statin/Ezetimibe & DDI Rescue)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  canReachTargetWithHighStatinAlone,
  evaluateLdlTargetForPatient,
  formatChol,
  formatTargetLdl,
  getActiveStatin,
  hasLipidDrugAllergy,
  hasMed,
  isAcuteAcsInpatient,
  isAsianPatient,
  pickSafeHighStatin
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function canUseHighRosuvaInAcs(ctx: RuleContext): boolean {
  const safety = assessStatinSafety(ctx);
  return (
    !hasLipidDrugAllergy(ctx, 'rosuvastatin') &&
    !safety.hasRosuvaAvoidMed &&
    !safety.hasRosuvaCap5Med &&
    !safety.hasRosuvaCap10Med &&
    !safety.hasSevereCkd &&
    safety.egfr !== undefined
  );
}

export const lipidInpatientAcsRules: Rule[] = [
  {
    id: 'lipid.inpatient.acs.early_lipid_panel',
    module: 'lipid',
    nameVi: 'ACS nội viện: Xét nghiệm bộ mỡ máu sớm và hẹn kiểm tra lại sau 4–6 tuần',
    citationIds: [
      'esc.lipid.2019.acs_early_lipid_profile',
      'esc.lipid.2019.recheck_4_to_6_weeks',
      'esc.lipid.2025.acs_recheck_4_to_6_weeks'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAcuteAcsInpatient(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && !safety.hasAcutePancreatitis;
    },
    produce: () => {
      const minW = thFor('interval_weeks', 'lipid.monitoring.weeks_min');
      const acsMaxW = thFor('interval_weeks', 'lipid.monitoring.acs_recheck_max_weeks');
      return {
        id: 'rec_lipid_inpt_acs_panel',
        module: 'lipid',
        tier: 'Xét nghiệm & Theo dõi sớm trong Hội chứng vành cấp',
        tierOrder: 3,
        action: 'MONITOR',
        title: `Lấy máu xét nghiệm bộ mỡ máu càng sớm càng tốt khi nhập viện vì ACS và đánh giá lại sau ${minW}–${acsMaxW} tuần`,
        rationale: `Nồng độ LDL-C có xu hướng giảm tạm thời sau 24 giờ khởi phát ACS; cần lấy mẫu máu sớm ngay khi nhập viện và kiểm tra lại sau ${minW}–${acsMaxW} tuần để kịp thời nâng bậc điều trị.`,
        gates: [],
        citationIds: [
          'esc.lipid.2019.acs_early_lipid_profile',
          'esc.lipid.2019.recheck_4_to_6_weeks',
          'esc.lipid.2025.acs_recheck_4_to_6_weeks'
        ],
        priority: 72
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.early_high_statin',
    module: 'lipid',
    nameVi: 'ACS nội viện chưa dùng Statin: Khởi trị khẩn cấp Statin cường độ cao bất kể LDL-C nền',
    citationIds: [
      'esc.ckd.2026.dialysis_ascvd_statin_consider',
      'esc.lipid.2025.acs_naive_combination',
      'acc.lipid.2026.statin_doses',
      'acc.lipid.2026.pravastatin_dose',
      'esc.lipid.2019.target_very_high',
      'fda.rosuvastatin.asian_dose',
      'fda.rosuvastatin.renal_impairment',
      'fda.rosuvastatin.ticagrelor_limit_20mg'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAcuteAcsInpatient(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.ddiBlocksStandardStatinStart) return false;
      if (getActiveStatin(ctx) !== null) return false;
      if (safety.onDialysis) {
        return !hasLipidDrugAllergy(ctx, 'atorvastatin') || !hasLipidDrugAllergy(ctx, 'pravastatin');
      }
      return pickSafeHighStatin(ctx, safety) !== null;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
      const rosuvaCkdMax = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
      const pravaStart = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_start');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const vhLdl = thFor('ldl', 'lipid.target.very_high_ldl');
      const minPct = thFor('ldl_reduction_pct', 'lipid.target.percent_reduction_min');

      if (safety.onDialysis) {
        const useAtorva = !hasLipidDrugAllergy(ctx, 'atorvastatin');
        const dialDrug = useAtorva ? 'atorvastatin' : 'pravastatin';
        const dialDose = useAtorva
          ? `${atorvaModMin}–${atorvaMin} mg 1 lần/ngày (cá thể hóa ở bệnh nhân lọc máu kèm ACS)`
          : `${pravaStart}–${atorvaModMin * 2} mg 1 lần/ngày`;
        return {
          id: 'rec_lipid_inpt_acs_dialysis_consider_statin',
          module: 'lipid',
          tier: 'Cấp cứu Nội viện — ACS trên nền lọc máu chu kỳ',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: dialDrug,
          dose: dialDose,
          title: `Cân nhắc khởi trị sớm ${useAtorva ? 'Atorvastatin' : 'Pravastatin'} cho bệnh nhân ACS đang lọc máu chu kỳ`,
          rationale:
            'Ở bệnh nhân lọc máu chu kỳ nhập viện vì ACS, ESC 2026 cho phép cân nhắc khởi trị statin (ưu tiên Atorvastatin không phụ thuộc thải trừ thận và theo dõi sát CK).',
          gates: [],
          citationIds: [
            'esc.ckd.2026.dialysis_ascvd_statin_consider',
            'esc.lipid.2025.acs_naive_combination',
            useAtorva ? 'acc.lipid.2026.statin_doses' : 'acc.lipid.2026.pravastatin_dose'
          ],
          priority: 88
        };
      }

      const chosen = pickSafeHighStatin(ctx, safety);
      if (!chosen) return null;
      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: chosen.drugId });
      const cids = [
        'esc.lipid.2025.acs_naive_combination',
        'acc.lipid.2026.statin_doses',
        'esc.lipid.2019.target_very_high'
      ];

      if (chosen.drugId === 'rosuvastatin') {
        const isTicag = safety.hasTicagrelorOrFebuxostat;
        const rDose = isTicag
          ? `${rosuvaMin} mg uống 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày do dùng kèm Ticagrelor/Febuxostat)`
          : `${rosuvaMin}–${rosuvaMax} mg uống 1 lần/ngày`;
        if (isAsianPatient(ctx)) cids.push('fda.rosuvastatin.asian_dose');
        if (isTicag) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
        return {
          id: 'rec_lipid_inpt_acs_high_statin',
          module: 'lipid',
          tier: 'Cấp cứu Nội viện — Statin cường độ cao ngay trong 24 giờ đầu ACS',
          tierOrder: 1,
          action: 'START',
          drugId: 'rosuvastatin',
          dose: rDose,
          title: `Khởi trị ngay Statin cường độ cao (Rosuvastatin ${isTicag ? `${rosuvaMin} mg/ngày` : `${rosuvaMin}–${rosuvaMax} mg/ngày`}) cho bệnh nhân ACS`,
          rationale: `Bệnh nhân ACS có dị ứng/chống chỉ định với Atorvastatin cần khởi trị ngay Rosuvastatin cường độ cao hướng tới đích LDL-C < ${vhLdl.toFixed(1)} mmol/L và giảm ≥ ${minPct}% so với nền.`,
          gates: [],
          warnings: warnings.length ? warnings : undefined,
          citationIds: dedupCitations(cids),
          priority: 95
        };
      }

      let altNote: string;
      if (hasLipidDrugAllergy(ctx, 'rosuvastatin')) {
        altNote = 'Lưu ý: Bệnh nhân có tiền sử dị ứng Rosuvastatin — không kê thay thế bằng Rosuvastatin.';
      } else if (safety.hasSevereCkd) {
        altNote = `Ưu tiên Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày do eGFR < ${egfrSevere} mL/phút/1.73m² (Rosuvastatin giới hạn ≤ ${rosuvaCkdMax} mg/ngày).`;
        cids.push('fda.rosuvastatin.renal_impairment');
      } else if (safety.egfr === undefined) {
        altNote = `Ưu tiên Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày khi chưa có kết quả Creatinine/eGFR; kiểm tra chức năng thận trước khi cân nhắc Rosuvastatin.`;
      } else if (safety.hasTicagrelorOrFebuxostat) {
        altNote = `Hoặc Rosuvastatin ${rosuvaMin} mg/ngày (không vượt quá ${rosuvaTicagCap} mg/ngày do dùng kèm Ticagrelor).`;
        cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
      } else {
        altNote = `Hoặc Rosuvastatin ${rosuvaMin}–${rosuvaMax} mg/ngày.`;
      }

      return {
        id: 'rec_lipid_inpt_acs_high_statin',
        module: 'lipid',
        tier: 'Cấp cứu Nội viện — Statin cường độ cao ngay trong 24 giờ đầu ACS',
        tierOrder: 1,
        action: 'START',
        drugId: 'atorvastatin',
        dose: `${atorvaMin}–${atorvaMax} mg uống 1 lần/ngày (bắt đầu sớm bất kể giá trị LDL-C ban đầu)`,
        title: `Khởi trị ngay Statin cường độ cao (Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày) cho bệnh nhân ACS`,
        rationale: `Tất cả bệnh nhân nhập viện vì hội chứng vành cấp không có chống chỉ định cần khởi trị sớm statin cường độ cao hướng tới đích LDL-C < ${vhLdl.toFixed(1)} mmol/L và giảm ≥ ${minPct}% so với nền. ${altNote}`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: dedupCitations(cids),
        priority: 95
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.gemfibrozil_statin_rescue',
    module: 'lipid',
    nameVi: 'ACS nội viện đang dùng Simvastatin/Statin cường độ thấp–trung bình kèm Gemfibrozil: Ngừng Gemfibrozil và chuyển sang Statin cường độ cao',
    citationIds: [
      'acc.lipid.2026.gemfibrozil_statin_contra',
      'esc.lipid.2025.acs_prior_llt',
      'acc.lipid.2026.statin_doses',
      'fda.rosuvastatin.ticagrelor_limit_20mg'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAcuteAcsInpatient(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (!safety.hasGemfibrozil) return false;
      if (safety.hardBlockedForStatinInit || safety.hasCyclosporine || safety.onDialysis) {
        return false;
      }
      const activeStatin = getActiveStatin(ctx);
      if (
        !activeStatin ||
        activeStatin.drugId === 'atorvastatin' ||
        activeStatin.drugId === 'rosuvastatin'
      ) {
        return false;
      }
      const canUseAtorva =
        !hasLipidDrugAllergy(ctx, 'atorvastatin') && !safety.hasStrongCyp3a4Inhibitor;
      return canUseAtorva || canUseHighRosuvaInAcs(ctx);
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return null;
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');

      const useAtorva =
        !hasLipidDrugAllergy(ctx, 'atorvastatin') && !safety.hasStrongCyp3a4Inhibitor;
      const targetDrug = useAtorva ? 'atorvastatin' : 'rosuvastatin';
      const targetName = useAtorva ? 'Atorvastatin' : 'Rosuvastatin';
      const isTicag = !useAtorva && safety.hasTicagrelorOrFebuxostat;
      const doseText = useAtorva
        ? `${atorvaMin}–${atorvaMax} mg uống 1 lần/ngày (bắt đầu sau khi ngừng Gemfibrozil)`
        : isTicag
          ? `${rosuvaMin} mg uống 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày do Ticagrelor, bắt đầu sau khi ngừng Gemfibrozil)`
          : `${rosuvaMin}–${rosuvaMax} mg uống 1 lần/ngày (bắt đầu sau khi ngừng Gemfibrozil)`;

      const cids = [
        'acc.lipid.2026.gemfibrozil_statin_contra',
        'esc.lipid.2025.acs_prior_llt',
        'acc.lipid.2026.statin_doses'
      ];
      if (isTicag) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');

      return {
        id: 'rec_lipid_inpt_acs_gemfibrozil_switch_high_statin',
        module: 'lipid',
        tier: 'Cấp cứu Nội viện ACS — Giải quyết tương tác Gemfibrozil & Bảo vệ mảng xơ vữa',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: targetDrug,
        switchFrom: activeStatin.rawDrugId,
        dose: doseText,
        title: `Ngừng ngay Gemfibrozil và chuyển từ ${activeStatin.displayName} sang ${targetName} cường độ cao tại viện`,
        rationale: `Trong hội chứng vành cấp, không được để trống nền tảng Statin cường độ cao: ngừng vĩnh viễn Gemfibrozil (thời gian bán thải ngắn) và chuyển từ ${activeStatin.displayName} sang ${targetName} (${doseText}) để ổn định mảng xơ vữa cấp.`,
        gates: [],
        citationIds: dedupCitations(cids),
        priority: 95
      };
    }
  },

  {
    id: 'lipid.inpatient.acs.early_upfront_ezetimibe',
    module: 'lipid',
    nameVi: 'ACS nội viện chưa dùng thuốc: Phối hợp sớm Ezetimibe ngay trong đợt nằm viện',
    citationIds: ['esc.lipid.2025.acs_naive_combination', 'esc.lipid.2019.ezetimibe_add_on'],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAcuteAcsInpatient(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.onDialysis || safety.hasCyclosporine) {
        return false;
      }
      if (getActiveStatin(ctx) !== null || hasMed(ctx, 'ezetimibe') || hasLipidDrugAllergy(ctx, 'ezetimibe')) {
        return false;
      }
      const ldl = need(ctx, 'ldl');
      if (ldl === undefined) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      return Boolean(targetInfo && !canReachTargetWithHighStatinAlone(ldl, targetInfo));
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (ldl === undefined || !targetInfo) return null;
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const statinMaxPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high');
      const comboPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high_ezetimibe');
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      return {
        id: 'rec_lipid_inpt_acs_upfront_ezetimibe',
        module: 'lipid',
        tier: 'Nội viện ACS — Phối hợp sớm ngay trong đợt nằm viện (ESC 2025)',
        tierOrder: 2,
        action: 'CONSIDER',
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg uống 1 lần/ngày (phối hợp ngay cùng Statin cường độ cao)`,
        title: `Cân nhắc phối hợp ngay Ezetimibe (${ezeDose} mg/ngày) trong thời gian nằm viện vì ACS`,
        rationale: `Theo ESC/EAS 2025 (Class IIa-B), ở bệnh nhân ACS chưa từng điều trị hạ mỡ máu mà LDL-C (${ldlDisplay}) dự kiến không thể đạt đích < ${targetDisplay} chỉ với đơn trị statin cường độ cao (~${statinMaxPct}%), nên phối hợp ngay Statin + Ezetimibe ${ezeDose} mg/ngày tại viện (~${comboPct}%).`,
        gates: [],
        citationIds: ['esc.lipid.2025.acs_naive_combination', 'esc.lipid.2019.ezetimibe_add_on'],
        priority: 89
      };
    }
  }
];
