/**
 * GDMT-VN Module Bệnh phổi tắc nghẽn mạn tính (copd)
 * Helpers & Deterministic PRNG Patient Generator cho Property-Based Invariants
 * Phân quyền: Agent L
 */

import type { Patient, Settings, CurrentMed } from '../../../src/engine/types';

export const defaultSettings: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct',
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false,
};

/** Bộ sinh số giả ngẫu nhiên tất định Mulberry32 */
export function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[randInt(rng, 0, arr.length - 1)];
}

export interface InhalerComponents {
  ics: boolean;
  lama: boolean;
  laba: boolean;
}

export const INHALER_MAP: Record<string, InhalerComponents> = {
  tiotropium: { ics: false, lama: true, laba: false },
  umeclidinium: { ics: false, lama: true, laba: false },
  glycopyrronium: { ics: false, lama: true, laba: false },
  aclidinium: { ics: false, lama: true, laba: false },
  indacaterol: { ics: false, lama: false, laba: true },
  olodaterol: { ics: false, lama: false, laba: true },
  salmeterol: { ics: false, lama: false, laba: true },
  vilanterol: { ics: false, lama: false, laba: true },
  formoterol: { ics: false, lama: false, laba: true },
  budesonide: { ics: true, lama: false, laba: false },
  fluticasone_propionate: { ics: true, lama: false, laba: false },
  fluticasone_furoate: { ics: true, lama: false, laba: false },
  beclometasone: { ics: true, lama: false, laba: false },
  mometasone: { ics: true, lama: false, laba: false },
  ciclesonide: { ics: true, lama: false, laba: false },
  tiotropium_olodaterol: { ics: false, lama: true, laba: true },
  umeclidinium_vilanterol: { ics: false, lama: true, laba: true },
  glycopyrronium_indacaterol: { ics: false, lama: true, laba: true },
  indacaterol_glycopyrronium: { ics: false, lama: true, laba: true },
  budesonide_formoterol: { ics: true, lama: false, laba: true },
  beclometasone_formoterol: { ics: true, lama: false, laba: true },
  fluticasone_salmeterol: { ics: true, lama: false, laba: true },
  fluticasone_vilanterol: { ics: true, lama: false, laba: true },
  mometasone_formoterol: { ics: true, lama: false, laba: true },
  fluticasone_furoate_umeclidinium_vilanterol: { ics: true, lama: true, laba: true },
  budesonide_glycopyrronium_formoterol: { ics: true, lama: true, laba: true },
  beclometasone_glycopyrronium_formoterol: { ics: true, lama: true, laba: true },
  beclometasone_formoterol_glycopyrronium: { ics: true, lama: true, laba: true },
};

export const DPI_ONLY_IDS = new Set([
  'umeclidinium',
  'glycopyrronium',
  'aclidinium',
  'indacaterol',
  'salmeterol',
  'vilanterol',
  'umeclidinium_vilanterol',
  'glycopyrronium_indacaterol',
  'indacaterol_glycopyrronium',
  'fluticasone_furoate_umeclidinium_vilanterol',
]);

