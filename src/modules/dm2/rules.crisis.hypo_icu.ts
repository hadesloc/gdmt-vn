/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Cấp cứu Hạ Đường huyết (Quy tắc 15-15 / Glucagon) & Insulin TM tại ICU
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need, missingInputRec } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  hasDm2Context,
  isActivelyHypoglycemic,
  isIcuSetting,
  isSevereHypoglycemia,
  isTakingCanonical
} from './helpers';

export const dm2CrisisHypoAndIcuRules: Rule[] = [
  // 1. CHUYỂN CẤP CỨU KHẨN KHI HẠ ĐƯỜNG HUYẾT MỨC ĐỘ 2–3 TẠI PHÒNG KHÁM NGOẠI TRÚ
  {
    id: 'dm2.outpatient.severe_hypoglycemia_refer',
    module: 'dm2',
    nameVi: 'Chuyển cấp cứu khẩn cấp khi hạ đường huyết mức độ 2–3 (< 3.0 mmol/L hoặc rối loạn ý thức) tại ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isSevereHypoglycemia(ctx),
    produce: (ctx) => {
      const glucose = need(ctx, 'glucose')!;
      const level2Mmol = thFor('glucose', 'dm2.hypo.threshold_level2_mmol');
      const glucagonIm = thFor('dose_mg', 'dm2.hypo.glucagon_im_mg');
      const glucagonNasal = thFor('dose_mg', 'dm2.hypo.glucagon_nasal_mg');
      return {
        id: 'rec_dm2_outpatient_severe_hypo_refer',
        module: 'dm2',
        tier: 'Cấp cứu & Chuyển tuyến khẩn cấp',
        tierOrder: 0,
        action: 'REFER',
        title: `CHUYỂN CẤP CỨU NGAY: Hạ đường huyết nặng nguy kịch (${glucose.toFixed(1)} mmol/L)`,
        rationale:
          `ADA 2026 Ch. 6: Hạ đường huyết mức độ 2–3 (glucose ${glucose.toFixed(1)} mmol/L dưới ${level2Mmol.toFixed(1)} mmol/L hoặc kèm rối loạn tri giác) tại ngoại trú có nguy cơ hôn mê, co giật và tái phát hạ đường huyết kéo dài (đặc biệt do Sulfonylurea hoặc Insulin nền). Cần xử trí cấp cứu tại chỗ (Glucagon ${glucagonIm} mg tiêm bắp/dưới da hoặc ${glucagonNasal} mg xịt mũi nếu không uống được an toàn / chưa có đường truyền tĩnh mạch) và chuyển Khoa Cấp cứu theo dõi đường huyết liên tục.`,
        gates: [],
        citationIds: [
          'ada.dm2.2026.hypo_level2_3mmol',
          'ada.dm2.2026.hypo_glucagon_use',
          'ada.dm2.2026.hypo_glucagon_doses'
        ],
        priority: 100
      };
    },
    citationIds: [
      'ada.dm2.2026.hypo_level2_3mmol',
      'ada.dm2.2026.hypo_glucagon_use',
      'ada.dm2.2026.hypo_glucagon_doses'
    ]
  },

  // 2. XỬ TRÍ HẠ ĐƯỜNG HUYẾT CẤP (QUY TẮC 15–15 / GLUCAGON / DEXTROSE TM + CẢNH BÁO ACARBOSE)
  {
    id: 'dm2.inpatient.hypoglycemia_protocol',
    module: 'dm2',
    nameVi: 'Giao thức xử trí Hạ đường huyết cấp (Quy tắc 15–15 / Glucagon / Dextrose tĩnh mạch)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isActivelyHypoglycemic(ctx),
    produce: (ctx) => {
      const glucose = need(ctx, 'glucose')!;
      const level1Mmol = thFor('glucose', 'dm2.hypo.threshold_level1_mmol');
      const level2Mmol = thFor('glucose', 'dm2.hypo.threshold_level2_mmol');
      const grams = thFor('carbohydrate_g', 'dm2.hypo.rule15_grams');
      const recheckMin = thFor('duration_minutes', 'dm2.hypo.rule15_minutes');
      const glucagonIm = thFor('dose_mg', 'dm2.hypo.glucagon_im_mg');
      const glucagonNasal = thFor('dose_mg', 'dm2.hypo.glucagon_nasal_mg');
      const isSevere = isSevereHypoglycemia(ctx);
      const isOutpatient = ctx.settings.setting === 'outpatient';
      const isTakingAcarbose = isTakingCanonical(ctx, 'acarbose');

      const acarboseAlert = isTakingAcarbose
        ? ' LƯU Ý BẮT BUỘC (ĐANG DÙNG ACARBOSE): Khi bù đường uống chỉ được dùng đường đơn Glucose (Dextrose) nguyên chất (viên/gel glucose); TUYỆT ĐỐI KHÔNG dùng đường mía (sucrose / nước đường thông thường) vì Acarbose ức chế alpha-glucosidase ngăn cản thủy phân đường đôi tại ruột!'
        : '';

      const citations: string[] = [
        'ada.dm2.2026.hypo_rule_of_15',
        'ada.dm2.2026.hypo_15g_glucose',
        'ada.dm2.2026.hypo_rule_15min_recheck'
      ];
      if (isSevere) {
        citations.push(
          'ada.dm2.2026.hypo_level2_3mmol',
          'ada.dm2.2026.hypo_glucagon_use',
          'ada.dm2.2026.hypo_glucagon_doses'
        );
      }
      if (isTakingAcarbose) citations.push('byt.dm2.2020.acarbose_mechanism_monosaccharide');

      const doseText = isSevere
        ? isOutpatient
          ? `Nếu không uống được an toàn: Tiêm Glucagon ${glucagonIm} mg tiêm bắp/dưới da hoặc xịt mũi Glucagon ${glucagonNasal} mg (hoặc tiêm tĩnh mạch Dextrose ưu trương tại phòng thủ thuật); nếu tỉnh táo nuốt an toàn: Uống ngay ${grams}–${grams + 5} g Glucose nguyên chất, kiểm tra lại sau ${recheckMin} phút` // qa-allow: unit-conversion - Liều 15-20g glucose cấp cứu hạ ĐH mức 2 còn tỉnh
          : `Tiêm tĩnh mạch ngay dung dịch Glucose (Dextrose) ưu trương (hoặc Glucagon ${glucagonIm} mg tiêm bắp/dưới da nếu chưa lấy được ven), kiểm tra lại đường huyết sau ${recheckMin} phút`
        : isTakingAcarbose
          ? `Uống ngay ${grams} gam Glucose (Dextrose) nguyên chất (không dùng đường mía sucrose do đang uống Acarbose), kiểm tra lại sau ${recheckMin} phút`
          : `Uống ngay ${grams} gam glucose tác dụng nhanh, kiểm tra lại đường huyết sau ${recheckMin} phút`;

      return {
        id: 'rec_dm2_hypo_rule15',
        module: 'dm2',
        tier: 'Cấp cứu & Xử trí biến cố cấp',
        tierOrder: 0,
        action: 'START',
        dose: doseText,
        title: isSevere
          ? isOutpatient
            ? `CẤP CỨU HẠ ĐƯỜNG HUYẾT NẶNG (${glucose.toFixed(1)} mmol/L): Glucagon ${glucagonIm} mg TB/DD (hoặc ${glucagonNasal} mg xịt mũi) / Dextrose TM`
            : `CẤP CỨU HẠ ĐƯỜNG HUYẾT NẶNG (${glucose.toFixed(1)} mmol/L): Tiêm Dextrose tĩnh mạch / Glucagon ngay`
          : isTakingAcarbose
            ? `XỬ TRÍ HẠ ĐƯỜNG HUYẾT (${glucose.toFixed(1)} mmol/L): Uống ${grams} gam GLUCOSE (Dextrose) nguyên chất`
            : `XỬ TRÍ HẠ ĐƯỜNG HUYẾT (${glucose.toFixed(1)} mmol/L): Quy tắc ${grams} gam Glucose`,
        rationale: isSevere
          ? `Glucose dưới ${level2Mmol.toFixed(1)} mmol/L hoặc kèm rối loạn tri giác: Hạ đường huyết mức độ 2–3 nguy kịch. Không ép uống khi người bệnh lơ mơ (nguy cơ sặc); xử trí bằng Dextrose tĩnh mạch hoặc Glucagon (${glucagonIm} mg TB/DD hoặc ${glucagonNasal} mg xịt mũi), đo lại đường huyết sau ${recheckMin} phút.${acarboseAlert}`
          : `Khuyến cáo ADA 2026 Ch. 6 (Khuyến cáo 6.15): Cho người bệnh uống ngay ${grams} gam glucose tác dụng nhanh, đo lại đường huyết mao mạch sau ${recheckMin} phút; lặp lại ${grams} gam nếu vẫn dưới ${level1Mmol.toFixed(1)} mmol/L.${acarboseAlert}`,
        gates: [],
        warnings: isTakingAcarbose
          ? [
              'Bệnh nhân đang dùng Acarbose: Đường mía (sucrose) KHÔNG có tác dụng cấp cứu hạ đường huyết đường uống; bắt buộc dùng Glucose (Dextrose) nguyên chất!'
            ]
          : undefined,
        citationIds: citations,
        priority: 100
      };
    },
    citationIds: [
      'ada.dm2.2026.hypo_rule_of_15',
      'ada.dm2.2026.hypo_15g_glucose',
      'ada.dm2.2026.hypo_rule_15min_recheck',
      'ada.dm2.2026.hypo_glucagon_use',
      'ada.dm2.2026.hypo_glucagon_doses'
    ]
  },

  // 3. TRUYỀN INSULIN TĨNH MẠCH LIÊN TỤC TẠI KHOA HỒI SỨC TÍCH CỰC - ICU
  {
    id: 'dm2.inpatient.icu_iv_insulin',
    module: 'dm2',
    nameVi: 'Truyền tĩnh mạch liên tục Regular insulin kiểm soát tăng đường huyết tại khoa ICU',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx)) return false;
      if (!isIcuSetting(ctx)) return false;
      if (isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isConfirmedCrisis) return false;
      return true;
    },
    produce: (ctx) => {
      const glucose = need(ctx, 'glucose');
      const k = need(ctx, 'k');
      const icuMinMmol = thFor('glucose', 'dm2.glucose.icu_target_min_mmol');
      const icuMaxMmol = thFor('glucose', 'dm2.glucose.icu_target_max_mmol');
      const icuMinMgdl = thFor('glucose', 'dm2.glucose.icu_target_min');
      const icuMaxMgdl = thFor('glucose', 'dm2.glucose.inpatient_target_max');
      const kHold = thFor('k', 'dm2.dka.k_hold_insulin');
      const alreadyOnRegular = isTakingCanonical(ctx, 'insulin_regular');

      if (glucose === undefined) {
        return missingInputRec(
          'dm2',
          'glucose',
          'xác định ngưỡng khởi đầu truyền insulin tĩnh mạch liên tục tại khoa ICU',
          ['ada.dm2.2026.icu_insulin_threshold_180', 'ada.dm2.2026.icu_target']
        );
      }

      if (glucose < icuMaxMmol && !alreadyOnRegular) {
        return null;
      }

      if (k === undefined) {
        return {
          id: 'rec_dm2_icu_iv_need_k',
          module: 'dm2',
          tier: 'Phác đồ Insulin nội trú',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'insulin_regular',
          drugNameVi: 'Insulin Regular (Truyền tĩnh mạch tại ICU)',
          title: 'HOÃN TRUYỀN INSULIN TĨNH MẠCH TẠI ICU – Cần xét nghiệm Kali máu (K⁺) trước tiên',
          rationale:
            `ADA 2026 Ch. 16 & Đồng thuận 2024: Đường huyết tại ICU tăng (${glucose.toFixed(1)} ≥ ${icuMaxMmol.toFixed(1)} mmol/L), nhưng chưa có kết quả K⁺ máu. Truyền insulin tĩnh mạch đẩy kali vào nội bào có thể gây loạn nhịp thất nguy kịch nếu hạ kali máu tiềm ẩn (dưới ${kHold.toFixed(1)} mmol/L). Cần xét nghiệm điện giải đồ khẩn trước khi khởi động bơm tiêm điện.`,
          gates: [
            {
              parameter: 'K+',
              passed: false,
              threshold: kHold,
              messageVi: 'Thiếu K⁺ máu: Cần kiểm tra K⁺ trước khi truyền Regular insulin tĩnh mạch tại ICU'
            }
          ],
          citationIds: ['ada.dm2.2026.icu_insulin_threshold_180', 'ada.dm2.2024.dka_potassium_hold_insulin'],
          priority: 98
        };
      }

      if (k < kHold) {
        return {
          id: 'rec_dm2_icu_iv_hold_hypokalemia',
          module: 'dm2',
          tier: 'Phác đồ Insulin nội trú',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'insulin_regular',
          drugNameVi: 'Insulin Regular (Truyền tĩnh mạch tại ICU)',
          title: `HOÃN REGULAR INSULIN TM TẠI ICU DO HẠ KALI MÁU (K⁺ = ${k.toFixed(1)} < ${kHold.toFixed(1)} mmol/L) – Bù Kali TM ngay`,
          rationale:
            `ADA 2026 Ch. 16 & Đồng thuận 2024: Kali máu hiện tại ${k.toFixed(1)} mmol/L (dưới ${kHold.toFixed(1)} mmol/L). Bắt buộc tạm hoãn truyền Regular insulin tĩnh mạch và bù kali tĩnh mạch ngay lập tức để phòng ngừng tim do hạ kali máu nặng; chỉ bắt đầu truyền insulin khi K⁺ từ ${kHold.toFixed(1)} mmol/L trở lên.`,
          gates: [
            {
              parameter: 'K+',
              passed: false,
              value: k,
              threshold: kHold,
              messageVi: `K⁺ ${k.toFixed(1)} mmol/L < ${kHold.toFixed(1)}: Bắt buộc bù kali trước khi truyền Regular insulin TM`
            }
          ],
          citationIds: ['ada.dm2.2026.icu_insulin_threshold_180', 'ada.dm2.2024.dka_potassium_hold_insulin'],
          priority: 99
        };
      }

      return {
        id: 'rec_dm2_icu_iv_insulin',
        module: 'dm2',
        tier: 'Phác đồ Insulin nội trú',
        tierOrder: 1,
        action: alreadyOnRegular ? 'CONTINUE' : 'START',
        drugId: 'insulin_regular',
        drugNameVi: 'Insulin Regular (Bơm tiêm điện truyền tĩnh mạch)',
        dose: `Truyền tĩnh mạch liên tục theo giao thức ICU chuẩn độ mỗi giờ để duy trì glucose ${icuMinMmol.toFixed(1)}–${icuMaxMmol.toFixed(1)} mmol/L (${icuMinMgdl}–${icuMaxMgdl} mg/dL)`,
        title: alreadyOnRegular
          ? `Duy trì truyền tĩnh mạch Regular insulin theo giao thức ICU (Mục tiêu ${icuMinMmol.toFixed(1)}–${icuMaxMmol.toFixed(1)} mmol/L)`
          : `Khởi đầu truyền tĩnh mạch liên tục Regular insulin tại ICU (Glucose ${glucose.toFixed(1)} ≥ ${icuMaxMmol.toFixed(1)} mmol/L)`,
        rationale:
          `Khuyến cáo ADA 2026 Ch. 16 (Khuyến cáo 16.4–16.5): Tại khoa Hồi sức tích cực (ICU), truyền tĩnh mạch insulin liên tục theo giao thức chuẩn là phương pháp ưu tiên hàng đầu khi tăng đường huyết dai dẳng từ ${icuMaxMmol.toFixed(1)} mmol/L (${icuMaxMgdl} mg/dL), nhằm duy trì đích đường huyết ${icuMinMmol.toFixed(1)}–${icuMaxMmol.toFixed(1)} mmol/L (${icuMinMgdl}–${icuMaxMgdl} mg/dL) và hạn chế tối đa dao động đường huyết.`,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            threshold: kHold,
            messageVi: `K⁺ ${k.toFixed(1)} mmol/L ≥ ${kHold.toFixed(1)}: An toàn để truyền Regular insulin tĩnh mạch tại ICU`
          }
        ],
        citationIds: ['ada.dm2.2026.icu_insulin_threshold_180', 'ada.dm2.2026.icu_target'],
        priority: 96
      };
    },
    citationIds: ['ada.dm2.2026.icu_insulin_threshold_180', 'ada.dm2.2026.icu_target']
  }
];
