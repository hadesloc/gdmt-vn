/**
 * GDMT-VN Module Tăng huyết áp (htn) - Tổng hợp Quy tắc Nội viện
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule } from '../../engine/types';
import { htnInpatientTriageRules } from './rules.inpatient.triage';
import { htnInpatientAorticRules } from './rules.inpatient.aortic';
import { htnInpatientAcsRules } from './rules.inpatient.acs';
import { htnInpatientPulmEdemaRules } from './rules.inpatient.pulm_edema';
import { htnInpatientStrokeRules } from './rules.inpatient.stroke';
import { htnInpatientIchRules } from './rules.inpatient.ich';
import { htnInpatientPreeclampsiaRules } from './rules.inpatient.preeclampsia';
import { htnInpatientPreeclampsiaMgso4Rules } from './rules.inpatient.preeclampsia_mgso4';
import { htnInpatientEncephalopathyPeriopRules } from './rules.inpatient.encephalopathy_periop';

export const htnInpatientRules: Rule[] = [
  ...htnInpatientTriageRules,
  ...htnInpatientAorticRules,
  ...htnInpatientAcsRules,
  ...htnInpatientPulmEdemaRules,
  ...htnInpatientStrokeRules,
  ...htnInpatientIchRules,
  ...htnInpatientPreeclampsiaRules,
  ...htnInpatientPreeclampsiaMgso4Rules,
  ...htnInpatientEncephalopathyPeriopRules
];
