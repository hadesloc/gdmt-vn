/**
 * Máy tính eGFR (Độ lọc cầu thận ước tính)
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * 1. CKD-EPI 2021 Creatinine (Race-free): Công thức chuẩn hóa không chủng tộc được KDIGO 2024 & NKF-ASN khuyến cáo.
 * 2. CKD-EPI 2021 Creatinine–Cystatin C: Khuyến cáo xác nhận khi eGFRcr gần ngưỡng quyết định lâm sàng (45-59 mL/min/1.73m²).
 * 3. CKD-EPI 2012 Cystatin C: Cho bệnh nhân có khối cơ bất thường (cắt cụt chi, teo cơ, người tập thể hình).
 *
 * Nguồn:
 * - Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race.
 *   N Engl J Med. 2021;385(19):1737-1749. DOI: 10.1056/NEJMoa2102953
 * - KDIGO 2024 Clinical Practice Guideline for CKD, Chapter 1, Table 14, S198-S199 (PDF page 74).
 *   Đường dẫn thư viện: Medical_Library_2026/01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf
 */

import type { EgfrInput, EgfrResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'KDIGO / NKF-ASN / NEJM',
    guideline: 'KDIGO 2024 Clinical Practice Guideline for CKD',
    year: 2024,
    locator: 'Chapter 1, Table 14, p. S198-S199 (PDF page 74)',
    doiOrUrl: 'https://doi.org/10.1056/NEJMoa2102953',
    notesVi: 'CKD-EPI 2021 race-free (NEJM 2021; 385:1737-1749)',
    needsSourceVerification: false,
  } as SourceCitationInfo,
  ckdEpi2021Cr: {
    baseConstant: 142,
    female: {
      kappa: 0.7, // mg/dL
      alpha: -0.241,
      genderMultiplier: 1.012,
    },
    male: {
      kappa: 0.9, // mg/dL
      alpha: -0.302,
      genderMultiplier: 1.0,
    },
    ageExponent: 0.9938,
    scrHighExponent: -1.200,
  },
  ckdEpi2021CrCys: {
    baseConstant: 135,
    female: {
      kappa: 0.7,
      alpha: -0.219,
      genderMultiplier: 0.963,
    },
    male: {
      kappa: 0.9,
      alpha: -0.144,
      genderMultiplier: 1.0,
    },
    scrHighExponent: -0.544,
    cysLowExponent: -0.323,
    cysHighExponent: -0.778,
    cysCutoff: 0.8, // mg/L
    ageExponent: 0.9961,
  },
  ckdEpi2012Cys: {
    baseConstant: 133,
    cysCutoff: 0.8,
    cysLowExponent: -0.499,
    cysHighExponent: -1.328,
    ageExponent: 0.996,
    femaleMultiplier: 0.932,
  },
  // Chuyển đổi µmol/L sang mg/dL chuẩn quốc tế: chia cho 88.42
  crUmolConversionFactor: 88.42,
};

/**
 * Chuyển đổi Creatinin huyết thanh từ µmol/L sang mg/dL
 */
export function convertScrToMgDl(scr: number, unit: 'umol/L' | 'mg/dL' = 'umol/L'): number {
  if (unit === 'mg/dL') return scr;
  return scr / COEFFICIENTS.crUmolConversionFactor;
}

/**
 * Tính eGFR bằng CKD-EPI 2021 Creatinine (Race-free)
 */
export function calculateEgfrCr(scr: number, age: number, sex: 'male' | 'female', unit: 'umol/L' | 'mg/dL' = 'umol/L'): number | null {
  if (scr <= 0 || age < 18 || age > 120) {
    return null;
  }

  const scrMgDl = convertScrToMgDl(scr, unit);
  const cfg = sex === 'female' ? COEFFICIENTS.ckdEpi2021Cr.female : COEFFICIENTS.ckdEpi2021Cr.male;
  const ratio = scrMgDl / cfg.kappa;

  const minPart = Math.pow(Math.min(ratio, 1.0), cfg.alpha);
  const maxPart = Math.pow(Math.max(ratio, 1.0), COEFFICIENTS.ckdEpi2021Cr.scrHighExponent);
  const agePart = Math.pow(COEFFICIENTS.ckdEpi2021Cr.ageExponent, age);

  const egfr = COEFFICIENTS.ckdEpi2021Cr.baseConstant * minPart * maxPart * agePart * cfg.genderMultiplier;
  return Math.round(egfr * 10) / 10;
}

/**
 * Tính eGFR bằng CKD-EPI 2021 Creatinine–Cystatin C kết hợp
 */
