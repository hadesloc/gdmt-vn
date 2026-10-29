/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Phù phổi Cấp Huyết động do Tim
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import {
  th,
  thFor,
  drug,
  dose,
  fmtDose
} from '../../kb-types';
import {
  BB_IDS,
  getMedIds,
  hasPde5i,
  isSevereAorticStenosis
} from './helpers';

export const htnInpatientPulmEdemaRules: Rule[] = [
  {
    id: 'htn.inpatient.pulmonary_edema',
    module: 'htn',
    nameVi: 'Cấp cứu Phù phổi cấp huyết động do tim: Giãn mạch tĩnh mạch giảm tiền tải và hậu tải',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'acutePulmonaryEdema') &&
      !hasCondition(ctx, 'severePreeclampsiaEclampsia') &&
      !hasCondition(ctx, 'acuteAcsWithin24h'),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'xử trí cấp cứu phù phổi cấp do tăng huyết áp', [
          'vsh.htn.2022.emergency_pulmonary_edema'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpTarget = thFor('sbp', 'htn.emergency.pulmonary_edema_sbp');
      const ntgName = drug('nitroglycerin').nameVi;
      const ntgDose = dose('nitroglycerin', 'start');

      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_emergency_pulmonary_edema',
          module: 'htn',
          tier: 'Phù phổi cấp (Cảnh báo Sốc tim)',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'nitroglycerin',
          drugNameVi: ntgName,
          title: `TẠM HOÃN ${ntgName} do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg) — Xử trí phác đồ Sốc tim`,
          rationale: `SBP ${sbp} mmHg (< ${sbpHypo} mmHg) trong phù phổi cấp là dấu hiệu sốc tim; chống chỉ định thuốc giãn mạch đơn thuần.`,
          gates: [],
          citationIds: ['aha.acc.2025.iv_nitroglycerin', 'vsh.htn.2022.emergency_pulmonary_edema'],
          priority: 100
        };
      }

      if (hasPde5i(ctx)) {
        return {
          id: 'rec_htn_emergency_pulmonary_edema',
          module: 'htn',
          tier: 'Phù phổi cấp (Chống chỉ định PDE-5i)',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'nitroglycerin',
          drugNameVi: ntgName,
          title: `CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI ${ntgName} do đang dùng thuốc ức chế PDE-5 (Sildenafil/Tadalafil/Vardenafil)`,
          rationale:
            'Phối hợp Nitroglycerin với thuốc ức chế PDE-5 gây tụt huyết áp sâu đe dọa tính mạng. Bắt buộc chuyển sang Urapidil hoặc Clevidipine/Nicardipine đường tĩnh mạch.',
          gates: [
            {
              parameter: 'Thuốc ức chế PDE-5',
              passed: false,
              messageVi: 'Đang dùng PDE-5i: Cấm tuyệt đối Nitroglycerin tĩnh mạch'
            }
          ],
          citationIds: ['aha.acc.2025.iv_nitroglycerin', 'vsh.htn.2022.emergency_pulmonary_edema'],
          priority: 100
        };
      }

      if (sbp < sbpTarget) {
        return {
          id: 'rec_htn_emergency_pulmonary_edema',
          module: 'htn',
          tier: 'Phù phổi cấp do tim',
          tierOrder: 1,
          action: 'MONITOR',
          drugId: 'nitroglycerin',
          drugNameVi: ntgName,
          title: `Theo dõi sát huyết động trong Phù phổi cấp (SBP hiện tại ${sbp} < ${sbpTarget} mmHg)`,
          rationale: `Huyết áp tâm thu đã giảm dưới ${sbpTarget} mmHg; điều chỉnh tốc độ truyền giãn mạch thận trọng để tránh tụt áp giảm tưới máu thận và vành.`,
          gates: [],
          citationIds: ['vsh.htn.2022.emergency_pulmonary_edema', 'aha.acc.2025.iv_nitroglycerin'],
          priority: 88
        };
      }

      return {
        id: 'rec_htn_emergency_pulmonary_edema',
        module: 'htn',
        tier: 'Cấp cứu Phù phổi cấp do tim',
        tierOrder: 0,
        action: 'START',
        drugId: 'nitroglycerin',
        drugNameVi: ntgName,
        dose: fmtDose(ntgDose),
        title: `Hạ áp ngay lập tức trong Phù phổi cấp: Đích SBP < ${sbpTarget} mmHg bằng ${ntgName} tĩnh mạch`,
        rationale: `Khuyến cáo loại I (ESC 2024 / AHA/ACC 2025 / VSH 2022): Khi phù phổi cấp do tim kèm tăng huyết áp (SBP ${sbp} ≥ ${sbpTarget} mmHg), truyền tĩnh mạch ngay ${ntgName} để giảm nhanh tiền tải và hậu tải thất trái, đưa SBP về < ${sbpTarget} mmHg kết hợp lợi tiểu quai tĩnh mạch.`,
        gates: [],
        citationIds: ['vsh.htn.2022.emergency_pulmonary_edema', 'aha.acc.2025.iv_nitroglycerin'],
        priority: 99
      };
    },
    citationIds: ['vsh.htn.2022.emergency_pulmonary_edema', 'aha.acc.2025.iv_nitroglycerin']
  },

  {
    id: 'htn.inpatient.pulmonary_edema_alt_vasodilator',
    module: 'htn',
    nameVi: 'Phù phổi cấp có dùng PDE-5i: Giãn mạch tĩnh mạch thay thế (Urapidil / Nicardipine)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!hasCondition(ctx, 'acutePulmonaryEdema') || hasCondition(ctx, 'severePreeclampsiaEclampsia')) return false;
      if (!hasPde5i(ctx)) return false;
      const sbp = need(ctx, 'sbp');
      const sbpTarget = thFor('sbp', 'htn.emergency.pulmonary_edema_sbp');
      return sbp !== undefined && sbp >= sbpTarget;
    },
    produce: (ctx: RuleContext): Recommendation => {
      const sbpTarget = thFor('sbp', 'htn.emergency.pulmonary_edema_sbp');
      const altId = isSevereAorticStenosis(ctx) ? 'urapidil' : 'nicardipine';
      const altName = drug(altId).nameVi;
      const altDose = dose(altId, 'start');

      return {
        id: 'rec_htn_pulmonary_edema_alt_vasodilator',
        module: 'htn',
        tier: 'Cấp cứu Phù phổi cấp (Thay thế Nitroglycerin)',
        tierOrder: 0,
        action: 'START',
        drugId: altId,
        drugNameVi: altName,
        dose: fmtDose(altDose),
        title: `Truyền ${altName} hạ hậu tải cấp cứu trong Phù phổi cấp (thay Nitroglycerin): Đích SBP < ${sbpTarget} mmHg`,
        rationale: `Do chống chỉ định Nitroglycerin vì thuốc ức chế PDE-5, bắt buộc truyền tĩnh mạch ${altName} qua bơm tiêm điện để giảm hậu tải cấp cứu, đưa SBP về < ${sbpTarget} mmHg.`,
        gates: [],
        citationIds:
          altId === 'urapidil'
            ? ['vsh.htn.2022.emergency_pulmonary_edema', 'esc.htn.2025.urapidil_iv']
            : ['vsh.htn.2022.emergency_pulmonary_edema', 'aha.acc.2025.iv_nicardipine'],
        priority: 98
      };
    },
    citationIds: ['vsh.htn.2022.emergency_pulmonary_edema', 'esc.htn.2025.urapidil_iv']
  },

  {
    id: 'htn.inpatient.pulmonary_edema_loop_diuretic',
    module: 'htn',
    nameVi: 'Phù phổi cấp kèm tăng huyết áp: Phối hợp lợi tiểu quai Furosemide tĩnh mạch',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!hasCondition(ctx, 'acutePulmonaryEdema')) return false;
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      if (sbp === undefined || sbp < sbpHypo) return false;
      const medIds = getMedIds(ctx);
      return !medIds.includes('furosemide');
    },
    produce: (): Recommendation => {
      const furoName = drug('furosemide').nameVi;
      const dLow = th('htn.furosemide.dose_start_mg');
      const dHigh = th('htn.furosemide.dose_high_mg');
      return {
        id: 'rec_htn_pulmonary_edema_furosemide',
        module: 'htn',
        tier: 'Cấp cứu Phù phổi cấp do tim',
        tierOrder: 0,
        action: 'START',
        drugId: 'furosemide',
        drugNameVi: furoName,
        dose: `${dLow}–${dHigh} mg tiêm tĩnh mạch`,
        title: `Phối hợp lợi tiểu quai ${furoName} (${dLow}–${dHigh} mg tĩnh mạch) giảm sung huyết phổi cấp`,
        rationale:
          'Theo VSH 2022 (Bảng 14) và ESC 2024, trong phù phổi cấp tim mạch kèm tăng huyết áp, phối hợp lợi tiểu quai Furosemide đường tĩnh mạch cùng thuốc giãn mạch (Nitroglycerin/Urapidil) để giải phóng nhanh tình trạng quá tải dịch phế nang.',
        gates: [],
        citationIds: ['vsh.htn.2022.emergency_pulmonary_edema', 'aha.acc.2025.table13_eplerenone_furosemide'],
        priority: 95
      };
    },
    citationIds: ['vsh.htn.2022.emergency_pulmonary_edema', 'aha.acc.2025.table13_eplerenone_furosemide']
  },

  {
    id: 'htn.inpatient.pulmonary_edema_bb_safety',
    module: 'htn',
    nameVi: 'Phù phổi cấp do tim: Tạm ngừng hoặc chống chỉ định thuốc chẹn beta giao cảm',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => hasCondition(ctx, 'acutePulmonaryEdema'),
    produce: (ctx: RuleContext): Recommendation => {
      const medIds = getMedIds(ctx);
      const activeBb = medIds.find((id) => BB_IDS.includes(id));

      if (activeBb) {
        return {
          id: 'rec_htn_pulmonary_edema_hold_bb',
          module: 'htn',
          tier: 'Cảnh báo An toàn Huyết động',
          tierOrder: 0,
          action: 'HOLD',
          drugId: activeBb,
          title: `TẠM NGỪNG thuốc chẹn beta đang dùng (${activeBb}) trong giai đoạn Phù phổi cấp huyết động`,
          rationale:
            'Theo AHA/ACC 2025 và VSH 2022, chống chỉ định khởi trị hoặc tiếp tục liều chẹn beta giao cảm khi bệnh nhân đang phù phổi cấp mất bù do tác dụng giảm sức co bóp cơ tim cấp gây sốc tim.',
          gates: [],
          citationIds: ['aha.acc.2025.pulmonary_edema_bb_contra', 'vsh.htn.2022.emergency_pulmonary_edema'],
          priority: 100
        };
      }

      return {
        id: 'rec_htn_pulmonary_edema_avoid_bb',
        module: 'htn',
        tier: 'Cảnh báo An toàn Huyết động',
        tierOrder: 0,
        action: 'AVOID',
        drugId: 'esmolol',
        drugNameVi: 'Nhóm chẹn beta giao cảm (Esmolol / Labetalol / Bisoprolol)',
        title: 'CHỐNG CHỈ ĐỊNH thuốc chẹn beta giao cảm trong giai đoạn Phù phổi cấp do tim',
        rationale:
          'Khuyến cáo nhóm III (Harm - AHA/ACC 2025 / VSH 2022): Không dùng thuốc chẹn beta giao cảm để hạ áp khi đang phù phổi cấp do ức chế co bóp cơ tim gây trụy tuần hoàn.',
        gates: [],
        citationIds: ['aha.acc.2025.pulmonary_edema_bb_contra', 'vsh.htn.2022.emergency_pulmonary_edema'],
        priority: 99
      };
    },
    citationIds: ['aha.acc.2025.pulmonary_edema_bb_contra']
  }
];
