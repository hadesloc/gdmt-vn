import type { Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  ALPHA1_BLOCKER_IDS,
  findAllCurrentMeds,
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getDrugDisplayVi,
  getHfPhenotype,
  HARMFUL_HF_DRUG_IDS,
  hasHfContext,
  isLactating,
  isPregnant,
  isShockOrInotrope,
} from './helpers';

function getFilteredHarmfulMeds(ctx: Parameters<Rule['when']>[0]) {
  const pheno = getHfPhenotype(ctx);
  const isTrueHfpef = pheno === 'hfpef' && !hasCondition(ctx, 'cardiacAmyloidosis');
  return findAllCurrentMeds(ctx, HARMFUL_HF_DRUG_IDS).filter((m) => {
    const low = m.drugId.toLowerCase();
    const isNdhp = low === 'diltiazem' || low === 'verapamil' || (m.name || '').toLowerCase().includes('diltiazem') || (m.name || '').toLowerCase().includes('verapamil');
    return !isTrueHfpef || !isNdhp;
  });
}

const harmfulMedStopRules: Rule[] = [0, 1, 2, 3, 4].map((slotIdx) => ({
  id: slotIdx === 0 ? 'hf.safety.harmful_meds' : `hf.safety.harmful_meds_${slotIdx}`,
  module: 'hf',
  nameVi: 'Cảnh báo ngưng ngay từng thuốc gây hại (Class III) ở bệnh nhân suy tim',
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  citationIds: ['esc.hf.2026.harm_nsaids', 'esc.hf.2026.harm_ccbs_hfref', 'esc.hf.2026.saxagliptin_tzd_contra_hf'],
  when: (ctx) => hasHfContext(ctx) && slotIdx < getFilteredHarmfulMeds(ctx).length,
  produce: (ctx) => {
    const bad = getFilteredHarmfulMeds(ctx);
    const med = bad[slotIdx];
    if (!med) return null;
    const disp = getDrugDisplayVi(med.drugId, med);
    return {
      id: slotIdx === 0 ? 'rec_hf_stop_harmful_meds' : `rec_hf_stop_harmful_${slotIdx}_${med.drugId}`,
      module: 'hf',
      tier: 'An toàn thuốc (Class III - Gây hại)',
      tierOrder: 0,
      action: 'STOP',
      drugId: med.drugId,
      drugNameVi: disp,
      title: `Ngưng thuốc chống chỉ định / gây mất bù suy tim: ${disp}`,
      rationale: 'NSAID/COX-2, CCB non-DHP (Diltiazem, Verapamil ở HFrEF/HFimpEF/Amyloidosis), Thiazolidinedione (Pioglitazone), Saxagliptin/Alogliptin, Cilostazol, Itraconazole, Dronedarone và chống loạn nhịp nhóm IC/Sotalol/Moxonidine gây giữ muối nước, ức chế co bóp cơ tim hoặc tăng tử vong ở suy tim (Class III).',
      gates: [{ parameter: 'Thuốc chống chỉ định ở suy tim', passed: false, messageVi: disp }],
      citationIds: ['esc.hf.2026.harm_nsaids', 'esc.hf.2026.harm_ccbs_hfref', 'esc.hf.2026.saxagliptin_tzd_contra_hf'],
      priority: 99,
    };
  },
}));

