/**
 * GDMT-VN Safety - Hyponatremia, Hypokalemia, QTc Prolongation & Generic KB Gate Evaluator
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Action } from '../types';
import { hasDrug, drug, type DrugEntry, type GateOperator } from '../../kb-types';
import { expandDrugComponents, resolveCanonicalDrugId } from './fdcMap';
import { getNormalizedDrugClasses } from './drugClassify';

export interface ElectrolyteOrQtVerdict {
  parameter: string;
  actionForNew: 'AVOID' | 'HOLD' | 'DEFER';
  actionForActive: 'STOP' | 'HOLD';
  value: number;
  threshold: number;
  messageVi: string;
  citationIds: string[];
}

const THIAZIDE_COMPONENT_IDS = new Set<string>([
  'hydrochlorothiazide',
  'indapamide',
  'chlorthalidone',
  'metolazone'
]);

const QT_PROLONGING_DRUG_IDS = new Set<string>([
  'sotalol',
  'amiodarone',
  'dronedarone',
  'dofetilide',
  'ibutilide',
  'quinidine',
  'procainamide',
  'disopyramide',
  'azithromycin',
  'clarithromycin',
  'erythromycin',
  'levofloxacin',
  'moxifloxacin',
  'ciprofloxacin',
  'haloperidol',
  'ondansetron',
  'domperidone',
  'moxonidine'
]);

const HYPOKALEMIA_PROARRHYTHMIC_IDS = new Set<string>([
  'digoxin',
  'sotalol',
  'amiodarone',
  'dronedarone',
  'dofetilide',
  'ibutilide',
  'quinidine'
]);

export function resolvePatientQtcMs(patient: Patient): number | undefined {
  if (typeof patient.qtc === 'number' && Number.isFinite(patient.qtc)) {
    return patient.qtc;
  }
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  const raw = ci.qtc ?? ci.qtcMs ?? ci.baselineQtc;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw);
  }
  return undefined;
}

function compareGateOp(val: number, op: GateOperator, threshold: number): boolean {
  switch (op) {
    case '<':
      return val < threshold;
    case '<=':
      return val <= threshold;
    case '>':
      return val > threshold;
    case '>=':
      return val >= threshold;
    case '==':
      return val === threshold;
    case '!=':
      return val !== threshold;
    default:
      return false;
  }
}

function resolveGateNumericParam(
  paramRaw: string,
  patient: Patient,
  derived?: Derived
): { key: string; value?: number } {
  const p = paramRaw.trim().toLowerCase();
  if (p === 'qtc' || p === 'qtc_ms') return { key: 'QTc', value: resolvePatientQtcMs(patient) };
  if (p === 'na' || p === 'sodium' || p === 'na+') return { key: 'Na+', value: patient.na };
  if (p === 'age') return { key: 'age', value: patient.age };
  if (p === 'k' || p === 'k+' || p === 'potassium') return { key: 'K+', value: patient.k };
  if (p === 'hr') return { key: 'HR', value: patient.hr };
  if (p === 'sbp') return { key: 'SBP', value: patient.sbp };
  if (p === 'egfr') return { key: 'eGFR', value: derived?.egfr ?? derived?.egfrCr };
  if (p === 'crcl') return { key: 'CrCl', value: derived?.crcl };
  return { key: paramRaw, value: undefined };
}

/**
 * Đánh giá các cổng Hạ Natri máu (`Na+ < 130` / `< 125`), Kéo dài khoảng `QTc > 500 ms`,
 * Hạ Kali máu nguy hiểm (`K+ < 3.5` trên Digoxin/thuốc kéo dài QT; `K+ < 3.0–3.3` trên lợi tiểu/Insulin tĩnh mạch),
 * và các `DrugEntry.gates` định lượng trong KB (ví dụ `age < 18`).
 */
