/**
 * GDMT-VN Lipid Module - Active Statin, Keeper Ranking & Fibrate Helpers
 * Phân quyền: Agent I5 (Round 3 Remediation — split from helpers.safety.ts)
 */

import type { RuleContext } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  FIBRATE_DRUG_IDS,
  STATIN_DRUG_IDS,
  assessStatinSafety,
  expandLipidMedComponents,
  findRawMedsWithComponent,
  getLipidDrugDisplayName,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  parseLipidComponentDoseMg,
  type ActiveStatinInfo,
  type RawMedMatch,
  type StatinSafetyAssessment
} from './helpers.safety';

export * from './helpers.safety';

const STATIN_POTENCY_SCORE: Record<string, number> = {
  rosuvastatin: 5,
  atorvastatin: 4,
  pitavastatin: 3,
  simvastatin: 2,
  lovastatin: 1,
  pravastatin: 1,
  fluvastatin: 1
};

export function getActiveStatins(ctx: RuleContext): ActiveStatinInfo[] {
  const safety = assessStatinSafety(ctx);
  const atorvaHighMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
  const atorvaCypMax = thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max');
  const rosuvaHighMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
  const rosuvaCycloMax = thFor('dose_mg', 'lipid.dose.rosuva_cyclosporine_max');
  const rosuvaDarolMax = thFor('dose_mg', 'lipid.dose.rosuva_darolutamide_max');
  const rosuvaAntiviralMax = thFor('dose_mg', 'lipid.dose.rosuva_antiviral_regorafenib_max');
  const rosuvaSevereCkdMax = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
  const rosuvaTicagMax = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
  const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
  const simvaCap10 = thFor('dose_mg', 'lipid.dose.simva_diltiazem_max');
  const simvaCap20 = thFor('dose_mg', 'lipid.dose.simva_amiodarone_max');
  const simvaTicagMax = thFor('dose_mg', 'lipid.dose.simva_ticagrelor_max');
  const lovaDronedMax = thFor('dose_mg', 'lipid.dose.lovastatin_dronedarone_max');
  const lovaCcbMax = thFor('dose_mg', 'lipid.dose.lovastatin_ccb_max');
  const lovaAmioMax = thFor('dose_mg', 'lipid.dose.lovastatin_amiodarone_ticagrelor_max');
  const fluvaClariMax = thFor('dose_mg', 'lipid.dose.fluvastatin_clarithro_max');
  const fluvaCycloMax = thFor('dose_mg', 'lipid.dose.fluvastatin_cyclosporine_max');
  const pitaCkdMax = thFor('dose_mg', 'lipid.dose.pita_ckd_max');
  const pitaEryMax = thFor('dose_mg', 'lipid.dose.pita_erythromycin_max');
  const pravaCap40 = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max');
  const egfrCkdCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');

  const hasBempedoic = hasMed(ctx, 'bempedoic_acid');
  const statinIntolerant = hasLipidFlag(ctx, 'statinIntolerance');
  const results: ActiveStatinInfo[] = [];

  for (const m of ctx.patient.currentMeds || []) {
    if (!m) continue;
    const comps = expandLipidMedComponents(m);
    const statinComp = comps.find((c) => STATIN_DRUG_IDS.has(c));
    if (!statinComp) continue;

    const rawDrugId = (m.drugId || '').trim().toLowerCase() || statinComp;
    const displayName = getLipidDrugDisplayName(rawDrugId, m.name);
    const doseMg = parseLipidComponentDoseMg(m, statinComp);
    const isFdc = comps.length > 1;

    const isHighIntensity =
      (statinComp === 'atorvastatin' && doseMg !== undefined && doseMg >= atorvaHighMin) ||
      (statinComp === 'rosuvastatin' && doseMg !== undefined && doseMg >= rosuvaHighMin);

    let hasDoseViolation =
      statinIntolerant ||
      hasLipidDrugAllergy(ctx, rawDrugId) ||
      hasLipidDrugAllergy(ctx, statinComp) ||
      safety.isReproContra ||
      safety.hasSevereAlt ||
      safety.hasRhabdoRiskCk ||
      safety.hasModerateCk ||
      safety.hasGemfibrozil;

    if (statinComp === 'simvastatin') {
      if (
        safety.hasCyclosporine ||
        safety.hasStrongCyp3a4Inhibitor ||
        (doseMg !== undefined && doseMg > simvaMax) ||
        (safety.hasSimvaCap10Med && (doseMg === undefined || doseMg > simvaCap10)) ||
        ((safety.hasSimvaCap20Med || hasBempedoic) && (doseMg === undefined || doseMg > simvaCap20)) ||
        (safety.hasTicagrelor && (doseMg === undefined || doseMg > simvaTicagMax))
      ) {
        hasDoseViolation = true;
      }
    } else if (statinComp === 'lovastatin') {
      const hasDronedarone = hasMed(ctx, 'dronedarone');
      const hasLovaCcb =
        hasMed(ctx, 'diltiazem') ||
        hasMed(ctx, 'verapamil') ||
        hasMed(ctx, 'amlodipine') ||
        hasMed(ctx, 'ranolazine');
      const hasAmioOrTicag = hasMed(ctx, 'amiodarone') || safety.hasTicagrelor;
      if (
        safety.hasCyclosporine ||
        safety.hasStrongCyp3a4Inhibitor ||
        (hasDronedarone && (doseMg === undefined || doseMg > lovaDronedMax)) ||
        (hasLovaCcb && (doseMg === undefined || doseMg > lovaCcbMax)) ||
        (hasAmioOrTicag && (doseMg === undefined || doseMg > lovaAmioMax))
      ) {
        hasDoseViolation = true;
      }
    } else if (statinComp === 'atorvastatin') {
      if (
        safety.hasCyclosporine ||
        safety.hasAntiviralOrAzoleCyp3a4 ||
        ((safety.hasClarithroOrItra || safety.hasErythromycin) &&
          (doseMg === undefined || doseMg > atorvaCypMax))
      ) {
        hasDoseViolation = true;
      }
    } else if (statinComp === 'rosuvastatin') {
      if (
        safety.hasRosuvaAvoidMed ||
        ((safety.hasCyclosporine || safety.hasRosuvaCap5Med) &&
          (doseMg === undefined || doseMg > Math.min(rosuvaCycloMax, rosuvaDarolMax))) ||
        (safety.hasRosuvaCap10Med && (doseMg === undefined || doseMg > rosuvaAntiviralMax)) ||
        (safety.hasSevereCkd && (doseMg === undefined || doseMg > rosuvaSevereCkdMax)) ||
        (safety.hasTicagrelorOrFebuxostat && (doseMg === undefined || doseMg > rosuvaTicagMax))
      ) {
        hasDoseViolation = true;
      }
    } else if (statinComp === 'pitavastatin') {
      const isModerateOrWorseCkd =
        safety.onDialysis || (safety.egfr !== undefined && safety.egfr < egfrCkdCutoff);
      if (
        safety.hasCyclosporine ||
        (isModerateOrWorseCkd && (doseMg === undefined || doseMg > pitaCkdMax)) ||
        (safety.hasErythromycin && (doseMg === undefined || doseMg > pitaEryMax))
      ) {
        hasDoseViolation = true;
      }
    } else if (statinComp === 'pravastatin') {
      if (
        (safety.hasSevereCkd ||
          safety.hasCyclosporine ||
          safety.hasClarithroOrItra ||
          safety.hasErythromycin ||
          hasBempedoic) &&
        (doseMg === undefined || doseMg > pravaCap40)
      ) {
        hasDoseViolation = true;
      }
    } else if (statinComp === 'fluvastatin') {
      const hasFluconazole = hasMed(ctx, 'fluconazole');
      if (
        (hasMed(ctx, 'clarithromycin') && (doseMg === undefined || doseMg > fluvaClariMax)) ||
        ((safety.hasCyclosporine || hasFluconazole) &&
          (doseMg === undefined || doseMg > fluvaCycloMax))
      ) {
        hasDoseViolation = true;
      }
    }

    const isAtMaxSafeDose =
      !hasDoseViolation &&
      (isHighIntensity ||
        safety.onDialysis ||
        (statinComp === 'atorvastatin' &&
          (safety.hasClarithroOrItra || safety.hasErythromycin) &&
          (doseMg === undefined || doseMg >= atorvaCypMax)) ||
        (statinComp === 'rosuvastatin' &&
          (safety.hasCyclosporine ||
            safety.hasRosuvaCap5Med ||
            safety.hasRosuvaCap10Med ||
            safety.hasSevereCkd ||
            safety.egfr === undefined)));

    results.push({
      drugId: statinComp,
      rawDrugId,
      displayName,
      isFdc,
      allComponents: comps,
      doseMg,
      isHighIntensity,
      hasDoseViolation,
      isAtMaxSafeDose
    });
  }

  return results;
}

