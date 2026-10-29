/**
 * GDMT-VN Safety - Lactation (Breastfeeding) & Allergy / Cross-Reactivity Gates
 * Phân quyền: Agent B
 */

import type { Patient } from '../types';
import { hasCondition } from '../types';
import { hasDrug, drug } from '../../kb-types';
import { expandDrugComponents, resolveCanonicalDrugId } from './fdcMap';
import {
  getNormalizedDrugClasses,
  isCox1NsaidOrSalicylate,
  isOphthalmicBetaBlocker
} from './drugClassify';

export interface LactationSafetyVerdict {
  blocked: true;
  parameter: 'lactation';
  unsafeComponentId: string;
  messageVi: string;
  citationIds: string[];
}

export interface AllergySafetyVerdict {
  blocked: true;
  parameter: string;
  messageVi: string;
  citationIds: string[];
}

/**
 * Danh sách hoạt chất an toàn / tương thích trong thời kỳ cho con bú (ESC 2025 / FDA / LactMed):
 * Tuyệt đối KHÔNG chặn Warfarin, Acenocoumarol, Heparin/LMWH, Insulin, Labetalol, Nifedipine, Methyldopa,
 * Enalapril/Captopril, Spironolactone, Prednisolone, Allopurinol khi `pregnant: false` và `breastfeeding: true`.
 */
const LACTATION_COMPATIBLE_ALLOWLIST = new Set<string>([
  'warfarin',
  'acenocoumarol',
  'enoxaparin',
  'heparin',
  'dalteparin',
  'fondaparinux',
  'insulin',
  'insulin_glargine',
  'insulin_degludec',
  'insulin_detemir',
  'insulin_nph',
  'insulin_aspart',
  'insulin_lispro',
  'insulin_regular',
  'insulin_premix',
  'labetalol',
  'nifedipine',
  'methyldopa',
  'hydralazine',
  'enalapril',
  'captopril',
  'benazepril',
  'quinapril',
  'spironolactone',
  'metoprolol_succinate',
  'metoprolol_tartrate',
  'metoprolol',
  'propranolol',
  'bisoprolol',
  'carvedilol',
  'digoxin',
  'furosemide',
  'torsemide',
  'bumetanide',
  'amlodipine',
  'verapamil',
  'diltiazem',
  'flecainide',
  'propafenone',
  'adenosine',
  'metformin',
  'prednisolone',
  'prednisone',
  'methylprednisolone',
  'hydrocortisone',
  'dexamethasone',
  'allopurinol',
  'colchicine',
  'probenecid',
  'salbutamol',
  'terbutaline',
  'ipratropium',
  'budesonide',
  'fluticasone_propionate',
  'fluticasone_furoate',
  'beclometasone',
  'mometasone',
  'formoterol',
  'salmeterol',
  'vilanterol',
  'olodaterol',
  'indacaterol',
  'tiotropium',
  'umeclidinium',
  'glycopyrronium',
  'aclidinium'
]);

const LACTATION_CONTRA_DRUG_IDS = new Set<string>([
  'atorvastatin',
  'rosuvastatin',
  'simvastatin',
  'pravastatin',
  'pitavastatin',
  'fluvastatin',
  'lovastatin',
  'ezetimibe',
  'bempedoic_acid',
  'fenofibrate',
  'gemfibrozil',
  'icosapent_ethyl',
  'evolocumab',
  'alirocumab',
  'inclisiran',
  'dapagliflozin',
  'empagliflozin',
  'canagliflozin',
  'ertugliflozin',
  'sotagliflozin',
  'semaglutide',
  'semaglutide_oral',
  'dulaglutide',
  'liraglutide',
  'lixisenatide',
  'exenatide',
  'tirzepatide',
  'apixaban',
  'rivaroxaban',
  'dabigatran',
  'edoxaban',
  'amiodarone',
  'dronedarone',
  'ivabradine',
  'vericiguat',
  'sacubitril_valsartan',
  'losartan',
  'valsartan',
  'telmisartan',
  'irbesartan',
  'candesartan',
  'olmesartan',
  'azilsartan',
  'perindopril',
  'ramipril',
  'lisinopril',
  'fosinopril',
  'trandolapril',
  'aliskiren',
  'lercanidipine',
  'moxonidine',
  'urapidil',
  'chlorthalidone',
  'indapamide',
  'finerenone',
  'eplerenone',
  'febuxostat',
  'benzbromarone',
  'roflumilast'
]);

