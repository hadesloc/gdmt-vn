/**
 * Bộ kiểm thử Máy tính BMI/BSA, Liều Insulin ADA 2026 & Chỉ định Urat ACR 2020
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { computeBmi } from '../../src/engine/calculators/bmi';
import { computeInsulin } from '../../src/engine/calculators/insulin';
import { computeUrate } from '../../src/engine/calculators/urate';

describe('BMI & BSA Calculator (WHO Asia-Pacific)', () => {
  // Ca 1: Thể trạng tối ưu người Việt Nam (BMI 18.5 - 22.9)
  it('Ca 1: Cao 165cm, nặng 58kg -> BMI ~21.3, Thể trạng bình thường Châu Á', () => {
    const res = computeBmi({ height: 165, weight: 58 });
    expect(res.bmi).toBeCloseTo(21.3, 1);
    expect(res.asiaPacificClassification).toBe('normal');
    expect(res.bsa).toBeGreaterThan(1.5);
  });

  // Ca 2: Tiền béo phì / Thừa cân Châu Á (BMI 23.0 - 24.9)
  it('Ca 2: Cao 160cm, nặng 62kg -> BMI ~24.2, Thừa cân / Tiền béo phì Châu Á', () => {
    const res = computeBmi({ height: 160, weight: 62 });
    expect(res.bmi).toBeCloseTo(24.2, 1);
    expect(res.asiaPacificClassification).toBe('overweight');
  });

  // Ca 3: Béo phì Độ 1 Châu Á (BMI 25.0 - 29.9)
  it('Ca 3: Cao 168cm, nặng 75kg -> BMI ~26.6, Béo phì Độ 1 Châu Á', () => {
    const res = computeBmi({ height: 168, weight: 75 });
    expect(res.bmi).toBeCloseTo(26.6, 1);
    expect(res.asiaPacificClassification).toBe('obese_1');
  });
});

describe('Insulin Dosing Calculator (ADA 2026)', () => {
  // Ca 1: Ngoại trú khởi đầu insulin nền
  it('Ca 1: Ngoại trú nặng 60kg -> Khởi đầu 10 đơn vị hoặc 6 - 12 đơn vị/ngày (0.1 - 0.2 U/kg)', () => {
    const res = computeInsulin({ weight: 60, setting: 'outpatient' });
    expect(res.outpatientStart).toBeDefined();
    expect(res.outpatientStart!.fixedDoseUnits).toBe(10);
    expect(res.outpatientStart!.weightBasedDoseRangeUnits).toEqual([6, 12]);
    expect(res.needsSourceVerification).toBe(false);
  });

  // Ca 2: Nội viện phác đồ Basal-Bolus cho bệnh nhân nhạy cảm (0.30 U/kg theo ADA 2026)
  it('Ca 2: Nội viện cao tuổi suy thận (nhạy cảm) nặng 60kg -> TDD ~18 U, Basal ~9 U, Bolus ~3 U/bữa', () => {
    const res = computeInsulin({ weight: 60, setting: 'inpatient', clinicalContext: 'sensitive' });
    expect(res.inpatientBasalBolus).toBeDefined();
    expect(res.inpatientBasalBolus!.totalDailyDoseUnits).toBe(18);
    expect(res.inpatientBasalBolus!.basalUnits).toBe(9);
    expect(res.inpatientBasalBolus!.bolusEachMealUnits).toBe(3);
  });

  // Ca 3: Nội viện phác đồ Basal-Bolus cho bệnh nhân đề kháng (0.60 U/kg theo ADA 2026)
  it('Ca 3: Nội viện béo phì dùng corticoid (đề kháng) nặng 80kg -> TDD ~48 U', () => {
    const res = computeInsulin({ weight: 80, setting: 'inpatient', clinicalContext: 'resistant' });
    expect(res.inpatientBasalBolus!.totalDailyDoseUnits).toBe(48);
    expect(res.inpatientBasalBolus!.basalUnits).toBe(24);
  });
});

describe('Serum Urate & ACR 2020 ULT Calculator', () => {
  // Ca 1: Có hạt tophi -> Chỉ định MẠNH, đích tích cực < 300 µmol/L (< 5 mg/dL)
  it('Ca 1: Có hạt tophi dưới da -> Chỉ định MẠNH, đích < 300 µmol/L', () => {
    const res = computeUrate({
      serumUrate: 510,
      urateUnit: 'umol/L',
      hasTophi: true,
      radiographicDamage: false,
      flaresPastYear: 1,
      priorFlaresLifetime: 3,
    });

    expect(res.ultIndication).toBe('strong');
    expect(res.ultIndicationVi).toBe('Chỉ định mạnh');
    expect(res.targetUrateUmolL).toBe(300);
    expect(res.targetUrateMgDl).toBe(5.0);
  });

  // Ca 2: ≥ 2 đợt cấp trong vòng 1 năm -> Chỉ định MẠNH, đích chuẩn < 360 µmol/L
  it('Ca 2: Tái phát thường xuyên (≥ 2 đợt/năm) -> Chỉ định MẠNH, đích < 360 µmol/L', () => {
    const res = computeUrate({
      serumUrate: 480,
      hasTophi: false,
      radiographicDamage: false,
      flaresPastYear: 2,
      priorFlaresLifetime: 4,
    });

    expect(res.ultIndication).toBe('strong');
    expect(res.targetUrateUmolL).toBe(360);
    expect(res.targetUrateMgDl).toBe(6.0);
  });

  // Ca 3: Cơn gút đầu tiên kèm CKD giai đoạn 3 và Urat > 9 mg/dL -> Chỉ định CÓ ĐIỀU KIỆN
  it('Ca 3: Cơn gút đầu tiên có biến chứng CKD và urat rất cao -> Chỉ định CÓ ĐIỀU KIỆN', () => {
    const res = computeUrate({
      serumUrate: 560, // > 535 µmol/L (~9 mg/dL)
      hasTophi: false,
      radiographicDamage: false,
      flaresPastYear: 1,
      priorFlaresLifetime: 1,
      ckdStage: 3,
    });

    expect(res.ultIndication).toBe('conditional');
    expect(res.ultIndicationVi).toBe('Chỉ định có điều kiện');
  });

  // Ca 4: Tăng acid uric máu không triệu chứng -> CHƯA chỉ định ULT
  it('Ca 4: Tăng acid uric máu không triệu chứng (0 đợt cấp, không tophi) -> Chưa có chỉ định', () => {
    const res = computeUrate({
      serumUrate: 550,
      hasTophi: false,
      radiographicDamage: false,
      flaresPastYear: 0,
      priorFlaresLifetime: 0,
    });

    expect(res.ultIndication).toBe('not_indicated');
    expect(res.ultIndicationVi).toBe('Chưa có chỉ định');
  });
});
