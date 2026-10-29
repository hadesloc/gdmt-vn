/**
 * GDMT-VN Module Đái tháo đường típ 2 (dm2) - Kiểm thử Hồi quy Vòng 3: Cấp cứu DKA/HHS/Hạ ĐH & Phác đồ Nội viện
 * Phân quyền: Agent F4
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { dm2Presets } from '../../../src/modules/dm2/presets';
import type { Patient, Settings } from '../../../src/engine/types';

const BASE_SETTINGS: Settings = {
  setting: 'inpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct'
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false
};

describe('GDMT-VN [dm2] Round 3 Regression: Hyperglycemic Crises, Hypoglycemia & Inpatient Insulin', () => {
  it('Preset 4 (DKA + Hạ Kali máu) khai báo đúng setting = inpatient và phát y lệnh HOLD Regular insulin + bù Kali trước', () => {
    const preset4 = dm2Presets.find((p) => p.id === 'dm2_preset_inpatient_dka_emergency');
    expect(preset4).toBeDefined();
    expect(preset4?.setting).toBe('inpatient');

    const plan = evaluate(preset4!.patient as Patient, {
      ...BASE_SETTINGS,
      setting: preset4!.setting!
    });
    const holdRec = plan.recommendations.find((r) => r.id === 'rec_dm2_dka_hold_insulin_hypokalemia');
    expect(holdRec).toBeDefined();
    expect(holdRec?.action).toBe('HOLD');
    expect(holdRec?.drugId).toBe('insulin_regular');
    expect(holdRec?.dose).toBeUndefined();
    expect(plan.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();
  });

  it('S09 & S85: Khiên bảo vệ liên module trong cơn DKA/HHS ngoại trú chặn START SGLT2i/GLP-1/Metformin kể cả khi bật đồng thời CKD + HF', () => {
    const patient: Patient = {
      age: 58,
      sex: 'male',
      weight: 72,
      height: 168,
      sbp: 108,
      dbp: 68,
      hr: 112,
      scr: 135,
      k: 4.4,
      glucose: 10.2,
      hba1c: 8.9,
      uacr: 35,
      lvef: 36,
      conditions: { dm: true, hf: true, ckd: true },
      currentMeds: [{ drugId: 'dapagliflozin', name: 'Forxiga', dose: 10, unit: 'mg' }],
      selectedModules: ['dm2', 'hf', 'ckd'],
      customInputs: {
        bloodKetones: 4.5,
        venousPh: 7.18,
        serumBicarb: 11
      }
    };

    const plan = evaluate(patient, { ...BASE_SETTINGS, setting: 'outpatient' });
    const referRec = plan.recommendations.find((r) => r.id === 'rec_dm2_outpatient_crisis_refer');
    expect(referRec).toBeDefined();
    expect(referRec?.action).toBe('REFER');

    const dapaRec = plan.recommendations.find((r) => r.drugId === 'dapagliflozin');
    expect(dapaRec?.action).toBe('STOP');
    expect(dapaRec?.dose).toBeUndefined();

    for (const r of plan.recommendations) {
      if (['dapagliflozin', 'empagliflozin', 'semaglutide', 'metformin'].includes(r.drugId || '')) {
        expect(r.action).not.toBe('START');
      }
    }
  });

  it('S19: DKA đang thoái lui (Glucose 11.8 mmol/L, BHB 2.1 mmol/L, pH 7.24) duy trì Regular insulin 0.05 U/kg/h song song Dextrose 5–10%', () => {
    const patient: Patient = {
      age: 46,
      sex: 'female',
      weight: 60,
      height: 158,
      sbp: 118,
      dbp: 74,
      hr: 92,
      scr: 88,
      k: 4.1,
      glucose: 11.8,
      conditions: { dm: true },
      currentMeds: [],
      selectedModules: ['dm2'],
      customInputs: {
        inpatientUnit: 'icu',
        bloodKetones: 2.1,
        venousPh: 7.24,
        serumBicarb: 14
      }
    };

    const plan = evaluate(patient, BASE_SETTINGS);
    const activeRec = plan.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management');
    expect(activeRec).toBeDefined();
    expect(activeRec?.action).toBe('START');
    expect(activeRec?.dose).toContain('0.05 U/kg/h');
    expect(activeRec?.dose).toContain('Dextrose');
  });

  it('S22, S23 & S84: Nghi ngờ DKA hoặc toan chuyển hóa nội viện chưa có BHB phát lệnh xét nghiệm STAT thay vì truyền mù 0.1 U/kg/h', () => {
    const unmeasuredAcidosis: Patient = {
      age: 64,
      sex: 'male',
      weight: 70,
      height: 170,
      sbp: 102,
      dbp: 64,
      hr: 108,
      scr: 165,
      k: 4.5,
      glucose: 19.2,
      conditions: { dm: true },
      currentMeds: [],
      selectedModules: ['dm2'],
      customInputs: {
        inpatientUnit: 'icu',
        venousPh: 7.21,
        serumBicarb: 12
      }
    };

    const plan1 = evaluate(unmeasuredAcidosis, BASE_SETTINGS);
    expect(plan1.recommendations.find((r) => r.id === 'rec_dm2_dka_suspected_workup')?.action).toBe('MONITOR');
    expect(plan1.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();

    const flagOnlySuspected: Patient = {
      ...unmeasuredAcidosis,
      customInputs: {
        inpatientUnit: 'ward',
        dkaSuspected: true
      }
    };
    const plan2 = evaluate(flagOnlySuspected, BASE_SETTINGS);
    expect(plan2.recommendations.find((r) => r.id === 'rec_dm2_dka_suspected_workup')?.action).toBe('MONITOR');
    expect(plan2.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();
  });

  it('S24 & S25: Phân biệt Hỗn hợp DKA–HHS (0.1 U/kg/h + tiêu chuẩn kép) với HHS đơn thuần (0.05 U/kg/h)', () => {
    const mixedPatient: Patient = {
      age: 67,
      sex: 'male',
      weight: 70,
      height: 168,
      sbp: 104,
      dbp: 66,
      hr: 114,
      scr: 160,
      k: 4.4,
      glucose: 36.0,
      conditions: { dm: true },
      currentMeds: [],
      selectedModules: ['dm2'],
      customInputs: {
        inpatientUnit: 'icu',
        effectiveOsmolality: 328,
        bloodKetones: 3.8,
        venousPh: 7.18,
        serumBicarb: 12
      }
    };
    const mixedPlan = evaluate(mixedPatient, BASE_SETTINGS);
    const mixedRec = mixedPlan.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management');
    expect(mixedRec).toBeDefined();
    expect(mixedRec?.title).toContain('Hỗn hợp DKA–HHS');
    expect(mixedRec?.dose).toContain('0.1 U/kg/h');
    expect(mixedRec?.rationale).toContain('ĐỒNG THỜI giải quyết cả DKA lẫn HHS');

    const pureHhsPlan = evaluate(
      {
        ...mixedPatient,
        customInputs: {
          inpatientUnit: 'icu',
          effectiveOsmolality: 328,
          bloodKetones: 0.4,
          venousPh: 7.36,
          serumBicarb: 22
        }
      },
      BASE_SETTINGS
    );
    const hhsRec = pureHhsPlan.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management');
    expect(hhsRec).toBeDefined();
    expect(hhsRec?.title).toContain('HHS');
    expect(hhsRec?.dose).toContain('0.05 U/kg/h');
  });

  it('S26: Hạ đường huyết mức độ 2 ngoại trú (Glucose 2.6 mmol/L) phát đồng thời REFER cấp cứu, Glucagon 1 mg / 3 mg và Quy tắc 15–15', () => {
    const patient: Patient = {
      age: 72,
      sex: 'female',
      weight: 56,
      height: 154,
      sbp: 132,
      dbp: 76,
      hr: 96,
      scr: 118,
      k: 4.3,
      glucose: 2.6,
      hba1c: 6.4,
      conditions: { dm: true },
      currentMeds: [
        { drugId: 'glimepiride', name: 'Amaryl', dose: 4, unit: 'mg' },
        { drugId: 'acarbose', name: 'Glucobay', dose: 50, unit: 'mg' }
      ],
      selectedModules: ['dm2']
    };

    const plan = evaluate(patient, { ...BASE_SETTINGS, setting: 'outpatient' });
    const referRec = plan.recommendations.find((r) => r.id === 'rec_dm2_outpatient_severe_hypo_refer');
    expect(referRec?.action).toBe('REFER');
    expect(referRec?.rationale).toContain('1 mg');
    expect(referRec?.rationale).toContain('3 mg');

    const rule15Rec = plan.recommendations.find((r) => r.id === 'rec_dm2_hypo_rule15');
    expect(rule15Rec?.action).toBe('START');
    expect(rule15Rec?.rationale).toContain('đường đơn');

    const suHold = plan.recommendations.find((r) => r.drugId === 'glimepiride');
    expect(suHold?.action).toBe('HOLD');
    expect(suHold?.dose).toBeUndefined();
  });

  it('S29, S32, S73, S78 & S72: Nội viện STOP rõ ràng Mixtard/NPH ngoại trú, quy đổi 80% Basal-Plus khi ăn kém ĐH thấp, giảm 25% nền khi NPO và cảnh báo dịch chuyển K+', () => {
    const mixtardPoorIntake: Patient = {
      age: 66,
      sex: 'female',
      weight: 62,
      height: 156,
      sbp: 128,
      dbp: 76,
      hr: 80,
      scr: 92,
      k: 5.1,
      glucose: 5.6,
      hba1c: 8.1,
      conditions: { dm: true },
      currentMeds: [
        { drugId: 'insulin_premix', name: 'Mixtard 30/70', dose: '20 đơn vị sáng 10 đơn vị chiều', unit: 'đơn vị' }
      ],
      selectedModules: ['dm2'],
      customInputs: {
        inpatientUnit: 'ward',
        inpatientEating: 'poor'
      }
    };

    const plan = evaluate(mixtardPoorIntake, BASE_SETTINGS);
    const stopPremix = plan.recommendations.find((r) => r.drugId === 'insulin_premix');
    expect(stopPremix?.action).toBe('STOP');
    expect(stopPremix?.dose).toBeUndefined();

    const startGlargine = plan.recommendations.find((r) => r.drugId === 'insulin_glargine');
    expect(startGlargine?.action).toBe('START');
    expect(startGlargine?.dose).toContain('11 đơn vị'); // 75% của 30 U khi ăn kém + ĐH < 7.8 -> 50% nền = 11 U

    const plan80 = evaluate({ ...mixtardPoorIntake, glucose: 9.2 }, BASE_SETTINGS);
    expect(plan80.recommendations.find((r) => r.drugId === 'insulin_glargine')?.dose).toContain('12 đơn vị'); // 80% của 30 U = 24 U -> 50% nền = 12 U

    const basalPlusMonitor = plan.recommendations.find((r) => r.id === 'rec_dm2_inpatient_basal_plus_poor_intake');
    expect(basalPlusMonitor?.action).toBe('MONITOR');
    expect(plan.recommendations.find((r) => r.id === 'rec_dm2_inpatient_prandial_bolus')).toBeUndefined();

    const kShiftPlan = evaluate(
      {
        ...mixtardPoorIntake,
        k: 3.7,
        glucose: 12.2,
        currentMeds: [
          { drugId: 'insulin_glargine', name: 'Lantus', dose: 20, unit: 'đơn vị' },
          { drugId: 'salbutamol', name: 'Ventolin khí dung', dose: 5, unit: 'mg' }
        ],
        customInputs: { inpatientUnit: 'ward', onSteroidTherapy: true }
      },
      BASE_SETTINGS
    );
    const kMonitor = kShiftPlan.recommendations.find((r) => r.id === 'rec_dm2_inpatient_k_shift_monitor');
    expect(kMonitor?.action).toBe('MONITOR');

    // S78: NPO đang dùng Glargine 32 U tại nhà -> Giảm 25% xuống ~24 U
    const npoPlan = evaluate(
      {
        ...mixtardPoorIntake,
        glucose: 9.4,
        currentMeds: [{ drugId: 'insulin_glargine', name: 'Lantus', dose: 32, unit: 'đơn vị' }],
        customInputs: { inpatientUnit: 'ward', inpatientEating: 'npo' }
      },
      BASE_SETTINGS
    );
    const npoGlargine = npoPlan.recommendations.find((r) => r.drugId === 'insulin_glargine');
    expect(npoGlargine?.action).toBe('REDUCE');
    expect(npoGlargine?.dose).toContain('24 đơn vị');
  });
});
