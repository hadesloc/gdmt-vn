/**
 * GDMT-VN Lipid Module - Medication, FDC Decomposition, Dose & Allergy Helpers
 * Phân quyền: Agent I5 (Round 3 Remediation)
 */

import type { CurrentMed, RuleContext } from '../../engine/types';
import {
  parseComponentDailyDoseMg,
  parseDailyDoseMg,
  parseFrequencyPerDay
} from '../../engine/doseParser';
import { expandDrugComponents, resolveCanonicalDrugId } from '../../engine/safety/fdcMap';
import { evaluateAllergySafety } from '../../engine/safety/lactationAndAllergyGates';
import { thFor } from '../../kb-types';

export interface RawMedMatch {
  med: CurrentMed;
  rawDrugId: string;
  canonicalDrugId: string;
  componentId: string;
  displayName: string;
  doseMg?: number;
  isFdc: boolean;
  allComponents: string[];
  safeCompanions: string[];
}

const LOCAL_LIPID_ALIASES: Record<string, string> = {
  liptruzet: 'atorvastatin_ezetimibe',
  crestor_zetia: 'rosuvastatin_ezetimibe',
  pravibay: 'pravastatin_fenofibrate',
  pravibofibrate: 'pravastatin_fenofibrate',
  fenofibrate_pravastatin: 'pravastatin_fenofibrate',
  cholib: 'simvastatin_fenofibrate',
  fenofibrate_simvastatin: 'simvastatin_fenofibrate',
  omega3_ethyl_esters: 'omega3',
  omega_3_acid_ethyl_esters: 'omega3',
  omega_3_ethyl_esters: 'omega3',
  omacor: 'omega3',
  lovaza: 'omega3'
};

const LOCAL_LIPID_FDC_MAP: Record<string, string[]> = {
  pravastatin_fenofibrate: ['pravastatin', 'fenofibrate'],
  simvastatin_fenofibrate: ['simvastatin', 'fenofibrate']
};

export const STATIN_DRUG_IDS = new Set([
  'atorvastatin',
  'rosuvastatin',
  'simvastatin',
  'pravastatin',
  'pitavastatin',
  'fluvastatin',
  'lovastatin'
]);

export const PCSK9_DRUG_IDS = new Set(['evolocumab', 'alirocumab', 'inclisiran']);

export const FIBRATE_DRUG_IDS = new Set([
  'fenofibrate',
  'gemfibrozil',
  'bezafibrate',
  'ciprofibrate'
]);

export const BILE_ACID_SEQUESTRANT_IDS = new Set([
  'cholestyramine',
  'colesevelam',
  'colestipol'
]);

export const ALL_LIPID_COMPONENT_IDS = new Set([
  ...STATIN_DRUG_IDS,
  ...PCSK9_DRUG_IDS,
  ...FIBRATE_DRUG_IDS,
  ...BILE_ACID_SEQUESTRANT_IDS,
  'ezetimibe',
  'bempedoic_acid',
  'icosapent_ethyl',
  'omega3'
]);

const DRUG_DISPLAY_NAMES: Record<string, string> = {
  atorvastatin: 'Atorvastatin',
  rosuvastatin: 'Rosuvastatin',
  simvastatin: 'Simvastatin',
  pravastatin: 'Pravastatin',
  pitavastatin: 'Pitavastatin',
  fluvastatin: 'Fluvastatin',
  lovastatin: 'Lovastatin',
  ezetimibe: 'Ezetimibe',
  bempedoic_acid: 'Bempedoic acid',
  fenofibrate: 'Fenofibrate',
  gemfibrozil: 'Gemfibrozil',
  bezafibrate: 'Bezafibrate',
  ciprofibrate: 'Ciprofibrate',
  icosapent_ethyl: 'Icosapent ethyl',
  omega3: 'Omega-3 acid ethyl esters',
  evolocumab: 'Evolocumab',
  alirocumab: 'Alirocumab',
  inclisiran: 'Inclisiran',
  cholestyramine: 'Cholestyramine',
  colesevelam: 'Colesevelam',
  colestipol: 'Colestipol',
  amlodipine: 'Amlodipine',
  rosuvastatin_ezetimibe: 'Rosuvastatin/Ezetimibe (FDC)',
  atorvastatin_ezetimibe: 'Atorvastatin/Ezetimibe (FDC)',
  simvastatin_ezetimibe: 'Simvastatin/Ezetimibe (FDC)',
  amlodipine_atorvastatin: 'Amlodipine/Atorvastatin (FDC)',
  bempedoic_acid_ezetimibe: 'Bempedoic acid/Ezetimibe (FDC)',
  pravastatin_fenofibrate: 'Pravastatin/Fenofibrate (FDC)',
  simvastatin_fenofibrate: 'Simvastatin/Fenofibrate (FDC)'
};

