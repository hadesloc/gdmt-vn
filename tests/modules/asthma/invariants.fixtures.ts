/** Shared fixtures for the asthma invariant suites. */
import type { Patient, Settings } from '../../../src/engine/types';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT_DIR = resolve(process.cwd(), 'gdmt-vn');
export const ASTHMA_MODULE_DIR = existsSync(join(ROOT_DIR, 'src', 'modules', 'asthma'))
  ? join(ROOT_DIR, 'src', 'modules', 'asthma')
  : resolve(process.cwd(), 'src', 'modules', 'asthma');

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

export function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomAsthmaPatient(seed: number): Patient {
  const tracks: ('track1' | 'track2' | 'none')[] = ['track1', 'track2', 'none'];
  const steps: (0 | 1 | 2 | 3 | 4 | 5)[] = [0, 1, 2, 3, 4, 5];
  const speechOptions = ['sentences', 'phrases', 'words', 'unable'];
  const mentalOptions = ['alert', 'anxious', 'drowsy_confused'];

  const isUnder12 = Math.random() < 0.1;
  const age = isUnder12 ? randInt(5, 11) : randInt(12, 85);
  const sex: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female';
  const isPregnant = sex === 'female' && age >= 18 && age <= 45 && Math.random() < 0.2;
  const hasAerd = Math.random() < 0.12;

  const takingBb = Math.random() < 0.12;
  const takingTimolol = Math.random() < 0.08;
  const takingNsaid = Math.random() < 0.12;
  const isSabaOnly = Math.random() < 0.14;
  const useTerbutaline = Math.random() < 0.5;
  const isLabaOnly = !isSabaOnly && Math.random() < 0.08;
  const isLamaOnly = !isSabaOnly && !isLabaOnly && Math.random() < 0.06;
  const hasDupLaba = !isSabaOnly && !isLabaOnly && !isLamaOnly && Math.random() < 0.08;
  const hasControllerIcs = !isSabaOnly && !isLabaOnly && !isLamaOnly && Math.random() < 0.35;
  const takingMontelukast = Math.random() < 0.18;
  const takingSedative = Math.random() < 0.1;
  const takingTheophylline = Math.random() < 0.08;
  const overusedPuffs = Math.random() < 0.1;
  const hasHypercapnia = Math.random() < 0.08;

  const currentMeds: Patient['currentMeds'] = [];
  if (takingBb) {
    currentMeds.push({ drugId: 'carvedilol', name: 'Carvedilol', dose: '12.5 mg', freq: '2 lần/ngày' });
  }
  if (takingTimolol) {
    currentMeds.push({ drugId: 'timolol', name: 'Timolol 0.5% nhỏ mắt', dose: '1 giọt', freq: '2 lần/ngày' });
  }
  if (takingNsaid) {
    currentMeds.push({ drugId: 'aspirin', name: 'Aspirin', dose: '81 mg', freq: '1 lần/ngày' });
  }
  if (isSabaOnly) {
    if (useTerbutaline) {
      currentMeds.push({ drugId: 'terbutaline', name: 'Terbutaline', dose: '0.5 mg', freq: 'khi cần' });
    } else {
      currentMeds.push({ drugId: 'salbutamol', name: 'Salbutamol', dose: '100 mcg', freq: 'khi cần' });
    }
  }
  if (isLabaOnly) {
    currentMeds.push({ drugId: 'salmeterol', name: 'Salmeterol', dose: '50 mcg', freq: '2 lần/ngày' });
  }
  if (isLamaOnly) {
    currentMeds.push({ drugId: 'umeclidinium', name: 'Umeclidinium', dose: '62.5 mcg', freq: '1 lần/ngày' });
  }
  if (hasDupLaba) {
    currentMeds.push({ drugId: 'budesonide_formoterol', name: 'Symbicort', dose: '160/4.5 mcg', freq: '2 lần/ngày' });
    currentMeds.push({ drugId: 'indacaterol', name: 'Indacaterol', dose: '150 mcg', freq: '1 lần/ngày' });
  } else if (hasControllerIcs) {
    if (Math.random() < 0.25) {
      currentMeds.push({ drugId: 'beclometasone_formoterol', name: 'Foster', dose: '100/6 mcg', freq: '2 lần/ngày' });
    } else {
      currentMeds.push({ drugId: 'budesonide_formoterol', name: 'Symbicort', dose: '160/4.5 mcg', freq: '2 lần/ngày' });
    }
  }
  if (takingMontelukast) {
    currentMeds.push({ drugId: 'montelukast', name: 'Montelukast', dose: '10 mg', freq: '1 lần tối' });
  }
  if (takingSedative) {
    currentMeds.push({ drugId: 'diazepam', name: 'Diazepam', dose: '5 mg', freq: 'khi cần' });
  }
  if (takingTheophylline) {
    currentMeds.push({ drugId: 'theophylline', name: 'Theophylline', dose: '200 mg', freq: '2 lần/ngày' });
  }

  return {
    id: `rnd_asthma_pt_${seed}`,
    name: `BN ngẫu nhiên ${seed}`,
    age,
    sex,
    weight: randInt(35, 110),
    height: randInt(130, 190),
    sbp: randInt(82, 180),
    dbp: randInt(50, 110),
    hr: randInt(42, 145),
    rhythm: 'sinus',
    fev1Pct: randInt(30, 110),
    conditions: {
      asthma: true,
      htn: Math.random() < 0.25,
      gerd: Math.random() < 0.2,
      allergicRhinitis: Math.random() < 0.3,
      depression: Math.random() < 0.15,
      pregnant: isPregnant,
      aerd: hasAerd
    },
    selectedModules: ['asthma'],
    currentMeds,
    customInputs: {
      currentTrack: tracks[randInt(0, tracks.length - 1)],
      currentStep: steps[randInt(0, steps.length - 1)],
      daytimeSymptomsMoreThanTwiceWeek: Math.random() < 0.5,
      nightWakingDueToAsthma: Math.random() < 0.4,
      relieverNeededMoreThanTwiceWeek: Math.random() < 0.5,
      activityLimitationDueToAsthma: Math.random() < 0.3,
      wellControlledMonths: randInt(0, 12),
      inhalerTechniqueCorrect: Math.random() < 0.7,
      goodAdherence: Math.random() < 0.7,
      sabaOnly: isSabaOnly,
      totalDailyPuffsUsed: overusedPuffs ? randInt(13, 20) : randInt(0, 10),
      bloodEosinophils: randInt(50, 1900),
      feno: randInt(10, 60),
      allergicPhenotype: Math.random() < 0.3,
      isPregnant,
      priorNeuropsychiatric: Math.random() < 0.15,
      speechAbility: speechOptions[randInt(0, speechOptions.length - 1)],
      respiratoryRate: randInt(12, 40),
      accessoryMuscleUse: Math.random() < 0.25,
      silentChest: Math.random() < 0.08,
      mentalStatus: mentalOptions[randInt(0, mentalOptions.length - 1)],
      spo2: randInt(78, 99),
      ...(hasHypercapnia
        ? { paco2: randInt(46, 65) }
        : Math.random() < 0.25
          ? { paco2: randInt(32, 44) }
          : {}),
      exacerbationsLastYear: randInt(0, 3),
      isAcuteExacerbation: Math.random() < 0.5
    }
  };
}

