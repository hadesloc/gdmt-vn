/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Cấp cứu Nội viện Cơn hen Trung bình, Nặng & Nguy kịch
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  asDose,
  asthmaGate,
  asthmaRule,
  evaluateAcuteAsthma,
  hasNarrowAngleGlaucoma,
  hasUrinaryRetentionOrBph,
  isAdultOrAdolescent,
  isAllergicToDrug,
  resolveAcuteMedAction
} from './helpers';

function getInpatientOxygenGuidance(acute: ReturnType<typeof evaluateAcuteAsthma>): {
  targetLabel: string;
  citationIds: string[];
  nebModeText: string;
} {
  if (acute.isPregnancyTarget) {
    return {
      targetLabel: `≥ ${acute.oxygenTargetMin}% (thai kỳ — bảo vệ thai nhi khỏi thiếu oxy máu)`,
      citationIds: [
        'gina.asthma.2026.oxygen_target_revised_95',
        'gina.asthma.2026.pregnancy_acute_fetal_hypoxia',
        'gina.asthma.2026.acute_oxygen_target'
      ],
      nebModeText: 'Phun khí dung liên tục hoặc ngắt quãng kèm oxy'
    };
  }
  if (acute.isCopdHypercapnicTarget) {
    return {
      targetLabel: `${acute.oxygenTargetMin}–${acute.oxygenTargetMax}% qua mặt nạ Venturi kiểm soát (đồng mắc COPD / tăng PaCO₂ — tránh oxy dòng cao gây toan hô hấp)`,
      citationIds: ['gina.asthma.2026.acute_oxygen_target', 'gina.asthma.2026.acute_hypercapnia_paco2_45'],
      nebModeText: 'Phun khí dung chạy bằng KHÍ NÉN (compressed air, KHÔNG chạy bằng oxy dòng cao)'
    };
  }
  return {
    targetLabel: `${acute.oxygenTargetMin}–${acute.oxygenTargetMax}% (bắt đầu thở oxy khi SpO₂ < ${acute.oxygenTargetMin}%)`,
    citationIds: ['gina.asthma.2026.acute_oxygen_target', 'byt.asthma.2021.acute_hospital_treatment'],
    nebModeText: 'Phun khí dung chạy bằng oxy'
  };
}

