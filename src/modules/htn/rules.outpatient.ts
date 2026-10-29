/**
 * GDMT-VN Module Tăng huyết áp (htn) - Tổng hợp Quy tắc Ngoại trú
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule } from '../../engine/types';
import { htnOutpatientBpEvalRules } from './rules.outpatient.safety.bp_eval';
import { htnOutpatientSafetyGuards1Rules, htnOutpatientTriageRule } from './rules.outpatient.safety.guards1';
import { htnOutpatientSafetyGuards2Rules } from './rules.outpatient.safety.guards2';
import { htnOutpatientSafetyGuards3Rules } from './rules.outpatient.safety.guards3';
import { htnOutpatientPreStep1Rules } from './rules.outpatient.step1_zero';
import { htnOutpatientStep1DualRules } from './rules.outpatient.step1_dual';
import { htnOutpatientStep1PartnerRules } from './rules.outpatient.step1_partner';
import { htnOutpatientStep2Rules } from './rules.outpatient.step2';
import { htnOutpatientStep3Rules } from './rules.outpatient.step3';
import { htnOutpatientStep3AltRules } from './rules.outpatient.step3_alt';
import { htnOutpatientSpecialBbDdiRules } from './rules.outpatient.special.bb_ddi';
import { htnOutpatientSpecialPregnancyStopRules } from './rules.outpatient.special.pregnancy_stops';
import { htnOutpatientSpecialPregnancyInitRules } from './rules.outpatient.special.pregnancy_init';
import { htnOutpatientSpecialScreeningRules } from './rules.outpatient.special.screening';

export const htnOutpatientRules: Rule[] = [
  htnOutpatientTriageRule,
  ...htnOutpatientBpEvalRules,
  ...htnOutpatientSafetyGuards1Rules,
  ...htnOutpatientSafetyGuards2Rules,
  ...htnOutpatientSafetyGuards3Rules,
  ...htnOutpatientPreStep1Rules,
  ...htnOutpatientStep1DualRules,
  ...htnOutpatientStep1PartnerRules,
  ...htnOutpatientStep2Rules,
  ...htnOutpatientStep3Rules,
  ...htnOutpatientStep3AltRules,
  ...htnOutpatientSpecialBbDdiRules,
  ...htnOutpatientSpecialPregnancyStopRules,
  ...htnOutpatientSpecialPregnancyInitRules,
  ...htnOutpatientSpecialScreeningRules
];
