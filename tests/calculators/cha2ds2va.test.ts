/**
 * Bộ kiểm thử Thang điểm CHA₂DS₂-VA (ESC 2024) & CHA₂DS₂-VASc
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { computeCha2ds2va } from '../../src/engine/calculators/cha2ds2va';

describe('CHA₂DS₂-VA Calculator (ESC 2024 AF Guidelines)', () => {
  // Ca 1: Nam 52 tuổi chỉ có Tăng huyết áp
  it('Ca 1: Nam 52 tuổi có THA đơn độc -> Điểm VA = 1, Class IIa', () => {
    const res = computeCha2ds2va({
      chf: false,
      hypertension: true,
      age: 52,
      diabetes: false,
      strokeOrTia: false,
      vascularDisease: false,
      sex: 'male',
    });

    expect(res.scoreVa).toBe(1);
    expect(res.scoreVasc).toBe(1);
    expect(res.recommendationEsc2024.class).toBe('IIa');
    expect(res.recommendationEsc2024.actionVi).toContain('Nên xem xét');
  });

  // Ca 2: Nữ 72 tuổi (nhóm tuổi 65 - 74 = 1 điểm), không có YTNC khác
  it('Ca 2: Nữ 72 tuổi đơn độc -> Điểm VA = 1 (ESC 2024 loại bỏ Sc), Class IIa', () => {
    const res = computeCha2ds2va({
      chf: false,
      hypertension: false,
      age: 72,
      diabetes: false,
      strokeOrTia: false,
      vascularDisease: false,
      sex: 'female',
    });

    expect(res.scoreVa).toBe(1);
    // Điểm VASc cũ sẽ có +1 cho giới nữ -> 2 điểm
    expect(res.scoreVasc).toBe(2);
    expect(res.recommendationEsc2024.class).toBe('IIa');
  });

  // Ca 3: Nam 76 tuổi (tuổi ≥ 75 = 2 điểm), ĐTĐ (+1), Suy tim (+1) -> Điểm VA = 4
  it('Ca 3: Nam 76 tuổi có nhiều YTNC -> Điểm VA = 4 ≥ 2, Khuyến cáo bắt buộc Class I', () => {
    const res = computeCha2ds2va({
      chf: true,
      hypertension: false,
      age: 76,
      diabetes: true,
      strokeOrTia: false,
      vascularDisease: false,
      sex: 'male',
    });

    expect(res.scoreVa).toBe(4);
    expect(res.recommendationEsc2024.class).toBe('I');
    expect(res.recommendationEsc2024.actionVi).toContain('Khuyến cáo chỉ định');
  });

  // Ca 4: Nữ 35 tuổi hoàn toàn khỏe mạnh, không bệnh tim mạch
  it('Ca 4: Nữ 35 tuổi không YTNC -> Điểm VA = 0, Chống chỉ định OAC Class III', () => {
    const res = computeCha2ds2va({
      chf: false,
      hypertension: false,
      age: 35,
      diabetes: false,
      strokeOrTia: false,
      vascularDisease: false,
      sex: 'female',
    });

    expect(res.scoreVa).toBe(0);
    // Cổ điển VASc cho nữ đơn thuần 1 điểm nhưng không có chỉ định
    expect(res.scoreVasc).toBe(1);
    expect(res.recommendationEsc2024.class).toBe('III');
    expect(res.recommendationEsc2024.actionVi).toContain('Không chỉ định');
  });

  // Ca 5: Bệnh nhân có tiền sử đột quỵ (Stroke/TIA = 2 điểm)
  it('Ca 5: Bệnh nhân trẻ tuổi có tiền sử đột quỵ -> Điểm VA = 2, Class I', () => {
    const res = computeCha2ds2va({
      chf: false,
      hypertension: false,
      age: 45,
      diabetes: false,
      strokeOrTia: true,
      vascularDisease: false,
    });

    expect(res.scoreVa).toBe(2);
    expect(res.recommendationEsc2024.class).toBe('I');
  });
});
