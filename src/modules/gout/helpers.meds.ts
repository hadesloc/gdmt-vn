/**
 * GDMT-VN Gout Module - Medication Lists, FDC Decomposition & Dose Parser
 * Phân quyền: Agent K
 */

import type { RuleContext, CurrentMed } from '../../engine/types';

export const ULT_DRUG_IDS = ['allopurinol', 'febuxostat', 'probenecid', 'benzbromarone'];
export const XOI_DRUG_IDS = ['allopurinol', 'febuxostat'];
export const URICOSURIC_DRUG_IDS = ['probenecid', 'benzbromarone'];

export const NSAID_DRUG_IDS = [
  'naproxen',
  'ibuprofen',
  'diclofenac',
  'celecoxib',
  'etoricoxib',
  'indomethacin',
  'meloxicam',
  'piroxicam',
  'tenoxicam',
  'ketoprofen',
  'ketorolac',
  'etodolac',
  'dexketoprofen',
  'loxoprofen',
  'parecoxib',
  'flurbiprofen',
  'mefenamic_acid',
  'sulindac',
  'nabumetone'
];

/** Ketorolac (giới hạn ≤ 5 ngày FDA Boxed Warning) & Parecoxib tiêm không dùng tiếp tục cắt cơn/dự phòng gút ngoại trú */
export const NON_GOUT_CONTINUABLE_NSAID_IDS = ['ketorolac', 'parecoxib'];

export const PPI_DRUG_IDS = [
  'omeprazole',
  'esomeprazole',
  'pantoprazole',
  'rabeprazole',
  'lansoprazole',
  'dexlansoprazole'
];

export const SYSTEMIC_STEROID_IDS = [
  'prednisolone',
  'prednisone',
  'methylprednisolone',
  'dexamethasone',
  'hydrocortisone',
  'betamethasone'
];

export const P2Y12_DRUG_IDS = ['clopidogrel', 'ticagrelor', 'prasugrel'];

export const STRONG_CYP3A4_PGP_INHIBITORS = [
  'nirmatrelvir_ritonavir',
  'paxlovid',
  'clarithromycin',
  'ketoconazole',
  'itraconazole',
  'posaconazole',
  'voriconazole',
  'ritonavir',
  'cobicistat',
  'atazanavir',
  'atazanavir_cobicistat',
  'atachi',
  'darunavir',
  'darunavir_ritonavir',
  'darunavir_cobicistat',
  'lopinavir',
  'lopinavir_ritonavir',
  'kaletra',
  'elvitegravir_cobicistat',
  'indinavir',
  'nelfinavir',
  'saquinavir',
  'tipranavir',
  'telithromycin',
  'nefazodone',
  'cyclosporine',
  'ranolazine'
];

export const MODERATE_CYP3A4_PGP_INHIBITORS = [
  'verapamil',
  'diltiazem',
  'erythromycin',
  'fluconazole',
  'aprepitant',
  'fosamprenavir',
  'amprenavir',
  'amiodarone',
  'dronedarone'
];

export const STATIN_DRUG_IDS = [
  'atorvastatin',
  'rosuvastatin',
  'simvastatin',
  'pravastatin',
  'lovastatin',
  'fluvastatin',
  'pitavastatin'
];

export const FIBRATE_DRUG_IDS = ['fenofibrate', 'gemfibrozil', 'bezafibrate', 'ciprofibrate'];
export const AZATHIOPRINE_DRUG_IDS = ['azathioprine', 'mercaptopurine', '6_mercaptopurine'];

export const VKA_DRUG_IDS = ['warfarin', 'acenocoumarol'];
export const ANTICOAGULANT_DRUG_IDS = [
  'warfarin',
  'acenocoumarol',
  'rivaroxaban',
  'apixaban',
  'dabigatran',
  'edoxaban',
  'enoxaparin',
  'heparin',
  'fondaparinux',
  'dalteparin',
  'nadroparin'
];

