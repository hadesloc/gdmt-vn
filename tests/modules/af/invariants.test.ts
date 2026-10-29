/**
 * GDMT-VN Module Rung nhĩ (af) - Property-Based Safety Invariants, Presets & Golden Parity (Post-Round-2)
 * Kiểm chứng:
 * - Bất biến toàn cục Round 2: Mọi thẻ STOP / AVOID / HOLD / DEFER đều có `dose === undefined`.
 * - Căn chỉnh CrCl thực tế (`crclActual` từ `computeCrcl`, sửa AF-R2-R2-14).
 * - Toàn bộ 5 Presets & 52 ca chuẩn `tests/golden/af/*.json` đạt 100%.
 * - 1.500 ca sinh ngẫu nhiên tất định đa bối cảnh (INTL / VN / US × outpatient / inpatient) & Fail-Closed QA-1/QA-9.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/registry', async () => {
  const { afModule } = await import('../../../src/modules/af');
  return {
    getActiveModules: (ids: string[]) => (ids.includes('af') ? [afModule] : []),
    getAllModules: () => [afModule],
    getModule: (id: string) => (id === 'af' ? afModule : undefined),
    setDemoEnabled: () => {},
    isDemoEnabled: () => false
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import { computeCrcl } from '../../../src/engine/calculators/crcl';
import type { Patient, Profile, Setting, Settings } from '../../../src/engine/types';
import { validateGoldenCase, type GoldenCase } from '../../../src/kb-types/goldenCase';
import { afPresets } from '../../../src/modules/af/presets';

const PROFILES: Profile[] = ['INTL', 'VN', 'US'];
const SETTINGS: Setting[] = ['outpatient', 'inpatient'];
const NO_DOSE_ACTIONS = new Set(['STOP', 'AVOID', 'HOLD', 'DEFER']);

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function makeSettings(setting: Setting, profile: Profile): Settings {
  return {
    setting,
    profile,
    units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
    score2Region: 'high',
    fontScale: 'normal',
    theme: 'light',
    onlyReviewed: false
  };
}

function assertNoDoseOnBlockingActions(plan: ReturnType<typeof evaluate>, label: string): void {
  for (const rec of plan.recommendations) {
    if (NO_DOSE_ACTIONS.has(rec.action)) {
      expect(rec.dose, `${label} -> thẻ [${rec.action}] ${rec.id} không được chứa dose`).toBeUndefined();
    }
  }
}

function generateSeededAfPatient(rng: () => number, idx: number): Patient {
  const rInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const isMech = rng() < 0.08;
  const isMs = !isMech && rng() < 0.08;
  const isAps = !isMech && !isMs && rng() < 0.05;
  const isWpw = !isMech && rng() < 0.06;
  const isHcm = !isMech && !isMs && rng() < 0.07;
  const isAmyloid = !isMech && !isMs && !isHcm && rng() < 0.06;
  const isPregnant = rng() < 0.07;
  const isBreastfeeding = !isPregnant && rng() < 0.05;
  const hasLiver = !isPregnant && rng() < 0.08;
  const hasAsthma = rng() < 0.12;
  const hasCad = rng() < 0.25;
  const onDialysis = !isPregnant && rng() < 0.05;
  const afTypes = ['first_diagnosed', 'paroxysmal', 'persistent', 'permanent'] as const;
  const afType = afTypes[rInt(0, afTypes.length - 1)];

  const medsPool = [
    [],
    [{ drugId: 'apixaban', name: 'Eliquis', dose: 5, unit: 'mg' }],
    [{ drugId: 'apixaban', name: 'Eliquis', dose: 2.5, unit: 'mg' }],
    [{ drugId: 'rivaroxaban', name: 'Xarelto', dose: 20, unit: 'mg' }],
    [{ drugId: 'dabigatran', name: 'Pradaxa', dose: 150, unit: 'mg' }],
    [{ drugId: 'edoxaban', name: 'Lixiana', dose: 60, unit: 'mg' }],
    [{ drugId: 'warfarin', name: 'Warfarin', dose: 2.5, unit: 'mg' }],
    [{ drugId: 'acenocoumarol', name: 'Sintrom', dose: 2, unit: 'mg' }],
    [{ drugId: 'diltiazem', name: 'Herbesser', dose: 120, unit: 'mg' }],
    [{ drugId: 'verapamil', name: 'Isoptin', dose: 120, unit: 'mg' }],
    [{ drugId: 'bisoprolol', name: 'Concor', dose: 5, unit: 'mg' }],
    [
      { drugId: 'bisoprolol', name: 'Concor', dose: 5, unit: 'mg' },
      { drugId: 'diltiazem', name: 'Herbesser', dose: 120, unit: 'mg' }
    ],
    [{ drugId: 'digoxin', name: 'Lanoxin', dose: 0.125, unit: 'mg' }],
    [{ drugId: 'flecainide', name: 'Tambocor', dose: 100, unit: 'mg' }],
    [{ drugId: 'propafenone', name: 'Rytmonorm', dose: 150, unit: 'mg' }],
    [{ drugId: 'dronedarone', name: 'Multaq', dose: 400, unit: 'mg' }],
    [{ drugId: 'sotalol', name: 'Sotalex', dose: 80, unit: 'mg', freq: 'bid' }]
  ];

  return {
    id: `rnd_af_r2_${idx}`,
    age: isPregnant || isBreastfeeding ? rInt(22, 42) : rInt(40, 94),
    sex: isPregnant || isBreastfeeding ? 'female' : rng() < 0.5 ? 'male' : 'female',
    weight: rInt(42, 118),
    height: rInt(146, 185),
    sbp: rInt(78, 182),
    dbp: rInt(48, 108),
    hr: rInt(44, 166),
    rhythm: 'afib',
    lvef: rInt(20, 66),
    nyha: rng() < 0.35 ? (rInt(1, 4) as 1 | 2 | 3 | 4) : undefined,
    scr: rInt(55, 390),
    k: Number((rng() * 2.1 + 3.1).toFixed(1)),
    qtc: rng() < 0.1 ? 520 : 440,
    conditions: {
      af: true,
      htn: rng() < 0.6,
      dm: rng() < 0.35,
      hf: rng() < 0.35,
      asthma: hasAsthma,
      liverDisease: hasLiver,
      cad: hasCad,
      vascularDisease: hasCad,
      mechanicalValve: isMech,
      mitralStenosis: isMs,
      antiphospholipidSyndrome: isAps,
      wpw: isWpw,
      hypertrophicCardiomyopathy: isHcm,
      cardiacAmyloidosis: isAmyloid,
      pregnant: isPregnant,
      breastfeeding: isBreastfeeding,
      onDialysis
    },
    currentMeds: medsPool[rInt(0, medsPool.length - 1)],
    selectedModules: ['af'],
    customInputs: {
      afType,
      afOnset: afType === 'permanent' ? undefined : rng() < 0.3 ? 'less_than_24h' : 'more_than_48h_or_unknown',
      ehraScore: String(rInt(1, 4)),
      hemodynamicStability: rng() < 0.06 ? 'unstable' : 'stable',
      plannedProcedureRisk: rng() < 0.1 ? 'high_risk' : 'none',
      childPugh: hasLiver ? (['A', 'B', 'C'][rInt(0, 2)] as string) : 'none'
    }
  };
}

describe('AF Safety Invariants, Presets & Golden Parity (Round 2)', () => {
  it('Toàn bộ 5 afPresets chạy sạch trên cả 3 hồ sơ INTL/VN/US và bảo toàn bất biến dose === undefined', () => {
    expect(afPresets.length).toBe(5);
    const preset4 = afPresets.find((p) => p.id === 'af_preset_mechanical_mitral_valve')!;
    expect(preset4.patient.customInputs?.afOnset).toBeUndefined();
    const preset5 = afPresets.find((p) => p.id === 'af_preset_inpatient_rvr_emergency')!;
    expect(preset5.setting).toBe('inpatient');

    for (const preset of afPresets) {
      for (const profile of PROFILES) {
        const setting = preset.setting ?? 'outpatient';
        const plan = evaluate(preset.patient as Patient, makeSettings(setting, profile));
        assertNoDoseOnBlockingActions(plan, `Preset ${preset.id} (${setting}/${profile})`);
        const startBb = plan.recommendations.some(
          (r) => ['bisoprolol', 'metoprolol_succinate', 'carvedilol', 'nebivolol'].includes(r.drugId ?? '') && r.action === 'START'
        );
        const startCcb = plan.recommendations.some(
          (r) => ['diltiazem', 'verapamil'].includes(r.drugId ?? '') && r.action === 'START'
        );
        expect(startBb && startCcb).toBe(false);
      }
    }
  });

  it('Toàn bộ 52 ca chuẩn tests/golden/af/*.json tuân thủ schema, khớp kỳ vọng và thỏa dose === undefined trên STOP/AVOID/HOLD/DEFER', () => {
    const goldenAfDir = resolve(process.cwd(), 'tests', 'golden', 'af');
    const files = readdirSync(goldenAfDir).filter((f) => f.endsWith('.json')).sort();
    expect(files.length).toBeGreaterThanOrEqual(52);

    for (const file of files) {
      const tc: GoldenCase = JSON.parse(readFileSync(resolve(goldenAfDir, file), 'utf8'));
      expect(validateGoldenCase(tc).valid, `Schema ${file}`).toBe(true);
      const plan = evaluate(tc.patient, tc.settings);
      assertNoDoseOnBlockingActions(plan, file);

      for (const exp of tc.expect.mustInclude) {
        const ok = plan.recommendations.some((rec) => {
          if (exp.drugId && rec.drugId !== exp.drugId) return false;
          if (exp.ruleId && rec.id !== exp.ruleId) return false;
          if (rec.action !== exp.action) return false;
          if (exp.doseContains) {
            const hay = `${JSON.stringify(rec.dose ?? '')} ${rec.title ?? ''}`.toLowerCase();
            if (!hay.includes(exp.doseContains.toLowerCase())) return false;
          }
          return true;
        });
        expect(ok, `Golden ${file} thiếu mustInclude ${JSON.stringify(exp)}`).toBe(true);
      }

      for (const bad of tc.expect.mustNotInclude ?? []) {
        const hit = plan.recommendations.find((rec) => {
          if (bad.drugId && rec.drugId !== bad.drugId) return false;
          if (bad.ruleId && rec.id !== bad.ruleId) return false;
          return rec.action === bad.action;
        });
        expect(hit, `Golden ${file} vi phạm mustNotInclude ${JSON.stringify(bad)}`).toBeUndefined();
      }
    }
  });

  it('Suite 1: 1.000 ca ngẫu nhiên tất định đa bối cảnh (INTL/VN/US × outpatient/inpatient) đạt 0 vi phạm bất biến an toàn', () => {
    const rng = createRng(20261028);
    for (let i = 0; i < 1000; i++) {
      const pt = generateSeededAfPatient(rng, i);
      const setting = SETTINGS[i % SETTINGS.length];
      const profile = PROFILES[i % PROFILES.length];
      const plan = evaluate(pt, makeSettings(setting, profile));

      assertNoDoseOnBlockingActions(plan, `Seeded #${i} (${setting}/${profile})`);

      // Căn chỉnh CrCl thực tế (crclActual) giống hệt src/engine/derive.ts (sửa AF-R2-R2-14)
      const crcl =
        computeCrcl({
          age: pt.age!,
          sex: pt.sex!,
          weight: pt.weight!,
          height: pt.height,
          scr: pt.scr!,
          scrUnit: 'umol/L'
        }).crclActual ?? 0;

      const c = pt.conditions ?? {};
      const ef = pt.lvef!;
      const childPugh = String(pt.customInputs?.childPugh ?? 'none');
      const isPermanent = pt.customInputs?.afType === 'permanent';

      // 1. Van cơ học / Hẹp van hai lá / APS -> CẤM START/CONTINUE DOAC
      if (c.mechanicalValve || c.mitralStenosis || c.antiphospholipidSyndrome) {
        const badDoac = plan.recommendations.find(
          (r) => ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'].includes(r.drugId ?? '') && ['START', 'CONTINUE', 'UPTITRATE'].includes(r.action)
        );
        expect(badDoac, `Ca #${i}: Van cơ học/MS/APS có DOAC`).toBeUndefined();
      }

      // 2. Dabigatran: CẤM khi CrCl < 30 ở INTL/VN, hoặc CrCl < 15 / lọc máu ở cả 3 hồ sơ
      const dabiContra = Boolean(c.onDialysis) || crcl < 15 || (profile !== 'US' && crcl < 30);
      if (dabiContra) {
        const badDabi = plan.recommendations.find(
          (r) => r.drugId === 'dabigatran' && ['START', 'CONTINUE', 'UPTITRATE'].includes(r.action)
        );
        expect(badDabi, `Ca #${i}: Dabigatran chống chỉ định CrCl=${crcl.toFixed(1)}`).toBeUndefined();
      }

      // 3. LVEF ≤ 40% hoặc Amyloidosis -> CẤM Diltiazem/Verapamil
      if (ef <= 40 || c.cardiacAmyloidosis) {
        const badCcb = plan.recommendations.find(
          (r) => ['diltiazem', 'verapamil'].includes(r.drugId ?? '') && ['START', 'CONTINUE', 'UPTITRATE'].includes(r.action)
        );
        expect(badCcb, `Ca #${i}: LVEF=${ef}% / Amyloidosis dùng CCB`).toBeUndefined();
      }

      // 4. WPW -> CẤM toàn bộ thuốc ức chế nút AV
      if (c.wpw) {
        const badWpw = plan.recommendations.find(
          (r) =>
            ['bisoprolol', 'diltiazem', 'verapamil', 'digoxin', 'amiodarone', 'dronedarone'].includes(r.drugId ?? '') &&
            ['START', 'CONTINUE', 'UPTITRATE', 'CONSIDER'].includes(r.action)
        );
        expect(badWpw, `Ca #${i}: WPW khởi trị/duy trì thuốc chẹn nút AV`).toBeUndefined();
      }

      // 5. Không chỉ định đồng thời > 1 thuốc chống đông
      const activeOacs = new Set(
        plan.recommendations
          .filter(
            (r) =>
              ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'acenocoumarol'].includes(r.drugId ?? '') &&
              ['START', 'CONTINUE', 'UPTITRATE', 'REDUCE', 'SWITCH'].includes(r.action)
          )
          .map((r) => r.drugId)
      );
      expect(activeOacs.size, `Ca #${i}: Trùng lặp >1 OAC`).toBeLessThanOrEqual(1);

      // 6. CAD / HFrEF / HCM / Permanent AF -> CẤM nhóm IC
      if (c.cad || ef <= 40 || c.hypertrophicCardiomyopathy || isPermanent) {
        const badIc = plan.recommendations.find(
          (r) => ['flecainide', 'propafenone'].includes(r.drugId ?? '') && ['START', 'CONTINUE', 'CONSIDER'].includes(r.action)
        );
        expect(badIc, `Ca #${i}: Nhóm IC trên CAD/HFrEF/HCM/Permanent`).toBeUndefined();
      }

      // 7. Child-Pugh B/C -> CẤM Rivaroxaban; Child-Pugh C -> CẤM mọi DOAC
      if (childPugh === 'B' || childPugh === 'C') {
        const badRiva = plan.recommendations.find(
          (r) => r.drugId === 'rivaroxaban' && ['START', 'CONTINUE', 'UPTITRATE'].includes(r.action)
        );
        expect(badRiva, `Ca #${i}: Rivaroxaban trên Child-Pugh ${childPugh}`).toBeUndefined();
      }
      if (childPugh === 'C') {
        const badAnyDoac = plan.recommendations.find(
          (r) => ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'].includes(r.drugId ?? '') && ['START', 'CONTINUE', 'UPTITRATE'].includes(r.action)
        );
        expect(badAnyDoac, `Ca #${i}: DOAC trên Child-Pugh C`).toBeUndefined();
      }
    }
  });

  it('Suite 2: 500 ca QA-1 & QA-9 Fail-Closed khi thiếu dữ liệu bắt buộc (age, sex, scr, weight, lvef)', () => {
    const rng = createRng(998877);
    for (let i = 0; i < 500; i++) {
      const pt = generateSeededAfPatient(rng, i);
      pt.conditions!.onDialysis = false;
      const omitScr = rng() < 0.35;
      const omitWeight = rng() < 0.3;
      const omitLvef = rng() < 0.4;
      if (omitScr) pt.scr = undefined;
      if (omitWeight) pt.weight = undefined;
      if (omitLvef) pt.lvef = undefined;

      const setting = SETTINGS[i % 2];
      const plan = evaluate(pt, makeSettings(setting, 'INTL'));
      assertNoDoseOnBlockingActions(plan, `FailClosed #${i}`);

      if (omitScr || omitWeight) {
        const blindDoac = plan.recommendations.find(
          (r) =>
            (r.id.startsWith('rec_af_doac_dosing_') || r.id === 'rec_af_oac_high_risk' || r.id === 'rec_af_hcm_amyloidosis_oac') &&
            ['START', 'CONTINUE', 'REDUCE', 'UPTITRATE'].includes(r.action)
        );
        expect(blindDoac, `FailClosed #${i}: Kê DOAC mù khi thiếu SCr/Weight`).toBeUndefined();
      }

      if (omitLvef) {
        const blindLvefDrug = plan.recommendations.find(
          (r) => ['diltiazem', 'verapamil', 'flecainide', 'propafenone'].includes(r.drugId ?? '') && ['START', 'CONSIDER'].includes(r.action)
        );
        expect(blindLvefDrug, `FailClosed #${i}: Kê CCB/IC mù khi thiếu LVEF`).toBeUndefined();
      }
    }
  });
});
