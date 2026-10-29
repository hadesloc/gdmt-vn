/**
 * Bộ kiểm thử AHA PREVENT 2024 Base Model
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { calculatePreventLinearPredictor, computePrevent } from '../../src/engine/calculators/prevent';

describe('AHA PREVENT 2024 Base Model', () => {
  describe('calculatePreventLinearPredictor', () => {
    it('tính LP ổn định với các biến số chuyển hóa CKM', () => {
      const input = {
        age: 55,
        sex: 'female' as const,
        sbp: 130,
        tc: 200, // mg/dL
        hdl: 50,
        egfr: 80,
        hasDiabetes: false,
        smoker: false,
        bmi: 27,
        onHtnMeds: false,
        onStatin: false,
      };

      const { lp, baselineSurvival } = calculatePreventLinearPredictor(input, 200, 50);
      expect(typeof lp).toBe('number');
      expect(baselineSurvival).toBe(0.948);
    });
  });

  describe('computePrevent (Lâm sàng & 3 kết cục tim mạch)', () => {
    // Ca 1: Nữ 55 tuổi, điều trị tăng huyết áp, mỡ máu nhẹ
    it('Ca 1: Nữ 55 tuổi điều trị THA -> Dự báo 3 kết cục Total CVD, ASCVD, HF', () => {
      const res = computePrevent({
        age: 55,
        sex: 'female',
        sbp: 135,
        tc: 5.2, // mmol/L
        hdl: 1.2, // mmol/L
        cholUnit: 'mmol/L',
        egfr: 75,
        hasDiabetes: false,
        smoker: false,
        bmi: 26.5,
        onHtnMeds: true,
        onStatin: false,
      });

      expect(res.totalCvdRisk10Yr).not.toBeNull();
      expect(res.ascvdRisk10Yr).not.toBeNull();
      expect(res.hfRisk10Yr).not.toBeNull();
      expect(res.totalCvdRisk10Yr!).toBeGreaterThan(res.ascvdRisk10Yr!);
      expect(res.needsSourceVerification).toBe(false);
      expect(res.model).toBe('AHA_PREVENT_BASE_2024');
    });

    // Ca 2: Nam 62 tuổi, nhiều yếu tố nguy cơ (hút thuốc, ĐTĐ, CKD eGFR 45, THA)
    it('Ca 2: Nam 62 tuổi nguy cơ cao -> Total CVD tăng rõ rệt', () => {
      const res = computePrevent({
        age: 62,
        sex: 'male',
        sbp: 150,
        tc: 6.0,
        hdl: 0.9,
        egfr: 45,
        hasDiabetes: true,
        smoker: true,
        bmi: 31,
        onHtnMeds: true,
        onStatin: false,
      });

      expect(res.totalCvdRisk10Yr!).toBeGreaterThan(15.0);
      expect(res.hfRisk10Yr!).toBeGreaterThan(7.0);
    });

    // Ca 3: Kiểm tra tính tương thích giữa 2 đơn vị cholesterol
    it('Ca 3: Chuyển đổi chính xác giữa mmol/L và mg/dL', () => {
      const resMmol = computePrevent({
        age: 50,
        sex: 'male',
        sbp: 130,
        tc: 5.0, // mmol/L
        hdl: 1.0,
        cholUnit: 'mmol/L',
        egfr: 90,
        bmi: 25,
        hasDiabetes: false,
        smoker: false,
        onHtnMeds: false,
        onStatin: false,
      });

      const resMgDl = computePrevent({
        age: 50,
        sex: 'male',
        sbp: 130,
        tc: 5.0 * 38.67, // ~193.35 mg/dL
        hdl: 1.0 * 38.67,
        cholUnit: 'mg/dL',
        egfr: 90,
        bmi: 25,
        hasDiabetes: false,
        smoker: false,
        onHtnMeds: false,
        onStatin: false,
      });

      expect(resMmol.totalCvdRisk10Yr).toBeCloseTo(resMgDl.totalCvdRisk10Yr!, 1);
    });

    // Ca 4: Biên tuổi < 30 hoặc > 79
    it('Ca 4: Trả về null khi tuổi < 30 hoặc > 79', () => {
      const res = computePrevent({
        age: 82,
        sex: 'female',
        sbp: 140,
        tc: 5.0,
        hdl: 1.2,
        egfr: 60,
        bmi: 24,
        hasDiabetes: false,
        smoker: false,
        onHtnMeds: true,
        onStatin: false,
      });

      expect(res.totalCvdRisk10Yr).toBeNull();
      expect(res.warning).toContain('30 - 79 tuổi');
    });
  });
});
