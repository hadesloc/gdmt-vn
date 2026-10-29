/**
 * Quy tắc Phân tầng Nguy cơ Đột quỵ CHA₂DS₂-VA (INTL/VN) vs CHA₂DS₂-VASc (US) [A]
 * Bao phủ: Lọc máu US Class 2b Apixaban, ngưỡng thấp nữ US (VASc = 1), không mâu thuẫn CONTINUE/AVOID ở nguy cơ thấp,
 * và cảnh báo béo phì nặng CrCl vs CrCl_ABW.
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  DOAC_IDS,
  PARENTERAL_ANTICOAG_IDS,
  VKA_IDS,
  computeAfStrokeScore,
  findCurrentMed,
  getCleanStartDose,
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

export const afOacRiskRules: Rule[] = [
  {
    id: 'af.oac.risk_stratification',
    module: 'af',
    nameVi: 'AF-CARE [A]: Phân tầng nguy cơ đột quỵ và chỉ định thuốc chống đông DOAC',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isNonValvularEligibleForDoacFlow(ctx) &&
      !isUnstableHemodynamics(ctx) &&
      !hasHcm(ctx) &&
      !hasCardiacAmyloidosis(ctx) &&
      !hasCurrentMed(ctx, [...VKA_IDS, ...PARENTERAL_ANTICOAG_IDS]),
    produce: (ctx): Recommendation | null => {
      const age = need(ctx, 'age');
      const scr = need(ctx, 'scr');
      const weight = need(ctx, 'weight');
      const crcl = need(ctx, 'crcl');
      const onDialysis = hasCondition(ctx, 'onDialysis');
      const profile = ctx.settings?.profile ?? 'INTL';
      const isUs = profile === 'US';

      if (age === undefined) return missingInputRec('af', 'age', 'tính điểm CHA₂DS₂-VA và chỉnh liều DOAC', ['esc.af.2024.cha2ds2va_rec_class1']);
      if (ctx.normalized.sex === undefined) return missingInputRec('af', 'sex', 'tính CrCl Cockcroft-Gault và phân tầng nguy cơ', ['esc.af.2024.table11_doac_dosing']);
      if (scr === undefined && !onDialysis) return missingInputRec('af', 'scr', 'tính độ thanh thải thận CrCl trước khi kê DOAC', ['esc.af.2024.table11_doac_dosing']);
      if (weight === undefined || (crcl === undefined && !onDialysis)) {
        return missingInputRec('af', 'weight', 'tính CrCl Cockcroft-Gault và tiêu chuẩn giảm liều DOAC', ['esc.af.2024.table11_doac_dosing']);
      }

      const chaResult = computeAfStrokeScore(ctx, age);
      const scoreVa = chaResult.scoreVa;
      const scoreVasc = chaResult.scoreVasc !== undefined ? chaResult.scoreVasc : scoreVa;
      const isFemale = ctx.normalized.sex === 'female';

      const isHighRisk = isUs
        ? (!isFemale && scoreVasc >= thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_high')) ||
          (isFemale && scoreVasc >= thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_female_high'))
        : scoreVa >= thFor('cha2ds2va_score', 'af.cha2ds2va.high_risk');

      const isIntermediateRisk = isUs
        ? (!isFemale && scoreVasc === thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_intermediate')) ||
          (isFemale && scoreVasc === thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_female_intermediate'))
        : scoreVa === thFor('cha2ds2va_score', 'af.cha2ds2va.intermediate_risk');

      const scoreText = isUs ? `CHA₂DS₂-VASc = ${scoreVasc}` : `CHA₂DS₂-VA = ${scoreVa}`;
      const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');

      if ((onDialysis && !isUs) || (!onDialysis && crcl !== undefined && crcl < contraMin)) {
        return {
          id: 'rec_af_oac_renal_contra',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'AVOID',
          dose: undefined,
          title: `Chống chỉ định các thuốc DOAC khi độ thanh thải CrCl dưới ${contraMin} mL/phút hoặc chạy thận nhân tạo`,
          rationale: `ESC 2024 (Table 11): Chưa có đủ bằng chứng an toàn từ thử nghiệm ngẫu nhiên lớn về DOAC khi CrCl dưới ${contraMin} mL/phút hoặc lọc máu. Cân nhắc kháng Vitamin K theo dõi sát INR.`,
          gates: [{ parameter: onDialysis ? 'Lọc máu' : 'CrCl', passed: false, action: 'contra', value: crcl !== undefined ? Number(crcl.toFixed(1)) : undefined, threshold: contraMin, messageVi: `Dưới ngưỡng ${contraMin} mL/phút` }],
          citationIds: ['esc.af.2024.table11_doac_dosing', 'acc.af.2023.esrd_dialysis_apixaban'],
          priority: 95,
          profileDiff: {
            INTL: `ESC 2024: Không khuyến cáo sử dụng DOAC khi CrCl dưới ${contraMin} mL/phút hoặc chạy thận nhân tạo.`,
            VN: `VNHA / BYT: Không chỉ định thường quy DOAC khi CrCl dưới ${contraMin} mL/phút; cân nhắc Acenocoumarol/Warfarin theo dõi INR.`,
            US: `ACC/AHA 2023 (Class 2b): Cho phép cân nhắc Warfarin hoặc Apixaban liều nhãn FDA ở bệnh nhân chạy thận nhân tạo chu kỳ.`
          }
        };
      }

      const onValidDoac = DOAC_IDS.some((d) => hasCurrentMed(ctx, [d]) && !resolveAfDoacDose(ctx, d).isContraindicated);

      if (isHighRisk) {
        if (onValidDoac) return null;
        const chosen = selectSafeDoac(ctx);
        if (!chosen) {
          if (isAllergicToDrug(ctx, 'warfarin')) return null;
          return {
            id: 'rec_af_oac_high_risk_vka_fallback',
            module: 'af',
            tier: TIER_A,
            tierOrder: 2,
            action: 'START',
            drugId: 'warfarin',
            drugNameVi: drug('warfarin').nameVi,
            dose: getCleanStartDose('warfarin'),
            title: `Khởi trị Warfarin (${scoreText}: Nguy cơ cao, có dị ứng hoặc chống chỉ định DOAC)`,
            rationale: `Khuyến cáo Class I: ${scoreText} bắt buộc dùng chống đông đường uống; dùng kháng Vitamin K khi không thể dùng DOAC.`,
            gates: [],
            citationIds: ['esc.af.2024.cha2ds2va_rec_class1', 'esc.af.2024.vka_target_inr'],
            priority: 95
          };
        }

        const highCutoff = isUs
          ? isFemale
            ? thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_female_high')
            : thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_high')
          : thFor('cha2ds2va_score', 'af.cha2ds2va.high_risk');
        const warnings = buildObesityAndHeightWarnings(ctx);

        return {
          id: 'rec_af_oac_high_risk',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: onDialysis && isUs ? 'CONSIDER' : 'START',
          drugId: chosen.drugId,
          drugNameVi: drug(chosen.drugId).nameVi,
          dose: chosen.resolution.recommendedDose,
          title: `${onDialysis && isUs ? 'Cân nhắc khởi trị' : 'Khởi trị'} ${drug(chosen.drugId).nameVi} (${scoreText}: Nguy cơ cao)`,
          rationale: `Khuyến cáo ${onDialysis && isUs ? 'Class 2b (ACC/AHA 2023 cho lọc máu chu kỳ)' : `Class I / Class 1 (${isUs ? 'ACC/AHA 2023' : 'ESC 2024'})`}: ${scoreText} là chỉ định điều trị thuốc chống đông đường uống dự phòng đột quỵ; ưu tiên DOAC hơn kháng Vitamin K.`,
          warnings: warnings.length > 0 ? warnings : undefined,
          gates: [{ parameter: isUs ? 'CHA₂DS₂-VASc' : 'CHA₂DS₂-VA', passed: true, value: isUs ? scoreVasc : scoreVa, threshold: highCutoff, messageVi: `${scoreText}: Nguy cơ cao` }],
          citationIds:
            onDialysis && isUs
              ? ['acc.af.2023.esrd_dialysis_apixaban', 'fda.apixaban.af_dose']
              : isUs
              ? ['acc.af.2023.cha2ds2vasc_class1', 'esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.table11_doac_dosing']
              : ['esc.af.2024.cha2ds2va_rec_class1', 'esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.table11_doac_dosing'],
          priority: 95,
          profileDiff: {
            INTL: `ESC 2024: Dùng thang CHA₂DS₂-VA (bỏ giới tính Sc); điểm ≥ ${thFor('cha2ds2va_score', 'af.cha2ds2va.high_risk')} là Class I.`,
            VN: `Việt Nam (VNHA / BYT): Áp dụng ngưỡng CHA₂DS₂-VA ≥ ${thFor('cha2ds2va_score', 'af.cha2ds2va.high_risk')} ưu tiên DOAC sẵn có tại bệnh viện.`,
            US: `ACC/AHA 2023: Dùng thang CHA₂DS₂-VASc (Nam ≥ ${thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_high')}, Nữ ≥ ${thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_female_high')} là Class 1).`
          }
        };
      }

      if (isIntermediateRisk) {
        if (onValidDoac) return null;
        const interCutoff = isUs
          ? isFemale
            ? thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_female_intermediate')
            : thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_intermediate')
          : thFor('cha2ds2va_score', 'af.cha2ds2va.intermediate_risk');

        return {
          id: 'rec_af_oac_intermediate_risk',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'CONSIDER',
          dose: undefined,
          title: `Cân nhắc chỉ định thuốc chống đông DOAC (${scoreText}: Nguy cơ trung bình)`,
          rationale: `Khuyến cáo Class IIa / Class 2a (${isUs ? 'ACC/AHA 2023' : 'ESC 2024'}): Bệnh nhân có ${scoreText} có nguy cơ thuyên tắc mạch tăng vừa; nên xem xét khởi trị DOAC sau khi cân nhắc nguy cơ chảy máu.`,
          gates: [{ parameter: isUs ? 'CHA₂DS₂-VASc' : 'CHA₂DS₂-VA', passed: true, value: isUs ? scoreVasc : scoreVa, threshold: interCutoff, messageVi: `${scoreText}: Nguy cơ trung bình` }],
          citationIds: isUs
            ? ['acc.af.2023.cha2ds2vasc_thresholds', 'esc.af.2024.doac_preferred_over_vka']
            : ['esc.af.2024.cha2ds2va_rec_class2a', 'esc.af.2024.doac_preferred_over_vka'],
          priority: 85
        };
      }

      const hasCvContext = Boolean(ctx.patient.customInputs?.afOnset) && ctx.patient.customInputs?.afType !== 'permanent';
      if (hasCvContext) {
        const postWeeks = thFor('interval_weeks', 'af.cardioversion.anticoag_weeks_post');
        const isLt24h =
          ctx.patient.customInputs?.afOnset === 'lt_24h' ||
          ctx.patient.customInputs?.afOnset === 'less_than_24h';
        return {
          id: 'rec_af_oac_low_risk_post_cv',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'MONITOR',
          dose: undefined,
          title: `Nguy cơ đột quỵ nền thấp (${scoreText}): Chỉ dùng chống đông ngắn hạn quanh chuyển nhịp, không cần duy trì suốt đời`,
          rationale: isLt24h
            ? `ESC 2024 (Rec Table 15): Với cơn rung nhĩ khởi phát chắc chắn dưới ${thFor('duration_hours', 'af.cardioversion.onset_hours_early')} giờ và CHA₂DS₂-VA = 0, chống đông ${postWeeks} tuần sau chuyển nhịp là tùy chọn (Class IIb, Mức C).`
            : `ESC 2024 (Rec Table 15): Rung nhĩ kéo dài trên ${thFor('duration_hours', 'af.cardioversion.onset_hours_early')} giờ chuyển nhịp bắt buộc chống đông ${postWeeks} tuần sau chuyển nhịp phòng choáng váng tiểu nhĩ, sau đó ngưng do nguy cơ nền thấp.`,
          gates: [],
          citationIds: ['esc.af.2024.cardioversion_post_oac_4weeks', 'esc.af.2024.cardioversion_low_risk_post_oac_optional', 'esc.af.2024.oac_except_low_risk'],
          priority: 75
        };
      }

      if (onValidDoac) {
        const med = findCurrentMed(ctx, DOAC_IDS)!;
        return {
          id: 'rec_af_oac_low_risk_reassess_active',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'CONSIDER',
          drugId: med.drugId.toLowerCase(),
          drugNameVi: drug(med.drugId.toLowerCase()).nameVi,
          dose: undefined,
          title: `Đánh giá lại chỉ định duy trì ${drug(med.drugId.toLowerCase()).nameVi} (${scoreText}: Nguy cơ đột quỵ nền thấp)`,
          rationale: `ESC 2024 & ACC/AHA 2023: Ở bệnh nhân rung nhĩ nguy cơ thấp (${scoreText}), không khuyến cáo chống đông dài hạn trừ khi đang trong cửa sổ ${thFor('interval_weeks', 'af.cardioversion.anticoag_weeks_post')} tuần sau chuyển nhịp/triệt đốt hoặc có chỉ định huyết khối tĩnh mạch khác.`,
          gates: [],
          citationIds: ['esc.af.2024.oac_except_low_risk', 'esc.af.2024.cha2ds2va_score_0'],
          priority: 82
        };
      }

      const lowCutoff =
        isUs && isFemale
          ? thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_intermediate')
          : thFor('cha2ds2va_score', 'af.cha2ds2va.low_risk');

      return {
        id: 'rec_af_oac_low_risk',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'AVOID',
        dose: undefined,
        title: `Không chỉ định thuốc chống đông dài hạn hoặc kháng tiểu cầu (${scoreText}: Nguy cơ thấp)`,
        rationale: `Khuyến cáo ESC 2024 & ACC/AHA 2023: Bệnh nhân không có yếu tố nguy cơ thuyên tắc mạch ngoài giới tính (${scoreText}); chống đông hoặc kháng tiểu cầu dài hạn không đem lại lợi ích ròng.`,
        gates: [{ parameter: isUs ? 'CHA₂DS₂-VASc' : 'CHA₂DS₂-VA', passed: true, value: isUs ? scoreVasc : scoreVa, threshold: lowCutoff, messageVi: `${scoreText}: Nguy cơ thấp` }],
        citationIds: ['esc.af.2024.oac_except_low_risk', 'esc.af.2024.cha2ds2va_score_0'],
        priority: 75
      };
    },
    citationIds: ['esc.af.2024.cha2ds2va_rec_class1', 'esc.af.2024.cha2ds2va_rec_class2a', 'esc.af.2024.doac_preferred_over_vka']
  }
];
