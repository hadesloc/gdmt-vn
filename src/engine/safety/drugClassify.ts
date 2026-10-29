/**
 * GDMT-VN Safety - Shared Drug Classification & Contraindication Flag Helpers
 * Phân quyền: Agent B
 */

import type { Patient, ModuleId } from '../types';
import { hasCondition } from '../types';
import { hasDrug, drug, getAllDrugs, type DrugEntry } from '../../kb-types';
import {
  KB_DRUG_ALIASES,
  expandDrugComponents,
  resolveCanonicalDrugId
} from './fdcMap';

export { KB_DRUG_ALIASES };

const NON_KB_PREGNANCY_CONTRA_FALLBACK = [
  'benazepril', 'fosinopril', 'trandolapril', 'quinapril', 'moexipril',
  'olmesartan', 'azilsartan', 'aliskiren',
  'sotagliflozin', 'ertugliflozin',
  'fluvastatin', 'lovastatin', 'gemfibrozil', 'bezafibrate', 'ciprofibrate',
  'methotrexate', 'atenolol', 'rosiglitazone',
  'acenocoumarol',
  'meloxicam', 'ketorolac', 'tenoxicam', 'piroxicam', 'etodolac', 'dexketoprofen', 'parecoxib',
  'ivabradine', 'vericiguat',
  'semaglutide', 'semaglutide_oral', 'dulaglutide', 'liraglutide', 'lixisenatide', 'exenatide', 'tirzepatide',
  'insulin_glargine_lixisenatide', 'insulin_degludec_liraglutide'
];

function buildPregnancyContraindicatedSet(): Set<string> {
  const set = new Set<string>(NON_KB_PREGNANCY_CONTRA_FALLBACK);
  for (const d of getAllDrugs()) {
    const id = d.id.toLowerCase();
    const status = d.pregnancy?.status;
    if (status === 'contra' || status === 'avoid') {
      set.add(id);
    } else if (status === 'caution' || status === 'compatible') {
      set.delete(id);
    }
  }
  return set;
}

export const PREGNANCY_CONTRAINDICATED_DRUGS: Set<string> = buildPregnancyContraindicatedSet();

export function resolveKbDrugId(drugId?: string): string {
  const id = (drugId || '').trim().toLowerCase();
  if (!id) return '';
  return KB_DRUG_ALIASES[id] || resolveCanonicalDrugId(id) || id;
}

export function isOphthalmicBetaBlocker(drugIdOrName?: string, routeHint?: string): boolean {
  const combined = `${drugIdOrName || ''} ${routeHint || ''}`.trim();
  if (!combined) return false;
  return /ophthalmic|nhỏ\s*mắt|eye[\s_-]*drop|tra\s*mắt|timoptol|betoptic/i.test(combined);
}

function isSingleComponentPregnancyContra(compId: string): boolean {
  const id = resolveKbDrugId(compId);
  if (!id) return false;
  if (hasDrug(id)) {
    const d = drug(id);
    if (d.pregnancy?.status && d.pregnancy.status !== 'no_data') {
      return d.pregnancy.status === 'contra' || d.pregnancy.status === 'avoid';
    }
  }
  return PREGNANCY_CONTRAINDICATED_DRUGS.has(id);
}

export function isPregnancyContraindicated(drugId: string, routeHint?: string): boolean {
  const raw = (drugId || '').trim();
  if (!raw || isOphthalmicBetaBlocker(raw, routeHint)) return false;
  if (isSingleComponentPregnancyContra(raw)) return true;
  const comps = expandDrugComponents(raw);
  return comps.length > 1 && comps.some((c) => isSingleComponentPregnancyContra(c));
}

export const GLP1_GIP_RA_IDS = new Set([
  'semaglutide',
  'semaglutide_oral',
  'liraglutide',
  'dulaglutide',
  'lixisenatide',
  'exenatide',
  'tirzepatide',
  'insulin_glargine_lixisenatide',
  'insulin_degludec_liraglutide',
  'soliqua',
  'xultophy'
]);

export const STATIN_POTENCY_RANK: Record<string, number> = {
  rosuvastatin: 6,
  atorvastatin: 5,
  pitavastatin: 4,
  simvastatin: 3,
  lovastatin: 2,
  pravastatin: 1,
  fluvastatin: 0
};

