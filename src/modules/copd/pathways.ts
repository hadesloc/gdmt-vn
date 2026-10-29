import type { PathwayDefinition } from '../../engine/types';
import { thFor } from '../../kb-types';

export const copdPathway: PathwayDefinition = {
  title: 'Lộ trình chẩn đoán & tối ưu hóa phác đồ điều trị COPD (GOLD 2026 & BYT 2131/2026)',
  steps: [
    {
      id: 'step_1_diagnosis',
      stepNumber: 1, // qa-allow: index - số thứ tự bước lộ trình
      title: 'Chẩn đoán xác định & Phân loại đa chiều',
      description: `Đo chức năng hô hấp sau thử giãn phế quản (FEV₁/FVC < ${thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic')} xác nhận chẩn đoán). Phân độ tắc nghẽn GOLD 1–4 theo FEV₁%. Đánh giá triệu chứng (mMRC ≥ ${thFor('mmrc', 'copd.mmrc_high')}, CAT ≥ ${thFor('cat', 'copd.cat_high')}) và tiền sử đợt cấp 12 tháng qua (≥ ${thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')} đợt cấp vừa hoặc nhập viện → Nhóm E) để xếp nhóm A, B, hoặc E.`,
      status: 'completed',
    },
    {
      id: 'step_2_initial_rx',
      stepNumber: 2, // qa-allow: index - số thứ tự bước lộ trình
      title: 'Khởi trị ban đầu theo phân nhóm A / B / E',
      description: `Nhóm A: Khởi đầu một thuốc giãn phế quản tác dụng kéo dài (LAMA hoặc LABA). Nhóm B: Phối hợp đôi LABA + LAMA. Nhóm E: Khởi đầu LABA + LAMA; cân nhắc liệu pháp ba thuốc (ICS + LAMA + LABA) ngay từ đầu nếu BCAT máu ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} /µL. Nếu có hen phế quản đồng mắc, bắt buộc phác đồ nền có chứa ICS.`,
      status: 'active',
    },
    {
      id: 'step_3_review',
      stepNumber: 3, // qa-allow: index - số thứ tự bước lộ trình
      title: 'Đánh giá lại: Khó thở vs Đợt cấp & Kỹ thuật hít',
      description: 'Đánh giá đáp ứng định kỳ: Kiểm tra tuân thủ, kỹ thuật sử dụng dụng cụ hít và lưu lượng hít thở (SMI / pMDI kèm buồng đệm nếu lực hít yếu) trước khi đổi thuốc. Tách biệt hai nhánh mục tiêu điều trị theo dõi: Triệu chứng khó thở dai dẳng vs Xuất hiện đợt cấp.',
      status: 'upcoming',
    },
    {
      id: 'step_4_escalation',
      stepNumber: 4, // qa-allow: index - số thứ tự bước lộ trình
      title: 'Tối ưu hóa phác đồ, Leo thang & Can thiệp không dùng thuốc',
      description: `Nhánh khó thở: Nâng lên LABA + LAMA, chuyển đổi thiết bị/hoạt chất và phục hồi chức năng hô hấp cho Nhóm B & Nhóm E. Nhánh đợt cấp: Thêm ICS nếu BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_low')} /µL; rút ICS nếu viêm phổi tái diễn; bổ sung Roflumilast (FEV₁ < ${thFor('fev1PredPct', 'copd.fev1_severe_roflumilast')}%, viêm phế quản mạn), Azithromycin (người không còn hút thuốc, QTc bình thường), hoặc đơn trị Sinh học Dupilumab/Mepolizumab (BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} /µL trên nền ba thuốc). Chỉ định LTOT khi SpO₂ ≤ ${thFor('restingSpo2', 'copd.ltot_spo2_cutoff')}% (hoặc PaO₂ ${thFor('pao2', 'copd.ltot_cor_pulmonale_pao2_min')}–${thFor('pao2', 'copd.ltot_pao2_cor_pulmonale_max')} mmHg / SaO₂ ≤ ${thFor('restingSpo2', 'copd.ltot_cor_pulmonale_spo2_upper')}% kèm tăng áp động mạch phổi / tâm phế mạn / đa hồng cầu).`,
      status: 'upcoming',
    },
  ],
};
