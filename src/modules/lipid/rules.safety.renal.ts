/**
 * GDMT-VN Lipid Module - Statin Renal & Dialysis Dose Cap / Continuation Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getActiveLipidMeds,
  getActiveStatin,
  getMedDoseMg,
  hasAscvdEquivalent,
  hasMed
} from './helpers';

export const lipidRenalSafetyRules: Rule[] = [
  {
    id: 'lipid.safety.dialysis',
    module: 'lipid',
    nameVi: 'Lọc máu chu kỳ không kèm ASCVD: Duy trì Statin hợp lệ cũ, tránh khởi trị mới',
    citationIds: ['esc.lipid.2019.ckd_dialysis_continue', 'esc.lipid.2019.ckd_dialysis_no_init'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk
      ) {
        return false;
      }
      if (!safety.onDialysis || hasAscvdEquivalent(ctx)) return false;
      const activeStatin = getActiveStatin(ctx);
      if (activeStatin) return !activeStatin.hasDoseViolation;
      return getActiveLipidMeds(ctx).length === 0;
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      if (activeStatin) {
        return {
          id: 'rec_lipid_dialysis_continue',
          module: 'lipid',
          tier: 'Bệnh thận mạn lọc máu',
          tierOrder: 2,
          action: 'CONTINUE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          title: `Tiếp tục duy trì ${activeStatin.displayName} đang dùng khi bệnh nhân chuyển sang lọc máu`,
          rationale:
            'Bệnh nhân đã điều trị statin (hoặc statin + ezetimibe theo SHARP) từ trước khi lọc máu được khuyến cáo tiếp tục duy trì ở mức liều an toàn theo chức năng thận.',
          gates: [],
          citationIds: ['esc.lipid.2019.ckd_dialysis_continue'],
          priority: 80
        };
      }
      return {
        id: 'rec_lipid_dialysis_no_init',
        module: 'lipid',
        tier: 'Bệnh thận mạn lọc máu',
        tierOrder: 2,
        action: 'AVOID',
        drugId: 'atorvastatin',
        title: 'Không khởi trị mới Statin ở bệnh nhân lọc máu chu kỳ chưa có ASCVD',
        rationale:
          'Ở bệnh nhân CKD phụ thuộc lọc máu không kèm ASCVD, thử nghiệm 4D và AURORA không chứng minh lợi ích khi khởi trị mới statin (ESC Class III).',
        gates: [
          {
            parameter: 'onDialysis',
            passed: false,
            action: 'contra',
            messageVi: 'Lọc máu chu kỳ không kèm ASCVD: không khởi trị mới statin'
          }
        ],
        citationIds: ['esc.lipid.2019.ckd_dialysis_no_init'],
        priority: 85
      };
    }
  },

  {
    id: 'lipid.safety.rosuvastatin_severe_ckd_cap',
    module: 'lipid',
    nameVi: 'Suy thận nặng hoặc lọc máu: Giới hạn trần Rosuvastatin ≤ 10 mg/ngày',
    citationIds: ['fda.rosuvastatin.renal_impairment'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasCyclosporine ||
        safety.hasRosuvaCap5Med ||
        safety.hasRosuvaAvoidMed
      ) {
        return false;
      }
      if (!safety.hasSevereCkd || !hasMed(ctx, 'rosuvastatin')) return false;
      const doseMg = getMedDoseMg(ctx, 'rosuvastatin');
      const maxDose = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
      return doseMg === undefined || doseMg > maxDose;
    },
    produce: (ctx) => {
      const rosuMatch = findRawMedsWithComponent(ctx, 'rosuvastatin')[0]; // qa-allow: index - Thuoc chua rosuvastatin dau tien
      const egfr = need(ctx, 'egfr');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const startDose = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const maxDose = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
      const targetId = rosuMatch ? rosuMatch.rawDrugId : 'rosuvastatin';
      const disp = rosuMatch ? rosuMatch.displayName : 'Rosuvastatin';
      const unbundle = rosuMatch ? buildFdcUnbundleGuidanceVi(rosuMatch, new Set(['rosuvastatin'])) : '';
      return {
        id: 'rec_lipid_rosuva_ckd_reduce',
        module: 'lipid',
        tier: 'Hiệu chỉnh liều theo thận',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Khởi đầu ${startDose} mg, tối đa không quá ${maxDose} mg 1 lần/ngày`,
        title: `Giảm liều ${disp} (Rosuvastatin ≤ ${maxDose} mg/ngày hoặc chuyển sang Atorvastatin) do suy thận nặng / lọc máu`,
        rationale:
          `Ở suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m² hoặc đang lọc máu chu kỳ), phơi nhiễm rosuvastatin tăng gấp ~3 lần; liều tối đa không được vượt quá ${maxDose} mg/ngày (nếu cần cường độ cao hơn nên chuyển sang Atorvastatin không cần chỉnh liều theo thận).` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'egfr',
            passed: false,
            action: 'reduce',
            value: egfr ?? 'onDialysis',
            threshold: egfrSevere,
            messageVi: `eGFR < ${egfrSevere} hoặc lọc máu: giới hạn Rosuvastatin ≤ ${maxDose} mg/ngày`
          }
        ],
        citationIds: ['fda.rosuvastatin.renal_impairment'],
        priority: 93
      };
    }
  },

  {
    id: 'lipid.safety.pitavastatin_ckd_cap',
    module: 'lipid',
    nameVi: 'Suy thận vừa – nặng: Giới hạn trần Pitavastatin theo mức lọc cầu thận',
    citationIds: ['acc.lipid.2026.pitavastatin_dose'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasCyclosporine ||
        safety.hasErythromycin ||
        !hasMed(ctx, 'pitavastatin')
      ) {
        return false;
      }
      const egfrCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
      const isModOrWorseCkd =
        safety.onDialysis || (safety.egfr !== undefined && safety.egfr < egfrCutoff);
      if (!isModOrWorseCkd) return false;
      const doseMg = getMedDoseMg(ctx, 'pitavastatin');
      const maxCkd = thFor('dose_mg', 'lipid.dose.pita_ckd_max');
      return doseMg === undefined || doseMg > maxCkd;
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr');
      const egfrCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
      const pitaStart = thFor('dose_mg', 'lipid.dose.pita_renal_start');
      const pitaMaxCkd = thFor('dose_mg', 'lipid.dose.pita_ckd_max');
      return {
        id: 'rec_lipid_pita_ckd_reduce',
        module: 'lipid',
        tier: 'Hiệu chỉnh liều theo thận',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: 'pitavastatin',
        dose: `Khởi đầu ${pitaStart} mg, tối đa ${pitaMaxCkd} mg 1 lần/ngày`,
        title: `Giảm liều Pitavastatin ≤ ${pitaMaxCkd} mg/ngày do suy giảm chức năng thận (eGFR < ${egfrCutoff} mL/phút/1.73m² hoặc lọc máu)`,
        rationale:
          `Ở suy thận vừa – nặng (eGFR < ${egfrCutoff} mL/phút/1.73m²) hoặc chạy thận nhân tạo, Pitavastatin khởi đầu ${pitaStart} mg/ngày và tối đa không vượt quá ${pitaMaxCkd} mg/ngày.`,
        gates: [
          {
            parameter: 'egfr',
            passed: false,
            action: 'reduce',
            value: egfr ?? 'onDialysis',
            threshold: egfrCutoff,
            messageVi: `eGFR < ${egfrCutoff} hoặc lọc máu: Pitavastatin tối đa ${pitaMaxCkd} mg/ngày`
          }
        ],
        citationIds: ['acc.lipid.2026.pitavastatin_dose'],
        priority: 92
      };
    }
  },

  {
    id: 'lipid.safety.pravastatin_severe_ckd_cap',
    module: 'lipid',
    nameVi: 'Suy thận nặng: Giới hạn trần Pravastatin ≤ 40 mg/ngày',
    citationIds: ['acc.lipid.2026.pravastatin_dose'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        !safety.hasSevereCkd ||
        !hasMed(ctx, 'pravastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'pravastatin');
      const maxCkd = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max');
      return doseMg === undefined || doseMg > maxCkd;
    },
    produce: (ctx) => {
      const pravaMatch = findRawMedsWithComponent(ctx, 'pravastatin')[0]; // qa-allow: index - Thuoc chua pravastatin dau tien
      const egfr = need(ctx, 'egfr');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const pravaStart = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_start');
      const pravaMax = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max');
      const targetId = pravaMatch ? pravaMatch.rawDrugId : 'pravastatin';
      return {
        id: 'rec_lipid_prava_ckd_reduce',
        module: 'lipid',
        tier: 'Hiệu chỉnh liều theo thận',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        dose: `Khởi đầu ${pravaStart} mg, tối đa ${pravaMax} mg 1 lần/ngày`,
        title: `Giảm / Xác nhận liều Pravastatin ≤ ${pravaMax} mg/ngày do suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m²)`,
        rationale:
          `Ở suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m² hoặc lọc máu), Pravastatin khởi đầu ${pravaStart} mg/ngày và tối đa không được vượt quá ${pravaMax} mg/ngày.`,
        gates: [
          {
            parameter: 'egfr',
            passed: false,
            action: 'reduce',
            value: egfr ?? 'onDialysis',
            threshold: egfrSevere,
            messageVi: `eGFR < ${egfrSevere}: giới hạn Pravastatin ≤ ${pravaMax} mg/ngày`
          }
        ],
        citationIds: ['acc.lipid.2026.pravastatin_dose'],
        priority: 92
      };
    }
  },

  {
    id: 'lipid.safety.simvastatin_severe_ckd_caution',
    module: 'lipid',
    nameVi: 'Suy thận nặng: Thận trọng khi dùng Simvastatin liều trung bình – cao',
    citationIds: ['acc.lipid.2026.simvastatin_dose', 'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasCyclosporine ||
        safety.hasStrongCyp3a4Inhibitor ||
        safety.hasGemfibrozil ||
        safety.hasSimvaCap10Med ||
        !safety.hasSevereCkd ||
        !hasMed(ctx, 'simvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'simvastatin');
      const simvaCkdCaution = thFor('dose_mg', 'lipid.dose.simva_severe_ckd_caution');
      const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
      return doseMg !== undefined && doseMg > simvaCkdCaution && doseMg <= simvaMax;
    },
    produce: (ctx) => {
      const simvaMatch = findRawMedsWithComponent(ctx, 'simvastatin')[0]; // qa-allow: index - Thuoc chua simvastatin dau tien
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const simvaCaution = thFor('dose_mg', 'lipid.dose.simva_severe_ckd_caution');
      const simvaSharp = thFor('dose_mg', 'lipid.dose.simva_amiodarone_max');
      const ezeStd = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const targetId = simvaMatch ? simvaMatch.rawDrugId : 'simvastatin';
      const disp = simvaMatch ? simvaMatch.displayName : 'Simvastatin';
      return {
        id: 'rec_lipid_simva_severe_ckd_caution',
        module: 'lipid',
        tier: 'Thận trọng theo chức năng thận',
        tierOrder: 2,
        action: 'MONITOR',
        drugId: targetId,
        drugNameVi: disp,
        title: `Thận trọng cao khi dùng ${disp} > ${simvaCaution} mg/ngày ở suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m²)`,
        rationale:
          `Ở suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m²), dùng Simvastatin liều trên ${simvaCaution} mg/ngày cần giám sát chặt triệu chứng đau cơ/CK (hoặc cân nhắc chuyển sang Atorvastatin không phụ thuộc thanh thải thận; lưu ý phác đồ Simvastatin ${simvaSharp} mg + Ezetimibe ${ezeStd} mg đã được kiểm định trong nghiên cứu SHARP).`,
        gates: [],
        citationIds: ['acc.lipid.2026.simvastatin_dose', 'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60'],
        priority: 72
      };
    }
  }
];