export function evaluateElectrolyteAndQtSafety(
  drugIdOrName: string,
  kbDrug: DrugEntry | undefined,
  patient: Patient,
  derived?: Derived,
  recAction?: Action,
  recTextHint?: string
): ElectrolyteOrQtVerdict | null {
  const canonical = resolveCanonicalDrugId(drugIdOrName);
  const components = expandDrugComponents(canonical);
  const allClasses = getNormalizedDrugClasses(canonical);

  // 1. Hạ Natri máu (Hyponatremia: HTN-R2-R2-05, HTN-R2-R3-05) đối với lợi tiểu Thiazide / Thiazide-like (kể cả SPC)
  const hasThiazide =
    allClasses.has('thiazide_diuretic') ||
    components.some((c) => THIAZIDE_COMPONENT_IDS.has(c) || getNormalizedDrugClasses(c).has('thiazide_diuretic'));

  if (hasThiazide && patient.na !== undefined && patient.na < 130) {
    const isSevereHyponatremia = patient.na < 125;
    return {
      parameter: 'Na+',
      actionForNew: 'AVOID',
      actionForActive: isSevereHyponatremia ? 'STOP' : 'HOLD',
      value: patient.na,
      threshold: isSevereHyponatremia ? 125 : 130,
      messageVi: isSevereHyponatremia
        ? `Hạ natri máu nặng (Na⁺ = ${patient.na} < 125 mmol/L): Chống chỉ định và bắt buộc ngừng ngay lợi tiểu Thiazide / Thiazide-like (kể cả viên phối hợp SPC) do nguy cơ phù não và hủy myelin cầu não`
        : `Hạ natri máu có ý nghĩa lâm sàng (Na⁺ = ${patient.na} < 130 mmol/L): Tránh khởi trị và tạm ngưng lợi tiểu Thiazide / Thiazide-like cho tới khi điều chỉnh ổn định Natri máu`,
      citationIds: ['aha.acc.2025.table13_chlorthalidone', 'ema.indapamide.contraindications_hepatic']
    };
  }

  // 2. Kéo dài khoảng QTc > 500 ms (AF-R2-R2-09)
  const qtc = resolvePatientQtcMs(patient);
  const hasKnownQtRisk =
    QT_PROLONGING_DRUG_IDS.has(canonical) ||
    kbDrug?.qtRisk === 'known' ||
    components.some((c) => {
      if (QT_PROLONGING_DRUG_IDS.has(c)) return true;
      const d = hasDrug(c) ? drug(c) : undefined;
      return d?.qtRisk === 'known';
    });

  if (qtc !== undefined && qtc > 500 && hasKnownQtRisk) {
    return {
      parameter: 'QTc',
      actionForNew: 'AVOID',
      actionForActive: canonical === 'sotalol' || canonical === 'dofetilide' ? 'STOP' : 'HOLD',
      value: qtc,
      threshold: 500,
      messageVi: `Khoảng QTc kéo dài nguy hiểm (${qtc} ms > 500 ms): Chống chỉ định khởi trị và bắt buộc ngừng / tạm hoãn thuốc kéo dài QT do nguy cơ xoắn đỉnh (Torsades de Pointes)`,
      citationIds: ['esc.af.2024.table13_dronedarone_sotalol', 'fda.amiodarone.qt_prolonging_drugs_avoid']
    };
  }

  // 3. Hạ Kali máu (AF-R2-R3-04 & ADA DKA K+ < 3.3)
  const k = patient.k;
  if (k !== undefined) {
    const isDigoxinOrClassIii =
      components.some((c) => HYPOKALEMIA_PROARRHYTHMIC_IDS.has(c)) || hasKnownQtRisk;
    if (k < 3.5 && isDigoxinOrClassIii) {
      return {
        parameter: 'K+',
        actionForNew: 'HOLD',
        actionForActive: 'HOLD',
        value: k,
        threshold: 3.5,
        messageVi: `Hạ kali máu (K⁺ = ${k.toFixed(1)} < 3.5 mmol/L): Tạm hoãn Digoxin / thuốc chống loạn nhịp kéo dài QT và bù Kali mục tiêu ≥ 4.0 mmol/L trước để phòng loạn nhịp thất / xoắn đỉnh`,
        citationIds: ['ema.indapamide.hypokalemia_qt', 'esc.af.2024.table13_dronedarone_sotalol']
      };
    }

    const isPotassiumWastingDiuretic =
      hasThiazide ||
      allClasses.has('loop_diuretic') ||
      components.some((c) => getNormalizedDrugClasses(c).has('loop_diuretic'));
    if (k < 3.0 && isPotassiumWastingDiuretic) {
      return {
        parameter: 'K+',
        actionForNew: 'HOLD',
        actionForActive: 'HOLD',
        value: k,
        threshold: 3.0,
        messageVi: `Hạ kali máu nặng (K⁺ = ${k.toFixed(1)} < 3.0 mmol/L): Tạm hoãn lợi tiểu thải kali (Thiazide / lợi tiểu quai) và ưu tiên bù Kali tích cực trước`,
        citationIds: ['ema.indapamide.hypokalemia_qt']
      };
    }

    const isIvInsulin =
      (canonical === 'insulin_regular' || canonical === 'insulin') &&
      /tĩnh mạch|\biv\b|truyền|dka|ceton/i.test(recTextHint || '');
    if (k < 3.3 && isIvInsulin && recAction !== 'STOP') {
      return {
        parameter: 'K+',
        actionForNew: 'HOLD',
        actionForActive: 'HOLD',
        value: k,
        threshold: 3.3,
        messageVi: `Hạ kali máu nặng (K⁺ = ${k.toFixed(1)} < 3.3 mmol/L): Bắt buộc TẠM HOÃN truyền Insulin tĩnh mạch và bù Kali tĩnh mạch cho tới khi K⁺ ≥ 3.3 mmol/L (ADA DKA Protocol)`,
        citationIds: ['ada.dm2.2024.dka_potassium_hold_insulin']
      };
    }
  }

  // 4. Thực thi các `DrugEntry.gates` định lượng khác từ KB (ví dụ `age < 18`, `qtc`, `na` đặc hiệu)
  const kbList: DrugEntry[] = [];
  if (kbDrug) kbList.push(kbDrug);
  for (const comp of components) {
    if (comp !== kbDrug?.id && hasDrug(comp)) kbList.push(drug(comp));
  }

  for (const entry of kbList) {
    for (const g of entry.gates || []) {
      const pLower = g.parameter.trim().toLowerCase();
      // Bỏ qua eGFR/CrCl/SBP/HR/K+ chuẩn đã có cổng chuyên sâu ở vitalAndRenalGates, chỉ thực thi `age`, `qtc`, `na`
      if (!['age', 'qtc', 'qtc_ms', 'na', 'na+', 'sodium'].includes(pLower)) continue;
      const { key, value } = resolveGateNumericParam(g.parameter, patient, derived);
      if (value === undefined) continue;
      if (compareGateOp(value, g.operator, g.threshold)) {
        if (g.action === 'caution' || g.action === 'reduce') continue;
        return {
          parameter: key,
          actionForNew: g.action === 'hold' ? 'HOLD' : 'AVOID',
          actionForActive: g.action === 'hold' ? 'HOLD' : 'STOP',
          value,
          threshold: g.threshold,
          messageVi: g.messageVi,
          citationIds: g.citationIds
        };
      }
    }
  }

  return null;
}
