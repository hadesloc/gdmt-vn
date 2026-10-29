import type { ModuleDefinition } from '../../engine/types';
import { copdRules } from './rules';
import { copdInputs } from './inputs';
import { copdMatrixTherapy, copdMatrixDevices } from './matrices';
import { copdPathway } from './pathways';
import { copdPresets } from './presets';

export const copdModule: ModuleDefinition = {
  id: 'copd',
  nameVi: 'Bệnh phổi tắc nghẽn mạn tính (COPD)',
  shortName: 'COPD',
  icon: '🫁',
  rules: copdRules,
  inputs: copdInputs,
  matrix: copdMatrixTherapy,
  matrices: [copdMatrixTherapy, copdMatrixDevices],
  pathway: copdPathway,
  pathways: [copdPathway],
  presets: copdPresets,
};

export default copdModule;
