/**
 * GDMT-VN CKD Module - Pillar 2c: RASi Hepatic Safety, Dual RAA/DRI Blockade & >30% SCr Rise Hold (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - >30% SCr rise HOLD, FDC/Aliskiren Dual RASi, Telmisartan/Candesartan/ARNI Hepatic Safety)
 * Bao phủ: CKD-R4-R2-01, CKD-R4-R2-05, CKD-R4-R2-08, CKD-R4-R2-09, CKD-R4-R3-05, CKD-R4-R3-06, CKD-R4-R3-12
 */

import type { CurrentMed, Rule } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  extractRasiComponentId,
  getScrRisePct,
  hasBilateralRenalArteryStenosis,
  hasCkdFlag,
  hasExcessiveRasiCreatinineRise,
  hasMildModerateHepaticImpairment,
  isAkiActive,
  isArbMed,
  isArniMed,
  isChildPughC,
  isDriMed,
  isRasiOrArniMed,
  medDisplayName,
  normalizeDrugId,
  parseCurrentDailyDoseMg,
} from './helpers';

function findHepaticContraRasiMed(meds: CurrentMed[]): CurrentMed | undefined {
  return meds.find((m) => {
    if (isArniMed(m)) return true;
    const comp = extractRasiComponentId(m);
    return comp === 'telmisartan' || comp === 'candesartan';
  });
}

function getAllRaaBlockers(meds: CurrentMed[]): CurrentMed[] {
  return meds.filter((m) => isRasiOrArniMed(m) || isDriMed(m));
}

