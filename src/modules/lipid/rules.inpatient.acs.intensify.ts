/**
 * GDMT-VN Lipid Module - Acute ACS Inpatient Prior Statin Intensification & CYP3A4 Rescue Rules
 * Phân quyền: Agent I5 (Round 3 Remediation — split from rules.inpatient.acs.ts)
 */

import type { Rule, RuleContext } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getActiveStatin,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  isAcuteAcsInpatient,
  isAsianPatient
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function canUseHighRosuvaInAcs(ctx: RuleContext): boolean {
  const safety = assessStatinSafety(ctx);
  return (
    !hasLipidDrugAllergy(ctx, 'rosuvastatin') &&
    !safety.hasRosuvaAvoidMed &&
    !safety.hasRosuvaCap5Med &&
    !safety.hasRosuvaCap10Med &&
    !safety.hasSevereCkd &&
    safety.egfr !== undefined
  );
}

export const lipidInpatientAcsIntensifyRules: Rule[] = [
  {
    id: 'lipid.inpatient.acs.prior_llt_intensify',
    module: 'lipid',
    nameVi: 'ACS nội viện đang dùng Statin chưa tối đa: Tối ưu hóa lên Statin cường độ cao',
    citationIds: [
      'esc.lipid.2025.acs_prior_llt',
      'esc.lipid.2025.acs_naive_combination',
      'acc.lipid.2026.statin_doses',
      'fda.atorvastatin.clarithromycin_dose_cap',
      'fda.rosuvastatin.asian_dose',
      'fda.rosuvastatin.renal_impairment',
      'fda.rosuvastatin.ticagrelor_limit_20mg',
      'acc.lipid.2026.simva_contra_80mg'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAcuteAcsInpatient(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (
        safety.hardBlockedForStatinInit ||
        safety.hasCyclosporine ||
        safety.hasGemfibrozil ||
        hasLipidFlag(ctx, 'statinIntolerance')
      ) {
        return false;
      }
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return false;
      if (
        activeStatin.drugId === 'simvastatin' &&
        activeStatin.doseMg !== undefined &&
        activeStatin.doseMg >= thFor('dose_mg', 'lipid.dose.simva_contra_dose')
      ) {
        return false;
      }

      const canSwitchHighRosuva = canUseHighRosuvaInAcs(ctx);
      if (
        safety.hasAntiviralOrAzoleCyp3a4 &&
        (activeStatin.drugId === 'atorvastatin' || activeStatin.drugId === 'simvastatin')
      ) {
        return false;
      }
      if (safety.hasStrongCyp3a4Inhibitor && activeStatin.drugId === 'simvastatin') {
        return canSwitchHighRosuva;
      }

      const canSwitchViolatingSimva =
        activeStatin.drugId === 'simvastatin' &&
        !hasMed(ctx, 'bempedoic_acid') &&
        (safety.hasSimvaCap10Med || safety.hasSimvaCap20Med || safety.hasTicagrelor);
      const canSwitchCypCappedAtorva =
        activeStatin.drugId === 'atorvastatin' &&
        (safety.hasClarithroOrItra || safety.hasErythromycin) &&
        canSwitchHighRosuva;

      if (activeStatin.hasDoseViolation && !canSwitchViolatingSimva && !canSwitchCypCappedAtorva) {
        return false;
      }
      return true;
    },
    produce: (ctx) => {
      const activeStatin = getActiveStatin(ctx);
      if (!activeStatin) return null;
      const safety = assessStatinSafety(ctx);
      const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
      const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
      const atorvaCypMax = thFor('dose_mg', 'lipid.dose.atorva_cyp3a4_max');
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaCkdMax = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
      const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
      const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
      const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');

      const rawMatch = findRawMedsWithComponent(ctx, activeStatin.drugId)[0];
      const unbundle = rawMatch ? buildFdcUnbundleGuidanceVi(rawMatch, STATIN_DRUG_IDS) : '';

      if (
        activeStatin.drugId === 'atorvastatin' &&
        (safety.hasClarithroOrItra || safety.hasErythromycin) &&
        canUseHighRosuvaInAcs(ctx)
      ) {
        const isTicag = safety.hasTicagrelorOrFebuxostat;
        const rDose = isTicag
          ? `${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày do dùng kèm Ticagrelor/Febuxostat)`
          : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`;
        const cids = [
          'esc.lipid.2025.acs_prior_llt',
          'acc.lipid.2026.statin_doses',
          'fda.atorvastatin.clarithromycin_dose_cap'
        ];
        if (isAsianPatient(ctx)) cids.push('fda.rosuvastatin.asian_dose');
        if (isTicag) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
        return {
          id: 'rec_lipid_inpt_acs_switch_cyp_atorva_to_rosuva',
          module: 'lipid',
          tier: 'Nội viện ACS — Chuyển đổi sang Statin cường độ cao không qua CYP3A4',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: 'rosuvastatin',
          switchFrom: activeStatin.rawDrugId,
          dose: rDose,
          title: `Chuyển đổi ngay từ ${activeStatin.displayName} sang Rosuvastatin cường độ cao (${rDose}) trong đợt nằm viện ACS`,
          rationale:
            `Đang dùng kháng sinh/kháng nấm ức chế CYP3A4 khiến Atorvastatin bị giới hạn liều ≤ ${atorvaCypMax} mg/ngày (không đạt cường độ cao cho ACS); chuyển sang Rosuvastatin không chuyển hóa qua CYP3A4 để đảm bảo bảo vệ mảng xơ vữa cường độ cao ngay tại viện.` +
            (unbundle ? ` ${unbundle}` : ''),
          gates: [],
          citationIds: dedupCitations(cids),
          priority: 95
        };
      }

      if (activeStatin.isHighIntensity || activeStatin.isAtMaxSafeDose) {
        return {
          id: 'rec_lipid_inpt_acs_continue_high_statin',
          module: 'lipid',
          tier: 'Nội viện ACS — Tối ưu phác đồ hạ lipid ngay tại viện (ESC 2025 Class I)',
          tierOrder: 1,
          action: 'CONTINUE',
          drugId: activeStatin.rawDrugId,
          title: `Tiếp tục duy trì ${activeStatin.displayName} liều tối đa dung nạp ngay trong đợt nằm viện ACS`,
          rationale:
            'Bệnh nhân nhập viện vì ACS đang dùng statin cường độ cao / liều trần an toàn; tiếp tục duy trì không gián đoạn và phối hợp thêm thuốc hạ lipid nếu LDL-C chưa đạt mục tiêu.',
          gates: [],
          citationIds: ['esc.lipid.2025.acs_prior_llt', 'esc.lipid.2025.acs_naive_combination'],
          priority: 92
        };
      }

      if (activeStatin.drugId === 'atorvastatin') {
        const capped = safety.hasClarithroOrItra || safety.hasErythromycin;
        const cids = ['esc.lipid.2025.acs_prior_llt', 'acc.lipid.2026.statin_doses'];
        if (capped) cids.push('fda.atorvastatin.clarithromycin_dose_cap');
        return {
          id: 'rec_lipid_inpt_acs_uptitrate_atorva',
          module: 'lipid',
          tier: 'Nội viện ACS — Tăng cường phác đồ hạ lipid ngay tại viện (ESC 2025 Class I)',
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          dose: capped
            ? `Atorvastatin tối đa ${atorvaCypMax} mg 1 lần/ngày`
            : `Atorvastatin ${atorvaMin}–${atorvaMax} mg 1 lần/ngày`,
          title: capped
            ? `Tối ưu ${activeStatin.displayName} tới trần an toàn (${atorvaCypMax} mg/ngày) trong đợt nằm viện ACS`
            : `Tăng liều ngay ${activeStatin.displayName} lên cường độ cao (${atorvaMin}–${atorvaMax} mg/ngày) trong thời gian nằm viện ACS`,
          rationale:
            'Theo ESC/EAS 2025 (Class I-C), bệnh nhân nhập viện vì ACS đã dùng thuốc hạ lipid trước đó cần được tối ưu hóa phác đồ ngay trong thời gian nằm viện.',
          gates: [],
          citationIds: cids,
          priority: 94
        };
      }

      if (activeStatin.drugId === 'rosuvastatin') {
        if (safety.hasSevereCkd || safety.egfr === undefined) {
          return {
            id: 'rec_lipid_inpt_acs_continue_high_statin',
            module: 'lipid',
            tier: 'Nội viện ACS — Duy trì trần an toàn thận và phối hợp thuốc',
            tierOrder: 1,
            action: 'CONTINUE',
            drugId: activeStatin.rawDrugId,
            dose: `Rosuvastatin tối đa ${rosuvaCkdMax} mg 1 lần/ngày`,
            title: `Duy trì ${activeStatin.displayName} không vượt quá ${rosuvaCkdMax} mg/ngày (trần an toàn thận) và phối hợp Ezetimibe tại viện`,
            rationale: `Ở suy thận nặng hoặc chưa xác định eGFR, không tăng Rosuvastatin vượt quá ${rosuvaCkdMax} mg/ngày; ưu tiên phối hợp Ezetimibe hoặc chuyển sang Atorvastatin nếu không vướng tương tác CYP3A4.`,
            gates: [],
            citationIds: ['esc.lipid.2025.acs_prior_llt', 'fda.rosuvastatin.renal_impairment'],
            priority: 92
          };
        }
        const cappedBcrp = safety.hasTicagrelorOrFebuxostat;
        const cids = [
          'esc.lipid.2025.acs_prior_llt',
          'acc.lipid.2026.statin_doses',
          'fda.rosuvastatin.asian_dose'
        ];
        if (cappedBcrp) cids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
        return {
          id: 'rec_lipid_inpt_acs_uptitrate_rosuva',
          module: 'lipid',
          tier: 'Nội viện ACS — Tăng cường phác đồ hạ lipid ngay tại viện (ESC 2025 Class I)',
          tierOrder: 1,
          action: 'UPTITRATE',
          drugId: activeStatin.rawDrugId,
          dose: cappedBcrp
            ? `Rosuvastatin ${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày do dùng kèm Ticagrelor/Febuxostat)`
            : `Rosuvastatin ${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`,
          title: cappedBcrp
            ? `Tăng liều ${activeStatin.displayName} lên ${rosuvaMin} mg/ngày (trần ≤ ${rosuvaTicagCap} mg/ngày do Ticagrelor) ngay tại viện`
            : `Tăng liều ngay ${activeStatin.displayName} lên cường độ cao (${rosuvaMin}–${rosuvaMax} mg/ngày) trong thời gian nằm viện ACS`,
          rationale:
            'Tối ưu hóa liều Rosuvastatin ngay trong đợt nằm viện ACS (lưu ý dược động học châu Á và giới hạn tương tác BCRP với Ticagrelor nếu có).',
          gates: [],
          citationIds: cids,
          priority: 94
        };
      }

      const mustAvoidHighAtorva =
        safety.hasStrongCyp3a4Inhibitor || hasLipidDrugAllergy(ctx, 'atorvastatin');
      const preferRosuva =
        !hasLipidDrugAllergy(ctx, 'rosuvastatin') &&
        (mustAvoidHighAtorva ||
          (!safety.hasSevereCkd &&
            safety.egfr !== undefined &&
            (safety.hasSimvaCap10Med || safety.hasSimvaCap20Med)));
      if (mustAvoidHighAtorva && !preferRosuva) return null;

      const switchTarget = preferRosuva ? 'rosuvastatin' : 'atorvastatin';
      const renalCappedRosuva = preferRosuva && (safety.hasSevereCkd || safety.egfr === undefined);
      const switchDose = preferRosuva
        ? renalCappedRosuva
          ? `${rosuvaStart}–${rosuvaCkdMax} mg 1 lần/ngày`
          : safety.hasTicagrelorOrFebuxostat
            ? `${rosuvaMin} mg 1 lần/ngày (tối đa ${rosuvaTicagCap} mg/ngày)`
            : `${rosuvaMin}–${rosuvaMax} mg 1 lần/ngày`
        : `${atorvaMin}–${atorvaMax} mg 1 lần/ngày`;
      const switchName = preferRosuva ? 'Rosuvastatin' : 'Atorvastatin';
      const simvaContra = thFor('dose_mg', 'lipid.dose.simva_contra_dose');
      const switchCids = [
        'esc.lipid.2025.acs_prior_llt',
        'acc.lipid.2026.statin_doses',
        'acc.lipid.2026.simva_contra_80mg'
      ];
      if (renalCappedRosuva) {
        switchCids.push('fda.rosuvastatin.asian_dose', 'fda.rosuvastatin.renal_impairment');
      } else if (preferRosuva && safety.hasTicagrelorOrFebuxostat) {
        switchCids.push('fda.rosuvastatin.ticagrelor_limit_20mg');
      }

      return {
        id: 'rec_lipid_inpt_acs_switch_high_statin',
        module: 'lipid',
        tier: 'Nội viện ACS — Chuyển đổi sang Statin an toàn hiệu lực cao ngay tại viện',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: switchTarget,
        switchFrom: activeStatin.rawDrugId,
        dose: switchDose,
        title: `Chuyển đổi ngay từ ${activeStatin.displayName} sang ${switchName} (${switchDose}) tại viện`,
        rationale:
          `Bệnh nhân ACS đang dùng ${activeStatin.displayName} cường độ thấp/trung bình trước nhập viện; không tăng Simvastatin lên ${simvaContra} mg/ngày mà chuyển ngay sang ${switchName} liều tối ưu an toàn trong đợt nằm viện.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [],
        citationIds: dedupCitations(switchCids),
        priority: 94
      };
    }
  }
];
