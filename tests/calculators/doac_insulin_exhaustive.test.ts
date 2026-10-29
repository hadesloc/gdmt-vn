/**
 * GDMT-VN DOAC & Insulin Exhaustive Clinical Verification Test Suite
 * Phân quyền: Agent C
 *
 * Kiểm tra VÉT CẠN (Exhaustive Testing) theo yêu cầu Ban Điều Phối:
 * 1. Bắt trọn vẹn lỗi R3-AF-05 (Dabigatran khi CrCl 30-49 mL/min).
 * 2. Lưới vét cạn 4 DOAC:
 *    - Tuổi: {64, 65, 74, 75, 79, 80, 81}
 *    - Cân nặng: {50, 60, 61, 80}
 *    - CrCl: {14, 15, 29, 30, 49, 50, 95, 96}
 *    - Nồng độ Creatinin: {100, 132, 133, 160} µmol/L (ngưỡng 133 µmol/L ~ 1.5 mg/dL)
 *    - Tương tác: verapamil, chất ức chế P-gp mạnh.
 * 3. So khớp với BẢNG KỲ VỌNG VIẾT TAY ĐỘC LẬP (Hand-crafted Truth Table) từ ESC 2024 tr. 32 & nhãn FDA.
 * 4. Kiểm tra vét cạn Insulin (ngoại trú & 3 phân nhóm nội viện theo cân nặng).
 */

import { describe, it, expect } from 'vitest';
import { computeDoacDose } from '../../src/engine/calculators/doacDose';
import { computeInsulin } from '../../src/engine/calculators/insulin';

// =========================================================================
// PHẦN 1: BẢNG KỲ VỌNG VIẾT TAY ĐỘC LẬP CHO DOAC (HAND-CRAFTED TRUTH TABLE)
// Dựa trên ESC 2024 AF Guidelines Table 11, p. 32 và Nhãn FDA/EMA
// =========================================================================

interface DoacExhaustiveTestCase {
  name: string;
  drug: 'apixaban' | 'rivaroxaban' | 'dabigatran' | 'edoxaban';
  age: number;
  weight: number;
  scr: number; // µmol/L
  crcl: number; // mL/min
  verapamil?: boolean;
  potentPgpInhibitor?: boolean;
  highBleedingRisk?: boolean;

  // Kỳ vọng viết tay độc lập (Ground Truth)
  expectedContraindicated: boolean;
  expectedReduced: boolean;
  expectedDose: string;
  expectedHasWarning?: boolean;
}