export const HEPATOTOXIC_CO_MED_IDS = ['pyrazinamide', 'isoniazid', 'rifampicin', 'ketoconazole'];
export const THIAZIDE_DRUG_IDS = ['hydrochlorothiazide', 'indapamide', 'chlorthalidone', 'metolazone'];
export const LOOP_DIURETIC_DRUG_IDS = ['furosemide', 'torsemide', 'bumetanide'];
export const RASI_ARNI_DRUG_IDS = [
  'losartan',
  'valsartan',
  'telmisartan',
  'irbesartan',
  'candesartan',
  'olmesartan',
  'azilsartan',
  'enalapril',
  'perindopril',
  'lisinopril',
  'ramipril',
  'captopril',
  'imidapril',
  'benazepril',
  'fosinopril',
  'trandolapril',
  'quinapril',
  'sacubitril_valsartan'
];
export const LOW_DOSE_ASPIRIN_IDS = ['aspirin'];

/** Phân rã các viên phối hợp liều cố định (FDC) tim mạch, mỡ máu & kháng virus thường gặp tại VN */
const FDC_COMPONENT_MAP: Record<string, string[]> = {
  losartan_hctz: ['losartan', 'hydrochlorothiazide'],
  losartan_hydrochlorothiazide: ['losartan', 'hydrochlorothiazide'],
  hyzaar: ['losartan', 'hydrochlorothiazide'],
  valsartan_hctz: ['valsartan', 'hydrochlorothiazide'],
  valsartan_hydrochlorothiazide: ['valsartan', 'hydrochlorothiazide'],
  co_diovan: ['valsartan', 'hydrochlorothiazide'],
  codiovan: ['valsartan', 'hydrochlorothiazide'],
  telmisartan_hctz: ['telmisartan', 'hydrochlorothiazide'],
  telmisartan_hydrochlorothiazide: ['telmisartan', 'hydrochlorothiazide'],
  micardis_plus: ['telmisartan', 'hydrochlorothiazide'],
  irbesartan_hctz: ['irbesartan', 'hydrochlorothiazide'],
  irbesartan_hydrochlorothiazide: ['irbesartan', 'hydrochlorothiazide'],
  coaprovel: ['irbesartan', 'hydrochlorothiazide'],
  candesartan_hctz: ['candesartan', 'hydrochlorothiazide'],
  candesartan_hydrochlorothiazide: ['candesartan', 'hydrochlorothiazide'],
  atacand_plus: ['candesartan', 'hydrochlorothiazide'],
  olmesartan_hctz: ['olmesartan', 'hydrochlorothiazide'],
  olmesartan_hydrochlorothiazide: ['olmesartan', 'hydrochlorothiazide'],
  olmetec_plus: ['olmesartan', 'hydrochlorothiazide'],
  enalapril_hctz: ['enalapril', 'hydrochlorothiazide'],
  enalapril_hydrochlorothiazide: ['enalapril', 'hydrochlorothiazide'],
  lisinopril_hctz: ['lisinopril', 'hydrochlorothiazide'],
  lisinopril_hydrochlorothiazide: ['lisinopril', 'hydrochlorothiazide'],
  perindopril_indapamide: ['perindopril', 'indapamide'],
  coversyl_plus: ['perindopril', 'indapamide'],
  preterax: ['perindopril', 'indapamide'],
  noliprel: ['perindopril', 'indapamide'],
  perindopril_indapamide_amlodipine: ['perindopril', 'indapamide', 'amlodipine'],
  triplixam: ['perindopril', 'indapamide', 'amlodipine'],
  valsartan_amlodipine_hctz: ['valsartan', 'amlodipine', 'hydrochlorothiazide'],
  amlodipine_valsartan_hctz: ['valsartan', 'amlodipine', 'hydrochlorothiazide'],
  exforge_hct: ['valsartan', 'amlodipine', 'hydrochlorothiazide'],
  valsartan_amlodipine: ['valsartan', 'amlodipine'],
  amlodipine_valsartan: ['valsartan', 'amlodipine'],
  exforge: ['valsartan', 'amlodipine'],
  telmisartan_amlodipine: ['telmisartan', 'amlodipine'],
  amlodipine_telmisartan: ['telmisartan', 'amlodipine'],
  twynsta: ['telmisartan', 'amlodipine'],
  losartan_amlodipine: ['losartan', 'amlodipine'],
  amlodipine_losartan: ['losartan', 'amlodipine'],
  cozaar_xq: ['losartan', 'amlodipine'],
  amzaar: ['losartan', 'amlodipine'],
  perindopril_amlodipine: ['perindopril', 'amlodipine'],
  amlodipine_perindopril: ['perindopril', 'amlodipine'],
  coveram: ['perindopril', 'amlodipine'],
  olmesartan_amlodipine: ['olmesartan', 'amlodipine'],
  amlodipine_olmesartan: ['olmesartan', 'amlodipine'],
  sevikar: ['olmesartan', 'amlodipine'],
  rosuvastatin_ezetimibe: ['rosuvastatin', 'ezetimibe'],
  ezetimibe_rosuvastatin: ['rosuvastatin', 'ezetimibe'],
  rosuzet: ['rosuvastatin', 'ezetimibe'],
  atorvastatin_ezetimibe: ['atorvastatin', 'ezetimibe'],
  ezetimibe_atorvastatin: ['atorvastatin', 'ezetimibe'],
  atozet: ['atorvastatin', 'ezetimibe'],
  simvastatin_ezetimibe: ['simvastatin', 'ezetimibe'],
  ezetimibe_simvastatin: ['simvastatin', 'ezetimibe'],
  vytorin: ['simvastatin', 'ezetimibe'],
  inegy: ['simvastatin', 'ezetimibe'],
  amlodipine_atorvastatin: ['amlodipine', 'atorvastatin'],
  atorvastatin_amlodipine: ['amlodipine', 'atorvastatin'],
  caduet: ['amlodipine', 'atorvastatin'],
  entresto: ['sacubitril_valsartan'],
  uperio: ['sacubitril_valsartan'],
  nirmatrelvir_ritonavir: ['nirmatrelvir', 'ritonavir'],
  paxlovid: ['nirmatrelvir', 'ritonavir'],
  lopinavir_ritonavir: ['lopinavir', 'ritonavir'],
  kaletra: ['lopinavir', 'ritonavir'],
  darunavir_ritonavir: ['darunavir', 'ritonavir'],
  darunavir_cobicistat: ['darunavir', 'cobicistat'],
  atazanavir_cobicistat: ['atazanavir', 'cobicistat'],
  atachi: ['atazanavir', 'cobicistat'],
  elvitegravir_cobicistat: ['elvitegravir', 'cobicistat'],
  sintrom: ['acenocoumarol']
};

