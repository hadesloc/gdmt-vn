/**
 * GDMT-VN Module Tăng huyết áp (htn) - Dữ liệu Ma trận Thận (Phần 1: CCB, Lợi tiểu, Alpha-1, Methyldopa)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { MatrixDefinition } from '../../engine/types';

type MatrixRow = MatrixDefinition['rows'][number];
import { drug } from '../../kb-types';

export const htnRenalRowsPart1: MatrixRow[] = [
    {
      drugId: 'amlodipine',
      nameVi: drug('amlodipine').nameVi,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] },
        g3b: { initiate: 'rec', continue: 'rec', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] },
        g4: { initiate: 'rec', continue: 'rec', note: 'Không cần chỉnh liều theo mức độ suy thận', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] },
        g5: { initiate: 'rec', continue: 'rec', note: 'Không cần chỉnh liều; theo dõi phù ngoại biên', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] },
        dialysis: { initiate: 'rec', continue: 'rec', note: 'Không bị lọc qua màng thẩm tách', citationIds: ['fda.amlodipine.renal_hepatic_ddi'] }
      }
    },
    {
      drugId: 'nifedipine',
      nameVi: drug('nifedipine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g4: { initiate: 'ok', continue: 'ok', note: 'Chuyển hóa qua gan, chỉ dùng dạng phóng thích kéo dài LA', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g5: { initiate: 'ok', continue: 'ok', note: 'Không dùng viên tác dụng nhanh ngậm dưới lưỡi', citationIds: ['aha.acc.2025.nifedipine_no_sublingual'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] }
      }
    },
    {
      drugId: 'felodipine',
      nameVi: drug('felodipine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_ccb'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_ccb'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_ccb'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_ccb'] },
        g4: { initiate: 'ok', continue: 'ok', note: 'Thải trừ chủ yếu qua gan, không tích lũy hoạt chất gốc', citationIds: ['vsh.htn.2022.drugs_table_ccb'] },
        g5: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_ccb'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_ccb'] }
      }
    },
    {
      drugId: 'lercanidipine',
      nameVi: drug('lercanidipine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g3b: { initiate: 'caution', continue: 'ok', note: 'Thận trọng khi bắt đầu tăng liều', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g4: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định trong suy thận nặng, chuyển sang Amlodipine', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        g5: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định tuyệt đối ở suy thận giai đoạn cuối', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] },
        dialysis: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định trên bệnh nhân lọc máu', citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'] }
      }
    },
    {
      drugId: 'indapamide',
      nameVi: drug('indapamide').nameVi,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['ema.indapamide.dosing'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['ema.indapamide.dosing'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['ema.indapamide.dosing'] },
        g3b: { initiate: 'caution', continue: 'ok', note: 'Theo dõi sát Kali và Natri máu', citationIds: ['ema.indapamide.dosing'] },
        g4: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định khi suy thận nặng; đổi sang lợi tiểu quai', citationIds: ['ema.indapamide.renal_contra', 'esc.htn.2024.ckd_loop_diuretic'] },
        g5: { initiate: 'contra', continue: 'contra', citationIds: ['ema.indapamide.renal_contra'] },
        dialysis: { initiate: 'contra', continue: 'contra', citationIds: ['ema.indapamide.renal_contra'] }
      }
    },
    {
      drugId: 'chlorthalidone',
      nameVi: drug('chlorthalidone').nameVi,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['aha.acc.2025.table13_chlorthalidone'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['aha.acc.2025.table13_chlorthalidone'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['aha.acc.2025.table13_chlorthalidone'] },
        g3b: { initiate: 'rec', continue: 'rec', note: 'Theo dõi điện giải và creatinin huyết thanh', citationIds: ['aha.acc.2025.table13_chlorthalidone'] },
        g4: { initiate: 'caution', continue: 'caution', note: 'Có bằng chứng hạ áp và giảm đạm niệu ở CKD giai đoạn nặng (thử nghiệm CLICK)', citationIds: ['esc.htn.2024.ckd_albuminuria_click'] },
        g5: { initiate: 'not_rec', continue: 'not_rec', note: 'Không khuyến cáo khi suy thận giai đoạn cuối hoặc vô niệu', citationIds: ['esc.htn.2024.ckd_loop_diuretic'] },
        dialysis: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['esc.htn.2024.ckd_loop_diuretic'] }
      }
    },
    {
      drugId: 'hydrochlorothiazide',
      nameVi: drug('hydrochlorothiazide').nameVi,
      cells: {
        g1: { initiate: 'rec', continue: 'rec', citationIds: ['vsh.htn.2022.drugs_table_diuretic'] },
        g2: { initiate: 'rec', continue: 'rec', citationIds: ['vsh.htn.2022.drugs_table_diuretic'] },
        g3a: { initiate: 'rec', continue: 'rec', citationIds: ['vsh.htn.2022.drugs_table_diuretic'] },
        g3b: { initiate: 'caution', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_diuretic'] },
        g4: { initiate: 'not_rec', continue: 'not_rec', note: 'Mất hiệu quả lợi tiểu muối, chuyển sang Furosemide', citationIds: ['esc.htn.2024.ckd_loop_diuretic'] },
        g5: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['esc.htn.2024.ckd_loop_diuretic'] },
        dialysis: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['esc.htn.2024.ckd_loop_diuretic'] }
      }
    },
    {
      drugId: 'doxazosin',
      nameVi: drug('doxazosin').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] },
        g4: { initiate: 'ok', continue: 'ok', note: 'Dược động học không thay đổi ở suy thận', citationIds: ['aha.acc.2025.table13_alpha1'] },
        g5: { initiate: 'ok', continue: 'ok', note: 'Uống buổi tối để phòng hạ huyết áp tư thế', citationIds: ['aha.acc.2025.table13_alpha1'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_alpha1'] }
      }
    },
    {
      drugId: 'methyldopa',
      nameVi: drug('methyldopa').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        g3b: { initiate: 'caution', continue: 'caution', note: 'Kéo dài khoảng cách giữa các liều (mỗi 8–12 giờ)', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        g4: { initiate: 'caution', continue: 'caution', note: 'Kéo dài khoảng cách giữa các liều (mỗi 12–24 giờ) để tránh tích lũy', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        g5: { initiate: 'caution', continue: 'caution', note: 'Kéo dài khoảng cách giữa các liều (mỗi 12–24 giờ), theo dõi an thần', citationIds: ['vsh.htn.2022.drugs_table_other'] },
        dialysis: { initiate: 'caution', continue: 'caution', note: 'Kéo dài khoảng cách liều; một phần thuốc được lọc qua thẩm tách', citationIds: ['vsh.htn.2022.drugs_table_other'] }
      }
    }
];
