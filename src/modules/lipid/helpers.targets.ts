/**
 * GDMT-VN Lipid Module - Unit Formatting, Secondary Targets & Common Warning Helpers
 * Phân quyền: Agent I5 (Round 3 Remediation — split from helpers.ts)
 */

import type { RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  CHOL_CONVERSION_FACTOR,
  TG_CONVERSION_FACTOR,
  URAT_CONVERSION_FACTOR
} from '../../engine/units';
import type { EscRiskTier, LdlTargetResult } from '../../engine/calculators/types';
import {
  assessStatinSafety,
  getCustomNumber,
  hasAscvdEquivalent,
  hasLipidFlag,
  hasMyastheniaGravis,
  isAsianPatient,
  isWocbp
} from './helpers.statin';

export * from './helpers.statin';

export interface SecondaryTargetStatus {
  nonHdlMmol?: number;
  nonHdlTargetMmol?: number;
  isNonHdlUnmet: boolean;
  apobMgDl?: number;
  apobTargetMgDl?: number;
  isApobUnmet: boolean;
  hasAnyUnmet: boolean;
}

export function isAcuteAcsInpatient(ctx: RuleContext): boolean {
  return ctx.settings.setting === 'inpatient' && hasLipidFlag(ctx, 'acuteAcsWithin24h');
}

export function isOlderOrFrailPrimary(ctx: RuleContext): boolean {
  if (hasAscvdEquivalent(ctx)) return false;
  const age = need(ctx, 'age');
  const elderlyCutoff = thFor('age', 'lipid.elderly.primary_consider_age');
  return (
    (age !== undefined && age > elderlyCutoff) ||
    hasLipidFlag(ctx, 'frailty') ||
    hasLipidFlag(ctx, 'limitedLifespan')
  );
}

export function isOlderOrFrailSecondary(ctx: RuleContext): boolean {
  if (!hasAscvdEquivalent(ctx)) return false;
  const age = need(ctx, 'age');
  const elderlyCutoff = thFor('age', 'lipid.elderly.primary_consider_age');
  return (
    hasLipidFlag(ctx, 'frailty') ||
    hasLipidFlag(ctx, 'limitedLifespan') ||
    (age !== undefined && age > elderlyCutoff && hasLipidFlag(ctx, 'ckd'))
  );
}

export function isElevatedUrateOrGout(ctx: RuleContext): boolean {
  if (hasLipidFlag(ctx, 'gout')) return true;
  const uricVal = need(ctx, 'uricAcid');
  if (uricVal === undefined) return false;
  const uricCutoff = thFor('uricacid', 'lipid.safety.uric_acid_elevated');
  if (ctx.settings.units.urat === 'mg_dL') {
    const urateMgDlRounded = Number((uricVal / URAT_CONVERSION_FACTOR).toFixed(1)); // qa-allow: unit-conversion - Khoi phuc mg/dL 1 chu so thap phan
    const cutoffMgDl = Math.round(uricCutoff / URAT_CONVERSION_FACTOR);
    return urateMgDlRounded >= cutoffMgDl;
  }
  return uricVal > uricCutoff;
}

export function hasAnyLpaMeasured(ctx: RuleContext): boolean {
  return (
    need(ctx, 'lpa') !== undefined ||
    getCustomNumber(ctx, 'lpaNmol') !== undefined ||
    getCustomNumber(ctx, 'lpa_nmol') !== undefined
  );
}

export function isElevatedLpa(ctx: RuleContext): boolean {
  const lpa = need(ctx, 'lpa');
  const lpaThresh = thFor('lpa', 'lipid.lpa.risk_enhancing_threshold');
  const lpaNmol = getCustomNumber(ctx, 'lpaNmol') ?? getCustomNumber(ctx, 'lpa_nmol');

  if (ctx.settings.profile === 'US') {
    if (lpa !== undefined && lpa >= lpaThresh) return true;
    const usNmolThresh = thFor('lpanmol', 'lipid.lpa.acc_risk_enhancing_nmol');
    return lpaNmol !== undefined && lpaNmol >= usNmolThresh;
  }

  if (lpa !== undefined && lpa > lpaThresh) return true;
  const intlNmolThresh = thFor('lpanmol', 'lipid.lpa.risk_enhancing_nmol');
  return lpaNmol !== undefined && lpaNmol > intlNmolThresh;
}

