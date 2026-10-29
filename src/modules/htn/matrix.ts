/**
 * GDMT-VN Module Tăng huyết áp (htn) - Điểm xuất Ma trận An toàn Thuốc
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { MatrixDefinition } from '../../engine/types';
import { htnComorbidityMatrix } from './matrix.comorbidity';
import { htnRenalMatrix } from './matrix.renal.part2';

export { htnComorbidityMatrix, htnRenalMatrix };
export const htnMatrices: MatrixDefinition[] = [htnComorbidityMatrix, htnRenalMatrix];
