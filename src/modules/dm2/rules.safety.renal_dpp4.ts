/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Giảm liều DPP-4i / Gliclazide theo eGFR & Tương tác CYP3A4
 * Phân quyền: Agent F4
 */

import type { Rule, RuleContext } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasHepaticImpairment,
  hasHf,
  hasPancreatitis,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isIcuSetting,
  isOnDialysis,
  isPregnant,
  isTakingCanonical,
  isTakingStrongCyp3a4Inhibitor,
  parseMedDailyDoseMg,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';
import { isFdcAlreadyPermanentlyStopped } from './rules.safety.renal';

function isInpatientDpp4Held(ctx: RuleContext): boolean {
  if (ctx.settings.setting !== 'inpatient') return false;
  const crisis = evaluateHyperglycemicCrisis(ctx);
  const eating = ctx.patient.customInputs?.inpatientEating;
  return (
    isIcuSetting(ctx) ||
    eating === 'npo' ||
    crisis.isConfirmedCrisis ||
    crisis.isSuspectedUnconfirmed ||
    crisis.isIsolatedKetonemia
  );
}

export const dm2SafetyRenalDpp4Rules: Rule[] = [
  {
    id: 'dm2.safety.sitagliptin_renal_reduce',
    module: 'dm2',
    nameVi: 'Giảm liều Sitagliptin theo mức lọc cầu thận giai đoạn G3b đến G5',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || hasPancreatitis(ctx) || hasPlannedSurgery(ctx) || willStartOrContinueGlp1(ctx) || isInpatientDpp4Held(ctx)) {
        return false;
      }
      if (!isTakingCanonical(ctx, 'sitagliptin')) return false;
      const med = findActiveMedByCanonical(ctx, 'sitagliptin');
      if (isFdcAlreadyPermanentlyStopped(ctx, med)) return false;
      const egfr = getEffectiveEgfr(ctx);
      if (egfr === undefined || egfr >= thFor('egfr', 'dm2.metformin.egfr_caution')) return false;
      const maxAllowed = egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')
        ? thFor('dose_mg', 'dm2.sitagliptin.egfr_lt30_dose')
        : thFor('dose_mg', 'dm2.sitagliptin.egfr_30_44_dose');
      const dailyMg = parseMedDailyDoseMg(med, 'sitagliptin');
      return dailyMg === undefined || dailyMg > maxAllowed;
    },
    produce: (ctx) => {
      const egfr = getEffectiveEgfr(ctx)!;
      const maxDose = egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')
        ? thFor('dose_mg', 'dm2.sitagliptin.egfr_lt30_dose')
        : thFor('dose_mg', 'dm2.sitagliptin.egfr_30_44_dose');
      const med = findActiveMedByCanonical(ctx, 'sitagliptin');
      const target = resolveTargetRecDrug('sitagliptin', med);
      return {
        id: 'rec_dm2_sitagliptin_renal_reduce',
        module: 'dm2',
        tier: 'Hiệu chỉnh liều theo Chức năng thận & Tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose: `Giảm liều Sitagliptin tối đa còn ${maxDose} mg x 1 lần/ngày (Uống)`,
        title: `Giảm liều ${target.drugNameVi} xuống tối đa ${maxDose} mg/ngày theo chức năng thận`,
        rationale:
          `Nhãn FDA Januvia: Sitagliptin thải trừ chủ yếu qua thận; khi ${isOnDialysis(ctx) ? 'đang lọc máu' : `eGFR = ${egfr.toFixed(0)} mL/phút/1.73m²`}, bắt buộc giới hạn liều tối đa ${maxDose} mg/ngày (hoặc đổi sang Linagliptin 5 mg không cần chỉnh liều thận).`,
        gates: [],
        citationIds: ['fda.sitagliptin.renal_bands'],
        priority: 92
      };
    },
    citationIds: ['fda.sitagliptin.renal_bands']
  },
  {
    id: 'dm2.safety.saxagliptin_renal_cyp3a4_reduce',
    module: 'dm2',
    nameVi: 'Giảm liều Saxagliptin khi suy thận vừa–nặng hoặc dùng kèm chất ức chế mạnh CYP3A4/5',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || hasPancreatitis(ctx) || hasHf(ctx) || hasPlannedSurgery(ctx) || willStartOrContinueGlp1(ctx) || isInpatientDpp4Held(ctx)) {
        return false;
      }
      if (!isTakingCanonical(ctx, 'saxagliptin')) return false;
      const med = findActiveMedByCanonical(ctx, 'saxagliptin');
      if (isFdcAlreadyPermanentlyStopped(ctx, med)) return false;
      const egfr = getEffectiveEgfr(ctx);
      const hasRenalTrigger = egfr !== undefined && egfr <= thFor('egfr', 'dm2.metformin.egfr_caution');
      const hasCypTrigger = isTakingStrongCyp3a4Inhibitor(ctx);
      if (!hasRenalTrigger && !hasCypTrigger) return false;
      const maxAllowed = thFor('dose_mg', 'dm2.saxagliptin.cyp3a4_max_dose');
      const dailyMg = parseMedDailyDoseMg(med, 'saxagliptin');
      return dailyMg === undefined || dailyMg > maxAllowed;
    },
    produce: (ctx) => {
      const maxDose = thFor('dose_mg', 'dm2.saxagliptin.cyp3a4_max_dose');
      const hasCyp = isTakingStrongCyp3a4Inhibitor(ctx);
      const med = findActiveMedByCanonical(ctx, 'saxagliptin');
      const target = resolveTargetRecDrug('saxagliptin', med);
      return {
        id: 'rec_dm2_saxagliptin_reduce',
        module: 'dm2',
        tier: 'Hiệu chỉnh liều theo Chức năng thận & Tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose: `Giảm liều Saxagliptin tối đa còn ${maxDose} mg x 1 lần/ngày (Uống)`,
        title: hasCyp
          ? `Giảm liều ${target.drugNameVi} xuống ${maxDose} mg/ngày do tương tác thuốc ức chế mạnh CYP3A4/5`
          : `Giảm liều ${target.drugNameVi} xuống ${maxDose} mg/ngày theo chức năng thận`,
        rationale:
          `Nhãn FDA Onglyza: Giới hạn liều Saxagliptin tối đa ${maxDose} mg x 1 lần/ngày khi dùng đồng thời chất ức chế mạnh CYP3A4/5 (Ketoconazole, Clarithromycin, Itraconazole, Ritonavir...) hoặc khi eGFR từ ${thFor('egfr', 'dm2.metformin.egfr_caution')} mL/phút/1.73m² trở xuống.`,
        gates: [],
        citationIds: ['fda.saxagliptin.cyp3a4_2_5mg', 'fda.saxagliptin.renal_dose'],
        priority: 92
      };
    },
    citationIds: ['fda.saxagliptin.cyp3a4_2_5mg', 'fda.saxagliptin.renal_dose']
  },
  {
    id: 'dm2.safety.vildagliptin_renal_reduce',
    module: 'dm2',
    nameVi: 'Giảm liều Vildagliptin còn một lần mỗi ngày khi suy thận vừa hoặc nặng',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || hasPancreatitis(ctx) || hasHepaticImpairment(ctx) || hasPlannedSurgery(ctx) || willStartOrContinueGlp1(ctx) || isInpatientDpp4Held(ctx)) {
        return false;
      }
      if (!isTakingCanonical(ctx, 'vildagliptin')) return false;
      const med = findActiveMedByCanonical(ctx, 'vildagliptin');
      if (isFdcAlreadyPermanentlyStopped(ctx, med)) return false;
      const egfr = getEffectiveEgfr(ctx);
      if (egfr === undefined || egfr >= thFor('egfr', 'dm2.vildagliptin.egfr_reduce_cutoff')) return false;
      const maxAllowed = thFor('dose_mg', 'dm2.vildagliptin.renal_reduced_dose');
      const dailyMg = parseMedDailyDoseMg(med, 'vildagliptin');
      return dailyMg === undefined || dailyMg > maxAllowed;
    },
    produce: (ctx) => {
      const maxDose = thFor('dose_mg', 'dm2.vildagliptin.renal_reduced_dose');
      const med = findActiveMedByCanonical(ctx, 'vildagliptin');
      const target = resolveTargetRecDrug('vildagliptin', med);
      return {
        id: 'rec_dm2_vildagliptin_renal_reduce',
        module: 'dm2',
        tier: 'Hiệu chỉnh liều theo Chức năng thận & Tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose: `Giảm Vildagliptin còn ${maxDose} mg x 1 lần/ngày (Uống)`,
        title: `Giảm liều ${target.drugNameVi} xuống ${maxDose} mg x 1 lần/ngày do suy thận vừa/nặng`,
        rationale:
          `EMA SmPC Galvus: Ở bệnh nhân suy thận vừa hoặc nặng (eGFR dưới ${thFor('egfr', 'dm2.vildagliptin.egfr_reduce_cutoff')} mL/phút/1.73m² hoặc bệnh thận giai đoạn cuối), liều khuyến cáo của Vildagliptin là ${maxDose} mg x 1 lần/ngày.`,
        gates: [],
        citationIds: ['ema.vildagliptin.renal_50mg_od'],
        priority: 92
      };
    },
    citationIds: ['ema.vildagliptin.renal_50mg_od']
  },
  {
    id: 'dm2.safety.gliclazide_renal_reduce',
    module: 'dm2',
    nameVi: 'Giảm liều Gliclazide MR khi suy giảm mức lọc cầu thận giai đoạn G3',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || hasHepaticImpairment(ctx) || hasPlannedSurgery(ctx) || isOnDialysis(ctx)) {
        return false;
      }
      if (!isTakingCanonical(ctx, 'gliclazide')) return false;
      const egfr = getEffectiveEgfr(ctx);
      if (egfr === undefined) return false;
      if (egfr < thFor('egfr', 'dm2.su_agi.egfr_contra') || egfr >= thFor('egfr', 'dm2.ckd.egfr_threshold')) return false;
      const maxAllowed = thFor('dose_mg', 'dm2.gliclazide.renal_moderate_max');
      const dailyMg = parseMedDailyDoseMg(findActiveMedByCanonical(ctx, 'gliclazide'), 'gliclazide');
      return dailyMg === undefined || dailyMg > maxAllowed;
    },
    produce: (ctx) => {
      const egfr = getEffectiveEgfr(ctx)!;
      const maxDose = thFor('dose_mg', 'dm2.gliclazide.renal_moderate_max');
      const med = findActiveMedByCanonical(ctx, 'gliclazide');
      const target = resolveTargetRecDrug('gliclazide', med);
      return {
        id: 'rec_dm2_gliclazide_renal_reduce',
        module: 'dm2',
        tier: 'Hiệu chỉnh liều theo Chức năng thận & Tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        dose: `Giới hạn liều tối đa không quá ${maxDose} mg x 1 lần/ngày`,
        title: `Giới hạn / Giảm liều ${target.drugNameVi} tối đa ${maxDose} mg/ngày do CKD G3 (eGFR ${egfr.toFixed(0)} mL/phút/1.73m²)`,
        rationale:
          `KDIGO 2022 & EMA SmPC: Khi eGFR giảm dưới ${thFor('egfr', 'dm2.ckd.egfr_threshold')} mL/phút/1.73m², nguy cơ hạ đường huyết do Sulfonylurea tăng cao; giới hạn liều Gliclazide MR không vượt quá ${maxDose} mg/ngày (cần xác minh hàm lượng viên đang dùng nếu chưa rõ liều).`,
        gates: [],
        citationIds: ['kdigo.dm2.2022.su_avoid_low_egfr', 'ema.gliclazide.titration_60_120'],
        priority: 91
      };
    },
    citationIds: ['kdigo.dm2.2022.su_avoid_low_egfr', 'ema.gliclazide.titration_60_120']
  }
];
