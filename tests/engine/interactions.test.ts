import { describe, it, expect } from 'vitest';
import { checkInteractions, INTERACTION_RULES, KB_INTERACTION_RULES } from '../../src/engine/safety/interactions';
import { DUPLICATE_CLASS_RULES, checkDuplicates } from '../../src/engine/safety/duplicates';
import { evaluateSafetyGates, isPregnancyContraindicated } from '../../src/engine/safety/gates';
import { reviewCurrentMedications, checkEmergencyRedFlags } from '../../src/engine/safety/reviewMeds';
import type { Patient, Derived, Recommendation, Settings } from '../../src/engine/types';

const dummySettings: Settings = {
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

describe('Safety - Interactions, Gates, Duplicates & Med Review (KB Data-Driven)', () => {
  const basePatient: Patient = {
    age: 65,
    currentMeds: [
      { drugId: 'perindopril', name: 'Perindopril' },
      { drugId: 'furosemide', name: 'Furosemide' }
    ],
    selectedModules: ['ckd', 'hf'],
    conditions: {}
  };

  const dummyDerived: Derived = {
    egfr: 45
  };

  const dummyRecs: Recommendation[] = [];

  it('does NOT trigger Triple Whammy when patient is NOT taking NSAID', () => {
    const alerts = checkInteractions(basePatient, dummyDerived, dummyRecs);
    const twAlert = alerts.find((a) => a.id === 'ix.triple_whammy');
    expect(twAlert).toBeUndefined();
  });

  it('triggers Triple Whammy when patient is taking NSAID along with RASi + Diuretic', () => {
    const patientWithNsaid: Patient = {
      ...basePatient,
      currentMeds: [
        ...basePatient.currentMeds,
        { drugId: 'ibuprofen', name: 'Ibuprofen 400mg' }
      ]
    };

    const alerts = checkInteractions(patientWithNsaid, dummyDerived, dummyRecs);
    const twAlert = alerts.find((a) => a.id === 'ix.triple_whammy');
    expect(twAlert).toBeDefined();
    expect(twAlert?.severity).toBe('critical');
    expect(twAlert?.title).toContain('Triple Whammy');
    expect(twAlert?.citationIds?.every((c) => !c.startsWith('TODO:'))).toBe(true);
  });

  it('contains 0 TODO citations across all safety rules, duplicate rules, and emergency red flags', () => {
    for (const rule of INTERACTION_RULES) {
      expect(rule.citationIds.length).toBeGreaterThan(0);
      expect(rule.citationIds.some((c) => c.startsWith('TODO:'))).toBe(false);
    }
    for (const rule of DUPLICATE_CLASS_RULES) {
      expect(rule.citationIds.length).toBeGreaterThan(0);
      expect(rule.citationIds.some((c) => c.startsWith('TODO:'))).toBe(false);
    }

    const criticalPatient: Patient = {
      age: 70,
      sbp: 75,
      dbp: 45,
      hr: 165,
      k: 6.8,
      currentMeds: [
        { drugId: 'enalapril', name: 'Enalapril' },
        { drugId: 'metformin', name: 'Metformin' },
        { drugId: 'simvastatin', name: 'Simvastatin', dose: 80 }
      ],
      selectedModules: ['ckd', 'hf'],
      conditions: { pregnant: true, priorAngioedema: true }
    };

    const redFlags = checkEmergencyRedFlags(criticalPatient, { egfr: 20 });
    expect(redFlags.length).toBeGreaterThanOrEqual(3);
    for (const rf of redFlags) {
      expect(rf.citationIds.some((c) => c.startsWith('TODO:'))).toBe(false);
    }

    const reviewRecs = reviewCurrentMedications(criticalPatient, { egfr: 20 }, dummySettings);
    for (const rec of reviewRecs) {
      expect(rec.citationIds.length).toBeGreaterThan(0);
      expect(rec.citationIds.some((c) => c.startsWith('TODO:'))).toBe(false);
    }
  });

  it('respects KB pregnancy status: Allopurinol & Colchicine (caution — FDA 8.1, R1-GOUT-018) are NOT falsely flagged as contra, while Enalapril (contra) IS blocked', () => {
    expect(isPregnancyContraindicated('allopurinol')).toBe(false);
    // R1-GOUT-018: nhãn FDA Colcrys Mục 8.1 không chống chỉ định colchicine trong thai kỳ (KB status = 'caution').
    expect(isPregnancyContraindicated('colchicine')).toBe(false);
    expect(isPregnancyContraindicated('enalapril')).toBe(true);

    const pregnantPatient: Patient = {
      age: 30,
      sex: 'female',
      currentMeds: [
        { drugId: 'allopurinol', name: 'Allopurinol 100 mg' },
        { drugId: 'colchicine', name: 'Colchicine 0.5 mg' }
      ],
      selectedModules: ['gout'],
      conditions: { pregnancy: true }
    };

    const reviewRecs = reviewCurrentMedications(pregnantPatient, { egfr: 90 }, dummySettings);
    expect(reviewRecs.some((r) => r.drugId === 'allopurinol')).toBe(false);
    // Colchicine 'caution' → rà soát thuốc nền KHÔNG được phát STOP tuyệt đối do thai kỳ.
    expect(reviewRecs.some((r) => r.drugId === 'colchicine' && r.action === 'STOP')).toBe(false);
    // Enalapril (contra) trong thai kỳ vẫn bị STOP kèm trích dẫn.
    const enaStop = reviewCurrentMedications(
      { ...pregnantPatient, currentMeds: [{ drugId: 'enalapril', name: 'Enalapril 5 mg' }], selectedModules: ['htn'] },
      { egfr: 90 },
      dummySettings
    ).find((r) => r.drugId === 'enalapril');
    expect(enaStop?.action).toBe('STOP');
    expect(enaStop?.citationIds.length).toBeGreaterThan(0);

    const alloStartRec: Recommendation = {
      id: 'test_allo',
      module: 'gout',
      tier: 'Hạ acid uric',
      action: 'START',
      drugId: 'allopurinol',
      title: 'Khởi trị Allopurinol',
      rationale: 'Test',
      gates: [],
      citationIds: ['eular.gout.2016.allopurinol_start'],
      priority: 80
    };
    const { updatedRec } = evaluateSafetyGates(alloStartRec, pregnantPatient, { egfr: 90 });
    expect(updatedRec.action).toBe('START');
  });

  it('flags Simvastatin > 20 mg with Amlodipine as REDUCE and Simvastatin 80 mg as STOP with verified citations', () => {
    const patientSimvaAmlo: Patient = {
      age: 62,
      currentMeds: [
        { drugId: 'simvastatin', name: 'Simvastatin', dose: '40 mg' },
        { drugId: 'amlodipine', name: 'Amlodipine', dose: '5 mg' }
      ],
      selectedModules: ['lipid', 'htn'],
      conditions: { htn: true }
    };

    const recs = reviewCurrentMedications(patientSimvaAmlo, { egfr: 75 }, dummySettings);
    const reduceSimva = recs.find((r) => r.drugId === 'simvastatin');
    expect(reduceSimva).toBeDefined();
    expect(reduceSimva?.action).toBe('REDUCE');
    expect(reduceSimva?.citationIds).toContain('acc.lipid.2026.simva_contra_80mg');
  });

  it('detects inhaler component duplication (dup.laba, dup.lama, dup.ics) across KB FDC inhalers and currentMeds', () => {
    const dupAlerts = checkDuplicates(
      [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy' }],
      [
        {
          id: 'rec_symbicort',
          module: 'asthma',
          tier: 'MART',
          action: 'START',
          drugId: 'budesonide_formoterol',
          title: 'Budesonide/Formoterol',
          rationale: 'Test',
          gates: [],
          citationIds: ['gina.asthma.2026.track1_preferred'],
          priority: 80
        }
      ]
    );

    expect(dupAlerts.some((a) => a.id === 'dup.laba')).toBe(true);
    expect(dupAlerts.some((a) => a.id === 'dup.ics')).toBe(true);
    for (const a of dupAlerts) {
      expect(a.citationIds?.some((c) => c.startsWith('TODO:'))).toBe(false);
    }

    // LAMA duplication in currentMeds (Tiotropium + Spiolto)
    const lamaDupAlerts = checkDuplicates(
      [
        { drugId: 'tiotropium' },
        { drugId: 'tiotropium_olodaterol' }
      ],
      []
    );
    expect(lamaDupAlerts.some((a) => a.id === 'dup.lama')).toBe(true);

    // Step-up SWITCH from tiotropium -> tiotropium_olodaterol must NOT false-positive dup.lama
    const stepUpNoDup = checkDuplicates(
      [{ drugId: 'tiotropium' }],
      [
        {
          id: 'rec_stepup',
          module: 'copd',
          tier: 'Theo dõi',
          action: 'SWITCH',
          drugId: 'tiotropium_olodaterol',
          title: 'Nâng bậc lên LABA + LAMA',
          rationale: 'Test',
          gates: [],
          citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama'],
          priority: 75
        }
      ]
    );
    expect(stepUpNoDup.some((a) => a.id === 'dup.lama')).toBe(false);
  });

  it('loads all 65 KB interaction rules via getAllInteractions() with 0 false positives on non-interacting statin + DHP-CCB / fenofibrate pairs', () => {
    expect(KB_INTERACTION_RULES.length).toBeGreaterThanOrEqual(65);
    for (const r of KB_INTERACTION_RULES) {
      expect(r.citationIds.length).toBeGreaterThan(0);
      expect(r.citationIds.some((c) => c.startsWith('TODO:'))).toBe(false);
    }

    // Rosuvastatin + Amlodipine + Fenofibrate should NOT trigger ix.statin_amlodipine or ix.statin_gemfibrozil
    const safeLipidPatient: Patient = {
      age: 58,
      currentMeds: [
        { drugId: 'rosuvastatin', name: 'Rosuvastatin 20 mg' },
        { drugId: 'amlodipine', name: 'Amlodipine 5 mg' },
        { drugId: 'fenofibrate', name: 'Fenofibrate 145 mg' }
      ],
      selectedModules: ['lipid', 'htn'],
      conditions: { htn: true }
    };
    const alertsSafe = checkInteractions(safeLipidPatient, { egfr: 80 }, []);
    expect(alertsSafe.some((a) => a.id === 'ix.statin_amlodipine')).toBe(false);
    expect(alertsSafe.some((a) => a.id === 'ix.statin_gemfibrozil')).toBe(false);

    // Simvastatin 40 mg + Amlodipine MUST trigger ix.statin_amlodipine with doseExceeded critical severity
    const simvaAmloPatient: Patient = {
      age: 58,
      currentMeds: [
        { drugId: 'simvastatin', name: 'Simvastatin', dose: 40 },
        { drugId: 'amlodipine', name: 'Amlodipine', dose: 5 }
      ],
      selectedModules: ['lipid', 'htn'],
      conditions: { htn: true }
    };
    const alertsSimva = checkInteractions(simvaAmloPatient, { egfr: 80 }, []);
    const simvaAlert = alertsSimva.find((a) => a.id === 'ix.statin_amlodipine');
    expect(simvaAlert).toBeDefined();
    expect(simvaAlert?.severity).toBe('critical');
  });

  it('R3-HF-02 & R3-HF-08 & R1: gates.ts NEVER overwrites STOP to AVOID or HOLD, blocks CONSIDER in pregnancy, and checkEmergencyRedFlags fires at K+ >= 6.0', () => {
    const pregnantHyperKPatient: Patient = {
      age: 31,
      sex: 'female',
      k: 6.2,
      currentMeds: [{ drugId: 'spironolactone', name: 'Spironolactone' }],
      selectedModules: ['hf', 'ckd'],
      conditions: { pregnant: true, hf: true }
    };

    // STOP from reviewMeds must stay STOP through evaluateSafetyGates (never turned into AVOID or HOLD)
    const stopRec: Recommendation = {
      id: 'med_review_stop_spiro',
      module: 'ckd',
      tier: 'Cảnh báo thai kỳ',
      action: 'STOP',
      drugId: 'spironolactone',
      title: 'NGỪNG NGAY Spironolactone',
      rationale: 'Đang mang thai và K+ = 6.2',
      gates: [],
      citationIds: ['esc.hf.2026.pregnancy_contra'],
      priority: 100
    };
    const { updatedRec: afterGate } = evaluateSafetyGates(stopRec, pregnantHyperKPatient, { egfr: 60 });
    expect(afterGate.action).toBe('STOP');

    // CONSIDER for ivabradine, vericiguat, semaglutide, tirzepatide in pregnancy must become AVOID
    for (const pregContraDrug of ['ivabradine', 'vericiguat', 'semaglutide', 'semaglutide_oral', 'dulaglutide', 'liraglutide', 'tirzepatide']) {
      expect(isPregnancyContraindicated(pregContraDrug)).toBe(true);
      const considerRec: Recommendation = {
        id: `consider_${pregContraDrug}`,
        module: 'hf',
        tier: 'Bổ sung',
        action: 'CONSIDER',
        drugId: pregContraDrug,
        title: `Cân nhắc ${pregContraDrug}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['esc.hf.2026.pregnancy_contra'],
        priority: 70
      };
      const gated = evaluateSafetyGates(considerRec, pregnantHyperKPatient, { egfr: 80 });
      expect(gated.updatedRec.action).toBe('AVOID');
    }

    // K+ = 6.0 triggers emergency REFER
    const redFlagsAt60 = checkEmergencyRedFlags({ ...pregnantHyperKPatient, k: 6.0, sbp: 120, dbp: 75, hr: 80 }, { egfr: 60 });
    expect(redFlagsAt60.some((rf) => rf.id === 'emergency_hyperkalemia_critical' && rf.action === 'REFER')).toBe(true);
  });

  it('R3-HF-03 & R3-HF-07 & R2: enforces STOP/AVOID and interaction alerts for HFrEF Class III meds, Ivabradine in AF, Non-selective BB in Asthma, PDE-5i + Vericiguat/Nitrate, Eplerenone + Clarithromycin, and MRA + Trimethoprim', () => {
    const hfRefPatient: Patient = {
      age: 66,
      lvef: 30,
      rhythm: 'afib',
      currentMeds: [
        { drugId: 'diltiazem' },
        { drugId: 'pioglitazone' },
        { drugId: 'saxagliptin' },
        { drugId: 'flecainide' },
        { drugId: 'dronedarone' },
        { drugId: 'ibuprofen' },
        { drugId: 'ivabradine' }
      ],
      selectedModules: ['hf', 'af', 'dm2'],
      conditions: { hf: true, af: true, dm: true }
    };

    const stops = reviewCurrentMedications(hfRefPatient, { egfr: 65 }, dummySettings);
    for (const id of ['diltiazem', 'pioglitazone', 'saxagliptin', 'flecainide', 'dronedarone', 'ibuprofen', 'ivabradine']) {
      const found = stops.find((r) => r.drugId === id);
      expect(found?.action).toBe('STOP');
      expect(found?.title).not.toContain('undefined');
    }

    // Asthma + Carvedilol -> STOP
    const asthmaPatient: Patient = {
      age: 45,
      currentMeds: [{ drugId: 'carvedilol', name: 'Carvedilol 6.25 mg' }],
      selectedModules: ['asthma', 'hf'],
      conditions: { asthma: true, hf: true }
    };
    const asthmaStops = reviewCurrentMedications(asthmaPatient, { egfr: 85 }, dummySettings);
    expect(asthmaStops.find((r) => r.drugId === 'carvedilol')?.action).toBe('STOP');

    // PDE-5i (sildenafil) + CONSIDER vericiguat -> AVOID in gates.ts AND critical alert in checkInteractions
    const sildenafilPatient: Patient = {
      age: 64,
      lvef: 28,
      currentMeds: [{ drugId: 'sildenafil', name: 'Sildenafil 50 mg' }],
      selectedModules: ['hf'],
      conditions: { hf: true }
    };
    const considerVeri: Recommendation = {
      id: 'rec_vericiguat',
      module: 'hf',
      tier: 'Bước 2',
      action: 'CONSIDER',
      drugId: 'vericiguat',
      title: 'Cân nhắc Vericiguat',
      rationale: 'Test',
      gates: [],
      citationIds: ['esc.hf.2026.vericiguat_rec'],
      priority: 70
    };
    const veriGated = evaluateSafetyGates(considerVeri, sildenafilPatient, { egfr: 60 });
    expect(veriGated.updatedRec.action).toBe('AVOID');
    const pdeAlerts = checkInteractions(sildenafilPatient, { egfr: 60 }, [considerVeri]);
    expect(pdeAlerts.some((a) => a.id === 'ix.pde5i_nitrate_vericiguat' && a.severity === 'critical')).toBe(true);

    // R2: Clarithromycin + CONSIDER Ivabradine, Eplerenone + Clarithromycin, Spironolactone + Cotrimoxazole
    const clarithroPatient: Patient = {
      age: 60,
      currentMeds: [
        { drugId: 'clarithromycin', name: 'Clarithromycin 500 mg' },
        { drugId: 'eplerenone', name: 'Eplerenone 25 mg' },
        { drugId: 'cotrimoxazole', name: 'Cotrimoxazole 960 mg' }
      ],
      selectedModules: ['hf'],
      conditions: { hf: true }
    };
    const considerIva: Recommendation = {
      id: 'rec_iva',
      module: 'hf',
      tier: 'Kiểm soát tần số xoang',
      action: 'CONSIDER',
      drugId: 'ivabradine',
      title: 'Cân nhắc Ivabradine',
      rationale: 'Test',
      gates: [],
      citationIds: ['esc.hf.2026.ivabradine_rec'],
      priority: 72
    };
    const r2Alerts = checkInteractions(clarithroPatient, { egfr: 70 }, [considerIva]);
    expect(r2Alerts.some((a) => a.id === 'ix.ivabradine_strong_cyp3a4')).toBe(true);
    expect(r2Alerts.some((a) => a.id === 'ix.eplerenone_strong_cyp3a4')).toBe(true);
    expect(r2Alerts.some((a) => a.id === 'ix.rasi_mra_trimethoprim')).toBe(true);
  });

  it('R3-HF-05 & R3-HF-18: gates CONTINUE/CONSIDER to HOLD when SBP < 90 mmHg and syncs beta-blocker HR threshold to < 50 bpm', () => {
    const lowBpPatient: Patient = {
      age: 68,
      sbp: 85,
      dbp: 55,
      hr: 52,
      currentMeds: [{ drugId: 'dapagliflozin', name: 'Dapagliflozin 10 mg' }],
      selectedModules: ['hf'],
      conditions: { hf: true }
    };

    const continueDapa: Recommendation = {
      id: 'cont_dapa',
      module: 'hf',
      tier: 'Tứ trụ',
      action: 'CONTINUE',
      drugId: 'dapagliflozin',
      title: 'Duy trì Dapagliflozin',
      rationale: 'Test',
      gates: [],
      citationIds: ['kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf'],
      priority: 90
    };
    expect(evaluateSafetyGates(continueDapa, lowBpPatient, { egfr: 55 }).updatedRec.action).toBe('HOLD');

    // Beta-blocker at HR = 52 bpm (with normal SBP = 120) MUST PASS (ESC threshold is < 50 bpm, NOT < 55)
    const startBiso: Recommendation = {
      id: 'start_biso',
      module: 'hf',
      tier: 'Tứ trụ',
      action: 'START',
      drugId: 'bisoprolol',
      title: 'Khởi trị Bisoprolol',
      rationale: 'Test',
      gates: [],
      citationIds: ['esc.hf.2026.bb_doses'],
      priority: 92
    };
    expect(
      evaluateSafetyGates(startBiso, { ...lowBpPatient, sbp: 120, hr: 52 }, { egfr: 55 }).updatedRec.action
    ).toBe('START');
    expect(
      evaluateSafetyGates(startBiso, { ...lowBpPatient, sbp: 120, hr: 48 }, { egfr: 55 }).updatedRec.action
    ).toBe('HOLD');
  });

  it('R3-GOUT-17 & CKD-R2-R3-12: excludes STOP/HOLD currentMeds from interaction checks against START recs and deduplicates SZC 2-hour separation warning', () => {
    // 1. Patient on ibuprofen -> STOP ibuprofen + START prednisolone -> 0 false NSAID+Steroid GI bleed alert!
    const goutFlarePatient: Patient = {
      age: 68,
      currentMeds: [{ drugId: 'ibuprofen', name: 'Ibuprofen 400 mg' }],
      selectedModules: ['gout', 'ckd'],
      conditions: { gout: true, ckd: true }
    };
    const goutRecs: Recommendation[] = [
      {
        id: 'stop_ibu',
        module: 'ckd',
        tier: 'An toàn',
        action: 'STOP',
        drugId: 'ibuprofen',
        title: 'NGỪNG Ibuprofen',
        rationale: 'CKD G4',
        gates: [],
        citationIds: ['kdigo.ckd.2024.avoid_nsaids'],
        priority: 95
      },
      {
        id: 'start_pred',
        module: 'gout',
        tier: 'Cắt cơn cấp',
        action: 'START',
        drugId: 'prednisolone',
        title: 'Khởi trị Prednisolone',
        rationale: 'Cắt cơn gút cấp',
        gates: [],
        citationIds: ['eular.gout.2016.prednisolone_flare'],
        priority: 90
      }
    ];
    const alertsStoppedNsaid = checkInteractions(goutFlarePatient, { egfr: 24 }, goutRecs);
    expect(alertsStoppedNsaid.some((a) => a.drugIds?.includes('ibuprofen'))).toBe(false);

    // 2. SZC + active oral med emits AT MOST ONE 2-hour separation alert (no duplicate ix.potassium_binder_drug_binding + ix.szc_binder_separation)
    const szcPatient: Patient = {
      age: 65,
      currentMeds: [{ drugId: 'amlodipine', name: 'Amlodipine 5 mg' }],
      selectedModules: ['ckd'],
      conditions: { ckd: true }
    };
    const szcStartRec: Recommendation = {
      id: 'start_szc',
      module: 'ckd',
      tier: 'Hạ kali máu',
      action: 'START',
      drugId: 'sodium_zirconium_cyclosilicate',
      title: 'Khởi trị SZC',
      rationale: 'Tăng kali máu',
      gates: [],
      citationIds: ['kdigo.ckd.2024.hyperkalemia'],
      priority: 92
    };
    const szcAlerts = checkInteractions(szcPatient, { egfr: 25 }, [szcStartRec]);
    const binderAlerts = szcAlerts.filter(
      (a) => a.id === 'ix.potassium_binder_drug_binding' || a.id === 'ix.szc_binder_separation'
    );
    expect(binderAlerts.length).toBeLessThanOrEqual(1);

    // And if the ONLY oral med in currentMeds is HELD, 0 binder separation alert!
    const heldAmloRec: Recommendation = {
      id: 'hold_amlo',
      module: 'ckd',
      tier: 'An toàn huyết động',
      action: 'HOLD',
      drugId: 'amlodipine',
      title: 'TẠM NGƯNG Amlodipine',
      rationale: 'Tụt HA',
      gates: [],
      citationIds: ['esc.htn.2024.hypotension'],
      priority: 95
    };
    const szcAlertsWhenHeld = checkInteractions(szcPatient, { egfr: 25 }, [szcStartRec, heldAmloRec]);
    expect(
      szcAlertsWhenHeld.some(
        (a) => a.id === 'ix.potassium_binder_drug_binding' || a.id === 'ix.szc_binder_separation'
      )
    ).toBe(false);
  });

  it('R3-GOUT-01, R3-R2-COPD-01 & R3-R2-COPD-05: detects dup.xoi, dup.systemic_steroid, breztri/alias triple inhalers, and preserves multi-inhaler baseline on untargeted SWITCH', () => {
    // 1. dup.xoi
    const xoiDups = checkDuplicates(
      [{ drugId: 'allopurinol' }, { drugId: 'febuxostat' }],
      []
    );
    expect(xoiDups.some((a) => a.id === 'dup.xoi')).toBe(true);

    // 2. dup.systemic_steroid
    const steroidDups = checkDuplicates(
      [],
      [
        {
          id: 'r1',
          module: 'copd',
          tier: 'Cấp cứu',
          action: 'START',
          drugId: 'prednisolone',
          title: 'Prednisolone',
          rationale: 'Test',
          gates: [],
          citationIds: ['gold.copd.2026.exac_systemic_steroid_40mg_5d'],
          priority: 90
        },
        {
          id: 'r2',
          module: 'asthma',
          tier: 'Cấp cứu',
          action: 'START',
          drugId: 'methylprednisolone',
          title: 'Methylprednisolone',
          rationale: 'Test',
          gates: [],
          citationIds: ['byt.asthma.2021.acute_iv_steroid_ipratropium'],
          priority: 90
        }
      ]
    );
    expect(steroidDups.some((a) => a.id === 'dup.systemic_steroid')).toBe(true);

    // 3. R3-R2-COPD-01: Patient on 2 baseline inhalers (tiotropium + budesonide_formoterol) + untargeted SWITCH to tiotropium_olodaterol -> MUST still flag LABA duplication!
    const multiInhalerAlerts = checkDuplicates(
      [{ drugId: 'tiotropium' }, { drugId: 'budesonide_formoterol' }],
      [
        {
          id: 'sw_spiolto',
          module: 'copd',
          tier: 'Nâng bậc',
          action: 'SWITCH',
          drugId: 'tiotropium_olodaterol',
          title: 'Chuyển sang Tiotropium/Olodaterol',
          rationale: 'Test',
          gates: [],
          citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama'],
          priority: 85
        }
      ]
    );
    expect(multiInhalerAlerts.some((a) => a.id === 'dup.laba')).toBe(true);

    // 4. Explicit switchFrom removes ONLY the targeted baseline inhaler
    const targetedSwitchAlerts = checkDuplicates(
      [{ drugId: 'tiotropium' }],
      [
        {
          id: 'sw_breztri',
          module: 'copd',
          tier: 'Nâng bậc',
          action: 'SWITCH',
          drugId: 'breztri',
          switchFrom: 'tiotropium',
          title: 'Chuyển sang Breztri',
          rationale: 'Test',
          gates: [],
          citationIds: ['byt.copd.2026.triple_therapy_indication'],
          priority: 90
        }
      ]
    );
    expect(targetedSwitchAlerts.length).toBe(0);
  });

  it('CKD-R2-R3-01, CKD-R2-R3-05 & R3-R2-COPD-06: blocks Finerenone on dialysis, holds chronic preventive oral STARTs at SBP < 90 while keeping acute rescue meds, and enforces DPI milk allergy / LAMA glaucoma-urinary gates', () => {
    // 1. CKD-R2-R3-01: Finerenone on dialysis with post-dialysis eGFR = 22 -> STOP in reviewMeds & AVOID in gates
    const dialysisPatient: Patient = {
      age: 62,
      sbp: 132,
      dbp: 78,
      k: 4.5,
      currentMeds: [{ drugId: 'finerenone', dose: 10, unit: 'mg' }],
      selectedModules: ['ckd', 'dm2'],
      conditions: { ckd: true, dm: true, onDialysis: true }
    };
    const dialysisReview = reviewCurrentMedications(dialysisPatient, { egfr: 22 }, dummySettings);
    expect(dialysisReview.find((r) => r.drugId === 'finerenone')?.action).toBe('STOP');

    const startFineRec: Recommendation = {
      id: 'start_fine',
      module: 'ckd',
      tier: 'Bảo vệ thận',
      action: 'START',
      drugId: 'finerenone',
      title: 'Khởi trị Finerenone',
      rationale: 'Test',
      gates: [],
      citationIds: ['fda.finerenone.table_1_starting_dose'],
      priority: 85
    };
    expect(evaluateSafetyGates(startFineRec, dialysisPatient, { egfr: 22 }).updatedRec.action).toBe('AVOID');

    // 2. CKD-R2-R3-05: Shock SBP = 82 mmHg holds routine chronic oral STARTs (atorvastatin, metformin, semaglutide) while allowing acute salbutamol / calcium_gluconate
    const shockPatient: Patient = {
      age: 67,
      sbp: 82,
      dbp: 50,
      hr: 108,
      currentMeds: [],
      selectedModules: ['ckd', 'dm2', 'lipid', 'copd'],
      conditions: { ckd: true, dm: true, copd: true }
    };
    for (const chronicDrug of ['atorvastatin', 'metformin', 'semaglutide']) {
      const chronicRec: Recommendation = {
        id: `start_${chronicDrug}`,
        module: 'dm2',
        tier: 'Dự phòng mạn tính',
        action: 'START',
        drugId: chronicDrug,
        title: `Khởi trị ${chronicDrug}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['ada2026'],
        priority: 80
      };
      expect(evaluateSafetyGates(chronicRec, shockPatient, { egfr: 55 }).updatedRec.action).toBe('HOLD');
    }

    for (const emergencyDrug of ['salbutamol', 'calcium_gluconate', 'prednisolone']) {
      const acuteRec: Recommendation = {
        id: `acute_${emergencyDrug}`,
        module: 'copd',
        tier: 'Cấp cứu nội viện',
        action: 'START',
        drugId: emergencyDrug,
        title: `Cấp cứu ${emergencyDrug}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['gold.copd.2026.exac_saba'],
        priority: 95
      };
      expect(evaluateSafetyGates(acuteRec, shockPatient, { egfr: 55 }).updatedRec.action).toBe('START');
    }

    // 3. R3-R2-COPD-06: Severe milk protein allergy & narrow-angle glaucoma / urinary retention gates on alias fluticasone_umeclidinium_vilanterol
    const trelegyAliasRec: Recommendation = {
      id: 'start_trelegy_alias',
      module: 'copd',
      tier: 'Phác đồ 3 thuốc',
      action: 'START',
      drugId: 'fluticasone_umeclidinium_vilanterol',
      title: 'Khởi trị Trelegy Ellipta',
      rationale: 'Test',
      gates: [],
      citationIds: ['byt.copd.2026.triple_therapy_indication'],
      priority: 92
    };

    const milkAllergyPatient: Patient = {
      age: 64,
      sbp: 126,
      currentMeds: [],
      selectedModules: ['copd'],
      conditions: { copd: true },
      customInputs: { severeMilkProteinAllergy: true }
    };
    expect(evaluateSafetyGates(trelegyAliasRec, milkAllergyPatient, { egfr: 75 }).updatedRec.action).toBe('AVOID');

    const glaucomaPatient: Patient = {
      age: 68,
      sbp: 128,
      currentMeds: [],
      selectedModules: ['copd'],
      conditions: { copd: true },
      customInputs: { narrowAngleGlaucoma: true }
    };
    expect(evaluateSafetyGates(trelegyAliasRec, glaucomaPatient, { egfr: 75 }).updatedRec.action).toBe('AVOID');
  });

  it('R3-R2-DM2-06: enforces Global Perioperative SGLT2i Gate (HOLD 3d/4d vs DEFER) and Global Acute Hypoglycemia Gate (< 3.9 mmol/L) across all modules', () => {
    // 1. Perioperative SGLT2i Gate: active empagliflozin_metformin -> HOLD (3 days), active ertugliflozin -> HOLD (4 days), non-active dapagliflozin -> DEFER
    const preopPatient: Patient = {
      age: 66,
      sbp: 128,
      currentMeds: [
        { drugId: 'empagliflozin_metformin', name: 'Synjardy 12.5/1000 mg' },
        { drugId: 'ertugliflozin', name: 'Steglatro 5 mg' }
      ],
      selectedModules: ['ckd', 'hf', 'dm2'],
      conditions: { ckd: true, hf: true, dm: true },
      customInputs: { plannedSurgery: true }
    };

    const contSynjardy: Recommendation = {
      id: 'cont_synjardy',
      module: 'dm2',
      tier: 'Nền tảng',
      action: 'CONTINUE',
      drugId: 'empagliflozin_metformin',
      title: 'Duy trì Empagliflozin/Metformin',
      rationale: 'Test',
      gates: [],
      citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery'],
      priority: 85
    };
    const gatedSynjardy = evaluateSafetyGates(contSynjardy, preopPatient, { egfr: 65 });
    expect(gatedSynjardy.updatedRec.action).toBe('HOLD');
    expect(gatedSynjardy.updatedRec.rationale).toContain('3 ngày');

    const contErtu: Recommendation = {
      id: 'cont_ertu',
      module: 'dm2',
      tier: 'Nền tảng',
      action: 'CONTINUE',
      drugId: 'ertugliflozin',
      title: 'Duy trì Ertugliflozin',
      rationale: 'Test',
      gates: [],
      citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery'],
      priority: 85
    };
    const gatedErtu = evaluateSafetyGates(contErtu, preopPatient, { egfr: 65 });
    expect(gatedErtu.updatedRec.action).toBe('HOLD');
    expect(gatedErtu.updatedRec.rationale).toContain('4 ngày');

    const startDapaFromCkd: Recommendation = {
      id: 'rec_ckd_start_dapa',
      module: 'ckd',
      tier: 'Trụ cột bảo vệ thận',
      action: 'START',
      drugId: 'dapagliflozin',
      title: 'Khởi trị Dapagliflozin 10 mg',
      rationale: 'Test',
      gates: [],
      citationIds: ['kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf'],
      priority: 92
    };
    const gatedDapaNew = evaluateSafetyGates(startDapaFromCkd, preopPatient, { egfr: 45 });
    expect(gatedDapaNew.updatedRec.action).toBe('DEFER');

    // Med review also emits HOLD for baseline SGLT2i even when only ['ckd', 'hf'] are selected
    const preopMedReview = reviewCurrentMedications(
      { ...preopPatient, selectedModules: ['ckd', 'hf'] },
      { egfr: 55 },
      dummySettings
    );
    expect(preopMedReview.find((r) => r.drugId === 'empagliflozin_metformin')?.action).toBe('HOLD');
    expect(preopMedReview.find((r) => r.drugId === 'ertugliflozin')?.action).toBe('HOLD');

    // 2. Global Acute Hypoglycemia Gate (glucose = 2.6 mmol/L < 3.9 mmol/L)
    const hypoPatient: Patient = {
      age: 70,
      sbp: 132,
      hr: 88,
      glucose: 2.6,
      currentMeds: [{ drugId: 'glimepiride', name: 'Glimepiride 4 mg' }],
      selectedModules: ['dm2', 'hf', 'ckd', 'lipid'],
      conditions: { dm: true, hf: true, ckd: true }
    };

    for (const [mod, chronicId] of [
      ['hf', 'bisoprolol'],
      ['ckd', 'dapagliflozin'],
      ['dm2', 'semaglutide'],
      ['lipid', 'atorvastatin']
    ] as const) {
      const chronicStart: Recommendation = {
        id: `rec_${mod}_${chronicId}`,
        module: mod,
        tier: 'Tối ưu hóa mạn tính',
        action: 'START',
        drugId: chronicId,
        title: `Khởi trị ${chronicId}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['ada.dm2.2026.hypo_level2_3mmol'],
        priority: 90
      };
      const gatedChronic = evaluateSafetyGates(chronicStart, hypoPatient, { egfr: 50 });
      expect(gatedChronic.updatedRec.action).toBe('DEFER');
    }

    // Acute hypoglycemia rescue (dextrose_iv, glucagon, rule of 15) MUST remain START!
    const dextroseRescue: Recommendation = {
      id: 'rec_dm2_hypo_dextrose',
      module: 'dm2',
      tier: 'Cấp cứu hạ đường huyết',
      action: 'START',
      drugId: 'dextrose_iv',
      title: 'Tiêm tĩnh mạch Glucose ưu trương / Glucagon cấp cứu',
      rationale: 'Xử trí hạ đường huyết độ 2-3.',
      gates: [],
      citationIds: ['ada.dm2.2026.hypo_level2_3mmol'],
      priority: 100
    };
    expect(evaluateSafetyGates(dextroseRescue, hypoPatient, { egfr: 50 }).updatedRec.action).toBe('START');

    const rule15Rescue: Recommendation = {
      id: 'rec_dm2_hypo_rule15',
      module: 'dm2',
      tier: 'Cấp cứu hạ đường huyết',
      action: 'START',
      title: 'Quy tắc 15-15 xử trí hạ đường huyết cấp',
      rationale: '15g carbohydrate hấp thu nhanh.',
      gates: [],
      citationIds: ['ada.dm2.2026.hypo_rule_of_15'],
      priority: 100
    };
    expect(evaluateSafetyGates(rule15Rescue, hypoPatient, { egfr: 50 }).updatedRec.action).toBe('START');
  });

  it('R3-R2-DM2-08 & R3-R2-DM2-12: checkDuplicates flags duplicate Sulfonylureas and duplicate long-acting basal insulins as critical while permitting morning NPH + evening Glargine', () => {
    // 1. Duplicate Sulfonylureas (gliclazide + glimepiride, and gliclazide + glyburide) -> critical dup.su
    const suDupAlerts1 = checkDuplicates(
      [
        { drugId: 'gliclazide', name: 'Gliclazide MR 60 mg' },
        { drugId: 'glimepiride', name: 'Glimepiride 2 mg' }
      ],
      []
    );
    const suAlert1 = suDupAlerts1.find((a) => a.id === 'dup.su');
    expect(suAlert1).toBeDefined();
    expect(suAlert1?.severity).toBe('critical');

    const suDupAlerts2 = checkDuplicates(
      [
        { drugId: 'gliclazide', name: 'Gliclazide MR 30 mg' },
        { drugId: 'glyburide', name: 'Glibenclamide 5 mg' }
      ],
      []
    );
    expect(suDupAlerts2.some((a) => a.id === 'dup.su' && a.severity === 'critical')).toBe(true);

    // 2. Duplicate long-acting basal insulins (insulin_glargine + insulin_degludec, lantus + tresiba) -> critical dup.basal_insulin
    const basalDupAlerts = checkDuplicates(
      [{ drugId: 'insulin_glargine', name: 'Lantus 20 U' }],
      [
        {
          id: 'start_degludec',
          module: 'dm2',
          tier: 'Insulin nền',
          action: 'START',
          drugId: 'insulin_degludec',
          title: 'Khởi trị Degludec',
          rationale: 'Test',
          gates: [],
          citationIds: ['ada.dm2.2026.basal_start_and_titration'],
          priority: 88
        }
      ]
    );
    const basalAlert = basalDupAlerts.find((a) => a.id === 'dup.basal_insulin');
    expect(basalAlert).toBeDefined();
    expect(basalAlert?.severity).toBe('critical');

    const brandBasalDupAlerts = checkDuplicates(
      [
        { drugId: 'lantus', name: 'Lantus' },
        { drugId: 'tresiba', name: 'Tresiba' }
      ],
      []
    );
    expect(brandBasalDupAlerts.some((a) => a.id === 'dup.basal_insulin' && a.severity === 'critical')).toBe(true);

    // 3. R3-R2-DM2-12: Evening insulin_glargine + Morning insulin_nph (steroid protocol) -> NO dup.basal_insulin alert!
    const steroidNphAlerts = checkDuplicates(
      [{ drugId: 'insulin_glargine', name: 'Insulin Glargine 18 U tối' }],
      [
        {
          id: 'start_steroid_nph',
          module: 'dm2',
          tier: 'Tăng đường huyết do Corticoid',
          action: 'START',
          drugId: 'insulin_nph',
          title: 'Khởi trị Insulin NPH buổi sáng',
          rationale: 'Phủ đỉnh Prednisolone ban ngày.',
          gates: [],
          citationIds: ['ada.dm2.2026.steroid_nph'],
          priority: 92
        }
      ]
    );
    expect(steroidNphAlerts.some((a) => a.id === 'dup.basal_insulin')).toBe(false);
  });

  it('CKD-R3-R3-03: converts chronic START/UPTITRATE to DEFER during Acute AKI or Outpatient Crisis while preserving 100% of emergency rescue therapies', () => {
    const akiPatient: Patient = {
      age: 68,
      sex: 'male',
      sbp: 128,
      dbp: 76,
      hr: 82,
      scr: 210,
      k: 5.1,
      currentMeds: [],
      selectedModules: ['ckd', 'dm2', 'lipid'],
      conditions: { ckd: true, dm: true },
      customInputs: { baselineScr: 110 } // 210 >= 1.5 * 110 & +100 >= 26.5 -> Acute AKI!
    };

    for (const chronicId of ['dapagliflozin', 'finerenone', 'atorvastatin', 'metformin', 'semaglutide']) {
      const rec: Recommendation = {
        id: `start_${chronicId}`,
        module: 'ckd',
        tier: 'Điều trị nền mạn tính',
        action: 'START',
        drugId: chronicId,
        title: `Khởi trị ${chronicId}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d'],
        priority: 85
      };
      // At eGFR = 38 (non-contra renal range), Acute AKI converts all routine chronic STARTs (including Metformin) to DEFER!
      expect(evaluateSafetyGates(rec, akiPatient, { egfr: 38 }, dummySettings).updatedRec.action).toBe('DEFER');
    }

    // Outpatient hyperkalemic crisis (K+ = 6.4, setting = outpatient): chronic Atorvastatin START -> DEFER, rescue Calcium Gluconate & SZC -> START!
    const outpatientCrisis: Patient = {
      age: 64,
      sex: 'female',
      sbp: 136,
      k: 6.4,
      scr: 180,
      currentMeds: [],
      selectedModules: ['ckd', 'lipid'],
      conditions: { ckd: true }
    };
    const chronicStatin: Recommendation = {
      id: 'rec_lipid_atorva',
      module: 'lipid',
      tier: 'Hạ lipid mạn tính',
      action: 'START',
      drugId: 'atorvastatin',
      title: 'Khởi trị Atorvastatin 20 mg',
      rationale: 'Dự phòng tim mạch.',
      gates: [],
      citationIds: ['kdigo.ckd.2024.statin'],
      priority: 80
    };
    expect(evaluateSafetyGates(chronicStatin, outpatientCrisis, { egfr: 26 }, dummySettings).updatedRec.action).toBe('DEFER');

    for (const rescueId of ['calcium_gluconate', 'insulin_regular', 'sodium_zirconium_cyclosilicate', 'salbutamol']) {
      const rescueRec: Recommendation = {
        id: `rec_hyperk_rescue_${rescueId}`,
        module: 'ckd',
        tier: 'Cấp cứu tăng kali máu',
        action: 'START',
        drugId: rescueId,
        title: `Xử trí cấp cứu ${rescueId}`,
        rationale: 'Cấp cứu hạ kali máu.',
        gates: [],
        citationIds: ['ukka.2022.guideline_16_2_calcium_salts'],
        priority: 100
      };
      expect(evaluateSafetyGates(rescueRec, akiPatient, { egfr: 28 }, dummySettings).updatedRec.action).toBe('START');
      expect(evaluateSafetyGates(rescueRec, outpatientCrisis, { egfr: 26 }, dummySettings).updatedRec.action).toBe('START');
    }

    // IV Furosemide in AKI with acute pulmonary edema MUST remain START!
    const akiPulmEdema: Patient = {
      ...akiPatient,
      conditions: { ckd: true, acutePulmonaryEdema: true }
    };
    const ivLoopRec: Recommendation = {
      id: 'rec_iv_furosemide',
      module: 'hf',
      tier: 'Chống sung huyết cấp',
      action: 'START',
      drugId: 'furosemide',
      dose: '40 mg tiêm tĩnh mạch',
      title: 'Furosemide tiêm tĩnh mạch chống phù phổi cấp',
      rationale: 'Giảm tiền gánh cấp cứu.',
      gates: [],
      citationIds: ['esc.hf.2026.acute_diuretics'],
      priority: 98
    };
    expect(
      evaluateSafetyGates(ivLoopRec, akiPulmEdema, { egfr: 28 }, { ...dummySettings, setting: 'inpatient' }).updatedRec.action
    ).toBe('START');
  });

  it('CKD-R3-R2-03 & CKD-R3-R3-04: enforces global GLP-1 Boxed Warning (MTC/MEN2 & Pancreatitis) and Hepatic Child-Pugh A/B/C gates without blocking Child-Pugh A', () => {
    // 1. MTC / MEN2 blocks Semaglutide & Tirzepatide in gates (AVOID), reviewMeds (STOP), and emits critical SafetyAlert even with only ['ckd'] selected!
    const mtcPatient: Patient = {
      age: 59,
      sex: 'female',
      sbp: 128,
      scr: 150,
      k: 4.5,
      currentMeds: [{ drugId: 'semaglutide', dose: '0.5 mg/tuần' }],
      selectedModules: ['ckd'],
      conditions: { ckd: true, dm: true, mtcMen2History: true }
    };
    const mtcReview = reviewCurrentMedications(mtcPatient, { egfr: 34 }, dummySettings);
    expect(mtcReview.find((r) => r.drugId === 'semaglutide')?.action).toBe('STOP');

    const startTirzepatide: Recommendation = {
      id: 'rec_tirzepatide',
      module: 'ckd',
      tier: 'Bảo vệ tim thận',
      action: 'START',
      drugId: 'tirzepatide',
      title: 'Khởi trị Tirzepatide',
      rationale: 'Test',
      gates: [],
      citationIds: ['ada.dm2.2026.glp1'],
      priority: 85
    };
    expect(evaluateSafetyGates(startTirzepatide, mtcPatient, { egfr: 34 }, dummySettings).updatedRec.action).toBe('AVOID');

    const mtcAlerts = checkInteractions(mtcPatient, { egfr: 34 }, [startTirzepatide]);
    const boxedAlert = mtcAlerts.find((a) => a.id === 'alert.glp1_boxed_mtc_men2');
    expect(boxedAlert).toBeDefined();
    expect(boxedAlert?.severity).toBe('critical');

    // 2. Pancreatitis history blocks GLP-1 START -> AVOID, and acutePancreatitis stops active GLP-1 -> STOP
    const pancPatient: Patient = {
      age: 55,
      currentMeds: [{ drugId: 'liraglutide', dose: '1.2 mg' }],
      selectedModules: ['ckd'],
      conditions: { ckd: true, acutePancreatitis: true }
    };
    expect(reviewCurrentMedications(pancPatient, { egfr: 45 }, dummySettings).find((r) => r.drugId === 'liraglutide')?.action).toBe('STOP');
    expect(evaluateSafetyGates(startTirzepatide, { ...pancPatient, conditions: { historyPancreatitis: true } }, { egfr: 45 }).updatedRec.action).toBe('AVOID');

    // 3. Hepatic Child-Pugh A compensated cirrhosis MUST ALLOW Finerenone, Semaglutide, Roflumilast, Apixaban, Atorvastatin!
    const childAPatient: Patient = {
      age: 62,
      currentMeds: [],
      selectedModules: ['ckd', 'lipid', 'copd', 'af'],
      conditions: { cirrhosis: true },
      customInputs: { childPugh: 'A' }
    };
    for (const permittedId of ['finerenone', 'semaglutide', 'roflumilast', 'apixaban', 'atorvastatin']) {
      const rec: Recommendation = {
        id: `start_${permittedId}`,
        module: 'ckd',
        tier: 'Test Child-Pugh A',
        action: 'START',
        drugId: permittedId,
        title: `Khởi trị ${permittedId}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['fda.finerenone.hepatic_impairment'],
        priority: 80
      };
      expect(evaluateSafetyGates(rec, childAPatient, { egfr: 50 }, dummySettings).updatedRec.action).toBe('START');
    }

    // 4. Child-Pugh B blocks Roflumilast, Rivaroxaban, Ezetimibe, Benzbromarone, Vildagliptin, and caps Telmisartan <= 40 mg/day
    const childBPatient: Patient = {
      ...childAPatient,
      customInputs: { childPugh: 'B' }
    };
    for (const contraBId of ['roflumilast', 'rivaroxaban', 'ezetimibe', 'benzbromarone', 'vildagliptin']) {
      const rec: Recommendation = {
        id: `start_${contraBId}`,
        module: 'ckd',
        tier: 'Test Child-Pugh B',
        action: 'START',
        drugId: contraBId,
        title: `Khởi trị ${contraBId}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['kb'],
        priority: 80
      };
      expect(evaluateSafetyGates(rec, childBPatient, { egfr: 50 }, dummySettings).updatedRec.action).toBe('AVOID');
    }
    const telmi80Rec: Recommendation = {
      id: 'start_telmi_80',
      module: 'ckd',
      tier: 'Test Child-Pugh B Telmisartan Cap',
      action: 'START',
      drugId: 'telmisartan',
      dose: '80 mg/ngày',
      title: 'Khởi trị Telmisartan 80 mg',
      rationale: 'Test',
      gates: [],
      citationIds: ['kb'],
      priority: 80
    };
    expect(evaluateSafetyGates(telmi80Rec, childBPatient, { egfr: 50 }, dummySettings).updatedRec.action).toBe('REDUCE');

    // 5. Child-Pugh C blocks Finerenone, Telmisartan, Atorvastatin, Apixaban, Metformin, Fenofibrate (while allowing Empagliflozin per FDA §8.7)
    const childCPatient: Patient = {
      ...childAPatient,
      customInputs: { childPugh: 'C' }
    };
    for (const contraCId of ['finerenone', 'telmisartan', 'atorvastatin', 'apixaban', 'metformin', 'fenofibrate']) {
      const rec: Recommendation = {
        id: `start_${contraCId}`,
        module: 'ckd',
        tier: 'Test Child-Pugh C',
        action: 'START',
        drugId: contraCId,
        title: `Khởi trị ${contraCId}`,
        rationale: 'Test',
        gates: [],
        citationIds: ['kb'],
        priority: 80
      };
      expect(evaluateSafetyGates(rec, childCPatient, { egfr: 50 }, dummySettings).updatedRec.action).toBe('AVOID');
    }
    const empaChildCRec: Recommendation = {
      id: 'start_empa_cp_c',
      module: 'ckd',
      tier: 'Test Child-Pugh C Empagliflozin',
      action: 'START',
      drugId: 'empagliflozin',
      title: 'Khởi trị Empagliflozin',
      rationale: 'Test',
      gates: [],
      citationIds: ['kb'],
      priority: 80
    };
    expect(evaluateSafetyGates(empaChildCRec, childCPatient, { egfr: 50 }, dummySettings).updatedRec.action).toBe('START');

    // 6. ALT >= 3x ULN holds current statin (HOLD, preserving Golden lipid_10) and avoids new statin START
    const altElevPatient: Patient = {
      age: 60,
      currentMeds: [{ drugId: 'atorvastatin', dose: 40, unit: 'mg' }],
      selectedModules: ['lipid'],
      conditions: {},
      customInputs: { altUlnTimes: 3.5 }
    };
    expect(reviewCurrentMedications(altElevPatient, { egfr: 65 }, dummySettings).find((r) => r.drugId === 'atorvastatin')?.action).toBe('HOLD');
  });

  it('CKD-R3-R1-08, CKD-R3-R3-09, CKD-R3-R2-07 & LIPID-R2-*: enforces inpatient emergency wording/dedup, dialysis SGLT2i STOP wording, SWITCH exclusion, and Statin DDI/duplicate caps', () => {
    // 1. Inpatient K+ = 6.6 with hyperkalemia bundle -> deduplicates card & never says "chuyển ngay tới cơ sở cấp cứu"
    const inpatientSettings = { ...dummySettings, setting: 'inpatient' as const };
    const hyperkPatient: Patient = {
      age: 63,
      sbp: 74,
      k: 6.6,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { ckd: true }
    };
    const hyperkBundle: Recommendation = {
      id: 'rec_ckd_hyperkalemia_severe_bundle',
      module: 'ckd',
      tier: 'Cấp cứu tăng kali máu',
      action: 'START',
      drugId: 'calcium_gluconate',
      title: 'Phác đồ cấp cứu tăng Kali máu nặng nội viện',
      rationale: 'Tiêm Calcium gluconate.',
      gates: [],
      citationIds: ['ukka.2022.guideline_16_2_calcium_salts'],
      priority: 100
    };
    const inptFlags = checkEmergencyRedFlags(hyperkPatient, { egfr: 18 }, inpatientSettings, [hyperkBundle]);
    expect(inptFlags.some((r) => r.id === 'emergency_hyperkalemia_critical')).toBe(false);
    const inptShock = inptFlags.find((r) => r.id === 'emergency_shock_hypotension');
    expect(inptShock?.title).toContain('CẤP CỨU NỘI VIỆN KHẨN CẤP');
    expect(inptShock?.rationale).not.toContain('chuyển ngay tới cơ sở cấp cứu');

    // Outpatient K+ = 6.6 -> emits outpatient emergency transfer card
    const outptFlags = checkEmergencyRedFlags(hyperkPatient, { egfr: 18 }, dummySettings, [hyperkBundle]);
    const outptHyperk = outptFlags.find((r) => r.id === 'emergency_hyperkalemia_critical');
    expect(outptHyperk).toBeDefined();
    expect(outptHyperk?.rationale).toContain('chuyển ngay tới cơ sở cấp cứu');

    // 2. CKD-R3-R3-09: SGLT2i on dialysis STOP message
    const dialysisDapaReview = reviewCurrentMedications(
      {
        age: 61,
        currentMeds: [{ drugId: 'dapagliflozin', dose: 10, unit: 'mg' }],
        selectedModules: ['ckd'],
        conditions: { ckd: true, onDialysis: true }
      },
      { egfr: 12 },
      dummySettings
    );
    const dapaStop = dialysisDapaReview.find((r) => r.drugId === 'dapagliflozin');
    expect(dapaStop?.action).toBe('STOP');
    expect(dapaStop?.rationale).toBe('Ngừng thuốc SGLT2i khi bệnh nhân bước vào lọc máu định kỳ theo KDIGO 2024');

    // 3. CKD-R3-R2-07: SWITCH replacing linagliptin -> semaglutide emits 0 false dup.incretin or interaction alerts
    const switchRecs: Recommendation[] = [
      {
        id: 'switch_linagliptin_to_semaglutide',
        module: 'dm2',
        tier: 'Chuyển đổi phác đồ',
        action: 'SWITCH',
        drugId: 'semaglutide',
        title: 'CHUYỂN ĐỔI: Ngừng Linagliptin để chuyển sang Semaglutide',
        rationale: 'Không phối hợp đồng thời DPP-4i và GLP-1 RA.',
        gates: [],
        citationIds: ['ada.dm2.2026.glp1'],
        priority: 92
      }
    ];
    const linaCur = [{ drugId: 'linagliptin', name: 'Linagliptin 5 mg' }];
    const linaPatient: Patient = {
      age: 62,
      currentMeds: linaCur,
      selectedModules: ['dm2'],
      conditions: { dm: true }
    };
    expect(checkDuplicates(linaCur, switchRecs)).toHaveLength(0);
    expect(checkInteractions(linaPatient, { egfr: 45 }, switchRecs)).toHaveLength(0);

    // 4. LIPID-R2-R2-01 & LIPID-R2-R3-01 & LIPID-R2-R3-14:
    // Simvastatin 20 mg + Diltiazem -> REDUCE <= 10 mg/ngày
    const simvaDiltReview = reviewCurrentMedications(
      {
        age: 65,
        currentMeds: [
          { drugId: 'simvastatin', dose: 20, unit: 'mg' },
          { drugId: 'diltiazem', dose: 120, unit: 'mg' }
        ],
        selectedModules: ['lipid'],
        conditions: {}
      },
      { egfr: 65 },
      dummySettings
    );
    const simvaCap10 = simvaDiltReview.find((r) => r.drugId === 'simvastatin');
    expect(simvaCap10?.action).toBe('REDUCE');
    expect(simvaCap10?.dose).toContain('10 mg');

    // Pravastatin 80 mg + Bempedoic acid -> REDUCE <= 40 mg/ngày
    const pravaBempReview = reviewCurrentMedications(
      {
        age: 65,
        currentMeds: [
          { drugId: 'pravastatin', dose: 80, unit: 'mg' },
          { drugId: 'bempedoic_acid', dose: 180, unit: 'mg' }
        ],
        selectedModules: ['lipid'],
        conditions: {}
      },
      { egfr: 65 },
      dummySettings
    );
    expect(pravaBempReview.find((r) => r.drugId === 'pravastatin')?.action).toBe('REDUCE');

    // Duplicate Statins (Atorvastatin 40 mg + Simvastatin 20 mg) -> STOP Simvastatin
    const dupStatinReview = reviewCurrentMedications(
      {
        age: 65,
        currentMeds: [
          { drugId: 'atorvastatin', dose: 40, unit: 'mg' },
          { drugId: 'simvastatin', dose: 20, unit: 'mg' }
        ],
        selectedModules: ['lipid'],
        conditions: {}
      },
      { egfr: 65 },
      dummySettings
    );
    expect(dupStatinReview.find((r) => r.drugId === 'simvastatin')?.action).toBe('STOP');
    expect(dupStatinReview.some((r) => r.drugId === 'atorvastatin' && r.action === 'STOP')).toBe(false);
  });
});
