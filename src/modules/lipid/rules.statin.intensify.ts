/**
 * GDMT-VN Lipid Module - Step 1b Statin Uptitration & Safe Switch Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  evaluateLipidRiskBundle,
  findRawMedsWithComponent,
  formatChol,
  formatTargetLdl,
  getActiveStatin,
  hasIsolatedHfWithoutStatinIndication,
  hasLipidDrugAllergy,
  hasMed,
  isClass2bExtremeOnlyUnmet
} from './helpers';

export const lipidStatinIntensifyRules: Rule[] = [
  {
    id: 'lipid.step1b.intensify_moderate_statin',
    module: 'lipid',
    nameVi: 'Bước 1b: Tối ưu liều hoặc chuyển đổi sang Statin cường độ cao khi chưa đạt đích',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2019.statin_high_dose_rec',
      'esc.lipid.2019.target_moderate',
      'acc.lipid.2026.statin_doses',
      'acc.lipid.2026.simva_contra_80mg',
      'acc.lipid.2026.simvastatin_dose',
      'acc.lipid.2026.pravastatin_dose',
      'acc.lipid.2026.pitavastatin_dose',
      'fda.atorvastatin.clarithromycin_dose_cap',
      'fda.rosuvastatin.asian_dose',
      'fda.rosuvastatin.renal_impairment',
      'fda.rosuvastatin.ticagrelor_limit_20mg'
    ],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.hardBlockedForStatinInit ||
        safety.hasCyclosporine ||
        safety.hasGemfibrozil ||
        hasIsolatedHfWithoutStatinIndication(ctx)
      ) {
        return false;
      }
      if (safety.onDialysis) return false;

      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin || activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose) {
        return false;
      }

      if (
        activeStatin.drugId === 'simvastatin' &&
        activeStatin.doseMg !== undefined &&
        activeStatin.doseMg > thFor('dose_mg', 'lipid.dose.simva_max')
      ) {
        return false;
      }
      if (
        safety.hasAntiviralOrAzoleCyp3a4 &&
        (activeStatin.drugId === 'atorvastatin' ||
          activeStatin.drugId === 'simvastatin' ||
          activeStatin.drugId === 'lovastatin')
      ) {
        return false;
      }
      if (
        safety.hasStrongCyp3a4Inhibitor &&
        (activeStatin.drugId === 'simvastatin' || activeStatin.drugId === 'lovastatin')
      ) {
        return false;
      }
      if (
        (safety.hasClarithroOrItra || safety.hasErythromycin) &&
        activeStatin.drugId === 'atorvastatin' &&
        (activeStatin.doseMg === undefined ||
          activeStatin.doseMg >= thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max'))
      ) {
        return false;
      }

      const targetInfo = evaluateLipidRiskBundle(ctx)?.targetInfo;
      if (!targetInfo || targetInfo.isTargetAchieved) return false;

      if (targetInfo.riskTier === 'moderate') {
        if (activeStatin.hasDoseViolation || activeStatin.doseMg === undefined) return false;
        const modCapMap: Record<string, number> = {
          atorvastatin:
            safety.hasClarithroOrItra || safety.hasErythromycin
              ? thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max')
              : thFor('dose_mg', 'lipid.dose.atorva_moderate_max'),
          rosuvastatin: thFor('dose_mg', 'lipid.dose.rosuva_moderate_max'),
          simvastatin: safety.hasSimvaCap10Med
            ? thFor('dose_mg', 'lipid.dose.simva_diltiazem_max')
            : safety.hasSimvaCap20Med || hasMed(ctx, 'bempedoic_acid')
              ? thFor('dose_mg', 'lipid.dose.simva_amiodarone_max')
              : thFor('dose_mg', 'lipid.dose.simva_max'),
          pravastatin: thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max'),
          pitavastatin: safety.hasErythromycin
            ? thFor('dose_mg', 'lipid.dose.pita_erythromycin_max')
            : thFor('dose_mg', 'lipid.dose.pita_max')
        };
        const cap = modCapMap[activeStatin.drugId];
        return cap !== undefined && activeStatin.doseMg < cap;
      }

      const canSwitchViolatingSimvaOrLova =
        (activeStatin.drugId === 'simvastatin' || activeStatin.drugId === 'lovastatin') &&
        !hasMed(ctx, 'bempedoic_acid') &&
        !hasLipidDrugAllergy(ctx, activeStatin.rawDrugId) &&
        (safety.hasSimvaCap10Med || safety.hasSimvaCap20Med || safety.hasTicagrelor);
      if (activeStatin.hasDoseViolation && !canSwitchViolatingSimvaOrLova) {
        return false;
      }

      return (
        targetInfo.riskTier === 'extreme' ||
        targetInfo.riskTier === 'very_high' ||
        targetInfo.riskTier === 'high'
      );
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const targetInfo = evaluateLipidRiskBundle(ctx)?.targetInfo;
      const ldl = need(ctx, 'ldl');
      if (!activeStatin || !targetInfo || ldl === undefined) return null;

      const safety = assessStatinSafety(ctx);
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      if (targetInfo.riskTier === 'moderate') {
        const modCapMap: Record<string, number> = {
          atorvastatin:
            safety.hasClarithroOrItra || safety.hasErythromycin
              ? thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max')
              : thFor('dose_mg', 'lipid.dose.atorva_moderate_max'),
          rosuvastatin: thFor('dose_mg', 'lipid.dose.rosuva_moderate_max'),
          simvastatin: safety.hasSimvaCap10Med
            ? thFor('dose_mg', 'lipid.dose.simva_diltiazem_max')
            : safety.hasSimvaCap20Med || hasMed(ctx, 'bempedoic_acid')
              ? thFor('dose_mg', 'lipid.dose.simva_amiodarone_max')
              : thFor('dose_mg', 'lipid.dose.simva_max'),
          pravastatin: thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max'),
          pitavastatin: safety.hasErythromycin
            ? thFor('dose_mg', 'lipid.dose.pita_erythromycin_max')
            : thFor('dose_mg', 'lipid.dose.pita_max')
        };
        const targetModMg = modCapMap[activeStatin.drugId];
        const modDoseCitations: Record<string, string> = {
          atorvastatin: 'acc.lipid.2026.statin_doses',
          rosuvastatin: 'acc.lipid.2026.statin_doses',
          simvastatin: 'acc.lipid.2026.simvastatin_dose',
          pravastatin: 'acc.lipid.2026.pravastatin_dose',
          pitavastatin: 'acc.lipid.2026.pitavastatin_dose'
        };
        return {
          id: 'rec_lipid_step1b_uptitrate_moderate',
          module: 'lipid',
          tier: 'Bước 1 — Tối ưu liều Statin cường độ trung bình',
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          dose: `${targetModMg} mg 1 lần/ngày`,
          title: `Tăng liều ${activeStatin.displayName} (thành phần ${activeStatin.drugId} lên ${targetModMg} mg/ngày) để đạt đích LDL-C < ${targetDisplay}`,
          rationale: `LDL-C hiện tại (${ldlDisplay}) chưa đạt đích < ${targetDisplay} cho nhóm nguy cơ trung bình; tối ưu hóa liều statin cường độ trung bình trước khi phối hợp Ezetimibe.`,
          gates: [],
          citationIds: [
            'esc.lipid.2019.target_moderate',
            modDoseCitations[activeStatin.drugId] || 'acc.lipid.2026.statin_doses'
          ],
          priority: 82
        };
      }

      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const atorvaCypMax = thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max');
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaCkdMax = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');

      if (activeStatin.drugId === 'atorvastatin') {
        if (safety.hasClarithroOrItra || safety.hasErythromycin) {
          return {
            id: 'rec_lipid_step1b_uptitrate_atorva_cyp_cap',
            module: 'lipid',
            tier: 'Bước 1 — Tối ưu liều Statin theo trần tương tác',
            tierOrder: 1,
            action: 'UPTITRATE',
            drugId: activeStatin.rawDrugId,
            drugNameVi: activeStatin.displayName,
            dose: `Tối đa ${atorvaCypMax} mg 1 lần/ngày (giới hạn do tương tác CYP3A4)`,
            title: `Tăng liều Atorvastatin tối đa ${atorvaCypMax} mg/ngày (trần an toàn khi dùng Clarithromycin/Itraconazole/Erythromycin)`,
            rationale: `LDL-C hiện tại (${ldlDisplay}) chưa đạt đích < ${targetDisplay}; do tương tác CYP3A4, chỉ tăng Atorvastatin tối đa ${atorvaCypMax} mg/ngày.`,
            gates: [],
            citationIds: ['fda.atorvastatin.clarithromycin_dose_cap', 'acc.lipid.2026.statin_doses'],
            priority: 88
          };
        }
        return {
          id: 'rec_lipid_step1b_uptitrate_atorva',
          module: 'lipid',
          tier: 'Bước 1 — Tối ưu liều Statin cường độ cao',
          tierOrder: 1,
          action: isClass2bExtremeOnlyUnmet(ctx, targetInfo) ? 'CONSIDER' : 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          dose: `${atorvaMin}–${atorvaMax} mg 1 lần/ngày`,
          title: `Tăng liều Atorvastatin lên cường độ cao (${atorvaMin}–${atorvaMax} mg/ngày) trước khi phối hợp thuốc`,
          rationale: `LDL-C hiện tại (${ldlDisplay}) chưa đạt đích < ${targetDisplay}; tối ưu hóa lên liều dung nạp tối đa (${atorvaMin}–${atorvaMax} mg/ngày).`,
          gates: [],
          citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'acc.lipid.2026.statin_doses'],
          priority: 90
        };
      }

      if (activeStatin.drugId === 'rosuvastatin') {
        if (safety.hasSevereCkd || safety.egfr === undefined) {
          return null;
        }
        const cappedByBcrp = safety.hasTicagrelorOrFebuxostat;
        const doseStr = cappedByBcrp
          ? `${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày do dùng kèm Ticagrelor/Febuxostat)`
          : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`;
        const cids = [
          'esc.lipid.2019.statin_high_dose_rec',
          'acc.lipid.2026.statin_doses',
          'fda.rosuvastatin.asian_dose'
        ];
        if (cappedByBcrp) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
        return {
          id: 'rec_lipid_step1b_uptitrate_rosuva',
          module: 'lipid',
          tier: 'Bước 1 — Tối ưu liều Statin cường độ cao',
          tierOrder: 1,
          action: isClass2bExtremeOnlyUnmet(ctx, targetInfo) ? 'CONSIDER' : 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          dose: doseStr,
          title: cappedByBcrp
            ? `Tăng liều Rosuvastatin lên ${rosuvaMin} mg/ngày (trần ≤ ${rosuvaTicagCap} mg/ngày do Ticagrelor/Febuxostat)`
            : `Tăng liều Rosuvastatin lên cường độ cao (${rosuvaMin}–${rosuvaMax} mg/ngày)`,
          rationale: `LDL-C hiện tại (${ldlDisplay}) chưa đạt đích < ${targetDisplay}. Dược động học châu Á tăng gấp ~2 lần AUC Rosuvastatin nên ưu tiên mức ${rosuvaMin} mg/ngày kết hợp Ezetimibe trước khi nâng lên ${rosuvaMax} mg/ngày.`,
          gates: [],
          citationIds: cids,
          priority: 90
        };
      }

      const atorvaAllergy = hasLipidDrugAllergy(ctx, 'atorvastatin');
      const rosuvaAllergy = hasLipidDrugAllergy(ctx, 'rosuvastatin');
      if (atorvaAllergy && rosuvaAllergy) return null;

      const mustAvoidHighAtorva = safety.hasStrongCyp3a4Inhibitor || atorvaAllergy;
      const preferRosuva =
        !rosuvaAllergy &&
        (mustAvoidHighAtorva ||
          (!safety.hasSevereCkd &&
            safety.egfr !== undefined &&
            (safety.hasSimvaCap10Med || safety.hasSimvaCap20Med)));
      const switchTarget = preferRosuva ? 'rosuvastatin' : 'atorvastatin';
      const renalCappedRosuva = preferRosuva && (safety.hasSevereCkd || safety.egfr === undefined);
      const switchDose = preferRosuva
        ? renalCappedRosuva
          ? `${rosuvaStart}–${rosuvaCkdMax} mg 1 lần/ngày`
          : safety.hasTicagrelorOrFebuxostat
            ? `${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày)`
            : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`
        : `${atorvaMin}–${atorvaMax} mg 1 lần/ngày`;
      const switchName = preferRosuva ? 'Rosuvastatin' : 'Atorvastatin';
      const simvaContra = thFor('dose_mg', 'lipid.dose.simva_contra_dose');
      const switchCids = [
        'esc.lipid.2019.statin_high_dose_rec',
        'acc.lipid.2026.statin_doses',
        'acc.lipid.2026.simva_contra_80mg'
      ];
      if (renalCappedRosuva) {
        switchCids.push('fda.rosuvastatin.asian_dose', 'fda.rosuvastatin.renal_impairment');
      } else if (safety.hasTicagrelorOrFebuxostat && preferRosuva) {
        switchCids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
      }
      let unbundle = '';
      if (activeStatin.isFdc) {
        const m = findRawMedsWithComponent(ctx, activeStatin.drugId)[0]; // qa-allow: index - FDC chua statin
        if (m) unbundle = ` ${buildFdcUnbundleGuidanceVi(m, STATIN_DRUG_IDS)}`;
      }

      return {
        id: 'rec_lipid_step1b_switch_high_statin',
        module: 'lipid',
        tier: 'Bước 1 — Chuyển đổi sang Statin an toàn hiệu lực cao',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: switchTarget,
        switchFrom: activeStatin.rawDrugId,
        dose: switchDose,
        title: `Chuyển đổi từ ${activeStatin.displayName} sang ${switchName} (${switchDose})`,
        rationale:
          `LDL-C hiện tại (${ldlDisplay}) chưa đạt đích < ${targetDisplay}. Không tăng liều Simvastatin lên ${simvaContra} mg/ngày do nguy cơ tiêu cơ vân; ngừng ${activeStatin.displayName} và chuyển sang ${switchName} liều tối ưu an toàn.${unbundle}`,
        gates: [],
        citationIds: switchCids,
        priority: 90
      };
    }
  }
];
