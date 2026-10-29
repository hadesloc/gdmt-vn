/**
 * GDMT-VN Gout Module - Core Builders, Clinical States, Urate Unit Normalization & ULT Indication
 * Phân quyền: Agent K
 *
 * Tuân thủ QA-1 (fail-closed) và QA-10 (thFor type-safe threshold access).
 */

import type { Rule, Recommendation, RuleContext, Action, Setting, Profile } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need, missingInputRec, registerValidFields } from '../../engine/require';
import { URAT_CONVERSION_FACTOR } from '../../engine/units';
import { thFor } from '../../kb-types';

registerValidFields([
  'tophi',
  'goutFlaresYear',
  'uricAcid',
  'asymptomaticHyperuricemia',
  'xrayDamage',
  'erosions',
  'priorFlaresLifetime',
  'urolithiasis',
  'acuteFlare',
  'flareHoursSinceOnset',
  'severePolyarticularFlare',
  'monoarthritisLargeJoint',
  'septicArthritisSuspected',
  'fever',
  'temperature',
  'hlab5801',
  'hlaB5801',
  'highRiskHlaB5801Ancestry',
  'southeastAsianDescent',
  'africanAmericanDescent',
  'allopurinolIntolerant',
  'febuxostatIntolerant',
  'colchicineIntolerant',
  'aerd',
  'nsaidAllergyOrAerd',
  'nsaidHypersensitivity',
  'aspirinHypersensitivity',
  'sulfonamideAllergy',
  'hasCvd',
  'hasTophi',
  'pepticUlcer',
  'activeBleeding',
  'onAnticoagulant',
  'cyp3a4PgpInhibitor',
  'moderateCyp3a4Inhibitor',
  'takingAzathioprine',
  'takingThiazide',
  'takingThiazideOrLoop',
  'takingLowDoseAspirin',
  'preferFebuxostat',
  'preferProbenecid',
  'preferBenzbromarone',
  'preferUricosuric',
  'uricAcidOverproduction',
  'secondaryHematologicMalignancyOrTls',
  'tumorLysisSyndrome',
  'unableToTakeOral',
  'activeInfection',
  'steroidContraindicated',
  'dkaSuspected',
  'breastfeeding',
  'lactation',
  'childPugh',
  'decompensatedCirrhosis',
  'africanAmerican',
  'hanChinese',
  'korean',
  'thai',
  'altUln'
]);

export function goutRule(params: {
  id: string;
  nameVi: string;
  setting?: Setting | 'both';
  profiles?: Profile[];
  citationIds: string[];
  when: (ctx: RuleContext) => boolean;
  produce: (ctx: RuleContext) => Recommendation | null;
}): Rule {
  return {
    id: params.id,
    module: 'gout',
    nameVi: params.nameVi,
    setting: params.setting ?? 'both',
    profiles: params.profiles ?? ['INTL', 'VN', 'US'],
    citationIds: params.citationIds,
    when: params.when,
    produce: params.produce
  };
}

export function goutRec(params: {
  id: string;
  tier: string;
  tierOrder?: number;
  priority: number;
  action: Action;
  drugId?: string;
  drugNameVi?: string;
  switchFrom?: string;
  dose?: string;
  title: string;
  rationale: string;
  warnings?: string[];
  profileDiff?: { INTL?: string; VN?: string; US?: string };
  citationIds: string[];
}): Recommendation {
  const noDoseActions: Action[] = ['STOP', 'AVOID', 'HOLD', 'DEFER'];
  return {
    id: params.id,
    module: 'gout',
    tier: params.tier,
    tierOrder: params.tierOrder,
    priority: params.priority,
    action: params.action,
    drugId: params.drugId,
    drugNameVi: params.drugNameVi,
    switchFrom: params.switchFrom,
    dose: noDoseActions.includes(params.action) ? undefined : params.dose,
    title: params.title,
    rationale: params.rationale,
    gates: [],
    warnings: params.warnings,
    profileDiff: params.profileDiff,
    citationIds: params.citationIds
  };
}

export function goutMissing(field: string, reasonVi: string, citationIds: string[]): Recommendation {
  const normField = field === 'urate' || field === 'urat' ? 'uricAcid' : field;
  return missingInputRec('gout', normField, reasonVi, citationIds);
}

export function getAllergyList(ctx: RuleContext): string[] {
  const fromNorm = (ctx.normalized as unknown as { allergies?: unknown }).allergies;
  const fromPat = (ctx.patient as unknown as { allergies?: unknown }).allergies;
  const combined = [
    ...(Array.isArray(fromNorm) ? fromNorm : []),
    ...(Array.isArray(fromPat) ? fromPat : [])
  ];
  return combined.filter((x): x is string => typeof x === 'string');
}