export function scoreStatinKeeper(item: ActiveStatinInfo, orderIdx: number): number {
  const validBonus = item.hasDoseViolation ? 0 : 100_000;
  const potency =
    STATIN_POTENCY_SCORE[item.drugId] !== undefined ? STATIN_POTENCY_SCORE[item.drugId] : 0;
  const dosePart = item.doseMg !== undefined ? item.doseMg : 0;
  return validBonus + potency * 1000 + dosePart - orderIdx * 0.01; // qa-allow: index - Xep hang uu tien giu 1 statin hop le manh nhat
}

export function getActiveStatin(ctx: RuleContext): ActiveStatinInfo | null {
  const all = getActiveStatins(ctx);
  if (all.length === 0) return null;
  if (all.length === 1) return all[0];
  const ranked = all
    .map((item, idx) => ({ item, score: scoreStatinKeeper(item, idx) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0].item;
}

export function getDuplicateStatinLosers(ctx: RuleContext): ActiveStatinInfo[] {
  const all = getActiveStatins(ctx);
  if (all.length < 2) return [];
  const ranked = all
    .map((item, idx) => ({ item, score: scoreStatinKeeper(item, idx) }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(1).map((r) => r.item);
}

export function pickSafeHighStatin(
  ctx: RuleContext,
  safety: StatinSafetyAssessment
): { drugId: 'atorvastatin' | 'rosuvastatin'; nameVi: string; isAllergyFallback: boolean } | null {
  const atorvaAllergy = hasLipidDrugAllergy(ctx, 'atorvastatin');
  const rosuvaAllergy = hasLipidDrugAllergy(ctx, 'rosuvastatin');

  const canUseHighAtorva =
    !atorvaAllergy &&
    !safety.hasGemfibrozil &&
    !safety.hasCyclosporine &&
    !safety.hasStrongCyp3a4Inhibitor;

  const canUseHighRosuva =
    !rosuvaAllergy &&
    !safety.hasGemfibrozil &&
    !safety.hasCyclosporine &&
    !safety.hasRosuvaAvoidMed &&
    !safety.hasRosuvaCap5Med &&
    !safety.hasRosuvaCap10Med &&
    !safety.hasSevereCkd &&
    safety.egfr !== undefined;

  if (canUseHighAtorva) {
    return { drugId: 'atorvastatin', nameVi: 'Atorvastatin', isAllergyFallback: false };
  }
  if (canUseHighRosuva) {
    return { drugId: 'rosuvastatin', nameVi: 'Rosuvastatin', isAllergyFallback: atorvaAllergy };
  }
  return null;
}

export function getActiveFibrateMatches(ctx: RuleContext): RawMedMatch[] {
  const out: RawMedMatch[] = [];
  for (const id of FIBRATE_DRUG_IDS) {
    for (const m of findRawMedsWithComponent(ctx, id)) {
      if (!out.some((x) => x.rawDrugId === m.rawDrugId)) out.push(m);
    }
  }
  return out;
}
