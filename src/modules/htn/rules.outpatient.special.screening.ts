/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: CKD SGLT2i, Tầm soát THA Thứ phát & Theo dõi Điện giải-Thận
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { th, thFor } from '../../kb-types';
import {
  CCB_IDS,
  DIURETIC_IDS,
  MRA_IDS,
  RASI_IDS,
  getEffectiveActiveMedIds,
  getMedIds,
  getUncontrolledBpCutoffs,
  isOutpatientCrisisOrUnstable
} from './helpers';

export const htnOutpatientSpecialScreeningRules: Rule[] = [
  {
    id: 'htn.outpatient.ckd_albuminuria_sglt2i_consider',
    module: 'htn',
    nameVi: 'Tăng huyết áp kèm CKD (eGFR ≥ 20): Cân nhắc phối hợp SGLT2i bảo vệ tim-thận và hỗ trợ hạ áp',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant') || isOutpatientCrisisOrUnstable(ctx)) return false;
      if (ctx.patient.selectedModules.some((m) => m === 'ckd' || m === 'dm2' || m === 'hf')) return false;
      const egfr = need(ctx, 'egfr');
      const uacr = need(ctx, 'uacr');
      const egfrMin = thFor('egfr', 'htn.ckd.egfr_sglt2i_min');
      const uacrTh = thFor('uacr', 'htn.ckd.uacr_albuminuria');
      if (egfr === undefined || egfr < egfrMin) return false;
      const medIds = getMedIds(ctx);
      if (medIds.some((id) => id === 'dapagliflozin' || id === 'empagliflozin' || id === 'canagliflozin')) return false;
      return hasCondition(ctx, 'ckd') || (uacr !== undefined && uacr >= uacrTh);
    },
    produce: (ctx: RuleContext): Recommendation => {
      const egfr = need(ctx, 'egfr')!;
      const egfrMin = thFor('egfr', 'htn.ckd.egfr_sglt2i_min');
      return {
        id: 'rec_htn_ckd_sglt2i_consider',
        module: 'htn',
        tier: 'Bảo vệ Cơ quan Đích Tim-Thận (ESC 2024)',
        tierOrder: 4,
        action: 'CONSIDER',
        title: `Tăng huyết áp kèm Bệnh thận mạn (eGFR ${egfr.toFixed(1)} ≥ ${egfrMin}): Cân nhắc phối hợp SGLT2i (Dapagliflozin / Empagliflozin)`,
        rationale:
          'Theo ESC 2024 (Class I, Mức bằng chứng A), ở bệnh nhân tăng huyết áp có bệnh thận mạn và eGFR ≥ 20 mL/phút/1,73 m², thuốc ức chế SGLT2 được khuyến cáo phối hợp trên nền RASi để giảm biến cố tim mạch, làm chậm tiến triển suy thận và hỗ trợ hạ huyết áp nhẹ (có thể bật thêm module CKD để xem phác đồ chi tiết).',
        gates: [],
        citationIds: ['esc.htn.2024.ckd_rec26', 'kdigo.bp.2021.rec_3_2_albuminuria_rasi'],
        priority: 58
      };
    },
    citationIds: ['esc.htn.2024.ckd_rec26']
  },

  // -------------------------------------------------------------------------
  // 5. TẦM SOÁT TĂNG HUYẾT ÁP THỨ PHÁT (CƯỜNG ALDOSTERON / KHỞI PHÁT < 40 TUỔI / HẸP ĐM THẬN / OSA)
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.screen_primary_aldosteronism',
    module: 'htn',
    nameVi: 'Tầm soát nguyên nhân Tăng huyết áp thứ phát (Cường Aldosteron nguyên phát ARR, Khởi phát < 40 tuổi, Hẹp ĐM thận, OSA)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant')) return false;
      if (
        hasCondition(ctx, 'unprovokedHypokalemia') ||
        hasCondition(ctx, 'suspectedSecondaryHtn') ||
        hasCondition(ctx, 'renalBruit') ||
        hasCondition(ctx, 'snoringOsa')
      ) {
        return true;
      }

      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const age = need(ctx, 'age');
      const k = need(ctx, 'k');
      const youngAge = thFor('age', 'htn.secondary.age_young_onset');
      const sbpHtn = thFor('sbp', 'htn.bp.sbp_hypertension');
      const dbpHtn = thFor('dbp', 'htn.bp.dbp_hypertension');
      const kHypo = thFor('k', 'htn.hypokalemia.k_threshold');

      if (k !== undefined && k < kHypo && !getMedIds(ctx).some((id) => DIURETIC_IDS.includes(id))) {
        return true;
      }

      if (
        age !== undefined &&
        age < youngAge &&
        ((sbp !== undefined && sbp >= sbpHtn) || (dbp !== undefined && dbp >= dbpHtn))
      ) {
        return true;
      }

      const effectiveMeds = getEffectiveActiveMedIds(ctx);
      const has3Classes =
        effectiveMeds.some((id) => RASI_IDS.includes(id)) &&
        effectiveMeds.some((id) => CCB_IDS.includes(id)) &&
        effectiveMeds.some((id) => DIURETIC_IDS.includes(id));
      const cutoffs = getUncontrolledBpCutoffs(ctx);
      if (
        has3Classes &&
        sbp !== undefined &&
        dbp !== undefined &&
        (sbp >= cutoffs.sbp || dbp >= cutoffs.dbp)
      ) {
        return true;
      }

      return false;
    },
    produce: (ctx: RuleContext): Recommendation => {
      const age = need(ctx, 'age');
      const youngAge = thFor('age', 'htn.secondary.age_young_onset');
      const clues: string[] = [];
      if (hasCondition(ctx, 'unprovokedHypokalemia')) clues.push('hạ Kali máu tự phát / do lợi tiểu');
      if (age !== undefined && age < youngAge) clues.push(`khởi phát THA người trẻ < ${youngAge} tuổi (${age} tuổi)`);
      if (hasCondition(ctx, 'renalBruit')) clues.push('nghi ngờ bệnh mạch máu thận / tiếng thổi ĐM thận');
      if (hasCondition(ctx, 'snoringOsa')) clues.push('nghi ngờ ngưng thở khi ngủ tắc nghẽn (OSA)');
      if (hasCondition(ctx, 'suspectedSecondaryHtn')) clues.push('dấu hiệu lâm sàng gợi ý THA thứ phát');
      if (clues.length === 0) clues.push('THA kháng trị trên 3 nhóm thuốc nền');

      return {
        id: 'rec_htn_screen_aldosteronism',
        module: 'htn',
        tier: 'Tầm soát Nguyên nhân Tăng huyết áp Thứ phát',
        tierOrder: 4,
        action: 'REFER',
        title: `Chỉ định tầm soát THA thứ phát (${clues.join('; ')}): Xét nghiệm tỷ số Aldosterone/Renin (ARR) & Chuyên khoa`,
        rationale: `Ghi nhận dấu hiệu chỉ điểm (${clues.join('; ')}). Theo ESC 2024 (Class I: tầm soát ở người lớn khởi phát THA < ${youngAge} tuổi và xét nghiệm ARR cho mọi THA trung bình-nặng/kháng trị), AHA/ACC 2025 (COR 1: tầm soát cường aldosteron nguyên phát ở mọi THA kháng trị bất kể K⁺ máu) và VSH 2022 (Bảng 13), cần định lượng tỷ số Aldosterone/Renin huyết tương (ARR), siêu âm Doppler động mạch thận và/hoặc đa ký giấc ngủ theo bệnh cảnh.`,
        gates: [],
        citationIds: [
          'esc.htn.2024.arr_screening',
          'esc.htn.2024.young_onset_secondary',
          'vsh.htn.2022.arr_screening_table13'
        ],
        priority: 62
      };
    },
    citationIds: ['esc.htn.2024.arr_screening', 'esc.htn.2024.young_onset_secondary', 'vsh.htn.2022.arr_screening_table13']
  },

  // -------------------------------------------------------------------------
  // 6. THEO DÕI AN TOÀN CREATININ / eGFR (NGƯỠNG TĂNG <= 30%) & ĐIỆN GIẢI SAU 2–4 TUẦN
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.safety_monitoring_cr_k',
    module: 'htn',
    nameVi: 'Theo dõi an toàn chức năng thận (chấp nhận tăng SCr ≤ 30%) và Điện giải đồ sau 2–4 tuần dùng RASi / Lợi tiểu / MRA',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasCondition(ctx, 'pregnant')) return false;
      const medIds = getMedIds(ctx);
      if (medIds.some((id) => RASI_IDS.includes(id) || DIURETIC_IDS.includes(id) || MRA_IDS.includes(id))) {
        return true;
      }
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const sbpHtn = thFor('sbp', 'htn.bp.sbp_hypertension');
      const dbpHtn = thFor('dbp', 'htn.bp.dbp_hypertension');
      return (sbp !== undefined && sbp >= sbpHtn) || (dbp !== undefined && dbp >= dbpHtn);
    },
    produce: (): Recommendation => {
      const wkMin = th('htn.monitoring.recheck_weeks_min');
      const wkMax = th('htn.monitoring.recheck_weeks_max');
      const scrRiseMax = th('htn.monitoring.scr_rise_max_pct');
      const kMax = thFor('k', 'htn.rasi.k_max_initiate');

      return {
        id: 'rec_htn_monitor_cr_k',
        module: 'htn',
        tier: 'Theo dõi An toàn Sinh hóa & Huyết động',
        tierOrder: 5,
        action: 'MONITOR',
        title: `Kiểm tra lại Creatinin huyết thanh (eGFR) và Điện giải đồ (K⁺, Na⁺) sau ${wkMin}–${wkMax} tuần khởi trị / chỉnh liều`,
        rationale: `Theo AHA/ACC 2025, KDIGO 2021 và ESC 2024, cần xét nghiệm lại Creatinin và Kali máu trong vòng ${wkMin}–${wkMax} tuần sau khi bắt đầu hoặc tăng liều ACEi/ARB, lợi tiểu hoặc MRA. Lưu ý sinh lý huyết động cầu thận: mức tăng Creatinin cấp tính nhẹ ≤ ${scrRiseMax}% (tương đương giảm eGFR nhẹ đầu trị liệu do giảm áp lực lọc cầu thận) là đáp ứng bảo vệ thận dự kiến — KHÔNG ngừng sớm ACEi/ARB trừ khi Creatinin tăng > ${scrRiseMax}% hoặc Kali máu > ${kMax} mmol/L không đáp ứng hạ kali.`,
        gates: [],
        citationIds: [
          'aha.acc.2025.monitoring_bmp_2_4wk',
          'aha.acc.2025.egfr_dip_30pct',
          'kdigo.bp.2021.pp_3_2_3_monitoring'
        ],
        priority: 48
      };
    },
    citationIds: ['aha.acc.2025.monitoring_bmp_2_4wk', 'aha.acc.2025.egfr_dip_30pct', 'kdigo.bp.2021.pp_3_2_3_monitoring']
  }
];
