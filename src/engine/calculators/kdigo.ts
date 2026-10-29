/**
 * Phân độ và Ma trận Nguy cơ KDIGO 2024 (G1-G5 × A1-A3 Heatmap)
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
 * - Phân nhóm eGFR: G1 (≥90), G2 (60-89), G3a (45-59), G3b (30-44), G4 (15-29), G5 (<15).
 * - Phân nhóm Albumin niệu (UACR): A1 (<3 mg/mmol hoặc <30 mg/g), A2 (3-30 mg/mmol hoặc 30-300 mg/g), A3 (>30 mg/mmol hoặc >300 mg/g).
 * - Màu Heatmap 4 cấp độ: Xanh lục (Thấp), Vàng (Tăng vừa), Cam (Cao), Đỏ (Rất cao).
 * - Tần suất theo dõi (số lần xét nghiệm eGFR và Albumin niệu trong 1 năm).
 *
 * Nguồn:
 * - KDIGO 2024 Guideline, Executive Summary & Nomenclature, Figure CKD nomenclature, p. S126 (PDF page 11).
 *   Đường dẫn thư viện: Medical_Library_2026/01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf
 */

import type {
  KdigoInput,
  KdigoResult,
  KdigoGStage,
  KdigoAStage,
  KdigoHeatmapColor,
  SourceCitationInfo,
} from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'KDIGO',
    guideline: 'KDIGO 2024 Clinical Practice Guideline for CKD',
    year: 2024,
    locator: 'Nomenclature & Prognosis Grid, p. S126 (PDF page 11)',
    doiOrUrl: 'https://doi.org/10.1016/j.kint.2023.10.018',
    notesVi: 'Ma trận CGA (Cause, GFR, Albuminuria) và tần suất theo dõi',
    needsSourceVerification: false,
  } as SourceCitationInfo,
  gStages: {
    G1: { min: 90, max: Infinity, descVi: 'Bình thường hoặc tăng cao' },
    G2: { min: 60, max: 89.999, descVi: 'Giảm nhẹ' },
    G3a: { min: 45, max: 59.999, descVi: 'Giảm nhẹ đến vừa' },
    G3b: { min: 30, max: 44.999, descVi: 'Giảm vừa đến nặng' },
    G4: { min: 15, max: 29.999, descVi: 'Giảm nặng' },
    G5: { min: 0, max: 14.999, descVi: 'Suy thận (Kidney failure)' },
  },
  aStagesMgMmol: {
    A1: { max: 3.0, descVi: 'Bình thường hoặc tăng nhẹ (< 3 mg/mmol)' },
    A2: { min: 3.0, max: 30.0, descVi: 'Tăng vừa (3 - 30 mg/mmol)' },
    A3: { min: 30.0, descVi: 'Tăng nặng (> 30 mg/mmol)' },
  },
  aStagesMgG: {
    A1: { max: 30.0, descVi: 'Bình thường hoặc tăng nhẹ (< 30 mg/g)' },
    A2: { min: 30.0, max: 300.0, descVi: 'Tăng vừa (30 - 300 mg/g)' },
    A3: { min: 300.0, descVi: 'Tăng nặng (> 300 mg/g)' },
  },
  uacrMgMmolToMgGConversion: 8.84,
  // Ma trận Heatmap KDIGO [G][A]
  matrix: {
    G1: {
      A1: { color: 'green' as KdigoHeatmapColor, riskVi: 'Nguy cơ thấp' as const, visits: 1 },
      A2: { color: 'yellow' as KdigoHeatmapColor, riskVi: 'Nguy cơ tăng vừa' as const, visits: 1 },
      A3: { color: 'orange' as KdigoHeatmapColor, riskVi: 'Nguy cơ cao' as const, visits: 2 },
    },
    G2: {
      A1: { color: 'green' as KdigoHeatmapColor, riskVi: 'Nguy cơ thấp' as const, visits: 1 },
      A2: { color: 'yellow' as KdigoHeatmapColor, riskVi: 'Nguy cơ tăng vừa' as const, visits: 1 },
      A3: { color: 'orange' as KdigoHeatmapColor, riskVi: 'Nguy cơ cao' as const, visits: 2 },
    },
    G3a: {
      A1: { color: 'yellow' as KdigoHeatmapColor, riskVi: 'Nguy cơ tăng vừa' as const, visits: 1 },
      A2: { color: 'orange' as KdigoHeatmapColor, riskVi: 'Nguy cơ cao' as const, visits: 2 },
      A3: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: 3 },
    },
    G3b: {
      A1: { color: 'orange' as KdigoHeatmapColor, riskVi: 'Nguy cơ cao' as const, visits: 2 },
      A2: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: 3 },
      A3: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: 3 },
    },
    G4: {
      A1: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: 3 },
      A2: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: 3 },
      A3: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: '≥ 4' },
    },
    G5: {
      A1: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: '≥ 4' },
      A2: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: '≥ 4' },
      A3: { color: 'red' as KdigoHeatmapColor, riskVi: 'Nguy cơ rất cao' as const, visits: '≥ 4' },
    },
  },
};

