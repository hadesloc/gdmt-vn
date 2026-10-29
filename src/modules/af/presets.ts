/**
 * Ca lâm sàng mẫu (Presets) cho Module Rung nhĩ (AF)
 * Minh họa 5 kịch bản điển hình bao phủ chống đông DOAC/VKA, kiểm soát tần số/nhịp và cấp cứu nội viện
 */

import type { PresetPatient } from '../../engine/types';

export const afPresets: PresetPatient[] = [
  {
    id: 'af_preset_new_paroxysmal_high_risk',
    nameVi: '1. Rung nhĩ kịch phát mới phát hiện (CHA₂DS₂-VA = 3)',
    description:
      'Nam 72 tuổi, tăng huyết áp, đái tháo đường, chức năng thận bảo tồn (SCr 88 µmol/L), LVEF 58%, HR 98 bpm: Khởi trị DOAC liều chuẩn + Chẹn beta kiểm soát tần số.',
    setting: 'outpatient',
    patient: {
      age: 72,
      sex: 'male',
      weight: 68,
      height: 168,
      sbp: 138,
      dbp: 82,
      hr: 98,
      rhythm: 'afib',
      scr: 88,
      lvef: 58,
      selectedModules: ['af', 'htn', 'dm2'],
      conditions: {
        af: true,
        htn: true,
        dm: true
      },
      currentMeds: [
        { drugId: 'amlodipine', name: 'Amlodipine', dose: 5, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg', freq: '2 lần/ngày' }
      ],
      customInputs: {
        afType: 'paroxysmal',
        ehraScore: '2b',
        hemodynamicStability: 'stable'
      }
    }
  },
  {
    id: 'af_preset_elderly_frail_apixaban_reduced',
    nameVi: '2. Cụ bà 84 tuổi nhẹ cân (52 kg) – Tiêu chí giảm liều Apixaban',
    description:
      'Nữ 84 tuổi, cân nặng 52 kg, SCr 125 µmol/L (CrCl ~27 mL/phút), tiền sử TIA: Thỏa ≥ 2/3 tiêu chí giảm liều Apixaban 2.5 mg x 2 lần/ngày, chống chỉ định Dabigatran tại châu Âu/VN.',
    setting: 'outpatient',
    patient: {
      age: 84,
      sex: 'female',
      weight: 52,
      height: 152,
      sbp: 132,
      dbp: 76,
      hr: 84,
      rhythm: 'afib',
      scr: 125,
      lvef: 55,
      selectedModules: ['af', 'ckd'],
      conditions: {
        af: true,
        htn: true,
        strokeOrTia: true,
        ckd: true
      },
      currentMeds: [
        { drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg', freq: '2 lần/ngày' },
        { drugId: 'bisoprolol', name: 'Concor', dose: 2.5, unit: 'mg', freq: '1 lần/ngày' }
      ],
      customInputs: {
        afType: 'persistent',
        ehraScore: '2a',
        hemodynamicStability: 'stable'
      }
    }
  },
  {
    id: 'af_preset_hfref_contra_ccb_ic',
    nameVi: '3. Rung nhĩ kèm Suy tim HFrEF (LVEF 30%) đang dùng nhầm Diltiazem',
    description:
      'Nam 66 tuổi, suy tim phân suất tống máu giảm (LVEF 30%), HR 114 bpm, đang uống Diltiazem: Cảnh báo DỪNG NGAY Diltiazem (Class III), chuyển sang Chẹn beta suy tim và cân nhắc Amiodarone / Triệt đốt.',
    setting: 'outpatient',
    patient: {
      age: 66,
      sex: 'male',
      weight: 65,
      height: 166,
      sbp: 112,
      dbp: 70,
      hr: 114,
      rhythm: 'afib',
      scr: 102,
      k: 4.3,
      lvef: 30,
      nyha: 3,
      selectedModules: ['af', 'hf'],
      conditions: {
        af: true,
        hf: true,
        ascvd: true
      },
      currentMeds: [
        { drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'diltiazem', name: 'Herbesser', dose: 120, unit: 'mg', freq: '1 lần/ngày' }
      ],
      customInputs: {
        afType: 'persistent',
        ehraScore: '3',
        hemodynamicStability: 'stable'
      }
    }
  },
  {
    id: 'af_preset_mechanical_mitral_valve',
    nameVi: '4. Van hai lá cơ học – Chống chỉ định tuyệt đối mọi DOAC',
    description:
      'Nữ 54 tuổi, đã thay van hai lá cơ học: Chống chỉ định tuyệt đối tất cả DOAC (Apixaban, Rivaroxaban, Dabigatran, Edoxaban); bắt buộc duy trì Warfarin/Acenocoumarol theo dõi sát INR.',
    setting: 'outpatient',
    patient: {
      age: 54,
      sex: 'female',
      weight: 56,
      height: 156,
      sbp: 118,
      dbp: 74,
      hr: 78,
      rhythm: 'afib',
      scr: 76,
      lvef: 60,
      selectedModules: ['af'],
      conditions: {
        af: true,
        mechanicalValve: true
      },
      currentMeds: [
        { drugId: 'warfarin', name: 'Coumadin', dose: 3, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'bisoprolol', name: 'Concor', dose: 5, unit: 'mg', freq: '1 lần/ngày' }
      ],
      customInputs: {
        afType: 'permanent',
        ehraScore: '1',
        hemodynamicStability: 'stable'
      }
    }
  },
  {
    id: 'af_preset_inpatient_rvr_emergency',
    nameVi: '5. Nội viện: Rung nhĩ đáp ứng thất nhanh cấp tính (HR 148 bpm)',
    description:
      'Nam 63 tuổi nhập viện vì hồi hộp khó thở, HR 148 bpm, HA 126/80 mmHg, LVEF 55%, khởi phát trên 48 giờ chưa dùng chống đông: Kiểm soát tần số thất đường tĩnh mạch + Trì hoãn sốc điện nếu chưa TEE.',
    setting: 'inpatient',
    patient: {
      age: 63,
      sex: 'male',
      weight: 70,
      height: 170,
      sbp: 126,
      dbp: 80,
      hr: 148,
      rhythm: 'afib',
      scr: 92,
      lvef: 55,
      selectedModules: ['af'],
      conditions: {
        af: true,
        htn: true
      },
      currentMeds: [],
      customInputs: {
        afType: 'first_diagnosed',
        ehraScore: '3',
        afOnset: 'gt_48h_or_unknown',
        hemodynamicStability: 'stable'
      }
    }
  }
];
