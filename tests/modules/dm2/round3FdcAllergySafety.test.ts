/**
 * GDMT-VN Module Đái tháo đường típ 2 (dm2) - Kiểm thử Hồi quy Vòng 3: Bóc tách FDC, Suy gan Child-Pugh, Cho con bú, Chu phẫu & Dị ứng
 * Phân quyền: Agent F4
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { parseInsulinMedDailyUnits, parseMedDailyDoseMg } from '../../../src/modules/dm2/helpers.drugs';
import type { Patient, Settings } from '../../../src/engine/types';

const OUTPATIENT_SETTINGS: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct'
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false
};

describe('GDMT-VN [dm2] Round 3 Regression: FDC Deconstruction, Hepatic Child-Pugh, Lactation, Foot Ulcer & Allergies', () => {
  it('P01, P04, P10 & S68: Bóc tách viên/bút phối hợp FDC (Actoplus Met, Janumet, Soliqua, Synjardy) bảo tồn hoạt chất an toàn đơn chất', () => {
    // 1. P01: Actoplus Met (Pioglitazone + Metformin) trên Suy tim -> STOP FDC Actoplus Met, START Metformin đơn chất
    const actoplusHf: Patient = {
      age: 62,
      sex: 'male',
      weight: 74,
      height: 170,
      sbp: 126,
      dbp: 76,
      hr: 78,
      scr: 92,
      k: 4.3,
      glucose: 8.6,
      hba1c: 7.8,
      lvef: 36,
      conditions: { dm: true, hf: true },
      currentMeds: [{ drugId: 'actoplus_met', name: 'Actoplus Met 15/850 mg', dose: 1, unit: 'viên', freq: '2 lần/ngày' }],
      selectedModules: ['dm2']
    };
    const p1 = evaluate(actoplusHf, OUTPATIENT_SETTINGS);
    expect(p1.recommendations.find((r) => r.drugId === 'actoplus_met')?.action).toBe('STOP');
    expect(p1.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('START');

    // 2. P04: Janumet (Sitagliptin + Metformin) khi khởi trị GLP-1 RA do ASCVD -> STOP Janumet, START Metformin đơn chất
    const janumetAscvd: Patient = {
      age: 60,
      sex: 'male',
      weight: 78,
      height: 168,
      sbp: 132,
      dbp: 80,
      hr: 74,
      scr: 88,
      k: 4.2,
      glucose: 9.2,
      hba1c: 8.1,
      conditions: { dm: true, ascvd: true },
      currentMeds: [{ drugId: 'janumet', name: 'Janumet 50/1000 mg', dose: 1, unit: 'viên', freq: '2 lần/ngày' }],
      selectedModules: ['dm2']
    };
    const p2 = evaluate(janumetAscvd, OUTPATIENT_SETTINGS);
    expect(p2.recommendations.find((r) => r.drugId === 'janumet')?.action).toBe('STOP');
    expect(p2.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('START');
    expect(p2.recommendations.some((r) => ['semaglutide', 'liraglutide', 'dulaglutide'].includes(r.drugId || '') && r.action === 'START')).toBe(true);

    // 3. P10: Soliqua (Insulin Glargine + Lixisenatide) ở eGFR < 30 -> STOP Soliqua, START Insulin Glargine đơn chất
    const soliquaLowEgfr: Patient = {
      age: 65,
      sex: 'female',
      weight: 64,
      height: 158,
      sbp: 136,
      dbp: 78,
      hr: 76,
      scr: 225, // eGFR ~ 20-22
      k: 4.6,
      glucose: 9.5,
      hba1c: 8.0,
      conditions: { dm: true, ckd: true },
      currentMeds: [{ drugId: 'soliqua', name: 'Soliqua 100/33', dose: 24, unit: 'đơn vị' }],
      selectedModules: ['dm2']
    };
    const p3 = evaluate(soliquaLowEgfr, OUTPATIENT_SETTINGS);
    expect(p3.recommendations.find((r) => r.drugId === 'soliqua')?.action).toBe('STOP');
    expect(p3.recommendations.find((r) => r.drugId === 'insulin_glargine')?.action).toBe('START');

    // 4. S68: Synjardy (Empagliflozin + Metformin) trước mổ chương trình -> HOLD Synjardy 3 ngày trước mổ + DEFER Metformin đơn chất tới sau mổ
    const synjardyPeriop: Patient = {
      age: 58,
      sex: 'male',
      weight: 75,
      height: 170,
      sbp: 128,
      dbp: 78,
      hr: 74,
      scr: 85,
      k: 4.2,
      glucose: 8.2,
      hba1c: 7.4,
      conditions: { dm: true },
      currentMeds: [{ drugId: 'synjardy', name: 'Synjardy 12.5/1000 mg', dose: 1, unit: 'viên', freq: '2 lần/ngày' }],
      selectedModules: ['dm2'],
      customInputs: { plannedSurgery: true }
    };
    const p4 = evaluate(synjardyPeriop, OUTPATIENT_SETTINGS);
    const holdSynjardy = p4.recommendations.find((r) => r.drugId === 'synjardy');
    expect(holdSynjardy?.action).toBe('HOLD');
    expect(holdSynjardy?.dose).toBeUndefined();
    const deferMet = p4.recommendations.find((r) => r.drugId === 'metformin');
    expect(deferMet?.action).toBe('DEFER');
    expect(deferMet?.dose).toBeUndefined();
  });

  it('Phát hiện trùng lặp 2 thuốc cùng nhóm Sulfonylurea (Amaryl + Daonil) và trùng lặp thành phần Metformin + Janumet', () => {
    const dupSuAndMet: Patient = {
      age: 59,
      sex: 'male',
      weight: 72,
      height: 168,
      sbp: 130,
      dbp: 80,
      hr: 76,
      scr: 84,
      k: 4.3,
      glucose: 9.0,
      hba1c: 7.8,
      conditions: { dm: true },
      currentMeds: [
        { drugId: 'glimepiride', name: 'Amaryl', dose: 2, unit: 'mg' },
        { drugId: 'glibenclamide', name: 'Daonil', dose: 5, unit: 'mg' },
        { drugId: 'metformin', name: 'Glucophage', dose: 1000, unit: 'mg' },
        { drugId: 'janumet', name: 'Janumet 50/1000', dose: 1, unit: 'viên' }
      ],
      selectedModules: ['dm2']
    };

    const plan = evaluate(dupSuAndMet, OUTPATIENT_SETTINGS);
    expect(plan.recommendations.find((r) => r.drugId === 'glibenclamide')?.action).toBe('STOP');
    expect(
      plan.recommendations.some(
        (r) => r.id === 'rec_dm2_duplicate_metformin_stop' && r.action === 'STOP'
      )
    ).toBe(true);
  });

  it('S61 & S62: Phân tầng Suy gan theo Child-Pugh A (cho phép Metformin/SGLT2i, ngừng Acarbose/Vildagliptin) vs Child-Pugh C (STOP thuốc viên, khởi Insulin)', () => {
    const childPughA: Patient = {
      age: 56,
      sex: 'male',
      weight: 74,
      height: 169,
      sbp: 128,
      dbp: 78,
      hr: 74,
      scr: 82,
      k: 4.2,
      glucose: 8.8,
      hba1c: 7.6,
      conditions: { dm: true, cirrhosis: true },
      currentMeds: [
        { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg' },
        { drugId: 'acarbose', name: 'Glucobay', dose: 50, unit: 'mg' },
        { drugId: 'vildagliptin', name: 'Galvus', dose: 50, unit: 'mg' }
      ],
      selectedModules: ['dm2'],
      customInputs: { childPugh: 'A', altUlnTimes: 1.4 }
    };

    const planA = evaluate(childPughA, OUTPATIENT_SETTINGS);
    expect(planA.recommendations.find((r) => r.drugId === 'acarbose')?.action).toBe('STOP');
    expect(planA.recommendations.find((r) => r.drugId === 'vildagliptin')?.action).toBe('STOP');
    expect(planA.recommendations.find((r) => r.drugId === 'metformin')?.action).not.toBe('STOP');

    const childPughC: Patient = {
      ...childPughA,
      glucose: 10.6,
      hba1c: 8.4,
      conditions: { dm: true, decompensatedCirrhosis: true },
      currentMeds: [
        { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg' },
        { drugId: 'dapagliflozin', name: 'Forxiga', dose: 10, unit: 'mg' },
        { drugId: 'gliclazide', name: 'Diamicron MR', dose: 60, unit: 'mg' }
      ],
      customInputs: { childPugh: 'C', altUlnTimes: 2.2 }
    };

    const planC = evaluate(childPughC, OUTPATIENT_SETTINGS);
    expect(planC.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('STOP');
    expect(planC.recommendations.find((r) => r.drugId === 'dapagliflozin')?.action).toBe('STOP');
    expect(planC.recommendations.find((r) => r.drugId === 'gliclazide')?.action).toBe('STOP');
    expect(planC.recommendations.find((r) => r.drugId === 'insulin_glargine')?.action).toBe('START');
  });

  it('An toàn đặc thù: Cho con bú, Loét bàn chân hoạt động (Canagliflozin STOP), Ung thư bàng quang, Liệt dạ dày, GLP-1 trước mổ & Tránh thai Tirzepatide', () => {
    // 1. Cho con bú: STOP Dapagliflozin & Semaglutide, cho phép Metformin / Insulin
    const lactationPlan = evaluate(
      {
        age: 31,
        sex: 'female',
        weight: 60,
        height: 160,
        sbp: 116,
        dbp: 72,
        hr: 76,
        scr: 68,
        k: 4.1,
        glucose: 8.9,
        hba1c: 7.7,
        conditions: { dm: true, breastfeeding: true },
        currentMeds: [
          { drugId: 'dapagliflozin', name: 'Forxiga', dose: 10, unit: 'mg' },
          { drugId: 'semaglutide', name: 'Ozempic', dose: 0.5, unit: 'mg' },
          { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg' }
        ],
        selectedModules: ['dm2']
      },
      OUTPATIENT_SETTINGS
    );
    expect(lactationPlan.recommendations.find((r) => r.drugId === 'dapagliflozin')?.action).toBe('STOP');
    expect(lactationPlan.recommendations.find((r) => r.drugId === 'semaglutide')?.action).toBe('STOP');
    expect(lactationPlan.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('CONTINUE');

    // 2. Loét bàn chân hoạt động (kể cả không có HF/CKD) + Ung thư bàng quang hoạt động + Liệt dạ dày nặng
    const footBladderGastroPlan = evaluate(
      {
        age: 63,
        sex: 'male',
        weight: 76,
        height: 170,
        sbp: 130,
        dbp: 80,
        hr: 78,
        scr: 86,
        k: 4.3,
        glucose: 9.4,
        hba1c: 8.1,
        conditions: {
          dm: true,
          ascvd: true,
          activeFootUlcer: true,
          activeBladderCancer: true,
          severeGastroparesis: true
        },
        currentMeds: [
          { drugId: 'canagliflozin', name: 'Invokana', dose: 100, unit: 'mg' },
          { drugId: 'pioglitazone', name: 'Actos', dose: 30, unit: 'mg' },
          { drugId: 'semaglutide', name: 'Ozempic', dose: 0.5, unit: 'mg' }
        ],
        selectedModules: ['dm2']
      },
      OUTPATIENT_SETTINGS
    );
    expect(footBladderGastroPlan.recommendations.find((r) => r.drugId === 'canagliflozin')?.action).toBe('STOP');
    expect(footBladderGastroPlan.recommendations.find((r) => r.drugId === 'pioglitazone')?.action).toBe('STOP');
    expect(footBladderGastroPlan.recommendations.find((r) => r.drugId === 'semaglutide')?.action).toBe('STOP');

    // 3. Tiền phẫu có kế hoạch: DEFER khởi mới GLP-1 RA; nếu đang dùng GLP-1 RA cảnh báo nguy cơ hít sặc
    const periopGlp1Defer = evaluate(
      {
        age: 58,
        sex: 'male',
        weight: 85,
        height: 170,
        sbp: 132,
        dbp: 82,
        hr: 76,
        scr: 82,
        k: 4.2,
        glucose: 8.5,
        hba1c: 7.8,
        conditions: { dm: true, ascvd: true },
        currentMeds: [],
        selectedModules: ['dm2'],
        customInputs: { plannedSurgery: true }
      },
      OUTPATIENT_SETTINGS
    );
    const glp1PeriopRec = periopGlp1Defer.recommendations.find((r) => r.id === 'rec_dm2_glp1_cardiorenal');
    expect(glp1PeriopRec?.action).toBe('DEFER');
    expect(glp1PeriopRec?.dose).toBeUndefined();

    // 4. Tirzepatide trên phụ nữ dùng thuốc tránh thai đường uống + bệnh võng mạc -> Cảnh báo 4 tuần tránh thai rào chắn & theo dõi đáy mắt
    const tirzeOcpPlan = evaluate(
      {
        age: 36,
        sex: 'female',
        weight: 86,
        height: 160,
        sbp: 124,
        dbp: 78,
        hr: 80,
        scr: 70,
        k: 4.2,
        glucose: 9.6,
        hba1c: 8.4,
        lvef: 58,
        conditions: { dm: true, hf: true, diabeticRetinopathy: true },
        allergies: ['semaglutide'],
        currentMeds: [{ drugId: 'metformin', name: 'Metformin', dose: 2000, unit: 'mg' }],
        selectedModules: ['dm2'],
        customInputs: { oralContraceptive: true }
      },
      OUTPATIENT_SETTINGS
    );
    const tirzeRec = tirzeOcpPlan.recommendations.find((r) => r.drugId === 'tirzepatide');
    expect(tirzeRec?.action).toBe('START');
    expect(tirzeRec?.warnings?.some((w) => w.includes('4 tuần'))).toBe(true);
    expect(tirzeRec?.warnings?.some((w) => w.toLowerCase().includes('võng mạc'))).toBe(true);
  });

  it('Dị ứng thuốc & Tách liều chuỗi "sáng tối": STOP thuốc đang dị ứng, chọn hoạt chất thay thế không dị ứng và tính chuẩn 1000 mg x 2 = 2000 mg/ngày', () => {
    const allergyAndBidPlan = evaluate(
      {
        age: 61,
        sex: 'male',
        weight: 75,
        height: 170,
        sbp: 128,
        dbp: 78,
        hr: 74,
        scr: 165, // eGFR ~ 40 (CKD G3b) -> Metformin 2000 mg cần REDUCE xuống <= 1000 mg
        k: 4.4,
        glucose: 9.1,
        hba1c: 7.9,
        uacr: 25,
        conditions: { dm: true, ckd: true, ascvd: true },
        allergies: ['dapagliflozin', 'semaglutide', 'tirzepatide'],
        currentMeds: [
          { drugId: 'dapagliflozin', name: 'Forxiga', dose: 10, unit: 'mg' },
          { drugId: 'metformin', name: 'Glucophage', dose: '1000 mg sáng tối', unit: 'mg' },
          { drugId: 'insulin_detemir', name: 'Levemir', dose: '14 đơn vị sáng tối', unit: 'đơn vị' }
        ],
        selectedModules: ['dm2']
      },
      OUTPATIENT_SETTINGS
    );

    expect(allergyAndBidPlan.recommendations.find((r) => r.drugId === 'dapagliflozin')?.action).toBe('STOP');
    expect(allergyAndBidPlan.recommendations.find((r) => r.drugId === 'empagliflozin')?.action).toBe('START');
    expect(allergyAndBidPlan.recommendations.find((r) => r.drugId === 'semaglutide')).toBeUndefined();
    expect(allergyAndBidPlan.recommendations.find((r) => r.drugId === 'tirzepatide')).toBeUndefined();
    expect(
      allergyAndBidPlan.recommendations.some(
        (r) => ['liraglutide', 'dulaglutide'].includes(r.drugId || '') && r.action === 'START'
      )
    ).toBe(true);

    // "1000 mg sáng tối" (cách nhau khoảng trắng) được nhận diện là 2000 mg/ngày -> REDUCE khi eGFR < 45
    expect(allergyAndBidPlan.recommendations.find((r) => r.drugId === 'metformin')?.action).toBe('REDUCE');

    // "14 đơn vị sáng tối" Levemir được nhận diện tổng liều nền 28 đơn vị/ngày
    expect(parseMedDailyDoseMg({ drugId: 'metformin', dose: '1000 mg sáng tối', unit: 'mg' }, 'metformin')).toBe(2000);
    expect(parseInsulinMedDailyUnits({ drugId: 'insulin_detemir', dose: '14 đơn vị sáng tối', unit: 'đơn vị' })).toBe(28);
    const detemirRec = allergyAndBidPlan.recommendations.find((r) => r.drugId === 'insulin_detemir');
    expect(detemirRec?.action).toBe('CONTINUE');
    expect(detemirRec?.dose).toContain('14 đơn vị sáng tối');
  });
});