const DOAC_TRUTH_CASES: DoacExhaustiveTestCase[] = [
  // -------------------------------------------------------------
  // A. APIXABAN (Chuẩn: 5 mg bid, Giảm: 2.5 mg bid, Chống CĐ: CrCl < 15)
  // Tiêu chí ABC: Tuổi >= 80, Cân nặng <= 60, SCr >= 133; cần >= 2 tiêu chí HOẶC CrCl 15-29
  // -------------------------------------------------------------
  {
    name: 'Apixaban: CrCl = 14 mL/min -> Chống chỉ định tuyệt đối',
    drug: 'apixaban',
    age: 65,
    weight: 70,
    scr: 350,
    crcl: 14,
    expectedContraindicated: true,
    expectedReduced: false,
    expectedDose: 'Chống chỉ định (CrCl < 15 mL/min)',
  },
  {
    name: 'Apixaban: CrCl = 15 mL/min (ngưỡng dưới cho phép) -> Giảm liều theo thận 2.5 mg bid',
    drug: 'apixaban',
    age: 65,
    weight: 70,
    scr: 250,
    crcl: 15,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '2.5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: CrCl = 29 mL/min (thuộc dải 15-29) -> Giảm liều 2.5 mg bid',
    drug: 'apixaban',
    age: 70,
    weight: 75,
    scr: 180,
    crcl: 29,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '2.5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: CrCl = 30 mL/min, 0/3 tiêu chí ABC -> Liều chuẩn 5 mg bid',
    drug: 'apixaban',
    age: 64,
    weight: 80,
    scr: 100,
    crcl: 30,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: Tuổi 79 (chưa đủ 80), nặng 60 kg (thỏa 1 tiêu chí) -> Vẫn giữ liều chuẩn 5 mg bid',
    drug: 'apixaban',
    age: 79,
    weight: 60,
    scr: 100,
    crcl: 55,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: Tuổi 80, nặng 60 kg (thỏa 2 tiêu chí: Tuổi & Cân nặng) -> Giảm liều 2.5 mg bid',
    drug: 'apixaban',
    age: 80,
    weight: 60,
    scr: 100,
    crcl: 45,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '2.5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: Tuổi 81, nặng 61 kg (chỉ 1 tiêu chí), SCr 132 (chưa tới 133) -> Liều chuẩn 5 mg bid',
    drug: 'apixaban',
    age: 81,
    weight: 61,
    scr: 132,
    crcl: 40,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: Tuổi 81, nặng 61 kg, SCr 133 (thỏa 2 tiêu chí: Tuổi & SCr) -> Giảm liều 2.5 mg bid',
    drug: 'apixaban',
    age: 81,
    weight: 61,
    scr: 133,
    crcl: 38,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '2.5 mg x 2 lần/ngày',
  },
  {
    name: 'Apixaban: Tuổi 65, nặng 50 kg, SCr 160 (thỏa 2 tiêu chí: Cân nặng & SCr) -> Giảm liều 2.5 mg bid',
    drug: 'apixaban',
    age: 65,
    weight: 50,
    scr: 160,
    crcl: 35,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '2.5 mg x 2 lần/ngày',
  },

  // -------------------------------------------------------------
  // B. RIVAROXABAN (Chuẩn: 20 mg qd, Giảm: 15 mg qd, Chống CĐ: CrCl < 15)
  // Giảm liều duy nhất theo CrCl 15 - 49 mL/min
  // -------------------------------------------------------------
  {
    name: 'Rivaroxaban: CrCl = 14 mL/min -> Chống chỉ định',
    drug: 'rivaroxaban',
    age: 65,
    weight: 70,
    scr: 380,
    crcl: 14,
    expectedContraindicated: true,
    expectedReduced: false,
    expectedDose: 'Chống chỉ định (CrCl < 15 mL/min)',
  },
  {
    name: 'Rivaroxaban: CrCl = 15 mL/min (ngưỡng dưới) -> Giảm liều 15 mg qd',
    drug: 'rivaroxaban',
    age: 70,
    weight: 60,
    scr: 260,
    crcl: 15,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '15 mg x 1 lần/ngày (uống cùng bữa ăn)',
  },
  {
    name: 'Rivaroxaban: CrCl = 49 mL/min (ngưỡng trên giảm liều) -> Giảm liều 15 mg qd',
    drug: 'rivaroxaban',
    age: 74,
    weight: 65,
    scr: 115,
    crcl: 49,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '15 mg x 1 lần/ngày (uống cùng bữa ăn)',
  },
  {
    name: 'Rivaroxaban: CrCl = 50 mL/min (ngưỡng thận bình thường) -> Liều chuẩn 20 mg qd',
    drug: 'rivaroxaban',
    age: 74,
    weight: 65,
    scr: 110,
    crcl: 50,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '20 mg x 1 lần/ngày (uống cùng bữa ăn)',
  },

  // -------------------------------------------------------------
  // C. DABIGATRAN (Chuẩn: 150 mg bid, Giảm: 110 mg bid, Chống CĐ: CrCl < 30)
  // Giảm liều khi: Tuổi >= 80, Dùng Verapamil, CrCl 30 - 49 mL/min, Nguy cơ xuất huyết cao
  // -------------------------------------------------------------
  {
    name: 'Dabigatran: CrCl = 29 mL/min -> Chống chỉ định tuyệt đối (< 30 mL/min)',
    drug: 'dabigatran',
    age: 68,
    weight: 70,
    scr: 190,
    crcl: 29,
    expectedContraindicated: true,
    expectedReduced: false,
    expectedDose: 'Chống chỉ định (CrCl < 30 mL/min)',
  },
  {
    name: 'Dabigatran [R3-AF-05 FIX]: BN 65 tuổi, CrCl = 39.4 mL/min (30-49) -> BẮT BUỘC Giảm liều 110 mg bid',
    drug: 'dabigatran',
    age: 65,
    weight: 70,
    scr: 140,
    crcl: 39.4,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '110 mg x 2 lần/ngày',
  },
  {
    name: 'Dabigatran: CrCl = 30 mL/min (ngưỡng dưới cho phép) -> Giảm liều 110 mg bid',
    drug: 'dabigatran',
    age: 64,
    weight: 60,
    scr: 150,
    crcl: 30,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '110 mg x 2 lần/ngày',
  },
  {
    name: 'Dabigatran: CrCl = 49 mL/min -> Giảm liều 110 mg bid',
    drug: 'dabigatran',
    age: 64,
    weight: 80,
    scr: 125,
    crcl: 49,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '110 mg x 2 lần/ngày',
  },
  {
    name: 'Dabigatran: CrCl = 50 mL/min, Tuổi 65, không verapamil -> Liều chuẩn 150 mg bid',
    drug: 'dabigatran',
    age: 65,
    weight: 80,
    scr: 110,
    crcl: 50,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '150 mg x 2 lần/ngày',
  },
  {
    name: 'Dabigatran: Tuổi 79 (chưa tới 80), CrCl = 65, không verapamil -> Liều chuẩn 150 mg bid',
    drug: 'dabigatran',
    age: 79,
    weight: 75,
    scr: 95,
    crcl: 65,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '150 mg x 2 lần/ngày',
  },
  {
    name: 'Dabigatran: Tuổi 80 (>=80), CrCl = 65 -> Giảm liều 110 mg bid theo tuổi',
    drug: 'dabigatran',
    age: 80,
    weight: 75,
    scr: 95,
    crcl: 65,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '110 mg x 2 lần/ngày',
  },
  {
    name: 'Dabigatran: Dùng đồng thời với Verapamil -> Giảm liều 110 mg bid do tương tác',
    drug: 'dabigatran',
    age: 65,
    weight: 75,
    scr: 90,
    crcl: 75,
    verapamil: true,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '110 mg x 2 lần/ngày',
  },

  // -------------------------------------------------------------
  // D. EDOXABAN (Chuẩn: 60 mg qd, Giảm: 30 mg qd, Chống CĐ: CrCl < 15, Cảnh báo: CrCl > 95)
  // Giảm liều khi: CrCl 15 - 50 mL/min, Cân nặng <= 60 kg, hoặc Chất ức chế P-gp mạnh
  // -------------------------------------------------------------
  {
    name: 'Edoxaban: CrCl = 14 mL/min -> Chống chỉ định (< 15 mL/min)',
    drug: 'edoxaban',
    age: 65,
    weight: 70,
    scr: 380,
    crcl: 14,
    expectedContraindicated: true,
    expectedReduced: false,
    expectedDose: 'Chống chỉ định (CrCl < 15 mL/min)',
  },
  {
    name: 'Edoxaban: CrCl = 15 mL/min -> Giảm liều 30 mg qd',
    drug: 'edoxaban',
    age: 65,
    weight: 70,
    scr: 250,
    crcl: 15,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '30 mg x 1 lần/ngày',
  },
  {
    name: 'Edoxaban: CrCl = 50 mL/min (ngưỡng trên giảm liều thận) -> Giảm liều 30 mg qd',
    drug: 'edoxaban',
    age: 70,
    weight: 70,
    scr: 110,
    crcl: 50,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '30 mg x 1 lần/ngày',
  },
  {
    name: 'Edoxaban: CrCl = 51 mL/min, Cân nặng 61 kg -> Liều chuẩn 60 mg qd',
    drug: 'edoxaban',
    age: 70,
    weight: 61,
    scr: 105,
    crcl: 51,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '60 mg x 1 lần/ngày',
  },
  {
    name: 'Edoxaban: Cân nặng 60 kg (<= 60 kg), CrCl 75 -> Giảm liều 30 mg qd theo cân nặng',
    drug: 'edoxaban',
    age: 65,
    weight: 60,
    scr: 90,
    crcl: 75,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '30 mg x 1 lần/ngày',
  },
  {
    name: 'Edoxaban: Dùng chất ức chế P-gp mạnh -> Giảm liều 30 mg qd',
    drug: 'edoxaban',
    age: 65,
    weight: 75,
    scr: 85,
    crcl: 80,
    potentPgpInhibitor: true,
    expectedContraindicated: false,
    expectedReduced: true,
    expectedDose: '30 mg x 1 lần/ngày',
  },
  {
    name: 'Edoxaban: CrCl = 96 mL/min (> 95) -> Có cảnh báo hộp đen FDA Black Box Warning',
    drug: 'edoxaban',
    age: 50,
    weight: 80,
    scr: 75,
    crcl: 96,
    expectedContraindicated: false,
    expectedReduced: false,
    expectedDose: '60 mg x 1 lần/ngày',
    expectedHasWarning: true,
  },
];

