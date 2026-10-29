/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Suite 2: QA-1 & QA-9 Fail-Closed trên 10.000 ca xóa ngẫu nhiên 1–5 trường lâm sàng
 * Phân quyền: Agent L
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../../src/modules/registry', async () => {
  const copdMod = (await import('../../../src/modules/copd')).default;
  const asthmaMod = (await import('../../../src/modules/asthma')).default;
  const map = new Map<string, typeof copdMod>([
    [copdMod.id, copdMod],
    [asthmaMod.id, asthmaMod],
  ]);
  return {
    setDemoEnabled: () => {},
    isDemoEnabled: () => false,
    getAllModules: () => [copdMod, asthmaMod],
    getModule: (id: string) => map.get(id),
    getActiveModules: (ids: string[]) => ids.map((id) => map.get(id)).filter(Boolean),
    getOfficialModuleIds: () => ['copd', 'asthma'],
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import {
  createPrng,
  randInt,
  pick,
  INHALER_MAP,
  generateRandomCopdPatient,
} from './invariants.helpers';

let originalWarn: typeof console.warn;
beforeAll(() => {
  originalWarn = console.warn;
  console.warn = () => {};
});

afterAll(() => {
  console.warn = originalWarn;
});

describe('Safety Invariants: Module COPD Suite 2 (10.000 ca Fail-Closed QA-1 & QA-9)', () => {
  it('Suite 2 (QA-1 & QA-9 Fail-Closed): Xóa ngẫu nhiên 1–5 trường lâm sàng trên 10.000 ca tất định và đảm bảo fail-closed tuyệt đối', () => {
    const TOTAL_CASES = 10000;
    const rng = createPrng(99887766);
    let failClosedViolations = 0;
    const log: string[] = [];

    const recordViolation = (msg: string) => {
      failClosedViolations++;
      if (log.length < 20) log.push(msg);
    };

    const allClinicalFields = [
      'fev1FvcRatio',
      'fev1PredPct',
      'mmrc',
      'cat',
      'moderateExacerbations',
      'hospitalizations',
      'bloodEos',
      'smokingStatus',
      'chronicBronchitis',
      'priorPneumonia',
      'abgPh',
      'abgPaco2',
      'restingSpo2',
      'pao2',
    ];

    for (let i = 0; i < TOTAL_CASES; i++) {
      const { patient, settings } = generateRandomCopdPatient(rng, i);
      patient.selectedModules = ['copd'];
      patient.conditions.asthma = false;

      const numToDrop = randInt(rng, 1, 5);
      for (let d = 0; d < numToDrop; d++) {
        const f = pick(rng, allClinicalFields);
        delete (patient.customInputs as Record<string, unknown>)[f];
      }

      const plan = evaluate(patient, settings);
      const recs = plan.recommendations.filter((r) => r.module === 'copd');

      const fev1FvcMissing = patient.customInputs?.fev1FvcRatio === undefined;
      const fev1PctMissing = patient.customInputs?.fev1PredPct === undefined;
      const mmrcMissing = patient.customInputs?.mmrc === undefined;
      const catMissing = patient.customInputs?.cat === undefined;
      const modMissing = patient.customInputs?.moderateExacerbations === undefined;
      const hospMissing = patient.customInputs?.hospitalizations === undefined;
      const eosMissing = patient.customInputs?.bloodEos === undefined;
      const smokeMissing = patient.customInputs?.smokingStatus === undefined;
      const phMissing = patient.customInputs?.abgPh === undefined;
      const paco2Missing = patient.customInputs?.abgPaco2 === undefined;
      const hasAsthma = Boolean(patient.conditions?.priorAsthma);
      const phVal = patient.customInputs?.abgPh as number | undefined;
      const paco2Val = patient.customInputs?.abgPaco2 as number | undefined;
      const spo2Val = patient.customInputs?.restingSpo2 as number | undefined;
      const isEffectivelyAcute =
        Boolean(patient.customInputs?.acuteExacerbation) ||
        Boolean(patient.customInputs?.alteredMentalStatus) ||
        Boolean(patient.customInputs?.accessoryMuscleUse) ||
        (phVal !== undefined && paco2Val !== undefined && phVal <= 7.35 && paco2Val > 45) ||
        (spo2Val !== undefined && spo2Val < 90);

      // 1. Thiếu FEV1/FVC hoặc FEV1% -> Cấm toàn bộ START/UPTITRATE/SWITCH thuốc duy trì COPD, STOP ICS đơn trị, LTOT và Home NIV
      if (fev1FvcMissing || fev1PctMissing) {
        const leakedRx = recs.find(
          (r) =>
            ((r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'SWITCH') &&
              r.drugId &&
              (INHALER_MAP[r.drugId] !== undefined || r.drugId === 'roflumilast')) ||
            r.id === 'rec_copd_stop_ics_monotherapy' ||
            r.id === 'rec_copd_ltot' ||
            r.id === 'rec_copd_home_niv'
        );
        if (leakedRx) {
          recordViolation(
            `Ca #${i}: Thiếu CNHH nhưng vẫn sinh ${leakedRx.id} (${leakedRx.action} ${leakedRx.drugId ?? ''})`
          );
        }
        if (!isEffectivelyAcute) {
          const hasMissingRec = recs.some((r) => r.action === 'CONSIDER' && r.id.startsWith('missing_input_'));
          if (!hasMissingRec) {
            recordViolation(`Ca #${i}: Thiếu CNHH nhưng không sinh missing_input_`);
          }
        }
      }

      // 1B. Đợt cấp thiếu cả restingSpo2 và pao2 -> Cấm phát lệnh START thở oxy khi chưa đo SpO2
      if (
        isEffectivelyAcute &&
        patient.customInputs?.restingSpo2 === undefined &&
        patient.customInputs?.pao2 === undefined
      ) {
        const leakedO2 = recs.find((r) => r.id === 'rec_copd_inpatient_oxygen' && r.action === 'START');
        if (leakedO2) {
          recordViolation(`Ca #${i}: Thiếu cả SpO2 và PaO2 trong đợt cấp nhưng vẫn sinh START oxy`);
        }
      }

      // 2. Thiếu cả mMRC và CAT -> Cấm khởi trị Nhóm A / Nhóm B
      if (mmrcMissing && catMissing) {
        const leakedAb = recs.find((r) => r.id === 'rec_copd_init_group_a' || r.id === 'rec_copd_init_group_b');
        if (leakedAb) {
          recordViolation(`Ca #${i}: Thiếu cả mMRC và CAT nhưng vẫn sinh ${leakedAb.id}`);
        }
      }

      // 3. Thiếu cả moderateExacerbations và hospitalizations -> Cấm phân nhóm khởi trị A/B/E
      if (modMissing && hospMissing) {
        const leakedInit = recs.find((r) =>
          [
            'rec_copd_init_group_a',
            'rec_copd_init_group_b',
            'rec_copd_init_group_e_laba_lama',
            'rec_copd_init_group_e_triple',
          ].includes(r.id)
        );
        if (leakedInit) {
          recordViolation(`Ca #${i}: Thiếu tiền sử đợt cấp nhưng vẫn sinh ${leakedInit.id}`);
        }
      }

      // 4. Thiếu BCAT máu (khi không có hen) -> Cấm thêm ICS hoặc sinh học Dupilumab/Mepolizumab
      if (eosMissing && !hasAsthma) {
        const leakedEosRx = recs.find(
          (r) =>
            r.id === 'rec_copd_init_group_e_triple' ||
            r.id === 'rec_copd_init_group_e_laba_lama' ||
            r.id === 'rec_copd_followup_add_ics' ||
            r.id === 'rec_copd_mono_exac_triple' ||
            r.id === 'rec_copd_dupilumab' ||
            r.id === 'rec_copd_mepolizumab'
        );
        if (leakedEosRx) {
          recordViolation(`Ca #${i}: Thiếu BCAT máu nhưng vẫn sinh ${leakedEosRx.id}`);
        }
      }

      // 5. Thiếu tình trạng hút thuốc -> Cấm chỉ định Azithromycin dự phòng
      if (smokeMissing) {
        const leakedAzi = recs.find((r) => r.id === 'rec_copd_azithromycin_prophylaxis');
        if (leakedAzi) {
          recordViolation(`Ca #${i}: Thiếu tình trạng hút thuốc nhưng vẫn sinh Azithromycin dự phòng`);
        }
      }

      // 6. Thiếu pH hoặc PaCO2 -> Cấm chỉ định NIV do toan hô hấp khi không có co kéo cơ hô hấp / giảm oxy nặng
      if (
        (phMissing || paco2Missing) &&
        !Boolean(patient.customInputs?.accessoryMuscleUse) &&
        !(Boolean(patient.customInputs?.onSupplementalOxygen) && spo2Val !== undefined && spo2Val < 88)
      ) {
        const leakedNiv = recs.find((r) => r.id === 'rec_copd_inpatient_niv');
        if (leakedNiv) {
          recordViolation(`Ca #${i}: Thiếu khí máu (pH/PaCO2) nhưng vẫn sinh START NIV`);
        }
      }
    }

    if (failClosedViolations > 0) {
      console.error('Nhật ký vi phạm Fail-Closed QA-9:\n' + log.join('\n'));
    }
    expect(failClosedViolations).toBe(0);
  }, 120_000);
});
