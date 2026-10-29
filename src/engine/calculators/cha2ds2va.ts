/**
 * Thang điểm Nguy cơ Đột quỵ trong Rung Nhĩ CHA₂DS₂-VA (ESC 2024) & CHA₂DS₂-VASc
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - ESC 2024 Atrial Fibrillation Guidelines: Thang điểm chuẩn mới CHA₂DS₂-VA đã loại bỏ yếu tố giới tính (Sex category 'Sc')
 *   vì nữ giới tự nó không phải là yếu tố nguy cơ độc lập mà chỉ là yếu tố điều chỉnh (modifier).
 *   Điểm 0: Không khuyến cáo dùng thuốc chống đông (Class III).
 *   Điểm 1: Nên xem xét chỉ định thuốc chống đông (Class IIa).
 *   Điểm ≥ 2: Khuyến cáo bắt buộc chỉ định thuốc chống đông đường uống (OAC), ưu tiên DOAC hơn kháng vitamin K (Class I).
 * - Hỗ trợ tính điểm CHA₂DS₂-VASc truyền thống cho guideline Hoa Kỳ (ACC/AHA/ACCP).
 *
 * Nguồn:
 * - ESC 2024 Guidelines for the management of atrial fibrillation.
 *   Recommendation Table 6, Section 6.1, p. 28-29 (PDF pages 28-29).
 *   Đường dẫn thư viện: Medical_Library_2026/01_Noi_Khoa/Tim_Mach/ESC_2024_atrial_fibrillation.pdf
 */

import type { Cha2ds2vaInput, Cha2ds2vaResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'ESC',
    guideline: 'ESC 2024 Guidelines for the management of atrial fibrillation',
    year: 2024,
    locator: 'Recommendation Table 6, Section 6.1, p. 28-29 (PDF page 29)',
    doiOrUrl: 'https://doi.org/10.1093/eurheartj/ehae178',
    notesVi: 'Đổi từ CHA2DS2-VASc sang CHA2DS2-VA (bỏ yếu tố giới tính Sc)',
    needsSourceVerification: false,
  } as SourceCitationInfo,
  points: {
    congestiveHeartFailure: 1,
    hypertension: 1,
    age75AndAbove: 2,
    diabetesMellitus: 1,
    priorStrokeOrTia: 2,
    vascularDisease: 1,
    age65To74: 1,
    femaleSexClassic: 1,
  },
};

/**
 * Tính điểm CHA₂DS₂-VA (ESC 2024) và CHA₂DS₂-VASc (cũ / ACC/AHA)
 */
export function computeCha2ds2va(input: Cha2ds2vaInput): Cha2ds2vaResult {
  let scoreVa = 0;

  // C: Congestive heart failure
  if (input.chf) scoreVa += COEFFICIENTS.points.congestiveHeartFailure;

  // H: Hypertension
  if (input.hypertension) scoreVa += COEFFICIENTS.points.hypertension;

  // A2: Age >= 75 (+2) hoặc Age 65-74 (+1)
  if (input.age >= 75) {
    scoreVa += COEFFICIENTS.points.age75AndAbove;
  } else if (input.age >= 65) {
    scoreVa += COEFFICIENTS.points.age65To74;
  }

  // D: Diabetes mellitus
  if (input.diabetes) scoreVa += COEFFICIENTS.points.diabetesMellitus;

  // S2: Stroke / TIA / Thromboembolism
  if (input.strokeOrTia) scoreVa += COEFFICIENTS.points.priorStrokeOrTia;

  // V: Vascular disease (prior MI, peripheral artery disease, aortic plaque)
  if (input.vascularDisease) scoreVa += COEFFICIENTS.points.vascularDisease;

  // Khuyến cáo theo ESC 2024 Table 6
  let recommendationEsc2024: Cha2ds2vaResult['recommendationEsc2024'];
  if (scoreVa === 0) {
    recommendationEsc2024 = {
      class: 'III',
      actionVi: 'Không chỉ định thuốc chống đông (OAC)',
      descriptionVi: 'Bệnh nhân có nguy cơ thuyên tắc thấp (CHA₂DS₂-VA = 0). Việc dùng thuốc chống đông hoặc chống kết tập tiểu cầu không mang lại lợi ích lâm sàng ròng và làm tăng nguy cơ xuất huyết (Class III, Level A).',
    };
  } else if (scoreVa === 1) {
    recommendationEsc2024 = {
      class: 'IIa',
      actionVi: 'Nên xem xét chỉ định thuốc chống đông (OAC)',
      descriptionVi: 'Bệnh nhân có nguy cơ thuyên tắc tăng vừa (CHA₂DS₂-VA = 1). Nên xem xét khởi trị chống đông đường uống (DOAC ưu tiên hơn VKA) sau khi cân nhắc nguy cơ xuất huyết và ý muốn của người bệnh (Class IIa, Level C).',
    };
  } else {
    recommendationEsc2024 = {
      class: 'I',
      actionVi: 'Khuyến cáo chỉ định thuốc chống đông (OAC)',
      descriptionVi: `Bệnh nhân có nguy cơ thuyên tắc cao (CHA₂DS₂-VA = ${scoreVa} ≥ 2). Khuyến cáo bắt buộc điều trị chống đông đường uống để dự phòng đột quỵ thiếu máu cục bộ và thuyên tắc mạch hệ thống. Ưu tiên sử dụng DOAC hơn kháng vitamin K (Class I, Level A/C).`,
    };
  }

  // Điểm cổ điển CHA2DS2-VASc nếu có thông tin giới tính
  let scoreVasc: number | undefined;
  let recommendationAccAha: Cha2ds2vaResult['recommendationAccAha'] | undefined;

  if (input.sex !== undefined) {
    const isFemale = input.sex === 'female';
    scoreVasc = scoreVa + (isFemale ? COEFFICIENTS.points.femaleSexClassic : 0);

    if ((!isFemale && scoreVasc === 0) || (isFemale && scoreVasc === 1)) {
      recommendationAccAha = {
        class: 'III',
        actionVi: 'Không chỉ định chống đông (nguy cơ thấp: Nam 0, Nữ 1)',
      };
    } else if ((!isFemale && scoreVasc === 1) || (isFemale && scoreVasc === 2)) {
      recommendationAccAha = {
        class: 'IIa',
        actionVi: 'Cân nhắc chỉ định chống đông (nguy cơ trung bình: Nam 1, Nữ 2)',
      };
    } else {
      recommendationAccAha = {
        class: 'I',
        actionVi: 'Khuyến cáo chỉ định chống đông (nguy cơ cao: Nam ≥ 2, Nữ ≥ 3)',
      };
    }
  }

  return {
    scoreVa,
    scoreVasc,
    recommendationEsc2024,
    recommendationAccAha,
  };
}
