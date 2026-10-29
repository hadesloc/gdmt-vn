/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ma trận Nhóm Thuốc × Bệnh Đồng Mắc
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { MatrixDefinition } from '../../engine/types';

// ============================================================================
// 1. MA TRẬN NHÓM THUỐC × BỆNH ĐỒNG MẮC
// ============================================================================
export const htnComorbidityMatrix: MatrixDefinition = {
  title: 'Ma trận lựa chọn nhóm thuốc hạ áp theo bệnh đồng mắc (ESC 2024 / AHA 2025 / VSH 2022)',
  columns: [
    { id: 'general', label: 'THA vô căn', subLabel: 'Chưa biến chứng' },
    { id: 'cad', label: 'Bệnh mạch vành', subLabel: 'Đau thắt ngực / sau MI' },
    { id: 'hfref', label: 'Suy tim HFrEF', subLabel: 'Phân suất tống máu giảm' },
    { id: 'ckd', label: 'CKD & Đạm niệu', subLabel: 'Bảo vệ thận' },
    { id: 'stroke', label: 'Tiền sử đột quỵ', subLabel: 'Phòng ngừa thứ phát' },
    { id: 'diabetes', label: 'Đái tháo đường', subLabel: 'Nguy cơ tim mạch cao' },
    { id: 'gout', label: 'Bệnh gút', subLabel: 'Tăng acid uric' },
    { id: 'asthma', label: 'Hen phế quản', subLabel: 'Co thắt phế quản' },
    { id: 'pregnancy', label: 'Phụ nữ có thai', subLabel: 'Thai kỳ' }
  ],
  rows: [
    {
      drugId: 'rasi',
      nameVi: 'Thuốc ức chế hệ RAS (ACEi / ARB)',
      cells: {
        general: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        cad: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        hfref: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        ckd: { initiate: 'rec', continue: 'rec', note: 'Trụ cột giảm đạm niệu và bảo vệ cầu thận', citationIds: ['kdigo.bp.2021.rec_3_2_albuminuria_rasi', 'esc.htn.2024.ckd_rec26'] },
        stroke: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        diabetes: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        gout: { initiate: 'rec', continue: 'rec', note: 'Ưu tiên Losartan nhờ tác dụng tăng thải acid uric niệu', citationIds: ['esc.htn.2024.first_line_classes'] },
        asthma: { initiate: 'rec', continue: 'rec', note: 'Lưu ý phân biệt ho khan do ACEi với triệu chứng hen', citationIds: ['esc.htn.2024.first_line_classes'] },
        pregnancy: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định tuyệt đối: gây quái thai, thiểu ối và suy thận thai nhi', citationIds: ['esc.htn.2024.pregnancy_contraindication_rasi', 'aha.acc.2025.pregnancy_contra_rec5'] }
      }
    },
    {
      drugId: 'amlodipine',
      nameVi: 'Chẹn kênh canxi DHP (Amlodipine, Nifedipine LA)',
      cells: {
        general: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        cad: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        hfref: { initiate: 'ok', continue: 'ok', note: 'Amlodipine hoặc Felodipine an toàn khi cần hạ áp thêm; tránh non-DHP', citationIds: ['esc.htn.2024.first_line_classes'] },
        ckd: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        stroke: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        diabetes: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        gout: { initiate: 'rec', continue: 'rec', note: 'Nhóm thuốc ưu tiên không làm tăng acid uric máu', citationIds: ['esc.htn.2024.first_line_classes'] },
        asthma: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        pregnancy: { initiate: 'caution', continue: 'caution', note: 'Nifedipine phóng thích kéo dài là CCB hàng đầu; Amlodipine chỉ dùng hàng hai', citationIds: ['esc.htn.2024.pregnancy_first_line', 'aha.acc.2025.pregnancy_table22_full'] }
      }
    },
    {
      drugId: 'indapamide',
      nameVi: 'Lợi tiểu Thiazide & Thiazide-like (Indapamide, Chlorthalidone)',
      cells: {
        general: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        cad: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        hfref: { initiate: 'ok', continue: 'ok', note: 'Hỗ trợ kiểm soát HA; ưu tiên lợi tiểu quai khi có sung huyết', citationIds: ['esc.htn.2024.first_line_classes'] },
        ckd: { initiate: 'ok', continue: 'ok', note: 'Chuyển sang lợi tiểu quai khi lọc thận giảm nặng (riêng Chlorthalidone có bằng chứng CLICK)', citationIds: ['esc.htn.2024.ckd_loop_diuretic', 'esc.htn.2024.ckd_albuminuria_click'] },
        stroke: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        diabetes: { initiate: 'rec', continue: 'rec', note: 'Theo dõi điện giải và đường huyết định kỳ', citationIds: ['esc.htn.2024.first_line_classes'] },
        gout: { initiate: 'caution', continue: 'caution', note: 'Thận trọng hoặc tránh khởi trị do tăng acid uric và khởi phát cơn gút cấp', citationIds: ['esc.htn.2024.gout_thiazide_caution'] },
        asthma: { initiate: 'rec', continue: 'rec', citationIds: ['esc.htn.2024.first_line_classes'] },
        pregnancy: { initiate: 'not_rec', continue: 'not_rec', note: 'Không khuyến cáo trong thai kỳ do giảm thể tích tuần hoàn và tưới máu nhau thai', citationIds: ['ema.indapamide.pregnancy_lactation', 'esc.htn.2024.pregnancy_lactation_thiazide'] }
      }
    },
    {
      drugId: 'spironolactone',
      nameVi: 'Đối kháng thụ thể Mineralocorticoid (Spironolactone)',
      cells: {
        general: { initiate: 'ok', continue: 'ok', note: 'Thuốc lựa chọn hàng đầu cho THA kháng trị bước 4', citationIds: ['esc.htn.2024.spiro_resistant'] },
        cad: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.spiro_resistant'] },
        hfref: { initiate: 'rec', continue: 'rec', note: 'Trụ cột nền tảng GDMT giảm tử vong cho suy tim HFrEF', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Bắt buộc kiểm tra cổng an toàn Kali máu và mức lọc cầu thận trước khởi trị', citationIds: ['esc.htn.2024.spiro_resistant', 'aha.acc.2025.table13_spiro_egfr45'] },
        stroke: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.spiro_resistant'] },
        diabetes: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.spiro_resistant'] },
        gout: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.spiro_resistant'] },
        asthma: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.spiro_resistant'] },
        pregnancy: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định trong thai kỳ do kháng androgen gây nữ hóa thai nam', citationIds: ['aha.acc.2025.pregnancy_contra_rec5'] }
      }
    },
    {
      drugId: 'bisoprolol',
      nameVi: 'Thuốc chẹn beta giao cảm (Bisoprolol, Metoprolol succinate)',
      cells: {
        general: { initiate: 'ok', continue: 'ok', note: 'Phối hợp ở bất kỳ bước nào khi có chỉ định tim mạch bắt buộc hoặc THA kháng trị', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        cad: { initiate: 'rec', continue: 'rec', note: 'Chỉ định bắt buộc trong đau thắt ngực hoặc sau nhồi máu cơ tim', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        hfref: { initiate: 'rec', continue: 'rec', note: 'Trụ cột GDMT bắt buộc cho suy tim HFrEF khi huyết động ổn định', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        ckd: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        stroke: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        diabetes: { initiate: 'caution', continue: 'caution', note: 'Có thể che lấp triệu chứng nhịp nhanh khi hạ đường huyết', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        gout: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.beta_blocker_indications'] },
        asthma: { initiate: 'caution', continue: 'caution', note: 'Chống chỉ định chẹn beta không chọn lọc; thận trọng tối đa trên hen phế quản', citationIds: ['vsh.htn.2022.bb_contraindications_table11', 'esc.htn.2024.beta_blocker_indications'] },
        pregnancy: { initiate: 'caution', continue: 'caution', note: 'Labetalol là chẹn beta hàng đầu trong thai kỳ; chống chỉ định Atenolol', citationIds: ['esc.htn.2024.pregnancy_first_line', 'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa'] }
      }
    },
    {
      drugId: 'doxazosin',
      nameVi: 'Thuốc chẹn thụ thể alpha-1 (Doxazosin)',
      cells: {
        general: { initiate: 'ok', continue: 'ok', note: 'Thuốc thay thế bước sau trong THA kháng trị; lưu ý hạ huyết áp tư thế liều đầu', citationIds: ['aha.acc.2025.table13_alpha1', 'esc.htn.2024.oh_switch_rec24'] },
        cad: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        hfref: { initiate: 'not_rec', continue: 'not_rec', note: 'Tránh dùng do nguy cơ giữ nước và làm nặng suy tim', citationIds: ['aha.acc.2025.table13_alpha1'] },
        ckd: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        stroke: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        diabetes: { initiate: 'ok', continue: 'ok', note: 'Theo dõi hạ huyết áp tư thế nếu có biến chứng thần kinh tự chủ', citationIds: ['aha.acc.2025.table13_alpha1', 'esc.htn.2024.oh_switch_rec24'] },
        gout: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        asthma: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        pregnancy: { initiate: 'not_rec', continue: 'not_rec', note: 'Không thuộc nhóm hàng đầu do thiếu dữ liệu an toàn thai kỳ', citationIds: ['esc.htn.2024.pregnancy_first_line'] }
      }
    },
    {
      drugId: 'methyldopa',
      nameVi: 'Chủ vận giao cảm trung ương (Methyldopa)',
      cells: {
        general: { initiate: 'ok', continue: 'ok', note: 'Chỉ dùng hàng cuối khi các nhóm khác không dung nạp', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        cad: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        hfref: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Cần kéo dài khoảng cách liều khi suy thận vừa - nặng', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        stroke: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        diabetes: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        gout: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        asthma: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        pregnancy: { initiate: 'rec', continue: 'rec', note: 'Thuốc lựa chọn hàng đầu trong thai kỳ; tránh dùng nếu trầm cảm hoặc hậu sản', citationIds: ['esc.htn.2024.pregnancy_first_line', 'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa'] }
      }
    }
  ]
};
