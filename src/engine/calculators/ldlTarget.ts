/**
 * Phân tầng Nguy cơ Tim mạch & Đích LDL-C theo ESC/EAS (2019 / 2025)
 * Phân quyền: Agent D / Agent I3 (Round 2 Remediation)
 *
 * Tiêu chuẩn:
 * - ESC 2025 Focused Update on Dyslipidaemias & ESC/EAS 2019 Guidelines.
 * - 5 Tầng nguy cơ tim mạch:
 *   0. Cực cao (Extreme Risk - ESC 2025 Figure 1): Bệnh đa giường mạch xơ vữa HOẶC ASCVD tái phát biến cố mạch máu trong 2 năm khi đang dùng phác đồ nền tảng statin tối đa dung nạp -> Đích LDL-C < 1.0 mmol/L (< 40 mg/dL, Class IIb) VÀ giảm ≥ 50% so với nền.
 *   1. Rất cao (Very High Risk): Đích LDL-C < 1.4 mmol/L (< 55 mg/dL) VÀ giảm ≥ 50% so với nền.
 *   2. Cao (High Risk): Đích LDL-C < 1.8 mmol/L (< 70 mg/dL) VÀ giảm ≥ 50% so với nền.
 *   3. Trung bình (Moderate Risk): Đích LDL-C < 2.6 mmol/L (< 100 mg/dL).
 *   4. Thấp (Low Risk): Đích LDL-C < 3.0 mmol/L (< 116 mg/dL).
 * - Ước lượng hiệu lực giảm LDL-C theo phác đồ điều trị hạ lipid (Statin trung bình, Statin cao, + Ezetimibe, + PCSK9i).
 *
 * Nguồn:
 * - ESC 2025 Focused Update on Dyslipidaemias, Table 3 (Cardiovascular risk categories), Table 4 & Figure 1, p. 6-8.
 *   Đường dẫn thư viện: Medical_Library_2026/01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2025_dyslipidaemias.pdf
 * - Mach F, Baigent C, Catapano AL, et al. 2019 ESC/EAS Guidelines for the management of dyslipidaemias: lipid modification to reduce cardiovascular risk.
 *   Eur Heart J. 2020;41(1):111-188, Table 5 & Table 8. DOI: 10.1093/eurheartj/ehz455
 */

import type {
  LdlTargetInput,
  LdlTargetResult,
  EscRiskTier,
  LipidTherapyType,
  SourceCitationInfo,
} from './types';
import { convertCholesterolToMmol } from './score2';

export interface ExtendedLdlTargetInput extends LdlTargetInput {
  hasPolyvascular?: boolean;
  age?: number;
  sbp?: number;
  dbp?: number;
  currentLdlMgDl?: number;
}

