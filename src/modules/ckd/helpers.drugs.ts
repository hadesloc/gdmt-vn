/**
 * GDMT-VN CKD Module - Drug Classification Sets, FDC Decomposition & Formatting
 * Phân quyền: Agent E (Round 4 Remediation - FDC-aware via fdcMap & < 20 KB Modularization)
 */

import type { CurrentMed, RuleContext } from '../../engine/types';
import type { Dose, DrugEntry } from '../../kb-types';
import { drug, hasDrug } from '../../kb-types/access';
import {
  expandDrugComponents,
  isFdcDrug,
  resolveCanonicalDrugId,
} from '../../engine/safety/fdcMap';

export const OWNED_CKD_DRUGS = [
  'dapagliflozin',
  'empagliflozin',
  'canagliflozin',
  'enalapril',
  'perindopril',
  'lisinopril',
  'ramipril',
  'captopril',
  'losartan',
  'valsartan',
  'telmisartan',
  'irbesartan',
  'candesartan',
  'finerenone',
  'patiromer',
  'sodium_zirconium_cyclosilicate',
  'calcium_polystyrene_sulfonate',
  'sodium_bicarbonate',
] as const;

export const SGLT2I_DRUG_IDS = ['dapagliflozin', 'empagliflozin', 'canagliflozin'] as const;
export const ACEI_DRUG_IDS = ['enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril'] as const;
export const ARB_DRUG_IDS = ['losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan'] as const;
export const RASI_DRUG_IDS = [...ACEI_DRUG_IDS, ...ARB_DRUG_IDS] as const;
export const ARNI_DRUG_IDS = ['sacubitril_valsartan'] as const;
export const DRI_DRUG_IDS = ['aliskiren'] as const;
export const LACTATION_SAFE_ACEI_IDS = ['enalapril', 'captopril'] as const;
export const STEROIDAL_MRA_IDS = ['spironolactone', 'eplerenone'] as const;
export const K_SPARING_DIURETIC_IDS = ['amiloride', 'triamterene'] as const;
export const KBINDER_DRUG_IDS = [
  'patiromer',
  'sodium_zirconium_cyclosilicate',
  'calcium_polystyrene_sulfonate',
] as const;
export const GLP1RA_DRUG_IDS = [
  'semaglutide',
  'liraglutide',
  'dulaglutide',
  'exenatide',
  'lixisenatide',
  'tirzepatide',
] as const;
export const STATIN_DRUG_IDS = [
  'atorvastatin',
  'rosuvastatin',
  'simvastatin',
  'pravastatin',
  'pitavastatin',
  'fluvastatin',
  'lovastatin',
] as const;
export const INPATIENT_DIURETIC_IDS = [
  'furosemide',
  'torasemide',
  'bumetanide',
  'hydrochlorothiazide',
  'indapamide',
  'chlorthalidone',
  'metolazone',
] as const;
export const MODERATE_WEAK_CYP3A4_INHIBITOR_IDS = [
  'diltiazem',
  'verapamil',
  'erythromycin',
  'fluconazole',
  'amiodarone',
  'fluvoxamine',
  'cimetidine',
] as const;
export const STATIN_CONTRA_DDI_IDS = ['gemfibrozil', 'cyclosporine'] as const;

export const SGLT2I_SET = new Set<string>([...SGLT2I_DRUG_IDS, 'ertugliflozin', 'sotagliflozin']);
export const ACEI_SET = new Set<string>([
  ...ACEI_DRUG_IDS,
  'benazepril',
  'quinapril',
  'fosinopril',
  'trandolapril',
  'imidapril',
]);
export const ARB_SET = new Set<string>([...ARB_DRUG_IDS, 'olmesartan', 'azilsartan']);
export const RASI_SET = new Set<string>([...ACEI_SET, ...ARB_SET]);
const DRI_SET = new Set<string>(DRI_DRUG_IDS);
const STEROIDAL_OR_KSPARING_SET = new Set<string>([...STEROIDAL_MRA_IDS, ...K_SPARING_DIURETIC_IDS]);
const KBINDER_SET = new Set<string>([...KBINDER_DRUG_IDS, 'sodium_polystyrene_sulfonate']);
export const STATIN_SET = new Set<string>(STATIN_DRUG_IDS);
const GLP1RA_SET = new Set<string>([...GLP1RA_DRUG_IDS, 'semaglutide_oral']);
const DPP4I_SET = new Set<string>(['sitagliptin', 'linagliptin', 'vildagliptin', 'saxagliptin', 'alogliptin']);
const DIURETIC_SET = new Set<string>([...INPATIENT_DIURETIC_IDS, 'torsemide']);
const MOD_WEAK_CYP3A4_SET = new Set<string>(MODERATE_WEAK_CYP3A4_INHIBITOR_IDS);
export const NSAID_FALLBACK_IDS = new Set<string>([
  'ibuprofen',
  'naproxen',
  'diclofenac',
  'meloxicam',
  'celecoxib',
  'etoricoxib',
  'indomethacin',
  'piroxicam',
  'ketoprofen',
  'ketorolac',
  'mefenamic_acid',
  'nimesulide',
  'tenoxicam',
  'aspirin_high_dose',
]);
const SU_SET = new Set<string>([
  'gliclazide',
  'gliclazide_mr',
  'glimepiride',
  'glibenclamide',
  'glyburide',
  'glipizide',
]);
const INSULIN_SET = new Set<string>([
  'insulin',
  'insulin_glargine',
  'insulin_detemir',
  'insulin_degludec',
  'insulin_nph',
  'insulin_aspart',
  'insulin_lispro',
  'insulin_premix',
  'insulin_regular',
]);

