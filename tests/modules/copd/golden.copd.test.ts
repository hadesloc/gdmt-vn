/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Suite 3: Kiểm thử toàn bộ Ca chuẩn lâm sàng COPD (copd_01..copd_68)
 * Phân quyền: Agent L
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

vi.mock('../../../src/modules/registry', async () => {
  const copdMod = (await import('../../../src/modules/copd')).default;
  const asthmaMod = (await import('../../../src/modules/asthma')).default;
  const hfMod = (await import('../../../src/modules/hf')).default;
  const map = new Map<string, typeof copdMod>([
    [copdMod.id, copdMod],
    [asthmaMod.id, asthmaMod],
    [hfMod.id, hfMod],
  ]);
  return {
    setDemoEnabled: () => {},
    isDemoEnabled: () => false,
    getAllModules: () => [copdMod, asthmaMod, hfMod],
    getModule: (id: string) => map.get(id),
    getActiveModules: (ids: string[]) => ids.map((id) => map.get(id)).filter(Boolean),
    getOfficialModuleIds: () => ['copd', 'asthma', 'hf'],
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import type { GoldenCase, GoldenCaseExpectItem } from '../../../src/kb-types/goldenCase';
import { validateGoldenCase } from '../../../src/kb-types/goldenCase';

let originalWarn: typeof console.warn;
beforeAll(() => {
  originalWarn = console.warn;
  console.warn = () => {};
});

afterAll(() => {
  console.warn = originalWarn;
});

describe('COPD Golden Cases Verification (copd_01..copd_68)', () => {
  const copdGoldenDir = resolve(__dirname, '../../golden/copd');
  const files = readdirSync(copdGoldenDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  it('có tối thiểu 68 ca chuẩn COPD (bao gồm các ca hồi quy Vòng 1, Vòng 2 và Vòng 3)', () => {
    expect(files.length).toBeGreaterThanOrEqual(68);
  });

  function matchesExpect(
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

  for (const file of files) {
    const fullPath = join(copdGoldenDir, file);
    const tc: GoldenCase = JSON.parse(readFileSync(fullPath, 'utf8'));

    it(`[${tc.id}] ${tc.titleVi}`, () => {
      const val = validateGoldenCase(tc);
      expect(val.errors).toEqual([]);
      expect(val.valid).toBe(true);

      const plan = evaluate(tc.patient, tc.settings);
      for (const item of tc.expect.mustInclude) {
        const found = plan.recommendations.some((r) => matchesExpect(r, item));
        if (!found) {
          const actual = plan.recommendations
            .map((r) => `${r.id} (${r.drugId ?? 'non-drug'}) -> ${r.action}`)
            .join('; ');
          throw new Error(
            `Thiếu kỳ vọng trong ${file}: drugId=${item.drugId}, ruleId=${item.ruleId}, action=${item.action}. Thực tế: [${actual}]`
          );
        }
        expect(found).toBe(true);
      }

      for (const item of tc.expect.mustNotInclude ?? []) {
        const forbidden = plan.recommendations.find((r) => matchesExpect(r, item));
        if (forbidden) {
          throw new Error(
            `Xuất hiện khuyến cáo bị cấm trong ${file}: ${forbidden.id} (${forbidden.drugId}) -> ${forbidden.action}`
          );
        }
        expect(forbidden).toBeUndefined();
      }
    });
  }
});
