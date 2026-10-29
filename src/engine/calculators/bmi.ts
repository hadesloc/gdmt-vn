/**
 * Máy tính Chỉ số Khối Cơ thể (BMI), Diện tích Da (BSA) & Phân loại Châu Á - Thái Bình Dương
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - Công thức BMI = Cân nặng (kg) / [Chiều cao (m)]²
 * - Công thức Mosteller tính Diện tích Da (Body Surface Area - BSA) = √(Chiều cao [cm] × Cân nặng [kg] / 3600)
 * - Phân loại thể trạng:
 *   + Tiêu chuẩn Toàn cầu (WHO Global).
 *   + Tiêu chuẩn Châu Á - Thái Bình Dương (WHO WPRO / IDI 2000): Phù hợp nhất cho người Việt Nam với các điểm cắt:
 *     < 18.5: Thiếu cân
 *     18.5 - 22.9: Bình thường (Lý tưởng)
 *     23.0 - 24.9: Thừa cân (Tiền béo phì)
 *     25.0 - 29.9: Béo phì độ 1
 *     ≥ 30.0: Béo phì độ 2
 *
 * Nguồn:
 * - WHO Western Pacific Region. The Asia-Pacific perspective: redefining obesity and its treatment. 2000.
 * - Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317(17):1098. DOI: 10.1056/NEJM198710223171717
 */

import type { BmiInput, BmiResult, SourceCitationInfo } from './types';
import { calculateIbw } from './crcl';

export const COEFFICIENTS = {
  source: {
    organization: 'WHO WPRO / Mosteller',
    guideline: 'The Asia-Pacific perspective on obesity (2000) & Mosteller BSA (NEJM 1987)',
    year: 2000,
    locator: 'WHO WPRO 2000 & NEJM 1987;317:1098',
    doiOrUrl: 'https://doi.org/10.1056/NEJM198710223171717',
    notesVi: 'Tiêu chuẩn BMI dành riêng cho người Châu Á với điểm cắt thừa cân 23 và béo phì 25 kg/m²',
    needsSourceVerification: false,
  } as SourceCitationInfo,

  asiaPacific: {
    underweightMax: 18.5,
    normalMax: 23.0,
    overweightMax: 25.0,
    obese1Max: 30.0,
  },
  whoGlobal: {
    underweightMax: 18.5,
    normalMax: 25.0,
    overweightMax: 30.0,
    obese1Max: 35.0,
  },
};

/**
 * Tính toán BMI, BSA và phân loại thể trạng cho người Việt Nam
 */
export function computeBmi(input: BmiInput): BmiResult {
  const { weight, height } = input;
  if (weight <= 0 || height <= 0) {
    return {
      bmi: 0,
      bsa: 0,
      whoCategoryVi: 'Không hợp lệ',
      asiaPacificCategoryVi: 'Không hợp lệ',
      asiaPacificClassification: 'normal',
      idealWeightRangeDevine: [0, 0],
    };
  }

  const heightM = height / 100;
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
  const bsa = Math.round(Math.sqrt((height * weight) / 3600) * 100) / 100;

  // 1. Phân loại theo Châu Á - Thái Bình Dương
  let asiaCatVi: string;
  let asiaClass: BmiResult['asiaPacificClassification'];

  if (bmi < COEFFICIENTS.asiaPacific.underweightMax) {
    asiaCatVi = 'Thiếu cân (Gầy: BMI < 18.5 kg/m²)';
    asiaClass = 'underweight';
  } else if (bmi < COEFFICIENTS.asiaPacific.normalMax) {
    asiaCatVi = 'Bình thường (Thể trạng tối ưu người Châu Á: 18.5 - 22.9 kg/m²)';
    asiaClass = 'normal';
  } else if (bmi < COEFFICIENTS.asiaPacific.overweightMax) {
    asiaCatVi = 'Thừa cân / Tiền béo phì (23.0 - 24.9 kg/m²)';
    asiaClass = 'overweight';
  } else if (bmi < COEFFICIENTS.asiaPacific.obese1Max) {
    asiaCatVi = 'Béo phì Độ 1 (25.0 - 29.9 kg/m²)';
    asiaClass = 'obese_1';
  } else {
    asiaCatVi = 'Béo phì Độ 2 (Nặng: ≥ 30.0 kg/m²)';
    asiaClass = 'obese_2';
  }

  // 2. Phân loại theo WHO Toàn cầu
  let whoCatVi: string;
  if (bmi < COEFFICIENTS.whoGlobal.underweightMax) {
    whoCatVi = 'Underweight (< 18.5)';
  } else if (bmi < COEFFICIENTS.whoGlobal.normalMax) {
    whoCatVi = 'Normal weight (18.5 - 24.9)';
  } else if (bmi < COEFFICIENTS.whoGlobal.overweightMax) {
    whoCatVi = 'Overweight (25.0 - 29.9)';
  } else if (bmi < COEFFICIENTS.whoGlobal.obese1Max) {
    whoCatVi = 'Obesity Class I (30.0 - 34.9)';
  } else {
    whoCatVi = 'Obesity Class II/III (≥ 35.0)';
  }

  // Cân nặng lý tưởng theo Devine (Nữ, Nam)
  const ibwFemale = calculateIbw(height, 'female');
  const ibwMale = calculateIbw(height, 'male');

  return {
    bmi,
    bsa,
    whoCategoryVi: whoCatVi,
    asiaPacificCategoryVi: asiaCatVi,
    asiaPacificClassification: asiaClass,
    idealWeightRangeDevine: [ibwFemale, ibwMale],
  };
}