const SELECTIVE_ORAL_BB_IDS = new Set([
  'bisoprolol',
  'metoprolol_succinate',
  'metoprolol_tartrate',
  'metoprolol',
  'nebivolol',
  'atenolol',
  'celiprolol',
  'betaxolol',
  'acebutolol',
  'esmolol'
]);

const NONSELECTIVE_ORAL_BB_IDS = new Set([
  'carvedilol',
  'propranolol',
  'nadolol',
  'timolol',
  'labetalol',
  'pindolol',
  'sotalol'
]);

const URICOSURIC_IDS = new Set(['probenecid', 'benzbromarone', 'lesinurad']);
const XOI_IDS = new Set(['allopurinol', 'febuxostat']);

const DRUG_CLASSES_CACHE = new Map<string, Set<string>>();
const EXPANDED_IDS_CACHE = new Map<string, string[]>();

export function getNormalizedDrugClasses(drugId: string): Set<string> {
  const rawInput = (drugId || '').trim();
  if (!rawInput) return new Set<string>();
  const cached = DRUG_CLASSES_CACHE.get(rawInput);
  if (cached) return cached;
  const classes = new Set<string>();

  if (isOphthalmicBetaBlocker(rawInput)) {
    classes.add('ophthalmic_beta_blocker');
    if (DRUG_CLASSES_CACHE.size < 4096) DRUG_CLASSES_CACHE.set(rawInput, classes);
    return classes;
  }

  const id = resolveKbDrugId(rawInput);
  if (!id) return classes;

  if (hasDrug(id)) {
    const d = drug(id);
    if (d.classes) {
      for (const c of d.classes) classes.add(c.toLowerCase());
    }
    const rawClass = (d.class || '').toLowerCase();
    if (rawClass === 'acei' || classes.has('acei')) {
      classes.add('acei');
      classes.add('rasi');
    } else if (rawClass === 'arb' || classes.has('arb')) {
      classes.add('arb');
      classes.add('rasi');
    } else if (rawClass === 'arni' || classes.has('arni')) {
      classes.add('arni');
      classes.add('rasi');
    } else if (rawClass === 'mra' || classes.has('mra_steroidal')) {
      classes.add('mra_steroidal');
      classes.add('mra');
    } else if (rawClass === 'nsmra' || classes.has('mra_nonsteroidal')) {
      classes.add('mra_nonsteroidal');
      classes.add('mra');
    } else if (rawClass === 'sglt2i' || classes.has('sglt2i')) {
      classes.add('sglt2i');
    } else if (rawClass.includes('glp-1') || rawClass.includes('gip') || classes.has('glp1ra')) {
      classes.add('glp1ra');
    } else if (rawClass === 'dpp-4i' || classes.has('dpp4i')) {
      classes.add('dpp4i');
    } else if (rawClass === 'sulfonylurea' || classes.has('su')) {
      classes.add('su');
      classes.add('sulfonylurea');
    } else if (rawClass.includes('meglitinide') || classes.has('meglitinide')) {
      classes.add('meglitinide');
    } else if (rawClass.includes('tzd') || rawClass.includes('thiazolidinedione') || classes.has('tzd')) {
      classes.add('tzd');
    } else if (rawClass === 'biguanide' || classes.has('biguanide')) {
      classes.add('biguanide');
    } else if (rawClass.includes('insulin') || classes.has('insulin')) {
      classes.add('insulin');
    } else if (rawClass === 'statin' || classes.has('statin')) {
      classes.add('statin');
    } else if (rawClass === 'fibrate' || classes.has('fibrate')) {
      classes.add('fibrate');
    } else if (rawClass.includes('pcsk9') || classes.has('pcsk9i') || classes.has('pcsk9')) {
      classes.add('pcsk9');
      classes.add('pcsk9i');
    } else if (rawClass === 'nsaid' || rawClass === 'cox-2i' || classes.has('nsaid')) {
      classes.add('nsaid');
    } else if (rawClass === 'loop diuretic' || classes.has('loop_diuretic')) {
      classes.add('loop_diuretic');
      classes.add('diuretic');
    } else if (rawClass.includes('thiazide') || classes.has('thiazide_diuretic')) {
      classes.add('thiazide_diuretic');
      classes.add('diuretic');
    } else if (
      !rawClass.includes('agonist') &&
      !classes.has('laba') &&
      !classes.has('saba') &&
      (rawClass === 'beta-blocker' ||
        (rawClass.includes('beta') && rawClass.includes('block')) ||
        rawClass.includes('chẹn beta') ||
        classes.has('bb_selective') ||
        classes.has('bb_nonselective'))
    ) {
      classes.add('beta_blocker');
      if (NONSELECTIVE_ORAL_BB_IDS.has(id)) {
        classes.add('bb_nonselective');
      } else {
        classes.add('bb_selective');
      }
    } else if (
      rawClass.includes('non-dhp ccb') ||
      rawClass.includes('non-dihydropyridine') ||
      classes.has('ndhp_ccb')
    ) {
      classes.add('ndhp_ccb');
    } else if (rawClass.includes('ccb') || rawClass.includes('dihydropyridine') || classes.has('dhp_ccb')) {
      classes.add('dhp_ccb');
    } else if (rawClass.includes('doac') || classes.has('doac')) {
      classes.add('doac');
      classes.add('oac');
      classes.add('anticoagulant');
    } else if (rawClass.includes('vka') || rawClass.includes('vitamin k') || classes.has('vka')) {
      classes.add('vka');
      classes.add('oac');
      classes.add('anticoagulant');
    } else if (XOI_IDS.has(id) || rawClass === 'xoi' || classes.has('xoi')) {
      classes.add('xoi');
      classes.add('urate_lowering');
    } else if (URICOSURIC_IDS.has(id) || rawClass.includes('uricosuric') || classes.has('uricosuric')) {
      classes.delete('xoi');
      classes.add('uricosuric');
      classes.add('urate_lowering');
    } else if (rawClass === 'cardiac glycoside' || classes.has('cardiac_glycoside')) {
      classes.add('cardiac_glycoside');
    } else if (
      classes.has('biologic_asthma') ||
      classes.has('biologic_anti_il4ra') ||
      classes.has('biologic_anti_il5')
    ) {
      classes.add('respiratory_biologic');
    }

    if (d.qtRisk) {
      classes.add('qt_prolonging');
      if (d.qtRisk === 'known') {
        classes.add('qt_known');
      }
    }
  }

  // Bảo đảm tách biệt tuyệt đối XOI và Uricosuric (GOUT-R2-R2-05)
  if (URICOSURIC_IDS.has(id)) {
    classes.delete('xoi');
    classes.add('uricosuric');
    classes.add('urate_lowering');
  } else if (XOI_IDS.has(id)) {
    classes.add('xoi');
    classes.add('urate_lowering');
  }

  if (GLP1_GIP_RA_IDS.has(id) || GLP1_GIP_RA_IDS.has(rawInput.toLowerCase())) {
    classes.add('glp1ra');
  }
  if (['insulin_glargine_lixisenatide', 'insulin_degludec_liraglutide', 'soliqua', 'xultophy'].includes(id)) {
    classes.add('insulin');
    classes.add('glp1ra');
  }
  if (['benazepril', 'fosinopril', 'trandolapril', 'quinapril', 'moexipril'].includes(id)) {
    classes.add('acei');
    classes.add('rasi');
  } else if (['olmesartan', 'azilsartan'].includes(id)) {
    classes.add('arb');
    classes.add('rasi');
  } else if (id === 'aliskiren') {
    classes.add('renin_inhibitor');
    classes.add('rasi');
  } else if (['sotagliflozin', 'ertugliflozin'].includes(id)) {
    classes.add('sglt2i');
  } else if (['alogliptin', 'sitagliptin', 'linagliptin', 'vildagliptin', 'saxagliptin'].includes(id)) {
    classes.add('dpp4i');
  } else if (['glibenclamide', 'glyburide', 'glipizide', 'chlorpropamide', 'tolbutamide'].includes(id)) {
    classes.add('su');
    classes.add('sulfonylurea');
  } else if (['repaglinide', 'nateglinide', 'mitiglinide'].includes(id)) {
    classes.add('meglitinide');
  } else if (['fluvastatin', 'lovastatin'].includes(id)) {
    classes.add('statin');
  } else if (['fenofibrate', 'gemfibrozil', 'bezafibrate', 'ciprofibrate'].includes(id)) {
    classes.add('fibrate');
  } else if (['evolocumab', 'alirocumab', 'inclisiran'].includes(id)) {
    classes.add('pcsk9');
    classes.add('pcsk9i');
  } else if (['cholestyramine', 'colesevelam', 'colestipol'].includes(id)) {
    classes.add('bile_acid_resin');
  } else if (
    [
      'naproxen', 'ibuprofen', 'diclofenac', 'indomethacin', 'meloxicam',
      'piroxicam', 'tenoxicam', 'celecoxib', 'etoricoxib', 'ketorolac',
      'etodolac', 'dexketoprofen', 'flurbiprofen', 'ketoprofen', 'parecoxib'
    ].includes(id)
  ) {
    classes.add('nsaid');
  } else if (NONSELECTIVE_ORAL_BB_IDS.has(id)) {
    classes.add('bb_nonselective');
    classes.add('beta_blocker');
  } else if (SELECTIVE_ORAL_BB_IDS.has(id)) {
    classes.add('bb_selective');
    classes.add('beta_blocker');
  } else if (['warfarin', 'acenocoumarol'].includes(id)) {
    classes.add('vka');
    classes.add('oac');
    classes.add('anticoagulant');
  } else if (['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'].includes(id)) {
    classes.add('doac');
    classes.add('oac');
    classes.add('anticoagulant');
  } else if (['enoxaparin', 'heparin', 'dalteparin', 'nadroparin', 'tinzaparin', 'fondaparinux'].includes(id)) {
    classes.add('parenteral_anticoagulant');
    classes.add('anticoagulant');
  } else if (['sildenafil', 'tadalafil', 'vardenafil', 'avanafil'].includes(id)) {
    classes.add('pde5i');
  } else if (['nitroglycerin', 'isosorbide_dinitrate', 'isosorbide_mononitrate', 'glyceryl_trinitrate'].includes(id)) {
    classes.add('nitrate');
    classes.add('vasodilator');
  } else if (['dupilumab', 'mepolizumab', 'benralizumab', 'omalizumab', 'tezepelumab'].includes(id)) {
    classes.add('respiratory_biologic');
  }

  // Hợp nhất nhóm dược lý từ toàn bộ thành phần của FDC / SPC / bình hít phối hợp
  const comps = expandDrugComponents(rawInput);
  if (comps.length > 1) {
    for (const comp of comps) {
      if (comp === id) continue;
      for (const subClass of getNormalizedDrugClasses(comp)) {
        classes.add(subClass);
      }
    }
  }

  if (DRUG_CLASSES_CACHE.size < 4096) DRUG_CLASSES_CACHE.set(rawInput, classes);
  return classes;
}

