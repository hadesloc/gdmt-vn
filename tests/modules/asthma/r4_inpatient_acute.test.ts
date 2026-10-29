import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

const inpatient: Settings = {
  setting: 'inpatient',
  profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false,
};

function stableAsthmaInpatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'asthma_r4_inpatient',
    age: 58,
    sex: 'female',
    weight: 65,
    height: 158,
    sbp: 128,
    dbp: 78,
    hr: 82,
    spo2: 96,
    scr: 80,
    k: 4.2,
    conditions: { asthma: true, dm2: true },
    currentMeds: [{ drugId: 'budesonide_formoterol', name: 'Symbicort 160/4.5', dose: '2 nhát x 2 lần/ngày' }],
    selectedModules: ['asthma', 'dm2'],
    customInputs: { respiratoryRate: 16 },
    ...overrides,
  };
}

const ACUTE_IDS = /salbutamol|prednisolone|ipratropium|magnesium/;

describe('ASTHMA-R4-R1-01 / R3-01: nội trú không mặc định là cơn hen cấp', () => {
  it('hen ổn định nhập viện vì lý do khác (isAcuteExacerbation chưa khai báo) → không phát phác đồ cắt cơn, giữ ICS-LABA', () => {
    const plan = evaluate(stableAsthmaInpatient(), inpatient);
    const asthmaRecs = plan.recommendations.filter((r) => r.module === 'asthma');
    const acuteStarts = asthmaRecs.filter(
      (r) => r.drugId && ACUTE_IDS.test(r.drugId) && (r.action === 'START' || r.action === 'CONSIDER') && /cấp|cơn/i.test(r.title)
    );
    expect(acuteStarts.map((r) => r.id)).toEqual([]);
    const ics = plan.recommendations.filter((r) => r.drugId === 'budesonide_formoterol');
    expect(ics.some((r) => r.action === 'STOP' || r.action === 'HOLD')).toBe(false);
  });

  it('nội trú có dấu hiệu khách quan (PEF 55%, nhịp thở 28) → vẫn nhận diện cơn hen cấp', () => {
    const plan = evaluate(
      stableAsthmaInpatient({ customInputs: { respiratoryRate: 28, pefPct: 55 } }),
      inpatient
    );
    const acute = plan.recommendations.filter((r) => r.drugId && /salbutamol/.test(r.drugId) && r.action !== 'STOP');
    expect(acute.length).toBeGreaterThan(0);
  });

  it('isAcuteExacerbation = true tường minh → luôn nhận diện cơn cấp', () => {
    const plan = evaluate(stableAsthmaInpatient({ customInputs: { respiratoryRate: 16, isAcuteExacerbation: true } }), inpatient);
    expect(plan.recommendations.some((r) => r.drugId && /salbutamol/.test(r.drugId) && r.action !== 'STOP')).toBe(true);
  });
});
