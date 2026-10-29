import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { normalizePatientUnits } from '../../../src/engine/units';
import { derivePatientData } from '../../../src/engine/derive';
import { evaluateFmtOptimizationStatus, hasBackgroundFmt } from '../../../src/modules/hf/helpers';
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

function makeCtx(patient: Patient, settings: Settings = makeSettings()): RuleContext {
  const normalized = normalizePatientUnits(patient, settings.units);
  const derived = derivePatientData(normalized);
  return { patient, normalized, derived, settings };
}

describe('HF-01: FMT Optimization & Second-Line Adjunct Gating (Digoxin, Vericiguat, H-ISDN)', () => {
  it('1. Bệnh nhân HFrEF chưa dùng thuốc nền nào -> status = none, KHÔNG đề xuất Digoxin / Vericiguat / H-ISDN', () => {
    const pt: Patient = {
      age: 62,
      sex: 'male',
      sbp: 124,
      dbp: 76,
      hr: 78,
      rhythm: 'sinus',
      lvef: 30,
      nyha: 3,
      scr: 90,
      k: 4.3,
      selectedModules: ['hf'],
      conditions: { hf: true },
      customInputs: {
        recentWorseningHf: true,
        selfIdentifiedBlack: true,
      },
      currentMeds: [],
    };
    const ctx = makeCtx(pt);
    const fmt = evaluateFmtOptimizationStatus(ctx);
    expect(fmt.status).toBe('none');
    expect(fmt.activePillarCount).toBe(0);
    expect(fmt.missingPillars).toEqual(['rasi_arni', 'bb', 'mra', 'sglt2i']);
    expect(hasBackgroundFmt(ctx)).toBe(false);

    const plan = evaluate(pt, makeSettings({ profile: 'US' }));
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_digoxin')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_vericiguat')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_hisdn_black')).toBe(false);
  });

  it('2. Bệnh nhân HFrEF nhịp xoang chỉ đang dùng đơn độc 1 trụ cột liều thấp (Bisoprolol 3.75 mg/ngày) -> status = incomplete_pillars, KHÔNG tự động phát CONSIDER Digoxin hoặc Vericiguat', () => {
    const pt: Patient = {
      age: 64,
      sex: 'male',
      sbp: 122,
      dbp: 74,
      hr: 76,
      rhythm: 'sinus',
      lvef: 32,
      nyha: 3,
      scr: 88,
      k: 4.2,
      selectedModules: ['hf'],
      conditions: { hf: true },
      customInputs: {
        recentWorseningHf: true,
        selfIdentifiedBlack: true,
      },
      currentMeds: [{ drugId: 'bisoprolol', dose: 3.75, unit: 'mg', freq: '1 lần/ngày' }],
    };
    const ctx = makeCtx(pt);
    const fmt = evaluateFmtOptimizationStatus(ctx);
    expect(fmt.status).toBe('incomplete_pillars');
    expect(fmt.activePillarCount).toBe(1);
    expect(fmt.missingPillars).toEqual(['rasi_arni', 'mra', 'sglt2i']);
    expect(hasBackgroundFmt(ctx)).toBe(false);

    const plan = evaluate(pt, makeSettings());
    // Phải ưu tiên khởi trị các trụ cột còn thiếu (ARNI, MRA, SGLT2i) và tăng liều Bisoprolol
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_arni' && r.action === 'START')).toBe(true);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_mra' && r.action === 'START')).toBe(true);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_sglt2i' && r.action === 'START')).toBe(true);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_bb' && r.action === 'UPTITRATE')).toBe(true);
    // Tuyệt đối không nhảy cóc sang thuốc bước 2 (Digoxin, Vericiguat, H-ISDN)
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_digoxin')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_vericiguat')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_hisdn_black')).toBe(false);
  });

  it('3. Bệnh nhân có đủ 4 trụ cột nhưng còn ở liều thấp và huyết động/sinh hóa còn dư địa tăng liều -> status = suboptimal_dose, ưu tiên UPTITRATE trước khi đề xuất bước 2', () => {
    const pt: Patient = {
      age: 60,
      sex: 'male',
      sbp: 126,
      dbp: 78,
      hr: 76,
      rhythm: 'sinus',
      lvef: 28,
      nyha: 3,
      scr: 85,
      k: 4.3,
      selectedModules: ['hf'],
      conditions: { hf: true },
      customInputs: {
        recentWorseningHf: true,
      },
      currentMeds: [
        { drugId: 'sacubitril_valsartan', dose: '24/26 mg', freq: '2 lần/ngày' },
        { drugId: 'bisoprolol', dose: 2.5, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'spironolactone', dose: 12.5, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'dapagliflozin', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
      ],
    };
    const ctx = makeCtx(pt);
    const fmt = evaluateFmtOptimizationStatus(ctx);
    expect(fmt.status).toBe('suboptimal_dose');
    expect(fmt.missingPillars).toEqual([]);
    expect(fmt.suboptimalPillars).toEqual(['rasi_arni', 'bb', 'mra']);
    expect(hasBackgroundFmt(ctx)).toBe(false);

    const plan = evaluate(pt, makeSettings());
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_arni' && r.action === 'UPTITRATE')).toBe(true);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_bb' && r.action === 'UPTITRATE')).toBe(true);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_digoxin')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'rec_hf_vericiguat')).toBe(false);
  });

  it('4. Bệnh nhân đã đạt liều đích cả 4 trụ cột FMT hoặc xác nhận đã đạt liều dung nạp tối đa -> status = optimized_or_max_tolerated, cho phép đề xuất Digoxin / Vericiguat / H-ISDN', () => {
    const ptTarget: Patient = {
      age: 65,
      sex: 'male',
      sbp: 112,
      dbp: 70,
      hr: 68,
      rhythm: 'sinus',
      lvef: 28,
      nyha: 3,
      scr: 100,
      k: 4.5,
      selectedModules: ['hf'],
      conditions: { hf: true },
      customInputs: {
        recentWorseningHf: true,
        selfIdentifiedBlack: true,
      },
      currentMeds: [
        { drugId: 'sacubitril_valsartan', dose: '97/103 mg', freq: '2 lần/ngày' },
        { drugId: 'bisoprolol', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'spironolactone', dose: 50, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'dapagliflozin', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
      ],
    };
    const ctxTarget = makeCtx(ptTarget);
    expect(evaluateFmtOptimizationStatus(ctxTarget).status).toBe('optimized_or_max_tolerated');
    expect(hasBackgroundFmt(ctxTarget)).toBe(true);

    const planTarget = evaluate(ptTarget, makeSettings({ profile: 'US' }));
    expect(planTarget.recommendations.some((r) => r.id === 'rec_hf_digoxin' && r.action === 'CONSIDER')).toBe(true);
    expect(planTarget.recommendations.some((r) => r.id === 'rec_hf_vericiguat' && r.action === 'CONSIDER')).toBe(true);
    expect(planTarget.recommendations.some((r) => r.id === 'rec_hf_hisdn_black' && r.action === 'START')).toBe(true);

    // Trường hợp liều thấp hơn đích nhưng đã xác nhận dung nạp tối đa (rasiMaxTolerated + bbMaxTolerated)
    const ptMaxTol: Patient = {
      ...ptTarget,
      currentMeds: [
        { drugId: 'sacubitril_valsartan', dose: '49/51 mg', freq: '2 lần/ngày' },
        { drugId: 'bisoprolol', dose: 5, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'spironolactone', dose: 25, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'dapagliflozin', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
      ],
      customInputs: {
        ...ptTarget.customInputs,
        rasiMaxTolerated: true,
        bbMaxTolerated: true,
      },
    };
    const ctxMaxTol = makeCtx(ptMaxTol);
    expect(evaluateFmtOptimizationStatus(ctxMaxTol).status).toBe('optimized_or_max_tolerated');
    expect(hasBackgroundFmt(ctxMaxTol)).toBe(true);
  });

  it('5. Bệnh nhân có chống chỉ định / không dung nạp các trụ cột bị thiếu nhưng đã tối ưu các trụ cột còn lại -> vẫn đủ điều kiện xét thuốc bước 2', () => {
    const ptContra: Patient = {
      age: 68,
      sex: 'male',
      sbp: 114,
      dbp: 70,
      hr: 66,
      rhythm: 'sinus',
      lvef: 30,
      nyha: 3,
      scr: 210, // eGFR ~ 27 mL/min/1.73m2 (< 30: chống chỉ định khởi trị MRA & thận trọng/hạn chế ARNI)
      k: 4.7,
      selectedModules: ['hf'],
      conditions: { hf: true, priorAngioedema: true },
      customInputs: {
        recentWorseningHf: true,
        mraIntolerant: true,
      },
      currentMeds: [
        { drugId: 'bisoprolol', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
        { drugId: 'dapagliflozin', dose: 10, unit: 'mg', freq: '1 lần/ngày' },
      ],
    };
    const ctxContra = makeCtx(ptContra);
    const fmt = evaluateFmtOptimizationStatus(ctxContra);
    expect(fmt.missingPillars).toEqual([]);
    expect(fmt.status).toBe('optimized_or_max_tolerated');
    expect(hasBackgroundFmt(ctxContra)).toBe(true);
  });

  it('6. Ngoại lệ chỉ định độc lập: HFrEF kèm rung nhĩ đáp ứng thất nhanh (AF HR >= 70 bpm) hoặc đang dùng sẵn Digoxin vẫn kích hoạt rule Digoxin', () => {
    const ptAfRapid: Patient = {
      age: 67,
      sex: 'male',
      sbp: 118,
      dbp: 74,
      hr: 96,
      rhythm: 'afib',
      lvef: 32,
      nyha: 3,
      scr: 92,
      k: 4.3,
      selectedModules: ['hf'],
      conditions: { hf: true, af: true },
      currentMeds: [{ drugId: 'bisoprolol', dose: 3.75, unit: 'mg', freq: '1 lần/ngày' }],
    };
    const planAf = evaluate(ptAfRapid, makeSettings());
    expect(planAf.recommendations.some((r) => r.id === 'rec_hf_digoxin' && r.action === 'CONSIDER')).toBe(true);

    // Đang dùng Digoxin nhưng nhịp chậm HR = 46 bpm -> vẫn phát lệnh STOP Digoxin an toàn dù chưa đủ 4 trụ cột
    const ptOnDigBrady: Patient = {
      ...ptAfRapid,
      rhythm: 'sinus',
      hr: 46,
      currentMeds: [{ drugId: 'digoxin', dose: '0.125 mg', freq: '1 lần/ngày' }],
    };
    const planDigStop = evaluate(ptOnDigBrady, makeSettings());
    expect(
      planDigStop.recommendations.some(
        (r) => r.drugId === 'digoxin' && (r.action === 'HOLD' || r.action === 'STOP')
      )
    ).toBe(true);
  });
});
