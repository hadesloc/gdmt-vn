/**
 * GDMT-VN Gout Module - Allopurinol Safety Cap, Ambiguous Dose & Initiation Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  goutMissing,
  THIAZIDE_DRUG_IDS,
  isOnMed,
  findMed,
  hasAmbiguousCountMedDose,
  isPregnant,
  hasHepaticImpairment,
  isAsymptomaticHyperuricemia,
  getHlaB5801Status,
  isHighRiskHlaB5801Ancestry,
  isOnDialysis,
  isAllopurinolBeingStopped,
  doesUltExceedSafetyCap,
  canInitiateUltNow,
  selectUltInitDrug
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutAllopurinolInitRules: Rule[] = [
  goutRule({
    id: 'gout.allopurinol.safety_reduce',
    nameVi: 'Giảm liều Allopurinol đang dùng khi vượt trần tối đa an toàn hoặc vượt trần suy thận nặng',
    citationIds: [
      'fda.allopurinol.renal_dosing',
      'fda.allopurinol.start_and_max',
      'eular.gout.2016.allopurinol_titration'
    ],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isOnMed(ctx, ['allopurinol']) &&
      !isAllopurinolBeingStopped(ctx) &&
      doesUltExceedSafetyCap(ctx, 'allopurinol'),
    produce: (ctx): Recommendation => {
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const maxDose = thFor('dose_mg', 'gout.allopurinol.max_dose');
      const crcl10 = thFor('crcl', 'gout.allopurinol.crcl_10');
      const crcl20 = thFor('crcl', 'gout.allopurinol.crcl_20');
      const capCrcl10 = thFor('dose_mg', 'gout.allopurinol.dose_crcl_under_10');
      const capCrcl20 = thFor('dose_mg', 'gout.allopurinol.dose_crcl_10_20');

      const under10 =
        ctx.settings.profile !== 'US' &&
        ((crcl !== undefined && crcl < crcl10) || (egfr !== undefined && egfr < crcl10));
      const under20 =
        ctx.settings.profile !== 'US' &&
        !under10 &&
        ((crcl !== undefined && crcl < crcl20) || (egfr !== undefined && egfr < crcl20));

      const capMg = under10 ? capCrcl10 : under20 ? capCrcl20 : maxDose;

      return goutRec({
        id: 'rec_gout_allopurinol_safety_reduce',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên giảm liều an toàn
        action: 'REDUCE',
        drugId: 'allopurinol',
        dose: `Tối đa ≤ ${capMg} mg/ngày`,
        title:
          under10 || under20
            ? `GIẢM LIỀU Allopurinol xuống tối đa ≤ ${capMg} mg/ngày theo mức suy thận nặng`
            : `GIẢM LIỀU Allopurinol xuống không quá trần tối đa ${capMg} mg/ngày`,
        rationale:
          under10 || under20
            ? `Liều Allopurinol hiện tại vượt quá giới hạn an toàn theo độ thanh thải thận (CrCl/eGFR < ${under10 ? crcl10 : crcl20} mL/phút: tối đa ${capMg} mg/ngày theo nhãn FDA Zyloprim & EULAR 2016), làm tích lũy oxypurinol và tăng nguy cơ hội chứng quá mẫn nặng AHS/SCAR kể cả khi đang trong cơn cấp hoặc đã đạt đích urat.`
            : `Theo nhãn FDA Zyloprim và ACR 2020, liều tối đa khuyến cáo hàng ngày của Allopurinol là ${maxDose} mg/ngày; bắt buộc giảm liều về ngưỡng an toàn.`,
        citationIds: [
          'fda.allopurinol.renal_dosing',
          'fda.allopurinol.start_and_max',
          'eular.gout.2016.allopurinol_titration'
        ]
      });
    }
  }),

  goutRule({
    id: 'gout.allopurinol.ambiguous_dose',
    nameVi: 'Xác nhận hàm lượng mg viên Allopurinol đang dùng khi chỉ nhập đơn vị đếm viên (QA-1 Fail-closed)',
    citationIds: ['fda.allopurinol.start_and_max', 'fda.allopurinol.renal_dosing'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isAsymptomaticHyperuricemia(ctx) &&
      isOnMed(ctx, ['allopurinol']) &&
      !isAllopurinolBeingStopped(ctx) &&
      hasAmbiguousCountMedDose(findMed(ctx, ['allopurinol'])),
    produce: () => {
      const tab100 = thFor('dose_mg', 'gout.allopurinol.start_dose_normal');
      return goutRec({
        id: 'rec_gout_allopurinol_confirm_strength',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên xác nhận hàm lượng
        action: 'CONSIDER',
        drugId: 'allopurinol',
        title: `Xác nhận hàm lượng mg viên Allopurinol đang dùng (viên ${tab100} mg hay viên hàm lượng cao)`,
        rationale:
          `Đơn thuốc hiện chỉ ghi số lượng "viên" mà chưa rõ hàm lượng miligam. Do Allopurinol trên thị trường có nhiều hàm lượng khác nhau, hệ thống tạm khóa tự động tăng liều hoặc xác nhận trần thận cho tới khi xác minh chính xác tổng liều mg/ngày.`,
        citationIds: ['fda.allopurinol.start_and_max', 'fda.allopurinol.renal_dosing']
      });
    }
  }),

  goutRule({
    id: 'gout.allopurinol.initiate',
    nameVi: 'Khởi trị Allopurinol liều thấp cá thể hóa theo chức năng thận',
    citationIds: [
      'acr.gout.2020.allopurinol_first_line',
      'acr.gout.2020.allopurinol_low_dose_start',
      'acr.gout.2020.allopurinol_start_dose_ckd_50',
      'byt.ckd.2024.gout_ult_table21'
    ],
    when: (ctx) =>
      selectUltInitDrug(ctx) === 'allopurinol' ||
      (canInitiateUltNow(ctx) && need(ctx, 'egfr') === undefined && !isOnDialysis(ctx)),
    produce: (ctx): Recommendation => {
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined && !isOnDialysis(ctx)) {
        return goutMissing(
          'egfr',
          'Cần xét nghiệm Creatinin/eGFR trước khi khởi trị thuốc hạ acid uric máu (ULT) để chọn thuốc và chỉnh liều khởi đầu an toàn theo chức năng thận.',
          ['acr.gout.2020.allopurinol_start_dose_ckd_50', 'byt.ckd.2024.gout_ult_table21']
        );
      }
      const ckdCutoff = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
      const isCkd = isOnDialysis(ctx) || hasCondition(ctx, 'ckd') || (egfr !== undefined && egfr < ckdCutoff);
      const startNorm = thFor('dose_mg', 'gout.allopurinol.start_dose_normal');
      const startCkd = thFor('dose_mg', 'gout.allopurinol.start_dose_ckd');
      const doseMg = isCkd ? startCkd : startNorm;

      const isHighRiskUnscreened = getHlaB5801Status(ctx) === 'not_done' && isHighRiskHlaB5801Ancestry(ctx);

      const warns = [
        'Dặn bệnh nhân NGỪNG THUỐC NGAY LẬP TỨC và đi khám khẩn nếu xuất hiện ngứa, mẩn đỏ da, loét miệng/mắt hoặc sốt (dấu hiệu sớm SJS/TEN/DRESS).'
      ];
      if (isHighRiskUnscreened) {
        warns.unshift(
          'ƯU TIÊN thực hiện xét nghiệm gen HLA-B*58:01 trước khi uống viên Allopurinol đầu tiên tại cơ sở có sẵn xét nghiệm (hoặc cân nhắc Febuxostat nếu cần hạ urat ngay mà chưa sàng lọc được gen).'
        );
      }
      if (hasHepaticImpairment(ctx)) {
        warns.push('Bệnh nhân có bệnh gan nền: Kiểm tra định kỳ men gan AST/ALT trong giai đoạn đầu điều trị.');
      }
      if (isOnMed(ctx, THIAZIDE_DRUG_IDS)) {
        warns.push('Đang dùng kèm lợi tiểu Thiazide: Tăng cảnh giác phản ứng quá mẫn Allopurinol trên nền suy giảm đào thải thận.');
      }

      const doseText = isOnDialysis(ctx)
        ? `≤ ${startCkd} mg sau mỗi buổi lọc máu chu kỳ (hoặc ≤ ${startCkd} mg/ngày nếu lọc màng bụng)`
        : isCkd
          ? `≤ ${doseMg} mg x 1 lần/ngày sau ăn`
          : `${doseMg} mg x 1 lần/ngày sau ăn`;

      return goutRec({
        id: 'rec_gout_allopurinol_start',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 86, // qa-allow: index - độ ưu tiên ULT
        action: 'START',
        drugId: 'allopurinol',
        dose: doseText,
        title: isHighRiskUnscreened
          ? `Khởi trị Allopurinol liều thấp (${doseText}) — Lưu ý sàng lọc HLA-B*58:01 trước liều đầu`
          : `Khởi trị thuốc đầu tay Allopurinol liều thấp (${doseText})`,
        rationale:
          'ACR 2020 khuyến cáo mạnh Allopurinol là thuốc hạ urat đầu tay cho mọi bệnh nhân gút (kể cả CKD giai đoạn ≥ 3). Bắt đầu liều thấp rồi chuẩn độ tăng dần giúp giảm nguy cơ phản ứng quá mẫn nặng AHS/SCAR và hạn chế bùng phát cơn cấp.',
        warnings: warns,
        citationIds: [
          'acr.gout.2020.allopurinol_first_line',
          'acr.gout.2020.allopurinol_low_dose_start',
          'acr.gout.2020.allopurinol_start_dose_ckd_50',
          'fda.allopurinol.skin_rash_scar',
          'fda.allopurinol.hepatic_and_thiazide',
          'byt.ckd.2024.gout_ult_table21'
        ]
      });
    }
  })
];
