import type { RuleContext, CurrentMed } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  EffectiveInhalerTier,
  InhalerClassProfile,
  DPI_INHALER_IDS,
  DUAL_FORM_LACTOSE_INHALER_IDS,
  CYP3A4_SENSITIVE_INHALER_IDS,
  getInhalerProfile,
} from './helpers.constants';
import {
  getBloodEos,
  hasWeakInspiratoryFlow,
  hasMilkProteinAllergy,
  hasStrongCyp3a4Inhibitor,
  hasAnticholinergicContra,
  hasConcurrentAsthma,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  hasConfirmedCopdSpirometry,
  hasConfirmedStableCopd,
  isHighSymptomsConfirmed,
  isGroupEConfirmed,
  isLowExacerbationConfirmed,
} from './helpers.clinical';
import { willAsthmaModulePrescribeIcsLaba } from './helpers.aco';

export function selectTripleInhaler(
  ctx: RuleContext
):
  | 'fluticasone_furoate_umeclidinium_vilanterol'
  | 'budesonide_glycopyrronium_formoterol'
  | 'beclometasone_glycopyrronium_formoterol' {
  if (hasStrongCyp3a4Inhibitor(ctx)) {
    return 'beclometasone_glycopyrronium_formoterol';
  }
  if (
    hasWeakInspiratoryFlow(ctx) ||
    hasMilkProteinAllergy(ctx) ||
    (ctx.normalized.selectedModules.includes('asthma') && !willAsthmaModulePrescribeIcsLaba(ctx))
  ) {
    return 'budesonide_glycopyrronium_formoterol';
  }
  return 'fluticasone_furoate_umeclidinium_vilanterol';
}

export function resolveEffectiveInhaler(ctx: RuleContext): EffectiveInhalerTier {
  const rawExplicit = ctx.normalized.customInputs?.currentInhaler ?? ctx.patient.customInputs?.currentInhaler;
  let explicitTier: EffectiveInhalerTier = 'none';
  if (
    rawExplicit === 'lama_mono' ||
    rawExplicit === 'laba_mono' ||
    rawExplicit === 'laba_lama' ||
    rawExplicit === 'ics_laba' ||
    rawExplicit === 'triple'
  ) {
    explicitTier = rawExplicit;
  }

  let hasIcs = false;
  let hasLama = false;
  let hasLaba = false;
  for (const med of ctx.normalized.currentMeds) {
    const prof = getInhalerProfile(med.drugId);
    if (!prof) continue;
    if (prof.ics && !prof.lama && !prof.laba) continue;
    if (prof.ics) hasIcs = true;
    if (prof.lama) hasLama = true;
    if (prof.laba) hasLaba = true;
  }

  let medsTier: EffectiveInhalerTier = 'none';
  if (hasIcs && hasLama && hasLaba) medsTier = 'triple';
  else if (hasLama && hasLaba) medsTier = 'laba_lama';
  else if (hasIcs && hasLaba) medsTier = 'ics_laba';
  else if (hasLama) medsTier = 'lama_mono';
  else if (hasLaba) medsTier = 'laba_mono';

  if (medsTier !== 'none') {
    return medsTier;
  }
  return explicitTier;
}

export interface DuplicateInhalerStopItem {
  med: CurrentMed;
  duplicateComponent: 'lama' | 'laba' | 'ics';
}

export function getDuplicateBaselineInhalersToStop(ctx: RuleContext): DuplicateInhalerStopItem[] {
  const entries = ctx.normalized.currentMeds
    .map((med, idx) => ({ med, prof: getInhalerProfile(med.drugId), idx }))
    .filter(
      (item): item is { med: CurrentMed; prof: InhalerClassProfile; idx: number } => item.prof !== undefined
    );

  if (entries.length < 2) return []; // qa-allow: index - cần tối thiểu 2 thuốc hít để có trùng lặp

  const lamaItems = entries.filter((e) => e.prof.lama);
  const labaItems = entries.filter((e) => e.prof.laba);
  const icsItems = entries.filter((e) => e.prof.ics);

  if (lamaItems.length <= 1 && labaItems.length <= 1 && icsItems.length <= 1) {
    return [];
  }

  const sortedByRank = [...entries].sort((a, b) => b.prof.rank - a.prof.rank || a.idx - b.idx);
  const keptIndices = new Set<number>();
  let coveredLama = false;
  let coveredLaba = false;
  let coveredIcs = false;

  for (const item of sortedByRank) {
    const addsLama = item.prof.lama && !coveredLama;
    const addsLaba = item.prof.laba && !coveredLaba;
    const addsIcs =
      item.prof.ics && !coveredIcs && (item.prof.lama || item.prof.laba || hasConcurrentAsthma(ctx));
    const overlapsExisting =
      (item.prof.lama && coveredLama) ||
      (item.prof.laba && coveredLaba) ||
      (item.prof.ics && coveredIcs);

    if ((addsLama || addsLaba || addsIcs) && !overlapsExisting) {
      keptIndices.add(item.idx);
      if (item.prof.lama) coveredLama = true;
      if (item.prof.laba) coveredLaba = true;
      if (item.prof.ics) coveredIcs = true;
    }
  }

  if (keptIndices.size === 0) {
    keptIndices.add(sortedByRank[0].idx);
    if (sortedByRank[0].prof.lama) coveredLama = true;
    if (sortedByRank[0].prof.laba) coveredLaba = true;
    if (sortedByRank[0].prof.ics) coveredIcs = true;
  }

  const toStop: DuplicateInhalerStopItem[] = [];
  for (const item of entries) {
    if (keptIndices.has(item.idx)) continue;
    if (
      item.prof.ics &&
      !item.prof.lama &&
      !item.prof.laba &&
      !hasConcurrentAsthma(ctx) &&
      icsItems.length === 1
    ) {
      continue;
    }
    const comp: 'lama' | 'laba' | 'ics' =
      item.prof.lama && lamaItems.length > 1
        ? 'lama'
        : item.prof.laba && labaItems.length > 1
          ? 'laba'
          : 'ics';
    toStop.push({ med: item.med, duplicateComponent: comp });
  }
  return toStop;
}

