/**
 * Hàm phụ trợ trạng thái lâm sàng & định dạng liều dùng chung cho Module Rung nhĩ (AF)
 */

import type { CurrentMed, RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { computeCha2ds2va } from '../../engine/calculators/cha2ds2va';
import type { DoacDrug as DoacDrugId } from '../../engine/calculators/types';
import type { Dose } from '../../kb-types';
import { dose, drug, hasDrug, thFor } from '../../kb-types/access';

export type { DoacDrugId };

export const DOAC_IDS: DoacDrugId[] = ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'];
export const VKA_IDS = ['warfarin', 'acenocoumarol'] as const;
export const PARENTERAL_ANTICOAG_IDS = ['enoxaparin', 'heparin', 'dalteparin', 'fondaparinux'] as const;
export const ALL_ANTICOAG_IDS = [...DOAC_IDS, ...VKA_IDS, ...PARENTERAL_ANTICOAG_IDS];
export const ANTIPLATELET_IDS = ['aspirin', 'clopidogrel', 'ticagrelor', 'prasugrel'] as const;

export const BB_IDS = [
  'bisoprolol',
  'metoprolol_succinate',
  'metoprolol_tartrate',
  'metoprolol',
  'carvedilol',
  'nebivolol',
  'atenolol',
  'propranolol',
  'nadolol',
  'esmolol',
  'landiolol',
  'labetalol'
];
export const NON_SELECTIVE_BB_IDS = ['propranolol', 'nadolol', 'carvedilol', 'labetalol'];
export const NON_DHP_CCB_IDS = ['diltiazem', 'verapamil'];
export const CLASS_IC_IDS = ['flecainide', 'propafenone'] as const;
export const CLASS_III_AAD_IDS = ['amiodarone', 'dronedarone', 'sotalol'] as const;
export const AAD_IDS = ['amiodarone', 'dronedarone', 'flecainide', 'propafenone', 'sotalol'] as const;
export const WPW_CONTRA_IDS = [
  ...BB_IDS,
  ...NON_DHP_CCB_IDS,
  'digoxin',
  'amiodarone',
  'dronedarone',
  'adenosine',
  'ivabradine',
  'sotalol'
];

export const STRONG_CYP3A4_PGP_INDUCER_IDS = [
  'rifampin',
  'rifampicin',
  'carbamazepine',
  'phenytoin',
  'phenobarbital',
  'primidone',
  'st_johns_wort'
];
export const STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS = ['ketoconazole', 'itraconazole', 'ritonavir'];
export const DRONEDARONE_CYP3A4_CONTRA_IDS = [...STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS, 'clarithromycin', 'voriconazole'];
export const DABIGATRAN_PGP_CONTRA_IDS = ['dronedarone', 'ketoconazole', 'itraconazole', 'cyclosporine', 'tacrolimus'];
export const EDOXABAN_PGP_INHIBITOR_IDS = ['cyclosporine', 'dronedarone', 'erythromycin', 'ketoconazole'];

const FALLBACK_DRUG_NAMES: Record<string, string> = {
  aspirin: 'Aspirin',
  clopidogrel: 'Clopidogrel',
  ticagrelor: 'Ticagrelor',
  prasugrel: 'Prasugrel',
  dalteparin: 'Dalteparin',
  fondaparinux: 'Fondaparinux',
  adenosine: 'Adenosine',
  ibutilide: 'Ibutilide',
  procainamide: 'Procainamide',
  metoprolol: 'Metoprolol',
  metoprolol_tartrate: 'Metoprolol tartrate',
  atenolol: 'Atenolol',
  nadolol: 'Nadolol',
  landiolol: 'Landiolol'
};

export function isAfActive(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'af') ||
      ctx.normalized.rhythm === 'afib' ||
      ctx.patient.selectedModules?.includes('af')
  );
}

export function hasCurrentMed(ctx: RuleContext, drugIds: readonly string[]): boolean {
  const set = new Set(drugIds.map((d) => d.toLowerCase()));
  return ctx.normalized.currentMeds.some((m) => set.has(m.drugId.toLowerCase()));
}

export function findCurrentMed(ctx: RuleContext, drugIds: readonly string[]): CurrentMed | undefined {
  const set = new Set(drugIds.map((d) => d.toLowerCase()));
  return ctx.normalized.currentMeds.find((m) => set.has(m.drugId.toLowerCase()));
}

export function hasWpw(ctx: RuleContext): boolean {
  const c = ctx.normalized.conditions;
  const raw = ctx.patient.conditions;
  return Boolean(
    hasCondition(ctx, 'wpw') ||
      hasCondition(ctx, 'preExcitedAf') ||
      c?.wpw_afib ||
      raw?.wpw_afib ||
      ctx.patient.customInputs?.wpw === true
  );
}

export function hasHcm(ctx: RuleContext): boolean {
  const c = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  return Boolean(hasCondition(ctx, 'hypertrophicCardiomyopathy') || c.hcm || c.hocm);
}

