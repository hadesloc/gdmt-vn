/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - An toàn Cho con bú, Loét bàn chân, Ung thư bàng quang, Xơ gan & Dị ứng
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, fmtDose, thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  DPP4_IDS,
  INCRETIN_RA_IDS,
  NON_INSULIN_DM2_IDS,
  SGLT2_IDS,
  SU_IDS,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  formatActiveMedDose,
  getEffectiveEgfr,
  getFdcBlockedCompanionReason,
  hasActiveBladderCancer,
  hasActiveFootUlcer,
  hasCirrhosis,
  hasDm2Context,
  hasDrugAllergy,
  hasHepaticImpairment,
  hasMtcOrMen2,
  hasPancreatitis,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isPregnant,
  isTakingCanonical,
  resolveDrugNameVi,
  resolveTargetRecDrug
} from './helpers';

const LACTATION_UNSAFE_IDS = [
  ...SGLT2_IDS,
  ...INCRETIN_RA_IDS,
  ...DPP4_IDS,
  ...SU_IDS,
  'pioglitazone',
  'acarbose'
] as const;

const ALL_DM2_CHECKABLE_IDS = [
  ...NON_INSULIN_DM2_IDS,
  ...ALL_INSULIN_IDS
] as const;

// 1. NGỪNG NGAY CANAGLIFLOZIN KHI CÓ LOÉT BÀN CHÂN / HOẠI THƯ / TIỀN SỬ ĐOẠN CHI (ĐỘC LẬP HF/CKD/ASCVD & NỘI/NGOẠI TRÚ)
const activeFootUlcerCanagliflozinStopRule: Rule = {
  id: 'dm2.safety.foot_ulcer_stop_canagliflozin',
  module: 'dm2',
  nameVi: 'Ngừng ngay Canagliflozin khi đang có loét bàn chân ĐTĐ, hoại thư, viêm xương hoặc tiền sử đoạn chi (CANVAS)',
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) =>
    !isPregnant(ctx) &&
    !isBreastfeeding(ctx) &&
    hasActiveFootUlcer(ctx) &&
    isTakingCanonical(ctx, 'canagliflozin'),
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, 'canagliflozin');
    const target = resolveTargetRecDrug('canagliflozin', med);
    return {
      id: 'rec_dm2_foot_ulcer_stop_canagliflozin',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG NGAY ${target.drugNameVi} do đang có Loét bàn chân ĐTĐ / Nguy cơ đoạn chi cao (CANVAS)`,
      rationale:
        'Thử nghiệm CANVAS & ADA 2026: Canagliflozin làm tăng có ý nghĩa nguy cơ cắt cụt chi dưới (ngón chân, bàn chân, cẳng chân); bắt buộc ngừng ngay ở người bệnh đang có loét bàn chân tiến triển, hoại thư, viêm xương tủy hoặc tiền sử đoạn chi, bất kể có kèm suy tim hay bệnh thận mạn hay không.',
      gates: [
        {
          parameter: 'activeFootUlcer',
          passed: false,
          threshold: 1,
          messageVi: `Loét bàn chân / Nguy cơ đoạn chi: Bắt buộc ngừng ${target.drugNameVi}`
        }
      ],
      citationIds: ['ada.dm2.2026.sglt2i_foot_ulcer_caution'],
      priority: 99
    };
  },
  citationIds: ['ada.dm2.2026.sglt2i_foot_ulcer_caution']
};

// 2. NGỪNG CÁC THUỐC KHÔNG AN TOÀN TRONG THỜI KỲ CHO CON BÚ (CHỈ GIỮ INSULIN & METFORMIN)
const lactationStopRules: Rule[] = LACTATION_UNSAFE_IDS.map((drugId) => {
  const isGlp1 = (INCRETIN_RA_IDS as readonly string[]).includes(drugId);
  const citations = isGlp1
    ? ['ada.dm2.2026.pregnancy_glp1', 'ada.dm2.2026.pregnancy_insulin']
    : ['ada.dm2.2026.pregnancy_noninsulin', 'ada.dm2.2026.pregnancy_insulin'];
  return {
    id: `dm2.safety.lactation_stop_${drugId}`,
    module: 'dm2',
    nameVi: `Ngừng ${resolveDrugNameVi(drugId)} ở phụ nữ đang cho con bú (Chuyển sang Insulin / Metformin)`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isBreastfeeding(ctx) && isTakingCanonical(ctx, drugId),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, drugId);
      const target = resolveTargetRecDrug(drugId, med);
      const fdcNote = target.isFdc
        ? ' Nếu là viên/bút phối hợp chứa Metformin hoặc Insulin (vd: Synjardy, Xigduo, Janumet, Soliqua, Xultophy), phải ngừng chế phẩm phối hợp và chuyển sang Metformin hoặc Insulin đơn chất.'
        : '';
      return {
        id: `rec_dm2_lactation_stop_${drugId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn Thai kỳ & Cho con bú',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} trong thời kỳ đang cho con bú`,
        rationale:
          `ADA 2026 Ch. 15 & Nhãn FDA: Không khuyến cáo sử dụng ${target.drugNameVi} khi đang nuôi con bằng sữa mẹ do nguy cơ bài tiết qua sữa mẹ hoặc thiếu dữ liệu an toàn trên thận/chuyển hóa trẻ nhũ nhi; ưu tiên kiểm soát đường huyết bằng Insulin và/hoặc Metformin đơn chất.${fdcNote}`,
        gates: [{ parameter: 'breastfeeding', passed: false, threshold: 1, messageVi: `Cho con bú: Ngừng ${target.drugNameVi}` }],
        citationIds: citations,
        priority: 99
      };
    },
    citationIds: citations
  };
});