export function isMedExplicitlyLactoseFreeDevice(med: CurrentMed): boolean {
  const nameLower = (med.name || '').toLowerCase();
  const idLower = (med.drugId || '').toLowerCase();
  return (
    nameLower.includes('respimat') ||
    nameLower.includes('evohaler') ||
    nameLower.includes('rapihaler') ||
    nameLower.includes('aerosphere') ||
    nameLower.includes('pmdi') ||
    idLower.endsWith('_respimat') ||
    idLower.endsWith('_evohaler') ||
    idLower.endsWith('_rapihaler')
  );
}

const EXPLICIT_DPI_NAME_KEYWORDS = [
  'handihaler',
  'turbuhaler',
  'accuhaler',
  'diskus',
  'ellipta',
  'breezhaler',
  'nexthaler',
  'genuair',
  'inhub',
  'dpi',
  'bột khô',
];

export function isMedExplicitlyDpiName(med: CurrentMed): boolean {
  const nameLower = (med.name || '').toLowerCase();
  if (!nameLower) return false;
  return EXPLICIT_DPI_NAME_KEYWORDS.some((kw) => nameLower.includes(kw));
}

export function isMedDpiDevice(med: CurrentMed): boolean {
  const id = med.drugId?.trim().toLowerCase();
  if (!id) return false;
  if (DPI_INHALER_IDS.has(id)) return true;
  if (isMedExplicitlyLactoseFreeDevice(med)) return false;
  if (isMedExplicitlyDpiName(med)) return true;
  if (
    id === 'salmeterol' ||
    id === 'serevent' ||
    id === 'fluticasone_salmeterol' ||
    id === 'seretide' ||
    id === 'advair'
  ) {
    return true;
  }
  return false;
}