export const hfrefAmtSafetyAmyloidRules: Rule[] = [
  ...harmfulMedStopRules,
  {
    id: 'hf.safety.alpha1_blocker_caution',
    module: 'hf',
    nameVi: 'Rà soát ngưng / thay thế chẹn alpha-1 (Doxazosin / Prazosin / Terazosin) ở suy tim',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.harm_nsaids'],
    when: (ctx) => hasHfContext(ctx) && Boolean(findCurrentMed(ctx, ALPHA1_BLOCKER_IDS)),
    produce: (ctx) => {
      const med = findCurrentMed(ctx, ALPHA1_BLOCKER_IDS);
      if (!med) return null;
      const disp = getDrugDisplayVi(med.drugId, med);
      return {
        id: 'rec_hf_alpha1_caution',
        module: 'hf',
        tier: 'Rà soát thuốc làm nặng suy tim',
        tierOrder: 2,
        action: 'MONITOR',
        drugId: med.drugId,
        drugNameVi: disp,
        title: `Rà soát ${disp} (chẹn alpha-1): Tránh dùng để hạ huyết áp ở suy tim (ưu tiên Tamsulosin nếu điều trị BPH)`,
        rationale: 'Thuốc chẹn alpha-1 (Doxazosin trong ALLHAT) làm tăng gấp đôi nguy cơ suy tim sung huyết và gây hạ huyết áp tư thế khi phối hợp ARNI/chẹn beta.',
        gates: [],
        citationIds: ['esc.hf.2026.harm_nsaids'],
        priority: 70,
      };
    },
  },
  {
    id: 'hf.amyloidosis.management',
    module: 'hf',
    nameVi: 'Phác đồ đặc hiệu bệnh cơ tim nhiễm bột ATTR (Tafamidis & Kháng đông rung nhĩ)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.amyloid_ttr_rec',
      'esc.hf.2026.amyloid_af_anticoag',
      'aha.hf.2022.tafamidis_doses_80_61',
      'fda.hf.digoxin_amyloid_avoid',
    ],
    when: (ctx) => hasHfContext(ctx) && hasCondition(ctx, 'cardiacAmyloidosis'),
    produce: (ctx) => {
      const nyha = need(ctx, 'nyha');
      const activeTaf = findCurrentMed(ctx, ['tafamidis']);
      const hasAf =
        ctx.patient.rhythm === 'afib' ||
        hasCondition(ctx, 'af') ||
        Boolean(ctx.patient.selectedModules?.includes('af'));
      const cits = [
        'esc.hf.2026.amyloid_ttr_rec',
        'esc.hf.2026.amyloid_af_anticoag',
        'aha.hf.2022.tafamidis_doses_80_61',
        'fda.hf.digoxin_amyloid_avoid',
      ];
      if (isPregnant(ctx) || isLactating(ctx) || nyha === 4 || isShockOrInotrope(ctx)) {
        return {
          id: 'rec_hf_amyloidosis_tafamidis',
          module: 'hf',
          tier: 'Bệnh cơ tim nhiễm bột (ATTR-CM)',
          tierOrder: 1,
          action: activeTaf && (isPregnant(ctx) || isLactating(ctx)) ? 'STOP' : 'REFER',
          drugId: activeTaf ? 'tafamidis' : undefined,
          title: 'Hội chẩn chuyên sâu Bệnh cơ tim nhiễm bột (loại trừ AL amyloidosis & quản lý huyết khối/thuốc)',
          rationale: `Cần phân biệt AL amyloidosis (điện di miễn dịch chuỗi nhẹ tự do huyết thanh/nước tiểu + xạ hình xương 99mTc-PYP/DPD/HMDP).${hasAf ? ' Kèm rung nhĩ: BẮT BUỘC kháng đông đường uống bất kể điểm CHA2DS2-VA/CHA2DS2-VASc.' : ''} Tuyệt đối tránh Digoxin và Verapamil/Diltiazem.`,
          gates: [],
          citationIds: cits,
          priority: 95,
        };
      }
      return {
        id: 'rec_hf_amyloidosis_tafamidis',
        module: 'hf',
        tier: 'Điều trị đặc hiệu ATTR-CM (Class I-A)',
        tierOrder: 1,
        action: activeTaf ? 'CONTINUE' : 'START',
        drugId: 'tafamidis',
        drugNameVi: getDrugDisplayVi('tafamidis'),
        dose: activeTaf
          ? formatCurrentMedDoseVi(activeTaf, 'tafamidis')
          : `${formatHfDose(dose('tafamidis', 'start'))} (hoặc ${thFor('dose_mg', 'hf.tafamidis.meglumine_mg')} mg tafamidis meglumine x 1 lần/ngày)`,
        title: `${activeTaf ? 'Tiếp tục duy trì' : 'Chỉ định chất ổn định TTR:'} Tafamidis cho bệnh cơ tim nhiễm bột ATTR (NYHA I–III)`,
        rationale: `ESC 2026 (Class I-A) và AHA/ACC 2022 (COR 1 B-R) khuyến cáo điều trị chất ổn định/bất hoạt TTR (Tafamidis / Acoramidis / Vutrisiran) ở ATTR-CM NYHA I–III sau khi đã loại trừ AL amyloidosis để giảm tử vong và nhập viện tim mạch.${hasAf ? ' Bệnh nhân kèm rung nhĩ: BẮT BUỘC dùng kháng đông đường uống bất kể điểm CHA2DS2-VA/CHA2DS2-VASc do nguy cơ huyết khối buồng tim rất cao.' : ''} Tránh Digoxin, tránh Diltiazem/Verapamil và thận trọng với liều cao chẹn beta/ARNI nếu hạ huyết áp tư thế.`,
        gates: [],
        warnings: hasAf
          ? ['ATTR-CM kèm rung nhĩ: Chỉ định kháng đông đường uống (DOAC/VKA) bất kể điểm CHA2DS2-VA = 0.']
          : ['Lưu ý tránh Digoxin và CCB non-DHP ở bệnh cơ tim nhiễm bột do gắn sợi amyloid gây ngộ độc nặng.'],
        citationIds: cits,
        priority: 93,
      };
    },
  },
  {
    id: 'hf.safety.missing_sbp',
    module: 'hf',
    nameVi: 'Yêu cầu nhập huyết áp tâm thu (SBP) trước khi chỉ định phác đồ suy tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.arni_sbp_100_egfr_30', 'esc.hf.2026.bb_guidance_table_s6'],
    when: (ctx) => hasHfContext(ctx) && need(ctx, 'sbp') === undefined,
    produce: () =>
      missingInputRec('hf', 'sbp', 'kiểm tra huyết áp tâm thu trước khi chỉ định hoặc chuẩn độ thuốc suy tim', [
        'esc.hf.2026.arni_sbp_100_egfr_30',
        'esc.hf.2026.bb_guidance_table_s6',
      ]),
  },
  {
    id: 'hf.safety.missing_hr',
    module: 'hf',
    nameVi: 'Yêu cầu nhập tần số tim (HR) trước khi đánh giá phác đồ suy tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6'],
    when: (ctx) => hasHfContext(ctx) && need(ctx, 'hr') === undefined,
    produce: () =>
      missingInputRec('hf', 'hr', 'kiểm tra tần số tim trước khi đánh giá thuốc suy tim', [
        'esc.hf.2026.bb_doses',
        'esc.hf.2026.bb_guidance_table_s6',
      ]),
  },
  {
    id: 'hf.safety.missing_k',
    module: 'hf',
    nameVi: 'Yêu cầu nhập kali máu trước khi chỉ định phác đồ suy tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.mra_doses', 'esc.hf.2026.mra_guidance_table_s8'],
    when: (ctx) => hasHfContext(ctx) && need(ctx, 'k') === undefined,
    produce: () =>
      missingInputRec('hf', 'k', 'kiểm tra kali máu trước khi chỉ định thuốc ức chế hệ RAA hoặc MRA', [
        'esc.hf.2026.mra_doses',
        'esc.hf.2026.mra_guidance_table_s8',
      ]),
  },
  {
    id: 'hf.safety.missing_egfr',
    module: 'hf',
    nameVi: 'Yêu cầu nhập chức năng thận (Creatinine / eGFR) trước khi chỉ định phác đồ suy tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.mra_guidance_table_s8'],
    when: (ctx) => hasHfContext(ctx) && need(ctx, 'egfr') === undefined,
    produce: () =>
      missingInputRec('hf', 'egfr', 'kiểm tra chức năng thận trước khi chọn liều thuốc suy tim', [
        'esc.hf.2026.sglt2i_all_lvef',
        'esc.hf.2026.mra_guidance_table_s8',
      ]),
  },
];
