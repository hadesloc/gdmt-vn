/**
 * GDMT-VN Module: Bệnh Thận Mạn (CKD)
 * Phân quyền: Agent E (Chuyên gia Thận học & Kỹ sư Hệ thống)
 *
 * Tiêu chuẩn:
 * - Quốc tế: KDIGO 2024 CKD, KDIGO 2021 BP in CKD, ESC 2026 CVD-CKD, ADA 2026 SOC 11, UKKA 2022 Hyperkalaemia, KDIGO 2012 AKI
 * - Việt Nam: Bộ Y tế QĐ 2388/QĐ-BYT 2024 (Bệnh thận mạn & một số bệnh lý thận)
 */

import type { ModuleDefinition } from '../../engine/types';
import { ckdInputs } from './inputs';
import { ckdRules } from './rules';
import { ckdMatrix } from './matrix';
import { ckdPathway } from './pathway';
import { ckdPresets } from './presets';

export const ckdModule: ModuleDefinition = {
  id: 'ckd',
  nameVi: 'Bệnh thận mạn (CKD)',
  shortName: 'CKD',
  icon: '🫘',
  rules: ckdRules,
  inputs: ckdInputs,
  matrix: ckdMatrix,
  pathway: ckdPathway,
  presets: ckdPresets,
};

export default ckdModule;
