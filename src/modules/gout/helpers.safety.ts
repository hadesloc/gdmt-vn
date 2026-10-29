/**
 * GDMT-VN Gout Module - Safety Predicates, Allergy/Hepatic/Renal Gates & Colchicine Safety
 * Phân quyền: Agent K
 */

import type { RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  AZATHIOPRINE_DRUG_IDS,
  STRONG_CYP3A4_PGP_INHIBITORS,
  MODERATE_CYP3A4_PGP_INHIBITORS,
  STATIN_DRUG_IDS,
  FIBRATE_DRUG_IDS,
  ANTICOAGULANT_DRUG_IDS,
  VKA_DRUG_IDS,
  HEPATOTOXIC_CO_MED_IDS,
  RASI_ARNI_DRUG_IDS,
  LOOP_DIURETIC_DRUG_IDS,
  THIAZIDE_DRUG_IDS,
  NSAID_DRUG_IDS,
  isOnMed
} from './helpers.meds';
import {
  getAllergyList,
  isPregnant,
  isBreastfeeding,
  hasHepaticImpairment,
  hasSevereHepaticImpairment,
  hasTophi,
  hasUrolithiasis,
  hasSecondaryHyperuricemiaOrTls,
  hasActiveMajorBleeding,
  hasPriorGiUlcerOrBleedHistory,
  isOnDialysis,
  hasEstablishedCvd
} from './helpers';

export function getHlaB5801Status(ctx: RuleContext): 'positive' | 'negative' | 'not_done' {
  const raw = ctx.normalized.customInputs?.hlab5801 ?? ctx.normalized.customInputs?.hlaB5801;
  if (raw === 'positive' || raw === true) return 'positive';
  if (raw === 'negative' || raw === false) return 'negative';
  if (ctx.normalized.conditions?.hlaB5801Positive) return 'positive';
  const hit = getAllergyList(ctx).some((a) => a.toLowerCase().includes('58:01') || a.toLowerCase().includes('5801'));
  return hit ? 'positive' : 'not_done';
}

export function isHighRiskHlaB5801Ancestry(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs;
  return Boolean(
    ctx.settings.profile === 'VN' ||
      ci?.highRiskHlaB5801Ancestry === true ||
      ci?.southeastAsianDescent === true ||
      ci?.africanAmericanDescent === true ||
      ci?.africanAmerican === true ||
      ci?.hanChinese === true ||
      ci?.korean === true ||
      ci?.thai === true
  );
}

export function isAllopurinolIntolerant(ctx: RuleContext): boolean {
  if (ctx.normalized.customInputs?.allopurinolIntolerant === true) return true;
  return getAllergyList(ctx).some((a) => a.toLowerCase().includes('allopurinol') || a.toLowerCase().includes('zyloric'));
}

export function isFebuxostatIntolerant(ctx: RuleContext): boolean {
  if (ctx.normalized.customInputs?.febuxostatIntolerant === true) return true;
  return getAllergyList(ctx).some((a) => a.toLowerCase().includes('febuxostat') || a.toLowerCase().includes('uloric'));
}

export function isColchicineAllergicOrIntolerant(ctx: RuleContext): boolean {
  if (ctx.normalized.customInputs?.colchicineIntolerant === true) return true;
  return getAllergyList(ctx).some((a) => a.toLowerCase().includes('colchicin') || a.toLowerCase().includes('colcrys'));
}

export function isProbenecidAllergic(ctx: RuleContext): boolean {
  return getAllergyList(ctx).some((a) => a.toLowerCase().includes('probenecid'));
}

export function isBenzbromaroneAllergic(ctx: RuleContext): boolean {
  return getAllergyList(ctx).some((a) => a.toLowerCase().includes('benzbromaron') || a.toLowerCase().includes('desuric'));
}

export function hasSulfonamideAllergy(ctx: RuleContext): boolean {
  if (ctx.normalized.customInputs?.sulfonamideAllergy === true || ctx.normalized.conditions?.sulfonamideAllergy) {
    return true;
  }
  return getAllergyList(ctx).some((a) => {
    const s = a.toLowerCase();
    return s.includes('sulfa') || s.includes('sulfonamid') || s.includes('cotrimoxazol') || s.includes('bactrim');
  });
}