export function isPregnant(ctx: RuleContext): boolean {
  return hasCondition(ctx, 'pregnant');
}

export function isBreastfeeding(ctx: RuleContext): boolean {
  return Boolean(
    ctx.normalized.conditions?.breastfeeding ||
      ctx.normalized.customInputs?.breastfeeding ||
      ctx.normalized.customInputs?.lactation
  );
}

export function getChildPughGrade(ctx: RuleContext): 'A' | 'B' | 'C' | undefined {
  const direct = (ctx.normalized as unknown as { childPugh?: unknown }).childPugh;
  const custom = ctx.normalized.customInputs?.childPugh;
  const raw = typeof direct === 'string' && direct ? direct : typeof custom === 'string' ? custom : undefined;
  const upper = raw?.trim().toUpperCase();
  if (upper === 'A' || upper === 'B' || upper === 'C') return upper;
  if (ctx.normalized.conditions?.decompensatedCirrhosis) return 'C';
  return undefined;
}

export function hasSevereHepaticImpairment(ctx: RuleContext): boolean {
  const cp = getChildPughGrade(ctx);
  return Boolean(
    cp === 'C' ||
      hasCondition(ctx, 'decompensatedCirrhosis') ||
      ctx.normalized.conditions?.decompensatedCirrhosis ||
      ctx.normalized.customInputs?.decompensatedCirrhosis === true
  );
}

export function hasModerateOrSevereHepaticImpairment(ctx: RuleContext): boolean {
  const cp = getChildPughGrade(ctx);
  const altUln = Number(ctx.normalized.customInputs?.altUln);
  return Boolean(
    hasSevereHepaticImpairment(ctx) ||
      cp === 'B' ||
      (Number.isFinite(altUln) && altUln >= 3) // qa-allow: index - bội số ULN men gan
  );
}

export function hasHepaticImpairment(ctx: RuleContext): boolean {
  const cp = getChildPughGrade(ctx);
  return Boolean(
    hasCondition(ctx, 'liverDisease') ||
      hasCondition(ctx, 'cirrhosis') ||
      ctx.normalized.conditions?.activeLiverDisease ||
      cp === 'A' ||
      cp === 'B' ||
      cp === 'C' ||
      hasModerateOrSevereHepaticImpairment(ctx)
  );
}

export function hasTophi(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.tophi || ctx.normalized.customInputs?.tophi);
}

export function hasXrayDamage(ctx: RuleContext): boolean {
  return Boolean(
    ctx.normalized.customInputs?.xrayDamage ||
      ctx.normalized.customInputs?.erosions ||
      ctx.normalized.conditions?.goutErosions
  );
}

export function hasUrolithiasis(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.customInputs?.urolithiasis || ctx.normalized.conditions?.urolithiasis);
}

export function hasSecondaryHyperuricemiaOrTls(ctx: RuleContext): boolean {
  return Boolean(
    ctx.normalized.customInputs?.secondaryHematologicMalignancyOrTls ||
      ctx.normalized.customInputs?.tumorLysisSyndrome ||
      ctx.normalized.conditions?.tumorLysisSyndrome
  );
}

export function getFlaresPerYear(ctx: RuleContext): number | undefined {
  const fromRoot = ctx.normalized.goutFlaresYear;
  if (typeof fromRoot === 'number' && !Number.isNaN(fromRoot)) return fromRoot;
  const fromCustom = ctx.normalized.customInputs?.goutFlaresYear;
  if (typeof fromCustom === 'number' && !Number.isNaN(fromCustom)) return fromCustom;
  return undefined;
}

export function getPriorFlaresLifetime(ctx: RuleContext): number | undefined {
  const v = ctx.normalized.customInputs?.priorFlaresLifetime;
  return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
}

export function isAsymptomaticHyperuricemia(ctx: RuleContext): boolean {
  if (ctx.normalized.customInputs?.asymptomaticHyperuricemia === true) return true;
  if (
    ctx.normalized.conditions?.gout === false &&
    !hasTophi(ctx) &&
    !hasXrayDamage(ctx) &&
    ctx.normalized.customInputs?.acuteFlare !== true
  ) {
    const prior = getPriorFlaresLifetime(ctx);
    const flaresYr = getFlaresPerYear(ctx);
    if (prior === 0 && (flaresYr === undefined || flaresYr === 0)) return true;
  }
  return false;
}

