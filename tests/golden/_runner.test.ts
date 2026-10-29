/**
 * GDMT-VN Golden Cases Vitest Runner
 * Phân quyền: Agent C
 *
 * Chạy hàm evaluate() của engine cho tất cả các ca chuẩn trong `tests/golden/`
 * và so khớp chính xác theo (drugId/ruleId + action, không so text).
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { evaluate } from '../../src/engine/evaluate';
import { setDemoEnabled } from '../../src/modules/registry';
import type { GoldenCase, GoldenCaseExpectItem } from '../../src/kb-types/goldenCase';
import { validateGoldenCase } from '../../src/kb-types/goldenCase';

const ROOT_DIR = resolve(process.cwd(), 'gdmt-vn');
const GOLDEN_DIR = existsSync(join(ROOT_DIR, 'tests', 'golden'))
  ? join(ROOT_DIR, 'tests', 'golden')
  : resolve(process.cwd(), 'tests', 'golden');

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(full));
    } else if (entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

function matchesExpectItem(
  rec: { id: string; drugId?: string; action: string; dose?: unknown; title?: string },
  item: GoldenCaseExpectItem
): boolean {
  if (item.drugId && rec.drugId !== item.drugId) {
    return false;
  }
  if (item.ruleId && rec.id !== item.ruleId) {
    return false;
  }
  if (rec.action !== item.action) {
    return false;
  }
  if (item.doseContains) {
    const doseStr = JSON.stringify(rec.dose ?? '') + ' ' + (rec.title ?? '');
    if (!doseStr.toLowerCase().includes(item.doseContains.toLowerCase())) {
      return false;
    }
  }
  return true;
}

describe('GDMT-VN Golden Cases Runner', () => {
  const jsonFiles = findJsonFiles(GOLDEN_DIR);

  it('phát hiện ít nhất một thư mục ca chuẩn', () => {
    expect(existsSync(GOLDEN_DIR)).toBe(true);
  });

  for (const filePath of jsonFiles) {
    const isFromOncallDraft = filePath.includes('_from_oncall');
    let testCase: GoldenCase;

    try {
      testCase = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (err) {
      it(`parse JSON: ${filePath}`, () => {
        throw new Error(`Lỗi parse JSON tại ${filePath}: ${(err as Error).message}`);
      });
      continue;
    }

    const testTitle = `[${testCase.id || 'unknown'}] ${testCase.titleVi || 'Ca kiểm thử'} (${filePath.replace(/.*tests[\\/]golden[\\/]/, '')})`;

    if (isFromOncallDraft && (!testCase.expect?.mustInclude || testCase.expect.mustInclude.length === 0)) {
      // Đối với ca nháp chuyển từ on-call chưa được gán expect: kiểm tra tính hợp lệ của cấu trúc patient/settings
      it.skip(`(Draft on-call - chờ module agent điền expect) ${testTitle}`, () => {
        expect(testCase.patient).toBeDefined();
        expect(testCase.settings).toBeDefined();
      });
      continue;
    }

    describe(testTitle, () => {
      it('tuân thủ schema GoldenCase', () => {
        const val = validateGoldenCase(testCase);
        if (!val.valid) {
          throw new Error(`Lỗi schema: ${val.errors.join(', ')}`);
        }
        expect(val.valid).toBe(true);
      });

      it('chạy evaluate() và khớp kỳ vọng mustInclude / mustNotInclude', () => {
        setDemoEnabled(testCase.patient.selectedModules.includes('_demo'));
        const plan = evaluate(testCase.patient, testCase.settings);
        expect(plan).toBeDefined();
        expect(plan.recommendations).toBeDefined();

        // 1. Kiểm tra mustInclude
        for (const item of testCase.expect.mustInclude) {
          const found = plan.recommendations.some((rec) => matchesExpectItem(rec, item));
          if (!found) {
            const availableRecs = plan.recommendations.map(
              (r) => `${r.drugId || r.id} -> ${r.action} (${r.title})`
            );
            throw new Error(
              `Không tìm thấy khuyến cáo kỳ vọng: drugId=${item.drugId}, ruleId=${item.ruleId}, action=${item.action}\nCác khuyến cáo thực tế engine sinh ra (${availableRecs.length}):\n  - ${availableRecs.join('\n  - ')}`
            );
          }
          expect(found).toBe(true);
        }

        // 2. Kiểm tra mustNotInclude
        if (testCase.expect.mustNotInclude) {
          for (const item of testCase.expect.mustNotInclude) {
            const prohibited = plan.recommendations.find((rec) => matchesExpectItem(rec, item));
            if (prohibited) {
              throw new Error(
                `Engine sinh ra khuyến cáo bị cấm: drugId=${prohibited.drugId}, ruleId=${prohibited.id}, action=${prohibited.action}`
              );
            }
            expect(prohibited).toBeUndefined();
          }
        }

        // 3. Kiểm tra alertsInclude (nếu có)
        if (testCase.expect.alertsInclude) {
          for (const alertExp of testCase.expect.alertsInclude) {
            const foundAlert = plan.alerts.some((a) => {
              const alertObj = a as unknown as Record<string, unknown>;
              if (alertExp.level && (alertObj.level ?? a.severity) !== alertExp.level) return false;
              if (alertExp.code && (alertObj.code ?? a.id) !== alertExp.code) return false;
              if (
                alertExp.messageContains &&
                !a.messageVi.toLowerCase().includes(alertExp.messageContains.toLowerCase())
              ) {
                return false;
              }
              return true;
            });
            expect(foundAlert).toBe(true);
          }
        }
      });
    });
  }
});
