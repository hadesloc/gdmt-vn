/**
 * GDMT-VN Module Đái tháo đường típ 2 (dm2) - Property-Based Safety Invariants & Fail-Closed Tests
 * Phân quyền: Agent F4
 *
 * Kiểm tra bất biến an toàn tuyệt đối trên 15.000 ca bệnh nhân lâm sàng ngẫu nhiên
 * và 2.500 ca kiểm định xóa ngẫu nhiên trường bắt buộc (QA-1 Fail-Closed = tổng 17.500 ca).
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { normalizePatientUnits } from '../../../src/engine/units';
import { derivePatientData } from '../../../src/engine/derive';
import type { Patient } from '../../../src/engine/types';
import {
  ALL_INSULIN_IDS,
  BASAL_OR_PREMIX_IDS,
  DPP4_IDS,
  INCRETIN_IDS,
  NON_INSULIN_DM2_IDS,
  SGLT2_IDS,
  SU_IDS,
  SimpleRng,
  generateRandomPatient
} from './invariantsHelpers';

describe('GDMT-VN [dm2] Safety Invariants & Fail-Closed Tests (17.500 property-based random cases)', () => {
  const TOTAL_INVARIANT_RUNS = 15000;
  const FAIL_CLOSED_DELETION_RUNS = 2500;

  it(`[dm2] chạy thành công ${TOTAL_INVARIANT_RUNS} ca lâm sàng ngẫu nhiên với 0 vi phạm bất biến an toàn`, () => {
    const rng = new SimpleRng(20261027);
    let checkedCount = 0;

    for (let i = 0; i < TOTAL_INVARIANT_RUNS; i++) {
      const { patient, settings } = generateRandomPatient(rng);
      const plan = evaluate(patient, settings);
      checkedCount++;

      const recs = plan.recommendations;
      const serialized = JSON.stringify(plan);
      expect(serialized.includes('NaN')).toBe(false);

      // 0. BẤT BIẾN VÒNG 3: Không bao giờ gắn chuỗi `dose` lên các hành động STOP / AVOID / HOLD / DEFER
      for (const r of recs) {
        if (r.module === 'dm2' && ['STOP', 'AVOID', 'HOLD', 'DEFER'].includes(r.action)) {
          expect(r.dose).toBeUndefined();
        }
      }

      const isPregnant = Boolean(patient.sex === 'female' && patient.conditions?.pregnant);
      const hasMtcOrMen2 = Boolean(patient.customInputs?.historyMtcOrMen2);
      const isActivelyHypo = patient.glucose !== undefined && patient.glucose < 3.9;
      const hasRecentHypo = Boolean(patient.customInputs?.recentHypo || isActivelyHypo);

      const ketones = Number(patient.customInputs?.bloodKetones ?? 0);
      const vPh = Number(patient.customInputs?.venousPh ?? 7.4);
      const bicarb = Number(patient.customInputs?.serumBicarb ?? 24);
      const effOsm = Number(patient.customInputs?.effectiveOsmolality ?? 285);
      const isConfirmedCrisisInpatient =
        settings.setting === 'inpatient' &&
        ((ketones >= 3.0 && (vPh < 7.3 || bicarb < 18)) ||
          (patient.glucose !== undefined && patient.glucose >= 33.3 && effOsm > 300));

      // 1. BẤT BIẾN THẬN & FAIL-CLOSED KHI THIẾU CREATININ / eGFR
      if (patient.scr === undefined) {
        for (const r of recs) {
          if (r.drugId === 'metformin') {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
          }
          if (SGLT2_IDS.includes(r.drugId || '') || INCRETIN_IDS.includes(r.drugId || '')) {
            expect(r.action).not.toBe('START');
          }
        }
      }

      const derived = derivePatientData(normalizePatientUnits(patient, settings.units), settings);
      const egfrVal = derived.egfr;
      if (typeof egfrVal === 'number') {
        if (egfrVal < 30) {
          for (const r of recs) {
            if (r.drugId === 'metformin') {
              expect(['STOP', 'AVOID', 'HOLD']).toContain(r.action);
              expect(r.action).not.toBe('START');
              expect(r.action).not.toBe('CONTINUE');
            }
            if (['gliclazide', 'glimepiride', 'acarbose'].includes(r.drugId || '')) {
              expect(r.action).not.toBe('START');
              expect(r.action).not.toBe('CONTINUE');
            }
          }
        }
        if (egfrVal < 20) {
          for (const r of recs) {
            const takingThisSglt2 = patient.currentMeds.some((m) => m.drugId.toLowerCase() === r.drugId);
            if (SGLT2_IDS.includes(r.drugId || '') && !takingThisSglt2) {
              expect(r.action).not.toBe('START');
            }
          }
        }
        if (egfrVal < 15) {
          for (const r of recs) {
            const takingThisGlp1 = patient.currentMeds.some((m) => m.drugId.toLowerCase() === r.drugId);
            if (INCRETIN_IDS.includes(r.drugId || '') && !takingThisGlp1) {
              expect(r.action).not.toBe('START');
            }
          }
        }
      }

      // 2. BẤT BIẾN KHÔNG PHỐI HỢP DPP-4i VỚI GLP-1 / GIP-GLP-1 RA
      const hasGlp1Current = patient.currentMeds.some((m) => INCRETIN_IDS.includes(m.drugId.toLowerCase()));
      const hasGlp1Started = recs.some((r) => INCRETIN_IDS.includes(r.drugId || '') && r.action === 'START');
      if (hasGlp1Current || hasGlp1Started) {
        for (const dpp4Id of DPP4_IDS) {
          const isTakingThisDpp4 = patient.currentMeds.some((m) => m.drugId.toLowerCase() === dpp4Id);
          if (isTakingThisDpp4 && (!isActivelyHypo || hasGlp1Current || hasGlp1Started)) {
            const dpp4Rec = recs.find((r) => r.drugId === dpp4Id);
            if (dpp4Rec && (hasGlp1Started || (!isActivelyHypo && !hasMtcOrMen2))) {
              expect(dpp4Rec.action).toBe('STOP');
            }
          }
        }
      }

      // 3. BẤT BIẾN SUY TIM: ĐỒNG THỜI STOP CẢ PIOGLITAZONE LẪN SAXAGLIPTIN
      const isHf = Boolean(patient.conditions?.hf || (patient.lvef !== undefined && patient.lvef <= 50));
      if (isHf) {
        if (patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'pioglitazone')) {
          const pioRec = recs.find((r) => r.drugId === 'pioglitazone');
          expect(pioRec).toBeDefined();
          expect(pioRec?.action).toBe('STOP');
        }
        if (patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'saxagliptin')) {
          const saxaRec = recs.find((r) => r.drugId === 'saxagliptin');
          expect(saxaRec).toBeDefined();
          expect(saxaRec?.action).toBe('STOP');
        }
      }

      // 4. BẤT BIẾN THAI KỲ: CHẶN 100% THUỐC VIÊN / GLP-1 RA, CHỈ CHO PHÉP INSULIN
      if (isPregnant) {
        for (const r of recs) {
          if (r.drugId && NON_INSULIN_DM2_IDS.includes(r.drugId)) {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
            expect(r.action).not.toBe('CONTINUE');
          }
        }
        for (const med of patient.currentMeds) {
          const id = med.drugId.toLowerCase();
          if (NON_INSULIN_DM2_IDS.includes(id)) {
            const medRec = recs.find((r) => r.drugId === id);
            expect(medRec).toBeDefined();
            expect(medRec?.action).toBe('STOP');
          }
        }
      }

      // 5. BẤT BIẾN TIỀN SỬ MTC / MEN 2: CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI GLP-1 / GIP-GLP-1 RA
      if (hasMtcOrMen2) {
        for (const r of recs) {
          if (r.drugId && INCRETIN_IDS.includes(r.drugId)) {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
            expect(r.action).not.toBe('CONTINUE');
          }
        }
        for (const med of patient.currentMeds) {
          const id = med.drugId.toLowerCase();
          if (INCRETIN_IDS.includes(id)) {
            const medRec = recs.find((r) => r.drugId === id);
            expect(medRec).toBeDefined();
            expect(medRec?.action).toBe('STOP');
          }
        }
      }

      // 6. BẤT BIẾN HẠ ĐƯỜNG HUYẾT CẤP (< 3.9 mmol/L) & HẠ ĐƯỜNG HUYẾT GẦN ĐÂY
      if (isActivelyHypo) {
        const hypoRec = recs.find((r) => r.id === 'rec_dm2_hypo_rule15');
        expect(hypoRec).toBeDefined();
        expect(hypoRec?.action).toBe('START');

        for (const r of recs) {
          if (r.id === 'rec_dm2_hypo_rule15') continue;
          if (r.drugId && (NON_INSULIN_DM2_IDS.includes(r.drugId) || ALL_INSULIN_IDS.includes(r.drugId))) {
            if (r.id === 'rec_dm2_dka_active_management') continue;
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
          }
        }

        for (const med of patient.currentMeds) {
          const id = med.drugId.toLowerCase();
          if (SU_IDS.includes(id) || ALL_INSULIN_IDS.includes(id)) {
            const medRec = recs.find((r) => r.drugId === id);
            expect(medRec).toBeDefined();
            expect(['HOLD', 'STOP']).toContain(medRec?.action);
          }
        }
      }

      if (hasRecentHypo) {
        for (const r of recs) {
          if (r.drugId && BASAL_OR_PREMIX_IDS.includes(r.drugId)) {
            expect(r.action).not.toBe('UPTITRATE');
          }
        }
      }

      // 7. BẤT BIẾN KHÔNG BAO GIỜ RESET INSULIN ĐANG DÙNG VỀ START 10 U/NGÀY
      const hasExistingBasal = patient.currentMeds.some((m) =>
        BASAL_OR_PREMIX_IDS.includes(m.drugId.toLowerCase())
      );
      if (hasExistingBasal && settings.setting === 'outpatient' && !isPregnant) {
        const earlyIns = recs.find((r) => r.id === 'rec_dm2_early_insulin');
        if (earlyIns) {
          expect(earlyIns.action).not.toBe('START');
        }
      }

      // 8. BẤT BIẾN CẤP CỨU DKA / EUGLYCEMIC DKA / HHS ĐÃ XÁC ĐỊNH
      if (isConfirmedCrisisInpatient) {
        if (isActivelyHypo) {
          expect(recs.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();
          const regHold = recs.find((r) => r.drugId === 'insulin_regular');
          expect(regHold).toBeDefined();
          expect(['HOLD', 'STOP']).toContain(regHold?.action);
        } else if (patient.k === undefined) {
          const needKRec = recs.find((r) => r.id === 'rec_dm2_dka_need_k_before_insulin');
          expect(needKRec).toBeDefined();
          expect(needKRec?.action).toBe('HOLD');
          expect(needKRec?.drugId).toBe('insulin_regular');
          expect(recs.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();
        } else if (patient.k < 3.5) {
          const holdKRec = recs.find((r) => r.id === 'rec_dm2_dka_hold_insulin_hypokalemia');
          expect(holdKRec).toBeDefined();
          expect(holdKRec?.action).toBe('HOLD');
          expect(holdKRec?.drugId).toBe('insulin_regular');
          expect(recs.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();
        } else {
          const activeRec = recs.find((r) => r.id === 'rec_dm2_dka_active_management');
          expect(activeRec).toBeDefined();
          expect(activeRec?.drugId).toBe('insulin_regular');
          if (patient.k > 5.0) {
            expect(activeRec?.title).toContain('Chưa bù Kali');
            expect(activeRec?.title).not.toContain('· Bù Kali ·');
          }
        }

        expect(recs.find((r) => r.id === 'rec_dm2_inpatient_basal_bolus')).toBeUndefined();
        expect(recs.find((r) => r.id === 'rec_dm2_inpatient_prandial_bolus')).toBeUndefined();
      }

      // 9. BẤT BIẾN TIỀN PHẪU TẠM NGỪNG SGLT2i Ở CẢ NGOẠI TRÚ LẪN NỘI VIỆN
      if (Boolean(patient.customInputs?.plannedSurgery)) {
        for (const med of patient.currentMeds) {
          const id = med.drugId.toLowerCase();
          if (SGLT2_IDS.includes(id)) {
            const sgltRec = recs.find((r) => r.drugId === id);
            expect(sgltRec).toBeDefined();
            expect(['HOLD', 'STOP']).toContain(sgltRec?.action);
          }
        }
      }

      // 10. BẤT BIẾN CHỐNG CHỈ ĐỊNH VILDAGLIPTIN KHI SUY GAN / ALT > 3x ULN
      const hasHepaticContra = Boolean(
        patient.conditions?.liverDisease || Number(patient.customInputs?.altUlnTimes ?? 0) > 3
      );
      if (hasHepaticContra && patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'vildagliptin')) {
        const vildaRec = recs.find((r) => r.drugId === 'vildagliptin');
        expect(vildaRec).toBeDefined();
        expect(vildaRec?.action).toBe('STOP');
      }
    }

    expect(checkedCount).toBe(TOTAL_INVARIANT_RUNS);
  }, 120_000);

  it(`[dm2] kiểm định QA-1 Fail-Closed trên ${FAIL_CLOSED_DELETION_RUNS} ca xóa ngẫu nhiên các trường sinh hiệu/xét nghiệm bắt buộc`, () => {
    const rng = new SimpleRng(987654321);
    const deletableKeys: Array<keyof Patient> = [
      'scr',
      'k',
      'weight',
      'height',
      'glucose',
      'hba1c',
      'sbp',
      'dbp'
    ];

    let checked = 0;
    for (let i = 0; i < FAIL_CLOSED_DELETION_RUNS; i++) {
      const { patient, settings } = generateRandomPatient(rng, true);
      const deleteCount = 1 + Math.floor(rng.range(0, 4));
      const deleted = new Set<keyof Patient>();

      for (let d = 0; d < deleteCount; d++) {
        const key = rng.choice(deletableKeys);
        deleted.add(key);
        delete patient[key];
      }

      const plan = evaluate(patient, settings);
      checked++;

      const serialized = JSON.stringify(plan);
      expect(serialized.includes('NaN')).toBe(false);
      expect(serialized.includes('undefined')).toBe(false);

      if (deleted.has('scr')) {
        for (const r of plan.recommendations) {
          if (r.drugId === 'metformin' || SGLT2_IDS.includes(r.drugId || '') || INCRETIN_IDS.includes(r.drugId || '')) {
            expect(r.action).not.toBe('START');
            expect(r.action).not.toBe('UPTITRATE');
          }
        }
      }

      if (deleted.has('k') && settings.setting === 'inpatient') {
        expect(plan.recommendations.find((r) => r.id === 'rec_dm2_dka_active_management')).toBeUndefined();
      }
    }

    expect(checked).toBe(FAIL_CLOSED_DELETION_RUNS);
  }, 120_000);
});