export function getExpandedDrugIds(drugId: string): string[] {
  const id = (drugId || '').trim().toLowerCase();
  if (!id) return [];
  const cached = EXPANDED_IDS_CACHE.get(id);
  if (cached) return cached;
  const resolved = resolveKbDrugId(id);
  const result = new Set<string>([id, resolved]);
  for (const comp of expandDrugComponents(id)) {
    result.add(comp);
    result.add(resolveKbDrugId(comp));
  }
  if (hasDrug(resolved)) {
    const d = drug(resolved);
    if (d.components) {
      for (const comp of d.components) {
        const cLow = comp.toLowerCase();
        result.add(cLow);
        result.add(resolveKbDrugId(cLow));
      }
    }
  }
  const out = Array.from(result).filter(Boolean);
  if (EXPANDED_IDS_CACHE.size < 4096) EXPANDED_IDS_CACHE.set(id, out);
  return out;
}

export const DOAC_DRUG_IDS = new Set(['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban']);
export const PDE5I_DRUG_IDS = new Set(['sildenafil', 'tadalafil', 'vardenafil', 'avanafil']);
export const NITRATE_OR_SGC_DRUG_IDS = new Set([
  'nitroglycerin',
  'isosorbide_dinitrate',
  'isosorbide_mononitrate',
  'glyceryl_trinitrate',
  'vericiguat'
]);
export const STRONG_CYP3A4_INHIBITOR_IDS = new Set([
  'clarithromycin',
  'ketoconazole',
  'itraconazole',
  'ritonavir',
  'nirmatrelvir_ritonavir',
  'cobicistat',
  'voriconazole',
  'posaconazole',
  'nefazodone'
]);

