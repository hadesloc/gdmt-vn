/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Chặn Trùng lặp Cùng Nhóm & Trùng lặp Viên Phối hợp FDC
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  BASAL_OR_PREMIX_IDS,
  BOLUS_INSULIN_IDS,
  DPP4_IDS,
  INCRETIN_RA_IDS,
  SU_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  findAllActiveMedsByCanonical,
  getFdcBlockedCompanionReason,
  hasHepaticImpairment,
  hasHf,
  hasMtcOrMen2,
  hasPancreatitis,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isFdcMed,
  isIcuSetting,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  resolveDrugNameVi,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';

const SU_KEEP_PREFERENCE: readonly string[] = [
  'gliclazide',
  'repaglinide',
  'glipizide',
  'glimepiride',
  'glibenclamide'
];

export const dm2SafetyDupRules: Rule[] = [
  ...SU_IDS.map((suId): Rule => ({
    id: suId === 'glimepiride' ? 'dm2.safety.duplicate_su_stop' : `dm2.safety.duplicate_su_stop_${suId}`,
    module: 'dm2',
    nameVi: `Ngừng trùng lặp thuốc kích thích tiết insulin (${resolveDrugNameVi(suId)})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      const activeSus = SU_IDS.filter((id) => isTakingCanonical(ctx, id));
      if (activeSus.length < 2 || !activeSus.includes(suId)) return false; // qa-allow: index - Kiểm tra số lượng SU dùng đồng thời >= 2
      const preferredKeep = SU_KEEP_PREFERENCE.find((pref) => activeSus.includes(pref as typeof SU_IDS[number])) || activeSus[0];
      return suId !== preferredKeep;
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, suId);
      const target = resolveTargetRecDrug(suId, med);
      return {
        id: suId === 'glimepiride' ? 'rec_dm2_duplicate_su_stop' : `rec_dm2_duplicate_su_stop_${suId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG NGAY ${target.drugNameVi} (Trùng lặp hai thuốc kích thích tiết insulin nhóm Sulfonylurea/Glinide)`,
        rationale:
          'BYT 5481/2020 & ADA 2026 Ch. 9: Tuyệt đối không phối hợp đồng thời hai thuốc nhóm Sulfonylurea/Glinide (vd: Gliclazide + Glimepiride hoặc Glimepiride + Glibenclamide/Daonil) do cộng gộp nguy cơ hạ đường huyết nặng kéo dài đe dọa tính mạng mà không tăng hiệu quả.',
        gates: [],
        warnings: [`Phát hiện trùng lặp nhiều thuốc Sulfonylurea/Glinide trong đơn hiện tại: Bắt buộc ngừng ${target.drugNameVi}!`],
        citationIds: ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
        priority: 99
      };
    },
    citationIds: ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  })),

  {
    id: 'dm2.safety.duplicate_metformin_fdc_stop',
    module: 'dm2',
    nameVi: 'Ngừng viên Metformin đơn chất bị trùng lặp khi đang dùng kèm viên phối hợp chứa Metformin',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || hasHepaticImpairment(ctx)) return false;
      const metMeds = findAllActiveMedsByCanonical(ctx, 'metformin');
      if (metMeds.length < 2) return false; // qa-allow: index - Kiểm tra từ 2 chế phẩm chứa Metformin trở lên
      const hasStandalone = metMeds.some((m) => !isFdcMed(m));
      const hasValidFdc = metMeds.some(
        (m) => isFdcMed(m) && !getFdcBlockedCompanionReason(ctx, m, 'metformin')
      );
      return hasStandalone && hasValidFdc;
    },
    produce: (ctx) => {
      const metMeds = findAllActiveMedsByCanonical(ctx, 'metformin');
      const fdcMed = metMeds.find((m) => isFdcMed(m));
      const fdcLabel = fdcMed?.name || fdcMed?.drugId || 'viên phối hợp FDC';
      const maxMg = thFor('dose_mg', 'dm2.metformin.dose_max');
      return {
        id: 'rec_dm2_duplicate_metformin_stop',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'metformin',
        drugNameVi: resolveDrugNameVi('metformin'),
        title: `NGỪNG viên Metformin đơn chất trùng lặp (Đang dùng kèm ${fdcLabel} đã chứa Metformin)`,
        rationale:
          `Nhãn FDA & KDIGO 2022: Phát hiện trùng lặp thành phần Metformin giữa viên đơn chất và viên phối hợp cố định (${fdcLabel}), có nguy cơ vượt trần tối đa (${maxMg} mg/ngày) và gây nhiễm toan acid lactic. Ngừng viên Metformin rời và tính tổng liều Metformin dựa trên viên phối hợp.`,
        gates: [],
        warnings: [`Cảnh báo quá liều ẩn do FDC: Đang dùng cả Metformin đơn chất lẫn ${fdcLabel}!`],
        citationIds: ['fda.metformin.egfr_bands', 'kdigo.dm2.2022.metformin_max_2000_1000'],
        priority: 99
      };
    },
    citationIds: ['fda.metformin.egfr_bands', 'kdigo.dm2.2022.metformin_max_2000_1000']
  },

  ...BASAL_OR_PREMIX_IDS.map((basalId): Rule => ({
    id: `dm2.safety.duplicate_basal_stop_${basalId}`,
    module: 'dm2',
    nameVi: `Ngừng trùng lặp insulin nền (${resolveDrugNameVi(basalId)})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx)) return false;
      if (ctx.settings.setting === 'inpatient' && basalId === 'insulin_premix') return false;
      const activeBasals = BASAL_OR_PREMIX_IDS.filter((id) => isTakingCanonical(ctx, id));
      if (activeBasals.length < 2 || !activeBasals.includes(basalId)) return false; // qa-allow: index - Kiểm tra số lượng thuốc nền >= 2
      const onSteroid = Boolean(ctx.patient.customInputs?.onSteroidTherapy);
      if (onSteroid && basalId === 'insulin_nph') return false;
      const primaryKeep = activeBasals[0] === 'insulin_nph' && onSteroid ? activeBasals[1] : activeBasals[0];
      return basalId !== primaryKeep;
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, basalId);
      const target = resolveTargetRecDrug(basalId, med);
      return {
        id: `rec_dm2_duplicate_basal_stop_${basalId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG NGAY ${target.drugNameVi} (Trùng lặp hai loại Insulin nền/trộn sẵn gây quá liều nguy hiểm)`,
        rationale:
          'ADA 2026 Ch. 9 & Ch. 16: Không dùng đồng thời hai loại insulin nền tác dụng dài/trộn sẵn (trừ phác đồ phối hợp NPH buổi sáng chuyên biệt khi dùng Glucocorticoid) do nguy cơ cộng dồn liều gây hạ đường huyết nặng.',
        gates: [],
        warnings: [`Phát hiện trùng lặp nhiều insulin nền trong đơn hiện tại: Ngừng ${target.drugNameVi} và đánh giá lại tổng liều nền!`],
        citationIds: ['ada.dm2.2026.overbasalization', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
        priority: 99
      };
    },
    citationIds: ['ada.dm2.2026.overbasalization', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  })),

  ...BOLUS_INSULIN_IDS.map((bolusId): Rule => ({
    id: `dm2.safety.duplicate_bolus_stop_${bolusId}`,
    module: 'dm2',
    nameVi: `Ngừng trùng lặp hai loại insulin tác dụng nhanh bữa ăn (${resolveDrugNameVi(bolusId)})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx)) return false;
      const activeBolus = BOLUS_INSULIN_IDS.filter((id) => isTakingCanonical(ctx, id));
      if (activeBolus.length < 2 || !activeBolus.includes(bolusId)) return false; // qa-allow: index - Kiểm tra số lượng insulin nhanh >= 2
      const needsInpatientRegular =
        ctx.settings.setting === 'inpatient' &&
        (evaluateHyperglycemicCrisis(ctx).isConfirmedCrisis ||
          isIcuSetting(ctx) ||
          ctx.patient.customInputs?.inpatientEating === 'tube_feeding');
      if (needsInpatientRegular && activeBolus.includes('insulin_regular')) {
        return bolusId !== 'insulin_regular';
      }
      return bolusId !== activeBolus[0];
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, bolusId);
      const target = resolveTargetRecDrug(bolusId, med);
      return {
        id: `rec_dm2_duplicate_bolus_stop_${bolusId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG NGAY ${target.drugNameVi} (Trùng lặp hai loại Insulin bữa ăn gây chồng liều hạ đường huyết)`,
        rationale:
          'Không phối hợp đồng thời hai chế phẩm insulin tác dụng nhanh/ngắn (vd: Aspart + Lispro hoặc Aspart + Regular) trong cùng phác đồ do nguy cơ chồng đỉnh tác dụng (insulin stacking) gây hạ đường huyết nặng.',
        gates: [],
        citationIds: ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
        priority: 99
      };
    },
    citationIds: ['ada.dm2.2026.hypo_rule_of_15', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  })),

  ...BOLUS_INSULIN_IDS.map((bolusId): Rule => ({
    id: `dm2.safety.premix_bolus_overlap_stop_${bolusId}`,
    module: 'dm2',
    nameVi: `Cảnh báo chồng liều Insulin trộn sẵn (Premix) với ${resolveDrugNameVi(bolusId)} rời`,
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx)) return false;
      const activeBolus = BOLUS_INSULIN_IDS.filter((id) => isTakingCanonical(ctx, id));
      if (activeBolus.length >= 2 && bolusId !== activeBolus[0]) return false; // qa-allow: index - Đã xử lý bởi duplicate_bolus_stop
      return isTakingCanonical(ctx, 'insulin_premix') && isTakingCanonical(ctx, bolusId);
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, bolusId);
      const target = resolveTargetRecDrug(bolusId, med);
      const premixMed = findActiveMedByCanonical(ctx, 'insulin_premix');
      const premixName = resolveDrugNameVi('insulin_premix', premixMed);
      return {
        id: `rec_dm2_premix_bolus_overlap_${bolusId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG chồng liều ${target.drugNameVi} trên nền ${premixName} (Chuyển hẳn sang Basal–Bolus chuẩn nếu cần mũi bữa ăn)`,
        rationale:
          `ADA 2026 Ch. 9: ${premixName} đã chứa sẵn thành phần insulin nhanh/ngắn cố định (vd: 30%); tiêm chồng thêm ${target.drugNameVi} rời làm tăng nguy cơ chồng liều hạ đường huyết nặng sau ăn. Cần ngừng ${target.drugNameVi} rời hoặc chuyển đổi toàn bộ ${premixName} sang phác đồ Basal–Bolus tách biệt.`,
        gates: [],
        citationIds: ['ada.dm2.2026.overbasalization', 'byt.dm2.2020.insulin_hypo_reduce_10_20'],
        priority: 98
      };
    },
    citationIds: ['ada.dm2.2026.overbasalization', 'byt.dm2.2020.insulin_hypo_reduce_10_20']
  })),

  ...DPP4_IDS.map((dpp4Id): Rule => ({
    id: `dm2.safety.duplicate_dpp4_stop_${dpp4Id}`,
    module: 'dm2',
    nameVi: `Ngừng trùng lặp thuốc ức chế DPP-4 (${resolveDrugNameVi(dpp4Id)})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (
        isPregnant(ctx) ||
        isBreastfeeding(ctx) ||
        hasPancreatitis(ctx) ||
        willStartOrContinueGlp1(ctx) ||
        isTakingAnyCanonical(ctx, INCRETIN_RA_IDS)
      ) {
        return false;
      }
      const activeDpp4s = DPP4_IDS.filter((id) => {
        if (!isTakingCanonical(ctx, id)) return false;
        if (id === 'saxagliptin' && hasHf(ctx)) return false;
        return true;
      });
      if (activeDpp4s.length < 2 || !activeDpp4s.includes(dpp4Id)) return false; // qa-allow: index - Kiểm tra trùng lặp >= 2 thuốc DPP-4i
      const preferredKeep = activeDpp4s.includes('linagliptin') ? 'linagliptin' : activeDpp4s[0];
      return dpp4Id !== preferredKeep;
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, dpp4Id);
      const target = resolveTargetRecDrug(dpp4Id, med);
      return {
        id: `rec_dm2_duplicate_dpp4_stop_${dpp4Id}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Ngừng ${target.drugNameVi} (Trùng lặp hai thuốc cùng nhóm ức chế DPP-4)`,
        rationale:
          'ADA 2026 Ch. 9: Không dùng đồng thời hai thuốc cùng nhóm ức chế DPP-4; chỉ giữ lại một hoạt chất phù hợp chức năng thận/gan nhất.',
        gates: [],
        citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'],
        priority: 98
      };
    },
    citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1']
  })),

  ...INCRETIN_RA_IDS.map((raId): Rule => ({
    id: `dm2.safety.duplicate_glp1_stop_${raId}`,
    module: 'dm2',
    nameVi: `Ngừng trùng lặp đồng vận GLP-1 / GIP-GLP-1 RA (${resolveDrugNameVi(raId)})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isBreastfeeding(ctx) || hasMtcOrMen2(ctx) || hasPancreatitis(ctx)) return false;
      const activeRas = INCRETIN_RA_IDS.filter((id) => isTakingCanonical(ctx, id));
      if (activeRas.length < 2 || !activeRas.includes(raId)) return false; // qa-allow: index - Kiểm tra trùng lặp >= 2 thuốc GLP-1/GIP-GLP-1 RA
      const preferredKeep = activeRas.includes('tirzepatide')
        ? 'tirzepatide'
        : activeRas.includes('semaglutide')
          ? 'semaglutide'
          : activeRas[0];
      return raId !== preferredKeep;
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, raId);
      const target = resolveTargetRecDrug(raId, med);
      return {
        id: `rec_dm2_duplicate_glp1_stop_${raId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} (Trùng lặp hai thuốc đồng vận GLP-1 / GIP-GLP-1 RA)`,
        rationale:
          'ADA 2026 Ch. 9: Không sử dụng đồng thời hai chế phẩm đồng vận thụ thể GLP-1 hoặc phối hợp GLP-1 RA với Tirzepatide do tăng độc tính tiêu hóa, viêm tụy và không có lợi ích cộng thêm.',
        gates: [],
        citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'],
        priority: 99
      };
    },
    citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1']
  }))
];