/** QA-1 Fail-closed: Chỉ true khi customInputs.acuteFlare === true */
export function isAcuteGoutFlare(ctx: RuleContext): boolean {
  return ctx.normalized.customInputs?.acuteFlare === true;
}

export function isSeverePolyarticularFlare(ctx: RuleContext): boolean {
  return ctx.normalized.customInputs?.severePolyarticularFlare === true;
}

export function isMonoarthritisLargeJoint(ctx: RuleContext): boolean {
  return ctx.normalized.customInputs?.monoarthritisLargeJoint === true;
}

export function isUnableToTakeOral(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.customInputs?.unableToTakeOral || ctx.normalized.conditions?.npo);
}

export function isSepticArthritisOrFeverRedFlag(ctx: RuleContext): boolean {
  const temp = Number(ctx.normalized.customInputs?.temperature);
  return Boolean(
    ctx.normalized.conditions?.septicArthritisSuspected ||
      ctx.normalized.customInputs?.septicArthritisSuspected === true ||
      ctx.normalized.customInputs?.fever === true ||
      (Number.isFinite(temp) && temp >= 38.5) // qa-allow: index - ngưỡng sốt cao gợi ý nhiễm khuẩn khớp
  );
}

export function hasActiveInfection(ctx: RuleContext): boolean {
  return Boolean(
    ctx.normalized.customInputs?.activeInfection ||
      ctx.normalized.conditions?.activeInfection ||
      isSepticArthritisOrFeverRedFlag(ctx)
  );
}

export function hasSevereUncontrolledHyperglycemia(ctx: RuleContext): boolean {
  const glucose = need(ctx, 'glucose');
  const severeGlucoseMmol = thFor('glucose', 'gout.steroid.severe_hyperglycemia_mmol');
  return Boolean(glucose !== undefined && glucose >= severeGlucoseMmol);
}

export function isDkaSuspected(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.customInputs?.dkaSuspected || ctx.normalized.conditions?.dka);
}

export function isSteroidContraindicated(ctx: RuleContext): boolean {
  const steroidAllergyHit = getAllergyList(ctx).some((a) => {
    const s = a.toLowerCase();
    return (
      s.includes('prednisolon') ||
      s.includes('prednison') ||
      s.includes('methylprednisolon') ||
      s.includes('corticosteroid') ||
      s.includes('glucocorticoid') ||
      s === 'steroid'
    );
  });
  return Boolean(
    ctx.normalized.customInputs?.steroidContraindicated ||
      hasActiveInfection(ctx) ||
      ctx.normalized.conditions?.steroidAllergy ||
      steroidAllergyHit
  );
}

export function hasActiveMajorBleeding(ctx: RuleContext): boolean {
  return Boolean(
    ctx.normalized.conditions?.activeGiBleed ||
      ctx.normalized.conditions?.acuteIntracerebralHemorrhage ||
      ctx.normalized.conditions?.activeBleeding ||
      ctx.normalized.conditions?.activePepticUlcer ||
      ctx.normalized.customInputs?.activeBleeding === true
  );
}

export function hasPriorGiUlcerOrBleedHistory(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'pepticUlcer') ||
      hasCondition(ctx, 'bleedingHistory') ||
      ctx.normalized.conditions?.giBleedHistory ||
      ctx.normalized.customInputs?.pepticUlcer
  );
}

export function isOnDialysis(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.conditions?.onDialysis);
}

export function hasHeartFailure(ctx: RuleContext): boolean {
  const lvef = need(ctx, 'lvef');
  const hfrefMax = thFor('lvef', 'gout.nsaid.hfref_lvef_max');
  return Boolean(hasCondition(ctx, 'hf') || (lvef !== undefined && lvef < hfrefMax));
}

export function hasEstablishedCvd(ctx: RuleContext): boolean {
  return Boolean(
    hasHeartFailure(ctx) ||
      hasCondition(ctx, 'ascvd') ||
      hasCondition(ctx, 'strokeOrTia') ||
      ctx.normalized.conditions?.recentAcs ||
      ctx.normalized.customInputs?.hasCvd
  );
}

/**
 * Quy đổi chuẩn xác từ giá trị urat nội bộ đã chuẩn hóa SI (µmol/L) ngược về mg/dL
 * (tuyệt đối KHÔNG đọc trực tiếp ctx.patient.uricAcid vì ctx.patient đã nhân 59.48!).
 */
export function getUrateMgDl(ctx: RuleContext): number | undefined {
  const urateUmol = need(ctx, 'urate');
  if (urateUmol === undefined) return undefined;
  return Math.round((urateUmol / URAT_CONVERSION_FACTOR) * 100) / 100; // qa-allow: unit-conversion - µmol/L sang mg/dL
}

