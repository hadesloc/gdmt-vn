/**
 * GDMT-VN Lipid Module - Cardiovascular, BCRP, Bempedoic & Anticoagulant DDI Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getActiveFibrateMatches,
  getMedDoseMg,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  pickSafeHighStatin
} from './helpers';
import { needsStatinTherapyForDdi } from './rules.ddi.cyp';

export const lipidCvDdiRules: Rule[] = [
  {
    id: 'lipid.safety.simvastatin_80mg_stop',
    module: 'lipid',
    nameVi: 'Cấm dùng Simvastatin vượt trần an toàn (> 40 mg/ngày): Ngừng Simvastatin do nguy cơ tiêu cơ vân',
    citationIds: ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.simvastatin_dose'],
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
        !hasMed(ctx, 'simvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'simvastatin');
      const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
      return doseMg !== undefined && doseMg > simvaMax;
    },
    produce: (ctx) => {
      const simvaMatch = findRawMedsWithComponent(ctx, 'simvastatin')[0]; // qa-allow: index - Thuoc chua simvastatin dau tien
      const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
      const contraDose = thFor('dose_mg', 'lipid.dose.simva_contra_dose');
      const targetId = simvaMatch ? simvaMatch.rawDrugId : 'simvastatin';
      const disp = simvaMatch ? simvaMatch.displayName : 'Simvastatin';
      const unbundle = simvaMatch ? buildFdcUnbundleGuidanceVi(simvaMatch, STATIN_DRUG_IDS) : '';
      return {
        id: 'rec_lipid_simva_80_stop',
        module: 'lipid',
        tier: 'Cảnh báo liều độc cơ',
        tierOrder: 0,
        action: 'STOP',
        drugId: targetId,
        drugNameVi: disp,
        title: `Ngừng ${disp} (liều Simvastatin vượt trần ${simvaMax} mg/ngày / liều độc cơ ${contraDose} mg) do nguy cơ tiêu cơ vân cao`,
        rationale:
          `Liều tối đa khuyến cáo của Simvastatin là ${simvaMax} mg/ngày và liều ${contraDose} mg/ngày làm tăng rõ rệt tỷ lệ bệnh cơ và tiêu cơ vân cấp tính; bắt buộc ngừng ${disp} và chuyển sang statin cường độ cao an toàn hơn.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'simvastatin_dose',
            passed: false,
            action: 'contra',
            value: simvaMatch?.doseMg,
            threshold: simvaMax,
            messageVi: `Không duy trì Simvastatin > ${simvaMax} mg/ngày`
          }
        ],
        citationIds: ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.simvastatin_dose'],
        priority: 97
      };
    }
  },

  {
    id: 'lipid.safety.simvastatin_80mg_switch',
    module: 'lipid',
    nameVi: 'Simvastatin vượt trần > 40 mg/ngày: Chuyển đổi sang Atorvastatin/Rosuvastatin',
    citationIds: ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.statin_doses'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.hardBlockedForStatinInit ||
        safety.hasCyclosporine ||
        safety.hasGemfibrozil ||
        safety.hasStrongCyp3a4Inhibitor ||
        !hasMed(ctx, 'simvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'simvastatin');
      const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
      return doseMg !== undefined && doseMg > simvaMax && pickSafeHighStatin(ctx, safety) !== null;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const chosen = pickSafeHighStatin(ctx, safety);
      if (!chosen) return null;
      const simvaMatch = findRawMedsWithComponent(ctx, 'simvastatin')[0]; // qa-allow: index - Thuoc chua simvastatin dau tien
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const minPct = thFor('ldl_reduction_pct', 'lipid.target.percent_reduction_min');
      const doseText =
        chosen.drugId === 'atorvastatin'
          ? `${atorvaMin}–${atorvaMax} mg 1 lần/ngày`
          : safety.hasTicagrelorOrFebuxostat
            ? `${rosuvaMin} mg 1 lần/ngày`
            : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`;
      return {
        id: 'rec_lipid_simva_80_switch_atorva',
        module: 'lipid',
        tier: 'Chuyển đổi Statin cường độ cao',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: chosen.drugId,
        switchFrom: simvaMatch ? simvaMatch.rawDrugId : 'simvastatin',
        dose: doseText,
        title: `Chuyển từ Simvastatin liều cao sang ${chosen.nameVi} (${doseText})`,
        rationale: `Thay thế Simvastatin vượt trần an toàn bằng ${chosen.nameVi} (${doseText}) để đạt hiệu lực hạ LDL-C ≥ ${minPct}% với hồ sơ an toàn cơ vượt trội.`,
        gates: [],
        citationIds: ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.statin_doses'],
        priority: 93
      };
    }
  },

  {
    id: 'lipid.safety.ddi_simva_cap10_or_20',
    module: 'lipid',
    nameVi: 'Giới hạn trần Simvastatin theo tương tác thuốc tim mạch hoặc Ticagrelor',
    citationIds: [
      'fda.diltiazem.simvastatin_limit_10mg',
      'acc.lipid.2026.ddi_table27_simva_dronedarone',
      'acc.lipid.2026.ddi_table27_verapamil_simva',
      'acc.lipid.2026.ddi_table27_simva_ticagrelor',
      'acc.lipid.2026.simvastatin_dose',
      'fda.bempedoic.simvastatin_avoid_gt_20mg',
      'acc.lipid.2026.simva_contra_80mg'
    ],
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
        hasLipidFlag(ctx, 'statinIntolerance') ||
        !hasMed(ctx, 'simvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'simvastatin');
      const simvaMax = thFor('dose_mg', 'lipid.dose.simva_max');
      if (doseMg !== undefined && doseMg > simvaMax) return false;

      const cap10 = thFor('dose_mg', 'lipid.dose.simva_diltiazem_max');
      const cap20 = thFor('dose_mg', 'lipid.dose.simva_amiodarone_max');
      const cap40 = thFor('dose_mg', 'lipid.dose.simva_ticagrelor_max');
      if (safety.hasSimvaCap10Med && (doseMg === undefined || doseMg > cap10)) return true;
      if (
        (safety.hasSimvaCap20Med || hasMed(ctx, 'bempedoic_acid')) &&
        (doseMg === undefined || doseMg > cap20)
      ) {
        return true;
      }
      if (safety.hasTicagrelor && (doseMg === undefined || doseMg > cap40)) return true;
      return false;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const simvaMatch = findRawMedsWithComponent(ctx, 'simvastatin')[0]; // qa-allow: index - Thuoc chua simvastatin dau tien
      const targetId = simvaMatch ? simvaMatch.rawDrugId : 'simvastatin';
      const disp = simvaMatch ? simvaMatch.displayName : 'Simvastatin';
      const unbundle = simvaMatch ? buildFdcUnbundleGuidanceVi(simvaMatch, STATIN_DRUG_IDS) : '';
      const cap10 = thFor('dose_mg', 'lipid.dose.simva_diltiazem_max');
      const cap20 = thFor('dose_mg', 'lipid.dose.simva_amiodarone_max');
      const cap40 = thFor('dose_mg', 'lipid.dose.simva_ticagrelor_max');
      const hasBempedoic = hasMed(ctx, 'bempedoic_acid');

      const isCap10 = safety.hasSimvaCap10Med;
      const isCap20 = !isCap10 && (safety.hasSimvaCap20Med || hasBempedoic);
      const capMg = isCap10 ? cap10 : isCap20 ? cap20 : cap40;

      const cids = isCap10
        ? [
            'fda.diltiazem.simvastatin_limit_10mg',
            'acc.lipid.2026.ddi_table27_simva_dronedarone',
            'acc.lipid.2026.ddi_table27_verapamil_simva',
            'acc.lipid.2026.simvastatin_dose'
          ]
        : hasBempedoic
          ? ['fda.bempedoic.simvastatin_avoid_gt_20mg', 'acc.lipid.2026.simvastatin_dose']
          : isCap20
            ? ['acc.lipid.2026.simva_contra_80mg', 'acc.lipid.2026.simvastatin_dose']
            : ['acc.lipid.2026.ddi_table27_simva_ticagrelor', 'acc.lipid.2026.simvastatin_dose'];

      const interactorLabel = isCap10
        ? 'Diltiazem / Verapamil / Dronedarone'
        : hasBempedoic
          ? 'Bempedoic acid'
          : isCap20
            ? 'Amlodipine / Amiodarone / Ranolazine'
            : 'Ticagrelor';

      const shouldSwitchHigh =
        !hasBempedoic &&
        needsStatinTherapyForDdi(ctx) &&
        (!hasLipidDrugAllergy(ctx, 'atorvastatin') || !hasLipidDrugAllergy(ctx, 'rosuvastatin'));

      if (shouldSwitchHigh) {
        return {
          id: 'rec_lipid_ddi_simva_stop_for_switch',
          module: 'lipid',
          tier: 'Tương tác thuốc tim mạch – Statin',
          tierOrder: 0,
          action: 'STOP',
          drugId: targetId,
          drugNameVi: disp,
          title: `Ngừng ${disp} (giới hạn tương tác Simvastatin ≤ ${capMg} mg/ngày) để chuyển sang Statin cường độ cao an toàn`,
          rationale:
            `Simvastatin bị giới hạn ≤ ${capMg} mg/ngày khi phối hợp với ${interactorLabel} do nguy cơ tiêu cơ vân, trong khi bệnh nhân chưa đạt mục tiêu LDL-C; bắt buộc ngừng ${disp} và chuyển sang Atorvastatin/Rosuvastatin.` +
            (unbundle ? ` ${unbundle}` : ''),
          gates: [
            {
              parameter: 'ddi_simvastatin_cv',
              passed: false,
              action: 'contra',
              threshold: capMg,
              messageVi: `Tương tác thuốc: không dùng Simvastatin > ${capMg} mg/ngày`
            }
          ],
          citationIds: cids,
          priority: 97
        };
      }

      return {
        id: 'rec_lipid_ddi_simva_reduce_cap',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Tối đa ${capMg} mg 1 lần/ngày`,
        title: `Giảm / Xác nhận liều ${disp} (Simvastatin ≤ ${capMg} mg/ngày) do tương tác với ${interactorLabel}`,
        rationale:
          `Phối hợp ${interactorLabel} làm tăng phơi nhiễm Simvastatin và nguy cơ bệnh cơ/tiêu cơ vân; liều Simvastatin tuyệt đối không vượt quá ${capMg} mg/ngày.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'ddi_simvastatin_cap',
            passed: false,
            action: 'reduce',
            threshold: capMg,
            messageVi: `Giới hạn Simvastatin ≤ ${capMg} mg/ngày`
          }
        ],
        citationIds: cids,
        priority: 96
      };
    }
  },

  {
    id: 'lipid.safety.ddi_pravastatin_bempedoic_cap40',
    module: 'lipid',
    nameVi: 'Phối hợp Bempedoic acid: Giới hạn trần Pravastatin ≤ 40 mg/ngày',
    citationIds: ['fda.bempedoic.pravastatin_avoid_gt_40mg', 'acc.lipid.2026.ddi_table27_prava_bempedoic'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        !hasMed(ctx, 'pravastatin') ||
        !hasMed(ctx, 'bempedoic_acid')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'pravastatin');
      const cap40 = thFor('dose_mg', 'lipid.dose.prava_bempedoic_max');
      return doseMg === undefined || doseMg > cap40;
    },
    produce: (ctx) => {
      const pravaMatch = findRawMedsWithComponent(ctx, 'pravastatin')[0]; // qa-allow: index - Thuoc chua pravastatin dau tien
      const cap40 = thFor('dose_mg', 'lipid.dose.prava_bempedoic_max');
      const targetId = pravaMatch ? pravaMatch.rawDrugId : 'pravastatin';
      return {
        id: 'rec_lipid_ddi_prava_bempedoic_cap',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        dose: `Tối đa ${cap40} mg 1 lần/ngày`,
        title: `Giảm liều Pravastatin ≤ ${cap40} mg/ngày khi dùng kèm Bempedoic acid`,
        rationale: `Bempedoic acid ức chế OATP1B1 làm tăng khoảng 2 lần AUC của Pravastatin; tránh dùng Pravastatin > ${cap40} mg/ngày khi phối hợp.`,
        gates: [
          {
            parameter: 'ddi_pravastatin_bempedoic',
            passed: false,
            action: 'reduce',
            threshold: cap40,
            messageVi: `Đang dùng Bempedoic acid: giới hạn Pravastatin ≤ ${cap40} mg/ngày`
          }
        ],
        citationIds: [
          'fda.bempedoic.pravastatin_avoid_gt_40mg',
          'acc.lipid.2026.ddi_table27_prava_bempedoic'
        ],
        priority: 94
      };
    }
  },

  {
    id: 'lipid.safety.ddi_rosuvastatin_ticagrelor_febuxostat_cap20',
    module: 'lipid',
    nameVi: 'Phối hợp chất ức chế BCRP (Ticagrelor / Febuxostat / Teriflunomide / Fostamatinib / Tafamidis): Giới hạn Rosuvastatin ≤ 20 mg/ngày',
    citationIds: ['fda.rosuvastatin.ticagrelor_limit_20mg', 'fda.rosuvastatin.febuxostat_limit_20mg'],
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
        safety.hasRosuvaAvoidMed ||
        safety.hasRosuvaCap5Med ||
        safety.hasRosuvaCap10Med ||
        safety.hasSevereCkd ||
        !safety.hasTicagrelorOrFebuxostat ||
        !hasMed(ctx, 'rosuvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'rosuvastatin');
      const cap20 = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
      return doseMg === undefined || doseMg > cap20;
    },
    produce: (ctx) => {
      const rosuMatch = findRawMedsWithComponent(ctx, 'rosuvastatin')[0]; // qa-allow: index - Thuoc chua rosuvastatin dau tien
      const cap20 = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
      const targetId = rosuMatch ? rosuMatch.rawDrugId : 'rosuvastatin';
      const disp = rosuMatch ? rosuMatch.displayName : 'Rosuvastatin';
      return {
        id: 'rec_lipid_ddi_rosuva_ticagrelor_cap',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác BCRP',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Tối đa ${cap20} mg 1 lần/ngày`,
        title: `Giảm liều ${disp} (Rosuvastatin ≤ ${cap20} mg/ngày) khi dùng kèm Ticagrelor / Febuxostat / thuốc ức chế BCRP`,
        rationale: `Ticagrelor, Febuxostat, Teriflunomide, Fostamatinib và Tafamidis ức chế vận chuyển BCRP làm tăng phơi nhiễm Rosuvastatin ~2 lần và nguy cơ tiêu cơ vân/suy thận; không dùng Rosuvastatin > ${cap20} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_rosuva_bcrp',
            passed: false,
            action: 'reduce',
            threshold: cap20,
            messageVi: `Ức chế BCRP: giới hạn Rosuvastatin ≤ ${cap20} mg/ngày`
          }
        ],
        citationIds: [
          'fda.rosuvastatin.ticagrelor_limit_20mg',
          'fda.rosuvastatin.febuxostat_limit_20mg'
        ],
        priority: 94
      };
    }
  },

  {
    id: 'lipid.safety.ddi_vka_inr_monitor',
    module: 'lipid',
    nameVi: 'Theo dõi sát INR khi phối hợp Fibrate / Rosuvastatin với thuốc kháng vitamin K',
    citationIds: [
      'byt.ckd.2024.fibrate_warfarin_cyclosporine_ddi',
      'fda.rosuvastatin.warfarin_inr',
      'acc.lipid.2026.fenofibrate_dose_range'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || !safety.hasVka) return false;
      return getActiveFibrateMatches(ctx).length > 0 || hasMed(ctx, 'rosuvastatin');
    },
    produce: (ctx) => {
      const onFibrate = getActiveFibrateMatches(ctx).length > 0;
      const onRosuva = hasMed(ctx, 'rosuvastatin');
      const cids: string[] = [];
      if (onFibrate) {
        cids.push('byt.ckd.2024.fibrate_warfarin_cyclosporine_ddi');
        if (!onRosuva) cids.push('acc.lipid.2026.fenofibrate_dose_range');
      }
      if (onRosuva) {
        cids.push('fda.rosuvastatin.warfarin_inr');
      }
      return {
        id: 'rec_lipid_ddi_vka_inr_monitor',
        module: 'lipid',
        tier: 'Theo dõi tương tác chống đông',
        tierOrder: 3,
        action: 'MONITOR',
        title: onFibrate
          ? 'Theo dõi sát PT/INR và giảm liều thuốc kháng vitamin K khi phối hợp Fibrate'
          : 'Theo dõi PT/INR khi khởi trị hoặc chỉnh liều Rosuvastatin trên nền kháng vitamin K',
        rationale: onFibrate
          ? 'Fibrate (Fenofibrate) đẩy thuốc kháng vitamin K khỏi protein huyết tương và tăng mạnh tác dụng chống đông của Warfarin/Acenocoumarol gây nguy cơ xuất huyết nặng; cần kiểm tra INR sát và chủ động hiệu chỉnh giảm liều kháng vitamin K.'
          : 'Rosuvastatin có thể làm tăng INR trên bệnh nhân đang dùng thuốc kháng vitamin K; cần kiểm tra INR trước và sau khi khởi trị hoặc tăng liều.',
        gates: [],
        citationIds: cids,
        priority: 72
      };
    }
  }
];
