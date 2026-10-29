/**
 * GDMT-VN Global Fixed-Dose Combination (FDC / SPC / Inhaler) Decomposition Map
 * Phân quyền: Agent B
 *
 * Phân rã toàn cục mọi viên phối hợp cố định (SPC tim mạch/THA, FDC đái tháo đường,
 * FDC hạ mỡ máu, bình hít đôi/ba hô hấp) thành các hoạt chất thành phần chuẩn hóa
 * để kiểm tra chống chỉ định, suy thận/gan, thai kỳ/cho con bú, dị ứng, tương tác và trùng lặp nhóm.
 * Lưu ý: `sacubitril_valsartan` được giữ nguyên là thực thể ARNI đơn nhất cho logic tứ trụ suy tim,
 * trong khi các cổng an toàn (thai kỳ, cho con bú, phù mạch, tăng K+, AKI, cấm phối hợp RASi) đều bắt trực tiếp ARNI.
 */

import type { CurrentMed } from '../types';
import { hasDrug, drug } from '../../kb-types';

export interface ExpandedMed {
  originalMed: CurrentMed;
  canonicalDrugId: string;
  componentId: string;
  isFdcComponent: boolean;
  allComponentIds: string[];
}

/**
 * Ánh xạ biệt dược / tên viết tắt / thứ tự đảo hoạt chất về `drugId` chuẩn hóa.
 */
