/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Y lệnh Insulin Bữa ăn, Basal-Plus & Nuôi ăn Sonde Nội viện
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { computeInsulin } from '../../engine/calculators/insulin';
import { thFor } from '../../kb-types/access';
import {
  BASAL_INSULIN_IDS,
  BOLUS_INSULIN_IDS,
  LONG_ACTING_BASAL_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasDm2Context,
  hasDrugAllergy,
  isActivelyHypoglycemic,
  isIcuSetting,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  resolveCanonicalDrugIds,
  resolveDrugNameVi,
  resolveTargetRecDrug
} from './helpers';
import { computeHomeTotalInsulinUnits } from './rules.inpatient';

function findStandaloneBolusId(ctx: Parameters<Rule['when']>[0]): string | undefined {
  return BOLUS_INSULIN_IDS.find((id) => {
    if (hasDrugAllergy(ctx, id)) return false;
    return ctx.patient.currentMeds.some((m) => {
      const ids = resolveCanonicalDrugIds(m.drugId, m.name);
      return ids.length === 1 && ids[0] === id; // qa-allow: index - Chỉ khớp insulin bữa ăn đơn chất (loại trừ Premix)
    });
  });
}

export const dm2InpatientPrandialRules: Rule[] = [
  {
    id: 'dm2.inpatient.prandial_bolus_regimen',
    module: 'dm2',
    nameVi: 'Y lệnh Insulin bữa ăn, Basal-Plus hoặc Insulin nuôi ăn qua ống thông (Tube feeding) nội viện',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isActivelyHypoglycemic(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed || isIcuSetting(ctx)) return false;
      const eatingStatus = ctx.patient.customInputs?.inpatientEating;
      if (eatingStatus === 'npo') {
        return Boolean(findStandaloneBolusId(ctx));
      }
      return need(ctx, 'weight') !== undefined || computeHomeTotalInsulinUnits(ctx) !== undefined;
    },
    produce: (ctx) => {
      const weight = need(ctx, 'weight');
      const glucose = need(ctx, 'glucose');
      const age = need(ctx, 'age');
      const egfr = getEffectiveEgfr(ctx);
      const wardMaxMmol = thFor('glucose', 'dm2.glucose.inpatient_target_max_mmol');
      const icuMinMmol = thFor('glucose', 'dm2.glucose.icu_target_min_mmol');
      const eatingStatus = typeof ctx.patient.customInputs?.inpatientEating === 'string'
        ? ctx.patient.customInputs.inpatientEating
        : 'normal';

      const activeBolusId = findStandaloneBolusId(ctx);

      // NPO: Phát lệnh HOLD không có dose cho insulin bữa ăn (Premix đã được STOP riêng bởi stop_home_premix)
      if (eatingStatus === 'npo') {
        if (activeBolusId) {
          const med = findActiveMedByCanonical(ctx, activeBolusId);
          const target = resolveTargetRecDrug(activeBolusId, med);
          return {
            id: 'rec_dm2_inpatient_prandial_hold_npo',
            module: 'dm2',
            tier: 'Phác đồ Insulin nội trú',
            tierOrder: 2,
            action: 'HOLD',
            drugId: target.drugId,
            drugNameVi: target.drugNameVi,
            title: `Tạm hoãn ${target.drugNameVi} định kỳ trước bữa ăn do bệnh nhân nhịn ăn (NPO)`,
            rationale:
              'ADA 2026 Ch. 16 (Khuyến cáo 16.6): Khi người bệnh nhịn ăn hoàn toàn (NPO), bắt buộc tạm hoãn toàn bộ liều insulin bữa ăn định kỳ để phòng ngừa hạ đường huyết nội viện (chỉ dùng liều hiệu chỉnh nếu tăng đường huyết).',
            gates: [],
            citationIds: ['ada.dm2.2026.prandial_insulin_eating', 'ada.dm2.2026.inpatient_no_sliding_scale_alone'],
            priority: 94
          };
        }
        return null;
      }

      const hasAnyHomeInsulin =
        Boolean(activeBolusId) ||
        isTakingCanonical(ctx, 'insulin_premix') ||
        isTakingAnyCanonical(ctx, BASAL_INSULIN_IDS);

      if (!hasAnyHomeInsulin && (glucose === undefined || glucose < wardMaxMmol)) {
        return null;
      }

      // ĂN KÉM KÈM ĐƯỜNG HUYẾT THẤP-BÌNH THƯỜNG (< 7.8 mmol/L, vd S73 glucose 5.6): Ưu tiên Basal-Plus, KHÔNG tiêm bolus cố định trước ăn!
      if (eatingStatus === 'poor' && glucose !== undefined && glucose < icuMinMmol) {
        if (activeBolusId) {
          const med = findActiveMedByCanonical(ctx, activeBolusId);
          const target = resolveTargetRecDrug(activeBolusId, med);
          return {
            id: 'rec_dm2_inpatient_prandial_hold_poor_low_bg',
            module: 'dm2',
            tier: 'Phác đồ Insulin nội trú',
            tierOrder: 2,
            action: 'HOLD',
            drugId: target.drugId,
            drugNameVi: target.drugNameVi,
            title: `Tạm hoãn ${target.drugNameVi} cố định trước ăn do bệnh nhân ăn kém và đường huyết ${glucose.toFixed(1)} mmol/L (Áp dụng Basal–Plus)`,
            rationale:
              `ADA 2026 Ch. 16: Ở người bệnh ăn uống kém kèm đường huyết trước ăn gần giới hạn dưới (${glucose.toFixed(1)} dưới ${icuMinMmol.toFixed(1)} mmol/L), ưu tiên phác đồ Basal–Plus (chỉ tiêm mũi hiệu chỉnh hoặc tiêm liều giảm nhỏ ngay sau ăn tương ứng lượng carbohydrate thực sự ăn được) để phòng hạ đường huyết nội viện.`,
            gates: [],
            citationIds: ['ada.dm2.2026.prandial_insulin_eating', 'ada.dm2.2026.inpatient_no_sliding_scale_alone'],
            priority: 93
          };
        }
        return {
          id: 'rec_dm2_inpatient_basal_plus_poor_intake',
          module: 'dm2',
          tier: 'Phác đồ Insulin nội trú',
          tierOrder: 2,
          action: 'MONITOR',
          title: `Ăn uống kém kèm glucose ${glucose.toFixed(1)} mmol/L: Áp dụng Basal–Plus (Tạm hoãn bolus cố định trước bữa ăn)`,
          rationale:
            `ADA 2026 Ch. 16 (Khuyến cáo 16.7): Ở bệnh nhân nội viện ăn uống kém/thất thường và glucose hiện tại ${glucose.toFixed(1)} mmol/L (dưới ${icuMinMmol.toFixed(1)} mmol/L), phác đồ Basal–Plus (insulin nền + liều hiệu chỉnh khi tăng đường huyết, hoặc chỉ tiêm insulin tác dụng nhanh giảm liều ngay sau ăn khi xác nhận khẩu phần thực tế) an toàn hơn Basal–Bolus đầy đủ.`,
          gates: [],
          citationIds: ['ada.dm2.2026.prandial_insulin_eating', 'ada.dm2.2026.inpatient_no_sliding_scale_alone'],
          priority: 92
        };
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

      const homeTdd = computeHomeTotalInsulinUnits(ctx);
      const isConvertingFromPremixOrNph =
        !LONG_ACTING_BASAL_IDS.some((id) => isTakingCanonical(ctx, id)) &&
        (isTakingCanonical(ctx, 'insulin_premix') ||
          (!Boolean(ctx.patient.customInputs?.onSteroidTherapy) && isTakingCanonical(ctx, 'insulin_nph')));
      const convPct = thFor('percentage', 'dm2.inpatient.home_insulin_conversion_pct');
      const convertedTotalBolus =
        isConvertingFromPremixOrNph && homeTdd !== undefined && homeTdd > 0
          ? Math.max(3, Math.round((homeTdd * (convPct / 100)) * (thFor('percentage', 'dm2.insulin.basal_share_of_tdd_pct') / 100))) // qa-allow: unit-conversion - Tính 50% tổng phần bolus từ TDD quy đổi
          : undefined;

      const totalBolusUnits = convertedTotalBolus ?? (bb ? bb.totalDailyDoseUnits - bb.basalUnits : 12); // qa-allow: unit-conversion - Tổng bolus chia 3 bữa
      const eachMealUnits = Math.max(1, Math.round(totalBolusUnits / 3)); // qa-allow: unit-conversion - Chia đều 3 bữa ăn chính

      if (eatingStatus === 'tube_feeding') {
        const q6hUnits = Math.max(1, Math.round(totalBolusUnits / 4)); // qa-allow: unit-conversion - Chia tổng liều dinh dưỡng thành 4 cử mỗi 6 giờ
        const alreadyOnRegular = isTakingCanonical(ctx, 'insulin_regular');
        return {
          id: 'rec_dm2_inpatient_tube_feeding_bolus',
          module: 'dm2',
          tier: 'Phác đồ Insulin nội trú',
          tierOrder: 2,
          action: alreadyOnRegular ? 'CONTINUE' : 'START',
          drugId: 'insulin_regular',
          drugNameVi: 'Insulin Regular tiêm dưới da mỗi 6 giờ (hoặc Insulin Aspart mỗi 4 giờ)',
          dose: `Tiêm dưới da ~${q6hUnits} đơn vị Regular insulin mỗi 6 giờ (tổng phần dinh dưỡng ~${totalBolusUnits} đơn vị/ngày) khớp lịch nuôi ăn qua sonde`,
          title: `Insulin dinh dưỡng cho nuôi ăn qua sonde (Tube feeding): ~${q6hUnits} đơn vị Regular mỗi 6 giờ`,
          rationale:
            'Khuyến cáo ADA 2026 Ch. 16: Ở bệnh nhân nuôi ăn qua ống thông liên tục hoặc ngắt quãng, chia phần insulin dinh dưỡng tiêm dưới da mỗi 6 giờ với Regular insulin (hoặc mỗi 4 giờ với insulin tác dụng nhanh). BẮT BUỘC: Nếu nuôi ăn qua sonde bị ngừng đột ngột, tuột sonde hoặc tắc ống, phải lập tức truyền tĩnh mạch dung dịch Dextrose để phòng ngừa hạ đường huyết nặng do insulin nền/dinh dưỡng đã tiêm vẫn còn tác dụng!',
          gates: [],
          warnings: [
            'AN TOÀN SỐNG CÒN KHI NUÔI ĂN QUA SONDE: Nếu ngừng hoặc gián đoạn bơm thức ăn qua sonde vì bất kỳ lý do gì, BẮT BUỘC khởi truyền ngay Dextrose tĩnh mạch để phòng hạ đường huyết nặng!'
          ],
          citationIds: [
            'ada.dm2.2026.tube_feeding_insulin',
            'ada.dm2.2026.tube_feeding_dextrose_interrupt'
          ],
          priority: 93
        };
      }

      const existingRapidId = (['insulin_aspart', 'insulin_lispro'] as const).find(
        (id) => isTakingCanonical(ctx, id) && !hasDrugAllergy(ctx, id)
      );
      const chosenRapidId =
        existingRapidId ||
        (!hasDrugAllergy(ctx, 'insulin_aspart') ? 'insulin_aspart' : 'insulin_lispro');
      const activeRapidMed = existingRapidId ? findActiveMedByCanonical(ctx, existingRapidId) : undefined;
      const hasRecentHypo = Boolean(ctx.patient.customInputs?.recentHypo);
      const reducePct = thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');

      return {
        id: 'rec_dm2_inpatient_prandial_bolus',
        module: 'dm2',
        tier: 'Phác đồ Insulin nội trú',
        tierOrder: 2,
        action: existingRapidId ? (hasRecentHypo || eatingStatus === 'poor' ? 'REDUCE' : 'CONTINUE') : 'START',
        drugId: chosenRapidId,
        drugNameVi: existingRapidId
          ? resolveDrugNameVi(existingRapidId, activeRapidMed)
          : resolveDrugNameVi(chosenRapidId),
        dose:
          existingRapidId && (hasRecentHypo || eatingStatus === 'poor')
            ? `Giảm ${reducePct}% liều bolus bữa ăn${eatingStatus === 'poor' ? ' (có thể tiêm ngay sau ăn tùy lượng ăn thực tế)' : ''} (tham chiếu ~${eachMealUnits} đơn vị/bữa x 3 bữa chính)`
            : `${eachMealUnits} đơn vị tiêm dưới da ngay trước 3 bữa ăn chính (tổng liều bolus ${totalBolusUnits} đơn vị/ngày)${eatingStatus === 'poor' ? '; nếu ăn kém tiêm ngay sau bữa ăn theo tỷ lệ ăn thực tế' : ''} kèm thang hiệu chỉnh`,
        title: `Chỉ định Insulin nhanh bữa ăn (${eachMealUnits} đơn vị x 3 bữa chính)`,
        rationale:
          'ADA 2026 Ch. 16 (Khuyến cáo 16.6): Tách riêng y lệnh insulin tác dụng nhanh trước bữa ăn khi bệnh nhân ăn qua miệng để kiểm soát đường huyết sau ăn chính xác (nếu ăn kém có thể tiêm ngay sau khi xác nhận lượng ăn thực tế).',
        gates: [],
        citationIds: ['ada.dm2.2026.prandial_insulin_eating', 'ada.dm2.2026.inpatient_no_sliding_scale_alone'],
        priority: 93
      };
    },
    citationIds: [
      'ada.dm2.2026.prandial_insulin_eating',
      'ada.dm2.2026.inpatient_no_sliding_scale_alone',
      'ada.dm2.2026.tube_feeding_insulin',
      'ada.dm2.2026.tube_feeding_dextrose_interrupt'
    ]
  }
];
