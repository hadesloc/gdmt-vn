/**
 * Phân loại Huyết áp theo ESC 2024 & ACC/AHA
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * 1. ESC 2024 Guidelines for elevated blood pressure and hypertension:
 *    - Huyết áp không tăng (Non-elevated BP): SBP < 120 mmHg VÀ DBP < 70 mmHg.
 *    - Huyết áp tăng (Elevated BP): SBP 120 - 139 mmHg HOẶC DBP 70 - 89 mmHg.
 *    - Tăng huyết áp (Hypertension): SBP ≥ 140 mmHg HOẶC DBP ≥ 90 mmHg.
 *    - Phân độ: Độ 1 (140-159 / 90-99), Độ 2 (≥160 / ≥100), Cơn tăng HA (≥180 / ≥110).
 * 2. Phân độ theo ACC/AHA (Hoa Kỳ):
 *    - Bình thường: < 120/< 80 mmHg.
 *    - Tăng HA (Elevated): 120-129/< 80 mmHg.
 *    - Giai đoạn 1: 130-139 hoặc 80-89 mmHg.
 *    - Giai đoạn 2: ≥ 140 hoặc ≥ 90 mmHg.
 *    - Cơn THA khẩn cấp: > 180 và/hoặc > 120 mmHg.
 *
 * Nguồn:
 * - 2024 ESC Guidelines for the management of elevated blood pressure and hypertension.
 *   Section 6, Table 5, Figure 6, p. 25-26 (PDF pages 25-26).
 *   Đường dẫn thư viện: Medical_Library_2026/01_Noi_Khoa/Tim_Mach/ESC_2024_elevated_blood_pressure_and_hypertension.pdf
 */

import type { BpInput, BpResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'ESC / ACC-AHA',
    guideline: '2024 ESC Guidelines for elevated blood pressure and hypertension',
    year: 2024,
    locator: 'Section 6, Table 5 & Figure 6, p. 25-26 (PDF page 25)',
    doiOrUrl: 'https://doi.org/10.1093/eurheartj/ehae178',
    notesVi: 'Đơn giản hóa thành 3 nhóm chính: Non-elevated (<120/<70), Elevated (120-139/70-89), Hypertension (≥140/≥90)',
    needsSourceVerification: false,
  } as SourceCitationInfo,

  esc2024: {
    nonElevatedSbpMax: 120,
    nonElevatedDbpMax: 70,
    hypertensionSbpMin: 140,
    hypertensionDbpMin: 90,
    grade2SbpMin: 160,
    grade2DbpMin: 100,
    crisisSbpMin: 180,
    crisisDbpMin: 110,
  },

  accAha: {
    normalSbpMax: 120,
    normalDbpMax: 80,
    elevatedSbpMax: 130,
    stage1SbpMax: 140,
    stage1DbpMax: 90,
    crisisSbpMin: 180,
    crisisDbpMin: 120,
  },
};

/**
 * Đánh giá và phân loại huyết áp toàn diện
 */
