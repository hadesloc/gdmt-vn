/**
 * GDMT-VN Module Tăng huyết áp (htn) - QA-1 & QA-9 Fail-Closed Invariants (Suite 2: 15.000 Ca)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { htnModule } from '../../../src/modules/htn';
import {
  PROFILES,
  defaultSettings,
  generateRandomHtnPatient,
  mulberry32
} from './invariants.helpers';

describe('GDMT-VN Module THA (htn) - Fail-Closed Invariants Suite 2', () => {
  it(
    'Suite 2 (QA-1 & QA-9 Fail-Closed): Xóa ngẫu nhiên các trường bắt buộc trên 15.000 ca, đảm bảo 0 vi phạm khởi trị mù',
    () => {
      const TOTAL_CASES = 15000;
      const rng = mulberry32(20261028);
      let violations = 0;
      const violationLog: string[] = [];

      for (let i = 0; i < TOTAL_CASES; i++) {
        const patient = generateRandomHtnPatient(i, rng);
        const profile = PROFILES[i % PROFILES.length];
        const isEmergencyCondition = Boolean(
          patient.conditions?.aorticDissection ||
            patient.conditions?.acutePulmonaryEdema ||
            patient.conditions?.acuteIschemicStroke ||
            patient.conditions?.acuteIntracerebralHemorrhage ||
            patient.conditions?.severePreeclampsiaEclampsia ||
            patient.conditions?.hypertensiveEncephalopathy ||
            patient.conditions?.malignantHypertension
        );
        const setting = isEmergencyCondition && rng() < 0.5 ? 'inpatient' : 'outpatient';

        const omitSbp = rng() < 0.28;
        const omitDbp = rng() < 0.28;
        const omitK = rng() < 0.28;
        const omitScr = rng() < 0.28;
        const omitHr = rng() < 0.2;
        const omitAge = rng() < 0.2;

        if (omitSbp) patient.sbp = undefined;
        if (omitDbp) patient.dbp = undefined;
        if (omitK) patient.k = undefined;
        if (omitScr) patient.scr = undefined;
        if (omitHr) patient.hr = undefined;
        if (omitAge) patient.age = undefined;

        const plan = evaluate(patient, { ...defaultSettings, setting, profile }, { modules: [htnModule] });

        // 1. Khi thiếu SBP hoặc DBP ở ngoại trú: TUYỆT ĐỐI KHÔNG sinh START Bước 1 hoặc Methyldopa thai kỳ
        if (setting === 'outpatient' && (omitSbp || omitDbp)) {
          const blindStep1Start = plan.recommendations.find(
            (r) =>
              (r.id.startsWith('rec_htn_step1_') || r.id === 'rec_htn_pregnancy_start_methyldopa') &&
              r.action === 'START'
          );
          if (blindStep1Start) {
            violations++;
            violationLog.push(
              `Ca ${i}: Thiếu SBP/DBP nhưng vẫn sinh START (${blindStep1Start.id} -> ${blindStep1Start.drugId})!`
            );
          }
        }

        // 2. Khi thiếu SBP ở nội viện: TUYỆT ĐỐI KHÔNG sinh START thuốc hạ áp tĩnh mạch
        if (setting === 'inpatient' && omitSbp) {
          const blindIvStart = plan.recommendations.find(
            (r) =>
              r.drugId &&
              ['nicardipine', 'esmolol', 'nitroglycerin', 'labetalol', 'magnesium_sulfate'].includes(r.drugId) &&
              r.action === 'START'
          );
          if (blindIvStart) {
            violations++;
            violationLog.push(`Ca ${i}: Nội viện thiếu SBP nhưng vẫn START ${blindIvStart.drugId}!`);
          }
        }

        // 3. Khi thiếu K+ hoặc Scr (không tính được eGFR): TUYỆT ĐỐI KHÔNG sinh START Spironolactone
        if (omitK || (omitScr && omitAge)) {
          const spiroRec = plan.recommendations.find((r) => r.drugId === 'spironolactone' && r.action === 'START');
          if (spiroRec) {
            violations++;
            violationLog.push(`Ca ${i}: Thiếu K+ hoặc eGFR nhưng Spironolactone vẫn được START!`);
          }
        }
        if (omitScr) {
          const spiroRec = plan.recommendations.find((r) => r.drugId === 'spironolactone' && r.action === 'START');
          if (spiroRec) {
            violations++;
            violationLog.push(`Ca ${i}: Thiếu Scr (không tính được eGFR) nhưng Spironolactone vẫn được START!`);
          }
          const indapStep2 = plan.recommendations.find(
            (r) => r.id === 'rec_htn_step2_add_indapamide' && r.action === 'START'
          );
          if (indapStep2) {
            violations++;
            violationLog.push(`Ca ${i}: Thiếu Scr (không tính được eGFR) nhưng vẫn START Indapamide bước 2!`);
          }
        }

        // 4. Khi thiếu HR: TUYỆT ĐỐI KHÔNG START chẹn beta (Bisoprolol ngoại trú / Esmolol bóc tách ĐMC / Labetalol TSG)
        if (omitHr) {
          const blindBbStart = plan.recommendations.find(
            (r) => r.drugId && ['bisoprolol', 'esmolol', 'labetalol'].includes(r.drugId) && r.action === 'START'
          );
          if (blindBbStart) {
            violations++;
            violationLog.push(`Ca ${i}: Thiếu HR nhưng vẫn START chẹn beta ${blindBbStart.drugId}!`);
          }
        }

        // 5. Nếu thiếu K+ trong bối cảnh THA kháng trị ngoại trú (không mang thai, đủ 3 nhóm thuốc nền, SBP >= 140):
        //    Bắt buộc sinh khuyến cáo nhắc nhập Kali máu (missing_input_k)
        const medIds = patient.currentMeds.map((m) => m.drugId);
        const has3CoreClasses =
          (medIds.includes('perindopril') || medIds.includes('losartan')) &&
          medIds.includes('amlodipine') &&
          medIds.includes('indapamide');

        if (
          setting === 'outpatient' &&
          !patient.conditions?.pregnant &&
          has3CoreClasses &&
          omitK &&
          patient.sbp !== undefined &&
          patient.sbp >= 140
        ) {
          const hasMissingK = plan.recommendations.some(
            (r) => r.id === 'missing_input_k' && r.action === 'CONSIDER'
          );
          if (!hasMissingK) {
            violations++;
            violationLog.push(`Ca ${i}: THA kháng trị thiếu K+ nhưng không sinh missing_input_k!`);
          }
        }
      }

      if (violations > 0) {
        console.error(`Phát hiện ${violations} vi phạm fail-closed:\n` + violationLog.slice(0, 15).join('\n'));
      }

      expect(violations).toBe(0);
    },
    60000
  );
});
