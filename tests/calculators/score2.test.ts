/**
 * Bộ kiểm thử Dự báo Nguy cơ Tim mạch 10 năm SCORE2, SCORE2-OP & SCORE2-Diabetes
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import {
  calculateScore2LinearPredictor,
  classifyScore2RiskCategory,
  computeScore2,
} from '../../src/engine/calculators/score2';

describe('SCORE2 / SCORE2-OP / SCORE2-Diabetes (ESC)', () => {
  describe('calculateScore2LinearPredictor', () => {
    it('tính LP ổn định cho nam trung niên hút thuốc', () => {
      const { lp, baselineSurvival } = calculateScore2LinearPredictor(55, 'male', true, 140, 5.5, 1.2, false);
      expect(typeof lp).toBe('number');
      expect(baselineSurvival).toBe(0.9605);
    });
  });

  describe('classifyScore2RiskCategory', () => {
    it('phân tầng chính xác theo ngưỡng tuổi ESC', () => {
      // Người < 50 tuổi: ngưỡng 2.5% và 7.5%
      expect(classifyScore2RiskCategory(2.0, 45).category).toBe('low');
      expect(classifyScore2RiskCategory(5.0, 45).category).toBe('high');
      expect(classifyScore2RiskCategory(8.0, 45).category).toBe('very_high');

      // Người 50 - 69 tuổi: ngưỡng 5% và 10%
      expect(classifyScore2RiskCategory(4.0, 60).category).toBe('low');
      expect(classifyScore2RiskCategory(7.0, 60).category).toBe('high');
      expect(classifyScore2RiskCategory(12.0, 60).category).toBe('very_high');
    });
  });

  describe('computeScore2 (Lâm sàng & các mô hình)', () => {
    // Ca 1: Nam 55 tuổi, hút thuốc, THA độ 1 (SBP 145), TC 5.8 mmol/L, HDL 1.1 mmol/L (Việt Nam - Vùng nguy cơ cao)
    it('Ca 1: Nam 55 tuổi hút thuốc và tăng huyết áp -> Nguy cơ tim mạch cao theo SCORE2', () => {
      const res = computeScore2({
        age: 55,
        sex: 'male',
        smoker: true,
        sbp: 145,
        tc: 5.8,
        hdl: 1.1,
        riskRegion: 'high',
      });

      expect(res.riskPercent).not.toBeNull();
      expect(res.modelUsed).toBe('SCORE2');
      expect(res.riskPercent!).toBeGreaterThan(5.0);
      expect(res.needsSourceVerification).toBe(true);
      expect(res.riskRegion).toBe('high');
    });

    // Ca 2: Nữ 48 tuổi, không hút thuốc, HA tối ưu 120/75, mỡ máu bình thường
    it('Ca 2: Nữ 48 tuổi lối sống lành mạnh -> Nguy cơ tim mạch thấp', () => {
      const res = computeScore2({
        age: 48,
        sex: 'female',
        smoker: false,
        sbp: 120,
        tc: 4.5,
        hdl: 1.5,
        riskRegion: 'high',
      });

      expect(res.riskPercent).not.toBeNull();
      expect(res.riskPercent!).toBeLessThan(3.5);
    });

    // Ca 3: Người cao tuổi 75 tuổi -> Kích hoạt mô hình SCORE2-OP
    it('Ca 3: Cụ ông 76 tuổi -> Sử dụng mô hình SCORE2-OP', () => {
      const res = computeScore2({
        age: 76,
        sex: 'male',
        smoker: false,
        sbp: 150,
        tc: 5.2,
        hdl: 1.2,
      });

      expect(res.modelUsed).toBe('SCORE2-OP');
      expect(res.riskPercent).not.toBeNull();
      expect(res.needsSourceVerification).toBe(true);
      expect(res.warning).toContain('SCORE2-OP');
    });

    // Ca 4: Bệnh nhân Đái tháo đường týp 2 -> Kích hoạt mô hình SCORE2-Diabetes
    it('Ca 4: Bệnh nhân Đái tháo đường týp 2 -> Sử dụng mô hình SCORE2-Diabetes', () => {
      const res = computeScore2({
        age: 56,
        sex: 'male',
        smoker: false,
        sbp: 135,
        tc: 5.0,
        hdl: 1.0,
        hasDiabetes: true,
      });

      expect(res.modelUsed).toBe('SCORE2-Diabetes');
      expect(res.riskPercent).not.toBeNull();
      expect(res.needsSourceVerification).toBe(true);
      expect(res.warning).toContain('SCORE2-Diabetes');
    });

    // Ca 5: Giá trị biên tuổi
    it('Ca 5: Trả về null khi tuổi < 40 hoặc > 89', () => {
      const resYoung = computeScore2({
        age: 35,
        sex: 'male',
        smoker: false,
        sbp: 120,
        tc: 5.0,
        hdl: 1.2,
      });
      expect(resYoung.riskPercent).toBeNull();
      expect(resYoung.warning).toContain('40-89 tuổi');
    });
  });
});
