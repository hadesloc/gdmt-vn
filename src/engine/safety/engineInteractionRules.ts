/**
 * GDMT-VN Safety - Supplemental Engine-Level Interaction & Contraindication Rules
 * Phân quyền: Agent B
 */

import type { Patient, Derived } from '../types';
import { hasCondition } from '../types';
import {
  getNormalizedDrugClasses,
  PDE5I_DRUG_IDS,
  NITRATE_OR_SGC_DRUG_IDS,
  STRONG_CYP3A4_INHIBITOR_IDS,
  isOphthalmicBetaBlocker
} from './drugClassify';
import { expandDrugComponents } from './fdcMap';

export interface EngineInteractionRule {
  id: string;
  drugA: string[];
  classesA?: string[];
  drugB?: string[];
  classesB?: string[];
  condition?: (patient: Patient, derived: Derived) => boolean;
  severity: 'critical' | 'warning' | 'info';
  titleVi: string;
  messageVi: string;
  citationIds: string[];
}

export type InteractionRule = EngineInteractionRule;

export const INTERACTION_RULES: EngineInteractionRule[] = [
  {
    id: 'ix.pde5i_nitrate_vericiguat',
    titleVi: 'Chống chỉ định tuyệt đối: Thuốc ức chế PDE-5 + Nitrat / Vericiguat',
    drugA: Array.from(PDE5I_DRUG_IDS),
    classesA: ['pde5i'],
    drugB: Array.from(NITRATE_OR_SGC_DRUG_IDS),
    classesB: ['nitrate'],
    severity: 'critical',
    messageVi:
      'Phối hợp đồng thời thuốc ức chế PDE-5 (sildenafil, tadalafil, vardenafil) với Nitrat hữu cơ hoặc chất kích thích sGC (vericiguat) gây tích tụ cGMP quá mức, dẫn đến tụt huyết áp sâu kháng trị, nhồi máu cơ tim và tử vong. Chống chỉ định tuyệt đối phối hợp.',
    citationIds: ['esc.hf.2026.vericiguat_rec', 'esc.hf.2026.acute_vasodilators']
  },
  {
    id: 'ix.eplerenone_strong_cyp3a4',
    titleVi:
      'Chống chỉ định tuyệt đối: Eplerenone + Thuốc ức chế mạnh CYP3A4 (Clarithromycin, Ketoconazole, Itraconazole)',
    drugA: ['eplerenone'],
    drugB: Array.from(STRONG_CYP3A4_INHIBITOR_IDS),
    classesB: ['strong_cyp3a4_inhibitor', 'strong_cyp3a4_pgp_inhibitor'],
    severity: 'critical',
    messageVi:
      'Eplerenone chuyển hóa chủ yếu qua CYP3A4; phối hợp với chất ức chế mạnh CYP3A4 làm tăng AUC của eplerenone gấp ~5 lần, gây tăng kali máu ác tính và ngừng tim. Chống chỉ định tuyệt đối phối hợp (FDA Inspra §4).',
    citationIds: ['fda.eplerenone.strong_cyp3a_contra', 'esc.hf.2026.mra_guidance_table_s8']
  },
  {
    id: 'ix.eplerenone_moderate_cyp3a4',
    titleVi:
      'Giới hạn liều Eplerenone ≤ 25 mg/ngày khi phối hợp thuốc ức chế trung bình CYP3A4 (Diltiazem, Verapamil, Erythromycin, Fluconazole)',
    drugA: ['eplerenone'],
    drugB: ['diltiazem', 'verapamil', 'erythromycin', 'fluconazole'],
    severity: 'warning',
    messageVi:
      'Chất ức chế trung bình CYP3A4 làm tăng nồng độ Eplerenone huyết tương ~2 lần và tăng nguy cơ tăng kali máu. Không vượt quá liều Eplerenone 25 mg/ngày và theo dõi sát K⁺ máu.',
    citationIds: ['fda.eplerenone.moderate_cyp3a_25mg_cap', 'esc.hf.2026.mra_guidance_table_s8']
  },
  {
    id: 'ix.ivabradine_diltiazem_verapamil',
    titleVi: 'Chống chỉ định phối hợp: Ivabradine + Diltiazem / Verapamil',
    drugA: ['ivabradine'],
    drugB: ['diltiazem', 'verapamil'],
    severity: 'critical',
    messageVi:
      'Diltiazem và Verapamil ức chế CYP3A4 làm tăng phơi nhiễm Ivabradine gấp 2–3 lần đồng thời cộng hưởng ức chế nút xoang gây nhịp chậm nặng và bloc dẫn truyền. Chống chỉ định phối hợp (Corlentor SmPC §4.3 / FDA).',
    citationIds: ['fda.ivabradine.verapamil_diltiazem_avoid']
  },
  {
    id: 'ix.digoxin_pgp_inhibitors',
    titleVi:
      'Tương tác tăng độc tính Digoxin: Digoxin + Thuốc ức chế P-gp (Amiodarone, Dronedarone, Verapamil, Clarithromycin, Cyclosporine, Propafenone)',
    drugA: ['digoxin'],
    drugB: [
      'amiodarone',
      'dronedarone',
      'verapamil',
      'clarithromycin',
      'itraconazole',
      'cyclosporine',
      'propafenone',
      'quinidine'
    ],
    severity: 'critical',
    messageVi:
      'Thuốc ức chế P-glycoprotein làm giảm thải trừ và tăng nồng độ Digoxin huyết thanh 50–100%, dễ gây ngộ độc Digoxin và loạn nhịp thất. Giảm 50% liều Digoxin, theo dõi nồng độ Digoxin máu (< 0.9 ng/mL) và K⁺/Mg²⁺.',
    citationIds: ['fda.digoxin.amiodarone_verapamil_interactions', 'fda.digoxin.pgp_inhibitors_reduce_dose']
  },
  {
    id: 'ix.rosuvastatin_ticagrelor_febuxostat',
    titleVi: 'Giới hạn liều Rosuvastatin khi phối hợp Febuxostat / Ticagrelor',
    drugA: ['rosuvastatin'],
    drugB: ['febuxostat', 'ticagrelor'],
    severity: 'warning',
    messageVi:
      'Febuxostat (ức chế BCRP) và Ticagrelor làm tăng nồng độ Rosuvastatin huyết tương ~2 lần và tăng nguy cơ bệnh cơ/tiêu cơ vân. Khi phối hợp Febuxostat, giới hạn liều tối đa Rosuvastatin ≤ 20 mg/ngày.',
    citationIds: ['fda.rosuvastatin.febuxostat_limit_20mg']
  },
  {
    id: 'ix.rasi_mra_trimethoprim',
    titleVi: 'Tương tác Tăng Kali máu nguy kịch: MRA / RASi + Trimethoprim (Cotrimoxazole / Bactrim)',
    drugA: [
      'spironolactone',
      'eplerenone',
      'finerenone',
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
      'sacubitril_valsartan'
    ],
    classesA: ['mra', 'mra_steroidal', 'mra_nonsteroidal', 'rasi', 'acei', 'arb', 'arni'],
    drugB: ['trimethoprim', 'cotrimoxazole', 'sulfamethoxazole_trimethoprim', 'tmp_smx', 'bactrim'],
    severity: 'critical',
    messageVi:
      'Trimethoprim chẹn kênh natri biểu mô ống góp (ENaC) tương tự amiloride, làm ức chế bài tiết kali qua thận. Khi dùng cùng MRA hoặc RASi/ARNI làm tăng vọt nguy cơ nhập viện và đột tử do tăng kali máu nặng. Tránh phối hợp hoặc kiểm tra sát K⁺ máu sau 3–5 ngày.',
    citationIds: ['esc.hf.2026.mra_guidance_table_s8', 'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders']
  },
  {
    id: 'ix.triple_whammy',
    titleVi: 'Bộ ba nguy hại (Triple Whammy): RASi + Lợi tiểu + NSAID',
    drugA: [
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
      'sacubitril_valsartan'
    ],
    classesA: ['rasi', 'acei', 'arb', 'arni'],
    drugB: [
      'furosemide',
      'bumetanide',
      'torsemide',
      'hydrochlorothiazide',
      'indapamide',
      'chlorthalidone',
      'spironolactone'
    ],
    classesB: ['diuretic', 'loop_diuretic', 'thiazide_diuretic'],
    condition: (p) => {
      const hasNsaid = (p.currentMeds || []).some((m) => {
        const id = m?.drugId?.toLowerCase() || '';
        if (!id || id === 'aspirin' || id === 'acetylsalicylic_acid') return false;
        const comps = expandDrugComponents(id);
        return (
          comps.some((c) =>
            [
              'ibuprofen',
              'naproxen',
              'celecoxib',
              'meloxicam',
              'diclofenac',
              'etoricoxib',
              'piroxicam',
              'tenoxicam',
              'indomethacin',
              'ketorolac',
              'etodolac',
              'dexketoprofen'
            ].includes(c)
          ) || getNormalizedDrugClasses(id).has('nsaid')
        );
      });
      return Boolean(hasNsaid || p.customInputs?.takingNsaid);
    },
    severity: 'critical',
    messageVi:
      'Phối hợp RASi + Lợi tiểu + NSAID gây co thắt tiểu ĐM vào và giãn tiểu ĐM ra, làm sụt giảm nghiêm trọng áp lực lọc cầu thận và gây suy thận cấp (AKI). Khuyến cáo tránh NSAID, thay bằng paracetamol hoặc corticoid ngắn ngày nếu phù hợp.',
    citationIds: ['kdigo.ckd.2024.nsaid_nephrotoxicity_p132', 'kdigo.ckd.2024.pp_3_6_2_rasi_monitoring']
  },
  {
    id: 'ix.pioglitazone_hf',
    titleVi: 'Chống chỉ định Thiazolidinedione (Pioglitazone) ở suy tim',
    drugA: ['pioglitazone', 'rosiglitazone'],
    classesA: ['tzd'],
    condition: (p) => hasCondition({ normalized: p, patient: p }, 'hf') || (p.lvef !== undefined && p.lvef <= 50),
    severity: 'critical',
    messageVi:
      'Pioglitazone gây giữ muối nước tiến triển và làm tăng đáng kể nguy cơ suy tim mất bù phải nhập viện. Chống chỉ định ở bệnh nhân suy tim có triệu chứng.',
    citationIds: ['fda.pioglitazone.heart_failure_contra']
  },
  {
    id: 'ix.ccb_non_dhp_hfref',
    titleVi: 'Chống chỉ định CCB Non-Dihydropyridine ở suy tim phân suất tống máu giảm (HFrEF)',
    drugA: ['diltiazem', 'verapamil'],
    classesA: ['ndhp_ccb'],
    condition: (p) => (p.lvef !== undefined && p.lvef <= 40) || hasCondition({ normalized: p, patient: p }, 'hf'),
    severity: 'critical',
    messageVi:
      'Verapamil và Diltiazem có tác dụng ức chế co bóp cơ tim mạnh (inotropic âm tính), làm trầm trọng thêm tình trạng suy tim và tăng nhập viện ở BN suy tim LVEF ≤ 40%. Chống chỉ định ở HFrEF.',
    citationIds: ['esc.af.2024.verapamil_contra_lvef40', 'esc.af.2024.rate_control_lvef_reduced']
  },
  {
    id: 'ix.bb_non_selective_asthma',
    titleVi: 'Nguy cơ co thắt phế quản: Thuốc chẹn beta không chọn lọc ở Hen phế quản / COPD',
    drugA: ['propranolol', 'timolol', 'nadolol', 'carvedilol', 'labetalol', 'sotalol', 'pindolol'],
    classesA: ['bb_nonselective'],
    condition: (p) => {
      const hasAirway =
        hasCondition({ normalized: p, patient: p }, 'asthma') ||
        hasCondition({ normalized: p, patient: p }, 'copd');
      if (!hasAirway) return false;
      const onlyOphthalmic = (p.currentMeds || []).every(
        (m) => !m?.drugId || isOphthalmicBetaBlocker(m.drugId, m.route) || !getNormalizedDrugClasses(m.drugId).has('bb_nonselective')
      );
      return !onlyOphthalmic;
    },
    severity: 'critical',
    messageVi:
      'Thuốc chẹn beta không chọn lọc chẹn thụ thể beta-2 phế quản gây co thắt phế quản cấp nặng ở bệnh nhân hen và làm nặng tắc nghẽn đường thở. Nếu có chỉ định tim mạch bắt buộc, ưu tiên chẹn beta chọn lọc beta-1 trên tim (bisoprolol, metoprolol succinate, nebivolol) liều thấp tăng dần.',
    citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm', 'aha.acc.2025.iv_labetalol']
  }
];
