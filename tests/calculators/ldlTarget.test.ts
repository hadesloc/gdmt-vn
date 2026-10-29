/**
 * Bộ kiểm thử Phân tầng Nguy cơ Tim mạch & Đích LDL-C (ESC 2025 / 2019)
 * Phân quyền: Agent D / Agent I3 (Round 2 Remediation)
 */

import { describe, it, expect } from 'vitest';
import { determineEscRiskTier, computeLdlTarget } from '../../src/engine/calculators/ldlTarget';

describe('ESC LDL Target Calculator', () => {
  describe('determineEscRiskTier', () => {
    it('xếp người có bệnh tim mạch xơ vữa (ASCVD) đơn giường mạch vào nhóm Rất cao (Very High)', () => {
      expect(determineEscRiskTier({ currentLdl: 3.0, hasAscvd: true })).toBe('very_high');
    });

    it('xếp bệnh động mạch đa giường mạch (polyvascular) hoặc tái phát biến cố trên nền statin vào nhóm Cực cao (Extreme - ESC 2025)', () => {
      expect(determineEscRiskTier({ currentLdl: 1.2, hasAscvd: true, hasPolyvascular: true })).toBe('extreme');
      expect(
        determineEscRiskTier({
          currentLdl: 1.2,
          hasAscvd: true,
          recurrentAcsWithin2Years: true,
          currentTherapy: 'high_intensity_statin',
        })
      ).toBe('extreme');
      // Nếu chưa từng điều trị statin (currentTherapy === 'none') và không đa giường mạch -> vẫn là very_high (< 1.4 mmol/L)
      expect(
        determineEscRiskTier({
          currentLdl: 1.2,
          hasAscvd: true,
          recurrentAcsWithin2Years: true,
          currentTherapy: 'none',
        })
      ).toBe('very_high');
    });

    it('xếp người có CKD nặng (eGFR < 30) vào nhóm Rất cao', () => {
      expect(determineEscRiskTier({ currentLdl: 2.8, egfr: 25 })).toBe('very_high');
    });

    it('xếp người có tăng huyết áp độ 3 (BP >= 180/110 mmHg) tối thiểu vào nhóm Cao (ESC 2025 Table 3)', () => {
      expect(determineEscRiskTier({ currentLdl: 2.4, sbp: 185, dbp: 100, score2RiskPercent: 3.2 })).toBe('high');
      expect(determineEscRiskTier({ currentLdl: 2.4, sbp: 165, dbp: 112, score2RiskPercent: 3.2 })).toBe('high');
    });

    it('phân tầng chính xác Đái tháo đường theo thời gian mắc, tuổi và yếu tố nguy cơ đi kèm (ESC 2025 Table 3)', () => {
      // ĐTĐ >= 10 năm -> Cao
      expect(determineEscRiskTier({ currentLdl: 3.5, hasDiabetes: true, dmDurationYears: 12 })).toBe('high');
      // ĐTĐ < 10 năm nhưng có kèm THA / hút thuốc / tuổi >= 50 -> Cao (LIPID-R2-R1-03)
      expect(
        determineEscRiskTier({ currentLdl: 2.3, hasDiabetes: true, dmDurationYears: 5, hasHypertension: true, age: 64 })
      ).toBe('high');
      expect(
        determineEscRiskTier({ currentLdl: 2.5, hasDiabetes: true, dmDurationYears: 0, hasHypertension: true, age: 64 })
      ).toBe('high');
      expect(determineEscRiskTier({ currentLdl: 2.4, hasDiabetes: true, dmDurationYears: 4, age: 54 })).toBe('high');
      // ĐTĐ trẻ tuổi (< 50 tuổi), mới chẩn đoán (0 năm hoặc 5 năm), KHÔNG kèm yếu tố nguy cơ khác -> Trung bình
      expect(determineEscRiskTier({ currentLdl: 3.5, hasDiabetes: true, dmDurationYears: 5, age: 42 })).toBe('moderate');
      expect(determineEscRiskTier({ currentLdl: 2.8, hasDiabetes: true, dmDurationYears: 0, age: 38 })).toBe('moderate');
    });

    it('xếp FH (Tăng cholesterol máu gia đình) không kèm ASCVD hay YTNC chính khác vào nhóm Cao (High)', () => {
      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          score2RiskPercent: 1.2,
        })
      ).toBe('high');
    });

    it('xếp FH kèm ASCVD hoặc kèm ≥ 1 yếu tố nguy cơ chính vào nhóm Rất cao (Very High)', () => {
      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          hasAscvd: true,
        })
      ).toBe('very_high');

      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          hasMajorRiskFactor: true,
        })
      ).toBe('very_high');

      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          majorRiskFactorsCount: 1,
        })
      ).toBe('very_high');

      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          smoker: true,
        })
      ).toBe('very_high');

      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          hasHypertension: true,
        })
      ).toBe('very_high');

      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          hasDiabetes: true,
          dmDurationYears: 3,
        })
      ).toBe('very_high');

      expect(
        determineEscRiskTier({
          currentLdl: 3.2,
          hasFamilialHypercholesterolemia: true,
          egfr: 50,
        })
      ).toBe('very_high');
    });
  });

  describe('computeLdlTarget (Đích nồng độ nghiêm ngặt < đích và ước lượng phác đồ)', () => {
    it('Ca 1: Nhóm Rất cao -> Đích LDL < 1.4 mmol/L (< 55 mg/dL) và giảm ≥ 50%', () => {
      const res = computeLdlTarget({
        currentLdl: 3.2,
        baselineLdl: 4.5,
        hasAscvd: true,
        currentTherapy: 'moderate_intensity_statin',
      });

      expect(res.riskTier).toBe('very_high');
      expect(res.targetLdlMmol).toBe(1.4);
      expect(res.targetLdlMgDl).toBe(55);
      expect(res.requiresFiftyPercentReduction).toBe(true);
      expect(res.isTargetAchieved).toBe(false);
      expect(res.stepUpAdviceVi.some((msg) => msg.includes('Statin cường độ cao'))).toBe(true);
    });

    it('Ca 2: Tái phát ACS trong vòng 2 năm trên nền statin -> Đích LDL tích cực < 1.0 mmol/L (< 40 mg/dL)', () => {
      const res = computeLdlTarget({
        currentLdl: 1.6,
        hasAscvd: true,
        recurrentAcsWithin2Years: true,
        currentTherapy: 'high_intensity_statin',
      });

      expect(res.riskTier).toBe('extreme');
      expect(res.targetLdlMmol).toBe(1.0);
      expect(res.targetLdlMgDl).toBe(40);
    });

    it('Ca 3: Nhóm Cao đạt đích LDL-C < 1.8 mmol/L -> Duy trì phác đồ', () => {
      const res = computeLdlTarget({
        currentLdl: 1.7,
        baselineLdl: 3.8,
        riskTier: 'high',
        currentTherapy: 'high_intensity_statin',
      });

      expect(res.targetLdlMmol).toBe(1.8);
      expect(res.isTargetAchieved).toBe(true);
      expect(res.stepUpAdviceVi.some((msg) => msg.includes('đã đạt mục tiêu'))).toBe(true);
    });

    it('Ca 4: Ước lượng mức giảm 65% với Statin cao + Ezetimibe', () => {
      const res = computeLdlTarget({
        currentLdl: 2.2,
        baselineLdl: 5.0,
        riskTier: 'very_high',
        currentTherapy: 'high_statin_plus_ezetimibe',
      });

      expect(res.currentTherapyProjectedReductionPercent).toBe(65);
      expect(res.achievableLdlMmol).toBeCloseTo(1.75, 2);
    });

    it('Mục tiêu kép ở nhóm Rất cao (very_high) và kiểm tra dấu nhỏ hơn nghiêm ngặt (< 1.4 mmol/L, LIPID-R2-R3-10)', () => {
      const resNotMet = computeLdlTarget({
        currentLdl: 1.3,
        baselineLdl: 2.4, // giảm 45.8% < 50%
        riskTier: 'very_high',
        currentTherapy: 'high_intensity_statin',
      });
      expect(resNotMet.isTargetAchieved).toBe(false);
      expect(resNotMet.achievedReductionPercent).toBeCloseTo(45.8, 1);
      expect(resNotMet.stepUpAdviceVi.some((msg) => msg.includes('50%'))).toBe(true);

      // Đúng bằng 1.4 mmol/L KHÔNG đạt đích nghiêm ngặt < 1.4 mmol/L
      const resBoundaryEqual = computeLdlTarget({
        currentLdl: 1.4,
        baselineLdl: 2.8,
        riskTier: 'very_high',
        currentTherapy: 'high_intensity_statin',
      });
      expect(resBoundaryEqual.isTargetAchieved).toBe(false);

      // 1.39 mmol/L (< 1.4) kèm giảm > 50% từ nền 2.8 -> đạt mục tiêu kép
      const resBelowTarget = computeLdlTarget({
        currentLdl: 1.39,
        baselineLdl: 2.8,
        riskTier: 'very_high',
        currentTherapy: 'high_intensity_statin',
      });
      expect(resBelowTarget.isTargetAchieved).toBe(true);
    });

    it('Kiểm tra biên đơn vị mg/dL không bị sai số làm tròn (LDL = 100 mg/dL vs < 100 mg/dL; 54 mg/dL vs < 55 mg/dL)', () => {
      // 100 mg/dL quy đổi thành 2.59 mmol/L nhưng ở hệ mg/dL có currentLdlMgDl = 100 -> KHÔNG đạt đích < 100 mg/dL
      const resMgDl100 = computeLdlTarget({
        currentLdl: 2.59,
        currentLdlMgDl: 100,
        riskTier: 'moderate',
      });
      expect(resMgDl100.isTargetAchieved).toBe(false);

      // 54 mg/dL quy đổi làm tròn 1.40 mmol/L nhưng 54 < 55 mg/dL -> ĐẠT ngưỡng tuyệt đối < 55 mg/dL
      const resMgDl54 = computeLdlTarget({
        currentLdl: 1.4,
        currentLdlMgDl: 54,
        riskTier: 'very_high',
      });
      expect(resMgDl54.isTargetAchieved).toBe(true);
    });

    it('Mục tiêu kép ở nhóm Cao (high) và hỗ trợ bí danh untreatedLdl', () => {
      const resFailDual = computeLdlTarget({
        currentLdl: 1.7,
        untreatedLdl: 3.0, // giảm 43.3% < 50%
        hasFamilialHypercholesterolemia: true,
        currentTherapy: 'moderate_intensity_statin',
      });
      expect(resFailDual.riskTier).toBe('high');
      expect(resFailDual.targetLdlMmol).toBe(1.8);
      expect(resFailDual.isTargetAchieved).toBe(false);

      const resPassDual = computeLdlTarget({
        currentLdl: 1.7,
        untreatedLdl: 3.4, // giảm đúng 50.0% và 1.7 < 1.8
        hasFamilialHypercholesterolemia: true,
        currentTherapy: 'high_intensity_statin',
      });
      expect(resPassDual.riskTier).toBe('high');
      expect(resPassDual.isTargetAchieved).toBe(true);
    });

    it('Mục tiêu kép ở nhóm Cực cao (extreme - ESC 2025): cần ĐỒNG THỜI LDL < 1.0 mmol/L VÀ giảm >= 50%', () => {
      const resExtremeFail = computeLdlTarget({
        currentLdl: 0.95,
        baselineLdl: 1.8, // giảm 47.2% < 50% dù < 1.0 mmol/L
        riskTier: 'extreme',
        currentTherapy: 'high_statin_plus_ezetimibe',
      });
      expect(resExtremeFail.targetLdlMmol).toBe(1.0);
      expect(resExtremeFail.targetLdlMgDl).toBe(40);
      expect(resExtremeFail.requiresFiftyPercentReduction).toBe(true);
      expect(resExtremeFail.isTargetAchieved).toBe(false);
      expect(resExtremeFail.stepUpAdviceVi.some((m) => m.includes('PCSK9'))).toBe(true);

      const resExtremePass = computeLdlTarget({
        currentLdl: 0.9,
        baselineLdl: 1.8, // giảm 50% và < 1.0 mmol/L
        riskTier: 'extreme',
        currentTherapy: 'high_statin_plus_ezetimibe_plus_pcsk9i',
      });
      expect(resExtremePass.isTargetAchieved).toBe(true);
    });

    it('Nhóm Trung bình/Thấp không yêu cầu giảm ≥ 50%; và khi thiếu baselineLdl thì chỉ xét ngưỡng tuyệt đối', () => {
      const resModerate = computeLdlTarget({
        currentLdl: 2.5,
        baselineLdl: 3.0,
        riskTier: 'moderate',
      });
      expect(resModerate.requiresFiftyPercentReduction).toBe(false);
      expect(resModerate.isTargetAchieved).toBe(true);

      const resNoBaseline = computeLdlTarget({
        currentLdl: 1.2,
        riskTier: 'very_high',
      });
      expect(resNoBaseline.isTargetAchieved).toBe(true);
    });
  });
});