export function calculateEgfrCrCys(
  scr: number,
  cystatinC: number,
  age: number,
  sex: 'male' | 'female',
  unit: 'umol/L' | 'mg/dL' = 'umol/L'
): number | null {
  if (scr <= 0 || cystatinC <= 0 || age < 18 || age > 120) {
    return null;
  }

  const scrMgDl = convertScrToMgDl(scr, unit);
  const cfg = sex === 'female' ? COEFFICIENTS.ckdEpi2021CrCys.female : COEFFICIENTS.ckdEpi2021CrCys.male;

  const scrRatio = scrMgDl / cfg.kappa;
  const cysRatio = cystatinC / COEFFICIENTS.ckdEpi2021CrCys.cysCutoff;

  const minScrPart = Math.pow(Math.min(scrRatio, 1.0), cfg.alpha);
  const maxScrPart = Math.pow(Math.max(scrRatio, 1.0), COEFFICIENTS.ckdEpi2021CrCys.scrHighExponent);

  const minCysPart = Math.pow(Math.min(cysRatio, 1.0), COEFFICIENTS.ckdEpi2021CrCys.cysLowExponent);
  const maxCysPart = Math.pow(Math.max(cysRatio, 1.0), COEFFICIENTS.ckdEpi2021CrCys.cysHighExponent);

  const agePart = Math.pow(COEFFICIENTS.ckdEpi2021CrCys.ageExponent, age);

  const egfr =
    COEFFICIENTS.ckdEpi2021CrCys.baseConstant *
    minScrPart *
    maxScrPart *
    minCysPart *
    maxCysPart *
    agePart *
    cfg.genderMultiplier;

  return Math.round(egfr * 10) / 10;
}

/**
 * Tính eGFR bằng CKD-EPI 2012 Cystatin C đơn độc
 */
export function calculateEgfrCys(cystatinC: number, age: number, sex: 'male' | 'female'): number | null {
  if (cystatinC <= 0 || age < 18 || age > 120) {
    return null;
  }

  const cysRatio = cystatinC / COEFFICIENTS.ckdEpi2012Cys.cysCutoff;
  const minPart = Math.pow(Math.min(cysRatio, 1.0), COEFFICIENTS.ckdEpi2012Cys.cysLowExponent);
  const maxPart = Math.pow(Math.max(cysRatio, 1.0), COEFFICIENTS.ckdEpi2012Cys.cysHighExponent);
  const agePart = Math.pow(COEFFICIENTS.ckdEpi2012Cys.ageExponent, age);
  const femaleMult = sex === 'female' ? COEFFICIENTS.ckdEpi2012Cys.femaleMultiplier : 1.0;

  const egfr = COEFFICIENTS.ckdEpi2012Cys.baseConstant * minPart * maxPart * agePart * femaleMult;
  return Math.round(egfr * 10) / 10;
}

/**
 * Đánh giá eGFR tổng hợp
 */
export function computeEgfr(input: EgfrInput): EgfrResult {
  const scrUnit = input.scrUnit ?? 'umol/L';
  let warning: string | undefined;

  if (input.age < 18) {
    warning = 'Công thức CKD-EPI 2021 chỉ áp dụng cho người lớn (≥ 18 tuổi). Với trẻ em, cần dùng công thức Bedside Schwartz.';
    return {
      egfrCr: null,
      egfrCrCys: null,
      egfrCys: null,
      recommendedEgfr: null,
      formula: 'CKD-EPI 2021 Creatinine',
      isRaceFree: true,
      unit: 'mL/min/1.73m²',
      warning,
    };
  }

  if (input.scr <= 0) {
    warning = 'Nồng độ Creatinin huyết thanh phải lớn hơn 0.';
    return {
      egfrCr: null,
      egfrCrCys: null,
      egfrCys: null,
      recommendedEgfr: null,
      formula: 'CKD-EPI 2021 Creatinine',
      isRaceFree: true,
      unit: 'mL/min/1.73m²',
      warning,
    };
  }

  const egfrCr = calculateEgfrCr(input.scr, input.age, input.sex, scrUnit);
  let egfrCrCys: number | null = null;
  let egfrCys: number | null = null;

  if (input.cystatinC && input.cystatinC > 0) {
    egfrCrCys = calculateEgfrCrCys(input.scr, input.cystatinC, input.age, input.sex, scrUnit);
    egfrCys = calculateEgfrCys(input.cystatinC, input.age, input.sex);
  }

  // Khuyến nghị: nếu có Cr-Cys thì ưu tiên dùng Cr-Cys theo KDIGO 2024
  const recommendedEgfr = egfrCrCys ?? egfrCr;
  const formula = egfrCrCys ? 'CKD-EPI 2021 Creatinine-Cystatin C' : 'CKD-EPI 2021 Creatinine';

  return {
    egfrCr,
    egfrCrCys,
    egfrCys,
    recommendedEgfr,
    formula,
    isRaceFree: true,
    unit: 'mL/min/1.73m²',
    warning,
  };
}
