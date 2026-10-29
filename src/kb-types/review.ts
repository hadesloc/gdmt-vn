import type { ReviewState, ReviewStatus } from './index';
import { computeContentHash, CONTENT_HASH_VERSION } from './contentHash';

/** The version AND the complete current item must match, including nested data. */
export function reviewMatchesContent(review: ReviewState, data: unknown): boolean {
  if (!data || typeof data !== 'object' || !('id' in data) || data.id !== review.itemId ||
      review.hashVersion !== CONTENT_HASH_VERSION) return false;
  try { return review.contentHash === computeContentHash(data); }
  catch { return false; }
}

export function effectiveReviewStatus(review: ReviewState | undefined, data: unknown): ReviewStatus {
  if (!review || !reviewMatchesContent(review, data)) return 'draft';
  return ['draft', 'auto_checked', 'ai_cross_checked', 'ai_multi_reviewed'].includes(review.status)
    ? review.status : 'draft';
}

/** A named item cannot fall through to an unrelated citation approval.
 * Citation-only displays use the weakest status across ALL cited items.
 */
export function resolveReviewStatusForItems(
  reviews: ReadonlyMap<string, ReviewState>, items: ReadonlyMap<string, unknown>,
  itemId?: string, citationIds?: readonly string[],
): ReviewStatus {
  if (itemId) {
    const review = reviews.get(itemId) ?? reviews.get(itemId.toLowerCase());
    return effectiveReviewStatus(review, review ? items.get(review.itemId) : undefined);
  }
  if (!citationIds?.length) return 'draft';
  const ranks: ReviewStatus[] = ['draft', 'auto_checked', 'ai_cross_checked', 'ai_multi_reviewed'];
  return ranks[Math.min(...citationIds.map((id) => ranks.indexOf(effectiveReviewStatus(reviews.get(id), items.get(id)))))];
}

/** No review is performed here. Archive stale evidence and start an empty draft. */
export function migrateReviewState(review: ReviewState, data: unknown, now: string): ReviewState {
  if (!data || typeof data !== 'object' || !('id' in data) || data.id !== review.itemId) {
    throw new Error(`Review item identity mismatch: ${review.itemId}`);
  }
  if (reviewMatchesContent(review, data)) return review;
  const { history = [], ...previous } = review;
  return {
    itemId: review.itemId,
    contentHash: computeContentHash(data),
    hashVersion: CONTENT_HASH_VERSION,
    status: 'draft', reports: [],
    history: [...history, { ...previous, invalidatedAt: now,
      invalidationReason: review.hashVersion === CONTENT_HASH_VERSION ? 'content_changed' : 'hash_version_changed' }],
  };
}
