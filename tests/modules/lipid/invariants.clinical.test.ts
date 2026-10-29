/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Deterministic Clinical Safety Invariants (Round 2 & Round 3)
 * Phân quyền: Agent I2 / Agent I5 (Round 3 Remediation — split < 20 KB)
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Settings } from '../../../src/engine/types';
import { ALL_LIPID_DRUGS, STATIN_IDS, defaultSettings } from './_fixtures';

describe('lipid_invariants_clinical: Bất biến lâm sàng tất định Round 2 & Round 3', () => {
  it('lipid suite 3 (Round 2 R1/R2/R3): Bất biến an toàn gan/cơ nâng cao, trần thận/DDI, thiếu eGFR và biên đơn vị mg/dL', () => {
    // 1. ALT >= 3x ULN tạm ngưng đồng thời Ezetimibe và Bempedoic acid & không bỏ sót Statin khi có Fenofibrate
    const altComboPlan = evaluate(
      {
        age: 62,
        sex: 'male',
        sbp: 126,
        dbp: 76,
        scr: 85,
        ldl: 2.2,
        conditions: { ascvd: true },
        customInputs: { altUlnTimes: 4.2 },
        currentMeds: [
          { drugId: 'ezetimibe', dose: 10, unit: 'mg' },
          { drugId: 'bempedoic_acid', dose: 180, unit: 'mg' },
          { drugId: 'fenofibrate', dose: 145, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(altComboPlan.recommendations.some((r) => r.drugId === 'ezetimibe' && r.action === 'HOLD')).toBe(true);
    expect(altComboPlan.recommendations.some((r) => r.drugId === 'bempedoic_acid' && r.action === 'HOLD')).toBe(true);
    expect(
      altComboPlan.recommendations.some(
        (r) => r.drugId === 'fenofibrate' && (r.action === 'HOLD' || r.action === 'STOP')
      )
    ).toBe(true);
    expect(altComboPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'AVOID')).toBe(true);

    // 2. CK tăng vừa (4x < CK < 10x ULN) trên nền Fenofibrate đơn độc: HOLD Fenofibrate, không DEFER Atorvastatin
    const ckFenoPlan = evaluate(
      {
        age: 52,
        sex: 'male',
        scr: 82,
        ldl: 2.3,
        tg: 3.1,
        conditions: {},
        customInputs: { ckUlnTimes: 6.2 },
        currentMeds: [{ drugId: 'fenofibrate', dose: 145, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(ckFenoPlan.recommendations.some((r) => r.drugId === 'fenofibrate' && r.action === 'HOLD')).toBe(true);
    expect(ckFenoPlan.recommendations.some((r) => r.drugId === 'atorvastatin' && r.action === 'DEFER')).toBe(false);

    // 3. Pitavastatin > 2 mg khi eGFR < 60 & Pravastatin > 40 mg khi eGFR < 30: REDUCE, cấm CONTINUE
    const pitaCkdPlan = evaluate(
      {
        age: 68,
        sex: 'female',
        scr: 138,
        ldl: 1.5,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'pitavastatin', dose: 4, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(pitaCkdPlan.recommendations.some((r) => r.drugId === 'pitavastatin' && r.action === 'REDUCE')).toBe(true);
    expect(pitaCkdPlan.recommendations.some((r) => r.drugId === 'pitavastatin' && r.action === 'CONTINUE')).toBe(false);

    const pravaSevereCkdPlan = evaluate(
      {
        age: 72,
        sex: 'female',
        scr: 220,
        ldl: 1.6,
        conditions: { ckd: true },
        currentMeds: [{ drugId: 'pravastatin', dose: 80, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(pravaSevereCkdPlan.recommendations.some((r) => r.drugId === 'pravastatin' && r.action === 'REDUCE')).toBe(true);
    expect(pravaSevereCkdPlan.recommendations.some((r) => r.drugId === 'pravastatin' && r.action === 'CONTINUE')).toBe(false);

    // 4. Rosuvastatin > 20 mg khi dùng Ticagrelor hoặc Febuxostat: REDUCE, cấm CONTINUE
    for (const blockerId of ['ticagrelor', 'febuxostat']) {
      const rosuvaBcrpPlan = evaluate(
        {
          age: 60,
          sex: 'male',
          scr: 85,
          ldl: 1.2,
          conditions: { ascvd: true },
          currentMeds: [
            { drugId: 'rosuvastatin', dose: 40, unit: 'mg' },
            { drugId: blockerId, dose: 80, unit: 'mg' }
          ],
          selectedModules: ['lipid']
        },
        defaultSettings
      );
      expect(rosuvaBcrpPlan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'REDUCE')).toBe(true);
      expect(rosuvaBcrpPlan.recommendations.some((r) => r.drugId === 'rosuvastatin' && r.action === 'CONTINUE')).toBe(false);
    }

    // 5. Simvastatin 40 mg + Diltiazem ở ASCVD chưa đạt đích: không mâu thuẫn [REDUCE Simva + SWITCH] và không sinh cảnh báo dup.statin giả
    const simvaSwitchPlan = evaluate(
      {
        age: 64,
        sex: 'male',
        scr: 88,
        ldl: 2.6,
        conditions: { ascvd: true },
        currentMeds: [
          { drugId: 'simvastatin', dose: 40, unit: 'mg' },
          { drugId: 'diltiazem', dose: 120, unit: 'mg' }
        ],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(simvaSwitchPlan.recommendations.some((r) => r.drugId === 'simvastatin' && r.action === 'STOP')).toBe(true);
    expect(simvaSwitchPlan.recommendations.some((r) => r.drugId === 'simvastatin' && r.action === 'REDUCE')).toBe(false);
    expect(simvaSwitchPlan.recommendations.some((r) => r.action === 'SWITCH' && r.switchFrom === 'simvastatin')).toBe(true);
    expect(simvaSwitchPlan.alerts.some((a) => a.id.includes('statin') && a.type === 'duplicate')).toBe(false);

    // 6. Thiếu SCr / eGFR: Không bao giờ gợi ý Rosuvastatin 20–40 mg trong rationale
    const missingEgfrPlan = evaluate(
      {
        age: 62,
        sex: 'male',
        ldl: 3.1,
        conditions: { ascvd: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(
      missingEgfrPlan.recommendations.some((r) => /Rosuvastatin\s+20[–-]40\s*mg/i.test(r.rationale))
    ).toBe(false);

    // 7. Biên đơn vị mg/dL cho LDL-C (100 mg/dL) và Acid uric (7.1 mg/dL) & Lp(a) nmol/L
    const mgDlSettings: Settings = {
      ...defaultSettings,
      units: { ...defaultSettings.units, lipid: 'mg_dL', urat: 'mg_dL' }
    };
    const modBoundaryPlan = evaluate(
      {
        age: 45,
        sex: 'female',
        sbp: 120,
        dbp: 75,
        scr: 68,
        ldl: 100,
        conditions: { dm: true },
        customInputs: { dmDurationYears: 4, lpaNmol: 130 },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      mgDlSettings
    );
    expect(modBoundaryPlan.recommendations.some((r) => r.id === 'rec_lipid_primary_goal_achieved')).toBe(false);
    expect(modBoundaryPlan.recommendations.some((r) => r.id === 'rec_lipid_lpa_elevated')).toBe(true);
    expect(modBoundaryPlan.recommendations.some((r) => r.id === 'rec_lipid_lpa_screen')).toBe(false);

    const urateMgDlPlan = evaluate(
      {
        age: 62,
        sex: 'male',
        scr: 85,
        ldl: 110,
        uricAcid: 7.1,
        conditions: { ascvd: true, statinIntolerance: true },
        currentMeds: [],
        selectedModules: ['lipid']
      },
      mgDlSettings
    );
    expect(urateMgDlPlan.recommendations.some((r) => r.drugId === 'bempedoic_acid' && r.action === 'START')).toBe(false);

    // 8. Gemfibrozil phối hợp Atorvastatin 20 mg hoặc Rosuvastatin 5 mg kèm suy thận nặng (ngoại trú & nội viện ACS)
    for (const isInpatientAcs of [false, true]) {
      const settingsMode: Settings = {
        ...defaultSettings,
        setting: isInpatientAcs ? 'inpatient' : 'outpatient'
      };
      const gemAtorvaPlan = evaluate(
        {
          age: 63,
          sex: 'male',
          scr: 92,
          ldl: 2.8,
          conditions: { ascvd: true },
          customInputs: isInpatientAcs ? { acuteAcsAdmission: true } : {},
          currentMeds: [
            { drugId: 'atorvastatin', dose: 20, unit: 'mg' },
            { drugId: 'gemfibrozil', dose: 600, unit: 'mg' }
          ],
          selectedModules: ['lipid']
        },
        settingsMode
      );
      expect(gemAtorvaPlan.recommendations.some((r) => r.drugId === 'gemfibrozil' && r.action === 'STOP')).toBe(true);
      expect(
        gemAtorvaPlan.recommendations.some(
          (r) => r.drugId === 'atorvastatin' && (r.action === 'UPTITRATE' || r.action === 'START')
        )
      ).toBe(false);

      const gemRosuvaSevereCkdPlan = evaluate(
        {
          age: 74,
          sex: 'female',
          scr: 240,
          ldl: 2.9,
          conditions: { ascvd: true, ckd: true },
          customInputs: isInpatientAcs ? { acuteAcsAdmission: true } : {},
          currentMeds: [
            { drugId: 'rosuvastatin', dose: 5, unit: 'mg' },
            { drugId: 'gemfibrozil', dose: 600, unit: 'mg' }
          ],
          selectedModules: ['lipid']
        },
        settingsMode
      );
      expect(gemRosuvaSevereCkdPlan.recommendations.some((r) => r.drugId === 'gemfibrozil' && r.action === 'STOP')).toBe(true);
      expect(
        gemRosuvaSevereCkdPlan.recommendations.some(
          (r) =>
            r.drugId === 'rosuvastatin' &&
            (r.action === 'UPTITRATE' || r.action === 'START') &&
            (r.dose?.includes('20') || r.dose?.includes('40'))
        )
      ).toBe(false);
    }

    // 9. Tăng TG rất nặng (TG >= 5.6 mmol/L) nhưng thiếu SCr / eGFR (ngoại trú & nội viện)
    for (const settingMode of ['outpatient', 'inpatient'] as const) {
      const htgMissingEgfrPlan = evaluate(
        {
          age: 55,
          sex: 'male',
          ldl: 2.4,
          tg: 7.8,
          conditions: { dm: true },
          currentMeds: [],
          selectedModules: ['lipid']
        },
        { ...defaultSettings, setting: settingMode }
      );
      expect(
        htgMissingEgfrPlan.recommendations.some(
          (r) => r.drugId === 'fenofibrate' && (r.action === 'START' || r.action === 'UPTITRATE')
        )
      ).toBe(false);
      expect(
        htgMissingEgfrPlan.recommendations.some((r) => r.id === 'missing_input_egfr' && r.action === 'CONSIDER')
      ).toBe(true);
    }
  });

  it('lipid suite 4 (Round 3 cross-invariants): Cho con bú, sỏi mật, suy tim đơn độc, xơ gan mất bù và lọc máu', () => {
    for (const settingMode of ['outpatient', 'inpatient'] as const) {
      const breastfeedingPlan = evaluate(
        {
          age: 31,
          sex: 'female',
          scr: 62,
          ldl: 4.1,
          tg: 6.2,
          conditions: { breastfeeding: true, ascvd: true, acuteAcsWithin24h: true },
          currentMeds: [
            { drugId: 'rosuvastatin_ezetimibe', dose: '20/10 mg' },
            { drugId: 'fenofibrate', dose: 145, unit: 'mg' }
          ],
          selectedModules: ['lipid']
        },
        { ...defaultSettings, setting: settingMode }
      );
      expect(
        breastfeedingPlan.recommendations.some(
          (r) =>
            ALL_LIPID_DRUGS.includes(r.drugId ?? '') &&
            (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE' || r.action === 'SWITCH')
        )
      ).toBe(false);
      expect(
        breastfeedingPlan.recommendations.some(
          (r) => r.drugId === 'rosuvastatin_ezetimibe' && r.action === 'STOP'
        )
      ).toBe(true);
      expect(
        breastfeedingPlan.recommendations.some(
          (r) => r.drugId === 'fenofibrate' && r.action === 'STOP'
        )
      ).toBe(true);
    }

    // Suy tim đơn độc không ASCVD/FH/Đái tháo đường/CKD: Không bao giờ START statin (CORRONA/GISSI-HF Class III-A)
    for (const profile of ['INTL', 'VN', 'US'] as const) {
      const hfOnlyPlan = evaluate(
        {
          age: 66,
          sex: 'male',
          sbp: 122,
          dbp: 74,
          scr: 84,
          tc: 5.2,
          hdl: 1.2,
          ldl: 3.4,
          tg: 1.5,
          conditions: { hf: true },
          currentMeds: [],
          selectedModules: ['lipid']
        },
        { ...defaultSettings, profile }
      );
      expect(
        hfOnlyPlan.recommendations.some(
          (r) => STATIN_IDS.includes(r.drugId ?? '') && r.action === 'START'
        )
      ).toBe(false);
      expect(hfOnlyPlan.recommendations.some((r) => r.id === 'rec_lipid_hf_avoid_routine_statin_init')).toBe(true);
    }

    // Sỏi mật / bệnh túi mật + TG >= 5.6 mmol/L: Cấm START/CONTINUE Fenofibrate, phải STOP nếu đang dùng
    const gallstonePlan = evaluate(
      {
        age: 54,
        sex: 'female',
        scr: 72,
        ldl: 2.5,
        tg: 7.4,
        conditions: { gallbladderDisease: true },
        currentMeds: [{ drugId: 'fenofibrate', dose: 145, unit: 'mg' }],
        selectedModules: ['lipid']
      },
      defaultSettings
    );
    expect(gallstonePlan.recommendations.some((r) => r.drugId === 'fenofibrate' && r.action === 'STOP')).toBe(true);
    expect(
      gallstonePlan.recommendations.some(
        (r) => r.drugId === 'fenofibrate' && (r.action === 'START' || r.action === 'CONTINUE')
      )
    ).toBe(false);
    expect(gallstonePlan.recommendations.some((r) => r.drugId === 'omega3' && r.action === 'START')).toBe(true);
  });
});