const SULFONAMIDE_CROSS_REACTIVE_IDS = new Set<string>([
  'indapamide',
  'chlorthalidone',
  'hydrochlorothiazide',
  'furosemide',
  'bumetanide',
  'torsemide',
  'acetazolamide',
  'celecoxib',
  'glimepiride',
  'gliclazide',
  'glibenclamide',
  'glyburide',
  'glipizide',
  'cotrimoxazole',
  'sulfamethoxazole_trimethoprim',
  'tmp_smx',
  'bactrim'
]);

const BETA_LACTAM_PENICILLIN_IDS = new Set<string>([
  'penicillin',
  'amoxicillin',
  'amoxicillin_clavulanate',
  'ampicillin',
  'ampicillin_sulbactam',
  'piperacillin_tazobactam',
  'oxacillin'
]);

export function isBreastfeeding(patient: Patient): boolean {
  return hasCondition({ normalized: patient, patient }, 'breastfeeding');
}

function defaultLactationCitations(compId: string, classes: Set<string>): string[] {
  if (classes.has('doac')) return ['esc.preg.2025.doac_lactation'];
  if (classes.has('statin') || classes.has('fibrate') || classes.has('pcsk9') || compId === 'ezetimibe' || compId === 'bempedoic_acid' || compId === 'icosapent_ethyl') {
    return ['esc.lipid.2019.pregnancy_all_llt_contra', 'acc.lipid.2026.lactation_fibrate_5days'];
  }
  if (compId === 'sacubitril_valsartan') return ['fda.hf.sacubitril_lactation_hepatic'];
  if (compId === 'ivabradine') return ['fda.hf.ivabradine_lactation'];
  if (compId === 'vericiguat') return ['fda.hf.vericiguat_lactation'];
  if (compId === 'amiodarone' || compId === 'dronedarone') return ['fda.amiodarone.lactation', 'esc.preg.2025.amiodarone_dronedarone_avoid'];
  if (compId === 'febuxostat') return ['fda.febuxostat.lactation'];
  if (compId === 'indapamide' || compId === 'chlorthalidone') {
    return ['ema.indapamide.pregnancy_lactation', 'esc.htn.2024.pregnancy_lactation_thiazide'];
  }
  return ['esc.htn.2024.pregnancy_lactation_thiazide'];
}

export function evaluateLactationSafety(
  drugIdOrName: string,
  patient: Patient,
  routeHint?: string
): LactationSafetyVerdict | null {
  if (!isBreastfeeding(patient)) return null;
  if (isOphthalmicBetaBlocker(drugIdOrName, routeHint)) return null;

  const components = expandDrugComponents(drugIdOrName);
  for (const comp of components) {
    if (LACTATION_COMPATIBLE_ALLOWLIST.has(comp)) continue;

    const kbComp = hasDrug(comp) ? drug(comp) : undefined;
    const compClasses = getNormalizedDrugClasses(comp);
    const kbStatus = kbComp?.lactation?.status;

    if (kbStatus === 'contra' || kbStatus === 'avoid') {
      return {
        blocked: true,
        parameter: 'lactation',
        unsafeComponentId: comp,
        messageVi:
          kbComp?.lactation?.notesVi ||
          `Đang cho con bú: Chống chỉ định hoặc tránh dùng ${kbComp?.nameVi || comp} do bài tiết qua sữa mẹ hoặc nguy cơ độc tính trên trẻ bú mẹ`,
        citationIds: kbComp?.lactation?.citationIds?.length
          ? kbComp.lactation.citationIds
          : defaultLactationCitations(comp, compClasses)
      };
    }

    if (kbStatus === 'compatible') continue;

    const isClassBlockedInLactation =
      LACTATION_CONTRA_DRUG_IDS.has(comp) ||
      compClasses.has('statin') ||
      compClasses.has('fibrate') ||
      compClasses.has('pcsk9') ||
      compClasses.has('sglt2i') ||
      compClasses.has('glp1ra') ||
      compClasses.has('doac') ||
      compClasses.has('arb') ||
      compClasses.has('arni') ||
      compClasses.has('renin_inhibitor');

    if (isClassBlockedInLactation) {
      return {
        blocked: true,
        parameter: 'lactation',
        unsafeComponentId: comp,
        messageVi: `Đang cho con bú: Chống chỉ định hoặc tránh dùng ${kbComp?.nameVi || comp} trong thời kỳ cho con bú; ưu tiên chuyển sang thuốc an toàn cho trẻ bú mẹ`,
        citationIds: defaultLactationCitations(comp, compClasses)
      };
    }
  }

  return null;
}

function normalizeToken(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[\s\-+/]+/g, '_');
}