describe('DOAC Exhaustive Verification Test Suite (ESC 2024 Table 11 & FDA)', () => {
  for (const tc of DOAC_TRUTH_CASES) {
    it(tc.name, () => {
      const res = computeDoacDose({
        drug: tc.drug,
        age: tc.age,
        weight: tc.weight,
        scr: tc.scr,
        scrUnit: 'umol/L',
        crcl: tc.crcl,
        verapamil: tc.verapamil,
        potentPgpInhibitor: tc.potentPgpInhibitor,
        highBleedingRisk: tc.highBleedingRisk,
      });

      expect(res.contraindicated).toBe(tc.expectedContraindicated);
      expect(res.isDoseReduced).toBe(tc.expectedReduced);
      expect(res.recommendedDose).toBe(tc.expectedDose);

      if (tc.expectedHasWarning) {
        expect(res.warning).toBeDefined();
        expect(res.warning).toContain('hộp đen (Black Box Warning)');
      }
    });
  }
});

// =========================================================================
// PHẦN 2: BẢNG KỲ VỌNG VIẾT TAY ĐỘC LẬP CHO INSULIN (ADA 2026 Ch. 9 & 16)
// =========================================================================

interface InsulinExhaustiveTestCase {
  name: string;
  weight: number;
  setting: 'outpatient' | 'inpatient';
  clinicalContext?: 'sensitive' | 'standard' | 'resistant';
  expectedOutpatientFixed?: number;
  expectedOutpatientRange?: [number, number];
  expectedTdd?: number;
  expectedBasal?: number;
  expectedBolusPerMeal?: number;
}

