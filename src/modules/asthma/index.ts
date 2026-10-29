/**
 * GDMT-VN Module Hen phế quản (Asthma) - Entry Point
 * Phân quyền: Agent M
 *
 * Tự động phát hiện và kích hoạt qua Dynamic Registry (import.meta.glob).
 */

import type { ModuleDefinition } from '../../engine/types';
import { asthmaRules } from './rules';
import { asthmaInputs } from './inputs';
import { asthmaTrackMatrix, icsDoseEquivalenceMatrix } from './matrices';
import { asthmaPathway } from './pathways';
import { asthmaPresets } from './presets';

export const asthmaModule: ModuleDefinition = {
  id: 'asthma',
  nameVi: 'Hen phế quản người lớn & ≥ 12 tuổi',
  shortName: 'Hen',
  icon: '🫁',
  rules: asthmaRules,
  inputs: asthmaInputs,
  matrix: asthmaTrackMatrix,
  matrices: [asthmaTrackMatrix, icsDoseEquivalenceMatrix],
  pathway: asthmaPathway,
  presets: asthmaPresets
};

export default asthmaModule;
