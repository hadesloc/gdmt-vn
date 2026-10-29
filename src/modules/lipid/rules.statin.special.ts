/**
 * GDMT-VN Lipid Module - Special Populations (HF, Hypothyroidism, Kidney Transplant, HIV & TG Statin-First)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  formatTg,
  getActiveStatin,
  hasAscvdEquivalent,
  hasClinicalFh,
  hasIsolatedHfWithoutStatinIndication,
  hasKidneyTransplant,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  isOlderOrFrailPrimary,
  pickSafeHighStatin
} from './helpers';

export const lipidStatinSpecialRules: Rule[] = [
  {
    id: 'lipid.hf.no_routine_statin_init',
    module: 'lipid',
    nameVi: 'Suy tim đơn thuần không kèm ASCVD / chỉ định hạ lipid khác: Không khởi trị mới Statin',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.lipid.2019.hf_no_statin_init', 'acc.lipid.2026.hf_cor3_no_benefit'],
    when: (ctx) => {
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
      return hasIsolatedHfWithoutStatinIndication(ctx) && getActiveStatin(ctx) === null;
    },
    produce: () => ({
      id: 'rec_lipid_hf_avoid_routine_statin_init',
      module: 'lipid',
      tier: 'Suy tim không kèm ASCVD (ESC Class III / ACC COR 3: No Benefit)',
      tierOrder: 1,
      action: 'AVOID',
      drugId: 'atorvastatin',
      title: 'Không khởi trị mới thường quy Statin chỉ vì suy tim khi không có ASCVD hoặc chỉ định hạ lipid độc lập',
      rationale:
        'Các thử nghiệm ngẫu nhiên lớn (CORONA, GISSI-HF) cho thấy khởi trị mới statin ở bệnh nhân suy tim không kèm bệnh tim mạch xơ vữa (hoặc ĐTĐ, CKD, FH) không làm giảm tử vong hay biến cố lâm sàng (ESC/EAS Class III, Level A; ACC/AHA 2026 COR 3: No Benefit). Nếu bệnh nhân đã đang dùng statin dung nạp tốt thì vẫn tiếp tục duy trì.',
      gates: [
        {
          parameter: 'hf',
          passed: false,
          action: 'contra',
          messageVi: 'Suy tim không kèm ASCVD hoặc chỉ định hạ lipid khác: không khởi trị mới statin'
        }
      ],
      citationIds: ['esc.lipid.2019.hf_no_statin_init', 'acc.lipid.2026.hf_cor3_no_benefit'],
      priority: 87
    })
  },

  {
    id: 'lipid.endo.untreated_hypothyroidism_defer',
    module: 'lipid',
    nameVi: 'Suy giáp chưa điều trị ổn định: Trì hoãn Statin, bù hormon giáp trước và xét nghiệm lại lipid/CK',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['acc.lipid.2026.uncontrolled_hypothyroidism', 'esc.lipid.2019.monitoring_ck_high'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasAcutePancreatitis ||
        hasIsolatedHfWithoutStatinIndication(ctx)
      ) {
        return false;
      }
      return safety.hasUntreatedHypo && getActiveStatin(ctx) === null;
    },
    produce: () => {
      const minW = thFor('interval_weeks', 'lipid.monitoring.weeks_min');
      const maxW = thFor('interval_weeks', 'lipid.monitoring.weeks_max');
      return {
        id: 'rec_lipid_hypothyroidism_defer_statin',
        module: 'lipid',
        tier: 'Tầm soát nguyên nhân thứ phát & An toàn cơ',
        tierOrder: 1,
        action: 'DEFER',
        drugId: 'atorvastatin',
        title: 'Trì hoãn khởi trị Statin chưa cấp cứu: Điều trị suy giáp ổn định trước rồi đánh giá lại LDL-C và CK',
        rationale:
          `Suy giáp chưa kiểm soát là nguyên nhân thứ phát phổ biến làm giảm thanh thải thụ thể LDL gây tăng cao LDL-C/TC và làm tăng mạnh nguy cơ bệnh cơ/tiêu cơ vân nếu dùng statin ngay; cần bù hormon tuyến giáp (levothyroxine) đạt bình giáp và kiểm tra lại bộ mỡ máu cùng CK sau ${minW}–${maxW} tuần trước khi quyết định dùng statin.`,
        gates: [
          {
            parameter: 'untreatedHypothyroidism',
            passed: false,
            action: 'hold',
            messageVi: 'Suy giáp chưa điều trị: bù hormon giáp trước khi khởi trị statin ngoại trú'
          }
        ],
        citationIds: ['acc.lipid.2026.uncontrolled_hypothyroidism', 'esc.lipid.2019.monitoring_ck_high'],
        priority: 90
      };
    }
  },

  {
    id: 'lipid.ckd.kidney_transplant_statin',
    module: 'lipid',
    nameVi: 'Bệnh nhân sau ghép thận: Cân nhắc khởi trị Statin liều thấp – trung bình và kiểm soát tương tác ức chế miễn dịch',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.ckd.2026.kidney_transplant_statin',
      'esc.lipid.2019.older_renal_ddi_low_start',
      'acc.lipid.2026.statin_doses'
    ],
    when: (ctx) => {
      if (!hasKidneyTransplant(ctx) || hasAscvdEquivalent(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.hasCyclosporine || safety.hasGemfibrozil) {
        return false;
      }
      return getActiveStatin(ctx) === null && need(ctx, 'ldl') !== undefined;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
      const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaModMax = thFor('dose_mg', 'lipid.dose.rosuva_moderate_max');
      const useRosuva =
        hasLipidDrugAllergy(ctx, 'atorvastatin') || safety.hasStrongCyp3a4Inhibitor;
      const drugId = useRosuva ? 'rosuvastatin' : 'atorvastatin';
      const doseText = useRosuva
        ? `${rosuvaStart}–${rosuvaModMax} mg 1 lần/ngày`
        : `${atorvaModMin}–${atorvaModMax} mg 1 lần/ngày`;
      const drugLabel = useRosuva ? 'Rosuvastatin' : 'Atorvastatin';
      const warnings = [
        'Bệnh nhân ghép thận: luôn kiểm tra tương tác với thuốc chống thải ghép (đặc biệt nếu chuyển sang phác đồ có Cyclosporine hoặc Everolimus/Sirolimus).',
        ...buildCommonLipidWarnings(ctx, { isStatin: true, drugId })
      ];

      return {
        id: 'rec_lipid_kidney_transplant_statin',
        module: 'lipid',
        tier: 'Bệnh nhân sau ghép thận (ESC 2026 CVD-CKD Class IIa)',
        tierOrder: 1,
        action: 'CONSIDER',
        drugId,
        dose: doseText,
        title: `Cân nhắc khởi trị ${drugLabel} liều thấp – trung bình (${doseText}) giảm biến cố tim mạch ở người ghép thận`,
        rationale:
          `Theo ESC 2026 CVD-CKD (Class IIa-B), người bệnh sau ghép thận có nguy cơ tim mạch xơ vữa cao và nên được cân nhắc phác đồ nền tảng statin khởi đầu liều thấp – trung bình (${drugLabel} ${doseText}), kết hợp giám sát sát chức năng thận ghép và tương tác thuốc ức chế miễn dịch.`,
        gates: [],
        warnings,
        citationIds: [
          'esc.ckd.2026.kidney_transplant_statin',
          'esc.lipid.2019.older_renal_ddi_low_start',
          'acc.lipid.2026.statin_doses'
        ],
        priority: 86
      };
    }
  },

  {
    id: 'lipid.hiv.primary_prevention',
    module: 'lipid',
    nameVi: 'Dự phòng tiên phát Statin ở người nhiễm HIV từ 40 tuổi (REPRIEVE)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2025.hiv_statin_primary',
      'esc.lipid.2025.hiv_reprieve_pitavastatin_4mg',
      'acc.lipid.2026.hiv_statin_cor1',
      'acc.lipid.2026.pitavastatin_dose'
    ],
    when: (ctx) => {
      if (!hasLipidFlag(ctx, 'hiv') || hasAscvdEquivalent(ctx) || hasClinicalFh(ctx)) {
        return false;
      }
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.onDialysis || safety.hasGemfibrozil) {
        return false;
      }
      if (getActiveStatin(ctx) !== null) return false;
      const age = need(ctx, 'age');
      const ldl = need(ctx, 'ldl');
      const minHivAge = thFor('age', 'lipid.hiv.primary_min_age');
      if (age === undefined || age < minHivAge || ldl === undefined) return false;

      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo) return false;
      const coveredByHighRiskStart =
        !safety.ddiBlocksStandardStatinStart &&
        !targetInfo.isTargetAchieved &&
        (targetInfo.riskTier === 'extreme' ||
          targetInfo.riskTier === 'very_high' ||
          targetInfo.riskTier === 'high');
      return !coveredByHighRiskStart;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const minHivAge = thFor('age', 'lipid.hiv.primary_min_age');
      const pitaHiv = thFor('dose_mg', 'lipid.dose.pitavastatin_hiv');
      const pitaRenalStart = thFor('dose_mg', 'lipid.dose.pita_renal_start');
      const pitaCkdMax = thFor('dose_mg', 'lipid.dose.pita_ckd_max');
      const pitaEryMax = thFor('dose_mg', 'lipid.dose.pita_erythromycin_max');
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaModMax = thFor('dose_mg', 'lipid.dose.rosuva_moderate_max');
      const egfrCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');

      if (safety.hasCyclosporine || hasLipidDrugAllergy(ctx, 'pitavastatin')) {
        const cycloCap = thFor('dose_mg', 'lipid.dose.rosuva_cyclosporine_max');
        const cap10 = thFor('dose_mg', 'lipid.dose.rosuva_antiviral_regorafenib_max');
        const isCyclo = safety.hasCyclosporine;
        const doseVal = isCyclo
          ? `Tối đa ${cycloCap} mg 1 lần/ngày`
          : `${rosuvaStart}–${cap10} mg 1 lần/ngày`;
        const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: 'rosuvastatin' });
        return {
          id: 'rec_lipid_hiv_primary_statin',
          module: 'lipid',
          tier: 'Dự phòng tiên phát ở người nhiễm HIV (ESC 2025 / ACC 2026 Class I)',
          tierOrder: 1,
          action: isCyclo ? 'CONSIDER' : 'START',
          drugId: 'rosuvastatin',
          dose: doseVal,
          title: isCyclo
            ? `Cân nhắc Rosuvastatin ≤ ${cycloCap} mg/ngày cho người nhiễm HIV ≥ ${minHivAge} tuổi đang dùng Cyclosporine`
            : `Khởi trị Rosuvastatin (${doseVal}) dự phòng tiên phát cho người nhiễm HIV ≥ ${minHivAge} tuổi (thay thế Pitavastatin)`,
          rationale: isCyclo
            ? `Người nhiễm HIV ≥ ${minHivAge} tuổi có chỉ định statin dự phòng tiên phát; do đang dùng Cyclosporine (chống chỉ định Pitavastatin), chuyển sang Rosuvastatin ≤ ${cycloCap} mg/ngày.`
            : `Người nhiễm HIV ≥ ${minHivAge} tuổi có tiền sử dị ứng Pitavastatin: lựa chọn Rosuvastatin (${doseVal}, tối đa ≤ ${cap10} mg/ngày nếu dùng ARV có cobicistat/ritonavir/atazanavir).`,
          gates: [],
          warnings: warnings.length ? warnings : undefined,
          citationIds: [
            'esc.lipid.2025.hiv_statin_primary',
            'acc.lipid.2026.hiv_statin_cor1',
            'acc.lipid.2026.statin_doses',
            ...(isCyclo ? ['fda.rosuvastatin.cyclosporine_dose_cap'] : ['fda.rosuvastatin.antiviral_10mg_cap'])
          ],
          priority: isCyclo ? 86 : 89
        };
      }

      const isModCkd = safety.egfr !== undefined && safety.egfr < egfrCutoff;
      const hasAtazanavir = hasMed(ctx, 'atazanavir');
      const doseText = safety.hasErythromycin
        ? `${pitaEryMax} mg 1 lần/ngày (giới hạn do Erythromycin)`
        : isModCkd || hasAtazanavir
          ? `Khởi đầu ${pitaRenalStart} mg, tối đa ${pitaCkdMax} mg 1 lần/ngày`
          : `${pitaHiv} mg 1 lần/ngày`;
      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: 'pitavastatin' });

      return {
        id: 'rec_lipid_hiv_primary_statin',
        module: 'lipid',
        tier: 'Dự phòng tiên phát ở người nhiễm HIV (ESC 2025 / ACC 2026 Class I)',
        tierOrder: 1,
        action: 'START',
        drugId: 'pitavastatin',
        dose: doseText,
        title: `Khởi trị Statin dự phòng tiên phát (Pitavastatin — thử nghiệm REPRIEVE) cho người nhiễm HIV ≥ ${minHivAge} tuổi`,
        rationale:
          `Theo ESC/EAS 2025 (Class I-B) và ACC/AHA 2026 (COR 1), người nhiễm HIV ≥ ${minHivAge} tuổi được khuyến cáo khởi trị statin dự phòng tiên phát bất kể điểm SCORE2 hay mức LDL-C nền. ` +
          `Ưu tiên Pitavastatin (${doseText}) hoặc lựa chọn Rosuvastatin ${rosuvaStart}–${rosuvaModMax} mg/ngày sau khi kiểm tra tương tác thuốc ARV.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: [
          'esc.lipid.2025.hiv_statin_primary',
          'esc.lipid.2025.hiv_reprieve_pitavastatin_4mg',
          'acc.lipid.2026.hiv_statin_cor1',
          'acc.lipid.2026.pitavastatin_dose',
          'acc.lipid.2026.statin_doses',
          'fda.rosuvastatin.asian_dose'
        ],
        priority: 89
      };
    }
  },

  {
    id: 'lipid.tg.statin_first_high_risk',
    module: 'lipid',
    nameVi: 'Khởi trị Statin đầu tay ở bệnh nhân nguy cơ cao có tăng Triglyceride (> 2.3 mmol/L)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2019.htg_statin_first',
      'byt.lipid.2020.tg_2_3_statin_first',
      'acc.lipid.2026.statin_doses'
    ],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.hardBlockedForStatinInit ||
        safety.ddiBlocksStandardStatinStart ||
        safety.onDialysis ||
        getActiveStatin(ctx) !== null ||
        hasIsolatedHfWithoutStatinIndication(ctx) ||
        (hasKidneyTransplant(ctx) && !hasAscvdEquivalent(ctx)) ||
        (hasLipidFlag(ctx, 'hiv') && !hasAscvdEquivalent(ctx) && !hasClinicalFh(ctx))
      ) {
        return false;
      }
      const tg = need(ctx, 'tg');
      const tgCutoff = thFor('tg', 'lipid.tg.elevated_cv_risk');
      const tgFriedewald = thFor('tg', 'lipid.tg.friedewald_invalid');
      if (tg === undefined || tg <= tgCutoff) return false;
      if (hasAscvdEquivalent(ctx) && tg > tgFriedewald) return false;
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo || !targetInfo.isTargetAchieved) return false;
      return (
        targetInfo.riskTier === 'extreme' ||
        targetInfo.riskTier === 'very_high' ||
        targetInfo.riskTier === 'high'
      );
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      if (tg === undefined) return null;
      const safety = assessStatinSafety(ctx);
      const chosen = pickSafeHighStatin(ctx, safety);
      const tgCutoff = thFor('tg', 'lipid.tg.elevated_cv_risk');
      const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
      const atorvaHighMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const rosuvaModMax = thFor('dose_mg', 'lipid.dose.rosuva_moderate_max');
      const rosuvaHighMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const tgDisplay = formatTg(tg, ctx);
      const cutoffDisplay = formatTg(tgCutoff, ctx);
      const useRosuva = chosen?.drugId === 'rosuvastatin';
      const drugId = useRosuva ? 'rosuvastatin' : 'atorvastatin';
      const doseText = useRosuva
        ? `${rosuvaModMax}–${rosuvaHighMin} mg 1 lần/ngày`
        : `${atorvaModMax}–${atorvaHighMin} mg 1 lần/ngày`;
      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId });

      return {
        id: 'rec_lipid_tg_statin_first',
        module: 'lipid',
        tier: 'Tăng Triglyceride ở bệnh nhân nguy cơ cao (ESC Class I)',
        tierOrder: 1,
        action: isOlderOrFrailPrimary(ctx) ? 'CONSIDER' : 'START',
        drugId,
        dose: doseText,
        title: `Khởi trị Statin là thuốc hàng đầu để giảm nguy cơ tim mạch khi TG > ${cutoffDisplay} ở nhóm nguy cơ cao`,
        rationale:
          `Ở bệnh nhân nguy cơ cao / rất cao có tăng Triglyceride (TG ${tgDisplay} > ${cutoffDisplay}), ESC/EAS (Class I-B) và Bộ Y tế khuyến cáo Statin là thuốc đầu tay giảm biến cố ASCVD ngay cả khi LDL-C ước tính đã thấp.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: [
          'esc.lipid.2019.htg_statin_first',
          'byt.lipid.2020.tg_2_3_statin_first',
          'acc.lipid.2026.statin_doses'
        ],
        priority: 88
      };
    }
  }
];
