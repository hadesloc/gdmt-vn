/**
 * GDMT-VN Module Tăng huyết áp (htn) - Entry point
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { ModuleDefinition } from '../../engine/types';
import { registerValidFields } from '../../engine/require';
import { htnInputs } from './inputs';
import { htnOutpatientRules } from './rules.outpatient';
import { htnInpatientRules } from './rules.inpatient';
import { htnComorbidityMatrix, htnRenalMatrix } from './matrix';
import { htnPathway } from './pathway';
import { htnPresets } from './presets';

registerValidFields([
  ...htnInputs.groups.flatMap((g) => g.fields.map((f) => f.id)),
  'preventRiskPct',
  'score2RiskPercent',
  'homeSbp',
  'homeDbp',
  'abpm24hSbp',
  'abpm24hDbp',
  'bilateralRenalArteryStenosis',
  'postpartum',
  'severeAorticStenosis',
  'severe_aortic_stenosis',
  'avBlock2or3',
  'sickSinusSyndrome',
  'pacemaker',
  'postReperfusionEvt',
  'pde5InhibitorUse',
  'pde5_inhibitor_use',
  'myastheniaGravis',
  'myasthenia_gravis',
  'oliguria',
  'breastfeeding',
  'aceiIntolerance',
  'allergyAceiArb',
  'sulfonamideAllergy',
  'soyEggAllergy',
  'childPugh',
  'catecholamineExcess',
  'baselineScr',
  'aorticCoarctation'
]);

export const htnModule: ModuleDefinition = {
  id: 'htn',
  nameVi: 'Tăng huyết áp',
  shortName: 'THA',
  icon: '🫀',
  rules: [...htnOutpatientRules, ...htnInpatientRules],
  inputs: htnInputs,
  matrix: htnComorbidityMatrix,
  matrices: [htnComorbidityMatrix, htnRenalMatrix],
  pathway: htnPathway,
  presets: htnPresets
};

export default htnModule;
