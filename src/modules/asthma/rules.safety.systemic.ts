/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc An toàn Hệ thống
 * (Montelukast, Theophylline/Aminophylline, Tương tác CYP3A4, Thuốc an thần cấp cứu & Thai kỳ)
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ACUTE_SEDATIVE_DRUGS,
  CYP3A4_SENSITIVE_ICS_LABA_DRUGS,
  ICS_CONTAINING_DRUGS,
  METHYLXANTHINE_DRUGS,
  STRONG_CYP3A4_INHIBITOR_DRUGS,
  asDose,
  asthmaGate,
  asthmaRule,
  evaluateAcuteAsthma,
  hasCustomCond,
  hasStrongCyp3a4Inhibitor,
  isAdult18OrOlder,
  isAdultOrAdolescent,
  isPatientPregnant
} from './helpers';

const methylxanthineStopRules: Rule[] = Array.from(METHYLXANTHINE_DRUGS).map((xanthineId) =>
  asthmaRule({
    id: `asthma.safety.no_methylxanthine_${xanthineId}`,
    setting: 'both',
    nameVi: `Không khuyến cáo / Ngừng Theophylline và Aminophylline trong điều trị hen (${xanthineId})`,
    citationIds: [
      'gina.asthma.2026.theophylline_oral_not_recommended',
      'gina.asthma.2026.aminophylline_iv_not_recommended',
      'byt.asthma.2020.aminophylline_theophylline_not_rec'
    ],
    when: (ctx) => {
      const hasMed = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === xanthineId);
      if (!hasMed) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return true;
      return !ctx.patient.selectedModules.includes('copd');
    },
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === xanthineId);
      const medLabel = med?.name || xanthineId;
      const isAcute = evaluateAcuteAsthma(ctx).hasAcuteAttack;

      return {
        id: `rec_asthma_no_methylxanthine_${xanthineId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên chống ngộ độc methylxanthine
        action: 'STOP',
        drugId: med?.drugId ?? xanthineId,
        dose: undefined,
        title: isAcute
          ? `NGỪNG KHẨN CẤP ${medLabel}: Chống chỉ định dùng Aminophylline/Theophylline trong cơn hen phế quản cấp`
          : `NGỪNG ${medLabel}: GINA 2026 và Bộ Y tế không khuyến cáo dùng Theophylline duy trì do nguy cơ độc tính tử vong`,
        rationale:
          'Theo GINA 2026 và Bộ Y tế QĐ 1851/2020, Aminophylline tĩnh mạch và Theophylline uống không được khuyến cáo trong xử trí cơn hen cấp cũng như điều trị duy trì hen do hiệu quả kém và nguy cơ độc tính nặng đe dọa tính mạng (loạn nhịp thất, co giật kháng trị), đặc biệt khi phối hợp kháng sinh Macrolide/Quinolone (Ciprofloxacin, Clarithromycin, Erythromycin ức chế CYP1A2), xơ gan/suy gan hoặc suy tim.',
        gates: [asthmaGate('currentMeds', false, `Đang dùng ${medLabel} có nguy cơ ngộ độc tim mạch - thần kinh cao`)],
        citationIds: [
          'gina.asthma.2026.theophylline_oral_not_recommended',
          'gina.asthma.2026.aminophylline_iv_not_recommended',
          'byt.asthma.2020.aminophylline_theophylline_not_rec'
        ]
      };
    }
  })
);

const acuteSedativeStopRules: Rule[] = Array.from(ACUTE_SEDATIVE_DRUGS).map((sedId) =>
  asthmaRule({
    id: `asthma.safety.acute_no_sedatives_${sedId}`,
    setting: 'both',
    nameVi: `Chống chỉ định tuyệt đối thuốc an thần / gây ngủ trong cơn hen cấp (${sedId})`,
    citationIds: ['gina.asthma.2026.acute_sedatives_avoid', 'byt.asthma.2021.acute_hospital_treatment'],
    when: (ctx) =>
      evaluateAcuteAsthma(ctx).hasAcuteAttack &&
      ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === sedId),
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === sedId);
      const firstSed = ctx.patient.currentMeds.find((m) => ACUTE_SEDATIVE_DRUGS.has(m.drugId.toLowerCase()));
      const isFirst = firstSed?.drugId.toLowerCase() === sedId;
      return {
        id: isFirst ? 'rec_asthma_acute_no_sedatives' : `rec_asthma_acute_no_sedatives_${sedId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 100, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'STOP',
        drugId: med?.drugId ?? sedId,
        dose: undefined,
        title: `CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI: NGỪNG NGAY thuốc an thần / opioid (${med?.name || sedId}) trong cơn hen cấp`,
        rationale:
          'Theo GINA 2026 (Chứng cứ D) và Bộ Y tế QĐ 5850/2021, nghiêm cấm sử dụng mọi thuốc an thần, benzodiazepine, thuốc ngủ và opioid ức chế hô hấp trong cơn hen cấp (cả ngoại trú và nội viện) vì ức chế trung tâm hô hấp và liên quan trực tiếp đến ngừng thở, tử vong do hen.',
        gates: [asthmaGate('isAcuteExacerbation', false, `Đang dùng ${med?.name || sedId} trong cơn hen cấp`)],
        citationIds: ['gina.asthma.2026.acute_sedatives_avoid', 'byt.asthma.2021.acute_hospital_treatment']
      };
    }
  })
);

