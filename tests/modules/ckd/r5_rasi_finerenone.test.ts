import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

const settings: Settings = { setting: 'outpatient', profile: 'VN',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false };
function patient(): Patient { return { age: 62, sex: 'male', egfr: 45, sbp: 128, dbp: 78, hr: 72, k: 4.3, uacr: 50,
  conditions: { ckd: true, dm: true }, selectedModules: ['ckd'],
  currentMeds: [{ drugId: 'losartan', dose: 50, unit: 'mg', freq: 'qd' }] }; }

describe('CKD-R5-R1-04: RASi and finerenone agree about feasible optimization', () => {
  it('does not demand RASi escalation when orthostatic hypotension prevents it', () => {
    const p = patient(); p.conditions.orthostaticHypotension = true;
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'UPTITRATE')).toBe(false);
    const fine = plan.recommendations.find((r) => r.drugId === 'finerenone');
    expect(fine).toBeDefined();
    expect(fine?.rationale).toMatch(/hạ huyết áp tư thế/i);
    expect(fine?.rationale).not.toContain('Losartan hiện mới ở liều');
    expect(fine?.action).toBe('DEFER'); expect(fine?.dose).toBeUndefined();
    expect(fine?.gates.some((g) => g.parameter === 'RASi_Max_Tolerated' && !g.passed)).toBe(true);
  });

  it('does not impose a fictitious 16 mg candesartan maintenance ceiling in Child-Pugh B', () => {
    const p = patient(); p.sbp = 132; p.customInputs = { childPugh: 'B' };
    p.currentMeds = [{ drugId: 'candesartan', dose: 16, unit: 'mg', freq: 'qd' }];
    const plan = evaluate(p, settings);
    const rasi = plan.recommendations.find((r) => r.drugId === 'candesartan');
    expect(rasi?.action).toBe('UPTITRATE');
    expect(rasi?.dose).toContain('32');
    expect(rasi?.rationale).toContain('chuẩn độ thận trọng');
    expect(rasi?.citationIds).toContain('fda.candesartan.moderate_hepatic_start');
    const fine = plan.recommendations.find((r) => r.drugId === 'finerenone');
    expect(fine?.action).toBe('DEFER');
  });

  it.each(['INTL', 'VN', 'US'] as const)('explicit maximum tolerated dose resolves the orthostatic path in %s', (profile) => {
    const p = patient(); p.conditions.orthostaticHypotension = true; p.customInputs = { rasiMaxTolerated: true };
    const plan = evaluate(p, { ...settings, profile });
    expect(plan.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'UPTITRATE')).toBe(false);
    const fine = plan.recommendations.find((r) => r.drugId === 'finerenone');
    expect(fine?.action).toBe('START'); expect(fine?.dose).toContain('10');
    expect(fine?.rationale).not.toContain('Losartan hiện mới ở liều');
    expect(plan.noteText).toContain(fine!.dose!);
  });

  it.each(['INTL', 'VN', 'US'] as const)('candesartan 16 to 32 mg remains feasible in Child-Pugh B, profile %s', (profile) => {
    const p = patient(); p.customInputs = { childPugh: 'B' }; p.currentMeds = [{ drugId: 'candesartan', dose: 16, unit: 'mg', freq: 'qd' }];
    const plan = evaluate(p, { ...settings, profile });
    expect(plan.recommendations.find((r) => r.drugId === 'candesartan')?.action).toBe('UPTITRATE');
    expect(plan.recommendations.find((r) => r.drugId === 'finerenone')?.action).toBe('DEFER');
    p.currentMeds[0].dose = 32;
    const optimized = evaluate(p, { ...settings, profile });
    expect(optimized.recommendations.some((r) => r.drugId === 'candesartan' && r.action === 'UPTITRATE')).toBe(false);
    expect(optimized.recommendations.find((r) => r.drugId === 'finerenone')?.action).toBe('START');
  });

  it.each([
    { dose: 8, freq: 'bid' }, { dose: 16, freq: 'qd' },
  ])('uses candesartan total daily dose and preserves optimization: %j', ({ dose, freq }) => {
    const p = patient(); p.customInputs = { childPugh: 'B' }; p.currentMeds = [{ drugId: 'candesartan', dose, unit: 'mg', freq }];
    const plan = evaluate(p, settings);
    expect(plan.recommendations.find((r) => r.drugId === 'candesartan')?.dose).toContain('32');
    expect(plan.recommendations.find((r) => r.drugId === 'finerenone')?.rationale).toContain('16 mg/ngày');
  });

  it('recognizes candesartan 16 mg BID as reaching 32 mg/day', () => {
    const p = patient(); p.customInputs = { childPugh: 'B' }; p.currentMeds = [{ drugId: 'candesartan', dose: 16, unit: 'mg', freq: 'bid' }];
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.drugId === 'candesartan' && r.action === 'UPTITRATE')).toBe(false);
    expect(plan.recommendations.find((r) => r.drugId === 'finerenone')?.action).toBe('START');
  });

  it('uses the same telmisartan hepatic ceiling before titration and finerenone', () => {
    const p = patient(); p.customInputs = { childPugh: 'B' }; p.currentMeds = [{ drugId: 'telmisartan', dose: 40, unit: 'mg', freq: 'qd' }];
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.drugId === 'telmisartan' && r.action === 'UPTITRATE')).toBe(false);
    expect(plan.recommendations.find((r) => r.drugId === 'finerenone')?.action).toBe('START');
  });

  it.each([
    { sbp: 90 }, { sbp: undefined }, { k: 5.1 }, { k: undefined }, { egfr: 24 },
    { conditions: { akiSuspected: true } }, { conditions: { onDialysis: true } }, { conditions: { pregnant: true } },
    { conditions: { adrenalInsufficiency: true } }, { conditions: { breastfeeding: true } },
    { customInputs: { childPugh: 'C' } },
  ])('confirmed RASi tolerance never overrides a finerenone safety gate: %j', (patch) => {
    const p: Patient = { ...patient(), ...patch,
      conditions: { ...patient().conditions, orthostaticHypotension: true, ...patch.conditions },
      customInputs: { rasiMaxTolerated: true, ...patch.customInputs } };
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.drugId === 'finerenone' && ['START', 'UPTITRATE', 'CONTINUE'].includes(r.action))).toBe(false);
    expect(plan.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'UPTITRATE')).toBe(false);
  });

  it('an unparsed RASi dose cannot be cleared by the tolerance checkbox', () => {
    const p = patient(); p.customInputs = { rasiMaxTolerated: true }; p.currentMeds[0].dose = '1 viên';
    const fine = evaluate(p, settings).recommendations.find((r) => r.drugId === 'finerenone');
    expect(fine?.action).toBe('DEFER'); expect(fine?.dose).toBeUndefined(); expect(fine?.rationale).toContain('Chưa xác định');
  });

  it('a confirmed tolerance flag cannot clear a dose above the hepatic ceiling', () => {
    const p = patient(); p.customInputs = { rasiMaxTolerated: true, childPugh: 'B' };
    p.currentMeds = [{ drugId: 'telmisartan', dose: 80, unit: 'mg', freq: 'qd' }];
    const fine = evaluate(p, settings).recommendations.find((r) => r.drugId === 'finerenone');
    expect(fine?.action).toBe('DEFER'); expect(fine?.dose).toBeUndefined(); expect(fine?.rationale).toContain('vượt trần');
  });

  it('a tolerated subtarget candesartan dose permits finerenone without requiring 32 mg', () => {
    const p = patient(); p.customInputs = { rasiMaxTolerated: true, childPugh: 'B' };
    p.currentMeds = [{ drugId: 'candesartan', dose: 16, unit: 'mg', freq: 'qd' }];
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.drugId === 'candesartan' && r.action === 'UPTITRATE')).toBe(false);
    expect(plan.recommendations.find((r) => r.drugId === 'finerenone')?.action).toBe('START');
  });

  it.each(['INTL', 'VN', 'US'] as const)('multi-module merge preserves the orthostatic prerequisite in %s', (profile) => {
    const p = patient(); p.conditions.orthostaticHypotension = true; p.selectedModules = ['ckd', 'dm2', 'htn'];
    const plan = evaluate(p, { ...settings, profile });
    const fine = plan.recommendations.find((r) => r.drugId === 'finerenone');
    expect(fine?.action).toBe('DEFER'); expect(fine?.dose).toBeUndefined();
    expect(plan.noteText).toContain('hạ huyết áp tư thế');
    expect(plan.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'UPTITRATE')).toBe(false);
  });

  it('uses only the candesartan component dose when titrating an FDC', () => {
    const p = patient(); p.customInputs = { childPugh: 'B' };
    p.currentMeds = [{ drugId: 'candesartan_hctz', dose: '16/12.5', unit: 'mg', freq: 'qd' }];
    const plan = evaluate(p, settings);
    expect(plan.recommendations.find((r) => r.drugId === 'candesartan_hctz')?.action).toBe('UPTITRATE');
    expect(plan.recommendations.find((r) => r.drugId === 'finerenone')?.rationale).toContain('16 mg/ngày');
  });
});
