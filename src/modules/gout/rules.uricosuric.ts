/**
 * GDMT-VN Gout Module - Uricosuric Agents Barrel (Probenecid & Benzbromarone)
 * Phân quyền: Agent K
 */

import type { Rule } from '../../engine/types';
import { goutProbenecidRules } from './rules.uricosuric.probenecid';
import { goutBenzbromaroneRules } from './rules.uricosuric.benzbromarone';

export const goutUricosuricRules: Rule[] = [
  ...goutProbenecidRules,
  ...goutBenzbromaroneRules
];
