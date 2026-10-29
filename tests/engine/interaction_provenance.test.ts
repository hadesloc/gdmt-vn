import { describe, it, expect } from 'vitest';
import { checkInteractions } from '../../src/engine/safety/interactions';
import { evaluate } from '../../src/engine/evaluate';
import type { Patient, Derived, Recommendation, Settings } from '../../src/engine/types';

const defaultSettings: Settings = {
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

function makeRec(overrides: Partial<Recommendation>): Recommendation {
  return {
    id: 'test_rec',
    module: 'hf',
    tier: 'Trụ cột FMT',
    action: 'START',
    title: 'Test',
    rationale: 'Test',
    gates: [],
    citationIds: ['esc.hf.2026.digoxin_rec'],
    priority: 80,
    ...overrides,
  };
}

describe('ENG-01: Drug Interaction Provenance (current_current vs current_proposed vs proposed_proposed)', () => {
  const baseDerived: Derived = { egfr: 65 };

  it('1. Spironolactone + Digoxin đều nằm trong currentMeds -> provenance = current_current ("Đang dùng + Đang dùng")', () => {
    const pt: Patient = {
      age: 66,
      currentMeds: [
        { drugId: 'spironolactone', dose: 25, unit: 'mg' },
        { drugId: 'digoxin', dose: 0.125, unit: 'mg' },
      ],
      selectedModules: ['hf'],
      conditions: { hf: true },
    };

    const alerts = checkInteractions(pt, baseDerived, []);
    const digAlert = alerts.find((a) => a.id === 'ix.hf.spironolactone_digoxin');
    expect(digAlert).toBeDefined();
    expect(digAlert?.provenance).toBe('current_current');
    expect(digAlert?.provenanceLabelVi).toBe('Đang dùng + Đang dùng');
    expect(digAlert?.baselineDrugs).toEqual(expect.arrayContaining(['spironolactone', 'digoxin']));
    expect(digAlert?.proposedDrugs).toEqual([]);
    expect(digAlert?.title).not.toContain('[Nếu phối hợp thuốc đề xuất]');
  });

  it('2. Spironolactone đang dùng (currentMeds) + Digoxin mới được đề xuất (CONSIDER) -> provenance = current_proposed ("Đang dùng + Đề xuất")', () => {
    const pt: Patient = {
      age: 66,
      currentMeds: [{ drugId: 'spironolactone', dose: 25, unit: 'mg' }],
      selectedModules: ['hf'],
      conditions: { hf: true },
    };
    const recs: Recommendation[] = [
      makeRec({
        id: 'rec_hf_digoxin',
        action: 'CONSIDER',
        drugId: 'digoxin',
        tier: 'Điều trị bổ sung bước 2',
      }),
    ];

    const alerts = checkInteractions(pt, baseDerived, recs);
    const digAlert = alerts.find((a) => a.id === 'ix.hf.spironolactone_digoxin');
    expect(digAlert).toBeDefined();
    expect(digAlert?.provenance).toBe('current_proposed');
    expect(digAlert?.provenanceLabelVi).toBe('Đang dùng + Đề xuất');
    expect(digAlert?.baselineDrugs).toContain('spironolactone');
    expect(digAlert?.proposedDrugs).toContain('digoxin');
    expect(digAlert?.messageVi).toContain('Thuốc đang dùng (spironolactone) + Thuốc đề xuất (digoxin)');
  });

  it('3. Spironolactone (START) + Digoxin (CONSIDER) khi bệnh nhân chỉ đang dùng Bisoprolol -> provenance = proposed_proposed ("Nếu phối hợp thuốc đề xuất")', () => {
    const pt: Patient = {
      age: 66,
      currentMeds: [{ drugId: 'bisoprolol', dose: 3.75, unit: 'mg' }],
      selectedModules: ['hf'],
      conditions: { hf: true },
    };
    const recs: Recommendation[] = [
      makeRec({
        id: 'rec_hf_mra',
        action: 'START',
        drugId: 'spironolactone',
        tier: 'Trụ cột FMT (Class I)',
      }),
      makeRec({
        id: 'rec_hf_digoxin',
        action: 'CONSIDER',
        drugId: 'digoxin',
        tier: 'Kiểm soát tần số thất trong rung nhĩ',
      }),
    ];

    const alerts = checkInteractions(pt, baseDerived, recs);
    const digAlert = alerts.find((a) => a.id === 'ix.hf.spironolactone_digoxin');
    expect(digAlert).toBeDefined();
    expect(digAlert?.provenance).toBe('proposed_proposed');
    expect(digAlert?.provenanceLabelVi).toBe('Nếu phối hợp thuốc đề xuất');
    expect(digAlert?.baselineDrugs).toEqual([]);
    expect(digAlert?.proposedDrugs).toEqual(expect.arrayContaining(['spironolactone', 'digoxin']));
    expect(digAlert?.title).toContain('[Nếu phối hợp thuốc đề xuất]');
    expect(digAlert?.messageVi).toContain('Lưu ý tương tác tiềm tàng nếu phối hợp các thuốc đề xuất');
  });

  it('4. Hai lựa chọn thay thế loại trừ lẫn nhau trong cùng nhóm/cùng tầng CONSIDER (ví dụ 2 thuốc hệ RAA hoặc 2 lựa chọn cùng tầng) KHÔNG phát cảnh báo giả proposed_proposed', () => {
    const pt: Patient = {
      age: 60,
      currentMeds: [{ drugId: 'bisoprolol', dose: 5, unit: 'mg' }],
      selectedModules: ['hf'],
      conditions: { hf: true },
    };
    const mutuallyExclusiveRasiRecs: Recommendation[] = [
      makeRec({
        id: 'opt_acei',
        action: 'CONSIDER',
        drugId: 'enalapril',
        tier: 'Trụ cột hệ RAA',
      }),
      makeRec({
        id: 'opt_arb',
        action: 'CONSIDER',
        drugId: 'valsartan',
        tier: 'Trụ cột hệ RAA',
      }),
    ];

    const alerts = checkInteractions(pt, baseDerived, mutuallyExclusiveRasiRecs);
    expect(alerts.some((a) => a.id === 'ix.acei_arb' || a.id === 'ix.dual_raas_blockade')).toBe(false);
  });

  it('5. SWITCH hoặc STOP thuốc nền ACEi (Enalapril) để chuyển sang Sacubitril/valsartan vẫn giữ nguyên cảnh báo washout 36 giờ với provenance = current_proposed', () => {
    const ptOnAcei: Patient = {
      age: 62,
      sex: 'male',
      sbp: 124,
      dbp: 76,
      hr: 72,
      rhythm: 'sinus',
      lvef: 30,
      nyha: 2,
      scr: 88,
      k: 4.3,
      currentMeds: [{ drugId: 'enalapril', dose: 10, unit: 'mg', freq: '2 lần/ngày' }],
      selectedModules: ['hf'],
      conditions: { hf: true },
    };

    const plan = evaluate(ptOnAcei, defaultSettings);
    const washoutAlert = plan.alerts.find((a) => a.id === 'ix.acei_arni_washout');
    expect(washoutAlert).toBeDefined();
    expect(washoutAlert?.provenance).toBe('current_proposed');
    expect(washoutAlert?.baselineDrugs).toContain('enalapril');
    expect(washoutAlert?.proposedDrugs).toContain('sacubitril_valsartan');
    expect(plan.noteText).toContain('[Đang dùng + Đề xuất]');

    // Kể cả khi truyền trực tiếp lệnh STOP enalapril + START sacubitril_valsartan vào checkInteractions
    const directAlerts = checkInteractions(ptOnAcei, baseDerived, [
      makeRec({ id: 'stop_ena', action: 'STOP', drugId: 'enalapril' }),
      makeRec({ id: 'start_arni', action: 'START', drugId: 'sacubitril_valsartan' }),
    ]);
    const directWashout = directAlerts.find((a) => a.id === 'ix.acei_arni_washout');
    expect(directWashout).toBeDefined();
    expect(directWashout?.provenance).toBe('current_proposed');
  });

  it('6. Thuốc nền FDC (Perindopril/Indapamide) tương tác với thuốc đề xuất mới (Spironolactone + Cotrimoxazole) phân loại đúng provenance từ FDC nền', () => {
    const ptFdc: Patient = {
      age: 65,
      currentMeds: [{ drugId: 'perindopril_indapamide', name: 'Coversyl Plus' }],
      selectedModules: ['htn'],
      conditions: { htn: true },
    };
    const recs: Recommendation[] = [
      makeRec({
        id: 'start_cotrim',
        action: 'START',
        drugId: 'cotrimoxazole',
      }),
    ];

    const alerts = checkInteractions(ptFdc, baseDerived, recs);
    const trimAlert = alerts.find((a) => a.id === 'ix.rasi_mra_trimethoprim');
    expect(trimAlert).toBeDefined();
    expect(trimAlert?.provenance).toBe('current_proposed');
    expect(trimAlert?.baselineDrugs).toContain('perindopril_indapamide');
    expect(trimAlert?.proposedDrugs).toContain('cotrimoxazole');
  });
});