export const KB_DRUG_ALIASES: Record<string, string> = {
  // --- HTN / CV SPCs ---
  coveram: 'perindopril_amlodipine',
  amlodipine_perindopril: 'perindopril_amlodipine',
  preterax: 'perindopril_indapamide',
  coversyl_plus: 'perindopril_indapamide',
  noliprel: 'perindopril_indapamide',
  triplixam: 'perindopril_indapamide_amlodipine',
  exforge: 'valsartan_amlodipine',
  amlodipine_valsartan: 'valsartan_amlodipine',
  twynsta: 'telmisartan_amlodipine',
  amlodipine_telmisartan: 'telmisartan_amlodipine',
  cozaar_xq: 'losartan_amlodipine',
  amlodipine_losartan: 'losartan_amlodipine',
  amzaar: 'losartan_amlodipine',
  concor_am: 'bisoprolol_amlodipine',
  amlodipine_bisoprolol: 'bisoprolol_amlodipine',
  hyzaar: 'losartan_hctz',
  losartan_hydrochlorothiazide: 'losartan_hctz',
  co_diovan: 'valsartan_hctz',
  codiovan: 'valsartan_hctz',
  valsartan_hydrochlorothiazide: 'valsartan_hctz',
  micardis_plus: 'telmisartan_hctz',
  telmisartan_hydrochlorothiazide: 'telmisartan_hctz',
  coaprovel: 'irbesartan_hctz',
  irbesartan_hydrochlorothiazide: 'irbesartan_hctz',
  atacand_plus: 'candesartan_hctz',
  candesartan_hydrochlorothiazide: 'candesartan_hctz',
  olmetec_plus: 'olmesartan_hctz',
  olmesartan_hydrochlorothiazide: 'olmesartan_hctz',
  sevikar: 'olmesartan_amlodipine',
  amlodipine_olmesartan: 'olmesartan_amlodipine',
  exforge_hct: 'valsartan_amlodipine_hctz',
  amlodipine_valsartan_hctz: 'valsartan_amlodipine_hctz',
  bidil: 'hydralazine_isdn',
  isosorbide_dinitrate_hydralazine: 'hydralazine_isdn',
  entresto: 'sacubitril_valsartan',
  uperio: 'sacubitril_valsartan',

  // --- DM2 FDCs ---
  synjardy: 'empagliflozin_metformin',
  synjardy_xr: 'empagliflozin_metformin',
  jardiance_duo: 'empagliflozin_metformin',
  metformin_empagliflozin: 'empagliflozin_metformin',
  xigduo: 'dapagliflozin_metformin',
  xigduo_xr: 'dapagliflozin_metformin',
  metformin_dapagliflozin: 'dapagliflozin_metformin',
  invokamet: 'canagliflozin_metformin',
  invokamet_xr: 'canagliflozin_metformin',
  metformin_canagliflozin: 'canagliflozin_metformin',
  segluromet: 'ertugliflozin_metformin',
  metformin_ertugliflozin: 'ertugliflozin_metformin',
  janumet: 'sitagliptin_metformin',
  janumet_xr: 'sitagliptin_metformin',
  metformin_sitagliptin: 'sitagliptin_metformin',
  jentadueto: 'linagliptin_metformin',
  trajenta_duo: 'linagliptin_metformin',
  metformin_linagliptin: 'linagliptin_metformin',
  galvus_met: 'vildagliptin_metformin',
  eucreas: 'vildagliptin_metformin',
  metformin_vildagliptin: 'vildagliptin_metformin',
  kombiglyze: 'saxagliptin_metformin',
  kombiglyze_xr: 'saxagliptin_metformin',
  komboglyze: 'saxagliptin_metformin',
  metformin_saxagliptin: 'saxagliptin_metformin',
  kazano: 'alogliptin_metformin',
  metformin_alogliptin: 'alogliptin_metformin',
  actoplus_met: 'pioglitazone_metformin',
  competact: 'pioglitazone_metformin',
  metformin_pioglitazone: 'pioglitazone_metformin',
  amaryl_m: 'glimepiride_metformin',
  metformin_glimepiride: 'glimepiride_metformin',
  metformin_gliclazide: 'gliclazide_metformin',
  glucovance: 'glibenclamide_metformin',
  glyburide_metformin: 'glibenclamide_metformin',
  glyxambi: 'empagliflozin_linagliptin',
  qtern: 'dapagliflozin_saxagliptin',
  soliqua: 'insulin_glargine_lixisenatide',
  suliqua: 'insulin_glargine_lixisenatide',
  xultophy: 'insulin_degludec_liraglutide',

  // --- Lipid FDCs ---
  rosuzet: 'rosuvastatin_ezetimibe',
  ezetimibe_rosuvastatin: 'rosuvastatin_ezetimibe',
  atozet: 'atorvastatin_ezetimibe',
  ezetimibe_atorvastatin: 'atorvastatin_ezetimibe',
  vytorin: 'simvastatin_ezetimibe',
  inegy: 'simvastatin_ezetimibe',
  ezetimibe_simvastatin: 'simvastatin_ezetimibe',
  caduet: 'amlodipine_atorvastatin',
  atorvastatin_amlodipine: 'amlodipine_atorvastatin',
  nexlizet: 'bempedoic_acid_ezetimibe',
  nustendi: 'bempedoic_acid_ezetimibe',
  ezetimibe_bempedoic_acid: 'bempedoic_acid_ezetimibe',

  // --- Respiratory Dual & Triple Inhalers ---
  symbicort: 'budesonide_formoterol',
  symbicort_turbuhaler: 'budesonide_formoterol',
  symbicort_rapihaler: 'budesonide_formoterol',
  foster: 'beclometasone_formoterol',
  seretide: 'fluticasone_salmeterol',
  advair: 'fluticasone_salmeterol',
  relvar: 'fluticasone_vilanterol',
  relvar_ellipta: 'fluticasone_vilanterol',
  breo: 'fluticasone_vilanterol',
  dulera: 'mometasone_formoterol',
  zenhale: 'mometasone_formoterol',
  flutiform: 'fluticasone_formoterol',
  spiolto: 'tiotropium_olodaterol',
  spiolto_respimat: 'tiotropium_olodaterol',
  stiolto: 'tiotropium_olodaterol',
  anoro: 'umeclidinium_vilanterol',
  anoro_ellipta: 'umeclidinium_vilanterol',
  duaklir: 'aclidinium_formoterol',
  bevespi: 'glycopyrronium_formoterol',
  combivent: 'ipratropium_salbutamol',
  salbutamol_ipratropium: 'ipratropium_salbutamol',
  albuterol_ipratropium: 'ipratropium_salbutamol',
  berodual: 'ipratropium_fenoterol',
  fenoterol_ipratropium: 'ipratropium_fenoterol',
  trelegy: 'fluticasone_furoate_umeclidinium_vilanterol',
  trelegy_ellipta: 'fluticasone_furoate_umeclidinium_vilanterol',
  fluticasone_umeclidinium_vilanterol: 'fluticasone_furoate_umeclidinium_vilanterol',
  trimbow: 'beclometasone_glycopyrronium_formoterol',
  beclometasone_formoterol_glycopyrronium: 'beclometasone_glycopyrronium_formoterol',
  breztri: 'budesonide_glycopyrronium_formoterol',
  breztri_aerosphere: 'budesonide_glycopyrronium_formoterol',
  trixeo: 'budesonide_glycopyrronium_formoterol',
  budesonide_formoterol_glycopyrronium: 'budesonide_glycopyrronium_formoterol',
  enerzair: 'indacaterol_glycopyrronium_mometasone',
  ultibro: 'glycopyrronium_indacaterol',
  ultibro_breezhaler: 'glycopyrronium_indacaterol',
  indacaterol_glycopyrronium: 'glycopyrronium_indacaterol',

  // --- Common Single-Ingredient Clinical & VN Brand Aliases ---
  hctz: 'hydrochlorothiazide',
  isdn: 'isosorbide_dinitrate',
  premix: 'insulin_premix',
  mixtard: 'insulin_premix',
  novomix: 'insulin_premix',
  humalog_mix: 'insulin_premix',
  ryzodeg: 'insulin_premix',
  wegovy: 'semaglutide',
  saxenda: 'liraglutide',
  zepbound: 'tirzepatide',
  albuterol: 'salbutamol',
  glyburide: 'glibenclamide',
  sintrom: 'acenocoumarol',
  coumadin: 'warfarin',
  lovenox: 'enoxaparin',
  arixtra: 'fondaparinux',
  eliquis: 'apixaban',
  xarelto: 'rivaroxaban',
  pradaxa: 'dabigatran',
  lixiana: 'edoxaban',
  savaysa: 'edoxaban',
  jardiance: 'empagliflozin',
  forxiga: 'dapagliflozin',
  farxiga: 'dapagliflozin',
  invokana: 'canagliflozin',
  steglatro: 'ertugliflozin',
  glucophage: 'metformin',
  januvia: 'sitagliptin',
  trajenta: 'linagliptin',
  galvus: 'vildagliptin',
  onglyza: 'saxagliptin',
  ozempic: 'semaglutide',
  rybelsus: 'semaglutide_oral',
  byetta: 'exenatide',
  bydureon: 'exenatide',
  bydureon_bcise: 'exenatide',
  exenatide_er: 'exenatide',
  exenatide_extended_release: 'exenatide',
  adlyxin: 'lixisenatide',
  lyxumia: 'lixisenatide',
  victoza: 'liraglutide',
  trulicity: 'dulaglutide',
  mounjaro: 'tirzepatide',
  diamicron: 'gliclazide',
  amaryl: 'glimepiride',
  actos: 'pioglitazone',
  coversyl: 'perindopril',
  tritace: 'ramipril',
  renitec: 'enalapril',
  zestril: 'lisinopril',
  cozaar: 'losartan',
  diovan: 'valsartan',
  micardis: 'telmisartan',
  aprovel: 'irbesartan',
  atacand: 'candesartan',
  olmetec: 'olmesartan',
  rasilez: 'aliskiren',
  norvasc: 'amlodipine',
  amlor: 'amlodipine',
  plendil: 'felodipine',
  adalat: 'nifedipine',
  zanidip: 'lercanidipine',
  concor: 'bisoprolol',
  betaloc_zok: 'metoprolol_succinate',
  betaloc: 'metoprolol_tartrate',
  lopressor: 'metoprolol_tartrate',
  tenormin: 'atenolol',
  inderal: 'propranolol',
  nebilet: 'nebivolol',
  dilatrend: 'carvedilol',
  coreg: 'carvedilol',
  corlentor: 'ivabradine',
  procoralan: 'ivabradine',
  verquvo: 'vericiguat',
  aldactone: 'spironolactone',
  inspra: 'eplerenone',
  kerendia: 'finerenone',
  natrilix: 'indapamide',
  lasix: 'furosemide',
  crestor: 'rosuvastatin',
  lipitor: 'atorvastatin',
  zocor: 'simvastatin',
  livalo: 'pitavastatin',
  ezetrol: 'ezetimibe',
  zetia: 'ezetimibe',
  nexletol: 'bempedoic_acid',
  lipanthyl: 'fenofibrate',
  tricor: 'fenofibrate',
  vascepa: 'icosapent_ethyl',
  repatha: 'evolocumab',
  praluent: 'alirocumab',
  leqvio: 'inclisiran',
  zyloprim: 'allopurinol',
  zyloric: 'allopurinol',
  uloric: 'febuxostat',
  feburic: 'febuxostat',
  adenuric: 'febuxostat',
  desuric: 'benzbromarone',
  narcaricin: 'benzbromarone',
  colcrys: 'colchicine',
  arcoxia: 'etoricoxib',
  celebrex: 'celecoxib',
  mobic: 'meloxicam',
  voltaren: 'diclofenac',
  cordarone: 'amiodarone',
  multaq: 'dronedarone',
  tambocor: 'flecainide',
  rythmol: 'propafenone',
  lanoxin: 'digoxin',
  spiriva: 'tiotropium',
  ventolin: 'salbutamol',
  pulmicort: 'budesonide',
  flixotide: 'fluticasone',
  dupixent: 'dupilumab',
  nucala: 'mepolizumab',
  fasenra: 'benralizumab',
  xolair: 'omalizumab',
  tezspire: 'tezepelumab'
};

