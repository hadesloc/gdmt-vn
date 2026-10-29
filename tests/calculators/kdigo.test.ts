/**
 * Bộ kiểm thử Phân độ Bệnh thận mạn KDIGO 2024 (Heatmap G1-G5 × A1-A3)
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { classifyKdigoGStage, classifyKdigoAStage, computeKdigo } from '../../src/engine/calculators/kdigo';

describe('KDIGO 2024 Heatmap & Staging', () => {
  describe('classifyKdigoGStage', () => {
    it('phân đúng 6 bậc G1 đến G5 theo eGFR', () => {
      expect(classifyKdigoGStage(95)).toBe('G1');
      expect(classifyKdigoGStage(90)).toBe('G1');
      expect(classifyKdigoGStage(89)).toBe('G2');
      expect(classifyKdigoGStage(60)).toBe('G2');
      expect(classifyKdigoGStage(59)).toBe('G3a');
      expect(classifyKdigoGStage(45)).toBe('G3a');
      expect(classifyKdigoGStage(44)).toBe('G3b');
      expect(classifyKdigoGStage(30)).toBe('G3b');
      expect(classifyKdigoGStage(29)).toBe('G4');
      expect(classifyKdigoGStage(15)).toBe('G4');
      expect(classifyKdigoGStage(14)).toBe('G5');
      expect(classifyKdigoGStage(8)).toBe('G5');
    });
  });

  describe('classifyKdigoAStage', () => {
    it('phân đúng 3 mức A1, A2, A3 theo đơn vị mg/mmol (chuẩn VN)', () => {
      expect(classifyKdigoAStage(1.2, 'mg/mmol')).toBe('A1');
      expect(classifyKdigoAStage(2.9, 'mg/mmol')).toBe('A1');
      expect(classifyKdigoAStage(3.0, 'mg/mmol')).toBe('A2');
      expect(classifyKdigoAStage(25.0, 'mg/mmol')).toBe('A2');
      expect(classifyKdigoAStage(30.0, 'mg/mmol')).toBe('A2');
      expect(classifyKdigoAStage(30.1, 'mg/mmol')).toBe('A3');
      expect(classifyKdigoAStage(65.0, 'mg/mmol')).toBe('A3');
    });

    it('phân đúng 3 mức A1, A2, A3 theo đơn vị mg/g', () => {
      expect(classifyKdigoAStage(15, 'mg/g')).toBe('A1');
      expect(classifyKdigoAStage(30, 'mg/g')).toBe('A2');
      expect(classifyKdigoAStage(250, 'mg/g')).toBe('A2');
      expect(classifyKdigoAStage(301, 'mg/g')).toBe('A3');
    });
  });

  describe('computeKdigo (Ma trận màu Heatmap & Tần suất theo dõi)', () => {
    // Ca 1: G1A1 -> Green, thấp, 1 lần/năm
    it('Ca 1: G1A1 -> Màu xanh lá, nguy cơ thấp, 1 lần/năm', () => {
      const res = computeKdigo({ egfr: 95, uacr: 1.5, uacrUnit: 'mg/mmol' });
      expect(res.compositeStage).toBe('G1A1');
      expect(res.heatmapColor).toBe('green');
      expect(res.riskTierVi).toBe('Nguy cơ thấp');
      expect(res.monitoringFrequencyPerYear).toBe(1);
    });

    // Ca 2: G3aA2 -> Orange, cao, 2 lần/năm
    it('Ca 2: G3aA2 -> Màu cam, nguy cơ cao, 2 lần/năm', () => {
      const res = computeKdigo({ egfr: 52, uacr: 15.0, uacrUnit: 'mg/mmol' });
      expect(res.compositeStage).toBe('G3aA2');
      expect(res.heatmapColor).toBe('orange');
      expect(res.riskTierVi).toBe('Nguy cơ cao');
      expect(res.monitoringFrequencyPerYear).toBe(2);
    });

    // Ca 3: G4A3 -> Red, rất cao, ≥ 4 lần/năm
    it('Ca 3: G4A3 -> Màu đỏ, nguy cơ rất cao, ≥ 4 lần/năm', () => {
      const res = computeKdigo({ egfr: 22, uacr: 45.0, uacrUnit: 'mg/mmol' });
      expect(res.compositeStage).toBe('G4A3');
      expect(res.heatmapColor).toBe('red');
      expect(res.riskTierVi).toBe('Nguy cơ rất cao');
      expect(res.monitoringFrequencyPerYear).toBe('≥ 4');
    });

    // Ca 4: G3bA3 với đơn vị mg/g -> Red, rất cao, 3 lần/năm
    it('Ca 4: G3bA3 (mg/g) -> Màu đỏ, 3 lần/năm', () => {
      const res = computeKdigo({ egfr: 38, uacr: 450, uacrUnit: 'mg/g' });
      expect(res.compositeStage).toBe('G3bA3');
      expect(res.heatmapColor).toBe('red');
      expect(res.monitoringFrequencyPerYear).toBe(3);
    });
  });
});
