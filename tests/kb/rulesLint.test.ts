/**
 * QA-1, QA-7 & QA-8 Rules Linting Test Suite
 * Phân quyền: Agent C
 */

import { describe, it, expect } from 'vitest';
import { lintRuleContent, scanModulesLint, parseQaAllow } from '../../tools/kb/rulesLint';
import { thFor } from '../../src/kb-types/access';
import type { Citation } from '../../src/kb-types/index';

describe('QA-8: Phân tích chú thích qa-allow', () => {
  it('chấp nhận các loại qa-allow hợp lệ: ui-step, index, unit-conversion kèm lý do', () => {
    const q1 = parseQaAllow('const step = 1; // qa-allow: ui-step - số bước giao diện');
    expect(q1.hasQaAllow).toBe(true);
    expect(q1.isValid).toBe(true);
    expect(q1.category).toBe('ui-step');

    const q2 = parseQaAllow('const idx = i + 1; // qa-allow: index - chỉ số mảng');
    expect(q2.hasQaAllow).toBe(true);
    expect(q2.isValid).toBe(true);
    expect(q2.category).toBe('index');

    const q3 = parseQaAllow('const factor = 18.0; // qa-allow: unit-conversion - đổi mg/dL sang mmol/L');
    expect(q3.hasQaAllow).toBe(true);
    expect(q3.isValid).toBe(true);
    expect(q3.category).toBe('unit-conversion');
  });

  it('báo lỗi khi dùng qa-allow sai loại (không thuộc 3 loại cố định)', () => {
    const qBad1 = parseQaAllow('const egfr = 30; // qa-allow: ngưỡng lâm sàng theo ADA');
    expect(qBad1.hasQaAllow).toBe(true);
    expect(qBad1.isValid).toBe(false);

    const qBad2 = parseQaAllow('const dapaDose = 10; // qa-allow: liều dapagliflozin');
    expect(qBad2.hasQaAllow).toBe(true);
    expect(qBad2.isValid).toBe(false);
  });
});

describe('QA-8: Kiểm tra tĩnh cấm khai báo hằng số lâm sàng trong module', () => {
  it('báo lỗi khi module khai báo file thresholds.ts', () => {
    const findings = lintRuleContent('export const X = 1;', 'modules/dm2/thresholds.ts');
    const err = findings.find((f) => f.code === 'MODULE_CONST_CLINICAL_NUMBERS');
    expect(err).toBeDefined();
    expect(err!.msg).toContain('Cấm khai báo file hằng số lâm sàng');
  });

  it('báo lỗi khi module khai báo const *_THRESHOLDS hoặc const THRESHOLDS', () => {
    const code = `
      export const DM2_THRESHOLDS = {
        hba1cGeneralTarget: 7.0,
        ckdEgfrThreshold: 60,
      };
    `;
    const findings = lintRuleContent(code, 'modules/dm2/rules.ts');
    const err = findings.find((f) => f.code === 'MODULE_CONST_CLINICAL_NUMBERS');
    expect(err).toBeDefined();
    expect(err!.msg).toContain('Cấm khai báo const/object hằng số lâm sàng');
  });
});

describe('QA-8: Kiểm tra tĩnh lời gọi th() / thr() / dose()', () => {
  it('không báo lỗi khi th() gọi ID có thật trong KB', () => {
    const code = `
      const minEgfr = th('ckd.sglt2i.egfr_initiate_min');
      const drugDapa = dose('dapagliflozin', 'start');
    `;
    const findings = lintRuleContent(code, 'modules/ckd/rules.ts');
    expect(findings.filter((f) => f.code === 'CALL_MISSING_THRESHOLD_ID')).toHaveLength(0);
    expect(findings.filter((f) => f.code === 'CALL_MISSING_DRUG_ID')).toHaveLength(0);
  });

  it('báo LỖI khi th() hoặc thr() gọi ID không tồn tại trong KB', () => {
    const code = `
      const target = th('fake.non_existent.threshold_xyz');
      const full = thr('another.fake.threshold_123');
    `;
    const findings = lintRuleContent(code, 'modules/test/rules.ts');
    const errors = findings.filter((f) => f.code === 'CALL_MISSING_THRESHOLD_ID');
    expect(errors.length).toBe(2);
    expect(errors[0].msg).toContain('fake.non_existent.threshold_xyz');
  });

  it('báo LỖI khi dose() gọi drugId không tồn tại trong KB', () => {
    const code = `
      const start = dose('fake_drug_not_in_kb', 'start');
    `;
    const findings = lintRuleContent(code, 'modules/test/rules.ts');
    const errors = findings.filter((f) => f.code === 'CALL_MISSING_DRUG_ID');
    expect(errors.length).toBe(1);
    expect(errors[0].msg).toContain('fake_drug_not_in_kb');
  });
});

