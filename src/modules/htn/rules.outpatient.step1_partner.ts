/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú Bước 1B: Thành phần RASi Đối tác trong SPC Đôi
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  getEffectiveActiveMedIds,
  getMedIds,
  hasBilateralRenalArteryStenosis,
  isOutpatientCrisisOrUnstable
} from './helpers';
import {
  countCoreClasses,
  hasRasiHighRiskDdi,
  resolveStep1ZeroMedMode,
  shouldDeferToHfrEfPillars
} from './rules.outpatient.step_helpers';

export const htnOutpatientStep1PartnerRules: Rule[] = [
  {
    id: 'htn.outpatient.step1_dual_rasi_partner',
    module: 'htn',
    nameVi: 'Bước 1 (Thành phần RASi trong SPC đôi): Khởi trị Perindopril hoặc Losartan an toàn',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      if (shouldDeferToHfrEfPillars(ctx, effectiveMeds)) return false;
      if (countCoreClasses(effectiveMeds).count !== 0) return false;
      return resolveStep1ZeroMedMode(ctx) === 'dual_spc';
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const k = need(ctx, 'k');
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      if (k === undefined || (egfr === undefined && crcl === undefined)) return null;

      const kInitMax = thFor('k', 'htn.rasi.k_initiate_max');
      if (k > kInitMax || hasBilateralRenalArteryStenosis(ctx)) return null;

      const rawMedIds = getMedIds(ctx);
      if (hasRasiHighRiskDdi(rawMedIds)) {
        const perinName = drug('perindopril').nameVi;
        return {
          id: 'rec_htn_step1_avoid_rasi_ddi',
          module: 'htn',
          tier: 'Cảnh báo Tương tác Thuốc Nghiêm trọng',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'perindopril',
          drugNameVi: perinName,
          title: `TRÁNH phối hợp RASi (${perinName}/ARB) tự động do đang dùng Lithium hoặc Lợi tiểu giữ kali + Bù Kali`,
          rationale:
            'Phối hợp ACEi/ARB với Lithium làm giảm thải trừ Lithium qua thận gây ngộ độc Lithium thần kinh-tim mạch nặng; phối hợp đồng thời với Amiloride/Triamterene kèm viên bù Kali đường uống gây tăng Kali máu nguy kịch. Ưu tiên khởi trị nền DHP-CCB trước và hội chẩn rà soát tương tác.',
          gates: [
            {
              parameter: 'Tương tác thuốc nguy cơ cao (Lithium / Giữ K⁺ + Bù K⁺)',
              passed: false,
              messageVi: 'Chặn khởi trị tự động RASi để phòng ngộ độc Lithium / tăng K⁺ cấp'
            }
          ],
          citationIds: ['ema.perindopril.htn_dosing', 'vsh.htn.2022.contraindications_table11'],
          priority: 89
        };
      }

      const useArb = hasCondition(ctx, 'priorAngioedema') || hasCondition(ctx, 'gout');
      const targetId = useArb ? 'losartan' : 'perindopril';
      const targetName = drug(targetId).nameVi;
      const startDose = useArb ? th('htn.losartan.dose_start_htn') : th('htn.perindopril.dose_start_adult');

      return {
        id: 'rec_htn_step1_dual_rasi_partner',
        module: 'htn',
        tier: 'Bước 1: Phối hợp Đôi Liều Cố định (Thành phần RASi)',
        tierOrder: 3,
        action: 'START',
        drugId: targetId,
        drugNameVi: targetName,
        dose: `${startDose} mg uống 1 lần/ngày (ưu tiên gộp trong viên SPC cùng Amlodipine)`,
        title: useArb
          ? `Thành phần RASi của phối hợp đôi SPC: ${targetName} ${startDose} mg/ngày (ưu tiên ARB do tiền sử phù mạch / bệnh Gút)`
          : `Thành phần RASi của phối hợp đôi SPC: ${targetName} ${startDose} mg/ngày`,
        rationale: useArb
          ? `Chọn ${targetName} thay cho ACEi trong phác đồ phối hợp đôi ban đầu (${hasCondition(ctx, 'priorAngioedema') ? 'tiền sử phù mạch với ACEi — lưu ý theo dõi sát và cách ít nhất 6 tuần sau ngừng ACEi theo AHA/ACC 2025' : 'Losartan có tác dụng tăng thải acid uric qua thận có lợi trên bệnh nhân Gút'}).`
          : `Kết hợp ${targetName} ${startDose} mg/ngày cùng Amlodipine (vd: viên cố định Coveram) giúp ức chế hệ RAA hiệp đồng giãn mạch, bảo vệ tim-thận và triệt tiêu phản xạ phù ngoại biên của DHP-CCB.`,
        gates: [
          {
            parameter: 'Kali máu (K⁺)',
            passed: true,
            value: k,
            threshold: kInitMax,
            messageVi: `K⁺ ${k} ≤ ${kInitMax} mmol/L: Đạt ngưỡng an toàn khởi trị ${targetName}`
          }
        ],
        citationIds: useArb
          ? ['aha.acc.2025.table13_losartan_ccb_bb', 'aha.acc.2025.arb_angioedema_6wk', 'esc.htn.2024.gout_thiazide_caution']
          : ['esc.htn.2024.initial_combination', 'ema.perindopril.htn_dosing', 'vsh.htn.2022.table9_dual_spc'],
        priority: 75
      };
    },
    citationIds: ['esc.htn.2024.initial_combination', 'ema.perindopril.htn_dosing']
  },

  // -------------------------------------------------------------------------
  // 2. BƯỚC 2: PHỐI HỢP BA THUỐC (RASI + CCB + LỢI TIỂU THIAZIDE-LIKE / QUAI)
  // -------------------------------------------------------------------------
];