export function getLipidDrugDisplayName(id: string, fallbackName?: string): string {
  if (fallbackName && fallbackName.trim()) return fallbackName.trim();
  const canon = normalizeLipidDrugToken(id);
  return DRUG_DISPLAY_NAMES[canon] || DRUG_DISPLAY_NAMES[id.toLowerCase()] || id;
}

export function normalizeLipidDrugToken(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)*\s*(?:mg|mcg|µg|ug|g|viên)?\b/gi, ' ')
    .replace(/\s*(?:\/|\+|&)\s*/g, '_')
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (LOCAL_LIPID_ALIASES[cleaned]) return LOCAL_LIPID_ALIASES[cleaned];
  const engineCanon = resolveCanonicalDrugId(raw);
  if (LOCAL_LIPID_ALIASES[engineCanon]) return LOCAL_LIPID_ALIASES[engineCanon];
  return engineCanon || cleaned;
}

export function expandLipidMedComponents(med: CurrentMed): string[] {
  const fromIdCanon = normalizeLipidDrugToken(med.drugId);
  if (LOCAL_LIPID_FDC_MAP[fromIdCanon]) {
    return [...LOCAL_LIPID_FDC_MAP[fromIdCanon]];
  }
  const compsFromId = expandDrugComponents(fromIdCanon || med.drugId || '').map((c) =>
    LOCAL_LIPID_ALIASES[c] ? LOCAL_LIPID_ALIASES[c] : c
  );
  if (compsFromId.length > 1) return compsFromId;

  if (med.name) {
    const fromNameCanon = normalizeLipidDrugToken(med.name);
    if (LOCAL_LIPID_FDC_MAP[fromNameCanon]) {
      return [...LOCAL_LIPID_FDC_MAP[fromNameCanon]];
    }
    const compsFromName = expandDrugComponents(fromNameCanon || med.name).map((c) =>
      LOCAL_LIPID_ALIASES[c] ? LOCAL_LIPID_ALIASES[c] : c
    );
    if (compsFromName.length > 1) return compsFromName;
  }

  return compsFromId.length > 0 ? compsFromId : fromIdCanon ? [fromIdCanon] : [];
}

function extractPairStrengths(source?: string): [number, number] | null {
  if (!source) return null;
  const m = source.match(/(\d+(?:[.,]\d+)?)\s*(?:mg)?\s*\/\s*(\d+(?:[.,]\d+)?)\s*(?:mg)?/i);
  if (!m) return null;
  const a = parseFloat(m[1].replace(',', '.'));
  const b = parseFloat(m[2].replace(',', '.'));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  return [a, b];
}

