/**
 * GDMT-VN Canonical Patient Field Resolution, Legacy Alias Migration & Conflict Detection (DATA-01)
 *
 * Giải quyết triệt để lỗi lệch nguồn sự thật (split-brain state) giữa:
 * - Trường chuẩn cấp cao nhất trên `Patient` (`patient.rhythm`, `patient.lvef`, `patient.nyha`, `patient.qtc`, ...)
 * - Trường dự phòng/cũ trong `patient.customInputs` (`customInputs.rhythm`, `customInputs.lvef`, ...)
 * - Các cờ đồng nghĩa trong `patient.conditions` (`pregnant`/`pregnancy`, `breastfeeding`/`lactation`, ...)
 */

import type { Patient, PatientConditions } from './types';

export type CanonicalTopLevelKey = Exclude<
  keyof Patient,
  'currentMeds' | 'selectedModules' | 'conditions' | 'customInputs' | 'allergies'
>;

export const CANONICAL_PATIENT_TOP_LEVEL_KEYS = new Set<CanonicalTopLevelKey>([
  'id',
  'name',
  'age',
  'sex',
  'weight',
  'height',
  'sbp',
  'dbp',
  'hr',
  'qtc',
  'spo2',
  'pefPct',
  'rhythm',
  'scr',
  'cystatinC',
  'egfr',
  'k',
  'na',
  'hco3',
  'hb',
  'hba1c',
  'glucose',
  'uacr',
  'tc',
  'hdl',
  'ldl',
  'nonHdl',
  'tg',
  'uricAcid',
  'eos',
  'fev1',
  'fev1Pct',
  'fvc',
  'mmrc',
  'cat',
  'copdExacerbations',
  'asthmaExacerbations',
  'goutFlaresYear',
  'tophi',
  'lvef',
  'nyha'
]);

/**
 * Ánh xạ các khóa `customInputs.*` tương đương sang trường chuẩn cấp cao nhất của `Patient`.
 * Lưu ý: Khi ghi từ module input có tiền tố `customInputs.`, ta vừa bảo toàn khóa `customInputs`
 * (để tương thích ngược với mọi rule đọc trực tiếp `customInputs`), vừa đồng bộ lên trường chuẩn `Patient`.
 * Khi ghi trực tiếp vào trường chuẩn cấp cao nhất (vd: `rhythm`, `lvef`), ta xóa bản sao lệch trong `customInputs`.
 */
export const CUSTOM_INPUT_TO_TOP_LEVEL_MAP: Readonly<Record<string, CanonicalTopLevelKey>> = {
  rhythm: 'rhythm',
  lvef: 'lvef',
  nyha: 'nyha',
  qtc: 'qtc',
  qtcMs: 'qtc',
  spo2: 'spo2',
  pefPct: 'pefPct',
  scr: 'scr',
  cystatinC: 'cystatinC',
  egfr: 'egfr',
  k: 'k',
  na: 'na',
  hco3: 'hco3',
  serumBicarb: 'hco3',
  hb: 'hb',
  hba1c: 'hba1c',
  glucose: 'glucose',
  uacr: 'uacr',
  tc: 'tc',
  hdl: 'hdl',
  ldl: 'ldl',
  nonHdl: 'nonHdl',
  tg: 'tg',
  uricAcid: 'uricAcid',
  urate: 'uricAcid',
  eos: 'eos',
  bloodEosinophils: 'eos',
  bloodEos: 'eos',
  fev1: 'fev1',
  fev1Pct: 'fev1Pct',
  fev1PredPct: 'fev1Pct',
  fvc: 'fvc',
  mmrc: 'mmrc',
  mmrcScore: 'mmrc',
  cat: 'cat',
  catScore: 'cat',
  copdExacerbations: 'copdExacerbations',
  asthmaExacerbations: 'asthmaExacerbations',
  goutFlaresYear: 'goutFlaresYear',
  flareCountPerYear: 'goutFlaresYear',
  tophi: 'tophi',
  hasTophi: 'tophi'
};

/**
 * Các nhóm cờ đồng nghĩa hai chiều trong `patient.conditions` cần giữ đồng bộ khi cập nhật từ UI.
 */