export function hasNsaidAllergyOrAerd(ctx: RuleContext, specificDrugId?: string): boolean {
  const conds = ctx.normalized.conditions as Record<string, unknown> | undefined;
  const patConds = (ctx.patient as unknown as { conditions?: Record<string, unknown> })?.conditions;
  const ci = ctx.normalized.customInputs;
  if (
    hasCondition(ctx, 'aerd') ||
    Boolean(conds?.aerd) ||
    Boolean(patConds?.aerd) ||
    Boolean(conds?.samterTriad) ||
    Boolean(conds?.nsaidExacerbatedRespiratoryDisease) ||
    Boolean(conds?.aspirinExacerbatedRespiratoryDisease) ||
    Boolean(conds?.nsaidHypersensitivity) ||
    Boolean(conds?.aspirinHypersensitivity) ||
    ci?.aerd === true ||
    ci?.nsaidAllergyOrAerd === true ||
    ci?.nsaidHypersensitivity === true ||
    ci?.aspirinHypersensitivity === true
  ) {
    return true;
  }
  const spec = (specificDrugId || '').toLowerCase();
  return getAllergyList(ctx).some((a) => {
    const s = a.toLowerCase();
    if (
      s.includes('nsaid') ||
      s.includes('aspirin') ||
      s.includes('salicylat') ||
      s.includes('cox-2') ||
      s.includes('cox2') ||
      s.includes('aerd') ||
      s.includes('samter')
    ) {
      return true;
    }
    if (spec && s.includes(spec)) return true;
    if (!spec && NSAID_DRUG_IDS.some((id) => s.includes(id))) return true;
    return false;
  });
}

export function isTakingAzathioprine(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.customInputs?.takingAzathioprine || isOnMed(ctx, AZATHIOPRINE_DRUG_IDS));
}

export function isTakingStrongCyp3a4OrPgp(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.customInputs?.cyp3a4PgpInhibitor || isOnMed(ctx, STRONG_CYP3A4_PGP_INHIBITORS));
}

export function isTakingModerateCyp3a4(ctx: RuleContext): boolean {
  return Boolean(ctx.normalized.customInputs?.moderateCyp3a4Inhibitor || isOnMed(ctx, MODERATE_CYP3A4_PGP_INHIBITORS));
}

export function isTakingStatinOrFibrate(ctx: RuleContext): boolean {
  return isOnMed(ctx, STATIN_DRUG_IDS) || isOnMed(ctx, FIBRATE_DRUG_IDS);
}

export function isCoModuleLikelyStartingStatin(ctx: RuleContext): boolean {
  if (isOnDialysis(ctx)) return false;
  const mods = ctx.normalized.selectedModules || [];
  const age = need(ctx, 'age');
  const ckdStatinAge = 50; // qa-allow: index - mốc tuổi KDIGO 2024 khởi trị statin ở CKD
  const dmStatinAge = 40; // qa-allow: index - mốc tuổi ADA khởi trị statin ở ĐTĐ
  if (mods.includes('lipid')) return true;
  if (mods.includes('ckd') && ((age !== undefined && age >= ckdStatinAge) || hasEstablishedCvd(ctx) || hasCondition(ctx, 'dm'))) {
    return true;
  }
  if (mods.includes('dm2') && ((age !== undefined && age >= dmStatinAge) || hasEstablishedCvd(ctx))) {
    return true;
  }
  return false;
}

export function isOnAnticoagulant(ctx: RuleContext): boolean {
  return Boolean(
    hasCondition(ctx, 'onAnticoagulant') ||
      ctx.normalized.customInputs?.onAnticoagulant ||
      isOnMed(ctx, ANTICOAGULANT_DRUG_IDS)
  );
}

export function hasPepticUlcerOrBleed(ctx: RuleContext): boolean {
  return hasActiveMajorBleeding(ctx) || hasPriorGiUlcerOrBleedHistory(ctx);
}

export function isTripleWhammyRisk(ctx: RuleContext): boolean {
  const onRasi = isOnMed(ctx, RASI_ARNI_DRUG_IDS);
  const onDiuretic =
    isOnMed(ctx, LOOP_DIURETIC_DRUG_IDS) ||
    isOnMed(ctx, THIAZIDE_DRUG_IDS) ||
    isOnMed(ctx, ['spironolactone', 'eplerenone']) ||
    Boolean(ctx.normalized.customInputs?.takingThiazide || ctx.normalized.customInputs?.takingThiazideOrLoop);
  return onRasi && onDiuretic;
}

