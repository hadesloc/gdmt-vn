/**
 * GDMT-VN CKD Module - Shared Clinical Condition, Hepatic/Lactation/Allergy & Crisis Predicates (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Integrated with Engine Allergy/Lactation Gates & KFRE)
 */

import type { RuleContext } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import { hasCondition, need } from '../../engine/require';
import { computeKfre } from '../../engine/calculators/kfre';
import {
  evaluateAllergySafety,
  evaluateLactationSafety,
  isBreastfeeding,
} from '../../engine/safety/lactationAndAllergyGates';
import {
  getDrugSafe,
  getMedComponents,
  normalizeDrugId,
} from './helpers.drugs';

function hasRawFlag(ctx: RuleContext, ...keys: string[]): boolean {
  const custom = (ctx.normalized?.customInputs ?? ctx.patient.customInputs) as Record<string, unknown> | undefined;
  const cond = (ctx.patient.conditions ?? {}) as Record<string, unknown>;
  return keys.some((k) => Boolean(cond[k] || custom?.[k]));
}

export function isKidneyTransplant(ctx: RuleContext): boolean {
  return hasRawFlag(ctx, 'kidneyTransplant', 'renalTransplant', 'kidney_transplant');
}

export function isDkaSuspected(ctx: RuleContext): boolean {
  return hasCondition(ctx, 'dkaSuspected') || hasRawFlag(ctx, 'dka', 'dkaSuspected');
}

export function hasCkdFlag(
  ctx: RuleContext,
  flag: 'onDialysis' | 'pregnant' | 'priorAngioedema'
): boolean {
  const custom = ctx.normalized?.customInputs ?? ctx.patient.customInputs;
  if (flag === 'pregnant' && Boolean((ctx.patient as unknown as Record<string, unknown>).pregnant)) {
    return true;
  }
  return hasCondition(ctx, flag) || Boolean(custom?.[flag]);
}

/**
 * Xác nhận bằng chứng CKD thực sự (CKD-R4-R1-06): tránh gán Statin / mục tiêu HA < 120 / Sick-day
 * trên người trưởng thành sàng lọc có eGFR >= 60 và không có đạm niệu / tổn thương cấu trúc thận.
 */
export function hasConfirmedCkdEvidence(ctx: RuleContext): boolean {
  if (hasCkdFlag(ctx, 'onDialysis') || isKidneyTransplant(ctx)) return true;
  const custom = ctx.normalized?.customInputs ?? ctx.patient.customInputs;
  if (Boolean(custom?.hematuria)) return true;
  const etiology = String(custom?.ckdEtiology ?? '').toLowerCase();
  if (etiology === 'adpkd' || etiology === 'glomerular' || etiology === 'tubulointerstitial') {
    return true;
  }

  const egfr = need(ctx, 'egfr');
  const uacr = need(ctx, 'uacr');
  const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
  const a2Min = thFor('uacr', 'ckd.uacr.a1_max_mgmmol');

  if (egfr !== undefined && egfr < g2Min) return true;
  if (uacr !== undefined && uacr >= a2Min) return true;

  if (hasCondition(ctx, 'ckd')) {
    if (egfr !== undefined && egfr >= g2Min && uacr !== undefined && uacr < a2Min) {
      return false;
    }
    if (egfr !== undefined && egfr >= g2Min && uacr === undefined && !Boolean(ctx.patient.conditions?.ckd)) {
      return false;
    }
    return true;
  }
  return false;
}

export function getBaselineScrUmol(ctx: RuleContext): number | undefined {
  return need(ctx, 'customInputs.baselineScr');
}

export function getScrRisePct(ctx: RuleContext): number | undefined {
  const scr = need(ctx, 'scr');
  const baseScr = getBaselineScrUmol(ctx);
  if (scr !== undefined && baseScr !== undefined && baseScr > 0 && scr > baseScr) {
    return ((scr - baseScr) / baseScr) * 100; // qa-allow: unit-conversion - tính phần trăm tăng SCr so với nền
  }
  return undefined;
}

