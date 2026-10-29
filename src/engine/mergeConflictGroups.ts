/**
 * GDMT-VN Engine - Action Precedence, Conflict Group Definitions & Step-Up Comparators
 * Phân quyền: Agent B
 */

import type { Recommendation, Action, CurrentMed } from './types';
import { hasDrug, drug } from '../kb-types';
import {
  getNormalizedDrugClasses,
  isOphthalmicBetaBlocker,
  resolveKbDrugId,
  isGlp1OrGipDrug
} from './safety/drugClassify';
import { expandDrugComponents } from './safety/fdcMap';

export const ACTION_PRIORITY: Record<Action, number> = {
  AVOID: 100,
  STOP: 90,
  HOLD: 80,
  REDUCE: 70,
  SWITCH: 65,
  DEFER: 62,
  START: 60,
  UPTITRATE: 50,
  CONTINUE: 40,
  CONSIDER: 30,
  MONITOR: 10,
  REFER: 5
};

export function getEffectiveActionPriority(action: Action, isInCurrentMeds = false): number {
  if (isInCurrentMeds && action === 'STOP') {
    return 105; // CKD-R2-R3-12: Với thuốc BN đang uống, STOP (105) bắt buộc thắng AVOID (100)
  }
  return ACTION_PRIORITY[action] ?? 0;
}

export function resolveActionConflict(a1: Action, a2: Action, isInCurrentMeds = false): Action {
  return getEffectiveActionPriority(a1, isInCurrentMeds) >= getEffectiveActionPriority(a2, isInCurrentMeds)
    ? a1
    : a2;
}

export function formatCurrentMedDose(med?: CurrentMed, fallbackId?: string): string | undefined {
  if (!med || med.dose === undefined || med.dose === null) return undefined;
  const raw = String(med.dose).trim();
  if (!raw) return undefined;

  const isPureNumeric = /^\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?$/.test(raw);
  let unitStr = med.unit?.trim();
  if (!unitStr && isPureNumeric) {
    const id = resolveKbDrugId(med.drugId || fallbackId || '');
    if (id && hasDrug(id)) {
      const kbEntry = drug(id);
      const startObj = typeof kbEntry.start === 'object' && kbEntry.start ? kbEntry.start : undefined;
      if (startObj?.unit) unitStr = startObj.unit.trim();
    }
    if (!unitStr) unitStr = 'mg';
  }

  if (isPureNumeric && unitStr) {
    return `${raw} ${unitStr}`;
  }
  if (unitStr && !raw.toLowerCase().includes(unitStr.toLowerCase())) {
    return `${raw} ${unitStr}`;
  }
  return raw;
}

export function extractNormalizedDoseMg(doseText?: string | number, explicitUnit?: string): number | undefined {
  if (doseText === undefined || doseText === null) return undefined;
  const raw = String(doseText).trim();
  if (!raw) return undefined;
  const match = raw.match(/(\d+(?:\.\d+)?)\s*(mcg|µg|ug|mg|g)\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isFinite(val)) return undefined;
    if (unit === 'mcg' || unit === 'µg' || unit === 'ug') return val / 1000;
    if (unit === 'g') return val * 1000;
    return val;
  }
  const numOnly = raw.match(/(\d+(?:\.\d+)?)/);
  if (numOnly) {
    const val = parseFloat(numOnly[1]);
    if (!Number.isFinite(val)) return undefined;
    const u = (explicitUnit || '').trim().toLowerCase();
    if (u === 'mcg' || u === 'µg' || u === 'ug') return val / 1000;
    if (u === 'g') return val * 1000;
    return val;
  }
  return undefined;
}

export function isAcuteOrEscalatedStart(rec: Recommendation, curMed?: CurrentMed): boolean {
  const combinedText = `${rec.tier || ''} ${rec.title || ''} ${rec.dose || ''}`;
  if (
    /khí dung|nebuli|cấp cứu|đợt cấp|cắt cơn|cơn gút cấp|liều nạp|tĩnh mạch|\biv\b|\btm\b|tiêm truyền/i.test(
      combinedText
    )
  ) {
    return Boolean(rec.dose && rec.dose.trim());
  }
  if (rec.dose && rec.dose.trim()) {
    const recMg = extractNormalizedDoseMg(rec.dose);
    const curMg = extractNormalizedDoseMg(curMed?.dose, curMed?.unit);
    if (recMg !== undefined && curMg !== undefined && recMg > curMg) {
      return true;
    }
    if (
      /hiệu chỉnh|chỉnh liều|suy thận|giảm liều|tối đa/i.test(`${rec.dose} ${rec.title}`) &&
      (curMg === undefined || (recMg !== undefined && curMg > recMg))
    ) {
      return true;
    }
  }
  return false;
}

