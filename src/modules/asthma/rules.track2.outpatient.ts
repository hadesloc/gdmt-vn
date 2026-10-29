/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Phân nhánh Thay thế Track 2 Ngoại trú (Bậc 1–4)
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  TRACK2_ICS_LABA_DRUGS,
  asDose,
  asthmaRule,
  computeEffectiveTrack2Step,
  evaluateAcuteAsthma,
  evaluateGinaControl,
  hasSevereMilkProteinAllergy,
  isAdultOrAdolescent,
  isMartOveruse,
  isStepDownEligible,
  resolveControllerAction,
  resolveTrack2IcsLabaDrugId,
  resolveTrack2MonoIcsDrugId,
  shouldDeferTripleInhalerToCopd
} from './helpers';

export const asthmaTrack2OutpatientRules: Rule[] = [
  asthmaRule({
    id: 'asthma.track2.management',
    setting: 'outpatient',
    nameVi: 'Phân nhánh thay thế Track 2 (Bậc 1–4): ICS hoặc ICS-LABA duy trì + SABA khi cần (có bảo vệ không ngừng LABA khi hạ bậc)',
    citationIds: [
      'gina.asthma.2026.never_saba_alone',
      'gina.asthma.2026.step_down_no_stop_laba',
      'byt.asthma.2020.ics_laba_vn_strengths'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      const ci = ctx.patient.customInputs ?? {};
      if (ci.currentTrack !== 'track2') return false;
      if (evaluateGinaControl(ctx).level === 'missing') return false;
      return computeEffectiveTrack2Step(ctx) <= 4; // qa-allow: ui-step - Bậc 1–4 Track 2 (Bậc 5 xử lý ở rules.track2.step5)
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const rawStep = typeof ci.currentStep === 'number' ? ci.currentStep : 0;
      const effectiveStep = computeEffectiveTrack2Step(ctx);
      const stepDown = isStepDownEligible(ctx);
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);

      const existingTrack2IcsLaba = ctx.patient.currentMeds.find((m) =>
        TRACK2_ICS_LABA_DRUGS.has(m.drugId.toLowerCase())
      );

      if (effectiveStep === 2 && rawStep === 3 && stepDown && existingTrack2IcsLaba) {
        const safeLabaId = resolveTrack2IcsLabaDrugId(ctx);
        const { action, switchFrom } = resolveControllerAction(ctx, safeLabaId, 'REDUCE');
        const minRed = thFor('percentage', 'asthma.step_down.reduction_min_pct');
        const maxRed = thFor('percentage', 'asthma.step_down.reduction_max_pct');
        const devNote = milkAllergy ? ' (dùng bình xịt pMDI không chứa lactose qua buồng đệm)' : '';

        return {
          id: 'rec_asthma_track2_step1_2',
          module: 'asthma',
          tier: 'Điều trị Kiểm soát nền (Track 2 Thay thế)',
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 88, // qa-allow: index - độ ưu tiên phác đồ hạ bậc an toàn
          action,
          drugId: safeLabaId,
          switchFrom,
          dose: asDose(
            `Hạ bậc an toàn từ Bậc 3: Giảm ${minRed}–${maxRed}% thành phần ICS trong bình ICS-LABA hiện tại hoặc giảm tần suất xuống 1 lần/ngày${devNote} + SABA khi cần (KHÔNG ngừng đơn thuần thành phần LABA)`
          ),
          title: 'Track 2 (Hạ bậc từ Bậc 3 → Bậc 2): Giảm 50% liều ICS-LABA hoặc dùng 1 lần/ngày — Tránh ngừng đơn thuần LABA',
          rationale:
            'Theo GINA 2026 (Box 4-13, Chứng cứ A) và Bộ Y tế QĐ 1851/2020 (Bảng 8), khi hạ bậc ở bệnh nhân đang kiểm soát tốt với ICS-LABA liều thấp, ngừng hoàn toàn thành phần LABA để chuyển ngang về ICS đơn chất làm tăng nguy cơ mất kiểm soát và đợt cấp nhập viện. Lựa chọn an toàn là giảm 50% liều thành phần ICS-LABA (hoặc chuyển sang ICS-LABA ngày 1 lần / chuyển sang ICS-formoterol khi cần Track 1).',
          gates: [],
          citationIds: [
            'gina.asthma.2026.step_down_no_stop_laba',
            'gina.asthma.2026.step_down_months',
            'gina.asthma.2026.step_down_reduction_rate',
            'byt.asthma.2020.step_down_options'
          ]
        };
      }

      if (effectiveStep === 1 || effectiveStep === 2) {
        const monoIcsId = resolveTrack2MonoIcsDrugId(ctx);
        const desiredMono = rawStep >= 2 && stepDown ? 'REDUCE' : 'CONTINUE';
        const { action, switchFrom } = resolveControllerAction(ctx, monoIcsId, desiredMono);

        const fpMin = thFor('dose_daily', 'asthma.ics.fluticasone_prop_low_min');
        const fpMax = thFor('dose_daily', 'asthma.ics.fluticasone_prop_low_max');
        const budMin = thFor('dose_daily', 'asthma.ics.budesonide_low_min');
        const budMax = thFor('dose_daily', 'asthma.ics.budesonide_low_max');
        const bdpMin = thFor('dose_daily', 'asthma.ics.beclometasone_low_min');
        const bdpMax = thFor('dose_daily', 'asthma.ics.beclometasone_low_max');

        let monoDose: string;
        if (monoIcsId === 'budesonide') {
          monoDose = milkAllergy
            ? `Budesonide pMDI không chứa lactose ${budMin}–${budMax} mcg/ngày qua buồng đệm (kèm SABA pMDI khi cần)`
            : `${budMin}–${budMax} mcg/ngày chia 1–2 lần (hoặc hít kèm mỗi lần xịt SABA ở Bậc 1)`;
        } else if (monoIcsId === 'beclometasone') {
          monoDose = `Beclometasone pMDI HFA siêu mịn ${bdpMin}–${bdpMax} mcg/ngày chia 2 lần qua buồng đệm (ít tương tác CYP3A4; kèm SABA pMDI khi cần)`;
        } else {
          monoDose = milkAllergy
            ? `Flixotide Evohaler pMDI (không chứa lactose) ${fpMin}–${fpMax} mcg/ngày chia 2 lần qua buồng đệm (kèm SABA pMDI khi cần)`
            : `${fpMin}–${fpMax} mcg/ngày chia 2 lần hàng ngày (hoặc hít ngay kèm mỗi lần xịt SABA ở Bậc 1)`;
        }

        return {
          id: 'rec_asthma_track2_step1_2',
          module: 'asthma',
          tier: 'Điều trị Kiểm soát nền (Track 2 Thay thế)',
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 88, // qa-allow: index - độ ưu tiên phác đồ Track 2
          action,
          drugId: monoIcsId,
          switchFrom,
          dose: asDose(monoDose),
          title: 'Track 2 Bậc 1–2: Duy trì ICS liều thấp hàng ngày (hoặc dùng ICS mỗi khi xịt SABA)',
          rationale:
            'Theo GINA 2026, Track 2 chỉ là lựa chọn thay thế khi không có sẵn ICS-formoterol hoặc người bệnh ổn định, tuân thủ rất tốt và không có đợt cấp trong năm qua. Trước khi chọn cắt cơn bằng SABA, phải chắc chắn bệnh nhân sẽ tuân thủ dùng ICS hàng ngày (ở Bậc 1 bắt buộc hít kèm ICS mỗi lần dùng SABA).',
          gates: [],
          citationIds: [
            'gina.asthma.2026.never_saba_alone',
            'byt.asthma.2020.no_saba_monotherapy',
            'gina.asthma.2026.table_6_budesonide',
            'gina.asthma.2026.table_6_fluticasone_propionate',
            'gina.asthma.2026.table_6_beclometasone_extrafine'
          ]
        };
      }

      const icsLabaId = resolveTrack2IcsLabaDrugId(ctx);
      const isStep4 = effectiveStep === 4;
      const desiredIcsLaba =
        rawStep > effectiveStep && stepDown
          ? 'REDUCE'
          : rawStep > 0 && rawStep < effectiveStep
            ? 'UPTITRATE'
            : 'CONTINUE';
      const { action, switchFrom } = resolveControllerAction(ctx, icsLabaId, desiredIcsLaba);

      let comboDose: string;
      if (icsLabaId === 'fluticasone_vilanterol') {
        comboDose = isStep4
          ? '92/22 – 184/22 mcg (Relvar Ellipta 100/25 hoặc 200/25): Hít 1 nhát x 1 lần/ngày + SABA khi cần cắt cơn'
          : '92/22 mcg (Relvar Ellipta 100/25): Hít 1 nhát x 1 lần/ngày + SABA khi cần cắt cơn';
      } else if (icsLabaId === 'mometasone_formoterol') {
        comboDose = isStep4
          ? '200/5 mcg (Dulera pMDI): Xịt 2 nhát x 2 lần/ngày + SABA khi cần cắt cơn'
          : '100/5 mcg (Dulera pMDI): Xịt 2 nhát x 2 lần/ngày + SABA khi cần cắt cơn';
      } else if (milkAllergy) {
        comboDose = isStep4
          ? 'Seretide Evohaler pMDI (không chứa lactose) 125/25 mcg: Xịt 2 nhát x 2 lần/ngày qua buồng đệm + Salbutamol pMDI khi cần'
          : 'Seretide Evohaler pMDI (không chứa lactose) 50/25 – 125/25 mcg: Xịt 2 nhát x 2 lần/ngày qua buồng đệm + Salbutamol pMDI khi cần';
      } else {
        comboDose = isStep4
          ? '250/50 mcg Accuhaler 1 nhát x 2 lần/ngày (hoặc 125/25 mcg Evohaler pMDI 2 nhát x 2 lần/ngày) + SABA khi cần cắt cơn'
          : '100/50 – 250/50 mcg Accuhaler 1 nhát x 2 lần/ngày + SABA khi cần cắt cơn';
      }

      return {
        id: 'rec_asthma_track2_step3_4',
        module: 'asthma',
        tier: 'Điều trị Kiểm soát nền (Track 2 Thay thế)',
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 88, // qa-allow: index - độ ưu tiên phác đồ Track 2
        action,
        drugId: icsLabaId,
        switchFrom,
        dose: asDose(comboDose),
        title: `Track 2 Bậc ${effectiveStep}: Duy trì ICS-LABA liều ${isStep4 ? 'trung bình' : 'thấp'} cố định hàng ngày + SABA khi cần`,
        rationale:
          'Phối hợp ICS-LABA liều cố định hàng ngày giúp cải thiện triệu chứng và FEV₁ tốt hơn so với tăng gấp đôi liều ICS đơn thuần. Người bệnh bắt buộc mang theo bình SABA riêng để cắt cơn và không bao giờ dùng bình LABA cố định (như Salmeterol/Vilanterol) để cắt cơn cấp.',
        gates: [],
        citationIds: [
          'gina.asthma.2026.never_saba_alone',
          'byt.asthma.2020.ics_laba_vn_strengths'
        ]
      };
    }
  })
];
