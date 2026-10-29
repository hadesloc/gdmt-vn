import type { Recommendation } from '../engine/types';
import { getReviewStatusForItem } from './kbLookup';

/** Safety actions remain visible even while evidence is draft or stale. */
export function includeReviewedRecommendation(r: Recommendation): boolean {
  if (['STOP', 'AVOID', 'HOLD', 'REFER'].includes(r.action)) return true;
  return getReviewStatusForItem(r.drugId, r.reviewStatus, r.citationIds) === 'ai_multi_reviewed';
}
