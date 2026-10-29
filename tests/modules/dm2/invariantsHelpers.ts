/**
 * GDMT-VN Module Đái tháo đường típ 2 (dm2) - Bộ sinh bệnh nhân ngẫu nhiên cho Property-Based Invariant Tests
 * Phân quyền: Agent F4
 */

import type { Patient, Settings, CurrentMed } from '../../../src/engine/types';

export class SimpleRng {
  private seed: number;
  constructor(seed = 20261027) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  choice<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
  boolean(probTrue = 0.5): boolean {
    return this.next() < probTrue;
  }
}

export const ALL_DM2_MED_POOL: CurrentMed[] = [
  { drugId: 'metformin', name: 'Metformin', dose: 1000, unit: 'mg' },
  { drugId: 'dapagliflozin', name: 'Dapagliflozin', dose: 10, unit: 'mg' },
  { drugId: 'empagliflozin', name: 'Empagliflozin', dose: 10, unit: 'mg' },
  { drugId: 'canagliflozin', name: 'Canagliflozin', dose: 100, unit: 'mg' },
  { drugId: 'semaglutide', name: 'Semaglutide', dose: 0.5, unit: 'mg' },
  { drugId: 'semaglutide_oral', name: 'Semaglutide uống', dose: 7, unit: 'mg' },
  { drugId: 'dulaglutide', name: 'Dulaglutide', dose: 1.5, unit: 'mg' },
  { drugId: 'liraglutide', name: 'Liraglutide', dose: 1.2, unit: 'mg' },
  { drugId: 'tirzepatide', name: 'Tirzepatide', dose: 5, unit: 'mg' },
  { drugId: 'sitagliptin', name: 'Sitagliptin', dose: 100, unit: 'mg' },
  { drugId: 'linagliptin', name: 'Linagliptin', dose: 5, unit: 'mg' },
  { drugId: 'vildagliptin', name: 'Vildagliptin', dose: 50, unit: 'mg' },
  { drugId: 'saxagliptin', name: 'Saxagliptin', dose: 5, unit: 'mg' },
  { drugId: 'gliclazide', name: 'Gliclazide MR', dose: 60, unit: 'mg' },
  { drugId: 'glimepiride', name: 'Glimepiride', dose: 2, unit: 'mg' },
  { drugId: 'pioglitazone', name: 'Pioglitazone', dose: 30, unit: 'mg' },
  { drugId: 'acarbose', name: 'Acarbose', dose: 50, unit: 'mg' },
  { drugId: 'insulin_glargine', name: 'Insulin Glargine', dose: 24, unit: 'đơn vị' },
  { drugId: 'insulin_degludec', name: 'Insulin Degludec', dose: 20, unit: 'đơn vị' },
  { drugId: 'insulin_detemir', name: 'Insulin Detemir', dose: 20, unit: 'đơn vị' },
  { drugId: 'insulin_nph', name: 'Insulin NPH', dose: 18, unit: 'đơn vị' },
  { drugId: 'insulin_premix', name: 'Insulin Premix 30/70', dose: 26, unit: 'đơn vị' },
  { drugId: 'insulin_aspart', name: 'Insulin Aspart', dose: 6, unit: 'đơn vị' },
  { drugId: 'insulin_lispro', name: 'Insulin Lispro', dose: 6, unit: 'đơn vị' },
  { drugId: 'insulin_regular', name: 'Insulin Regular', dose: 8, unit: 'đơn vị' }
];

export const INCRETIN_IDS = ['semaglutide', 'semaglutide_oral', 'dulaglutide', 'liraglutide', 'tirzepatide'];
export const DPP4_IDS = ['sitagliptin', 'linagliptin', 'vildagliptin', 'saxagliptin'];
export const SGLT2_IDS = ['dapagliflozin', 'empagliflozin', 'canagliflozin'];
export const SU_IDS = ['gliclazide', 'glimepiride'];
export const BASAL_OR_PREMIX_IDS = ['insulin_glargine', 'insulin_degludec', 'insulin_detemir', 'insulin_nph', 'insulin_premix'];
export const ALL_INSULIN_IDS = [...BASAL_OR_PREMIX_IDS, 'insulin_aspart', 'insulin_lispro', 'insulin_regular'];
export const NON_INSULIN_DM2_IDS = [
  'metformin',
  ...SGLT2_IDS,
  ...INCRETIN_IDS,
  ...DPP4_IDS,
  ...SU_IDS,
  'pioglitazone',
  'acarbose'
];

