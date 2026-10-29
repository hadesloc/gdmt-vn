import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { normalizePatientUnits } from '../../../src/engine/units';
import { derivePatientData } from '../../../src/engine/derive';
import {
  formatHfUptitrateDoseVi,
  getKbTitrationStepsPerAdminMg,
  getNextHfTitrationDoseVi,
} from '../../../src/modules/hf/helpers';
import type { Patient, Settings, RuleContext } from '../../../src/engine/types';

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
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
    ...overrides,
  };
}

function makeBasePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    age: 62,
    sex: 'male',
    weight: 70,
    sbp: 122,
    dbp: 76,
    hr: 74,
    rhythm: 'sinus',
    lvef: 30,
    nyha: 2,
    scr: 88,
    k: 4.2,
    selectedModules: ['hf'],
    conditions: { hf: true },
    currentMeds: [],
    ...overrides,
  };
}

function makeCtx(patient: Patient, settings: Settings = makeSettings()): RuleContext {
  const normalized = normalizePatientUnits(patient, settings.units);
  const derived = derivePatientData(normalized);
  return { patient, normalized, derived, settings };
}

describe('HF-02: Titration Step Ladder for HF Beta-Blockers', () => {
  it('1. Trích xuất đúng bậc chuẩn độ từ KB cho cả 4 chẹn beta suy tim (Bisoprolol, Carvedilol, Metoprolol succinate, Nebivolol)', () => {
    const ctx70 = makeCtx(makeBasePatient({ weight: 70 }));
    expect(getKbTitrationStepsPerAdminMg(ctx70, 'bisoprolol')).toEqual([1.25, 2.5, 3.75, 5, 7.5, 10]);
    expect(getKbTitrationStepsPerAdminMg(ctx70, 'carvedilol')).toEqual([3.125, 6.25, 12.5, 25]);
    expect(getKbTitrationStepsPerAdminMg(ctx70, 'metoprolol_succinate')).toEqual([12.5, 25, 50, 100, 200]);
    expect(getKbTitrationStepsPerAdminMg(ctx70, 'nebivolol')).toEqual([1.25, 2.5, 5, 10]);

    // Carvedilol ở người bệnh > 85 kg có thêm bậc đích 50 mg x 2 lần/ngày
    const ctx92 = makeCtx(makeBasePatient({ weight: 92 }));
    expect(getKbTitrationStepsPerAdminMg(ctx92, 'carvedilol')).toEqual([3.125, 6.25, 12.5, 25, 50]);
  });

  it('2. Bisoprolol 1.25 mg / 2.5 mg / 3.75 mg / 5 mg / 7.5 mg -> UPTITRATE hiển thị rõ liều hiện tại, bước kế tiếp và liều đích', () => {
    const ladderExpectations: Array<{ cur: number; next: string }> = [
      { cur: 1.25, next: '2.5 mg x 1 lần/ngày' },
      { cur: 2.5, next: '3.75 mg x 1 lần/ngày' },
      { cur: 3.75, next: '5 mg x 1 lần/ngày' },
      { cur: 5, next: '7.5 mg x 1 lần/ngày' },
      { cur: 7.5, next: '10 mg x 1 lần/ngày' },
    ];

    for (const item of ladderExpectations) {
      const pt = makeBasePatient({
        currentMeds: [{ drugId: 'bisoprolol', dose: item.cur, unit: 'mg', freq: '1 lần/ngày' }],
      });
      const plan = evaluate(pt, makeSettings());
      const bbRec = plan.recommendations.find((r) => r.id === 'rec_hf_bb');
      expect(bbRec).toBeDefined();
      expect(bbRec?.action).toBe('UPTITRATE');
      expect(bbRec?.dose).toContain(`Đang dùng: ${item.cur} mg`);
      expect(bbRec?.dose).toContain(`Bước kế tiếp: ${item.next}`);
      expect(bbRec?.dose).toContain('đích 10 mg x 1 lần/ngày');
      expect(bbRec?.title).toContain(`lên ${item.next}`);
    }
  });

  it('3. Bisoprolol đã đạt liều đích 10 mg hoặc cao hơn (15 mg) -> CONTINUE, không gợi ý bước kế tiếp', () => {
    for (const doseMg of [10, 15]) {
      const pt = makeBasePatient({
        currentMeds: [{ drugId: 'bisoprolol', dose: doseMg, unit: 'mg', freq: '1 lần/ngày' }],
      });
      const ctx = makeCtx(pt);
      expect(getNextHfTitrationDoseVi(ctx, pt.currentMeds[0], 'bisoprolol')).toBeUndefined();
      const plan = evaluate(pt, makeSettings());
      const bbRec = plan.recommendations.find((r) => r.id === 'rec_hf_bb');
      expect(bbRec?.action).toBe('CONTINUE');
    }
  });

  it('4. Hỗ trợ nhiều định dạng nhập liều (number, string mg, mcg, BID) và tính đúng bước kế tiếp của Carvedilol theo cân nặng', () => {
    // Bisoprolol nhập dạng chuỗi "3750 mcg x 1 lần/ngày" (= 3.75 mg/ngày) -> bước kế tiếp 5 mg x 1 lần/ngày
    const ptMcg = makeBasePatient({
      currentMeds: [{ drugId: 'bisoprolol', dose: '3750 mcg x 1 lần/ngày' }],
    });
    const planMcg = evaluate(ptMcg, makeSettings());
    const recMcg = planMcg.recommendations.find((r) => r.id === 'rec_hf_bb');
    expect(recMcg?.action).toBe('UPTITRATE');
    expect(recMcg?.dose).toContain('Bước kế tiếp: 5 mg x 1 lần/ngày');

    // Carvedilol 6.25 mg x 2 lần/ngày (= 12.5 mg/ngày) -> bước kế tiếp 12.5 mg x 2 lần/ngày
    const ptCarvLow = makeBasePatient({
      weight: 72,
      currentMeds: [{ drugId: 'carvedilol', dose: '6.25 mg', freq: '2 lần/ngày' }],
    });
    const recCarvLow = evaluate(ptCarvLow, makeSettings()).recommendations.find((r) => r.id === 'rec_hf_bb');
    expect(recCarvLow?.action).toBe('UPTITRATE');
    expect(recCarvLow?.dose).toContain('Bước kế tiếp: 12.5 mg x 2 lần/ngày');

    // Carvedilol 25 mg x 2 lần/ngày ở BN 72 kg (<= 85 kg) -> đã đạt đích -> CONTINUE
    const ptCarv72AtTarget = makeBasePatient({
      weight: 72,
      currentMeds: [{ drugId: 'carvedilol', dose: '25 mg', freq: '2 lần/ngày' }],
    });
    expect(
      evaluate(ptCarv72AtTarget, makeSettings()).recommendations.find((r) => r.id === 'rec_hf_bb')?.action
    ).toBe('CONTINUE');

    // Carvedilol 25 mg x 2 lần/ngày ở BN 90 kg (> 85 kg) -> chưa đạt đích 50 mg BID -> UPTITRATE lên 50 mg x 2 lần/ngày
    const ptCarv90 = makeBasePatient({
      weight: 90,
      currentMeds: [{ drugId: 'carvedilol', dose: '25 mg', freq: '2 lần/ngày' }],
    });
    const recCarv90 = evaluate(ptCarv90, makeSettings()).recommendations.find((r) => r.id === 'rec_hf_bb');
    expect(recCarv90?.action).toBe('UPTITRATE');
    expect(recCarv90?.dose).toContain('Bước kế tiếp: 50 mg x 2 lần/ngày');
    expect(recCarv90?.dose).toContain('50 mg x 2 lần/ngày (cân nặng > 85 kg)');
  });

  it('5. Khi không rõ liều hoặc chỉ ghi số viên ("1 viên") không có hàm lượng -> giữ nguyên "chưa rõ liều" và KHÔNG tự đoán bước kế tiếp', () => {
    const unknownCases = [
      { drugId: 'bisoprolol' },
      { drugId: 'bisoprolol', dose: '' },
      { drugId: 'bisoprolol', dose: '1 viên' },
      { drugId: 'bisoprolol', dose: 1, unit: 'viên' },
    ];

    for (const med of unknownCases) {
      const pt = makeBasePatient({ currentMeds: [med] });
      const ctx = makeCtx(pt);
      expect(getNextHfTitrationDoseVi(ctx, med, 'bisoprolol')).toBeUndefined();
      const formatted = formatHfUptitrateDoseVi(ctx, med, 'bisoprolol', '10 mg x 1 lần/ngày (uống)');
      expect(formatted).toContain('Đang dùng: chưa rõ liều');
      expect(formatted).not.toContain('Bước kế tiếp:');

      const plan = evaluate(pt, makeSettings());
      const bbRec = plan.recommendations.find((r) => r.id === 'rec_hf_bb');
      expect(bbRec?.action).toBe('UPTITRATE');
      expect(bbRec?.dose).toContain('Đang dùng: chưa rõ liều');
      expect(bbRec?.dose).not.toContain('Bước kế tiếp:');
    }
  });
});
