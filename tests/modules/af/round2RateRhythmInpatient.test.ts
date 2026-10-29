/**
 * Kiểm thử Hồi quy Round 2 – Kiểm soát Tần số [R], Kiểm soát Nhịp (AAD & Triệt đốt), WPW, Amyloidosis, Nội viện RVR & Chu phẫu
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/registry', async () => {
  const { afModule } = await import('../../../src/modules/af');
  return {
    getActiveModules: (ids: string[]) => (ids.includes('af') ? [afModule] : []),
    getAllModules: () => [afModule],
    getModule: (id: string) => (id === 'af' ? afModule : undefined),
    setDemoEnabled: () => {},
    isDemoEnabled: () => false
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Profile, Setting, Settings } from '../../../src/engine/types';

function makeSettings(setting: Setting = 'outpatient', profile: Profile = 'INTL'): Settings {
  return {
    setting,
    profile,
    units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
    score2Region: 'high',
    fontScale: 'normal',
    theme: 'light',
    onlyReviewed: false
  };
}

function basePt(overrides: Partial<Patient> = {}): Patient {
  return {
    age: 64,
    sex: 'male',
    weight: 70,
    height: 170,
    sbp: 128,
    dbp: 78,
    hr: 96,
    rhythm: 'afib',
    lvef: 58,
    scr: 84,
    selectedModules: ['af'],
    conditions: { af: true, htn: true },
    currentMeds: [],
    ...overrides
  };
}

describe('AF Round 2 Regression: WPW, Amyloidosis, Rate, Rhythm, Inpatient IV RVR & Periprocedural', () => {
  it('1. Hội chứng WPW / Rung nhĩ tiền kích thích: STOP toàn bộ thuốc ức chế nút AV (dose: undefined) và chỉ định Sốc điện / Ibutilide-Procainamide / Triệt đốt', () => {
    const wpwStable = basePt({
      hr: 148,
      conditions: { af: true, wpw: true },
      currentMeds: [
        { drugId: 'diltiazem', name: 'Herbesser', dose: 120, unit: 'mg' },
        { drugId: 'digoxin', name: 'Lanoxin', dose: 0.125, unit: 'mg' },
        { drugId: 'amiodarone', name: 'Cordarone', dose: 200, unit: 'mg' }
      ]
    });
    const plan = evaluate(wpwStable, makeSettings('inpatient'));
    for (const avn of ['diltiazem', 'digoxin', 'amiodarone']) {
      const stopRec = plan.recommendations.find((r) => r.drugId === avn && r.action === 'STOP');
      expect(stopRec, `WPW phải STOP ${avn}`).toBeDefined();
      expect(stopRec?.dose).toBeUndefined();
    }
    const mgmt = plan.recommendations.find((r) => r.id === 'rec_af_wpw_management');
    expect(mgmt?.action).toBe('REFER');
    expect(mgmt?.rationale).toContain('Ibutilide');
    expect(plan.recommendations.some((r) => ['bisoprolol', 'diltiazem', 'verapamil', 'digoxin'].includes(r.drugId ?? '') && r.action === 'START')).toBe(false);

    const wpwUnstable = basePt({
      sbp: 76,
      hr: 185,
      conditions: { af: true, wpw: true },
      customInputs: { hemodynamicStability: 'unstable' }
    });
    expect(evaluate(wpwUnstable, makeSettings('inpatient')).recommendations.find((r) => r.id === 'rec_af_wpw_management')?.action).toBe('START');
  });

  it('2. Bệnh cơ tim thoái hóa dạng bột (Cardiac Amyloidosis): STOP Digoxin & Non-DHP CCB, bắt buộc TEE trước chuyển nhịp, dùng Amiodarone TM khi RVR', () => {
    const amyloidPt = basePt({
      hr: 138,
      lvef: 52,
      conditions: { af: true, cardiacAmyloidosis: true },
      customInputs: { afOnset: 'more_than_48h_or_unknown', alreadyAnticoagulated3WeeksOrTee: true },
      currentMeds: [
        { drugId: 'digoxin', name: 'Lanoxin', dose: 0.125, unit: 'mg' },
        { drugId: 'verapamil', name: 'Isoptin', dose: 120, unit: 'mg' }
      ]
    });
    const plan = evaluate(amyloidPt, makeSettings('inpatient'));
    expect(plan.recommendations.find((r) => r.drugId === 'digoxin' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(plan.recommendations.find((r) => r.drugId === 'verapamil' && r.action === 'STOP')?.dose).toBeUndefined();
    // Bắt buộc làm TEE ngay cả khi đã chống đông >= 3 tuần
    const holdCv = plan.recommendations.find((r) => r.id === 'rec_af_cv_amyloid_mandatory_tee');
    expect(holdCv?.action).toBe('HOLD');
    expect(holdCv?.dose).toBeUndefined();
    // Nội viện RVR với LVEF 52% chọn Esmolol TM cực ngắn (cấm Digoxin/CCB); với LVEF 32% chọn Amiodarone TM
    const rvrEsmolol = plan.recommendations.find((r) => r.id === 'rec_af_acute_rate_preserved');
    expect(rvrEsmolol?.drugId).toBe('esmolol');
    const amyloidHfref = evaluate(
      basePt({ hr: 138, lvef: 32, conditions: { af: true, cardiacAmyloidosis: true } }),
      makeSettings('inpatient')
    );
    const rvrAmio = amyloidHfref.recommendations.find((r) => r.id === 'rec_af_acute_rate_hfref');
    expect(rvrAmio?.drugId).toBe('amiodarone');
    expect(rvrAmio?.dose).toContain('300 mg');
  });

  it('3. Kiểm soát tần số: Đích lỏng (< 110) vs chặt (< 80), bảo toàn liều CONTINUE thực tế, suy tim cấp mất bù DEFER BB uống, hạ K+ HOLD Digoxin & Hen STOP Propranolol', () => {
    // Chưa dùng thuốc, HR 92 bpm, không triệu chứng nặng (EHRA 1) -> MONITOR thay vì START Bisoprolol
    const lenientOk = basePt({ hr: 92, customInputs: { ehraScore: '1' } });
    expect(evaluate(lenientOk, makeSettings()).recommendations.some((r) => r.id === 'rec_af_rate_preserved_controlled' && r.action === 'MONITOR')).toBe(true);

    // Chưa dùng thuốc, HR 92 bpm nhưng triệu chứng nặng EHRA 3 (đích chặt < 80 bpm) -> START Bisoprolol
    const strictNeed = basePt({ hr: 92, customInputs: { ehraScore: '3' } });
    expect(evaluate(strictNeed, makeSettings()).recommendations.some((r) => r.drugId === 'bisoprolol' && r.action === 'START')).toBe(true);

    // Đang dùng Bisoprolol 5 mg đạt đích -> CONTINUE phải giữ nguyên '5 mg' (không bị hạ nhầm về liều khởi đầu 1.25 mg!)
    const onBiso5 = basePt({
      hr: 74,
      currentMeds: [{ drugId: 'bisoprolol', name: 'Concor', dose: 5, unit: 'mg' }]
    });
    const contBiso = evaluate(onBiso5, makeSettings()).recommendations.find((r) => r.drugId === 'bisoprolol' && r.action === 'CONTINUE');
    expect(contBiso?.dose).toContain('5 mg');
    expect(contBiso?.dose).not.toContain('1.25 mg');

    // Suy tim mất bù cấp (HFrEF LVEF 28% + acuteDecompensatedHf) -> DEFER chẹn beta đường uống (dose: undefined)
    const adhfPt = basePt({
      lvef: 28,
      hr: 104,
      conditions: { af: true, hf: true, acuteDecompensatedHf: true }
    });
    const deferBb = evaluate(adhfPt, makeSettings()).recommendations.find((r) => r.id === 'rec_af_rate_reduced_ef_defer_bb_acute');
    expect(deferBb?.action).toBe('DEFER');
    expect(deferBb?.dose).toBeUndefined();

    // Hạ kali máu K+ = 3.1 mmol/L đang dùng Digoxin -> HOLD Digoxin (dose: undefined)
    const lowKDig = basePt({
      k: 3.1,
      currentMeds: [{ drugId: 'digoxin', name: 'Lanoxin', dose: 0.125, unit: 'mg' }]
    });
    expect(evaluate(lowKDig, makeSettings()).recommendations.find((r) => r.drugId === 'digoxin' && r.action === 'HOLD')?.dose).toBeUndefined();

    // Hen phế quản đang dùng Propranolol -> STOP Propranolol (dose: undefined) & START Diltiazem
    const asthmaProp = basePt({
      conditions: { af: true, asthma: true },
      currentMeds: [{ drugId: 'propranolol', name: 'Inderal', dose: 40, unit: 'mg' }]
    });
    const astPlan = evaluate(asthmaProp, makeSettings());
    expect(astPlan.recommendations.find((r) => r.drugId === 'propranolol' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(astPlan.recommendations.some((r) => r.drugId === 'diltiazem' && r.action === 'START')).toBe(true);
  });

  it('4. Kiểm soát nhịp: Tách CAD thật sự khỏi Đột quỵ/PAD, tách HCM khỏi CAD (không dùng Dronedarone cho HCM), QTc > 500 ms, Sotalol QD vs BID & Thai kỳ thiếu SCr', () => {
    // Tiền sử đột quỵ đơn thuần hoặc PAD đơn thuần KHÔNG bị cấm oan Flecainide
    const strokeOnly = basePt({
      conditions: { af: true, strokeOrTia: true },
      customInputs: { ehraScore: '3' },
      currentMeds: [
        { drugId: 'flecainide', name: 'Tambocor', dose: 100, unit: 'mg' },
        { drugId: 'bisoprolol', name: 'Concor', dose: 2.5, unit: 'mg' }
      ]
    });
    expect(evaluate(strokeOnly, makeSettings()).recommendations.some((r) => r.drugId === 'flecainide' && r.action === 'STOP')).toBe(false);

    const padOnly = basePt({
      conditions: { af: true, pad: true, vascularDisease: true },
      customInputs: { ehraScore: '3' },
      currentMeds: [
        { drugId: 'flecainide', name: 'Tambocor', dose: 100, unit: 'mg' },
        { drugId: 'bisoprolol', name: 'Concor', dose: 2.5, unit: 'mg' }
      ]
    });
    expect(evaluate(padOnly, makeSettings()).recommendations.some((r) => r.drugId === 'flecainide' && r.action === 'STOP')).toBe(false);

    // Bệnh cơ tim phì đại (HCM) -> CẤM Flecainide và ưu tiên Amiodarone (KHÔNG gợi ý Dronedarone)
    const hcmSymp = basePt({
      conditions: { af: true, hypertrophicCardiomyopathy: true },
      customInputs: { ehraScore: '3' }
    });
    const hcmPlan = evaluate(hcmSymp, makeSettings());
    expect(hcmPlan.recommendations.find((r) => r.id === 'rec_af_aad_hcm')?.drugId).toBe('amiodarone');
    expect(hcmPlan.recommendations.some((r) => r.drugId === 'dronedarone')).toBe(false);

    // QTc > 500 ms -> STOP các thuốc nhóm III (Sotalol, Amiodarone, Dronedarone) với dose: undefined
    const longQtc = basePt({
      qtc: 525,
      currentMeds: [{ drugId: 'sotalol', name: 'Sotalex', dose: 80, unit: 'mg', freq: 'bid' }]
    });
    expect(evaluate(longQtc, makeSettings()).recommendations.find((r) => r.drugId === 'sotalol' && r.action === 'STOP')?.dose).toBeUndefined();

    // Sotalol ở CrCl ~48 mL/phút: đang uống BID -> REDUCE; đã uống QD -> CONTINUE
    const sotBid = basePt({
      age: 74,
      weight: 60,
      scr: 112,
      customInputs: { ehraScore: '2' },
      currentMeds: [{ drugId: 'sotalol', name: 'Sotalex', dose: 80, unit: 'mg', freq: 'bid' }]
    });
    expect(evaluate(sotBid, makeSettings()).recommendations.find((r) => r.id === 'rec_af_sotalol_renal_adjust')?.action).toBe('REDUCE');

    const sotQd = basePt({
      age: 74,
      weight: 60,
      scr: 112,
      customInputs: { ehraScore: '2' },
      currentMeds: [{ drugId: 'sotalol', name: 'Sotalex', dose: 80, unit: 'mg', freq: 'qd' }]
    });
    expect(evaluate(sotQd, makeSettings()).recommendations.find((r) => r.id === 'rec_af_sotalol_renal_adjust')?.action).toBe('CONTINUE');

    // Thai phụ có triệu chứng nhịp nhưng thiếu SCr -> Fail-closed yêu cầu xét nghiệm SCr trước khi cân nhắc Flecainide
    const pregNoScr = basePt({
      age: 29,
      sex: 'female',
      scr: undefined,
      conditions: { af: true, pregnant: true },
      customInputs: { ehraScore: '3' }
    });
    const pregPlan = evaluate(pregNoScr, makeSettings());
    expect(pregPlan.recommendations.some((r) => r.id === 'missing_input_scr')).toBe(true);
    expect(pregPlan.recommendations.some((r) => r.drugId === 'flecainide' && r.action === 'CONSIDER')).toBe(false);
  });

  it('5. Triệt đốt qua ống thông (Paroxysmal không triệu chứng vs có triệu chứng, Persistent), EAST-AFNET 4 & Cường giáp', () => {
    const paroxAsymp = basePt({ customInputs: { afType: 'paroxysmal', ehraScore: '1' } });
    expect(evaluate(paroxAsymp, makeSettings()).recommendations.some((r) => r.id === 'rec_af_ablation_paroxysmal')).toBe(false);

    const persistAadRefractory = basePt({
      customInputs: { afType: 'persistent', ehraScore: '3' },
      currentMeds: [{ drugId: 'amiodarone', name: 'Cordarone', dose: 200, unit: 'mg' }]
    });
    const pPlan = evaluate(persistAadRefractory, makeSettings());
    expect(pPlan.recommendations.find((r) => r.id === 'rec_af_ablation_persistent')?.title).toContain('Class I-A');

    const eastPt = basePt({ customInputs: { afType: 'first_diagnosed', ehraScore: '2' } });
    expect(evaluate(eastPt, makeSettings()).recommendations.some((r) => r.id === 'rec_af_early_rhythm_east')).toBe(true);

    const hyperPt = basePt({
      conditions: { af: true, hyperthyroidism: true },
      currentMeds: [{ drugId: 'amiodarone', name: 'Cordarone', dose: 200, unit: 'mg' }]
    });
    const hyPlan = evaluate(hyperPt, makeSettings());
    expect(hyPlan.recommendations.find((r) => r.drugId === 'amiodarone' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(hyPlan.recommendations.some((r) => r.id === 'rec_af_hyperthyroidism_control')).toBe(true);
  });

  it('6. Nội viện RVR liều TĨNH MẠCH chuẩn ESC Table 12, Chuyển nhịp < 24h vs đã đủ 3 tuần OAC & Chu phẫu Acenocoumarol 3 ngày / Xa CrCl < 30 3 ngày', () => {
    // Liều tĩnh mạch chuẩn Diltiazem 0.25 mg/kg + 5–15 mg/giờ (KHÔNG dùng liều viên uống ER!)
    const rvrPreserved = basePt({ hr: 142, lvef: 56 });
    const rvrPlan = evaluate(rvrPreserved, makeSettings('inpatient'));
    const diltIv = rvrPlan.recommendations.find((r) => r.id === 'rec_af_acute_rate_preserved');
    expect(diltIv?.dose).toContain('0.25 mg/kg');
    expect(diltIv?.dose).toContain('5–15 mg/giờ');

    // Liều tĩnh mạch chuẩn Amiodarone 300 mg + 900–1200 mg ở HFrEF RVR
    const rvrHfref = basePt({ hr: 146, lvef: 28, conditions: { af: true, hf: true } });
    const amioIv = evaluate(rvrHfref, makeSettings('inpatient')).recommendations.find((r) => r.id === 'rec_af_acute_rate_hfref');
    expect(amioIv?.dose).toContain('300 mg');
    expect(amioIv?.dose).toContain('900–1200 mg');

    // Chuyển nhịp > 48h nhưng đã chống đông đủ >= 3 tuần -> CONSIDER chuyển nhịp chủ động (thay vì HOLD cố định)
    const cvReady = basePt({
      customInputs: { afOnset: 'more_than_48h_or_unknown', alreadyAnticoagulated3WeeksOrTee: true },
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' }]
    });
    expect(evaluate(cvReady, makeSettings('inpatient')).recommendations.find((r) => r.id === 'rec_af_cv_ready_anticoagulated')?.action).toBe('CONSIDER');

    // Chuyển nhịp < 24h ở bệnh nhân CHA2DS2-VA = 0 -> chống đông 4 tuần sau chuyển nhịp là tùy chọn (optional)
    const cvLowRisk = basePt({
      age: 42,
      sex: 'male',
      conditions: { af: true },
      customInputs: { afOnset: 'less_than_24h' }
    });
    expect(evaluate(cvLowRisk, makeSettings('inpatient')).recommendations.find((r) => r.id === 'rec_af_cv_timing_lt24h')?.rationale).toContain('tùy chọn');

    // Chu phẫu: Acenocoumarol ngưng 3 ngày (khác Warfarin 5 ngày); Apixaban ở CrCl ~24 mL/phút + phẫu thuật nguy cơ cao ngưng 3 ngày (72h)
    const periopSintrom = basePt({
      conditions: { af: true, mechanicalValve: true },
      customInputs: { plannedProcedureRisk: 'high' },
      currentMeds: [{ drugId: 'acenocoumarol', name: 'Sintrom', dose: 2, unit: 'mg' }]
    });
    const sinHold = evaluate(periopSintrom, makeSettings('inpatient')).recommendations.find((r) => r.id === 'rec_af_periop_vka_hold');
    expect(sinHold?.action).toBe('HOLD');
    expect(sinHold?.dose).toBeUndefined();
    expect(sinHold?.title).toContain('3 ngày');

    const periopApixRenal = basePt({
      age: 78,
      weight: 56,
      scr: 185,
      customInputs: { plannedProcedureRisk: 'high' },
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 2.5, unit: 'mg' }]
    });
    const xaHold = evaluate(periopApixRenal, makeSettings('inpatient')).recommendations.find((r) => r.id === 'rec_af_periop_doac_hold_apixaban');
    expect(xaHold?.action).toBe('HOLD');
    expect(xaHold?.dose).toBeUndefined();
    expect(xaHold?.title).toContain('3 ngày');
  });
});
