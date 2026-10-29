/**
 * GDMT-VN Knowledge Base - Drug Interactions Type System & Runtime Validators
 * Phân quyền: Agent N (Dược sĩ lâm sàng chuyên tương tác thuốc)
 * Zero-dependency runtime validator, browser-safe 100%.
 */

import type { ValidationResult } from './index';

export type InteractionSeverity = 'contraindicated' | 'major' | 'moderate';

export interface InteractionTarget {
  drugIds?: string[];
  classes?: string[];
  descriptionVi?: string;
}

export interface InteractionDoseLimit {
  drugId: string;
  maxDose: number;
  unit: string;
  frequency?: string;
  thresholdId?: string;
  noteVi?: string;
}

export interface InteractionRule {
  id: string; // Định danh duy nhất: ix.<topic>_<pair_or_class>
  titleVi: string;
  severity: InteractionSeverity;
  
  // Dành cho tương tác cặp (A + B)
  a?: InteractionTarget;
  b?: InteractionTarget;
  
  // Dành cho tương tác đa thành phần (≥3 thuốc như Triple Whammy) hoặc nhóm gộp (≥2 thuốc cùng nhóm như QT)
  members?: InteractionTarget[];
  minCount?: number; // Ví dụ: minCount = 2 khi có ít nhất 2 thuốc từ members

  mechanismVi: string;   // Cơ chế tương tác (dược lực học, dược động học: CYP3A4, P-gp, OATP1B1, thải trừ...)
  effectVi: string;      // Hậu quả lâm sàng (tiêu cơ vân, kéo dài QTc xoắn đỉnh, xuất huyết, tăng kali...)
  managementVi: string;  // Xử trí cụ thể: Tránh phối hợp / Giảm liều tối đa X / Theo dõi Y
  doseLimit?: InteractionDoseLimit; // Giới hạn liều trần bắt buộc nếu phối hợp
  citationIds: string[]; // Trích dẫn nhãn FDA/EMA hoặc Guideline
}

const INTERACTION_SEVERITIES = new Set<string>(['contraindicated', 'major', 'moderate']);

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function validateTarget(t: unknown, targetName: string, ruleId: string): string[] {
  const errors: string[] = [];
  if (!isObject(t)) {
    errors.push(`Rule ${ruleId}: ${targetName} phải là một object`);
    return errors;
  }
  const hasDrugIds = Array.isArray(t.drugIds) && t.drugIds.length > 0;
  const hasClasses = Array.isArray(t.classes) && t.classes.length > 0;
  if (!hasDrugIds && !hasClasses) {
    errors.push(`Rule ${ruleId}: ${targetName} phải chứa ít nhất một trong hai trường: drugIds (mảng không rỗng) hoặc classes (mảng không rỗng)`);
  }
  if (t.drugIds !== undefined) {
    if (!Array.isArray(t.drugIds)) {
      errors.push(`Rule ${ruleId}: ${targetName}.drugIds phải là mảng chuỗi`);
    } else {
      for (const d of t.drugIds) {
        if (typeof d !== 'string' || !d.trim()) {
          errors.push(`Rule ${ruleId}: ${targetName}.drugIds chứa phần tử không hợp lệ (phải là chuỗi không rỗng)`);
        }
      }
    }
  }
  if (t.classes !== undefined) {
    if (!Array.isArray(t.classes)) {
      errors.push(`Rule ${ruleId}: ${targetName}.classes phải là mảng chuỗi`);
    } else {
      for (const c of t.classes) {
        if (typeof c !== 'string' || !c.trim()) {
          errors.push(`Rule ${ruleId}: ${targetName}.classes chứa phần tử không hợp lệ (phải là chuỗi không rỗng)`);
        }
      }
    }
  }
  return errors;
}