// 3. PHÁC ĐỒ INSULIN AN TOÀN CHO PHỤ NỮ ĐANG CHO CON BÚ KHI CẦN KIỂM SOÁT ĐƯỜNG HUYẾT NGOẠI TRÚ
const lactationInsulinSupportRule: Rule = {
  id: 'dm2.outpatient.lactation_insulin_support',
  module: 'dm2',
  nameVi: 'Sử dụng / Chuyển sang Insulin nền đơn chất an toàn trong thời kỳ đang cho con bú',
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!hasDm2Context(ctx) || !isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
    const crisis = evaluateHyperglycemicCrisis(ctx);
    if (crisis.isCrisis || crisis.isIsolatedKetonemia) return false;
    const basalInfo = extractBasalInsulinInfo(ctx);
    if (basalInfo.hasAnyInsulin) return true;
    const hba1c = need(ctx, 'hba1c');
    const glucose = need(ctx, 'glucose');
    const egfr = getEffectiveEgfr(ctx);
    const metforminBlocked =
      isOnDialysis(ctx) ||
      hasHepaticImpairment(ctx) ||
      hasDrugAllergy(ctx, 'metformin') ||
      (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra'));
    return (
      metforminBlocked ||
      (hba1c !== undefined && hba1c >= thFor('hba1c', 'dm2.hba1c.target_older_complex')) ||
      (glucose !== undefined && glucose >= thFor('glucose', 'dm2.dka.glucose_mmol'))
    );
  },
  produce: (ctx) => {
    const basalInfo = extractBasalInsulinInfo(ctx);
    const existingId = basalInfo.activeBasalDrugId || (basalInfo.isPremix ? 'insulin_premix' : undefined);
    const existingMed = existingId ? findActiveMedByCanonical(ctx, existingId) : undefined;
    const blockedFdcReason =
      existingId && existingMed ? getFdcBlockedCompanionReason(ctx, existingMed, existingId) : undefined;
    const chosenId = existingId && !blockedFdcReason && !hasDrugAllergy(ctx, existingId)
      ? existingId
      : !hasDrugAllergy(ctx, 'insulin_glargine')
        ? 'insulin_glargine'
        : 'insulin_nph';
    const d = drug(chosenId);
    const isContinuingClean = Boolean(existingId && !blockedFdcReason && chosenId === existingId);

    return {
      id: 'rec_dm2_lactation_insulin',
      module: 'dm2',
      tier: 'Kiểm soát Đường huyết Thời kỳ Cho con bú',
      tierOrder: 1,
      action: isContinuingClean ? 'CONTINUE' : 'START',
      drugId: d.id,
      drugNameVi: d.nameVi,
      dose: isContinuingClean
        ? formatActiveMedDose(existingMed, d.id) || fmtDose(d.start)
        : fmtDose(d.start),
      title: isContinuingClean
        ? `Tiếp tục ${d.nameVi} đơn chất trong thời kỳ cho con bú (Theo dõi giảm nhu cầu insulin do tiết sữa)`
        : blockedFdcReason
          ? `Chuyển sang ${d.nameVi} đơn chất thay cho bút phối hợp khi đang cho con bú`
          : `Khởi trị ${d.nameVi} an toàn trong thời kỳ đang cho con bú`,
      rationale:
        'ADA 2026 Ch. 15: Insulin và Metformin là hai lựa chọn an toàn tương thích với nuôi con bằng sữa mẹ. Lưu ý quá trình tiết sữa làm tiêu hao năng lượng đáng kể nên cần theo dõi sát đường huyết mao mạch và giảm liều insulin kịp thời để tránh hạ đường huyết sau sinh.',
      gates: [],
      citationIds: ['ada.dm2.2026.pregnancy_insulin'],
      priority: 94
    };
  },
  citationIds: ['ada.dm2.2026.pregnancy_insulin']
};

