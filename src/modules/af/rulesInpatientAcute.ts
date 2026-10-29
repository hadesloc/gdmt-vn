/**
 * Quy tắc Cấp cứu Nội viện: Sốc điện Chuyển nhịp Khẩn cấp & Kiểm soát Đáp ứng Thất Nhanh Cấp (RVR) Đường Tĩnh Mạch [R]
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  BB_IDS,
  NON_DHP_CCB_IDS,
  NON_SELECTIVE_BB_IDS,
  findCurrentMed,
  formatRateUptitrateDose,
  getAcuteIvDose,
  getDrugDisplayNameVi,
  hasCardiacAmyloidosis,
  hasConductionBlockNoPacer,
  hasHyperthyroidism,
  hasWpw,
  isAfActive,
  isAllergicToDrug,
  isUnstableHemodynamics
} from './rulesHelpers';

const TIER_R_ACUTE = 'AF-CARE · [R] Cấp cứu Nội viện';
const TIER_R_RATE_ACUTE = 'AF-CARE · [R] Kiểm soát tần số cấp';

export const afInpatientAcuteRules: Rule[] = [
  // 1. Sốc điện chuyển nhịp đồng bộ khẩn cấp khi mất ổn định huyết động (giữ af_25 — không đòi SCr/LVEF)
  {
    id: 'af.inpatient.emergency_cardioversion',
    module: 'af',
    nameVi: 'AF-CARE [R] Nội viện: Sốc điện chuyển nhịp đồng bộ khẩn cấp khi rối loạn huyết động',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAfActive(ctx) && isUnstableHemodynamics(ctx),
    produce: (ctx): Recommendation => {
      const sbp = need(ctx, 'sbp');
      const minSbp = thFor('sbp', 'af.acute.hypotension_sbp');
      return {
        id: 'rec_af_emergency_ecv',
        module: 'af',
        tier: TIER_R_ACUTE,
        tierOrder: 1,
        action: 'START',
        dose: undefined,
        title: 'SỐC ĐIỆN CHUYỂN NHỊP ĐỒNG BỘ KHẨN CẤP (Emergency Electrical Cardioversion — Class I)',
        rationale:
          'Khuyến cáo Class I (ESC 2024 Rec Table 16 & ACC/AHA 2023): Bệnh nhân rung nhĩ kèm rối loạn huyết động cấp (tụt huyết áp, sốc tim, phù phổi cấp, thiếu máu cơ tim cấp tiến triển) phải được sốc điện đồng bộ ngay lập tức và tiêm tĩnh mạch Heparin không phân đoạn (UFH) hoặc LMWH càng sớm càng tốt nếu không chảy máu hoạt động; TUYỆT ĐỐI KHÔNG trì hoãn chờ xét nghiệm hay chống đông đường uống.',
        gates: [
          {
            parameter: 'Huyết động',
            passed: false,
            action: 'contra',
            value: sbp !== undefined ? `${sbp} mmHg` : 'Mất ổn định',
            threshold: sbp !== undefined ? `${minSbp} mmHg` : undefined,
            messageVi: 'Rối loạn huyết động cấp — Sốc điện đồng bộ ngay'
          }
        ],
        citationIds: ['esc.af.2024.emergency_electrical_cardioversion', 'esc.af.2024.cardioversion_timing_24h'],
        priority: 110
      };
    },
    citationIds: ['esc.af.2024.emergency_electrical_cardioversion']
  },

  // 2. Kiểm soát đáp ứng thất nhanh cấp (RVR) đường tĩnh mạch theo LVEF (Liều tĩnh mạch chuẩn ESC 2024 Table 12!)
  {
    id: 'af.inpatient.acute_rate_rvr',
    module: 'af',
    nameVi: 'AF-CARE [R] Nội viện: Kiểm soát đáp ứng thất nhanh cấp tính đường tĩnh mạch theo phân suất tống máu LVEF',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || hasConductionBlockNoPacer(ctx) || isUnstableHemodynamics(ctx)) {
        return false;
      }
      const hr = need(ctx, 'hr');
      const ef = need(ctx, 'lvef');
      return hr !== undefined && hr >= thFor('hr', 'af.rate.lenient_hr_target') && ef !== undefined;
    },
    produce: (ctx): Recommendation | null => {
      const ef = need(ctx, 'lvef')!;
      const hr = need(ctx, 'hr')!;
      const efCutoff = thFor('lvef', 'af.rate.lvef_cutoff');
      const isPregnant = hasCondition(ctx, 'pregnant');
      const hasAsthma = hasCondition(ctx, 'asthma');
      const isAmyloid = hasCardiacAmyloidosis(ctx);

      // Nhánh A: Suy tim HFrEF (LVEF ≤ 40%) -> Cấm tuyệt đối Diltiazem/Verapamil IV
      if (ef <= efCutoff) {
        if (isPregnant) {
          if (isAmyloid) {
            return {
              id: 'rec_af_acute_rate_hfref',
              module: 'af',
              tier: TIER_R_RATE_ACUTE,
              tierOrder: 1,
              action: 'START',
              drugId: 'esmolol',
              drugNameVi: drug('esmolol').nameVi,
              dose: getAcuteIvDose('esmolol'),
              title: `Kiểm soát tần số cấp trong thai kỳ kèm HFrEF & Amyloidosis: Dùng ${drug('esmolol').nameVi} truyền tĩnh mạch ngắn hạn (CẤM Amiodarone, Digoxin & Non-DHP CCB)`,
              rationale:
                'ESC 2025 Pregnancy & ESC HF 2026: Cấm Amiodarone trong thai kỳ, cấm Digoxin và Non-DHP CCB trong Amyloidosis/HFrEF; dùng chẹn beta tác dụng cực ngắn truyền tĩnh mạch dưới theo dõi huyết động sát.',
              gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
              citationIds: ['esc.af.2024.table12_bb_iv_doses', 'esc.preg.2025.amiodarone_contra', 'esc.hf.2026.amyloidosis_avoid_digoxin'],
              priority: 96
            };
          }
          return {
            id: 'rec_af_acute_rate_hfref',
            module: 'af',
            tier: TIER_R_RATE_ACUTE,
            tierOrder: 1,
            action: 'START',
            drugId: 'digoxin',
            drugNameVi: drug('digoxin').nameVi,
            dose: getAcuteIvDose('digoxin'),
            title: `Kiểm soát tần số cấp trong thai kỳ kèm HFrEF (HR ${hr} bpm, LVEF ${ef}%): Chỉ định Digoxin tĩnh mạch (CẤM Amiodarone & Non-DHP CCB)`,
            rationale:
              'ESC 2025 Pregnancy & ESC 2024 AF: Amiodarone chống chỉ định trong thai kỳ và Non-DHP CCB chống chỉ định ở HFrEF; ưu tiên Digoxin tĩnh mạch hoặc chẹn beta chọn lọc beta-1 liều thấp.',
            gates: [{ parameter: 'Thai kỳ + HFrEF', passed: false, action: 'contra', value: ef, threshold: efCutoff, messageVi: 'Cấm Amiodarone & Non-DHP CCB' }],
            citationIds: ['esc.preg.2025.amiodarone_contra', 'esc.af.2024.rate_control_lvef_reduced', 'esc.hf.2026.digoxin_rec'],
            priority: 96
          };
        }

        if (hasHyperthyroidism(ctx) || hasCondition(ctx, 'breastfeeding') || isAllergicToDrug(ctx, 'amiodarone')) {
          if (isAmyloid) return null;
          return {
            id: 'rec_af_acute_rate_hfref',
            module: 'af',
            tier: TIER_R_RATE_ACUTE,
            tierOrder: 1,
            action: 'START',
            drugId: 'digoxin',
            drugNameVi: drug('digoxin').nameVi,
            dose: getAcuteIvDose('digoxin'),
            title: `Kiểm soát tần số cấp ở HFrEF (HR ${hr} bpm, LVEF ${ef}%): Digoxin tĩnh mạch (tránh Amiodarone & CẤM Non-DHP CCB)`,
            rationale:
              'ESC 2024 (Table 12): Khi có chống chỉ định Amiodarone (cường giáp / cho con bú / dị ứng) ở bệnh nhân HFrEF cấp, dùng Digoxin tĩnh mạch kiểm soát tần số thất.',
            gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
            citationIds: ['esc.af.2024.rate_control_lvef_reduced', 'esc.hf.2026.digoxin_rec'],
            priority: 95
          };
        }

        return {
          id: 'rec_af_acute_rate_hfref',
          module: 'af',
          tier: TIER_R_RATE_ACUTE,
          tierOrder: 1,
          action: 'START',
          drugId: 'amiodarone',
          drugNameVi: drug('amiodarone').nameVi,
          dose: getAcuteIvDose('amiodarone'),
          title: `Kiểm soát tần số thất nhanh cấp ở HFrEF (HR ${hr} bpm, LVEF ${ef}%): Truyền tĩnh mạch Amiodarone${isAmyloid ? '' : ' hoặc Digoxin IV'} (CẤM Diltiazem/Verapamil)`,
          rationale: `Khuyến cáo Class I/IIa (ESC 2024 Table 12 & Rec Table 14): Ở LVEF ${ef}% ≤ ${efCutoff}%, tuyệt đối cấm Diltiazem và Verapamil tĩnh mạch do nguy cơ sốc tim; truyền tĩnh mạch Amiodarone là lựa chọn cấp cứu an toàn${isAmyloid ? ' (cấm Digoxin do Amyloidosis tim)' : ' (hoặc phối hợp Digoxin tĩnh mạch)'}.`,
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%: Cấm Non-DHP CCB` }],
          citationIds: ['esc.af.2024.rate_control_amiodarone_acute', 'esc.af.2024.amiodarone_dose_regimen', 'esc.af.2024.non_dhp_ccb_contra_lvef40'],
          priority: 95
        };
      }

      // Nhánh B: LVEF > 40%
      const rawBb = findCurrentMed(ctx, BB_IDS);
      const onBb = rawBb && !(hasAsthma && NON_SELECTIVE_BB_IDS.includes(rawBb.drugId.toLowerCase())) ? rawBb : undefined;
      const rawCcb = findCurrentMed(ctx, NON_DHP_CCB_IDS);
      const onCcb = rawCcb && !isAmyloid && !(isPregnant && rawCcb.drugId.toLowerCase() === 'diltiazem') ? rawCcb : undefined;

      // Đang uống Chẹn beta (af_46) -> UPTITRATE chính Chẹn beta đó (hoặc bổ sung liều tĩnh mạch cùng nhóm), tuyệt đối KHÔNG thêm Diltiazem
      if (onBb && !onCcb) {
        const bbId = onBb.drugId.toLowerCase();
        const bbName = getDrugDisplayNameVi(bbId, onBb);
        return {
          id: 'rec_af_acute_rate_preserved',
          module: 'af',
          tier: TIER_R_RATE_ACUTE,
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: bbId,
          drugNameVi: bbName,
          dose: `${formatRateUptitrateDose(onBb, bbId)} (trong pha cấp có thể tiêm tĩnh mạch Metoprolol 2.5–5 mg hoặc Esmolol truyền tĩnh mạch cùng nhóm)`,
          title: `Kiểm soát đáp ứng thất nhanh cấp (HR ${hr} bpm, LVEF ${ef}%): Tăng liều ${bbName} / Chẹn beta tĩnh mạch (KHÔNG phối hợp thêm Diltiazem/Verapamil)`,
          rationale:
            'ESC 2024 (Table 12 & Section 7.1.1): Khi bệnh nhân đang dùng Chẹn beta, ưu tiên tối ưu hóa liều Chẹn beta (hoặc phối hợp thêm Digoxin nếu không có Amyloidosis); tránh thêm Diltiazem/Verapamil chồng lên Chẹn beta do nguy cơ vô tâm thu.',
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
          citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.table12_bb_iv_doses'],
          priority: 92
        };
      }

      // Đang uống Non-DHP CCB hợp lệ (af_47) -> UPTITRATE chính thuốc đó (tiêm/truyền tĩnh mạch Diltiazem/Verapamil), KHÔNG thêm Chẹn beta
      if (onCcb && !onBb) {
        const ccbId = onCcb.drugId.toLowerCase() as 'diltiazem' | 'verapamil';
        const ccbName = drug(ccbId).nameVi;
        return {
          id: 'rec_af_acute_rate_preserved',
          module: 'af',
          tier: TIER_R_RATE_ACUTE,
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: ccbId,
          drugNameVi: ccbName,
          dose: getAcuteIvDose(ccbId),
          title: `Kiểm soát đáp ứng thất nhanh cấp (HR ${hr} bpm, LVEF ${ef}%): Bolus / truyền tĩnh mạch và tăng liều ${ccbName} (KHÔNG phối hợp thêm Chẹn beta)`,
          rationale:
            'ESC 2024 (Table 12): Tối ưu hóa thuốc chẹn kênh canxi Non-DHP đường tĩnh mạch/uống đang dùng (hoặc phối hợp Digoxin); tránh thêm Chẹn beta chồng chéo gây block nhĩ thất.',
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
          citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose'],
          priority: 92
        };
      }

      // Chưa dùng thuốc: Chọn thuốc tĩnh mạch cấp an toàn theo Thai kỳ / Amyloidosis / Hen phế quản (mặc định Diltiazem IV giữ tương thích af_27!)
      if (isPregnant || isAmyloid) {
        if (hasAsthma && isPregnant && !isAmyloid) {
          return {
            id: 'rec_af_acute_rate_preserved',
            module: 'af',
            tier: TIER_R_RATE_ACUTE,
            tierOrder: 1,
            action: 'START',
            drugId: 'verapamil',
            drugNameVi: drug('verapamil').nameVi,
            dose: getAcuteIvDose('verapamil'),
            title: `Kiểm soát tần số cấp trong thai kỳ kèm hen phế quản (HR ${hr} bpm, LVEF ${ef}%): Tiêm tĩnh mạch chậm Verapamil`,
            rationale: 'ESC 2024 & ESC 2025 Pregnancy: Khi thai phụ có hen phế quản không dùng được chẹn beta và tránh Diltiazem, dùng Verapamil tĩnh mạch chậm.',
            gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
            citationIds: ['esc.af.2024.verapamil_contra_lvef40', 'esc.af.2024.pregnancy_rate_verapamil'],
            priority: 90
          };
        }
        return {
          id: 'rec_af_acute_rate_preserved',
          module: 'af',
          tier: TIER_R_RATE_ACUTE,
          tierOrder: 1,
          action: 'START',
          drugId: 'esmolol',
          drugNameVi: drug('esmolol').nameVi,
          dose: getAcuteIvDose('esmolol'),
          title: `Kiểm soát đáp ứng thất nhanh cấp (HR ${hr} bpm, LVEF ${ef}%): Truyền tĩnh mạch Chẹn beta chọn lọc Esmolol (${isPregnant ? 'tránh Diltiazem trong thai kỳ' : 'cấm Diltiazem/Digoxin trong Amyloidosis tim'})`,
          rationale:
            'ESC 2024 (Table 12): Esmolol truyền tĩnh mạch có thời gian bán thải cực ngắn (9 phút), an toàn để chuẩn độ kiểm soát tần số thất cấp.',
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
          citationIds: ['esc.af.2024.table12_bb_iv_doses', 'esc.af.2024.rate_control_lvef_preserved'],
          priority: 90
        };
      }

      const chosenIvCcb: 'diltiazem' | 'verapamil' = isAllergicToDrug(ctx, 'diltiazem') ? 'verapamil' : 'diltiazem';
      return {
        id: 'rec_af_acute_rate_preserved',
        module: 'af',
        tier: TIER_R_RATE_ACUTE,
        tierOrder: 1,
        action: 'START',
        drugId: chosenIvCcb,
        drugNameVi: drug(chosenIvCcb).nameVi,
        dose: getAcuteIvDose(chosenIvCcb),
        title: `Kiểm soát đáp ứng thất nhanh cấp (HR ${hr} bpm, LVEF ${ef}%): Tiêm / truyền tĩnh mạch ${drug(chosenIvCcb).nameVi} (hoặc Metoprolol/Esmolol IV)`,
        rationale: `Khuyến cáo Class I (ESC 2024 Table 12 & Rec Table 14): Khi LVEF ${ef}% > ${efCutoff}% và huyết động ổn định, kiểm soát nhanh tần số thất bằng Diltiazem tĩnh mạch (0.25 mg/kg trong 2–5 phút rồi duy trì 5–15 mg/giờ) hoặc Chẹn beta tĩnh mạch (Metoprolol 2.5–5 mg IV / Esmolol IV) — chỉ chọn MỘT trong hai nhóm, không tiêm chồng hai nhóm.`,
        gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% > ${efCutoff}%` }],
        citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose', 'esc.af.2024.table12_bb_iv_doses'],
        priority: 90
      };
    },
    citationIds: ['esc.af.2024.rate_control_lvef_preserved', 'esc.af.2024.diltiazem_dose', 'esc.af.2024.rate_control_amiodarone_acute']
  }
];
