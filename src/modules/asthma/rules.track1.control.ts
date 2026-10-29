/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Đánh giá Kiểm soát GINA, Kỹ thuật hít & Điều chỉnh Bậc
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import { missingInputRec } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  asthmaGate,
  asthmaRule,
  evaluateAcuteAsthma,
  evaluateGinaControl,
  isAdultOrAdolescent,
  isMartOveruse,
  isStepDownEligible
} from './helpers';

export const asthmaTrack1ControlRules: Rule[] = [
  asthmaRule({
    id: 'asthma.outpatient.gina_control_missing',
    setting: 'outpatient',
    nameVi: 'Yêu cầu trả lời đủ bộ 4 câu hỏi đánh giá kiểm soát triệu chứng GINA trong 4 tuần qua',
    citationIds: ['gina.asthma.2026.symptom_control_table_2a', 'byt.asthma.2020.symptom_control_table_3'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const score = evaluateGinaControl(ctx);
      return score.level === 'missing';
    },
    produce: (ctx): Recommendation => {
      const score = evaluateGinaControl(ctx);
      const firstMissing = score.missingFields[0] ?? 'daytimeSymptomsMoreThanTwiceWeek';
      return missingInputRec(
        'asthma',
        firstMissing,
        'đánh giá chính xác mức độ kiểm soát triệu chứng hen GINA trong 4 tuần qua (1. Triệu chứng ban ngày > 2 lần/tuần; 2. Thức giấc ban đêm do hen; 3. Dùng thuốc cắt cơn SABA > 2 lần/tuần; 4. Giới hạn hoạt động do hen) trước khi phân bậc phác đồ',
        ['gina.asthma.2026.symptom_control_table_2a', 'byt.asthma.2020.symptom_control_table_3']
      );
    }
  }),

  asthmaRule({
    id: 'asthma.outpatient.check_technique_adherence',
    setting: 'outpatient',
    nameVi: 'Kiểm tra kỹ thuật hít và sự tuân thủ dùng thuốc trước khi tăng bậc',
    citationIds: [
      'gina.asthma.2026.sustained_step_up_2_3_months',
      'byt.asthma.2020.sustained_step_up_2_3_months'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const ci = ctx.patient.customInputs ?? {};
      const score = evaluateGinaControl(ctx);
      if (score.level === 'missing') return false;
      const badTech = ci.inhalerTechniqueCorrect === false;
      const badAdherence = ci.goodAdherence === false;
      return (badTech || badAdherence) && score.level !== 'well_controlled';
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const badTech = ci.inhalerTechniqueCorrect === false;
      const badAdherence = ci.goodAdherence === false;
      return {
        id: 'rec_asthma_check_technique_first',
        module: 'asthma',
        tier: 'Đánh giá Kiểm soát & Kỹ thuật',
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 93, // qa-allow: index - độ ưu tiên trước tăng bậc
        action: 'MONITOR',
        title: 'CHƯA TĂNG BẬC VỘI: Huấn luyện lại kỹ thuật hít và củng cố sự tuân thủ dùng thuốc',
        rationale: `Theo GINA 2026 (Chứng cứ A) và Bộ Y tế QĐ 1851/2020, trước khi nâng bậc thuốc kiểm soát bắt buộc kiểm tra các nguyên nhân thường gặp gây mất kiểm soát. Phát hiện ${badTech ? 'kỹ thuật xịt/hít chưa đúng' : ''}${badTech && badAdherence ? ' và ' : ''}${badAdherence ? 'chưa tuân thủ đều đặn thuốc kiểm soát' : ''}. Cần hướng dẫn trực tiếp bằng phương pháp cầm tay chỉ việc (teach-back), loại bỏ dị nguyên kích phát và đánh giá lại sau 2–4 tuần trước khi nâng bậc.`,
        gates: [asthmaGate('inhalerTechniqueAndAdherence', false, 'Kỹ thuật hít chưa đạt hoặc tuân thủ kém')],
        citationIds: [
          'gina.asthma.2026.sustained_step_up_2_3_months',
          'byt.asthma.2020.sustained_step_up_2_3_months'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.outpatient.step_down_stable',
    setting: 'outpatient',
    nameVi: 'Xem xét hạ bậc điều trị khi hen kiểm soát tốt ổn định ≥ 3 tháng',
    citationIds: [
      'gina.asthma.2026.step_down_months',
      'gina.asthma.2026.step_down_reduction_rate',
      'gina.asthma.2026.step_down_no_stop_laba',
      'byt.asthma.2020.step_down_options'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const ci = ctx.patient.customInputs ?? {};
      const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      // Track 1: Bậc 1 và 2 cùng một phác đồ AIR-only (ICS-formoterol khi cần) → không còn bậc thấp hơn để hạ;
      // chỉ hạ bậc từ Bậc 3 trở lên. Track 2: Bậc 2 (ICS liều thấp hằng ngày) vẫn có thể hạ về Bậc 1.
      const minStepForStepDown = ci.currentTrack === 'track2' ? 2 : 3; // qa-allow: ui-step - bậc tối thiểu để hạ bậc theo Track
      return currentStep >= minStepForStepDown && isStepDownEligible(ctx);
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const minMonths = thFor('months', 'asthma.step_down.stability_months_max');
      const months = typeof ci.wellControlledMonths === 'number' ? ci.wellControlledMonths : minMonths;
      const minRed = thFor('percentage', 'asthma.step_down.reduction_min_pct');
      const maxRed = thFor('percentage', 'asthma.step_down.reduction_max_pct');

      return {
        id: 'rec_asthma_step_down_consider',
        module: 'asthma',
        tier: 'Đánh giá Kiểm soát & Kỹ thuật',
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 85, // qa-allow: index - độ ưu tiên hạ bậc
        action: 'CONSIDER',
        title: `Xem xét hạ bậc an toàn: Giảm ${minRed}–${maxRed}% liều ICS sau ${months} tháng kiểm soát ổn định`,
        rationale: `Triệu chứng hen đã được kiểm soát tốt liên tục ${months} tháng (≥ ${minMonths} tháng), chức năng phổi ổn định và không có đợt cấp trong năm qua. Theo GINA 2026 (Chứng cứ B) và BYT QĐ 1851/2020, nên tìm liều ICS tối thiểu có hiệu quả bằng cách giảm ${minRed}–${maxRed}% liều mỗi ${minMonths} tháng (ở Bậc 3 Track 1 chuyển từ MART hàng ngày sang ICS-formoterol khi cần ở Bậc 2; ở Bậc 3 Track 2 giảm 50% liều ICS-LABA, tránh ngừng đơn thuần thành phần LABA và tuyệt đối không ngừng hoàn toàn ICS).`,
        gates: [
          asthmaGate(
            'wellControlledMonths',
            true,
            `Kiểm soát tốt ${months} tháng không có đợt cấp`,
            months,
            minMonths
          )
        ],
        citationIds: [
          'gina.asthma.2026.step_down_months',
          'gina.asthma.2026.step_down_reduction_rate',
          'gina.asthma.2026.step_down_no_stop_laba',
          'byt.asthma.2020.step_down_options'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.outpatient.partly_controlled_step_up_consider',
    setting: 'outpatient',
    nameVi: 'Hen kiểm soát một phần (1–2/4 tiêu chí): Cân nhắc nâng bậc sau khi rà soát yếu tố nguy cơ',
    citationIds: [
      'gina.asthma.2026.symptom_control_table_2a',
      'gina.asthma.2026.sustained_step_up_2_3_months',
      'byt.asthma.2020.sustained_step_up_2_3_months'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const ci = ctx.patient.customInputs ?? {};
      const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      const score = evaluateGinaControl(ctx);
      const canStepUp = ci.inhalerTechniqueCorrect !== false && ci.goodAdherence !== false;
      return currentStep >= 1 && currentStep <= 4 && score.level === 'partly_controlled' && canStepUp; // qa-allow: ui-step - bậc điều trị GINA 1–4
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const score = evaluateGinaControl(ctx);
      const exac = typeof ci.exacerbationsLastYear === 'number' ? ci.exacerbationsLastYear : 0;
      const priorExacMin = thFor('asthma_exacerbations', 'asthma.risk.prior_exacerbation_min');
      const trialMin = thFor('months', 'asthma.step_up.trial_months_min');
      const trialMax = thFor('months', 'asthma.step_up.trial_months_max');
      const hasPriorExac = exac >= priorExacMin;

      return {
        id: 'rec_asthma_partly_controlled_step_up',
        module: 'asthma',
        tier: 'Đánh giá Kiểm soát & Kỹ thuật',
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 82, // qa-allow: index - độ ưu tiên cân nhắc nâng bậc
        action: 'CONSIDER',
        title: `Hen kiểm soát một phần (${score.positiveCount}/4 tiêu chí GINA): Cân nhắc nâng thêm 1 bậc điều trị${hasPriorExac ? ' (ưu tiên nâng bậc do có tiền sử đợt cấp)' : ''}`,
        rationale: `Người bệnh có ${score.positiveCount}/4 tiêu chí triệu chứng GINA trong 4 tuần qua dù kỹ thuật hít đúng và tuân thủ tốt. Theo GINA 2026, cần điều trị tích cực bệnh đồng mắc (viêm mũi dị ứng, GERD, khói thuốc) và cân nhắc nâng lên 1 bậc điều trị thử nghiệm trong ${trialMin}–${trialMax} tháng${hasPriorExac ? ` — đặc biệt khuyến khích nâng bậc vì có ${exac} đợt cấp trong 12 tháng qua` : ''} nhằm đạt mục tiêu kiểm soát hoàn toàn.`,
        gates: [
          asthmaGate(
            'ginaSymptomScore',
            true,
            `Kiểm soát một phần (${score.positiveCount}/4 tiêu chí)`,
            score.positiveCount
          )
        ],
        citationIds: [
          'gina.asthma.2026.symptom_control_table_2a',
          'gina.asthma.2026.sustained_step_up_2_3_months',
          'byt.asthma.2020.sustained_step_up_2_3_months'
        ]
      };
    }
  })
];
