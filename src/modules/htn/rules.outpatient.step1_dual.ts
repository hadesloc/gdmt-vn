/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú Bước 1: Phối hợp Đôi SPC & Hoàn thiện 2 Nhóm Nền
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  findCurrentMed,
  getEffectiveActiveMedIds,
  getMedIds,
  getUncontrolledBpCutoffs,
  hasBilateralRenalArteryStenosis,
  isOutpatientCrisisOrUnstable,
  needsLenientTarget,
  parseMedDoseMg
} from './helpers';
import {
  countCoreClasses,
  hasRasiHighRiskDdi,
  shouldDeferToHfrEfPillars
} from './rules.outpatient.step_helpers';
import { produceStep1ZeroMed } from './rules.outpatient.step1_zero';

export const htnOutpatientStep1DualRules: Rule[] = [
  {
    id: 'htn.outpatient.step1_dual_combination',
    module: 'htn',
    nameVi: 'Bước 1: Khởi trị phối hợp đôi liều cố định (SPC) hoặc đơn trị liệu cá thể hóa, hoàn thiện lên 2 nhóm nền',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      if (shouldDeferToHfrEfPillars(ctx, effectiveMeds)) return false;
      const core = countCoreClasses(effectiveMeds);
      return core.count === 0 || core.count === 1;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const rawMedIds = getMedIds(ctx);
      const core = countCoreClasses(effectiveMeds);
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const k = need(ctx, 'k');
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');

      const amloName = drug('amlodipine').nameVi;
      const amloLow = th('htn.amlodipine.dose_low');
      const amloStart = th('htn.amlodipine.dose_start');
      const kInitMax = thFor('k', 'htn.rasi.k_initiate_max');

      // Trường hợp chưa có nhóm nền hợp lệ nào (core.count === 0)
      if (core.count === 0) {
        return produceStep1ZeroMed(ctx);
      }

      // Trường hợp đang có đúng 1 nhóm nền (core.count === 1): Đánh giá hoàn thiện lên 2 nhóm nền khi HA chưa đạt đích
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'đánh giá kiểm soát huyết áp trên nền đơn trị liệu hiện tại', [
          'esc.htn.2024.initial_combination'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'đánh giá kiểm soát huyết áp trên nền đơn trị liệu hiện tại', [
          'esc.htn.2024.initial_combination'
        ]);
      }

      const cutoffs = getUncontrolledBpCutoffs(ctx);
      if (sbp < cutoffs.sbp && dbp < cutoffs.dbp) return null;

      // Nếu chưa có CCB (ví dụ đang dùng RASi hoặc đang dùng Lợi tiểu như htn_06): thêm Amlodipine
      if (!core.hasCcb) {
        const doseRec = needsLenientTarget(ctx) ? amloLow : amloStart;
        return {
          id: 'rec_htn_step1_complete_dual_ccb',
          module: 'htn',
          tier: 'Bước 1–2: Hoàn thiện Phối hợp Đôi (Thêm DHP-CCB)',
          tierOrder: 3,
          action: 'START',
          drugId: 'amlodipine',
          drugNameVi: amloName,
          dose: `${doseRec} mg uống 1 lần/ngày`,
          title: `Chưa đạt đích trên đơn trị liệu: Phối hợp thêm ${amloName} ${doseRec} mg/ngày`,
          rationale: `Huyết áp hiện tại (${sbp}/${dbp} mmHg) chưa đạt mục tiêu (< ${cutoffs.sbp}/${cutoffs.dbp} mmHg) với 1 nhóm thuốc nền. Bổ sung ${amloName} (ưu tiên chuyển sang viên phối hợp cố định SPC) để hoàn thiện phác đồ 2 nhóm nền hiệp đồng.`,
          gates: [],
          citationIds: ['esc.htn.2024.initial_combination', 'aha.acc.2025.stage2_spc_rec1', 'vsh.htn.2022.table9_dual_spc'],
          priority: 75
        };
      }

      // Đang dùng CCB đơn độc (core.hasCcb && !core.hasRasi && !core.hasDiuretic): cần K+ và SCr/eGFR trước khi ghép RASi!
      if (needsLenientTarget(ctx)) {
        const activeAmlo = findCurrentMed(ctx, ['amlodipine']);
        const curDose = parseMedDoseMg(activeAmlo);
        if (activeAmlo && curDose !== undefined && curDose < amloStart) {
          return {
            id: 'rec_htn_step1_lenient_uptitrate_ccb',
            module: 'htn',
            tier: 'Bước 1: Chỉnh liều An toàn Người cao tuổi / Suy yếu',
            tierOrder: 3,
            action: 'UPTITRATE',
            drugId: 'amlodipine',
            drugNameVi: amloName,
            dose: `Tăng từ ${curDose} mg lên ${amloStart} mg uống 1 lần/ngày`,
            title: `Chưa đạt đích (${sbp}/${dbp} mmHg): Tăng liều nhẹ ${amloName} lên ${amloStart} mg/ngày trước khi thêm thuốc thứ 2`,
            rationale:
              'Ở người rất cao tuổi, suy yếu hoặc có hạ huyết áp tư thế đứng, ưu tiên chỉnh liều từ từ thuốc đơn trị hiện có và kiểm tra huyết áp tư thế đứng trước khi phối hợp nhiều nhóm thuốc.',
            gates: [],
            citationIds: ['esc.htn.2024.bp_target_lenient', 'esc.htn.2024.oh_switch_rec24'],
            priority: 74
          };
        }
      }

      if (k === undefined) {
        return missingInputRec('htn', 'k', 'kiểm tra Kali máu trước khi phối hợp thêm RASi trên nền CCB', [
          'esc.htn.2024.initial_combination',
          'aha.acc.2025.table18_k50'
        ]);
      }
      if (egfr === undefined && crcl === undefined) {
        return missingInputRec('htn', 'scr', 'kiểm tra chức năng thận (SCr / eGFR) trước khi phối hợp thêm RASi hoặc lợi tiểu', [
          'esc.htn.2024.initial_combination',
          'aha.acc.2025.monitoring_bmp_2_4wk'
        ]);
      }

      if (k <= kInitMax && !hasBilateralRenalArteryStenosis(ctx) && !hasRasiHighRiskDdi(rawMedIds)) {
        const useArb = hasCondition(ctx, 'priorAngioedema') || hasCondition(ctx, 'gout');
        const targetId = useArb ? 'losartan' : 'perindopril';
        const targetName = drug(targetId).nameVi;
        const startDose = useArb ? th('htn.losartan.dose_start_htn') : th('htn.perindopril.dose_start_adult');
        return {
          id: 'rec_htn_step1_complete_dual_rasi',
          module: 'htn',
          tier: 'Bước 1–2: Hoàn thiện Phối hợp Đôi (Thêm RASi)',
          tierOrder: 3,
          action: 'START',
          drugId: targetId,
          drugNameVi: targetName,
          dose: `${startDose} mg uống 1 lần/ngày (ưu tiên gộp viên SPC cùng CCB)`,
          title: `Chưa đạt đích trên CCB đơn độc: Phối hợp thêm ${targetName} ${startDose} mg/ngày`,
          rationale: `Huyết áp ${sbp}/${dbp} mmHg chưa đạt mục tiêu (< ${cutoffs.sbp}/${cutoffs.dbp} mmHg) với CCB đơn trị; bổ sung ${targetName} giúp hiệp đồng hạ áp và giảm phù mắt cá chân do giãn tĩnh mạch sau mao mạch.`,
          gates: [
            {
              parameter: 'Kali máu (K⁺)',
              passed: true,
              value: k,
              threshold: kInitMax,
              messageVi: `K⁺ ${k} ≤ ${kInitMax} mmol/L: An toàn khởi trị ${targetName}`
            }
          ],
          citationIds: ['esc.htn.2024.initial_combination', 'esc.htn.2024.first_line_classes'],
          priority: 75
        };
      }

      // Khi RASi bị chặn trên bệnh nhân đang dùng CCB đơn độc: chuyển sang thêm Lợi tiểu phù hợp theo eGFR (tránh Thiazide nếu có Gút hoặc K+ < 3.5)
      if (!hasCondition(ctx, 'gout') && !hasCondition(ctx, 'orthostaticHypotension')) {
        const kHypo = thFor('k', 'htn.hypokalemia.k_threshold');
        if (k < kHypo) return null;
        const egfrLoop = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
        const useLoop = egfr !== undefined && egfr < egfrLoop;
        const diurId = useLoop ? 'furosemide' : 'indapamide';
        const diurName = drug(diurId).nameVi;
        const diurDose = useLoop ? th('htn.furosemide.dose_start_mg') : th('htn.indapamide.dose_start');
        return {
          id: 'rec_htn_step1_complete_dual_diuretic_fallback',
          module: 'htn',
          tier: 'Bước 1–2: Phối hợp Đôi Thay thế (CCB + Lợi tiểu do chống chỉ định RASi)',
          tierOrder: 3,
          action: 'START',
          drugId: diurId,
          drugNameVi: diurName,
          dose: `${diurDose} mg uống 1 lần/ngày buổi sáng`,
          title: `Không thể dùng RASi: Phối hợp thêm ${diurName} ${diurDose} mg/ngày cùng CCB`,
          rationale: `Do chống chỉ định hoặc tương tác nguy cơ cao với nhóm RASi (K⁺ = ${k} mmol/L / hẹp ĐM thận hai bên / tương tác thuốc), phối hợp CCB với ${diurName} để kiểm soát huyết áp (${sbp}/${dbp} mmHg).`,
          gates: [],
          citationIds: ['esc.htn.2024.first_line_classes', 'esc.htn.2024.ckd_loop_diuretic'],
          priority: 73
        };
      }

      return null;
    },
    citationIds: ['esc.htn.2024.initial_combination', 'aha.acc.2025.stage2_spc_rec1', 'vsh.htn.2022.table9_dual_spc']
  },

  // -------------------------------------------------------------------------
  // 1B. ĐỐI TÁC RASI TRONG KHỞI TRỊ PHỐI HỢP ĐÔI SPC (PERINDOPRIL / LOSARTAN)
  // -------------------------------------------------------------------------
];
