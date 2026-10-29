/**
 * GDMT-VN CKD Module - Clinical Pathway Definition (KDIGO 2024, ESC 2026, ADA 2026 & BYT 2024)
 * Phân quyền: Agent E
 * Tuân thủ QA-8 & QA-10: Toàn bộ ngưỡng hiển thị đều nội suy qua thFor(quantity, id) từ KB.
 */

import type { PathwayDefinition } from '../../engine/types';
import { thFor } from '../../kb-types/access';

export const ckdPathway: PathwayDefinition = {
  title: 'Lộ trình Quản lý Toàn diện Bệnh thận mạn 4 Trụ cột (KDIGO 2024 / ESC 2026 / ADA 2026 / BYT 2024)',
  steps: [
    {
      id: 'ckd_step_1_staging',
      stepNumber: 1, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Phân tầng KDIGO G × A, Xác nhận Cystatin C & Loại bỏ Thuốc độc thận',
      description:
        `Đánh giá đồng thời eGFR (CKD-EPI 2021) và UACR niệu; xét nghiệm kết hợp Cystatin C (tính eGFRcr-cys) khẳng định chẩn đoán ở phân nhóm ranh giới G3aA1 (${thFor('egfr', 'ckd.egfr.g3a_min')}–${thFor('egfr', 'ckd.egfr.g2_min')} mL/phút/1.73m², UACR < ${thFor('uacr', 'ckd.uacr.a1_max_mgmmol')} mg/mmol) hoặc khối cơ bất thường (KDIGO 2024 Rec 1.2.2.1, Grade 1C). Ngừng ngay NSAID khi eGFR < ${thFor('egfr', 'ckd.nsaid.egfr_contra')} mL/phút/1.73m², AKI hoặc bộ ba Triple Whammy; sàng lọc thai kỳ và chống chỉ định.`,
      status: 'completed',
      citationIds: [
        'kdigo.ckd.2024.table_2_gfr_categories',
        'kdigo.ckd.2024.rec_1_2_2_1_cystatin_c',
        'byt.ckd.2024.nsaid_contra_egfr_30'
      ]
    },
    {
      id: 'ckd_step_2_sglt2i_rasi',
      stepNumber: 2, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Trụ cột 1 & 2: Ức chế SGLT2 + Ức chế Hệ RAS Liều tối đa Dung nạp',
      description:
        `Khởi trị SGLT2i (Dapagliflozin/Empagliflozin) khi eGFR ≥ ${thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')} mL/phút/1.73m² và SBP ≥ ${thFor('sbp', 'ckd.sglt2i.sbp_initiate_min')} mmHg (1A cho ĐTĐ2, UACR ≥ ${thFor('uacr', 'ckd.sglt2i.uacr_initiate_min_mgmmol')} mg/mmol hoặc suy tim; 2B cho eGFR ${thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')}–${thFor('egfr', 'ckd.sglt2i.egfr_intermediate_max')}), duy trì kể cả khi eGFR giảm < ${thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')} cho tới khi lọc máu. Đồng thời khởi trị và chuẩn độ ACEi hoặc ARB tới liều đích tối đa dung nạp khi có albumin niệu (1B ở ĐTĐ A2–A3 hoặc không ĐTĐ A3; 2C ở không ĐTĐ A2) hoặc tăng huyết áp (≥ ${thFor('sbp', 'ckd.bp.target_sbp_acc_aha')}/${thFor('dbp', 'ckd.bp.target_dbp_max')} mmHg); kiểm tra lại SCr và K⁺ sau 2–4 tuần (chấp nhận tăng SCr ≤ ${thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct')}%).`,
      status: 'active',
      citationIds: [
        'kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d',
        'kdigo.ckd.2024.pp_3_7_1_continue_below_20',
        'kdigo.ckd.2024.pp_3_6_1_rasi_max_dose'
      ]
    },
    {
      id: 'ckd_step_3_finerenone',
      stepNumber: 3, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Trụ cột 3: nsMRA Finerenone (Sau khi đã tối ưu liều RASi tối đa dung nạp)',
      description:
        `Ở bệnh nhân ĐTĐ típ 2 còn albumin niệu UACR ≥ ${thFor('uacr', 'ckd.finerenone.uacr_initiate_min_mgmmol')} mg/mmol sau khi đã đạt liều tối đa dung nạp ACEi/ARB, bổ sung Finerenone (${thFor('dose_mg', 'ckd.finerenone.start_dose_low')}–${thFor('dose_mg', 'ckd.finerenone.target_dose')} mg/ngày) nếu eGFR ≥ ${thFor('egfr', 'ckd.finerenone.egfr_initiate_min')} mL/phút/1.73m², K⁺ ≤ ${thFor('k', 'ckd.finerenone.k_initiate_max').toFixed(1)} mmol/L và không suy gan nặng Child-Pugh C (KDIGO 2024 Rec 3.8.1, 2A). Nếu có HFrEF (LVEF < ${thFor('lvef', 'ckd.hfref.lvef_max')}%) ưu tiên MRA steroid; ngừng Finerenone khi eGFR < ${thFor('egfr', 'ckd.egfr.g4_min')} mL/phút/1.73m² hoặc lọc máu.`,
      status: 'upcoming',
      citationIds: [
        'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
        'fda.finerenone.table_1_starting_dose',
        'fda.finerenone.table_2_dose_adjustment'
      ]
    },
    {
      id: 'ckd_step_4_glp1ra',
      stepNumber: 4, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Trụ cột 4: Đồng vận GLP-1 Semaglutide bảo vệ Tim – Thận ở ĐTĐ típ 2 + CKD',
      description:
        `Khởi trị Semaglutide tiêm dưới da (đích 1.0 mg/tuần) khi eGFR ≥ ${thFor('egfr', 'ckd.glp1ra.egfr_min')} mL/phút/1.73m² theo tiêu chuẩn FLOW (eGFR ${thFor('egfr', 'ckd.glp1ra.flow_egfr_mid_min')}–${thFor('egfr', 'ckd.glp1ra.flow_egfr_high_min') - 1} kèm UACR ≥ ${thFor('uacr', 'ckd.glp1ra.flow_uacr_mid_mgmmol')} mg/mmol, hoặc eGFR ${thFor('egfr', 'ckd.glp1ra.flow_egfr_high_min')}–${thFor('egfr', 'ckd.glp1ra.flow_egfr_high_max')} kèm UACR ≥ ${thFor('uacr', 'ckd.glp1ra.flow_uacr_high_mgmmol')} mg/mmol — ESC 2026 Bảng 12, Class I, Level A; ADA 2026 Khuyến cáo 11.7b, Mức A), hoặc ở CKD G4 không dùng được Metformin/SGLT2i hoặc khi chưa đạt đích HbA1c (KDIGO 2024 Rec 3.9.1, 1B). Chống chỉ định khi có tiền sử MTC/MEN 2 hoặc viêm tụy cấp; giảm liều SU/Insulin đi kèm.`,
      status: 'upcoming',
      citationIds: [
        'esc.2026.ckd.table_12_semaglutide',
        'ada.2026.soc11.rec_11_7b_glp1ra',
        'kdigo.ckd.2024.rec_3_9_1_glp1ra_t2d'
      ]
    },
    {
      id: 'ckd_step_5_bp_statin_acidosis_k',
      stepNumber: 5, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Kiểm soát Huyết áp, Lipid, Toan chuyển hóa & Tăng Kali mạn tính',
      description:
        `Đích SBP < ${thFor('sbp', 'ckd.bp.target_sbp_kdigo')} mmHg đo chuẩn hóa (KDIGO), < ${thFor('sbp', 'ckd.bp.target_sbp_acc_aha')}/${thFor('dbp', 'ckd.bp.target_dbp_max')} mmHg (AHA/ACC 2025), hoặc ${thFor('sbp', 'ckd.bp.target_sbp_esc_min')}–${thFor('sbp', 'ckd.bp.target_sbp_esc_max')} / < ${thFor('dbp', 'ckd.bp.target_dbp_max')} mmHg khi eGFR ≥ ${thFor('egfr', 'ckd.egfr.g3b_min')} và cá thể hóa khi eGFR < ${thFor('egfr', 'ckd.egfr.g3b_min')} (ESC 2026 Bảng 9 & BYT 2024 Bảng 11). Statin cho CKD ≥ ${thFor('age', 'ckd.statin.age_min')} tuổi chưa lọc máu (1A). Bù Natri Bicarbonat đường uống khi HCO₃⁻ từ ${thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency')} đến < ${thFor('hco3', 'ckd.acidosis.hco3_min')} mmol/L (chuyển cấp cứu nội viện nếu < ${thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency')} mmol/L). Dùng chất gắn kali để duy trì RASi/nsMRA.`,
      status: 'upcoming',
      citationIds: [
        'esc.2026.ckd.bp_target_120_129',
        'byt.ckd.2024.table_11_bp_targets_esc',
        'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
        'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate'
      ]
    },
    {
      id: 'ckd_step_6_sickday_referral',
      stepNumber: 6, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Giáo dục Quy tắc Ngày ốm (Sick-day) & Chuyển Chuyên khoa Thận học',
      description:
        `Hướng dẫn tạm ngừng nhóm thuốc SADMAN (SGLT2i, ACEi/ARB/ARNI, lợi tiểu, Metformin, NSAID, MRA) khi sốt cao, nôn ói, tiêu chảy mất nước hoặc AKI. Chuyển khám chuyên khoa Thận học khi eGFR < ${thFor('egfr', 'ckd.referral.egfr_threshold')} mL/phút/1.73m², nguy cơ suy thận KFRE 5 năm ≥ ${thFor('percentage', 'ckd.kfre.referral_5y_max')}% (cân nhắc ở vùng ${thFor('percentage', 'ckd.kfre.referral_5y_min')}%–${thFor('percentage', 'ckd.kfre.referral_5y_max')}%), UACR > ${thFor('uacr', 'ckd.referral.uacr_high_threshold_mgmmol')} mg/mmol hoặc A3 kèm tiểu máu cầu thận.`,
      status: 'upcoming',
      citationIds: [
        'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
        'kdigo.ckd.2024.fig_48_referral_criteria',
        'kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold'
      ]
    }
  ]
};
