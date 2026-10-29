/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Phân tầng Lâm sàng & Nhận diện Biến cố Cấp
 * Phân quyền: Agent F4
 */

import type { RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  INCRETIN_RA_IDS,
  hasDrugAllergy,
  isTakingCanonical,
  pickFirstNonAllergicCandidate
} from './helpers.drugs';

export * from './helpers.drugs';
export { getFdcBlockedCompanionReason } from './helpers.fdc';

export function hasDm2Context(ctx: RuleContext): boolean {
  return Boolean(hasCondition(ctx, 'dm') || ctx.patient.selectedModules.includes('dm2'));
}

export function isPregnant(ctx: RuleContext): boolean {
  if (ctx.patient.sex === 'male') return false;
  return Boolean(
    hasCondition(ctx, 'pregnant') ||
    ctx.patient.customInputs?.pregnant === true ||
    ctx.patient.customInputs?.pregnancy === true
  );
}

export function isBreastfeeding(ctx: RuleContext): boolean {
  if (ctx.patient.sex === 'male' || isPregnant(ctx)) return false;
  return Boolean(
    hasCondition(ctx, 'breastfeeding') ||
    ctx.patient.customInputs?.breastfeeding === true ||
    ctx.patient.customInputs?.lactation === true
  );
}

export function isIcuSetting(ctx: RuleContext): boolean {
  return ctx.patient.customInputs?.inpatientUnit === 'icu' || ctx.patient.customInputs?.icu === true;
}

export function isActivelyHypoglycemic(ctx: RuleContext): boolean {
  const glucose = need(ctx, 'glucose');
  return glucose !== undefined && glucose < thFor('glucose', 'dm2.hypo.threshold_level1_mmol');
}

export function isSevereHypoglycemia(ctx: RuleContext): boolean {
  const glucose = need(ctx, 'glucose');
  if (glucose === undefined) return false;
  const level2 = thFor('glucose', 'dm2.hypo.threshold_level2_mmol');
  const level1 = thFor('glucose', 'dm2.hypo.threshold_level1_mmol');
  const altered = Boolean(
    ctx.patient.customInputs?.alteredMentalStatus === true ||
    ctx.patient.conditions.alteredMentalStatus === true
  );
  return glucose < level2 || (glucose < level1 && altered);
}

export function isOnDialysis(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'onDialysis') ||
    ctx.patient.conditions.dialysis === true ||
    ctx.patient.customInputs?.onDialysis === true ||
    ctx.patient.customInputs?.dialysis === true
  );
}

export function getEffectiveEgfr(ctx: RuleContext): number | undefined {
  if (isOnDialysis(ctx)) {
    return thFor('egfr', 'dm2.glp1.egfr_min') - 5; // qa-allow: unit-conversion - Lọc máu chu kỳ quy ước eGFR dưới ngưỡng G5 bất kể Cr sau lọc
  }
  return need(ctx, 'egfr');
}

export function hasAscvd(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'ascvd') ||
    hasCondition(ctx, 'cad') ||
    ctx.patient.conditions.priorMi === true ||
    hasCondition(ctx, 'stroke') ||
    hasCondition(ctx, 'strokeOrTia') ||
    hasCondition(ctx, 'pad')
  );
}

export function hasHf(ctx: RuleContext): boolean {
  const lvef = need(ctx, 'lvef');
  return Boolean(
    hasCondition(ctx, 'hf') ||
    (lvef !== undefined && lvef <= thFor('lvef', 'hf.ef.hfref_max_esc2026'))
  );
}

export function isHfpefPhenotype(ctx: RuleContext): boolean {
  const lvef = need(ctx, 'lvef');
  return Boolean(
    (hasCondition(ctx, 'hf') && lvef !== undefined && lvef >= thFor('lvef', 'hf.ef.hfpef_min')) ||
    ctx.patient.customInputs?.hfPhenotype === 'hfpef'
  );
}

