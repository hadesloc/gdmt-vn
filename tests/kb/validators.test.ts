import { describe, it, expect } from 'vitest';
import {
  validateSource,
  validateCitation,
  validateThreshold,
  validateDrugEntry,
  validateReviewState,
} from '../../src/kb-types/index';

describe('validateSource', () => {
  it('chấp nhận Source hợp lệ', () => {
    const res = validateSource({
      id: 'kdigo_2024',
      org: 'KDIGO',
      title: 'KDIGO 2024 CKD',
      year: 2024,
      jurisdiction: 'INTL',
      lang: 'en',
      localPath: '01_Noi_Khoa/Than/KDIGO.pdf',
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('từ chối khi thiếu trường bắt buộc', () => {
    const res = validateSource({
      id: '',
      year: 1980,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('từ chối jurisdiction không hợp lệ', () => {
    const res = validateSource({
      id: 'src1',
      org: 'ORG',
      title: 'Title',
      year: 2024,
      jurisdiction: 'INVALID_ZONE',
      lang: 'en',
      url: 'https://example.com',
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('jurisdiction'))).toBe(true);
  });
});

describe('validateCitation', () => {
  it('chấp nhận Citation đầy đủ', () => {
    const res = validateCitation({
      id: 'cite.1',
      sourceId: 'kdigo_2024',
      locator: 'Rec 1.3',
      quote: 'eGFR >= 20',
      pdfPage: 44,
      cor: 'I',
    });
    expect(res.valid).toBe(true);
  });

  it('từ chối khi thiếu quote hoặc locator', () => {
    const res = validateCitation({
      id: 'cite.2',
      sourceId: 'kdigo_2024',
      locator: '',
      quote: '',
    });
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateThreshold', () => {
  it('chấp nhận Threshold hợp lệ', () => {
    const res = validateThreshold({
      id: 'ckd.sglt2i.egfr_min',
      value: 20,
      unit: 'mL/min/1.73m2',
      citationIds: ['cite.1'],
    });
    expect(res.valid).toBe(true);
  });

  it('từ chối khi thiếu citationIds hoặc value không phải số', () => {
    const res = validateThreshold({
      id: 'thresh.bad',
      value: NaN,
      unit: 'mmol/L',
      citationIds: [],
    });
    expect(res.valid).toBe(false);
  });
});

describe('validateDrugEntry', () => {
  it('chấp nhận DrugEntry hợp lệ', () => {
    const res = validateDrugEntry({
      id: 'dapagliflozin',
      nameVi: 'Dapagliflozin',
      inn: 'Dapagliflozin',
      class: 'SGLT2i',
      vnBrands: ['Forxiga'],
      forms: ['10 mg'],
      renal: [
        {
          eGFRFrom: 20,
          initiate: 'rec',
          continue: 'rec',
          citationIds: ['cite.1'],
        },
      ],
      gates: [
        {
          id: 'g1',
          parameter: 'eGFR',
          operator: '<',
          threshold: 20,
          action: 'hold',
          messageVi: 'Không dùng khi eGFR < 20',
          citationIds: ['cite.1'],
        },
      ],
      interactions: [],
      citationIds: ['cite.1'],
    });
    expect(res.valid).toBe(true);
  });

  it('từ chối khi renal band thiếu citationIds', () => {
    const res = validateDrugEntry({
      id: 'dapa',
      nameVi: 'Dapa',
      inn: 'Dapa',
      class: 'SGLT2i',
      vnBrands: [],
      forms: ['10mg'],
      renal: [
        {
          initiate: 'rec',
          continue: 'rec',
          citationIds: [],
        },
      ],
      gates: [],
      interactions: [],
      citationIds: ['cite.1'],
    });
    expect(res.valid).toBe(false);
  });
});

describe('validateReviewState', () => {
  it('chấp nhận ReviewState hợp lệ', () => {
    const res = validateReviewState({
      itemId: 'dapagliflozin',
      contentHash: '26df2d089fcdf889',
      status: 'ai_multi_reviewed',
      reports: [
        {
          reviewedAt: '2026-10-26T20:00:00.000Z',
          verdict: 'pass',
          issues: [],
        },
      ],
    });
    expect(res.valid).toBe(true);
  });

  it('từ chối khi hash không đúng định dạng', () => {
    const res = validateReviewState({
      itemId: 'dapa',
      contentHash: 'invalid-hash',
      status: 'draft',
      reports: [],
    });
    expect(res.valid).toBe(false);
  });
});
