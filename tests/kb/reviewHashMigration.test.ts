import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { planReviewHashMigration, applyReviewHashMigration } from '../../tools/kb/migrateReviewHashes';

const created: string[] = [];
const now = '2026-10-29T00:00:00Z';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'gdmt-kb-hash-v2-')); created.push(root);
  const kb = join(root, 'kb');
  for (const group of ['drugs', 'thresholds', 'interactions', 'citations', 'review']) mkdirSync(join(kb, group), { recursive: true });
  const item = { id: 'drug', renal: [{ min: 20 }] };
  const review = { itemId: item.id, contentHash: 'a'.repeat(16), status: 'ai_multi_reviewed',
    reports: [{ round: 1, reviewedAt: now, verdict: 'pass', issues: [], summary: 'Historical only' }] };
  writeFileSync(join(kb, 'drugs', 'drug.json'), JSON.stringify(item));
  const raw = JSON.stringify(review, null, 4) + '\n';
  const reviewPath = join(kb, 'review', 'drug.json'); writeFileSync(reviewPath, raw);
  return { root, kb, item, review, raw, reviewPath, reviewDir: join(kb, 'review'), backup: join(root, 'backup') };
}
afterEach(() => {
  // Only remove test-owned absolute temp directories verified before recursive deletion.
  for (const dir of created.splice(0)) {
    if (!dir.startsWith(join(tmpdir(), 'gdmt-kb-hash-v2-'))) throw new Error('Unexpected temp path');
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('KB-HASH-01 migration filesystem boundary', () => {
  it('previews without writes, preserves exact raw backup, archives evidence, is idempotent', () => {
    const f = fixture(); const plan = planReviewHashMigration(f.kb, now);
    expect(readFileSync(f.reviewPath, 'utf8')).toBe(f.raw); expect(existsSync(f.backup)).toBe(false);
    applyReviewHashMigration(plan, f.reviewDir, f.backup);
    expect(readFileSync(join(f.backup, 'drug.json'), 'utf8')).toBe(f.raw);
    const current = JSON.parse(readFileSync(f.reviewPath, 'utf8'));
    expect(current).toMatchObject({ status: 'draft', reports: [], hashVersion: 'sha256-json-v2' });
    expect(current.history[0]).toMatchObject(f.review);
    const manifest = JSON.parse(readFileSync(join(f.backup, 'migration-manifest.json'), 'utf8'));
    expect(manifest[0].beforeSha256).toBe(createHash('sha256').update(f.raw).digest('hex'));
    const repeat = planReviewHashMigration(f.kb, now);
    expect(repeat.every((file) => file.before === file.after)).toBe(true);
    applyReviewHashMigration(repeat, f.reviewDir, f.backup);
    expect(JSON.parse(readFileSync(f.reviewPath, 'utf8')).history).toHaveLength(1);
  });
  it('refuses changed inputs before making any backup or applying stale plans', () => {
    const f = fixture(); const plan = planReviewHashMigration(f.kb, now);
    writeFileSync(f.reviewPath, f.raw + ' ');
    expect(() => applyReviewHashMigration(plan, f.reviewDir, f.backup)).toThrow(/input changed/);
    expect(existsSync(f.backup)).toBe(false); expect(readFileSync(f.reviewPath, 'utf8')).toBe(f.raw + ' ');
  });
  it('refuses to overwrite an existing backup', () => {
    const f = fixture(); mkdirSync(f.backup);
    expect(() => applyReviewHashMigration(planReviewHashMigration(f.kb, now), f.reviewDir, f.backup)).toThrow(/already exists/);
    expect(readFileSync(f.reviewPath, 'utf8')).toBe(f.raw);
  });
  it('rejects missing or ambiguous reviewed items before any write', () => {
    const f = fixture();
    writeFileSync(join(f.kb, 'drugs', 'duplicate.json'), JSON.stringify(f.item));
    expect(() => planReviewHashMigration(f.kb, now)).toThrow(/Duplicate reviewed/);
    expect(readFileSync(f.reviewPath, 'utf8')).toBe(f.raw);
  });
  it('ignores underscore samples; supports array files and citation review records', () => {
    const f = fixture();
    writeFileSync(join(f.reviewDir, '_sample.json'), '{"not":"a valid active review"}');
    const citation = { id: 'cite', quote: 'source text' };
    writeFileSync(join(f.kb, 'citations', 'citations.json'), JSON.stringify([citation]));
    writeFileSync(join(f.reviewDir, 'cite.json'), JSON.stringify([{ ...f.review, itemId: citation.id }]));
    const plan = planReviewHashMigration(f.kb, now); expect(plan).toHaveLength(2);
    applyReviewHashMigration(plan, f.reviewDir, f.backup);
    const reviews = JSON.parse(readFileSync(join(f.reviewDir, 'cite.json'), 'utf8'));
    expect(Array.isArray(reviews)).toBe(true); expect(reviews[0].status).toBe('draft');
    expect(readFileSync(join(f.reviewDir, '_sample.json'), 'utf8')).toBe('{"not":"a valid active review"}');
  });
  it('the current real corpus requires no further hash migration', () => {
    expect(planReviewHashMigration(join(process.cwd(), 'kb'), now).every((file) => file.before === file.after)).toBe(true);
  });
});
