/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ca Bệnh nhân Mẫu (Presets)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { PresetPatient } from '../../engine/types';

export const htnPresets: PresetPatient[] = [
  {
    id: 'htn_preset_grade2_dual_spc',
    nameVi: 'THA Độ 2 mới chẩn đoán: Chỉ định viên phối hợp đôi SPC',
    description: 'Nam 52 tuổi, tài xế, khám định kỳ phát hiện huyết áp độ 2 tăng cao. Chưa từng điều trị thuốc hạ áp.',
    patient: {
      age: 52,
      sex: 'male',
      weight: 72,
      height: 168,
      sbp: 162,
      dbp: 98,
      hr: 78,
      scr: 88,
      k: 4.2,
      selectedModules: ['htn'],
      conditions: {
        htn: true
      },
      currentMeds: []
    }
  },
  {
    id: 'htn_preset_resistant_spiro',
    nameVi: 'THA Kháng trị: Đủ điều kiện khởi trị Spironolactone bước 4',
    description: 'Nam 58 tuổi, tiền sử THA đang dùng ba thuốc phối hợp liều tối ưu. Huyết áp phòng khám chưa kiểm soát, kali máu và lọc thận an toàn.',
    patient: {
      age: 58,
      sex: 'male',
      weight: 76,
      height: 170,
      sbp: 148,
      dbp: 92,
      hr: 74,
      scr: 105,
      k: 4.1,
      selectedModules: ['htn'],
      conditions: {
        htn: true
      },
      currentMeds: [
        { drugId: 'perindopril', name: 'Coversyl', dose: 10, unit: 'mg' },
        { drugId: 'amlodipine', name: 'Amlor', dose: 10, unit: 'mg' },
        { drugId: 'indapamide', name: 'Natrilix SR', dose: 1.5, unit: 'mg' }
      ]
    }
  },
  {
    id: 'htn_preset_gout_caution',
    nameVi: 'Tăng huyết áp kèm Bệnh Gút: Ưu tiên CCB + Losartan, tránh Thiazide',
    description: 'Nam 49 tuổi, tiền sử ba đợt sưng đau khớp ngón chân cái do gút cấp, acid uric máu tăng cao. Huyết áp chưa kiểm soát.',
    patient: {
      age: 49,
      sex: 'male',
      weight: 78,
      height: 167,
      sbp: 154,
      dbp: 96,
      hr: 80,
      scr: 95,
      k: 4.3,
      uricAcid: 520,
      selectedModules: ['htn', 'gout'],
      conditions: {
        htn: true,
        gout: true
      },
      currentMeds: []
    }
  },
  {
    id: 'htn_preset_elderly_monotherapy',
    nameVi: 'Người rất cao tuổi (86 tuổi): Đơn trị liệu liều thấp & Đích nới lỏng',
    description: 'Nữ 86 tuổi, thể trạng suy yếu, có tiền sử choáng váng khi đứng dậy (hạ huyết áp tư thế). Huyết áp tâm thu tăng cao.',
    patient: {
      age: 86,
      sex: 'female',
      weight: 46,
      height: 150,
      sbp: 156,
      dbp: 84,
      hr: 72,
      scr: 92,
      k: 4.4,
      selectedModules: ['htn'],
      conditions: {
        htn: true,
        frailty: true,
        orthostaticHypotension: true
      },
      currentMeds: []
    }
  },
  {
    id: 'htn_preset_pregnancy_safe',
    nameVi: 'Tăng huyết áp trong Thai kỳ: Cấm RASi, an toàn với Methyldopa / Labetalol / Nifedipine LA',
    description: 'Nữ 29 tuổi, mang thai tuần thứ 22, huyết áp đo hai lần đều ở mức tăng cao, không phù mặt, không protein niệu.',
    patient: {
      age: 29,
      sex: 'female',
      weight: 62,
      height: 158,
      sbp: 158,
      dbp: 98,
      hr: 84,
      scr: 62,
      k: 4.0,
      selectedModules: ['htn'],
      conditions: {
        pregnant: true,
        htn: true
      },
      currentMeds: []
    }
  }
];
