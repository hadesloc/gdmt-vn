import type { Rule } from '../../engine/types';
import { thFor, drug, dose, fmtDose } from '../../kb-types';
import {
  COPD_PROFILES,
  formatCopdTiotropiumDose,
  getBloodEos,
  hasConfirmedStableCopd,
  hasConcurrentAsthma,
  hasAnticholinergicContra,
  hasWeakInspiratoryFlow,
  hasMilkProteinAllergy,
  getLamaWarnings,
  getHepaticTripleWarnings,
  getAsthmaPrescribedMonoIcsId,
  willAsthmaModulePrescribeIcsLaba,
  selectTripleInhaler,
  resolveEffectiveInhaler,
  isHighSymptomsConfirmed,
  isGroupEConfirmed,
  isLowExacerbationConfirmed,
  isInappropriateIcsDeEscalationCandidate,
} from './helpers';

export const copdFollowupStepupIcsRules: Rule[] = [
  {
    id: 'copd.followup.exac_add_ics',
    module: 'copd',
    nameVi: 'Theo dõi nhánh đợt cấp: Thêm ICS lên phác đồ ba thuốc khi BCAT ≥ 100 /µL',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_exac_eos_100_300',
      'byt.copd.2026.triple_therapy_indication',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'laba_lama') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      const eos = getBloodEos(ctx);
      return eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_low');
    },
    produce: (ctx) => {
      const tripleId = selectTripleInhaler(ctx);
      const d = drug(tripleId);
      const startDoseText = fmtDose(dose(tripleId, 'start'));
      const eos = getBloodEos(ctx)!;
      const eosLow = thFor('bloodEos', 'copd.eosinophils_low');

      return {
        id: 'rec_copd_followup_add_ics',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'UPTITRATE',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Nâng lên liệu pháp ba thuốc (ICS + LAMA + LABA – ${d.nameVi}) khi BCAT ≥ ${eosLow} /µL`,
        rationale: `Bệnh nhân đang dùng LABA + LAMA nhưng vẫn xuất hiện đợt cấp và có BCAT máu (${eos} tế bào/µL) ≥ ${eosLow} tế bào/µL: Khuyến cáo bổ sung ICS, ưu tiên dùng bình hít tích hợp 3 thuốc phù hợp để giảm tỷ lệ đợt cấp và tử vong.`,
        warnings: [...getLamaWarnings(ctx, tripleId), ...getHepaticTripleWarnings(ctx, tripleId)],
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_exac_eos_100_300',
          'byt.copd.2026.triple_therapy_indication',
        ],
        priority: 85,
      };
    },
  },

  {
    id: 'copd.followup.avoid_ics_low_eos',
    module: 'copd',
    nameVi: 'Cảnh báo không thêm ICS khi BCAT máu < 100 /µL',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.followup_eos_less_100_pneumonia', 'byt.copd.2026.followup_roflumilast_azithro'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'laba_lama') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      const eos = getBloodEos(ctx);
      return eos !== undefined && eos < thFor('bloodEos', 'copd.eosinophils_low');
    },
    produce: (ctx) => {
      const eos = getBloodEos(ctx)!;
      const eosLow = thFor('bloodEos', 'copd.eosinophils_low');
      return {
        id: 'rec_copd_avoid_ics_low_eos',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'AVOID',
        dose: undefined,
        title: `Không khuyến cáo thêm ICS khi BCAT máu < ${eosLow} /µL`,
        rationale: `Số lượng bạch cầu ái toan máu ${eos} tế bào/µL < ${eosLow} tế bào/µL. Bằng chứng RCT cho thấy thêm ICS ở ngưỡng BCAT thấp hầu như không giảm đợt cấp nhưng làm tăng đáng kể nguy cơ viêm phổi vi khuẩn nặng. Ưu tiên xem xét Roflumilast hoặc Azithromycin nếu đủ điều kiện.`,
        gates: [],
        citationIds: ['gold.copd.2026.followup_eos_less_100_pneumonia', 'byt.copd.2026.followup_roflumilast_azithro'],
        priority: 80,
      };
    },
  },

  {
    id: 'copd.followup.ics_laba_step_up_or_switch',
    module: 'copd',
    nameVi: 'Theo dõi bệnh nhân đang dùng ICS + LABA còn triệu chứng hoặc đợt cấp (GOLD 2026 & BYT Biểu đồ 0.2)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.olodaterol_tiotropium_dose',
      'byt.copd.2026.tiotropium_dose',
      'gold.copd.2026.ics_withdrawal',
      'gold.copd.2026.followup_ics_laba_continue',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'ics_laba') return false;
      if (getAsthmaPrescribedMonoIcsId(ctx) !== undefined) return false;

      const hasAsthma = hasConcurrentAsthma(ctx);
      const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
      if (priorPneum && !hasAsthma) return false;

      if (isGroupEConfirmed(ctx)) {
        return hasAsthma || getBloodEos(ctx) !== undefined;
      }
      if (isLowExacerbationConfirmed(ctx) && isHighSymptomsConfirmed(ctx)) {
        return hasAsthma || getBloodEos(ctx) !== undefined;
      }
      return false;
    },
    produce: (ctx) => {
      const hasAsthma = hasConcurrentAsthma(ctx);
      const eos = getBloodEos(ctx);
      const eosLow = thFor('bloodEos', 'copd.eosinophils_low');
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);

      if (willAsthmaModulePrescribeIcsLaba(ctx)) {
        const dLama = drug('tiotropium');
        return {
          id: 'rec_copd_ics_laba_add_lama',
          module: 'copd',
          tier: 'Theo dõi & Chuẩn độ',
          tierOrder: 2,
          action: 'START',
          drugId: dLama.id,
          drugNameVi: dLama.nameVi,
          dose: formatCopdTiotropiumDose(avoidDpi),
          title: `Bổ sung thêm LAMA (${dLama.nameVi}) trên nền ICS + LABA hiện tại`,
          rationale:
            'Bệnh nhân đồng mắc Hen – COPD đang dùng ICS + LABA nhưng còn triệu chứng hoặc đợt cấp: Bổ sung LAMA tạo phác đồ ba thuốc mà không gây trùng lặp LABA.',
          warnings: getLamaWarnings(ctx, dLama.id),
          gates: [],
          citationIds: ['byt.copd.2026.triple_therapy_indication', 'byt.copd.2026.tiotropium_dose'],
          priority: 82,
        };
      }

      const shouldEscalateToTriple =
        hasAsthma ||
        (eos !== undefined && eos >= eosHigh) ||
        (isGroupEConfirmed(ctx) && eos !== undefined && eos >= eosLow);

      if (!shouldEscalateToTriple) {
        const dDual = drug('tiotropium_olodaterol');
        return {
          id: 'rec_copd_ics_laba_switch_dual',
          module: 'copd',
          tier: 'Theo dõi & Chuẩn độ',
          tierOrder: 2,
          action: 'SWITCH',
          drugId: dDual.id,
          drugNameVi: dDual.nameVi,
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          title: 'Chuyển từ ICS + LABA sang phối hợp đôi LABA + LAMA',
          rationale: `Theo GOLD 2026 và BYT QĐ 2131/2026 (Biểu đồ tiếp cận người bệnh đang dùng ICS+LABA): Khi không có chỉ định bắt buộc của ICS (không có đợt cấp kèm BCAT < ${eosHigh} /µL, hoặc đợt cấp nhưng BCAT < ${eosLow} /µL và không có hen), chuyển sang LABA + LAMA giúp cải thiện chức năng phổi tốt hơn và giảm nguy cơ viêm phổi.`,
          warnings: getLamaWarnings(ctx, dDual.id),
          gates: [],
          citationIds: ['gold.copd.2026.ics_withdrawal', 'byt.copd.2026.olodaterol_tiotropium_dose'],
          priority: 82,
        };
      }

      const tripleId = selectTripleInhaler(ctx);
      const dTriple = drug(tripleId);
      return {
        id: 'rec_copd_ics_laba_escalate_triple',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'SWITCH',
        drugId: dTriple.id,
        drugNameVi: dTriple.nameVi,
        dose: fmtDose(dose(tripleId, 'start')),
        title: `Nâng bậc từ ICS + LABA lên phác đồ ba thuốc (${dTriple.nameVi})`,
        rationale: `Theo GOLD 2026 và BYT QĐ 2131/2026: Ở người bệnh đang dùng ICS + LABA còn khó thở/đợt cấp kèm BCAT tăng cao (≥ ${eosHigh} /µL, nơi việc rút ICS có nguy cơ cao bùng phát đợt cấp), còn đợt cấp với BCAT ≥ ${eosLow} /µL, hoặc đồng mắc hen, nâng bậc lên bộ ba ICS + LAMA + LABA tối ưu hơn rút ICS hoặc giữ ICS + LABA đơn thuần.`,
        warnings: [...getLamaWarnings(ctx, tripleId), ...getHepaticTripleWarnings(ctx, tripleId)],
        gates: [],
        citationIds: [
          'byt.copd.2026.triple_therapy_indication',
          'gold.copd.2026.ics_withdrawal',
          'gold.copd.2026.followup_ics_laba_continue',
        ],
        priority: 84,
      };
    },
  },

  {
    id: 'copd.followup.ics_de_escalation',
    module: 'copd',
    nameVi: 'Rút thành phần ICS khi có biến chứng viêm phổi tái diễn',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.ics_withdrawal', 'byt.copd.2026.olodaterol_tiotropium_dose'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff !== 'triple' && eff !== 'ics_laba') return false;
      return Boolean(ctx.normalized.customInputs?.priorPneumonia);
    },
    produce: (ctx) => {
      const d = drug('tiotropium_olodaterol');
      const startDoseText = fmtDose(dose('tiotropium_olodaterol', 'start'));
      const eos = getBloodEos(ctx);
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      const warnText =
        eos !== undefined && eos >= eosHigh
          ? `Cảnh báo: BCAT máu ${eos} ≥ ${eosHigh} tế bào/µL, việc rút ICS có nguy cơ cao làm bùng phát lại đợt cấp; cần giám sát lâm sàng chặt chẽ.`
          : 'Theo dõi sát diễn biến triệu chứng và đợt cấp sau khi rút ICS.';

      return {
        id: 'rec_copd_withdraw_ics',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'SWITCH',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: 'Xem xét rút thành phần ICS / Chuyển về LABA + LAMA do viêm phổi tái diễn',
        rationale: `Bệnh nhân xuất hiện viêm phổi tái diễn khi dùng ICS: Cần cân nhắc lợi ích – nguy cơ và chuyển về duy trì phối hợp đôi LABA + LAMA. ${warnText}`,
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: ['gold.copd.2026.ics_withdrawal', 'byt.copd.2026.olodaterol_tiotropium_dose'],
        priority: 90,
      };
    },
  },

  {
    id: 'copd.followup.inappropriate_ics_de_escalation',
    module: 'copd',
    nameVi: 'Cân nhắc rút ICS khởi trị sai chỉ định ban đầu trên nền ICS+LABA hoặc Triple (không hen, 0 đợt cấp, BCAT < 100 /µL)',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.ics_withdrawal',
      'gold.copd.2026.followup_eos_less_100_pneumonia',
      'byt.copd.2026.olodaterol_tiotropium_dose',
    ],
    when: (ctx) => isInappropriateIcsDeEscalationCandidate(ctx),
    produce: (ctx) => {
      const d = drug('tiotropium_olodaterol');
      const startDoseText = fmtDose(dose('tiotropium_olodaterol', 'start'));
      const eos = getBloodEos(ctx)!;
      const eosLow = thFor('bloodEos', 'copd.eosinophils_low');
      const eff = resolveEffectiveInhaler(ctx);
      const baseLabel = eff === 'triple' ? 'phác đồ ba thuốc có ICS' : 'ICS + LABA';
      const sympText = isHighSymptomsConfirmed(ctx)
        ? 'vẫn còn khó thở nhưng không có đợt cấp trong năm qua'
        : 'không có đợt cấp trong năm qua, ít triệu chứng';

      return {
        id: 'rec_copd_withdraw_inappropriate_ics',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'SWITCH',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Rút ICS không có chỉ định trên ${baseLabel} (không hen, không đợt cấp, BCAT ${eos} < ${eosLow} /µL) – Chuyển sang LABA + LAMA`,
        rationale: `Theo GOLD 2026 (PDF p. 77 / trang in 66) và BYT QĐ 2131/2026: Người bệnh COPD không có tiền sử hen đang dùng ${baseLabel}, ${sympText} và BCAT máu thấp (${eos} < ${eosLow} tế bào/µL) được khuyến cáo rút thành phần ICS chuyển sang phối hợp đôi LABA + LAMA để giảm nguy cơ viêm phổi (lưu ý xác minh lại tiền sử trước đây để chắc chắn bệnh nhân không thuộc nhóm đạt 0 đợt cấp nhờ có chỉ định ICS đúng trước đó).`,
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: [
          'gold.copd.2026.ics_withdrawal',
          'gold.copd.2026.followup_eos_less_100_pneumonia',
          'byt.copd.2026.olodaterol_tiotropium_dose',
        ],
        priority: 81,
      };
    },
  },
];
