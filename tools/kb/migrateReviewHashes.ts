/** V2 migration: preserve raw files and historical evidence; never perform a review.
 * Preview: npx tsx tools/kb/migrateReviewHashes.ts
 * Apply:   npx tsx tools/kb/migrateReviewHashes.ts --apply --backup reports/<unique-dir>
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { ReviewState } from '../../src/kb-types/index';
import { validateReviewState } from '../../src/kb-types/index';
import { migrateReviewState } from '../../src/kb-types/review';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
function jsonFiles(dir: string, samples = false): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (!samples && e.name.startsWith('_')) return [];
    const path = join(dir, e.name);
    return e.isDirectory() ? jsonFiles(path, samples) : e.name.endsWith('.json') ? [path] : [];
  }).sort();
}
export interface ReviewMigrationFile { path: string; before: string; after: string; records: number }

export function planReviewHashMigration(kbDir: string, now: string): ReviewMigrationFile[] {
  const items = new Map<string, unknown>();
  const ambiguous = new Set<string>();
  for (const group of ['drugs', 'thresholds', 'interactions', 'citations']) {
    for (const path of jsonFiles(join(kbDir, group))) {
      if (path.endsWith('index.json')) continue;
      const data = JSON.parse(readFileSync(path, 'utf8'));
      for (const item of Array.isArray(data) ? data : [data]) {
        if (!item?.id) continue;
        if (items.has(item.id)) ambiguous.add(item.id);
        items.set(item.id, item);
      }
    }
  }
  return jsonFiles(join(kbDir, 'review')).map((path) => {
    const before = readFileSync(path, 'utf8');
    const data = JSON.parse(before);
    const records: ReviewState[] = Array.isArray(data) ? data : [data];
    let changed = false;
    const migrated = records.map((review) => {
      const validation = validateReviewState(review);
      if (!validation.valid) throw new Error(`${path}: ${validation.errors.join('; ')}`);
      if (ambiguous.has(review.itemId)) throw new Error(`Duplicate reviewed KB item: ${review.itemId}`);
      const next = migrateReviewState(review, items.get(review.itemId), now);
      changed ||= next !== review;
      return next;
    });
    return { path, before, after: changed ? JSON.stringify(Array.isArray(data) ? migrated : migrated[0], null, 2) + '\n' : before,
      records: records.length };
  });
}

export function applyReviewHashMigration(plan: ReviewMigrationFile[], reviewDir: string, backupDir: string): void {
  const changed = plan.filter((file) => file.before !== file.after);
  // Validate every input before creating backups or modifying any active record.
  for (const file of plan) {
    if (readFileSync(file.path, 'utf8') !== file.before) throw new Error(`Migration input changed: ${file.path}`);
  }
  if (!changed.length) return;
  if (existsSync(backupDir)) throw new Error(`Backup already exists: ${backupDir}`);
  mkdirSync(backupDir, { recursive: true });
  for (const file of changed) {
    const target = join(backupDir, relative(reviewDir, file.path));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.before, { encoding: 'utf8', flag: 'wx' });
  }
  writeFileSync(join(backupDir, 'migration-manifest.json'), JSON.stringify(changed.map((f) => ({
    path: relative(reviewDir, f.path), beforeSha256: sha(f.before), afterSha256: sha(f.after), records: f.records,
  })), null, 2) + '\n');
  for (const file of changed) {
    writeFileSync(`${file.path}.v2-tmp`, file.after, { encoding: 'utf8', flag: 'wx' });
    renameSync(`${file.path}.v2-tmp`, file.path);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const kbDir = resolve('kb');
  const plan = planReviewHashMigration(kbDir, new Date().toISOString());
  const changed = plan.filter((f) => f.before !== f.after);
  console.log(JSON.stringify({ files: plan.length, changedFiles: changed.length,
    changedRecords: changed.reduce((n, f) => n + f.records, 0), statusAfterMigration: 'draft',
    reportsAfterMigration: 'empty; previous evidence retained in history and raw backup' }, null, 2));
  if (process.argv.includes('--apply')) {
    const index = process.argv.indexOf('--backup');
    if (index < 0 || !process.argv[index + 1]) throw new Error('--backup <new-directory> required');
    applyReviewHashMigration(plan, join(kbDir, 'review'), resolve(process.argv[index + 1]));
  }
}
