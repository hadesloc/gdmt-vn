/**
 * Quy tắc An toàn Chống đông Quanh Chuyển nhịp (mốc < 24 giờ ESC 2024) & Quản lý Chống đông Chu phẫu [A/R]
 * Bao phủ: Chuyển nhịp cả nội viện và ngoại trú chủ động (trừ rung nhĩ vĩnh viễn), tôn trọng `alreadyAnticoagulated3WeeksOrTee`,
 * Bắt buộc TEE trước chuyển nhịp ở Amyloidosis tim, Tùy chọn chống đông 4 tuần khi < 24h & CHA₂DS₂-VA = 0,
 * Ngưng Warfarin (5 ngày) vs Acenocoumarol (3 ngày) chu phẫu + bắc cầu chọn lọc nguy cơ rất cao,
 * và Ngưng DOAC chu phẫu (Dabigatran 4 ngày khi CrCl 30–50; ức chế Xa 3 ngày [72h] khi CrCl < 30 ở mổ nguy cơ chảy máu cao).
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  DOAC_IDS,
  type DoacDrugId,
  VKA_IDS,
  computeAfStrokeScore,
  findCurrentMed,
  hasActiveMajorBleed,
  hasCardiacAmyloidosis,
  hasCurrentMed,
  isAfActive,
  isUnstableHemodynamics
} from './rulesHelpers';
import { resolveAfDoacDose } from './rulesDoacLogic';

const TIER_CV = 'AF-CARE · [A/R] An toàn Chuyển nhịp';
const TIER_PERIOP = 'AF-CARE · [A] Chống đông Chu phẫu';

export const afPeriproceduralRules: Rule[] = [
  // 1. An toàn chống đông quanh chuyển nhịp (setting: 'both', loại trừ permanent AF!)
  {
    id: 'af.periprocedural.cardioversion_oac_timing',
    module: 'af',
    nameVi: 'AF-CARE [A/R]: An toàn chống đông quanh chuyển nhịp (Cập nhật mốc < 24 giờ theo ESC 2024)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasActiveMajorBleed(ctx) || isUnstableHemodynamics(ctx)) return false;
      if (ctx.patient.customInputs?.afType === 'permanent') return false;
      return Boolean(ctx.patient.customInputs?.afOnset);
    },
    produce: (ctx): Recommendation => {
      const onset = ctx.patient.customInputs?.afOnset;
      const ready3wOrTee = ctx.patient.customInputs?.alreadyAnticoagulated3WeeksOrTee === true;
      const isAmyloid = hasCardiacAmyloidosis(ctx);
      const earlyHours = thFor('duration_hours', 'af.cardioversion.onset_hours_early');
      const waitHours = thFor('duration_hours', 'af.cardioversion.wait_and_see_hours');
      const priorWeeks = thFor('interval_weeks', 'af.cardioversion.anticoag_weeks_prior');
      const postWeeks = thFor('interval_weeks', 'af.cardioversion.anticoag_weeks_post');

      const age = need(ctx, 'age');
      const isZeroStrokeRisk =
        age !== undefined &&
        ctx.normalized.sex !== undefined &&
        !isAmyloid &&
        !hasCondition(ctx, 'mechanicalValve') &&
        !hasCondition(ctx, 'mitralStenosis') &&
        computeAfStrokeScore(ctx, age).scoreVa === 0;

      // Đặc thù Cardiac Amyloidosis: Nguy cơ huyết khối tiểu nhĩ trái rất cao ngay cả khi đã uống OAC đủ 3 tuần -> Bắt buộc TEE trước chuyển nhịp chủ động!
      if (isAmyloid) {
        return {
          id: 'rec_af_cv_amyloid_mandatory_tee',
          module: 'af',
          tier: TIER_CV,
          tierOrder: 2,
          action: 'HOLD',
          dose: undefined,
          title: 'Bệnh cơ tim Amyloidosis: Bắt buộc Siêu âm tim qua thực quản (TEE) loại trừ huyết khối tiểu nhĩ trái trước mọi chuyển nhịp chủ động',
          rationale:
            'ESC HF 2026 & ESC AF 2024: Tỷ lệ huyết khối buồng nhĩ ở bệnh nhân Amyloidosis tim rất cao kể cả khi đã dùng chống đông đủ ≥ 3 tuần hoặc khởi phát ngắn; bắt buộc thực hiện TEE trước chuyển nhịp chủ động.',
          gates: [{ parameter: 'Cardiac Amyloidosis', passed: false, action: 'hold', messageVi: 'Bắt buộc TEE trước chuyển nhịp' }],
          citationIds: ['esc.af.2024.cardioversion_anticoag_3weeks', 'esc.af.2024.hcm_amyloidosis_oac'],
          priority: 98
        };
      }

      if (onset === 'lt_24h' || onset === 'less_than_24h') {
        const postNote = isZeroStrokeRisk
          ? `Sau chuyển nhịp: Với khởi phát chắc chắn < ${earlyHours} giờ và CHA₂DS₂-VA = 0, việc dùng chống đông ${postWeeks} tuần là tùy chọn (Class IIb, Mức C).`
          : `Sau chuyển nhịp: Bắt buộc duy trì chống đông tối thiểu ${postWeeks} tuần (và lâu dài nếu có nguy cơ đột quỵ).`;
        return {
          id: 'rec_af_cv_timing_lt24h',
          module: 'af',
          tier: TIER_CV,
          tierOrder: 2,
          action: 'CONSIDER',
          dose: undefined,
          title: `Rung nhĩ khởi phát rõ dưới ${earlyHours} giờ: Có thể chuyển nhịp sớm kèm chống đông hoặc theo dõi tự về nhịp xoang trong ${waitHours} giờ`,
          rationale: `ESC 2024 (Rec Table 15 & 16): Khởi trị chống đông ngay (DOAC hoặc LMWH/UFH) nếu chưa dùng; có thể chuyển nhịp sớm hoặc áp dụng chiến lược theo dõi chờ chuyển nhịp tự phát (wait-and-see) trong vòng ${waitHours} giờ (Class IIa). ${postNote}`,
          gates: [{ parameter: 'Thời gian khởi phát', passed: true, value: `< ${earlyHours} giờ`, threshold: `${earlyHours} giờ`, messageVi: 'Đủ điều kiện chuyển nhịp sớm' }],
          citationIds: [
            'esc.af.2024.cardioversion_timing_24h',
            'esc.af.2024.cardioversion_wait_and_see_48h',
            'esc.af.2024.cardioversion_low_risk_post_oac_optional'
          ],
          priority: 86
        };
      }

      if (ready3wOrTee) {
        return {
          id: 'rec_af_cv_ready_anticoagulated',
          module: 'af',
          tier: TIER_CV,
          tierOrder: 2,
          action: 'CONSIDER',
          dose: undefined,
          title: `Đã đủ ≥ ${priorWeeks} tuần chống đông hiệu quả hoặc TEE âm tính huyết khối: Đủ điều kiện an toàn thực hiện chuyển nhịp chủ động`,
          rationale: `ESC 2024 (Rec Table 15): Sau khi chuyển nhịp thành công, bắt buộc tiếp tục thuốc chống đông đường uống ít nhất ${postWeeks} tuần ở mọi bệnh nhân (và duy trì lâu dài nếu CHA₂DS₂-VA ≥ 1) để phòng huyết khối do choáng váng tiểu nhĩ.`,
          gates: [{ parameter: 'An toàn trước chuyển nhịp', passed: true, messageVi: `Đã chống đông ≥ ${priorWeeks} tuần hoặc TEE âm tính` }],
          citationIds: ['esc.af.2024.cardioversion_anticoag_3weeks', 'esc.af.2024.cardioversion_post_oac_4weeks'],
          priority: 86
        };
      }

      return {
        id: 'rec_af_cv_timing_delayed',
        module: 'af',
        tier: TIER_CV,
        tierOrder: 2,
        action: 'HOLD',
        dose: undefined,
        title: `TRÌ HOÃN CHUYỂN NHỊP CHỦ ĐỘNG (Rung nhĩ từ ${earlyHours} giờ trở lên hoặc không rõ khởi phát): Bắt buộc chống đông đủ ${priorWeeks} tuần hoặc Siêu âm thực quản (TEE)`,
        rationale: `Khuyến cáo Class I & Class III (ESC 2024 Rec Table 15): Tuyệt đối KHÔNG chuyển nhịp sớm khi rung nhĩ ≥ ${earlyHours} giờ (bao gồm cả mốc 24–48 giờ trước đây!) nếu chưa dùng chống đông hiệu quả tối thiểu ${priorWeeks} tuần hoặc chưa làm TEE loại trừ huyết khối tiểu nhĩ trái. Sau chuyển nhịp bắt buộc duy trì chống đông tối thiểu ${postWeeks} tuần.`,
        gates: [{ parameter: 'Thời gian khởi phát', passed: false, action: 'hold', value: `≥ ${earlyHours} giờ / Không rõ`, threshold: `${earlyHours} giờ`, messageVi: `Bắt buộc ≥ ${priorWeeks} tuần OAC hoặc TEE` }],
        citationIds: [
          'esc.af.2024.cardioversion_timing_24h',
          'esc.af.2024.cardioversion_anticoag_3weeks',
          'esc.af.2024.cardioversion_toe_exclusion',
          'esc.af.2024.cardioversion_post_oac_4weeks'
        ],
        priority: 98
      };
    },
    citationIds: ['esc.af.2024.cardioversion_timing_24h', 'esc.af.2024.cardioversion_anticoag_3weeks', 'esc.af.2024.cardioversion_post_oac_4weeks']
  },

  // 2. Quản lý chu phẫu cho bệnh nhân đang dùng kháng Vitamin K (Warfarin 5 ngày vs Acenocoumarol 3 ngày — giữ af_43)
  {
    id: 'af.periprocedural.vka_management',
    module: 'af',
    nameVi: 'AF-CARE [A]: Quản lý thuốc kháng Vitamin K (Warfarin / Acenocoumarol) chu phẫu và chỉ định bắc cầu Heparin',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const risk = ctx.patient.customInputs?.plannedProcedureRisk;
      return (
        isAfActive(ctx) &&
        !hasActiveMajorBleed(ctx) &&
        !hasCondition(ctx, 'pregnant') &&
        hasCurrentMed(ctx, VKA_IDS) &&
        Boolean(risk && risk !== 'none')
      );
    },
    produce: (ctx): Recommendation => {
      const risk = ctx.patient.customInputs?.plannedProcedureRisk;
      const vkaMed = findCurrentMed(ctx, VKA_IDS)!;
      const vkaId = vkaMed.drugId.toLowerCase();
      const vkaName = drug(vkaId).nameVi;

      if (risk === 'minor') {
        const inrMin = thFor('inr', 'af.vka.target_inr_min').toFixed(1);
        const inrMax = thFor('inr', 'af.vka.target_inr_max').toFixed(1);
        return {
          id: 'rec_af_periop_vka_continue_minor',
          module: 'af',
          tier: TIER_PERIOP,
          tierOrder: 2,
          action: 'CONTINUE',
          drugId: vkaId,
          drugNameVi: vkaName,
          dose: `Tiếp tục ${vkaName} không ngắt quãng (kiểm tra INR trong khoảng ${inrMin}–${inrMax})`,
          title: `Thủ thuật nguy cơ chảy máu rất thấp: Tiếp tục duy trì ${vkaName}, không cần ngưng thuốc`,
          rationale:
            'ACC/AHA 2023 (Section 6.4) & ESC 2024: Với thủ thuật nha khoa nhỏ, mổ đục thủy tinh thể hoặc thủ thuật da nông, tiếp tục duy trì VKA trong khoảng INR điều trị và cầm máu tại chỗ tốt an toàn hơn tạm ngưng.',
          gates: [],
          citationIds: ['acc.af.2023.periprocedural_warfarin_doac', 'esc.af.2024.vka_target_inr'],
          priority: 92
        };
      }

      const holdDays =
        vkaId === 'acenocoumarol'
          ? thFor('duration_days', 'af.periprocedural.acenocoumarol_hold_days')
          : thFor('duration_days', 'af.periprocedural.vka_hold_days');
      const targetInr = thFor('inr', 'af.periprocedural.vka_target_inr');
      const needsBridging =
        hasCondition(ctx, 'mechanicalValve') ||
        hasCondition(ctx, 'mitralStenosis') ||
        hasCondition(ctx, 'strokeOrTia');

      const bridgeMsg = needsBridging
        ? 'BẮT BUỘC BẮC CẦU HEPARIN (LMWH liều điều trị hoặc UFH tĩnh mạch) khi INR giảm xuống dưới 2.0 do bệnh nhân có van tim cơ học / hẹp hai lá hoặc tiền sử đột quỵ.'
        : 'KHÔNG bắc cầu Heparin (Thử nghiệm BRIDGE — Class III: Harm): Bắc cầu LMWH ở rung nhĩ không có van cơ học làm tăng gấp 3 lần xuất huyết nặng mà không giảm huyết khối.';

      const isHighRisk = risk === 'high' || risk === 'high_risk';
      return {
        id: 'rec_af_periop_vka_hold',
        module: 'af',
        tier: TIER_PERIOP,
        tierOrder: 2,
        action: 'HOLD',
        drugId: vkaId,
        drugNameVi: vkaName,
        dose: undefined,
        title: `Tạm ngưng ${vkaName} ${holdDays} ngày trước phẫu thuật (đảm bảo INR dưới ${targetInr})${needsBridging ? ' — KÈM BẮC CẦU HEPARIN' : ' — KHÔNG BẮC CẦU HEPARIN'}`,
        rationale: `ACC/AHA 2023 (Section 6.4.1) & ESC 2024: Tạm ngưng ${vkaName} ${holdDays} ngày trước phẫu thuật nguy cơ chảy máu ${isHighRisk ? 'cao' : 'thấp–vừa'} và kiểm tra lại INR < ${targetInr} trước mổ. ${bridgeMsg}`,
        gates: [{ parameter: 'Nguy cơ chảy máu phẫu thuật', passed: false, action: 'hold', value: String(risk), messageVi: `Ngưng ${vkaName} ${holdDays} ngày trước mổ` }],
        citationIds: ['acc.af.2023.periprocedural_warfarin_doac', 'acc.af.2023.periprocedural_bridging'],
        priority: 99
      };
    },
    citationIds: ['acc.af.2023.periprocedural_warfarin_doac']
  },

  // 3. Quản lý chu phẫu cho bệnh nhân đang dùng DOAC (kể cả kéo dài 3 ngày [72h] cho thuốc ức chế Xa khi CrCl < 30 ở mổ nguy cơ chảy máu cao!)
  {
    id: 'af.periprocedural.doac_hold',
    module: 'af',
    nameVi: 'AF-CARE [A]: Thời gian tạm ngưng DOAC chu phẫu theo nguy cơ chảy máu và CrCl (không bắc cầu Heparin)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const risk = String(ctx.patient.customInputs?.plannedProcedureRisk ?? '');
      if (!isAfActive(ctx) || hasActiveMajorBleed(ctx) || hasCondition(ctx, 'pregnant')) return false;
      if (!['low', 'low_risk', 'high', 'high_risk'].includes(risk)) return false;
      const activeMed = findCurrentMed(ctx, DOAC_IDS);
      if (!activeMed) return false;
      return !resolveAfDoacDose(ctx, activeMed.drugId.toLowerCase() as DoacDrugId).isContraindicated;
    },
    produce: (ctx): Recommendation => {
      const risk = String(ctx.patient.customInputs?.plannedProcedureRisk ?? '');
      const isHighRisk = risk === 'high' || risk === 'high_risk';
      const activeMed = findCurrentMed(ctx, DOAC_IDS)!;
      const chosenDoac = activeMed.drugId.toLowerCase() as DoacDrugId;
      const crcl = need(ctx, 'crcl');
      const dabi30 = thFor('crcl', 'af.dabigatran.crcl_contra');
      const modCrcl = thFor('crcl', 'af.crcl.moderate_impairment_50');

      const lowDays = thFor('duration_days', 'af.periprocedural.doac_hold_low_days');
      const highDays = thFor('duration_days', 'af.periprocedural.doac_hold_high_days');
      const dabiRenalDays = thFor('duration_days', 'af.periprocedural.dabigatran_hold_renal_days');
      const xaRenalDays = thFor('duration_days', 'af.periprocedural.xa_hold_renal_days');

      let holdDays = isHighRisk ? highDays : lowDays;
      if (chosenDoac === 'dabigatran' && crcl !== undefined && crcl < modCrcl) {
        holdDays = isHighRisk ? dabiRenalDays : highDays;
      } else if (chosenDoac !== 'dabigatran' && crcl !== undefined && crcl < dabi30) {
        holdDays = isHighRisk ? xaRenalDays : highDays;
      }

      return {
        id: `rec_af_periop_doac_hold_${chosenDoac}`,
        module: 'af',
        tier: TIER_PERIOP,
        tierOrder: 2,
        action: 'HOLD',
        drugId: chosenDoac,
        drugNameVi: drug(chosenDoac).nameVi,
        dose: undefined,
        title: `Tạm ngưng ${drug(chosenDoac).nameVi} ${holdDays} ngày trước phẫu thuật nguy cơ chảy máu ${isHighRisk ? 'cao' : 'thấp'} — KHÔNG bắc cầu Heparin`,
        rationale: `ACC/AHA 2023 (Section 6.4 / PAUSE) & ESC 2024: Ngưng ${drug(chosenDoac).nameVi} ${holdDays} ngày trước phẫu thuật theo mức nguy cơ chảy máu và độ thanh thải thận CrCl; TUYỆT ĐỐI KHÔNG bắc cầu Heparin/LMWH chu phẫu cho DOAC vì làm tăng xuất huyết nặng mà không giảm huyết khối. Khởi động lại khi đã cầm máu phẫu thuật an toàn.`,
        gates: [{ parameter: 'Chu phẫu DOAC', passed: false, action: 'hold', value: `${holdDays} ngày`, messageVi: `Tạm ngưng ${drug(chosenDoac).nameVi} ${holdDays} ngày trước mổ` }],
        citationIds: ['acc.af.2023.periprocedural_warfarin_doac', 'acc.af.2023.periprocedural_renal_hold_extension'],
        priority: 96
      };
    },
    citationIds: ['acc.af.2023.periprocedural_warfarin_doac', 'acc.af.2023.periprocedural_renal_hold_extension']
  }
];
