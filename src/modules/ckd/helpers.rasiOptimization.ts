/** Shared RASi dose limits and the prerequisite for adding finerenone. */
import type { CurrentMed, RuleContext } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  extractRasiComponentId, getDrugSafe, getRenalMaxDailyDoseInfo, getTargetMaxDailyDoseMg,
  hasBilateralRenalArteryStenosis, hasExcessiveRasiCreatinineRise,
  hasMildModerateHepaticImpairment, isDriMed, isRasiOrArniMed,
  medDisplayName, parseCurrentDailyDoseMg,
} from './helpers';

export function getCkdRasiDoseState(ctx: RuleContext, med: CurrentMed) {
  const component = extractRasiComponentId(med);
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const currentDailyMg = component ? parseCurrentDailyDoseMg(med, component) : undefined;
  const target = getTargetMaxDailyDoseMg(getDrugSafe(component));
  const renalCeiling = component ? getRenalMaxDailyDoseInfo(component, egfr, crcl, false) : undefined;
  const hepaticMax = component === 'telmisartan' && hasMildModerateHepaticImpairment(ctx)
    ? thFor('dose_mg', 'ckd.rasi.telmisartan_hepatic_max_dose') : undefined;
  const limits = [target, renalCeiling?.maxDailyMg, hepaticMax].filter((v): v is number => v !== undefined);
  const effectiveMaxMg = limits.length ? Math.min(...limits) : undefined;
  const vnRenalContra = ctx.settings.profile === 'VN' && component === 'perindopril' &&
    ((egfr !== undefined && egfr < thFor('egfr', 'ckd.egfr.g3b_min')) ||
      (crcl !== undefined && crcl < thFor('egfr', 'ckd.egfr.g3b_min')));
  return { component, currentDailyMg, effectiveMaxMg, renalCeiling, hepaticMax, vnRenalContra };
}

export function finerenoneRasiBarrier(ctx: RuleContext): string {
  const meds = ctx.patient.currentMeds.filter((m) => isRasiOrArniMed(m) || isDriMed(m));
  if (meds.length >= 2) { // qa-allow: index - multiple RAA blockers
    return 'Đang dùng đồng thời nhiều thuốc ức chế hệ RAA; cần ngừng bớt 1 thuốc và đánh giá lại K⁺, SCr trước';
  }
  const med = meds[0];
  if (!med) return '';
  if (hasBilateralRenalArteryStenosis(ctx)) return 'Đang dùng RASi trên nền hẹp động mạch thận hai bên; cần ngừng RASi và ổn định chức năng thận trước';
  if (hasExcessiveRasiCreatinineRise(ctx)) return 'Creatinin đang tăng vượt ngưỡng an toàn so với nền; cần tạm ngừng RASi và tìm nguyên nhân trước';
  const state = getCkdRasiDoseState(ctx, med);
  if (!state.component) return '';
  if (state.vnRenalContra) return `${medDisplayName(med)} chống chỉ định ở mức lọc cầu thận hiện tại theo BYT 2024; cần chuyển sang ARB và ổn định K⁺, SCr trước`;
  if (state.currentDailyMg !== undefined && state.effectiveMaxMg !== undefined && state.currentDailyMg > state.effectiveMaxMg) {
    return `${medDisplayName(med)} hiện vượt trần liều an toàn thận/gan; cần giảm về liều trần và kiểm tra lại K⁺, SCr trước`;
  }
  if (state.currentDailyMg === undefined) return `Chưa xác định được tổng liều ngày của ${medDisplayName(med)} (Fail-closed); cần xác nhận đạt liều tối đa dung nạp trước`;
  const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
  if (Boolean(custom?.rasiMaxTolerated)) return '';
  if (hasCondition(ctx, 'orthostaticHypotension')) {
    return 'Không tăng RASi do hạ huyết áp tư thế; cần đánh giá triệu chứng và huyết áp tư thế, ổn định huyết động rồi xác nhận liều RASi tối đa dung nạp. Cờ hạ huyết áp tư thế không tự chứng minh đã đạt liều tối đa dung nạp';
  }
  const sbp = need(ctx, 'sbp');
  const k = need(ctx, 'k');
  if (state.effectiveMaxMg !== undefined && state.currentDailyMg < state.effectiveMaxMg &&
    sbp !== undefined && sbp >= thFor('sbp', 'ckd.rasi.sbp_initiate_min') &&
    k !== undefined && k <= thFor('k', 'ckd.rasi.k_uptitrate_max')) {
    return `${medDisplayName(med)} hiện mới ở liều ${state.currentDailyMg} mg/ngày (< liều đích dung nạp ${state.effectiveMaxMg} mg/ngày)`;
  }
  return '';
}
