/**
 * GDMT-VN Gout Module - NSAID Contraindication Gates, ULT Selection & Titration State Helpers
 * Phân quyền: Agent K
 */

import type { RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  SYSTEMIC_STEROID_IDS,
  P2Y12_DRUG_IDS,
  isOnMed,
  findMed,
  parseMedDailyDoseMg,
  hasAmbiguousCountMedDose
} from './helpers.meds';
import {
  isPregnant,
  isBreastfeeding,
  getChildPughGrade,
  hasHepaticImpairment,
  hasModerateOrSevereHepaticImpairment,
  hasSevereHepaticImpairment,
  hasSecondaryHyperuricemiaOrTls,
  isAsymptomaticHyperuricemia,
  isAcuteGoutFlare,
  hasActiveInfection,
  isDkaSuspected,
  hasSevereUncontrolledHyperglycemia,
  isOnDialysis,
  hasHeartFailure,
  hasEstablishedCvd,
  isUrateBelowTarget,
  assessUltIndication
} from './helpers';
import {
  getHlaB5801Status,
  isAllopurinolIntolerant,
  isFebuxostatIntolerant,
  hasSulfonamideAllergy,
  hasNsaidAllergyOrAerd,
  isTakingAzathioprine,
  isOnAnticoagulant,
  hasPepticUlcerOrBleed,
  isTripleWhammyRisk,
  hasUncontrolledBpForEtoricoxib,
  isAllopurinolBeingStopped,
  isFebuxostatBeingStopped,
  isProbenecidContraindicated,
  isBenzbromaroneContraindicated,
  hasActiveValidUlt
} from './helpers.safety';

