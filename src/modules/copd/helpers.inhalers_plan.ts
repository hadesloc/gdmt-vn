import type { RuleContext, CurrentMed } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
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
  isCriticallyUnstableInpatient,
  hasOutpatientAcuteRespiratoryFailure,
  hasConfirmedCopdSpirometry,
  hasConfirmedStableCopd,
  isHighSymptomsConfirmed,
  isLowSymptomsConfirmed,
  isGroupEConfirmed,
  isLowExacerbationConfirmed,
} from './helpers.clinical';
import {
  getAsthmaPrescribedIcsLabaId,
  getAsthmaPrescribedMonoIcsId,
  willAsthmaModulePrescribeIcsLaba,
} from './helpers.aco';
import {
  selectTripleInhaler,
  resolveEffectiveInhaler,
  getDuplicateBaselineInhalersToStop,
  isInappropriateIcsDeEscalationCandidate,
  isMedDpiDevice,
  getDpiSwitchTargetDrugId,
  getCyp3a4SafeSwitchTargetDrugId,
} from './helpers.inhalers';

/**
 * Xác định thuốc hít duy trì mới mà module COPD dự kiến khởi trị/chuyển đổi ở lượt đánh giá hiện tại.
 */
export function getPlannedTherapeuticInhalerChangeDrugId(ctx: RuleContext): string | undefined {
  if (!hasConfirmedCopdSpirometry(ctx)) return undefined;
  if (hasAnticholinergicContra(ctx)) return undefined;

  const eff = resolveEffectiveInhaler(ctx);
  const hasAsthma = hasConcurrentAsthma(ctx);
  const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx);
  const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
  const asthmaHandlesIcsLaba = asthmaIcsLabaId !== undefined;
  const tripleId = selectTripleInhaler(ctx);

  if (asthmaMonoIcsId && !isAcuteExacerbation(ctx) && !hasOutpatientAcuteRespiratoryFailure(ctx)) {
    const hasExactDualOnly =
      eff === 'laba_lama' &&
      !ctx.normalized.currentMeds.some((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.ics && (p.laba || p.lama));
      });
    return hasExactDualOnly ? undefined : 'tiotropium_olodaterol';
  }

  if (asthmaIcsLabaId && eff === 'triple' && !isAcuteExacerbation(ctx) && !hasOutpatientAcuteRespiratoryFailure(ctx)) {
    const hasSingleInhalerTriple = ctx.normalized.currentMeds.some((m) => {
      const p = getInhalerProfile(m.drugId);
      return Boolean(p && p.ics && p.lama && p.laba);
    });
    if (hasSingleInhalerTriple) {
      return 'tiotropium';
    }
  }

  if (hasAsthma && (eff === 'lama_mono' || eff === 'laba_mono' || eff === 'laba_lama')) {
    if (asthmaMonoIcsId) {
      return eff === 'laba_lama' ? undefined : 'tiotropium_olodaterol';
    }
    return asthmaHandlesIcsLaba ? 'tiotropium' : tripleId;
  }

  if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return undefined;

  const eos = getBloodEos(ctx);
  const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);

  if (eff === 'none') {
    if (hasAsthma) return asthmaHandlesIcsLaba ? 'tiotropium' : tripleId;
    if (isGroupEConfirmed(ctx)) {
      if (eos === undefined) return undefined;
      return eos >= thFor('bloodEos', 'copd.eosinophils_high') ? tripleId : 'tiotropium_olodaterol';
    }
    if (isLowExacerbationConfirmed(ctx)) {
      if (isHighSymptomsConfirmed(ctx)) return 'tiotropium_olodaterol';
      if (isLowSymptomsConfirmed(ctx)) return 'tiotropium';
    }
    return undefined;
  }

  if (!hasAsthma && priorPneum && (eff === 'triple' || eff === 'ics_laba')) {
    return 'tiotropium_olodaterol';
  }

  if (isInappropriateIcsDeEscalationCandidate(ctx)) {
    return 'tiotropium_olodaterol';
  }

  if (eff === 'lama_mono' || eff === 'laba_mono') {
    if (isGroupEConfirmed(ctx)) {
      if (eos === undefined) return undefined;
      return !priorPneum && eos >= thFor('bloodEos', 'copd.eosinophils_high')
        ? tripleId
        : 'tiotropium_olodaterol';
    }
    if (isHighSymptomsConfirmed(ctx)) {
      return 'tiotropium_olodaterol';
    }
  }

  if (eff === 'laba_lama' && isGroupEConfirmed(ctx) && !priorPneum) {
    if (eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_low')) {
      return tripleId;
    }
  }

  if (eff === 'ics_laba' && (isGroupEConfirmed(ctx) || isHighSymptomsConfirmed(ctx))) {
    if (hasAsthma) return asthmaHandlesIcsLaba ? 'tiotropium' : tripleId;
    if (priorPneum) return 'tiotropium_olodaterol';
    if (eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_high')) {
      return tripleId;
    }
    if (isGroupEConfirmed(ctx)) {
      if (eos === undefined) return undefined;
      return eos >= thFor('bloodEos', 'copd.eosinophils_low') ? tripleId : 'tiotropium_olodaterol';
    }
    if (eos === undefined) return undefined;
    return 'tiotropium_olodaterol';
  }

  return undefined;
}

