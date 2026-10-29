/**
 * GDMT-VN Lipid Module Entry Point (Rối loạn Lipid máu)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { ModuleDefinition } from '../../engine/types';
import { registerValidFields } from '../../engine/require';
import { lipidInputs } from './inputs';
import { lipidRules } from './rules';
import { lipidRiskMatrix, lipidMatrices } from './matrix';
import { lipidPathway } from './pathway';
import { lipidPresets } from './presets';

registerValidFields([
  ...lipidInputs.groups.flatMap((g) => g.fields.map((f) => f.id)),
  'lpaNmol',
  'lpa_nmol',
  'polyvascular',
  'polyvascularDisease',
  'hiv',
  'historyPancreatitis',
  'acutePancreatitis',
  'gallbladderDisease',
  'cholelithiasis',
  'biliaryCirrhosis',
  'biliaryObstruction',
  'tendonRuptureHistory',
  'breastfeeding',
  'lactation',
  'planningPregnancy',
  'pregnancyPlanned',
  'untreatedHypothyroidism',
  'hypothyroidism_untreated',
  'myastheniaGravis',
  'myasthenia_gravis',
  'ocular_myasthenia',
  'kidneyTransplant',
  'kidney_transplant',
  't1dm',
  'type1Diabetes',
  'asian',
  'childPugh',
  'childPughClass',
  'cacScore',
  'cac',
  'tsh',
  'preventAscvd10Yr',
  'dmDurationYears',
  'dlcnScore',
  'baselineLdl',
  'nonHdl',
  'apob',
  'lpa',
  'altUlnTimes',
  'ckUlnTimes',
  'uacr'
]);

export const lipidModule: ModuleDefinition = {
  id: 'lipid',
  nameVi: 'Rối loạn Lipid máu',
  shortName: 'Lipid',
  icon: '🩸',
  inputs: lipidInputs,
  rules: lipidRules,
  matrix: lipidRiskMatrix,
  matrices: lipidMatrices,
  pathway: lipidPathway,
  presets: lipidPresets
};

export default lipidModule;
