import type { Rule } from '../../engine/types';
import { copdEscalationOralRules } from './rules.escalation.oral';
import { copdEscalationBiologicRules } from './rules.escalation.biologics';
import { copdNonpharmRules } from './rules.nonpharm';

export const copdEscalationRules: Rule[] = [
  ...copdEscalationOralRules,
  ...copdEscalationBiologicRules,
  ...copdNonpharmRules,
];
