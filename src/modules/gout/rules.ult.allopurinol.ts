/**
 * GDMT-VN Gout Module - Allopurinol Treat-to-Target Titration & Escalation Rules
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
  isOnMed,
  findMed,
  parseMedDailyDoseMg,
  hasAmbiguousCountMedDose,
  isPregnant,
  isBreastfeeding,
  hasSevereHepaticImpairment,
  hasTophi,
  hasXrayDamage,
  hasUrolithiasis,
  getFlaresPerYear,
  isAcuteGoutFlare,
  isAsymptomaticHyperuricemia,
  isFebuxostatIntolerant,
  hasEstablishedCvd,
  isOnDialysis,
  isAllopurinolBeingStopped,
  doesUltExceedSafetyCap,
  isUrateBelowTarget,
  isUrateBelowLongTermFloor
} from './helpers';
import { goutAllopurinolInitRules } from './rules.ult.allopurinol.init';

const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutAllopurinolRules: Rule[] = [
  ...goutAllopurinolInitRules,

  goutRule({
    id: 'gout.allopurinol.uptitrate',
    nameVi: 'Duy trì hoặc chuẩn độ tăng liều Allopurinol theo mục tiêu Acid uric (kiểm tra trần tối đa & suy thận)',
    citationIds: [
      'acr.gout.2020.treat_to_target',
      'acr.gout.2020.titration_weeks',
      'acr.gout.2020.allopurinol_start_dose_ckd_50',
      'acr.gout.2020.switch_second_xoi',
      'acr.gout.2020.pegloticase_refractory',
      'eular.gout.2016.allopurinol_titration',
      'fda.allopurinol.start_and_max',
      'fda.allopurinol.renal_dosing'
    ],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isAsymptomaticHyperuricemia(ctx) &&
      !isAcuteGoutFlare(ctx) &&
      isOnMed(ctx, ['allopurinol']) &&
      !isAllopurinolBeingStopped(ctx) &&
      !doesUltExceedSafetyCap(ctx, 'allopurinol') &&
      !hasAmbiguousCountMedDose(findMed(ctx, ['allopurinol'])),
    produce: (ctx): Recommendation => {
      const belowTarget = isUrateBelowTarget(ctx);
      if (belowTarget === undefined) {
        return goutMissing('urate', 'Cần nồng độ Acid uric máu để quyết định duy trì hay chuẩn độ tăng liều Allopurinol.', [
          'acr.gout.2020.treat_to_target'
        ]);
      }

      const floorMgDl = thFor('urate', 'gout.target.urate_floor_mgdl');

      if (belowTarget) {
        const warns = isUrateBelowLongTermFloor(ctx)
          ? [`Acid uric máu < ${floorMgDl} mg/dL: Theo EULAR 2016, không khuyến cáo duy trì quá thấp nhiều năm sau khi hạt tophi đã tan.`]
          : undefined;
        return goutRec({
          id: 'rec_gout_allopurinol_continue',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 84, // qa-allow: index - độ ưu tiên ULT
          action: 'CONTINUE',
          drugId: 'allopurinol',
          title: 'Tiếp tục duy trì Allopurinol ở liều hiện tại (Đã đạt mục tiêu Acid uric máu)',
          rationale: 'Nồng độ acid uric máu đã đạt dưới ngưỡng mục tiêu; duy trì đều đặn suốt đời để ngăn tái tạo tinh thể urat.',
          warnings: warns,
          citationIds: ['acr.gout.2020.treat_to_target', 'acr.gout.2020.target_urate_under_6', 'eular.gout.2016.target_urate_tophi']
        });
      }

      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const curDose = parseMedDailyDoseMg(findMed(ctx, ['allopurinol']));
      const maxDose = thFor('dose_mg', 'gout.allopurinol.max_dose');
      const crcl10 = thFor('crcl', 'gout.allopurinol.crcl_10');
      const crcl20 = thFor('crcl', 'gout.allopurinol.crcl_20');
      const capCrcl10 = thFor('dose_mg', 'gout.allopurinol.dose_crcl_under_10');
      const capCrcl20 = thFor('dose_mg', 'gout.allopurinol.dose_crcl_10_20');
      const egfrBenzMin = thFor('egfr', 'gout.benzbromarone.egfr_contra_min');
      const stepCkd = thFor('dose_mg', 'gout.allopurinol.titration_step_ckd');
      const febRenalMax = thFor('dose_mg', 'gout.febuxostat.severe_renal_max_dose');
      const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
      const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');
      const stdMgDl = thFor('urate', 'gout.target.urate_standard_mgdl');

      const hitAbsoluteMax = curDose !== undefined && curDose >= maxDose;
      const hitRenalCapIntlVn =
        ctx.settings.profile !== 'US' &&
        curDose !== undefined &&
        (((crcl !== undefined && crcl < crcl10) || (egfr !== undefined && egfr < crcl10))
          ? curDose >= capCrcl10
          : ((crcl !== undefined && crcl < crcl20) || (egfr !== undefined && egfr < crcl20)) && curDose >= capCrcl20);

      if (hitAbsoluteMax || hitRenalCapIntlVn) {
        const flaresYr = getFlaresPerYear(ctx);
        const frequentMin = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
        const severeRefractory =
          hasTophi(ctx) || hasXrayDamage(ctx) || (flaresYr !== undefined && flaresYr >= frequentMin);
        const canCombineUricosuric =
          !isOnDialysis(ctx) && egfr !== undefined && egfr >= egfrBenzMin && !hasUrolithiasis(ctx);

        if (hitRenalCapIntlVn && !hitAbsoluteMax && hasEstablishedCvd(ctx)) {
          return goutRec({
            id: 'rec_gout_allopurinol_ckd_cvd_specialist',
            tier: TIER_ULT,
            tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
            priority: 86, // qa-allow: index - độ ưu tiên ULT
            action: 'REFER',
            drugId: 'allopurinol',
            title: 'Chạm trần thận Allopurinol trên nền Bệnh tim mạch & CKD G4–G5: Hội chẩn chuyên khoa chuẩn độ thận trọng',
            rationale:
              `Bệnh nhân đã chạm trần liều theo CrCl trên hồ sơ ${ctx.settings.profile} nhưng chưa đạt đích urat, đồng thời có bệnh tim mạch đã xác lập (FDA CARES cảnh báo nguy cơ tử vong tim mạch của Febuxostat) và suy thận nặng chống chỉ định nhóm tăng thải urat (eGFR < ${egfrBenzMin} mL/phút). Khuyến cáo hội chẩn Cơ xương khớp – Thận – Tim mạch để: (1) Chuẩn độ tăng rất chậm Allopurinol từng bậc ≤ ${stepCkd} mg dưới giám sát chặt dấu hiệu SCAR theo ACR 2020; hoặc (2) Thảo luận đồng thuận dùng Febuxostat liều thấp ≤ ${febRenalMax} mg/ngày trước khi xét Pegloticase.`,
            citationIds: [
              'acr.gout.2020.allopurinol_start_dose_ckd_50',
              'acr.gout.2020.febuxostat_cvd_switch',
              'eular.gout.2016.allopurinol_titration',
              'fda.allopurinol.renal_dosing'
            ]
          });
        }

        if (
          !isFebuxostatIntolerant(ctx) &&
          !hasEstablishedCvd(ctx) &&
          !isBreastfeeding(ctx) &&
          !hasSevereHepaticImpairment(ctx)
        ) {
          return goutRec({
            id: 'rec_gout_allopurinol_max_switch_xoi',
            tier: TIER_ULT,
            tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
            priority: 86, // qa-allow: index - độ ưu tiên ULT
            action: 'SWITCH',
            drugId: 'allopurinol',
            title: canCombineUricosuric
              ? 'Đã chạm trần liều Allopurinol nhưng chưa đạt đích urat: Chuyển sang Febuxostat hoặc phối hợp Uricosuric'
              : 'Đã chạm trần liều Allopurinol nhưng chưa đạt đích urat: Chuyển sang Febuxostat',
            rationale: canCombineUricosuric
              ? `Không tiếp tục tăng liều vượt quá trần tối đa an toàn của Allopurinol. Theo ACR 2020 (Table 5, PICO 24) và EULAR 2016 (Rec 8–9), khuyến cáo chuyển sang XOI thứ hai (Febuxostat) hoặc phối hợp thuốc tăng thải urat khi eGFR ≥ ${egfrBenzMin} mL/phút và không có sỏi thận.`
              : `Không tiếp tục tăng liều vượt quá trần an toàn của Allopurinol. Theo ACR 2020 và EULAR 2016, khuyến cáo chuyển sang XOI thứ hai (Febuxostat; lưu ý giới hạn ≤ ${febRenalMax} mg/ngày nếu eGFR < ${egfrBenzMin} mL/phút, và không phối hợp nhóm tăng thải urat khi suy thận nặng hoặc có sỏi thận).`,
            profileDiff: {
              US: `ACR 2020: Chuyển sang XOI thứ hai khi thất bại ở liều tối đa FDA (${maxDose} mg/ngày).`,
              INTL: `EULAR 2016 Rec 9: Khi chạm trần theo độ thanh thải thận (${capCrcl20} mg ở CrCl 10–20; ${capCrcl10} mg ở CrCl < ${crcl10} mL/phút), đổi sang Febuxostat hoặc Benzbromarone (nếu eGFR ≥ ${egfrBenzMin}).`,
              VN: `BYT 2024: Cân nhắc chuyển sang Febuxostat (thận trọng giới hạn ≤ ${febRenalMax} mg/ngày nếu MLCT < ${egfrBenzMin} mL/phút).`
            },
            citationIds: [
              'acr.gout.2020.switch_second_xoi',
              'eular.gout.2016.allopurinol_titration',
              'eular.gout.2016.benzbromarone_egfr30',
              'fda.allopurinol.renal_dosing',
              'fda.febuxostat.severe_renal'
            ]
          });
        }

        return goutRec({
          id: 'rec_gout_pegloticase_refractory',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 86, // qa-allow: index - độ ưu tiên ULT
          action: 'REFER',
          drugId: 'allopurinol',
          title: severeRefractory
            ? canCombineUricosuric
              ? 'Gút mạn nặng kháng trị ở liều tối đa Allopurinol: Hội chẩn xét Pegloticase hoặc phối hợp Uricosuric'
              : `Gút mạn nặng kháng trị ở liều tối đa Allopurinol: Hội chẩn xét Pegloticase (${pegDose} mg IV mỗi ${pegWeeks} tuần)`
            : 'Đã chạm liều tối đa Allopurinol (cơn gút thưa, không tophi): Không dùng Pegloticase, tối ưu thuốc đồng mắc',
          rationale: severeRefractory
            ? `Theo ACR 2020 (PICO 27) và EULAR 2016 (Rec 10), khi thất bại XOI liều tối đa kèm hạt tophi không tiêu hoặc ≥ ${frequentMin} đợt cấp/năm, khuyến cáo mạnh chuyển sang truyền tĩnh mạch Pegloticase ${pegDose} mg mỗi ${pegWeeks} tuần${canCombineUricosuric ? ` (hoặc phối hợp Uricosuric khi eGFR ≥ ${egfrBenzMin} mL/phút)` : ''}. BẮT BUỘC sàng lọc thiếu men G6PD trước truyền, NGỪNG TOÀN BỘ thuốc hạ urat đường uống trước khi bắt đầu Pegloticase và kiểm tra acid uric máu trước mỗi lần truyền (ngừng nếu urat tăng trở lại > ${stdMgDl} mg/dL để phòng sốc phản vệ).`
            : `Theo ACR 2020 (PICO 27), khuyến cáo mạnh KHÔNG chuyển sang Pegloticase nếu bệnh nhân có < ${frequentMin} đợt cấp/năm và không có hạt tophi do nguy cơ phản vệ truyền dịch vượt trội lợi ích; duy trì liều dung nạp tối đa và tối ưu thuốc đồng mắc – lối sống.`,
          citationIds: [
            'acr.gout.2020.pegloticase_refractory',
            'acr.gout.2020.pegloticase_against_mild',
            'eular.gout.2016.pegloticase_refractory',
            'eular.gout.2016.pegloticase_8mg_q2w'
          ]
        });
      }

      const ckdCutoff = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
      const isCkd = isOnDialysis(ctx) || hasCondition(ctx, 'ckd') || (egfr !== undefined && egfr < ckdCutoff);
      const stepMg = isCkd
        ? stepCkd
        : thFor('dose_mg', 'gout.allopurinol.titration_step');
      const wMin = thFor('interval_weeks', 'gout.allopurinol.titration_weeks_min');
      const wMax = thFor('interval_weeks', 'gout.allopurinol.titration_weeks_max');
      const wEular = thFor('interval_weeks', 'gout.allopurinol.titration_eular_weeks_max');

      return goutRec({
        id: 'rec_gout_allopurinol_uptitrate',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 85, // qa-allow: index - độ ưu tiên ULT
        action: 'UPTITRATE',
        drugId: 'allopurinol',
        dose: isCkd
          ? `Tăng thận trọng ≤ ${stepMg} mg mỗi ${wMin}–${wMax} tuần tới đích urat (tối đa ${maxDose} mg/ngày; chia 2 lần sau ăn nếu tổng liều cao)`
          : `Tăng thêm ${stepMg} mg mỗi ${wMin}–${wMax} tuần tới đích urat (tối đa ${maxDose} mg/ngày; chia 2 lần sau ăn nếu tổng liều cao)`,
        title: `Chuẩn độ tăng liều Allopurinol thêm ${isCkd ? `≤ ${stepMg}` : `${stepMg}`} mg/ngày theo chiến lược Treat-to-Target`,
        rationale:
          'Acid uric máu chưa đạt mục tiêu điều trị. Cần chuẩn độ tăng dần từng bước nhỏ kèm xét nghiệm kiểm tra lại acid uric huyết thanh sau mỗi bước chỉnh liều.',
        warnings: isCkd
          ? [`Bệnh thận mạn: Tăng liều chậm từng bậc ≤ ${stepMg} mg và theo dõi sát các dấu hiệu phát ban da / quá mẫn SCAR.`]
          : undefined,
        profileDiff: {
          US: `ACR 2020: Chuẩn độ mỗi ${wMin}–${wMax} tuần kể cả ở CKD để đạt đích < ${stdMgDl} mg/dL.`,
          INTL: `EULAR 2016: Chuẩn độ mỗi ${wMin}–${wEular} tuần; lưu ý giới hạn theo CrCl nếu suy thận nặng.`,
          VN: `BYT 2024 CKD: Chuẩn độ thận trọng theo MLCT, tối đa ${maxDose} mg/ngày.`
        },
        citationIds: [
          'acr.gout.2020.treat_to_target',
          'acr.gout.2020.titration_weeks',
          'acr.gout.2020.allopurinol_start_dose_ckd_50',
          'eular.gout.2016.allopurinol_titration',
          'fda.allopurinol.start_and_max'
        ]
      });
    }
  })
];
