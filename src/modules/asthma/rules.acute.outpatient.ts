/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Xử trí Cấp cứu Cơn hen tại Tuyến Ban đầu / Ngoại trú
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import { missingInputRec } from '../../engine/require';
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

function formatOutpatientO2Target(acute: ReturnType<typeof evaluateAcuteAsthma>): {
  targetLabel: string;
  citationIds: string[];
} {
  if (acute.isPregnancyTarget) {
    return {
      targetLabel: `≥ ${acute.oxygenTargetMin}% (phụ nữ mang thai — phòng thiếu oxy máu thai nhi)`,
      citationIds: [
        'gina.asthma.2026.acute_primary_care_transfer',
        'gina.asthma.2026.oxygen_target_revised_95',
        'gina.asthma.2026.pregnancy_acute_fetal_hypoxia'
      ]
    };
  }
  if (acute.isCopdHypercapnicTarget) {
    return {
      targetLabel: `${acute.oxygenTargetMin}–${acute.oxygenTargetMax}% (oxy kiểm soát qua mặt nạ Venturi do đồng mắc COPD / nguy cơ ứ CO₂)`,
      citationIds: ['gina.asthma.2026.acute_primary_care_transfer', 'gina.asthma.2026.acute_oxygen_target']
    };
  }
  return {
    targetLabel: `${acute.oxygenTargetMin}–${acute.oxygenTargetMax}%`,
    citationIds: ['gina.asthma.2026.acute_primary_care_transfer', 'gina.asthma.2026.acute_oxygen_target']
  };
}