export function isGlp1OrGipDrug(drugId?: string, classes?: Set<string>): boolean {
  const raw = (drugId || '').trim().toLowerCase();
  if (!raw) return false;
  const resolved = resolveKbDrugId(raw);
  if (GLP1_GIP_RA_IDS.has(raw) || GLP1_GIP_RA_IDS.has(resolved)) return true;
  const cls = classes || getNormalizedDrugClasses(resolved);
  return cls.has('glp1ra');
}

export function isSglt2iOrComboDrug(
  drugId?: string,
  resolvedKbId?: string,
  classes?: Set<string>,
  kbDrug?: DrugEntry
): boolean {
  const raw = (drugId || '').trim().toLowerCase();
  if (!raw) return false;
  const resolved = resolvedKbId || resolveKbDrugId(raw);
  const cls = classes || getNormalizedDrugClasses(resolved);
  return (
    cls.has('sglt2i') ||
    raw.includes('gliflozin') ||
    resolved.includes('gliflozin') ||
    expandDrugComponents(raw).some((c) => c.includes('gliflozin')) ||
    Boolean(kbDrug?.components?.some((c) => c.toLowerCase().includes('gliflozin')))
  );
}

export function hasSevereMilkProteinAllergy(patient: Patient): boolean {
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return Boolean(
    cond.severeMilkProteinAllergy ||
      cond.severe_milk_protein_allergy ||
      cond.milkProteinAllergy ||
      cond.milk_protein_allergy ||
      ci.severeMilkProteinAllergy ||
      ci.severe_milk_protein_allergy ||
      ci.milkProteinAllergy ||
      ci.milk_protein_allergy ||
      ci.milkAllergy
  );
}

