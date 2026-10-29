/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Chỉ định Bắt buộc Chẹn Beta, HFpEF & Cảnh báo DDI RASi
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  BB_IDS,
  NDHP_CCB_IDS,
  RASI_IDS,
  getEffectiveActiveMedIds,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  hasCustomOrCondFlag,
  isHfrEf,
  isOutpatientCrisisOrUnstable
} from './helpers';

export const PREGNANCY_OTHER_UNSAFE_IDS = ['atenolol', 'lercanidipine', 'felodipine', 'moxonidine', 'doxazosin', 'clonidine'];
const RASI_DDI_WATCH_IDS = [
  'lithium',
  'lithium_carbonate',
  'amiloride',
  'triamterene',
  'potassium_chloride',
  'kcl',
  'potassium'
];

function hasAfibIndication(ctx: RuleContext): boolean {
  return (
    ctx.patient.rhythm === 'afib' ||
    ctx.normalized?.rhythm === 'afib' ||
    hasCondition(ctx, 'af') ||
    hasCustomOrCondFlag(ctx, 'afib')
  );
}

export function hasMethyldopaMoodOrHepaticContra(ctx: RuleContext): boolean {
  return (
    hasCondition(ctx, 'depression') ||
    hasCustomOrCondFlag(ctx, 'depression', 'postpartumDepression', 'activeLiverDisease') ||
    hasCondition(ctx, 'liverDisease')
  );
}

