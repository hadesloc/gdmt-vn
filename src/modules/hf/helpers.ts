import type { CurrentMed, RuleContext } from '../../engine/types';
import { hasCondition, need, registerValidFields } from '../../engine/require';
import type { Dose } from '../../kb-types/index';
import { dose, drug, hasDrug, thFor } from '../../kb-types/access';
import { parseComponentDailyDoseMg, parseDailyDoseMg } from '../../engine/doseParser';
import { expandDrugComponents, isFdcDrug } from '../../engine/safety/fdcMap';
import {
  getExpandedDrugIds,
  hasAcuteBronchospasmOrRespFailure,
  resolveKbDrugId,
} from '../../engine/safety/drugClassify';
import {
  detectAcuteAki,
  isCardiogenicShockOrVasopressor,
} from '../../engine/safety/clinicalStates';

registerValidFields([
  'priorLvef',
  'hfPhenotype',
  'dmType',
  'cardiogenicShock',
  'onInotropes',
  'congestion',
  'qrsDuration',
  'qrsMorphology',
  'fmtDurationMonths',
  'severeSecondaryMr',
  'ferritin',
  'tsat',
  'ntProBnp',
  'recentWorseningHf',
  'takingAcei',
  'urinarySodium2h',
  'urineOutputRate6h',
  'childPugh',
  'selfIdentifiedBlack',
  'spironolactoneGynecomastia',
  'bbMaxTolerated',
  'ischemicEtiology',
  'hfhCountLastYear',
  'postMiOver40d',
  'isAcuteExacerbation',
  'acuteBronchospasm',
  'speechAbility',
]);

export type HfPhenotype = 'hfref' | 'hfmref' | 'hfpef' | 'hfimpef' | 'unknown';
export type CongestionLevel = 'euvolaemic' | 'mild' | 'overt';
export type ChildPughGrade = 'A' | 'B' | 'C';

export const HF_BB_MORTALITY_IDS = ['bisoprolol', 'carvedilol', 'metoprolol_succinate'] as const;
export const HF_BB_IDS = ['bisoprolol', 'carvedilol', 'metoprolol_succinate', 'nebivolol'] as const;
export const HF_SELECTIVE_BB_IDS = ['bisoprolol', 'metoprolol_succinate'] as const;
export const NON_HF_BB_IDS = [
  'atenolol', 'metoprolol_tartrate', 'metoprolol', 'propranolol',
  'nadolol', 'sotalol', 'labetalol', 'timolol',
] as const;

export const SGLT2I_IDS = ['dapagliflozin', 'empagliflozin'] as const;
export const SMRA_IDS = ['spironolactone', 'eplerenone'] as const;
export const ALL_MRA_IDS = ['spironolactone', 'eplerenone', 'finerenone'] as const;
export const LOOP_DIURETIC_IDS = ['furosemide', 'torsemide', 'bumetanide'] as const;
export const IV_IRON_IDS = ['ferric_carboxymaltose', 'ferric_derisomaltose'] as const;

export const ACEI_IDS = [
  'enalapril', 'lisinopril', 'ramipril', 'perindopril', 'captopril',
  'imidapril', 'quinapril', 'benazepril', 'fosinopril', 'trandolapril',
] as const;

export const ARB_IDS = [
  'valsartan', 'candesartan', 'losartan', 'telmisartan', 'irbesartan', 'olmesartan', 'azilsartan',
] as const;

export const PDE5I_IDS = ['sildenafil', 'tadalafil', 'vardenafil', 'avanafil'] as const;
export const LONG_ACTING_NITRATE_OR_SGC_IDS = [
  'isosorbide_dinitrate', 'isosorbide_mononitrate', 'riociguat',
] as const;
export const NITRATE_OR_SGC_IDS = [
  'isosorbide_dinitrate', 'isosorbide_mononitrate', 'nitroglycerin', 'glyceryl_trinitrate', 'riociguat',
] as const;
export const STRONG_CYP3A4_IDS = [
  'clarithromycin', 'itraconazole', 'ketoconazole', 'voriconazole', 'posaconazole',
  'ritonavir', 'nirmatrelvir_ritonavir', 'nelfinavir', 'cobicistat', 'nefazodone',
] as const;
export const MODERATE_CYP3A4_IDS = [
  'fluconazole', 'erythromycin', 'verapamil', 'diltiazem', 'saquinavir',
] as const;
export const PGP_INHIBITOR_IDS = [
  'amiodarone', 'dronedarone', 'verapamil', 'clarithromycin', 'erythromycin',
  'itraconazole', 'ketoconazole', 'cyclosporine', 'quinidine', 'propafenone',
] as const;
export const NDHP_CCB_IDS = ['diltiazem', 'verapamil'] as const;
export const ALPHA1_BLOCKER_IDS = ['doxazosin', 'prazosin', 'terazosin'] as const;

