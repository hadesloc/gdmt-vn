import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import type { RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ADULT_18_ONLY_DRUGS,
  CYP3A4_SENSITIVE_ICS_LABA_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  ICS_CONTAINING_DRUGS,
  MONO_ICS_DRUGS,
  TRACK2_ICS_LABA_DRUGS,
  TRIPLE_INHALER_DRUGS,
  computeEffectiveTrack1Step,
  computeEffectiveTrack2Step,
  evaluateAcuteAsthma,
  evaluateGinaControl,
  hasSevereMilkProteinAllergy,
  hasStrongCyp3a4Inhibitor,
  isAdultOrAdolescent,
  isAllergicToDrug,
  isMartOveruse,
  isStepDownEligible,
  resolveTrack1MartDrugId,
  resolveTrack2IcsLabaDrugId,
  resolveTrack2MonoIcsDrugId,
  shouldDeferTripleInhalerToCopd,
} from '../asthma/helpers';

export interface AsthmaInpatientAcuteState {
  isCoSelectedInpatient: boolean;
  emitsSevereSteroidMethylpred: boolean;
  emitsMildModOcsPrednisolone: boolean;
  emitsDischargeOcsPrednisolone: boolean;
  emitsAcuteSaba: boolean;
}

function findSafeExistingAsthmaTriple(ctx: RuleContext) {
  const age = need(ctx, 'age');
  const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
  const milkAllergy = hasSevereMilkProteinAllergy(ctx);
  const strongCyp = hasStrongCyp3a4Inhibitor(ctx);
  return ctx.patient.currentMeds.find((m) => {
    const id = resolveKbDrugId(m.drugId);
    if (!TRIPLE_INHALER_DRUGS.has(id)) return false;
    if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
    if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
    if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
    if (isAllergicToDrug(ctx, id)) return false;
    return true;
  });
}

function findSafeInpatientNonAcuteAsthmaController(ctx: RuleContext) {
  const age = need(ctx, 'age');
  const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
  const milkAllergy = hasSevereMilkProteinAllergy(ctx);
  const strongCyp = hasStrongCyp3a4Inhibitor(ctx);
  return ctx.patient.currentMeds.find((m) => {
    const id = resolveKbDrugId(m.drugId);
    if (!ICS_CONTAINING_DRUGS.has(id)) return false;
    if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
    if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
    if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
    if (isAllergicToDrug(ctx, id)) return false;
    return true;
  });
}

/**
 * Đánh giá chính xác các thẻ cấp cứu nội viện mà phân hệ Hen ('asthma') phát sinh khi đồng chọn ['copd', 'asthma'],
 * đảm bảo đồng bộ hóa thuốc Corticosteroid toàn thân, nhịp khí dung SABA giờ đầu và đích SpO₂ 88–92%.
 */
export function getAsthmaInpatientAcuteState(ctx: RuleContext): AsthmaInpatientAcuteState {
  const empty: AsthmaInpatientAcuteState = {
    isCoSelectedInpatient: false,
    emitsSevereSteroidMethylpred: false,
    emitsMildModOcsPrednisolone: false,
    emitsDischargeOcsPrednisolone: false,
    emitsAcuteSaba: false,
  };
  if (!ctx.normalized.selectedModules.includes('asthma') || ctx.settings.setting !== 'inpatient') {
    return empty;
  }
  if (!isAdultOrAdolescent(ctx)) {
    return { ...empty, isCoSelectedInpatient: true };
  }
  const acute = evaluateAcuteAsthma(ctx);
  const isCritOrSev = acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere);
  const isMildMod =
    acute.hasAcuteAttack && !acute.isLifeThreatening && !acute.isSevere && acute.hasMinVitals;
  const isDischarge = !isMartOveruse(ctx) && acute.isDischargeReady;
  return {
    isCoSelectedInpatient: true,
    emitsSevereSteroidMethylpred: isCritOrSev,
    emitsMildModOcsPrednisolone: isMildMod,
    emitsDischargeOcsPrednisolone: isDischarge,
    emitsAcuteSaba: isCritOrSev || isMildMod,
  };
}

/**
 * Xác định chính xác hoạt chất ICS+LABA mà phân hệ Hen (khi đồng chọn 'asthma') kê đơn,
 * đồng bộ 100% với src/modules/asthma/* (cơn cấp ngoại trú/nội trú, GINA control, Track 1 vs Track 2, Step 1–5).
 */
