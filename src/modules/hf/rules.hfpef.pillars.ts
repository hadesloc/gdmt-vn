import type { Action, GateResult, Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  ALL_MRA_IDS,
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteKidneyInjury,
  hasHfContext,
  hasPriorAngioedema,
  hasStableAsthmaHistory,
  isAcutelyDecompensated,
  isAtOrAboveTargetDose,
  isLactating,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  parseHfDailyDoseMg,
  resolveMatchedComponentId,
  SGLT2I_IDS,
  STRONG_CYP3A4_IDS,
} from './helpers';
import { evaluateHfSglt2i } from './helpers.sglt2i';

export const hfpefPillarRules: Rule[] = [
  {
    id: 'hf.hfpef.sglt2i',
    module: 'hf',
    nameVi: 'Trụ cột SGLT2i ở HFmrEF / HFpEF / HFimpEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.sglt2i_doses_table11', 'aha.hf.2022.hfmref_2b'],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      if (ctx.settings.setting === 'inpatient' && isAcutelyDecompensated(ctx) && !findCurrentMed(ctx, SGLT2I_IDS)) return false;
      const p = getHfPhenotype(ctx);
      return p === 'hfmref' || p === 'hfpef' || p === 'hfimpef';
    },
    produce: (ctx) =>
      evaluateHfSglt2i(
        ctx,
        'Trụ cột FMT (Class I)',
        'SGLT2i được khuyến cáo Class I-A (ESC 2026 / ACC 2026) cho bệnh nhân HFpEF/HFmrEF nhằm giảm nhập viện suy tim và tử vong tim mạch.',
        ['esc.hf.2026.sglt2i_all_lvef', 'aha.hf.2022.hfmref_2b']
      ),
  },
  {
    id: 'hf.hfpef.finerenone_mra',
    module: 'hf',
    nameVi: 'MRA (Finerenone / Spironolactone) ở HFmrEF & HFpEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.mra_all_lvef',
      'esc.hf.2026.table_11_finerenone_doses',
      'esc.hf.2026.finerenone_doses_footnote_g',
      'acc.hfpef.2026.finerenone',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      const activeMra = findCurrentMed(ctx, ALL_MRA_IDS);
      if (ctx.settings.setting === 'inpatient' && isAcutelyDecompensated(ctx) && !activeMra) return false;
      const p = getHfPhenotype(ctx);
      return p === 'hfmref' || p === 'hfpef';
    },
    produce: (ctx) => {
      const activeMra = findCurrentMed(ctx, ALL_MRA_IDS);
      const matchedMraId = resolveMatchedComponentId(activeMra, ALL_MRA_IDS);
      const hasStrongCyp3a4 = Boolean(findCurrentMed(ctx, STRONG_CYP3A4_IDS));
      const defaultNaiveMra =
        hasStrongCyp3a4 || ctx.settings.profile === 'VN' ? 'spironolactone' : 'finerenone';
      const mraId = matchedMraId ?? defaultNaiveMra;
      const isFin = mraId === 'finerenone';
      const cits = [
        'esc.hf.2026.mra_all_lvef',
        'esc.hf.2026.table_11_finerenone_doses',
        'esc.hf.2026.finerenone_doses_footnote_g',
        'esc.hf.2026.mra_guidance_table_s8',
        'acc.hfpef.2026.finerenone',
        'byt.2022.hf_4pillars',
      ];
      const childPugh = getChildPugh(ctx);
      const lactBlocked = isLactating(ctx) && isFin;

      if (isPregnant(ctx) || lactBlocked || isOnDialysis(ctx) || childPugh === 'C' || (isFin && hasStrongCyp3a4)) {
        const why = isPregnant(ctx)
          ? 'đang mang thai'
          : lactBlocked
            ? 'đang cho con bú (tránh dùng Finerenone trong thời gian cho con bú và 1 ngày sau liều cuối)'
            : childPugh === 'C'
              ? 'suy gan nặng / xơ gan mất bù Child-Pugh C'
              : isOnDialysis(ctx)
                ? 'đang lọc máu'
                : 'dùng chung thuốc ức chế mạnh CYP3A4';
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: activeMra ? 'STOP' : 'AVOID',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `${activeMra ? 'Ngưng ngay' : 'Chống chỉ định'} ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)}`,
          rationale: `Không sử dụng ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do ${why}.`,
          gates: [{ parameter: 'An toàn MRA', passed: false, messageVi: why }],
          citationIds: isPregnant(ctx) ? ['esc.hf.2026.pregnancy_contra', ...cits] : cits,
          priority: 95,
        };
      }

      if (isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx)) {
        const why = isShockOrInotrope(ctx) ? 'sốc tim / tụt huyết áp' : 'đang có tổn thương thận cấp (AKI)';
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `Tạm hoãn ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do ${why}`,
          rationale: `Tạm ngưng MRA khi ${why}; đánh giá dùng lại khi huyết động và chức năng thận ổn định.`,
          gates: [{ parameter: 'Huyết động / AKI', passed: false, messageVi: why }],
          citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', ...cits],
          priority: 94,
        };
      }

      const k = need(ctx, 'k');
      if (k === undefined) return missingInputRec('hf', 'k', 'kiểm tra kali máu trước khi chỉ định MRA ở HFmrEF/HFpEF', cits);
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) return missingInputRec('hf', 'egfr', 'kiểm tra eGFR để phân tầng liều Finerenone / MRA', cits);
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi chỉ định MRA', cits);

      const sbpMin = thFor('sbp', 'hf.acute.shock_sbp');
      const smraEgfr = thFor('egfr', 'hf.mra.egfr_min_initiate');
      const finEfMin = thFor('lvef', 'hf.finerenone.lvef_min');
      const kInit = thFor('k', 'hf.mra.k_max_initiate');
      const kHalve = thFor('k', 'hf.mra.k_halve_dose');
      const kStop = thFor('k', 'hf.mra.k_stop');
      const finLow = thFor('dose_mg', 'hf.finerenone.start_low_dose_mg');
      const finMid = thFor('dose_mg', 'hf.finerenone.start_high_or_target_low_dose_mg');
      const finHigh = thFor('dose_mg', 'hf.finerenone.target_high_dose_mg');
      const finCut = thFor('egfr', 'hf.finerenone.egfr_high_dose_cutoff');

      const egfrInitMin = isFin ? thFor('egfr', 'hf.finerenone.egfr_min_initiate') : smraEgfr;
      const egfrContMin = isFin ? thFor('egfr', 'hf.finerenone.egfr_stop_min') : smraEgfr;
      const gates: GateResult[] = [
        { parameter: 'K+', passed: activeMra ? k <= kHalve : k <= kInit, value: k, threshold: activeMra ? `<= ${kHalve}` : `<= ${kInit}`, messageVi: 'Ngưỡng K+ an toàn' },
        { parameter: 'eGFR', passed: activeMra ? egfr >= egfrContMin : egfr >= egfrInitMin, value: egfr, threshold: `>= ${activeMra ? egfrContMin : egfrInitMin}`, messageVi: 'Ngưỡng thận MRA' },
      ];

      if (sbp < sbpMin) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `Tạm hoãn ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do SBP dưới ${sbpMin} mmHg`,
          rationale: `Cần ổn định SBP từ ${sbpMin} mmHg trở lên.`,
          gates,
          citationIds: cits,
          priority: 89,
        };
      }

      if ((activeMra && egfr < egfrContMin) || (!activeMra && egfr < egfrInitMin) || k >= kStop) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: activeMra ? 'STOP' : 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `${activeMra ? 'Ngưng' : 'Tạm hoãn khởi trị'} ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do chức năng thận hoặc tăng kali máu`,
          rationale: `Không khởi trị ${getDrugDisplayVi(mraId)} khi eGFR dưới ${egfrInitMin} mL/phút/1,73m² hoặc K+ từ ${kStop} mmol/L trở lên.`,
          gates,
          citationIds: cits,
          priority: 93,
        };
      }

      if (k > kHalve) {
        const curFinMg = activeMra && isFin ? parseHfDailyDoseMg(activeMra, 'finerenone') : undefined;
        const onLowestFin = Boolean(activeMra && isFin && curFinMg !== undefined && curFinMg <= finLow);
        const kAct: Action = !activeMra || onLowestFin ? 'HOLD' : 'REDUCE';
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: kAct,
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: kAct === 'REDUCE'
            ? `Giảm bậc liều ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do K+ tăng (${k} mmol/L)`
            : `Tạm ngưng / hoãn ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do K+ trên ${kHalve} mmol/L`,
          rationale: onLowestFin
            ? `Bệnh nhân đang ở liều thấp nhất của Finerenone (${finLow} mg/ngày) mà K+ > ${kHalve} mmol/L: bắt buộc tạm ngưng (HOLD) cho tới khi K+ <= ${kInit} mmol/L.`
            : `Giảm liều hoặc tạm ngưng khi kali máu trên ${kHalve} mmol/L và cân nhắc thuốc gắn kali thế hệ mới.`,
          gates,
          citationIds: ['esc.hf.2026.potassium_binders', ...cits],
          priority: 91,
        };
      }

      if (k > kInit) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: activeMra ? 'CONTINUE' : 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          dose: activeMra ? formatCurrentMedDoseVi(activeMra, mraId) : undefined,
          title: activeMra
            ? `Duy trì liều hiện tại ${getDrugDisplayVi(activeMra.drugId, activeMra)} (không tăng liều khi K+ > ${kInit} mmol/L)`
            : `Tạm hoãn khởi trị mới ${getDrugDisplayVi(mraId)} do K+ trên ${kInit} mmol/L`,
          rationale: `Chỉ khởi trị mới hoặc tăng bậc liều khi K+ không vượt quá ${kInit} mmol/L.`,
          gates,
          citationIds: cits,
          priority: 86,
        };
      }

      if (!activeMra && isOutpatientDecompensatedCrisis(ctx)) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột MRA ở HFmrEF/HFpEF',
          tierOrder: 1,
          action: 'DEFER',
          drugId: mraId,
          drugNameVi: getDrugDisplayVi(mraId),
          title: 'Trì hoãn khởi trị mới MRA ngoại trú cho tới khi ổn định đợt mất bù cấp',
          rationale: 'Chuyển nhập viện xử trí sung huyết cấp ổn định trước.',
          gates,
          citationIds: cits,
          priority: 84,
        };
      }

      const doseText = isFin
        ? egfr >= finCut
          ? `${finMid} mg x 1 lần/ngày (đích ${finHigh} mg x 1 lần/ngày sau 4 tuần nếu K+ ổn định)`
          : `${finLow} mg x 1 lần/ngày (đích ${finMid} mg x 1 lần/ngày)`
        : formatHfDose(dose(mraId, 'start'));

      const act: Action = activeMra
        ? isAtOrAboveTargetDose(ctx, activeMra, mraId)
          ? 'CONTINUE'
          : 'UPTITRATE'
        : ctx.settings.profile === 'INTL'
          ? 'START'
          : 'CONSIDER';

      const ckdSelected = Boolean(ctx.patient.selectedModules?.includes('ckd') || hasCondition(ctx, 'ckd'));
      const warnings =
        isFin && egfr >= finCut && ckdSelected
          ? [`Lưu ý liều đích Finerenone theo chỉ định: trong suy tim LVEF >= ${finEfMin}% kèm eGFR >= ${finCut} (FINEARTS-HF), liều đích là ${finHigh} mg/ngày (cao hơn trần ${finMid} mg/ngày của chỉ định bệnh thận ĐTĐ đơn thuần FIDELIO-DKD).`]
          : undefined;

      return {
        id: 'rec_hf_mra',
        module: 'hf',
        tier: ctx.settings.profile === 'INTL' ? 'Trụ cột FMT (Class I - ESC 2026)' : 'Điều trị MRA ở HFmrEF/HFpEF (Class IIa/IIb)',
        tierOrder: 1,
        action: act,
        drugId: activeMra?.drugId ?? mraId,
        drugNameVi: isFin ? `Finerenone (hoặc Spironolactone khi eGFR >= ${smraEgfr})` : getDrugDisplayVi(mraId, activeMra),
        dose: act === 'CONTINUE' ? formatCurrentMedDoseVi(activeMra, mraId) : doseText,
        title: act === 'START'
          ? `Khởi trị MRA không steroid: ${getDrugDisplayVi(mraId)}`
          : act === 'CONSIDER'
            ? `Xem xét bổ sung ${getDrugDisplayVi(mraId)} giảm nhập viện suy tim`
            : `Tiếp tục / chuẩn độ ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)}`,
        rationale: `Thử nghiệm FINEARTS-HF và ESC 2026 chứng minh MRA (đặc biệt Finerenone ở LVEF >= ${finEfMin}%) giúp giảm nhập viện suy tim và biến cố tim mạch.`,
        gates,
        warnings,
        profileDiff: {
          INTL: 'ESC 2026 nâng MRA (Finerenone / sMRA) lên khuyến cáo Class I, Mức A xuyên suốt mọi phân suất tống máu.',
          US: `ACC 2026 ECDP & FDA phê duyệt Finerenone cho suy tim có LVEF >= ${finEfMin}% (Class 2a); Spironolactone ở mức Class 2b.`,
          VN: 'BYT QĐ 1857/2022 xếp MRA (Spironolactone) ở mức Class IIb cho HFmrEF và HFpEF.',
        },
        citationIds: cits,
        priority: 88,
      };
    },
  },
  {
    id: 'hf.hfmref.neurohormonal',
    module: 'hf',
    nameVi: 'Cân nhắc ARNI/ACEi/ARB và Chẹn beta ở HFmrEF (US / VN)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.hfref_redefined_lt50', 'esc.hf.2026.new_concept_hfref_expanded', 'aha.hf.2022.hfmref_2b', 'byt.2022.hf_4pillars'],
    when: (ctx) => hasHfContext(ctx) && getHfPhenotype(ctx) === 'hfmref' && !isPregnant(ctx) && !isOutpatientDecompensatedCrisis(ctx),
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp'), hr = need(ctx, 'hr'), k = need(ctx, 'k'), egfr = need(ctx, 'egfr');
      if (sbp === undefined || hr === undefined || k === undefined || egfr === undefined) return null;
      if (
        sbp < thFor('sbp', 'hf.arni.sbp_min_start') ||
        hr < thFor('hr', 'hf.bb.hr_min_start') ||
        k > thFor('k', 'hf.arni.k_max_hold') ||
        egfr < thFor('egfr', 'hf.arni.egfr_esrd_min')
      ) {
        return null;
      }
      const efEsc = thFor('lvef', 'hf.ef.hfref_max_esc2026');
      const bbNote = hasStableAsthmaHistory(ctx)
        ? 'chẹn beta chọn lọc beta-1 (Bisoprolol hoặc Metoprolol succinate) thận trọng dưới giám sát chuyên khoa'
        : 'chẹn beta suy tim (Bisoprolol / Metoprolol succinate / Carvedilol)';
      const rasiNote = hasPriorAngioedema(ctx)
        ? 'ARB thận trọng (tránh ACEi/ARNI do phù mạch)'
        : 'ARNI (Sacubitril/valsartan) hoặc ACEi/ARB';
      return {
        id: 'rec_hf_hfmref_neurohormonal',
        module: 'hf',
        tier: 'Điều hòa thần kinh thể dịch ở HFmrEF (Class 2b / IIb)',
        tierOrder: 2,
        action: 'CONSIDER',
        title: `Xem xét phối hợp ${rasiNote} và ${bbNote} ở HFmrEF (LVEF 41–49%)`,
        rationale: `Ở phân nhóm HFmrEF (theo AHA/ACC 2022 & BYT 1857), ngoài SGLT2i và MRA, có thể cân nhắc ${rasiNote} và ${bbNote} nhất là khi kèm tăng huyết áp, bệnh mạch vành hoặc rung nhĩ.`,
        gates: [],
        profileDiff: {
          INTL: `ESC 2026 xóa bỏ HFmrEF và xếp toàn bộ LVEF dưới ${efEsc}% vào HFrEF với chỉ định đầy đủ 4 trụ cột FMT (Class I-A).`,
          US: 'AHA/ACC/HFSA 2022 xếp ARNI, ACEi, ARB và chẹn beta ở mức COR 2b (LOE B-NR) cho HFmrEF.',
          VN: 'BYT QĐ 1857/2022 xếp ACEi/ARB/ARNI và chẹn beta ở mức Class IIb cho HFmrEF.',
        },
        citationIds: ['esc.hf.2026.hfref_redefined_lt50', 'esc.hf.2026.new_concept_hfref_expanded', 'aha.hf.2022.hfmref_2b', 'byt.2022.hf_4pillars'],
        priority: 75,
      };
    },
  },
];
