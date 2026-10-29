import type { Rule, RuleContext } from '../../engine/types';
import { thFor, drug, dose, fmtDose } from '../../kb-types';
import {
  COPD_PROFILES,
  getFev1PredPct,
  getBloodEos,
  getSmokingStatus,
  hasCurrentMed,
  hasConfirmedStableCopd,
  hasConcurrentAsthma,
  hasAnticholinergicContra,
  resolveEffectiveInhaler,
  isGroupEConfirmed,
  getRoflumilastContraInfo,
  getRoflumilastContraReasons,
  getRoflumilastCautionInfo,
  getAzithromycinContraInfo,
  getAzithromycinContraReasons,
  getAzithromycinCautionInfo,
  copdMissingRec,
} from './helpers';

function isEligibleForOralEscalationInhalerBase(ctx: RuleContext): boolean {
  const eff = resolveEffectiveInhaler(ctx);
  if (eff === 'triple') return true;
  if (eff === 'laba_lama') {
    if (hasConcurrentAsthma(ctx)) return false;
    if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return true;
    const eos = getBloodEos(ctx);
    return eos !== undefined && eos < thFor('bloodEos', 'copd.eosinophils_low');
  }
  if (hasAnticholinergicContra(ctx)) {
    if (eff === 'ics_laba') return true;
    if (eff === 'laba_mono' && !hasConcurrentAsthma(ctx)) {
      if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return true;
      const eos = getBloodEos(ctx);
      return eos !== undefined && eos < thFor('bloodEos', 'copd.eosinophils_low');
    }
  }
  return false;
}

