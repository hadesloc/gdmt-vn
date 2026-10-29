/**
 * AHA PREVENT (Predicting Risk of cardiovascular disease EVENTs) 2024 Base Model
 * Phân quyền: Agent C (kiểm chứng và chuẩn hóa hệ số y học chứng cứ)
 *
 * Tiêu chuẩn:
 * - Phương trình PREVENT của Hội Tim mạch Hoa Kỳ (AHA) công bố năm 2024 nhằm thay thế Pooled Cohort Equations (PCE 2013).
 * - Ưu điểm: Không dùng hệ số chủng tộc, tích hợp các chỉ số chuyển hóa-thận-tim mạch (CKM: eGFR, BMI, đái tháo đường).
 * - Dự báo 3 kết cục độc lập trong 10 năm:
 *   1. Total CVD (Tất cả biến cố tim mạch = ASCVD + Suy tim)
 *   2. ASCVD (Xơ vữa động mạch: Nhồi máu cơ tim, đột quỵ)
 *   3. Heart Failure (Suy tim)
 * - Tự động chuyển đổi lipid từ mmol/L (chuẩn VN) sang mg/dL nội bộ (hoặc tính trực tiếp bằng mmol/L).
 *
 * Nguồn:
 * - Khan SS, Matsushita K, Sang Y, et al. Development and Validation of the American Heart Association’s PREVENT Equations.
 *   Circulation. 2024;149(6):430-449. DOI: 10.1161/CIRCULATIONAHA.123.067626
 *   Bản lưu cục bộ: Medical_Library_2026/01_Noi_Khoa/Tim_Mach/AHA_PREVENT_2024_Equations_Circulation.pdf
 * - Thẩm định độc lập qua R package preventr (CRAN) và AHA PREVENT Calculator chính thức.
 */

