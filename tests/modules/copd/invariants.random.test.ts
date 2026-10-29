/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Suite 1: Property-Based Safety Invariants trên 12.000 ca ngẫu nhiên tất định (QA-1, QA-9 & QA-10)
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
  INHALER_MAP,
  DPI_ONLY_IDS,
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

describe('Safety Invariants: Module COPD Suite 1 (12.000 ca ngẫu nhiên đa kịch bản)', () => {
  it('Suite 1: Đảm bảo 0 vi phạm bất biến lâm sàng trên 12.000 ca ngẫu nhiên đa kịch bản', () => {
    const TOTAL_CASES = 12000;
    const rng = createPrng(20261027);
    let violations = 0;
    const log: string[] = [];

    const recordViolation = (msg: string) => {
      violations++;
      if (log.length < 20) log.push(msg);
    };

    const rawEnglishFieldRegex =
      /\b(fev1FvcRatio|fev1PredPct|bloodEos|moderateExacerbations|hospitalizations|smokingStatus|restingSpo2|abgPaco2|abgPh)\b/;

    for (let i = 0; i < TOTAL_CASES; i++) {
      const { patient, settings } = generateRandomCopdPatient(rng, i);
      const plan = evaluate(patient, settings);
      const recs = plan.recommendations;
      const copdRecs = recs.filter((r) => r.module === 'copd');

      const fev1Fvc = patient.customInputs?.fev1FvcRatio as number;
      const fev1Pct = patient.customInputs?.fev1PredPct as number;
      const eos = patient.customInputs?.bloodEos as number;
      const modExac = patient.customInputs?.moderateExacerbations as number;
      const hosp = patient.customInputs?.hospitalizations as number;
      const spo2 = patient.customInputs?.restingSpo2 as number;
      const ph = patient.customInputs?.abgPh as number;
      const paco2 = patient.customInputs?.abgPaco2 as number;
      const isExplicitAcute = Boolean(patient.customInputs?.acuteExacerbation);
      const hasSevereAcidosisOrFailure =
        (ph <= 7.35 && paco2 > 45) ||
        Boolean(patient.customInputs?.alteredMentalStatus) ||
        Boolean(patient.customInputs?.accessoryMuscleUse) ||
        spo2 < 90;
      const isAcute = isExplicitAcute || hasSevereAcidosisOrFailure;

      const hasAsthma =
        Boolean(patient.conditions?.priorAsthma) ||
        Boolean(patient.conditions?.asthma) ||
        patient.selectedModules.includes('asthma');

      const isDiscontinueSwitch = (r: { id: string; action: string }) =>
        r.action === 'SWITCH' && r.id.startsWith('switch_old_');

      const stoppedIds = new Set(
        recs
          .filter((r) => (r.action === 'STOP' || isDiscontinueSwitch(r)) && r.drugId)
          .map((r) => r.drugId!.toLowerCase())
      );
      const activeInhalerIds = new Set<string>();
      for (const m of patient.currentMeds) {
        const id = m.drugId.toLowerCase();
        if (INHALER_MAP[id] && !stoppedIds.has(id)) {
          activeInhalerIds.add(id);
        }
      }
      if (fev1Fvc < 0.7) {
        for (const r of recs) {
          if (
            (r.action === 'START' ||
              r.action === 'UPTITRATE' ||
              (r.action === 'SWITCH' && !isDiscontinueSwitch(r))) &&
            r.drugId &&
            INHALER_MAP[r.drugId.toLowerCase()]
          ) {
            activeInhalerIds.add(r.drugId.toLowerCase());
          }
        }
      }

      // Bất biến 0 (Round 4): Mọi khuyến cáo STOP / AVOID / HOLD bắt buộc có dose === undefined
      for (const r of recs) {
        if ((r.action === 'STOP' || r.action === 'AVOID' || r.action === 'HOLD') && r.dose !== undefined) {
          recordViolation(`Ca #${i}: Khuyến cáo ${r.id} (${r.action}) còn chứa dose="${r.dose}"`);
        }
      }

      // Bất biến 1: KHÔNG bao giờ kê mới ICS đơn trị và KHÔNG để tồn tại ICS đơn trị trong COPD không hen
      const monoIcsAdded = copdRecs.find(
        (r) =>
          (r.action === 'START' ||
            r.action === 'UPTITRATE' ||
            (r.action === 'SWITCH' && !isDiscontinueSwitch(r))) &&
          r.drugId &&
          INHALER_MAP[r.drugId]?.ics &&
          !INHALER_MAP[r.drugId]?.laba &&
          !INHALER_MAP[r.drugId]?.lama
      );
      if (monoIcsAdded) {
        recordViolation(`Ca #${i}: Kê mới ICS đơn trị (${monoIcsAdded.drugId})`);
      }
      if (fev1Fvc < 0.7 && !hasAsthma && activeInhalerIds.size === 1) {
        const onlyId = [...activeInhalerIds][0];
        const comp = INHALER_MAP[onlyId];
        if (comp.ics && !comp.laba && !comp.lama) {
          recordViolation(`Ca #${i}: Còn tồn tại ICS đơn trị (${onlyId}) trong phác đồ COPD không hen`);
        }
      }

      // Bất biến 2: KHÔNG thêm/khởi trị mới ICS khi BCAT < 100 /µL trừ khi có hen
      const baselineHasComboIcs = patient.currentMeds.some((m) => {
        const p = INHALER_MAP[m.drugId.toLowerCase()];
        return Boolean(p && p.ics && (p.laba || p.lama));
      });
      if (eos < 100 && !hasAsthma && !baselineHasComboIcs) {
        const icsStart = copdRecs.find(
          (r) =>
            (r.action === 'START' ||
              r.action === 'UPTITRATE' ||
              (r.action === 'SWITCH' && !isDiscontinueSwitch(r))) &&
            r.drugId &&
            INHALER_MAP[r.drugId]?.ics
        );
        if (icsStart) {
          recordViolation(`Ca #${i}: Kê ICS (${icsStart.drugId}) khi BCAT=${eos} < 100 mà không có hen`);
        }
      }

      // Bất biến 3: KHÔNG trùng ≥ 2 LAMA, ≥ 2 LABA hoặc ≥ 2 ICS trong phác đồ sau xử lý
      if (fev1Fvc < 0.7) {
        let lamaCount = 0;
        let labaCount = 0;
        let icsCount = 0;
        for (const id of activeInhalerIds) {
          if (INHALER_MAP[id].lama) lamaCount++;
          if (INHALER_MAP[id].laba) labaCount++;
          if (INHALER_MAP[id].ics) icsCount++;
        }
        if (lamaCount > 1) {
          recordViolation(`Ca #${i}: Trùng ${lamaCount} LAMA [${[...activeInhalerIds].join(', ')}]`);
        }
        if (labaCount > 1) {
          recordViolation(`Ca #${i}: Trùng ${labaCount} LABA [${[...activeInhalerIds].join(', ')}]`);
        }
        if (icsCount > 1) {
          recordViolation(`Ca #${i}: Trùng ${icsCount} ICS [${[...activeInhalerIds].join(', ')}]`);
        }
        if (Boolean(patient.customInputs?.narrowAngleGlaucoma) && lamaCount > 0) {
          recordViolation(`Ca #${i}: Glôcôm góc đóng nhưng còn LAMA [${[...activeInhalerIds].join(', ')}]`);
        }
        if (
          !isAcute &&
          !Boolean(patient.customInputs?.narrowAngleGlaucoma) &&
          (Boolean(patient.customInputs?.weakInspiratoryFlow) ||
            Boolean(patient.customInputs?.severeMilkProteinAllergy))
        ) {
          const leakedDpiFromCopd = copdRecs.find(
            (r) =>
              (r.action === 'START' ||
                r.action === 'UPTITRATE' ||
                (r.action === 'SWITCH' && !isDiscontinueSwitch(r))) &&
              r.drugId &&
              DPI_ONLY_IDS.has(r.drugId)
          );
          if (leakedDpiFromCopd) {
            recordViolation(`Ca #${i}: Dị ứng sữa/lực hít yếu nhưng kê DPI (${leakedDpiFromCopd.drugId})`);
          }
        }
      }

      // Bất biến 4: Khi có hen đồng mắc và FEV1/FVC < 0.70, phác đồ duy trì bắt buộc có chứa ICS
      if (fev1Fvc < 0.7 && hasAsthma && activeInhalerIds.size > 0) {
        const hasAnyIcs = [...activeInhalerIds].some((id) => INHALER_MAP[id]?.ics);
        if (!hasAnyIcs) {
          recordViolation(`Ca #${i}: Có hen đồng mắc nhưng thiếu ICS [${[...activeInhalerIds].join(', ')}]`);
        }
      }

      // Bất biến 5: FEV1/FVC ≥ 0.70 chặn toàn bộ khởi trị và leo thang thuốc duy trì COPD
      if (fev1Fvc >= 0.7) {
        const leakedMaintenance = copdRecs.find(
          (r) =>
            (r.action === 'START' ||
              r.action === 'UPTITRATE' ||
              (r.action === 'SWITCH' && !isDiscontinueSwitch(r))) &&
            r.drugId &&
            (INHALER_MAP[r.drugId] !== undefined ||
              r.drugId === 'roflumilast' ||
              r.drugId === 'azithromycin' ||
              r.drugId === 'dupilumab' ||
              r.drugId === 'mepolizumab')
        );
        if (leakedMaintenance) {
          recordViolation(`Ca #${i}: FEV1/FVC=${fev1Fvc} >= 0.70 nhưng sinh ${leakedMaintenance.action} ${leakedMaintenance.drugId}`);
        }
      }

      // Bất biến 6: An toàn cấp cứu, Oxy 88–92%, SABA/Steroid UPTITRATE, VTE, Kháng sinh Anthonisen & NIV
      const o2Rec = copdRecs.find((r) => r.id === 'rec_copd_inpatient_oxygen');
      if (o2Rec) {
        const onSuppO2 = Boolean(patient.customInputs?.onSupplementalOxygen);
        const pao2 = patient.customInputs?.pao2 as number;
        if (!isAcute || spo2 > 92) {
          recordViolation(`Ca #${i}: Chỉ định oxy cấp cứu sai điều kiện (isAcute=${isAcute}, SpO2=${spo2})`);
        }
        if (o2Rec.action === 'START' && spo2 >= 88 && pao2 >= 60 && !onSuppO2) {
          recordViolation(`Ca #${i}: Phát lệnh START oxy khi SpO2=${spo2}% khí phòng đã đạt đích 88–92%`);
        }
        if (!o2Rec.title.includes('88–92%') && !o2Rec.title.includes('88-92%')) {
          recordViolation(`Ca #${i}: Đích oxy cấp cứu sai lệch khỏi 88–92%: ${o2Rec.title}`);
        }
      }
      if (isAcute) {
        if (patient.currentMeds.some((m) => m.drugId === 'salbutamol')) {
          const sabaRec = recs.find((r) => r.drugId === 'salbutamol');
          if (sabaRec && sabaRec.action === 'CONTINUE') {
            recordViolation(`Ca #${i}: Đợt cấp có sẵn Salbutamol nhưng bị biến thành CONTINUE`);
          }
        }
        if (patient.currentMeds.some((m) => m.drugId === 'prednisolone' && m.dose === 5)) {
          const predRec = recs.find((r) => r.drugId === 'prednisolone');
          if (predRec && predRec.action === 'CONTINUE') {
            recordViolation(`Ca #${i}: Đợt cấp có sẵn Prednisolone 5 mg nhưng bị biến thành CONTINUE`);
          }
        }
        const vteStart = copdRecs.find((r) => r.id === 'rec_copd_vte_prophylaxis' && r.action === 'START');
        if (
          vteStart &&
          (Boolean(patient.conditions?.bleedingHistory) ||
            patient.currentMeds.some((m) => m.drugId === 'apixaban'))
        ) {
          recordViolation(`Ca #${i}: Vẫn START chống đông VTE khi đang dùng Apixaban / tiền sử chảy máu`);
        }
      }
      if (!isAcute) {
        const leakedAcute = copdRecs.find((r) =>
          [
            'rec_copd_inpatient_saba_sama',
            'rec_copd_inpatient_steroid',
            'rec_copd_inpatient_antibiotics',
            'rec_copd_inpatient_niv',
            'rec_copd_discharge_checklist',
          ].includes(r.id)
        );
        if (leakedAcute) {
          recordViolation(`Ca #${i}: Không đợt cấp nhưng kích hoạt ${leakedAcute.id}`);
        }
      }
      const abxRec = copdRecs.find((r) => r.id === 'rec_copd_inpatient_antibiotics');
      if (abxRec) {
        const purulent = Boolean(patient.customInputs?.purulentSputum);
        const ventSupport =
          (ph <= 7.35 && paco2 >= 45) ||
          Boolean(patient.customInputs?.respiratoryArrest) ||
          Boolean(patient.customInputs?.alteredMentalStatus);
        const hasSecondAnthonisen =
          Boolean(patient.customInputs?.increasedDyspnea) ||
          Boolean(patient.customInputs?.increasedSputumVolume) ||
          Boolean(patient.customInputs?.fever);
        if (!ventSupport && (!purulent || !hasSecondAnthonisen)) {
          recordViolation(`Ca #${i}: Kê kháng sinh đợt cấp khi không thỏa Anthonisen / thở máy`);
        }
      }
      const nivRec = copdRecs.find((r) => r.id === 'rec_copd_inpatient_niv');
      if (nivRec) {
        const validNivIndication =
          isAcute &&
          !(ph < 7.35 && paco2 < 45) &&
          ((ph <= 7.35 && paco2 >= 45) ||
            Boolean(patient.customInputs?.accessoryMuscleUse) ||
            (Boolean(patient.customInputs?.onSupplementalOxygen) && spo2 < 88));
        if (!validNivIndication) {
          recordViolation(`Ca #${i}: Kê NIV sai tiêu chuẩn (pH=${ph}, PaCO2=${paco2}, SpO2=${spo2})`);
        }
      }
      if (
        nivRec &&
        nivRec.action === 'START' &&
        (Boolean(patient.customInputs?.alteredMentalStatus) ||
          Boolean(patient.customInputs?.respiratoryArrest) ||
          (patient.sbp !== undefined && patient.sbp < 90))
      ) {
        recordViolation(`Ca #${i}: Vẫn START NIV khi có chống chỉ định ngừng thở / lơ mơ / sốc`);
      }

      // Bất biến 7: Roflumilast luôn CONSIDER & tuân thủ chống chỉ định
      if (copdRecs.some((r) => r.drugId === 'roflumilast' && r.action === 'START')) {
        recordViolation(`Ca #${i}: Roflumilast phát sinh action START thay vì CONSIDER`);
      }
      const rofConsider = copdRecs.find((r) => r.drugId === 'roflumilast' && r.action === 'CONSIDER');
      if (rofConsider) {
        const isCb = Boolean(patient.customInputs?.chronicBronchitis);
        const bmi =
          patient.weight && patient.height ? patient.weight / Math.pow(patient.height / 100, 2) : 22;
        const hasTheophylline = patient.currentMeds.some((m) => m.drugId === 'theophylline');
        const isChildPughAOnly =
          String(patient.customInputs?.childPugh ?? '').toUpperCase() === 'A' &&
          !Boolean(patient.conditions?.cirrhosis);
        const hasContra =
          (Boolean(patient.conditions?.liverDisease) && !isChildPughAOnly) ||
          Boolean(patient.conditions?.depression) ||
          Boolean(patient.conditions?.pregnant) ||
          Boolean(patient.customInputs?.unexplainedWeightLoss) ||
          bmi < 18.5 ||
          hasTheophylline;
        if (fev1Pct >= 50 || !isCb || hasContra) {
          recordViolation(`Ca #${i}: Roflumilast vi phạm tiêu chuẩn/chống chỉ định`);
        }
      }

      // Bất biến 8: Sinh học & Azithromycin
      const dupiPropose = copdRecs.find(
        (r) => r.drugId === 'dupilumab' && (r.action === 'CONSIDER' || r.action === 'START')
      );
      const mepoPropose = copdRecs.find(
        (r) => r.drugId === 'mepolizumab' && (r.action === 'CONSIDER' || r.action === 'START')
      );
      if (dupiPropose && mepoPropose) {
        recordViolation(`Ca #${i}: Đề xuất đồng thời cả 2 thuốc sinh học`);
      }
      const aziConsider = copdRecs.find(
        (r) => r.drugId === 'azithromycin' && (r.action === 'CONSIDER' || r.action === 'START')
      );
      if (aziConsider) {
        const smoke = patient.customInputs?.smokingStatus;
        const hasQtDrug = patient.currentMeds.some(
          (m) => m.drugId === 'amiodarone' || m.drugId === 'propafenone'
        );
        const alreadyOnAzi = patient.currentMeds.some((m) => m.drugId === 'azithromycin');
        if (
          alreadyOnAzi ||
          smoke === 'current' ||
          smoke === undefined ||
          hasQtDrug ||
          Boolean(patient.customInputs?.qtcProlonged) ||
          Boolean(patient.customInputs?.hearingImpairment) ||
          Boolean(patient.customInputs?.ntmInfection) ||
          String(patient.customInputs?.childPugh ?? '').toUpperCase() === 'C'
        ) {
          recordViolation(`Ca #${i}: Azithromycin vi phạm an toàn`);
        }
      }

      // Bất biến 9 & 10: Nhóm E ngay từ ≥ 1 đợt cấp vừa; không rò khóa tiếng Anh thô
      if (
        fev1Fvc < 0.7 &&
        !hasAsthma &&
        patient.currentMeds.length === 0 &&
        (patient.customInputs?.currentInhaler === 'none' ||
          patient.customInputs?.currentInhaler === 'saba_sama') &&
        (modExac >= 1 || hosp >= 1) &&
        copdRecs.some((r) => r.id === 'rec_copd_init_group_a')
      ) {
        recordViolation(`Ca #${i}: Có đợt cấp nhưng xếp nhầm vào Nhóm A`);
      }
      for (const r of copdRecs) {
        if (rawEnglishFieldRegex.test(r.title)) {
          recordViolation(`Ca #${i}: Rò rỉ khóa tiếng Anh thô trong title: "${r.title}"`);
        }
      }
    }

    if (violations > 0) {
      console.error('Nhật ký vi phạm bất biến an toàn:\n' + log.join('\n'));
    }
    expect(violations).toBe(0);
  }, 120_000);
});
