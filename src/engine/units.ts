/**
 * GDMT-VN Clinical Unit Conversion Utilities
 * Phân quyền: Agent B
 * 
 * Chuẩn SI làm đơn vị chuẩn nội bộ của engine:
 * - Creatinin: µmol/L
 * - Glucose: mmol/L
 * - Cholesterol (TC, HDL, LDL): mmol/L
 * - Triglyceride: mmol/L
 * - Acid uric: µmol/L
 * - UACR: mg/mmol
 * - HbA1c: %
 */

import type { Patient, UnitSettings, ModuleInputField } from './types';

// Các hằng số chuyển đổi theo quy chuẩn quốc tế
export const CR_CONVERSION_FACTOR = 88.42; // 1 mg/dL = 88.42 µmol/L (khớp chính xác CKD-EPI / Apixaban 1.5 mg/dL = 132.63 µmol/L)
export const GLUCOSE_CONVERSION_FACTOR = 18.0; // 1 mmol/L = 18 mg/dL
export const CHOL_CONVERSION_FACTOR = 38.67; // 1 mmol/L = 38.67 mg/dL
export const TG_CONVERSION_FACTOR = 88.57; // 1 mmol/L = 88.57 mg/dL
export const URAT_CONVERSION_FACTOR = 59.48; // 1 mg/dL = 59.48 µmol/L
export const UACR_CONVERSION_FACTOR = 8.84; // 1 mg/mmol = 8.84 mg/g (xấp xỉ 10 mg/g)

// Creatinin (độ chính xác 2 chữ số thập phân để 1.5 mg/dL = 132.63 µmol/L bảo toàn 1.5000 mg/dL)
export function crMgDlToUmolL(val: number): number {
  return Number((val * CR_CONVERSION_FACTOR).toFixed(2));
}
export function crUmolLToMgDl(val: number): number {
  return Number((val / CR_CONVERSION_FACTOR).toFixed(2));
}

// Glucose
export function glucoseMgDlToMmolL(val: number): number {
  return Number((val / GLUCOSE_CONVERSION_FACTOR).toFixed(2));
}
export function glucoseMmolLToMgDl(val: number): number {
  return Number((val * GLUCOSE_CONVERSION_FACTOR).toFixed(1));
}

// Cholesterol (TC, HDL, LDL) - LIPID-R2-R3-10: độ chính xác 4 chữ số thập phân tránh lệch biên 55/70/100 mg/dL
export function cholMgDlToMmolL(val: number): number {
  return Number((val / CHOL_CONVERSION_FACTOR).toFixed(4));
}
export function cholMmolLToMgDl(val: number): number {
  return Number((val * CHOL_CONVERSION_FACTOR).toFixed(1));
}

// Triglycerides - LIPID-R2-R3-10: độ chính xác 4 chữ số thập phân
export function tgMgDlToMmolL(val: number): number {
  return Number((val / TG_CONVERSION_FACTOR).toFixed(4));
}
export function tgMmolLToMgDl(val: number): number {
  return Number((val * TG_CONVERSION_FACTOR).toFixed(1));
}

// Urat (Acid Uric)
export function uratMgDlToUmolL(val: number): number {
  return Number((val * URAT_CONVERSION_FACTOR).toFixed(1));
}
export function uratUmolLToMgDl(val: number): number {
  return Number((val / URAT_CONVERSION_FACTOR).toFixed(2));
}

// UACR
export function uacrMgGToMgMmol(val: number): number {
  return Number((val / UACR_CONVERSION_FACTOR).toFixed(2));
}
export function uacrMgMmolToMgG(val: number): number {
  return Number((val * UACR_CONVERSION_FACTOR).toFixed(1));
}

// HbA1c: % (NGSP) ↔ mmol/mol (IFCC)
// IFCC = (NGSP - 2.15) * 10.929
// NGSP = (IFCC / 10.929) + 2.15
export function hba1cPercentToMmolMol(percent: number): number {
  return Math.round((percent - 2.15) * 10.929);
}
export function hba1cMmolMolToPercent(mmolMol: number): number {
  return Number(((mmolMol / 10.929) + 2.15).toFixed(1));
}

const BUILTIN_CUSTOM_UNIT_KEYS: Record<string, keyof UnitSettings> = {
  baselineScr: 'cr',
  baselineLdl: 'lipid',
  nonHdl: 'lipid',
  urate: 'urat',
  uricAcid: 'urat'
};

