/**
 * GDMT-VN Lipid Module - Outpatient Statin Step 1 (High / Very-High / Extreme Risk)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { RuleContext, Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import { CHOL_CONVERSION_FACTOR } from '../../engine/units';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLipidRiskBundle,
  formatChol,
  formatTargetLdl,
  formatTg,
  getActiveLipidMeds,
  getActiveStatin,
  hasAscvdEquivalent,
  hasClinicalFh,
  hasIsolatedHfWithoutStatinIndication,
  hasKidneyTransplant,
  hasLipidDrugAllergy,
  hasLipidFlag,
  isClass2bExtremeOnlyUnmet,
  isOlderOrFrailPrimary,
  isOlderOrFrailSecondary,
  isUsIschemicHfref,
  pickSafeHighStatin
} from './helpers';

function isNearGoalPrimaryConsider(
  ctx: RuleContext,
  riskTier: 'extreme' | 'very_high' | 'high' | 'moderate' | 'low',
  ldl: number
): boolean {
  if (hasAscvdEquivalent(ctx) || hasLipidFlag(ctx, 'dm') || hasClinicalFh(ctx)) {
    return false;
  }
  const highTarget = thFor('ldl', 'lipid.target.high_ldl');
  const modTarget = thFor('ldl', 'lipid.target.moderate_ldl');
  const isBelowCutoff = (cutoffMmol: number): boolean =>
    ctx.settings.units.lipid === 'mg_dL'
      ? Math.round(ldl * CHOL_CONVERSION_FACTOR) < Math.round(cutoffMmol * CHOL_CONVERSION_FACTOR)
      : ldl < cutoffMmol;
  if (riskTier === 'very_high') {
    return isBelowCutoff(highTarget);
  }
  if (riskTier === 'high') {
    const egfr = need(ctx, 'egfr');
    const egfrCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
    const ldlSevere = thFor('ldl', 'lipid.target.ldl_severe_elevation');
    const tc = need(ctx, 'tc');
    const tcSevere = thFor('tc', 'lipid.target.tc_severe_elevation');
    const sbp = need(ctx, 'sbp');
    const dbp = need(ctx, 'dbp');
    const grade3Sbp = thFor('sbp', 'lipid.bp.grade3_sbp');
    const grade3Dbp = thFor('dbp', 'lipid.bp.grade3_dbp');
    const hasSingleSevereFactor =
      (egfr !== undefined && egfr < egfrCutoff) ||
      hasLipidFlag(ctx, 'ckd') ||
      ldl >= ldlSevere ||
      (tc !== undefined && tc > tcSevere) ||
      (sbp !== undefined && sbp >= grade3Sbp) ||
      (dbp !== undefined && dbp >= grade3Dbp);
    return !hasSingleSevereFactor && isBelowCutoff(modTarget);
  }
  return false;
}

function isFriedewaldFalseGoalNaiveAscvd(ctx: RuleContext): boolean {
  if (!hasAscvdEquivalent(ctx) || getActiveLipidMeds(ctx).length > 0) return false;
  const tg = need(ctx, 'tg');
  const tgInvalid = thFor('tg', 'lipid.tg.friedewald_invalid');
  return tg !== undefined && tg > tgInvalid;
}

export const lipidStatinInitRules: Rule[] = [
  {
    id: 'lipid.step1.statin_high_or_very_high',
    module: 'lipid',
    nameVi: 'Bước 1: Khởi trị Statin cường độ cao cho nhóm nguy cơ cao / rất cao / cực cao',
    citationIds: [
      'esc.ckd.2026.dialysis_ascvd_statin_consider',
      'acc.lipid.2026.statin_doses',
      'esc.lipid.2019.older_gt75_primary_consider',
      'acc.lipid.2026.older_gt75_consider',
      'esc.lipid.2019.older_renal_ddi_low_start',
      'esc.lipid.2019.statin_high_dose_rec',
      'esc.lipid.2019.target_very_high',
      'esc.lipid.2019.target_very_high_primary',
      'fda.rosuvastatin.renal_impairment',
      'fda.rosuvastatin.ticagrelor_limit_20mg',
      'fda.rosuvastatin.asian_dose',
      'esc.lipid.2019.target_recurrent_acs',
      'esc.lipid.2025.extreme_risk_polyvascular',
      'esc.lipid.2019.target_high',
      'esc.lipid.2025.table4_ldl_3_0_column'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.hardBlockedForStatinInit || safety.ddiBlocksStandardStatinStart) return false;
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      if (hasKidneyTransplant(ctx) && !hasAscvdEquivalent(ctx)) return false;
      if (getActiveStatin(ctx) !== null) return false;
      const bundle = evaluateLipidRiskBundle(ctx);
      if (!bundle) return false;
      const { targetInfo } = bundle;
      if (targetInfo.isTargetAchieved && !isFriedewaldFalseGoalNaiveAscvd(ctx)) return false;
      return (
        targetInfo.riskTier === 'extreme' ||
        targetInfo.riskTier === 'very_high' ||
        targetInfo.riskTier === 'high'
      );
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const bundle = evaluateLipidRiskBundle(ctx);
      if (ldl === undefined || !bundle) return null;
      const { targetInfo, cacScore, preventCategory, calculatorWarning } = bundle;

      const safety = assessStatinSafety(ctx);
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
      const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
      const rosuvaCkdMax = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const minPct = thFor('ldl_reduction_pct', 'lipid.target.percent_reduction_min');
      const elderlyAge = thFor('age', 'lipid.elderly.primary_consider_age');
      const vhLdl = thFor('ldl', 'lipid.target.very_high_ldl');
      const vhMgDl = thFor('ldl_mgdl', 'lipid.target.very_high_ldl_mgdl');
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      if (safety.onDialysis && hasAscvdEquivalent(ctx)) {
        const useRosuvaDial = hasLipidDrugAllergy(ctx, 'atorvastatin') && !hasLipidDrugAllergy(ctx, 'rosuvastatin');
        const dialDrug = useRosuvaDial ? 'rosuvastatin' : 'atorvastatin';
        const dialDose = useRosuvaDial
          ? `${rosuvaStart}–${rosuvaCkdMax} mg 1 lần/ngày (tối đa ${rosuvaCkdMax} mg/ngày ở lọc máu)`
          : `${atorvaModMin}–${atorvaModMax} mg 1 lần/ngày (cá thể hóa ở bệnh nhân lọc máu có ASCVD)`;
        const dialCids = ['esc.ckd.2026.dialysis_ascvd_statin_consider', 'acc.lipid.2026.statin_doses'];
        if (useRosuvaDial) dialCids.push('fda.rosuvastatin.renal_impairment');
        return {
          id: 'rec_lipid_dialysis_ascvd_consider_statin',
          module: 'lipid',
          tier: 'Bước 1 — ASCVD kèm lọc máu chu kỳ (ESC 2026 Class IIb)',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: dialDrug,
          dose: dialDose,
          title: `Cân nhắc khởi trị ${useRosuvaDial ? 'Rosuvastatin' : 'Atorvastatin'} (${dialDose}) cho bệnh nhân lọc máu chu kỳ kèm ASCVD`,
          rationale:
            `Khác với lọc máu không kèm ASCVD (Class III), ở bệnh nhân lọc máu chu kỳ đã có ASCVD xác định (LDL-C hiện tại ${ldlDisplay}), ESC 2026 cho phép cân nhắc khởi trị statin liều thấp – trung bình và theo dõi sát triệu chứng cơ.`,
          gates: [],
          warnings: buildCommonLipidWarnings(ctx, { isStatin: true, drugId: dialDrug }),
          citationIds: dialCids,
          priority: 86
        };
      }

      if (isUsIschemicHfref(ctx) && !hasLipidFlag(ctx, 'recentAcs')) {
        const useRosuvaHf = hasLipidDrugAllergy(ctx, 'atorvastatin');
        const hfDrug = useRosuvaHf ? 'rosuvastatin' : 'atorvastatin';
        const hfDose = useRosuvaHf
          ? `${rosuvaStart}–${rosuvaCkdMax} mg 1 lần/ngày`
          : `${atorvaModMin}–${atorvaModMax} mg 1 lần/ngày`;
        return {
          id: 'rec_lipid_us_ischemic_hfref_consider_statin',
          module: 'lipid',
          tier: 'Bước 1 — HFrEF do bệnh tim thiếu máu cục bộ (ACC/AHA 2026 COR 2b)',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: hfDrug,
          dose: hfDose,
          title: `Cân nhắc khởi trị Statin cường độ trung bình (${useRosuvaHf ? 'Rosuvastatin' : 'Atorvastatin'} ${hfDose}) ở bệnh nhân HFrEF do thiếu máu cục bộ`,
          rationale:
            `Theo ACC/AHA 2026 (COR 2b, LOE B-R), ở bệnh nhân HFrEF (LVEF ≤ ${thFor('lvef', 'lipid.hf.href_lvef_cutoff')}%) do bệnh tim thiếu máu cục bộ chưa dùng statin và có kỳ vọng sống hợp lý, có thể cân nhắc khởi trị statin cường độ trung bình sau khi thảo luận lợi ích – nguy cơ.`,
          gates: [],
          warnings: buildCommonLipidWarnings(ctx, { isStatin: true, drugId: hfDrug }),
          citationIds: [
            'acc.lipid.2026.hfref_ischemic_cor2b',
            'esc.hf.2026.href_lvef_40',
            'acc.lipid.2026.statin_doses'
          ],
          priority: 83
        };
      }

      if (isOlderOrFrailPrimary(ctx)) {
        const useRosuvaOld = hasLipidDrugAllergy(ctx, 'atorvastatin');
        const oldDrug = useRosuvaOld ? 'rosuvastatin' : 'atorvastatin';
        const oldDose = useRosuvaOld
          ? `${rosuvaStart}–${rosuvaCkdMax} mg 1 lần/ngày`
          : `${atorvaModMin}–${atorvaModMax} mg 1 lần/ngày (khởi đầu liều thấp và chỉnh liều thận trọng)`;
        const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: oldDrug });
        if (calculatorWarning) warnings.push(calculatorWarning);
        return {
          id: 'rec_lipid_older_frail_primary_consider_statin',
          module: 'lipid',
          tier: 'Bước 1 — Dự phòng tiên phát người cao tuổi / suy yếu',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: oldDrug,
          dose: oldDose,
          title: `Cân nhắc khởi trị Statin liều thấp – trung bình (${useRosuvaOld ? 'Rosuvastatin' : 'Atorvastatin'} ${oldDose}) ở người > ${elderlyAge} tuổi hoặc suy yếu`,
          rationale:
            `Ở dự phòng tiên phát cho người > ${elderlyAge} tuổi, suy yếu hoặc kỳ vọng sống hạn chế (LDL-C ${ldlDisplay}, đích tham chiếu < ${targetDisplay}), ESC/EAS (Class IIb) và ACC/AHA 2026 khuyến cáo thảo luận lợi ích – nguy cơ và ưu tiên khởi đầu liều thấp – trung bình.`,
          gates: [],
          warnings: warnings.length ? warnings : undefined,
          citationIds: [
            'esc.lipid.2019.older_gt75_primary_consider',
            'acc.lipid.2026.older_gt75_consider',
            'esc.lipid.2019.older_renal_ddi_low_start',
            'acc.lipid.2026.statin_doses'
          ],
          priority: 82
        };
      }

      const chosenHigh = pickSafeHighStatin(ctx, safety);
      const atorvaAllergy = hasLipidDrugAllergy(ctx, 'atorvastatin');
      const rosuvaAllergy = hasLipidDrugAllergy(ctx, 'rosuvastatin');

      let selectedDrugId: string = chosenHigh ? chosenHigh.drugId : 'atorvastatin';
      let selectedDose = `${atorvaMin}–${atorvaMax} mg 1 lần/ngày`;
      let selectedLabel = `Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày`;

      if (chosenHigh?.drugId === 'rosuvastatin') {
        const cappedBcrp = safety.hasTicagrelorOrFebuxostat || ctx.settings.profile === 'VN';
        selectedDrugId = 'rosuvastatin';
        selectedDose = cappedBcrp
          ? `${rosuvaMin} mg 1 lần/ngày`
          : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`;
        selectedLabel = `Rosuvastatin ${selectedDose}`;
      } else if (!chosenHigh && atorvaAllergy && !rosuvaAllergy) {
        selectedDrugId = 'rosuvastatin';
        selectedDose = `${rosuvaStart}–${rosuvaCkdMax} mg 1 lần/ngày`;
        selectedLabel = `Rosuvastatin ${rosuvaStart}–${rosuvaCkdMax} mg/ngày (giới hạn theo chức năng thận)`;
      } else if (!chosenHigh && atorvaAllergy && rosuvaAllergy) {
        selectedDrugId = hasLipidDrugAllergy(ctx, 'pitavastatin') ? 'pravastatin' : 'pitavastatin';
        const pMax =
          selectedDrugId === 'pitavastatin'
            ? thFor('dose_mg', 'lipid.dose.pita_max')
            : thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max');
        selectedDose = `${pMax} mg 1 lần/ngày`;
        selectedLabel = `${selectedDrugId === 'pitavastatin' ? 'Pitavastatin' : 'Pravastatin'} ${pMax} mg/ngày`;
      }

      const isFriedewaldFalseGoal = isFriedewaldFalseGoalNaiveAscvd(ctx) && targetInfo.isTargetAchieved;
      const isClass2bExtreme = !isFriedewaldFalseGoal && isClass2bExtremeOnlyUnmet(ctx, targetInfo);
      const isNearGoalPrimary = !isFriedewaldFalseGoal && isNearGoalPrimaryConsider(ctx, targetInfo.riskTier, ldl);
      const action =
        isClass2bExtreme || isNearGoalPrimary || hasLipidFlag(ctx, 'limitedLifespan')
          ? 'CONSIDER'
          : 'START';

      const tierLabelMap: Record<string, string> = {
        extreme: 'nguy cơ cực cao / đa giường mạch / tái phát',
        very_high: 'nguy cơ rất cao',
        high: 'nguy cơ cao'
      };

      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: selectedDrugId });
      if (calculatorWarning) warnings.push(calculatorWarning);

      const cids: string[] = ['esc.lipid.2019.statin_high_dose_rec', 'acc.lipid.2026.statin_doses'];
      if (safety.isCompensatedChildPughA) cids.push('acc.lipid.2026.chronic_stable_liver_cor2a');
      if (isOlderOrFrailSecondary(ctx)) {
        warnings.push(
          'Người cao tuổi / suy yếu hoặc kèm suy thận trong dự phòng thứ phát: cân nhắc khởi đầu ở mức liều thấp – trung bình và chuẩn độ tăng dần thận trọng theo dung nạp để đạt đích LDL-C.'
        );
        cids.push('esc.lipid.2019.older_renal_ddi_low_start');
      }
      if (isFriedewaldFalseGoal) {
        const tgVal = need(ctx, 'tg')!;
        warnings.push(
          `TG tăng cao (${formatTg(tgVal, ctx)}) làm công thức Friedewald ước tính LDL-C thấp giả tạo; vẫn bắt buộc khởi trị Statin cường độ cao ở bệnh nhân ASCVD và đánh giá thêm LDL-C trực tiếp / Non-HDL-C / ApoB.`
        );
        cids.push('esc.lipid.2019.friedewald_tg_4_5');
      }

      let alternativeNote: string;
      if (atorvaAllergy) {
        alternativeNote = `Do tiền sử dị ứng Atorvastatin, lựa chọn thay thế an toàn bằng ${selectedLabel}.`;
        if (selectedDrugId === 'rosuvastatin' && safety.hasSevereCkd) {
          cids.push('fda.rosuvastatin.renal_impairment');
        }
      } else if (safety.hasSevereCkd) {
        alternativeNote = `Ưu tiên Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày vì không cần chỉnh liều ở CKD nặng (eGFR < ${egfrSevere} mL/phút/1.73m²; Rosuvastatin giới hạn ≤ ${rosuvaCkdMax} mg/ngày).`;
        cids.push('fda.rosuvastatin.renal_impairment');
        warnings.push(`CKD nặng (eGFR < ${egfrSevere}): ưu tiên Atorvastatin; không dùng Rosuvastatin > ${rosuvaCkdMax} mg/ngày.`);
      } else if (safety.egfr === undefined) {
        alternativeNote = `Ưu tiên Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày khi chưa có Creatinine/eGFR vì không phụ thuộc thải trừ thận; xét nghiệm chức năng thận trước khi cân nhắc Rosuvastatin.`;
        warnings.push('Chưa có Creatinine/eGFR nền: ưu tiên Atorvastatin cho đến khi biết chức năng thận.');
      } else if (safety.hasTicagrelorOrFebuxostat) {
        alternativeNote = `Hoặc Rosuvastatin ${rosuvaMin} mg/ngày (không vượt quá ${rosuvaTicagCap} mg/ngày do tương tác BCRP với Ticagrelor/Febuxostat).`;
        cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
      } else if (ctx.settings.profile === 'VN') {
        alternativeNote = `Hoặc Rosuvastatin ${rosuvaMin} mg/ngày (cơ địa châu Á tăng gấp ~2 lần AUC rosuvastatin nên ưu tiên phối hợp Ezetimibe trước khi nâng lên ${rosuvaMax} mg).`;
        cids.push('fda.rosuvastatin.asian_dose');
      } else {
        alternativeNote = `Hoặc Rosuvastatin ${rosuvaMin}–${rosuvaMax} mg/ngày.`;
      }

      if (targetInfo.riskTier === 'extreme') {
        cids.push('esc.lipid.2019.target_very_high', 'esc.lipid.2019.target_recurrent_acs', 'esc.lipid.2025.extreme_risk_polyvascular');
      } else if (targetInfo.riskTier === 'very_high') {
        cids.push(
          hasAscvdEquivalent(ctx) || hasClinicalFh(ctx)
            ? 'esc.lipid.2019.target_very_high'
            : 'esc.lipid.2019.target_very_high_primary'
        );
        if (ctx.settings.profile === 'VN' && hasLipidFlag(ctx, 'dm')) cids.push('byt.lipid.2020.dm_very_high_1_4');
      } else {
        cids.push('esc.lipid.2019.target_high');
      }

      if (cacScore !== undefined) {
        const cacVh = thFor('cacscore', 'lipid.cac.very_high_min');
        const cacHi = thFor('cacscore', 'lipid.cac.high_risk_min');
        if (cacScore >= cacVh) cids.push('acc.lipid.2026.cac_1000_very_high');
        else if (cacScore >= cacHi) cids.push('acc.lipid.2026.cac_categories_300');
      }
      if (ctx.settings.profile === 'US' && preventCategory === 'high') cids.push('acc.lipid.2026.prevent_categories');
      if (bundle.isUsStandardRiskAscvd) cids.push('acc.lipid.2026.ascvd_not_very_high_70');
      if (isNearGoalPrimary) cids.push('esc.lipid.2025.table4_ldl_3_0_column');

      return {
        id: 'rec_lipid_step1_high_statin',
        module: 'lipid',
        tier: 'Bước 1 — Statin nền tảng cường độ cao',
        tierOrder: 1,
        action,
        drugId: selectedDrugId,
        dose: selectedDose,
        title:
          action === 'CONSIDER'
            ? `Cân nhắc khởi trị Statin (${selectedLabel})`
            : `Khởi trị Statin cường độ cao (${selectedLabel})`,
        rationale:
          `Bệnh nhân thuộc nhóm ${tierLabelMap[targetInfo.riskTier]} (LDL-C hiện tại ${ldlDisplay}, mục tiêu < ${targetDisplay} kèm giảm ≥ ${minPct}% so với mức nền). ` +
          `${alternativeNote}`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        profileDiff: {
          VN: `Tại Việt Nam: khởi đầu Atorvastatin ${atorvaMin} mg/ngày hoặc Rosuvastatin ${rosuvaMin} mg/ngày; nếu cần hạ sâu hơn ưu tiên phối hợp sớm Ezetimibe.`,
          US: `ACC/AHA 2026 đặt ngưỡng LDL-C thực hành ở ASCVD rất cao là < ${vhMgDl} mg/dL (< ${vhLdl.toFixed(1)} mmol/L) kèm giảm ≥ ${minPct}%.`
        },
        citationIds: Array.from(new Set(cids)),
        priority: action === 'START' ? 92 : 84
      };
    }
  }
];
