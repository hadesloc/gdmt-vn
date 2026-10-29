/**
 * GDMT-VN Gout Module - ULT Safety Gates (XOI Duplication, HLA-B*58:01, Azathioprine, Lactation, TLS)
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import {
  goutRule,
  goutRec,
  isOnMed,
  isPregnant,
  isBreastfeeding,
  isAsymptomaticHyperuricemia,
  hasSecondaryHyperuricemiaOrTls,
  hasEstablishedCvd,
  getHlaB5801Status,
  isHighRiskHlaB5801Ancestry,
  isAllopurinolIntolerant,
  isFebuxostatIntolerant,
  isFebuxostatBeingStopped,
  isTakingAzathioprine,
  hasDuplicateXoi,
  getDuplicateXoiDrugToStop,
  hasActiveValidUlt,
  assessUltIndication
} from './helpers';
import { goutIndicationAndTargetRules } from './rules.indication';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_ULT = 'Điều trị hạ acid uric máu (ULT)';

export const goutUltSafetyAndIndicationRules: Rule[] = [
  goutRule({
    id: 'gout.safety.duplicate_xoi',
    nameVi: 'Chặn trùng lặp cơ chế: Không phối hợp đồng thời hai thuốc XOI (Allopurinol + Febuxostat)',
    citationIds: ['acr.gout.2020.switch_second_xoi', 'eular.gout.2016.allopurinol_titration'],
    when: (ctx) => !isPregnant(ctx) && hasDuplicateXoi(ctx),
    produce: (ctx): Recommendation => {
      const stopDrug = getDuplicateXoiDrugToStop(ctx);
      const keepDrug = stopDrug === 'allopurinol' ? 'Febuxostat' : 'Allopurinol';
      return goutRec({
        id: 'rec_gout_stop_duplicate_xoi',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: 'STOP',
        drugId: stopDrug,
        title: `NGỪNG ${stopDrug === 'allopurinol' ? 'Allopurinol' : 'Febuxostat'} do trùng lặp 2 thuốc cùng nhóm XOI`,
        rationale: `Allopurinol và Febuxostat cùng cơ chế ức chế Xanthine Oxidase: tuyệt đối không phối hợp đồng thời do tăng độc tính gan – da mà không tăng hiệu quả. Ngừng ${stopDrug} và chỉ duy trì đơn trị ${keepDrug}.`,
        citationIds: ['acr.gout.2020.switch_second_xoi', 'eular.gout.2016.allopurinol_titration']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.allopurinol_intolerant',
    nameVi: 'Chống chỉ định Allopurinol ở bệnh nhân có tiền sử dị ứng hoặc không dung nạp Allopurinol',
    citationIds: ['fda.allopurinol.skin_rash_scar', 'acr.gout.2020.switch_second_xoi'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isAllopurinolIntolerant(ctx) &&
      (isOnMed(ctx, ['allopurinol']) || !isAsymptomaticHyperuricemia(ctx)),
    produce: (ctx): Recommendation => {
      const onAllo = isOnMed(ctx, ['allopurinol']);
      return goutRec({
        id: onAllo ? 'rec_gout_allopurinol_stop_intolerant' : 'rec_gout_allopurinol_avoid_intolerant',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: onAllo ? 'STOP' : 'AVOID',
        drugId: 'allopurinol',
        title: onAllo
          ? 'NGỪNG NGAY Allopurinol do tiền sử dị ứng / không dung nạp thuốc'
          : 'Chống chỉ định dùng lại Allopurinol do tiền sử dị ứng / không dung nạp',
        rationale:
          'Theo nhãn FDA Zyloprim, phải ngừng vĩnh viễn Allopurinol ngay khi có ban da hoặc tiền sử phản ứng quá mẫn để phòng ngừa hội chứng Stevens-Johnson / TEN / DRESS đe dọa tính mạng; chuyển sang Febuxostat hoặc thuốc tăng thải urat.',
        citationIds: ['fda.allopurinol.skin_rash_scar', 'acr.gout.2020.switch_second_xoi']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.febuxostat_intolerant',
    nameVi: 'Ngừng / Tránh Febuxostat khi có tiền sử dị ứng hoặc không dung nạp Febuxostat',
    citationIds: ['fda.febuxostat.dialysis_hepatic', 'acr.gout.2020.switch_second_xoi'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isFebuxostatIntolerant(ctx) &&
      (isOnMed(ctx, ['febuxostat']) ||
        (!isAsymptomaticHyperuricemia(ctx) && (isAllopurinolIntolerant(ctx) || getHlaB5801Status(ctx) === 'positive'))),
    produce: (ctx): Recommendation => {
      const onFeb = isOnMed(ctx, ['febuxostat']);
      return goutRec({
        id: onFeb ? 'rec_gout_febuxostat_stop_intolerant' : 'rec_gout_febuxostat_avoid_intolerant',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: onFeb ? 'STOP' : 'AVOID',
        drugId: 'febuxostat',
        title: onFeb
          ? 'NGỪNG Febuxostat do tiền sử dị ứng / không dung nạp hoặc tổn thương gan'
          : 'Tránh dùng Febuxostat do tiền sử dị ứng / không dung nạp',
        rationale: 'Ngừng hoặc tránh dùng lại Febuxostat và chuyển sang thuốc hạ acid uric máu nhóm khác phù hợp chức năng thận.',
        citationIds: ['fda.febuxostat.dialysis_hepatic', 'acr.gout.2020.switch_second_xoi']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.febuxostat_lactation',
    nameVi: 'Tránh / Ngừng Febuxostat ở phụ nữ đang cho con bú (FDA Uloric Mục 8.2)',
    citationIds: ['fda.febuxostat.lactation', 'acr.gout.2020.allopurinol_first_line'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isBreastfeeding(ctx) &&
      (isOnMed(ctx, ['febuxostat']) ||
        (!isAsymptomaticHyperuricemia(ctx) && (isAllopurinolIntolerant(ctx) || getHlaB5801Status(ctx) === 'positive'))),
    produce: (ctx): Recommendation => {
      const onFeb = isOnMed(ctx, ['febuxostat']);
      return goutRec({
        id: onFeb ? 'rec_gout_febuxostat_stop_lactation' : 'rec_gout_febuxostat_avoid_lactation',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 97, // qa-allow: index - độ ưu tiên an toàn cho con bú
        action: onFeb ? 'STOP' : 'AVOID',
        drugId: 'febuxostat',
        title: onFeb
          ? 'TẠM NGỪNG Febuxostat trong thời kỳ đang cho con bú'
          : 'Tránh khởi trị Febuxostat ở phụ nữ đang cho con bú',
        rationale:
          'Theo nhãn FDA Uloric (Mục 8.2), Febuxostat bài tiết qua sữa động vật và chưa có dữ liệu an toàn trên trẻ bú mẹ; khuyến cáo tránh dùng Febuxostat trong thời kỳ cho con bú.',
        citationIds: ['fda.febuxostat.lactation', 'acr.gout.2020.allopurinol_first_line']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.febuxostat_stop_tls',
    nameVi: 'Ngừng Febuxostat trong tăng acid uric máu thứ phát do bệnh ác tính huyết học / Hội chứng ly giải khối u',
    citationIds: ['fda.febuxostat.secondary_hyperuricemia_not_rec'],
    when: (ctx) => !isPregnant(ctx) && hasSecondaryHyperuricemiaOrTls(ctx) && isOnMed(ctx, ['febuxostat']),
    produce: () =>
      goutRec({
        id: 'rec_gout_febuxostat_stop_tls',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên an toàn TLS
        action: 'STOP',
        drugId: 'febuxostat',
        title: 'NGỪNG Febuxostat: Nhãn FDA Uloric không khuyến cáo dùng trong tăng acid uric máu thứ phát / TLS',
        rationale:
          'Theo nhãn FDA Uloric (Mục 1), Febuxostat không được khuyến cáo để điều trị tăng acid uric máu thứ phát ở bệnh nhân bệnh máu ác tính hoặc hội chứng ly giải khối u; chuyển sang phác đồ dự phòng/xử trí TLS chuyên khoa.',
        citationIds: ['fda.febuxostat.secondary_hyperuricemia_not_rec']
      })
  }),

  goutRule({
    id: 'gout.safety.secondary_hyperuricemia_tls',
    nameVi: 'Chuyển hướng xử trí cấp cứu chuyên khoa Ung bướu – Huyết học khi tăng acid uric máu thứ phát / Hội chứng ly giải khối u (TLS)',
    citationIds: [
      'ema.desuric.contra_lithiase_hemopathy',
      'fda.febuxostat.secondary_hyperuricemia_not_rec',
      'byt.gout.2014.uricosuric_contra'
    ],
    when: (ctx) => !isPregnant(ctx) && hasSecondaryHyperuricemiaOrTls(ctx),
    produce: () =>
      goutRec({
        id: 'rec_gout_secondary_tls_refer',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên cấp cứu TLS
        action: 'REFER',
        title: 'Hội chẩn khẩn Huyết học – Ung bướu: Tăng acid uric máu thứ phát / Nguy cơ Hội chứng ly giải khối u (TLS)',
        rationale:
          'Không áp dụng phác đồ ngoại trú bệnh gút nguyên phát cho tăng acid uric máu thứ phát do bệnh máu ác tính / hóa trị. CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI nhóm thuốc tăng thải urat (Probenecid, Benzbromarone) do nguy cơ kết tủa tinh thể acid uric cấp tính gây tắc ống thận vô niệu (EMA Desuric Mục 4.3; BYT 361/2014) và không khuyến cáo dùng Febuxostat theo nhãn FDA Uloric. Cần truyền dịch tích cực kết hợp Rasburicase hoặc Allopurinol theo phác đồ TLS nội viện.',
        citationIds: [
          'ema.desuric.contra_lithiase_hemopathy',
          'fda.febuxostat.secondary_hyperuricemia_not_rec',
          'byt.gout.2014.uricosuric_contra'
        ]
      })
  }),

  goutRule({
    id: 'gout.safety.hlab5801_positive',
    nameVi: 'Chống chỉ định Allopurinol khi mang alen HLA-B*58:01 dương tính',
    citationIds: ['acr.gout.2020.hlab5801_screening', 'fda.allopurinol.skin_rash_scar'],
    when: (ctx) => !isPregnant(ctx) && getHlaB5801Status(ctx) === 'positive',
    produce: (ctx): Recommendation => {
      const onAllo = isOnMed(ctx, ['allopurinol']);
      return goutRec({
        id: onAllo ? 'rec_gout_allopurinol_stop_hlab5801' : 'rec_gout_allopurinol_avoid_hlab5801',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: onAllo ? 'STOP' : 'AVOID',
        drugId: 'allopurinol',
        title: onAllo
          ? 'NGỪNG KHẨN CẤP Allopurinol do mang gen HLA-B*58:01 dương tính'
          : 'Chống chỉ định Allopurinol do HLA-B*58:01 dương tính',
        rationale:
          'Người mang alen HLA-B*58:01 có nguy cơ rất cao gặp phản ứng quá mẫn da – nội tạng nặng (SCAR/SJS/TEN/DRESS) khi dùng Allopurinol; chống chỉ định sử dụng và ưu tiên chuyển sang Febuxostat.',
        citationIds: ['acr.gout.2020.hlab5801_screening', 'fda.allopurinol.skin_rash_scar']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.hlab5801_screening',
    nameVi: 'Khuyến cáo xét nghiệm sàng lọc alen HLA-B*58:01 ở chủng tộc nguy cơ cao trước khi dùng Allopurinol',
    citationIds: [
      'acr.gout.2020.hlab5801_screening',
      'acr.gout.2020.hlab5801_against_others',
      'eular.gout.2016.hlab5801_ethnic_discretion'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || isAsymptomaticHyperuricemia(ctx) || hasSecondaryHyperuricemiaOrTls(ctx)) return false;
      if (isOnMed(ctx, ['allopurinol']) || isAllopurinolIntolerant(ctx) || isTakingAzathioprine(ctx)) return false;
      if (getHlaB5801Status(ctx) !== 'not_done') return false;
      if (!isHighRiskHlaB5801Ancestry(ctx)) return false;

      const switchingFromFebCvd =
        isOnMed(ctx, ['febuxostat']) && !isFebuxostatBeingStopped(ctx) && hasEstablishedCvd(ctx);
      if (hasActiveValidUlt(ctx) && !switchingFromFebCvd) return false;

      const ind = assessUltIndication(ctx);
      return switchingFromFebCvd || ind.status === 'strong' || ind.status === 'conditional';
    },
    produce: () =>
      goutRec({
        id: 'rec_gout_hlab5801_screening',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 87, // qa-allow: index - độ ưu tiên sàng lọc
        action: 'CONSIDER',
        title: 'Khuyến cáo xét nghiệm gen HLA-B*58:01 trước khi dùng liều Allopurinol đầu tiên (Chủng tộc nguy cơ cao)',
        rationale:
          'ACR 2020 (Table 3, PICO 12) khuyến cáo có điều kiện xét nghiệm alen HLA-B*58:01 trước khi khởi trị Allopurinol ở người gốc Đông Nam Á (bao gồm người Việt Nam, Hán, Hàn Quốc, Thái Lan) và người Mỹ gốc Phi do tần suất mang alen cao và nguy cơ hội chứng quá mẫn nặng SCAR/SJS/TEN (không khuyến cáo sàng lọc đại trà ở các chủng tộc nguy cơ thấp khác).',
        citationIds: [
          'acr.gout.2020.hlab5801_screening',
          'acr.gout.2020.hlab5801_against_others',
          'eular.gout.2016.hlab5801_ethnic_discretion'
        ]
      })
  }),

  goutRule({
    id: 'gout.safety.azathioprine_allopurinol',
    nameVi: 'Chống chỉ định / Tránh phối hợp Allopurinol với Azathioprine hoặc 6-Mercaptopurine',
    citationIds: ['fda.allopurinol.azathioprine_interaction'],
    when: (ctx) => !isPregnant(ctx) && isTakingAzathioprine(ctx),
    produce: (ctx): Recommendation => {
      const onAllo = isOnMed(ctx, ['allopurinol']);
      return goutRec({
        id: onAllo ? 'rec_gout_allopurinol_stop_azathioprine' : 'rec_gout_allopurinol_avoid_azathioprine',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: onAllo ? 'STOP' : 'AVOID',
        drugId: 'allopurinol',
        title: onAllo
          ? 'NGỪNG Allopurinol do tương tác suy tủy nguy kịch với Azathioprine / 6-MP'
          : 'Tránh khởi trị Allopurinol khi đang dùng Azathioprine / 6-Mercaptopurine',
        rationale:
          'Allopurinol ức chế Xanthine Oxidase làm tích lũy 6-MP gây suy tủy xương đe dọa tính mạng; tránh phối hợp (chỉ thực hiện tại trung tâm chuyên khoa sâu khi bắt buộc và đã giảm mạnh liều Azathioprine xuống còn một phần tư đến một phần ba kèm theo dõi sát huyết đồ).',
        citationIds: ['fda.allopurinol.azathioprine_interaction']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.azathioprine_febuxostat',
    nameVi: 'Chống chỉ định tuyệt đối phối hợp Febuxostat với Azathioprine hoặc 6-Mercaptopurine',
    citationIds: ['fda.febuxostat.azathioprine_contra'],
    when: (ctx) => !isPregnant(ctx) && isTakingAzathioprine(ctx),
    produce: (ctx): Recommendation => {
      const onFeb = isOnMed(ctx, ['febuxostat']);
      return goutRec({
        id: onFeb ? 'rec_gout_febuxostat_stop_azathioprine' : 'rec_gout_febuxostat_avoid_azathioprine',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: onFeb ? 'STOP' : 'AVOID',
        drugId: 'febuxostat',
        title: onFeb
          ? 'NGỪNG KHẨN CẤP Febuxostat: Chống chỉ định tuyệt đối với Azathioprine / 6-MP'
          : 'Chống chỉ định tuyệt đối Febuxostat khi đang dùng Azathioprine / 6-MP',
        rationale:
          'Theo nhãn FDA Uloric (Mục 4), chống chỉ định tuyệt đối dùng Febuxostat ở bệnh nhân đang điều trị bằng Azathioprine hoặc Mercaptopurine do nguy cơ nhiễm độc tủy xương tử vong.',
        citationIds: ['fda.febuxostat.azathioprine_contra']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.azathioprine_refer',
    nameVi: 'Hội chẩn chuyên khoa Khớp – Ghép tạng/Miễn dịch khi gút kèm dùng Azathioprine',
    citationIds: ['fda.allopurinol.azathioprine_interaction', 'fda.febuxostat.azathioprine_contra', 'acr.gout.2020.pegloticase_refractory'],
    when: (ctx) => {
      if (isPregnant(ctx) || !isTakingAzathioprine(ctx) || hasSecondaryHyperuricemiaOrTls(ctx)) return false;
      const ind = assessUltIndication(ctx);
      return ind.status === 'strong' || ind.status === 'conditional';
    },
    produce: () =>
      goutRec({
        id: 'rec_gout_azathioprine_specialist_refer',
        tier: TIER_ULT,
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 81, // qa-allow: index - độ ưu tiên hội chẩn
        action: 'REFER',
        title: 'Hội chẩn chuyên khoa Cơ xương khớp – Ghép tạng/Miễn dịch để tối ưu phác đồ hạ urat trên nền Azathioprine',
        rationale:
          'Do cả Allopurinol và Febuxostat đều chống chỉ định/nguy cơ suy tủy nặng với Azathioprine, cần hội chẩn chuyên khoa để đổi Azathioprine sang Mycophenolate mofetil nếu bệnh nền cho phép, dùng nhóm tăng thải urat khi eGFR bảo tồn, hoặc xét Pegloticase.',
        citationIds: ['fda.allopurinol.azathioprine_interaction', 'fda.febuxostat.azathioprine_contra', 'acr.gout.2020.pegloticase_refractory']
      })
  }),

  ...goutIndicationAndTargetRules
];
