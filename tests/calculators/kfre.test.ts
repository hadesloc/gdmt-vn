/**
 * Bộ kiểm thử Kidney Failure Risk Equation (KFRE) 4 biến
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { calculateKfreLinearPredictor, computeKfre } from '../../src/engine/calculators/kfre';

describe('KFRE Calculator (Tangri 2016 / KDIGO 2024)', () => {
  describe('calculateKfreLinearPredictor', () => {
    it('tính toán Linear Predictor ổn định cho bệnh nhân mẫu', () => {
      // Nam 65 tuổi, eGFR 35, UACR 100 mg/g
      const lp = calculateKfreLinearPredictor(65, true, 35, 100);
      expect(typeof lp).toBe('number');
      expect(isNaN(lp)).toBe(false);
    });
  });

  describe('computeKfre (Lâm sàng & Ngưỡng chuyển chuyên khoa)', () => {
    // Ca 1: Nam 65 tuổi, CKD G3b (eGFR 35), UACR 30 mg/mmol (~265 mg/g)
    it('Ca 1: Nam 65 tuổi, eGFR 35, UACR 30 mg/mmol -> nguy cơ 5 năm vượt ngưỡng chuyển khám', () => {
      const res = computeKfre({
        age: 65,
        sex: 'male',
        egfr: 35,
        uacr: 30,
        uacrUnit: 'mg/mmol',
        region: 'non_north_america',
      });

      expect(res.risk2Year).not.toBeNull();
      expect(res.risk5Year).not.toBeNull();
      expect(res.risk5Year!).toBeGreaterThan(3.0); // > 3% khuyến cáo chuyển chuyên khoa
      expect(res.referralRecommended).toBe(true);
      expect(res.regionUsed).toBe('non_north_america');
    });

    // Ca 2: Nữ 70 tuổi, CKD G4 (eGFR 20), UACR nặng 100 mg/mmol (~884 mg/g)
    it('Ca 2: Nữ 70 tuổi, CKD G4 tiến triển nặng -> nguy cơ suy thận 2 năm và 5 năm rất cao', () => {
      const res = computeKfre({
        age: 70,
        sex: 'female',
        egfr: 20,
        uacr: 100,
        uacrUnit: 'mg/mmol',
        region: 'non_north_america',
      });

      expect(res.risk2Year!).toBeGreaterThan(5.0);
      expect(res.risk5Year!).toBeGreaterThan(15.0);
      expect(res.interpretationVi).toContain('rất cao');
    });

    // Ca 3: So sánh giữa hệ số Ngoài Bắc Mỹ và Bắc Mỹ
    it('Ca 3: Quần thể Bắc Mỹ có xác suất suy thận ước tính cao hơn hệ số Ngoài Bắc Mỹ', () => {
      const inputBase = {
        age: 60,
        sex: 'male' as const,
        egfr: 40,
        uacr: 20,
        uacrUnit: 'mg/mmol' as const,
      };

      const resNonNA = computeKfre({ ...inputBase, region: 'non_north_america' });
      const resNA = computeKfre({ ...inputBase, region: 'north_america' });

      expect(resNA.risk5Year!).toBeGreaterThan(resNonNA.risk5Year!);
    });

    // Ca 4: Giá trị biên eGFR ≥ 60
    it('Ca 4: Đưa ra cảnh báo khi eGFR ≥ 60 vì KFRE chính xác nhất ở G3-G5', () => {
      const res = computeKfre({
        age: 50,
        sex: 'male',
        egfr: 65,
        uacr: 10,
        uacrUnit: 'mg/mmol',
      });

      expect(res.warning).toContain('G3-G5');
    });

    // Ca 5: Biên tuổi < 18
    it('Ca 5: Trả về null khi tuổi < 18', () => {
      const res = computeKfre({
        age: 15,
        sex: 'male',
        egfr: 30,
        uacr: 20,
      });

      expect(res.risk2Year).toBeNull();
      expect(res.risk5Year).toBeNull();
      expect(res.warning).toContain('18 tuổi');
    });
  });
});