const DRUG_ALIASES: Record<string, string> = {
  torsemide: 'torasemide',
  kalimate: 'calcium_polystyrene_sulfonate',
  kayexalate: 'calcium_polystyrene_sulfonate',
  sodium_polystyrene_sulfonate: 'calcium_polystyrene_sulfonate',
  lokelma: 'sodium_zirconium_cyclosilicate',
  veltassa: 'patiromer',
  kerendia: 'finerenone',
};

export function getDrugSafe(rawId: string | undefined): DrugEntry | undefined {
  if (!rawId) return undefined;
  if (hasDrug(rawId)) return drug(rawId);
  const canon = resolveCanonicalDrugId(rawId);
  return hasDrug(canon) ? drug(canon) : undefined;
}

export function normalizeDrugId(rawId: string | undefined): string {
  if (!rawId) return '';
  const clean = rawId.trim().toLowerCase();
  if (DRUG_ALIASES[clean]) return DRUG_ALIASES[clean];
  const canon = resolveCanonicalDrugId(clean);
  return DRUG_ALIASES[canon] ?? canon;
}

export function getMedComponents(medOrId: CurrentMed | string | undefined): string[] {
  if (!medOrId) return [];
  if (typeof medOrId === 'string') {
    const comps = expandDrugComponents(medOrId).map((c) => normalizeDrugId(c)).filter(Boolean);
    return comps.length > 0 ? comps : [normalizeDrugId(medOrId)].filter(Boolean);
  }
  const byId = expandDrugComponents(medOrId.drugId).map((c) => normalizeDrugId(c)).filter(Boolean);
  if (byId.length > 1) return byId;
  if (medOrId.name) {
    const byName = expandDrugComponents(medOrId.name).map((c) => normalizeDrugId(c)).filter(Boolean);
    if (byName.length > 1) return byName;
  }
  return byId.length > 0 ? byId : [normalizeDrugId(medOrId.drugId)].filter(Boolean);
}

export function isFdcMed(med: CurrentMed | undefined): boolean {
  if (!med) return false;
  return isFdcDrug(med.drugId) || Boolean(med.name && isFdcDrug(med.name)) || getMedComponents(med).length > 1;
}

export function extractMatchingComponent(
  med: CurrentMed | undefined,
  predicate: (compId: string) => boolean
): string | undefined {
  if (!med) return undefined;
  return getMedComponents(med).find(predicate);
}

export function fmtDose(d: Dose | string | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const parts = [`${d.amount} ${d.unit}`];
  if (d.frequency) parts.push(d.frequency);
  if (d.route) parts.push(`(${d.route})`);
  if (d.description) parts.push(`— ${d.description}`);
  return parts.join(' ');
}

export function fmtShortDose(d: Dose | string | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const parts = [`${d.amount} ${d.unit}`];
  if (d.frequency) parts.push(d.frequency);
  return parts.join(' ');
}

export function formatCurrentMedDose(med: CurrentMed | undefined, fallbackUnit = 'mg/ngày'): string {
  if (!med || med.dose === undefined || med.dose === null) return '';
  const raw = String(med.dose).trim();
  if (!raw) return '';
  const freqStr = med.freq ? med.freq.trim() : '';
  if (/[a-zA-Zµμ/]/.test(raw)) {
    const hasEmbeddedFreq = /(\bx\b|×|lần|ngày|tuần|giờ|\bbid\b|\btid\b|\bqid\b|\bqd\b|\bq\d+h\b|cách\s*ngày)/i.test(raw);
    return freqStr && !hasEmbeddedFreq ? `${raw} (${freqStr})` : raw;
  }
  if (med.unit && med.unit.trim()) {
    const u = med.unit.trim();
    if (u.includes('/')) return `${raw} ${u}`;
    if (freqStr) return `${raw} ${u} (${freqStr})`;
    return `${raw} ${u}/ngày`;
  }
  return freqStr ? `${raw} mg (${freqStr})` : `${raw} ${fallbackUnit}`;
}

