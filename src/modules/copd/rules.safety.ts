import type { Rule } from '../../engine/types';
import { copdSafetyInhalerStopRules } from './rules.safety.inhalers_stop';
import { copdSafetyInhalerDeviceRules } from './rules.safety.inhalers_device';
import { copdSafetyCardioRules } from './rules.safety.cardio';
import { copdSafetySystemicRules } from './rules.safety.systemic';

export const copdSafetyRules: Rule[] = [
  ...copdSafetyInhalerStopRules,
  ...copdSafetyInhalerDeviceRules,
  ...copdSafetyCardioRules,
  ...copdSafetySystemicRules,
];
