/**
 * Máy tính Dự báo Nguy cơ Tim mạch 10 năm SCORE2, SCORE2-OP & SCORE2-Diabetes
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - ESC 2021 CVD Prevention Guidelines & SCORE2 working group (Eur Heart J 2021).
 * - SCORE2: Người từ 40 - 69 tuổi không có tiền sử bệnh tim mạch xơ vữa hoặc ĐTĐ.
 * - SCORE2-OP: Người từ 70 - 89 tuổi (tính đến nguy cơ cạnh tranh của tử vong không do tim mạch).
 * - SCORE2-Diabetes (2023): Dành riêng cho bệnh nhân ĐTĐ týp 2 từ 40 tuổi trở lên.
 * - 4 vùng nguy cơ dịch tễ: Low, Moderate, High, Very High. Việt Nam mặc định chọn 'High'.
 *
 * Nguồn:
 * - SCORE2 working group. SCORE2 risk prediction algorithms: new models to estimate 10-year risk of cardiovascular disease in Europe.
 *   Eur Heart J. 2021;42(25):2439-2454. DOI: 10.1093/eurheartj/ehab309
 * - SCORE2-OP working group. SCORE2-OP risk prediction algorithms: estimating cardiovascular disease risk in older persons.
 *   Eur Heart J. 2021;42(25):2455-2467. DOI: 10.1093/eurheartj/ehab312
 * - SCORE2-Diabetes working group. SCORE2-Diabetes: 10-year cardiovascular risk estimation in type 2 diabetes in Europe.
 *   Eur Heart J. 2023;44(28):2544-2556. DOI: 10.1093/eurheartj/ehad260
 * - ESC 2025 Dyslipidaemias Focused Update, Table 3 (Cardiovascular risk categories).
 */

import type {
  Score2Input,
  Score2Result,
  Score2RiskRegion,
  Sex,
  SourceCitationInfo,
} from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'ESC / Cardiovascular Risk Collaboration',
    guideline: 'SCORE2 / SCORE2-OP / SCORE2-Diabetes algorithms',
    year: 2021,
    locator: 'Eur Heart J 2021;42:2439-2454 (Suppl S3-S4); Eur Heart J 2023;44:2544-2556; ESC 2025 Dyslipidaemias Table 3, p. 6',
    doiOrUrl: 'https://doi.org/10.1093/eurheartj/ehab309',
    notesVi: 'Mô hình hồi quy tỷ lệ rủi ro có tính đến tử vong cạnh tranh và chuẩn hóa theo 4 vùng địa lý châu Âu (nhánh SCORE2 40-69t đã đối chiếu ESC 2021 Fig. 3; nhánh SCORE2-OP & SCORE2-Diabetes giữ cờ cảnh báo do chưa có bảng hệ số mở rộng nguyên văn)',
    needsSourceVerification: true,
  } satisfies SourceCitationInfo,

  // Tham số chuẩn hóa (Centering constants)
  centering: {
    ageBase: 60.0,
    ageDivisor: 5.0,
    sbpBase: 120.0,
    sbpDivisor: 20.0,
    tcBaseMmol: 6.0,
    tcDivisorMmol: 1.0,
    hdlBaseMmol: 1.3,
    hdlDivisorMmol: 0.5,
  },

  // Hệ số Beta cho SCORE2 cơ bản (40-69 tuổi) từ Eur Heart J 2021;42:2439-2454
  score2: {
    male: {
      cage: 0.3742,
      csmoking: 0.6012,
      csbp: 0.2777,
      ctchol: 0.1458,
      chdl: -0.2698,
      diabetes: 0.6457,
      cage_csmoking: -0.0755,
      cage_csbp: -0.0255,
      cage_ctchol: -0.0281,
      cage_chdl: 0.0426,
      cage_diabetes: -0.0983,
      baselineSurvival: 0.9605,
    },
    female: {
      cage: 0.4648,
      csmoking: 0.7744,
      csbp: 0.3131,
      ctchol: 0.1002,
      chdl: -0.2606,
      diabetes: 0.8096,
      cage_csmoking: -0.1088,
      cage_csbp: -0.0277,
      cage_ctchol: -0.0226,
      cage_chdl: 0.0613,
      cage_diabetes: -0.1272,
      baselineSurvival: 0.9776,
    },
  },

  // Hệ số hiệu chuẩn vùng (Regional recalibration scales)
  scales: {
    low: {
      male: { scale1: -0.5699, scale2: 0.7476 },
      female: { scale1: -0.7380, scale2: 0.7019 },
    },
    moderate: {
      male: { scale1: -0.1565, scale2: 0.8009 },
      female: { scale1: -0.3143, scale2: 0.7701 },
    },
    high: {
      // Mặc định cho Việt Nam
      male: { scale1: 0.3207, scale2: 0.9360 },
      female: { scale1: 0.5710, scale2: 0.9369 },
    },
    very_high: {
      male: { scale1: 0.5836, scale2: 0.8294 },
      female: { scale1: 0.9412, scale2: 0.8329 },
    },
  },

  // Hiệu chỉnh SCORE2-OP (≥70 tuổi)
  score2OpAdjustment: {
    maleLinearMultiplier: 0.75, // Giảm ảnh hưởng do tử vong cạnh tranh
    femaleLinearMultiplier: 0.78,
  },

  // Quy đổi cholesterol mg/dL sang mmol/L
  cholesterolConversionFactor: 38.67,
};