/**
 * Bản đồ thành phần hoạt chất của mọi thuốc phối hợp cố định (theo đúng thứ tự hàm lượng chuẩn trên nhãn).
 */
export const FDC_COMPONENT_MAP: Record<string, string[]> = {
  // --- HTN / CV SPCs ---
  perindopril_amlodipine: ['perindopril', 'amlodipine'],
  amlodipine_perindopril: ['amlodipine', 'perindopril'],
  perindopril_indapamide: ['perindopril', 'indapamide'],
  perindopril_indapamide_amlodipine: ['perindopril', 'indapamide', 'amlodipine'],
  valsartan_amlodipine: ['valsartan', 'amlodipine'],
  amlodipine_valsartan: ['amlodipine', 'valsartan'],
  telmisartan_amlodipine: ['telmisartan', 'amlodipine'],
  amlodipine_telmisartan: ['amlodipine', 'telmisartan'],
  losartan_amlodipine: ['losartan', 'amlodipine'],
  amlodipine_losartan: ['amlodipine', 'losartan'],
  bisoprolol_amlodipine: ['bisoprolol', 'amlodipine'],
  amlodipine_bisoprolol: ['amlodipine', 'bisoprolol'],
  losartan_hctz: ['losartan', 'hydrochlorothiazide'],
  losartan_hydrochlorothiazide: ['losartan', 'hydrochlorothiazide'],
  valsartan_hctz: ['valsartan', 'hydrochlorothiazide'],
  valsartan_hydrochlorothiazide: ['valsartan', 'hydrochlorothiazide'],
  telmisartan_hctz: ['telmisartan', 'hydrochlorothiazide'],
  telmisartan_hydrochlorothiazide: ['telmisartan', 'hydrochlorothiazide'],
  irbesartan_hctz: ['irbesartan', 'hydrochlorothiazide'],
  irbesartan_hydrochlorothiazide: ['irbesartan', 'hydrochlorothiazide'],
  candesartan_hctz: ['candesartan', 'hydrochlorothiazide'],
  candesartan_hydrochlorothiazide: ['candesartan', 'hydrochlorothiazide'],
  olmesartan_hctz: ['olmesartan', 'hydrochlorothiazide'],
  olmesartan_hydrochlorothiazide: ['olmesartan', 'hydrochlorothiazide'],
  olmesartan_amlodipine: ['olmesartan', 'amlodipine'],
  valsartan_amlodipine_hctz: ['valsartan', 'amlodipine', 'hydrochlorothiazide'],
  hydralazine_isdn: ['hydralazine', 'isosorbide_dinitrate'],

  // --- DM2 FDCs ---
  empagliflozin_metformin: ['empagliflozin', 'metformin'],
  dapagliflozin_metformin: ['dapagliflozin', 'metformin'],
  canagliflozin_metformin: ['canagliflozin', 'metformin'],
  ertugliflozin_metformin: ['ertugliflozin', 'metformin'],
  sitagliptin_metformin: ['sitagliptin', 'metformin'],
  linagliptin_metformin: ['linagliptin', 'metformin'],
  vildagliptin_metformin: ['vildagliptin', 'metformin'],
  saxagliptin_metformin: ['saxagliptin', 'metformin'],
  alogliptin_metformin: ['alogliptin', 'metformin'],
  pioglitazone_metformin: ['pioglitazone', 'metformin'],
  glimepiride_metformin: ['glimepiride', 'metformin'],
  gliclazide_metformin: ['gliclazide', 'metformin'],
  glibenclamide_metformin: ['glibenclamide', 'metformin'],
  empagliflozin_linagliptin: ['empagliflozin', 'linagliptin'],
  dapagliflozin_saxagliptin: ['dapagliflozin', 'saxagliptin'],
  insulin_glargine_lixisenatide: ['insulin_glargine', 'lixisenatide'],
  insulin_degludec_liraglutide: ['insulin_degludec', 'liraglutide'],

  // --- Lipid FDCs ---
  rosuvastatin_ezetimibe: ['rosuvastatin', 'ezetimibe'],
  atorvastatin_ezetimibe: ['atorvastatin', 'ezetimibe'],
  simvastatin_ezetimibe: ['simvastatin', 'ezetimibe'],
  amlodipine_atorvastatin: ['amlodipine', 'atorvastatin'],
  bempedoic_acid_ezetimibe: ['bempedoic_acid', 'ezetimibe'],

  // --- Respiratory FDCs ---
  budesonide_formoterol: ['budesonide', 'formoterol'],
  beclometasone_formoterol: ['beclometasone', 'formoterol'],
  fluticasone_salmeterol: ['fluticasone_propionate', 'salmeterol'],
  fluticasone_vilanterol: ['fluticasone_furoate', 'vilanterol'],
  mometasone_formoterol: ['mometasone', 'formoterol'],
  fluticasone_formoterol: ['fluticasone_propionate', 'formoterol'],
  indacaterol_glycopyrronium: ['indacaterol', 'glycopyrronium'],
  glycopyrronium_indacaterol: ['glycopyrronium', 'indacaterol'],
  tiotropium_olodaterol: ['tiotropium', 'olodaterol'],
  umeclidinium_vilanterol: ['umeclidinium', 'vilanterol'],
  aclidinium_formoterol: ['aclidinium', 'formoterol'],
  glycopyrronium_formoterol: ['glycopyrronium', 'formoterol'],
  ipratropium_salbutamol: ['ipratropium', 'salbutamol'],
  ipratropium_fenoterol: ['ipratropium', 'fenoterol'],
  fluticasone_umeclidinium_vilanterol: ['fluticasone_furoate', 'umeclidinium', 'vilanterol'],
  fluticasone_furoate_umeclidinium_vilanterol: ['fluticasone_furoate', 'umeclidinium', 'vilanterol'],
  beclometasone_formoterol_glycopyrronium: ['beclometasone', 'formoterol', 'glycopyrronium'],
  beclometasone_glycopyrronium_formoterol: ['beclometasone', 'glycopyrronium', 'formoterol'],
  budesonide_glycopyrronium_formoterol: ['budesonide', 'glycopyrronium', 'formoterol'],
  budesonide_formoterol_glycopyrronium: ['budesonide', 'formoterol', 'glycopyrronium'],
  indacaterol_glycopyrronium_mometasone: ['indacaterol', 'glycopyrronium', 'mometasone']
};

function sanitizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    // Strip trailing dosage strings like "12.5/1000 mg", "5mg/10mg", "100/62.5/25 mcg", "(Coveram)"
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)*\s*(?:mg|mcg|µg|ug|μg|g|iu|ml|%|viên|nhát|ống|bút|gói)?\b/gi, ' ')
    .replace(/\s*(?:\/|\+|&)\s*/g, '_')
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const CANONICAL_CACHE = new Map<string, string>();
const EXPAND_COMPONENTS_CACHE = new Map<string, readonly string[]>();

/**
 * Chuẩn hóa `drugId` hoặc tên biệt dược về khóa chuẩn trong KB / FDC map.
 */
export function resolveCanonicalDrugId(drugIdOrName: string): string {
  if (!drugIdOrName) return '';
  const hit = CANONICAL_CACHE.get(drugIdOrName);
  if (hit !== undefined) return hit;

  const direct = drugIdOrName.trim().toLowerCase().replace(/[\s\-]+/g, '_');
  let out: string;
  if (KB_DRUG_ALIASES[direct]) out = KB_DRUG_ALIASES[direct];
  else if (FDC_COMPONENT_MAP[direct]) out = direct;
  else {
    const cleaned = sanitizeToken(drugIdOrName);
    if (KB_DRUG_ALIASES[cleaned]) out = KB_DRUG_ALIASES[cleaned];
    else if (FDC_COMPONENT_MAP[cleaned]) out = cleaned;
    else out = cleaned || direct;
  }
  if (CANONICAL_CACHE.size < 4096) CANONICAL_CACHE.set(drugIdOrName, out);
  return out;
}

