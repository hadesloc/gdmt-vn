/**
 * GDMT-VN CKD Module - Randomized Safety Invariants Fuzzer (< 20 KB)
 * Chạy 10.000 ca ngẫu nhiên (QA-1, QA-9 & Round 4 dose: undefined invariant).
 * Lưu ý: Tên describe chứa 'ckd' chữ thường để khớp bộ lọc `-t "ckd"`.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { normalizePatientUnits } from '../../../src/engine/units';
import { derivePatientData } from '../../../src/engine/derive';
import type { Patient, Settings, CurrentMed, PatientConditions } from '../../../src/engine/types';

const rasiDrugIds = new Set([
  'enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril',
  'losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan',
]);
const sglt2iDrugIds = new Set(['dapagliflozin', 'empagliflozin', 'canagliflozin']);
const nsaidDrugIds = new Set(['ibuprofen', 'meloxicam', 'celecoxib', 'diclofenac', 'naproxen', 'etoricoxib', 'piroxicam', 'ketorolac']);
const steroidalMraIds = new Set(['spironolactone', 'eplerenone']);
const statinIds = new Set(['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin']);
const diureticIds = new Set(['furosemide', 'torasemide', 'bumetanide', 'hydrochlorothiazide', 'indapamide', 'chlorthalidone']);
const nonDoseActions = new Set(['STOP', 'AVOID', 'HOLD', 'DEFER', 'REFER']);

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('Module ckd - Randomized Safety Invariants (>= 10,000 cases)', () => {
  const rng = pseudoRandom(20261027);
  const NUM_CASES = 10000;

  it(`ckd invariants: kiểm tra 23 bất biến an toàn tuyệt đối trên ${NUM_CASES.toLocaleString()} ca ngẫu nhiên`, () => {
    let violations = 0;
    const violationLog: string[] = [];

    for (let i = 0; i < NUM_CASES; i++) {
      const age = Math.floor(18 + rng() * 75);
      const sex = rng() > 0.5 ? 'male' : 'female';
      const weight = Math.floor(40 + rng() * 80);
      const height = Math.floor(145 + rng() * 40);
      const scr = Math.floor(45 + rng() * 750);
      const k = Number((3.0 + rng() * 5.2).toFixed(1));
      const sbp = Math.floor(80 + rng() * 120);
      const dbp = Math.floor(50 + rng() * 60);
      const uacr = Number((0.5 + rng() * 120).toFixed(1));
      const hco3 = Math.floor(6 + rng() * 26);

      const isDm = rng() > 0.4;
      const isHtn = rng() > 0.3;
      const isHf = rng() > 0.7;
      const onDialysis = rng() < 0.08;
      const isPregnant = sex === 'female' && age < 45 && rng() < 0.15;
      const priorAngioedema = rng() < 0.08;

      const currentMeds: CurrentMed[] = [];
      const omitMedNames = rng() < 0.35;
      if (rng() < 0.28) currentMeds.push({ drugId: 'dapagliflozin', name: omitMedNames ? undefined : 'Forxiga 10 mg', dose: 10, unit: 'mg' });
      if (rng() < 0.32) currentMeds.push({ drugId: 'losartan', name: omitMedNames ? undefined : 'Cozaar 50 mg', dose: 50, unit: 'mg' });
      if (rng() < 0.18) currentMeds.push({ drugId: 'perindopril', name: omitMedNames ? undefined : 'Coversyl 5 mg', dose: 5, unit: 'mg' });
      if (rng() < 0.10) currentMeds.push({ drugId: 'sacubitril_valsartan', name: omitMedNames ? undefined : 'Entresto 100 mg', dose: 100, unit: 'mg' });
      if (rng() < 0.14) currentMeds.push({ drugId: 'finerenone', name: omitMedNames ? undefined : 'Kerendia 10 mg', dose: 10, unit: 'mg' });
      if (rng() < 0.08) currentMeds.push({ drugId: 'spironolactone', name: omitMedNames ? undefined : 'Spironolactone 25 mg', dose: 25, unit: 'mg' });
      if (rng() < 0.12) currentMeds.push({ drugId: 'meloxicam', name: omitMedNames ? undefined : 'Mobic 7.5 mg', dose: 7.5, unit: 'mg' });
      if (rng() < 0.12) currentMeds.push({ drugId: 'furosemide', name: omitMedNames ? undefined : 'Lasix 40 mg', dose: 40, unit: 'mg' });
      if (rng() < 0.15) currentMeds.push({ drugId: 'atorvastatin', name: omitMedNames ? undefined : 'Lipitor 20 mg', dose: 20, unit: 'mg' });
      if (rng() < 0.22) currentMeds.push({ drugId: 'metformin', name: omitMedNames ? undefined : 'Metformin 850 mg', dose: 850, unit: 'mg' });
      if (rng() < 0.08) currentMeds.push({ drugId: 'patiromer', name: omitMedNames ? undefined : 'Veltassa 8.4 g', dose: 8.4, unit: 'g' });
      if (rng() < 0.08) currentMeds.push({ drugId: 'sodium_bicarbonate', name: omitMedNames ? undefined : 'Natri Bicarbonat', dose: 1000, unit: 'mg' });

      const conditions: PatientConditions = {
        ckd: true,
        dm: isDm,
        htn: isHtn,
        hf: isHf,
        onDialysis,
        pregnant: isPregnant,
        priorAngioedema,
      };

      const isOutpatient = rng() > 0.35;
      const isAki = isOutpatient ? rng() < 0.06 : rng() < 0.25;
      const urineRate = !isOutpatient && rng() < 0.1 ? 'oliguria_6h' : !isOutpatient && rng() < 0.05 ? 'anuria_12h' : 'normal';
      const baselineScr = isAki ? Math.floor(scr * 0.6) : scr;
      const lvef = isHf ? (rng() < 0.5 ? 32 : 52) : undefined;

      const patient: Patient = {
        id: `gen_${i}`,
        name: `Random Patient ${i}`,
        age,
        sex,
        weight,
        height,
        scr,
        k,
        sbp,
        dbp,
        lvef,
        uacr,
        hco3,
        conditions,
        currentMeds,
        selectedModules: ['ckd'],
        customInputs: {
          akiSuspected: isAki,
          urineOutputRate: urineRate,
          baselineScr,
        },
      };

      const profileRoll = rng();
      const settings: Settings = {
        setting: isOutpatient ? 'outpatient' : 'inpatient',
        profile: profileRoll < 0.4 ? 'INTL' : profileRoll < 0.8 ? 'VN' : 'US',
        units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
        score2Region: 'high',
        fontScale: 'normal',
        theme: 'light',
        onlyReviewed: false,
      };

      const plan = evaluate(patient, settings);
      const recs = plan.recommendations;
      const derived = derivePatientData(normalizePatientUnits(patient, settings.units), settings);
      const egfr = derived.egfr;

      if (egfr !== undefined && egfr < 20) {
        if (recs.some((r) => r.drugId && sglt2iDrugIds.has(r.drugId.toLowerCase()) && r.action === 'START')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 1: Khởi trị SGLT2i khi eGFR = ${egfr} < 20`);
        }
      }

      if (onDialysis) {
        if (recs.some((r) => r.drugId && sglt2iDrugIds.has(r.drugId.toLowerCase()) && (r.action === 'START' || r.action === 'CONTINUE'))) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 2: Chỉ định SGLT2i khi đang lọc máu`);
        }
      }

      if (isPregnant) {
        const startTeratogen = recs.find(
          (r) =>
            r.drugId &&
            (sglt2iDrugIds.has(r.drugId.toLowerCase()) ||
              rasiDrugIds.has(r.drugId.toLowerCase()) ||
              r.drugId.toLowerCase() === 'finerenone') &&
            (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE')
        );
        if (startTeratogen) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 3: Chỉ định ${startTeratogen.drugId} cho phụ nữ mang thai`);
        }
      }

      if (sbp < 100 && recs.some((r) => r.drugId && sglt2iDrugIds.has(r.drugId.toLowerCase()) && r.action === 'START')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 4: Khởi trị SGLT2i khi SBP = ${sbp} < 100`);
      }

      if (k > 5.0 && recs.some((r) => r.drugId && rasiDrugIds.has(r.drugId.toLowerCase()) && (r.action === 'START' || r.action === 'UPTITRATE'))) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 5: Khởi trị/Tăng liều RASi khi K+ = ${k} > 5.0`);
      }

      if ((k > 5.0 || (egfr !== undefined && egfr < 25)) && recs.some((r) => r.drugId === 'finerenone' && (r.action === 'START' || r.action === 'CONSIDER'))) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 6: Khởi trị Finerenone khi K+ = ${k} hoặc eGFR = ${egfr}`);
      }

      const hasAcei = currentMeds.some((m) => ['enalapril', 'perindopril', 'lisinopril', 'ramipril', 'captopril'].includes(m.drugId.toLowerCase()));
      const hasArb = currentMeds.some((m) => ['losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan'].includes(m.drugId.toLowerCase()));
      const hasArni = currentMeds.some((m) => m.drugId.toLowerCase() === 'sacubitril_valsartan');
      if ((hasAcei && hasArb) || (hasArni && (hasAcei || hasArb))) {
        const stopOrHoldRasi = recs.find(
          (r) => r.drugId && rasiDrugIds.has(r.drugId.toLowerCase()) && (r.action === 'STOP' || r.action === 'AVOID' || r.action === 'HOLD')
        );
        if (!stopOrHoldRasi) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 7: Đang dùng đồng thời nhiều thuốc RAA nhưng không STOP/AVOID/HOLD`);
        }
      }

      const hasNsaid = currentMeds.some((m) => nsaidDrugIds.has(m.drugId.toLowerCase()));
      if (hasNsaid) {
        const hasRasiOrArni = hasAcei || hasArb || hasArni;
        const hasDiuretic = currentMeds.some((m) => diureticIds.has(m.drugId.toLowerCase()));
        const mustHardStop = (egfr !== undefined && egfr < 30) || (hasRasiOrArni && hasDiuretic) || isAki || urineRate !== 'normal';
        const nsaidRec = recs.find((r) => r.drugId && nsaidDrugIds.has(r.drugId.toLowerCase()));
        if (!nsaidRec || (mustHardStop && nsaidRec.action !== 'STOP' && nsaidRec.action !== 'AVOID') || (!mustHardStop && nsaidRec.action !== 'AVOID' && nsaidRec.action !== 'STOP')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 8: NSAID action ${nsaidRec?.action ?? 'MISSING'}`);
        }
      }

      if (priorAngioedema && recs.some((r) => r.drugId && rasiDrugIds.has(r.drugId.toLowerCase()) && (r.action === 'START' || r.action === 'UPTITRATE'))) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 10: Khởi trị RASi khi có tiền sử phù mạch`);
      }

      if (isOutpatient && k >= 6.0 && !recs.some((r) => r.action === 'REFER')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 11: Ngoại trú K+ = ${k} >= 6.0 thiếu REFER`);
      }

      if (!isOutpatient && hco3 >= 10 && k < 6.5 && urineRate !== 'anuria_12h' && recs.some((r) => r.id === 'rec_ckd_emergency_rrt')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 12: Chỉ định lọc máu cấp cứu sai khi HCO3- = ${hco3}`);
      }

      const isAkiTriggered =
        isAki || urineRate !== 'normal' || scr - baselineScr >= 26.5 || (baselineScr > 0 && scr / baselineScr >= 1.5);
      const isOutpatientCrisis = sbp < 90 || k >= 6.0 || hco3 < 12;
      const hasStatinInMeds = currentMeds.some((m) => statinIds.has(m.drugId.toLowerCase()));
      const hasRealCkd = (egfr !== undefined && egfr < 60) || uacr >= 3.0;
      if (isOutpatient && age >= 50 && hasRealCkd && !onDialysis && !isPregnant && !hasStatinInMeds && !isAkiTriggered && !isOutpatientCrisis) {
        if (!recs.some((r) => (r.drugId === 'atorvastatin' || r.drugId === 'rosuvastatin') && r.action === 'START')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 14: Thiếu chỉ định Statin cho BN ổn định ${age} tuổi có CKD`);
        }
      }
      if (isOutpatient && (isOutpatientCrisis || isAkiTriggered) && !isPregnant && !recs.some((r) => r.action === 'REFER')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 14b: Ngoại trú cấp cứu / AKI thiếu REFER`);
      }

      if (!isOutpatient && k >= 6.5 && !recs.some((r) => r.id === 'rec_ckd_hyperkalemia_severe_bundle' && r.action === 'START')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 15: Kali nội trú = ${k} >= 6.5 thiếu gói cấp cứu UKKA`);
      }

      const hasTeratogenInMeds = currentMeds.some(
        (m) =>
          rasiDrugIds.has(m.drugId.toLowerCase()) ||
          m.drugId.toLowerCase() === 'sacubitril_valsartan' ||
          sglt2iDrugIds.has(m.drugId.toLowerCase()) ||
          m.drugId.toLowerCase() === 'finerenone' ||
          steroidalMraIds.has(m.drugId.toLowerCase()) ||
          statinIds.has(m.drugId.toLowerCase())
      );
      if (isPregnant && hasTeratogenInMeds && !recs.some((r) => r.id === 'rec_ckd_pregnancy_stop_teratogens' && r.action === 'STOP')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 16: Mang thai đang dùng thuốc độc thai thiếu STOP`);
      }

      const hasSteroidalMra = currentMeds.some((m) => steroidalMraIds.has(m.drugId.toLowerCase()));
      const hasFineInMeds = currentMeds.some((m) => m.drugId.toLowerCase() === 'finerenone');
      if (hasSteroidalMra && !hasFineInMeds && recs.some((r) => r.drugId === 'finerenone' && r.action === 'START')) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 17a: Khởi trị Finerenone chồng lên MRA steroid`);
      }
      if (hasSteroidalMra && hasFineInMeds && !recs.some((r) => r.drugId === 'finerenone' && (r.action === 'STOP' || r.action === 'AVOID'))) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 17b: Finerenone + Spironolactone không STOP`);
      }
      if (((lvef !== undefined && lvef <= 40) || onDialysis) && recs.some((r) => r.drugId === 'finerenone' && (r.action === 'START' || r.action === 'CONSIDER'))) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 20a: Khởi trị Finerenone ở HFrEF/lọc máu`);
      }
      if (egfr !== undefined && egfr < 15 && hasFineInMeds && recs.some((r) => r.drugId === 'finerenone' && (r.action === 'CONTINUE' || r.action === 'UPTITRATE' || r.action === 'START'))) {
        violations++;
        violationLog.push(`[Ca ${i}] Vi phạm 22: CKD G5 nhưng Finerenone vẫn duy trì/tăng liều`);
      }

      if (!isOutpatient && isAkiTriggered) {
        for (const m of currentMeds) {
          const idLow = m.drugId.toLowerCase();
          const isSickDay =
            sglt2iDrugIds.has(idLow) ||
            rasiDrugIds.has(idLow) ||
            idLow === 'sacubitril_valsartan' ||
            idLow === 'finerenone' ||
            steroidalMraIds.has(idLow) ||
            idLow === 'metformin';
          if (isSickDay) {
            const medRec = recs.find((r) => r.drugId?.toLowerCase() === idLow);
            if (!medRec || (medRec.action !== 'HOLD' && medRec.action !== 'STOP' && medRec.action !== 'AVOID')) {
              violations++;
              violationLog.push(`[Ca ${i}] Vi phạm 18b: Nội viện AKI nhưng thuốc ngày ốm ${idLow} có action ${medRec?.action ?? 'MISSING'}`);
            }
          }
        }
      }

      for (const r of recs) {
        const textCheck = `${r.title} ${r.rationale} ${r.gates.map((g) => g.messageVi).join(' ')}`;
        if (textCheck.includes('undefined')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 19: Chuỗi 'undefined' rò rỉ trong ${r.id}`);
        }
        if (r.module === 'ckd' && nonDoseActions.has(r.action) && r.dose !== undefined) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 23 (CKD-R4-R2-08): Khuyến cáo ${r.id} (${r.action}) còn mang dose=${JSON.stringify(r.dose)}`);
        }
      }

      if (k < 3.5 && currentMeds.some((m) => m.drugId === 'patiromer')) {
        const binderRec = recs.find((r) => r.drugId === 'patiromer');
        if (!binderRec || (binderRec.action !== 'STOP' && binderRec.action !== 'AVOID')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 21a: K+ = ${k} < 3.5 nhưng không STOP patiromer`);
        }
      }
      if (isOutpatient && hco3 < 12 && !currentMeds.some((m) => m.drugId === 'sodium_bicarbonate')) {
        if (recs.some((r) => r.drugId === 'sodium_bicarbonate' && r.action === 'START')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 21b: Ngoại trú HCO3- = ${hco3} < 12 nhưng vẫn kê viên uống NaHCO3`);
        }
      }
      if (hco3 > 26 && currentMeds.some((m) => m.drugId === 'sodium_bicarbonate')) {
        const bicarbRec = recs.find((r) => r.drugId === 'sodium_bicarbonate');
        if (!bicarbRec || (bicarbRec.action !== 'HOLD' && bicarbRec.action !== 'STOP' && bicarbRec.action !== 'AVOID')) {
          violations++;
          violationLog.push(`[Ca ${i}] Vi phạm 21c: HCO3- = ${hco3} > 26 nhưng không HOLD/STOP NaHCO3`);
        }
      }
    }

    if (violations > 0) {
      console.error(`Phát hiện ${violations} vi phạm bất biến:\n`, violationLog.slice(0, 10));
    }
    expect(violations).toBe(0);
  }, 120000);
});
