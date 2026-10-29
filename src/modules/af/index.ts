import type { ModuleDefinition } from '../../engine/types';
import { afRules } from './rules';
import { afInputs } from './inputs';
import { afMatrixDoacCrCl, afMatrixRateControlEF } from './matrices';
import { afPathway } from './pathways';
import { afPresets } from './presets';

export const afModule: ModuleDefinition = {
  id: 'af',
  nameVi: 'Rung nhĩ',
  shortName: 'Rung nhĩ',
  icon: '⚡',
  rules: afRules,
  inputs: afInputs,
  matrix: afMatrixDoacCrCl,
  matrices: [afMatrixDoacCrCl, afMatrixRateControlEF],
  pathway: afPathway,
  pathways: [afPathway],
  presets: afPresets
};

export default afModule;
