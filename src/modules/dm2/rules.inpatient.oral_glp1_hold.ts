/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Tạm ngừng Thuốc Viên & GLP-1 RA Nội viện Cấp tính / Chu phẫu Gây mê
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  DPP4_IDS,
  INCRETIN_RA_IDS,
  SU_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  getEffectiveEgfr,
  hasActiveBladderCancer,
  hasCirrhosis,
  hasDrugAllergy,
  hasHepaticImpairment,
  hasHf,
  hasMtcOrMen2,
  hasPancreatitis,
  hasPioglitazoneHepaticContra,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isIcuSetting,
  isOnDialysis,
  isPregnant,
  isTakingCanonical,
  resolveDrugNameVi,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';

const INPATIENT_HOLD_ORAL_IDS = [...SU_IDS, 'pioglitazone', 'acarbose'] as const;

const inpatientAcuteOralHoldRules: Rule[] = INPATIENT_HOLD_ORAL_IDS.map((oralId) => ({
  id:
    oralId === 'gliclazide' || oralId === 'glimepiride'
      ? `dm2.inpatient.hold_su_acute_${oralId}`
      : `dm2.inpatient.hold_oral_acute_${oralId}`,
  module: 'dm2',
  nameVi: `Tạm ngừng ${resolveDrugNameVi(oralId)} khi nhập viện điều trị nội trú cấp tính`,
  setting: 'inpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || hasDrugAllergy(ctx, oralId)) {
      return false;
    }
    const egfr = getEffectiveEgfr(ctx);
    const isSu = (SU_IDS as readonly string[]).includes(oralId);
    if (
      (isSu || oralId === 'acarbose') &&
      oralId !== 'repaglinide' &&
      (isOnDialysis(ctx) || (egfr !== undefined && egfr < thFor('egfr', 'dm2.su_agi.egfr_contra')))
    ) {
      return false;
    }
    if (oralId === 'pioglitazone' && (hasHf(ctx) || hasPioglitazoneHepaticContra(ctx) || hasActiveBladderCancer(ctx))) {
      return false;
    }
    if (oralId === 'acarbose' && (hasCirrhosis(ctx) || hasHepaticImpairment(ctx))) return false;
    if (isSu && hasHepaticImpairment(ctx)) return false;
    return isTakingCanonical(ctx, oralId);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, oralId);
    const target = resolveTargetRecDrug(oralId, med);
    const isSu = (SU_IDS as readonly string[]).includes(oralId);
    return {
      id: isSu ? `rec_dm2_inpatient_hold_su_${oralId}` : `rec_dm2_inpatient_hold_oral_${oralId}`,
      module: 'dm2',
      tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: isSu
        ? `Tạm ngừng ${target.drugNameVi} nội viện (Phòng ngừa hạ đường huyết kéo dài)`
        : `Tạm ngừng ${target.drugNameVi} trong giai đoạn điều trị nội trú cấp tính`,
      rationale: isSu
        ? 'BYT 5481/2020 & ADA 2026 Ch. 16: Không tiếp tục nhóm Sulfonylurea/Glinide ở bệnh nhân điều trị nội trú cấp tính do ăn uống thất thường, thay đổi chức năng thận cấp và nguy cơ hạ đường huyết nặng kéo dài; chuyển sang phác đồ insulin có chuẩn độ.'
        : 'ADA 2026 Ch. 16 & BYT 5481/2020: Tạm ngừng các thuốc viên hạ đường huyết không phải insulin khi nhập viện nội trú cấp tính hoặc nhịn ăn; ưu tiên kiểm soát đường huyết bằng insulin theo dõi sát.',
      gates: [],
      citationIds: ['byt.dm2.2020.inpatient_hold_su_sglt2', 'ada.dm2.2026.perioperative_oral_basal_25'],
      priority: 97
    };
  },
  citationIds: ['byt.dm2.2020.inpatient_hold_su_sglt2', 'ada.dm2.2026.perioperative_oral_basal_25']
}));

