/** Tập các bình hít chuyên biệt dạng bột khô (DPI) phụ thuộc lưu lượng đỉnh hít vào và chứa lactose */
export const DPI_INHALER_IDS = new Set<string>([
  'umeclidinium',
  'incruse',
  'incruse_ellipta',
  'glycopyrronium',
  'seebri',
  'seebri_breezhaler',
  'aclidinium',
  'eklira',
  'tudorza',
  'indacaterol',
  'onbrez',
  'onbrez_breezhaler',
  'vilanterol',
  'formoterol',
  'foradil',
  'oxis',
  'umeclidinium_vilanterol',
  'vilanterol_umeclidinium',
  'anoro',
  'anoro_ellipta',
  'glycopyrronium_indacaterol',
  'indacaterol_glycopyrronium',
  'ultibro',
  'ultibro_breezhaler',
  'aclidinium_formoterol',
  'duaklir',
  'duaklir_genuair',
  'fluticasone_furoate_umeclidinium_vilanterol',
  'fluticasone_umeclidinium_vilanterol',
  'trelegy',
  'trelegy_ellipta',
  'fluticasone_vilanterol',
  'fluticasone_furoate_vilanterol',
  'relvar',
  'relvar_ellipta',
  'breo',
  'breo_ellipta',
  'wixela',
  'wixela_inhub',
  'airduo',
  'enerzair',
  'enerzair_breezhaler',
  'mometasone_indacaterol_glycopyrronium',
  'spiriva_handihaler',
  'serevent_diskus',
  'seretide_accuhaler',
  'symbicort_turbuhaler',
  'foster_nexthaler',
  'trimbow_nexthaler',
  'pulmicort_turbuhaler',
]);

/** Tập các hoạt chất có cả dạng bột khô DPI chứa lactose lẫn dạng pMDI/SMI không chứa lactose */
export const DUAL_FORM_LACTOSE_INHALER_IDS = new Set<string>([
  'tiotropium',
  'spiriva',
  'salmeterol',
  'serevent',
  'fluticasone_salmeterol',
  'seretide',
  'advair',
  'budesonide_formoterol',
  'symbicort',
  'beclometasone_formoterol',
  'foster',
  'beclometasone_glycopyrronium_formoterol',
  'trimbow',
]);

export const SAMA_MONO_IDS = new Set<string>(['ipratropium', 'atrovent']);

/** Toàn bộ các chế phẩm chứa SAMA (đơn chất hoặc phối hợp SABA+SAMA như Berodual/Combivent) */
export const SAMA_CONTAINING_IDS = new Set<string>([
  'ipratropium',
  'atrovent',
  'ipratropium_fenoterol',
  'fenoterol_ipratropium',
  'berodual',
  'ipratropium_salbutamol',
  'salbutamol_ipratropium',
  'albuterol_ipratropium',
  'combivent',
  'duoneb',
]);

export const METHYLXANTHINE_IDS = new Set<string>([
  'theophylline',
  'aminophylline',
  'theostat',
  'diaphyllin',
]);

export const THEOPHYLLINE_CYP1A2_INHIBITOR_IDS = new Set<string>([
  'ciprofloxacin',
  'enoxacin',
  'fluvoxamine',
  'clarithromycin',
  'erythromycin',
  'cimetidine',
]);

export const CNS_DEPRESSANT_IDS = new Set<string>([
  'diazepam',
  'lorazepam',
  'midazolam',
  'alprazolam',
  'clonazepam',
  'bromazepam',
  'oxazepam',
  'temazepam',
  'chlordiazepoxide',
  'zolpidem',
  'zopiclone',
  'eszopiclone',
  'zaleplon',
  'morphine',
  'fentanyl',
  'hydromorphone',
  'oxycodone',
  'hydrocodone',
  'codeine',
  'tramadol',
  'tapentadol',
  'buprenorphine',
  'methadone',
  'pethidine',
  'phenobarbital',
]);

export const GABAPENTINOID_IDS = new Set<string>(['gabapentin', 'pregabalin']);

export const SYSTEMIC_STEROID_IDS = new Set<string>([
  'prednisolone',
  'prednisone',
  'methylprednisolone',
  'medrol',
  'solumedrol',
  'hydrocortisone',
  'dexamethasone',
]);

export const SELECTIVE_BB_IDS = new Set<string>([
  'bisoprolol',
  'metoprolol',
  'metoprolol_succinate',
  'metoprolol_tartrate',
  'nebivolol',
  'atenolol',
  'betaxolol',
  'esmolol',
]);

export const OPHTHALMIC_BB_IDS = new Set<string>([
  'timolol_ophthalmic',
  'levobunolol_ophthalmic',
  'carteolol_ophthalmic',
  'betaxolol_ophthalmic',
]);

