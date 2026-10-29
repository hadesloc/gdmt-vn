/**
 * Bộ kiểm thử Máy tính eGFR (CKD-EPI 2021 race-free & Cystatin C)
 * Phân quyền: Agent D
 *
 * Kiểm tra đối chiếu ≥5 ca chuẩn so với công thức NEJM 2021 / KDIGO 2024
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEgfrCr,
  calculateEgfrCrCys,
  calculateEgfrCys,
  computeEgfr,
  convertScrToMgDl,
} from '../../src/engine/calculators/egfr';

describe('eGFR Calculators (CKD-EPI 2021)', () => {
  describe('convertScrToMgDl', () => {
    it('chuyển đổi chính xác từ µmol/L sang mg/dL', () => {
      // 88.42 µmol/L = 1.0 mg/dL
      expect(convertScrToMgDl(88.42, 'umol/L')).toBeCloseTo(1.0, 3);
      expect(convertScrToMgDl(1.5, 'mg/dL')).toBe(1.5);
    });
  });

  describe('calculateEgfrCr (CKD-EPI 2021 Creatinine Race-Free)', () => {
    // Ca 1: Nữ 60 tuổi, Creatinin 1.0 mg/dL (88.42 µmol/L)
    // Nguồn: KDIGO 2024 & Inker NEJM 2021 ví dụ chuẩn: ~64.5 mL/min/1.73m²
    it('Ca 1: Nữ 60 tuổi, Cr 1.0 mg/dL (~88.42 µmol/L) -> eGFR ~64.5', () => {
      const result = calculateEgfrCr(88.42, 60, 'female', 'umol/L');
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(64.5, 0);
    });

    // Ca 2: Nam 50 tuổi, Creatinin 1.2 mg/dL (~106.1 µmol/L)
    // Nguồn: Inker NEJM 2021: ~73.6 mL/min/1.73m²
    it('Ca 2: Nam 50 tuổi, Cr 1.2 mg/dL (~106.1 µmol/L) -> eGFR ~73.6', () => {
      const result = calculateEgfrCr(106.1, 50, 'male', 'umol/L');
      expect(result).not.toBeNull();
      expect(Math.round(result!)).toBe(74);
    });

    // Ca 3: Nam 25 tuổi, Creatinin 0.8 mg/dL (nhỏ hơn kappa = 0.9)
    // Tính tay: 142 * (0.8/0.9)^-0.302 * 1 * 0.9938^25 = 125.9
    it('Ca 3: Nam trẻ tuổi 25 tuổi, Cr thấp 0.8 mg/dL -> eGFR ~126', () => {
      const result = calculateEgfrCr(0.8, 25, 'male', 'mg/dL');
      expect(result).not.toBeNull();
      expect(Math.round(result!)).toBe(126);
    });

    // Ca 4: Nữ 70 tuổi, Creatinin 0.6 mg/dL (nhỏ hơn kappa = 0.7)
    // Tính tay: 142 * (0.6/0.7)^-0.241 * 1 * 0.9938^70 * 1.012 = 96.5
    it('Ca 4: Nữ cao tuổi 70 tuổi, Cr 0.6 mg/dL -> eGFR ~96.5', () => {
      const result = calculateEgfrCr(0.6, 70, 'female', 'mg/dL');
      expect(result).not.toBeNull();
      expect(Math.round(result!)).toBe(97);
    });

    // Ca 5: Nam 65 tuổi, Suy thận nặng với Creatinin 3.5 mg/dL (~309.5 µmol/L)
    // Tính tay: 142 * 1 * (3.5/0.9)^-1.200 * 0.9938^65 = 18.5
    it('Ca 5: Nam 65 tuổi, Creatinin cao 3.5 mg/dL -> eGFR ~18.5 (G4)', () => {
      const result = calculateEgfrCr(3.5, 65, 'male', 'mg/dL');
      expect(result).not.toBeNull();
      expect(Math.round(result!)).toBe(19);
    });
  });

  describe('calculateEgfrCrCys (Creatinine-Cystatin C kết hợp)', () => {
    // Ca 6: Nữ 55 tuổi, Cr 1.1 mg/dL, Cystatin C 1.2 mg/L
    it('Ca 6: Nữ 55 tuổi có cả Cr và Cystatin C -> tính eGFRcr-cys', () => {
      const result = calculateEgfrCrCys(1.1, 1.2, 55, 'female', 'mg/dL');
      expect(result).not.toBeNull();
      expect(result!).toBeGreaterThan(40);
      expect(result!).toBeLessThan(70);
    });
  });

  describe('calculateEgfrCys (Cystatin C đơn độc - CKD-EPI 2012 Inker NEJM 2012 / KDIGO 2024 Table 14)', () => {
    // Ca 7: Nam 45 tuổi, teo cơ, Cystatin C 0.9 mg/L
    // 133 * 1 * (0.9/0.8)^(-1.328) * 0.996^45 = 95.0
    it('Ca 7: Tính eGFR theo Cystatin C đơn độc khi khối cơ bất thường', () => {
      const result = calculateEgfrCys(0.9, 45, 'male');
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(95.0, 0);
    });

    // CKD-R3-R3-01: Kiểm định mũ -1.328 khi Cystatin C > 0.8 mg/L (tránh lỗi mũ -0.432 gây ước tính vọt eGFR gấp 2-3 lần)
    it('CKD-R3-R3-01: Nam 68 tuổi, Cystatin C = 2.1 mg/L -> eGFRcys = 28.1 mL/min/1.73m² (G4, KHÔNG phải ~67)', () => {
      const result = calculateEgfrCys(2.1, 68, 'male');
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(28.1, 1);
      expect(result!).toBeLessThan(30);
    });

    it('CKD-R3-R3-01: Nam 68 tuổi, Cystatin C = 3.5 mg/L -> eGFRcys = 14.3 mL/min/1.73m² (G5 suy thận giai đoạn cuối)', () => {
      const result = calculateEgfrCys(3.5, 68, 'male');
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(14.3, 1);
      expect(result!).toBeLessThan(15);
    });

    it('CKD-R3-R3-01: Nữ 68 tuổi, Cystatin C = 2.1 mg/L -> eGFRcys = 26.2 mL/min/1.73m² (nhân hệ số giới nữ 0.932)', () => {
      const result = calculateEgfrCys(2.1, 68, 'female');
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(26.2, 1);
    });
  });

  describe('computeEgfr (Hàm tổng hợp & kiểm tra giá trị biên)', () => {
    it('trả về cảnh báo và null khi tuổi < 18', () => {
      const res = computeEgfr({ scr: 80, age: 16, sex: 'male' });
      expect(res.recommendedEgfr).toBeNull();
      expect(res.warning).toContain('≥ 18 tuổi');
    });

    it('trả về cảnh báo và null khi Creatinin <= 0', () => {
      const res = computeEgfr({ scr: 0, age: 40, sex: 'female' });
      expect(res.recommendedEgfr).toBeNull();
      expect(res.warning).toContain('lớn hơn 0');
    });

    it('tự động ưu tiên Cr-Cys khi có đủ 2 chỉ số', () => {
      const res = computeEgfr({
        scr: 90,
        age: 60,
        sex: 'male',
        cystatinC: 1.1,
      });
      expect(res.formula).toBe('CKD-EPI 2021 Creatinine-Cystatin C');
      expect(res.egfrCr).not.toBeNull();
      expect(res.egfrCrCys).not.toBeNull();
      expect(res.recommendedEgfr).toBe(res.egfrCrCys);
    });
  });
});
