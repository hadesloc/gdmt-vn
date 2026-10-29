import type { Action, Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  hasAcutePancreatitis,
  hasMtcOrMen2History,
  hasPancreatitisHistory,
} from '../../engine/safety/drugClassify';
import {
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getCongestionStatus,
  getCustomInput,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteKidneyInjury,
  hasDrugAllergy,
  hasExtraCondition,
  hasHfContext,
  isLactating,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  LOOP_DIURETIC_IDS,
  resolveMatchedComponentId,
} from './helpers';

export const hfpefSpecialRules: Rule[] = [
  {
    id: 'hf.hfimpef.continue_gdmt',
    module: 'hf',
    nameVi: 'Quản lý duy trì GDMT tối ưu ở HFimpEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.fmt_continuation_hfimpef'],
    when: (ctx) => hasHfContext(ctx) && getHfPhenotype(ctx) === 'hfimpef',
    produce: (ctx) => {
      const efImp = thFor('lvef', 'hf.ef.hfimpef_min');
      if (isPregnant(ctx)) {
        return {
          id: 'rec_hf_hfimpef_continue',
          module: 'hf',
          tier: 'HFimpEF & Thai kỳ',
          tierOrder: 1,
          action: 'SWITCH',
          title: 'HFimpEF trong thai kỳ: Ngưng ngay ARNI/ACEi/ARB/MRA/SGLT2i và duy trì chẹn beta chọn lọc beta-1',
          rationale: 'Trong thai kỳ bắt buộc ngưng các thuốc gây độc bào thai (ARNI/ACEi/ARB, MRA, SGLT2i) và chỉ duy trì Bisoprolol hoặc Metoprolol succinate dưới giám sát chuyên khoa.',
          gates: [],
          citationIds: ['esc.hf.2026.fmt_continuation_hfimpef', 'esc.hf.2026.pregnancy_contra', 'esc.hf.2026.pregnancy_bb_switch'],
          priority: 95,
        };
      }
      if (isLactating(ctx)) {
        return {
          id: 'rec_hf_hfimpef_continue',
          module: 'hf',
          tier: 'HFimpEF & Cho con bú',
          tierOrder: 1,
          action: 'SWITCH',
          title: 'HFimpEF khi cho con bú: Chuyển sang phác đồ an toàn hậu sản (Enalapril + Metoprolol succinate + Spironolactone)',
          rationale: 'Ngưng ARNI và SGLT2i khi cho con bú, chuyển sang bộ ba tương thích sữa mẹ để vẫn ngăn tái suy giảm LVEF.',
          gates: [],
          citationIds: ['esc.hf.2026.fmt_continuation_hfimpef', 'esc.preg.2025.lactation_enalapril', 'esc.preg.2025.lactation_metoprolol_bb'],
          priority: 94,
        };
      }
      const sbp = need(ctx, 'sbp'), hr = need(ctx, 'hr'), k = need(ctx, 'k'), egfr = need(ctx, 'egfr');
      const acuteSafetyIssue =
        isShockOrInotrope(ctx) ||
        hasAcuteKidneyInjury(ctx) ||
        (sbp !== undefined && sbp < thFor('sbp', 'hf.acute.shock_sbp')) ||
        (hr !== undefined && hr < thFor('hr', 'hf.digoxin.hr_min')) ||
        (k !== undefined && k > thFor('k', 'hf.mra.k_halve_dose')) ||
        (egfr !== undefined && egfr < thFor('egfr', 'hf.arni.egfr_esrd_min'));

      if (acuteSafetyIssue) {
        return {
          id: 'rec_hf_hfimpef_continue',
          module: 'hf',
          tier: 'An toàn thuốc ở HFimpEF (Biến cố cấp)',
          tierOrder: 1,
          action: 'MONITOR',
          title: 'HFimpEF đang có biến cố huyết động / thận / điện giải: Tạm ngưng trụ cột không an toàn, KHÔNG bỏ hẳn vĩnh viễn GDMT',
          rationale: 'Trong đợt sốc, nhịp chậm nặng, AKI hoặc tăng kali máu, ưu tiên tuân theo chỉ định tạm ngưng/giảm liều của từng thuốc cụ thể; sau khi biến cố cấp hồi phục, bắt buộc khôi phục lại GDMT để phòng tái suy giảm thất trái (TRED-HF).',
          gates: [{ parameter: 'An toàn cấp HFimpEF', passed: false, messageVi: 'Xử trí biến cố cấp trước rồi khôi phục GDMT' }],
          citationIds: ['esc.hf.2026.fmt_continuation_hfimpef', 'esc.hf.2026.rasi_arni_aki_egfr15_k'],
          priority: 90,
        };
      }

      return {
        id: 'rec_hf_hfimpef_continue',
        module: 'hf',
        tier: 'Duy trì nền tảng HFimpEF (Class I)',
        tierOrder: 1,
        action: 'CONTINUE',
        title: `Tiếp tục duy trì đầy đủ GDMT ở liều dung nạp cao nhất dù LVEF đã hồi phục trên ${efImp}% (HFimpEF)`,
        rationale: 'Ngưng thuốc suy tim sau khi LVEF cải thiện dẫn tới nguy cơ tái suy giảm thất trái cao trong 6 tháng (TRED-HF); ESC 2026 khuyến cáo Class I-C tiếp tục duy trì FMT vô thời hạn.',
        gates: [],
        citationIds: ['esc.hf.2026.fmt_continuation_hfimpef'],
        priority: 92,
      };
    },
  },
  {
    id: 'hf.amt.loop_diuretic',
    module: 'hf',
    nameVi: 'Lợi tiểu quai đường uống kiểm soát sung huyết ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.loop_diuretics_chronic',
      'esc.hf.2026.loop_diuretics_doses_table_s7',
      'aha.hf.2022.loop_diuretic_chronic_doses',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      const cong = getCongestionStatus(ctx);
      return cong === 'mild' || cong === 'overt' || Boolean(findCurrentMed(ctx, LOOP_DIURETIC_IDS));
    },
    produce: (ctx) => {
      const cits = [
        'esc.hf.2026.loop_diuretics_chronic',
        'esc.hf.2026.loop_diuretics_doses_table_s7',
        'aha.hf.2022.loop_diuretic_chronic_doses',
      ];
      const activeLoop = findCurrentMed(ctx, LOOP_DIURETIC_IDS);
      const loopId = resolveMatchedComponentId(activeLoop, LOOP_DIURETIC_IDS) ?? 'furosemide';
      const anuria = hasExtraCondition(ctx, 'anuria');
      const sulfaLoopAllergy = hasDrugAllergy(ctx, ['furosemide', 'torsemide', 'bumetanide', 'lasix', 'sulfonamide']);

      if (anuria || sulfaLoopAllergy) {
        const why = anuria
          ? 'vô niệu hoàn toàn (chống chỉ định lợi tiểu quai)'
          : 'tiền sử dị ứng quá mẫn với lợi tiểu quai gốc sulfonamide (cân nhắc Acid ethacrynic không chứa gốc sulfonamide)';
        return {
          id: 'rec_hf_loop_diuretic',
          module: 'hf',
          tier: 'Kiểm soát sung huyết (An toàn lợi tiểu quai)',
          tierOrder: 1,
          action: activeLoop ? 'STOP' : 'AVOID',
          drugId: activeLoop?.drugId ?? loopId,
          drugNameVi: getDrugDisplayVi(activeLoop?.drugId ?? loopId, activeLoop),
          title: `${activeLoop ? 'Ngưng' : 'Chống chỉ định'} ${getDrugDisplayVi(activeLoop?.drugId ?? loopId, activeLoop)}`,
          rationale: `Không dùng ${getDrugDisplayVi(loopId)} do ${why}.`,
          gates: [{ parameter: 'An toàn lợi tiểu quai', passed: false, messageVi: why }],
          citationIds: ['fda.hf.bumetanide_contra_anuria_hepatic', ...cits],
          priority: 94,
        };
      }

      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi chỉ định hoặc tăng liều lợi tiểu quai', cits);
      const sbpShock = thFor('sbp', 'hf.acute.shock_sbp');
      if (isShockOrInotrope(ctx) || sbp < sbpShock) {
        return {
          id: 'rec_hf_loop_diuretic',
          module: 'hf',
          tier: 'Kiểm soát sung huyết (Class I)',
          tierOrder: 2,
          action: 'HOLD',
          drugId: activeLoop?.drugId ?? loopId,
          drugNameVi: getDrugDisplayVi(activeLoop?.drugId ?? loopId, activeLoop),
          title: `Tạm hoãn ${getDrugDisplayVi(activeLoop?.drugId ?? loopId, activeLoop)} do sốc tim / SBP thấp (${sbp} mmHg)`,
          rationale: `SBP dưới ${sbpShock} mmHg hoặc giảm tưới máu; cần đánh giá lại thể tích tuần hoàn trước khi dùng lợi tiểu.`,
          gates: [],
          citationIds: cits,
          priority: 89,
        };
      }

      const k = need(ctx, 'k'), na = need(ctx, 'na');
      const kLowCut = thFor('k', 'hf.digoxin.k_min');
      const naLowCut = thFor('na', 'hf.loop.na_hyponatremia_max');
      const warnings: string[] = [];
      if (k !== undefined && k <= kLowCut) {
        warnings.push(`Hạ kali máu rõ (K+ ${k} <= ${kLowCut} mmol/L): cần bù kali tích cực và phối hợp/tối ưu MRA để tránh loạn nhịp thất do lợi tiểu.`);
      }
      if (na !== undefined && na < naLowCut) {
        warnings.push(`Hạ natri máu (Na+ ${na} < ${naLowCut} mmol/L): ngừng thiazide nếu có và đánh giá hạ natri pha loãng hay mất muối.`);
      }
      if (hasCondition(ctx, 'gout') || Boolean(ctx.patient.selectedModules?.includes('gout'))) {
        warnings.push('Bệnh nhân đồng mắc Gút: theo dõi acid uric máu, duy trì liều lợi tiểu quai thấp nhất đạt đẳng dịch; nếu cơn gút cấp dùng Colchicine liều thấp (TUYỆT ĐỐI tránh NSAID).');
      }
      if (isPregnant(ctx)) {
        warnings.push('Thai kỳ: chỉ dùng lợi tiểu quai ở liều thấp nhất kiểm soát sung huyết phổi và theo dõi sát tưới máu tử cung - nhau thai.');
      }

      const cong = getCongestionStatus(ctx);
      const act: Action = activeLoop ? (cong === 'overt' ? 'UPTITRATE' : 'CONTINUE') : 'START';
      const maxOralMg = loopId === 'furosemide' ? `${thFor('dose_mg', 'hf.acute.furosemide_iv_max_mg')} mg/ngày` : formatHfDose(dose(loopId, 'target'));
      return {
        id: 'rec_hf_loop_diuretic',
        module: 'hf',
        tier: 'Kiểm soát sung huyết (Class I)',
        tierOrder: 2,
        action: act,
        drugId: activeLoop?.drugId ?? loopId,
        drugNameVi: getDrugDisplayVi(activeLoop?.drugId ?? loopId, activeLoop),
        dose: act === 'UPTITRATE'
          ? `Tăng liều ${getDrugDisplayVi(loopId)} theo đáp ứng bài niệu (tối đa ${maxOralMg})`
          : act === 'CONTINUE'
            ? formatCurrentMedDoseVi(activeLoop, loopId)
            : formatHfDose(dose(loopId, 'start')),
        title: act === 'START'
          ? `Khởi trị lợi tiểu quai giảm sung huyết: ${getDrugDisplayVi(loopId)}`
          : act === 'UPTITRATE'
            ? `Tăng liều ${getDrugDisplayVi(loopId)} giải quyết sung huyết rõ`
            : `Tiếp tục ${getDrugDisplayVi(activeLoop?.drugId ?? loopId, activeLoop)} ở liều thấp nhất hiệu quả duy trì đẳng dịch`,
        rationale: 'Lợi tiểu quai được khuyến cáo Class I-C ở mọi kiểu hình suy tim có sung huyết; giảm dần về liều thấp nhất hiệu quả khi đã đạt đẳng dịch.',
        gates: [],
        warnings: warnings.length > 0 ? warnings : undefined,
        citationIds: ['esc.hf.2026.hypokalaemia_3_5_diuretic', 'esc.hf.2026.diuretic_hyponatraemia_gout_table_s7', ...cits],
        priority: 86,
      };
    },
  },
  {
    id: 'hf.hfpef.glp1_obesity',
    module: 'hf',
    nameVi: 'Liệu pháp Incretin (Semaglutide / Tirzepatide) ở HFpEF kèm béo phì',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.glp1_obesity',
      'acc.hfpef.2026.glp1_obesity',
      'acc.hfpef.2026.table4_incretin_doses',
      'acc.hfpef.2026.table5_contra_mtc_arb',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      const activeGlp1 = findCurrentMed(ctx, ['semaglutide', 'tirzepatide']);
      if (activeGlp1 && (isPregnant(ctx) || isLactating(ctx))) return true;
      if (isPregnant(ctx) || isLactating(ctx)) return false;
      const lvef = need(ctx, 'lvef');
      if (lvef === undefined || lvef < thFor('lvef', 'hf.glp1.ef_min')) return false;
      const nyha = need(ctx, 'nyha');
      return nyha === undefined || nyha >= 2;
    },
    produce: (ctx) => {
      const cits = [
        'esc.hf.2026.glp1_obesity',
        'acc.hfpef.2026.glp1_obesity',
        'acc.hfpef.2026.table4_incretin_doses',
        'acc.hfpef.2026.table5_contra_mtc_arb',
      ];
      const activeGlp1 = findCurrentMed(ctx, ['semaglutide', 'tirzepatide']);
      const matchedGlp1 = resolveMatchedComponentId(activeGlp1, ['semaglutide', 'tirzepatide']);
      const prefRaw = String(getCustomInput(ctx, 'preferredIncretin') ?? '').toLowerCase();
      const chosenId = matchedGlp1 ?? (prefRaw === 'tirzepatide' ? 'tirzepatide' : 'semaglutide');

      if (
        isPregnant(ctx) ||
        isLactating(ctx) ||
        hasMtcOrMen2History(ctx.normalized) ||
        hasAcutePancreatitis(ctx.normalized) ||
        hasPancreatitisHistory(ctx.normalized)
      ) {
        const why = isPregnant(ctx) || isLactating(ctx)
          ? 'mang thai / đang cho con bú'
          : hasMtcOrMen2History(ctx.normalized)
            ? 'tiền sử bản thân/gia đình ung thư tuyến giáp thể tủy (MTC) hoặc MEN 2 (FDA Boxed Warning)'
            : 'tiền sử hoặc đang bị viêm tụy cấp';
        return {
          id: 'rec_hf_glp1_hfpef',
          module: 'hf',
          tier: 'An toàn thuốc Incretin (Chống chỉ định)',
          tierOrder: 1,
          action: activeGlp1 ? 'STOP' : 'AVOID',
          drugId: activeGlp1?.drugId ?? chosenId,
          drugNameVi: getDrugDisplayVi(activeGlp1?.drugId ?? chosenId, activeGlp1),
          title: `${activeGlp1 ? 'Ngưng ngay' : 'Chống chỉ định'} ${getDrugDisplayVi(activeGlp1?.drugId ?? chosenId, activeGlp1)} (${why})`,
          rationale: `Không sử dụng nhóm đồng vận GLP-1 / GIP-GLP-1 do ${why}.`,
          gates: [{ parameter: 'Chống chỉ định Incretin', passed: false, messageVi: why }],
          citationIds: cits,
          priority: 95,
        };
      }

      const egfr = need(ctx, 'egfr');
      const esrdCut = thFor('egfr', 'hf.arni.egfr_esrd_min');
      if (isOnDialysis(ctx) || (egfr !== undefined && egfr < esrdCut)) {
        if (!activeGlp1) return null;
        return {
          id: 'rec_hf_glp1_hfpef',
          module: 'hf',
          tier: 'Điều trị chuyên biệt HFpEF béo phì',
          tierOrder: 2,
          action: 'HOLD',
          drugId: activeGlp1.drugId,
          drugNameVi: getDrugDisplayVi(activeGlp1.drugId, activeGlp1),
          title: `Thận trọng / tạm hoãn ${getDrugDisplayVi(activeGlp1.drugId, activeGlp1)} ở suy thận giai đoạn cuối (eGFR < ${esrdCut})`,
          rationale: 'Dữ liệu an toàn ở suy thận giai đoạn cuối/lọc máu hạn chế và nguy cơ nôn mất nước làm nặng suy thận.',
          gates: [],
          citationIds: cits,
          priority: 82,
        };
      }

      const bmi = need(ctx, 'bmi');
      if (bmi === undefined) {
        return missingInputRec('hf', 'bmi', 'xác định chỉ số BMI sàng lọc chỉ định Semaglutide / Tirzepatide ở HFpEF béo phì', cits);
      }
      const bmiMin = thFor('bmi', 'hf.glp1.bmi_min');
      const efMin = thFor('lvef', 'hf.glp1.ef_min');
      if (bmi < bmiMin && !activeGlp1) return null;

      const semaStart = thFor('dose_mg', 'hf.glp1.semaglutide_start');
      const semaTarget = thFor('dose_mg', 'hf.glp1.semaglutide_target');
      const tirzStart = thFor('dose_mg', 'hf.glp1.tirzepatide_start');
      const tirzTarget = thFor('dose_mg', 'hf.glp1.tirzepatide_target');

      const doseStr = chosenId === 'tirzepatide'
        ? `${tirzStart} mg tiêm dưới da mỗi tuần; tăng bậc mỗi 4 tuần tới đích 5–${tirzTarget} mg/tuần`
        : `${semaStart} mg tiêm dưới da mỗi tuần; tăng bậc mỗi 4 tuần tới đích ${semaTarget} mg/tuần`;

      return {
        id: 'rec_hf_glp1_hfpef',
        module: 'hf',
        tier: 'Điều trị chuyên biệt HFpEF béo phì (Class IIa)',
        tierOrder: 2,
        action: activeGlp1 ? 'CONTINUE' : 'CONSIDER',
        drugId: activeGlp1?.drugId ?? chosenId,
        drugNameVi: activeGlp1 ? getDrugDisplayVi(activeGlp1.drugId, activeGlp1) : 'Semaglutide (hoặc Tirzepatide)',
        dose: activeGlp1 ? formatCurrentMedDoseVi(activeGlp1, chosenId) ?? doseStr : doseStr,
        title: activeGlp1
          ? `Tiếp tục duy trì ${getDrugDisplayVi(activeGlp1.drugId, activeGlp1)} ở HFpEF béo phì`
          : `Xem xét khởi trị ${chosenId === 'tirzepatide' ? 'Tirzepatide' : 'Semaglutide (hoặc Tirzepatide)'} cho HFpEF kèm béo phì`,
        rationale: `Ở bệnh nhân suy tim LVEF >= ${efMin}% kèm béo phì (BMI ${bmi.toFixed(1)} >= ${bmiMin} kg/m²), ESC 2026 (Class IIa-B1) khuyến cáo GLP-1 RA giúp giảm cân, cải thiện triệu chứng KCCQ và khả năng gắng sức (STEP-HFpEF); ACC 2026 ECDP ghi nhận thêm Tirzepatide (SUMMIT) giúp giảm biến cố suy tim xấu đi.`,
        gates: [{ parameter: 'BMI', passed: true, value: Number(bmi.toFixed(1)), threshold: `>= ${bmiMin}`, messageVi: `BMI >= ${bmiMin} kg/m²` }],
        profileDiff: {
          INTL: `ESC 2026 (Rec Table 18) khuyến cáo Class IIa, Level B1 cân nhắc GLP-1 RA ở HFpEF kèm BMI từ ${bmiMin} kg/m² trở lên để giảm cân, cải thiện chất lượng sống và gắng sức.`,
          US: `ACC 2026 ECDP ủng hộ Semaglutide (${semaStart} tới ${semaTarget} mg/tuần) hoặc Tirzepatide (${tirzStart} tới ${tirzTarget} mg/tuần, giảm biến cố suy tim xấu đi trong SUMMIT).`,
          VN: 'Cân nhắc cá thể hóa ở HFpEF béo phì (đặc biệt kèm ĐTĐ típ 2) tùy khả năng tiếp cận thuốc.',
        },
        benefitsAlso: ['dm2'],
        citationIds: cits,
        priority: 79,
      };
    },
  },
  {
    id: 'hf.hfpef.diagnostic_biomarkers',
    module: 'hf',
    nameVi: 'Đối chiếu ngưỡng chẩn đoán NT-proBNP ở HFpEF (lưu ý giả thấp khi béo phì)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['acc.hfpef.2026.ntprobnp_sr125_af365'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || getHfPhenotype(ctx) !== 'hfpef') return false;
      const ntProBnp = need(ctx, 'ntProBnp');
      if (ntProBnp === undefined) return false;
      const cutoff = ctx.patient.rhythm === 'afib'
        ? thFor('ntprobnp', 'hf.ntprobnp.afib_min')
        : thFor('ntprobnp', 'hf.ntprobnp.sinus_min');
      return ntProBnp < cutoff;
    },
    produce: (ctx) => {
      const ntProBnp = need(ctx, 'ntProBnp')!;
      const isAf = ctx.patient.rhythm === 'afib';
      const cutoff = isAf ? thFor('ntprobnp', 'hf.ntprobnp.afib_min') : thFor('ntprobnp', 'hf.ntprobnp.sinus_min');
      const bmi = need(ctx, 'bmi');
      const obese = bmi !== undefined && bmi >= thFor('bmi', 'hf.glp1.bmi_min');
      return {
        id: 'rec_hf_hfpef_ntprobnp_review',
        module: 'hf',
        tier: 'Thẩm định chẩn đoán HFpEF (NT-proBNP)',
        tierOrder: 3,
        action: 'MONITOR',
        title: `NT-proBNP hiện tại (${ntProBnp} pg/mL) thấp hơn ngưỡng gợi ý HFpEF (${cutoff} pg/mL ở ${isAf ? 'rung nhĩ' : 'nhịp xoang'})`,
        rationale: `Theo khuyến cáo chuyên gia, ngưỡng NT-proBNP gợi ý suy tim mạn là từ ${cutoff} pg/mL trở lên (${isAf ? 'rung nhĩ' : 'nhịp xoang'}).${obese ? ' Tuy nhiên ở bệnh nhân béo phì, nồng độ NT-proBNP có thể bình thường giả; cần phối hợp siêu âm tim Doppler mô, thể tích nhĩ trái và thang điểm HFA-PEFF / H2FPEF.' : ' Nếu bệnh nhân chưa điều trị lợi tiểu, cần rà soát lại chẩn đoán phân biệt khó thở ngoài tim hoặc đánh giá huyết động gắng sức.'}`,
        gates: [],
        citationIds: ['acc.hfpef.2026.ntprobnp_sr125_af365'],
        priority: 62,
      };
    },
  },
];