export function hasCkd(ctx: RuleContext): boolean {
  if (isOnDialysis(ctx) || hasCondition(ctx, 'ckd')) return true;
  const egfr = getEffectiveEgfr(ctx);
  const uacr = need(ctx, 'uacr');
  return Boolean(
    (egfr !== undefined && egfr < thFor('egfr', 'dm2.ckd.egfr_threshold')) ||
    (uacr !== undefined && uacr >= thFor('uacr', 'ckd.uacr.a1_max_mgmmol'))
  );
}

export function hasObesityOrOverweight(ctx: RuleContext): boolean {
  if (hasCondition(ctx, 'obesity')) return true;
  const bmi = need(ctx, 'bmi');
  if (bmi === undefined) return false;
  const bmiCutoff = ctx.settings.profile === 'VN'
    ? thFor('bmi', 'dm2.obesity.bmi_asian_threshold')
    : thFor('bmi', 'hf.glp1.bmi_min');
  return bmi >= bmiCutoff;
}

export function hasMtcOrMen2(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    hasCondition(ctx, 'mtc') ||
    hasCondition(ctx, 'men2') ||
    hasCondition(ctx, 'medullary_thyroid_carcinoma') ||
    cond.medullaryThyroidCarcinoma === true ||
    ci?.historyMtcOrMen2 === true ||
    ci?.mtcMen2History === true ||
    ci?.mtcHistory === true ||
    ci?.medullaryThyroidCarcinoma === true ||
    ci?.medullary_thyroid_carcinoma === true ||
    ci?.men2 === true
  );
}

export function hasPancreatitis(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    hasCondition(ctx, 'pancreatitis') ||
    hasCondition(ctx, 'acutePancreatitis') ||
    cond.historyPancreatitis === true ||
    cond.acute_pancreatitis === true ||
    ci?.historyPancreatitis === true ||
    ci?.pancreatitis === true ||
    ci?.acutePancreatitis === true ||
    ci?.acute_pancreatitis === true
  );
}

function getNormalizedChildPugh(ctx: RuleContext): string {
  const ci = ctx.patient.customInputs;
  const normCi = ctx.normalized?.customInputs;
  const raw = normCi?.childPugh ?? ci?.childPugh ?? ci?.childPughClass ?? '';
  return String(raw).trim().toUpperCase();
}

export function hasCirrhosis(ctx: RuleContext): boolean {
  const rawCp = getNormalizedChildPugh(ctx);
  if (rawCp === 'A' || rawCp === 'B' || rawCp === 'C') return true;
  return Boolean(
    hasCondition(ctx, 'decompensatedCirrhosis') ||
    ctx.patient.conditions.cirrhosis === true ||
    ctx.patient.customInputs?.cirrhosis === true
  );
}

export function hasHepaticImpairment(ctx: RuleContext): boolean {
  const altUln = need(ctx, 'altUlnTimes');
  const rawCp = getNormalizedChildPugh(ctx);
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;

  if (
    rawCp === 'B' ||
    rawCp === 'C' ||
    hasCondition(ctx, 'decompensatedCirrhosis') ||
    hasCondition(ctx, 'activeLiverDisease') ||
    cond.biliaryObstruction === true ||
    ci?.biliaryObstruction === true ||
    (altUln !== undefined && altUln > thFor('alt_uln', 'dm2.vildagliptin.alt_uln_max'))
  ) {
    return true;
  }

  // Xơ gan còn bù Child-Pugh A không suy gan mất bù vẫn cho phép Metformin/SGLT2i/GLP-1 RA
  if (rawCp === 'A') {
    return false;
  }

  return Boolean(
    hasCondition(ctx, 'liverDisease') ||
    cond.hepaticImpairment === true ||
    ci?.hepaticImpairment === true
  );
}

