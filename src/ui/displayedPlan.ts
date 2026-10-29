import type { Derived, Patient, Plan, Settings } from '../engine/types';
import { generateClinicalNote } from '../engine/note';
import { includeReviewedRecommendation } from './reviewPolicy';

/** Keep rendered rows, action totals, notes and print in the same filtered view. */
export function buildDisplayedPlan(raw: Plan, normalized: Patient, derived: Derived, settings: Settings): Plan {
  if (!settings.onlyReviewed) return raw;
  const recommendations = raw.recommendations.filter(includeReviewedRecommendation);
  const byAction = { ...raw.summary.byAction };
  for (const action of Object.keys(byAction) as (keyof typeof byAction)[]) byAction[action] = 0;
  for (const row of recommendations) byAction[row.action]++;
  const plan = { ...raw, recommendations, summary: { ...raw.summary, total: recommendations.length, byAction } };
  return { ...plan, noteText: generateClinicalNote(normalized, derived, plan, settings) };
}