export function getLamaContraAlternativeTargetDrugId(
  ctx: RuleContext
): 'budesonide_formoterol' | 'beclometasone_formoterol' | 'olodaterol' | undefined {
  if (!hasConfirmedCopdSpirometry(ctx)) return undefined;
  if (!hasAnticholinergicContra(ctx)) return undefined;
  const hasAsthma = hasConcurrentAsthma(ctx);
  const hasExistingInhalerInMeds = ctx.normalized.currentMeds.some((m) =>
    Boolean(getInhalerProfile(m.drugId))
  );
  if (hasOutpatientAcuteRespiratoryFailure(ctx) && !(hasAsthma && hasExistingInhalerInMeds)) {
    return undefined;
  }

  if (hasAsthma && willAsthmaModulePrescribeIcsLaba(ctx)) return undefined;

  const preferredIcsLaba: 'budesonide_formoterol' | 'beclometasone_formoterol' =
    hasStrongCyp3a4Inhibitor(ctx) ? 'beclometasone_formoterol' : 'budesonide_formoterol';

  const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
  if (asthmaMonoIcsId !== undefined) {
    if (!hasConfirmedStableCopd(ctx)) return undefined;
    const hasExactMonoLabaOnly =
      ctx.normalized.currentMeds.some((m) => {
        const id = m.drugId?.trim().toLowerCase();
        const p = getInhalerProfile(id);
        if (!id || !p || !p.laba || p.lama || p.ics) return false;
        if ((hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx)) && isMedDpiDevice(m)) return false;
        if (hasStrongCyp3a4Inhibitor(ctx) && CYP3A4_SENSITIVE_INHALER_IDS.has(id)) return false;
        return true;
      }) &&
      !ctx.normalized.currentMeds.some((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.ics && (p.laba || p.lama));
      });
    return hasExactMonoLabaOnly ? undefined : 'olodaterol';
  }

  const hasSafeNonLamaIcsLaba = ctx.normalized.currentMeds.some((m) => {
    const id = m.drugId?.trim().toLowerCase();
    const p = getInhalerProfile(id);
    if (!id || !p || !p.ics || !p.laba || p.lama) return false;
    if ((hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx)) && isMedDpiDevice(m)) {
      return false;
    }
    if (hasStrongCyp3a4Inhibitor(ctx) && CYP3A4_SENSITIVE_INHALER_IDS.has(id)) {
      return false;
    }
    return true;
  });

  if (hasAsthma) {
    if (isCriticallyUnstableInpatient(ctx)) return undefined;
    return hasSafeNonLamaIcsLaba ? undefined : preferredIcsLaba;
  }

  const hasActiveLamaBeingStopped = ctx.normalized.currentMeds.some((m) =>
    Boolean(getInhalerProfile(m.drugId)?.lama)
  );
  if (!hasConfirmedStableCopd(ctx)) {
    if (!hasActiveLamaBeingStopped || isCriticallyUnstableInpatient(ctx)) {
      return undefined;
    }
  }

  const eos = getBloodEos(ctx);
  const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
  const hasSafeNonLamaLaba = ctx.normalized.currentMeds.some((m) => {
    const id = m.drugId?.trim().toLowerCase();
    const p = getInhalerProfile(id);
    if (!id || !p || !p.laba || p.lama || p.ics) return false;
    if ((hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx)) && isMedDpiDevice(m)) return false;
    if (hasStrongCyp3a4Inhibitor(ctx) && CYP3A4_SENSITIVE_INHALER_IDS.has(id)) return false;
    return true;
  });

  const activeTripleWithLama = ctx.normalized.currentMeds.some((m) => {
    const p = getInhalerProfile(m.drugId);
    return Boolean(p && p.ics && p.lama && p.laba);
  });

  const needsIcsLaba =
    !priorPneum &&
    ((activeTripleWithLama && eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_low')) ||
      (isGroupEConfirmed(ctx) &&
        eos !== undefined &&
        (hasSafeNonLamaLaba
          ? eos >= thFor('bloodEos', 'copd.eosinophils_low')
          : eos >= thFor('bloodEos', 'copd.eosinophils_high'))));

  if (needsIcsLaba) {
    return hasSafeNonLamaIcsLaba ? undefined : preferredIcsLaba;
  }

  if (hasSafeNonLamaIcsLaba || hasSafeNonLamaLaba) {
    return undefined;
  }

  return 'olodaterol';
}

