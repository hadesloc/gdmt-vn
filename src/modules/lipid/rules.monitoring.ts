/**
 * GDMT-VN Lipid Module - Lp(a) Screening, Friedewald Alert & Retest Monitoring Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  evaluateLdlTargetForPatient,
  evaluateSecondaryTargets,
  formatTg,
  getActiveLipidMeds,
  getActiveStatin,
  getCustomNumber,
  hasAnyLpaMeasured,
  isElevatedLpa
} from './helpers';

export const lipidMonitoringRules: Rule[] = [
  {
    id: 'lipid.lpa.lifetime_screening',
    module: 'lipid',
    nameVi: 'Tầm soát Lipoprotein(a) [Lp(a)] ít nhất một lần trong đời',
    citationIds: [
      'esc.lipid.2025.lpa_measurement_lifetime',
      'esc.lipid.2025.lpa_threshold_50mg',
      'acc.lipid.2026.lpa_screening_cor1',
      'acc.lipid.2026.lpa_125nmol_threshold'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasAcutePancreatitis) return false;
      return !hasAnyLpaMeasured(ctx);
    },
    produce: () => {
      const lpaThresh = thFor('lpa', 'lipid.lpa.risk_enhancing_threshold');
      const lpaNmolThresh = thFor('lpanmol', 'lipid.lpa.risk_enhancing_nmol');
      const lpaAccNmol = thFor('lpanmol', 'lipid.lpa.acc_risk_enhancing_nmol');
      return {
        id: 'rec_lipid_lpa_screen',
        module: 'lipid',
        tier: 'Tầm soát yếu tố gia tăng nguy cơ di truyền',
        tierOrder: 4,
        action: 'MONITOR',
        title: 'Khuyến cáo xét nghiệm Lipoprotein(a) [Lp(a)] ít nhất 1 lần trong đời',
        rationale:
          `ESC/EAS (Class IIa-C) khuyến cáo đo nồng độ Lp(a) ít nhất một lần ở mọi người trưởng thành (ưu tiên đơn vị mol nmol/L); ` +
          `mức Lp(a) > ${lpaThresh} mg/dL (> ${lpaNmolThresh} nmol/L) là yếu tố gia tăng đáng kể nguy cơ bệnh tim mạch xơ vữa và hẹp van động mạch chủ (ESC 2025 Class IIa-B).`,
        gates: [],
        profileDiff: {
          VN: 'Tại Việt Nam: ưu tiên chỉ định xét nghiệm Lp(a) ở bệnh nhân ASCVD sớm, tiền sử gia đình biến cố tim mạch sớm, FH hoặc tái phát biến cố dù đã kiểm soát LDL-C.',
          US: `ACC/AHA 2026 nâng lên khuyến cáo nhóm I (COR 1) đo Lp(a) ít nhất 1 lần ở người trưởng thành; ngưỡng gia tăng nguy cơ ≥ ${lpaAccNmol} nmol/L (≥ ${lpaThresh} mg/dL).`
        },
        citationIds: [
          'esc.lipid.2025.lpa_measurement_lifetime',
          'esc.lipid.2025.lpa_threshold_50mg',
          'acc.lipid.2026.lpa_screening_cor1',
          'acc.lipid.2026.lpa_125nmol_threshold'
        ],
        priority: 45
      };
    }
  },

  {
    id: 'lipid.lpa.elevated_reclassify',
    module: 'lipid',
    nameVi: 'Ghi nhận Lp(a) tăng cao làm gia tăng nguy cơ xơ vữa suốt đời',
    citationIds: ['esc.lipid.2025.lpa_threshold_50mg', 'acc.lipid.2026.lpa_125nmol_threshold'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasAcutePancreatitis) return false;
      return isElevatedLpa(ctx);
    },
    produce: (ctx) => {
      const lpa = need(ctx, 'lpa');
      const lpaNmol = getCustomNumber(ctx, 'lpaNmol') ?? getCustomNumber(ctx, 'lpa_nmol');
      const lpaThresh = thFor('lpa', 'lipid.lpa.risk_enhancing_threshold');
      const lpaNmolThresh = thFor('lpanmol', 'lipid.lpa.risk_enhancing_nmol');
      const lpaAccNmol = thFor('lpanmol', 'lipid.lpa.acc_risk_enhancing_nmol');
      const isUs = ctx.settings.profile === 'US';
      const valText =
        lpaNmol !== undefined
          ? isUs
            ? `${lpaNmol} nmol/L (≥ ${lpaAccNmol} nmol/L)`
            : `${lpaNmol} nmol/L (> ${lpaNmolThresh} nmol/L)`
          : isUs
            ? `${lpa} mg/dL (≥ ${lpaThresh} mg/dL)`
            : `${lpa} mg/dL (> ${lpaThresh} mg/dL)`;

      return {
        id: 'rec_lipid_lpa_elevated',
        module: 'lipid',
        tier: 'Tối ưu dự phòng trên nền Lp(a) tăng cao',
        tierOrder: 4,
        action: 'MONITOR',
        title: `Lp(a) tăng cao (${valText}) — Tối ưu hóa tích cực LDL-C và mọi yếu tố nguy cơ tim mạch`,
        rationale:
          `Lp(a) tăng cao (${valText}) do di truyền làm tăng nguy cơ nhồi máu cơ tim, đột quỵ và vôi hóa van động mạch chủ suốt đời. ` +
          `Hiện chưa có thuốc hạ Lp(a) chuyên biệt phổ biến thường quy, do đó chiến lược trọng tâm là kiểm soát chặt chẽ hơn đích LDL-C, huyết áp, đường huyết, ngừng thuốc lá và sàng lọc người thân trực hệ.`,
        gates: [],
        profileDiff: {
          US: `ACC/AHA 2026 sử dụng ngưỡng gia tăng nguy cơ Lp(a) ≥ ${lpaAccNmol} nmol/L (≥ ${lpaThresh} mg/dL) để ưu tiên khởi trị hoặc tăng cường hạ LDL-C.`
        },
        citationIds: ['esc.lipid.2025.lpa_threshold_50mg', 'acc.lipid.2026.lpa_125nmol_threshold'],
        priority: 58
      };
    }
  },

  {
    id: 'lipid.monitoring.friedewald_high_tg_warning',
    module: 'lipid',
    nameVi: 'Tăng Triglyceride > 4.5 mmol/L (> 400 mg/dL): Không dùng công thức Friedewald ước tính LDL-C',
    citationIds: [
      'esc.lipid.2019.friedewald_tg_4_5',
      'esc.lipid.2019.target_non_hdl',
      'esc.lipid.2019.target_apob'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasAcutePancreatitis) return false;
      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      return tg > thFor('tg', 'lipid.tg.friedewald_invalid');
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      if (tg === undefined) return null;
      const tgFriedewald = thFor('tg', 'lipid.tg.friedewald_invalid');
      const tgDisplay = formatTg(tg, ctx);
      return {
        id: 'rec_lipid_friedewald_invalid_high_tg',
        module: 'lipid',
        tier: 'Lưu ý diễn giải xét nghiệm Lipid máu',
        tierOrder: 4,
        action: 'MONITOR',
        title: `Triglyceride tăng cao (${tgDisplay} > ${tgFriedewald} mmol/L): Định lượng LDL-C trực tiếp, Non-HDL-C hoặc ApoB`,
        rationale:
          `Khi Triglyceride > ${tgFriedewald} mmol/L (> 400 mg/dL), công thức Friedewald không còn giá trị và thường làm ước tính LDL-C thấp giả tạo; cần dựa vào xét nghiệm định lượng LDL-C trực tiếp, Non-HDL-C hoặc ApoB để đánh giá chính xác mục tiêu điều trị.`,
        gates: [],
        citationIds: [
          'esc.lipid.2019.friedewald_tg_4_5',
          'esc.lipid.2019.target_non_hdl',
          'esc.lipid.2019.target_apob'
        ],
        priority: 52
      };
    }
  },

  {
    id: 'lipid.monitoring.retest_schedule',
    module: 'lipid',
    nameVi: 'Lịch xét nghiệm lại bộ mỡ máu và theo dõi an toàn điều trị',
    citationIds: ['esc.lipid.2019.monitoring_retest_weeks', 'esc.lipid.2019.monitoring_annual'],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasRhabdoRiskCk || safety.hasAcutePancreatitis) {
        return false;
      }
      return need(ctx, 'ldl') !== undefined;
    },
    produce: (ctx) => {
      const minW = thFor('interval_weeks', 'lipid.monitoring.weeks_min');
      const midW = thFor('interval_weeks', 'lipid.monitoring.weeks_recheck');
      const maxW = thFor('interval_weeks', 'lipid.monitoring.weeks_max');
      const targetInfo = evaluateLdlTargetForPatient(ctx);
      const activeStatin = getActiveStatin(ctx);
      const hasAnyActiveLlt = getActiveLipidMeds(ctx).length > 0;
      const statinOk = activeStatin === null || !activeStatin.hasDoseViolation;
      const secOk = !targetInfo || !evaluateSecondaryTargets(ctx, targetInfo.riskTier).hasAnyUnmet;
      const isStableAtGoal = Boolean(
        targetInfo?.isTargetAchieved &&
          secOk &&
          statinOk &&
          (hasAnyActiveLlt ||
            targetInfo?.riskTier === 'low' ||
            targetInfo?.riskTier === 'moderate')
      );

      return {
        id: 'rec_lipid_retest_schedule',
        module: 'lipid',
        tier: 'Kế hoạch theo dõi xét nghiệm & tuân thủ',
        tierOrder: 5,
        action: 'MONITOR',
        title: isStableAtGoal
          ? 'Theo dõi bộ mỡ máu định kỳ hàng năm khi đã đạt mục tiêu ổn định'
          : `Kiểm tra lại bộ mỡ máu sau ${midW} (±${minW}) tuần (từ ${minW}–${maxW} tuần) sau khởi trị hoặc chỉnh liều`,
        rationale: isStableAtGoal
          ? 'Khi phác đồ hạ lipid đã đạt mục tiêu ổn định, kiểm tra lại lipid máu định kỳ mỗi năm (hoặc dày hơn nếu nghi ngờ kém tuân thủ); chỉ đo ALT/CK khi có triệu chứng lâm sàng gợi ý.'
          : `Đánh giá đáp ứng hạ LDL-C và mức độ tuân thủ thuốc sau ${minW}–${maxW} tuần kể từ khi bắt đầu hoặc điều chỉnh liều để quyết định nâng bậc kịp thời. Xét nghiệm ALT nền trước điều trị và kiểm tra CK nếu xuất hiện đau/yếu cơ.`,
        gates: [],
        citationIds: ['esc.lipid.2019.monitoring_retest_weeks', 'esc.lipid.2019.monitoring_annual'],
        priority: 35
      };
    }
  }
];
