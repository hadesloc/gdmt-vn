import type { Action, GateResult, Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  ALL_MRA_IDS,
  findAllCurrentMeds,
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getCustomInput,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteKidneyInjury,
  hasHfContext,
  isAcutelyDecompensated,
  isAtOrAboveTargetDose,
  isLactating,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  MODERATE_CYP3A4_IDS,
  parseHfDailyDoseMg,
  resolveMatchedComponentId,
  SMRA_IDS,
  STRONG_CYP3A4_IDS,
} from './helpers';

export const hfrefMraRules: Rule[] = [
  {
    id: 'hf.fmt.mra_duplicate_stop',
    module: 'hf',
    nameVi: 'Ngưng trùng lặp hai thuốc đối kháng thụ thể mineralocorticoid (MRA)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.mra_guidance_table_s8'],
    when: (ctx) => hasHfContext(ctx) && findAllCurrentMeds(ctx, ALL_MRA_IDS).length >= 2,
    produce: (ctx) => {
      const mras = findAllCurrentMeds(ctx, ALL_MRA_IDS);
      const dup = mras[1];
      if (!dup) return null;
      const disp = getDrugDisplayVi(dup.drugId, dup);
      return {
        id: 'rec_hf_stop_duplicate_mra',
        module: 'hf',
        tier: 'An toàn thuốc (Chống trùng lặp MRA)',
        tierOrder: 0,
        action: 'STOP',
        drugId: dup.drugId,
        drugNameVi: disp,
        title: `Ngưng ngay ${disp}: Chống chỉ định phối hợp hai thuốc MRA cùng lúc`,
        rationale: 'Phối hợp hai thuốc đối kháng mineralocorticoid (ví dụ Spironolactone + Finerenone/Eplerenone) gây tăng kali máu nguy kịch đe dọa tính mạng.',
        gates: [{ parameter: 'Trùng lặp MRA', passed: false, messageVi: 'Đang dùng >= 2 thuốc MRA' }],
        citationIds: ['esc.hf.2026.mra_guidance_table_s8'],
        priority: 99,
      };
    },
  },
  {
    id: 'hf.fmt.mra',
    module: 'hf',
    nameVi: 'Trụ cột MRA ở HFrEF & HFimpEF (Spironolactone / Eplerenone)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.mra_all_lvef', 'esc.hf.2026.mra_doses', 'esc.hf.2026.mra_guidance_table_s8'],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      const activeMra = findCurrentMed(ctx, ALL_MRA_IDS);
      if (ctx.settings.setting === 'inpatient' && isAcutelyDecompensated(ctx) && !activeMra) return false;
      if (need(ctx, 'lvef') === undefined) return true;
      const p = getHfPhenotype(ctx);
      return p === 'hfref' || (p === 'hfimpef' && Boolean(activeMra));
    },
    produce: (ctx) => {
      const activeMra = findCurrentMed(ctx, ALL_MRA_IDS);
      const matchedMraId = resolveMatchedComponentId(activeMra, ALL_MRA_IDS);
      const gynecomastia = Boolean(getCustomInput(ctx, 'spironolactoneGynecomastia'));
      const hasStrongCyp3a4 = Boolean(findCurrentMed(ctx, STRONG_CYP3A4_IDS));
      const hasModCyp3a4 = Boolean(findCurrentMed(ctx, MODERATE_CYP3A4_IDS));
      const lvef = need(ctx, 'lvef');

      let mraId = matchedMraId ?? (gynecomastia && !hasStrongCyp3a4 ? 'eplerenone' : 'spironolactone');
      const cits = [
        'esc.hf.2026.mra_all_lvef',
        'esc.hf.2026.mra_doses',
        'esc.hf.2026.mra_guidance_table_s8',
        'fda.hf.spironolactone_egfr_30_50',
      ];
      const childPugh = getChildPugh(ctx);

      if (isPregnant(ctx) || isOnDialysis(ctx) || childPugh === 'C' || (mraId === 'eplerenone' && hasStrongCyp3a4) || (mraId === 'finerenone' && hasStrongCyp3a4)) {
        const why = isPregnant(ctx)
          ? 'đang mang thai (nguy cơ kháng androgen bào thai)'
          : isOnDialysis(ctx)
            ? 'đang lọc máu chu kỳ'
            : childPugh === 'C'
              ? 'suy gan nặng / xơ gan mất bù Child-Pugh C'
              : 'dùng chung thuốc ức chế mạnh CYP3A4';
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeMra ? 'STOP' : 'AVOID',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `${activeMra ? 'Ngưng ngay' : 'Chống chỉ định'} ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)}`,
          rationale: `Không sử dụng ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do ${why}.`,
          gates: [{ parameter: 'An toàn MRA', passed: false, messageVi: why }],
          citationIds: isPregnant(ctx)
            ? ['esc.hf.2026.pregnancy_contra', ...cits]
            : childPugh === 'C'
              ? ['fda.hf.eplerenone_hepatic', ...cits]
              : ['fda.hf.eplerenone_contra_crcl30', ...cits],
          priority: 96,
        };
      }

      if (isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx)) {
        const why = isShockOrInotrope(ctx) ? 'sốc tim / tụt huyết áp' : 'đang có tổn thương thận cấp (AKI)';
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `Tạm hoãn ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do ${why}`,
          rationale: `Cần tạm ngưng MRA khi ${why} để phòng tăng kali máu nguy kịch; đánh giá dùng lại khi thận và huyết động ổn định.`,
          gates: [{ parameter: 'Huyết động / AKI', passed: false, messageVi: why }],
          citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', ...cits],
          priority: 95,
        };
      }

      const k = need(ctx, 'k');
      if (k === undefined) return missingInputRec('hf', 'k', 'kiểm tra kali máu trước khi chỉ định hoặc duy trì MRA', cits);
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) return missingInputRec('hf', 'egfr', 'kiểm tra eGFR trước khi chỉ định hoặc duy trì MRA', cits);
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi chỉ định MRA', cits);
      if (lvef === undefined) return null;

      const kInit = thFor('k', 'hf.mra.k_max_initiate');
      const kHalve = thFor('k', 'hf.mra.k_halve_dose');
      const kStop = thFor('k', 'hf.mra.k_stop');
      const egfrMin = thFor('egfr', 'hf.mra.egfr_min_initiate');
      const egfrCaution = thFor('egfr', 'hf.mra.egfr_caution');
      const sbpMin = thFor('sbp', 'hf.acute.shock_sbp');
      const epleRenalBlocked = mraId === 'eplerenone' ? egfr <= egfrMin : egfr < egfrMin;

      const gates: GateResult[] = [
        { parameter: 'K+', passed: activeMra ? k <= kHalve : k <= kInit, value: k, threshold: activeMra ? `<= ${kHalve}` : `<= ${kInit}`, messageVi: 'K+ an toàn' },
        { parameter: 'eGFR', passed: !epleRenalBlocked, value: egfr, threshold: mraId === 'eplerenone' ? `> ${egfrMin}` : `>= ${egfrMin}`, messageVi: 'eGFR đạt ngưỡng MRA' },
      ];

      if (sbp < sbpMin) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `Tạm hoãn ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do SBP thấp`,
          rationale: `SBP hiện tại (${sbp} mmHg) dưới ngưỡng ${sbpMin} mmHg.`,
          gates,
          citationIds: cits,
          priority: 90,
        };
      }

      if (epleRenalBlocked || k >= kStop) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeMra ? 'STOP' : 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: `${activeMra ? 'Ngưng ngay' : 'Tạm hoãn khởi trị'} ${getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra)} do suy thận nặng hoặc tăng kali máu`,
          rationale: `Chống chỉ định MRA steroid khi eGFR dưới ngưỡng ${egfrMin} mL/phút/1,73m² (Eplerenone chống chỉ định từ <= ${egfrMin}) hoặc K+ từ ${kStop} mmol/L trở lên.`,
          gates,
          citationIds: ['fda.hf.eplerenone_contra_crcl30', ...cits],
          priority: 95,
        };
      }

      if (k > kHalve) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeMra ? 'REDUCE' : 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          title: activeMra
            ? `Giảm nửa liều ${getDrugDisplayVi(activeMra.drugId, activeMra)} do tăng kali máu (${k} mmol/L)`
            : `Tạm hoãn khởi trị ${getDrugDisplayVi(mraId)} do tăng kali máu`,
          rationale: `Khi K+ trên ${kHalve} mmol/L (nhưng dưới ${kStop} mmol/L), cần giảm nửa liều MRA đang dùng (hoặc tạm hoãn nếu chưa dùng) và cân nhắc thuốc gắn kali mới (SZC/Patiromer).`,
          gates,
          citationIds: ['esc.hf.2026.potassium_binders', ...cits],
          priority: 93,
        };
      }

      if (k > kInit) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeMra ? 'CONTINUE' : 'HOLD',
          drugId: activeMra?.drugId ?? mraId,
          drugNameVi: getDrugDisplayVi(activeMra?.drugId ?? mraId, activeMra),
          dose: activeMra ? formatCurrentMedDoseVi(activeMra, mraId) : undefined,
          title: activeMra
            ? `Duy trì liều hiện tại ${getDrugDisplayVi(activeMra.drugId, activeMra)} (không tăng liều)`
            : `Tạm hoãn khởi trị mới ${getDrugDisplayVi(mraId)} do K+ trên ${kInit} mmol/L`,
          rationale: `Chỉ khởi trị mới MRA khi K+ không vượt quá ${kInit} mmol/L.`,
          gates,
          citationIds: cits,
          priority: 89,
        };
      }

      if (!activeMra && isOutpatientDecompensatedCrisis(ctx)) {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'DEFER',
          drugId: mraId,
          drugNameVi: getDrugDisplayVi(mraId),
          title: 'Trì hoãn khởi trị mới MRA ngoại trú cho tới khi nhập viện ổn định đợt mất bù cấp',
          rationale: 'Cần chuyển nhập viện xử trí sung huyết cấp và kiểm soát huyết động/điện giải trước.',
          gates,
          citationIds: cits,
          priority: 83,
        };
      }

      if (isLactating(ctx) && activeMra && mraId !== 'spironolactone') {
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (An toàn cho con bú)',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: 'spironolactone',
          switchFrom: activeMra.drugId,
          drugNameVi: getDrugDisplayVi('spironolactone'),
          dose: formatHfDose(dose('spironolactone', 'start')),
          title: `Chuyển từ ${getDrugDisplayVi(activeMra.drugId, activeMra)} sang Spironolactone an toàn khi cho con bú`,
          rationale: 'Eplerenone và Finerenone thiếu dữ liệu an toàn trên trẻ bú mẹ; Spironolactone có chất chuyển hóa qua sữa mẹ rất thấp và tương thích cho con bú.',
          gates,
          citationIds: ['fda.hf.eplerenone_lactation', ...cits],
          priority: 92,
        };
      }
      if (isLactating(ctx)) mraId = 'spironolactone';

      const finEfMin = thFor('lvef', 'hf.finerenone.lvef_min');
      if (activeMra && mraId === 'finerenone' && lvef < finEfMin) {
        const targetSmra = gynecomastia && !hasStrongCyp3a4 ? 'eplerenone' : 'spironolactone';
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: targetSmra,
          switchFrom: activeMra.drugId,
          drugNameVi: getDrugDisplayVi(targetSmra),
          dose: formatHfDose(dose(targetSmra, 'start')),
          title: `Chuyển từ Finerenone sang ${getDrugDisplayVi(targetSmra)} (sMRA bằng chứng giảm tử vong ở LVEF < ${finEfMin}%)`,
          rationale: `Ở HFrEF có LVEF dưới ${finEfMin}%, Spironolactone và Eplerenone là các MRA steroid đã chứng minh giảm tử vong toàn bộ (RALES, EMPHASIS-HF).`,
          gates,
          citationIds: cits,
          priority: 92,
        };
      }

      if (activeMra && mraId === 'spironolactone' && gynecomastia && !hasStrongCyp3a4 && !isLactating(ctx) && egfr > egfrMin) {
        const epleCap = thFor('dose_mg', 'hf.eplerenone.mod_cyp3a4_max_mg');
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: 'eplerenone',
          switchFrom: activeMra.drugId,
          drugNameVi: getDrugDisplayVi('eplerenone'),
          dose: hasModCyp3a4 || egfr < egfrCaution ? `${epleCap} mg x 1 lần/ngày (tối đa ${epleCap} mg/ngày)` : `${formatHfDose(dose('eplerenone', 'start'))}; đích ${formatHfDose(dose('eplerenone', 'target'))}`,
          title: 'Chuyển từ Spironolactone sang Eplerenone do tác dụng phụ vú to / căng đau tuyến vú',
          rationale: 'Eplerenone chọn lọc cao trên thụ thể mineralocorticoid, tránh tác dụng phụ kháng androgen gây vú to của Spironolactone (Bảng S8 ESC 2026).',
          gates,
          citationIds: ['esc.hf.2026.spironolactone_gynaecomastia_switch', 'fda.hf.eplerenone_mod_cyp3a4_25mg', ...cits],
          priority: 92,
        };
      }

      const epleCap = thFor('dose_mg', 'hf.eplerenone.mod_cyp3a4_max_mg');
      if (activeMra && mraId === 'eplerenone' && hasModCyp3a4) {
        const curDaily = parseHfDailyDoseMg(activeMra, 'eplerenone');
        if (curDaily !== undefined && curDaily > epleCap) {
          return {
            id: 'rec_hf_mra',
            module: 'hf',
            tier: 'Trụ cột FMT (An toàn tương tác CYP3A4)',
            tierOrder: 1,
            action: 'REDUCE',
            drugId: 'eplerenone',
            drugNameVi: getDrugDisplayVi('eplerenone'),
            dose: `Giảm xuống tối đa ${epleCap} mg x 1 lần/ngày`,
            title: `Giảm liều Eplerenone xuống tối đa ${epleCap} mg/ngày do dùng kèm chất ức chế CYP3A4 mức độ vừa`,
            rationale: `Nhãn FDA Inspra quy định không vượt quá ${epleCap} mg Eplerenone mỗi ngày khi phối hợp thuốc ức chế vừa CYP3A4 (Fluconazole, Erythromycin, Verapamil, Diltiazem).`,
            gates,
            citationIds: ['fda.hf.eplerenone_mod_cyp3a4_25mg', ...cits],
            priority: 94,
          };
        }
      }

      const pheno = getHfPhenotype(ctx);
      if (activeMra) {
        const atTarget = isAtOrAboveTargetDose(ctx, activeMra, mraId);
        const act: Action = atTarget || pheno === 'hfimpef' ? 'CONTINUE' : 'UPTITRATE';
        const targetText =
          (mraId === 'eplerenone' && hasModCyp3a4) || ((SMRA_IDS as readonly string[]).includes(mraId) && egfr < egfrCaution)
            ? `${epleCap} mg x 1 lần/ngày`
            : formatHfDose(dose(mraId, 'target'));
        return {
          id: 'rec_hf_mra',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: act,
          drugId: activeMra.drugId,
          drugNameVi: getDrugDisplayVi(activeMra.drugId, activeMra),
          dose: act === 'CONTINUE' ? formatCurrentMedDoseVi(activeMra, mraId) : `Tăng tới đích ${targetText}`,
          title: act === 'UPTITRATE' ? `Chuẩn độ tăng liều ${getDrugDisplayVi(mraId)} tới liều đích` : `Tiếp tục duy trì ${getDrugDisplayVi(activeMra.drugId, activeMra)}`,
          rationale: 'Duy trì hoặc chuẩn độ MRA lên liều đích tối đa dung nạp; kiểm tra K+ và creatinin sau 1–2 tuần và định kỳ.',
          gates,
          citationIds: hasModCyp3a4 ? ['fda.hf.eplerenone_mod_cyp3a4_25mg', ...cits] : cits,
          priority: 92,
        };
      }

      const lowMg = thFor('dose_mg', 'hf.mra.spironolactone_low_start_dose_mg');
      const altMg = thFor('dose_mg', 'hf.mra.spironolactone_g3_alt_day_dose_mg');
      const startDose =
        mraId === 'eplerenone' && hasModCyp3a4
          ? `${epleCap} mg x 1 lần/ngày (tối đa ${epleCap} mg/ngày do ức chế vừa CYP3A4)`
          : egfr < egfrCaution
            ? `${lowMg} mg x 1 lần/ngày (hoặc ${altMg} mg cách ngày; tối đa ${altMg} mg/ngày)`
            : `${formatHfDose(dose(mraId, 'start'))}; đích ${formatHfDose(dose(mraId, 'target'))}`;

      return {
        id: 'rec_hf_mra',
        module: 'hf',
        tier: 'Trụ cột FMT (Class I)',
        tierOrder: 1,
        action: 'START',
        drugId: mraId,
        drugNameVi: mraId === 'eplerenone' ? getDrugDisplayVi('eplerenone') : 'Spironolactone (hoặc Eplerenone)',
        dose: startDose,
        title: `Khởi trị trụ cột MRA: ${getDrugDisplayVi(mraId)}`,
        rationale: 'MRA steroid (Class I-A) giảm mạnh tử vong toàn bộ và nhập viện suy tim ở HFrEF; xét nghiệm lại K+ và eGFR sau 1–2 tuần khởi trị.',
        gates,
        citationIds: hasModCyp3a4 ? ['fda.hf.eplerenone_mod_cyp3a4_25mg', ...cits] : cits,
        priority: 93,
      };
    },
  },
];
