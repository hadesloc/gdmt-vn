import type { Patient, Settings } from './types';

const modules = new Set(['ckd', 'dm2', 'htn', 'copd', 'asthma', 'gout', 'hf', 'lipid', 'af', '_demo']);
const numericFields = new Set(('age weight height sbp dbp hr qtc spo2 pefPct scr cystatinC egfr k na hco3 hb hba1c glucose uacr tc hdl ldl nonHdl tg uricAcid eos fev1 fev1Pct fvc mmrc cat copdExacerbations asthmaExacerbations goutFlaresYear lvef nyha').split(' '));
const enums: Record<string, readonly string[]> = {
  setting: ['outpatient', 'inpatient'], profile: ['INTL', 'VN', 'US'],
  score2Region: ['low', 'moderate', 'high', 'very_high'], fontScale: ['normal', 'large', 'xlarge'], theme: ['light', 'dark', 'high_contrast'],
};
const unitEnums: Record<string, readonly string[]> = {
  cr: ['umol_L', 'mg_dL'], glucose: ['mmol_L', 'mg_dL'], lipid: ['mmol_L', 'mg_dL'],
  urat: ['umol_L', 'mg_dL'], uacr: ['mg_mmol', 'mg_g'], hba1c: ['pct', 'mmol_mol'],
};
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const scalar = (v: unknown) => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));

/** Validate transport structure without inventing clinical values or converting units. */
export function isWorkspacePatient(value: unknown): value is Partial<Patient> {
  if (!isRecord(value)) return false;
  for (const [key, v] of Object.entries(value)) {
    if (numericFields.has(key) && (typeof v !== 'number' || !Number.isFinite(v))) return false;
    if (key === 'tophi' && typeof v !== 'boolean') return false;
    if (['name', 'id'].includes(key) && typeof v !== 'string') return false;
    if (key === 'sex' && !['male', 'female'].includes(String(v))) return false;
    if (key === 'rhythm' && !['sinus', 'afib', 'paced', 'other'].includes(String(v))) return false;
    if (key === 'selectedModules' && (!Array.isArray(v) || !v.every((id) => typeof id === 'string' && modules.has(id)))) return false;
    if (key === 'conditions' && (!isRecord(v) || !Object.values(v).every((flag) => typeof flag === 'boolean'))) return false;
    if (key === 'customInputs' && (!isRecord(v) || !Object.values(v).every(scalar))) return false;
    if (key === 'allergies' && (!Array.isArray(v) || !v.every((allergy) => typeof allergy === 'string'))) return false;
    if (key === 'currentMeds') {
      if (!Array.isArray(v) || !v.every((med) => isRecord(med) && typeof med.drugId === 'string' && med.drugId.trim() &&
        ['name', 'unit', 'freq', 'route'].every((field) => med[field] === undefined || typeof med[field] === 'string') &&
        (med.dose === undefined || typeof med.dose === 'string' || (typeof med.dose === 'number' && Number.isFinite(med.dose))))) return false;
    }
  }
  return true;
}

export function isWorkspaceSettings(value: unknown): value is Partial<Settings> {
  if (!isRecord(value)) return false;
  for (const [key, v] of Object.entries(value)) {
    if (enums[key] && !enums[key].includes(String(v))) return false;
    if (key === 'onlyReviewed' && typeof v !== 'boolean') return false;
    if (key === 'units' && (!isRecord(v) || !Object.entries(v).every(([unit, val]) => unitEnums[unit]?.includes(String(val))))) return false;
  }
  return true;
}

export function serializeCaseFile(patient: Patient, settings: Settings): string {
  return JSON.stringify({ format: 'gdmt-vn-case', version: 1, exportedAt: new Date().toISOString(), patient, settings }, null, 2);
}

export function parseCaseFile(text: string): { patient: Partial<Patient>; settings: Partial<Settings> } {
  if (text.length > 2_000_000) throw new Error('Hồ sơ quá lớn (tối đa 2 MB).');
  let value: unknown;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('Tệp không phải JSON hợp lệ.'); }
  if (!isRecord(value) || value.format !== 'gdmt-vn-case' || value.version !== 1) throw new Error('Không đúng định dạng hoặc phiên bản hồ sơ GDMT-VN.');
  if (!isWorkspacePatient(value.patient) || !isWorkspaceSettings(value.settings)) throw new Error('Dữ liệu bệnh nhân hoặc cài đặt trong tệp không hợp lệ.');
  return { patient: value.patient, settings: value.settings };
}
