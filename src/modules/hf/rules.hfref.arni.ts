import type { Action, GateResult, Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import { expandDrugComponents } from '../../engine/safety/fdcMap';
import {
  ACEI_IDS,
  ARB_IDS,
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getCustomInput,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteKidneyInjury,
  hasHfContext,
  hasPriorAngioedema,
  hasRasiAllergy,
  isAcutelyDecompensated,
  isAtOrAboveTargetDose,
  isCombinationMed,
  isLactating,
  isLowDosePriorRasi,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  resolveMatchedComponentId,
} from './helpers';

export const hfrefArniRules: Rule[] = [
  {
    id: 'hf.fmt.arni',
    module: 'hf',
    nameVi: 'Trụ cột ARNI ở HFrEF & HFimpEF (Sacubitril/valsartan)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.sacubitril_valsartan_dose', 'esc.hf.2026.sacubitril_valsartan_low_dose', 'esc.hf.2026.arni_table_s5_contra_caution'],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      const activeArni = findCurrentMed(ctx, ['sacubitril_valsartan']);
      if (ctx.settings.setting === 'inpatient' && isAcutelyDecompensated(ctx) && !activeArni) return false;
      if (need(ctx, 'lvef') === undefined) return true;
      const p = getHfPhenotype(ctx);
      return p === 'hfref' || (p === 'hfimpef' && Boolean(activeArni));
    },
    produce: (ctx) => {
      const activeArni = findCurrentMed(ctx, ['sacubitril_valsartan']);
      const cits = [
        'esc.hf.2026.sacubitril_valsartan_dose',
        'esc.hf.2026.sacubitril_valsartan_low_dose',
        'esc.hf.2026.arni_sbp_100_egfr_30',
        'esc.hf.2026.arni_table_s5_contra_caution',
      ];
      const childPugh = getChildPugh(ctx);
      const arniAllergy = hasRasiAllergy(ctx);

      if (isPregnant(ctx) || isLactating(ctx) || hasPriorAngioedema(ctx) || arniAllergy || childPugh === 'C') {
        const why = isPregnant(ctx)
          ? 'đang mang thai (độc tính bào thai)'
          : isLactating(ctx)
            ? 'đang cho con bú (ưu tiên chuyển sang Enalapril an toàn khi cho con bú)'
            : hasPriorAngioedema(ctx)
              ? 'tiền sử phù mạch (nguy cơ phù mạch tái phát đe dọa tính mạng)'
              : childPugh === 'C'
                ? 'xơ gan mất bù / suy gan nặng Child-Pugh C'
                : 'tiền sử dị ứng quá mẫn với thành phần ARNI / ACEi / ARB';
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeArni ? 'STOP' : 'AVOID',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: `${activeArni ? 'Ngưng ngay' : 'Chống chỉ định'} Sacubitril/valsartan`,
          rationale: `Không sử dụng Sacubitril/valsartan do ${why}.`,
          gates: [{ parameter: 'An toàn ARNI', passed: false, messageVi: why }],
          citationIds: isPregnant(ctx)
            ? ['esc.hf.2026.pregnancy_contra', ...cits]
            : childPugh === 'C'
              ? ['fda.hf.sacubitril_hepatic', ...cits]
              : isLactating(ctx)
                ? ['esc.preg.2025.lactation_enalapril', ...cits]
                : ['fda.hf.sacubitril_contra_acei_aliskiren', ...cits],
          priority: 98,
        };
      }

      if (isOnDialysis(ctx)) {
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeArni ? 'HOLD' : 'AVOID',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: `${activeArni ? 'Tạm ngưng và hội chẩn Tim-Thận' : 'Tránh khởi trị thường quy'} Sacubitril/valsartan trên bệnh nhân lọc máu`,
          rationale: 'Chưa đủ dữ liệu an toàn để khởi trị thường quy ARNI ở bệnh nhân lọc máu chu kỳ.',
          gates: [{ parameter: 'Lọc máu', passed: false, messageVi: 'Đang lọc máu' }],
          citationIds: cits,
          priority: 86,
        };
      }

      if (isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx)) {
        const why = isShockOrInotrope(ctx)
          ? 'sốc tim / đang dùng vận mạch - tăng co bóp'
          : 'đang trong đợt tổn thương thận cấp (AKI)';
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: `Tạm hoãn Sacubitril/valsartan do ${why}`,
          rationale: `Cần tạm ngưng ARNI khi ${why}; chỉ đánh giá dùng lại khi huyết động và chức năng thận đã ổn định.`,
          gates: [{ parameter: 'Huyết động / AKI', passed: false, messageVi: why }],
          citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', ...cits],
          priority: 95,
        };
      }

      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi chỉ định hoặc tăng liều ARNI', cits);
      const k = need(ctx, 'k');
      if (k === undefined) return missingInputRec('hf', 'k', 'kiểm tra kali máu trước khi chỉ định hoặc tăng liều ARNI', cits);
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) return missingInputRec('hf', 'egfr', 'kiểm tra eGFR trước khi chọn liều ARNI', cits);
      if (need(ctx, 'lvef') === undefined) return null;

      const sbpContra = thFor('sbp', 'hf.arni.sbp_contra_min');
      const sbpStart = thFor('sbp', 'hf.arni.sbp_min_start');
      const sbpLow = thFor('sbp', 'hf.arni.sbp_low_dose');
      const egfrEsrd = thFor('egfr', 'hf.arni.egfr_esrd_min');
      const egfrLow = thFor('egfr', 'hf.arni.egfr_low_dose');
      const kHold = thFor('k', 'hf.arni.k_max_hold');
      const kCaution = thFor('k', 'hf.arni.k_max_caution');
      const washoutHrs = thFor('duration_hours', 'hf.arni.washout_acei_hours');
      const efEsc = thFor('lvef', 'hf.ef.hfref_max_esc2026');

      const gates: GateResult[] = [
        { parameter: 'SBP', passed: sbp >= (activeArni ? sbpContra : sbpStart), value: sbp, threshold: `>= ${activeArni ? sbpContra : sbpStart}`, messageVi: `SBP >= ${activeArni ? sbpContra : sbpStart} mmHg` },
        { parameter: 'K+', passed: activeArni ? k <= kHold : k <= kCaution, value: k, threshold: `<= ${activeArni ? kHold : kCaution}`, messageVi: `K+ <= ${activeArni ? kHold : kCaution} mmol/L` },
        { parameter: 'eGFR', passed: egfr >= egfrEsrd, value: egfr, threshold: `>= ${egfrEsrd}`, messageVi: `eGFR >= ${egfrEsrd} mL/phút/1,73m²` },
      ];

      if (egfr < egfrEsrd) {
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: activeArni ? 'HOLD' : 'AVOID',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: `${activeArni ? 'Tạm ngưng và hội chẩn chuyên khoa' : 'Tránh khởi trị thường quy'} Sacubitril/valsartan khi eGFR dưới ${egfrEsrd}`,
          rationale: `eGFR hiện tại (${egfr} mL/phút/1,73m²) dưới ngưỡng ${egfrEsrd} mL/phút/1,73m²; ESC 2026 khuyến cáo tạm ngưng/tránh tự động khởi trị ARNI.`,
          gates,
          citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', ...cits],
          priority: 92,
        };
      }

      if (sbp < sbpContra || k > kHold) {
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: 'Tạm hoãn Sacubitril/valsartan do huyết áp thấp hoặc tăng kali máu',
          rationale: `Cần ổn định SBP từ ${sbpContra} mmHg và hạ K+ xuống không vượt quá ${kHold} mmol/L trước khi dùng hoặc chuyển sang ARNI.`,
          gates,
          citationIds: ['esc.hf.2026.rasi_table_s4_k55', ...cits],
          priority: 94,
        };
      }

      if (!activeArni && k > kCaution) {
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: `Tạm hoãn khởi trị mới Sacubitril/valsartan do K+ trên ${kCaution} mmol/L`,
          rationale: `Theo ESC 2026 Bảng S5, cần thận trọng kiểm soát kali máu về <= ${kCaution} mmol/L trước khi khởi trị mới ARNI (nếu đang duy trì thì chấp nhận tới <= ${kHold} mmol/L).`,
          gates,
          citationIds: ['esc.hf.2026.arni_table_s5_contra_caution', 'esc.hf.2026.arni_table_s5_k55'],
          priority: 90,
        };
      }

      if (!activeArni && (sbp < sbpStart || isOutpatientDecompensatedCrisis(ctx))) {
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'DEFER',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          title: sbp < sbpStart
            ? `Trì hoãn khởi trị mới Sacubitril/valsartan cho tới khi SBP đạt từ ${sbpStart} mmHg`
            : 'Trì hoãn khởi trị mới Sacubitril/valsartan ngoại trú cho tới khi ổn định đợt mất bù cấp',
          rationale: sbp < sbpStart
            ? `SBP hiện tại (${sbp} mmHg) thấp hơn ngưỡng khởi trị an toàn ${sbpStart} mmHg của ARNI.`
            : 'Bệnh nhân mất bù cấp nặng tại phòng khám cần nhập viện giải áp sung huyết ổn định trước khi khởi trị ARNI.',
          gates,
          citationIds: cits,
          priority: 82,
        };
      }

      const activeAcei = findCurrentMed(ctx, ACEI_IDS);
      const needWashout = !activeArni && (Boolean(getCustomInput(ctx, 'takingAcei')) || Boolean(activeAcei));
      if (needWashout) {
        const aceiDisp = activeAcei ? getDrugDisplayVi(activeAcei.drugId, activeAcei) : 'ACEi';
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          switchFrom: activeAcei?.drugId,
          title: `Tạm hoãn Sacubitril/valsartan chờ đủ ${washoutHrs} giờ washout sau khi ngưng ${aceiDisp}`,
          rationale: `Bắt buộc ngưng thuốc chứa ACEi (${aceiDisp}) tối thiểu ${washoutHrs} giờ trước khi uống viên Sacubitril/valsartan đầu tiên để phòng biến chứng phù mạch cấp.`,
          gates,
          citationIds: ['esc.hf.2026.washout_acei_arni_36h', ...cits],
          priority: 93,
        };
      }

      const pheno = getHfPhenotype(ctx);
      if (activeArni) {
        const atTarget = isAtOrAboveTargetDose(ctx, activeArni, 'sacubitril_valsartan');
        const holdTitration = atTarget || pheno === 'hfimpef' || sbp < sbpStart || k > kCaution;
        const act: Action = holdTitration ? 'CONTINUE' : 'UPTITRATE';
        const curDoseStr = formatCurrentMedDoseVi(activeArni, 'sacubitril_valsartan');
        return {
          id: 'rec_hf_arni',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: act,
          drugId: 'sacubitril_valsartan',
          drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
          dose: act === 'UPTITRATE' ? `Tăng dần mỗi 2–4 tuần tới đích ${formatHfDose(dose('sacubitril_valsartan', 'target'))}` : curDoseStr,
          title: act === 'UPTITRATE' ? 'Chuẩn độ tăng liều Sacubitril/valsartan tới liều đích' : 'Tiếp tục duy trì Sacubitril/valsartan ở liều hiện tại',
          rationale: 'Duy trì hoặc chuẩn độ lên liều đích tối đa dung nạp của Sacubitril/valsartan (Class I-A); kiểm tra K+ và eGFR sau 1–2 tuần mỗi bước chỉnh liều.',
          gates,
          warnings: k > kCaution ? [`Kali máu hiện tại ${k} mmol/L (chấp nhận duy trì tới <= ${kHold} mmol/L): theo dõi sát điện giải và cân nhắc thuốc gắn kali nếu cần.`] : undefined,
          citationIds: ['esc.hf.2026.arni_table_s5_k55', ...cits],
          priority: 93,
        };
      }

      const activeArb = findCurrentMed(ctx, ARB_IDS);
      const matchedArbId = resolveMatchedComponentId(activeArb, ARB_IDS);
      const arbIsSpc = isCombinationMed(activeArb);
      const arbHasAmlo = activeArb ? expandDrugComponents(activeArb.drugId).includes('amlodipine') : false;
      const useLow =
        sbp < sbpLow ||
        egfr < egfrLow ||
        childPugh === 'B' ||
        (ctx.settings.profile === 'US' && !activeArb) ||
        (activeArb ? isLowDosePriorRasi(activeArb, matchedArbId) : false);

      const lowStartText = '24/26 mg x 2 lần/ngày (uống)'; // qa-allow: ui-step - chuỗi hàm lượng viên chuẩn 24/26 mg
      const startDose = useLow ? lowStartText : formatHfDose(dose('sacubitril_valsartan', 'start'));
      const arbDisp = activeArb ? getDrugDisplayVi(activeArb.drugId, activeArb) : '';

      return {
        id: 'rec_hf_arni',
        module: 'hf',
        tier: 'Trụ cột FMT (Class I)',
        tierOrder: 1,
        action: activeArb ? 'SWITCH' : 'START',
        drugId: 'sacubitril_valsartan',
        drugNameVi: getDrugDisplayVi('sacubitril_valsartan'),
        switchFrom: activeArb?.drugId,
        dose: `${startDose}; đích ${formatHfDose(dose('sacubitril_valsartan', 'target'))}`,
        title: activeArb
          ? `Chuyển trực tiếp từ ${arbDisp} sang Sacubitril/valsartan (ngưng hẳn ${arbDisp})`
          : 'Khởi trị trụ cột ARNI: Sacubitril/valsartan',
        rationale: activeArb
          ? `Ngưng ${arbDisp} và chuyển trực tiếp sang Sacubitril/valsartan (không cần washout 36 giờ khi chuyển từ ARB).${arbIsSpc && arbHasAmlo ? ' Do đang dùng viên phối hợp cố định, tách sang Amlodipine đơn chất nếu cần duy trì kiểm soát huyết áp.' : ''}`
          : `Khởi trị ARNI nền tảng (Class I-A); chọn liều khởi đầu thấp 24/26 mg x 2 lần/ngày khi SBP < ${sbpLow} mmHg, eGFR < ${egfrLow}, suy gan vừa Child-Pugh B hoặc chưa từng dùng/chỉ dùng liều thấp ACEi-ARB.`,
        gates,
        profileDiff: {
          INTL: `ESC 2026 (Bảng S5) cho phép khởi trị 24/26 mg hoặc 49/51 mg x 2 lần/ngày ở bệnh nhân chưa dùng ACEi/ARB tùy huyết áp và chức năng thận/gan; áp dụng cho toàn bộ HFrEF có LVEF dưới ${efEsc}%.`,
          US: 'Nhãn FDA Entresto khuyến cáo khởi đầu 24/26 mg x 2 lần/ngày cho mọi bệnh nhân chưa từng dùng ACEi/ARB hoặc đang dùng liều thấp ACEi/ARB.',
          VN: 'BYT QĐ 1857/2022 ưu tiên Sacubitril/valsartan (24/26 hoặc 49/51 mg x 2 lần/ngày, đích 97/103 mg x 2 lần/ngày) cho HFrEF.',
        },
        citationIds: [
          'esc.hf.2026.arni_table_s5_doses',
          'fda.hf.sacubitril_hepatic',
          ...cits,
        ],
        priority: 95,
      };
    },
  },
];
