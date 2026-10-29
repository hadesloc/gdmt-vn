/**
 * GDMT-VN Module Hen phế quản (Asthma) - Barrel Quy tắc Bậc 5, Track 2 & Kế hoạch Hành động
 * Phân quyền: Agent M
 */

import type { Rule } from '../../engine/types';
import { asthmaStep5Rules } from './rules.track2.step5';
import { asthmaTrack2OutpatientRules } from './rules.track2.outpatient';
import { asthmaSupportAndActionPlanRules } from './rules.track2.support';

export const asthmaTrack2AndSupportRules: Rule[] = [
  ...asthmaStep5Rules,
  ...asthmaTrack2OutpatientRules,
  ...asthmaSupportAndActionPlanRules
];
