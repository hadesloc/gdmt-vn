import type { Action, Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  ACEI_IDS,
  ALL_MRA_IDS,
  ARB_IDS,
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getCustomInput,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteKidneyInjury,
  hasBackgroundFmt,
  hasHfContext,
  isAcutelyDecompensated,
  isAtOrAboveTargetDose,
  isLactating,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  LONG_ACTING_NITRATE_OR_SGC_IDS,
  PDE5I_IDS,
} from './helpers';

export const hfrefAmtVericiguatKbinderRules: Rule[] = [
  {
    id: 'hf.amt.vericiguat',
    module: 'hf',
    nameVi: 'Vericiguat sau đợt suy tim mất bù gần đây',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.vericiguat_rec',
      'esc.hf.2026.amt_doses_table11',
      'aha.hf.2022.vericiguat_victoria_sbp100',
      'fda.hf.vericiguat_dose_5mg_2026',
    ],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      if (findCurrentMed(ctx, ['vericiguat'])) return true;
      if (ctx.settings.setting !== 'outpatient' || isOutpatientDecompensatedCrisis(ctx)) return false;
      if (!hasBackgroundFmt(ctx)) return false;
      const lvef = need(ctx, 'lvef'), nyha = need(ctx, 'nyha');
      const recentWorsening = Boolean(getCustomInput(ctx, 'recentWorseningHf'));
      return recentWorsening && lvef !== undefined && lvef < thFor('lvef', 'hf.vericiguat.ef_max') && nyha !== undefined && nyha >= 2;
    },
    produce: (ctx) => {
      const activeVer = findCurrentMed(ctx, ['vericiguat']);
      const cits = [
        'esc.hf.2026.vericiguat_rec',
        'esc.hf.2026.amt_doses_table11',
        'aha.hf.2022.vericiguat_victoria_sbp100',
        'fda.hf.vericiguat_boxed_preg',
        'fda.hf.vericiguat_pde5_contra',
        'fda.hf.vericiguat_renal_hepatic',
        'fda.hf.vericiguat_dose_5mg_2026',
      ];
      const childPugh = getChildPugh(ctx);
      const onPde5 = findCurrentMed(ctx, PDE5I_IDS);
      const onLongNitrate = findCurrentMed(ctx, LONG_ACTING_NITRATE_OR_SGC_IDS);

      if (isPregnant(ctx) || isLactating(ctx) || isOnDialysis(ctx) || childPugh === 'C' || Boolean(onPde5) || Boolean(onLongNitrate)) {
        const why = isPregnant(ctx)
          ? 'mang thai (FDA Boxed Warning gây độc bào thai)'
          : isLactating(ctx)
            ? 'đang cho con bú'
            : childPugh === 'C'
              ? 'suy gan nặng Child-Pugh C'
              : isOnDialysis(ctx)
                ? 'đang lọc máu chu kỳ'
                : 'phối hợp thuốc ức chế PDE-5 / nitrat tác dụng dài / riociguat';
        return {
          id: 'rec_hf_vericiguat',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (Class IIb)',
          tierOrder: 2,
          action: activeVer ? 'STOP' : 'AVOID',
          drugId: 'vericiguat',
          drugNameVi: getDrugDisplayVi('vericiguat'),
          title: `${activeVer ? 'Ngưng ngay' : 'Chống chỉ định'} Vericiguat (${why})`,
          rationale: `Không sử dụng Vericiguat do ${why}.`,
          gates: [{ parameter: 'An toàn Vericiguat', passed: false, messageVi: why }],
          citationIds: cits,
          priority: 94,
        };
      }

      if (isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx) || (activeVer && isAcutelyDecompensated(ctx))) {
        return {
          id: 'rec_hf_vericiguat',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (Class IIb)',
          tierOrder: 2,
          action: 'HOLD',
          drugId: 'vericiguat',
          drugNameVi: getDrugDisplayVi('vericiguat'),
          title: 'Tạm hoãn Vericiguat do sốc tim / mất bù cấp / tổn thương thận cấp (AKI)',
          rationale: 'Tạm ngưng Vericiguat trong giai đoạn huyết động không ổn định hoặc suy thận cấp.',
          gates: [{ parameter: 'Huyết động / AKI', passed: false, messageVi: 'Sốc tim / mất bù cấp / AKI' }],
          citationIds: cits,
          priority: 91,
        };
      }

      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) return missingInputRec('hf', 'egfr', 'kiểm tra eGFR trước khi chỉ định hoặc duy trì Vericiguat', cits);
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi chỉ định hoặc duy trì Vericiguat', cits);

      const egfrMin = thFor('egfr', 'hf.vericiguat.egfr_min');
      const sbpMin = thFor('sbp', 'hf.vericiguat.sbp_min');
      const efMax = thFor('lvef', 'hf.vericiguat.ef_max');

      if (egfr < egfrMin) {
        return {
          id: 'rec_hf_vericiguat',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (Class IIb)',
          tierOrder: 2,
          action: activeVer ? 'STOP' : 'AVOID',
          drugId: 'vericiguat',
          drugNameVi: getDrugDisplayVi('vericiguat'),
          title: `${activeVer ? 'Ngưng' : 'Tránh khởi trị'} Vericiguat khi eGFR dưới ${egfrMin} mL/phút/1,73m²`,
          rationale: `Thử nghiệm VICTORIA loại trừ bệnh nhân eGFR < ${egfrMin} mL/phút/1,73m².`,
          gates: [{ parameter: 'eGFR', passed: false, value: egfr, threshold: `>= ${egfrMin}`, messageVi: `eGFR < ${egfrMin}` }],
          citationIds: cits,
          priority: 90,
        };
      }

      if (sbp < sbpMin) {
        return {
          id: 'rec_hf_vericiguat',
          module: 'hf',
          tier: 'Điều trị bổ trợ AMT (Class IIb)',
          tierOrder: 2,
          action: activeVer ? 'HOLD' : 'DEFER',
          drugId: 'vericiguat',
          drugNameVi: getDrugDisplayVi('vericiguat'),
          title: `${activeVer ? 'Tạm hoãn' : 'Trì hoãn khởi trị'} Vericiguat do SBP dưới ${sbpMin} mmHg`,
          rationale: `Không khởi trị hoặc tăng liều Vericiguat khi SBP dưới ${sbpMin} mmHg do nguy cơ tụt huyết áp có triệu chứng.`,
          gates: [{ parameter: 'SBP', passed: false, value: sbp, threshold: `>= ${sbpMin}`, messageVi: `SBP >= ${sbpMin} mmHg` }],
          citationIds: cits,
          priority: 82,
        };
      }

      const onPrnNtg = Boolean(findCurrentMed(ctx, ['nitroglycerin', 'glyceryl_trinitrate']));
      const usStartMg = thFor('dose_mg', 'hf.vericiguat.start_us_mg');
      const startStr =
        ctx.settings.profile === 'US' && sbp >= thFor('sbp', 'hf.arni.sbp_low_dose')
          ? `${usStartMg} mg x 1 lần/ngày (uống cùng thức ăn)`
          : formatHfDose(dose('vericiguat', 'start'));
      const act: Action = activeVer ? (isAtOrAboveTargetDose(ctx, activeVer, 'vericiguat') ? 'CONTINUE' : 'UPTITRATE') : 'CONSIDER';

      return {
        id: 'rec_hf_vericiguat',
        module: 'hf',
        tier: 'Điều trị bổ trợ AMT (Class IIb)',
        tierOrder: 2,
        action: act,
        drugId: 'vericiguat',
        drugNameVi: getDrugDisplayVi('vericiguat'),
        dose: act === 'CONTINUE'
          ? formatCurrentMedDoseVi(activeVer, 'vericiguat')
          : `${startStr}; tăng gấp đôi mỗi 2 tuần tới đích ${formatHfDose(dose('vericiguat', 'target'))}`,
        title: act === 'CONSIDER' ? 'Xem xét bổ sung Vericiguat sau đợt suy tim mất bù gần đây' : 'Tiếp tục / chuẩn độ Vericiguat',
        rationale: `Vericiguat (Class IIb-B1) cân nhắc bổ sung trên nền FMT tối ưu ở bệnh nhân LVEF dưới ${efMax}% vừa có đợt suy tim nặng lên nhằm giảm nhập viện suy tim và tử vong tim mạch.`,
        gates: [{ parameter: 'SBP', passed: true, value: sbp, threshold: `>= ${sbpMin}`, messageVi: `SBP >= ${sbpMin} mmHg` }],
        warnings: onPrnNtg ? ['Thận trọng theo dõi tụt huyết áp nếu dùng Nitroglycerin ngậm dưới lưỡi cắt cơn đau thắt ngực khi cần; tuyệt đối tránh nitrat tác dụng dài.'] : undefined,
        profileDiff: {
          INTL: 'ESC 2026 (Bảng 11) khuyến cáo khởi đầu 2.5 mg x 1 lần/ngày cùng thức ăn, đích 10 mg/ngày (Class IIb-B1).',
          US: `Nhãn FDA Verquvo cập nhật 01/2026 (VELOCITY) khuyến cáo khởi đầu ${usStartMg} mg x 1 lần/ngày cùng thức ăn (hoặc 2.5 mg nếu nguy cơ tụt áp), đích 10 mg/ngày.`,
          VN: 'Khởi đầu 2.5 mg x 1 lần/ngày cùng thức ăn, tăng dần tới đích 10 mg/ngày.',
        },
        citationIds: cits,
        priority: 74,
      };
    },
  },
  {
    id: 'hf.amt.potassium_binder_raasi_enabler',
    module: 'hf',
    nameVi: 'Thuốc gắn kali đường uống thế hệ mới (SZC / Patiromer) giúp duy trì và tối ưu hóa ARNI/RASi & MRA',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.potassium_binders', 'fda.hf.patiromer_dosing', 'fda.hf.szc_dosing'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isPregnant(ctx) || isShockOrInotrope(ctx) || isOnDialysis(ctx)) return false;
      const p = getHfPhenotype(ctx);
      if (p === 'unknown') return false;
      const k = need(ctx, 'k');
      if (k === undefined) return false;
      const kMin = thFor('k', 'hf.mra.k_max_initiate');
      const kMax = thFor('k', 'hf.mra.k_stop');
      if (k <= kMin || k >= kMax) return false;
      const onRaasiOrMra = Boolean(findCurrentMed(ctx, ['sacubitril_valsartan', ...ACEI_IDS, ...ARB_IDS, ...ALL_MRA_IDS]));
      return p === 'hfref' || onRaasiOrMra;
    },
    produce: (ctx) => {
      const k = need(ctx, 'k')!;
      const szcG = thFor('dose_g', 'hf.szc.maint_g');
      const patG = thFor('dose_g', 'hf.patiromer.start_g');
      const activeBinder = findCurrentMed(ctx, ['sodium_zirconium_cyclosilicate', 'patiromer']);
      return {
        id: 'rec_hf_potassium_binder',
        module: 'hf',
        tier: 'Tối ưu hóa dung nạp RAASi & MRA (Gắn kali thế hệ mới)',
        tierOrder: 2,
        action: activeBinder ? 'CONTINUE' : 'CONSIDER',
        drugId: activeBinder?.drugId ?? 'sodium_zirconium_cyclosilicate',
        drugNameVi: activeBinder ? getDrugDisplayVi(activeBinder.drugId, activeBinder) : 'Sodium zirconium cyclosilicate (Lokelma) hoặc Patiromer (Veltassa)',
        dose: activeBinder
          ? formatCurrentMedDoseVi(activeBinder)
          : `Sodium zirconium cyclosilicate duy trì ${szcG} g x 1 lần/ngày hoặc Patiromer khởi đầu ${patG} g x 1 lần/ngày (cách thuốc uống khác >= 3 giờ)`,
        title: `Xem xét thuốc gắn kali thế hệ mới (SZC / Patiromer) khi K+ ${k} mmol/L cản trở tối ưu ARNI/ACEi/ARB và MRA`,
        rationale: 'Theo ESC 2026 và DIAMOND/OPAL-HK, Patiromer hoặc Sodium zirconium cyclosilicate giúp kiểm soát tăng kali máu mạn tính để duy trì hoặc chuẩn độ lên liều đích ARNI/ACEi/ARB và MRA (không dùng Sodium polystyrene sulfonate mạn tính do nguy cơ hoại tử ruột và tải muối natri cao).',
        gates: [{ parameter: 'K+', passed: true, value: k, messageVi: `K+ ${k} mmol/L làm hạn chế liều RAASi/MRA` }],
        citationIds: ['esc.hf.2026.potassium_binders', 'fda.hf.patiromer_dosing', 'fda.hf.szc_dosing'],
        priority: 77,
      };
    },
  },
];
