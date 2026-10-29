/**
 * Kiểm thử Hồi quy Round 2 – Nhánh Chống đông [A], Gan/Thận/Lọc máu, Hồ sơ US vs INTL/VN & Tương tác Thuốc (DDI)
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

function makeSettings(profile: Profile = 'INTL', setting: Setting = 'outpatient'): Settings {
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

function baseAfPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    age: 72,
    sex: 'male',
    weight: 70,
    height: 168,
    sbp: 132,
    dbp: 80,
    hr: 84,
    rhythm: 'afib',
    lvef: 55,
    scr: 88,
    selectedModules: ['af'],
    conditions: { af: true, htn: true },
    currentMeds: [],
    ...overrides
  };
}

describe('AF Round 2 Regression: OAC Safety, Renal/Dialysis, Child-Pugh, US Profile & DDIs', () => {
  it('1. Van cơ học / APS đang dùng trùng 2 DOAC: phát lệnh STOP riêng từng DOAC (dose: undefined) và khởi trị VKA / giữ Acenocoumarol', () => {
    const apsPt = baseAfPatient({
      conditions: { af: true, antiphospholipidSyndrome: true },
      currentMeds: [
        { drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' },
        { drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg' }
      ]
    });
    const plan = evaluate(apsPt, makeSettings('INTL'));
    const stopApix = plan.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP');
    const stopRiva = plan.recommendations.find((r) => r.drugId === 'rivaroxaban' && r.action === 'STOP');
    const startWarf = plan.recommendations.find((r) => r.drugId === 'warfarin' && r.action === 'START');
    expect(stopApix).toBeDefined();
    expect(stopApix?.dose).toBeUndefined();
    expect(stopRiva).toBeDefined();
    expect(stopRiva?.dose).toBeUndefined();
    expect(startWarf).toBeDefined();

    // Tương đương Acenocoumarol tại Việt Nam (không tự ý đổi sang Warfarin khi đang dùng Sintrom)
    const sintromPt = baseAfPatient({
      conditions: { af: true, mechanicalValve: true },
      currentMeds: [{ drugId: 'acenocoumarol', name: 'Sintrom', dose: 2, unit: 'mg' }]
    });
    const vnPlan = evaluate(sintromPt, makeSettings('VN'));
    expect(vnPlan.recommendations.some((r) => r.drugId === 'acenocoumarol' && r.action === 'CONTINUE')).toBe(true);
    expect(vnPlan.recommendations.some((r) => r.drugId === 'warfarin' && r.action === 'START')).toBe(false);
  });

  it('2. Xuất huyết nặng / Xuất huyết nội sọ cấp / Tiểu cầu < 50 G/L: STOP mọi thuốc chống đông (dose: undefined) kèm chất hóa giải đặc hiệu', () => {
    const dabiBleed = baseAfPatient({
      conditions: { af: true, htn: true, activeBleeding: true },
      currentMeds: [{ drugId: 'dabigatran', name: 'Pradaxa', dose: 150, unit: 'mg' }]
    });
    const planDabi = evaluate(dabiBleed, makeSettings('INTL', 'inpatient'));
    const stopDabi = planDabi.recommendations.find((r) => r.drugId === 'dabigatran' && r.action === 'STOP');
    expect(stopDabi).toBeDefined();
    expect(stopDabi?.dose).toBeUndefined();
    expect(stopDabi?.rationale).toContain('Idarucizumab');
    expect(planDabi.recommendations.some((r) => ['apixaban', 'warfarin'].includes(r.drugId ?? '') && r.action === 'START')).toBe(false);

    const apixThrombo = baseAfPatient({
      customInputs: { platelets: 35 },
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' }]
    });
    const planApix = evaluate(apixThrombo, makeSettings('INTL'));
    const stopApix = planApix.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP');
    expect(stopApix).toBeDefined();
    expect(stopApix?.dose).toBeUndefined();
    expect(stopApix?.rationale).toContain('Andexanet alfa');
  });

  it('3. Thai kỳ + Van cơ học -> REFER khẩn Pregnancy Heart Team (KHÔNG tự ý STOP Warfarin ngoại trú); Cho con bú -> STOP DOAC & chuyển Warfarin', () => {
    const pregMhv = baseAfPatient({
      age: 31,
      sex: 'female',
      conditions: { af: true, pregnant: true, mechanicalValve: true },
      currentMeds: [{ drugId: 'warfarin', name: 'Coumadin', dose: 4, unit: 'mg' }]
    });
    const mhvPlan = evaluate(pregMhv, makeSettings('INTL'));
    const heartTeam = mhvPlan.recommendations.find((r) => r.id === 'rec_af_pregnancy_mhv_heart_team');
    expect(heartTeam?.action).toBe('REFER');
    expect(heartTeam?.dose).toBeUndefined();
    expect(mhvPlan.recommendations.some((r) => r.drugId === 'warfarin' && r.action === 'STOP')).toBe(false);

    const lactationPt = baseAfPatient({
      age: 30,
      sex: 'female',
      conditions: { af: true, htn: true, breastfeeding: true },
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' }]
    });
    const lacPlan = evaluate(lactationPt, makeSettings('INTL'));
    const stopDoac = lacPlan.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP');
    const switchWarf = lacPlan.recommendations.find((r) => r.drugId === 'warfarin' && r.action === 'SWITCH');
    expect(stopDoac?.dose).toBeUndefined();
    expect(switchWarf?.switchFrom).toBe('apixaban');
  });

  it('4. Lọc máu chu kỳ kiểm tra TRƯỚC CrCl (không cần SCr): INTL/VN phát STOP DOAC, US cho phép Class 2b Apixaban', () => {
    const dialysisPt = baseAfPatient({
      scr: undefined,
      conditions: { af: true, htn: true, onDialysis: true },
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' }]
    });
    const intlPlan = evaluate(dialysisPt, makeSettings('INTL'));
    const intlStop = intlPlan.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP');
    expect(intlStop).toBeDefined();
    expect(intlStop?.dose).toBeUndefined();

    const usPlan = evaluate(dialysisPt, makeSettings('US'));
    expect(usPlan.recommendations.some((r) => r.drugId === 'apixaban' && r.action === 'CONTINUE')).toBe(true);
    expect(usPlan.recommendations.some((r) => r.drugId === 'apixaban' && r.action === 'STOP')).toBe(false);
  });

  it('5. Hồ sơ Hoa Kỳ (US) vs Quốc tế (INTL): Dabigatran 75 mg vs 110 mg, Edoxaban CrCl > 95 & P-gp, Rivaroxaban CrCl = 50', () => {
    // Dabigatran ở CrCl ~24 mL/phút: INTL STOP, US giảm liều 75 mg BID
    const dabiCrcl24 = baseAfPatient({
      age: 78,
      weight: 58,
      scr: 185,
      currentMeds: [{ drugId: 'dabigatran', name: 'Pradaxa', dose: 150, unit: 'mg' }]
    });
    expect(evaluate(dabiCrcl24, makeSettings('INTL')).recommendations.some((r) => r.drugId === 'dabigatran' && r.action === 'STOP')).toBe(true);
    const usDabi24 = evaluate(dabiCrcl24, makeSettings('US')).recommendations.find((r) => r.drugId === 'dabigatran' && r.action === 'REDUCE');
    expect(usDabi24?.dose).toContain('75 mg');

    // Dabigatran ở tuổi 82 thận tốt (CrCl ~62 mL/phút): INTL giảm 110 mg BID, US giữ 150 mg BID (không có viên 110 mg)
    const dabiAge82 = baseAfPatient({
      age: 82,
      weight: 72,
      scr: 82,
      currentMeds: [{ drugId: 'dabigatran', name: 'Pradaxa', dose: 150, unit: 'mg' }]
    });
    expect(evaluate(dabiAge82, makeSettings('INTL')).recommendations.find((r) => r.drugId === 'dabigatran')?.dose).toContain('110 mg');
    const usDabi82 = evaluate(dabiAge82, makeSettings('US')).recommendations.find((r) => r.drugId === 'dabigatran');
    expect(usDabi82?.action).toBe('CONTINUE');
    expect(usDabi82?.dose).toContain('150 mg');

    // Dabigatran + Dronedarone ở CrCl ~42 mL/phút: INTL STOP, US giảm 75 mg BID
    const dabiDron = baseAfPatient({
      age: 74,
      weight: 62,
      scr: 120,
      currentMeds: [
        { drugId: 'dabigatran', name: 'Pradaxa', dose: 150, unit: 'mg' },
        { drugId: 'dronedarone', name: 'Multaq', dose: 400, unit: 'mg' }
      ]
    });
    expect(evaluate(dabiDron, makeSettings('INTL')).recommendations.some((r) => r.drugId === 'dabigatran' && r.action === 'STOP')).toBe(true);
    expect(evaluate(dabiDron, makeSettings('US')).recommendations.find((r) => r.drugId === 'dabigatran')?.dose).toContain('75 mg');

    // Edoxaban ở CrCl > 95 mL/phút: US STOP (dose: undefined), INTL CONTINUE kèm Cảnh báo Hộp đen
    const edoxHigh = baseAfPatient({
      age: 48,
      weight: 85,
      scr: 70,
      currentMeds: [{ drugId: 'edoxaban', name: 'Savaysa', dose: 60, unit: 'mg' }]
    });
    const usEdoxStop = evaluate(edoxHigh, makeSettings('US')).recommendations.find((r) => r.drugId === 'edoxaban' && r.action === 'STOP');
    expect(usEdoxStop).toBeDefined();
    expect(usEdoxStop?.dose).toBeUndefined();
    expect(evaluate(edoxHigh, makeSettings('INTL')).recommendations.some((r) => r.drugId === 'edoxaban' && r.action === 'CONTINUE')).toBe(true);

    // Rivaroxaban đúng biên CrCl = 50.0 mL/phút (Nam 68t, 72kg, SCr = (140-68)*72 / (50*0.814) = 127.37 umol/L): US giảm 15 mg, INTL giữ 20 mg
    const riva50 = baseAfPatient({
      age: 68,
      sex: 'male',
      weight: 72,
      scr: 127.371,
      currentMeds: [{ drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg' }]
    });
    expect(evaluate(riva50, makeSettings('US')).recommendations.find((r) => r.drugId === 'rivaroxaban')?.action).toBe('REDUCE');
    expect(evaluate(riva50, makeSettings('INTL')).recommendations.find((r) => r.drugId === 'rivaroxaban')?.action).toBe('CONTINUE');

    // Apixaban đúng biên SCr = 1.5 mg/dL (units.cr = 'mg_dL') ở bệnh nhân 82 tuổi -> REDUCE 2.5 mg BID (AF-R2-R2-03 / AF-R2-R3-08)
    const mgDlSettings = makeSettings('US');
    mgDlSettings.units.cr = 'mg_dL';
    const apixScr15 = baseAfPatient({
      age: 82,
      weight: 74,
      scr: 1.5,
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg', freq: 'bid' }]
    });
    const apix15Rec = evaluate(apixScr15, mgDlSettings).recommendations.find((r) => r.drugId === 'apixaban');
    expect(apix15Rec?.action).toBe('REDUCE');
    expect(apix15Rec?.dose).toContain('2.5 mg');
  });

  it('6. Phân độ xơ gan Child-Pugh A / B / C cho DOAC', () => {
    // Child-Pugh A: Cho phép duy trì Rivaroxaban
    const cpA = baseAfPatient({
      conditions: { af: true, htn: true, liverDisease: true },
      customInputs: { childPugh: 'A' },
      currentMeds: [{ drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg' }]
    });
    expect(evaluate(cpA, makeSettings('INTL')).recommendations.some((r) => r.drugId === 'rivaroxaban' && r.action === 'CONTINUE')).toBe(true);

    // Child-Pugh B: STOP Rivaroxaban, nhưng cho phép Apixaban thận trọng
    const cpB = baseAfPatient({
      conditions: { af: true, htn: true, liverDisease: true },
      customInputs: { childPugh: 'B' },
      currentMeds: [{ drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg' }]
    });
    const cpBPlan = evaluate(cpB, makeSettings('INTL'));
    expect(cpBPlan.recommendations.find((r) => r.drugId === 'rivaroxaban' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(cpBPlan.recommendations.some((r) => r.drugId === 'apixaban' && r.action === 'START')).toBe(true);

    // Child-Pugh C: STOP tất cả 4 DOAC (kể cả Apixaban)
    const cpC = baseAfPatient({
      conditions: { af: true, htn: true, liverDisease: true },
      customInputs: { childPugh: 'C' },
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' }]
    });
    const cpCPlan = evaluate(cpC, makeSettings('INTL'));
    expect(cpCPlan.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(cpCPlan.recommendations.some((r) => ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'].includes(r.drugId ?? '') && r.action === 'START')).toBe(false);
  });

  it('7. Tương tác DDI mạnh (Rifampin / Ketoconazole), dị ứng Apixaban, chuyển đổi Enoxaparin, đơn vị "viên" & ACS/PCI kép', () => {
    // Rifampin cảm ứng mạnh CYP3A4/P-gp -> STOP DOAC + chuyển sang Warfarin
    const rifampinPt = baseAfPatient({
      currentMeds: [
        { drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' },
        { drugId: 'rifampin', name: 'Rifampicin', dose: 600, unit: 'mg' }
      ]
    });
    const rifPlan = evaluate(rifampinPt, makeSettings('INTL'));
    expect(rifPlan.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(rifPlan.recommendations.some((r) => r.drugId === 'warfarin' && r.action === 'START')).toBe(true);

    // Ketoconazole + Apixaban 5 mg BID -> REDUCE xuống 2.5 mg BID; nếu đã thỏa 2/3 tiêu chí ABC -> STOP Apixaban
    const ketoApix5 = baseAfPatient({
      currentMeds: [
        { drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg', freq: 'bid' },
        { drugId: 'ketoconazole', name: 'Nizoral', dose: 200, unit: 'mg' }
      ]
    });
    const ketoPlan = evaluate(ketoApix5, makeSettings('INTL'));
    expect(ketoPlan.recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'REDUCE')?.dose).toContain('2.5 mg');

    const ketoApixAbc = baseAfPatient({
      age: 83,
      weight: 54,
      currentMeds: [
        { drugId: 'apixaban', name: 'Eliquis', dose: 2.5, unit: 'mg', freq: 'bid' },
        { drugId: 'ketoconazole', name: 'Nizoral', dose: 200, unit: 'mg' }
      ]
    });
    expect(evaluate(ketoApixAbc, makeSettings('INTL')).recommendations.find((r) => r.drugId === 'apixaban' && r.action === 'STOP')?.dose).toBeUndefined();

    // Dị ứng Apixaban -> tự động chọn Rivaroxaban thay thế; Enoxaparin -> SWITCH sang DOAC không chồng liều
    const enoxAllergy = baseAfPatient({
      allergies: ['apixaban'],
      currentMeds: [{ drugId: 'enoxaparin', name: 'Lovenox', dose: 60, unit: 'mg' }]
    });
    const swPlan = evaluate(enoxAllergy, makeSettings('INTL'));
    const swRec = swPlan.recommendations.find((r) => r.id === 'rec_af_switch_parenteral_to_oac');
    expect(swRec?.action).toBe('SWITCH');
    expect(swRec?.drugId).toBe('edoxaban');
    expect(swRec?.switchFrom).toBe('enoxaparin');

    // Đơn vị mơ hồ '1 viên' hoặc Apixaban 5 mg uống 1 lần/ngày (qd) -> phát hiện thiếu liều / cảnh báo
    const wrongFreqPt = baseAfPatient({
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg', freq: 'qd' }]
    });
    expect(evaluate(wrongFreqPt, makeSettings('INTL')).recommendations.find((r) => r.drugId === 'apixaban')?.action).toBe('UPTITRATE');

    const vienUnitPt = baseAfPatient({
      currentMeds: [{ drugId: 'apixaban', name: 'Eliquis', dose: 1, unit: 'viên', freq: 'bid' }]
    });
    expect(evaluate(vienUnitPt, makeSettings('INTL')).recommendations.find((r) => r.drugId === 'apixaban')?.warnings?.some((w) => w.includes('viên'))).toBe(true);

    // ACS/PCI gần đây đang dùng Aspirin + Clopidogrel + Apixaban -> STOP sớm Aspirin, duy trì phác đồ kép DOAC + Clopidogrel
    const acsPciPt = baseAfPatient({
      conditions: { af: true, htn: true, recentAcs: true },
      currentMeds: [
        { drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg', freq: 'bid' },
        { drugId: 'aspirin', name: 'Aspirin', dose: 81, unit: 'mg' },
        { drugId: 'clopidogrel', name: 'Plavix', dose: 75, unit: 'mg' }
      ]
    });
    const acsPlan = evaluate(acsPciPt, makeSettings('INTL'));
    expect(acsPlan.recommendations.find((r) => r.drugId === 'aspirin' && r.action === 'STOP')?.dose).toBeUndefined();
    expect(acsPlan.recommendations.some((r) => r.drugId === 'clopidogrel' && r.action === 'STOP')).toBe(false);
    expect(acsPlan.recommendations.some((r) => r.id === 'rec_af_acs_pci_dual_therapy')).toBe(true);
  });
});
