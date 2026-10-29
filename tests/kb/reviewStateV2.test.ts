import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import type { ReviewState } from '../../src/kb-types';
import { validateReviewState } from '../../src/kb-types';
import { computeContentHash, CONTENT_HASH_VERSION } from '../../src/kb-types/contentHash';
import { effectiveReviewStatus, migrateReviewState, resolveReviewStatusForItems } from '../../src/kb-types/review';

const data = { id: 'drug', renal: [{ min: 20, note: 'original' }] };
const timestamp = '2026-10-29T00:00:00.000Z';
const legacy: ReviewState = { itemId: data.id, contentHash: 'a'.repeat(16), status: 'ai_multi_reviewed',
  reports: [{ round: 1, reviewedAt: timestamp, verdict: 'pass', issues: [], role: 'cardiologist' }], lastReviewedAt: timestamp };
const current = (): ReviewState => ({ ...legacy, hashVersion: CONTENT_HASH_VERSION, contentHash: computeContentHash(data) });

describe('KB-HASH-01 review version and history boundary', () => {
  it('retains exact prior evidence but downgrades legacy approvals to an empty current draft', () => {
    const before = structuredClone(legacy);
    const migrated = migrateReviewState(legacy, data, timestamp);
    expect(migrated).toMatchObject({ itemId: data.id, hashVersion: CONTENT_HASH_VERSION, status: 'draft', reports: [], contentHash: computeContentHash(data) });
    expect(migrated.lastReviewedAt).toBeUndefined();
    expect(migrated.history).toEqual([{ ...legacy, invalidatedAt: timestamp, invalidationReason: 'hash_version_changed' }]);
    expect(legacy).toEqual(before);
    expect(validateReviewState(migrated).valid).toBe(true);
    expect(migrateReviewState(migrated, data, timestamp)).toBe(migrated);
  });
  it('archives successive content changes with history retained only once per revision', () => {
    const v2 = migrateReviewState(legacy, data, timestamp);
    const next = migrateReviewState(v2, { ...data, renal: [{ min: 30, note: 'new' }] }, timestamp);
    expect(next.history).toHaveLength(2); expect(next.history?.[1].invalidationReason).toBe('content_changed');
    expect(next.history?.[0]).toEqual(v2.history?.[0]);
    expect(next.history?.[1]).not.toHaveProperty('history');
  });
  it('rejects accidentally attaching one item review to a different item', () => {
    expect(() => migrateReviewState(legacy, { id: 'different' }, timestamp)).toThrow(/identity/);
    expect(effectiveReviewStatus(current(), { id: 'different' })).toBe('draft');
  });
  it.each(['draft', 'auto_checked', 'ai_cross_checked', 'ai_multi_reviewed'] as const)('accepts fresh %s only for the matching version/content', (status) => {
    const state = { ...current(), status };
    expect(effectiveReviewStatus(state, data)).toBe(status);
    expect(effectiveReviewStatus({ ...state, hashVersion: undefined }, data)).toBe('draft');
    expect(effectiveReviewStatus(state, { ...data, renal: [{ min: 30 }] })).toBe('draft');
  });
  it('fails closed for unknown versions, short v2 hashes and invalid history', () => {
    expect(validateReviewState({ ...current(), hashVersion: 'future-v3' }).valid).toBe(false);
    expect(validateReviewState({ ...current(), contentHash: 'a'.repeat(16) }).valid).toBe(false);
    expect(validateReviewState({ ...current(), history: [{ ...legacy, invalidatedAt: timestamp, invalidationReason: 'content_changed', history: [] }] }).valid).toBe(false);
    expect(effectiveReviewStatus(undefined, data)).toBe('draft');
  });
  it('cannot rescue stale or absent item review using a citation approval', () => {
    const citation = { id: 'citation', quote: 'evidence' };
    const reviews = new Map([['drug', current()], ['citation', { ...current(), itemId: 'citation', contentHash: computeContentHash(citation) }]]);
    const items = new Map<string, unknown>([['drug', { ...data, renal: [] }], ['citation', citation]]);
    expect(resolveReviewStatusForItems(reviews, items, 'drug', ['citation'])).toBe('draft');
    expect(resolveReviewStatusForItems(reviews, items, 'missing', ['citation'])).toBe('draft');
    expect(resolveReviewStatusForItems(reviews, items, undefined, ['citation'])).toBe('ai_multi_reviewed');
    expect(resolveReviewStatusForItems(reviews, items, undefined, ['citation', 'missing'])).toBe('draft');
  });
  it('all active records declare the v2 fingerprint format', () => {
    const files = readdirSync('kb/review').filter((name) => name.endsWith('.json') && !name.startsWith('_'));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const state: ReviewState = JSON.parse(readFileSync(`kb/review/${name}`, 'utf8'));
      expect(state.hashVersion, name).toBe(CONTENT_HASH_VERSION);
      expect(validateReviewState(state).valid, name).toBe(true);
    }
  });
});
