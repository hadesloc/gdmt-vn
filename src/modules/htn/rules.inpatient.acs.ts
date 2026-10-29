/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Hội chứng Mạch vành Cấp kèm THA Cấp cứu
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import {
  thFor,
  drug,
  dose,
  fmtDose
} from '../../kb-types';
import { hasAvBlockOrSssWithoutPacer, hasPde5i } from './helpers';

export const htnInpatientAcsRules: Rule[] = [
  {
    id: 'htn.inpatient.acute_coronary_syndrome',
    module: 'htn',
    nameVi: 'Hội chứng mạch vành cấp kèm tăng huyết áp cấp cứu: Nitroglycerin tĩnh mạch',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'acuteAcsWithin24h') && !hasCondition(ctx, 'aorticDissection'),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'xử trí tăng huyết áp cấp cứu trong hội chứng mạch vành cấp', [
          'vsh.htn.2022.emergency_acs_table14'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpTarget = thFor('sbp', 'htn.emergency.acs_target_sbp');
      const ntgName = drug('nitroglycerin').nameVi;
      const ntgDose = dose('nitroglycerin', 'start');

      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_emergency_acs',
          module: 'htn',
          tier: 'Hội chứng Vành cấp (Tụt huyết áp)',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'nitroglycerin',
          drugNameVi: ntgName,
          title: `CHỐNG CHỈ ĐỊNH ${ntgName} do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg)`,
          rationale: `SBP ${sbp} mmHg (< ${sbpHypo} mmHg) có nguy cơ sốc tim hoặc nhồi máu thất phải; tuyệt đối không truyền Nitroglycerin.`,
          gates: [],
          citationIds: ['aha.acc.2025.iv_nitroglycerin', 'vsh.htn.2022.emergency_acs_table14'],
          priority: 100
        };
      }

      if (hasPde5i(ctx)) {
        return {
          id: 'rec_htn_emergency_acs',
          module: 'htn',
          tier: 'Hội chứng Vành cấp (Chống chỉ định PDE-5i)',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'nitroglycerin',
          drugNameVi: ntgName,
          title: `CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI ${ntgName} do bệnh nhân đã dùng thuốc ức chế PDE-5 (Sildenafil/Tadalafil/Vardenafil)`,
          rationale:
            'Phối hợp Nitroglycerin với thuốc ức chế PDE-5 gây tụt huyết áp kháng trị và trụy mạch tử vong do cộng hưởng cGMP. Chuyển sang Esmolol/Labetalol hoặc Urapidil đường tĩnh mạch.',
          gates: [
            {
              parameter: 'Thuốc ức chế PDE-5',
              passed: false,
              messageVi: 'Đang dùng Sildenafil/Tadalafil/Vardenafil: Cấm tuyệt đối Nitroglycerin'
            }
          ],
          citationIds: ['aha.acc.2025.iv_nitroglycerin', 'vsh.htn.2022.emergency_acs_table14'],
          priority: 100
        };
      }

      if (sbp < sbpTarget) {
        return {
          id: 'rec_htn_emergency_acs',
          module: 'htn',
          tier: 'Hội chứng Vành cấp',
          tierOrder: 1,
          action: 'MONITOR',
          drugId: 'nitroglycerin',
          drugNameVi: ntgName,
          title: `Huyết áp trong Hội chứng vành cấp đã đạt < ${sbpTarget} mmHg (hiện ${sbp} mmHg): Theo dõi sát tưới máu vành`,
          rationale: `SBP hiện tại ${sbp} mmHg (< ${sbpTarget} mmHg); tránh hạ huyết áp tâm trương quá thấp làm giảm tưới máu động mạch vành.`,
          gates: [],
          citationIds: ['vsh.htn.2022.emergency_acs_table14', 'aha.acc.2025.table27_aortic_acs'],
          priority: 88
        };
      }

      return {
        id: 'rec_htn_emergency_acs',
        module: 'htn',
        tier: 'Hội chứng Vành cấp kèm THA cấp cứu',
        tierOrder: 0,
        action: 'START',
        drugId: 'nitroglycerin',
        drugNameVi: ntgName,
        dose: fmtDose(ntgDose),
        title: `Hạ áp ngay trong Hội chứng vành cấp bằng ${ntgName} tĩnh mạch: Đích SBP < ${sbpTarget} mmHg`,
        rationale: `Theo VSH 2022 (Bảng 14) và AHA/ACC 2025 (Table 27), trong hội chứng mạch vành cấp kèm tăng huyết áp nặng (SBP ${sbp} ≥ ${sbpTarget} mmHg), ưu tiên hàng đầu truyền ${ntgName} (kết hợp Esmolol/Labetalol nếu nhịp nhanh và không suy tim cấp) để giảm tiền tải, giãn mạch vành và giảm tiêu thụ oxy cơ tim. TRÁNH dùng Sodium nitroprusside (hiện tượng cướp máu mạch vành) và tránh dùng đơn độc DHP-CCB gây nhịp nhanh phản xạ.`,
        gates: [],
        citationIds: [
          'vsh.htn.2022.emergency_acs_table14',
          'aha.acc.2025.table27_aortic_acs',
          'aha.acc.2025.iv_nitroglycerin'
        ],
        priority: 99
      };
    },
    citationIds: ['vsh.htn.2022.emergency_acs_table14', 'aha.acc.2025.table27_aortic_acs']
  },

  {
    id: 'htn.inpatient.acute_coronary_syndrome_alt',
    module: 'htn',
    nameVi: 'Hội chứng mạch vành cấp có PDE-5i: Thuốc hạ áp tĩnh mạch thay thế Nitroglycerin',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!hasCondition(ctx, 'acuteAcsWithin24h') || hasCondition(ctx, 'aorticDissection')) return false;
      if (!hasPde5i(ctx)) return false;
      const sbp = need(ctx, 'sbp');
      const sbpTarget = thFor('sbp', 'htn.emergency.acs_target_sbp');
      return sbp !== undefined && sbp >= sbpTarget;
    },
    produce: (ctx: RuleContext): Recommendation => {
      const hr = need(ctx, 'hr');
      const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');
      const canUseEsmolol =
        hr !== undefined &&
        hr >= hrMin &&
        !hasCondition(ctx, 'acutePulmonaryEdema') &&
        !hasCondition(ctx, 'asthma') &&
        !hasAvBlockOrSssWithoutPacer(ctx);

      const altId = canUseEsmolol ? 'esmolol' : 'urapidil';
      const altName = drug(altId).nameVi;
      const altDose = dose(altId, 'start');
      const sbpTarget = thFor('sbp', 'htn.emergency.acs_target_sbp');

      return {
        id: 'rec_htn_emergency_acs_alt',
        module: 'htn',
        tier: 'Hội chứng Vành cấp (Thay thế Nitroglycerin)',
        tierOrder: 0,
        action: 'START',
        drugId: altId,
        drugNameVi: altName,
        dose: fmtDose(altDose),
        title: `Truyền ${altName} thay thế Nitroglycerin trong Hội chứng vành cấp: Đích SBP < ${sbpTarget} mmHg`,
        rationale: `Do chống chỉ định Nitroglycerin vì thuốc ức chế PDE-5, sử dụng ${altName} đường tĩnh mạch để hạ huyết áp về đích < ${sbpTarget} mmHg và giảm gánh cơ tim an toàn.`,
        gates: [],
        citationIds:
          altId === 'esmolol'
            ? ['aha.acc.2025.table27_aortic_acs', 'aha.acc.2025.iv_esmolol']
            : ['vsh.htn.2022.emergency_acs_table14', 'esc.htn.2025.urapidil_iv'],
        priority: 98
      };
    },
    citationIds: ['aha.acc.2025.table27_aortic_acs', 'vsh.htn.2022.emergency_acs_table14']
  },

  // -------------------------------------------------------------------------
  // 4. PHÙ PHỔI CẤP DO TIM: NITROGLYCERIN IV + FUROSEMIDE IV + CẤM/TẠM NGỪNG CHẸN BETA
  // -------------------------------------------------------------------------
];
