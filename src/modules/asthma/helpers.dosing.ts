/**
 * GDMT-VN Module Hen phế quản (Asthma) - Helpers phân tích liều, dị ứng, thai kỳ & chọn thuốc
 * Phân quyền: Agent M
 */

import type {
  Action,
  CurrentMed,
  GateResult,
  Recommendation,
  Rule,
  RuleContext,
  Setting
} from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { hasRespiratoryCyp3a4Inhibitor } from '../../engine/safety/inhaledCypSafety';
import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import { thFor, drug } from '../../kb-types';
import {
  ADULT_18_ONLY_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  ICS_CONTAINING_DRUGS,
  MART_ICS_FORMOTEROL_DRUGS,
  MONO_ICS_DRUGS,
  NON_SELECTIVE_BB_DRUGS,
  TRACK2_ICS_LABA_DRUGS
} from './helpers.constants';

export const asDose = (s: string): string => s;

export function asthmaRule(def: {
  id: string;
  nameVi: string;
  setting: Setting | 'both';
  citationIds: string[];
  when: (ctx: RuleContext) => boolean;
  produce: (ctx: RuleContext) => Recommendation | null;
}): Rule {
  return {
    module: 'asthma',
    profiles: ['VN', 'INTL', 'US'],
    ...def
  };
}

export function asthmaGate(
  parameter: string,
  passed: boolean,
  messageVi: string,
  value?: number | string,
  threshold?: number | string
): GateResult {
  return { parameter, passed, messageVi, value, threshold };
}

/**
 * Chuẩn hóa hệ số nhân tần suất/ngày từ `freq` (hỗ trợ 'Sáng - tối', '2 lần/ngày', 'BID', 'TID', 'QID', 'QD').
 * Fail-closed: Trả về `undefined` khi chuỗi tần suất mơ hồ hoặc chỉ là PRN ('khi cần').
 */
export function parseFreqMultiplier(freq?: string): number | undefined {
  if (!freq) return undefined;
  const f = freq.trim().toLowerCase();
  if (!f) return undefined;
  if (f.includes('khi cần') || f.includes('prn') || f.includes('tùy') || f.includes('cắt cơn')) {
    return undefined;
  }
  const nPerDay = f.match(/(\d+(?:[.,]\d+)?)\s*lần\s*\/\s*ngày/);
  if (nPerDay) {
    const val = Number(nPerDay[1].replace(',', '.'));
    return Number.isFinite(val) && val > 0 ? val : undefined;
  }
  const qHours = f.match(/(?:mỗi|q)\s*(\d+)\s*(?:h|giờ)/);
  if (qHours) {
    const hours = Number(qHours[1]);
    return hours > 0 && hours <= 24 ? 24 / hours : undefined; // qa-allow: unit-conversion - quy đổi khoảng cách giờ sang số lần/24h
  }
  if (
    f === 'bid' ||
    f.includes('sáng - tối') ||
    f.includes('sáng – tối') ||
    f.includes('sáng tối') ||
    f.includes('ngày 2 lần') ||
    f.includes('2 lần')
  ) {
    return 2; // qa-allow: unit-conversion - tần suất BID = 2 lần/ngày
  }
  if (f === 'tid' || f.includes('sáng - trưa - tối') || f.includes('ngày 3 lần') || f.includes('3 lần')) {
    return 3; // qa-allow: unit-conversion - tần suất TID = 3 lần/ngày
  }
  if (f === 'qid' || f.includes('ngày 4 lần') || f.includes('4 lần')) {
    return 4; // qa-allow: unit-conversion - tần suất QID = 4 lần/ngày
  }
  if (
    f === 'qd' ||
    f === 'od' ||
    f === 'qhs' ||
    f.includes('1 lần') ||
    f.includes('mỗi ngày') ||
    f.includes('hàng ngày') ||
    f.includes('buổi tối') ||
    f.includes('buổi sáng')
  ) {
    return 1; // qa-allow: unit-conversion - tần suất QD = 1 lần/ngày
  }
  return undefined;
}

