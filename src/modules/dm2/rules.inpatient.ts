/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Đích Đường huyết & Insulin Nền Nội viện
 * Phân quyền: Agent F4
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need, missingInputRec } from '../../engine/require';
import { computeInsulin } from '../../engine/calculators/insulin';
import { thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  BOLUS_INSULIN_IDS,
  LONG_ACTING_BASAL_IDS,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  findAllActiveMedsByCanonical,
  formatActiveMedDose,
  getEffectiveEgfr,
  getFdcBlockedCompanionReason,
  hasDm2Context,
  hasDrugAllergy,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isIcuSetting,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  parseInsulinMedDailyUnits,
  resolveDrugNameVi
} from './helpers';

export function computeHomeTotalInsulinUnits(ctx: RuleContext): number | undefined {
  let total = 0;
  let found = false;
  const seenMeds = new Set<object>();
  for (const insId of ALL_INSULIN_IDS) {
    for (const med of findAllActiveMedsByCanonical(ctx, insId)) {
      if (seenMeds.has(med)) continue;
      seenMeds.add(med);
      const u = parseInsulinMedDailyUnits(med);
      if (u !== undefined && u > 0) {
        total += u;
        found = true;
      }
    }
  }
  if (found) return Math.round(total * 10) / 10; // qa-allow: unit-conversion - Làm tròn tổng đơn vị insulin tại nhà
  return need(ctx, 'currentBasalDoseUnits');
}

