/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Khởi trị Insulin Thai kỳ & Tăng đường huyết Nặng / Dị hóa
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { dose, drug, fmtDose, thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  BOLUS_INSULIN_IDS,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  formatActiveMedDose,
  getFdcBlockedCompanionReason,
  getMaxBasalDosePerKg,
  hasDm2Context,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  pickFirstNonAllergicCandidate,
  resolveDrugNameVi
} from './helpers';
import { shouldDeintensifyHypoMeds } from './rules.safety.deintensify';

export const dm2InsulinInitRules: Rule[] = [
  // 1. PHÁC ĐỒ INSULIN ĐẦU TAY CHO PHỤ NỮ MANG THAI MẮC ĐTĐ TÍP 2 (BẢO TỒN INSULIN ĐƠN CHẤT, TÁCH FDC SOLIQUA/XULTOPHY)
  {
    id: 'dm2.outpatient.pregnancy_insulin',
    module: 'dm2',
    nameVi: 'Chỉ định Insulin là liệu pháp đầu tay an toàn trong thai kỳ',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || !isPregnant(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
      return true;
    },
    produce: (ctx) => {
      const weight = need(ctx, 'weight');
      const hba1c = need(ctx, 'hba1c');
      const glucose = need(ctx, 'glucose');
      const basalInfo = extractBasalInsulinInfo(ctx);
      const minUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_min');
      const maxUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_max');
      const fixedStart = thFor('dose_units', 'dm2.insulin_glargine.fixed_start');
      const pregTarget = thFor('hba1c', 'dm2.hba1c.target_young');

      const existingInsId =
        basalInfo.activeBasalDrugId ||
        ALL_INSULIN_IDS.find((id) => isTakingCanonical(ctx, id));
      const activeMed = existingInsId ? findActiveMedByCanonical(ctx, existingInsId) : undefined;
      const fdcBlockedReason = existingInsId
        ? getFdcBlockedCompanionReason(ctx, activeMed, existingInsId)
        : undefined;

      const safeFallbackId =
        pickFirstNonAllergicCandidate(ctx, ['insulin_glargine', 'insulin_nph', 'insulin_detemir']) ||
        'insulin_glargine';

      if (existingInsId && fdcBlockedReason) {
        const fdcName = resolveDrugNameVi(existingInsId, activeMed);
        const standaloneId =
          existingInsId === 'insulin_degludec' || existingInsId === 'insulin_glargine'
            ? existingInsId
            : safeFallbackId;
        const standaloneName = resolveDrugNameVi(standaloneId);
        const homeUnits = basalInfo.basalDoseUnits;
        const switchDose =
          homeUnits !== undefined && homeUnits > 0
            ? `Chuyển sang bút tiêm ${standaloneName} đơn chất tương đương ${homeUnits} đơn vị/ngày và chuẩn độ sát theo đường huyết mao mạch thai kỳ`
            : weight !== undefined
              ? `Khởi đầu ${Math.round(weight * minUkg)}–${Math.round(weight * maxUkg)} đơn vị/ngày (${minUkg}–${maxUkg} U/kg/ngày) bút ${standaloneName} đơn chất`
              : `Khởi đầu ${fixedStart} đơn vị/ngày bút ${standaloneName} đơn chất, chuẩn độ sát theo đường huyết mao mạch thai kỳ`;
        return {
          id: 'rec_dm2_pregnancy_insulin',
          module: 'dm2',
          tier: 'Phác đồ kiểm soát đường huyết Thai kỳ',
          tierOrder: 1,
          action: 'START',
          drugId: standaloneId,
          drugNameVi: standaloneName,
          dose: switchDose,
          title: `Chuyển sang ${standaloneName} đơn chất trong thai kỳ (Ngừng bút phối hợp ${fdcName})`,
          rationale:
            `ADA 2026 Ch. 15: Bút tiêm phối hợp ${fdcName} bắt buộc ngừng ngay trong thai kỳ do ${fdcBlockedReason}; chuyển sang Insulin đơn chất (${standaloneName} hoặc Insulin NPH) phối hợp insulin nhanh bữa ăn để kiểm soát đường huyết an toàn cho mẹ và thai nhi.`,
          gates: [],
          citationIds: ['ada.dm2.2026.pregnancy_insulin', 'byt.dm2.2020.pregnancy_insulin'],
          priority: 97
        };
      }

      const targetInsulinId = existingInsId || safeFallbackId;
      const targetInsulinName = resolveDrugNameVi(targetInsulinId, activeMed);
      const isAlreadyOnInsulin = Boolean(existingInsId) || basalInfo.hasAnyInsulin;

      const needsTitration =
        isAlreadyOnInsulin &&
        !Boolean(ctx.patient.customInputs?.recentHypo) &&
        ctx.settings.setting === 'outpatient' &&
        ((hba1c !== undefined && hba1c >= pregTarget) ||
          (glucose !== undefined && glucose >= thFor('glucose', 'dm2.glucose.fpg_target_max_mmol')));

      const activeDose = formatActiveMedDose(activeMed, targetInsulinId);
      const doseText = isAlreadyOnInsulin
        ? `${activeDose ? `${activeDose}; ` : ''}tiếp tục và chuẩn độ sát liều theo đường huyết mao mạch lúc đói và sau ăn trong thai kỳ`
        : weight !== undefined
          ? `Khởi đầu ${Math.round(weight * minUkg)}–${Math.round(weight * maxUkg)} đơn vị/ngày (${minUkg}–${maxUkg} U/kg/ngày) tiêm dưới da (Insulin Glargine hoặc Insulin NPH), phối hợp insulin nhanh bữa ăn theo đường huyết sau ăn`
          : `Khởi đầu ${fixedStart} đơn vị/ngày tiêm dưới da, chuẩn độ sát theo đường huyết mao mạch thai kỳ`;

      return {
        id: 'rec_dm2_pregnancy_insulin',
        module: 'dm2',
        tier: 'Phác đồ kiểm soát đường huyết Thai kỳ',
        tierOrder: 1,
        action: isAlreadyOnInsulin ? (needsTitration ? 'UPTITRATE' : 'CONTINUE') : 'START',
        drugId: targetInsulinId,
        drugNameVi: targetInsulinName,
        dose: doseText,
        title: isAlreadyOnInsulin
          ? `${needsTitration ? 'Chuẩn độ tăng liều' : 'Tiếp tục duy trì'} ${targetInsulinName} kiểm soát đường huyết thai kỳ`
          : `Khởi trị ${targetInsulinName} (hoặc Insulin NPH – Liệu pháp đầu tay an toàn cho phụ nữ mang thai)`,
        rationale:
          'ADA 2026 Ch. 15 & BYT 5481/2020: Insulin (bao gồm Insulin NPH, Glargine, Detemir, Aspart, Lispro) không qua hàng rào nhau thai với lượng có ý nghĩa lâm sàng và là phác đồ ưu tiên bắt buộc sau khi ngừng toàn bộ thuốc viên và GLP-1 RA.',
        gates: [],
        citationIds: ['ada.dm2.2026.pregnancy_insulin', 'byt.dm2.2020.pregnancy_insulin'],
        priority: 97
      };
    },
    citationIds: ['ada.dm2.2026.pregnancy_insulin', 'byt.dm2.2020.pregnancy_insulin']
  },

  // 2. KHỞI TRỊ SỚM HOẶC TỐI ƯU HÓA INSULIN KHI TĂNG ĐƯỜNG HUYẾT NẶNG / DỊ HÓA
  {
    id: 'dm2.outpatient.early_insulin',
    module: 'dm2',
    nameVi: 'Khởi trị hoặc tối ưu hóa insulin khi đường huyết tăng cao nặng hoặc có triệu chứng dị hóa',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
      if (Boolean(ctx.patient.customInputs?.onSteroidTherapy) || hasPlannedSurgery(ctx)) return false;
      const glucose = need(ctx, 'glucose');
      const hba1c = need(ctx, 'hba1c');
      const hasCatabolism = Boolean(ctx.patient.customInputs?.catabolicSymptoms);
      const isSevereHyperglycemia =
        (glucose !== undefined && glucose >= thFor('glucose', 'dm2.early_insulin.glucose_mmol')) ||
        (hba1c !== undefined && hba1c >= thFor('hba1c', 'dm2.early_insulin.hba1c'));
      return hasCatabolism || isSevereHyperglycemia;
    },
    produce: (ctx) => {
      const weight = need(ctx, 'weight');
      const hasCatabolism = Boolean(ctx.patient.customInputs?.catabolicSymptoms);
      const basalInfo = extractBasalInsulinInfo(ctx);
      const fixedStart = thFor('dose_units', 'dm2.insulin_glargine.fixed_start');
      const minUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_min');
      const maxUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_max');
      const maxBasalPerKg = getMaxBasalDosePerKg();
      const glargineTitration = drug('insulin_glargine').titration;
      const titrateStep = glargineTitration?.step ?? '';
      const titrateDays = glargineTitration?.intervalDays;

      const existingPremix = isTakingCanonical(ctx, 'insulin_premix');
      const hasAnyIns = basalInfo.hasAnyInsulin || isTakingAnyCanonical(ctx, ALL_INSULIN_IDS);

      if (hasAnyIns) {
        if (Boolean(ctx.patient.customInputs?.recentHypo) || shouldDeintensifyHypoMeds(ctx)) {
          return null;
        }

        if (existingPremix && !basalInfo.activeBasalDrugId) {
          const premixMed = findActiveMedByCanonical(ctx, 'insulin_premix');
          const premixName = resolveDrugNameVi('insulin_premix', premixMed);
          const curDose = formatActiveMedDose(premixMed, 'insulin_premix') || 'liều hiện tại';
          return {
            id: 'rec_dm2_early_insulin',
            module: 'dm2',
            tier: 'Kiểm soát đường huyết tích cực',
            tierOrder: 3,
            action: 'UPTITRATE',
            drugId: 'insulin_premix',
            drugNameVi: premixName,
            dose: `Chuẩn độ tăng liều ${premixName} từ ${curDose} (hoặc chuyển đổi sang phác đồ Basal-Bolus theo tổng liều ngày hiện tại; tuyệt đối không hạ về ${fixedStart} đơn vị)`,
            title: `Tối ưu hóa liều ${premixName} / Cân nhắc chuyển Basal-Bolus kiểm soát tăng đường huyết nặng`,
            rationale:
              'ADA 2026 Ch. 9 & BYT 5481/2020: Trên bệnh nhân đã tiêm Insulin trộn sẵn nhưng đường huyết vẫn tăng cao nặng, cần chuẩn độ liều theo đường huyết trước ăn hoặc chuyển sang Basal-Bolus tương đương tổng liều hiện dùng, không khởi trị lại từ liều thấp ban đầu.',
            gates: [],
            citationIds: ['byt.dm2.2020.premix_split_2_3', 'ada.dm2.2026.early_insulin_severe'],
            priority: 96
          };
        }

        const curUnits = basalInfo.basalDoseUnits;
        const activeInsId =
          basalInfo.activeBasalDrugId ||
          ALL_INSULIN_IDS.find((id) => isTakingCanonical(ctx, id)) ||
          'insulin_glargine';
        const activeMed = findActiveMedByCanonical(ctx, activeInsId);
        const fdcBlockedReason = getFdcBlockedCompanionReason(ctx, activeMed, activeInsId);

        if (fdcBlockedReason) {
          const standaloneName = resolveDrugNameVi(activeInsId);
          const fdcName = resolveDrugNameVi(activeInsId, activeMed);
          const eqUnits = curUnits !== undefined && curUnits > 0 ? curUnits : fixedStart;
          return {
            id: 'rec_dm2_early_insulin',
            module: 'dm2',
            tier: 'Kiểm soát đường huyết tích cực',
            tierOrder: 3,
            action: 'START',
            drugId: activeInsId,
            drugNameVi: standaloneName,
            dose: `Chuyển sang bút ${standaloneName} đơn chất ${eqUnits} đơn vị/ngày và chuẩn độ tăng ${titrateStep} mỗi ${titrateDays} ngày theo đường huyết lúc đói`,
            title: `Chuyển sang ${standaloneName} đơn chất & chuẩn độ kiểm soát tăng đường huyết nặng (Tách khỏi ${fdcName})`,
            rationale:
              `Bút phối hợp ${fdcName} bắt buộc ngừng do ${fdcBlockedReason}; chuyển đổi sang bút ${standaloneName} đơn chất giữ nguyên mức liều nền tương đương và chuẩn độ tích cực kiểm soát đường huyết.`,
            gates: [],
            citationIds: ['ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.early_insulin_severe'],
            priority: 96
          };
        }

        const dosePerKg =
          weight !== undefined && weight > 0 && curUnits !== undefined && curUnits > 0
            ? curUnits / weight
            : undefined;

        if (dosePerKg !== undefined && curUnits !== undefined && dosePerKg > maxBasalPerKg) {
          const isAlreadyOnBolus = isTakingAnyCanonical(ctx, [...BOLUS_INSULIN_IDS, 'insulin_premix']);
          if (isAlreadyOnBolus) {
            return {
              id: 'rec_dm2_early_insulin',
              module: 'dm2',
              tier: 'Kiểm soát đường huyết tích cực',
              tierOrder: 3,
              action: 'CONSIDER',
              title: 'Tối ưu hóa phân bổ phác đồ tiêm đa mũi và kỹ thuật tiêm Insulin (Tránh kê lại liều khởi đầu)',
              rationale:
                'ADA 2026 Ch. 9: Bệnh nhân đang tiêm phác đồ insulin liều cao nhưng đường huyết vẫn tăng nặng; cần kiểm tra tuân thủ, vùng loạn dưỡng mỡ dưới da và hiệu chỉnh tỷ lệ nền – bữa ăn.',
              gates: [],
              citationIds: ['ada.dm2.2026.overbasalization', 'ada.dm2.2026.glp1_preferred_over_insulin'],
              priority: 91
            };
          }

          return {
            id: 'rec_dm2_early_insulin',
            module: 'dm2',
            tier: 'Kiểm soát đường huyết tích cực',
            tierOrder: 3,
            action: 'CONSIDER',
            drugId: 'insulin_aspart',
            drugNameVi: drug('insulin_aspart').nameVi,
            dose: `Cân nhắc thêm ${fmtDose(dose('insulin_aspart', 'start'))} trước bữa ăn lớn nhất (hoặc phối hợp GLP-1 RA); duy trì liều nền ${curUnits} đơn vị/ngày`,
            title: 'Bổ sung Insulin bữa ăn / GLP-1 RA trên nền Insulin hiện tại (Không tăng tiếp liều nền quá ngưỡng)',
            rationale:
              `ADA 2026 Ch. 9: Liều insulin nền hiện tại ${curUnits} đơn vị/ngày (${dosePerKg.toFixed(2)} U/kg/ngày) đã vượt ngưỡng ${maxBasalPerKg} U/kg/ngày; cần bổ sung GLP-1 RA hoặc insulin nhanh bữa ăn thay vì tiếp tục tăng đơn độc insulin nền.`,
            gates: [],
            citationIds: ['ada.dm2.2026.overbasalization', 'ada.dm2.2026.glp1_preferred_over_insulin'],
            priority: 91
          };
        }

        const activeInsName = resolveDrugNameVi(activeInsId, activeMed);
        const curUnitsStr = curUnits !== undefined && curUnits > 0 ? `từ mức hiện tại ${curUnits} đơn vị/ngày` : 'từ liều đang sử dụng';

        return {
          id: 'rec_dm2_early_insulin',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết tích cực',
          tierOrder: 3,
          action: 'UPTITRATE',
          drugId: activeInsId,
          drugNameVi: activeInsName,
          dose: `Chuẩn độ tăng liều ${curUnitsStr} (tăng thêm ${titrateStep} mỗi ${titrateDays} ngày theo đường huyết đói; không hạ về liều khởi đầu ${fixedStart} đơn vị)`,
          title: `Chuẩn độ tăng liều ${activeInsName} kiểm soát tăng đường huyết nặng`,
          rationale:
            'ADA 2026 Ch. 9: Bệnh nhân đã đang điều trị insulin ngoại trú nhưng đường huyết/HbA1c ở ngưỡng tăng nặng; cần chuẩn độ tăng liều từ mức hiện tại và xem xét phối hợp GLP-1 RA hoặc insulin bữa ăn.',
          gates: [],
          citationIds: ['ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.early_insulin_severe'],
          priority: 96
        };
      }

      const chosenBasal =
        pickFirstNonAllergicCandidate(ctx, ['insulin_glargine', 'insulin_degludec', 'insulin_nph']) ||
        'insulin_glargine';
      const chosenBasalName =
        chosenBasal === 'insulin_glargine' && !pickFirstNonAllergicCandidate(ctx, ['insulin_degludec'])
          ? resolveDrugNameVi(chosenBasal)
          : chosenBasal === 'insulin_glargine'
            ? 'Insulin Glargine (hoặc Degludec)'
            : resolveDrugNameVi(chosenBasal);

      const doseText =
        weight !== undefined
          ? `Khởi đầu ${fixedStart} đơn vị/ngày HOẶC ${Math.round(weight * minUkg)}–${Math.round(weight * maxUkg)} đơn vị/ngày (${minUkg}–${maxUkg} U/kg/ngày) tiêm dưới da 1 lần trước ngủ`
          : `Khởi đầu ${fixedStart} đơn vị/ngày tiêm dưới da 1 lần trước ngủ`;

      return {
        id: 'rec_dm2_early_insulin',
        module: 'dm2',
        tier: 'Kiểm soát đường huyết tích cực',
        tierOrder: 3,
        action: 'START',
        drugId: chosenBasal,
        drugNameVi: chosenBasalName,
        dose: doseText,
        title: hasCatabolism
          ? 'Khởi trị Insulin nền ngay lập tức (Tăng đường huyết nặng kèm Dị hóa cấp)'
          : 'Khởi trị Insulin nền sớm kiểm soát tăng đường huyết rất cao (hoặc phối hợp/cân nhắc GLP-1 / GIP-GLP-1 RA)',
        rationale: hasCatabolism
          ? 'Khuyến cáo ADA 2026 Ch. 9 (Rec 9.21): Bắt buộc khởi trị ngay Insulin khi có triệu chứng dị hóa mô (sụt cân ngoài ý muốn, tiểu nhiều, khát nhiều, ceton máu tăng) để đảo ngược thiếu hụt insulin nặng và giải quyết ngộ độc đường.'
          : `Khuyến cáo ADA 2026 Ch. 9 (Rec 9.21): Khi đường huyết từ ${thFor('glucose', 'dm2.early_insulin.glucose_mmol')} mmol/L hoặc HbA1c trên ${thFor('hba1c', 'dm2.early_insulin.hba1c')}% nhưng chưa có triệu chứng dị hóa cấp hay toan ceton, khởi trị Insulin nền sớm giúp kiểm soát nhanh ngộ độc đường; đồng thời có thể phối hợp hoặc cân nhắc đồng vận GLP-1 / GIP-GLP-1 RA hoạt lực cao theo bối cảnh người bệnh.`,
        gates: [],
        citationIds: hasCatabolism
          ? ['ada.dm2.2026.early_insulin_severe', 'ada.dm2.2026.basal_start_and_titration']
          : ['ada.dm2.2026.early_insulin_severe', 'ada.dm2.2026.basal_start_and_titration', 'ada.dm2.2026.glp1_preferred_over_insulin'],
        priority: 96
      };
    },
    citationIds: ['ada.dm2.2026.early_insulin_severe', 'ada.dm2.2026.basal_start_and_titration']
  }
];