export function resolveMedDisplayName(med?: CurrentMed, fallbackId?: string): string {
  if (med?.name && med.name.trim()) return med.name.trim();
  const id = resolveKbDrugId(med?.drugId || fallbackId || '');
  if (id && hasDrug(id)) {
    const kbEntry = drug(id) as unknown as {
      nameVi?: string;
      inn?: string;
      genericVi?: string;
      generic?: string;
    };
    const resolved = kbEntry.nameVi || kbEntry.genericVi || kbEntry.inn || kbEntry.generic;
    if (resolved && resolved.trim()) return resolved.trim();
  }
  return med?.drugId || fallbackId || 'Thuốc đang dùng';
}

export function resolveRecDrugDisplayName(r: Recommendation): string {
  if (r.drugNameVi && r.drugNameVi.trim()) return r.drugNameVi.trim();
  const id = resolveKbDrugId(r.drugId || '');
  if (id && hasDrug(id)) {
    const kbEntry = drug(id);
    if (kbEntry.nameVi) return kbEntry.nameVi;
    if (kbEntry.inn) return kbEntry.inn;
  }
  return r.title;
}

const ACEI_IDS_SET = new Set([
  'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
  'benazepril', 'fosinopril', 'trandolapril', 'quinapril', 'moexipril'
]);

export function isAceiDrug(drugId: string): boolean {
  const id = (drugId || '').trim().toLowerCase();
  if (!id) return false;
  if (ACEI_IDS_SET.has(id) || getNormalizedDrugClasses(id).has('acei')) return true;
  return expandDrugComponents(id).some(
    (comp) => ACEI_IDS_SET.has(comp) || getNormalizedDrugClasses(comp).has('acei')
  );
}

export function buildAceiArniWashoutNote(oldDrugId: string, newDrugId: string): string {
  const oldLower = oldDrugId.toLowerCase();
  const newLower = newDrugId.toLowerCase();
  const newCanon = resolveKbDrugId(newLower);
  const oldCanon = resolveKbDrugId(oldLower);
  if (newCanon === 'sacubitril_valsartan' && isAceiDrug(oldLower)) {
    return ' BẮT BUỘC NGỪNG ACEi (kể cả viên phối hợp chứa ACEi) ÍT NHẤT 36 GIỜ (washout 36h) trước khi uống liều Sacubitril/Valsartan đầu tiên để tránh phù mạch thanh quản tử vong!';
  }
  if (oldCanon === 'sacubitril_valsartan' && isAceiDrug(newLower)) {
    return ' BẮT BUỘC NGỪNG Sacubitril/Valsartan ÍT NHẤT 36 GIỜ (washout 36h) trước khi uống liều ACEi đầu tiên để tránh phù mạch thanh quản tử vong!';
  }
  return '';
}

export interface ClassConflictGroup {
  id: string;
  nameVi: string;
  classes: string[];
  drugIds: string[];
}

