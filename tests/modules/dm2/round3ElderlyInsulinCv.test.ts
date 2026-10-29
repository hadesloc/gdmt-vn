/**
 * GDMT-VN Module Đái tháo đường típ 2 (dm2) - Kiểm thử Hồi quy Vòng 3: Người cao tuổi Suy yếu Tăng ĐH, Chuẩn độ Insulin, Statin > 75t & OAC+Aspirin
 * Phân quyền: Agent F4
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { dm2Presets } from '../../../src/modules/dm2/presets';
import type { Patient, Settings } from '../../../src/engine/types';

const OUTPATIENT_SETTINGS: Settings = {
  setting: 'outpatient',
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

describe('GDMT-VN [dm2] Round 3 Regression: Elderly Hyperglycemic Switch, Insulin Titration Guards, Preset 2 & CV Prevention', () => {
  it('S75, S76 & S35: Người cao tuổi suy yếu đang tăng đường huyết (HbA1c 9.4%) ngừng SU nguy hiểm và chuyển sang Linagliptin an toàn thay vì chỉ cắt thuốc bỏ trống', () => {
    const frailHyperglycemic: Patient = {
      age: 82,
      sex: 'female',
      weight: 46,
      height: 152,
      sbp: 132,
      dbp: 74,
      hr: 76,
      scr: 155, // eGFR ~ 29
      k: 4.5,
      glucose: 12.8,
      hba1c: 9.4,
      conditions: { dm: true, frailty: true, ckd: true },
      currentMeds: [{ drugId: 'glimepiride', name: 'Amaryl', dose: 4, unit: 'mg' }],
      selectedModules: ['dm2'],
      customInputs: { elderlyHealthStatus: 'very_complex', recentHypo: true }
    };

    const plan = evaluate(frailHyperglycemic, OUTPATIENT_SETTINGS);
    const stopSu = plan.recommendations.find((r) => r.drugId === 'glimepiride');
    expect(stopSu?.action).toBe('STOP');
    expect(stopSu?.dose).toBeUndefined();

    // Không bị bỏ trống điều trị khi HbA1c 9.4% > 8.5%: Chuyển sang Linagliptin 5 mg an toàn thận
    const startSafe = plan.recommendations.find((r) => r.drugId === 'linagliptin');
    expect(startSafe?.action).toBe('START');
  });

  it('S11, S77 & S34: Giữ nguyên Insulin nền CONTINUE (không UPTITRATE) khi FPG đã đạt đích ≤ 7.2 mmol/L hoặc vừa khởi mới SGLT2i/GLP-1 ở HbA1c < 8.0%', () => {
    // 1. S11/S77: FPG 6.4 mmol/L (<= 7.2) nhưng HbA1c 8.4% -> CONTINUE Glargine + CONSIDER mũi tiêm phối hợp sau ăn
    const fpgAtGoal: Patient = {
      age: 58,
      sex: 'male',
      weight: 74,
      height: 170,
      sbp: 126,
      dbp: 78,
      hr: 74,
      scr: 84,
      k: 4.2,
      glucose: 6.4,
      hba1c: 8.4,
      conditions: { dm: true },
      currentMeds: [
        { drugId: 'metformin', name: 'Metformin', dose: 2000, unit: 'mg' },
        { drugId: 'insulin_glargine', name: 'Lantus', dose: 26, unit: 'đơn vị' }
      ],
      selectedModules: ['dm2']
    };
    const plan1 = evaluate(fpgAtGoal, OUTPATIENT_SETTINGS);
    const glargine1 = plan1.recommendations.find((r) => r.drugId === 'insulin_glargine');
    expect(glargine1?.action).toBe('CONTINUE');
    expect(
      plan1.recommendations.some((r) => r.id === 'rec_dm2_overbasalization' && r.action === 'CONSIDER')
    ).toBe(true);

    // 2. S34: Vừa khởi trị mới SGLT2i + GLP-1 RA ở bệnh nhân ASCVD có HbA1c 7.6% (< 8.0%), FPG 7.9 -> CONTINUE Glargine ổn định trước
    const newCardiorenalAddon: Patient = {
      ...fpgAtGoal,
      glucose: 7.9,
      hba1c: 7.6,
      conditions: { dm: true, ascvd: true }
    };
    const plan2 = evaluate(newCardiorenalAddon, OUTPATIENT_SETTINGS);
    expect(plan2.recommendations.find((r) => r.drugId === 'insulin_glargine')?.action).toBe('CONTINUE');
  });

  it('S10, Preset 2 & B15: Khởi sớm Insulin nền phát lệnh REDUCE SU đồng thời; Preset 2 phát REDUCE Gliclazide + CONSIDER Metformin; ĐTĐ mới chưa dùng thuốc HbA1c 6.3% phát CONSIDER Metformin', () => {
    // 1. S10: Đang uống Glimepiride 4 mg nhưng HbA1c 11.2% phải khởi trị sớm Insulin Glargine -> Chủ động REDUCE Glimepiride
    const earlyInsWithSu: Patient = {
      age: 54,
      sex: 'male',
      weight: 72,
      height: 170,
      sbp: 128,
      dbp: 80,
      hr: 80,
      scr: 82,
      k: 4.3,
      glucose: 17.8,
      hba1c: 11.2,
      conditions: { dm: true },
      currentMeds: [{ drugId: 'glimepiride', name: 'Amaryl', dose: 4, unit: 'mg' }],
      selectedModules: ['dm2'],
      customInputs: { catabolicSymptoms: false }
    };
    const planEarly = evaluate(earlyInsWithSu, OUTPATIENT_SETTINGS);
    const earlyInsRec = planEarly.recommendations.find((r) => r.id === 'rec_dm2_early_insulin');
    expect(earlyInsRec?.action).toBe('START');
    expect(earlyInsRec?.title).toContain('GLP-1');
    expect(planEarly.recommendations.find((r) => r.drugId === 'glimepiride')?.action).toBe('REDUCE');

    // 2. Preset 2 (HFrEF + Pioglitazone + Gliclazide MR 60 mg, HbA1c 7.9%, eGFR ~ 46): STOP Pioglitazone, START SGLT2i, REDUCE Gliclazide, CONSIDER Metformin
    const preset2 = dm2Presets.find((p) => p.id === 'dm2_preset_hf_pioglitazone_contra');
    expect(preset2).toBeDefined();
    const planPreset2 = evaluate(preset2!.patient as Patient, OUTPATIENT_SETTINGS);
    expect(planPreset2.recommendations.find((r) => r.drugId === 'pioglitazone')?.action).toBe('STOP');
    expect(planPreset2.recommendations.find((r) => r.drugId === 'gliclazide')?.action).toBe('REDUCE');
    expect(planPreset2.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('CONSIDER');

    // 3. B15: Bệnh nhân ĐTĐ típ 2 chưa dùng thuốc có HbA1c 6.3% đạt đích -> CONSIDER Metformin (hoặc lối sống)
    const naiveControlledPlan = evaluate(
      {
        age: 52,
        sex: 'female',
        weight: 60,
        height: 158,
        sbp: 122,
        dbp: 76,
        hr: 72,
        scr: 72,
        k: 4.1,
        glucose: 6.1,
        hba1c: 6.3,
        conditions: { dm: true },
        currentMeds: [],
        selectedModules: ['dm2']
      },
      OUTPATIENT_SETTINGS
    );
    expect(naiveControlledPlan.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('CONSIDER');
  });

  it('B14a & S04: Phân tầng Statin dự phòng tiên phát tuổi > 75 (CONTINUE / DEFER / CONSIDER) và kiểm tra OAC trước kháng tiểu cầu trong dự phòng thứ phát ASCVD', () => {
    const base78: Patient = {
      age: 78,
      sex: 'male',
      weight: 66,
      height: 166,
      sbp: 132,
      dbp: 76,
      hr: 72,
      scr: 95,
      k: 4.3,
      glucose: 7.4,
      hba1c: 7.1,
      conditions: { dm: true },
      currentMeds: [],
      selectedModules: ['dm2']
    };

    // 1. > 75 tuổi thể trạng khỏe chưa dùng statin -> CONSIDER Statin cường độ trung bình
    const statinHealthy = evaluate(
      { ...base78, customInputs: { elderlyHealthStatus: 'healthy' } },
      OUTPATIENT_SETTINGS
    );
    expect(statinHealthy.recommendations.find((r) => r.id === 'rec_dm2_statin_prevention')?.action).toBe('CONSIDER');

    // 2. > 75 tuổi suy yếu nặng / kỳ vọng sống hạn chế chưa dùng statin -> DEFER (time-to-benefit ~ 2.5 năm)
    const statinFrail = evaluate(
      { ...base78, customInputs: { elderlyHealthStatus: 'very_complex' } },
      OUTPATIENT_SETTINGS
    );
    const deferStatin = statinFrail.recommendations.find((r) => r.id === 'rec_dm2_statin_prevention');
    expect(deferStatin?.action).toBe('DEFER');
    expect(deferStatin?.dose).toBeUndefined();

    // 3. > 75 tuổi đang dùng Atorvastatin -> CONTINUE
    const statinCont = evaluate(
      {
        ...base78,
        currentMeds: [{ drugId: 'atorvastatin', name: 'Lipitor', dose: 20, unit: 'mg' }]
      },
      OUTPATIENT_SETTINGS
    );
    expect(statinCont.recommendations.find((r) => r.id === 'rec_dm2_statin_prevention')?.action).toBe('CONTINUE');

    // 4. ASCVD chưa dùng Aspirin -> Tiêu đề 'Khởi trị / Bổ sung' (KHÔNG viết nhầm 'Duy trì')
    const ascvdNoAspirin = evaluate(
      { ...base78, age: 64, conditions: { dm: true, ascvd: true }, currentMeds: [] },
      OUTPATIENT_SETTINGS
    );
    const initAspirin = ascvdNoAspirin.recommendations.find((r) => r.id === 'rec_dm2_aspirin_secondary');
    expect(initAspirin?.action).toBe('CONSIDER');
    expect(initAspirin?.title).toContain('Khởi trị / Bổ sung');

    // 5. ASCVD ổn định đang uống đồng thời Rivaroxaban + Aspirin (chạy đơn độc module dm2) -> Cân nhắc ngừng Aspirin thay vì phát CONTINUE
    const ascvdOacPlusAspirin = evaluate(
      {
        ...base78,
        age: 68,
        conditions: { dm: true, ascvd: true, recentAcs: false },
        currentMeds: [
          { drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg' },
          { drugId: 'aspirin', name: 'Aspirin 81', dose: 81, unit: 'mg' }
        ]
      },
      OUTPATIENT_SETTINGS
    );
    expect(ascvdOacPlusAspirin.recommendations.find((r) => r.id === 'rec_dm2_aspirin_secondary')).toBeUndefined();
    const stopAntiplateletOnOac = ascvdOacPlusAspirin.recommendations.find(
      (r) => r.id === 'rec_dm2_stop_antiplatelet_on_oac'
    );
    expect(stopAntiplateletOnOac?.action).toBe('CONSIDER');
  });
});
