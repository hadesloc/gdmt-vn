/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Round 3 Regression Suite 1:
 * FDC Decomposition/Unbundling, Dose Frequency/Brand Parsing, Pregnancy/Lactation/WOCBP,
 * Gallbladder, Child-Pugh A/B/C, Global Bempedoic Acid Gates, Allergies, Duplicates & BAS
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { defaultSettings } from './_fixtures';

describe('lipid_round3_safety_fdc: Kiểm thử hồi quy Vòng 3 — Viên phối hợp FDC, liều BID/biệt dược, thai kỳ/sữa mẹ, gan/mật, dị ứng & trùng lặp', () => {
  it('1. FDC decomposition & dose extraction (rosuvastatin_ezetimibe 20/10, simvastatin_ezetimibe 10/40, amlodipine_atorvastatin 5/20, bempedoic_acid_ezetimibe 180/10)', () => {
    // 1a. Rosuvastatin/Ezetimibe 20/10 mg chưa đạt đích -> Không kê trùng Ezetimibe, leo thang thẳng PCSK9i (B09, E61)
    const rosuEzePlan = evaluate(
      {
        age: 62,
        sex: 'male',
        scr: 82,
        ldl: 2.3,
        conditions: { ascvd: true },
        currentMeds: [{ drugId: 'rosuvastatin_ezetimibe', dose: '20/10 mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(rosuEzePlan.recommendations.some((r) => r.drugId === 'ezetimibe' && r.action === 'START')).toBe(false);
    expect(rosuEzePlan.recommendations.some((r) => r.drugId === 'evolocumab' && r.action === 'START')).toBe(true);

    // 1b. Rosuvastatin/Ezetimibe 40/10 mg ở CKD G4 (eGFR < 30) -> Bắt được liều Rosuvastatin 40 mg để REDUCE <= 10 mg
    const rosuEzeCkdPlan = evaluate(
      {
        age: 74,
        sex: 'female',
        scr: 230,
        ldl: 1.3,
        conditions: { ascvd: true, ckd: true },
        currentMeds: [{ drugId: 'rosuvastatin_ezetimibe', dose: '40/10 mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      rosuEzeCkdPlan.recommendations.some(
        (r) => r.drugId === 'rosuvastatin_ezetimibe' && r.action === 'REDUCE'
      )
    ).toBe(true);

    // 1c. Simvastatin/Ezetimibe 10/40 mg (Inegy/Vytorin thứ tự Ezetimibe/Simvastatin) + Amlodipine -> REDUCE/STOP do trần Simvastatin 20 mg
    const simvaEzeAmloPlan = evaluate(
      {
        age: 65,
        sex: 'male',
        scr: 86,
        ldl: 1.3,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'simvastatin_ezetimibe', dose: '10/40 mg' },
          { drugId: 'amlodipine', dose: 10, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      simvaEzeAmloPlan.recommendations.some(
        (r) => r.drugId === 'simvastatin_ezetimibe' && (r.action === 'REDUCE' || r.action === 'STOP')
      )
    ).toBe(true);

    // 1d. Amlodipine/Atorvastatin 5/20 mg (Caduet) + CK = 12x ULN -> STOP FDC và có hướng dẫn giữ lại Amlodipine đơn chất (B12)
    const caduetRhabdoPlan = evaluate(
      {
        age: 64,
        sex: 'male',
        scr: 90,
        ldl: 2.1,
        conditions: { ascvd: true, htn: true },
        customInputs: { ckUlnTimes: 12 },
        currentMeds: [{ drugId: 'amlodipine_atorvastatin', dose: '5/20 mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const stopCaduet = caduetRhabdoPlan.recommendations.find(
      (r) => r.drugId === 'amlodipine_atorvastatin' && r.action === 'STOP'
    );
    expect(stopCaduet).toBeDefined();
    expect(stopCaduet?.rationale).toMatch(/Amlodipine/i);

    // 1e. Bempedoic acid/Ezetimibe 180/10 mg + tiền sử đứt gân -> STOP FDC kèm hướng dẫn giữ lại Ezetimibe 10 mg
    const bempEzeTendonPlan = evaluate(
      {
        age: 63,
        sex: 'female',
        scr: 78,
        ldl: 2.4,
        conditions: { ascvd: true, statinIntolerance: true, tendonRuptureHistory: true },
        currentMeds: [{ drugId: 'bempedoic_acid_ezetimibe', dose: '180/10 mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const stopBempEze = bempEzeTendonPlan.recommendations.find(
      (r) => r.drugId === 'bempedoic_acid_ezetimibe' && r.action === 'STOP'
    );
    expect(stopBempEze).toBeDefined();
    expect(stopBempEze?.rationale).toMatch(/Ezetimibe/i);
  });

  it('2. Phân tích tần suất dùng thuốc trong ngày (BID / 2 lần/ngày) và hàm lượng biệt dược Fenofibrate (200M vs 67 mg)', () => {
    // Pitavastatin 2 mg x 2 lần/ngày (= 4 mg/ngày) ở CKD G3b -> REDUCE <= 2 mg/ngày (C39)
    const pitaBidPlan = evaluate(
      {
        age: 70,
        sex: 'female',
        scr: 140,
        ldl: 1.5,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'pitavastatin', dose: 2, unit: 'mg', freq: '2 lần/ngày' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(pitaBidPlan.recommendations.some((r) => r.drugId === 'pitavastatin' && r.action === 'REDUCE')).toBe(true);

    // Rosuvastatin 10 mg BID (= 20 mg/ngày) ở CKD G4 -> REDUCE <= 10 mg/ngày
    const rosuBidPlan = evaluate(
      {
        age: 73,
        sex: 'male',
        scr: 245,
        ldl: 1.3,
        conditions: { ascvd: true, ckd: true },
        currentMeds: [{ drugId: 'rosuvastatin', dose: 10, unit: 'mg', freq: 'BID' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(rosuBidPlan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'REDUCE')).toBe(true);

    // Lipanthyl 200M 1 viên ở CKD G3b (eGFR ~ 38) -> Bắt được 200 mg để REDUCE về 48–67 mg
    const lipanthyl200Plan = evaluate(
      {
        age: 69,
        sex: 'male',
        scr: 165,
        ldl: 2.1,
        tg: 6.4,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'fenofibrate', name: 'Lipanthyl 200M', dose: '1 viên' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(lipanthyl200Plan.recommendations.some((r) => r.drugId === 'fenofibrate' && r.action === 'REDUCE')).toBe(true);

    // Fenofibrate 67 mg đã chỉnh liều ở CKD G3b -> Không bị cảnh báo REDUCE giả
    const feno67Plan = evaluate(
      {
        age: 69,
        sex: 'male',
        scr: 165,
        ldl: 2.1,
        tg: 6.4,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'fenofibrate', dose: 67, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(feno67Plan.recommendations.some((r) => r.drugId === 'fenofibrate' && r.action === 'REDUCE')).toBe(false);
  });

  it('3. Thai kỳ đa thuốc, cho con bú (washout 5 ngày Fibrate), dự định mang thai (1–2 tháng), HoFH/ASCVD & WOCBP (D46–D52, G98)', () => {
    // 3a. Cho con bú + Fenofibrate + Atorvastatin -> STOP toàn bộ và cảnh báo ngừng cho bú 5 ngày sau liều Fenofibrate cuối
    const lactationPlan = evaluate(
      {
        age: 30,
        sex: 'female',
        scr: 62,
        ldl: 3.9,
        tg: 6.2,
        conditions: { breastfeeding: true },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 20, unit: 'mg' },
          { drugId: 'fenofibrate', dose: 145, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const stopFenoLact = lactationPlan.recommendations.find(
      (r) => r.drugId === 'fenofibrate' && r.action === 'STOP'
    );
    expect(stopFenoLact).toBeDefined();
    expect(stopFenoLact?.rationale).toMatch(/5 ngày/);
    expect(lactationPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'STOP')).toBe(true);

    // 3b. Dự định mang thai (planningPregnancy) -> Ngừng trước 1–2 tháng và không khởi trị thuốc uống mới
    const preconceptionPlan = evaluate(
      {
        age: 29,
        sex: 'female',
        scr: 60,
        ldl: 4.5,
        conditions: { planningPregnancy: true, familialHypercholesterolemia: true },
        currentMeds: [{ drugId: 'rosuvastatin', dose: 20, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const stopPrecon = preconceptionPlan.recommendations.find(
      (r) => r.drugId === 'rosuvastatin' && r.action === 'STOP'
    );
    expect(stopPrecon).toBeDefined();
    expect(stopPrecon?.rationale).toMatch(/1–2 tháng/);

    // 3c. Thai kỳ kèm HoFH / ASCVD hoặc TG >= 5.6 -> Phải sinh REFER hội chẩn đa chuyên khoa (lọc LDL apheresis / dinh dưỡng & Omega-3)
    const pregHofhHtgPlan = evaluate(
      {
        age: 28,
        sex: 'female',
        scr: 58,
        ldl: 8.2,
        tg: 9.4,
        conditions: { pregnant: true, ascvd: true, hofh: true },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 80, unit: 'mg' },
          { drugId: 'ezetimibe', dose: 10, unit: 'mg' },
          { drugId: 'evolocumab', dose: 140, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(pregHofhHtgPlan.recommendations.filter((r) => r.action === 'STOP').length).toBeGreaterThanOrEqual(3);
    expect(
      pregHofhHtgPlan.recommendations.some(
        (r) => r.id === 'rec_lipid_pregnancy_refer_hofh_ascvd' && r.action === 'REFER'
      )
    ).toBe(true);
    expect(
      pregHofhHtgPlan.recommendations.some(
        (r) => r.id === 'rec_lipid_pregnancy_refer_htg' && r.action === 'REFER'
      )
    ).toBe(true);

    // 3d. Phụ nữ tuổi sinh sản (WOCBP, 32 tuổi) khởi trị Statin -> Phải có cảnh báo tránh thai & ngừng trước 1–2 tháng
    const wocbpPlan = evaluate(
      {
        age: 32,
        sex: 'female',
        scr: 64,
        ldl: 5.4,
        conditions: { familialHypercholesterolemia: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const startStatinWocbp = wocbpPlan.recommendations.find(
      (r) => r.drugId === 'atorvastatin' && r.action === 'START'
    );
    expect(startStatinWocbp?.warnings?.some((w) => /tránh thai/i.test(w))).toBe(true);
  });

  it('4. Xơ gan còn bù Child-Pugh A vs mất bù Child-Pugh B/C & toàn bộ chống chỉ định Bempedoic acid (đứt gân / gút)', () => {
    // 4a. Xơ gan còn bù Child-Pugh A -> Vẫn cho phép khởi trị Statin thận trọng (có cảnh báo), nhưng STOP Fenofibrate
    const childAPlan = evaluate(
      {
        age: 59,
        sex: 'male',
        scr: 82,
        ldl: 3.4,
        tg: 2.8,
        conditions: { ascvd: true, cirrhosis: true },
        customInputs: { childPugh: 'A', altUlnTimes: 1.4 },
        currentMeds: [{ drugId: 'fenofibrate', dose: 145, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(childAPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(true);
    expect(childAPlan.recommendations.some((r) => r.drugId === 'fenofibrate' && r.action === 'STOP')).toBe(true);

    // 4b. Xơ gan mất bù Child-Pugh B -> HOLD Statin, HOLD Ezetimibe, HOLD Bempedoic acid, STOP Fenofibrate
    const childBPlan = evaluate(
      {
        age: 61,
        sex: 'male',
        scr: 88,
        ldl: 2.9,
        conditions: { ascvd: true, cirrhosis: true },
        customInputs: { childPugh: 'B' },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 40, unit: 'mg' },
          { drugId: 'ezetimibe', dose: 10, unit: 'mg' },
          { drugId: 'bempedoic_acid', dose: 180, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      childBPlan.recommendations.some(
        (r) => r.drugId === 'atorvastatin' && (r.action === 'HOLD' || r.action === 'STOP')
      )
    ).toBe(true);
    expect(
      childBPlan.recommendations.some(
        (r) => r.drugId === 'ezetimibe' && (r.action === 'HOLD' || r.action === 'STOP')
      )
    ).toBe(true);
    expect(
      childBPlan.recommendations.some(
        (r) => r.drugId === 'bempedoic_acid' && (r.action === 'HOLD' || r.action === 'STOP')
      )
    ).toBe(true);

    // 4c. Đang dùng Bempedoic acid trên nền Gút cấp hoặc tiền sử đứt gân -> Bị chặn ở mọi nhánh (BEMP_01..03, E73)
    const bempGoutActivePlan = evaluate(
      {
        age: 64,
        sex: 'male',
        scr: 85,
        ldl: 2.2,
        conditions: { ascvd: true, statinIntolerance: true, gout: true },
        currentMeds: [
          { drugId: 'ezetimibe', dose: 10, unit: 'mg' },
          { drugId: 'bempedoic_acid', dose: 180, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(bempGoutActivePlan.recommendations.some((r) => r.drugId === 'bempedoic_acid' && r.action === 'HOLD')).toBe(true);
    expect(bempGoutActivePlan.recommendations.some((r) => r.drugId === 'bempedoic_acid' && r.action === 'CONTINUE')).toBe(false);
  });

  it('5. Dị ứng thuốc, trùng lặp nhóm thuốc (giữ lại 1 statin tối ưu thay vì STOP hết) & nhựa gắn acid mật (BAS)', () => {
    // 5a. Dị ứng Atorvastatin & Ezetimibe -> Khởi trị Rosuvastatin và leo thang thẳng Alirocumab khi dị ứng Evolocumab
    const allergyInitPlan = evaluate(
      {
        age: 60,
        sex: 'male',
        scr: 80,
        ldl: 3.6,
        allergies: ['atorvastatin'],
        conditions: { ascvd: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(allergyInitPlan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'START')).toBe(true);
    expect(allergyInitPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(false);

    const step3SkipEzePlan = evaluate(
      {
        age: 60,
        sex: 'male',
        scr: 80,
        ldl: 2.4,
        allergies: ['ezetimibe', 'evolocumab'],
        conditions: { ascvd: true },
        currentMeds: [{ drugId: 'rosuvastatin', dose: 40, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(step3SkipEzePlan.recommendations.some((r) => r.drugId === 'alirocumab' && r.action === 'START')).toBe(true);
    expect(step3SkipEzePlan.recommendations.some((r) => r.drugId === 'ezetimibe' && r.action === 'START')).toBe(false);

    // 5b. Trùng lặp 2 Statin [pravastatin 40 mg + atorvastatin 40 mg] -> STOP pravastatin, giữ lại atorvastatin (G87b, E62)
    const dupStatinPlan = evaluate(
      {
        age: 63,
        sex: 'male',
        scr: 84,
        ldl: 1.2,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'pravastatin', dose: 40, unit: 'mg' },
          { drugId: 'atorvastatin', dose: 40, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(dupStatinPlan.recommendations.some((r) => r.drugId === 'pravastatin' && r.action === 'STOP')).toBe(true);
    expect(dupStatinPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'STOP')).toBe(false);
    expect(dupStatinPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'CONTINUE')).toBe(true);

    // 5c. Trùng lặp Evolocumab + Inclisiran (12a) -> STOP thuốc PCSK9 trùng lặp
    const dupPcsk9Plan = evaluate(
      {
        age: 61,
        sex: 'female',
        scr: 76,
        ldl: 1.1,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'rosuvastatin', dose: 20, unit: 'mg' },
          { drugId: 'evolocumab', dose: 140, unit: 'mg' },
          { drugId: 'inclisiran', dose: 284, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      dupPcsk9Plan.recommendations.some(
        (r) => (r.drugId === 'inclisiran' || r.drugId === 'evolocumab') && r.action === 'STOP'
      )
    ).toBe(true);

    // 5d. Đang dùng omega3_ethyl_esters -> Không kê chồng Icosapent ethyl; Colesevelam + TG >= 5.6 -> STOP Colesevelam; Colesevelam + Levothyroxine -> MONITOR giãn cách uống
    const omegaAliasAndBasPlan = evaluate(
      {
        age: 58,
        sex: 'female',
        scr: 78,
        ldl: 1.3,
        tg: 6.2,
        conditions: { ascvd: true, dm: true },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 40, unit: 'mg' },
          { drugId: 'omega3_ethyl_esters', dose: 4, unit: 'g' },
          { drugId: 'colesevelam', dose: 3750, unit: 'mg' },
          { drugId: 'levothyroxine', dose: 100, unit: 'mcg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(omegaAliasAndBasPlan.recommendations.some((r) => r.drugId === 'icosapent_ethyl')).toBe(false);
    expect(omegaAliasAndBasPlan.recommendations.some((r) => r.drugId === 'colesevelam' && r.action === 'STOP')).toBe(true);

    const basSpacingPlan = evaluate(
      {
        age: 58,
        sex: 'female',
        scr: 78,
        ldl: 1.3,
        tg: 1.6,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 40, unit: 'mg' },
          { drugId: 'cholestyramine', dose: 4000, unit: 'mg' },
          { drugId: 'levothyroxine', dose: 100, unit: 'mcg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(basSpacingPlan.recommendations.some((r) => r.id === 'rec_lipid_bas_absorption_spacing')).toBe(true);
  });
});
