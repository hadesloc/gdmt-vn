import { describe, it, expect } from 'vitest';
import { quoteContainsNumber } from '../../tools/kb/citations';

describe('quoteContainsNumber (orphan number check)', () => {
  it('tìm thấy số nguyên đơn giản', () => {
    expect(quoteContainsNumber('eGFR falls below 20 ml/min per 1.73 m2', 20)).toBe(true);
    expect(quoteContainsNumber('starting dose 10 mg daily', 10)).toBe(true);
  });

  it('không nhận nhầm số con (ví dụ 2 trong 20 hoặc 20 trong 200)', () => {
    // 200 không được tính là chứa 20
    expect(quoteContainsNumber('urine ACR >= 200 mg/g', 20)).toBe(false);
    // 2 không được tính là chứa 20
    expect(quoteContainsNumber('take 2 tablets daily', 20)).toBe(false);
  });

  it('xử lý ký hiệu toán tử trước số (>=, <=, >, <, ≥, ≤, ‡)', () => {
    expect(quoteContainsNumber('eGFR >= 20 ml/min', 20)).toBe(true);
    expect(quoteContainsNumber('eGFR ≥ 20 ml/min', 20)).toBe(true);
    expect(quoteContainsNumber('eGFR ‡20 ml/min', 20)).toBe(true);
    expect(quoteContainsNumber('SBP < 140 mmHg', 140)).toBe(true);
    expect(quoteContainsNumber('K+ <= 5.0 mmol/L', 5)).toBe(true);
  });

  it('hỗ trợ số thập phân với dấu chấm hoặc dấu phẩy', () => {
    expect(quoteContainsNumber('serum potassium > 5.5 mmol/L', 5.5)).toBe(true);
    expect(quoteContainsNumber('serum potassium > 5,5 mmol/L', 5.5)).toBe(true);
    expect(quoteContainsNumber('HbA1c >= 7.0%', 7)).toBe(true);
  });

  it('trả về false khi số hoàn toàn không xuất hiện trong quote', () => {
    expect(quoteContainsNumber('Initiate SGLT2 inhibitor in all heart failure patients', 20)).toBe(false);
    expect(quoteContainsNumber('Dose: 10 mg once daily', 25)).toBe(false);
  });
});
