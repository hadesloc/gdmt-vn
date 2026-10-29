/**
 * GDMT-VN Module Hen phế quản (Asthma) - Hằng số phân nhóm thuốc & thiết bị
 * Phân quyền: Agent M
 */

export const MONO_ICS_DRUGS = new Set([
  'budesonide',
  'fluticasone_propionate',
  'fluticasone_furoate',
  'beclometasone',
  'ciclesonide',
  'mometasone'
]);

export const MART_ICS_FORMOTEROL_DRUGS = new Set([
  'budesonide_formoterol',
  'beclometasone_formoterol'
]);

export const TRACK2_ICS_LABA_DRUGS = new Set([
  'fluticasone_salmeterol',
  'fluticasone_vilanterol',
  'mometasone_formoterol'
]);

export const TRIPLE_INHALER_DRUGS = new Set([
  'fluticasone_furoate_umeclidinium_vilanterol',
  'fluticasone_umeclidinium_vilanterol',
  'trelegy',
  'budesonide_glycopyrronium_formoterol',
  'breztri',
  'beclometasone_glycopyrronium_formoterol',
  'beclometasone_formoterol_glycopyrronium',
  'trimbow',
  'indacaterol_glycopyrronium_mometasone',
  'mometasone_indacaterol_glycopyrronium',
  'enerzair'
]);

export const ADULT_18_ONLY_DRUGS = new Set([
  'beclometasone_formoterol',
  'foster',
  'fluticasone_furoate_umeclidinium_vilanterol',
  'fluticasone_umeclidinium_vilanterol',
  'trelegy',
  'beclometasone_glycopyrronium_formoterol',
  'beclometasone_formoterol_glycopyrronium',
  'trimbow',
  'indacaterol_glycopyrronium_mometasone',
  'mometasone_indacaterol_glycopyrronium',
  'enerzair'
]);

export const DPI_ONLY_LACTOSE_DRUGS = new Set([
  'fluticasone_vilanterol',
  'relvar',
  'fluticasone_furoate',
  'arnuity',
  'fluticasone_furoate_umeclidinium_vilanterol',
  'fluticasone_umeclidinium_vilanterol',
  'trelegy',
  'glycopyrronium_indacaterol',
  'indacaterol_glycopyrronium',
  'ultibro',
  'umeclidinium_vilanterol',
  'anoro',
  'aclidinium',
  'tudorza',
  'umeclidinium',
  'incruse',
  'indacaterol',
  'onbrez',
  'glycopyrronium',
  'seebri',
  'indacaterol_glycopyrronium_mometasone',
  'mometasone_indacaterol_glycopyrronium',
  'enerzair'
]);

export const DUAL_FORMULATION_INHALER_DRUGS = new Set([
  'salmeterol',
  'serevent',
  'budesonide_formoterol',
  'beclometasone_formoterol',
  'fluticasone_salmeterol',
  'budesonide',
  'fluticasone_propionate'
]);

export const COMBO_ICS_CONTROLLER_DRUGS = new Set([
  ...MART_ICS_FORMOTEROL_DRUGS,
  ...TRACK2_ICS_LABA_DRUGS,
  ...TRIPLE_INHALER_DRUGS,
  'symbicort',
  'foster',
  'seretide',
  'relvar',
  'dulera'
]);

export const ICS_CONTAINING_DRUGS = new Set([
  ...MONO_ICS_DRUGS,
  ...COMBO_ICS_CONTROLLER_DRUGS
]);

export const SABA_DRUGS = new Set([
  'salbutamol',
  'albuterol',
  'terbutaline',
  'fenoterol',
  'ventolin',
  'bricanyl'
]);

export const LABA_WITHOUT_ICS_DRUGS = new Set([
  'salmeterol',
  'formoterol',
  'indacaterol',
  'olodaterol',
  'vilanterol',
  'tiotropium_olodaterol',
  'umeclidinium_vilanterol',
  'indacaterol_glycopyrronium',
  'glycopyrronium_indacaterol',
  'aclidinium_formoterol',
  'glycopyrronium_formoterol'
]);

export const LAMA_WITHOUT_ICS_DRUGS = new Set([
  'tiotropium',
  'umeclidinium',
  'glycopyrronium',
  'aclidinium'
]);

export const METHYLXANTHINE_DRUGS = new Set([
  'theophylline',
  'aminophylline'
]);

export const LABA_ALL_DRUGS = new Set([
  ...LABA_WITHOUT_ICS_DRUGS,
  ...MART_ICS_FORMOTEROL_DRUGS,
  ...TRACK2_ICS_LABA_DRUGS,
  ...TRIPLE_INHALER_DRUGS
]);

export const NON_SELECTIVE_BB_DRUGS = new Set([
  'propranolol',
  'carvedilol',
  'nadolol',
  'timolol',
  'timolol_ophthalmic',
  'dorzolamide_timolol',
  'brimonidine_timolol',
  'travoprost_timolol',
  'latanoprost_timolol',
  'bimatoprost_timolol',
  'sotalol',
  'labetalol',
  'pindolol',
  'carteolol',
  'levobunolol'
]);

export const SYSTEMIC_NON_SELECTIVE_BB_DRUGS = new Set([
  'carvedilol',
  'propranolol',
  'nadolol',
  'sotalol',
  'labetalol',
  'pindolol'
]);

export const AERD_COX1_NSAID_DRUGS = new Set([
  'aspirin',
  'ibuprofen',
  'naproxen',
  'diclofenac',
  'ketorolac',
  'meloxicam',
  'piroxicam',
  'indomethacin',
  'mefenamic_acid',
  'dexketoprofen',
  'ketoprofen',
  'tenoxicam'
]);

export const AERD_SELECTIVE_COX2_DRUGS = new Set([
  'celecoxib',
  'etoricoxib'
]);

export const ACUTE_SEDATIVE_DRUGS = new Set([
  'diazepam',
  'lorazepam',
  'midazolam',
  'alprazolam',
  'clonazepam',
  'bromazepam',
  'zolpidem',
  'zopiclone',
  'phenobarbital',
  'morphine',
  'fentanyl',
  'codeine',
  'tramadol'
]);

export const CYP3A4_SENSITIVE_ICS_LABA_DRUGS = new Set([
  'budesonide',
  'fluticasone_propionate',
  'fluticasone_furoate',
  'mometasone',
  'ciclesonide',
  'budesonide_formoterol',
  'fluticasone_salmeterol',
  'fluticasone_vilanterol',
  'mometasone_formoterol',
  'fluticasone_furoate_umeclidinium_vilanterol',
  'fluticasone_umeclidinium_vilanterol',
  'budesonide_glycopyrronium_formoterol',
  'indacaterol_glycopyrronium_mometasone',
  'mometasone_indacaterol_glycopyrronium'
]);

// Includes guideline-listed respiratory interactions, not only strong systemic inhibition.
export { RESPIRATORY_CYP3A4_INHIBITOR_IDS as STRONG_CYP3A4_INHIBITOR_DRUGS } from '../../engine/safety/inhaledCypSafety';

export const ASTHMA_TYPE2_BIOLOGIC_DRUGS = new Set([
  'omalizumab',
  'mepolizumab',
  'benralizumab',
  'dupilumab',
  'tezepelumab',
  'reslizumab'
]);

export const LACTATION_CAUTION_ASTHMA_DRUGS = new Set([
  'prednisolone',
  'methylprednisolone',
  'montelukast',
  'theophylline',
  'aminophylline',
  'omalizumab',
  'benralizumab',
  'dupilumab',
  'tezepelumab'
]);
