/**
 * GDMT-VN CKD Module - Matrix, Presets, Pathway, < 20 KB File-Size Gate & Round 1–3 Regressions
 * Lưu ý: Tên describe chứa 'ckd' chữ thường để khớp bộ lọc `-t "ckd"`.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { evaluate } from '../../../src/engine/evaluate';
import { ckdMatrix } from '../../../src/modules/ckd/matrix';
import { ckdPresets } from '../../../src/modules/ckd/presets';
import { ckdPathway } from '../../../src/modules/ckd/pathway';
import type { Settings } from '../../../src/engine/types';

const rasiDrugIds = new Set([
  'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
  'losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan',
]);

describe('Module ckd - Matrix, File-Size Gate (< 20 KB) & Round 1–3 Regressions', () => {
  it('ckd file-size gate: mọi file .ts trong src/modules/ckd/ VÀ tests/modules/ckd/ đều nghiêm ngặt < 20,480 bytes', () => {
    const srcRoot = existsSync(resolve(process.cwd(), 'src', 'modules', 'ckd'))
      ? resolve(process.cwd(), 'src', 'modules', 'ckd')
      : resolve(process.cwd(), 'gdmt-vn', 'src', 'modules', 'ckd');
    const testRoot = existsSync(resolve(process.cwd(), 'tests', 'modules', 'ckd'))
      ? resolve(process.cwd(), 'tests', 'modules', 'ckd')
      : resolve(process.cwd(), 'gdmt-vn', 'tests', 'modules', 'ckd');

    const srcTsFiles = readdirSync(srcRoot).filter((f) => f.endsWith('.ts'));
    expect(srcTsFiles.length).toBeGreaterThanOrEqual(24);
    for (const file of srcTsFiles) {
      const byteSize = statSync(join(srcRoot, file)).size;
      expect(byteSize, `src/modules/ckd/${file} vượt 20 KB (${byteSize} bytes)`).toBeLessThan(20480);
    }

    const testTsFiles = readdirSync(testRoot).filter((f) => f.endsWith('.ts'));
    expect(testTsFiles.length).toBeGreaterThanOrEqual(3);
    for (const file of testTsFiles) {
      const byteSize = statSync(join(testRoot, file)).size;
      expect(byteSize, `tests/modules/ckd/${file} vượt 20 KB (${byteSize} bytes)`).toBeLessThan(20480);
    }

    expect(existsSync(join(srcRoot, 'rules.outpatient.ts'))).toBe(false);
    expect(existsSync(join(srcRoot, 'rules.outpatient.extra.ts'))).toBe(false);
    expect(existsSync(join(srcRoot, 'rules.inpatient.ts'))).toBe(false);
  });

  it('ckd matrix, presets & pathway: bao phủ đủ 18 thuốc sở hữu, phân tầng chính xác Canagliflozin G4, SZC lọc máu, ARB vs ACEi & 4 trụ cột KDIGO', () => {
    expect(ckdMatrix.rows).toHaveLength(18);

    const dapaRow = ckdMatrix.rows.find((r) => r.drugId === 'dapagliflozin')!;
    expect(dapaRow.cells.g4.initiate).toBe('caution');
    expect(dapaRow.cells.g4.continue).toBe('rec');
    expect(dapaRow.cells.g4.note).toContain('20');
    expect(dapaRow.cells.aki.initiate).toBe('contra');
    expect(dapaRow.cells.aki.continue).toBe('contra');

    // CKD-R4-R1-09 / R2-07: Canagliflozin không khởi trị mới ở G4 (eGFR < 30) theo FDA Bảng 1
    const canaRow = ckdMatrix.rows.find((r) => r.drugId === 'canagliflozin')!;
    expect(canaRow.cells.g4.initiate).toBe('not_rec');
    expect(canaRow.cells.g4.continue).toBe('rec');
    expect(canaRow.cells.g4.note).toContain('30');

    const fineRow = ckdMatrix.rows.find((r) => r.drugId === 'finerenone')!;
    expect(fineRow.cells.g4.initiate).toBe('caution');
    expect(fineRow.cells.g4.note).toContain('25');
    expect(fineRow.cells.g5.initiate).toBe('contra');
    expect(fineRow.cells.g5.continue).toBe('not_rec');
    expect(fineRow.cells.aki.continue).toBe('contra');

    const periRow = ckdMatrix.rows.find((r) => r.drugId === 'perindopril')!;
    expect(periRow.cells.aki.initiate).toBe('contra');
    expect(periRow.cells.aki.continue).toBe('contra');
    expect(periRow.cells.dialysis.note).toContain('ngày lọc máu');

    // CKD-R4-R2-10: ARB trên lọc máu ghi rõ không đào thải qua màng lọc (khác ACEi uống sau buổi lọc)
    const losRow = ckdMatrix.rows.find((r) => r.drugId === 'losartan')!;
    expect(losRow.cells.dialysis.note).toContain('Không đào thải đáng kể qua màng lọc');

    // CKD-R4-R1-04: SZC ở cột lọc máu phải ghi rõ ngày không lọc máu 5 g, không dùng 10 g TID
    const szcRow = ckdMatrix.rows.find((r) => r.drugId === 'sodium_zirconium_cyclosilicate')!;
    const patRow = ckdMatrix.rows.find((r) => r.drugId === 'patiromer')!;
    const cpsRow = ckdMatrix.rows.find((r) => r.drugId === 'calcium_polystyrene_sulfonate')!;
    const bicRow = ckdMatrix.rows.find((r) => r.drugId === 'sodium_bicarbonate')!;
    expect(szcRow.cells.dialysis.dose).toContain('NGÀY KHÔNG LỌC MÁU');
    expect(szcRow.cells.dialysis.dose).toContain('5 g');
    expect(szcRow.cells.aki.initiate).toBe('rec');
    expect(patRow.cells.aki.initiate).toBe('ok');
    expect(cpsRow.cells.aki.initiate).toBe('caution');
    expect(bicRow.cells.aki.initiate).toBe('caution');

    expect(ckdPresets).toHaveLength(4);
    expect(ckdPresets[0].setting).toBe('outpatient');
    expect(ckdPresets[1].setting).toBe('outpatient');
    expect(ckdPresets[2].setting).toBe('inpatient');
    expect(ckdPresets[3].setting).toBe('inpatient');
    expect(ckdPresets[2].patient.uacr).toBeUndefined();
    expect(ckdPresets[3].patient.uacr).toBeUndefined();

    const allPathwayText = JSON.stringify(ckdPathway);
    expect(allPathwayText).toContain('Semaglutide');
    expect(allPathwayText).toContain('Cystatin C');
  });

  it('ckd round 2 & round 3 targeted regressions', () => {
    const baseSettings: Settings = {
      setting: 'outpatient',
      profile: 'INTL',
      units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
      score2Region: 'high',
      fontScale: 'normal',
      theme: 'light',
      onlyReviewed: false,
    };

    // 1) Triple Whammy: Indomethacin + Torsemide + Candesartan -> STOP indomethacin
    const planTriple = evaluate(
      {
        id: 'r2_tw',
        name: 'TW',
        age: 56,
        sex: 'male',
        weight: 72,
        sbp: 128,
        dbp: 76,
        scr: 95,
        k: 4.3,
        uacr: 12,
        conditions: { ckd: true, htn: true },
        currentMeds: [
          { drugId: 'candesartan', dose: 8, unit: 'mg' },
          { drugId: 'torsemide', dose: 10, unit: 'mg' },
          { drugId: 'indomethacin', dose: 25, unit: 'mg' },
        ],
        selectedModules: ['ckd'],
      },
      baseSettings
    );
    expect(planTriple.recommendations.some((r) => r.drugId === 'indomethacin' && r.action === 'STOP')).toBe(true);

    // 2) Finerenone 20 -> 40 mg/ngày ở HFmrEF/HFpEF có eGFR >= 60 & K+ < 5.0
    const planHfpefFine = evaluate(
      {
        id: 'r2_hfpef_fine',
        name: 'HFpEF Fine 40',
        age: 58,
        sex: 'male',
        weight: 76,
        sbp: 126,
        dbp: 76,
        lvef: 48,
        scr: 88,
        k: 4.6,
        uacr: 35,
        conditions: { ckd: true, dm: true, hf: true },
        currentMeds: [
          { drugId: 'losartan', dose: 100, unit: 'mg' },
          { drugId: 'finerenone', dose: 20, unit: 'mg' },
        ],
        selectedModules: ['ckd'],
      },
      baseSettings
    );
    const upFine40 = planHfpefFine.recommendations.find(
      (r) => r.drugId === 'finerenone' && r.action === 'UPTITRATE'
    );
    expect(upFine40?.dose).toContain('40 mg');

    // 3) Non-DM + A2 + HA bình thường -> CONSIDER (2C)
    const planNonDmA2 = evaluate(
      {
        id: 'r2_nondm_a2',
        name: 'NonDM A2 Normotensive',
        age: 45,
        sex: 'female',
        weight: 56,
        sbp: 114,
        dbp: 70,
        scr: 110,
        k: 4.2,
        uacr: 12,
        conditions: { ckd: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      baseSettings
    );
    expect(planNonDmA2.recommendations.some((r) => r.drugId === 'perindopril' && r.action === 'CONSIDER')).toBe(true);

    // 4) VN BP 129/76 G3aA1 không ĐTĐ -> không START RASi, Cystatin C ghi Grade 1C
    const vnOutpatient: Settings = { ...baseSettings, profile: 'VN' };
    const planBp129 = evaluate(
      {
        id: 'r3_bp_129',
        name: 'BP 129 A1',
        age: 58,
        sex: 'male',
        weight: 68,
        sbp: 129,
        dbp: 76,
        scr: 135,
        k: 4.3,
        uacr: 1.8,
        conditions: { ckd: true },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      vnOutpatient
    );
    expect(planBp129.recommendations.some((r) => r.drugId && rasiDrugIds.has(r.drugId) && r.action === 'START')).toBe(false);
    expect(planBp129.recommendations.find((r) => r.id === 'rec_ckd_cystatin_c_confirm')?.rationale).toContain('Grade 1C');

    // 5) Child-Pugh B Losartan giảm nửa liều khởi đầu 25 mg & Viêm tụy cấp chặn Semaglutide
    const planHepaticB = evaluate(
      {
        id: 'r3_hep_b',
        name: 'Child-Pugh B Losartan',
        age: 60,
        sex: 'male',
        weight: 66,
        sbp: 142,
        dbp: 84,
        scr: 145,
        k: 4.3,
        uacr: 40,
        conditions: { ckd: true, dm: true, htn: true },
        customInputs: { childPugh: 'B' },
        currentMeds: [],
        selectedModules: ['ckd'],
      },
      vnOutpatient
    );
    expect(
      planHepaticB.recommendations.find((r) => r.drugId === 'losartan' && r.action === 'START')?.dose
    ).toContain('25 mg');

    const planPancreatitis = evaluate(
      {
        id: 'r3_panc',
        name: 'Pancreatitis Semaglutide',
        age: 61,
        sex: 'female',
        weight: 62,
        sbp: 128,
        dbp: 76,
        scr: 150,
        k: 4.4,
        uacr: 35,
        hba1c: 7.9,
        conditions: { ckd: true, dm: true },
        customInputs: { historyPancreatitis: true },
        currentMeds: [
          { drugId: 'dapagliflozin', dose: 10, unit: 'mg' },
          { drugId: 'losartan', dose: 100, unit: 'mg' },
        ],
        selectedModules: ['ckd'],
      },
      vnOutpatient
    );
    expect(planPancreatitis.recommendations.some((r) => r.drugId === 'semaglutide' && r.action === 'AVOID')).toBe(true);
  });
});