export function getExpandedMedComponentIds(drugId?: string): string[] {
  const raw = (drugId || '').trim().toLowerCase();
  if (!raw) return [];
  const out = new Set<string>([raw]);
  const mapped = FDC_COMPONENT_MAP[raw];
  if (mapped) {
    for (const c of mapped) out.add(c);
  }
  if (raw !== 'sacubitril_valsartan' && /[+/]/.test(raw)) {
    for (const part of raw.split(/[+/]+/)) {
      const p = part.trim();
      if (p === 'hctz' || p === 'hct') out.add('hydrochlorothiazide');
      else if (p) out.add(p);
    }
  }
  if (raw.endsWith('_hctz') || raw.endsWith('_hct')) {
    out.add('hydrochlorothiazide');
    const prefix = raw.replace(/_hctz?$/, '');
    if (prefix) out.add(prefix);
  }
  if (raw.includes('ritonavir')) out.add('ritonavir');
  if (raw.includes('cobicistat')) out.add('cobicistat');
  return Array.from(out);
}

export function isFdcMed(med?: CurrentMed): boolean {
  if (!med?.drugId) return false;
  const raw = med.drugId.trim().toLowerCase();
  const comps = getExpandedMedComponentIds(raw).filter((id) => id !== raw);
  const mapped = FDC_COMPONENT_MAP[raw];
  return comps.length >= 2 || Boolean(mapped && mapped.length >= 2);
}

export function isOnMed(ctx: RuleContext, drugIds: readonly string[]): boolean {
  const set = new Set(drugIds.map((d) => d.toLowerCase()));
  return ctx.normalized.currentMeds.some((m: CurrentMed) =>
    getExpandedMedComponentIds(m.drugId).some((id) => set.has(id))
  );
}

export function findMed(ctx: RuleContext, drugIds: readonly string[]): CurrentMed | undefined {
  const set = new Set(drugIds.map((d) => d.toLowerCase()));
  return ctx.normalized.currentMeds.find((m: CurrentMed) =>
    getExpandedMedComponentIds(m.drugId).some((id) => set.has(id))
  );
}

