/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Chuẩn hóa Hoạt chất, Biệt dược, Viên phối hợp (FDC) & Liều dùng
 * Phân quyền: Agent F4
 */

import type { CurrentMed, RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, hasDrug, thFor } from '../../kb-types/access';
import {
  expandDrugComponents,
  isFdcDrug,
  resolveCanonicalDrugId
} from '../../engine/safety/fdcMap';
import {
  parseComponentDailyDoseMg,
  parseDailyDoseMg,
  parseFrequencyPerDay
} from '../../engine/doseParser';
import { evaluateAllergySafety } from '../../engine/safety/lactationAndAllergyGates';

export const SGLT2_IDS = [
  'dapagliflozin',
  'empagliflozin',
  'canagliflozin',
  'ertugliflozin'
] as const;

export const INCRETIN_RA_IDS = [
  'semaglutide',
  'semaglutide_oral',
  'dulaglutide',
  'liraglutide',
  'tirzepatide',
  'lixisenatide',
  'exenatide'
] as const;

export const DPP4_IDS = [
  'sitagliptin',
  'linagliptin',
  'vildagliptin',
  'saxagliptin',
  'alogliptin'
] as const;

export const ALL_INCRETIN_IDS = [...INCRETIN_RA_IDS, ...DPP4_IDS] as const;

export const SU_IDS = [
  'gliclazide',
  'glimepiride',
  'glibenclamide',
  'glipizide',
  'repaglinide'
] as const;

export const RENAL_CONTRA_ORAL_IDS = [
  'gliclazide',
  'glimepiride',
  'glibenclamide',
  'glipizide',
  'acarbose'
] as const;

export const LONG_ACTING_BASAL_IDS = [
  'insulin_glargine',
  'insulin_degludec',
  'insulin_detemir'
] as const;

export const BASAL_INSULIN_IDS = [...LONG_ACTING_BASAL_IDS, 'insulin_nph'] as const;
export const BASAL_OR_PREMIX_IDS = [...BASAL_INSULIN_IDS, 'insulin_premix'] as const;
export const BOLUS_INSULIN_IDS = ['insulin_aspart', 'insulin_lispro', 'insulin_regular'] as const;
export const ALL_INSULIN_IDS = [...BASAL_OR_PREMIX_IDS, ...BOLUS_INSULIN_IDS] as const;
export const HYPO_HOLD_DRUG_IDS = [...SU_IDS, ...ALL_INSULIN_IDS, 'acarbose'] as const;

export const NON_INSULIN_DM2_IDS = [
  'metformin',
  ...SGLT2_IDS,
  ...INCRETIN_RA_IDS,
  ...DPP4_IDS,
  ...SU_IDS,
  'pioglitazone',
  'acarbose'
] as const;

const DM2_EXTRA_ALIASES: Record<string, string> = {
  glargine: 'insulin_glargine',
  lantus: 'insulin_glargine',
  toujeo: 'insulin_glargine',
  basaglar: 'insulin_glargine',
  degludec: 'insulin_degludec',
  tresiba: 'insulin_degludec',
  detemir: 'insulin_detemir',
  levemir: 'insulin_detemir',
  nph: 'insulin_nph',
  insulatard: 'insulin_nph',
  humulin_n: 'insulin_nph',
  novolin_n: 'insulin_nph',
  premix: 'insulin_premix',
  mixtard: 'insulin_premix',
  mixtard_30: 'insulin_premix',
  novomix: 'insulin_premix',
  novomix_30: 'insulin_premix',
  humalog_mix: 'insulin_premix',
  ryzodeg: 'insulin_premix',
  aspart: 'insulin_aspart',
  novorapid: 'insulin_aspart',
  fiasp: 'insulin_aspart',
  apidra: 'insulin_aspart',
  glulisine: 'insulin_aspart',
  insulin_glulisine: 'insulin_aspart',
  lispro: 'insulin_lispro',
  humalog: 'insulin_lispro',
  regular: 'insulin_regular',
  actrapid: 'insulin_regular',
  humulin_r: 'insulin_regular',
  novolin_r: 'insulin_regular',
  daonil: 'glibenclamide',
  glyburide: 'glibenclamide',
  diabinese: 'glibenclamide',
  glucotrol: 'glipizide',
  novonorm: 'repaglinide',
  prandin: 'repaglinide',
  amaryl: 'glimepiride',
  diamicron: 'gliclazide',
  gliclazide_mr: 'gliclazide',
  glucophage: 'metformin',
  forxiga: 'dapagliflozin',
  farxiga: 'dapagliflozin',
  jardiance: 'empagliflozin',
  invokana: 'canagliflozin',
  steglatro: 'ertugliflozin',
  ozempic: 'semaglutide',
  wegovy: 'semaglutide',
  rybelsus: 'semaglutide_oral',
  trulicity: 'dulaglutide',
  victoza: 'liraglutide',
  saxenda: 'liraglutide',
  mounjaro: 'tirzepatide',
  zepbound: 'tirzepatide',
  adlyxin: 'lixisenatide',
  lyxumia: 'lixisenatide',
  byetta: 'exenatide',
  bydureon: 'exenatide',
  januvia: 'sitagliptin',
  trajenta: 'linagliptin',
  galvus: 'vildagliptin',
  onglyza: 'saxagliptin',
  nesina: 'alogliptin',
  actos: 'pioglitazone',
  glucobay: 'acarbose',
  precose: 'acarbose'
};