/**
 * Trích xuất tổng số nhát hít/xịt mỗi ngày từ một mục `CurrentMed`.
 * BẮT BUỘC nhân với tần suất (`freq`) khi `dose` ghi số nhát mỗi lần dùng,
 * và fail-closed (`undefined`) nếu thiếu đơn vị nhát/xịt/hít/puff hoặc không rõ tần suất.
 */
export function parseDailyInhalationsFromMed(m: CurrentMed): number | undefined {
  const d = String(m.dose ?? '').trim().toLowerCase();
  if (!d) return undefined;

  const directDaily = d.match(/(\d+(?:[.,]\d+)?)\s*(?:nhát|xịt|hít|puffs?|inhalations?)\s*\/\s*ngày/);
  if (directDaily) {
    const val = Number(directDaily[1].replace(',', '.'));
    return Number.isFinite(val) && val > 0 ? val : undefined;
  }

  const inlineTimes = d.match(
    /(\d+(?:[.,]\d+)?)\s*(?:nhát|xịt|hít|puffs?|inhalations?)\s*(?:x|×|\*)\s*(\d+(?:[.,]\d+)?)\s*lần\s*(?:\/\s*ngày)?/
  );
  if (inlineTimes) {
    const puffs = Number(inlineTimes[1].replace(',', '.'));
    const times = Number(inlineTimes[2].replace(',', '.'));
    return Number.isFinite(puffs) && Number.isFinite(times) && puffs > 0 && times > 0
      ? puffs * times
      : undefined;
  }

  const singleAdminPuffs = d.match(/(\d+(?:[.,]\d+)?)\s*(?:nhát|xịt|hít|puffs?|inhalations?)\b/);
  if (!singleAdminPuffs) return undefined;
  const puffsPerAdmin = Number(singleAdminPuffs[1].replace(',', '.'));
  if (!Number.isFinite(puffsPerAdmin) || puffsPerAdmin <= 0) return undefined;

  const mult = parseFreqMultiplier(m.freq) ?? parseFreqMultiplier(d);
  if (mult === undefined) return undefined;
  return puffsPerAdmin * mult;
}

export function getPatientAllergies(ctx: RuleContext): string[] {
  const out: string[] = [];
  const rawPatient = ctx.patient as unknown as { allergies?: unknown };
  if (Array.isArray(rawPatient.allergies)) {
    for (const item of rawPatient.allergies) {
      if (typeof item === 'string' && item.trim()) out.push(item.trim());
    }
  }
  const ciAllergies = ctx.patient.customInputs?.allergies;
  if (typeof ciAllergies === 'string' && ciAllergies.trim()) {
    for (const part of ciAllergies.split(/[,;]+/)) {
      if (part.trim()) out.push(part.trim());
    }
  }
  return out;
}

export function hasCustomCond(ctx: RuleContext, key: string): boolean {
  return Boolean(ctx.patient.conditions?.[key] || ctx.patient.customInputs?.[key]);
}

export function isPatientPregnant(ctx: RuleContext): boolean {
  const rawPt = ctx.patient as unknown as {
    pregnant?: boolean;
    pregnancy?: { isPregnant?: boolean };
  };
  return (
    rawPt.pregnant === true ||
    rawPt.pregnancy?.isPregnant === true ||
    Boolean(ctx.patient.customInputs?.isPregnant) ||
    hasCondition(ctx, 'pregnant') ||
    hasCondition(ctx, 'pregnancy')
  );
}

export function isPatientBreastfeeding(ctx: RuleContext): boolean {
  const rawPt = ctx.patient as unknown as { breastfeeding?: boolean };
  return (
    rawPt.breastfeeding === true ||
    hasCustomCond(ctx, 'breastfeeding') ||
    hasCustomCond(ctx, 'lactation')
  );
}

export function hasPatientAerd(ctx: RuleContext): boolean {
  return (
    hasCondition(ctx, 'aerd') ||
    hasCustomCond(ctx, 'aspirinExacerbated') ||
    hasCustomCond(ctx, 'samter') ||
    hasCustomCond(ctx, 'nsaidHypersensitivity')
  );
}

