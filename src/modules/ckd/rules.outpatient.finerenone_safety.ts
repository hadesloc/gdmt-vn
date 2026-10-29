/**
 * GDMT-VN CKD Module - Pillar 3b: Finerenone Continuation, Safety Stops & HFrEF MRA Stewardship
 * Phân quyền: Agent E (Round 4 Remediation & < 20 KB Modularization)
 * Bao phủ: CKD-R4-R2-03/04/08, CKD-R4-R3-09/12
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  getMedComponents,
  hasAdrenalInsufficiency,
  hasCkdDrugAllergy,
  hasCkdFlag,
  isAkiActive,
  isBreastfeedingCkd,
  isChildPughB,
  isChildPughC,
  isKSparingOrSteroidalMraMed,
  isModerateOrWeakCyp3a4InhibitorMed,
  isOutpatientAcuteCrisis,
  medDisplayName,
  normalizeDrugId,
  parseCurrentDailyDoseMg,
} from './helpers';

const STRONG_CYP3A4_SET = new Set<string>([
  'itraconazole',
  'ketoconazole',
  'clarithromycin',
  'ritonavir',
  'cobicistat',
  'voriconazole',
  'posaconazole',
  'nefazodone',
]);

export const ckdOutpatientFinerenoneSafetyRules: Rule[] = [
  // 1. Cấm phối hợp kép Finerenone + Spironolactone/Eplerenone/lợi tiểu giữ kali
  {
    id: 'ckd.outpatient.avoid_dual_mra',
    module: 'ckd',
    nameVi: 'Cảnh báo chống phối hợp đồng thời Finerenone và MRA steroid / lợi tiểu giữ kali',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const hasFine = ctx.patient.currentMeds.some((m) => normalizeDrugId(m.drugId) === 'finerenone');
      const hasSteroidalOrKSparing = ctx.patient.currentMeds.some((m) => isKSparingOrSteroidalMraMed(m));
      return hasFine && hasSteroidalOrKSparing;
    },
    produce: (ctx) => {
      const fineMed = ctx.patient.currentMeds.find((m) => normalizeDrugId(m.drugId) === 'finerenone');
      const fineName = fineMed ? medDisplayName(fineMed) : drug('finerenone').nameVi;
      return {
        id: 'rec_ckd_stop_dual_mra',
        module: 'ckd',
        tier: 'Cảnh báo an toàn nghiêm trọng',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: undefined,
        title: `NGỪNG ngay ${fineName}: Không phối hợp đồng thời 2 thuốc đối kháng aldosterone / giữ kali`,
        rationale:
          'Theo KDIGO 2024 (Practice Point 3.8.1) và nhãn FDA: Tuyệt đối không phối hợp Finerenone với Spironolactone, Eplerenone hoặc lợi tiểu giữ kali (Amiloride, Triamterene) do nguy cơ tăng kali máu ác tính đe dọa tính mạng.',
        gates: [
          {
            parameter: 'dual_mra',
            passed: false,
            messageVi: 'Đang dùng đồng thời nsMRA + sMRA/lợi tiểu giữ kali: Nguy cơ tăng kali máu tử vong',
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
          'fda.finerenone.table_2_dose_adjustment',
        ],
        priority: 105,
      };
    },
    citationIds: ['fda.finerenone.table_2_dose_adjustment'],
  },

  // 2. Ngừng Finerenone khi bệnh nhân có suy tuyến thượng thận (CKD-R4-R2-04)
  {
    id: 'ckd.outpatient.finerenone_stop_adrenal',
    module: 'ckd',
    nameVi: 'Ngừng ngay Finerenone trên bệnh nhân suy tuyến thượng thận',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (!hasAdrenalInsufficiency(ctx)) return false;
      return ctx.patient.currentMeds.some((m) => normalizeDrugId(m.drugId) === 'finerenone');
    },
    produce: (ctx) => {
      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      )!;
      const fineName = medDisplayName(fineMed);
      return {
        id: 'rec_ckd_finerenone_stop_adrenal',
        module: 'ckd',
        tier: 'Cảnh báo an toàn nghiêm trọng',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: undefined,
        title: `NGỪNG NGAY ${fineName}: Chống chỉ định tuyệt đối ở bệnh nhân suy tuyến thượng thận`,
        rationale:
          'Theo nhãn FDA Kerendia (Mục 4 Contraindications): Finerenone chống chỉ định tuyệt đối trên bệnh nhân suy tuyến thượng thận do nguy cơ thúc đẩy cơn suy thượng thận cấp và tăng kali máu đe dọa tính mạng.',
        gates: [
          {
            parameter: 'Adrenal_Insufficiency',
            passed: false,
            messageVi: 'Suy tuyến thượng thận: Bắt buộc ngừng ngay Finerenone',
          },
        ],
        citationIds: ['fda.finerenone.contraindications'],
        priority: 105,
      };
    },
    citationIds: ['fda.finerenone.contraindications'],
  },

  // 3. Ngừng Finerenone khi đang lọc máu định kỳ
  {
    id: 'ckd.outpatient.finerenone_stop_dialysis',
    module: 'ckd',
    nameVi: 'Ngừng Finerenone trên bệnh nhân suy thận giai đoạn cuối đang lọc máu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (!hasCkdFlag(ctx, 'onDialysis')) return false;
      return ctx.patient.currentMeds.some((m) => normalizeDrugId(m.drugId) === 'finerenone');
    },
    produce: (ctx) => {
      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      )!;
      const fineName = medDisplayName(fineMed);
      return {
        id: 'rec_ckd_finerenone_stop_dialysis',
        module: 'ckd',
        tier: 'Cảnh báo an toàn lọc máu',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: undefined,
        title: `NGỪNG NGAY ${fineName} (Không sử dụng trên bệnh nhân đang lọc máu định kỳ)`,
        rationale:
          'Theo nhãn FDA Kerendia và ESC 2026 CVD-CKD: Không khuyến cáo sử dụng Finerenone ở bệnh nhân suy thận giai đoạn cuối đang lọc máu chu kỳ (kể cả khi Creatinin máu ngay sau buổi lọc có thể giả tạo cho eGFR tính toán cao hơn thực tế), do nguy cơ tăng kali máu ác tính đe dọa tính mạng.',
        gates: [
          {
            parameter: 'dialysis',
            passed: false,
            messageVi: 'Đang lọc máu định kỳ (HD/PD): Bắt buộc ngừng Finerenone',
          },
        ],
        citationIds: [
          'fda.finerenone.table_1_starting_dose',
          'esc.2026.ckd.mra_dialysis_not_recommended',
        ],
        priority: 105,
      };
    },
    citationIds: [
      'fda.finerenone.table_1_starting_dose',
      'esc.2026.ckd.mra_dialysis_not_recommended',
    ],
  },

  // 4. Ngừng Finerenone khi tiến triển sang giai đoạn suy thận cuối CKD G5 chưa lọc máu
  {
    id: 'ckd.outpatient.finerenone_stop_g5',
    module: 'ckd',
    nameVi: 'Ngừng Finerenone khi suy thận tiến triển sang giai đoạn G5 chưa lọc máu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || hasCkdFlag(ctx, 'onDialysis')) return false;
      if (isAkiActive(ctx)) return false;
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined || egfr >= thFor('egfr', 'ckd.egfr.g4_min')) return false;
      return ctx.patient.currentMeds.some((m) => normalizeDrugId(m.drugId) === 'finerenone');
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr')!;
      const g4Min = thFor('egfr', 'ckd.egfr.g4_min');
      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      )!;
      const fineName = medDisplayName(fineMed);
      return {
        id: 'rec_ckd_finerenone_stop_g5',
        module: 'ckd',
        tier: 'Cảnh báo an toàn thận',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: undefined,
        title: `NGỪNG ${fineName} do suy thận giai đoạn cuối (eGFR ${egfr.toFixed(0)} < ${g4Min} mL/phút/1.73m²)`,
        rationale:
          `Theo nhãn FDA Kerendia và ESC 2026 CVD-CKD: Ngừng điều trị ${fineName} khi chức năng thận tiến triển đến suy thận giai đoạn cuối (eGFR < ${g4Min} mL/phút/1.73m²) do thiếu dữ liệu an toàn và nguy cơ tăng kali máu đe dọa tính mạng.`,
        gates: [
          {
            parameter: 'eGFR',
            passed: false,
            value: egfr,
            threshold: g4Min,
            messageVi: `eGFR ${egfr.toFixed(0)} < ${g4Min} mL/phút/1.73m² (CKD G5): Ngừng Finerenone`,
          },
        ],
        citationIds: [
          'fda.finerenone.table_1_starting_dose',
          'esc.2026.ckd.mra_dialysis_not_recommended',
        ],
        priority: 102,
      };
    },
    citationIds: [
      'fda.finerenone.table_1_starting_dose',
      'esc.2026.ckd.mra_dialysis_not_recommended',
    ],
  },

  // 5. Ngừng Finerenone khi bệnh nhân có suy gan nặng Child-Pugh C
  {
    id: 'ckd.outpatient.finerenone_stop_hepatic',
    module: 'ckd',
    nameVi: 'Ngừng Finerenone trên bệnh nhân suy gan nặng (Child-Pugh C)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (!isChildPughC(ctx)) return false;
      return ctx.patient.currentMeds.some((m) => normalizeDrugId(m.drugId) === 'finerenone');
    },
    produce: (ctx) => {
      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      )!;
      const fineName = medDisplayName(fineMed);
      return {
        id: 'rec_ckd_finerenone_stop_hepatic',
        module: 'ckd',
        tier: 'Cảnh báo an toàn gan - thận',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: undefined,
        title: `NGỪNG ${fineName} do suy gan nặng (Child-Pugh C)`,
        rationale:
          'Theo nhãn FDA Kerendia (Mục 8.6 Hepatic Impairment): Tránh sử dụng Finerenone ở bệnh nhân suy gan nặng (Child-Pugh C). Cần ngừng thuốc và theo dõi sát điện giải.',
        gates: [
          {
            parameter: 'Child_Pugh',
            passed: false,
            value: 'C',
            messageVi: 'Suy gan nặng (Child-Pugh C): Ngừng Finerenone',
          },
        ],
        citationIds: ['fda.finerenone.hepatic_impairment'],
        priority: 103,
      };
    },
    citationIds: ['fda.finerenone.hepatic_impairment'],
  },

  // 6. Tiếp tục duy trì Finerenone khi ổn định ở eGFR >= 15 và K+ <= 5.5 mmol/L
  {
    id: 'ckd.outpatient.finerenone_continue',
    module: 'ckd',
    nameVi: 'Tiếp tục duy trì Finerenone và theo dõi Kali máu định kỳ',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant') || isBreastfeedingCkd(ctx)) {
        return false;
      }
      if (
        isChildPughC(ctx) ||
        hasAdrenalInsufficiency(ctx) ||
        hasCkdDrugAllergy(ctx, 'finerenone')
      ) {
        return false;
      }
      if (
        ctx.patient.currentMeds.some((m) =>
          getMedComponents(m).some((id) => STRONG_CYP3A4_SET.has(id))
        )
      ) {
        return false;
      }
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      );
      if (!fineMed) return false;
      if (ctx.patient.currentMeds.some((m) => isKSparingOrSteroidalMraMed(m))) return false;

      const k = need(ctx, 'k');
      const egfr = need(ctx, 'egfr');
      if (k === undefined || egfr === undefined) return false;
      if (egfr < thFor('egfr', 'ckd.egfr.g4_min')) return false;
      if (k > thFor('k', 'ckd.rasi.k_hold_threshold')) return false;

      const currentDailyMg = parseCurrentDailyDoseMg(fineMed);
      const lowDoseMg = thFor('dose_mg', 'ckd.finerenone.start_dose_low');
      const targetCkdMg = thFor('dose_mg', 'ckd.finerenone.target_dose');
      const targetHfHighMg = thFor('dose_mg', 'ckd.finerenone.hf_target_dose_high');
      const lvef = need(ctx, 'lvef');
      const hfLvefMin = thFor('lvef', 'ckd.hfref.lvef_max');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const minInitEgfr = thFor('egfr', 'ckd.finerenone.egfr_initiate_min');
      const kUpCkd = thFor('k', 'ckd.finerenone.k_uptitrate_max');
      const kUpHf = thFor('k', 'ckd.finerenone.k_hf_uptitrate_max');
      const hasExplicitHfref = Boolean(
        (ctx.patient.conditions as Record<string, unknown> | undefined)?.hfref
      );

      const hasHfLvef40Plus =
        hasCondition(ctx, 'hf') &&
        lvef !== undefined &&
        lvef >= hfLvefMin &&
        !hasExplicitHfref;

      const willUptitrateFrom10 =
        currentDailyMg !== undefined &&
        currentDailyMg <= lowDoseMg &&
        egfr >= minInitEgfr &&
        (hasHfLvef40Plus ? k < kUpHf : k <= kUpCkd);
      const willUptitrateFrom20Hf =
        hasHfLvef40Plus &&
        currentDailyMg !== undefined &&
        currentDailyMg >= targetCkdMg &&
        currentDailyMg < targetHfHighMg &&
        egfr >= g2Min &&
        k < kUpHf;

      return !willUptitrateFrom10 && !willUptitrateFrom20Hf;
    },
    produce: (ctx) => {
      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      )!;
      const fineName = medDisplayName(fineMed);
      const k = need(ctx, 'k')!;
      const egfr = need(ctx, 'egfr')!;
      const currentMg = parseCurrentDailyDoseMg(fineMed);
      const kHold = thFor('k', 'ckd.rasi.k_hold_threshold');
      const minInitEgfr = thFor('egfr', 'ckd.finerenone.egfr_initiate_min');
      const g4Min = thFor('egfr', 'ckd.egfr.g4_min');

      const doseStr =
        currentMg !== undefined ? `${currentMg} mg x 1 lần/ngày (uống)` : 'Duy trì liều hiện tại';
      const egfrNote =
        egfr < minInitEgfr
          ? ` Mặc dù eGFR hiện giảm xuống ${egfr.toFixed(0)} mL/phút/1.73m² (dải ${g4Min}–<${minInitEgfr}, không khởi trị mới ở ngưỡng này), nhãn FDA cho phép tiếp tục duy trì thận trọng liều đang dung nạp nếu Kali máu <= ${kHold} mmol/L và chưa đến giai đoạn G5 (< ${g4Min}) hoặc lọc máu.`
          : '';
      const cids = [
        'fda.finerenone.table_2_dose_adjustment',
        'fda.finerenone.table_1_starting_dose',
        'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
      ];
      let extraSafetyNote = '';
      if (ctx.patient.currentMeds.some((m) => isModerateOrWeakCyp3a4InhibitorMed(m))) {
        extraSafetyNote +=
          ' Lưu ý tương tác CYP3A4 vừa/yếu (FDA Mục 7.1): Theo dõi sát Kali máu định kỳ do tăng phơi nhiễm Finerenone.';
        cids.push('fda.finerenone.cyp3a4_moderate_weak');
      }
      if (isChildPughB(ctx)) {
        extraSafetyNote +=
          ' Lưu ý suy gan trung bình (Child-Pugh B — FDA Mục 8.6): Cân nhắc kiểm tra thêm Kali huyết thanh.';
        cids.push('fda.finerenone.hepatic_impairment');
      }

      return {
        id: 'rec_ckd_finerenone_continue',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: doseStr,
        title: `Tiếp tục duy trì ${fineName} (${doseStr})`,
        rationale:
          `Theo nhãn FDA Kerendia (Bảng 2) và KDIGO 2024: Với Kali máu hiện tại ${k} mmol/L (<= ${kHold} mmol/L) và eGFR >= ${g4Min} mL/phút/1.73m², khuyến cáo tiếp tục duy trì ${fineName} (${doseStr}) để bảo vệ tim - thận lâu dài và kiểm tra định kỳ Kali máu.${egfrNote}${extraSafetyNote}`,
        gates: [
          {
            parameter: 'K+',
            passed: k <= kHold,
            value: k,
            threshold: kHold,
            messageVi: `Kali máu ${k} mmol/L <= ${kHold}: Cho phép tiếp tục duy trì Finerenone`,
          },
        ],
        citationIds: cids,
        priority: 84,
      };
    },
    citationIds: [
      'fda.finerenone.table_2_dose_adjustment',
      'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
    ],
  },

  // 7. Định hướng ưu tiên MRA steroid thay vì Finerenone khi bệnh nhân kèm HFrEF ở chế độ đơn module CKD
  {
    id: 'ckd.outpatient.hfref_prefer_steroidal_mra',
    module: 'ckd',
    nameVi: 'Ưu tiên MRA steroid (Spironolactone/Eplerenone) thay vì Finerenone ở bệnh nhân kèm HFrEF',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (ctx.patient.selectedModules.includes('hf')) return false;
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant') || isBreastfeedingCkd(ctx)) {
        return false;
      }
      if (hasAdrenalInsufficiency(ctx) || isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) {
        return false;
      }

      const lvef = need(ctx, 'lvef');
      const hfrefMax = thFor('lvef', 'ckd.hfref.lvef_max');
      if (lvef === undefined || lvef > hfrefMax) return false;

      const egfr = need(ctx, 'egfr');
      const k = need(ctx, 'k');
      if (
        egfr === undefined ||
        egfr < thFor('egfr', 'ckd.egfr.g3b_min') ||
        (k !== undefined && k > thFor('k', 'ckd.rasi.k_initiate_max'))
      ) {
        return false;
      }

      const hasAnyMra = ctx.patient.currentMeds.some(
        (m) => normalizeDrugId(m.drugId) === 'finerenone' || isKSparingOrSteroidalMraMed(m)
      );
      return !hasAnyMra;
    },
    produce: (ctx) => {
      const lvef = need(ctx, 'lvef')!;
      const hfrefMax = thFor('lvef', 'ckd.hfref.lvef_max');
      return {
        id: 'rec_ckd_hfref_prefer_steroidal_mra',
        module: 'ckd',
        tier: 'Phối hợp Tim mạch - Thận học',
        tierOrder: 1,
        action: 'CONSIDER',
        title: `Ưu tiên MRA steroid (Spironolactone / Eplerenone) thay vì Finerenone do bệnh nhân có suy tim HFrEF (LVEF ${lvef}% <= ${hfrefMax}%)`,
        rationale:
          `Theo KDIGO 2024 (Practice Point 3.8.5) và ESC 2026 CVD-CKD: Các thử nghiệm FIDELIO-DKD và FIGARO-DKD loại trừ suy tim HFrEF có triệu chứng, trong khi MRA steroid (Spironolactone hoặc Eplerenone) có bằng chứng Class I, Level A giảm tử vong ở HFrEF (LVEF <= ${hfrefMax}%). Khuyến cáo bật thêm module Suy tim (HF) để tối ưu tứ trụ HFrEF và tuyệt đối không phối hợp đồng thời sMRA với Finerenone.`,
        gates: [
          {
            parameter: 'LVEF',
            passed: true,
            value: lvef,
            threshold: hfrefMax,
            messageVi: `LVEF ${lvef}% <= ${hfrefMax}% (HFrEF): Ưu tiên Spironolactone/Eplerenone (Class I) thay vì Finerenone`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.pp_3_8_5_steroidal_mra_hf',
          'esc.2026.ckd.hfref_steroidal_vs_nonsteroidal_mra',
        ],
        priority: 86,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_3_8_5_steroidal_mra_hf',
      'esc.2026.ckd.hfref_steroidal_vs_nonsteroidal_mra',
    ],
  },
];
