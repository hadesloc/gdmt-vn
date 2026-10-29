import type { Rule, RuleContext, CurrentMed } from '../../engine/types';
import { hasCondition } from '../../engine/require';
import { thFor, drug, dose, fmtDose, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  RESPIRATORY_BIOLOGIC_IDS,
  COPD_APPROVED_BIOLOGIC_IDS,
  COPD_UNAPPROVED_BIOLOGIC_IDS,
  getBloodEos,
  getFev1PredPct,
  hasCurrentMed,
  findAllCurrentMedsInSet,
  hasAnyCurrentMed,
  hasConfirmedStableCopd,
  hasConcurrentAsthma,
  hasAnticholinergicContra,
  hasBreastfeeding,
  resolveEffectiveInhaler,
  isGroupEConfirmed,
} from './helpers';

function isEligibleForBiologicInhalerBase(ctx: RuleContext): boolean {
  const eff = resolveEffectiveInhaler(ctx);
  if (eff === 'triple') return true;
  return eff === 'ics_laba' && hasAnticholinergicContra(ctx);
}

function hasSevereHypereosinophiliaForBiologics(ctx: RuleContext): boolean {
  const eos = getBloodEos(ctx);
  return eos !== undefined && eos >= thFor('bloodEos', 'copd.dupilumab_eos_contra_max');
}

function getUnapprovedCopdBiologicsToStop(ctx: RuleContext): CurrentMed[] {
  if (hasConcurrentAsthma(ctx)) return [];
  return findAllCurrentMedsInSet(ctx, COPD_UNAPPROVED_BIOLOGIC_IDS);
}

function getDuplicateBiologicsToStop(ctx: RuleContext): CurrentMed[] {
  const allBios = findAllCurrentMedsInSet(ctx, RESPIRATORY_BIOLOGIC_IDS);
  if (allBios.length < 2) return []; // qa-allow: index - cần từ 2 kháng thể đơn dòng trở lên mới có trùng lặp
  const unapprovedStopIds = new Set(
    getUnapprovedCopdBiologicsToStop(ctx).map((m) => m.drugId.trim().toLowerCase())
  );
  const remaining = allBios.filter((m) => {
    const id = m.drugId.trim().toLowerCase();
    if (unapprovedStopIds.has(id)) return false;
    if (id === 'dupilumab' && hasSevereHypereosinophiliaForBiologics(ctx)) return false;
    return true;
  });
  return remaining.length >= 2 ? remaining.slice(1) : []; // qa-allow: index - giữ 1 thuốc sinh học đầu tiên (khớp asthma), dừng từ thuốc thứ 2
}

function getRetainedApprovedCopdBiologicMed(ctx: RuleContext): CurrentMed | undefined {
  const dupStopIds = new Set(
    getDuplicateBiologicsToStop(ctx).map((m) => m.drugId.trim().toLowerCase())
  );
  for (const med of findAllCurrentMedsInSet(ctx, COPD_APPROVED_BIOLOGIC_IDS)) {
    const id = med.drugId.trim().toLowerCase();
    if (dupStopIds.has(id)) continue;
    if (id === 'dupilumab' && hasSevereHypereosinophiliaForBiologics(ctx)) continue;
    return med;
  }
  return undefined;
}

function makeUnapprovedBiologicStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.unapproved_biologic_stop'
        : `copd.safety.unapproved_biologic_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng kháng thể đơn dòng không có chỉ định/bằng chứng hiệu quả trong COPD đơn thuần không kèm Hen',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
    when: (ctx) => getUnapprovedCopdBiologicsToStop(ctx).length > slotIndex,
    produce: (ctx) => {
      const med = getUnapprovedCopdBiologicsToStop(ctx)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_unapproved_biologic'
            : `rec_copd_stop_unapproved_biologic_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG ${medName}: Chưa chứng minh hiệu quả giảm đợt cấp trong COPD đơn thuần không kèm Hen`,
        rationale:
          'Theo GOLD 2026, chỉ có Dupilumab (kèm viêm phế quản mạn) và Mepolizumab chứng minh giảm đợt cấp nhất quán ở COPD có BCAT ≥ 300 tế bào/µL. Các thuốc sinh học khác của Hen (benralizumab, omalizumab, tezepelumab, reslizumab) chưa chứng minh hiệu quả trong RCT pha 3 cho COPD đơn thuần không kèm Hen; cần ngừng để tránh ức chế miễn dịch không cần thiết.',
        gates: [],
        citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
        priority: 95,
      };
    },
  };
}

function makeDuplicateBiologicStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.duplicate_biologic_stop'
        : `copd.safety.duplicate_biologic_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Chống chỉ định phối hợp đồng thời hai kháng thể đơn dòng hô hấp (Dual Biologics)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
    when: (ctx) => {
      if (ctx.normalized.selectedModules.includes('asthma')) return false;
      return getDuplicateBiologicsToStop(ctx).length > slotIndex;
    },
    produce: (ctx) => {
      const med = getDuplicateBiologicsToStop(ctx)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_duplicate_biologic'
            : `rec_copd_stop_duplicate_biologic_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG ${medName}: Tuyệt đối không phối hợp đồng thời hai thuốc sinh học hô hấp`,
        rationale:
          'Chưa có dữ liệu an toàn và hiệu quả khi phối hợp đồng thời hai kháng thể đơn dòng hô hấp (ví dụ Dupilumab + Mepolizumab), trong khi làm tăng nguy cơ rối loạn miễn dịch và nhiễm ký sinh trùng. Chỉ duy trì đơn trị MỘT thuốc sinh học duy nhất phù hợp kiểu hình.',
        gates: [],
        citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab'],
        priority: 97,
      };
    },
  };
}

