/**
 * Bộ kiểm thử Calculator Registry
 * Phân quyền: Agent D
 */

import { describe, it, expect } from 'vitest';
import { calculatorRegistry } from '../../src/engine/calculators';

describe('Calculator Registry (Danh mục máy tính lâm sàng)', () => {
  it('đăng ký đầy đủ 15 máy tính lâm sàng', () => {
    expect(calculatorRegistry.length).toBe(15);

    const ids = calculatorRegistry.map((item) => item.id);
    expect(ids).toContain('egfr');
    expect(ids).toContain('crcl');
    expect(ids).toContain('kdigo');
    expect(ids).toContain('kfre');
    expect(ids).toContain('score2');
    expect(ids).toContain('prevent');
    expect(ids).toContain('cha2ds2va');
    expect(ids).toContain('doacDose');
    expect(ids).toContain('gold');
    expect(ids).toContain('gina');
    expect(ids).toContain('ldlTarget');
    expect(ids).toContain('bp');
    expect(ids).toContain('bmi');
    expect(ids).toContain('insulin');
    expect(ids).toContain('urate');
  });

  it('mỗi máy tính có đầy đủ metadata và có thể chạy với giá trị mặc định', () => {
    for (const item of calculatorRegistry) {
      expect(item.id).toBeTruthy();
      expect(item.nameVi).toBeTruthy();
      expect(item.shortDescriptionVi).toBeTruthy();
      expect(item.source).toBeDefined();
      expect(item.source.guideline).toBeTruthy();

      // Thu thập giá trị mặc định từ inputs
      const defaultInputs: Record<string, any> = {};
      for (const input of item.inputs) {
        if (input.defaultValue !== undefined) {
          defaultInputs[input.id] = input.defaultValue;
        }
      }

      // Thực thi hàm compute
      const result = item.compute(defaultInputs);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    }
  });
});
