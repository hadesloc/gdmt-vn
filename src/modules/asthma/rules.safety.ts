/**
 * GDMT-VN Module Hen phế quản (Asthma) - Barrel Quy tắc An toàn & Cảnh báo Đỏ
 * Phân quyền: Agent M
 */

import type { Rule } from '../../engine/types';
import { asthmaAgeAndAllergySafetyRules } from './rules.safety.age_allergy';
import { asthmaInhalerSafetyRules } from './rules.safety.inhalers';
import { asthmaDuplicateAndOveruseSafetyRules } from './rules.safety.duplicates';
import { asthmaCardioAndAerdSafetyRules } from './rules.safety.cardio_nsaid';
import { asthmaSystemicSafetyRules } from './rules.safety.systemic';

export const asthmaSafetyRules: Rule[] = [
  ...asthmaAgeAndAllergySafetyRules,
  ...asthmaInhalerSafetyRules,
  ...asthmaDuplicateAndOveruseSafetyRules,
  ...asthmaCardioAndAerdSafetyRules,
  ...asthmaSystemicSafetyRules
];
