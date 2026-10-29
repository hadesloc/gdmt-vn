/**
 * Quy tắc Chuyển đổi Chống đông (UFH/LMWH -> OAC, VKA TTR / FRAIL-AF) & Chỉ định Bắt buộc HCM/Amyloidosis [A]
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  ALL_ANTICOAG_IDS,
  DOAC_IDS,
  PARENTERAL_ANTICOAG_IDS,
  VKA_IDS,
  findCurrentMed,
  getCleanStartDose,
  getDrugDisplayNameVi,
  hasCardiacAmyloidosis,
  hasCurrentMed,
  hasHcm,
  isAllergicToDrug,
  isUnstableHemodynamics
} from './rulesHelpers';
import {
  buildObesityAndHeightWarnings,
  isNonValvularEligibleForDoacFlow,
  resolveAfDoacDose,
  selectSafeDoac
} from './rulesDoacLogic';

const TIER_A = 'AF-CARE · [A] Dự phòng đột quỵ';

export const afOacTransitionRules: Rule[] = [
  {
    id: 'af.oac.defer_oral_unstable',
    module: 'af',
    nameVi: 'AF-CARE [A]: Ưu tiên chống đông đường tiêm (UFH/LMWH) quanh sốc điện cấp cứu khi mất ổn định huyết động',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isNonValvularEligibleForDoacFlow(ctx) &&
      isUnstableHemodynamics(ctx) &&
      !hasCurrentMed(ctx, ALL_ANTICOAG_IDS),
    produce: (): Recommendation => ({
      id: 'rec_af_defer_oral_oac_unstable',
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'DEFER',
      dose: undefined,
      title: 'Tạm hoãn DOAC đường uống trong pha sốc / mất ổn định huyết động: Ưu tiên Heparin tĩnh mạch (UFH/LMWH) quanh sốc điện cấp cứu',
      rationale:
        'ESC 2024 (Section 7.2): Trong sốc tim hoặc tụt huyết áp cấp cần sốc điện đồng bộ khẩn cấp, ưu tiên Heparin không phân đoạn tĩnh mạch (UFH) hoặc Enoxaparin ngay quanh chuyển nhịp, sau đó chuyển sang DOAC đường uống khi huyết động ổn định.',
      gates: [{ parameter: 'Huyết động', passed: false, messageVi: 'Đang mất ổn định huyết động cấp' }],
      citationIds: ['esc.af.2024.emergency_electrical_cardioversion', 'esc.af.2024.cardioversion_timing_24h'],
      priority: 98
    }),
    citationIds: ['esc.af.2024.emergency_electrical_cardioversion']
  },

  {
    id: 'af.oac.switch_parenteral_to_oral',
    module: 'af',
    nameVi: 'AF-CARE [A]: Chuyển đổi an toàn từ Enoxaparin / Heparin sang DOAC đường uống không chồng liều',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isNonValvularEligibleForDoacFlow(ctx) &&
      !isUnstableHemodynamics(ctx) &&
      hasCurrentMed(ctx, PARENTERAL_ANTICOAG_IDS) &&
      !hasCurrentMed(ctx, [...DOAC_IDS, ...VKA_IDS]),
    produce: (ctx): Recommendation | null => {
      const parMed = findCurrentMed(ctx, PARENTERAL_ANTICOAG_IDS)!;
      const parName = getDrugDisplayNameVi(parMed.drugId, parMed);
      const chosen = selectSafeDoac(ctx);
      if (!chosen) return null;
      return {
        id: 'rec_af_switch_parenteral_to_oac',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'SWITCH',
        drugId: chosen.drugId,
        drugNameVi: drug(chosen.drugId).nameVi,
        switchFrom: parMed.drugId.toLowerCase(),
        dose: chosen.resolution.recommendedDose,
        title: `Chuyển từ ${parName} sang ${drug(chosen.drugId).nameVi} đường uống (TUYỆT ĐỐI KHÔNG dùng đồng thời)`,
        rationale:
          'Nhãn FDA & ESC 2024: Ngừng thuốc chống đông đường tiêm khi chuyển sang DOAC — uống liều DOAC đầu tiên trước 0–2 giờ thời điểm lẽ ra tiêm liều Enoxaparin kế tiếp, hoặc ngay lúc ngừng truyền Heparin không phân đoạn tĩnh mạch.',
        gates: [],
        citationIds: ['esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.table11_doac_dosing'],
        priority: 97
      };
    },
    citationIds: ['esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.table11_doac_dosing']
  },

  {
    id: 'af.oac.vka_management',
    module: 'af',
    nameVi: 'AF-CARE [A]: Đánh giá TTR và tối ưu hóa kháng Vitamin K (Warfarin/Acenocoumarol) hoặc chuyển sang DOAC',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isNonValvularEligibleForDoacFlow(ctx)) return false;
      const procRisk = ctx.patient.customInputs?.plannedProcedureRisk;
      if (procRisk === 'low' || procRisk === 'high') return false;
      return hasCurrentMed(ctx, VKA_IDS);
    },
    produce: (ctx): Recommendation | null => {
      const vkaMed = findCurrentMed(ctx, VKA_IDS)!;
      const vkaId = vkaMed.drugId.toLowerCase();
      const ttrRaw = ctx.patient.customInputs?.vkaTtr;
      const ttr = typeof ttrRaw === 'number' ? ttrRaw : undefined;
      const ttrMin = thFor('percentage', 'af.vka.ttr_min');
      const age = need(ctx, 'age');
      const frailAge = thFor('age', 'af.elderly.frail_vka_age');
      const isFrailElderly = age !== undefined && age >= frailAge && hasCondition(ctx, 'frailty');

      if (ttr !== undefined && ttr < ttrMin) {
        const chosen = selectSafeDoac(ctx);
        if (!chosen) return null;
        return {
          id: 'rec_af_switch_vka_to_doac_ttr',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'SWITCH',
          drugId: chosen.drugId,
          drugNameVi: drug(chosen.drugId).nameVi,
          switchFrom: vkaId,
          dose: chosen.resolution.recommendedDose,
          title: `Chuyển từ ${drug(vkaId).nameVi} sang ${drug(chosen.drugId).nameVi} do kiểm soát INR kém (TTR ${ttr}% < ${ttrMin}%)`,
          rationale: `Khuyến cáo Class I, Mức B (ESC 2024 Rec Table 6): Khi TTR dưới ${ttrMin}%, chuyển sang DOAC giúp giảm xuất huyết nội sọ và đột quỵ tắc mạch. Ngừng ${drug(vkaId).nameVi}, theo dõi INR và khởi đầu ${drug(chosen.drugId).nameVi} ngay khi INR giảm xuống dưới ${thFor('inr', 'af.vka.target_inr_min').toFixed(1)}.`,
          gates: [{ parameter: 'TTR', passed: false, value: ttr, threshold: ttrMin, messageVi: `TTR ${ttr}% < ${ttrMin}%` }],
          citationIds: ['esc.af.2024.switch_vka_to_doac_ttr', 'esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.table11_doac_dosing'],
          priority: 96
        };
      }

      const inrMin = thFor('inr', 'af.vka.target_inr_min').toFixed(1);
      const inrMax = thFor('inr', 'af.vka.target_inr_max').toFixed(1);
      const ttrNote =
        ttr === undefined
          ? `Cần đánh giá tỷ lệ TTR (nếu TTR < ${ttrMin}% nên chuyển sang DOAC).`
          : `TTR hiện đạt ${ttr}% ≥ ${ttrMin}%.`;
      const frailNote = isFrailElderly
        ? ` Ở người bệnh ≥ ${frailAge} tuổi kèm hội chứng suy yếu đang ổn định trên kháng Vitamin K, FRAIL-AF (ESC 2024 Class IIb-B) ủng hộ duy trì VKA thay vì tự động đổi sang DOAC.`
        : '';

      return {
        id: `rec_af_vka_continue_${vkaId}`,
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: vkaId,
        drugNameVi: drug(vkaId).nameVi,
        dose: `${getCleanStartDose(vkaId)} — giữ INR ${inrMin}–${inrMax}`,
        title: `Duy trì ${drug(vkaId).nameVi} (Mục tiêu INR ${inrMin}–${inrMax}, TTR trên ${ttrMin}%)`,
        rationale: `ESC 2024 (Section 6.2.2): ${ttrNote}${frailNote}`,
        gates: [],
        citationIds: isFrailElderly
          ? ['esc.af.2024.vka_target_inr', 'esc.af.2024.frail_elderly_maintain_vka']
          : ['esc.af.2024.vka_target_inr', 'esc.af.2024.switch_vka_to_doac_ttr'],
        priority: 88
      };
    },
    citationIds: ['esc.af.2024.switch_vka_to_doac_ttr', 'esc.af.2024.vka_target_inr']
  },

  {
    id: 'af.oac.hcm_amyloidosis_oac',
    module: 'af',
    nameVi: 'AF-CARE [A]: Khuyến cáo bắt buộc chống đông Class I ở HCM hoặc Amyloidosis tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isNonValvularEligibleForDoacFlow(ctx) &&
      !isUnstableHemodynamics(ctx) &&
      (hasHcm(ctx) || hasCardiacAmyloidosis(ctx)) &&
      !hasCurrentMed(ctx, [...VKA_IDS, ...PARENTERAL_ANTICOAG_IDS]),
    produce: (ctx): Recommendation | null => {
      const age = need(ctx, 'age');
      const scr = need(ctx, 'scr');
      const weight = need(ctx, 'weight');
      const crcl = need(ctx, 'crcl');
      const onDialysis = hasCondition(ctx, 'onDialysis');
      const profile = ctx.settings?.profile ?? 'INTL';

      if (age === undefined) return missingInputRec('af', 'age', 'xác định liều DOAC cho HCM/Amyloidosis', ['esc.af.2024.hcm_amyloidosis_oac']);
      if (ctx.normalized.sex === undefined) return missingInputRec('af', 'sex', 'tính CrCl Cockcroft-Gault trước khi kê DOAC', ['esc.af.2024.table11_doac_dosing']);
      if (scr === undefined && !onDialysis) return missingInputRec('af', 'scr', 'tính CrCl trước khi kê DOAC', ['esc.af.2024.table11_doac_dosing']);
      if (weight === undefined || (crcl === undefined && !onDialysis)) {
        return missingInputRec('af', 'weight', 'tính CrCl và tiêu chuẩn giảm liều DOAC', ['esc.af.2024.table11_doac_dosing']);
      }

      const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');
      if ((onDialysis && profile !== 'US') || (!onDialysis && crcl !== undefined && crcl < contraMin)) {
        return {
          id: 'rec_af_oac_renal_contra',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'AVOID',
          dose: undefined,
          title: `Chống chỉ định các thuốc DOAC khi độ thanh thải CrCl dưới ${contraMin} mL/phút hoặc chạy thận nhân tạo`,
          rationale: `ESC 2024: Khi CrCl dưới ${contraMin} mL/phút hoặc lọc máu, không khuyến cáo dùng DOAC thường quy; cân nhắc kháng Vitamin K theo dõi sát INR.`,
          gates: [{ parameter: 'CrCl', passed: false, action: 'contra', value: crcl !== undefined ? Number(crcl.toFixed(1)) : undefined, threshold: contraMin, messageVi: 'Dưới ngưỡng an toàn thận' }],
          citationIds: ['esc.af.2024.table11_doac_dosing', 'acc.af.2023.esrd_dialysis_apixaban'],
          priority: 95
        };
      }

      if (DOAC_IDS.some((d) => hasCurrentMed(ctx, [d]) && !resolveAfDoacDose(ctx, d).isContraindicated)) return null;

      const chosen = selectSafeDoac(ctx);
      if (!chosen) {
        if (isAllergicToDrug(ctx, 'warfarin')) return null;
        return {
          id: 'rec_af_hcm_amyloidosis_vka_fallback',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'START',
          drugId: 'warfarin',
          drugNameVi: drug('warfarin').nameVi,
          dose: getCleanStartDose('warfarin'),
          title: 'Khởi trị Warfarin (HCM / Amyloidosis tim có chống chỉ định hoặc dị ứng DOAC)',
          rationale: 'ESC 2024 Class I: Bắt buộc chống đông dài hạn ở HCM/Amyloidosis bất kể điểm CHA₂DS₂-VA.',
          gates: [],
          citationIds: ['esc.af.2024.hcm_amyloidosis_oac', 'esc.af.2024.vka_target_inr'],
          priority: 97
        };
      }

      const warnings = buildObesityAndHeightWarnings(ctx);
      return {
        id: 'rec_af_hcm_amyloidosis_oac',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'START',
        drugId: chosen.drugId,
        drugNameVi: drug(chosen.drugId).nameVi,
        dose: chosen.resolution.recommendedDose,
        title: `Khởi trị ${drug(chosen.drugId).nameVi} (Bệnh cơ tim phì đại / Amyloidosis tim: Chỉ định chống đông bắt buộc Class I)`,
        rationale:
          'Khuyến cáo Class I, Mức B (ESC 2024 Rec Table 6): Ở tất cả bệnh nhân rung nhĩ kèm HCM hoặc Cardiac Amyloidosis, bắt buộc dùng thuốc chống đông đường uống dự phòng đột quỵ BẤT KỂ ĐIỂM CHA₂DS₂-VA (kể cả khi điểm = 0).',
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [{ parameter: 'HCM / Amyloidosis', passed: true, messageVi: 'Chỉ định Class I không phụ thuộc CHA₂DS₂-VA' }],
        citationIds: ['esc.af.2024.hcm_amyloidosis_oac', 'esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.table11_doac_dosing'],
        priority: 97
      };
    },
    citationIds: ['esc.af.2024.hcm_amyloidosis_oac', 'esc.af.2024.doac_preferred_over_vka']
  }
];
