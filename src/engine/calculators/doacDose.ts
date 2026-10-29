/**
 * Tiêu chí Giảm liều và Chống chỉ định Thuốc Chống Đông Đường Uống Thế Hệ Mới (DOAC)
 * Phân quyền: Agent D / Agent B
 *
 * Tiêu chuẩn:
 * - Nhãn thuốc FDA, EMA và Hướng dẫn Bộ Y tế Việt Nam / ESC 2024 / ACC-AHA 2023 cho 4 thuốc:
 *   1. Apixaban (Eliquis)
 *   2. Rivaroxaban (Xarelto)
 *   3. Dabigatran (Pradaxa)
 *   4. Edoxaban (Lixiana / Savaysa)
 * - Ưu tiên kiểm tra `onDialysis === true` TRƯỚC chỉ số CrCl để không bị đánh lừa bởi Creatinin sau lọc máu.
 */

import type { DoacDoseInput, DoacDoseResult, SourceCitationInfo } from './types';
import { convertScrToMgDl } from './egfr';

export const COEFFICIENTS = {
  source: {
    organization: 'ESC 2024 / ACC-AHA 2023 / FDA / EMA',
    guideline: 'ESC 2024 AF Guidelines, 2023 ACC/AHA/ACCP/HRS AF Guideline & Prescribing Information',
    year: 2024,
    locator: 'ESC 2024 AF Guidelines, Section 6.2, p. 32; ACC/AHA 2023 AF Section 6.5.2; FDA Product Labels',
    doiOrUrl: 'https://doi.org/10.1093/eurheartj/ehae178',
    notesVi: 'Tiêu chuẩn giảm liều chính thức từ nhãn FDA/EMA, ESC 2024 và ACC/AHA 2023',
    needsSourceVerification: false,
  } satisfies SourceCitationInfo,

  apixaban: {
    standardDose: '5 mg x 2 lần/ngày',
    reducedDose: '2.5 mg x 2 lần/ngày',
    criteriaAgeThreshold: 80,
    criteriaWeightThresholdKg: 60,
    criteriaScrThresholdMgDl: 1.5, // 132.63 µmol/L (hệ số 88.42)
    criteriaRequiredCount: 2, // Ít nhất 2 trong 3 tiêu chí ABC
    renalReductionCrclUpperExclusive: 30, // CrCl 15 - <30 mL/min theo EMA/ESC
    contraindicatedCrclMin: 15,
  },

  rivaroxaban: {
    standardDose: '20 mg x 1 lần/ngày (uống cùng bữa ăn)',
    reducedDose: '15 mg x 1 lần/ngày (uống cùng bữa ăn)',
    renalReductionCrclMin: 15,
    renalReductionCrclUpperExclusive: 50, // CrCl 15 - <50 mL/min
    contraindicatedCrclMin: 15,
  },

  dabigatran: {
    standardDose: '150 mg x 2 lần/ngày',
    reducedDose: '110 mg x 2 lần/ngày',
    usSevereRenalDose: '75 mg x 2 lần/ngày',
    ageMandatoryReducedThreshold: 80,
    ageConsiderReducedThreshold: 75,
    renalReductionCrclMin: 30,
    renalReductionCrclUpperExclusive: 50, // CrCl 30 - <50 mL/min
    contraindicatedCrclMin: 30, // Chống chỉ định tại Châu Âu / Việt Nam nếu CrCl < 30
    usContraindicatedCrclMin: 15,
  },

  edoxaban: {
    standardDose: '60 mg x 1 lần/ngày',
    reducedDose: '30 mg x 1 lần/ngày',
    weightThresholdKg: 60,
    renalReductionCrclMin: 15,
    renalReductionCrclMax: 50,
    fdaHighCrclThreshold: 95, // Cảnh báo CrCl > 95 mL/min
    contraindicatedCrclMin: 15,
  },
};

/**
 * Đánh giá liều tối ưu cho thuốc DOAC
 */