export const copdEscalationOralRules: Rule[] = [
  {
    id: 'copd.followup.roflumilast_indication',
    module: 'copd',
    nameVi: 'Chỉ định Roflumilast khi FEV₁ < 50%, viêm phế quản mạn và đợt cấp tái phát',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_roflumilast',
      'fda.copd.roflumilast_dose',
      'gold.copd.2026.roflumilast_weight_depression',
      'byt.copd.2026.followup_roflumilast_azithro',
      'fda.copd.roflumilast_child_pugh_a_auc51',
      'fda.copd.roflumilast_cyp_inhibitors',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasCurrentMed(ctx, 'roflumilast')) return false;
      if (getRoflumilastContraReasons(ctx).length > 0) return false;

      const fev1Pct = getFev1PredPct(ctx);
      if (fev1Pct === undefined || fev1Pct >= thFor('fev1PredPct', 'copd.fev1_severe_roflumilast')) {
        return false;
      }
      if (!Boolean(ctx.normalized.customInputs?.chronicBronchitis)) return false;
      if (!isGroupEConfirmed(ctx)) return false;

      return isEligibleForOralEscalationInhalerBase(ctx);
    },
    produce: (ctx) => {
      const d = drug('roflumilast');
      const startDoseText = fmtDose(dose('roflumilast', 'start'));
      const fev1Cut = thFor('fev1PredPct', 'copd.fev1_severe_roflumilast');
      const initMcg = thFor('dose_mcg', 'copd.roflumilast_dose_initial');
      const initWks = thFor('duration_weeks', 'copd.roflumilast_initial_weeks');
      const maintMcg = thFor('dose_mcg', 'copd.roflumilast_dose_maintenance');
      const caution = getRoflumilastCautionInfo(ctx);

      return {
        id: 'rec_copd_roflumilast',
        module: 'copd',
        tier: 'Leo thang điều trị',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Cân nhắc bổ sung Roflumilast uống (FEV₁ < ${fev1Cut}%, viêm phế quản mạn)`,
        rationale: `Bệnh nhân có FEV₁ < ${fev1Cut}% dự đoán, kiểu hình viêm phế quản mạn và đợt cấp tái phát dù đã tối ưu thuốc hít (lợi ích rõ rệt nhất ở người bệnh có tiền sử nhập viện vì đợt cấp): Cân nhắc bổ sung ức chế PDE4 Roflumilast (khởi đầu ${initMcg} mcg x 1 lần/ngày trong ${initWks} tuần để giảm tiêu chảy/buồn nôn, sau đó nâng lên liều điều trị duy trì ${maintMcg} mcg/ngày). Cần theo dõi cân nặng và triệu chứng tâm thần kinh/trầm cảm định kỳ.`,
        profileDiff: {
          INTL: `GOLD 2026 (PDF p. 77 / trang in 66) khuyến cáo cân nhắc Roflumilast ở phân nhóm FEV₁ < ${fev1Cut}% có viêm phế quản mạn, đặc biệt khi có tiền sử nhập viện vì đợt cấp.`,
          VN: `BYT QĐ 2131/2026 nêu Roflumilast cho người bệnh FEV₁ < ${fev1Cut}% có viêm phế quản mạn (đặc biệt tiền sử nhập viện đợt cấp), lưu ý nguồn cung ứng hạn chế tại Việt Nam.`,
          US: 'FDA phê duyệt Daliresp (roflumilast) giảm nguy cơ đợt cấp ở COPD nặng kèm viêm phế quản mạn và tiền sử đợt cấp.',
        },
        warnings: caution.warnings.length > 0 ? caution.warnings : undefined,
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_roflumilast',
          'fda.copd.roflumilast_dose',
          'gold.copd.2026.roflumilast_weight_depression',
          'byt.copd.2026.followup_roflumilast_azithro',
          ...caution.citationIds,
        ],
        priority: 70,
      };
    },
  },

  {
    id: 'copd.followup.roflumilast_continue',
    module: 'copd',
    nameVi: 'Duy trì Roflumilast liều điều trị 500 mcg/ngày ở bệnh nhân đang dung nạp tốt',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'fda.copd.roflumilast_dose',
      'gold.copd.2026.roflumilast_weight_depression',
      'fda.copd.roflumilast_child_pugh_a_auc51',
      'fda.copd.roflumilast_cyp_inhibitors',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!hasCurrentMed(ctx, 'roflumilast')) return false;
      return getRoflumilastContraReasons(ctx).length === 0;
    },
    produce: (ctx) => {
      const d = drug('roflumilast');
      const maintMcg = thFor('dose_mcg', 'copd.roflumilast_dose_maintenance');
      const caution = getRoflumilastCautionInfo(ctx);
      return {
        id: 'rec_copd_roflumilast_continue',
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: fmtDose(dose('roflumilast', 'target')),
        title: `Tiếp tục duy trì Roflumilast liều hiệu lực ${maintMcg} mcg/ngày (theo dõi cân nặng & tâm thần kinh)`,
        rationale: `Người bệnh đang sử dụng Roflumilast không có chống chỉ định: Duy trì liều điều trị ${maintMcg} mcg uống 1 lần/ngày (không quay lại liều dò khởi đầu), tiếp tục kiểm tra cân nặng và triệu chứng trầm cảm/mất ngủ mỗi lần tái khám.`,
        warnings: caution.warnings.length > 0 ? caution.warnings : undefined,
        gates: [],
        citationIds: [
          'fda.copd.roflumilast_dose',
          'gold.copd.2026.roflumilast_weight_depression',
          ...caution.citationIds,
        ],
        priority: 70,
      };
    },
  },

  {
    id: 'copd.safety.roflumilast_contraindicated',
    module: 'copd',
    nameVi: 'Chống chỉ định / Tránh dùng Roflumilast theo nguyên nhân chuyên biệt',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_roflumilast',
      'fda.copd.roflumilast_contra_liver',
      'fda.copd.roflumilast_psychiatric_weight',
      'fda.copd.roflumilast_cyp_inhibitors',
      'gold.copd.2026.roflumilast_weight_depression',
      'byt.copd.2026.underweight_bmi_18_5',
    ],
    when: (ctx) => {
      const reasons = getRoflumilastContraReasons(ctx);
      if (reasons.length === 0) return false;
      if (hasCurrentMed(ctx, 'roflumilast')) return true;

      if (!hasConfirmedStableCopd(ctx)) return false;
      const fev1Pct = getFev1PredPct(ctx);
      if (fev1Pct === undefined || fev1Pct >= thFor('fev1PredPct', 'copd.fev1_severe_roflumilast')) {
        return false;
      }
      if (!Boolean(ctx.normalized.customInputs?.chronicBronchitis)) return false;
      if (!isGroupEConfirmed(ctx)) return false;
      return isEligibleForOralEscalationInhalerBase(ctx);
    },
    produce: (ctx) => {
      const contraInfo = getRoflumilastContraInfo(ctx);
      const takingRoflumilast = hasCurrentMed(ctx, 'roflumilast');
      const d = drug('roflumilast');
      return {
        id: 'rec_copd_roflumilast_contra',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 1,
        action: takingRoflumilast ? 'STOP' : 'AVOID',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: undefined,
        title: `${takingRoflumilast ? 'NGỪNG' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} Roflumilast do ${contraInfo.reasons.join('; ')}`,
        rationale: `Trên bệnh nhân này, việc dùng Roflumilast bị chống chỉ định hoặc cần tránh tuyệt đối vì ghi nhận yếu tố nguy cơ chuyên biệt: ${contraInfo.reasons.join('; ')} (theo nhãn thuốc FDA, GOLD 2026 và BYT QĐ 2131/2026).`,
        gates: [],
        citationIds: contraInfo.citationIds,
        priority: 88,
      };
    },
  },

  {
    id: 'copd.followup.azithromycin_prophylaxis',
    module: 'copd',
    nameVi: 'Azithromycin dự phòng đợt cấp ở bệnh nhân hiện không hút thuốc',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_azithromycin',
      'gold.copd.2026.azithromycin_dose_warnings',
      'gold.copd.2026.azithromycin_safety',
      'byt.copd.2026.azithromycin_renal_contra_gfr10',
      'fda.copd.azithromycin_myasthenia_gravis',
      'fda.copd.azithromycin_warfarin_digoxin',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasCurrentMed(ctx, 'azithromycin')) return false;
      if (getAzithromycinContraReasons(ctx).length > 0) return false;
      const smoking = getSmokingStatus(ctx);
      if (smoking !== 'former' && smoking !== 'never') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      return isEligibleForOralEscalationInhalerBase(ctx);
    },
    produce: (ctx) => {
      const d = drug('azithromycin');
      const startDoseText = fmtDose(dose('azithromycin', 'start'));
      const dailyMg = thFor('dose_mg', 'copd.azithromycin_dose_daily');
      const thriceMg = thFor('dose_mg', 'copd.azithromycin_dose_thrice_weekly');
      const qtcMax = thFor('qtc', 'copd.qtc_azithromycin_max_ms');
      const caution = getAzithromycinCautionInfo(ctx);

      return {
        id: 'rec_copd_azithromycin_prophylaxis',
        module: 'copd',
        tier: 'Leo thang điều trị',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: 'Cân nhắc Azithromycin dự phòng đợt cấp ở người hiện không hút thuốc',
        rationale: `Azithromycin (${dailyMg} mg/ngày hoặc ${thriceMg} mg x 3 lần/tuần) dùng kéo dài tối đa 1 năm giúp giảm đợt cấp ở người bệnh hiện không hút thuốc (đã cai thuốc hoặc chưa từng hút thuốc) có đợt cấp tái phát trên phác đồ tối ưu. Bắt buộc kiểm tra ECG (đảm bảo QTc ≤ ${qtcMax} ms), chức năng gan/thận, thính lực định kỳ và loại trừ nhiễm mycobacteria không điển hình (NTM) trước khởi trị.`,
        warnings: caution.warnings.length > 0 ? caution.warnings : undefined,
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_azithromycin',
          'gold.copd.2026.azithromycin_dose_warnings',
          'gold.copd.2026.azithromycin_safety',
          'byt.copd.2026.azithromycin_renal_contra_gfr10',
          ...caution.citationIds,
        ],
        priority: 65,
      };
    },
  },

  {
    id: 'copd.followup.azithromycin_continue',
    module: 'copd',
    nameVi: 'Duy trì & đánh giá lại Azithromycin dự phòng (giám sát QTc, thính lực, NTM và mốc 1 năm)',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_azithromycin',
      'gold.copd.2026.azithromycin_safety',
      'byt.copd.2026.azithromycin_renal_contra_gfr10',
      'fda.copd.azithromycin_myasthenia_gravis',
      'fda.copd.azithromycin_warfarin_digoxin',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!hasCurrentMed(ctx, 'azithromycin')) return false;
      return getAzithromycinContraReasons(ctx).length === 0;
    },
    produce: (ctx) => {
      const d = drug('azithromycin');
      const qtcMax = thFor('qtc', 'copd.qtc_azithromycin_max_ms');
      const caution = getAzithromycinCautionInfo(ctx);
      return {
        id: 'rec_copd_azithromycin_continue',
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: fmtDose(dose('azithromycin', 'target')),
        title: 'Tiếp tục duy trì Azithromycin dự phòng (theo dõi định kỳ QTc, thính lực và đánh giá lại sau 1 năm)',
        rationale: `Người bệnh đang dùng Azithromycin dự phòng không có chống chỉ định: Tiếp tục duy trì và giám sát định kỳ điện tâm đồ (ngừng nếu QTc > ${qtcMax} ms), thính lực đồ/ù tai, tầm soát vi khuẩn NTM đờm; lưu ý dữ liệu RCT chỉ đánh giá tối đa đến 1 năm và làm tăng đề kháng vi khuẩn nên cần đánh giá lại lợi ích – nguy cơ hằng năm (ví dụ ngưng thử vào mùa hè khi ổn định).`,
        warnings: caution.warnings.length > 0 ? caution.warnings : undefined,
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_azithromycin',
          'gold.copd.2026.azithromycin_safety',
          'byt.copd.2026.azithromycin_renal_contra_gfr10',
          ...caution.citationIds,
        ],
        priority: 66,
      };
    },
  },

  {
    id: 'copd.safety.azithromycin_contraindicated',
    module: 'copd',
    nameVi: 'Tránh dùng / Ngừng Azithromycin dự phòng do QTc kéo dài, tương tác QT, bệnh gan ứ mật, suy thận GFR < 10, độc tai hoặc NTM',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.azithromycin_safety',
      'byt.copd.2026.azithromycin_renal_contra_gfr10',
      'byt.copd.2026.macrolide_domperidone_contra',
      'fda.copd.azithromycin_contra_cholestatic',
      'fda.copd.azithromycin_renal_gfr10',
    ],
    when: (ctx) => {
      const reasons = getAzithromycinContraReasons(ctx);
      if (reasons.length === 0) return false;
      if (hasCurrentMed(ctx, 'azithromycin')) return true;

      if (!hasConfirmedStableCopd(ctx)) return false;
      const smoking = getSmokingStatus(ctx);
      if (smoking !== 'former' && smoking !== 'never') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      return isEligibleForOralEscalationInhalerBase(ctx);
    },
    produce: (ctx) => {
      const contraInfo = getAzithromycinContraInfo(ctx);
      const takingAzithro = hasCurrentMed(ctx, 'azithromycin');
      const d = drug('azithromycin');
      return {
        id: 'rec_copd_azithromycin_contra',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 1,
        action: takingAzithro ? 'STOP' : 'AVOID',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: undefined,
        title: `${takingAzithro ? 'NGỪNG' : 'TRÁNH DÙNG'} Azithromycin dự phòng dài hạn do ${contraInfo.reasons.join('; ')}`,
        rationale: `Theo GOLD 2026, nhãn FDA và BYT QĐ 2131/2026, Azithromycin kéo dài khoảng QTc (chống chỉ định phối hợp domperidone và các thuốc kéo dài QT), chống chỉ định khi có tiền sử vàng da ứ mật/suy gan nặng hoặc suy thận rất nặng / lọc máu, gây độc tính thính lực và chọn lọc kháng thuốc NTM. Không sử dụng Azithromycin dự phòng trên bệnh nhân này vì ${contraInfo.reasons.join('; ')}.`,
        gates: [],
        citationIds: contraInfo.citationIds,
        priority: 88,
      };
    },
  },

  {
    id: 'copd.followup.missing_smoking_for_azithromycin',
    module: 'copd',
    nameVi: 'Yêu cầu tình trạng hút thuốc lá để xét chỉ định Azithromycin dự phòng',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.followup_azithromycin'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!isGroupEConfirmed(ctx)) return false;
      if (!isEligibleForOralEscalationInhalerBase(ctx)) return false;
      return getSmokingStatus(ctx) === undefined;
    },
    produce: () =>
      copdMissingRec(
        'smokingStatus',
        'Tình trạng hút thuốc lá hiện tại',
        'xác định tư vấn cai thuốc lá hoặc xét điều kiện Azithromycin dự phòng đợt cấp (chỉ định ở người hiện không hút thuốc)',
        ['gold.copd.2026.followup_azithromycin']
      ),
  },
];