export function validateInteractionRule(r: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(r)) {
    return { valid: false, errors: ['InteractionRule phải là một object'] };
  }

  const id = typeof r.id === 'string' ? r.id.trim() : '';
  if (!id) {
    errors.push('InteractionRule.id bắt buộc và phải là chuỗi không rỗng');
  } else if (!id.startsWith('ix.')) {
    errors.push(`Rule ${id}: id phải bắt đầu bằng "ix."`);
  }

  if (typeof r.titleVi !== 'string' || !r.titleVi.trim()) {
    errors.push(`Rule ${id || '?'}: titleVi bắt buộc và phải là chuỗi không rỗng`);
  }

  if (typeof r.severity !== 'string' || !INTERACTION_SEVERITIES.has(r.severity)) {
    errors.push(`Rule ${id || '?'}: severity phải thuộc ['contraindicated', 'major', 'moderate']`);
  }

  // Cấu trúc đối tượng tương tác: hoặc cặp (a + b) hoặc mảng members
  const hasPair = r.a !== undefined && r.b !== undefined;
  const hasMembers = Array.isArray(r.members) && r.members.length > 0;

  if (!hasPair && !hasMembers) {
    errors.push(`Rule ${id || '?'}: Phải định nghĩa cặp đối tượng tương tác (a và b) HOẶC mảng thành phần (members)`);
  }

  if (r.a !== undefined) {
    errors.push(...validateTarget(r.a, 'a', id));
  }
  if (r.b !== undefined) {
    errors.push(...validateTarget(r.b, 'b', id));
  }
  if (r.members !== undefined) {
    if (!Array.isArray(r.members) || r.members.length === 0) {
      errors.push(`Rule ${id || '?'}: members phải là mảng không rỗng`);
    } else {
      r.members.forEach((m, idx) => {
        errors.push(...validateTarget(m, `members[${idx}]`, id));
      });
    }
  }

  if (r.minCount !== undefined) {
    if (typeof r.minCount !== 'number' || r.minCount < 2 || !Number.isInteger(r.minCount)) {
      errors.push(`Rule ${id || '?'}: minCount phải là số nguyên ≥ 2`);
    }
  }

  if (typeof r.mechanismVi !== 'string' || !r.mechanismVi.trim()) {
    errors.push(`Rule ${id || '?'}: mechanismVi bắt buộc (mô tả cơ chế tương tác)`);
  }

  if (typeof r.effectVi !== 'string' || !r.effectVi.trim()) {
    errors.push(`Rule ${id || '?'}: effectVi bắt buộc (mô tả hậu quả lâm sàng)`);
  }

  if (typeof r.managementVi !== 'string' || !r.managementVi.trim()) {
    errors.push(`Rule ${id || '?'}: managementVi bắt buộc (hành động xử trí cụ thể)`);
  }

  if (r.doseLimit !== undefined) {
    if (!isObject(r.doseLimit)) {
      errors.push(`Rule ${id || '?'}: doseLimit phải là một object`);
    } else {
      if (typeof r.doseLimit.drugId !== 'string' || !r.doseLimit.drugId.trim()) {
        errors.push(`Rule ${id || '?'}: doseLimit.drugId bắt buộc`);
      }
      if (typeof r.doseLimit.maxDose !== 'number' || !Number.isFinite(r.doseLimit.maxDose) || r.doseLimit.maxDose <= 0) {
        errors.push(`Rule ${id || '?'}: doseLimit.maxDose phải là số hữu hạn dương`);
      }
      if (typeof r.doseLimit.unit !== 'string' || !r.doseLimit.unit.trim()) {
        errors.push(`Rule ${id || '?'}: doseLimit.unit bắt buộc`);
      }
    }
  }

  if (!Array.isArray(r.citationIds) || r.citationIds.length === 0) {
    errors.push(`Rule ${id || '?'}: citationIds bắt buộc và phải có ít nhất 1 citation`);
  } else {
    for (const cid of r.citationIds) {
      if (typeof cid !== 'string' || !cid.trim()) {
        errors.push(`Rule ${id || '?'}: citationId phải là chuỗi không rỗng`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
