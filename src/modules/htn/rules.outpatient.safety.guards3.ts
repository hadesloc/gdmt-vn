/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Lợi tiểu Suy thận/Hạ K+, Block AV, Clonidine, Gút & Hạ HA Tư thế
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ALPHA1_IDS,
  BB_IDS,
  CENTRAL_IDS,
  LOOP_IDS,
  NDHP_CCB_IDS,
  THIAZIDE_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer
} from './helpers';

export const htnOutpatientSafetyGuards3Rules: Rule[] = [
  {
    id: 'htn.outpatient.indapamide_hctz_renal_stop',
    module: 'htn',
    nameVi: 'Suy thận nặng: Ngừng Indapamide / Hydrochlorothiazide chuyển sang lợi tiểu quai',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const egfr = need(ctx, 'egfr');
      const egfrMin = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      if (egfr === undefined || egfr >= egfrMin) return false;
      return getMedIds(ctx).some((id) => id === 'indapamide' || id === 'hydrochlorothiazide');
    },
    produce: (ctx: RuleContext): Recommendation => {
      const egfr = need(ctx, 'egfr');
      const egfrMin = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      const medId = getMedIds(ctx).find((id) => id === 'indapamide' || id === 'hydrochlorothiazide') || 'indapamide';
      return {
        id: 'rec_htn_stop_thiazide_severe_ckd',
        module: 'htn',
        tier: 'Tối ưu Lợi tiểu theo Chức năng thận',
        tierOrder: 0,
        action: 'STOP',
        drugId: medId,
        title: `NGỪNG ${medId} do suy thận nặng (eGFR = ${egfr?.toFixed(0)} < ${egfrMin} mL/min/1.73m²) — Chuyển sang lợi tiểu quai Furosemide`,
        rationale: `Theo ESC 2024 (Section 9.7) và nhãn EMA, Indapamide chống chỉ định và Hydrochlorothiazide mất tác dụng thải muối khi eGFR < ${egfrMin} mL/min/1.73m²; cần chuyển sang lợi tiểu quai (Furosemide).`,
        gates: [],
        citationIds: ['ema.indapamide.renal_contra', 'esc.htn.2024.ckd_loop_diuretic'],
        priority: 97
      };
    },
    citationIds: ['ema.indapamide.renal_contra', 'esc.htn.2024.ckd_loop_diuretic']
  },

  {
    id: 'htn.outpatient.hypokalemia_diuretic_safety',
    module: 'htn',
    nameVi: 'Hạ kali máu (K+ < 3.5 mmol/L): Tạm ngừng lợi tiểu thải kali để tránh loạn nhịp thất / xoắn đỉnh',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const k = need(ctx, 'k');
      const kHypo = thFor('k', 'htn.hypokalemia.k_threshold');
      if (k === undefined || k >= kHypo) return false;
      return getMedIds(ctx).some((id) => THIAZIDE_IDS.includes(id) || LOOP_IDS.includes(id));
    },
    produce: (ctx: RuleContext): Recommendation => {
      const k = need(ctx, 'k');
      const kHypo = thFor('k', 'htn.hypokalemia.k_threshold');
      const medId = getMedIds(ctx).find((id) => THIAZIDE_IDS.includes(id) || LOOP_IDS.includes(id)) || 'hydrochlorothiazide';
      return {
        id: 'rec_htn_hypokalemia_hold_diuretic',
        module: 'htn',
        tier: 'Cảnh báo Hạ Kali máu & Loạn nhịp',
        tierOrder: 0,
        action: 'HOLD',
        drugId: medId,
        title: `TẠM NGỪNG lợi tiểu thải kali (${medId}) do hạ kali máu (K⁺ = ${k} < ${kHypo} mmol/L)`,
        rationale: `Kali máu giảm thấp (${k} mmol/L) làm tăng mạnh nguy cơ ngoại tâm thu thất, kéo dài khoảng QT và xoắn đỉnh (đặc biệt với Indapamide/HCTZ). Tạm ngừng ${medId}, bù Kali + Magie và tầm soát cường aldosteron nguyên phát.`,
        gates: [],
        citationIds: ['ema.indapamide.hypokalemia_qt', 'vsh.htn.2022.bb_contraindications_table11'],
        priority: 99
      };
    },
    citationIds: ['ema.indapamide.hypokalemia_qt']
  },

  {
    id: 'htn.outpatient.av_block_stop_bb',
    module: 'htn',
    nameVi: 'Block nhĩ thất độ 2–3 / Suy nút xoang chưa đặt máy tạo nhịp: Ngừng thuốc chẹn beta',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasAvBlockOrSssWithoutPacer(ctx) && getMedIds(ctx).some((id) => BB_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const medId = getMedIds(ctx).find((id) => BB_IDS.includes(id)) || 'bisoprolol';
      return {
        id: 'rec_htn_avblock_stop_bb',
        module: 'htn',
        tier: 'Cảnh báo Dẫn truyền Nhĩ thất',
        tierOrder: 0,
        action: 'STOP',
        drugId: medId,
        title: `NGỪNG NGAY ${medId}: Chống chỉ định trong Block nhĩ thất độ 2–3 / Suy nút xoang chưa đặt máy tạo nhịp`,
        rationale:
          'Chống chỉ định bắt buộc (VSH 2022 Bảng 11 / ESC 2024): Thuốc chẹn beta làm ức chế nút xoang và nút nhĩ thất gây vô tâm thu hoặc cơn Adams-Stokes.',
        gates: [],
        citationIds: ['vsh.htn.2022.bb_contraindications_table11'],
        priority: 100
      };
    },
    citationIds: ['vsh.htn.2022.bb_contraindications_table11']
  },

  {
    id: 'htn.outpatient.av_block_stop_ndhp_ccb',
    module: 'htn',
    nameVi: 'Block nhĩ thất độ 2–3 / Suy nút xoang chưa đặt máy tạo nhịp: Ngừng Diltiazem / Verapamil',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasAvBlockOrSssWithoutPacer(ctx) && getMedIds(ctx).some((id) => NDHP_CCB_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const medId = getMedIds(ctx).find((id) => NDHP_CCB_IDS.includes(id)) || 'diltiazem';
      return {
        id: 'rec_htn_avblock_stop_ndhp',
        module: 'htn',
        tier: 'Cảnh báo Dẫn truyền Nhĩ thất',
        tierOrder: 0,
        action: 'STOP',
        drugId: medId,
        title: `NGỪNG NGAY ${medId}: Chống chỉ định trong Block nhĩ thất độ 2–3 / Suy nút xoang chưa đặt máy tạo nhịp`,
        rationale:
          'Thuốc chẹn kênh canxi nhóm non-DHP (Diltiazem, Verapamil) ức chế dẫn truyền nút nhĩ thất gây block nhĩ thất hoàn toàn và ngừng tim.',
        gates: [],
        citationIds: ['aha.acc.2025.table13_losartan_ccb_bb'],
        priority: 100
      };
    },
    citationIds: ['aha.acc.2025.table13_losartan_ccb_bb']
  },

  {
    id: 'htn.outpatient.clonidine_interactions',
    module: 'htn',
    nameVi: 'Cảnh báo tương tác Clonidine / Moxonidine với Chẹn beta hoặc Diltiazem/Verapamil',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const meds = getMedIds(ctx);
      const hasCentral = meds.includes('clonidine') || meds.includes('moxonidine');
      return hasCentral && meds.some((id) => BB_IDS.includes(id) || NDHP_CCB_IDS.includes(id));
    },
    produce: (ctx: RuleContext): Recommendation => {
      const meds = getMedIds(ctx);
      const centralId = meds.includes('clonidine') ? 'clonidine' : 'moxonidine';
      const hasBb = meds.some((id) => BB_IDS.includes(id));
      return {
        id: 'rec_htn_clonidine_ddi_warning',
        module: 'htn',
        tier: 'Cảnh báo Tương tác & Ngừng thuốc tuần tự',
        tierOrder: 1,
        action: 'MONITOR',
        title: hasBb
          ? `CẢNH BÁO TƯƠNG TÁC (${centralId} + Chẹn beta): Nếu ngừng thuốc, BẮT BUỘC ngừng Chẹn beta trước vài ngày rồi mới giảm dần ${centralId}`
          : `CẢNH BÁO TƯƠNG TÁC (${centralId} + Verapamil/Diltiazem): Nguy cơ nhịp chậm xoang nặng và block nhĩ thất`,
        rationale: hasBb
          ? `Ngừng đột ngột ${centralId} khi đang dùng chẹn beta làm giải phóng ồ ạt catecholamine kích thích thụ thể alpha-1 không đối kháng, gây cơn tăng huyết áp dội ngược tử vong. Phải ngừng chẹn beta trước vài ngày rồi mới giảm liều ${centralId} từ từ.`
          : `Phối hợp ${centralId} với non-DHP CCB gây cộng hưởng ức chế nút xoang và nút nhĩ thất; cần theo dõi sát ECG và tần số tim.`,
        gates: [],
        citationIds: ['aha.acc.2025.table13_central_clonidine'],
        priority: 90
      };
    },
    citationIds: ['aha.acc.2025.table13_central_clonidine']
  },

  {
    id: 'htn.outpatient.gout_switch_thiazide',
    module: 'htn',
    nameVi: 'Bệnh gút đồng mắc: Chuyển đổi lợi tiểu Thiazide đang dùng sang Losartan hoặc CCB',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'gout') && getMedIds(ctx).some((id) => THIAZIDE_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const thzId = getMedIds(ctx).find((id) => THIAZIDE_IDS.includes(id)) || 'hydrochlorothiazide';
      return {
        id: 'rec_htn_gout_switch_thiazide',
        module: 'htn',
        tier: 'Tối ưu Đồng mắc Bệnh Gút',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: thzId,
        title: `CHUYỂN ĐỔI: Ngừng lợi tiểu ${thzId} trên bệnh nhân Gút để đổi sang Losartan và/hoặc Amlodipine`,
        rationale:
          'Theo ESC 2024 và VSH 2022, lợi tiểu nhóm Thiazide/Thiazide-like làm giảm bài tiết urat ở ống thận, gây tăng acid uric máu và khởi phát cơn gút cấp. Ưu tiên chuyển sang Losartan (ức chế URAT1 tăng thải acid uric) và/hoặc chẹn kênh canxi DHP (Amlodipine).',
        gates: [],
        citationIds: ['esc.htn.2024.gout_thiazide_caution', 'vsh.htn.2022.bb_contraindications_table11'],
        priority: 93
      };
    },
    citationIds: ['esc.htn.2024.gout_thiazide_caution']
  },

  {
    id: 'htn.outpatient.orthostatic_switch_culprits',
    module: 'htn',
    nameVi: 'Hạ huyết áp tư thế có triệu chứng: Ngừng/đổi thuốc gây nặng hạ HA tư thế (Chẹn alpha-1, Trung ương)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'orthostaticHypotension') &&
      getMedIds(ctx).some((id) => ALPHA1_IDS.includes(id) || CENTRAL_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const culpritId =
        getMedIds(ctx).find((id) => ALPHA1_IDS.includes(id) || CENTRAL_IDS.includes(id)) || 'doxazosin';
      return {
        id: 'rec_htn_orthostatic_switch_culprit',
        module: 'htn',
        tier: 'An toàn Hạ huyết áp Tư thế & Phòng té ngã',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: culpritId,
        title: `CHUYỂN ĐỔI / NGỪNG ${culpritId} do làm nặng Hạ huyết áp tư thế đứng (Class I ESC 2024)`,
        rationale:
          'Theo ESC 2024 (Section 9.6 Rec Table 24, Class I Level C), ở bệnh nhân có hạ huyết áp tư thế, cần ưu tiên áp dụng biện pháp không dùng thuốc và CHUYỂN ĐỔI (SWITCH) các nhóm thuốc làm trầm trọng hạ HA tư thế (đặc biệt chẹn alpha-1 như Doxazosin, thuốc giao cảm trung ương, lợi tiểu liều cao) sang CCB tác dụng kéo dài hoặc RASi liều thấp thay vì chỉ giảm liều đơn thuần.',
        gates: [],
        citationIds: ['esc.htn.2024.oh_switch_rec24'],
        priority: 93
      };
    },
    citationIds: ['esc.htn.2024.oh_switch_rec24']
  }
];