/**
 * Phân rã một `drugId` hoặc tên thuốc thành danh sách các hoạt chất đơn chất cấu thành.
 * Giữ nguyên `sacubitril_valsartan` làm thực thể ARNI đơn nhất.
 */
export function expandDrugComponents(drugIdOrName: string): string[] {
  if (!drugIdOrName) return [];
  const cached = EXPAND_COMPONENTS_CACHE.get(drugIdOrName);
  if (cached) return [...cached];

  const rawKey = drugIdOrName.trim().toLowerCase().replace(/[\s\-]+/g, '_');
  let out: string[];
  if (rawKey === 'sacubitril_valsartan' || KB_DRUG_ALIASES[rawKey] === 'sacubitril_valsartan') {
    out = ['sacubitril_valsartan'];
  } else if (FDC_COMPONENT_MAP[rawKey]) {
    out = [...FDC_COMPONENT_MAP[rawKey]];
  } else {
    const canonical = resolveCanonicalDrugId(drugIdOrName);
    if (canonical === 'sacubitril_valsartan') {
      out = ['sacubitril_valsartan'];
    } else if (FDC_COMPONENT_MAP[canonical]) {
      out = [...FDC_COMPONENT_MAP[canonical]];
    } else {
      const kb = hasDrug(canonical) ? drug(canonical) : hasDrug(rawKey) ? drug(rawKey) : undefined;
      if (kb?.components && kb.components.length > 1 && kb.id !== 'sacubitril_valsartan') {
        out = kb.components.map((comp: string) => resolveCanonicalDrugId(comp));
      } else {
        out = canonical ? [canonical] : [];
      }
    }
  }

  if (EXPAND_COMPONENTS_CACHE.size < 4096) EXPAND_COMPONENTS_CACHE.set(drugIdOrName, out);
  return [...out];
}

