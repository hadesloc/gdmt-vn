/**
 * GDMT-VN CKD Module - Aggregated Rule Registry (< 20 KB Modular Architecture)
 * Phân quyền: Agent E (Round 4 Remediation & Modularization)
 */

import type { Rule } from '../../engine/types';
import { ckdOutpatientSafetyRules } from './rules.outpatient.safety';
import { ckdOutpatientSafetyExtraRules } from './rules.outpatient.safety_extra';
import { ckdOutpatientSglt2iRules } from './rules.outpatient.sglt2i';
import { ckdOutpatientSglt2iFdcBridgeRules } from './rules.outpatient.sglt2i_fdc_bridge';
import { ckdOutpatientRasiRules } from './rules.outpatient.rasi';
import { ckdOutpatientRasiTitrationRules } from './rules.outpatient.rasi_titration';
import { ckdOutpatientRasiSafetyRules } from './rules.outpatient.rasi_safety';
import { ckdOutpatientFinerenoneRules } from './rules.outpatient.finerenone';
import { ckdOutpatientFinerenoneTitrationRules } from './rules.outpatient.finerenone_titration';
import { ckdOutpatientFinerenoneSafetyRules } from './rules.outpatient.finerenone_safety';
import { ckdOutpatientGlp1raRules } from './rules.outpatient.glp1ra';
import { ckdGlp1ReviewRules } from './rules.outpatient.glp1ra_review';
import { ckdOutpatientStatinRules } from './rules.outpatient.statin';
import { ckdOutpatientBpRules } from './rules.outpatient.bp';
import { ckdOutpatientAcidosisRules } from './rules.outpatient.acidosis';
import { ckdOutpatientKbinderRules } from './rules.outpatient.kbinders';
import { ckdOutpatientNsaidSickdayRules } from './rules.outpatient.nsaid_sickday';
import { ckdOutpatientReferralDiagnosticsRules } from './rules.outpatient.referral_diagnostics';
import { ckdInpatientAkiRules } from './rules.inpatient.aki';
import { ckdInpatientHyperkalemiaRules } from './rules.inpatient.hyperkalemia';
import { ckdInpatientHyperkalemiaModerateRules } from './rules.inpatient.hyperkalemia_moderate';
import { ckdInpatientAcidosisRules } from './rules.inpatient.acidosis';
import { ckdInpatientRrtContrastRules } from './rules.inpatient.rrt_contrast';

export const ckdOutpatientRules: Rule[] = [
  ...ckdOutpatientSafetyRules,
  ...ckdOutpatientSafetyExtraRules,
  ...ckdOutpatientSglt2iRules,
  ...ckdOutpatientSglt2iFdcBridgeRules,
  ...ckdOutpatientRasiRules,
  ...ckdOutpatientRasiSafetyRules,
  ...ckdOutpatientRasiTitrationRules,
  ...ckdOutpatientFinerenoneRules,
  ...ckdOutpatientFinerenoneTitrationRules,
  ...ckdOutpatientFinerenoneSafetyRules,
  ...ckdOutpatientGlp1raRules,
  ...ckdGlp1ReviewRules,
  ...ckdOutpatientStatinRules,
  ...ckdOutpatientBpRules,
  ...ckdOutpatientAcidosisRules,
  ...ckdOutpatientKbinderRules,
  ...ckdOutpatientNsaidSickdayRules,
  ...ckdOutpatientReferralDiagnosticsRules,
];

export const ckdInpatientRules: Rule[] = [
  ...ckdInpatientAkiRules,
  ...ckdInpatientHyperkalemiaRules,
  ...ckdInpatientHyperkalemiaModerateRules,
  ...ckdInpatientAcidosisRules,
  ...ckdInpatientRrtContrastRules,
];

export const ckdRules: Rule[] = [...ckdOutpatientRules, ...ckdInpatientRules];
