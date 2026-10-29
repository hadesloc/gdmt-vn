/**
 * GDMT-VN Module Hen phế quản (Asthma) - Helpers phân tầng lâm sàng GINA & Cơn hen cấp
 * Phân quyền: Agent M
 */

import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import type { RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ADULT_18_ONLY_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  MONO_ICS_DRUGS,
  TRIPLE_INHALER_DRUGS
} from './helpers.constants';
import {
  hasConcurrentCopdOrHypercapnia,
  hasSevereMilkProteinAllergy,
  isPatientPregnant
} from './helpers.dosing';

export interface GinaControlScore {
  answeredCount: number;
  positiveCount: number;
  missingFields: string[];
  level: 'well_controlled' | 'partly_controlled' | 'uncontrolled' | 'missing';
}

export interface AcuteAsthmaAssessment {
  hasAcuteAttack: boolean;
  isDischargeReady: boolean;
  hasMinVitals: boolean;
  missingVitalField?: 'spo2' | 'respiratoryRate';
  isLifeThreatening: boolean;
  isSevere: boolean;
  isModerate: boolean;
  spo2?: number;
  paco2?: number;
  abgPh?: number;
  pefPct?: number;
  fev1Pct?: number;
  rr?: number;
  hr?: number;
  sbp?: number;
  oxygenTargetMin: number;
  oxygenTargetMax: number;
  isCopdHypercapnicTarget: boolean;
  isPregnancyTarget: boolean;
}

export function isAdultOrAdolescent(ctx: RuleContext): boolean {
  const age = need(ctx, 'age');
  const minAge = thFor('age', 'asthma.age.min_adult_adolescent');
  if (age === undefined) return false;
  return age >= minAge;
}

export function isAdult18OrOlder(ctx: RuleContext): boolean {
  const age = need(ctx, 'age');
  const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
  if (age === undefined) return false;
  return age >= minAdult18;
}

/**
 * Không nhường phác đồ bình hít 3 thành phần sang COPD nếu bình đó vi phạm trần tuổi (< 18 tuổi)
 * hoặc chứa lactose trên bệnh nhân dị ứng nặng đạm sữa bò.
 */
export function shouldDeferTripleInhalerToCopd(ctx: RuleContext): boolean {
  if (!ctx.patient.selectedModules.includes('copd')) return false;
  const age = need(ctx, 'age');
  const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
  const milkAllergy = hasSevereMilkProteinAllergy(ctx);

  return ctx.patient.currentMeds.some((m) => {
    const id = resolveKbDrugId(m.drugId);
    if (!TRIPLE_INHALER_DRUGS.has(id)) return false;
    if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
    if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
    return true;
  });
}

/**
 * Đánh giá kiểm soát triệu chứng GINA 4 tuần qua — đồng bộ 100% với `computeGina`:
 * - Nếu đã có ≥ 3 câu trả lời dương tính -> kết luận ngay `uncontrolled` dù còn khuyết 1 câu.
 * - Ngược lại, nếu trả lời < 4 câu -> fail-closed `missing` kèm danh sách chính xác các trường còn thiếu.
 */
export function evaluateGinaControl(ctx: RuleContext): GinaControlScore {
  const ci = ctx.patient.customInputs ?? {};
  const fieldDefs: Array<{ id: string; val: unknown }> = [
    { id: 'daytimeSymptomsMoreThanTwiceWeek', val: ci.daytimeSymptomsMoreThanTwiceWeek },
    { id: 'nightWakingDueToAsthma', val: ci.nightWakingDueToAsthma },
    { id: 'relieverNeededMoreThanTwiceWeek', val: ci.relieverNeededMoreThanTwiceWeek },
    { id: 'activityLimitationDueToAsthma', val: ci.activityLimitationDueToAsthma }
  ];

  let answered = 0;
  let positive = 0;
  const missingFields: string[] = [];

  for (const f of fieldDefs) {
    if (typeof f.val === 'boolean') {
      answered += 1;
      if (f.val === true) positive += 1;
    } else {
      missingFields.push(f.id);
    }
  }

  const uncontrolledMin = thFor('criteria_count', 'asthma.symptom_control.uncontrolled_min_criteria');
  const minQuestions = 4; // qa-allow: index - Bộ câu hỏi GINA Box 2-2 gồm đúng 4 câu

  if (positive >= uncontrolledMin) {
    return { answeredCount: answered, positiveCount: positive, missingFields, level: 'uncontrolled' };
  }
  if (answered < minQuestions) {
    return { answeredCount: answered, positiveCount: positive, missingFields, level: 'missing' };
  }
  if (positive === 0) {
    return { answeredCount: answered, positiveCount: positive, missingFields, level: 'well_controlled' };
  }
  return { answeredCount: answered, positiveCount: positive, missingFields, level: 'partly_controlled' };
}

