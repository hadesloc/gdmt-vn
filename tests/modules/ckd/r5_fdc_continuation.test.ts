import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { CurrentMed, Patient, Settings } from '../../../src/engine/types';

const settings: Settings = { setting: 'outpatient', profile: 'VN',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false };
const patient = (egfr: number): Patient => ({ age: 62, sex: 'male', egfr, sbp: 132, dbp: 78, hr: 72,
  k: 4.4, uacr: 45, conditions: { ckd: true, dm: true }, selectedModules: ['ckd'],
  currentMeds: [{ drugId: 'empagliflozin_metformin', name: 'Synjardy', dose: '12.5/1000', unit: 'mg', freq: 'bid' },
    { drugId: 'losartan', dose: 100, unit: 'mg', freq: 'qd' }] });

describe('CKD-R5-R1-03: keep the established SGLT2 component after stopping metformin FDC', () => {
  it.each([18, 19.9])('eGFR %s: stops Synjardy and actually provides the promised single-ingredient continuation', (egfr) => {
    const plan = evaluate(patient(egfr), settings);
    const fdc = plan.recommendations.find((r) => r.drugId === 'empagliflozin_metformin');
    const single = plan.recommendations.find((r) => r.drugId === 'empagliflozin');
    expect(fdc?.action).toBe('STOP');
    expect(fdc?.dose).toBeUndefined();
    expect(single).toBeDefined();
    expect(['SWITCH', 'CONTINUE']).toContain(single?.action);
    expect(single?.switchFrom).toBe('empagliflozin_metformin');
    expect(single?.dose).toContain('10');
    expect(single?.citationIds).toContain('kdigo.ckd.2024.pp_3_7_1_continue_below_20');
    expect(plan.noteText).toContain('Empagliflozin');
    expect(plan.noteText).toContain(single!.dose!);
  });

  it.each(['INTL', 'VN', 'US'] as const)('preserves the same component across profile %s and CKD+DM2+HF', (profile) => {
    const p = patient(18);
    p.selectedModules = ['ckd', 'dm2', 'hf']; p.conditions.hf = true; p.lvef = 35;
    const plan = evaluate(p, { ...settings, profile });
    const singles = plan.recommendations.filter((r) => ['dapagliflozin', 'empagliflozin'].includes(r.drugId || '') && ['START', 'SWITCH', 'CONTINUE'].includes(r.action));
    expect(singles).toHaveLength(1);
    expect(singles[0].drugId).toBe('empagliflozin');
    expect(singles[0].action).toBe('SWITCH');
    expect(singles[0].dose).toContain('10');
  });

  it.each([
    { drugId: 'synjardy', dose: '12.5/1000', unit: 'mg', freq: 'bid' },
    { drugId: 'synjardy_xr', dose: '25/1000', unit: 'mg', freq: 'qd' },
    { drugId: 'dapagliflozin_metformin', dose: '5/1000', unit: 'mg', freq: 'bid' },
    { drugId: 'xigduo_xr', dose: '10/1000', unit: 'mg', freq: 'qd' },
  ])('uses the existing component, not an alternative SGLT2i: %j', (med) => {
    const p = patient(18); p.currentMeds = [med];
    const expected = med.drugId.includes('synjardy') ? 'empagliflozin' : 'dapagliflozin';
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === expected);
    expect(rec?.action).toBe('SWITCH'); expect(rec?.dose).toContain('10');
    expect(rec?.citationIds).toContain(`fda.${expected}.ckd_dose`);
  });

  it.each([
    { drugId: 'empagliflozin_metformin', dose: '12.5/1000', unit: 'mg' },
    { drugId: 'empagliflozin_metformin', freq: 'bid' },
    { drugId: 'empagliflozin_metformin', dose: '1 viên', freq: 'bid' },
    { drugId: 'dapagliflozin_metformin', dose: '5/1000', unit: 'mg', freq: 'qd' },
  ])('requires verification when daily dose is unknown or switching would increase it: %j', (med: CurrentMed) => {
    const p = patient(18); p.currentMeds = [med];
    const rec = evaluate(p, settings).recommendations.find((r) => r.id.startsWith('rec_ckd_sglt2i_fdc_bridge'));
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined(); expect(rec?.switchFrom).toBeUndefined();
  });

  it.each(['canagliflozin_metformin', 'invokamet', 'invokamet_xr'])('makes canagliflozin continuation requirements explicit: %s', (drugId) => {
    const p = patient(18); p.currentMeds = [{ drugId, dose: '150/1000', unit: 'mg', freq: 'bid' }];
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined();
    expect(rec?.rationale).toContain('UACR không tự chứng minh'); expect(rec?.rationale).toContain('UGT');
  });

  it.each([
    { conditions: { onDialysis: true } }, { conditions: { pregnant: true } },
    { conditions: { breastfeeding: true } }, { conditions: { plannedSurgery: true } },
    { conditions: { akiSuspected: true } }, { conditions: { dkaSuspected: true } },
    { conditions: { allergySglt2i: true } }, { allergies: ['empagliflozin'] },
    { sbp: 80 }, { hco3: 9 }, { k: 6.5 },
  ])('never bridges past a stronger safety condition: %j', (patch) => {
    const p = { ...patient(18), ...patch, conditions: { ...patient(18).conditions, ...patch.conditions } };
    const plan = evaluate(p, settings);
    expect(plan.recommendations.filter((r) => r.id.startsWith('rec_ckd_sglt2i_fdc_bridge'))).toHaveLength(0);
    expect(plan.recommendations.some((r) => ['empagliflozin', 'dapagliflozin'].includes(r.drugId || '') && ['SWITCH', 'START', 'CONTINUE'].includes(r.action))).toBe(false);
  });

  it.each([0, 20, 24, 30])('does not apply the below-20 bridge at eGFR %s', (egfr) => {
    const plan = evaluate(patient(egfr), settings);
    expect(plan.recommendations.some((r) => r.id.startsWith('rec_ckd_sglt2i_fdc_bridge'))).toBe(false);
  });

  it('does not initiate a new SGLT2i below 20 when only metformin was being taken', () => {
    const p = patient(18); p.currentMeds = [{ drugId: 'metformin', dose: 1000, unit: 'mg', freq: 'bid' }];
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => ['empagliflozin', 'dapagliflozin', 'canagliflozin'].includes(r.drugId || '') && ['START', 'SWITCH', 'CONTINUE'].includes(r.action))).toBe(false);
  });

  it('does not duplicate an existing single agent when stopping its FDC', () => {
    const p = patient(18); p.currentMeds.push({ drugId: 'empagliflozin', dose: 10, unit: 'mg', freq: 'qd' });
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.id.startsWith('rec_ckd_sglt2i_fdc_bridge'))).toBe(false);
    expect(plan.recommendations.filter((r) => r.drugId === 'empagliflozin' && r.action === 'CONTINUE')).toHaveLength(1);
  });

  it('defers multiple FDCs instead of inventing a replacement regimen', () => {
    const p = patient(18); p.currentMeds.push({ drugId: 'dapagliflozin_metformin', dose: '5/1000', unit: 'mg', freq: 'bid' });
    const rec = evaluate(p, settings).recommendations.find((r) => r.id.startsWith('rec_ckd_sglt2i_fdc_bridge'));
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined();
  });

  it.each(['ckd+dm2', 'ckd+hf', 'ckd+dm2+hf', 'dm2', 'hf'])('unknown dose stays DEFER after merging %s', (modules) => {
    const p = patient(18); p.selectedModules = modules.split('+') as Patient['selectedModules'];
    p.conditions.hf = true; p.lvef = 35; p.currentMeds[0].freq = undefined;
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin');
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined(); expect(rec?.switchFrom).toBeUndefined();
    expect(rec?.rationale).not.toMatch(/cần kê riêng viên đơn chất.*để duy trì liên tục/i);
  });

  it.each(['dm2', 'hf'] as const)('keeps perioperative safety when %s proposes a SWITCH', (module) => {
    const p = patient(18); p.selectedModules = [module]; p.conditions.hf = true; p.conditions.plannedSurgery = true; p.lvef = 35;
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin');
    if (rec) { expect(['DEFER', 'HOLD', 'STOP', 'AVOID']).toContain(rec.action); expect(rec.dose).toBeUndefined(); expect(rec.switchFrom).toBeUndefined(); }
    expect(evaluate(p, settings).recommendations.some((r) => /gliflozin/.test(r.drugId || '') && ['START', 'SWITCH', 'CONTINUE'].includes(r.action))).toBe(false);
  });

  it('requires verification if an alternative monotherapy is stopped for allergy', () => {
    const p = patient(18); p.currentMeds.push({ drugId: 'dapagliflozin', dose: 10, unit: 'mg', freq: 'qd' }); p.allergies = ['dapagliflozin'];
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin');
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined();
  });

  it.each(['synjardy', 'metformin'])('does not assume SGLT2 tolerance after allergy to %s', (allergy) => {
    const p = patient(18); p.allergies = [allergy];
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin');
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined(); expect(rec?.rationale).toContain('dị ứng');
  });
});
