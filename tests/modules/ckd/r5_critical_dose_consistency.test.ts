import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { evaluateSafetyGates } from '../../../src/engine/safety/gates';
import type { CurrentMed, Patient, Settings } from '../../../src/engine/types';

const settings: Settings = {
  setting: 'outpatient', profile: 'VN',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false,
};

function patient(egfr: number, med: CurrentMed): Patient {
  return {
    age: 62, sex: 'male', sbp: 132, dbp: 78, hr: 72, egfr, k: 4.4, uacr: 45,
    conditions: { ckd: true, dm: true }, selectedModules: ['ckd'], currentMeds: [med],
  };
}

describe('CKD R5 Critical: final plan renal dose consistency', () => {
  it.each([38, 18])('CKD-R5-R1-01: canagliflozin 300 mg/day at eGFR %s must not remain an active 300 mg order', (egfr) => {
    const plan = evaluate(patient(egfr, { drugId: 'canagliflozin', dose: 300, unit: 'mg', freq: '1 lần/ngày' }), settings);
    const rec = plan.recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(rec).toBeDefined();
    expect(rec?.action).toBe('REDUCE');
    expect(rec?.dose).toContain('100');
    expect(rec?.dose).not.toContain('300');
    expect(rec?.title).toMatch(/giảm/i);
    expect(rec?.rationale).toContain('100');
    expect(rec?.citationIds).toContain('fda.canagliflozin.table_1_renal_impairment');
    expect(rec?.citationIds).not.toContain('fda.dapagliflozin.ckd_dose');
  });

  it('CKD-R5-R1-02: Synjardy REDUCE must replace the old BID dose and continuation wording', () => {
    const plan = evaluate(patient(38, { drugId: 'empagliflozin_metformin', name: 'Synjardy', dose: '12.5/1000', unit: 'mg', freq: '2 lần/ngày' }), settings);
    const rec = plan.recommendations.find((r) => r.drugId === 'empagliflozin_metformin');
    expect(rec).toBeDefined();
    expect(rec?.action).toBe('REDUCE');
    expect(rec?.title).toMatch(/giảm/i);
    expect(rec?.dose).toMatch(/metformin.*1000/i);
    expect(rec?.dose).not.toContain('12.5/1000');
    expect(rec?.rationale).toMatch(/1000/);
    expect(rec?.rationale).not.toMatch(/tiếp tục duy trì để bảo tồn/i);
    expect(rec?.gates?.some((gate) => !gate.passed && gate.action === 'reduce')).toBe(true);
    expect(rec?.citationIds).toContain('kdigo.dm2.2022.metformin_halve_30_44');
    expect(rec?.citationIds).not.toContain('fda.metformin.egfr_bands');
    expect(plan.noteText).toContain(rec!.dose!);
  });

  it.each(['INTL', 'VN', 'US'] as const)('retains the renal correction across profile %s and CKD+DM2', (profile) => {
    const p = patient(38, { drugId: 'canagliflozin', dose: 300, unit: 'mg', freq: 'qd' });
    p.selectedModules = ['ckd', 'dm2'];
    const plan = evaluate(p, { ...settings, profile });
    const rec = plan.recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(rec?.action).toBe('REDUCE');
    expect(rec?.dose).toBe('100 mg 1 lần/ngày');
    expect(plan.recommendations.filter((r) => r.drugId === 'canagliflozin')).toHaveLength(1);
    expect(plan.noteText).toContain('100 mg 1 lần/ngày');
  });

  it.each([
    [59.9, 300, 'REDUCE'], [60, 300, 'CONTINUE'], [38, 100, 'CONTINUE'],
  ] as const)('canagliflozin boundary eGFR %s, dose %s gives %s', (egfr, dose, action) => {
    const rec = evaluate(patient(egfr, { drugId: 'canagliflozin', dose, unit: 'mg', freq: 'qd' }), settings)
      .recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(rec?.action).toBe(action);
    expect(rec?.dose).toContain(action === 'REDUCE' ? '100' : String(dose));
  });

  it.each([
    { drugId: 'invokana', dose: 0.3, unit: 'g', freq: 'qd' },
    { drugId: 'canagliflozin', dose: 100000, unit: 'mcg', freq: 'bid' },
  ])('normalizes canagliflozin aliases, mass units and frequency: %j', (med) => {
    const rec = evaluate(patient(38, med), settings).recommendations.find((r) => r.drugId === med.drugId || r.drugId === 'canagliflozin');
    expect(rec?.action).toBe('REDUCE');
    expect(rec?.dose).toBe('100 mg 1 lần/ngày');
  });

  it.each([
    { drugId: 'canagliflozin', dose: 300, unit: 'mg' },
    { drugId: 'canagliflozin', freq: 'qd' },
    { drugId: 'synjardy', name: 'Synjardy', dose: '12.5/1000', unit: 'mg' },
    { drugId: 'empagliflozin_metformin', dose: '1 viên', freq: 'bid' },
  ])('unknown dose or frequency requires verification without an invented order: %j', (med) => {
    const rec = evaluate(patient(38, med), settings).recommendations.find((r) => r.drugId === med.drugId || r.drugId === 'empagliflozin_metformin');
    expect(rec?.action).toBe('DEFER');
    expect(rec?.dose).toBeUndefined();
  });

  it.each(['rifampin', 'rifampicin', 'phenytoin', 'phenobarbital', 'ritonavir', 'dilantin', 'norvir', 'rifadin'])('UGT exception %s requires verification, not an automatic 100 mg cap', (drugId) => {
    const p = patient(38, { drugId: 'canagliflozin', dose: 200, unit: 'mg', freq: 'qd' });
    p.currentMeds.push({ drugId });
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(rec?.action).toBe('DEFER');
    expect(rec?.dose).toBeUndefined();
    expect(rec?.rationale).toContain('UGT');
    expect(rec?.citationIds).toContain('fda.canagliflozin.ugt_inducer_renal_dosing');
  });

  it.each(['synjardy', 'empagliflozin_metformin', 'dapagliflozin_metformin', 'canagliflozin_metformin'])('FDC %s never retains the old high metformin dose after reduction', (drugId) => {
    const p = patient(38, { drugId, dose: '12.5/1000', unit: 'mg', freq: 'bid' });
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === drugId || (drugId === 'synjardy' && r.drugId === 'empagliflozin_metformin'));
    expect(rec?.action).toBe('REDUCE');
    expect(rec?.dose).toContain('Metformin ≤ 1000 mg/ngày');
    expect(rec?.dose).not.toContain('12.5/1000');
    expect(rec?.title).toMatch(/giảm/i);
  });

  it.each([[29.9, 'STOP'], [30, 'REDUCE'], [44.9, 'REDUCE'], [45, 'CONTINUE']] as const)('metformin FDC boundary %s gives %s', (egfr, action) => {
    const p = patient(egfr, { drugId: 'empagliflozin_metformin', dose: '12.5/1000', unit: 'mg', freq: 'bid' });
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin_metformin');
    expect(rec?.action).toBe(action);
    if (action === 'STOP') {
      expect(rec?.dose).toBeUndefined();
      expect(rec?.citationIds).not.toContain('fda.metformin.egfr_bands');
    }
  });

  it('does not reduce a known 1000 mg/day metformin regimen and sums all metformin products', () => {
    const p = patient(38, { drugId: 'empagliflozin_metformin', dose: '12.5/500', unit: 'mg', freq: 'bid' });
    expect(evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin_metformin')?.action).toBe('CONTINUE');
    p.currentMeds.push({ drugId: 'metformin', dose: 500, unit: 'mg', freq: 'qd' });
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'empagliflozin_metformin');
    expect(rec?.action).toBe('REDUCE');
    expect(rec?.rationale).toContain('1500 mg/ngày');
    expect(rec?.dose).toContain('Tổng liều từ mọi thuốc');
  });

  it.each(['dapagliflozin', 'empagliflozin'])('continuation cites the matching %s label, not another SGLT2i label', (drugId) => {
    const rec = evaluate(patient(38, { drugId, dose: 10, unit: 'mg', freq: 'qd' }), settings).recommendations.find((r) => r.drugId === drugId);
    expect(rec?.action).toBe('CONTINUE');
    expect(rec?.citationIds).toContain(`fda.${drugId}.ckd_dose`);
    if (drugId !== 'dapagliflozin') expect(rec?.citationIds).not.toContain('fda.dapagliflozin.ckd_dose');
  });

  it.each(['onDialysis', 'dkaSuspected', 'akiSuspected', 'pregnant'] as const)('stronger safety %s keeps all doses cleared', (condition) => {
    const p = patient(38, { drugId: 'canagliflozin', dose: 300, unit: 'mg', freq: 'qd' });
    p.conditions![condition] = true;
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(rec).toBeDefined();
    expect(['STOP', 'AVOID', 'HOLD', 'DEFER']).toContain(rec?.action);
    expect(rec?.dose).toBeUndefined();
  });

  it('shared gate checks proposed escalation even with a currently safe daily dose', () => {
    const p = patient(38, { drugId: 'canagliflozin', dose: 100, unit: 'mg', freq: 'qd' });
    const result = evaluateSafetyGates({ id: 'r5_proposed', module: 'dm2', tier: 'Test', tierOrder: 1,
      action: 'UPTITRATE', drugId: 'canagliflozin', title: 'Tăng Canagliflozin', dose: '300 mg 1 lần/ngày',
      rationale: 'Proposed escalation', gates: [], citationIds: [], priority: 80 }, p, { egfr: 38 }, settings);
    expect(result.updatedRec.action).toBe('DEFER');
    expect(result.updatedRec.dose).toBeUndefined();
    expect(result.allPassed).toBe(false);
  });

  it('true hypotension overrides a renal reduction and clears the prescribed dose', () => {
    const p = patient(38, { drugId: 'canagliflozin', dose: 300, unit: 'mg', freq: 'qd' });
    p.sbp = 82;
    const rec = evaluate(p, settings).recommendations.find((r) => r.drugId === 'canagliflozin');
    expect(['HOLD', 'DEFER', 'STOP', 'AVOID']).toContain(rec?.action);
    expect(rec?.dose).toBeUndefined();
  });

  it('proposed metformin total includes the unchanged product', () => {
    const p = patient(38, { drugId: 'metformin', dose: 500, unit: 'mg', freq: 'qd' });
    p.currentMeds.push({ drugId: 'sitagliptin_metformin', dose: '50/500', unit: 'mg', freq: 'qd' });
    const result = evaluateSafetyGates({ id: 'r5_total_proposed', module: 'dm2', tier: 'Test',
      action: 'UPTITRATE', drugId: 'metformin', title: 'Tăng Metformin', dose: '1000 mg 1 lần/ngày',
      rationale: 'Replace the single-ingredient dose; FDC remains', gates: [], citationIds: [], priority: 80 }, p, { egfr: 38 }, settings);
    expect(result.updatedRec.action).toBe('DEFER');
    expect(result.updatedRec.dose).toBeUndefined();
  });

  it.each(['metformin', 'canagliflozin'])('a proposed %s monotherapy change cannot silently replace an existing FDC', (drugId) => {
    const p = patient(38, { drugId: 'canagliflozin_metformin', dose: '50/500', unit: 'mg', freq: 'bid' });
    const result = evaluateSafetyGates({ id: 'r5_ambiguous_replacement', module: 'dm2', tier: 'Test',
      action: 'UPTITRATE', drugId, title: `Tăng ${drugId}`, dose: drugId === 'metformin' ? '1000 mg 1 lần/ngày' : '100 mg 1 lần/ngày',
      rationale: 'An FDC is present; no explicit replacement instruction', gates: [], citationIds: [], priority: 80 }, p, { egfr: 38 }, settings);
    expect(result.updatedRec.action).toBe('DEFER');
    expect(result.updatedRec.dose).toBeUndefined();
    expect(result.updatedRec.rationale).toMatch(/phối hợp/);
  });
});