export const MED_SCENARIOS: CurrentMed[][] = [
  [],
  [{ drugId: 'tiotropium', name: 'Spiriva Respimat', dose: 5, unit: 'mcg' }],
  [{ drugId: 'indacaterol', name: 'Onbrez Breezhaler', dose: 150, unit: 'mcg' }],
  [{ drugId: 'tiotropium_olodaterol', name: 'Spiolto Respimat', dose: 5, unit: 'mcg' }],
  [{ drugId: 'umeclidinium_vilanterol', name: 'Anoro Ellipta', dose: 62.5, unit: 'mcg' }],
  [{ drugId: 'budesonide_formoterol', name: 'Symbicort', dose: 160, unit: 'mcg' }],
  [{ drugId: 'fluticasone_salmeterol', name: 'Seretide Accuhaler', dose: 250, unit: 'mcg' }],
  [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta', dose: 100, unit: 'mcg' }],
  [{ drugId: 'budesonide_glycopyrronium_formoterol', name: 'Breztri Aerosphere', dose: 160, unit: 'mcg' }],
  [{ drugId: 'budesonide', name: 'Pulmicort', dose: 200, unit: 'mcg' }],
  [
    { drugId: 'budesonide_formoterol', name: 'Symbicort', dose: 160, unit: 'mcg' },
    { drugId: 'tiotropium', name: 'Spiriva', dose: 5, unit: 'mcg' },
  ],
  [
    { drugId: 'tiotropium', name: 'Spiriva', dose: 5, unit: 'mcg' },
    { drugId: 'salmeterol', name: 'Serevent', dose: 50, unit: 'mcg' },
  ],
  [
    { drugId: 'budesonide', name: 'Pulmicort', dose: 200, unit: 'mcg' },
    { drugId: 'tiotropium', name: 'Spiriva', dose: 5, unit: 'mcg' },
  ],
  [
    { drugId: 'tiotropium', name: 'Spiriva', dose: 5, unit: 'mcg' },
    { drugId: 'tiotropium_olodaterol', name: 'Spiolto', dose: 5, unit: 'mcg' },
  ],
  [
    { drugId: 'tiotropium', name: 'Spiriva', dose: 5, unit: 'mcg' },
    { drugId: 'umeclidinium', name: 'Incruse', dose: 62.5, unit: 'mcg' },
    { drugId: 'umeclidinium_vilanterol', name: 'Anoro', dose: 62.5, unit: 'mcg' },
  ],
  [
    { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy', dose: 100, unit: 'mcg' },
    { drugId: 'umeclidinium_vilanterol', name: 'Anoro', dose: 62.5, unit: 'mcg' },
  ],
  [
    { drugId: 'salbutamol', name: 'Ventolin pMDI', dose: 100, unit: 'mcg' },
    { drugId: 'prednisolone', name: 'Prednisolone nền', dose: 5, unit: 'mg' },
    { drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' },
  ],
  [
    { drugId: 'tiotropium_olodaterol', name: 'Spiolto', dose: 5, unit: 'mcg' },
    { drugId: 'propranolol', name: 'Inderal', dose: 40, unit: 'mg' },
  ],
  [
    { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy', dose: 100, unit: 'mcg' },
    { drugId: 'amiodarone', name: 'Cordarone', dose: 200, unit: 'mg' },
  ],
  [
    { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy', dose: 100, unit: 'mcg' },
    { drugId: 'propafenone', name: 'Rytmonorm', dose: 150, unit: 'mg' },
    { drugId: 'theophylline', name: 'Theophylline SR', dose: 200, unit: 'mg' },
  ],
  [
    { drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy', dose: 100, unit: 'mcg' },
    { drugId: 'dupilumab', name: 'Dupixent', dose: 300, unit: 'mg' },
    { drugId: 'azithromycin', name: 'Zithromax', dose: 250, unit: 'mg' },
  ],
  [
    { drugId: 'tiotropium_olodaterol', name: 'Spiolto', dose: 5, unit: 'mcg' },
    { drugId: 'roflumilast', name: 'Daxas', dose: 500, unit: 'mcg' },
  ],
];

export function generateRandomCopdPatient(
  rng: () => number,
  caseIndex: number
): { patient: Patient; settings: Settings } {
  const inhalers = ['none', 'saba_sama', 'lama_mono', 'laba_mono', 'laba_lama', 'ics_laba', 'triple'] as const;
  const smokingList = ['current', 'former', 'never'] as const;
  const profiles = ['INTL', 'VN', 'US'] as const;

  const fev1Fvc = Number((0.35 + rng() * 0.45).toFixed(2));
  const fev1Pct = randInt(rng, 18, 95);
  const mmrc = randInt(rng, 0, 4);
  const cat = randInt(rng, 3, 36);
  const modExac = randInt(rng, 0, 3);
  const hosp = randInt(rng, 0, 2);
  const eos = randInt(rng, 25, 650);

  const hasPriorAsthma = rng() < 0.18;
  const coSelectAsthmaModule = hasPriorAsthma && rng() < 0.45;
  const hasPneumonia = rng() < 0.12;
  const isChronicBronchitis = rng() < 0.38;
  const isAcute = rng() < 0.22;
  const isInpatient = isAcute ? rng() < 0.85 : rng() < 0.12;
  const profile = pick(rng, profiles);

  const hasLiver = rng() < 0.1;
  const hasDepression = rng() < 0.08;
  const isFemale = rng() < 0.35;
  const isPregnant = isFemale && rng() < 0.05;
  const unexplainedWeightLoss = rng() < 0.08;
  const qtcProlonged = rng() < 0.08;
  const hearingImpairment = rng() < 0.06;
  const ntmInfection = rng() < 0.05;
  const corPulmonale = rng() < 0.18;
  const weakFlow = rng() < 0.12;
  const milkAllergy = rng() < 0.07;
  const glaucoma = rng() < 0.06;
  const bleedingHistory = rng() < 0.07;
  const onSupplementalOxygen = isAcute && rng() < 0.3;

  const baseMeds = MED_SCENARIOS[randInt(rng, 0, MED_SCENARIOS.length - 1)].map((m) => ({ ...m }));

  const customInputs: Record<string, string | number | boolean> = {
    fev1FvcRatio: fev1Fvc,
    fev1PredPct: fev1Pct,
    mmrc,
    cat,
    moderateExacerbations: modExac,
    hospitalizations: hosp,
    bloodEos: eos,
    smokingStatus: pick(rng, smokingList),
    currentInhaler: pick(rng, inhalers),
    chronicBronchitis: isChronicBronchitis,
    priorPneumonia: hasPneumonia,
    acuteExacerbation: isAcute,
    restingSpo2: randInt(rng, 80, 98),
    pao2: randInt(rng, 45, 92),
    abgPh: Number((7.15 + rng() * 0.29).toFixed(2)),
    abgPaco2: randInt(rng, 22, 76),
    purulentSputum: rng() < 0.42,
    increasedSputumVolume: rng() < 0.45,
    accessoryMuscleUse: rng() < 0.25,
    alteredMentalStatus: rng() < 0.12,
    unexplainedWeightLoss,
    qtcProlonged,
    hearingImpairment,
    ntmInfection,
    corPulmonaleOrPolycythemia: corPulmonale,
    weakInspiratoryFlow: weakFlow,
    severeMilkProteinAllergy: milkAllergy,
    narrowAngleGlaucoma: glaucoma,
    onSupplementalOxygen,
  };

  if (hasLiver && rng() < 0.5) {
    customInputs.childPugh = rng() < 0.5 ? 'B' : 'C';
  }

  if (coSelectAsthmaModule) {
    customInputs.currentTrack = rng() < 0.72 ? 'track1' : 'track2';
    customInputs.currentStep = randInt(rng, 0, 5);
    if (rng() < 0.85) {
      customInputs.daytimeSymptomsMoreThanTwiceWeek = rng() < 0.45;
      customInputs.nightWakingDueToAsthma = rng() < 0.35;
      customInputs.relieverNeededMoreThanTwiceWeek = rng() < 0.45;
      customInputs.activityLimitationDueToAsthma = rng() < 0.35;
    } else {
      customInputs.daytimeSymptomsMoreThanTwiceWeek = rng() < 0.5;
    }
    if (isInpatient && !isAcute && rng() < 0.5) {
      customInputs.isAcuteExacerbation = false;
      customInputs.acuteResponseAfter1h = 'good_response';
    }
  }

  const dropAgeForAcoFailClosed = coSelectAsthmaModule && !isPregnant && rng() < 0.08;

  const patient: Patient = {
    id: `rnd_copd_${caseIndex}`,
    age: dropAgeForAcoFailClosed ? undefined : isPregnant ? randInt(rng, 28, 42) : randInt(rng, 45, 88),
    sex: isFemale ? 'female' : 'male',
    weight: rng() < 0.1 ? randInt(rng, 36, 44) : randInt(rng, 45, 85),
    height: randInt(rng, 150, 175),
    sbp: isAcute && rng() < 0.12 ? randInt(rng, 72, 88) : randInt(rng, 100, 168),
    dbp: randInt(rng, 50, 98),
    hr: randInt(rng, 60, 124),
    scr: rng() < 0.1 ? randInt(rng, 450, 720) : randInt(rng, 65, 160),
    conditions: {
      copd: true,
      priorAsthma: hasPriorAsthma,
      asthma: coSelectAsthmaModule,
      liverDisease: hasLiver,
      depression: hasDepression,
      pregnant: isPregnant,
      bleedingHistory,
    },
    currentMeds: baseMeds,
    selectedModules: coSelectAsthmaModule ? ['copd', 'asthma'] : ['copd'],
    customInputs,
  };

  const settings: Settings = {
    ...defaultSettings,
    setting: isInpatient ? 'inpatient' : 'outpatient',
    profile,
  };

  return { patient, settings };
}