export const HARMFUL_HF_DRUG_IDS = [
  'ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'etoricoxib', 'meloxicam', 'piroxicam',
  'indomethacin', 'ketorolac', 'etodolac', 'dexketoprofen', 'parecoxib',
  'diltiazem', 'verapamil', 'pioglitazone', 'rosiglitazone', 'saxagliptin', 'alogliptin',
  'cilostazol', 'itraconazole', 'dronedarone', 'flecainide', 'propafenone', 'disopyramide',
  'sotalol', 'moxonidine',
] as const;

export function hasHfContext(ctx: RuleContext): boolean {
  return Boolean(ctx.patient.selectedModules?.includes('hf') || hasCondition(ctx, 'hf'));
}

export function getCustomInput(ctx: RuleContext, key: string): unknown {
  return ctx.normalized?.customInputs?.[key] ?? ctx.patient?.customInputs?.[key];
}

export function getCurrentMeds(ctx: RuleContext): CurrentMed[] {
  return ctx.normalized?.currentMeds ?? ctx.patient?.currentMeds ?? [];
}

function medExpandedSet(med: CurrentMed): Set<string> {
  const out = new Set<string>();
  for (const id of getExpandedDrugIds(med.drugId || '')) out.add(id.toLowerCase());
  if (med.name) {
    for (const id of getExpandedDrugIds(med.name)) out.add(id.toLowerCase());
  }
  return out;
}

export function findCurrentMed(ctx: RuleContext, drugIds: readonly string[]): CurrentMed | undefined {
  const targets = drugIds.map((id) => id.toLowerCase());
  return getCurrentMeds(ctx).find((m) => {
    const exp = medExpandedSet(m);
    return targets.some((t) => exp.has(t));
  });
}

export function findAllCurrentMeds(ctx: RuleContext, drugIds: readonly string[]): CurrentMed[] {
  const targets = drugIds.map((id) => id.toLowerCase());
  return getCurrentMeds(ctx).filter((m) => {
    const exp = medExpandedSet(m);
    return targets.some((t) => exp.has(t));
  });
}

export function resolveMatchedComponentId(med: CurrentMed | undefined, drugIds: readonly string[]): string | undefined {
  if (!med) return undefined;
  const exp = medExpandedSet(med);
  for (const candidate of drugIds) {
    if (exp.has(candidate.toLowerCase())) return candidate.toLowerCase();
  }
  return resolveKbDrugId(med.drugId);
}

export function isCombinationMed(med: CurrentMed | undefined): boolean {
  if (!med) return false;
  if (med.drugId.toLowerCase() === 'sacubitril_valsartan') return false;
  return (
    isFdcDrug(med.drugId) ||
    expandDrugComponents(med.drugId).length > 1 ||
    (Boolean(med.name) && expandDrugComponents(med.name || '').length > 1)
  );
}

export function getDrugDisplayVi(drugId: string, fallbackMed?: CurrentMed): string {
  const clean = resolveKbDrugId(drugId);
  if (hasDrug(clean)) return drug(clean).nameVi;
  if (hasDrug(drugId)) return drug(drugId).nameVi;
  return fallbackMed?.name || drugId;
}

export function formatHfDose(d: Dose | string | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const parts: string[] = [`${d.amount} ${d.unit}`];
  if (d.frequency) {
    const cleanFreq = d.frequency.replace(/^x\s+/i, '').trim();
    parts.push(`x ${cleanFreq}`);
  }
  if (d.route) {
    parts.push(`(${d.route})`);
  }
  return parts.join(' ');
}

export function formatCurrentMedDoseVi(med: CurrentMed | undefined, fallbackTargetId?: string): string | undefined {
  if (!med) return fallbackTargetId ? formatHfDose(dose(fallbackTargetId, 'target')) : undefined;
  const rawDose = med.dose;
  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  if (typeof rawDose === 'string' && rawDose.trim() !== '') {
    const dStr = rawDose.trim();
    if (/\b(lần|bid|tid|qd|od|ngày)\b/i.test(dStr)) {
      return med.unit && !dStr.toLowerCase().includes(med.unit.toLowerCase()) ? `${dStr} ${med.unit}` : dStr;
    }
    const withUnit = med.unit && !dStr.toLowerCase().includes(med.unit.toLowerCase()) ? `${dStr} ${med.unit}` : dStr;
    return rawFreq ? `${withUnit} (${rawFreq})` : withUnit;
  }
  if (typeof rawDose === 'number' && Number.isFinite(rawDose) && rawDose > 0) {
    const u = med.unit || 'mg';
    if (/^(viên|vien|tab|tablet)$/i.test(u)) {
      return fallbackTargetId ? formatHfDose(dose(fallbackTargetId, 'start')) : undefined;
    }
    return rawFreq ? `${rawDose} ${u} (${rawFreq})` : `${rawDose} ${u}`;
  }
  return fallbackTargetId ? formatHfDose(dose(fallbackTargetId, 'start')) : undefined;
}

