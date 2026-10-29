/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Bệnh nhân mẫu (Presets)
 * Phân quyền: Agent I2 / Agent I5 (Round 3 Remediation)
 * Tuân thủ QA-7 & QA-10: Nội suy ngưỡng chuẩn đại lượng qua thFor
 */

import type { PresetPatient } from '../../engine/types';
import { thFor } from '../../kb-types';

export const lipidPresets: PresetPatient[] = [
  {
    id: 'lipid_preset_1_acs_inpatient',
    nameVi: 'Hội chứng vành cấp (ACS) nhập viện trong 24 giờ đầu',
    setting: 'inpatient',
    description: `Bệnh nhân nam 58 tuổi, hút thuốc, nhập viện nội trú vì nhồi máu cơ tim cấp (STEMI), LDL-C ${3.4} mmol/L. Chỉ định Statin cường độ cao khẩn cấp trong 24h đầu bất kể mức LDL nền và phối hợp sớm Ezetimibe ${thFor('dose_mg', 'lipid.dose.ezetimibe_standard')} mg ngay trong thời gian nằm viện.`,
    patient: {
      age: 58,
      sex: 'male',
      weight: 68,
      height: 168,
      sbp: 130,
      dbp: 80,
      hr: 82,
      scr: 85,
      tc: 5.2,
      hdl: 1.0,
      ldl: 3.4,
      tg: 1.8,
      conditions: {
        ascvd: true,
        smoker: true,
        acuteAcsWithin24h: true
      },
      currentMeds: [],
      selectedModules: ['lipid']
    }
  },
  {
    id: 'lipid_preset_2_very_high_outpatient',
    nameVi: 'ASCVD kèm ĐTĐ nguy cơ rất cao xa đích LDL-C',
    setting: 'outpatient',
    description: `Bệnh nhân nữ 66 tuổi, tiền sử can thiệp mạch vành 3 năm trước, ĐTĐ típ 2 có tổn thương cơ quan đích, LDL-C ${3.8} mmol/L (đích < ${thFor('ldl', 'lipid.target.very_high_ldl')} mmol/L). Khuyến cáo khởi trị Statin cường độ cao phối hợp sớm Ezetimibe ${thFor('dose_mg', 'lipid.dose.ezetimibe_standard')} mg.`,
    patient: {
      age: 66,
      sex: 'female',
      weight: 60,
      height: 155,
      sbp: 134,
      dbp: 78,
      hr: 74,
      scr: 95,
      tc: 5.8,
      hdl: 1.1,
      ldl: 3.8,
      tg: 2.1,
      conditions: {
        ascvd: true,
        dm: true,
        dmTargetOrganDamage: true
      },
      currentMeds: [
        { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg' }
      ],
      selectedModules: ['lipid']
    }
  },
  {
    id: 'lipid_preset_3_severe_htg_pancreatitis',
    nameVi: 'Tăng Triglycerid máu rất cao (TG 8.6 mmol/L) phòng viêm tụy cấp',
    setting: 'outpatient',
    description: `Bệnh nhân nam 45 tuổi, thừa cân, TG ${8.6} mmol/L (>= ${thFor('tg', 'lipid.tg.pancreatitis_risk')} mmol/L), chức năng thận bình thường. Chỉ định khẩn cấp Fenofibrate ${thFor('dose_mg', 'lipid.dose.fenofibrate_start_145')}–${thFor('dose_mg', 'lipid.dose.fenofibrate_standard')} mg/ngày kết hợp chế độ ăn hạn chế mỡ để phòng ngừa viêm tụy cấp.`,
    patient: {
      age: 45,
      sex: 'male',
      weight: 82,
      height: 170,
      sbp: 132,
      dbp: 84,
      hr: 78,
      scr: 80,
      tc: 6.8,
      hdl: 0.9,
      ldl: 2.6,
      tg: 8.6,
      conditions: {},
      currentMeds: [],
      selectedModules: ['lipid']
    }
  },
  {
    id: 'lipid_preset_4_statin_intolerance',
    nameVi: 'Không dung nạp Statin đã trên nền Ezetimibe – Phối hợp thêm Bempedoic acid',
    setting: 'outpatient',
    description: `Bệnh nhân nam 62 tuổi, có bệnh mạch vành mạn, không dung nạp cả Atorvastatin và Rosuvastatin, đang dùng Ezetimibe ${thFor('dose_mg', 'lipid.dose.ezetimibe_standard')} mg/ngày nhưng LDL-C còn ${2.6} mmol/L, không tiền sử gút. Chỉ định phối hợp thêm Bempedoic acid ${thFor('dose_mg', 'lipid.dose.bempedoic_standard')} mg/ngày trên nền Ezetimibe ${thFor('dose_mg', 'lipid.dose.ezetimibe_standard')} mg/ngày.`,
    patient: {
      age: 62,
      sex: 'male',
      weight: 70,
      height: 165,
      sbp: 128,
      dbp: 80,
      hr: 70,
      scr: 90,
      tc: 4.5,
      hdl: 1.1,
      ldl: 2.6,
      tg: 1.7,
      conditions: {
        ascvd: true,
        statinIntolerance: true
      },
      currentMeds: [
        { drugId: 'ezetimibe', name: 'Ezetimibe', dose: 10, unit: 'mg', freq: '1 lần/ngày' }
      ],
      selectedModules: ['lipid']
    }
  },
  {
    id: 'lipid_preset_5_primary_prevention_moderate',
    nameVi: 'Phòng ngừa tiên phát nguy cơ trung bình kèm tăng Lp(a) (68 mg/dL)',
    setting: 'outpatient',
    description: `Bệnh nhân nữ 54 tuổi, không triệu chứng, LDL-C ${3.4} mmol/L (đích < ${thFor('ldl', 'lipid.target.moderate_ldl')} mmol/L), nồng độ Lp(a) ${68} mg/dL (> ${thFor('lpa', 'lipid.lpa.risk_enhancing_threshold')} mg/dL). Khuyến cáo ghi nhận yếu tố tăng cường nguy cơ di truyền và cân nhắc Statin cường độ trung bình.`,
    patient: {
      age: 54,
      sex: 'female',
      weight: 56,
      height: 158,
      sbp: 135,
      dbp: 85,
      hr: 76,
      scr: 72,
      tc: 5.4,
      hdl: 1.3,
      ldl: 3.4,
      tg: 1.5,
      conditions: {},
      currentMeds: [],
      selectedModules: ['lipid'],
      customInputs: {
        lpa: 68
      }
    }
  }
];
