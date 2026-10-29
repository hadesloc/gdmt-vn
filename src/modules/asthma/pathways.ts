/**
 * GDMT-VN Module Hen phế quản (Asthma) - Lộ trình Điều trị Tối ưu (Pathway)
 * Phân quyền: Agent M
 *
 * Lộ trình 5 bước theo GINA 2026 & Bộ Y tế QĐ 1851/QĐ-BYT:
 * 1. Chẩn đoán & Đánh giá mức độ kiểm soát GINA 4 tuần.
 * 2. Lựa chọn phân nhánh (Ưu tiên Track 1 AIR/MART) & Khởi đầu bậc phù hợp.
 * 3. Đào tạo kỹ thuật bình hít & Cung cấp Bản kế hoạch hành động hen tiếng Việt.
 * 4. Theo dõi & Chuẩn độ bậc: Tăng bậc khi kém kiểm soát; Hạ bậc an toàn sau ≥ 2–3 tháng ổn định.
 * 5. Hen phế quản nặng Bậc 5: Thêm LAMA, phân tích kiểu hình sinh học (BCAT/FeNO/IgE) & Chuyển chuyên khoa.
 */

import type { PathwayDefinition } from '../../engine/types';
import { thFor } from '../../kb-types';

export const asthmaPathway: PathwayDefinition = {
  title: 'Lộ trình Quản lý & Tối ưu hóa Phác đồ Hen phế quản (GINA 2026 & BYT 1851/2020)',
  steps: [
    {
      id: 'step_1',
      stepNumber: 1,
      title: 'Khẳng định Chẩn đoán & Đánh giá Kiểm soát 4 Tuần',
      description: 'Đánh giá 4 câu hỏi GINA trong 4 tuần qua (triệu chứng ban ngày, thức giấc đêm, thuốc cắt cơn SABA, giới hạn hoạt động) và phân tầng yếu tố nguy cơ đợt cấp (tiền sử đợt cấp 12 tháng, FEV1, hút thuốc, thai kỳ, AERD, bệnh đồng mắc).',
      status: 'completed',
      citationIds: ['gina.asthma.2026.symptom_control_table_2a', 'byt.asthma.2020.symptom_control_table_3']
    },
    {
      id: 'step_2',
      stepNumber: 2,
      title: 'Lựa chọn Phân nhánh Track 1 (Ưu tiên) & Khởi đầu Bậc Điều trị',
      description: 'Lựa chọn Track 1 (ICS-formoterol làm thuốc cắt cơn AIR/MART) nhằm giảm 2/3 nguy cơ đợt cấp nặng so với SABA. Khởi trị Bậc 1–2 (AIR khi cần) cho hen nhẹ không có nguy cơ cao, hoặc Bậc 3 MART cho bệnh nhân có triệu chứng hầu hết các ngày / có đợt cấp / FEV1 thấp.',
      status: 'active',
      citationIds: ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.track1_step1_2', 'gina.asthma.2026.track1_step3']
    },
    {
      id: 'step_3',
      stepNumber: 3,
      title: 'Kiểm tra Kỹ thuật Hít thuốc & Cấp Kế hoạch Hành động Hen',
      description: 'Đào tạo và kiểm tra trực tiếp kỹ thuật sử dụng bình hít (Turbuhaler DPI không dùng buồng đệm, pMDI dùng buồng đệm, súc miệng sau hít ICS). Cung cấp Bản kế hoạch hành động hen tiếng Việt phân vùng màu Xanh - Vàng - Đỏ chuẩn đơn vị PEF (L/phút vs %).',
      status: 'upcoming',
      citationIds: ['byt.asthma.2021.action_plan_zones', 'gina.asthma.2026.track1_step5_severe']
    },
    {
      id: 'step_4',
      stepNumber: 4,
      title: 'Đánh giá lại sau 1–3 Tháng & Chuẩn độ Bậc Điều trị',
      description: `Kiểm tra đáp ứng điều trị: Nếu kiểm soát một phần/không kiểm soát -> Kiểm tra kỹ thuật hít & tuân thủ trước khi tăng bậc. Nếu kiểm soát tốt ổn định liên tục ≥ ${thFor('months', 'asthma.step_down.stability_months_min')}–${thFor('months', 'asthma.step_down.stability_months_max')} tháng, không mang thai, không đợt cấp -> Xem xét hạ bậc giảm ${thFor('percentage', 'asthma.step_down.reduction_min_pct')}–${thFor('percentage', 'asthma.step_down.reduction_max_pct')}% liều ICS duy trì (tuyệt đối không ngừng hẳn ICS).`,
      status: 'upcoming',
      citationIds: ['gina.asthma.2026.step_down_months', 'gina.asthma.2026.step_down_reduction_rate', 'byt.asthma.2020.step_down_options']
    },
    {
      id: 'step_5',
      stepNumber: 5,
      title: 'Hen phế quản Nặng Bậc 5: Duy trì ICS-LABA, Thêm LAMA, Thuốc Sinh học & Chuyên khoa',
      description: 'Khi hen không kiểm soát ở Bậc 4 dù tuân thủ và kỹ thuật đúng: Tiếp tục duy trì ICS-LABA nền tảng, phối hợp thêm LAMA (Tiotropium / Bình hít 3 thuốc), xét nghiệm kiểu hình viêm Type 2 (BCAT máu, FeNO, IgE), chỉ định thuốc sinh học đích (Omalizumab, Benralizumab, Dupilumab, Tezepelumab) và chuyển khám chuyên gia Hô hấp.',
      status: 'upcoming',
      citationIds: ['gina.asthma.2026.step5_biologics', 'gina.asthma.2026.step5_lama_triplet', 'byt.asthma.2020.type2_biomarkers']
    }
  ]
};

export default asthmaPathway;
