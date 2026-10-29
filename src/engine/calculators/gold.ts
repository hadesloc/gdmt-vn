/**
 * Phân độ và Phân nhóm GOLD 2026 cho Bệnh Phổi Tắc Nghẽn Mạn Tính (COPD)
 * Phân quyền: Agent C / D
 *
 * Tiêu chuẩn (GOLD 2026 Report & Bộ Y tế QĐ 2131/QĐ-BYT 2026):
 * - Tiêu chuẩn chẩn đoán bắt buộc: Tắc nghẽn luồng khí cố định sau test giãn phế quản (FEV1/FVC < 0.70).
 *   Nếu FEV1/FVC ≥ 0.70 -> xử lý Fail-closed (không gán độ GOLD 1–4 hay nhóm ABE).
 * - Phân độ tắc nghẽn thông khí theo GOLD (khi đã xác nhận COPD):
 *   GOLD 1 (Nhẹ): FEV1 ≥ 80% dự đoán
 *   GOLD 2 (Trung bình): 50% ≤ FEV1 < 80% dự đoán
 *   GOLD 3 (Nặng): 30% ≤ FEV1 < 50% dự đoán
 *   GOLD 4 (Rất nặng): FEV1 < 30% dự đoán
 * - Phân nhóm ABE theo GOLD 2026 (Figure 2.10):
 *   Nhóm E: Có ≥ 1 đợt cấp mức độ trung bình hoặc nặng (nhập viện) trong 12 tháng qua.
 *   Nhóm B: 0 đợt cấp trung bình/nặng VÀ nhiều triệu chứng (mMRC ≥ 2 HOẶC CAT ≥ 10).
 *   Nhóm A: 0 đợt cấp trung bình/nặng VÀ ít triệu chứng (mMRC 0–1 VÀ CAT < 10).
 *
 * Nguồn:
 * - Global Initiative for Chronic Obstructive Lung Disease (GOLD) 2026 Report, Chapter 2 (Figure 2.10, p. 54).
 * - Bộ Y tế Quyết định 2131/QĐ-BYT 2026, Bảng 1.4 (tr. 18).
 */

import type { GoldInput, GoldResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'GOLD',
    guideline: 'Global Strategy for Prevention, Diagnosis and Management of COPD (2026 Report)',
    year: 2026,
    locator: 'Chapter 2, Spirometric Classification & Figure 2.10 (ABE Assessment Tool, PDF p. 54)',
    doiOrUrl: 'https://goldcopd.org',
    notesVi: 'GOLD 2026: Chỉ cần ≥ 1 đợt cấp trung bình hoặc nặng trong năm qua đã xếp vào Nhóm E; mMRC ≥ 2 hoặc CAT ≥ 10 xếp Nhóm B.',
    needsSourceVerification: false,
  } as SourceCitationInfo,

  fev1FvcDiagnosticCutoff: 0.7,
  spirometryCutoffs: {
    gold1: 80,
    gold2: 50,
    gold3: 30,
  },
  symptomCutoffs: {
    mmrcHigh: 2, // mMRC >= 2 là nhiều triệu chứng
    catHigh: 10, // CAT >= 10 là nhiều triệu chứng
  },
  exacerbationThresholds: {
    hospitalizationThreshold: 1, // >= 1 đợt cấp nặng / nhập viện -> Nhóm E
    moderateExacerbationsThreshold: 1, // GOLD 2026: >= 1 đợt cấp trung bình -> Nhóm E
    legacyGold2023ModerateThreshold: 2, // Tùy chọn tương thích cũ nếu truyền guidelineVersion === 'GOLD_2023'
  },
};

/**
 * Phân độ tắc nghẽn thông khí theo FEV1 % dự đoán
 */