/**
 * Phân tầng cơn hen cấp thống nhất cho CẢ nội viện/cấp cứu VÀ ngoại trú tuyến ban đầu.
 * Bao phủ đầy đủ dấu hiệu nguy kịch huyết động/kiệt sức (tụt HA, nhịp chậm, thở chậm, toan máu, ưu thán),
 * ngưỡng FEV1 ≤ 50% / PaCO2 ≥ 40 mmHg của cơn nặng, phân tách cơn trung bình (cần Ipratropium),
 * đích SpO2 cá thể hóa (thai kỳ ≥ 95%, COPD/tăng CO2 88–92%, người lớn 93–95%),
 * và cổng an toàn xuất viện khách quan.
 */
export function evaluateAcuteAsthma(ctx: RuleContext): AcuteAsthmaAssessment {
  const ci = ctx.patient.customInputs ?? {};
  const isPregnant = isPatientPregnant(ctx);
  const isCopdHypercapnia = !isPregnant && hasConcurrentCopdOrHypercapnia(ctx);

  const oxygenTargetMin = isPregnant
    ? thFor('spo2', 'asthma.acute.pregnancy_oxygen_target_min')
    : isCopdHypercapnia
      ? thFor('restingSpo2', 'copd.oxygen_target_spo2_min')
      : thFor('spo2', 'asthma.acute.oxygen_target_min');

  const oxygenTargetMax = isPregnant
    ? thFor('spo2', 'asthma.acute.pregnancy_oxygen_target_max')
    : isCopdHypercapnia
      ? thFor('restingSpo2', 'copd.oxygen_target_spo2_max')
      : thFor('spo2', 'asthma.acute.oxygen_target_max');

  const spo2 = typeof ci.spo2 === 'number' ? ci.spo2 : need(ctx, 'spo2');
  const paco2 = typeof ci.paco2 === 'number' ? ci.paco2 : (need(ctx, 'paco2') ?? need(ctx, 'abgPaco2'));
  const abgPh = typeof ci.abgPh === 'number' ? ci.abgPh : (need(ctx, 'abgPh') ?? need(ctx, 'ph'));
  const pefPct = typeof ci.pefPct === 'number' ? ci.pefPct : need(ctx, 'pefPct');
  const fev1Pct = need(ctx, 'fev1Pct');
  const rawPt = ctx.patient as unknown as { rr?: number };
  const rr =
    typeof ci.respiratoryRate === 'number'
      ? ci.respiratoryRate
      : (need(ctx, 'respiratoryRate') ?? (typeof rawPt.rr === 'number' ? rawPt.rr : undefined));
  const hr = need(ctx, 'hr');
  const sbp = need(ctx, 'sbp');

  const hasMinVitals = spo2 !== undefined && rr !== undefined;
  const missingVitalField: 'spo2' | 'respiratoryRate' | undefined =
    spo2 === undefined ? 'spo2' : rr === undefined ? 'respiratoryRate' : undefined;

  const isExplicitAcute = ci.isAcuteExacerbation === true;
  const isExplicitNotAcute = ci.isAcuteExacerbation === false;

  const speech = ci.speechAbility as string | undefined;
  const silentChest = Boolean(ci.silentChest);
  const mental = ci.mentalStatus as string | undefined;
  const drowsy = mental === 'drowsy_confused';
  const anxious = mental === 'anxious';
  const accessoryUse = Boolean(ci.accessoryMuscleUse);
  const resp1h = ci.acuteResponseAfter1h as string | undefined;

  const severeSpo2 = thFor('spo2', 'asthma.acute.severe_spo2_threshold');
  const severePef = thFor('pef', 'asthma.acute.severe_pef_threshold');
  const severeFev1 = thFor('fev1_pct', 'asthma.acute.severe_fev1_threshold');
  const severeRr = thFor('rr', 'asthma.acute.severe_rr_threshold');
  const severeHr = thFor('hr', 'asthma.acute.severe_hr_threshold');
  const modHrMin = thFor('hr', 'asthma.acute.moderate_hr_min');
  const lifeThreatPaco2 = thFor('paco2', 'asthma.acute.life_threatening_paco2_mmhg');
  const severeAcidosisPh = thFor('abgPh', 'copd.severe_acidosis_ph');
  const acidosisPh = thFor('abgPh', 'copd.niv_ph_cutoff');
  const hypotensionSbp = thFor('sbp', 'asthma.acute.magnesium_sbp_caution_min');
  const bradyHrMin = thFor('hr', 'af.rate.bradycardia_hr_min');
  const bradypneaMax = 10; // qa-allow: unit-conversion - ngưỡng nhịp thở chậm kiệt sức hô hấp (< 10 lần/phút)
  const normocapniaFatigueMin = 40; // qa-allow: unit-conversion - PaCO2 bình thường cao ≥ 40 mmHg cảnh báo mệt cơ hô hấp

  const hasHardRespiratoryCollapse =
    silentChest ||
    drowsy ||
    speech === 'unable' ||
    (paco2 !== undefined && paco2 > lifeThreatPaco2) ||
    (abgPh !== undefined && abgPh <= severeAcidosisPh);

  const hasSpecificAcutePresentation =
    hasHardRespiratoryCollapse ||
    speech === 'words' ||
    speech === 'phrases' ||
    accessoryUse ||
    anxious ||
    resp1h === 'poor_response' ||
    resp1h === 'incomplete_response' ||
    (spo2 !== undefined && spo2 < severeSpo2);

  const modMaxPef = 79; // qa-allow: unit-conversion - ngưỡng PEF ≤ 79% phân tầng cơn hen trung bình (51–79%)
  const modMinRr = 22; // qa-allow: unit-conversion - nhịp thở tăng > 22 lần/phút trong cơn hen trung bình

  // ASTHMA-R4-R1-01 / R3-01: Nằm viện KHÔNG đồng nghĩa với cơn hen cấp. Người bệnh hen ổn định nhập viện
  // vì suy tim, ĐTĐ, phẫu thuật... (isAcuteExacerbation chưa khai báo) phải giữ nguyên ICS/ICS-LABA nền.
  // Chỉ suy luận cơn cấp nội viện khi có dấu hiệu hô hấp cấp khách quan (PEF, nhịp thở, khí máu)
  // hoặc đã được đánh giá đáp ứng điều trị cắt cơn sau 1 giờ. FEV1% không dùng đơn lẻ vì thường là
  // giá trị hô hấp ký nền mạn tính (hen/COPD), dễ gây dương tính giả.
  const hasInpatientObjectiveAcuteSigns =
    resp1h !== undefined ||
    (pefPct !== undefined && pefPct <= modMaxPef) ||
    (rr !== undefined && (rr > modMinRr || rr < bradypneaMax)) ||
    (paco2 !== undefined && paco2 >= normocapniaFatigueMin) ||
    (abgPh !== undefined && abgPh < acidosisPh);

  const inAcuteContext =
    isExplicitAcute ||
    hasHardRespiratoryCollapse ||
    (!isExplicitNotAcute &&
      (hasSpecificAcutePresentation ||
        (ctx.settings.setting === 'inpatient' &&
          resp1h !== 'good_response' &&
          hasInpatientObjectiveAcuteSigns)));

  if (!inAcuteContext && !(ctx.settings.setting === 'inpatient' && !isExplicitNotAcute && resp1h === 'good_response')) {
    return {
      hasAcuteAttack: false,
      isDischargeReady: false,
      hasMinVitals,
      missingVitalField,
      isLifeThreatening: false,
      isSevere: false,
      isModerate: false,
      spo2,
      paco2,
      abgPh,
      pefPct,
      fev1Pct,
      rr,
      hr,
      sbp,
      oxygenTargetMin,
      oxygenTargetMax,
      isCopdHypercapnicTarget: isCopdHypercapnia,
      isPregnancyTarget: isPregnant
    };
  }

  const isLifeThreatening =
    hasHardRespiratoryCollapse ||
    (inAcuteContext &&
      ((sbp !== undefined && sbp < hypotensionSbp) ||
        (hr !== undefined && hr < bradyHrMin) ||
        (rr !== undefined && rr < bradypneaMax) ||
        (abgPh !== undefined && abgPh < acidosisPh && paco2 !== undefined && paco2 >= normocapniaFatigueMin)));

  const isSevere =
    !isLifeThreatening &&
    (speech === 'words' ||
      anxious ||
      accessoryUse ||
      resp1h === 'poor_response' ||
      (rr !== undefined && rr > severeRr) ||
      (hr !== undefined && hr > severeHr) ||
      (spo2 !== undefined && spo2 < severeSpo2) ||
      (pefPct !== undefined && pefPct <= severePef) ||
      (fev1Pct !== undefined && fev1Pct <= severeFev1) ||
      (paco2 !== undefined && paco2 >= normocapniaFatigueMin) ||
      (abgPh !== undefined && abgPh < acidosisPh));

  if (ctx.settings.setting === 'inpatient' && !isExplicitNotAcute && resp1h === 'good_response') {
    const dischMinPef = thFor('pef', 'asthma.acute.discharge_min_pef_pct');
    const dischMinFev1 = thFor('fev1_pct', 'asthma.acute.discharge_min_fev1_pct');
    const dischMinSpo2General = thFor('spo2', 'asthma.acute.discharge_min_spo2');
    const requiredDischSpo2 = isPregnant
      ? oxygenTargetMin
      : isCopdHypercapnia
        ? oxygenTargetMin
        : dischMinSpo2General;
    const maxSafeDischRr = 25; // qa-allow: unit-conversion - nhịp thở nghỉ ổn định trước xuất viện

    const meetsObjectiveDischargeSafety =
      !isLifeThreatening &&
      !isSevere &&
      speech !== 'phrases' &&
      (spo2 === undefined || spo2 >= requiredDischSpo2) &&
      (pefPct === undefined || pefPct > dischMinPef) &&
      (fev1Pct === undefined || fev1Pct > dischMinFev1) &&
      (rr === undefined || rr <= maxSafeDischRr);

    if (meetsObjectiveDischargeSafety) {
      return {
        hasAcuteAttack: false,
        isDischargeReady: true,
        hasMinVitals,
        missingVitalField,
        isLifeThreatening: false,
        isSevere: false,
        isModerate: false,
        spo2,
        paco2,
        abgPh,
        pefPct,
        fev1Pct,
        rr,
        hr,
        sbp,
        oxygenTargetMin,
        oxygenTargetMax,
        isCopdHypercapnicTarget: isCopdHypercapnia,
        isPregnancyTarget: isPregnant
      };
    }
  }

  const modMaxFev1 = thFor('fev1_pct', 'asthma.slit.min_fev1_pct');

  const isModerate =
    !isLifeThreatening &&
    !isSevere &&
    (speech === 'phrases' ||
      resp1h === 'incomplete_response' ||
      (spo2 !== undefined && spo2 < oxygenTargetMin) ||
      (pefPct !== undefined && pefPct <= modMaxPef) ||
      (fev1Pct !== undefined && fev1Pct <= modMaxFev1) ||
      (rr !== undefined && rr > modMinRr) ||
      (hr !== undefined && hr >= modHrMin));

  return {
    hasAcuteAttack: true,
    isDischargeReady: false,
    hasMinVitals,
    missingVitalField,
    isLifeThreatening,
    isSevere,
    isModerate,
    spo2,
    paco2,
    abgPh,
    pefPct,
    fev1Pct,
    rr,
    hr,
    sbp,
    oxygenTargetMin,
    oxygenTargetMax,
    isCopdHypercapnicTarget: isCopdHypercapnia,
    isPregnancyTarget: isPregnant
  };
}

