/**
 * GDMT-VN Gout Module - Febuxostat Titration & Pegloticase Escalation Rules
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
  hasModerateOrSevereHepaticImpairment,
  hasSevereHepaticImpairment,
  hasTophi,
  hasXrayDamage,
  hasUrolithiasis,
  getFlaresPerYear,
  isAcuteGoutFlare,
  isAsymptomaticHyperuricemia,
  getHlaB5801Status,
  isAllopurinolIntolerant,
  hasEstablishedCvd,
  isOnDialysis,
  isFebuxostatBeingStopped,
  doesUltExceedSafetyCap,
  isUrateBelowTarget
} from './helpers';
import { goutFebuxostatInitRules } from './rules.ult.febuxostat.init';

const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutFebuxostatRules: Rule[] = [
  ...goutFebuxostatInitRules,

  goutRule({
    id: 'gout.febuxostat.manage',
    nameVi: 'Quản lý liều Febuxostat đang dùng (giữ trần suy thận nặng/suy gan, duy trì hoặc chuẩn độ)',
    citationIds: [
      'fda.febuxostat.dosage',
      'fda.febuxostat.severe_renal',
      'fda.febuxostat.renal_clcr_30',
      'fda.febuxostat.dialysis_hepatic',
      'byt.ckd.2024.gout_ult_table21',
      'acr.gout.2020.treat_to_target'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx) || isAcuteGoutFlare(ctx)) return false;
      if (!isOnMed(ctx, ['febuxostat']) || isFebuxostatBeingStopped(ctx)) return false;
      if (doesUltExceedSafetyCap(ctx, 'febuxostat') || hasAmbiguousCountMedDose(findMed(ctx, ['febuxostat']))) return false;
      const canSwitchAllo = getHlaB5801Status(ctx) !== 'positive' && !isAllopurinolIntolerant(ctx);
      if (hasEstablishedCvd(ctx) && canSwitchAllo) return false;
      return true;
    },
    produce: (ctx): Recommendation => {
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const severeEgfr = thFor('egfr', 'gout.febuxostat.severe_renal_egfr');
      const severeCrcl = thFor('crcl', 'gout.febuxostat.severe_renal_crcl');
      const renalMax = thFor('dose_mg', 'gout.febuxostat.severe_renal_max_dose');
      const curDose = parseMedDailyDoseMg(findMed(ctx, ['febuxostat']));

      const isSevereRenal =
        isOnDialysis(ctx) ||
        (egfr !== undefined && egfr < severeEgfr) ||
        (crcl !== undefined && crcl < severeCrcl);

      if (isSevereRenal) {
        return goutRec({
          id: 'rec_gout_febuxostat_renal_cap',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 84, // qa-allow: index - độ ưu tiên ULT
          action: 'CONTINUE',
          drugId: 'febuxostat',
          dose: `Tối đa ${renalMax} mg x 1 lần/ngày`,
          title: `Duy trì Febuxostat tối đa ${renalMax} mg/ngày (Trần an toàn ở suy thận nặng eGFR < ${severeEgfr} mL/phút)`,
          rationale:
            `Ở bệnh nhân suy thận nặng (CrCl/eGFR < ${severeEgfr} mL/phút), nhãn FDA giới hạn liều Febuxostat tối đa ${renalMax} mg/ngày; không tự ý chuẩn độ tăng liều.`,
          citationIds: ['fda.febuxostat.severe_renal', 'fda.febuxostat.renal_clcr_30', 'byt.ckd.2024.gout_ult_table21']
        });
      }

      if (hasSevereHepaticImpairment(ctx)) {
        return goutRec({
          id: 'rec_gout_febuxostat_severe_hepatic_caution',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 85, // qa-allow: index - độ ưu tiên gan nặng
          action: 'REFER',
          drugId: 'febuxostat',
          title: 'Suy gan nặng / Xơ gan mất bù (Child-Pugh C) đang dùng Febuxostat: Không tự ý tăng liều, hội chẩn chuyên khoa Gan – Khớp',
          rationale:
            'Theo nhãn FDA Uloric (Mục 8.7), chưa có nghiên cứu dược động học và an toàn của Febuxostat trên bệnh nhân suy gan nặng (Child-Pugh C); tuyệt đối không tự ý chuẩn độ tăng liều và cần giám sát chặt Bilirubin, AST/ALT, INR.',
          citationIds: ['fda.febuxostat.dialysis_hepatic', 'acr.gout.2020.treat_to_target']
        });
      }

      const belowTarget = isUrateBelowTarget(ctx);
      if (belowTarget === undefined) {
        return goutMissing('urate', 'Cần nồng độ Acid uric máu để đánh giá đáp ứng điều trị Febuxostat.', [
          'acr.gout.2020.treat_to_target'
        ]);
      }
      if (belowTarget) {
        return goutRec({
          id: 'rec_gout_febuxostat_continue',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 83, // qa-allow: index - độ ưu tiên ULT
          action: 'CONTINUE',
          drugId: 'febuxostat',
          title: 'Tiếp tục duy trì Febuxostat ở liều hiện tại (Đã đạt mục tiêu Acid uric máu)',
          rationale: 'Nồng độ acid uric máu đã đạt đích điều trị; duy trì liều hiện tại.',
          citationIds: ['acr.gout.2020.treat_to_target', 'fda.febuxostat.dosage']
        });
      }

      const fdaTarget = thFor('dose_mg', 'gout.febuxostat.target_dose');
      const hepaticModMax = thFor('dose_mg', 'gout.febuxostat.hepatic_moderate_max_dose');
      const intlVnMax = thFor('dose_mg', 'gout.febuxostat.max_dose_intl_vn');
      const modHepatic = hasModerateOrSevereHepaticImpairment(ctx);
      const maxFeb = ctx.settings.profile === 'US' || modHepatic ? hepaticModMax : intlVnMax;

      if (curDose !== undefined && curDose >= maxFeb) {
        const flaresYr = getFlaresPerYear(ctx);
        const frequentMin = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
        const severeRefractory =
          hasTophi(ctx) || hasXrayDamage(ctx) || (flaresYr !== undefined && flaresYr >= frequentMin);
        const egfrBenzMin = thFor('egfr', 'gout.benzbromarone.egfr_contra_min');
        const canCombineUricosuric =
          !isOnDialysis(ctx) && egfr !== undefined && egfr >= egfrBenzMin && !hasUrolithiasis(ctx);
        const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
        const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');
        const stdMgDl = thFor('urate', 'gout.target.urate_standard_mgdl');

        return goutRec({
          id: 'rec_gout_febuxostat_max_refractory',
          tier: TIER_ULT,
          tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 85, // qa-allow: index - độ ưu tiên ULT
          action: 'REFER',
          drugId: 'febuxostat',
          title: severeRefractory
            ? `Đã chạm liều tối đa Febuxostat (${maxFeb} mg/ngày) ở gút nặng kháng trị: Hội chẩn phối hợp Uricosuric hoặc xét Pegloticase`
            : `Đã chạm liều tối đa Febuxostat (${maxFeb} mg/ngày, cơn gút thưa không tophi): Không dùng Pegloticase`,
          rationale: severeRefractory
            ? `Không tăng vượt quá liều tối đa an toàn của Febuxostat (${maxFeb} mg/ngày). ${canCombineUricosuric ? `Cân nhắc phối hợp thêm thuốc tăng thải urat (khi eGFR ≥ ${egfrBenzMin} mL/phút và không sỏi thận) hoặc ` : ''}Hội chẩn chuyên khoa xét truyền tĩnh mạch Pegloticase ${pegDose} mg mỗi ${pegWeeks} tuần (bắt buộc sàng lọc thiếu men G6PD, ngừng toàn bộ thuốc hạ urat đường uống trước khi truyền và theo dõi urat trước mỗi chu kỳ truyền < ${stdMgDl} mg/dL).`
            : `Theo ACR 2020 (PICO 27), khi bệnh nhân có < ${frequentMin} đợt cấp/năm và không có hạt tophi, khuyến cáo mạnh KHÔNG chuyển sang Pegloticase do nguy cơ phản vệ vượt trội lợi ích;${canCombineUricosuric ? ' có thể cân nhắc phối hợp thuốc tăng thải urat hoặc' : ''} duy trì liều hiện tại kèm tối ưu thuốc đồng mắc.`,
          citationIds: [
            'fda.febuxostat.dosage',
            'byt.ckd.2024.gout_ult_table21',
            'acr.gout.2020.pegloticase_refractory',
            'acr.gout.2020.pegloticase_against_mild',
            'eular.gout.2016.pegloticase_8mg_q2w'
          ]
        });
      }

      const nextDose = curDose !== undefined && curDose >= fdaTarget ? maxFeb : fdaTarget;
      return goutRec({
        id: 'rec_gout_febuxostat_uptitrate',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 84, // qa-allow: index - độ ưu tiên ULT
        action: 'UPTITRATE',
        drugId: 'febuxostat',
        dose: `${nextDose} mg x 1 lần/ngày`,
        title: `Chuẩn độ tăng liều Febuxostat lên ${nextDose} mg/ngày`,
        rationale:
          `Acid uric máu chưa đạt mục tiêu sau ít nhất 2 tuần dùng liều thấp và chức năng thận cho phép (eGFR ≥ ${severeEgfr} mL/phút); tăng liều Febuxostat theo chiến lược Treat-to-Target.`,
        warnings: modHepatic
          ? [`Suy gan vừa (Child-Pugh B): Giới hạn tối đa ≤ ${hepaticModMax} mg/ngày và kiểm tra định kỳ men gan AST/ALT.`]
          : undefined,
        profileDiff: {
          US: `FDA: Liều tối đa khuyến cáo là ${fdaTarget} mg/ngày.`,
          INTL: `EMA / EULAR: Có thể tăng tới tối đa ${intlVnMax} mg/ngày khi eGFR ≥ ${severeEgfr} mL/phút và chức năng gan bình thường.`,
          VN: `BYT 2024 CKD Bảng 21: Tối đa ${intlVnMax} mg/ngày khi MLCT ≥ ${severeEgfr} mL/phút.`
        },
        citationIds: ['fda.febuxostat.dosage', 'byt.ckd.2024.gout_ult_table21', 'acr.gout.2020.treat_to_target']
      });
    }
  }),

  goutRule({
    id: 'gout.pegloticase.severe_ckd_refractory',
    nameVi: 'Hội chẩn xét Pegloticase ở bệnh nhân CKD G4–G5 đã chạm trần Febuxostat 40 mg/ngày nhưng chưa đạt đích urat',
    citationIds: [
      'acr.gout.2020.pegloticase_refractory',
      'acr.gout.2020.pegloticase_against_mild',
      'eular.gout.2016.pegloticase_8mg_q2w'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx) || isAcuteGoutFlare(ctx)) return false;
      if (!isOnMed(ctx, ['febuxostat']) || isFebuxostatBeingStopped(ctx)) return false;
      const canSwitchAllo = getHlaB5801Status(ctx) !== 'positive' && !isAllopurinolIntolerant(ctx);
      if (hasEstablishedCvd(ctx) && canSwitchAllo) return false;

      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const severeEgfr = thFor('egfr', 'gout.febuxostat.severe_renal_egfr');
      const severeCrcl = thFor('crcl', 'gout.febuxostat.severe_renal_crcl');
      const renalMax = thFor('dose_mg', 'gout.febuxostat.severe_renal_max_dose');
      const isSevereRenal =
        isOnDialysis(ctx) ||
        (egfr !== undefined && egfr < severeEgfr) ||
        (crcl !== undefined && crcl < severeCrcl);
      if (!isSevereRenal) return false;

      const curDose = parseMedDailyDoseMg(findMed(ctx, ['febuxostat']));
      return curDose !== undefined && curDose === renalMax && isUrateBelowTarget(ctx) === false;
    },
    produce: (ctx): Recommendation => {
      const flaresYr = getFlaresPerYear(ctx);
      const frequentMin = thFor('gout_flares', 'gout.indication.flares_per_year_frequent');
      const severeRefractory =
        hasTophi(ctx) || hasXrayDamage(ctx) || (flaresYr !== undefined && flaresYr >= frequentMin);
      const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
      const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');
      const stdMgDl = thFor('urate', 'gout.target.urate_standard_mgdl');

      return goutRec({
        id: 'rec_gout_pegloticase_severe_refractory',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 81, // qa-allow: index - độ ưu tiên hội chẩn kháng trị
        action: 'REFER',
        title: severeRefractory
          ? `Gút mạn nặng chưa đạt đích urat ở trần Febuxostat suy thận nặng: Hội chẩn xét Pegloticase (${pegDose} mg IV mỗi ${pegWeeks} tuần)`
          : 'Chưa đạt đích urat ở trần Febuxostat suy thận nặng (cơn thưa, không tophi): Không chỉ định Pegloticase',
        rationale: severeRefractory
          ? `Bệnh nhân suy thận nặng đã chạm trần Febuxostat, không dùng được nhóm tăng thải urat và vẫn còn hạt tophi / ≥ ${frequentMin} đợt cấp/năm. Theo ACR 2020 (PICO 27) và EULAR 2016 (Rec 10), khuyến cáo hội chẩn chuyên khoa xét Pegloticase ${pegDose} mg truyền tĩnh mạch mỗi ${pegWeeks} tuần (không cần chỉnh liều theo eGFR; BẮT BUỘC sàng lọc thiếu men G6PD, NGỪNG Febuxostat cùng mọi thuốc hạ urat đường uống trước khi truyền, và ngừng Pegloticase nếu acid uric trước truyền tăng > ${stdMgDl} mg/dL).`
          : `Theo ACR 2020 (PICO 27), ở bệnh nhân có < ${frequentMin} đợt cấp/năm và không có hạt tophi, khuyến cáo mạnh KHÔNG chuyển sang Pegloticase do nguy cơ phản vệ nặng; tiếp tục duy trì trần liều an toàn hiện tại và tối ưu thuốc đồng mắc.`,
        citationIds: [
          'acr.gout.2020.pegloticase_refractory',
          'acr.gout.2020.pegloticase_against_mild',
          'eular.gout.2016.pegloticase_8mg_q2w'
        ]
      });
    }
  })
];