export const BIDIRECTIONAL_CONDITION_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  pregnant: ['pregnant', 'pregnancy'],
  pregnancy: ['pregnant', 'pregnancy'],
  breastfeeding: ['breastfeeding', 'lactation', 'nursing'],
  lactation: ['breastfeeding', 'lactation', 'nursing'],
  nursing: ['breastfeeding', 'lactation', 'nursing'],
  af: ['af', 'afib'],
  afib: ['af', 'afib'],
  priorAngioedema: ['priorAngioedema', 'angioedemaHistory'],
  angioedemaHistory: ['priorAngioedema', 'angioedemaHistory'],
  liverDisease: ['liverDisease', 'liver_disease'],
  liver_disease: ['liverDisease', 'liver_disease'],
  aki: ['aki', 'akiSuspected'],
  akiSuspected: ['aki', 'akiSuspected']
};

export interface PatientFieldConflict {
  fieldId: string;
  labelVi: string;
  canonicalValue: unknown;
  aliasSource: string;
  aliasValue: unknown;
  resolutionNoteVi: string;
}

const CONFLICT_FIELD_LABELS_VI: Readonly<Record<string, string>> = {
  rhythm: 'Nhịp trên ECG',
  lvef: 'Phân suất tống máu thất trái (LVEF %)',
  nyha: 'Phân độ suy tim NYHA',
  qtc: 'Khoảng QTc (ms)',
  scr: 'Creatinin huyết thanh',
  k: 'Kali máu (K⁺)',
  uacr: 'Đạm niệu UACR',
  glucose: 'Glucose máu',
  hba1c: 'HbA1c',
  uricAcid: 'Acid uric máu',
  eos: 'Bạch cầu ái toan máu (Eosinophils)',
  fev1Pct: 'FEV₁ % dự đoán',
  mmrc: 'Điểm khó thở mMRC',
  cat: 'Điểm triệu chứng CAT'
};

export function isTopLevelPatientKey(key: string): key is CanonicalTopLevelKey {
  return CANONICAL_PATIENT_TOP_LEVEL_KEYS.has(key as CanonicalTopLevelKey);
}

/**
 * Đọc giá trị chuẩn của một trường từ `Patient` (hỗ trợ cả `conditions.*`, `customInputs.*` và top-level).
 */
export function getCanonicalFieldValue(patient: Patient, fieldId: string): unknown {
  if (fieldId.startsWith('conditions.')) {
    const key = fieldId.slice('conditions.'.length);
    const synonyms = BIDIRECTIONAL_CONDITION_SYNONYMS[key];
    if (synonyms) {
      for (const syn of synonyms) {
        if (patient.conditions?.[syn] === true) return true;
        if (patient.customInputs?.[syn] === true) return true;
      }
      for (const syn of synonyms) {
        if (patient.conditions?.[syn] === false) return false;
      }
      return undefined;
    }
    if (patient.conditions?.[key] !== undefined) {
      return patient.conditions[key];
    }
    return patient.customInputs?.[key];
  }

  if (fieldId.startsWith('customInputs.')) {
    const key = fieldId.slice('customInputs.'.length);
    // Nếu là cờ đồng nghĩa với conditions (vd: customInputs.breastfeeding)
    if (key in BIDIRECTIONAL_CONDITION_SYNONYMS) {
      const condVal = getCanonicalFieldValue(patient, `conditions.${key}`);
      if (condVal !== undefined) return condVal;
    }
    const directCustom = patient.customInputs?.[key];
    if (directCustom !== undefined && directCustom !== '') {
      return directCustom;
    }
    const mappedTop = CUSTOM_INPUT_TO_TOP_LEVEL_MAP[key];
    if (mappedTop) {
      const topVal = patient[mappedTop];
      if (topVal !== undefined && topVal !== '') {
        return topVal;
      }
    }
    return directCustom;
  }

  const cleanKey = fieldId.replace(/^patient\./, '');
  if (isTopLevelPatientKey(cleanKey)) {
    const topVal = patient[cleanKey];
    const aliasVal = patient.customInputs?.[cleanKey];
    // Nếu xung đột giữa top-level và customInputs cùng tên (vd: rhythm), fail-closed trả về undefined
    // để buộc người dùng nhìn thấy trạng thái chưa chọn / cảnh báo xung đột thay vì âm thầm hiển thị sai
    if (
      topVal !== undefined &&
      topVal !== '' &&
      aliasVal !== undefined &&
      aliasVal !== '' &&
      String(topVal) !== String(aliasVal)
    ) {
      return cleanKey === 'rhythm' ? undefined : topVal;
    }
    if (topVal !== undefined && topVal !== '') {
      return topVal;
    }
    if (aliasVal !== undefined && aliasVal !== '') {
      return aliasVal;
    }
    return topVal;
  }

  const rawDirect = (patient as unknown as Record<string, unknown>)[cleanKey];
  if (rawDirect !== undefined) {
    return rawDirect;
  }
  return patient.customInputs?.[cleanKey];
}