export function getTargetUrateUmol(ctx: RuleContext): number {
  if (ctx.settings.profile === 'US') return thFor('urate', 'gout.target.urate_standard_umol');
  if (hasTophi(ctx) || hasXrayDamage(ctx)) {
    return ctx.settings.profile === 'VN'
      ? thFor('urate', 'gout.target.urate_vn_tophi_umol')
      : thFor('urate', 'gout.target.urate_tophi_umol');
  }
  return thFor('urate', 'gout.target.urate_standard_umol');
}

export function getTargetUrateMgDl(ctx: RuleContext): number {
  if (ctx.settings.profile === 'US') return thFor('urate', 'gout.target.urate_standard_mgdl');
  if (hasTophi(ctx) || hasXrayDamage(ctx)) {
    if (ctx.settings.profile === 'VN') {
      const vnUmol = thFor('urate', 'gout.target.urate_vn_tophi_umol');
      return Math.round((vnUmol / URAT_CONVERSION_FACTOR) * 10) / 10; // qa-allow: unit-conversion - 320 µmol/L = 5.4 mg/dL
    }
    return thFor('urate', 'gout.target.urate_tophi_mgdl');
  }
  return thFor('urate', 'gout.target.urate_standard_mgdl');
}

export function isUrateBelowTarget(ctx: RuleContext): boolean | undefined {
  const urateUmol = need(ctx, 'urate');
  if (urateUmol === undefined) return undefined;
  if (ctx.settings.units?.urat === 'mg_dL') {
    const urateMgDl = getUrateMgDl(ctx);
    if (urateMgDl === undefined) return undefined;
    if (ctx.settings.profile === 'VN' && (hasTophi(ctx) || hasXrayDamage(ctx))) {
      return urateUmol < getTargetUrateUmol(ctx);
    }
    return urateMgDl < getTargetUrateMgDl(ctx);
  }
  return urateUmol < getTargetUrateUmol(ctx);
}

export function isUrateBelowLongTermFloor(ctx: RuleContext): boolean {
  const urateMgDl = getUrateMgDl(ctx);
  if (urateMgDl === undefined) return false;
  const floorMgDl = thFor('urate', 'gout.target.urate_floor_mgdl');
  return urateMgDl < floorMgDl;
}

export interface UltIndicationAssessment {
  status: 'strong' | 'conditional' | 'not_indicated' | 'asymptomatic' | 'missing';
  reasonsVi: string[];
  citationIds: string[];
  missingField?: string;
}

