/**
 * GDMT-VN CKD Module - Pillar 3c: Finerenone Titration Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation & Modularization)
 * Bao phủ: CKD-R4-R1-05, CKD-R4-R2-02/03/04/05, CKD-R4-R3-06
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  getMedComponents,
  hasAdrenalInsufficiency,
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasExcessiveRasiCreatinineRise,
  isAkiActive,
  isBreastfeedingCkd,
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

function hasStrongCyp3a4Inhibitor(ctx: Parameters<Rule['when']>[0]): boolean {
  return ctx.patient.currentMeds.some((m) =>
    getMedComponents(m).some((id) => STRONG_CYP3A4_SET.has(id))
  );
}

export const ckdOutpatientFinerenoneTitrationRules: Rule[] = [
  // Chuẩn độ tăng liều Finerenone lên 20 mg/ngày hoặc 40 mg/ngày (FDA Kerendia Bảng 2 & Bảng 3)
  {
    id: 'ckd.outpatient.finerenone_uptitrate',
    module: 'ckd',
    nameVi: 'Chuẩn độ Finerenone lên liều đích bảo vệ tim - thận',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant') || isBreastfeedingCkd(ctx)) {
        return false;
      }
      if (
        isChildPughC(ctx) ||
        hasAdrenalInsufficiency(ctx) ||
        hasCkdDrugAllergy(ctx, 'finerenone') ||
        hasStrongCyp3a4Inhibitor(ctx) ||
        hasExcessiveRasiCreatinineRise(ctx)
      ) {
        return false;
      }
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      if (ctx.patient.currentMeds.some((m) => isKSparingOrSteroidalMraMed(m))) return false;

      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      );
      if (!fineMed) return false;

      const k = need(ctx, 'k');
      const egfr = need(ctx, 'egfr');
      if (k === undefined || egfr === undefined) return false;

      const currentDailyMg = parseCurrentDailyDoseMg(fineMed);
      if (currentDailyMg === undefined) return false;

      const lowDoseMg = thFor('dose_mg', 'ckd.finerenone.start_dose_low');
      const targetDoseMg = thFor('dose_mg', 'ckd.finerenone.target_dose');
      const hfHighTargetMg = thFor('dose_mg', 'ckd.finerenone.hf_target_dose_high');
      const minEgfr = thFor('egfr', 'ckd.finerenone.egfr_initiate_min');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const kUpCkd = thFor('k', 'ckd.finerenone.k_uptitrate_max');
      const kUpHf = thFor('k', 'ckd.finerenone.k_hf_uptitrate_max');
      const lvef = need(ctx, 'lvef');
      const hfLvefMin = thFor('lvef', 'ckd.hfref.lvef_max');
      const hasExplicitHfref = Boolean(
        (ctx.patient.conditions as Record<string, unknown> | undefined)?.hfref
      );

      const hasHfLvef40Plus =
        hasCondition(ctx, 'hf') &&
        lvef !== undefined &&
        lvef >= hfLvefMin &&
        !hasExplicitHfref;

      const canStep10To20 =
        currentDailyMg <= lowDoseMg &&
        egfr >= minEgfr &&
        (hasHfLvef40Plus ? k < kUpHf : k <= kUpCkd);
      const canStep20To40Hf =
        hasHfLvef40Plus &&
        currentDailyMg >= targetDoseMg &&
        currentDailyMg < hfHighTargetMg &&
        egfr >= g2Min &&
        k < kUpHf;

      return canStep10To20 || canStep20To40Hf;
    },
    produce: (ctx) => {
      const fineMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'finerenone'
      )!;
      const fineName = medDisplayName(fineMed);
      const currentDailyMg = parseCurrentDailyDoseMg(fineMed)!;
      const k = need(ctx, 'k')!;
      const egfr = need(ctx, 'egfr')!;
      const lvef = need(ctx, 'lvef');
      const lowDoseMg = thFor('dose_mg', 'ckd.finerenone.start_dose_low');
      const targetDoseMg = thFor('dose_mg', 'ckd.finerenone.target_dose');
      const hfHighTargetMg = thFor('dose_mg', 'ckd.finerenone.hf_target_dose_high');
      const maxUpK = thFor('k', 'ckd.finerenone.k_uptitrate_max');
      const kUpHf = thFor('k', 'ckd.finerenone.k_hf_uptitrate_max');
      const minEgfr = thFor('egfr', 'ckd.finerenone.egfr_initiate_min');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const hfLvefMin = thFor('lvef', 'ckd.hfref.lvef_max');
      const hasExplicitHfref = Boolean(
        (ctx.patient.conditions as Record<string, unknown> | undefined)?.hfref
      );
      const hasHfLvef40Plus =
        hasCondition(ctx, 'hf') &&
        lvef !== undefined &&
        lvef >= hfLvefMin &&
        !hasExplicitHfref;

      const isStepTo40Hf = currentDailyMg >= targetDoseMg;
      const useHfTable3Rule = isStepTo40Hf || (hasHfLvef40Plus && k > maxUpK);
      const nextDoseText = isStepTo40Hf
        ? `${hfHighTargetMg} mg x 1 lần/ngày (uống)`
        : fmtShortDose(dose('finerenone', 'target'));
      const gateThresholdK = useHfTable3Rule ? kUpHf : maxUpK;

      let rationaleText = isStepTo40Hf
        ? `Bệnh nhân kèm suy tim LVEF >= ${hfLvefMin}% có eGFR ${egfr.toFixed(0)} >= ${g2Min} mL/phút/1.73m² và Kali máu ${k} < ${kUpHf} mmol/L đang dung nạp ${fineName} ${targetDoseMg} mg/ngày. Theo nhãn FDA Kerendia (Mục 2.3 & Bảng 3 — FINEARTS-HF): Chuẩn độ tăng lên liều đích ${hfHighTargetMg} mg x 1 lần/ngày sau 4 tuần và kiểm tra lại K⁺.`
        : useHfTable3Rule
          ? `Bệnh nhân kèm suy tim LVEF >= ${hfLvefMin}% đang dùng ${fineName} ${lowDoseMg} mg có Kali máu ${k} < ${kUpHf} mmol/L và eGFR ${egfr.toFixed(0)} >= ${minEgfr} mL/phút/1.73m². Theo nhãn FDA Kerendia Bảng 3 (chỉ định suy tim): Chuẩn độ tăng lên liều đích ${targetDoseMg} mg/ngày sau 4 tuần và theo dõi lại K⁺.`
          : `Bệnh nhân đang dùng ${fineName} ${lowDoseMg} mg có Kali máu ${k} mmol/L <= ${maxUpK} và eGFR ${egfr.toFixed(0)} >= ${minEgfr}. Theo nhãn FDA Bảng 2 và KDIGO 2024: Chuẩn độ tăng lên liều đích ${targetDoseMg} mg/ngày sau 4 tuần để tối đa hóa hiệu quả làm chậm suy thận.`;

      const cids = useHfTable3Rule
        ? [
            'fda.finerenone.hf_lvef40_dosing',
            'fda.finerenone.table_3_hf_titration',
            'fda.finerenone.table_2_dose_adjustment',
          ]
        : [
            'fda.finerenone.table_2_dose_adjustment',
            'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
          ];

      if (ctx.patient.currentMeds.some((m) => isModerateOrWeakCyp3a4InhibitorMed(m))) {
        rationaleText +=
          ' Lưu ý tương tác CYP3A4 vừa/yếu (FDA Mục 7.1): Theo dõi sát Kali máu trong vòng 4 tuần sau tăng liều.';
        cids.push('fda.finerenone.cyp3a4_moderate_weak');
      }

      return {
        id: 'rec_ckd_finerenone_uptitrate',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: 'UPTITRATE',
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: nextDoseText,
        title: `Tăng liều ${fineName} lên liều đích (${nextDoseText})`,
        rationale: rationaleText,
        gates: [
          {
            parameter: 'K+',
            passed: useHfTable3Rule ? k < kUpHf : k <= maxUpK,
            value: k,
            threshold: gateThresholdK,
            messageVi: useHfTable3Rule
              ? `K+ ${k} mmol/L < ${kUpHf}: An toàn để chuẩn độ tăng liều theo nhãn suy tim (FDA Bảng 3)`
              : `K+ ${k} mmol/L <= ${maxUpK}: An toàn để tăng liều`,
          },
        ],
        citationIds: cids,
        priority: 89,
      };
    },
    citationIds: [
      'fda.finerenone.table_2_dose_adjustment',
      'fda.finerenone.table_3_hf_titration',
    ],
  },
];