export const CLASS_CONFLICT_GROUPS: Record<string, ClassConflictGroup> = {
  rasi_arni: {
    id: 'rasi_arni',
    nameVi: 'Ức chế hệ RAA (ACEi / ARB / ARNI / Aliskiren)',
    classes: ['acei', 'arb', 'arni', 'rasi', 'renin_inhibitor'],
    drugIds: [
      'sacubitril_valsartan', 'aliskiren',
      'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
      'benazepril', 'fosinopril', 'trandolapril', 'quinapril', 'moexipril',
      'losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan',
      'olmesartan', 'azilsartan'
    ]
  },
  mra: {
    id: 'mra',
    nameVi: 'Đối kháng thụ thể Mineralocorticoid (MRA)',
    classes: ['mra', 'mra_steroidal', 'mra_nonsteroidal'],
    drugIds: ['spironolactone', 'eplerenone', 'finerenone']
  },
  anticoagulants: {
    id: 'anticoagulants',
    nameVi: 'Thuốc chống đông đường uống (OAC)',
    classes: ['doac', 'vka', 'oac'],
    drugIds: ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'acenocoumarol']
  },
  incretins: {
    id: 'incretins',
    nameVi: 'Thuốc tác động trục Incretin (DPP-4i & GLP-1 RA)',
    classes: ['dpp4i', 'glp1ra'],
    drugIds: [
      'sitagliptin', 'linagliptin', 'vildagliptin', 'saxagliptin', 'alogliptin',
      'semaglutide', 'semaglutide_oral', 'dulaglutide', 'liraglutide', 'lixisenatide', 'exenatide', 'tirzepatide',
      'insulin_glargine_lixisenatide', 'insulin_degludec_liraglutide'
    ]
  },
  sglt2i: {
    id: 'sglt2i',
    nameVi: 'Ức chế SGLT2 (SGLT2i)',
    classes: ['sglt2i'],
    drugIds: [
      'dapagliflozin', 'empagliflozin', 'canagliflozin', 'ertugliflozin', 'sotagliflozin',
      'empagliflozin_metformin', 'dapagliflozin_metformin', 'canagliflozin_metformin', 'ertugliflozin_metformin'
    ]
  },
  su: {
    id: 'su',
    nameVi: 'Nhóm Sulfonylurea / Meglitinide',
    classes: ['su', 'sulfonylurea', 'meglitinide'],
    drugIds: [
      'gliclazide', 'glimepiride', 'glibenclamide', 'glyburide', 'glipizide',
      'chlorpropamide', 'tolbutamide', 'repaglinide', 'nateglinide', 'mitiglinide',
      'gliclazide_metformin', 'glimepiride_metformin', 'glibenclamide_metformin', 'glyburide_metformin'
    ]
  },
  beta_blockers: {
    id: 'beta_blockers',
    nameVi: 'Chẹn beta giao cảm',
    classes: ['beta_blocker', 'bb_selective', 'bb_nonselective'],
    drugIds: [
      'bisoprolol', 'carvedilol', 'metoprolol_succinate', 'metoprolol_tartrate', 'metoprolol',
      'nebivolol', 'atenolol', 'propranolol', 'nadolol', 'timolol', 'labetalol',
      'celiprolol', 'betaxolol', 'acebutolol', 'pindolol', 'esmolol'
    ]
  },
  statins: {
    id: 'statins',
    nameVi: 'Thuốc nhóm Statin',
    classes: ['statin'],
    drugIds: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'pitavastatin', 'fluvastatin', 'lovastatin']
  },
  pcsk9: {
    id: 'pcsk9',
    nameVi: 'Thuốc nhắm đích PCSK9',
    classes: ['pcsk9', 'pcsk9i'],
    drugIds: ['evolocumab', 'alirocumab', 'inclisiran']
  },
  fibrates: {
    id: 'fibrates',
    nameVi: 'Thuốc nhóm Fibrate',
    classes: ['fibrate'],
    drugIds: ['fenofibrate', 'gemfibrozil', 'bezafibrate', 'ciprofibrate']
  },
  basal_insulins: {
    id: 'basal_insulins',
    nameVi: 'Insulin nền tác dụng kéo dài (Long-acting Basal Insulin)',
    classes: [],
    drugIds: [
      'glargine', 'insulin_glargine',
      'degludec', 'insulin_degludec',
      'detemir', 'insulin_detemir',
      'toujeo', 'lantus', 'tresiba', 'levemir'
    ]
  },
  xoi: {
    id: 'xoi',
    nameVi: 'Thuốc ức chế Xanthine Oxidase (XOI)',
    classes: ['xoi'],
    drugIds: ['allopurinol', 'febuxostat']
  },
  uricosuric: {
    id: 'uricosuric',
    nameVi: 'Thuốc tăng thải acid uric (Uricosuric)',
    classes: ['uricosuric'],
    drugIds: ['probenecid', 'benzbromarone', 'lesinurad']
  },
  nsaid: {
    id: 'nsaid',
    nameVi: 'Thuốc kháng viêm không steroid (NSAID)',
    classes: ['nsaid'],
    drugIds: [
      'naproxen', 'ibuprofen', 'diclofenac', 'indomethacin', 'meloxicam',
      'piroxicam', 'tenoxicam', 'celecoxib', 'etoricoxib', 'ketorolac',
      'etodolac', 'dexketoprofen', 'parecoxib'
    ]
  },
  respiratory_biologics: {
    id: 'respiratory_biologics',
    nameVi: 'Thuốc sinh học đường hô hấp',
    classes: ['respiratory_biologic', 'biologic_asthma', 'biologic_anti_il4ra', 'biologic_anti_il5'],
    drugIds: ['dupilumab', 'mepolizumab', 'benralizumab', 'omalizumab', 'tezepelumab']
  },
  systemic_steroid: {
    id: 'systemic_steroid',
    nameVi: 'Corticosteroid đường toàn thân',
    classes: ['systemic_corticosteroid', 'systemic_steroid'],
    drugIds: ['prednisolone', 'methylprednisolone', 'prednisone', 'hydrocortisone', 'dexamethasone']
  },
  inhaler_lama: {
    id: 'inhaler_lama',
    nameVi: 'Kháng cholinergic tác dụng kéo dài (LAMA)',
    classes: ['lama'],
    drugIds: [
      'tiotropium', 'umeclidinium', 'glycopyrronium', 'aclidinium',
      'spiolto', 'tiotropium_olodaterol', 'olodaterol_tiotropium',
      'ultibro', 'glycopyrronium_indacaterol', 'indacaterol_glycopyrronium',
      'anoro', 'umeclidinium_vilanterol', 'vilanterol_umeclidinium',
      'duaklir', 'aclidinium_formoterol', 'bevespi', 'glycopyrronium_formoterol',
      'trelegy', 'fluticasone_furoate_umeclidinium_vilanterol', 'fluticasone_umeclidinium_vilanterol',
      'trimbow', 'beclometasone_glycopyrronium_formoterol', 'beclometasone_formoterol_glycopyrronium',
      'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol_glycopyrronium',
      'indacaterol_glycopyrronium_mometasone', 'mometasone_indacaterol_glycopyrronium', 'breztri', 'trixeo', 'enerzair'
    ]
  },
  inhaler_laba: {
    id: 'inhaler_laba',
    nameVi: 'Chủ vận beta-2 tác dụng kéo dài (LABA)',
    classes: ['laba'],
    drugIds: [
      'salmeterol', 'formoterol', 'indacaterol', 'olodaterol', 'vilanterol',
      'spiolto', 'tiotropium_olodaterol', 'olodaterol_tiotropium',
      'ultibro', 'glycopyrronium_indacaterol', 'indacaterol_glycopyrronium',
      'anoro', 'umeclidinium_vilanterol', 'vilanterol_umeclidinium',
      'duaklir', 'aclidinium_formoterol', 'bevespi', 'glycopyrronium_formoterol',
      'symbicort', 'budesonide_formoterol', 'formoterol_budesonide',
      'seretide', 'fluticasone_salmeterol', 'salmeterol_fluticasone',
      'relvar', 'fluticasone_vilanterol',
      'foster', 'beclometasone_formoterol',
      'dulera', 'mometasone_formoterol', 'flutiform', 'fluticasone_formoterol',
      'trelegy', 'fluticasone_furoate_umeclidinium_vilanterol', 'fluticasone_umeclidinium_vilanterol',
      'trimbow', 'beclometasone_glycopyrronium_formoterol', 'beclometasone_formoterol_glycopyrronium',
      'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol_glycopyrronium',
      'indacaterol_glycopyrronium_mometasone', 'mometasone_indacaterol_glycopyrronium', 'breztri', 'trixeo', 'enerzair'
    ]
  },
  inhaler_ics: {
    id: 'inhaler_ics',
    nameVi: 'Corticoid hít (ICS)',
    classes: ['ics'],
    drugIds: [
      'budesonide', 'fluticasone', 'fluticasone_propionate', 'fluticasone_furoate',
      'beclometasone', 'mometasone', 'ciclesonide',
      'symbicort', 'budesonide_formoterol', 'formoterol_budesonide',
      'seretide', 'fluticasone_salmeterol', 'salmeterol_fluticasone',
      'relvar', 'fluticasone_vilanterol',
      'foster', 'beclometasone_formoterol',
      'dulera', 'mometasone_formoterol', 'flutiform', 'fluticasone_formoterol',
      'trelegy', 'fluticasone_furoate_umeclidinium_vilanterol', 'fluticasone_umeclidinium_vilanterol',
      'trimbow', 'beclometasone_glycopyrronium_formoterol', 'beclometasone_formoterol_glycopyrronium',
      'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol_glycopyrronium',
      'indacaterol_glycopyrronium_mometasone', 'mometasone_indacaterol_glycopyrronium', 'breztri', 'trixeo', 'enerzair'
    ]
  }
};

