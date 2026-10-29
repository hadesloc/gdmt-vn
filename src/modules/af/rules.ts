/**
 * Tập quy tắc tổng hợp Module Rung nhĩ (AF) theo khung AF-CARE (ESC 2024 & ACC/AHA 2023)
 * - [C] Comorbidities & Risk Factors
 * - [A] Avoid Stroke & Thromboembolism (Contra, Renal/Hepatic/DDI, Transitions, Risk, Dosing & Antiplatelet)
 * - [R] Reduce Symptoms by Rate & Rhythm Control (Rate Safety, Rate Control, Rate HFrEF, Rhythm Safety, Rhythm Strategy, Inpatient Acute, Periprocedural)
 * - [E] Evaluation & Dynamic Reassessment
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import { isAfActive, isUnstableHemodynamics } from './rulesHelpers';
import { afOacContraRules } from './rulesOacContra';
import { afOacRenalHepaticDdiRules } from './rulesOacRenalHepaticDdi';
import { afOacTransitionRules } from './rulesOacTransitions';
import { afOacRiskRules } from './rulesOacRisk';
import { afOacDosingAndApRules } from './rulesOacDosingAndAp';
import { afRateSafetyRules } from './rulesRateSafety';
import { afRateControlRules } from './rulesRateControl';
import { afRateHfrefRules } from './rulesRateHfref';
import { afRhythmSafetyRules } from './rulesRhythmSafety';
import { afRhythmStrategyRules } from './rulesRhythmStrategy';
import { afRhythmAblationRules } from './rulesRhythmAblation';
import { afInpatientAcuteRules } from './rulesInpatientAcute';
import { afPeriproceduralRules } from './rulesPeriprocedural';

export const afRules: Rule[] = [
  // 1. AF-CARE [C]: Quản lý toàn diện bệnh đồng mắc và yếu tố nguy cơ (tạm ẩn trong sốc huyết động cấp để ưu tiên hồi sức)
  {
    id: 'af.care.comorbidities',
    module: 'af',
    nameVi: 'AF-CARE [C]: Quản lý toàn diện bệnh đồng mắc và yếu tố nguy cơ (Class I ESC 2024)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && !isUnstableHemodynamics(ctx),
    produce: (ctx): Recommendation => {
      const activeComorbidities: string[] = [];
      if (hasCondition(ctx, 'htn')) activeComorbidities.push('Kiểm soát chặt huyết áp để giảm tái phát rung nhĩ và xuất huyết nội sọ');
      if (hasCondition(ctx, 'hf')) activeComorbidities.push('Tối ưu hóa điều trị nền tảng suy tim (SGLT2i, ARNI/ACEi, MRA, Chẹn beta)');
      if (hasCondition(ctx, 'dm')) activeComorbidities.push('Kiểm soát đường huyết tối ưu (ưu tiên SGLT2i / Metformin)');
      if (hasCondition(ctx, 'obesity') || (typeof ctx.derived.bmi === 'number' && ctx.derived.bmi >= 27)) { // qa-allow: index - Mốc thừa cân/béo phì tư vấn giảm cân AF-CARE
        activeComorbidities.push('Giảm ≥ 10% cân nặng cơ thể giúp giảm gánh nặng triệu chứng và tiến triển rung nhĩ');
      }
      if (hasCondition(ctx, 'snoringOsa')) activeComorbidities.push('Tầm soát và điều trị hội chứng ngưng thở khi ngủ (OSA)');
      if (hasCondition(ctx, 'smoker')) activeComorbidities.push('Tư vấn cai thuốc lá và kiêng rượu bia (≤ 3 đơn vị cồn/tuần)');

      const detail =
        activeComorbidities.length > 0
          ? activeComorbidities.join(' · ')
          : 'Kiểm soát huyết áp, cân nặng, đường huyết, suy tim, ngưng thở khi ngủ và hạn chế tối đa rượu bia';

      return {
        id: 'rec_af_care_comorbidities',
        module: 'af',
        tier: 'AF-CARE · [C] Bệnh đồng mắc & Nguy cơ',
        tierOrder: 1,
        action: 'MONITOR',
        dose: undefined,
        title: 'Quản lý tích cực các bệnh đồng mắc & yếu tố nguy cơ tim mạch (Trụ cột [C] — Class I)',
        rationale: `Khuyến cáo Class I (ESC 2024 Section 5 & ACC/AHA 2023): Xác định và điều trị tích cực yếu tố nguy cơ giúp giảm gánh nặng cơn và phòng ngừa tái cấu trúc tâm nhĩ. Trọng tâm: ${detail}.`,
        gates: [],
        citationIds: ['esc.af.2024.comorbidities_care_c', 'esc.af.2024.weight_loss_obesity', 'esc.af.2024.alcohol_reduction'],
        priority: 60
      };
    },
    citationIds: ['esc.af.2024.comorbidities_care_c', 'esc.af.2024.weight_loss_obesity', 'esc.af.2024.alcohol_reduction']
  },

  // 2. AF-CARE [A]: Dự phòng đột quỵ & thuyên tắc mạch
  ...afOacContraRules,
  ...afOacRenalHepaticDdiRules,
  ...afOacTransitionRules,
  ...afOacRiskRules,
  ...afOacDosingAndApRules,

  // 3. AF-CARE [R]: Kiểm soát tần số, kiểm soát nhịp, cấp cứu nội viện & chu phẫu
  ...afRateSafetyRules,
  ...afRateControlRules,
  ...afRateHfrefRules,
  ...afRhythmSafetyRules,
  ...afRhythmStrategyRules,
  ...afRhythmAblationRules,
  ...afInpatientAcuteRules,
  ...afPeriproceduralRules,

  // 4. AF-CARE [E]: Tái đánh giá động chức năng thận, nguy cơ chảy máu & đột quỵ
  {
    id: 'af.care.reassessment_e',
    module: 'af',
    nameVi: 'AF-CARE [E]: Tái đánh giá động định kỳ nguy cơ đột quỵ, chảy máu và độ thanh thải thận CrCl',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && !isUnstableHemodynamics(ctx),
    produce: (ctx): Recommendation => {
      const crcl = need(ctx, 'crcl');
      const modCrcl = thFor('crcl', 'af.crcl.moderate_impairment_50');

      const renalSchedule =
        crcl === undefined
          ? 'CẦN XÉT NGHIỆM NGAY Creatinin huyết thanh nền và tính CrCl (Cockcroft-Gault) trước/khi điều trị thuốc chống đông hoặc thuốc chống loạn nhịp'
          : crcl < modCrcl
          ? `Xét nghiệm lại Creatinin / CrCl định kỳ mỗi ${Math.max(3, Math.round(crcl / 10))} tháng (quy tắc CrCl/10 cho bệnh nhân suy giảm chức năng thận)` // qa-allow: ui-step - Công thức lịch hẹn tái khám thận EHRA CrCl/10 tháng
          : 'Đánh giá lại chức năng thận (CrCl Cockcroft-Gault), công thức máu và men gan ít nhất mỗi 6–12 tháng';

      return {
        id: 'rec_af_care_reassessment_e',
        module: 'af',
        tier: 'AF-CARE · [E] Theo dõi & Tái đánh giá động',
        tierOrder: 4,
        action: 'MONITOR',
        dose: undefined,
        title:
          crcl === undefined
            ? 'Xét nghiệm ngay Creatinin máu / CrCl nền & Thiết lập lịch tái đánh giá động (Trụ cột [E])'
            : 'Tái đánh giá động định kỳ: Chức năng thận (CrCl), Công thức máu, Tuân thủ thuốc & Điểm CHA₂DS₂-VA (Trụ cột [E])',
        rationale: `Khuyến cáo Class I, Mức B (ESC 2024 Section 8): Tái đánh giá định kỳ 6 tháng sau lần khám đầu và ít nhất hàng năm (hoặc sớm hơn khi thay đổi lâm sàng). Lịch theo dõi thận: ${renalSchedule}; đồng thời điều chỉnh các yếu tố nguy cơ chảy máu có thể thay đổi được (huyết áp chưa kiểm soát, NSAID, rượu bia).`,
        gates: [],
        citationIds: ['esc.af.2024.dynamic_reassessment_e'],
        priority: 40
      };
    },
    citationIds: ['esc.af.2024.dynamic_reassessment_e']
  }
];
