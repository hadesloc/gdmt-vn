/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Điều trị Ngoại trú Phân nhánh Ưu tiên Track 1 (AIR / MART Bậc 1–4)
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import {
  asDose,
  asthmaRule,
  computeEffectiveTrack1Step,
  evaluateAcuteAsthma,
  evaluateGinaControl,
  getMartMaxDailyPuffs,
  hasSevereMilkProteinAllergy,
  isAdultOrAdolescent,
  isMartOveruse,
  isStepDownEligible,
  isUsingRapihaler80,
  resolveControllerAction,
  resolveTrack1MartDrugId,
  shouldDeferTripleInhalerToCopd
} from './helpers';
import { asthmaTrack1ControlRules } from './rules.track1.control';

const asthmaTrack1StepRules: Rule[] = [
  asthmaRule({
    id: 'asthma.track1.step1_2_air',
    setting: 'outpatient',
    nameVi: 'Track 1 Bậc 1–2: ICS-formoterol liều thấp hít khi cần giảm triệu chứng (AIR)',
    citationIds: [
      'gina.asthma.2026.track1_preferred',
      'gina.asthma.2026.track1_step1_2',
      'gina.asthma.2026.rapihaler_80_225_double_actuations'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      const ci = ctx.patient.customInputs ?? {};
      if (ci.currentTrack === 'track2') return false;
      if (evaluateGinaControl(ctx).level === 'missing') return false;
      const step = computeEffectiveTrack1Step(ctx);
      return step === 1 || step === 2;
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const martDrugId = resolveTrack1MartDrugId(ctx);
      const isFost = martDrugId === 'beclometasone_formoterol';
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const isRap80 = isUsingRapihaler80(ctx);

      const desiredOnTarget = currentStep === 3 && isStepDownEligible(ctx) ? 'REDUCE' : 'CONTINUE';
      const { action, switchFrom } = resolveControllerAction(ctx, martDrugId, desiredOnTarget);

      let doseStr: string;
      if (isFost) {
        const dev = milkAllergy ? 'Foster pMDI 100/6 mcg (qua buồng đệm — không chứa lactose)' : 'Foster 100/6 mcg';
        doseStr = `${dev}: Xịt/hít 1 nhát mỗi khi có triệu chứng khó thở hoặc trước vận động gắng sức (tối đa ${maxPuffs} nhát/ngày)`;
      } else if (milkAllergy || isRap80) {
        const prnPuffs = isRap80 ? 2 : 1; // qa-allow: unit-conversion - Rapihaler 80/2.25 dùng 2 nhát mỗi lần cắt cơn
        const strength = isRap80 ? '80/2.25 mcg' : '160/4.5 mcg';
        doseStr = `Symbicort Rapihaler pMDI ${strength} (qua buồng đệm — không chứa lactose): Xịt ${prnPuffs} nhát mỗi khi có triệu chứng hoặc trước vận động gắng sức (tối đa ${maxPuffs} nhát/ngày)`;
      } else {
        doseStr = `160/4.5 mcg: Hít 1 nhát mỗi khi có triệu chứng khó thở hoặc trước vận động gắng sức (tối đa ${maxPuffs} nhát/ngày)`;
      }

      return {
        id: 'rec_asthma_track1_step1_2_air',
        module: 'asthma',
        tier: 'Điều trị Kiểm soát nền (Track 1 Ưu tiên)',
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên phác đồ chính
        action,
        drugId: martDrugId,
        switchFrom,
        dose: asDose(doseStr),
        title: `Track 1 Bậc 1–2 (Chế độ AIR): Dùng ${isFost ? 'Beclometasone/formoterol' : 'Budesonide/formoterol'} liều thấp khi cần (không cần SABA riêng)`,
        rationale:
          'Phác đồ kháng viêm giảm triệu chứng (AIR - Anti-Inflammatory Reliever) ở Bậc 1–2 cung cấp ngay Corticosteroid kháng viêm mỗi khi xuất hiện triệu chứng, giảm phần lớn nguy cơ đợt cấp nặng phải cấp cứu/nhập viện so với dùng SABA đơn thuần (SYGMA 1 & 2, Novel START; GINA 2026 Chứng cứ A).',
        gates: [],
        citationIds: isFost
          ? ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.track1_step1_2', 'gina.asthma.2026.beclometasone_formoterol_mart_12_puffs']
          : ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.track1_step1_2', 'gina.asthma.2026.rapihaler_80_225_double_actuations']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.track1.step3_mart_low',
    setting: 'outpatient',
    nameVi: 'Track 1 Bậc 3: Duy trì và cắt cơn bằng ICS-formoterol liều thấp (MART Bậc 3)',
    citationIds: [
      'gina.asthma.2026.track1_preferred',
      'gina.asthma.2026.track1_step3',
      'gina.asthma.2026.beclometasone_formoterol_mart_12_puffs'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      const ci = ctx.patient.customInputs ?? {};
      if (ci.currentTrack === 'track2') return false;
      if (evaluateGinaControl(ctx).level === 'missing') return false;
      return computeEffectiveTrack1Step(ctx) === 3;
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const martDrugId = resolveTrack1MartDrugId(ctx);
      const isFost = martDrugId === 'beclometasone_formoterol';
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const isRap80 = isUsingRapihaler80(ctx);

      const desiredOnTarget =
        currentStep === 4 && isStepDownEligible(ctx)
          ? 'REDUCE'
          : currentStep > 0 && currentStep < 3
            ? 'UPTITRATE'
            : 'CONTINUE';
      const { action, switchFrom } = resolveControllerAction(ctx, martDrugId, desiredOnTarget);

      let doseStr: string;
      if (isFost) {
        const dev = milkAllergy ? 'Foster pMDI 100/6 mcg (qua buồng đệm — không chứa lactose)' : 'Foster 100/6 mcg';
        doseStr = `${dev}: Duy trì 1 nhát x 1–2 lần/ngày + dùng thêm 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else if (milkAllergy || isRap80) {
        const maintText = isRap80 ? '2 nhát x 1–2 lần/ngày' : '1 nhát x 1–2 lần/ngày';
        const prnPuffs = isRap80 ? 2 : 1; // qa-allow: unit-conversion - Rapihaler 80/2.25 dùng 2 nhát mỗi lần cắt cơn
        const strength = isRap80 ? '80/2.25 mcg' : '160/4.5 mcg';
        doseStr = `Symbicort Rapihaler pMDI ${strength} (qua buồng đệm — không chứa lactose): Duy trì ${maintText} + xịt thêm ${prnPuffs} nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else {
        doseStr = `160/4.5 mcg: Duy trì 1 nhát x 1–2 lần/ngày + hít thêm 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      }

      return {
        id: 'rec_asthma_track1_step3_mart_low',
        module: 'asthma',
        tier: 'Điều trị Kiểm soát nền (Track 1 Ưu tiên)',
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 91, // qa-allow: index - độ ưu tiên phác đồ chính
        action,
        drugId: martDrugId,
        switchFrom,
        dose: asDose(doseStr),
        title: `Track 1 Bậc 3 (MART liều thấp): Một bình duy nhất ${isFost ? 'Beclometasone/formoterol' : 'Budesonide/formoterol'} vừa duy trì hàng ngày vừa cắt cơn`,
        rationale:
          'Liệu pháp duy trì và cắt cơn bằng cùng một bình ICS-formoterol liều thấp (MART) vượt trội hơn so với ICS-LABA liều cố định kèm SABA trong việc giảm đợt cấp nặng phải dùng Corticoid toàn thân (GINA 2026 Chứng cứ A & Bộ Y tế QĐ 1851/2020).',
        gates: [],
        citationIds: [
          'gina.asthma.2026.track1_preferred',
          'gina.asthma.2026.track1_step3',
          'gina.asthma.2026.beclometasone_formoterol_mart_12_puffs'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.track1.step4_mart_medium',
    setting: 'outpatient',
    nameVi: 'Track 1 Bậc 4: Duy trì và cắt cơn bằng ICS-formoterol liều trung bình (MART Bậc 4)',
    citationIds: [
      'gina.asthma.2026.track1_step4',
      'gina.asthma.2026.formoterol_max_inhalations',
      'gina.asthma.2026.formoterol_max_mcg',
      'gina.asthma.2026.rapihaler_80_225_double_actuations'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      const ci = ctx.patient.customInputs ?? {};
      if (ci.currentTrack === 'track2') return false;
      if (evaluateGinaControl(ctx).level === 'missing') return false;
      return computeEffectiveTrack1Step(ctx) === 4;
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const currentStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const martDrugId = resolveTrack1MartDrugId(ctx);
      const isFost = martDrugId === 'beclometasone_formoterol';
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const isRap80 = isUsingRapihaler80(ctx);

      const desiredOnTarget =
        currentStep === 5 && isStepDownEligible(ctx)
          ? 'REDUCE'
          : currentStep > 0 && currentStep < 4
            ? 'UPTITRATE'
            : 'CONTINUE';
      const { action, switchFrom } = resolveControllerAction(ctx, martDrugId, desiredOnTarget);

      let doseStr: string;
      if (isFost) {
        const dev = milkAllergy ? 'Foster pMDI 100/6 mcg (qua buồng đệm — không chứa lactose)' : 'Foster 100/6 mcg';
        doseStr = `${dev}: Duy trì 2 nhát x 2 lần/ngày + dùng thêm 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else if (milkAllergy || isRap80) {
        const maintPuffs = isRap80 ? 4 : 2; // qa-allow: unit-conversion - Rapihaler 80/2.25 dùng 4 nhát x 2 lần/ngày ở Bậc 4
        const prnPuffs = isRap80 ? 2 : 1; // qa-allow: unit-conversion - Rapihaler 80/2.25 dùng 2 nhát mỗi lần cắt cơn
        const strength = isRap80 ? '80/2.25 mcg' : '160/4.5 mcg';
        doseStr = `Symbicort Rapihaler pMDI ${strength} (qua buồng đệm — không chứa lactose): Duy trì ${maintPuffs} nhát x 2 lần/ngày + xịt thêm ${prnPuffs} nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else {
        doseStr = `160/4.5 mcg: Duy trì 2 nhát x 2 lần/ngày + hít thêm 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      }

      return {
        id: 'rec_asthma_track1_step4_mart_medium',
        module: 'asthma',
        tier: 'Điều trị Kiểm soát nền (Track 1 Ưu tiên)',
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 92, // qa-allow: index - độ ưu tiên phác đồ chính
        action,
        drugId: martDrugId,
        switchFrom,
        dose: asDose(doseStr),
        title: `Track 1 Bậc 4 (MART liều trung bình): Nâng liều duy trì ${isFost ? 'Beclometasone/formoterol' : 'Budesonide/formoterol'} & Giữ nguyên bình cắt cơn`,
        rationale: `Ở bệnh nhân không kiểm soát được với MART liều thấp (dù tuân thủ tốt và kỹ thuật hít đúng) hoặc khởi trị mới với triệu chứng không kiểm soát nặng kèm đợt cấp/FEV₁ giảm, nâng liều duy trì lên Bậc 4 giúp kiểm soát nền viêm tối ưu hơn. Trần an toàn tối đa ${maxPuffs} nhát/ngày.`,
        gates: [],
        citationIds: [
          'gina.asthma.2026.track1_step4',
          'gina.asthma.2026.formoterol_max_inhalations',
          'gina.asthma.2026.formoterol_max_mcg',
          'gina.asthma.2026.rapihaler_80_225_double_actuations'
        ]
      };
    }
  })
];

export const asthmaTrack1Rules: Rule[] = [
  ...asthmaTrack1ControlRules,
  ...asthmaTrack1StepRules
];
