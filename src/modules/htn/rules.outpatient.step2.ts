/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú Bước 2: Phối hợp Ba Thuốc (RASi + CCB + Lợi tiểu)
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

export const htnOutpatientStep2Rules: Rule[] = [
  {
    id: 'htn.outpatient.step2_triple_combination',
    module: 'htn',
    nameVi: 'Bước 2: Nâng bậc lên phối hợp ba thuốc (RASi + CCB + Lợi tiểu theo eGFR)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      if (shouldDeferToHfrEfPillars(ctx, effectiveMeds)) return false;
      return countCoreClasses(effectiveMeds).count === 2;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'đánh giá chỉ định nâng bậc Bước 2', ['esc.htn.2024.triple_combination']);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'đánh giá chỉ định nâng bậc Bước 2', ['esc.htn.2024.triple_combination']);
      }

      const cutoffs = getUncontrolledBpCutoffs(ctx);
      if (sbp < cutoffs.sbp && dbp < cutoffs.dbp) return null;

      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const rawMedIds = getMedIds(ctx);
      const core = countCoreClasses(effectiveMeds);
      const k = need(ctx, 'k');
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');

      // Cá thể hóa lão khoa / suy yếu / hạ HA tư thế trên 2 thuốc liều thấp: chỉnh liều CCB trước khi thêm lợi tiểu
      if (needsLenientTarget(ctx) && core.hasRasi && core.hasCcb) {
        const activeAmlo = findCurrentMed(ctx, ['amlodipine']);
        const curAmloDose = parseMedDoseMg(activeAmlo);
        const amloStart = th('htn.amlodipine.dose_start');
        if (activeAmlo && curAmloDose !== undefined && curAmloDose < amloStart) {
          return {
            id: 'rec_htn_step2_lenient_uptitrate_ccb',
            module: 'htn',
            tier: 'Bước 2: Tối ưu Liều An toàn trên Nền Suy yếu / Hạ HA Tư thế',
            tierOrder: 3,
            action: 'UPTITRATE',
            drugId: 'amlodipine',
            drugNameVi: drug('amlodipine').nameVi,
            dose: `Tăng từ ${curAmloDose} mg lên ${amloStart} mg uống 1 lần/ngày`,
            title: `Suy yếu / Hạ HA tư thế (${sbp}/${dbp} mmHg): Tăng nhẹ Amlodipine lên ${amloStart} mg thay vì thêm lợi tiểu Thiazide`,
            rationale:
              'Ở người rất cao tuổi, suy yếu hoặc có hạ huyết áp tư thế đứng đang dùng liều rất thấp 2 thuốc, việc thêm lợi tiểu Thiazide làm tăng mạnh nguy cơ mất thể tích, hạ natri/kali máu và té ngã; ưu tiên nâng nhẹ liều DHP-CCB và đo lại HA tư thế đứng.',
            gates: [],
            citationIds: ['esc.htn.2024.bp_target_frailty', 'esc.htn.2024.oh_switch_rec24'],
            priority: 75
          };
        }
      }

      // Nhánh chuẩn nhất: Đã có RASi + CCB, thiếu Lợi tiểu
      if (core.hasRasi && core.hasCcb && !core.hasDiuretic) {
        const egfrLoop = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
        if (egfr === undefined && crcl === undefined) {
          return missingInputRec(
            'htn',
            'scr',
            `xác định eGFR/CrCl trước khi chọn lợi tiểu Bước 2 (Indapamide khi eGFR ≥ ${egfrLoop} vs Furosemide khi eGFR < ${egfrLoop})`,
            ['esc.htn.2024.triple_combination', 'esc.htn.2024.ckd_loop_diuretic', 'ema.indapamide.renal_contra']
          );
        }

        // Bệnh Gút: KHÔNG khởi trị mù lợi tiểu Thiazide/Indapamide -> tối ưu liều Amlodipine & ưu tiên nền Losartan
        if (hasCondition(ctx, 'gout')) {
          const activeAmlo = findCurrentMed(ctx, ['amlodipine']);
          const amloMax = th('htn.amlodipine.dose_max');
          const curAmloDose = parseMedDoseMg(activeAmlo);
          if (activeAmlo && (curAmloDose === undefined || curAmloDose < amloMax)) {
            return {
              id: 'rec_htn_step2_gout_uptitrate_ccb',
              module: 'htn',
              tier: 'Bước 2: Tối ưu Không Dùng Thiazide trên Bệnh Gút',
              tierOrder: 3,
              action: 'UPTITRATE',
              drugId: 'amlodipine',
              drugNameVi: drug('amlodipine').nameVi,
              dose: `Tối ưu lên ${amloMax} mg uống 1 lần/ngày (kết hợp ưu tiên Losartan trong nhóm RASi)`,
              title: `Kèm bệnh Gút: Tối ưu liều ${drug('amlodipine').nameVi} (tránh thêm lợi tiểu Thiazide/Indapamide gây cơn Gút cấp)`,
              rationale:
                'Lợi tiểu Thiazide và Thiazide-like làm tăng tái hấp thu urat ở ống lượn gần, kích phát cơn Gút cấp (ESC 2024 / VSH 2022 Bảng 11). Ưu tiên tối ưu hóa liều DHP-CCB (Amlodipine tối đa 10 mg) và chuyển/duy trì Losartan (có tác dụng thải acid uric) thay vì thêm Indapamide.',
              gates: [],
              citationIds: ['esc.htn.2024.gout_thiazide_caution', 'vsh.htn.2022.contraindications_table11'],
              priority: 75
            };
          }
          return {
            id: 'rec_htn_step2_gout_avoid_indapamide',
            module: 'htn',
            tier: 'Bước 2: Tránh Thiazide trên Bệnh Gút',
            tierOrder: 3,
            action: 'AVOID',
            drugId: 'indapamide',
            drugNameVi: drug('indapamide').nameVi,
            title: `Tránh khởi trị ${drug('indapamide').nameVi} trên bệnh nhân có tiền sử Gút — Cân nhắc Spironolactone/Chẹn beta nếu cần thuốc thứ 3`,
            rationale:
              'Tránh lợi tiểu nhóm Thiazide/Indapamide ở bệnh nhân Gút chưa kiểm soát acid uric để phòng bùng phát viêm khớp Gút cấp.',
            gates: [],
            citationIds: ['esc.htn.2024.gout_thiazide_caution', 'vsh.htn.2022.contraindications_table11'],
            priority: 74
          };
        }

        const kHypo = thFor('k', 'htn.hypokalemia.k_threshold');
        if (k !== undefined && k < kHypo) {
          return {
            id: 'rec_htn_step2_hypok_avoid_diuretic',
            module: 'htn',
            tier: 'Cảnh báo An toàn Điện giải Bước 2',
            tierOrder: 1,
            action: 'AVOID',
            drugId: 'indapamide',
            drugNameVi: drug('indapamide').nameVi,
            title: `CHỐNG CHỈ ĐỊNH thêm lợi tiểu (${drug('indapamide').nameVi}) khi đang hạ Kali máu (K⁺ = ${k} < ${kHypo} mmol/L)`,
            rationale: `Kali máu hiện tại ${k} mmol/L (< ${kHypo} mmol/L): chống chỉ định khởi trị lợi tiểu Thiazide/Indapamide do nguy cơ xoắn đỉnh và rối loạn nhịp thất; cần bù Kali máu đạt ≥ ${kHypo} mmol/L và tầm soát cường aldosteron nguyên phát trước.`,
            gates: [
              {
                parameter: 'Kali máu (K⁺)',
                passed: false,
                value: k,
                threshold: kHypo,
                messageVi: `K⁺ ${k} < ${kHypo} mmol/L: Chống chỉ định khởi trị Indapamide`
              }
            ],
            citationIds: ['ema.indapamide.contraindications_hepatic', 'ema.indapamide.hypokalemia_qt'],
            priority: 88
          };
        }

        const crclIndap = thFor('crcl', 'htn.indapamide.crcl_contra');
        const egfrClick = thFor('egfr', 'htn.chlorthalidone.egfr_min_click');
        const severeRenal =
          (egfr !== undefined && egfr < egfrLoop) || (egfr === undefined && crcl !== undefined && crcl < crclIndap);

        if (severeRenal) {
          const furoName = drug('furosemide').nameVi;
          const furoStart = th('htn.furosemide.dose_start_mg');
          const furoHigh = th('htn.furosemide.dose_high_mg');
          const clickNote =
            egfr !== undefined && egfr >= egfrClick
              ? ` (Ghi chú: Chlorthalidone ${th('htn.chlorthalidone.dose_start')} mg/ngày có bằng chứng thử nghiệm CLICK ở CKD G4 với eGFR ≥ ${egfrClick} mL/phút/1,73 m² nhưng cần theo dõi sát điện giải).`
              : '';
          return {
            id: 'rec_htn_step2_ckd_loop_diuretic',
            module: 'htn',
            tier: `Bước 2: Phối hợp Ba trên Nền CKD Nặng (eGFR < ${egfrLoop})`,
            tierOrder: 3,
            action: 'START',
            drugId: 'furosemide',
            drugNameVi: furoName,
            dose: `${furoStart}–${furoHigh} mg uống 1–2 lần/ngày`,
            title: `CKD G4–G5 (eGFR < ${egfrLoop}): Bổ sung lợi tiểu quai ${furoName} ${furoStart}–${furoHigh} mg (thay cho Indapamide/HCTZ)`,
            rationale: `Huyết áp ${sbp}/${dbp} mmHg chưa đạt đích trên RASi + CCB nhưng chức năng thận giảm nặng (${egfr !== undefined ? `eGFR = ${egfr.toFixed(1)} mL/phút/1,73 m²` : `CrCl = ${crcl?.toFixed(1)} mL/phút`} < ${egfrLoop}): Indapamide chống chỉ định ở suy thận nặng và Hydrochlorothiazide mất hiệu lực thải muối; chuyển sang lợi tiểu quai ${furoName} theo ESC 2024 & KDIGO.${clickNote}`,
            gates: [
              {
                parameter: 'eGFR / CrCl',
                passed: true,
                value: egfr ?? crcl,
                threshold: egfrLoop,
                messageVi: `< ${egfrLoop}: Chuyển sang lợi tiểu quai ${furoName}`
              }
            ],
            citationIds: [
              'esc.htn.2024.ckd_loop_diuretic',
              'esc.htn.2024.ckd_albuminuria_click',
              'ema.indapamide.renal_contra',
              'aha.acc.2025.table13_eplerenone_furosemide'
            ],
            priority: 77
          };
        }

        const indapName = drug('indapamide').nameVi;
        const indapDose = th('htn.indapamide.dose_start');
        return {
          id: 'rec_htn_step2_add_indapamide',
          module: 'htn',
          tier: 'Bước 2: Phối hợp Ba Thuốc (Viên SPC 3 Thành phần)',
          tierOrder: 3,
          action: 'START',
          drugId: 'indapamide',
          drugNameVi: indapName,
          dose: `${indapDose} mg phóng thích kéo dài (SR) uống 1 lần/ngày buổi sáng (ưu tiên viên SPC 3 thành phần như Triplixam)`,
          title: `Nâng bậc Bước 2 (Phối hợp ba): Bổ sung ${indapName} SR ${indapDose} mg/ngày`,
          rationale: `Huyết áp ${sbp}/${dbp} mmHg chưa đạt mục tiêu (< ${cutoffs.sbp}/${cutoffs.dbp} mmHg) trên phối hợp đôi RASi + CCB. Theo ESC 2024 (Class I), AHA/ACC 2025 và VSH 2022, nâng bậc lên phối hợp 3 nhóm nền (RASi + DHP-CCB + lợi tiểu Thiazide-like ${indapName}, ưu tiên gộp 1 viên cố định như Triplixam để tối ưu tuân thủ).`,
          gates: [
            {
              parameter: 'Chức năng thận (eGFR/CrCl)',
              passed: true,
              value: egfr ?? crcl,
              threshold: egfrLoop,
              messageVi: `≥ ${egfrLoop}: Đủ điều kiện dùng lợi tiểu Thiazide-like (${indapName})`
            }
          ],
          citationIds: ['esc.htn.2024.triple_combination', 'ema.indapamide.dosing', 'vsh.htn.2022.table9_dual_spc'],
          priority: 76
        };
      }

      // Đã có RASi + Lợi tiểu nhưng thiếu CCB -> Thêm Amlodipine
      if (core.hasRasi && core.hasDiuretic && !core.hasCcb) {
        const amloStart = needsLenientTarget(ctx) ? th('htn.amlodipine.dose_low') : th('htn.amlodipine.dose_start');
        return {
          id: 'rec_htn_step2_add_amlodipine',
          module: 'htn',
          tier: 'Bước 2: Phối hợp Ba Thuốc (Thêm DHP-CCB)',
          tierOrder: 3,
          action: 'START',
          drugId: 'amlodipine',
          drugNameVi: drug('amlodipine').nameVi,
          dose: `${amloStart} mg uống 1 lần/ngày`,
          title: `Nâng bậc Bước 2: Bổ sung ${drug('amlodipine').nameVi} ${amloStart} mg/ngày để đủ 3 nhóm nền`,
          rationale: `Huyết áp ${sbp}/${dbp} mmHg chưa đạt mục tiêu (< ${cutoffs.sbp}/${cutoffs.dbp} mmHg) trên nền RASi + Lợi tiểu; bổ sung ${drug('amlodipine').nameVi} hoàn thiện phác đồ 3 thuốc chuẩn.`,
          gates: [],
          citationIds: ['esc.htn.2024.triple_combination', 'fda.amlodipine.dosing'],
          priority: 76
        };
      }

      // Đã có CCB + Lợi tiểu nhưng thiếu RASi -> Thêm Perindopril / Losartan nếu an toàn
      if (core.hasCcb && core.hasDiuretic && !core.hasRasi) {
        if (k === undefined) {
          return missingInputRec('htn', 'k', 'kiểm tra Kali máu trước khi thêm RASi ở Bước 2', [
            'esc.htn.2024.triple_combination'
          ]);
        }
        if (egfr === undefined && crcl === undefined) {
          return missingInputRec('htn', 'scr', 'kiểm tra SCr/eGFR trước khi thêm RASi ở Bước 2', [
            'esc.htn.2024.triple_combination'
          ]);
        }
        const kInitMax = thFor('k', 'htn.rasi.k_initiate_max');
        if (k <= kInitMax && !hasBilateralRenalArteryStenosis(ctx) && !hasRasiHighRiskDdi(rawMedIds)) {
          const useArb = hasCondition(ctx, 'priorAngioedema') || hasCondition(ctx, 'gout');
          const targetId = useArb ? 'losartan' : 'perindopril';
          const startDose = useArb ? th('htn.losartan.dose_start_htn') : th('htn.perindopril.dose_start_adult');
          return {
            id: 'rec_htn_step2_add_rasi',
            module: 'htn',
            tier: 'Bước 2: Phối hợp Ba Thuốc (Thêm RASi)',
            tierOrder: 3,
            action: 'START',
            drugId: targetId,
            drugNameVi: drug(targetId).nameVi,
            dose: `${startDose} mg uống 1 lần/ngày`,
            title: `Nâng bậc Bước 2: Bổ sung ${drug(targetId).nameVi} ${startDose} mg/ngày để đủ 3 nhóm nền`,
            rationale: `Huyết áp ${sbp}/${dbp} mmHg chưa đạt đích trên nền CCB + Lợi tiểu; bổ sung ${drug(targetId).nameVi} hoàn thiện phối hợp 3 nhóm nền.`,
            gates: [],
            citationIds: ['esc.htn.2024.triple_combination', 'esc.htn.2024.first_line_classes'],
            priority: 76
          };
        }
      }

      return null;
    },
    citationIds: ['esc.htn.2024.triple_combination', 'esc.htn.2024.ckd_loop_diuretic']
  },

  // -------------------------------------------------------------------------
  // 3A. BƯỚC 3: THA KHÁNG TRỊ — ĐÁNH GIÁ LIỀU TỐI ĐA DUNG NẠP & CỔNG SPIRONOLACTONE
  // -------------------------------------------------------------------------
];