const inpatientCriticalDpp4HoldRules: Rule[] = DPP4_IDS.map((dpp4Id) => ({
  id: `dm2.inpatient.hold_dpp4_critical_${dpp4Id}`,
  module: 'dm2',
  nameVi: `Tạm ngừng ${resolveDrugNameVi(dpp4Id)} khi bệnh nguy kịch, ICU, DKA/HHS hoặc nhịn ăn (NPO)`,
  setting: 'inpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || hasPancreatitis(ctx) || hasDrugAllergy(ctx, dpp4Id)) return false;
    if (dpp4Id === 'saxagliptin' && hasHf(ctx)) return false;
    if (dpp4Id === 'vildagliptin' && hasHepaticImpairment(ctx)) return false;
    if (willStartOrContinueGlp1(ctx)) return false;
    const crisis = evaluateHyperglycemicCrisis(ctx);
    const isCriticalOrNpo =
      crisis.isConfirmedCrisis ||
      crisis.isSuspectedUnconfirmed ||
      crisis.isIsolatedKetonemia ||
      isIcuSetting(ctx) ||
      ctx.patient.customInputs?.inpatientEating === 'npo' ||
      hasPlannedSurgery(ctx);
    return isCriticalOrNpo && isTakingCanonical(ctx, dpp4Id);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, dpp4Id);
    const target = resolveTargetRecDrug(dpp4Id, med);
    return {
      id: `rec_dm2_inpatient_hold_dpp4_${dpp4Id}`,
      module: 'dm2',
      tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: `Tạm ngừng ${target.drugNameVi} khi bệnh nguy kịch / nhịn ăn (NPO) nội viện`,
      rationale:
        'ADA 2026 Ch. 16: Tạm ngừng thuốc hạ đường huyết đường uống (bao gồm ức chế DPP-4) khi bệnh nhân nhịn ăn (NPO), phẫu thuật, nằm ICU hoặc trong cơn khủng hoảng tăng đường huyết cấp (DKA/HHS); kiểm soát bằng phác đồ insulin chuẩn độ.',
      gates: [],
      citationIds: ['ada.dm2.2026.perioperative_oral_basal_25'],
      priority: 95
    };
  },
  citationIds: ['ada.dm2.2026.perioperative_oral_basal_25']
}));