export function isStepDownEligible(ctx: RuleContext): boolean {
  const ci = ctx.patient.customInputs ?? {};
  if (Boolean(ci.isAcuteExacerbation) || evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
  // GINA 2025 Box 4-13: không hạ bậc điều trị khi đang nằm viện / bệnh cấp tính đi kèm — tái đánh giá ngoại trú sau xuất viện.
  if (ctx.settings.setting === 'inpatient') return false;
  if (isPatientPregnant(ctx)) return false;

  const score = evaluateGinaControl(ctx);
  if (score.level !== 'well_controlled') return false;

  const minMonths = thFor('months', 'asthma.step_down.stability_months_max');
  const monthsStable = typeof ci.wellControlledMonths === 'number' ? ci.wellControlledMonths : 0;
  if (monthsStable < minMonths) return false;

  const exac = typeof ci.exacerbationsLastYear === 'number' ? ci.exacerbationsLastYear : 0;
  if (exac > 0) return false;

  const fev1 = need(ctx, 'fev1Pct');
  const lowFev1 = thFor('fev1_pct', 'asthma.risk.low_fev1_pct');
  if (fev1 !== undefined && fev1 < lowFev1) return false;

  return true;
}

export function computeEffectiveTrack1Step(ctx: RuleContext): 1 | 2 | 3 | 4 | 5 {
  const ci = ctx.patient.customInputs ?? {};
  const score = evaluateGinaControl(ctx);
  const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
  const exac = typeof ci.exacerbationsLastYear === 'number' ? ci.exacerbationsLastYear : 0;
  const fev1 = need(ctx, 'fev1Pct');
  const lowFev1 = thFor('fev1_pct', 'asthma.risk.low_fev1_pct');

  const techniqueOk = ci.inhalerTechniqueCorrect !== false;
  const adherenceOk = ci.goodAdherence !== false;
  const canStepUp = techniqueOk && adherenceOk;
  const stepDown = isStepDownEligible(ctx);

  if (currentStep <= 0) {
    if (score.level === 'uncontrolled' && (exac >= 1 || (fev1 !== undefined && fev1 < lowFev1))) {
      return 4;
    }
    if (score.level === 'uncontrolled') return 3;
    return 1;
  }
  if (currentStep === 1 || currentStep === 2) {
    if (score.level === 'uncontrolled' && canStepUp) return 3;
    return 2;
  }
  if (currentStep === 3) {
    if (stepDown) return 2;
    if (score.level === 'uncontrolled' && canStepUp) return 4;
    return 3;
  }
  if (currentStep === 4) {
    if (stepDown) return 3;
    if (score.level === 'uncontrolled' && canStepUp) return 5;
    return 4;
  }
  if (stepDown) return 4;
  return 5;
}

export function computeEffectiveTrack2Step(ctx: RuleContext): 1 | 2 | 3 | 4 | 5 {
  const ci = ctx.patient.customInputs ?? {};
  const score = evaluateGinaControl(ctx);
  const rawStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
  const hasMonoIcs = ctx.patient.currentMeds.some((m) => MONO_ICS_DRUGS.has(m.drugId.toLowerCase()));
  const currentStep = rawStep <= 0 && hasMonoIcs ? 2 : rawStep;
  const exac = typeof ci.exacerbationsLastYear === 'number' ? ci.exacerbationsLastYear : 0;
  const fev1 = need(ctx, 'fev1Pct');
  const lowFev1 = thFor('fev1_pct', 'asthma.risk.low_fev1_pct');
  const canStepUp = ci.inhalerTechniqueCorrect !== false && ci.goodAdherence !== false;
  const stepDown = isStepDownEligible(ctx);

  if (currentStep <= 0) {
    if (score.level === 'uncontrolled' && (exac >= 1 || (fev1 !== undefined && fev1 < lowFev1))) {
      return 4;
    }
    if (score.level === 'uncontrolled') return 3;
    return 1;
  }
  if (currentStep === 1 || currentStep === 2) {
    if (score.level === 'uncontrolled' && canStepUp) return 3;
    return 2;
  }
  if (currentStep === 3) {
    if (stepDown) return 2;
    if (score.level === 'uncontrolled' && canStepUp) return 4;
    return 3;
  }
  if (currentStep === 4) {
    if (stepDown) return 3;
    if (score.level === 'uncontrolled' && canStepUp) return 5;
    return 4;
  }
  if (stepDown) return 4;
  return 5;
}