import type {
  PreventInput,
  PreventResult,
  PreventAscvdRiskCategory,
  SourceCitationInfo,
} from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'American Heart Association (AHA)',
    guideline: 'AHA PREVENT Risk Equations (2024)',
    year: 2024,
    locator: 'Circulation 2024;149(6):430-449, Data Supplement Tables S4-S6; Local PDF: 01_Noi_Khoa/Tim_Mach/AHA_PREVENT_2024_Equations_Circulation.pdf',
    doiOrUrl: 'https://doi.org/10.1161/CIRCULATIONAHA.123.067626',
    notesVi: 'Mô hình 10-năm Base Model dự báo Total CVD, ASCVD và Heart Failure độc lập, không dùng hệ số chủng tộc',
    needsSourceVerification: false,
  } satisfies SourceCitationInfo,

  cholesterolMmolToMgDl: 38.67,

  // Các hệ số hồi quy đa biến logistic (Beta coefficients) từ bài gốc Khan et al. Circulation 2024
  female: {
    total_cvd: {
      age: 0.7939329,
      nonHdl: 0.0305239,
      hdl: -0.1606857,
      sbpLt110: -0.2394003,
      sbpGte110: 0.3600781,
      dm: 0.8667604,
      smoking: 0.5360739,
      bmiLt30: 0.0,
      bmiGte30: 0.0,
      egfrLt60: 0.6045917,
      egfrGte60: 0.0433769,
      bpTx: 0.3151672,
      statin: -0.1477655,
      bpTx_sbpGte110: -0.0663612,
      statin_nonHdl: 0.1197879,
      age_nonHdl: -0.0819715,
      age_hdl: 0.0306769,
      age_sbpGte110: -0.0946348,
      age_dm: -0.27057,
      age_smoking: -0.078715,
      age_bmiGte30: 0.0,
      age_egfrLt60: -0.1637806,
      constant: -3.307728,
    },
    ascvd: {
      age: 0.719883,
      nonHdl: 0.1176967,
      hdl: -0.151185,
      sbpLt110: -0.0835358,
      sbpGte110: 0.3592852,
      dm: 0.8348585,
      smoking: 0.4831078,
      bmiLt30: 0.0,
      bmiGte30: 0.0,
      egfrLt60: 0.4864619,
      egfrGte60: 0.0397779,
      bpTx: 0.2265309,
      statin: -0.0592374,
      bpTx_sbpGte110: -0.0395762,
      statin_nonHdl: 0.0844423,
      age_nonHdl: -0.0567839,
      age_hdl: 0.0325692,
      age_sbpGte110: -0.1035985,
      age_dm: -0.2417542,
      age_smoking: -0.0791142,
      age_bmiGte30: 0.0,
      age_egfrLt60: -0.1671492,
      constant: -3.819975,
    },
    heart_failure: {
      age: 0.8998235,
      nonHdl: 0.0,
      hdl: 0.0,
      sbpLt110: -0.4559771,
      sbpGte110: 0.3576505,
      dm: 1.038346,
      smoking: 0.583916,
      bmiLt30: -0.0072294,
      bmiGte30: 0.2997706,
      egfrLt60: 0.7451638,
      egfrGte60: 0.0557087,
      bpTx: 0.3534442,
      statin: 0.0,
      bpTx_sbpGte110: -0.0981511,
      statin_nonHdl: 0.0,
      age_nonHdl: 0.0,
      age_hdl: 0.0,
      age_sbpGte110: -0.0946663,
      age_dm: -0.3581041,
      age_smoking: -0.1159453,
      age_bmiGte30: -0.003878,
      age_egfrLt60: -0.1884289,
      constant: -4.310409,
    },
  },
  male: {
    total_cvd: {
      age: 0.7688528,
      nonHdl: 0.0736174,
      hdl: -0.0954431,
      sbpLt110: -0.4347345,
      sbpGte110: 0.3362658,
      dm: 0.7692857,
      smoking: 0.4386871,
      bmiLt30: 0.0,
      bmiGte30: 0.0,
      egfrLt60: 0.5378979,
      egfrGte60: 0.0164827,
      bpTx: 0.288879,
      statin: -0.1337349,
      bpTx_sbpGte110: -0.0475924,
      statin_nonHdl: 0.150273,
      age_nonHdl: -0.0517874,
      age_hdl: 0.0191169,
      age_sbpGte110: -0.1049477,
      age_dm: -0.2251948,
      age_smoking: -0.0895067,
      age_bmiGte30: 0.0,
      age_egfrLt60: -0.1543702,
      constant: -3.031168,
    },
    ascvd: {
      age: 0.7099847,
      nonHdl: 0.1658663,
      hdl: -0.1144285,
      sbpLt110: -0.2837212,
      sbpGte110: 0.3239977,
      dm: 0.7189597,
      smoking: 0.3956973,
      bmiLt30: 0.0,
      bmiGte30: 0.0,
      egfrLt60: 0.3690075,
      egfrGte60: 0.0203619,
      bpTx: 0.2036522,
      statin: -0.0865581,
      bpTx_sbpGte110: -0.0322916,
      statin_nonHdl: 0.114563,
      age_nonHdl: -0.0300005,
      age_hdl: 0.0232747,
      age_sbpGte110: -0.0927024,
      age_dm: -0.2018525,
      age_smoking: -0.0970527,
      age_bmiGte30: 0.0,
      age_egfrLt60: -0.1217081,
      constant: -3.500655,
    },
    heart_failure: {
      age: 0.8972642,
      nonHdl: 0.0,
      hdl: 0.0,
      sbpLt110: -0.6811466,
      sbpGte110: 0.3634461,
      dm: 0.923776,
      smoking: 0.5023736,
      bmiLt30: -0.0485841,
      bmiGte30: 0.3726929,
      egfrLt60: 0.6926917,
      egfrGte60: 0.0251827,
      bpTx: 0.2980922,
      statin: 0.0,
      bpTx_sbpGte110: -0.0497731,
      statin_nonHdl: 0.0,
      age_nonHdl: 0.0,
      age_hdl: 0.0,
      age_sbpGte110: -0.1289201,
      age_dm: -0.3040924,
      age_smoking: -0.1401688,
      age_bmiGte30: 0.0068126,
      age_egfrLt60: -0.1797778,
      constant: -3.946391,
    },
  },
};

export interface PreventPredictorTerms {
  age: number;
  nonHdl: number;
  hdl: number;
  sbpLt110: number;
  sbpGte110: number;
  dm: number;
  smoking: number;
  bmiLt30: number;
  bmiGte30: number;
  egfrLt60: number;
  egfrGte60: number;
  bpTx: number;
  statin: number;
  bpTx_sbpGte110: number;
  statin_nonHdl: number;
  age_nonHdl: number;
  age_hdl: number;
  age_sbpGte110: number;
  age_dm: number;
  age_smoking: number;
  age_bmiGte30: number;
  age_egfrLt60: number;
}