export function hasPioglitazoneHepaticContra(ctx: RuleContext): boolean {
  const altUln = need(ctx, 'altUlnTimes');
  if (altUln !== undefined && altUln > thFor('alt_uln', 'dm2.pioglitazone.alt_uln_max')) {
    return true;
  }
  return hasHepaticImpairment(ctx);
}

export function hasActiveBladderCancer(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    cond.activeBladderCancer === true ||
    cond.bladderCancer === true ||
    cond.bladder_cancer === true ||
    ci?.activeBladderCancer === true ||
    ci?.bladderCancer === true
  );
}

export function hasFractureOrOsteoporosisRisk(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    cond.osteoporosis === true ||
    cond.fractureHistory === true ||
    ci?.osteoporosis === true ||
    ci?.fractureHistory === true ||
    ctx.patient.sex === 'female'
  );
}

export function hasSevereGastroparesis(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    cond.severeGastroparesis === true ||
    cond.gastroparesis === true ||
    ci?.severeGastroparesis === true ||
    ci?.gastroparesis === true
  );
}

export function hasDiabeticRetinopathy(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    cond.diabeticRetinopathy === true ||
    cond.retinopathy === true ||
    ci?.diabeticRetinopathy === true ||
    ci?.retinopathy === true ||
    hasCondition(ctx, 'dmTargetOrganDamage')
  );
}

export function isUsingOralContraceptive(ctx: RuleContext): boolean {
  if (ctx.patient.sex === 'male') return false;
  const ci = ctx.patient.customInputs;
  if (ci?.oralContraceptive === true || ctx.patient.conditions.oralContraceptive === true) {
    return true;
  }
  const ocpTokens = ['ethinylestradiol', 'levonorgestrel', 'desogestrel', 'drospirenone', 'oral_contraceptive', 'ocp'];
  return ctx.patient.currentMeds.some((m) => {
    const text = `${m.drugId} ${m.name || ''}`.toLowerCase();
    return ocpTokens.some((tok) => text.includes(tok));
  });
}

export function hasPlannedSurgery(ctx: RuleContext): boolean {
  return Boolean(hasCondition(ctx, 'plannedSurgery') || ctx.patient.customInputs?.plannedSurgery === true);
}

export function hasPlannedContrast(ctx: RuleContext): boolean {
  return Boolean(
    ctx.patient.customInputs?.contrastPlanned === true ||
    ctx.patient.customInputs?.iodinatedContrast === true ||
    ctx.patient.conditions.contrastPlanned === true
  );
}

export function hasActiveFootUlcer(ctx: RuleContext): boolean {
  const cond = ctx.patient.conditions as Record<string, unknown>;
  const ci = ctx.patient.customInputs;
  return Boolean(
    ci?.activeFootUlcer === true ||
    ci?.activeFootUlcerOrAmputationRisk === true ||
    ci?.footUlcer === true ||
    ci?.priorAmputation === true ||
    cond.footUlcer === true ||
    cond.activeFootUlcer === true ||
    cond.priorAmputation === true ||
    cond.footUlcerOrAmputation === true ||
    cond.gangrene === true ||
    cond.osteomyelitis === true
  );
}

export function hasHighBleedingRisk(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'bleedingHistory') ||
    hasCondition(ctx, 'activeBleeding') ||
    hasCondition(ctx, 'pepticUlcer') ||
    ctx.patient.customInputs?.giBleedHistory === true ||
    ctx.patient.customInputs?.highBleedingRisk === true
  );
}

export type ElderlyCategory = 'not_elderly' | 'healthy' | 'complex' | 'very_complex';

