/**
 * Quy tắc An toàn & Chống chỉ định Kiểm soát Tần số [R] – Module Rung nhĩ (AF)
 * Bao phủ: Hội chứng WPW / Rung nhĩ tiền kích thích (STOP toàn bộ thuốc chẹn nút AV + sốc điện/Ibutilide/Procainamide/triệt đốt),
 * Bệnh cơ tim thoái hóa dạng bột (STOP Digoxin & Non-DHP CCB), Block nhĩ thất / suy nút xoang chưa đặt máy tạo nhịp,
 * Hạ kali máu trên Digoxin, Hen phế quản trên chẹn beta không chọn lọc, Tụt HA / nhịp chậm ngoại trú,
 * HFrEF STOP Diltiazem/Verapamil, Phối hợp kép BB + Non-DHP CCB, và Thai kỳ STOP Diltiazem.
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  BB_IDS,
  NON_DHP_CCB_IDS,
  NON_SELECTIVE_BB_IDS,
  WPW_CONTRA_IDS,
  findCurrentMed,
  getDrugDisplayNameVi,
  hasCardiacAmyloidosis,
  hasConductionBlockNoPacer,
  hasCurrentMed,
  hasWpw,
  isAfActive,
  isUnstableHemodynamics
} from './rulesHelpers';

const TIER_R_RATE = 'AF-CARE · [R] Kiểm soát tần số';

const perDrugWpwStopRules: Rule[] = WPW_CONTRA_IDS.map((avnId) => ({
  id: `af.rate.wpw_stop_${avnId}`,
  module: 'af',
  nameVi: `AF-CARE [R]: Dừng khẩn cấp ${getDrugDisplayNameVi(avnId)} trong rung nhĩ tiền kích thích (WPW)`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => isAfActive(ctx) && hasWpw(ctx) && hasCurrentMed(ctx, [avnId]),
  produce: (ctx): Recommendation => {
    const med = findCurrentMed(ctx, [avnId]);
    const nameVi = getDrugDisplayNameVi(avnId, med);
    return {
      id: `rec_af_wpw_stop_${avnId}`,
      module: 'af',
      tier: TIER_R_RATE,
      tierOrder: 3,
      action: 'STOP',
      drugId: avnId,
      drugNameVi: nameVi,
      dose: undefined,
      title: `DỪNG KHẨN CẤP ${nameVi}: Chống chỉ định tuyệt đối trong Rung nhĩ tiền kích thích (Hội chứng WPW — nguy cơ rung thất)`,
      rationale:
        'Khuyến cáo Class III: Harm (ESC 2024 Section 10.1 & ACC/AHA 2023): Thuốc ức chế dẫn truyền nút nhĩ thất (Chẹn beta, Diltiazem, Verapamil, Digoxin, Amiodarone, Dronedarone, Adenosine) làm dồn toàn bộ xung động nhĩ qua đường dẫn truyền phụ tốc độ cao, gây rung thất và ngừng tim.',
      gates: [{ parameter: 'Rung nhĩ tiền kích thích (WPW)', passed: false, action: 'contra', messageVi: `Cấm tuyệt đối ${nameVi}` }],
      citationIds: ['acc.af.2023.wpw_av_blockers_harm', 'esc.af.2024.wpw_preexcited_avoid_avn'],
      priority: 109
    };
  },
  citationIds: ['acc.af.2023.wpw_av_blockers_harm', 'esc.af.2024.wpw_preexcited_avoid_avn']
}));

const perDrugAmyloidosisStopRules: Rule[] = ['digoxin', 'diltiazem', 'verapamil'].map((amId) => ({
  id: `af.rate.amyloid_stop_${amId}`,
  module: 'af',
  nameVi: `AF-CARE [R]: Ngừng ${drug(amId).nameVi} ở bệnh cơ tim thoái hóa dạng bột (Cardiac Amyloidosis)`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => isAfActive(ctx) && !hasWpw(ctx) && hasCardiacAmyloidosis(ctx) && hasCurrentMed(ctx, [amId]),
  produce: (): Recommendation => ({
    id: `rec_af_amyloid_stop_${amId}`,
    module: 'af',
    tier: TIER_R_RATE,
    tierOrder: 3,
    action: 'STOP',
    drugId: amId,
    drugNameVi: drug(amId).nameVi,
    dose: undefined,
    title: `DỪNG NGAY ${drug(amId).nameVi}: Chống chỉ định ở Bệnh cơ tim thoái hóa dạng bột (Cardiac Amyloidosis)`,
    rationale:
      amId === 'digoxin'
        ? 'ESC HF 2026 & Nhãn FDA Digoxin: Các sợi amyloid gắn kết ái lực cao với Digoxin ngay cả khi nồng độ huyết thanh bình thường, gây ngộ độc cơ tim và loạn nhịp thất tử vong.'
        : 'ESC HF 2026: Diltiazem và Verapamil gắn sợi amyloid và gây tụt huyết áp nặng, block dẫn truyền nhĩ thất và suy sụp cung lượng tim ở bệnh nhân Amyloidosis tim.',
    gates: [{ parameter: 'Cardiac Amyloidosis', passed: false, action: 'contra', messageVi: `Chống chỉ định ${drug(amId).nameVi}` }],
    citationIds: ['esc.hf.2026.amyloidosis_avoid_digoxin', 'fda.digoxin.amyloidosis_avoid'],
    priority: 105
  }),
  citationIds: ['esc.hf.2026.amyloidosis_avoid_digoxin', 'fda.digoxin.amyloidosis_avoid']
}));

const perDrugHfrefStopCcbRules: Rule[] = NON_DHP_CCB_IDS.map((ccbId) => ({
  id: `af.rate.stop_${ccbId}_hfref`,
  module: 'af',
  nameVi: `AF-CARE [R]: Dừng khẩn cấp ${drug(ccbId).nameVi} khi LVEF ≤ 40%`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    const ef = need(ctx, 'lvef');
    return (
      isAfActive(ctx) &&
      !hasWpw(ctx) &&
      !hasCardiacAmyloidosis(ctx) &&
      hasCurrentMed(ctx, [ccbId]) &&
      ef !== undefined &&
      ef <= thFor('lvef', 'af.rate.lvef_cutoff')
    );
  },
  produce: (ctx): Recommendation => {
    const ef = need(ctx, 'lvef')!;
    const efCutoff = thFor('lvef', 'af.rate.lvef_cutoff');
    return {
      id: ccbId === 'diltiazem' ? 'rec_af_contra_non_dhp_hfref' : `rec_af_contra_${ccbId}_hfref`,
      module: 'af',
      tier: TIER_R_RATE,
      tierOrder: 3,
      action: 'STOP',
      drugId: ccbId,
      drugNameVi: drug(ccbId).nameVi,
      dose: undefined,
      title: `DỪNG NGAY ${drug(ccbId).nameVi}: Chống chỉ định tuyệt đối khi LVEF từ ${efCutoff}% trở xuống`,
      rationale: `Khuyến cáo Class III (ESC 2024 Table 12 / ACC 2023): Thuốc chẹn kênh canxi Non-DHP có tác dụng ức chế co bóp cơ tim âm tính, làm nặng suy tim sung huyết và tăng nguy cơ sốc tim ở LVEF ${ef}% ≤ ${efCutoff}%.`,
      gates: [{ parameter: 'LVEF', passed: false, action: 'contra', value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
      citationIds: ['esc.af.2024.non_dhp_ccb_contra_lvef40', 'esc.af.2024.verapamil_contra_lvef40'],
      priority: 103
    };
  },
  citationIds: ['esc.af.2024.non_dhp_ccb_contra_lvef40', 'esc.af.2024.verapamil_contra_lvef40']
}));

const perDrugAsthmaNonSelectiveBbStopRules: Rule[] = NON_SELECTIVE_BB_IDS.map((bbId) => ({
  id: `af.rate.asthma_stop_${bbId}`,
  module: 'af',
  nameVi: `AF-CARE [R]: Ngừng chẹn beta không chọn lọc ${getDrugDisplayNameVi(bbId)} ở bệnh nhân hen phế quản`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => isAfActive(ctx) && !hasWpw(ctx) && hasCondition(ctx, 'asthma') && hasCurrentMed(ctx, [bbId]),
  produce: (ctx): Recommendation => {
    const med = findCurrentMed(ctx, [bbId]);
    const nameVi = getDrugDisplayNameVi(bbId, med);
    return {
      id: `rec_af_asthma_stop_${bbId}`,
      module: 'af',
      tier: TIER_R_RATE,
      tierOrder: 3,
      action: 'STOP',
      drugId: bbId,
      drugNameVi: nameVi,
      dose: undefined,
      title: `DỪNG NGAY ${nameVi}: Chống chỉ định chẹn beta không chọn lọc ở bệnh nhân Hen phế quản (nguy cơ co thắt phế quản cấp)`,
      rationale:
        `ESC 2024 & ACC/AHA 2023: Các chẹn beta không chọn lọc thụ thể beta-2 gây co thắt phế quản nặng ở người bệnh hen; cần chuyển sang Diltiazem/Verapamil (nếu LVEF trên ${thFor('lvef', 'af.rate.lvef_cutoff')}%) hoặc Digoxin.`,
      gates: [{ parameter: 'Hen phế quản', passed: false, action: 'contra', messageVi: `Chống chỉ định ${nameVi}` }],
      citationIds: ['acc.af.2023.table23_sotalol_bronchospasm', 'esc.af.2024.rate_control_lvef_preserved'],
      priority: 102
    };
  },
  citationIds: ['acc.af.2023.table23_sotalol_bronchospasm']
}));

const perDrugOutpatientUnstableHoldRules: Rule[] = [...BB_IDS, ...NON_DHP_CCB_IDS, 'digoxin'].map((rateId) => ({
  id: `af.rate.unstable_hold_${rateId}`,
  module: 'af',
  nameVi: `AF-CARE [R]: Tạm ngưng ${getDrugDisplayNameVi(rateId)} khi tụt huyết áp hoặc nhịp tim quá chậm`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!isAfActive(ctx) || hasWpw(ctx) || !hasCurrentMed(ctx, [rateId])) return false;
    const sbp = need(ctx, 'sbp');
    const hr = need(ctx, 'hr');
    const minSbp = thFor('sbp', 'af.acute.hypotension_sbp');
    const minHr = thFor('hr', 'af.rate.bradycardia_hr_min');
    if (rateId === 'digoxin') {
      return (hr !== undefined && hr < minHr) || hasConductionBlockNoPacer(ctx);
    }
    return (sbp !== undefined && sbp < minSbp) || (hr !== undefined && hr < minHr) || hasConductionBlockNoPacer(ctx);
  },
  produce: (ctx): Recommendation => {
    const med = findCurrentMed(ctx, [rateId]);
    const nameVi = getDrugDisplayNameVi(rateId, med);
    const isDig = rateId === 'digoxin';
    const minSbp = thFor('sbp', 'af.acute.hypotension_sbp');
    const minHr = thFor('hr', 'af.rate.bradycardia_hr_min');
    return {
      id: `rec_af_outpatient_hold_${rateId}`,
      module: 'af',
      tier: TIER_R_RATE,
      tierOrder: 3,
      action: 'HOLD',
      drugId: rateId,
      drugNameVi: nameVi,
      dose: undefined,
      title: `TẠM NGƯNG NGAY ${nameVi}: Đang có nhịp tim chậm nặng, block dẫn truyền hoặc tụt huyết áp`,
      rationale: isDig
        ? 'ESC 2024 & Nhãn Digoxin: Digoxin tăng trương lực phế vị ức chế nút AV, gây nhịp chậm nặng hoặc block AV hoàn toàn; cần tạm ngưng và định lượng nồng độ Digoxin cùng Kali máu.'
        : `ESC 2024 (Table 12) & Nhãn FDA: Chẹn beta và Non-DHP CCB gây hạ huyết áp và chậm dẫn truyền nút AV; bắt buộc tạm ngưng khi HATT < ${minSbp} mmHg, nhịp thất < ${minHr} chu kỳ/phút hoặc block AV cao độ.`,
      gates: [{ parameter: 'Huyết động / Nhịp tim', passed: false, action: 'hold', messageVi: `Tạm ngưng ${nameVi}` }],
      citationIds: ['fda.diltiazem.hypotension_sbp90', 'esc.af.2024.qtc_500_conduction_contra'],
      priority: 101
    };
  },
  citationIds: ['fda.diltiazem.hypotension_sbp90', 'esc.af.2024.qtc_500_conduction_contra']
}));

export const afRateSafetyRules: Rule[] = [
  ...perDrugWpwStopRules,
  ...perDrugAmyloidosisStopRules,
  ...perDrugHfrefStopCcbRules,
  ...perDrugAsthmaNonSelectiveBbStopRules,
  ...perDrugOutpatientUnstableHoldRules,

  // Chiến lược điều trị chuyên biệt cho WPW / Rung nhĩ tiền kích thích
  {
    id: 'af.rate.wpw_management',
    module: 'af',
    nameVi: 'AF-CARE [R]: Phác đồ xử trí Rung nhĩ tiền kích thích (WPW): Sốc điện đồng bộ / Ibutilide-Procainamide & Triệt đốt đường phụ',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && hasWpw(ctx),
    produce: (ctx): Recommendation => {
      const unstable = isUnstableHemodynamics(ctx);
      return {
        id: 'rec_af_wpw_management',
        module: 'af',
        tier: TIER_R_RATE,
        tierOrder: 3,
        action: unstable ? 'START' : 'REFER',
        dose: undefined,
        title: unstable
          ? 'CẤP CỨU RUNG NHĨ TIỀN KÍCH THÍCH (WPW) MẤT ỔN ĐỊNH: Sốc điện chuyển nhịp đồng bộ ngay lập tức (Class I)'
          : 'Rung nhĩ tiền kích thích (WPW) huyết động ổn định: Xử trí cấp bằng Ibutilide / Procainamide tĩnh mạch & Chuyển Triệt đốt đường dẫn truyền phụ qua ống thông (Class I)',
        rationale:
          'ACC/AHA 2023 (Section 10.5) & ESC 2024 (Section 10.1): CẤM TUYỆT ĐỐI mọi thuốc ức chế nút AV (Chẹn beta, Diltiazem, Verapamil, Digoxin, Amiodarone, Adenosine). Nếu rối loạn huyết động phải sốc điện đồng bộ ngay; nếu huyết động ổn định dùng Ibutilide hoặc Procainamide tĩnh mạch (hoặc sốc điện chủ động), sau đó triệt đốt đường phụ qua catheter triệt để (Class I).',
        gates: [{ parameter: 'Hội chứng WPW', passed: true, messageVi: 'Chỉ định Class I sốc điện / Ibutilide-Procainamide & triệt đốt đường phụ' }],
        citationIds: [
          'acc.af.2023.wpw_ecv_ablation_ibutilide',
          'acc.af.2023.wpw_ibutilide_procainamide',
          'acc.af.2023.wpw_av_blockers_harm',
          'esc.af.2024.wpw_preexcited_avoid_avn'
        ],
        priority: 108
      };
    },
    citationIds: ['acc.af.2023.wpw_ecv_ablation_ibutilide', 'acc.af.2023.wpw_av_blockers_harm']
  },

  // Hạ kali máu < 3.5 mmol/L khi đang dùng Digoxin -> HOLD Digoxin
  {
    id: 'af.rate.digoxin_hypokalemia_hold',
    module: 'af',
    nameVi: 'AF-CARE [R]: Tạm ngưng Digoxin và bù Kali khẩn khi hạ Kali máu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      return isAfActive(ctx) && !hasWpw(ctx) && !hasCardiacAmyloidosis(ctx) && hasCurrentMed(ctx, ['digoxin']) && k !== undefined && k < thFor('k', 'hf.digoxin.k_min');
    },
    produce: (ctx): Recommendation => {
      const k = need(ctx, 'k')!;
      const kMin = thFor('k', 'hf.digoxin.k_min');
      return {
        id: 'rec_af_hold_digoxin_hypokalemia',
        module: 'af',
        tier: TIER_R_RATE,
        tierOrder: 3,
        action: 'HOLD',
        drugId: 'digoxin',
        drugNameVi: drug('digoxin').nameVi,
        dose: undefined,
        title: `TẠM NGƯNG NGAY Digoxin: Hạ Kali máu (K+ ${k} < ${kMin} mmol/L) làm tăng mạnh nguy cơ ngộ độc Digitalis`,
        rationale: `ESC HF 2026 & Nhãn FDA Digoxin: Hạ Kali máu làm tăng gắn kết Digoxin vào bơm Na+/K+-ATPase cơ tim, dễ khởi phát loạn nhịp thất nguy kịch ngay cả ở nồng độ Digoxin điều trị; cần bù Kali đạt ≥ ${kMin} mmol/L và kiểm tra Magnesi máu.`,
        gates: [{ parameter: 'Kali máu', passed: false, action: 'hold', value: k, threshold: kMin, messageVi: `K+ ${k} < ${kMin} mmol/L` }],
        citationIds: ['esc.hf.2026.digoxin_rec', 'fda.hf.digoxin_serum_1_2'],
        priority: 104
      };
    },
    citationIds: ['esc.hf.2026.digoxin_rec', 'fda.hf.digoxin_serum_1_2']
  },

  // Chuyển cấp cứu ngoại trú khi tụt huyết áp / nhịp chậm nặng / mất ổn định huyết động (giữ af_41)
  {
    id: 'af.rate.outpatient_unstable_refer',
    module: 'af',
    nameVi: 'AF-CARE [R]: Chuyển cấp cứu khẩn cấp khi ngoại trú có tụt huyết áp, nhịp chậm nặng hoặc mất ổn định huyết động',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx)) return false;
      const hr = need(ctx, 'hr');
      const minHr = thFor('hr', 'af.rate.bradycardia_hr_min');
      return isUnstableHemodynamics(ctx) || (hr !== undefined && hr < minHr);
    },
    produce: (ctx): Recommendation => {
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');
      const minSbp = thFor('sbp', 'af.acute.hypotension_sbp');
      const minHr = thFor('hr', 'af.rate.bradycardia_hr_min');
      const isHypo = sbp !== undefined && sbp < minSbp;
      return {
        id: 'rec_af_outpatient_unstable_refer',
        module: 'af',
        tier: TIER_R_RATE,
        tierOrder: 1,
        action: 'REFER',
        dose: undefined,
        title: isHypo
          ? `CHUYỂN CẤP CỨU NGAY: Rung nhĩ kèm tụt huyết áp (HATT ${sbp} < ${minSbp} mmHg) — Không khởi trị thuốc hạ nhịp ngoại trú`
          : `CHUYỂN CẤP CỨU NGAY: Rung nhĩ kèm rối loạn huyết động hoặc nhịp tim chậm nguy hiểm`,
        rationale:
          'ESC 2024 (Rec Table 16): Bệnh nhân ngoại trú có tụt huyết áp, sốc, phù phổi cấp hoặc nhịp chậm nặng cần nhập cấp cứu theo dõi monitor liên tục và xử trí sốc điện đồng bộ / tạo nhịp khi cần.',
        gates: [
          {
            parameter: isHypo ? 'HATT' : 'Huyết động / Nhịp tim',
            passed: false,
            action: 'contra',
            value: isHypo ? sbp : hr,
            threshold: isHypo ? minSbp : minHr,
            messageVi: 'Cần nhập cấp cứu nội viện ngay'
          }
        ],
        citationIds: ['esc.af.2024.emergency_electrical_cardioversion', 'fda.diltiazem.hypotension_sbp90'],
        priority: 106
      };
    },
    citationIds: ['esc.af.2024.emergency_electrical_cardioversion', 'fda.diltiazem.hypotension_sbp90']
  },

  // Dừng phối hợp đồng thời Chẹn beta + Non-DHP CCB thường quy (af_48)
  {
    id: 'af.rate.stop_dual_bb_ccb',
    module: 'af',
    nameVi: 'AF-CARE [R]: Ngừng phối hợp đồng thời Chẹn beta và Non-DHP CCB thường quy',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || hasCardiacAmyloidosis(ctx)) return false;
      const ef = need(ctx, 'lvef');
      if (ef !== undefined && ef <= thFor('lvef', 'af.rate.lvef_cutoff')) return false;
      return hasCurrentMed(ctx, BB_IDS) && hasCurrentMed(ctx, NON_DHP_CCB_IDS);
    },
    produce: (ctx): Recommendation => {
      const ccb = findCurrentMed(ctx, NON_DHP_CCB_IDS)!;
      const ccbId = ccb.drugId.toLowerCase();
      return {
        id: 'rec_af_stop_dual_bb_ccb',
        module: 'af',
        tier: TIER_R_RATE,
        tierOrder: 3,
        action: 'STOP',
        drugId: ccbId,
        drugNameVi: drug(ccbId).nameVi,
        dose: undefined,
        title: `Ngừng phối hợp ${drug(ccbId).nameVi} cùng Chẹn beta: Nguy cơ cao vô tâm thu và block nhĩ thất hoàn toàn`,
        rationale:
          'ESC 2024 (Section 7.1.1) & ACC/AHA 2023: Không phối hợp thường quy Chẹn beta với Diltiazem/Verapamil ngoại trú; nếu đơn trị chưa kiểm soát được tần số thất, ưu tiên phối hợp Chẹn beta (hoặc Non-DHP CCB) với Digoxin.',
        gates: [{ parameter: 'Phối hợp Chẹn beta + Non-DHP CCB', passed: false, action: 'contra', messageVi: 'Nguy cơ nhịp chậm nặng & block AV' }],
        citationIds: ['esc.af.2024.rate_control_lvef_preserved'],
        priority: 99
      };
    },
    citationIds: ['esc.af.2024.rate_control_lvef_preserved']
  },

  // Thai kỳ: Ngừng Diltiazem (af_49)
  {
    id: 'af.rate.stop_diltiazem_pregnancy',
    module: 'af',
    nameVi: 'AF-CARE [R]: Ngừng Diltiazem ở phụ nữ mang thai',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && !hasWpw(ctx) && hasCondition(ctx, 'pregnant') && hasCurrentMed(ctx, ['diltiazem']),
    produce: (): Recommendation => ({
      id: 'rec_af_stop_diltiazem_pregnancy',
      module: 'af',
      tier: TIER_R_RATE,
      tierOrder: 3,
      action: 'STOP',
      drugId: 'diltiazem',
      drugNameVi: drug('diltiazem').nameVi,
      dose: undefined,
      title: 'Ngừng Diltiazem trong thai kỳ: Chuyển sang Chẹn beta chọn lọc beta-1 (hoặc Verapamil nếu hen phế quản)',
      rationale:
        'ESC 2025 Pregnancy & ESC 2024 AF: Diltiazem gây độc tính phôi thai trên thực nghiệm động vật nên cần tránh trong thai kỳ; ưu tiên chẹn beta chọn lọc beta-1 (Metoprolol, Bisoprolol) hoặc Digoxin.',
      gates: [{ parameter: 'Thai kỳ', passed: false, action: 'contra', messageVi: 'Tránh Diltiazem trong thai kỳ' }],
      citationIds: ['esc.preg.2025.diltiazem_verapamil', 'esc.af.2024.pregnancy_rate_bb'],
      priority: 100
    }),
    citationIds: ['esc.preg.2025.diltiazem_verapamil', 'esc.af.2024.pregnancy_rate_bb']
  }
];