/**
 * Kiểm tra thuốc có phải là viên phối hợp cố định / bình hít đa thành phần hay không.
 */
export function isFdcDrug(drugIdOrName?: string): boolean {
  if (!drugIdOrName) return false;
  return expandDrugComponents(drugIdOrName).length > 1;
}

/**
 * Mở rộng toàn bộ `currentMeds` của bệnh nhân thành danh sách `ExpandedMed` ở mức hoạt chất thành phần,
 * vẫn bảo toàn tham chiếu tới `originalMed` để phát lệnh `[STOP]` / `[HOLD]` trực tiếp lên viên phối hợp gốc.
 */
export function expandCurrentMeds(currentMeds?: CurrentMed[]): ExpandedMed[] {
  const safeMeds = Array.isArray(currentMeds) ? currentMeds : [];
  const expanded: ExpandedMed[] = [];

  for (const med of safeMeds) {
    if (!med || (!med.drugId && !med.name)) continue;
    const rawIdentifier = med.drugId || med.name || '';
    const canonicalDrugId = resolveCanonicalDrugId(rawIdentifier);
    const compsFromId = expandDrugComponents(rawIdentifier);
    const comps =
      compsFromId.length > 1
        ? compsFromId
        : med.name
          ? (() => {
              const fromName = expandDrugComponents(med.name);
              return fromName.length > 1 ? fromName : compsFromId;
            })()
          : compsFromId;

    const isFdc = comps.length > 1;
    for (const componentId of comps) {
      expanded.push({
        originalMed: med,
        canonicalDrugId,
        componentId,
        isFdcComponent: isFdc,
        allComponentIds: comps
      });
    }
  }

  return expanded;
}