export const asthmaAcuteOutpatientRules: Rule[] = [
  asthmaRule({
    id: 'asthma.acute.outpatient_emergency_refer',
    setting: 'outpatient',
    nameVi: 'Cơn hen cấp tại phòng khám ngoại trú: Chuyển Khoa Cấp cứu / ICU khẩn cấp',
    citationIds: [
      'gina.asthma.2026.acute_primary_care_transfer',
      'gina.asthma.2026.acute_icu_silent_chest',
      'byt.asthma.2021.acute_classification'
    ],
    when: (ctx) => evaluateAcuteAsthma(ctx).hasAcuteAttack,
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const o2Info = formatOutpatientO2Target(acute);
      const isCritOrSev = acute.isLifeThreatening || acute.isSevere;

      return {
        id: acute.isLifeThreatening
          ? 'rec_asthma_acute_life_threatening_icu'
          : 'rec_asthma_outpatient_acute_refer',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị cấp cứu
        priority: 100, // qa-allow: index - độ ưu tiên chuyển tuyến khẩn cấp
        action: 'REFER',
        title: acute.isLifeThreatening
          ? 'CẤP CỨU TỐI KHẨN (NGOẠI TRÚ → ICU/115): Cơn hen nguy kịch đe dọa tính mạng — Chuyển viện có nhân viên hồi sức đi kèm'
          : isCritOrSev
            ? 'CHUYỂN KHOA CẤP CỨU KHẨN CẤP: Cơn hen cấp nặng tại phòng khám — Xử trí ban đầu trong lúc chờ xe cấp cứu'
            : 'CƠN HEN CẤP TẠI PHÒNG KHÁM: Xử trí cắt cơn tích cực tại chỗ & theo dõi sát đáp ứng trong 1 giờ đầu',
        rationale: `Theo GINA 2026 (Box 9-3) và Bộ Y tế QĐ 1851/2020, người bệnh đang trong cơn hen cấp tại phòng khám ngoại trú phải dừng kê đơn mạn tính thường quy; đánh giá ABC, thở oxy đạt SpO₂ ${o2Info.targetLabel}, dùng ngay thuốc giãn phế quản tác dụng ngắn lặp lại và Corticosteroid toàn thân sớm${isCritOrSev ? ', đồng thời gọi xe cấp cứu chuyển ngay lên Khoa Cấp cứu / ICU (chuẩn bị đặt nội khí quản nếu lơ mơ, phổi im lặng, thở chậm, mạch chậm hoặc tụt huyết áp)' : ' và chuyển Cấp cứu nếu không đáp ứng hoàn toàn sau 1 giờ'}.`,
        gates: [
          asthmaGate(
            'isAcuteExacerbation',
            false,
            acute.isLifeThreatening
              ? 'Cơn hen cấp nguy kịch tại ngoại trú'
              : acute.isSevere
                ? 'Cơn hen cấp nặng tại ngoại trú'
                : 'Đang có đợt cấp hen phế quản tại ngoại trú'
          )
        ],
        citationIds: [
          ...o2Info.citationIds,
          'gina.asthma.2026.acute_icu_silent_chest',
          'byt.asthma.2021.acute_classification'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.outpatient_missing_vitals',
    setting: 'outpatient',
    nameVi: 'Yêu cầu bổ sung SpO2 và nhịp thở khi phân loại cơn hen cấp ngoại trú',
    citationIds: ['gina.asthma.2026.acute_primary_care_transfer', 'byt.asthma.2021.acute_classification'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && !acute.isLifeThreatening && !acute.isSevere && !acute.hasMinVitals;
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const missingField = acute.missingVitalField ?? 'spo2';
      return missingInputRec(
        'asthma',
        missingField,
        'phân tầng mức độ nặng cơn hen cấp tại phòng khám (SpO₂ khí trời và nhịp thở thực tế) để quyết định chỉ định oxy, Ipratropium và chuyển Cấp cứu',
        ['gina.asthma.2026.acute_primary_care_transfer', 'byt.asthma.2021.acute_classification']
      );
    }
  }),

  asthmaRule({
    id: 'asthma.acute.outpatient_pretransfer_saba',
    setting: 'outpatient',
    nameVi: 'Xử trí tiền viện tại phòng khám: SABA liều lặp lại qua buồng đệm / khí dung + Oxy mục tiêu',
    citationIds: [
      'gina.asthma.2026.acute_primary_care_transfer',
      'gina.asthma.2026.acute_saba_puffs',
      'byt.asthma.2021.acute_hospital_treatment'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere || acute.hasMinVitals);
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const o2Info = formatOutpatientO2Target(acute);
      const useTerbutaline = isAllergicToDrug(ctx, 'salbutamol') && !isAllergicToDrug(ctx, 'terbutaline');
      const targetSabaId = useTerbutaline ? 'terbutaline' : 'salbutamol';
      const sabaAction = resolveAcuteMedAction(ctx, targetSabaId);

      const pmdiMin = thFor('puffs_dose', 'asthma.acute.salbutamol_puffs_min');
      const pmdiMax = thFor('puffs_dose', 'asthma.acute.salbutamol_puffs_max');
      const nebDose = thFor('dose_mg', 'asthma.acute.salbutamol_neb_dose');
      const nebInterval = thFor('duration_min', 'asthma.acute.repeat_interval_min');

      const nebDriverText = acute.isCopdHypercapnicTarget
        ? 'phun khí dung chạy bằng KHÍ NÉN (tránh chạy bằng oxy dòng cao để phòng ứ CO₂) kết hợp oxy kiểm soát'
        : 'phun khí dung chạy bằng oxy';

      return {
        id: 'rec_asthma_outpatient_acute_saba',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị cấp cứu
        priority: 97, // qa-allow: index - độ ưu tiên thuốc cắt cơn tiền viện
        action: sabaAction,
        drugId: targetSabaId,
        dose: useTerbutaline
          ? asDose(`Phun khí dung Terbutaline ${nebDose} mg mỗi ${nebInterval} phút trong 1 giờ đầu + Thở oxy đích SpO₂ ${o2Info.targetLabel}`)
          : asDose(
              `Xịt ${pmdiMin}–${pmdiMax} nhát pMDI (100 mcg/nhát) qua buồng đệm (hoặc ${nebDriverText} ${nebDose} mg) lặp lại mỗi ${nebInterval} phút trong 1 giờ đầu + Oxy đích SpO₂ ${o2Info.targetLabel}`
            ),
        title: `Xử trí cắt cơn ban đầu trong lúc chuyển viện: ${useTerbutaline ? 'Terbutaline' : 'Salbutamol'} liều lặp lại + Oxy kiểm soát`,
        rationale:
          'Theo GINA 2026 (Box 9-3), trong lúc chờ chuyển Khoa Cấp cứu hoặc theo dõi tại tuyến ban đầu, bắt buộc cho SABA tác dụng nhanh qua bình xịt định liều kèm buồng đệm hoặc phun khí dung lặp lại mỗi 20 phút trong giờ đầu kèm thở oxy kiểm soát theo đích SpO₂ cá thể hóa.',
        gates: [],
        citationIds: [
          ...o2Info.citationIds,
          'gina.asthma.2026.acute_saba_puffs',
          'byt.asthma.2021.acute_hospital_treatment'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.outpatient_pretransfer_ipratropium',
    setting: 'outpatient',
    nameVi: 'Phối hợp Ipratropium bromide cho cơn hen cấp mức độ trung bình – nặng – nguy kịch tại tuyến ban đầu',
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
          id: 'rec_asthma_outpatient_acute_ipratropium',
          module: 'asthma',
          tier: 'Cấp cứu Cơn hen cấp',
          tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 96, // qa-allow: index - độ ưu tiên chống chỉ định dị ứng
          action: 'AVOID',
          drugId: 'ipratropium',
          dose: undefined,
          title: 'TRÁNH Ipratropium bromide do tiền sử dị ứng với Ipratropium / dẫn xuất Atropine',
          rationale:
            'Hồ sơ ghi nhận dị ứng với Ipratropium/Atropine; không phối hợp kháng cholinergic mà tập trung tối ưu SABA + Corticosteroid toàn thân và chuyển viện khẩn.',
          gates: [asthmaGate('allergy', false, 'Dị ứng Ipratropium')],
          citationIds: ['gina.asthma.2026.acute_moderate_severe_ipratropium']
        };
      }

      const ipraNeb = thFor('dose_mg', 'asthma.acute.ipratropium_neb_mg');
      const ipraPuffs = thFor('puffs_dose', 'asthma.acute.ipratropium_puffs');
      const nebInterval = thFor('duration_min', 'asthma.acute.repeat_interval_min');
      const glaucoma = hasNarrowAngleGlaucoma(ctx);
      const bph = hasUrinaryRetentionOrBph(ctx);
      const ipraAction = resolveAcuteMedAction(ctx, 'ipratropium');

      const warnings: string[] = [];
      if (glaucoma) {
        warnings.push(
          'Tăng nhãn áp góc đóng: BẮT BUỘC dùng ống ngậm miệng (mouthpiece) và che kín bảo vệ mắt; TUYỆT ĐỐI KHÔNG dùng mặt nạ khí dung hở tránh sương thuốc vào mắt gây cơn glôcôm cấp.'
        );
      }
      if (bph) {
        warnings.push(
          'Phì đại tuyến tiền liệt / Bí tiểu: Theo dõi sát cầu bàng quang và lượng nước tiểu sau khí dung kháng cholinergic.'
        );
      }

      const deviceSuffix = glaucoma
        ? ' (BẮT BUỘC ngậm qua ống mouthpiece + kính bảo vệ mắt; CẤM dùng mặt nạ hở do tăng nhãn áp góc đóng)'
        : ' (ưu tiên ống ngậm miệng mouthpiece, tránh phơi nhiễm sương thuốc vào mắt)';

      return {
        id: 'rec_asthma_outpatient_acute_ipratropium',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị cấp cứu
        priority: 95, // qa-allow: index - độ ưu tiên phối hợp SAMA
        action: ipraAction,
        drugId: 'ipratropium',
        dose: asDose(
          `Khí dung ${ipraNeb} mg (hoặc xịt ${ipraPuffs} nhát pMDI qua buồng đệm) mỗi ${nebInterval} phút trong giờ đầu${deviceSuffix}`
        ),
        title: 'Phối hợp sớm Ipratropium bromide cho cơn hen cấp mức độ trung bình – nặng trước chuyển viện',
        rationale:
          'Theo GINA 2026 (Chứng cứ A) và Bộ Y tế QĐ 1851/2020, phối hợp Ipratropium bromide cùng SABA ngay trong giờ đầu cho cơn hen cấp từ mức độ trung bình đến nặng giúp cải thiện FEV₁/PEF nhanh hơn và giảm đáng kể tỷ lệ phải nhập viện.',
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
    id: 'asthma.acute.outpatient_pretransfer_steroid',
    setting: 'outpatient',
    nameVi: 'Dùng ngay Corticosteroid toàn thân trong giờ đầu cho cơn hen cấp tại tuyến ban đầu',
    citationIds: [
      'gina.asthma.2026.acute_primary_care_transfer',
      'gina.asthma.2026.acute_prednisolone_daily',
      'byt.asthma.2021.acute_iv_steroid_ipratropium'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere || acute.hasMinVitals);
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const predMin = thFor('dose_mg', 'asthma.acute.prednisolone_dose_min');
      const predMax = thFor('dose_mg', 'asthma.acute.prednisolone_dose_max');
      const mpDose = thFor('dose_mg', 'asthma.acute.methylprednisolone_iv_mg');
      const useIv =
        acute.isLifeThreatening ||
        (isAllergicToDrug(ctx, 'prednisolone') && !isAllergicToDrug(ctx, 'methylprednisolone'));
      const steroidId = useIv ? 'methylprednisolone' : 'prednisolone';
      const steroidAction = resolveAcuteMedAction(ctx, steroidId);

      return {
        id: 'rec_asthma_outpatient_acute_steroid',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị cấp cứu
        priority: 96, // qa-allow: index - độ ưu tiên corticoid toàn thân giờ vàng
        action: steroidAction,
        drugId: steroidId,
        dose: useIv
          ? asDose(`Tiêm tĩnh mạch ngay ${mpDose} mg trước khi chuyển viện`)
          : asDose(
              `Uống ngay ${predMin}–${predMax} mg (hoặc tiêm tĩnh mạch Methylprednisolone ${mpDose} mg nếu khó thở nặng không nuốt được)`
            ),
        title: `Cho ngay Corticosteroid toàn thân trong giờ đầu (${useIv ? 'Methylprednisolone TM' : 'Prednisolone uống'}) trước chuyển Cấp cứu`,
        rationale:
          'Theo GINA 2026 (Box 9-3, Chứng cứ A), Corticosteroid đường toàn thân cần cho sớm ngay trong 1 giờ đầu tại tuyến ban đầu cho mọi cơn hen cấp để ngăn chặn tái phát và giảm tỷ lệ tử vong.',
        gates: [],
        citationIds: [
          'gina.asthma.2026.acute_primary_care_transfer',
          'gina.asthma.2026.acute_prednisolone_daily',
          'byt.asthma.2021.acute_iv_steroid_ipratropium'
        ]
      };
    }
  })
];
