import type { Rule } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  COPD_PROFILES,
  SYSTEMIC_STEROID_IDS,
  getFev1FvcRatio,
  getSmokingStatus,
  hasCurrentMed,
  hasAnyCurrentMed,
  hasOutpatientAcuteRespiratoryFailure,
  hasConfirmedStableCopd,
} from './helpers';

const BIOLOGIC_SET = new Set<string>(['dupilumab', 'dupixent', 'mepolizumab', 'nucala', 'benralizumab', 'fasenra']);

export const copdNonpharmPreventionRules: Rule[] = [
  {
    id: 'copd.nonpharm.smoking_cessation',
    module: 'copd',
    nameVi: 'Tư vấn và hỗ trợ dược lý cai thuốc lá tích cực (5A / 5R + NRT / Varenicline / Bupropion)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.smoking_cessation_pharmacotherapy',
      'gold.copd.2026.smoking_varenicline_bupropion',
      'byt.copd.2026.smoking_cessation_section_2_2_2',
      'byt.copd.2026.discharge_checklist',
      'byt.copd.2023.severe_renal_crcl30',
    ],
    when: (ctx) => {
      if (hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
      const fev1Fvc = getFev1FvcRatio(ctx);
      if (fev1Fvc !== undefined && fev1Fvc >= thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic')) return false;
      return getSmokingStatus(ctx) === 'current';
    },
    produce: (ctx) => {
      const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
      const ci = ctx.normalized.customInputs || {};
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const renalCut30 = thFor('egfr', 'copd.lama_severe_renal_egfr');

      const nCond = (ctx.normalized.conditions || {}) as Record<string, unknown>;
      const hasSeizureRisk =
        Boolean(cond.seizure) ||
        Boolean(cond.epilepsy) ||
        Boolean(nCond.seizure) ||
        Boolean(nCond.epilepsy) ||
        Boolean(cond.eatingDisorder) ||
        Boolean(ci.seizureHistory);
      const onTheoOrSteroid =
        hasCurrentMed(ctx, 'theophylline') ||
        hasCurrentMed(ctx, 'aminophylline') ||
        hasAnyCurrentMed(ctx, SYSTEMIC_STEROID_IDS) !== undefined;
      const hasSevereRenal =
        Boolean(cond.dialysis) ||
        hasCondition(ctx, 'onDialysis') ||
        Boolean(cond.onDialysis) ||
        (egfr !== undefined && egfr < renalCut30) ||
        (crcl !== undefined && crcl < renalCut30);
      const hasUnstableCv =
        hasCondition(ctx, 'acs') ||
        hasCondition(ctx, 'recentAcs') ||
        Boolean(cond.acuteCoronarySyndrome) ||
        Boolean(cond.unstableAngina) ||
        Boolean(cond.recentMi) ||
        Boolean(ci.recentMi);

      const warnings: string[] = [];
      if (hasSeizureRisk || onTheoOrSteroid) {
        warnings.push(
          hasSeizureRisk
            ? 'CHỐNG CHỈ ĐỊNH Bupropion SR: Bệnh nhân có tiền sử co giật / động kinh / rối loạn ăn uống làm tăng nguy cơ co giật; ưu tiên tư vấn hành vi kết hợp Varenicline hoặc liệu pháp thay thế Nicotine (NRT).'
            : 'Thận trọng cao / tránh phối hợp Bupropion SR khi đang dùng Theophylline/Aminophylline hoặc Corticosteroid toàn thân do cộng gộp tác dụng làm giảm ngưỡng co giật.'
        );
      } else {
        warnings.push(
          'Rà soát an toàn trước khi kê thuốc cai thuốc lá: Chống chỉ định Bupropion SR nếu có tiền sử co giật/động kinh hoặc rối loạn ăn uống; theo dõi triệu chứng tâm thần kinh khi dùng Varenicline/Bupropion.'
        );
      }

      if (hasSevereRenal) {
        warnings.push(
          `Suy thận nặng (eGFR/CrCl < ${renalCut30} mL/phút hoặc lọc máu): Bắt buộc giảm liều Varenicline theo độ thanh thải thận và tránh Bupropion liều chuẩn tích lũy chất chuyển hóa.`
        );
      }

      if (hasUnstableCv) {
        warnings.push(
          'Bệnh mạch vành cấp / đau thắt ngực không ổn định / nhồi máu cơ tim mới: Thận trọng cao khi dùng liệu pháp thay thế Nicotine (NRT) do tác dụng giao cảm gây nhịp nhanh và co mạch; hội chẩn tim mạch trước khi kê.'
        );
      }

      return {
        id: 'rec_copd_smoking_cessation',
        module: 'copd',
        tier: 'Điều trị không dùng thuốc',
        tierOrder: 4,
        action: 'REFER',
        title: 'Tư vấn và hỗ trợ điều trị cai thuốc lá tích cực (Chiến lược 5A / 5R + Dược lý cai thuốc)',
        rationale:
          'Theo GOLD 2026 (Chapter 3) và BYT QĐ 2131/2026 (Mục 2.2.2), cai thuốc lá là can thiệp có ảnh hưởng lớn nhất làm chậm tốc độ suy giảm FEV₁ và giảm tử vong ở người bệnh COPD. Phối hợp tư vấn hành vi chuyên sâu (5A/5R) với thuốc hỗ trợ cai thuốc lá hàng đầu (Varenicline, Bupropion SR hoặc liệu pháp thay thế Nicotine NRT phối hợp miếng dán + dạng tác dụng nhanh) giúp tăng đáng kể tỷ lệ cai thuốc thành công dài hạn.',
        warnings,
        gates: [],
        citationIds: [
          'gold.copd.2026.smoking_cessation_pharmacotherapy',
          'gold.copd.2026.smoking_varenicline_bupropion',
          'byt.copd.2026.smoking_cessation_section_2_2_2',
          'byt.copd.2026.discharge_checklist',
          ...(hasSevereRenal ? ['byt.copd.2023.severe_renal_crcl30'] : []),
        ],
        priority: 95,
      };
    },
  },

  {
    id: 'copd.nonpharm.vaccinations',
    module: 'copd',
    nameVi: 'Tiêm chủng phòng ngừa đầy đủ theo khuyến cáo GOLD 2026 (giai đoạn COPD ổn định)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.vaccination_recommendations',
      'gold.copd.2026.vaccination_covid19',
      'gold.copd.2026.vaccination_tdap_shingles',
    ],
    when: (ctx) => hasConfirmedStableCopd(ctx),
    produce: (ctx) => {
      const onImmunomodulator =
        hasAnyCurrentMed(ctx, SYSTEMIC_STEROID_IDS) !== undefined ||
        hasAnyCurrentMed(ctx, BIOLOGIC_SET) !== undefined;
      const warnings: string[] = [
        'Đối với phòng Zona (Shingles): Khuyến cáo dùng vắc xin Zona tái tổ hợp bất hoạt (RZV / Shingrix – không chứa virus sống); tránh vắc xin Zona sống giảm độc lực (ZVL), đặc biệt ở người cao tuổi suy giảm miễn dịch hoặc đang dùng corticoid toàn thân / thuốc sinh học.',
      ];
      if (onImmunomodulator) {
        warnings.unshift(
          'Bệnh nhân đang dùng Corticosteroid toàn thân hoặc thuốc sinh học (Dupilumab / Mepolizumab): Chỉ tiêm các vắc xin bất hoạt / tái tổ hợp / giải độc tố / mRNA; chống chỉ định tiêm vắc xin sống giảm độc lực.'
        );
      }
      return {
        id: 'rec_copd_vaccinations',
        module: 'copd',
        tier: 'Dự phòng & Tiêm chủng',
        tierOrder: 5,
        action: 'MONITOR',
        title: 'Tiêm chủng đầy đủ: Cúm, Phế cầu, COVID-19, RSV, Ho gà (Tdap) & Zona tái tổ hợp (Shingrix)',
        rationale:
          'Theo GOLD 2026 (Chapter 3): Ở giai đoạn COPD ổn định, khuyến cáo tiêm vắc xin cúm hằng năm; vắc xin phế cầu liên hợp (PCV20/PCV21 hoặc PCV15 nối tiếp PPSV23); vắc xin phòng COVID-19 cập nhật theo khuyến cáo WHO/CDC; vắc xin RSV (≥ 60 tuổi hoặc có bệnh tim phổi mạn); vắc xin Tdap (phòng ho gà nếu chưa tiêm lúc thiếu niên) và vắc xin Zona tái tổ hợp bất hoạt (Shingrix ≥ 50 tuổi) nhằm giảm nhiễm trùng hô hấp dưới nặng, đợt cấp nhập viện và tử vong.',
        warnings,
        gates: [],
        citationIds: [
          'gold.copd.2026.vaccination_recommendations',
          'gold.copd.2026.vaccination_covid19',
          'gold.copd.2026.vaccination_tdap_shingles',
        ],
        priority: 50,
      };
    },
  },

  {
    id: 'copd.nonpharm.lung_cancer_ldct_screening',
    module: 'copd',
    nameVi: 'Tầm soát ung thư phổi hằng năm bằng CT ngực liều thấp (LDCT) ở nhóm nguy cơ cao hút thuốc',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.lung_cancer_ldct_screening', 'gold.copd.2026.lung_cancer_ldct_uspstf'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      const age = need(ctx, 'age');
      const packYears = need(ctx, 'packYears');
      const smoke = getSmokingStatus(ctx);
      if (age === undefined || packYears === undefined) return false;
      if (smoke !== 'current' && smoke !== 'former') return false;
      const minAge = thFor('age', 'copd.ldct_age_min');
      const maxAge = thFor('age', 'copd.ldct_age_max');
      const minPackYears = thFor('packYears', 'copd.ldct_pack_years_min');
      const maxQuitYears = thFor('duration_years', 'copd.ldct_quit_years_max');
      if (age < minAge || age > maxAge || packYears < minPackYears) return false;
      if (smoke === 'former') {
        const rawQuit =
          ctx.normalized.customInputs?.smokingQuitYears ?? ctx.patient.customInputs?.smokingQuitYears;
        const quitYears = typeof rawQuit === 'number' && Number.isFinite(rawQuit) ? rawQuit : undefined;
        if (quitYears !== undefined && quitYears > maxQuitYears) return false;
      }
      return true;
    },
    produce: (ctx) => {
      const packYears = need(ctx, 'packYears')!;
      const smoke = getSmokingStatus(ctx);
      const minAge = thFor('age', 'copd.ldct_age_min');
      const maxAge = thFor('age', 'copd.ldct_age_max');
      const minPackYears = thFor('packYears', 'copd.ldct_pack_years_min');
      const maxQuitYears = thFor('duration_years', 'copd.ldct_quit_years_max');
      const rawQuit =
        ctx.normalized.customInputs?.smokingQuitYears ?? ctx.patient.customInputs?.smokingQuitYears;
      const quitYears = typeof rawQuit === 'number' && Number.isFinite(rawQuit) ? rawQuit : undefined;

      const warnings: string[] = [];
      if (smoke === 'former' && quitYears === undefined) {
        warnings.push(
          `Bệnh nhân đã cai thuốc lá nhưng chưa ghi nhận số năm đã cai (smokingQuitYears): Cần xác nhận thời gian cai thuốc ≤ ${maxQuitYears} năm trước khi chỉ định chụp LDCT hằng năm theo tiêu chuẩn USPSTF / GOLD 2026.`
        );
      }

      return {
        id: 'rec_copd_ldct_screening',
        module: 'copd',
        tier: 'Dự phòng & Tiêm chủng',
        tierOrder: 5,
        action: 'CONSIDER',
        title: `Tầm soát ung thư phổi hằng năm bằng CT ngực liều thấp (LDCT – tiền sử ${packYears} gói-năm)`,
        rationale: `Theo GOLD 2026 và BYT QĐ 2131/2026 (USPSTF), bệnh nhân COPD tuổi ${minAge}–${maxAge} có tiền sử hút thuốc ≥ ${minPackYears} gói-năm (đang hút hoặc đã cai trong vòng ≤ ${maxQuitYears} năm) có nguy cơ rất cao mắc ung thư phổi và được khuyến cáo chụp CT ngực liều thấp (LDCT) hằng năm để phát hiện sớm giảm tử vong.`,
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: ['byt.copd.2026.lung_cancer_ldct_screening', 'gold.copd.2026.lung_cancer_ldct_uspstf'],
        priority: 46,
      };
    },
  },

  {
    id: 'copd.nonpharm.aatd_screening',
    module: 'copd',
    nameVi: 'Tầm soát thiếu hụt Alpha-1 Antitrypsin (AATD) 1 lần cho mọi bệnh nhân COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.aatd_screening_all'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      const ci = ctx.normalized.customInputs || {};
      const pCi = ctx.patient.customInputs || {};
      if (Boolean(ci.aatdTested) || Boolean(pCi.aatdTested)) return false;
      return true;
    },
    produce: (ctx) => {
      const age = need(ctx, 'age');
      const smoke = getSmokingStatus(ctx);
      const youngCut = thFor('age', 'copd.ldct_age_min');
      const highSuspicion = (age !== undefined && age < youngCut) || smoke === 'never';
      return {
        id: 'rec_copd_aatd_screening',
        module: 'copd',
        tier: 'Dự phòng & Tiêm chủng',
        tierOrder: 5,
        action: 'CONSIDER',
        title: highSuspicion
          ? 'Chỉ định xét nghiệm định lượng Alpha-1 Antitrypsin (AATD) huyết thanh (nghi ngờ cao: COPD khởi phát trẻ / không hút thuốc)'
          : 'Xét nghiệm định lượng Alpha-1 Antitrypsin (AATD) huyết thanh 1 lần cho mọi bệnh nhân COPD (WHO / GOLD 2026)',
        rationale: `Theo WHO và GOLD 2026 (Chapter 2 & Chapter 3), mọi bệnh nhân được chẩn đoán xác định COPD đều cần được định lượng nồng độ Alpha-1 Antitrypsin huyết thanh tối thiểu 1 lần trong đời bất kể tuổi hay tiền sử hút thuốc${highSuspicion ? ' – đặc biệt bắt buộc cảnh giác cao ở bệnh nhân COPD khởi phát sớm hoặc không/ít hút thuốc lá kèm khí phế thũng thùy dưới' : ''} nhằm phát hiện bệnh lý di truyền AATD, tư vấn gia đình và xem xét điều trị tăng cường Alpha-1 proteinase inhibitor khi có chỉ định.`,
        gates: [],
        citationIds: ['gold.copd.2026.aatd_screening_all'],
        priority: highSuspicion ? 52 : 45,
      };
    },
  },
];
