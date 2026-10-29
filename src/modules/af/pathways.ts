import type { PathwayDefinition } from '../../engine/types';

/**
 * Lộ trình Quản lý Rung nhĩ Toàn diện AF-CARE theo Hướng dẫn ESC 2024
 */
export const afPathway: PathwayDefinition = {
  title: 'Lộ trình Quản lý Rung nhĩ Toàn diện AF-CARE (ESC 2024 Guidelines)',
  steps: [
    {
      id: 'step_c',
      stepNumber: 1,
      title: '[C] Quản lý bệnh đồng mắc & Lối sống (Comorbidity Management)',
      description: 'Kiểm soát chặt chẽ huyết áp, tối ưu hóa điều trị đái tháo đường, suy tim, giảm cân nếu béo phì, tầm soát ngưng thở khi ngủ và hạn chế tối đa rượu bia.',
      status: 'completed'
    },
    {
      id: 'step_a',
      stepNumber: 2,
      title: '[A] Dự phòng đột quỵ & Chống đông (Avoid Stroke / Anticoagulation)',
      description: 'Đánh giá nguy cơ bằng thang điểm CHA₂DS₂-VA (ESC 2024). Ưu tiên DOAC hơn VKA (trừ khi có van cơ học hoặc hẹp hai lá vừa–nặng). Chỉnh liều DOAC chuẩn theo độ lọc thận, tuổi, cân nặng và Creatinin.',
      status: 'active'
    },
    {
      id: 'step_r',
      stepNumber: 3,
      title: '[R] Kiểm soát triệu chứng qua Tần số & Nhịp (Rate & Rhythm Control)',
      description: 'Kiểm soát tần số ban đầu lúc nghỉ (đích nhịp lỏng): Chẹn beta hoặc Non-DHP CCB khi phân suất tống máu LVEF bảo tồn; Chẹn beta phối hợp Digoxin khi suy tim LVEF giảm (CHỐNG CHỈ ĐỊNH Diltiazem/Verapamil). Kiểm soát nhịp (AAD/triệt đốt) nếu còn triệu chứng hoặc suy tim do nhịp nhanh.',
      status: 'upcoming'
    },
    {
      id: 'step_e',
      stepNumber: 4,
      title: '[E] Đánh giá lại định kỳ & Theo dõi chức năng thận (Evaluation & Dynamic Follow-up)',
      description: 'Tái khám định kỳ mỗi ba đến sáu tháng: Đánh giá tuân thủ thuốc chống đông, nhận diện các yếu tố xuất huyết mới xuất hiện. Xét nghiệm chức năng thận định kỳ theo công thức CrCl chia mười để kịp thời hiệu chỉnh liều DOAC.',
      status: 'upcoming'
    }
  ]
};
