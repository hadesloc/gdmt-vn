/**
 * GDMT-VN Module Tăng huyết áp (htn) - Hàm Tiện ích & Phân loại Nhóm Thuốc Dùng Chung
 * Phân quyền: Agent H (Tim mạch / THA)
 *
 * Dùng chung cho cả quy tắc Ngoại trú và Nội viện, tuân thủ nghiêm ngặt QA-1, QA-8, QA-9, QA-10.
 */

import type { RuleContext, CurrentMed } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor } from '../../kb-types';

export const ACEI_IDS = [
  'perindopril',
  'enalapril',
  'captopril',
  'lisinopril',
  'ramipril',
  'benazepril',
  'fosinopril',
  'trandolapril',
  'quinapril',
  'moexipril'
];

export const ARB_IDS = [
  'losartan',
  'valsartan',
  'telmisartan',
  'irbesartan',
  'candesartan',
  'olmesartan',
  'azilsartan'
];

export const ARNI_IDS = ['sacubitril_valsartan'];
export const DRI_IDS = ['aliskiren'];
export const RASI_IDS = [...ACEI_IDS, ...ARB_IDS, ...ARNI_IDS, ...DRI_IDS];

export const SPC_COMPONENT_MAP: Record<string, readonly string[]> = {
  perindopril_amlodipine: ['perindopril', 'amlodipine'],
  coveram: ['perindopril', 'amlodipine'],
  perindopril_indapamide: ['perindopril', 'indapamide'],
  preterax: ['perindopril', 'indapamide'],
  noliprel: ['perindopril', 'indapamide'],
  perindopril_indapamide_amlodipine: ['perindopril', 'indapamide', 'amlodipine'],
  triplixam: ['perindopril', 'indapamide', 'amlodipine'],
  valsartan_amlodipine: ['valsartan', 'amlodipine'],
  exforge: ['valsartan', 'amlodipine'],
  telmisartan_amlodipine: ['telmisartan', 'amlodipine'],
  twynsta: ['telmisartan', 'amlodipine'],
  losartan_hctz: ['losartan', 'hydrochlorothiazide'],
  hyzaar: ['losartan', 'hydrochlorothiazide']
};

export const DHP_CCB_IDS = ['amlodipine', 'nifedipine', 'felodipine', 'lercanidipine'];
export const NDHP_CCB_IDS = ['diltiazem', 'verapamil'];
export const CCB_IDS = [...DHP_CCB_IDS, ...NDHP_CCB_IDS];

export const THIAZIDE_IDS = ['indapamide', 'hydrochlorothiazide', 'chlorthalidone'];
export const LOOP_IDS = ['furosemide', 'torsemide', 'torasemide', 'bumetanide'];
export const DIURETIC_IDS = [...THIAZIDE_IDS, ...LOOP_IDS];

export const MRA_IDS = ['spironolactone', 'eplerenone', 'finerenone'];

export const BB_IDS = [
  'bisoprolol',
  'metoprolol_succinate',
  'metoprolol',
  'carvedilol',
  'nebivolol',
  'atenolol',
  'propranolol',
  'labetalol',
  'esmolol'
];

export const ALPHA1_IDS = ['doxazosin', 'prazosin', 'terazosin', 'alfuzosin'];
export const CENTRAL_IDS = ['methyldopa', 'clonidine', 'moxonidine'];

export const ALL_ORAL_BP_MED_IDS = [
  ...RASI_IDS,
  ...CCB_IDS,
  ...DIURETIC_IDS,
  ...MRA_IDS,
  ...BB_IDS,
  ...ALPHA1_IDS,
  ...CENTRAL_IDS,
  'amiloride',
  'hydralazine',
  'minoxidil'
];

export const PDE5I_IDS = ['sildenafil', 'tadalafil', 'vardenafil', 'avanafil'];

export const LERCANIDIPINE_CONTRA_DDI_IDS = [
  'clarithromycin',
  'itraconazole',
  'ketoconazole',
  'voriconazole',
  'posaconazole',
  'ritonavir',
  'cobicistat',
  'nirmatrelvir_ritonavir',
  'ciclosporin',
  'cyclosporine'
];

export const PREGNANCY_SAFE_ORAL_IDS = ['methyldopa', 'labetalol', 'nifedipine'];

export const PREGNANCY_UNSAFE_NON_RASI_IDS = [
  ...MRA_IDS,
  ...THIAZIDE_IDS,
  'atenolol',
  'lercanidipine',
  'felodipine',
  'moxonidine',
  'doxazosin',
  'clonidine',
  'sodium_nitroprusside'
];

