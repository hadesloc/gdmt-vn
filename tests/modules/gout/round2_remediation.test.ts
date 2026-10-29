/**
 * GDMT-VN Module Gout - Round 2 Medical Review Board Remediation & Cross-Module AERD Regression Suite
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { goutPresets } from '../../../src/modules/gout/presets';
import { parseMedDailyDoseMg, hasAmbiguousCountMedDose } from '../../../src/modules/gout/helpers';
import type { Patient, Profile, Settings } from '../../../src/engine/types';

function makeSettings(profile: Profile, uratUnit: 'umol_L' | 'mg_dL' = 'umol_L'): Settings {
  return {
    setting: 'outpatient',
    profile,
    units: {
      cr: 'umol_L',
      glucose: 'mmol_L',
      lipid: 'mmol_L',
      urat: uratUnit,
      uacr: 'mg_mmol',
      hba1c: 'pct'
    },
    score2Region: 'high',
    fontScale: 'normal',
    theme: 'light',
    onlyReviewed: false
  };
}

describe('Module gout - Round 2 Remediation & Cross-Module Regressions', () => {
  it('GOUT-R2-R1-02: SI (µmol/L) vs US (mg/dL) urate unit invariance across all 5 goutPresets on VN, INTL, and US', () => {
    for (const preset of goutPresets) {
      for (const profile of ['VN', 'INTL', 'US'] as const) {
        const siPatient: Patient = JSON.parse(JSON.stringify(preset.patient));
        const usPatient: Patient = JSON.parse(JSON.stringify(preset.patient));
        if (typeof siPatient.uricAcid === 'number') {
          usPatient.uricAcid = Number((siPatient.uricAcid / 59.48).toFixed(3));
        }

        const siPlan = evaluate(siPatient, makeSettings(profile, 'umol_L'));
        const usPlan = evaluate(usPatient, makeSettings(profile, 'mg_dL'));

        const siSig = siPlan.recommendations.map((r) => `${r.id}:${r.action}:${r.drugId ?? ''}`);
        const usSig = usPlan.recommendations.map((r) => `${r.id}:${r.action}:${r.drugId ?? ''}`);
        expect(usSig).toEqual(siSig);
      }
    }
  });

  it('GOUT-R2-R1-10: Preset 1 (gout + ckd) produces zero critical/contraindicated DDI alerts', () => {
    const p1 = JSON.parse(JSON.stringify(goutPresets[0].patient)) as Patient;
    const plan = evaluate(p1, makeSettings('INTL', 'umol_L'));
    const criticalAlerts = plan.alerts.filter((a) => a.severity === 'critical');
    expect(criticalAlerts).toEqual([]);
  });

  it('GOUT-R2-R2-07 & GOUT-R2-R3-13: parseMedDailyDoseMg handles Vietnamese frequencies and fails closed on bare tablet counts', () => {
    expect(parseMedDailyDoseMg({ drugId: 'allopurinol', name: 'Allopurinol', dose: '300 mg', freq: '2 lần/ngày' })).toBe(600);
    expect(parseMedDailyDoseMg({ drugId: 'allopurinol', name: 'Allopurinol', dose: '100 mg', freq: 'ngày 3 lần' })).toBe(300);
    expect(parseMedDailyDoseMg({ drugId: 'allopurinol', name: 'Allopurinol', dose: '100 mg', freq: 'cách ngày' })).toBe(50);
    expect(parseMedDailyDoseMg({ drugId: 'allopurinol', name: 'Allopurinol', dose: '2 viên', unit: 'viên' })).toBeUndefined();
    expect(hasAmbiguousCountMedDose({ drugId: 'allopurinol', name: 'Allopurinol', dose: '2 viên', unit: 'viên' })).toBe(true);
  });

  it('ASTHMA-R4-R1-05: Multi-module [asthma, gout] + AERD + CYP3A4i cleanly starts prednisolone without NSAID flip', () => {
    const patient: Patient = {
      id: 'pt_asthma_gout_aerd',
      age: 48,
      sex: 'female',
      weight: 60,
      sbp: 124,
      dbp: 78,
      hr: 82,
      scr: 78,
      uricAcid: 520,
      selectedModules: ['asthma', 'gout'],
      conditions: {
        asthma: true,
        gout: true,
        aerd: true
      },
      currentMeds: [
        { drugId: 'budesonide_formoterol', name: 'Budesonide/Formoterol', dose: '160/4.5 mcg', freq: 'BID' },
        { drugId: 'clarithromycin', name: 'Clarithromycin', dose: '500 mg', freq: 'BID' }
      ],
      customInputs: {
        acuteFlare: true,
        cyp3a4PgpInhibitor: true,
        goutFlaresYear: 3,
        priorFlaresLifetime: 4,
        hlab5801: 'negative'
      }
    };

    const plan = evaluate(patient, makeSettings('INTL', 'umol_L'));
    const predFlare = plan.recommendations.find((r) => r.id === 'rec_gout_oral_corticosteroid_flare');
    expect(predFlare?.action).toBe('START');
    expect(predFlare?.drugId).toBe('prednisolone');

    const naproxenStart = plan.recommendations.find((r) => r.drugId === 'naproxen' && r.action === 'START');
    expect(naproxenStart).toBeUndefined();
    const naproxenAvoid = plan.recommendations.find((r) => r.drugId === 'naproxen' && r.action === 'AVOID');
    expect(naproxenAvoid).toBeDefined();
  });

  it('GOUT-R2-R1-04 & GOUT-R2-R1-06 & GOUT-R2-R2-10: Enforces safety caps during flare, stops Benzbromarone + VKA, and caps Rosuvastatin <= 20 mg on Febuxostat', () => {
    const pFlareCap: Patient = {
      id: 'pt_feb80_ckd4_flare',
      age: 67,
      sex: 'male',
      weight: 68,
      sbp: 132,
      dbp: 80,
      scr: 250,
      uricAcid: 490,
      selectedModules: ['gout'],
      conditions: { gout: true, ckd: true },
      currentMeds: [{ drugId: 'febuxostat', name: 'Febuxostat', dose: '80', unit: 'mg' }],
      customInputs: { acuteFlare: true, hlab5801: 'positive', goutFlaresYear: 3 }
    };
    const flarePlan = evaluate(pFlareCap, makeSettings('INTL'));
    expect(flarePlan.recommendations.find((r) => r.drugId === 'febuxostat')?.action).toBe('REDUCE');

    const pBenzVka: Patient = {
      id: 'pt_benz_warfarin',
      age: 62,
      sex: 'male',
      weight: 70,
      sbp: 128,
      dbp: 78,
      scr: 90,
      uricAcid: 420,
      selectedModules: ['gout'],
      conditions: { gout: true, onAnticoagulant: true },
      currentMeds: [
        { drugId: 'benzbromarone', name: 'Benzbromarone', dose: '100', unit: 'mg' },
        { drugId: 'warfarin', name: 'Warfarin', dose: '5', unit: 'mg' }
      ],
      customInputs: { acuteFlare: false, goutFlaresYear: 2 }
    };
    const benzPlan = evaluate(pBenzVka, makeSettings('INTL'));
    const benzStop = benzPlan.recommendations.find((r) => r.drugId === 'benzbromarone');
    expect(benzStop?.action).toBe('STOP');
    expect(benzStop?.rationale).toContain('Vitamin K');

    const pRosuFeb: Patient = {
      id: 'pt_rosu40_feb40',
      age: 58,
      sex: 'male',
      weight: 74,
      sbp: 126,
      dbp: 78,
      scr: 88,
      uricAcid: 310,
      selectedModules: ['gout'],
      conditions: { gout: true },
      currentMeds: [
        { drugId: 'febuxostat', name: 'Febuxostat', dose: '40', unit: 'mg' },
        { drugId: 'rosuvastatin', name: 'Rosuvastatin', dose: '40', unit: 'mg' }
      ],
      customInputs: { acuteFlare: false, hlab5801: 'positive', goutFlaresYear: 2 }
    };
    const rosuPlan = evaluate(pRosuFeb, makeSettings('INTL'));
    expect(rosuPlan.recommendations.find((r) => r.drugId === 'rosuvastatin')?.action).toBe('REDUCE');
  });
});
