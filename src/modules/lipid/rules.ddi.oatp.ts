/**
 * GDMT-VN Lipid Module - OATP1B1 Severe DDI Rules (Gemfibrozil & Cyclosporine)
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { RuleContext, Rule } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  evaluateLdlTargetForPatient,
  findRawMedsWithComponent,
  getActiveStatin,
  hasAscvdEquivalent,
  hasIsolatedHfWithoutStatinIndication,
  hasKidneyTransplant,
  hasLipidDrugAllergy,
  hasLipidFlag,
  isAcuteAcsInpatient
} from './helpers';

export function needsStatinTherapyForDdi(ctx: RuleContext): boolean {
  const safety = assessStatinSafety(ctx);
  if (safety.hasAcutePancreatitis || safety.hasUntreatedHypo) return false;
  if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
  if (hasLipidFlag(ctx, 'onDialysis') && !hasAscvdEquivalent(ctx)) return false;
  if (isAcuteAcsInpatient(ctx) || hasKidneyTransplant(ctx)) return true;
  const target = evaluateLdlTargetForPatient(ctx);
  if (!target || target.isTargetAchieved) return false;
  return (
    target.riskTier === 'extreme' ||
    target.riskTier === 'very_high' ||
    target.riskTier === 'high'
  );
}

export const lipidOatpDdiRules: Rule[] = [
  {
    id: 'lipid.safety.ddi_gemfibrozil_stop',
    module: 'lipid',
    nameVi: 'Chống chỉ định phối hợp Gemfibrozil với Statin (ngừng Gemfibrozil)',
    citationIds: ['acc.lipid.2026.gemfibrozil_statin_contra'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasSevereAlt || safety.hasRhabdoRiskCk) return false;
      if (!safety.hasGemfibrozil) return false;
      return getActiveStatin(ctx) !== null || needsStatinTherapyForDdi(ctx);
    },
    produce: () => ({
      id: 'rec_lipid_ddi_stop_gemfibrozil',
      module: 'lipid',
      tier: 'Tương tác thuốc nghiêm trọng',
      tierOrder: 0,
      action: 'STOP',
      drugId: 'gemfibrozil',
      title: 'Ngừng Gemfibrozil: chống chỉ định phối hợp với Statin do nguy cơ tiêu cơ vân cấp',
      rationale:
        'Gemfibrozil ức chế mạnh OATP1B1 và glucuronid hóa statin làm tăng vọt nguy cơ tiêu cơ vân đe dọa tính mạng; bắt buộc ngừng Gemfibrozil (nếu cần fibrate hạ TG rất cao, chuyển sang Fenofibrate khi eGFR cho phép).',
      gates: [
        {
          parameter: 'ddi_gemfibrozil',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định phối hợp Gemfibrozil với mọi Statin'
        }
      ],
      citationIds: ['acc.lipid.2026.gemfibrozil_statin_contra'],
      priority: 99
    })
  },

  {
    id: 'lipid.safety.ddi_gemfibrozil_defer_statin',
    module: 'lipid',
    nameVi: 'Đang dùng Gemfibrozil chưa có Statin: Ngừng Gemfibrozil trước khi khởi trị Statin',
    citationIds: ['acc.lipid.2026.gemfibrozil_statin_contra'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasSevereAlt || safety.hasRhabdoRiskCk) return false;
      if (isAcuteAcsInpatient(ctx)) return false;
      if (!safety.hasGemfibrozil || getActiveStatin(ctx) !== null) return false;
      return needsStatinTherapyForDdi(ctx);
    },
    produce: () => ({
      id: 'rec_lipid_ddi_gemfibrozil_defer_statin',
      module: 'lipid',
      tier: 'Tương tác thuốc nghiêm trọng',
      tierOrder: 1,
      action: 'DEFER',
      drugId: 'atorvastatin',
      title: 'Trì hoãn khởi trị Statin cho đến khi đã ngừng hẳn Gemfibrozil',
      rationale:
        'Không khởi trị chồng Statin khi đang uống Gemfibrozil; ngừng Gemfibrozil trước rồi bắt đầu Statin cường độ phù hợp.',
      gates: [
        {
          parameter: 'ddi_gemfibrozil',
          passed: false,
          action: 'hold',
          messageVi: 'Cần ngừng Gemfibrozil trước khi bắt đầu Statin'
        }
      ],
      citationIds: ['acc.lipid.2026.gemfibrozil_statin_contra'],
      priority: 96
    })
  },

  {
    id: 'lipid.safety.ddi_cyclosporine',
    module: 'lipid',
    nameVi: 'Tương tác Cyclosporine: Ngừng Statin chống chỉ định hoặc hạ trần Rosuvastatin ≤ 5 mg',
    citationIds: [
      'fda.rosuvastatin.cyclosporine_dose_cap',
      'acc.lipid.2026.pravastatin_dose',
      'acc.lipid.2026.statin_doses',
      'fda.atorvastatin.cyclosporine_gemfibrozil_not_rec'
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
        !safety.hasCyclosporine
      ) {
        return false;
      }
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return needsStatinTherapyForDdi(ctx);
      return activeStatin.hasDoseViolation;
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_cyclosporine_max');
      const pravaMax = thFor('dose_mg', 'lipid.dose.pravastatin_ckd_max');
      const fluvaMax = thFor('dose_mg', 'lipid.dose.fluvastatin_cyclosporine_max');

      if (activeStatin?.drugId === 'rosuvastatin') {
        return {
          id: 'rec_lipid_ddi_cyclosporine_rosuva_cap',
          module: 'lipid',
          tier: 'Tương tác thuốc nghiêm trọng',
          tierOrder: 1,
          action: 'REDUCE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          dose: `Tối đa ${rosuvaMax} mg 1 lần/ngày`,
          title: `Giảm liều ${activeStatin.displayName} (Rosuvastatin ≤ ${rosuvaMax} mg/ngày) do đang dùng kèm Cyclosporine`,
          rationale: `Cyclosporine ức chế mạnh OATP1B1/BCRP làm tăng ~7 lần AUC của Rosuvastatin; liều Rosuvastatin không vượt quá ${rosuvaMax} mg/ngày.`,
          gates: [
            {
              parameter: 'ddi_cyclosporine',
              passed: false,
              action: 'reduce',
              threshold: rosuvaMax,
              messageVi: `Đang dùng Cyclosporine: giới hạn Rosuvastatin ≤ ${rosuvaMax} mg/ngày`
            }
          ],
          citationIds: ['fda.rosuvastatin.cyclosporine_dose_cap'],
          priority: 97
        };
      }

      if (activeStatin?.drugId === 'pravastatin') {
        return {
          id: 'rec_lipid_ddi_cyclosporine_prava_cap',
          module: 'lipid',
          tier: 'Tương tác thuốc nghiêm trọng',
          tierOrder: 1,
          action: 'REDUCE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          dose: `Tối đa ${pravaMax} mg 1 lần/ngày`,
          title: `Giảm liều Pravastatin ≤ ${pravaMax} mg/ngày do đang dùng kèm Cyclosporine`,
          rationale: `Khi phối hợp Cyclosporine, Pravastatin cần giới hạn liều ≤ ${pravaMax} mg/ngày và theo dõi triệu chứng cơ.`,
          gates: [
            {
              parameter: 'ddi_cyclosporine',
              passed: false,
              action: 'reduce',
              threshold: pravaMax,
              messageVi: `Đang dùng Cyclosporine: giới hạn Pravastatin ≤ ${pravaMax} mg/ngày`
            }
          ],
          citationIds: ['acc.lipid.2026.pravastatin_dose'],
          priority: 96
        };
      }

      if (activeStatin?.drugId === 'fluvastatin') {
        const fluvaSingle = thFor('dose_mg', 'lipid.dose.fluvastatin_clarithro_max');
        return {
          id: 'rec_lipid_ddi_cyclosporine_fluva_cap',
          module: 'lipid',
          tier: 'Tương tác thuốc nghiêm trọng',
          tierOrder: 1,
          action: 'REDUCE',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          dose: `Tối đa ${fluvaMax} mg/ngày`,
          title: `Giảm liều Fluvastatin ≤ ${fluvaMax} mg/ngày do đang dùng kèm Cyclosporine`,
          rationale: `Khi phối hợp Cyclosporine, Fluvastatin giới hạn tổng liều không vượt quá ${fluvaMax} mg/ngày (chia liều tối đa ${fluvaSingle} mg × 2 lần/ngày) và theo dõi triệu chứng cơ.`,
          gates: [
            {
              parameter: 'ddi_cyclosporine',
              passed: false,
              action: 'reduce',
              threshold: fluvaMax,
              messageVi: `Đang dùng Cyclosporine: giới hạn Fluvastatin ≤ ${fluvaMax} mg/ngày`
            }
          ],
          citationIds: ['acc.lipid.2026.fluvastatin_lovastatin_dosing', 'acc.lipid.2026.statin_doses'],
          priority: 96
        };
      }

      if (activeStatin) {
        let unbundle = '';
        if (activeStatin.isFdc) {
          const m = findRawMedsWithComponent(ctx, activeStatin.drugId)[0]; // qa-allow: index - FDC chua statin
          if (m) unbundle = ` ${buildFdcUnbundleGuidanceVi(m, STATIN_DRUG_IDS)}`;
        }
        return {
          id: 'rec_lipid_ddi_cyclosporine_stop_statin',
          module: 'lipid',
          tier: 'Tương tác thuốc nghiêm trọng',
          tierOrder: 0,
          action: 'STOP',
          drugId: activeStatin.rawDrugId,
          drugNameVi: activeStatin.displayName,
          title: `Ngừng ${activeStatin.displayName} do tương tác độc cơ nghiêm trọng với Cyclosporine`,
          rationale:
            `Cyclosporine chống chỉ định với Simvastatin/Lovastatin/Pitavastatin và tránh phối hợp Atorvastatin; cân nhắc chuyển sang Rosuvastatin ≤ ${rosuvaMax} mg/ngày hoặc Fluvastatin/Pravastatin liều thấp.${unbundle}`,
          gates: [
            {
              parameter: 'ddi_cyclosporine',
              passed: false,
              action: 'contra',
              messageVi: `Tránh dùng ${activeStatin.displayName} cùng Cyclosporine`
            }
          ],
          citationIds: [
            'fda.atorvastatin.cyclosporine_gemfibrozil_not_rec',
            'fda.rosuvastatin.cyclosporine_dose_cap'
          ],
          priority: 98
        };
      }

      return {
        id: 'rec_lipid_ddi_cyclosporine_avoid_atorva',
        module: 'lipid',
        tier: 'Tương tác thuốc nghiêm trọng',
        tierOrder: 1,
        action: 'AVOID',
        drugId: 'atorvastatin',
        title: 'Tránh khởi trị Atorvastatin/Simvastatin ở bệnh nhân đang dùng Cyclosporine',
        rationale: `Cyclosporine làm tăng mạnh nồng độ Atorvastatin và Simvastatin gây tiêu cơ vân; ưu tiên Rosuvastatin ≤ ${rosuvaMax} mg/ngày và/hoặc Ezetimibe.`,
        gates: [
          {
            parameter: 'ddi_cyclosporine',
            passed: false,
            action: 'contra',
            messageVi: 'Đang dùng Cyclosporine: tránh Atorvastatin/Simvastatin'
          }
        ],
        citationIds: [
          'fda.atorvastatin.cyclosporine_gemfibrozil_not_rec',
          'fda.rosuvastatin.cyclosporine_dose_cap'
        ],
        priority: 97
      };
    }
  },

  {
    id: 'lipid.safety.ddi_cyclosporine_consider_rosuva',
    module: 'lipid',
    nameVi: 'Đang dùng Cyclosporine chưa có Statin an toàn: Cân nhắc Rosuvastatin ≤ 5 mg/ngày',
    citationIds: ['fda.rosuvastatin.cyclosporine_dose_cap'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        !safety.hasCyclosporine ||
        safety.hasGemfibrozil ||
        safety.hasRosuvaAvoidMed ||
        hasLipidDrugAllergy(ctx, 'rosuvastatin')
      ) {
        return false;
      }
      const activeStatin = getActiveStatin(ctx);
      if (
        activeStatin?.drugId === 'rosuvastatin' ||
        activeStatin?.drugId === 'pravastatin' ||
        activeStatin?.drugId === 'fluvastatin'
      ) {
        return false;
      }
      return needsStatinTherapyForDdi(ctx);
    },
    produce: (ctx) => {
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_cyclosporine_max');
      const activeStatin = getActiveStatin(ctx);
      return {
        id: 'rec_lipid_ddi_cyclosporine_rosuva_alt',
        module: 'lipid',
        tier: 'Lựa chọn thay thế an toàn tương tác',
        tierOrder: 2,
        action: activeStatin ? 'SWITCH' : 'CONSIDER',
        drugId: 'rosuvastatin',
        switchFrom: activeStatin?.rawDrugId,
        dose: `Tối đa ${rosuvaMax} mg 1 lần/ngày`,
        title: `Cân nhắc Rosuvastatin liều thấp (≤ ${rosuvaMax} mg/ngày) khi đang dùng Cyclosporine`,
        rationale: `Ở bệnh nhân đang dùng Cyclosporine cần hạ LDL-C, có thể dùng thận trọng Rosuvastatin ≤ ${rosuvaMax} mg/ngày phối hợp Ezetimibe và theo dõi sát CK.`,
        gates: [],
        citationIds: ['fda.rosuvastatin.cyclosporine_dose_cap'],
        priority: 85
      };
    }
  }
];