/**
 * Chuyển đổi nồng độ cholesterol từ mg/dL sang mmol/L
 */
export function convertCholesterolToMmol(val: number, unit: 'mmol/L' | 'mg/dL' = 'mmol/L'): number {
  if (unit === 'mg/dL') {
    return val / COEFFICIENTS.cholesterolConversionFactor;
  }
  return val;
}

/**
 * Tính Linear Predictor không hiệu chuẩn của SCORE2
 */
export function calculateScore2LinearPredictor(
  age: number,
  sex: Sex,
  smoker: boolean,
  sbp: number,
  tcMmol: number,
  hdlMmol: number,
  hasDiabetes: boolean
): { lp: number; baselineSurvival: number } {
  const c = COEFFICIENTS.centering;
  const cage = (age - c.ageBase) / c.ageDivisor;
  const csmoking = smoker ? 1.0 : 0.0;
  const csbp = (sbp - c.sbpBase) / c.sbpDivisor;
  const ctchol = (tcMmol - c.tcBaseMmol) / c.tcDivisorMmol;
  const chdl = (hdlMmol - c.hdlBaseMmol) / c.hdlDivisorMmol;
  const cdiabetes = hasDiabetes ? 1.0 : 0.0;

  const b = sex === 'male' ? COEFFICIENTS.score2.male : COEFFICIENTS.score2.female;

  let lp =
    b.cage * cage +
    b.csmoking * csmoking +
    b.csbp * csbp +
    b.ctchol * ctchol +
    b.chdl * chdl +
    b.cage_csmoking * (cage * csmoking) +
    b.cage_csbp * (cage * csbp) +
    b.cage_ctchol * (cage * ctchol) +
    b.cage_chdl * (cage * chdl);

  if (hasDiabetes) {
    lp += b.diabetes * cdiabetes + b.cage_diabetes * (cage * cdiabetes);
  }

  // Điều chỉnh cho người già (SCORE2-OP)
  if (age >= 70) {
    const adj =
      sex === 'male'
        ? COEFFICIENTS.score2OpAdjustment.maleLinearMultiplier
        : COEFFICIENTS.score2OpAdjustment.femaleLinearMultiplier;
    lp *= adj;
  }

  return { lp, baselineSurvival: b.baselineSurvival };
}

/**
 * Phân tầng nguy cơ theo tuổi dựa trên tỷ lệ % SCORE2 tính toán (ESC 2021 & 2025)
 */
export function classifyScore2RiskCategory(
  riskPercent: number,
  age: number
): {
  category: 'low' | 'moderate' | 'high' | 'very_high';
  categoryVi: string;
  thresholds: { moderateThreshold: number; highThreshold: number; veryHighThreshold: number };
} {
  let thresholds: { moderateThreshold: number; highThreshold: number; veryHighThreshold: number };

  if (age < 50) {
    thresholds = { moderateThreshold: 2.5, highThreshold: 7.5, veryHighThreshold: 7.5 };
  } else if (age < 70) {
    thresholds = { moderateThreshold: 5.0, highThreshold: 10.0, veryHighThreshold: 10.0 };
  } else {
    thresholds = { moderateThreshold: 7.5, highThreshold: 15.0, veryHighThreshold: 15.0 };
  }

  let category: 'low' | 'moderate' | 'high' | 'very_high';
  let categoryVi: string;

  if (riskPercent < thresholds.moderateThreshold) {
    category = 'low';
    categoryVi = 'Nguy cơ thấp đến trung bình';
  } else if (riskPercent < thresholds.highThreshold) {
    category = 'high';
    categoryVi = 'Nguy cơ tim mạch cao';
  } else {
    category = 'very_high';
    categoryVi = 'Nguy cơ tim mạch rất cao';
  }

  return { category, categoryVi, thresholds };
}

/**
 * Tính toán SCORE2 / SCORE2-OP / SCORE2-Diabetes
 */
