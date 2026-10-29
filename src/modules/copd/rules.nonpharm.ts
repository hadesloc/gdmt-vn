import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  COPD_PROFILES,
  getAbgPh,
  getAbgPaco2,
  getRestingSpo2,
  getHospExac,
  hasWeakInspiratoryFlow,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  hasConfirmedCopdSpirometry,
  hasConfirmedStableCopd,
  isHighSymptomsConfirmed,
  isGroupEConfirmed,
} from './helpers';
import { copdNonpharmPreventionRules } from './rules.nonpharm.prevention';

const copdNonpharmCoreRules: Rule[] = [
  {
    id: 'copd.nonpharm.pulmonary_rehabilitation',
    module: 'copd',
    nameVi: 'Chỉ định Phục hồi chức năng hô hấp toàn diện cho COPD Nhóm B & Nhóm E (hoặc sau nhập viện đợt cấp)',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.pulmonary_rehab_essential',
      'gold.copd.2026.pulmonary_rehab_post_discharge',
      'byt.copd.2026.pulmonary_rehab_benefits',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      return isHighSymptomsConfirmed(ctx) || isGroupEConfirmed(ctx);
    },
    produce: (ctx) => {
      const hosp = getHospExac(ctx);
      const postHospWeeks = thFor('duration_weeks', 'copd.rehab_post_discharge_weeks');
      const hasRecentHosp = hosp !== undefined && hosp >= thFor('hospitalizations', 'copd.exacerbation_high_risk');
      return {
        id: 'rec_copd_pulmonary_rehab',
        module: 'copd',
        tier: 'Điều trị không dùng thuốc',
        tierOrder: 4,
        action: 'REFER',
        title: hasRecentHosp
          ? `Chỉ định Phục hồi chức năng hô hấp sớm (khởi động trong vòng ${postHospWeeks} tuần sau xuất viện đợt cấp)`
          : 'Chỉ định chương trình Phục hồi chức năng hô hấp toàn diện (Nhóm B / Nhóm E)',
        rationale: `Theo GOLD 2026 (Evidence A) và BYT QĐ 2131/2026, phục hồi chức năng hô hấp (tập vận động sức bền – sức cơ, tập thở chúm môi – cơ hoành, dinh dưỡng và giáo dục tự quản lý) là can thiệp thiết yếu cho mọi bệnh nhân Nhóm B và Nhóm E giúp cải thiện rõ rệt khó thở, khả năng gắng sức, chất lượng cuộc sống và giảm tái nhập viện (đặc biệt hiệu quả khi triển khai trong ${postHospWeeks} tuần đầu sau xuất viện vì đợt cấp).`,
        gates: [],
        citationIds: [
          'gold.copd.2026.pulmonary_rehab_essential',
          'gold.copd.2026.pulmonary_rehab_post_discharge',
          'byt.copd.2026.pulmonary_rehab_benefits',
        ],
        priority: 73,
      };
    },
  },

  {
    id: 'copd.outpatient.home_niv',
    module: 'copd',
    nameVi: 'Chỉ định thông khí nhân tạo không xâm nhập tại nhà (Home NIV)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.home_niv', 'byt.copd.2026.home_niv_53'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      const ph = getAbgPh(ctx);
      if (ph !== undefined && ph <= thFor('abgPh', 'copd.niv_ph_cutoff')) return false;
      const hosp = getHospExac(ctx);
      if (hosp === undefined || hosp < thFor('hospitalizations', 'copd.exacerbation_high_risk')) return false;

      const paco2 = getAbgPaco2(ctx);
      if (paco2 === undefined) return false;
      const paco2Cut = thFor('abgPaco2', 'copd.home_niv_paco2_cutoff');
      return ctx.settings.profile === 'VN' ? paco2 >= paco2Cut : paco2 > paco2Cut;
    },
    produce: (ctx) => {
      const paco2 = getAbgPaco2(ctx)!;
      const paco2Cut = thFor('abgPaco2', 'copd.home_niv_paco2_cutoff');
      return {
        id: 'rec_copd_home_niv',
        module: 'copd',
        tier: 'Điều trị không dùng thuốc',
        tierOrder: 4,
        action: 'CONSIDER',
        title: `Cân nhắc Thông khí nhân tạo không xâm nhập tại nhà (Home NIV, PaCO₂ ${paco2} mmHg sau nhập viện)`,
        rationale: `Bệnh nhân COPD giai đoạn ổn định (không toan máu cấp) có tăng CO₂ máu ban ngày mạn tính dai dẳng (PaCO₂ ${paco2} mmHg so với mốc ${paco2Cut} mmHg) và tiền sử nhập viện vì suy hô hấp đợt cấp: Theo GOLD 2026 (PDF p. 89 / trang in 78) và BYT QĐ 2131/2026 (Mục 2.6b, trang in 17), đánh giá lại sau xuất viện 2–4 tuần để cài đặt thở máy không xâm nhập tại nhà (Home NIV/BiPAP) giúp kéo dài thời gian sống còn và giảm tái nhập viện.`,
        profileDiff: {
          INTL: `GOLD 2026 chỉ định Home NIV khi tăng CO₂ ban ngày dai dẳng (PaCO₂ > ${paco2Cut} mmHg), đánh giá sau đợt cấp nhập viện 2–4 tuần.`,
          VN: `BYT QĐ 2131/2026 (trang in 17) chỉ định BiPAP tại nhà khi PaCO₂ ban ngày ≥ ${paco2Cut} mmHg kèm tiền sử nhập viện gần đây.`,
          US: `GOLD 2026 / ATS khuyến cáo Home NIV ở COPD tăng CO₂ máu mạn tính nặng (PaCO₂ > ${paco2Cut} mmHg) sau nhập viện.`,
        },
        gates: [],
        citationIds: ['gold.copd.2026.home_niv', 'byt.copd.2026.home_niv_53'],
        priority: 72,
      };
    },
  },

  {
    id: 'copd.nonpharm.weak_inspiratory_flow_device',
    module: 'copd',
    nameVi: 'Tư vấn lựa chọn dụng cụ hít khi lưu lượng hít vào yếu',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.tiotropium_dose',
      'byt.copd.2026.discharge_checklist',
      'gold.copd.2026.dpi_inspiratory_flow_switch',
    ],
    when: (ctx) => {
      if (hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
      if (!hasConfirmedCopdSpirometry(ctx) && !isAcuteExacerbation(ctx)) return false;
      return hasWeakInspiratoryFlow(ctx);
    },
    produce: () => ({
      id: 'rec_copd_device_smi_spacer',
      module: 'copd',
      tier: 'Điều trị không dùng thuốc',
      tierOrder: 4,
      action: 'MONITOR',
      title: 'Lưu lượng hít yếu: Ưu tiên bình phun hạt mịn (SMI Respimat) hoặc bình xịt định liều (pMDI) kèm buồng đệm',
      rationale:
        'Bệnh nhân có lưu lượng hít vào đỉnh yếu hoặc khó phối hợp thao tác: Tránh dùng bình hít bột khô (DPI như Breezhaler, Ellipta, Turbuhaler, HandiHaler) vì không đủ lực hít phân tách hạt thuốc; ưu tiên bình phun sương hạt mịn chậm (Respimat) hoặc pMDI có buồng đệm (spacer) / máy khí dung.',
      gates: [],
      citationIds: [
        'byt.copd.2026.tiotropium_dose',
        'byt.copd.2026.discharge_checklist',
        'gold.copd.2026.dpi_inspiratory_flow_switch',
      ],
      priority: 62,
    }),
  },

  {
    id: 'copd.nonpharm.ltot_oxygen',
    module: 'copd',
    nameVi: 'Chỉ định oxy trị liệu dài hạn tại nhà (LTOT)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.ltot_criteria',
      'gold.copd.2026.ltot_pulmonary_hypertension',
      'byt.copd.2026.ltot_cor_pulmonale',
      'byt.copd.2026.ltot_target_spo2_90_92',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      const spo2 = getRestingSpo2(ctx);
      const pao2 = need(ctx, 'pao2');
      const hasCorPulm = Boolean(ctx.normalized.customInputs?.corPulmonaleOrPolycythemia);

      if (spo2 !== undefined && spo2 <= thFor('restingSpo2', 'copd.ltot_spo2_cutoff')) return true;
      if (pao2 !== undefined && pao2 <= thFor('pao2', 'copd.ltot_pao2_cutoff')) return true;
      if (hasCorPulm) {
        if (spo2 !== undefined && spo2 <= thFor('restingSpo2', 'copd.ltot_cor_pulmonale_spo2_upper')) return true;
        if (pao2 !== undefined && pao2 <= thFor('pao2', 'copd.ltot_pao2_cor_pulmonale_max')) return true;
      }
      return false;
    },
    produce: (ctx) => {
      const spo2 = getRestingSpo2(ctx);
      const pao2 = need(ctx, 'pao2');
      const hasCorPulm = Boolean(ctx.normalized.customInputs?.corPulmonaleOrPolycythemia);
      const spo2Cut = thFor('restingSpo2', 'copd.ltot_spo2_cutoff');
      const spo2CorUpper = thFor('restingSpo2', 'copd.ltot_cor_pulmonale_spo2_upper');
      const pao2Cut = thFor('pao2', 'copd.ltot_pao2_cutoff');
      const pao2CorMin = thFor('pao2', 'copd.ltot_cor_pulmonale_pao2_min');
      const pao2CorMax = thFor('pao2', 'copd.ltot_pao2_cor_pulmonale_max');
      const spo2Meets =
        spo2 !== undefined && (spo2 <= spo2Cut || (hasCorPulm && spo2 <= spo2CorUpper));
      const pao2Meets =
        pao2 !== undefined && (pao2 <= pao2Cut || (hasCorPulm && pao2 <= pao2CorMax));
      const valStr =
        pao2 !== undefined && spo2 !== undefined
          ? pao2Meets && !spo2Meets
            ? `PaO₂ ${pao2} mmHg [SpO₂ ${spo2}%]`
            : spo2Meets && !pao2Meets
              ? `SpO₂ ${spo2}% [PaO₂ ${pao2} mmHg]`
              : `PaO₂ ${pao2} mmHg, SpO₂ ${spo2}%`
          : pao2 !== undefined
            ? `PaO₂ ${pao2} mmHg`
            : `SpO₂ ${spo2}%`;
      const hctCut = thFor('hematocrit', 'copd.hematocrit_polycythemia_pct');
      const minHours = thFor('hoursPerDay', 'copd.ltot_min_hours_per_day');
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      const ltotTargetMin = thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff');
      const isSeverePrimary =
        (spo2 !== undefined && spo2 <= spo2Cut) ||
        (pao2 !== undefined && pao2 <= thFor('pao2', 'copd.ltot_pao2_cutoff'));

      const criteriaNote =
        hasCorPulm && !isSeverePrimary
          ? `giảm oxy máu mạn tính vừa (${valStr}) kèm tăng áp động mạch phổi / tâm phế mạn / suy tim phải / đa hồng cầu Hct > ${hctCut}% (tiêu chuẩn mở rộng PaO₂ ${pao2CorMin}–${pao2CorMax} mmHg hoặc SaO₂ ≤ ${spo2CorUpper}%)`
          : `giảm oxy máu mạn tính nặng khi nghỉ (${valStr}, ngưỡng chuẩn SpO₂ ≤ ${spo2Cut}% hoặc PaO₂ ≤ ${thFor('pao2', 'copd.ltot_pao2_cutoff')} mmHg)`;

      return {
        id: 'rec_copd_ltot',
        module: 'copd',
        tier: 'Điều trị không dùng thuốc',
        tierOrder: 4,
        action: 'START',
        title: `Chỉ định Oxy trị liệu dài hạn tại nhà (LTOT ≥ ${minHours} giờ/ngày) khi nghỉ (${valStr})`,
        rationale: `Bệnh nhân có ${criteriaNote}: Khuyến cáo thở oxy dài hạn tại nhà tối thiểu ≥ ${minHours} giờ/ngày (xác nhận lặp lại ở trạng thái ổn định và đánh giá lại sau 60–90 ngày), chỉnh lưu lượng oxy duy trì SpO₂ mục tiêu ≥ ${ltotTargetMin}% (thường giữ ${o2Min}–${o2Max}% nếu có nguy cơ tăng CO₂ máu) nhằm cải thiện sống còn và giảm áp lực động mạch phổi.`,
        gates: [],
        citationIds: [
          'gold.copd.2026.ltot_criteria',
          'gold.copd.2026.ltot_pulmonary_hypertension',
          'byt.copd.2026.ltot_cor_pulmonale',
          'byt.copd.2026.ltot_target_spo2_90_92',
        ],
        priority: 75,
      };
    },
  },
];

export const copdNonpharmRules: Rule[] = [...copdNonpharmCoreRules, ...copdNonpharmPreventionRules];
