/**
 * GDMT-VN Lipid Module - Missing LDL, Upfront Combo & Primary Moderate/Low Rules
 * Phân quyền: Agent I5 (Round 3 Remediation — split from rules.statin.init/intensify)
 */

import type { Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  canReachTargetWithHighStatinAlone,
  evaluateLipidRiskBundle,
  formatChol,
  formatTargetLdl,
  getActiveLipidMeds,
  getActiveStatin,
  hasAcutePancreatitis,
  hasAscvdEquivalent,
  hasClinicalFh,
  hasIsolatedHfWithoutStatinIndication,
  hasKidneyTransplant,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  isAcuteAcsInpatient,
  isElevatedLpa,
  isOlderOrFrailPrimary,
  isUsIschemicHfref
} from './helpers';

export const lipidStatinPrimaryRules: Rule[] = [
  {
    id: 'lipid.missing.ldl',
    module: 'lipid',
    nameVi: 'Yêu cầu bổ sung xét nghiệm LDL-C để phân tầng đích điều trị',
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.target_very_high'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || hasAcutePancreatitis(ctx)) return false;
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      const ldl = need(ctx, 'ldl');
      return ldl === undefined && !isAcuteAcsInpatient(ctx);
    },
    produce: () =>
      missingInputRec(
        'lipid',
        'ldl',
        'phân tầng đích điều trị và lựa chọn phác đồ hạ mỡ máu (cần làm bộ mỡ máu TC, TG, HDL-C, LDL-C)',
        ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.target_very_high']
      )
  },

  {
    id: 'lipid.step1.upfront_ezetimibe_combo',
    module: 'lipid',
    nameVi: 'Bước 1b: Phối hợp sớm Ezetimibe ngay từ đầu khi khoảng cách tới đích LDL-C quá xa',
    citationIds: [
      'esc.lipid.2019.ezetimibe_add_on',
      'esc.lipid.2025.table4_ldl_3_0_column',
      'acc.lipid.2026.ezetimibe_secondary_very_high',
      'fda.ezetimibe.bile_acid_sequestrant'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.hardBlockedForStatinInit ||
        safety.ddiBlocksStandardStatinStart ||
        safety.onDialysis ||
        isOlderOrFrailPrimary(ctx) ||
        hasLipidFlag(ctx, 'limitedLifespan') ||
        hasIsolatedHfWithoutStatinIndication(ctx) ||
        (hasKidneyTransplant(ctx) && !hasAscvdEquivalent(ctx)) ||
        (isUsIschemicHfref(ctx) && !hasLipidFlag(ctx, 'recentAcs')) ||
        hasLipidDrugAllergy(ctx, 'ezetimibe')
      ) {
        return false;
      }
      if (getActiveStatin(ctx) !== null || hasMed(ctx, 'ezetimibe')) return false;

      const ldl = need(ctx, 'ldl');
      const targetInfo = evaluateLipidRiskBundle(ctx)?.targetInfo;
      if (ldl === undefined || !targetInfo) return false;
      if (targetInfo.riskTier !== 'extreme' && targetInfo.riskTier !== 'very_high') return false;

      const comboCutoff = thFor('ldl', 'lipid.combo.upfront_ldl_threshold');
      return ldl >= comboCutoff || !canReachTargetWithHighStatinAlone(ldl, targetInfo);
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const targetInfo = evaluateLipidRiskBundle(ctx)?.targetInfo;
      if (ldl === undefined || !targetInfo) return null;

      const safety = assessStatinSafety(ctx);
      const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
      const statinMaxPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high');
      const comboPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high_ezetimibe');
      const beforeH = thFor('interval_hours', 'lipid.dose.ezetimibe_sequestrant_before_h');
      const afterH = thFor('interval_hours', 'lipid.dose.ezetimibe_sequestrant_after_h');
      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);

      const warnings = buildCommonLipidWarnings(ctx);
      const cids = [
        'esc.lipid.2019.ezetimibe_add_on',
        'esc.lipid.2025.table4_ldl_3_0_column',
        'acc.lipid.2026.ezetimibe_secondary_very_high'
      ];
      if (safety.hasBileAcidSequestrant) {
        warnings.push(
          `Đang dùng nhựa gắn acid mật: uống Ezetimibe trước ≥ ${beforeH} giờ hoặc sau ≥ ${afterH} giờ.`
        );
        cids.push('fda.ezetimibe.bile_acid_sequestrant');
      }

      return {
        id: 'rec_lipid_upfront_ezetimibe_combo',
        module: 'lipid',
        tier: 'Bước 1+ — Phối hợp sớm Statin + Ezetimibe',
        tierOrder: 2,
        action: 'CONSIDER',
        drugId: 'ezetimibe',
        dose: `${ezeDose} mg 1 lần/ngày (phối hợp ngay cùng Statin cường độ cao)`,
        title: `Cân nhắc phối hợp sớm Ezetimibe ${ezeDose} mg/ngày ngay từ đầu khi đơn trị Statin khó đạt đích`,
        rationale:
          `Với LDL-C hiện tại ${ldlDisplay} và đích < ${targetDisplay} (cần giảm ~${targetInfo.percentReductionNeededFromBaseline ?? statinMaxPct}%), đơn trị statin cường độ cao (~${statinMaxPct}%) dự kiến không đủ đưa về mục tiêu; phối hợp sớm Ezetimibe ${ezeDose} mg/ngày giúp giảm ~${comboPct}% LDL-C.`,
        gates: [],
        warnings: warnings.length ? warnings : undefined,
        citationIds: cids,
        priority: 86
      };
    }
  },

  {
    id: 'lipid.step1.primary_moderate_low',
    module: 'lipid',
    nameVi: 'Dự phòng tiên phát nhóm nguy cơ trung bình / thấp (PREVENT / SCORE2 / CAC & Lp(a))',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.lipid.2019.target_moderate',
      'esc.lipid.2019.target_low',
      'acc.lipid.2026.statin_doses',
      'acc.lipid.2026.prevent_categories',
      'acc.lipid.2026.cac_100_init',
      'esc.lipid.2025.lpa_threshold_50mg',
      'acc.lipid.2026.lpa_125nmol_threshold'
    ],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (
        safety.hardBlockedForStatinInit ||
        safety.ddiBlocksStandardStatinStart ||
        hasIsolatedHfWithoutStatinIndication(ctx) ||
        (hasKidneyTransplant(ctx) && !hasAscvdEquivalent(ctx)) ||
        (hasLipidFlag(ctx, 'hiv') && !hasAscvdEquivalent(ctx) && !hasClinicalFh(ctx))
      ) {
        return false;
      }
      if (getActiveLipidMeds(ctx).length > 0) return false;
      const bundle = evaluateLipidRiskBundle(ctx);
      if (!bundle) return false;
      return bundle.targetInfo.riskTier === 'moderate' || bundle.targetInfo.riskTier === 'low';
    },
    produce: (ctx) => {
      const ldl = need(ctx, 'ldl');
      const bundle = evaluateLipidRiskBundle(ctx);
      if (ldl === undefined || !bundle) return null;
      const { targetInfo, cacScore, preventAscvd10Yr, preventCategory, calculatorWarning } = bundle;

      const atorvaModMin = thFor('dose_mg', 'lipid.dose.atorva_moderate_start');
      const atorvaModMax = thFor('dose_mg', 'lipid.dose.atorva_moderate_max');
      const rosuvaStart = thFor('dose_mg', 'lipid.dose.rosuva_asian_start');
      const rosuvaModMax = thFor('dose_mg', 'lipid.dose.rosuva_moderate_max');
      const cacInitMin = thFor('cacscore', 'lipid.cac.statin_init_min');
      const lpaThresh = thFor('lpa', 'lipid.lpa.risk_enhancing_threshold');
      const lpaNmolThresh =
        ctx.settings.profile === 'US'
          ? thFor('lpanmol', 'lipid.lpa.acc_risk_enhancing_nmol')
          : thFor('lpanmol', 'lipid.lpa.risk_enhancing_nmol');

      const useRosuva = hasLipidDrugAllergy(ctx, 'atorvastatin');
      const modDrugId = useRosuva ? 'rosuvastatin' : 'atorvastatin';
      const modDrugName = useRosuva ? 'Rosuvastatin' : 'Atorvastatin';
      const modDose = useRosuva
        ? `${rosuvaStart}–${rosuvaModMax} mg 1 lần/ngày`
        : `${atorvaModMin}–${atorvaModMax} mg 1 lần/ngày`;

      const hasHighLpa = isElevatedLpa(ctx);
      const hasModCac = cacScore !== undefined && cacScore >= cacInitMin;
      const isUsPreventInterm = ctx.settings.profile === 'US' && preventCategory === 'intermediate';
      const isUsPreventBorder = ctx.settings.profile === 'US' && preventCategory === 'borderline';

      const ldlDisplay = formatChol(ldl, ctx);
      const targetDisplay = formatTargetLdl(targetInfo, ctx);
      const warnings = buildCommonLipidWarnings(ctx, { isStatin: true, drugId: modDrugId });
      if (calculatorWarning) warnings.push(calculatorWarning);

      if (hasModCac || isUsPreventInterm) {
        const cids = ['acc.lipid.2026.statin_doses', 'esc.lipid.2019.target_moderate'];
        if (hasModCac) cids.push('acc.lipid.2026.cac_100_init');
        if (isUsPreventInterm) cids.push('acc.lipid.2026.prevent_categories');
        return {
          id: 'rec_lipid_primary_prevent_or_cac_start_statin',
          module: 'lipid',
          tier: 'Dự phòng tiên phát — Chỉ định Statin cường độ trung bình (ACC/AHA 2026 COR 1)',
          tierOrder: 1,
          action: ctx.settings.profile === 'US' || hasModCac ? 'START' : 'CONSIDER',
          drugId: modDrugId,
          dose: modDose,
          title: hasModCac
            ? `Khởi trị Statin cường độ trung bình (${modDrugName} ${modDose}) do điểm vôi hóa mạch vành CAC ≥ ${cacInitMin} AU`
            : `Khởi trị Statin cường độ trung bình (${modDrugName} ${modDose}) ở nhóm nguy cơ trung bình theo PREVENT-ASCVD`,
          rationale: hasModCac
            ? `Điểm vôi hóa mạch vành CAC = ${cacScore} AU (≥ ${cacInitMin} AU) xác nhận xơ vữa mạch vành dưới lâm sàng có ý nghĩa; khuyến cáo khởi trị ${modDrugName} (${modDose}) để giảm biến cố ASCVD.`
            : `Nguy cơ PREVENT-ASCVD 10 năm đạt ${preventAscvd10Yr}% (tầng trung bình 5% đến < 10%, LDL-C ${ldlDisplay}); ACC/AHA 2026 (COR 1) khuyến cáo khởi trị statin cường độ trung bình.`,
          gates: [],
          warnings: warnings.length ? warnings : undefined,
          citationIds: Array.from(new Set(cids)),
          priority: 82
        };
      }

      if (targetInfo.isTargetAchieved && !isUsPreventBorder) {
        return {
          id: 'rec_lipid_primary_goal_achieved',
          module: 'lipid',
          tier: 'Dự phòng tiên phát — Đã đạt mục tiêu',
          tierOrder: 4,
          action: 'MONITOR',
          title: `LDL-C đạt mục tiêu (< ${targetDisplay}) — Duy trì lối sống lành mạnh và theo dõi định kỳ`,
          rationale: `LDL-C hiện tại (${ldlDisplay}) nằm dưới ngưỡng mục tiêu < ${targetDisplay} cho nhóm nguy cơ ${
            targetInfo.riskTier === 'moderate' ? 'trung bình' : 'thấp'
          }.`,
          gates: [],
          warnings: calculatorWarning ? [calculatorWarning] : undefined,
          citationIds:
            targetInfo.riskTier === 'moderate'
              ? ['esc.lipid.2019.target_moderate']
              : ['esc.lipid.2019.target_low'],
          priority: 40
        };
      }

      const tierCid =
        targetInfo.riskTier === 'moderate'
          ? 'esc.lipid.2019.target_moderate'
          : 'esc.lipid.2019.target_low';
      const cids = [tierCid, 'acc.lipid.2026.statin_doses'];
      if (isUsPreventBorder) cids.push('acc.lipid.2026.prevent_categories');
      if (hasHighLpa) {
        if (ctx.settings.profile === 'US') {
          cids.push('acc.lipid.2026.lpa_125nmol_threshold');
        } else {
          cids.push('esc.lipid.2025.lpa_threshold_50mg');
        }
      }

      const shouldConsiderDrug = hasHighLpa || isUsPreventBorder;

      return {
        id: 'rec_lipid_primary_moderate_lifestyle_or_statin',
        module: 'lipid',
        tier: 'Dự phòng tiên phát — Tối ưu lối sống & Cân nhắc Statin',
        tierOrder: 3,
        action: shouldConsiderDrug ? 'CONSIDER' : 'MONITOR',
        drugId: shouldConsiderDrug ? modDrugId : undefined,
        dose: shouldConsiderDrug ? modDose : undefined,
        title: hasHighLpa
          ? `Cân nhắc Statin cường độ trung bình (${modDrugName} ${modDose}) do kèm Lp(a) tăng cao`
          : isUsPreventBorder
            ? `Cân nhắc Statin cường độ trung bình (${modDrugName} ${modDose}) ở nhóm nguy cơ giáp biên theo PREVENT`
            : `Tích cực thay đổi lối sống hướng tới LDL-C < ${targetDisplay} (cân nhắc Statin nếu không đạt)`,
        rationale:
          `Bệnh nhân nguy cơ ${
            targetInfo.riskTier === 'moderate' ? 'trung bình' : 'thấp'
          } có LDL-C ${ldlDisplay} (mục tiêu < ${targetDisplay}). ` +
          (hasHighLpa
            ? `Lp(a) tăng cao (ngưỡng ${lpaThresh} mg/dL / ${lpaNmolThresh} nmol/L) là yếu tố gia tăng nguy cơ xơ vữa nên ưu tiên cân nhắc sớm statin cường độ trung bình.`
            : isUsPreventBorder
              ? `Nguy cơ PREVENT-ASCVD 10 năm thuộc nhóm giáp biên (${preventAscvd10Yr}%); cân nhắc khởi trị ${modDrugName} (${modDose}) đặc biệt nếu kèm yếu tố gia tăng nguy cơ hoặc khảo sát thêm điểm CAC.`
              : `Can thiệp lối sống tích cực trước và cân nhắc ${modDrugName} ${modDose} nếu LDL-C vẫn trên ngưỡng.`),
        gates: [],
        warnings: shouldConsiderDrug && warnings.length ? warnings : calculatorWarning ? [calculatorWarning] : undefined,
        citationIds: Array.from(new Set(cids)),
        priority: shouldConsiderDrug ? 68 : 50
      };
    }
  }
];
