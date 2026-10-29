/**
 * GDMT-VN Lipid Module - Combined Rules Barrel
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { lipidPregnancySafetyRules } from './rules.safety.pregnancy';
import { lipidOrganSafetyRules } from './rules.safety.organ';
import { lipidMuscleSafetyRules } from './rules.safety.muscle';
import { lipidRenalSafetyRules } from './rules.safety.renal';
import { lipidRenalNonStatinSafetyRules } from './rules.safety.renal.nonstatin';
import { lipidReconcileSafetyRules } from './rules.safety.reconcile';
import { lipidOatpDdiRules } from './rules.ddi.oatp';
import { lipidCypDdiRules } from './rules.ddi.cyp';
import { lipidCvDdiRules } from './rules.ddi.cv';
import { lipidOtherDdiRules } from './rules.ddi.other';
import { lipidStatinInitRules } from './rules.statin.init';
import { lipidStatinPrimaryRules } from './rules.statin.primary';
import { lipidStatinSpecialRules } from './rules.statin.special';
import { lipidStatinIntensifyRules } from './rules.statin.intensify';
import { lipidEscalationRules } from './rules.escalation';
import { lipidStep3Rules } from './rules.step3';
import { lipidStep4Rules } from './rules.step4';
import { lipidIntoleranceAndSecondaryRules } from './rules.intolerance';
import { lipidMaintainRules } from './rules.maintain';
import { lipidTgRules } from './rules.tg';
import { lipidHtgCrisisRules } from './rules.htg.crisis';
import { lipidMonitoringRules } from './rules.monitoring';
import { lipidInpatientAcsRules } from './rules.inpatient.acs';
import { lipidInpatientAcsIntensifyRules } from './rules.inpatient.acs.intensify';
import { lipidInpatientPriorNonStatinRules } from './rules.inpatient.prior';
import { lipidInpatientOtherRules } from './rules.inpatient.other';

export const lipidRules: Rule[] = [
  ...lipidPregnancySafetyRules,
  ...lipidOrganSafetyRules,
  ...lipidMuscleSafetyRules,
  ...lipidRenalSafetyRules,
  ...lipidRenalNonStatinSafetyRules,
  ...lipidReconcileSafetyRules,
  ...lipidOatpDdiRules,
  ...lipidCypDdiRules,
  ...lipidCvDdiRules,
  ...lipidOtherDdiRules,
  ...lipidStatinInitRules,
  ...lipidStatinPrimaryRules,
  ...lipidStatinSpecialRules,
  ...lipidStatinIntensifyRules,
  ...lipidEscalationRules,
  ...lipidStep3Rules,
  ...lipidStep4Rules,
  ...lipidIntoleranceAndSecondaryRules,
  ...lipidMaintainRules,
  ...lipidTgRules,
  ...lipidHtgCrisisRules,
  ...lipidMonitoringRules,
  ...lipidInpatientAcsRules,
  ...lipidInpatientAcsIntensifyRules,
  ...lipidInpatientPriorNonStatinRules,
  ...lipidInpatientOtherRules
];
