/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Kiểm thử Hồi quy Vòng 4 — Sinh học, VTE, Đa phân hệ ACO/AF & Các Phát hiện MINOR / SUGGESTION
 * (R1-07..10, R2-13..21, R3-05..15)
 * Phân quyền: Agent L
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../../src/modules/registry', async () => {
  const copdMod = (await import('../../../src/modules/copd')).default;
  const asthmaMod = (await import('../../../src/modules/asthma')).default;
  const hfMod = (await import('../../../src/modules/hf')).default;
  const afMod = (await import('../../../src/modules/af')).default;
  const map = new Map<string, typeof copdMod>([
    [copdMod.id, copdMod],
    [asthmaMod.id, asthmaMod],
    [hfMod.id, hfMod],
    [afMod.id, afMod],
  ]);
  return {
    setDemoEnabled: () => {},
    isDemoEnabled: () => false,
    getAllModules: () => [copdMod, asthmaMod, hfMod, afMod],
    getModule: (id: string) => map.get(id),
    getActiveModules: (ids: string[]) => ids.map((id) => map.get(id)).filter(Boolean),
    getOfficialModuleIds: () => ['copd', 'asthma', 'hf', 'af'],
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import { copdMatrixDevices } from '../../../src/modules/copd/matrices.devices';
import type { Patient } from '../../../src/engine/types';
import { defaultSettings } from './invariants.helpers';

let originalWarn: typeof console.warn;
beforeAll(() => {
  originalWarn = console.warn;
  console.warn = () => {};
});
afterAll(() => {
  console.warn = originalWarn;
});

function basePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'r4_min',
    age: 66,
    sex: 'male',
    weight: 60,
    height: 165,
    sbp: 126,
    dbp: 78,
    hr: 80,
    scr: 82,
    conditions: { copd: true },
    currentMeds: [],
    selectedModules: ['copd'],
    customInputs: {
      fev1FvcRatio: 0.55,
      fev1PredPct: 45,
      mmrc: 2,
      cat: 15,
      moderateExacerbations: 1,
      hospitalizations: 1,
      bloodEos: 200,
      smokingStatus: 'former',
      currentInhaler: 'none',
    },
    ...overrides,
  };
}

