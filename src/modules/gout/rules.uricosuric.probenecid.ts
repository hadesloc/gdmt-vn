/**
 * GDMT-VN Gout Module - Probenecid Uricosuric Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  goutMissing,
  isOnMed,
  findMed,
  parseMedDailyDoseMg,
  hasAmbiguousCountMedDose,
  isPregnant,
  hasTophi,
  hasXrayDamage,
  hasUrolithiasis,
  hasSecondaryHyperuricemiaOrTls,
  getFlaresPerYear,
  isAcuteGoutFlare,
  isOnDialysis,
  isAsymptomaticHyperuricemia,
  isProbenecidAllergic,
  isProbenecidContraindicated,
  doesUltExceedSafetyCap,
  hasSubmaximalActiveXoi,
  isUrateBelowTarget,
  isUrateBelowLongTermFloor,
  canInitiateUltNow,
  selectUltInitDrug
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutProbenecidRules: Rule[] = [
  goutRule({
    id: 'gout.uricosuric.probenecid_safety_reduce',
    nameVi: 'Giảm liều Probenecid đang dùng khi vượt quá trần tối đa 2 g/ngày',
    citationIds: ['eular.gout.2016.benzbromarone_probenecid_dosing', 'acr.gout.2020.probenecid_low_dose'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isOnMed(ctx, ['probenecid']) &&
      !isProbenecidContraindicated(ctx) &&
      doesUltExceedSafetyCap(ctx, 'probenecid'),
    produce: () => {
      const maxDoseG = thFor('dose_g', 'gout.probenecid.max_dose_g');
      return goutRec({
        id: 'rec_gout_probenecid_safety_reduce',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 94, // qa-allow: index - độ ưu tiên giảm liều an toàn
        action: 'REDUCE',
        drugId: 'probenecid',
        dose: `Tối đa ≤ ${maxDoseG} g/ngày`,
        title: `GIẢM LIỀU Probenecid xuống không quá trần tối đa ${maxDoseG} g/ngày`,
        rationale:
          `Liều Probenecid hiện tại vượt quá trần tối đa khuyến cáo (${maxDoseG} g/ngày theo EULAR 2016), làm tăng vọt nguy cơ kết tinh sỏi acid uric ống thận và độc tính thần kinh – tiêu hóa.`,
        citationIds: ['eular.gout.2016.benzbromarone_probenecid_dosing', 'acr.gout.2020.probenecid_low_dose']
      });
    }
  }),

  goutRule({
    id: 'gout.uricosuric.probenecid_ambiguous_dose',
    nameVi: 'Xác nhận hàm lượng mg viên Probenecid đang dùng khi chỉ nhập đơn vị đếm viên (QA-1 Fail-closed)',
    citationIds: ['acr.gout.2020.probenecid_low_dose', 'eular.gout.2016.benzbromarone_probenecid_dosing'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isAsymptomaticHyperuricemia(ctx) &&
      isOnMed(ctx, ['probenecid']) &&
      !isProbenecidContraindicated(ctx) &&
      hasAmbiguousCountMedDose(findMed(ctx, ['probenecid'])),
    produce: () => {
      const startDose = thFor('dose_mg', 'gout.probenecid.start_dose');
      return goutRec({
        id: 'rec_gout_probenecid_confirm_strength',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 89, // qa-allow: index - độ ưu tiên xác nhận hàm lượng
        action: 'CONSIDER',
        drugId: 'probenecid',
        title: `Xác nhận hàm lượng mg viên Probenecid đang dùng (thường gặp viên ${startDose} mg)`,
        rationale:
          'Đơn thuốc hiện chỉ ghi số lượng "viên" mà chưa rõ hàm lượng miligam; cần xác nhận chính xác tổng liều mg/ngày trước khi chuẩn độ tăng liều.',
        citationIds: ['acr.gout.2020.probenecid_low_dose', 'eular.gout.2016.benzbromarone_probenecid_dosing']
      });
    }
  }),

  goutRule({
    id: 'gout.uricosuric.probenecid',
    nameVi: 'Quản lý thuốc tăng thải acid uric Probenecid (chống chỉ định, khởi trị thay thế XOI & chuẩn độ)',
    citationIds: [
      'acr.gout.2020.probenecid_low_dose',
      'acr.gout.2020.xoi_over_probenecid',
      'acr.gout.2020.uricosuric_renal_stones_contra',
      'acr.gout.2020.uricosuric_no_urine_check_alkalinize',
      'eular.gout.2016.benzbromarone_probenecid_dosing',
      'byt.gout.2014.uricosuric_contra',
      'kdigo.gout.2024.xoi_preference'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx)) return false;
      const onProb = isOnMed(ctx, ['probenecid']);
      if (onProb && (doesUltExceedSafetyCap(ctx, 'probenecid') || hasAmbiguousCountMedDose(findMed(ctx, ['probenecid'])))) {
        return isProbenecidContraindicated(ctx);
      }
      const wantsProb = Boolean(
        ctx.normalized.customInputs?.preferProbenecid || ctx.normalized.customInputs?.preferUricosuric
      );
      if (onProb || wantsProb) return true;
      return selectUltInitDrug(ctx) === 'probenecid';
    },
    produce: (ctx): Recommendation | null => {
      const onProb = isOnMed(ctx, ['probenecid']);
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const age = need(ctx, 'age');
      const egfrContra = thFor('egfr', 'gout.probenecid.egfr_contra_min');
      const crclContra = thFor('crcl', 'gout.probenecid.crcl_contra_min');
      const egfrPreferXoi = thFor('egfr', 'gout.probenecid.egfr_prefer_xoi_min');
      const vnUrineMax = thFor('dose_mg', 'gout.uricosuric.vn_urine_urate_max');
      const vnAgeMin = thFor('age', 'gout.uricosuric.vn_elderly_age_min');

      if (isProbenecidContraindicated(ctx)) {
        const reasons: string[] = [];
        if (isProbenecidAllergic(ctx)) reasons.push('tiền sử dị ứng Probenecid');
        if (hasUrolithiasis(ctx)) reasons.push('tiền sử sỏi thận tiết niệu');
        if (ctx.normalized.customInputs?.uricAcidOverproduction || hasSecondaryHyperuricemiaOrTls(ctx)) {
          reasons.push(`tăng sản xuất acid uric quá mức / bệnh máu ác tính – TLS (uric niệu > ${vnUrineMax} mg/24h gây kết tủa tinh thể urat tắc ống thận cấp)`);
        }
        if (isOnMed(ctx, ['ketorolac', 'methotrexate'])) {
          reasons.push('đang dùng kèm Ketorolac hoặc Methotrexate (tương tác ức chế bài tiết ống thận gây độc tính nặng)');
        }
        if (isOnDialysis(ctx) || (egfr !== undefined && egfr < egfrContra) || (crcl !== undefined && crcl < crclContra)) {
          reasons.push(`suy thận nặng (eGFR/CrCl < ${egfrContra} mL/phút hoặc lọc máu)`);
        }
        if (ctx.settings.profile === 'VN') {
          if (hasTophi(ctx)) reasons.push('gút mạn có hạt tophi (chống chỉ định theo BYT 361/2014)');
          if (age !== undefined && age >= vnAgeMin) {
            reasons.push(`người cao tuổi ≥ ${vnAgeMin} tuổi (theo BYT 361/2014)`);
          }
        }
        return goutRec({
          id: onProb ? 'rec_gout_probenecid_stop_contra' : 'rec_gout_probenecid_avoid_stone',
          tier: TIER_SAFETY,
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: onProb ? 98 : 88, // qa-allow: index - độ ưu tiên an toàn
          action: onProb ? 'STOP' : 'AVOID',
          drugId: 'probenecid',
          title: onProb
            ? 'NGỪNG Probenecid do chống chỉ định thận / sỏi tiết niệu / tăng sản xuất urat'
            : 'Chống chỉ định / Tránh dùng Probenecid',
          rationale: `Chống chỉ định dùng Probenecid do: ${reasons.join('; ') || 'nguy cơ kết tinh sỏi urat hoặc mất hiệu lực thải urat qua ống thận'}. Ưu tiên nhóm ức chế Xanthine Oxidase (XOI).`,
          citationIds: [
            'acr.gout.2020.uricosuric_renal_stones_contra',
            'ema.desuric.contra_lithiase_hemopathy',
            'byt.gout.2014.uricosuric_contra',
            'byt.ckd.2024.gout_ult_table21'
          ]
        });
      }

      if (egfr === undefined) {
        return goutMissing(
          'egfr',
          'Cần eGFR trước khi chỉ định hoặc chuẩn độ Probenecid để loại trừ suy thận giảm hiệu lực thải urat.',
          ['acr.gout.2020.xoi_over_probenecid']
        );
      }

      if (!onProb && egfr < egfrPreferXoi) {
        return goutRec({
          id: 'rec_gout_probenecid_avoid_ckd3',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 82, // qa-allow: index - độ ưu tiên ULT
          action: 'AVOID',
          drugId: 'probenecid',
          title: `Không ưu tiên khởi trị Probenecid ở CKD giai đoạn ≥ 3 (eGFR < ${egfrPreferXoi} mL/phút/1.73m²)`,
          rationale:
            'ACR 2020 và KDIGO 2024 khuyến cáo mạnh ưu tiên thuốc ức chế Xanthine Oxidase (Allopurinol hoặc Febuxostat) hơn Probenecid ở bệnh nhân CKD giai đoạn ≥ 3 do giảm hiệu lực bài xuất urat qua ống thận.',
          citationIds: ['acr.gout.2020.xoi_over_probenecid', 'kdigo.gout.2024.xoi_preference']
        });
      }

      const startDose = thFor('dose_mg', 'gout.probenecid.start_dose');
      const maxDoseG = thFor('dose_g', 'gout.probenecid.max_dose_g');
      const maxDoseMg = maxDoseG * 1000; // qa-allow: unit-conversion - quy đổi g sang mg

      if (!onProb) {
        if (!canInitiateUltNow(ctx) || isAcuteGoutFlare(ctx)) return null;
        const selectedUlt = selectUltInitDrug(ctx);
        if (selectedUlt !== 'probenecid') {
          if (ctx.normalized.customInputs?.preferProbenecid || ctx.normalized.customInputs?.preferUricosuric) {
            return goutRec({
              id: 'rec_gout_probenecid_defer_xoi_first',
              tier: TIER_ULT,
              tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
              priority: 76, // qa-allow: index - độ ưu tiên ULT
              action: 'DEFER',
              drugId: 'probenecid',
              title: 'Chưa khởi trị Probenecid đầu tay — Ưu tiên đơn trị nhóm ức chế Xanthine Oxidase trước',
              rationale:
                'ACR 2020 và KDIGO 2024 khuyến cáo mạnh khởi trị đơn trị nhóm ức chế Xanthine Oxidase (Allopurinol / Febuxostat) đầu tay thay vì Probenecid, và không khởi trị đồng thời 2 thuốc hạ urat ngay từ đầu; chỉ cân nhắc Probenecid khi không dùng được XOI hoặc chưa đạt đích dù đã tối ưu XOI.',
              citationIds: ['acr.gout.2020.xoi_over_probenecid', 'kdigo.gout.2024.xoi_preference']
            });
          }
          return null;
        }

        return goutRec({
          id: 'rec_gout_probenecid_start',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 83, // qa-allow: index - độ ưu tiên ULT
          action: 'START',
          drugId: 'probenecid',
          dose: `${startDose} mg x 1–2 lần/ngày (tối đa ${maxDoseG} g/ngày)`,
          title: `Khởi trị Probenecid liều thấp ${startDose} mg x 1–2 lần/ngày`,
          rationale:
            'Khi cả Allopurinol và Febuxostat đều chống chỉ định hoặc không dung nạp (ví dụ đang dùng Azathioprine/6-MP) và chức năng thận bảo tồn không kèm sỏi thận, Probenecid liều thấp tăng dần là lựa chọn hạ urat phù hợp.',
          warnings: [
            'Dặn bệnh nhân uống đủ nước hàng ngày để phòng kết tinh sỏi urat đường tiết niệu; tránh phối hợp Ketorolac hoặc Salicylat liều cao.'
          ],
          profileDiff: {
            US: `ACR 2020: Khởi đầu ${startDose} mg x 1–2 lần/ngày; không cần định lượng acid uric niệu 24h hoặc kiềm hóa nước tiểu thường quy.`,
            INTL: `EULAR 2016: Chuẩn độ Probenecid tới tối đa ${maxDoseG} g/ngày để đạt đích urat.`,
            VN: `BYT 361/2014: Khuyến cáo kiểm tra acid uric niệu 24h (chống chỉ định nếu > ${vnUrineMax} mg/24h) và đảm bảo uống nhiều nước.`
          },
          citationIds: [
            'acr.gout.2020.probenecid_low_dose',
            'acr.gout.2020.uricosuric_no_urine_check_alkalinize',
            'eular.gout.2016.benzbromarone_probenecid_dosing',
            'byt.gout.2014.uricosuric_contra'
          ]
        });
      }

      if (isAcuteGoutFlare(ctx)) return null;
      const belowTarget = isUrateBelowTarget(ctx);
      if (belowTarget === undefined) {
        return goutMissing('urate', 'Cần nồng độ Acid uric máu để đánh giá đáp ứng điều trị Probenecid.', [
          'acr.gout.2020.treat_to_target'
        ]);
      }

      const floorMgDl = thFor('urate', 'gout.target.urate_floor_mgdl');

      if (belowTarget) {
        const warns = isUrateBelowLongTermFloor(ctx)
          ? [`Acid uric máu < ${floorMgDl} mg/dL: Theo EULAR 2016, cân nhắc giảm nhẹ liều duy trì dài hạn nếu hạt tophi đã tan.`]
          : undefined;
        return goutRec({
          id: 'rec_gout_probenecid_continue',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 80, // qa-allow: index - độ ưu tiên ULT
          action: 'CONTINUE',
          drugId: 'probenecid',
          title: 'Tiếp tục duy trì Probenecid (Đã đạt mục tiêu Acid uric máu)',
          rationale: 'Nồng độ acid uric máu đã đạt mục tiêu điều trị; duy trì liều hiện tại kèm uống đủ nước.',
          warnings: warns,
          citationIds: ['acr.gout.2020.treat_to_target', 'eular.gout.2016.target_urate_tophi']
        });
      }

      if (hasSubmaximalActiveXoi(ctx)) {
        return goutRec({
          id: 'rec_gout_probenecid_hold_stepwise',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 80, // qa-allow: index - độ ưu tiên chuẩn độ từng bước
          action: 'CONTINUE',
          drugId: 'probenecid',
          title: 'Giữ nguyên liều Probenecid hiện tại trong khi ưu tiên chuẩn độ tối ưu thuốc XOI trước (Stepwise)',
          rationale:
            'Bệnh nhân đang phối hợp XOI + Probenecid: để tránh hạ acid uric máu quá đột ngột gây bùng phát cơn cấp và sỏi niệu, giữ nguyên liều Probenecid hiện tại và ưu tiên chuẩn độ từng bước thuốc ức chế Xanthine Oxidase tới trần trước.',
          citationIds: ['acr.gout.2020.treat_to_target', 'eular.gout.2016.allopurinol_titration']
        });
      }

      const curDose = parseMedDailyDoseMg(findMed(ctx, ['probenecid']));
      if (curDose !== undefined && curDose >= maxDoseMg) {
        const flaresYr = getFlaresPerYear(ctx);
        const frequentMin = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
        const severeRefractory =
          hasTophi(ctx) || hasXrayDamage(ctx) || (flaresYr !== undefined && flaresYr >= frequentMin);
        const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
        const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');

        return goutRec({
          id: 'rec_gout_probenecid_max_refractory',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 84, // qa-allow: index - độ ưu tiên ULT
          action: 'REFER',
          drugId: 'probenecid',
          title: severeRefractory
            ? `Đã chạm liều tối đa Probenecid (${maxDoseG} g/ngày) ở gút nặng kháng trị: Hội chẩn xét Pegloticase`
            : `Đã chạm liều tối đa Probenecid (${maxDoseG} g/ngày, cơn thưa không tophi): Không dùng Pegloticase`,
          rationale: severeRefractory
            ? `Không tăng vượt trần ${maxDoseG} g/ngày; ở gút mạn có hạt tophi hoặc ≥ ${frequentMin} đợt cấp/năm thất bại đường uống, hội chẩn chuyên khoa xét Pegloticase ${pegDose} mg IV mỗi ${pegWeeks} tuần (bắt buộc sàng lọc thiếu men G6PD và ngừng toàn bộ ULT uống trước truyền).`
            : `Theo ACR 2020, không chuyển sang Pegloticase khi có < ${frequentMin} đợt cấp/năm và không có tophi; tối ưu lối sống và thuốc đồng mắc.`,
          citationIds: [
            'eular.gout.2016.benzbromarone_probenecid_dosing',
            'acr.gout.2020.pegloticase_refractory',
            'acr.gout.2020.pegloticase_against_mild'
          ]
        });
      }

      return goutRec({
        id: 'rec_gout_probenecid_uptitrate',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 83, // qa-allow: index - độ ưu tiên ULT
        action: 'UPTITRATE',
        drugId: 'probenecid',
        dose: `Tăng dần mỗi ${startDose} mg tới đích urat (tối đa ${maxDoseG} g/ngày)`,
        title: 'Chuẩn độ tăng liều Probenecid theo mục tiêu Acid uric máu',
        rationale: 'Acid uric máu chưa đạt mục tiêu và liều hiện tại chưa chạm trần tối đa; tăng liều từng bước kèm uống đủ nước.',
        citationIds: ['acr.gout.2020.probenecid_low_dose', 'eular.gout.2016.benzbromarone_probenecid_dosing']
      });
    }
  })
];
