/**
 * Independent Reference Oracle for DOAC Dosing
 * Phân quyền: Agent C
 *
 * CÀI ĐẶT ĐỘC LẬP TỪ ĐẦU (GROUND TRUTH ORACLE).
 * TUYỆT ĐỐI KHÔNG IMPORT, COPY HOẶC SUY DIỄN TỪ doacDose.ts.
 * Trích dẫn nguyên văn câu chữ chính thức từ ESC 2024 Table 11 (p. 32) và nhãn FDA tại từng nhánh logic.
 */

export interface DoacOracleInput {
  drug: 'apixaban' | 'rivaroxaban' | 'dabigatran' | 'edoxaban';
  age: number;
  weight: number;
  scrUmol: number;
  crcl: number;
  verapamil?: boolean;
  potentPgpInhibitor?: boolean;
  highBleedingRisk?: boolean;
}

export interface DoacOracleOutput {
  contraindicated: boolean;
  isDoseReduced: boolean;
  recommendedDose: string;
  hasBlackBoxWarning: boolean;
}

/**
 * GROUND TRUTH ORACLE CHO 4 THUỐC DOAC
 */
export function doacGroundTruthOracle(input: DoacOracleInput): DoacOracleOutput {
  const { drug, age, weight, scrUmol, crcl, verapamil, potentPgpInhibitor, highBleedingRisk } = input;

  switch (drug) {
    // =========================================================================
    // 1. APIXABAN (Eliquis)
    // ESC 2024 Table 11, p. 32:
    // "Standard dose: 5 mg twice daily"
    // "Two out of three needed for dose reduction: (i) age ≥80 years, (ii) body weight ≤60 kg, (iii) serum creatinine ≥133 μmol/L. Reduced dose: 2.5 mg twice daily"
    // EMA SmPC / ESC 2024 p. 32:
    // "In patients with severe renal impairment (CrCl 15–29 mL/min), the reduced dose of 2.5 mg twice daily should be used."
    // "Contraindicated if CrCl < 15 mL/min"
    // =========================================================================
    case 'apixaban': {
      // Nhánh chống chỉ định: CrCl < 15 mL/min
      if (crcl < 15) {
        return {
          contraindicated: true,
          isDoseReduced: false,
          recommendedDose: 'Chống chỉ định (CrCl < 15 mL/min)',
          hasBlackBoxWarning: false,
        };
      }

      // Đếm 3 tiêu chí kinh điển ABC (Age, Body weight, Creatinine):
      let abcCount = 0;
      if (age >= 80) abcCount++;
      if (weight <= 60) abcCount++;
      if (scrUmol >= 133) abcCount++; // 133 µmol/L ~ 1.5 mg/dL

      // Tiêu chí thận đơn độc: CrCl 15-29 mL/min (theo nhãn EMA và ESC 2024)
      const renalImpairmentReduction = crcl >= 15 && crcl <= 29;

      if (abcCount >= 2 || renalImpairmentReduction) {
        return {
          contraindicated: false,
          isDoseReduced: true,
          recommendedDose: '2.5 mg x 2 lần/ngày',
          hasBlackBoxWarning: false,
        };
      }

      return {
        contraindicated: false,
        isDoseReduced: false,
        recommendedDose: '5 mg x 2 lần/ngày',
        hasBlackBoxWarning: false,
      };
    }

    // =========================================================================
    // 2. RIVAROXABAN (Xarelto)
    // ESC 2024 Table 11, p. 32:
    // "Standard dose: 20 mg once daily"
    // "Dose reduction: moderate or severe renal impairment (creatinine clearance 15–49 mL/min). Reduced dose: 15 mg once daily"
    // "Contraindicated if CrCl < 15 mL/min"
    // =========================================================================
    case 'rivaroxaban': {
      if (crcl < 15) {
        return {
          contraindicated: true,
          isDoseReduced: false,
          recommendedDose: 'Chống chỉ định (CrCl < 15 mL/min)',
          hasBlackBoxWarning: false,
        };
      }

      // Suy thận CrCl 15 - 49 mL/min -> giảm còn 15 mg x 1 lần/ngày
      if (crcl >= 15 && crcl <= 49) {
        return {
          contraindicated: false,
          isDoseReduced: true,
          recommendedDose: '15 mg x 1 lần/ngày (uống cùng bữa ăn)',
          hasBlackBoxWarning: false,
        };
      }

      return {
        contraindicated: false,
        isDoseReduced: false,
        recommendedDose: '20 mg x 1 lần/ngày (uống cùng bữa ăn)',
        hasBlackBoxWarning: false,
      };
    }

    // =========================================================================
    // 3. DABIGATRAN (Pradaxa)
    // ESC 2024 Table 11, p. 32:
    // "Standard dose: 150 mg twice daily"
    // "Dose reduction recommended if any apply: (i) age ≥80 years, (ii) receiving concomitant verapamil."
    // "Dose reduction considered on an individual basis if any apply: (i) age 75–80, (ii) moderate renal impairment (creatinine clearance 30–50 mL/min), (iii) others at increased risk of bleeding. Reduced dose: 110 mg twice daily"
    // "Contraindicated if CrCl < 30 mL/min"
    // =========================================================================
    case 'dabigatran': {
      if (crcl < 30) {
        return {
          contraindicated: true,
          isDoseReduced: false,
          recommendedDose: 'Chống chỉ định (CrCl < 30 mL/min)',
          hasBlackBoxWarning: false,
        };
      }

      // Tiêu chí bắt buộc hoặc cân nhắc giảm liều:
      // (1) Tuổi >= 80
      // (2) Dùng Verapamil
      // (3) Suy thận CrCl 30 - 49 mL/min
      // (4) Tiền sử hoặc nguy cơ xuất huyết cao
      const reduceDabigatran =
        age >= 80 ||
        Boolean(verapamil) ||
        (crcl >= 30 && crcl <= 49) ||
        Boolean(highBleedingRisk);

      if (reduceDabigatran) {
        return {
          contraindicated: false,
          isDoseReduced: true,
          recommendedDose: '110 mg x 2 lần/ngày',
          hasBlackBoxWarning: false,
        };
      }

      return {
        contraindicated: false,
        isDoseReduced: false,
        recommendedDose: '150 mg x 2 lần/ngày',
        hasBlackBoxWarning: false,
      };
    }

    // =========================================================================
    // 4. EDOXABAN (Savaysa / Lixiana)
    // ESC 2024 Table 11, p. 32:
    // "Standard dose: 60 mg once daily"
    // "Dose reduction if any apply: (i) moderate or severe renal impairment (creatinine clearance 15–50 mL/min), (ii) body weight ≤60 kg, (iii) concomitant P-gp inhibitors. Reduced dose: 30 mg once daily"
    // "Contraindicated if CrCl < 15 mL/min"
    // FDA Boxed Warning:
    // "Reduced efficacy in nonvalvular AF patients with CrCl > 95 mL/min"
    // =========================================================================
    case 'edoxaban': {
      if (crcl < 15) {
        return {
          contraindicated: true,
          isDoseReduced: false,
          recommendedDose: 'Chống chỉ định (CrCl < 15 mL/min)',
          hasBlackBoxWarning: false,
        };
      }

      // Giảm liều nếu có bất kỳ tiêu chí nào trong 3 tiêu chí:
      const reduceEdoxaban =
        (crcl >= 15 && crcl <= 50) ||
        weight <= 60 ||
        Boolean(potentPgpInhibitor);

      // Cảnh báo hộp đen FDA khi CrCl > 95 mL/min
      const hasBlackBoxWarning = crcl > 95;

      return {
        contraindicated: false,
        isDoseReduced: reduceEdoxaban,
        recommendedDose: reduceEdoxaban ? '30 mg x 1 lần/ngày' : '60 mg x 1 lần/ngày',
        hasBlackBoxWarning,
      };
    }
  }
}
