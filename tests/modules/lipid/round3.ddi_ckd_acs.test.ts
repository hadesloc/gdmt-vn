/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Round 3 Regression Suite 2:
 * DDI Black-Holes & New Matrix (Erythromycin, Paxlovid, Darolutamide, Regorafenib, Atazanavir/r,
 * Lovastatin, Fluvastatin, Simvastatin 60 + Ticagrelor), CKD/Dialysis Caps, Inpatient ACS DDI Rescues,
 * Non-ACS Inpatient Stroke/PAD, Acute HTG Pancreatitis ICU & Residual IPE Gating
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient } from '../../../src/engine/types';
import { lipidPresets } from '../../../src/modules/lipid/presets';
import { defaultSettings } from './_fixtures';

describe('lipid_round3_ddi_ckd_acs: Kiểm thử hồi quy Vòng 3 — Ma trận DDI mở rộng, lọc máu/CKD, ACS nội viện có DDI & viêm tụy cấp ICU', () => {
  it('1. Khắc phục các hố đen DDI & thiếu liều (BH_01..04, E63, E68, ROSU_01..04, Lovastatin, Fluvastatin)', () => {
    // 1a. Simvastatin 60 mg + Ticagrelor -> REDUCE/STOP/SWITCH, tuyệt đối không CONTINUE (E63)
    const simva60TicagPlan = evaluate(
      {
        age: 63,
        sex: 'male',
        scr: 84,
        ldl: 1.2,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'simvastatin', dose: 60, unit: 'mg' },
          { drugId: 'ticagrelor', dose: 90, unit: 'mg', freq: 'BID' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      simva60TicagPlan.recommendations.some(
        (r) => r.drugId === 'simvastatin' && (r.action === 'STOP' || r.action === 'REDUCE')
      )
    ).toBe(true);
    expect(simva60TicagPlan.recommendations.some((r) => r.drugId === 'simvastatin' && r.action === 'CONTINUE')).toBe(false);

    // 1b. Atorvastatin 80 mg + Erythromycin (cả khi đạt đích & chưa đạt đích) -> REDUCE <= 20 mg, không rơi vào hố đen (BH_01, BH_02)
    for (const ldlVal of [1.2, 2.5]) {
      const atorvaEryPlan = evaluate(
        {
          age: 61,
          sex: 'male',
          scr: 82,
          ldl: ldlVal,
          conditions: { ascvd: true },
          currentMeds: [
            { drugId: 'atorvastatin', dose: 80, unit: 'mg' },
            { drugId: 'erythromycin', dose: 500, unit: 'mg' }
          ],
          selectedModules: ['lipid']
        },
        defaultSettings
      );
      expect(atorvaEryPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'REDUCE')).toBe(true);
      expect(atorvaEryPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'CONTINUE')).toBe(false);
    }

    // 1c. Pravastatin thiếu dose khi eGFR < 30 hoặc + Clarithromycin -> Bắt buộc phát cảnh báo REDUCE trần 40 mg (BH_03, BH_04)
    const pravaMissingDosePlan = evaluate(
      {
        age: 74,
        sex: 'female',
        scr: 235,
        ldl: 1.3,
        conditions: { ascvd: true, ckd: true },
        currentMeds: [{ drugId: 'pravastatin' }, { drugId: 'clarithromycin', dose: 500, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(pravaMissingDosePlan.recommendations.some((r) => r.drugId === 'pravastatin' && r.action === 'REDUCE')).toBe(true);

    // 1d. Rosuvastatin 40 mg + Paxlovid (nirmatrelvir_ritonavir <= 10 mg), + Darolutamide (<= 5 mg), + Regorafenib (<= 10 mg), + Sofosbuvir/velpatasvir/voxilaprevir (HOLD)
    const rosuPaxlovidPlan = evaluate(
      {
        age: 66,
        sex: 'male',
        scr: 80,
        ldl: 1.2,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'rosuvastatin', dose: 40, unit: 'mg' },
          { drugId: 'nirmatrelvir_ritonavir', dose: 300, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const paxRec = rosuPaxlovidPlan.recommendations.find((r) => r.drugId === 'rosuvastatin' && r.action === 'REDUCE');
    expect(paxRec).toBeDefined();
    expect(paxRec?.dose).toMatch(/10 mg/);

    const rosuDaroPlan = evaluate(
      {
        age: 71,
        sex: 'male',
        scr: 84,
        ldl: 1.3,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'rosuvastatin', dose: 20, unit: 'mg' },
          { drugId: 'darolutamide', dose: 600, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    const daroRec = rosuDaroPlan.recommendations.find((r) => r.drugId === 'rosuvastatin' && r.action === 'REDUCE');
    expect(daroRec).toBeDefined();
    expect(daroRec?.dose).toMatch(/5 mg/);

    const rosuVoxPlan = evaluate(
      {
        age: 58,
        sex: 'male',
        scr: 78,
        ldl: 1.4,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'rosuvastatin', dose: 20, unit: 'mg' },
          { drugId: 'sofosbuvir_velpatasvir_voxilaprevir', dose: 400, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(rosuVoxPlan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'HOLD')).toBe(true);

    // 1e. Lovastatin + Clarithromycin (HOLD), Lovastatin 40 mg + Diltiazem (REDUCE <= 20 mg), Fluvastatin 80 mg + Cyclosporine (REDUCE <= 40 mg)
    const lovaClariPlan = evaluate(
      {
        age: 62,
        sex: 'female',
        scr: 74,
        ldl: 1.5,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'lovastatin', dose: 40, unit: 'mg' },
          { drugId: 'clarithromycin', dose: 500, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      lovaClariPlan.recommendations.some(
        (r) => r.drugId === 'lovastatin' && (r.action === 'STOP' || r.action === 'HOLD')
      )
    ).toBe(true);

    const fluvaCsAPlan = evaluate(
      {
        age: 55,
        sex: 'male',
        scr: 110,
        ldl: 1.6,
        conditions: { ascvd: true, kidneyTransplant: true },
        currentMeds: [
          { drugId: 'fluvastatin', dose: 80, unit: 'mg' },
          { drugId: 'cyclosporine', dose: 100, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(fluvaCsAPlan.recommendations.some((r) => r.drugId === 'fluvastatin' && r.action === 'REDUCE')).toBe(true);
  });

  it('2. An toàn lọc máu chu kỳ: Trần Rosuvastatin <= 10 mg (kể cả khi SCr sau lọc thấp), không ép tăng liều Statin ở ASCVD lọc máu & STOP Bempedoic acid (C40, C45, G90, 5b)', () => {
    // 2a. Lọc máu chu kỳ có SCr sau lọc giả tạo thấp (75 µmol/L) đang dùng Rosuvastatin 40 mg -> Bắt buộc REDUCE <= 10 mg (C40)
    const dialysisRosu40Plan = evaluate(
      {
        age: 65,
        sex: 'male',
        scr: 75,
        ldl: 1.3,
        conditions: { ascvd: true, ckd: true, onDialysis: true },
        currentMeds: [{ drugId: 'rosuvastatin', dose: 40, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(dialysisRosu40Plan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'REDUCE')).toBe(true);
    expect(dialysisRosu40Plan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'CONTINUE')).toBe(false);

    // 2b. ASCVD đang lọc máu chu kỳ + đang dùng Atorvastatin 20 mg, LDL = 2.4 -> CONTINUE Atorvastatin + CONSIDER Ezetimibe, KHÔNG UPTITRATE lên 40–80 mg (5b)
    const dialysisAtorva20Plan = evaluate(
      {
        age: 68,
        sex: 'female',
        scr: 480,
        ldl: 2.4,
        conditions: { ascvd: true, ckd: true, onDialysis: true },
        currentMeds: [{ drugId: 'atorvastatin', dose: 20, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(dialysisAtorva20Plan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'UPTITRATE')).toBe(false);
    expect(dialysisAtorva20Plan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'CONTINUE')).toBe(true);
    expect(dialysisAtorva20Plan.recommendations.some((r) => r.drugId === 'ezetimibe' && r.action === 'CONSIDER')).toBe(true);

    // 2c. Lọc máu chu kỳ đang dùng Bempedoic acid -> STOP Bempedoic acid (C45, G90)
    const dialysisBempPlan = evaluate(
      {
        age: 67,
        sex: 'male',
        scr: 510,
        ldl: 2.5,
        conditions: { ascvd: true, ckd: true, onDialysis: true, statinIntolerance: true },
        currentMeds: [{ drugId: 'bempedoic_acid', dose: 180, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(dialysisBempPlan.recommendations.some((r) => r.drugId === 'bempedoic_acid' && r.action === 'STOP')).toBe(true);
  });

  it('3. ACS nội viện có DDI nặng (B17 Simvastatin+Gemfibrozil, G92a Naive+Clarithromycin, G92b Atorvastatin+Clarithromycin) & Presets Vòng 3 (A06)', () => {
    const inptSettings = { ...defaultSettings, setting: 'inpatient' as const };

    // 3a. Preset 1 phải mang setting: 'inpatient' (A06) và Preset 4 phải sinh START bempedoic_acid trên INTL/US
    expect(lipidPresets[0].setting).toBe('inpatient');
    const preset1Plan = evaluate(lipidPresets[0].patient as Patient, {
      ...defaultSettings,
      setting: lipidPresets[0].setting ?? 'inpatient'
    });
    expect(preset1Plan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'START')).toBe(true);

    const preset4Plan = evaluate(lipidPresets[3].patient as Patient, defaultSettings);
    expect(preset4Plan.recommendations.some((r) => r.drugId === 'bempedoic_acid' && r.action === 'START')).toBe(true);

    // 3b. B17: STEMI < 24h đang dùng Simvastatin 20 mg + Gemfibrozil 600 mg -> STOP Gemfibrozil + SWITCH sang Atorvastatin 40–80 mg
    const b17Plan = evaluate(
      {
        age: 60,
        sex: 'male',
        scr: 85,
        ldl: 3.2,
        conditions: { ascvd: true, acuteAcsWithin24h: true },
        currentMeds: [
          { drugId: 'simvastatin', dose: 20, unit: 'mg' },
          { drugId: 'gemfibrozil', dose: 600, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      inptSettings
    );
    expect(b17Plan.recommendations.some((r) => r.drugId === 'gemfibrozil' && r.action === 'STOP')).toBe(true);
    expect(
      b17Plan.recommendations.some(
        (r) => r.drugId === 'atorvastatin' && r.action === 'SWITCH' && r.switchFrom === 'simvastatin'
      )
    ).toBe(true);

    // 3c. G92a: STEMI < 24h chưa dùng statin + đang dùng Clarithromycin -> Khởi trị Rosuvastatin 20–40 mg (không chuyển CYP3A4)
    const g92aPlan = evaluate(
      {
        age: 57,
        sex: 'male',
        scr: 82,
        ldl: 3.5,
        conditions: { ascvd: true, acuteAcsWithin24h: true },
        currentMeds: [{ drugId: 'clarithromycin', dose: 500, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      inptSettings
    );
    expect(g92aPlan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'START')).toBe(true);

    // 3d. G92b: STEMI < 24h đang dùng Atorvastatin 20 mg + Clarithromycin -> SWITCH sang Rosuvastatin 20–40 mg
    const g92bPlan = evaluate(
      {
        age: 62,
        sex: 'female',
        scr: 76,
        ldl: 2.9,
        conditions: { ascvd: true, acuteAcsWithin24h: true },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 20, unit: 'mg' },
          { drugId: 'clarithromycin', dose: 500, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      inptSettings
    );
    expect(
      g92bPlan.recommendations.some(
        (r) => r.drugId === 'rosuvastatin' && r.action === 'SWITCH' && r.switchFrom === 'atorvastatin'
      )
    ).toBe(true);
  });

  it('4. Nội viện không-ACS (đột quỵ thiếu máu não / PAD), Viêm tụy cấp do tăng TG (B20–B22, 8b) & chặn Icosapent ethyl khi đang HOLD/STOP Statin (B23–B26, E67)', () => {
    const inptSettings = { ...defaultSettings, setting: 'inpatient' as const };

    // 4a. Nội viện đột quỵ thiếu máu não đang dùng Simvastatin 20 mg, LDL = 2.6 -> SWITCH/UPTITRATE sang Statin cường độ cao + phối hợp Ezetimibe (7a, 7b)
    const strokeInptPlan = evaluate(
      {
        age: 66,
        sex: 'male',
        scr: 88,
        ldl: 2.6,
        conditions: { stroke: true },
        currentMeds: [{ drugId: 'simvastatin', dose: 20, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      inptSettings
    );
    expect(
      strokeInptPlan.recommendations.some(
        (r) => r.drugId === 'atorvastatin' && r.action === 'SWITCH' && r.switchFrom === 'simvastatin'
      )
    ).toBe(true);

    // 4b. Viêm tụy cấp ngoại trú -> REFER nhập viện cấp cứu; nội viện -> Phác đồ ICU NPO + dịch truyền + Insulin IV ± Plasmapheresis (kể cả khi đang có Fenofibrate nền)
    const outptPancreatitisPlan = evaluate(
      {
        age: 46,
        sex: 'male',
        scr: 90,
        ldl: 2.2,
        tg: 18.5,
        conditions: { acutePancreatitis: true, dm: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      outptPancreatitisPlan.recommendations.some(
        (r) => r.id === 'rec_lipid_outpt_acute_pancreatitis_refer' && r.action === 'REFER'
      )
    ).toBe(true);
    expect(
      outptPancreatitisPlan.recommendations.some((r) => r.drugId === 'fenofibrate' && r.action === 'START')
    ).toBe(false);

    const inptPancreatitisWithHomeFenoPlan = evaluate(
      {
        age: 48,
        sex: 'male',
        scr: 94,
        ldl: 2.1,
        tg: 22.0,
        conditions: { acutePancreatitis: true, dm: true },
        currentMeds: [
          { drugId: 'atorvastatin', dose: 40, unit: 'mg' },
          { drugId: 'fenofibrate', dose: 145, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      inptSettings
    );
    const icuRec = inptPancreatitisWithHomeFenoPlan.recommendations.find(
      (r) => r.id === 'rec_lipid_inpt_acute_pancreatitis_icu_protocol' && r.action === 'REFER'
    );
    expect(icuRec).toBeDefined();
    expect(icuRec?.rationale).toMatch(/NPO/i);
    expect(icuRec?.rationale).toMatch(/plasmapheresis/i);

    // 4c. Đang HOLD Statin vì CK = 12x ULN hoặc ALT = 4.5x ULN -> Không bao giờ gợi ý thêm Icosapent ethyl (B23, B24, E67)
    const rhabdoNoIpePlan = evaluate(
      {
        age: 60,
        sex: 'male',
        scr: 86,
        ldl: 1.3,
        tg: 2.8,
        conditions: { ascvd: true, dm: true },
        customInputs: { ckUlnTimes: 12 },
        currentMeds: [{ drugId: 'atorvastatin', dose: 40, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(rhabdoNoIpePlan.recommendations.some((r) => r.drugId === 'icosapent_ethyl')).toBe(false);
  });
});