function convertByUnitKey(
  val: number,
  unitKey: keyof UnitSettings,
  units: UnitSettings,
  fieldKey?: string
): number {
  switch (unitKey) {
    case 'cr':
      return units.cr === 'mg_dL' ? crMgDlToUmolL(val) : val;
    case 'glucose':
      return units.glucose === 'mg_dL' ? glucoseMgDlToMmolL(val) : val;
    case 'lipid': {
      const kLower = (fieldKey || '').toLowerCase();
      if (kLower === 'tg' || kLower.includes('triglycerid')) {
        return units.lipid === 'mg_dL' ? tgMgDlToMmolL(val) : val;
      }
      return units.lipid === 'mg_dL' ? cholMgDlToMmolL(val) : val;
    }
    case 'urat':
      return units.urat === 'mg_dL' ? uratMgDlToUmolL(val) : val;
    case 'uacr':
      return units.uacr === 'mg_g' ? uacrMgGToMgMmol(val) : val;
    case 'hba1c':
      return units.hba1c === 'mmol_mol' ? hba1cMmolMolToPercent(val) : val;
    default:
      return val;
  }
}

/**
 * Chuẩn hóa bệnh nhân về đơn vị SI chuẩn để engine xử lý thống nhất
 * (bao gồm cả các trường số trong `customInputs` có khai báo `unitKey`).
 */
