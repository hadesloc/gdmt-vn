import type { PathwayDefinition } from '../../engine/types';
import { dose, thFor } from '../../kb-types/access';
import { formatHfDose } from './helpers';

export const hfPathway: PathwayDefinition = {
  title: `Lộ trình tối ưu hóa điều trị HFrEF (ESC 2026 dưới ${thFor('lvef', 'hf.ef.hfref_max_esc2026')}% / US-BYT từ ${thFor('lvef', 'hf.ef.hfref_max')}% trở xuống)`,
  steps: [
    {
      id: 'step_1_diagnosis',
      stepNumber: 1,
      title: 'Chẩn đoán xác định & Phân tầng kiểu hình LVEF',
      description: `Xác định chẩn đoán qua triệu chứng, NT-proBNP và siêu âm tim phân tầng LVEF: ESC 2026 phân HFrEF (dưới ${thFor('lvef', 'hf.ef.hfref_max_esc2026')}%) & HFpEF (từ ${thFor('lvef', 'hf.ef.hfpef_min')}% trở lên); US/BYT giữ HFrEF (từ ${thFor('lvef', 'hf.ef.hfref_max')}% trở xuống), HFmrEF (${thFor('lvef', 'hf.ef.hfmref_min')}–${thFor('lvef', 'hf.ef.hfmref_max')}%), HFpEF và HFimpEF. Đánh giá sung huyết và huyết động.`,
      status: 'completed',
      citationIds: ['esc.hf.2026.hfref_redefined_lt50', 'esc.hf.2026.new_concept_hfref_expanded', 'byt.2022.hf_4pillars'],
    },
    {
      id: 'step_2_fmt_initiation',
      stepNumber: 2,
      title: 'Khởi động nhanh và song song 4 trụ cột FMT',
      description: `Khởi trị sớm 4 nhóm nền tảng: SGLT2i (${formatHfDose(dose('dapagliflozin', 'start'))}) + MRA (${formatHfDose(dose('spironolactone', 'start'))}) + ARNI (${formatHfDose(dose('sacubitril_valsartan', 'start'))} hoặc liều thấp) + Chẹn beta (${formatHfDose(dose('bisoprolol', 'start'))}). Phối hợp lợi tiểu quai khi có sung huyết.`,
      status: 'active',
      citationIds: ['esc.hf.2026.sacubitril_valsartan_dose', 'esc.hf.2026.bb_doses', 'esc.hf.2026.mra_doses', 'esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.sglt2i_doses_table11'],
    },
    {
      id: 'step_3_titration_monitoring',
      stepNumber: 3,
      title: 'Chuẩn độ tăng liều tích cực & Theo dõi an toàn (1–2 tuần)',
      description: `Kiểm tra huyết áp, nhịp tim, kali máu và eGFR sau 1–2 tuần khởi trị hoặc mỗi bước tăng liều (chiến lược STRONG-HF). Đích tối đa dung nạp: Sacubitril/valsartan ${formatHfDose(dose('sacubitril_valsartan', 'target'))}, Bisoprolol ${formatHfDose(dose('bisoprolol', 'target'))}, Spironolactone ${formatHfDose(dose('spironolactone', 'target'))}.`,
      status: 'upcoming',
      citationIds: ['esc.hf.2026.sacubitril_valsartan_dose', 'esc.hf.2026.bb_guidance_table_s6', 'esc.hf.2026.mra_guidance_table_s8', 'esc.hf.2026.acute_predischarge_fmt'],
    },
    {
      id: 'step_4_escalation_gdit',
      stepNumber: 4,
      title: 'Điều trị bổ trợ (AMT), Bù sắt TM & Thiết bị can thiệp (GDIT)',
      description: `Bù sắt tĩnh mạch khi Ferritin dưới ${thFor('ferritin', 'hf.iron.ferritin_abs_max')} ng/mL (hoặc ${thFor('ferritin', 'hf.iron.ferritin_abs_max')}–${thFor('ferritin', 'hf.iron.ferritin_func_max')} kèm TSAT dưới ${thFor('tsat', 'hf.iron.tsat_max')}%). Cân nhắc Ivabradine (nhịp xoang từ ${thFor('hr', 'hf.ivabradine.hr_min')} bpm), Vericiguat, Digoxin, thuốc gắn kali (SZC/Patiromer). Đánh giá lại LVEF sau ít nhất ${thFor('duration_months', 'hf.icd.omt_months_min')} tháng FMT tối ưu cho ICD, CRT (QRS từ ${thFor('qrs_duration', 'hf.crt.qrs_min')} ms) và M-TEER.`,
      status: 'upcoming',
      citationIds: ['esc.hf.2026.icd_primary_prevention', 'esc.hf.2026.crt_reassessment', 'esc.hf.2026.ivabradine_rec', 'esc.hf.2026.iron_rec', 'esc.hf.2026.teer_indication', 'esc.hf.2026.potassium_binders'],
    },
  ],
};

