/** 5,000 fail-closed asthma cases with required inputs removed. */
import { describe, it, expect, vi } from 'vitest';
vi.mock('../../../src/modules/registry', async () => {
  const { asthmaModule } = await import('../../../src/modules/asthma/index');
  return {
    setDemoEnabled: () => {},
    isDemoEnabled: () => false,
    getAllModules: () => [asthmaModule],
    getModule: (id: string) => (id === 'asthma' ? asthmaModule : undefined),
    getActiveModules: (ids: string[]) => (ids.includes('asthma') ? [asthmaModule] : [])
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import type { Patient } from '../../../src/engine/types';
import { defaultSettings, generateRandomAsthmaPatient, randInt } from './invariants.fixtures';

describe('GDMT-VN Module Hen (asthma) - Fail-Closed Invariants', () => {
  it('Suite 2 (QA-1 & QA-9 Fail-Closed): 5.000 ca xóa ngẫu nhiên dữ liệu bắt buộc -> 0 hành động sai', () => {
    const TOTAL_CASES = 5000;
    let failClosedViolations = 0;
    const violationLog: string[] = [];

    for (let i = 0; i < TOTAL_CASES; i++) {
      const patient = generateRandomAsthmaPatient(i + 20000);
      patient.age = 35;

      // 2A. Ngoại trú mạn tính (không cơn cấp): Xóa ngẫu nhiên 1–4 câu hỏi GINA
      if (patient.customInputs) {
        patient.customInputs.isAcuteExacerbation = false;
        patient.customInputs.silentChest = false;
        patient.customInputs.accessoryMuscleUse = false;
        patient.customInputs.speechAbility = 'sentences';
        patient.customInputs.mentalStatus = 'alert';
        patient.customInputs.spo2 = 97;
        patient.customInputs.respiratoryRate = 16;
        delete patient.customInputs.paco2;

        const deleteWhich = randInt(1, 4);
        if (deleteWhich === 1 || deleteWhich === 4) delete patient.customInputs.daytimeSymptomsMoreThanTwiceWeek;
        if (deleteWhich === 2 || deleteWhich === 4) delete patient.customInputs.nightWakingDueToAsthma;
        if (deleteWhich === 3 || deleteWhich === 4) delete patient.customInputs.relieverNeededMoreThanTwiceWeek;
        if (deleteWhich >= 3) delete patient.customInputs.activityLimitationDueToAsthma;
      }

      const planOut = evaluate(patient, defaultSettings);

      const stepDownRec = planOut.recommendations.find((r) => r.id === 'rec_asthma_step_down_consider');
      if (stepDownRec) {
        failClosedViolations++;
        violationLog.push(`[Ca #${i}] Thiếu câu hỏi kiểm soát GINA nhưng vẫn sinh khuyến cáo hạ bậc`);
      }

      const isAllMissing =
        patient.customInputs?.daytimeSymptomsMoreThanTwiceWeek === undefined &&
        patient.customInputs?.nightWakingDueToAsthma === undefined &&
        patient.customInputs?.relieverNeededMoreThanTwiceWeek === undefined &&
        patient.customInputs?.activityLimitationDueToAsthma === undefined;

      if (isAllMissing && !planOut.recommendations.some((r) => r.id === 'rec_asthma_mart_overuse_refer')) {
        const missingRec = planOut.recommendations.find(
          (r) => r.action === 'CONSIDER' && r.id === 'missing_input_daytimeSymptomsMoreThanTwiceWeek'
        );
        if (!missingRec) {
          failClosedViolations++;
          violationLog.push(`[Ca #${i}] Xóa sạch 4 câu hỏi nhưng không sinh dòng CONSIDER yêu cầu nhập`);
        }
      }

      // 2B. Nội viện không có đợt cấp (isAcuteExacerbation = false) -> Không kê SABA/OCS đợt cấp
      const acutePatient = generateRandomAsthmaPatient(i + 30000);
      acutePatient.age = 40;
      if (acutePatient.customInputs) {
        delete acutePatient.customInputs.speechAbility;
        delete acutePatient.customInputs.respiratoryRate;
        delete acutePatient.customInputs.spo2;
        delete acutePatient.customInputs.accessoryMuscleUse;
        delete acutePatient.customInputs.silentChest;
        delete acutePatient.customInputs.pefPct;
        delete acutePatient.customInputs.paco2;
        delete acutePatient.customInputs.acuteResponseAfter1h;
        acutePatient.customInputs.mentalStatus = 'alert';
        acutePatient.customInputs.isAcuteExacerbation = false;
      }

      const planIn = evaluate(acutePatient, { ...defaultSettings, setting: 'inpatient' });
      const wrongAcuteStart = planIn.recommendations.find(
        (r) => r.id === 'rec_asthma_acute_mild_moderate_saba' || r.id === 'rec_asthma_acute_mild_moderate_ocs'
      );
      if (wrongAcuteStart) {
        failClosedViolations++;
        violationLog.push(`[Ca #${i}] Bệnh nhân nội trú không có đợt cấp nhưng vẫn sinh cấp cứu Cơn hen nhẹ-TB`);
      }

      // 2C. Xóa tuổi (age = undefined) -> Fail-closed: sinh missing_input_age và không kê đơn người lớn
      if (i < 1000) {
        const noAgePt = generateRandomAsthmaPatient(i + 40000);
        delete (noAgePt as Partial<Patient>).age;
        const planNoAge = evaluate(noAgePt, defaultSettings);
        const missingAge = planNoAge.recommendations.find((r) => r.id === 'missing_input_age');
        const blindStart = planNoAge.recommendations.find(
          (r) =>
            ['budesonide_formoterol', 'beclometasone_formoterol', 'fluticasone_salmeterol', 'fluticasone_propionate'].includes(
              r.drugId ?? ''
            ) && ['START', 'UPTITRATE'].includes(r.action)
        );
        if (!missingAge || blindStart) {
          failClosedViolations++;
          violationLog.push(
            `[Ca #${i}] Thiếu tuổi nhưng không fail-closed (missingAge:${Boolean(missingAge)}, blindStart:${Boolean(blindStart)})`
          );
        }
      }
    }

    if (failClosedViolations > 0) {
      console.error('Vi phạm Fail-Closed Suite 2:', violationLog.slice(0, 10));
    }
    expect(failClosedViolations).toBe(0);
  }, 120_000);
});