export function findAllMeds(ctx: RuleContext, drugIds: readonly string[]): CurrentMed[] {
  const set = new Set(drugIds.map((d) => d.toLowerCase()));
  return ctx.normalized.currentMeds.filter((m: CurrentMed) =>
    getExpandedMedComponentIds(m.drugId).some((id) => set.has(id))
  );
}

const COUNT_UNIT_REGEX = /\b(viên|vien|tab|tabs|tablet|tablets|cap|caps|capsule|capsules|gói|goi|ống|ong)\b/i;
const EXPLICIT_MASS_IN_TEXT_REGEX = /(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg|ug)\b/i;

/**
 * Kiểm tra xem thuốc đang dùng có bị nhập mơ hồ kiểu đếm viên ('1 viên', '2 viên')
 * mà không xác định được hàm lượng mg thực tế hay không (QA-1 Fail-closed).
 */
export function hasAmbiguousCountMedDose(med?: CurrentMed): boolean {
  if (!med || med.dose === undefined || med.dose === null) return false;
  const rawStr = String(med.dose).trim();
  if (!rawStr) return false;
  const unitStr = (med.unit || '').trim();
  const isCountUnit = COUNT_UNIT_REGEX.test(unitStr) || COUNT_UNIT_REGEX.test(rawStr);
  if (!isCountUnit) return false;
  if (/^(mg|g|mcg|µg|ug)(?:\/.*)?$/i.test(unitStr)) return false;
  if (EXPLICIT_MASS_IN_TEXT_REGEX.test(rawStr)) return false;
  if (med.name && EXPLICIT_MASS_IN_TEXT_REGEX.test(med.name)) return false;
  return true;
}

function applyFrequencyMultiplier(
  singleDoseMg: number,
  freqContext: string,
  doseAlreadyHasMultiplier: boolean,
  allowCountPerDayInFreq: boolean
): number {
  const f = freqContext.toLowerCase();
  if (/cách\s*(?:ngày|nhật)|mỗi\s*48\s*(?:h|giờ)|q48h|\bqod\b|\beod\b|every\s*other\s*day/.test(f)) {
    return singleDoseMg * 0.5; // qa-allow: unit-conversion - liều cách ngày (mỗi 48h)
  }
  if (/(\d+)\s*lần\s*\/\s*tuần|twice\s*(?:a\s*)?week|twice\s*weekly/.test(f)) {
    const wkMatch = /(\d+)\s*lần\s*\/\s*tuần/.exec(f);
    const timesPerWeek = wkMatch ? Number.parseInt(wkMatch[1], 10) : 2; // qa-allow: unit-conversion - twice weekly
    return (singleDoseMg * timesPerWeek) / 7; // qa-allow: unit-conversion - quy đổi tuần sang ngày
  }
  if (doseAlreadyHasMultiplier) return singleDoseMg;

  const vnTimesAfter = /(?:(?:x|×)\s*)?(\d+)\s*lần(?:\s*(?:\/|mỗi|1)\s*ngày|\b)/.exec(f);
  if (vnTimesAfter) {
    const mult = Number.parseInt(vnTimesAfter[1], 10);
    if (mult >= 1 && mult <= 6) return singleDoseMg * mult;
  }
  if (allowCountPerDayInFreq) {
    const vnTabsPerDay = /(?:(?:x|×)\s*)?(\d+)\s*(?:viên|vien)\s*(?:\/|mỗi|1)\s*ngày/.exec(f);
    if (vnTabsPerDay) {
      const mult = Number.parseInt(vnTabsPerDay[1], 10);
      if (mult >= 1 && mult <= 6) return singleDoseMg * mult;
    }
  }
  const vnTimesBefore = /ngày\s*(?:uống\s*)?(\d+)\s*lần/.exec(f);
  if (vnTimesBefore) {
    const mult = Number.parseInt(vnTimesBefore[1], 10);
    if (mult >= 1 && mult <= 6) return singleDoseMg * mult;
  }
  if (/\bq6h\b|mỗi\s*6\s*(?:h|giờ)|\bqid\b/.test(f)) {
    return singleDoseMg * 4; // qa-allow: unit-conversion - QID / mỗi 6 giờ
  }
  if (/\bq8h\b|mỗi\s*8\s*(?:h|giờ)|\btid\b|sáng\s*[-–+,]\s*trưa\s*[-–+,]\s*(?:chiều|tối)/.test(f)) {
    return singleDoseMg * 3; // qa-allow: unit-conversion - TID / mỗi 8 giờ
  }
  if (/\bq12h\b|mỗi\s*12\s*(?:h|giờ)|\bbid\b|\btwice\b|sáng\s*[-–+,]\s*(?:chiều|tối)/.test(f)) {
    return singleDoseMg * 2; // qa-allow: unit-conversion - BID / mỗi 12 giờ
  }
  return singleDoseMg;
}

