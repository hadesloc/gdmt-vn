import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/evaluate';
import { generateClinicalNote } from '../../src/engine/note';
import type { Patient, Settings } from '../../src/engine/types';

describe('Engine - Evaluate Pipeline with Demo Module', () => {
  const defaultSettings: Settings = {
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

  it('generates recommendations and alerts for patient with CKD and DM', () => {
    const patient: Patient = {
      age: 65,
      sex: 'male',
      weight: 70,
      height: 165,
      sbp: 130,
      dbp: 80,
      hr: 75,
      scr: 140, // eGFR ~ 45
      glucose: 9.0,
      k: 4.5,
      selectedModules: ['ckd', 'dm2', '_demo'],
      conditions: {
        ckd: true,
        dm: true
      },
      currentMeds: []
    };

    const plan = evaluate(patient, defaultSettings);

    expect(plan.recommendations.length).toBeGreaterThan(0);
    expect(plan.summary.total).toBe(plan.recommendations.length);

    // Should recommend SGLT2i
    const dapa = plan.recommendations.find((r) => r.drugId === 'dapagliflozin');
    expect(dapa).toBeDefined();
    expect(dapa?.action).toBe('START');

    // Should recommend Metformin
    const met = plan.recommendations.find((r) => r.drugId === 'metformin');
    expect(met).toBeDefined();

    // Clinical note text should be generated
    expect(plan.noteText).toContain('TÓM TẮT KẾ HOẠCH ĐIỀU TRỊ GDMT-VN');
    expect(plan.noteText).toContain('Creatinin: 140 µmol/L');
  });

  it('triggers safety alerts on duplicate RASi / ARNI', () => {
    const patient: Patient = {
      age: 70,
      sex: 'female',
      weight: 60,
      height: 155,
      sbp: 120,
      dbp: 75,
      hr: 70,
      scr: 90,
      k: 4.8,
      selectedModules: ['hf', '_demo'],
      conditions: {
        hf: true
      },
      currentMeds: [
        { drugId: 'perindopril', name: 'Perindopril 5mg' }
      ]
    };

    const plan = evaluate(patient, defaultSettings);

    // Rec recommends sacubitril_valsartan while current med is perindopril -> duplicate RASi/ARNI alert!
    const dupAlert = plan.alerts.find((a) => a.type === 'duplicate' && a.id.includes('rasi_arni'));
    expect(dupAlert).toBeDefined();
    expect(dupAlert?.severity).toBe('critical');
  });

  it('blocks drug and sets AVOID when severe contraindication occurs (e.g. pregnancy)', () => {
    const patient: Patient = {
      age: 32,
      sex: 'female',
      weight: 58,
      height: 160,
      sbp: 110,
      dbp: 70,
      hr: 80,
      lvef: 35,
      selectedModules: ['hf', '_demo'],
      conditions: {
        hf: true,
        pregnant: true
      },
      currentMeds: []
    };

    const plan = evaluate(patient, defaultSettings);

    const arni = plan.recommendations.find((r) => r.drugId === 'sacubitril_valsartan');
    expect(arni).toBeDefined();
    expect(arni?.action).toBe('AVOID');
    expect(arni?.gates.some((g) => g.parameter === 'pregnancy' && !g.passed)).toBe(true);
  });

  it('R3-HF-20: prints LVEF and NYHA in clinical note and NEVER prints (xoang) when patient.rhythm is undefined', () => {
    const patientNoRhythm: Patient = {
      age: 68,
      sex: 'male',
      sbp: 118,
      dbp: 72,
      hr: 82,
      lvef: 32,
      nyha: 2,
      selectedModules: ['hf'],
      conditions: { hf: true, af: true },
      currentMeds: []
    };

    const planNoRhythm = evaluate(patientNoRhythm, defaultSettings);
    expect(planNoRhythm.noteText).toContain('LVEF: 32%');
    expect(planNoRhythm.noteText).toContain('NYHA: 2');
    expect(planNoRhythm.noteText).toContain('Nhịp tim: 82 bpm');
    expect(planNoRhythm.noteText).not.toContain('xoang');

    const patientSinus: Patient = {
      ...patientNoRhythm,
      rhythm: 'sinus'
    };
    const planSinus = evaluate(patientSinus, defaultSettings);
    expect(planSinus.noteText).toContain('nhịp xoang');
  });

  it('CKD-R2-R1-01: evaluates inpatient AKI accurately when units.cr = mg_dL and baselineScr is in customInputs', () => {
    const mgDlInpatientSettings: Settings = {
      ...defaultSettings,
      setting: 'inpatient',
      units: {
        ...defaultSettings.units,
        cr: 'mg_dL'
      }
    };

    // scr = 1.5 mg/dL (132.6 umol/L), baselineScr = 1.0 mg/dL (88.4 umol/L) -> delta = +44.2 umol/L >= 26.5 -> TRUE AKI!
    // Conversely, if baselineScr were NOT converted, 132.6 / 1.0 = 132x (or if scr = 1.15 mg/dL = 101.7 vs baseline 1.1 mg/dL = 97.2 -> NO AKI!)
    const nonAkiPatient: Patient = {
      age: 66,
      sex: 'male',
      sbp: 128,
      dbp: 78,
      hr: 76,
      scr: 1.15, // 101.7 umol/L
      k: 4.4,
      selectedModules: ['ckd'],
      conditions: { ckd: true },
      currentMeds: [{ drugId: 'perindopril', dose: 5, unit: 'mg' }],
      customInputs: {
        baselineScr: 1.1 // 97.2 umol/L -> ratio 1.05 (< 1.5), delta +4.5 (< 26.5) -> NOT AKI!
      }
    };

    const nonAkiPlan = evaluate(nonAkiPatient, mgDlInpatientSettings);
    // Must NOT falsely hold Perindopril for AKI when Scr 1.15 vs baseline 1.10 mg/dL!
    const falseHold = nonAkiPlan.recommendations.find(
      (r) => r.drugId === 'perindopril' && (r.action === 'HOLD' || r.action === 'STOP')
    );
    expect(falseHold).toBeUndefined();

    // True AKI: Scr 1.8 mg/dL (159.1) vs baseline 1.0 mg/dL (88.4) -> ratio 1.8 >= 1.5 -> MUST hold RASi!
    const trueAkiPatient: Patient = {
      ...nonAkiPatient,
      scr: 1.8,
      customInputs: {
        baselineScr: 1.0
      }
    };
    const trueAkiPlan = evaluate(trueAkiPatient, mgDlInpatientSettings);
    const akiHold = trueAkiPlan.recommendations.find(
      (r) => r.drugId === 'perindopril' && (r.action === 'HOLD' || r.action === 'STOP')
    );
    expect(akiHold).toBeDefined();
  });

  it('LIPID-R2-R3-10: renders recommendation warnings and extended lipid/hepatic/muscle labs (TC, TG, HDL-C, Non-HDL-C, ApoB, Lp(a), ALT, CK) in clinical note', () => {
    const note = generateClinicalNote(
      {
        age: 62,
        sex: 'male',
        sbp: 128,
        dbp: 78,
        ldl: 3.4,
        tc: 5.6,
        tg: 2.3,
        hdl: 1.0,
        currentMeds: [],
        selectedModules: ['lipid'],
        conditions: { ascvd: true },
        customInputs: {
          nonHdl: 4.6,
          apoB: 118,
          lpa: 65,
          lpaUnit: 'mg/dL',
          alt: 34,
          ck: 145
        }
      },
      { egfr: 72 },
      {
        recommendations: [
          {
            id: 'rec_test_warn',
            module: 'lipid',
            tier: 'Hạ lipid tích cực',
            action: 'START',
            drugId: 'rosuvastatin',
            drugNameVi: 'Rosuvastatin',
            dose: '20 mg/ngày',
            title: 'Khởi trị Rosuvastatin 20 mg/ngày',
            rationale: 'ASCVD nguy cơ rất cao.',
            warnings: [
              'Bệnh nhân châu Á: Theo dõi sát triệu chứng đau cơ do phơi nhiễm huyết tương cao gấp ~2 lần.',
              'Kiểm tra lại lipid máu sau 4–8 tuần.'
            ],
            gates: [],
            citationIds: ['fda.rosuvastatin.asian_pk'],
            priority: 95
          }
        ],
        alerts: [],
        summary: {
          total: 1,
          byAction: {
            START: 1,
            UPTITRATE: 0,
            CONTINUE: 0,
            REDUCE: 0,
            SWITCH: 0,
            HOLD: 0,
            STOP: 0,
            AVOID: 0,
            CONSIDER: 0,
            DEFER: 0,
            MONITOR: 0,
            REFER: 0
          },
          activeModules: ['lipid']
        },
        noteText: ''
      },
      defaultSettings
    );

    expect(note).toContain('LDL-C: 3.4 mmol/L');
    expect(note).toContain('TC: 5.6 mmol/L');
    expect(note).toContain('TG: 2.3 mmol/L');
    expect(note).toContain('HDL-C: 1 mmol/L');
    expect(note).toContain('Non-HDL-C: 4.6 mmol/L');
    expect(note).toContain('ApoB: 118 mg/dL');
    expect(note).toContain('Lp(a): 65 mg/dL');
    expect(note).toContain('ALT: 34 U/L');
    expect(note).toContain('CK: 145 U/L');
    expect(note).toContain('Lưu ý: Bệnh nhân châu Á: Theo dõi sát triệu chứng đau cơ');
    expect(note).toContain('Lưu ý: Kiểm tra lại lipid máu sau 4–8 tuần.');
  });
});
