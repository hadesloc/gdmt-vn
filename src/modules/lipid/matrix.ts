/**
 * GDMT-VN Lipid Module - Drug Selection & Renal Dosing Matrices Barrel
 * Phân quyền: Agent I3
 */

import type { MatrixDefinition } from '../../engine/types';
import { lipidRiskMatrix, buildLipidRiskMatrix } from './matrix.risk';
import { lipidEgfrMatrix, buildLipidEgfrMatrix } from './matrix.egfr';

export { lipidRiskMatrix, lipidEgfrMatrix, buildLipidRiskMatrix, buildLipidEgfrMatrix };

export const lipidMatrices: MatrixDefinition[] = [lipidRiskMatrix, lipidEgfrMatrix];
