/**
 * GDMT-VN Safety - Duplicate Class Rules & Inhaler/FDC Decomposition
 * Phân quyền: Agent B
 */

import { isOphthalmicBetaBlocker, resolveKbDrugId } from './drugClassify';
import { expandDrugComponents } from './fdcMap';
import {
  type InhalerDecomposition,
  INHALER_COMBINATIONS,
  SINGLE_INHALERS,
  getExpandedDuplicateClasses,
  isMaintenanceInhalerClasses
} from './inhalerDuplicateMap';

export {
  type InhalerDecomposition,
  INHALER_COMBINATIONS,
  SINGLE_INHALERS,
  getExpandedDuplicateClasses,
  isMaintenanceInhalerClasses
};

export interface DuplicateRule {
  id: string;
  className: string;
  classes: string[];
  drugIds: string[];
  requiresAnyOf?: string[];
  requiresAllClasses?: string[];
  severity: 'critical' | 'warning';
  titleVi: string;
  messageVi: string;
  citationIds: string[];
}

export const DUPLICATE_CLASS_RULES: DuplicateRule[] = [
  {
    id: 'dup.rasi_arni',
    className: 'RASi / ARNI / Aliskiren',
    classes: ['acei', 'arb', 'arni', 'rasi', 'renin_inhibitor'],
    drugIds: [
      'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
      'benazepril', 'fosinopril', 'trandolapril', 'quinapril', 'moexipril',
      'losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan', 'olmesartan', 'azilsartan',
      'sacubitril_valsartan', 'aliskiren'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp ức chế hệ RAA (ACEi / ARB / ARNI / Aliskiren)',
    messageVi: 'Chống chỉ định phối hợp đồng thời ≥ 2 thuốc ức chế hệ RAA (ACEi + ARB, ACEi/ARB + ARNI, hoặc phối hợp Aliskiren) do nguy cơ hạ huyết áp, tăng kali máu và suy thận cấp. Cần ngừng ACEi ít nhất 36 giờ trước khi khởi trị ARNI.',
    citationIds: [
      'kdigo.ckd.2024.rec_3_6_4_avoid_dual_rasi',
      'esc.htn.2024.ban_dual_rasi',
      'esc.hf.2026.washout_acei_arni_36h'
    ]
  },
  {
    id: 'dup.mra',
    className: 'MRA',
    classes: ['mra', 'mra_steroidal', 'mra_nonsteroidal'],
    drugIds: ['spironolactone', 'eplerenone', 'finerenone'],
    severity: 'critical',
    titleVi: 'Trùng lặp thuốc đối kháng thụ thể mineralocorticoid (MRA)',
    messageVi: 'Không phối hợp đồng thời 2 thuốc MRA (spironolactone/eplerenone + finerenone) do nguy cơ tăng kali máu nghiêm trọng.',
    citationIds: [
      'esc.hf.2026.mra_guidance_table_s8',
      'aha.acc.2025.table13_spiro_egfr45',
      'fda.finerenone.table_2_dose_adjustment'
    ]
  },
  {
    id: 'dup.anticoagulant',
    className: 'Thuốc chống đông',
    classes: ['doac', 'vka', 'oac', 'anticoagulant', 'parenteral_anticoagulant'],
    drugIds: [
      'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban',
      'warfarin', 'acenocoumarol',
      'enoxaparin', 'heparin', 'dalteparin', 'nadroparin', 'tinzaparin', 'fondaparinux'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc chống đông (DOAC / VKA / Heparin / LMWH)',
    messageVi: 'Nguy cơ xuất huyết đe dọa tính mạng khi dùng chồng chéo ≥ 2 thuốc chống đông (DOAC, kháng vitamin K Warfarin/Acenocoumarol, Enoxaparin/Heparin/Fondaparinux) mà không tạm ngưng thuốc nền.',
    citationIds: ['esc.af.2024.bleeding_modifiable_factors', 'esc.af.2024.aspirin_stop_when_oac']
  },
  {
    id: 'dup.dpp4i',
    className: 'DPP-4i',
    classes: ['dpp4i'],
    drugIds: ['sitagliptin', 'linagliptin', 'vildagliptin', 'saxagliptin', 'alogliptin'],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc ức chế DPP-4',
    messageVi: 'Không phối hợp đồng thời 2 thuốc nhóm ức chế DPP-4 (kể cả trong viên phối hợp với Metformin/SGLT2i).',
    citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1']
  },
  {
    id: 'dup.glp1ra',
    className: 'GLP-1 RA / GIP-GLP-1 RA',
    classes: ['glp1ra'],
    drugIds: [
      'semaglutide', 'semaglutide_oral', 'dulaglutide', 'liraglutide', 'lixisenatide', 'exenatide', 'tirzepatide',
      'insulin_glargine_lixisenatide', 'insulin_degludec_liraglutide'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc đồng vận thụ thể GLP-1 / GIP-GLP-1',
    messageVi: 'Chống chỉ định dùng đồng thời 2 chế phẩm đồng vận GLP-1 / GIP-GLP-1 (kể cả bút tiêm phối hợp Insulin + GLP-1 RA).',
    citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1', 'kdigo.ckd.2024.rec_3_9_1_glp1ra_t2d']
  },
  {
    id: 'dup.dpp4_glp1',
    className: 'DPP-4i & GLP-1 RA',
    classes: ['dpp4i', 'glp1ra'],
    drugIds: [
      'sitagliptin', 'linagliptin', 'vildagliptin', 'saxagliptin', 'alogliptin',
      'semaglutide', 'semaglutide_oral', 'dulaglutide', 'liraglutide', 'lixisenatide', 'exenatide', 'tirzepatide',
      'insulin_glargine_lixisenatide', 'insulin_degludec_liraglutide'
    ],
    requiresAllClasses: ['dpp4i', 'glp1ra'],
    severity: 'warning',
    titleVi: 'Phối hợp DPP-4i và GLP-1 RA',
    messageVi: 'Không khuyến cáo phối hợp đồng thời DPP-4i và GLP-1 RA vì cùng tác động trên trục incretin và không gia tăng hiệu quả lâm sàng.',
    citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1']
  },
  {
    id: 'dup.bb',
    className: 'Thuốc chẹn beta',
    classes: ['beta_blocker', 'bb_selective', 'bb_nonselective'],
    drugIds: [
      'bisoprolol', 'carvedilol', 'metoprolol_succinate', 'metoprolol_tartrate', 'metoprolol',
      'nebivolol', 'atenolol', 'propranolol', 'nadolol', 'timolol', 'labetalol',
      'celiprolol', 'betaxolol', 'acebutolol', 'pindolol', 'sotalol', 'esmolol'
    ],
    severity: 'warning',
    titleVi: 'Trùng lặp 2 thuốc chẹn beta giao cảm',
    messageVi: 'Không sử dụng đồng thời 2 thuốc chẹn beta giao cảm đường toàn thân (nguy cơ chậm nhịp tim nặng, bloc nhĩ thất và tụt huyết áp).',
    citationIds: ['esc.hf.2026.bb_guidance_table_s6', 'esc.af.2024.rate_control_lvef_preserved']
  },
  {
    id: 'dup.sglt2i',
    className: 'SGLT2i',
    classes: ['sglt2i'],
    drugIds: [
      'dapagliflozin', 'empagliflozin', 'canagliflozin', 'ertugliflozin', 'sotagliflozin',
      'empagliflozin_metformin', 'dapagliflozin_metformin', 'canagliflozin_metformin', 'ertugliflozin_metformin'
    ],
    severity: 'warning',
    titleVi: 'Trùng lặp 2 thuốc ức chế SGLT2',
    messageVi: 'Chỉ định 1 thuốc ức chế SGLT2 duy nhất cho bệnh nhân.',
    citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d', 'kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf']
  },
  {
    id: 'dup.su',
    className: 'Sulfonylurea (SU)',
    classes: ['su', 'sulfonylurea'],
    drugIds: [
      'gliclazide', 'glimepiride', 'glibenclamide', 'glyburide', 'glipizide',
      'chlorpropamide', 'tolbutamide',
      'gliclazide_metformin', 'glimepiride_metformin', 'glibenclamide_metformin', 'glyburide_metformin'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp 2 thuốc nhóm Sulfonylurea (SU)',
    messageVi: 'Chống chỉ định phối hợp đồng thời ≥ 2 thuốc nhóm Sulfonylurea do cùng gắn thụ thể SUR1 tế bào beta tụy, gây hạ đường huyết nặng kéo dài.',
    citationIds: ['fda.glimepiride.hypo_elderly_renal', 'ada.dm2.2026.older_overtreatment_su_insulin']
  },
  {
    id: 'dup.su_meglitinide',
    className: 'Sulfonylurea / Meglitinide (Glinide)',
    classes: ['su', 'sulfonylurea', 'meglitinide'],
    drugIds: [
      'repaglinide', 'nateglinide', 'mitiglinide',
      'gliclazide', 'glimepiride', 'glibenclamide', 'glyburide', 'glipizide'
    ],
    requiresAnyOf: ['meglitinide', 'repaglinide', 'nateglinide', 'mitiglinide'],
    severity: 'critical',
    titleVi: 'Trùng lặp thuốc kích thích tiết Insulin (Meglitinide + SU / Meglitinide)',
    messageVi: 'Không phối hợp Repaglinide/Nateglinide với Sulfonylurea hoặc 2 thuốc nhóm Meglitinide do trùng cơ chế đóng kênh K-ATP tế bào beta gây hạ đường huyết nặng.',
    citationIds: ['fda.glimepiride.hypo_elderly_renal', 'ada.dm2.2026.older_overtreatment_su_insulin']
  },
  {
    id: 'dup.basal_insulin',
    className: 'Insulin nền tác dụng kéo dài (Long-acting Basal Insulin)',
    classes: [],
    drugIds: [
      'insulin_glargine', 'glargine', 'lantus', 'toujeo',
      'insulin_degludec', 'degludec', 'tresiba',
      'insulin_detemir', 'detemir', 'levemir'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 Insulin nền tác dụng kéo dài (Long-acting Basal Insulin)',
    messageVi: 'Nguy cơ hạ đường huyết nặng kéo dài khi sử dụng đồng thời ≥ 2 loại insulin nền analog tác dụng kéo dài. Chỉ duy trì 1 chế phẩm insulin nền duy nhất.',
    citationIds: ['ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.overbasalization']
  },
  {
    id: 'dup.premix_basal_bolus',
    className: 'Insulin trộn sẵn (Premix) chồng chéo với Insulin nền / nhanh',
    classes: ['insulin_premix', 'insulin_basal', 'insulin_bolus'],
    drugIds: [
      'insulin_premix', 'premix', 'mixtard', 'novomix', 'humalog_mix', 'ryzodeg',
      'insulin_glargine', 'glargine', 'lantus', 'toujeo', 'basaglar',
      'insulin_degludec', 'degludec', 'tresiba',
      'insulin_detemir', 'detemir', 'levemir',
      'insulin_nph', 'nph', 'insulatard', 'humulin_n', 'novolin_n',
      'insulin_aspart', 'aspart', 'novorapid', 'fiasp',
      'insulin_lispro', 'lispro', 'humalog',
      'insulin_glulisine', 'glulisine', 'apidra',
      'insulin_regular', 'regular', 'actrapid', 'humulin_r', 'novolin_r'
    ],
    requiresAnyOf: ['insulin_premix'],
    severity: 'critical',
    titleVi: 'Trùng lặp nguy hiểm Insulin trộn sẵn (Premix) với Insulin nền / Insulin nhanh',
    messageVi: 'Chống chỉ định phối hợp đồng thời Insulin trộn sẵn (Premix) chung với Insulin nền hoặc Insulin tác dụng nhanh bữa ăn do chồng liều insulin gây hạ đường huyết đe dọa tính mạng.',
    citationIds: ['byt.dm2.2020.premix_split_2_3', 'ada.dm2.2026.overbasalization', 'ada.dm2.2026.prandial_insulin_eating']
  },
  {
    id: 'dup.statin',
    className: 'Statin',
    classes: ['statin'],
    drugIds: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'pitavastatin', 'fluvastatin', 'lovastatin'],
    severity: 'warning',
    titleVi: 'Trùng lặp 2 thuốc nhóm Statin',
    messageVi: 'Chỉ dùng 1 thuốc statin duy nhất tới liều dung nạp tối đa trước khi phối hợp thêm ezetimibe.',
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.ezetimibe_add_on']
  },
  {
    id: 'dup.pcsk9',
    className: 'Thuốc ức chế / bất hoạt PCSK9',
    classes: ['pcsk9', 'pcsk9i'],
    drugIds: ['evolocumab', 'alirocumab', 'inclisiran'],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc nhắm đích PCSK9 (Evolocumab / Alirocumab / Inclisiran)',
    messageVi: 'Không phối hợp đồng thời kháng thể đơn dòng PCSK9 (Evolocumab/Alirocumab) với siRNA PCSK9 (Inclisiran) hoặc 2 kháng thể PCSK9 cùng lúc.',
    citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary', 'fda.inclisiran.dose']
  },
  {
    id: 'dup.fibrate',
    className: 'Fibrate',
    classes: ['fibrate'],
    drugIds: ['fenofibrate', 'gemfibrozil', 'bezafibrate', 'ciprofibrate'],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc nhóm Fibrate',
    messageVi: 'Chống chỉ định phối hợp 2 thuốc nhóm Fibrate do nguy cơ tiêu cơ vân cấp, sỏi mật và suy thận.',
    citationIds: ['acc.lipid.2026.fenofibrate_dose_range']
  },
  {
    id: 'dup.xoi',
    className: 'Thuốc ức chế Xanthine Oxidase (XOI)',
    classes: ['xoi'],
    drugIds: ['allopurinol', 'febuxostat'],
    severity: 'critical',
    titleVi: 'Chống chỉ định phối hợp 2 thuốc ức chế Xanthine Oxidase (Allopurinol + Febuxostat)',
    messageVi: 'Không phối hợp đồng thời Allopurinol và Febuxostat do trùng cơ chế ức chế xanthine oxidase, tăng nguy cơ độc tính nặng trên gan, tủy xương và da.',
    citationIds: ['acr.gout.2020.switch_second_xoi', 'acr.gout.2020.allopurinol_first_line']
  },
  {
    id: 'dup.uricosuric',
    className: 'Thuốc tăng thải acid uric qua thận (Uricosuric)',
    classes: ['uricosuric'],
    drugIds: ['probenecid', 'benzbromarone', 'lesinurad'],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc tăng thải acid uric (Uricosuric)',
    messageVi: 'Không phối hợp đồng thời 2 thuốc nhóm uricosuric (Probenecid + Benzbromarone) do tăng vọt thải acid uric niệu gây kết tinh sỏi urat và suy thận cấp (lưu ý: XOI + 1 Uricosuric được phép khi kháng trị).',
    citationIds: ['acr.gout.2020.allopurinol_first_line', 'eular.gout.2016.benzbromarone_hepatic_spc']
  },
  {
    id: 'dup.nsaid',
    className: 'Thuốc kháng viêm không steroid (NSAID)',
    classes: ['nsaid'],
    drugIds: [
      'naproxen', 'ibuprofen', 'diclofenac', 'indomethacin', 'meloxicam',
      'piroxicam', 'tenoxicam', 'celecoxib', 'etoricoxib', 'ketorolac',
      'etodolac', 'dexketoprofen', 'flurbiprofen', 'ketoprofen', 'parecoxib'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc kháng viêm không steroid (NSAID / COX-2i)',
    messageVi: 'Chống chỉ định dùng đồng thời ≥ 2 thuốc NSAID (kể cả phối hợp NSAID cổ điển với ức chế chọn lọc COX-2) do không tăng hiệu quả giảm đau nhưng làm tăng gấp bội xuất huyết tiêu hóa, suy thận cấp và biến cố tim mạch.',
    citationIds: ['kdigo.ckd.2024.nsaid_nephrotoxicity_p132', 'eular.gout.2016.colchicine_nsaid_contra']
  },
  {
    id: 'dup.systemic_steroid',
    className: 'Corticosteroid toàn thân',
    classes: ['systemic_corticosteroid', 'systemic_steroid'],
    drugIds: ['prednisolone', 'methylprednisolone', 'prednisone', 'hydrocortisone', 'dexamethasone'],
    severity: 'critical',
    titleVi: 'Trùng lặp 2 thuốc Corticosteroid đường toàn thân',
    messageVi: 'Không sử dụng đồng thời 2 thuốc corticosteroid toàn thân do nguy cơ quá liều corticoid cấp gây tăng đường huyết nặng, xuất huyết tiêu hóa và hạ kali máu.',
    citationIds: ['gold.copd.2026.exac_systemic_steroid_40mg_5d']
  },
  {
    id: 'dup.laba',
    className: 'Thuốc hít LABA',
    classes: ['laba'],
    drugIds: [
      'salmeterol', 'formoterol', 'indacaterol', 'olodaterol', 'vilanterol',
      'budesonide_formoterol', 'fluticasone_salmeterol', 'fluticasone_vilanterol',
      'beclometasone_formoterol', 'mometasone_formoterol', 'fluticasone_formoterol',
      'tiotropium_olodaterol', 'glycopyrronium_indacaterol', 'indacaterol_glycopyrronium',
      'umeclidinium_vilanterol', 'aclidinium_formoterol', 'glycopyrronium_formoterol',
      'fluticasone_furoate_umeclidinium_vilanterol', 'fluticasone_umeclidinium_vilanterol',
      'beclometasone_glycopyrronium_formoterol', 'beclometasone_formoterol_glycopyrronium',
      'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol_glycopyrronium',
      'indacaterol_glycopyrronium_mometasone',
      'symbicort', 'seretide', 'relvar', 'foster', 'dulera', 'flutiform', 'spiolto', 'ultibro', 'anoro', 'duaklir', 'bevespi', 'trelegy', 'trimbow', 'breztri', 'trixeo', 'enerzair'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp thành phần LABA giữa các bình hít',
    messageVi: 'Phát hiện ≥ 2 chế phẩm cùng chứa thuốc chủ vận beta-2 tác dụng kéo dài (LABA). Không dùng đồng thời do nguy cơ nhịp nhanh thất, run cơ, hạ kali máu và biến cố tim mạch.',
    citationIds: ['gold.copd.2026.initial_group_b', 'gina.asthma.2026.formoterol_max_mcg']
  },
  {
    id: 'dup.lama',
    className: 'Thuốc hít LAMA',
    classes: ['lama'],
    drugIds: [
      'tiotropium', 'umeclidinium', 'glycopyrronium', 'aclidinium',
      'tiotropium_olodaterol', 'glycopyrronium_indacaterol', 'indacaterol_glycopyrronium',
      'umeclidinium_vilanterol', 'aclidinium_formoterol', 'glycopyrronium_formoterol',
      'fluticasone_furoate_umeclidinium_vilanterol', 'fluticasone_umeclidinium_vilanterol',
      'beclometasone_glycopyrronium_formoterol', 'beclometasone_formoterol_glycopyrronium',
      'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol_glycopyrronium',
      'indacaterol_glycopyrronium_mometasone',
      'spiolto', 'ultibro', 'anoro', 'duaklir', 'bevespi', 'trelegy', 'trimbow', 'breztri', 'trixeo', 'enerzair'
    ],
    severity: 'critical',
    titleVi: 'Trùng lặp thành phần LAMA giữa các bình hít',
    messageVi: 'Phát hiện ≥ 2 chế phẩm cùng chứa thuốc kháng cholinergic tác dụng kéo dài (LAMA). Không dùng đồng thời do nguy cơ bí tiểu cấp, tăng nhãn áp góc đóng và khô miệng nặng.',
    citationIds: ['gold.copd.2026.initial_group_b', 'byt.copd.2026.triple_therapy_indication']
  },
  {
    id: 'dup.ics',
    className: 'Corticoid hít (ICS)',
    classes: ['ics'],
    drugIds: [
      'budesonide', 'fluticasone', 'fluticasone_propionate', 'fluticasone_furoate',
      'beclometasone', 'mometasone', 'ciclesonide',
      'budesonide_formoterol', 'fluticasone_salmeterol', 'fluticasone_vilanterol',
      'beclometasone_formoterol', 'mometasone_formoterol', 'fluticasone_formoterol',
      'fluticasone_furoate_umeclidinium_vilanterol', 'fluticasone_umeclidinium_vilanterol',
      'beclometasone_glycopyrronium_formoterol', 'beclometasone_formoterol_glycopyrronium',
      'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol_glycopyrronium',
      'indacaterol_glycopyrronium_mometasone',
      'symbicort', 'seretide', 'relvar', 'foster', 'dulera', 'flutiform', 'trelegy', 'trimbow', 'breztri', 'trixeo', 'enerzair'
    ],
    severity: 'warning',
    titleVi: 'Trùng lặp thành phần Corticoid hít (ICS) giữa các bình hít',
    messageVi: 'Phát hiện ≥ 2 chế phẩm cùng chứa Corticoid hít (ICS). Phối hợp trùng lặp làm tăng nguy cơ viêm phổi nặng, nấm miệng hầu, khàn tiếng và ức chế trục hạ đồi - tuyến yên.',
    citationIds: ['gold.copd.2026.followup_eos_less_100_pneumonia', 'gold.copd.2026.ics_withdrawal']
  },
  {
    id: 'dup.respiratory_biologic',
    className: 'Thuốc sinh học đường hô hấp (Kháng thể đơn dòng)',
    classes: ['respiratory_biologic', 'biologic_asthma', 'biologic_anti_il4ra', 'biologic_anti_il5'],
    drugIds: ['dupilumab', 'mepolizumab', 'benralizumab', 'omalizumab', 'tezepelumab'],
    severity: 'critical',
    titleVi: 'Trùng lặp ≥ 2 thuốc sinh học kháng thể đơn dòng đường hô hấp',
    messageVi: 'Không phối hợp đồng thời ≥ 2 thuốc sinh học đường hô hấp (Dupilumab, Mepolizumab, Benralizumab, Omalizumab, Tezepelumab) do thiếu dữ liệu an toàn phối hợp, tăng nguy cơ phản vệ và ức chế miễn dịch chồng chéo.',
    citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab', 'gina.asthma.2026.step5_biologics']
  }
];

export function matchesDuplicateRule(drugId: string, classes: Set<string>, rule: DuplicateRule): boolean {
  if (rule.id === 'dup.bb' && isOphthalmicBetaBlocker(drugId)) {
    return false;
  }
  if (rule.classes.some((cls) => classes.has(cls))) return true;
  const resolved = resolveKbDrugId(drugId);
  const comps = expandDrugComponents(drugId);
  return rule.drugIds.some((dId) => {
    const dLower = dId.toLowerCase();
    return dLower === drugId || dLower === resolved || comps.includes(dLower);
  });
}