export function hasSevereMilkProteinAllergy(ctx: RuleContext): boolean {
  if (
    hasCustomCond(ctx, 'severeMilkProteinAllergy') ||
    hasCustomCond(ctx, 'milkProteinAllergy') ||
    hasCustomCond(ctx, 'cowMilkAllergy')
  ) {
    return true;
  }
  return getPatientAllergies(ctx).some((raw: string) => {
    const a = raw.toLowerCase();
    return (
      a.includes('milk protein') ||
      a.includes('cow milk') ||
      a.includes('đạm sữa bò') ||
      a.includes('protein sữa bò') ||
      a.includes('dị ứng sữa bò') ||
      a.includes('lactose nặng')
    );
  });
}

export function hasNarrowAngleGlaucoma(ctx: RuleContext): boolean {
  return (
    hasCustomCond(ctx, 'narrowAngleGlaucoma') ||
    hasCustomCond(ctx, 'glaucoma') ||
    hasCustomCond(ctx, 'angleClosureGlaucoma')
  );
}

export function hasUrinaryRetentionOrBph(ctx: RuleContext): boolean {
  return (
    hasCustomCond(ctx, 'urinaryRetention') ||
    hasCustomCond(ctx, 'bph') ||
    hasCustomCond(ctx, 'prostaticHyperplasia') ||
    hasCustomCond(ctx, 'bladderNeckObstruction')
  );
}

export function hasMyastheniaOrHeartBlock(ctx: RuleContext): boolean {
  return (
    hasCustomCond(ctx, 'myastheniaGravis') ||
    hasCustomCond(ctx, 'myasthenia') ||
    hasCustomCond(ctx, 'heartBlock') ||
    hasCustomCond(ctx, 'avBlock') ||
    hasCustomCond(ctx, 'avBlock23')
  );
}

export function hasConcurrentCopdOrHypercapnia(ctx: RuleContext): boolean {
  const ci = ctx.patient.customInputs ?? {};
  const paco2 = typeof ci.paco2 === 'number' ? ci.paco2 : (need(ctx, 'paco2') ?? need(ctx, 'abgPaco2'));
  const hypercapniaCutoff = thFor('paco2', 'asthma.acute.life_threatening_paco2_mmhg');
  return (
    hasCondition(ctx, 'copd') ||
    ctx.patient.selectedModules.includes('copd') ||
    hasCustomCond(ctx, 'chronicHypercapnia') ||
    (paco2 !== undefined && paco2 > hypercapniaCutoff)
  );
}

export function hasConcurrentPreeclampsiaMgso4(ctx: RuleContext): boolean {
  const isPreeclampsia =
    hasCondition(ctx, 'severePreeclampsiaEclampsia') ||
    hasCustomCond(ctx, 'preeclampsia') ||
    hasCustomCond(ctx, 'severePreeclampsia') ||
    hasCustomCond(ctx, 'eclampsia');
  if (!isPreeclampsia) return false;
  return (
    ctx.patient.selectedModules.includes('htn') ||
    ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'magnesium_sulfate')
  );
}

export function hasStrongCyp3a4Inhibitor(ctx: RuleContext): boolean {
  return hasRespiratoryCyp3a4Inhibitor(ctx.patient);
}

export function isAllergicToDrug(ctx: RuleContext, drugId: string): boolean {
  const allergies = getPatientAllergies(ctx);
  if (allergies.length === 0) return false;

  const targetId = drugId.trim().toLowerCase();
  const tokens = new Set<string>([targetId, targetId.replace(/_/g, ' ')]);
  for (const part of targetId.split('_')) {
    if (part.length >= 4) tokens.add(part); // qa-allow: index - độ dài tối thiểu token hoạt chất
  }

  try {
    const entry = drug(targetId);
    if (entry.inn) tokens.add(entry.inn.toLowerCase());
    if (entry.nameVi) tokens.add(entry.nameVi.toLowerCase());
    for (const c of entry.components ?? []) tokens.add(c.toLowerCase());
    for (const b of entry.vnBrands ?? []) tokens.add(b.toLowerCase());
  } catch {
    // Hoạt chất ngoài KB
  }

  if (targetId === 'salbutamol') tokens.add('albuterol');
  if (targetId === 'ipratropium') tokens.add('atropin');

  for (const rawAllergy of allergies) {
    const al = rawAllergy.trim().toLowerCase();
    if (!al || al.includes('milk protein') || al.includes('đạm sữa bò')) continue;
    for (const tok of tokens) {
      if (tok && (al === tok || al.includes(tok) || (al.length >= 4 && tok.includes(al)))) { // qa-allow: index - độ dài tối thiểu đối khớp tên dị ứng
        return true;
      }
    }
  }
  return false;
}

