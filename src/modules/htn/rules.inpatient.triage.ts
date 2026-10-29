/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Phân định Cấp cứu THA vs THA Khẩn cấp
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { thFor } from '../../kb-types';
import { hasAnyAcuteHmod, isPostEvt, isPregnantSevereCrisis } from './helpers';

export const htnInpatientTriageRules: Rule[] = [
  {
    id: 'htn.inpatient.differentiate_crisis',
    module: 'htn',
    nameVi: 'Phân định Cấp cứu tăng huyết áp vs Cơn tăng huyết áp khẩn cấp',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const sbpCrisis = thFor('sbp', 'htn.emergency.sbp_crisis');
      const dbpCrisis = thFor('dbp', 'htn.emergency.dbp_crisis');

      if (sbp === undefined && dbp === undefined) {
        return hasCondition(ctx, 'htn') || hasAnyAcuteHmod(ctx);
      }

      return (
        hasAnyAcuteHmod(ctx) ||
        isPregnantSevereCrisis(ctx) ||
        (sbp !== undefined && sbp >= sbpCrisis) ||
        (dbp !== undefined && dbp >= dbpCrisis)
      );
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'đánh giá phân tầng cơn tăng huyết áp nội viện', [
          'vsh.htn.2022.emergency_malignant'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'đánh giá phân tầng cơn tăng huyết áp nội viện', [
          'vsh.htn.2022.emergency_malignant'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      if (sbp < sbpHypo) return null;

      const sbpCrisis = thFor('sbp', 'htn.emergency.sbp_crisis');
      const dbpCrisis = thFor('dbp', 'htn.emergency.dbp_crisis');
      const sbpStrokeNoRtpa = thFor('sbp', 'htn.emergency.stroke_no_thrombolysis_sbp');
      const dbpStrokeNoRtpa =
        ctx.settings.profile === 'INTL'
          ? thFor('dbp', 'htn.emergency.stroke_no_rtpa_dbp_esc')
          : thFor('dbp', 'htn.emergency.stroke_no_thrombolysis_dbp');

      const hasIschemicStroke = hasCondition(ctx, 'acuteIschemicStroke');
      const isStrokeEmergency =
        hasIschemicStroke &&
        (hasCondition(ctx, 'thrombolysisEligible') ||
          isPostEvt(ctx) ||
          sbp >= sbpStrokeNoRtpa ||
          dbp >= dbpStrokeNoRtpa);

      const isEmergency =
        hasCondition(ctx, 'aorticDissection') ||
        hasCondition(ctx, 'acutePulmonaryEdema') ||
        hasCondition(ctx, 'acuteAcsWithin24h') ||
        isStrokeEmergency ||
        hasCondition(ctx, 'acuteIntracerebralHemorrhage') ||
        hasCondition(ctx, 'severePreeclampsiaEclampsia') ||
        isPregnantSevereCrisis(ctx) ||
        hasCondition(ctx, 'hypertensiveEncephalopathy') ||
        hasCondition(ctx, 'malignantHypertension') ||
        hasCondition(ctx, 'perioperativeHypertension');

      if (!isEmergency) {
        if (hasIschemicStroke) return null;
        if (sbp < sbpCrisis && dbp < dbpCrisis) return null;

        return {
          id: 'rec_htn_hypertensive_urgency',
          module: 'htn',
          tier: 'Cơn tăng huyết áp khẩn cấp (THA nặng không HMOD)',
          tierOrder: 1,
          action: 'CONTINUE',
          title: 'THA nặng không triệu chứng cơ quan đích: Tối ưu thuốc uống, KHÔNG hạ áp cấp đường tĩnh mạch',
          rationale: `Huyết áp tăng cao (${sbp}/${dbp} mmHg) nhưng KHÔNG có tổn thương cơ quan đích cấp tính (HMOD). Theo AHA/ACC 2025 (COR 3: No Benefit / Harm) và VSH 2022, không truyền thuốc hạ áp tĩnh mạch hay cho liều tải đường uống ngắt quãng ở bệnh nhân nội viện không có HMOD cấp. Khởi trị lại hoặc tối ưu thuốc uống tác dụng kéo dài, hạ áp từ từ và tuyệt đối cấm Nifedipine ngậm dưới lưỡi.`,
          gates: [
            {
              parameter: 'Tổn thương cơ quan đích cấp (HMOD)',
              passed: true,
              messageVi: 'Không có HMOD cấp: Cấm hạ áp nhanh đường tĩnh mạch hoặc Nifedipine dưới lưỡi'
            }
          ],
          citationIds: [
            'aha.acc.2025.severe_asymptomatic_inpatient',
            'vsh.htn.2022.emergency_malignant',
            'aha.acc.2025.nifedipine_no_sublingual'
          ],
          priority: 95
        };
      }

      // Phát khuyến cáo phân luồng ICU độc lập (KHÔNG gắn drugId để tuyệt đối không ghi đè đích HMOD chuyên biệt trong merge.ts)
      return {
        id: 'rec_htn_hypertensive_emergency_triage',
        module: 'htn',
        tier: 'Phân luồng Cấp cứu Tăng huyết áp (ICU)',
        tierOrder: 0,
        action: 'REFER',
        title: 'CẤP CỨU TĂNG HUYẾT ÁP CÓ HMOD: Nhập Hồi sức tích cực (ICU) & Theo dõi HA động mạch liên tục',
        rationale: `Xác nhận bệnh cảnh Cấp cứu tăng huyết áp có tổn thương cơ quan đích cấp tính (HA hiện tại ${sbp}/${dbp} mmHg). Chỉ định nhập đơn vị Hồi sức tích cực (ICU/CCU), đặt catheter động mạch theo dõi huyết áp liên tục và chuẩn độ thuốc tĩnh mạch qua bơm tiêm điện theo đúng đích sinh lý bệnh của cơ quan đích bị tổn thương.`,
        gates: [
          {
            parameter: 'Tổn thương cơ quan đích cấp (HMOD)',
            passed: false,
            messageVi: 'Có HMOD cấp: Nhập ICU theo dõi huyết áp xâm lấn và truyền thuốc tĩnh mạch chuẩn độ'
          }
        ],
        citationIds: [
          'aha.acc.2025.emergency_compelling_rec2',
          'aha.acc.2025.emergency_general_rec3',
          'vsh.htn.2022.emergency_malignant'
        ],
        priority: 96
      };
    },
    citationIds: ['aha.acc.2025.emergency_compelling_rec2', 'aha.acc.2025.severe_asymptomatic_inpatient']
  }
];
