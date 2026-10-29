/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú Bước 3B: THA Kháng trị — Thuốc Thay thế Spironolactone
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  ALPHA1_IDS,
  BB_IDS,
  NDHP_CCB_IDS,
  getEffectiveActiveMedIds,
  getUncontrolledBpCutoffs,
  hasAvBlockOrSssWithoutPacer,
  isHfrEf,
  isOutpatientCrisisOrUnstable
} from './helpers';
import { countCoreClasses, shouldDeferToHfrEfPillars } from './rules.outpatient.step_helpers';

export const htnOutpatientStep3AltRules: Rule[] = [
  {
    id: 'htn.outpatient.step3_resistant_alternative',
    module: 'htn',
    nameVi: 'Bước 3 (Thay thế khi chặn Spironolactone): Phối hợp Bisoprolol hoặc Doxazosin qua cổng HR / Tư thế đứng',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      if (shouldDeferToHfrEfPillars(ctx, effectiveMeds)) return false;
      if (countCoreClasses(effectiveMeds).count < 3) return false;

      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const k = need(ctx, 'k');
      const egfr = need(ctx, 'egfr');
      if (sbp === undefined || dbp === undefined || k === undefined || egfr === undefined) return false;

      const cutoffs = getUncontrolledBpCutoffs(ctx);
      if (sbp < cutoffs.sbp && dbp < cutoffs.dbp) return false;

      const kMaxRasi = thFor('k', 'htn.rasi.k_max_initiate');
      if (k > kMaxRasi) return false;

      const kMaxSpiro = thFor('k', 'htn.spiro.k_max_initiate');
      const egfrMin =
        ctx.settings.profile === 'US'
          ? thFor('egfr', 'htn.spiro.egfr_min_initiate')
          : thFor('egfr', 'htn.spiro.egfr_contra_esc');

      return k > kMaxSpiro || egfr < egfrMin;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const hr = need(ctx, 'hr');
      const sbp = need(ctx, 'sbp')!;
      const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');
      const sbpBbMin = thFor('sbp', 'htn.safety.sbp_bb_min');

      const alreadyOnBb = effectiveMeds.some((id) => BB_IDS.includes(id));
      const alreadyOnAlpha = effectiveMeds.some((id) => ALPHA1_IDS.includes(id));
      const hasNdhpCcb = effectiveMeds.some((id) => NDHP_CCB_IDS.includes(id));
      const bbContra =
        hasCondition(ctx, 'asthma') || hasAvBlockOrSssWithoutPacer(ctx) || hasNdhpCcb || sbp < sbpBbMin;

      // Fail-closed HR trước khi xét Bisoprolol (khắc phục ADV_HTN_09 / R3-HTN-04)
      if (!alreadyOnBb && !bbContra && hr === undefined) {
        return missingInputRec(
          'htn',
          'hr',
          'kiểm tra tần số tim (HR ≥ 60 chu kỳ/phút) trước khi chọn Bisoprolol làm thuốc hàng thứ 4 thay thế Spironolactone',
          ['esc.htn.2024.resistant_alternatives', 'vsh.htn.2022.bb_contraindications_table11']
        );
      }

      if (!alreadyOnBb && !bbContra && hr !== undefined && hr >= hrMin) {
        const bisoName = drug('bisoprolol').nameVi;
        const bisoStart = th('htn.bisoprolol.dose_start_htn');
        const bisoUsual = th('htn.bisoprolol.dose_usual_htn');
        return {
          id: 'rec_htn_step3_alt_bisoprolol',
          module: 'htn',
          tier: 'Bước 3: Thuốc Hàng thứ 4 Thay thế Spironolactone',
          tierOrder: 3,
          action: 'START',
          drugId: 'bisoprolol',
          drugNameVi: bisoName,
          dose: `${bisoStart}–${bisoUsual} mg uống 1 lần/ngày buổi sáng`,
          title: `Thay thế Spironolactone (Bước 3): Bổ sung chẹn beta chọn lọc β1 ${bisoName} ${bisoStart}–${bisoUsual} mg/ngày`,
          rationale: `Do không đạt ngưỡng an toàn Kali máu / eGFR để dùng Spironolactone (và Eplerenone cũng tăng Kali máu tương tự), ESC 2024 (Class IIa) và AHA/ACC 2025 khuyến cáo bổ sung chẹn beta giãn mạch hoặc chọn lọc β1 cao (${bisoName}, HR hiện tại ${hr} ≥ ${hrMin} chu kỳ/phút).`,
          gates: [
            {
              parameter: 'Tần số tim (HR)',
              passed: true,
              value: hr,
              threshold: hrMin,
              messageVi: `HR ${hr} ≥ ${hrMin} bpm: An toàn khởi trị ${bisoName}`
            }
          ],
          citationIds: [
            'esc.htn.2024.resistant_alternatives',
            'aha.acc.2025.table13_bisoprolol_labetalol',
            'vsh.htn.2022.drugs_table_mra_bb'
          ],
          priority: 77
        };
      }

      if (!alreadyOnAlpha && !hasCondition(ctx, 'orthostaticHypotension') && !hasCondition(ctx, 'hf') && !isHfrEf(ctx)) {
        const doxaName = drug('doxazosin').nameVi;
        const doxaStart = th('htn.doxazosin.dose_start');
        return {
          id: 'rec_htn_step3_alt_doxazosin',
          module: 'htn',
          tier: 'Bước 3: Thuốc Hàng thứ 4 Thay thế (Chẹn Alpha-1)',
          tierOrder: 3,
          action: 'START',
          drugId: 'doxazosin',
          drugNameVi: doxaName,
          dose: `${doxaStart} mg uống buổi tối trước khi ngủ (uống liều đầu tại giường để tránh ngất tư thế)`,
          title: `Thay thế Bước 3 (khi chặn cả MRA & Chẹn beta): Bổ sung ${doxaName} ${doxaStart} mg buổi tối`,
          rationale:
            'Theo thử nghiệm PATHWAY-2 và ESC 2024 (Class IIa), chẹn thụ thể alpha-1 ngoại biên (Doxazosin) là lựa chọn hàng tiếp theo khi cả Spironolactone và chẹn beta đều không phù hợp; bắt buộc dặn bệnh nhân uống liều đầu trước khi đi ngủ và theo dõi hạ huyết áp tư thế đứng.',
          gates: [],
          citationIds: ['esc.htn.2024.resistant_alternatives', 'aha.acc.2025.table13_alpha1'],
          priority: 74
        };
      }

      return null;
    },
    citationIds: ['esc.htn.2024.resistant_alternatives', 'aha.acc.2025.table13_bisoprolol_labetalol']
  }
];
