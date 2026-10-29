/**
 * GDMT-VN CKD Module - Pillar 2b: RASi Titration, Renal Dose Reduction & Biochemical Monitoring (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Orthostatic Gate, FDC/Hepatic Ceiling & Biochemical Monitoring)
 * Bao phủ: CKD-R4-R2-01, CKD-R4-R2-02, CKD-R4-R2-05, CKD-R4-R3-06, CKD-R4-R3-08
 */

import type { CurrentMed, Rule } from '../../engine/types';
import { getCkdRasiDoseState } from './helpers.rasiOptimization';
import { hasCondition, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import { evaluateHepaticSafety } from '../../engine/safety/hepaticSafety';
import {
  extractRasiComponentId,
  getRenalMaxDailyDoseInfo,
  getTargetMaxDailyDoseMg,
  hasBilateralRenalArteryStenosis,
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasExcessiveRasiCreatinineRise,
  hasSuspectedRenalArteryStenosis,
  isAceiMed,
  isAkiActive,
  isArbMed,
  isArniMed,
  isBreastfeedingCkd,
  isChildPughB,
  isChildPughC,
  isCkdLactationUnsafe,
  isDriMed,
  isFdcMed,
  isKSparingOrSteroidalMraMed,
  isOutpatientAcuteCrisis,
  isRasiOrArniMed,
  medDisplayName,
  normalizeDrugId,
  parseCurrentDailyDoseMg,
} from './helpers';

function getAllRaaBlockers(meds: CurrentMed[]): CurrentMed[] {
  return meds.filter((m) => isRasiOrArniMed(m) || isDriMed(m));
}

export const ckdOutpatientRasiTitrationRules: Rule[] = [
  // 1. Chuẩn độ RASi đến tổng liều tối đa trong ngày theo chức năng thận & gan
  {
    id: 'ckd.outpatient.rasi_uptitrate',
    module: 'ckd',
    nameVi: 'Chuẩn độ tăng liều RASi tới liều tối đa dung nạp theo chức năng thận',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      if (hasCkdFlag(ctx, 'priorAngioedema') || Boolean(ctx.patient.conditions?.allergyAceiArb)) return false;
      if (hasBilateralRenalArteryStenosis(ctx) || hasSuspectedRenalArteryStenosis(ctx)) return false;
      if (hasExcessiveRasiCreatinineRise(ctx)) return false;
      if (hasCondition(ctx, 'orthostaticHypotension')) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      if (isChildPughC(ctx)) return false;

      const custom = ctx.normalized?.customInputs ?? ctx.patient.customInputs;
      if (Boolean(custom?.rasiMaxTolerated)) return false;

      const egfr = need(ctx, 'egfr');
      if (egfr === undefined) return false;

      const raaMeds = getAllRaaBlockers(ctx.patient.currentMeds);
      if (raaMeds.length !== 1) return false; // qa-allow: index - chỉ chuẩn độ khi đơn trị RASi
      const activeRasi = raaMeds[0]; // qa-allow: index - thuốc RASi duy nhất
      if (isArniMed(activeRasi) || isDriMed(activeRasi)) return false;
      if (hasCkdDrugAllergy(ctx, activeRasi.drugId)) return false;
      if (isBreastfeedingCkd(ctx) && isCkdLactationUnsafe(ctx, activeRasi.drugId)) return false;

      if (
        ctx.patient.currentMeds.some(
          (m) => isKSparingOrSteroidalMraMed(m) || normalizeDrugId(m.drugId) === 'finerenone'
        )
      ) {
        return false;
      }

      const rasiCompId = extractRasiComponentId(activeRasi);
      if (!rasiCompId) return false;
      // A contraindicated ARB is handled by the shared same-drug hepatic stop,
      // rather than emitting an upstream titration with irrelevant renal evidence.
      if ((rasiCompId === 'telmisartan' || rasiCompId === 'candesartan') &&
        evaluateHepaticSafety(rasiCompId, rasiCompId, new Set(['arb']), drug(rasiCompId), ctx.normalized)?.actionForCurrent === 'STOP') return false;
      if (isFdcMed(activeRasi)) {
        const parsedComp = parseCurrentDailyDoseMg(activeRasi, rasiCompId);
        if (parsedComp === undefined) return false;
      }

      if (
        ctx.settings.profile === 'VN' &&
        rasiCompId === 'perindopril' &&
        egfr < thFor('egfr', 'ckd.egfr.g3b_min')
      ) {
        return false;
      }

      const currentDailyMg = parseCurrentDailyDoseMg(activeRasi, rasiCompId);
      const rasiEntry = drug(rasiCompId);
      const targetDailyMg = getTargetMaxDailyDoseMg(rasiEntry);
      if (targetDailyMg !== undefined && currentDailyMg !== undefined && currentDailyMg >= targetDailyMg) {
        return false;
      }

      const doseState = getCkdRasiDoseState(ctx, activeRasi);
      if (doseState.vnRenalContra) return false;
      if (doseState.effectiveMaxMg !== undefined && currentDailyMg !== undefined && currentDailyMg >= doseState.effectiveMaxMg) return false;

      const sbp = need(ctx, 'sbp');
      const k = need(ctx, 'k');
      const uacr = need(ctx, 'uacr');
      if (sbp === undefined || k === undefined) return false;

      const needOptimization =
        sbp >= thFor('sbp', 'ckd.bp.target_sbp_kdigo') ||
        (uacr !== undefined && uacr >= thFor('uacr', 'ckd.uacr.a1_max_mgmmol'));
      const canTolerate =
        sbp >= thFor('sbp', 'ckd.rasi.sbp_initiate_min') &&
        k <= thFor('k', 'ckd.rasi.k_uptitrate_max');

      return needOptimization && canTolerate;
    },
    produce: (ctx) => {
      const activeRasi = getAllRaaBlockers(ctx.patient.currentMeds)[0]!; // qa-allow: index - đơn trị RASi
      const rasiCompId = extractRasiComponentId(activeRasi)!;
      const rasiId = normalizeDrugId(activeRasi.drugId);
      const rasiEntry = drug(rasiCompId);
      const rasiName = medDisplayName(activeRasi);
      const sbp = need(ctx, 'sbp')!;
      const k = need(ctx, 'k')!;
      const minSbp = thFor('sbp', 'ckd.rasi.sbp_initiate_min');
      const maxUpK = thFor('k', 'ckd.rasi.k_uptitrate_max');
      const { renalCeiling: ceiling, effectiveMaxMg, hepaticMax } = getCkdRasiDoseState(ctx, activeRasi);

      const fdcNote = isFdcMed(activeRasi)
        ? ` (nếu đang dùng viên phối hợp cố định liều, chuyển đổi hàm lượng thành phần ${rasiEntry.nameVi} mà không làm quá liều hoạt chất đi kèm)`
        : '';
      const doseGuidance =
        effectiveMaxMg !== undefined
          ? `Tăng lên nấc liều tiếp theo (hướng tới đích tối đa dung nạp ${effectiveMaxMg} mg/ngày ${rasiEntry.nameVi})`
          : 'Tăng lên nấc liều tiếp theo (hướng tới liều tối đa dung nạp)';
      const cids = ceiling
        ? Array.from(
            new Set([
              'kdigo.ckd.2024.pp_3_6_1_rasi_max_dose',
              'kdigo.ckd.2024.pp_3_6_2_rasi_monitoring',
              ...ceiling.citationIds,
            ])
          )
        : ['kdigo.ckd.2024.pp_3_6_1_rasi_max_dose', 'kdigo.ckd.2024.pp_3_6_2_rasi_monitoring'];
      const hepaticCandesartan = rasiCompId === 'candesartan' && isChildPughB(ctx);
      let hepaticNote = hepaticCandesartan
        ? ' Candesartan ở Child-Pugh B: giảm liều khởi đầu theo nhãn, không lấy liều khởi đầu làm trần duy trì; chuẩn độ thận trọng theo đáp ứng và dung nạp, kiểm tra huyết áp, K⁺ và SCr sau 2–4 tuần.'
        : '';
      if (hepaticCandesartan) cids.push('fda.candesartan.adult_dose_range', 'fda.candesartan.moderate_hepatic_start');
      if (hepaticMax !== undefined) {
        cids.push('ema.telmisartan.hepatic_max_40');
        hepaticNote += ` Giới hạn theo gan ${hepaticMax} mg/ngày dựa trên SmPC EMA Micardis, được GDMT-VN áp dụng thận trọng cho cả ba profile; không coi là trần liều FDA. Nếu chưa xác định mức độ suy gan, cần đánh giá phân độ trước khi thực hiện chuẩn độ; cờ bệnh gan không tự xác nhận Child-Pugh A/B.`;
      }

      return {
        id: 'rec_ckd_rasi_uptitrate',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: 'UPTITRATE',
        drugId: rasiId,
        drugNameVi: rasiName,
        dose: doseGuidance,
        title: `Tăng liều ${rasiName} đến liều tối đa dung nạp theo chức năng thận`,
        rationale: `Theo KDIGO 2024 (Practice Point 3.6.1): RASi cần được chuẩn độ tới liều tối đa được phê duyệt mà bệnh nhân dung nạp được${effectiveMaxMg !== undefined ? ` (đích bảo vệ thận tới ${effectiveMaxMg} mg/ngày)` : ''}${fdcNote} nhằm tối ưu hiệu quả giảm albumin niệu và bảo vệ thận.${hepaticNote}`,
        gates: [
          {
            parameter: 'SBP',
            passed: sbp >= minSbp,
            value: sbp,
            threshold: minSbp,
            messageVi: `Huyết áp tâm thu ${sbp} mmHg >= ${minSbp}: Đủ khoảng an toàn để tăng liều`,
          },
          {
            parameter: 'K+',
            passed: k <= maxUpK,
            value: k,
            threshold: maxUpK,
            messageVi: `Kali máu ${k} mmol/L <= ${maxUpK}: An toàn để chuẩn độ tăng liều`,
          },
        ],
        citationIds: cids,
        priority: 88,
      };
    },
    citationIds: ['kdigo.ckd.2024.pp_3_6_1_rasi_max_dose'],
  },

  // 2. Giảm liều ACEi thải qua thận (kể cả trong viên phối hợp FDC) khi vượt trần tích lũy dược động học
  {
    id: 'ckd.outpatient.rasi_renal_dose_reduce',
    module: 'ckd',
    nameVi: 'Hiệu chỉnh giảm liều thuốc ức chế hệ RAS vượt quá trần liều thận cho phép',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (hasCkdFlag(ctx, 'priorAngioedema') || Boolean(ctx.patient.conditions?.allergyAceiArb)) return false;
      if (hasBilateralRenalArteryStenosis(ctx) || isAkiActive(ctx) || hasExcessiveRasiCreatinineRise(ctx)) {
        return false;
      }

      const k = need(ctx, 'k');
      if (k !== undefined && k > thFor('k', 'ckd.rasi.k_hold_threshold')) return false;

      const onDialysis = hasCkdFlag(ctx, 'onDialysis');
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      if (!onDialysis && egfr === undefined && crcl === undefined) return false;

      const raaMeds = getAllRaaBlockers(ctx.patient.currentMeds);
      if (raaMeds.length !== 1) return false; // qa-allow: index - kiểm tra đơn trị RASi

      const activeRasi = raaMeds[0]; // qa-allow: index - phần tử đơn trị duy nhất
      const rasiCompId = extractRasiComponentId(activeRasi);
      if (!rasiCompId) return false;

      const currentDailyMg = parseCurrentDailyDoseMg(activeRasi, rasiCompId);
      const ceiling = getRenalMaxDailyDoseInfo(rasiCompId, egfr, crcl, onDialysis);
      return (
        currentDailyMg !== undefined &&
        ceiling !== undefined &&
        currentDailyMg > ceiling.maxDailyMg
      );
    },
    produce: (ctx) => {
      const onDialysis = hasCkdFlag(ctx, 'onDialysis');
      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const activeRasi = getAllRaaBlockers(ctx.patient.currentMeds)[0]!; // qa-allow: index - đơn trị RASi
      const rasiCompId = extractRasiComponentId(activeRasi)!;
      const rasiId = normalizeDrugId(activeRasi.drugId);
      const rasiName = medDisplayName(activeRasi);
      const ceiling = getRenalMaxDailyDoseInfo(rasiCompId, egfr, crcl, onDialysis)!;
      const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');
      const effectiveClearance = crcl ?? egfr;
      const isVnPerindoprilLow =
        !onDialysis &&
        ctx.settings.profile === 'VN' &&
        rasiCompId === 'perindopril' &&
        effectiveClearance !== undefined &&
        effectiveClearance < g3bMin;

      const titleText = onDialysis
        ? `Giảm liều ${rasiName} trên bệnh nhân lọc máu chu kỳ (${ceiling.bandDoseText})`
        : isVnPerindoprilLow
          ? `Chuyển đổi / Giảm liều ${rasiName} (CrCl/eGFR < ${g3bMin} mL/phút: Vượt liều thận cho phép)`
          : `Giảm liều ${rasiName} về mức tối đa theo chức năng thận (${ceiling.bandDoseText})`;

      const clearanceDesc = onDialysis
        ? 'đang lọc máu định kỳ'
        : egfr !== undefined
          ? `có eGFR ${egfr.toFixed(0)} mL/phút/1.73m²`
          : `có CrCl ${effectiveClearance!.toFixed(0)} mL/phút`;

      const rationaleText = isVnPerindoprilLow
        ? `Bệnh nhân ${clearanceDesc} (< ${g3bMin}) đang dùng ${rasiName} vượt trần thải trừ thận. Theo BYT 2024 Bảng 12, Perindopril không khuyến cáo sử dụng khi CrCl < ${g3bMin} mL/phút (hoặc theo EMA SmPC tối đa ${ceiling.bandDoseText}). Khuyến cáo ưu tiên chuyển sang ARB không tích lũy thận như Losartan hoặc tách viên phối hợp để giảm về đúng liều chỉnh thận.`
        : `Theo KDIGO 2024 (PP 3.6.1) và nhãn thuốc chính thức / BYT 2024 Bảng 12: Bệnh nhân ${clearanceDesc} đang dùng ${rasiName} vượt trần tích lũy thận cho phép (${ceiling.bandDoseText}), làm tăng nguy cơ tích lũy chất chuyển hóa hoạt tính, tụt huyết áp và tăng kali máu. Khuyến cáo hiệu chỉnh về ${ceiling.bandDoseText}.`;

      const cids = isVnPerindoprilLow
        ? Array.from(new Set(['byt.ckd.2024.table_12_perindopril_crcl_30', ...ceiling.citationIds]))
        : Array.from(new Set(['kdigo.ckd.2024.pp_3_6_1_rasi_max_dose', ...ceiling.citationIds]));

      return {
        id: 'rec_ckd_rasi_renal_reduce',
        module: 'ckd',
        tier: 'An toàn chỉnh liều theo chức năng thận',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: rasiId,
        drugNameVi: rasiName,
        dose: ceiling.bandDoseText,
        title: titleText,
        rationale: rationaleText,
        gates: [
          {
            parameter: onDialysis ? 'dialysis' : 'eGFR',
            passed: false,
            value: onDialysis ? 'HD/PD' : egfr ?? crcl,
            messageVi: `Bệnh nhân ${clearanceDesc}: Liều hiện tại vượt trần liều thận (${ceiling.bandDoseText})`,
          },
        ],
        citationIds: cids,
        priority: 91,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_6_1_rasi_max_dose',
      'ema.perindopril.table_1_renal_adjustment',
      'byt.ckd.2024.table_12_acei_dosing',
    ],
  },

  // 3. Theo dõi sinh hóa 2–4 tuần sau khởi trị/tăng liều RASi
  {
    id: 'ckd.outpatient.rasi_monitoring',
    module: 'ckd',
    nameVi: 'Kiểm tra Creatinin và Kali máu 2–4 tuần sau điều chỉnh RASi',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (hasCkdFlag(ctx, 'priorAngioedema') || Boolean(ctx.patient.conditions?.allergyAceiArb)) return false;
      if (hasBilateralRenalArteryStenosis(ctx) || hasExcessiveRasiCreatinineRise(ctx)) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const k = need(ctx, 'k');
      if (k !== undefined && k > thFor('k', 'ckd.rasi.k_hold_threshold')) return false;

      const aceiMeds = ctx.patient.currentMeds.filter((m) => isAceiMed(m));
      const arbMeds = ctx.patient.currentMeds.filter((m) => isArbMed(m));
      const hasDri = ctx.patient.currentMeds.some((m) => isDriMed(m));
      return !hasDri && aceiMeds.length + arbMeds.length === 1; // qa-allow: index - chỉ theo dõi khi đơn trị RASi
    },
    produce: () => {
      const maxCrRisePct = thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct');
      const kHold = thFor('k', 'ckd.rasi.k_hold_threshold');

      return {
        id: 'rec_ckd_rasi_monitor',
        module: 'ckd',
        tier: 'Kế hoạch theo dõi & An toàn',
        tierOrder: 3,
        action: 'MONITOR',
        title: 'Định lượng lại Creatinin và Kali máu sau 2–4 tuần',
        rationale: `Theo KDIGO 2024 (Practice Point 3.6.2 và 3.6.4): Cần kiểm tra lại Cr và K+ sau 2–4 tuần. Chấp nhận mức tăng Creatinin lên tới ${maxCrRisePct}% so với ban đầu; chỉ giảm liều hoặc ngừng thuốc nếu Creatinin tăng > ${maxCrRisePct}% hoặc K+ > ${kHold} mmol/L.`,
        gates: [],
        citationIds: [
          'kdigo.ckd.2024.pp_3_6_2_rasi_monitoring',
          'kdigo.ckd.2024.pp_3_6_4_creatinine_rise_30pct',
        ],
        priority: 80,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_6_2_rasi_monitoring',
      'kdigo.ckd.2024.pp_3_6_4_creatinine_rise_30pct',
    ],
  },
];
