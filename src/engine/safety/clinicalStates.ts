/**
 * GDMT-VN Safety - Cardiogenic Shock, Acute AKI & Outpatient Crisis Detectors
 * Phân quyền: Agent B
 */

import type { Patient, Settings, Recommendation } from '../types';
import { hasCondition } from '../types';
import { expandDrugComponents } from './fdcMap';
import {
  resolveKbDrugId,
  getNormalizedDrugClasses,
  isGlp1OrGipDrug
} from './drugClassify';
import { evaluateHepaticSafety, type HepaticSafetyVerdict } from './hepaticSafety';

export { evaluateHepaticSafety, type HepaticSafetyVerdict };

export function isCardiogenicShockOrVasopressor(patient: Patient): boolean {
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  const profile = String(ci.hemodynamicProfile ?? '').trim().toLowerCase();
  const stability = String(ci.hemodynamicStability ?? '').trim().toLowerCase();
  return (
    hasCondition({ normalized: patient, patient }, 'cardiogenicShock') ||
    profile === 'cold_wet' ||
    profile === 'cold_dry' ||
    ci.onInotropesOrVasopressors === true ||
    ci.onInotropes === true ||
    ci.onVasopressors === true ||
    stability === 'unstable' ||
    stability === 'shock'
  );
}

export function isNephrotoxicOrHemodynamicInAki(drugIdOrName: string): boolean {
  const canonical = resolveKbDrugId(drugIdOrName);
  const components = expandDrugComponents(canonical);
  const classes = getNormalizedDrugClasses(canonical);
  if (
    classes.has('rasi') ||
    classes.has('acei') ||
    classes.has('arb') ||
    classes.has('arni') ||
    classes.has('renin_inhibitor') ||
    classes.has('mra') ||
    classes.has('mra_steroidal') ||
    classes.has('mra_nonsteroidal') ||
    classes.has('sglt2i') ||
    classes.has('thiazide_diuretic') ||
    classes.has('biguanide') ||
    classes.has('nsaid')
  ) {
    return true;
  }
  return components.some((c) =>
    [
      'metformin',
      'aliskiren',
      'spironolactone',
      'eplerenone',
      'finerenone',
      'hydrochlorothiazide',
      'indapamide',
      'chlorthalidone',
      'colchicine'
    ].includes(c)
  );
}

export function detectAcuteAki(patient: Patient): { isAki: boolean; reasonVi?: string } {
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  if (hasCondition({ normalized: patient, patient }, 'aki')) {
    return { isAki: true, reasonVi: 'Đang trong đợt tổn thương thận cấp (AKI)' };
  }

  const akiStageNum =
    typeof ci.akiStage === 'number'
      ? ci.akiStage
      : typeof ci.akiStage === 'string' && ci.akiStage.trim() !== ''
        ? Number(ci.akiStage)
        : undefined;
  if (akiStageNum !== undefined && Number.isFinite(akiStageNum) && akiStageNum >= 1) {
    return { isAki: true, reasonVi: `Đang có tổn thương thận cấp (AKI Giai đoạn ${akiStageNum})` };
  }

  const baseScr =
    typeof ci.baselineScr === 'number' && Number.isFinite(ci.baselineScr)
      ? ci.baselineScr
      : typeof ci.baselineScr === 'string' && ci.baselineScr.trim() !== '' && Number.isFinite(Number(ci.baselineScr))
        ? Number(ci.baselineScr)
        : undefined;

  if (patient.scr !== undefined && baseScr !== undefined && baseScr > 0) {
    const ratio = patient.scr / baseScr;
    const isMgDlScale = patient.scr < 15 && baseScr < 15;
    const absDelta = patient.scr - baseScr;
    const deltaThreshold = isMgDlScale ? 0.3 : 26.5;
    if (ratio >= 1.5 || absDelta >= deltaThreshold) {
      return {
        isAki: true,
        reasonVi: `Creatinin tăng cấp tính từ nền (${baseScr} → ${patient.scr}, đạt tiêu chuẩn KDIGO AKI)`
      };
    }
  }

  const uoRate = String(ci.urineOutputRate ?? '').trim().toLowerCase();
  if (['oliguria_6h', 'oliguria_12h', 'oliguria_24h', 'oliguria', 'anuria', 'anuria_12h'].includes(uoRate)) {
    return { isAki: true, reasonVi: 'Thiểu niệu / vô niệu cấp tính (< 0.5 mL/kg/giờ ≥ 6 giờ theo KDIGO AKI)' };
  }

  const uoMlKgHr =
    typeof ci.urineOutputMlKgHr === 'number' && Number.isFinite(ci.urineOutputMlKgHr)
      ? ci.urineOutputMlKgHr
      : undefined;
  if (uoMlKgHr !== undefined && uoMlKgHr >= 0 && uoMlKgHr < 0.5) {
    return { isAki: true, reasonVi: `Thiểu niệu cấp (${uoMlKgHr} mL/kg/giờ < 0.5 mL/kg/giờ)` };
  }

  const uo6hMlHr =
    typeof ci.urineOutputRate6h === 'number' && Number.isFinite(ci.urineOutputRate6h)
      ? ci.urineOutputRate6h
      : undefined;
  if (
    uo6hMlHr !== undefined &&
    uo6hMlHr >= 0 &&
    patient.weight !== undefined &&
    patient.weight > 0 &&
    uo6hMlHr / patient.weight < 0.5
  ) {
    return {
      isAki: true,
      reasonVi: `Thiểu niệu cấp (${(uo6hMlHr / patient.weight).toFixed(2)} mL/kg/giờ < 0.5 mL/kg/giờ)`
    };
  }

  return { isAki: false };
}