const inpatientAndPeriopGlp1HoldRules: Rule[] = INCRETIN_RA_IDS.map((raId) => ({
  id: `dm2.periop.hold_glp1_${raId}`,
  module: 'dm2',
  nameVi: `Tạm ngừng ${resolveDrugNameVi(raId)} trong giai đoạn nội viện cấp tính hoặc chu phẫu gây mê`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isPregnant(ctx) || isBreastfeeding(ctx) || hasMtcOrMen2(ctx) || hasPancreatitis(ctx) || hasDrugAllergy(ctx, raId)) {
      return false;
    }
    const egfr = getEffectiveEgfr(ctx);
    if ((raId === 'lixisenatide' || raId === 'exenatide') && (isOnDialysis(ctx) || (egfr !== undefined && egfr <= thFor('egfr', 'dm2.metformin.egfr_contra')))) {
      return false;
    }
    if (!isTakingCanonical(ctx, raId)) return false;
    return ctx.settings.setting === 'inpatient' || hasPlannedSurgery(ctx);
  },
  produce: (ctx) => {
    const med = findActiveMedByCanonical(ctx, raId);
    const target = resolveTargetRecDrug(raId, med);
    const isSurgery = hasPlannedSurgery(ctx);
    const fdcNote = target.isFdc
      ? ' Nếu đang dùng bút phối hợp cố định Insulin + GLP-1 RA (Soliqua/Xultophy), phải tạm ngừng bút phối hợp này và chuyển sang tiêm Insulin nền đơn chất (Glargine/Degludec).'
      : '';
    return {
      id: `rec_dm2_hold_glp1_periop_acute_${raId}`,
      module: 'dm2',
      tier: isSurgery ? 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ' : 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
      tierOrder: 0,
      action: 'HOLD',
      drugId: target.drugId,
      drugNameVi: target.drugNameVi,
      title: isSurgery
        ? `Chu phẫu / Gây mê: Tạm ngừng ${target.drugNameVi} & Đánh giá nguy cơ tồn lưu dịch dạ dày – hít sặc`
        : `Tạm ngừng ${target.drugNameVi} trong giai đoạn điều trị nội trú cấp tính`,
      rationale: isSurgery
        ? `ADA 2026 Ch. 16: Đồng vận thụ thể GLP-1 và GIP/GLP-1 RA làm chậm làm rỗng dạ dày, tăng nguy cơ trào ngược – hít sặc phổi khi gây mê/an thần sâu. Cần tạm ngừng cử ${target.drugNameVi} chu phẫu, tầm soát triệu chứng tiêu hóa (buồn nôn, đầy bụng) và phối hợp bác sĩ gây mê áp dụng biện pháp phòng sặc (chế độ ăn lỏng 24 giờ trước mổ / siêu âm dạ dày).${fdcNote}`
        : `ADA 2026 Ch. 16: Không khuyến cáo duy trì thường quy ${target.drugNameVi} trong giai đoạn bệnh nội trú cấp tính, nhịn ăn hoặc nôn ói do nguy cơ mất nước, liệt ruột/chậm rỗng dạ dày; ưu tiên chuyển sang phác đồ insulin nội viện.${fdcNote}`,
      gates: [],
      warnings: isSurgery
        ? [`Cảnh báo gây mê (${target.drugNameVi}): Nguy cơ tồn lưu thức ăn dạ dày gây sặc phổi dù đã nhịn ăn chuẩn; cần báo bác sĩ gây mê hồi sức!`]
        : undefined,
      citationIds: isSurgery
        ? ['ada.dm2.2026.periop_glp1_aspiration', 'ada.dm2.2026.inpatient_glp1_hold_acute']
        : ['ada.dm2.2026.inpatient_glp1_hold_acute'],
      priority: 96
    };
  },
  citationIds: ['ada.dm2.2026.periop_glp1_aspiration', 'ada.dm2.2026.inpatient_glp1_hold_acute']
}));

export const dm2InpatientOralAndGlp1HoldRules: Rule[] = [
  {
    id: 'dm2.inpatient.hold_metformin',
    module: 'dm2',
    nameVi: 'Tạm ngừng Metformin trong giai đoạn bệnh cấp tính nội viện hoặc chuẩn bị chụp cản quang',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isPregnant(ctx) || isOnDialysis(ctx) || hasHepaticImpairment(ctx) || hasDrugAllergy(ctx, 'metformin')) return false;
      const egfr = getEffectiveEgfr(ctx);
      if (egfr !== undefined && egfr < thFor('egfr', 'dm2.metformin.egfr_contra')) return false;
      return isTakingCanonical(ctx, 'metformin');
    },
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'metformin');
      const target = resolveTargetRecDrug('metformin', med);
      return {
        id: 'rec_dm2_inpatient_hold_metformin',
        module: 'dm2',
        tier: 'Điều chỉnh thuốc dùng tại nhà khi nhập viện',
        tierOrder: 0,
        action: 'HOLD',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Tạm ngừng ${target.drugNameVi} nội viện trong giai đoạn cấp tính`,
        rationale:
          'ADA 2026 Ch. 16 & BYT 5481/2020: Tạm ngừng Metformin ở bệnh nhân nội trú có bệnh cấp tính, suy giảm huyết động, nhiễm toan, thiếu oxy mô, suy thận cấp hoặc chụp thuốc cản quang iod để phòng ngừa toan acid lactic.',
        gates: [],
        citationIds: ['byt.dm2.2020.metformin_renal_contra', 'fda.metformin.egfr_bands'],
        priority: 97
      };
    },
    citationIds: ['byt.dm2.2020.metformin_renal_contra', 'fda.metformin.egfr_bands']
  },
  ...inpatientAcuteOralHoldRules,
  ...inpatientCriticalDpp4HoldRules,
  ...inpatientAndPeriopGlp1HoldRules
];
