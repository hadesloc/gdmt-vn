import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReviewState } from '../../src/kb-types';
import { computeContentHash, CONTENT_HASH_VERSION } from '../../src/kb-types/contentHash';
vi.mock('../../tools/kb/aiClient', () => ({
  AI_MODEL: 'mock-only-no-provider',
  chat: vi.fn(async () => ({ ok: true, content: JSON.stringify({ verdict: 'pass', summary: 'Fixture', issues: [] }) })),
  extractJson: (content: string) => JSON.parse(content),
}));
import { chat } from '../../tools/kb/aiClient';
import { runReviewForKbItem } from '../../tools/kb/aiReview';
const item = { id: 'drug', hepatic: { note: 'current evidence' } };
const roles = ['guideline_checker', 'clinical_pharmacist', 'adversarial_reviewer'] as const;
const old: ReviewState = { itemId: item.id, contentHash: 'a'.repeat(16), status: 'ai_multi_reviewed', reports:
  [...roles, 'cardiologist'].map((role) => ({ role, round: 1, reviewedAt: '2026-10-28', verdict: 'pass', issues: [] })) };
beforeEach(() => vi.clearAllMocks());

describe('KB-HASH-01 review aggregation (network mocked)', () => {
  it('archives legacy rounds; one fresh role cannot inherit prior multi-review approval', async () => {
    const next = await runReviewForKbItem(item.id, item, ['guideline_checker'], { currentReview: old, round: 2 });
    expect(next.hashVersion).toBe(CONTENT_HASH_VERSION); expect(next.reports).toHaveLength(1);
    expect(next.status).toBe('auto_checked'); expect(next.history?.[0].reports).toEqual(old.reports);
    expect(chat).toHaveBeenCalledTimes(1);
  });
  it('archives stale v2 rounds instead of combining them with fresh ones', async () => {
    const current = { ...old, hashVersion: CONTENT_HASH_VERSION, contentHash: computeContentHash({ ...item, hepatic: { note: 'old evidence' } }) };
    const next = await runReviewForKbItem(item.id, item, ['guideline_checker'], { currentReview: current, round: 2 });
    expect(next.status).toBe('auto_checked'); expect(next.reports).toHaveLength(1);
    expect(next.history?.[0].invalidationReason).toBe('content_changed');
  });
  it('can retain rounds for the exact current content/version', async () => {
    const current = { ...old, hashVersion: CONTENT_HASH_VERSION, contentHash: computeContentHash(item) };
    const next = await runReviewForKbItem(item.id, item, ['guideline_checker'], { currentReview: current, round: 2 });
    expect(next.reports).toHaveLength(5); expect(next.history).toBeUndefined(); expect(next.status).toBe('ai_multi_reviewed');
  });
  it('dry-run never calls a provider or turns synthetic pass reports into approval evidence', async () => {
    const next = await runReviewForKbItem(item.id, item, [...roles, 'cardiologist'], { dryRun: true, currentReview: old });
    expect(chat).not.toHaveBeenCalled(); expect(next.status).toBe('draft'); expect(next.reports).toEqual([]);
    expect(next.history?.[0].reports).toEqual(old.reports);
  });
  it('an empty role set with no evidence stays draft', async () => {
    const next = await runReviewForKbItem(item.id, item, []);
    expect(next.status).toBe('draft'); expect(next.reports).toEqual([]);
  });
});