export function classifyGoldGrade(fev1PredPct: number): {
  grade: 'GOLD 1' | 'GOLD 2' | 'GOLD 3' | 'GOLD 4';
  gradeSeverityVi: string;
} {
  if (fev1PredPct >= COEFFICIENTS.spirometryCutoffs.gold1) {
    return { grade: 'GOLD 1', gradeSeverityVi: 'Tắc nghẽn nhẹ (FEV1 ≥ 80% dự đoán)' };
  }
  if (fev1PredPct >= COEFFICIENTS.spirometryCutoffs.gold2) {
    return { grade: 'GOLD 2', gradeSeverityVi: 'Tắc nghẽn trung bình (50% ≤ FEV1 < 80% dự đoán)' };
  }
  if (fev1PredPct >= COEFFICIENTS.spirometryCutoffs.gold3) {
    return { grade: 'GOLD 3', gradeSeverityVi: 'Tắc nghẽn nặng (30% ≤ FEV1 < 50% dự đoán)' };
  }
  return { grade: 'GOLD 4', gradeSeverityVi: 'Tắc nghẽn rất nặng (FEV1 < 30% dự đoán)' };
}

/**
 * Đánh giá phân nhóm ABE và phân độ GOLD 2026 (tuân thủ nghiêm ngặt nguyên tắc Fail-closed)
 */
