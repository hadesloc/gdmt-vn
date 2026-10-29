/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Entry Point
 * Phân quyền: Agent F3
 * Tuân thủ nghiêm ngặt MODULE_CONTRACT.md và schema ModuleDefinition
 */

import type { ModuleDefinition } from '../../engine/types';
import { dm2Inputs } from './inputs';
import { dm2Rules } from './rules';
import { dm2MatrixEgfr, dm2MatrixComorbidities } from './matrix';
import { dm2Pathway } from './pathway';
import { dm2Presets } from './presets';

export const dm2Module: ModuleDefinition = {
  id: 'dm2',
  nameVi: 'Đái tháo đường típ 2',
  shortName: 'ĐTĐ2',
  icon: '🩸',
  rules: dm2Rules,
  inputs: dm2Inputs,
  matrix: dm2MatrixEgfr,
  matrices: [dm2MatrixEgfr, dm2MatrixComorbidities],
  pathway: dm2Pathway,
  presets: dm2Presets
};

export default dm2Module;
