import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Recommendation } from '../../src/engine/types';
import { getReviewStatusForItem, resolveCitationDisplay } from '../../src/ui/kbLookup';
import { includeReviewedRecommendation } from '../../src/ui/reviewPolicy';
import { EvidenceQuote } from '../../src/ui/EvidenceQuote';
import { drug } from '../../src/kb-types/access';
import { computeContentHash, CONTENT_HASH_VERSION } from '../../src/kb-types/contentHash';
import { effectiveReviewStatus } from '../../src/kb-types/review';

const rec: Recommendation = { id: 'test', module: 'ckd', tier: 'test', action: 'START', drugId: 'telmisartan',
  reviewStatus: 'ai_multi_reviewed', title: 'Test', rationale: '', gates: [], citationIds: [], priority: 1 };
describe('KB-HASH-01 UI status and reviewed-only safety policy', () => {
  it('caller-provided approval cannot override missing or migrated draft evidence', () => {
    expect(getReviewStatusForItem('telmisartan', 'ai_multi_reviewed')).toBe('draft');
    expect(getReviewStatusForItem('missing-item', 'ai_multi_reviewed')).toBe('draft');
    expect(getReviewStatusForItem(undefined, 'ai_multi_reviewed')).toBe('draft');
  });
  it('renders a draft badge for actual migrated data despite explicit approval', () => {
    const resolved = resolveCitationDisplay('not-present', { drugId: 'telmisartan', explicitStatus: 'ai_multi_reviewed' });
    render(<EvidenceQuote {...resolved} />);
    expect(screen.getByTestId('review-badge-draft').textContent).toContain('chưa duyệt');
    expect(screen.queryByTestId('review-badge-ai_multi_reviewed')).toBeNull(); cleanup();
  });
  it('detects a runtime nested data mutation using the same browser-safe fingerprint', () => {
    const entry = drug('telmisartan');
    const state = { itemId: entry.id, hashVersion: CONTENT_HASH_VERSION, contentHash: computeContentHash(entry),
      status: 'ai_multi_reviewed' as const, reports: [] };
    expect(effectiveReviewStatus(state, entry)).toBe('ai_multi_reviewed');
    expect(effectiveReviewStatus(state, { ...entry, hepatic: { note: 'changed after review' } })).toBe('draft');
  });
  it('reviewed-only mode excludes ordinary recommendations with draft evidence', () => {
    expect(includeReviewedRecommendation(rec)).toBe(false);
    expect(includeReviewedRecommendation({ ...rec, drugId: 'missing-item' })).toBe(false);
  });
  it.each(['STOP', 'AVOID', 'HOLD', 'REFER'] as const)('retains %s safety actions regardless of review freshness', (action) => {
    expect(includeReviewedRecommendation({ ...rec, action })).toBe(true);
  });
  it('ignores underscore sample approvals', () => {
    expect(getReviewStatusForItem('hf.sglt2i.target_dose')).toBe('draft');
  });
});
