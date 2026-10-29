/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Phân tầng Dự phòng Statin & Liệu pháp Kháng tiểu cầu ASCVD
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasHf,
  hasHighBleedingRisk,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnAnticoagulant,
  isPregnant,
  resolveCanonicalDrugIds,
  resolveElderlyStatus
} from './helpers';

const ANTIPLATELET_IDS = ['aspirin', 'clopidogrel', 'ticagrelor', 'prasugrel'] as const;

function hasActiveAntiplatelet(ctx: Parameters<typeof hasDm2Context>[0]): boolean {
  return ctx.patient.currentMeds.some((m) =>
    resolveCanonicalDrugIds(m.drugId, m.name).some((id) =>
      (ANTIPLATELET_IDS as readonly string[]).includes(id)
    )
  );
}

export const dm2StatinAndAspirinRules: Rule[] = [
  // 1. DỰ PHÒNG STATIN PHÂN TẦNG THEO ASCVD, ĐỘ TUỔI (> 75 TUỔI / TIME-TO-BENEFIT) & KỲ VỌNG SỐNG
  {
    id: 'dm2.outpatient.statin_prevention',
    module: 'dm2',
    nameVi: 'Phân tầng liệu pháp Statin kiểm soát lipid máu trên bệnh nhân ĐTĐ típ 2',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (ctx.patient.selectedModules.includes('lipid')) return false;
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
      return true;
    },
    produce: (ctx) => {
      const age = need(ctx, 'age');
      const minPrimaryAge = thFor('age', 'dm2.statin.primary_age_min');
      const olderPrimaryCap = thFor('age', 'dm2.elderly.high_risk_age');
      const statinIds = ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pitavastatin', 'pravastatin'];
      const onStatin = ctx.patient.currentMeds.some((m) =>
        resolveCanonicalDrugIds(m.drugId, m.name).some((id) => statinIds.includes(id))
      );

      if (hasAscvd(ctx)) {
        return {
          id: 'rec_dm2_statin_prevention',
          module: 'dm2',
          tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
          tierOrder: 5,
          action: onStatin ? 'CONTINUE' : 'CONSIDER',
          title: onStatin
            ? 'Tiếp tục duy trì Statin cường độ cao dự phòng thứ phát ASCVD'
            : 'Chỉ định Statin cường độ cao dự phòng thứ phát biến cố xơ vữa (Phối hợp đánh giá cùng module Lipid)',
          rationale:
            'ADA 2026 Ch. 10 (Khuyến cáo 10.26): Bệnh nhân ĐTĐ mọi lứa tuổi có bệnh tim mạch do xơ vữa (ASCVD) cần điều trị Statin cường độ cao (Atorvastatin hoặc Rosuvastatin) để hạ tích cực LDL-C.',
          gates: [],
          citationIds: ['ada.dm2.2026.statin_secondary_all_ages', 'ada.dm2.2026.statin_secondary'],
          priority: 74
        };
      }

      if (age !== undefined && age > olderPrimaryCap) {
        if (onStatin) {
          return {
            id: 'rec_dm2_statin_prevention',
            module: 'dm2',
            tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
            tierOrder: 5,
            action: 'CONTINUE',
            title: `Tiếp tục duy trì Statin dự phòng tiên phát đang dung nạp ở người bệnh trên ${olderPrimaryCap} tuổi`,
            rationale:
              `ADA 2026 Ch. 10 & Ch. 13: Ở người lớn tuổi trên ${olderPrimaryCap} tuổi chưa có ASCVD nhưng đã đang dung nạp tốt Statin, hợp lý để tiếp tục duy trì điều trị dự phòng biến cố mạch máu.`,
            gates: [],
            citationIds: ['ada.dm2.2026.elderly_age_75'],
            priority: 73
          };
        }

        if (resolveElderlyStatus(ctx) === 'very_complex') {
          return {
            id: 'rec_dm2_statin_prevention',
            module: 'dm2',
            tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
            tierOrder: 5,
            action: 'DEFER',
            title: `Trì hoãn khởi mới Statin dự phòng tiên phát ở người trên ${olderPrimaryCap} tuổi suy yếu nặng / kỳ vọng sống hạn chế`,
            rationale:
              `ADA 2026 Ch. 13: Hiệu quả dự phòng tiên phát của Statin cần thời gian tích lũy lợi ích tối thiểu khoảng 2.5 năm; ở người bệnh trên ${olderPrimaryCap} tuổi có sức khỏe rất phức tạp hoặc kỳ vọng sống hạn chế chưa có ASCVD, ưu tiên tránh đa dược học và biến cố bất lợi trên cơ.`,
            gates: [],
            citationIds: ['ada.dm2.2026.statin_time_to_benefit_2_5y', 'ada.dm2.2026.elderly_age_75'],
            priority: 70
          };
        }

        return {
          id: 'rec_dm2_statin_prevention',
          module: 'dm2',
          tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
          tierOrder: 5,
          action: 'CONSIDER',
          title: `Cân nhắc cá thể hóa Statin cường độ trung bình dự phòng tiên phát cho người bệnh trên ${olderPrimaryCap} tuổi`,
          rationale:
            `ADA 2026 Ch. 10 & Ch. 13: Ở người bệnh ĐTĐ trên ${olderPrimaryCap} tuổi chưa có ASCVD có thể trạng bảo tồn, cân nhắc khởi trị Statin cường độ trung bình sau khi trao đổi lợi ích – nguy cơ và thời gian đạt lợi ích (khoảng 2.5 năm).`,
          gates: [],
          citationIds: ['ada.dm2.2026.elderly_age_75', 'ada.dm2.2026.statin_time_to_benefit_2_5y'],
          priority: 72
        };
      }

      if (age !== undefined && age < minPrimaryAge) {
        return {
          id: 'rec_dm2_statin_prevention',
          module: 'dm2',
          tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
          tierOrder: 5,
          action: onStatin ? 'CONTINUE' : hasCkd(ctx) ? 'CONSIDER' : 'MONITOR',
          title: `Người bệnh ĐTĐ dưới ${minPrimaryAge} tuổi chưa có ASCVD: Đánh giá yếu tố nguy cơ để cá thể hóa Statin`,
          rationale:
            'ADA 2026 Ch. 10 (Khuyến cáo 10.19): Ở người bệnh ĐTĐ trẻ tuổi chưa có ASCVD, cân nhắc khởi trị Statin nếu có thêm yếu tố nguy cơ tim mạch xơ vữa (bệnh thận mạn/albumin niệu, thời gian mắc ĐTĐ dài, tăng huyết áp, hút thuốc, rối loạn lipid máu).',
          gates: [],
          citationIds: ['ada.dm2.2026.statin_age_20_39'],
          priority: 70
        };
      }

      const highPrimaryRisk = hasCkd(ctx) || hasHf(ctx);
      return {
        id: 'rec_dm2_statin_prevention',
        module: 'dm2',
        tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
        tierOrder: 5,
        action: onStatin ? 'CONTINUE' : 'CONSIDER',
        title: highPrimaryRisk
          ? `Dự phòng tiên phát bằng Statin cường độ cao cho người bệnh ĐTĐ ${minPrimaryAge}–${olderPrimaryCap} tuổi nguy cơ cao`
          : `Dự phòng tiên phát bằng Statin cường độ trung bình – cao cho người bệnh ĐTĐ ${minPrimaryAge}–${olderPrimaryCap} tuổi`,
        rationale: highPrimaryRisk
          ? `ADA 2026 Ch. 10 (Khuyến cáo 10.20): Người bệnh ĐTĐ từ ${minPrimaryAge}–${olderPrimaryCap} tuổi chưa có ASCVD nhưng kèm bệnh thận mạn hoặc nhiều yếu tố nguy cơ tim mạch được khuyến cáo Statin cường độ cao để hạ LDL-C tối ưu.`
          : `ADA 2026 Ch. 10 (Khuyến cáo 10.18 & 10.20): Khuyến cáo thường quy Statin cường độ trung bình (hoặc cao nếu kèm thêm yếu tố nguy cơ) dự phòng tiên phát biến cố mạch vành và đột quỵ cho người bệnh ĐTĐ từ ${minPrimaryAge}–${olderPrimaryCap} tuổi.`,
        gates: [],
        citationIds: ['ada.dm2.2026.statin_primary_40_75', 'ada.dm2.2026.statin_primary_high_risk_40_75'],
        priority: 74
      };
    },
    citationIds: [
      'ada.dm2.2026.statin_secondary_all_ages',
      'ada.dm2.2026.statin_primary_40_75',
      'ada.dm2.2026.statin_primary_high_risk_40_75',
      'ada.dm2.2026.elderly_age_75',
      'ada.dm2.2026.statin_age_20_39'
    ]
  },

  // 2. ASPIRIN DỰ PHÒNG THỨ PHÁT ASCVD: KIỂM TRA KHÁNG ĐÔNG TRƯỚC KHÁNG TIỂU CẦU & PHÂN BIỆT RÕ KHỞI TRỊ VS DUY TRÌ
  {
    id: 'dm2.outpatient.aspirin_secondary',
    module: 'dm2',
    nameVi: 'Liệu pháp kháng tiểu cầu dự phòng thứ phát ở bệnh nhân ĐTĐ kèm ASCVD',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || !hasAscvd(ctx)) return false;
      if (isPregnant(ctx) || isActivelyHypoglycemic(ctx) || evaluateHyperglycemicCrisis(ctx).isCrisis) return false;
      const onOac = isOnAnticoagulant(ctx);
      const alreadyOnAntiplatelet = hasActiveAntiplatelet(ctx);
      const recentAcs = hasCondition(ctx, 'recentAcs');
      if (onOac && !recentAcs) {
        return alreadyOnAntiplatelet && !ctx.patient.selectedModules.includes('af');
      }
      if (hasHighBleedingRisk(ctx) && !recentAcs) return false;
      return true;
    },
    produce: (ctx) => {
      const minDose = thFor('dose_mg', 'dm2.aspirin.secondary_min_dose');
      const maxDose = thFor('dose_mg', 'dm2.aspirin.secondary_max_dose');
      const onOac = isOnAnticoagulant(ctx);
      const alreadyOnAntiplatelet = hasActiveAntiplatelet(ctx);

      if (onOac && !hasCondition(ctx, 'recentAcs')) {
        return {
          id: 'rec_dm2_stop_antiplatelet_on_oac',
          module: 'dm2',
          tier: 'Cảnh báo an toàn & Chống chỉ định',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: 'aspirin',
          drugNameVi: 'Aspirin / Kháng tiểu cầu',
          title: 'Cân nhắc ngừng kháng tiểu cầu (Aspirin/Clopidogrel) khi đã dùng thuốc chống đông đường uống ở bệnh mạch vành mạn ổn định',
          rationale:
            'ADA 2026 Ch. 10 & ESC AF/CCS: Ở bệnh nhân bệnh mạch vành mạn ổn định (không có hội chứng vành cấp/can thiệp stent gần đây) đã dùng thuốc chống đông đường uống đủ liều, không khuyến cáo duy trì thêm Aspirin thường quy do làm tăng gấp đôi nguy cơ xuất huyết nặng.',
          gates: [],
          citationIds: ['ada.dm2.2026.aspirin_bleeding_balance', 'ada.dm2.2026.aspirin_secondary'],
          priority: 82
        };
      }

      const useClopidogrel = ctx.patient.allergies?.some((a) => a.toLowerCase().includes('aspirin'));

      return {
        id: 'rec_dm2_aspirin_secondary',
        module: 'dm2',
        tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
        tierOrder: 5,
        action: alreadyOnAntiplatelet ? 'CONTINUE' : 'CONSIDER',
        dose: useClopidogrel ? 'Clopidogrel đơn trị hàng ngày' : `Aspirin ${minDose}–${maxDose} mg/ngày`,
        title: alreadyOnAntiplatelet
          ? `Tiếp tục duy trì kháng tiểu cầu dự phòng thứ phát ASCVD (${useClopidogrel ? 'Clopidogrel' : `Aspirin ${minDose}–${maxDose} mg/ngày`})`
          : `Khởi trị / Bổ sung kháng tiểu cầu dự phòng thứ phát ASCVD (${useClopidogrel ? 'Clopidogrel thay thế do dị ứng Aspirin' : `Aspirin ${minDose}–${maxDose} mg/ngày hoặc Clopidogrel nếu dị ứng Aspirin`})`,
        rationale:
          `ADA 2026 Ch. 10 (Khuyến cáo 10.33 & 10.35): Sử dụng Aspirin ${minDose}–${maxDose} mg/ngày (hoặc Clopidogrel đơn trị hàng ngày nếu dị ứng Aspirin) dự phòng thứ phát biến cố huyết khối ở người bệnh ĐTĐ có ASCVD sau khi loại trừ xuất huyết tiêu hóa hoặc phác đồ kháng đông đơn trị.`,
        gates: [],
        citationIds: ['ada.dm2.2026.aspirin_secondary', 'ada.dm2.2026.aspirin_bleeding_balance'],
        priority: 72
      };
    },
    citationIds: ['ada.dm2.2026.aspirin_secondary', 'ada.dm2.2026.aspirin_bleeding_balance']
  }
];
