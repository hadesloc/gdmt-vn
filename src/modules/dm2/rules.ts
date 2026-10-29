/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Tổng hợp Tập luật Lâm sàng Đa Tầng
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { dm2CrisisRules } from './rules.crisis';
import { dm2CrisisHypoAndIcuRules } from './rules.crisis.hypo_icu';
import { dm2DkaRules } from './rules.dka';
import { dm2SafetyContraRules } from './rules.safety.contra';
import { dm2SafetyLactationAndFootRules } from './rules.safety.lactation_foot';
import { dm2SafetyDupRules } from './rules.safety.dup_hepatic';
import { dm2SafetyHepaticAndHfRules } from './rules.safety.hepatic_hf';
import { dm2SafetyRenalRules } from './rules.safety.renal';
import { dm2SafetyRenalDpp4Rules } from './rules.safety.renal_dpp4';
import { dm2DeintensifyRules } from './rules.safety.deintensify';
import { dm2SuCoRxAdjustRules } from './rules.safety.su_co_rx';
import { dm2InpatientOralAndGlp1HoldRules } from './rules.inpatient.oral_glp1_hold';
import { dm2PeriopOutpatientRules } from './rules.periop';
import { dm2SteroidRules } from './rules.steroid';
import { dm2InpatientHomeInsulinRules } from './rules.inpatient.home_insulin';
import { dm2InpatientRules } from './rules.inpatient';
import { dm2InpatientPrandialRules } from './rules.inpatient.prandial';
import { dm2CardiorenalSglt2Rules } from './rules.cardiorenal.sglt2';
import { dm2CardiorenalGlp1Rules } from './rules.cardiorenal.glp1';
import { dm2Hba1cTargetRules } from './rules.hba1c_target';
import { dm2GlycemicRules } from './rules.glycemic';
import { dm2StepUpRules } from './rules.stepup';
import { dm2InsulinInitRules } from './rules.insulin.init';
import { dm2InsulinTitrateRules } from './rules.insulin.titrate';
import { dm2CvRiskAndScreeningRules } from './rules.cvrisk';
import { dm2StatinAndAspirinRules } from './rules.cvrisk.statin_aspirin';

export const dm2Rules: Rule[] = [
  ...dm2CrisisRules,
  ...dm2CrisisHypoAndIcuRules,
  ...dm2DkaRules,
  ...dm2SafetyContraRules,
  ...dm2SafetyLactationAndFootRules,
  ...dm2SafetyDupRules,
  ...dm2SafetyHepaticAndHfRules,
  ...dm2SafetyRenalRules,
  ...dm2SafetyRenalDpp4Rules,
  ...dm2DeintensifyRules,
  ...dm2SuCoRxAdjustRules,
  ...dm2InpatientOralAndGlp1HoldRules,
  ...dm2PeriopOutpatientRules,
  ...dm2SteroidRules,
  ...dm2InpatientHomeInsulinRules,
  ...dm2InpatientRules,
  ...dm2InpatientPrandialRules,
  ...dm2CardiorenalSglt2Rules,
  ...dm2CardiorenalGlp1Rules,
  ...dm2Hba1cTargetRules,
  ...dm2GlycemicRules,
  ...dm2StepUpRules,
  ...dm2InsulinInitRules,
  ...dm2InsulinTitrateRules,
  ...dm2CvRiskAndScreeningRules,
  ...dm2StatinAndAspirinRules
];
