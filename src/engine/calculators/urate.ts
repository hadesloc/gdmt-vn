/**
 * Chỉ định Điều trị Hạ Urat (ULT) & Đích Axit Uric Huyết thanh theo ACR 2020
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - Hướng dẫn Quản lý Bệnh Gút của Hội Thấp khớp học Hoa Kỳ (ACR 2020 Gout Guideline):
 *   + Chỉ định MẠNH (Strong recommendation):
 *     1. Có ≥ 1 hạt tophi dưới da.
 *     2. Có tổn thương cấu trúc khớp do gút trên hình ảnh X-quang.
 *     3. Đợt cấp tái phát thường xuyên (≥ 2 đợt trong vòng 1 năm qua).
 *   + Chỉ định CÓ ĐIỀU KIỆN (Conditional recommendation):
 *     1. Đã từng bị đợt cấp gút (> 1 đợt nhưng < 2 đợt/năm).
 *     2. Cơn gút đầu tiên kèm theo ít nhất một trong các yếu tố: CKD giai đoạn ≥ 3, Urat huyết thanh > 9 mg/dL (> 535 µmol/L), hoặc có tiền sử sỏi thận (urolithiasis).
 *   + KHÔNG chỉ định (Conditional against): Cơn gút đầu tiên không biến chứng; tăng acid uric máu không triệu chứng.
 * - Mục tiêu Urat huyết thanh:
 *   + Mục tiêu chuẩn: < 6.0 mg/dL (< 360 µmol/L).
 *   + Mục tiêu tích cực: < 5.0 mg/dL (< 300 µmol/L) ở người có tophi nặng nhằm thúc đẩy tinh thể urat hòa tan nhanh hơn.
 *
 * Nguồn:
 * - FitzGerald GA, Dalbeth N, Mikuls T, et al. 2020 American College of Rheumatology Guideline for the Management of Gout.
 *   Arthritis Care Res (Hoboken). 2020;72(6):744-760. DOI: 10.1002/acr.24380
 */

import type { UrateInput, UrateResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'American College of Rheumatology (ACR)',
    guideline: '2020 ACR Guideline for the Management of Gout',
    year: 2020,
    locator: 'Recommendations 1-4 (Indications for ULT) & Recommendation 7 (Target urate), p. 747-750',
    doiOrUrl: 'https://doi.org/10.1002/acr.24380',
    notesVi: 'Khuyến cáo chiến lược Treat-to-Target chuẩn hóa đưa nồng độ urat máu dưới ngưỡng bão hòa',
    needsSourceVerification: false,
  } as SourceCitationInfo,

  urateConversionFactor: 59.48, // 1 mg/dL = 59.48 µmol/L
  standardTargetMmol: 360, // µmol/L (< 6 mg/dL)
  standardTargetMgDl: 6.0,
  tophiTargetMmol: 300, // µmol/L (< 5 mg/dL)
  tophiTargetMgDl: 5.0,
  highUrateCutoffMmol: 535, // µmol/L (~9 mg/dL)
  highUrateCutoffMgDl: 9.0,
};

/**
 * Chuyển đổi nồng độ acid uric sang µmol/L
 */
export function convertUrateToUmolL(val: number, unit: 'umol/L' | 'mg/dL' = 'umol/L'): number {
  if (unit === 'mg/dL') {
    return val * COEFFICIENTS.urateConversionFactor;
  }
  return val;
}

/**
 * Đánh giá chỉ định ULT và đích hạ urat máu
 */
