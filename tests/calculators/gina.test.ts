/**
 * Bộ kiểm thử Mức độ Kiểm soát Triệu chứng Hen GINA 2026 & Fail-Closed (ASTHMA-R2-R3-15)
 * Phân quyền: Agent D / Agent C3
 */

import { describe, it, expect } from 'vitest';
import { computeGina } from '../../src/engine/calculators/gina';
import { calculatorRegistry } from '../../src/engine/calculators';

describe('GINA Asthma Symptom Control Calculator (GINA 2026 Box 2-2A & Fail-Closed)', () => {
  // Ca 1: Đủ 4/4 câu hỏi âm tính (0 tiêu chí) -> Kiểm soát tốt
  it('Ca 1: Đủ 4/4 câu hỏi đều âm tính trong 4 tuần -> Kiểm soát tốt', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: false,
      nightWakingDueToAsthma: false,
      relieverNeededMoreThanTwiceWeek: false,
      activityLimitationDueToAsthma: false,
    });

    expect(res.positiveCriteriaCount).toBe(0);
    expect(res.answeredCriteriaCount).toBe(4);
    expect(res.missingCriteria).toHaveLength(0);
    expect(res.controlLevel).toBe('well_controlled');
    expect(res.controlLevelVi).toBe('Kiểm soát tốt');
    expect(res.managementAdviceVi).toContain('Duy trì phác đồ');
  });

  // Ca 2: Đủ 4/4 câu hỏi, có 1 hoặc 2 tiêu chí -> Kiểm soát một phần
  it('Ca 2: Có triệu chứng ngày và cần thuốc cắt cơn > 2 lần/tuần (2/4 tiêu chí) -> Kiểm soát một phần', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: true,
      nightWakingDueToAsthma: false,
      relieverNeededMoreThanTwiceWeek: true,
      activityLimitationDueToAsthma: false,
    });

    expect(res.positiveCriteriaCount).toBe(2);
    expect(res.answeredCriteriaCount).toBe(4);
    expect(res.controlLevel).toBe('partly_controlled');
    expect(res.controlLevelVi).toBe('Kiểm soát một phần');
    expect(res.managementAdviceVi).toContain('Kiểm tra kỹ thuật hít');
  });

  // Ca 3: Đủ 4/4 câu hỏi, có 3 tiêu chí -> Không kiểm soát
  it('Ca 3: Có thức giấc ban đêm, hạn chế hoạt động và triệu chứng ngày (3/4 tiêu chí) -> Không kiểm soát', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: true,
      nightWakingDueToAsthma: true,
      relieverNeededMoreThanTwiceWeek: false,
      activityLimitationDueToAsthma: true,
    });

    expect(res.positiveCriteriaCount).toBe(3);
    expect(res.controlLevel).toBe('uncontrolled');
    expect(res.controlLevelVi).toBe('Không kiểm soát');
    expect(res.managementAdviceVi).toContain('tăng bậc điều trị');
  });

  // Ca 4: Cả 4/4 tiêu chí dương tính -> Không kiểm soát
  it('Ca 4: Cả 4 tiêu chí đều dương tính -> Không kiểm soát', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: true,
      nightWakingDueToAsthma: true,
      relieverNeededMoreThanTwiceWeek: true,
      activityLimitationDueToAsthma: true,
    });

    expect(res.positiveCriteriaCount).toBe(4);
    expect(res.controlLevel).toBe('uncontrolled');
  });

  // Ca 5 (ASTHMA-R2-R3-15): Bỏ trống cả 4 câu hỏi -> Fail-closed (controlLevel = null, TUYỆT ĐỐI KHÔNG kết luận well_controlled)
  it('Ca 5 (Fail-closed): Thiếu toàn bộ 4 câu hỏi -> controlLevel = null (không kết luận nhầm Kiểm soát tốt)', () => {
    const res = computeGina({});
    expect(res.answeredCriteriaCount).toBe(0);
    expect(res.missingCriteria).toHaveLength(4);
    expect(res.controlLevel).toBeNull();
    expect(res.controlLevelVi).toBe('Chưa đủ dữ liệu đánh giá');
    expect(res.warning).toBeDefined();

    // Kiểm tra luôn qua calculatorRegistry wrapper (không ép Boolean(undefined) -> false)
    const regItem = calculatorRegistry.find((c) => c.id === 'gina')!;
    const regRes = regItem.compute({}) as ReturnType<typeof computeGina>;
    expect(regRes.controlLevel).toBeNull();
  });

  // Ca 6 (ASTHMA-R2-R3-15): 3 câu false + 1 câu undefined -> Fail-closed (câu thiếu có thể là true -> partly_controlled)
  it('Ca 6 (Fail-closed): 3 câu âm tính nhưng thiếu 1 câu thức giấc đêm -> controlLevel = null', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: false,
      relieverNeededMoreThanTwiceWeek: false,
      activityLimitationDueToAsthma: false,
    });

    expect(res.answeredCriteriaCount).toBe(3);
    expect(res.positiveCriteriaCount).toBe(0);
    expect(res.missingCriteria).toEqual(['nightWakingDueToAsthma']);
    expect(res.controlLevel).toBeNull();
  });

  // Ca 7 (ASTHMA-R2-R3-15): 2 câu true + 2 câu undefined -> Fail-closed (chưa đủ >= 3 để chắc chắn uncontrolled, nhưng không thể kết luận partly_controlled)
  it('Ca 7 (Fail-closed): 2 câu dương tính kèm 2 câu bỏ trống -> controlLevel = null', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: true,
      nightWakingDueToAsthma: true,
    });

    expect(res.answeredCriteriaCount).toBe(2);
    expect(res.positiveCriteriaCount).toBe(2);
    expect(res.controlLevel).toBeNull();
  });

  // Ca 8 (ASTHMA-R2-R3-15): Đã có 3 câu dương tính + 1 câu bỏ trống -> Chắc chắn Không kiểm soát (uncontrolled) kèm cảnh báo thiếu câu thứ 4
  it('Ca 8: Đã có 3 câu dương tính và 1 câu bỏ trống -> vẫn phân loại chắc chắn Không kiểm soát (uncontrolled)', () => {
    const res = computeGina({
      daytimeSymptomsMoreThanTwiceWeek: true,
      nightWakingDueToAsthma: true,
      relieverNeededMoreThanTwiceWeek: true,
    });

    expect(res.answeredCriteriaCount).toBe(3);
    expect(res.positiveCriteriaCount).toBe(3);
    expect(res.missingCriteria).toEqual(['activityLimitationDueToAsthma']);
    expect(res.controlLevel).toBe('uncontrolled');
    expect(res.controlLevelVi).toBe('Không kiểm soát');
    expect(res.warning).toContain('3/4 tiêu chí dương tính');
  });
});
