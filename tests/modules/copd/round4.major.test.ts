/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Kiểm thử Hồi quy Vòng 4 — Các Phát hiện MAJOR (R1-02..06, R2-07..13, R3-05..12)
 * Phân quyền: Agent L
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
import { hasDrug, drug } from '../../../src/kb-types';
import { copdPresets } from '../../../src/modules/copd/presets';
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
    id: 'r4_maj',
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

describe('COPD Round 4 Major Findings Regression Suite', () => {
  it('[R1-02 & R3-08] Đợt cấp nhẹ ngoại trú tự thở khí trời (SpO2 95%, RR 19): không báo giả giảm oxy, không bắt chọc ABG, ưu tiên pMDI + buồng đệm và hẹn tái khám 1–4 tuần', () => {
    const p = basePatient({
      customInputs: {
        fev1FvcRatio: 0.58,
        fev1PredPct: 56,
        acuteExacerbation: true,
        restingSpo2: 95,
        respiratoryRate: 19,
        increasedDyspnea: true,
        purulentSputum: true,
        increasedSputumVolume: true,
      },
    });
    const plan = evaluate(p, { ...defaultSettings, setting: 'outpatient', profile: 'INTL' });
    expect(plan.recommendations.some((r) => r.id === 'rec_copd_inpatient_avoid_hyperoxia')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'missing_input_abgPh')).toBe(false);
    const saba = plan.recommendations.find((r) => r.id === 'rec_copd_inpatient_saba_sama');
    expect(saba?.title).toContain('pMDI');
    expect(plan.recommendations.some((r) => r.id === 'rec_copd_outpatient_post_exac_followup')).toBe(true);
  });

  it('[R1-03 & R2-19] Khó thở nặng (mMRC=3, CAT=24) trên nền Triple: rút ICS nếu kê sai chỉ định (EOS=50, 0 đợt cấp); phát hướng dẫn xử trí khó thở + Ensifentrine nếu có chỉ định giữ ICS (EOS=350)', () => {
    const deescP = basePatient({
      currentMeds: [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta' }],
      customInputs: {
        fev1FvcRatio: 0.52,
        fev1PredPct: 48,
        mmrc: 3,
        cat: 24,
        moderateExacerbations: 0,
        hospitalizations: 0,
        bloodEos: 50,
        smokingStatus: 'former',
      },
    });
    const deescPlan = evaluate(deescP, defaultSettings);
    expect(
      deescPlan.recommendations.some((r) => r.id === 'rec_copd_withdraw_inappropriate_ics')
    ).toBe(true);

    const keepP = basePatient({
      currentMeds: [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta' }],
      customInputs: {
        fev1FvcRatio: 0.52,
        fev1PredPct: 48,
        mmrc: 3,
        cat: 24,
        moderateExacerbations: 0,
        hospitalizations: 0,
        bloodEos: 350,
        smokingStatus: 'former',
      },
    });
    const keepPlan = evaluate(keepP, defaultSettings);
    const dyspRec = keepPlan.recommendations.find((r) => r.id === 'rec_copd_dyspnea_switch_device_rehab');
    expect(dyspRec).toBeDefined();
    expect(dyspRec?.profileDiff?.INTL).toContain('Ensifentrine');
    const contTriple = keepPlan.recommendations.find((r) => r.id === 'rec_copd_continue_triple');
    expect(contTriple?.rationale).not.toContain('đáp ứng ổn định');
  });

  it('[R1-04, R2-09 & R2-10] Toàn vẹn KB COPD: có đủ formoterol/enoxaparin/heparin, sạch watermark cá nhân, sạch cor giả lập ngoài ESC và không gán nhầm Varenicline cho LAMA', () => {
    for (const id of ['formoterol', 'enoxaparin', 'heparin', 'ipratropium_salbutamol', 'ipratropium_fenoterol']) {
      expect(hasDrug(id)).toBe(true);
    }
    const rawCit = readFileSync(resolve(__dirname, '../../../kb/citations/copd.json'), 'utf8');
    expect(rawCit).not.toContain('ngoctlv.kcb');
    expect(rawCit).not.toContain('Truong Le Van Ngoc');
    const citations = JSON.parse(rawCit) as Array<{ id: string; sourceId: string; cor?: string }>;
    const bogusCor = citations.filter((c) => c.cor !== undefined && !c.sourceId.startsWith('esc_'));
    expect(bogusCor).toEqual([]);
    const tioRenalCits = drug('tiotropium').renal.flatMap((b) => b.citationIds);
    expect(
      tioRenalCits.some((id) => id.includes('varenicline') || id === 'byt.copd.2023.severe_renal_crcl30')
    ).toBe(false);
  });

  it('[R1-06 & R2-08] Kháng sinh đợt cấp: chuẩn 5 ngày trên INTL/US vs 5–7/7–10 ngày trên VN; cảnh báo chỉnh liều thận eGFR 35 < 50, đứt gân Achilles ở người 76 tuổi dùng steroid và tương tác Warfarin', () => {
    const p = basePatient({
      age: 76,
      scr: 165,
      currentMeds: [{ drugId: 'warfarin', name: 'Coumadin 2 mg', dose: 2, unit: 'mg' }],
      customInputs: {
        fev1FvcRatio: 0.42,
        fev1PredPct: 26,
        hospitalizations: 2,
        acuteExacerbation: true,
        purulentSputum: true,
        increasedDyspnea: true,
        increasedSputumVolume: true,
        restingSpo2: 89,
        abgPh: 7.37,
        abgPaco2: 44,
      },
    });
    const intlPlan = evaluate(p, { ...defaultSettings, setting: 'inpatient', profile: 'INTL' });
    const abxIntl = intlPlan.recommendations.find((r) => r.id === 'rec_copd_inpatient_antibiotics');
    expect(abxIntl?.title).toContain('5 ngày');
    expect(abxIntl?.title).not.toContain('5–7 ngày');
    const warnJoined = (abxIntl?.warnings || []).join(' ');
    expect(warnJoined).toContain('Achilles');
    expect(warnJoined).toContain('INR');
    expect(warnJoined).toMatch(/Levofloxacin|Ciprofloxacin|thận/i);

    const vnPlan = evaluate(p, { ...defaultSettings, setting: 'inpatient', profile: 'VN' });
    const abxVn = vnPlan.recommendations.find((r) => r.id === 'rec_copd_inpatient_antibiotics');
    expect(abxVn?.title).toContain('7–10 ngày');
  });

  it('[R2-07, R2-11 & R3-06] Preset nội viện 02:45 khai báo setting=inpatient & respiratoryRate=30; nội viện STOP LAMA do glôcôm vẫn có thuốc giãn phế quản dài hạn thay thế', () => {
    const presetInpatient = copdPresets.find((p) => p.id === 'copd_preset_inpatient_exac_0245');
    expect(presetInpatient?.setting).toBe('inpatient');
    expect(presetInpatient?.patient.customInputs?.respiratoryRate).toBe(30);
    const presetA = copdPresets.find((p) => p.id === 'copd_preset_group_a');
    expect(presetA?.patient.customInputs?.packYears).toBe(25);

    const inpGlaucoma = basePatient({
      currentMeds: [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta' }],
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 36,
        acuteExacerbation: true,
        narrowAngleGlaucoma: true,
        bloodEos: 320,
        restingSpo2: 90,
        abgPh: 7.38,
        abgPaco2: 42,
      },
    });
    const plan = evaluate(inpGlaucoma, { ...defaultSettings, setting: 'inpatient' });
    expect(plan.recommendations.some((r) => r.id === 'rec_copd_lama_contra_alternative')).toBe(true);
  });

  it('[R2-12, R2-15 & R2-16] DDI Roflumilast + Fluvoxamine phát STOP; Azithromycin chặn bệnh gan/QTc số học >= 450 ms; cảnh báo thận eGFR < 30 cho LAMA', () => {
    const rofFluvox = basePatient({
      currentMeds: [
        { drugId: 'tiotropium_olodaterol', name: 'Spiolto Respimat' },
        { drugId: 'roflumilast', name: 'Daliresp 500 mcg', dose: 500, unit: 'mcg' },
        { drugId: 'fluvoxamine', name: 'Luvox 50 mg', dose: 50, unit: 'mg' },
      ],
      customInputs: {
        fev1FvcRatio: 0.45,
        fev1PredPct: 38,
        mmrc: 2,
        cat: 16,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 80,
        chronicBronchitis: true,
        smokingStatus: 'former',
      },
    });
    const rofPlan = evaluate(rofFluvox, defaultSettings);
    const stopRof = rofPlan.recommendations.find((r) => r.drugId === 'roflumilast' && r.action === 'STOP');
    expect(stopRof).toBeDefined();
    expect(stopRof?.dose).toBeUndefined();

    const ckdQtP = basePatient({
      scr: 280,
      qtc: 470,
      customInputs: {
        fev1FvcRatio: 0.46,
        fev1PredPct: 38,
        mmrc: 2,
        cat: 16,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 70,
        smokingStatus: 'former',
        currentInhaler: 'none',
      },
    });
    const ckdPlan = evaluate(ckdQtP, defaultSettings);
    const spiolto = ckdPlan.recommendations.find((r) => r.drugId === 'tiotropium_olodaterol');
    expect((spiolto?.warnings || []).join(' ')).toMatch(/thận|eGFR|CrCl/i);
    expect(
      ckdPlan.recommendations.some((r) => r.drugId === 'azithromycin' && r.action === 'CONSIDER')
    ).toBe(false);
  });
});