function parseFreqMultiplier(med: CurrentMed): number {
  const raw = `${med.freq || ''} ${typeof med.dose === 'string' ? med.dose : ''}`.toLowerCase();
  if (/\b(3\s*lần|tid|x\s*3)\b/.test(raw)) return 3;
  if (/\b(2\s*lần|bid|x\s*2)\b/.test(raw)) return 2;
  if (/\b(1\s*lần|od|qd|x\s*1)\b/.test(raw)) return 1;
  if (/\bcách\s*ngày\b/.test(raw)) return 0.5;
  return 1;
}

export function parseHfDailyDoseMg(med: CurrentMed | undefined, componentId?: string): number | undefined {
  if (!med) return undefined;
  const resolved = (componentId || resolveKbDrugId(med.drugId)).toLowerCase();
  if (resolved === 'sacubitril_valsartan') {
    const combined = `${typeof med.dose === 'string' ? med.dose : ''} ${med.name || ''}`;
    const explicitOnce = /\b(1\s*lần|od|qd|x\s*1)\b/i.test(`${med.freq || ''} ${typeof med.dose === 'string' ? med.dose : ''}`);
    const mult = explicitOnce ? 1 : 2;
    if (/97\s*\/\s*103/.test(combined)) return 200 * mult;
    if (/49\s*\/\s*51/.test(combined)) return 100 * mult;
    if (/24\s*\/\s*26/.test(combined)) return 50 * mult;
    const single = parseDailyDoseMg(med);
    if (single !== undefined) return single;
    if (typeof med.dose === 'number' && (!med.unit || med.unit.toLowerCase() === 'mg')) {
      return med.dose * parseFreqMultiplier(med);
    }
    return undefined;
  }
  if (isCombinationMed(med) && componentId) {
    return parseComponentDailyDoseMg(med, componentId);
  }
  return parseDailyDoseMg(med);
}

export function getTargetDailyDoseMg(ctx: RuleContext, drugId: string): number | undefined {
  const id = resolveKbDrugId(drugId);
  if (id === 'sacubitril_valsartan') return 400; // 97/103 mg (=200 mg) x 2 lần/ngày
  if (id === 'bisoprolol' || id === 'nebivolol' || id === 'dapagliflozin' || id === 'empagliflozin' || id === 'vericiguat') {
    return 10;
  }
  if (id === 'metoprolol_succinate') return 200;
  if (id === 'carvedilol') {
    const weight = need(ctx, 'weight');
    if (weight !== undefined && weight > thFor('weight', 'hf.bb.carvedilol_weight_high_dose')) {
      return 100; // 50 mg x 2 lần/ngày
    }
    return 50; // 25 mg x 2 lần/ngày
  }
  if (id === 'spironolactone' || id === 'eplerenone') {
    const egfr = need(ctx, 'egfr');
    if (egfr !== undefined && egfr < thFor('egfr', 'hf.mra.egfr_caution')) {
      return thFor('dose_mg', 'hf.mra.spironolactone_g3_alt_day_dose_mg');
    }
    if (id === 'eplerenone' && Boolean(findCurrentMed(ctx, MODERATE_CYP3A4_IDS))) {
      return thFor('dose_mg', 'hf.eplerenone.mod_cyp3a4_max_mg');
    }
    return 50;
  }
  if (id === 'finerenone') {
    const egfr = need(ctx, 'egfr');
    if (egfr !== undefined && egfr >= thFor('egfr', 'hf.finerenone.egfr_high_dose_cutoff')) {
      return thFor('dose_mg', 'hf.finerenone.target_high_dose_mg');
    }
    return thFor('dose_mg', 'hf.finerenone.start_high_or_target_low_dose_mg');
  }
  if (id === 'ivabradine') return 15; // 7.5 mg x 2 lần/ngày
  return undefined;
}

export function isAtOrAboveTargetDose(ctx: RuleContext, med: CurrentMed | undefined, componentId?: string): boolean {
  if (!med) return false;
  const id = componentId || resolveKbDrugId(med.drugId);
  const daily = parseHfDailyDoseMg(med, id);
  const target = getTargetDailyDoseMg(ctx, id);
  if (daily === undefined || target === undefined) return false;
  return daily >= target;
}