export function parseMedDailyDoseMg(med?: CurrentMed): number | undefined {
  if (!med || med.dose === undefined || med.dose === null) return undefined;
  const rawStr = String(med.dose).trim();
  if (!rawStr) return undefined;
  const rawLower = rawStr.toLowerCase();
  const unitStr = (med.unit || '').trim().toLowerCase();
  const legacyFreq = (med as CurrentMed & { frequency?: string }).frequency;
  const freqOnly = (med.freq || legacyFreq || '').trim().toLowerCase();

  // Tránh đọc nhầm FDC dạng '80/12.5 mg' thành 80 mg của hoạt chất thứ hai
  if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/.test(rawLower)) {
    return undefined;
  }

  const numMatch = /^(\d+(?:\.\d+)?)/.exec(rawLower);
  if (!numMatch) return undefined;
  const baseVal = Number.parseFloat(numMatch[1]);
  if (!Number.isFinite(baseVal) || baseVal <= 0) return undefined;

  const isCountUnit =
    (COUNT_UNIT_REGEX.test(unitStr) || COUNT_UNIT_REGEX.test(rawLower)) &&
    !/^(mg|g|mcg|µg|ug)(?:\/.*)?$/i.test(unitStr);

  if (isCountUnit) {
    const inlineMass = EXPLICIT_MASS_IN_TEXT_REGEX.exec(rawLower) ?? (med.name ? EXPLICIT_MASS_IN_TEXT_REGEX.exec(med.name) : null);
    if (!inlineMass) {
      // Fail-closed: tuyệt đối không giả định '1 viên' = 1 mg!
      return undefined;
    }
    const strengthVal = Number.parseFloat(inlineMass[1]);
    const strengthUnit = inlineMass[2].toLowerCase();
    if (!Number.isFinite(strengthVal) || strengthVal <= 0) return undefined;
    const strengthMg =
      strengthUnit === 'g'
        ? strengthVal * 1000 // qa-allow: unit-conversion - g sang mg
        : strengthUnit === 'mcg' || strengthUnit === 'µg' || strengthUnit === 'ug'
          ? strengthVal / 1000 // qa-allow: unit-conversion - mcg sang mg
          : strengthVal;
    const perAdminMg = baseVal * strengthMg;
    const doseHasMult = /(?:x|×)\s*\d+\s*lần|\b(?:bid|tid|qid|q12h|q8h|q6h)\b/i.test(rawLower);
    return applyFrequencyMultiplier(perAdminMg, `${rawLower} ${freqOnly}`, doseHasMult, false);
  }

  const isGram =
    unitStr === 'g' || unitStr === 'g/ngày' || unitStr === 'g/day' || /^\d+(?:\.\d+)?\s*g(?:\b|\/)/.test(rawLower);
  const isMcg =
    unitStr === 'mcg' ||
    unitStr === 'µg' ||
    unitStr === 'ug' ||
    /^\d+(?:\.\d+)?\s*(?:mcg|µg|ug)(?:\b|\/)/.test(rawLower);

  const singleDoseMg = isGram
    ? baseVal * 1000 // qa-allow: unit-conversion - quy đổi g sang mg
    : isMcg
      ? baseVal / 1000 // qa-allow: unit-conversion - quy đổi mcg sang mg
      : baseVal;

  return applyFrequencyMultiplier(singleDoseMg, `${rawLower} ${freqOnly}`, false, true);
}
