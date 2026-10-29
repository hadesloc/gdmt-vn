/**
 * Bộ kiểm thử Tiêu chí Giảm liều & Chống chỉ định Thuốc Chống Đông DOAC
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { computeDoacDose } from '../../src/engine/calculators/doacDose';

describe('DOAC Dose Calculator', () => {
  // Ca 1: Apixaban - Đạt 2 trong 3 tiêu chuẩn giảm liều (Tuổi ≥ 80 + Cân nặng ≤ 60kg)
  it('Ca 1: Apixaban - Cụ bà 82 tuổi, 54 kg -> Giảm liều xuống 2.5 mg x 2 lần/ngày', () => {
    const res = computeDoacDose({
      drug: 'apixaban',
      age: 82,
      weight: 54,
      scr: 85, // µmol/L (~0.96 mg/dL)
      crcl: 38,
    });

    expect(res.isDoseReduced).toBe(true);
    expect(res.recommendedDose).toBe('2.5 mg x 2 lần/ngày');
    expect(res.reductionCriteriaMet.length).toBe(2);
    expect(res.contraindicated).toBe(false);
  });

  // Ca 2: Apixaban - Chỉ đạt 1 trong 3 tiêu chuẩn (Creatinin ≥ 1.5 mg/dL)
  it('Ca 2: Apixaban - Chỉ có 1 tiêu chí (Cr cao đơn độc, CrCl 45) -> Giữ liều chuẩn 5 mg x 2 lần/ngày', () => {
    const res = computeDoacDose({
      drug: 'apixaban',
      age: 70,
      weight: 75,
      scr: 145, // µmol/L (~1.64 mg/dL)
      crcl: 45,
    });

    expect(res.isDoseReduced).toBe(false);
    expect(res.recommendedDose).toBe('5 mg x 2 lần/ngày');
  });

  // Ca 3: Rivaroxaban - CrCl 35 mL/min (trong khoảng 15 - 49 mL/min)
  it('Ca 3: Rivaroxaban - Suy thận CrCl 35 mL/min -> Giảm liều 15 mg x 1 lần/ngày', () => {
    const res = computeDoacDose({
      drug: 'rivaroxaban',
      age: 68,
      weight: 65,
      scr: 130,
      crcl: 35,
    });

    expect(res.isDoseReduced).toBe(true);
    expect(res.recommendedDose).toBe('15 mg x 1 lần/ngày (uống cùng bữa ăn)');
  });

  // Ca 4: Dabigatran - Dùng đồng thời Verapamil
  it('Ca 4: Dabigatran - Dùng cùng Verapamil -> Giảm liều 110 mg x 2 lần/ngày', () => {
    const res = computeDoacDose({
      drug: 'dabigatran',
      age: 65,
      weight: 70,
      scr: 90,
      crcl: 65,
      verapamil: true,
    });

    expect(res.isDoseReduced).toBe(true);
    expect(res.recommendedDose).toBe('110 mg x 2 lần/ngày');
    expect(res.reductionCriteriaMet).toContain('Dùng đồng thời với verapamil (tương tác tăng nồng độ dabigatran)');
  });

  // Ca 5: Edoxaban - Cân nặng 55 kg (≤ 60 kg) và CrCl 98 mL/min (> 95)
  it('Ca 5: Edoxaban - Nhẹ cân (≤ 60 kg) -> Giảm liều 30 mg; Cảnh báo FDA khi CrCl > 95 mL/min', () => {
    const res = computeDoacDose({
      drug: 'edoxaban',
      age: 60,
      weight: 55,
      scr: 65,
      crcl: 98,
    });

    expect(res.isDoseReduced).toBe(true);
    expect(res.recommendedDose).toBe('30 mg x 1 lần/ngày');
    expect(res.warning).toContain('> 95 mL/min');
  });

  // Ca 6: Chống chỉ định suy thận nặng
  it('Ca 6: Chống chỉ định Dabigatran khi CrCl < 30 mL/min theo nhãn EMA/Bộ Y tế', () => {
    const res = computeDoacDose({
      drug: 'dabigatran',
      age: 75,
      weight: 60,
      scr: 200,
      crcl: 22,
    });

    expect(res.contraindicated).toBe(true);
    expect(res.recommendedDose).toContain('Chống chỉ định');
  });

  it('Ca 7: Chống chỉ định Apixaban/Rivaroxaban khi CrCl < 15 mL/min', () => {
    const res = computeDoacDose({
      drug: 'apixaban',
      age: 70,
      weight: 60,
      scr: 350,
      crcl: 12,
    });

    expect(res.contraindicated).toBe(true);
    expect(res.recommendedDose).toContain('Chống chỉ định');
  });
});