/**
 * Ghi giá trị trường vào `Patient` theo nguồn sự thật duy nhất (Single Source of Truth):
 * - Mọi trường thuộc `CANONICAL_PATIENT_TOP_LEVEL_KEYS` (kể cả khi trước đó `undefined` trên `patient`)
 *   luôn được ghi thẳng vào `patient[key]` và xóa mọi bản sao cũ trong `patient.customInputs[key]`.
 * - Khi ghi `customInputs.<alias>` có ánh xạ sang top-level (vd: `customInputs.bloodEos`), đồng bộ cả hai.
 * - Khi ghi `conditions.<key>` hoặc `customInputs.breastfeeding`/`pregnant`, đồng bộ toàn bộ nhóm đồng nghĩa.
 */
export function setCanonicalFieldValue(
  patient: Patient,
  fieldId: string,
  rawVal: unknown
): Patient {
  const val = rawVal === '' ? undefined : rawVal;

  if (fieldId.startsWith('conditions.')) {
    const key = fieldId.slice('conditions.'.length);
    return setCanonicalCondition(patient, key, Boolean(val));
  }

  if (fieldId.startsWith('customInputs.')) {
    const key = fieldId.slice('customInputs.'.length);
    if (key in BIDIRECTIONAL_CONDITION_SYNONYMS && typeof val === 'boolean') {
      const updated = setCanonicalCondition(patient, key, val);
      return {
        ...updated,
        customInputs: {
          ...updated.customInputs,
          [key]: val
        }
      };
    }

    const nextCustomInputs: Record<string, string | number | boolean | undefined> = {
      ...patient.customInputs,
      [key]: val as string | number | boolean | undefined
    };
    const nextPatient: Patient = {
      ...patient,
      customInputs: nextCustomInputs
    };

    const mappedTop = CUSTOM_INPUT_TO_TOP_LEVEL_MAP[key];
    if (mappedTop) {
      (nextPatient as unknown as Record<string, unknown>)[mappedTop] = val;
    }
    return nextPatient;
  }

  const cleanKey = fieldId.replace(/^patient\./, '');
  if (isTopLevelPatientKey(cleanKey)) {
    const nextCustomInputs = patient.customInputs ? { ...patient.customInputs } : undefined;
    if (nextCustomInputs) {
      // Xóa mọi alias trùng tên hoặc cùng ánh xạ về cleanKey để không bao giờ còn trạng thái lệch
      delete nextCustomInputs[cleanKey];
      for (const [aliasKey, targetKey] of Object.entries(CUSTOM_INPUT_TO_TOP_LEVEL_MAP)) {
        if (targetKey === cleanKey && aliasKey in nextCustomInputs) {
          if (val === undefined) {
            delete nextCustomInputs[aliasKey];
          } else {
            nextCustomInputs[aliasKey] = val as string | number | boolean;
          }
        }
      }
    }

    const nextConditions: PatientConditions = { ...patient.conditions };
    if (cleanKey === 'rhythm' && val === 'afib') {
      nextConditions.af = true;
      nextConditions.afib = true;
    }

    return {
      ...patient,
      [cleanKey]: val,
      conditions: nextConditions,
      ...(nextCustomInputs !== undefined ? { customInputs: nextCustomInputs } : {})
    };
  }

  return {
    ...patient,
    customInputs: {
      ...patient.customInputs,
      [cleanKey]: val as string | number | boolean | undefined
    }
  };
}