const CONFLICT_FDC_ORDER_ALIASES: Record<string, string> = {
  indacaterol_glycopyrronium: 'glycopyrronium_indacaterol',
  olodaterol_tiotropium: 'tiotropium_olodaterol',
  vilanterol_umeclidinium: 'umeclidinium_vilanterol',
  formoterol_budesonide: 'budesonide_formoterol',
  salmeterol_fluticasone: 'fluticasone_salmeterol',
  beclometasone_formoterol_glycopyrronium: 'beclometasone_glycopyrronium_formoterol',
  budesonide_formoterol_glycopyrronium: 'budesonide_glycopyrronium_formoterol',
  fluticasone_umeclidinium_vilanterol: 'fluticasone_furoate_umeclidinium_vilanterol'
};

export function normalizeConflictDrugId(drugId?: string): string {
  const resolved = resolveKbDrugId(drugId);
  return CONFLICT_FDC_ORDER_ALIASES[resolved] ?? resolved;
}

export function isDrugInConflictGroup(drugId: string, group: ClassConflictGroup): boolean {
  const id = (drugId || '').trim().toLowerCase();
  if (!id) return false;
  if (group.id === 'beta_blockers' && isOphthalmicBetaBlocker(id)) return false;
  const resolved = resolveKbDrugId(id);
  if (group.id === 'nsaid' && (resolved === 'aspirin' || resolved === 'acetylsalicylic_acid')) {
    return false;
  }
  if (group.drugIds.includes(id) || group.drugIds.includes(resolved)) return true;
  if (group.classes.length > 0) {
    const normClasses = getNormalizedDrugClasses(resolved);
    return group.classes.some((c) => normClasses.has(c));
  }
  return false;
}