export const NON_KB_DRUG_NAMES_VI: Record<string, string> = {
  ertugliflozin: 'Ertugliflozin (Steglatro)',
  lixisenatide: 'Lixisenatide (Adlyxin/Lyxumia)',
  exenatide: 'Exenatide (Byetta/Bydureon)',
  alogliptin: 'Alogliptin (Nesina)',
  glibenclamide: 'Glibenclamide (Glyburide)',
  glipizide: 'Glipizide',
  repaglinide: 'Repaglinide'
};

function mapSingleAlias(token: string): string {
  const norm = token.trim().toLowerCase().replace(/[\s\-]+/g, '_');
  if (DM2_EXTRA_ALIASES[norm]) return DM2_EXTRA_ALIASES[norm];
  const resolved = resolveCanonicalDrugId(norm);
  return DM2_EXTRA_ALIASES[resolved] || resolved;
}

export function resolveCanonicalDrugIds(rawDrugId?: string, rawName?: string): string[] {
  const id = (rawDrugId || '').trim();
  const name = (rawName || '').trim();
  if (!id && !name) return [];

  const fromId = id ? expandDrugComponents(id).map(mapSingleAlias).filter(Boolean) : [];
  if (fromId.length > 1) return fromId;

  if (name) {
    const fromName = expandDrugComponents(name).map(mapSingleAlias).filter(Boolean);
    if (fromName.length > 1) return fromName;
  }

  if (fromId.length === 1) return fromId;
  if (name) return expandDrugComponents(name).map(mapSingleAlias).filter(Boolean);
  return [];
}

export function isFdcMed(med?: CurrentMed): boolean {
  if (!med) return false;
  if (isFdcDrug(med.drugId) || (med.name && isFdcDrug(med.name))) return true;
  return resolveCanonicalDrugIds(med.drugId, med.name).length > 1;
}

export function findAllActiveMedsByCanonical(ctx: RuleContext, canonicalId: string): CurrentMed[] {
  return ctx.patient.currentMeds.filter((m) =>
    resolveCanonicalDrugIds(m.drugId, m.name).includes(canonicalId)
  );
}

export function findActiveMedByCanonical(ctx: RuleContext, canonicalId: string): CurrentMed | undefined {
  const standalone = ctx.patient.currentMeds.find((m) => {
    const ids = resolveCanonicalDrugIds(m.drugId, m.name);
    return ids.length === 1 && ids[0] === canonicalId;
  });
  if (standalone) return standalone;
  return findAllActiveMedsByCanonical(ctx, canonicalId)[0];
}

export function isTakingCanonical(ctx: RuleContext, canonicalId: string): boolean {
  return findAllActiveMedsByCanonical(ctx, canonicalId).length > 0; // qa-allow: index - Kiểm tra có ít nhất 1 mục thuốc khớp hoạt chất
}

