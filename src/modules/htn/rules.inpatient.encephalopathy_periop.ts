/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Bệnh não THA, THA Ác tính & THA Chu phẫu
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { thFor, drug } from '../../kb-types';
import { isPregnantSevereCrisis } from './helpers';
import { fmtInpatientIvDose, selectIvAgentAvoidingSevereAs } from './rules.inpatient.stroke';

export const htnInpatientEncephalopathyPeriopRules: Rule[] = [
  {
    id: 'htn.inpatient.hypertensive_encephalopathy',
    module: 'htn',
    nameVi: 'Cấp cứu Bệnh não tăng huyết áp, THA ác tính & THA chu phẫu: Giảm có kiểm soát 20–25% MAP giờ đầu',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const hasTargetCond =
        hasCondition(ctx, 'hypertensiveEncephalopathy') ||
        hasCondition(ctx, 'malignantHypertension') ||
        hasCondition(ctx, 'perioperativeHypertension');
      if (!hasTargetCond) return false;

      // Nhường quyền cho các quy tắc cơ quan đích chuyên biệt khác nếu đồng mắc để tránh xung đột thuốc tĩnh mạch
      const hasSpecificOrganRule =
        hasCondition(ctx, 'aorticDissection') ||
        hasCondition(ctx, 'acutePulmonaryEdema') ||
        hasCondition(ctx, 'acuteAcsWithin24h') ||
        hasCondition(ctx, 'acuteIschemicStroke') ||
        hasCondition(ctx, 'acuteIntracerebralHemorrhage') ||
        hasCondition(ctx, 'severePreeclampsiaEclampsia') ||
        isPregnantSevereCrisis(ctx);

      return !hasSpecificOrganRule;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'xử trí cấp cứu bệnh não tăng huyết áp / THA ác tính', [
          'vsh.htn.2022.emergency_encephalopathy'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'xử trí cấp cứu bệnh não tăng huyết áp / THA ác tính', [
          'vsh.htn.2022.emergency_encephalopathy'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpEncephMin = thFor('sbp', 'htn.emergency.encephalopathy_sbp_min'); // 140 (Ca C11: 156/96!)
      const dbpEncephMin = thFor('dbp', 'htn.bp.dbp_hypertension'); // 90
      const sbpStep1 = thFor('sbp', 'htn.emergency.encephalopathy_sbp_step1'); // 160
      const dbpStep1 = thFor('dbp', 'htn.emergency.encephalopathy_dbp_step1'); // 100
      const mapMin = thFor('percentage', 'htn.emergency.map_reduction_pct_min'); // 20
      const mapMax = thFor('percentage', 'htn.emergency.map_reduction_pct_max'); // 25

      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_hypertensive_emergency_general',
          module: 'htn',
          tier: 'Cấp cứu Tăng huyết áp (Cảnh báo Tụt huyết áp)',
          tierOrder: 0,
          action: 'HOLD',
          title: `TẠM NGỪNG truyền thuốc hạ áp do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg)`,
          rationale: `SBP ${sbp} mmHg (< ${sbpHypo} mmHg) làm sụp đổ tưới máu não - thận; ngừng ngay thuốc hạ áp tĩnh mạch.`,
          gates: [],
          citationIds: ['vsh.htn.2022.emergency_encephalopathy'],
          priority: 100
        };
      }

      const isEncephalopathy = hasCondition(ctx, 'hypertensiveEncephalopathy');
      const minSbpTrigger = isEncephalopathy ? sbpEncephMin : sbpStep1;
      const minDbpTrigger = isEncephalopathy ? dbpEncephMin : dbpStep1;

      if (sbp < minSbpTrigger && dbp < minDbpTrigger) {
        return {
          id: 'rec_htn_hypertensive_emergency_general',
          module: 'htn',
          tier: 'Theo dõi Cấp cứu Tăng huyết áp',
          tierOrder: 1,
          action: 'MONITOR',
          title: `Theo dõi sát MAP tại ICU (HA hiện tại ${sbp}/${dbp} < ${minSbpTrigger}/${minDbpTrigger} mmHg)`,
          rationale: `Huyết áp đã giảm dưới ngưỡng ${minSbpTrigger}/${minDbpTrigger} mmHg; tránh hạ tiếp vượt quá ${mapMin}%–${mapMax}% MAP ban đầu để bảo tồn tự điều hòa tưới máu não và thận.`,
          gates: [],
          citationIds: ['aha.acc.2025.emergency_general_rec3', 'vsh.htn.2022.emergency_encephalopathy'],
          priority: 88
        };
      }

      const chosen = selectIvAgentAvoidingSevereAs(ctx);
      const chosenName = drug(chosen.drugId).nameVi;
      const chosenDoseText = fmtInpatientIvDose(chosen.drugId);

      return {
        id: 'rec_htn_hypertensive_emergency_general',
        module: 'htn',
        tier: 'Cấp cứu Tăng huyết áp (Bệnh não THA / THA ác tính)',
        tierOrder: 0,
        action: 'START',
        drugId: chosen.drugId,
        drugNameVi: chosenName,
        dose: chosenDoseText,
        title: `Hạ áp cấp cứu bằng ${chosenName}: Giảm không quá ${mapMin}%–${mapMax}% MAP trong giờ đầu, sau đó về ${sbpStep1}/${dbpStep1} mmHg trong 2–6 giờ`,
        rationale: `Khuyến cáo loại I (AHA/ACC 2025 Section 6.2 Rec 3 / ESC 2024 / VSH 2022): Bệnh não do tăng huyết áp có thể xảy ra ngay ở mức HA tăng vừa phải (như ở người trước đó HA bình thường, hiện tại ${sbp}/${dbp} mmHg). Truyền chuẩn độ ${chosenName} qua bơm tiêm điện nhằm giảm ngay ${mapMin}%–${mapMax}% huyết áp trung bình (MAP) trong 1 giờ đầu, nếu ổn định giảm tiếp về khoảng ${sbpStep1}/${dbpStep1} mmHg trong 2–6 giờ tiếp theo và về bình thường sau 24–48 giờ. Tránh hạ quá nhanh gây nhồi máu não hoặc tổn thương thận cấp.`,
        gates: [
          {
            parameter: 'Mức giảm MAP giờ đầu',
            passed: true,
            value: sbp,
            threshold: minSbpTrigger,
            messageVi: `HA ${sbp}/${dbp} mmHg: Giảm có kiểm soát ${mapMin}%–${mapMax}% MAP giờ đầu`
          }
        ],
        citationIds: [
          'aha.acc.2025.emergency_general_rec3',
          'vsh.htn.2022.emergency_encephalopathy',
          'vsh.htn.2022.emergency_malignant',
          chosen.citationId
        ],
        priority: 99
      };
    },
    citationIds: ['aha.acc.2025.emergency_general_rec3', 'vsh.htn.2022.emergency_encephalopathy']
  }
];
