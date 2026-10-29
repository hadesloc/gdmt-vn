import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyCitation, LIBRARY_ROOT } from '../../tools/kb/citations';
import type { Source, Citation } from '../../src/kb-types/index';

describe('verifyCitation', () => {
  const kdigoRelPath = '01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf';
  const hasKdigo = existsSync(resolve(LIBRARY_ROOT, kdigoRelPath));

  const validSource: Source = {
    id: 'kdigo_2024_ckd',
    org: 'KDIGO',
    title: 'KDIGO 2024 CKD Guideline',
    year: 2024,
    jurisdiction: 'INTL',
    lang: 'en',
    localPath: kdigoRelPath,
  };

  it.runIf(hasKdigo)('xác minh thành công trích dẫn thật đúng trang', () => {
    const validCitation: Citation = {
      id: 'test.cite.valid',
      sourceId: 'kdigo_2024_ckd',
      pdfPage: 44,
      locator: 'Practice Point 3.7.2',
      quote:
        'asonable to continue an SGLT2i even if the eGFR falls below 20 ml/min per 1.73 m 2, unless it is not tolerated or KRT is initiated.',
    };

    const res = verifyCitation(validCitation, validSource);
    expect(res.ok).toBe(true);
    expect(res.foundPages).toContain(44);
    expect(res.findings.some((f) => f.code === 'CITE_OK')).toBe(true);
  });

  it.runIf(hasKdigo)('cảnh báo WARN_PAGE_TOLERANCE khi khai báo lệch ±1 trang', () => {
    const toleranceCitation: Citation = {
      id: 'test.cite.tolerance',
      sourceId: 'kdigo_2024_ckd',
      pdfPage: 45, // trang thật là 44 -> lệch 1 trang
      locator: 'Practice Point 3.7.2',
      quote:
        'asonable to continue an SGLT2i even if the eGFR falls below 20 ml/min per 1.73 m 2, unless it is not tolerated or KRT is initiated.',
    };

    const res = verifyCitation(toleranceCitation, validSource);
    expect(res.ok).toBe(true); // vẫn tính là OK với warning
    expect(res.findings.some((f) => f.code === 'WARN_PAGE_TOLERANCE')).toBe(true);
  });

  it.runIf(hasKdigo)('báo lỗi CITE_WRONG_PAGE khi khai báo lệch trang xa', () => {
    const wrongPageCitation: Citation = {
      id: 'test.cite.wrong_page',
      sourceId: 'kdigo_2024_ckd',
      pdfPage: 10, // trang thật là 44 -> xa
      locator: 'Practice Point 3.7.2',
      quote:
        'asonable to continue an SGLT2i even if the eGFR falls below 20 ml/min per 1.73 m 2, unless it is not tolerated or KRT is initiated.',
    };

    const res = verifyCitation(wrongPageCitation, validSource);
    expect(res.ok).toBe(false);
    expect(res.findings.some((f) => f.code === 'CITE_WRONG_PAGE')).toBe(true);
  });

  it.runIf(hasKdigo)('báo lỗi CITE_NOT_FOUND khi câu trích dẫn bị sửa sai (bịa đặt)', () => {
    const fakeCitation: Citation = {
      id: 'test.cite.fake',
      sourceId: 'kdigo_2024_ckd',
      pdfPage: 44,
      locator: 'Fake Rec',
      quote: 'KDIGO strongly recommends discontinuing all SGLT2i when eGFR is below 60 ml/min',
    };

    const res = verifyCitation(fakeCitation, validSource);
    expect(res.ok).toBe(false);
    expect(res.findings.some((f) => f.code === 'CITE_NOT_FOUND')).toBe(true);
  });

  it('báo lỗi CITE_FILE_MISSING khi file nguồn không tồn tại', () => {
    const missingSource: Source = {
      id: 'src_missing',
      org: 'ORG',
      title: 'Missing',
      year: 2026,
      jurisdiction: 'INTL',
      lang: 'en',
      localPath: '99_Non_Existent/Missing.pdf',
    };
    const cite: Citation = {
      id: 'c1',
      sourceId: 'src_missing',
      locator: 'p. 1',
      quote: 'Some text',
    };

    const res = verifyCitation(cite, missingSource);
    expect(res.ok).toBe(false);
    expect(res.findings.some((f) => f.code === 'CITE_FILE_MISSING')).toBe(true);
  });
});