export function getInhalerComponentCount(drugId: string): number {
  const rawId = (drugId || '').trim().toLowerCase();
  const comps = expandDrugComponents(rawId);
  if (comps.length > 1) return comps.length;
  const id = normalizeConflictDrugId(rawId);
  if (hasDrug(id)) {
    const kbComps = drug(id).components;
    if (kbComps && kbComps.length > 0) return kbComps.length;
  }
  return 1;
}

export function isGlp1Drug(drugId: string): boolean {
  return isGlp1OrGipDrug(drugId);
}

export function isSteroidalMraDrug(drugId: string): boolean {
  const dId = resolveKbDrugId(drugId);
  return ['spironolactone', 'eplerenone'].includes(dId) || getNormalizedDrugClasses(dId).has('mra_steroidal');
}

const HF_EVIDENCE_BETA_BLOCKERS = new Set(['bisoprolol', 'carvedilol', 'metoprolol_succinate', 'nebivolol']);
const HIGH_INTENSITY_STATIN_DRUGS = new Set(['atorvastatin', 'rosuvastatin']);

export function isDedicatedIvSteroidRec(rec: Recommendation): boolean {
  const dId = (rec.drugId || '').trim().toLowerCase();
  if (!['methylprednisolone', 'hydrocortisone', 'dexamethasone'].includes(dId)) return false;
  const text = `${rec.dose || ''} ${rec.title || ''}`;
  return /tiêm tĩnh mạch|truyền tĩnh mạch|\biv\b/i.test(text);
}

