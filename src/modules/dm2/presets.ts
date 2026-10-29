/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Ca bệnh nhân mẫu (Presets)
 * Phân quyền: Agent F4
 */

import type { PresetPatient } from '../../engine/types';

export const dm2Presets: PresetPatient[] = [
  // CA 1: NGOẠI TRÚ - ĐTĐ2 KÈM ASCVD VÀ CKD G3a
  {
    id: 'dm2_preset_cardiorenal_ascvd_ckd',
    nameVi: 'BN 1: ĐTĐ típ 2 + ASCVD + CKD G3aA2 (Đa bảo vệ tim-thận)',
    description:
      'Nam 62 tuổi, ĐTĐ 6 năm, tiền sử nhồi máu cơ tim cũ, eGFR 52 mL/phút/1.73m², UACR 18 mg/mmol, HbA1c 8.2%, HA 138/84 mmHg. Cần phối hợp SGLT2i + GLP-1 RA + Metformin.',
    setting: 'outpatient',
    patient: {
      age: 62,
      sex: 'male',
      weight: 74,
      height: 168,
      sbp: 138,
      dbp: 84,
      hr: 76,
      rhythm: 'sinus',
      scr: 125,
      k: 4.5,
      glucose: 9.8,
      hba1c: 8.2,
      uacr: 18,
      tc: 4.8,
      hdl: 1.0,
      ldl: 2.8,
      tg: 2.2,
      selectedModules: ['dm2', 'ckd'],
      conditions: {
        dm: true,
        ascvd: true,
        ckd: true,
        htn: true
      },
      currentMeds: [
        { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg', freq: '2 lần/ngày' },
        { drugId: 'aspirin', name: 'Aspirin', dose: 81, unit: 'mg', freq: '1 lần/ngày' }
      ],
      customInputs: {
        dmDurationYears: 6,
        elderlyHealthStatus: 'not_elderly',
        recentHypo: false,
        catabolicSymptoms: false
      }
    }
  },

  // CA 2: NGOẠI TRÚ - SUY TIM PHÁT HIỆN TRÊN ĐTĐ (CẢNH BÁO PIOGLITAZONE)
  {
    id: 'dm2_preset_hf_pioglitazone_contra',
    nameVi: 'BN 2: ĐTĐ típ 2 kèm Suy tim HFrEF (Chống chỉ định Pioglitazone)',
    description:
      'Nữ 68 tuổi, ĐTĐ 10 năm, suy tim HFrEF ổn định ngoại trú (LVEF 35%, NYHA II), đang dùng Pioglitazone 30 mg và Gliclazide MR 60 mg, eGFR 46 mL/min, HbA1c 7.9%. Cần ngừng ngay Pioglitazone, bắt đầu SGLT2i, giảm liều Gliclazide phòng hạ đường huyết.',
    setting: 'outpatient',
    patient: {
      age: 68,
      sex: 'female',
      weight: 65,
      height: 156,
      sbp: 124,
      dbp: 76,
      hr: 82,
      rhythm: 'sinus',
      lvef: 35,
      nyha: 2,
      scr: 110,
      k: 4.3,
      glucose: 8.9,
      hba1c: 7.9,
      uacr: 6,
      selectedModules: ['dm2', 'hf'],
      conditions: {
        dm: true,
        hf: true
      },
      currentMeds: [
        { drugId: 'pioglitazone', name: 'Pioglitazone (Actos)', dose: 30, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'gliclazide', name: 'Gliclazide MR (Diamicron MR)', dose: 60, unit: 'mg', freq: '1 lần/ngày' }
      ],
      customInputs: {
        dmDurationYears: 10,
        elderlyHealthStatus: 'healthy',
        recentHypo: false
      }
    }
  },

  // CA 3: NGOẠI TRÚ - NGƯỜI CAO TUỔI SUY YẾU (XUỐNG THANG / DEINTENSIFICATION)
  {
    id: 'dm2_preset_elderly_complex_deintensify',
    nameVi: 'BN 3: Người cao tuổi 79 tuổi (Hạ đường huyết tái phát -> Cần xuống thang)',
    description:
      'Nam 79 tuổi, ĐTĐ 16 năm, nhiều bệnh đồng mắc, sa sút trí tuệ nhẹ, tiền sử hạ đường huyết tuần trước, đang dùng Insulin Glargine 28 U + Glimepiride 4 mg, HbA1c 6.3% (kiểm soát quá chặt nguy hiểm), eGFR 36 mL/min. Cần nới lỏng đích < 8.0%, ngừng Glimepiride, giảm liều Glargine.',
    setting: 'outpatient',
    patient: {
      age: 79,
      sex: 'male',
      weight: 58,
      height: 162,
      sbp: 134,
      dbp: 72,
      hr: 68,
      scr: 145,
      k: 4.6,
      glucose: 4.8,
      hba1c: 6.3,
      uacr: 22,
      selectedModules: ['dm2'],
      conditions: {
        dm: true,
        ckd: true,
        htn: true
      },
      currentMeds: [
        { drugId: 'insulin_glargine', name: 'Insulin Glargine', dose: 28, unit: 'đơn vị', freq: '1 lần/ngày trước ngủ' },
        { drugId: 'glimepiride', name: 'Glimepiride', dose: 4, unit: 'mg', freq: '1 lần/ngày' }
      ],
      customInputs: {
        dmDurationYears: 16,
        elderlyHealthStatus: 'complex',
        recentHypo: true,
        currentBasalDoseUnits: 28
      }
    }
  },

  // CA 4: NỘI VIỆN - CẤP CỨU DKA KÈM HẠ KALI MÁU (BẤT BIẾN AN TOÀN SỐNG CÒN)
  {
    id: 'dm2_preset_inpatient_dka_emergency',
    nameVi: 'BN 4: Cấp cứu Toan ceton ĐTĐ (DKA) kèm Kali thấp (HOÃN INSULIN - BÙ KALI TRƯỚC)',
    description:
      'Nữ 34 tuổi, ĐTĐ vào viện cấp cứu vì nôn nhiều, thở Kussmaul, glucose 23.5 mmol/L (423 mg/dL), pH tĩnh mạch 7.18, HCO3 11 mmol/L, Beta-hydroxybutyrate 4.2 mmol/L, K+ 3.1 mmol/L (< 3.5). Bắt buộc HOÃN INSULIN, bù dịch + bù Kali trước.',
    setting: 'inpatient',
    patient: {
      age: 34,
      sex: 'female',
      weight: 60,
      height: 158,
      sbp: 96,
      dbp: 60,
      hr: 122,
      rhythm: 'sinus',
      scr: 130,
      k: 3.1, // HẠ KALI MÁU SỐNG CÒN
      glucose: 23.5,
      hba1c: 11.2,
      selectedModules: ['dm2'],
      conditions: {
        dm: true
      },
      currentMeds: [],
      customInputs: {
        inpatientUnit: 'icu',
        dkaSuspected: true,
        bloodKetones: 4.2,
        venousPh: 7.18,
        serumBicarb: 11,
        inpatientEating: 'npo'
      }
    }
  }
];
