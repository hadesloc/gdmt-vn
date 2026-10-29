/**
 * Bộ kiểm thử Máy tính Độ thanh thải Creatinin Cockcroft-Gault (CrCl) & Devine IBW
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { calculateIbw, calculateAbw, computeCrcl } from '../../src/engine/calculators/crcl';

describe('CrCl Calculator (Cockcroft-Gault & Devine)', () => {
  describe('calculateIbw & calculateAbw', () => {
    it('tính chính xác Cân nặng Lý tưởng Devine cho Nam cao 170cm', () => {
      // 50 + 0.9055 * (170 - 152.4) = 65.9 kg
      const ibw = calculateIbw(170, 'male');
      expect(ibw).toBeCloseTo(65.9, 1);
    });

    it('tính chính xác Cân nặng Lý tưởng Devine cho Nữ cao 155cm', () => {
      // 45.5 + 0.9055 * (155 - 152.4) = 47.9 kg
      const ibw = calculateIbw(155, 'female');
      expect(ibw).toBeCloseTo(47.9, 1);
    });

    it('tính Cân nặng Hiệu chỉnh ABW với hệ số 0.4 khi béo phì', () => {
      // IBW = 50, Actual = 100 -> ABW = 50 + 0.4 * 50 = 70 kg
      const abw = calculateAbw(100, 50);
      expect(abw).toBe(70);
    });
  });

  describe('computeCrcl (Lâm sàng & cảnh báo thể trạng)', () => {
    // Ca 1: Nam 60 tuổi, thể trạng bình thường
    // Nặng 70 kg, cao 170 cm, Scr 1.0 mg/dL (~88.42 µmol/L)
    // CrCl = (140 - 60) * 70 / 72 = 77.8 mL/min
    it('Ca 1: Nam 60 tuổi, thể trạng bình thường -> dùng Cân nặng thực', () => {
      const res = computeCrcl({
        scr: 88.42,
        scrUnit: 'umol/L',
        age: 60,
        weight: 70,
        height: 170,
        sex: 'male',
      });

      expect(res.isObese).toBe(false);
      expect(res.weightUsedForRecommended).toBe('actual');
      expect(res.recommendedCrCl).toBeCloseTo(77.8, 1);
      expect(res.crclActual).toBeCloseTo(77.8, 1);
    });

    // Ca 2: Nữ 68 tuổi béo phì nặng (BMI ~39.5)
    // Nặng 95 kg, cao 155 cm, Scr 1.3 mg/dL (~115 µmol/L)
    // CrCl actual ~62.1 mL/min; CrCl ABW ~43.6 mL/min
    it('Ca 2: Nữ 68 tuổi béo phì (BMI ≥ 30) -> cảnh báo và khuyến cáo dùng ABW', () => {
      const res = computeCrcl({
        scr: 1.3,
        scrUnit: 'mg/dL',
        age: 68,
        weight: 95,
        height: 155,
        sex: 'female',
      });

      expect(res.isObese).toBe(true);
      expect(res.weightUsedForRecommended).toBe('adjusted');
      expect(res.recommendedCrCl).toBeCloseTo(43.6, 1);
      expect(res.crclActual).toBeCloseTo(62.1, 1);
      expect(res.warning).toContain('béo phì');
    });

    // Ca 3: Nữ cao tuổi nhẹ cân (cân nặng thực < IBW)
    // Nặng 40 kg, cao 155 cm (IBW ~47.9 kg), Scr 0.9 mg/dL
    it('Ca 3: Nữ nhẹ cân (Actual < IBW) -> dùng Cân nặng thực để không ước tính quá cao', () => {
      const res = computeCrcl({
        scr: 0.9,
        scrUnit: 'mg/dL',
        age: 75,
        weight: 40,
        height: 155,
        sex: 'female',
      });

      expect(res.weightUsedForRecommended).toBe('actual');
      expect(res.warning).toContain('nhỏ hơn cân nặng lý tưởng');
      expect(res.recommendedCrCl).toBe(res.crclActual);
    });

    // Ca 4: Biên dữ liệu không hợp lệ
    it('Ca 4: Trả về null và cảnh báo khi giá trị <= 0', () => {
      const res = computeCrcl({
        scr: 0,
        age: 50,
        weight: 60,
        height: 160,
        sex: 'male',
      });
      expect(res.recommendedCrCl).toBeNull();
      expect(res.warning).toContain('lớn hơn 0');
    });
  });
});
