/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Xử lý Chuyển đổi Insulin Dùng tại Nhà khi Nhập viện & Theo dõi K+ Nội viện
 * Phân quyền: Agent F4
 */

import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  LONG_ACTING_BASAL_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  hasDm2Context,
  hasDrugAllergy,
  isActivelyHypoglycemic,
  isFdcMed,
  isIcuSetting,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  resolveCanonicalDrugIds,
  resolveDrugNameVi,
  resolveTargetRecDrug
} from './helpers';

function isUsingSabaOrSteroid(ctx: RuleContext): boolean {
  if (Boolean(ctx.patient.customInputs?.onSteroidTherapy)) return true;
  const shiftDrugIds = [
    'salbutamol',
    'albuterol',
    'terbutaline',
    'fenoterol',
    'prednisolone',
    'prednisone',
    'methylprednisolone',
    'hydrocortisone',
    'dexamethasone'
  ];
  return ctx.patient.currentMeds.some((m) => {
    const resolved = resolveCanonicalDrugIds(m.drugId, m.name);
    const text = `${m.drugId} ${m.name || ''}`.toLowerCase();
    return (
      resolved.some((id) => shiftDrugIds.includes(id)) ||
      shiftDrugIds.some((tok) => text.includes(tok))
    );
  });
}

export const dm2InpatientHomeInsulinRules: Rule[] = [
  // 1. NGỪNG INSULIN TRỘN SẴN (PREMIX) DÙNG TẠI NHÀ KHI NHẬP VIỆN ĐỂ CHUYỂN SANG BASAL-BOLUS / BASAL-PLUS (DM2-R3-R1-03, P06, S29, S73)
  {
    id: 'dm2.inpatient.stop_home_premix',
    module: 'dm2',
    nameVi: 'Ngừng Insulin trộn sẵn (Premixed insulin) dùng tại nhà khi nhập viện nội trú',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      !isActivelyHypoglycemic(ctx) &&
      !hasDrugAllergy(ctx, 'insulin_premix') &&
      isTakingCanonical(ctx, 'insulin_premix'),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'insulin_premix');
      const target = resolveTargetRecDrug('insulin_premix', med);
      const convPct = thFor('percentage', 'dm2.inpatient.home_insulin_conversion_pct');
      return {
        id: 'rec_dm2_inpatient_stop_home_premix',
        module: 'dm2',
        tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} nội viện – Chuyển đổi sang phác đồ Basal–Bolus / Basal–Plus sinh lý`,
        rationale:
          `ADA 2026 Ch. 16 & QĐ 1353/QĐ-BYT: Không khuyến cáo tiếp tục insulin trộn sẵn (${target.drugNameVi}) trong bệnh viện do tỷ lệ hạ đường huyết nội viện cao gấp nhiều lần khi ăn uống thay đổi hoặc làm thủ thuật. Bắt buộc ngừng ${target.drugNameVi} và chuyển sang Insulin nền tác dụng dài + Insulin nhanh (tổng liều khởi đầu quy đổi thận trọng ~${convPct}% tổng liều tại nhà hoặc giảm hơn nếu ăn kém/đường huyết thấp).`,
        gates: [],
        citationIds: ['ada.dm2.2026.inpatient_premix_avoid', 'byt.dm2.2021.inpatient_insulin_1353'],
        priority: 97
      };
    },
    citationIds: ['ada.dm2.2026.inpatient_premix_avoid', 'byt.dm2.2021.inpatient_insulin_1353']
  },

  // 2. NGỪNG INSULIN NPH TẠI NHÀ KHI CHUYỂN ĐỔI SANG INSULIN GLARGINE NỘI VIỆN (TRỪ KHI ĐANG DÙNG STEROID HOẶC MANG THAI - P07, S32)
  {
    id: 'dm2.inpatient.stop_home_nph_transition',
    module: 'dm2',
    nameVi: 'Ngừng Insulin NPH dùng tại nhà khi chuyển đổi sang Insulin Glargine nội viện (tránh trùng lặp 2 insulin nền)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, 'insulin_nph')) return false;
      if (Boolean(ctx.patient.customInputs?.onSteroidTherapy)) return false;
      if (LONG_ACTING_BASAL_IDS.some((id) => isTakingCanonical(ctx, id))) return false; // Đã xử lý bởi duplicate_basal_stop
      return isTakingCanonical(ctx, 'insulin_nph');
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'insulin_nph');
      const target = resolveTargetRecDrug('insulin_nph', med);
      const convPct = thFor('percentage', 'dm2.inpatient.home_insulin_conversion_pct');
      return {
        id: 'rec_dm2_inpatient_stop_home_nph',
        module: 'dm2',
        tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} dùng tại nhà khi chuyển sang Insulin Glargine nền nội viện`,
        rationale:
          `ADA 2026 Ch. 16 & QĐ 1353/QĐ-BYT: Khi chuyển sang phác đồ Basal–Bolus nội viện với analog nền tác dụng dài (Insulin Glargine) hoặc truyền insulin tĩnh mạch tại ICU/DKA, phải ngừng ${target.drugNameVi} cũ (quy đổi thận trọng ~${convPct}% tổng liều NPH ngày sang Glargine 1 lần/ngày) để tuyệt đối tránh tiêm trùng hai loại insulin nền gây hạ đường huyết nặng.`,
        gates: [],
        citationIds: ['ada.dm2.2026.inpatient_no_sliding_scale_alone', 'byt.dm2.2021.inpatient_insulin_1353'],
        priority: 96
      };
    },
    citationIds: ['ada.dm2.2026.inpatient_no_sliding_scale_alone', 'byt.dm2.2021.inpatient_insulin_1353']
  },

  // 3. TẠM HOÃN INSULIN NHANH BỮA ĂN (ASPART / LISPRO) KHI CHUYỂN SANG REGULAR MỖI 6 GIỜ QUA SONDE HOẶC BƠM TIÊM ĐIỆN ICU/DKA (P08)
  ...(['insulin_aspart', 'insulin_lispro'] as const).map((rapidId): Rule => ({
    id: `dm2.inpatient.hold_home_rapid_${rapidId}`,
    module: 'dm2',
    nameVi: `Tạm hoãn ${resolveDrugNameVi(rapidId)} dùng tại nhà khi nuôi ăn qua sonde (dùng Regular q6h) hoặc truyền insulin TM`,
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, rapidId)) return false;
      if (!isTakingCanonical(ctx, rapidId)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      const eating = ctx.patient.customInputs?.inpatientEating;
      return eating === 'tube_feeding' || isIcuSetting(ctx) || crisis.isConfirmedCrisis || crisis.isSuspectedUnconfirmed;
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, rapidId);
      const target = resolveTargetRecDrug(rapidId, med);
      const isTube = ctx.patient.customInputs?.inpatientEating === 'tube_feeding' && !isIcuSetting(ctx) && !evaluateHyperglycemicCrisis(ctx).isConfirmedCrisis;
      return {
        id: `rec_dm2_inpatient_hold_rapid_${rapidId}`,
        module: 'dm2',
        tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
        tierOrder: 0,
        action: 'HOLD',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: isTube
          ? `Tạm hoãn ${target.drugNameVi} theo bữa ăn khi chuyển sang Regular insulin mỗi 6 giờ nuôi ăn qua sonde`
          : `Tạm hoãn ${target.drugNameVi} tiêm dưới da trong giai đoạn điều trị tích cực / truyền insulin tĩnh mạch`,
        rationale: isTube
          ? `ADA 2026 Ch. 16: Khi người bệnh nuôi ăn qua ống thông sử dụng phác đồ Regular insulin mỗi 6 giờ, phải tạm hoãn y lệnh ${target.drugNameVi} tiêm trước 3 bữa ăn cũ để tránh chồng liều hai loại insulin dinh dưỡng.`
          : `ADA 2026 Ch. 16: Tạm hoãn các mũi insulin nhanh tiêm dưới da (${target.drugNameVi}) khi người bệnh nằm ICU hoặc đang xử trí DKA/HHS bằng truyền Regular insulin tĩnh mạch liên tục.`,
        gates: [],
        citationIds: ['ada.dm2.2026.tube_feeding_insulin', 'ada.dm2.2026.prandial_insulin_eating'],
        priority: 95
      };
    },
    citationIds: ['ada.dm2.2026.tube_feeding_insulin', 'ada.dm2.2026.prandial_insulin_eating']
  })),

  // 4. TẠM HOÃN INSULIN NỀN TÁC DỤNG DÀI TẠI NHÀ TRONG LÚC ĐANG TRUYỀN INSULIN TĨNH MẠCH CẤP CỨU DKA/HHS/ICU (KHỞI ĐỘNG LẠI GỐI ĐẦU 2–4 GIỜ)
  ...LONG_ACTING_BASAL_IDS.map((basalId): Rule => ({
    id: `dm2.inpatient.hold_home_basal_iv_${basalId}`,
    module: 'dm2',
    nameVi: `Tạm hoãn ${resolveDrugNameVi(basalId)} trong giai đoạn cấp cứu truyền Regular insulin tĩnh mạch (gối đầu 2–4 giờ khi cai bơm)`,
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, basalId)) return false;
      const med = findActiveMedByCanonical(ctx, basalId);
      if (med && isFdcMed(med)) return false; // Đã được lệnh HOLD bút phối hợp GLP-1 bao phủ
      if (!isTakingCanonical(ctx, basalId)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isConfirmedCrisis) return true;
      if (isIcuSetting(ctx)) {
        const glucose = need(ctx, 'glucose');
        return glucose !== undefined && glucose >= thFor('glucose', 'dm2.glucose.icu_target_max_mmol');
      }
      return false;
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, basalId);
      const target = resolveTargetRecDrug(basalId, med);
      const overlapMin = thFor('duration_hours', 'dm2.dka.subq_overlap_min_hours');
      const overlapMax = thFor('duration_hours', 'dm2.dka.subq_overlap_max_hours');
      return {
        id: `rec_dm2_inpatient_hold_basal_iv_${basalId}`,
        module: 'dm2',
        tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
        tierOrder: 1,
        action: 'HOLD',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Tạm hoãn ${target.drugNameVi} khi đang truyền Regular insulin TM cấp cứu (Tiêm lại gối đầu ${overlapMin}–${overlapMax} giờ trước khi ngừng bơm)`,
        rationale:
          `Đồng thuận Quốc tế 2024 & ADA 2026 Ch. 16: Tạm hoãn cử ${target.drugNameVi} thường quy tại nhà trong giai đoạn đầu hồi sức truyền Regular insulin tĩnh mạch liên tục; bắt buộc tiêm dưới da lại ${target.drugNameVi} gối đầu ${overlapMin}–${overlapMax} giờ trước khi tắt bơm tiêm điện để phòng dội ngược tăng đường huyết/tái phát DKA.`,
        gates: [],
        citationIds: ['ada.dm2.2024.dka_subq_transition', 'ada.dm2.2026.icu_insulin_threshold_180'],
        priority: 94
      };
    },
    citationIds: ['ada.dm2.2024.dka_subq_transition', 'ada.dm2.2026.icu_insulin_threshold_180']
  })),

  // 5. THEO DÕI SÁT KALI MÁU KHI DÙNG ĐỒNG THỜI INSULIN NỘI VIỆN + CORTICOID / KHÍ DUNG SABA (DM2-R3-R3-15, S72)
  {
    id: 'dm2.inpatient.monitor_k_insulin_steroid_saba',
    module: 'dm2',
    nameVi: 'Theo dõi sát điện giải đồ (Kali máu) khi phối hợp Insulin nội viện với Corticoid toàn thân và/hoặc thuốc giãn phế quản SABA',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isConfirmedCrisis) return false;
      if (!isUsingSabaOrSteroid(ctx)) return false;
      const glucose = need(ctx, 'glucose');
      const willReceiveInsulin =
        isTakingAnyCanonical(ctx, ALL_INSULIN_IDS) ||
        (glucose !== undefined && glucose >= thFor('glucose', 'dm2.glucose.icu_target_min_mmol'));
      if (!willReceiveInsulin) return false;
      const k = need(ctx, 'k');
      return k === undefined || k < thFor('k', 'dm2.dka.k_maintenance_threshold');
    },
    produce: (ctx) => {
      const k = need(ctx, 'k');
      const kHold = thFor('k', 'dm2.dka.k_hold_insulin');
      const kMaint = thFor('k', 'dm2.dka.k_maintenance_threshold');
      const isLowOrBorderline = k === undefined || k <= kHold + 0.5; // qa-allow: unit-conversion - Ngưỡng kali cận thấp <= 4.0 mmol/L khi cộng hợp 3 thuốc hạ kali
      return {
        id: 'rec_dm2_inpatient_k_shift_monitor',
        module: 'dm2',
        tier: 'Theo dõi An toàn Điện giải Nội viện',
        tierOrder: 1,
        action: 'MONITOR',
        title: isLowOrBorderline
          ? `CẢNH BÁO HẠ KALI MÁU CỘNG GỘP (${k !== undefined ? `K⁺ = ${k.toFixed(1)} mmol/L` : 'Chưa có K⁺'}): Theo dõi điện giải & bù Kali khi dùng Insulin + Corticoid/SABA`
          : `Theo dõi định kỳ Kali máu (hiện K⁺ = ${k!.toFixed(1)} mmol/L) khi phối hợp Insulin + Corticoid/SABA`,
        rationale:
          `Cảnh báo an toàn liên chuyên khoa: Phối hợp đồng thời Insulin với Corticosteroid toàn thân (tăng thải K⁺ qua thận) và/hoặc thuốc cường beta-2 khí dung liều cao (Salbutamol/Terbutaline đẩy K⁺ vào nội bào cùng chiều với Insulin) làm tăng mạnh nguy cơ hạ kali máu cấp và loạn nhịp tim. Cần kiểm tra điện giải đồ định kỳ và bù kali chủ động để giữ K⁺ an toàn (tránh tụt < ${kHold.toFixed(1)} mmol/L; mục tiêu ổn định khoảng 4–${kMaint.toFixed(0)} mmol/L).`,
        gates: [],
        warnings: isLowOrBorderline
          ? [
              `Nguy cơ hạ kali máu cộng hợp (Insulin + Steroid/SABA${k !== undefined ? `, K⁺ hiện tại ${k.toFixed(1)} mmol/L` : ''}): Bù kali sớm và theo dõi điện tâm đồ/điện giải sát!`
            ]
          : undefined,
        citationIds: ['ada.dm2.2024.dka_potassium_hold_insulin', 'ada.dm2.2024.dka_potassium_maintenance'],
        priority: isLowOrBorderline ? 96 : 86
      };
    },
    citationIds: ['ada.dm2.2024.dka_potassium_hold_insulin', 'ada.dm2.2024.dka_potassium_maintenance']
  }
];
