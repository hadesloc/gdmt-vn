/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Phối hợp Thuốc Bậc 2 (Glycemic Step-Up) & Giám sát Gãy xương TZD
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { dose, drug, fmtDose, thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  DPP4_IDS,
  INCRETIN_RA_IDS,
  SGLT2_IDS,
  SU_IDS,
  computeIndividualizedHba1cTarget,
  evaluateHyperglycemicCrisis,
  extractBasalInsulinInfo,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasActiveBladderCancer,
  hasActiveFootUlcer,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasDrugAllergy,
  hasFractureOrOsteoporosisRisk,
  hasHepaticImpairment,
  hasHf,
  hasPancreatitis,
  hasPioglitazoneHepaticContra,
  hasPlannedContrast,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  pickFirstNonAllergicCandidate,
  resolveElderlyStatus,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';
import { shouldDeintensifyHypoMeds } from './rules.safety.deintensify';

export const dm2StepUpRules: Rule[] = [
  {
    id: 'dm2.outpatient.glycemic_step_up',
    module: 'dm2',
    nameVi: 'Tăng bậc phối hợp thuốc kiểm soát đường huyết cá thể hóa khi HbA1c chưa đạt mục tiêu',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isCrisis || crisis.isIsolatedKetonemia) return false;

      const hba1c = need(ctx, 'hba1c');
      const glucose = need(ctx, 'glucose');
      if (hba1c === undefined || hba1c < computeIndividualizedHba1cTarget(ctx)) return false;

      const egfrCheck = getEffectiveEgfr(ctx);
      const hasSuOnlyReduced =
        shouldDeintensifyHypoMeds(ctx) &&
        resolveElderlyStatus(ctx) !== 'very_complex' &&
        SU_IDS.some(
          (id) =>
            isTakingCanonical(ctx, id) &&
            id !== 'glibenclamide' &&
            !isOnDialysis(ctx) &&
            !hasHepaticImpairment(ctx) &&
            (egfrCheck === undefined || egfrCheck >= thFor('egfr', 'dm2.su_agi.egfr_contra'))
        );
      if (hasSuOnlyReduced) return false;

      if (
        Boolean(ctx.patient.customInputs?.catabolicSymptoms) ||
        hba1c >= thFor('hba1c', 'dm2.early_insulin.hba1c') ||
        (glucose !== undefined && glucose >= thFor('glucose', 'dm2.early_insulin.glucose_mmol'))
      ) {
        return false;
      }

      if (extractBasalInsulinInfo(ctx).hasAnyInsulin || isTakingAnyCanonical(ctx, ALL_INSULIN_IDS)) {
        return false;
      }

      return true;
    },
    produce: (ctx) => {
      const egfr = getEffectiveEgfr(ctx);
      if (egfr === undefined && !isOnDialysis(ctx)) return null;

      const hba1c = need(ctx, 'hba1c')!;
      const target = computeIndividualizedHba1cTarget(ctx);
      const comboDelta = thFor('hba1c', 'dm2.hba1c.combo_delta');
      const chosenSglt2 = pickFirstNonAllergicCandidate(ctx, ['dapagliflozin', 'empagliflozin']);
      const chosenBasal =
        pickFirstNonAllergicCandidate(ctx, ['insulin_glargine', 'insulin_degludec', 'insulin_nph']) ||
        'insulin_glargine';

      const willNewlyStartSglt2 =
        !isTakingAnyCanonical(ctx, SGLT2_IDS) &&
        !isOnDialysis(ctx) &&
        !hasHepaticImpairment(ctx) &&
        !hasPlannedSurgery(ctx) &&
        !hasActiveFootUlcer(ctx) &&
        !(resolveElderlyStatus(ctx) === 'very_complex' && !hasHf(ctx)) &&
        Boolean(chosenSglt2) &&
        egfr !== undefined &&
        egfr >= thFor('egfr', 'ckd.sglt2i.egfr_initiate_min') &&
        (hasHf(ctx) || hasCkd(ctx) || hasAscvd(ctx));

      const willNewlyStartGlp1 =
        !isTakingAnyCanonical(ctx, INCRETIN_RA_IDS) && willStartOrContinueGlp1(ctx);

      if (willNewlyStartSglt2 || willNewlyStartGlp1) {
        return null;
      }

      const willNewlyStartMetformin =
        !isTakingCanonical(ctx, 'metformin') &&
        !isOnDialysis(ctx) &&
        !hasHepaticImpairment(ctx) &&
        !hasPlannedSurgery(ctx) &&
        !(hasPlannedContrast(ctx) && (egfr === undefined || egfr <= thFor('egfr', 'dm2.contrast.metformin_egfr_cutoff') || hasHf(ctx))) &&
        egfr !== undefined &&
        egfr >= thFor('egfr', 'dm2.metformin.egfr_caution') &&
        !hasDrugAllergy(ctx, 'metformin');

      if (willNewlyStartMetformin && hba1c < target + comboDelta) {
        return null;
      }

      const fixedStart = thFor('dose_units', 'dm2.insulin_glargine.fixed_start');
      const minUkg = thFor('insulin_u_per_kg', 'dm2.insulin.basal_weight_start_min');

      if (hasPlannedSurgery(ctx)) {
        return {
          id: 'rec_dm2_glycemic_step_up',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'CONSIDER',
          drugId: chosenBasal,
          drugNameVi: drug(chosenBasal).nameVi,
          dose: `Cân nhắc khởi trị ${fixedStart} đơn vị/ngày tiêm dưới da kiểm soát đường huyết chu phẫu`,
          title: `Cân nhắc ${drug(chosenBasal).nameVi} kiểm soát đường huyết chu phẫu (HbA1c ${hba1c.toFixed(1)}% vượt đích)`,
          rationale:
            'ADA 2026 Ch. 9 & Ch. 16: Khi bệnh nhân chuẩn bị phẫu thuật có HbA1c vượt mục tiêu nhưng các thuốc uống/SGLT2i/GLP-1 RA phải tạm ngừng hoặc trì hoãn, Insulin nền là liệu pháp an toàn và linh hoạt nhất.',
          gates: [],
          citationIds: ['ada.dm2.2026.rec_9_15_intensify', 'ada.dm2.2026.perioperative_oral_basal_25'],
          priority: 86
        };
      }

      const canUseLinagliptin =
        !isTakingAnyCanonical(ctx, [...DPP4_IDS, ...INCRETIN_RA_IDS]) &&
        !hasPancreatitis(ctx) &&
        !hasDrugAllergy(ctx, 'linagliptin');

      if (
        isOnDialysis(ctx) ||
        (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra')) ||
        hasHepaticImpairment(ctx) ||
        hasActiveFootUlcer(ctx)
      ) {
        if (canUseLinagliptin && !hasHepaticImpairment(ctx)) {
          return {
            id: 'rec_dm2_glycemic_step_up',
            module: 'dm2',
            tier: 'Kiểm soát đường huyết',
            tierOrder: 3,
            action: 'START',
            drugId: 'linagliptin',
            drugNameVi: drug('linagliptin').nameVi,
            dose: fmtDose(dose('linagliptin', 'start')),
            title: `Phối hợp / Khởi trị Linagliptin kiểm soát đường huyết an toàn (HbA1c ${hba1c.toFixed(1)}%)`,
            rationale:
              'ADA 2026 Ch. 9 & Ch. 11 (Rec 9.11, 9.15) & KDIGO 2022: Linagliptin thải trừ chủ yếu qua mật–ruột, không cần chỉnh liều ở mọi giai đoạn suy thận kể cả lọc máu và ít gây hạ đường huyết khi Metformin/SGLT2i/SU bị chống chỉ định.',
            gates: [],
            citationIds: ['ada.dm2.2026.rec_9_11_advanced_ckd', 'ada.dm2.2026.rec_9_15_intensify', 'fda.linagliptin.no_renal_adj'],
            priority: 88
          };
        }

        return {
          id: 'rec_dm2_glycemic_step_up',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: Boolean(ctx.patient.customInputs?.recentHypo) ? 'CONSIDER' : 'START',
          drugId: chosenBasal,
          drugNameVi: drug(chosenBasal).nameVi,
          dose: `Khởi đầu thận trọng ${fixedStart} đơn vị/ngày (hoặc ${minUkg} U/kg/ngày ở suy thận/suy gan nặng) tiêm dưới da`,
          title: `Khởi trị ${drug(chosenBasal).nameVi} liều thấp kiểm soát đường huyết (HbA1c ${hba1c.toFixed(1)}%)`,
          rationale:
            'ADA 2026 Ch. 4, Ch. 9 & Ch. 11 (Rec 9.11): Khi HbA1c vượt mục tiêu trên nền suy thận nặng/lọc máu, xơ gan mất bù (Child-Pugh B/C) hoặc chống chỉ định nhóm Incretin, khởi trị Insulin nền liều thấp và chuẩn độ thận trọng là lựa chọn hiệu quả và an toàn nhất.',
          gates: [],
          citationIds: ['ada.dm2.2026.rec_9_11_advanced_ckd', 'ada.dm2.2026.basal_start_and_titration'],
          priority: 87
        };
      }

      if (!isTakingAnyCanonical(ctx, SGLT2_IDS) && chosenSglt2 && resolveElderlyStatus(ctx) !== 'very_complex') {
        const glicStart = thFor('dose_mg', 'dm2.gliclazide.min_dose');
        return {
          id: 'rec_dm2_glycemic_step_up',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'START',
          drugId: chosenSglt2,
          drugNameVi: drug(chosenSglt2).nameVi,
          dose: fmtDose(dose(chosenSglt2, 'start')),
          title: `Phối hợp tăng bậc ${drug(chosenSglt2).nameVi} kiểm soát đường huyết (HbA1c ${hba1c.toFixed(1)}% chưa đạt đích < ${target.toFixed(1)}%)`,
          rationale:
            `ADA 2026 Ch. 9 (Khuyến cáo 9.15) & BYT 5481/2020: Tránh trì trệ lâm sàng khi HbA1c (${hba1c.toFixed(1)}%) vượt mục tiêu cá thể hóa trên nền Metformin; ưu tiên phối hợp thuốc bậc 2 không gây hạ đường huyết và không gây tăng cân như ức chế SGLT2 (hoặc DPP-4i / GLP-1 RA).`,
          gates: [],
          citationIds: ['ada.dm2.2026.rec_9_15_intensify', 'ada.dm2.2026.combo_hba1c_1_5_above'],
          priority: 86,
          profileDiff: {
            INTL: 'ADA 2026: Ưu tiên SGLT2i, GLP-1 RA hoặc DPP-4i để đạt đích HbA1c mà không gây hạ đường huyết hay tăng cân.',
            VN: `BYT 5481/2020 Phác đồ bậc 2: Phối hợp Metformin + SGLT2i / DPP-4i; nếu ưu tiên chi phí thấp BHYT và chức năng thận/gan tốt có thể cân nhắc Gliclazide MR khởi đầu ${glicStart} mg buổi sáng.`,
            US: 'ADA Standards of Care 2026 Ch. 9: Không trì hoãn phối hợp thuốc bậc hai ưu tiên nhóm ít gây hạ đường huyết và không tăng cân.'
          }
        };
      }

      const chosenDpp4 = !isTakingAnyCanonical(ctx, [...DPP4_IDS, ...INCRETIN_RA_IDS]) && !hasPancreatitis(ctx)
        ? pickFirstNonAllergicCandidate(ctx, ['linagliptin', 'sitagliptin'])
        : undefined;

      if (chosenDpp4) {
        return {
          id: 'rec_dm2_glycemic_step_up',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'START',
          drugId: chosenDpp4,
          drugNameVi: drug(chosenDpp4).nameVi,
          dose: fmtDose(dose(chosenDpp4, 'start')),
          title: `Phối hợp thêm ${drug(chosenDpp4).nameVi} để đạt mục tiêu HbA1c (< ${target.toFixed(1)}%)`,
          rationale:
            'ADA 2026 Ch. 9 (Rec 9.15): Phối hợp thêm thuốc ức chế DPP-4 an toàn, không gây hạ đường huyết khi người bệnh chưa dùng nhóm đồng vận GLP-1.',
          gates: [],
          citationIds: ['ada.dm2.2026.rec_9_15_intensify', 'fda.linagliptin.no_renal_adj'],
          priority: 85
        };
      }

      return {
        id: 'rec_dm2_glycemic_step_up',
        module: 'dm2',
        tier: 'Kiểm soát đường huyết',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: chosenBasal,
        drugNameVi: drug(chosenBasal).nameVi,
        dose: `Cân nhắc khởi trị ${fixedStart} đơn vị/ngày tiêm dưới da buổi tối`,
        title: `Cân nhắc khởi trị ${drug(chosenBasal).nameVi} bổ sung do HbA1c (${hba1c.toFixed(1)}%) chưa đạt đích`,
        rationale:
          'ADA 2026 Ch. 9 (Rec 9.15): Khi đã phối hợp đa thuốc đường uống / tiêm không phải insulin nhưng HbA1c vẫn trên mục tiêu, cân nhắc bổ sung Insulin nền.',
        gates: [],
        citationIds: ['ada.dm2.2026.rec_9_15_intensify', 'ada.dm2.2026.basal_start_and_titration'],
        priority: 84
      };
    },
    citationIds: [
      'ada.dm2.2026.rec_9_15_intensify',
      'ada.dm2.2026.combo_hba1c_1_5_above',
      'ada.dm2.2026.rec_9_11_advanced_ckd'
    ]
  },

  // CẢNH BÁO NGUY CƠ GÃY XƯƠNG KHI ĐANG SỬ DỤNG PIOGLITAZONE (PHỤ NỮ / LOÃNG XƯƠNG / TIỀN SỬ GÃY XƯƠNG)
  {
    id: 'dm2.outpatient.pioglitazone_fracture_caution',
    module: 'dm2',
    nameVi: 'Cảnh báo nguy cơ gãy xương và rà soát chuyển đổi Pioglitazone ở người bệnh nguy cơ cao',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      hasDm2Context(ctx) &&
      !isPregnant(ctx) &&
      !isBreastfeeding(ctx) &&
      !isActivelyHypoglycemic(ctx) &&
      !evaluateHyperglycemicCrisis(ctx).isCrisis &&
      !hasPlannedSurgery(ctx) &&
      isTakingCanonical(ctx, 'pioglitazone') &&
      !hasHf(ctx) &&
      !hasPioglitazoneHepaticContra(ctx) &&
      !hasActiveBladderCancer(ctx) &&
      !hasDrugAllergy(ctx, 'pioglitazone') &&
      hasFractureOrOsteoporosisRisk(ctx),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'pioglitazone');
      const target = resolveTargetRecDrug('pioglitazone', med);
      const hasOsteoporosis = Boolean(
        ctx.patient.conditions.osteoporosis === true ||
        ctx.patient.conditions.fractureHistory === true ||
        ctx.patient.customInputs?.osteoporosis === true ||
        ctx.patient.customInputs?.fractureHistory === true
      );
      return {
        id: 'rec_dm2_pioglitazone_fracture_caution',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 1,
        action: hasOsteoporosis ? 'AVOID' : 'CONSIDER',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: hasOsteoporosis
          ? `Tránh tiếp tục / Đổi ${target.drugNameVi} sang nhóm khác do Loãng xương / Tiền sử gãy xương`
          : `Thận trọng nguy cơ gãy xương và giữ nước khi dùng ${target.drugNameVi} ở phụ nữ`,
        rationale:
          'Nhãn FDA Actos (Mục 5.6) & ADA 2026 Ch. 9: Nhóm Thiazolidinedione (Pioglitazone) làm giảm mật độ xương và tăng nguy cơ gãy xương (đặc biệt ở phụ nữ, người cao tuổi hoặc có loãng xương/tiền sử gãy xương); cân nhắc chuyển sang SGLT2i, GLP-1 RA hoặc DPP-4i và đánh giá sức khỏe xương.',
        gates: [],
        citationIds: ['ada.dm2.2026.pioglitazone_hf_fracture_bladder'],
        priority: hasOsteoporosis ? 91 : 78
      };
    },
    citationIds: ['ada.dm2.2026.pioglitazone_hf_fracture_bladder']
  }
];