export function hasExcessiveRasiCreatinineRise(ctx: RuleContext): boolean {
  const pct = getScrRisePct(ctx);
  if (pct === undefined) return false;
  return pct > thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct');
}

function computeCkdKfre(ctx: RuleContext) {
  const age = need(ctx, 'age');
  const sex = ctx.normalized.sex;
  const egfr = need(ctx, 'egfr');
  const uacr = need(ctx, 'uacr');
  if (age === undefined || sex === undefined || egfr === undefined || uacr === undefined) {
    return undefined;
  }
  if (egfr >= thFor('egfr', 'ckd.egfr.g2_min')) return undefined;
  const region = ctx.settings.profile === 'US' ? 'north_america' : 'non_north_america';
  return computeKfre({ age, sex, egfr, uacr, uacrUnit: 'mg/mmol', region });
}

export function getKfre2y(ctx: RuleContext): number | undefined {
  if (typeof ctx.derived.kfre2y === 'number') return ctx.derived.kfre2y;
  return computeCkdKfre(ctx)?.risk2Year ?? undefined;
}

export function getKfre5y(ctx: RuleContext): number | undefined {
  if (typeof ctx.derived.kfre5y === 'number') return ctx.derived.kfre5y;
  return computeCkdKfre(ctx)?.risk5Year ?? undefined;
}

function getChildPughGrade(ctx: RuleContext): string {
  const custom = ctx.normalized?.customInputs ?? ctx.patient.customInputs;
  const ptRec = ctx.patient as unknown as Record<string, unknown>;
  return String(ptRec.childPugh ?? custom?.childPugh ?? '').trim().toUpperCase();
}

export function isChildPughC(ctx: RuleContext): boolean {
  const cp = getChildPughGrade(ctx);
  return cp === 'C' || hasCondition(ctx, 'decompensatedCirrhosis') || hasRawFlag(ctx, 'decompensatedCirrhosis');
}

export function isChildPughB(ctx: RuleContext): boolean {
  return getChildPughGrade(ctx) === 'B';
}

export function hasMildModerateHepaticImpairment(ctx: RuleContext): boolean {
  if (isChildPughC(ctx)) return false;
  const cp = getChildPughGrade(ctx);
  return cp === 'A' || cp === 'B' || hasCondition(ctx, 'liverDisease') || hasCondition(ctx, 'cirrhosis');
}

export function hasMtcOrMen2(ctx: RuleContext): boolean {
  return hasRawFlag(ctx, 'historyMtcOrMen2', 'mtcMen2History', 'mtc', 'men2');
}

export function hasPancreatitisHistory(ctx: RuleContext): boolean {
  return hasRawFlag(ctx, 'historyPancreatitis', 'acutePancreatitis', 'pancreatitis');
}

export function hasAdrenalInsufficiency(ctx: RuleContext): boolean {
  return hasRawFlag(ctx, 'adrenalInsufficiency', 'addisonDisease', 'adrenal_insufficiency');
}

export function hasBilateralRenalArteryStenosis(ctx: RuleContext): boolean {
  return hasRawFlag(ctx, 'bilateralRenalArteryStenosis', 'renalArteryStenosis', 'bilateral_ras');
}

export function hasSuspectedRenalArteryStenosis(ctx: RuleContext): boolean {
  if (hasBilateralRenalArteryStenosis(ctx)) return false;
  return hasCondition(ctx, 'renalBruit') || hasRawFlag(ctx, 'renalBruit', 'suspectedRenalArteryStenosis');
}

export function hasCpsContraindication(ctx: RuleContext): boolean {
  return hasRawFlag(
    ctx,
    'bowelObstruction',
    'obstructiveBowelDisease',
    'ileus',
    'postoperativeIleus',
    'hypercalcemia'
  );
}

export function isBreastfeedingCkd(ctx: RuleContext): boolean {
  if (hasCkdFlag(ctx, 'pregnant')) return false;
  return isBreastfeeding(ctx.patient) || hasCondition(ctx, 'breastfeeding') || hasRawFlag(ctx, 'breastfeeding');
}