export const ckdOutpatientRasiSafetyRules: Rule[] = [
  // 1a. Ngừng Telmisartan / Candesartan / Sacubitril-Valsartan ở suy gan nặng Child-Pugh C (CKD-R4-R2-05, CKD-R4-R2-09, CKD-R4-R3-12)
  {
    id: 'ckd.outpatient.rasi_hepatic_stop_telmisartan',
    module: 'ckd',
    nameVi: 'Ngừng Telmisartan, Candesartan hoặc Sacubitril/Valsartan ở suy gan nặng (Child-Pugh C)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || !isChildPughC(ctx)) return false;
      return Boolean(findHepaticContraRasiMed(ctx.patient.currentMeds));
    },
    produce: (ctx) => {
      const targetMed = findHepaticContraRasiMed(ctx.patient.currentMeds)!;
      const normId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      const comp = extractRasiComponentId(targetMed);
      const isArni = isArniMed(targetMed);
      const isCande = comp === 'candesartan';

      const cids = isArni
        ? ['fda.sacubitril_valsartan.hepatic_child_pugh_c']
        : isCande
          ? ['uk.candesartan.hepatic_cholestasis_contra', 'fda.candesartan.severe_hepatic_no_dosing']
          : ['ema.telmisartan.hepatic_biliary_contra'];

      const rationale = isArni
        ? 'Theo nhãn FDA Entresto (Section 8.7 Hepatic Impairment): Không khuyến cáo sử dụng Sacubitril/Valsartan ở bệnh nhân suy gan nặng (Child-Pugh C) do tăng phơi nhiễm hoạt chất.'
        : isCande
          ? 'Theo SmPC Anh/Viatris, Candesartan chống chỉ định khi suy gan nặng hoặc ứ mật. FDA Atacand không đưa khuyến cáo liều cho suy gan nặng; không diễn giải thành chống chỉ định FDA. GDMT-VN áp dụng cổng thận trọng SmPC Anh cho cả ba profile.'
          : 'Theo SmPC EMA Micardis, Telmisartan không được dùng khi ứ mật, tắc mật hoặc suy gan nặng. GDMT-VN áp dụng cổng thận trọng của SmPC châu Âu cho cả ba profile; không gán chống chỉ định này cho FDA.';

      return {
        id: 'rec_ckd_telmisartan_stop_hepatic',
        module: 'ckd',
        tier: 'Cảnh báo an toàn gan - thận',
        tierOrder: 0,
        action: 'STOP',
        drugId: normId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG NGAY ${medName} (Không khuyến cáo / Chống chỉ định ở suy gan nặng Child-Pugh C)`,
        rationale,
        gates: [
          {
            parameter: 'Child_Pugh',
            passed: false,
            value: 'C',
            messageVi: `Suy gan nặng Child-Pugh C: Ngừng ${medName}`,
          },
        ],
        citationIds: cids,
        priority: 102,
      };
    },
    citationIds: [
      'fda.sacubitril_valsartan.hepatic_child_pugh_c',
      'uk.candesartan.hepatic_cholestasis_contra',
      'fda.candesartan.severe_hepatic_no_dosing',
      'ema.telmisartan.hepatic_biliary_contra',
    ],
  },

  // 1b. Giới hạn liều Telmisartan <= 40 mg/ngày ở suy gan nhẹ–vừa (Child-Pugh A/B)
  {
    id: 'ckd.outpatient.rasi_hepatic_moderate_reduce',
    module: 'ckd',
    nameVi: 'Hiệu chỉnh giảm liều Telmisartan vượt trần ở suy gan nhẹ–vừa (Child-Pugh A/B)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || !hasMildModerateHepaticImpairment(ctx)) return false;
      const telmiMed = ctx.patient.currentMeds.find(
        (m) => extractRasiComponentId(m) === 'telmisartan'
      );
      if (!telmiMed) return false;
      const dailyMg = parseCurrentDailyDoseMg(telmiMed, 'telmisartan');
      return (
        dailyMg !== undefined &&
        dailyMg > thFor('dose_mg', 'ckd.rasi.telmisartan_hepatic_max_dose')
      );
    },
    produce: (ctx) => {
      const telmiMed = ctx.patient.currentMeds.find(
        (m) => extractRasiComponentId(m) === 'telmisartan'
      )!;
      const maxHepMg = thFor('dose_mg', 'ckd.rasi.telmisartan_hepatic_max_dose');
      const medName = medDisplayName(telmiMed);
      return {
        id: 'rec_ckd_telmisartan_reduce_hepatic',
        module: 'ckd',
        tier: 'An toàn chỉnh liều gan - thận',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: normalizeDrugId(telmiMed.drugId),
        drugNameVi: medName,
        dose: `tối đa ${maxHepMg} mg x 1 lần/ngày`,
        title: `Giảm liều ${medName} xuống <= ${maxHepMg} mg/ngày do bệnh gan`,
        rationale:
          `Theo SmPC EMA Micardis, ở suy gan nhẹ–vừa (Child-Pugh A/B), Telmisartan không vượt ${maxHepMg} mg 1 lần/ngày. GDMT-VN áp dụng giới hạn thận trọng này cho cả ba profile; không coi đây là trần liều FDA. Nếu chỉ có cờ bệnh gan chưa rõ mức độ, cần đánh giá phân độ; giới hạn tạm thời không xác nhận người bệnh thuộc Child-Pugh A/B. Ứ mật/tắc mật không phải lý do chỉ giảm liều: SmPC yêu cầu không dùng.`,
        gates: [
          {
            parameter: 'Hepatic',
            passed: false,
            threshold: maxHepMg,
            messageVi: `Giới hạn thận trọng Telmisartan tối đa ${maxHepMg} mg/ngày theo SmPC EMA cho Child-Pugh A/B; cần xác minh mức độ suy gan`,
          },
        ],
        citationIds: [
          'ema.telmisartan.hepatic_max_40',
          'ema.telmisartan.hepatic_biliary_contra',
        ],
        priority: 92,
      };
    },
    citationIds: [
      'ema.telmisartan.hepatic_max_40',
      'ema.telmisartan.hepatic_biliary_contra',
    ],
  },

  // 2. Cảnh báo cấm phối hợp kép ACEi + ARB, RASi + ARNI, RASi/ARNI + Aliskiren (DRI) hoặc trùng lặp FDC (CKD-R4-R3-05)
  {
    id: 'ckd.outpatient.avoid_dual_rasi',
    module: 'ckd',
    nameVi: 'Cảnh báo chống phối hợp đồng thời ACEi, ARB, ARNI và Aliskiren (DRI)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const raaMeds = getAllRaaBlockers(ctx.patient.currentMeds);
      return raaMeds.length >= 2; // qa-allow: index - phát hiện phối hợp >= 2 thuốc ức chế hệ RAA
    },
    produce: (ctx) => {
      const raaMeds = getAllRaaBlockers(ctx.patient.currentMeds);
      const hasArni = raaMeds.some((m) => isArniMed(m));
      const driMed = raaMeds.find((m) => isDriMed(m));
      const stopTarget =
        driMed ??
        (hasArni
          ? raaMeds.find((m) => !isArniMed(m))
          : raaMeds.find((m) => isArbMed(m)) ?? raaMeds[1] ?? raaMeds[0]); // qa-allow: index - chọn thuốc RAA thứ 2 cần ngừng
      const targetId = stopTarget ? normalizeDrugId(stopTarget.drugId) : 'losartan';
      const targetName = stopTarget ? medDisplayName(stopTarget) : 'Thuốc ức chế hệ RAS';

      const titleText = driMed
        ? `NGỪNG ngay ${targetName}: Chống chỉ định phối hợp Aliskiren (ức chế trực tiếp renin) với ACEi/ARB/ARNI`
        : hasArni
          ? `NGỪNG ngay ${targetName}: Chống chỉ định phối hợp cùng Sacubitril/Valsartan (ARNI — yêu cầu washout 36 giờ với ACEi)`
          : `NGỪNG ngay ${targetName}: Không phối hợp đồng thời nhiều thuốc ức chế hệ RAS (ACEi / ARB / FDC)`;

      return {
        id: 'rec_ckd_stop_dual_rasi',
        module: 'ckd',
        tier: 'Cảnh báo an toàn nghiêm trọng',
        tierOrder: 0,
        action: 'STOP',
        drugId: targetId,
        drugNameVi: targetName,
        dose: undefined,
        title: titleText,
        rationale:
          'Khuyến cáo mức 1B (KDIGO 2024 Rec 3.6.4): Tuyệt đối tránh bất kỳ phối hợp nào giữa ACEi, ARB, ARNI và chất ức chế trực tiếp renin (Aliskiren — kể cả trong viên phối hợp cố định liều FDC) do làm tăng gấp nhiều lần nguy cơ tổn thương thận cấp, tụt huyết áp, phù mạch và tăng kali máu.',
        gates: [
          {
            parameter: 'dual_rasi',
            passed: false,
            messageVi: 'Đang dùng đồng thời nhiều thuốc ức chế hệ RAA: Vi phạm nguyên tắc an toàn thuốc',
          },
        ],
        citationIds: ['kdigo.ckd.2024.rec_3_6_4_avoid_dual_rasi'],
        priority: 105,
      };
    },
    citationIds: ['kdigo.ckd.2024.rec_3_6_4_avoid_dual_rasi'],
  },

  // 3. TẠM NGỪNG RASi/ARNI khi Creatinin tăng > 30% so với nền dù chưa chạm ngưỡng KDIGO AKI (CKD-R4-R3-06)
  {
    id: 'ckd.outpatient.rasi_creatinine_rise_gt30',
    module: 'ckd',
    nameVi: 'Tạm ngừng thuốc ức chế hệ RAS khi Creatinin huyết thanh tăng vượt 30 phần trăm so với nền',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || isAkiActive(ctx)) return false;
      if (hasBilateralRenalArteryStenosis(ctx)) return false;
      if (!hasExcessiveRasiCreatinineRise(ctx)) return false;
      return ctx.patient.currentMeds.some((m) => isRasiOrArniMed(m));
    },
    produce: (ctx) => {
      const targetMed = ctx.patient.currentMeds.find((m) => isRasiOrArniMed(m))!;
      const normId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      const risePct = getScrRisePct(ctx)!;
      const maxPct = thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct');

      return {
        id: 'rec_ckd_hold_rasi_scr_rise_gt30',
        module: 'ckd',
        tier: 'Cảnh báo an toàn huyết động cầu thận',
        tierOrder: 0,
        action: 'HOLD',
        drugId: normId,
        drugNameVi: medName,
        dose: undefined,
        title: `TẠM NGỪNG / GIẢM LIỀU ${medName}: Creatinin tăng ${risePct.toFixed(0)}% (> ${maxPct}%) so với nền — tầm soát giảm thể tích & hẹp động mạch thận`,
        rationale:
          `Theo KDIGO 2024 (Practice Point 3.6.4 & Figure 24): Khi Creatinin huyết thanh tăng > ${maxPct}% (hiện tăng ${risePct.toFixed(1)}%) sau khởi trị hoặc tăng liều ${medName}, KHÔNG tiếp tục tăng liều hay bổ sung Finerenone. Cần tạm ngừng hoặc giảm liều ${medName}, rà soát thiếu dịch, lợi tiểu quá mức, NSAID đi kèm và siêu âm Doppler tầm soát hẹp động mạch thận hai bên.`,
        gates: [
          {
            parameter: 'SCr_Rise_Pct',
            passed: false,
            value: Number(risePct.toFixed(1)),
            threshold: maxPct,
            messageVi: `SCr tăng ${risePct.toFixed(1)}% > ${maxPct}%: Tạm ngừng ${medName} và tìm nguyên nhân`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.pp_3_6_4_creatinine_rise_30pct',
          'kdigo.ckd.2024.fig_24_consider_ras_stenosis',
        ],
        priority: 95,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_6_4_creatinine_rise_30pct',
      'kdigo.ckd.2024.fig_24_consider_ras_stenosis',
    ],
  },
];