export function hasUncontrolledBpForEtoricoxib(ctx: RuleContext): boolean {
  const sbp = need(ctx, 'sbp');
  const dbp = need(ctx, 'dbp');
  const sbpMax = thFor('sbp', 'gout.etoricoxib.sbp_contra_max');
  const dbpMax = thFor('dbp', 'gout.etoricoxib.dbp_contra_max');
  return Boolean((sbp !== undefined && sbp > sbpMax) || (dbp !== undefined && dbp > dbpMax));
}

export function hasDuplicateXoi(ctx: RuleContext): boolean {
  return isOnMed(ctx, ['allopurinol']) && isOnMed(ctx, ['febuxostat']);
}

export function getDuplicateXoiDrugToStop(ctx: RuleContext): 'allopurinol' | 'febuxostat' {
  return getHlaB5801Status(ctx) === 'positive' || isAllopurinolIntolerant(ctx) ? 'allopurinol' : 'febuxostat';
}

export function isAllopurinolBeingStopped(ctx: RuleContext): boolean {
  if (!isOnMed(ctx, ['allopurinol'])) return false;
  return Boolean(
    isPregnant(ctx) ||
      getHlaB5801Status(ctx) === 'positive' ||
      isAllopurinolIntolerant(ctx) ||
      isTakingAzathioprine(ctx) ||
      (hasDuplicateXoi(ctx) && getDuplicateXoiDrugToStop(ctx) === 'allopurinol')
  );
}

export function isFebuxostatBeingStopped(ctx: RuleContext): boolean {
  if (!isOnMed(ctx, ['febuxostat'])) return false;
  return Boolean(
    isPregnant(ctx) ||
      isBreastfeeding(ctx) ||
      isFebuxostatIntolerant(ctx) ||
      isTakingAzathioprine(ctx) ||
      hasSecondaryHyperuricemiaOrTls(ctx) ||
      (hasDuplicateXoi(ctx) && getDuplicateXoiDrugToStop(ctx) === 'febuxostat')
  );
}

export function isProbenecidContraindicated(ctx: RuleContext): boolean {
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const age = need(ctx, 'age');
  const egfrMin = thFor('egfr', 'gout.probenecid.egfr_contra_min');
  const crclMin = thFor('crcl', 'gout.probenecid.crcl_contra_min');
  const vnAgeMax = thFor('age', 'gout.uricosuric.vn_elderly_age_min');
  const overprodOrTls = Boolean(ctx.normalized.customInputs?.uricAcidOverproduction || hasSecondaryHyperuricemiaOrTls(ctx));
  const vnContra = ctx.settings.profile === 'VN' && Boolean(hasTophi(ctx) || (age !== undefined && age >= vnAgeMax));
  return Boolean(
    isPregnant(ctx) ||
      isProbenecidAllergic(ctx) ||
      isOnDialysis(ctx) ||
      hasUrolithiasis(ctx) ||
      overprodOrTls ||
      isOnMed(ctx, ['ketorolac', 'methotrexate']) ||
      (egfr !== undefined && egfr < egfrMin) ||
      (crcl !== undefined && crcl < crclMin) ||
      vnContra
  );
}

export function isBenzbromaroneContraindicated(ctx: RuleContext): boolean {
  const egfr = need(ctx, 'egfr');
  const age = need(ctx, 'age');
  const egfrMin = thFor('egfr', 'gout.benzbromarone.egfr_contra_min');
  const vnAgeMax = thFor('age', 'gout.uricosuric.vn_elderly_age_min');
  const overprodOrTls = Boolean(ctx.normalized.customInputs?.uricAcidOverproduction || hasSecondaryHyperuricemiaOrTls(ctx));
  const vnContra = ctx.settings.profile === 'VN' && Boolean(hasTophi(ctx) || (age !== undefined && age >= vnAgeMax));
  return Boolean(
    isPregnant(ctx) ||
      isBreastfeeding(ctx) ||
      isBenzbromaroneAllergic(ctx) ||
      isOnDialysis(ctx) ||
      hasUrolithiasis(ctx) ||
      overprodOrTls ||
      hasHepaticImpairment(ctx) ||
      isOnMed(ctx, VKA_DRUG_IDS) ||
      isOnMed(ctx, HEPATOTOXIC_CO_MED_IDS) ||
      (egfr !== undefined && egfr < egfrMin) ||
      vnContra
  );
}

