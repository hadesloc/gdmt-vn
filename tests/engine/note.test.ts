import { describe, it, expect } from 'vitest';
import { generateClinicalNote } from '../../src/engine/note';
import type { Settings } from '../../src/engine/types';

describe('Engine - Clinical Note Generator (note.ts)', () => {
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

  it('LIPID-R2-R3-10: renders recommendation warnings and extended lipid/hepatic/muscle labs (TC, TG, HDL-C, Non-HDL-C, ApoB, Lp(a), ALT, CK)', () => {
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
    expect(note).not.toContain('sau 2–4 tuần khởi trị/tăng liều RASi, ARNI hoặc MRA');
  });

  it('R3-R2-COPD-15: renders respiratory vitals/labs/ABG and adapts Section 5 follow-up for respiratory vs cardiorenal modules', () => {
    const respNote = generateClinicalNote(
      {
        age: 68,
        sex: 'male',
        sbp: 132,
        dbp: 80,
        hr: 96,
        currentMeds: [{ drugId: 'tiotropium_olodaterol', name: 'Spiolto Respimat', dose: '2 nhát/ngày' }],
        selectedModules: ['copd'],
        conditions: { copd: true },
        customInputs: {
          spo2: 91,
          respiratoryRate: 24,
          fev1FvcRatio: 0.58,
          fev1Pct: 44,
          pefPct: 62,
          mmrc: 2,
          cat: 18,
          eos: 340,
          abgPh: 7.36,
          paco2: 49,
          hco3: 28
        }
      },
      {
        goldGrade: 'GOLD 3',
        goldGroup: 'E'
      },
      {
        recommendations: [
          {
            id: 'rec_copd_triple',
            module: 'copd',
            tier: 'Điều trị duy trì nhóm E',
            action: 'SWITCH',
            drugId: 'budesonide_glycopyrronium_formoterol',
            drugNameVi: 'Budesonide/Glycopyrronium/Formoterol',
            dose: '2 nhát x 2 lần/ngày',
            title: 'Nâng bậc lên LABA+LAMA+ICS',
            rationale: 'Nhóm E kèm Eos >= 300 cells/uL.',
            gates: [],
            citationIds: ['gold.copd.2026.group_e_eos_300'],
            priority: 92
          }
        ],
        alerts: [],
        summary: {
          total: 1,
          byAction: {
            START: 0,
            UPTITRATE: 0,
            CONTINUE: 0,
            REDUCE: 0,
            SWITCH: 1,
            HOLD: 0,
            STOP: 0,
            AVOID: 0,
            CONSIDER: 0,
            DEFER: 0,
            MONITOR: 0,
            REFER: 0
          },
          activeModules: ['copd']
        },
        noteText: ''
      },
      defaultSettings
    );

    expect(respNote).toContain('SpO₂: 91%');
    expect(respNote).toContain('Nhịp thở: 24 lần/phút');
    expect(respNote).toContain('FEV₁/FVC: 0.58');
    expect(respNote).toContain('FEV₁: 44% dự đoán (GOLD 3, Group E)');
    expect(respNote).toContain('PEF: 62%');
    expect(respNote).toContain('mMRC: 2');
    expect(respNote).toContain('CAT: 18');
    expect(respNote).toContain('Eosinophils: 340 tế bào/µL');
    expect(respNote).toContain('pH: 7.36');
    expect(respNote).toContain('PaCO₂: 49 mmHg');
    expect(respNote).toContain('HCO₃⁻: 28 mmol/L');
    expect(respNote).toContain('Tái khám đánh giá mức độ kiểm soát triệu chứng hô hấp');
    expect(respNote).toContain('kiểm tra trực tiếp kỹ thuật sử dụng bình hít và mức độ tuân thủ điều trị');
    expect(respNote).not.toContain('sau 2–4 tuần khởi trị/tăng liều RASi, ARNI hoặc MRA');

    // Cardiorenal / RASi case MUST keep the 2-4w eGFR/K+ follow-up line
    const renalNote = generateClinicalNote(
      {
        age: 64,
        sex: 'female',
        scr: 140,
        k: 4.6,
        currentMeds: [{ drugId: 'perindopril', name: 'Perindopril', dose: '5 mg' }],
        selectedModules: ['ckd'],
        conditions: { ckd: true }
      },
      { egfr: 36, ckdStage: 'G3b' },
      {
        recommendations: [],
        alerts: [],
        summary: {
          total: 0,
          byAction: {
            START: 0,
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
          activeModules: ['ckd']
        },
        noteText: ''
      },
      defaultSettings
    );
    expect(renalNote).toContain(
      'Đánh giá lại chức năng thận (Creatinin, eGFR) và Kali máu sau 2–4 tuần khi khởi trị hoặc chuẩn độ tăng liều thuốc nhóm RASi/ARNI/MRA.'
    );
  });
});
