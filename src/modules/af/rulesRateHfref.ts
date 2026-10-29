/**
 * Quy tắc Kiểm soát Tần số Thất ở Suy tim HFrEF (LVEF ≤ 40%) [R] – Module Rung nhĩ (AF)
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  BB_IDS,
  NON_SELECTIVE_BB_IDS,
  findCurrentMed,
  formatCurrentMedDose,
  formatRateUptitrateDose,
  getCleanStartDose,
  getDrugDisplayNameVi,
  getEhraNumeric,
  hasCardiacAmyloidosis,
  hasConductionBlockNoPacer,
  hasWpw,
  isAcuteDecompensatedHf,
  isAfActive,
  isAllergicToDrug,
  isUnstableHemodynamics
} from './rulesHelpers';

const TIER_R_RATE = 'AF-CARE · [R] Kiểm soát tần số';

export const afRateHfrefRules: Rule[] = [
  {
    id: 'af.rate.reduced_lvef',
    module: 'af',
    nameVi: 'AF-CARE [R]: Kiểm soát tần số tim ở suy tim HFrEF bằng Chẹn beta suy tim ± Digoxin (cấm Non-DHP CCB)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const ef = need(ctx, 'lvef');
      return (
        isAfActive(ctx) &&
        !hasWpw(ctx) &&
        !hasConductionBlockNoPacer(ctx) &&
        ef !== undefined &&
        ef <= thFor('lvef', 'af.rate.lvef_cutoff')
      );
    },
    produce: (ctx): Recommendation | null => {
      const ef = need(ctx, 'lvef')!;
      const hr = need(ctx, 'hr');
      const sbp = need(ctx, 'sbp');
      const efCutoff = thFor('lvef', 'af.rate.lvef_cutoff');
      const lenientTarget = thFor('hr', 'af.rate.lenient_hr_target');
      const strictTarget = thFor('hr', 'af.rate.strict_hr_target');
      const minHr = thFor('hr', 'af.rate.bradycardia_hr_min');

      if (isUnstableHemodynamics(ctx) || (hr !== undefined && hr < minHr)) return null;

      const hasAsthma = hasCondition(ctx, 'asthma');
      const isAmyloid = hasCardiacAmyloidosis(ctx);
      const ehraNum = getEhraNumeric(ctx);
      const targetHr = ehraNum !== undefined && ehraNum >= 3 ? strictTarget : lenientTarget; // qa-allow: index - EHRA >= 3 chỉ định đích HR chặt < 80 bpm

      const rawBbMed = findCurrentMed(ctx, BB_IDS);
      const bbMed = rawBbMed && !(hasAsthma && NON_SELECTIVE_BB_IDS.includes(rawBbMed.drugId.toLowerCase())) ? rawBbMed : undefined;
      const digMed = !isAmyloid ? findCurrentMed(ctx, ['digoxin']) : undefined;
      const isInpatientRvr = ctx.settings?.setting === 'inpatient' && hr !== undefined && hr >= lenientTarget;

      if (!bbMed && (isInpatientRvr || isAcuteDecompensatedHf(ctx))) {
        return {
          id: 'rec_af_rate_reduced_ef_defer_bb_acute',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: 'DEFER',
          dose: undefined,
          title: `Trì hoãn khởi trị mới Chẹn beta đường uống cho đến khi hết sung huyết suy tim cấp (LVEF ${ef}% ≤ ${efCutoff}%)`,
          rationale:
            'ESC 2024 & ESC HF 2026: Trong suy tim mất bù cấp hoặc RVR nội viện kèm HFrEF, khởi trị ngay chẹn beta đường uống làm nặng suy tim cấp; ưu tiên Amiodarone tĩnh mạch (hoặc Digoxin tĩnh mạch nếu không có Amyloidosis) trước, chỉ bắt đầu chẹn beta suy tim liều rất thấp khi đã đạt đẳng thể tích.',
          gates: [],
          citationIds: ['esc.af.2024.rate_control_amiodarone_acute', 'esc.af.2024.rate_control_lvef_reduced'],
          priority: 78
        };
      }

      if (!bbMed && !digMed) {
        if (hr === undefined) {
          return missingInputRec('af', 'hr', 'đánh giá tần số tim trước khi khởi trị Chẹn beta suy tim', ['esc.af.2024.rate_control_lvef_reduced']);
        }
        if (sbp === undefined) {
          return missingInputRec('af', 'sbp', 'kiểm tra huyết áp trước khi khởi trị Chẹn beta suy tim', ['esc.af.2024.rate_control_lvef_reduced']);
        }
      }

      if (bbMed) {
        const bbId = bbMed.drugId.toLowerCase();
        const bbName = getDrugDisplayNameVi(bbId, bbMed);
        const isUncontrolled = hr !== undefined && hr >= targetHr && !isInpatientRvr;
        const adjunctNote = !isAmyloid
          ? ' Có thể phối hợp thêm Digoxin liều thấp nếu nhịp thất chưa đạt mục tiêu dù đã tối ưu liều Chẹn beta.'
          : ' Chống chỉ định tuyệt đối Digoxin và Diltiazem/Verapamil do bệnh cơ tim Amyloidosis.';
        return {
          id: 'rec_af_rate_reduced_ef_bb',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: isUncontrolled ? 'UPTITRATE' : 'CONTINUE',
          drugId: bbId,
          drugNameVi: bbName,
          dose: isUncontrolled ? formatRateUptitrateDose(bbMed, bbId) : formatCurrentMedDose(bbMed, bbId),
          title: isUncontrolled
            ? `Chuẩn độ tăng liều ${bbName} kiểm soát tần số và bảo vệ cơ tim trong HFrEF`
            : `Duy trì ${bbName} kiểm soát tần số thất và bảo vệ cơ tim trong HFrEF`,
          rationale: `Khuyến cáo Class I, Mức B (ESC 2024 Rec Table 14): Ở LVEF ${ef}% ≤ ${efCutoff}%, duy trì/chuẩn độ chẹn beta suy tim.${adjunctNote} Tuyệt đối cấm Diltiazem và Verapamil.`,
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
          citationIds: ['esc.af.2024.rate_control_lvef_reduced', 'esc.af.2024.non_dhp_ccb_contra_lvef40', 'esc.hf.2026.bb_doses'],
          priority: 90
        };
      }

      if (hasAsthma) {
        if (isAmyloid) {
          return {
            id: 'rec_af_rate_reduced_ef_amyloid_asthma',
            module: 'af',
            tier: TIER_R_RATE,
            tierOrder: 3,
            action: 'REFER',
            dose: undefined,
            title: 'Hội chẩn Tim mạch chuyên sâu: HFrEF kèm Amyloidosis tim và Hen phế quản (cấm Non-DHP CCB & cấm Digoxin)',
            rationale:
              'ESC HF 2026 & ESC AF 2024: Khi đồng mắc HFrEF, Amyloidosis tim và hen phế quản, cân nhắc Amiodarone hoặc tạo nhịp kèm đốt nút nhĩ thất tại trung tâm chuyên khoa.',
            gates: [],
            citationIds: ['esc.hf.2026.amyloidosis_avoid_digoxin', 'esc.af.2024.rate_control_lvef_reduced'],
            priority: 88
          };
        }
        return {
          id: 'rec_af_rate_reduced_ef_digoxin',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: digMed ? 'CONTINUE' : 'START',
          drugId: 'digoxin',
          drugNameVi: drug('digoxin').nameVi,
          dose: digMed ? formatCurrentMedDose(digMed, 'digoxin') : getCleanStartDose('digoxin'),
          title: `${digMed ? 'Duy trì' : 'Khởi trị'} Digoxin kiểm soát tần số thất trong HFrEF (khi hen phế quản chống chỉ định chẹn beta)`,
          rationale: `Khuyến cáo Class I (ESC 2024 Rec Table 14): Khi LVEF ${ef}% ≤ ${efCutoff}% và không thể dùng chẹn beta, Digoxin là lựa chọn an toàn; tuyệt đối cấm Diltiazem và Verapamil.`,
          gates: [],
          citationIds: ['esc.af.2024.rate_control_lvef_reduced', 'esc.hf.2026.digoxin_rec'],
          priority: 88
        };
      }

      const chosenBb = isAllergicToDrug(ctx, 'bisoprolol') ? 'metoprolol_succinate' : 'bisoprolol';
      if (isAllergicToDrug(ctx, chosenBb)) return null;

      return {
        id: 'rec_af_rate_reduced_ef_bb',
        module: 'af',
        tier: TIER_R_RATE,
        tierOrder: 3,
        action: 'START',
        drugId: chosenBb,
        drugNameVi: drug(chosenBb).nameVi,
        dose: getCleanStartDose(chosenBb),
        title: `Khởi trị ${drug(chosenBb).nameVi} liều thấp chuẩn độ dần để kiểm soát tần số thất trong HFrEF`,
        rationale: `Khuyến cáo Class I, Mức B (ESC 2024 Rec Table 14): Ở LVEF ${ef}% ≤ ${efCutoff}% huyết động ổn định, khởi trị chẹn beta suy tim liều thấp (có thể phối hợp Digoxin nếu không có Amyloidosis). Tuyệt đối cấm Diltiazem và Verapamil.`,
        gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
        citationIds: ['esc.af.2024.rate_control_lvef_reduced', 'esc.af.2024.non_dhp_ccb_contra_lvef40', 'esc.hf.2026.bb_doses'],
        priority: 90
      };
    },
    citationIds: ['esc.af.2024.rate_control_lvef_reduced', 'esc.af.2024.non_dhp_ccb_contra_lvef40']
  }
];
