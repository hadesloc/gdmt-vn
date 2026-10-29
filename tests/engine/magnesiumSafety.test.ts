import { describe, expect, it } from 'vitest';
import { evaluateSafetyGates } from '../../src/engine/safety/gates';
import { derivePatientData } from '../../src/engine/derive';
import type { Patient, Recommendation, Settings } from '../../src/engine/types';
const settings: Settings = { setting: 'inpatient', profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false };
const p: Patient = { id: 'mg-gate', age: 40, sex: 'female', weight: 60, sbp: 125, hr: 100,
  scr: 70, k: 4.2, currentMeds: [], selectedModules: ['htn'], conditions: {} };
const candidate: Recommendation = { id: 'mg-candidate', module: 'htn', action: 'START',
  drugId: 'magnesium_sulfate', title: 'MgSO4', rationale: 'candidate', dose: 'test-dose',
  tier: 'Test', tierOrder: 1, priority: 90, gates: [], citationIds: ['who.mgso4.contra_brady_conduction_renal'] };
function gate(patient: Patient) { return evaluateSafetyGates(candidate, patient, derivePatientData(patient, settings), settings).updatedRec; }
describe('MgSO4: cổng an toàn dùng chung', () => {
  it.each(['myastheniaGravis', 'myasthenia_gravis', 'avBlock2Or3', 'sickSinusSyndrome'])('chặn %s ngoài module Hen', (flag) => {
    const result = gate({ ...p, conditions: { [flag]: true } });
    expect(result.action).toBe('AVOID'); expect(result.dose).toBeUndefined();
  });
  it('chặn nhịp chậm 49 ngoài module Hen', () => {
    const result = gate({ ...p, hr: 49 });
    expect(result.action).toBe('AVOID'); expect(result.dose).toBeUndefined();
  });
  it('không chặn thuốc chỉ vì đây là bệnh nhân không có module Hen', () => {
    expect(gate(p).action).toBe('START');
  });
});