export const dm2InpatientRules: Rule[] = [
  // 1. ĐÍCH ĐƯỜNG HUYẾT NỘI VIỆN (ICU vs KHOA THƯỜNG, KÈM PROFILE DIFF INTL/VN/US)
  {
    id: 'dm2.inpatient.glycemic_target',
    module: 'dm2',
    nameVi: 'Đích đường huyết nội viện (ICU vs Khoa thường)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => hasDm2Context(ctx),
    produce: (ctx) => {
      const isIcu = isIcuSetting(ctx);
      const icuMinMmol = thFor('glucose', 'dm2.glucose.icu_target_min_mmol');
      const icuMaxMmol = thFor('glucose', 'dm2.glucose.icu_target_max_mmol');
      const icuMinMgdl = thFor('glucose', 'dm2.glucose.icu_target_min');
      const icuMaxMgdl = thFor('glucose', 'dm2.glucose.inpatient_target_max');
      const wardMinMmol = thFor('glucose', 'dm2.glucose.inpatient_target_min_mmol');
      const wardMaxMmol = thFor('glucose', 'dm2.glucose.inpatient_target_max_mmol');
      const wardMinMgdl = thFor('glucose', 'dm2.glucose.inpatient_target_min');
      const wardMaxMgdl = thFor('glucose', 'dm2.glucose.inpatient_target_max');
      const hypoMmol = thFor('glucose', 'dm2.hypo.threshold_level1_mmol');

      const targetText = isIcu
        ? `${icuMinMmol.toFixed(1)} – ${icuMaxMmol.toFixed(1)} mmol/L (${icuMinMgdl}–${icuMaxMgdl} mg/dL)`
        : `${wardMinMmol.toFixed(1)} – ${wardMaxMmol.toFixed(1)} mmol/L (${wardMinMgdl}–${wardMaxMgdl} mg/dL)`;

      return {
        id: 'rec_dm2_inpatient_target',
        module: 'dm2',
        tier: 'Mục tiêu kiểm soát đường huyết nội viện',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Mục tiêu glucose máu nội viện: ${targetText}`,
        rationale: isIcu
          ? `ADA 2026 Ch. 16: Bệnh nhân khoa Hồi sức tích cực (ICU) duy trì mục tiêu ${targetText}; khởi truyền insulin tĩnh mạch liên tục khi đường huyết từ ${icuMaxMmol.toFixed(1)} mmol/L (${icuMaxMgdl} mg/dL) và tránh hạ đường huyết (dưới ${hypoMmol.toFixed(1)} mmol/L).`
          : `ADA 2026 Ch. 16 & QĐ 5481/QĐ-BYT: Bệnh nhân khoa thường (Non-ICU) duy trì mục tiêu ${targetText}; tránh hạ đường huyết (dưới ${hypoMmol.toFixed(1)} mmol/L) và tránh đường huyết trên ${wardMaxMmol.toFixed(1)} mmol/L.`,
        gates: [],
        citationIds: isIcu
          ? ['ada.dm2.2026.icu_target', 'ada.dm2.2026.inpatient_target', 'byt.dm2.2020.inpatient_target_140']
          : ['ada.dm2.2026.inpatient_target', 'byt.dm2.2020.inpatient_target_140'],
        priority: 100,
        profileDiff: {
          INTL: `ADA 2026 Ch. 16: Khoa thường hướng tới ${wardMinMmol.toFixed(1)}–${wardMaxMmol.toFixed(1)} mmol/L (${wardMinMgdl}–${wardMaxMgdl} mg/dL) nếu không hạ đường huyết; ICU giữ ${icuMinMmol.toFixed(1)}–${icuMaxMmol.toFixed(1)} mmol/L (${icuMinMgdl}–${icuMaxMgdl} mg/dL).`,
          VN: `QĐ 5481/QĐ-BYT 2020 & QĐ 1353/QĐ-BYT 2021: Đa số bệnh nhân nội trú duy trì mục tiêu ${icuMinMmol.toFixed(1)}–${icuMaxMmol.toFixed(1)} mmol/L (${icuMinMgdl}–${icuMaxMgdl} mg/dL).`,
          US: `ADA Standards of Care 2026 Ch. 16: Non-ICU ${wardMinMgdl}–${wardMaxMgdl} mg/dL; ICU ${icuMinMgdl}–${icuMaxMgdl} mg/dL.`
        }
      };
    },
    citationIds: ['ada.dm2.2026.inpatient_target', 'ada.dm2.2026.icu_target', 'byt.dm2.2020.inpatient_target_140']
  },

  // 2A. PHÁC ĐỒ INSULIN NỀN NỘI TRÚ (CHUYỂN ĐỔI AN TOÀN TỪ PREMIX/NPH, GIẢM 20–25% KHI NPO/MỔ/ĂN KÉM, CHẶN FDC GLP-1)
  {
    id: 'dm2.inpatient.basal_bolus_regimen',
    module: 'dm2',
    nameVi: 'Phác đồ insulin nền nội trú (Basal-Bolus / Basal-Plus thay thế thang trượt đơn độc)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isActivelyHypoglycemic(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed || isIcuSetting(ctx)) return false;
      return true;
    },
    produce: (ctx) => {
      const glucose = need(ctx, 'glucose');
      const weight = need(ctx, 'weight');
      const age = need(ctx, 'age');
      const egfr = getEffectiveEgfr(ctx);
      const eatingStatus = typeof ctx.patient.customInputs?.inpatientEating === 'string'
        ? ctx.patient.customInputs.inpatientEating
        : 'normal';
      const wardMaxMmol = thFor('glucose', 'dm2.glucose.inpatient_target_max_mmol');
      const icuMinMmol = thFor('glucose', 'dm2.glucose.icu_target_min_mmol');

      const rawLongBasalId = LONG_ACTING_BASAL_IDS.find((id) => isTakingCanonical(ctx, id) && !hasDrugAllergy(ctx, id));
      const rawBasalMed = rawLongBasalId ? findActiveMedByCanonical(ctx, rawLongBasalId) : undefined;
      const isBasalFdcBlocked = rawLongBasalId
        ? Boolean(getFdcBlockedCompanionReason(ctx, rawBasalMed, rawLongBasalId))
        : false;
      const cleanExistingLongBasalId = rawLongBasalId && !isBasalFdcBlocked ? rawLongBasalId : undefined;

      const hasAnyHomeInsulin =
        Boolean(rawLongBasalId) ||
        isTakingCanonical(ctx, 'insulin_nph') ||
        isTakingCanonical(ctx, 'insulin_premix') ||
        isTakingAnyCanonical(ctx, BOLUS_INSULIN_IDS);

      if (!hasAnyHomeInsulin) {
        if (glucose === undefined) {
          return missingInputRec(
            'dm2',
            'glucose',
            'xác định mức tăng đường huyết nội viện trước khi khởi trị insulin nền',
            ['ada.dm2.2026.inpatient_target']
          );
        }
        if (glucose < wardMaxMmol) {
          return {
            id: 'rec_dm2_inpatient_poc_monitor',
            module: 'dm2',
            tier: 'Phác đồ Insulin nội trú',
            tierOrder: 2,
            action: 'MONITOR',
            title: `Đường huyết nội viện trong ngưỡng mục tiêu (${glucose.toFixed(1)} < ${wardMaxMmol.toFixed(1)} mmol/L): Theo dõi đường huyết mao mạch`,
            rationale:
              `ADA 2026 Ch. 16: Bệnh nhân chưa dùng insulin tại nhà hiện có glucose ${glucose.toFixed(1)} mmol/L (dưới ${wardMaxMmol.toFixed(1)} mmol/L). Chưa cần khởi trị thường quy Basal-Bolus; tiếp tục theo dõi đường huyết mao mạch trước bữa ăn / mỗi 4–6 giờ và chỉ khởi trị insulin nền–nhanh nếu tăng đường huyết dai dẳng từ ${wardMaxMmol.toFixed(1)} mmol/L trở lên.`,
            gates: [],
            citationIds: ['ada.dm2.2026.inpatient_target', 'ada.dm2.2026.inpatient_no_sliding_scale_alone'],
            priority: 85
          };
        }
      }

      if (weight === undefined && computeHomeTotalInsulinUnits(ctx) === undefined) {
        return missingInputRec(
          'dm2',
          'weight',
          'tính toán tổng liều insulin nội viện (TDD) chuẩn theo cân nặng',
          ['ada.dm2.2026.inpatient_target']
        );
      }

      const isSensitive =
        (age !== undefined && age >= thFor('age', 'dm2.elderly.age_threshold')) ||
        (egfr !== undefined && egfr < thFor('egfr', 'dm2.ckd.egfr_threshold')) ||
        eatingStatus === 'poor' ||
        Boolean(ctx.patient.customInputs?.recentHypo);

      const bb = weight !== undefined
        ? computeInsulin({
            weight,
            setting: 'inpatient',
            clinicalContext: isSensitive ? 'sensitive' : 'standard'
          }).inpatientBasalBolus!
        : undefined;

      const isConvertingFromPremixOrNph =
        !cleanExistingLongBasalId &&
        (isTakingCanonical(ctx, 'insulin_premix') ||
          (!Boolean(ctx.patient.customInputs?.onSteroidTherapy) && isTakingCanonical(ctx, 'insulin_nph')));

      const homeTdd = computeHomeTotalInsulinUnits(ctx);
      const convPct =
        eatingStatus === 'poor' && glucose !== undefined && glucose < icuMinMmol
          ? 100 - thFor('percentage', 'dm2.perioperative.basal_reduce_pct') // qa-allow: unit-conversion - Quy đổi 75% khi vừa ăn kém vừa đường huyết thấp < 7.8 mmol/L
          : thFor('percentage', 'dm2.inpatient.home_insulin_conversion_pct');

      const convertedBasalUnits =
        isConvertingFromPremixOrNph && homeTdd !== undefined && homeTdd > 0
          ? Math.max(1, Math.round((homeTdd * (convPct / 100)) * (thFor('percentage', 'dm2.insulin.basal_share_of_tdd_pct') / 100))) // qa-allow: unit-conversion - Tính 50% phần nền từ tổng liều quy đổi nội viện
          : undefined;

      const targetBasalUnits = convertedBasalUnits ?? bb?.basalUnits ?? 10; // qa-allow: unit-conversion - Liều tham chiếu tối thiểu khi chỉ có dữ liệu quy đổi

      const chosenBasalId =
        cleanExistingLongBasalId ||
        (!hasDrugAllergy(ctx, 'insulin_glargine') ? 'insulin_glargine' : 'insulin_degludec');
      const activeBasalMed = cleanExistingLongBasalId ? rawBasalMed : undefined;
      const chosenBasalName = cleanExistingLongBasalId
        ? resolveDrugNameVi(cleanExistingLongBasalId, activeBasalMed)
        : resolveDrugNameVi(chosenBasalId);

      const hasRecentHypo = Boolean(ctx.patient.customInputs?.recentHypo);
      const needsBasalDoseReduction =
        Boolean(cleanExistingLongBasalId) &&
        (hasRecentHypo ||
          eatingStatus === 'npo' ||
          hasPlannedSurgery(ctx) ||
          (eatingStatus === 'poor' && glucose !== undefined && glucose < wardMaxMmol));

      const reducePct =
        eatingStatus === 'npo' || hasPlannedSurgery(ctx)
          ? thFor('percentage', 'dm2.perioperative.basal_reduce_pct')
          : thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');

      const homeBasalInfo = extractBasalInsulinInfo(ctx);
      const currentHomeBasalUnits =
        cleanExistingLongBasalId && homeBasalInfo.canonicalId === cleanExistingLongBasalId
          ? homeBasalInfo.basalDoseUnits
          : undefined;
      const reducedExistingBasalUnits =
        currentHomeBasalUnits !== undefined && currentHomeBasalUnits > 0
          ? Math.max(1, Math.round(currentHomeBasalUnits * (1 - reducePct / 100))) // qa-allow: unit-conversion - Giảm 20-25% liều nền tại nhà khi NPO/mổ/ăn kém
          : undefined;

      const isTubeFeeding = eatingStatus === 'tube_feeding';
      let dosePlan = bb?.scaleAdviceVi || `Tiêm dưới da ${targetBasalUnits} đơn vị/ngày (1 lần/ngày)`;
      if (eatingStatus === 'npo') {
        dosePlan = `Bệnh nhân đang nhịn ăn hoàn toàn (NPO): Chỉ tiêm liều insulin nền (Basal): ${targetBasalUnits} đơn vị/ngày; TẠM HOÃN liều bolus trước bữa ăn; kết hợp thang hiệu chỉnh mỗi 4–6 giờ.`;
      } else if (isTubeFeeding) {
        dosePlan = `Nuôi dưỡng qua ống thông (Tube feeding): Tiêm liều insulin nền ${targetBasalUnits} đơn vị/ngày, phối hợp insulin dinh dưỡng mỗi 6 giờ theo lịch bơm sonde.`;
      } else if (convertedBasalUnits !== undefined) {
        dosePlan = `Chuyển đổi nội viện (${convPct}% tổng liều ${homeTdd} U/ngày tại nhà): Tiêm ${chosenBasalName} ${convertedBasalUnits} đơn vị x 1 lần/ngày${eatingStatus === 'poor' && glucose !== undefined && glucose < icuMinMmol ? ' (Phác đồ Basal–Plus: tạm hoãn bolus cố định trước ăn do ăn kém và glucose thấp)' : ', phối hợp insulin nhanh bữa ăn'}`;
      }

      const action = cleanExistingLongBasalId
        ? needsBasalDoseReduction
          ? 'REDUCE'
          : 'CONTINUE'
        : 'START';
      const activeDoseText = formatActiveMedDose(activeBasalMed, chosenBasalId);

      const basalCitations: string[] = [
        'ada.dm2.2026.inpatient_no_sliding_scale_alone',
        'ada.dm2.2026.inpatient_target',
        'byt.dm2.2021.inpatient_insulin_1353'
      ];
      if (isTubeFeeding) basalCitations.push('ada.dm2.2026.tube_feeding_insulin');
      if (needsBasalDoseReduction) basalCitations.push('ada.dm2.2026.perioperative_oral_basal_25');
      if (isConvertingFromPremixOrNph) basalCitations.push('ada.dm2.2026.inpatient_premix_avoid');

      return {
        id: 'rec_dm2_inpatient_basal_bolus',
        module: 'dm2',
        tier: 'Phác đồ Insulin nội trú',
        tierOrder: 2,
        action,
        drugId: chosenBasalId,
        drugNameVi: chosenBasalName,
        dose:
          cleanExistingLongBasalId && needsBasalDoseReduction
            ? reducedExistingBasalUnits !== undefined
              ? `Giảm ${reducePct}% liều ${chosenBasalName} tại nhà (từ ${currentHomeBasalUnits} đơn vị xuống ~${reducedExistingBasalUnits} đơn vị/ngày)${eatingStatus === 'npo' ? ' do đang nhịn ăn (NPO)' : hasPlannedSurgery(ctx) ? ' chuẩn bị phẫu thuật' : ' để phòng hạ đường huyết nội viện'}`
              : `Giảm ${reducePct}% liều ${chosenBasalName} đang dùng tại nhà (tham chiếu cân nặng: ${targetBasalUnits} đơn vị/ngày)`
            : cleanExistingLongBasalId && activeDoseText
              ? `${activeDoseText} (liều nền nội viện tham chiếu: ${targetBasalUnits} đơn vị/ngày; hiệu chỉnh theo đường huyết mao mạch)`
              : dosePlan,
        title:
          cleanExistingLongBasalId && needsBasalDoseReduction
            ? `Giảm ${reducePct}% liều ${chosenBasalName} nội viện khi ${eatingStatus === 'npo' ? 'nhịn ăn (NPO)' : hasPlannedSurgery(ctx) ? 'chu phẫu' : 'ăn kém / nguy cơ hạ ĐH'}`
            : isBasalFdcBlocked
              ? `Chuyển sang ${chosenBasalName} đơn chất trong phác đồ nội viện (Thay cho bút phối hợp GLP-1)`
              : 'Chỉ định Insulin nền trong phác đồ Basal-Bolus / Basal-Plus nội viện (Không dùng thang trượt đơn độc)',
        rationale:
          'Khuyến cáo ADA 2026 Ch. 16 (Khuyến cáo 16.6–16.7): Không sử dụng thang trượt insulin (sliding scale) đơn độc do tăng dao động đường huyết và biến cố hạ đường huyết. Ưu tiên phác đồ Basal-Bolus hoặc Basal-Plus có chuẩn độ theo cân nặng, chức năng thận, tổng liều tại nhà và mức độ ăn uống.',
        gates: [],
        citationIds: basalCitations,
        priority: 95,
        profileDiff: {
          INTL: 'ADA 2026 Ch. 16: Ưu tiên Basal-Bolus hoặc Basal-Plus; không khuyến cáo dùng insulin trộn sẵn (premixed) thường quy nội viện.',
          VN: 'Quyết định 1353/QĐ-BYT năm 2021: Ở bệnh nhân nội trú không nguy kịch và ăn uống đều đặn, Basal-Bolus là lựa chọn chuẩn.',
          US: 'ADA Standards of Care 2026 Ch. 16: Basal-bolus or basal-plus correction regimen preferred over prolonged sole sliding-scale insulin.'
        }
      };
    },
    citationIds: [
      'ada.dm2.2026.inpatient_no_sliding_scale_alone',
      'ada.dm2.2026.inpatient_target',
      'byt.dm2.2021.inpatient_insulin_1353'
    ]
  }
];