export function isCkdLactationUnsafe(ctx: RuleContext, drugIdOrName: string): boolean {
  if (!isBreastfeedingCkd(ctx)) return false;
  return evaluateLactationSafety(drugIdOrName, ctx.patient) !== null;
}

export function hasCkdDrugAllergy(ctx: RuleContext, drugIdOrName: string): boolean {
  if (evaluateAllergySafety(drugIdOrName, ctx.patient) !== null) return true;
  const cond = (ctx.patient.conditions ?? {}) as Record<string, unknown>;
  const custom = (ctx.normalized?.customInputs ?? ctx.patient.customInputs ?? {}) as Record<string, unknown>;
  const checkMap = (map: Record<string, unknown>, key: string): boolean => Boolean(map[key]);

  const comps = [normalizeDrugId(drugIdOrName), ...getMedComponents(drugIdOrName)].filter(Boolean);
  for (const c of comps) {
    const keys = [`allergy_${c}`, `allergy${c.charAt(0).toUpperCase()}${c.slice(1)}`];
    const kb = getDrugSafe(c);
    const cls = kb?.class?.toLowerCase();
    if (cls === 'sglt2i') keys.push('allergy_sglt2i', 'allergySglt2i');
    if (cls === 'acei') keys.push('allergy_acei', 'allergyAcei');
    if (cls === 'arb') keys.push('allergy_arb', 'allergyArb');
    if (cls === 'statin') keys.push('allergy_statin', 'allergyStatin');
    if (cls === 'glp-1 ra') keys.push('allergy_glp1ra', 'allergyGlp1ra');
    if (keys.some((k) => checkMap(cond, k) || checkMap(custom, k))) return true;
  }
  return false;
}

export function hasHyperkalemicEcg(ctx: RuleContext): boolean {
  return hasRawFlag(ctx, 'ecgHyperkalemia', 'ecgHyperkalemiaChanges');
}

export function isAkiActive(ctx: RuleContext): boolean {
  const custom = ctx.normalized?.customInputs ?? ctx.patient.customInputs;
  if (hasRawFlag(ctx, 'akiSuspected', 'aki')) return true;

  const scr = need(ctx, 'scr');
  const baseScr = getBaselineScrUmol(ctx);
  const deltaStage1 = thFor('scr', 'ckd.aki.scr_increase_stage1');
  const ratioStage1 = thFor('ratio', 'ckd.aki.scr_ratio_stage1');

  if (scr !== undefined && baseScr !== undefined && baseScr > 0) {
    if (scr - baseScr >= deltaStage1 || scr / baseScr >= ratioStage1) {
      return true;
    }
  }

  const uo = custom?.urineOutputRate as string | undefined;
  if (uo && uo !== 'normal') return true;

  return false;
}

export function isOutpatientAcuteCrisis(ctx: RuleContext): boolean {
  const sbpVal = need(ctx, 'sbp');
  const kVal = need(ctx, 'k');
  const hco3Val = need(ctx, 'hco3');

  const hypoCrisisSbp = thFor('sbp', 'ckd.bp.hypotension_crisis_sbp');
  const hyperkEmergencyMin = thFor('k', 'ckd.hyperkalemia.moderate_min');
  const kNormalMax = thFor('k', 'ckd.rasi.k_uptitrate_max');
  const hco3EmergencyMax = thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency');

  if (sbpVal !== undefined && sbpVal < hypoCrisisSbp) return true;
  if (kVal !== undefined && kVal >= hyperkEmergencyMin) return true;
  if (hasHyperkalemicEcg(ctx) && (kVal === undefined || kVal > kNormalMax)) return true;
  if (hco3Val !== undefined && hco3Val < hco3EmergencyMax) return true;
  if (
    hasCondition(ctx, 'cardiogenicShock') ||
    hasCondition(ctx, 'acutePulmonaryEdema') ||
    hasCondition(ctx, 'activeBleeding') ||
    isDkaSuspected(ctx) ||
    hasRawFlag(ctx, 'septicShock', 'shock', 'acuteDecompensatedHf', 'pulmonaryEdema', 'refractoryPulmonaryEdema')
  ) {
    return true;
  }

  return false;
}