export function isNsaidHardContraindicated(
  ctx: RuleContext,
  specificDrugId?: string
): { contra: boolean; reasonsVi: string[]; citationIds: string[] } {
  const egfr = need(ctx, 'egfr');
  const egfrContra = thFor('egfr', 'gout.nsaid.egfr_contra_min');
  const spec = (specificDrugId || '').toLowerCase();
  const cp = getChildPughGrade(ctx);
  const reasons: string[] = [];
  const cites: string[] = [];

  if (hasNsaidAllergyOrAerd(ctx, spec)) {
    reasons.push('Tiền sử dị ứng/phản vệ NSAID hoặc bệnh hô hấp kịch phát do Aspirin/NSAID (AERD / tam chứng Samter)');
    cites.push('byt.gout.2014.nsaid_contra_p198', 'fda.celecoxib.contra_sulfa_aerd', 'ema.arcoxia.contra_aerd');
  }
  if (spec === 'celecoxib' && hasSulfonamideAllergy(ctx)) {
    reasons.push('Tiền sử dị ứng nhóm Sulfonamide (chống chỉ định tuyệt đối Celecoxib)');
    cites.push('fda.celecoxib.contra_sulfa_aerd');
  }
  if (spec === 'etoricoxib' && ctx.settings.profile === 'US') {
    reasons.push('Etoricoxib chưa được FDA phê duyệt lưu hành tại Hoa Kỳ (chuyển sang NSAID được FDA cấp phép)');
    cites.push('acr.gout.2020.flare_first_line');
  }
  if (isPregnant(ctx)) {
    reasons.push('Phụ nữ đang mang thai');
    cites.push('byt.gout.2014.nsaid_contra_p198', 'fda.celecoxib.fetal_toxicity_pregnancy');
  }
  if (isBreastfeeding(ctx)) {
    const lactationSafeShortCourse =
      ctx.settings.profile !== 'VN' && (spec === 'ibuprofen' || spec === 'celecoxib');
    if (!lactationSafeShortCourse) {
      reasons.push('Phụ nữ đang cho con bú');
      cites.push('byt.gout.2014.nsaid_contra_p198', 'ema.arcoxia.lactation_contra');
    }
  }
  if (isOnDialysis(ctx) || (egfr !== undefined && egfr < egfrContra)) {
    reasons.push(`Suy thận nặng (eGFR < ${egfrContra} mL/phút hoặc lọc máu)`);
    cites.push('byt.ckd.2024.gout_flare_table22', 'eular.gout.2016.colchicine_nsaid_contra');
  }
  if (hasPepticUlcerOrBleed(ctx)) {
    reasons.push('Loét dạ dày tá tràng, tiền sử hoặc đang xuất huyết tiêu hóa / xuất huyết nội sọ');
    cites.push('byt.gout.2014.nsaid_contra_p198', 'fda.celecoxib.boxed_contra_cv_gi');
  }
  if (isOnAnticoagulant(ctx)) {
    reasons.push('Đang dùng thuốc chống đông máu');
    cites.push('byt.gout.2014.nsaid_contra_p198', 'fda.celecoxib.boxed_contra_cv_gi');
  }
  if (hasHeartFailure(ctx)) {
    reasons.push('Suy tim / giảm LVEF');
    cites.push('byt.gout.2014.nsaid_cv_aspirin_p199', 'fda.celecoxib.boxed_contra_cv_gi');
  } else if (hasEstablishedCvd(ctx)) {
    reasons.push('Bệnh tim mạch do xơ vữa / hội chứng vành cấp / đột quỵ');
    cites.push('byt.gout.2014.nsaid_cv_aspirin_p199', 'byt.gout.2014.nsaid_dosing_p201', 'fda.celecoxib.boxed_contra_cv_gi');
  }
  if (hasSevereHepaticImpairment(ctx)) {
    reasons.push('Suy gan nặng / xơ gan mất bù (Child-Pugh C)');
    cites.push('byt.gout.2014.nsaid_contra_p198', 'ema.arcoxia.contra_severe_hepatic_renal_ibd');
  } else if (hasHepaticImpairment(ctx) && spec !== 'etoricoxib' && spec !== 'celecoxib') {
    reasons.push('Bệnh gan / xơ gan (tránh dùng NSAID đường toàn thân)');
    cites.push('byt.gout.2014.nsaid_contra_p198');
  } else if (cp === 'B' && spec !== 'etoricoxib' && spec !== 'celecoxib') {
    reasons.push('Suy gan vừa Child-Pugh B');
    cites.push('byt.gout.2014.nsaid_contra_p198');
  }
  if (isTripleWhammyRisk(ctx)) {
    reasons.push('Đang phối hợp RASi/ARNI + Lợi tiểu (nguy cơ suy thận cấp Triple Whammy)');
    cites.push('kdigo.gout.2024.acute_flare_ckd', 'byt.ckd.2024.gout_flare_table22');
  }
  if (spec === 'etoricoxib' && hasUncontrolledBpForEtoricoxib(ctx)) {
    const sbpMax = thFor('sbp', 'gout.etoricoxib.sbp_contra_max');
    const dbpMax = thFor('dbp', 'gout.etoricoxib.dbp_contra_max');
    reasons.push(`Tăng huyết áp chưa kiểm soát (> ${sbpMax}/${dbpMax} mmHg: chống chỉ định Etoricoxib theo Arcoxia SmPC Mục 4.3)`);
    cites.push('ema.arcoxia.contra_htn_cv_aerd');
  }
  return { contra: reasons.length > 0, reasonsVi: reasons, citationIds: Array.from(new Set(cites)) };
}