function collectPatientAllergyTokens(patient: Patient): string[] {
  const tokens = new Set<string>();
  const pushItem = (raw: unknown) => {
    if (typeof raw === 'string') {
      for (const part of raw.split(/[,;|]+/)) {
        const t = part.trim().toLowerCase();
        if (t) {
          tokens.add(t);
          tokens.add(normalizeToken(t));
        }
      }
    }
  };

  if (Array.isArray(patient.allergies)) {
    for (const item of patient.allergies) pushItem(item);
  }
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  if (Array.isArray(ci.allergies)) {
    for (const item of ci.allergies) pushItem(item);
  } else if (typeof ci.allergies === 'string') {
    pushItem(ci.allergies);
  }

  if (ci.sulfonamideAllergy === true || patient.conditions?.sulfonamideAllergy === true) {
    tokens.add('sulfonamide');
  }
  if (
    ci.soyAllergy === true ||
    ci.eggAllergy === true ||
    ci.soyEggAllergy === true ||
    patient.conditions?.soyEggAllergy === true
  ) {
    tokens.add('soy_egg');
  }
  if (patient.conditions?.allergyStatin === true || ci.allergyStatin === true) {
    tokens.add('statin');
  }

  return Array.from(tokens);
}

export function evaluateAllergySafety(
  drugIdOrName: string,
  patient: Patient
): AllergySafetyVerdict | null {
  const canonical = resolveCanonicalDrugId(drugIdOrName);
  const components = expandDrugComponents(canonical);
  const allClasses = getNormalizedDrugClasses(canonical);

  // 1. Tiền sử phù mạch (Angioedema): chống chỉ định tuyệt đối ACEi, ARNI và Aliskiren (kể cả viên phối hợp SPC)
  if (hasCondition({ normalized: patient, patient }, 'priorAngioedema')) {
    if (
      allClasses.has('acei') ||
      allClasses.has('arni') ||
      allClasses.has('renin_inhibitor') ||
      components.some((c) => {
        const cls = getNormalizedDrugClasses(c);
        return cls.has('acei') || cls.has('arni') || cls.has('renin_inhibitor') || c === 'aliskiren';
      })
    ) {
      return {
        blocked: true,
        parameter: 'angioedema',
        messageVi:
          'Tiền sử phù mạch (do ACEi/ARNI hoặc phù mạch di truyền/vô căn): Chống chỉ định tuyệt đối nhóm ACEi, ARNI và Aliskiren do nguy cơ tái phát phù thanh quản đe dọa tính mạng',
        citationIds: ['aha.acc.2025.acei_angioedema_contra', 'fda.hf.sacubitril_angioedema']
      };
    }
  }

  // 2. Cờ `allergyAceiArb`: Dị ứng/không dung nạp cả ACEi và ARB -> chặn ACEi, ARB, ARNI, Aliskiren
  if (hasCondition({ normalized: patient, patient }, 'allergyAceiArb')) {
    if (
      allClasses.has('acei') ||
      allClasses.has('arb') ||
      allClasses.has('arni') ||
      allClasses.has('renin_inhibitor')
    ) {
      return {
        blocked: true,
        parameter: 'allergyAceiArb',
        messageVi:
          'Dị ứng / chống chỉ định cả nhóm ACEi và ARB: Không sử dụng ACEi, ARB, ARNI hoặc Aliskiren (kể cả viên phối hợp cố định liều)',
        citationIds: ['aha.acc.2025.acei_angioedema_contra']
      };
    }
  }

  const tokens = collectPatientAllergyTokens(patient);
  if (tokens.length === 0) return null;
  const tokenSet = new Set(tokens);

  // 3. Khớp trực tiếp tên hoạt chất, thành phần FDC hoặc biệt dược
  for (const comp of [canonical, ...components]) {
    const resolvedComp = resolveCanonicalDrugId(comp);
    if (tokenSet.has(comp) || tokenSet.has(resolvedComp)) {
      return {
        blocked: true,
        parameter: 'drug_allergy',
        messageVi: `Tiền sử dị ứng thuốc đặc hiệu với ${resolvedComp}: Chống chỉ định tuyệt đối sử dụng lại hoạt chất hoặc viên phối hợp chứa ${resolvedComp}`,
        citationIds: ['aha.acc.2025.acei_angioedema_contra']
      };
    }
    if (hasDrug(resolvedComp)) {
      const d = drug(resolvedComp);
      const namesToCheck = [
        d.inn.toLowerCase(),
        normalizeToken(d.inn),
        d.nameVi.toLowerCase(),
        ...(d.vnBrands || []).map((b) => b.toLowerCase()),
        ...(d.vnBrands || []).map((b) => normalizeToken(b))
      ];
      if (namesToCheck.some((n) => n && tokenSet.has(n))) {
        return {
          blocked: true,
          parameter: 'drug_allergy',
          messageVi: `Tiền sử dị ứng với ${d.nameVi} (${d.inn}): Chống chỉ định tuyệt đối sử dụng`,
          citationIds: d.citationIds.slice(0, 2)
        };
      }
    }
  }

  // 4. Khớp dị ứng chéo theo nhóm dược lý / tá dược
  if ((tokenSet.has('acei') || tokenSet.has('allergyaceiarb')) && allClasses.has('acei')) {
    return {
      blocked: true,
      parameter: 'acei_allergy',
      messageVi: 'Tiền sử dị ứng nhóm ức chế men chuyển (ACEi): Chống chỉ định sử dụng ACEi và các viên phối hợp chứa ACEi',
      citationIds: ['aha.acc.2025.acei_angioedema_contra']
    };
  }

  if (
    (tokenSet.has('arb') || tokenSet.has('allergyaceiarb')) &&
    (allClasses.has('arb') || allClasses.has('arni'))
  ) {
    return {
      blocked: true,
      parameter: 'arb_allergy',
      messageVi: 'Tiền sử dị ứng nhóm chẹn thụ thể Angiotensin (ARB): Chống chỉ định sử dụng ARB và ARNI (chứa Valsartan)',
      citationIds: ['fda.hf.sacubitril_angioedema']
    };
  }

  if ((tokenSet.has('statin') || tokenSet.has('allergystatin')) && allClasses.has('statin')) {
    return {
      blocked: true,
      parameter: 'statin_allergy',
      messageVi: 'Tiền sử dị ứng nặng với nhóm Statin: Chống chỉ định sử dụng Statin và viên phối hợp chứa Statin',
      citationIds: ['esc.lipid.2019.monitoring_alt_elevation']
    };
  }

  if (
    (tokenSet.has('nsaid') || tokenSet.has('aspirin') || tokenSet.has('asa') || tokenSet.has('salicylate')) &&
    components.some((c) => isCox1NsaidOrSalicylate(c))
  ) {
    return {
      blocked: true,
      parameter: 'nsaid_allergy',
      messageVi: 'Tiền sử dị ứng / quá mẫn với Aspirin hoặc NSAID ức chế COX-1: Chống chỉ định sử dụng',
      citationIds: ['gina.asthma.2026.aerd_avoid_nsaid']
    };
  }

  if (
    (tokenSet.has('penicillin') || tokenSet.has('beta_lactam') || tokenSet.has('betalactam') || tokenSet.has('amoxicillin')) &&
    components.some((c) => BETA_LACTAM_PENICILLIN_IDS.has(c))
  ) {
    return {
      blocked: true,
      parameter: 'penicillin_allergy',
      messageVi: 'Tiền sử dị ứng kháng sinh nhóm Penicillin / Beta-lactam: Chống chỉ định sử dụng',
      citationIds: ['gina.asthma.2026.aerd_avoid_nsaid']
    };
  }

  if (
    (tokenSet.has('sulfonamide') || tokenSet.has('sulfa') || tokenSet.has('sulfonamid')) &&
    components.some((c) => SULFONAMIDE_CROSS_REACTIVE_IDS.has(c))
  ) {
    return {
      blocked: true,
      parameter: 'sulfonamide_allergy',
      messageVi: 'Tiền sử dị ứng Sulfonamide: Chống chỉ định / tránh dùng các dẫn xuất sulfonamide (lợi tiểu thiazide/quai, sulfonylurea, celecoxib, cotrimoxazole)',
      citationIds: ['aha.acc.2025.table13_chlorthalidone']
    };
  }

  if (
    (tokenSet.has('soy') ||
      tokenSet.has('soy_egg') ||
      tokenSet.has('egg') ||
      tokenSet.has('peanut') ||
      tokenSet.has('đậu nành') ||
      tokenSet.has('dau_nanh') ||
      tokenSet.has('trứng') ||
      tokenSet.has('trung')) &&
    components.includes('clevidipine')
  ) {
    return {
      blocked: true,
      parameter: 'soy_egg_allergy',
      messageVi: 'Chống chỉ định tuyệt đối Clevidipine ở bệnh nhân dị ứng đậu nành, chế phẩm đậu nành hoặc trứng/sản phẩm từ trứng (nhũ tương lipid)',
      citationIds: ['aha.acc.2025.iv_clevidipine']
    };
  }

  return null;
}