export const hfpefPathway: PathwayDefinition = {
  title: 'Lộ trình quản lý HFpEF (≥ 50%) & HFmrEF (41–49% theo US/BYT)',
  steps: [
    {
      id: 'hfpef_step_1_phenotyping',
      stepNumber: 1,
      title: 'Xác nhận chẩn đoán & Loại trừ bệnh cơ tim thâm nhiễm / van tim đặc hiệu',
      description: `Đánh giá cấu trúc thất trái, áp lực đổ đầy tâm trương, NT-proBNP và loại trừ amyloidosis tim (ATTR-CM: chỉ định Tafamidis Class I-A), bệnh cơ tim phì đại hoặc bệnh màng ngoài tim ở bệnh nhân LVEF trên ${thFor('lvef', 'hf.ef.hfref_max')}%.`,
      status: 'completed',
      citationIds: ['esc.hf.2026.hfref_redefined_lt50', 'esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.amyloid_ttr_rec'],
    },
    {
      id: 'hfpef_step_2_pillars',
      stepNumber: 2,
      title: 'Khởi trị nền tảng SGLT2i + MRA (Finerenone / Spironolactone) & Giải áp sung huyết',
      description: `Khởi trị SGLT2i (${formatHfDose(dose('dapagliflozin', 'start'))} - Class I-A) kết hợp MRA (Finerenone ${thFor('dose_mg', 'hf.finerenone.start_low_dose_mg')}–${thFor('dose_mg', 'hf.finerenone.start_high_or_target_low_dose_mg')} mg/ngày theo eGFR - Class I-A ESC 2026 / Class 2a ACC 2026) và lợi tiểu quai khi có quá tải dịch.`,
      status: 'active',
      citationIds: ['esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.sglt2i_doses_table11', 'esc.hf.2026.mra_all_lvef', 'esc.hf.2026.table_11_finerenone_doses'],
    },
    {
      id: 'hfpef_step_3_comorbidity_obesity',
      stepNumber: 3,
      title: 'Điều trị kiểu hình béo phì (Semaglutide / Tirzepatide) & Tối ưu bệnh đồng mắc',
      description: `Ở bệnh nhân LVEF từ ${thFor('lvef', 'hf.glp1.ef_min')}% kèm BMI từ ${thFor('bmi', 'hf.glp1.bmi_min')} kg/m², xem xét Semaglutide (khởi đầu ${thFor('dose_mg', 'hf.glp1.semaglutide_start')} mg/tuần tới đích ${thFor('dose_mg', 'hf.glp1.semaglutide_target')} mg/tuần) hoặc Tirzepatide (${thFor('dose_mg', 'hf.glp1.tirzepatide_start')} mg tới ${thFor('dose_mg', 'hf.glp1.tirzepatide_target')} mg/tuần). Kiểm soát chặt tăng huyết áp, rung nhĩ, bệnh thận mạn và thiếu máu cục bộ cơ tim.`,
      status: 'upcoming',
      citationIds: ['esc.hf.2026.glp1_obesity', 'acc.hfpef.2026.glp1_obesity', 'acc.hfpef.2026.table4_incretin_doses'],
    },
  ],
};