export function isSuperiorStepUp(
  groupId: string,
  curId: string,
  candidate: Recommendation,
  curMed: CurrentMed | undefined,
  hasHfForPillar: boolean
): boolean {
  const candId = resolveKbDrugId(candidate.drugId);
  const normCurId = resolveKbDrugId(curId);
  if (!candId || candId === normCurId) return false;

  switch (groupId) {
    case 'rasi_arni':
      return candId === 'sacubitril_valsartan' && normCurId !== 'sacubitril_valsartan';
    case 'mra':
      return hasHfForPillar && isSteroidalMraDrug(candId) && !isSteroidalMraDrug(normCurId);
    case 'incretins':
      return isGlp1Drug(candId) && !isGlp1Drug(normCurId);
    case 'inhaler_lama':
    case 'inhaler_laba':
    case 'inhaler_ics': {
      const candCount = getInhalerComponentCount(candId);
      const curCount = getInhalerComponentCount(normCurId);
      if (candCount > curCount) return true;
      if (
        candidate.module === 'asthma' &&
        isDrugInConflictGroup(candId, CLASS_CONFLICT_GROUPS.inhaler_ics) &&
        !isDrugInConflictGroup(normCurId, CLASS_CONFLICT_GROUPS.inhaler_ics)
      ) {
        return true;
      }
      return false;
    }
    case 'beta_blockers':
      return (
        hasHfForPillar &&
        HF_EVIDENCE_BETA_BLOCKERS.has(candId) &&
        !HF_EVIDENCE_BETA_BLOCKERS.has(normCurId)
      );
    case 'statins': {
      if (HIGH_INTENSITY_STATIN_DRUGS.has(candId) && !HIGH_INTENSITY_STATIN_DRUGS.has(normCurId)) {
        const text = `${candidate.title || ''} ${candidate.dose || ''} ${candidate.rationale || ''}`;
        return /cường độ cao|high[- ]intensity|40\s*mg|80\s*mg|20\s*mg/i.test(text);
      }
      return false;
    }
    case 'anticoagulants':
      return (
        ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'].includes(candId) &&
        (normCurId === 'warfarin' || normCurId === 'acenocoumarol')
      );
    case 'systemic_steroid':
      return isDedicatedIvSteroidRec(candidate) || isAcuteOrEscalatedStart(candidate, curMed);
    default:
      return false;
  }
}

export function pickPreferredCurrentMedId(groupId: string, curIds: string[], hasHfForPillar: boolean): string {
  if (curIds.length <= 1) return curIds[0];
  if (groupId === 'rasi_arni' && hasHfForPillar) {
    const arni = curIds.find((id) => resolveKbDrugId(id) === 'sacubitril_valsartan');
    if (arni) return arni;
  }
  if (groupId === 'mra' && hasHfForPillar) {
    const steroidal = curIds.find((id) => isSteroidalMraDrug(id));
    if (steroidal) return steroidal;
  }
  if (groupId === 'incretins') {
    const glp1 = curIds.find((id) => isGlp1Drug(id));
    if (glp1) return glp1;
  }
  if (groupId.startsWith('inhaler_')) {
    return [...curIds].sort((a, b) => getInhalerComponentCount(b) - getInhalerComponentCount(a))[0];
  }
  return curIds[0];
}

export function isClassWideSafetyDefer(rec: Recommendation): boolean {
  if (rec.action !== 'DEFER' || !rec.drugId) return false;
  const text = `${rec.title || ''} ${rec.rationale || ''}`;
  if (/cyp3a4|clarithromycin|itraconazole|ketoconazole|ritonavir/i.test(text)) {
    return false;
  }
  if (
    rec.gates?.some(
      (g) =>
        !g.passed &&
        ['SBP', 'K+', 'Na+', 'QTc', 'eGFR', 'SCr', 'CrCl', 'AKI', 'OutpatientCrisis', 'glucose', 'plannedSurgery'].includes(
          g.parameter
        )
    )
  ) {
    return true;
  }
  return /chưa có|khuyết|thiếu|fail[- ]closed|huyết áp|kali|k\+|tổn thương thận cấp|\baki\b|hạ đường huyết|trước mổ|phẫu thuật|ưu tiên xử trí cấp cứu/i.test(
    text
  );
}
