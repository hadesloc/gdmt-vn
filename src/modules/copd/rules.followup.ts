import type { Rule } from '../../engine/types';
import { copdFollowupAcoRules } from './rules.followup.aco';
import { copdFollowupContinueRules } from './rules.followup.continue';
import { copdFollowupStepupBronchRules } from './rules.followup.stepup_bronch';
import { copdFollowupStepupIcsRules } from './rules.followup.stepup_ics';

export const copdFollowupRules: Rule[] = [
  ...copdFollowupAcoRules,
  ...copdFollowupContinueRules,
  ...copdFollowupStepupBronchRules,
  ...copdFollowupStepupIcsRules,
];
