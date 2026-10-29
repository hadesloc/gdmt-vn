import { describe, it, expect } from 'vitest';
import { computeContentHash } from '../../src/kb-types/node';

describe('computeContentHash', () => {
  const baseDrug = {
    id: 'dapagliflozin',
    nameVi: 'Dapagliflozin',
    inn: 'Dapagliflozin',
    class: 'SGLT2i',
    forms: ['10 mg'],
    vnBrands: ['Forxiga'],
    renal: [],
    gates: [],
    interactions: [],
    citationIds: ['cite.1'],
  };

  it('tạo hash ổn định với cùng nội dung', () => {
    const h1 = computeContentHash(baseDrug);
    const h2 = computeContentHash({ ...baseDrug });
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('bỏ qua trường review metadata khi tính hash', () => {
    const h1 = computeContentHash(baseDrug);
    const withReview = {
      ...baseDrug,
      review: { status: 'ai_multi_reviewed' },
      contentHash: 'oldhash',
      reports: [{ verdict: 'pass' }],
    };
    const h2 = computeContentHash(withReview);
    expect(h1).toBe(h2);
  });

  it('thay đổi hash khi nội dung lâm sàng thay đổi', () => {
    const hOriginal = computeContentHash(baseDrug);
    const modifiedDrug = {
      ...baseDrug,
      forms: ['25 mg'], // thay đổi liều/dạng bào chế
    };
    const hModified = computeContentHash(modifiedDrug);
    expect(hOriginal).not.toBe(hModified);
  });
});
