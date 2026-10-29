/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Chống chỉ định Thai kỳ, MTC/MEN2, Viêm tụy, Hạ ĐH cấp & Trục Incretin
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  ALL_INCRETIN_IDS,
  DPP4_IDS,
  HYPO_HOLD_DRUG_IDS,
  INCRETIN_RA_IDS,
  NON_INSULIN_DM2_IDS,
  SU_IDS,
  findActiveMedByCanonical,
  hasMtcOrMen2,
  hasPancreatitis,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  resolveDrugNameVi,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';

const PREGNANCY_CITATIONS: Record<string, string> = {
  semaglutide: 'fda.semaglutide.pregnancy',
  semaglutide_oral: 'fda.semaglutide_rybelsus.pregnancy',
  dulaglutide: 'fda.dulaglutide.pregnancy',
  liraglutide: 'fda.liraglutide.pregnancy',
  tirzepatide: 'fda.tirzepatide.pregnancy'
};

const MTC_CITATIONS: Record<string, string> = {
  semaglutide: 'fda.semaglutide.boxed_warning_mtc',
  semaglutide_oral: 'fda.semaglutide_rybelsus.boxed_warning_mtc',
  dulaglutide: 'fda.dulaglutide.boxed_warning_mtc',
  liraglutide: 'fda.liraglutide.boxed_warning_mtc',
  tirzepatide: 'fda.tirzepatide.boxed_warning_mtc'
};

const PANCREATITIS_CITATIONS: Record<string, string> = {
  semaglutide: 'fda.semaglutide.pancreatitis',
  semaglutide_oral: 'fda.semaglutide_rybelsus.pancreatitis',
  dulaglutide: 'fda.dulaglutide.pancreatitis',
  liraglutide: 'fda.liraglutide.pancreatitis',
  tirzepatide: 'fda.tirzepatide.pancreatitis',
  sitagliptin: 'fda.sitagliptin.pancreatitis',
  linagliptin: 'fda.linagliptin.pancreatitis',
  vildagliptin: 'ema.vildagliptin.pancreatitis',
  saxagliptin: 'fda.saxagliptin.pancreatitis'
};

const pregnancyStopRules: Rule[] = NON_INSULIN_DM2_IDS.map((drugId) => {
  const specificCit = PREGNANCY_CITATIONS[drugId];
  const citations = specificCit
    ? [specificCit, 'ada.dm2.2026.pregnancy_insulin']
    : ['ada.dm2.2026.pregnancy_insulin'];
  return {
    id: `dm2.safety.pregnancy_stop_${drugId}`,
    module: 'dm2',
    nameVi: `Ngừng ${resolveDrugNameVi(drugId)} ở phụ nữ mang thai (Chuyển sang Insulin)`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isPregnant(ctx) && isTakingCanonical(ctx, drugId),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, drugId);
      const target = resolveTargetRecDrug(drugId, med);
      const fdcInsulinNote =
        target.isFdc && (target.drugId === 'soliqua' || target.drugId === 'xultophy')
          ? ' Chế phẩm phối hợp chứa đồng vận GLP-1 phải ngừng ngay; chuyển sang bút tiêm Insulin đơn chất an toàn cho thai kỳ.'
          : '';
      return {
        id: `rec_dm2_pregnancy_stop_${drugId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn Thai kỳ & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG KHẨN CẤP ${target.drugNameVi} do bệnh nhân đang mang thai`,
        rationale:
          `ADA 2026 Ch. 15: Không sử dụng ${target.drugNameVi} trong thai kỳ do nguy cơ qua nhau thai hoặc độc tính phôi thai; bắt buộc ngừng ngay và chuyển sang kiểm soát đường huyết bằng Insulin đơn chất.${fdcInsulinNote}`,
        gates: [{ parameter: 'pregnancy', passed: false, threshold: 1, messageVi: `Thai kỳ: Ngừng ${target.drugNameVi}` }],
        citationIds: citations,
        priority: 99
      };
    },
    citationIds: citations
  };
});