export const copdEscalationBiologicRules: Rule[] = [
  makeUnapprovedBiologicStopRule(0),
  makeUnapprovedBiologicStopRule(1), // qa-allow: index - khe dừng thuốc sinh học không phê duyệt thứ 2
  makeDuplicateBiologicStopRule(0),
  makeDuplicateBiologicStopRule(1), // qa-allow: index - khe dừng thuốc sinh học trùng lặp thứ 2

  {
    id: 'copd.safety.dupilumab_hypereosinophilia_contra',
    module: 'copd',
    nameVi: 'Không khởi trị / Ngừng Dupilumab khi BCAT máu ≥ 1.500 tế bào/µL & tầm soát khẩn EGPA / Strongyloides',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gina.copd.2026.dupilumab_eos_1500_contra',
      'gina.copd.2026.hypereosinophilia_1500_egpa',
      'fda.copd.dupilumab_helminth',
    ],
    when: (ctx) => {
      if (!hasSevereHypereosinophiliaForBiologics(ctx)) return false;
      if (hasCurrentMed(ctx, 'dupilumab')) return true;
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!isEligibleForBiologicInhalerBase(ctx)) return false;
      return isGroupEConfirmed(ctx);
    },
    produce: (ctx) => {
      const eos = getBloodEos(ctx)!;
      const eosMax = thFor('bloodEos', 'copd.dupilumab_eos_contra_max');
      const takingDupilumab = hasCurrentMed(ctx, 'dupilumab');
      const d = drug('dupilumab');
      return {
        id: 'rec_copd_dupilumab_hypereosinophilia_contra',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: takingDupilumab ? 'STOP' : 'AVOID',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: undefined,
        title: `${takingDupilumab ? 'NGỪNG' : 'TRÁNH KHỞI TRỊ'} ${d.nameVi} khi BCAT máu rất cao (${eos} ≥ ${eosMax} /µL) – Bắt buộc tầm soát EGPA & giun lươn Strongyloides`,
        rationale: `Bạch cầu ái toan máu ngoại vi tăng rất cao (${eos} ≥ ${eosMax} tế bào/µL). Theo GINA 2026 và nhãn FDA, Dupilumab có thể gây tăng vọt BCAT máu thoáng qua làm bùng phát viêm mạch hệ thống hội chứng u hạt tăng BCAT (EGPA) hoặc viêm phổi tăng BCAT. Bắt buộc ngừng/tránh Dupilumab và tầm soát khẩn nhiễm ký sinh trùng (đặc biệt giun lươn Strongyloides stercoralis) cùng hội chứng EGPA trước khi hội chẩn xét thuốc kháng IL-5 (Mepolizumab).`,
        gates: [],
        citationIds: [
          'gina.copd.2026.dupilumab_eos_1500_contra',
          'gina.copd.2026.hypereosinophilia_1500_egpa',
          'fda.copd.dupilumab_helminth',
        ],
        priority: 96,
      };
    },
  },

  {
    id: 'copd.followup.dupilumab_indication',
    module: 'copd',
    nameVi: 'Chỉ định đơn trị sinh học (ưu tiên Dupilumab; thay thế Mepolizumab) khi BCAT 300–<1500 /µL + Viêm phế quản mạn',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.biologics_dupilumab_mepolizumab',
      'fda.copd.dupilumab_dose',
      'fda.copd.dupilumab_boreas_fev1_30_70',
      'fda.copd.dupilumab_helminth',
      'fda.copd.dupilumab_cholecystitis',
      'gina.copd.2026.mepolizumab_100mg_q4w',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!isEligibleForBiologicInhalerBase(ctx)) return false;
      if (hasAnyCurrentMed(ctx, COPD_APPROVED_BIOLOGIC_IDS) !== undefined) return false;
      if (hasConcurrentAsthma(ctx) && hasAnyCurrentMed(ctx, RESPIRATORY_BIOLOGIC_IDS) !== undefined) {
        return false;
      }
      if (!isGroupEConfirmed(ctx)) return false;
      if (hasSevereHypereosinophiliaForBiologics(ctx)) return false;
      const eos = getBloodEos(ctx);
      if (eos === undefined || eos < thFor('bloodEos', 'copd.eosinophils_high')) return false;
      return Boolean(ctx.normalized.customInputs?.chronicBronchitis);
    },
    produce: (ctx) => {
      const d = drug('dupilumab');
      const dMepo = drug('mepolizumab');
      const startDoseText = fmtDose(dose('dupilumab', 'start'));
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      const dupDose = thFor('dose_mg', 'copd.dupilumab_dose_q2w');
      const dupWks = thFor('interval_weeks', 'copd.dupilumab_interval_weeks');
      const mepoDose = thFor('dose_mg', 'copd.mepolizumab_dose_q4w');
      const mepoWks = thFor('interval_weeks', 'copd.mepolizumab_interval_weeks');
      const fev1Pct = getFev1PredPct(ctx);
      const fev1Min = thFor('fev1PredPct', 'copd.dupilumab_trial_fev1_min');
      const fev1Max = thFor('fev1PredPct', 'copd.dupilumab_trial_fev1_max');
      const outsideBoreasRange =
        fev1Pct !== undefined && (fev1Pct < fev1Min || fev1Pct > fev1Max);
      const isPregOrLact =
        hasCondition(ctx, 'pregnant') || Boolean(ctx.patient.conditions?.pregnant) || hasBreastfeeding(ctx);

      return {
        id: 'rec_copd_dupilumab',
        module: 'copd',
        tier: 'Leo thang điều trị',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Cân nhắc bổ sung MỘT thuốc sinh học: Ưu tiên ${d.nameVi} (hoặc thay thế ${dMepo.nameVi}) khi BCAT ≥ ${eosHigh} /µL + Viêm phế quản mạn`,
        rationale: `Theo GOLD 2026 (PDF p. 77 / trang in 66) và FDA, bệnh nhân COPD vẫn tái phát đợt cấp trên nền thuốc hít tối ưu, có BCAT máu ≥ ${eosHigh} tế bào/µL và kiểu hình viêm phế quản mạn: Cân nhắc bổ sung ${d.nameVi} (${dupDose} mg tiêm dưới da mỗi ${dupWks} tuần – cải thiện cả đợt cấp lẫn FEV₁ qua thử nghiệm BOREAS/NOTUS) hoặc lựa chọn thay thế đơn trị ${dMepo.nameVi} (${mepoDose} mg tiêm dưới da mỗi ${mepoWks} tuần qua thử nghiệm MATINEE). Tuyệt đối CHỈ CHỌN MỘT kháng thể đơn dòng duy nhất, không phối hợp đồng thời hai thuốc sinh học.`,
        profileDiff: {
          INTL: 'GOLD 2026 khuyến cáo lựa chọn Dupilumab (ưu tiên khi có viêm phế quản mạn) hoặc Mepolizumab đơn trị trên nền thuốc hít tối ưu.',
          VN: 'Liệu pháp kháng thể đơn dòng (Dupilumab, Mepolizumab) hiện thuộc khuyến cáo cập nhật của GOLD 2026 và chưa được đưa vào hướng dẫn BYT QĐ 2131/2026; cần hội chẩn chuyên khoa Hô hấp tuyến sâu.',
          US: 'FDA phê duyệt Dupixent (dupilumab) và Nucala (mepolizumab) là liệu pháp sinh học bổ trợ đơn chất cho COPD tăng BCAT máu.',
        },
        warnings: [
          'Tầm soát và điều trị nhiễm ký sinh trùng giun sán (đặc biệt giun lươn Strongyloides stercoralis) trước khởi trị; tránh tiêm vắc xin sống giảm độc lực và theo dõi viêm kết mạc/giác mạc, đau khớp hoặc viêm túi mật cấp (FDA §5.9 & §6.1).',
          ...(outsideBoreasRange
            ? [
                `Lưu ý thử nghiệm BOREAS/NOTUS tuyển bệnh nhân có FEV₁ sau giãn phế quản ${fev1Min}–${fev1Max}% dự đoán (hiện tại FEV₁ = ${fev1Pct}%); cần hội chẩn chuyên khoa cá thể hóa.`,
              ]
            : []),
          ...(isPregOrLact
            ? [
                'Thai kỳ / Cho con bú: Kháng thể IgG4 qua nhau thai và tiết lượng nhỏ vào sữa mẹ; cần hội chẩn chuyên khoa đánh giá lợi ích – nguy cơ.',
              ]
            : []),
        ],
        gates: [],
        citationIds: [
          'gold.copd.2026.biologics_dupilumab_mepolizumab',
          'fda.copd.dupilumab_dose',
          'fda.copd.dupilumab_boreas_fev1_30_70',
          'fda.copd.dupilumab_helminth',
          'fda.copd.dupilumab_cholecystitis',
          'gina.copd.2026.mepolizumab_100mg_q4w',
          ...(isPregOrLact ? ['gina.copd.2026.pregnancy_biologics_scarce'] : []),
        ],
        priority: 60,
      };
    },
  },

  {
    id: 'copd.followup.mepolizumab_indication',
    module: 'copd',
    nameVi: 'Chỉ định Mepolizumab tiêm dưới da khi BCAT 300–<1500 /µL không kèm viêm phế quản mạn',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.biologics_dupilumab_mepolizumab',
      'gina.copd.2026.mepolizumab_100mg_q4w',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!isEligibleForBiologicInhalerBase(ctx)) return false;
      if (hasAnyCurrentMed(ctx, COPD_APPROVED_BIOLOGIC_IDS) !== undefined) return false;
      if (hasConcurrentAsthma(ctx) && hasAnyCurrentMed(ctx, RESPIRATORY_BIOLOGIC_IDS) !== undefined) {
        return false;
      }
      if (!isGroupEConfirmed(ctx)) return false;
      if (hasSevereHypereosinophiliaForBiologics(ctx)) return false;
      if (Boolean(ctx.normalized.customInputs?.chronicBronchitis)) return false;
      const eos = getBloodEos(ctx);
      return eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_high');
    },
    produce: (ctx) => {
      const d = drug('mepolizumab');
      const startDoseText = fmtDose(dose('mepolizumab', 'start'));
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      const mepoDose = thFor('dose_mg', 'copd.mepolizumab_dose_q4w');
      const mepoWks = thFor('interval_weeks', 'copd.mepolizumab_interval_weeks');
      const isPregOrLact =
        hasCondition(ctx, 'pregnant') || Boolean(ctx.patient.conditions?.pregnant) || hasBreastfeeding(ctx);

      return {
        id: 'rec_copd_mepolizumab',
        module: 'copd',
        tier: 'Leo thang điều trị',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Cân nhắc Mepolizumab tiêm dưới da (BCAT ≥ ${eosHigh} /µL – kiểu hình không viêm phế quản mạn)`,
        rationale: `Theo GOLD 2026 (PDF p. 77 / trang in 66: "with and without chronic bronchitis"), ở bệnh nhân COPD có đợt cấp tái phát trên nền thuốc hít tối ưu kèm BCAT máu ≥ ${eosHigh} tế bào/µL nhưng KHÔNG có kiểu hình viêm phế quản mạn (nơi Dupilumab chưa có chỉ định), cân nhắc bổ sung đơn trị ${d.nameVi} (${mepoDose} mg tiêm dưới da mỗi ${mepoWks} tuần) để giảm tần suất đợt cấp.`,
        profileDiff: {
          INTL: `GOLD 2026 bổ sung Mepolizumab cho bệnh nhân COPD tăng BCAT máu ≥ ${eosHigh} /µL không phụ thuộc kiểu hình viêm phế quản mạn.`,
          VN: 'Tại Việt Nam, Mepolizumab (Nucala) mới lưu hành hạn chế tại các trung tâm chuyên sâu và chưa được đưa vào hướng dẫn BYT QĐ 2131/2026 cho chỉ định COPD.',
          US: 'Mepolizumab (Nucala) được khuyến cáo theo GOLD 2026 dựa trên thử nghiệm MATINEE cho COPD tăng BCAT máu.',
        },
        warnings: [
          'Tầm soát và điều trị nhiễm ký sinh trùng giun sán (Strongyloides) trước khởi trị; cân nhắc tiêm vắc xin Zona bất hoạt tái tổ hợp trước điều trị.',
          ...(isPregOrLact
            ? [
                'Thai kỳ / Cho con bú: Kháng thể đơn dòng IgG1 đi qua nhau thai; chỉ sử dụng khi lợi ích vượt trội nguy cơ tiềm ẩn qua hội chẩn chuyên khoa.',
              ]
            : []),
        ],
        gates: [],
        citationIds: [
          'gold.copd.2026.biologics_dupilumab_mepolizumab',
          'gina.copd.2026.mepolizumab_100mg_q4w',
          ...(isPregOrLact ? ['gina.copd.2026.pregnancy_biologics_scarce'] : []),
        ],
        priority: 58,
      };
    },
  },

  {
    id: 'copd.followup.biologic_continue',
    module: 'copd',
    nameVi: 'Duy trì & đánh giá đáp ứng thuốc sinh học (Dupilumab / Mepolizumab) đang sử dụng',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.biologics_dupilumab_mepolizumab',
      'fda.copd.dupilumab_dose',
      'gina.copd.2026.mepolizumab_100mg_q4w',
      'gina.copd.2026.pregnancy_biologics_scarce',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (ctx.normalized.selectedModules.includes('asthma')) return false;
      return getRetainedApprovedCopdBiologicMed(ctx) !== undefined;
    },
    produce: (ctx) => {
      const bioMed = getRetainedApprovedCopdBiologicMed(ctx)!;
      const id = bioMed.drugId.trim().toLowerCase();
      const d = hasDrug(id) ? drug(id) : drug('dupilumab');
      const isPregOrLact =
        hasCondition(ctx, 'pregnant') || Boolean(ctx.patient.conditions?.pregnant) || hasBreastfeeding(ctx);
      return {
        id: 'rec_copd_biologic_continue',
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: fmtDose(dose(d.id, 'target')),
        title: `Tiếp tục duy trì liệu pháp sinh học ${d.nameVi} trên nền thuốc hít tối ưu và đánh giá đáp ứng định kỳ`,
        rationale:
          'Bệnh nhân đang dùng kháng thể đơn dòng bổ trợ cho COPD tăng bạch cầu ái toan: Tiếp tục duy trì đúng lịch tiêm dưới da song song với bình hít nền tảng (không tự ý ngưng thuốc hít duy trì), đánh giá lại đợt cấp, triệu chứng và tác dụng phụ sau 6–12 tháng.',
        warnings: [
          'Tránh tiêm các vắc xin sống giảm độc lực trong thời gian điều trị thuốc sinh học; theo dõi nhiễm ký sinh trùng (Strongyloides) và phản ứng tại mắt/khớp.',
          ...(isPregOrLact
            ? ['Thai kỳ / Cho con bú: Kháng thể đơn dòng đi qua nhau thai; cần hội chẩn Sản – Hô hấp đánh giá lợi ích – nguy cơ.']
            : []),
        ],
        gates: [],
        citationIds: [
          'gold.copd.2026.biologics_dupilumab_mepolizumab',
          'fda.copd.dupilumab_dose',
          'gina.copd.2026.mepolizumab_100mg_q4w',
          ...(isPregOrLact ? ['gina.copd.2026.pregnancy_biologics_scarce'] : []),
        ],
        priority: 62,
      };
    },
  },
];
