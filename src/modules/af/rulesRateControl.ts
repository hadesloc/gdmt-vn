/**
 * Quy tắc Kiểm soát Tần số Thất khi thiếu LVEF hoặc LVEF > 40% [R] – Module Rung nhĩ (AF)
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  BB_IDS,
  NON_DHP_CCB_IDS,
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
  isAfActive,
  isAllergicToDrug,
  isUnstableHemodynamics
} from './rulesHelpers';

const TIER_R_RATE = 'AF-CARE · [R] Kiểm soát tần số';

export const afRateControlRules: Rule[] = [
  {
    id: 'af.rate.missing_lvef',
    module: 'af',
    nameVi: 'AF-CARE [R]: Yêu cầu siêu âm tim đánh giá LVEF để phân tầng an toàn thuốc kiểm soát tần số',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasWpw(ctx) &&
      need(ctx, 'lvef') === undefined &&
      !isUnstableHemodynamics(ctx),
    produce: (): Recommendation =>
      missingInputRec(
        'af',
        'lvef',
        `phân định LVEF > ${thFor('lvef', 'af.rate.lvef_cutoff')}% hay ≤ ${thFor('lvef', 'af.rate.lvef_cutoff')}% trước khi chọn thuốc kiểm soát tần số (tránh sốc tim do Diltiazem/Verapamil nếu có HFrEF ẩn)`,
        ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.non_dhp_ccb_contra_lvef40']
      ),
    citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.non_dhp_ccb_contra_lvef40']
  },

  {
    id: 'af.rate.preserved_lvef',
    module: 'af',
    nameVi: 'AF-CARE [R]: Kiểm soát tần số tim khi phân suất tống máu LVEF bảo tồn trên ngưỡng suy tim giảm EF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const ef = need(ctx, 'lvef');
      if (!isAfActive(ctx) || hasWpw(ctx) || hasConductionBlockNoPacer(ctx)) return false;
      if (ef === undefined || ef <= thFor('lvef', 'af.rate.lvef_cutoff')) return false;
      const hr = need(ctx, 'hr');
      const lenientHr = thFor('hr', 'af.rate.lenient_hr_target');
      if (ctx.settings?.setting === 'inpatient' && hr !== undefined && hr >= lenientHr) return false;
      return true;
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
      const isPregnant = hasCondition(ctx, 'pregnant');
      const isAmyloid = hasCardiacAmyloidosis(ctx);
      const ehraNum = getEhraNumeric(ctx);
      const useStrictTarget = ehraNum !== undefined && ehraNum >= 3; // qa-allow: index - EHRA >= 3 chỉ định đích HR chặt < 80 bpm
      const targetHr = useStrictTarget ? strictTarget : lenientTarget;
      const targetCite = useStrictTarget ? 'esc.af.2024.rate_strict_target_80' : 'esc.af.2024.rate_control_lenient_target';

      const rawBbMed = findCurrentMed(ctx, BB_IDS);
      const bbMed = rawBbMed && !(hasAsthma && NON_SELECTIVE_BB_IDS.includes(rawBbMed.drugId.toLowerCase())) ? rawBbMed : undefined;
      const rawCcbMed = findCurrentMed(ctx, NON_DHP_CCB_IDS);
      const ccbMed =
        rawCcbMed && !isAmyloid && !bbMed && !(isPregnant && rawCcbMed.drugId.toLowerCase() === 'diltiazem')
          ? rawCcbMed
          : undefined;
      const digMed = !isAmyloid ? findCurrentMed(ctx, ['digoxin']) : undefined;
      const k = need(ctx, 'k');
      const validDigMed = digMed && (k === undefined || k >= thFor('k', 'hf.digoxin.k_min')) ? digMed : undefined;

      if (!bbMed && !ccbMed && !validDigMed) {
        if (hr === undefined) {
          return missingInputRec('af', 'hr', 'đánh giá tần số thất lúc nghỉ trước khi khởi trị thuốc hạ nhịp', [
            'esc.af.2024.rate_control_lenient_target'
          ]);
        }
        if (sbp === undefined) {
          return missingInputRec('af', 'sbp', 'loại trừ tụt huyết áp trước khi khởi trị Chẹn beta hoặc Diltiazem/Verapamil', [
            'fda.diltiazem.hypotension_sbp90'
          ]);
        }
      }

      if (bbMed) {
        const bbId = bbMed.drugId.toLowerCase();
        const bbName = getDrugDisplayNameVi(bbId, bbMed);
        const isUncontrolled = hr !== undefined && hr >= targetHr;
        const digComboNote =
          isUncontrolled && !isAmyloid
            ? ' Nếu đã đạt liều tối đa dung nạp của Chẹn beta mà tần số thất vẫn vượt đích, khuyến cáo phối hợp thêm Digoxin (tránh phối hợp thường quy với Diltiazem/Verapamil).'
            : '';
        return {
          id: 'rec_af_rate_preserved_ef',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: isUncontrolled ? 'UPTITRATE' : 'CONTINUE',
          drugId: bbId,
          drugNameVi: bbName,
          dose: isUncontrolled ? formatRateUptitrateDose(bbMed, bbId) : formatCurrentMedDose(bbMed, bbId),
          title: isUncontrolled
            ? `Tăng liều ${bbName} kiểm soát tần số thất (HR ${hr} ≥ ${targetHr} bpm)`
            : `Duy trì ${bbName} kiểm soát tần số thất đạt mục tiêu (< ${targetHr} bpm)`,
          rationale: `ESC 2024 (Rec Table 14): Mục tiêu tần số tim lúc nghỉ < ${targetHr} bpm (${useStrictTarget ? 'kiểm soát chặt do triệu chứng EHRA 3–4' : 'kiểm soát lỏng ban đầu'}).${digComboNote}`,
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
          citationIds: ['esc.af.2024.rate_control_lvef_preserved', targetCite],
          priority: 85
        };
      }

      if (ccbMed) {
        const ccbId = ccbMed.drugId.toLowerCase();
        const ccbName = drug(ccbId).nameVi;
        const isUncontrolled = hr !== undefined && hr >= targetHr;
        return {
          id: 'rec_af_rate_preserved_ef',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: isUncontrolled ? 'UPTITRATE' : 'CONTINUE',
          drugId: ccbId,
          drugNameVi: ccbName,
          dose: isUncontrolled ? formatRateUptitrateDose(ccbMed, ccbId) : formatCurrentMedDose(ccbMed, ccbId),
          title: isUncontrolled
            ? `Tăng liều ${ccbName} kiểm soát tần số thất (HR ${hr} ≥ ${targetHr} bpm)`
            : `Duy trì ${ccbName} kiểm soát tần số thất đạt mục tiêu (< ${targetHr} bpm)`,
          rationale: `ESC 2024 (Rec Table 14): Mục tiêu tần số tim lúc nghỉ < ${targetHr} bpm; có thể phối hợp thêm Digoxin nếu đơn trị liều tối đa chưa đạt đích.`,
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
          citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose', targetCite],
          priority: 85
        };
      }

      if (validDigMed && (hr === undefined || hr < targetHr)) {
        return {
          id: 'rec_af_rate_preserved_digoxin_continue',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: 'CONTINUE',
          drugId: 'digoxin',
          drugNameVi: drug('digoxin').nameVi,
          dose: formatCurrentMedDose(validDigMed, 'digoxin'),
          title: `Duy trì Digoxin kiểm soát tần số thất đạt đích (< ${targetHr} bpm)`,
          rationale: 'ESC 2024 (Rec Table 14): Duy trì Digoxin liều thấp an toàn và theo dõi định kỳ chức năng thận, điện giải đồ.',
          gates: [],
          citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.hf.2026.digoxin_rec'],
          priority: 82
        };
      }

      const stoppingContraRateMed =
        (isPregnant && Boolean(rawCcbMed && rawCcbMed.drugId.toLowerCase() === 'diltiazem')) ||
        (hasAsthma && Boolean(rawBbMed && NON_SELECTIVE_BB_IDS.includes(rawBbMed.drugId.toLowerCase()))) ||
        (isAmyloid && Boolean(rawCcbMed || findCurrentMed(ctx, ['digoxin'])));

      if (!validDigMed && !stoppingContraRateMed && hr !== undefined && hr < targetHr) {
        return {
          id: 'rec_af_rate_preserved_controlled',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: 'MONITOR',
          dose: undefined,
          title: `Tần số thất lúc nghỉ đã đạt mục tiêu tự nhiên (HR ${hr} < ${targetHr} bpm): Theo dõi, chưa cần khởi trị thuốc hạ nhịp`,
          rationale: `ESC 2024 (Rec Table 14): Khi LVEF > ${efCutoff}% và nhịp thất lúc nghỉ đã dưới đích ${targetHr} bpm không cần thuốc, khởi trị thêm Chẹn beta hoặc Non-DHP CCB dễ gây nhịp chậm có triệu chứng; theo dõi Holter nếu còn triệu chứng gắng sức.`,
          gates: [{ parameter: 'HR', passed: true, value: hr, threshold: targetHr, messageVi: `HR ${hr} < ${targetHr} bpm` }],
          citationIds: ['esc.af.2024.rate_control_lenient_target', 'esc.af.2024.rate_strict_target_80'],
          priority: 76
        };
      }

      if (hasAsthma && isAmyloid) {
        return {
          id: 'rec_af_rate_amyloid_asthma_refer',
          module: 'af',
          tier: TIER_R_RATE,
          tierOrder: 3,
          action: 'REFER',
          dose: undefined,
          title: 'Hội chẩn chuyên khoa Tim mạch kiểm soát tần số ở bệnh nhân Amyloidosis tim kèm Hen phế quản',
          rationale:
            'ESC HF 2026 & ESC AF 2024: Amyloidosis tim chống chỉ định Digoxin và Diltiazem/Verapamil, trong khi hen phế quản hạn chế dùng chẹn beta; cần hội chẩn chuyên khoa Tim mạch.',
          gates: [],
          citationIds: ['esc.hf.2026.amyloidosis_avoid_digoxin', 'esc.af.2024.rate_control_lvef_preserved'],
          priority: 86
        };
      }

      let chosenDrug = 'bisoprolol';
      if (hasAsthma) {
        chosenDrug = isPregnant ? 'verapamil' : 'diltiazem';
      } else if (isAllergicToDrug(ctx, 'bisoprolol')) {
        chosenDrug = !isAmyloid && !isPregnant ? 'diltiazem' : 'metoprolol_succinate';
      }
      if (isAllergicToDrug(ctx, chosenDrug)) return null;

      const chosenName = drug(chosenDrug).nameVi;
      const altNote = hasAsthma
        ? isPregnant
          ? `Do có hen phế quản kèm thai kỳ (tránh Diltiazem), lựa chọn thay thế là Verapamil (LVEF ${ef}% > ${efCutoff}%).`
          : 'Do có hen phế quản chống chỉ định chẹn beta, ưu tiên khởi trị Diltiazem (hoặc Verapamil).'
        : isAmyloid
        ? 'Ở bệnh cơ tim Amyloidosis, chỉ dùng chẹn beta chọn lọc liều thấp thận trọng; cấm tuyệt đối Digoxin và Diltiazem/Verapamil.'
        : isPregnant
        ? 'Trong thai kỳ, ưu tiên chẹn beta chọn lọc beta-1 (tránh Atenolol và tránh Diltiazem).'
        : 'Ưu tiên Chẹn beta chọn lọc (hoặc Diltiazem/Verapamil) là lựa chọn đầu tay.';

      return {
        id: 'rec_af_rate_preserved_ef',
        module: 'af',
        tier: TIER_R_RATE,
        tierOrder: 3,
        action: 'START',
        drugId: chosenDrug,
        drugNameVi: chosenName,
        dose: getCleanStartDose(chosenDrug),
        title: `Khởi trị ${chosenName} kiểm soát tần số thất (HR ${hr} bpm, LVEF ${ef}% > ${efCutoff}%)`,
        rationale: `Khuyến cáo Class I, Mức B (ESC 2024 Rec Table 14): Mục tiêu tần số thất lúc nghỉ < ${targetHr} bpm. ${altNote}`,
        gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
        citationIds: hasAsthma
          ? isPregnant
            ? ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.pregnancy_rate_verapamil', 'esc.af.2024.verapamil_contra_lvef40']
            : ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose', targetCite]
          : ['esc.af.2024.rate_control_lvef_preserved', targetCite, 'esc.hf.2026.bb_doses'],
        priority: 85
      };
    },
    citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.rate_control_lenient_target']
  }
];