export function formatChol(mmol: number, ctx: RuleContext): string {
  if (ctx.settings.units.lipid === 'mg_dL') {
    return `${Math.round(mmol * CHOL_CONVERSION_FACTOR)} mg/dL`;
  }
  return `${Number(mmol.toFixed(2))} mmol/L`; // qa-allow: unit-conversion - Lam tron 2 chu so thap phan cho mmol/L
}

export function formatTg(mmol: number, ctx: RuleContext): string {
  if (ctx.settings.units.lipid === 'mg_dL') {
    return `${Math.round(mmol * TG_CONVERSION_FACTOR)} mg/dL`;
  }
  return `${Number(mmol.toFixed(1))} mmol/L`; // qa-allow: unit-conversion - Lam tron 1 chu so thap phan cho TG mmol/L
}

export function formatTargetLdl(targetInfo: LdlTargetResult, ctx: RuleContext): string {
  if (ctx.settings.units.lipid === 'mg_dL') {
    return `${targetInfo.targetLdlMgDl} mg/dL`;
  }
  return `${targetInfo.targetLdlMmol.toFixed(1)} mmol/L`; // qa-allow: unit-conversion - Hien thi dich LDL-C mmol/L 1 chu so thap phan
}

export function getPatientNonHdlMmol(ctx: RuleContext): number | undefined {
  const raw = need(ctx, 'nonHdl');
  if (raw !== undefined) {
    return raw;
  }
  const tc = need(ctx, 'tc');
  const hdl = need(ctx, 'hdl');
  if (tc !== undefined && hdl !== undefined && tc > hdl) {
    return Number((tc - hdl).toFixed(2)); // qa-allow: unit-conversion - Tinh Non-HDL-C tu TC - HDL-C
  }
  return undefined;
}

export function evaluateSecondaryTargets(
  ctx: RuleContext,
  riskTier: EscRiskTier
): SecondaryTargetStatus {
  const nonHdlMmol = getPatientNonHdlMmol(ctx);
  const apobMgDl = need(ctx, 'apob');

  let nonHdlTargetMmol: number | undefined;
  let apobTargetMgDl: number | undefined;

  if (riskTier === 'extreme' || riskTier === 'very_high') {
    nonHdlTargetMmol = thFor('nonhdl', 'lipid.target.non_hdl_very_high');
    apobTargetMgDl = thFor('apob', 'lipid.target.apob_very_high');
  } else if (riskTier === 'high') {
    nonHdlTargetMmol = thFor('nonhdl', 'lipid.target.non_hdl_high');
    apobTargetMgDl = thFor('apob', 'lipid.target.apob_high');
  } else if (riskTier === 'moderate') {
    nonHdlTargetMmol = thFor('nonhdl', 'lipid.target.non_hdl_moderate');
    apobTargetMgDl = thFor('apob', 'lipid.target.apob_moderate');
  }

  const isNonHdlUnmet =
    nonHdlMmol !== undefined &&
    nonHdlTargetMmol !== undefined &&
    (ctx.settings.units.lipid === 'mg_dL'
      ? Math.round(nonHdlMmol * CHOL_CONVERSION_FACTOR) >=
        Math.round(nonHdlTargetMmol * CHOL_CONVERSION_FACTOR)
      : nonHdlMmol >= nonHdlTargetMmol);

  const isApobUnmet =
    apobMgDl !== undefined && apobTargetMgDl !== undefined && apobMgDl >= apobTargetMgDl;

  return {
    nonHdlMmol,
    nonHdlTargetMmol,
    isNonHdlUnmet,
    apobMgDl,
    apobTargetMgDl,
    isApobUnmet,
    hasAnyUnmet: isNonHdlUnmet || isApobUnmet
  };
}

