/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ma trận 18/18 Thuốc × Dải Chức năng Thận eGFR
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { MatrixDefinition } from '../../engine/types';

type MatrixRow = MatrixDefinition['rows'][number];
import { drug } from '../../kb-types';
import { htnRenalRowsPart1 } from './matrix.renal.part1';

const htnRenalRowsPart2: MatrixRow[] = [
    {
      drugId: 'clonidine',
      nameVi: drug('clonidine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_central_clonidine'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_central_clonidine'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_central_clonidine'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.table13_central_clonidine'] },
        g4: { initiate: 'caution', continue: 'caution', note: 'Khởi đầu liều thấp và tuyệt đối tránh ngừng thuốc đột ngột', citationIds: ['aha.acc.2025.table13_central_clonidine'] },
        g5: { initiate: 'caution', continue: 'caution', note: 'Theo dõi nhịp chậm và an thần; không cần liều bổ sung sau lọc máu', citationIds: ['aha.acc.2025.table13_central_clonidine'] },
        dialysis: { initiate: 'caution', continue: 'caution', citationIds: ['aha.acc.2025.table13_central_clonidine'] }
      }
    },
    {
      drugId: 'moxonidine',
      nameVi: drug('moxonidine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.resistant_alternatives'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2024.resistant_alternatives'] },
        g3a: { initiate: 'caution', continue: 'caution', note: 'Giới hạn liều thấp do thuốc thải trừ qua thận', citationIds: ['esc.htn.2024.resistant_alternatives'] },
        g3b: { initiate: 'caution', continue: 'caution', note: 'Giới hạn liều thấp và theo dõi sát tần số tim', citationIds: ['esc.htn.2024.resistant_alternatives'] },
        g4: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định trong suy thận nặng do tích lũy thuốc', citationIds: ['esc.htn.2024.resistant_alternatives'] },
        g5: { initiate: 'contra', continue: 'contra', citationIds: ['esc.htn.2024.resistant_alternatives'] },
        dialysis: { initiate: 'contra', continue: 'contra', citationIds: ['esc.htn.2024.resistant_alternatives'] }
      }
    },
    {
      drugId: 'nicardipine',
      nameVi: drug('nicardipine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nicardipine'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nicardipine'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nicardipine'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nicardipine'] },
        g4: { initiate: 'caution', continue: 'caution', note: 'Chuẩn độ chậm qua bơm tiêm điện, theo dõi huyết áp liên tục', citationIds: ['aha.acc.2025.iv_nicardipine'] },
        g5: { initiate: 'caution', continue: 'caution', note: 'An toàn hơn Nitroprusside do không gây ngộ độc thiocyanate', citationIds: ['aha.acc.2025.iv_nicardipine'] },
        dialysis: { initiate: 'caution', continue: 'caution', citationIds: ['aha.acc.2025.iv_nicardipine'] }
      }
    },
    {
      drugId: 'labetalol',
      nameVi: drug('labetalol').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_labetalol'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_labetalol'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_labetalol'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_labetalol'] },
        g4: { initiate: 'ok', continue: 'ok', note: 'Chuyển hóa liên hợp qua gan, không cần chỉnh liều khởi đầu', citationIds: ['aha.acc.2025.iv_labetalol'] },
        g5: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_labetalol'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_labetalol'] }
      }
    },
    {
      drugId: 'nitroglycerin',
      nameVi: drug('nitroglycerin').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nitroglycerin'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nitroglycerin'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nitroglycerin'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nitroglycerin'] },
        g4: { initiate: 'ok', continue: 'ok', note: 'Ưu tiên trong phù phổi cấp hoặc hội chứng vành cấp; cấm dùng kèm PDE-5i', citationIds: ['aha.acc.2025.iv_nitroglycerin'] },
        g5: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nitroglycerin'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_nitroglycerin'] }
      }
    },
    {
      drugId: 'urapidil',
      nameVi: drug('urapidil').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2025.urapidil_iv'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2025.urapidil_iv'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2025.urapidil_iv'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['esc.htn.2025.urapidil_iv'] },
        g4: { initiate: 'caution', continue: 'caution', note: 'Chuẩn độ thận trọng liều duy trì ở suy thận nặng', citationIds: ['vsh.htn.2022.emergency_pulmonary_edema'] },
        g5: { initiate: 'caution', continue: 'caution', citationIds: ['vsh.htn.2022.emergency_pulmonary_edema'] },
        dialysis: { initiate: 'caution', continue: 'caution', citationIds: ['vsh.htn.2022.emergency_pulmonary_edema'] }
      }
    },
    {
      drugId: 'esmolol',
      nameVi: drug('esmolol').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_esmolol'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_esmolol'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_esmolol'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_esmolol'] },
        g4: { initiate: 'caution', continue: 'caution', note: 'Thủy phân bởi esterase hồng cầu; lưu ý tích lũy chất chuyển hóa acid khi truyền kéo dài', citationIds: ['aha.acc.2025.iv_esmolol'] },
        g5: { initiate: 'caution', continue: 'caution', citationIds: ['aha.acc.2025.iv_esmolol'] },
        dialysis: { initiate: 'caution', continue: 'caution', citationIds: ['aha.acc.2025.iv_esmolol'] }
      }
    },
    {
      drugId: 'sodium_nitroprusside',
      nameVi: drug('sodium_nitroprusside').nameVi,
      cells: {
        g1: { initiate: 'caution', continue: 'caution', note: 'Chỉ dùng thời gian ngắn tại ICU có huyết áp động mạch xâm lấn', citationIds: ['aha.acc.2025.iv_nitroprusside'] },
        g2: { initiate: 'caution', continue: 'caution', citationIds: ['aha.acc.2025.iv_nitroprusside'] },
        g3a: { initiate: 'caution', continue: 'caution', citationIds: ['aha.acc.2025.iv_nitroprusside'] },
        g3b: { initiate: 'caution', continue: 'caution', note: 'Tăng nguy cơ tích lũy thiocyanate khi giảm lọc cầu thận', citationIds: ['aha.acc.2025.iv_nitroprusside'] },
        g4: { initiate: 'not_rec', continue: 'not_rec', note: 'Tránh dùng ở suy thận nặng do nguy cơ ngộ độc thiocyanate và cyanide tử vong', citationIds: ['aha.acc.2025.iv_nitroprusside'] },
        g5: { initiate: 'not_rec', continue: 'not_rec', note: 'Ưu tiên Nicardipine hoặc Clevidipine thay thế', citationIds: ['aha.acc.2025.iv_nitroprusside'] },
        dialysis: { initiate: 'not_rec', continue: 'not_rec', citationIds: ['aha.acc.2025.iv_nitroprusside'] }
      }
    },
    {
      drugId: 'clevidipine',
      nameVi: drug('clevidipine').nameVi,
      cells: {
        g1: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_clevidipine'] },
        g2: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_clevidipine'] },
        g3a: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_clevidipine'] },
        g3b: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_clevidipine'] },
        g4: { initiate: 'ok', continue: 'ok', note: 'Thủy phân bởi esterase máu, không phụ thuộc thận; chống chỉ định dị ứng đậu nành/trứng', citationIds: ['aha.acc.2025.iv_clevidipine'] },
        g5: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_clevidipine'] },
        dialysis: { initiate: 'ok', continue: 'ok', citationIds: ['aha.acc.2025.iv_clevidipine'] }
      }
    }
];

export const htnRenalMatrix: MatrixDefinition = {
  title: 'Ma trận an toàn 18 thuốc hạ áp sở hữu theo dải chức năng thận (KDIGO / ESC / AHA / VSH)',
  columns: [
    { id: 'g1', label: 'G1', subLabel: 'Bình thường' },
    { id: 'g2', label: 'G2', subLabel: 'Giảm nhẹ' },
    { id: 'g3a', label: 'G3a', subLabel: 'Giảm nhẹ - vừa' },
    { id: 'g3b', label: 'G3b', subLabel: 'Giảm vừa - nặng' },
    { id: 'g4', label: 'G4', subLabel: 'Giảm nặng' },
    { id: 'g5', label: 'G5', subLabel: 'Suy thận rất nặng' },
    { id: 'dialysis', label: 'Lọc máu', subLabel: 'HD / PD' }
  ],
  rows: [...htnRenalRowsPart1, ...htnRenalRowsPart2]
};