export function resolveElderlyStatus(ctx: RuleContext): ElderlyCategory {
  const age = need(ctx, 'age');
  const rawStatus = typeof ctx.patient.customInputs?.elderlyHealthStatus === 'string'
    ? ctx.patient.customInputs.elderlyHealthStatus
    : undefined;
  const hasFrailtyFlag = hasCondition(ctx, 'frailty');
  const hasLimitedLife = hasCondition(ctx, 'limitedLifespan');
  const isOlderAge = age !== undefined && age >= thFor('age', 'dm2.elderly.age_threshold');

  if (rawStatus === 'very_complex' || hasLimitedLife) {
    return 'very_complex';
  }
  if (rawStatus === 'complex' || hasFrailtyFlag) {
    const bmi = need(ctx, 'bmi');
    if (
      hasFrailtyFlag &&
      age !== undefined &&
      age >= thFor('age', 'dm2.elderly.high_risk_age') &&
      bmi !== undefined &&
      bmi < thFor('bmi', 'copd.roflumilast_underweight_bmi')
    ) {
      return 'very_complex';
    }
    return 'complex';
  }
  if (rawStatus === 'healthy' && isOlderAge) {
    return 'healthy';
  }
  if (isOlderAge) {
    return 'healthy';
  }
  return 'not_elderly';
}

export function hasHypoglycemiaOrOvertreatment(ctx: RuleContext): boolean {
  if (Boolean(ctx.patient.customInputs?.recentHypo)) return true;
  const glucose = need(ctx, 'glucose');
  if (glucose !== undefined && glucose < thFor('glucose', 'dm2.glucose.fpg_target_min_mmol')) {
    return true;
  }
  const hba1c = need(ctx, 'hba1c');
  const elderly = resolveElderlyStatus(ctx);
  if (elderly === 'very_complex') {
    if (hba1c !== undefined && hba1c < thFor('hba1c', 'dm2.hba1c.target_older_healthy')) return true;
    if (hba1c === undefined && glucose !== undefined && glucose < thFor('glucose', 'dm2.glucose.inpatient_target_min_mmol')) {
      return true;
    }
    return false;
  }
  if (elderly === 'complex') {
    return hba1c !== undefined && hba1c < thFor('hba1c', 'dm2.hba1c.target_standard');
  }
  if (elderly === 'healthy') {
    return hba1c !== undefined && hba1c < thFor('hba1c', 'dm2.hba1c.target_young');
  }
  return false;
}

export function isOvertreatedFrailDeferral(ctx: RuleContext): boolean {
  if (Boolean(ctx.patient.customInputs?.catabolicSymptoms)) return false;
  const glucose = need(ctx, 'glucose');
  const hba1c = need(ctx, 'hba1c');
  if (
    (glucose !== undefined && glucose >= thFor('glucose', 'dm2.dka.dextrose_glucose_threshold_mmol')) ||
    (hba1c !== undefined && hba1c >= thFor('hba1c', 'dm2.early_insulin.hba1c') - 1)
  ) {
    return false;
  }
  const elderly = resolveElderlyStatus(ctx);
  if (elderly === 'very_complex') return true;
  const bmi = need(ctx, 'bmi');
  if (
    hasCondition(ctx, 'frailty') &&
    ((bmi !== undefined && bmi < thFor('bmi', 'copd.roflumilast_underweight_bmi')) ||
      (hba1c !== undefined && hba1c < thFor('hba1c', 'dm2.hba1c.target_standard')))
  ) {
    return true;
  }
  const recentHypo = Boolean(ctx.patient.customInputs?.recentHypo);
  return recentHypo && hba1c !== undefined && hba1c < thFor('hba1c', 'dm2.hba1c.target_young');
}