export function isTakingAnyCanonical(ctx: RuleContext, canonicalIds: readonly string[]): boolean {
  return canonicalIds.some((id) => isTakingCanonical(ctx, id));
}

export function resolveDrugNameVi(canonicalId: string, med?: CurrentMed): string {
  const kbName = hasDrug(canonicalId)
    ? drug(canonicalId).nameVi
    : NON_KB_DRUG_NAMES_VI[canonicalId] || canonicalId;
  if (!med) return kbName;
  const resolved = resolveCanonicalDrugIds(med.drugId, med.name);
  if (resolved.length > 1) {
    const fdcLabel = med.name?.trim() || med.drugId;
    return `${fdcLabel} (thành phần ${kbName})`;
  }
  const rawName = med.name?.trim();
  if (rawName && rawName.toLowerCase() !== canonicalId.toLowerCase() && rawName.toLowerCase() !== kbName.toLowerCase()) {
    return `${rawName} (${kbName})`;
  }
  return kbName;
}

export function resolveTargetRecDrug(
  canonicalId: string,
  med?: CurrentMed
): { drugId: string; drugNameVi: string; isFdc: boolean } {
  const fdc = isFdcMed(med);
  if (fdc && med) {
    const rawId = med.drugId.trim().toLowerCase() || resolveCanonicalDrugId(med.name || '') || canonicalId;
    return {
      drugId: rawId,
      drugNameVi: resolveDrugNameVi(canonicalId, med),
      isFdc: true
    };
  }
  return {
    drugId: canonicalId,
    drugNameVi: resolveDrugNameVi(canonicalId, med),
    isFdc: false
  };
}

export function formatActiveMedDose(med: CurrentMed | undefined, canonicalId: string): string | undefined {
  if (!med || med.dose === undefined || med.dose === null) return undefined;
  const raw = String(med.dose).trim();
  if (!raw) return undefined;
  const hasUnitInDose = /[a-zA-ZđĐ/]/u.test(raw);
  const unitPart = !hasUnitInDose && med.unit ? ` ${med.unit.trim()}` : '';
  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  const freqPart = rawFreq && !raw.includes('x') ? ` x ${rawFreq.trim()}` : '';
  if (isFdcMed(med)) {
    return `Tiếp tục liều hiện tại (${med.name || med.drugId}: ${raw}${unitPart}${freqPart})`;
  }
  const startInfo = hasDrug(canonicalId) ? drug(canonicalId).start : undefined;
  const kbUnit = typeof startInfo === 'object' && startInfo !== null ? startInfo.unit : undefined;
  const fallbackUnit = !hasUnitInDose && !unitPart && kbUnit ? ` ${kbUnit}` : '';
  return `Duy trì liều đang dùng: ${raw}${unitPart}${fallbackUnit}${freqPart}`;
}

function normalizeSpaceSeparatedDaytimes(freq?: string, doseStr?: string): string | undefined {
  for (const raw of [freq, doseStr]) {
    if (!raw) continue;
    const lower = raw.trim().toLowerCase();
    if (/chia\s*(?:2|3|đôi)/i.test(lower)) return freq;
    const dayParts = ['sáng', 'trưa', 'chiều', 'tối', 'khuya'].filter((w) =>
      new RegExp(`(?:^|\\s|-|,|\\/|\\+)${w}(?:$|\\s|-|,|\\/|\\+)`, 'iu').test(lower)
    );
    if (dayParts.length >= 2) { // qa-allow: index - Đếm số buổi dùng thuốc trong ngày >= 2
      return dayParts.join(' - ');
    }
    if (raw === freq) return freq;
  }
  return freq;
}

export function parseMedDailyDoseMg(med: CurrentMed | undefined, canonicalId?: string): number | undefined {
  if (!med) return undefined;
  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  const doseStr = typeof med.dose === 'string' ? med.dose : undefined;
  if (!canonicalId && doseStr && !isFdcMed(med)) {
    const segs = Array.from(
      doseStr.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\s*(?:buổi\s*)?(?:sáng|trưa|chiều|tối|khuya)\b/giu)
    );
    if (segs.length >= 2) { // qa-allow: index - Tổng hợp liều bất đối xứng từ >= 2 buổi trong ngày
      return segs.reduce((sum, m) => sum + Number(m[1].replace(',', '.')), 0);
    }
  }
  const normMed: CurrentMed = {
    ...med,
    freq: normalizeSpaceSeparatedDaytimes(rawFreq, doseStr)
  };
  return canonicalId
    ? parseComponentDailyDoseMg(normMed, canonicalId)
    : parseDailyDoseMg(normMed);
}