export const htnOutpatientSpecialBbDdiRules: Rule[] = [
  // -------------------------------------------------------------------------
  // 1. CHỈ ĐỊNH BẮT BUỘC CHẸN BETA GIAO CẢM (BỆNH MẠCH VÀNH / RUNG NHĨ / SUY TIM HFrEF)
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.compelling_beta_blocker',
    module: 'htn',
    nameVi: 'Chỉ định bắt buộc Chẹn beta chọn lọc β1 (Bisoprolol) khi kèm Bệnh mạch vành, Rung nhĩ hoặc HFrEF',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant')) return false;
      // Không chặn khi SBP thấp vừa (90–99 mmHg) để luật vẫn phát cảnh báo HOLD an toàn ở ADV_HTN_13; chỉ chặn khi khủng hoảng tăng áp / HMOD cấp
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpCrisis = thFor('sbp', 'htn.emergency.sbp_crisis');
      const dbpCrisis = thFor('dbp', 'htn.emergency.dbp_crisis');
      if (sbp !== undefined && (sbp < sbpHypo || sbp >= sbpCrisis)) return false;
      if (dbp !== undefined && dbp >= dbpCrisis) return false;

      const rawMedIds = getMedIds(ctx);
      if (rawMedIds.some((id) => BB_IDS.includes(id))) return false;

      const lvef = need(ctx, 'lvef');
      const hfCompelling =
        !ctx.patient.selectedModules.includes('hf') &&
        (isHfrEf(ctx) || (hasCondition(ctx, 'hf') && lvef === undefined));

      const hasCadIndication = hasCondition(ctx, 'cad') || hasCustomOrCondFlag(ctx, 'mi', 'angina') || (hasCondition(ctx, 'ascvd') && !hasCondition(ctx, 'pad') && !hasCondition(ctx, 'strokeOrTia'));
      return hasCadIndication || hasAfibIndication(ctx) || hfCompelling;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');
      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'kiểm tra huyết áp an toàn trước khi khởi trị chẹn beta bắt buộc', [
          'esc.htn.2024.beta_blocker_indications'
        ]);
      }
      if (hr === undefined) {
        return missingInputRec('htn', 'hr', 'kiểm tra tần số tim (HR ≥ 60 chu kỳ/phút) trước khi khởi trị Bisoprolol', [
          'esc.htn.2024.beta_blocker_indications',
          'vsh.htn.2022.bb_contraindications_table11'
        ]);
      }

      const bisoName = drug('bisoprolol').nameVi;
      const bisoStart = th('htn.bisoprolol.dose_start_htn');
      const bisoUsual = th('htn.bisoprolol.dose_usual_htn');
      const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');
      const sbpBbMin = thFor('sbp', 'htn.safety.sbp_bb_min');
      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const hasNdhpCcb = effectiveMeds.some((id) => NDHP_CCB_IDS.includes(id));

      if (hasCondition(ctx, 'asthma') || hasAvBlockOrSssWithoutPacer(ctx) || hasNdhpCcb) {
        return {
          id: 'rec_htn_compelling_beta_blocker',
          module: 'htn',
          tier: 'Cảnh báo Chống chỉ định Chẹn Beta',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'bisoprolol',
          drugNameVi: bisoName,
          title: `TRÁNH khởi trị tự động ${bisoName} (do Hen phế quản / Block nhĩ thất độ 2–3 / đang dùng Verapamil-Diltiazem)`,
          rationale:
            'Mặc dù có bệnh đồng mắc tim mạch gợi ý chẹn beta, bệnh nhân hiện có chống chỉ định hoặc tương tác dẫn truyền nguy hiểm (hen phế quản, block nhĩ thất cao độ chưa đặt máy tạo nhịp hoặc đang dùng non-DHP CCB). Cần hội chẩn chuyên khoa tim mạch để chọn giải pháp kiểm soát tần số/chống thiếu máu cục bộ an toàn.',
          gates: [
            {
              parameter: 'Cổng an toàn Chẹn beta',
              passed: false,
              messageVi: 'Hen phế quản / Block AV cao độ / Phối hợp non-DHP CCB'
            }
          ],
          citationIds: ['vsh.htn.2022.bb_contraindications_table11', 'esc.htn.2024.beta_blocker_indications'],
          priority: 86
        };
      }

      if (sbp < sbpBbMin || hr < hrMin) {
        return {
          id: 'rec_htn_compelling_beta_blocker',
          module: 'htn',
          tier: 'Tạm hoãn Chẹn Beta do Huyết động / Nhịp tim Thấp',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'bisoprolol',
          drugNameVi: bisoName,
          title: `TẠM HOÃN khởi trị ${bisoName} (${sbp < sbpBbMin ? `SBP = ${sbp} < ${sbpBbMin} mmHg` : `HR = ${hr} < ${hrMin} chu kỳ/phút`})`,
          rationale: `Chưa khởi trị ${bisoName} lúc này do ${sbp < sbpBbMin ? `huyết áp tâm thu thấp giáp biên (${sbp} < ${sbpBbMin} mmHg)` : `nhịp tim chậm (${hr} < ${hrMin} chu kỳ/phút)`}, tránh làm nặng tụt huyết áp hoặc suy nút xoang/block nhĩ thất. Đánh giá lại sau khi huyết động ổn định.`,
          gates: [
            {
              parameter: sbp < sbpBbMin ? 'SBP' : 'Tần số tim (HR)',
              passed: false,
              value: sbp < sbpBbMin ? sbp : hr,
              threshold: sbp < sbpBbMin ? sbpBbMin : hrMin,
              messageVi:
                sbp < sbpBbMin
                  ? `SBP ${sbp} < ${sbpBbMin} mmHg: Tạm hoãn chẹn beta`
                  : `HR ${hr} < ${hrMin} bpm: Tạm hoãn chẹn beta`
            }
          ],
          citationIds: ['vsh.htn.2022.bb_contraindications_table11', 'esc.htn.2024.beta_blocker_indications'],
          priority: 85
        };
      }

      const indReasons: string[] = [];
      if (hasCondition(ctx, 'cad')) indReasons.push('bệnh mạch vành / ASCVD');
      if (hasAfibIndication(ctx)) indReasons.push('kiểm soát tần số thất trong rung nhĩ');
      if (isHfrEf(ctx) || hasCondition(ctx, 'hf')) indReasons.push('suy tim phân suất tống máu giảm');

      return {
        id: 'rec_htn_compelling_beta_blocker',
        module: 'htn',
        tier: 'Chỉ định Bắt buộc theo Bệnh đồng mắc Tim mạch',
        tierOrder: 2,
        action: 'START',
        drugId: 'bisoprolol',
        drugNameVi: bisoName,
        dose: `${bisoStart}–${bisoUsual} mg uống 1 lần/ngày buổi sáng (tối đa ${th('htn.bisoprolol.dose_max_htn')} mg/ngày)`,
        title: `Chỉ định bắt buộc Chẹn beta chọn lọc β1: Phối hợp ${bisoName} ${bisoStart}–${bisoUsual} mg/ngày (${indReasons.join(', ')})`,
        rationale: `Theo ESC 2024 (Class I), AHA/ACC 2025 và VSH 2022, chẹn beta giao cảm được phối hợp ở bất kỳ bậc điều trị nào khi có chỉ định bắt buộc (${indReasons.join(', ')}). Huyết áp hiện tại ${sbp} mmHg (≥ ${sbpBbMin} mmHg) và tần số tim ${hr} chu kỳ/phút (≥ ${hrMin} chu kỳ/phút) đều an toàn để khởi trị ${bisoName}.`,
        gates: [
          {
            parameter: 'Tần số tim (HR)',
            passed: true,
            value: hr,
            threshold: hrMin,
            messageVi: `HR ${hr} ≥ ${hrMin} bpm (Đạt)`
          },
          {
            parameter: 'SBP tối thiểu cho Chẹn beta',
            passed: true,
            value: sbp,
            threshold: sbpBbMin,
            messageVi: `SBP ${sbp} ≥ ${sbpBbMin} mmHg (Đạt)`
          }
        ],
        citationIds: [
          'esc.htn.2024.beta_blocker_indications',
          'aha.acc.2025.table13_bisoprolol_labetalol',
          'vsh.htn.2022.drugs_table_mra_bb'
        ],
        priority: 80
      };
    },
    citationIds: ['esc.htn.2024.beta_blocker_indications', 'aha.acc.2025.table13_bisoprolol_labetalol']
  },

  // -------------------------------------------------------------------------
  // 1B. SUY TIM HFpEF ĐƠN THUẦN: KHÔNG CHỈ ĐỊNH THƯỜNG QUY CHẸN BETA CHỈ ĐỂ HẠ ÁP
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.hfpef_no_routine_bb_note',
    module: 'htn',
    nameVi: 'Suy tim HFpEF không kèm CAD/Rung nhĩ: Không khuyến cáo dùng chẹn beta thường quy chỉ để hạ áp',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      if (!hasCondition(ctx, 'hf')) return false;
      const lvef = need(ctx, 'lvef');
      const lvefMax = thFor('lvef', 'htn.hfref.lvef_max');
      if (lvef === undefined || lvef <= lvefMax) return false;
      return !hasCondition(ctx, 'cad') && !hasAfibIndication(ctx);
    },
    produce: (ctx: RuleContext): Recommendation => {
      const lvef = need(ctx, 'lvef')!;
      return {
        id: 'rec_htn_hfpef_no_routine_bb',
        module: 'htn',
        tier: 'Lưu ý Cá thể hóa Suy tim HFmrEF / HFpEF',
        tierOrder: 4,
        action: 'CONSIDER',
        title: `Suy tim LVEF ${lvef}% không kèm CAD/Rung nhĩ: Không ưu tiên chẹn beta thường quy chỉ để hạ huyết áp`,
        rationale:
          'Theo AHA/ACC 2025, ở bệnh nhân tăng huyết áp kèm suy tim phân suất tống máu bảo tồn (HFpEF) không có nhồi máu cơ tim cũ, đau thắt ngực hay rung nhĩ, chẹn beta không phải thuốc hạ áp đầu tay thường quy (do có thể gây suy giảm đáp ứng tần số tim khi gắng sức); ưu tiên SGLT2i, lợi tiểu khi sung huyết, MRA và RASi/CCB.',
        gates: [],
        citationIds: ['aha.acc.2025.hfpef_no_routine_bb'],
        priority: 52
      };
    },
    citationIds: ['aha.acc.2025.hfpef_no_routine_bb']
  },

  // -------------------------------------------------------------------------
  // 2. CẢNH BÁO TƯƠNG TÁC NẶNG: ĐANG DÙNG RASI KÈM LITHIUM HOẶC THUỐC GIỮ/BÙ KALI
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.rasi_lithium_k_sparing_warning',
    module: 'htn',
    nameVi: 'Cảnh báo tương tác nghiêm trọng: Đang dùng RASi/ARNI kèm Lithium hoặc Amiloride/Triamterene/Muối Kali',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const medIds = getMedIds(ctx);
      return medIds.some((id) => RASI_IDS.includes(id)) && medIds.some((id) => RASI_DDI_WATCH_IDS.includes(id));
    },
    produce: (ctx: RuleContext): Recommendation => {
      const medIds = getMedIds(ctx);
      const culprits = medIds.filter((id) => RASI_DDI_WATCH_IDS.includes(id));
      const hasLithium = culprits.some((id) => id.startsWith('lithium'));
      return {
        id: 'rec_htn_rasi_lithium_hyperk_monitor',
        module: 'htn',
        tier: 'Cảnh báo Tương tác Thuốc Nguy cơ Cao',
        tierOrder: 0,
        action: 'MONITOR',
        title: `CẢNH BÁO TƯƠNG TÁC NẶNG trên nền RASi (${culprits.join(', ')}): Nguy cơ ${hasLithium ? 'ngộ độc Lithium cấp & ' : ''}tăng Kali máu đe dọa tính mạng`,
        rationale: `Bệnh nhân đang dùng đồng thời thuốc ức chế hệ RAS với (${culprits.join(', ')}). ${hasLithium ? 'ACEi/ARB và lợi tiểu làm giảm mạnh thanh thải Lithium tại ống thận gây ngộ độc Lithium thần kinh-tim mạch; cần tránh phối hợp hoặc định lượng nồng độ Lithium huyết thanh dày đặc. ' : ''}Phối hợp RASi với lợi tiểu giữ Kali (Amiloride/Triamterene) và/hoặc viên bù Kali đường uống làm tăng vọt nguy cơ tăng Kali máu ngừng tim — cần ngưng bù Kali không cần thiết và xét nghiệm K⁺ + Creatinin khẩn.`,
        gates: [
          {
            parameter: 'Tương tác RASi + Lithium / Giữ-Bù Kali',
            passed: false,
            messageVi: `Đang phối hợp ${culprits.join(', ')}: Cần rà soát ngưng thuốc tương tác & xét nghiệm K⁺/Lithium`
          }
        ],
        citationIds: ['ema.perindopril.htn_dosing', 'aha.acc.2025.monitoring_bmp_2_4wk'],
        priority: 93
      };
    },
    citationIds: ['ema.perindopril.htn_dosing', 'aha.acc.2025.monitoring_bmp_2_4wk']
  },

  // -------------------------------------------------------------------------
  // 3. THAI KỲ & HẬU SẢN TOÀN DIỆN (STOP ĐỘC THAI, METHYLDOPA/LABETALOL/NIFEDIPINE LA, ASPIRIN)
  // -------------------------------------------------------------------------
];
