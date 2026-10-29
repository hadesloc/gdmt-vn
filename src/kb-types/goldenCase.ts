/**
 * GDMT-VN Golden Case Schema & Types
 * Phân quyền: Agent C
 */

import type { Action, Patient, Settings } from '../engine/types';

export interface GoldenCaseExpectItem {
  drugId?: string;
  ruleId?: string;
  action: Action;
  doseContains?: string;
}

export interface GoldenCaseExpectAlert {
  type?: string;
  code?: string;
  level?: 'info' | 'warn' | 'contraindication';
  messageContains?: string;
}

export interface GoldenCaseExpect {
  mustInclude: GoldenCaseExpectItem[];
  mustNotInclude?: GoldenCaseExpectItem[];
  alertsInclude?: GoldenCaseExpectAlert[];
}

export interface GoldenCase {
  id: string;
  titleVi: string;
  source: string; // vd: 'on-call:icu_hyperkalemia_0320' hoặc 'guideline example' + citation
  settings: Settings;
  patient: Patient;
  expect: GoldenCaseExpect;
  descriptionVi?: string;
  notes?: string;
}

export interface GoldenCaseValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGoldenCase(c: unknown): GoldenCaseValidationResult {
  const errors: string[] = [];
  if (typeof c !== 'object' || c === null || Array.isArray(c)) {
    return { valid: false, errors: ['GoldenCase phải là một object'] };
  }

  const obj = c as Record<string, unknown>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    errors.push('GoldenCase.id bắt buộc và phải là chuỗi không rỗng');
  }
  if (typeof obj.titleVi !== 'string' || !obj.titleVi.trim()) {
    errors.push(`GoldenCase ${obj.id ?? '?'}: titleVi bắt buộc`);
  }
  if (typeof obj.source !== 'string' || !obj.source.trim()) {
    errors.push(`GoldenCase ${obj.id ?? '?'}: source bắt buộc`);
  }
  if (!obj.settings || typeof obj.settings !== 'object') {
    errors.push(`GoldenCase ${obj.id ?? '?'}: settings bắt buộc`);
  }
  if (!obj.patient || typeof obj.patient !== 'object') {
    errors.push(`GoldenCase ${obj.id ?? '?'}: patient bắt buộc`);
  }
  if (!obj.expect || typeof obj.expect !== 'object') {
    errors.push(`GoldenCase ${obj.id ?? '?'}: expect bắt buộc`);
  } else {
    const exp = obj.expect as Record<string, unknown>;
    if (!Array.isArray(exp.mustInclude)) {
      errors.push(`GoldenCase ${obj.id ?? '?'}: expect.mustInclude phải là một mảng`);
    } else {
      for (let i = 0; i < exp.mustInclude.length; i++) {
        const item = exp.mustInclude[i] as Record<string, unknown>;
        if (!item || typeof item !== 'object') {
          errors.push(`GoldenCase ${obj.id ?? '?'}: expect.mustInclude[${i}] phải là object`);
          continue;
        }
        if (!item.drugId && !item.ruleId) {
          errors.push(`GoldenCase ${obj.id ?? '?'}: expect.mustInclude[${i}] phải có ít nhất drugId hoặc ruleId`);
        }
        if (typeof item.action !== 'string') {
          errors.push(`GoldenCase ${obj.id ?? '?'}: expect.mustInclude[${i}].action bắt buộc`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
