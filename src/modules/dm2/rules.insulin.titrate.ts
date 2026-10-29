/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Duy trì / Chuẩn độ Insulin Nền Ngoại trú & Cảnh báo Overbasalization
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  BASAL_OR_PREMIX_IDS,
  BOLUS_INSULIN_IDS,
  INCRETIN_RA_IDS,
  SGLT2_IDS,
  computeIndividualizedHba1cTarget,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  formatActiveMedDose,
  getEffectiveEgfr,
  getFdcBlockedCompanionReason,
  getMaxBasalDosePerKg,
  hasActiveFootUlcer,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasHepaticImpairment,
  hasHf,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isOvertreatedFrailDeferral,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  pickFirstNonAllergicCandidate,
  resolveDrugNameVi,
  willStartOrContinueGlp1
} from './helpers';
import { shouldDeintensifyHypoMeds } from './rules.safety.deintensify';

export const dm2InsulinTitrateRules: Rule[] = [
  // 1. DUY TRÌ & CHUẨN ĐỘ INSULIN NỀN NGOẠI TRÚ KHI CHƯA TỚI NGƯỠNG DỊ HÓA
  {
    id: 'dm2.outpatient.basal_insulin_maintenance',
    module: 'dm2',
    nameVi: 'Duy trì hoặc chuẩn độ liều Insulin nền đang sử dụng ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isCrisis || hasPlannedSurgery(ctx)) return false;
      if (shouldDeintensifyHypoMeds(ctx)) return false;
      if (isTakingCanonical(ctx, 'insulin_premix') && isTakingAnyCanonical(ctx, BOLUS_INSULIN_IDS)) return false;

      const onSteroid = Boolean(ctx.patient.customInputs?.onSteroidTherapy);
      const glucose = need(ctx, 'glucose');
      const hba1c = need(ctx, 'hba1c');
      const isEarlyInsTriggered =
        !onSteroid &&
        (Boolean(ctx.patient.customInputs?.catabolicSymptoms) ||
          (glucose !== undefined && glucose >= thFor('glucose', 'dm2.early_insulin.glucose_mmol')) ||
          (hba1c !== undefined && hba1c >= thFor('hba1c', 'dm2.early_insulin.hba1c')));
      if (isEarlyInsTriggered) return false;

      const egfr = getEffectiveEgfr(ctx);
      const startingCardiorenal =
        (!isTakingAnyCanonical(ctx, SGLT2_IDS) &&
          !isOnDialysis(ctx) &&
          !hasHepaticImpairment(ctx) &&
          !hasActiveFootUlcer(ctx) &&
          !isOvertreatedFrailDeferral(ctx) &&
          Boolean(pickFirstNonAllergicCandidate(ctx, ['dapagliflozin', 'empagliflozin'])) &&
          egfr !== undefined &&
          egfr >= thFor('egfr', 'ckd.sglt2i.egfr_initiate_min') &&
          (hasHf(ctx) || hasCkd(ctx) || hasAscvd(ctx))) ||
        (!isTakingAnyCanonical(ctx, INCRETIN_RA_IDS) && willStartOrContinueGlp1(ctx));
      if (startingCardiorenal && hba1c !== undefined && hba1c <= thFor('hba1c', 'dm2.hba1c.target_standard')) {
        return false;
      }

      const activeBasalIds = BASAL_OR_PREMIX_IDS.filter((id) => {
        if (!isTakingCanonical(ctx, id)) return false;
        if (onSteroid && id === 'insulin_nph') return false;
        return true;
      });
      return activeBasalIds.length > 0 || (!onSteroid && extractBasalInsulinInfo(ctx).hasAnyInsulin); // qa-allow: index - Kiểm tra có ít nhất 1 insulin nền
    },
    produce: (ctx) => {
      const onSteroid = Boolean(ctx.patient.customInputs?.onSteroidTherapy);
      const activeBasalId =
        BASAL_OR_PREMIX_IDS.find((id) => isTakingCanonical(ctx, id) && !(onSteroid && id === 'insulin_nph')) ||
        extractBasalInsulinInfo(ctx).activeBasalDrugId ||
        'insulin_glargine';
      const med = findActiveMedByCanonical(ctx, activeBasalId);
      const fdcBlockedReason = getFdcBlockedCompanionReason(ctx, med, activeBasalId);

      const weight = need(ctx, 'weight');
      const hba1c = need(ctx, 'hba1c');
      const glucose = need(ctx, 'glucose');
      const diff = need(ctx, 'bedtimeToMorningDiff');
      const basalInfo = extractBasalInsulinInfo(ctx);
      const curUnits = basalInfo.basalDoseUnits;
      const maxDosePerKg = getMaxBasalDosePerKg();
      const diffThresh = thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mmol');
      const fpgTargetMax = thFor('glucose', 'dm2.glucose.fpg_target_max_mmol');
      const glargineTitration = drug('insulin_glargine').titration;
      const titrateStep = glargineTitration?.step ?? '';
      const titrateDays = glargineTitration?.intervalDays;
      const fixedStart = thFor('dose_units', 'dm2.insulin_glargine.fixed_start');

      // Trường hợp đang dùng bút phối hợp cố định Basal + GLP-1 (Soliqua / Xultophy) nhưng thành phần GLP-1 bị chống chỉ định
      if (fdcBlockedReason) {
        const standaloneName = resolveDrugNameVi(activeBasalId);
        const fdcName = resolveDrugNameVi(activeBasalId, med);
        const eqUnits = curUnits !== undefined && curUnits > 0 ? curUnits : fixedStart;
        return {
          id: 'rec_dm2_basal_insulin_maintenance',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'START',
          drugId: activeBasalId,
          drugNameVi: standaloneName,
          dose: `${eqUnits} đơn vị/ngày tiêm dưới da dạng bút ${standaloneName} đơn chất (theo dõi sát đường huyết đói để chuẩn độ)`,
          title: `Chuyển sang ${standaloneName} đơn chất (Tách khỏi bút phối hợp ${fdcName})`,
          rationale:
            `Bút phối hợp ${fdcName} bắt buộc ngừng do ${fdcBlockedReason}; chuyển đổi sang bút ${standaloneName} đơn chất ở liều nền tương đương để tránh gián đoạn kiểm soát đường huyết nền.`,
          gates: [],
          citationIds: ['ada.dm2.2026.basal_start_and_titration'],
          priority: 91
        };
      }

      const medName = resolveDrugNameVi(activeBasalId, med);
      const isOverbasalized =
        (weight !== undefined && weight > 0 && curUnits !== undefined && curUnits / weight > maxDosePerKg) ||
        (diff !== undefined && diff >= diffThresh);

      const targetHba1c = computeIndividualizedHba1cTarget(ctx);
      const isFpgAtGoal = glucose !== undefined && glucose <= fpgTargetMax;
      const isUncontrolled =
        (hba1c !== undefined && hba1c >= targetHba1c) ||
        (glucose !== undefined && glucose > fpgTargetMax);

      const egfr = getEffectiveEgfr(ctx);
      const willNewlyStartCardiorenal =
        (!isTakingAnyCanonical(ctx, SGLT2_IDS) &&
          !isOnDialysis(ctx) &&
          !hasHepaticImpairment(ctx) &&
          !hasActiveFootUlcer(ctx) &&
          !isOvertreatedFrailDeferral(ctx) &&
          Boolean(pickFirstNonAllergicCandidate(ctx, ['dapagliflozin', 'empagliflozin'])) &&
          egfr !== undefined &&
          egfr >= thFor('egfr', 'ckd.sglt2i.egfr_initiate_min') &&
          (hasHf(ctx) || hasCkd(ctx) || hasAscvd(ctx))) ||
        (!isTakingAnyCanonical(ctx, INCRETIN_RA_IDS) && willStartOrContinueGlp1(ctx));

      const holdTitrationForNewCardiorenal =
        willNewlyStartCardiorenal &&
        hba1c !== undefined &&
        hba1c < thFor('hba1c', 'dm2.hba1c.target_older_complex');

      const rawDoseFmt = formatActiveMedDose(med, activeBasalId)?.replace(/^Duy trì liều đang dùng:\s*/i, '');
      const activeDoseStr =
        rawDoseFmt ||
        (curUnits !== undefined ? `${curUnits} đơn vị/ngày` : 'liều hiện tại');

      // Nếu FPG đã đạt đích (<= 7.2 mmol/L) nhưng HbA1c còn cao -> tăng ĐH sau ăn, KHÔNG tăng thêm Insulin nền (DM2-R3-R3-05)
      if (isFpgAtGoal && hba1c !== undefined && hba1c >= targetHba1c) {
        return {
          id: 'rec_dm2_basal_insulin_maintenance',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'CONTINUE',
          drugId: activeBasalId,
          drugNameVi: medName,
          dose: `Giữ nguyên ${activeDoseStr} (không tăng thêm liều nền khi đường huyết đói đã đạt đích; đánh giá đường huyết sau ăn)`,
          title: `Giữ nguyên liều nền ${medName} (FPG ${glucose!.toFixed(1)} mmol/L đã đạt đích ≤ ${fpgTargetMax.toFixed(1)} mmol/L – Cần xử trí tăng đường huyết sau ăn)`,
          rationale:
            `ADA 2026 Ch. 9 (Rec 9.20–9.21): Đường huyết lúc đói hiện tại (${glucose!.toFixed(1)} mmol/L) đã nằm trong vùng mục tiêu ngoại trú (≤ ${fpgTargetMax.toFixed(1)} mmol/L) trong khi HbA1c (${hba1c.toFixed(1)}%) còn cao cho thấy nguyên nhân chính là tăng đường huyết sau ăn. Tuyệt đối không tăng thêm insulin nền (nguy cơ hạ đường huyết ban đêm/sáng sớm); cần theo dõi đường huyết sau ăn và ưu tiên bổ sung GLP-1 RA, SGLT2i hoặc insulin nhanh bữa ăn chính.`,
          gates: [],
          citationIds: ['ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.overbasalization', 'ada.dm2.2026.glp1_preferred_over_insulin'],
          priority: 89
        };
      }

      if (
        isUncontrolled &&
        !isOverbasalized &&
        !isFpgAtGoal &&
        !holdTitrationForNewCardiorenal &&
        !Boolean(ctx.patient.customInputs?.recentHypo)
      ) {
        return {
          id: 'rec_dm2_basal_insulin_maintenance',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'UPTITRATE',
          drugId: activeBasalId,
          drugNameVi: medName,
          dose: `Chuẩn độ tăng thêm ${titrateStep} mỗi ${titrateDays} ngày từ mức ${activeDoseStr} dựa theo đường huyết mao mạch lúc đói (đích ≤ ${fpgTargetMax.toFixed(1)} mmol/L)`,
          title: `Chuẩn độ tăng liều ${medName} để đạt mục tiêu đường huyết (HbA1c hiện ${hba1c?.toFixed(1) ?? '?'}%)`,
          rationale:
            `ADA 2026 Ch. 9 (Khuyến cáo 9.20) & BYT 5481/2020: Người bệnh đang tiêm ${medName} (${activeDoseStr}) chưa vượt ngưỡng quá liều nền nhưng chưa đạt mục tiêu đường huyết đói (≤ ${fpgTargetMax.toFixed(1)} mmol/L) và HbA1c (< ${targetHba1c.toFixed(1)}%); cần chuẩn độ tăng dần từng bậc ${titrateStep} mỗi ${titrateDays} ngày cho tới khi đường huyết đói đạt đích mà không gây hạ đường huyết.`,
          gates: [],
          citationIds: ['ada.dm2.2026.basal_start_and_titration'],
          priority: 90
        };
      }

      return {
        id: 'rec_dm2_basal_insulin_maintenance',
        module: 'dm2',
        tier: 'Kiểm soát đường huyết',
        tierOrder: 3,
        action: 'CONTINUE',
        drugId: activeBasalId,
        drugNameVi: medName,
        dose: isOverbasalized
          ? `Giữ/rà soát liều ${activeDoseStr} (không tăng thêm liều nền đơn độc; phối hợp thêm GLP-1 RA hoặc Insulin bữa ăn)`
          : holdTitrationForNewCardiorenal
            ? `Giữ ổn định ${activeDoseStr} (hoặc giảm nhẹ 10–20% nếu đường huyết đói sát ngưỡng thấp khi vừa khởi trị SGLT2i / GLP-1 RA)` // qa-allow: unit-conversion - Hướng dẫn lâm sàng giữ ổn định liều khi bổ sung thuốc mới
            : `Tiếp tục duy trì ${activeDoseStr} và theo dõi đường huyết lúc đói`,
        title: isOverbasalized
          ? `Duy trì & Không tăng thêm liều nền ${medName} (Cần phối hợp GLP-1 RA / Insulin bữa ăn)`
          : holdTitrationForNewCardiorenal
            ? `Giữ ổn định liều ${medName} trong giai đoạn mới bổ sung thuốc bảo vệ tim – thận`
            : `Duy trì ${medName} kiểm soát đường huyết ổn định`,
        rationale: isOverbasalized
          ? `ADA 2026 Ch. 9: Bệnh nhân đã có dấu hiệu quá liều insulin nền (overbasalization) trên liều ${activeDoseStr}; cần giữ/tối ưu liều nền hiện tại và bổ sung GLP-1 RA hoặc insulin nhanh trước bữa ăn chính thay vì tiếp tục nâng liều nền.`
          : holdTitrationForNewCardiorenal
            ? `ADA 2026 Ch. 9: Khi vừa khởi trị bổ sung SGLT2i và/hoặc GLP-1 RA ở bệnh nhân có HbA1c ${hba1c?.toFixed(1)}%, không nên đồng thời tăng liều ${medName} ngay để tránh cộng hưởng hạ đường huyết; đánh giá lại sau khi ổn định liều mới.`
            : `ADA 2026 Ch. 9 & BYT 5481/2020: Tiếp tục duy trì liều ${medName} hiện tại (${activeDoseStr}) khi đường huyết ổn định và không có hạ đường huyết.`,
        gates: [],
        citationIds: ['ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.overbasalization'],
        priority: 88
      };
    },
    citationIds: ['ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.overbasalization']
  },

  // 2. CẢNH BÁO QUÁ LIỀU INSULIN NỀN (OVERBASALIZATION - CHỨNG CỨ ĐTĐ TÍP 2 CHUẨN ADA 2026)
  {
    id: 'dm2.outpatient.overbasalization',
    module: 'dm2',
    nameVi: 'Cảnh báo quá liều insulin nền (Overbasalization)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
      const weight = need(ctx, 'weight');
      const glucose = need(ctx, 'glucose');
      const hba1c = need(ctx, 'hba1c');
      const basalInfo = extractBasalInsulinInfo(ctx);
      const { basalDoseUnits } = basalInfo;
      const diff = need(ctx, 'bedtimeToMorningDiff');
      const maxDosePerKg = getMaxBasalDosePerKg();
      const diffThresh = thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mmol');
      const fpgTargetMax = thFor('glucose', 'dm2.glucose.fpg_target_max_mmol');
      const isDoseHigh =
        weight !== undefined && weight > 0 && basalDoseUnits !== undefined && basalDoseUnits / weight > maxDosePerKg;
      const isDiffHigh = diff !== undefined && diff >= diffThresh;
      const isPostprandialGap =
        (basalInfo.hasAnyInsulin || BASAL_OR_PREMIX_IDS.some((id) => isTakingCanonical(ctx, id))) &&
        !basalInfo.isPremix &&
        !isTakingAnyCanonical(ctx, BOLUS_INSULIN_IDS) &&
        glucose !== undefined &&
        glucose <= fpgTargetMax &&
        hba1c !== undefined &&
        hba1c >= computeIndividualizedHba1cTarget(ctx);
      return isDoseHigh || isDiffHigh || isPostprandialGap;
    },
    produce: (ctx) => {
      const weight = need(ctx, 'weight');
      const glucose = need(ctx, 'glucose');
      const hba1c = need(ctx, 'hba1c');
      const { basalDoseUnits } = extractBasalInsulinInfo(ctx);
      const diff = need(ctx, 'bedtimeToMorningDiff');
      const maxDosePerKg = getMaxBasalDosePerKg();
      const diffThresh = thFor('glucose', 'dm2.overbasal.bedtime_morning_diff_mmol');
      const fpgTargetMax = thFor('glucose', 'dm2.glucose.fpg_target_max_mmol');

      const isDoseHigh =
        weight !== undefined && weight > 0 && basalDoseUnits !== undefined && basalDoseUnits / weight > maxDosePerKg;
      const isDiffHigh = diff !== undefined && diff >= diffThresh;
      const isPostprandialGap =
        glucose !== undefined &&
        glucose <= fpgTargetMax &&
        hba1c !== undefined &&
        hba1c >= computeIndividualizedHba1cTarget(ctx);

      const reasons: string[] = [];
      if (isDoseHigh && weight !== undefined && basalDoseUnits !== undefined) {
        reasons.push(`liều nền ${(basalDoseUnits / weight).toFixed(2)} U/kg/ngày (vượt ${maxDosePerKg} U/kg/ngày)`);
      }
      if (isDiffHigh && diff !== undefined) {
        reasons.push(`chênh lệch đường huyết tối – sáng ${diff.toFixed(1)} mmol/L (từ ${diffThresh} mmol/L trở lên)`);
      }
      if (isPostprandialGap && glucose !== undefined && hba1c !== undefined) {
        reasons.push(`FPG đã đạt đích (${glucose.toFixed(1)} ≤ ${fpgTargetMax.toFixed(1)} mmol/L) nhưng HbA1c còn cao (${hba1c.toFixed(1)}%)`);
      }
      const reasonStr = reasons.join(' và ');

      return {
        id: 'rec_dm2_overbasalization',
        module: 'dm2',
        tier: 'Kiểm soát đường huyết',
        tierOrder: 3,
        action: 'CONSIDER',
        title: `Cảnh báo quá liều insulin nền (Overbasalization): ${reasonStr}`,
        rationale:
          `ADA 2026 Ch. 9: Dấu hiệu quá liều insulin nền (${reasonStr}) cho thấy việc tăng thêm insulin nền đơn độc sẽ làm tăng nguy cơ hạ đường huyết ban đêm mà không cải thiện HbA1c. Cần ngừng tăng liều nền và ưu tiên bổ sung đồng vận GLP-1 / GIP-GLP-1 RA hoặc thêm mũi insulin tác dụng nhanh trước bữa ăn lớn nhất.`,
        gates: [],
        citationIds: [
          'ada.dm2.2026.overbasalization',
          'ada.dm2.2026.t2d_tdd_1ukg',
          'ada.dm2.2026.basal_50pct_tdd',
          'ada.dm2.2026.overbasalization_combo_injectable',
          'ada.dm2.2026.glp1_preferred_over_insulin'
        ],
        priority: 89
      };
    },
    citationIds: [
      'ada.dm2.2026.overbasalization',
      'ada.dm2.2026.t2d_tdd_1ukg',
      'ada.dm2.2026.basal_50pct_tdd',
      'ada.dm2.2026.overbasalization_combo_injectable'
    ]
  }
];
