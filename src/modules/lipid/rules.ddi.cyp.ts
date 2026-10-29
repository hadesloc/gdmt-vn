/**
 * GDMT-VN Lipid Module - CYP3A4 / Antiviral / Macrolide DDI Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildCommonLipidWarnings,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getActiveStatin,
  getMedDoseMg,
  hasAscvdEquivalent,
  hasClinicalFh,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  isAcuteAcsInpatient,
  isAsianPatient
} from './helpers';
import { needsStatinTherapyForDdi } from './rules.ddi.oatp';

export { needsStatinTherapyForDdi };

function isPrimaryHivCandidate(ctx: Parameters<Rule['when']>[0]): boolean {
  if (!hasLipidFlag(ctx, 'hiv') || hasAscvdEquivalent(ctx) || hasClinicalFh(ctx)) return false;
  const age = need(ctx, 'age');
  const minAge = thFor('age', 'lipid.hiv.primary_min_age');
  return age !== undefined && age >= minAge;
}

export const lipidCypDdiRules: Rule[] = [
  {
    id: 'lipid.safety.ddi_cyp3a4_simva_hold',
    module: 'lipid',
    nameVi: 'Thuốc ức chế mạnh CYP3A4: Tạm ngưng hoặc đổi Simvastatin',
    citationIds: ['fda.atorvastatin.cyp3a4_inhibitors_myopathy'],
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
      return hasMed(ctx, 'simvastatin');
    },
    produce: (ctx) => {
      const simvaMatch = findRawMedsWithComponent(ctx, 'simvastatin')[0]; // qa-allow: index - Thuoc chua simvastatin dau tien
      const targetId = simvaMatch ? simvaMatch.rawDrugId : 'simvastatin';
      const disp = simvaMatch ? simvaMatch.displayName : 'Simvastatin';
      const unbundle = simvaMatch ? buildFdcUnbundleGuidanceVi(simvaMatch, STATIN_DRUG_IDS) : '';
      return {
        id: 'rec_lipid_ddi_cyp3a4_hold_simva',
        module: 'lipid',
        tier: 'Tương tác thuốc CYP3A4',
        tierOrder: 0,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: disp,
        title: `Tạm ngưng ngay ${disp} do chống chỉ định với thuốc ức chế mạnh CYP3A4`,
        rationale:
          `Thuốc ức chế mạnh CYP3A4 (clarithromycin, erythromycin, itraconazole, azole mạnh, cobicistat, ritonavir/nirmatrelvir) làm tăng vọt nồng độ Simvastatin gây tiêu cơ vân cấp.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'ddi_strong_cyp3a4',
            passed: false,
            action: 'contra',
            messageVi: 'Chống chỉ định Simvastatin với thuốc ức chế mạnh CYP3A4'
          }
        ],
        citationIds: ['fda.atorvastatin.cyp3a4_inhibitors_myopathy'],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.ddi_cyp3a4_atorva_hold',
    module: 'lipid',
    nameVi: 'Thuốc kháng virus / Azole ức chế mạnh CYP3A4: Tạm ngưng hoặc đổi Atorvastatin',
    citationIds: [
      'acc.lipid.2026.ddi_table22_cobicistat_contra',
      'fda.atorvastatin.tipranavir_not_rec',
      'fda.atorvastatin.cyp3a4_inhibitors_myopathy'
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
        !safety.hasAntiviralOrAzoleCyp3a4
      ) {
        return false;
      }
      return hasMed(ctx, 'atorvastatin');
    },
    produce: (ctx) => {
      const atorvaMatch = findRawMedsWithComponent(ctx, 'atorvastatin')[0]; // qa-allow: index - Thuoc chua atorvastatin dau tien
      const rosuvaCap10 = thFor('dose_mg', 'lipid.dose.rosuva_antiviral_regorafenib_max');
      const targetId = atorvaMatch ? atorvaMatch.rawDrugId : 'atorvastatin';
      const disp = atorvaMatch ? atorvaMatch.displayName : 'Atorvastatin';
      const unbundle = atorvaMatch ? buildFdcUnbundleGuidanceVi(atorvaMatch, STATIN_DRUG_IDS) : '';
      return {
        id: 'rec_lipid_ddi_cyp3a4_hold_atorva',
        module: 'lipid',
        tier: 'Tương tác thuốc CYP3A4 / Kháng virus',
        tierOrder: 0,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: disp,
        title: `Tạm ngưng ${disp} khi đang dùng Ritonavir / Nirmatrelvir-Ritonavir / Cobicistat / Azole mạnh`,
        rationale:
          `Nirmatrelvir/ritonavir, ritonavir, cobicistat, atazanavir/tipranavir và các azole kháng nấm mạnh làm tăng mạnh phơi nhiễm Atorvastatin; cần tạm ngưng Atorvastatin hoặc chuyển sang Rosuvastatin liều thấp (≤ ${rosuvaCap10} mg/ngày) / Pitavastatin phù hợp.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'ddi_strong_cyp3a4',
            passed: false,
            action: 'hold',
            messageVi: 'Tạm ngưng Atorvastatin khi dùng cobicistat / ritonavir / azole mạnh'
          }
        ],
        citationIds: [
          'acc.lipid.2026.ddi_table22_cobicistat_contra',
          'fda.atorvastatin.tipranavir_not_rec',
          'fda.atorvastatin.cyp3a4_inhibitors_myopathy'
        ],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.ddi_cyp3a4_atorva_cap20',
    module: 'lipid',
    nameVi: 'Phối hợp Clarithromycin / Erythromycin / Itraconazole: Giới hạn trần Atorvastatin ≤ 20 mg/ngày',
    citationIds: [
      'fda.atorvastatin.clarithromycin_dose_cap',
      'fda.atorvastatin.azole_macrolide_examples',
      'fda.atorvastatin.cyp3a4_inhibitors_myopathy'
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
        safety.hasAntiviralOrAzoleCyp3a4 ||
        !(safety.hasClarithroOrItra || safety.hasErythromycin) ||
        !hasMed(ctx, 'atorvastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'atorvastatin');
      const maxAtorva = thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max');
      return doseMg === undefined || doseMg > maxAtorva;
    },
    produce: (ctx) => {
      const atorvaMatch = findRawMedsWithComponent(ctx, 'atorvastatin')[0]; // qa-allow: index - Thuoc chua atorvastatin dau tien
      const maxAtorva = thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max');
      const targetId = atorvaMatch ? atorvaMatch.rawDrugId : 'atorvastatin';
      const disp = atorvaMatch ? atorvaMatch.displayName : 'Atorvastatin';
      const unbundle = atorvaMatch ? buildFdcUnbundleGuidanceVi(atorvaMatch, STATIN_DRUG_IDS) : '';
      return {
        id: 'rec_lipid_ddi_cyp3a4_reduce_atorva',
        module: 'lipid',
        tier: 'Tương tác thuốc CYP3A4',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        drugNameVi: disp,
        dose: `Tối đa không quá ${maxAtorva} mg 1 lần/ngày`,
        title: `Giảm liều ${disp} (Atorvastatin ≤ ${maxAtorva} mg/ngày) do dùng Clarithromycin / Erythromycin / Itraconazole`,
        rationale:
          `Clarithromycin, Erythromycin và Itraconazole ức chế CYP3A4 làm tăng nồng độ Atorvastatin và nguy cơ bệnh cơ; liều Atorvastatin không vượt quá ${maxAtorva} mg/ngày (hoặc chuyển sang Rosuvastatin nếu cần cường độ cao).` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'ddi_strong_cyp3a4',
            passed: false,
            action: 'reduce',
            threshold: maxAtorva,
            messageVi: `Clarithromycin/Erythromycin/Itraconazole: giới hạn Atorvastatin ≤ ${maxAtorva} mg/ngày`
          }
        ],
        citationIds: [
          'fda.atorvastatin.clarithromycin_dose_cap',
          'fda.atorvastatin.azole_macrolide_examples',
          'fda.atorvastatin.cyp3a4_inhibitors_myopathy'
        ],
        priority: 95
      };
    }
  },

  {
    id: 'lipid.safety.ddi_erythromycin_pita_cap1',
    module: 'lipid',
    nameVi: 'Phối hợp Erythromycin: Giới hạn trần Pitavastatin ≤ 1 mg/ngày',
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
        !safety.hasErythromycin ||
        !hasMed(ctx, 'pitavastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'pitavastatin');
      const maxPita = thFor('dose_mg', 'lipid.dose.pita_erythromycin_max');
      return doseMg === undefined || doseMg > maxPita;
    },
    produce: () => {
      const maxPita = thFor('dose_mg', 'lipid.dose.pita_erythromycin_max');
      return {
        id: 'rec_lipid_ddi_erythro_reduce_pita',
        module: 'lipid',
        tier: 'Tương tác thuốc OATP1B1',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: 'pitavastatin',
        dose: `Tối đa ${maxPita} mg 1 lần/ngày`,
        title: `Giảm liều Pitavastatin ≤ ${maxPita} mg/ngày khi dùng kèm Erythromycin`,
        rationale: `Erythromycin ức chế vận chuyển OATP1B1 làm tăng mạnh phơi nhiễm Pitavastatin; giới hạn liều ≤ ${maxPita} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_erythromycin',
            passed: false,
            action: 'reduce',
            threshold: maxPita,
            messageVi: `Đang dùng Erythromycin: giới hạn Pitavastatin ≤ ${maxPita} mg/ngày`
          }
        ],
        citationIds: ['acc.lipid.2026.pitavastatin_dose'],
        priority: 94
      };
    }
  },

  {
    id: 'lipid.safety.ddi_macrolide_prava_cap40',
    module: 'lipid',
    nameVi: 'Phối hợp Clarithromycin / Erythromycin: Giới hạn trần Pravastatin ≤ 40 mg/ngày',
    citationIds: ['acc.lipid.2026.pravastatin_dose', 'byt.copd.2026.pravastatin_clarithromycin_limit_40mg'],
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
        !(safety.hasClarithroOrItra || safety.hasErythromycin) ||
        !hasMed(ctx, 'pravastatin')
      ) {
        return false;
      }
      const doseMg = getMedDoseMg(ctx, 'pravastatin');
      const maxPrava = thFor('dose_mg', 'lipid.dose.prava_clarithro_max');
      return doseMg === undefined || doseMg > maxPrava;
    },
    produce: (ctx) => {
      const pravaMatch = findRawMedsWithComponent(ctx, 'pravastatin')[0]; // qa-allow: index - Thuoc chua pravastatin dau tien
      const maxPrava = thFor('dose_mg', 'lipid.dose.prava_clarithro_max');
      const targetId = pravaMatch ? pravaMatch.rawDrugId : 'pravastatin';
      return {
        id: 'rec_lipid_ddi_macrolide_reduce_prava',
        module: 'lipid',
        tier: 'Tương tác thuốc Macrolide',
        tierOrder: 1,
        action: 'REDUCE',
        drugId: targetId,
        dose: `Tối đa ${maxPrava} mg 1 lần/ngày`,
        title: `Giảm / Giới hạn liều Pravastatin ≤ ${maxPrava} mg/ngày khi dùng kèm Clarithromycin / Erythromycin`,
        rationale: `Clarithromycin và Erythromycin ức chế vận chuyển làm tăng nồng độ Pravastatin; giới hạn liều tối đa không quá ${maxPrava} mg/ngày.`,
        gates: [
          {
            parameter: 'ddi_macrolide',
            passed: false,
            action: 'reduce',
            threshold: maxPrava,
            messageVi: `Clarithromycin/Erythromycin: Pravastatin ≤ ${maxPrava} mg/ngày`
          }
        ],
        citationIds: [
          'acc.lipid.2026.pravastatin_dose',
          'byt.copd.2026.pravastatin_clarithromycin_limit_40mg'
        ],
        priority: 93
      };
    }
  },

  {
    id: 'lipid.safety.ddi_cyp3a4_naive_defer_atorva',
    module: 'lipid',
    nameVi: 'Đang dùng ức chế mạnh CYP3A4 chưa có Statin: Tránh khởi trị Atorvastatin/Simvastatin',
    citationIds: [
      'fda.atorvastatin.cyp3a4_inhibitors_myopathy',
      'fda.atorvastatin.clarithromycin_dose_cap'
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
        safety.hasGemfibrozil ||
        !safety.hasStrongCyp3a4Inhibitor ||
        getActiveStatin(ctx) !== null ||
        hasLipidFlag(ctx, 'statinIntolerance') ||
        isPrimaryHivCandidate(ctx)
      ) {
        return false;
      }
      return needsStatinTherapyForDdi(ctx);
    },
    produce: () => ({
      id: 'rec_lipid_ddi_cyp3a4_defer_atorva',
      module: 'lipid',
      tier: 'Tương tác thuốc CYP3A4',
      tierOrder: 1,
      action: 'DEFER',
      drugId: 'atorvastatin',
      title: 'Trì hoãn / Tránh khởi trị Atorvastatin liều cao khi đang dùng thuốc ức chế mạnh CYP3A4',
      rationale:
        'Atorvastatin chuyển hóa qua CYP3A4 nên bị tăng phơi nhiễm khi dùng cùng clarithromycin, erythromycin, itraconazole hoặc thuốc kháng virus có ritonavir/cobicistat; tránh khởi trị Atorvastatin liều cao và ưu tiên statin không qua CYP3A4.',
      gates: [
        {
          parameter: 'ddi_strong_cyp3a4',
          passed: false,
          action: 'hold',
          messageVi: 'Đang dùng thuốc ức chế mạnh CYP3A4: tránh Atorvastatin liều cao'
        }
      ],
      citationIds: [
        'fda.atorvastatin.cyp3a4_inhibitors_myopathy',
        'fda.atorvastatin.clarithromycin_dose_cap'
      ],
      priority: 94
    })
  },

  {
    id: 'lipid.safety.ddi_cyp3a4_consider_rosuva',
    module: 'lipid',
    nameVi: 'Đang dùng ức chế mạnh CYP3A4 chưa có Statin: Khởi trị / Cân nhắc Rosuvastatin không qua CYP3A4',
    citationIds: [
      'fda.atorvastatin.cyp3a4_inhibitors_myopathy',
      'acc.lipid.2026.statin_doses',
      'fda.rosuvastatin.asian_dose',
      'fda.rosuvastatin.antiviral_10mg_cap',
      'fda.rosuvastatin.renal_impairment'
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
        safety.hasGemfibrozil ||
        safety.hasRosuvaAvoidMed ||
        !safety.hasStrongCyp3a4Inhibitor ||
        getActiveStatin(ctx) !== null ||
        hasLipidFlag(ctx, 'statinIntolerance') ||
        hasLipidDrugAllergy(ctx, 'rosuvastatin') ||
        isPrimaryHivCandidate(ctx)
      ) {
        return false;
      }
      return needsStatinTherapyForDdi(ctx);
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaCap5 = thFor('dose_mg', 'lipid.dose.rosuva_darolutamide_max');
      const rosuvaCap10 = thFor('dose_mg', 'lipid.dose.rosuva_antiviral_regorafenib_max');
      const rosuvaHighMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaHighMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');

      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: 'rosuvastatin' });

      if (safety.hasRosuvaCap5Med) {
        return {
          id: 'rec_lipid_ddi_cyp3a4_consider_rosuva',
          module: 'lipid',
          tier: 'Lựa chọn thay thế an toàn tương tác',
          tierOrder: 2,
          action: 'CONSIDER',
          drugId: 'rosuvastatin',
          dose: `Tối đa ${rosuvaCap5} mg 1 lần/ngày`,
          title: `Cân nhắc Rosuvastatin liều thấp (≤ ${rosuvaCap5} mg/ngày) do tương tác kép`,
          rationale: `Đang có đồng thời thuốc ức chế BCRP/OATP1B1 mạnh nên Rosuvastatin không được vượt quá ${rosuvaCap5} mg/ngày.`,
          gates: [],
          warnings,
          citationIds: ['fda.rosuvastatin.darolutamide_5mg_cap', 'acc.lipid.2026.statin_doses'],
          priority: 84
        };
      }

      if (safety.hasRosuvaCap10Med || safety.hasSevereCkd || safety.egfr === undefined) {
        const cids = ['fda.atorvastatin.cyp3a4_inhibitors_myopathy', 'acc.lipid.2026.statin_doses'];
        if (safety.hasRosuvaCap10Med) cids.push('fda.rosuvastatin.antiviral_10mg_cap');
        if (safety.hasSevereCkd) cids.push('fda.rosuvastatin.renal_impairment');
        if (isAsianPatient(ctx)) cids.push('fda.rosuvastatin.asian_dose');
        return {
          id: 'rec_lipid_ddi_cyp3a4_consider_rosuva',
          module: 'lipid',
          tier: 'Lựa chọn thay thế an toàn tương tác',
          tierOrder: 2,
          action: 'CONSIDER',
          drugId: 'rosuvastatin',
          dose: `${rosuvaStart}–${rosuvaCap10} mg 1 lần/ngày`,
          title: `Cân nhắc khởi trị Rosuvastatin liều thấp (${rosuvaStart}–${rosuvaCap10} mg/ngày, tối đa ≤ ${rosuvaCap10} mg/ngày)`,
          rationale:
            safety.hasRosuvaCap10Med
              ? `Thuốc kháng virus chứa ritonavir/cobicistat/atazanavir ức chế OATP1B1/BCRP nên giới hạn trần Rosuvastatin tối đa ≤ ${rosuvaCap10} mg/ngày (hoặc tạm hoãn hết đợt Paxlovid ngắn ngày).`
              : `Chức năng thận giảm hoặc chưa có eGFR nền: giới hạn Rosuvastatin ${rosuvaStart}–${rosuvaCap10} mg/ngày.`,
          gates: [],
          warnings,
          citationIds: cids,
          priority: 85
        };
      }

      // Clarithromycin / Erythromycin / Itraconazole trên bệnh nhân ACS hoặc nguy cơ cao/rất cao có eGFR an toàn:
      // Rosuvastatin không chuyển hóa qua CYP3A4 -> khởi trị cường độ cao (Class I trong ACS / ASCVD)
      const isCap20 = safety.hasTicagrelorOrFebuxostat;
      const doseStr = isCap20
        ? `${rosuvaHighMin} mg 1 lần/ngày`
        : `${rosuvaHighMin}–${rosuvaHighMax} mg 1 lần/ngày`;
      const shouldStartHigh = isAcuteAcsInpatient(ctx);
      const cids = [
        'fda.atorvastatin.cyp3a4_inhibitors_myopathy',
        'acc.lipid.2026.statin_doses',
        'esc.lipid.2019.statin_high_dose_rec'
      ];
      if (isAsianPatient(ctx)) cids.push('fda.rosuvastatin.asian_dose');
      if (isCap20) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');

      return {
        id: 'rec_lipid_ddi_cyp3a4_consider_rosuva',
        module: 'lipid',
        tier: shouldStartHigh
          ? 'Khởi trị Statin cường độ cao an toàn tương tác'
          : 'Lựa chọn thay thế an toàn tương tác',
        tierOrder: shouldStartHigh ? 1 : 2,
        action: shouldStartHigh ? 'START' : 'CONSIDER',
        drugId: 'rosuvastatin',
        dose: doseStr,
        title: shouldStartHigh
          ? `Khởi trị Rosuvastatin cường độ cao (${doseStr}) thay cho Atorvastatin do đang dùng kháng sinh/kháng nấm ức chế CYP3A4`
          : `Cân nhắc khởi trị Rosuvastatin (${rosuvaStart}–${rosuvaHighMin} mg/ngày) không qua CYP3A4`,
        rationale:
          `Rosuvastatin không chuyển hóa đáng kể qua CYP3A4 nên tránh được tương tác độc cơ với clarithromycin/erythromycin/itraconazole và bảo đảm hạ LDL-C tích cực kịp thời.`,
        gates: [],
        warnings,
        citationIds: cids,
        priority: shouldStartHigh ? 91 : 84
      };
    }
  }
];