describe('QA-10: Kiểm tra an toàn đại lượng lâm sàng (thFor & Quantity Mismatch)', () => {
  it('thFor trả về giá trị số chính xác khi khớp đúng đại lượng lâm sàng', () => {
    const val = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
    expect(val).toBe(20);
  });

  it('thFor ném Error khi ID không tồn tại trong KB', () => {
    expect(() => thFor('egfr', 'non_existent_thresh')).toThrowError('Không tìm thấy Threshold');
  });

  it('thFor ném Error QA-10 Quantity Mismatch khi dùng nhầm đại lượng (ví dụ lấy ngưỡng egfr cho biến k)', () => {
    expect(() => thFor('k', 'ckd.sglt2i.egfr_initiate_min')).toThrowError(
      /QA-10 Quantity Mismatch.*Kỳ vọng đại lượng 'k' nhưng Threshold 'ckd.sglt2i.egfr_initiate_min' mang đại lượng 'egfr'/
    );
  });

  it('linter phát hiện LỖI QA10_QUANTITY_MISMATCH khi biến lâm sàng so sánh với th() sai đại lượng', () => {
    const code = `
      const k = need(ctx, 'k');
      if (k >= th('ckd.sglt2i.egfr_initiate_min')) {
        action = 'HOLD';
      }
    `;
    const findings = lintRuleContent(code, 'modules/test/rules.ts');
    const err = findings.find((f) => f.code === 'QA10_QUANTITY_MISMATCH');
    expect(err).toBeDefined();
    expect(err!.msg).toContain('QA-10 DÙNG NHẦM NGƯỠNG');
    expect(err!.msg).toContain("đại lượng: 'k'");
    expect(err!.msg).toContain("đại lượng là 'egfr'");
  });
});

describe('QA-1 & QA-7 Rules Linter: Kiểm tra tĩnh đơn vị', () => {
  it('phát hiện LỖI khi gán mặc định số: ctx.derived.egfr ?? 100', () => {
    const code = `
      const egfr = ctx.derived.egfr ?? 100;
    `;
    const findings = lintRuleContent(code, 'test.ts');
    const errors = findings.filter((f) => f.code === 'CLINICAL_DEFAULT_NUMBER');
    expect(errors.length).toBe(1);
  });

  it('phát hiện CẢNH BÁO WARN_LITERAL_IN_TEXT khi chuỗi dose/title chứa số lâm sàng literal', () => {
    const code = `
      const rec = {
        title: 'Khởi trị Dapagliflozin 10 mg',
        dose: '500 mg x 2 lần/ngày',
      };
    `;
    const findings = lintRuleContent(code, 'test.ts');
    const textWarnings = findings.filter((f) => f.code === 'WARN_LITERAL_IN_TEXT');
    expect(textWarnings.length).toBe(2);
  });

  it('phát hiện CẢNH BÁO WARN_DOSE_NOT_IN_CITATION khi liều hiển thị không xuất hiện trong citation', () => {
    const mockCitations = new Map<string, Citation>([
      [
        'cite_dapa_10mg',
        {
          id: 'cite_dapa_10mg',
          sourceId: 'esc_2026_hf',
          locator: 'Table 11',
          quote: 'Dapagliflozin 10 mg once daily',
        },
      ],
    ]);

    const mismatchedBlock = `
      const r = {
        dose: '50 mg uống mỗi ngày',
        citationIds: ['cite_dapa_10mg']
      };
    `;
    const findingsMismatch = lintRuleContent(mismatchedBlock, 'test.ts', mockCitations);
    const doseWarnings = findingsMismatch.filter((f) => f.code === 'WARN_DOSE_NOT_IN_CITATION');
    expect(doseWarnings.length).toBe(1);
    expect(doseWarnings[0].msg).toContain('50 mg');
  });
});

