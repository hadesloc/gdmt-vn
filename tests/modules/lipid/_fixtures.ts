/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Shared Test Fixtures & Random Patient Generator
 * Phân quyền: Agent I2 / Agent I5 (Round 3 Remediation — < 20 KB)
 */

import type { CurrentMed, Patient, Settings } from '../../../src/engine/types';

export const defaultSettings: Settings = {
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

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(1));
}

export const STATIN_IDS = [
  'atorvastatin',
  'rosuvastatin',
  'simvastatin',
  'pravastatin',
  'pitavastatin',
  'lovastatin',
  'fluvastatin'
];

export const ALL_LIPID_DRUGS = [
  ...STATIN_IDS,
  'ezetimibe',
  'evolocumab',
  'alirocumab',
  'inclisiran',
  'bempedoic_acid',
  'fenofibrate',
  'icosapent_ethyl',
  'omega3'
];

export const LDL_LOWERING_DRUGS = [
  ...STATIN_IDS,
  'ezetimibe',
  'evolocumab',
  'alirocumab',
  'inclisiran',
  'bempedoic_acid'
];

export function generateRandomLipidPatient(seedIndex: number): Patient {
  const isPregnant = Math.random() < 0.12;
  const isIntolerant = Math.random() < 0.14;
  const hasAscvd = Math.random() < 0.4;
  const hasDm = Math.random() < 0.3;
  const hasCkd = Math.random() < 0.25;
  const hasGout = Math.random() < 0.12;
  const onDialysis = hasCkd && Math.random() < 0.2;
  const hasLiverDisease = Math.random() < 0.08;

  const currentMeds: CurrentMed[] = [];
  const medRoll = Math.random();
  if (medRoll < 0.2) {
    currentMeds.push({ drugId: 'atorvastatin', name: 'Atorvastatin', dose: randInt(1, 4) * 20, unit: 'mg' });
  } else if (medRoll < 0.3) {
    currentMeds.push({ drugId: 'rosuvastatin', name: 'Rosuvastatin', dose: [5, 10, 20, 40][randInt(0, 3)], unit: 'mg' });
  } else if (medRoll < 0.38) {
    currentMeds.push({ drugId: 'simvastatin', name: 'Simvastatin', dose: [20, 40, 80][randInt(0, 2)], unit: 'mg' });
  } else if (medRoll < 0.44) {
    currentMeds.push({ drugId: 'fenofibrate', name: 'Fenofibrate', dose: [67, 145, 200][randInt(0, 2)], unit: 'mg' });
  }

  if (Math.random() < 0.12) {
    currentMeds.push({ drugId: 'ezetimibe', name: 'Ezetimibe', dose: 10, unit: 'mg' });
  }

  const ddiRoll = Math.random();
  if (ddiRoll < 0.06) {
    currentMeds.push({ drugId: 'clarithromycin', name: 'Clarithromycin', dose: 500, unit: 'mg' });
  } else if (ddiRoll < 0.1) {
    currentMeds.push({ drugId: 'cyclosporine', name: 'Cyclosporine', dose: 100, unit: 'mg' });
  } else if (ddiRoll < 0.13) {
    currentMeds.push({ drugId: 'gemfibrozil', name: 'Gemfibrozil', dose: 600, unit: 'mg' });
  }

  const customInputs: Record<string, string | number | boolean> = {
    altUlnTimes: Math.random() < 0.82 ? randFloat(0.5, 2.5) : randFloat(3.0, 7.5),
    ckUlnTimes: Math.random() < 0.8 ? randFloat(0.5, 3.5) : randFloat(4.2, 20.0)
  };
  if (Math.random() < 0.5) {
    customInputs.lpa = randInt(10, 120);
  }
  if (Math.random() < 0.35) {
    customInputs.baselineLdl = randFloat(2.4, 6.5);
  }

  return {
    id: `rnd_lipid_pt_${seedIndex}`,
    age: randInt(25, 88),
    sex: isPregnant ? 'female' : Math.random() < 0.5 ? 'male' : 'female',
    weight: randInt(45, 115),
    height: randInt(145, 185),
    sbp: randInt(95, 180),
    dbp: randInt(60, 108),
    hr: randInt(55, 105),
    scr: randInt(50, 340),
    uricAcid: randInt(240, 620),
    tc: randFloat(3.0, 9.5),
    hdl: randFloat(0.7, 2.2),
    ldl: randFloat(0.8, 6.8),
    tg: randFloat(0.8, 13.0),
    conditions: {
      pregnant: isPregnant,
      statinIntolerance: isIntolerant,
      ascvd: hasAscvd,
      dm: hasDm,
      ckd: hasCkd,
      gout: hasGout,
      onDialysis,
      liverDisease: hasLiverDisease,
      smoker: Math.random() < 0.3,
      recurrentAcsWithin2Years: hasAscvd && Math.random() < 0.2,
      acuteAcsWithin24h: Math.random() < 0.18,
      familialHypercholesterolemia: Math.random() < 0.06,
      dmTargetOrganDamage: hasDm && Math.random() < 0.3
    },
    currentMeds,
    selectedModules: ['lipid'],
    customInputs
  };
}