export function hasNarrowAngleGlaucoma(patient: Patient): boolean {
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return Boolean(
    cond.narrowAngleGlaucoma ||
      cond.narrow_angle_glaucoma ||
      cond.glaucoma ||
      ci.narrowAngleGlaucoma ||
      ci.narrow_angle_glaucoma ||
      ci.glaucoma
  );
}

export function hasUrinaryRetentionCondition(patient: Patient): boolean {
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return Boolean(
    cond.urinaryRetention ||
      cond.urinary_retention ||
      cond.acuteUrinaryRetention ||
      ci.urinaryRetention ||
      ci.urinary_retention ||
      ci.prostateUrinaryRetention
  );
}

export function hasMtcOrMen2History(patient: Patient): boolean {
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return (
    hasCondition({ normalized: patient, patient }, 'mtc') ||
    Boolean(
      cond.mtc ||
        cond.men2 ||
        cond.medullary_thyroid_carcinoma ||
        cond.mtcMen2History ||
        cond.historyMtcOrMen2 ||
        ci.mtcMen2History === true ||
        ci.historyMtcOrMen2 === true ||
        ci.mtc === true ||
        ci.men2 === true ||
        ci.medullary_thyroid_carcinoma === true ||
        ci.familyHistoryMtc === true
    )
  );
}

export function hasAcutePancreatitis(patient: Patient): boolean {
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return Boolean(
    cond.acutePancreatitis ||
      cond.acute_pancreatitis ||
      ci.acutePancreatitis === true ||
      ci.acute_pancreatitis === true ||
      ci.pancreatitisStatus === 'acute'
  );
}

export function hasPancreatitisHistory(patient: Patient): boolean {
  if (hasAcutePancreatitis(patient)) return true;
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return (
    hasCondition({ normalized: patient, patient }, 'pancreatitis') ||
    Boolean(
      cond.pancreatitis ||
        cond.historyPancreatitis ||
        ci.historyPancreatitis === true ||
        ci.pancreatitis === true ||
        ci.pancreatitisHistory === true
    )
  );
}

export const COX2_SELECTIVE_NSAID_IDS = new Set(['celecoxib', 'etoricoxib', 'parecoxib']);