export function normalizePatientUnits(
  patient: Patient,
  units: UnitSettings,
  inputFields?: readonly ModuleInputField[]
): Patient {
  const conds = { ...patient.conditions };
  const rawCi = patient.customInputs || {};
  // CKD-R2-R3-16: Đồng bộ dự phòng an toàn từ customInputs (khi truyền trực tiếp boolean true) cho các cờ sống còn
  if (rawCi.pregnant === true || rawCi.pregnancy === true) {
    conds.pregnant = true;
    conds.pregnancy = true;
  }
  if (rawCi.breastfeeding === true || rawCi.lactation === true || rawCi.nursing === true) {
    conds.breastfeeding = true;
  }
  if (
    rawCi.angioedemaHistory === true ||
    rawCi.aceiAngioedema === true ||
    rawCi.historyOfAngioedema === true ||
    rawCi.hereditaryAngioedema === true
  ) {
    conds.priorAngioedema = true;
  }
  for (const criticalKey of [
    'onDialysis',
    'priorAngioedema',
    'frailty',
    'limitedLifespan',
    'plannedSurgery',
    'aki',
    'decompensatedCirrhosis',
    'activeLiverDisease',
    'wpw',
    'preExcitedAf',
    'avBlock2Or3',
    'sickSinusSyndrome',
    'pacemaker',
    'cardiogenicShock',
    'activeBleeding',
    'dkaSuspected'
  ] as const) {
    if (rawCi[criticalKey] === true && conds[criticalKey] === undefined) {
      conds[criticalKey] = true;
    }
  }
  if (rawCi.akiSuspected === true) {
    conds.aki = true;
  }
  if (
    rawCi.mtcMen2History === true ||
    rawCi.historyMtcOrMen2 === true ||
    rawCi.mtc === true ||
    rawCi.men2 === true ||
    rawCi.medullary_thyroid_carcinoma === true
  ) {
    conds.mtc = true;
    conds.men2 = true;
    conds.medullary_thyroid_carcinoma = true;
  }
  if (
    rawCi.historyPancreatitis === true ||
    rawCi.pancreatitis === true ||
    rawCi.acutePancreatitis === true ||
    rawCi.acute_pancreatitis === true
  ) {
    conds.pancreatitis = true;
  }
  // DATA-01: Kiểm tra xung đột nhịp ECG giữa patient.rhythm và customInputs.rhythm (fail-closed)
  const rawCiRhythm =
    typeof rawCi.rhythm === 'string' && rawCi.rhythm.trim() !== ''
      ? (rawCi.rhythm.trim() as Patient['rhythm'])
      : undefined;
  const hasRhythmConflict =
    patient.rhythm !== undefined &&
    rawCiRhythm !== undefined &&
    patient.rhythm !== rawCiRhythm;
  const effectiveRhythm: Patient['rhythm'] = hasRhythmConflict
    ? undefined
    : (patient.rhythm ?? rawCiRhythm);

  // Đồng bộ đồng nghĩa hai chiều an toàn cho các cờ bệnh lý phổ biến
  if (conds.pregnant || conds.pregnancy || conds.severePreeclampsiaEclampsia) {
    conds.pregnant = true;
    conds.pregnancy = true;
  }
  if (conds.af || conds.afib || effectiveRhythm === 'afib') {
    conds.af = true;
    conds.afib = true;
  }
  if (
    conds.cirrhosis ||
    conds.liver_disease ||
    conds.liverDisease ||
    conds.decompensatedCirrhosis ||
    conds.activeLiverDisease
  ) {
    conds.liverDisease = true;
    conds.liver_disease = true;
  }
  if (conds.mtc || conds.men2 || conds.medullary_thyroid_carcinoma) {
    conds.mtc = true;
    conds.men2 = true;
    conds.medullary_thyroid_carcinoma = true;
  }
  if (conds.vascularDisease || conds.cad || conds.pad || conds.recentAcs || conds.recurrentAcsWithin2Years) {
    conds.ascvd = true;
  }
  if (conds.stroke || conds.tia || conds.stroke_tia) {
    conds.strokeOrTia = true;
  }
  if (conds.diabetes) {
    conds.dm = true;
  }
  if (conds.heartFailure) {
    conds.hf = true;
  }
  if (conds.hypertension) {
    conds.htn = true;
  }

  const customUnitMap = new Map<string, keyof UnitSettings>(
    Object.entries(BUILTIN_CUSTOM_UNIT_KEYS)
  );
  if (inputFields) {
    for (const f of inputFields) {
      if (f.unitKey) {
        customUnitMap.set(f.id, f.unitKey);
        const stripped = f.id.replace(/^(customInputs|patient)\./, '');
        customUnitMap.set(stripped, f.unitKey);
      }
    }
  }

  let normalizedCustomInputs: Patient['customInputs'];
  if (patient.customInputs) {
    normalizedCustomInputs = { ...patient.customInputs };
    for (const [k, rawVal] of Object.entries(normalizedCustomInputs)) {
      const unitKey = customUnitMap.get(k) ?? customUnitMap.get(`customInputs.${k}`);
      if (!unitKey) continue;
      if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
        normalizedCustomInputs[k] = convertByUnitKey(rawVal, unitKey, units, k);
      } else if (typeof rawVal === 'string' && rawVal.trim() !== '' && Number.isFinite(Number(rawVal))) {
        normalizedCustomInputs[k] = convertByUnitKey(Number(rawVal), unitKey, units, k);
      }
    }
  }

  if (hasRhythmConflict && normalizedCustomInputs) {
    delete normalizedCustomInputs.rhythm;
  }

  const norm: Patient = {
    ...patient,
    rhythm: effectiveRhythm,
    conditions: conds,
    selectedModules: Array.isArray(patient.selectedModules) ? [...patient.selectedModules] : [],
    currentMeds: Array.isArray(patient.currentMeds) ? [...patient.currentMeds] : [],
    customInputs: normalizedCustomInputs
  };

  // DATA-01: Di trú an toàn các trường chuẩn bị lưu nhầm vào customInputs ở phiên bản cũ (khi trường cấp cao nhất đang trống)
  // và khóa an toàn (fail-closed) nếu xảy ra xung đột trực tiếp trên lvef / nyha
  if (normalizedCustomInputs) {
    const rawCiLvef =
      typeof normalizedCustomInputs.lvef === 'number' && Number.isFinite(normalizedCustomInputs.lvef)
        ? normalizedCustomInputs.lvef
        : undefined;
    if (norm.lvef !== undefined && rawCiLvef !== undefined && norm.lvef !== rawCiLvef) {
      norm.lvef = undefined;
      delete normalizedCustomInputs.lvef;
    } else if (norm.lvef === undefined && rawCiLvef !== undefined) {
      norm.lvef = rawCiLvef;
    }

    const rawCiNyha =
      typeof normalizedCustomInputs.nyha === 'number' &&
      (normalizedCustomInputs.nyha === 1 ||
        normalizedCustomInputs.nyha === 2 ||
        normalizedCustomInputs.nyha === 3 ||
        normalizedCustomInputs.nyha === 4)
        ? (normalizedCustomInputs.nyha as 1 | 2 | 3 | 4)
        : undefined;
    if (norm.nyha !== undefined && rawCiNyha !== undefined && norm.nyha !== rawCiNyha) {
      norm.nyha = undefined;
      delete normalizedCustomInputs.nyha;
    } else if (norm.nyha === undefined && rawCiNyha !== undefined) {
      norm.nyha = rawCiNyha;
    }

    const numericFallbackPairs: Array<[keyof Patient, string[]]> = [
      ['qtc', ['qtc', 'qtcMs']],
      ['spo2', ['spo2']],
      ['pefPct', ['pefPct']],
      ['hb', ['hb']],
      ['na', ['na']],
      ['hco3', ['hco3', 'serumBicarb']],
      ['fev1', ['fev1']],
      ['fev1Pct', ['fev1Pct', 'fev1PredPct']],
      ['fvc', ['fvc']],
      ['mmrc', ['mmrc', 'mmrcScore']],
      ['cat', ['cat', 'catScore']],
      ['nonHdl', ['nonHdl']],
      ['uricAcid', ['uricAcid', 'urate']]
    ];
    for (const [topKey, ciKeys] of numericFallbackPairs) {
      if (norm[topKey] === undefined) {
        for (const ck of ciKeys) {
          const v = normalizedCustomInputs[ck];
          if (typeof v === 'number' && Number.isFinite(v)) {
            (norm as unknown as Record<string, unknown>)[topKey] = v;
            break;
          }
        }
      }
    }
  }

  if (patient.scr !== undefined) {
    norm.scr = units.cr === 'mg_dL' ? crMgDlToUmolL(patient.scr) : patient.scr;
  }
  if (patient.glucose !== undefined) {
    norm.glucose = units.glucose === 'mg_dL' ? glucoseMgDlToMmolL(patient.glucose) : patient.glucose;
  }
  if (patient.tc !== undefined) {
    norm.tc = units.lipid === 'mg_dL' ? cholMgDlToMmolL(patient.tc) : patient.tc;
  }
  if (patient.hdl !== undefined) {
    norm.hdl = units.lipid === 'mg_dL' ? cholMgDlToMmolL(patient.hdl) : patient.hdl;
  }
  if (patient.ldl !== undefined) {
    norm.ldl = units.lipid === 'mg_dL' ? cholMgDlToMmolL(patient.ldl) : patient.ldl;
  }
  if (patient.nonHdl !== undefined) {
    norm.nonHdl = units.lipid === 'mg_dL' ? cholMgDlToMmolL(patient.nonHdl) : patient.nonHdl;
  }
  if (patient.tg !== undefined) {
    norm.tg = units.lipid === 'mg_dL' ? tgMgDlToMmolL(patient.tg) : patient.tg;
  }
  if (patient.uricAcid !== undefined) {
    norm.uricAcid = units.urat === 'mg_dL' ? uratMgDlToUmolL(patient.uricAcid) : patient.uricAcid;
  }
  if (patient.uacr !== undefined) {
    norm.uacr = units.uacr === 'mg_g' ? uacrMgGToMgMmol(patient.uacr) : patient.uacr;
  }
  if (patient.hba1c !== undefined) {
    norm.hba1c = units.hba1c === 'mmol_mol' ? hba1cMmolMolToPercent(patient.hba1c) : patient.hba1c;
  }
  if (norm.eos === undefined) {
    const rawEos = normalizedCustomInputs?.bloodEosinophils ?? normalizedCustomInputs?.bloodEos;
    if (typeof rawEos === 'number' && Number.isFinite(rawEos)) {
      norm.eos = rawEos;
    }
  }

  return norm;
}

