/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Bóc tách Động mạch chủ Cấp
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
  NDHP_CCB_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  isSevereAorticStenosis
} from './helpers';

export const htnInpatientAorticRules: Rule[] = [
  {
    id: 'htn.inpatient.aortic_dissection',
    module: 'htn',
    nameVi: 'Bóc tách động mạch chủ cấp: Khống chế nhịp tim và sức căng thành mạch tối khẩn',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => hasCondition(ctx, 'aorticDissection'),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'kiểm soát huyết áp tối khẩn trong bóc tách động mạch chủ cấp', [
          'vsh.htn.2022.emergency_aortic_dissection'
        ]);
      }
      if (hr === undefined) {
        return missingInputRec('htn', 'hr', 'kiểm soát tần số tim (dP/dt) trước khi dùng thuốc giãn mạch trong bóc tách ĐMC cấp', [
          'vsh.htn.2022.emergency_aortic_dissection',
          'aha.acc.2025.table27_aortic_acs'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpBbMin = thFor('sbp', 'htn.safety.sbp_bb_min');
      const sbpTarget = thFor('sbp', 'htn.emergency.aortic_dissection_sbp');
      const hrTarget = thFor('hr', 'htn.emergency.aortic_dissection_hr');
      const winMin = th('htn.emergency.aortic_window_min');
      const esmololName = drug('esmolol').nameVi;
      const esmololDose = dose('esmolol', 'start');
      const medIds = getMedIds(ctx);
      const hasNdhpCcb = medIds.some((id) => NDHP_CCB_IDS.includes(id));

      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_emergency_aortic_dissection',
          module: 'htn',
          tier: 'Bóc tách Động mạch chủ cấp (Cảnh báo Sốc / Chèn ép tim)',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'esmolol',
          drugNameVi: esmololName,
          title: `TẠM HOÃN thuốc hạ áp (${esmololName}) do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg) — Loại trừ chèn ép tim cấp`,
          rationale: `Huyết áp tâm thu ${sbp} mmHg (< ${sbpHypo} mmHg) ở bệnh nhân bóc tách động mạch chủ gợi ý biến chứng vỡ ĐMC, chèn ép tim cấp hoặc hở van ĐMC cấp. Tuyệt đối không dùng chẹn beta/giãn mạch lúc này; siêu âm tim tại giường và hội chẩn phẫu thuật tối khẩn.`,
          gates: [
            {
              parameter: 'SBP',
              passed: false,
              value: sbp,
              threshold: sbpHypo,
              messageVi: `SBP ${sbp} < ${sbpHypo} mmHg: Nghi ngờ sốc / chèn ép tim cấp`
            }
          ],
          citationIds: ['vsh.htn.2022.emergency_aortic_dissection', 'aha.acc.2025.iv_esmolol'],
          priority: 100
        };
      }

      if (hasCondition(ctx, 'acutePulmonaryEdema') || hasAvBlockOrSssWithoutPacer(ctx) || hasNdhpCcb) {
        return {
          id: 'rec_htn_emergency_aortic_dissection',
          module: 'htn',
          tier: 'Bóc tách Động mạch chủ cấp (Chống chỉ định Chẹn beta)',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'esmolol',
          drugNameVi: esmololName,
          title: `CHỐNG CHỈ ĐỊNH ${esmololName} tĩnh mạch (do phù phổi cấp / block nhĩ thất cao độ / đang dùng Verapamil-Diltiazem)`,
          rationale:
            'Theo AHA/ACC 2025 Table 26, Esmolol chống chỉ định khi có suy tim mất bù/phù phổi cấp, block nhĩ thất độ 2–3 chưa đặt máy tạo nhịp hoặc đang dùng đồng thời thuốc chẹn kênh canxi non-DHP (Diltiazem/Verapamil) do nguy cơ trụy tim mạch và vô tâm thu. Cần hội chẩn tim mạch - phẫu thuật mạch máu tối khẩn.',
          gates: [
            {
              parameter: 'Chống chỉ định chẹn beta tĩnh mạch',
              passed: false,
              messageVi: 'Phù phổi cấp / Block nhĩ thất / Đang dùng non-DHP CCB: Chống chỉ định Esmolol'
            }
          ],
          citationIds: ['aha.acc.2025.iv_esmolol', 'aha.acc.2025.pulmonary_edema_bb_contra'],
          priority: 100
        };
      }

      if (hr < hrTarget) {
        return {
          id: 'rec_htn_emergency_aortic_dissection',
          module: 'htn',
          tier: 'Bóc tách Động mạch chủ cấp',
          tierOrder: 0,
          action: sbp > sbpTarget ? 'MONITOR' : 'HOLD',
          drugId: 'esmolol',
          drugNameVi: esmololName,
          title: `Nhịp tim đã đạt đích (< ${hrTarget} bpm, hiện ${hr} bpm): Không nạp thêm ${esmololName}`,
          rationale: `Tần số tim hiện tại ${hr} chu kỳ/phút đã đạt mục tiêu < ${hrTarget} chu kỳ/phút nên không tiêm truyền thêm chẹn beta để tránh nhịp chậm nặng; nếu SBP (${sbp} mmHg) còn > ${sbpTarget} mmHg, dùng thuốc giãn mạch tĩnh mạch để đưa SBP về ≤ ${sbpTarget} mmHg trong ${winMin} phút.`,
          gates: [
            {
              parameter: 'Tần số tim (HR)',
              passed: true,
              value: hr,
              threshold: hrTarget,
              messageVi: `HR ${hr} < ${hrTarget} bpm: Đã đạt mục tiêu khống chế nhịp`
            }
          ],
          citationIds: ['vsh.htn.2022.emergency_aortic_dissection', 'aha.acc.2025.table27_aortic_acs'],
          priority: 98
        };
      }

      if (sbp < sbpBbMin) {
        return {
          id: 'rec_htn_emergency_aortic_dissection',
          module: 'htn',
          tier: 'Bóc tách Động mạch chủ cấp',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'esmolol',
          drugNameVi: esmololName,
          title: `Thận trọng huyết áp biên thấp (SBP = ${sbp} < ${sbpBbMin} mmHg): Hoãn bolus ${esmololName}, hội chẩn phẫu thuật tối khẩn`,
          rationale: `Huyết áp tâm thu hiện tại ${sbp} mmHg đã thấp hơn ${sbpBbMin} mmHg (đạt dưới ngưỡng ${sbpTarget} mmHg); cần đánh giá tưới máu tạng và hội chẩn phẫu thuật động mạch chủ tối khẩn trước khi dùng chẹn beta liều tải.`,
          gates: [],
          citationIds: ['aha.acc.2025.table27_aortic_acs', 'aha.acc.2025.iv_esmolol'],
          priority: 98
        };
      }

      const airwayNote =
        hasCondition(ctx, 'asthma') || hasCondition(ctx, 'copd')
          ? ' LƯU Ý ĐỒNG MẮC HEN/COPD: Tuyệt đối tránh Labetalol (chẹn cả beta-2); ưu tiên Esmolol siêu ngắn chọn lọc beta-1 tại ICU để có thể ngưng truyền ngay nếu co thắt phế quản, hoặc cân nhắc Diltiazem/Verapamil tĩnh mạch thay thế.'
          : '';
      const activeOralBb = medIds.find((id) => BB_IDS.includes(id) && id !== 'esmolol');
      const concurrentBbNote = activeOralBb
        ? ` Bệnh nhân có tiền sử đang dùng chẹn beta đường uống (${activeOralBb}): chuẩn độ Esmolol thận trọng tránh cộng hưởng nhịp chậm.`
        : '';

      return {
        id: 'rec_htn_emergency_aortic_dissection',
        module: 'htn',
        tier: 'Bóc tách Động mạch chủ cấp (Tối khẩn)',
        tierOrder: 0,
        action: 'START',
        drugId: 'esmolol',
        drugNameVi: esmololName,
        dose: fmtDose(esmololDose),
        title: `BƯỚC 1 TỐI KHẨN: Truyền ${esmololName} khống chế HR < ${hrTarget} bpm và SBP ≤ ${sbpTarget} mmHg trong ${winMin} phút`,
        rationale: `Khuyến cáo loại I (AHA/ACC 2025 Table 27 / ESC 2024 / VSH 2022): Phải khởi trị chẹn beta đường tĩnh mạch tác dụng cực ngắn (${esmololName}) ĐẦU TIÊN để giảm lực xé thành động mạch chủ (dP/dt), mục tiêu đưa tần số tim < ${hrTarget} chu kỳ/phút và SBP ≤ ${sbpTarget} mmHg trong vòng ${winMin} phút. TUYỆT ĐỐI KHÔNG dùng thuốc giãn mạch trước khi khống chế tần số tim vì gây nhịp nhanh phản xạ làm lan rộng vết bóc tách.${airwayNote}${concurrentBbNote}`,
        gates: [
          {
            parameter: 'Tần số tim (HR)',
            passed: true,
            value: hr,
            threshold: hrTarget,
            messageVi: `HR ${hr} ≥ ${hrTarget} bpm: Bắt buộc truyền ${esmololName} trước khi dùng giãn mạch`
          }
        ],
        citationIds: [
          'aha.acc.2025.table27_aortic_acs',
          'aha.acc.2025.iv_esmolol',
          'vsh.htn.2022.emergency_aortic_dissection'
        ],
        priority: 100
      };
    },
    citationIds: ['aha.acc.2025.table27_aortic_acs', 'vsh.htn.2022.emergency_aortic_dissection']
  },

  {
    id: 'htn.inpatient.aortic_dissection_asthma_avoid_labetalol',
    module: 'htn',
    nameVi: 'Bóc tách ĐMC kèm Hen/COPD: Cấm Labetalol không chọn lọc',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'aorticDissection') && (hasCondition(ctx, 'asthma') || hasCondition(ctx, 'copd')),
    produce: (): Recommendation => ({
      id: 'rec_htn_aortic_asthma_avoid_labetalol',
      module: 'htn',
      tier: 'Cảnh báo An toàn Đường thở',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'labetalol',
      drugNameVi: drug('labetalol').nameVi,
      title: 'CHỐNG CHỈ ĐỊNH Labetalol tĩnh mạch trên bệnh nhân Hen phế quản / COPD nặng',
      rationale:
        'Labetalol ức chế không chọn lọc cả thụ thể beta-1 và beta-2, có thời gian bán thải kéo dài gây co thắt phế quản nguy kịch trên bệnh nhân hen/COPD. Chỉ dùng Esmolol siêu ngắn chọn lọc beta-1 dưới giám sát đường thở tại ICU hoặc Diltiazem tĩnh mạch.',
      gates: [],
      citationIds: ['aha.acc.2025.iv_labetalol', 'aha.acc.2025.iv_esmolol'],
      priority: 99
    }),
    citationIds: ['aha.acc.2025.iv_labetalol']
  },

  // -------------------------------------------------------------------------
  // 2B. BÓC TÁCH ĐMC CẤP: PHỐI HỢP GIÃN MẠCH TĨNH MẠCH SAU KHI KHỐNG CHẾ NHỊP TIM
  // -------------------------------------------------------------------------
  {
    id: 'htn.inpatient.aortic_dissection_vasodilator',
    module: 'htn',
    nameVi: 'Bóc tách ĐMC cấp: Phối hợp giãn mạch tĩnh mạch sau khi kiểm soát tần số tim',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!hasCondition(ctx, 'aorticDissection')) return false;
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');
      // Fail-closed tuyệt đối: Không bao giờ phát thuốc giãn mạch khi chưa biết HR!
      if (sbp === undefined || hr === undefined) return false;
      const sbpTarget = thFor('sbp', 'htn.emergency.aortic_dissection_sbp');
      return sbp > sbpTarget;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');
      if (sbp === undefined || hr === undefined) return null;

      const sbpTarget = thFor('sbp', 'htn.emergency.aortic_dissection_sbp');
      const hrTarget = thFor('hr', 'htn.emergency.aortic_dissection_hr');
      const winMin = th('htn.emergency.aortic_window_min');
      if (sbp <= sbpTarget) return null;

      const medIds = getMedIds(ctx);
      const bbBlocked =
        hasCondition(ctx, 'acutePulmonaryEdema') ||
        hasAvBlockOrSssWithoutPacer(ctx) ||
        medIds.some((id) => NDHP_CCB_IDS.includes(id));

      if (hr >= hrTarget && bbBlocked) {
        return {
          id: 'rec_htn_aortic_defer_vasodilator',
          module: 'htn',
          tier: 'Bóc tách Động mạch chủ cấp',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'nicardipine',
          drugNameVi: drug('nicardipine').nameVi,
          title: `KHÔNG truyền đơn độc thuốc giãn mạch (${drug('nicardipine').nameVi}) khi nhịp tim chưa khống chế (HR = ${hr} ≥ ${hrTarget} bpm)`,
          rationale:
            'Truyền thuốc giãn mạch đơn độc khi chưa chẹn được phản xạ giao cảm (HR ≥ 60 bpm) làm tăng vọt lực xé dP/dt và gây vỡ bóc tách động mạch chủ.',
          gates: [],
          citationIds: ['aha.acc.2025.table27_aortic_acs', 'aha.acc.2025.iv_nicardipine'],
          priority: 99
        };
      }

      const chosenId = isSevereAorticStenosis(ctx) ? 'urapidil' : 'nicardipine';
      const chosenName = drug(chosenId).nameVi;
      const chosenDose = dose(chosenId, 'start');
      const citationList =
        chosenId === 'urapidil'
          ? ['aha.acc.2025.table27_aortic_acs', 'esc.htn.2025.urapidil_iv', 'vsh.htn.2022.emergency_aortic_dissection']
          : ['aha.acc.2025.table27_aortic_acs', 'aha.acc.2025.iv_nicardipine', 'vsh.htn.2022.emergency_aortic_dissection'];

      const stepPrefix =
        hr < hrTarget
          ? `Nhịp tim đã đạt < ${hrTarget} bpm (${hr} bpm) nhưng SBP còn ${sbp} > ${sbpTarget} mmHg: Khởi trị truyền ${chosenName}`
          : `BƯỚC 2 (CHỈ SAU KHI ĐÃ CHẸN BETA ĐẠT HR < ${hrTarget} bpm): Phối hợp truyền ${chosenName} đưa SBP ≤ ${sbpTarget} mmHg`;

      return {
        id: 'rec_htn_aortic_vasodilator',
        module: 'htn',
        tier: 'Bóc tách Động mạch chủ cấp (Kiểm soát hậu tải)',
        tierOrder: 0,
        action: 'START',
        drugId: chosenId,
        drugNameVi: chosenName,
        dose: fmtDose(chosenDose),
        title: `${stepPrefix} trong ${winMin} phút`,
        rationale: `Theo AHA/ACC 2025 Table 27 và VSH 2022, để đạt đích SBP ≤ ${sbpTarget} mmHg trong vòng ${winMin} phút, phối hợp truyền tĩnh mạch ${chosenName} NGAY SAU KHI đã kiểm soát tần số tim bằng Esmolol (hoặc ngay lập tức nếu HR nền đã < ${hrTarget} chu kỳ/phút). Tuyệt đối không chạy dịch giãn mạch trước khi chẹn beta có hiệu lực.`,
        gates: [
          {
            parameter: 'Trình tự Rate-before-Vasodilator',
            passed: true,
            value: hr,
            threshold: hrTarget,
            messageVi:
              hr < hrTarget
                ? `HR ${hr} < ${hrTarget} bpm: Đủ điều kiện an toàn truyền giãn mạch đưa SBP ≤ ${sbpTarget} mmHg`
                : `Bắt buộc đạt chẹn beta trước khi mở bơm tiêm điện ${chosenName}`
          }
        ],
        citationIds: citationList,
        priority: 97
      };
    },
    citationIds: ['aha.acc.2025.table27_aortic_acs', 'aha.acc.2025.iv_nicardipine']
  },

  // -------------------------------------------------------------------------
  // 3. HỘI CHỨNG MẠCH VÀNH CẤP TRONG 24 GIỜ (ACS + THA CẤP CỨU)
  // -------------------------------------------------------------------------
];
