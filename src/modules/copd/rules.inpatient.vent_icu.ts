import type { Rule, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor, thr } from '../../kb-types';
import {
  COPD_PROFILES,
  getRestingSpo2,
  getAbgPh,
  getAbgPaco2,
  getRespiratoryRate,
  hasSupplementalOxygen,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
} from './helpers';

function hasNivContraindication(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  const sbp = need(ctx, 'sbp');
  const hypotension = sbp !== undefined && sbp < thFor('sbp', 'copd.hypotension_sbp_cutoff');
  return (
    Boolean(ci.alteredMentalStatus) ||
    hypotension ||
    Boolean(ci.respiratoryArrest) ||
    Boolean(ci.nivContraindicated)
  );
}

function hasClinicalWorkOfBreathingOrRefractoryHypoxemia(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  const spo2 = getRestingSpo2(ctx);
  const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
  const refractoryHypoxemia =
    hasSupplementalOxygen(ctx) && spo2 !== undefined && spo2 < o2Min;
  return Boolean(ci.accessoryMuscleUse) || refractoryHypoxemia;
}

export const copdInpatientVentIcuRules: Rule[] = [
  {
    id: 'copd.inpatient.niv_bipap',
    module: 'copd',
    nameVi: 'Chỉ định hoặc chống chỉ định thông khí nhân tạo không xâm nhập (NIV/BiPAP)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.niv_indications',
      'byt.copd.2026.niv_contraindications_imv',
      'byt.copd.2026.niv_contra_shock_appendix5',
    ],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      if (ph === undefined || paco2 === undefined) return false;
      const phCut = thFor('abgPh', 'copd.niv_ph_cutoff');
      const paco2Cut = thFor('abgPaco2', 'copd.niv_paco2_cutoff');
      if (ph < phCut && paco2 < paco2Cut) return false;

      const hasRespiratoryAcidosis = ph <= phCut && paco2 >= paco2Cut;
      return hasRespiratoryAcidosis || hasClinicalWorkOfBreathingOrRefractoryHypoxemia(ctx);
    },
    produce: (ctx) => {
      const ph = getAbgPh(ctx)!;
      const paco2 = getAbgPaco2(ctx)!;
      const spo2 = getRestingSpo2(ctx);
      const phCut = thFor('abgPh', 'copd.niv_ph_cutoff');
      const paco2Cut = thFor('abgPaco2', 'copd.niv_paco2_cutoff');
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const ci = ctx.normalized.customInputs || {};
      const hasRespAcidosis = ph <= phCut && paco2 >= paco2Cut;

      if (hasNivContraindication(ctx)) {
        return {
          id: 'rec_copd_inpatient_niv',
          module: 'copd',
          tier: 'Hồi sức tích cực',
          tierOrder: 0,
          action: 'AVOID',
          dose: undefined,
          title:
            'CHỐNG CHỈ ĐỊNH thở máy không xâm nhập (NIV / BiPAP) do ngừng thở / rối loạn ý thức / tụt huyết áp sốc – Chuẩn bị đặt nội khí quản thở máy xâm nhập (IMV) khẩn cấp',
          rationale: `Người bệnh suy hô hấp đợt cấp (pH ${ph}, PaCO₂ ${paco2} mmHg) hiện có chống chỉ định tuyệt đối của NIV (ngừng thở, rối loạn tri giác không bảo vệ được đường thở hoặc tụt huyết áp/sốc). Theo GOLD 2026 và BYT QĐ 2131/2026 (Mục 3.4.5b & Phụ lục 5), tuyệt đối không trì hoãn bằng NIV mà phải chuyển ICU và đặt nội khí quản thở máy xâm nhập (IMV) khẩn cấp.`,
          gates: [],
          citationIds: [
            'byt.copd.2026.niv_indications',
            'byt.copd.2026.niv_contraindications_imv',
            'byt.copd.2026.niv_contra_shock_appendix5',
          ],
          priority: 104,
        };
      }

      const triggerDetail = hasRespAcidosis
        ? `toan hô hấp cấp pH ${ph} ≤ ${phCut}, PaCO₂ ${paco2} ≥ ${paco2Cut} mmHg`
        : Boolean(ci.accessoryMuscleUse)
          ? `khó thở nặng co kéo cơ hô hấp phụ / mệt cơ hô hấp (pH ${ph}, PaCO₂ ${paco2} mmHg)`
          : `giảm oxy máu kháng trị dù đã thở oxy bổ sung (SpO₂ ${spo2}% < ${o2Min}%)`;

      return {
        id: 'rec_copd_inpatient_niv',
        module: 'copd',
        tier: 'Hỗ trợ hô hấp nâng cao',
        tierOrder: 1,
        action: 'START',
        title: `Chỉ định thở máy không xâm nhập (NIV / BiPAP) cấp cứu (${triggerDetail})`,
        rationale: `Theo GOLD 2026 và BYT QĐ 2131/2026 (Mục 3.4.5a, PDF tr. 42), chỉ định NIV ngay khi có ít nhất 1 trong 3 tiêu chuẩn: (1) toan hô hấp cấp (pH ≤ ${phCut} và PaCO₂ ≥ ${paco2Cut} mmHg), (2) khó thở nặng kèm co kéo cơ hô hấp phụ / thở bụng–ngực nghịch thường, hoặc (3) giảm oxy máu dai dẳng không đáp ứng oxy liệu pháp, ở người bệnh tỉnh táo huyết động ổn định. Kiểm tra lại khí máu động mạch sau 1–2 giờ cài đặt.`,
        gates: [],
        citationIds: ['byt.copd.2026.niv_indications'],
        priority: 100,
      };
    },
  },

  {
    id: 'copd.inpatient.niv_clinical_prep_pending_abg',
    module: 'copd',
    nameVi: 'Chuẩn bị sớm máy thở NIV/BiPAP khi có co kéo cơ hô hấp phụ hoặc thiếu oxy kháng trị trong lúc chờ khí máu',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.niv_indications', 'byt.copd.2026.respiratory_failure_rr_24_30'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      if (ph !== undefined && paco2 !== undefined) return false;
      if (hasNivContraindication(ctx)) return false;
      return hasClinicalWorkOfBreathingOrRefractoryHypoxemia(ctx);
    },
    produce: (ctx) => {
      const rr = getRespiratoryRate(ctx);
      const spo2 = getRestingSpo2(ctx);
      const rrStr = rr !== undefined ? `, nhịp thở ${rr} lần/phút` : '';
      const spo2Str = spo2 !== undefined ? `, SpO₂ ${spo2}%` : '';
      return {
        id: 'rec_copd_inpatient_niv_clinical_prep',
        module: 'copd',
        tier: 'Hỗ trợ hô hấp nâng cao',
        tierOrder: 1,
        action: 'CONSIDER',
        title: `Dấu hiệu mệt cơ hô hấp / giảm oxy kháng trị (${rrStr ? rrStr.slice(2) : 'co kéo cơ hô hấp phụ'}${spo2Str}): Chuẩn bị sẵn máy thở NIV/BiPAP tại giường và lấy khẩn Khí máu động mạch`,
        rationale:
          'Theo BYT QĐ 2131/2026 (Mục 3.4.5a) và GOLD 2026, khó thở nặng kèm co kéo cơ hô hấp phụ / thở ngực–bụng nghịch thường hoặc giảm oxy máu không đáp ứng oxy liệu pháp là tiêu chuẩn lâm sàng chỉ định hỗ trợ thông khí NIV. Cần lấy khí máu động mạch khẩn cấp để loại trừ toan chuyển hóa thuần túy (Kussmaul) và khởi động kịp thời BiPAP ngay tại giường.',
        gates: [],
        citationIds: ['byt.copd.2026.niv_indications', 'byt.copd.2026.respiratory_failure_rr_24_30'],
        priority: 97,
      };
    },
  },

  {
    id: 'copd.inpatient.metabolic_acidosis_warning',
    module: 'copd',
    nameVi: 'Cảnh báo toan chuyển hóa cấp (pH giảm nhưng không tăng PaCO₂) trong đợt cấp COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.niv_indications', 'gold.copd.2026.exac_ventilatory_failure_rome'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      if (ph === undefined || paco2 === undefined) return false;
      return (
        ph < thFor('abgPh', 'copd.niv_ph_cutoff') &&
        paco2 < thFor('abgPaco2', 'copd.niv_paco2_cutoff')
      );
    },
    produce: (ctx) => {
      const ph = getAbgPh(ctx)!;
      const paco2 = getAbgPaco2(ctx)!;
      const paco2Cut = thFor('abgPaco2', 'copd.niv_paco2_cutoff');
      return {
        id: 'rec_copd_inpatient_metabolic_acidosis',
        module: 'copd',
        tier: 'Xử trí đợt cấp cấp cứu',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Toan máu không do tăng CO₂ (pH ${ph}, PaCO₂ ${paco2} < ${paco2Cut} mmHg): Tầm soát khẩn nguyên nhân toan chuyển hóa cấp`,
        rationale: `Khí máu động mạch cho thấy toan máu (pH ${ph}) nhưng PaCO₂ không tăng (${paco2} mmHg < ${paco2Cut} mmHg – gợi ý toan chuyển hóa có tăng thông khí bù trừ). Không chỉ định BiPAP thường quy cho toan chuyển hóa đơn thuần; cần xét nghiệm khẩn Lactate máu, Ceton máu/niệu, đường huyết, chức năng thận – điện giải và tầm soát nhiễm khuẩn huyết / thiếu tưới máu mô.`,
        gates: [],
        citationIds: ['byt.copd.2026.niv_indications', 'gold.copd.2026.exac_ventilatory_failure_rome'],
        priority: 94,
      };
    },
  },

  {
    id: 'copd.inpatient.abg_required',
    module: 'copd',
    nameVi: 'Yêu cầu khí máu động mạch khi có đợt cấp suy hô hấp',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.niv_indications'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      if (ph !== undefined && paco2 !== undefined) return false;
      if (ctx.settings.setting === 'outpatient') {
        const spo2 = getRestingSpo2(ctx);
        const rr = getRespiratoryRate(ctx);
        const ci = ctx.normalized.customInputs || {};
        return (
          hasOutpatientAcuteRespiratoryFailure(ctx) ||
          hasSupplementalOxygen(ctx) ||
          Boolean(ci.accessoryMuscleUse) ||
          (spo2 !== undefined && spo2 < thFor('restingSpo2', 'copd.oxygen_target_spo2_max')) ||
          (rr !== undefined && rr > thFor('respiratoryRate', 'copd.exac_rr_non_rf_max'))
        );
      }
      return true;
    },
    produce: () => {
      const phCut = thFor('abgPh', 'copd.niv_ph_cutoff');
      const paco2Cut = thFor('abgPaco2', 'copd.niv_paco2_cutoff');
      return {
        id: 'missing_input_abgPh',
        module: 'copd',
        tier: 'Dữ liệu cần bổ sung',
        tierOrder: 99,
        action: 'CONSIDER',
        title: 'Cần làm Khí máu động mạch (pH, PaCO₂, PaO₂) để đánh giá',
        rationale: `Bệnh nhân đang trong đợt cấp COPD: Cần làm khí máu động mạch cấp cứu để phân biệt toan hô hấp (pH ≤ ${phCut} và PaCO₂ ≥ ${paco2Cut} mmHg) với toan chuyển hóa và chỉ định kịp thời hỗ trợ thông khí.`,
        gates: [],
        citationIds: thr('copd.niv_ph_cutoff').citationIds,
        priority: 30,
      };
    },
  },

  {
    id: 'copd.inpatient.icu_transfer',
    module: 'copd',
    nameVi: 'Tiêu chuẩn chuyển Khoa Hồi sức tích cực (ICU) & đặt nội khí quản thở máy xâm nhập (IMV)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.exac_ventilatory_failure_rome',
      'byt.copd.2026.niv_contraindications_imv',
      'byt.copd.2026.respiratory_failure_rr_gt30',
    ],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;

      const ci = ctx.normalized.customInputs || {};
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      const sbp = need(ctx, 'sbp');
      const rr = getRespiratoryRate(ctx);

      const isRespArrest = Boolean(ci.respiratoryArrest);
      const isAlteredMental = Boolean(ci.alteredMentalStatus);
      const isSevereAcidosis = ph !== undefined && ph <= thFor('abgPh', 'copd.severe_acidosis_ph');
      const isSevereHypercapnia =
        paco2 !== undefined && paco2 > thFor('abgPaco2', 'copd.ventilatory_failure_paco2');
      const isHypotensiveShock =
        sbp !== undefined && sbp < thFor('sbp', 'copd.hypotension_sbp_cutoff');
      const isLifeThreateningTachypnea =
        rr !== undefined && rr > thFor('respiratoryRate', 'copd.exac_rr_life_threatening');

      return (
        isRespArrest ||
        isAlteredMental ||
        isSevereAcidosis ||
        isSevereHypercapnia ||
        isHypotensiveShock ||
        isLifeThreateningTachypnea
      );
    },
    produce: (ctx) => {
      const ci = ctx.normalized.customInputs || {};
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      const sbp = need(ctx, 'sbp');
      const rr = getRespiratoryRate(ctx);
      const severePh = thFor('abgPh', 'copd.severe_acidosis_ph');
      const nivPaco2Cut = thFor('abgPaco2', 'copd.niv_paco2_cutoff');
      const ventPaco2Cut = thFor('abgPaco2', 'copd.ventilatory_failure_paco2');
      const sbpCut = thFor('sbp', 'copd.hypotension_sbp_cutoff');
      const rrCut = thFor('respiratoryRate', 'copd.exac_rr_life_threatening');

      const isRespArrest = Boolean(ci.respiratoryArrest);
      const isAlteredMental = Boolean(ci.alteredMentalStatus);
      const severeRespAcidosis =
        ph !== undefined && ph <= severePh && paco2 !== undefined && paco2 >= nivPaco2Cut;
      const severeNonRespAcidosis =
        !isRespArrest &&
        ph !== undefined &&
        ph <= severePh &&
        (paco2 === undefined || paco2 < nivPaco2Cut);
      const isHypotensiveShock = sbp !== undefined && sbp < sbpCut;

      if (severeNonRespAcidosis) {
        const paco2Detail =
          paco2 !== undefined ? `PaCO₂ ${paco2} mmHg < ${nivPaco2Cut} mmHg` : 'chưa có PaCO₂';
        return {
          id: 'rec_copd_inpatient_icu',
          module: 'copd',
          tier: 'Hồi sức tích cực',
          tierOrder: 0,
          action: 'REFER',
          title: `Chuyển Khoa Hồi sức tích cực (ICU) – Toan máu nặng nguy kịch (pH ${ph}, ${paco2Detail})`,
          rationale: `Người bệnh có toan máu nặng đe dọa tính mạng (pH ${ph} ≤ ${severePh}) nhưng chưa xác nhận tăng CO₂ máu do giảm thông khí (${paco2Detail}): Cần chuyển ngay ICU để tầm soát và xử trí khẩn nguyên nhân toan chuyển hóa nặng (sốc nhiễm khuẩn / toan lactic, nhiễm toan ceton, suy thận cấp). Thận trọng tối đa nếu đặt nội khí quản/an thần giãn cơ để không làm mất nhịp thở tăng thông khí bù trừ Kussmaul.`,
          gates: [],
          citationIds: [
            'gold.copd.2026.exac_ventilatory_failure_rome',
            'byt.copd.2026.niv_contraindications_imv',
          ],
          priority: 103,
        };
      }

      const statusParts: string[] = [];
      if (isRespArrest) statusParts.push('NGỪNG THỞ / ĐẶT NỘI KHÍ QUẢN IMV TỐI KHẨN');
      if (isAlteredMental) statusParts.push('rối loạn ý thức / lơ mơ');
      if (severeRespAcidosis) statusParts.push(`pH ${ph}`);
      if (paco2 !== undefined && paco2 > ventPaco2Cut) statusParts.push(`PaCO₂ ${paco2} > ${ventPaco2Cut} mmHg`);
      if (isHypotensiveShock) statusParts.push(`HA tâm thu ${sbp} < ${sbpCut} mmHg`);
      if (rr !== undefined && rr > rrCut) statusParts.push(`nhịp thở ${rr} > ${rrCut} lần/phút`);

      return {
        id: 'rec_copd_inpatient_icu',
        module: 'copd',
        tier: 'Hồi sức tích cực',
        tierOrder: 0,
        action: 'REFER',
        title: `Chuyển Khoa Hồi sức tích cực (ICU) – Suy hô hấp / Huyết động nguy kịch (${statusParts.join(', ')})`,
        rationale: isRespArrest
          ? 'Bệnh nhân ngừng thở / thở ngáp cá: Bắt buộc bóp bóng hỗ trợ, đặt nội khí quản thở máy xâm nhập (IMV) ngay lập tức và chuyển Hồi sức tích cực (ICU) mà không chờ kết quả khí máu.'
          : `Theo Bảng 3.2 & Mục 3.4.5b BYT QĐ 2131/2026 và GOLD 2026, bệnh nhân có suy hô hấp cấp đe dọa tính mạng (rối loạn tri giác, toan hô hấp nặng pH ≤ ${severePh}, PaCO₂ > ${ventPaco2Cut} mmHg, nhịp thở > ${rrCut} lần/phút hoặc tụt huyết áp/sốc) cần chuyển ngay ICU để hồi sức huyết động và đặt nội khí quản thở máy xâm nhập (IMV) khi NIV chống chỉ định hoặc thất bại.`,
        gates: [],
        citationIds: [
          'gold.copd.2026.exac_ventilatory_failure_rome',
          'byt.copd.2026.niv_contraindications_imv',
          'byt.copd.2026.respiratory_failure_rr_gt30',
        ],
        priority: isRespArrest ? 108 : 103,
      };
    },
  },
];