describe('COPD Round 4 Biologics, Multi-Module & Minor/Suggestion Regression Suite', () => {
  it('[R1-07, R1-09, R1-10, R2-21, R3-13 & R3-15] Tách riêng xét nghiệm AATD cho bệnh nhân trẻ không hút thuốc (P09), chặn LDCT khi đã bỏ thuốc > 15 năm (P10), Shingrix bất hoạt & cảnh báo thuốc cai thuốc lá', () => {
    const p09 = basePatient({
      age: 41,
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 38,
        mmrc: 2,
        cat: 14,
        moderateExacerbations: 0,
        hospitalizations: 0,
        smokingStatus: 'never',
      },
    });
    const planP09 = evaluate(p09, defaultSettings);
    expect(planP09.recommendations.some((r) => r.id === 'rec_copd_aatd_screening')).toBe(true);
    expect(planP09.recommendations.some((r) => r.id === 'rec_copd_ldct_screening')).toBe(false);

    const quit25 = basePatient({
      age: 65,
      customInputs: {
        fev1FvcRatio: 0.55,
        fev1PredPct: 52,
        mmrc: 1,
        cat: 8,
        moderateExacerbations: 0,
        hospitalizations: 0,
        smokingStatus: 'former',
        packYears: 30,
        smokingQuitYears: 25,
      },
    });
    expect(
      evaluate(quit25, defaultSettings).recommendations.some((r) => r.id === 'rec_copd_ldct_screening')
    ).toBe(false);

    const quit10 = {
      ...quit25,
      customInputs: { ...quit25.customInputs, smokingQuitYears: 10 },
    };
    expect(
      evaluate(quit10, defaultSettings).recommendations.some((r) => r.id === 'rec_copd_ldct_screening')
    ).toBe(true);

    const smoker = basePatient({
      scr: 260,
      currentMeds: [{ drugId: 'theophylline', name: 'Theophylline 200 mg', dose: 100, unit: 'mg' }],
      customInputs: {
        fev1FvcRatio: 0.55,
        fev1PredPct: 50,
        mmrc: 1,
        cat: 8,
        moderateExacerbations: 0,
        hospitalizations: 0,
        smokingStatus: 'current',
        packYears: 25,
      },
    });
    const smokerPlan = evaluate(smoker, defaultSettings);
    const cess = smokerPlan.recommendations.find((r) => r.id === 'rec_copd_smoking_cessation');
    expect((cess?.warnings || []).join(' ')).toContain('Bupropion');
    expect((cess?.warnings || []).join(' ')).toContain('Varenicline');
    const vax = smokerPlan.recommendations.find((r) => r.id === 'rec_copd_vaccinations');
    expect(vax?.title).toContain('Shingrix');
    expect(vax?.citationIds).toContain('gold.copd.2026.vaccination_covid19');
  });

  it('[R2-13, R3-10 & R3-12] Sinh học COPD: dừng thuốc sinh học trùng lặp/không có chỉ định (benralizumab), chặn Dupilumab khi EOS >= 1500, cho phép sinh học trên ICS+LABA khi chống chỉ định LAMA (P17) & đồng bộ ACO', () => {
    const p04 = basePatient({
      sex: 'female',
      age: 38,
      conditions: { copd: true, pregnant: true },
      currentMeds: [
        { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy' },
        { drugId: 'benralizumab', name: 'Fasenra 30 mg' },
        { drugId: 'dupilumab', name: 'Dupixent 300 mg' },
      ],
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 42,
        mmrc: 2,
        cat: 18,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 420,
        chronicBronchitis: true,
        smokingStatus: 'never',
      },
    });
    const planP04 = evaluate(p04, defaultSettings);
    const stopBenra = planP04.recommendations.find(
      (r) => r.drugId === 'benralizumab' && r.action === 'STOP'
    );
    expect(stopBenra).toBeDefined();
    expect(stopBenra?.dose).toBeUndefined();
    const contDupi = planP04.recommendations.find(
      (r) => r.drugId === 'dupilumab' && r.action === 'CONTINUE'
    );
    expect(contDupi).toBeDefined();
    expect((contDupi?.warnings || []).join(' ')).toContain('vắc xin sống');
    expect((contDupi?.warnings || []).join(' ')).toContain('Thai kỳ');

    const hyperEos = basePatient({
      currentMeds: [
        { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy' },
        { drugId: 'dupilumab', name: 'Dupixent 300 mg' },
      ],
      customInputs: {
        fev1FvcRatio: 0.5,
        fev1PredPct: 45,
        mmrc: 2,
        cat: 18,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 1600,
        chronicBronchitis: true,
      },
    });
    const hyperPlan = evaluate(hyperEos, defaultSettings);
    expect(
      hyperPlan.recommendations.some((r) => r.drugId === 'dupilumab' && r.action === 'STOP')
    ).toBe(true);

    const p17 = basePatient({
      currentMeds: [{ drugId: 'budesonide_formoterol', name: 'Symbicort Rapihaler' }],
      customInputs: {
        fev1FvcRatio: 0.5,
        fev1PredPct: 44,
        mmrc: 2,
        cat: 18,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 350,
        chronicBronchitis: true,
        narrowAngleGlaucoma: true,
        smokingStatus: 'former',
      },
    });
    const planP17 = evaluate(p17, defaultSettings);
    expect(
      planP17.recommendations.some((r) => r.drugId === 'dupilumab' && r.action === 'CONSIDER')
    ).toBe(true);
  });

  it('[R2-14, R2-18, R3-05 & R3-07] Parse liều chuỗi steroid ("40 mg" / Medrol 32 mg), giảm liều steroid uống mạn (P01), quá liều Theophylline >= 10 mg/kg/ngày (P03), nhỏ mắt Timolol (E10) & ma trận khí dung', () => {
    const medrol32 = basePatient({
      currentMeds: [{ drugId: 'methylprednisolone', name: 'Medrol', dose: '32 mg', freq: 'QD' }],
      customInputs: {
        fev1FvcRatio: 0.5,
        fev1PredPct: 42,
        acuteExacerbation: true,
        restingSpo2: 90,
        abgPh: 7.38,
        abgPaco2: 42,
      },
    });
    const planMedrol = evaluate(medrol32, { ...defaultSettings, setting: 'inpatient' });
    expect(
      planMedrol.recommendations.some(
        (r) => r.drugId === 'methylprednisolone' && r.action === 'CONTINUE'
      )
    ).toBe(true);

    const chronicP = basePatient({
      weight: 45,
      conditions: { copd: true, cad: true },
      currentMeds: [
        { drugId: 'tiotropium_olodaterol', name: 'Spiolto' },
        { drugId: 'prednisolone', name: 'Prednisolone 5 mg', dose: 10, unit: 'mg', freq: 'QD' },
        { drugId: 'theophylline', name: 'Theophylline SR 400 mg', dose: 400, unit: 'mg', freq: 'BID' },
        { drugId: 'timolol_ophthalmic', name: 'Timolol 0.5% nhỏ mắt', route: 'ophthalmic' },
      ],
      customInputs: {
        fev1FvcRatio: 0.54,
        fev1PredPct: 48,
        mmrc: 1,
        cat: 8,
        moderateExacerbations: 0,
        hospitalizations: 0,
      },
    });
    const chronicPlan = evaluate(chronicP, defaultSettings);
    expect(
      chronicPlan.recommendations.some((r) => r.drugId === 'prednisolone' && r.action === 'REDUCE')
    ).toBe(true);
    const theoRec = chronicPlan.recommendations.find((r) => r.drugId === 'theophylline');
    expect(theoRec?.action).toBe('STOP');
    expect(theoRec?.dose).toBeUndefined();

    const stopTimolol = chronicPlan.recommendations.find((r) => r.drugId === 'timolol_ophthalmic');
    expect(stopTimolol?.action).toBe('STOP');
    expect(stopTimolol?.dose).toBeUndefined();
    expect(chronicPlan.recommendations.some((r) => r.id === 'rec_copd_ophthalmic_bb_refer')).toBe(true);
    expect(chronicPlan.recommendations.some((r) => r.drugId === 'bisoprolol')).toBe(false);

    expect(copdMatrixDevices.rows.some((r) => r.drugId === 'salbutamol')).toBe(true);
    const trelegyRow = copdMatrixDevices.rows.find(
      (r) => r.drugId === 'fluticasone_furoate_umeclidinium_vilanterol'
    );
    expect(JSON.stringify(trelegyRow)).toContain('CYP3A4');
  });

  it('[R2-20, R3-09 & R3-14] Dự phòng VTE gắn drugId, chống chỉ định HIT / tiểu cầu < 50 (P15), nhường chống đông điều trị của AF (F08) & Nhóm A dị ứng sữa chuyển sang Tiotropium đơn trị (E02)', () => {
    const p15 = basePatient({
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 36,
        acuteExacerbation: true,
        heparinInducedThrombocytopenia: true,
        platelets: 35,
        restingSpo2: 90,
        abgPh: 7.38,
        abgPaco2: 42,
      },
    });
    const planP15 = evaluate(p15, { ...defaultSettings, setting: 'inpatient' });
    const vteAvoid = planP15.recommendations.find((r) => r.id === 'rec_copd_vte_prophylaxis');
    expect(vteAvoid?.action).toBe('AVOID');
    expect(vteAvoid?.drugId).toBe('enoxaparin');
    expect(vteAvoid?.dose).toBeUndefined();

    const f08 = basePatient({
      age: 74,
      conditions: { copd: true, af: true, htn: true },
      selectedModules: ['copd', 'af'],
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 38,
        acuteExacerbation: true,
        restingSpo2: 90,
        abgPh: 7.38,
        abgPaco2: 42,
        afType: 'non_valvular',
        symptomEhra: 2,
      },
    });
    const planF08 = evaluate(f08, { ...defaultSettings, setting: 'inpatient' });
    const hasOacStart = planF08.recommendations.some(
      (r) =>
        ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin'].includes(r.drugId ?? '') &&
        r.action === 'START'
    );
    expect(hasOacStart).toBe(true);
    expect(
      planF08.recommendations.some((r) => r.id === 'rec_copd_vte_prophylaxis' && r.action === 'START')
    ).toBe(false);

    const e02 = basePatient({
      currentMeds: [{ drugId: 'umeclidinium', name: 'Incruse Ellipta' }],
      customInputs: {
        fev1FvcRatio: 0.62,
        fev1PredPct: 68,
        mmrc: 1,
        cat: 6,
        moderateExacerbations: 0,
        hospitalizations: 0,
        severeMilkProteinAllergy: true,
      },
    });
    const planE02 = evaluate(e02, defaultSettings);
    const swE02 = planE02.recommendations.find((r) => r.id === 'rec_copd_switch_dpi_inhaler');
    expect(swE02?.drugId).toBe('tiotropium');
  });
});