export function isMedDpiDevice(m: CurrentMed): boolean {
  const id = m.drugId.toLowerCase();
  if (DPI_ONLY_LACTOSE_DRUGS.has(id)) return true;
  const text = `${m.name ?? ''} ${String(m.dose ?? '')}`.toLowerCase();
  return (
    text.includes('turbuhaler') ||
    text.includes('accuhaler') ||
    text.includes('diskus') ||
    text.includes('ellipta') ||
    text.includes('nexthaler') ||
    text.includes('breezhaler') ||
    text.includes('handihaler') ||
    text.includes('bột khô') ||
    text.includes('dpi')
  );
}

export function isUsingRapihaler80(ctx: RuleContext): boolean {
  const ci = ctx.patient.customInputs ?? {};
  if (ci.icsFormoterolStrength === '80_2.25') return true;
  return ctx.patient.currentMeds.some((m) => {
    if (m.drugId.toLowerCase() !== 'budesonide_formoterol') return false;
    const text = `${m.name ?? ''} ${String(m.dose ?? '')}`.toLowerCase();
    return text.includes('80/2.25') || text.includes('80/2,25');
  });
}

export function getMartMaxDailyPuffs(ctx: RuleContext): number {
  return isUsingRapihaler80(ctx)
    ? thFor('inhalations_count', 'asthma.formoterol.rapihaler_80_max_inhalations')
    : thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations');
}

export function getEffectiveDailyMartPuffs(ctx: RuleContext): number | undefined {
  const ci = ctx.patient.customInputs ?? {};
  const hasIcsFormMed = ctx.patient.currentMeds.some((m) =>
    MART_ICS_FORMOTEROL_DRUGS.has(m.drugId.toLowerCase())
  );
  if (ci.currentTrack === 'track2' && !hasIcsFormMed) {
    return undefined;
  }

  let parsedFromMeds = 0;
  let foundParsed = false;
  for (const m of ctx.patient.currentMeds) {
    if (MART_ICS_FORMOTEROL_DRUGS.has(m.drugId.toLowerCase())) {
      const daily = parseDailyInhalationsFromMed(m);
      if (daily !== undefined) {
        parsedFromMeds += daily;
        foundParsed = true;
      }
    }
  }

  const sliderVal = typeof ci.totalDailyPuffsUsed === 'number' ? ci.totalDailyPuffsUsed : undefined;
  if (sliderVal !== undefined && foundParsed) return Math.max(sliderVal, parsedFromMeds);
  if (sliderVal !== undefined && sliderVal > 0) return sliderVal;
  if (foundParsed) return parsedFromMeds;
  return sliderVal;
}

export function isMartOveruse(ctx: RuleContext): boolean {
  const used = getEffectiveDailyMartPuffs(ctx);
  if (used === undefined) return false;
  return used > getMartMaxDailyPuffs(ctx);
}

export function resolveTrack1MartDrugId(
  ctx: RuleContext
): 'budesonide_formoterol' | 'beclometasone_formoterol' {
  const age = need(ctx, 'age');
  const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
  const is18Plus = age !== undefined && age >= minAdult18;
  const ci = ctx.patient.customInputs ?? {};

  const allergicBudForm = isAllergicToDrug(ctx, 'budesonide_formoterol');
  const allergicBdpForm = isAllergicToDrug(ctx, 'beclometasone_formoterol');

  if (!is18Plus) return 'budesonide_formoterol';
  if (allergicBudForm && !allergicBdpForm) return 'beclometasone_formoterol';
  if (allergicBdpForm && !allergicBudForm) return 'budesonide_formoterol';
  if (hasStrongCyp3a4Inhibitor(ctx)) return 'beclometasone_formoterol';

  const hasBdpForm =
    ci.icsFormoterolStrength === '100_6' ||
    ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'beclometasone_formoterol');
  const hasBudForm = ctx.patient.currentMeds.some(
    (m) => m.drugId.toLowerCase() === 'budesonide_formoterol'
  );
  if (hasBdpForm && !hasBudForm) return 'beclometasone_formoterol';
  return 'budesonide_formoterol';
}