export function getPlannedCopdInhalerChangeDrugId(ctx: RuleContext): string | undefined {
  return (
    getPlannedTherapeuticInhalerChangeDrugId(ctx) ??
    getLamaContraAlternativeTargetDrugId(ctx) ??
    getCyp3a4SafeSwitchTargetDrugId(ctx) ??
    getDpiSwitchTargetDrugId(ctx)
  );
}

export function getSupersededInhalersToStop(
  ctx: RuleContext
): Array<{ med: CurrentMed; targetDrugId: string }> {
  const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx);
  const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
  const plannedCopdTargetId = getPlannedCopdInhalerChangeDrugId(ctx);
  const targetDrugId = plannedCopdTargetId ?? asthmaIcsLabaId ?? asthmaMonoIcsId;
  if (!targetDrugId) return [];
  const targetProf = getInhalerProfile(targetDrugId);
  if (!targetProf) return [];

  const hasAsthma = hasConcurrentAsthma(ctx);
  const duplicateStoppedIds = new Set(
    getDuplicateBaselineInhalersToStop(ctx)
      .map((d) => d.med.drugId?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id))
  );

  const hasAnyLabaInMeds = ctx.normalized.currentMeds.some((m) =>
    Boolean(getInhalerProfile(m.drugId)?.laba)
  );
  const results: Array<{ med: CurrentMed; targetDrugId: string }> = [];
  const seenMedIds = new Set<string>();

  for (const med of ctx.normalized.currentMeds) {
    const rawId = med.drugId?.trim().toLowerCase();
    if (!rawId || seenMedIds.has(rawId) || duplicateStoppedIds.has(rawId)) continue;
    const prof = getInhalerProfile(rawId);
    if (!prof) continue;

    if (prof.ics && !prof.lama && !prof.laba && !hasAsthma && !hasAnyLabaInMeds) continue;
    if (rawId === targetDrugId || prof.canonicalId === targetProf.canonicalId) continue;
    if (asthmaIcsLabaId && (rawId === asthmaIcsLabaId || prof.canonicalId === asthmaIcsLabaId)) continue;
    if (asthmaMonoIcsId && (rawId === asthmaMonoIcsId || prof.canonicalId === asthmaMonoIcsId)) continue;

    if (!plannedCopdTargetId && asthmaIcsLabaId) {
      if (prof.lama && !prof.ics && !prof.laba && !hasAnticholinergicContra(ctx)) continue;
      if (prof.ics || prof.laba) {
        results.push({ med, targetDrugId: asthmaIcsLabaId });
        seenMedIds.add(rawId);
      }
      continue;
    }

    if (asthmaIcsLabaId && targetDrugId === 'tiotropium') {
      results.push({ med, targetDrugId });
      seenMedIds.add(rawId);
      continue;
    }

    if (asthmaMonoIcsId && (targetDrugId === 'tiotropium_olodaterol' || targetDrugId === 'olodaterol')) {
      results.push({ med, targetDrugId });
      seenMedIds.add(rawId);
      continue;
    }

    const overlapsOrSuperseded =
      (targetProf.lama && prof.lama) ||
      (targetProf.laba && prof.laba) ||
      (targetProf.ics && prof.ics) ||
      (!targetProf.ics && prof.ics);

    if (overlapsOrSuperseded) {
      results.push({ med, targetDrugId });
      seenMedIds.add(rawId);
    }
  }

  return results;
}

export function getRetainedBaselineMaintenanceInhalers(ctx: RuleContext): CurrentMed[] {
  if (getPlannedCopdInhalerChangeDrugId(ctx) !== undefined) return [];
  const dupStopped = new Set(
    getDuplicateBaselineInhalersToStop(ctx)
      .map((d) => d.med.drugId?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id))
  );
  const supStopped = new Set(
    getSupersededInhalersToStop(ctx)
      .map((s) => s.med.drugId?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id))
  );
  const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx);
  const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);

  const retained: CurrentMed[] = [];
  const seen = new Set<string>();
  for (const med of ctx.normalized.currentMeds) {
    const rawId = med.drugId?.trim().toLowerCase();
    if (!rawId || seen.has(rawId) || dupStopped.has(rawId) || supStopped.has(rawId)) continue;
    const prof = getInhalerProfile(rawId);
    if (!prof) continue;
    if (prof.ics && !prof.lama && !prof.laba) continue;
    if (prof.lama && hasAnticholinergicContra(ctx)) continue;
    if ((hasMilkProteinAllergy(ctx) || hasWeakInspiratoryFlow(ctx)) && isMedDpiDevice(med)) continue;
    if (hasStrongCyp3a4Inhibitor(ctx) && CYP3A4_SENSITIVE_INHALER_IDS.has(rawId)) continue;
    if (asthmaIcsLabaId && (rawId === asthmaIcsLabaId || prof.canonicalId === asthmaIcsLabaId)) continue;
    if (asthmaMonoIcsId && (rawId === asthmaMonoIcsId || prof.canonicalId === asthmaMonoIcsId)) continue;
    retained.push(med);
    seen.add(rawId);
  }
  return retained;
}
