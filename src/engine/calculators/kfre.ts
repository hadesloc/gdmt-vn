/**
 * Kidney Failure Risk Equation (KFRE) 4 biến – 2 năm và 5 năm
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - Phương trình Tangri et al. (JAMA 2016) gồm 4 biến: Tuổi, Giới tính, eGFR, và log(UACR).
 * - Được KDIGO 2024 (Practice Point 1.4.1 & Chapter 2, p. S209, PDF page 85) khuyến cáo chính thức để dự báo nguy cơ tiến triển thành suy thận cần lọc máu hoặc ghép thận.
 * - Hệ số Ngoài Bắc Mỹ (Non-North American / International recalibration) được đặt mặc định cho bệnh nhân Việt Nam để tránh ước tính quá cao nguy cơ.
 *
 * Nguồn:
 * - Tangri N, Grams ME, Levey AS, et al. Multinational Assessment of Accuracy of Equations for Predicting Risk of Kidney Failure: A Meta-analysis.
 *   JAMA. 2016;315(2):164-174. DOI: 10.1001/jama.2015.18202
 * - KDIGO 2024 Clinical Practice Guideline for CKD, Chapter 2 (PDF page 85).
 */

import type { KfreInput, KfreResult, KfreRegion, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'JAMA / KDIGO',
    guideline: 'Tangri et al. (JAMA 2016) & KDIGO 2024 Guideline',
    year: 2016,
    locator: 'JAMA. 2016;315(2):164-174 & KDIGO 2024 Chapter 2, p. S209',
    doiOrUrl: 'https://doi.org/10.1001/jama.2015.18202',
    notesVi: 'Mô hình 4 biến ngoại suy 2 năm và 5 năm; hệ số ngoài Bắc Mỹ áp dụng chuẩn cho Việt Nam',
    needsSourceVerification: false,
  } as SourceCitationInfo,
  // Trọng số hồi quy của 4 biến
  betaAge: -0.2201,
  meanAgeDividedBy10: 7.036, // Tuổi trung bình 70.36
  betaMale: 0.2467,
  meanMale: 0.5642, // Tỷ lệ nam 56.42%
  betaEgfr: -0.5567,
  meanEgfrDividedBy5: 7.222, // eGFR trung bình 36.11
  betaLnUacr: 0.4510,
  meanLnUacr: 5.137, // ln(UACR mg/g) trung bình 5.137 (UACR ~ 170 mg/g)
  // Xác suất sống còn nền (Baseline Survival S0)
  nonNorthAmerica: {
    baselineSurvival2Yr: 0.9832,
    baselineSurvival5Yr: 0.9365,
  },
  northAmerica: {
    baselineSurvival2Yr: 0.9751,
    baselineSurvival5Yr: 0.9240,
  },
  // Chuyển đổi mg/mmol sang mg/g
  uacrMgMmolToMgG: 8.84,
  // Ngưỡng chuyển khám chuyên khoa theo KDIGO
  nephrologyReferralThreshold5Yr: 3.0, // 3 - 5% trong 5 năm
  vascularAccessPlanningThreshold2Yr: 10.0, // >10% trong 2 năm
};

/**
 * Tính Linear Predictor (L) của KFRE
 */
export function calculateKfreLinearPredictor(age: number, isMale: boolean, egfr: number, uacrMgG: number): number {
  const maleVal = isMale ? 1 : 0;
  const ageTerm = COEFFICIENTS.betaAge * (age / 10 - COEFFICIENTS.meanAgeDividedBy10);
  const sexTerm = COEFFICIENTS.betaMale * (maleVal - COEFFICIENTS.meanMale);
  const egfrTerm = COEFFICIENTS.betaEgfr * (egfr / 5 - COEFFICIENTS.meanEgfrDividedBy5);
  const safeUacr = Math.max(uacrMgG, 1.0); // Tránh ln(<=0)
  const uacrTerm = COEFFICIENTS.betaLnUacr * (Math.log(safeUacr) - COEFFICIENTS.meanLnUacr);

  return ageTerm + sexTerm + egfrTerm + uacrTerm;
}