export const COEFFICIENTS = {
  source: {
    organization: 'ESC / EAS',
    guideline: 'ESC 2025 Focused Update on Dyslipidaemias & ESC/EAS 2019 Guidelines',
    year: 2025,
    locator: 'Table 3, Table 4 & Figure 1, p. 6-8 (ESC 2025) & Table 8, p. 138 (ESC 2019)',
    doiOrUrl: 'https://doi.org/10.1093/eurheartj/ehae884',
    notesVi: 'Đích kép LDL-C: nồng độ tuyệt đối nghiêm ngặt (< đích) và % giảm ≥ 50% so với nền ở nhóm nguy cơ cao/rất cao/cực cao',
    needsSourceVerification: false,
  } satisfies SourceCitationInfo,

  targets: {
    extreme: {
      standardLdlMmol: 1.0,
      standardLdlMgDl: 40,
      requiresFiftyPercentReduction: true,
      descVi: 'Nguy cơ cực cao (Extreme Risk - ESC 2025)',
    },
    very_high: {
      standardLdlMmol: 1.4,
      standardLdlMgDl: 55,
      recurrentAcsLdlMmol: 1.0,
      recurrentAcsLdlMgDl: 40,
      requiresFiftyPercentReduction: true,
      descVi: 'Nguy cơ rất cao (Very High Risk)',
    },
    high: {
      standardLdlMmol: 1.8,
      standardLdlMgDl: 70,
      requiresFiftyPercentReduction: true,
      descVi: 'Nguy cơ cao (High Risk)',
    },
    moderate: {
      standardLdlMmol: 2.6,
      standardLdlMgDl: 100,
      requiresFiftyPercentReduction: false,
      descVi: 'Nguy cơ trung bình (Moderate Risk)',
    },
    low: {
      standardLdlMmol: 3.0,
      standardLdlMgDl: 116,
      requiresFiftyPercentReduction: false,
      descVi: 'Nguy cơ thấp (Low Risk)',
    },
  },

  // Mức giảm LDL-C ước tính theo phác đồ (ESC/EAS 2019 Table 8 & ESC 2025)
  therapyReductions: {
    none: 0,
    moderate_intensity_statin: 30, // Atorva 10-20, Rosuva 5-10: giảm ~30%
    high_intensity_statin: 50, // Atorva 40-80, Rosuva 20-40: giảm ~50%
    high_statin_plus_ezetimibe: 65, // Statin cao + Ezetimibe 10mg: giảm ~65%
    high_statin_plus_ezetimibe_plus_pcsk9i: 85, // Statin cao + Ezetimibe + PCSK9i: giảm ~85%
  },

  cholesterolConversionFactor: 38.67,
};

/**
 * Tự động xác định tầng nguy cơ tim mạch ESC theo bệnh cảnh lâm sàng
 */
