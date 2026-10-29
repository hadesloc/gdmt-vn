import type { ModuleDefinition } from '../../engine/types';
import { hfRules } from './rules';
import { hfInputs } from './inputs';
import { hfMatrixHFrEF, hfMatrixHFpEF } from './matrices';
import { hfPathway, hfpefPathway } from './pathways';
import { hfPresets } from './presets';

export const hfModule: ModuleDefinition = {
  id: 'hf',
  nameVi: 'Suy tim',
  shortName: 'Suy tim',
  icon: '🫀',
  rules: hfRules,
  inputs: hfInputs,
  matrix: hfMatrixHFrEF,
  matrices: [hfMatrixHFrEF, hfMatrixHFpEF],
  pathway: hfPathway,
  pathways: [hfPathway, hfpefPathway],
  presets: hfPresets,
};

export default hfModule;