const mtcMen2StopRules: Rule[] = INCRETIN_RA_IDS.map((drugId) => {
  const cit = MTC_CITATIONS[drugId] || 'fda.semaglutide.boxed_warning_mtc';
  return {
    id: `dm2.safety.mtc_men2_stop_${drugId}`,
    module: 'dm2',
    nameVi: `Chống chỉ định hộp đen FDA: Ngừng ${resolveDrugNameVi(drugId)} khi có tiền sử MTC / MEN 2`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => hasMtcOrMen2(ctx) && isTakingCanonical(ctx, drugId),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, drugId);
      const target = resolveTargetRecDrug(drugId, med);
      const fdcNote = target.isFdc
        ? ' Lưu ý: Nếu đang dùng bút phối hợp cố định Insulin + GLP-1 RA (Soliqua/Xultophy), phải ngừng toàn bộ bút phối hợp và chuyển sang Insulin nền đơn chất.'
        : '';
      return {
        id: `rec_dm2_mtc_men2_stop_${drugId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG VĨNH VIỄN ${target.drugNameVi} (Chống chỉ định tuyệt đối: Tiền sử MTC / MEN 2)`,
        rationale:
          `Cảnh báo hộp đen FDA (Boxed Warning): Các thuốc đồng vận thụ thể GLP-1 và GIP/GLP-1 RA chống chỉ định tuyệt đối ở người có tiền sử bản thân hoặc gia đình mắc Ung thư biểu mô tuyến giáp thể tủy (MTC) hoặc Hội chứng đa u tuyến nội tiết típ 2 (MEN 2).${fdcNote}`,
        gates: [{ parameter: 'mtc_men2', passed: false, threshold: 1, messageVi: `MTC/MEN 2: Chống chỉ định ${target.drugNameVi}` }],
        citationIds: [cit],
        priority: 100
      };
    },
    citationIds: [cit]
  };
});

const pancreatitisStopRules: Rule[] = ALL_INCRETIN_IDS.map((drugId) => {
  const isDpp4 = (DPP4_IDS as readonly string[]).includes(drugId);
  const labelCit = PANCREATITIS_CITATIONS[drugId];
  const baseCit = isDpp4 ? 'ada.dm2.2026.dpp4_pancreatitis' : 'ada.dm2.2026.incretin_pancreatitis';
  const citations = labelCit ? [baseCit, labelCit] : [baseCit];
  return {
    id: `dm2.safety.pancreatitis_stop_${drugId}`,
    module: 'dm2',
    nameVi: `Ngừng ${resolveDrugNameVi(drugId)} do tiền sử hoặc nghi ngờ viêm tụy cấp`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx)) return false;
      if (!isDpp4 && hasMtcOrMen2(ctx)) return false;
      return hasPancreatitis(ctx) && isTakingCanonical(ctx, drugId);
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, drugId);
      const target = resolveTargetRecDrug(drugId, med);
      const fdcNote = target.isFdc
        ? ' Bắt buộc ngừng viên/bút phối hợp chứa thành phần Incretin này và chuyển sang hoạt chất đơn lẻ ngoài trục Incretin (vd: Metformin hoặc Insulin đơn chất).'
        : '';
      return {
        id: `rec_dm2_pancreatitis_stop_${drugId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} do tiền sử / nghi ngờ Viêm tụy cấp`,
        rationale:
          `ADA 2026 Ch. 9 & Nhãn FDA/EMA: Đã ghi nhận viêm tụy cấp hoại tử/xuất huyết khi dùng thuốc tác động trục Incretin (${target.drugNameVi}); bắt buộc ngừng ngay nếu nghi ngờ hoặc có tiền sử viêm tụy và không tái sử dụng.${fdcNote}`,
        gates: [{ parameter: 'pancreatitis', passed: false, threshold: 1, messageVi: `Viêm tụy: Ngừng ${target.drugNameVi}` }],
        citationIds: citations,
        priority: 100
      };
    },
    citationIds: citations
  };
});