export function determineEscRiskTier(input: ExtendedLdlTargetInput): EscRiskTier {
  if (input.riskTier) return input.riskTier;

  const uacrMgMmol =
    input.uacr !== undefined && Number.isFinite(input.uacr)
      ? input.uacrUnit === 'mg/g'
        ? input.uacr / 8.84
        : input.uacr
      : undefined;

  const hasMicroOrMacroAlbuminuria = uacrMgMmol !== undefined && uacrMgMmol >= 3.0 - 1e-6;
  const hasMacroAlbuminuria = uacrMgMmol !== undefined && uacrMgMmol > 30.0;

  const hasGrade3Bp =
    (input.sbp !== undefined && input.sbp >= 180) ||
    (input.dbp !== undefined && input.dbp >= 110);

  const hasNonDmMajorRiskFactor = Boolean(
    input.hasMajorRiskFactor ||
      (input.majorRiskFactorsCount !== undefined && input.majorRiskFactorsCount >= 1) ||
      input.smoker ||
      input.hasHypertension ||
      hasGrade3Bp ||
      (input.egfr !== undefined && input.egfr < 60) ||
      hasMacroAlbuminuria ||
      (input.score2RiskPercent !== undefined && input.score2RiskPercent >= 10)
  );

  const hasOtherMajorRiskFactorForFh = Boolean(hasNonDmMajorRiskFactor || input.hasDiabetes);

  const hasObjectiveDmTod = Boolean(
    input.dmTargetOrganDamage ||
      hasMicroOrMacroAlbuminuria ||
      (input.egfr !== undefined && input.egfr < 45)
  );

  const hasSevereCkdVeryHigh = Boolean(
    (input.egfr !== undefined && input.egfr < 30) ||
      (input.egfr !== undefined && input.egfr < 45 && hasMicroOrMacroAlbuminuria) ||
      (input.egfr !== undefined && input.egfr < 60 && hasMacroAlbuminuria)
  );

  // 0. Nhóm cực cao (Extreme Risk - ESC 2025 Figure 1):
  // - Bệnh động mạch đa giường mạch (polyvascular arterial disease)
  // - Hoặc ASCVD tái phát biến cố mạch máu trong 2 năm khi ĐANG DÙNG phác đồ hạ lipid tối đa dung nạp (currentTherapy !== 'none')
  if (
    input.hasPolyvascular === true ||
    Boolean(input.hasAscvd && input.recurrentAcsWithin2Years && input.currentTherapy !== 'none')
  ) {
    return 'extreme';
  }

  // 1. Nhóm rất cao:
  // - Đã có biến cố ASCVD rõ rệt
  // - Hoặc Tăng cholesterol máu gia đình (FH) kèm ASCVD hoặc kèm ≥ 1 yếu tố nguy cơ chính khác (ESC/EAS 2019 & 2025)
  // - Hoặc ĐTĐ có tổn thương cơ quan đích (UACR ≥ 3 mg/mmol [≥ 30 mg/g], eGFR < 45, bệnh võng mạc, thần kinh), kéo dài ≥ 20 năm, hoặc ≥ 3 YTNC chính
  // - Hoặc CKD nặng (eGFR < 30, hoặc eGFR 30–44 kèm albumin niệu, hoặc eGFR 45–59 kèm macroalbumin niệu > 30 mg/mmol)
  // - Hoặc SCORE2 ≥ 20%
  if (
    input.hasAscvd ||
    (input.hasFamilialHypercholesterolemia && hasOtherMajorRiskFactorForFh) ||
    (input.hasDiabetes &&
      (hasObjectiveDmTod ||
        (input.dmDurationYears !== undefined && input.dmDurationYears >= 20) ||
        (input.majorRiskFactorsCount !== undefined && input.majorRiskFactorsCount >= 3))) ||
    hasSevereCkdVeryHigh ||
    (input.score2RiskPercent !== undefined && input.score2RiskPercent >= 20)
  ) {
    return 'very_high';
  }

  // 2. Nhóm cao:
  // - Tăng cholesterol máu gia đình (FH) không kèm yếu tố nguy cơ chính khác (ESC/EAS 2019 & 2025)
  // - Yếu tố nguy cơ đơn độc tăng rất cao: TC > 8 mmol/L (> 310 mg/dL), LDL-C > 4.9 mmol/L (> 190 mg/dL), hoặc HA ≥ 180/110 mmHg
  // - ĐTĐ không tổn thương cơ quan đích nhưng kéo dài ≥ 10 năm, hoặc ≥ 50 tuổi (T2DM không còn "trẻ tuổi"), hoặc kèm yếu tố nguy cơ khác
  // - CKD trung bình (eGFR 30 - 59) hoặc macroalbumin niệu (UACR > 30 mg/mmol)
  // - Hoặc SCORE2 10% - < 20%
  const tcMmol = input.tc !== undefined ? convertCholesterolToMmol(input.tc, input.ldlUnit) : undefined;
  const currentLdlMmol = convertCholesterolToMmol(input.currentLdl, input.ldlUnit);
  const hasSevereLdl =
    currentLdlMmol >= 4.9 || (input.currentLdlMgDl !== undefined && input.currentLdlMgDl >= 190);

  if (
    input.hasFamilialHypercholesterolemia ||
    (tcMmol !== undefined && tcMmol > 8.0) ||
    hasSevereLdl ||
    hasGrade3Bp ||
    hasMacroAlbuminuria ||
    (input.hasDiabetes &&
      (input.dmDurationYears === undefined ||
        input.dmDurationYears >= 10 ||
        hasNonDmMajorRiskFactor ||
        (input.age !== undefined && input.age >= 50))) ||
    (input.egfr !== undefined && input.egfr >= 30 && input.egfr < 60) ||
    (input.score2RiskPercent !== undefined && input.score2RiskPercent >= 10 && input.score2RiskPercent < 20)
  ) {
    return 'high';
  }

  // 3. Nhóm trung bình:
  // - Bệnh nhân trẻ tuổi mắc ĐTĐ (T1DM < 35 tuổi, T2DM < 50 tuổi) kéo dài < 10 năm KHÔNG kèm yếu tố nguy cơ khác
  // - SCORE2 2% - < 10%
  if (
    (input.hasDiabetes &&
      input.dmDurationYears !== undefined &&
      input.dmDurationYears < 10 &&
      !hasNonDmMajorRiskFactor &&
      (input.age === undefined || input.age < 50)) ||
    (input.score2RiskPercent !== undefined && input.score2RiskPercent >= 2 && input.score2RiskPercent < 10)
  ) {
    return 'moderate';
  }

  // 4. Nhóm thấp:
  if (input.score2RiskPercent !== undefined && input.score2RiskPercent < 2) {
    return 'low';
  }

  // Mặc định an toàn cho nội khoa tim mạch người lớn:
  return 'moderate';
}