export function isNsaidAvoidedInGout(ctx: RuleContext): { avoid: boolean; reasonsVi: string[]; citationIds: string[] } {
  const hard = isNsaidHardContraindicated(ctx);
  const egfr = need(ctx, 'egfr');
  const egfrCaution = thFor('egfr', 'gout.nsaid.egfr_caution_min');
  const reasons = [...hard.reasonsVi];
  const cites = [...hard.citationIds];
  if (egfr !== undefined && egfr >= thFor('egfr', 'gout.nsaid.egfr_contra_min') && egfr < egfrCaution) {
    reasons.push(`Bệnh thận mạn giai đoạn ≥ 3 (eGFR < ${egfrCaution} mL/phút/1.73m²)`);
    cites.push('kdigo.gout.2024.acute_flare_ckd');
  }
  if (isOnMed(ctx, SYSTEMIC_STEROID_IDS)) {
    reasons.push('Đang dùng Corticosteroid đường toàn thân (không phối hợp chồng NSAID do tăng vọt xuất huyết tiêu hóa)');
    cites.push('eular.gout.2016.flare_combination_severe', 'byt.gout.2014.nsaid_contra_p198');
  }
  if (isOnMed(ctx, P2Y12_DRUG_IDS)) {
    reasons.push('Đang dùng kháng kết tập tiểu cầu P2Y12 (Clopidogrel/Ticagrelor/Prasugrel: nguy cơ xuất huyết & biến cố tim mạch)');
    cites.push('byt.gout.2014.nsaid_cv_aspirin_p199', 'fda.celecoxib.boxed_contra_cv_gi');
  }
  return { avoid: reasons.length > 0, reasonsVi: reasons, citationIds: Array.from(new Set(cites)) };
}

export function isProbenecidInitSafe(ctx: RuleContext): boolean {
  if (isProbenecidContraindicated(ctx)) return false;
  const egfr = need(ctx, 'egfr');
  return egfr !== undefined && egfr >= thFor('egfr', 'gout.probenecid.egfr_prefer_xoi_min');
}

export function isBenzbromaroneInitSafe(ctx: RuleContext): boolean {
  if (ctx.settings.profile === 'US' || isBenzbromaroneContraindicated(ctx)) return false;
  const egfr = need(ctx, 'egfr');
  return egfr !== undefined && egfr >= thFor('egfr', 'gout.benzbromarone.egfr_contra_min');
}

export function canInitiateUltNow(ctx: RuleContext): boolean {
  if (isPregnant(ctx) || hasActiveValidUlt(ctx) || hasSecondaryHyperuricemiaOrTls(ctx)) return false;
  if (hasActiveInfection(ctx) || isDkaSuspected(ctx) || hasSevereUncontrolledHyperglycemia(ctx)) return false;
  const ind = assessUltIndication(ctx);
  if (ind.status !== 'strong' && ind.status !== 'conditional') return false;
  if (isAcuteGoutFlare(ctx) && ctx.settings.profile === 'VN') return false;
  return true;
}

export function selectUltInitDrug(ctx: RuleContext): 'allopurinol' | 'febuxostat' | 'probenecid' | 'benzbromarone' | 'none' {
  if (!canInitiateUltNow(ctx)) return 'none';
  if (need(ctx, 'egfr') === undefined && !isOnDialysis(ctx)) return 'none';

  const aza = isTakingAzathioprine(ctx);
  if (!aza && getHlaB5801Status(ctx) !== 'positive' && !isAllopurinolIntolerant(ctx)) return 'allopurinol';
  if (!aza && !isFebuxostatIntolerant(ctx) && !isBreastfeeding(ctx) && !hasSevereHepaticImpairment(ctx)) return 'febuxostat';
  if (isProbenecidInitSafe(ctx) && !isAcuteGoutFlare(ctx)) return 'probenecid';
  if (isBenzbromaroneInitSafe(ctx) && !isAcuteGoutFlare(ctx)) return 'benzbromarone';
  return 'none';
}

