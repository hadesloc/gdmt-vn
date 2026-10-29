/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Phác đồ Kiểm soát Tăng Đường huyết do Glucocorticoid
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need, missingInputRec } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  hasDrugAllergy,
  isActivelyHypoglycemic,
  isIcuSetting,
  isPregnant,
  isTakingCanonical,
  resolveDrugNameVi
} from './helpers';

export const dm2SteroidRules: Rule[] = [
  {
    id: 'dm2.inpatient.steroid_induced_hyperglycemia',
    module: 'dm2',
    nameVi: 'Kiểm soát tăng đường huyết do Glucocorticoid với Insulin NPH (Ngoại trú & Nội viện)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!Boolean(ctx.patient.customInputs?.onSteroidTherapy)) return false;
      if (isPregnant(ctx) || isActivelyHypoglycemic(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isCrisis || crisis.isSuspectedUnconfirmed || crisis.isIsolatedKetonemia) return false;
      if (ctx.settings.setting === 'inpatient' && isIcuSetting(ctx)) return false;
      return true;
    },
    produce: (ctx) => {
      const glucose = need(ctx, 'glucose');
      const hba1c = need(ctx, 'hba1c');
      const weight = need(ctx, 'weight');
      const minUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_min');
      const maxUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_max');
      const hyperCutoffMmol = thFor('glucose', 'dm2.glucose.icu_target_min_mmol');
      const hba1cCutoff = thFor('hba1c', 'dm2.hba1c.target_standard');
      const wardMaxMmol = thFor('glucose', 'dm2.glucose.inpatient_target_max_mmol');
      const reducePct = thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');

      const chosenSteroidInsId = hasDrugAllergy(ctx, 'insulin_nph') ? 'insulin_glargine' : 'insulin_nph';
      const alreadyOnNph = isTakingCanonical(ctx, chosenSteroidInsId);
      const activeNphMed = alreadyOnNph ? findActiveMedByCanonical(ctx, chosenSteroidInsId) : undefined;
      const hasRecentHypo = Boolean(ctx.patient.customInputs?.recentHypo);
      const isNpo = ctx.settings.setting === 'inpatient' && ctx.patient.customInputs?.inpatientEating === 'npo';

      if (!alreadyOnNph) {
        if (glucose === undefined && hba1c === undefined) {
          return missingInputRec(
            'dm2',
            'glucose',
            'xác nhận mức độ tăng đường huyết do Glucocorticoid trước khi khởi trị Insulin NPH',
            ['ada.dm2.2026.steroid_nph']
          );
        }
        const hasHyperglycemia =
          (glucose !== undefined && glucose >= hyperCutoffMmol) ||
          (hba1c !== undefined && hba1c >= hba1cCutoff);

        if (!hasHyperglycemia) {
          return {
            id: 'rec_dm2_steroid_monitor',
            module: 'dm2',
            tier: 'Kiểm soát đường huyết tình huống đặc biệt',
            tierOrder: 3,
            action: 'MONITOR',
            title: 'Đang dùng Glucocorticoid nhưng đường huyết hiện bình thường: Theo dõi đường huyết chiều – tối',
            rationale:
              `ADA 2026 Ch. 16: Đường huyết hiện tại chưa tăng (< ${hyperCutoffMmol.toFixed(1)} mmol/L). Chưa khởi trị Insulin NPH thường quy khi đường huyết bình thường để tránh hạ đường huyết; cần đo đường huyết mao mạch sau ăn trưa và buổi chiều tối (thời điểm đỉnh tác dụng của Prednisone/Methylprednisolone) để phát hiện sớm tăng đường huyết do steroid.`,
            gates: [],
            citationIds: ['ada.dm2.2026.steroid_nph'],
            priority: 88
          };
        }

        if (weight === undefined) {
          return missingInputRec(
            'dm2',
            'weight',
            'tính liều khởi đầu Insulin NPH buổi sáng theo cân nặng đối ứng đỉnh Glucocorticoid',
            ['ada.dm2.2026.steroid_nph']
          );
        }
      }

      const startRate = hasRecentHypo || isNpo ? minUkg : maxUkg;
      const action = alreadyOnNph
        ? hasRecentHypo
          ? 'REDUCE'
          : (glucose !== undefined && glucose >= wardMaxMmol) || (hba1c !== undefined && hba1c >= hba1cCutoff)
            ? 'UPTITRATE'
            : 'CONTINUE'
        : 'START';

      const insLabel = resolveDrugNameVi(chosenSteroidInsId, activeNphMed);
      const doseText =
        alreadyOnNph && hasRecentHypo
          ? `${insLabel}: Giảm ${reducePct}% liều buổi sáng do tiền sử hạ đường huyết gần đây`
          : alreadyOnNph && action === 'UPTITRATE'
            ? `${insLabel}: Tăng chỉnh liều buổi sáng (hiện dùng ${activeNphMed?.dose || ''} ${activeNphMed?.unit || ''}) tương ứng liều Glucocorticoid và đường huyết buổi chiều`
            : alreadyOnNph
              ? `${insLabel}: Duy trì liều buổi sáng cùng cử Glucocorticoid`
              : `${insLabel}: Khởi đầu ~${Math.round(weight! * startRate)} đơn vị (${startRate} U/kg) tiêm dưới da buổi sáng cùng thời điểm uống Prednisone / Prednisolone / Methylprednisolone${isNpo ? ' (đã chọn mức khởi đầu thận trọng do bệnh nhân đang NPO)' : ''}`;

      return {
        id: 'rec_dm2_steroid_nph',
        module: 'dm2',
        tier: 'Kiểm soát đường huyết tình huống đặc biệt',
        tierOrder: 3,
        action,
        drugId: chosenSteroidInsId,
        drugNameVi: insLabel,
        dose: doseText,
        title: alreadyOnNph
          ? `Điều chỉnh ${insLabel} buổi sáng đối ứng đỉnh tăng đường huyết do Steroid`
          : `Bổ sung ${insLabel} buổi sáng đối ứng đỉnh tăng đường huyết do Steroid (kết hợp trên nền phác đồ hiện tại)`,
        rationale:
          'Khuyến cáo ADA 2026 Ch. 16: Glucocorticoid tác dụng trung bình (Prednisone, Methylprednisolone uống buổi sáng) gây đỉnh tăng đường huyết vào buổi chiều – tối. Bổ sung Insulin NPH buổi sáng (đạt đỉnh sau 4–8 giờ) song song với insulin nền tác dụng dài hoặc phác đồ Basal-Bolus giúp phủ đúng đỉnh đường huyết do steroid mà không phải ngừng insulin nền đang dùng.',
        gates: [],
        citationIds: ['ada.dm2.2026.steroid_nph'],
        priority: 96
      };
    },
    citationIds: ['ada.dm2.2026.steroid_nph']
  }
];