export function hasActiveValidUlt(ctx: RuleContext): boolean {
  if (isOnMed(ctx, ['allopurinol']) && !isAllopurinolBeingStopped(ctx)) return true;
  if (isOnMed(ctx, ['febuxostat']) && !isFebuxostatBeingStopped(ctx)) return true;
  if (isOnMed(ctx, ['probenecid']) && !isProbenecidContraindicated(ctx)) return true;
  if (isOnMed(ctx, ['benzbromarone']) && !isBenzbromaroneContraindicated(ctx) && ctx.settings.profile !== 'US') return true;
  return false;
}

export interface ColchicineSafetyCheck {
  contraindicated: boolean;
  avoidFlare: boolean;
  avoidProphylaxis: boolean;
  needsReducedDose: boolean;
  statinWarning: boolean;
  alreadyOnProphylaxis: boolean;
  reasonVi?: string;
  citationIds: string[];
}

export function checkColchicineSafety(ctx: RuleContext): ColchicineSafetyCheck {
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const hasLiver = hasHepaticImpairment(ctx);
  const severeLiver = hasSevereHepaticImpairment(ctx);
  const strongInhib = isTakingStrongCyp3a4OrPgp(ctx);
  const modInhib = isTakingModerateCyp3a4(ctx);
  const onStatinOrFibrate = isTakingStatinOrFibrate(ctx);
  const coModuleStatin = isCoModuleLikelyStartingStatin(ctx);
  const alreadyOnProphylaxis = isOnMed(ctx, ['colchicine']);
  const egfrDialysisMin = thFor('egfr', 'gout.colchicine.egfr_dialysis_min');
  const egfrSevereMin = thFor('egfr', 'gout.colchicine.egfr_severe_renal_min');
  const egfrCkdMin = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');

  if (isColchicineAllergicOrIntolerant(ctx)) {
    return {
      contraindicated: true,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: false,
      statinWarning: false,
      alreadyOnProphylaxis,
      reasonVi: 'Tiền sử dị ứng hoặc không dung nạp Colchicine: Chống chỉ định sử dụng',
      citationIds: ['eular.gout.2016.colchicine_nsaid_contra']
    };
  }
  if (isPregnant(ctx)) {
    return {
      contraindicated: true,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: false,
      statinWarning: false,
      alreadyOnProphylaxis,
      reasonVi: 'Phụ nữ đang mang thai: Tránh dùng colchicine điều trị gút',
      citationIds: ['fda.colchicine.pregnancy']
    };
  }
  if (strongInhib) {
    return {
      contraindicated: true,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: false,
      statinWarning: false,
      alreadyOnProphylaxis,
      reasonVi: 'Đang dùng chất ức chế mạnh CYP3A4 hoặc P-gp (Nirmatrelvir/ritonavir, Clarithromycin, Cyclosporine...): Chống chỉ định tuyệt đối do nguy cơ ngộ độc tử vong',
      citationIds: ['fda.colchicine.renal_and_cyp3a4', 'fda.colchicine.cyp3a4_agents', 'eular.gout.2016.colchicine_nsaid_contra']
    };
  }
  if (isOnDialysis(ctx) || (egfr !== undefined && egfr < egfrDialysisMin) || (crcl !== undefined && crcl < egfrDialysisMin)) {
    return {
      contraindicated: true,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: false,
      statinWarning: false,
      alreadyOnProphylaxis,
      reasonVi: `Suy thận giai đoạn cuối (eGFR < ${egfrDialysisMin} mL/phút hoặc lọc máu): Chống chỉ định/tránh dùng colchicine`,
      citationIds: ['byt.ckd.2024.gout_flare_table22', 'eular.gout.2016.colchicine_nsaid_contra']
    };
  }

  const hasRenalImpairment = (egfr !== undefined && egfr < egfrCkdMin) || (crcl !== undefined && crcl < egfrCkdMin);
  if (modInhib && (hasRenalImpairment || hasLiver)) {
    return {
      contraindicated: true,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: false,
      statinWarning: false,
      alreadyOnProphylaxis,
      reasonVi: 'Đang dùng thuốc ức chế vừa CYP3A4/P-gp kèm suy thận hoặc bệnh gan: Chống chỉ định colchicine',
      citationIds: ['fda.colchicine.renal_and_cyp3a4', 'fda.colchicine.moderate_cyp3a4']
    };
  }
  if (severeLiver) {
    return {
      contraindicated: true,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: false,
      statinWarning: onStatinOrFibrate,
      alreadyOnProphylaxis,
      reasonVi: 'Suy gan nặng / xơ gan mất bù (Child-Pugh C): Giảm mạnh thanh thải colchicine gây tích lũy độc tính tủy xương – cơ, tránh dùng colchicine',
      citationIds: ['fda.colchicine.hepatic_impairment_dosing', 'fda.colchicine.flare_not_rec_prophylaxis_hepatic']
    };
  }
  if ((egfr !== undefined && egfr < egfrSevereMin) || (crcl !== undefined && crcl < egfrSevereMin)) {
    if (onStatinOrFibrate || coModuleStatin || hasLiver) {
      return {
        contraindicated: true,
        avoidFlare: true,
        avoidProphylaxis: true,
        needsReducedDose: false,
        statinWarning: true,
        alreadyOnProphylaxis,
        reasonVi: `Suy thận nặng (GFR < ${egfrSevereMin} mL/phút) kèm dùng statin/fibrate hoặc bệnh gan: Chống chỉ định/tránh dùng colchicine`,
        citationIds: ['eular.gout.2016.colchicine_gfr30_avoid', 'fda.colchicine.statin_fibrate_myopathy']
      };
    }
    return {
      contraindicated: false,
      avoidFlare: true,
      avoidProphylaxis: ctx.settings.profile !== 'US',
      needsReducedDose: true,
      statinWarning: false,
      alreadyOnProphylaxis,
      reasonVi: `Suy thận nặng (GFR < ${egfrSevereMin} mL/phút): EULAR 2016 tránh dùng colchicine; FDA giảm liều dự phòng khởi đầu 0.3 mg/ngày`,
      citationIds: ['eular.gout.2016.colchicine_gfr30_avoid', 'fda.colchicine.severe_renal_prophylaxis']
    };
  }
  if ((onStatinOrFibrate || coModuleStatin) && (hasRenalImpairment || hasLiver)) {
    return {
      contraindicated: false,
      avoidFlare: true,
      avoidProphylaxis: true,
      needsReducedDose: true,
      statinWarning: true,
      alreadyOnProphylaxis,
      reasonVi: 'Đang dùng hoặc đồng khởi trị Statin/Fibrate trên nền CKD hoặc bệnh gan: Tránh dùng colchicine để phòng tiêu cơ vân cấp',
      citationIds: ['fda.colchicine.statin_fibrate_myopathy', 'eular.gout.2016.flare_prophylaxis']
    };
  }
  if (alreadyOnProphylaxis && (hasRenalImpairment || hasLiver || modInhib)) {
    return {
      contraindicated: false,
      avoidFlare: true,
      avoidProphylaxis: false,
      needsReducedDose: true,
      statinWarning: onStatinOrFibrate,
      alreadyOnProphylaxis: true,
      reasonVi:
        'Bệnh nhân đang uống sẵn Colchicine dự phòng kèm suy thận, bệnh gan hoặc thuốc ức chế CYP3A4: Nhãn FDA Colcrys (Mục 2.4–2.6) khuyến cáo KHÔNG nạp liều cắt cơn bằng Colchicine; chuyển thuốc cắt cơn sang Corticosteroid hoặc NSAID phù hợp',
      citationIds: [
        'fda.colchicine.flare_not_rec_prophylaxis_cyp3a4',
        'fda.colchicine.flare_not_rec_prophylaxis_renal',
        'fda.colchicine.flare_not_rec_prophylaxis_hepatic'
      ]
    };
  }
  if (modInhib) {
    return {
      contraindicated: false,
      avoidFlare: false,
      avoidProphylaxis: false,
      needsReducedDose: true,
      statinWarning: onStatinOrFibrate,
      alreadyOnProphylaxis,
      reasonVi: 'Đang dùng thuốc ức chế vừa CYP3A4/P-gp trên nền thận–gan bình thường: Bắt buộc giảm liều colchicine',
      citationIds: ['fda.colchicine.moderate_cyp3a4']
    };
  }
  if (hasLiver) {
    return {
      contraindicated: false,
      avoidFlare: false,
      avoidProphylaxis: false,
      needsReducedDose: true,
      statinWarning: onStatinOrFibrate,
      alreadyOnProphylaxis,
      reasonVi: 'Bệnh gan mạn tính (Child-Pugh A/B): Cần giảm liều dự phòng và theo dõi sát độc tính tiêu hóa – cơ – tủy xương',
      citationIds: ['fda.colchicine.hepatic_impairment_dosing']
    };
  }
  return {
    contraindicated: false,
    avoidFlare: false,
    avoidProphylaxis: false,
    needsReducedDose: false,
    statinWarning: onStatinOrFibrate,
    alreadyOnProphylaxis,
    citationIds: []
  };
}
