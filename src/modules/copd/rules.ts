import type { Rule } from '../../engine/types';
import { copdSafetyRules } from './rules.safety';
import { copdInitialRules } from './rules.initial';
import { copdFollowupRules } from './rules.followup';
import { copdEscalationRules } from './rules.escalation';
import { copdInpatientRules } from './rules.inpatient';

export {
  copdSafetyRules,
  copdInitialRules,
  copdFollowupRules,
  copdEscalationRules,
  copdInpatientRules,
};

export const copdRules: Rule[] = [
  ...copdSafetyRules,
  ...copdInitialRules,
  ...copdFollowupRules,
  ...copdEscalationRules,
  ...copdInpatientRules,
];
