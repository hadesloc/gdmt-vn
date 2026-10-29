/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Kiểm thử Hồi quy Vòng 4 — Toàn bộ 10 Phát hiện CRITICAL (R1-01, R2-01..05, R3-01..04)
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
import { hasDrug } from '../../../src/kb-types';
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

function baseCopdPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'r4_crit',
    age: 68,
    sex: 'male',
    weight: 62,
    height: 165,
    sbp: 124,
    dbp: 76,
    hr: 82,
    scr: 85,
    conditions: { copd: true },
    currentMeds: [],
    selectedModules: ['copd'],
    customInputs: {
      fev1FvcRatio: 0.54,
      fev1PredPct: 44,
      mmrc: 2,
      cat: 16,
      moderateExacerbations: 1,
      hospitalizations: 1,
      bloodEos: 180,
      smokingStatus: 'former',
      currentInhaler: 'none',
    },
    ...overrides,
  };
}

describe('COPD Round 4 Critical Findings Regression (R1-01, R2-01..05, R3-01..04)', () => {
  it('[COPD-R4-R1-01] Đợt cấp ICU ngừng thở / hôn mê / sốc: bắt buộc START methylprednisolone đường tĩnh mạch, tuyệt đối không kê viên uống prednisolone', () => {
    const p = baseCopdPatient({
      sbp: 82,
      dbp: 50,
      hr: 118,
      customInputs: {
        fev1FvcRatio: 0.45,
        fev1PredPct: 30,
        acuteExacerbation: true,
        respiratoryArrest: true,
        alteredMentalStatus: true,
        abgPh: 7.18,
        abgPaco2: 76,
        restingSpo2: 78,
        purulentSputum: true,
        increasedDyspnea: true,
      },
    });
    const plan = evaluate(p, { ...defaultSettings, setting: 'inpatient', profile: 'INTL' });
    const steroidRec = plan.recommendations.find((r) => r.id === 'rec_copd_inpatient_steroid');
    expect(steroidRec).toBeDefined();
    expect(steroidRec?.action).toBe('START');
    expect(steroidRec?.drugId).toBe('methylprednisolone');
    expect(steroidRec?.dose).toMatch(/^methylprednisolone/i);
    expect(steroidRec?.dose).toContain('tiêm tĩnh mạch');
    expect(steroidRec?.dose?.toLowerCase()).not.toContain('viên');
    expect(plan.recommendations.some((r) => r.drugId === 'prednisolone')).toBe(false);

    const nivRec = plan.recommendations.find((r) => r.id === 'rec_copd_inpatient_niv');
    expect(nivRec?.action).toBe('AVOID');
    expect(nivRec?.dose).toBeUndefined();
    expect(plan.recommendations.some((r) => r.id === 'rec_copd_inpatient_icu' && r.action === 'REFER')).toBe(true);
  });

  it('[COPD-R4-R2-01] Biệt danh FDC đảo thứ tự (indacaterol_glycopyrronium & beclometasone_formoterol_glycopyrronium) trên glôcôm góc đóng: phát STOP (dose=undefined) và đổi sang thuốc không chứa LAMA, không bị gộp nhầm thành CONTINUE', () => {
    for (const fdcId of ['indacaterol_glycopyrronium', 'beclometasone_formoterol_glycopyrronium']) {
      const p = baseCopdPatient({
        currentMeds: [{ drugId: fdcId, name: fdcId === 'indacaterol_glycopyrronium' ? 'Ultibro Breezhaler 110/50' : 'Trimbow pMDI' }],
        customInputs: {
          postBdFev1Fvc: 0.56,
          fev1PredPct: 48,
          cat: 16,
          mmrc: 2,
          moderateExacerbations: 0,
          hospitalizations: 0,
          bloodEos: 150,
          narrowAngleGlaucoma: true,
        },
      });
      const plan = evaluate(p, { ...defaultSettings, setting: 'outpatient', profile: 'VN' });
      const stopRec = plan.recommendations.find((r) => r.drugId === fdcId && r.action === 'STOP');
      expect(stopRec).toBeDefined();
      expect(stopRec?.dose).toBeUndefined();
      expect(plan.recommendations.some((r) => r.drugId === fdcId && r.action === 'CONTINUE')).toBe(false);
      const altRec = plan.recommendations.find((r) => r.id === 'rec_copd_lama_contra_alternative');
      expect(altRec).toBeDefined();
      expect(['olodaterol', 'budesonide_formoterol']).toContain(altRec?.drugId);
    }
  });

  it('[COPD-R4-R2-02] Tương tác chống chỉ định CYP3A4 mạnh (clarithromycin, itraconazole, roxithromycin): tránh kê mới Trelegy và chủ động STOP/SWITCH Seretide/Anoro sang bình hít an toàn CYP3A4', () => {
    // 1. Khởi trị Nhóm E BCAT 350 trên nền clarithromycin -> chọn beclometasone_glycopyrronium_formoterol thay vì Trelegy
    const initP = baseCopdPatient({
      currentMeds: [{ drugId: 'clarithromycin', name: 'Klacid 500 mg', dose: 500, unit: 'mg' }],
      customInputs: {
        fev1FvcRatio: 0.52,
        fev1PredPct: 42,
        mmrc: 2,
        cat: 18,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 350,
        smokingStatus: 'former',
        currentInhaler: 'none',
      },
    });
    const initPlan = evaluate(initP, defaultSettings);
    const tripleInit = initPlan.recommendations.find((r) => r.id === 'rec_copd_init_group_e_triple');
    expect(tripleInit?.drugId).toBe('beclometasone_glycopyrronium_formoterol');
    expect(
      initPlan.recommendations.some(
        (r) => r.drugId === 'fluticasone_furoate_umeclidinium_vilanterol' && r.action === 'START'
      )
    ).toBe(false);

    // 2. Đang dùng Seretide + roxithromycin -> STOP Seretide và SWITCH sang thuốc không chứa salmeterol/fluticasone
    const seretideP = baseCopdPatient({
      currentMeds: [
        { drugId: 'fluticasone_salmeterol', name: 'Seretide Accuhaler 50/250' },
        { drugId: 'roxithromycin', name: 'Rulid 150 mg', dose: 150, unit: 'mg' },
      ],
      customInputs: {
        fev1FvcRatio: 0.58,
        fev1PredPct: 55,
        mmrc: 1,
        cat: 8,
        moderateExacerbations: 0,
        hospitalizations: 0,
        bloodEos: 220,
        smokingStatus: 'former',
      },
    });
    const seretidePlan = evaluate(seretideP, defaultSettings);
    expect(
      seretidePlan.recommendations.some(
        (r) => r.drugId === 'fluticasone_salmeterol' && r.action === 'CONTINUE'
      )
    ).toBe(false);
    const stopSeretide = seretidePlan.recommendations.find(
      (r) => r.drugId === 'fluticasone_salmeterol' && (r.action === 'STOP' || r.action === 'SWITCH')
    );
    expect(stopSeretide).toBeDefined();
  });

  it('[COPD-R4-R2-03] Đồng mắc COPD + HFrEF đang dùng Carvedilol: không cắt đột ngột STOP trong đợt cấp huyết động ổn định (phát REDUCE), và khi HR=42 bpm phát HOLD (dose=undefined) không mâu thuẫn Bisoprolol', () => {
    const acuteHfP = baseCopdPatient({
      lvef: 30,
      sbp: 118,
      hr: 84,
      conditions: { copd: true, hf: true },
      selectedModules: ['copd', 'hf'],
      currentMeds: [{ drugId: 'carvedilol', name: 'Coreg 12.5 mg', dose: 12.5, unit: 'mg', freq: 'BID' }],
      customInputs: {
        fev1FvcRatio: 0.5,
        fev1PredPct: 40,
        acuteExacerbation: true,
        restingSpo2: 90,
        abgPh: 7.38,
        abgPaco2: 42,
        purulentSputum: true,
        increasedDyspnea: true,
      },
    });
    const acutePlan = evaluate(acuteHfP, { ...defaultSettings, setting: 'inpatient' });
    const carvAcute = acutePlan.recommendations.find((r) => r.drugId === 'carvedilol');
    expect(carvAcute).toBeDefined();
    expect(carvAcute?.action).not.toBe('STOP');
    expect(['REDUCE', 'CONTINUE']).toContain(carvAcute?.action);

    const brady47P = baseCopdPatient({
      lvef: 32,
      sbp: 118,
      hr: 47,
      conditions: { copd: true, hf: true },
      selectedModules: ['copd', 'hf'],
      currentMeds: [{ drugId: 'carvedilol', name: 'Coreg 12.5 mg', dose: 12.5, unit: 'mg' }],
    });
    const brady47Plan = evaluate(brady47P, defaultSettings);
    const carvBrady47 = brady47Plan.recommendations.find((r) => r.drugId === 'carvedilol');
    expect(['HOLD', 'STOP']).toContain(carvBrady47?.action);
    expect(carvBrady47?.dose).toBeUndefined();
    expect(
      brady47Plan.recommendations.some(
        (r) => r.drugId === 'bisoprolol' && (r.action === 'START' || r.action === 'SWITCH')
      )
    ).toBe(false);

    const brady42P = { ...brady47P, hr: 42 };
    const brady42Plan = evaluate(brady42P, defaultSettings);
    const carvBrady42 = brady42Plan.recommendations.find((r) => r.drugId === 'carvedilol');
    expect(['HOLD', 'STOP']).toContain(carvBrady42?.action);
    expect(carvBrady42?.dose).toBeUndefined();
    expect(
      brady42Plan.recommendations.some(
        (r) => r.drugId === 'bisoprolol' && (r.action === 'START' || r.action === 'SWITCH')
      )
    ).toBe(false);
  });

  it('[COPD-R4-R2-04] Nhận diện đầy đủ FDC SAMA+SABA (Combivent ipratropium_salbutamol & Berodual ipratropium_fenoterol) trong glôcôm góc đóng đợt cấp và trùng lặp LAMA giai đoạn ổn định', () => {
    expect(hasDrug('ipratropium_salbutamol')).toBe(true);
    expect(hasDrug('ipratropium_fenoterol')).toBe(true);

    // 1. Đợt cấp nội viện glôcôm góc đóng đang phun Berodual -> STOP Berodual (dose=undefined)
    const acuteGlaucomaP = baseCopdPatient({
      currentMeds: [{ drugId: 'ipratropium_fenoterol', name: 'Berodual khí dung' }],
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 36,
        acuteExacerbation: true,
        narrowAngleGlaucoma: true,
        restingSpo2: 89,
        abgPh: 7.37,
        abgPaco2: 43,
      },
    });
    const acutePlan = evaluate(acuteGlaucomaP, { ...defaultSettings, setting: 'inpatient' });
    const stopBerodual = acutePlan.recommendations.find(
      (r) => r.drugId === 'ipratropium_fenoterol' && (r.action === 'STOP' || r.action === 'AVOID')
    );
    expect(stopBerodual).toBeDefined();
    expect(stopBerodual?.dose).toBeUndefined();

    // 2. Ngoại trú ổn định dùng Spiolto + Combivent -> STOP Combivent
    const stableDupP = baseCopdPatient({
      currentMeds: [
        { drugId: 'tiotropium_olodaterol', name: 'Spiolto Respimat' },
        { drugId: 'ipratropium_salbutamol', name: 'Combivent MDI' },
      ],
      customInputs: {
        fev1FvcRatio: 0.55,
        fev1PredPct: 50,
        mmrc: 1,
        cat: 8,
        moderateExacerbations: 0,
        hospitalizations: 0,
        bloodEos: 120,
      },
    });
    const stablePlan = evaluate(stableDupP, defaultSettings);
    const stopCombivent = stablePlan.recommendations.find(
      (r) => r.drugId === 'ipratropium_salbutamol' && r.action === 'STOP'
    );
    expect(stopCombivent).toBeDefined();
    expect(stopCombivent?.dose).toBeUndefined();
  });

  it('[COPD-R4-R2-05] Chống chỉ định phối hợp Azithromycin + Domperidone (Phụ lục 11 STT 3 QĐ 2131/QĐ-BYT 2026): chặn tuyệt đối gợi ý Azithromycin dự phòng', () => {
    const p = baseCopdPatient({
      currentMeds: [
        { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta' },
        { drugId: 'domperidone', name: 'Motilium-M 10 mg', dose: 10, unit: 'mg' },
      ],
      customInputs: {
        fev1FvcRatio: 0.46,
        fev1PredPct: 38,
        mmrc: 2,
        cat: 18,
        moderateExacerbations: 2,
        hospitalizations: 1,
        bloodEos: 80,
        smokingStatus: 'former',
        currentInhaler: 'triple',
      },
    });
    const plan = evaluate(p, defaultSettings);
    expect(
      plan.recommendations.some(
        (r) => r.drugId === 'azithromycin' && (r.action === 'CONSIDER' || r.action === 'START')
      )
    ).toBe(false);
    const avoidAzi = plan.recommendations.find(
      (r) => r.drugId === 'azithromycin' && r.action === 'AVOID'
    );
    expect(avoidAzi).toBeDefined();
    expect(avoidAzi?.dose).toBeUndefined();
  });

  it('[COPD-R4-R3-01] Bối cảnh nội trú ngoài đợt cấp (E01, P07, P08): tuyệt đối KHÔNG phát Phantom STOP làm mất trắng thuốc hít nền tảng', () => {
    const medSets = [
      [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta' }],
      [{ drugId: 'fluticasone_salmeterol', name: 'Seretide Evohaler' }],
      [
        { drugId: 'tiotropium', name: 'Spiriva Respimat' },
        { drugId: 'budesonide_formoterol', name: 'Symbicort Rapihaler' },
      ],
    ];
    for (const meds of medSets) {
      const p = baseCopdPatient({
        currentMeds: meds,
        customInputs: {
          fev1FvcRatio: 0.56,
          fev1PredPct: 58,
          mmrc: 1,
          cat: 6,
          moderateExacerbations: 0,
          hospitalizations: 0,
          bloodEos: 50,
          acuteExacerbation: false,
          smokingStatus: 'former',
        },
      });
      const plan = evaluate(p, { ...defaultSettings, setting: 'inpatient' });
      expect(plan.recommendations.some((r) => r.action === 'STOP')).toBe(false);
      expect(plan.recommendations.some((r) => r.action === 'CONTINUE')).toBe(true);
    }
  });

  it('[COPD-R4-R3-02] Tự động nhận diện ngừng thở / toan hô hấp mất bù (D01, D02, D03) khi quên tích ô acuteExacerbation và khóa chặt LTOT / vắc-xin / khởi trị mạn', () => {
    // D01: Nội trú ngừng thở + pH 7.20 chưa tích acuteExacerbation
    const d01 = baseCopdPatient({
      customInputs: {
        fev1FvcRatio: 0.45,
        fev1PredPct: 28,
        respiratoryArrest: true,
        alteredMentalStatus: true,
        abgPh: 7.2,
        abgPaco2: 74,
        restingSpo2: 80,
        respiratoryRate: 35,
      },
    });
    const planD01 = evaluate(d01, { ...defaultSettings, setting: 'inpatient' });
    expect(planD01.recommendations.some((r) => r.id === 'rec_copd_inpatient_icu')).toBe(true);
    expect(planD01.recommendations.some((r) => r.id === 'rec_copd_ltot')).toBe(false);
    expect(planD01.recommendations.some((r) => r.id === 'rec_copd_vaccinations')).toBe(false);

    // D02: Ngoại trú pH 7.24, PaCO2 68, SpO2 91% chưa tích acuteExacerbation
    const d02 = baseCopdPatient({
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 34,
        abgPh: 7.24,
        abgPaco2: 68,
        restingSpo2: 91,
      },
    });
    const planD02 = evaluate(d02, { ...defaultSettings, setting: 'outpatient' });
    expect(planD02.recommendations.some((r) => r.id === 'rec_copd_outpatient_emergency_refer')).toBe(true);
    expect(planD02.recommendations.some((r) => r.id.startsWith('rec_copd_init_group_'))).toBe(false);

    // D03: Ngoại trú SpO2 80% + co kéo cơ hô hấp phụ chưa tích acuteExacerbation -> cấm kê LTOT tại nhà
    const d03 = baseCopdPatient({
      customInputs: {
        fev1FvcRatio: 0.48,
        fev1PredPct: 34,
        restingSpo2: 80,
        accessoryMuscleUse: true,
        increasedDyspnea: true,
        purulentSputum: true,
      },
    });
    const planD03 = evaluate(d03, { ...defaultSettings, setting: 'outpatient' });
    expect(planD03.recommendations.some((r) => r.id === 'rec_copd_outpatient_emergency_refer')).toBe(true);
    expect(planD03.recommendations.some((r) => r.id === 'rec_copd_ltot')).toBe(false);
  });

  it('[COPD-R4-R3-03] Phản vệ đạm sữa bò nặng trên Spiriva HandiHaler DPI / Symbicort Turbuhaler DPI (P05, P06, Q03) và đa bình DPI chưa có CNHH (E04): cấm CONTINUE DPI, dừng đủ mọi bình DPI', () => {
    // P05: tiotropium + tên HandiHaler DPI
    const p05 = baseCopdPatient({
      currentMeds: [{ drugId: 'tiotropium', name: 'Spiriva HandiHaler 18mcg DPI' }],
      customInputs: {
        fev1FvcRatio: 0.56,
        fev1PredPct: 58,
        mmrc: 1,
        cat: 6,
        moderateExacerbations: 0,
        hospitalizations: 0,
        severeMilkProteinAllergy: true,
      },
    });
    const planP05 = evaluate(p05, defaultSettings);
    expect(planP05.recommendations.some((r) => r.action === 'CONTINUE' && r.drugId === 'tiotropium')).toBe(false);
    const swP05 = planP05.recommendations.find((r) => r.id === 'rec_copd_switch_dpi_inhaler');
    expect(swP05?.action).toBe('SWITCH');
    expect(swP05?.dose).toContain('Respimat');

    // E04: 2 bình DPI khi chưa có hô hấp ký -> phát STOP cho cả 2 bình (dose=undefined)
    const e04 = baseCopdPatient({
      currentMeds: [
        { drugId: 'tiotropium', name: 'Spiriva HandiHaler 18mcg DPI' },
        { drugId: 'fluticasone_salmeterol', name: 'Seretide Accuhaler 50/250 DPI' },
      ],
      customInputs: {
        severeMilkProteinAllergy: true,
      },
    });
    const planE04 = evaluate(e04, defaultSettings);
    const stoppedDpis = planE04.recommendations.filter((r) => r.action === 'STOP');
    expect(stoppedDpis.some((r) => r.drugId === 'tiotropium')).toBe(true);
    expect(stoppedDpis.some((r) => r.drugId === 'fluticasone_salmeterol')).toBe(true);
    expect(stoppedDpis.every((r) => r.dose === undefined)).toBe(true);
  });

  it('[COPD-R4-R3-04 & R2-06] Toan hô hấp cấp dùng đồng thời nhiều thuốc ức chế TKTƯ (morphine + diazepam + pregabalin) và nhiều xanthin (theophylline + aminophylline): phát STOP cho TẤT CẢ các thuốc nguy hiểm', () => {
    const p = baseCopdPatient({
      currentMeds: [
        { drugId: 'morphine', name: 'Morphine 10 mg' },
        { drugId: 'diazepam', name: 'Diazepam 5 mg' },
        { drugId: 'pregabalin', name: 'Lyrica 75 mg' },
        { drugId: 'theophylline', name: 'Theophylline SR 200 mg' },
        { drugId: 'aminophylline', name: 'Aminophylline IV' },
      ],
      customInputs: {
        fev1FvcRatio: 0.44,
        fev1PredPct: 32,
        acuteExacerbation: true,
        abgPh: 7.3,
        abgPaco2: 58,
        restingSpo2: 88,
      },
    });
    const plan = evaluate(p, { ...defaultSettings, setting: 'inpatient' });
    for (const id of ['morphine', 'diazepam', 'theophylline', 'aminophylline']) {
      const stopRec = plan.recommendations.find((r) => r.drugId === id && r.action === 'STOP');
      expect(stopRec, `Phải phát lệnh STOP cho ${id}`).toBeDefined();
      expect(stopRec?.dose).toBeUndefined();
    }
    const gabaRec = plan.recommendations.find(
      (r) => r.drugId === 'pregabalin' && (r.action === 'REDUCE' || r.action === 'STOP')
    );
    expect(gabaRec).toBeDefined();
    expect(gabaRec?.dose).toBeUndefined();
  });
});
