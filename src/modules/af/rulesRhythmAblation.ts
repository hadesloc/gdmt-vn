/**
 * Quy tắc Triệt đốt Rung nhĩ qua ống thông (Catheter Ablation), Chiến lược Kiểm soát Nhịp sớm (EAST-AFNET 4)
 * và Xử trí Cường giáp kèm Rung nhĩ [R]
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  AAD_IDS,
  computeAfStrokeScore,
  getEhraNumeric,
  hasCurrentMed,
  hasHyperthyroidism,
  hasWpw,
  isAfActive,
  isUnstableHemodynamics
} from './rulesHelpers';

const TIER_R_RHYTHM = 'AF-CARE · [R] Kiểm soát nhịp';

export const afRhythmAblationRules: Rule[] = [
  // 1. Triệt đốt rung nhĩ qua ống thông (Catheter Ablation: HFrEF, Paroxysmal có triệu chứng, Persistent kháng trị / đầu tay)
  {
    id: 'af.rhythm.catheter_ablation',
    module: 'af',
    nameVi: 'AF-CARE [R]: Chỉ định triệt đốt rung nhĩ qua ống thông (Catheter Ablation)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || hasCondition(ctx, 'pregnant') || isUnstableHemodynamics(ctx)) return false;
      const afType = ctx.patient.customInputs?.afType;
      if (afType === 'permanent') return false;
      const ef = need(ctx, 'lvef');
      const isHfRef = ef !== undefined && ef <= thFor('lvef', 'af.rate.lvef_cutoff');
      const ehra = getEhraNumeric(ctx);
      const isSymptomatic = ehra === undefined ? afType === 'paroxysmal' : ehra >= 2; // qa-allow: index - EHRA >= 2 xác định rung nhĩ có triệu chứng
      return isHfRef || (isSymptomatic && (afType === 'paroxysmal' || afType === 'persistent'));
    },
    produce: (ctx): Recommendation => {
      const ef = need(ctx, 'lvef');
      const efCutoff = thFor('lvef', 'af.rate.lvef_cutoff');
      const isHfRef = ef !== undefined && ef <= efCutoff;
      const afType = ctx.patient.customInputs?.afType;
      const onAad = hasCurrentMed(ctx, AAD_IDS);

      if (isHfRef) {
        return {
          id: 'rec_af_ablation_hfref',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: 'REFER',
          dose: undefined,
          title: 'Chuyển chuyên khoa Nhịp học xem xét Triệt đốt rung nhĩ qua ống thông ở bệnh nhân HFrEF',
          rationale:
            'Khuyến cáo Class I-B / Class IIa-B (ESC 2024 Rec Table 19 / CASTLE-AF): Triệt đốt rung nhĩ qua catheter ở bệnh nhân suy tim giảm phân suất tống máu giúp phục hồi LVEF (đặc biệt bệnh cơ tim do nhịp nhanh), giảm nhập viện suy tim và cải thiện sống còn.',
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
          citationIds: ['esc.af.2024.catheter_ablation_hfref', 'esc.af.2024.catheter_ablation_hfref_survival'],
          priority: 85
        };
      }

      if (afType === 'persistent') {
        return {
          id: 'rec_af_ablation_persistent',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: 'CONSIDER',
          dose: undefined,
          title: onAad
            ? 'Rung nhĩ bền bỉ còn triệu chứng dù đang dùng AAD: Khuyến cáo Triệt đốt qua ống thông (Class I-A)'
            : 'Rung nhĩ bền bỉ có triệu chứng: Cân nhắc Triệt đốt qua ống thông trong quyết định đồng thuận (Class IIb-C)',
          rationale: onAad
            ? 'Khuyến cáo Class I, Mức A (ESC 2024 Rec Table 19): Triệt đốt qua ống thông được khuyến cáo bắt buộc ở bệnh nhân rung nhĩ kịch phát hoặc bền bỉ kháng trị / không dung nạp thuốc chống loạn nhịp nhóm I hoặc III.'
            : 'Khuyến cáo Class IIb, Mức C (ESC 2024 Rec Table 19): Có thể cân nhắc triệt đốt qua ống thông như lựa chọn đầu tay ở bệnh nhân chọn lọc mắc rung nhĩ bền bỉ có triệu chứng.',
          gates: [],
          citationIds: ['esc.af.2024.catheter_ablation_aad_refractory', 'esc.af.2024.catheter_ablation_persistent_firstline'],
          priority: 76
        };
      }

      return {
        id: 'rec_af_ablation_paroxysmal',
        module: 'af',
        tier: TIER_R_RHYTHM,
        tierOrder: 3,
        action: 'CONSIDER',
        dose: undefined,
        title: 'Triệt đốt qua ống thông (PVI) là lựa chọn đầu tay cho Rung nhĩ kịch phát có triệu chứng (Class I-A)',
        rationale:
          'Khuyến cáo Class I, Mức A (ESC 2024 Rec Table 19): Cô lập tĩnh mạch phổi qua ống thông là lựa chọn hàng đầu trong chiến lược kiểm soát nhịp đồng thuận ở bệnh nhân rung nhĩ kịch phát có triệu chứng.',
        gates: [],
        citationIds: ['esc.af.2024.catheter_ablation_firstline', 'esc.af.2024.catheter_ablation_aad_refractory'],
        priority: 75
      };
    },
    citationIds: ['esc.af.2024.catheter_ablation_hfref', 'esc.af.2024.catheter_ablation_firstline']
  },

  // 2. Chiến lược kiểm soát nhịp sớm theo thử nghiệm EAST-AFNET 4 (Class IIa-B)
  {
    id: 'af.rhythm.early_rhythm_east',
    module: 'af',
    nameVi: 'AF-CARE [R]: Xem xét kiểm soát nhịp sớm ở rung nhĩ mới chẩn đoán có bệnh tim mạch đi kèm (EAST-AFNET 4)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || hasCondition(ctx, 'pregnant') || isUnstableHemodynamics(ctx)) return false;
      if (ctx.patient.customInputs?.afType !== 'first_diagnosed') return false;
      const age = need(ctx, 'age');
      if (age === undefined) return false;
      return computeAfStrokeScore(ctx, age).scoreVa >= thFor('cha2ds2va_score', 'af.cha2ds2va.intermediate_risk');
    },
    produce: (): Recommendation => ({
      id: 'rec_af_early_rhythm_east',
      module: 'af',
      tier: TIER_R_RHYTHM,
      tierOrder: 3,
      action: 'CONSIDER',
      dose: undefined,
      title: 'Rung nhĩ mới chẩn đoán kèm yếu tố nguy cơ tim mạch: Nên xem xét chiến lược Kiểm soát nhịp sớm (EAST-AFNET 4, Class IIa-B)',
      rationale:
        'Khuyến cáo Class IIa, Mức B (ESC 2024 Rec Table 15 / EAST-AFNET 4): Triển khai kiểm soát nhịp trong vòng 12 tháng đầu sau chẩn đoán ở bệnh nhân rung nhĩ có yếu tố nguy cơ huyết khối giúp giảm tử vong tim mạch và đột quỵ.',
      gates: [],
      citationIds: ['esc.af.2024.early_rhythm_control_east'],
      priority: 72
    }),
    citationIds: ['esc.af.2024.early_rhythm_control_east']
  },

  // 3. Cường giáp / Nhiễm độc giáp kèm rung nhĩ
  {
    id: 'af.rhythm.hyperthyroidism_control',
    module: 'af',
    nameVi: 'AF-CARE [C/R]: Kiểm soát bình giáp trước khi chuyển nhịp chủ động và tránh Amiodarone ở bệnh nhân cường giáp',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && hasHyperthyroidism(ctx),
    produce: (): Recommendation => ({
      id: 'rec_af_hyperthyroidism_control',
      module: 'af',
      tier: TIER_R_RHYTHM,
      tierOrder: 3,
      action: 'CONSIDER',
      dose: undefined,
      title: 'Rung nhĩ do Cường giáp: Điều trị đạt bình giáp trước chuyển nhịp chủ động, dùng Chẹn beta kiểm soát tần số & tránh Amiodarone',
      rationale:
        'ESC 2024 & ACC/AHA 2023: Nhiễm độc giáp chưa kiểm soát khiến chuyển nhịp dễ tái phát sớm; ưu tiên thuốc kháng giáp đạt bình giáp (nhiều bệnh nhân tự về nhịp xoang), kiểm soát tần số bằng chẹn beta và tránh tuyệt đối Amiodarone.',
      gates: [],
      citationIds: ['esc.af.2024.hyperthyroidism_af'],
      priority: 86
    }),
    citationIds: ['esc.af.2024.hyperthyroidism_af']
  }
];
