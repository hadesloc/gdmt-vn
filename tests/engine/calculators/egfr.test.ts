import { describe, it, expect } from 'vitest';
import { calculateEgfrCys, computeEgfr } from '../../../src/engine/calculators/egfr';
import { derivePatientData } from '../../../src/engine/derive';

describe('Engine Calculators - CKD-EPI 2012 Cystatin C (-1.328) & Direct patient.egfr Derivation', () => {
  it('CKD-R3-R3-01: uses exponent -1.328 for Cystatin C > 0.8 mg/L (Inker NEJM 2012 & KDIGO 2024 Table 14)', () => {
    // 133 * (2.1 / 0.8)^(-1.328) * 0.996^68 = 28.1 mL/min/1.73m2 (G4)
    const cys21 = calculateEgfrCys(2.1, 68, 'male');
    expect(cys21).toBe(28.1);

    // 133 * (3.5 / 0.8)^(-1.328) * 0.996^68 = 14.3 mL/min/1.73m2 (G5)
    const cys35 = calculateEgfrCys(3.5, 68, 'male');
    expect(cys35).toBe(14.3);

    const computed = computeEgfr({ scr: 180, age: 68, sex: 'male', cystatinC: 2.1 });
    expect(computed.egfrCys).toBe(28.1);

    const derivedCysOnly = derivePatientData({
      age: 68,
      sex: 'male',
      cystatinC: 2.1,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { ckd: true }
    });
    expect(derivedCysOnly.egfrCys).toBe(28.1);
    expect(derivedCysOnly.egfr).toBe(28.1);
    expect(derivedCysOnly.kdigoG).toBe('G4');
    expect(derivedCysOnly.ckdGStage).toBe('G4');
  });

  it('CKD-R3-R2-05: preserves direct patient.egfr (> 0 and finite) in derivePatientData when scr and cystatinC are absent', () => {
    const derivedG4 = derivePatientData({
      age: 70,
      sex: 'female',
      egfr: 24,
      uacr: 42,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { ckd: true }
    });

    expect(derivedG4.egfrCr).toBeUndefined();
    expect(derivedG4.egfrCys).toBeUndefined();
    expect(derivedG4.egfr).toBe(24);
    expect(derivedG4.kdigoG).toBe('G4');
    expect(derivedG4.ckdGStage).toBe('G4');
    expect(derivedG4.kdigoA).toBe('A3');

    // Invalid direct egfr (<= 0 or NaN) must fail closed (remain undefined)
    const derivedInvalid = derivePatientData({
      age: 70,
      sex: 'female',
      egfr: 0,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { ckd: true }
    });
    expect(derivedInvalid.egfr).toBeUndefined();
    expect(derivedInvalid.kdigoG).toBeUndefined();
    expect(derivedInvalid.ckdGStage).toBeUndefined();
  });
});