export function computeBp(input: BpInput): BpResult {
  const { sbp, dbp } = input;

  const pulsePressure = sbp - dbp;
  const meanArterialPressure = Math.round(((2 * dbp + sbp) / 3) * 10) / 10;

  const isolatedSystolicHypertension = sbp >= 140 && dbp < 90;

  // 1. Phân loại theo ESC 2024
  let escCategory: BpResult['esc2024']['category'];
  let escSub: BpResult['esc2024']['subClassification'];
  let escCategoryVi: string;
  let escActionVi: string;

  if (sbp >= COEFFICIENTS.esc2024.hypertensionSbpMin || dbp >= COEFFICIENTS.esc2024.hypertensionDbpMin) {
    escCategory = 'hypertension';

    if (sbp >= COEFFICIENTS.esc2024.crisisSbpMin || dbp >= COEFFICIENTS.esc2024.crisisDbpMin) {
      escSub = 'Hypertensive Urgency/Emergency';
      escCategoryVi = 'Tăng huyết áp - Cơn tăng huyết áp (≥ 180 và/hoặc ≥ 110 mmHg)';
      escActionVi = 'Cần kiểm tra khẩn cấp triệu chứng tổn thương cơ quan đích cấp tính (HMOD: đau ngực, khó thở, khiếm khuyết thần kinh). Nếu có tổn thương cấp → Cấp cứu tăng huyết áp (nhập viện, thuốc IV). Nếu không có triệu chứng cấp → Cơn tăng HA khẩn cấp (hạ áp từ từ bằng thuốc uống).';
    } else if (sbp >= COEFFICIENTS.esc2024.grade2SbpMin || dbp >= COEFFICIENTS.esc2024.grade2DbpMin) {
      escSub = 'Grade 2';
      escCategoryVi = 'Tăng huyết áp Độ 2 (≥ 160 và/hoặc ≥ 100 mmHg)';
      escActionVi = 'Khởi trị thuốc hạ áp ngay lập tức kết hợp thay đổi lối sống. ESC 2024 khuyến cáo khởi trị bằng viên phối hợp đôi (SPC) liều chuẩn (RASi + CCB hoặc RASi + Thiazide/Thiazide-like diuretic).';
    } else {
      escSub = isolatedSystolicHypertension ? 'Isolated Systolic Hypertension' : 'Grade 1';
      escCategoryVi = isolatedSystolicHypertension
        ? 'Tăng huyết áp tâm thu đơn độc (SBP ≥ 140 và DBP < 90 mmHg)'
        : 'Tăng huyết áp Độ 1 (140 - 159 và/hoặc 90 - 99 mmHg)';
      escActionVi = 'Khởi trị thuốc hạ áp kết hợp thay đổi lối sống. Ưu tiên viên phối hợp liều thấp khởi đầu để đạt nhanh huyết áp mục tiêu (< 130/80 mmHg nếu dung nạp).';
    }
  } else if (sbp >= COEFFICIENTS.esc2024.nonElevatedSbpMax || dbp >= COEFFICIENTS.esc2024.nonElevatedDbpMax) {
    escCategory = 'elevated';
    escCategoryVi = 'Huyết áp tăng (Elevated BP: 120-139 mmHg tâm thu hoặc 70-89 mmHg tâm trương)';
    escActionVi = 'Khuyến cáo can thiệp thay đổi lối sống tích cực (chế độ ăn giảm muối DASH, thể lực, kiểm soát cân nặng). Xem xét điều trị thuốc nếu bệnh nhân có nguy cơ tim mạch 10 năm cao (SCORE2 ≥ 10%, có ĐTĐ, CKD, hoặc tổn thương cơ quan đích) theo khuyến cáo mới của ESC 2024.';
  } else {
    escCategory = 'non_elevated';
    escCategoryVi = 'Huyết áp không tăng (Non-elevated BP: < 120 mmHg tâm thu VÀ < 70 mmHg tâm trương)';
    escActionVi = 'Huyết áp tối ưu. Tiếp tục duy trì lối sống lành mạnh; đo kiểm tra lại huyết áp định kỳ hàng năm.';
  }

  // 2. Phân loại theo ACC/AHA
  let accStage: BpResult['accAha2025']['stage'];
  let accStageVi: string;

  if (sbp > COEFFICIENTS.accAha.crisisSbpMin || dbp > COEFFICIENTS.accAha.crisisDbpMin) {
    accStage = 'crisis';
    accStageVi = 'Cơn tăng huyết áp (Hypertensive Crisis: > 180 và/hoặc > 120 mmHg)';
  } else if (sbp >= COEFFICIENTS.accAha.stage1SbpMax || dbp >= COEFFICIENTS.accAha.stage1DbpMax) {
    accStage = 'stage_2';
    accStageVi = 'Tăng huyết áp Giai đoạn 2 (Stage 2: ≥ 140 hoặc ≥ 90 mmHg)';
  } else if (sbp >= COEFFICIENTS.accAha.elevatedSbpMax || dbp >= COEFFICIENTS.accAha.normalDbpMax) {
    accStage = 'stage_1';
    accStageVi = 'Tăng huyết áp Giai đoạn 1 (Stage 1: 130 - 139 hoặc 80 - 89 mmHg)';
  } else if (sbp >= COEFFICIENTS.accAha.normalSbpMax) {
    accStage = 'elevated';
    accStageVi = 'Huyết áp tăng (Elevated: 120 - 129 và < 80 mmHg)';
  } else {
    accStage = 'normal';
    accStageVi = 'Huyết áp bình thường (Normal: < 120 và < 80 mmHg)';
  }

  return {
    esc2024: {
      category: escCategory,
      subClassification: escSub,
      categoryVi: escCategoryVi,
      clinicalActionVi: escActionVi,
    },
    accAha2025: {
      stage: accStage,
      stageVi: accStageVi,
    },
    isolatedSystolicHypertension,
    pulsePressure,
    meanArterialPressure,
  };
}
