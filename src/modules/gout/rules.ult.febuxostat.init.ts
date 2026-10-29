/**
 * GDMT-VN Gout Module - Febuxostat Safety Cap, Ambiguous Dose, CVD Switch & Initiation Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  isOnMed,
  findMed,
  hasAmbiguousCountMedDose,
  isPregnant,
  hasHepaticImpairment,
  hasModerateOrSevereHepaticImpairment,
  isAcuteGoutFlare,
  isAsymptomaticHyperuricemia,
  getHlaB5801Status,
  isAllopurinolIntolerant,
  hasEstablishedCvd,
  isOnDialysis,
  isFebuxostatBeingStopped,
  doesUltExceedSafetyCap,
  selectUltInitDrug
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutFebuxostatInitRules: Rule[] = [
  goutRule({
    id: 'gout.febuxostat.safety_reduce',
    nameVi: 'Giảm liều Febuxostat đang dùng khi vượt trần suy thận nặng, suy gan vừa hoặc trần liều hồ sơ',
    citationIds: [
      'fda.febuxostat.severe_renal',
      'fda.febuxostat.renal_clcr_30',
      'fda.febuxostat.dialysis_hepatic',
      'fda.febuxostat.dosage',
      'byt.ckd.2024.gout_ult_table21'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || !isOnMed(ctx, ['febuxostat']) || isFebuxostatBeingStopped(ctx)) return false;
      const canSwitchAllo = getHlaB5801Status(ctx) !== 'positive' && !isAllopurinolIntolerant(ctx);
      if (!isAcuteGoutFlare(ctx) && hasEstablishedCvd(ctx) && canSwitchAllo) return false;
      return doesUltExceedSafetyCap(ctx, 'febuxostat');
    },
    produce: (ctx): Recommendation => {
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const severeEgfr = thFor('egfr', 'gout.febuxostat.severe_renal_egfr');
      const severeCrcl = thFor('crcl', 'gout.febuxostat.severe_renal_crcl');
      const renalMax = thFor('dose_mg', 'gout.febuxostat.severe_renal_max_dose');

      const isSevereRenal =
        isOnDialysis(ctx) ||
        (egfr !== undefined && egfr < severeEgfr) ||
        (crcl !== undefined && crcl < severeCrcl);

      if (isSevereRenal) {
        return goutRec({
          id: 'rec_gout_febuxostat_renal_reduce',
          tier: TIER_SAFETY,
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 94, // qa-allow: index - độ ưu tiên giảm liều thận
          action: 'REDUCE',
          drugId: 'febuxostat',
          dose: `${renalMax} mg x 1 lần/ngày (trần tối đa ở suy thận nặng)`,
          title: `GIẢM LIỀU Febuxostat xuống tối đa ${renalMax} mg/ngày do suy thận nặng (eGFR/CrCl < ${severeEgfr} mL/phút)`,
          rationale:
            `Theo nhãn FDA Uloric (Mục 2.2 & 8.6), ở bệnh nhân suy thận nặng (CrCl < ${severeCrcl} mL/phút), bắt buộc giới hạn liều Febuxostat không vượt quá ${renalMax} mg x 1 lần/ngày kể cả khi đang trong cơn gút cấp hoặc đã đạt đích urat.`,
          citationIds: ['fda.febuxostat.severe_renal', 'fda.febuxostat.renal_clcr_30']
        });
      }

      const modHepatic = hasModerateOrSevereHepaticImpairment(ctx);
      const capMg =
        ctx.settings.profile === 'US' || modHepatic
          ? thFor('dose_mg', 'gout.febuxostat.hepatic_moderate_max_dose')
          : thFor('dose_mg', 'gout.febuxostat.max_dose_intl_vn');

      return goutRec({
        id: 'rec_gout_febuxostat_cap_reduce',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 94, // qa-allow: index - độ ưu tiên giảm liều trần
        action: 'REDUCE',
        drugId: 'febuxostat',
        dose: `Tối đa ≤ ${capMg} mg x 1 lần/ngày`,
        title: modHepatic
          ? `GIẢM LIỀU Febuxostat xuống tối đa ≤ ${capMg} mg/ngày do suy giảm chức năng gan (Child-Pugh B/C)`
          : `GIẢM LIỀU Febuxostat xuống không quá trần tối đa ${capMg} mg/ngày`,
        rationale: modHepatic
          ? `Theo nhãn FDA Uloric (Mục 8.7), dữ liệu Febuxostat trên suy gan vừa (Child-Pugh B) chỉ giới hạn tới ≤ ${capMg} mg/ngày và chưa được nghiên cứu trên suy gan nặng (Child-Pugh C); không dùng liều cao hơn để tránh độc tính gan.`
          : `Liều Febuxostat đang dùng vượt quá trần tối đa khuyến cáo (${capMg} mg/ngày); bắt buộc giảm về ngưỡng an toàn.`,
        citationIds: ['fda.febuxostat.dosage', 'fda.febuxostat.dialysis_hepatic', 'byt.ckd.2024.gout_ult_table21']
      });
    }
  }),

  goutRule({
    id: 'gout.febuxostat.ambiguous_dose',
    nameVi: 'Xác nhận hàm lượng mg viên Febuxostat đang dùng khi chỉ nhập đơn vị đếm viên (QA-1 Fail-closed)',
    citationIds: ['fda.febuxostat.dosage', 'fda.febuxostat.severe_renal'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isAsymptomaticHyperuricemia(ctx) &&
      isOnMed(ctx, ['febuxostat']) &&
      !isFebuxostatBeingStopped(ctx) &&
      hasAmbiguousCountMedDose(findMed(ctx, ['febuxostat'])),
    produce: () => {
      const startDose = thFor('dose_mg', 'gout.febuxostat.start_dose');
      const targetDose = thFor('dose_mg', 'gout.febuxostat.target_dose');
      return goutRec({
        id: 'rec_gout_febuxostat_confirm_strength',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên xác nhận hàm lượng
        action: 'CONSIDER',
        drugId: 'febuxostat',
        title: `Xác nhận hàm lượng mg viên Febuxostat đang dùng (viên ${startDose} mg hay viên ${targetDose} mg)`,
        rationale:
          `Đơn thuốc hiện chỉ ghi số lượng "viên" mà chưa rõ hàm lượng miligam. Do Febuxostat cần giới hạn trần ≤ ${startDose} mg/ngày ở suy thận nặng (eGFR < ${thFor('egfr', 'gout.febuxostat.severe_renal_egfr')} mL/phút), cần xác minh chính xác hàm lượng viên trước khi duyệt liều hoặc chuẩn độ.`,
        citationIds: ['fda.febuxostat.dosage', 'fda.febuxostat.severe_renal']
      });
    }
  }),

  goutRule({
    id: 'gout.febuxostat.cvd_avoid',
    nameVi: 'Cảnh báo hộp đen tim mạch FDA (CARES): Cân nhắc chuyển Febuxostat sang Allopurinol khi có bệnh tim mạch',
    citationIds: ['acr.gout.2020.febuxostat_cvd_switch', 'fda.febuxostat.boxed_warning'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isAcuteGoutFlare(ctx) &&
      isOnMed(ctx, ['febuxostat']) &&
      !isFebuxostatBeingStopped(ctx) &&
      hasEstablishedCvd(ctx) &&
      getHlaB5801Status(ctx) !== 'positive' &&
      !isAllopurinolIntolerant(ctx),
    produce: () =>
      goutRec({
        id: 'rec_gout_febuxostat_cvd_switch',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên an toàn tim mạch
        action: 'SWITCH',
        drugId: 'febuxostat',
        title: 'Cân nhắc chuyển đổi Febuxostat sang Allopurinol do tiền sử bệnh tim mạch (FDA Boxed Warning)',
        rationale:
          'Nghiên cứu CARES ghi nhận tỷ lệ tử vong tim mạch cao hơn ở nhóm dùng Febuxostat so với Allopurinol trên người có bệnh tim mạch đã xác lập. ACR 2020 khuyến cáo chuyển sang Allopurinol nếu không mang HLA-B*58:01 và không dị ứng.',
        citationIds: ['acr.gout.2020.febuxostat_cvd_switch', 'fda.febuxostat.boxed_warning']
      })
  }),

  goutRule({
    id: 'gout.febuxostat.initiate',
    nameVi: 'Khởi trị Febuxostat khi chống chỉ định hoặc không dung nạp Allopurinol',
    citationIds: [
      'acr.gout.2020.allopurinol_low_dose_start',
      'fda.febuxostat.dosage',
      'fda.febuxostat.boxed_warning',
      'fda.febuxostat.allopurinol_skin_cross_caution'
    ],
    when: (ctx) => selectUltInitDrug(ctx) === 'febuxostat',
    produce: (ctx): Recommendation => {
      const startDose = thFor('dose_mg', 'gout.febuxostat.start_dose');
      const warns: string[] = [];
      if (isAllopurinolIntolerant(ctx)) {
        warns.push(
          'Tiền sử dị ứng / phản ứng da với Allopurinol: Nhãn FDA Uloric (Mục 5.3) ghi nhận hiếm gặp phản ứng da nặng (SJS/TEN/DRESS) trên người từng phản ứng da với Allopurinol — dặn bệnh nhân ngừng thuốc ngay nếu nổi ban đỏ, ngứa hoặc loét niêm mạc.'
        );
      }
      if (hasEstablishedCvd(ctx)) {
        warns.push(
          'Cảnh báo hộp đen FDA (CARES): Bệnh nhân có bệnh tim mạch nhưng không dùng được Allopurinol — theo dõi sát triệu chứng đau ngực, khó thở, đột quỵ.'
        );
      }
      if (isOnDialysis(ctx)) {
        warns.push(`Bệnh nhân đang lọc máu: Dữ liệu Febuxostat còn hạn chế, giới hạn tối đa ${startDose} mg/ngày và theo dõi sát.`);
      }
      if (hasHepaticImpairment(ctx)) {
        warns.push('Bệnh nhân có bệnh gan nền: Kiểm tra AST/ALT/Bilirubin nền và định kỳ trong quá trình điều trị.');
      }
      return goutRec({
        id: 'rec_gout_febuxostat_start',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 86, // qa-allow: index - độ ưu tiên ULT
        action: 'START',
        drugId: 'febuxostat',
        dose: `${startDose} mg x 1 lần/ngày`,
        title: `Khởi trị Febuxostat liều thấp ${startDose} mg x 1 lần/ngày`,
        rationale:
          `Khi chống chỉ định Allopurinol (HLA-B*58:01 dương tính hoặc tiền sử dị ứng Allopurinol), Febuxostat khởi đầu liều thấp ${startDose} mg/ngày là lựa chọn XOI thay thế hiệu quả.`,
        warnings: warns.length > 0 ? warns : undefined,
        citationIds: [
          'acr.gout.2020.allopurinol_low_dose_start',
          'fda.febuxostat.dosage',
          'fda.febuxostat.boxed_warning',
          'fda.febuxostat.dialysis_hepatic',
          'fda.febuxostat.allopurinol_skin_cross_caution'
        ]
      });
    }
  })
];
