/**
 * GDMT-VN Module Đái tháo đường típ 2 (dm2) - Bất biến An toàn Vòng 2 & Vòng 3 (3.000 ca ngẫu nhiên mở rộng)
 * Phân quyền: Agent F4
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import {
  DPP4_IDS,
  INCRETIN_IDS,
  NON_INSULIN_DM2_IDS,
  SGLT2_IDS,
  SU_IDS,
  SimpleRng,
  generateRandomPatient
} from './invariantsHelpers';

describe('GDMT-VN [dm2] Extended Round 2 & Round 3 Safety Invariants (3.000 property-based cases)', () => {
  it('[dm2] kiểm định 3.000 ca bất biến an toàn mở rộng (Viêm tụy, Lọc máu, Cấp cứu ngoại trú REFER, EuDKA STOP SGLT2i, Kháng đông OAC, Cho con bú)', () => {
    const ROUND_RUNS = 3000;
    const rng = new SimpleRng(20261028);
    let checked = 0;

    for (let i = 0; i < ROUND_RUNS; i++) {
      const { patient, settings } = generateRandomPatient(rng);
      const hasPancreatitis = rng.boolean(0.24);
      const onDialysis = rng.boolean(0.24);
      const onOac = rng.boolean(0.24);
      const isBreastfeeding = patient.sex === 'female' && !patient.conditions?.pregnant && rng.boolean(0.12);

      if (onDialysis && rng.boolean(0.4)) {
        patient.scr = rng.boolean(0.5) ? undefined : 115;
      }

      patient.conditions = {
        ...patient.conditions,
        onDialysis,
        onAnticoagulant: onOac,
        recentAcs: false,
        breastfeeding: isBreastfeeding
      };
      patient.customInputs = {
        ...patient.customInputs,
        historyPancreatitis: hasPancreatitis
      };

      const plan = evaluate(patient, settings);
      checked++;

      const recs = plan.recommendations;
      const serialized = JSON.stringify(plan);
      expect(serialized.includes('NaN')).toBe(false);
      expect(serialized.includes('undefined')).toBe(false);

      // Không bao giờ gắn chuỗi `dose` lên STOP / AVOID / HOLD / DEFER
      for (const r of recs) {
        if (r.module === 'dm2' && ['STOP', 'AVOID', 'HOLD', 'DEFER'].includes(r.action)) {
          expect(r.dose).toBeUndefined();
        }
      }

      const isActivelyHypo = patient.glucose !== undefined && patient.glucose < 3.9;
      const ketones = Number(patient.customInputs?.bloodKetones ?? 0);
      const vPh = Number(patient.customInputs?.venousPh ?? 7.4);
      const bicarb = Number(patient.customInputs?.serumBicarb ?? 24);
      const effOsm = Number(patient.customInputs?.effectiveOsmolality ?? 285);
      const isDkaOrEuDka = Boolean(patient.customInputs?.dkaSuspected) || (ketones >= 3.0 && (vPh < 7.3 || bicarb < 18));
      const isHhs = patient.glucose !== undefined && patient.glucose >= 33.3 && effOsm > 300;

      // R2-1. Viêm tụy cấp / tiền sử viêm tụy -> Chặn 100% khởi trị/duy trì và STOP toàn bộ GLP-1 RA, GIP/GLP-1 RA & DPP-4i
      if (hasPancreatitis) {
        const allIncretins = [...INCRETIN_IDS, ...DPP4_IDS];
        for (const r of recs) {
          if (r.drugId && allIncretins.includes(r.drugId)) {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
            expect(r.action).not.toBe('CONTINUE');
          }
        }
        for (const med of patient.currentMeds) {
          const id = med.drugId.toLowerCase();
          if (allIncretins.includes(id)) {
            const medRec = recs.find((r) => r.drugId === id);
            expect(medRec).toBeDefined();
            expect(medRec?.action).toBe('STOP');
          }
        }
      }

      // R2-2. Đang lọc máu chu kỳ -> Chặn 100% và STOP Metformin, SGLT2i, Sulfonylurea, Acarbose bất kể giá trị scr
      if (onDialysis) {
        const dialysisBanned = ['metformin', ...SGLT2_IDS, ...SU_IDS, 'acarbose'];
        for (const r of recs) {
          if (r.drugId && dialysisBanned.includes(r.drugId)) {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
            expect(r.action).not.toBe('CONTINUE');
          }
        }
        if (!isActivelyHypo) {
          for (const med of patient.currentMeds) {
            const id = med.drugId.toLowerCase();
            if (dialysisBanned.includes(id)) {
              const medRec = recs.find((r) => r.drugId === id);
              expect(medRec).toBeDefined();
              expect(medRec?.action).toBe('STOP');
            }
          }
        }
      }

      // R2-3. Cơn cấp cứu DKA / euDKA / HHS tại phòng khám ngoại trú -> Bắt buộc REFER + không START thuốc viên + STOP SGLT2i khi DKA
      if (settings.setting === 'outpatient' && !isActivelyHypo && (isDkaOrEuDka || isHhs)) {
        const referRec = recs.find((r) => r.id === 'rec_dm2_outpatient_crisis_refer');
        expect(referRec).toBeDefined();
        expect(referRec?.action).toBe('REFER');

        for (const r of recs) {
          if (r.drugId && ['metformin', ...SGLT2_IDS, ...INCRETIN_IDS].includes(r.drugId)) {
            expect(r.action).not.toBe('START');
          }
        }
      }

      // R2-4. DKA / Euglycemic DKA ở cả ngoại trú lẫn nội viện -> Bắt buộc STOP vĩnh viễn SGLT2i (không chỉ HOLD)
      if (isDkaOrEuDka) {
        for (const med of patient.currentMeds) {
          const id = med.drugId.toLowerCase();
          if (SGLT2_IDS.includes(id)) {
            const sgltRec = recs.find((r) => r.drugId === id);
            expect(sgltRec).toBeDefined();
            expect(sgltRec?.action).toBe('STOP');
          }
        }
      }

      // R2-5. Đang dùng thuốc kháng đông đường uống (OAC) không có ACS gần đây -> Không gợi ý thêm Aspirin thường quy
      if (onOac) {
        expect(recs.find((r) => r.id === 'rec_dm2_aspirin_secondary')).toBeUndefined();
      }

      // R3-6. Đang cho con bú (Lactation) -> Chặn khởi trị và STOP SGLT2i, GLP-1/GIP-GLP-1 RA, SU, DPP-4i, Pioglitazone, Acarbose
      if (isBreastfeeding) {
        const lactationUnsafe = NON_INSULIN_DM2_IDS.filter((id) => id !== 'metformin');
        for (const r of recs) {
          if (r.drugId && lactationUnsafe.includes(r.drugId)) {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
            expect(r.action).not.toBe('CONTINUE');
          }
        }
        if (!isActivelyHypo) {
          for (const med of patient.currentMeds) {
            const id = med.drugId.toLowerCase();
            if (lactationUnsafe.includes(id)) {
              const medRec = recs.find((r) => r.drugId === id);
              expect(medRec).toBeDefined();
              expect(medRec?.action).toBe('STOP');
            }
          }
        }
      }
    }

    expect(checked).toBe(ROUND_RUNS);
  }, 120_000);
});
