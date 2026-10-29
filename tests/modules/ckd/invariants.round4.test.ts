/**
 * GDMT-VN CKD Module - Round 4 Comprehensive Clinical Remediation Unit Suite (< 20 KB)
 * Khóa toàn bộ findings từ round4_R1.json, round4_R2.json và round4_R3.json.
 * Lưu ý: Tên describe chứa 'ckd' chữ thường để khớp bộ lọc `-t "ckd"`.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Settings } from '../../../src/engine/types';

const baseOut: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false,
};

const baseIn: Settings = { ...baseOut, setting: 'inpatient' };

describe('Module ckd - Round 4 Clinical Remediation Suite (R1, R2, R3)', () => {
  it('ckd R4-R1-01 & R2-02: phân tích chính xác CurrentMed.freq nhiều lần/ngày, cách ngày và fail-closed khi không đọc được liều', () => {
    // 1) NaHCO3 dose: 1000, unit: 'mg', freq: '4 lần/ngày' (= 4000 mg/ngày) -> MONITOR trần, không UPTITRATE
    const planBicarb = evaluate(
      {
        id: 'r4_bicarb_qid',
        name: 'Bicarb QID',
        age: 64,
        sex: 'male',
        weight: 68,
        sbp: 126,
        dbp: 76,
        scr: 220,
        k: 4.5,
        hco3: 16,
        uacr: 20,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'sodium_bicarbonate', dose: 1000, unit: 'mg', freq: '4 lần/ngày' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planBicarb.recommendations.some((r) => r.drugId === 'sodium_bicarbonate' && r.action === 'MONITOR')).toBe(true);
    expect(planBicarb.recommendations.some((r) => r.drugId === 'sodium_bicarbonate' && r.action === 'UPTITRATE')).toBe(false);

    // 2) Enalapril 10 mg, freq: '2 lần/ngày' (= 20 mg/ngày đạt đích) -> cho phép START Finerenone, không UPTITRATE Enalapril
    const planEnalaprilBid = evaluate(
      {
        id: 'r4_enal_bid',
        name: 'Enalapril BID',
        age: 60,
        sex: 'male',
        weight: 72,
        sbp: 132,
        dbp: 78,
        scr: 140,
        k: 4.4,
        uacr: 35,
        conditions: { ckd: true, dm: true },
        currentMeds: [{ drugId: 'enalapril', dose: 10, unit: 'mg', freq: '2 lần/ngày' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planEnalaprilBid.recommendations.some((r) => r.drugId === 'enalapril' && r.action === 'UPTITRATE')).toBe(false);
    expect(planEnalaprilBid.recommendations.some((r) => r.drugId === 'finerenone' && r.action === 'START')).toBe(true);

    // 3) Losartan dose: '1 viên' (không parse được mg/ngày) -> Fail-closed: DEFER Finerenone thay vì ngầm giả định đã đạt liều tối đa
    const planUnparsed = evaluate(
      {
        id: 'r4_unparsed_los',
        name: 'Unparsed Losartan',
        age: 60,
        sex: 'male',
        weight: 72,
        sbp: 126,
        dbp: 76,
        scr: 140,
        k: 4.4,
        uacr: 35,
        conditions: { ckd: true, dm: true },
        currentMeds: [{ drugId: 'losartan', dose: '1 viên' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planUnparsed.recommendations.some((r) => r.drugId === 'finerenone' && r.action === 'DEFER')).toBe(true);
  });

  it('ckd R4-R1-02 & R3-02: phân tầng biến đổi ECG tăng kali nội trú & ngoại trú theo UKKA 2022 và BYT 2024', () => {
    // 1) Nội trú ecgHyperkalemia: true nhưng thiếu K+ -> DEFER xét nghiệm POC khí máu, không phát Insulin-Glucose mù
    const planMissingK = evaluate(
      {
        id: 'r4_in_ecg_nok',
        name: 'Inpatient ECG No K',
        age: 65,
        sex: 'male',
        weight: 68,
        sbp: 128,
        dbp: 78,
        scr: 250,
        k: undefined,
        conditions: { ckd: true },
        customInputs: { ecgHyperkalemia: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseIn
    );
    expect(planMissingK.recommendations.some((r) => r.id === 'rec_ckd_hyperkalemia_ecg_missing_k' && r.action === 'DEFER')).toBe(true);
    expect(planMissingK.recommendations.some((r) => r.id === 'rec_ckd_hyperkalemia_severe_bundle')).toBe(false);

    // 2) Nội trú ecgHyperkalemia: true nhưng K+ = 4.2 -> MONITOR cảnh báo loại trừ STEMI, không truyền Insulin-Glucose/Ca2+
    const planNormoK = evaluate(
      {
        id: 'r4_in_ecg_k42',
        name: 'Inpatient ECG K4.2',
        age: 65,
        sex: 'male',
        weight: 68,
        sbp: 128,
        dbp: 78,
        scr: 250,
        k: 4.2,
        conditions: { ckd: true },
        customInputs: { ecgHyperkalemia: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseIn
    );
    expect(planNormoK.recommendations.some((r) => r.id === 'rec_ckd_hyperkalemia_ecg_normokalemia_alert' && r.action === 'MONITOR')).toBe(true);
    expect(planNormoK.recommendations.some((r) => r.id === 'rec_ckd_hyperkalemia_severe_bundle')).toBe(false);

    // 3) Nội trú K+ = 6.7 KHÔNG có biến đổi ECG ở INTL -> Step 1 KHÔNG tiêm thường quy Canxi TM ngay; nhưng VN K+ = 7.2 -> tiêm ngay theo BYT (> 7.0)
    const planK67NoEcg = evaluate(
      {
        id: 'r4_in_k67_noecg',
        name: 'K6.7 No ECG',
        age: 65,
        sex: 'male',
        weight: 68,
        sbp: 128,
        dbp: 78,
        scr: 250,
        k: 6.7,
        conditions: { ckd: true },
        customInputs: { ecgHyperkalemia: false },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseIn
    );
    const bundle67 = planK67NoEcg.recommendations.find((r) => r.id === 'rec_ckd_hyperkalemia_severe_bundle');
    expect(bundle67?.rationale).toContain('KHÔNG tiêm thường quy Canxi tĩnh mạch ngay');

    const planVnK72 = evaluate(
      {
        id: 'r4_vn_k72',
        name: 'VN K7.2 No ECG',
        age: 65,
        sex: 'male',
        weight: 68,
        sbp: 128,
        dbp: 78,
        scr: 250,
        k: 7.2,
        conditions: { ckd: true },
        customInputs: { ecgHyperkalemia: false },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      { ...baseIn, profile: 'VN' }
    );
    expect(planVnK72.recommendations.find((r) => r.id === 'rec_ckd_hyperkalemia_severe_bundle')?.rationale).toContain('Bảo vệ màng cơ tim NGAY');

    // 4) Ngoại trú K+ = 5.4 kèm ecgHyperkalemia: true đang dùng Losartan -> REFER cấp cứu + HOLD Losartan, không kê K-binder ngoại trú
    const planOutEcg = evaluate(
      {
        id: 'r4_out_k54_ecg',
        name: 'Outpatient K5.4 ECG',
        age: 63,
        sex: 'female',
        weight: 58,
        sbp: 132,
        dbp: 78,
        scr: 210,
        k: 5.4,
        uacr: 30,
        conditions: { ckd: true, htn: true },
        customInputs: { ecgHyperkalemia: true },
        currentMeds: [{ drugId: 'losartan', dose: 50, unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planOutEcg.recommendations.some((r) => r.id === 'rec_ckd_outpatient_hyperk_emergency_refer' && r.action === 'REFER')).toBe(true);
    expect(planOutEcg.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'HOLD')).toBe(true);
    expect(planOutEcg.recommendations.some((r) => r.drugId === 'patiromer' || r.drugId === 'sodium_zirconium_cyclosilicate')).toBe(false);
  });

  it('ckd R4-R1-03, R1-04 & R3-08: mục tiêu huyết áp nới lỏng trên lọc máu / suy yếu / >= 85 tuổi và liều Lokelma ngày không lọc máu', () => {
    // BN chạy thận nhân tạo (onDialysis: true), HA 132/78 ở INTL, K+ = 5.4 đang dùng Losartan -> BP CONTINUE (không ép < 120), SZC 5 g ngày không lọc máu
    const planHd = evaluate(
      {
        id: 'r4_hd_bp_szc',
        name: 'HD BP & SZC',
        age: 62,
        sex: 'male',
        weight: 64,
        sbp: 132,
        dbp: 78,
        scr: 620,
        k: 5.4,
        conditions: { ckd: true, onDialysis: true, htn: true },
        currentMeds: [{ drugId: 'losartan', dose: 50, unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    const bpHd = planHd.recommendations.find((r) => r.id === 'rec_ckd_bp_target');
    expect(bpHd?.action).toBe('CONTINUE');
    const szcHd = planHd.recommendations.find((r) => r.drugId === 'sodium_zirconium_cyclosilicate' && r.action === 'START');
    expect(szcHd).toBeDefined();
    expect(szcHd?.dose).toContain('5 g');
    expect(szcHd?.dose).toContain('ngày không lọc máu');
    expect(szcHd?.dose).not.toContain('3 lần/ngày');

    // BN 88 tuổi suy yếu (frailty: true), HA 134/76 ở INTL -> mục tiêu nới lỏng < 140/90 -> CONTINUE
    const planFrail = evaluate(
      {
        id: 'r4_frail_88',
        name: 'Frail 88yo',
        age: 88,
        sex: 'female',
        weight: 48,
        sbp: 134,
        dbp: 76,
        scr: 150,
        k: 4.3,
        uacr: 15,
        conditions: { ckd: true, frailty: true },
        currentMeds: [{ drugId: 'losartan', dose: 50, unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planFrail.recommendations.find((r) => r.id === 'rec_ckd_bp_target')?.action).toBe('CONTINUE');
  });

  it('ckd R4-R1-05, R1-06, R1-07, R1-09 & R2-05: Finerenone suy thượng thận / K+ 4.9 / CYP3A4 vừa, sàng lọc G1A1 bình thường, KFRE độc lập & Statin người trẻ / ghép thận', () => {
    // 1) G1A1 hoàn toàn bình thường (eGFR ~95, UACR 1.0, 55 tuổi, HA 124/76) -> KHÔNG gán Statin, KHÔNG ép HA < 120, KHÔNG Sick-day
    const planG1A1 = evaluate(
      {
        id: 'r4_normal_g1a1',
        name: 'Normal G1A1',
        age: 55,
        sex: 'male',
        weight: 70,
        sbp: 124,
        dbp: 76,
        scr: 72,
        k: 4.2,
        uacr: 1.0,
        conditions: { ckd: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planG1A1.recommendations.some((r) => r.drugId === 'atorvastatin')).toBe(false);
    expect(planG1A1.recommendations.some((r) => r.id === 'rec_ckd_bp_target')).toBe(false);
    expect(planG1A1.recommendations.some((r) => r.id === 'rec_ckd_sick_day_education')).toBe(false);

    // 2) Finerenone chống chỉ định suy thượng thận (adrenalInsufficiency: true) -> STOP nếu đang dùng & AVOID nếu chưa dùng
    const planAdrenal = evaluate(
      {
        id: 'r4_fine_adrenal',
        name: 'Adrenal Fine',
        age: 59,
        sex: 'female',
        weight: 60,
        sbp: 126,
        dbp: 76,
        scr: 135,
        k: 4.5,
        uacr: 40,
        conditions: { ckd: true, dm: true, adrenalInsufficiency: true },
        currentMeds: [
          { drugId: 'losartan', dose: 100, unit: 'mg' },
          { drugId: 'finerenone', dose: 10, unit: 'mg' },
        ],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planAdrenal.recommendations.some((r) => r.drugId === 'finerenone' && r.action === 'STOP')).toBe(true);

    // 3) Finerenone với K+ = 4.9 mmol/L kèm diltiazem -> CONSIDER (không START tự động) + cảnh báo CYP3A4 vừa
    const planFineBorder = evaluate(
      {
        id: 'r4_fine_k49',
        name: 'Fine K4.9 Diltiazem',
        age: 61,
        sex: 'male',
        weight: 72,
        sbp: 128,
        dbp: 78,
        scr: 140,
        k: 4.9,
        uacr: 45,
        conditions: { ckd: true, dm: true },
        currentMeds: [
          { drugId: 'losartan', dose: 100, unit: 'mg' },
          { drugId: 'diltiazem', dose: 120, unit: 'mg' },
        ],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    const fineRec = planFineBorder.recommendations.find((r) => r.drugId === 'finerenone');
    expect(fineRec?.action).toBe('CONSIDER');
    expect(fineRec?.rationale).toContain('CYP3A4');

    // 4) KFRE tính toán trực tiếp ở G3bA2 (42 tuổi, nguy cơ mạch vành 10 năm 12.5% -> Statin START Rec 3.15.1.3 & KFRE REFER)
    const planYoungKfre = evaluate(
      {
        id: 'r4_young_kfre',
        name: 'Young CKD KFRE & Statin',
        age: 42,
        sex: 'male',
        weight: 74,
        sbp: 126,
        dbp: 76,
        scr: 210,
        k: 4.4,
        uacr: 25,
        conditions: { ckd: true },
        customInputs: { statin10yCvRiskPct: 12.5 },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planYoungKfre.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(true);
    expect(planYoungKfre.recommendations.some((r) => r.id === 'rec_ckd_refer_specialist' && r.rationale.includes('KFRE'))).toBe(true);

    // 5) Ghép thận (kidneyTransplant: true, 36 tuổi) -> Statin CONSIDER (ESC 2026 Table 10)
    const planTx = evaluate(
      {
        id: 'r4_tx_statin',
        name: 'Kidney Transplant 36yo',
        age: 36,
        sex: 'female',
        weight: 56,
        sbp: 124,
        dbp: 76,
        scr: 115,
        k: 4.2,
        uacr: 5,
        conditions: { ckd: true, kidneyTransplant: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planTx.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'CONSIDER')).toBe(true);
  });

  it('ckd R4-R2-01, R2-03, R2-04, R2-06, R3-01..12: FDC Metformin, cho con bú, dị ứng, suy gan, hẹp ĐM thận, tăng SCr > 30%, Rosuvastatin G4, cản quang & toan nặng', () => {
    // 1) FDC empagliflozin_metformin ở CKD G4 (scr 260 -> eGFR ~22) -> STOP FDC + START empagliflozin đơn chất
    const planFdcMet = evaluate(
      {
        id: 'r4_fdc_empamet',
        name: 'FDC EmpaMet G4',
        age: 64,
        sex: 'male',
        weight: 70,
        sbp: 128,
        dbp: 78,
        scr: 260,
        k: 4.5,
        uacr: 35,
        conditions: { ckd: true, dm: true },
        currentMeds: [{ drugId: 'empagliflozin_metformin', dose: '10/1000', unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planFdcMet.recommendations.some((r) => r.drugId === 'empagliflozin_metformin' && r.action === 'STOP')).toBe(true);
    expect(planFdcMet.recommendations.some((r) => r.drugId === 'empagliflozin' && r.action === 'START')).toBe(true);

    // 2) Phụ nữ đang cho con bú (breastfeeding: true) có CKD + đạm niệu -> START enalapril, AVOID dapagliflozin & atorvastatin
    const planLact = evaluate(
      {
        id: 'r4_lactation',
        name: 'Breastfeeding CKD',
        age: 32,
        sex: 'female',
        weight: 56,
        sbp: 138,
        dbp: 86,
        scr: 135,
        k: 4.2,
        uacr: 45,
        conditions: { ckd: true, dm: true, htn: true, breastfeeding: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planLact.recommendations.some((r) => r.drugId === 'enalapril' && r.action === 'START')).toBe(true);
    expect(planLact.recommendations.some((r) => r.drugId === 'dapagliflozin' && r.action === 'AVOID')).toBe(true);

    // 3) Tăng SCr > 30% sau dùng Losartan (baselineScr: 70 -> scr: 95, +35.7%, không đạt ngưỡng AKI +26.5 hay 1.5x) + Rosuvastatin 40 mg ở G4
    const planScrRise = evaluate(
      {
        id: 'r4_scr_rise_35pct',
        name: 'SCr Rise 35%',
        age: 63,
        sex: 'male',
        weight: 70,
        sbp: 136,
        dbp: 82,
        scr: 95,
        k: 4.5,
        uacr: 40,
        conditions: { ckd: true, dm: true },
        customInputs: { baselineScr: 70 },
        currentMeds: [{ drugId: 'losartan', dose: 50, unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planScrRise.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'HOLD')).toBe(true);
    expect(planScrRise.recommendations.some((r) => r.drugId === 'losartan' && r.action === 'UPTITRATE')).toBe(false);
    expect(planScrRise.recommendations.some((r) => r.drugId === 'finerenone' && r.action === 'DEFER')).toBe(true);

    const planRosu40 = evaluate(
      {
        id: 'r4_rosu40_g4',
        name: 'Rosu 40 G4',
        age: 66,
        sex: 'male',
        weight: 68,
        sbp: 126,
        dbp: 76,
        scr: 255,
        k: 4.4,
        uacr: 20,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'rosuvastatin', dose: 40, unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    const rosuRed = planRosu40.recommendations.find((r) => r.drugId === 'rosuvastatin' && r.action === 'REDUCE');
    expect(rosuRed?.dose).toContain('10 mg');

    // 4) Toan chuyển hóa nặng (HCO3- = 10) đang dùng dapagliflozin + metformin -> HOLD cả hai; và nội trú HCO3- = 14 -> phát xử trí toan nội viện
    const planSevereAcidMeds = evaluate(
      {
        id: 'r4_acid_hco3_10',
        name: 'Severe Acidosis Meds',
        age: 60,
        sex: 'female',
        weight: 60,
        sbp: 124,
        dbp: 76,
        scr: 160,
        k: 4.6,
        hco3: 10,
        uacr: 30,
        conditions: { ckd: true, dm: true },
        currentMeds: [
          { drugId: 'dapagliflozin', dose: 10, unit: 'mg' },
          { drugId: 'metformin', dose: 1000, unit: 'mg' },
        ],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planSevereAcidMeds.recommendations.some((r) => r.drugId === 'dapagliflozin' && r.action === 'HOLD')).toBe(true);
    expect(planSevereAcidMeds.recommendations.some((r) => r.drugId === 'metformin' && r.action === 'HOLD')).toBe(true);

    const planInAcid14 = evaluate(
      {
        id: 'r4_in_acid_14',
        name: 'Inpatient HCO3 14',
        age: 65,
        sex: 'male',
        weight: 68,
        sbp: 126,
        dbp: 76,
        scr: 210,
        k: 4.5,
        hco3: 14,
        conditions: { ckd: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseIn
    );
    expect(planInAcid14.recommendations.some((r) => r.id === 'rec_ckd_inpatient_acidosis_moderate')).toBe(true);

    // 5) Ngoại trú sắp chụp cản quang (contrastPlanned: true, eGFR ~38) đang dùng sitagliptin_metformin -> CI-AKI CONSIDER + HOLD sitagliptin_metformin + DEFER SGLT2i
    const planOutContrast = evaluate(
      {
        id: 'r4_out_contrast',
        name: 'Outpatient Contrast Metformin',
        age: 64,
        sex: 'male',
        weight: 70,
        sbp: 128,
        dbp: 78,
        scr: 170,
        k: 4.4,
        uacr: 35,
        conditions: { ckd: true, dm: true },
        customInputs: { contrastPlanned: true },
        currentMeds: [{ drugId: 'sitagliptin_metformin', dose: '50/1000', unit: 'mg' }],
        selectedModules: ['ckd'],
      },
      baseOut
    );
    expect(planOutContrast.recommendations.some((r) => r.id === 'rec_ckd_ci_aki_bundle')).toBe(true);
    expect(planOutContrast.recommendations.some((r) => r.drugId === 'sitagliptin_metformin' && r.action === 'HOLD')).toBe(true);
    expect(planOutContrast.recommendations.some((r) => r.drugId === 'dapagliflozin' && r.action === 'DEFER')).toBe(true);
  });
});
