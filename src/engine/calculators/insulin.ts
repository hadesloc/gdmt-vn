/**
 * Hướng dẫn & Tính toán Liều Khởi đầu Insulin Ngoại trú và Nội viện theo ADA 2026
 * Phân quyền: Agent D
 *
 * Tiêu chuẩn:
 * - ADA Standards of Care in Diabetes (2026 Update):
 *   + Chương 9 (Pharmacologic Approaches to Glycemic Treatment): Liều insulin nền khởi đầu ngoại trú (10 U hoặc 0.1 - 0.2 U/kg/ngày).
 *   + Chương 16 (Diabetes Care in the Hospital): Phác đồ Basal-Bolus nội viện dựa trên cân nặng và mức độ nhạy cảm/đề kháng insulin.
 * - Trạng thái: Khung cấu trúc logic lâm sàng chuẩn + đánh dấu needsSourceVerification theo yêu cầu.
 *
 * Nguồn:
 * - ADA 2026 Standards of Care, Chapter 9 & Chapter 16.
 *   Đường dẫn thư viện:
 *   Medical_Library_2026/01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_9_Pharmacologic_Approaches_to_Glycemic_Treatment_Standards_of_Care_in_.pdf
 *   Medical_Library_2026/01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_16_Diabetes_Care_in_the_Hospital_Standards_of_Care_in_Diabetes_2026.pdf
 */

import type { InsulinInput, InsulinResult, SourceCitationInfo } from './types';

export const COEFFICIENTS = {
  source: {
    organization: 'American Diabetes Association (ADA)',
    guideline: 'Standards of Care in Diabetes—2026',
    year: 2026,
    locator: 'Diabetes Care 2026;49(Suppl. 1), Ch. 9, Fig. 9.5, p. S172 (PDF p. 16) & Ch. 16, p. S307 (PDF p. 5)',
    doiOrUrl: 'https://doi.org/10.2337/dc26-S009',
    notesVi: 'Khung liều khởi đầu nền ngoại trú (10 U hoặc 0.1-0.2 U/kg/ngày) và basal-bolus nội viện theo cân nặng (0.3-0.6 U/kg/ngày)',
    needsSourceVerification: false,
  } satisfies SourceCitationInfo,

  outpatient: {
    fixedStartDoseUnits: 10,
    weightDoseMinPerKg: 0.1,
    weightDoseMaxPerKg: 0.2,
    titrationUnitsStep: 2,
    titrationIntervalDays: 3,
  },

  inpatient: {
    sensitiveRatePerKg: 0.3, // Cận dưới dải 0.3 - 0.6 U/kg/ngày (người già, suy thận eGFR < 60, ăn kém)
    standardRatePerKg: 0.45, // Trung vị dải 0.3 - 0.6 U/kg/ngày (bệnh nhân nội viện thông thường)
    resistantRatePerKg: 0.6, // Cận trên dải 0.3 - 0.6 U/kg/ngày (đề kháng insulin, béo phì, dùng corticoid)
    basalProportion: 0.5,
    bolusProportion: 0.5,
    mealsPerDay: 3,
  },
};

/**
 * Tính toán liều insulin ngoại trú và nội viện
 */
export function computeInsulin(input: InsulinInput): InsulinResult {
  const { weight, setting } = input;
  const context = input.clinicalContext ?? 'standard';

  let outpatientStart: InsulinResult['outpatientStart'];
  let inpatientBasalBolus: InsulinResult['inpatientBasalBolus'];

  if (setting === 'outpatient') {
    const minWeightDose = Math.round(weight * COEFFICIENTS.outpatient.weightDoseMinPerKg);
    const maxWeightDose = Math.round(weight * COEFFICIENTS.outpatient.weightDoseMaxPerKg);

    outpatientStart = {
      fixedDoseUnits: COEFFICIENTS.outpatient.fixedStartDoseUnits,
      weightBasedDoseRangeUnits: [minWeightDose, maxWeightDose],
      titrationAdviceVi:
        'Khởi đầu: Tiêm 10 đơn vị/ngày HOẶC 0.1 - 0.2 đơn vị/kg/ngày (insulin nền: Glargine, Detemir hoặc Degludec tiêm 1 lần cùng thời điểm mỗi ngày; hoặc NPH tiêm trước ngủ). Chuẩn độ: Tăng 2 đơn vị mỗi 3 ngày nếu đường huyết đói chưa đạt mục tiêu (4.4 - 7.2 mmol/L / 80 - 130 mg/dL). Nếu xảy ra hạ đường huyết (< 3.9 mmol/L / 70 mg/dL), giảm liều ngay 10 - 20%.',
    };
  } else {
    // Nội viện (inpatient)
    let ratePerKg: number;
    let contextDesc: string;

    if (context === 'sensitive') {
      ratePerKg = COEFFICIENTS.inpatient.sensitiveRatePerKg;
      contextDesc = 'Nhóm nhạy cảm insulin (tuổi cao ≥ 65, suy thận eGFR < 60, nhẹ cân, ăn kém)';
    } else if (context === 'resistant') {
      ratePerKg = COEFFICIENTS.inpatient.resistantRatePerKg;
      contextDesc = 'Nhóm đề kháng insulin (béo phì nặng, đang dùng corticoid liều cao)';
    } else {
      ratePerKg = COEFFICIENTS.inpatient.standardRatePerKg;
      contextDesc = 'Nhóm bệnh nhân thông thường';
    }

    const tdd = Math.round(weight * ratePerKg);
    const basalUnits = Math.round(tdd * COEFFICIENTS.inpatient.basalProportion);
    const totalBolusUnits = tdd - basalUnits;
    const bolusEachMealUnits = Math.round(totalBolusUnits / COEFFICIENTS.inpatient.mealsPerDay);

    inpatientBasalBolus = {
      totalDailyDoseUnits: tdd,
      dosePerKg: ratePerKg,
      basalUnits,
      bolusEachMealUnits,
      scaleAdviceVi: `Tổng liều hàng ngày (TDD): ${tdd} đơn vị (${ratePerKg} U/kg áp dụng cho ${contextDesc}).\n- Insulin nền (Basal): ${basalUnits} đơn vị (tiêm Glargine/Degludec 1 lần/ngày hoặc NPH chia 2 lần).\n- Insulin bữa ăn (Bolus): ${bolusEachMealUnits} đơn vị trước mỗi bữa ăn chính (3 bữa/ngày, dùng insulin tác dụng nhanh Aspart/Lispro/Glulisine hoặc Regular).\n- Kết hợp thang chỉnh liều (Correction insulin scale) theo dõi đường huyết mao mạch trước ăn và trước ngủ.`,
    };
  }

  const warningVi =
    'CẢNH BÁO AN TOÀN: Liều insulin tính toán chỉ mang tính gợi ý tham khảo theo guideline ADA 2026. Bác sĩ điều trị bắt buộc phải hiệu chỉnh linh hoạt theo diễn biến đường huyết thực tế tại giường, lượng carbohydrate ăn vào và chức năng gan thận.';

  return {
    setting,
    outpatientStart,
    inpatientBasalBolus,
    warningVi,
    needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
  };
}
