/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Finerenone Thận, Huyết áp Mục tiêu & Tầm soát Biến chứng
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  getEffectiveEgfr,
  hasAcuteCatabolicKetosis,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasHf,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  isOvertreatedFrailDeferral,
  isPregnant,
  isTakingCanonical,
  resolveCanonicalDrugIds
} from './helpers';

export const dm2CvRiskAndScreeningRules: Rule[] = [
  // 1. CÂN NHẮC FINERENONE (nsMRA) CHO ĐTĐ TÍP 2 KÈM CKD CÓ ALBUMIN NIỆU KHI MODULE CKD/HF CHƯA BẬT
  {
    id: 'dm2.outpatient.ckd_finerenone_consider',
    module: 'dm2',
    nameVi: 'Cân nhắc bổ sung Finerenone (nsMRA) bảo vệ thận – tim mạch ở ĐTĐ típ 2 có albumin niệu dai dẳng',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (ctx.patient.selectedModules.includes('ckd') || ctx.patient.selectedModules.includes('hf')) return false;
      if (!hasDm2Context(ctx) || isPregnant(ctx) || isBreastfeeding(ctx) || isActivelyHypoglycemic(ctx) || isOnDialysis(ctx)) return false;
      if (evaluateHyperglycemicCrisis(ctx).isCrisis || hasAcuteCatabolicKetosis(ctx) || hasPlannedSurgery(ctx)) return false;
      if (isOvertreatedFrailDeferral(ctx)) return false;
      const lvef = need(ctx, 'lvef');
      if (hasHf(ctx) && (lvef === undefined || lvef <= thFor('lvef', 'hf.ef.hfref_max_esc2026'))) return false;
      const kSparingIds = ['spironolactone', 'eplerenone', 'amiloride', 'triamterene'];
      if (
        ctx.patient.currentMeds.some((m) =>
          resolveCanonicalDrugIds(m.drugId, m.name).some((id) => kSparingIds.includes(id))
        )
      ) {
        return false;
      }
      const uacr = need(ctx, 'uacr');
      const egfr = getEffectiveEgfr(ctx);
      const k = need(ctx, 'k');
      if (uacr === undefined || uacr < thFor('uacr', 'ckd.uacr.a1_max_mgmmol')) return false;
      if (egfr === undefined || egfr < thFor('egfr', 'dm2.finerenone.egfr_min')) return false;
      if (k !== undefined && k > thFor('k', 'ckd.finerenone.k_uptitrate_max')) return false;
      return true;
    },
    produce: (ctx) => {
      const egfr = getEffectiveEgfr(ctx)!;
      const uacr = need(ctx, 'uacr')!;
      const k = need(ctx, 'k');
      const minEgfr = thFor('egfr', 'dm2.finerenone.egfr_min');
      const kMax = thFor('k', 'ckd.finerenone.k_uptitrate_max');
      const alreadyOnFinerenone = isTakingCanonical(ctx, 'finerenone');

      return {
        id: 'rec_dm2_ckd_finerenone_consider',
        module: 'dm2',
        tier: 'Bảo vệ tim – thận nền tảng',
        tierOrder: 2,
        action: alreadyOnFinerenone ? 'CONTINUE' : 'CONSIDER',
        drugId: 'finerenone',
        drugNameVi: 'Finerenone (Kháng thụ thể Mineralocorticoid không steroid)',
        title: alreadyOnFinerenone
          ? 'Duy trì Finerenone và theo dõi định kỳ Kali máu bảo vệ thận – tim mạch'
          : `Cân nhắc bổ sung Finerenone bảo vệ thận – tim mạch (UACR = ${uacr.toFixed(1)} mg/mmol, eGFR = ${egfr.toFixed(0)})`,
        rationale:
          `ADA 2026 Ch. 11 (Khuyến cáo 11.8 – FIDELIO-DKD / FIGARO-DKD): Ở người bệnh ĐTĐ típ 2 kèm CKD có albumin niệu và eGFR từ ${minEgfr} mL/phút/1.73m² trở lên trên nền RASi tối đa dung nạp, cân nhắc bổ sung Finerenone khi Kali máu không vượt ${kMax.toFixed(1)} mmol/L${k === undefined ? ' (kiểm tra K⁺ trước khi kê)' : ` (hiện K⁺ = ${k.toFixed(1)} mmol/L)`} để giảm tiến triển suy thận và biến cố suy tim.`,
        gates: [],
        citationIds: ['ada.dm2.2026.finerenone_rec_11_8'],
        priority: 83
      };
    },
    citationIds: ['ada.dm2.2026.finerenone_rec_11_8']
  },

  // 2. KIỂM SOÁT HUYẾT ÁP CÁ THỂ HÓA & ƯU TIÊN ACEi/ARB
  {
    id: 'dm2.outpatient.comprehensive_care',
    module: 'dm2',
    nameVi: 'Kiểm soát Huyết áp mục tiêu và lựa chọn nhóm thuốc hạ áp bảo vệ thận',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      hasDm2Context(ctx) &&
      !isPregnant(ctx) &&
      !isActivelyHypoglycemic(ctx) &&
      !evaluateHyperglycemicCrisis(ctx).isCrisis,
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const uacr = need(ctx, 'uacr');
      const hasAlbuminuria = uacr !== undefined && uacr >= thFor('uacr', 'ckd.uacr.a1_max_mgmmol');
      const hasHighCvOrRenalRisk = hasAscvd(ctx) || hasCkd(ctx) || hasHf(ctx) || hasAlbuminuria;

      const targetSbp = ctx.settings.profile === 'VN' && !hasHighCvOrRenalRisk
        ? thFor('sbp', 'htn.bp.sbp_hypertension')
        : thFor('sbp', 'dm2.bp.target_sbp');
      const targetDbp = ctx.settings.profile === 'VN' && !hasHighCvOrRenalRisk
        ? thFor('dbp', 'htn.bp.dbp_hypertension')
        : thFor('dbp', 'dm2.bp.target_dbp');

      const bpUncontrolled =
        (sbp !== undefined && sbp >= targetSbp) ||
        (dbp !== undefined && dbp >= targetDbp);

      const rasiAdvice = hasAlbuminuria || hasCkd(ctx) || hasAscvd(ctx)
        ? 'Ưu tiên nhóm ức chế men chuyển (ACEi) hoặc chẹn thụ thể angiotensin (ARB) liều dung nạp tối đa khi có albumin niệu hoặc bệnh mạch vành.'
        : 'Phối hợp các nhóm thuốc hạ áp chuẩn (ACEi/ARB, chẹn kênh canxi, lợi tiểu thiazide-like) để đạt đích an toàn.';

      return {
        id: 'rec_dm2_comprehensive_care',
        module: 'dm2',
        tier: 'Điều trị đi kèm & Phòng ngừa biến cố',
        tierOrder: 5,
        action: bpUncontrolled ? 'UPTITRATE' : 'CONTINUE',
        title: bpUncontrolled
          ? `Tối ưu hóa Huyết áp đạt đích dưới ${targetSbp}/${targetDbp} mmHg`
          : `Duy trì kiểm soát Huyết áp ổn định (dưới ${targetSbp}/${targetDbp} mmHg)`,
        rationale: `ADA 2026 Ch. 10 & BYT 5481/2020: Kiểm soát huyết áp đạt đích dưới ${targetSbp}/${targetDbp} mmHg giúp giảm đột quỵ, biến cố mạch vành và biến chứng thận. ${rasiAdvice}`,
        gates: [],
        citationIds: ['ada.dm2.2026.bp_target', 'byt.dm2.2020.bp_target'],
        priority: 76,
        profileDiff: {
          INTL: `ADA 2026: Đích huyết áp dưới ${thFor('sbp', 'dm2.bp.target_sbp')}/${thFor('dbp', 'dm2.bp.target_dbp')} mmHg cho đa số bệnh nhân ĐTĐ nếu đạt được an toàn.`,
          VN: `BYT 5481/2020 Bảng 4: Đích huyết áp dưới ${thFor('sbp', 'htn.bp.sbp_hypertension')}/${thFor('dbp', 'htn.bp.dbp_hypertension')} mmHg chung; nếu có biến chứng thận hoặc nguy cơ tim mạch xơ vữa cao đích dưới ${thFor('sbp', 'dm2.bp.target_sbp')}/${thFor('dbp', 'dm2.bp.target_dbp')} mmHg.`,
          US: `ADA Standards of Care 2026 Ch. 10: Đích huyết áp dưới ${thFor('sbp', 'dm2.bp.target_sbp')}/${thFor('dbp', 'dm2.bp.target_dbp')} mmHg nếu dung nạp an toàn.`
        }
      };
    },
    citationIds: ['ada.dm2.2026.bp_target', 'byt.dm2.2020.bp_target']
  },

  // 3. TẦM SOÁT ĐỊNH KỲ BIẾN CHỨNG (MẮT, CHÂN, THẬN, TIÊM CHỦNG)
  {
    id: 'dm2.outpatient.screening_checklist',
    module: 'dm2',
    nameVi: 'Tầm soát định kỳ biến chứng mắt, bàn chân, thận và tiêm chủng',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      hasDm2Context(ctx) &&
      !isPregnant(ctx) &&
      !isActivelyHypoglycemic(ctx) &&
      !evaluateHyperglycemicCrisis(ctx).isCrisis,
    produce: (ctx) => {
      const onMetformin = isTakingCanonical(ctx, 'metformin');
      const b12Note = onMetformin
        ? '; kiểm tra định kỳ Vitamin B12 khi dùng Metformin kéo dài (đặc biệt nếu có thiếu máu hoặc tê bì ngoại biên)'
        : '';
      return {
        id: 'rec_dm2_screening_checklist',
        module: 'dm2',
        tier: 'Tầm soát biến chứng định kỳ',
        tierOrder: 6,
        action: 'MONITOR',
        title: 'Tầm soát định kỳ: Mắt giãn đồng tử · Bàn chân toàn diện · UACR thận · Tiêm chủng' + (onMetformin ? ' · Vitamin B12' : ''),
        rationale:
          `ADA 2026 Ch. 11–12: Khám mắt giãn đồng tử phát hiện bệnh võng mạc ĐTĐ; khám bàn chân toàn diện hàng năm phát hiện nguy cơ loét/đoạn chi; định lượng UACR và eGFR ít nhất hàng năm; tiêm chủng cúm, phế cầu, viêm gan B${b12Note}.`,
        gates: [],
        citationIds: ['ada.dm2.2026.eye_exam_annual', 'ada.dm2.2026.foot_exam_annual', 'ada.dm2.2026.ckd_screening_annual'],
        priority: 60
      };
    },
    citationIds: ['ada.dm2.2026.eye_exam_annual', 'ada.dm2.2026.foot_exam_annual', 'ada.dm2.2026.ckd_screening_annual']
  }
];
