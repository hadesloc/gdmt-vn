/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Tiền kiểm Điện giải / HFrEF & Khởi trị Chưa có Thuốc Nền
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  DIURETIC_IDS,
  MRA_IDS,
  RASI_IDS,
  getEffectiveActiveMedIds,
  getMedIds,
  hasBilateralRenalArteryStenosis,
  isOutpatientCrisisOrUnstable
} from './helpers';
import {
  hasRasiHighRiskDdi,
  resolveStep1ZeroMedMode,
  shouldDeferToHfrEfPillars
} from './rules.outpatient.step_helpers';

export function produceStep1ZeroMed(ctx: RuleContext): Recommendation | null {
  const rawMedIds = getMedIds(ctx);
  const sbp = need(ctx, 'sbp');
  const dbp = need(ctx, 'dbp');
  const k = need(ctx, 'k');
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');

  const amloName = drug('amlodipine').nameVi;
  const amloLow = th('htn.amlodipine.dose_low');
  const amloStart = th('htn.amlodipine.dose_start');
  const perinName = drug('perindopril').nameVi;
  const losartanName = drug('losartan').nameVi;
  const kInitMax = thFor('k', 'htn.rasi.k_initiate_max');

        const mode = resolveStep1ZeroMedMode(ctx);
        if (mode === 'none') return null;
        if (mode === 'missing_sbp') {
          return missingInputRec('htn', 'sbp', 'xác định phân độ và chỉ định khởi trị thuốc hạ áp Bước 1', [
            'esc.htn.2024.initial_combination'
          ]);
        }
        if (mode === 'missing_dbp') {
          return missingInputRec('htn', 'dbp', 'xác định phân độ và chỉ định khởi trị thuốc hạ áp Bước 1', [
            'esc.htn.2024.initial_combination'
          ]);
        }
        if (mode === 'missing_age') {
          return missingInputRec(
            'htn',
            'age',
            'xác định ngưỡng khởi trị theo tuổi (đặc biệt mốc ≥ 80 tuổi / ≥ 85 tuổi) và tính eGFR an toàn trước khi kê đơn',
            ['vsh.htn.2022.monotherapy_elderly', 'esc.htn.2024.bp_target_lenient']
          );
        }

        if (mode === 'vn_elderly_defer') {
          const sbpVn80 = thFor('sbp', 'htn.elderly.vn_sbp_80plus');
          const dbpHtn = thFor('dbp', 'htn.bp.dbp_hypertension');
          return {
            id: 'rec_htn_step1_vn_elderly80_defer',
            module: 'htn',
            tier: 'Bước 1: Cá thể hóa Người cao tuổi ≥ 80 tuổi (VSH 2022)',
            tierOrder: 3,
            action: 'CONSIDER',
            title: `Người cao tuổi ≥ ${thFor('age', 'htn.age.elderly_monotherapy')} tuổi có HA < ${sbpVn80}/${dbpHtn} mmHg: Theo dõi & Điều chỉnh lối sống (chưa khởi trị thuốc ngay)`,
            rationale: `Theo Khuyến cáo VSH/VNHA 2022 (Bảng 9), ở người bệnh ≥ ${thFor('age', 'htn.age.elderly_monotherapy')} tuổi chưa điều trị, ngưỡng huyết áp phòng khám bắt đầu khởi trị thuốc hạ áp là ≥ ${sbpVn80}/${dbpHtn} mmHg. Hiện tại HA ${sbp}/${dbp} mmHg chưa vượt ngưỡng này; ưu tiên thay đổi lối sống, đo HA tư thế đứng và theo dõi sát ngoại trú.`,
            gates: [],
            citationIds: ['vsh.htn.2022.monotherapy_elderly', 'vsh.htn.2022.table9_dual_spc'],
            priority: 65
          };
        }

        if (mode === 'us_stage1_lowrisk_consider') {
          const preventHigh = th('htn.risk.prevent_high_us');
          const sbpStage1 = thFor('sbp', 'htn.bp.sbp_stage1_us');
          const dbpStage1 = thFor('dbp', 'htn.bp.dbp_stage1_us');
          return {
            id: 'rec_htn_step1_us_stage1_lowrisk_lifestyle',
            module: 'htn',
            tier: 'Bước 1: THA Giai đoạn 1 Nguy cơ thấp (AHA/ACC 2025)',
            tierOrder: 3,
            action: 'CONSIDER',
            title: `THA Giai đoạn 1 nguy cơ thấp (PREVENT < ${preventHigh}%): Can thiệp lối sống tích cực 3–6 tháng trước khi dùng thuốc`,
            rationale: `Theo AHA/ACC 2025, người trưởng thành THA Giai đoạn 1 (${sbp}/${dbp} mmHg) không có ASCVD, ĐTĐ, CKD và điểm PREVENT 10 năm < ${preventHigh}% được ưu tiên thay đổi lối sống tích cực trong 3–6 tháng; nếu sau 3–6 tháng huyết áp vẫn ≥ ${sbpStage1}/${dbpStage1} mmHg thì khởi trị đơn trị liệu hạ áp (COR 1, LOE B-R).`,
            gates: [],
            citationIds: ['aha.acc.2025.stage1_prevent_low_risk', 'aha.acc.2025.stage1_mono_rec2'],
            priority: 66
          };
        }

        if (mode === 'elderly_mono') {
          return {
            id: 'rec_htn_step1_elderly_monotherapy',
            module: 'htn',
            tier: 'Bước 1: Đơn trị liệu Liều thấp An toàn',
            tierOrder: 3,
            action: 'START',
            drugId: 'amlodipine',
            drugNameVi: amloName,
            dose: `${amloLow} mg uống 1 lần/ngày (tăng dần lên ${amloStart} mg nếu dung nạp tốt)`,
            title: `Khởi trị đơn trị liệu liều thấp: ${amloName} ${amloLow} mg/ngày (cá thể hóa tuổi cao / suy yếu / hạ HA tư thế)`,
            rationale: `Bệnh nhân cao tuổi / suy yếu lâm sàng hoặc có hạ huyết áp tư thế đứng (HA ${sbp}/${dbp} mmHg): khởi đầu bằng đơn trị liệu DHP-CCB liều thấp (${amloName} ${amloLow} mg/ngày) thay vì phối hợp đôi ngay để phòng ngừa té ngã, choáng váng và tụt huyết áp tư thế đứng.`,
            gates: [
              {
                parameter: 'An toàn lão khoa / tư thế đứng',
                passed: true,
                messageVi: 'Ưu tiên đơn trị liều thấp tăng bậc chậm'
              }
            ],
            citationIds: [
              'esc.htn.2024.bp_target_lenient',
              'esc.htn.2024.bp_target_frailty',
              'vsh.htn.2022.monotherapy_elderly',
              'fda.amlodipine.dosing'
            ],
            priority: 75
          };
        }

        if (mode === 'intl_elevated_mono' || mode === 'us_stage1_mono' || mode === 'vn_highnormal_mono') {
          const recId =
            mode === 'intl_elevated_mono'
              ? 'rec_htn_step1_elevated_monotherapy'
              : mode === 'us_stage1_mono'
                ? 'rec_htn_step1_us_stage1_monotherapy'
                : 'rec_htn_step1_vn_highnormal_monotherapy';
          const citations =
            mode === 'intl_elevated_mono'
              ? ['esc.htn.2024.elevated_high_risk', 'esc.htn.2024.table14_elevated_score2']
              : mode === 'us_stage1_mono'
                ? ['aha.acc.2025.stage1_prevent_75', 'aha.acc.2025.stage1_mono_rec2']
                : ['vsh.htn.2022.table9_dual_spc', 'vsh.htn.2022.targets_age_dbp80'];

          return {
            id: recId,
            module: 'htn',
            tier: 'Bước 1: Khởi trị Đơn trị liệu trên Nhóm Nguy cơ Cao',
            tierOrder: 3,
            action: 'START',
            drugId: 'amlodipine',
            drugNameVi: amloName,
            dose: `${amloStart} mg uống 1 lần/ngày`,
            title: `Khởi trị thuốc sớm (kết hợp lối sống): ${amloName} ${amloStart} mg/ngày trên nền nguy cơ tim mạch cao`,
            rationale: `Huyết áp ${sbp}/${dbp} mmHg kèm bệnh đồng mắc tim-thận-chuyển hóa hoặc nguy cơ tim mạch 10 năm tăng cao: chỉ định khởi trị đơn trị liệu hạ áp (${amloName} ${amloStart} mg/ngày; nếu có bệnh thận mạn kèm albumin niệu ưu tiên phối hợp/chuyển nền RASi khi đủ K⁺ và eGFR).`,
            gates: [],
            citationIds: citations,
            priority: 74
          };
        }

        // mode === 'dual_spc': Bắt buộc kiểm tra K+ và chức năng thận (eGFR/CrCl) trước khi kê phối hợp đôi có RASi!
        if (k === undefined) {
          return missingInputRec(
            'htn',
            'k',
            'kiểm tra an toàn Kali máu trước khi khởi trị viên phối hợp đôi cố định (RASi + CCB) Bước 1',
            ['esc.htn.2024.initial_combination', 'aha.acc.2025.table18_k50']
          );
        }
        if (egfr === undefined && crcl === undefined) {
          return missingInputRec(
            'htn',
            'scr',
            'đánh giá chức năng thận nền (SCr / eGFR) trước khi khởi trị viên phối hợp đôi (RASi + CCB) Bước 1',
            ['esc.htn.2024.initial_combination', 'aha.acc.2025.monitoring_bmp_2_4wk']
          );
        }

        const rasiBlocked = k > kInitMax || hasBilateralRenalArteryStenosis(ctx) || hasRasiHighRiskDdi(rawMedIds);
        const preferArb = hasCondition(ctx, 'priorAngioedema') || hasCondition(ctx, 'gout');
        const partnerLabel = preferArb ? losartanName : perinName;
        const spcHint = preferArb ? 'Exforge / Twynsta (ARB + Amlodipine)' : 'Coveram (Perindopril + Amlodipine)';

        return {
          id: 'rec_htn_step1_dual_spc',
          module: 'htn',
          tier: 'Bước 1: Phối hợp Đôi Liều Cố định (SPC)',
          tierOrder: 3,
          action: 'START',
          drugId: 'amlodipine',
          drugNameVi: amloName,
          dose: `${amloStart} mg uống 1 lần/ngày${rasiBlocked ? ' (đơn trị nền DHP-CCB do chống chỉ định/tương tác RASi)' : ` (ưu tiên viên phối hợp cố định SPC cùng ${partnerLabel}, vd: ${spcHint})`}`,
          title: rasiBlocked
            ? `Khởi trị Bước 1: ${amloName} ${amloStart} mg/ngày (tránh phối hợp RASi do rào cản an toàn K⁺ / hẹp ĐM thận / tương tác thuốc)`
            : `Khởi trị Bước 1 (Viên phối hợp đôi SPC): ${amloName} + ${partnerLabel} liều khởi đầu`,
          rationale: rasiBlocked
            ? `Huyết áp ${sbp}/${dbp} mmHg cần khởi trị thuốc ngay nhưng hiện có rào cản an toàn với nhóm ức chế hệ RAS (K⁺ > ${kInitMax} mmol/L, hẹp ĐM thận hai bên hoặc đang dùng Lithium / lợi tiểu giữ kali + muối kali); do đó khởi trị an toàn bằng ${amloName} ${amloStart} mg/ngày.`
            : `Huyết áp ${sbp}/${dbp} mmHg: cả ESC 2024 (Class I), AHA/ACC 2025 (COR 1 cho Giai đoạn 2 ≥ ${thFor('sbp', 'htn.bp.sbp_hypertension')}/${thFor('dbp', 'htn.bp.dbp_hypertension')} mmHg) và VSH/VNHA 2022 (Bảng 9) đều khuyến cáo khởi trị sớm bằng viên phối hợp đôi liều cố định (RASi + DHP-CCB, vd: ${spcHint}) để kiểm soát huyết áp nhanh, giảm tác dụng phụ phù mắt cá chân và tăng tuân thủ điều trị.`,
          gates: [
            {
              parameter: 'Chiến lược khởi trị Bước 1',
              passed: true,
              messageVi: rasiBlocked ? 'Đơn trị DHP-CCB do rào cản RASi' : `Phối hợp đôi SPC (${spcHint})`
            }
          ],
          citationIds: [
            'esc.htn.2024.initial_combination',
            'esc.htn.2024.first_line_classes',
            'aha.acc.2025.stage2_spc_rec1',
            'vsh.htn.2022.table9_dual_spc'
          ],
          profileDiff: {
            INTL: 'ESC 2024: Khởi trị phối hợp đôi liều thấp cố định (SPC) cho hầu hết bệnh nhân ≥ 140/90 mmHg (Class I)',
            US: 'AHA/ACC 2025: Bắt buộc ưu tiên SPC 2 thuốc đầu tay khi HA ≥ 140/90 mmHg (Giai đoạn 2, COR 1)',
            VN: 'VSH/VNHA 2022 (Bảng 9): Khởi trị viên phối hợp đôi liều thấp ngay từ Độ 1 (≥ 140/90 mmHg) ở người < 80 tuổi không suy yếu'
          },
          priority: 76
        };
}

