import type { Rule, RuleContext, CurrentMed } from '../../engine/types';
import { parseDailyDoseMg } from '../../engine/doseParser';
import { thFor, drug, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  SYSTEMIC_STEROID_IDS,
  DUAL_FORM_LACTOSE_INHALER_IDS,
  CYP3A4_SENSITIVE_INHALER_IDS,
  getInhalerProfile,
  isMedDpiDevice,
  isMedExplicitlyLactoseFreeDevice,
  findCurrentMedInSet,
  hasAnticholinergicContra,
  hasMilkProteinAllergy,
  hasWeakInspiratoryFlow,
  hasStrongCyp3a4Inhibitor,
  hasConcurrentAsthma,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  isCriticallyUnstableInpatient,
  getAsthmaInpatientAcuteState,
  getDuplicateBaselineInhalersToStop,
  getSupersededInhalersToStop,
  getLamaWarnings,
} from './helpers';
import { copdInpatientAbxRules } from './rules.inpatient.abx';

const METHYLPRED_SET = new Set<string>(['methylprednisolone', 'medrol', 'solumedrol']);
const PREDNISOLONE_SET = new Set<string>(['prednisolone', 'prednisone']);

function computePrednisoneEquivalentDailyMg(med: CurrentMed | undefined): number | undefined {
  if (!med) return undefined;
  const rawDailyMg = parseDailyDoseMg(med);
  if (rawDailyMg === undefined) return undefined;
  const id = (med.drugId || '').trim().toLowerCase();
  if (METHYLPRED_SET.has(id)) {
    return rawDailyMg * 1.25; // qa-allow: unit-conversion - quy đổi Methylprednisolone 4 mg = Prednisone 5 mg (×1.25)
  }
  if (id === 'hydrocortisone' || id === 'solucortef' || id === 'solu_cortef') {
    return rawDailyMg * 0.25; // qa-allow: unit-conversion - quy đổi Hydrocortisone 20 mg = Prednisone 5 mg (×0.25)
  }
  if (id === 'dexamethasone' || id === 'decadron') {
    return rawDailyMg * 6.67; // qa-allow: unit-conversion - quy đổi Dexamethasone 0.75 mg = Prednisone 5 mg (×6.67)
  }
  return rawDailyMg;
}

function getInpatientContinuedLabds(ctx: RuleContext): CurrentMed[] {
  if (!isAcuteExacerbation(ctx)) return [];
  if (hasOutpatientAcuteRespiratoryFailure(ctx) || isCriticallyUnstableInpatient(ctx)) return [];

  const dupStopped = new Set(
    getDuplicateBaselineInhalersToStop(ctx)
      .map((d) => d.med.drugId?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id))
  );
  const supStopped = new Set(
    getSupersededInhalersToStop(ctx)
      .map((s) => s.med.drugId?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id))
  );

  const avoidDpi = hasMilkProteinAllergy(ctx) || hasWeakInspiratoryFlow(ctx);
  const hasCyp3a4Inh = hasStrongCyp3a4Inhibitor(ctx);

  const retained: CurrentMed[] = [];
  const seen = new Set<string>();
  for (const med of ctx.normalized.currentMeds) {
    const rawId = med.drugId?.trim().toLowerCase();
    if (!rawId || seen.has(rawId) || dupStopped.has(rawId) || supStopped.has(rawId)) continue;
    const prof = getInhalerProfile(rawId);
    if (!prof || (!prof.lama && !prof.laba)) continue;
    if (prof.lama && hasAnticholinergicContra(ctx)) continue;
    if (avoidDpi && isMedDpiDevice(med)) continue;
    if (hasCyp3a4Inh && CYP3A4_SENSITIVE_INHALER_IDS.has(rawId)) continue;
    if (hasConcurrentAsthma(ctx) && !prof.ics && ctx.normalized.selectedModules.includes('asthma')) continue;
    retained.push(med);
    seen.add(rawId);
  }
  return retained;
}

function makeInpatientContinueLabdRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.inpatient.continue_maintenance_labd'
        : `copd.inpatient.continue_maintenance_labd_${slotIndex}`,
    module: 'copd',
    nameVi: 'Duy trì thuốc giãn phế quản tác dụng kéo dài nền tảng ngay trong đợt cấp',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.exac_continue_labd', 'byt.copd.2026.discharge_checklist'],
    when: (ctx) => getInpatientContinuedLabds(ctx).length > slotIndex,
    produce: (ctx) => {
      const med = getInpatientContinuedLabds(ctx)[slotIndex]!;
      const rawId = (med.drugId || '').trim().toLowerCase();
      const prof = getInhalerProfile(med.drugId)!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      const warnings = prof.lama ? getLamaWarnings(ctx, med.drugId) : [];
      if (
        (hasMilkProteinAllergy(ctx) || hasWeakInspiratoryFlow(ctx)) &&
        DUAL_FORM_LACTOSE_INHALER_IDS.has(rawId) &&
        !isMedExplicitlyLactoseFreeDevice(med)
      ) {
        warnings.unshift(
          'Bệnh nhân có dị ứng đạm sữa / lưu lượng hít yếu: Chỉ tiếp tục dùng nếu là dạng phun sương hạt mịn không chứa lactose (Respimat) hoặc bình xịt pMDI + buồng đệm (Rapihaler/Evohaler/Foster pMDI); tuyệt đối KHÔNG dùng dạng bột khô DPI (HandiHaler, Turbuhaler, Accuhaler, Nexthaler).'
        );
      }
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_inpatient_continue_labd'
            : `rec_copd_inpatient_continue_labd_${slotIndex}`,
        module: 'copd',
        tier: 'Thuốc nền tảng duy trì trong đợt cấp',
        tierOrder: 3,
        action: 'CONTINUE',
        drugId: med.drugId,
        drugNameVi: medName,
        title: `Tiếp tục duy trì thuốc giãn phế quản dài hạn nền (${medName}) trong đợt cấp`,
        rationale:
          'Theo GOLD 2026 (Chapter 4, PDF p. 114), người bệnh đang điều trị duy trì bằng thuốc giãn phế quản tác dụng kéo dài (LABA/LAMA ± ICS) cần được tiếp tục duy trì trong suốt đợt cấp (hoặc khởi động lại ngay khi ổn định trước xuất viện) song song với khí dung cắt cơn tác dụng ngắn.',
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: ['gold.copd.2026.exac_continue_labd', 'byt.copd.2026.discharge_checklist'],
        priority: 68,
      };
    },
  };
}

