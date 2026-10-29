/**
 * GDMT-VN Lipid Module - Non-Statin Renal & Dialysis Safety Rules (Ezetimibe, Bempedoic, Fibrate)
 * Phân quyền: Agent I5 (Round 3 Remediation — split from rules.safety.renal.ts)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getActiveFibrateMatches,
  getActiveStatin,
  getMedDoseMg,
  hasAscvdEquivalent,
  hasLipidDrugAllergy,
  hasMed
} from './helpers';

export const lipidRenalNonStatinSafetyRules: Rule[] = [
  {
    id: 'lipid.safety.dialysis_continue_ezetimibe',
    module: 'lipid',
    nameVi: 'Lọc máu chu kỳ: Duy trì Ezetimibe đã phối hợp từ trước khi lọc máu (SHARP)',
    citationIds: [
      'esc.lipid.2019.ckd_dialysis_continue',
      'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60'
    ],
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
      if (!safety.onDialysis || hasAscvdEquivalent(ctx) || !hasMed(ctx, 'ezetimibe')) return false;
      if (hasLipidDrugAllergy(ctx, 'ezetimibe')) return false;
      const activeStatin = getActiveStatin(ctx);
      const ezeMatches = findRawMedsWithComponent(ctx, 'ezetimibe');
      return ezeMatches.some((m) => m.rawDrugId !== activeStatin?.rawDrugId);
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const ezeMatch = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) => m.rawDrugId !== activeStatin?.rawDrugId && !m.allComponents.includes('bempedoic_acid')
      );
      if (!ezeMatch) return null;
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      return {
        id: 'rec_lipid_dialysis_continue_ezetimibe',
        module: 'lipid',
        tier: 'Bệnh thận mạn lọc máu',
        tierOrder: 2,
        action: 'CONTINUE',
        drugId: ezeMatch.rawDrugId,
        drugNameVi: ezeMatch.displayName,
        dose: `${ezeDose} mg 1 lần/ngày`,
        title: `Tiếp tục duy trì ${ezeMatch.displayName} trong phác đồ nền ở bệnh nhân đang lọc máu chu kỳ`,
        rationale: `Theo ESC/EAS và KDIGO (dữ liệu SHARP), bệnh nhân đã dùng statin phối hợp ezetimibe (${ezeDose} mg/ngày) trước khi lọc máu được khuyến cáo tiếp tục duy trì cả hai thuốc.`,
        gates: [],
        citationIds: [
          'esc.lipid.2019.ckd_dialysis_continue',
          'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60'
        ],
        priority: 79
      };
    }
  },

  {
    id: 'lipid.safety.dialysis_stop_bempedoic',
    module: 'lipid',
    nameVi: 'Lọc máu chu kỳ / ESRD: Ngừng Bempedoic acid do chưa được kiểm định an toàn',
    citationIds: ['fda.bempedoic.dose', 'esc.lipid.2019.ckd_dialysis_no_init'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasSevereAlt) return false;
      return safety.onDialysis && hasMed(ctx, 'bempedoic_acid');
    },
    produce: (ctx) => {
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0]; // qa-allow: index - Thuoc bempedoic dau tien dang dung
      const targetId = bempMatch ? bempMatch.rawDrugId : 'bempedoic_acid';
      const disp = bempMatch ? bempMatch.displayName : 'Bempedoic acid';
      const unbundle = bempMatch ? buildFdcUnbundleGuidanceVi(bempMatch, new Set(['bempedoic_acid'])) : '';
      return {
        id: 'rec_lipid_dialysis_stop_bempedoic',
        module: 'lipid',
        tier: 'An toàn thận',
        tierOrder: 1,
        action: 'STOP',
        drugId: targetId,
        drugNameVi: disp,
        title: `Ngừng ${disp} ở bệnh nhân bệnh thận giai đoạn cuối đang lọc máu chu kỳ`,
        rationale:
          `Bempedoic acid chưa được nghiên cứu ở bệnh nhân bệnh thận giai đoạn cuối (ESRD) hoặc lọc máu chu kỳ và làm tăng acid uric/creatinine; khuyến cáo ngừng thuốc (ưu tiên duy trì Ezetimibe đơn chất nếu cần).` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'onDialysis',
            passed: false,
            action: 'contra',
            messageVi: 'Bệnh thận giai đoạn cuối đang lọc máu: không khuyến cáo dùng Bempedoic acid'
          }
        ],
        citationIds: ['fda.bempedoic.dose', 'esc.lipid.2019.ckd_dialysis_no_init'],
        priority: 95
      };
    }
  },

  {
    id: 'lipid.safety.fenofibrate_severe_ckd_stop',
    module: 'lipid',
    nameVi: 'Suy thận nặng hoặc lọc máu: Chống chỉ định và ngừng Fibrate',
    citationIds: ['acc.lipid.2026.fenofibrate_renal'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || getActiveFibrateMatches(ctx).length === 0) return false;
      return safety.onDialysis || safety.hasSevereCkd;
    },
    produce: (ctx) => {
      const fibMatch = getActiveFibrateMatches(ctx)[0]; // qa-allow: index - Thuoc fibrate dau tien dang dung
      if (!fibMatch) return null;
      const egfr = need(ctx, 'egfr');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const unbundle = buildFdcUnbundleGuidanceVi(fibMatch, new Set(['fenofibrate', 'gemfibrozil']));
      return {
        id: 'rec_lipid_feno_ckd_stop',
        module: 'lipid',
        tier: 'An toàn thận',
        tierOrder: 0,
        action: 'STOP',
        drugId: fibMatch.rawDrugId,
        drugNameVi: fibMatch.displayName,
        title: `Ngừng ngay ${fibMatch.displayName} do suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m² hoặc đang lọc máu)`,
        rationale:
          `Fibrate chống chỉ định tuyệt đối ở suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m² hoặc lọc máu) do tích lũy thuốc gây độc cơ và suy giảm mức lọc cầu thận.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'egfr',
            passed: false,
            action: 'contra',
            value: egfr,
            threshold: egfrSevere,
            messageVi: `eGFR < ${egfrSevere} mL/phút/1.73m² hoặc lọc máu: chống chỉ định Fibrate`
          }
        ],
        citationIds: ['acc.lipid.2026.fenofibrate_renal'],
        priority: 99
      };
    }
  },

  {
    id: 'lipid.safety.fenofibrate_moderate_ckd_reduce',
    module: 'lipid',
    nameVi: 'eGFR 30–<60: Giảm liều Fenofibrate về chế phẩm hàm lượng thấp',
    citationIds: [
      'acc.lipid.2026.fenofibrate_renal',
      'acc.lipid.2026.fenofibrate_dose_range',
      'byt.ckd.2024.fenofibrate_creatinine_monitor'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.onDialysis ||
        safety.hasSevereCkd ||
        safety.hasSevereAlt ||
        safety.hasCirrhosisAny ||
        safety.hasGallbladderContra ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        !hasMed(ctx, 'fenofibrate')
      ) {
        return false;
      }
      const egfrCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
      if (safety.egfr === undefined || safety.egfr >= egfrCutoff) return false;
      const fenoDose = getMedDoseMg(ctx, 'fenofibrate');
      return fenoDose === undefined || fenoDose > 67; // qa-allow: index - Phan biet vien ham luong thap (<= 67 mg) voi vien tieu chuan 145-200 mg
    },
    produce: (ctx) => {
      const fenoMatch = findRawMedsWithComponent(ctx, 'fenofibrate')[0]; // qa-allow: index - Thuoc fenofibrate dau tien
      const egfr = need(ctx, 'egfr');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const egfrCutoff = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
      const fenoReduced = thFor('dose_mg', 'lipid.dose.fenofibrate_reduced');
      const targetId = fenoMatch ? fenoMatch.rawDrugId : 'fenofibrate';
      const disp = fenoMatch ? fenoMatch.displayName : 'Fenofibrate';
      return {
        id: 'rec_lipid_feno_mod_ckd_reduce',
        module: 'lipid',
        tier: 'Hiệu chỉnh liều theo thận',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Giảm liều xuống mức thấp (từ ${fenoReduced} mg 1 lần/ngày theo chế phẩm hàm lượng thấp)`,
        title: `Giảm liều ${disp} đang dùng do CKD mức độ vừa (eGFR ${egfrSevere}–<${egfrCutoff} mL/phút/1.73m²)`,
        rationale:
          `Ở CKD nhẹ – vừa (eGFR ${egfrSevere}–<${egfrCutoff} mL/phút/1.73m²), thanh thải fenofibrate giảm rõ rệt; bắt buộc hạ xuống chế phẩm hàm lượng thấp (từ ${fenoReduced} mg/ngày) và theo dõi sát creatinine cùng CK.`,
        gates: [
          {
            parameter: 'egfr',
            passed: false,
            action: 'reduce',
            value: egfr,
            threshold: egfrCutoff,
            messageVi: `eGFR < ${egfrCutoff} mL/phút/1.73m²: bắt buộc giảm liều Fenofibrate`
          }
        ],
        citationIds: [
          'acc.lipid.2026.fenofibrate_renal',
          'acc.lipid.2026.fenofibrate_dose_range',
          'byt.ckd.2024.fenofibrate_creatinine_monitor'
        ],
        priority: 93
      };
    }
  }
];