export function isOutpatientAcuteCrisis(
  patient: Patient,
  settings?: Settings
): { isCrisis: boolean; reasonVi?: string } {
  if (settings?.setting !== 'outpatient') return { isCrisis: false };
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  if ((patient.sbp !== undefined && patient.sbp < 90) || isCardiogenicShockOrVasopressor(patient)) {
    return {
      isCrisis: true,
      reasonVi:
        patient.sbp !== undefined && patient.sbp < 90
          ? `Tụt huyết áp nặng / sốc tại phòng khám ngoại trú (SBP = ${patient.sbp} < 90 mmHg)`
          : 'Sốc tim / huyết động không ổn định tại phòng khám ngoại trú'
    };
  }
  const hasHyperkEcg =
    (ci.ecgHyperkalemia === true || ci.ecgHyperkalemiaChanges === true) &&
    (patient.k === undefined || patient.k > 5.0);
  if ((patient.k !== undefined && patient.k >= 6.0) || hasHyperkEcg) {
    return {
      isCrisis: true,
      reasonVi:
        patient.k !== undefined && patient.k >= 6.0
          ? `Tăng Kali máu nặng đe dọa tính mạng tại phòng khám ngoại trú (K⁺ = ${patient.k.toFixed(1)} ≥ 6.0 mmol/L)`
          : 'Biến đổi điện tâm đồ do tăng Kali máu cấp cứu tại phòng khám ngoại trú'
    };
  }
  if (patient.hco3 !== undefined && patient.hco3 < 12) {
    return {
      isCrisis: true,
      reasonVi: `Nhiễm toan chuyển hóa nặng tại phòng khám ngoại trú (HCO₃⁻ = ${patient.hco3} < 12 mmol/L)`
    };
  }
  const ketones =
    typeof ci.bloodKetones === 'number'
      ? ci.bloodKetones
      : typeof ci.ketones === 'number'
        ? ci.ketones
        : undefined;
  if (hasCondition({ normalized: patient, patient }, 'dkaSuspected') || (ketones !== undefined && ketones >= 3.0)) {
    return {
      isCrisis: true,
      reasonVi: 'Nghi ngờ nhiễm toan ceton (DKA / euDKA) hoặc tăng áp lực thẩm thấu cấp cứu tại phòng khám ngoại trú'
    };
  }
  if (
    hasCondition({ normalized: patient, patient }, 'activeBleeding') ||
    hasCondition({ normalized: patient, patient }, 'acuteIntracerebralHemorrhage')
  ) {
    return {
      isCrisis: true,
      reasonVi: 'Đang xuất huyết tiêu hóa / nội sọ tiến triển cấp cứu tại phòng khám ngoại trú'
    };
  }
  return { isCrisis: false };
}

