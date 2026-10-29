import type { RuleContext, CurrentMed } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  LAMA_WARNING_VI,
  LAMA_CONTROLLED_BPH_WARNING_VI,
  STRONG_CYP3A4_INHIBITOR_IDS,
} from './helpers.constants';

export function hasCurrentMed(ctx: RuleContext, drugId: string): boolean {
  const target = drugId.trim().toLowerCase();
  return ctx.normalized.currentMeds.some((m) => m.drugId?.trim().toLowerCase() === target);
}

export function findCurrentMedInSet(ctx: RuleContext, drugSet: Set<string>): CurrentMed | undefined {
  for (const m of ctx.normalized.currentMeds) {
    const id = m.drugId?.trim().toLowerCase();
    if (id && drugSet.has(id)) return m;
  }
  return undefined;
}

export function findAllCurrentMedsInSet(ctx: RuleContext, drugSet: Set<string>): CurrentMed[] {
  const results: CurrentMed[] = [];
  const seen = new Set<string>();
  for (const m of ctx.normalized.currentMeds) {
    const id = m.drugId?.trim().toLowerCase();
    if (!id || !drugSet.has(id)) continue;
    const key = `${id}:${(m.name || '').trim().toLowerCase()}:${(m.route || '').trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(m);
  }
  return results;
}

export function hasAnyCurrentMed(ctx: RuleContext, drugSet: Set<string>): string | undefined {
  return findCurrentMedInSet(ctx, drugSet)?.drugId?.trim().toLowerCase();
}

export function getBloodEos(ctx: RuleContext): number | undefined {
  return need(ctx, 'bloodEos') ?? need(ctx, 'eos');
}

export function getFev1PredPct(ctx: RuleContext): number | undefined {
  return need(ctx, 'fev1PredPct') ?? need(ctx, 'fev1Pct');
}

/**
 * Đọc tỷ số FEV₁/FVC sau giãn phế quản:
 * - Giữ nguyên độ chính xác của `customInputs.fev1FvcRatio` tường minh (quy đổi % nếu nhập > 1..100).
 * - Khi tính dự phòng từ `fev1 / fvc` thô, làm tròn `.toFixed(2)` để đồng bộ 100% với `derive.ts` & `note.ts`.
 */
export function getFev1FvcRatio(ctx: RuleContext): number | undefined {
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  const rawRatio =
    need(ctx, 'fev1FvcRatio') ??
    (typeof ci.postBdFev1Fvc === 'number' ? ci.postBdFev1Fvc : undefined) ??
    (typeof pCi.postBdFev1Fvc === 'number' ? pCi.postBdFev1Fvc : undefined);
  if (rawRatio !== undefined) {
    if (rawRatio > 1 && rawRatio <= 100) { // qa-allow: unit-conversion - quy đổi FEV1/FVC dạng phần trăm sang tỷ số thập phân
      return Number((rawRatio / 100).toFixed(4)); // qa-allow: unit-conversion - chia 100 quy đổi % sang tỷ số
    }
    return rawRatio;
  }
  const rawPatient = ctx.patient as unknown as Record<string, unknown>;
  const rawNorm = ctx.normalized as unknown as Record<string, unknown>;
  const fev1 =
    typeof rawNorm.fev1 === 'number'
      ? rawNorm.fev1
      : typeof rawPatient.fev1 === 'number'
        ? rawPatient.fev1
        : typeof ci.fev1 === 'number'
          ? ci.fev1
          : undefined;
  const fvc =
    typeof rawNorm.fvc === 'number'
      ? rawNorm.fvc
      : typeof rawPatient.fvc === 'number'
        ? rawPatient.fvc
        : typeof ci.fvc === 'number'
          ? ci.fvc
          : undefined;
  if (fev1 !== undefined && fvc !== undefined && fev1 > 0 && fvc > 0) {
    const computed = fev1 / fvc;
    return computed > 1 && computed <= 100 // qa-allow: unit-conversion - kiểm tra biên phần trăm
      ? Number((computed / 100).toFixed(2)) // qa-allow: unit-conversion - đồng bộ làm tròn 2 chữ số thập phân với derive.ts
      : Number(computed.toFixed(2)); // qa-allow: unit-conversion - đồng bộ làm tròn 2 chữ số thập phân với derive.ts
  }
  return undefined;
}

export function getModExac(ctx: RuleContext): number | undefined {
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  return (
    need(ctx, 'moderateExacerbations') ??
    ctx.normalized.copdExacerbations ??
    ctx.patient.copdExacerbations ??
    (typeof ci.exacerbationsLastYear === 'number' ? ci.exacerbationsLastYear : undefined) ??
    (typeof pCi.exacerbationsLastYear === 'number' ? pCi.exacerbationsLastYear : undefined)
  );
}

export function getHospExac(ctx: RuleContext): number | undefined {
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  return (
    need(ctx, 'hospitalizations') ??
    (typeof ci.hospitalizationsLastYear === 'number' ? ci.hospitalizationsLastYear : undefined) ??
    (typeof pCi.hospitalizationsLastYear === 'number' ? pCi.hospitalizationsLastYear : undefined) ??
    (typeof ci.severeExacerbationLastYear === 'number' ? ci.severeExacerbationLastYear : undefined) ??
    (typeof pCi.severeExacerbationLastYear === 'number' ? pCi.severeExacerbationLastYear : undefined)
  );
}

export function getRestingSpo2(ctx: RuleContext): number | undefined {
  return need(ctx, 'restingSpo2') ?? need(ctx, 'spo2');
}

export function getAbgPh(ctx: RuleContext): number | undefined {
  return need(ctx, 'abgPh') ?? need(ctx, 'ph');
}

export function getAbgPaco2(ctx: RuleContext): number | undefined {
  return need(ctx, 'abgPaco2') ?? need(ctx, 'paco2');
}

export function getRespiratoryRate(ctx: RuleContext): number | undefined {
  const stdRr = need(ctx, 'respiratoryRate');
  if (stdRr !== undefined) return stdRr;
  const ci = ctx.normalized.customInputs || {};
  const rawPt = ctx.patient as unknown as Record<string, unknown>;
  if (typeof ci.rr === 'number') return ci.rr;
  if (typeof rawPt.rr === 'number') return rawPt.rr;
  return undefined;
}

export function getQuitYears(ctx: RuleContext): number | undefined {
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  if (typeof ci.quitYears === 'number') return ci.quitYears;
  if (typeof pCi.quitYears === 'number') return pCi.quitYears;
  if (typeof ci.yearsSinceQuit === 'number') return ci.yearsSinceQuit;
  if (typeof pCi.yearsSinceQuit === 'number') return pCi.yearsSinceQuit;
  return undefined;
}

export function getQtcMs(ctx: RuleContext): number | undefined {
  const stdQtc = need(ctx, 'qtc');
  if (stdQtc !== undefined) return stdQtc;
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  if (typeof ci.qtcMs === 'number') return ci.qtcMs;
  if (typeof pCi.qtcMs === 'number') return pCi.qtcMs;
  if (typeof ci.qtc === 'number') return ci.qtc;
  if (typeof pCi.qtc === 'number') return pCi.qtc;
  return undefined;
}

export function hasProlongedQtc(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const nCond = (ctx.normalized.conditions || {}) as Record<string, unknown>;
  if (
    Boolean(ci.qtcProlonged) ||
    Boolean(pCi.qtcProlonged) ||
    Boolean(cond.longQt) ||
    Boolean(nCond.longQt) ||
    Boolean(cond.qtcProlonged)
  ) {
    return true;
  }
  const qtc = getQtcMs(ctx);
  return qtc !== undefined && qtc > thFor('qtc', 'copd.qtc_prolonged_cutoff_ms');
}

export function hasStrongCyp3a4Inhibitor(ctx: RuleContext): boolean {
  return findCurrentMedInSet(ctx, STRONG_CYP3A4_INHIBITOR_IDS) !== undefined;
}

export function getStrongCyp3a4InhibitorMed(ctx: RuleContext): CurrentMed | undefined {
  return findCurrentMedInSet(ctx, STRONG_CYP3A4_INHIBITOR_IDS);
}

export function getSmokingStatus(ctx: RuleContext): 'never' | 'former' | 'current' | undefined {
  const ciSmoke = ctx.normalized.customInputs?.smokingStatus ?? ctx.patient.customInputs?.smokingStatus;
  if (ciSmoke === 'never' || ciSmoke === 'former' || ciSmoke === 'current') return ciSmoke;
  return undefined;
}

function hasAnyFlag(bags: Array<Record<string, unknown> | undefined>, keys: string[]): boolean {
  return bags.some((b) => b !== undefined && keys.some((k) => Boolean(b[k])));
}

export function hasWeakInspiratoryFlow(ctx: RuleContext): boolean {
  return hasAnyFlag(
    [ctx.normalized.customInputs, ctx.patient.customInputs],
    ['weakInspiratoryFlow', 'inspiratoryFlowWeak']
  );
}

export function hasMilkProteinAllergy(ctx: RuleContext): boolean {
  return hasAnyFlag(
    [
      ctx.patient.conditions as Record<string, unknown>,
      ctx.normalized.conditions as Record<string, unknown>,
      ctx.normalized.customInputs,
      ctx.patient.customInputs,
    ],
    ['severe_milk_protein_allergy', 'severeMilkProteinAllergy', 'milkProteinAllergy']
  );
}

export function hasAnticholinergicContra(ctx: RuleContext): boolean {
  return hasAnyFlag(
    [
      ctx.patient.conditions as Record<string, unknown>,
      ctx.normalized.conditions as Record<string, unknown>,
      ctx.normalized.customInputs,
      ctx.patient.customInputs,
    ],
    [
      'narrowAngleGlaucoma',
      'narrow_angle_glaucoma',
      'urinaryRetention',
      'urinary_retention',
      'acuteUrinaryRetention',
    ]
  );
}

export function hasControlledBphCaution(ctx: RuleContext): boolean {
  if (hasAnticholinergicContra(ctx)) return false;
  return hasAnyFlag(
    [ctx.patient.conditions as Record<string, unknown>, ctx.normalized.customInputs],
    [
      'bph',
      'controlledBph',
      'prostateHyperplasia',
      'openAngleGlaucoma',
      'controlledBphOrTreatedGlaucoma',
    ]
  );
}

const RENALLY_CLEARED_LAMA_IDS = new Set<string>([
  'tiotropium',
  'spiriva',
  'spiriva_respimat',
  'spiriva_handihaler',
  'tiotropium_olodaterol',
  'spiolto',
  'spiolto_respimat',
  'glycopyrronium',
  'seebri',
  'glycopyrronium_indacaterol',
  'ultibro',
  'budesonide_glycopyrronium_formoterol',
  'breztri',
  'beclometasone_glycopyrronium_formoterol',
  'trimbow',
]);

export function getLamaWarnings(ctx: RuleContext, drugId?: string): string[] {
  const warnings: string[] = hasControlledBphCaution(ctx)
    ? [LAMA_CONTROLLED_BPH_WARNING_VI, LAMA_WARNING_VI]
    : [LAMA_WARNING_VI];
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const renalCutoff = thFor('egfr', 'copd.lama_severe_renal_egfr');
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const hasSevereRenal =
    hasCondition(ctx, 'onDialysis') ||
    Boolean(cond.dialysis) ||
    (egfr !== undefined && egfr < renalCutoff) ||
    (crcl !== undefined && crcl < renalCutoff);
  const normId = drugId?.trim().toLowerCase();
  if (hasSevereRenal && (!normId || RENALLY_CLEARED_LAMA_IDS.has(normId))) {
    warnings.push(
      `Suy thận nặng (eGFR/CrCl < ${renalCutoff} mL/phút hoặc lọc máu): Phơi nhiễm toàn thân của LAMA thải trừ qua thận (tiotropium, glycopyrronium) tăng gấp ~2 lần; chỉ dùng khi lợi ích vượt trội nguy cơ và theo dõi sát bí tiểu, khô miệng, nhịp nhanh, glôcôm.`
    );
  }
  return warnings;
}

export function getHepaticTripleWarnings(ctx: RuleContext, drugId: string): string[] {
  const ci = ctx.normalized.customInputs || {};
  const cond = ctx.patient.conditions || {};
  const cp = String(ci.childPugh ?? '').toUpperCase();
  const hasModSevereLiver =
    cp === 'B' ||
    cp === 'C' ||
    Boolean(ci.moderateSevereHepaticImpairment) ||
    hasCondition(ctx, 'decompensatedCirrhosis') ||
    (cp !== 'A' &&
      (Boolean(cond.liverDisease) || hasCondition(ctx, 'liverDisease') || hasCondition(ctx, 'cirrhosis')));
  if (!hasModSevereLiver) return [];
  if (drugId === 'fluticasone_furoate_umeclidinium_vilanterol') {
    return [
      'Suy gan vừa–nặng (Child-Pugh B/C): Phơi nhiễm toàn thân của Fluticasone furoate có thể tăng gấp 3 lần; theo dõi sát tác dụng phụ corticosteroid toàn thân và nguy cơ viêm phổi.',
    ];
  }
  if (
    drugId === 'budesonide_glycopyrronium_formoterol' &&
    (cp === 'C' || hasCondition(ctx, 'decompensatedCirrhosis') || cp === '')
  ) {
    return [
      'Suy gan nặng (Child-Pugh C / xơ gan): Phơi nhiễm toàn thân của Budesonide có thể tăng khoảng 2,5 lần; theo dõi sát tác dụng phụ corticosteroid toàn thân.',
    ];
  }
  return [];
}

export function hasBreastfeeding(ctx: RuleContext): boolean {
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const nCond = (ctx.normalized.conditions || {}) as Record<string, unknown>;
  const ci = ctx.normalized.customInputs || {};
  return Boolean(
    cond.breastfeeding ||
      cond.lactation ||
      nCond.breastfeeding ||
      nCond.lactation ||
      ci.breastfeeding ||
      ci.lactation
  );
}

export function hasSupplementalOxygen(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  const pCi = ctx.patient.customInputs || {};
  return Boolean(ci.onSupplementalOxygen || pCi.onSupplementalOxygen);
}

export function hasConcurrentAsthma(ctx: RuleContext): boolean {
  return (
    Boolean(ctx.patient.conditions?.priorAsthma) ||
    Boolean(ctx.patient.conditions?.asthma) ||
    hasCondition(ctx, 'asthma') ||
    ctx.normalized.selectedModules.includes('asthma')
  );
}

export function hasCompellingBbIndication(ctx: RuleContext): boolean {
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const lvef = need(ctx, 'lvef');
  const rhythm = String(ctx.normalized.rhythm ?? ctx.patient.rhythm ?? '').toLowerCase();
  return Boolean(
    hasCondition(ctx, 'hf') ||
      cond.hf ||
      ctx.normalized.selectedModules.includes('hf') ||
      (lvef !== undefined && lvef <= thFor('lvef', 'copd.hfref_lvef_cutoff')) ||
      hasCondition(ctx, 'ascvd') ||
      hasCondition(ctx, 'cad') ||
      hasCondition(ctx, 'mi') ||
      cond.cad ||
      cond.mi ||
      cond.ascvd ||
      cond.coronaryArteryDisease ||
      hasCondition(ctx, 'af') ||
      cond.af ||
      ctx.normalized.selectedModules.includes('af') ||
      rhythm === 'af' ||
      rhythm === 'afib' ||
      rhythm === 'flutter'
  );
}

/**
 * Nhận diện suy hô hấp cấp đe dọa tính mạng khách quan qua sinh hiệu / khí máu động mạch
 * (kể cả khi người dùng quên bật `acuteExacerbation: true` ở cả nội viện lẫn ngoại trú).
 */
export function hasAcuteRespiratoryFailureSigns(ctx: RuleContext): boolean {
  const rawCi = (ctx.patient.customInputs || {}) as Record<string, unknown>;
  const ci = ctx.normalized.customInputs || {};
  const explicitFlag =
    ctx.normalized.customInputs?.acuteExacerbation ?? ctx.patient.customInputs?.acuteExacerbation;
  if (explicitFlag === false) return false;

  const explicitAcuteFieldProvided =
    rawCi.respiratoryArrest === true ||
    rawCi.alteredMentalStatus === true ||
    rawCi.accessoryMuscleUse === true ||
    rawCi.abgPh !== undefined ||
    (ctx.patient as unknown as Record<string, unknown>).ph !== undefined ||
    rawCi.respiratoryRate !== undefined ||
    (ctx.patient as unknown as Record<string, unknown>).rr !== undefined;
  if (!explicitAcuteFieldProvided && explicitFlag !== true) return false;

  if (Boolean(ci.respiratoryArrest) || Boolean(ci.accessoryMuscleUse)) return true;

  const ph = getAbgPh(ctx);
  const paco2 = getAbgPaco2(ctx);
  const spo2 = getRestingSpo2(ctx);
  const rr = getRespiratoryRate(ctx);
  const sbp = need(ctx, 'sbp');

  const hasSevereAcidosis = ph !== undefined && ph <= thFor('abgPh', 'copd.severe_acidosis_ph');
  const hasUncompensatedAcidoticHypercapnia =
    ph !== undefined &&
    ph <= thFor('abgPh', 'copd.niv_ph_cutoff') &&
    (paco2 === undefined || paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff'));

  if (hasSevereAcidosis || hasUncompensatedAcidoticHypercapnia) {
    return true;
  }

  if (
    Boolean(ci.alteredMentalStatus) &&
    (explicitFlag === true ||
      ctx.settings.setting === 'inpatient' ||
      (spo2 !== undefined && spo2 < thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff')) ||
      (paco2 !== undefined && paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff')))
  ) {
    return true;
  }

  if (rr !== undefined && rr > thFor('respiratoryRate', 'copd.exac_rr_life_threatening')) {
    return true;
  }

  if (
    rr !== undefined &&
    rr > thFor('respiratoryRate', 'copd.exac_rr_non_rf_max') &&
    (ctx.settings.setting === 'inpatient' ||
      explicitFlag === true ||
      Boolean(ci.increasedDyspnea) ||
      Boolean(ci.purulentSputum) ||
      (spo2 !== undefined && spo2 < thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff')))
  ) {
    return true;
  }

  if (explicitFlag === true) {
    if (
      Boolean(ci.alteredMentalStatus) ||
      (spo2 !== undefined && spo2 < thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff')) ||
      (sbp !== undefined && sbp < thFor('sbp', 'copd.hypotension_sbp_cutoff'))
    ) {
      return true;
    }
  }

  return false;
}

export function isAcuteExacerbation(ctx: RuleContext): boolean {
  const explicit = ctx.normalized.customInputs?.acuteExacerbation ?? ctx.patient.customInputs?.acuteExacerbation;
  if (explicit === true) return true;
  if (explicit === false) return false;
  if (hasAcuteRespiratoryFailureSigns(ctx)) {
    return true;
  }
  return false;
}

export function hasOutpatientAcuteRespiratoryFailure(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'outpatient') return false;
  return hasAcuteRespiratoryFailureSigns(ctx);
}

export function isCriticallyUnstableInpatient(ctx: RuleContext): boolean {
  if (!isAcuteExacerbation(ctx)) return false;
  const ph = getAbgPh(ctx);
  const sbp = need(ctx, 'sbp');
  const ci = ctx.normalized.customInputs || {};
  const severeAcidosis = ph !== undefined && ph <= thFor('abgPh', 'copd.severe_acidosis_ph');
  const hypotension = sbp !== undefined && sbp < thFor('sbp', 'copd.hypotension_sbp_cutoff');
  return severeAcidosis || hypotension || Boolean(ci.alteredMentalStatus) || Boolean(ci.respiratoryArrest);
}

export function hasConfirmedCopdSpirometry(ctx: RuleContext): boolean {
  const fev1Fvc = getFev1FvcRatio(ctx);
  const fev1Pct = getFev1PredPct(ctx);
  if (fev1Fvc === undefined || fev1Pct === undefined) return false;
  return fev1Fvc < thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic');
}

export function hasConfirmedStableCopd(ctx: RuleContext): boolean {
  if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
  return hasConfirmedCopdSpirometry(ctx);
}

export function isHighSymptomsConfirmed(ctx: RuleContext): boolean {
  const mmrc = need(ctx, 'mmrc');
  const cat = need(ctx, 'cat');
  return (
    (mmrc !== undefined && mmrc >= thFor('mmrc', 'copd.mmrc_high')) ||
    (cat !== undefined && cat >= thFor('cat', 'copd.cat_high'))
  );
}

export function isLowSymptomsConfirmed(ctx: RuleContext): boolean {
  const mmrc = need(ctx, 'mmrc');
  const cat = need(ctx, 'cat');
  if (mmrc === undefined || cat === undefined) return false;
  return mmrc < thFor('mmrc', 'copd.mmrc_high') && cat < thFor('cat', 'copd.cat_high');
}

export function isGroupEConfirmed(ctx: RuleContext): boolean {
  const modExac = getModExac(ctx);
  const hosp = getHospExac(ctx);
  if (hosp !== undefined && hosp >= thFor('hospitalizations', 'copd.exacerbation_high_risk')) return true;
  if (modExac !== undefined && modExac >= thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')) {
    return true;
  }
  return false;
}

export function isLowExacerbationConfirmed(ctx: RuleContext): boolean {
  const hosp = getHospExac(ctx);
  const modExac = getModExac(ctx);
  if (hosp === undefined || modExac === undefined) return false;
  return !isGroupEConfirmed(ctx);
}
