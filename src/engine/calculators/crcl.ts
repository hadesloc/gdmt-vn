/**
 * Máy tính Độ thanh thải Creatinin theo Cockcroft-Gault (CrCl)
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - Công thức Cockcroft-Gault (1976): Tiêu chuẩn vàng được FDA/EMA và nhãn hầu hết các thuốc chuyển hóa qua thận (DOAC, Colchicine, Dabigatran, Digoxin...) sử dụng để phân loại và chỉnh liều.
 * - Công thức Devine (1974) tính Cân nặng Lý tưởng (IBW).
 * - Cân nặng Hiệu chỉnh (Adjusted Body Weight - ABW) với hệ số 0.4 khi bệnh nhân béo phì (BMI ≥ 30 kg/m² hoặc Cân nặng thực > 120% IBW).
 *
 * Nguồn:
 * - Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41. DOI: 10.1159/000180580
 * - Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.
 * - Winter MA, Guhr KN, Berg GM. Impact of various body weights and serum creatinine concentrations on Cockcroft-Gault clear-cut accuracy in obese patients. Pharmacotherapy. 2012;32(7):604-612.
 */

import type { CrclInput, CrclResult, SourceCitationInfo } from './types';
import { convertScrToMgDl } from './egfr';

export const COEFFICIENTS = {
  source: {
    organization: 'Nephron / Drug Intell Clin Pharm',
    guideline: 'Cockcroft-Gault (1976) & Devine IBW (1974)',
    year: 1976,
    locator: 'Nephron 1976;16:31-41 & Drug Intell Clin Pharm 1974;8:650-655',
    doiOrUrl: 'https://doi.org/10.1159/000180580',
    notesVi: 'Khuyến cáo bởi nhãn FDA/EMA cho DOAC và kháng sinh',
    needsSourceVerification: false,
  } as SourceCitationInfo,
  femaleMultiplier: 0.85,
  devineBaseMale: 50.0,
  devineBaseFemale: 45.5,
  devineHeightBaseCm: 152.4, // 5 feet
  devinePerCmSlope: 0.9055, // 2.3 kg / inch = 2.3 / 2.54 kg/cm
  obesityAbwFactor: 0.4,
  obesityBmiThreshold: 30.0,
  obesityIbwRatioThreshold: 1.2,
};

/**
 * Tính Cân nặng Lý tưởng (Ideal Body Weight - IBW) theo Devine
 */
export function calculateIbw(heightCm: number, sex: 'male' | 'female'): number {
  const baseWeight = sex === 'female' ? COEFFICIENTS.devineBaseFemale : COEFFICIENTS.devineBaseMale;
  if (heightCm <= COEFFICIENTS.devineHeightBaseCm) {
    return baseWeight;
  }
  const extraCm = heightCm - COEFFICIENTS.devineHeightBaseCm;
  const ibw = baseWeight + COEFFICIENTS.devinePerCmSlope * extraCm;
  return Math.round(ibw * 10) / 10;
}

/**
 * Tính Cân nặng Hiệu chỉnh (Adjusted Body Weight - ABW) cho bệnh nhân béo phì
 */
export function calculateAbw(actualWeightKg: number, ibw: number): number {
  const abw = ibw + COEFFICIENTS.obesityAbwFactor * (actualWeightKg - ibw);
  return Math.round(abw * 10) / 10;
}

/**
 * Tính CrCl đơn lẻ theo cân nặng chỉ định
 */
export function calculateRawCrcl(
  scrMgDl: number,
  age: number,
  weightKg: number,
  sex: 'male' | 'female'
): number {
  if (scrMgDl <= 0 || weightKg <= 0 || age <= 0) return 0;
  const femaleMult = sex === 'female' ? COEFFICIENTS.femaleMultiplier : 1.0;
  const crcl = (((140 - age) * weightKg) / (72 * scrMgDl)) * femaleMult;
  return Math.round(crcl * 10) / 10;
}

/**
 * Đánh giá CrCl tổng thể kèm phân tích thể trạng
 */
export function computeCrcl(input: CrclInput): CrclResult {
  const scrUnit = input.scrUnit ?? 'umol/L';

  if (
    input.scr <= 0 ||
    input.age <= 0 ||
    input.weight <= 0 ||
    (input.height !== undefined && input.height <= 0)
  ) {
    return {
      crclActual: null,
      crclIdeal: null,
      crclAdjusted: null,
      recommendedCrCl: null,
      weightUsedForRecommended: 'actual',
      ibw: null,
      abw: null,
      bmi: null,
      isObese: false,
      warning: 'Tất cả các thông số (tuổi, cân nặng, chiều cao, creatinin) phải lớn hơn 0.',
    };
  }

  const scrMgDl = convertScrToMgDl(input.scr, scrUnit);
  const crclActual = calculateRawCrcl(scrMgDl, input.age, input.weight, input.sex);

  // Khi không cung cấp chiều cao: trả về CrCl theo cân nặng thực tế (Cockcroft-Gault gốc) mà không tự bịa chiều cao
  if (input.height === undefined || !Number.isFinite(input.height)) {
    return {
      crclActual,
      crclIdeal: null,
      crclAdjusted: null,
      recommendedCrCl: crclActual,
      weightUsedForRecommended: 'actual',
      ibw: null,
      abw: null,
      bmi: null,
      isObese: false,
    };
  }

  const heightM = input.height / 100;
  const bmi = Math.round((input.weight / (heightM * heightM)) * 10) / 10;

  const ibw = calculateIbw(input.height, input.sex);
  const abw = calculateAbw(input.weight, ibw);

  const crclIdeal = calculateRawCrcl(scrMgDl, input.age, ibw, input.sex);
  const crclAdjusted = calculateRawCrcl(scrMgDl, input.age, abw, input.sex);

  const isObese = bmi >= COEFFICIENTS.obesityBmiThreshold || input.weight > COEFFICIENTS.obesityIbwRatioThreshold * ibw;
  const isUnderweight = input.weight < ibw;

  let recommendedCrCl: number;
  let weightUsedForRecommended: 'actual' | 'ideal' | 'adjusted';
  let warning: string | undefined;

  if (isUnderweight) {
    // Nhẹ cân hơn IBW: dùng cân nặng thực tế để không ước tính quá cao chức năng thận
    recommendedCrCl = crclActual;
    weightUsedForRecommended = 'actual';
    warning = 'Bệnh nhân có cân nặng thực nhỏ hơn cân nặng lý tưởng (IBW). Khuyến cáo dùng cân nặng thực để tránh ước tính quá cao CrCl.';
  } else if (isObese) {
    // Béo phì: Cân nặng thực tế làm phóng đại độ thanh thải. Thường khuyến cáo dùng ABW
    recommendedCrCl = crclAdjusted;
    weightUsedForRecommended = 'adjusted';
    warning = `Bệnh nhân béo phì (BMI ${bmi} kg/m² hoặc cân nặng thực vượt 120% IBW). CrCl theo cân nặng thực tế (${crclActual} mL/min) có nguy cơ ước tính quá cao chức năng thận. Khuyến cáo dùng CrCl hiệu chỉnh (ABW: ${crclAdjusted} mL/min) cho các thuốc như DOAC hoặc kiểm tra chi tiết theo nhãn từng thuốc.`;
  } else {
    // Thể trạng bình thường
    recommendedCrCl = crclActual;
    weightUsedForRecommended = 'actual';
  }

  return {
    crclActual,
    crclIdeal,
    crclAdjusted,
    recommendedCrCl,
    weightUsedForRecommended,
    ibw,
    abw,
    bmi,
    isObese,
    warning,
  };
}