export function computeIndividualizedHba1cTarget(ctx: RuleContext): number {
  if (isPregnant(ctx)) {
    return thFor('hba1c', 'dm2.hba1c.target_young');
  }
  const elderly = resolveElderlyStatus(ctx);
  if (elderly === 'very_complex') return thFor('hba1c', 'dm2.hba1c.target_older_very_complex');
  if (elderly === 'complex') return thFor('hba1c', 'dm2.hba1c.target_older_complex');
  if (elderly === 'healthy') return thFor('hba1c', 'dm2.hba1c.target_older_healthy');
  const age = need(ctx, 'age');
  const dmDuration = need(ctx, 'dmDurationYears');
  const elderlyAge = thFor('age', 'dm2.elderly.age_threshold');
  const recentHypo = Boolean(ctx.patient.customInputs?.recentHypo);
  if (
    age !== undefined &&
    age < elderlyAge - 20 && // qa-allow: index - Phân tầng người trẻ dưới 45 tuổi
    dmDuration !== undefined &&
    dmDuration < 3 && // qa-allow: index - Mới chẩn đoán dưới 3 năm
    !hasAscvd(ctx) &&
    !hasCkd(ctx) &&
    !hasHf(ctx) &&
    !recentHypo
  ) {
    return thFor('hba1c', 'dm2.hba1c.target_young');
  }
  return thFor('hba1c', 'dm2.hba1c.target_standard');
}

export interface HyperglycemicCrisisAssessment {
  isDka: boolean;
  isResolvingDka: boolean;
  isEuDka: boolean;
  needsImmediateDextrose: boolean;
  isPureHhs: boolean;
  isMixedDkaHhs: boolean;
  isSuspected: boolean;
  isSuspectedUnconfirmed: boolean;
  isConfirmedCrisis: boolean;
  isCrisis: boolean;
  isIsolatedKetonemia: boolean;
  effectiveOsmolality?: number;
}

export function evaluateHyperglycemicCrisis(ctx: RuleContext): HyperglycemicCrisisAssessment {
  const glucose = need(ctx, 'glucose');
  const ketones = need(ctx, 'bloodKetones');
  const ph = need(ctx, 'venousPh');
  const bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3');
  const na = need(ctx, 'na');
  const manualOsm = need(ctx, 'effectiveOsmolality');
  const effectiveOsmolality = manualOsm !== undefined
    ? manualOsm
    : na !== undefined && glucose !== undefined
      ? 2 * na + glucose // qa-allow: unit-conversion - Công thức áp lực thẩm thấu hiệu dụng chuẩn 2*Na + Glucose
      : undefined;

  const isSuspected = Boolean(hasCondition(ctx, 'dkaSuspected') || ctx.patient.customInputs?.dkaSuspected === true);
  const isDm = hasDm2Context(ctx);
  const dkaGlucoseMin = thFor('glucose', 'dm2.dka.glucose_mmol');
  const bhbMin = thFor('blood_ketones', 'dm2.dka.bhb_threshold');
  const resolvedKetoneMax = thFor('blood_ketones', 'dm2.dka.resolution_ketone_mmol');

  const hasGlycemicOrDmCriterion =
    (glucose !== undefined && glucose >= dkaGlucoseMin) ||
    isDm ||
    isSuspected;

  const hasKetonemia = ketones !== undefined && ketones >= bhbMin;
  const hasUnresolvedKetonemia =
    ketones !== undefined && ketones >= resolvedKetoneMax && ketones < bhbMin;
  const hasNegativeKetones = ketones !== undefined && ketones < resolvedKetoneMax;

  const hasAcidosis =
    (ph !== undefined && ph < thFor('venous_ph', 'dm2.dka.ph_threshold')) ||
    (bicarb !== undefined && bicarb < thFor('serum_bicarb', 'dm2.dka.bicarb_threshold'));

  const isConfirmedActiveDka = hasGlycemicOrDmCriterion && hasKetonemia && hasAcidosis;
  const isResolvingDka = hasGlycemicOrDmCriterion && hasUnresolvedKetonemia && hasAcidosis;
  const isDka = isConfirmedActiveDka || isResolvingDka;

  const hasHhsHyperosmolar =
    glucose !== undefined &&
    glucose >= thFor('glucose', 'dm2.hhs.glucose_threshold') &&
    effectiveOsmolality !== undefined &&
    effectiveOsmolality > thFor('effective_osmolality', 'dm2.hhs.effective_osmolality_threshold');

  const isMixedDkaHhs =
    hasHhsHyperosmolar && (isDka || hasKetonemia || (hasAcidosis && !hasNegativeKetones));
  const isPureHhs = hasHhsHyperosmolar && !isMixedDkaHhs;

  const isEuDka =
    isDka &&
    glucose !== undefined &&
    glucose < dkaGlucoseMin;

  const needsImmediateDextrose =
    (isDka || isMixedDkaHhs) &&
    glucose !== undefined &&
    glucose < thFor('glucose', 'dm2.dka.dextrose_glucose_threshold_mmol');

  const isConfirmedCrisis = isDka || hasHhsHyperosmolar;

  const isInpatientUnmeasuredAcidosis =
    ctx.settings.setting === 'inpatient' &&
    ketones === undefined &&
    glucose !== undefined &&
    glucose >= dkaGlucoseMin &&
    hasAcidosis;

  const isSuspectedUnconfirmed =
    !isConfirmedCrisis &&
    !hasNegativeKetones &&
    (isSuspected || isInpatientUnmeasuredAcidosis);

  const isCrisis =
    isConfirmedCrisis ||
    (ctx.settings.setting === 'outpatient' && isSuspected);

  const isIsolatedKetonemia = !isConfirmedCrisis && hasKetonemia;

  return {
    isDka,
    isResolvingDka,
    isEuDka,
    needsImmediateDextrose,
    isPureHhs,
    isMixedDkaHhs,
    isSuspected,
    isSuspectedUnconfirmed,
    isConfirmedCrisis,
    isCrisis,
    isIsolatedKetonemia,
    effectiveOsmolality
  };
}

