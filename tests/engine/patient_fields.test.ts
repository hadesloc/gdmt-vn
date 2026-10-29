import { describe, it, expect } from 'vitest';
import type { Patient, Settings } from '../../src/engine/types';
import {
  getCanonicalFieldValue,
  setCanonicalFieldValue,
  setCanonicalCondition,
  detectPatientFieldConflicts,
  resolvePatientFieldConflicts
} from '../../src/engine/patientFields';
import { normalizePatientUnits } from '../../src/engine/units';
import { evaluate } from '../../src/engine/evaluate';

const DEFAULT_SETTINGS: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct'
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false
};

describe('DATA-01: Canonical Patient Fields, Legacy Migration & Fail-Closed Conflicts', () => {
  it('writes top-level fields (rhythm, lvef, nyha, qtc) directly to Patient even when initially omitted', () => {
    const emptyPatient: Patient = {
      selectedModules: ['hf'],
      conditions: { hf: true },
      currentMeds: []
    };

    const p1 = setCanonicalFieldValue(emptyPatient, 'rhythm', 'afib');
    expect(p1.rhythm).toBe('afib');
    expect(p1.customInputs?.rhythm).toBeUndefined();
    expect(p1.conditions.af).toBe(true);
    expect(p1.conditions.afib).toBe(true);

    const p2 = setCanonicalFieldValue(p1, 'lvef', 35);
    const p3 = setCanonicalFieldValue(p2, 'nyha', 2);
    const p4 = setCanonicalFieldValue(p3, 'qtc', 470);

    expect(p4.lvef).toBe(35);
    expect(p4.nyha).toBe(2);
    expect(p4.qtc).toBe(470);
    expect(p4.customInputs?.lvef).toBeUndefined();
    expect(p4.customInputs?.nyha).toBeUndefined();
    expect(p4.customInputs?.qtc).toBeUndefined();
  });

  it('migrates legacy customInputs scalar aliases into canonical top-level fields during normalization when top-level is undefined', () => {
    const legacyPatient: Patient = {
      age: 68,
      sex: 'male',
      sbp: 122,
      dbp: 74,
      hr: 84,
      scr: 95,
      k: 4.3,
      selectedModules: ['hf'],
      conditions: { hf: true },
      currentMeds: [],
      customInputs: {
        rhythm: 'afib',
        lvef: 32,
        nyha: 3,
        qtcMs: 485,
        bloodEosinophils: 320
      }
    };

    expect(getCanonicalFieldValue(legacyPatient, 'rhythm')).toBe('afib');
    expect(getCanonicalFieldValue(legacyPatient, 'lvef')).toBe(32);

    const norm = normalizePatientUnits(legacyPatient, DEFAULT_SETTINGS.units);
    expect(norm.rhythm).toBe('afib');
    expect(norm.lvef).toBe(32);
    expect(norm.nyha).toBe(3);
    expect(norm.qtc).toBe(485);
    expect(norm.eos).toBe(320);
    expect(norm.conditions.af).toBe(true);
  });

  it('detects conflicts between top-level fields and legacy customInputs and resolves fail-closed in engine normalization', () => {
    const conflictedPatient: Patient = {
      age: 64,
      sex: 'male',
      sbp: 118,
      dbp: 72,
      hr: 78,
      rhythm: 'sinus',
      lvef: 55,
      scr: 90,
      k: 4.2,
      selectedModules: ['hf'],
      conditions: { hf: true },
      currentMeds: [
        { drugId: 'sacubitril_valsartan', dose: '200 mg', freq: 'bid' },
        { drugId: 'bisoprolol', dose: '10 mg', freq: 'qd' },
        { drugId: 'spironolactone', dose: '25 mg', freq: 'qd' },
        { drugId: 'dapagliflozin', dose: '10 mg', freq: 'qd' }
      ],
      customInputs: {
        rhythm: 'afib',
        lvef: 30,
        congestion: 'euvolemic'
      }
    };

    const conflicts = detectPatientFieldConflicts(conflictedPatient);
    expect(conflicts.map((c) => c.fieldId)).toContain('rhythm');
    expect(conflicts.map((c) => c.fieldId)).toContain('lvef');
    expect(getCanonicalFieldValue(conflictedPatient, 'rhythm')).toBeUndefined();

    // Fail-closed: neither sinus ivabradine nor unconfirmed LVEF pillar recommendations may fire blindly
    const norm = normalizePatientUnits(conflictedPatient, DEFAULT_SETTINGS.units);
    expect(norm.rhythm).toBeUndefined();
    expect(norm.lvef).toBeUndefined();
    expect(norm.customInputs?.rhythm).toBeUndefined();
    expect(norm.customInputs?.lvef).toBeUndefined();

    const plan = evaluate(conflictedPatient, DEFAULT_SETTINGS);
    expect(plan.recommendations.some((r) => r.drugId === 'ivabradine')).toBe(false);
    expect(plan.recommendations.some((r) => r.id.includes('missing_input_lvef'))).toBe(true);

    // Resolving conflicts cleans stale customInputs aliases
    const resolved = resolvePatientFieldConflicts(conflictedPatient);
    expect(detectPatientFieldConflicts(resolved)).toHaveLength(0);
    expect(resolved.rhythm).toBe('sinus');
    expect(resolved.lvef).toBe(55);
    expect(resolved.customInputs?.rhythm).toBeUndefined();
    expect(resolved.customInputs?.lvef).toBeUndefined();
  });

  it('synchronizes bidirectional safety condition synonyms cleanly', () => {
    const base: Patient = {
      selectedModules: ['htn'],
      conditions: { htn: true },
      currentMeds: [],
      customInputs: { pregnancy: true }
    };

    const p1 = setCanonicalCondition(base, 'pregnant', false);
    expect(p1.conditions.pregnant).toBe(false);
    expect(p1.conditions.pregnancy).toBe(false);
    expect(p1.customInputs?.pregnancy).toBeUndefined();

    const p2 = setCanonicalFieldValue(p1, 'customInputs.breastfeeding', true);
    expect(p2.conditions.breastfeeding).toBe(true);
    expect(p2.conditions.lactation).toBe(true);
    expect(getCanonicalFieldValue(p2, 'conditions.breastfeeding')).toBe(true);
  });

  it('preserves module-entered data when a module is unselected without executing rules from unselected modules', () => {
    const patientWithHfData: Patient = {
      age: 62,
      sex: 'male',
      sbp: 128,
      dbp: 78,
      hr: 72,
      rhythm: 'sinus',
      scr: 92,
      k: 4.4,
      lvef: 35,
      nyha: 2,
      selectedModules: ['htn'], // 'hf' unselected while lvef/nyha preserved
      conditions: { htn: true, hf: false },
      currentMeds: [],
      customInputs: { congestion: 'euvolemic' }
    };

    const planHtnOnly = evaluate(patientWithHfData, DEFAULT_SETTINGS);
    expect(planHtnOnly.recommendations.every((r) => r.module !== 'hf')).toBe(true);
    expect(patientWithHfData.lvef).toBe(35);

    // Re-selecting 'hf' immediately uses preserved lvef & nyha
    const planWithHf = evaluate(
      {
        ...patientWithHfData,
        selectedModules: ['htn', 'hf'],
        conditions: { htn: true, hf: true }
      },
      DEFAULT_SETTINGS
    );
    expect(planWithHf.recommendations.some((r) => r.module === 'hf')).toBe(true);
  });
});
