/**
 * GDMT-VN Lipid Module - Safety & Condition Assessment Helpers
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ALL_LIPID_COMPONENT_IDS,
  BILE_ACID_SEQUESTRANT_IDS,
  PCSK9_DRUG_IDS,
  expandLipidMedComponents,
  findRawMedsWithComponent,
  hasLipidDrugAllergy,
  normalizeLipidDrugToken
} from './helpers.meds';

export * from './helpers.meds';

export interface ActiveStatinInfo {
  drugId: string;
  rawDrugId: string;
  displayName: string;
  isFdc: boolean;
  allComponents: string[];
  doseMg?: number;
  isHighIntensity: boolean;
  hasDoseViolation: boolean;
  isAtMaxSafeDose: boolean;
}

export interface StatinSafetyAssessment {
  isPregnant: boolean;
  isBreastfeeding: boolean;
  isPlanningPregnancy: boolean;
  isReproContra: boolean;
  isCompensatedChildPughA: boolean;
  childPughClass: 'A' | 'B' | 'C' | null;
  hasSevereAlt: boolean;
  hasCirrhosisAny: boolean;
  hasGallbladderContra: boolean;
  hasAcutePancreatitis: boolean;
  hasUntreatedHypo: boolean;
  hasMyasthenia: boolean;
  hasRhabdoRiskCk: boolean;
  hasModerateCk: boolean;
  onDialysis: boolean;
  hasSevereCkd: boolean;
  egfr?: number;
  altUln?: number;
  ckUln?: number;
  hasGemfibrozil: boolean;
  hasCyclosporine: boolean;
  hasAntiviralOrAzoleCyp3a4: boolean;
  hasClarithroOrItra: boolean;
  hasErythromycin: boolean;
  hasStrongCyp3a4Inhibitor: boolean;
  hasRosuvaAvoidMed: boolean;
  hasRosuvaCap5Med: boolean;
  hasRosuvaCap10Med: boolean;
  hasSimvaCap10Med: boolean;
  hasSimvaCap20Med: boolean;
  hasTicagrelor: boolean;
  hasTicagrelorOrFebuxostat: boolean;
  hasBileAcidSequestrant: boolean;
  hasVka: boolean;
  hasAnyOac: boolean;
  hasColchicine: boolean;
  ddiBlocksStandardStatinStart: boolean;
  hardBlockedForStatinInit: boolean;
}

const ANTIVIRAL_AZOLE_CYP3A4_SET = new Set([
  'nirmatrelvir_ritonavir',
  'ritonavir',
  'cobicistat',
  'tipranavir',
  'atazanavir',
  'darunavir',
  'ketoconazole',
  'posaconazole',
  'voriconazole',
  'indinavir',
  'nelfinavir',
  'saquinavir',
  'lopinavir_ritonavir',
  'boceprevir',
  'telaprevir'
]);

const CLARI_ITRA_CYP3A4_SET = new Set(['clarithromycin', 'itraconazole', 'nefazodone']);
const ERYTHROMYCIN_SET = new Set(['erythromycin']);
const ROSUVA_AVOID_SET = new Set([
  'ledipasvir_sofosbuvir',
  'ledipasvir',
  'voxilaprevir',
  'sofosbuvir_velpatasvir_voxilaprevir'
]);
const ROSUVA_CAP5_SET = new Set(['darolutamide']);
const ROSUVA_CAP10_SET = new Set([
  'nirmatrelvir_ritonavir',
  'ritonavir',
  'cobicistat',
  'atazanavir',
  'lopinavir_ritonavir',
  'regorafenib',
  'capmatinib',
  'glecaprevir_pibrentasvir',
  'elbasvir_grazoprevir',
  'sofosbuvir_velpatasvir',
  'simeprevir'
]);
const ROSUVA_CAP20_SET = new Set([
  'ticagrelor',
  'febuxostat',
  'teriflunomide',
  'fostamatinib',
  'tafamidis'
]);
const SIMVA_CAP10_SET = new Set(['diltiazem', 'verapamil', 'dronedarone']);
const SIMVA_CAP20_CV_SET = new Set(['amlodipine', 'amiodarone', 'ranolazine', 'lomitapide']);
const VKA_SET = new Set(['warfarin', 'acenocoumarol']);
const ANY_OAC_SET = new Set([
  'warfarin',
  'acenocoumarol',
  'apixaban',
  'rivaroxaban',
  'dabigatran',
  'edoxaban'
]);

const NON_STANDARD_CUSTOM_FLAGS = new Set([
  'polyvascular',
  'polyvascularDisease',
  'hiv',
  'historyPancreatitis',
  'acutePancreatitis',
  'acute_pancreatitis',
  'gallbladderDisease',
  'cholelithiasis',
  'biliaryCirrhosis',
  'biliaryObstruction',
  'cholestasis',
  'tendonRuptureHistory',
  'carotid',
  'claudication',
  'aorticAneurysm',
  'planningPregnancy',
  'pregnancyPlanned',
  'untreatedHypothyroidism',
  'hypothyroidism_untreated',
  'myastheniaGravis',
  'myasthenia_gravis',
  'ocular_myasthenia',
  'kidneyTransplant',
  'kidney_transplant',
  't1dm',
  'type1Diabetes',
  'asian',
  'subclinicalImagingAscvd',
  'diabeticRetinopathy',
  'diabeticNeuropathy'
]);

export function hasLipidFlag(ctx: RuleContext, key: string): boolean {
  if (!NON_STANDARD_CUSTOM_FLAGS.has(key)) {
    if (hasCondition(ctx, key)) return true;
  }
  const cNorm = ctx.normalized?.conditions?.[key];
  if (cNorm === true) return true;
  const cVal = ctx.patient.conditions?.[key];
  if (cVal === true) return true;
  const customNorm = ctx.normalized?.customInputs?.[key];
  if (customNorm === true || customNorm === 'true') return true;
  const customVal = ctx.patient.customInputs?.[key];
  return customVal === true || customVal === 'true';
}

export function getCustomNumber(ctx: RuleContext, key: string): number | undefined {
  const candidates = [ctx.normalized?.customInputs?.[key], ctx.patient.customInputs?.[key]];
  for (const raw of candidates) {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

export function getChildPughClass(ctx: RuleContext): 'A' | 'B' | 'C' | null {
  const raw =
    ctx.normalized?.customInputs?.childPugh ??
    ctx.patient.customInputs?.childPugh ??
    ctx.normalized?.customInputs?.childPughClass ??
    ctx.patient.customInputs?.childPughClass;
  if (raw !== undefined && raw !== null) {
    const up = String(raw).trim().toUpperCase();
    if (up === 'A' || up === 'CHILD-PUGH A' || up === 'CPA') return 'A';
    if (up === 'B' || up === 'CHILD-PUGH B' || up === 'CPB') return 'B';
    if (up === 'C' || up === 'CHILD-PUGH C' || up === 'CPC') return 'C';
  }
  if (ctx.patient.conditions?.childPughC === true) return 'C';
  if (ctx.patient.conditions?.childPughB === true) return 'B';
  if (ctx.patient.conditions?.childPughA === true) return 'A';
  return null;
}

export function hasMed(ctx: RuleContext, drugId: string): boolean {
  const target = normalizeLipidDrugToken(drugId);
  for (const m of ctx.patient.currentMeds || []) {
    if (!m) continue;
    const raw = (m.drugId || '').trim().toLowerCase();
    if (raw === target || normalizeLipidDrugToken(raw) === target) return true;
    const comps = expandLipidMedComponents(m);
    if (comps.includes(target)) return true;
  }
  return false;
}

export function hasAnyMedInSet(ctx: RuleContext, idSet: Set<string>): boolean {
  for (const m of ctx.patient.currentMeds || []) {
    if (!m) continue;
    const raw = (m.drugId || '').trim().toLowerCase();
    if (idSet.has(raw) || idSet.has(normalizeLipidDrugToken(raw))) return true;
    const comps = expandLipidMedComponents(m);
    if (comps.some((c) => idSet.has(c))) return true;
  }
  return false;
}

export function getMedDoseMg(ctx: RuleContext, drugId: string): number | undefined {
  const matches = findRawMedsWithComponent(ctx, drugId);
  for (const m of matches) {
    if (m.doseMg !== undefined) return m.doseMg;
  }
  return undefined;
}

export function hasPcsk9(ctx: RuleContext): boolean {
  return hasAnyMedInSet(ctx, PCSK9_DRUG_IDS);
}

export function getActivePcsk9Ids(ctx: RuleContext): string[] {
  const seen = new Set<string>();
  for (const m of ctx.patient.currentMeds || []) {
    for (const c of expandLipidMedComponents(m)) {
      if (PCSK9_DRUG_IDS.has(c)) seen.add(c);
    }
  }
  return Array.from(seen);
}

export function getActiveLipidMeds(ctx: RuleContext): string[] {
  const found: string[] = [];
  for (const m of ctx.patient.currentMeds || []) {
    if (!m) continue;
    const comps = expandLipidMedComponents(m);
    if (comps.some((c) => ALL_LIPID_COMPONENT_IDS.has(c))) {
      const rawId = (m.drugId || '').trim().toLowerCase() || comps[0];
      if (rawId && !found.includes(rawId)) found.push(rawId);
    }
  }
  return found;
}

export function hasAscvdEquivalent(ctx: RuleContext): boolean {
  return (
    hasLipidFlag(ctx, 'ascvd') ||
    hasLipidFlag(ctx, 'strokeOrTia') ||
    hasLipidFlag(ctx, 'recentAcs') ||
    hasLipidFlag(ctx, 'vascularDisease') ||
    hasLipidFlag(ctx, 'polyvascular') ||
    hasLipidFlag(ctx, 'polyvascularDisease') ||
    hasLipidFlag(ctx, 'acuteAcsWithin24h') ||
    hasLipidFlag(ctx, 'recurrentAcsWithin2Years') ||
    hasLipidFlag(ctx, 'acuteIschemicStroke') ||
    hasLipidFlag(ctx, 'cad') ||
    hasLipidFlag(ctx, 'ccs') ||
    hasLipidFlag(ctx, 'acs') ||
    hasLipidFlag(ctx, 'mi') ||
    hasLipidFlag(ctx, 'stemi') ||
    hasLipidFlag(ctx, 'nstemi') ||
    hasLipidFlag(ctx, 'pci') ||
    hasLipidFlag(ctx, 'cabg') ||
    hasLipidFlag(ctx, 'stroke') ||
    hasLipidFlag(ctx, 'tia') ||
    hasLipidFlag(ctx, 'carotid') ||
    hasLipidFlag(ctx, 'carotidPlaque') ||
    hasLipidFlag(ctx, 'aorticPlaque') ||
    hasLipidFlag(ctx, 'pad') ||
    hasLipidFlag(ctx, 'claudication') ||
    hasLipidFlag(ctx, 'aorticAneurysm') ||
    hasLipidFlag(ctx, 'subclinicalImagingAscvd')
  );
}

export function isWocbp(ctx: RuleContext): boolean {
  if (ctx.patient.sex !== 'female') return false;
  if (
    hasLipidFlag(ctx, 'pregnant') ||
    hasLipidFlag(ctx, 'breastfeeding') ||
    hasLipidFlag(ctx, 'planningPregnancy') ||
    hasLipidFlag(ctx, 'pregnancyPlanned')
  ) {
    return false;
  }
  const age = need(ctx, 'age');
  if (age === undefined) return false;
  return age >= 15 && age <= 50; // qa-allow: index - Do tuoi sinh san nu gioi (15-50 tuoi) de nhac tu van tranh thai
}

export function isAsianPatient(ctx: RuleContext): boolean {
  if (ctx.settings.profile === 'VN') return true;
  if (hasLipidFlag(ctx, 'asian')) return true;
  const eth = String(ctx.patient.customInputs?.ethnicity ?? ctx.patient.customInputs?.race ?? '')
    .trim()
    .toLowerCase();
  return eth === 'asian' || eth === 'vietnamese' || eth === 'east_asian';
}

export function hasGallbladderContra(ctx: RuleContext): boolean {
  return (
    hasLipidFlag(ctx, 'gallbladderDisease') ||
    hasLipidFlag(ctx, 'cholelithiasis') ||
    hasLipidFlag(ctx, 'biliaryCirrhosis') ||
    hasLipidFlag(ctx, 'biliaryObstruction') ||
    hasLipidFlag(ctx, 'cholestasis')
  );
}

export function hasAcutePancreatitis(ctx: RuleContext): boolean {
  return hasLipidFlag(ctx, 'acutePancreatitis') || hasLipidFlag(ctx, 'acute_pancreatitis');
}

export function hasUntreatedHypothyroidism(ctx: RuleContext): boolean {
  if (
    hasLipidFlag(ctx, 'untreatedHypothyroidism') ||
    hasLipidFlag(ctx, 'hypothyroidism_untreated')
  ) {
    return true;
  }
  const tsh = getCustomNumber(ctx, 'tsh');
  return tsh !== undefined && tsh > 10 && !hasMed(ctx, 'levothyroxine'); // qa-allow: index - Suy giap ro tren xet nghiem TSH > 10 mIU/L chua dung levothyroxine
}

export function hasMyastheniaGravis(ctx: RuleContext): boolean {
  return (
    hasLipidFlag(ctx, 'myastheniaGravis') ||
    hasLipidFlag(ctx, 'myasthenia_gravis') ||
    hasLipidFlag(ctx, 'ocular_myasthenia') ||
    hasMed(ctx, 'pyridostigmine')
  );
}

export function hasKidneyTransplant(ctx: RuleContext): boolean {
  return hasLipidFlag(ctx, 'kidneyTransplant') || hasLipidFlag(ctx, 'kidney_transplant');
}

export function assessStatinSafety(ctx: RuleContext): StatinSafetyAssessment {
  const isPregnant = hasLipidFlag(ctx, 'pregnant');
  const isBreastfeeding = hasLipidFlag(ctx, 'breastfeeding') || hasLipidFlag(ctx, 'lactation');
  const isPlanningPregnancy =
    hasLipidFlag(ctx, 'planningPregnancy') || hasLipidFlag(ctx, 'pregnancyPlanned');
  const isReproContra = isPregnant || isBreastfeeding || isPlanningPregnancy;

  const altUln = need(ctx, 'altUlnTimes');
  const ckUln = need(ctx, 'ckUlnTimes');
  const egfr = need(ctx, 'egfr');
  const onDialysis = hasLipidFlag(ctx, 'onDialysis');
  const childPughClass = getChildPughClass(ctx);

  const altLimit = thFor('altulntimes', 'lipid.safety.alt_uln_elevation');
  const ckModLimit = thFor('ckulntimes', 'lipid.safety.ck_uln_elevation');
  const ckRhabdoLimit = thFor('ckulntimes', 'lipid.safety.ck_uln_rhabdomyolysis');
  const egfrSevereCutoff = thFor('egfr', 'lipid.safety.egfr_severe_ckd');

  const hasActiveOrDecompLiver =
    hasLipidFlag(ctx, 'activeLiverDisease') ||
    hasLipidFlag(ctx, 'decompensatedCirrhosis') ||
    hasLipidFlag(ctx, 'biliaryObstruction') ||
    childPughClass === 'B' ||
    childPughClass === 'C';

  const isCompensatedChildPughA =
    childPughClass === 'A' &&
    !hasActiveOrDecompLiver &&
    !(altUln !== undefined && altUln >= altLimit);

  const hasCirrhosisAny =
    childPughClass !== null ||
    hasLipidFlag(ctx, 'cirrhosis') ||
    hasLipidFlag(ctx, 'decompensatedCirrhosis') ||
    hasLipidFlag(ctx, 'liverDisease');

  const hasSevereAlt =
    hasActiveOrDecompLiver ||
    (altUln !== undefined && altUln >= altLimit) ||
    (!isCompensatedChildPughA &&
      (hasLipidFlag(ctx, 'liverDisease') || hasLipidFlag(ctx, 'cirrhosis')));

  const hasRhabdoRiskCk = ckUln !== undefined && ckUln >= ckRhabdoLimit;
  const hasModerateCk = ckUln !== undefined && ckUln > ckModLimit && ckUln < ckRhabdoLimit;
  const hasSevereCkd = onDialysis || (egfr !== undefined && egfr < egfrSevereCutoff);

  const hasGemfibrozil = hasMed(ctx, 'gemfibrozil');
  const hasCyclosporine = hasMed(ctx, 'cyclosporine') || hasMed(ctx, 'ciclosporin');
  const hasAntiviralOrAzoleCyp3a4 = hasAnyMedInSet(ctx, ANTIVIRAL_AZOLE_CYP3A4_SET);
  const hasClarithroOrItra = hasAnyMedInSet(ctx, CLARI_ITRA_CYP3A4_SET);
  const hasErythromycin = hasAnyMedInSet(ctx, ERYTHROMYCIN_SET);
  const hasStrongCyp3a4Inhibitor =
    hasAntiviralOrAzoleCyp3a4 || hasClarithroOrItra || hasErythromycin;

  const hasRosuvaAvoidMed = hasAnyMedInSet(ctx, ROSUVA_AVOID_SET);
  const hasRosuvaCap5Med = hasAnyMedInSet(ctx, ROSUVA_CAP5_SET);
  const hasRosuvaCap10Med = hasAnyMedInSet(ctx, ROSUVA_CAP10_SET);
  const hasSimvaCap10Med = hasAnyMedInSet(ctx, SIMVA_CAP10_SET);
  const hasSimvaCap20Med = hasAnyMedInSet(ctx, SIMVA_CAP20_CV_SET);
  const hasTicagrelor = hasMed(ctx, 'ticagrelor');
  const hasTicagrelorOrFebuxostat = hasAnyMedInSet(ctx, ROSUVA_CAP20_SET);
  const hasBileAcidSequestrant = hasAnyMedInSet(ctx, BILE_ACID_SEQUESTRANT_IDS);
  const hasVka = hasAnyMedInSet(ctx, VKA_SET);
  const hasAnyOac = hasAnyMedInSet(ctx, ANY_OAC_SET);
  const hasColchicine = hasMed(ctx, 'colchicine');
  const hasGallbladder = hasGallbladderContra(ctx);
  const hasAcutePanc = hasAcutePancreatitis(ctx);
  const hasUntreatedHypo = hasUntreatedHypothyroidism(ctx);
  const hasMyasthenia = hasMyastheniaGravis(ctx);

  const ddiBlocksStandardStatinStart =
    hasGemfibrozil || hasCyclosporine || hasStrongCyp3a4Inhibitor;

  const allStatinsAllergic =
    hasLipidDrugAllergy(ctx, 'atorvastatin') &&
    hasLipidDrugAllergy(ctx, 'rosuvastatin') &&
    hasLipidDrugAllergy(ctx, 'pitavastatin') &&
    hasLipidDrugAllergy(ctx, 'pravastatin');

  const hardBlockedForStatinInit =
    isReproContra ||
    hasSevereAlt ||
    hasRhabdoRiskCk ||
    hasModerateCk ||
    hasAcutePanc ||
    (hasUntreatedHypo && ctx.settings.setting !== 'inpatient') ||
    (onDialysis && !hasAscvdEquivalent(ctx)) ||
    hasLipidFlag(ctx, 'statinIntolerance') ||
    allStatinsAllergic;

  return {
    isPregnant,
    isBreastfeeding,
    isPlanningPregnancy,
    isReproContra,
    isCompensatedChildPughA,
    childPughClass,
    hasSevereAlt,
    hasCirrhosisAny,
    hasGallbladderContra: hasGallbladder,
    hasAcutePancreatitis: hasAcutePanc,
    hasUntreatedHypo,
    hasMyasthenia,
    hasRhabdoRiskCk,
    hasModerateCk,
    onDialysis,
    hasSevereCkd,
    egfr,
    altUln,
    ckUln,
    hasGemfibrozil,
    hasCyclosporine,
    hasAntiviralOrAzoleCyp3a4,
    hasClarithroOrItra,
    hasErythromycin,
    hasStrongCyp3a4Inhibitor,
    hasRosuvaAvoidMed,
    hasRosuvaCap5Med,
    hasRosuvaCap10Med,
    hasSimvaCap10Med,
    hasSimvaCap20Med,
    hasTicagrelor,
    hasTicagrelorOrFebuxostat,
    hasBileAcidSequestrant,
    hasVka,
    hasAnyOac,
    hasColchicine,
    ddiBlocksStandardStatinStart,
    hardBlockedForStatinInit
  };
}