export function doesUltExceedSafetyCap(ctx: RuleContext, ultId: string): boolean {
  const id = ultId.toLowerCase();
  const med = findMed(ctx, [id]);
  const curDose = parseMedDailyDoseMg(med);
  if (curDose === undefined) return false;
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');

  if (id === 'allopurinol') {
    if (curDose > thFor('dose_mg', 'gout.allopurinol.max_dose')) return true;
    if (ctx.settings.profile !== 'US') {
      const crcl10 = thFor('crcl', 'gout.allopurinol.crcl_10');
      const crcl20 = thFor('crcl', 'gout.allopurinol.crcl_20');
      if ((crcl !== undefined && crcl < crcl10) || (egfr !== undefined && egfr < crcl10)) {
        return curDose > thFor('dose_mg', 'gout.allopurinol.dose_crcl_under_10');
      }
      if ((crcl !== undefined && crcl < crcl20) || (egfr !== undefined && egfr < crcl20)) {
        return curDose > thFor('dose_mg', 'gout.allopurinol.dose_crcl_10_20');
      }
    }
    return false;
  }
  if (id === 'febuxostat') {
    const severeEgfr = thFor('egfr', 'gout.febuxostat.severe_renal_egfr');
    const severeCrcl = thFor('crcl', 'gout.febuxostat.severe_renal_crcl');
    if (isOnDialysis(ctx) || (egfr !== undefined && egfr < severeEgfr) || (crcl !== undefined && crcl < severeCrcl)) {
      return curDose > thFor('dose_mg', 'gout.febuxostat.severe_renal_max_dose');
    }
    if (ctx.settings.profile === 'US' || hasModerateOrSevereHepaticImpairment(ctx)) {
      return curDose > thFor('dose_mg', 'gout.febuxostat.hepatic_moderate_max_dose');
    }
    return curDose > thFor('dose_mg', 'gout.febuxostat.max_dose_intl_vn');
  }
  if (id === 'probenecid') {
    return curDose > thFor('dose_g', 'gout.probenecid.max_dose_g') * 1000; // qa-allow: unit-conversion - g sang mg
  }
  if (id === 'benzbromarone') {
    return curDose > thFor('dose_mg', 'gout.benzbromarone.target_dose');
  }
  return false;
}

export function hasSubmaximalActiveXoi(ctx: RuleContext): boolean {
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  if (isOnMed(ctx, ['allopurinol']) && !isAllopurinolBeingStopped(ctx)) {
    const med = findMed(ctx, ['allopurinol']);
    if (hasAmbiguousCountMedDose(med)) return true;
    const curDose = parseMedDailyDoseMg(med);
    const maxDose = thFor('dose_mg', 'gout.allopurinol.max_dose');
    const crcl10 = thFor('crcl', 'gout.allopurinol.crcl_10');
    const crcl20 = thFor('crcl', 'gout.allopurinol.crcl_20');
    const hitRenalCap =
      ctx.settings.profile !== 'US' &&
      curDose !== undefined &&
      (((crcl !== undefined && crcl < crcl10) || (egfr !== undefined && egfr < crcl10))
        ? curDose >= thFor('dose_mg', 'gout.allopurinol.dose_crcl_under_10')
        : ((crcl !== undefined && crcl < crcl20) || (egfr !== undefined && egfr < crcl20)) &&
          curDose >= thFor('dose_mg', 'gout.allopurinol.dose_crcl_10_20'));
    if (!hitRenalCap && (curDose === undefined || curDose < maxDose)) return true;
  }
  if (isOnMed(ctx, ['febuxostat']) && !isFebuxostatBeingStopped(ctx)) {
    const med = findMed(ctx, ['febuxostat']);
    if (hasAmbiguousCountMedDose(med)) return true;
    const isSevereRenal =
      isOnDialysis(ctx) ||
      (egfr !== undefined && egfr < thFor('egfr', 'gout.febuxostat.severe_renal_egfr')) ||
      (crcl !== undefined && crcl < thFor('crcl', 'gout.febuxostat.severe_renal_crcl'));
    if (!isSevereRenal) {
      const curDose = parseMedDailyDoseMg(med);
      const maxFeb =
        ctx.settings.profile === 'US' || hasModerateOrSevereHepaticImpairment(ctx)
          ? thFor('dose_mg', 'gout.febuxostat.hepatic_moderate_max_dose')
          : thFor('dose_mg', 'gout.febuxostat.max_dose_intl_vn');
      if (curDose === undefined || curDose < maxFeb) return true;
    }
  }
  return false;
}

