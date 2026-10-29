/**
 * Quy tắc Chống chỉ định Tuyệt đối Chống đông [A] (Phần 1: Xuất huyết cấp, Thai kỳ, Cho con bú, Van cơ học/Hẹp hai lá/APS)
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { drug, thFor } from '../../kb-types/access';
import {
  ALL_ANTICOAG_IDS,
  DOAC_IDS,
  VKA_IDS,
  findCurrentMed,
  getCleanStartDose,
  getDrugDisplayNameVi,
  hasActiveMajorBleed,
  hasAps,
  hasCurrentMed,
  hasValvularAf,
  isAfActive,
  isAllergicToDrug
} from './rulesHelpers';

const TIER_A = 'AF-CARE · [A] Dự phòng đột quỵ';

const perDrugActiveBleedStopRules: Rule[] = ALL_ANTICOAG_IDS.map((antId) => ({
  id: `af.oac.bleed_stop_${antId}`,
  module: 'af',
  nameVi: `AF-CARE [A]: Ngừng khẩn cấp ${getDrugDisplayNameVi(antId)} khi đang xuất huyết nặng / xuất huyết nội sọ / giảm tiểu cầu nặng`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => isAfActive(ctx) && hasActiveMajorBleed(ctx) && hasCurrentMed(ctx, [antId]),
  produce: (ctx): Recommendation => {
    const med = findCurrentMed(ctx, [antId]);
    const nameVi = getDrugDisplayNameVi(antId, med);
    const isDabi = antId === 'dabigatran';
    const isXa = antId === 'apixaban' || antId === 'rivaroxaban' || antId === 'edoxaban';
    const isVka = antId === 'warfarin' || antId === 'acenocoumarol';
    const revNote = isDabi
      ? 'Hóa giải đặc hiệu ngay bằng Idarucizumab tĩnh mạch (hoặc PCC hoạt hóa nếu không sẵn có).'
      : isXa
      ? 'Cân nhắc hóa giải bằng Andexanet alfa hoặc phức hợp prothrombin 4 yếu tố (4F-PCC).'
      : isVka
      ? 'Hóa giải ngay bằng Vitamin K đường tĩnh mạch phối hợp phức hợp prothrombin 4 yếu tố (4F-PCC).'
      : 'Trung hòa bằng Protamine sulfate nếu đang dùng Heparin/Enoxaparin.';

    return {
      id: `rec_af_bleed_stop_${antId}`,
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'STOP',
      drugId: antId,
      drugNameVi: nameVi,
      dose: undefined,
      title: `DỪNG KHẨN CẤP ${nameVi}: Đang xuất huyết nặng / xuất huyết nội sọ hoặc giảm tiểu cầu nghiêm trọng`,
      rationale: `ESC 2024 (Section 6.5): Chống chỉ định tuyệt đối tiếp tục chống đông khi chảy máu hoạt động đe dọa tính mạng, xuất huyết nội sọ cấp hoặc tiểu cầu giảm nặng. ${revNote}`,
      gates: [{ parameter: 'Xuất huyết cấp / Tiểu cầu', passed: false, action: 'contra', messageVi: `Chống chỉ định ${nameVi}` }],
      citationIds: isDabi ? ['esc.af.2024.idarucizumab_reversal'] : ['esc.af.2024.andexanet_reversal'],
      priority: 108
    };
  },
  citationIds: ['esc.af.2024.idarucizumab_reversal', 'esc.af.2024.andexanet_reversal']
}));

const perDrugValvularOrApsDoacStopRules: Rule[] = DOAC_IDS.map((doacId) => ({
  id: `af.oac.valvular_aps_stop_${doacId}`,
  module: 'af',
  nameVi: `AF-CARE [A]: Ngừng khẩn cấp ${drug(doacId).nameVi} ở van cơ học, hẹp hai lá hoặc APS`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) =>
    isAfActive(ctx) &&
    !hasActiveMajorBleed(ctx) &&
    (hasValvularAf(ctx) || hasAps(ctx)) &&
    hasCurrentMed(ctx, [doacId]),
  produce: (ctx): Recommendation => {
    const isMech = hasCondition(ctx, 'mechanicalValve');
    const isMs = hasCondition(ctx, 'mitralStenosis');
    const reasonLabel = isMech
      ? 'Van tim cơ học (RE-ALIGN)'
      : isMs
      ? 'Hẹp van hai lá vừa–khít do thấp (INVICTUS)'
      : 'Hội chứng kháng phospholipid – APS (TRAPS)';
    const cids =
      isMech || isMs
        ? ['esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.vka_only_mechanical_mitral']
        : ['fda.apixaban.aps_not_recommended', 'esc.af.2024.doac_preferred_over_vka'];

    return {
      id: `rec_af_valvular_stop_${doacId}`,
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'STOP',
      drugId: doacId,
      drugNameVi: drug(doacId).nameVi,
      dose: undefined,
      title: `DỪNG NGAY ${drug(doacId).nameVi}: Chống chỉ định ở ${reasonLabel}`,
      rationale: `Khuyến cáo Class III (ESC 2024 / ACC 2023 / Nhãn FDA): Các thuốc DOAC làm tăng biến cố huyết khối tắc mạch và chảy máu ở bệnh nhân có ${reasonLabel}. Bắt buộc chuyển sang kháng Vitamin K (Warfarin hoặc Acenocoumarol).`,
      gates: [{ parameter: reasonLabel, passed: false, action: 'contra', messageVi: `Chống chỉ định ${drug(doacId).nameVi}` }],
      citationIds: cids,
      priority: 105
    };
  },
  citationIds: ['esc.af.2024.doac_preferred_over_vka', 'fda.apixaban.aps_not_recommended']
}));

const perDrugPregnancyStopRules: Rule[] = [...VKA_IDS, ...DOAC_IDS].map((oacId) => ({
  id: `af.oac.pregnancy_stop_${oacId}`,
  module: 'af',
  nameVi: `AF-CARE [A]: Ngừng ${drug(oacId).nameVi} trong thai kỳ`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!isAfActive(ctx) || hasActiveMajorBleed(ctx) || !hasCondition(ctx, 'pregnant')) return false;
    if (!hasCurrentMed(ctx, [oacId])) return false;
    const isVka = oacId === 'warfarin' || oacId === 'acenocoumarol';
    if (isVka && hasCondition(ctx, 'mechanicalValve')) return false;
    return true;
  },
  produce: (): Recommendation => ({
    id: `rec_af_pregnancy_stop_${oacId}`,
    module: 'af',
    tier: TIER_A,
    tierOrder: 2,
    action: 'STOP',
    drugId: oacId,
    drugNameVi: drug(oacId).nameVi,
    dose: undefined,
    title: `DỪNG NGAY ${drug(oacId).nameVi} trong thai kỳ: Chuyển sang Heparin trọng lượng phân tử thấp (LMWH)`,
    rationale:
      'Khuyến cáo Class III (ESC 2025 Pregnancy & ESC 2024 AF): Thuốc DOAC và kháng Vitamin K qua nhau thai gây quái thai và xuất huyết bào thai; chuyển sang LMWH liều điều trị ở thai phụ rung nhĩ không có van cơ học.',
    gates: [{ parameter: 'Thai kỳ', passed: false, action: 'contra', messageVi: `Chống chỉ định ${drug(oacId).nameVi}` }],
    citationIds: ['esc.preg.2025.doac_not_recommended', 'esc.af.2024.pregnancy_oac'],
    priority: 106
  }),
  citationIds: ['esc.preg.2025.doac_not_recommended', 'esc.af.2024.pregnancy_oac']
}));

const perDrugLactationStopDoacRules: Rule[] = DOAC_IDS.map((doacId) => ({
  id: `af.oac.lactation_stop_${doacId}`,
  module: 'af',
  nameVi: `AF-CARE [A]: Ngừng ${drug(doacId).nameVi} khi đang cho con bú`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) =>
    isAfActive(ctx) &&
    !hasActiveMajorBleed(ctx) &&
    !hasCondition(ctx, 'pregnant') &&
    hasCondition(ctx, 'breastfeeding') &&
    hasCurrentMed(ctx, [doacId]),
  produce: (): Recommendation => ({
    id: `rec_af_lactation_stop_${doacId}`,
    module: 'af',
    tier: TIER_A,
    tierOrder: 2,
    action: 'STOP',
    drugId: doacId,
    drugNameVi: drug(doacId).nameVi,
    dose: undefined,
    title: `Ngừng ${drug(doacId).nameVi} khi đang cho con bú: Chuyển sang Warfarin/Acenocoumarol hoặc LMWH`,
    rationale:
      'ESC 2025 Pregnancy & Lactation: Tránh DOAC trong thời kỳ cho con bú; thuốc kháng Vitamin K và LMWH không bài tiết dạng hoạt tính vào sữa mẹ và an toàn hậu sản.',
    gates: [{ parameter: 'Cho con bú', passed: false, action: 'contra', messageVi: `Tránh ${drug(doacId).nameVi} khi cho con bú` }],
    citationIds: ['esc.preg.2025.doac_lactation', 'esc.preg.2025.vka_lactation'],
    priority: 103
  }),
  citationIds: ['esc.preg.2025.doac_lactation', 'esc.preg.2025.vka_lactation']
}));

export const afOacContraRules: Rule[] = [
  ...perDrugActiveBleedStopRules,
  ...perDrugValvularOrApsDoacStopRules,
  ...perDrugPregnancyStopRules,
  ...perDrugLactationStopDoacRules,

  {
    id: 'af.oac.active_bleed_avoid',
    module: 'af',
    nameVi: 'AF-CARE [A]: Chống chỉ định khởi trị thuốc chống đông khi đang xuất huyết hoạt động',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && hasActiveMajorBleed(ctx) && !hasCurrentMed(ctx, ALL_ANTICOAG_IDS),
    produce: (): Recommendation => ({
      id: 'rec_af_active_bleed_avoid_oac',
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'AVOID',
      dose: undefined,
      title: 'Chống chỉ định thuốc chống đông khi đang xuất huyết nặng, xuất huyết nội sọ cấp hoặc giảm tiểu cầu nặng',
      rationale:
        'ESC 2024 (Section 6.5): Ưu tiên cầm máu, hồi sức huyết động và xử trí nguyên nhân chảy máu; chỉ đánh giá khởi trị lại chống đông hoặc bít tiểu nhĩ trái sau khi xuất huyết đã kiểm soát.',
      gates: [{ parameter: 'Xuất huyết hoạt động', passed: false, action: 'contra', messageVi: 'Chống chỉ định chống đông' }],
      citationIds: ['esc.af.2024.idarucizumab_reversal', 'esc.af.2024.andexanet_reversal'],
      priority: 107
    }),
    citationIds: ['esc.af.2024.idarucizumab_reversal', 'esc.af.2024.andexanet_reversal']
  },

  {
    id: 'af.oac.pregnancy_mechanical_valve_team',
    module: 'af',
    nameVi: 'AF-CARE [A]: Chuyển khẩn Đội nhóm Tim mạch – Sản khoa (Pregnancy Heart Team) cho thai phụ mang van cơ học',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasActiveMajorBleed(ctx) &&
      hasCondition(ctx, 'pregnant') &&
      hasCondition(ctx, 'mechanicalValve'),
    produce: (): Recommendation => ({
      id: 'rec_af_pregnancy_mhv_heart_team',
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'REFER',
      dose: undefined,
      title: 'CHUYỂN KHẨN ĐỘI NHÓM TIM MẠCH – SẢN KHOA (Pregnancy Heart Team): Thai phụ mang van tim cơ học',
      rationale:
        'Khuyến cáo Class I (ESC 2025 Pregnancy): Thai phụ mang van cơ học có nguy cơ kẹt van huyết khối tử vong rất cao; TUYỆT ĐỐI KHÔNG tự ý ngừng đột ngột kháng Vitamin K ngoại trú khi chưa bắc cầu nội viện có định lượng anti-Xa chặt chẽ, và cấm tuyệt đối mọi DOAC.',
      gates: [{ parameter: 'Thai kỳ + Van cơ học', passed: false, action: 'contra', messageVi: 'Quản lý nội viện tại Pregnancy Heart Team' }],
      citationIds: ['esc.preg.2025.mhv_pregnancy_heart_team', 'esc.preg.2025.doac_not_recommended'],
      priority: 107
    }),
    citationIds: ['esc.preg.2025.mhv_pregnancy_heart_team', 'esc.preg.2025.doac_not_recommended']
  },

  {
    id: 'af.oac.pregnancy_safety',
    module: 'af',
    nameVi: 'AF-CARE [A]: Tránh DOAC/VKA trong thai kỳ (ưu tiên LMWH liều điều trị)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasActiveMajorBleed(ctx) &&
      hasCondition(ctx, 'pregnant') &&
      !hasCondition(ctx, 'mechanicalValve') &&
      !hasCurrentMed(ctx, [...VKA_IDS, ...DOAC_IDS]),
    produce: (): Recommendation => ({
      id: 'rec_af_pregnancy_oac_contra',
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'AVOID',
      dose: undefined,
      title: 'Thai kỳ: Chống chỉ định tuyệt đối mọi thuốc DOAC; ưu tiên Heparin trọng lượng phân tử thấp (LMWH) nếu cần chống đông',
      rationale:
        'Khuyến cáo Class I & Class III (ESC 2024 AF & ESC 2025 Pregnancy): Không dùng DOAC trong suốt thai kỳ; nếu thai phụ có nguy cơ huyết khối cao, chỉ định Enoxaparin liều điều trị dưới giám sát chuyên khoa.',
      gates: [{ parameter: 'Thai kỳ', passed: false, action: 'contra', messageVi: 'Chống chỉ định DOAC trong thai kỳ' }],
      citationIds: ['esc.af.2024.pregnancy_oac', 'esc.preg.2025.doac_not_recommended'],
      priority: 104
    }),
    citationIds: ['esc.af.2024.pregnancy_oac', 'esc.preg.2025.doac_not_recommended']
  },

  {
    id: 'af.oac.lactation_vka',
    module: 'af',
    nameVi: 'AF-CARE [A]: Chống đông an toàn thời kỳ cho con bú bằng kháng Vitamin K',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasActiveMajorBleed(ctx) &&
      !hasCondition(ctx, 'pregnant') &&
      hasCondition(ctx, 'breastfeeding') &&
      !hasValvularAf(ctx) &&
      !hasAps(ctx),
    produce: (ctx): Recommendation | null => {
      const activeVka = findCurrentMed(ctx, VKA_IDS);
      const activeDoac = findCurrentMed(ctx, DOAC_IDS);
      const chosenVka = activeVka ? activeVka.drugId.toLowerCase() : isAllergicToDrug(ctx, 'warfarin') ? 'acenocoumarol' : 'warfarin';
      if (isAllergicToDrug(ctx, chosenVka)) return null;
      const inrMin = thFor('inr', 'af.vka.target_inr_min').toFixed(1);
      const inrMax = thFor('inr', 'af.vka.target_inr_max').toFixed(1);

      return {
        id: activeVka ? 'rec_af_lactation_vka_continue' : activeDoac ? 'rec_af_lactation_switch_to_vka' : 'rec_af_lactation_start_vka',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: activeVka ? 'CONTINUE' : activeDoac ? 'SWITCH' : 'START',
        drugId: chosenVka,
        drugNameVi: drug(chosenVka).nameVi,
        switchFrom: activeDoac ? activeDoac.drugId.toLowerCase() : undefined,
        dose: `${getCleanStartDose(chosenVka)} — mục tiêu INR ${inrMin}–${inrMax}`,
        title: `${activeVka ? 'Duy trì' : activeDoac ? 'Chuyển sang' : 'Khởi trị'} ${drug(chosenVka).nameVi} (Tương thích thời kỳ cho con bú, tránh DOAC)`,
        rationale: 'ESC 2025 Pregnancy & Lactation: Thuốc kháng Vitamin K không bài tiết dạng hoạt tính vào sữa mẹ và an toàn cho trẻ bú mẹ, trong khi DOAC bị chống chỉ định khi cho con bú.',
        gates: [],
        citationIds: ['esc.preg.2025.vka_lactation', 'esc.preg.2025.doac_lactation', 'esc.af.2024.vka_target_inr'],
        priority: 98
      };
    },
    citationIds: ['esc.preg.2025.vka_lactation', 'esc.preg.2025.doac_lactation']
  },

  {
    id: 'af.oac.valvular_vka',
    module: 'af',
    nameVi: 'AF-CARE [A]: Bắt buộc kháng Vitamin K (Warfarin/Acenocoumarol) ở van cơ học, hẹp van hai lá hoặc APS',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasActiveMajorBleed(ctx) &&
      !hasCondition(ctx, 'pregnant') &&
      (hasValvularAf(ctx) || hasAps(ctx)),
    produce: (ctx): Recommendation | null => {
      const procRisk = String(ctx.patient.customInputs?.plannedProcedureRisk ?? '');
      const activeVka = findCurrentMed(ctx, VKA_IDS);
      if (activeVka && ['low', 'low_risk', 'high', 'high_risk'].includes(procRisk)) return null;

      const chosenVka = activeVka
        ? activeVka.drugId.toLowerCase()
        : isAllergicToDrug(ctx, 'warfarin') && !isAllergicToDrug(ctx, 'acenocoumarol')
        ? 'acenocoumarol'
        : 'warfarin';
      const inrMin = thFor('inr', 'af.vka.target_inr_min').toFixed(1);
      const inrMax = thFor('inr', 'af.vka.target_inr_max').toFixed(1);
      const isMech = hasCondition(ctx, 'mechanicalValve');
      const isMs = hasCondition(ctx, 'mitralStenosis');
      const label = isMech ? 'Van tim cơ học' : isMs ? 'Hẹp van hai lá vừa–khít' : 'Hội chứng kháng phospholipid (APS)';
      const inrNote = isMech ? `theo loại và vị trí van cơ học (van hai lá cơ học thường cần INR cao hơn ${inrMin}–${inrMax})` : `INR ${inrMin}–${inrMax}`;

      return {
        id: 'rec_af_valvular_vka',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: activeVka ? 'CONTINUE' : 'START',
        drugId: chosenVka,
        drugNameVi: drug(chosenVka).nameVi,
        dose: `${getCleanStartDose(chosenVka)} — chỉnh liều đạt mục tiêu ${inrNote}`,
        title: `${activeVka ? 'Duy trì' : 'Khởi trị'} ${drug(chosenVka).nameVi} (${label}: Bắt buộc kháng Vitamin K, cấm mọi DOAC)`,
        rationale: `Khuyến cáo Class I (ESC 2024 / ACC 2023): Bệnh nhân rung nhĩ có ${label} bắt buộc điều trị bằng kháng Vitamin K theo dõi sát INR; tuyệt đối không dùng bất kỳ DOAC nào.`,
        gates: [{ parameter: label, passed: true, messageVi: `Chỉ định bắt buộc ${drug(chosenVka).nameVi}` }],
        citationIds:
          isMech || isMs
            ? ['esc.af.2024.vka_only_mechanical_mitral', 'esc.af.2024.doac_preferred_over_vka', 'esc.af.2024.vka_target_inr']
            : ['fda.apixaban.aps_not_recommended', 'esc.af.2024.vka_target_inr'],
        priority: 100,
        profileDiff: {
          VN: `Tại Việt Nam: Acenocoumarol (Sintrom) được sử dụng rộng rãi tương đương Warfarin; chỉnh liều cá thể hóa giữ mục tiêu ${inrNote}.`
        }
      };
    },
    citationIds: ['esc.af.2024.vka_only_mechanical_mitral', 'esc.af.2024.doac_preferred_over_vka']
  }
];