export function canReachTargetWithHighStatinAlone(
  ldlMmol: number,
  targetInfo: LdlTargetResult
): boolean {
  const statinHighPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high');
  const projectedMmol = ldlMmol * (1 - statinHighPct / 100); // qa-allow: unit-conversion - Uoc tinh LDL-C dat duoc voi statin cuong do cao
  return projectedMmol < targetInfo.targetLdlMmol - 1e-6;
}

export function isClass2bExtremeOnlyUnmet(
  ctx: RuleContext,
  targetInfo: LdlTargetResult
): boolean {
  if (targetInfo.riskTier !== 'extreme' || targetInfo.isTargetAchieved) return false;
  const ldl = need(ctx, 'ldl');
  if (ldl === undefined) return false;
  const vhTarget = thFor('ldl', 'lipid.target.very_high_ldl');
  const absMet =
    ctx.settings.units.lipid === 'mg_dL'
      ? Math.round(ldl * CHOL_CONVERSION_FACTOR) < Math.round(vhTarget * CHOL_CONVERSION_FACTOR)
      : ldl < vhTarget;
  if (!absMet) return false;
  const baselineLdl = need(ctx, 'baselineLdl');
  if (baselineLdl !== undefined && baselineLdl > 0) {
    const minPct = thFor('ldl_reduction_pct', 'lipid.target.percent_reduction_min');
    const pctReduction = ((baselineLdl - ldl) / baselineLdl) * 100; // qa-allow: unit-conversion - Tinh phan tram giam LDL-C
    if (pctReduction + 1e-6 < minPct) return false;
  }
  return true;
}

export function buildCommonLipidWarnings(
  ctx: RuleContext,
  opts?: { isStatin?: boolean; drugId?: string }
): string[] {
  const warnings: string[] = [];
  const safety = assessStatinSafety(ctx);
  const preConMin = thFor('interval_months', 'lipid.pregnancy.preconception_stop_min_months');
  const preConMax = thFor('interval_months', 'lipid.pregnancy.preconception_stop_max_months');

  if (isWocbp(ctx)) {
    warnings.push(
      `Phụ nữ trong độ tuổi sinh sản: Tư vấn biện pháp tránh thai tin cậy và ngừng trước Statin / thuốc hạ lipid đường uống ít nhất ${preConMin}–${preConMax} tháng trước khi dự định mang thai (hoặc ngừng ngay lập tức khi phát hiện có thai).`
    );
  }
  if (opts?.isStatin && hasMyastheniaGravis(ctx)) {
    warnings.push(
      'Bệnh nhân có nhược cơ / nhược cơ thể mắt: Nhóm Statin hiếm gặp có thể khởi phát mới hoặc làm nặng thêm nhược cơ (sụp mi, nhìn đôi, yếu cơ hành tủy); theo dõi sát triệu chứng thần kinh-cơ.'
    );
  }
  if (opts?.isStatin && safety.isCompensatedChildPughA) {
    warnings.push(
      'Xơ gan còn bù nhẹ (Child-Pugh A): Khởi trị/duy trì thận trọng ở liều thấp–trung bình và theo dõi sát men gan ALT/AST định kỳ; ngừng thuốc nếu ALT tăng quá ngưỡng an toàn hoặc xuất hiện dấu mất bù.'
    );
  }
  if (opts?.drugId === 'rosuvastatin' && isAsianPatient(ctx)) {
    warnings.push(
      'Cơ địa người châu Á: Nồng độ huyết tương Rosuvastatin tăng gấp khoảng 2 lần so với người da trắng; theo dõi sát triệu chứng đau/yếu cơ khi sử dụng liều cao.'
    );
  }
  return warnings;
}