const acuteHypoHoldRules: Rule[] = HYPO_HOLD_DRUG_IDS.map((drugId) => ({
  id: `dm2.safety.acute_hypo_hold_${drugId}`,
  module: 'dm2',
  nameVi: `Tạm ngừng khẩn cấp ${resolveDrugNameVi(drugId)} khi đang hạ đường huyết cấp`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if ((isPregnant(ctx) || isBreastfeeding(ctx)) && ((SU_IDS as readonly string[]).includes(drugId) || drugId === 'acarbose')) {
      return false;
    }
    return isActivelyHypoglycemic(ctx) && isTakingCanonical(ctx, drugId);
  },
  produce: (ctx) => {
    const glucose = need(ctx, 'glucose')!;
    const hypoThresh = thFor('glucose', 'dm2.hypo.threshold_level1_mmol');
    const reducePct = thFor('percentage', 'dm2.insulin.hypo_dose_reduction_pct');
    const med = findActiveMedByCanonical(ctx, drugId);
    const target = resolveTargetRecDrug(drugId, med);
    const isSu = (SU_IDS as readonly string[]).includes(drugId);
    const isAcarbose = drugId === 'acarbose';

    return {
      id: `rec_dm2_acute_hypo_hold_${drugId}`,
      module: 'dm2',
      tier: 'Cấp cứu & Xử trí biến cố cấp',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `TẠM NGỪNG KHẨN CẤP ${target.drugNameVi} do đang Hạ đường huyết cấp (${glucose.toFixed(1)} mmol/L)`,
      rationale: isAcarbose
        ? `Glucose ${glucose.toFixed(1)} < ${hypoThresh.toFixed(1)} mmol/L: Tạm hoãn cử ${target.drugNameVi} trong cơn hạ đường huyết cấp và lưu ý Acarbose ức chế thủy phân đường mía (sucrose) tại ruột nên chỉ Glucose/Dextrose nguyên chất mới có hiệu quả đường uống.`
        : isSu
          ? `Glucose ${glucose.toFixed(1)} < ${hypoThresh.toFixed(1)} mmol/L: Sulfonylurea/Glinide gây hạ đường huyết sâu kéo dài; bắt buộc đình chỉ ngay ${target.drugNameVi}, theo dõi đường huyết liên tục và đánh giá ngừng hẳn sau khi hồi phục.`
          : `Glucose ${glucose.toFixed(1)} < ${hypoThresh.toFixed(1)} mmol/L: Tạm hoãn ngay mũi tiêm ${target.drugNameVi}; sau khi hồi phục đường huyết ổn định cần giảm ít nhất ${reducePct}% liều insulin để phòng tái phát.`,
      gates: [{ parameter: 'glucose', passed: false, value: glucose, threshold: hypoThresh, messageVi: `Hạ ĐH cấp: Tạm ngừng ${target.drugNameVi}` }],
      citationIds: isAcarbose
        ? ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.acarbose_mechanism_monosaccharide']
        : ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
      priority: 100
    };
  },
  citationIds: ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
}));

const stopDpp4WithGlp1Rules: Rule[] = DPP4_IDS.map((dpp4Id) => ({
  id: dpp4Id === 'sitagliptin' ? 'dm2.outpatient.no_dpp4_plus_glp1' : `dm2.outpatient.no_dpp4_plus_glp1_${dpp4Id}`,
  module: 'dm2',
  nameVi: `Ngừng ${resolveDrugNameVi(dpp4Id)} khi phối hợp hoặc khởi trị đồng vận GLP-1 / GIP-GLP-1 RA`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || hasPancreatitis(ctx)) return false;
    if (!isTakingCanonical(ctx, dpp4Id)) return false;
    return isTakingAnyCanonical(ctx, INCRETIN_RA_IDS) || willStartOrContinueGlp1(ctx);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, dpp4Id);
    const target = resolveTargetRecDrug(dpp4Id, med);
    const fdcSwitchNote = target.isFdc
      ? ' Do đây là viên phối hợp cố định (vd: Janumet/Galvus Met/Kombiglyze/Qtern/Glyxambi), cần ngừng viên phối hợp này và chuyển sang viên đơn chất của thành phần cần giữ lại (vd: Metformin hoặc SGLT2i đơn chất) nếu không có chống chỉ định.'
      : '';
    return {
      id: dpp4Id === 'sitagliptin' ? 'rec_dm2_stop_dpp4_glp1_conflict' : `rec_dm2_stop_dpp4_glp1_conflict_${dpp4Id}`,
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'STOP',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `Ngừng ${target.drugNameVi} (Trùng lặp cơ chế trục Incretin với GLP-1 / GIP-GLP-1 RA)`,
      rationale:
        `Khuyến cáo ADA 2026 Ch. 9 (Khuyến cáo 9.18): Không phối hợp thuốc ức chế DPP-4 với đồng vận thụ thể GLP-1 hoặc GIP/GLP-1 RA do trùng lặp cơ chế không tăng thêm lợi ích.${fdcSwitchNote}`,
      gates: [],
      citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'],
      priority: 99
    };
  },
  citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1']
}));

export const dm2SafetyContraRules: Rule[] = [
  ...pregnancyStopRules,
  ...mtcMen2StopRules,
  ...pancreatitisStopRules,
  ...acuteHypoHoldRules,
  ...stopDpp4WithGlp1Rules
];
