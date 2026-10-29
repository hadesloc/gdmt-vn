/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Round 3 Regression Suite 3:
 * US Profile (PREVENT 10-Yr Categories, Standard vs Very-High ASCVD < 70/< 55 mg/dL, Lp(a) >= 125 nmol/L,
 * US Icosapent Ethyl Criteria), VN Early PCSK9i Intolerance, Subclinical CAC, Untreated Hypothyroidism,
 * Myasthenia Gravis, Kidney Transplant, All 9 ASCVD Vascular Beds, DM + UACR >= 30, T1DM >= 35,
 * HIV + ASCVD + Ritonavir, Friedewald TG > 4.5 Override & Top-Level nonHdl Unit Handling
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Settings } from '../../../src/engine/types';
import { defaultSettings } from './_fixtures';

const usSettingsMgDl: Settings = {
  ...defaultSettings,
  profile: 'US',
  units: { ...defaultSettings.units, lipid: 'mg_dL' }
};

describe('lipid_round3_profiles_special: Kiểm thử hồi quy Vòng 3 — Hồ sơ US (PREVENT/CAC/ASCVD), VN, suy giáp, nhược cơ, ghép thận, HIV & 9 biến mạch xơ vữa', () => {
  it('1. Nhận diện đầy đủ 9 cờ bệnh xơ vữa thành mạch (pci, cabg, ccs, acs, stemi, nstemi, carotid, claudication, aorticAneurysm) vào bậc nguy cơ rất cao', () => {
    const vascularKeys = [
      'pci',
      'cabg',
      'ccs',
      'acs',
      'stemi',
      'nstemi',
      'carotid',
      'claudication',
      'aorticAneurysm'
    ] as const;

    for (const key of vascularKeys) {
      const plan = evaluate(
        {
          age: 58,
          sex: 'male',
          sbp: 124,
          dbp: 76,
          scr: 82,
          tc: 4.8,
          hdl: 1.2,
          ldl: 2.2,
          tg: 1.4,
          conditions: { [key]: true },
          currentMeds: [],
          selectedModules: ['lipid']
        },
        defaultSettings
      );
      expect(
        plan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')
      ).toBe(true);
    }
  });

  it('2. Hồ sơ US (ACC/AHA 2026): ASCVD nguy cơ chuẩn (< 70 mg/dL + tùy chọn < 55 mg/dL), PREVENT, Lp(a) >= 125 nmol/L & Icosapent ethyl US', () => {
    // 2a. ASCVD ổn định không tiêu chí Very-High trên US: LDL = 64 mg/dL đã đạt đích < 70 mg/dL (CONTINUE) + CONSIDER tối ưu < 55 mg/dL, không ép START Ezetimibe bắt buộc (10a)
    const usStdAscvdPlan = evaluate(
      {
        age: 61,
        sex: 'male',
        sbp: 122,
        dbp: 74,
        scr: 84,
        ldl: 64,
        tg: 120,
        conditions: { pci: true },
        currentMeds: [{ drugId: 'atorvastatin', dose: 80, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      usSettingsMgDl
    );
    expect(usStdAscvdPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'CONTINUE')).toBe(true);
    expect(usStdAscvdPlan.recommendations.some((r) => r.drugId === 'ezetimibe' && r.action === 'START')).toBe(false);
    expect(
      usStdAscvdPlan.recommendations.some((r) => r.id === 'rec_lipid_us_standard_ascvd_consider_sub55')
    ).toBe(true);

    // 2b. Ngưỡng Lp(a) trên hồ sơ US: lpaNmol = 110 nmol/L KHÔNG vượt ngưỡng 125 nmol/L; lpaNmol = 130 nmol/L VƯỢT ngưỡng 125 nmol/L (A10, 10c)
    const usLpa110Plan = evaluate(
      {
        age: 50,
        sex: 'female',
        sbp: 118,
        dbp: 74,
        scr: 68,
        tc: 195,
        hdl: 55,
        ldl: 115,
        tg: 110,
        conditions: {},
        customInputs: { lpaNmol: 110 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      usSettingsMgDl
    );
    expect(usLpa110Plan.recommendations.some((r) => r.id === 'rec_lipid_lpa_elevated')).toBe(false);

    const usLpa130Plan = evaluate(
      {
        age: 50,
        sex: 'female',
        sbp: 118,
        dbp: 74,
        scr: 68,
        tc: 195,
        hdl: 55,
        ldl: 115,
        tg: 110,
        conditions: {},
        customInputs: { lpaNmol: 130 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      usSettingsMgDl
    );
    expect(usLpa130Plan.recommendations.some((r) => r.id === 'rec_lipid_lpa_elevated')).toBe(true);

    // 2c. US Icosapent ethyl: ASCVD + tuổi >= 50 + TG = 180 mg/dL (>= 150) + LDL = 68 mg/dL (< 100) trên Statin -> CONSIDER Icosapent ethyl (10d)
    const usIpePlan = evaluate(
      {
        age: 58,
        sex: 'male',
        sbp: 124,
        dbp: 76,
        scr: 82,
        ldl: 68,
        tg: 180,
        conditions: { ascvd: true },
        currentMeds: [{ drugId: 'atorvastatin', dose: 40, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      usSettingsMgDl
    );
    expect(usIpePlan.recommendations.some((r) => r.drugId === 'icosapent_ethyl')).toBe(true);
  });

  it('3. Điểm vôi hóa mạch vành CAC (100–299, >= 300, >= 1000 Agatston), ĐTĐ kèm UACR >= 30 mg/mmol & ĐTĐ típ 1 >= 35 tuổi', () => {
    // 3a. CAC = 160 Agatston ở dự phòng tiên phát nguy cơ thấp -> Nâng bậc khởi trị Statin cường độ trung bình
    const cac160Plan = evaluate(
      {
        age: 52,
        sex: 'male',
        sbp: 122,
        dbp: 76,
        scr: 80,
        tc: 5.1,
        hdl: 1.3,
        ldl: 3.1,
        tg: 1.3,
        conditions: {},
        customInputs: { cacScore: 160 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(cac160Plan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(true);

    // 3b. CAC = 1200 Agatston trên hồ sơ US -> Đích < 55 mg/dL, khởi trị Statin cường độ cao
    const cac1200UsPlan = evaluate(
      {
        age: 58,
        sex: 'male',
        sbp: 126,
        dbp: 78,
        scr: 84,
        tc: 210,
        hdl: 48,
        ldl: 130,
        tg: 140,
        conditions: {},
        customInputs: { cacScore: 1200 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      usSettingsMgDl
    );
    const cacRec = cac1200UsPlan.recommendations.find((r) => r.drugId === 'atorvastatin' && r.action === 'START');
    expect(cacRec).toBeDefined();
    expect(cacRec?.dose).toMatch(/40–80 mg/);

    // 3c. ĐTĐ có UACR = 45 mg/mmol (> 30 mg/mmol = albumin niệu đại thể) -> Tự động xếp nguy cơ rất cao (đích < 1.4 mmol/L) kể cả chưa gán cờ dmTargetOrganDamage (9a)
    const dmMacroAlbPlan = evaluate(
      {
        age: 54,
        sex: 'male',
        sbp: 128,
        dbp: 78,
        scr: 82,
        uacr: 45,
        ldl: 1.7,
        tg: 1.6,
        conditions: { dm: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const dmRec = dmMacroAlbPlan.recommendations.find((r) => r.drugId === 'atorvastatin' && r.action === 'START');
    expect(dmRec).toBeDefined();
    expect(dmRec?.dose).toMatch(/40–80 mg/);

    // 3d. ĐTĐ típ 1 tuổi 38 (>= 35 tuổi) thời gian bệnh ngắn -> Tự động xếp tối thiểu nguy cơ cao (đích < 1.8 mmol/L) (15b)
    const t1dm38Plan = evaluate(
      {
        age: 38,
        sex: 'female',
        sbp: 118,
        dbp: 72,
        scr: 64,
        ldl: 2.3,
        tg: 1.1,
        conditions: { dm: true, t1dm: true },
        customInputs: { dmDurationYears: 6 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(t1dm38Plan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(true);
  });

  it('4. Suy giáp chưa kiểm soát (TSH >= 10), Nhược cơ, Ghép thận, HIV + ASCVD + Ritonavir, VN không dung nạp Statin & Friedewald TG > 4.5', () => {
    // 4a. Suy giáp nặng chưa điều trị (TSH = 58 mIU/L) ngoại trú -> DEFER khởi trị Statin mới cho đến khi bù giáp bình giáp (B31)
    const hypothyroidPlan = evaluate(
      {
        age: 56,
        sex: 'female',
        sbp: 126,
        dbp: 80,
        scr: 88,
        tc: 7.4,
        hdl: 1.2,
        ldl: 5.1,
        tg: 2.6,
        conditions: {},
        customInputs: { tsh: 58 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      hypothyroidPlan.recommendations.some(
        (r) => r.id === 'rec_lipid_hypothyroidism_defer_statin' && r.action === 'DEFER'
      )
    ).toBe(true);
    expect(hypothyroidPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(false);

    // 4b. Nhược cơ (myastheniaGravis) khởi trị Statin -> Phải kèm cảnh báo theo dõi nặng thêm nhược cơ (B30)
    const mgPlan = evaluate(
      {
        age: 62,
        sex: 'male',
        scr: 82,
        ldl: 3.3,
        conditions: { ascvd: true, myastheniaGravis: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const mgRec = mgPlan.recommendations.find((r) => r.drugId === 'atorvastatin' && r.action === 'START');
    expect(mgRec?.warnings?.some((w) => /nhược cơ/i.test(w))).toBe(true);

    // 4c. Bệnh nhân ghép thận (kidneyTransplant: true) chưa dùng statin -> CONSIDER khởi trị Statin liều thấp–trung bình (15c)
    const ktxPlan = evaluate(
      {
        age: 48,
        sex: 'male',
        sbp: 128,
        dbp: 78,
        scr: 118,
        ldl: 2.9,
        tg: 1.8,
        conditions: { kidneyTransplant: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(ktxPlan.recommendations.some((r) => r.id === 'rec_lipid_kidney_transplant_statin')).toBe(true);

    // 4d. HIV + ASCVD + Ritonavir -> Chỉ phát duy nhất 1 khuyến cáo Statin an toàn (không kê song song cả Pitavastatin và Rosuvastatin) (ROSU_03)
    const hivAscvdRtvPlan = evaluate(
      {
        age: 52,
        sex: 'male',
        scr: 80,
        ldl: 3.1,
        conditions: { hiv: true, ascvd: true },
        currentMeds: [{ drugId: 'ritonavir', dose: 100, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const statinRecs = hivAscvdRtvPlan.recommendations.filter(
      (r) =>
        (r.drugId === 'pitavastatin' || r.drugId === 'rosuvastatin' || r.drugId === 'atorvastatin') &&
        (r.action === 'START' || r.action === 'CONSIDER')
    );
    expect(statinRecs.length).toBe(1);

    // 4e. Hồ sơ VN: ASCVD không dung nạp Statin chưa dùng Ezetimibe có LDL rất xa đích (3.8 mmol/L) -> START Ezetimibe + CONSIDER sớm PCSK9i thay thế Bempedoic acid chưa phổ biến tại VN (11)
    const vnIntolPlan = evaluate(
      {
        age: 61,
        sex: 'male',
        scr: 84,
        ldl: 3.8,
        conditions: { ascvd: true, statinIntolerance: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      { ...defaultSettings, profile: 'VN' }
    );
    expect(vnIntolPlan.recommendations.some((r) => r.drugId === 'ezetimibe' && r.action === 'START')).toBe(true);
    expect(vnIntolPlan.recommendations.some((r) => r.drugId === 'evolocumab' && r.action === 'CONSIDER')).toBe(true);

    // 4f. ASCVD chưa dùng statin có TG = 6.2 mmol/L (> 4.5) khiến LDL Friedewald giả tạo thấp (1.2 mmol/L) -> Vẫn phải khởi trị Statin cường độ cao thay vì báo đã đạt đích giả (G95)
    const friedewaldOverridePlan = evaluate(
      {
        age: 59,
        sex: 'male',
        scr: 82,
        ldl: 1.2,
        tg: 6.2,
        conditions: { ascvd: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(friedewaldOverridePlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(true);
    expect(friedewaldOverridePlan.recommendations.some((r) => r.id === 'rec_lipid_primary_goal_achieved')).toBe(false);

    // 4g. Top-level nonHdl ở chế độ mg/dL (nonHdl: 135 mg/dL trên ASCVD đã đạt LDL = 50 mg/dL) -> Quy đổi đúng sang mmol/L và kích hoạt tối ưu mục tiêu thứ phát (A08, G93)
    const nonHdlMgDlPlan = evaluate(
      {
        age: 63,
        sex: 'male',
        scr: 82,
        ldl: 50,
        nonHdl: 135,
        tg: 190,
        conditions: { ascvd: true },
        currentMeds: [{ drugId: 'atorvastatin', dose: 40, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      { ...defaultSettings, units: { ...defaultSettings.units, lipid: 'mg_dL' } }
    );
    const secRec = nonHdlMgDlPlan.recommendations.find((r) => r.id === 'rec_lipid_secondary_nonhdl_apob_optimize');
    expect(secRec).toBeDefined();
    expect(secRec?.rationale).toMatch(/135 mg\/dL/);
  });
});