export function isLowDosePriorRasi(med: CurrentMed | undefined, componentId?: string): boolean {
  if (!med) return true;
  const id = (componentId || resolveKbDrugId(med.drugId)).toLowerCase();
  const daily = parseHfDailyDoseMg(med, id);
  if (daily === undefined) return true; // Fail-closed sang 24/26 mg BID nếu không rõ hàm lượng
  if (id === 'enalapril' || id === 'lisinopril') return daily <= 10;
  if (id === 'ramipril') return daily <= 5;
  if (id === 'perindopril') return daily <= 4;
  if (id === 'captopril') return daily <= 75;
  if (id === 'valsartan') return daily < 160;
  if (id === 'losartan') return daily <= 50;
  if (id === 'candesartan') return daily <= 16;
  if (id === 'telmisartan') return daily <= 40;
  if (id === 'irbesartan') return daily <= 150;
  return false;
}

export function getHfPhenotype(ctx: RuleContext): HfPhenotype {
  const lvef = need(ctx, 'lvef');
  if (lvef === undefined) return 'unknown';

  const priorLvef = need(ctx, 'priorLvef');
  const rawPheno = String(getCustomInput(ctx, 'hfPhenotype') ?? '').trim().toLowerCase();
  const efHFrEF = thFor('lvef', 'hf.ef.hfref_max');
  const efImpMin = thFor('lvef', 'hf.ef.hfimpef_min');
  const efImpDelta = thFor('lvef', 'hf.ef.hfimpef_min_delta');

  if (lvef <= efHFrEF) return 'hfref';
  if (
    lvef > efImpMin &&
    (rawPheno === 'hfimpef' ||
      (priorLvef !== undefined && priorLvef <= efHFrEF && lvef - priorLvef >= efImpDelta))
  ) {
    return 'hfimpef';
  }
  if (ctx.settings.profile === 'INTL' && lvef < thFor('lvef', 'hf.ef.hfref_max_esc2026')) {
    return 'hfref';
  }
  if (lvef <= thFor('lvef', 'hf.ef.hfmref_max')) return 'hfmref';
  return 'hfpef';
}

export function isPregnant(ctx: RuleContext): boolean {
  return hasCondition(ctx, 'pregnant');
}

export function isLactating(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'breastfeeding') ||
      getCustomInput(ctx, 'lactating') === true ||
      getCustomInput(ctx, 'breastfeeding') === true
  );
}

export function isOnDialysis(ctx: RuleContext): boolean {
  return hasCondition(ctx, 'onDialysis');
}

export function hasExtraCondition(ctx: RuleContext, key: string): boolean {
  const rawCond = (ctx.patient?.conditions || {}) as Record<string, unknown>;
  return Boolean(rawCond[key] === true || getCustomInput(ctx, key) === true);
}

export function getChildPugh(ctx: RuleContext): ChildPughGrade | undefined {
  const raw = String(
    getCustomInput(ctx, 'childPugh') ?? (ctx.patient as unknown as Record<string, unknown>)?.childPugh ?? ''
  )
    .trim()
    .toUpperCase();
  if (raw === 'A' || raw === 'B' || raw === 'C') return raw;
  if (hasCondition(ctx, 'decompensatedCirrhosis') || hasExtraCondition(ctx, 'severeLiverDisease')) return 'C';
  if (hasCondition(ctx, 'cirrhosis') || hasCondition(ctx, 'liverDisease')) return 'B';
  return undefined;
}

export function hasAcuteKidneyInjury(ctx: RuleContext): boolean {
  return Boolean(hasCondition(ctx, 'aki') || detectAcuteAki(ctx.normalized).isAki);
}

export function hasStableAsthmaHistory(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'asthma') ||
      hasCondition(ctx, 'priorAsthma') ||
      ctx.patient.selectedModules?.includes('asthma')
  );
}

export function hasAcuteBronchospasm(ctx: RuleContext): boolean {
  const respAfter1h = String(getCustomInput(ctx, 'acuteResponseAfter1h') ?? '').trim().toLowerCase();
  if (respAfter1h === 'good_response') return false;
  const speech = String(getCustomInput(ctx, 'speechAbility') ?? '').trim().toLowerCase();
  return Boolean(
    hasExtraCondition(ctx, 'acuteAsthmaExacerbation') ||
      getCustomInput(ctx, 'isAcuteExacerbation') === true ||
      getCustomInput(ctx, 'acuteBronchospasm') === true ||
      speech === 'words' ||
      speech === 'phrases' ||
      speech === 'unable' ||
      hasAcuteBronchospasmOrRespFailure(ctx.normalized)
  );
}