/**
 * Tính toán đích LDL-C, phần trăm giảm cần thiết và ước lượng theo phác đồ
 */
export function computeLdlTarget(input: ExtendedLdlTargetInput): LdlTargetResult {
  const ldlUnit = input.ldlUnit ?? 'mmol/L';
  const currentLdlMmol = convertCholesterolToMmol(input.currentLdl, ldlUnit);
  const rawBaseline = input.baselineLdl ?? input.untreatedLdl;
  const hasExplicitBaseline = rawBaseline !== undefined && rawBaseline > 0;
  const baselineLdlMmol = hasExplicitBaseline
    ? convertCholesterolToMmol(rawBaseline, ldlUnit)
    : currentLdlMmol;

  const riskTier = determineEscRiskTier(input);
  const tierConfig = COEFFICIENTS.targets[riskTier];

  // Đích LDL-C tuyệt đối
  let targetLdlMmol = tierConfig.standardLdlMmol;
  let targetLdlMgDl = tierConfig.standardLdlMgDl;

  if (riskTier === 'very_high' && input.recurrentAcsWithin2Years && input.currentTherapy !== 'none') {
    targetLdlMmol = COEFFICIENTS.targets.very_high.recurrentAcsLdlMmol;
    targetLdlMgDl = COEFFICIENTS.targets.very_high.recurrentAcsLdlMgDl;
  }

  // Phần trăm cần giảm từ baseline (nếu tầng nguy cơ yêu cầu mục tiêu kép ≥ 50% và có baselineLdl/untreatedLdl thì cần ít nhất 50%)
  let percentReductionNeededFromBaseline: number | null = null;
  if (baselineLdlMmol > 0) {
    const rawReduction = ((baselineLdlMmol - targetLdlMmol) / baselineLdlMmol) * 100;
    const effectiveReduction =
      hasExplicitBaseline && tierConfig.requiresFiftyPercentReduction
        ? Math.max(rawReduction, 50)
        : rawReduction;
    percentReductionNeededFromBaseline = Math.max(Math.round(effectiveReduction * 10) / 10, 0);
  }

  // Phần trăm giảm đã đạt được so với nền (khi có baselineLdl / untreatedLdl)
  const rawAchievedReductionPct =
    hasExplicitBaseline && baselineLdlMmol > 0
      ? ((baselineLdlMmol - currentLdlMmol) / baselineLdlMmol) * 100
      : null;
  const achievedReductionPercent =
    rawAchievedReductionPct !== null ? Math.round(rawAchievedReductionPct * 10) / 10 : null;

  // Đánh giá phác đồ hiện tại
  const currentTherapy: LipidTherapyType = input.currentTherapy ?? 'none';
  const projectedReduction = COEFFICIENTS.therapyReductions[currentTherapy];

  const achievableLdlMmol =
    baselineLdlMmol > 0 ? Math.round(baselineLdlMmol * (1 - projectedReduction / 100) * 100) / 100 : undefined;

  // Kiểm tra mục tiêu kép nghiêm ngặt (< đích theo ESC/EAS 2019 & 2025):
  // Nếu có giá trị gốc mg/dL (từ hệ đơn vị mg/dL), so khớp trực tiếp trên mg/dL để tránh sai số làm tròn 100 mg/dL -> 2.59 mmol/L.
  const effectiveCurrentMgDl =
    input.currentLdlMgDl !== undefined
      ? input.currentLdlMgDl
      : ldlUnit === 'mg/dL'
        ? input.currentLdl
        : undefined;

  const isAbsoluteTargetAchieved =
    effectiveCurrentMgDl !== undefined
      ? effectiveCurrentMgDl < targetLdlMgDl - 1e-9
      : currentLdlMmol < targetLdlMmol - 1e-9;

  const isFiftyPercentAchieved =
    !tierConfig.requiresFiftyPercentReduction ||
    !hasExplicitBaseline ||
    (rawAchievedReductionPct !== null && rawAchievedReductionPct + 1e-9 >= 50);

  const isTargetAchieved = isAbsoluteTargetAchieved && isFiftyPercentAchieved;

  // Lời khuyên bậc thang điều trị
  const stepUpAdviceVi: string[] = [];
  if (!isTargetAchieved) {
    if (!isAbsoluteTargetAchieved) {
      stepUpAdviceVi.push(
        `Mức LDL-C hiện tại (${Math.round(currentLdlMmol * 100) / 100} mmol/L) chưa đạt đích khuyến cáo (< ${targetLdlMmol} mmol/L / < ${targetLdlMgDl} mg/dL).`
      );
    } else if (!isFiftyPercentAchieved && achievedReductionPercent !== null) {
      stepUpAdviceVi.push(
        `Mức LDL-C hiện tại (${Math.round(currentLdlMmol * 100) / 100} mmol/L) đã dưới ngưỡng tuyệt đối (< ${targetLdlMmol} mmol/L) nhưng mới giảm ${achievedReductionPercent}% so với nền (${Math.round(baselineLdlMmol * 100) / 100} mmol/L) — chưa đạt mục tiêu kép giảm ≥ 50% theo ESC/EAS.`
      );
    }

    if (tierConfig.requiresFiftyPercentReduction) {
      stepUpAdviceVi.push('Khuyến cáo bắt buộc giảm ít nhất 50% nồng độ LDL-C so với mức nền ban đầu.');
    }

    if (currentTherapy === 'none' || currentTherapy === 'moderate_intensity_statin') {
      stepUpAdviceVi.push('Bước 1: Khởi trị hoặc nâng liều lên Statin cường độ cao (Atorvastatin 40-80 mg hoặc Rosuvastatin 20-40 mg) dung nạp tối đa.');
    }
    if (currentTherapy === 'high_intensity_statin' || currentTherapy === 'moderate_intensity_statin') {
      stepUpAdviceVi.push('Bước 2: Phối hợp thêm Ezetimibe 10 mg/ngày nếu chưa đạt đích với statin liều cao.');
    }
    if (
      currentTherapy === 'high_statin_plus_ezetimibe' &&
      (riskTier === 'very_high' || riskTier === 'high' || riskTier === 'extreme')
    ) {
      stepUpAdviceVi.push('Bước 3: Cân nhắc phối hợp thêm thuốc ức chế PCSK9 (Evolocumab hoặc Alirocumab) hoặc Bempedoic acid theo ESC 2025.');
    }
  } else {
    stepUpAdviceVi.push(`Tuyệt vời: Nồng độ LDL-C hiện tại (${Math.round(currentLdlMmol * 100) / 100} mmol/L) đã đạt mục tiêu điều trị (< ${targetLdlMmol} mmol/L${tierConfig.requiresFiftyPercentReduction && hasExplicitBaseline ? ' và giảm ≥ 50% so với nền' : ''}). Duy trì phác đồ hạ lipid hiện tại và theo dõi định kỳ hàng năm.`);
  }

  return {
    riskTier,
    riskTierVi: tierConfig.descVi,
    targetLdlMmol,
    targetLdlMgDl,
    requiresFiftyPercentReduction: tierConfig.requiresFiftyPercentReduction,
    percentReductionNeededFromBaseline,
    achievedReductionPercent,
    currentTherapyProjectedReductionPercent: projectedReduction,
    achievableLdlMmol,
    isTargetAchieved,
    stepUpAdviceVi,
  };
}