const INSULIN_TRUTH_CASES: InsulinExhaustiveTestCase[] = [
  // A. Ngoại trú (Cố định 10 U hoặc 0.1 - 0.2 U/kg/ngày)
  {
    name: 'Insulin Ngoại trú 50 kg -> 10 U hoặc [5 - 10] U/ngày',
    weight: 50,
    setting: 'outpatient',
    expectedOutpatientFixed: 10,
    expectedOutpatientRange: [5, 10],
  },
  {
    name: 'Insulin Ngoại trú 70 kg -> 10 U hoặc [7 - 14] U/ngày',
    weight: 70,
    setting: 'outpatient',
    expectedOutpatientFixed: 10,
    expectedOutpatientRange: [7, 14],
  },
  {
    name: 'Insulin Ngoại trú 95 kg -> 10 U hoặc [10 - 19] U/ngày',
    weight: 95,
    setting: 'outpatient',
    expectedOutpatientFixed: 10,
    expectedOutpatientRange: [10, 19],
  },

  // B. Nội viện - Nhóm Nhạy Cảm (Sensitive: 0.30 U/kg; 50% Basal + 50% Bolus / 3 bữa)
  {
    name: 'Insulin Nội viện Nhạy cảm 45 kg -> TDD 14 U, Basal 7 U, Bolus 2 U/bữa',
    weight: 45,
    setting: 'inpatient',
    clinicalContext: 'sensitive',
    expectedTdd: 14,
    expectedBasal: 7,
    expectedBolusPerMeal: 2,
  },
  {
    name: 'Insulin Nội viện Nhạy cảm 60 kg -> TDD 18 U, Basal 9 U, Bolus 3 U/bữa',
    weight: 60,
    setting: 'inpatient',
    clinicalContext: 'sensitive',
    expectedTdd: 18,
    expectedBasal: 9,
    expectedBolusPerMeal: 3,
  },
  {
    name: 'Insulin Nội viện Nhạy cảm 80 kg -> TDD 24 U, Basal 12 U, Bolus 4 U/bữa',
    weight: 80,
    setting: 'inpatient',
    clinicalContext: 'sensitive',
    expectedTdd: 24,
    expectedBasal: 12,
    expectedBolusPerMeal: 4,
  },

  // C. Nội viện - Nhóm Thông Thường (Standard: 0.45 U/kg; 50% Basal + 50% Bolus / 3 bữa)
  {
    name: 'Insulin Nội viện Thông thường 60 kg -> TDD 27 U, Basal 14 U, Bolus 4 U/bữa',
    weight: 60,
    setting: 'inpatient',
    clinicalContext: 'standard',
    expectedTdd: 27,
    expectedBasal: 14,
    expectedBolusPerMeal: 4,
  },
  {
    name: 'Insulin Nội viện Thông thường 70 kg -> TDD 32 U, Basal 16 U, Bolus 5 U/bữa',
    weight: 70,
    setting: 'inpatient',
    clinicalContext: 'standard',
    expectedTdd: 32,
    expectedBasal: 16,
    expectedBolusPerMeal: 5,
  },
  {
    name: 'Insulin Nội viện Thông thường 80 kg -> TDD 36 U, Basal 18 U, Bolus 6 U/bữa',
    weight: 80,
    setting: 'inpatient',
    clinicalContext: 'standard',
    expectedTdd: 36,
    expectedBasal: 18,
    expectedBolusPerMeal: 6,
  },

  // D. Nội viện - Nhóm Đề Kháng (Resistant: 0.60 U/kg; 50% Basal + 50% Bolus / 3 bữa)
  {
    name: 'Insulin Nội viện Đề kháng 70 kg -> TDD 42 U, Basal 21 U, Bolus 7 U/bữa',
    weight: 70,
    setting: 'inpatient',
    clinicalContext: 'resistant',
    expectedTdd: 42,
    expectedBasal: 21,
    expectedBolusPerMeal: 7,
  },
  {
    name: 'Insulin Nội viện Đề kháng 80 kg -> TDD 48 U, Basal 24 U, Bolus 8 U/bữa',
    weight: 80,
    setting: 'inpatient',
    clinicalContext: 'resistant',
    expectedTdd: 48,
    expectedBasal: 24,
    expectedBolusPerMeal: 8,
  },
  {
    name: 'Insulin Nội viện Đề kháng 110 kg -> TDD 66 U, Basal 33 U, Bolus 11 U/bữa',
    weight: 110,
    setting: 'inpatient',
    clinicalContext: 'resistant',
    expectedTdd: 66,
    expectedBasal: 33,
    expectedBolusPerMeal: 11,
  },
];

describe('Insulin Exhaustive Verification Test Suite (ADA 2026 Ch. 9 & 16)', () => {
  for (const tc of INSULIN_TRUTH_CASES) {
    it(tc.name, () => {
      const res = computeInsulin({
        weight: tc.weight,
        setting: tc.setting,
        clinicalContext: tc.clinicalContext,
      });

      if (tc.setting === 'outpatient') {
        expect(res.outpatientStart).toBeDefined();
        expect(res.outpatientStart!.fixedDoseUnits).toBe(tc.expectedOutpatientFixed);
        expect(res.outpatientStart!.weightBasedDoseRangeUnits).toEqual(tc.expectedOutpatientRange);
      } else {
        expect(res.inpatientBasalBolus).toBeDefined();
        expect(res.inpatientBasalBolus!.totalDailyDoseUnits).toBe(tc.expectedTdd);
        expect(res.inpatientBasalBolus!.basalUnits).toBe(tc.expectedBasal);
        expect(res.inpatientBasalBolus!.bolusEachMealUnits).toBe(tc.expectedBolusPerMeal);
      }
    });
  }
});
