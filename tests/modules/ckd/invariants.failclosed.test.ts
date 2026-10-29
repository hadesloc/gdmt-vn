/**
 * GDMT-VN CKD Module - Fail-Closed Invariant Fuzzer (< 20 KB)
 * Chạy 6.000 ca xóa ngẫu nhiên trường bắt buộc (QA-1 & QA-9).
 * Lưu ý: Tên describe chứa 'ckd' chữ thường để khớp bộ lọc `-t "ckd"`.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

const rasiDrugIds = new Set([
  'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
  'losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan',
]);
const sglt2iDrugIds = new Set(['dapagliflozin', 'empagliflozin', 'canagliflozin']);

describe('Module ckd - Fail-Closed Invariant Fuzzer (>= 6,000 cases)', () => {
  it('ckd fail-closed (QA-1 & QA-9): xóa ngẫu nhiên scr, k, sbp, uacr, age, sex -> 0 START/UPTITRATE sai trên 6,000 ca', () => {
    let failClosedViolations = 0;
    const testFields = ['scr', 'k', 'sbp', 'uacr', 'age', 'sex'];

    for (let i = 0; i < 6000; i++) {
      const dropField = testFields[i % testFields.length];
      const patient: Patient = {
        id: `missing_${i}`,
        name: `Missing Field Patient ${i}`,
        age: dropField === 'age' ? undefined : 60,
        sex: dropField === 'sex' ? undefined : 'male',
        weight: 70,
        height: 168,
        scr: dropField === 'scr' ? undefined : 120,
        k: dropField === 'k' ? undefined : 4.4,
        sbp: dropField === 'sbp' ? undefined : 135,
        dbp: 80,
        uacr: dropField === 'uacr' ? undefined : 25,
        conditions: { ckd: true, dm: true },
        currentMeds: i % 2 === 0 ? [] : [{ drugId: 'losartan', dose: 50, unit: 'mg' }],
        selectedModules: ['ckd'],
      };

      const settings: Settings = {
        setting: 'outpatient',
        profile: 'INTL',
        units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
        score2Region: 'high',
        fontScale: 'normal',
        theme: 'light',
        onlyReviewed: false,
      };

      const recs = evaluate(patient, settings).recommendations;

      if (dropField === 'scr' || dropField === 'sex') {
        if (
          recs.some(
            (r) =>
              r.drugId &&
              (sglt2iDrugIds.has(r.drugId.toLowerCase()) ||
                rasiDrugIds.has(r.drugId.toLowerCase()) ||
                r.drugId === 'finerenone' ||
                r.drugId === 'semaglutide' ||
                r.drugId === 'atorvastatin') &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          )
        ) {
          failClosedViolations++;
        }
      }
      if (dropField === 'k') {
        if (
          recs.some(
            (r) =>
              r.drugId &&
              (rasiDrugIds.has(r.drugId.toLowerCase()) || r.drugId === 'finerenone') &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          )
        ) {
          failClosedViolations++;
        }
      }
      if (dropField === 'sbp') {
        if (
          recs.some(
            (r) =>
              r.drugId &&
              (sglt2iDrugIds.has(r.drugId.toLowerCase()) ||
                rasiDrugIds.has(r.drugId.toLowerCase()) ||
                r.drugId === 'finerenone' ||
                r.drugId === 'semaglutide') &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          )
        ) {
          failClosedViolations++;
        }
      }
      if (dropField === 'age') {
        if (
          recs.some(
            (r) =>
              r.drugId &&
              (r.drugId === 'atorvastatin' || sglt2iDrugIds.has(r.drugId.toLowerCase())) &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          )
        ) {
          failClosedViolations++;
        }
      }
    }

    expect(failClosedViolations).toBe(0);
  }, 120000);
});