// 4. NGỪNG PIOGLITAZONE KHI CÓ UNG THƯ BÀNG QUANG ĐANG HOẠT ĐỘNG
const pioglitazoneBladderCancerStopRule: Rule = {
  id: 'dm2.safety.pioglitazone_bladder_cancer_stop',
  module: 'dm2',
  nameVi: 'Chống chỉ định Pioglitazone ở bệnh nhân có ung thư bàng quang đang hoạt động',
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => !isPregnant(ctx) && !isBreastfeeding(ctx) && hasActiveBladderCancer(ctx) && isTakingCanonical(ctx, 'pioglitazone'),
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, 'pioglitazone');
    const target = resolveTargetRecDrug('pioglitazone', med);
    return {
      id: 'rec_dm2_pioglitazone_bladder_cancer_stop',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG ${target.drugNameVi} do Ung thư bàng quang đang hoạt động`,
      rationale:
        'Nhãn FDA Actos: Không sử dụng Pioglitazone ở bệnh nhân có ung thư bàng quang đang hoạt động do nguy cơ thúc đẩy tiến triển khối u bàng quang.',
      gates: [{ parameter: 'activeBladderCancer', passed: false, threshold: 1, messageVi: 'Ung thư bàng quang: Ngừng Pioglitazone' }],
      citationIds: ['fda.pioglitazone.bladder_cancer'],
      priority: 99
    };
  },
  citationIds: ['fda.pioglitazone.bladder_cancer']
};

// 5. NGỪNG ACARBOSE KHI CÓ XƠ GAN (BAO GỒM CẢ XƠ GAN CÒN BÙ CHILD-PUGH A)
const acarboseCirrhosisStopRule: Rule = {
  id: 'dm2.safety.acarbose_cirrhosis_stop',
  module: 'dm2',
  nameVi: 'Chống chỉ định Acarbose ở bệnh nhân xơ gan hoặc bệnh gan nặng',
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) =>
    !isPregnant(ctx) &&
    !isBreastfeeding(ctx) &&
    (hasCirrhosis(ctx) || hasHepaticImpairment(ctx)) &&
    isTakingCanonical(ctx, 'acarbose'),
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, 'acarbose');
    const target = resolveTargetRecDrug('acarbose', med);
    return {
      id: 'rec_dm2_acarbose_cirrhosis_stop',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG ${target.drugNameVi} do chống chỉ định ở bệnh nhân Xơ gan / Suy gan`,
      rationale:
        'Nhãn FDA Precose (Acarbose): Acarbose chống chỉ định ở mọi giai đoạn xơ gan (kể cả Child-Pugh A) và bệnh gan mạn nặng do nguy cơ tăng transaminase gan nghiêm trọng.',
      gates: [{ parameter: 'cirrhosis', passed: false, threshold: 1, messageVi: 'Xơ gan / Bệnh gan: Chống chỉ định Acarbose' }],
      citationIds: ['ada.dm2.2026.decompensated_cirrhosis_insulin'],
      priority: 99
    };
  },
  citationIds: ['ada.dm2.2026.decompensated_cirrhosis_insulin']
};