export function resolveTrack2MonoIcsDrugId(ctx: RuleContext): string {
  const milkAllergy = hasSevereMilkProteinAllergy(ctx);
  const strongCyp = hasStrongCyp3a4Inhibitor(ctx);

  const existing = ctx.patient.currentMeds.find((m) => {
    const id = m.drugId.toLowerCase();
    if (!MONO_ICS_DRUGS.has(id)) return false;
    if (isAllergicToDrug(ctx, id)) return false;
    if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
    if (strongCyp && id !== 'beclometasone') return false;
    return true;
  });
  if (existing) return existing.drugId.toLowerCase();

  if (strongCyp && !isAllergicToDrug(ctx, 'beclometasone')) return 'beclometasone';
  if (!isAllergicToDrug(ctx, 'fluticasone_propionate')) return 'fluticasone_propionate';
  if (!isAllergicToDrug(ctx, 'budesonide')) return 'budesonide';
  return 'beclometasone';
}

export function resolveTrack2IcsLabaDrugId(
  ctx: RuleContext
): 'fluticasone_salmeterol' | 'fluticasone_vilanterol' | 'mometasone_formoterol' {
  const milkAllergy = hasSevereMilkProteinAllergy(ctx);

  const existing = ctx.patient.currentMeds.find((m) => {
    const id = m.drugId.toLowerCase();
    if (!TRACK2_ICS_LABA_DRUGS.has(id)) return false;
    if (isAllergicToDrug(ctx, id)) return false;
    if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
    return true;
  });
  if (existing) {
    return existing.drugId.toLowerCase() as
      | 'fluticasone_salmeterol'
      | 'fluticasone_vilanterol'
      | 'mometasone_formoterol';
  }

  if (!isAllergicToDrug(ctx, 'fluticasone_salmeterol')) return 'fluticasone_salmeterol';
  if (!milkAllergy && !isAllergicToDrug(ctx, 'fluticasone_vilanterol')) return 'fluticasone_vilanterol';
  return 'mometasone_formoterol';
}

export function resolveControllerAction(
  ctx: RuleContext,
  targetDrugId: string,
  desiredWhenOnTarget: 'CONTINUE' | 'UPTITRATE' | 'REDUCE'
): { action: Action; switchFrom?: string } {
  const targetLower = resolveKbDrugId(targetDrugId);
  const onTarget = ctx.patient.currentMeds.some((m) => resolveKbDrugId(m.drugId) === targetLower);
  if (onTarget) return { action: desiredWhenOnTarget };

  const age = need(ctx, 'age');
  const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
  const existingOtherController = ctx.patient.currentMeds.find((m) => {
    const id = resolveKbDrugId(m.drugId);
    if (id === targetLower) return false;
    if (ICS_CONTAINING_DRUGS.has(id)) return true;
    if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return true;
    return false;
  });
  if (existingOtherController) {
    return { action: 'SWITCH', switchFrom: existingOtherController.drugId };
  }
  return { action: 'START' };
}

export function resolveAcuteMedAction(ctx: RuleContext, drugId: string): 'START' | 'UPTITRATE' {
  const lower = drugId.toLowerCase();
  const isAlreadyTaking = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === lower);
  return isAlreadyTaking ? 'UPTITRATE' : 'START';
}

export function isMedOffendingBetaBlocker(m: CurrentMed): boolean {
  const id = m.drugId.toLowerCase();
  const nm = (m.name || '').toLowerCase();
  return NON_SELECTIVE_BB_DRUGS.has(id) || id.includes('timolol') || nm.includes('timolol');
}
