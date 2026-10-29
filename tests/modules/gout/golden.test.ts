/**
 * GDMT-VN Module Gút (gout) - Golden Cases Verification Suite (30 Clinical Scenarios)
 * Phân quyền: Agent K
 *
 * Kiểm chứng toàn bộ 30 ca chuẩn trong `tests/golden/gout/*.json` qua pipeline thực `evaluate()`.
 */

import { describe, it, expect, vi } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { goutModule } from '../../../src/modules/gout/index';

vi.mock('../../../src/modules/registry', () => ({
  setDemoEnabled: () => {},
  isDemoEnabled: () => false,
  getAllModules: () => [goutModule],
  getModule: (id: string) => (id === 'gout' ? goutModule : undefined),
  getActiveModules: (ids: string[]) => (ids.includes('gout') ? [goutModule] : [])
}));

import { evaluate } from '../../../src/engine/evaluate';
import type { GoldenCase, GoldenCaseExpectItem } from '../../../src/kb-types/goldenCase';
import { validateGoldenCase } from '../../../src/kb-types/goldenCase';

const ROOT_DIR = resolve(process.cwd(), 'gdmt-vn');
const GOUT_GOLDEN_DIR = existsSync(join(ROOT_DIR, 'tests', 'golden', 'gout'))
  ? join(ROOT_DIR, 'tests', 'golden', 'gout')
  : resolve(process.cwd(), 'tests', 'golden', 'gout');

function matchesExpectItem(
  rec: { id: string; drugId?: string; action: string; dose?: unknown; title?: string },
  item: GoldenCaseExpectItem
): boolean {
  if (item.drugId && rec.drugId !== item.drugId) return false;
  if (item.ruleId && rec.id !== item.ruleId) return false;
  if (rec.action !== item.action) return false;
  if (item.doseContains) {
    const doseStr = JSON.stringify(rec.dose ?? '') + ' ' + (rec.title ?? '');
    if (!doseStr.toLowerCase().includes(item.doseContains.toLowerCase())) return false;
  }
  return true;
}

describe('GDMT-VN Gout Golden Cases (≥ 40 Clinical Scenarios)', () => {
  const files = existsSync(GOUT_GOLDEN_DIR)
    ? readdirSync(GOUT_GOLDEN_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => join(GOUT_GOLDEN_DIR, f))
    : [];

  it('có ít nhất 40 ca chuẩn trong tests/golden/gout/', () => {
    expect(files.length).toBeGreaterThanOrEqual(40);
  });

  for (const filePath of files) {
    const testCase: GoldenCase = JSON.parse(readFileSync(filePath, 'utf8'));
    const label = `[${testCase.id}] ${testCase.titleVi}`;

    describe(label, () => {
      it('tuân thủ schema GoldenCase', () => {
        const val = validateGoldenCase(testCase);
        if (!val.valid) {
          throw new Error(`Lỗi schema: ${val.errors.join(', ')}`);
        }
        expect(val.valid).toBe(true);
      });

      it('chạy evaluate() và khớp 100% kỳ vọng lâm sàng', () => {
        const plan = evaluate(testCase.patient, testCase.settings, { modules: [goutModule] });
        expect(plan).toBeDefined();
        expect(plan.recommendations.length).toBeGreaterThan(0);

        for (const item of testCase.expect.mustInclude) {
          const found = plan.recommendations.some((rec) => matchesExpectItem(rec, item));
          if (!found) {
            const actual = plan.recommendations.map(
              (r) => `[id=${r.id}, drugId=${r.drugId ?? '-'}, action=${r.action}, dose=${JSON.stringify(r.dose ?? '-')}] ${r.title}`
            );
            throw new Error(
              `Thiếu khuyến cáo kỳ vọng: ${JSON.stringify(item)}\nThực tế:\n  ${actual.join('\n  ')}`
            );
          }
          expect(found).toBe(true);
        }

        if (testCase.expect.mustNotInclude) {
          for (const item of testCase.expect.mustNotInclude) {
            const bad = plan.recommendations.find((rec) => matchesExpectItem(rec, item));
            if (bad) {
              throw new Error(
                `Xuất hiện khuyến cáo bị cấm: ${JSON.stringify(item)} -> id=${bad.id}, drugId=${bad.drugId}, action=${bad.action}, dose=${JSON.stringify(bad.dose)}`
              );
            }
            expect(bad).toBeUndefined();
          }
        }

        if (testCase.expect.alertsInclude) {
          for (const alertExp of testCase.expect.alertsInclude) {
            const foundAlert = plan.alerts.some((a) => {
              const obj = a as unknown as Record<string, unknown>;
              if (alertExp.level && (obj.level ?? a.severity) !== alertExp.level) return false;
              if (alertExp.code && (obj.code ?? a.id) !== alertExp.code) return false;
              if (
                alertExp.messageContains &&
                !a.messageVi.toLowerCase().includes(alertExp.messageContains.toLowerCase())
              ) {
                return false;
              }
              return true;
            });
            if (!foundAlert) {
              throw new Error(
                `Thiếu SafetyAlert kỳ vọng: ${JSON.stringify(alertExp)}\nThực tế: ${JSON.stringify(plan.alerts)}`
              );
            }
            expect(foundAlert).toBe(true);
          }
        }
      });
    });
  }
});