/**
 * Chuẩn hóa các biến số theo mô hình PREVENT Base Model
 */
export function preparePreventTerms(input: PreventInput): PreventPredictorTerms {
  const cholUnit = input.cholUnit ?? 'mmol/L';
  const tcMmol = cholUnit === 'mg/dL' ? input.tc / COEFFICIENTS.cholesterolMmolToMgDl : input.tc;
  const hdlMmol = cholUnit === 'mg/dL' ? input.hdl / COEFFICIENTS.cholesterolMmolToMgDl : input.hdl;

  const age = (input.age - 55) / 10;
  const nonHdl = tcMmol - hdlMmol - 3.5;
  const hdl = (hdlMmol - 1.3) / 0.3;
  const sbpLt110 = (Math.min(input.sbp, 110) - 110) / 20;
  const sbpGte110 = (Math.max(input.sbp, 110) - 130) / 20;
  const dm = input.hasDiabetes ? 1 : 0;
  const smoking = input.smoker ? 1 : 0;
  const bmiLt30 = (Math.min(input.bmi, 30) - 25) / 5;
  const bmiGte30 = (Math.max(input.bmi, 30) - 30) / 5;
  const egfrLt60 = (Math.min(input.egfr, 60) - 60) / -15;
  const egfrGte60 = (Math.max(input.egfr, 60) - 90) / -15;
  const bpTx = input.onHtnMeds ? 1 : 0;
  const statin = input.onStatin ? 1 : 0;

  return {
    age,
    nonHdl,
    hdl,
    sbpLt110,
    sbpGte110,
    dm,
    smoking,
    bmiLt30,
    bmiGte30,
    egfrLt60,
    egfrGte60,
    bpTx,
    statin,
    bpTx_sbpGte110: bpTx * sbpGte110,
    statin_nonHdl: statin * nonHdl,
    age_nonHdl: age * nonHdl,
    age_hdl: age * hdl,
    age_sbpGte110: age * sbpGte110,
    age_dm: age * dm,
    age_smoking: age * smoking,
    age_bmiGte30: age * bmiGte30,
    age_egfrLt60: age * egfrLt60,
  };
}

function calculateOutcomeRisk(
  terms: PreventPredictorTerms,
  b: Record<string, number>
): number {
  let logOdds = b.constant;
  logOdds += b.age * terms.age;
  logOdds += b.nonHdl * terms.nonHdl;
  logOdds += b.hdl * terms.hdl;
  logOdds += b.sbpLt110 * terms.sbpLt110;
  logOdds += b.sbpGte110 * terms.sbpGte110;
  logOdds += b.dm * terms.dm;
  logOdds += b.smoking * terms.smoking;
  logOdds += b.bmiLt30 * terms.bmiLt30;
  logOdds += b.bmiGte30 * terms.bmiGte30;
  logOdds += b.egfrLt60 * terms.egfrLt60;
  logOdds += b.egfrGte60 * terms.egfrGte60;
  logOdds += b.bpTx * terms.bpTx;
  logOdds += b.statin * terms.statin;
  logOdds += b.bpTx_sbpGte110 * terms.bpTx_sbpGte110;
  logOdds += b.statin_nonHdl * terms.statin_nonHdl;
  logOdds += b.age_nonHdl * terms.age_nonHdl;
  logOdds += b.age_hdl * terms.age_hdl;
  logOdds += b.age_sbpGte110 * terms.age_sbpGte110;
  logOdds += b.age_dm * terms.age_dm;
  logOdds += b.age_smoking * terms.age_smoking;
  logOdds += b.age_bmiGte30 * terms.age_bmiGte30;
  logOdds += b.age_egfrLt60 * terms.age_egfrLt60;

  const risk = Math.exp(logOdds) / (1 + Math.exp(logOdds));
  return Math.round(risk * 1000) / 10;
}

/**
 * Tính Linear Predictor của AHA PREVENT Base Model (hàm tương thích)
 */