export function parseLipidComponentDoseMg(med: CurrentMed, componentId: string): number | undefined {
  const comps = expandLipidMedComponents(med);
  const target = normalizeLipidDrugToken(componentId);
  if (!comps.includes(target)) return undefined;

  const doseStr = typeof med.dose === 'string' ? med.dose : undefined;
  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  const parsedFreq = parseFrequencyPerDay(rawFreq, doseStr);
  const freq = parsedFreq !== undefined ? parsedFreq : 1;

  if (comps.length > 1) {
    const pairFromDose = extractPairStrengths(doseStr);
    const pairFromName = extractPairStrengths(med.name);
    const pair = pairFromDose || pairFromName;
    if (pair && comps.length === 2) {
      let pillCount = 1;
      if (!pairFromDose && typeof med.dose === 'number' && Number.isFinite(med.dose) && med.dose > 0) {
        pillCount = med.dose;
      }
      const [a, b] = pair;
      const ezeStd = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const bempStd = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
      const fenoReduced = thFor('dose_mg', 'lipid.dose.fenofibrate_reduced');

      // Xử lý đảo chiều hàm lượng (vd: Inegy 10/40 mg, Atozet 10/40 mg, Nexlizet 180/10 mg, Caduet 5/40 mg)
      if (comps.includes('ezetimibe') && comps.some((c) => STATIN_DRUG_IDS.has(c))) {
        if (a === ezeStd && b !== ezeStd) {
          const single = target === 'ezetimibe' ? a : b;
          return Number((single * pillCount * freq).toFixed(4));
        }
        if (b === ezeStd && a !== ezeStd) {
          const single = target === 'ezetimibe' ? b : a;
          return Number((single * pillCount * freq).toFixed(4));
        }
      }
      if (comps.includes('bempedoic_acid') && comps.includes('ezetimibe')) {
        if (a === bempStd || b === ezeStd) {
          const single = target === 'bempedoic_acid' ? a : b;
          return Number((single * pillCount * freq).toFixed(4));
        }
        if (b === bempStd || a === ezeStd) {
          const single = target === 'bempedoic_acid' ? b : a;
          return Number((single * pillCount * freq).toFixed(4));
        }
      }
      if (comps.includes('amlodipine') && comps.includes('atorvastatin')) {
        const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
        if (a < atorvaMin && b >= atorvaMin) {
          const single = target === 'amlodipine' ? a : b;
          return Number((single * pillCount * freq).toFixed(4));
        }
        if (b < atorvaMin && a >= atorvaMin) {
          const single = target === 'amlodipine' ? b : a;
          return Number((single * pillCount * freq).toFixed(4));
        }
      }
      if (comps.includes('fenofibrate') && comps.some((c) => STATIN_DRUG_IDS.has(c))) {
        if (a > fenoReduced && b <= fenoReduced) {
          const single = target === 'fenofibrate' ? a : b;
          return Number((single * pillCount * freq).toFixed(4));
        }
        if (b > fenoReduced && a <= fenoReduced) {
          const single = target === 'fenofibrate' ? b : a;
          return Number((single * pillCount * freq).toFixed(4));
        }
      }

      const idx = comps.indexOf(target);
      if (idx === 0 || idx === 1) {
        return Number((pair[idx] * pillCount * freq).toFixed(4));
      }
    }
    return parseComponentDailyDoseMg(med, target);
  }

  const engineSingle = parseDailyDoseMg(med);
  if (engineSingle !== undefined) return engineSingle;

  // Hỗ trợ biệt dược Fenofibrate phổ biến tại VN không ghi kèm hậu tố 'mg' (vd: 'Lipanthyl 200M', 'Lipanthyl NT 145')
  if (target === 'fenofibrate' && med.name) {
    const lipMatch = med.name.match(/\blipanthyl(?:\s+(?:supra|nt|nano))?\s*(200|160|145|67)\s*m?\b/i);
    if (lipMatch) {
      const strength = Number(lipMatch[1]);
      let count = 1;
      if (typeof med.dose === 'number' && Number.isFinite(med.dose) && med.dose > 0) {
        count = med.dose;
      } else if (doseStr) {
        const numMatch = doseStr.match(/^(\d+(?:[.,]\d+)?)/);
        if (numMatch) count = parseFloat(numMatch[1].replace(',', '.'));
      }
      return Number((strength * count * freq).toFixed(4));
    }
  }

  return undefined;
}

