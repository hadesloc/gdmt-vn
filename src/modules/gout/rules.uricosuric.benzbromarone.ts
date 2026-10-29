/**
 * GDMT-VN Gout Module - Benzbromarone Uricosuric Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  goutMissing,
  VKA_DRUG_IDS,
  HEPATOTOXIC_CO_MED_IDS,
  isOnMed,
  findMed,
  parseMedDailyDoseMg,
  hasAmbiguousCountMedDose,
  isPregnant,
  isBreastfeeding,
  hasHepaticImpairment,
  hasTophi,
  hasXrayDamage,
  hasUrolithiasis,
  hasSecondaryHyperuricemiaOrTls,
  getFlaresPerYear,
  isAcuteGoutFlare,
  isOnDialysis,
  isAsymptomaticHyperuricemia,
  isBenzbromaroneAllergic,
  isBenzbromaroneContraindicated,
  doesUltExceedSafetyCap,
  hasSubmaximalActiveXoi,
  isUrateBelowTarget,
  canInitiateUltNow,
  selectUltInitDrug
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutBenzbromaroneRules: Rule[] = [
  goutRule({
    id: 'gout.uricosuric.benzbromarone_safety_reduce',
    nameVi: 'Giảm liều Benzbromarone đang dùng khi vượt quá trần tối đa 200 mg/ngày',
    citationIds: ['eular.gout.2016.benzbromarone_probenecid_dosing', 'eular.gout.2016.benzbromarone_hepatic_spc'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      ctx.settings.profile !== 'US' &&
      isOnMed(ctx, ['benzbromarone']) &&
      !isBenzbromaroneContraindicated(ctx) &&
      doesUltExceedSafetyCap(ctx, 'benzbromarone'),
    produce: () => {
      const maxDose = thFor('dose_mg', 'gout.benzbromarone.target_dose');
      return goutRec({
        id: 'rec_gout_benzbromarone_safety_reduce',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 94, // qa-allow: index - độ ưu tiên giảm liều an toàn
        action: 'REDUCE',
        drugId: 'benzbromarone',
        dose: `Tối đa ≤ ${maxDose} mg/ngày`,
        title: `GIẢM LIỀU Benzbromarone xuống không quá trần tối đa ${maxDose} mg/ngày`,
        rationale:
          `Liều Benzbromarone hiện tại vượt quá trần tối đa an toàn (${maxDose} mg/ngày), làm tăng nguy cơ viêm gan hoại tử tối cấp đe dọa tính mạng.`,
        citationIds: ['eular.gout.2016.benzbromarone_probenecid_dosing', 'eular.gout.2016.benzbromarone_hepatic_spc']
      });
    }
  }),

  goutRule({
    id: 'gout.uricosuric.benzbromarone_ambiguous_dose',
    nameVi: 'Xác nhận hàm lượng mg viên Benzbromarone đang dùng khi chỉ nhập đơn vị đếm viên (QA-1 Fail-closed)',
    citationIds: ['eular.gout.2016.benzbromarone_probenecid_dosing', 'eular.gout.2016.benzbromarone_hepatic_spc'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isAsymptomaticHyperuricemia(ctx) &&
      ctx.settings.profile !== 'US' &&
      isOnMed(ctx, ['benzbromarone']) &&
      !isBenzbromaroneContraindicated(ctx) &&
      hasAmbiguousCountMedDose(findMed(ctx, ['benzbromarone'])),
    produce: () => {
      const startDose = thFor('dose_mg', 'gout.benzbromarone.start_dose');
      const tab100 = thFor('dose_mg', 'gout.allopurinol.start_dose_normal');
      return goutRec({
        id: 'rec_gout_benzbromarone_confirm_strength',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 89, // qa-allow: index - độ ưu tiên xác nhận hàm lượng
        action: 'CONSIDER',
        drugId: 'benzbromarone',
        title: `Xác nhận hàm lượng mg viên Benzbromarone đang dùng (viên ${startDose} mg hay viên ${tab100} mg)`,
        rationale:
          'Đơn thuốc hiện chỉ ghi số lượng "viên" mà chưa rõ hàm lượng miligam; do nguy cơ nhiễm độc gan phụ thuộc liều, cần xác minh chính xác tổng liều mg/ngày trước khi chuẩn độ.',
        citationIds: ['eular.gout.2016.benzbromarone_probenecid_dosing', 'eular.gout.2016.benzbromarone_hepatic_spc']
      });
    }
  }),

  goutRule({
    id: 'gout.uricosuric.benzbromarone',
    nameVi: 'Quản lý Benzbromarone (chặn trên hồ sơ US, giám sát độc tính gan – tương tác VKA & chuẩn độ)',
    citationIds: [
      'eular.gout.2016.benzbromarone_probenecid_dosing',
      'eular.gout.2016.benzbromarone_egfr30',
      'eular.gout.2016.benzbromarone_hepatic_spc',
      'ema.desuric.contra_hepatic_porphyria',
      'ema.desuric.contra_lithiase_hemopathy',
      'acr.gout.2020.uricosuric_renal_stones_contra',
      'byt.gout.2014.uricosuric_contra',
      'byt.ckd.2024.gout_ult_table21'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx)) return false;
      const onBenz = isOnMed(ctx, ['benzbromarone']);
      if (
        onBenz &&
        ctx.settings.profile !== 'US' &&
        (doesUltExceedSafetyCap(ctx, 'benzbromarone') || hasAmbiguousCountMedDose(findMed(ctx, ['benzbromarone'])))
      ) {
        return isBenzbromaroneContraindicated(ctx);
      }
      const wantsBenz = Boolean(ctx.normalized.customInputs?.preferBenzbromarone);
      if (onBenz || wantsBenz) return true;
      return selectUltInitDrug(ctx) === 'benzbromarone';
    },
    produce: (ctx): Recommendation | null => {
      const onBenz = isOnMed(ctx, ['benzbromarone']);
      const egfr = need(ctx, 'egfr');
      const age = need(ctx, 'age');
      const egfrMin = thFor('egfr', 'gout.benzbromarone.egfr_contra_min');
      const ckdMin = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
      const vnUrineMax = thFor('dose_mg', 'gout.uricosuric.vn_urine_urate_max');
      const vnAgeMin = thFor('age', 'gout.uricosuric.vn_elderly_age_min');

      if (isBenzbromaroneContraindicated(ctx)) {
        const reasons: string[] = [];
        if (isBenzbromaroneAllergic(ctx)) reasons.push('tiền sử dị ứng Benzbromarone');
        if (hasHepaticImpairment(ctx)) reasons.push('bệnh gan / xơ gan / tăng men gan (nguy cơ viêm gan hoại tử tối cấp tử vong)');
        if (isOnMed(ctx, VKA_DRUG_IDS)) {
          reasons.push('đang dùng thuốc kháng Vitamin K (Warfarin / Acenocoumarol: Benzbromarone ức chế mạnh CYP2C9 làm tăng vọt INR gây xuất huyết tử vong — EMA Desuric Mục 4.3/4.5)');
        }
        if (isOnMed(ctx, HEPATOTOXIC_CO_MED_IDS)) {
          reasons.push('đang phối hợp thuốc có độc tính gan cao (thuốc kháng lao / azole: cộng hưởng suy gan cấp — EMA Desuric Mục 4.3)');
        }
        if (hasUrolithiasis(ctx)) reasons.push('tiền sử sỏi thận tiết niệu');
        if (ctx.normalized.customInputs?.uricAcidOverproduction || hasSecondaryHyperuricemiaOrTls(ctx)) {
          reasons.push(`tăng sản xuất acid uric quá mức / bệnh máu ác tính – TLS (uric niệu > ${vnUrineMax} mg/24h — EMA Desuric Mục 4.3)`);
        }
        if (isBreastfeeding(ctx)) reasons.push('đang cho con bú');
        if (isOnDialysis(ctx) || (egfr !== undefined && egfr < egfrMin)) {
          reasons.push(`suy thận nặng (eGFR < ${egfrMin} mL/phút hoặc lọc máu)`);
        }
        if (ctx.settings.profile === 'VN') {
          if (hasTophi(ctx)) reasons.push('gút mạn có hạt tophi (theo BYT 361/2014)');
          if (age !== undefined && age >= vnAgeMin) reasons.push(`người cao tuổi ≥ ${vnAgeMin} tuổi (theo BYT 361/2014)`);
        }
        return goutRec({
          id: onBenz ? 'rec_gout_benzbromarone_stop_contra' : 'rec_gout_benzbromarone_avoid_contra',
          tier: TIER_SAFETY,
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: onBenz ? 98 : 88, // qa-allow: index - độ ưu tiên an toàn
          action: onBenz ? 'STOP' : 'AVOID',
          drugId: 'benzbromarone',
          title: onBenz
            ? 'NGỪNG KHẨN CẤP Benzbromarone do chống chỉ định gan / VKA / thận / sỏi tiết niệu'
            : 'Chống chỉ định / Tránh dùng Benzbromarone',
          rationale: `Chống chỉ định dùng Benzbromarone do: ${reasons.join('; ') || 'nguy cơ độc tính gan – thận – xuất huyết'}.`,
          citationIds: [
            'eular.gout.2016.benzbromarone_hepatic_spc',
            'ema.desuric.contra_hepatic_porphyria',
            'ema.desuric.contra_lithiase_hemopathy',
            'eular.gout.2016.benzbromarone_egfr30',
            'acr.gout.2020.uricosuric_renal_stones_contra',
            'byt.gout.2014.uricosuric_contra'
          ]
        });
      }

      if (ctx.settings.profile === 'US') {
        return goutRec({
          id: onBenz ? 'rec_gout_benzbromarone_us_unapproved' : 'rec_gout_benzbromarone_avoid_contra',
          tier: TIER_SAFETY,
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 94, // qa-allow: index - độ ưu tiên an toàn
          action: onBenz ? 'SWITCH' : 'AVOID',
          drugId: 'benzbromarone',
          title: 'Benzbromarone không được FDA phê duyệt lưu hành tại Hoa Kỳ (nguy cơ nhiễm độc gan tối cấp)',
          rationale:
            'Trên hồ sơ US (FDA / ACR 2020), Benzbromarone không được cấp phép lưu hành do nguy cơ suy gan hoại tử tối cấp; ưu tiên dùng Allopurinol, Febuxostat hoặc Probenecid.',
          citationIds: ['eular.gout.2016.benzbromarone_hepatic_spc', 'acr.gout.2020.allopurinol_first_line']
        });
      }

      if (egfr === undefined) {
        return goutMissing('egfr', `Cần eGFR trước khi chỉ định Benzbromarone (chống chỉ định khi eGFR < ${egfrMin} mL/phút).`, [
          'eular.gout.2016.benzbromarone_egfr30'
        ]);
      }

      const startDose = thFor('dose_mg', 'gout.benzbromarone.start_dose');
      const maxDose = thFor('dose_mg', 'gout.benzbromarone.target_dose');
      const hepaticWarnings = [
        'BẮT BUỘC kiểm tra AST/ALT/Bilirubin bình thường trước khi khởi trị và xét nghiệm định kỳ hàng tháng trong 6 tháng đầu; ngừng thuốc ngay lập tức nếu tăng men gan, chán ăn, buồn nôn hoặc vàng da.',
        'Uống đủ nước hàng ngày; tuyệt đối không tự ý dùng kèm thuốc kháng Vitamin K (Warfarin, Acenocoumarol) hoặc thuốc độc gan.'
      ];
      if (ctx.settings.profile === 'VN' && egfr < ckdMin) {
        hepaticWarnings.push(
          `Lưu ý đối chiếu hướng dẫn Việt Nam ở CKD G3 (MLCT ${egfrMin}–${ckdMin} mL/phút): BYT 2024 CKD (Bảng 21) cho phép cân nhắc Benzbromarone khi MLCT ≥ ${egfrMin} mL/phút nếu không dùng được XOI, trong khi QĐ 361/QĐ-BYT 2014 khuyến cáo tránh nhóm tăng thải urat ở suy thận.`
        );
      }

      if (!onBenz) {
        if (!canInitiateUltNow(ctx) || isAcuteGoutFlare(ctx)) return null;
        const selectedUlt = selectUltInitDrug(ctx);
        if (selectedUlt !== 'benzbromarone') {
          if (ctx.normalized.customInputs?.preferBenzbromarone) {
            return goutRec({
              id: 'rec_gout_benzbromarone_defer_xoi_first',
              tier: TIER_ULT,
              tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
              priority: 75, // qa-allow: index - độ ưu tiên ULT
              action: 'DEFER',
              drugId: 'benzbromarone',
              title: 'Chưa khởi trị Benzbromarone đầu tay — Ưu tiên đơn trị nhóm hạ urat ưu tiên trước',
              rationale:
                'EULAR 2016 (Khuyến cáo 8) và ACR 2020 khuyến cáo khởi trị đơn trị thuốc hạ urat đầu tay trước (không khởi trị đồng thời 2 thuốc hạ urat ngay từ đầu); chỉ dùng Benzbromarone thay thế hoặc phối hợp bậc 2 khi không dung nạp hoặc chưa đạt đích trên nhóm XOI kèm giám sát chặt men gan.',
              citationIds: [
                'acr.gout.2020.allopurinol_first_line',
                'eular.gout.2016.benzbromarone_probenecid_dosing',
                'eular.gout.2016.benzbromarone_hepatic_spc'
              ]
            });
          }
          return null;
        }
        return goutRec({
          id: 'rec_gout_benzbromarone_start',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 82, // qa-allow: index - độ ưu tiên ULT
          action: 'START',
          drugId: 'benzbromarone',
          dose: `${startDose} mg/ngày (tối đa ${maxDose} mg/ngày)`,
          title: `Khởi trị Benzbromarone ${startDose} mg/ngày kèm giám sát chặt men gan`,
          rationale:
            `Theo EULAR 2016 (Khuyến cáo 8 & 9) và BYT 2024 CKD (Bảng 21), Benzbromarone có hiệu lực tăng thải urat mạnh và vẫn duy trì tác dụng ở CKD mức độ vừa (eGFR ≥ ${egfrMin} mL/phút) khi không dùng được nhóm XOI.`,
          warnings: hepaticWarnings,
          citationIds: [
            'eular.gout.2016.benzbromarone_probenecid_dosing',
            'eular.gout.2016.benzbromarone_hepatic_spc',
            'byt.ckd.2024.gout_ult_table21'
          ]
        });
      }

      if (isAcuteGoutFlare(ctx)) return null;
      const belowTarget = isUrateBelowTarget(ctx);
      if (belowTarget === undefined) {
        return goutMissing('urate', 'Cần nồng độ Acid uric máu để theo dõi điều trị Benzbromarone.', [
          'eular.gout.2016.target_urate_tophi'
        ]);
      }
      if (belowTarget) {
        return goutRec({
          id: 'rec_gout_benzbromarone_continue',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 80, // qa-allow: index - độ ưu tiên ULT
          action: 'CONTINUE',
          drugId: 'benzbromarone',
          title: 'Tiếp tục duy trì Benzbromarone (Đã đạt mục tiêu Acid uric) kèm theo dõi chức năng gan',
          rationale: 'Nồng độ acid uric máu đã đạt mục tiêu; duy trì liều hiện tại và tiếp tục kiểm tra men gan định kỳ.',
          warnings: hepaticWarnings,
          citationIds: ['eular.gout.2016.target_urate_tophi', 'eular.gout.2016.benzbromarone_hepatic_spc']
        });
      }

      if (hasSubmaximalActiveXoi(ctx)) {
        return goutRec({
          id: 'rec_gout_benzbromarone_hold_stepwise',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 80, // qa-allow: index - độ ưu tiên chuẩn độ từng bước
          action: 'CONTINUE',
          drugId: 'benzbromarone',
          title: 'Giữ nguyên liều Benzbromarone hiện tại trong khi ưu tiên chuẩn độ tối ưu thuốc XOI trước (Stepwise)',
          rationale:
            'Bệnh nhân đang phối hợp XOI + Benzbromarone: giữ nguyên liều Benzbromarone hiện tại kèm theo dõi men gan và ưu tiên chuẩn độ từng bước thuốc ức chế Xanthine Oxidase trước.',
          warnings: hepaticWarnings,
          citationIds: ['eular.gout.2016.allopurinol_titration', 'eular.gout.2016.benzbromarone_hepatic_spc']
        });
      }

      const curDose = parseMedDailyDoseMg(findMed(ctx, ['benzbromarone']));
      if (curDose !== undefined && curDose >= maxDose) {
        const flaresYr = getFlaresPerYear(ctx);
        const frequentMin = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
        const severeRefractory =
          hasTophi(ctx) || hasXrayDamage(ctx) || (flaresYr !== undefined && flaresYr >= frequentMin);
        const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
        const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');

        return goutRec({
          id: 'rec_gout_benzbromarone_max_refractory',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 84, // qa-allow: index - độ ưu tiên ULT
          action: 'REFER',
          drugId: 'benzbromarone',
          title: severeRefractory
            ? `Đã chạm liều tối đa Benzbromarone (${maxDose} mg/ngày) ở gút nặng kháng trị: Hội chẩn xét Pegloticase`
            : `Đã chạm liều tối đa Benzbromarone (${maxDose} mg/ngày, cơn thưa không tophi): Không dùng Pegloticase`,
          rationale: severeRefractory
            ? `Không tăng vượt quá ${maxDose} mg/ngày do nguy cơ độc tính gan; ở gút mạn nặng kháng trị đường uống, hội chẩn chuyên khoa xét Pegloticase ${pegDose} mg IV mỗi ${pegWeeks} tuần (bắt buộc sàng lọc thiếu men G6PD và ngừng toàn bộ ULT uống trước truyền).`
            : `Không tăng vượt quá ${maxDose} mg/ngày và không chỉ định Pegloticase khi có < ${frequentMin} đợt cấp/năm không kèm tophi; tối ưu thuốc đồng mắc – lối sống.`,
          warnings: hepaticWarnings,
          citationIds: [
            'eular.gout.2016.benzbromarone_probenecid_dosing',
            'eular.gout.2016.pegloticase_refractory',
            'acr.gout.2020.pegloticase_against_mild'
          ]
        });
      }

      return goutRec({
        id: 'rec_gout_benzbromarone_uptitrate',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 82, // qa-allow: index - độ ưu tiên ULT
        action: 'UPTITRATE',
        drugId: 'benzbromarone',
        dose: `Tăng thêm ${startDose} mg/ngày tới tối đa ${maxDose} mg/ngày`,
        title: 'Chuẩn độ tăng liều Benzbromarone kèm xét nghiệm AST/ALT định kỳ',
        rationale: 'Acid uric máu chưa đạt mục tiêu và liều hiện tại chưa chạm trần tối đa; chuẩn độ từng bước sau khi kiểm tra men gan an toàn.',
        warnings: hepaticWarnings,
        citationIds: [
          'eular.gout.2016.benzbromarone_probenecid_dosing',
          'eular.gout.2016.benzbromarone_hepatic_spc'
        ]
      });
    }
  })
];