export function computeScore2(input: Score2Input): Score2Result {
  const riskRegion: Score2RiskRegion = input.riskRegion ?? 'high';
  const cholUnit = input.cholUnit ?? 'mmol/L';
  const hasDiabetes = input.hasDiabetes ?? false;

  let warning: string | undefined;

  if (input.age < 40 || input.age > 89) {
    return {
      riskPercent: null,
      modelUsed: input.age >= 70 ? 'SCORE2-OP' : 'SCORE2',
      riskRegion,
      riskCategory: 'low',
      riskCategoryVi: 'Không khả dụng',
      thresholdsForAgeGroup: { moderateThreshold: 0, highThreshold: 0, veryHighThreshold: 0 },
      interpretationVi: 'SCORE2 chỉ được hiệu chuẩn cho người từ 40 đến 89 tuổi.',
      needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
      warning: 'Tuổi bệnh nhân nằm ngoài giới hạn áp dụng của thuật toán SCORE2/SCORE2-OP (40-89 tuổi).',
    };
  }

  if (input.tc <= 0 || input.hdl <= 0 || input.sbp <= 0) {
    return {
      riskPercent: null,
      modelUsed: input.age >= 70 ? 'SCORE2-OP' : 'SCORE2',
      riskRegion,
      riskCategory: 'low',
      riskCategoryVi: 'Không khả dụng',
      thresholdsForAgeGroup: { moderateThreshold: 0, highThreshold: 0, veryHighThreshold: 0 },
      interpretationVi: 'Thiếu hoặc giá trị xét nghiệm cholesterol / huyết áp không hợp lệ.',
      needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
      warning: 'Huyết áp và các chỉ số mỡ máu phải lớn hơn 0.',
    };
  }

  const tcMmol = convertCholesterolToMmol(input.tc, cholUnit);
  const hdlMmol = convertCholesterolToMmol(input.hdl, cholUnit);

  let modelUsed: 'SCORE2' | 'SCORE2-OP' | 'SCORE2-Diabetes';
  if (hasDiabetes) {
    modelUsed = 'SCORE2-Diabetes';
    warning =
      'Nhánh SCORE2-Diabetes đang ước lượng xấp xỉ trên nền hệ số SCORE2 cơ bản do chưa có bảng hệ số phụ thuộc HbA1c/eGFR/tuổi khởi phát ĐTĐ nguyên văn trong thư viện cục bộ.';
  } else if (input.age >= 70) {
    modelUsed = 'SCORE2-OP';
    warning =
      'Nhánh SCORE2-OP (≥ 70 tuổi) đang áp dụng hệ số hiệu chỉnh tử vong cạnh tranh xấp xỉ do chưa đối chiếu trọn vẹn bảng hệ số SCORE2-OP nguyên văn.';
  } else {
    modelUsed = 'SCORE2';
  }

  const { lp, baselineSurvival } = calculateScore2LinearPredictor(
    input.age,
    input.sex,
    input.smoker,
    input.sbp,
    tcMmol,
    hdlMmol,
    hasDiabetes
  );

  // 1. Tính nguy cơ thô chưa hiệu chuẩn (Uncalibrated risk)
  const expLp = Math.exp(lp);
  const uncalRisk = 1.0 - Math.pow(baselineSurvival, expLp);
  const boundedUncalRisk = Math.min(Math.max(uncalRisk, 0.0001), 0.9999);

  // 2. Hiệu chuẩn theo vùng dịch tễ (Regional recalibration)
  const regionScales = COEFFICIENTS.scales[riskRegion][input.sex];
  const cll = Math.log(-Math.log(1.0 - boundedUncalRisk));
  const calibratedLinear = regionScales.scale1 + regionScales.scale2 * cll;
  const calRisk = 1.0 - Math.exp(-Math.exp(calibratedLinear));

  // Đổi sang % và làm tròn 1 chữ số thập phân
  const rawRiskPercent = calRisk * 100;
  const riskPercent = Math.min(Math.max(Math.round(rawRiskPercent * 10) / 10, 0.5), 99.0);

  const { category, categoryVi, thresholds } = classifyScore2RiskCategory(riskPercent, input.age);

  let interpretationVi = `Nguy cơ biến cố tim mạch gây tử vong hoặc không tử vong trong 10 năm ước tính là ${riskPercent}% (${categoryVi}) theo mô hình ${modelUsed} (vùng nguy cơ: ${riskRegion.toUpperCase()}).`;
  if (riskRegion === 'high') {
    interpretationVi += ' Việt Nam được xếp mặc định vào vùng nguy cơ tim mạch cao.';
  }

  return {
    riskPercent,
    modelUsed,
    riskRegion,
    riskCategory: category,
    riskCategoryVi: categoryVi,
    thresholdsForAgeGroup: thresholds,
    interpretationVi,
    needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
    warning,
  };
}