export function getAsthmaPrescribedIcsLabaId(ctx: RuleContext): string | undefined {
  if (!ctx.normalized.selectedModules.includes('asthma')) return undefined;
  if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx) || shouldDeferTripleInhalerToCopd(ctx)) {
    return undefined;
  }

  const acute = evaluateAcuteAsthma(ctx);
  if (ctx.settings.setting === 'inpatient') {
    if (acute.isDischargeReady) {
      if (findSafeExistingAsthmaTriple(ctx)) return undefined;
      return resolveTrack1MartDrugId(ctx);
    }
    if (!acute.hasAcuteAttack && !acute.isDischargeReady) {
      const ctrl = findSafeInpatientNonAcuteAsthmaController(ctx);
      if (ctrl) {
        const id = ctrl.drugId.toLowerCase();
        if (!TRIPLE_INHALER_DRUGS.has(id) && !MONO_ICS_DRUGS.has(id)) {
          return ctrl.drugId;
        }
      }
    }
    return undefined;
  }

  if (acute.hasAcuteAttack) return undefined;
  if (evaluateGinaControl(ctx).level === 'missing') return undefined;

  const ci = ctx.patient.customInputs ?? {};
  const isTrack2 = ci.currentTrack === 'track2';
  const effStep = isTrack2 ? computeEffectiveTrack2Step(ctx) : computeEffectiveTrack1Step(ctx);

  if (effStep === 5) { // qa-allow: ui-step - bậc GINA Step 5
    if (findSafeExistingAsthmaTriple(ctx)) return undefined;
    return isTrack2 ? resolveTrack2IcsLabaDrugId(ctx) : resolveTrack1MartDrugId(ctx);
  }

  if (isTrack2) {
    const rawStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
    const existingTrack2IcsLaba = ctx.patient.currentMeds.find((m) =>
      TRACK2_ICS_LABA_DRUGS.has(m.drugId.toLowerCase())
    );
    if (effStep === 2 && rawStep === 3 && isStepDownEligible(ctx) && existingTrack2IcsLaba) { // qa-allow: ui-step - hạ bậc an toàn Step 3 -> 2
      return resolveTrack2IcsLabaDrugId(ctx);
    }
    if (effStep === 1 || effStep === 2) return undefined; // qa-allow: ui-step - Track 2 Bậc 1–2 kê ICS đơn chất
    return resolveTrack2IcsLabaDrugId(ctx);
  }

  return resolveTrack1MartDrugId(ctx);
}

export function getAsthmaPrescribedMonoIcsId(ctx: RuleContext): string | undefined {
  if (!ctx.normalized.selectedModules.includes('asthma')) return undefined;
  if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx) || shouldDeferTripleInhalerToCopd(ctx)) {
    return undefined;
  }

  const acute = evaluateAcuteAsthma(ctx);
  if (ctx.settings.setting === 'inpatient') {
    if (!acute.hasAcuteAttack && !acute.isDischargeReady) {
      const ctrl = findSafeInpatientNonAcuteAsthmaController(ctx);
      if (ctrl && MONO_ICS_DRUGS.has(ctrl.drugId.toLowerCase())) {
        return ctrl.drugId;
      }
    }
    return undefined;
  }

  if (acute.hasAcuteAttack) return undefined;
  const ci = ctx.patient.customInputs ?? {};
  if (ci.currentTrack !== 'track2') return undefined;
  if (evaluateGinaControl(ctx).level === 'missing') return undefined;

  const effStep = computeEffectiveTrack2Step(ctx);
  if (effStep !== 1 && effStep !== 2) return undefined; // qa-allow: ui-step - chỉ Bậc 1–2 Track 2 mới kê ICS đơn chất

  const rawStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
  const existingTrack2IcsLaba = ctx.patient.currentMeds.find((m) =>
    TRACK2_ICS_LABA_DRUGS.has(m.drugId.toLowerCase())
  );
  if (effStep === 2 && rawStep === 3 && isStepDownEligible(ctx) && existingTrack2IcsLaba) { // qa-allow: ui-step - hạ bậc an toàn giữ ICS-LABA
    return undefined;
  }

  return resolveTrack2MonoIcsDrugId(ctx);
}

export function willAsthmaModulePrescribeIcsLaba(ctx: RuleContext): boolean {
  return getAsthmaPrescribedIcsLabaId(ctx) !== undefined;
}