const EMERGENCY_RESCUE_DRUG_IDS = new Set([
  'calcium_gluconate',
  'calcium_chloride',
  'insulin_regular',
  'dextrose',
  'dextrose_iv',
  'glucose',
  'glucose_iv',
  'glucagon',
  'sodium_zirconium_cyclosilicate',
  'patiromer',
  'calcium_polystyrene_sulfonate',
  'sodium_polystyrene_sulfonate',
  'sodium_bicarbonate',
  'salbutamol',
  'terbutaline',
  'ipratropium',
  'ipratropium_salbutamol',
  'ipratropium_fenoterol',
  'salbutamol_ipratropium',
  'combivent',
  'berodual',
  'magnesium_sulfate',
  'epinephrine',
  'norepinephrine',
  'dobutamine',
  'dopamine',
  'vasopressin',
  'methylprednisolone',
  'hydrocortisone',
  'dexamethasone',
  'prednisolone',
  'prednisone',
  'amiodarone',
  'adenosine',
  'atropine',
  'esmolol',
  'landiolol',
  'nicardipine',
  'clevidipine',
  'labetalol',
  'urapidil',
  'nitroglycerin',
  'sodium_nitroprusside',
  'heparin',
  'enoxaparin',
  'fondaparinux',
  'oxygen',
  'amoxicillin_clavulanate',
  'azithromycin',
  'levofloxacin',
  'moxifloxacin',
  'ceftriaxone',
  'cefepime',
  'piperacillin_tazobactam',
  'meropenem'
]);

export function isEmergencyOrRescueTherapy(
  rec: Recommendation,
  patient: Patient,
  settings?: Settings
): boolean {
  if (!rec.drugId) return true;
  const raw = rec.drugId.trim().toLowerCase();
  const resolved = resolveKbDrugId(raw);
  if (EMERGENCY_RESCUE_DRUG_IDS.has(raw) || EMERGENCY_RESCUE_DRUG_IDS.has(resolved)) {
    return true;
  }

  const classes = getNormalizedDrugClasses(resolved);
  if (
    classes.has('ics') ||
    classes.has('ics_laba') ||
    classes.has('ics_lama_laba') ||
    classes.has('laba_lama') ||
    classes.has('lama') ||
    classes.has('saba') ||
    classes.has('sama') ||
    classes.has('saba_sama')
  ) {
    return true;
  }

  if (
    classes.has('loop_diuretic') ||
    ['furosemide', 'bumetanide', 'torsemide'].includes(resolved)
  ) {
    if (patient.sbp === undefined || patient.sbp >= 90) {
      const ci = (patient.customInputs || {}) as Record<string, unknown>;
      const text = `${rec.id} ${rec.tier || ''} ${rec.title || ''} ${rec.dose || ''}`;
      if (
        ci.congestion === 'overt' ||
        ci.pulmonaryEdema === true ||
        ci.volumeOverload === true ||
        (patient.k !== undefined && patient.k >= 6.0) ||
        /tĩnh mạch|\biv\b|cấp cứu|sung huyết|quá tải dịch|phù phổi/i.test(text)
      ) {
        return true;
      }
    }
  }

  if (
    (classes.has('insulin') || raw.includes('insulin')) &&
    !isGlp1OrGipDrug(raw, classes) &&
    settings?.setting === 'inpatient' &&
    (patient.glucose === undefined || patient.glucose >= 3.9)
  ) {
    return true;
  }

  const recIdLower = rec.id.toLowerCase();
  if (
    recIdLower.includes('hyperk') ||
    recIdLower.includes('hypo_rescue') ||
    recIdLower.includes('emergency')
  ) {
    return true;
  }

  const isChronicPreventivePillar =
    classes.has('statin') ||
    classes.has('sglt2i') ||
    classes.has('rasi') ||
    classes.has('acei') ||
    classes.has('arb') ||
    classes.has('arni') ||
    classes.has('mra') ||
    classes.has('glp1ra') ||
    classes.has('dpp4i') ||
    classes.has('biguanide') ||
    classes.has('su') ||
    classes.has('tzd') ||
    classes.has('xoi') ||
    classes.has('uricosuric') ||
    classes.has('fibrate') ||
    [
      'ezetimibe',
      'bempedoic_acid',
      'icosapent_ethyl',
      'evolocumab',
      'alirocumab',
      'inclisiran',
      'probenecid',
      'benzbromarone',
      'vericiguat',
      'ivabradine',
      'roflumilast'
    ].includes(resolved);

  if (isChronicPreventivePillar) return false;

  const text = `${rec.tier || ''} ${rec.title || ''} ${rec.dose || ''}`;
  return /tiêm tĩnh mạch|truyền tĩnh mạch|khí dung|cấp cứu/i.test(text);
}