const copdInpatientSteroidContinueRules: Rule[] = [
  {
    id: 'copd.inpatient.systemic_steroid',
    module: 'copd',
    nameVi: 'Corticoid toàn thân 5 ngày trong đợt cấp COPD (điều phối đồng bộ Methylprednisolone / Prednisolone)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.exac_systemic_steroid_40mg_5d',
      'byt.copd.2026.steroid_oral_30_40mg',
      'byt.copd.2026.methylpred_iv_dose',
    ],
    when: (ctx) => isAcuteExacerbation(ctx),
    produce: (ctx) => {
      const predMin = thFor('dose_mg', 'copd.exac_steroid_min_mg');
      const predDose = thFor('dose_mg', 'copd.exac_prednisone_dose');
      const predDays = thFor('duration_days', 'copd.exac_prednisone_duration_days');
      const mpIvDose = thFor('dose_mg', 'copd.exac_methylpred_iv_min_mg');
      const mpVialsMax = thFor('doses_count', 'copd.exac_methylpred_iv_vials_max');

      const ci = ctx.normalized.customInputs || {};
      const pCi = ctx.patient.customInputs || {};
      const cannotTakeOralOrCritical =
        isCriticallyUnstableInpatient(ctx) ||
        hasOutpatientAcuteRespiratoryFailure(ctx) ||
        Boolean(ci.cannotTakeOral) ||
        Boolean(pCi.cannotTakeOral);

      const asthmaAcute = getAsthmaInpatientAcuteState(ctx);
      const mpMed = findCurrentMedInSet(ctx, METHYLPRED_SET);
      const predMed = findCurrentMedInSet(ctx, PREDNISOLONE_SET);
      const anySteroidMed = findCurrentMedInSet(ctx, SYSTEMIC_STEROID_IDS);

      const useMethylpred =
        cannotTakeOralOrCritical ||
        asthmaAcute.emitsSevereSteroidMethylpred ||
        (mpMed !== undefined && predMed === undefined);
      const targetDrugId = useMethylpred ? 'methylprednisolone' : 'prednisolone';
      const sameMed = useMethylpred ? mpMed : predMed;
      const samePredEqMg = computePrednisoneEquivalentDailyMg(sameMed);
      const anySteroidPredEqMg = computePrednisoneEquivalentDailyMg(anySteroidMed);

      let action: 'START' | 'UPTITRATE' | 'CONTINUE' | 'SWITCH' = 'START';
      let switchFrom: string | undefined;
      if (sameMed) {
        action = samePredEqMg !== undefined && samePredEqMg >= predMin ? 'CONTINUE' : 'UPTITRATE';
      } else if (anySteroidMed) {
        action = 'SWITCH';
        switchFrom = anySteroidMed.drugId;
      }

      const warnings: string[] = [
        'Theo dõi đường huyết mao mạch và điện giải đồ (Kali máu), đặc biệt khi phối hợp khí dung SABA liều lặp lại.',
      ];
      if (cannotTakeOralOrCritical) {
        warnings.unshift(
          'Bệnh nhân suy hô hấp cấp nguy kịch / rối loạn ý thức / không uống được: Bắt buộc dùng đường tiêm tĩnh mạch (Methylprednisolone TM), tuyệt đối không cho uống viên nén để phòng sặc vào đường thở.'
        );
      }
      if (anySteroidMed && (anySteroidPredEqMg === undefined || anySteroidPredEqMg < predMin)) {
        warnings.unshift(
          `Bệnh nhân đang dùng corticoid toàn thân liều nền (${anySteroidMed.name || anySteroidMed.drugId}): Sau khi kết thúc ${predDays} ngày liều đợt cấp, phải lùi về liều nền duy trì trước đó hoặc giảm liều có kiểm soát – TUYỆT ĐỐI KHÔNG ngừng đột ngột hoàn toàn để phòng suy thượng thận cấp.`
        );
      }

      const doseStr = cannotTakeOralOrCritical
        ? `Methylprednisolone ${mpIvDose} mg tiêm tĩnh mạch (1–${mpVialsMax} lọ ${mpIvDose} mg/ngày tiêm tĩnh mạch trong ${predDays} ngày; chuyển đường uống ${predMin}–${predDose} mg/ngày khi tỉnh táo và nuốt an toàn)`
        : useMethylpred
          ? `Methylprednisolone ${mpIvDose} mg tiêm tĩnh mạch (1–${mpVialsMax} lọ ${mpIvDose} mg/ngày khi khó thở nặng/không uống được) hoặc uống ${predMin}–${predDose} mg/ngày trong ${predDays} ngày`
          : `Prednisolone ${predMin}–${predDose} mg uống 1 lần buổi sáng (hoặc Methylprednisolone ${mpIvDose} mg TM nếu không uống được) trong ${predDays} ngày`;

      return {
        id: 'rec_copd_inpatient_steroid',
        module: 'copd',
        tier: 'Xử trí đợt cấp cấp cứu',
        tierOrder: 1,
        action,
        drugId: targetDrugId,
        switchFrom,
        drugNameVi: useMethylpred ? 'Methylprednisolone' : 'Prednisolone / Methylprednisolone',
        dose: doseStr,
        title:
          action === 'CONTINUE'
            ? `Tiếp tục đủ liệu trình Corticoid toàn thân đợt cấp (${useMethylpred ? 'Methylprednisolone' : 'Prednisolone'}) trong ${predDays} ngày`
            : action === 'UPTITRATE'
              ? `Tăng liều Corticoid toàn thân đợt cấp lên ${useMethylpred ? `${mpIvDose} mg TM` : `${predDose} mg`}/ngày trong ${predDays} ngày`
              : action === 'SWITCH'
                ? useMethylpred
                  ? `Chuyển sang Methylprednisolone tĩnh mạch cấp cứu (${mpIvDose} mg/ngày × ${predDays} ngày)`
                  : `Chuyển sang Prednisolone liều đợt cấp (${predMin}–${predDose} mg/ngày × ${predDays} ngày)`
                : cannotTakeOralOrCritical
                  ? `Methylprednisolone tĩnh mạch cấp cứu (${mpIvDose} mg/ngày × ${predDays} ngày)`
                  : `Corticoid toàn thân trong ${predDays} ngày (${predDose} mg prednisone tương đương/ngày)`,
        rationale: `Khuyến cáo dùng Corticosteroid toàn thân (${predDose} mg prednisone tương đương/ngày trong ${predDays} ngày) giúp rút ngắn thời gian hồi phục, cải thiện FEV₁ và oxy máu, giảm thất bại điều trị mà hạn chế độc tính tích lũy dài ngày.`,
        profileDiff: {
          INTL: `GOLD 2026 khuyến cáo prednisone ${predDose} mg tương đương/ngày trong ${predDays} ngày (ưu tiên đường uống khi tỉnh táo nuốt được, tiêm tĩnh mạch khi suy hô hấp nguy kịch/không uống được).`,
          VN: `BYT QĐ 2131/2026 quy định Prednisone/Prednisolone/Methylprednisolone uống ${predMin}–${predDose} mg/ngày buổi sáng trong ${predDays} ngày, hoặc Methylprednisolone lọ ${mpIvDose} mg tiêm tĩnh mạch 1–${mpVialsMax} lọ/ngày ở đợt cấp nặng nội trú.`,
          US: `GOLD 2026 khuyến cáo prednisone ${predDose} mg tương đương/ngày trong ${predDays} ngày.`,
        },
        warnings,
        gates: [],
        citationIds: [
          'gold.copd.2026.exac_systemic_steroid_40mg_5d',
          'byt.copd.2026.steroid_oral_30_40mg',
          'byt.copd.2026.methylpred_iv_dose',
        ],
        priority: useMethylpred ? 101 : 95,
      };
    },
  },

  makeInpatientContinueLabdRule(0),
  makeInpatientContinueLabdRule(1), // qa-allow: index - khe duy trì bình hít nền thứ 2 trong đợt cấp bộ ba mở
];

export const copdInpatientMedsRules: Rule[] = [
  ...copdInpatientSteroidContinueRules,
  ...copdInpatientAbxRules,
];