export function setCanonicalCondition(
  patient: Patient,
  condKey: string,
  val: boolean
): Patient {
  const nextConds: PatientConditions = {
    ...patient.conditions,
    [condKey]: val
  };
  const synonyms = BIDIRECTIONAL_CONDITION_SYNONYMS[condKey];
  if (synonyms) {
    for (const syn of synonyms) {
      nextConds[syn] = val;
    }
  }

  let nextCustomInputs = patient.customInputs;
  if (patient.customInputs) {
    const keysToClean = synonyms ? [...synonyms] : [condKey];
    let mutated = false;
    const copy = { ...patient.customInputs };
    for (const k of keysToClean) {
      if (k in copy && copy[k] !== val) {
        delete copy[k];
        mutated = true;
      }
    }
    if (mutated) {
      nextCustomInputs = copy;
    }
  }

  return {
    ...patient,
    conditions: nextConds,
    ...(nextCustomInputs !== undefined ? { customInputs: nextCustomInputs } : {})
  };
}

/**
 * Phát hiện mọi xung đột dữ liệu giữa trường chuẩn cấp cao nhất và `customInputs` (fail-closed).
 */
export function detectPatientFieldConflicts(patient: Patient): PatientFieldConflict[] {
  const conflicts: PatientFieldConflict[] = [];
  const ci = patient.customInputs;
  if (!ci) return conflicts;

  const seenTopKeys = new Set<string>();
  for (const [aliasKey, topKey] of Object.entries(CUSTOM_INPUT_TO_TOP_LEVEL_MAP)) {
    if (seenTopKeys.has(topKey)) continue;
    const topVal = patient[topKey];
    const aliasVal = ci[aliasKey];
    if (
      topVal !== undefined &&
      topVal !== '' &&
      aliasVal !== undefined &&
      aliasVal !== '' &&
      String(topVal) !== String(aliasVal)
    ) {
      seenTopKeys.add(topKey);
      const labelVi = CONFLICT_FIELD_LABELS_VI[topKey] || topKey;
      conflicts.push({
        fieldId: topKey,
        labelVi,
        canonicalValue: topVal,
        aliasSource: `customInputs.${aliasKey}`,
        aliasValue: aliasVal,
        resolutionNoteVi:
          topKey === 'rhythm'
            ? `Xung đột nhịp ECG giữa hồ sơ chung (${String(topVal)}) và mô-đun (${String(aliasVal)}). Hệ thống tạm khóa nhận diện nhịp tự động (fail-closed) cho đến khi bạn chọn lại nhịp ECG xác nhận.`
            : `Giá trị ${labelVi} đang lệch giữa hồ sơ chung (${String(topVal)}) và trường mô-đun (${String(aliasVal)}).`
      });
    }
  }

  return conflicts;
}

/**
 * Đồng bộ hóa và dọn sạch các bản sao `customInputs` xung đột, giữ giá trị chuẩn hoặc giá trị người dùng chọn.
 */
export function resolvePatientFieldConflicts(patient: Patient): Patient {
  if (!patient.customInputs) return patient;
  const nextCustom = { ...patient.customInputs };
  const nextPatient: Patient = {
    ...patient,
    customInputs: nextCustom
  };

  for (const [aliasKey, topKey] of Object.entries(CUSTOM_INPUT_TO_TOP_LEVEL_MAP)) {
    const topVal = nextPatient[topKey];
    const aliasVal = nextCustom[aliasKey];
    if (topVal === undefined && aliasVal !== undefined && aliasVal !== '') {
      (nextPatient as unknown as Record<string, unknown>)[topKey] = aliasVal;
      if (aliasKey === topKey) {
        delete nextCustom[aliasKey];
      }
    } else if (topVal !== undefined && aliasVal !== undefined) {
      if (aliasKey === topKey) {
        delete nextCustom[aliasKey];
      } else {
        nextCustom[aliasKey] = topVal as string | number | boolean;
      }
    }
  }

  return nextPatient;
}
