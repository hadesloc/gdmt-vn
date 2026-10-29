/**
 * GDMT-VN CKD Module - Clinical Presets (Ca lâm sàng mẫu điển hình)
 * Phân quyền: Agent E
 */

import type { PresetPatient } from '../../engine/types';

export const ckdPresets: PresetPatient[] = [
  {
    id: 'ckd_preset_1_t2d_g3ba3_four_pillars',
    nameVi: 'BN 1 (Ngoại trú): ĐTĐ típ 2 + CKD G3bA3 đang dùng Losartan 50 mg (Chưa có SGLT2i)',
    description:
      'Nam 64 tuổi, eGFR ~39 mL/phút/1.73m², UACR 45 mg/mmol (A3), K⁺ 4.5 mmol/L, HA 136/82 mmHg. Minh họa khởi trị SGLT2i (1A), chuẩn độ tăng liều Losartan lên 100 mg (tạm hoãn Finerenone cho tới khi đạt liều tối đa dung nạp RASi), bổ sung Semaglutide (FLOW) và Statin.',
    setting: 'outpatient',
    patient: {
      id: 'pt_preset_ckd_1',
      name: 'Nguyễn Văn A (Mẫu CKD 1)',
      age: 64,
      sex: 'male',
      weight: 68,
      height: 166,
      sbp: 136,
      dbp: 82,
      hr: 74,
      scr: 165,
      k: 4.5,
      hco3: 23,
      uacr: 45,
      hba1c: 7.4,
      conditions: {
        ckd: true,
        dm: true,
        htn: true
      },
      currentMeds: [
        { drugId: 'losartan', name: 'Cozaar 50 mg', dose: 50, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'metformin', name: 'Glucophage 850 mg', dose: 850, unit: 'mg', freq: '2 lần/ngày' }
      ],
      selectedModules: ['ckd'],
      customInputs: {
        ckdEtiology: 'diabetic',
        takingNsaid: false,
        akiSuspected: false
      }
    }
  },
  {
    id: 'ckd_preset_2_stage4_acidosis_hyperk',
    nameVi: 'BN 2 (Ngoại trú): CKD G4A3 + Toan chuyển hóa + Tăng Kali mạn 5.4 mmol/L',
    description:
      'Nữ 69 tuổi, eGFR ~22 mL/phút/1.73m² (< 25 nên không khởi trị mới Finerenone; nếu eGFR ≥ 25 cũng phải tạm hoãn [DEFER] khi K⁺ = 5.4 > 5.0 mmol/L), HCO₃⁻ 16 mmol/L, đang dùng Forxiga 10 mg + Coversyl (Perindopril) 5 mg/ngày. Minh họa duy trì SGLT2i ở G4, chỉnh giảm liều Perindopril theo mức lọc cầu thận (2.5 mg cách ngày), bù Natri Bicarbonat đường uống, khởi trị chất gắn kali để duy trì liệu pháp RASi/SGLT2i và chuyển khám chuyên khoa Thận.',
    setting: 'outpatient',
    patient: {
      id: 'pt_preset_ckd_2',
      name: 'Trần Thị B (Mẫu CKD 2)',
      age: 69,
      sex: 'female',
      weight: 54,
      height: 155,
      sbp: 128,
      dbp: 76,
      hr: 70,
      scr: 215,
      k: 5.4,
      hco3: 16,
      uacr: 55,
      conditions: {
        ckd: true,
        dm: true,
        htn: true
      },
      currentMeds: [
        { drugId: 'dapagliflozin', name: 'Forxiga 10 mg', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'perindopril', name: 'Coversyl 5 mg', dose: 5, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'atorvastatin', name: 'Lipitor 20 mg', dose: 20, unit: 'mg', freq: '1 lần/ngày' }
      ],
      selectedModules: ['ckd'],
      customInputs: {
        ckdEtiology: 'diabetic',
        takingNsaid: false,
        akiSuspected: false
      }
    }
  },
  {
    id: 'ckd_preset_3_inpatient_aki_stage2',
    nameVi: 'BN 3 (Nội trú): Đợt cấp AKI Giai đoạn 2 trên nền CKD + Tạm ngừng thuốc ngày ốm',
    description:
      'Nam 70 tuổi nhập viện vì tiêu chảy mất nước cấp, Creatinin tăng từ nền 130 lên 280 µmol/L, thiểu niệu kéo dài ≥ 12 giờ, K⁺ 5.3 mmol/L. Minh họa phân độ KDIGO AKI Giai đoạn 2, tạm ngừng toàn bộ thuốc nhóm ngày ốm (SGLT2i, RASi, Metformin, lợi tiểu) và theo dõi điện giải nội viện.',
    setting: 'inpatient',
    patient: {
      id: 'pt_preset_ckd_3',
      name: 'Lê Văn C (Mẫu Nội viện AKI)',
      age: 70,
      sex: 'male',
      weight: 64,
      height: 165,
      sbp: 104,
      dbp: 64,
      hr: 92,
      scr: 280,
      k: 5.3,
      hco3: 19,
      conditions: {
        ckd: true,
        dm: true,
        htn: true,
        aki: true
      },
      currentMeds: [
        { drugId: 'empagliflozin', name: 'Jardiance 10 mg', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'losartan', name: 'Cozaar 50 mg', dose: 50, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'furosemide', name: 'Lasix 40 mg', dose: 40, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'metformin', name: 'Glucophage 1000 mg', dose: 1000, unit: 'mg', freq: '2 lần/ngày' }
      ],
      selectedModules: ['ckd'],
      customInputs: {
        baselineScr: 130,
        akiSuspected: true,
        urineOutputRate: 'oliguria_12h',
        ecgHyperkalemia: false,
        takingNsaid: false,
        contrastPlanned: false
      }
    }
  },
  {
    id: 'ckd_preset_4_severe_hyperkalemia_emergency',
    nameVi: 'BN 4 (Cấp cứu Nội viện): Tăng Kali máu nặng 6.8 mmol/L có biến đổi ECG',
    description:
      'Nam 68 tuổi nhập cấp cứu nội viện vì yếu cơ, điện tâm đồ có sóng T cao nhọn và QRS giãn rộng, K⁺ = 6.8 mmol/L trên nền CKD G4 đang dùng Cozaar + Spironolactone. Minh họa phác đồ hồi sức bảo vệ cơ tim 5 bước UKKA 2022 (Calcium Gluconate 10% TM + Insulin-Glucose TM + Salbutamol + Lokelma 10 g x 3 lần/ngày).',
    setting: 'inpatient',
    patient: {
      id: 'pt_preset_ckd_4',
      name: 'Phạm Văn D (Mẫu Cấp cứu Tăng Kali)',
      age: 68,
      sex: 'male',
      weight: 62,
      height: 164,
      sbp: 126,
      dbp: 76,
      hr: 58,
      scr: 260,
      k: 6.8,
      hco3: 17,
      conditions: {
        ckd: true,
        htn: true,
        aki: true
      },
      currentMeds: [
        { drugId: 'losartan', name: 'Cozaar 50 mg', dose: 50, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'spironolactone', name: 'Aldactone 25 mg', dose: 25, unit: 'mg', freq: '1 lần/ngày' }
      ],
      selectedModules: ['ckd'],
      customInputs: {
        baselineScr: 190,
        akiSuspected: true,
        urineOutputRate: 'normal',
        ecgHyperkalemia: true,
        refractoryHyperkalemia: false,
        contrastPlanned: false
      }
    }
  }
];