export const NON_SELECTIVE_BB_IDS = new Set<string>([
  'propranolol',
  'nadolol',
  'timolol',
  'sotalol',
  'labetalol',
  'carvedilol',
  'pindolol',
]);

export const COPD_APPROVED_BIOLOGIC_IDS = new Set<string>(['dupilumab', 'mepolizumab']);

export const COPD_UNAPPROVED_BIOLOGIC_IDS = new Set<string>([
  'benralizumab',
  'omalizumab',
  'tezepelumab',
  'reslizumab',
  'depemokimab',
]);

export const RESPIRATORY_BIOLOGIC_IDS = new Set<string>([
  ...COPD_APPROVED_BIOLOGIC_IDS,
  ...COPD_UNAPPROVED_BIOLOGIC_IDS,
]);

export const STRONG_CYP3A4_INDUCER_IDS = new Set<string>([
  'rifampin',
  'rifampicin',
  'carbamazepine',
  'phenytoin',
  'phenobarbital',
  'enzalutamide',
]);

export const STRONG_CYP3A4_INHIBITOR_IDS = new Set<string>([
  'ritonavir',
  'nirmatrelvir_ritonavir',
  'paxlovid',
  'lopinavir_ritonavir',
  'atazanavir',
  'darunavir',
  'indinavir',
  'nelfinavir',
  'saquinavir',
  'boceprevir',
  'telaprevir',
  'cobicistat',
  'ketoconazole',
  'itraconazole',
  'voriconazole',
  'posaconazole',
  'clarithromycin',
  'erythromycin',
  'roxithromycin',
  'telithromycin',
]);

export const CYP3A4_SENSITIVE_INHALER_IDS = new Set<string>([
  'salmeterol',
  'serevent',
  'serevent_diskus',
  'serevent_evohaler',
  'vilanterol',
  'umeclidinium_vilanterol',
  'vilanterol_umeclidinium',
  'anoro',
  'anoro_ellipta',
  'fluticasone_salmeterol',
  'seretide',
  'seretide_accuhaler',
  'seretide_evohaler',
  'advair',
  'wixela',
  'wixela_inhub',
  'airduo',
  'fluticasone_vilanterol',
  'fluticasone_furoate_vilanterol',
  'relvar',
  'relvar_ellipta',
  'breo',
  'breo_ellipta',
  'fluticasone_furoate_umeclidinium_vilanterol',
  'fluticasone_umeclidinium_vilanterol',
  'trelegy',
  'trelegy_ellipta',
  'fluticasone',
  'fluticasone_propionate',
  'flixotide',
  'fluticasone_furoate',
  'arnuity',
]);

export const ROFLUMILAST_CONTRA_CYP_INHIBITOR_IDS = new Set<string>(['fluvoxamine', 'enoxacin']);

export const ROFLUMILAST_CAUTION_CYP_INHIBITOR_IDS = new Set<string>([
  'cimetidine',
  'erythromycin',
  'clarithromycin',
  'ketoconazole',
  'itraconazole',
  'voriconazole',
  'posaconazole',
  'ritonavir',
  'nirmatrelvir_ritonavir',
  'cobicistat',
  'ethinyl_estradiol',
  'gestodene_ethinyl_estradiol',
]);

export const ANTICOAGULANT_DRUG_IDS = new Set<string>([
  'apixaban',
  'rivaroxaban',
  'dabigatran',
  'edoxaban',
  'warfarin',
  'acenocoumarol',
  'enoxaparin',
  'heparin',
  'dalteparin',
  'nadroparin',
  'fondaparinux',
]);

export const VKA_DRUG_IDS = new Set<string>(['warfarin', 'acenocoumarol']);

export const QT_PROLONGING_DRUG_IDS = new Set<string>([
  'amiodarone',
  'sotalol',
  'dronedarone',
  'quinidine',
  'procainamide',
  'disopyramide',
  'dofetilide',
  'ibutilide',
  'propafenone',
  'flecainide',
  'domperidone',
  'levofloxacin',
  'moxifloxacin',
  'ciprofloxacin',
  'clarithromycin',
  'erythromycin',
  'roxithromycin',
  'spiramycin',
  'haloperidol',
  'chlorpromazine',
  'quetiapine',
  'olanzapine',
  'ziprasidone',
  'risperidone',
  'sulpiride',
  'amisulpride',
  'ondansetron',
  'escitalopram',
  'citalopram',
  'fluconazole',
  'itraconazole',
  'voriconazole',
  'posaconazole',
  'ketoconazole',
  'cilostazol',
  'ivabradine',
  'ranolazine',
  'methadone',
  'hydroxychloroquine',
]);
