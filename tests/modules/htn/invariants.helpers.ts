/**
 * GDMT-VN Module Tăng huyết áp (htn) - Bộ Sinh Ca Ngẫu nhiên Tất định cho Kiểm thử Bất biến
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Patient, Settings, Profile } from '../../../src/engine/types';

export const PROFILES: Profile[] = ['INTL', 'VN', 'US'];

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

// PRNG tất định Mulberry32 giúp bộ 30.000 ca tái lập 100% không phụ thuộc thời điểm chạy
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: () => number, min: number, max: number): number {
  return Number((rng() * (max - min) + min).toFixed(1));
}

export function generateRandomHtnPatient(seed: number, rng: () => number): Patient {
  const isPregnant = rng() < 0.14;
  const hasGout = rng() < 0.18;
  const hasCad = rng() < 0.18;
  const hasHf = rng() < 0.14;
  const hasCkd = rng() < 0.25;
  const hasAsthma = rng() < 0.12;
  const hasPriorAngioedema = rng() < 0.1;
  const hasBilateralRas = rng() < 0.06;

  const currentMeds = [];
  if (rng() < 0.25) {
    currentMeds.push({ drugId: 'perindopril', name: 'Coversyl', dose: 5, unit: 'mg' });
  }
  if (rng() < 0.22) {
    currentMeds.push({ drugId: 'losartan', name: 'Cozaar', dose: 50, unit: 'mg' });
  }
  if (rng() < 0.32) {
    currentMeds.push({ drugId: 'amlodipine', name: 'Amlor', dose: 5, unit: 'mg' });
  }
  if (rng() < 0.24) {
    currentMeds.push({ drugId: 'indapamide', name: 'Natrilix SR', dose: 1.5, unit: 'mg' });
  }

  // Sinh tối đa 1 bệnh cảnh HMOD nội viện chính mạch lạc (hoặc 0 nếu ngoại trú / THA khẩn cấp)
  const hmodRoll = rng();
  let isAorticDissection = false;
  let isPulmonaryEdema = false;
  let isStroke = false;
  let isThrombolysis = false;
  let isIch = false;
  let isPreeclampsia = false;
  let isEncephalopathy = false;
  let isMalignant = false;

  if (isPregnant && hmodRoll < 0.28) {
    isPreeclampsia = true;
  } else if (hmodRoll < 0.06) {
    isAorticDissection = true;
  } else if (hmodRoll < 0.12) {
    isPulmonaryEdema = true;
  } else if (hmodRoll < 0.22) {
    isStroke = true;
    isThrombolysis = rng() < 0.5;
  } else if (hmodRoll < 0.27) {
    isIch = true;
  } else if (hmodRoll < 0.32) {
    isEncephalopathy = true;
  } else if (hmodRoll < 0.35) {
    isMalignant = true;
  }

  return {
    id: `rnd_htn_${seed}`,
    age: isPregnant ? randInt(rng, 20, 44) : randInt(rng, 25, 92),
    sex: isPregnant ? 'female' : rng() < 0.5 ? 'male' : 'female',
    weight: randInt(rng, 45, 105),
    height: randInt(rng, 145, 185),
    sbp: randInt(rng, 78, 245),
    dbp: randInt(rng, 52, 142),
    hr: randInt(rng, 44, 128),
    scr: randInt(rng, 55, 340),
    k: randFloat(rng, 2.9, 6.3),
    uacr: randInt(rng, 5, 180),
    customInputs: {
      score2RiskPercent: randFloat(rng, 2.0, 18.0),
      preventRiskPct: randFloat(rng, 2.0, 16.0),
      ...(hasBilateralRas ? { bilateralRenalArteryStenosis: true } : {})
    },
    conditions: {
      htn: true,
      pregnant: isPregnant,
      gout: hasGout,
      ascvd: hasCad,
      hf: hasHf,
      ckd: hasCkd,
      asthma: hasAsthma,
      priorAngioedema: hasPriorAngioedema,
      orthostaticHypotension: rng() < 0.1,
      frailty: rng() < 0.1,
      aorticDissection: isAorticDissection,
      acutePulmonaryEdema: isPulmonaryEdema,
      acuteIschemicStroke: isStroke,
      thrombolysisEligible: isThrombolysis,
      acuteIntracerebralHemorrhage: isIch,
      severePreeclampsiaEclampsia: isPreeclampsia,
      hypertensiveEncephalopathy: isEncephalopathy,
      malignantHypertension: isMalignant
    },
    currentMeds,
    selectedModules: ['htn']
  };
}