export const COX1_NSAID_OR_SALICYLATE_IDS = new Set([
  'aspirin',
  'acetylsalicylic_acid',
  'naproxen',
  'ibuprofen',
  'indomethacin',
  'diclofenac',
  'meloxicam',
  'piroxicam',
  'ketorolac',
  'flurbiprofen',
  'ketoprofen',
  'tenoxicam',
  'etodolac',
  'dexketoprofen',
  'nabumetone',
  'mefenamic_acid',
  'sulindac',
  'loxoprofen'
]);

export function hasAerdCondition(patient: Patient): boolean {
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  return Boolean(
    cond.aerd ||
      cond.samterTriad ||
      cond.aspirinSensitiveAsthma ||
      ci.aerd === true ||
      ci.nsaidExacerbatedRespiratoryDisease === true ||
      ci.aspirinSensitiveAsthma === true
  );
}

export function isCox1NsaidOrSalicylate(
  drugId?: string,
  resolvedKbId?: string,
  classes?: Set<string>
): boolean {
  const raw = (drugId || '').trim().toLowerCase();
  if (!raw) return false;
  const resolved = resolvedKbId || resolveKbDrugId(raw);
  if (COX2_SELECTIVE_NSAID_IDS.has(raw) || COX2_SELECTIVE_NSAID_IDS.has(resolved)) {
    return false;
  }
  const cls = classes || getNormalizedDrugClasses(resolved);
  if (cls.has('cox2_selective')) return false;
  if (COX1_NSAID_OR_SALICYLATE_IDS.has(raw) || COX1_NSAID_OR_SALICYLATE_IDS.has(resolved)) {
    return true;
  }
  return cls.has('nsaid');
}

/**
 * Phát hiện co thắt phế quản cấp / cơn hen cấp / suy hô hấp cấp theo tiêu chuẩn GINA 2026 & GOLD 2026 (`HF-R2-R3-03`).
 */
export function hasAcuteBronchospasmOrRespFailure(patient: Patient): boolean {
  const ptRec = patient as unknown as Record<string, unknown>;
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  const speech = typeof ci.speechAbility === 'string' ? ci.speechAbility.trim().toLowerCase() : '';
  if (
    ci.acuteBronchospasm === true ||
    ci.silentChest === true ||
    ci.respiratoryArrest === true ||
    speech === 'words' ||
    speech === 'phrases'
  ) {
    return true;
  }

  const pefPct =
    typeof ptRec.pefPct === 'number'
      ? ptRec.pefPct
      : typeof ci.pefPct === 'number'
        ? ci.pefPct
        : undefined;
  if (pefPct !== undefined && Number.isFinite(pefPct) && pefPct <= 60) {
    return true;
  }

  const spo2 =
    typeof ptRec.spo2 === 'number'
      ? ptRec.spo2
      : typeof ci.spo2 === 'number'
        ? ci.spo2
        : typeof ci.restingSpo2 === 'number'
          ? ci.restingSpo2
          : undefined;
  const hasAsthma =
    hasCondition({ normalized: patient, patient }, 'asthma') ||
    hasCondition({ normalized: patient, patient }, 'priorAsthma');
  const hasCopd = hasCondition({ normalized: patient, patient }, 'copd');
  if (spo2 !== undefined && Number.isFinite(spo2)) {
    // COPD-R4-R2-03: SpO2 88–92% là ĐÍCH oxy khuyến cáo ở COPD (GOLD 2026 / BTS) — không coi là co thắt phế quản/suy hô hấp.
    // COPD đơn thuần chỉ báo động khi SpO2 < 88%; hen (kể cả ACO) giữ ngưỡng < 92% (GINA).
    if (hasAsthma ? spo2 < 92 : hasCopd ? spo2 < 88 : spo2 < 90) {
      return true;
    }
  }

  const abgPh =
    typeof ci.abgPh === 'number' ? ci.abgPh : typeof ci.ph === 'number' ? ci.ph : undefined;
  if (abgPh !== undefined && Number.isFinite(abgPh) && abgPh <= 7.35) {
    return true;
  }

  // Bệnh nhân đã đáp ứng tốt sau xử trí cấp cứu và ổn định xuất viện (GINA Box 9-7)
  if (String(ci.acuteResponseAfter1h ?? '').trim().toLowerCase() === 'good_response') {
    return false;
  }

  // COPD-R4-R2-03: `acuteExacerbation` là cờ đợt cấp COPD — GOLD 2026 / ESC HF 2026 khuyến cáo KHÔNG ngưng chẹn beta
  // chỉ vì đợt cấp COPD huyết động ổn định (đã có các ngưỡng SpO2 / pH / PEF / lời nói khách quan ở trên).
  // Chỉ coi là co thắt phế quản cấp khi có hen (kể cả ACO) hoặc không có COPD nền.
  return Boolean(
    ci.isAcuteExacerbation === true || (ci.acuteExacerbation === true && (hasAsthma || !hasCopd))
  );
}