export function computeDoacDose(input: DoacDoseInput): DoacDoseResult {
  const scrUnit = input.scrUnit ?? 'umol/L';
  const profile = input.profile ?? 'INTL';
  const scrMgDl = convertScrToMgDl(input.scr, scrUnit);
  const reductionCriteriaMet: string[] = [];
  let isDoseReduced = false;
  let contraindicated = false;
  let recommendedDose = '';
  let standardDose = COEFFICIENTS[input.drug].standardDose;
  let warning: string | undefined;
  let profileDiff: string | undefined;

  // 0. AF-R2-R3-03 & AF-R2-R3-16: Kiểm tra lọc máu chu kỳ TRƯỚC CrCl (không bị nhiễu bởi Creatinin giả tạo sau chạy thận)
  if (input.onDialysis === true) {
    if (profile === 'US' && input.drug === 'apixaban') {
      const cfg = COEFFICIENTS.apixaban;
      if (input.age >= cfg.criteriaAgeThreshold) {
        reductionCriteriaMet.push(`Tuổi ≥ ${cfg.criteriaAgeThreshold} (${input.age} tuổi — lọc máu FDA)`);
      }
      if (input.weight <= cfg.criteriaWeightThresholdKg) {
        reductionCriteriaMet.push(`Cân nặng ≤ ${cfg.criteriaWeightThresholdKg} kg (${input.weight} kg — lọc máu FDA)`);
      }
      if (reductionCriteriaMet.length >= 1) {
        isDoseReduced = true;
        recommendedDose = cfg.reducedDose;
      } else {
        recommendedDose = cfg.standardDose;
      }
      warning =
        'Đang lọc máu chu kỳ: Theo ACC/AHA 2023 & nhãn FDA Eliquis (§8.6), có thể cân nhắc Apixaban (giảm còn 2.5 mg x 2 lần/ngày nếu tuổi ≥ 80 HOẶC cân nặng ≤ 60 kg); theo dõi sát nguy cơ xuất huyết.';
      profileDiff =
        'Khác biệt US vs INTL/VN: ACC/AHA 2023 (Class 2b) & nhãn FDA cho phép cân nhắc Apixaban trên lọc máu chu kỳ, trong khi ESC 2024 / EMA / Bộ Y tế khuyến cáo tránh DOAC trên lọc máu và ưu tiên kháng vitamin K.';
      return {
        drug: input.drug,
        standardDose,
        recommendedDose,
        isDoseReduced,
        reductionCriteriaMet,
        contraindicated: false,
        warning,
        profileDiff,
        source: COEFFICIENTS.source.locator,
        needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
      };
    }

    contraindicated = true;
    recommendedDose = 'Chống chỉ định / Tránh dùng (Đang lọc máu chu kỳ)';
    warning =
      profile === 'US'
        ? `Bệnh nhân đang lọc máu chu kỳ (ESRD): ACC/AHA 2023 khuyến cáo tránh ${input.drug}; cân nhắc Warfarin hoặc Apixaban theo nhãn FDA.`
        : `Bệnh nhân đang lọc máu chu kỳ (ESRD): ESC 2024 và Bộ Y tế khuyến cáo tránh ${input.drug} bất kể chỉ số CrCl sau lọc; ưu tiên kháng vitamin K (Warfarin/Acenocoumarol) kiểm soát chặt INR.`;
    profileDiff =
      profile === 'US'
        ? 'Tại Hoa Kỳ (ACC/AHA 2023), Dabigatran và Edoxaban chống chỉ định trên lọc máu; ưu tiên Warfarin hoặc Apixaban (không ưu tiên Rivaroxaban do thiếu dữ liệu kết cục lâm sàng thuận lợi).'
        : 'Tại Hoa Kỳ (ACC/AHA 2023 / nhãn FDA Eliquis), có thể cân nhắc Apixaban (5 mg hoặc 2.5 mg x 2 lần/ngày nếu tuổi ≥ 80 hoặc cân nặng ≤ 60 kg) ở bệnh nhân chạy thận nhân tạo chu kỳ.';

    return {
      drug: input.drug,
      standardDose,
      recommendedDose,
      isDoseReduced: false,
      reductionCriteriaMet,
      contraindicated,
      warning,
      profileDiff,
      source: COEFFICIENTS.source.locator,
      needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
    };
  }

  switch (input.drug) {
    case 'apixaban': {
      const cfg = COEFFICIENTS.apixaban;
      standardDose = cfg.standardDose;

      if (input.crcl < cfg.contraindicatedCrclMin) {
        contraindicated = true;
        recommendedDose = 'Chống chỉ định (CrCl < 15 mL/min)';
        warning = 'Chống chỉ định apixaban ở bệnh nhân có CrCl < 15 mL/min hoặc lọc máu theo nhãn EMA và ESC 2024.';
        break;
      }

      let criteriaCount = 0;
      if (input.age >= cfg.criteriaAgeThreshold) {
        criteriaCount++;
        reductionCriteriaMet.push(`Tuổi ≥ ${cfg.criteriaAgeThreshold} (${input.age} tuổi)`);
      }
      if (input.weight <= cfg.criteriaWeightThresholdKg) {
        criteriaCount++;
        reductionCriteriaMet.push(`Cân nặng ≤ ${cfg.criteriaWeightThresholdKg} kg (${input.weight} kg)`);
      }
      if (scrMgDl >= cfg.criteriaScrThresholdMgDl) {
        criteriaCount++;
        reductionCriteriaMet.push(`Creatinin máu ≥ ${cfg.criteriaScrThresholdMgDl} mg/dL (${scrMgDl.toFixed(2)} mg/dL)`);
      }

      const inCrcl15To30 = input.crcl < cfg.renalReductionCrclUpperExclusive;
      const renalOnlyReduction = profile !== 'US' && inCrcl15To30;
      if (renalOnlyReduction) {
        reductionCriteriaMet.push(`CrCl 15 - <30 mL/min (${input.crcl.toFixed(1)} mL/min, theo nhãn EMA/ESC)`);
      } else if (profile === 'US' && inCrcl15To30 && criteriaCount < cfg.criteriaRequiredCount) {
        profileDiff =
          'Khác biệt FDA Hoa Kỳ vs EMA/ESC: Khi CrCl 15–29 mL/min nhưng chỉ thỏa < 2 tiêu chí ABC, nhãn FDA giữ liều 5 mg x 2 lần/ngày trong khi EMA/ESC 2024 giảm xuống 2.5 mg x 2 lần/ngày.';
      }

      if (criteriaCount >= cfg.criteriaRequiredCount || renalOnlyReduction) {
        isDoseReduced = true;
        recommendedDose = cfg.reducedDose;
      } else {
        recommendedDose = cfg.standardDose;
      }
      break;
    }

    case 'rivaroxaban': {
      const cfg = COEFFICIENTS.rivaroxaban;
      standardDose = cfg.standardDose;

      if (input.crcl < cfg.contraindicatedCrclMin) {
        contraindicated = true;
        recommendedDose = 'Chống chỉ định (CrCl < 15 mL/min)';
        warning = 'Chống chỉ định rivaroxaban khi CrCl < 15 mL/min.';
        break;
      }

      if (input.crcl < cfg.renalReductionCrclUpperExclusive) {
        isDoseReduced = true;
        recommendedDose = cfg.reducedDose;
        reductionCriteriaMet.push(`CrCl 15 - <50 mL/min (${input.crcl.toFixed(1)} mL/min)`);
      } else {
        recommendedDose = cfg.standardDose;
      }
      break;
    }

    case 'dabigatran': {
      const cfg = COEFFICIENTS.dabigatran;
      standardDose = cfg.standardDose;

      if (profile === 'US' && input.crcl >= cfg.usContraindicatedCrclMin && input.crcl < cfg.contraindicatedCrclMin) {
        if (input.potentPgpInhibitor) {
          contraindicated = true;
          recommendedDose = 'Chống chỉ định (CrCl 15–29 mL/min kèm ức chế P-gp mạnh)';
          warning =
            'Nhãn FDA Pradaxa chống chỉ định phối hợp Dabigatran với chất ức chế P-gp mạnh (dronedarone, ketoconazole đường toàn thân) khi CrCl < 30 mL/min.';
        } else {
          isDoseReduced = true;
          recommendedDose = cfg.usSevereRenalDose;
          reductionCriteriaMet.push(`CrCl 15 - <30 mL/min (${input.crcl.toFixed(1)} mL/min — liều FDA Hoa Kỳ 75 mg x 2 lần/ngày)`);
          warning =
            'Liều FDA Hoa Kỳ cho CrCl 15–30 mL/min dựa trên mô hình dược động học (không có thử nghiệm kết cục lâm sàng ngẫu nhiên); cân nhắc ưu tiên Apixaban hoặc Warfarin.';
          profileDiff =
            'Khác biệt FDA Hoa Kỳ vs ESC/VN: Nhãn FDA Pradaxa cho phép liều 75 mg x 2 lần/ngày ở CrCl 15–30 mL/min, trong khi ESC 2024 / EMA / Bộ Y tế chống chỉ định Dabigatran khi CrCl < 30 mL/min.';
        }
        break;
      }

      if (input.crcl < cfg.contraindicatedCrclMin) {
        contraindicated = true;
        recommendedDose = 'Chống chỉ định (CrCl < 30 mL/min)';
        warning = 'Chống chỉ định dabigatran khi CrCl < 30 mL/min theo khuyến cáo chính thức của EMA và Bộ Y tế.';
        if (input.crcl >= 15) {
          profileDiff =
            'Khác biệt ESC/VN vs FDA Hoa Kỳ: ESC 2024 / EMA / Bộ Y tế chống chỉ định Dabigatran khi CrCl < 30 mL/min, trong khi nhãn FDA Hoa Kỳ có chế độ liều 75 mg x 2 lần/ngày cho CrCl 15–30 mL/min.';
        }
        break;
      }

      if (input.age >= cfg.ageMandatoryReducedThreshold) {
        isDoseReduced = true;
        reductionCriteriaMet.push(`Tuổi ≥ ${cfg.ageMandatoryReducedThreshold} (${input.age} tuổi)`);
      }
      if (input.verapamil) {
        isDoseReduced = true;
        reductionCriteriaMet.push('Dùng đồng thời với verapamil (tương tác tăng nồng độ dabigatran)');
      }
      if (input.crcl >= cfg.renalReductionCrclMin && input.crcl < cfg.renalReductionCrclUpperExclusive) {
        isDoseReduced = true;
        reductionCriteriaMet.push(`CrCl 30 - <50 mL/min (${input.crcl.toFixed(1)} mL/min)`);
      }
      if (input.highBleedingRisk) {
        isDoseReduced = true;
        reductionCriteriaMet.push('Nguy cơ xuất huyết cao (tiền sử xuất huyết tiêu hóa, viêm loét)');
      }

      if (isDoseReduced) {
        recommendedDose = cfg.reducedDose;
      } else {
        recommendedDose = cfg.standardDose;
      }
      break;
    }

    case 'edoxaban': {
      const cfg = COEFFICIENTS.edoxaban;
      standardDose = cfg.standardDose;

      if (input.crcl < cfg.contraindicatedCrclMin) {
        contraindicated = true;
        recommendedDose = 'Chống chỉ định (CrCl < 15 mL/min)';
        warning = 'Chống chỉ định edoxaban khi CrCl < 15 mL/min.';
        break;
      }

      if (input.crcl <= cfg.renalReductionCrclMax) {
        isDoseReduced = true;
        reductionCriteriaMet.push(`CrCl 15 - 50 mL/min (${input.crcl.toFixed(1)} mL/min)`);
      }
      if (input.weight <= cfg.weightThresholdKg) {
        isDoseReduced = true;
        reductionCriteriaMet.push(`Cân nặng ≤ ${cfg.weightThresholdKg} kg (${input.weight} kg)`);
      }
      if (input.potentPgpInhibitor) {
        isDoseReduced = true;
        reductionCriteriaMet.push('Dùng đồng thời chất ức chế P-gp mạnh (cyclosporine, dronedarone, erythromycin, ketoconazole)');
      }

      if (isDoseReduced) {
        recommendedDose = cfg.reducedDose;
      } else {
        recommendedDose = cfg.standardDose;
      }

      if (input.crcl > cfg.fdaHighCrclThreshold) {
        warning = `Cảnh báo: Bệnh nhân có CrCl rất cao (${input.crcl.toFixed(1)} > 95 mL/min). FDA Hoa Kỳ đưa ra cảnh báo hộp đen (Black Box Warning) về nguy cơ giảm hiệu lực phòng ngừa đột quỵ của edoxaban so với warfarin ở nhóm bệnh nhân thanh thải thận tăng cao này.`;
      }
      break;
    }
  }

  return {
    drug: input.drug,
    standardDose,
    recommendedDose,
    isDoseReduced,
    reductionCriteriaMet,
    contraindicated,
    warning,
    profileDiff,
    source: COEFFICIENTS.source.locator,
    needsSourceVerification: COEFFICIENTS.source.needsSourceVerification,
  };
}