export const asthmaSystemicSafetyRules: Rule[] = [
  asthmaRule({
    id: 'asthma.safety.montelukast_neuropsychiatric',
    setting: 'both',
    nameVi: 'Ngừng Montelukast khi có tiền sử hoặc triệu chứng tâm thần kinh (FDA Boxed Warning)',
    citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric', 'gina.asthma.2026.montelukast_counseling'],
    when: (ctx) => {
      const takingMontelukast = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'montelukast');
      const hasPsychRisk =
        Boolean(ctx.patient.customInputs?.priorNeuropsychiatric) ||
        hasCondition(ctx, 'depression') ||
        hasCustomCond(ctx, 'anxiety') ||
        hasCustomCond(ctx, 'psychiatricDisorder') ||
        hasCustomCond(ctx, 'suicidalIdeation');
      return takingMontelukast && hasPsychRisk;
    },
    produce: (): Recommendation => ({
      id: 'rec_asthma_montelukast_psych_warning',
      module: 'asthma',
      tier: 'An toàn & Cảnh báo',
      tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 97, // qa-allow: index - độ ưu tiên ngừng thuốc an toàn tâm thần kinh
      action: 'STOP',
      drugId: 'montelukast',
      dose: undefined,
      title: 'NGỪNG Montelukast: Nguy cơ biến cố tâm thần kinh nghiêm trọng (FDA Boxed Warning)',
      rationale:
        'FDA ban hành Cảnh báo Đóng khung (Boxed Warning) và GINA 2026 khuyến cáo ngừng Montelukast ở bệnh nhân có trầm cảm, lo âu, rối loạn tâm thần hoặc ý nghĩ tự sát do nguy cơ làm nặng kích động, ác mộng, trầm cảm và hành vi tự sát; ưu tiên kiểm soát hen bằng phác đồ nền ICS/ICS-LABA.',
      gates: [asthmaGate('depression', false, 'Bệnh lý tâm thần kinh hiện mắc khi đang dùng Montelukast')],
      citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric', 'gina.asthma.2026.montelukast_counseling']
    })
  }),

  asthmaRule({
    id: 'asthma.safety.montelukast_boxed_warning_counseling',
    setting: 'both',
    nameVi: 'Tư vấn bắt buộc FDA Boxed Warning và kiểm tra liều theo tuổi khi dùng Montelukast',
    citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric', 'gina.asthma.2026.montelukast_counseling'],
    when: (ctx) => {
      const takingMontelukast = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'montelukast');
      const hasPsychRisk =
        Boolean(ctx.patient.customInputs?.priorNeuropsychiatric) ||
        hasCondition(ctx, 'depression') ||
        hasCustomCond(ctx, 'anxiety') ||
        hasCustomCond(ctx, 'psychiatricDisorder') ||
        hasCustomCond(ctx, 'suicidalIdeation');
      return takingMontelukast && !hasPsychRisk;
    },
    produce: (ctx): Recommendation => {
      const age = need(ctx, 'age');
      const minAge = thFor('age', 'asthma.age.min_adult_adolescent');
      const adultMontAge = 15; // qa-allow: unit-conversion - mốc tuổi nhãn FDA/BYT chuyển từ 5 mg (6–14 tuổi) sang 10 mg (≥ 15 tuổi)
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === 'montelukast');
      const doseStr = String(med?.dose ?? '').toLowerCase();
      const isAdol12To14 = age !== undefined && age >= minAge && age < adultMontAge;
      const isOverdosed10Mg = isAdol12To14 && (doseStr.includes('10') || Boolean(med?.name?.includes('10')));
      const chewDose = 5; // qa-allow: unit-conversion - hàm lượng chuẩn viên nhai 5 mg cho lứa tuổi 6–14 tuổi

      if (isOverdosed10Mg) {
        return {
          id: 'rec_asthma_montelukast_boxed_warning_counsel',
          module: 'asthma',
          tier: 'An toàn & Cảnh báo',
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 92, // qa-allow: index - độ ưu tiên hiệu chỉnh liều quá mức ở thanh thiếu niên
          action: 'REDUCE',
          drugId: 'montelukast',
          dose: asDose(`${chewDose} mg viên nhai x 1 lần/ngày vào buổi tối (dành cho lứa tuổi 6–14 tuổi)`),
          title: `GIẢM LIỀU Montelukast về ${chewDose} mg/ngày ở bệnh nhân ${age} tuổi (viên 10 mg chỉ dùng cho người ≥ ${adultMontAge} tuổi) & Tư vấn FDA Boxed Warning`,
          rationale: `Theo nhãn phê duyệt FDA và Bộ Y tế, thanh thiếu niên 6–14 tuổi chỉ dùng viên nhai Montelukast ${chewDose} mg/ngày (viên 10 mg chỉ dành cho người ≥ ${adultMontAge} tuổi). Bắt buộc hạ về đúng hàm lượng ${chewDose} mg và dặn bệnh nhân/gia đình ngừng thuốc ngay nếu xuất hiện ác mộng, kích động, trầm cảm hoặc ý nghĩ tự sát.`,
          gates: [asthmaGate('age', false, `Thanh thiếu niên ${age} tuổi (< ${adultMontAge} tuổi) đang kê liều người lớn`, age, adultMontAge)],
          citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric', 'gina.asthma.2026.montelukast_counseling']
        };
      }

      return {
        id: 'rec_asthma_montelukast_boxed_warning_counsel',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 80, // qa-allow: index - độ ưu tiên theo dõi thường quy
        action: 'MONITOR',
        drugId: 'montelukast',
        title: 'Đang dùng Montelukast: Tư vấn bắt buộc dấu hiệu cảnh báo tâm thần kinh (FDA Boxed Warning)',
        rationale: isAdol12To14
          ? `Ở thanh thiếu niên ${age} tuổi (6–14 tuổi), liều chuẩn là viên nhai ${chewDose} mg x 1 lần/ngày buổi tối. Theo GINA 2026 và FDA Boxed Warning, bắt buộc hướng dẫn người bệnh và gia đình ngừng Montelukast ngay nếu xuất hiện ác mộng, mất ngủ, lo âu, trầm cảm hoặc ý nghĩ tự sát.`
          : 'Theo GINA 2026 và FDA Boxed Warning, mọi bệnh nhân đang dùng Montelukast phải được tư vấn chủ động theo dõi biến cố tâm thần kinh mới khởi phát (rối loạn giấc ngủ, ác mộng, kích động, lo âu, trầm cảm, ý nghĩ tự sát) và ngừng thuốc ngay nếu xuất hiện.',
        gates: [],
        citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric', 'gina.asthma.2026.montelukast_counseling']
      };
    }
  }),

  ...methylxanthineStopRules,

  asthmaRule({
    id: 'asthma.safety.ics_laba_strong_cyp3a4_inhibitor',
    setting: 'both',
    nameVi: 'Cảnh báo tương tác nghiêm trọng giữa ICS/LABA chuyển hóa qua CYP3A4 và chất ức chế mạnh CYP3A4',
    citationIds: ['gina.asthma.2026.cyp3a4_ics_laba_interaction'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || !hasStrongCyp3a4Inhibitor(ctx)) return false;
      const hasSensitiveInMeds = ctx.patient.currentMeds.some((m) =>
        CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(m.drugId.toLowerCase())
      );
      if (hasSensitiveInMeds) return true;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      if (ctx.settings.setting === 'inpatient' && !evaluateAcuteAsthma(ctx).isDischargeReady) return false;
      return !isAdult18OrOlder(ctx);
    },
    produce: (ctx): Recommendation => {
      const cypMed = ctx.patient.currentMeds.find((m) =>
        STRONG_CYP3A4_INHIBITOR_DRUGS.has(m.drugId.toLowerCase())
      );
      const sensitiveIcs = ctx.patient.currentMeds.find((m) =>
        CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(m.drugId.toLowerCase())
      );
      const cypName = cypMed?.name || cypMed?.drugId || 'chất ức chế mạnh CYP3A4';
      const icsName = sensitiveIcs?.name || sensitiveIcs?.drugId || 'Fluticasone / Budesonide / Mometasone / Salmeterol';
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');

      return {
        id: 'rec_asthma_ics_laba_cyp3a4_ddi',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 96, // qa-allow: index - độ ưu tiên an toàn tương tác thuốc
        action: 'AVOID',
        drugId: sensitiveIcs?.drugId,
        dose: undefined,
        title: `TRÁNH phối hợp ${icsName} với ${cypName} (ức chế mạnh CYP3A4): Nguy cơ suy thượng thận & độc tính tim mạch`,
        rationale: isAdult18OrOlder(ctx)
          ? `Theo GINA 2026, ${cypName} (ức chế mạnh CYP3A4) làm tăng vọt nồng độ toàn thân của Fluticasone, Budesonide, Mometasone (gây Cushing và suy thượng thận thứ phát) và Salmeterol/Vilanterol (kéo dài QTc). Ở người lớn ≥ ${minAdult18} tuổi, ưu tiên chuyển sang Beclometasone/formoterol (Foster) hoặc Beclometasone đơn chất (ít phụ thuộc CYP3A4), hoặc đổi kháng sinh sang Azithromycin nếu đang điều trị nhiễm khuẩn ngắn ngày.`
          : `Theo GINA 2026, ${cypName} ức chế mạnh CYP3A4 làm tăng vọt phơi nhiễm toàn thân của Fluticasone, Budesonide và Salmeterol gây suy thượng thận/Cushing và loạn nhịp tim. Ở thanh thiếu niên (< ${minAdult18} tuổi, chưa cấp phép dùng Foster), ưu tiên đổi thuốc ức chế CYP3A4 (ví dụ thay Clarithromycin bằng Azithromycin) hoặc cân nhắc Beclometasone pMDI liều thấp nhất dưới giám sát chuyên khoa.`,
        gates: [asthmaGate('currentMeds', false, `Đang dùng ${cypName} ức chế mạnh CYP3A4`)],
        citationIds: ['gina.asthma.2026.cyp3a4_ics_laba_interaction']
      };
    }
  }),

  ...acuteSedativeStopRules,

  asthmaRule({
    id: 'asthma.safety.pregnancy_ics_continuation',
    setting: 'both',
    nameVi: 'Bảo vệ thai kỳ: Duy trì liên tục thuốc kiểm soát ICS và không hạ bậc trong thai kỳ',
    citationIds: ['gina.asthma.2026.pregnancy_safety', 'gina.asthma.2026.pregnancy_no_step_down'],
    when: (ctx) => isAdultOrAdolescent(ctx) && isPatientPregnant(ctx),
    produce: (ctx): Recommendation => {
      const hasIcs = ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
      return {
        id: 'rec_asthma_pregnancy_ics_safety',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 92, // qa-allow: index - độ ưu tiên bảo vệ thai kỳ
        action: 'MONITOR',
        title: 'Đang mang thai: TUYỆT ĐỐI KHÔNG tự ý ngừng hoặc hạ bậc thuốc kiểm soát chứa ICS',
        rationale: hasIcs
          ? 'Theo GINA 2026 (Chứng cứ A), duy trì kiểm soát tốt hen bằng ICS/ICS-LABA trong thai kỳ an toàn cho thai nhi; tự ý ngừng hoặc hạ bậc ICS dẫn đến đợt cấp gây thiếu oxy máu thai nhi, tiền sản giật, sinh non và nhẹ cân. Khuyến cáo đánh giá kiểm soát hen mỗi 4 tuần và trì hoãn hạ bậc cho tới sau sinh.'
          : 'Theo GINA 2026 (Chứng cứ A), phụ nữ mang thai mắc hen bắt buộc được kiểm soát bằng thuốc chứa ICS (Budesonide có dữ liệu an toàn thai kỳ phong phú nhất) vì nguy cơ thiếu oxy máu thai nhi do cơn hen cấp lớn hơn rất nhiều so với nguy cơ thuốc hít.',
        gates: [asthmaGate('pregnant', true, 'Đang mang thai — ưu tiên kiểm soát hen tối ưu')],
        citationIds: ['gina.asthma.2026.pregnancy_safety', 'gina.asthma.2026.pregnancy_no_step_down']
      };
    }
  })
];
