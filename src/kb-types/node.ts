/**
 * GDMT-VN Node.js-only KB Utilities
 * Phân quyền: Agent C
 * 
 * TỆP NÀY CHỈ DÙNG CHO TOOLS VÀ TESTS TRONG MÔI TRƯỜNG NODE.JS.
 * TUYỆT ĐỐI KHÔNG IMPORT VÀO CLIENT BROWSER / UI / MODULES ĐỂ TRÁNH BUNDLE NODE MODULES!
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Threshold, DrugEntry, InteractionRule } from './index';

/**
 * Tính sha256 JSON v2 chuẩn hóa sâu (64 ký tự), cùng implementation với browser.
 * Tự động loại bỏ các trường metadata review (status, contentHash, reports...)
 */
export { computeContentHash, CONTENT_HASH_VERSION } from './contentHash';

/**
 * Nạp toàn bộ Thresholds, Drugs và Interactions trực tiếp từ đĩa bằng fs (dành cho CLI tools không qua Vite)
 */
export function loadKbDataFromFs(baseDir?: string): {
  thresholds: Map<string, Threshold>;
  drugs: Map<string, DrugEntry>;
  interactions: Map<string, InteractionRule>;
} {
  const root = baseDir ?? resolve(process.cwd(), 'gdmt-vn');
  const kbDir = existsSync(join(root, 'kb')) ? join(root, 'kb') : resolve(process.cwd(), 'kb');

  const thresholds = new Map<string, Threshold>();
  const drugs = new Map<string, DrugEntry>();
  const interactions = new Map<string, InteractionRule>();

  const readRecursive = <T>(dir: string, skipIndex = false): T[] => {
    const items: T[] = [];
    if (!existsSync(dir)) return items;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        items.push(...readRecursive<T>(full, skipIndex));
      } else if (entry.name.endsWith('.json')) {
        if (skipIndex && entry.name.toLowerCase() === 'index.json') continue;
        try {
          const raw = readFileSync(full, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) items.push(...parsed);
          else if (parsed && typeof parsed === 'object') items.push(parsed);
        } catch {
          /* bỏ qua file lỗi */
        }
      }
    }
    return items;
  };

  const tList = readRecursive<Threshold>(join(kbDir, 'thresholds'));
  for (const t of tList) {
    if (t && t.id) thresholds.set(t.id, t);
  }

  const dList = readRecursive<DrugEntry>(join(kbDir, 'drugs'));
  for (const d of dList) {
    if (d && d.id) drugs.set(d.id, d);
  }

  const ixList = readRecursive<InteractionRule>(join(kbDir, 'interactions'), true);
  for (const ix of ixList) {
    if (ix && ix.id) interactions.set(ix.id, ix);
  }

  return { thresholds, drugs, interactions };
}