export function medDisplayName(med: CurrentMed): string {
  if (med.name && med.name.trim()) return med.name.trim();
  const norm = normalizeDrugId(med.drugId);
  const kbEntry = getDrugSafe(norm) ?? getDrugSafe(med.drugId);
  if (kbEntry?.nameVi) return kbEntry.nameVi;
  return med.drugId;
}

export function isSglt2iMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => SGLT2I_SET.has(id) || getDrugSafe(id)?.class === 'SGLT2i');
}

export function extractSglt2iComponentId(med: CurrentMed | undefined): string | undefined {
  return extractMatchingComponent(med, (id) => SGLT2I_SET.has(id) || getDrugSafe(id)?.class === 'SGLT2i');
}

export function hasMetforminComponent(med: CurrentMed | undefined): boolean {
  if (!med) return false;
  return getMedComponents(med).some((id) => id === 'metformin');
}

export function isAceiMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => ACEI_SET.has(id) || getDrugSafe(id)?.class === 'ACEi');
}

export function isArbMed(med: CurrentMed): boolean {
  if (normalizeDrugId(med.drugId) === 'sacubitril_valsartan') return false;
  return getMedComponents(med).some((id) => ARB_SET.has(id) || getDrugSafe(id)?.class === 'ARB');
}

export function isArniMed(med: CurrentMed): boolean {
  const id = normalizeDrugId(med.drugId);
  return id === 'sacubitril_valsartan' || getDrugSafe(id)?.class === 'ARNI';
}

export function isDriMed(med: CurrentMed): boolean {
  return getMedComponents(med).some(
    (id) => DRI_SET.has(id) || Boolean(getDrugSafe(id)?.classes?.includes('renin_inhibitor'))
  );
}

export function isRasiOrArniMed(med: CurrentMed): boolean {
  return isAceiMed(med) || isArbMed(med) || isArniMed(med);
}

export function extractRasiComponentId(med: CurrentMed | undefined): string | undefined {
  return extractMatchingComponent(
    med,
    (id) => RASI_SET.has(id) || getDrugSafe(id)?.class === 'ACEi' || getDrugSafe(id)?.class === 'ARB'
  );
}

export function isKSparingOrSteroidalMraMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => {
    if (id === 'finerenone') return false;
    return STEROIDAL_OR_KSPARING_SET.has(id) || getDrugSafe(id)?.class === 'MRA';
  });
}

export function isKBinderMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => KBINDER_SET.has(id));
}

export function isLoopOrThiazideDiureticMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => {
    if (DIURETIC_SET.has(id)) return true;
    const cls = getDrugSafe(id)?.class?.toLowerCase() ?? '';
    return cls.includes('loop') || cls.includes('thiazide');
  });
}

export function isNsaidMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => {
    if (NSAID_FALLBACK_IDS.has(id)) return true;
    const kb = getDrugSafe(id);
    return kb?.class === 'NSAID' || Boolean(kb?.classes?.includes('nsaid'));
  });
}

export function isGlp1RaMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => {
    if (GLP1RA_SET.has(id)) return true;
    const kb = getDrugSafe(id);
    return kb?.class === 'GLP-1 RA' || Boolean(kb?.classes?.includes('glp1ra'));
  });
}

export function isDpp4iMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => {
    if (DPP4I_SET.has(id)) return true;
    const kb = getDrugSafe(id);
    return kb?.class === 'DPP-4i' || Boolean(kb?.classes?.includes('dpp4i'));
  });
}

export function isStatinMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => STATIN_SET.has(id) || getDrugSafe(id)?.class === 'Statin');
}

export function extractStatinComponentId(med: CurrentMed | undefined): string | undefined {
  return extractMatchingComponent(med, (id) => STATIN_SET.has(id) || getDrugSafe(id)?.class === 'Statin');
}

export function isModerateOrWeakCyp3a4InhibitorMed(med: CurrentMed): boolean {
  return getMedComponents(med).some((id) => MOD_WEAK_CYP3A4_SET.has(id));
}

export function isTakingHypoglycemiaRiskMed(ctx: RuleContext): boolean {
  return ctx.patient.currentMeds.some((m) =>
    getMedComponents(m).some((id) => {
      if (SU_SET.has(id) || INSULIN_SET.has(id) || id.startsWith('insulin')) return true;
      const cls = getDrugSafe(id)?.class?.toLowerCase() ?? '';
      return cls === 'su' || cls.includes('sulfonylurea') || cls.includes('insulin');
    })
  );
}
