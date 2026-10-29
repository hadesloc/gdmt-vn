import { describe, it, expect } from 'vitest';
import {
  evaluate,
  derivePatientData,
  mergeRecommendations,
  STANDARD_CONDITIONS,
  hasCondition,
  parseDailyDoseMg,
  parseComponentDailyDoseMg,
  crMgDlToUmolL,
  normalizePatientUnits,
  type Patient,
  type Settings,
  type Recommendation,
  type CurrentMed
} from '../../src/engine';
import { evaluateSafetyGates } from '../../src/engine/safety/gates';
import { reviewCurrentMedications, checkEmergencyRedFlags } from '../../src/engine/safety/reviewMeds';
import { checkInteractions } from '../../src/engine/safety/interactions';
import { checkDuplicates } from '../../src/engine/safety/duplicates';
import { computeDoacDose } from '../../src/engine/calculators/doacDose';
import { computeGold } from '../../src/engine/calculators/gold';
import { computePrevent } from '../../src/engine/calculators/prevent';
import { determineEscRiskTier } from '../../src/engine/calculators/ldlTarget';
import { computeCha2ds2va } from '../../src/engine/calculators/cha2ds2va';

const baseSettings: Settings = {
  profile: 'VN',
  setting: 'outpatient',
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false,
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', uacr: 'mg_mmol', urat: 'umol_L', hba1c: 'pct' }
};

function makePt(overrides: Partial<Patient> = {}): Patient {
  return { age: 60, sex: 'male', currentMeds: [], selectedModules: ['hf'], conditions: {}, ...overrides };
}

function makeRec(overrides: Partial<Recommendation> & { id: string; drugId?: string }): Recommendation {
  return {
    module: 'hf',
    tier: 'Điều trị nền tảng',
    action: 'START',
    title: `Khởi trị ${overrides.drugId || overrides.id}`,
    rationale: 'Test',
    gates: [],
    citationIds: ['kb'],
    priority: 85,
    ...overrides
  };
}

