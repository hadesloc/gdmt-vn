import type { Rule } from '../../engine/types';
import { copdInpatientBronchO2Rules } from './rules.inpatient.bronch_o2';
import { copdInpatientMedsRules } from './rules.inpatient.meds';
import { copdInpatientVentIcuRules } from './rules.inpatient.vent_icu';
import { copdInpatientVteDischargeRules } from './rules.inpatient.vte_discharge';

export const copdInpatientRules: Rule[] = [
  ...copdInpatientBronchO2Rules,
  ...copdInpatientMedsRules,
  ...copdInpatientVentIcuRules,
  ...copdInpatientVteDischargeRules,
];