export const asthmaAcuteInpatientRules: Rule[] = [
  asthmaRule({
    id: 'asthma.acute.life_threatening_icu_referral',
    setting: 'inpatient',
    nameVi: 'BÁO ĐỘNG ĐỎ: Cơn hen cấp nguy kịch đe dọa tính mạng — Chuyển ICU & Đặt nội khí quản',
    citationIds: [
      'gina.asthma.2026.acute_icu_silent_chest',
      'gina.asthma.2026.acute_hypercapnia_paco2_45',
      'byt.asthma.2021.acute_classification',
      'byt.asthma.2021.acute_hypotension_life_threatening',
      'byt.hf.2022.intubation_vitals_brady_hypotension'
    ],
    when: (ctx) => {
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && acute.isLifeThreatening;
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const o2Info = getInpatientOxygenGuidance(acute);

      return {
        id: 'rec_asthma_acute_life_threatening_icu',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 100, // qa-allow: index - độ ưu tiên cấp cứu tối khẩn
        action: 'REFER',
        title: 'CẤP CỨU NGUY KỊCH ĐE DỌA TÍNH MẠNG: Chuyển ngay Khoa Hồi sức tích cực (ICU) & Chuẩn bị đặt nội khí quản',
        rationale: `Phát hiện dấu hiệu suy hô hấp - tuần hoàn nguy kịch (lồng ngực im lặng, ngủ gà/lú lẫn, không nói được, thở chậm, nhịp chậm/tụt HA, toan máu hoặc tăng PaCO₂). Bắt buộc thở oxy đạt SpO₂ ${o2Info.targetLabel}, khí dung giãn phế quản liên tục, Corticosteroid TM, đánh giá MgSO4 và hội chẩn Hồi sức đặt nội khí quản kịp thời.`,
        gates: [asthmaGate('lifeThreateningAsthma', false, 'Có dấu hiệu cơn hen nguy kịch đe dọa tính mạng')],
        citationIds: [
          ...o2Info.citationIds,
          'gina.asthma.2026.acute_icu_silent_chest',
          'gina.asthma.2026.acute_hypercapnia_paco2_45',
          'byt.asthma.2021.acute_classification',
          'byt.asthma.2021.acute_hypotension_life_threatening',
          'byt.hf.2022.intubation_vitals_brady_hypotension'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.severe_exacerbation_saba',
    setting: 'inpatient',
    nameVi: 'Cơn hen cấp nặng/nguy kịch: Khí dung SABA lặp lại liên tục trong 1 giờ đầu + Oxy kiểm soát',
    citationIds: [
      'gina.asthma.2026.acute_oxygen_target',
      'byt.asthma.2021.acute_hospital_treatment',
      'byt.asthma.2021.acute_iv_steroid_ipratropium'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere);
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const o2Info = getInpatientOxygenGuidance(acute);
      const nebDose = thFor('dose_mg', 'asthma.acute.salbutamol_neb_dose');
      const nebInterval = thFor('duration_min', 'asthma.acute.repeat_interval_min');
      const repMax = thFor('count', 'asthma.acute.ipratropium_repeat_max');
      const useTerbutaline = isAllergicToDrug(ctx, 'salbutamol') && !isAllergicToDrug(ctx, 'terbutaline');
      const sabaId = useTerbutaline ? 'terbutaline' : 'salbutamol';
      const sabaAction = resolveAcuteMedAction(ctx, sabaId);

      return {
        id: 'rec_asthma_acute_severe_saba',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 97, // qa-allow: index - độ ưu tiên cấp cứu
        action: sabaAction,
        drugId: sabaId,
        dose: asDose(
          `${o2Info.nebModeText} ${nebDose} mg mỗi ${nebInterval} phút (${repMax} lần liên tiếp trong 1 giờ đầu) + Thở oxy duy trì SpO₂ ${o2Info.targetLabel}`
        ),
        title: `Cắt cơn tích cực bằng khí dung ${useTerbutaline ? 'Terbutaline' : 'Salbutamol'} mỗi ${nebInterval} phút & Kiểm soát oxy (SpO₂ ${o2Info.targetLabel})`,
        rationale: `Cơn hen cấp mức độ nặng/nguy kịch đòi hỏi giãn phế quản tác dụng nhanh liều cao lặp lại trong giờ đầu kèm kiểm soát oxy mục tiêu SpO₂ ${o2Info.targetLabel} (tránh thở oxy 100% không kiểm soát gây ứ CO₂ máu).`,
        gates: [],
        citationIds: o2Info.citationIds
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.severe_exacerbation_ipratropium',
    setting: 'inpatient',
    nameVi: 'Cơn hen cấp trung bình – nặng – nguy kịch: Phối hợp khí dung Ipratropium bromide',
    citationIds: [
      'gina.asthma.2026.acute_ipratropium_puffs',
      'gina.asthma.2026.acute_moderate_severe_ipratropium',
      'byt.asthma.2020.acute_moderate_severe_ipratropium',
      'gina.asthma.2026.spacer_no_facemask_eye_protection'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere || acute.isModerate);
    },
    produce: (ctx): Recommendation => {
      if (isAllergicToDrug(ctx, 'ipratropium')) {
        return {
          id: 'rec_asthma_acute_severe_ipratropium',
          module: 'asthma',
          tier: 'Cấp cứu Cơn hen cấp',
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 96, // qa-allow: index - độ ưu tiên chống chỉ định dị ứng
          action: 'AVOID',
          drugId: 'ipratropium',
          dose: undefined,
          title: 'TRÁNH khí dung Ipratropium bromide do tiền sử dị ứng với Ipratropium / Atropine',
          rationale:
            'Người bệnh có tiền sử dị ứng với Ipratropium hoặc dẫn xuất Atropine; tuyệt đối không dùng kháng cholinergic.',
          gates: [asthmaGate('allergy', false, 'Dị ứng Ipratropium')],
          citationIds: ['gina.asthma.2026.acute_moderate_severe_ipratropium']
        };
      }

      const acute = evaluateAcuteAsthma(ctx);
      const ipraDose = thFor('dose_mg', 'asthma.acute.ipratropium_neb_mg');
      const nebInterval = thFor('duration_min', 'asthma.acute.repeat_interval_min');
      const repMax = thFor('count', 'asthma.acute.ipratropium_repeat_max');
      const ipraAction = resolveAcuteMedAction(ctx, 'ipratropium');
      const glaucoma = hasNarrowAngleGlaucoma(ctx);
      const bph = hasUrinaryRetentionOrBph(ctx);

      const warnings: string[] = [];
      if (glaucoma) {
        warnings.push(
          'Tăng nhãn áp góc đóng: BẮT BUỘC dùng ống ngậm miệng (mouthpiece) và che mắt kín; CẤM dùng mặt nạ hở tránh sương thuốc vào mắt gây glôcôm cấp.'
        );
      }
      if (bph) {
        warnings.push(
          'Tăng sinh tuyến tiền liệt / Bí tiểu: Theo dõi sát cầu bàng quang và lượng nước tiểu khi khí dung lặp lại.'
        );
      }

      const deviceSuffix = glaucoma
        ? ' — BẮT BUỘC dùng ống ngậm miệng (mouthpiece) + che mắt kín, CẤM dùng mặt nạ hở'
        : ' (ưu tiên ống ngậm miệng mouthpiece bảo vệ mắt)';

      return {
        id: 'rec_asthma_acute_severe_ipratropium',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: acute.isLifeThreatening || acute.isSevere ? 96 : 91, // qa-allow: index - độ ưu tiên cấp cứu theo phân tầng
        action: ipraAction,
        drugId: 'ipratropium',
        dose: asDose(
          `Phun khí dung ${ipraDose} mg pha chung với SABA mỗi ${nebInterval} phút x ${repMax} lần trong 1 giờ đầu${deviceSuffix}`
        ),
        title:
          acute.isLifeThreatening || acute.isSevere
            ? 'Phối hợp khí dung kháng cholinergic tác dụng ngắn (Ipratropium bromide)'
            : 'Phối hợp sớm Ipratropium bromide cho cơn hen cấp mức độ trung bình tại Cấp cứu',
        rationale:
          'Theo GINA 2026 (Chứng cứ A) và Bộ Y tế QĐ 1851/2020, phối hợp Ipratropium bromide cùng SABA ngay trong giờ đầu cho cơn hen cấp trung bình – nặng giúp phục hồi lưu lượng đỉnh nhanh hơn và giảm tỷ lệ nhập viện.',
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: [
          'gina.asthma.2026.acute_ipratropium_puffs',
          'gina.asthma.2026.acute_moderate_severe_ipratropium',
          'byt.asthma.2020.acute_moderate_severe_ipratropium',
          'gina.asthma.2026.spacer_no_facemask_eye_protection'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.severe_exacerbation_steroid',
    setting: 'inpatient',
    nameVi: 'Cơn hen cấp nặng/nguy kịch: Corticosteroid đường toàn thân sớm trong vòng 1 giờ đầu',
    citationIds: [
      'gina.asthma.2026.acute_prednisolone_daily',
      'byt.asthma.2021.acute_iv_steroid_ipratropium'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere);
    },
    produce: (ctx): Recommendation => {
      const mpDose = thFor('dose_mg', 'asthma.acute.methylprednisolone_iv_mg');
      const predMin = thFor('dose_mg', 'asthma.acute.prednisolone_dose_min');
      const predMax = thFor('dose_mg', 'asthma.acute.prednisolone_dose_max');
      const minDays = thFor('duration_days', 'asthma.acute.steroid_duration_min');
      const maxDays = thFor('duration_days', 'asthma.acute.steroid_duration_max');

      const useOralFallback =
        isAllergicToDrug(ctx, 'methylprednisolone') && !isAllergicToDrug(ctx, 'prednisolone');
      const targetSteroidId = useOralFallback ? 'prednisolone' : 'methylprednisolone';
      const steroidAction = resolveAcuteMedAction(ctx, targetSteroidId);

      return {
        id: 'rec_asthma_acute_severe_steroid',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 96, // qa-allow: index - độ ưu tiên cấp cứu
        action: steroidAction,
        drugId: targetSteroidId,
        dose: useOralFallback
          ? asDose(`Uống Prednisolone ${predMin}–${predMax} mg/ngày trong ${minDays}–${maxDays} ngày`)
          : asDose(
              `Tiêm tĩnh mạch ${mpDose} mg mỗi 6 giờ (hoặc uống Prednisolone ${predMin}–${predMax} mg/ngày nếu bệnh nhân tỉnh và nuốt an toàn); duy trì đợt ${minDays}–${maxDays} ngày`
            ),
        title: 'Khởi trị ngay Corticosteroid toàn thân trong vòng 1 giờ đầu (Methylprednisolone TM / Prednisolone)',
        rationale:
          'Theo GINA 2026 (Chứng cứ A) và Bộ Y tế QĐ 5850/2021, Corticosteroid toàn thân phải được dùng sớm trong 1 giờ đầu nhập cấp cứu (ưu tiên đường tĩnh mạch khi bệnh nhân khó thở nặng không uống được, nôn ói hoặc lơ mơ) để khống chế viêm cấp và giảm tử vong.',
        gates: [],
        citationIds: [
          'gina.asthma.2026.acute_prednisolone_daily',
          'byt.asthma.2021.acute_iv_steroid_ipratropium'
        ]
      };
    }
  })
];