export function parseInsulinMedDailyUnits(med: CurrentMed | undefined): number | undefined {
  if (!med || med.dose === undefined || med.dose === null) return undefined;
  const rawDose = String(med.dose).trim();
  if (!rawDose) return undefined;
  if (/\d+\s*\/\s*\d+\s*mg/i.test(rawDose)) return undefined;

  const segMatches = Array.from(
    rawDose.matchAll(
      /(\d+(?:[.,]\d+)?)\s*(?:u|iu|ui|đv|đơn\s*vị|don\s*vi)?\s*(?:buổi\s*)?(?:sáng|trưa|chiều|tối|khuya)\b/giu
    )
  );
  if (segMatches.length >= 2) { // qa-allow: index - Cộng dồn tổng liều insulin bất đối xứng từ >= 2 buổi tiêm trong ngày
    const totalSeg = segMatches.reduce((sum, m) => sum + Number(m[1].replace(',', '.')), 0);
    if (Number.isFinite(totalSeg) && totalSeg > 0) {
      return Math.round(totalSeg * 10) / 10; // qa-allow: unit-conversion - Làm tròn 1 chữ số thập phân tổng đơn vị/ngày
    }
  }

  const numMatch = rawDose.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) return undefined;
  const baseUnits = Number(numMatch[1].replace(',', '.'));
  if (!Number.isFinite(baseUnits) || baseUnits <= 0) return undefined;

  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  const combinedText = `${rawDose} ${rawFreq || ''}`.toLowerCase();
  if (/chia\s*(?:2|3|đôi)/i.test(combinedText)) {
    return baseUnits;
  }

  const normFreq = normalizeSpaceSeparatedDaytimes(rawFreq, rawDose);
  const mult = parseFrequencyPerDay(normFreq, rawDose);
  if (mult !== undefined && mult >= 1) { // qa-allow: unit-conversion - Nhân tần suất tiêm trong ngày
    return Math.round(baseUnits * mult * 10) / 10; // qa-allow: unit-conversion - Làm tròn 1 chữ số thập phân tổng đơn vị/ngày
  }
  return baseUnits;
}

export function getMaxBasalDosePerKg(): number {
  const typicalTdd = thFor('insulin_u_per_kg', 'dm2.insulin.t2d_typical_tdd_per_kg');
  const basalSharePct = thFor('percentage', 'dm2.insulin.basal_share_of_tdd_pct');
  return typicalTdd * (basalSharePct / 100); // qa-allow: unit-conversion - Tính tỷ lệ phần trăm insulin nền 50% của TDD 1 U/kg/ngày
}

export function extractBasalInsulinInfo(ctx: RuleContext): {
  med?: CurrentMed;
  canonicalId?: string;
  activeBasalDrugId?: string;
  doseUnits?: number;
  basalDoseUnits?: number;
  isPremix: boolean;
  isFdc: boolean;
  hasAnyInsulin: boolean;
} {
  const customDose = need(ctx, 'currentBasalDoseUnits');
  const anyInsMed = isTakingAnyCanonical(ctx, ALL_INSULIN_IDS);
  const onSteroid = Boolean(ctx.patient.customInputs?.onSteroidTherapy);

  const orderedCandidates = onSteroid
    ? ([...LONG_ACTING_BASAL_IDS, 'insulin_premix', 'insulin_nph'] as const)
    : BASAL_OR_PREMIX_IDS;

  for (const id of orderedCandidates) {
    const allMatching = findAllActiveMedsByCanonical(ctx, id);
    if (allMatching.length > 0) { // qa-allow: index - Kiểm tra danh sách thuốc insulin nền khớp >= 1
      const firstMed = allMatching[0];
      let units = customDose;
      if (units === undefined) {
        let sum = 0;
        let hasValidDose = false;
        for (const m of allMatching) {
          const u = parseInsulinMedDailyUnits(m);
          if (u !== undefined && u > 0) {
            sum += u;
            hasValidDose = true;
          }
        }
        if (hasValidDose) units = sum;
      }
      const isPremix = id === 'insulin_premix';
      return {
        med: firstMed,
        canonicalId: id,
        activeBasalDrugId: isPremix ? undefined : id,
        doseUnits: units,
        basalDoseUnits: units,
        isPremix,
        isFdc: isFdcMed(firstMed),
        hasAnyInsulin: true
      };
    }
  }

  return {
    doseUnits: customDose,
    basalDoseUnits: customDose,
    isPremix: false,
    isFdc: false,
    hasAnyInsulin: anyInsMed || (customDose !== undefined && customDose > 0)
  };
}