/**
 * Tính toán KFRE 4 biến cho 2 năm và 5 năm
 */
export function computeKfre(input: KfreInput): KfreResult {
  const region: KfreRegion = input.region ?? 'non_north_america';
  const uacrUnit = input.uacrUnit ?? 'mg/mmol';

  let warning: string | undefined;

  if (input.age < 18) {
    return {
      risk2Year: null,
      risk5Year: null,
      regionUsed: region,
      referralRecommended: false,
      interpretationVi: 'KFRE chỉ được kiểm định trên bệnh nhân trưởng thành (≥ 18 tuổi).',
      warning: 'Bệnh nhân dưới 18 tuổi nằm ngoài phạm vi thẩm định của KFRE.',
    };
  }

  if (input.egfr <= 0 || input.uacr <= 0) {
    return {
      risk2Year: null,
      risk5Year: null,
      regionUsed: region,
      referralRecommended: false,
      interpretationVi: 'Cần có giá trị eGFR và UACR dương hợp lệ để tính KFRE.',
      warning: 'Thiếu hoặc sai lệch chỉ số eGFR/UACR.',
    };
  }

  if (input.egfr >= 60) {
    warning = 'Lưu ý: KFRE được phát triển và kiểm định độ chính xác cao nhất ở CKD giai đoạn G3-G5 (eGFR 10 - 59 mL/min/1.73m²). Ở người có eGFR ≥ 60, nguy cơ suy thận 5 năm rất thấp và giá trị tính toán chỉ mang tính tham khảo.';
  }

  // Chuyển đổi UACR sang mg/g
  const uacrMgG = uacrUnit === 'mg/mmol' ? input.uacr * COEFFICIENTS.uacrMgMmolToMgG : input.uacr;
  const isMale = input.sex === 'male';

  const lp = calculateKfreLinearPredictor(input.age, isMale, input.egfr, uacrMgG);
  const expLp = Math.exp(lp);

  const baseline = region === 'north_america' ? COEFFICIENTS.northAmerica : COEFFICIENTS.nonNorthAmerica;

  const rawRisk2Yr = 1 - Math.pow(baseline.baselineSurvival2Yr, expLp);
  const rawRisk5Yr = 1 - Math.pow(baseline.baselineSurvival5Yr, expLp);

  // Đổi sang phần trăm (0 - 100%)
  const risk2Year = Math.min(Math.max(Math.round(rawRisk2Yr * 1000) / 10, 0.1), 99.9);
  const risk5Year = Math.min(Math.max(Math.round(rawRisk5Yr * 1000) / 10, 0.1), 99.9);

  const referralRecommended = risk5Year >= COEFFICIENTS.nephrologyReferralThreshold5Yr;

  let interpretationVi: string;
  if (risk5Year < 3.0) {
    interpretationVi = `Nguy cơ suy thận 5 năm thấp (${risk5Year}%). Quản lý và theo dõi định kỳ tại tuyến ban đầu theo KDIGO.`;
  } else if (risk5Year < 10.0) {
    interpretationVi = `Nguy cơ suy thận 5 năm tăng (${risk5Year}% ≥ 3-5%). KDIGO 2024 khuyến cáo hội chẩn hoặc chuyển chuyên khoa thận để tối ưu hóa phác đồ bảo tồn thận.`;
  } else {
    interpretationVi = `Nguy cơ suy thận rất cao (2 năm: ${risk2Year}%, 5 năm: ${risk5Year}%). Cần theo dõi chuyên khoa thận sát sao, lên kế hoạch can thiệp điều trị thay thế thận (lọc máu, ghép thận) khi phù hợp.`;
  }

  return {
    risk2Year,
    risk5Year,
    regionUsed: region,
    referralRecommended,
    interpretationVi,
    warning,
  };
}