export function getAllActiveDpiInhalerMeds(ctx: RuleContext): CurrentMed[] {
  const results: CurrentMed[] = [];
  const seen = new Set<string>();
  for (const med of ctx.normalized.currentMeds) {
    const id = med.drugId?.trim().toLowerCase();
    if (!id || !isMedDpiDevice(med)) continue;
    const key = `${id}:${(med.name || '').trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(med);
  }
  return results;
}

export function getActiveDpiInhalerMed(ctx: RuleContext): CurrentMed | undefined {
  return getAllActiveDpiInhalerMeds(ctx)[0];
}

export function getAllActiveCyp3a4SensitiveInhalerMeds(ctx: RuleContext): CurrentMed[] {
  const results: CurrentMed[] = [];
  const seen = new Set<string>();
  for (const med of ctx.normalized.currentMeds) {
    const id = med.drugId?.trim().toLowerCase();
    if (!id || !CYP3A4_SENSITIVE_INHALER_IDS.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    results.push(med);
  }
  return results;
}

/**
 * Tìm bình hít đa dạng bào chế (Spiriva, Symbicort, Seretide, Foster, Trimbow) đang dùng
 * chưa ghi rõ dạng không chứa lactose (Respimat/Rapihaler/Evohaler/pMDI) và cũng chưa ghi rõ tên DPI.
 */
export function getDualFormLactoseDeviceWarningMed(ctx: RuleContext): CurrentMed | undefined {
  if (!hasWeakInspiratoryFlow(ctx) && !hasMilkProteinAllergy(ctx)) return undefined;
  for (const med of ctx.normalized.currentMeds) {
    const id = med.drugId?.trim().toLowerCase();
    if (!id) continue;
    if (
      DUAL_FORM_LACTOSE_INHALER_IDS.has(id) &&
      !isMedExplicitlyLactoseFreeDevice(med) &&
      !isMedDpiDevice(med)
    ) {
      return med;
    }
  }
  return undefined;
}

export function isInappropriateIcsDeEscalationCandidate(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'outpatient') return false;
  if (!hasConfirmedStableCopd(ctx)) return false;
  if (hasConcurrentAsthma(ctx)) return false;
  if (hasAnticholinergicContra(ctx)) return false;
  const eff = resolveEffectiveInhaler(ctx);
  if (eff !== 'ics_laba' && eff !== 'triple') return false;
  if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return false;
  if (!isLowExacerbationConfirmed(ctx)) return false;
  if (eff === 'ics_laba' && isHighSymptomsConfirmed(ctx)) return false;
  const eos = getBloodEos(ctx);
  return eos !== undefined && eos < thFor('bloodEos', 'copd.eosinophils_low');
}

export function getDpiSwitchTargetDrugId(ctx: RuleContext): string | undefined {
  if (!hasConfirmedCopdSpirometry(ctx)) return undefined;
  if (hasOutpatientAcuteRespiratoryFailure(ctx)) return undefined;
  if (!hasWeakInspiratoryFlow(ctx) && !hasMilkProteinAllergy(ctx)) return undefined;
  if (isAcuteExacerbation(ctx) && !hasMilkProteinAllergy(ctx)) return undefined;

  const activeDpi = getActiveDpiInhalerMed(ctx);
  if (!activeDpi) return undefined;

  if (hasAnticholinergicContra(ctx)) {
    const p = getInhalerProfile(activeDpi.drugId);
    if (!p || p.lama) return undefined;
    if (p.ics && p.laba) {
      return willAsthmaModulePrescribeIcsLaba(ctx)
        ? undefined
        : hasStrongCyp3a4Inhibitor(ctx)
          ? 'beclometasone_formoterol'
          : 'budesonide_formoterol';
    }
    return 'olodaterol';
  }

  const eff = resolveEffectiveInhaler(ctx);
  const eos = getBloodEos(ctx);
  const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
  if (
    eff === 'triple' ||
    (eff === 'ics_laba' &&
      (hasConcurrentAsthma(ctx) ||
        (!priorPneum &&
          isGroupEConfirmed(ctx) &&
          eos !== undefined &&
          eos >= thFor('bloodEos', 'copd.eosinophils_low')) ||
        (!priorPneum && eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_high'))))
  ) {
    return willAsthmaModulePrescribeIcsLaba(ctx) ? 'tiotropium' : selectTripleInhaler(ctx);
  }
  if (eff === 'laba_lama' || eff === 'ics_laba') {
    return 'tiotropium_olodaterol';
  }
  if (eff === 'lama_mono') {
    return 'tiotropium';
  }
  if (eff === 'laba_mono') {
    return hasAnticholinergicContra(ctx) ? 'olodaterol' : 'tiotropium';
  }
  return undefined;
}

export function getCyp3a4SafeSwitchTargetDrugId(ctx: RuleContext): string | undefined {
  if (!hasConfirmedCopdSpirometry(ctx)) return undefined;
  if (hasOutpatientAcuteRespiratoryFailure(ctx)) return undefined;
  if (!hasStrongCyp3a4Inhibitor(ctx)) return undefined;

  const sensitiveMeds = getAllActiveCyp3a4SensitiveInhalerMeds(ctx);
  if (sensitiveMeds.length === 0) return undefined;

  if (hasAnticholinergicContra(ctx)) {
    const eff = resolveEffectiveInhaler(ctx);
    if (eff === 'triple' || eff === 'ics_laba' || hasConcurrentAsthma(ctx)) {
      return willAsthmaModulePrescribeIcsLaba(ctx) ? undefined : 'beclometasone_formoterol';
    }
    return 'olodaterol';
  }

  const eff = resolveEffectiveInhaler(ctx);
  const eos = getBloodEos(ctx);
  const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);

  if (
    eff === 'triple' ||
    (eff === 'ics_laba' &&
      (hasConcurrentAsthma(ctx) ||
        (!priorPneum &&
          isGroupEConfirmed(ctx) &&
          eos !== undefined &&
          eos >= thFor('bloodEos', 'copd.eosinophils_low')) ||
        (!priorPneum && eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_high'))))
  ) {
    return willAsthmaModulePrescribeIcsLaba(ctx)
      ? 'tiotropium'
      : 'beclometasone_glycopyrronium_formoterol';
  }

  if (eff === 'laba_lama' || eff === 'ics_laba') {
    return 'tiotropium_olodaterol';
  }
  if (eff === 'lama_mono') {
    return 'tiotropium';
  }
  if (eff === 'laba_mono') {
    return 'olodaterol';
  }
  return undefined;
}