export function hasPriorAngioedema(ctx: RuleContext): boolean {
  const rawCond = (ctx.patient?.conditions || {}) as Record<string, unknown>;
  return Boolean(
    hasCondition(ctx, 'priorAngioedema') ||
      rawCond.angioedemaHistory === true ||
      rawCond.aceiAngioedema === true ||
      rawCond.historyAngioedema === true ||
      getCustomInput(ctx, 'priorAngioedema') === true ||
      getCustomInput(ctx, 'angioedemaHistory') === true
  );
}

export function hasRasiAllergy(ctx: RuleContext): boolean {
  if (hasCondition(ctx, 'allergyAceiArb')) return true;
  const list = (ctx.normalized?.allergies ?? ctx.patient?.allergies ?? []).map((a) => a.toLowerCase());
  const keys = [
    'sacubitril', 'valsartan', 'entresto', 'arni', 'acei', 'arb',
    ...ACEI_IDS, ...ARB_IDS,
  ];
  return list.some((a) => keys.some((k) => a.includes(k)));
}

export function hasDrugAllergy(ctx: RuleContext, keywords: readonly string[]): boolean {
  const list = (ctx.normalized?.allergies ?? ctx.patient?.allergies ?? []).map((a) => a.toLowerCase());
  return list.some((a) => keywords.some((k) => a.includes(k.toLowerCase())));
}

export function hasUnpacedConductionBlock(ctx: RuleContext): boolean {
  const paced = hasCondition(ctx, 'pacemaker') || ctx.patient.rhythm === 'paced' || getCustomInput(ctx, 'hasPacemaker') === true;
  if (paced) return false;
  const rawBlock = String(getCustomInput(ctx, 'conductionBlock') ?? '').toLowerCase();
  return Boolean(
    hasCondition(ctx, 'avBlock2Or3') ||
      hasCondition(ctx, 'sickSinusSyndrome') ||
      rawBlock === 'av_block_2_3' ||
      rawBlock === 'sss_no_pacemaker'
  );
}

export function hasType1Diabetes(ctx: RuleContext): boolean {
  const dmType = String(getCustomInput(ctx, 'dmType') ?? '').toLowerCase();
  const rawCond = (ctx.patient?.conditions || {}) as Record<string, unknown>;
  return Boolean(dmType === 't1dm' || dmType === 'type1' || rawCond.t1dm === true);
}

export function getCongestionStatus(ctx: RuleContext): CongestionLevel | undefined {
  const raw = String(getCustomInput(ctx, 'congestion') ?? '').toLowerCase();
  if (raw === 'euvolaemic' || raw === 'mild' || raw === 'overt') return raw;
  return undefined;
}

export function isShockOrInotrope(ctx: RuleContext): boolean {
  if (isCardiogenicShockOrVasopressor(ctx.normalized)) return true;
  if (Boolean(getCustomInput(ctx, 'cardiogenicShock') || getCustomInput(ctx, 'onInotropes'))) return true;
  const sbp = need(ctx, 'sbp');
  return sbp !== undefined && sbp < thFor('sbp', 'hf.acute.shock_sbp');
}

export function isAcutelyDecompensated(ctx: RuleContext): boolean {
  const congestion = getCongestionStatus(ctx);
  if (hasCondition(ctx, 'acutePulmonaryEdema') || isShockOrInotrope(ctx)) return true;
  if (ctx.settings.setting === 'inpatient' && congestion === 'overt') return true;
  return false;
}

export function isOutpatientDecompensatedCrisis(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'outpatient') return false;
  if (isShockOrInotrope(ctx) || hasCondition(ctx, 'acutePulmonaryEdema')) return true;
  const nyha = need(ctx, 'nyha');
  return nyha === 4 && getCongestionStatus(ctx) === 'overt';
}

export function hasBackgroundFmt(ctx: RuleContext): boolean {
  if (Boolean(getCustomInput(ctx, 'onOptimalFmt') || getCustomInput(ctx, 'fmtIntolerant'))) return true;
  const anyRasi = Boolean(findCurrentMed(ctx, ['sacubitril_valsartan', ...ACEI_IDS, ...ARB_IDS]));
  const anyBb = Boolean(findCurrentMed(ctx, HF_BB_IDS));
  const anyMra = Boolean(findCurrentMed(ctx, ALL_MRA_IDS));
  const anySglt2 = Boolean(findCurrentMed(ctx, SGLT2I_IDS));
  return anyRasi || anyBb || anyMra || anySglt2;
}