export function hasDrugAllergy(ctx: RuleContext, drugId: string): boolean {
  const target = drugId.trim().toLowerCase();
  if (!target) return false;
  if (evaluateAllergySafety(target, ctx.patient)) return true;
  if (ctx.patient.conditions[`allergy_${target}`] === true) return true;

  const rawTokens: string[] = [];
  if (Array.isArray(ctx.patient.allergies)) {
    for (const a of ctx.patient.allergies) {
      if (typeof a === 'string') rawTokens.push(...a.split(/[,;|]+/).map((s) => s.trim().toLowerCase()));
    }
  }
  const ciAllergies = ctx.patient.customInputs?.allergies;
  if (typeof ciAllergies === 'string') {
    rawTokens.push(...ciAllergies.split(/[,;|]+/).map((s) => s.trim().toLowerCase()));
  }
  const tokenSet = new Set(rawTokens.map((t) => t.replace(/[\s\-]+/g, '_')).filter(Boolean));
  if (tokenSet.size === 0) return false; // qa-allow: index - Kiểm tra tập dị ứng rỗng

  if ((SGLT2_IDS as readonly string[]).includes(target)) {
    if (tokenSet.has('sglt2') || tokenSet.has('sglt2i') || tokenSet.has('gliflozin')) return true;
  }
  if ((INCRETIN_RA_IDS as readonly string[]).includes(target)) {
    if (tokenSet.has('glp1') || tokenSet.has('glp1ra') || tokenSet.has('glp_1') || tokenSet.has('glp1_ra') || tokenSet.has('incretin')) {
      return true;
    }
  }
  if ((DPP4_IDS as readonly string[]).includes(target)) {
    if (tokenSet.has('dpp4') || tokenSet.has('dpp4i') || tokenSet.has('dpp_4') || tokenSet.has('gliptin') || tokenSet.has('incretin')) {
      return true;
    }
  }
  if ((SU_IDS as readonly string[]).includes(target)) {
    if (tokenSet.has('su') || tokenSet.has('sulfonylurea')) return true;
  }

  return rawTokens.some((a) => resolveCanonicalDrugIds(a).includes(target));
}

export function pickFirstNonAllergicCandidate<T extends string>(
  ctx: RuleContext,
  candidates: readonly T[]
): T | undefined {
  return candidates.find((id) => !hasDrugAllergy(ctx, id));
}

export function isOnAnticoagulant(ctx: RuleContext): boolean {
  if (hasCondition(ctx, 'onAnticoagulant')) return true;
  const anticoagIds = ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'acenocoumarol', 'enoxaparin', 'heparin'];
  return ctx.patient.currentMeds.some((m) =>
    resolveCanonicalDrugIds(m.drugId, m.name).some((id) => anticoagIds.includes(id))
  );
}

export function isTakingStrongCyp3a4Inhibitor(ctx: RuleContext): boolean {
  const strongCyp3a4 = [
    'ketoconazole',
    'itraconazole',
    'posaconazole',
    'voriconazole',
    'clarithromycin',
    'ritonavir',
    'cobicistat',
    'nefazodone',
    'atazanavir',
    'indinavir',
    'nelfinavir',
    'saquinavir',
    'telithromycin'
  ];
  return ctx.patient.currentMeds.some((m) =>
    resolveCanonicalDrugIds(m.drugId, m.name).some((id) => strongCyp3a4.includes(id))
  );
}
