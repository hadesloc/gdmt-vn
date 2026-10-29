/**
 * GDMT-VN Lipid Module - Risk Tier, PREVENT/SCORE2/CAC & Target Bundle Helpers
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import { CHOL_CONVERSION_FACTOR } from '../../engine/units';
import { computeLdlTarget, determineEscRiskTier } from '../../engine/calculators/ldlTarget';
import { computePrevent } from '../../engine/calculators/prevent';
import { computeScore2 } from '../../engine/calculators/score2';
import type {
  EscRiskTier,
  LdlTargetResult,
  LipidTherapyType,
  PreventAscvdRiskCategory
} from '../../engine/calculators/types';
import {
  getActiveLipidMeds,
  getActiveStatin,
  getCustomNumber,
  hasAscvdEquivalent,
  hasKidneyTransplant,
  hasLipidFlag,
  hasMed,
  hasPcsk9
} from './helpers.targets';

export * from './helpers.targets';

export interface LipidRiskEvaluationBundle {
  targetInfo: LdlTargetResult;
  cacScore?: number;
  preventAscvd10Yr?: number;
  preventCategory?: PreventAscvdRiskCategory | null;
  isUsStandardRiskAscvd: boolean;
  isUsVeryHighRiskAscvd: boolean;
  calculatorWarning?: string;
}

const CORONARY_BED_KEYS = [
  'cad',
  'ccs',
  'acs',
  'mi',
  'stemi',
  'nstemi',
  'pci',
  'cabg',
  'acuteAcsWithin24h',
  'recentAcs'
];
const CEREBRO_BED_KEYS = [
  'stroke',
  'tia',
  'strokeOrTia',
  'acuteIschemicStroke',
  'carotid',
  'carotidPlaque'
];
const PERIPHERAL_BED_KEYS = ['pad', 'claudication', 'aorticAneurysm', 'aorticPlaque'];

export function hasPolyvascularDisease(ctx: RuleContext): boolean {
  if (hasLipidFlag(ctx, 'polyvascular') || hasLipidFlag(ctx, 'polyvascularDisease')) return true;
  const hasBed = (keys: string[]): boolean => keys.some((k) => hasLipidFlag(ctx, k));
  let beds = 0;
  if (hasBed(CORONARY_BED_KEYS)) beds += 1;
  if (hasBed(CEREBRO_BED_KEYS)) beds += 1;
  if (hasBed(PERIPHERAL_BED_KEYS)) beds += 1;
  return beds >= 2; // qa-allow: index - Dem so he giuong mach bi ton thuong (>= 2 he mach)
}

export function hasClinicalFh(ctx: RuleContext): boolean {
  if (hasLipidFlag(ctx, 'familialHypercholesterolemia')) return true;
  const dlcnScore = getCustomNumber(ctx, 'dlcnScore');
  const dlcnCutoff = thFor('dlcnscore', 'lipid.fh.dlcn_probable');
  return dlcnScore !== undefined && dlcnScore >= dlcnCutoff;
}

export function getCacScore(ctx: RuleContext): number | undefined {
  const s1 = getCustomNumber(ctx, 'cacScore');
  if (s1 !== undefined) return s1;
  return getCustomNumber(ctx, 'cac');
}

export function hasIsolatedHfWithoutStatinIndication(ctx: RuleContext): boolean {
  const lvef = need(ctx, 'lvef');
  const lvefCutoff = thFor('lvef', 'lipid.hf.href_lvef_cutoff');
  const hasHf = hasLipidFlag(ctx, 'hf') || (lvef !== undefined && lvef <= lvefCutoff);
  if (!hasHf) return false;
  if (hasAscvdEquivalent(ctx) || hasClinicalFh(ctx) || hasKidneyTransplant(ctx)) return false;

  const ldl = need(ctx, 'ldl');
  const ldlSevere = thFor('ldl', 'lipid.target.ldl_severe_elevation');
  if (ldl !== undefined && ldl >= ldlSevere) return false;

  const cac = getCacScore(ctx);
  const cacInit = thFor('cacscore', 'lipid.cac.statin_init_min');
  if (cac !== undefined && cac >= cacInit) return false;

  if (hasLipidFlag(ctx, 'dm')) return false;
  const egfr = need(ctx, 'egfr');
  const egfrCkd = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
  if (
    (hasLipidFlag(ctx, 'ckd') || (egfr !== undefined && egfr < egfrCkd)) &&
    !hasLipidFlag(ctx, 'onDialysis')
  ) {
    return false;
  }
  const age = need(ctx, 'age');
  const hivAge = thFor('age', 'lipid.hiv.primary_min_age');
  if (hasLipidFlag(ctx, 'hiv') && age !== undefined && age >= hivAge) return false;

  return true;
}

export function isUsIschemicHfref(ctx: RuleContext): boolean {
  if (ctx.settings.profile !== 'US') return false;
  if (!hasAscvdEquivalent(ctx) || hasLipidFlag(ctx, 'acuteAcsWithin24h')) return false;
  const lvef = need(ctx, 'lvef');
  const lvefCutoff = thFor('lvef', 'lipid.hf.href_lvef_cutoff');
  return lvef !== undefined && lvef <= lvefCutoff && hasLipidFlag(ctx, 'hf');
}

export function evaluateUsAscvdSubtier(ctx: RuleContext): {
  isVeryHighRiskAscvd: boolean;
  isStandardRiskAscvd: boolean;
} {
  if (!hasAscvdEquivalent(ctx)) {
    return { isVeryHighRiskAscvd: false, isStandardRiskAscvd: false };
  }
  const hasMajorRecentOrMultiBed =
    hasLipidFlag(ctx, 'acuteAcsWithin24h') ||
    hasLipidFlag(ctx, 'recentAcs') ||
    hasLipidFlag(ctx, 'recurrentAcsWithin2Years') ||
    hasPolyvascularDisease(ctx);

  let enhancerCount = 0;
  const age = need(ctx, 'age');
  const egfr = need(ctx, 'egfr');
  const egfrCkd = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
  if (age !== undefined && age >= 65) enhancerCount += 1; // qa-allow: index - Dem yeu to nguy co cao theo ACC/AHA ASCVD Very High Risk
  if (hasClinicalFh(ctx)) enhancerCount += 2; // qa-allow: index - FH kem ASCVD xep thang Very High Risk
  if (hasLipidFlag(ctx, 'dm')) enhancerCount += 1;
  if (hasLipidFlag(ctx, 'htn')) enhancerCount += 1;
  if (hasLipidFlag(ctx, 'ckd') || (egfr !== undefined && egfr < egfrCkd)) enhancerCount += 1;
  if (hasLipidFlag(ctx, 'smoker')) enhancerCount += 1;
  if (hasLipidFlag(ctx, 'hf')) enhancerCount += 1;
  if (hasLipidFlag(ctx, 'cabg') || hasLipidFlag(ctx, 'pci')) enhancerCount += 1;
  if (hasLipidFlag(ctx, 'mi') || hasLipidFlag(ctx, 'stroke') || hasLipidFlag(ctx, 'pad')) {
    enhancerCount += 1;
  }

  const isVeryHigh = hasMajorRecentOrMultiBed || enhancerCount >= 2; // qa-allow: index - >= 2 yeu to nguy co cao tren nen ASCVD
  return {
    isVeryHighRiskAscvd: isVeryHigh,
    isStandardRiskAscvd: !isVeryHigh
  };
}

export function evaluateLipidRiskBundle(ctx: RuleContext): LipidRiskEvaluationBundle | null {
  const currentLdl = need(ctx, 'ldl');
  if (currentLdl === undefined) return null;

  const hasAscvd = hasAscvdEquivalent(ctx);
  const hasPolyvascular = hasPolyvascularDisease(ctx);
  const recurrentAcsWithin2Years = hasLipidFlag(ctx, 'recurrentAcsWithin2Years');
  const hasDm = hasLipidFlag(ctx, 'dm');
  const isT1dm = hasLipidFlag(ctx, 't1dm') || hasLipidFlag(ctx, 'type1Diabetes');
  const dmTargetOrganDamage =
    hasLipidFlag(ctx, 'dmTargetOrganDamage') ||
    hasLipidFlag(ctx, 'diabeticRetinopathy') ||
    hasLipidFlag(ctx, 'diabeticNeuropathy');
  const dmDurationYears = getCustomNumber(ctx, 'dmDurationYears');
  const egfr = need(ctx, 'egfr');
  const uacr = need(ctx, 'uacr');
  const hasFh = hasClinicalFh(ctx);
  const cacScore = getCacScore(ctx);
  const tc = need(ctx, 'tc');
  const hdl = need(ctx, 'hdl');
  const age = need(ctx, 'age');
  const sbp = need(ctx, 'sbp');
  const dbp = need(ctx, 'dbp');
  const bmi = need(ctx, 'bmi');
  const smoker = hasLipidFlag(ctx, 'smoker');
  const hasHypertension = hasLipidFlag(ctx, 'htn');

  let score2RiskPercent: number | undefined;
  let calculatorWarning: string | undefined;
  let preventAscvd10Yr: number | undefined;
  let preventCategory: PreventAscvdRiskCategory | null = null;

  const egfrCkdCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
  const tcSevere = thFor('tc', 'lipid.target.tc_severe_elevation');
  const ldlSevere = thFor('ldl', 'lipid.target.ldl_severe_elevation');
  const grade3Sbp = thFor('sbp', 'lipid.bp.grade3_sbp');
  const grade3Dbp = thFor('dbp', 'lipid.bp.grade3_dbp');
  const hivMinAge = thFor('age', 'lipid.hiv.primary_min_age');
  const hasHivIndication = hasLipidFlag(ctx, 'hiv') && age !== undefined && age >= hivMinAge;

  const isEligibleForPrimaryScore2 =
    ctx.settings.profile !== 'US' &&
    getActiveLipidMeds(ctx).length === 0 &&
    !hasAscvd &&
    !hasFh &&
    !hasDm &&
    !hasHivIndication &&
    !hasIsolatedHfWithoutStatinIndication(ctx) &&
    !hasLipidFlag(ctx, 'hf') &&
    !hasLipidFlag(ctx, 'ckd') &&
    !hasLipidFlag(ctx, 'onDialysis') &&
    (egfr === undefined || egfr >= egfrCkdCutoff) &&
    (tc === undefined || tc <= tcSevere) &&
    currentLdl < ldlSevere &&
    (sbp === undefined || sbp < grade3Sbp) &&
    (dbp === undefined || dbp < grade3Dbp);

  if (isEligibleForPrimaryScore2) {
    const explicitScore2 = getCustomNumber(ctx, 'score2RiskPercent');
    if (explicitScore2 !== undefined) {
      score2RiskPercent = explicitScore2;
    } else if (
      age !== undefined &&
      sbp !== undefined &&
      tc !== undefined &&
      hdl !== undefined &&
      (ctx.patient.sex === 'male' || ctx.patient.sex === 'female')
    ) {
      const score2Out = computeScore2({
        age,
        sex: ctx.patient.sex,
        smoker,
        sbp,
        tc,
        hdl,
        cholUnit: 'mmol/L',
        riskRegion: ctx.settings.score2Region
      });
      if (score2Out.riskPercent !== null) {
        score2RiskPercent = score2Out.riskPercent;
      }
      if (score2Out.warning) {
        calculatorWarning = score2Out.warning;
      }
    }
  }

  if (ctx.settings.profile === 'US' && !hasAscvd && !hasFh && currentLdl < ldlSevere) {
    const explicitPrevent =
      getCustomNumber(ctx, 'preventAscvd10Yr') ?? getCustomNumber(ctx, 'ascvdRisk10Yr');
    const lowMax = thFor('prevent_risk_pct', 'lipid.prevent.low_max');
    const borderMax = thFor('prevent_risk_pct', 'lipid.prevent.borderline_max');
    const interMax = thFor('prevent_risk_pct', 'lipid.prevent.intermediate_max');

    if (explicitPrevent !== undefined) {
      preventAscvd10Yr = explicitPrevent;
      preventCategory =
        explicitPrevent < lowMax
          ? 'low'
          : explicitPrevent < borderMax
            ? 'borderline'
            : explicitPrevent < interMax
              ? 'intermediate'
              : 'high';
    } else if (
      age !== undefined &&
      sbp !== undefined &&
      tc !== undefined &&
      hdl !== undefined &&
      bmi !== undefined &&
      egfr !== undefined &&
      (ctx.patient.sex === 'male' || ctx.patient.sex === 'female')
    ) {
      const prevOut = computePrevent({
        age,
        sex: ctx.patient.sex,
        sbp,
        tc,
        hdl,
        cholUnit: 'mmol/L',
        bmi,
        egfr,
        hasDiabetes: hasDm,
        smoker,
        onHtnMeds: hasHypertension,
        onStatin: Boolean(getActiveStatin(ctx))
      });
      if (prevOut.ascvdRisk10Yr !== null) {
        preventAscvd10Yr = prevOut.ascvdRisk10Yr;
        preventCategory = prevOut.ascvdRiskCategory ?? null;
      }
      if (prevOut.warning) {
        calculatorWarning = prevOut.warning;
      }
    }
  }

  const activeStatin = getActiveStatin(ctx);
  const hasEzetimibe = hasMed(ctx, 'ezetimibe');
  const hasPcsk9Med = hasPcsk9(ctx);
  const hasBempedoic = hasMed(ctx, 'bempedoic_acid');

  let currentTherapy: LipidTherapyType = 'none';
  if (activeStatin && hasEzetimibe && hasPcsk9Med) {
    currentTherapy = 'high_statin_plus_ezetimibe_plus_pcsk9i';
  } else if (activeStatin && hasEzetimibe) {
    currentTherapy = 'high_statin_plus_ezetimibe';
  } else if (activeStatin?.isHighIntensity) {
    currentTherapy = 'high_intensity_statin';
  } else if (activeStatin) {
    currentTherapy = 'moderate_intensity_statin';
  } else if (
    hasLipidFlag(ctx, 'statinIntolerance') &&
    (hasEzetimibe || hasBempedoic || hasPcsk9Med)
  ) {
    currentTherapy = 'moderate_intensity_statin';
  }

  const currentLdlMgDl =
    ctx.settings.units.lipid === 'mg_dL'
      ? Math.round(currentLdl * CHOL_CONVERSION_FACTOR)
      : undefined;

  const baseInput = {
    currentLdl,
    currentLdlMgDl,
    baselineLdl: need(ctx, 'baselineLdl'),
    hasAscvd,
    hasPolyvascular,
    recurrentAcsWithin2Years,
    hasDiabetes: hasDm,
    dmDurationYears,
    dmTargetOrganDamage,
    egfr,
    uacr,
    hasFamilialHypercholesterolemia: hasFh,
    tc,
    age,
    sbp,
    dbp,
    smoker,
    hasHypertension,
    hasMajorRiskFactor: smoker || hasHypertension,
    score2RiskPercent,
    currentTherapy
  };

  let explicitTier: EscRiskTier | undefined;
  const baseTier = determineEscRiskTier(baseInput);
  const usAscvdSub = evaluateUsAscvdSubtier(ctx);

  const t1dmAgeMax = thFor('age', 'lipid.dm.moderate_t1dm_max_age');
  if (hasDm && isT1dm && age !== undefined && age >= t1dmAgeMax && baseTier === 'moderate') {
    explicitTier = 'high';
  }

  const cacInit = thFor('cacscore', 'lipid.cac.statin_init_min');
  const cacHigh = thFor('cacscore', 'lipid.cac.high_risk_min');
  const cacVeryHigh = thFor('cacscore', 'lipid.cac.very_high_min');
  if (cacScore !== undefined && baseTier !== 'extreme') {
    if (cacScore >= cacVeryHigh) {
      explicitTier = 'very_high';
    } else if (cacScore >= cacHigh) {
      explicitTier = ctx.settings.profile === 'US' ? 'high' : 'very_high';
    } else if (cacScore >= cacInit && (explicitTier ?? baseTier) === 'low') {
      explicitTier = 'moderate';
    }
  }

  if (ctx.settings.profile === 'US') {
    if (hasAscvd) {
      if (usAscvdSub.isStandardRiskAscvd && (cacScore === undefined || cacScore < cacVeryHigh)) {
        explicitTier = 'high';
      } else {
        explicitTier = 'very_high';
      }
    } else if (
      !hasFh &&
      !hasDm &&
      (egfr === undefined || egfr >= egfrCkdCutoff) &&
      currentLdl < ldlSevere &&
      (cacScore === undefined || cacScore < cacHigh) &&
      preventCategory !== null
    ) {
      if (preventCategory === 'high') {
        explicitTier = 'high';
      } else if (preventCategory === 'intermediate' || preventCategory === 'borderline') {
        explicitTier = 'moderate';
      } else if (cacScore === undefined || cacScore < cacInit) {
        explicitTier = 'low';
      }
    }
  }

  const targetInfo = computeLdlTarget({
    ...baseInput,
    ...(explicitTier ? { riskTier: explicitTier } : {})
  });

  return {
    targetInfo,
    cacScore,
    preventAscvd10Yr,
    preventCategory,
    isUsStandardRiskAscvd: ctx.settings.profile === 'US' && usAscvdSub.isStandardRiskAscvd,
    isUsVeryHighRiskAscvd: ctx.settings.profile === 'US' && usAscvdSub.isVeryHighRiskAscvd,
    calculatorWarning
  };
}

export function evaluateLdlTargetForPatient(ctx: RuleContext): LdlTargetResult | null {
  const bundle = evaluateLipidRiskBundle(ctx);
  return bundle ? bundle.targetInfo : null;
}
