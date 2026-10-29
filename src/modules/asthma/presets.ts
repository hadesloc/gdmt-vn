/**
 * GDMT-VN Module Hen phế quản (Asthma) - Ca Bệnh nhân Mẫu (Presets)
 * Phân quyền: Agent M
 *
 * 5 ca lâm sàng đa dạng bao quát từ khởi trị ngoại trú, chuẩn độ MART,
 * hen nặng dùng thuốc sinh học, hạ bậc an toàn, đến cấp cứu cơn hen nặng.
 */

import type { PresetPatient } from '../../engine/types';
import { thFor } from '../../kb-types';

export const asthmaPresets: PresetPatient[] = [
  {
    id: 'preset_asthma_new_mild',
    nameVi: 'Hen mới chẩn đoán: Triệu chứng ngắt quãng nhẹ (Track 1 Bậc 1–2)',
    description: 'Nam 24 tuổi, ho khò khè ngắt quãng 1–2 lần/tuần, không thức giấc đêm, FEV1 86%, chưa dùng thuốc kiểm soát.',
    patient: {
      id: 'pt_asthma_new_mild',
      name: 'Nguyễn Văn A (24 tuổi)',
      age: 24,
      sex: 'male',
      weight: 62,
      height: 170,
      sbp: 118,
      dbp: 74,
      hr: 76,
      rhythm: 'sinus',
      fev1Pct: 86,
      conditions: {
        asthma: true,
        allergicRhinitis: true
      },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 0,
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false,
        inhalerTechniqueCorrect: true,
        goodAdherence: true,
        exacerbationsLastYear: 0,
        pefPct: 88
      }
    }
  },
  {
    id: 'preset_asthma_uncontrolled_step2',
    nameVi: 'Hen không kiểm soát ở Bậc 2: Tăng bậc lên Track 1 Bậc 3 (MART)',
    description: 'Nữ 32 tuổi, đang dùng ICS liều thấp nhưng triệu chứng 4 ngày/tuần, thức giấc đêm 2 lần/tuần, kỹ thuật hít đúng.',
    patient: {
      id: 'pt_asthma_uncontrolled_step2',
      name: 'Trần Thị B (32 tuổi)',
      age: 32,
      sex: 'female',
      weight: 54,
      height: 158,
      sbp: 110,
      dbp: 70,
      hr: 82,
      rhythm: 'sinus',
      fev1Pct: 72,
      conditions: {
        asthma: true
      },
      selectedModules: ['asthma'],
      currentMeds: [
        {
          drugId: 'budesonide',
          name: 'Budesonide',
          dose: `${thFor('dose_daily', 'asthma.ics.budesonide_low_min')} mcg x 2 lần/ngày`,
          freq: '2 lần/ngày'
        }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 2,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: false,
        inhalerTechniqueCorrect: true,
        goodAdherence: true,
        exacerbationsLastYear: 1,
        pefPct: 74
      }
    }
  },
  {
    id: 'preset_asthma_severe_step5_eosinophilic',
    nameVi: 'Hen nặng Bậc 5: BCAT máu cao (Kiểu hình Type 2) → LAMA + Thuốc sinh học',
    description: 'Nam 48 tuổi, Bậc 4 MART không kiểm soát, 2 đợt cấp/năm, BCAT 480 cells/µL, FEV1 58%, tuân thủ tốt.',
    patient: {
      id: 'pt_asthma_severe_step5',
      name: 'Lê Văn C (48 tuổi)',
      age: 48,
      sex: 'male',
      weight: 74,
      height: 168,
      sbp: 125,
      dbp: 80,
      hr: 86,
      rhythm: 'sinus',
      fev1Pct: 58,
      conditions: {
        asthma: true,
        gerd: true
      },
      selectedModules: ['asthma'],
      currentMeds: [
        {
          drugId: 'budesonide_formoterol',
          name: 'Symbicort Turbuhaler',
          dose: `${160}/4.5 mcg x 2 nhát x 2 lần/ngày`,
          freq: '2 lần/ngày'
        }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 4,
        daytimeSymptomsMoreThanTwiceWeek: true,
        nightWakingDueToAsthma: true,
        relieverNeededMoreThanTwiceWeek: true,
        activityLimitationDueToAsthma: true,
        inhalerTechniqueCorrect: true,
        goodAdherence: true,
        exacerbationsLastYear: 2,
        bloodEosinophils: 480,
        feno: 45,
        pefPct: 60
      }
    }
  },
  {
    id: 'preset_asthma_step_down_candidate',
    nameVi: 'Hen kiểm soát tốt ổn định 6 tháng: Ứng viên hạ bậc giảm liều ICS 25–50%',
    description: 'Nữ 40 tuổi, duy trì Track 1 Bậc 3 ổn định 6 tháng qua, không triệu chứng, PEF 92%, không đợt cấp.',
    patient: {
      id: 'pt_asthma_step_down',
      name: 'Phạm Thị D (40 tuổi)',
      age: 40,
      sex: 'female',
      weight: 56,
      height: 160,
      sbp: 115,
      dbp: 75,
      hr: 74,
      rhythm: 'sinus',
      fev1Pct: 90,
      conditions: {
        asthma: true
      },
      selectedModules: ['asthma'],
      currentMeds: [
        {
          drugId: 'budesonide_formoterol',
          name: 'Symbicort Turbuhaler',
          dose: `${160}/4.5 mcg x 1 nhát x 2 lần/ngày`,
          freq: '2 lần/ngày'
        }
      ],
      customInputs: {
        currentTrack: 'track1',
        currentStep: 3,
        daytimeSymptomsMoreThanTwiceWeek: false,
        nightWakingDueToAsthma: false,
        relieverNeededMoreThanTwiceWeek: false,
        activityLimitationDueToAsthma: false,
        wellControlledMonths: 6,
        inhalerTechniqueCorrect: true,
        goodAdherence: true,
        exacerbationsLastYear: 0,
        pefPct: 92
      }
    }
  },
  {
    id: 'preset_asthma_acute_severe_er',
    nameVi: 'Cơn hen phế quản cấp nặng tại Cấp cứu (Ca on-call er_asthma_0218)',
    description: 'Nữ 29 tuổi, khó thở tăng nhanh, nói từng từ, co kéo cơ hô hấp phụ, HR 128, RR 32, SpO2 88%, PEF 45%.',
    setting: 'inpatient',
    patient: {
      id: 'pt_er_asthma_0218',
      name: 'Hoàng Thị E (29 tuổi)',
      age: 29,
      sex: 'female',
      weight: 54,
      height: 156,
      sbp: 142,
      dbp: 86,
      hr: 128,
      rhythm: 'sinus',
      fev1Pct: 45,
      conditions: {
        asthma: true
      },
      selectedModules: ['asthma'],
      currentMeds: [],
      customInputs: {
        isAcuteExacerbation: true,
        speechAbility: 'words',
        respiratoryRate: 32,
        accessoryMuscleUse: true,
        silentChest: false,
        mentalStatus: 'anxious',
        pefPct: 45,
        spo2: 88
      }
    }
  }
];

export default asthmaPresets;
