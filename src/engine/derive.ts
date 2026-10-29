/**
 * GDMT-VN Clinical Derivations (Derived values)
 * Phân quyền: Agent B
 * 
 * Tính toán các chỉ số phái sinh từ hồ sơ bệnh nhân chuẩn hóa.
 * Tái sử dụng trực tiếp các máy tính lâm sàng từ `src/engine/calculators/` làm nguồn sự thật duy nhất.
 */

import type { Patient, Settings, Derived } from './types';
import { computeBmi } from './calculators/bmi';
import { computeBp } from './calculators/bp';
import { computeEgfr, calculateEgfrCys } from './calculators/egfr';
import { computeCrcl } from './calculators/crcl';
import { computeKdigo } from './calculators/kdigo';
import { computeCha2ds2va } from './calculators/cha2ds2va';
import { computeGold, classifyGoldGrade } from './calculators/gold';

export function derivePatientData(patient: Patient, _settings?: Settings): Derived {
  const derived: Derived = {};

  // 1. BMI & BSA (Mosteller)
  if (patient.weight && patient.height) {
    const bmiRes = computeBmi({ weight: patient.weight, height: patient.height });
    derived.bmi = bmiRes.bmi;
    derived.bsa = bmiRes.bsa;
  }

  // 2. Huyết áp trung bình (MAP)
  if (patient.sbp !== undefined && patient.dbp !== undefined) {
    const bpRes = computeBp({ sbp: patient.sbp, dbp: patient.dbp });
    derived.map = bpRes.meanArterialPressure;
  }

  // 3. eGFR CKD-EPI 2021 (hoặc CKD-EPI 2012 Cystatin C độc lập khi chưa có SCr)
  if (patient.scr !== undefined && patient.age !== undefined && patient.sex !== undefined) {
    const egfrRes = computeEgfr({
      scr: patient.scr,
      scrUnit: 'umol/L',
      age: patient.age,
      sex: patient.sex,
      cystatinC: patient.cystatinC
    });
    if (egfrRes.egfrCr !== null) derived.egfrCr = egfrRes.egfrCr;
    if (egfrRes.egfrCys !== null) derived.egfrCys = egfrRes.egfrCys;
    derived.egfr = egfrRes.recommendedEgfr ?? undefined;
  } else if (
    patient.cystatinC !== undefined &&
    patient.cystatinC > 0 &&
    patient.age !== undefined &&
    patient.sex !== undefined
  ) {
    const cysOnly = calculateEgfrCys(patient.cystatinC, patient.age, patient.sex);
    if (cysOnly !== null) {
      derived.egfrCys = cysOnly;
      derived.egfr = cysOnly;
    }
  }

  // CKD-R3-R2-05: Bảo toàn patient.egfr (hoặc customInputs.egfr) truyền trực tiếp khi thiếu SCr và Cystatin C
  if (derived.egfr === undefined) {
    const directEgfr =
      patient.egfr !== undefined && Number.isFinite(patient.egfr) && patient.egfr > 0
        ? patient.egfr
        : typeof patient.customInputs?.egfr === 'number' &&
            Number.isFinite(patient.customInputs.egfr) &&
            patient.customInputs.egfr > 0
          ? patient.customInputs.egfr
          : undefined;
    if (directEgfr !== undefined) {
      derived.egfr = directEgfr;
    }
  }

  // 4. CrCl Cockcroft-Gault (AF-R2-R1-04: dùng cân nặng thực tế actual body weight chuẩn 4 thử nghiệm DOAC, không tự bịa chiều cao 165 cm)
  if (patient.scr !== undefined && patient.age !== undefined && patient.weight !== undefined && patient.sex !== undefined) {
    const crclRes = computeCrcl({
      scr: patient.scr,
      scrUnit: 'umol/L',
      age: patient.age,
      weight: patient.weight,
      height: patient.height !== undefined && patient.height > 0 ? patient.height : undefined,
      sex: patient.sex
    });
    derived.crcl = crclRes.crclActual ?? undefined;
    if (crclRes.crclAdjusted !== null) {
      derived.crclAbw = crclRes.crclAdjusted;
    }
    if (crclRes.warning) {
      derived.crclWarning = crclRes.warning;
    }
  }

  // 5. Phân độ KDIGO G & A & Heatmap
  if (derived.egfr !== undefined && patient.uacr !== undefined) {
    const kdigoRes = computeKdigo({
      egfr: derived.egfr,
      uacr: patient.uacr,
      uacrUnit: 'mg/mmol'
    });
    derived.kdigoG = kdigoRes.gStage;
    derived.ckdGStage = kdigoRes.gStage;
    derived.kdigoA = kdigoRes.aStage;
    derived.kdigoColor = kdigoRes.heatmapColor;
  } else if (derived.egfr !== undefined) {
    if (derived.egfr >= 90) derived.kdigoG = 'G1';
    else if (derived.egfr >= 60) derived.kdigoG = 'G2';
    else if (derived.egfr >= 45) derived.kdigoG = 'G3a';
    else if (derived.egfr >= 30) derived.kdigoG = 'G3b';
    else if (derived.egfr >= 15) derived.kdigoG = 'G4';
    else derived.kdigoG = 'G5';
    derived.ckdGStage = derived.kdigoG;
  } else if (patient.uacr !== undefined) {
    if (patient.uacr < 3) derived.kdigoA = 'A1';
    else if (patient.uacr <= 30) derived.kdigoA = 'A2';
    else derived.kdigoA = 'A3';
  }

  // 6. CHA2DS2-VA (ESC 2024 AF Guidelines)
  if (patient.age !== undefined && patient.sex !== undefined) {
    const cond = patient.conditions || {};
    const chaRes = computeCha2ds2va({
      age: patient.age,
      sex: patient.sex,
      chf: Boolean(cond.hf || cond.heartFailure),
      hypertension: Boolean(cond.htn || cond.hypertension || (patient.sbp && patient.sbp >= 140)),
      strokeOrTia: Boolean(cond.strokeOrTia || cond.stroke || cond.tia || cond.stroke_tia),
      vascularDisease: Boolean(cond.ascvd || cond.vascularDisease || cond.cad || cond.pad),
      diabetes: Boolean(cond.dm || cond.diabetes || (patient.hba1c && patient.hba1c >= 6.5))
    });
    derived.cha2ds2va = chaRes.scoreVa;
  }

  // 7. Phân độ GOLD 2026 COPD (Grade 1-4 & Group A/B/E) - Fail-closed: không giả định ?? 0 khi thiếu đợt cấp và không phân độ GOLD khi FEV1/FVC >= 0.70
  const fev1PctVal =
    patient.fev1Pct ??
    (typeof patient.customInputs?.fev1PredPct === 'number' ? patient.customInputs.fev1PredPct : undefined) ??
    (typeof patient.customInputs?.fev1Pct === 'number' ? patient.customInputs.fev1Pct : undefined);
  if (fev1PctVal !== undefined && fev1PctVal > 0 && fev1PctVal <= 150) {
    const customRatio =
      typeof patient.customInputs?.fev1FvcRatio === 'number' ? patient.customInputs.fev1FvcRatio : undefined;
    const postBdrRatio =
      customRatio ??
      (patient.fev1 && patient.fvc ? Number((patient.fev1 / patient.fvc).toFixed(2)) : undefined);

    // GOLD 2026: Chỉ xác định COPD và phân độ / phân nhóm GOLD khi có bằng chứng tắc nghẽn cố định sau giãn phế quản (FEV1/FVC < 0.70)
    if (postBdrRatio !== undefined && postBdrRatio < 0.7) {
      derived.goldGrade = classifyGoldGrade(fev1PctVal).grade;

      const modExac =
        patient.copdExacerbations ??
        (typeof patient.customInputs?.moderateExacerbations === 'number'
          ? patient.customInputs.moderateExacerbations
          : undefined) ??
        (typeof patient.customInputs?.exacerbationsLastYear === 'number'
          ? patient.customInputs.exacerbationsLastYear
          : undefined);
      const hospExac =
        (typeof patient.customInputs?.hospitalizations === 'number'
          ? patient.customInputs.hospitalizations
          : undefined) ??
        (typeof patient.customInputs?.hospitalizationsLastYear === 'number'
          ? patient.customInputs.hospitalizationsLastYear
          : undefined) ??
        (typeof patient.customInputs?.severeExacerbationLastYear === 'number'
          ? patient.customInputs.severeExacerbationLastYear
          : undefined);
      const mmrcVal =
        patient.mmrc ??
        (typeof patient.customInputs?.mmrc === 'number' ? patient.customInputs.mmrc : undefined) ??
        (typeof patient.customInputs?.mmrcScore === 'number' ? patient.customInputs.mmrcScore : undefined);
      const catVal =
        patient.cat ??
        (typeof patient.customInputs?.cat === 'number' ? patient.customInputs.cat : undefined) ??
        (typeof patient.customInputs?.catScore === 'number' ? patient.customInputs.catScore : undefined);

      const resolvedHospExac =
        hospExac ?? (patient.copdExacerbations !== undefined ? 0 : undefined);

      const goldRes = computeGold({
        fev1PredPct: fev1PctVal,
        fev1FvcRatio: postBdrRatio,
        exacerbationsPastYear: modExac,
        hospitalizationsPastYear: resolvedHospExac,
        mmrc: mmrcVal,
        cat: catVal
      });
      derived.goldGroup = goldRes.group ?? undefined;
    }
  }

  return derived;
}