export function getMedIds(ctx: RuleContext): string[] {
  const expanded: string[] = [];
  for (const m of ctx.patient.currentMeds) {
    const raw = m.drugId.trim().toLowerCase();
    if (!raw) continue;
    const comps = SPC_COMPONENT_MAP[raw];
    if (comps) {
      for (const c of comps) {
        if (!expanded.includes(c)) expanded.push(c);
      }
    } else {
      expanded.push(raw);
    }
  }
  return expanded;
}

export function findCurrentMed(ctx: RuleContext, ids: string[]): CurrentMed | undefined {
  const direct = ctx.patient.currentMeds.find((m) => ids.includes(m.drugId.trim().toLowerCase()));
  if (direct) return direct;
  const spcMatch = ctx.patient.currentMeds.find((m) => {
    const comps = SPC_COMPONENT_MAP[m.drugId.trim().toLowerCase()];
    return Boolean(comps && comps.some((c) => ids.includes(c)));
  });
  return spcMatch ? { ...spcMatch, dose: undefined } : undefined;
}

export function parseMedDoseMg(med: CurrentMed | undefined): number | undefined {
  if (!med || med.dose === undefined || med.dose === null) return undefined;
  if (typeof med.dose === 'number' && !Number.isNaN(med.dose)) return med.dose;
  if (typeof med.dose === 'string') {
    const parsed = parseFloat(med.dose);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Đọc cờ boolean an toàn từ cả customInputs lẫn conditions mà không gây cảnh báo khóa lạ trong hasCondition.
 */
export function hasCustomOrCondFlag(ctx: RuleContext, ...keys: string[]): boolean {
  const normCustom = ctx.normalized?.customInputs || {};
  const patCustom = ctx.patient?.customInputs || {};
  const normConds = (ctx.normalized?.conditions || {}) as Record<string, unknown>;
  const patConds = (ctx.patient?.conditions || {}) as Record<string, unknown>;

  for (const k of keys) {
    if (Boolean(normCustom[k]) || Boolean(patCustom[k]) || Boolean(normConds[k]) || Boolean(patConds[k])) {
      return true;
    }
  }
  return false;
}

export function hasBilateralRenalArteryStenosis(ctx: RuleContext): boolean {
  return hasCustomOrCondFlag(ctx, 'bilateralRenalArteryStenosis', 'bilateral_renal_artery_stenosis');
}

export function isSevereAorticStenosis(ctx: RuleContext): boolean {
  return hasCustomOrCondFlag(ctx, 'severeAorticStenosis', 'severe_aortic_stenosis', 'aorticStenosisSevere');
}

export function hasPde5i(ctx: RuleContext): boolean {
  if (hasCustomOrCondFlag(ctx, 'pde5InhibitorUse', 'pde5_inhibitor_use')) return true;
  const medIds = getMedIds(ctx);
  return medIds.some((id) => PDE5I_IDS.includes(id));
}

export function hasPacemaker(ctx: RuleContext): boolean {
  return (
    ctx.patient.rhythm === 'paced' ||
    ctx.normalized?.rhythm === 'paced' ||
    hasCustomOrCondFlag(ctx, 'pacemaker', 'permanentPacemaker')
  );
}

export function hasAvBlockOrSssWithoutPacer(ctx: RuleContext): boolean {
  if (hasPacemaker(ctx)) return false;
  return hasCustomOrCondFlag(
    ctx,
    'avBlock2or3',
    'av_block_2_3',
    'sickSinusSyndrome',
    'sick_sinus_syndrome'
  );
}

export function isPostpartum(ctx: RuleContext): boolean {
  return hasCustomOrCondFlag(ctx, 'postpartum', 'isPostpartum');
}

export function isPostEvt(ctx: RuleContext): boolean {
  return hasCustomOrCondFlag(ctx, 'postReperfusionEvt', 'post_reperfusion_evt');
}

export function hasHighCvRiskComorbidity(ctx: RuleContext): boolean {
  return (
    hasCondition(ctx, 'ascvd') ||
    hasCondition(ctx, 'strokeOrTia') ||
    hasCondition(ctx, 'hf') ||
    hasCondition(ctx, 'dm') ||
    hasCondition(ctx, 'ckd') ||
    hasCondition(ctx, 'dmTargetOrganDamage') ||
    hasCustomOrCondFlag(ctx, 'hfref')
  );
}

export function isHfrEf(ctx: RuleContext): boolean {
  const lvef = need(ctx, 'lvef');
  const lvefMax = thFor('lvef', 'htn.hfref.lvef_max');
  if (lvef !== undefined && lvef <= lvefMax) return true;
  return hasCustomOrCondFlag(ctx, 'hfref');
}

export function hasAnyAcuteHmod(ctx: RuleContext): boolean {
  return (
    hasCondition(ctx, 'aorticDissection') ||
    hasCondition(ctx, 'acutePulmonaryEdema') ||
    hasCondition(ctx, 'acuteAcsWithin24h') ||
    hasCondition(ctx, 'acuteIschemicStroke') ||
    hasCondition(ctx, 'acuteIntracerebralHemorrhage') ||
    hasCondition(ctx, 'severePreeclampsiaEclampsia') ||
    hasCondition(ctx, 'hypertensiveEncephalopathy') ||
    hasCondition(ctx, 'malignantHypertension') ||
    hasCondition(ctx, 'perioperativeHypertension')
  );
}

export function isPregnantSevereCrisis(ctx: RuleContext): boolean {
  if (!hasCondition(ctx, 'pregnant')) return false;
  const sbp = need(ctx, 'sbp');
  const dbp = need(ctx, 'dbp');
  const sevSbp = thFor('sbp', 'htn.pregnancy.severe_sbp');
  const sevDbp = thFor('dbp', 'htn.pregnancy.severe_dbp');
  return (sbp !== undefined && sbp >= sevSbp) || (dbp !== undefined && dbp >= sevDbp);
}

export function needsLenientTarget(ctx: RuleContext): boolean {
  const age = need(ctx, 'age');
  const veryOldAge = thFor('age', 'htn.age.very_elderly');
  return Boolean(
    (age !== undefined && age >= veryOldAge) ||
      hasCondition(ctx, 'frailty') ||
      hasCondition(ctx, 'orthostaticHypotension') ||
      hasCondition(ctx, 'limitedLifespan')
  );
}

/**
 * Trả về ngưỡng huyết áp (SBP, DBP) được coi là CHƯA ĐẠT ĐÍCH (cần khởi trị / nâng bậc)
 * thống nhất xuyên suốt Bước 1b, Bước 2 và Bước 3 theo đúng Profile & cá thể hóa.
 */
export function getUncontrolledBpCutoffs(ctx: RuleContext): { sbp: number; dbp: number } {
  const profile = ctx.settings.profile;

  if (hasCondition(ctx, 'pregnant')) {
    return {
      sbp: thFor('sbp', 'htn.pregnancy.sbp_target'),
      dbp:
        profile === 'VN'
          ? thFor('dbp', 'htn.pregnancy.dbp_target_vn')
          : thFor('dbp', 'htn.pregnancy.dbp_target')
    };
  }

  if (needsLenientTarget(ctx)) {
    return {
      sbp: thFor('sbp', 'htn.bp.sbp_target_lenient'),
      dbp: thFor('dbp', 'htn.bp.dbp_hypertension')
    };
  }

  if (profile === 'VN') {
    const age = need(ctx, 'age');
    const age80 = thFor('age', 'htn.age.elderly_monotherapy');
    const age70 = thFor('age', 'htn.elderly.vn_age_70');
    if (age !== undefined && age >= age80) {
      return {
        sbp: thFor('sbp', 'htn.bp.sbp_target_lenient'),
        dbp: thFor('dbp', 'htn.bp.dbp_hypertension')
      };
    }
    if (hasHighCvRiskComorbidity(ctx) && (age === undefined || age < age70)) {
      return {
        sbp: thFor('sbp', 'htn.bp.sbp_target_vietnam_highrisk'),
        dbp: thFor('dbp', 'htn.bp.dbp_target_vietnam_highrisk')
      };
    }
    return {
      sbp: thFor('sbp', 'htn.bp.sbp_target_vietnam'),
      dbp: thFor('dbp', 'htn.bp.dbp_target_vietnam_vsh')
    };
  }

  return {
    sbp: thFor('sbp', 'htn.bp.sbp_target_us'),
    dbp: thFor('dbp', 'htn.bp.dbp_target_us')
  };
}

/**
 * Kiểm tra xem ngoại trú có đang trong tình trạng cấp cứu / nguy kịch cần chặn toàn bộ kê đơn thường quy không.
 */
export function isOutpatientCrisisOrUnstable(ctx: RuleContext): boolean {
  if (hasAnyAcuteHmod(ctx) || isPregnantSevereCrisis(ctx)) return true;

  const sbp = need(ctx, 'sbp');
  const dbp = need(ctx, 'dbp');
  const k = need(ctx, 'k');
  const hr = need(ctx, 'hr');

  const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
  const sbpCrisis = thFor('sbp', 'htn.emergency.sbp_crisis');
  const dbpCrisis = thFor('dbp', 'htn.emergency.dbp_crisis');
  const kCrit = thFor('k', 'htn.safety.k_critical_emergency');
  const hrCritMin = thFor('hr', 'htn.safety.hr_critical_min');
  const hrCritMax = thFor('hr', 'htn.safety.hr_critical_max');

  if (sbp !== undefined && sbp < sbpHypo) return true;
  if ((sbp !== undefined && sbp >= sbpCrisis) || (dbp !== undefined && dbp >= dbpCrisis)) return true;
  if (k !== undefined && k >= kCrit) return true;
  if (hr !== undefined && (hr < hrCritMin || hr > hrCritMax)) return true;

  return false;
}

/**
 * Tập các thuốc trong currentMeds bị phát lệnh STOP / HOLD / SWITCH trong chu kỳ đánh giá hiện tại,
 * không được tính là thuốc nền hợp lệ khi đếm nhóm Bước 1–3 (khắc phục R3-HTN-06).
 */
export function getInvalidatedActiveMedIds(ctx: RuleContext): Set<string> {
  const medIds = getMedIds(ctx);
  const blocked = new Set<string>();

  const k = need(ctx, 'k');
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const sbp = need(ctx, 'sbp');
  const hr = need(ctx, 'hr');

  const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
  const kMaxRasi = thFor('k', 'htn.rasi.k_max_initiate');
  const kHypo = thFor('k', 'htn.hypokalemia.k_threshold');
  const egfrLoop = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
  const crclIndap = thFor('crcl', 'htn.indapamide.crcl_contra');
  const egfrClick = thFor('egfr', 'htn.chlorthalidone.egfr_min_click');
  const hrMinBb = thFor('hr', 'htn.bb.hr_min_initiate');

  if (sbp !== undefined && sbp < sbpHypo) {
    for (const id of medIds) {
      if (ALL_ORAL_BP_MED_IDS.includes(id)) blocked.add(id);
    }
  }

  if (hasCondition(ctx, 'pregnant')) {
    for (const id of medIds) {
      if (RASI_IDS.includes(id) || PREGNANCY_UNSAFE_NON_RASI_IDS.includes(id)) {
        blocked.add(id);
      }
    }
  }

  if (hasCondition(ctx, 'priorAngioedema')) {
    for (const id of medIds) {
      if (ACEI_IDS.includes(id) || ARNI_IDS.includes(id)) blocked.add(id);
    }
  }

  if (hasBilateralRenalArteryStenosis(ctx) || (k !== undefined && k > kMaxRasi)) {
    for (const id of medIds) {
      if (RASI_IDS.includes(id) || MRA_IDS.includes(id)) blocked.add(id);
    }
  }

  if (k !== undefined && k < kHypo) {
    for (const id of medIds) {
      if (THIAZIDE_IDS.includes(id) || LOOP_IDS.includes(id)) blocked.add(id);
    }
  }

  const renalSevere =
    (egfr !== undefined && egfr < egfrLoop) || (egfr === undefined && crcl !== undefined && crcl < crclIndap);
  if (renalSevere) {
    for (const id of medIds) {
      if (id === 'indapamide' || id === 'hydrochlorothiazide' || id === 'lercanidipine' || id === 'moxonidine' || MRA_IDS.includes(id)) {
        blocked.add(id);
      }
      if (id === 'chlorthalidone' && egfr !== undefined && egfr < egfrClick) {
        blocked.add(id);
      }
    }
  }

  if (medIds.includes('lercanidipine') && medIds.some((id) => LERCANIDIPINE_CONTRA_DDI_IDS.includes(id))) {
    blocked.add('lercanidipine');
  }

  if (
    medIds.includes('moxonidine') &&
    (hasCondition(ctx, 'hf') || isHfrEf(ctx) || hasAvBlockOrSssWithoutPacer(ctx) || (hr !== undefined && hr < hrMinBb))
  ) {
    blocked.add('moxonidine');
  }

  if (hasCondition(ctx, 'gout')) {
    for (const id of medIds) {
      if (THIAZIDE_IDS.includes(id)) blocked.add(id);
    }
  }

  if (hasCondition(ctx, 'orthostaticHypotension')) {
    for (const id of medIds) {
      if (ALPHA1_IDS.includes(id) || CENTRAL_IDS.includes(id)) blocked.add(id);
    }
  }

  if (hasAvBlockOrSssWithoutPacer(ctx)) {
    for (const id of medIds) {
      if (BB_IDS.includes(id) || NDHP_CCB_IDS.includes(id)) blocked.add(id);
    }
  }

  return blocked;
}

export function getEffectiveActiveMedIds(ctx: RuleContext): string[] {
  const medIds = getMedIds(ctx);
  const blocked = getInvalidatedActiveMedIds(ctx);
  return medIds.filter((id) => !blocked.has(id));
}
