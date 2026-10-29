/**
 * GDMT-VN Module Hen phế quản (Asthma) - Barrel Quy tắc Cấp cứu Cơn hen & Kế hoạch Ra viện
 * Phân quyền: Agent M
 */

import { asthmaMagnesiumRules } from './rules.acute.magnesium';
import type { Rule } from '../../engine/types';
import { asthmaAcuteOutpatientRules } from './rules.acute.outpatient';
import { asthmaAcuteInpatientRules } from './rules.acute.inpatient';
import { asthmaAcuteDischargeAndMildRules } from './rules.acute.discharge';

export const asthmaAcuteRules: Rule[] = [
  ...asthmaAcuteOutpatientRules,
  ...asthmaAcuteInpatientRules,
  ...asthmaMagnesiumRules,
  ...asthmaAcuteDischargeAndMildRules
];