/**
 * Phân độ eGFR theo KDIGO (G1 đến G5)
 */
export function classifyKdigoGStage(egfr: number): KdigoGStage {
  if (egfr >= 90) return 'G1';
  if (egfr >= 60) return 'G2';
  if (egfr >= 45) return 'G3a';
  if (egfr >= 30) return 'G3b';
  if (egfr >= 15) return 'G4';
  return 'G5';
}

/**
 * Phân độ Albumin niệu theo KDIGO (A1 đến A3)
 */
export function classifyKdigoAStage(uacr: number, unit: 'mg/mmol' | 'mg/g' = 'mg/mmol'): KdigoAStage {
  if (unit === 'mg/mmol') {
    if (uacr < 3.0) return 'A1';
    if (uacr <= 30.0) return 'A2';
    return 'A3';
  } else {
    if (uacr < 30.0) return 'A1';
    if (uacr <= 300.0) return 'A2';
    return 'A3';
  }
}

/**
 * Tính toán đầy đủ phân độ và ma trận nhiệt KDIGO 2024
 */
export function computeKdigo(input: KdigoInput): KdigoResult {
  const uacrUnit = input.uacrUnit ?? 'mg/mmol';
  const gStage = classifyKdigoGStage(input.egfr);
  const aStage = classifyKdigoAStage(input.uacr, uacrUnit);

  const cell = COEFFICIENTS.matrix[gStage][aStage];
  const gDesc = COEFFICIENTS.gStages[gStage].descVi;
  const aDesc =
    uacrUnit === 'mg/mmol'
      ? COEFFICIENTS.aStagesMgMmol[aStage].descVi
      : COEFFICIENTS.aStagesMgG[aStage].descVi;

  const compositeStage = `${gStage}${aStage}`;

  let monitoringAdviceVi: string;
  if (cell.color === 'green') {
    monitoringAdviceVi = 'Theo dõi eGFR và UACR 1 lần/năm (nếu có các bằng chứng khác của bệnh thận mạn như tổn thương mô học, hình ảnh học).';
  } else if (cell.color === 'yellow') {
    monitoringAdviceVi = 'Nguy cơ tiến triển tăng vừa: theo dõi eGFR và UACR ít nhất 1 lần/năm; kiểm soát tối ưu huyết áp, đường huyết và lối sống.';
  } else if (cell.color === 'orange') {
    monitoringAdviceVi = `Nguy cơ tiến triển cao: theo dõi định kỳ ${cell.visits} lần/năm; xem xét khởi trị thuốc bảo vệ thận (SGLT2i, RASi, finerenone) nếu có chỉ định.`;
  } else {
    monitoringAdviceVi = `Nguy cơ tiến triển rất cao: theo dõi sát ${cell.visits} lần/năm; chuẩn bị kế hoạch quản lý bệnh thận mạn tiến triển, hội chẩn chuyên khoa thận.`;
  }

  return {
    gStage,
    gDescriptionVi: gDesc,
    aStage,
    aDescriptionVi: aDesc,
    compositeStage,
    heatmapColor: cell.color,
    riskTierVi: cell.riskVi,
    monitoringFrequencyPerYear: cell.visits,
    monitoringAdviceVi,
  };
}