export function generateRandomPatient(rng: SimpleRng, forceCompleteLabs = false): { patient: Patient; settings: Settings } {
  const sex = rng.choice(['male', 'female'] as const);
  const isPregnant = sex === 'female' && rng.boolean(0.08);
  const age = isPregnant ? Math.round(rng.range(22, 42)) : Math.round(rng.range(20, 92));

  const weight = forceCompleteLabs || rng.boolean(0.88) ? Math.round(rng.range(42, 125)) : undefined;
  const height = forceCompleteLabs || rng.boolean(0.88) ? Math.round(rng.range(145, 185)) : undefined;
  const sbp = forceCompleteLabs || rng.boolean(0.9) ? Math.round(rng.range(88, 205)) : undefined;
  const dbp = forceCompleteLabs || rng.boolean(0.9) ? Math.round(rng.range(52, 115)) : undefined;
  const hr = forceCompleteLabs || rng.boolean(0.9) ? Math.round(rng.range(52, 132)) : undefined;

  const scr = forceCompleteLabs || rng.boolean(0.85) ? Math.round(rng.range(45, 520)) : undefined;
  const k = forceCompleteLabs || rng.boolean(0.85) ? parseFloat(rng.range(2.6, 6.2).toFixed(1)) : undefined;
  const glucose = forceCompleteLabs || rng.boolean(0.9) ? parseFloat(rng.range(2.1, 39.0).toFixed(1)) : undefined;
  const hba1c = forceCompleteLabs || rng.boolean(0.9) ? parseFloat(rng.range(5.6, 14.2).toFixed(1)) : undefined;
  const uacr = forceCompleteLabs || rng.boolean(0.82) ? parseFloat(rng.range(0.5, 90.0).toFixed(1)) : undefined;

  const hasHf = rng.boolean(0.24);
  const lvef = hasHf ? Math.round(rng.range(20, 48)) : Math.round(rng.range(52, 68));
  const hasAscvd = rng.boolean(0.32);
  const hasCkd = rng.boolean(0.28) || (scr !== undefined && scr > 150);
  const hasMtcOrMen2 = rng.boolean(0.07);
  const hasLiverDisease = rng.boolean(0.06);
  const altUlnTimes = rng.boolean(0.08) ? parseFloat(rng.range(3.2, 6.5).toFixed(1)) : 1.1;

  const medCount = Math.floor(rng.range(0, 5));
  const currentMeds: CurrentMed[] = [];
  const chosenIds = new Set<string>();
  let hasBasalAlready = false;
  for (let attempt = 0; attempt < 12 && currentMeds.length < medCount; attempt++) {
    const candidate = rng.choice(ALL_DM2_MED_POOL);
    if (chosenIds.has(candidate.drugId)) continue;
    const isBasal = BASAL_OR_PREMIX_IDS.includes(candidate.drugId);
    if (isBasal && hasBasalAlready) continue;
    if (isBasal) hasBasalAlready = true;
    chosenIds.add(candidate.drugId);
    currentMeds.push(candidate);
  }

  const isRecentHypo = rng.boolean(0.18);
  const isSurgery = rng.boolean(0.14);
  const isOnSteroid = rng.boolean(0.14);
  const isEuDkaOrDka = rng.boolean(0.1);
  const isHhs = !isEuDkaOrDka && glucose !== undefined && glucose >= 33.3 && rng.boolean(0.6);
  const isDkaFlagged = isEuDkaOrDka && rng.boolean(0.5);

  const bloodKetones = isEuDkaOrDka ? parseFloat(rng.range(3.1, 6.5).toFixed(1)) : 0.4;
  const venousPh = isEuDkaOrDka ? parseFloat(rng.range(7.02, 7.26).toFixed(2)) : 7.38;
  const serumBicarb = isEuDkaOrDka ? Math.round(rng.range(6, 16)) : 24;
  const effectiveOsmolality = isHhs ? Math.round(rng.range(302, 345)) : 288;

  const patient: Patient = {
    age,
    sex,
    weight,
    height,
    sbp,
    dbp,
    hr,
    scr,
    k,
    glucose,
    hba1c,
    uacr,
    lvef,
    conditions: {
      dm: true,
      hf: hasHf,
      ascvd: hasAscvd,
      ckd: hasCkd,
      htn: rng.boolean(0.55),
      pregnant: isPregnant,
      liverDisease: hasLiverDisease
    },
    currentMeds,
    selectedModules: ['dm2'],
    customInputs: {
      recentHypo: isRecentHypo,
      plannedSurgery: isSurgery,
      onSteroidTherapy: isOnSteroid,
      historyMtcOrMen2: hasMtcOrMen2,
      altUlnTimes,
      dkaSuspected: isDkaFlagged,
      bloodKetones,
      venousPh,
      serumBicarb,
      effectiveOsmolality,
      elderlyHealthStatus: age >= 65 ? rng.choice(['healthy', 'complex', 'very_complex']) : undefined,
      inpatientUnit: rng.choice(['ward', 'icu']),
      inpatientEating: rng.choice(['normal', 'poor', 'npo', 'tube_feeding'])
    }
  };

  const settings: Settings = {
    setting: rng.choice(['outpatient', 'inpatient'] as const),
    profile: rng.choice(['INTL', 'VN'] as const),
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

  return { patient, settings };
}
