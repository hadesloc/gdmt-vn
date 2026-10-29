/**
 * GDMT-VN Lipid Module - Rosuvastatin Antiviral/Oncology & Lovastatin/Fluvastatin DDI Rules
 * Phân quyền: Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getMedDoseMg,
  hasLipidFlag,
  hasMed
} from './helpers';
import { needsStatinTherapyForDdi } from './rules.ddi.oatp';

export const lipidOtherDdiRules: Rule[] = [
  {
    id: 'lipid.safety.ddi_rosuva_ledipasvir_voxilaprevir_avoid',
    module: 'lipid',
    nameVi: 'Ledipasvir / Voxilaprevir: Tránh phối hợp và tạm ngưng Rosuvastatin',
    citationIds: ['fda.rosuvastatin.ledipasvir_voxilaprevir_avoid'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasSevereAlt || safety.hasRhabdoRiskCk) return false;
      return safety.hasRosuvaAvoidMed && hasMed(ctx, 'rosuvastatin');
    },
    produce: (ctx) => {
      const rosuMatch = findRawMedsWithComponent(ctx, 'rosuvastatin')[0]; // qa-allow: index - Thuoc chua rosuvastatin dau tien
      const targetId = rosuMatch ? rosuMatch.rawDrugId : 'rosuvastatin';
      const disp = rosuMatch ? rosuMatch.displayName : 'Rosuvastatin';
      const unbundle = rosuMatch ? buildFdcUnbundleGuidanceVi(rosuMatch, STATIN_DRUG_IDS) : '';
      return {
        id: 'rec_lipid_ddi_rosuva_avoid_antiviral',
        module: 'lipid',
        tier: 'Tương tác thuốc OATP1B1 / BCRP nghiêm trọng',
        tierOrder: 0,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: disp,
        title: `Tạm ngưng / Tránh dùng ${disp} khi đang điều trị Ledipasvir hoặc Voxilaprevir`,
        rationale:
          `Ledipasvir và Voxilaprevir ức chế mạnh OATP1B1/BCRP làm tăng vọt nồng độ Rosuvastatin huyết tương (tới > 7–19 lần) và nguy cơ tiêu cơ vân cấp; bắt buộc tạm ngưng ${disp} trong đợt kháng virus HCV.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'ddi_rosuva_hcv',
            passed: false,
            action: 'contra',
            messageVi: 'Không phối hợp Rosuvastatin với Ledipasvir / Voxilaprevir'
          }
        ],
        citationIds: ['fda.rosuvastatin.ledipasvir_voxilaprevir_avoid'],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.ddi_rosuva_darolutamide_cap5',
    module: 'lipid',
    nameVi: 'Phối hợp Darolutamide: Giới hạn trần Rosuvastatin ≤ 5 mg/ngày',
    citationIds: ['fda.rosuvastatin.darolutamide_5mg_cap'],
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
        !safety.hasRosuvaCap5Med ||
        !hasMed(ctx, 'rosuvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'rosuvastatin');
      const cap5 = thFor('dose_mg', 'lipid.dose.rosuva_darolutamide_max');
      return doseMg === undefined || doseMg > cap5;
    },
    produce: (ctx) => {
      const rosuMatch = findRawMedsWithComponent(ctx, 'rosuvastatin')[0]; // qa-allow: index - Thuoc chua rosuvastatin dau tien
      const cap5 = thFor('dose_mg', 'lipid.dose.rosuva_darolutamide_max');
      const targetId = rosuMatch ? rosuMatch.rawDrugId : 'rosuvastatin';
      const disp = rosuMatch ? rosuMatch.displayName : 'Rosuvastatin';
      return {
        id: 'rec_lipid_ddi_rosuva_darolutamide_cap',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác BCRP / OATP1B1',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Tối đa ${cap5} mg 1 lần/ngày`,
        title: `Giảm liều ${disp} (Rosuvastatin ≤ ${cap5} mg/ngày) khi dùng kèm Darolutamide`,
        rationale: `Darolutamide ức chế mạnh BCRP và OATP1B1/1B3 làm tăng ~5 lần AUC của Rosuvastatin; giới hạn liều tối đa không quá ${cap5} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_rosuva_darolutamide',
            passed: false,
            action: 'reduce',
            threshold: cap5,
            messageVi: `Đang dùng Darolutamide: giới hạn Rosuvastatin ≤ ${cap5} mg/ngày`
          }
        ],
        citationIds: ['fda.rosuvastatin.darolutamide_5mg_cap'],
        priority: 96
      };
    }
  },

  {
    id: 'lipid.safety.ddi_rosuva_antiviral_onco_cap10',
    module: 'lipid',
    nameVi: 'Phối hợp thuốc kháng virus (Paxlovid / Ritonavir / Atazanavir / DAA) hoặc Regorafenib / Capmatinib: Giới hạn Rosuvastatin ≤ 10 mg/ngày',
    citationIds: ['fda.rosuvastatin.antiviral_10mg_cap', 'fda.rosuvastatin.regorafenib_10mg_cap'],
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
        !safety.hasRosuvaCap10Med ||
        !hasMed(ctx, 'rosuvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'rosuvastatin');
      const cap10 = thFor('dose_mg', 'lipid.dose.rosuva_antiviral_regorafenib_max');
      return doseMg === undefined || doseMg > cap10;
    },
    produce: (ctx) => {
      const rosuMatch = findRawMedsWithComponent(ctx, 'rosuvastatin')[0]; // qa-allow: index - Thuoc chua rosuvastatin dau tien
      const cap10 = thFor('dose_mg', 'lipid.dose.rosuva_antiviral_regorafenib_max');
      const targetId = rosuMatch ? rosuMatch.rawDrugId : 'rosuvastatin';
      const disp = rosuMatch ? rosuMatch.displayName : 'Rosuvastatin';
      return {
        id: 'rec_lipid_ddi_rosuva_antiviral_cap10',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác OATP1B1 / BCRP',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Tối đa ${cap10} mg 1 lần/ngày`,
        title: `Giảm liều ${disp} (Rosuvastatin ≤ ${cap10} mg/ngày) khi dùng kèm thuốc kháng virus ức chế protease/DAA hoặc Regorafenib/Capmatinib`,
        rationale:
          `Nirmatrelvir/ritonavir, atazanavir/ritonavir, lopinavir/ritonavir, các thuốc DAA viêm gan C, regorafenib và capmatinib ức chế OATP1B1/BCRP làm tăng mạnh phơi nhiễm Rosuvastatin; giới hạn liều tối đa ≤ ${cap10} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_rosuva_oatp_bcrp',
            passed: false,
            action: 'reduce',
            threshold: cap10,
            messageVi: `Giới hạn Rosuvastatin ≤ ${cap10} mg/ngày khi dùng kèm thuốc ức chế OATP1B1/BCRP`
          }
        ],
        citationIds: ['fda.rosuvastatin.antiviral_10mg_cap', 'fda.rosuvastatin.regorafenib_10mg_cap'],
        priority: 95
      };
    }
  },

  {
    id: 'lipid.safety.ddi_lovastatin_cyp3a4_hold',
    module: 'lipid',
    nameVi: 'Thuốc ức chế mạnh CYP3A4 / Kháng virus PI: Chống chỉ định và tạm ngưng Lovastatin',
    citationIds: ['acc.lipid.2026.lovastatin_pi_contra', 'fda.atorvastatin.cyp3a4_inhibitors_myopathy'],
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
        !safety.hasStrongCyp3a4Inhibitor
      ) {
        return false;
      }
      return hasMed(ctx, 'lovastatin');
    },
    produce: () => ({
      id: 'rec_lipid_ddi_cyp3a4_hold_lovastatin',
      module: 'lipid',
      tier: 'Tương tác thuốc CYP3A4 nghiêm trọng',
      tierOrder: 0,
      action: 'STOP',
      drugId: 'lovastatin',
      title: 'Tạm ngưng ngay Lovastatin do chống chỉ định với thuốc ức chế mạnh CYP3A4 / thuốc ức chế protease',
      rationale:
        'Lovastatin chuyển hóa hoàn toàn qua CYP3A4; phối hợp với clarithromycin, erythromycin, itraconazole, cobicistat hoặc ritonavir làm tăng vọt nguy cơ tiêu cơ vân cấp.',
      gates: [
        {
          parameter: 'ddi_lovastatin_cyp3a4',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định Lovastatin với thuốc ức chế mạnh CYP3A4'
        }
      ],
      citationIds: ['acc.lipid.2026.lovastatin_pi_contra', 'fda.atorvastatin.cyp3a4_inhibitors_myopathy'],
      priority: 98
    })
  },

  {
    id: 'lipid.safety.ddi_lovastatin_cv_caps',
    module: 'lipid',
    nameVi: 'Giới hạn liều trần Lovastatin khi phối hợp thuốc tim mạch (Dronedarone / CCB / Ranolazine / Amiodarone / Ticagrelor)',
    citationIds: ['acc.lipid.2026.ddi_table27_lovastatin_caps'],
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
        !hasMed(ctx, 'lovastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'lovastatin');
      const cap10 = thFor('dose_mg', 'lipid.dose.lovastatin_dronedarone_max');
      const cap20 = thFor('dose_mg', 'lipid.dose.lovastatin_ccb_max');
      const cap40 = thFor('dose_mg', 'lipid.dose.lovastatin_amiodarone_ticagrelor_max');
      if (hasMed(ctx, 'dronedarone') && (doseMg === undefined || doseMg > cap10)) return true;
      if (
        (hasMed(ctx, 'diltiazem') ||
          hasMed(ctx, 'verapamil') ||
          hasMed(ctx, 'amlodipine') ||
          hasMed(ctx, 'ranolazine')) &&
        (doseMg === undefined || doseMg > cap20)
      ) {
        return true;
      }
      if ((hasMed(ctx, 'amiodarone') || safety.hasTicagrelor) && (doseMg === undefined || doseMg > cap40)) {
        return true;
      }
      return false;
    },
    produce: (ctx) => {
      const hasDrone = hasMed(ctx, 'dronedarone');
      const hasCcb =
        hasMed(ctx, 'diltiazem') ||
        hasMed(ctx, 'verapamil') ||
        hasMed(ctx, 'amlodipine') ||
        hasMed(ctx, 'ranolazine');
      const cap10 = thFor('dose_mg', 'lipid.dose.lovastatin_dronedarone_max');
      const cap20 = thFor('dose_mg', 'lipid.dose.lovastatin_ccb_max');
      const cap40 = thFor('dose_mg', 'lipid.dose.lovastatin_amiodarone_ticagrelor_max');
      const capMg = hasDrone ? cap10 : hasCcb ? cap20 : cap40;
      const drugLabel = hasDrone
        ? 'Dronedarone'
        : hasCcb
          ? 'Diltiazem / Verapamil / Amlodipine / Ranolazine'
          : 'Amiodarone / Ticagrelor';

      if (needsStatinTherapyForDdi(ctx)) {
        return {
          id: 'rec_lipid_ddi_lova_stop_for_switch',
          module: 'lipid',
          tier: 'Tương tác thuốc tim mạch – Statin',
          tierOrder: 0,
          action: 'STOP',
          drugId: 'lovastatin',
          title: `Ngừng Lovastatin (vượt trần tương tác ≤ ${capMg} mg/ngày với ${drugLabel}) để chuyển sang Statin cường độ cao an toàn`,
          rationale: `Lovastatin bị giới hạn tối đa ≤ ${capMg} mg/ngày khi dùng kèm ${drugLabel} do nguy cơ tiêu cơ vân; khuyến cáo ngừng Lovastatin và chuyển sang Atorvastatin/Rosuvastatin.`,
          gates: [
            {
              parameter: 'ddi_lovastatin_cv',
              passed: false,
              action: 'contra',
              threshold: capMg,
              messageVi: `Giới hạn Lovastatin ≤ ${capMg} mg/ngày`
            }
          ],
          citationIds: ['acc.lipid.2026.ddi_table27_lovastatin_caps'],
          priority: 96
        };
      }

      return {
        id: 'rec_lipid_ddi_lova_reduce_cap',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác thuốc',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: 'lovastatin',
        dose: `Tối đa ${capMg} mg 1 lần/ngày`,
        title: `Giảm liều Lovastatin ≤ ${capMg} mg/ngày khi dùng kèm ${drugLabel}`,
        rationale: `Phối hợp ${drugLabel} làm tăng phơi nhiễm Lovastatin và nguy cơ tiêu cơ vân; không dùng Lovastatin quá ${capMg} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_lovastatin_cap',
            passed: false,
            action: 'reduce',
            threshold: capMg,
            messageVi: `Giới hạn Lovastatin ≤ ${capMg} mg/ngày`
          }
        ],
        citationIds: ['acc.lipid.2026.ddi_table27_lovastatin_caps'],
        priority: 95
      };
    }
  },

  {
    id: 'lipid.safety.ddi_fluvastatin_caps',
    module: 'lipid',
    nameVi: 'Phối hợp Fluconazole / Clarithromycin: Giới hạn liều trần Fluvastatin',
    citationIds: [
      'acc.lipid.2026.fluvastatin_lovastatin_dosing',
      'byt.copd.2026.pravastatin_clarithromycin_limit_40mg'
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
        !hasMed(ctx, 'fluvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'fluvastatin');
      const capClari = thFor('dose_mg', 'lipid.dose.fluvastatin_clarithro_max');
      const capFluco = thFor('dose_mg', 'lipid.dose.fluvastatin_cyclosporine_max');
      if (hasMed(ctx, 'clarithromycin') && (doseMg === undefined || doseMg > capClari)) return true;
      if (hasMed(ctx, 'fluconazole') && (doseMg === undefined || doseMg > capFluco)) return true;
      return false;
    },
    produce: (ctx) => {
      const hasClari = hasMed(ctx, 'clarithromycin');
      const capMg = hasClari
        ? thFor('dose_mg', 'lipid.dose.fluvastatin_clarithro_max')
        : thFor('dose_mg', 'lipid.dose.fluvastatin_cyclosporine_max');
      const interactor = hasClari ? 'Clarithromycin' : 'Fluconazole (ức chế CYP2C9)';
      return {
        id: 'rec_lipid_ddi_fluvastatin_reduce',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác CYP2C9 / OATP',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: 'fluvastatin',
        dose: `Tối đa ${capMg} mg/ngày`,
        title: `Giảm liều Fluvastatin ≤ ${capMg} mg/ngày khi dùng kèm ${interactor}`,
        rationale: `Fluvastatin chuyển hóa chính qua CYP2C9 và vận chuyển qua gan; khi phối hợp ${interactor}, giới hạn tổng liều không vượt quá ${capMg} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_fluvastatin',
            passed: false,
            action: 'reduce',
            threshold: capMg,
            messageVi: `Giới hạn Fluvastatin ≤ ${capMg} mg/ngày`
          }
        ],
        citationIds: [
          'acc.lipid.2026.fluvastatin_lovastatin_dosing',
          'byt.copd.2026.pravastatin_clarithromycin_limit_40mg'
        ],
        priority: 94
      };
    }
  }
];