export function computeGold(input: GoldInput): GoldResult {
  // 1. Kiểm tra tính hợp lệ của FEV1% dự đoán
  if (
    typeof input.fev1PredPct !== 'number' ||
    !Number.isFinite(input.fev1PredPct) ||
    input.fev1PredPct <= 0 ||
    input.fev1PredPct > 150
  ) {
    return {
      isAirflowObstructionConfirmed: false,
      grade: null,
      gradeSeverityVi: 'Giá trị FEV1% không hợp lệ',
      group: null,
      groupDescriptionVi: 'Không khả dụng',
      initialTherapyVi: 'Cần kiểm tra lại kết quả đo chức năng hô hấp.',
      warning: 'FEV1% dự đoán phải là số dương hợp lý (0 < FEV1% ≤ 150%).',
    };
  }

  // 2. Kiểm tra tiêu chuẩn tắc nghẽn luồng khí cố định sau giãn phế quản (FEV1/FVC < 0.70) — Fail-closed
  if (input.fev1FvcRatio !== undefined) {
    if (!Number.isFinite(input.fev1FvcRatio) || input.fev1FvcRatio <= 0 || input.fev1FvcRatio > 1.5) {
      return {
        isAirflowObstructionConfirmed: false,
        grade: null,
        gradeSeverityVi: 'Tỷ lệ FEV1/FVC không hợp lệ',
        group: null,
        groupDescriptionVi: 'Không khả dụng',
        initialTherapyVi: 'Cần kiểm tra lại chỉ số FEV1/FVC sau test giãn phế quản.',
        warning: 'Tỷ lệ FEV1/FVC sau giãn phế quản nằm ngoài khoảng sinh lý hợp lệ.',
      };
    }

    if (input.fev1FvcRatio >= COEFFICIENTS.fev1FvcDiagnosticCutoff) {
      return {
        isAirflowObstructionConfirmed: false,
        grade: null,
        gradeSeverityVi: 'Chưa xác nhận tắc nghẽn luồng khí cố định (FEV1/FVC ≥ 0.70)',
        group: null,
        groupDescriptionVi: 'Không phân nhóm GOLD ABE do FEV1/FVC sau giãn phế quản ≥ 0.70.',
        initialTherapyVi: 'Đánh giá lại chẩn đoán phân biệt (hen phế quản, giãn phế quản, suy tim, PRISm...) trước khi áp dụng phác đồ COPD.',
        warning:
          'Lưu ý: Tỷ lệ FEV1/FVC sau giãn phế quản ≥ 0.70. Không đáp ứng tiêu chuẩn chẩn đoán tắc nghẽn luồng khí cố định COPD theo GOLD 2026 (Fail-closed: không gán phân độ/nhóm GOLD).',
      };
    }
  }

  const isAirflowObstructionConfirmed = true;
  let warning: string | undefined =
    input.fev1FvcRatio === undefined
      ? 'Chưa nhập tỷ lệ FEV1/FVC sau giãn phế quản; kết quả phân độ giả định đã xác nhận FEV1/FVC < 0.70.'
      : undefined;

  // 3. Phân độ tắc nghẽn FEV1 (GOLD 1 - 4)
  const { grade, gradeSeverityVi } = classifyGoldGrade(input.fev1PredPct);

  // 4. Chuẩn hóa đầu vào đợt cấp & triệu chứng (TUYỆT ĐỐI không gán ngầm ?? 0)
  const modExac = input.moderateExacerbations ?? input.exacerbationsPastYear;
  const sevExac = input.severeExacerbations ?? input.hospitalizationsPastYear;
  const catVal = input.cat ?? input.catScore;
  const mmrcVal = input.mmrc;

  if (
    (modExac !== undefined && (!Number.isFinite(modExac) || modExac < 0)) ||
    (sevExac !== undefined && (!Number.isFinite(sevExac) || sevExac < 0))
  ) {
    return {
      isAirflowObstructionConfirmed,
      grade,
      gradeSeverityVi,
      group: null,
      groupDescriptionVi: 'Dữ liệu đợt cấp không hợp lệ',
      initialTherapyVi: 'Cần nhập số đợt cấp là số nguyên không âm.',
      warning: 'Số đợt cấp trung bình hoặc nhập viện trong 12 tháng qua không hợp lệ (âm hoặc NaN).',
    };
  }

  if (
    (mmrcVal !== undefined && (!Number.isFinite(mmrcVal) || mmrcVal < 0 || mmrcVal > 4)) ||
    (catVal !== undefined && (!Number.isFinite(catVal) || catVal < 0 || catVal > 40))
  ) {
    return {
      isAirflowObstructionConfirmed,
      grade,
      gradeSeverityVi,
      group: null,
      groupDescriptionVi: 'Điểm triệu chứng không hợp lệ',
      initialTherapyVi: 'Cần kiểm tra lại điểm mMRC (0–4) hoặc CAT (0–40).',
      warning: 'Điểm mMRC (0–4) hoặc CAT (0–40) nằm ngoài giới hạn hợp lệ.',
    };
  }

  const isLegacy2023 = input.guidelineVersion === 'GOLD_2023';
  const modThreshold = isLegacy2023
    ? COEFFICIENTS.exacerbationThresholds.legacyGold2023ModerateThreshold
    : COEFFICIENTS.exacerbationThresholds.moderateExacerbationsThreshold;

  const isConfirmedGroupE =
    (sevExac !== undefined && sevExac >= COEFFICIENTS.exacerbationThresholds.hospitalizationThreshold) ||
    (modExac !== undefined && modExac >= modThreshold);

  if (isConfirmedGroupE) {
    return {
      isAirflowObstructionConfirmed,
      grade,
      gradeSeverityVi,
      group: 'E',
      groupDescriptionVi: isLegacy2023
        ? 'Nhóm E (Exacerbation - GOLD 2023): Nguy cơ đợt cấp cao (≥ 2 đợt vừa hoặc ≥ 1 đợt nhập viện trong năm).'
        : 'Nhóm E (Exacerbation - GOLD 2026): Nguy cơ đợt cấp cao (≥ 1 đợt cấp trung bình hoặc nặng/nhập viện trong 12 tháng qua).',
      initialTherapyVi:
        'Khởi đầu: Phối hợp LABA + LAMA. Cân nhắc bộ ba LABA + LAMA + ICS nếu bạch cầu ái toan máu (blood eosinophils) ≥ 300 tế bào/µL (hoặc đồng mắc hen phế quản).',
      warning,
    };
  }

  // Nếu chưa đủ điều kiện kết luận Nhóm E mà thiếu lịch sử đợt cấp -> Fail-closed (không gán ngầm ?? 0)
  if (modExac === undefined || sevExac === undefined) {
    return {
      isAirflowObstructionConfirmed,
      grade,
      gradeSeverityVi,
      group: null,
      groupDescriptionVi: 'Chưa đủ dữ liệu lịch sử đợt cấp 12 tháng qua để phân nhóm GOLD ABE.',
      initialTherapyVi: 'Vui lòng khai thác đầy đủ số đợt cấp trung bình và số đợt cấp nhập viện trong 12 tháng qua.',
      warning:
        'Thiếu dữ liệu lịch sử đợt cấp (trung bình / nhập viện) khi chưa đủ điều kiện kết luận Nhóm E (Fail-closed: không giả định 0 đợt cấp).',
    };
  }

  // 5. Xác định mức độ triệu chứng: mMRC >= 2 HOẶC CAT >= 10 -> Nhóm B (kể cả khi mới chỉ nhập 1 trong 2 thang điểm mà đã đạt ngưỡng cao)
  const isHighSymptom =
    (catVal !== undefined && catVal >= COEFFICIENTS.symptomCutoffs.catHigh) ||
    (mmrcVal !== undefined && mmrcVal >= COEFFICIENTS.symptomCutoffs.mmrcHigh);

  if (isHighSymptom) {
    return {
      isAirflowObstructionConfirmed,
      grade,
      gradeSeverityVi,
      group: 'B',
      groupDescriptionVi: isLegacy2023
        ? 'Nhóm B: Nhiều triệu chứng (mMRC ≥ 2 hoặc CAT ≥ 10), nguy cơ đợt cấp thấp (0–1 đợt vừa, không nhập viện).'
        : 'Nhóm B: Nhiều triệu chứng (mMRC ≥ 2 hoặc CAT ≥ 10), không có đợt cấp trung bình/nặng trong 12 tháng qua (0 đợt cấp).',
      initialTherapyVi:
        'Khởi đầu: Phối hợp 2 thuốc giãn phế quản tác dụng kéo dài LABA + LAMA (ưu tiên vượt trội so với đơn trị liệu).',
      warning,
    };
  }

  // COPD-R4-R3-11: Nếu chưa thuộc Nhóm E và chưa đạt ngưỡng triệu chứng cao ở thang điểm đã nhập,
  // BẮT BUỘC phải có đủ cả mMRC (< 2) VÀ CAT (< 10) mới được kết luận Nhóm A (Fail-closed: tránh bỏ sót CAT >= 10 khi mMRC = 1!)
  if (mmrcVal === undefined || catVal === undefined) {
    return {
      isAirflowObstructionConfirmed,
      grade,
      gradeSeverityVi,
      group: null,
      groupDescriptionVi: 'Chưa đủ đồng thời điểm mMRC và CAT để khẳng định Nhóm A (ít triệu chứng).',
      initialTherapyVi: 'Vui lòng đánh giá đầy đủ cả thang điểm khó thở mMRC (0–4) và điểm CAT (0–40) trước khi chọn đơn trị liệu Nhóm A.',
      warning:
        'Thiếu điểm mMRC hoặc điểm CAT khi chưa đạt ngưỡng Nhóm B/E nên không thể gán ngầm Nhóm A theo GOLD 2026 (Fail-closed: CAT ≥ 10 dù mMRC 0–1 vẫn thuộc Nhóm B).',
    };
  }

  return {
    isAirflowObstructionConfirmed,
    grade,
    gradeSeverityVi,
    group: 'A',
    groupDescriptionVi: isLegacy2023
      ? 'Nhóm A: Ít triệu chứng (mMRC 0–1 và CAT < 10), nguy cơ đợt cấp thấp (0–1 đợt vừa, không nhập viện).'
      : 'Nhóm A: Ít triệu chứng (mMRC 0–1 và CAT < 10), không có đợt cấp trung bình/nặng trong 12 tháng qua (0 đợt cấp).',
    initialTherapyVi:
      'Khởi đầu: Một thuốc giãn phế quản tác dụng kéo dài đơn độc (LABA hoặc LAMA; ưu tiên LAMA nếu dung nạp).',
    warning,
  };
}
