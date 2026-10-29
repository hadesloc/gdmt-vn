import type { ModuleId } from '../engine/types';
import { getAllDrugs, hasDrug, type DrugEntry } from '../kb-types';

export type MedicationGroup = { id: string; label: string; drugIds: string[] };

type GroupSpec = { id: string; label: string; classes?: string[]; allClasses?: string[]; drugIds?: string[] };

const MODULE_GROUPS: Record<Exclude<ModuleId, '_demo'>, GroupSpec[]> = {
  // Preserve the established HF row order and hand-curated memberships.
  hf: [
    { id: 'sglt2i', label: 'Ức chế SGLT2', drugIds: ['dapagliflozin', 'empagliflozin'] },
    { id: 'mra', label: 'MRA', drugIds: ['spironolactone', 'eplerenone', 'finerenone'] },
    { id: 'acei_arb_arni', label: 'ACEi / ARB / ARNI', drugIds: ['sacubitril_valsartan', 'captopril', 'enalapril', 'lisinopril', 'candesartan', 'losartan', 'valsartan'] },
    { id: 'beta_blockers', label: 'Chẹn beta', drugIds: ['bisoprolol', 'carvedilol', 'metoprolol_succinate', 'nebivolol'] },
    { id: 'hf_extras', label: 'Thuốc suy tim khác', drugIds: ['ivabradine', 'vericiguat', 'digoxin', 'hydralazine', 'isosorbide_dinitrate'] },
    { id: 'diuretics', label: 'Lợi tiểu', drugIds: ['furosemide', 'torsemide', 'bumetanide', 'hydrochlorothiazide', 'metolazone', 'chlorthalidone', 'acetazolamide'] },
    { id: 'potassium_binders', label: 'Thuốc gắn kali', classes: ['potassium_binder'] },
    { id: 'metabolic_iron', label: 'GLP-1 / Sắt', drugIds: ['semaglutide', 'tirzepatide', 'ferric_carboxymaltose', 'ferric_derisomaltose'] },
  ],
  asthma: [
    { id: 'asthma_relievers', label: 'Thuốc giãn phế quản cắt cơn', classes: ['saba', 'sama'] },
    { id: 'asthma_adjuvants', label: 'Thuốc hỗ trợ trong đợt cấp', classes: ['adjuvant_bronchodilator'] },
    { id: 'asthma_triple', label: 'Phối hợp ICS-LABA-LAMA', allClasses: ['ics', 'laba', 'lama'] },
    { id: 'asthma_ics_laba', label: 'Phối hợp ICS-LABA', allClasses: ['ics', 'laba'] },
    { id: 'asthma_lama_laba', label: 'Phối hợp LAMA-LABA', allClasses: ['lama', 'laba'] },
    { id: 'asthma_ics', label: 'Corticosteroid dạng hít (ICS)', classes: ['ics'] },
    { id: 'asthma_lama', label: 'Kháng muscarinic tác dụng kéo dài (LAMA)', classes: ['lama'] },
    { id: 'asthma_other_controllers', label: 'Thuốc kiểm soát hen khác', classes: ['ltra'] },
    { id: 'asthma_biologics', label: 'Thuốc sinh học điều trị hen', classes: ['biologic_asthma', 'biologic_anti_il5', 'biologic_anti_il5ra', 'biologic_anti_il4ra', 'respiratory_biologic'] },
    { id: 'asthma_systemic_steroids', label: 'Corticosteroid toàn thân', classes: ['systemic_corticosteroid'] },
    { id: 'asthma_other', label: 'Thuốc hô hấp hỗ trợ khác', classes: ['methylxanthine'] },
  ],
  copd: [
    { id: 'copd_triple', label: 'Phối hợp ICS-LABA-LAMA', allClasses: ['ics', 'laba', 'lama'] },
    { id: 'copd_lama_laba', label: 'Phối hợp LAMA-LABA', allClasses: ['lama', 'laba'] },
    { id: 'copd_ics_laba', label: 'Phối hợp ICS-LABA', allClasses: ['ics', 'laba'] },
    { id: 'copd_lama', label: 'LAMA', classes: ['lama'] },
    { id: 'copd_laba', label: 'LABA', classes: ['laba'] },
    { id: 'copd_ics', label: 'Corticosteroid dạng hít (ICS)', classes: ['ics'] },
    { id: 'copd_relievers', label: 'Thuốc giãn phế quản cắt cơn', classes: ['saba', 'sama'] },
    { id: 'copd_systemic_steroids', label: 'Corticosteroid toàn thân', classes: ['systemic_corticosteroid'] },
    { id: 'copd_macrolides', label: 'Macrolide', classes: ['macrolide'] },
    { id: 'copd_biologics', label: 'Thuốc sinh học / điều hòa viêm', classes: ['biologic_copd', 'biologic_anti_il4ra', 'respiratory_biologic'] },
    { id: 'copd_other', label: 'Thuốc COPD hỗ trợ khác', classes: ['pde4i', 'pde3_pde4_inhibitor', 'methylxanthine'] },
  ],
  dm2: [
    { id: 'dm2_biguanide', label: 'Biguanide', classes: ['biguanide'] },
    { id: 'dm2_sglt2', label: 'Ức chế SGLT2', classes: ['sglt2i'] },
    { id: 'dm2_glp1_gip', label: 'Đồng vận GLP-1 / GIP-GLP-1', classes: ['gip_glp1_ra', 'glp1ra', 'glp1_ra'] },
    { id: 'dm2_dpp4', label: 'Ức chế DPP-4', classes: ['dpp4i'] },
    { id: 'dm2_sulfonylurea', label: 'Sulfonylurea', classes: ['su', 'sulfonylurea'] },
    { id: 'dm2_tzd', label: 'Thiazolidinedione (TZD)', classes: ['tzd'] },
    { id: 'dm2_alpha_glucosidase', label: 'Ức chế alpha-glucosidase', classes: ['ag_inhibitor', 'alpha_glucosidase_inhibitor'] },
    { id: 'dm2_insulin_basal', label: 'Insulin nền', classes: ['insulin_basal'] },
    { id: 'dm2_insulin_meal', label: 'Insulin bữa ăn / tác dụng nhanh', classes: ['insulin_bolus'] },
    { id: 'dm2_insulin_premix', label: 'Insulin pha trộn', classes: ['insulin_premix'] },
  ],
  ckd: [
    { id: 'ckd_rasi', label: 'Ức chế hệ RAA (ACEi / ARB)', classes: ['acei', 'arb'] },
    { id: 'ckd_sglt2', label: 'Ức chế SGLT2', classes: ['sglt2i'] },
    { id: 'ckd_ns_mra', label: 'MRA không steroid', classes: ['mra_nonsteroidal'] },
    { id: 'ckd_k_binders', label: 'Thuốc gắn kali', classes: ['potassium_binder'] },
    { id: 'ckd_acidosis', label: 'Kiềm hóa điều trị toan chuyển hóa', classes: ['alkalinizing_agent'] },
    { id: 'ckd_diuretics', label: 'Thuốc lợi tiểu', classes: ['loop_diuretic', 'thiazide_diuretic', 'diuretic'] },
  ],
  htn: [
    { id: 'htn_rasi', label: 'ACEi / ARB / ARNI', classes: ['acei', 'arb', 'arni'] },
    { id: 'htn_beta_blocker', label: 'Chẹn beta', classes: ['bb_selective', 'bb_nonselective', 'beta_blocker'] },
    { id: 'htn_ccb', label: 'Chẹn kênh canxi (CCB)', classes: ['dhp_ccb', 'ndhp_ccb'] },
    { id: 'htn_diuretics', label: 'Thuốc lợi tiểu', classes: ['thiazide_diuretic', 'loop_diuretic', 'diuretic'] },
    { id: 'htn_mra', label: 'Đối kháng thụ thể mineralocorticoid (MRA)', classes: ['mra', 'mra_steroidal', 'mra_nonsteroidal'] },
    { id: 'htn_other', label: 'Thuốc hạ huyết áp nhóm khác', classes: ['central_alpha2_agonist', 'central_imidazoline_agonist', 'alpha1_blocker', 'renin_inhibitor', 'vasodilator', 'direct_vasodilator'] },
  ],
  gout: [
    { id: 'gout_urate_lowering', label: 'Thuốc hạ urat lâu dài', classes: ['urate_lowering', 'xoi', 'uricosuric', 'uricase'] },
    { id: 'gout_flare_prophylaxis', label: 'Thuốc chống viêm cơn gút / dự phòng cơn', classes: ['anti_gout', 'colchicine', 'nsaid', 'cox2_selective'] },
    { id: 'gout_steroids', label: 'Corticosteroid điều trị cơn gút', classes: ['systemic_corticosteroid'] },
  ],
  lipid: [
    { id: 'lipid_statin', label: 'Statin', classes: ['statin'] },
    { id: 'lipid_ezetimibe', label: 'Ức chế hấp thu cholesterol (ezetimibe)', classes: ['cholesterol_absorption_inhibitor'] },
    { id: 'lipid_pcsk9', label: 'Thuốc tác động PCSK9', classes: ['pcsk9i', 'pcsk9_mab', 'pcsk9_sirna'] },
    { id: 'lipid_other', label: 'Thuốc điều trị lipid nhóm khác', classes: ['fibrate', 'bile_acid_sequestrant', 'acl_inhibitor', 'atp_citrate_lyase_inhibitor', 'omega3', 'omega3_epa'] },
  ],
  af: [
    { id: 'af_doac', label: 'Thuốc chống đông DOAC', classes: ['doac'] },
    { id: 'af_vka', label: 'Kháng vitamin K (VKA)', classes: ['vka'] },
    { id: 'af_other_anticoag', label: 'Thuốc chống đông đường uống khác', classes: ['oac'] },
    { id: 'af_rate_beta', label: 'Chẹn beta kiểm soát tần số', classes: ['bb_selective', 'bb_nonselective', 'beta_blocker'] },
    { id: 'af_rate_ccb', label: 'CCB kiểm soát tần số', classes: ['ndhp_ccb'] },
    { id: 'af_rate_digoxin', label: 'Digoxin kiểm soát tần số', classes: ['cardiac_glycoside'] },
    { id: 'af_rhythm', label: 'Thuốc kiểm soát nhịp', classes: ['antiarrhythmic_iii', 'antiarrhythmic_ic'] },
  ],
};