export function hasCardiacAmyloidosis(ctx: RuleContext): boolean {
  const c = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  return Boolean(
    hasCondition(ctx, 'cardiacAmyloidosis') || c.amyloidosis || c.attr_cm || c.al_amyloidosis
  );
}

export function hasAps(ctx: RuleContext): boolean {
  const c = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  return Boolean(
    c.antiphospholipidSyndrome ||
      c.antiphospholipid_syndrome ||
      c.aps ||
      ctx.patient.customInputs?.antiphospholipidSyndrome === true
  );
}

export function hasValvularAf(ctx: RuleContext): boolean {
  return Boolean(hasCondition(ctx, 'mechanicalValve') || hasCondition(ctx, 'mitralStenosis'));
}

export function hasActiveMajorBleed(ctx: RuleContext): boolean {
  const legacyPlt = (ctx.patient as unknown as Record<string, unknown>).platelets;
  const pltRaw =
    ctx.patient.customInputs?.platelets ??
    ctx.patient.customInputs?.afPlatelets ??
    legacyPlt;
  const plt = typeof pltRaw === 'number' ? pltRaw : undefined;
  return Boolean(
    hasCondition(ctx, 'activeBleeding') ||
      hasCondition(ctx, 'acuteIntracerebralHemorrhage') ||
      ctx.normalized.conditions?.active_bleeding ||
      ctx.patient.conditions?.active_bleeding ||
      ctx.patient.conditions?.acute_ich ||
      (plt !== undefined && plt > 0 && plt < 50) // qa-allow: index - Tiểu cầu < 50 G/L chống chỉ định chống đông
  );
}

export function hasTrueCad(ctx: RuleContext): boolean {
  const raw = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  return Boolean(
    hasCondition(ctx, 'cad') ||
      hasCondition(ctx, 'recentAcs') ||
      hasCondition(ctx, 'acuteAcsWithin24h') ||
      raw.coronaryArteryDisease === true ||
      raw.priorMi === true ||
      raw.acs === true ||
      raw.chronicCoronarySyndrome === true
  );
}

export type ChildPughGrade = 'A' | 'B' | 'C' | undefined;

export function getChildPugh(ctx: RuleContext): ChildPughGrade {
  const cp = String(ctx.patient.customInputs?.childPugh ?? '').toUpperCase();
  if (cp === 'A' || cp === 'B' || cp === 'C') return cp;
  const c = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  if (c.childPughC || c.child_pugh_c || hasCondition(ctx, 'decompensatedCirrhosis')) return 'C';
  if (c.childPughB || c.child_pugh_b || c.moderate_to_severe_hepatic_impairment) return 'B';
  if (c.childPughA || c.child_pugh_a) return 'A';
  return undefined;
}

export function hasHepaticContraForAllDoacs(ctx: RuleContext): boolean {
  return getChildPugh(ctx) === 'C';
}

export function hasUnspecifiedLiverDisease(ctx: RuleContext): boolean {
  return hasCondition(ctx, 'liverDisease') && getChildPugh(ctx) === undefined;
}

export function hasConductionBlockNoPacer(ctx: RuleContext): boolean {
  if (hasCondition(ctx, 'pacemaker') || ctx.normalized.rhythm === 'paced') return false;
  return Boolean(
    hasCondition(ctx, 'avBlock2Or3') ||
      hasCondition(ctx, 'secondOrThirdDegreeAvBlock') ||
      hasCondition(ctx, 'sickSinusSyndrome') ||
      ctx.patient.conditions?.av_block_2_3
  );
}

export function hasHyperthyroidism(ctx: RuleContext): boolean {
  const c = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  return Boolean(c.hyperthyroidism || c.thyrotoxicosis || ctx.patient.customInputs?.hyperthyroidism === true);
}

export function isUnstableHemodynamics(ctx: RuleContext): boolean {
  const sbp = need(ctx, 'sbp');
  const minSbp = thFor('sbp', 'af.acute.hypotension_sbp');
  return Boolean(
    ctx.patient.customInputs?.hemodynamicStability === 'unstable' ||
      hasCondition(ctx, 'cardiogenicShock') ||
      hasCondition(ctx, 'acutePulmonaryEdema') ||
      (sbp !== undefined && sbp < minSbp)
  );
}

export function isAcuteDecompensatedHf(ctx: RuleContext): boolean {
  const cong = String(ctx.patient.customInputs?.congestion ?? '').toLowerCase();
  const c = { ...(ctx.normalized.conditions ?? {}), ...(ctx.patient.conditions ?? {}) };
  return Boolean(
    hasCondition(ctx, 'acutePulmonaryEdema') ||
      hasCondition(ctx, 'cardiogenicShock') ||
      c.acuteDecompensatedHf === true ||
      c.acute_decompensated_hf === true ||
      c.adhf === true ||
      cong === 'overt' ||
      cong === 'severe' ||
      cong === 'wet'
  );
}