export function hasAcuteCatabolicKetosis(ctx: RuleContext): boolean {
  if (!Boolean(ctx.patient.customInputs?.catabolicSymptoms)) return false;
  const bmi = need(ctx, 'bmi');
  const ketones = need(ctx, 'bloodKetones');
  return Boolean(
    (bmi !== undefined && bmi < thFor('bmi', 'copd.roflumilast_underweight_bmi')) ||
    (ketones !== undefined && ketones >= thFor('blood_ketones', 'dm2.dka.resolution_ketone_mmol'))
  );
}

export function willStartOrContinueGlp1(ctx: RuleContext): boolean {
  if (
    isPregnant(ctx) ||
    isBreastfeeding(ctx) ||
    hasMtcOrMen2(ctx) ||
    hasPancreatitis(ctx) ||
    isActivelyHypoglycemic(ctx)
  ) {
    return false;
  }
  const crisis = evaluateHyperglycemicCrisis(ctx);
  if (ctx.settings.setting === 'outpatient' && (crisis.isCrisis || crisis.isIsolatedKetonemia)) {
    return false;
  }
  if (INCRETIN_RA_IDS.some((id) => isTakingCanonical(ctx, id) && !hasDrugAllergy(ctx, id))) {
    return ctx.settings.setting === 'outpatient' && !hasPlannedSurgery(ctx);
  }
  if (ctx.settings.setting !== 'outpatient' || !hasDm2Context(ctx)) return false;
  if (hasPlannedSurgery(ctx) || hasSevereGastroparesis(ctx)) return false;
  if (!pickFirstNonAllergicCandidate(ctx, ['semaglutide', 'tirzepatide', 'dulaglutide', 'liraglutide'])) {
    return false;
  }
  const isHfpefObese = isHfpefPhenotype(ctx) && hasObesityOrOverweight(ctx);
  if (
    isOvertreatedFrailDeferral(ctx) ||
    hasAcuteCatabolicKetosis(ctx) ||
    (resolveElderlyStatus(ctx) === 'very_complex' && !isHfpefObese)
  ) {
    return false;
  }
  const egfr = getEffectiveEgfr(ctx);
  if (egfr === undefined || egfr < thFor('egfr', 'dm2.glp1.egfr_min')) return false;
  return hasAscvd(ctx) || hasCkd(ctx) || hasObesityOrOverweight(ctx) || isHfpefObese;
}
