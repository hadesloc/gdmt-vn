import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

const baseSettings: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct',
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false,
};

function makePatient(overrides: Partial<Patient>): Patient {
  return {
    id: 'hf_r2_test',
    age: 64,
    sex: 'male',
    weight: 70,
    height: 170,
    sbp: 124,
    dbp: 76,
    hr: 74,
    rhythm: 'sinus',
    lvef: 32,
    nyha: 2,
    scr: 90,
    k: 4.3,
    conditions: { hf: true },
    currentMeds: [],
    selectedModules: ['hf'],
    ...overrides,
  };
}

describe('HF Round 2 Clinical Remediation Regressions', () => {
  it('ASTHMA-R4-R2-09: Inpatient acute severe hypoxic asthma on bisoprolol emits [HOLD] bisoprolol (never CONTINUE)', () => {
    const plan = evaluate(
      makePatient({
        sbp: 132,
        hr: 114,
        spo2: 88,
        conditions: { hf: true, asthma: true },
        currentMeds: [{ drugId: 'bisoprolol', name: 'Bisoprolol', dose: '5 mg x 1 lần/ngày' }],
        selectedModules: ['hf', 'asthma'],
        customInputs: {
          congestion: 'mild',
          isAcuteExacerbation: true,
          speechAbility: 'words',
        },
      }),
      { ...baseSettings, setting: 'inpatient' }
    );
    const bisoRecs = plan.recommendations.filter((r) => r.drugId === 'bisoprolol');
    expect(bisoRecs.some((r) => r.action === 'HOLD' && r.dose === undefined)).toBe(true);
    expect(bisoRecs.some((r) => r.action === 'CONTINUE')).toBe(false);
  });

  it('R2-P0-01: ESC 2026 (INTL) classifies LVEF 45% as HFrEF (4 pillars START), whereas US classifies as HFmrEF', () => {
    const pt = makePatient({ lvef: 45 });
    const intlPlan = evaluate(pt, { ...baseSettings, profile: 'INTL' });
    expect(intlPlan.recommendations.some((r) => r.drugId === 'sacubitril_valsartan' && r.action === 'START')).toBe(true);
    expect(intlPlan.recommendations.some((r) => r.drugId === 'bisoprolol' && r.action === 'START')).toBe(true);
    expect(intlPlan.recommendations.some((r) => r.drugId === 'spironolactone' && r.action === 'START')).toBe(true);
    expect(intlPlan.recommendations.some((r) => r.drugId === 'dapagliflozin' && r.action === 'START')).toBe(true);

    const usPlan = evaluate(pt, { ...baseSettings, profile: 'US' });
    expect(usPlan.recommendations.some((r) => r.drugId === 'sacubitril_valsartan' && r.action === 'START')).toBe(false);
    expect(usPlan.recommendations.some((r) => r.drugId === 'finerenone' && r.action === 'CONSIDER')).toBe(true);
    expect(usPlan.recommendations.some((r) => r.id === 'rec_hf_hfmref_neurohormonal' && r.action === 'CONSIDER')).toBe(true);
  });

  it('R2-P0-02/03: Concomitant ARNI + ACEi/ARB SPC emits immediate [STOP] for the concomitant RASi', () => {
    const plan = evaluate(
      makePatient({
        currentMeds: [
          { drugId: 'sacubitril_valsartan', name: 'Entresto', dose: '49/51 mg x 2 lần/ngày' },
          { drugId: 'perindopril_amlodipine', name: 'Coveram', dose: '5/5 mg x 1 lần/ngày' },
        ],
      }),
      baseSettings
    );
    expect(plan.recommendations.some((r) => r.drugId === 'perindopril_amlodipine' && r.action === 'STOP')).toBe(true);
  });

  it('R2-P0-04: Inpatient missing congestion status fail-closes with missing_input_congestion and DEFERs predischarge', () => {
    const plan = evaluate(makePatient({ lvef: 30, sbp: 125 }), { ...baseSettings, setting: 'inpatient' });
    expect(plan.recommendations.some((r) => r.id === 'missing_input_congestion')).toBe(true);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_inpatient_predischarge' && r.action === 'DEFER')).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'furosemide' && r.action === 'START')).toBe(false);
  });

  it('R2-F03: Inpatient poor diuretic response (uNa+ 2h < 70 mmol/L) recommends doubling IV Furosemide + CONSIDER IV Acetazolamide', () => {
    const plan = evaluate(
      makePatient({
        sbp: 128,
        currentMeds: [{ drugId: 'furosemide', name: 'Furosemide', dose: '40 mg x 2 lần/ngày' }],
        customInputs: { congestion: 'overt', urinarySodium2h: 45 },
      }),
      { ...baseSettings, setting: 'inpatient' }
    );
    expect(plan.recommendations.some((r) => r.drugId === 'furosemide' && r.action === 'UPTITRATE')).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'acetazolamide' && r.action === 'CONSIDER')).toBe(true);
  });

  it('R2-F14: Lactation HFrEF stops ARNI/SGLT2i and recommends Enalapril + Metoprolol succinate + Spironolactone', () => {
    const plan = evaluate(
      makePatient({
        age: 31,
        sex: 'female',
        conditions: { hf: true, breastfeeding: true },
        currentMeds: [
          { drugId: 'sacubitril_valsartan', dose: '49/51 mg x 2 lần/ngày' },
          { drugId: 'dapagliflozin', dose: '10 mg x 1 lần/ngày' },
        ],
      }),
      baseSettings
    );
    expect(plan.recommendations.some((r) => r.drugId === 'sacubitril_valsartan' && r.action === 'STOP')).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'dapagliflozin' && r.action === 'STOP')).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'enalapril' && r.action === 'START')).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'metoprolol_succinate' && r.action === 'START')).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'spironolactone' && r.action === 'START')).toBe(true);
  });

  it('R2-F21/23: ATTR-CM recommends Tafamidis, avoids Digoxin, and warns mandatory OAC when AF coexists', () => {
    const plan = evaluate(
      makePatient({
        lvef: 54,
        rhythm: 'afib',
        conditions: { hf: true, cardiacAmyloidosis: true, af: true },
        currentMeds: [{ drugId: 'digoxin', dose: '0.125 mg x 1 lần/ngày' }],
      }),
      baseSettings
    );
    const taf = plan.recommendations.find((r) => r.drugId === 'tafamidis');
    expect(taf?.action).toBe('START');
    expect(taf?.warnings?.some((w) => w.includes('CHA2DS2-VA'))).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'digoxin' && r.action === 'STOP')).toBe(true);
  });

  it('R2-F20 & R2-F12: Digoxin + Amiodarone REDUCEs >62.5 mcg; Eplerenone + Fluconazole caps at 25 mg; K+ 5.6 offers SZC/Patiromer', () => {
    const digPlan = evaluate(
      makePatient({
        currentMeds: [
          { drugId: 'digoxin', dose: '0.125 mg x 1 lần/ngày' },
          { drugId: 'amiodarone', dose: '200 mg x 1 lần/ngày' },
          { drugId: 'eplerenone', dose: '50 mg x 1 lần/ngày' },
          { drugId: 'fluconazole', dose: '200 mg x 1 lần/ngày' },
        ],
      }),
      baseSettings
    );
    expect(digPlan.recommendations.some((r) => r.drugId === 'digoxin' && r.action === 'REDUCE')).toBe(true);
    expect(digPlan.recommendations.some((r) => r.drugId === 'eplerenone' && r.action === 'REDUCE')).toBe(true);

    const kPlan = evaluate(
      makePatient({
        k: 5.6,
        currentMeds: [{ drugId: 'spironolactone', dose: '25 mg x 1 lần/ngày' }],
      }),
      baseSettings
    );
    expect(
      kPlan.recommendations.some(
        (r) => r.drugId === 'spironolactone' && (r.action === 'HOLD' || r.action === 'REDUCE')
      )
    ).toBe(true);
    expect(kPlan.recommendations.some((r) => r.drugId === 'sodium_zirconium_cyclosilicate' && r.action === 'CONSIDER')).toBe(true);
  });
});