export function assessUltIndication(ctx: RuleContext): UltIndicationAssessment {
  if (isAsymptomaticHyperuricemia(ctx)) {
    return {
      status: 'asymptomatic',
      reasonsVi: ['Tăng acid uric máu không triệu chứng: ACR 2020 và KDIGO 2024 khuyến cáo KHÔNG khởi trị ULT'],
      citationIds: ['acr.gout.2020.indication_against_asymptomatic', 'kdigo.gout.2024.rec_3_14_2_asymptomatic']
    };
  }

  const frequentCutoff = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
  const flaresYear = getFlaresPerYear(ctx);
  const strongReasons: string[] = [];

  if (hasTophi(ctx)) strongReasons.push('Có hạt tophi dưới da');
  if (hasXrayDamage(ctx)) strongReasons.push('Có tổn thương khuyết xương / bào mòn khớp trên hình ảnh học');
  if (flaresYear !== undefined && flaresYear >= frequentCutoff) {
    strongReasons.push(`Đợt cấp gút tái phát thường xuyên (${flaresYear} ≥ ${frequentCutoff} đợt/năm)`);
  }

  if (strongReasons.length > 0) {
    const cites = ['acr.gout.2020.indication_strong'];
    const egfrCheck = need(ctx, 'egfr');
    if (hasCondition(ctx, 'ckd') || (egfrCheck !== undefined && egfrCheck < thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold'))) {
      cites.push('kdigo.gout.2024.rec_3_14_1');
    }
    return { status: 'strong', reasonsVi: strongReasons, citationIds: cites };
  }

  const priorLifetime = getPriorFlaresLifetime(ctx);
  const infrequentMin = thFor('count', 'gout.indication.prior_flares_infrequent');
  if (priorLifetime !== undefined && priorLifetime > infrequentMin) {
    return {
      status: 'conditional',
      reasonsVi: [`Từng có > ${infrequentMin} đợt cấp gút trong đời (${priorLifetime} đợt), cơn thưa (< ${frequentCutoff} đợt/năm)`],
      citationIds: ['acr.gout.2020.indication_conditional_infrequent']
    };
  }

  if (flaresYear === undefined && priorLifetime === undefined && !isAcuteGoutFlare(ctx)) {
    return { status: 'missing', reasonsVi: [], citationIds: [], missingField: 'goutFlaresYear' };
  }
  if (flaresYear === 0 && priorLifetime === undefined && !isAcuteGoutFlare(ctx)) {
    return { status: 'missing', reasonsVi: [], citationIds: [], missingField: 'priorFlaresLifetime' };
  }

  const egfr = need(ctx, 'egfr');
  const urate = need(ctx, 'urate');
  const urateMgDl = getUrateMgDl(ctx);
  const age = need(ctx, 'age');
  const egfrCkdCutoff = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
  const highUrateUmol = thFor('urate', 'gout.indication.urate_high_cutoff_umol');
  const highUrateMgdl = thFor('urate', 'gout.indication.urate_high_cutoff_mgdl');
  const isHighUrate =
    ctx.settings.units?.urat === 'mg_dL'
      ? urateMgDl !== undefined && urateMgDl > highUrateMgdl
      : urate !== undefined && urate > highUrateUmol;

  const condReasons: string[] = [];
  const condCitations: string[] = [];

  if (hasCondition(ctx, 'ckd') || isOnDialysis(ctx) || (egfr !== undefined && egfr < egfrCkdCutoff)) {
    condReasons.push('Bệnh thận mạn giai đoạn ≥ 3');
    condCitations.push('acr.gout.2020.indication_conditional_first_flare', 'kdigo.gout.2024.ckd_first_flare', 'kdigo.gout.2024.rec_3_14_1');
  }
  if (isHighUrate && urate !== undefined) {
    condReasons.push(`Acid uric máu rất cao (> ${highUrateUmol} µmol/L [${highUrateMgdl} mg/dL])`);
    condCitations.push('acr.gout.2020.indication_conditional_first_flare', 'kdigo.gout.2024.ckd_first_flare');
  }
  if (hasUrolithiasis(ctx)) {
    condReasons.push('Tiền sử sỏi thận tiết niệu');
    condCitations.push('acr.gout.2020.indication_conditional_first_flare');
  }

  if (ctx.settings.profile === 'INTL') {
    const eularAgeMax = thFor('age', 'gout.indication.eular_young_age_max');
    const eularHighUmol = thFor('urate', 'gout.indication.eular_high_sua_umol');
    const eularHighMgdl = thFor('urate', 'gout.indication.eular_high_sua_mgdl');
    const isEularHighUrate =
      ctx.settings.units?.urat === 'mg_dL'
        ? urateMgDl !== undefined && urateMgDl > eularHighMgdl
        : urate !== undefined && urate > eularHighUmol;

    if (age !== undefined && age < eularAgeMax) {
      condReasons.push(`Khởi phát gút ở người trẻ (< ${eularAgeMax} tuổi theo EULAR 2016)`);
      condCitations.push('eular.gout.2016.early_ult_young_high_sua');
    } else if (isEularHighUrate && urate !== undefined) {
      condReasons.push(`Acid uric máu > ${eularHighUmol} µmol/L (${eularHighMgdl} mg/dL) theo EULAR 2016`);
      condCitations.push('eular.gout.2016.early_ult_young_high_sua');
    } else if (hasCondition(ctx, 'htn') || hasEstablishedCvd(ctx)) {
      condReasons.push('Kèm bệnh đồng mắc tăng huyết áp / tim mạch theo EULAR 2016');
      condCitations.push('eular.gout.2016.early_ult_young_high_sua');
    }
  }

  if (condReasons.length > 0) {
    return { status: 'conditional', reasonsVi: condReasons, citationIds: Array.from(new Set(condCitations)) };
  }
  if (egfr === undefined && !isOnDialysis(ctx) && !hasCondition(ctx, 'ckd')) {
    return { status: 'missing', reasonsVi: [], citationIds: [], missingField: 'egfr' };
  }
  if (urate === undefined) {
    return { status: 'missing', reasonsVi: [], citationIds: [], missingField: 'urate' };
  }
  return {
    status: 'not_indicated',
    reasonsVi: [`Cơn gút đầu tiên không kèm CKD ≥ 3, không sỏi thận và acid uric ≤ ${highUrateUmol} µmol/L`],
    citationIds: ['acr.gout.2020.indication_against_first_flare']
  };
}

export * from './helpers.meds';
export * from './helpers.safety';
export * from './helpers.ult';