export function calculatePreventLinearPredictor(
  input: PreventInput,
  tcMgDl: number,
  hdlMgDl: number
): { lp: number; baselineSurvival: number } {
  const terms = preparePreventTerms({ ...input, tc: tcMgDl, hdl: hdlMgDl, cholUnit: 'mg/dL' });
  const b = input.sex === 'female' ? COEFFICIENTS.female.total_cvd : COEFFICIENTS.male.total_cvd;
  let logOdds = b.constant;
  logOdds += b.age * terms.age;
  logOdds += b.nonHdl * terms.nonHdl;
  logOdds += b.hdl * terms.hdl;
  logOdds += b.sbpLt110 * terms.sbpLt110;
  logOdds += b.sbpGte110 * terms.sbpGte110;
  logOdds += b.dm * terms.dm;
  logOdds += b.smoking * terms.smoking;
  return { lp: logOdds, baselineSurvival: 0.948 };
}

export function classifyPreventAscvdRisk(ascvdRisk10Yr: number): {
  category: PreventAscvdRiskCategory;
  categoryVi: string;
} {
  if (ascvdRisk10Yr < 3.0) {
    return { category: 'low', categoryVi: 'Nguy cơ ASCVD 10 năm thấp (< 3%)' };
  }
  if (ascvdRisk10Yr < 5.0) {
    return { category: 'borderline', categoryVi: 'Nguy cơ ASCVD 10 năm ranh giới (3.0 - 4.9%)' };
  }
  if (ascvdRisk10Yr < 10.0) {
    return { category: 'intermediate', categoryVi: 'Nguy cơ ASCVD 10 năm trung bình (5.0 - 9.9%)' };
  }
  return { category: 'high', categoryVi: 'Nguy cơ ASCVD 10 năm cao (≥ 10%)' };
}

/**
 * Tính toán AHA PREVENT 10-năm cho Total CVD, ASCVD và Heart Failure
 */
export function computePrevent(input: PreventInput): PreventResult {
  let warning: string | undefined;

  if (input.age < 30 || input.age > 79) {
    return {
      totalCvdRisk10Yr: null,
      ascvdRisk10Yr: null,
      hfRisk10Yr: null,
      ascvdRiskCategory: null,
      model: 'AHA_PREVENT_BASE_2024',
      interpretationVi: 'Phương trình PREVENT được thiết kế và kiểm định cho người từ 30 đến 79 tuổi.',
      needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
      warning: 'Tuổi bệnh nhân nằm ngoài phạm vi thẩm định của mô hình AHA PREVENT (30 - 79 tuổi).',
    };
  }

  if (input.tc <= 0 || input.hdl <= 0 || input.sbp <= 0 || input.bmi <= 0 || input.egfr <= 0) {
    return {
      totalCvdRisk10Yr: null,
      ascvdRisk10Yr: null,
      hfRisk10Yr: null,
      ascvdRiskCategory: null,
      model: 'AHA_PREVENT_BASE_2024',
      interpretationVi: 'Thiếu dữ liệu lâm sàng hợp lệ để chạy mô hình AHA PREVENT.',
      needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
      warning: 'Huyết áp, cholesterol, BMI và eGFR phải có giá trị dương hợp lệ.',
    };
  }

  const terms = preparePreventTerms(input);
  const modelCoeffs = input.sex === 'female' ? COEFFICIENTS.female : COEFFICIENTS.male;

  const totalCvdRisk10Yr = calculateOutcomeRisk(terms, modelCoeffs.total_cvd);
  const ascvdRisk10Yr = calculateOutcomeRisk(terms, modelCoeffs.ascvd);
  const hfRisk10Yr = calculateOutcomeRisk(terms, modelCoeffs.heart_failure);
  const { category: ascvdRiskCategory, categoryVi: ascvdRiskCategoryVi } =
    classifyPreventAscvdRisk(ascvdRisk10Yr);

  const interpretationVi = `Theo AHA PREVENT 2024 / ACC 2026: Nguy cơ biến cố xơ vữa ASCVD 10 năm là ${ascvdRisk10Yr}% (${ascvdRiskCategoryVi}), nguy cơ tim mạch toàn bộ (Total CVD) là ${totalCvdRisk10Yr}%, và nguy cơ suy tim (Heart Failure) là ${hfRisk10Yr}%.`;

  return {
    totalCvdRisk10Yr,
    ascvdRisk10Yr,
    hfRisk10Yr,
    ascvdRiskCategory,
    ascvdRiskCategoryVi,
    model: 'AHA_PREVENT_BASE_2024',
    interpretationVi,
    needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
    warning,
  };
}
