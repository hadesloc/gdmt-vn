import type { Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import { expandDrugComponents } from '../../engine/safety/fdcMap';
import {
  ACEI_IDS,
  ARB_IDS,
  findAllCurrentMeds,
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteKidneyInjury,
  hasDrugAllergy,
  hasHfContext,
  hasPriorAngioedema,
  hasRasiAllergy,
  isAcutelyDecompensated,
  isLactating,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  PDE5I_IDS,
  resolveMatchedComponentId,
  SGLT2I_IDS,
} from './helpers';
import { evaluateHfSglt2i } from './helpers.sglt2i';

const CONCOMITANT_RASI_IDS = [...ACEI_IDS, ...ARB_IDS, 'aliskiren'] as const;

const concomitantRasiStopRules: Rule[] = [0, 1, 2].map((slotIdx) => ({
  id: slotIdx === 0 ? 'hf.fmt.concomitant_rasi_stop' : `hf.fmt.concomitant_rasi_stop_${slotIdx}`,
  module: 'hf',
  nameVi: 'Ngưng ngay ACEi / ARB / Aliskiren (kể cả viên phối hợp SPC) khi đang dùng ARNI',
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  citationIds: ['fda.hf.sacubitril_contra_acei_aliskiren', 'esc.hf.2026.washout_acei_arni_36h', 'acc.hfpef.2026.table5_contra_mtc_arb'],
  when: (ctx) => {
    if (!hasHfContext(ctx) || !findCurrentMed(ctx, ['sacubitril_valsartan'])) return false;
    const list = findAllCurrentMeds(ctx, CONCOMITANT_RASI_IDS).filter(
      (m) => m.drugId.toLowerCase() !== 'sacubitril_valsartan'
    );
    return slotIdx < list.length;
  },
  produce: (ctx) => {
    const list = findAllCurrentMeds(ctx, CONCOMITANT_RASI_IDS).filter(
      (m) => m.drugId.toLowerCase() !== 'sacubitril_valsartan'
    );
    const med = list[slotIdx];
    if (!med) return null;
    const comps = expandDrugComponents(med.drugId);
    const hasAmlo = comps.includes('amlodipine');
    const disp = getDrugDisplayVi(med.drugId, med);
    return {
      id: slotIdx === 0 ? 'rec_hf_stop_concomitant_rasi' : `rec_hf_stop_concomitant_rasi_${slotIdx}`,
      module: 'hf',
      tier: 'An toàn thuốc tối khẩn (Class III - Chống chỉ định tuyệt đối)',
      tierOrder: 0,
      action: 'STOP',
      drugId: med.drugId,
      drugNameVi: disp,
      title: `NGƯNG NGAY ${disp}: Chống chỉ định tuyệt đối phối hợp cùng Sacubitril/valsartan (ARNI)`,
      rationale: `Tuyệt đối không dùng đồng thời ACEi, ARB hoặc Aliskiren (bao gồm viên phối hợp cố định ${disp}) với Sacubitril/valsartan do nguy cơ phù mạch đe dọa tính mạng, tụt huyết áp nặng, suy thận cấp và tăng kali máu.${hasAmlo ? ' Nếu cần kiểm soát huyết áp, tách sang viên Amlodipine đơn chất độc lập.' : ''}`,
      gates: [{ parameter: 'Trùng lặp ức chế hệ RAA + ARNI', passed: false, messageVi: `Chống chỉ định dùng ${disp} cùng ARNI` }],
      citationIds: ['fda.hf.sacubitril_contra_acei_aliskiren', 'esc.hf.2026.washout_acei_arni_36h', 'acc.hfpef.2026.table5_contra_mtc_arb'],
      priority: 100,
    };
  },
}));

export const hfrefRasiSafetyRules: Rule[] = [
  ...concomitantRasiStopRules,
  {
    id: 'hf.outpatient.acute_decompensation_refer',
    module: 'hf',
    nameVi: 'Chuyển nhập viện cấp cứu khi suy tim mất bù cấp nặng tại phòng khám ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.acute_iv_diuretics', 'esc.hf.2026.acute_inotropes_shock_sbp90'],
    when: (ctx) => hasHfContext(ctx) && isOutpatientDecompensatedCrisis(ctx) && !isShockOrInotrope(ctx),
    produce: () => ({
      id: 'rec_hf_outpatient_emergency_refer',
      module: 'hf',
      tier: 'Cấp cứu Suy tim mất bù cấp (Class I)',
      tierOrder: 0,
      action: 'REFER',
      title: 'Chuyển nhập viện cấp cứu ngay: Suy tim mất bù cấp nặng (NYHA IV / phù phổi - sung huyết rõ)',
      rationale: 'Bệnh nhân ngoại trú có biểu hiện khó thở khi nghỉ (NYHA IV) kèm sung huyết phổi/toàn thân rõ hoặc phù phổi cấp: cần nhập viện theo dõi huyết động, thở oxy/NIV nếu giảm oxy máu và tiêm tĩnh mạch lợi tiểu quai sớm.',
      gates: [{ parameter: 'Mất bù cấp ngoại trú', passed: false, messageVi: 'NYHA IV kèm sung huyết rõ / phù phổi cấp' }],
      citationIds: ['esc.hf.2026.acute_iv_diuretics'],
      priority: 99,
    }),
  },
  {
    id: 'hf.pheno.missing_lvef',
    module: 'hf',
    nameVi: 'Yêu cầu nhập LVEF phân tầng suy tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.hfref_redefined_lt50', 'esc.hf.2026.new_concept_hfref_expanded', 'byt.2022.hf_4pillars'],
    when: (ctx) => hasHfContext(ctx) && need(ctx, 'lvef') === undefined,
    produce: () =>
      missingInputRec('hf', 'lvef', 'phân tầng kiểu hình suy tim trước khi chỉ định trụ cột', [
        'esc.hf.2026.hfref_redefined_lt50',
        'esc.hf.2026.new_concept_hfref_expanded',
        'byt.2022.hf_4pillars',
      ]),
  },
  {
    id: 'hf.fmt.sglt2i',
    module: 'hf',
    nameVi: 'Trụ cột SGLT2i ở HFrEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.sglt2i_all_lvef', 'esc.hf.2026.sglt2i_doses_table11', 'byt.2022.hf_4pillars'],
    when: (ctx) =>
      hasHfContext(ctx) &&
      !(ctx.settings.setting === 'inpatient' && isAcutelyDecompensated(ctx) && !findCurrentMed(ctx, SGLT2I_IDS)) &&
      (need(ctx, 'lvef') === undefined || getHfPhenotype(ctx) === 'hfref'),
    produce: (ctx) =>
      evaluateHfSglt2i(
        ctx,
        'Trụ cột FMT (Class I)',
        'SGLT2i được khuyến cáo Class I-A cho mọi bệnh nhân HFrEF có triệu chứng nhằm giảm nhập viện suy tim và tử vong tim mạch.',
        ['byt.2022.hf_4pillars']
      ),
  },
  {
    id: 'hf.fmt.acei_washout_stop',
    module: 'hf',
    nameVi: 'Ngưng ACEi (kể cả viên phối hợp SPC) để nghỉ đủ 36 giờ washout trước khi chuyển sang ARNI',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.washout_acei_arni_36h', 'fda.hf.sacubitril_contra_acei_aliskiren'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || findCurrentMed(ctx, ['sacubitril_valsartan'])) return false;
      const p = getHfPhenotype(ctx);
      if (p !== 'hfref') return false;
      if (ctx.settings.setting === 'inpatient' && isAcutelyDecompensated(ctx)) return false;
      if (isPregnant(ctx) || isLactating(ctx) || hasPriorAngioedema(ctx) || hasRasiAllergy(ctx) || isOnDialysis(ctx)) return false;
      if (getChildPugh(ctx) === 'C' || isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      const sbp = need(ctx, 'sbp'), k = need(ctx, 'k'), egfr = need(ctx, 'egfr');
      if (sbp === undefined || k === undefined || egfr === undefined) return false;
      if (
        sbp < thFor('sbp', 'hf.arni.sbp_min_start') ||
        k > thFor('k', 'hf.arni.k_max_caution') ||
        egfr < thFor('egfr', 'hf.arni.egfr_esrd_min')
      ) {
        return false;
      }
      return Boolean(findCurrentMed(ctx, ACEI_IDS));
    },
    produce: (ctx) => {
      const activeAcei = findCurrentMed(ctx, ACEI_IDS);
      if (!activeAcei) return null;
      const washoutHrs = thFor('duration_hours', 'hf.arni.washout_acei_hours');
      const disp = getDrugDisplayVi(activeAcei.drugId, activeAcei);
      const comps = expandDrugComponents(activeAcei.drugId);
      const hasAmlo = comps.includes('amlodipine');
      return {
        id: 'rec_hf_stop_acei_for_arni_washout',
        module: 'hf',
        tier: 'Chuyển đổi trụ cột ARNI (Washout bắt buộc)',
        tierOrder: 1,
        action: 'STOP',
        drugId: activeAcei.drugId,
        drugNameVi: disp,
        title: `Ngưng ${disp} và chờ đủ tối thiểu ${washoutHrs} giờ trước khi khởi trị Sacubitril/valsartan`,
        rationale: `Để tối ưu hóa trụ cột ARNI ở HFrEF mà tránh nguy cơ phù mạch cấp, bắt buộc ngưng thuốc chứa ACEi (${disp}) tối thiểu ${washoutHrs} giờ trước liều Sacubitril/valsartan đầu tiên.${hasAmlo ? ' Do đang dùng viên phối hợp cố định, tách riêng Amlodipine đơn chất nếu cần duy trì kiểm soát huyết áp trong thời gian washout.' : ''}`,
        gates: [{ parameter: 'Washout ACEi → ARNI', passed: false, threshold: `>= ${washoutHrs} giờ`, messageVi: `Ngưng ${disp} >= ${washoutHrs} giờ` }],
        citationIds: ['esc.hf.2026.washout_acei_arni_36h', 'fda.hf.sacubitril_contra_acei_aliskiren'],
        priority: 97,
      };
    },
  },
  {
    id: 'hf.fmt.rasi_fallback',
    module: 'hf',
    nameVi: 'Thay thế ARB hoặc Hydralazine + ISDN khi không dung nạp ARNI/ACEi',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.arb_intolerant_rec', 'esc.hf.2026.hisdn_intolerant_rec', 'esc.hf.2026.valsartan_doses_table11', 'esc.hf.2026.amt_doses_table11'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || getHfPhenotype(ctx) !== 'hfref' || isPregnant(ctx) || isLactating(ctx)) return false;
      if (isShockOrInotrope(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      const k = need(ctx, 'k'), egfr = need(ctx, 'egfr');
      const rasiBlocked =
        hasRasiAllergy(ctx) ||
        isOnDialysis(ctx) ||
        hasAcuteKidneyInjury(ctx) ||
        (egfr !== undefined && egfr < thFor('egfr', 'hf.arni.egfr_esrd_min')) ||
        (k !== undefined && k > thFor('k', 'hf.arni.k_max_hold'));
      return hasPriorAngioedema(ctx) || rasiBlocked;
    },
    produce: (ctx) => {
      const cits = ['esc.hf.2026.arb_intolerant_rec', 'esc.hf.2026.hisdn_intolerant_rec', 'esc.hf.2026.valsartan_doses_table11', 'esc.hf.2026.amt_doses_table11'];
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi chọn phác đồ giãn mạch thay thế ARNI/ACEi', cits);
      if (sbp < thFor('sbp', 'hf.acute.shock_sbp')) return null;

      if (hasPriorAngioedema(ctx) && !hasRasiAllergy(ctx) && !isOnDialysis(ctx) && !hasAcuteKidneyInjury(ctx) && getChildPugh(ctx) !== 'C') {
        const k = need(ctx, 'k');
        if (k === undefined) return missingInputRec('hf', 'k', 'kiểm tra kali máu trước khi cân nhắc ARB thay thế', cits);
        const egfr = need(ctx, 'egfr');
        if (egfr === undefined) return missingInputRec('hf', 'egfr', 'kiểm tra eGFR trước khi cân nhắc ARB thay thế', cits);
        if (egfr >= thFor('egfr', 'hf.arni.egfr_esrd_min') && k <= thFor('k', 'hf.arni.k_max_caution') && sbp >= thFor('sbp', 'hf.arni.sbp_min_start')) {
          const activeArb = findCurrentMed(ctx, ARB_IDS);
          const matchedArbId = resolveMatchedComponentId(activeArb, ARB_IDS) ?? 'valsartan';
          const valStart = thFor('dose_mg', 'hf.rasi.valsartan_start_mg');
          const valTarget = thFor('dose_mg', 'hf.rasi.valsartan_target_mg');
          const arbDose = matchedArbId === 'valsartan'
            ? `${valStart} mg x 2 lần/ngày (đích ${valTarget} mg x 2 lần/ngày)`
            : formatHfDose(dose(matchedArbId, 'start'));
          return {
            id: 'rec_hf_arb_fallback',
            module: 'hf',
            tier: 'Trụ cột FMT thay thế (Class I)',
            tierOrder: 1,
            action: activeArb ? 'CONTINUE' : 'CONSIDER',
            drugId: activeArb ? activeArb.drugId : matchedArbId,
            drugNameVi: getDrugDisplayVi(activeArb ? activeArb.drugId : matchedArbId, activeArb),
            dose: activeArb ? formatCurrentMedDoseVi(activeArb, matchedArbId) : arbDose,
            title: `Xem xét ${getDrugDisplayVi(matchedArbId)} (ARB) thận trọng thay thế khi chống chỉ định ACEi/ARNI do phù mạch`,
            rationale: 'Ở bệnh nhân HFrEF không dùng được ACEi/ARNI do tiền sử phù mạch nhưng không dị ứng ARB, cân nhắc ARB liều suy tim dưới giám sát chặt nguy cơ phù mạch tái phát hiếm gặp (Class I-A).',
            gates: [],
            citationIds: ['esc.hf.2026.arb_intolerant_rec', 'esc.hf.2026.valsartan_doses_table11'],
            priority: 80,
          };
        }
      }

      if (findCurrentMed(ctx, PDE5I_IDS) || hasDrugAllergy(ctx, ['hydralazine', 'isosorbide', 'nitrate'])) return null;
      return {
        id: 'rec_hf_hisdn',
        module: 'hf',
        tier: 'Thay thế giãn mạch HFrEF (Class IIb)',
        tierOrder: 2,
        action: 'CONSIDER',
        drugId: 'hydralazine',
        drugNameVi: 'Hydralazine phối hợp Isosorbide dinitrate',
        dose: `${formatHfDose(dose('hydralazine', 'start'))} + Isosorbide dinitrate ${formatHfDose(dose('isosorbide_dinitrate', 'start'))}`,
        title: 'Xem xét phối hợp Hydralazine + Isosorbide dinitrate khi không dung nạp hoặc chống chỉ định ARNI/ACEi/ARB',
        rationale: 'Phối hợp Hydralazine + Isosorbide dinitrate (Class IIb-B / COR 2b) giúp giảm tử vong ở bệnh nhân HFrEF không thể dùng thuốc ức chế hệ RAA do dị ứng, suy thận nặng hoặc tăng kali máu.',
        gates: [],
        citationIds: ['esc.hf.2026.hisdn_intolerant_rec', 'esc.hf.2026.amt_doses_table11'],
        priority: 76,
      };
    },
  },
  {
    id: 'hf.lactation.safe_regimen',
    module: 'hf',
    nameVi: 'Phác đồ suy tim an toàn trong thời kỳ hậu sản / cho con bú (Enalapril)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.preg.2025.lactation_enalapril', 'esc.preg.2025.lactation_metoprolol_bb'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || !isLactating(ctx) || isPregnant(ctx)) return false;
      const p = getHfPhenotype(ctx);
      return p === 'hfref' || p === 'hfimpef';
    },
    produce: (ctx) => {
      if (hasPriorAngioedema(ctx) || hasRasiAllergy(ctx) || isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx) || isOnDialysis(ctx)) {
        return null;
      }
      const sbp = need(ctx, 'sbp'), k = need(ctx, 'k'), egfr = need(ctx, 'egfr');
      if (sbp === undefined || k === undefined || egfr === undefined) return null;
      if (sbp < thFor('sbp', 'hf.arni.sbp_min_start') || k > thFor('k', 'hf.arni.k_max_caution') || egfr < thFor('egfr', 'hf.arni.egfr_esrd_min')) {
        return null;
      }
      const activeEnalapril = findCurrentMed(ctx, ['enalapril']);
      return {
        id: 'rec_hf_lactation_enalapril',
        module: 'hf',
        tier: 'Phác đồ HFrEF an toàn khi cho con bú (ESC 2025)',
        tierOrder: 1,
        action: activeEnalapril ? 'CONTINUE' : 'START',
        drugId: 'enalapril',
        drugNameVi: getDrugDisplayVi('enalapril'),
        dose: activeEnalapril ? formatCurrentMedDoseVi(activeEnalapril, 'enalapril') : formatHfDose(dose('enalapril', 'start')),
        title: `${activeEnalapril ? 'Tiếp tục' : 'Khởi trị'} Enalapril thay thế ARNI/ARB trong thời kỳ cho con bú`,
        rationale: 'Theo ESC 2025 (Bệnh tim mạch & Thai kỳ), Enalapril (cùng Metoprolol succinate và Spironolactone) bài tiết tối thiểu qua sữa mẹ và an toàn cho trẻ bú mẹ đủ tháng, trong khi ARNI, ARB và SGLT2i không được khuyến cáo khi cho con bú.',
        gates: [{ parameter: 'Cho con bú', passed: true, messageVi: 'Enalapril tương thích cho con bú (theo dõi cân nặng trẻ sơ sinh)' }],
        citationIds: ['esc.preg.2025.lactation_enalapril', 'esc.preg.2025.lactation_metoprolol_bb'],
        priority: 94,
      };
    },
  },
];
