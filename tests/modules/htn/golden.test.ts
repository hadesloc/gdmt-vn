/**
 * GDMT-VN Module Tăng huyết áp (htn) - 37 Golden Cases Suite
 * Phân quyền: Agent H (Tim mạch / THA)
 *
 * Kiểm chứng toàn bộ ≥ 37 ca lâm sàng chuẩn trong `tests/golden/htn/*.json`
 * (bao gồm 35 ca `htn_01..35` và 2 ca migrate từ on-call `icu_hypertensive_urgency_stepdown_1620`, `im_hypertensive_emergency_0135`).
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { evaluate } from '../../../src/engine/evaluate';
import { htnModule } from '../../../src/modules/htn';
import type { GoldenCase, GoldenCaseExpectItem } from '../../../src/kb-types/goldenCase';
import { validateGoldenCase } from '../../../src/kb-types/goldenCase';

const HTN_GOLDEN_DIR = existsSync(resolve(process.cwd(), 'tests', 'golden', 'htn'))
  ? resolve(process.cwd(), 'tests', 'golden', 'htn')
  : resolve(process.cwd(), 'gdmt-vn', 'tests', 'golden', 'htn');

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

describe('GDMT-VN Module THA (htn) - Golden Cases Verification (≥ 52 Cases)', () => {
  const files = existsSync(HTN_GOLDEN_DIR)
    ? readdirSync(HTN_GOLDEN_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];

  it('có tối thiểu 52 ca lâm sàng chuẩn trong tests/golden/htn/', () => {
    expect(files.length).toBeGreaterThanOrEqual(52);
  });

  for (const fileName of files) {
    const fullPath = join(HTN_GOLDEN_DIR, fileName);
    const gc: GoldenCase = JSON.parse(readFileSync(fullPath, 'utf8'));

    it(`[${gc.id}] ${gc.titleVi}`, () => {
      const schemaCheck = validateGoldenCase(gc);
      if (!schemaCheck.valid) {
        throw new Error(`Lỗi schema GoldenCase (${fileName}): ${schemaCheck.errors.join(', ')}`);
      }
      expect(schemaCheck.valid).toBe(true);

      const plan = evaluate(gc.patient, gc.settings, { modules: [htnModule] });

      for (const item of gc.expect.mustInclude) {
        const found = plan.recommendations.some((r) => matchesExpectItem(r, item));
        if (!found) {
          const actual = plan.recommendations.map((r) => `${r.drugId || r.id} -> ${r.action} (${r.title})`);
          throw new Error(
            `Thiếu khuyến cáo kỳ vọng: ${JSON.stringify(item)}\nThực tế:\n  - ${actual.join('\n  - ')}`
          );
        }
        expect(found).toBe(true);
      }

      if (gc.expect.mustNotInclude) {
        for (const item of gc.expect.mustNotInclude) {
          const prohibited = plan.recommendations.find((r) => matchesExpectItem(r, item));
          if (prohibited) {
            throw new Error(
              `Xuất hiện khuyến cáo bị cấm: ${prohibited.drugId || prohibited.id} -> ${prohibited.action}`
            );
          }
          expect(prohibited).toBeUndefined();
        }
      }
    });
  }
});