const FALLBACK_GROUPS: GroupSpec[] = [
  { id: 'fallback_sglt2', label: 'Ức chế SGLT2', classes: ['sglt2i'] },
  { id: 'fallback_rasi', label: 'ACEi / ARB / ARNI', classes: ['acei', 'arb', 'arni'] },
  { id: 'fallback_beta', label: 'Chẹn beta', classes: ['bb_selective', 'bb_nonselective', 'beta_blocker'] },
  { id: 'fallback_diabetes', label: 'Thuốc điều trị đái tháo đường', classes: ['biguanide', 'glp1ra', 'glp1_ra', 'gip_glp1_ra', 'dpp4i', 'su', 'sulfonylurea', 'tzd', 'ag_inhibitor', 'alpha_glucosidase_inhibitor', 'insulin', 'insulin_basal', 'insulin_bolus', 'insulin_premix'] },
  { id: 'fallback_lipid', label: 'Thuốc điều trị lipid máu', classes: ['statin', 'cholesterol_absorption_inhibitor', 'pcsk9i', 'pcsk9_mab', 'pcsk9_sirna'] },
  { id: 'fallback_respiratory', label: 'Thuốc hô hấp', classes: ['ics', 'laba', 'lama', 'saba', 'sama'] },
];

const matches = (drug: DrugEntry, spec: GroupSpec) => {
  const classes = new Set((drug.classes || []).map((c) => String(c).toLowerCase()));
  const classMatch = (spec.allClasses?.every((drugClass) => classes.has(drugClass)) ?? false)
    || (spec.classes?.some((drugClass) => classes.has(drugClass)) ?? false);
  return (spec.drugIds?.includes(drug.id) || classMatch) && hasDrug(drug.id);
};

