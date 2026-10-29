/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Lộ trình Tham chiếu Điều trị Lâm sàng
 * Phân quyền: Agent F4
 *
 * Lưu ý kiến trúc: Đây là sơ đồ tham chiếu tổng quát cho quản lý ĐTĐ típ 2 ngoại trú không mang thai.
 * Các tình huống cấp cứu nội viện (DKA/HHS), thai kỳ/cho con bú và chu phẫu được cá thể hóa động
 * trực tiếp trên các thẻ Khuyến cáo của hệ thống.
 * Tuân thủ QA-8 & QA-10: Mọi ngưỡng hiển thị đều nội suy qua thFor(quantity, id) từ KB.
 */

import type { PathwayDefinition } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import { getMaxBasalDosePerKg } from './helpers.drugs';

export const dm2Pathway: PathwayDefinition = {
  title: 'Sơ đồ Tham chiếu Quản lý Đái tháo đường típ 2 Ngoại trú (ADA 2026 / KDIGO / BYT 5481 — Tham khảo chung)',
  steps: [
    {
      id: 'step_1',
      stepNumber: 1, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Tầm soát An toàn Cấp cứu, Thai kỳ/Cho con bú & Cá thể hóa Mục tiêu HbA1c',
      description:
        `Loại trừ cấp cứu tăng đường huyết (DKA/HHS) và hạ đường huyết trước khi áp dụng phác đồ ngoại trú; loại trừ thai kỳ (chỉ định Insulin đầu tay), cho con bú, tiền sử MTC/MEN 2 và viêm tụy cấp. Định lượng HbA1c, glucose đói, eGFR và UACR; khảo sát ASCVD, Suy tim HF, CKD và Béo phì. Cá thể hóa đích HbA1c (<${thFor('hba1c', 'dm2.hba1c.target_standard').toFixed(1)}% chuẩn; <${thFor('hba1c', 'dm2.hba1c.target_young').toFixed(1)}% người trẻ mới chẩn đoán; <${thFor('hba1c', 'dm2.hba1c.target_older_healthy').toFixed(1)}–${thFor('hba1c', 'dm2.hba1c.target_older_complex').toFixed(1)}% người cao tuổi có bệnh kèm).`,
      status: 'active',
      citationIds: ['ada.dm2.2026.hba1c_target_standard', 'byt.dm2.2020.hba1c_goals', 'ada.dm2.2026.pregnancy_insulin']
    },
    {
      id: 'step_2',
      stepNumber: 2, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Khởi trị Trụ cột Bảo vệ Tim – Thận (Độc lập HbA1c)',
      description:
        `Nếu có ASCVD, Suy tim (bất kể EF) hoặc CKD (eGFR từ ${thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')} đến dưới ${thFor('egfr', 'dm2.ckd.egfr_threshold')} hoặc UACR ≥ ${thFor('uacr', 'ckd.uacr.a1_max_mgmmol')} mg/mmol, chưa lọc máu, không loét bàn chân hoạt động): Khởi trị SGLT2i. Nếu có ASCVD, HFpEF kèm béo phì, CKD có albumin niệu/giảm eGFR (eGFR ≥ ${thFor('egfr', 'dm2.glp1.egfr_min')}) hoặc Thừa cân/Béo phì: Khởi trị GLP-1 RA / GIP-GLP-1 RA độc lập HbA1c. Nếu CKD còn albumin niệu dai dẳng và eGFR ≥ ${thFor('egfr', 'dm2.finerenone.egfr_min')}: Xem xét bổ sung Finerenone (nsMRA).`,
      status: 'upcoming',
      citationIds: ['ada.dm2.2026.rec_9_7_ascvd', 'ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.glp1_ckd_no_dose_adjust', 'kdigo.dm2.2022.semaglutide_sc_dosing', 'ada.dm2.2026.finerenone_rec_11_8']
    },
    {
      id: 'step_3',
      stepNumber: 3, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Kiểm soát Đường huyết Nền tảng với Metformin & Tiêu chí Insulin Sớm',
      description:
        `Khởi đầu Metformin ${thFor('dose_mg', 'dm2.metformin.dose_start')} mg sau ăn nếu eGFR ≥ ${thFor('egfr', 'dm2.metformin.egfr_caution')} mL/phút/1.73m², chuẩn độ tới ${thFor('dose_mg', 'dm2.metformin.dose_max')} mg/ngày. Nếu eGFR từ ${thFor('egfr', 'dm2.metformin.egfr_contra')} đến dưới ${thFor('egfr', 'dm2.metformin.egfr_caution')} mL/phút/1.73m²: không khởi trị mới, nếu đang dùng duy trì/giảm tối đa ${thFor('dose_mg', 'dm2.metformin.dose_reduced_max')} mg/ngày. Chống chỉ định khi eGFR < ${thFor('egfr', 'dm2.metformin.egfr_contra')} hoặc lọc máu. Nếu glucose ≥ ${thFor('glucose', 'dm2.early_insulin.glucose_mmol')} mmol/L (${thFor('glucose', 'dm2.early_insulin.glucose_mgdl')} mg/dL) hoặc HbA1c ≥ ${thFor('hba1c', 'dm2.early_insulin.hba1c')}% hoặc có dị hóa cấp: Khởi trị insulin nền sớm (hoặc cân nhắc đồng vận GLP-1/GIP-GLP-1 nếu không dị hóa).`,
      status: 'upcoming',
      citationIds: ['fda.metformin.egfr_bands', 'ada.dm2.2026.early_insulin_severe']
    },
    {
      id: 'step_4',
      stepNumber: 4, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Chuẩn độ, Leo thang & Phòng ngừa Overbasalization',
      description:
        `Tái đánh giá HbA1c mỗi 3–6 tháng và glucose đói mục tiêu ${thFor('glucose', 'dm2.glucose.fpg_target_min_mmol')}–${thFor('glucose', 'dm2.glucose.fpg_target_max_mmol')} mmol/L. Nếu chưa đạt đích: Phối hợp tăng bậc thuốc thứ hai/ba (ưu tiên GLP-1 RA / SGLT2i; hoặc Linagliptin khi suy thận nặng/lọc máu; ngừng DPP-4i khi bắt đầu GLP-1 RA). Nếu liều insulin nền > ${getMaxBasalDosePerKg()} U/kg/ngày (> ${thFor('percentage', 'dm2.insulin.basal_share_of_tdd_pct')}% TDD ${thFor('insulin_u_per_kg', 'dm2.insulin.t2d_typical_tdd_per_kg')} U/kg) hoặc BeAM ≥ ${thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mmol')} mmol/L (${thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mgdl')} mg/dL): Ngừng tăng liều nền đơn thuần, ưu tiên phối hợp GLP-1/GIP-GLP-1 RA hoặc insulin bữa ăn.`,
      status: 'upcoming',
      citationIds: ['ada.dm2.2026.rec_9_15_intensify', 'ada.dm2.2026.overbasalization', 'ada.dm2.2026.t2d_tdd_1ukg', 'ada.dm2.2026.basal_50pct_tdd', 'ada.dm2.2026.overbasalization_combo_injectable', 'ada.dm2.2026.no_dpp4_plus_glp1']
    },
    {
      id: 'step_5',
      stepNumber: 5, // qa-allow: ui-step - Thứ tự bước lộ trình
      title: 'Chủ động Xuống thang Khi Quá chặt/Hạ ĐH & Phòng ngừa Biến chứng Đi kèm',
      description:
        `Khi có biến cố hạ đường huyết hoặc kiểm soát quá chặt dưới ngưỡng an toàn ở người cao tuổi: Ngừng/giảm liều Sulfonylurea và giảm ${thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct')}% liều Insulin. Kiểm soát huyết áp < ${thFor('sbp', 'dm2.bp.target_sbp')}/${thFor('dbp', 'dm2.bp.target_dbp')} mmHg; Statin dự phòng tim mạch (cá thể hóa > ${thFor('age', 'dm2.elderly.high_risk_age')} tuổi); Aspirin ${thFor('dose_mg', 'dm2.aspirin.secondary_min_dose')}–${thFor('dose_mg', 'dm2.aspirin.secondary_max_dose')} mg/ngày dự phòng thứ phát khi không dùng kháng đông/nguy cơ chảy máu; Khám mắt, bàn chân và UACR hàng năm.`,
      status: 'upcoming',
      citationIds: ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.bp_target', 'ada.dm2.2026.statin_secondary']
    }
  ]
};
