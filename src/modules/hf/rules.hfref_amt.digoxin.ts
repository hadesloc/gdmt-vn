import type { Action, Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getCustomInput,
  getDrugDisplayVi,
  getHfPhenotype,
  hasBackgroundFmt,
  hasHfContext,
  hasUnpacedConductionBlock,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  parseHfDailyDoseMg,
  PDE5I_IDS,
  PGP_INHIBITOR_IDS,
} from './helpers';

export const hfrefAmtDigoxinRules: Rule[] = [
  {
    id: 'hf.amt.digoxin',
    module: 'hf',
    nameVi: 'Digoxin kiểm soát triệu chứng / tần số thất ở HFrEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.digoxin_rec',
      'esc.hf.2026.digit_hf_nyha2_ef30',
      'esc.hf.2026.digoxin_doses_table11',
      'aha.hf.2022.digoxin_serum_05_09',
      'fda.hf.digoxin_renal_table3',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      if (findCurrentMed(ctx, ['digoxin'])) return true;
      if (ctx.settings.setting !== 'outpatient' || isOutpatientDecompensatedCrisis(ctx)) return false;
      const lvef = need(ctx, 'lvef'), nyha = need(ctx, 'nyha'), hr = need(ctx, 'hr');
      if (lvef === undefined || lvef > thFor('lvef', 'hf.digoxin.ef_max')) return false;
      const afRapid = ctx.patient.rhythm === 'afib' && hr !== undefined && hr >= thFor('hr', 'hf.ivabradine.hr_min');
      const sinusSymptomatic =
        (ctx.patient.rhythm === 'sinus' || ctx.patient.rhythm === undefined) &&
        hasBackgroundFmt(ctx) &&
        nyha !== undefined &&
        (nyha >= 3 || (nyha === 2 && lvef <= thFor('lvef', 'hf.digoxin.ef_nyha2_max')));
      return afRapid || sinusSymptomatic;
    },
    produce: (ctx) => {
      const activeDig = findCurrentMed(ctx, ['digoxin']);
      const cits = [
        'esc.hf.2026.digoxin_rec',
        'esc.hf.2026.digit_hf_nyha2_ef30',
        'esc.hf.2026.digoxin_doses_table11',
        'fda.hf.digoxin_oral_tablets_mcg',
        'fda.hf.digoxin_renal_table3',
        'aha.hf.2022.digoxin_dosing_age70',
        'aha.hf.2022.digoxin_serum_05_09',
        'fda.hf.digoxin_serum_1_2',
      ];

      if (hasCondition(ctx, 'wpw') || hasCondition(ctx, 'cardiacAmyloidosis') || hasUnpacedConductionBlock(ctx)) {
        const why = hasCondition(ctx, 'wpw')
          ? 'hội chứng tiền kích thích WPW (nguy cơ rung thất)'
          : hasCondition(ctx, 'cardiacAmyloidosis')
            ? 'bệnh cơ tim nhiễm bột amyloidosis (nguy cơ ngộ độc digoxin nặng ngay ở nồng độ điều trị)'
            : 'block nhĩ-thất độ II–III / suy nút xoang chưa đặt máy tạo nhịp';
        return {
          id: 'rec_hf_digoxin',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (An toàn Digoxin)',
          tierOrder: 1,
          action: activeDig ? 'STOP' : 'AVOID',
          drugId: 'digoxin',
          drugNameVi: getDrugDisplayVi('digoxin'),
          title: `${activeDig ? 'Ngưng ngay' : 'Chống chỉ định / Tránh dùng'} Digoxin do ${why}`,
          rationale: `Không sử dụng Digoxin khi có ${why}.`,
          gates: [{ parameter: 'Chống chỉ định Digoxin', passed: false, messageVi: why }],
          citationIds: ['fda.hf.digoxin_amyloid_avoid', ...cits],
          priority: 95,
        };
      }

      if (isShockOrInotrope(ctx)) {
        if (!activeDig) return null;
        return {
          id: 'rec_hf_digoxin',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (An toàn Digoxin)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'digoxin',
          drugNameVi: getDrugDisplayVi('digoxin'),
          title: 'Tạm hoãn Digoxin trong sốc tim / giảm tưới máu tạng cấp',
          rationale: 'Giảm tưới máu thận cấp trong sốc tim làm tích lũy nhanh Digoxin gây loạn nhịp thất.',
          gates: [{ parameter: 'Huyết động', passed: false, messageVi: 'Sốc tim' }],
          citationIds: cits,
          priority: 92,
        };
      }

      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) return missingInputRec('hf', 'egfr', 'kiểm tra chức năng thận trước khi kê hoặc duy trì Digoxin', cits);
      const k = need(ctx, 'k');
      if (k === undefined) return missingInputRec('hf', 'k', 'kiểm tra kali máu trước khi kê hoặc duy trì Digoxin', cits);
      const hr = need(ctx, 'hr');
      if (hr === undefined) return missingInputRec('hf', 'hr', 'kiểm tra tần số tim trước khi kê hoặc duy trì Digoxin', cits);
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi đánh giá Digoxin', cits);

      const egfrAvoid = thFor('egfr', 'hf.digoxin.egfr_avoid_max');
      const kMin = thFor('k', 'hf.digoxin.k_min');
      const kHighNorm = thFor('k', 'hf.mra.k_max_initiate');
      const hrStop = thFor('hr', 'hf.digoxin.hr_min');
      const hrInitMin = thFor('hr', 'hf.digoxin.hr_start_min');

      if (isOnDialysis(ctx) || egfr < egfrAvoid) {
        return {
          id: 'rec_hf_digoxin',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (An toàn thận Digoxin)',
          tierOrder: 2,
          action: activeDig ? 'STOP' : 'AVOID',
          drugId: 'digoxin',
          drugNameVi: getDrugDisplayVi('digoxin'),
          title: `${activeDig ? 'Ngưng' : 'Tránh khởi trị'} Digoxin do suy thận nặng (eGFR < ${egfrAvoid}) / lọc máu`,
          rationale: 'Digoxin thải trừ chủ yếu qua thận dưới dạng không đổi; suy thận nặng dễ gây tích lũy thuốc và loạn nhịp thất tử vong.',
          gates: [{ parameter: 'eGFR', passed: false, value: egfr, threshold: `>= ${egfrAvoid}`, messageVi: `eGFR < ${egfrAvoid}` }],
          citationIds: cits,
          priority: 94,
        };
      }

      if (k <= kMin || (activeDig ? hr < hrStop : hr < hrInitMin)) {
        return {
          id: 'rec_hf_digoxin',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (An toàn điện giải / nhịp Digoxin)',
          tierOrder: 2,
          action: activeDig ? 'HOLD' : 'AVOID',
          drugId: 'digoxin',
          drugNameVi: getDrugDisplayVi('digoxin'),
          title: k <= kMin
            ? `${activeDig ? 'Tạm hoãn' : 'Tránh khởi trị'} Digoxin do hạ kali máu (K+ ${k} <= ${kMin} mmol/L)`
            : `${activeDig ? 'Tạm hoãn' : 'Tránh khởi trị'} Digoxin do nhịp tim chậm (${hr} bpm)`,
          rationale: `Hạ kali máu (từ ${kMin} mmol/L trở xuống) hoặc nhịp chậm làm nhạy cảm cơ tim mạnh với độc tính loạn nhịp của Digoxin; cần bù kali duy trì kali máu trên ngưỡng hạ kali tới không quá ${kHighNorm} mmol/L.`,
          gates: [{ parameter: 'K+ / HR', passed: false, messageVi: 'Hạ kali máu hoặc nhịp chậm' }],
          citationIds: ['fda.hf.digoxin_hypokalemia_k4', 'esc.hf.2026.hypokalaemia_3_5_diuretic', 'esc.hf.2026.low_hr_50_digoxin_review', ...cits],
          priority: 93,
        };
      }

      const age = need(ctx, 'age');
      const onPgpInhibitor = findCurrentMed(ctx, PGP_INHIBITOR_IDS);
      const onCarvedilol = findCurrentMed(ctx, ['carvedilol']);
      const onSpiro = findCurrentMed(ctx, ['spironolactone']);
      const lowMcg = thFor('dose_mcg', 'hf.digoxin.low_dose_mcg');
      const stdMcg = thFor('dose_mcg', 'hf.digoxin.std_dose_mcg');
      const targLow = thFor('concentration_ng_ml', 'hf.digoxin.serum_target_min');
      const targHigh = thFor('concentration_ng_ml', 'hf.digoxin.serum_target_max');
      const toxNg = thFor('concentration_ng_ml', 'hf.digoxin.serum_toxic_min');

      const mandatoryLow =
        Boolean(onPgpInhibitor) ||
        Boolean(onCarvedilol) ||
        (age !== undefined && age >= thFor('age', 'hf.digoxin.elderly_age_min')) ||
        egfr < thFor('egfr', 'hf.digoxin.egfr_low_dose_max') ||
        Boolean(ctx.patient.selectedModules?.includes('af'));

      if (activeDig && mandatoryLow) {
        const curDailyMg = parseHfDailyDoseMg(activeDig, 'digoxin');
        if (curDailyMg !== undefined && curDailyMg > lowMcg / 1000 + 0.005) { // qa-allow: unit-conversion - đổi mcg sang mg
          const ixDrug = onPgpInhibitor ?? onCarvedilol;
          return {
            id: 'rec_hf_digoxin',
            module: 'hf',
            tier: 'Điều trị bổ trợ AMT (Giảm liều chống ngộ độc Digoxin)',
            tierOrder: 1,
            action: 'REDUCE',
            drugId: 'digoxin',
            drugNameVi: getDrugDisplayVi('digoxin'),
            dose: `Giảm xuống tối đa ${lowMcg} mcg x 1 lần/ngày (hoặc cách ngày)`,
            title: `Giảm nửa liều Digoxin xuống <= ${lowMcg} mcg/ngày và định lượng nồng độ máu (mục tiêu ${targLow}–<${targHigh} ng/mL)`,
            rationale: `${ixDrug ? `Đang dùng kèm ${getDrugDisplayVi(ixDrug.drugId, ixDrug)} (ức chế P-gp làm tăng đáng kể nồng độ Digoxin)` : 'Tuổi cao / giảm eGFR'} làm tăng cao nguy cơ ngộ độc Digoxin; bắt buộc giảm liều xuống tối đa ${lowMcg} mcg/ngày và giữ nồng độ huyết thanh ${targLow}–<${targHigh} ng/mL (tuyệt đối < ${toxNg} ng/mL).`,
            gates: [],
            citationIds: ['fda.hf.digoxin_interactions_amiodarone_spiro', 'fda.hf.carvedilol_digoxin_ix', ...cits],
            priority: 92,
          };
        }
      }

      const actDig: Action = activeDig ? 'CONTINUE' : 'CONSIDER';
      const warnings: string[] = [
        `Định lượng Digoxin máu duy trì cửa sổ đích ${targLow} đến < ${targHigh} ng/mL (độc tính tăng cao từ >= ${toxNg} ng/mL) và duy trì kali máu ngưỡng bình thường cao.`,
      ];
      if (onSpiro) {
        warnings.push('Đang dùng kèm Spironolactone: giảm thanh thải ống thận của Digoxin và có thể nhiễu một số xét nghiệm miễn dịch định lượng Digoxin.');
      }

      return {
        id: 'rec_hf_digoxin',
        module: 'hf',
        tier: 'Điều trị bổ trợ AMT (Class IIa / IIb)',
        tierOrder: 2,
        action: actDig,
        drugId: 'digoxin',
        drugNameVi: getDrugDisplayVi('digoxin'),
        dose: activeDig
          ? formatCurrentMedDoseVi(activeDig, 'digoxin')
          : mandatoryLow
            ? `${lowMcg} mcg x 1 lần/ngày (uống, hoặc dùng cách ngày)`
            : `${lowMcg}–${stdMcg} mcg x 1 lần/ngày (uống)`,
        title: activeDig
          ? `Tiếp tục Digoxin liều thấp (đích huyết thanh ${targLow}–<${targHigh} ng/mL, dưới ${toxNg} ng/mL)`
          : 'Xem xét bổ sung Digoxin liều thấp giảm nguy cơ nhập viện suy tim',
        rationale: 'Glycosid trợ tim liều thấp (ESC 2026 Class IIa-B1 sau thử nghiệm DIGIT-HF) cân nhắc bổ sung trên nền FMT tối ưu ở HFrEF còn triệu chứng hoặc kèm rung nhĩ đáp ứng thất nhanh.',
        gates: [],
        warnings,
        profileDiff: {
          INTL: 'ESC 2026 nâng cardiac glycosides lên Class IIa, Level B1 ở HFrEF nhịp xoang có triệu chứng (DIGIT-HF).',
          US: 'AHA/ACC/HFSA 2022 xếp Digoxin ở mức COR 2b, LOE B-R.',
          VN: 'BYT QĐ 1857/2022 xếp Digoxin ở mức Class IIb cho HFrEF nhịp xoang còn triệu chứng.',
        },
        citationIds: ['fda.hf.digoxin_interactions_amiodarone_spiro', 'esc.hf.2026.digoxin_high_normal_k', ...cits],
        priority: 72,
      };
    },
  },
  {
    id: 'hf.amt.hydralazine_isdn_black',
    module: 'hf',
    nameVi: 'Phối hợp Hydralazine + Isosorbide dinitrate ở bệnh nhân HFrEF người Da đen NYHA III–IV',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.hisdn_intolerant_rec'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || !Boolean(getCustomInput(ctx, 'selfIdentifiedBlack'))) return false;
      if (getHfPhenotype(ctx) !== 'hfref' || isPregnant(ctx) || !hasBackgroundFmt(ctx)) return false;
      if (Boolean(findCurrentMed(ctx, PDE5I_IDS)) || isShockOrInotrope(ctx)) return false;
      const nyha = need(ctx, 'nyha'), sbp = need(ctx, 'sbp');
      return nyha !== undefined && nyha >= 3 && sbp !== undefined && sbp >= thFor('sbp', 'hf.arni.sbp_min_start');
    },
    produce: (ctx) => ({
      id: 'rec_hf_hisdn_black',
      module: 'hf',
      tier: ctx.settings.profile === 'US' ? 'Điều trị HFrEF chuyên biệt (COR 1-A)' : 'Điều trị bổ trợ AMT (Class IIa)',
      tierOrder: 2,
      action: ctx.settings.profile === 'US' ? 'START' : 'CONSIDER',
      drugId: 'hydralazine',
      drugNameVi: 'Hydralazine phối hợp Isosorbide dinitrate',
      dose: `${formatHfDose(dose('hydralazine', 'start'))} + Isosorbide dinitrate ${formatHfDose(dose('isosorbide_dinitrate', 'start'))}`,
      title: 'Bổ sung phối hợp Hydralazine + Isosorbide dinitrate trên nền FMT ở bệnh nhân HFrEF Da đen NYHA III–IV',
      rationale: 'Thử nghiệm A-HeFT chứng minh bổ sung Hydralazine + Isosorbide dinitrate trên nền điều trị chuẩn ở bệnh nhân HFrEF tự nhận chủng tộc Da đen NYHA III–IV giúp giảm rõ rệt tử vong và nhập viện suy tim.',
      gates: [],
      profileDiff: {
        INTL: 'ESC 2026 khuyến cáo mức Class IIa, Level B.',
        US: 'AHA/ACC/HFSA 2022 khuyến cáo mức COR 1, LOE A.',
        VN: 'Cân nhắc cá thể hóa ở nhóm bệnh nhân phù hợp.',
      },
      citationIds: ['esc.hf.2026.amt_doses_table11', 'esc.hf.2026.hisdn_intolerant_rec'],
      priority: 80,
    }),
  },
  {
    id: 'hf.stage_d.i_need_help',
    module: 'hf',
    nameVi: 'Sàng lọc suy tim tiến triển giai đoạn D (I-NEED-HELP) chuyển Trung tâm Suy tim chuyên sâu',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.advanced_hf_i_need_help'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      const lvef = need(ctx, 'lvef'), nyha = need(ctx, 'nyha');
      if (lvef === undefined || nyha === undefined || lvef > thFor('lvef', 'hf.stage_d.ef_severe_max') || nyha < 3) return false;
      const sbp = need(ctx, 'sbp'), na = need(ctx, 'na');
      const hfhRaw = getCustomInput(ctx, 'hfhCountLastYear');
      const freqHfh = typeof hfhRaw === 'number' && hfhRaw >= 2; // qa-allow: ui-step - bộ đếm số đợt nhập viện I-NEED-HELP
      const lowSbp = sbp !== undefined && sbp < thFor('sbp', 'hf.sglt2i.sbp_caution_min');
      const lowNa = na !== undefined && na < thFor('na', 'hf.loop.na_hyponatremia_max');
      return freqHfh || lowSbp || lowNa;
    },
    produce: () => ({
      id: 'rec_hf_stage_d_refer',
      module: 'hf',
      tier: 'Suy tim tiến triển Stage D (I-NEED-HELP)',
      tierOrder: 3,
      action: 'REFER',
      title: 'Hội chẩn Trung tâm Suy tim chuyên sâu (đánh giá MCS / LVAD / Ghép tim & Chăm sóc giảm nhẹ)',
      rationale: 'Bệnh nhân có dấu hiệu cảnh báo suy tim tiến triển (I-NEED-HELP: LVEF rất thấp kèm NYHA III–IV, huyết áp thấp không dung nạp chuẩn độ GDMT, hạ natri máu hoặc tái nhập viện suy tim nhiều lần/năm): cần chuyển tuyến sớm đánh giá hỗ trợ tuần hoàn cơ học (LVAD), ghép tim và chăm sóc giảm nhẹ.',
      gates: [],
      citationIds: ['esc.hf.2026.advanced_hf_i_need_help'],
      priority: 73,
    }),
  },
];