export function getMedicationGroups(moduleIds: ModuleId[]): MedicationGroup[] {
  const supportedModules = new Set(moduleIds.filter((id): id is Exclude<ModuleId, '_demo'> => id !== '_demo' && id in MODULE_GROUPS));
  const specs = supportedModules.size
    ? (['hf', 'asthma', 'copd', 'dm2', 'ckd', 'htn', 'gout', 'lipid', 'af'] as const)
      .filter((id) => supportedModules.has(id))
      .flatMap((id) => MODULE_GROUPS[id])
    : FALLBACK_GROUPS;
  const drugs = getAllDrugs();
  const groups = new Map<string, MedicationGroup>();
  for (const spec of specs) {
    const ids = (spec.drugIds
      ? spec.drugIds.filter((id) => hasDrug(id))
      : drugs.filter((drug) => matches(drug, spec)).map((drug) => drug.id).filter((id) => hasDrug(id)))
      // Both KB IDs describe the same Trelegy components. Offer its explicit
      // furoate entry once; legacy records remain available through the editor.
      .filter((id) => id !== 'fluticasone_umeclidinium_vilanterol');
    if (!ids.length) continue;
    const group = groups.get(spec.id);
    if (group) {
      if (group.label !== spec.label && !group.label.includes(spec.label)) group.label = `${group.label} / ${spec.label}`;
      for (const id of ids) if (!group.drugIds.includes(id)) group.drugIds.push(id);
    } else {
      groups.set(spec.id, { id: spec.id, label: spec.label, drugIds: [...new Set(ids)] });
    }
  }

  // Deduplicate at drug level so partial overlap keeps the remaining choices visible.
  const used = new Set<string>();
  return [...groups.values()].map((group) => {
    const drugIds = group.drugIds.filter((id) => {
      if (used.has(id) || !hasDrug(id)) return false;
      used.add(id);
      return true;
    });
    return { ...group, drugIds };
  }).filter((group) => group.drugIds.length > 0);
}