describe('B5 Shared Foundation Mega-Upgrade Suite', () => {
  it('1. IV vs Oral Route Guard & Clear dose on Blocked Cards (routeGuard, merge, gates)', () => {
    const homeMeds: CurrentMed[] = [
      { drugId: 'bisoprolol', dose: '5 mg', freq: '1 lần/ngày', route: 'oral' },
      { drugId: 'amlodipine', dose: '10 mg', freq: '1 lần/ngày', route: 'oral' },
      { drugId: 'furosemide', dose: '40 mg', freq: '1 lần/ngày', route: 'oral' }
    ];
    const inpatientPt = makePt({
      age: 68,
      currentMeds: homeMeds,
      selectedModules: ['af', 'htn', 'hf'],
      conditions: { af: true, htn: true, hf: true }
    });
    const ivRecs = [
      makeRec({ id: 'af_acute_esmolol_iv', module: 'af', drugId: 'esmolol', dose: '500 mcg/kg bolus tĩnh mạch' }),
      makeRec({ id: 'htn_emergency_nicardipine_iv', module: 'htn', drugId: 'nicardipine', dose: '5 mg/giờ truyền tĩnh mạch' }),
      makeRec({ id: 'hf_acute_iv_furosemide', module: 'hf', drugId: 'furosemide', dose: '40–80 mg tiêm tĩnh mạch chậm' })
    ];
    const merged = mergeRecommendations(ivRecs, inpatientPt);
    expect(merged.find((r) => r.drugId === 'esmolol')?.action).toBe('START');
    expect(merged.find((r) => r.drugId === 'nicardipine')?.action).toBe('START');
    const furoMerged = merged.find((r) => r.drugId === 'furosemide');
    expect(furoMerged?.action).toBe('START');
    expect(furoMerged?.dose).toContain('tĩnh mạch');

    const pregPt = makePt({ age: 31, sex: 'female', selectedModules: ['htn'], conditions: { pregnant: true } });
    const gated = evaluateSafetyGates(
      makeRec({ id: 'start_losartan', module: 'htn', drugId: 'losartan', dose: '50 mg/ngày' }),
      pregPt,
      { egfr: 95 },
      baseSettings
    ).updatedRec;
    expect(gated.action).toBe('AVOID');
    expect(gated.dose).toBeUndefined();
  });

  it('2. Global FDC Decomposition across pregnancy, eGFR, peri-op SGLT2i, DDI, 36h ARNI washout & stopped inhaler dedup', () => {
    const pregSpcPt = makePt({
      age: 33,
      sex: 'female',
      currentMeds: [{ drugId: 'hyzaar', name: 'Hyzaar 50/12.5 mg' }, { drugId: 'amlodipine_perindopril', name: 'Coveram 5/5 mg' }],
      selectedModules: ['htn'],
      conditions: { pregnant: true }
    });
    const pregRevs = reviewCurrentMedications(pregSpcPt, { egfr: 95 }, baseSettings);
    expect(pregRevs.find((r) => r.drugId === 'hyzaar')?.action).toBe('STOP');
    expect(pregRevs.find((r) => r.drugId === 'amlodipine_perindopril')?.action).toBe('STOP');

    const renalFdcPt = makePt({
      age: 68,
      currentMeds: [{ drugId: 'synjardy', name: 'Synjardy 12.5/1000 mg' }],
      selectedModules: ['dm2', 'ckd'],
      conditions: { dm: true, ckd: true }
    });
    expect(reviewCurrentMedications(renalFdcPt, { egfr: 22 }, baseSettings).find((r) => r.drugId === 'synjardy')?.action).toBe('STOP');

    const periopPt = makePt({
      currentMeds: [{ drugId: 'synjardy', name: 'Synjardy 10/1000 mg' }, { drugId: 'segluromet', name: 'Segluromet 7.5/1000 mg' }],
      selectedModules: ['dm2'],
      conditions: { dm: true },
      customInputs: { plannedSurgery: true }
    });
    const periopRevs = reviewCurrentMedications(periopPt, { egfr: 75 }, baseSettings);
    expect(periopRevs.find((r) => r.drugId === 'synjardy')?.rationale).toContain('3 ngày');
    expect(periopRevs.find((r) => r.drugId === 'segluromet')?.rationale).toContain('4 ngày');

    const ddiSpcPt = makePt({
      currentMeds: [{ drugId: 'amlodipine_perindopril', dose: '10/10 mg' }, { drugId: 'simvastatin', dose: '40 mg' }],
      selectedModules: ['htn', 'lipid'],
      conditions: { htn: true }
    });
    expect(reviewCurrentMedications(ddiSpcPt, { egfr: 80 }, baseSettings).find((r) => r.drugId === 'simvastatin')?.action).toBe('REDUCE');

    const arniPlanPt = makePt({
      lvef: 32,
      sbp: 120,
      k: 4.3,
      currentMeds: [{ drugId: 'amlodipine_perindopril', name: 'Coveram 5/5 mg' }],
      conditions: { hf: true }
    });
    const gatedArni = evaluateSafetyGates(
      makeRec({ id: 'hf_arni', drugId: 'sacubitril_valsartan', dose: '49/51 mg x 2' }),
      arniPlanPt,
      { egfr: 65 },
      baseSettings
    ).updatedRec;
    expect(gatedArni.action).toBe('HOLD');
    expect(gatedArni.dose).toBeUndefined();
    const spcStopRevs = reviewCurrentMedications(arniPlanPt, { egfr: 65 }, baseSettings, [gatedArni]);
    expect(spcStopRevs.find((r) => r.drugId === 'amlodipine_perindopril')?.action).toBe('STOP');
    expect(checkInteractions(arniPlanPt, { egfr: 65 }, [gatedArni, ...spcStopRevs]).some((a) => a.id === 'ix.acei_arni_washout')).toBe(true);

    expect(
      checkDuplicates(
        [{ drugId: 'fluticasone_salmeterol', name: 'Seretide 25/250' }],
        [
          makeRec({ id: 'stop_seretide', module: 'asthma', action: 'STOP', drugId: 'fluticasone_salmeterol', dose: undefined }),
          makeRec({ id: 'start_symbicort', module: 'asthma', action: 'START', drugId: 'budesonide_formoterol' })
        ]
      )
    ).toHaveLength(0);
  });

  it('3. Fail-Closed doseParser prevents tablet-count confusion while parsing mg/frequency/FDC strengths', () => {
    expect(parseDailyDoseMg({ drugId: 'simvastatin', dose: '1 viên', freq: 'tối' })).toBeUndefined();
    expect(parseDailyDoseMg({ drugId: 'simvastatin', name: 'Simvastatin 40mg', dose: '1 viên', freq: 'tối' })).toBe(40);
    expect(parseDailyDoseMg({ drugId: 'metformin', dose: '500 mg', freq: 'x 2 lần/ngày' })).toBe(1000);
    expect(parseDailyDoseMg({ drugId: 'rosuvastatin', dose: '10 mg', freq: 'cách ngày' })).toBe(5);
    const synMed: CurrentMed = { drugId: 'empagliflozin_metformin', name: 'Synjardy 12.5/1000mg', dose: '1 viên', freq: '2 lần/ngày' };
    expect(parseComponentDailyDoseMg(synMed, 'empagliflozin')).toBe(25);
    expect(parseComponentDailyDoseMg(synMed, 'metformin')).toBe(2000);
  });

  it('4. Separate pregnant vs breastfeeding Lactation Gate preserves compatible maternal therapies', () => {
    expect(STANDARD_CONDITIONS.pregnant.labelVi).toBe('Đang mang thai');
    expect(STANDARD_CONDITIONS.breastfeeding.labelVi).toBe('Đang cho con bú');

    const bfPt = makePt({ age: 30, sex: 'female', conditions: { pregnant: false, breastfeeding: true } });
    expect(hasCondition({ normalized: bfPt, patient: bfPt }, 'pregnant')).toBe(false);
    expect(hasCondition({ normalized: bfPt, patient: bfPt }, 'breastfeeding')).toBe(true);

    for (const okId of ['warfarin', 'enoxaparin', 'labetalol', 'nifedipine', 'enalapril', 'insulin_glargine', 'allopurinol']) {
      expect(evaluateSafetyGates(makeRec({ id: `bf_ok_${okId}`, drugId: okId }), bfPt, { egfr: 95 }).updatedRec.action).toBe('START');
    }
    for (const blkId of ['rosuvastatin', 'apixaban', 'dapagliflozin', 'semaglutide', 'sacubitril_valsartan', 'febuxostat']) {
      expect(evaluateSafetyGates(makeRec({ id: `bf_blk_${blkId}`, drugId: blkId }), bfPt, { egfr: 95 }).updatedRec.action).toBe('AVOID');
    }
  });

  it('5. Global Patient.allergies, Sulfonamide/Soy Cross-Allergy & Angioedema Synonyms', () => {
    const angioPt = makePt({
      currentMeds: [{ drugId: 'amlodipine_perindopril' }],
      selectedModules: ['htn', 'hf'],
      customInputs: { aceiAngioedema: true }
    });
    expect(reviewCurrentMedications(angioPt, { egfr: 75 }, baseSettings)[0]?.action).toBe('STOP');
    expect(evaluateSafetyGates(makeRec({ id: 's_arni', drugId: 'sacubitril_valsartan' }), angioPt, { egfr: 75 }).updatedRec.action).toBe('AVOID');
    expect(evaluateSafetyGates(makeRec({ id: 's_aliskiren', drugId: 'aliskiren' }), angioPt, { egfr: 75 }).updatedRec.action).toBe('AVOID');
    expect(evaluateSafetyGates(makeRec({ id: 's_valsartan', drugId: 'valsartan' }), angioPt, { egfr: 75 }).updatedRec.action).toBe('START');

    const sulfaSoyPt = makePt({
      allergies: ['sulfonamide', 'soy'],
      currentMeds: [{ drugId: 'indapamide' }, { drugId: 'celecoxib' }],
      selectedModules: ['htn'],
      conditions: { htn: true }
    });
    const sulfaRevs = reviewCurrentMedications(sulfaSoyPt, { egfr: 70 }, baseSettings);
    expect(sulfaRevs.find((r) => r.drugId === 'indapamide')?.action).toBe('STOP');
    expect(sulfaRevs.find((r) => r.drugId === 'celecoxib')?.action).toBe('STOP');
    expect(evaluateSafetyGates(makeRec({ id: 's_furo', drugId: 'furosemide' }), sulfaSoyPt, { egfr: 70 }).updatedRec.action).toBe('AVOID');
    expect(evaluateSafetyGates(makeRec({ id: 's_glim', drugId: 'glimepiride' }), sulfaSoyPt, { egfr: 70 }).updatedRec.action).toBe('AVOID');
    expect(
      evaluateSafetyGates(makeRec({ id: 's_clev', drugId: 'clevidipine', dose: '1 mg/giờ truyền tĩnh mạch' }), sulfaSoyPt, { egfr: 70 }).updatedRec.action
    ).toBe('AVOID');
  });

  it('6. Drug Classify & Duplicate Classes: XOI vs Uricosuric, Dual NSAIDs, 3-Statin Keeper & Ophthalmic Timolol', () => {
    expect(checkDuplicates([{ drugId: 'allopurinol' }, { drugId: 'probenecid' }], [])).toHaveLength(0);
    expect(checkDuplicates([{ drugId: 'allopurinol' }, { drugId: 'febuxostat' }], []).some((a) => a.id === 'dup.xoi')).toBe(true);
    expect(checkDuplicates([{ drugId: 'probenecid' }, { drugId: 'benzbromarone' }], []).some((a) => a.id === 'dup.uricosuric')).toBe(true);

    const dualNsaidPt = makePt({ currentMeds: [{ drugId: 'meloxicam' }, { drugId: 'celecoxib' }], selectedModules: ['gout'] });
    expect(checkDuplicates(dualNsaidPt.currentMeds, []).some((a) => a.id === 'dup.nsaid')).toBe(true);
    expect(reviewCurrentMedications(dualNsaidPt, { egfr: 88 }, baseSettings).filter((r) => r.action === 'STOP')).toHaveLength(1);

    const threeStatinPt = makePt({
      currentMeds: [
        { drugId: 'simvastatin', dose: '20 mg' },
        { drugId: 'rosuvastatin', dose: '20 mg' },
        { drugId: 'atorvastatin', dose: '20 mg' }
      ],
      selectedModules: ['lipid']
    });
    const statinStops = reviewCurrentMedications(threeStatinPt, { egfr: 80 }, baseSettings).filter((r) => r.action === 'STOP');
    expect(statinStops.map((r) => r.drugId).sort()).toEqual(['atorvastatin', 'simvastatin']);

    const eyeDropPt = makePt({
      currentMeds: [
        { drugId: 'timolol', name: 'Timolol 0.5% nhỏ mắt', route: 'ophthalmic' },
        { drugId: 'bisoprolol', dose: '5 mg', route: 'oral' }
      ],
      selectedModules: ['asthma', 'hf'],
      conditions: { asthma: true, hf: true }
    });
    expect(checkDuplicates(eyeDropPt.currentMeds, [])).toHaveLength(0);
    expect(reviewCurrentMedications(eyeDropPt, { egfr: 75 }, baseSettings).some((r) => r.drugId === 'timolol')).toBe(false);
  });

  it('7. Hepatic Child-Pugh A/C, Hyponatremia, QTc/HypoK, Conduction/WPW, AKI Continue-Override, Shock & HTN Crisis', () => {
    const cpAPt = makePt({ conditions: { liverDisease: true }, customInputs: { childPugh: 'A' } });
    for (const okA of ['metformin', 'atorvastatin', 'apixaban']) {
      expect(evaluateSafetyGates(makeRec({ id: `cpa_${okA}`, drugId: okA }), cpAPt, { egfr: 75 }).updatedRec.action).toBe('START');
    }
    expect(evaluateSafetyGates(makeRec({ id: 'cpa_feno', drugId: 'fenofibrate' }), cpAPt, { egfr: 75 }).updatedRec.action).toBe('AVOID');
    expect(evaluateSafetyGates(makeRec({ id: 'cpa_telmi80', drugId: 'telmisartan', dose: '80 mg/ngày' }), cpAPt, { egfr: 75 }).updatedRec.action).toBe('REDUCE');

    const cpCPt = { ...cpAPt, customInputs: { childPugh: 'C' } };
    for (const blkC of ['sacubitril_valsartan', 'carvedilol', 'vericiguat', 'ivabradine', 'rivaroxaban']) {
      expect(evaluateSafetyGates(makeRec({ id: `cpc_${blkC}`, drugId: blkC }), cpCPt, { egfr: 75 }).updatedRec.action).toBe('AVOID');
    }
    expect(evaluateSafetyGates(makeRec({ id: 'cpc_empa', drugId: 'empagliflozin' }), cpCPt, { egfr: 75 }).updatedRec.action).toBe('START');

    const elecPt = makePt({
      age: 70,
      na: 122,
      qtc: 520,
      k: 3.2,
      currentMeds: [{ drugId: 'indapamide' }, { drugId: 'losartan_hctz' }, { drugId: 'sotalol' }],
      selectedModules: ['htn', 'af'],
      conditions: { htn: true, af: true }
    });
    const elecRevs = reviewCurrentMedications(elecPt, { egfr: 65 }, baseSettings);
    expect(elecRevs.find((r) => r.drugId === 'indapamide')?.action).toBe('STOP');
    expect(elecRevs.find((r) => r.drugId === 'losartan_hctz')?.action).toBe('STOP');
    expect(elecRevs.find((r) => r.drugId === 'sotalol')?.action).toBe('STOP');
    expect(evaluateSafetyGates(makeRec({ id: 'qt_amio', drugId: 'amiodarone' }), elecPt, { egfr: 65 }).updatedRec.action).toBe('AVOID');
    expect(['HOLD', 'AVOID']).toContain(evaluateSafetyGates(makeRec({ id: 'hypok_dig', drugId: 'digoxin' }), elecPt, { egfr: 65 }).updatedRec.action);

    const avBlkPt = makePt({ conditions: { avBlock2Or3: true } });
    expect(evaluateSafetyGates(makeRec({ id: 'av_biso', drugId: 'bisoprolol' }), avBlkPt, { egfr: 70 }).updatedRec.action).toBe('AVOID');
    expect(
      evaluateSafetyGates(makeRec({ id: 'av_biso_pm', drugId: 'bisoprolol' }), { ...avBlkPt, conditions: { avBlock2Or3: true, pacemaker: true } }, { egfr: 70 }).updatedRec.action
    ).toBe('START');

    const wpwPt = makePt({ selectedModules: ['af'], conditions: { wpw: true, af: true } });
    for (const nodalId of ['bisoprolol', 'verapamil', 'digoxin', 'amiodarone']) {
      expect(evaluateSafetyGates(makeRec({ id: `wpw_${nodalId}`, drugId: nodalId }), wpwPt, { egfr: 90 }).updatedRec.action).toBe('AVOID');
    }

    const akiPt = makePt({
      scr: 240,
      currentMeds: [{ drugId: 'sacubitril_valsartan', dose: '97/103 mg' }],
      conditions: { hf: true, aki: true },
      customInputs: { baselineScr: 100 }
    });
    const gatedAkiCont = evaluateSafetyGates(
      makeRec({ id: 'cont_arni', action: 'CONTINUE', drugId: 'sacubitril_valsartan', dose: '97/103 mg BID' }),
      akiPt,
      { egfr: 24 },
      baseSettings
    ).updatedRec;
    expect(gatedAkiCont.action).toBe('HOLD');
    expect(gatedAkiCont.dose).toBeUndefined();

    const shockPt = makePt({
      sbp: 95,
      conditions: { hf: true, cardiogenicShock: true },
      customInputs: { onInotropesOrVasopressors: true }
    });
    const shockGated = evaluateSafetyGates(
      makeRec({ id: 'shock_dapa', drugId: 'dapagliflozin', dose: '10 mg' }),
      shockPt,
      { egfr: 55 },
      { ...baseSettings, setting: 'inpatient' }
    ).updatedRec;
    expect(['DEFER', 'HOLD', 'AVOID']).toContain(shockGated.action);
    expect(shockGated.dose).toBeUndefined();

    expect(
      checkEmergencyRedFlags(makePt({ sbp: 192, dbp: 112, selectedModules: ['htn'], conditions: { htn: true } }), { egfr: 75 }, baseSettings).find(
        (r) => r.id === 'emergency_hypertensive_crisis'
      )?.rationale
    ).toMatch(/KHÔNG|Tránh hạ áp tĩnh mạch/i);
    expect(
      checkEmergencyRedFlags(
        makePt({ sbp: 205, dbp: 124, selectedModules: ['htn'], conditions: { htn: true, hypertensiveEmergency: true } }),
        { egfr: 75 },
        { ...baseSettings, setting: 'inpatient' }
      ).find((r) => r.id === 'emergency_hypertensive_crisis')?.rationale
    ).toMatch(/Nicardipine|Labetalol|tĩnh mạch/i);
  });

  it('8. Units, Calculators & Derive: minimal Patient guard, 88.42 Scr exactness, Dialysis DOAC, fail-closed GOLD, PREVENT, LDL UACR & CHA2DS2-VA', () => {
    expect(() => evaluate({ age: 50, sex: 'male' } as unknown as Patient, baseSettings)).not.toThrow();

    expect(crMgDlToUmolL(1.5)).toBe(132.63);
    const normScr = normalizePatientUnits(
      makePt({ age: 82, weight: 72, scr: 1.5, selectedModules: ['af'], conditions: { af: true } }),
      { ...baseSettings.units, cr: 'mg_dL' }
    ).scr!;
    expect(computeDoacDose({ drug: 'apixaban', crcl: 48, age: 82, weight: 72, scr: normScr, scrUnit: 'umol/L', profile: 'INTL' }).isDoseReduced).toBe(true);

    expect(computeDoacDose({ drug: 'apixaban', crcl: 35, age: 65, weight: 70, scr: 500, onDialysis: true, profile: 'INTL' }).contraindicated).toBe(true);
    const usDialysisApix = computeDoacDose({ drug: 'apixaban', crcl: 35, age: 82, weight: 70, scr: 500, onDialysis: true, profile: 'US' });
    expect(usDialysisApix.contraindicated).toBe(false);
    expect(usDialysisApix.recommendedDose).toContain('2.5 mg');
    expect(computeDoacDose({ drug: 'dabigatran', crcl: 22, age: 70, weight: 70, scr: 210, profile: 'US' }).recommendedDose).toContain('75 mg');

    expect(computeGold({ fev1PredPct: 65, fev1FvcRatio: 0.62, mmrc: 1 }).group).toBeNull();
    expect(
      derivePatientData(
        makePt({ fev1Pct: 65, mmrc: 1, selectedModules: ['copd'], conditions: { copd: true }, customInputs: { postBdrRatio: 0.62, bcat: 280 } }),
        baseSettings
      ).goldGroup
    ).toBeUndefined();

    const prev = computePrevent({
      age: 55,
      sex: 'male',
      sbp: 138,
      tc: 5.4,
      hdl: 1.1,
      cholUnit: 'mmol/L',
      egfr: 78,
      bmi: 26,
      smoker: false,
      hasDiabetes: false,
      onHtnMeds: true,
      onStatin: false
    });
    expect(['low', 'borderline', 'intermediate', 'high']).toContain(prev.ascvdRiskCategory);
    expect(determineEscRiskTier({ currentLdl: 3.2, hasDiabetes: true, dmDurationYears: 4, uacr: 5, uacrUnit: 'mg/mmol', egfr: 75 })).toBe('very_high');

    const strokeOnlyPt = makePt({ age: 55, selectedModules: ['af'], conditions: { strokeOrTia: true } });
    expect(hasCondition({ normalized: strokeOnlyPt, patient: strokeOnlyPt }, 'ascvd')).toBe(true);
    expect(hasCondition({ normalized: strokeOnlyPt, patient: strokeOnlyPt }, 'cad')).toBe(false);
    expect(
      computeCha2ds2va({
        age: 55,
        sex: 'male',
        chf: false,
        hypertension: false,
        diabetes: false,
        strokeOrTia: true,
        vascularDisease: hasCondition({ normalized: strokeOnlyPt, patient: strokeOnlyPt }, 'cad')
      }).scoreVa
    ).toBe(2);
  });
});
