/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Đột quỵ Xuất huyết Não Cấp (ICH)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { thFor, drug } from '../../kb-types';
import { fmtInpatientIvDose, selectIvAgentAvoidingSevereAs } from './rules.inpatient.stroke';

export const htnInpatientIchRules: Rule[] = [
  {
    id: 'htn.inpatient.intracerebral_hemorrhage',
    module: 'htn',
    nameVi: 'Đột quỵ xuất huyết não cấp (ICH): Hạ áp mượt có kiểm soát, tránh hạ huyết áp tâm thu quá mức',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => hasCondition(ctx, 'acuteIntracerebralHemorrhage'),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'kiểm soát huyết áp trong xuất huyết não cấp (ICH)', [
          'aha.acc.2025.ich_rec1'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'kiểm soát huyết áp trong xuất huyết não cấp (ICH)', [
          'aha.acc.2025.ich_rec1'
        ]);
      }

      const profile = ctx.settings.profile;
      const sbpMinFloor = thFor('sbp', 'htn.emergency.ich_sbp_target_min'); // 130
      const sbpEscMin = thFor('sbp', 'htn.emergency.ich_sbp_target_esc_min'); // 140
      const sbpEscTrig = thFor('sbp', 'htn.emergency.ich_sbp_trigger_esc'); // 160
      const sbpUsTrig = thFor('sbp', 'htn.emergency.ich_sbp_trigger_us_min'); // 150
      const sbpUsMax = thFor('sbp', 'htn.emergency.ich_sbp_target_us_max'); // 140
      const sbpVnTrig = thFor('sbp', 'htn.emergency.ich_sbp_target_max'); // 180
      const sbpSevere220 = thFor('sbp', 'htn.emergency.ich_sbp_severe_esc'); // 220
      const maxDrop70 = thFor('sbp', 'htn.emergency.ich_sbp_max_drop_1h'); // 70

      if (sbp < sbpMinFloor) {
        return {
          id: 'rec_htn_emergency_ich',
          module: 'htn',
          tier: 'Xuất huyết não cấp (Cấm hạ dưới 130 mmHg)',
          tierOrder: 0,
          action: 'HOLD',
          title: `NGỪNG/TẠM HOÃN thuốc hạ áp trong ICH do SBP = ${sbp} < ${sbpMinFloor} mmHg (COR 3: Harm)`,
          rationale: `Theo AHA/ACC 2025 (Rec 2, COR 3: Harm) và VSH 2022, hạ SBP xuống < ${sbpMinFloor} mmHg ở xuất huyết nội sọ cấp gây tổn thương thận cấp và làm xấu kết cục thần kinh; bắt buộc tạm ngừng thuốc hạ áp.`,
          gates: [
            {
              parameter: 'Sàn an toàn SBP trong ICH',
              passed: false,
              value: sbp,
              threshold: sbpMinFloor,
              messageVi: `SBP ${sbp} < ${sbpMinFloor} mmHg: Bắt buộc ngừng thuốc hạ áp`
            }
          ],
          citationIds: ['aha.acc.2025.ich_rec1', 'vsh.htn.2022.emergency_ich'],
          priority: 100
        };
      }

      const needsIvLowering =
        profile === 'US' ? sbp >= sbpUsTrig : profile === 'INTL' ? sbp > sbpEscTrig : sbp > sbpVnTrig;

      const windowText =
        profile === 'US'
          ? sbp > sbpSevere220
            ? `${sbpEscTrig}–${sbpVnTrig} mmHg (hạ thận trọng khi SBP > ${sbpSevere220}, cấm giảm > ${maxDrop70} mmHg/1h)`
            : `${sbpMinFloor}–<${sbpUsMax} mmHg`
          : profile === 'INTL'
            ? `${sbpEscMin}–${sbpEscTrig} mmHg`
            : `${sbpMinFloor}–${sbpVnTrig} mmHg`;

      if (!needsIvLowering) {
        return {
          id: 'rec_htn_emergency_ich',
          module: 'htn',
          tier: 'Xuất huyết não cấp (ICH)',
          tierOrder: 1,
          action: 'MONITOR',
          title: `Duy trì ổn định huyết áp trong ICH ở cửa sổ đích ${windowText} (hiện ${sbp}/${dbp} mmHg)`,
          rationale: `Huyết áp tâm thu hiện tại (${sbp} mmHg) đang nằm trong vùng an toàn; duy trì ổn định tránh dao động huyết áp lớn và tuyệt đối tránh hạ SBP < ${sbpMinFloor} mmHg.`,
          gates: [],
          citationIds: ['esc.htn.2024.ich_rec32', 'aha.acc.2025.ich_rec1', 'vsh.htn.2022.emergency_ich'],
          priority: 88
        };
      }

      const chosen = selectIvAgentAvoidingSevereAs(ctx);
      const chosenName = drug(chosen.drugId).nameVi;
      const chosenDoseText = fmtInpatientIvDose(chosen.drugId);
      const drop70Warn =
        sbp >= sbpSevere220
          ? ` CẢNH BÁO ĐỎ (ESC 2024 Class III): SBP ≥ ${sbpSevere220} mmHg — TUYỆT ĐỐI KHÔNG giảm quá ${maxDrop70} mmHg trong 1 giờ đầu (tức không hạ xuống thấp hơn ${sbp - maxDrop70} mmHg trong giờ đầu) để tránh tổn thương thận cấp và thiếu máu não quanh ổ máu tụ!`
          : '';

      return {
        id: 'rec_htn_emergency_ich',
        module: 'htn',
        tier: 'Xuất huyết não cấp (ICH)',
        tierOrder: 0,
        action: 'START',
        drugId: chosen.drugId,
        drugNameVi: chosenName,
        dose: chosenDoseText,
        title: `Hạ áp mượt trong ICH bằng ${chosenName}: Đích SBP ${windowText}, cấm hạ < ${sbpMinFloor} mmHg`,
        rationale: `Huyết áp tâm thu tăng cao (${sbp}/${dbp} mmHg) trong xuất huyết não cấp làm tăng nguy cơ lan rộng khối máu tụ. Truyền chuẩn độ mượt ${chosenName} để đạt cửa sổ đích ${windowText}; tránh dao động đỉnh-đáy và ngừng truyền ngay nếu SBP giảm xuống < ${sbpMinFloor} mmHg.${drop70Warn}`,
        gates: [],
        citationIds: [
          'esc.htn.2024.ich_rec32',
          'esc.htn.2024.ich_drop70_rec32',
          'aha.acc.2025.ich_rec1',
          'aha.acc.2025.ich_severe_220',
          'vsh.htn.2022.emergency_ich',
          chosen.citationId
        ],
        profileDiff: {
          INTL: `ESC 2024: Hạ ngay về ${sbpEscMin}–${sbpEscTrig} mmHg; nếu SBP ≥ ${sbpSevere220} cấm giảm > ${maxDrop70} mmHg trong 1 giờ đầu (Class III)`,
          US: `AHA/ACC 2025: Khi SBP ${sbpUsTrig}–${sbpSevere220} hạ mượt về ${sbpMinFloor}–<${sbpUsMax} mmHg (COR 2a); > ${sbpSevere220} hạ thận trọng; cấm < ${sbpMinFloor} mmHg (COR 3: Harm)`,
          VN: `VSH 2022: Khi SBP > ${sbpVnTrig} mmHg hạ có kiểm soát về dải ${sbpMinFloor}–${sbpVnTrig} mmHg`
        },
        priority: 99
      };
    },
    citationIds: ['esc.htn.2024.ich_rec32', 'aha.acc.2025.ich_rec1', 'vsh.htn.2022.emergency_ich']
  },

  // -------------------------------------------------------------------------
  // 7A. TIỀN SẢN GIẬT NẶNG / SẢN GIẬT / THAI KỲ HA ≥ 160/110: HẠ ÁP TĨNH MẠCH
  // -------------------------------------------------------------------------
];
