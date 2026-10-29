/**
 * GDMT-VN Module Gút (gout) - 15,000-Case Safety Invariants & Fail-Closed Suite
 */

import { describe, it, expect, vi } from 'vitest';
import { goutModule } from '../../../src/modules/gout/index';

vi.mock('../../../src/modules/registry', () => ({
  setDemoEnabled: () => {},
  isDemoEnabled: () => false,
  getAllModules: () => [goutModule],
  getModule: (id: string) => (id === 'gout' ? goutModule : undefined),
  getActiveModules: (ids: string[]) => (ids.includes('gout') ? [goutModule] : [])
}));

import { evaluate } from '../../../src/engine/evaluate';
import { derivePatientData } from '../../../src/engine/derive';
import { normalizePatientUnits } from '../../../src/engine/units';
import type { CurrentMed, Patient, Profile, Setting, Settings } from '../../../src/engine/types';

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSettings(profile: Profile, setting: Setting): Settings {
  return {
    setting,
    profile,
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
}

const ULT_IDS = ['allopurinol', 'febuxostat', 'probenecid', 'benzbromarone'] as const;
const NSAID_IDS = ['naproxen', 'ibuprofen', 'diclofenac', 'etoricoxib', 'celecoxib', 'indomethacin'] as const;
const STRONG_CYP3A4_IDS = ['clarithromycin', 'cyclosporine', 'ketoconazole', 'ritonavir', 'itraconazole'] as const;
const MODERATE_CYP3A4_IDS = ['verapamil', 'diltiazem', 'erythromycin', 'fluconazole'] as const;
const AZA_IDS = ['azathioprine', 'mercaptopurine'] as const;
const ANTICOAG_IDS = ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran'] as const;
const THIAZIDE_IDS = ['hydrochlorothiazide', 'indapamide', 'chlorthalidone'] as const;
const LOOP_IDS = ['furosemide', 'torsemide', 'bumetanide'] as const;

function generateRandomGoutPatient(rng: () => number, idx: number): { patient: Patient; settings: Settings } {
  const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

  const profiles: readonly Profile[] = ['INTL', 'VN', 'US'];
  const settings = makeSettings(pick(profiles), rng() < 0.3 ? 'inpatient' : 'outpatient');

  const sex = rng() < 0.7 ? 'male' : 'female';
  const age = sex === 'female' && rng() < 0.25 ? randInt(22, 42) : randInt(25, 86);
  const weight = randInt(44, 108);
  const pregnant = sex === 'female' && age <= 45 && rng() < 0.22;

  const scrBucket = rng();
  const scr =
    scrBucket < 0.45
      ? randInt(60, 105)
      : scrBucket < 0.75
        ? randInt(106, 195)
        : scrBucket < 0.92
          ? randInt(196, 320)
          : randInt(321, 520);

  const onDialysis = !pregnant && scr > 320 && rng() < 0.45;
  const uricAcid = randInt(220, 720);

  const asymptomatic = !pregnant && rng() < 0.1;
  const acuteFlare = !asymptomatic && rng() < 0.42;
  const tophi = !asymptomatic && rng() < 0.28;
  const xrayDamage = !asymptomatic && rng() < 0.16;
  const urolithiasis = rng() < 0.18;
  const liverDisease = rng() < 0.14;
  const hf = rng() < 0.2;
  const ascvd = rng() < 0.22;
  const htn = rng() < 0.45;
  const pepticUlcer = rng() < 0.15;
  const bleedingHistory = rng() < 0.08;

  const goutFlaresYear = asymptomatic ? 0 : randInt(0, 5);
  const priorFlaresLifetime = asymptomatic ? 0 : Math.max(goutFlaresYear, randInt(1, 8));
  const hlab5801 = pick(['not_done', 'negative', 'positive'] as const);

  const currentMeds: CurrentMed[] = [];

  if (!asymptomatic && rng() < 0.35) {
    const ult = pick(ULT_IDS);
    currentMeds.push({ drugId: ult, name: ult, dose: ult === 'febuxostat' ? '80' : '100', unit: 'mg' });
    if (ult === 'allopurinol' && rng() < 0.12) {
      currentMeds.push({ drugId: 'febuxostat', name: 'febuxostat', dose: '40', unit: 'mg' });
    }
  }

  if (rng() < 0.15) {
    const nsaid = pick(NSAID_IDS);
    currentMeds.push({ drugId: nsaid, name: nsaid, dose: '500', unit: 'mg' });
  }

  if (rng() < 0.12) {
    currentMeds.push({ drugId: 'colchicine', name: 'Colchicine', dose: '0.6', unit: 'mg' });
  }

  if (rng() < 0.12) {
    const aza = pick(AZA_IDS);
    currentMeds.push({ drugId: aza, name: aza, dose: '50', unit: 'mg' });
  }
  if (rng() < 0.14) {
    const strong = pick(STRONG_CYP3A4_IDS);
    currentMeds.push({ drugId: strong, name: strong, dose: '250', unit: 'mg' });
  } else if (rng() < 0.14) {
    const mod = pick(MODERATE_CYP3A4_IDS);
    currentMeds.push({ drugId: mod, name: mod, dose: '120', unit: 'mg' });
  }

  const onAnticoagulant = rng() < 0.14;
  if (onAnticoagulant) {
    const ac = pick(ANTICOAG_IDS);
    currentMeds.push({ drugId: ac, name: ac, dose: '5', unit: 'mg' });
  }

  if (hf && rng() < 0.65) {
    const loop = pick(LOOP_IDS);
    currentMeds.push({ drugId: loop, name: loop, dose: '40', unit: 'mg' });
  } else if (htn && !hf && rng() < 0.35) {
    const thz = pick(THIAZIDE_IDS);
    currentMeds.push({ drugId: thz, name: thz, dose: '25', unit: 'mg' });
  }

  if (ascvd && !onAnticoagulant && !pepticUlcer && !bleedingHistory && rng() < 0.5) {
    currentMeds.push({ drugId: 'aspirin', name: 'Aspirin', dose: '81', unit: 'mg' });
  }

  const patient: Patient = {
    id: `pt_gout_inv_${idx}`,
    age,
    sex,
    weight,
    sbp: randInt(108, 165),
    dbp: randInt(64, 98),
    hr: randInt(60, 102),
    scr,
    uricAcid,
    tophi,
    selectedModules: ['gout'],
    conditions: {
      gout: !asymptomatic,
      ckd: scr >= 130,
      hf,
      ascvd,
      htn,
      liverDisease,
      pepticUlcer,
      bleedingHistory,
      onAnticoagulant,
      pregnant,
      onDialysis
    },
    currentMeds,
    customInputs: {
      asymptomaticHyperuricemia: asymptomatic,
      acuteFlare,
      monoarthritisLargeJoint: acuteFlare && rng() < 0.4,
      goutFlaresYear,
      priorFlaresLifetime,
      tophi,
      xrayDamage,
      urolithiasis,
      hlab5801,
      allopurinolIntolerant: rng() < 0.1,
      preferFebuxostat: rng() < 0.15,
      preferProbenecid: rng() < 0.12,
      preferBenzbromarone: rng() < 0.12
    }
  };

  return { patient, settings };
}

describe('GDMT-VN Module Gút (gout) - 15,000-Case Safety Invariants & Fail-Closed Verification', () => {
  it('Suite 1: 10,000 ca bệnh ngẫu nhiên hóa tuân thủ tuyệt đối 16 bất biến an toàn lâm sàng (0 vi phạm)', () => {
    const rng = createRng(20261027);
    const TOTAL_CASES = 10_000;

    for (let i = 0; i < TOTAL_CASES; i++) {
      const { patient, settings } = generateRandomGoutPatient(rng, i);
      const normalized = normalizePatientUnits(patient, settings.units);
      const derived = derivePatientData(normalized, settings);
      const egfr = derived.egfr;
      const crcl = derived.crcl;

      const plan = evaluate(patient, settings, { modules: [goutModule] });
      const recs = plan.recommendations;

      const hasMed = (ids: readonly string[]) =>
        patient.currentMeds.some((m) => ids.includes(m.drugId.toLowerCase()));
      const findRec = (drugId: string) => recs.find((r) => r.drugId === drugId);

      const isPreg = Boolean(patient.conditions.pregnant);
      const isDialysis = Boolean(patient.conditions.onDialysis);
      const hlab = patient.customInputs?.hlab5801;
      const hasAza = hasMed(AZA_IDS);
      const hasStrongCyp = hasMed(STRONG_CYP3A4_IDS);
      const hasModCyp = hasMed(MODERATE_CYP3A4_IDS);
      const hasLiver = Boolean(patient.conditions.liverDisease);
      const hasStone = Boolean(patient.customInputs?.urolithiasis);
      const isAcute = Boolean(patient.customInputs?.acuteFlare) && patient.conditions.gout !== false;
      const isAsymptomatic = patient.conditions.gout === false || Boolean(patient.customInputs?.asymptomaticHyperuricemia);

      if (hlab === 'positive') {
        const alloRec = findRec('allopurinol');
        if (alloRec) expect(['START', 'UPTITRATE', 'CONTINUE']).not.toContain(alloRec.action);
        if (hasMed(['allopurinol'])) expect(alloRec?.action).toBe('STOP');
      }

      if (hasAza) {
        for (const xoi of ['allopurinol', 'febuxostat'] as const) {
          const xoiRec = findRec(xoi);
          if (xoiRec) expect(['START', 'UPTITRATE', 'CONTINUE']).not.toContain(xoiRec.action);
          if (hasMed([xoi])) expect(xoiRec?.action).toBe('STOP');
        }
      }

      const colchContra =
        hasStrongCyp ||
        isDialysis ||
        (egfr !== undefined && egfr < 15) ||
        (hasModCyp && ((egfr !== undefined && egfr < 60) || hasLiver || isDialysis));
      if (colchContra) {
        const colchRec = findRec('colchicine');
        if (colchRec) expect(['START', 'UPTITRATE', 'CONTINUE']).not.toContain(colchRec.action);
        if (hasMed(['colchicine'])) expect(colchRec?.action).toBe('STOP');
      }

      const nsaidHardContra =
        isPreg ||
        isDialysis ||
        (egfr !== undefined && egfr < 30) ||
        Boolean(patient.conditions.hf) ||
        Boolean(patient.conditions.pepticUlcer) ||
        Boolean(patient.conditions.bleedingHistory) ||
        Boolean(patient.conditions.onAnticoagulant) ||
        hasMed(ANTICOAG_IDS);
      if (nsaidHardContra) {
        for (const nsaid of NSAID_IDS) {
          const r = findRec(nsaid);
          if (r) expect(['START', 'UPTITRATE']).not.toContain(r.action);
          if (hasMed([nsaid])) expect(r?.action).toBe('STOP');
        }
      }

      if (isAcute && !isPreg) {
        const activeUlt = patient.currentMeds.find((m) =>
          (ULT_IDS as readonly string[]).includes(m.drugId.toLowerCase())
        );
        if (activeUlt) {
          const uId = activeUlt.drugId.toLowerCase();
          const hasDupXoi = hasMed(['allopurinol']) && hasMed(['febuxostat']);
          const hasTophiOrCustom = Boolean(patient.tophi || patient.customInputs?.tophi);
          const vnUricosuricContra =
            settings.profile === 'VN' && (hasTophiOrCustom || (patient.age !== undefined && patient.age >= 70));
          const ultHasHardContra =
            hasDupXoi ||
            (uId === 'allopurinol' &&
              (hlab === 'positive' || hasAza || Boolean(patient.customInputs?.allopurinolIntolerant))) ||
            (uId === 'febuxostat' && (hasAza || Boolean(patient.customInputs?.febuxostatIntolerant))) ||
            (uId === 'probenecid' &&
              (hasStone ||
                isDialysis ||
                vnUricosuricContra ||
                hasMed(['ketorolac', 'methotrexate']) ||
                (egfr !== undefined && egfr < 30) ||
                (crcl !== undefined && crcl < 30))) ||
            (uId === 'benzbromarone' &&
              (settings.profile === 'US' ||
                hasStone ||
                hasLiver ||
                hasMed(['warfarin', 'acenocoumarol', 'pyrazinamide', 'isoniazid', 'rifampicin', 'ketoconazole']) ||
                isDialysis ||
                vnUricosuricContra ||
                (egfr !== undefined && egfr < 30)));
          if (!ultHasHardContra) {
            const uRec = findRec(uId);
            const exceedsCap =
              (uId === 'febuxostat' &&
                Number(activeUlt.dose) > 40 &&
                (isDialysis || (egfr !== undefined && egfr < 30) || (crcl !== undefined && crcl < 30))) ||
              (uId === 'allopurinol' &&
                settings.profile !== 'US' &&
                Number(activeUlt.dose) > 100 &&
                ((crcl !== undefined && crcl < 10) || (egfr !== undefined && egfr < 10)));
            expect(uRec?.action).toBe(exceedsCap ? 'REDUCE' : 'CONTINUE');
          }
        }
      }

      if (isAsymptomatic) {
        for (const ult of ULT_IDS) {
          expect(findRec(ult)?.action).not.toBe('START');
        }
      }

      const startedUlts = recs.filter(
        (r) => r.drugId && (ULT_IDS as readonly string[]).includes(r.drugId) && r.action === 'START'
      );
      expect(
        startedUlts.length,
        `>1 ULT START: ${startedUlts.map((r) => `${r.id}/${r.drugId}`).join(', ')} | patient=${JSON.stringify(patient)} | setting=${settings.setting}/${settings.profile}`
      ).toBeLessThanOrEqual(1);

      const alloStart = recs.find((r) => r.drugId === 'allopurinol' && r.action === 'START');
      if (alloStart && egfr !== undefined && egfr < 60) {
        const doseStr = String(alloStart.dose ?? '');
        expect(doseStr).toContain('50 mg');
        expect(doseStr).not.toContain('100 mg');
      }

      if (hasStone || isDialysis || (egfr !== undefined && egfr < 30)) {
        for (const uri of ['probenecid', 'benzbromarone'] as const) {
          const r = findRec(uri);
          if (r) expect(['START', 'UPTITRATE', 'CONTINUE']).not.toContain(r.action);
          if (hasMed([uri])) expect(r?.action).toBe('STOP');
        }
      }
      if (hasLiver) {
        const benzRec = findRec('benzbromarone');
        if (benzRec) expect(['START', 'UPTITRATE', 'CONTINUE']).not.toContain(benzRec.action);
        if (hasMed(['benzbromarone'])) expect(benzRec?.action).toBe('STOP');
      }

      if (isPreg) {
        for (const forbidden of [...ULT_IDS, 'colchicine', ...NSAID_IDS]) {
          const r = findRec(forbidden);
          if (r) expect(['START', 'UPTITRATE']).not.toContain(r.action);
        }
      }

      if (settings.profile === 'VN' && isAcute && !hasMed(ULT_IDS)) {
        for (const ult of ULT_IDS) {
          expect(findRec(ult)?.action).not.toBe('START');
        }
      }

      if (Boolean(patient.conditions.hf) && hasMed(LOOP_IDS) && !hasMed(THIAZIDE_IDS)) {
        for (const loop of LOOP_IDS) {
          const lr = findRec(loop);
          if (lr) expect(['STOP', 'SWITCH']).not.toContain(lr.action);
        }
        expect(recs.some((r) => r.id === 'rec_gout_switch_thiazide_losartan')).toBe(false);
      }
      if (hasMed(['aspirin']) && !isPreg && !Boolean(patient.conditions.pepticUlcer) && !Boolean(patient.conditions.bleedingHistory) && !hasMed(ANTICOAG_IDS)) {
        expect(findRec('aspirin')?.action).not.toBe('STOP');
      }

      if (hasMed(['allopurinol']) && hasMed(['febuxostat'])) {
        const alloAct = findRec('allopurinol')?.action;
        const febAct = findRec('febuxostat')?.action;
        expect(alloAct === 'STOP' || febAct === 'STOP').toBe(true);
      }

      if (Boolean(patient.customInputs?.allopurinolIntolerant) && hasMed(['allopurinol'])) {
        expect(findRec('allopurinol')?.action).toBe('STOP');
      }

      if (settings.setting === 'inpatient' && !isAcute) {
        expect(recs.some((r) => r.id === 'rec_gout_colchicine_acute_flare' || r.id === 'rec_gout_oral_corticosteroid_flare' || r.id === 'rec_gout_npo_parenteral_steroid')).toBe(false);
      }

      const febMed = patient.currentMeds.find((m) => m.drugId.toLowerCase() === 'febuxostat');
      if (
        !isPreg &&
        !isAcute &&
        !isAsymptomatic &&
        febMed &&
        Number(febMed.dose) > 40 &&
        (isDialysis || (egfr !== undefined && egfr < 30))
      ) {
        const febAct = findRec('febuxostat')?.action;
        expect(['CONTINUE', 'UPTITRATE']).not.toContain(febAct);
      }
    }
  }, 60_000);

  it('Suite 2: 5,000 ca kiểm thử Fail-Closed (QA-1 & QA-9) khi xóa ngẫu nhiên dữ liệu lâm sàng bắt buộc (0 kê đơn mù)', () => {
    const rng = createRng(99887766);
    const TOTAL_FAIL_CLOSED_CASES = 5_000;

    for (let i = 0; i < TOTAL_FAIL_CLOSED_CASES; i++) {
      const { patient, settings } = generateRandomGoutPatient(rng, i);
      const mode = i % 3;

      if (mode === 0) {
        patient.scr = undefined;
        patient.cystatinC = undefined;
        patient.conditions.onDialysis = false;
        patient.conditions.pregnant = false;
        patient.conditions.gout = true;
        patient.currentMeds = [];
        patient.customInputs = {
          ...patient.customInputs,
          asymptomaticHyperuricemia: false,
          acuteFlare: i % 2 === 0,
          goutFlaresYear: 3,
          tophi: true,
          hlab5801: 'negative',
          preferProbenecid: false,
          preferBenzbromarone: false
        };

        const plan = evaluate(patient, settings, { modules: [goutModule] });
        const recs = plan.recommendations;

        for (const blindDrug of ['allopurinol', 'febuxostat', 'probenecid', 'benzbromarone', 'colchicine', 'naproxen']) {
          expect(recs.find((r) => r.drugId === blindDrug)?.action).not.toBe('START');
        }
        expect(recs.some((r) => r.id === 'missing_input_egfr' && r.action === 'CONSIDER')).toBe(true);
      } else if (mode === 1) {
        const activeXoi = i % 2 === 0 ? 'allopurinol' : 'febuxostat';
        patient.uricAcid = undefined;
        patient.conditions.pregnant = false;
        patient.conditions.ascvd = false;
        patient.conditions.hf = false;
        patient.conditions.strokeOrTia = false;
        patient.conditions.gout = true;
        patient.currentMeds = [{ drugId: activeXoi, name: activeXoi, dose: '100', unit: 'mg' }];
        patient.customInputs = {
          ...patient.customInputs,
          asymptomaticHyperuricemia: false,
          acuteFlare: false,
          hasCvd: false,
          allopurinolIntolerant: false,
          febuxostatIntolerant: false,
          hlab5801: activeXoi === 'allopurinol' ? 'negative' : 'positive'
        };

        const plan = evaluate(patient, settings, { modules: [goutModule] });
        const recs = plan.recommendations;

        expect(recs.find((r) => r.drugId === activeXoi)?.action).not.toBe('UPTITRATE');
        expect(recs.some((r) => r.id === 'missing_input_uricAcid' && r.action === 'CONSIDER')).toBe(true);
      } else {
        patient.conditions.pregnant = false;
        patient.conditions.gout = true;
        patient.tophi = false;
        patient.currentMeds = [];
        patient.customInputs = {
          acuteFlare: false,
          asymptomaticHyperuricemia: false,
          tophi: false,
          hasTophi: false,
          xrayDamage: false,
          hlab5801: 'negative'
        };

        const plan = evaluate(patient, settings, { modules: [goutModule] });
        const recs = plan.recommendations;

        for (const ult of ULT_IDS) {
          expect(recs.find((r) => r.drugId === ult)?.action).not.toBe('START');
        }
        expect(recs.some((r) => r.id === 'missing_input_goutFlaresYear' && r.action === 'CONSIDER')).toBe(true);
      }
    }
  }, 60_000);
});