export const htnOutpatientPreStep1Rules: Rule[] = [
  // -------------------------------------------------------------------------
  // 0A. FAIL-CLOSED: NHẮC NHẬP KALI MÁU KHI ĐANG DÙNG RASI / LỢI TIỂU / MRA
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.missing_k_on_electrolyte_active_meds',
    module: 'htn',
    nameVi: 'Fail-closed: Nhắc bổ sung xét nghiệm Kali máu khi đang dùng RASi / Lợi tiểu / MRA',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant')) return false;
      const k = need(ctx, 'k');
      if (k !== undefined) return false;
      const rawMedIds = getMedIds(ctx);
      return rawMedIds.some((id) => RASI_IDS.includes(id) || MRA_IDS.includes(id) || DIURETIC_IDS.includes(id));
    },
    produce: (): Recommendation =>
      missingInputRec(
        'htn',
        'k',
        'rà soát an toàn điện giải (tăng/hạ Kali máu) và đánh giá chỉ định nâng bậc trên nền RASi / Lợi tiểu / MRA',
        ['aha.acc.2025.monitoring_bmp_2_4wk', 'esc.htn.2024.spiro_gates_egfr30_k45']
      ),
    citationIds: ['aha.acc.2025.monitoring_bmp_2_4wk', 'esc.htn.2024.spiro_gates_egfr30_k45']
  },

  // -------------------------------------------------------------------------
  // 0B. SUY TIM PHÂN SUẤT TỐNG MÁU GIẢM (HFrEF): ƯU TIÊN 4 TRỤ CỘT GDMT TRƯỚC CCB
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.hfref_defer_to_gdmt_pillars',
    module: 'htn',
    nameVi: 'Tăng huyết áp kèm suy tim HFrEF: Ưu tiên tối ưu 4 trụ cột GDMT suy tim trước khi thêm DHP-CCB',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      return shouldDeferToHfrEfPillars(ctx, effectiveMeds);
    },
    produce: (ctx: RuleContext): Recommendation => {
      const lvef = need(ctx, 'lvef');
      const lvefMax = thFor('lvef', 'htn.hfref.lvef_max');
      return {
        id: 'rec_htn_hfref_prioritize_gdmt',
        module: 'htn',
        tier: 'Tối ưu Nền Suy tim HFrEF',
        tierOrder: 1,
        action: 'CONSIDER',
        title: `Suy tim HFrEF (LVEF ${lvef !== undefined ? `${lvef}%` : `≤ ${lvefMax}%`}): Ưu tiên 4 trụ cột GDMT (ARNI/ACEi/ARB + Chẹn beta + MRA + SGLT2i) trước DHP-CCB`,
        rationale:
          'Theo VSH 2022, ESC 2024 và AHA/ACC 2025, ở bệnh nhân tăng huyết áp kèm suy tim phân suất tống máu giảm (HFrEF), kiểm soát huyết áp cần đạt được trước hết bằng cách khởi trị và tối ưu hóa 4 trụ cột giảm tử vong (ARNI/ACEi/ARB, chẹn beta giao cảm chứng minh lợi ích, MRA và SGLT2i). Chỉ phối hợp thêm Amlodipine/Felodipine khi huyết áp vẫn chưa đạt đích dù đã tối ưu phác đồ HFrEF; tuyệt đối chống chỉ định Diltiazem/Verapamil và Moxonidine.',
        gates: [],
        citationIds: ['vsh.htn.2022.lvef_40', 'esc.htn.2024.beta_blocker_indications', 'esc.hf.2026.moxonidine_contra'],
        priority: 78
      };
    },
    citationIds: ['vsh.htn.2022.lvef_40', 'esc.htn.2024.beta_blocker_indications']
  },

  // -------------------------------------------------------------------------
  // 1A. BƯỚC 1: KHỞI TRỊ VIÊN PHỐI HỢP ĐÔI SPC (NỀN DHP-CCB) / ĐƠN TRỊ LIỆU
  // -------------------------------------------------------------------------
];