export function computeUrate(input: UrateInput): UrateResult {
  const uratUnit = input.urateUnit ?? 'umol/L';
  const urateUmolL = convertUrateToUmolL(input.serumUrate, uratUnit);
  const urateMgDl = Math.round((urateUmolL / COEFFICIENTS.urateConversionFactor) * 10) / 10;

  const strongReasons: string[] = [];
  const conditionalReasons: string[] = [];

  // 1. Kiểm tra các chỉ định mạnh
  if (input.hasTophi) {
    strongReasons.push('Có ít nhất một hạt tophi dưới da khi thăm khám lâm sàng');
  }
  if (input.radiographicDamage) {
    strongReasons.push('Có bằng chứng tổn thương khuyết xương/hủy khớp do gút trên phim X-quang');
  }
  if (input.flaresPastYear >= 2) {
    strongReasons.push(`Đợt cấp gút tái phát thường xuyên (≥ 2 đợt trong vòng 1 năm qua: ${input.flaresPastYear} đợt)`);
  }

  // 2. Kiểm tra các chỉ định có điều kiện
  if (strongReasons.length === 0) {
    if (input.priorFlaresLifetime > 1 && input.flaresPastYear < 2) {
      conditionalReasons.push(`Đã từng có nhiều đợt cấp trong đời (${input.priorFlaresLifetime} đợt) dù trong năm qua < 2 đợt`);
    } else if (input.priorFlaresLifetime === 1) {
      // Cơn gút đầu tiên kèm yếu tố nguy cơ
      const firstFlareRiskFactors: string[] = [];
      if (input.ckdStage !== undefined && input.ckdStage >= 3) {
        firstFlareRiskFactors.push(`Bệnh thận mạn giai đoạn ${input.ckdStage} (eGFR < 60 mL/min/1.73m²)`);
      }
      if (urateUmolL >= COEFFICIENTS.highUrateCutoffMmol) {
        firstFlareRiskFactors.push(`Axit uric huyết thanh tăng rất cao (${urateUmolL} µmol/L / ${urateMgDl} mg/dL ≥ 9.0 mg/dL)`);
      }
      if (input.urolithiasis) {
        firstFlareRiskFactors.push('Tiền sử có sỏi thận đường tiết niệu');
      }

      if (firstFlareRiskFactors.length > 0) {
        conditionalReasons.push(`Cơn gút đầu tiên kèm yếu tố nguy cơ tiến triển nặng: ${firstFlareRiskFactors.join(', ')}`);
      }
    }
  }

  let ultIndication: UrateResult['ultIndication'];
  let ultIndicationVi: UrateResult['ultIndicationVi'];
  let reasonsVi: string[];

  if (strongReasons.length > 0) {
    ultIndication = 'strong';
    ultIndicationVi = 'Chỉ định mạnh';
    reasonsVi = strongReasons;
  } else if (conditionalReasons.length > 0) {
    ultIndication = 'conditional';
    ultIndicationVi = 'Chỉ định có điều kiện';
    reasonsVi = conditionalReasons;
  } else {
    ultIndication = 'not_indicated';
    ultIndicationVi = 'Chưa có chỉ định';
    reasonsVi = [
      'Chưa đủ tiêu chuẩn khởi trị thuốc hạ urat máu theo ACR 2020 (cơn gút đầu tiên không kèm tổn thương thận/sỏi/axit uric > 9 mg/dL, hoặc tăng axit uric máu không triệu chứng).',
    ];
  }

  // Xác định đích điều trị
  const needsAggressiveTarget = input.hasTophi || input.radiographicDamage;
  const targetUrateUmolL = needsAggressiveTarget ? COEFFICIENTS.tophiTargetMmol : COEFFICIENTS.standardTargetMmol;
  const targetUrateMgDl = needsAggressiveTarget ? COEFFICIENTS.tophiTargetMgDl : COEFFICIENTS.standardTargetMgDl;

  const targetDescriptionVi = needsAggressiveTarget
    ? `Mục tiêu điều trị tích cực: Axit uric huyết thanh < ${targetUrateUmolL} µmol/L (< ${targetUrateMgDl} mg/dL) do có tophi hoặc tổn thương khớp trên X-quang, nhằm đẩy nhanh tốc độ hòa tan tinh thể urat.`
    : `Mục tiêu điều trị chuẩn: Axit uric huyết thanh < ${targetUrateUmolL} µmol/L (< ${targetUrateMgDl} mg/dL) để duy trì nồng độ dưới ngưỡng bão hòa của monosodium urate trong dịch khớp.`;

  return {
    ultIndication,
    ultIndicationVi,
    reasonsVi,
    targetUrateUmolL,
    targetUrateMgDl,
    targetDescriptionVi,
  };
}