function denormalizeValFromSi(
  val: number,
  unitKey: keyof UnitSettings,
  units: UnitSettings,
  fieldKey?: string
): number {
  switch (unitKey) {
    case 'cr':
      // 3 chữ số thập phân để round-trip qua crMgDlToUmolL (165 -> 1.867 -> 165.0) không lệch eGFR
      return units.cr === 'mg_dL' ? Number((val / CR_CONVERSION_FACTOR).toFixed(3)) : val;
    case 'glucose':
      return units.glucose === 'mg_dL' ? glucoseMmolLToMgDl(val) : val;
    case 'lipid': {
      const kLower = (fieldKey || '').toLowerCase();
      if (kLower === 'tg' || kLower.includes('triglycerid')) {
        return units.lipid === 'mg_dL' ? Number((val * TG_CONVERSION_FACTOR).toFixed(2)) : val;
      }
      return units.lipid === 'mg_dL' ? Number((val * CHOL_CONVERSION_FACTOR).toFixed(2)) : val;
    }
    case 'urat':
      return units.urat === 'mg_dL' ? Number((val / URAT_CONVERSION_FACTOR).toFixed(3)) : val;
    case 'uacr':
      return units.uacr === 'mg_g' ? Number((val * UACR_CONVERSION_FACTOR).toFixed(2)) : val;
    case 'hba1c':
      return units.hba1c === 'mmol_mol' ? hba1cPercentToMmolMol(val) : val;
    default:
      return val;
  }
}

