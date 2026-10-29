import { describe, it, expect } from 'vitest';
import {
  crMgDlToUmolL,
  crUmolLToMgDl,
  glucoseMgDlToMmolL,
  glucoseMmolLToMgDl,
  cholMgDlToMmolL,
  cholMmolLToMgDl,
  tgMgDlToMmolL,
  tgMmolLToMgDl,
  uratMgDlToUmolL,
  uratUmolLToMgDl,
  uacrMgGToMgMmol,
  uacrMgMmolToMgG,
  hba1cPercentToMmolMol,
  hba1cMmolMolToPercent,
  normalizePatientUnits,
  denormalizePatientFromSi
} from '../../src/engine/units';
import { derivePatientData } from '../../src/engine/derive';
import type { Patient, UnitSettings, ModuleInputField } from '../../src/engine/types';

describe('Engine - Units conversion', () => {
  it('converts Creatinin accurately (factor 88.42)', () => {
    // 1.0 mg/dL = 88.42 µmol/L
    expect(crMgDlToUmolL(1.0)).toBe(88.42);
    expect(crUmolLToMgDl(88.42)).toBe(1.0);

    // 1.5 mg/dL = 132.63 µmol/L -> round-trips to exact 1.5000 mg/dL (>= 1.5 for Apixaban ABC!)
    expect(crMgDlToUmolL(1.5)).toBe(132.63);
    expect(crUmolLToMgDl(132.63)).toBe(1.5);
  });

  it('converts Glucose accurately (factor 18.0)', () => {
    // 180 mg/dL = 10.0 mmol/L
    expect(glucoseMgDlToMmolL(180)).toBe(10);
    expect(glucoseMmolLToMgDl(10)).toBe(180);

    // 126 mg/dL = 7.0 mmol/L
    expect(glucoseMgDlToMmolL(126)).toBe(7);
    expect(glucoseMmolLToMgDl(7)).toBe(126);
  });

  it('converts Cholesterol accurately with 4-decimal precision (LIPID-R2-R3-13, factor 38.67)', () => {
    // 200 mg/dL = 5.172 mmol/L; 55 mg/dL = 1.4223 mmol/L (preserves > 1.4 threshold!)
    expect(cholMgDlToMmolL(200)).toBe(5.172);
    expect(cholMgDlToMmolL(55)).toBe(1.4223);
    expect(cholMmolLToMgDl(5.172)).toBe(200);
  });

  it('converts Triglycerides accurately with 4-decimal precision (LIPID-R2-R3-13, factor 88.57)', () => {
    // 150 mg/dL = 1.6936 mmol/L (preserves < 1.7 threshold!)
    expect(tgMgDlToMmolL(150)).toBe(1.6936);
    expect(tgMmolLToMgDl(1.6936)).toBe(150);
  });

  it('converts Uric Acid accurately (factor 59.48)', () => {
    // 6.0 mg/dL ~ 356.9 µmol/L
    expect(uratMgDlToUmolL(6.0)).toBe(356.9);
    expect(uratUmolLToMgDl(356.9)).toBe(6.0);
  });

  it('converts UACR accurately (factor 8.84)', () => {
    // 30 mg/g ~ 3.39 mg/mmol
    expect(uacrMgGToMgMmol(30)).toBe(3.39);
    expect(uacrMgMmolToMgG(30)).toBe(265.2);
  });

  it('converts HbA1c % ↔ mmol/mol (IFCC formula)', () => {
    // 7.0% NGSP ~ 53 mmol/mol IFCC
    expect(hba1cPercentToMmolMol(7.0)).toBe(53);
    expect(hba1cMmolMolToPercent(53)).toBe(7.0);

    // 6.5% ~ 48 mmol/mol
    expect(hba1cPercentToMmolMol(6.5)).toBe(48);
    expect(hba1cMmolMolToPercent(48)).toBe(6.5);
  });

  it('normalizes patient input with standard units conversion', () => {
    const rawPatient: Patient = {
      age: 65,
      sex: 'male',
      scr: 1.2, // entered as mg/dL
      glucose: 180, // entered as mg/dL
      tc: 200, // entered as mg/dL
      uricAcid: 7.0, // entered as mg/dL
      uacr: 300, // entered as mg/g
      hba1c: 53, // entered as mmol/mol
      currentMeds: [],
      selectedModules: ['dm2', 'ckd'],
      conditions: {}
    };

    const usUnits: UnitSettings = {
      cr: 'mg_dL',
      glucose: 'mg_dL',
      lipid: 'mg_dL',
      urat: 'mg_dL',
      uacr: 'mg_g',
      hba1c: 'mmol_mol'
    };

    const norm = normalizePatientUnits(rawPatient, usUnits);
    expect(norm.scr).toBe(106.1); // 1.2 * 88.42 = 106.10 -> 106.1
    expect(norm.glucose).toBe(10); // 180 / 18
    expect(norm.tc).toBe(5.172); // 200 / 38.67 (4 decimals)
    expect(norm.uricAcid).toBe(416.4); // 7.0 * 59.48
    expect(norm.uacr).toBe(33.94); // 300 / 8.84
    expect(norm.hba1c).toBe(7.0); // 53 mmol/mol -> 7.0%
  });

  it('CKD-R2-R1-01: normalizes customInputs fields with unitKey (baselineScr, baselineLdl, nonHdl, custom fields) without mutating raw patient', () => {
    const rawPatient: Patient = {
      age: 68,
      sex: 'male',
      scr: 1.5, // mg/dL -> 132.6 umol/L
      currentMeds: [],
      selectedModules: ['ckd', 'lipid'],
      conditions: { ckd: true },
      customInputs: {
        baselineScr: 1.0, // mg/dL -> 88.4 umol/L (delta = +44.2 >= 26.5 -> AKI!)
        baselineLdl: 100, // mg/dL -> 2.586 mmol/L
        nonHdl: '130', // numeric string mg/dL -> 3.3618 mmol/L
        customGlucosePeak: 180
      }
    };

    const customFields: ModuleInputField[] = [
      { id: 'customGlucosePeak', labelVi: 'Đỉnh glucose', type: 'number', unitKey: 'glucose' }
    ];

    const usUnits: UnitSettings = {
      cr: 'mg_dL',
      glucose: 'mg_dL',
      lipid: 'mg_dL',
      urat: 'mg_dL',
      uacr: 'mg_g',
      hba1c: 'pct'
    };

    const norm = normalizePatientUnits(rawPatient, usUnits, customFields);
    expect(norm.scr).toBe(132.63);
    expect(norm.customInputs?.baselineScr).toBe(88.42);
    expect(norm.customInputs?.baselineLdl).toBe(2.586);
    expect(norm.customInputs?.nonHdl).toBe(3.3618);
    expect(norm.customInputs?.customGlucosePeak).toBe(10);
    // Raw patient must not be mutated
    expect(rawPatient.customInputs?.baselineScr).toBe(1.0);
  });

  it('CKD-R2-R3-10 & CKD-R3-R3-01: computes egfrCys independently with Inker 2012 exponent -1.328 when scr is undefined', () => {
    const derived = derivePatientData({
      age: 65,
      sex: 'male',
      cystatinC: 1.25,
      scr: undefined,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { ckd: true }
    });

    expect(derived.egfrCr).toBeUndefined();
    // 133 * (1.25 / 0.8)^(-1.328) * 0.996^65 = 56.7 mL/min/1.73m²
    expect(derived.egfrCys).toBe(56.7);
    expect(derived.egfr).toBe(derived.egfrCys);
    expect(derived.ckdGStage).toBe('G3a');
  });

  it('CKD-R3-R3-02: denormalizePatientFromSi -> normalizePatientUnits round-trips all 4 CKD SI presets losslessly in mg_dL / mg_g mode', () => {
    const usUnits: UnitSettings = {
      cr: 'mg_dL',
      glucose: 'mg_dL',
      lipid: 'mg_dL',
      urat: 'mg_dL',
      uacr: 'mg_g',
      hba1c: 'pct'
    };

    const ckdSiPresets: Patient[] = [
      {
        age: 66,
        sex: 'male',
        sbp: 142,
        dbp: 84,
        scr: 165,
        uacr: 45,
        glucose: 8.4,
        hba1c: 7.8,
        k: 4.6,
        currentMeds: [],
        selectedModules: ['ckd', 'dm2'],
        conditions: { ckd: true, dm: true, htn: true }
      },
      {
        age: 62,
        sex: 'female',
        sbp: 126,
        dbp: 76,
        scr: 210,
        uacr: 15,
        k: 4.8,
        currentMeds: [],
        selectedModules: ['ckd'],
        conditions: { ckd: true }
      },
      {
        age: 71,
        sex: 'male',
        sbp: 148,
        dbp: 86,
        scr: 280,
        k: 6.4,
        currentMeds: [],
        selectedModules: ['ckd'],
        conditions: { ckd: true },
        customInputs: { baselineScr: 130 }
      },
      {
        age: 58,
        sex: 'female',
        sbp: 136,
        dbp: 80,
        scr: 260,
        k: 5.1,
        currentMeds: [],
        selectedModules: ['ckd'],
        conditions: { ckd: true, onDialysis: true }
      }
    ];

    for (const siPreset of ckdSiPresets) {
      const derivedDirectSi = derivePatientData(siPreset);
      const usDisplay = denormalizePatientFromSi(siPreset, usUnits);
      // Verify scr was converted down from umol/L to mg/dL (~1.8-3.2 mg/dL, NEVER 165-280 mg/dL!)
      expect(usDisplay.scr!).toBeLessThan(10);
      if (siPreset.customInputs?.baselineScr) {
        expect(Number(usDisplay.customInputs?.baselineScr)).toBeCloseTo(130 / 88.42, 3);
      }

      const roundTrippedSi = normalizePatientUnits(usDisplay, usUnits);
      const derivedRoundTrip = derivePatientData(roundTrippedSi);

      expect(roundTrippedSi.scr).toBeCloseTo(siPreset.scr!, 1);
      if (siPreset.uacr !== undefined) {
        expect(roundTrippedSi.uacr).toBeCloseTo(siPreset.uacr, 1);
      }
      if (siPreset.customInputs?.baselineScr !== undefined) {
        expect(Number(roundTrippedSi.customInputs?.baselineScr)).toBeCloseTo(130, 1);
      }
      expect(derivedRoundTrip.egfr).toBe(derivedDirectSi.egfr);
      expect(derivedRoundTrip.kdigoG).toBe(derivedDirectSi.kdigoG);
    }
  });

  it('R3-R2-COPD-12: fail-closed GOLD derivation never fabricates exacerbation counts and never assigns GOLD when FEV1/FVC >= 0.70', () => {
    // 1. Missing exacerbation counts -> goldGroup MUST remain undefined
    const noExacHistory = derivePatientData({
      age: 64,
      sex: 'male',
      fev1Pct: 55,
      mmrc: 2,
      cat: 14,
      currentMeds: [],
      selectedModules: ['copd'],
      conditions: { copd: true },
      customInputs: {
        fev1FvcRatio: 0.61
      }
    });
    expect(noExacHistory.goldGrade).toBe('GOLD 2');
    expect(noExacHistory.goldGroup).toBeUndefined();

    // 2. Post-BD FEV1/FVC >= 0.70 -> NOT COPD spirometrically -> neither goldGrade nor goldGroup assigned
    const nonObstructive = derivePatientData({
      age: 64,
      sex: 'male',
      fev1Pct: 75,
      mmrc: 2,
      copdExacerbations: 2,
      currentMeds: [],
      selectedModules: ['copd'],
      conditions: { copd: true },
      customInputs: {
        fev1FvcRatio: 0.76
      }
    });
    expect(nonObstructive.goldGrade).toBeUndefined();
    expect(nonObstructive.goldGroup).toBeUndefined();
  });
});
