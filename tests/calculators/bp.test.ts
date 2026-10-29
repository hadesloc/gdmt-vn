/**
 * Bộ kiểm thử Phân loại Huyết áp (ESC 2024 & ACC/AHA)
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { computeBp } from '../../src/engine/calculators/bp';

describe('Blood Pressure Classification Calculator', () => {
  // Ca 1: Huyết áp không tăng (Non-elevated BP: SBP < 120 VÀ DBP < 70)
  it('Ca 1: 115/65 mmHg -> Non-elevated BP theo ESC 2024; Normal theo ACC/AHA', () => {
    const res = computeBp({ sbp: 115, dbp: 65 });

    expect(res.esc2024.category).toBe('non_elevated');
    expect(res.esc2024.categoryVi).toContain('Huyết áp không tăng');
    expect(res.accAha2025.stage).toBe('normal');
    expect(res.isolatedSystolicHypertension).toBe(false);
    expect(res.pulsePressure).toBe(50);
  });

  // Ca 2: Huyết áp tăng (Elevated BP: 120-139 hoặc 70-89 mmHg)
  it('Ca 2: 128/76 mmHg -> Elevated BP theo ESC 2024; Elevated theo ACC/AHA', () => {
    const res = computeBp({ sbp: 128, dbp: 76 });

    expect(res.esc2024.category).toBe('elevated');
    expect(res.esc2024.categoryVi).toContain('Huyết áp tăng');
    expect(res.accAha2025.stage).toBe('elevated');
    expect(res.isolatedSystolicHypertension).toBe(false);
  });

  // Ca 3: Tăng huyết áp Độ 1 & Tâm thu đơn độc (SBP ≥ 140 và DBP < 90)
  it('Ca 3: 148/82 mmHg -> Hypertension Độ 1 theo ESC 2024; Tăng HA tâm thu đơn độc', () => {
    const res = computeBp({ sbp: 148, dbp: 82 });

    expect(res.esc2024.category).toBe('hypertension');
    expect(res.isolatedSystolicHypertension).toBe(true);
    expect(res.accAha2025.stage).toBe('stage_2'); // ACC/AHA: SBP >= 140 là Stage 2
  });

  // Ca 4: Tăng huyết áp Độ 2 (≥ 160 hoặc ≥ 100 mmHg)
  it('Ca 4: 165/102 mmHg -> Hypertension Độ 2 theo ESC 2024', () => {
    const res = computeBp({ sbp: 165, dbp: 102 });

    expect(res.esc2024.category).toBe('hypertension');
    expect(res.esc2024.subClassification).toBe('Grade 2');
    expect(res.esc2024.clinicalActionVi).toContain('viên phối hợp đôi');
  });

  // Ca 5: Cơn tăng huyết áp (≥ 180 hoặc ≥ 110 mmHg)
  it('Ca 5: 185/115 mmHg -> Cơn tăng huyết áp khẩn cấp/cấp cứu', () => {
    const res = computeBp({ sbp: 185, dbp: 115 });

    expect(res.esc2024.category).toBe('hypertension');
    expect(res.esc2024.subClassification).toBe('Hypertensive Urgency/Emergency');
    expect(res.accAha2025.stage).toBe('crisis');
  });
});