export function findRawMedsWithComponent(ctx: RuleContext, componentId: string): RawMedMatch[] {
  const target = normalizeLipidDrugToken(componentId);
  const matches: RawMedMatch[] = [];
  for (const med of ctx.patient.currentMeds || []) {
    if (!med || (!med.drugId && !med.name)) continue;
    const rawDrugId = (med.drugId || '').trim().toLowerCase();
    const canonicalDrugId = normalizeLipidDrugToken(med.drugId || med.name);
    const allComponents = expandLipidMedComponents(med);
    if (!allComponents.includes(target)) continue;

    matches.push({
      med,
      rawDrugId: rawDrugId || canonicalDrugId,
      canonicalDrugId,
      componentId: target,
      displayName: getLipidDrugDisplayName(canonicalDrugId || rawDrugId, med.name),
      doseMg: parseLipidComponentDoseMg(med, target),
      isFdc: allComponents.length > 1,
      allComponents,
      safeCompanions: allComponents.filter((c) => c !== target)
    });
  }
  return matches;
}

export function buildFdcUnbundleGuidanceVi(
  match: RawMedMatch,
  blockedComponents: Set<string>
): string {
  if (!match.isFdc) return '';
  const safeRemaining = match.allComponents.filter((c) => !blockedComponents.has(c));
  if (safeRemaining.length === 0) {
    return `Lưu ý viên phối hợp cố định (${match.displayName}): Ngừng toàn bộ viên phối hợp do tất cả thành phần đều thuộc diện chống chỉ định/tạm hoãn.`;
  }
  const names = safeRemaining.map((c) => getLipidDrugDisplayName(c)).join(', ');
  return `Lưu ý viên phối hợp cố định (${match.displayName}): Khi ngừng/đổi viên phối hợp, cần kê tách riêng viên đơn chất ${names} nếu bệnh nhân vẫn còn chỉ định lâm sàng (ví dụ: duy trì kiểm soát huyết áp với Amlodipine đơn chất hoặc tiếp tục Ezetimibe đơn chất).`;
}

function toPascalCase(snake: string): string {
  return snake
    .split('_')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');
}

export function hasLipidDrugAllergy(ctx: RuleContext, drugIdOrName: string): boolean {
  const pat = ctx.normalized || ctx.patient;
  if (evaluateAllergySafety(drugIdOrName, pat) !== null) return true;

  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const ci = (ctx.patient.customInputs || {}) as Record<string, unknown>;
  const canonical = normalizeLipidDrugToken(drugIdOrName);
  const comps = expandLipidMedComponents({ drugId: canonical });

  for (const comp of [canonical, ...comps]) {
    if (!comp) continue;
    const pascal = toPascalCase(comp);
    if (
      cond[`allergy_${comp}`] === true ||
      cond[`allergy${pascal}`] === true ||
      ci[`allergy_${comp}`] === true ||
      ci[`allergy${pascal}`] === true
    ) {
      return true;
    }
    if (STATIN_DRUG_IDS.has(comp) && (cond.allergy_statin === true || ci.allergy_statin === true)) {
      return true;
    }
    if (FIBRATE_DRUG_IDS.has(comp) && (cond.allergy_fibrate === true || ci.allergy_fibrate === true)) {
      return true;
    }
    if (PCSK9_DRUG_IDS.has(comp) && (cond.allergy_pcsk9 === true || ci.allergy_pcsk9 === true)) {
      return true;
    }
  }
  return false;
}

export function pickSafePcsk9(
  ctx: RuleContext
): { drugId: 'evolocumab' | 'alirocumab' | 'inclisiran'; nameVi: string } | null {
  const candidates: Array<{ drugId: 'evolocumab' | 'alirocumab' | 'inclisiran'; nameVi: string }> = [
    { drugId: 'evolocumab', nameVi: 'Evolocumab' },
    { drugId: 'alirocumab', nameVi: 'Alirocumab' },
    { drugId: 'inclisiran', nameVi: 'Inclisiran' }
  ];
  for (const c of candidates) {
    if (!hasLipidDrugAllergy(ctx, c.drugId)) return c;
  }
  return null;
}
