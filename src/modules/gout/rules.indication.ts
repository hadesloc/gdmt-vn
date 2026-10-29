/**
 * GDMT-VN Gout Module - ULT Indication Stratification & Urate Target Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  goutMissing,
  ULT_DRUG_IDS,
  isOnMed,
  findMed,
  isPregnant,
  isOnDialysis,
  isAcuteGoutFlare,
  isAsymptomaticHyperuricemia,
  hasSecondaryHyperuricemiaOrTls,
  hasActiveInfection,
  isDkaSuspected,
  hasSevereUncontrolledHyperglycemia,
  isTakingAzathioprine,
  hasActiveValidUlt,
  canInitiateUltNow,
  selectUltInitDrug,
  getTargetUrateUmol,
  getTargetUrateMgDl,
  isUrateBelowLongTermFloor,
  assessUltIndication
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_IND = 'Đánh giá chỉ định & Mục tiêu Acid uric';
const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutIndicationAndTargetRules: Rule[] = [
  goutRule({
    id: 'gout.indication.ult',
    nameVi: 'Phân tầng chỉ định khởi trị thuốc hạ acid uric máu (ULT)',
    citationIds: [
      'acr.gout.2020.indication_strong',
      'acr.gout.2020.indication_conditional_infrequent',
      'acr.gout.2020.indication_conditional_first_flare',
      'acr.gout.2020.indication_against_first_flare',
      'acr.gout.2020.indication_against_asymptomatic',
      'eular.gout.2016.early_ult_young_high_sua',
      'kdigo.gout.2024.rec_3_14_1',
      'kdigo.gout.2024.rec_3_14_2_asymptomatic'
    ],
    when: (ctx) => !isPregnant(ctx) && !hasActiveValidUlt(ctx),
    produce: (ctx): Recommendation => {
      if (hasSecondaryHyperuricemiaOrTls(ctx)) {
        return goutRec({
          id: 'rec_gout_ult_defer_secondary_tls',
          tier: TIER_IND,
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 85, // qa-allow: index - độ ưu tiên chỉ định
          action: 'DEFER',
          title: 'Chuyển sang phác đồ Hội chứng ly giải khối u (TLS) nội viện thay vì phác đồ ULT gút ngoại trú',
          rationale:
            'Bệnh nhân có tăng acid uric máu thứ phát do bệnh máu ác tính / nguy cơ TLS: cần xử trí theo phác đồ cấp cứu Ung bướu – Huyết học (bù dịch tĩnh mạch, Rasburicase hoặc Allopurinol liều TLS; tuyệt đối tránh nhóm tăng thải urat).',
          citationIds: ['ema.desuric.contra_lithiase_hemopathy', 'fda.febuxostat.secondary_hyperuricemia_not_rec']
        });
      }

      const ind = assessUltIndication(ctx);
      if (ind.status === 'missing') {
        return goutMissing(
          ind.missingField ?? 'goutFlaresYear',
          'Cần thông tin tần suất đợt gút cấp, mức lọc cầu thận eGFR và nồng độ Acid uric máu để phân tầng chỉ định ULT chính xác.',
          ['acr.gout.2020.indication_strong', 'acr.gout.2020.indication_conditional_first_flare']
        );
      }
      if (ind.status === 'asymptomatic') {
        return goutRec({
          id: 'rec_gout_ult_not_indicated_asymptomatic',
          tier: TIER_IND,
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 85, // qa-allow: index - độ ưu tiên chỉ định
          action: 'DEFER',
          title: 'KHÔNG khởi trị thuốc hạ acid uric máu: Tăng acid uric máu không triệu chứng',
          rationale: ind.reasonsVi.join('; '),
          citationIds: ind.citationIds
        });
      }
      if (ind.status === 'not_indicated') {
        const highMgdl = thFor('urate', 'gout.indication.urate_high_cutoff_mgdl');
        const eularAge = thFor('age', 'gout.indication.eular_young_age_max');
        const eularUmol = thFor('urate', 'gout.indication.eular_high_sua_umol');
        return goutRec({
          id: 'rec_gout_ult_not_indicated',
          tier: TIER_IND,
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 84, // qa-allow: index - độ ưu tiên chỉ định
          action: 'DEFER',
          title: 'Chưa có chỉ định khởi trị thuốc hạ acid uric máu (ULT)',
          rationale: ind.reasonsVi.join('; '),
          profileDiff: {
            US: `ACR 2020: Khuyến cáo không khởi trị ULT ở cơn gút đầu tiên không kèm CKD ≥ 3, sỏi thận hoặc urat > ${highMgdl} mg/dL.`,
            INTL: `EULAR 2016 Rec 5: Cân nhắc khởi trị sớm từ cơn đầu nếu tuổi < ${eularAge}, urat > ${eularUmol} µmol/L hoặc kèm THA / bệnh tim mạch.`,
            VN: 'BYT 361/2014: Điều chỉnh chế độ ăn – sinh hoạt và theo dõi tái phát cơn gút.'
          },
          citationIds: ind.citationIds
        });
      }
      if (hasActiveInfection(ctx) || isDkaSuspected(ctx) || hasSevereUncontrolledHyperglycemia(ctx)) {
        return goutRec({
          id: 'rec_gout_ult_defer_acute_medical_crisis',
          tier: TIER_IND,
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 85, // qa-allow: index - độ ưu tiên chỉ định
          action: 'DEFER',
          title: 'Có chỉ định ULT dài hạn nhưng TẠM HOÃN mở đầu thuốc mới cho tới khi ổn định nhiễm trùng cấp / biến cố chuyển hóa cấp',
          rationale: `Bệnh nhân có chỉ định ULT (${ind.reasonsVi.join('; ')}), tuy nhiên việc khởi trị thuốc hạ urat mới là can thiệp mạn tính có chọn lọc; cần ưu tiên kiểm soát ổn định nhiễm trùng cấp / nghi viêm khớp nhiễm khuẩn hoặc toan ceton – tăng đường huyết nặng trước khi bắt đầu ULT kèm dự phòng chống viêm.`,
          citationIds: [...ind.citationIds, 'byt.gout.2014.septic_arthritis_exclude_p93', 'eular.gout.2016.il1_blockers_flare']
        });
      }
      if (isAcuteGoutFlare(ctx) && ctx.settings.profile === 'VN') {
        const minW = thFor('interval_weeks', 'gout.ult.vn_defer_after_flare_weeks_min');
        const maxW = thFor('interval_weeks', 'gout.ult.vn_defer_after_flare_weeks_max');
        return goutRec({
          id: 'rec_gout_ult_defer_until_flare_resolves_vn',
          tier: TIER_IND,
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 85, // qa-allow: index - độ ưu tiên chỉ định
          action: 'DEFER',
          title: `Có chỉ định ULT nhưng tạm hoãn khởi trị mới tới khi cơn gút cấp thuyên giảm (sau ${minW}–${maxW} tuần theo BYT)`,
          rationale: `Bệnh nhân có chỉ định dùng ULT (${ind.reasonsVi.join('; ')}), tuy nhiên theo BYT 361/2014 không nên mở đầu Allopurinol ngay trong cơn gút cấp mà khởi trị sau ${minW}–${maxW} tuần khi viêm khớp cấp đã giảm.`,
          profileDiff: {
            VN: `BYT 361/2014: Trì hoãn mở đầu ULT mới cho tới khi cơn viêm khớp cấp thuyên giảm (sau ${minW}–${maxW} tuần dùng Colchicine).`,
            US: 'ACR 2020: Cho phép khởi trị ULT ngay trong đợt cấp nếu đi kèm thuốc chống viêm đầy đủ.',
            INTL: 'EULAR 2016: Có thể bắt đầu ULT sau khi cơn cấp ổn định hoặc khởi trị sớm kèm dự phòng chống viêm.'
          },
          citationIds: [...ind.citationIds, 'byt.gout.2014.ult_after_flare', 'acr.gout.2020.start_ult_during_flare']
        });
      }
      return goutRec({
        id: ind.status === 'strong' ? 'rec_gout_ult_indicated_strong' : 'rec_gout_ult_indicated_conditional',
        tier: TIER_IND,
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 85, // qa-allow: index - độ ưu tiên chỉ định
        action: 'MONITOR',
        title:
          ind.status === 'strong'
            ? 'Xác nhận CHỈ ĐỊNH MẠNH điều trị hạ acid uric máu dài hạn (ULT)'
            : 'Xác nhận CHỈ ĐỊNH CÓ ĐIỀU KIỆN khởi trị thuốc hạ acid uric máu (ULT)',
        rationale: `Cơ sở lâm sàng: ${ind.reasonsVi.join('; ')}. Cần áp dụng chiến lược Treat-to-Target chuẩn độ liều tới đích urat.`,
        citationIds: [...ind.citationIds, 'acr.gout.2020.treat_to_target']
      });
    }
  }),

  goutRule({
    id: 'gout.target.urate',
    nameVi: 'Xác lập mục tiêu Acid uric huyết thanh (Treat-to-Target) và ngưỡng an toàn dài hạn',
    citationIds: [
      'acr.gout.2020.target_urate_under_6',
      'acr.gout.2020.treat_to_target',
      'eular.gout.2016.target_urate_tophi',
      'byt.gout.2014.target_urate'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx) || hasSecondaryHyperuricemiaOrTls(ctx)) return false;
      if (hasActiveValidUlt(ctx)) return true;
      const ind = assessUltIndication(ctx);
      return ind.status === 'strong' || ind.status === 'conditional';
    },
    produce: (ctx): Recommendation => {
      if (hasActiveValidUlt(ctx) && !isAcuteGoutFlare(ctx) && need(ctx, 'urate') === undefined) {
        return goutMissing(
          'uricAcid',
          'Cần định lượng Acid uric huyết thanh để đánh giá đáp ứng mục tiêu điều trị (Treat-to-Target) khi đang dùng ULT.',
          ['acr.gout.2020.treat_to_target', 'acr.gout.2020.target_urate_under_6']
        );
      }

      const targetUmol = getTargetUrateUmol(ctx);
      const targetMgDl = getTargetUrateMgDl(ctx);
      const stdUmol = thFor('urate', 'gout.target.urate_standard_umol');
      const stdMgDl = thFor('urate', 'gout.target.urate_standard_mgdl');
      const tophiUmol = thFor('urate', 'gout.target.urate_tophi_umol');
      const vnTophiUmol = thFor('urate', 'gout.target.urate_vn_tophi_umol');
      const floorMgDl = thFor('urate', 'gout.target.urate_floor_mgdl');

      if (hasActiveValidUlt(ctx) && isUrateBelowLongTermFloor(ctx) && ctx.settings.profile !== 'US') {
        return goutRec({
          id: 'rec_gout_urate_below_floor_caution',
          tier: TIER_IND,
          tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 76, // qa-allow: index - độ ưu tiên mục tiêu
          action: 'CONSIDER',
          title: `Acid uric máu rất thấp (< ${floorMgDl} mg/dL): Tránh duy trì quá thấp kéo dài nhiều năm (EULAR 2016)`,
          rationale: `Theo EULAR 2016 (Khuyến cáo 6), không khuyến cáo duy trì liên tục nồng độ acid uric máu < ${floorMgDl} mg/dL trong nhiều năm dài; nếu hạt tophi đã tan hoàn toàn, có thể cân nhắc chỉnh nhẹ liều ULT để giữ urat ổn định dưới ${stdUmol} µmol/L.`,
          citationIds: ['eular.gout.2016.target_urate_tophi']
        });
      }

      const displayTarget =
        ctx.settings.units?.urat === 'mg_dL'
          ? `< ${targetMgDl} mg/dL`
          : `< ${targetUmol} µmol/L (< ${targetMgDl} mg/dL)`; // qa-allow: unit-conversion - hiển thị song song µmol/L và mg/dL

      const targetCitations =
        ctx.settings.profile === 'US'
          ? ['acr.gout.2020.target_urate_under_6', 'acr.gout.2020.treat_to_target']
          : ctx.settings.profile === 'VN'
            ? ['byt.gout.2014.target_urate', 'acr.gout.2020.treat_to_target']
            : ['eular.gout.2016.target_urate_tophi', 'acr.gout.2020.treat_to_target'];

      return goutRec({
        // qa-allow: unit-conversion - quy đổi giữa µmol/L và mg/dL (vd 320 µmol/L ≈ 5.4 mg/dL)
        id: 'rec_gout_urate_target_monitor',
        tier: TIER_IND,
        tierOrder: 3, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 75, // qa-allow: index - độ ưu tiên mục tiêu
        action: 'MONITOR',
        title: `Mục tiêu Acid uric huyết thanh cần đạt và duy trì: ${displayTarget}`,
        rationale:
          'Định lượng acid uric máu định kỳ mỗi 2–5 tuần trong giai đoạn chuẩn độ liều và mỗi 6 tháng sau khi đạt đích để đảm bảo tinh thể urat tan hoàn toàn và phòng tái phát.',
        profileDiff: {
          US: `ACR 2020: Mục tiêu chuẩn < ${stdMgDl} mg/dL (< ${stdUmol} µmol/L) cho mọi bệnh nhân dùng ULT.`,
          INTL: `EULAR 2016: < ${stdUmol} µmol/L chuẩn; < ${tophiUmol} µmol/L khi có hạt tophi/bệnh khớp mạn; tránh duy trì < ${floorMgDl} mg/dL dài hạn.`,
          VN: `BYT 361/2014: < ${stdUmol} µmol/L khi chưa có tophi và < ${vnTophiUmol} µmol/L khi có hạt tophi.`
        },
        citationIds: targetCitations
      });
    }
  }),

  goutRule({
    id: 'gout.safety.ult_all_contra_refer',
    nameVi: 'Hội chẩn chuyên khoa Cơ xương khớp – Thận khi chống chỉ định toàn bộ thuốc hạ urat đường uống',
    citationIds: [
      'acr.gout.2020.pegloticase_refractory',
      'eular.gout.2016.pegloticase_refractory',
      'eular.gout.2016.pegloticase_8mg_q2w',
      'eular.gout.2016.allopurinol_titration'
    ],
    when: (ctx) =>
      canInitiateUltNow(ctx) &&
      (need(ctx, 'egfr') !== undefined || isOnDialysis(ctx)) &&
      selectUltInitDrug(ctx) === 'none' &&
      !isTakingAzathioprine(ctx),
    produce: () => {
      const pegDose = thFor('dose_mg', 'gout.pegloticase.dose_mg');
      const pegWeeks = thFor('interval_weeks', 'gout.pegloticase.interval_weeks');
      return goutRec({
        id: 'rec_gout_ult_all_contra_refer',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 85, // qa-allow: index - độ ưu tiên hội chẩn
        action: 'REFER',
        title: 'Hội chẩn chuyên khoa Cơ xương khớp – Thận: Chống chỉ định / Không dung nạp toàn bộ thuốc hạ urat đường uống',
        rationale:
          `Bệnh nhân có chỉ định hạ acid uric máu nhưng hiện không thể khởi trị Allopurinol, Febuxostat lẫn nhóm tăng thải urat (do suy thận, sỏi thận, bệnh gan hoặc thời kỳ cho con bú). Khuyến cáo hội chẩn chuyên khoa sâu để đánh giá giải mẫn cảm Allopurinol (nếu chỉ phát ban da nhẹ không phải SCAR theo EULAR 2016), tối ưu lọc máu, hoặc xét truyền tĩnh mạch Pegloticase ${pegDose} mg mỗi ${pegWeeks} tuần nếu có gút mạn tophi nặng sau khi sàng lọc thiếu men G6PD.`,
        citationIds: [
          'acr.gout.2020.pegloticase_refractory',
          'eular.gout.2016.pegloticase_refractory',
          'eular.gout.2016.pegloticase_8mg_q2w',
          'eular.gout.2016.allopurinol_titration'
        ]
      });
    }
  }),

  goutRule({
    id: 'gout.safety.asymptomatic_on_ult',
    nameVi: 'Rà soát ngừng thuốc hạ urat không có chỉ định ở người tăng acid uric máu không triệu chứng',
    citationIds: ['acr.gout.2020.indication_against_asymptomatic', 'kdigo.gout.2024.rec_3_14_2_asymptomatic'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !hasSecondaryHyperuricemiaOrTls(ctx) &&
      isAsymptomaticHyperuricemia(ctx) &&
      isOnMed(ctx, ULT_DRUG_IDS),
    produce: (ctx): Recommendation | null => {
      const med = findMed(ctx, ULT_DRUG_IDS);
      if (!med?.drugId) return null;
      return goutRec({
        id: 'rec_gout_asymptomatic_deprescribe_ult',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 88, // qa-allow: index - độ ưu tiên rà soát
        action: 'CONSIDER',
        drugId: med.drugId,
        title: `Cân nhắc ngừng ${med.drugId}: Tăng acid uric máu không triệu chứng không có chỉ định dùng ULT`,
        rationale:
          'Theo ACR 2020 và KDIGO 2024 (Rec 3.14.2), không khuyến cáo dùng thuốc hạ acid uric máu ở người tăng urat không triệu chứng. Cân nhắc ngừng thuốc trừ khi đang dự phòng hội chứng ly giải khối u ung thư.',
        citationIds: ['acr.gout.2020.indication_against_asymptomatic', 'kdigo.gout.2024.rec_3_14_2_asymptomatic']
      });
    }
  })
];
