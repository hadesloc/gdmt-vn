import type { Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  formatCurrentMedDoseVi,
  getCongestionStatus,
  getDrugDisplayVi,
  hasAcuteBronchospasm,
  hasAcuteKidneyInjury,
  hasHfContext,
  hasStableAsthmaHistory,
  hasUnpacedConductionBlock,
  HF_BB_IDS,
  HF_SELECTIVE_BB_IDS,
  isAcutelyDecompensated,
  isShockOrInotrope,
  NON_HF_BB_IDS,
  PDE5I_IDS,
  resolveMatchedComponentId,
} from './helpers';

const ALL_ORAL_BB_IDS = [...HF_BB_IDS, ...NON_HF_BB_IDS] as const;

export const hfInpatientTransitionRules: Rule[] = [
  {
    id: 'hf.inpatient.vasodilator',
    module: 'hf',
    nameVi: 'Thuốc giãn mạch tĩnh mạch (Nitroglycerin) ở suy tim cấp tăng huyết áp',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.acute_vasodilators', 'esc.hf.2026.acute_ntg_doses_table_s14', 'esc.hf.2026.nitrates_pde5i_avoid'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isShockOrInotrope(ctx)) return false;
      const cong = getCongestionStatus(ctx);
      if (cong !== 'mild' && cong !== 'overt' && !hasCondition(ctx, 'acutePulmonaryEdema')) return false;
      const sbp = need(ctx, 'sbp');
      return sbp !== undefined && sbp > thFor('sbp', 'hf.acute.vasodilator_sbp_min');
    },
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp')!;
      const sbpMin = thFor('sbp', 'hf.acute.vasodilator_sbp_min');
      const ntgStartLow = thFor('infusion_rate', 'hf.acute.ntg_start_mcg_min');
      const ntgStartHigh = thFor('infusion_rate', 'hf.acute.ntg_start_high_mcg_min');
      const ntgMax = thFor('infusion_rate', 'hf.acute.ntg_max_mcg_min');
      const onPde5 = findCurrentMed(ctx, PDE5I_IDS);
      const onVericiguat = findCurrentMed(ctx, ['vericiguat', 'riociguat']);
      if (onPde5 || onVericiguat) {
        const blocker = onPde5 ?? onVericiguat!;
        return {
          id: 'rec_hf_inpatient_vasodilator',
          module: 'hf',
          tier: 'Cấp cứu Suy tim cấp (An toàn tương tác)',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'nitroglycerin',
          drugNameVi: getDrugDisplayVi('nitroglycerin'),
          title: `Chống chỉ định truyền Nitroglycerin giãn mạch do đang dùng ${getDrugDisplayVi(blocker.drugId, blocker)}`,
          rationale: 'Phối hợp nitrat tĩnh mạch với thuốc ức chế PDE-5 hoặc chất kích thích sGC gây tụt huyết áp kháng trị đe dọa tính mạng.',
          gates: [{ parameter: 'Tương tác PDE-5i / sGC', passed: false, messageVi: `Đang dùng ${blocker.drugId}` }],
          citationIds: ['esc.hf.2026.nitrates_pde5i_avoid', 'esc.hf.2026.acute_vasodilators'],
          priority: 95,
        };
      }
      return {
        id: 'rec_hf_inpatient_vasodilator',
        module: 'hf',
        tier: 'Cấp cứu Suy tim cấp (Class IIb)',
        tierOrder: 2,
        action: 'CONSIDER',
        drugId: 'nitroglycerin',
        drugNameVi: `${getDrugDisplayVi('nitroglycerin')} (truyền tĩnh mạch)`,
        dose: `Khởi đầu ${ntgStartLow}–${ntgStartHigh} mcg/phút truyền tĩnh mạch, chỉnh liều mỗi 3–5 phút theo huyết áp tới tối đa ${ntgMax} mcg/phút`,
        title: `Xem xét truyền tĩnh mạch Nitroglycerin giảm sung huyết phổi khi SBP > ${sbpMin} mmHg`,
        rationale: `Ở bệnh nhân suy tim cấp phù phổi / sung huyết kèm huyết áp tâm thu > ${sbpMin} mmHg (hiện tại ${sbp} mmHg) và không có hẹp khít van động mạch chủ/hai lá, thuốc giãn mạch tĩnh mạch có thể được cân nhắc để giảm triệu chứng và sung huyết (ESC 2026 Class IIb, Level C), theo dõi huyết áp liên tục.`,
        gates: [{ parameter: 'SBP', passed: true, value: sbp, threshold: `> ${sbpMin} mmHg`, messageVi: `SBP > ${sbpMin} mmHg` }],
        citationIds: ['esc.hf.2026.acute_vasodilators', 'esc.hf.2026.acute_ntg_doses_table_s14'],
        priority: 82,
      };
    },
  },
  {
    id: 'hf.inpatient.continue_bb',
    module: 'hf',
    nameVi: 'Xử trí chẹn beta đang dùng trong đợt nhập viện suy tim cấp',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.acute_bb_hypoperfusion', 'esc.hf.2026.bb_guidance_table_s6'],
    when: (ctx) => hasHfContext(ctx) && Boolean(findCurrentMed(ctx, ALL_ORAL_BB_IDS)),
    produce: (ctx) => {
      const activeBb = findCurrentMed(ctx, ALL_ORAL_BB_IDS)!;
      const matchedBbId = resolveMatchedComponentId(activeBb, ALL_ORAL_BB_IDS) ?? activeBb.drugId;
      const outDrugId = activeBb.drugId;
      const disp = getDrugDisplayVi(outDrugId, activeBb);
      const cits = ['esc.hf.2026.acute_bb_hypoperfusion', 'esc.hf.2026.bb_guidance_table_s6'];
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');
      const sbpMin = thFor('sbp', 'hf.bb.sbp_min_start');
      const hrMin = thFor('hr', 'hf.digoxin.hr_min');

      if (hasUnpacedConductionBlock(ctx)) {
        return {
          id: 'rec_hf_inpatient_continue_bb',
          module: 'hf',
          tier: 'An toàn dẫn truyền nội viện',
          tierOrder: 1,
          action: 'STOP',
          drugId: outDrugId,
          drugNameVi: disp,
          title: `Ngưng ngay ${disp} do block nhĩ-thất độ II–III / suy nút xoang chưa đặt máy tạo nhịp`,
          rationale: 'Chống chỉ định duy trì chẹn beta khi có block nhĩ-thất độ cao chưa có máy tạo nhịp bảo vệ.',
          gates: [{ parameter: 'Dẫn truyền nhĩ-thất', passed: false, messageVi: 'Block AV độ II–III / SSS' }],
          citationIds: cits,
          priority: 97,
        };
      }

      if (hasAcuteBronchospasm(ctx)) {
        return {
          id: 'rec_hf_inpatient_continue_bb',
          module: 'hf',
          tier: 'An toàn hô hấp nội viện (Co thắt phế quản cấp)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: outDrugId,
          drugNameVi: disp,
          title: `Tạm ngưng ngay ${disp} do đang có đợt cấp hen phế quản / co thắt phế quản cấp`,
          rationale: 'Trong cơn hen phế quản cấp hoặc co thắt phế quản giảm oxy máu nội viện, bắt buộc tạm ngưng cả chẹn beta chọn lọc beta-1 để bảo toàn hiệu lực giãn phế quản SABA khí dung cấp cứu; chỉ xem xét dùng lại liều thấp khi hết hoàn toàn co thắt phế quản.',
          gates: [{ parameter: 'Co thắt phế quản cấp', passed: false, messageVi: 'Đang cơn hen cấp / co thắt phế quản cấp' }],
          citationIds: ['esc.hf.2026.bb_table_s6_asthma_contra', ...cits],
          priority: 97,
        };
      }

      if (hasStableAsthmaHistory(ctx) && !(HF_SELECTIVE_BB_IDS as readonly string[]).includes(matchedBbId)) {
        return {
          id: 'rec_hf_inpatient_continue_bb',
          module: 'hf',
          tier: 'An toàn thuốc nội viện',
          tierOrder: 1,
          action: 'STOP',
          drugId: outDrugId,
          drugNameVi: disp,
          title: `Ngưng thuốc chẹn beta không chọn lọc (${disp}) ở bệnh nhân đồng mắc hen phế quản`,
          rationale: 'Chống chỉ định chẹn beta không chọn lọc ở bệnh nhân hen phế quản do nguy cơ khởi phát co thắt phế quản nặng.',
          gates: [{ parameter: 'Hen phế quản', passed: false, messageVi: 'Chống chỉ định BB không chọn lọc' }],
          citationIds: ['esc.hf.2026.bb_table_s6_asthma_contra', ...cits],
          priority: 96,
        };
      }

      if (isShockOrInotrope(ctx) || (sbp !== undefined && sbp < sbpMin) || (hr !== undefined && hr < hrMin)) {
        return {
          id: 'rec_hf_inpatient_continue_bb',
          module: 'hf',
          tier: 'Xử trí nội viện (Cổng an toàn huyết động)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: outDrugId,
          drugNameVi: disp,
          title: `Tạm ngưng ${disp} do sốc tim / tụt huyết áp / nhịp chậm`,
          rationale: `Cần tạm ngưng chẹn beta khi có sốc tim, phụ thuộc thuốc vận mạch/tăng co bóp, SBP < ${sbpMin} mmHg hoặc HR < ${hrMin} chu kỳ/phút.`,
          gates: [{ parameter: 'Huyết động', passed: false, messageVi: 'Không ổn định huyết động / nhịp chậm' }],
          citationIds: ['esc.hf.2026.low_hr_50_digoxin_review', ...cits],
          priority: 95,
        };
      }

      if (sbp === undefined || hr === undefined) {
        return missingInputRec('hf', sbp === undefined ? 'sbp' : 'hr', 'kiểm tra huyết động trước khi tiếp tục duy trì chẹn beta nội viện', cits);
      }

      return {
        id: 'rec_hf_inpatient_continue_bb',
        module: 'hf',
        tier: 'Điều trị nội viện (Class IIa)',
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: outDrugId,
        drugNameVi: disp,
        dose: formatCurrentMedDoseVi(activeBb, matchedBbId),
        title: `Tiếp tục duy trì ${disp} trong đợt nhập viện suy tim cấp (không sốc tim, không co thắt phế quản cấp)`,
        rationale: `Ở bệnh nhân HFrEF đang dùng chẹn beta nhập viện vì mất bù cấp nhưng không có sốc tim, tụt huyết áp nặng, nhịp chậm dưới ${hrMin} chu kỳ/phút hoặc co thắt phế quản cấp, tiếp tục duy trì chẹn beta giúp giảm tử vong và tái nhập viện sau xuất viện.`,
        gates: [{ parameter: 'Huyết động', passed: true, messageVi: `SBP >= ${sbpMin} mmHg, HR >= ${hrMin} bpm, không sốc tim` }],
        citationIds: cits,
        priority: 88,
      };
    },
  },
  {
    id: 'hf.inpatient.predischarge_optimization',
    module: 'hf',
    nameVi: 'Tối ưu hóa sớm GDMT trước xuất viện & Tái khám sớm (Chiến lược STRONG-HF)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.acute_predischarge_fmt'],
    when: (ctx) => hasHfContext(ctx),
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp');
      const lvef = need(ctx, 'lvef');
      const cong = getCongestionStatus(ctx);
      const sbpShock = thFor('sbp', 'hf.acute.shock_sbp');
      const unstable =
        isAcutelyDecompensated(ctx) ||
        hasAcuteKidneyInjury(ctx) ||
        cong !== 'euvolaemic' ||
        lvef === undefined ||
        sbp === undefined ||
        sbp < sbpShock;

      if (unstable) {
        return {
          id: 'rec_hf_inpatient_predischarge',
          module: 'hf',
          tier: 'Kế hoạch chuyển tiếp trước xuất viện (Class I)',
          tierOrder: 3,
          action: 'DEFER',
          title: 'Trì hoãn tối ưu hóa nhanh GDMT trước xuất viện cho tới khi đạt đẳng dịch (euvolaemic), hết AKI, ổn định huyết động & có LVEF',
          rationale: 'Trong pha cấp còn sung huyết, tổn thương thận cấp (AKI), huyết động chưa ổn định >= 24 giờ hoặc chưa có siêu âm tim LVEF, ưu tiên giải áp sung huyết và ổn định tạng trước khi chuyển sang chiến lược tăng tốc GDMT đường uống (STRONG-HF).',
          gates: [{ parameter: 'Ổn định trước xuất viện', passed: false, messageVi: 'Chưa đạt đẳng dịch euvolaemic / còn AKI / thiếu LVEF' }],
          citationIds: ['esc.hf.2026.acute_predischarge_fmt'],
          priority: 74,
        };
      }

      return {
        id: 'rec_hf_inpatient_predischarge',
        module: 'hf',
        tier: 'Tối ưu hóa trước xuất viện (Class I - STRONG-HF)',
        tierOrder: 3,
        action: 'START',
        title: 'Khởi trị sớm & chuẩn độ nhanh phác đồ nền tảng GDMT trước xuất viện, hẹn tái khám sát sau 1–2 tuần',
        rationale: 'Sau khi đã giải quyết sung huyết cấp đạt đẳng dịch và ổn định huyết động >= 24 giờ, ESC 2026 khuyến cáo Class I, Level B2 khởi trị sớm các trụ cột suy tim đường uống trước xuất viện và chuẩn độ tích cực kèm theo dõi lâm sàng, K+, eGFR, NT-proBNP trong 6 tuần đầu (STRONG-HF).',
        gates: [{ parameter: 'Ổn định trước xuất viện', passed: true, messageVi: 'Đã đạt đẳng dịch euvolaemic, huyết động và thận ổn định' }],
        citationIds: ['esc.hf.2026.acute_predischarge_fmt'],
        priority: 85,
      };
    },
  },
];
