import type { ModuleDefinition } from '../../engine/types';
import { goutInputs } from './inputs';
import { goutRules } from './rules';
import { goutMatrix } from './matrix';
import { goutPathway } from './pathway';
import { goutPresets } from './presets';

export const goutModule: ModuleDefinition = {
  id: 'gout',
  nameVi: 'Bệnh Gút & Tăng Acid Uric Máu',
  shortName: 'Gút',
  icon: '🦶',
  rules: goutRules,
  inputs: goutInputs,
  matrix: goutMatrix,
  pathway: goutPathway,
  presets: goutPresets
};

export default goutModule;
