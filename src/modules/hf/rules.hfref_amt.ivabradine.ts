import type { Action, Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getCongestionStatus,
  getCustomInput,
  getDrugDisplayVi,
  hasHfContext,
  hasStableAsthmaHistory,
  hasUnpacedConductionBlock,
  HF_BB_IDS,
  isAcutelyDecompensated,
  isAtOrAboveTargetDose,
  isLactating,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  NDHP_CCB_IDS,
  parseHfDailyDoseMg,
  STRONG_CYP3A4_IDS,
} from './helpers';

export const hfrefAmtIvabradineRules: Rule[] = [
  {
    id: 'hf.amt.ivabradine',
    module: 'hf',
    nameVi: 'Ivabradine (ức chế kênh If) ở HFrEF nhịp xoang',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.ivabradine_rec',
      'esc.hf.2026.ivabradine_bb_intolerant',
      'esc.hf.2026.amt_doses_table11',
      'fda.hf.ivabradine_dosing_table1',
      'fda.hf.ivabradine_contra',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      if (findCurrentMed(ctx, ['ivabradine'])) return true;
      if (ctx.settings.setting !== 'outpatient') return false;
      if (isAcutelyDecompensated(ctx) || getCongestionStatus(ctx) === 'overt' || isOutpatientDecompensatedCrisis(ctx)) return false;
      const lvef = need(ctx, 'lvef'), hr = need(ctx, 'hr'), sbp = need(ctx, 'sbp'), nyha = need(ctx, 'nyha');
      if (lvef === undefined || hr === undefined || sbp === undefined || nyha === undefined) return false;
      if (
        ctx.patient.rhythm !== 'sinus' ||
        lvef > thFor('lvef', 'hf.ivabradine.ef_max') ||
        hr < thFor('hr', 'hf.ivabradine.hr_min') ||
        nyha < 2 ||
        sbp < thFor('sbp', 'hf.bb.sbp_min_start')
      ) {
        return false;
      }
      if (isPregnant(ctx) || isLactating(ctx) || getChildPugh(ctx) === 'C' || hasUnpacedConductionBlock(ctx)) return false;
      if (Boolean(findCurrentMed(ctx, STRONG_CYP3A4_IDS)) || Boolean(findCurrentMed(ctx, NDHP_CCB_IDS))) return false;
      const activeBb = findCurrentMed(ctx, HF_BB_IDS);
      return (
        isAtOrAboveTargetDose(ctx, activeBb) ||
        Boolean(getCustomInput(ctx, 'bbMaxTolerated')) ||
        hasStableAsthmaHistory(ctx)
      );
    },
    produce: (ctx) => {
      const activeIva = findCurrentMed(ctx, ['ivabradine']);
      const cits = [
        'esc.hf.2026.ivabradine_rec',
        'esc.hf.2026.ivabradine_bb_intolerant',
        'esc.hf.2026.amt_doses_table11',
        'fda.hf.ivabradine_dosing_table1',
        'fda.hf.ivabradine_contra',
        'fda.hf.ivabradine_low_dose_2_5mg',
      ];
      const onNdhpCcb = findCurrentMed(ctx, NDHP_CCB_IDS);
      const onStrongCyp = findCurrentMed(ctx, STRONG_CYP3A4_IDS);
      const childPugh = getChildPugh(ctx);

      if (
        activeIva &&
        (isPregnant(ctx) ||
          isLactating(ctx) ||
          childPugh === 'C' ||
          hasUnpacedConductionBlock(ctx) ||
          Boolean(onStrongCyp) ||
          Boolean(onNdhpCcb) ||
          (ctx.patient.rhythm !== undefined && ctx.patient.rhythm !== 'sinus'))
      ) {
        const why = isPregnant(ctx) || isLactating(ctx)
          ? 'mang thai / cho con bú'
          : childPugh === 'C'
            ? 'suy gan nặng Child-Pugh C'
            : onNdhpCcb
              ? `phối hợp ${getDrugDisplayVi(onNdhpCcb.drugId, onNdhpCcb)} (tăng phơi nhiễm Ivabradine và gây chậm nhịp nặng)`
              : onStrongCyp
                ? 'dùng chung thuốc ức chế mạnh CYP3A4'
                : hasUnpacedConductionBlock(ctx)
                  ? 'block nhĩ-thất độ cao / suy nút xoang chưa đặt máy tạo nhịp'
                  : 'mất nhịp xoang (chuyển sang rung nhĩ / nhịp máy tạo nhịp)';
        return {
          id: 'rec_hf_ivabradine',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (An toàn Ivabradine)',
          tierOrder: 1,
          action: 'STOP',
          drugId: 'ivabradine',
          drugNameVi: getDrugDisplayVi('ivabradine'),
          title: `Ngưng ngay Ivabradine do chống chỉ định (${why})`,
          rationale: `Không được tiếp tục Ivabradine do ${why} (theo nhãn FDA Corlanor và ESC 2026).`,
          gates: [{ parameter: 'Chống chỉ định Ivabradine', passed: false, messageVi: why }],
          citationIds: ['fda.hf.ivabradine_verapamil_diltiazem', 'fda.hf.ivabradine_hepatic', ...cits],
          priority: 95,
        };
      }

      if (activeIva && (isShockOrInotrope(ctx) || isAcutelyDecompensated(ctx) || getCongestionStatus(ctx) === 'overt')) {
        return {
          id: 'rec_hf_ivabradine',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (An toàn nội viện / mất bù cấp)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'ivabradine',
          drugNameVi: getDrugDisplayVi('ivabradine'),
          title: 'Tạm ngưng Ivabradine trong đợt suy tim mất bù cấp / sốc tim',
          rationale: 'Theo nhãn FDA Corlanor, chống chỉ định dùng Ivabradine trong suy tim mất bù cấp vì tần số xoang lúc này mang tính bù trừ cung lượng tim.',
          gates: [{ parameter: 'Suy tim mất bù cấp', passed: false, messageVi: 'Tạm ngưng trong đợt mất bù cấp' }],
          citationIds: cits,
          priority: 93,
        };
      }

      if (ctx.patient.rhythm === undefined) {
        return missingInputRec('hf', 'rhythm', 'xác nhận nhịp xoang trên ECG trước khi duy trì hoặc chuẩn độ Ivabradine', cits);
      }
      const hr = need(ctx, 'hr');
      if (hr === undefined) {
        return missingInputRec('hf', 'hr', 'kiểm tra tần số tim lúc nghỉ trước khi duy trì hoặc chỉnh liều Ivabradine', cits);
      }
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) {
        return missingInputRec('hf', 'sbp', 'kiểm tra huyết áp tâm thu trước khi duy trì hoặc chỉnh liều Ivabradine', cits);
      }

      const sbpMin = thFor('sbp', 'hf.bb.sbp_min_start');
      const hrReduce = thFor('hr', 'hf.bb.hr_min_start');
      const hrMaintainMax = thFor('hr', 'hf.ivabradine.hr_target_max');
      const lowStart = thFor('dose_mg', 'hf.ivabradine.low_start_dose_mg');

      if (activeIva) {
        if (sbp < sbpMin) {
          return {
            id: 'rec_hf_ivabradine',
            module: 'hf',
            tier: 'Điều trị bổ trợ AMT (Class IIa)',
            tierOrder: 2,
            action: 'HOLD',
            drugId: 'ivabradine',
            drugNameVi: getDrugDisplayVi('ivabradine'),
            title: `Tạm hoãn Ivabradine do huyết áp tâm thu thấp (${sbp} mmHg)`,
            rationale: `Tạm ngưng Ivabradine khi SBP dưới ${sbpMin} mmHg.`,
            gates: [{ parameter: 'SBP', passed: false, value: sbp, threshold: `>= ${sbpMin}`, messageVi: `SBP < ${sbpMin} mmHg` }],
            citationIds: cits,
            priority: 90,
          };
        }

        if (hr < hrReduce) {
          const curDaily = parseHfDailyDoseMg(activeIva, 'ivabradine');
          const onLowestDose = curDaily !== undefined && curDaily <= lowStart * 2;
          return {
            id: 'rec_hf_ivabradine',
            module: 'hf',
            tier: 'Điều trị bổ trợ AMT (Class IIa)',
            tierOrder: 2,
            action: onLowestDose ? 'STOP' : 'REDUCE',
            drugId: 'ivabradine',
            drugNameVi: getDrugDisplayVi('ivabradine'),
            dose: onLowestDose ? undefined : `Giảm xuống ${lowStart} mg x 2 lần/ngày`,
            title: onLowestDose
              ? `Ngưng Ivabradine do nhịp tim dưới ${hrReduce} chu kỳ/phút dù đang ở liều thấp nhất`
              : `Giảm liều Ivabradine do nhịp tim dưới ${hrReduce} chu kỳ/phút (${hr} bpm)`,
            rationale: `Theo bảng chỉnh liều Ivabradine, khi HR lúc nghỉ < ${hrReduce} bpm cần giảm một bậc liều (hoặc ngưng thuốc nếu đang dùng ${lowStart} mg x 2 lần/ngày).`,
            gates: [{ parameter: 'HR', passed: false, value: hr, threshold: `>= ${hrReduce}`, messageVi: `HR < ${hrReduce} bpm` }],
            citationIds: cits,
            priority: 91,
          };
        }

        const holdAtGoal = hr <= hrMaintainMax || isAtOrAboveTargetDose(ctx, activeIva, 'ivabradine');
        const actIva: Action = holdAtGoal ? 'CONTINUE' : 'UPTITRATE';
        return {
          id: 'rec_hf_ivabradine',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (Class IIa)',
          tierOrder: 2,
          action: actIva,
          drugId: 'ivabradine',
          drugNameVi: getDrugDisplayVi('ivabradine'),
          dose: actIva === 'CONTINUE'
            ? formatCurrentMedDoseVi(activeIva, 'ivabradine')
            : `Tăng lên tối đa ${formatHfDose(dose('ivabradine', 'target'))} để đạt HR ${hrReduce}–${hrMaintainMax} bpm`,
          title: actIva === 'CONTINUE'
            ? `Duy trì liều hiện tại Ivabradine (nhịp xoang ${hr} bpm đạt mục tiêu ${hrReduce}–${hrMaintainMax} bpm)`
            : `Chuẩn độ tăng liều Ivabradine (nhịp xoang còn > ${hrMaintainMax} bpm)`,
          rationale: `Chỉ tăng liều Ivabradine khi nhịp xoang lúc nghỉ còn trên ${hrMaintainMax} bpm; giữ nguyên liều hiện tại khi HR nằm trong khoảng mục tiêu ${hrReduce}–${hrMaintainMax} bpm.`,
          gates: [{ parameter: 'HR', passed: true, value: hr, threshold: `${hrReduce}–${hrMaintainMax} bpm`, messageVi: `HR ${hr} bpm` }],
          citationIds: cits,
          priority: 80,
        };
      }

      const age = need(ctx, 'age');
      const efMax = thFor('lvef', 'hf.ivabradine.ef_max');
      const hrMin = thFor('hr', 'hf.ivabradine.hr_min');
      const useLow = age !== undefined && age >= thFor('age', 'hf.ivabradine.elderly_age_min');
      return {
        id: 'rec_hf_ivabradine',
        module: 'hf',
        tier: 'Điều trị bổ trợ AMT (Class IIa)',
        tierOrder: 2,
        action: 'CONSIDER',
        drugId: 'ivabradine',
        drugNameVi: getDrugDisplayVi('ivabradine'),
        dose: useLow
          ? `${lowStart} mg x 2 lần/ngày (cùng bữa ăn); tối đa ${formatHfDose(dose('ivabradine', 'target'))}`
          : `${formatHfDose(dose('ivabradine', 'start'))}; tối đa ${formatHfDose(dose('ivabradine', 'target'))}`,
        title: 'Xem xét bổ sung Ivabradine kiểm soát tần số xoang',
        rationale: `Ở bệnh nhân HFrEF (LVEF <= ${efMax}%) nhịp xoang có tần số lúc nghỉ >= ${hrMin} chu kỳ/phút dù đã đạt liều chẹn beta tối đa dung nạp (hoặc chống chỉ định chẹn beta), Ivabradine giúp giảm nhập viện suy tim (Class IIa-B).`,
        gates: [],
        citationIds: cits,
        priority: 78,
      };
    },
  },
];
