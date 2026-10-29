import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { reviewCurrentMedications } from '../../../src/engine/safety/reviewMeds';
import type { Patient, Settings } from '../../../src/engine/types';

const settings: Settings = { setting: 'outpatient', profile: 'VN',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', theme: 'light', fontScale: 'normal', onlyReviewed: false };
const patient = (egfr: number): Patient => ({ age: 62, sex: 'male', egfr, sbp: 130, dbp: 80, hr: 72, k: 4.3, uacr: 45,
  conditions: { ckd: true, dm: true }, selectedModules: ['ckd'],
  currentMeds: [{ drugId: 'metformin', dose: 500, unit: 'mg', freq: 'bid' }] });

describe('SRC-01b evidence must support the actual metformin safety reason', () => {
  it('renal STOP cites renal contraindication, not discontinuation for contrast', () => {
    const rec = evaluate(patient(25), settings).recommendations.find((r) => r.drugId === 'metformin');
    expect(rec?.action).toBe('STOP');
    expect(rec?.citationIds).toContain('fda.metformin.contra_renal_acidosis');
    expect(rec?.citationIds).not.toContain('fda.metformin.contrast_discontinue');
  });

  it('severe acidosis HOLD cites the metabolic acidosis contraindication', () => {
    const p = patient(42); p.hco3 = 10;
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'metformin');
    expect(['HOLD', 'STOP']).toContain(rec?.action);
    expect(rec?.citationIds).toContain('fda.metformin.contra_renal_acidosis');
    expect(rec?.citationIds).not.toContain('fda.metformin.contrast_discontinue');
  });

  it('contrast medication review cites the contrast instruction, not just renal bands', () => {
    const p = patient(42); p.customInputs = { contrastPlanned: true };
    const rec = reviewCurrentMedications(p, { egfr: 42 }, settings).find((r) => r.id.startsWith('med_review_contrast_metformin_hold'));
    expect(rec?.action).toBe('HOLD');
    expect(rec?.citationIds).toContain('fda.metformin.contrast_discontinue');
    expect(rec?.citationIds).not.toContain('fda.metformin.egfr_bands');
  });

  it('SGLT2i-only acidosis does not acquire a metformin contraindication citation', () => {
    const p = patient(42); p.hco3 = 10;
    p.currentMeds = [{ drugId: 'dapagliflozin', dose: 10, unit: 'mg', freq: 'qd' }];
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'dapagliflozin');
    expect(['HOLD', 'STOP', 'AVOID', 'DEFER']).toContain(rec?.action);
    expect(rec?.citationIds).not.toContain('fda.metformin.contra_renal_acidosis');
    expect(rec?.citationIds).not.toContain('fda.metformin.contrast_discontinue');
  });
});
