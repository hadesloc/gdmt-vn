import type { Rule } from '../../engine/types';
import { hfrefRasiSafetyRules } from './rules.hfref.rasi_safety';
import { hfrefArniRules } from './rules.hfref.arni';
import { hfrefBbRules } from './rules.hfref.bb';
import { hfrefMraRules } from './rules.hfref.mra';
import { hfrefAmtIvabradineRules } from './rules.hfref_amt.ivabradine';
import { hfrefAmtVericiguatKbinderRules } from './rules.hfref_amt.vericiguat_kbinder';
import { hfrefAmtSafetyAmyloidRules } from './rules.hfref_amt.safety_amyloid';
import { hfrefAmtDigoxinRules } from './rules.hfref_amt.digoxin';
import { hfpefPillarRules } from './rules.hfpef.pillars';
import { hfpefSpecialRules } from './rules.hfpef.special';
import { hfIronRehabRules } from './rules.iron_rehab';
import { hfDeviceRules } from './rules.devices';
import { hfInpatientAcuteRules } from './rules.inpatient.acute';
import { hfInpatientTransitionRules } from './rules.inpatient.transition';

export const hfRules: Rule[] = [
  ...hfrefRasiSafetyRules,
  ...hfrefArniRules,
  ...hfrefBbRules,
  ...hfrefMraRules,
  ...hfrefAmtIvabradineRules,
  ...hfrefAmtVericiguatKbinderRules,
  ...hfrefAmtSafetyAmyloidRules,
  ...hfrefAmtDigoxinRules,
  ...hfpefPillarRules,
  ...hfpefSpecialRules,
  ...hfIronRehabRules,
  ...hfDeviceRules,
  ...hfInpatientAcuteRules,
  ...hfInpatientTransitionRules,
];
