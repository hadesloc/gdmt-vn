/**
 * GDMT-VN Module Tăng huyết áp (htn) - Lộ trình Tối ưu hóa Điều trị
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { PathwayDefinition } from '../../engine/types';
import { th } from '../../kb-types';

export const htnPathway: PathwayDefinition = {
  title: 'Lộ trình kiểm soát huyết áp chuẩn mực đa hướng dẫn (ESC 2024 / AHA/ACC 2025 / VSH/VNHA 2022)',
  steps: [
    {
      id: 'step_1',
      stepNumber: 1, // qa-allow: ui-step - Số thứ tự bước lộ trình UI
      title: 'Đo chuẩn hóa, Khẳng định ngoại viện (HBPM/ABPM) & Phân tầng nguy cơ',
      description: `Đo huyết áp phòng khám chuẩn hóa kết hợp HBPM (ngưỡng ≥ ${th('htn.hbpm.sbp_threshold')}/${th('htn.hbpm.dbp_threshold')} mmHg) hoặc Holter ABPM 24 giờ (ngưỡng ≥ ${th('htn.abpm.sbp_24h_threshold')}/${th('htn.abpm.dbp_24h_threshold')} mmHg) để loại trừ THA áo choàng trắng và phát hiện THA ẩn giấu. Phân tầng nguy cơ tim mạch 10 năm theo SCORE2 (ESC) hoặc PREVENT (AHA/ACC).`,
      status: 'completed',
      citationIds: ['esc.htn.2024.definition_classes', 'esc.htn.2024.abpm_hbpm_thresholds', 'esc.cvd.2021.score2']
    },
    {
      id: 'step_2',
      stepNumber: 2, // qa-allow: ui-step - Số thứ tự bước lộ trình UI
      title: 'Bước 1: Phối hợp đôi Viên cố định (Dual SPC) vs Đơn trị cá thể hóa',
      description: `Khởi trị bằng viên phối hợp đôi liều thấp cố định (RASi + CCB hoặc RASi + Lợi tiểu) cho đa số bệnh nhân HA ≥ ${th('htn.bp.sbp_hypertension')}/${th('htn.bp.dbp_hypertension')} mmHg (ESC 2024, VSH 2022, AHA/ACC 2025 Giai đoạn 2). Khởi đầu đơn trị liệu ở nhóm Giai đoạn 1 theo US (${th('htn.bp.sbp_stage1_us')}–${th('htn.bp.sbp_elevated_max')}/${th('htn.bp.dbp_stage1_us')}–${th('htn.bp.dbp_elevated_max')} mmHg), Huyết áp tăng nguy cơ cao sau thay đổi lối sống (ESC), HA bình thường-cao nguy cơ thấp-vừa hoặc người rất cao tuổi (VN ≥ ${th('htn.age.elderly_monotherapy')} tuổi khởi trị khi ≥ ${th('htn.elderly.vn_sbp_80plus')}/${th('htn.bp.dbp_hypertension')} mmHg; ESC ≥ ${th('htn.age.very_elderly')} tuổi / suy yếu / hạ HA tư thế).`,
      status: 'active',
      citationIds: [
        'esc.htn.2024.initial_combination',
        'aha.acc.2025.stage2_spc_rec1',
        'aha.acc.2025.stage1_mono_rec2',
        'vsh.htn.2022.table9_dual_spc'
      ]
    },
    {
      id: 'step_3',
      stepNumber: 3, // qa-allow: ui-step - Số thứ tự bước lộ trình UI
      title: 'Bước 2: Tối ưu hóa lên Ba thuốc cố định (Triple SPC) & Theo dõi thận - điện giải',
      description: `Đánh giá lại sau mỗi ${th('htn.monitoring.recheck_weeks_min')}–${th('htn.monitoring.recheck_weeks_max')} tuần; nếu chưa đạt đích (${th('htn.bp.sbp_target_standard_min')}–${th('htn.bp.sbp_target_standard_max')}/${th('htn.bp.dbp_target_standard_min')}–${th('htn.bp.dbp_target_standard_max')} mmHg theo ESC, < ${th('htn.bp.sbp_target_us')}/${th('htn.bp.dbp_target_us')} mmHg theo US & VN nguy cơ cao, hoặc < ${th('htn.bp.sbp_target_vietnam')}/${th('htn.bp.dbp_target_vietnam_vsh')} mmHg theo VSH chung), nâng lên phối hợp ba thuốc RASi + CCB + Lợi tiểu Thiazide/Thiazide-like (đổi sang lợi tiểu quai nếu eGFR < ${th('htn.diuretic.egfr_loop_switch')} mL/min/1.73m²). Xét nghiệm Creatinin và Kali máu sau ${th('htn.monitoring.recheck_weeks_min')}–${th('htn.monitoring.recheck_weeks_max')} tuần.`,
      status: 'upcoming',
      citationIds: [
        'esc.htn.2024.triple_combination',
        'esc.htn.2024.bp_target_general',
        'aha.acc.2025.monitoring_bmp_2_4wk',
        'esc.htn.2024.ckd_loop_diuretic'
      ]
    },
    {
      id: 'step_4',
      stepNumber: 4, // qa-allow: ui-step - Số thứ tự bước lộ trình UI
      title: 'Bước 3 (THA kháng trị): Thêm Spironolactone & Tầm soát thứ phát',
      description: `Khi HA vẫn vượt đích dù đã tuân thủ đủ ba nhóm thuốc liều tối ưu dung nạp: kiểm tra cổng Kali máu ≤ ${th('htn.spiro.k_max_initiate')} mmol/L và eGFR ≥ ${th('htn.spiro.egfr_contra_esc')} mL/min/1.73m² (ESC/VN) hoặc ≥ ${th('htn.spiro.egfr_min_initiate')} mL/min/1.73m² (US) để thêm Spironolactone liều thấp; nếu không dung nạp hoặc chống chỉ định thì dùng Eplerenone, Bisoprolol hoặc Doxazosin. Bắt buộc tầm soát Cường aldosteron nguyên phát (ARR) và bệnh thận mạch máu.`,
      status: 'upcoming',
      citationIds: [
        'esc.htn.2024.spiro_resistant',
        'aha.acc.2025.table13_spiro_egfr45',
        'vsh.htn.2022.resistant_k5',
        'esc.htn.2024.arr_screening'
      ]
    }
  ]
};