// 6. NGỪNG LIXISENATIDE / EXENATIDE (BAO GỒM BÚT PHỐI HỢP SOLIQUA) KHI eGFR <= 30 HOẶC LỌC MÁU (P10)
const exendinRenalStopRules: Rule[] = (['lixisenatide', 'exenatide'] as const).map((raId) => ({
  id: `dm2.safety.renal_stop_${raId}`,
  module: 'dm2',
  nameVi: `Ngừng ${resolveDrugNameVi(raId)} khi eGFR ≤ 30 mL/phút/1.73m² hoặc lọc máu`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || hasMtcOrMen2(ctx) || hasPancreatitis(ctx)) return false;
    if (!isTakingCanonical(ctx, raId)) return false;
    const egfr = getEffectiveEgfr(ctx);
    return isOnDialysis(ctx) || (egfr !== undefined && egfr <= thFor('egfr', 'dm2.metformin.egfr_contra'));
  },
  produce: (ctx) => {
    const egfr = getEffectiveEgfr(ctx);
    const maxCutoff = thFor('egfr', 'dm2.metformin.egfr_contra');
    const med = findActiveMedByCanonical(ctx, raId);
    const target = resolveTargetRecDrug(raId, med);
    const fdcNote = target.isFdc
      ? ' Do đây là bút tiêm phối hợp cố định (vd: Soliqua = Insulin Glargine + Lixisenatide), bắt buộc ngừng bút Soliqua và chuyển sang Insulin Glargine đơn chất (cộng Semaglutide/Dulaglutide/Liraglutide riêng nếu cần và eGFR ≥ 15).'
      : '';
    return {
      id: `rec_dm2_renal_stop_${raId}`,
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG ${target.drugNameVi} do suy thận nặng (eGFR ${egfr !== undefined ? egfr.toFixed(0) : '< 30'} ≤ ${maxCutoff} mL/phút/1.73m²)`,
      rationale:
        `ADA 2026 Ch. 11: Exenatide và Lixisenatide thải trừ qua thận nên không khuyến cáo/chống chỉ định khi eGFR ≤ ${maxCutoff} mL/phút/1.73m² do tích lũy thuốc gây nôn ói và tổn thương thận cấp.${fdcNote}`,
      gates: [{ parameter: 'eGFR', passed: false, value: egfr, threshold: maxCutoff, messageVi: `eGFR ≤ ${maxCutoff}: Ngừng ${target.drugNameVi}` }],
      citationIds: ['ada.dm2.2026.lixisenatide_exenatide_renal_avoid_30'],
      priority: 99
    };
  },
  citationIds: ['ada.dm2.2026.lixisenatide_exenatide_renal_avoid_30']
}));

// 7. NGỪNG NGAY BẤT KỲ THUỐC ĐTĐ ĐANG DÙNG NẾU GHI NHẬN TIỀN SỬ DỊ ỨNG / QUÁ MẪN VỚI HOẠT CHẤT ĐÓ
const activeMedAllergyStopRules: Rule[] = ALL_DM2_CHECKABLE_IDS.map((drugId) => ({
  id: `dm2.safety.allergy_stop_${drugId}`,
  module: 'dm2',
  nameVi: `Ngừng ngay ${resolveDrugNameVi(drugId)} do tiền sử dị ứng / quá mẫn với thuốc`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => hasDrugAllergy(ctx, drugId) && isTakingCanonical(ctx, drugId),
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, drugId);
    const target = resolveTargetRecDrug(drugId, med);
    return {
      id: `rec_dm2_allergy_stop_${drugId}`,
      module: 'dm2',
      tier: 'Cảnh báo An toàn Đỏ',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `NGỪNG KHẨN CẤP ${target.drugNameVi} – Bệnh nhân có tiền sử dị ứng / quá mẫn`,
      rationale:
        `Ghi nhận tiền sử dị ứng với thành phần ${resolveDrugNameVi(drugId)} trong hồ sơ bệnh nhân; bắt buộc ngừng ngay ${target.drugNameVi} và thay thế bằng nhóm hoạt chất không dị ứng chéo.`,
      gates: [{ parameter: 'allergy', passed: false, threshold: 1, messageVi: `Dị ứng thuốc: Ngừng ${target.drugNameVi}` }],
      citationIds: ['ada.dm2.2026.rec_9_15_intensify'],
      priority: 100
    };
  },
  citationIds: ['ada.dm2.2026.rec_9_15_intensify']
}));

export const dm2SafetyLactationAndFootRules: Rule[] = [
  activeFootUlcerCanagliflozinStopRule,
  ...lactationStopRules,
  lactationInsulinSupportRule,
  pioglitazoneBladderCancerStopRule,
  acarboseCirrhosisStopRule,
  ...exendinRenalStopRules,
  ...activeMedAllergyStopRules
];