export function inferReviewModule(
  patient: Patient,
  resolvedKbId: string,
  drugClasses: Set<string>,
  contraCode?: string
): ModuleId {
  const selected = patient.selectedModules || [];
  const isRespDrug =
    contraCode === 'severe_milk_protein_allergy' ||
    drugClasses.has('lama') ||
    drugClasses.has('laba') ||
    drugClasses.has('ics') ||
    drugClasses.has('saba') ||
    drugClasses.has('sama') ||
    drugClasses.has('pde4i') ||
    drugClasses.has('methylxanthine') ||
    drugClasses.has('ltra') ||
    drugClasses.has('respiratory_biologic') ||
    drugClasses.has('biologic_asthma') ||
    drugClasses.has('biologic_anti_il4ra') ||
    drugClasses.has('biologic_anti_il5');

  if (isRespDrug) {
    if (selected.includes('copd')) return 'copd';
    if (selected.includes('asthma')) return 'asthma';
    return hasCondition({ normalized: patient, patient }, 'copd') ? 'copd' : 'asthma';
  }
  if (contraCode === 'aerd') {
    if (selected.includes('asthma')) return 'asthma';
    if (selected.includes('gout')) return 'gout';
    return selected[0] ?? 'asthma';
  }
  if (
    contraCode === 'mechanical_valve' ||
    drugClasses.has('doac') ||
    drugClasses.has('vka') ||
    drugClasses.has('anticoagulant') ||
    drugClasses.has('antiarrhythmic_ic') ||
    drugClasses.has('antiarrhythmic_iii')
  ) {
    return selected.includes('af') ? 'af' : (selected[0] ?? 'af');
  }
  if (
    contraCode === 'hla_b5801' ||
    drugClasses.has('xoi') ||
    drugClasses.has('uricosuric') ||
    drugClasses.has('colchicine')
  ) {
    return selected.includes('gout') ? 'gout' : (selected[0] ?? 'gout');
  }
  if (
    drugClasses.has('statin') ||
    drugClasses.has('fibrate') ||
    drugClasses.has('pcsk9i') ||
    drugClasses.has('acl_inhibitor') ||
    resolvedKbId === 'ezetimibe'
  ) {
    return selected.includes('lipid') ? 'lipid' : (selected[0] ?? 'lipid');
  }
  if (
    drugClasses.has('glp1ra') ||
    drugClasses.has('dpp4i') ||
    drugClasses.has('su') ||
    drugClasses.has('meglitinide') ||
    drugClasses.has('biguanide') ||
    drugClasses.has('tzd') ||
    drugClasses.has('insulin')
  ) {
    return selected.includes('dm2') ? 'dm2' : (selected[0] ?? 'dm2');
  }
  if (
    contraCode === 'heart_failure' ||
    drugClasses.has('arni') ||
    drugClasses.has('if_inhibitor') ||
    drugClasses.has('sgc_stimulator')
  ) {
    return selected.includes('hf') ? 'hf' : (selected[0] ?? 'hf');
  }
  if (
    drugClasses.has('dhp_ccb') ||
    drugClasses.has('alpha1_blocker') ||
    drugClasses.has('central_alpha2_agonist')
  ) {
    return selected.includes('htn') ? 'htn' : (selected[0] ?? 'htn');
  }
  if (drugClasses.has('sglt2i') || drugClasses.has('rasi') || drugClasses.has('mra')) {
    if (selected.includes('ckd')) return 'ckd';
    if (selected.includes('hf')) return 'hf';
    if (selected.includes('htn')) return 'htn';
    if (selected.includes('dm2')) return 'dm2';
  }
  return selected[0] ?? 'ckd';
}