/**
 * CKD-R3-R3-02: Chuyển đổi dữ liệu bệnh nhân chuẩn SI (ví dụ từ Preset) sang hệ đơn vị
 * hiển thị hiện tại của người dùng (`units`), bao gồm cả các trường trong `customInputs` có `unitKey`
 * (như `baselineScr`, `baselineLdl`, `nonHdl`, `urate`).
 * Đảm bảo khi `normalizePatientUnits(denormalizePatientFromSi(preset, units), units)` chạy lại,
 * kết quả SI và eGFR bảo toàn chính xác.
 */
export function denormalizePatientFromSi<T extends Partial<Patient>>(
  patientSi: T,
  units: UnitSettings,
  inputFields?: readonly ModuleInputField[]
): T {
  const customUnitMap = new Map<string, keyof UnitSettings>(
    Object.entries(BUILTIN_CUSTOM_UNIT_KEYS)
  );
  if (inputFields) {
    for (const f of inputFields) {
      if (f.unitKey) {
        customUnitMap.set(f.id, f.unitKey);
        const stripped = f.id.replace(/^(customInputs|patient)\./, '');
        customUnitMap.set(stripped, f.unitKey);
      }
    }
  }

  let convertedCustomInputs: Patient['customInputs'] = patientSi.customInputs
    ? { ...patientSi.customInputs }
    : undefined;
  if (convertedCustomInputs) {
    for (const [k, rawVal] of Object.entries(convertedCustomInputs)) {
      const unitKey = customUnitMap.get(k) ?? customUnitMap.get(`customInputs.${k}`);
      if (!unitKey) continue;
      if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
        convertedCustomInputs[k] = denormalizeValFromSi(rawVal, unitKey, units, k);
      } else if (typeof rawVal === 'string' && rawVal.trim() !== '' && Number.isFinite(Number(rawVal))) {
        convertedCustomInputs[k] = denormalizeValFromSi(Number(rawVal), unitKey, units, k);
      }
    }
  }

  const out: Partial<Patient> = {
    ...patientSi,
    ...(patientSi.conditions ? { conditions: { ...patientSi.conditions } } : {}),
    ...(patientSi.currentMeds ? { currentMeds: [...patientSi.currentMeds] } : {}),
    ...(convertedCustomInputs !== undefined ? { customInputs: convertedCustomInputs } : {})
  };

  if (patientSi.scr !== undefined) {
    out.scr = denormalizeValFromSi(patientSi.scr, 'cr', units, 'scr');
  }
  if (patientSi.glucose !== undefined) {
    out.glucose = denormalizeValFromSi(patientSi.glucose, 'glucose', units, 'glucose');
  }
  if (patientSi.tc !== undefined) {
    out.tc = denormalizeValFromSi(patientSi.tc, 'lipid', units, 'tc');
  }
  if (patientSi.hdl !== undefined) {
    out.hdl = denormalizeValFromSi(patientSi.hdl, 'lipid', units, 'hdl');
  }
  if (patientSi.ldl !== undefined) {
    out.ldl = denormalizeValFromSi(patientSi.ldl, 'lipid', units, 'ldl');
  }
  if (patientSi.nonHdl !== undefined) {
    out.nonHdl = denormalizeValFromSi(patientSi.nonHdl, 'lipid', units, 'nonHdl');
  }
  if (patientSi.tg !== undefined) {
    out.tg = denormalizeValFromSi(patientSi.tg, 'lipid', units, 'tg');
  }
  if (patientSi.uricAcid !== undefined) {
    out.uricAcid = denormalizeValFromSi(patientSi.uricAcid, 'urat', units, 'uricAcid');
  }
  if (patientSi.uacr !== undefined) {
    out.uacr = denormalizeValFromSi(patientSi.uacr, 'uacr', units, 'uacr');
  }
  if (patientSi.hba1c !== undefined) {
    out.hba1c = denormalizeValFromSi(patientSi.hba1c, 'hba1c', units, 'hba1c');
  }

  return out as T;
}
