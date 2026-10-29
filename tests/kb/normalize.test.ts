import { describe, it, expect } from 'vitest';
import { normalizeForMatch, citationHtmlText } from '../../tools/kb/citations';

describe('normalizeForMatch', () => {
  it('loại bỏ toàn bộ khoảng trắng và chuyển chữ thường', () => {
    expect(normalizeForMatch('  Hello   World \n \t')).toBe('helloworld');
  });

  it('chuẩn hóa các biến thể dấu gạch ngang unicode thành "-"', () => {
    // \u2010 hyphen, \u2013 en-dash, \u2014 em-dash, \u2212 minus sign
    expect(normalizeForMatch('SGLT2\u2010inhibitor')).toBe('sglt2-inhibitor');
    expect(normalizeForMatch('10\u201320 mg')).toBe('10-20mg');
    expect(normalizeForMatch('dose \u2212 5')).toBe('dose-5');
  });

  it('chuẩn hóa các biến thể dấu nháy đơn và kép unicode', () => {
    // \u2018, \u2019, \u201C, \u201D
    expect(normalizeForMatch('“Patient’s guideline”')).toBe('"patient\'sguideline"');
  });

  it('chuẩn hóa tiếng Việt có dấu dạng NFC', () => {
    const decomposed = 'suy tim ngoa\u0323i tru\u0301'; // NFD
    expect(normalizeForMatch(decomposed)).toBe('suytimngoạitrú');
  });

  it('xử lý chuỗi rỗng an toàn', () => {
    expect(normalizeForMatch('')).toBe('');
  });
});

describe('citationHtmlText', () => {
  it('loại bỏ tag html và script/style', () => {
    const html = '<div><p>Recommendation <b>1.1</b></p><script>alert(1)</script></div>';
    expect(citationHtmlText(html).trim()).toBe('Recommendation  1.1');
  });

  it('giải mã các thực thể HTML', () => {
    const html = 'eGFR &ge; 20 mL/min &amp; ACR &gt; 30 mg/g &ndash; OK';
    expect(citationHtmlText(html)).toBe('eGFR ≥ 20 mL/min & ACR > 30 mg/g – OK');
  });
});