export function isAllergicToDrug(ctx: RuleContext, drugId: string): boolean {
  const list = ctx.normalized.allergies ?? ctx.patient.allergies ?? [];
  if (list.length === 0) return false;
  const target = drugId.toLowerCase();
  const entryName = hasDrug(target) ? drug(target).inn.toLowerCase() : target;
  return list.some((a) => {
    const token = a.trim().toLowerCase();
    return (
      token === target ||
      token === entryName ||
      (DOAC_IDS.includes(target as DoacDrugId) && token === 'doac')
    );
  });
}

export function getEhraNumeric(ctx: RuleContext): number | undefined {
  const raw = String(ctx.patient.customInputs?.ehraScore ?? '').trim().toLowerCase();
  if (!raw) return undefined;
  if (raw.startsWith('2')) return 2;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function computeAfStrokeScore(ctx: RuleContext, age: number) {
  const hasVascular = Boolean(
    ctx.patient.conditions?.ascvd ||
      ctx.normalized.conditions?.ascvd ||
      hasCondition(ctx, 'vascularDisease')
  );
  return computeCha2ds2va({
    chf: hasCondition(ctx, 'hf'),
    hypertension: hasCondition(ctx, 'htn'),
    age,
    diabetes: hasCondition(ctx, 'dm'),
    strokeOrTia: hasCondition(ctx, 'strokeOrTia'),
    vascularDisease: hasVascular,
    sex: ctx.normalized.sex
  });
}

export function getDrugDisplayNameVi(drugId: string, fallbackMed?: CurrentMed): string {
  const id = drugId.toLowerCase();
  if (hasDrug(id)) return drug(id).nameVi;
  if (FALLBACK_DRUG_NAMES[id]) return FALLBACK_DRUG_NAMES[id];
  return fallbackMed?.name || drugId;
}

function formatKbDoseStr(val: Dose | string | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return `${val.amount} ${val.unit}${val.frequency ? ` (${val.frequency})` : ''}`;
}

export function getCleanStartDose(drugId: string): string {
  return formatKbDoseStr(drug(drugId).start);
}

export function getCleanTargetDose(drugId: string): string {
  return formatKbDoseStr(drug(drugId).target);
}

export function getRenalDose(drugId: string, bandIdx: number): string {
  const band = drug(drugId).renal[bandIdx];
  return band?.dose ? formatKbDoseStr(band.dose) : getCleanStartDose(drugId);
}

export function formatCurrentMedDose(med: CurrentMed | undefined, fallbackDrugId: string): string | undefined {
  if (med && med.dose !== undefined && String(med.dose).trim() !== '') {
    const u = med.unit ? ` ${med.unit}` : '';
    const f = med.freq ? ` (${med.freq})` : '';
    return `${med.dose}${u}${f}`;
  }
  return hasDrug(fallbackDrugId) ? getCleanStartDose(fallbackDrugId) : undefined;
}

export function formatRateUptitrateDose(med: CurrentMed | undefined, drugId: string): string {
  const target = hasDrug(drugId) ? getCleanTargetDose(drugId) : '';
  const maxD = hasDrug(drugId) ? drug(drugId).titration?.maxDose : undefined;
  const cur = med?.dose !== undefined ? `từ liều hiện tại ${med.dose}${med.unit ? ` ${med.unit}` : ''} ` : '';
  return `Tăng liều chuẩn độ ${cur}hướng tới liều đích ${target}${maxD ? ` (tối đa ${maxD})` : ''}`;
}

export function getAcuteIvDose(drugId: 'diltiazem' | 'verapamil' | 'amiodarone' | 'digoxin' | 'esmolol'): string {
  if (drugId === 'diltiazem') {
    return `Tiêm tĩnh mạch chậm 0.25 mg/kg trong 2–5 phút, sau đó truyền tĩnh mạch duy trì 5–15 mg/giờ (khi ổn định chuyển uống ${getCleanTargetDose('diltiazem')})`;
  }
  if (drugId === 'verapamil') {
    return `Tiêm tĩnh mạch chậm 2.5–10 mg trong 5 phút (khi ổn định chuyển uống ${getCleanTargetDose('verapamil')})`;
  }
  if (drugId === 'amiodarone') {
    return 'Truyền tĩnh mạch 300 mg pha trong 250 mL Dextrose 5% qua 30–60 phút, sau đó truyền duy trì 900–1200 mg trong 24 giờ';
  }
  if (drugId === 'digoxin') {
    const amp = drug('digoxin').forms[3] ?? '0.5 mg'; // qa-allow: index - Ống tiêm tĩnh mạch Digoxin từ KB
    return `Tiêm tĩnh mạch chậm ${amp}, theo dõi đáp ứng tần số thất và điện giải đồ`;
  }
  return getCleanStartDose('esmolol');
}

export { dose };