describe('QA-1, QA-7 & QA-8: Báo cáo Thống kê Thực trạng Toàn Bộ Modules', () => {
  it('quét toàn bộ các file rules trong src/modules và thống kê chi tiết theo module', () => {
    const report = scanModulesLint();

    console.log('\n========================================================================================================================');
    console.log('                          BÁO CÁO TOÀN DIỆN THỰC TRẠNG QA-1, QA-7 & QA-8 (RULES LINTING)                               ');
    console.log('========================================================================================================================');
    console.log(`Tổng số file modules đã quét:           ${report.totalFilesScanned}`);
    console.log(`Tổng lỗi gán mặc định (?? <số>):        ${report.findings.filter((f) => f.code === 'CLINICAL_DEFAULT_NUMBER').length} (QA-1)`);
    console.log(`Tổng lỗi khai báo const/file lâm sàng:  ${report.findings.filter((f) => f.code === 'MODULE_CONST_CLINICAL_NUMBERS').length} (QA-8)`);
    console.log(`Tổng lỗi qa-allow sai loại:             ${report.findings.filter((f) => f.code === 'INVALID_QA_ALLOW_CATEGORY').length} (QA-8)`);
    console.log(`Tổng lỗi gọi ID Threshold/Drug không có:${report.findings.filter((f) => f.code === 'CALL_MISSING_THRESHOLD_ID' || f.code === 'CALL_MISSING_DRUG_ID').length} (QA-8)`);
    console.log(`Tổng cảnh báo so sánh số literal:       ${report.findings.filter((f) => f.code === 'LITERAL_CLINICAL_THRESHOLD').length} (QA-1)`);
    console.log(`Tổng cảnh báo text literal liều:        ${report.findings.filter((f) => f.code === 'WARN_LITERAL_IN_TEXT').length} (QA-7)`);
    console.log('------------------------------------------------------------------------------------------------------------------------');
    console.log('BẢNG PHÂN BỐ THEO TỪNG MODULE:');
    console.log('MODULE      | FILES | LỖI ?? SỐ | LỖI CONST | QA-ALLOW HỢP LỆ | QA-ALLOW SAI | SO SÁNH LITERAL | TEXT LITERAL LIỀU');
    console.log('------------+-------+-----------+-----------+-----------------+--------------+-----------------+------------------');

    for (const [mod, stat] of Object.entries(report.byModule)) {
      console.log(
        `${mod.padEnd(11)} | ${String(stat.filesScanned).padStart(5)} | ${String(stat.defaultNumberErrors).padStart(9)} | ${String(stat.moduleConstErrors).padStart(9)} | ${String(stat.qaAllowValidCount).padStart(15)} | ${String(stat.qaAllowInvalidCount).padStart(12)} | ${String(stat.literalThresholdWarnings).padStart(15)} | ${String(stat.literalInTextWarnings).padStart(17)}`
      );
    }

    console.log('------------------------------------------------------------------------------------------------------------------------');
    console.log('CHẾ ĐỘ: BÁO CÁO (Report Mode). Chưa kích hoạt exit 1 cho các cảnh báo');
    console.log('để các module agent (E, F, G, B) chuyển đổi mã nguồn sang dùng accessor th(), thr(), dose().');
    console.log('========================================================================================================================\n');

    expect(report.totalFilesScanned).toBeGreaterThan(0);
  });
});
