/**
 * GDMT-VN Module Tăng huyết áp (htn) - Hàm Hỗ trợ Phân bậc Điều trị Ngoại trú (Bước 1–3)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { th, thFor } from '../../kb-types';
import {
  BB_IDS,
  CCB_IDS,
  DIURETIC_IDS,
  MRA_IDS,
  RASI_IDS,
  hasHighCvRiskComorbidity,
  isHfrEf,
  needsLenientTarget
} from './helpers';

const LITHIUM_IDS = ['lithium', 'lithium_carbonate'];

export function getPreventRiskPct(ctx: RuleContext): number | undefined {
  const raw =
    ctx.normalized?.customInputs?.preventRiskPct ??
    ctx.patient?.customInputs?.preventRiskPct ??
    need(ctx, 'customInputs.preventRiskPct');
  return typeof raw === 'number' && !Number.isNaN(raw) ? raw : undefined;
}

export function getScore2RiskPct(ctx: RuleContext): number | undefined {
  const derRec = ctx.derived as Record<string, unknown> | undefined;
  const raw =
    ctx.normalized?.customInputs?.score2RiskPercent ??
    ctx.patient?.customInputs?.score2RiskPercent ??
    derRec?.score2 ??
    need(ctx, 'customInputs.score2RiskPercent');
  return typeof raw === 'number' && !Number.isNaN(raw) ? raw : undefined;
}

export function shouldDeferToHfrEfPillars(ctx: RuleContext, effectiveMeds: string[]): boolean {
  if (!isHfrEf(ctx)) return false;
  if (ctx.patient.selectedModules.includes('hf')) return true;
  const hasRasi = effectiveMeds.some((id) => RASI_IDS.includes(id));
  const hasBb = effectiveMeds.some((id) => BB_IDS.includes(id));
  const hasMra = effectiveMeds.some((id) => MRA_IDS.includes(id));
  return !(hasRasi && hasBb && hasMra);
}

export function hasRasiHighRiskDdi(rawMedIds: string[]): boolean {
  const onLithium = rawMedIds.some((id) => LITHIUM_IDS.includes(id));
  const onKSparing = rawMedIds.includes('amiloride') || rawMedIds.includes('triamterene');
  const onKSupplement =
    rawMedIds.includes('potassium_chloride') || rawMedIds.includes('kcl') || rawMedIds.includes('potassium');
  return onLithium || (onKSparing && onKSupplement);
}

export function countCoreClasses(medIds: string[]): {
  hasRasi: boolean;
  hasCcb: boolean;
  hasDiuretic: boolean;
  count: number;
} {
  const hasRasi = medIds.some((id) => RASI_IDS.includes(id));
  const hasCcb = medIds.some((id) => CCB_IDS.includes(id));
  const hasDiuretic = medIds.some((id) => DIURETIC_IDS.includes(id));
  return {
    hasRasi,
    hasCcb,
    hasDiuretic,
    count: (hasRasi ? 1 : 0) + (hasCcb ? 1 : 0) + (hasDiuretic ? 1 : 0)
  };
}

export type Step1Mode =
  | 'none'
  | 'missing_sbp'
  | 'missing_dbp'
  | 'missing_age'
  | 'vn_elderly_defer'
  | 'elderly_mono'
  | 'dual_spc'
  | 'intl_elevated_mono'
  | 'us_stage1_mono'
  | 'us_stage1_lowrisk_consider'
  | 'vn_highnormal_mono';

export function resolveStep1ZeroMedMode(ctx: RuleContext): Step1Mode {
  const sbp = need(ctx, 'sbp');
  const dbp = need(ctx, 'dbp');
  const age = need(ctx, 'age');

  if (sbp === undefined) return 'missing_sbp';
  if (dbp === undefined) return 'missing_dbp';
  if (age === undefined) return 'missing_age';

  const profile = ctx.settings.profile;
  const sbpHtn = thFor('sbp', 'htn.bp.sbp_hypertension');
  const dbpHtn = thFor('dbp', 'htn.bp.dbp_hypertension');
  const sbpStage1Us = thFor('sbp', 'htn.bp.sbp_stage1_us');
  const dbpStage1Us = thFor('dbp', 'htn.bp.dbp_stage1_us');
  const sbpVnHn = thFor('sbp', 'htn.bp.sbp_high_normal_vn');
  const dbpVnHn = thFor('dbp', 'htn.bp.dbp_high_normal_vn');
  const age80 = thFor('age', 'htn.age.elderly_monotherapy');
  const age70 = thFor('age', 'htn.elderly.vn_age_70');
  const sbpVn80 = thFor('sbp', 'htn.elderly.vn_sbp_80plus');
  const score2High = th('htn.risk.score2_high_intl');
  const preventHigh = th('htn.risk.prevent_high_us');

  // VSH/VNHA 2022 Bảng 9: Người cao tuổi >= 80 tuổi tại VN chỉ khởi trị thuốc (đơn trị liều thấp) khi HA >= 160/90 mmHg
  if (profile === 'VN' && age >= age80) {
    if (sbp >= sbpVn80 || dbp >= dbpHtn) return 'elderly_mono';
    if (sbp >= sbpHtn) return 'vn_elderly_defer';
    return 'none';
  }

  // Bệnh nhân rất cao tuổi (>= 85t), suy yếu vừa-nặng, hạ HA tư thế đứng hoặc kỳ vọng sống ngắn: đơn trị liều thấp khi >= 140/90 mmHg
  if (needsLenientTarget(ctx)) {
    return sbp >= sbpHtn || dbp >= dbpHtn ? 'elderly_mono' : 'none';
  }

  if (profile === 'INTL') {
    if (sbp >= sbpHtn || dbp >= dbpHtn) return 'dual_spc';
    const score2 = getScore2RiskPct(ctx);
    if (
      (sbp >= sbpStage1Us || dbp >= dbpStage1Us) &&
      (hasHighCvRiskComorbidity(ctx) || (score2 !== undefined && score2 >= score2High))
    ) {
      return 'intl_elevated_mono';
    }
    return 'none';
  }

  if (profile === 'US') {
    if (sbp >= sbpHtn || dbp >= dbpHtn) return 'dual_spc';
    if (sbp >= sbpStage1Us || dbp >= dbpStage1Us) {
      const prevent = getPreventRiskPct(ctx);
      if (hasHighCvRiskComorbidity(ctx) || (prevent !== undefined && prevent >= preventHigh)) {
        return 'us_stage1_mono';
      }
      return 'us_stage1_lowrisk_consider';
    }
    return 'none';
  }

  // Profile VN (< 80 tuổi, không suy yếu): VSH 2022 Bảng 9 ưu tiên viên phối hợp đôi liều cố định ngay từ Độ 1 (>= 140/90 mmHg)
  if (sbp >= sbpHtn || dbp >= dbpHtn) {
    return 'dual_spc';
  }
  const score2 = getScore2RiskPct(ctx);
  if (
    age < age70 &&
    (sbp >= sbpVnHn || dbp >= dbpVnHn) &&
    (hasHighCvRiskComorbidity(ctx) || (score2 !== undefined && score2 >= score2High))
  ) {
    return 'vn_highnormal_mono';
  }

  return 'none';
}
