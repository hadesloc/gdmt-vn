import type { Action, GateResult, Rule } from '../../engine/types';
import { hasCondition, missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  formatHfDose,
  getCongestionStatus,
  getDrugDisplayVi,
  hasDrugAllergy,
  hasExtraCondition,
  hasHfContext,
  isShockOrInotrope,
  LOOP_DIURETIC_IDS,
  parseHfDailyDoseMg,
  resolveMatchedComponentId,
  SGLT2I_IDS,
} from './helpers';

export const hfInpatientAcuteRules: Rule[] = [
  {
    id: 'hf.inpatient.shock_triage',
    module: 'hf',
    nameVi: 'Xử trí cấp cứu sốc tim / giảm tưới máu (Nội viện & Ngoại trú)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.acute_inotropes_shock_sbp90'],
    when: (ctx) => hasHfContext(ctx) && isShockOrInotrope(ctx),
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp');
      const sbpShock = thFor('sbp', 'hf.acute.shock_sbp');
      const isHypotensive = sbp !== undefined && sbp < sbpShock;
      return {
        id: 'rec_hf_inpatient_shock',
        module: 'hf',
        tier: 'Cấp cứu Sốc tim / Hồi sức tích cực (Class I)',
        tierOrder: 0,
        action: 'REFER',
        title: isHypotensive
          ? `Cảnh báo Sốc tim / Tụt huyết áp nặng (SBP ${sbp} < ${sbpShock} mmHg): Chuyển ngay CCU/ICU & Tạm ngưng thuốc hạ áp`
          : 'Cảnh báo Sốc tim giảm tưới máu mô / Đang phụ thuộc thuốc vận mạch - tăng co bóp: Hồi sức CCU/ICU & Tạm ngưng thuốc giãn mạch/chẹn beta',
        rationale: isHypotensive
          ? `Bệnh nhân có dấu hiệu sốc tim kèm tụt huyết áp nặng (SBP ${sbp} mmHg < ${sbpShock} mmHg): chuyển ngay Hồi sức Tim mạch, tìm nguyên nhân cấp (CHAMPIT), tạm ngưng các thuốc giãn mạch/chẹn beta và cân nhắc Norepinephrine / Dobutamine để phục hồi tưới máu tạng.`
          : `Bệnh nhân có biểu hiện sốc tim giảm tưới máu ngoại biên hoặc đang truyền thuốc vận mạch/tăng co bóp${sbp !== undefined ? ` (huyết áp hiện tại ${sbp} mmHg nhờ bù trừ co mạch/vận mạch)` : ''}: bắt buộc theo dõi tại CCU/ICU và tạm ngưng toàn bộ chẹn beta, ARNI/ACEi/ARB, SGLT2i đường uống cho tới khi cai hết vận mạch và tưới máu ổn định.`,
        gates: [{ parameter: 'Huyết động / Tưới máu', passed: false, value: sbp, threshold: `Không sốc & SBP >= ${sbpShock}`, messageVi: 'Sốc tim / phụ thuộc vận mạch' }],
        citationIds: ['esc.hf.2026.acute_inotropes_shock_sbp90'],
        priority: 100,
      };
    },
  },
  {
    id: 'hf.inpatient.missing_congestion',
    module: 'hf',
    nameVi: 'Yêu cầu xác định tình trạng sung huyết nội viện trước khi chỉ định lợi tiểu TM hoặc xuất viện',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.acute_iv_diuretics', 'esc.hf.2026.acute_predischarge_fmt'],
    when: (ctx) =>
      hasHfContext(ctx) &&
      !isShockOrInotrope(ctx) &&
      getCongestionStatus(ctx) === undefined &&
      !hasCondition(ctx, 'acutePulmonaryEdema'),
    produce: () =>
      missingInputRec(
        'hf',
        'congestion',
        'phân biệt đang sung huyết cấp (cần Furosemide tĩnh mạch) hay đã đẳng dịch euvolaemic (sẵn sàng tối ưu GDMT trước xuất viện)',
        ['esc.hf.2026.acute_iv_diuretics', 'esc.hf.2026.acute_predischarge_fmt']
      ),
  },
  {
    id: 'hf.inpatient.iv_diuretic',
    module: 'hf',
    nameVi: 'Lợi tiểu quai đường tĩnh mạch & Theo dõi đáp ứng bài niệu (Spot uNa+ 2h / Nước tiểu 6h)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.acute_iv_diuretics',
      'esc.hf.2026.acute_diuretic_protocol',
      'esc.hf.2026.acute_furosemide_40_max600',
      'fda.hf.bumetanide_equiv_40mg',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      const cong = getCongestionStatus(ctx);
      return cong === 'mild' || cong === 'overt' || hasCondition(ctx, 'acutePulmonaryEdema') || isShockOrInotrope(ctx);
    },
    produce: (ctx) => {
      const cits = [
        'esc.hf.2026.acute_iv_diuretics',
        'esc.hf.2026.acute_diuretic_protocol',
        'esc.hf.2026.acute_furosemide_40_max600',
        'fda.hf.bumetanide_equiv_40mg',
      ];
      if (hasExtraCondition(ctx, 'anuria') || hasDrugAllergy(ctx, ['furosemide', 'lasix', 'sulfonamide'])) {
        return {
          id: 'rec_hf_inpatient_iv_furo',
          module: 'hf',
          tier: 'Giải áp sung huyết nội viện (An toàn lợi tiểu)',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'furosemide',
          drugNameVi: getDrugDisplayVi('furosemide'),
          title: 'Chống chỉ định Furosemide tĩnh mạch (vô niệu hoàn toàn hoặc dị ứng sulfonamide nặng)',
          rationale: 'Cần hội chẩn siêu lọc máu (ultrafiltration/CRRT) nếu vô niệu kèm quá tải dịch hoặc chuyển sang Acid ethacrynic nếu dị ứng sulfonamide.',
          gates: [],
          citationIds: ['fda.hf.bumetanide_contra_anuria_hepatic', ...cits],
          priority: 95,
        };
      }

      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) {
        return missingInputRec('hf', 'sbp', 'đánh giá huyết áp và tưới máu trước khi tiêm lợi tiểu quai tĩnh mạch nội viện', cits);
      }
      const sbpShock = thFor('sbp', 'hf.acute.shock_sbp');
      if (isShockOrInotrope(ctx) || sbp < sbpShock) {
        return {
          id: 'rec_hf_inpatient_iv_furo',
          module: 'hf',
          tier: 'Giải áp sung huyết nội viện (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: 'furosemide',
          drugNameVi: getDrugDisplayVi('furosemide'),
          title: `Tạm hoãn đẩy mạnh Furosemide tĩnh mạch khi đang sốc tim / SBP < ${sbpShock} mmHg`,
          rationale: 'Ở bệnh nhân suy tim cấp kèm tụt huyết áp hoặc giảm tưới máu mô, cần ưu tiên ổn định huyết động và tưới máu trước khi dùng lợi tiểu tĩnh mạch liều cao.',
          gates: [{ parameter: 'SBP', passed: false, value: sbp, threshold: `>= ${sbpShock} mmHg`, messageVi: `Sốc tim / SBP < ${sbpShock} mmHg` }],
          citationIds: ['esc.hf.2026.acute_inotropes_shock_sbp90', ...cits],
          priority: 95,
        };
      }

      const una2h = need(ctx, 'urinarySodium2h');
      const uo6h = need(ctx, 'urineOutputRate6h');
      const unaMin = thFor('urinary_sodium', 'hf.acute.una_min');
      const uoMin = thFor('urine_output_rate', 'hf.acute.urine_output_rate_min');
      const naiveIvMg = thFor('dose_mg', 'hf.acute.furosemide_iv_naive_mg');
      const maxIvMg = thFor('dose_mg', 'hf.acute.furosemide_iv_max_mg');
      const activeOralLoop = findCurrentMed(ctx, LOOP_DIURETIC_IDS);
      const matchedLoopId = resolveMatchedComponentId(activeOralLoop, LOOP_DIURETIC_IDS);

      let oralFuroEquivMg: number | undefined;
      if (activeOralLoop && matchedLoopId) {
        const rawDaily = parseHfDailyDoseMg(activeOralLoop, matchedLoopId);
        if (rawDaily !== undefined) {
          if (matchedLoopId === 'bumetanide') oralFuroEquivMg = rawDaily * 40; // qa-allow: unit-conversion - 1 mg bumetanide = 40 mg furosemide uống
          else if (matchedLoopId === 'torsemide') oralFuroEquivMg = rawDaily * 2; // qa-allow: unit-conversion - 20 mg torsemide = 40 mg furosemide uống
          else oralFuroEquivMg = rawDaily;
        }
      }

      const poorResponse = (una2h !== undefined && una2h < unaMin) || (uo6h !== undefined && uo6h < uoMin);
      const gates: GateResult[] = [
        { parameter: 'SBP', passed: true, value: sbp, threshold: `>= ${sbpShock}`, messageVi: `SBP >= ${sbpShock} mmHg` },
      ];
      if (una2h !== undefined) {
        gates.push({ parameter: 'Spot uNa+ 2h', passed: una2h >= unaMin, value: una2h, threshold: `>= ${unaMin} mmol/L`, messageVi: `uNa+ 2h >= ${unaMin} mmol/L` });
      }
      if (uo6h !== undefined) {
        gates.push({ parameter: 'Nước tiểu 6h', passed: uo6h >= uoMin, value: uo6h, threshold: `>= ${uoMin} mL/h`, messageVi: `Nước tiểu >= ${uoMin} mL/giờ` });
      }

      const calcInitIv = oralFuroEquivMg !== undefined
        ? Math.min(maxIvMg, Math.max(naiveIvMg, Math.round(oralFuroEquivMg * 2)))
        : undefined;
      const calcDoubleIv = calcInitIv !== undefined ? Math.min(maxIvMg, calcInitIv * 2) : undefined;

      const doseText = poorResponse
        ? calcDoubleIv !== undefined
          ? `Tăng gấp đôi lên ${calcDoubleIv} mg Furosemide tiêm/truyền tĩnh mạch (tối đa ${maxIvMg} mg/ngày) và phối hợp lợi tiểu đa tầng`
          : `Gấp đôi liều Furosemide tĩnh mạch hiện tại (tối đa ${maxIvMg} mg/ngày) và phối hợp lợi tiểu đa tầng`
        : calcInitIv !== undefined
          ? `Furosemide ${calcInitIv} mg tiêm tĩnh mạch (tương đương >= 2 lần liều lợi tiểu quai uống tại nhà; tối đa ${maxIvMg} mg/ngày)`
          : activeOralLoop
            ? `Furosemide tĩnh mạch liều khởi đầu >= 2 lần tổng liều uống tương đương Furosemide hàng ngày (tối thiểu ${naiveIvMg} mg TM, tối đa ${maxIvMg} mg/ngày)`
            : `Furosemide ${naiveIvMg} mg tiêm tĩnh mạch (tối đa ${maxIvMg} mg/ngày theo đáp ứng)`;

      const onHomeFuro = matchedLoopId === 'furosemide';
      const actIv: Action = onHomeFuro ? 'UPTITRATE' : 'START';

      return {
        id: 'rec_hf_inpatient_iv_furo',
        module: 'hf',
        tier: 'Giải áp sung huyết nội viện (Class I)',
        tierOrder: 1,
        action: actIv,
        drugId: 'furosemide',
        drugNameVi: `${getDrugDisplayVi('furosemide')} (tĩnh mạch)`,
        dose: doseText,
        title: poorResponse
          ? 'Đáp ứng bài niệu kém: Tăng gấp đôi liều Furosemide tĩnh mạch & Phối hợp lợi tiểu đa tầng'
          : onHomeFuro
            ? 'Chuyển sang & tăng liều Furosemide đường tĩnh mạch (>= 2 lần liều uống nền) giải áp sung huyết cấp'
            : 'Khởi trị ngay Furosemide đường tĩnh mạch giải áp sung huyết cấp',
        rationale: poorResponse
          ? `Natri niệu điểm sau 2 giờ < ${unaMin} mmol/L hoặc lượng nước tiểu 6 giờ đầu < ${uoMin} mL/giờ: ESC 2026 khuyến cáo gấp đôi liều Furosemide tĩnh mạch cho tới liều trần và phối hợp Acetazolamide TM hoặc Thiazide.`
          : `Khuyến cáo Class I-C tiêm tĩnh mạch lợi tiểu quai sớm cho bệnh nhân suy tim cấp quá tải dịch (qui đổi tương đương liều uống sang Furosemide TM); kiểm tra uNa+ điểm sau 2 giờ (đích >= ${unaMin} mmol/L) và nước tiểu 6 giờ đầu (đích >= ${uoMin} mL/giờ).`,
        gates,
        profileDiff: {
          INTL: 'ESC 2026 khuyến cáo liều Furosemide TM khởi đầu >= 2 lần tổng liều uống hàng ngày ở bệnh nhân đang dùng lợi tiểu mạn.',
          US: 'AHA/ACC/HFSA 2022 cho phép khởi đầu bằng 1–2 lần tổng liều uống hàng ngày.',
          VN: 'BYT QĐ 1857/2022 khuyến cáo khởi đầu 1–2 lần liều uống hàng ngày và điều chỉnh sớm theo đáp ứng bài niệu.',
        },
        citationIds: cits,
        priority: 96,
      };
    },
  },
  {
    id: 'hf.inpatient.diuretic_combination_acetazolamide',
    module: 'hf',
    nameVi: 'Phối hợp ngắn hạn Acetazolamide tĩnh mạch (ADVOR) khi đáp ứng lợi tiểu quai kém',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.acute_acetazolamide_rec',
      'esc.hf.2026.acute_acetazolamide_500mg',
      'esc.hf.2026.acute_acetazolamide_table_s13',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isShockOrInotrope(ctx)) return false;
      const cong = getCongestionStatus(ctx);
      if (cong !== 'mild' && cong !== 'overt' && !hasCondition(ctx, 'acutePulmonaryEdema')) return false;
      const una2h = need(ctx, 'urinarySodium2h');
      const uo6h = need(ctx, 'urineOutputRate6h');
      const unaMin = thFor('urinary_sodium', 'hf.acute.una_min');
      const uoMin = thFor('urine_output_rate', 'hf.acute.urine_output_rate_min');
      return (una2h !== undefined && una2h < unaMin) || (uo6h !== undefined && uo6h < uoMin);
    },
    produce: (ctx) => {
      const k = need(ctx, 'k'), na = need(ctx, 'na'), egfr = need(ctx, 'egfr');
      const onSglt2 = Boolean(findCurrentMed(ctx, SGLT2I_IDS));
      const sulfaAllergy = hasDrugAllergy(ctx, ['acetazolamide', 'sulfonamide']);
      const lowK = k !== undefined && k <= thFor('k', 'hf.digoxin.k_min');
      const lowNa = na !== undefined && na < thFor('na', 'hf.loop.na_hyponatremia_max');
      const lowEgfr = egfr !== undefined && egfr < thFor('egfr', 'hf.sglt2i.egfr_initiate_min');
      if (sulfaAllergy || lowK || lowNa || lowEgfr) return null;

      const acetStart = formatHfDose(dose('acetazolamide', 'start'));
      return {
        id: 'rec_hf_inpatient_acetazolamide',
        module: 'hf',
        tier: 'Giải áp sung huyết đa tầng (Class IIa - ADVOR)',
        tierOrder: 2,
        action: 'CONSIDER',
        drugId: 'acetazolamide',
        drugNameVi: `${getDrugDisplayVi('acetazolamide')} (hoặc Hydrochlorothiazide uống)`,
        dose: `${acetStart} trong tối đa 3 ngày (hoặc Hydrochlorothiazide 25–50 mg uống)`,
        title: 'Xem xét phối hợp ngắn hạn Acetazolamide tĩnh mạch giải quyết kháng lợi tiểu sớm (Class IIa-B1)',
        rationale: `Theo ESC 2026 (Rec Table 9, dựa trên thử nghiệm ADVOR), phối hợp ngắn hạn Acetazolamide (${acetStart}) hoặc Hydrochlorothiazide uống trên nền lợi tiểu quai giúp tăng tỷ lệ giải áp sung huyết thành công; theo dõi sát điện giải và toan chuyển hóa.`,
        gates: [],
        warnings: onSglt2 ? ['Thử nghiệm ADVOR loại trừ bệnh nhân đang dùng SGLT2i; nếu kết hợp cả hai thuốc tác động ống lượn gần cần theo dõi sát thể tích và điện giải.'] : undefined,
        citationIds: [
          'esc.hf.2026.acute_acetazolamide_rec',
          'esc.hf.2026.acute_acetazolamide_500mg',
          'esc.hf.2026.acute_acetazolamide_table_s13',
        ],
        priority: 84,
      };
    },
  },
];