export function isUltNewlyStartedOrUptitrated(ctx: RuleContext): boolean {
  if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx) || hasSecondaryHyperuricemiaOrTls(ctx)) return false;
  if (isAcuteGoutFlare(ctx)) return false;
  if (selectUltInitDrug(ctx) !== 'none') return true;
  if (isUrateBelowTarget(ctx) !== false) return false;

  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');

  if (isOnMed(ctx, ['allopurinol']) && !isAllopurinolBeingStopped(ctx)) {
    const med = findMed(ctx, ['allopurinol']);
    if (!hasAmbiguousCountMedDose(med) && !doesUltExceedSafetyCap(ctx, 'allopurinol')) {
      const curDose = parseMedDailyDoseMg(med);
      const maxDose = thFor('dose_mg', 'gout.allopurinol.max_dose');
      const crcl10 = thFor('crcl', 'gout.allopurinol.crcl_10');
      const crcl20 = thFor('crcl', 'gout.allopurinol.crcl_20');
      const hitRenalCapIntlVn =
        ctx.settings.profile !== 'US' &&
        curDose !== undefined &&
        (((crcl !== undefined && crcl < crcl10) || (egfr !== undefined && egfr < crcl10))
          ? curDose >= thFor('dose_mg', 'gout.allopurinol.dose_crcl_under_10')
          : ((crcl !== undefined && crcl < crcl20) || (egfr !== undefined && egfr < crcl20)) &&
            curDose >= thFor('dose_mg', 'gout.allopurinol.dose_crcl_10_20'));
      if (!hitRenalCapIntlVn && (curDose === undefined || curDose < maxDose)) return true;
    }
  }
  if (isOnMed(ctx, ['febuxostat']) && !isFebuxostatBeingStopped(ctx)) {
    const med = findMed(ctx, ['febuxostat']);
    if (!hasAmbiguousCountMedDose(med) && !doesUltExceedSafetyCap(ctx, 'febuxostat') && !hasSevereHepaticImpairment(ctx)) {
      const canSwitchAllo = getHlaB5801Status(ctx) !== 'positive' && !isAllopurinolIntolerant(ctx);
      const isSevereRenal =
        isOnDialysis(ctx) ||
        (egfr !== undefined && egfr < thFor('egfr', 'gout.febuxostat.severe_renal_egfr')) ||
        (crcl !== undefined && crcl < thFor('crcl', 'gout.febuxostat.severe_renal_crcl'));
      if (!(hasEstablishedCvd(ctx) && canSwitchAllo) && !isSevereRenal) {
        const curDose = parseMedDailyDoseMg(med);
        const maxFeb =
          ctx.settings.profile === 'US' || hasModerateOrSevereHepaticImpairment(ctx)
            ? thFor('dose_mg', 'gout.febuxostat.hepatic_moderate_max_dose')
            : thFor('dose_mg', 'gout.febuxostat.max_dose_intl_vn');
        if (curDose === undefined || curDose < maxFeb) return true;
      }
    }
  }
  if (isOnMed(ctx, ['probenecid']) && !isProbenecidContraindicated(ctx)) {
    const med = findMed(ctx, ['probenecid']);
    if (!hasAmbiguousCountMedDose(med) && !doesUltExceedSafetyCap(ctx, 'probenecid') && !hasSubmaximalActiveXoi(ctx)) {
      const curDose = parseMedDailyDoseMg(med);
      const maxProb = thFor('dose_g', 'gout.probenecid.max_dose_g') * 1000; // qa-allow: unit-conversion - g sang mg
      if (curDose === undefined || curDose < maxProb) return true;
    }
  }
  if (isOnMed(ctx, ['benzbromarone']) && ctx.settings.profile !== 'US' && !isBenzbromaroneContraindicated(ctx)) {
    const med = findMed(ctx, ['benzbromarone']);
    if (!hasAmbiguousCountMedDose(med) && !doesUltExceedSafetyCap(ctx, 'benzbromarone') && !hasSubmaximalActiveXoi(ctx)) {
      const curDose = parseMedDailyDoseMg(med);
      if (curDose === undefined || curDose < thFor('dose_mg', 'gout.benzbromarone.target_dose')) return true;
    }
  }
  return false;
}
