/**
 * Bộ kiểm thử Phân độ & Phân nhóm GOLD 2026 (COPD)
 * Phân quyền: Agent C / D
 */

import { describe, it, expect } from 'vitest';
import { classifyGoldGrade, computeGold } from '../../src/engine/calculators/gold';

describe('GOLD 2026 COPD Calculator', () => {
  describe('classifyGoldGrade', () => {
    it('phân đúng 4 mức GOLD 1 đến 4', () => {
      expect(classifyGoldGrade(85).grade).toBe('GOLD 1');
      expect(classifyGoldGrade(80).grade).toBe('GOLD 1');
      expect(classifyGoldGrade(79).grade).toBe('GOLD 2');
      expect(classifyGoldGrade(50).grade).toBe('GOLD 2');
      expect(classifyGoldGrade(49).grade).toBe('GOLD 3');
      expect(classifyGoldGrade(30).grade).toBe('GOLD 3');
      expect(classifyGoldGrade(29).grade).toBe('GOLD 4');
      expect(classifyGoldGrade(18).grade).toBe('GOLD 4');
    });
  });

  describe('computeGold (Lâm sàng & Phân nhóm ABE theo chuẩn GOLD 2026)', () => {
    // Ca 1: GOLD 1 Nhóm A (Ít triệu chứng mMRC 1 & CAT 6, 0 đợt cấp)
    it('Ca 1: FEV1 85%, FEV1/FVC 0.65, 0 đợt cấp, mMRC 1, CAT 6 -> GOLD 1 Nhóm A', () => {
      const res = computeGold({
        fev1PredPct: 85,
        fev1FvcRatio: 0.65,
        exacerbationsPastYear: 0,
        hospitalizationsPastYear: 0,
        mmrc: 1,
        cat: 6,
      });

      expect(res.isAirflowObstructionConfirmed).toBe(true);
      expect(res.grade).toBe('GOLD 1');
      expect(res.group).toBe('A');
      expect(res.initialTherapyVi).toContain('giãn phế quản tác dụng kéo dài đơn độc');
    });

    // Ca 2a: GOLD 2 Nhóm B khi CAT ≥ 10 dù mMRC < 2 và 0 đợt cấp
    it('Ca 2a: FEV1 62%, CAT 16 (≥ 10), mMRC 1, 0 đợt cấp -> GOLD 2 Nhóm B', () => {
      const res = computeGold({
        fev1PredPct: 62,
        fev1FvcRatio: 0.58,
        exacerbationsPastYear: 0,
        hospitalizationsPastYear: 0,
        mmrc: 1,
        cat: 16,
      });

      expect(res.grade).toBe('GOLD 2');
      expect(res.group).toBe('B');
      expect(res.initialTherapyVi).toContain('LABA + LAMA');
    });

    // Ca 2b (Regression COPD-R1V2-07 & R3-R2-COPD-12): mMRC ≥ 2 NHƯNG CAT < 10 -> BẮT BUỘC Nhóm B (không bị else-if xếp nhầm vào A)
    it('Ca 2b: FEV1 65%, mMRC 2 (≥ 2) nhưng CAT 6 (< 10), 0 đợt cấp -> GOLD 2 Nhóm B', () => {
      const res = computeGold({
        fev1PredPct: 65,
        fev1FvcRatio: 0.61,
        moderateExacerbations: 0,
        severeExacerbations: 0,
        mmrc: 2,
        catScore: 6,
      });

      expect(res.grade).toBe('GOLD 2');
      expect(res.group).toBe('B');
      expect(res.groupDescriptionVi).toContain('Nhóm B');
    });

    // Ca 3a (GOLD 2026 mới nhất): Chỉ cần 1 đợt cấp mức độ trung bình (không nhập viện) đã xếp vào Nhóm E!
    it('Ca 3a (GOLD 2026): FEV1 62%, 1 đợt cấp trung bình (0 nhập viện), mMRC 1, CAT 7 -> GOLD 2 Nhóm E', () => {
      const res = computeGold({
        fev1PredPct: 62,
        fev1FvcRatio: 0.58,
        exacerbationsPastYear: 1,
        hospitalizationsPastYear: 0,
        mmrc: 1,
        cat: 7,
      });

      expect(res.grade).toBe('GOLD 2');
      expect(res.group).toBe('E');
      expect(res.groupDescriptionVi).toContain('Nhóm E');
    });

    // Ca 3b: Có ≥ 1 đợt cấp nhập viện -> Nhóm E
    it('Ca 3b: FEV1 42%, có 1 đợt cấp phải nhập viện -> GOLD 3 Nhóm E', () => {
      const res = computeGold({
        fev1PredPct: 42,
        fev1FvcRatio: 0.52,
        exacerbationsPastYear: 0,
        hospitalizationsPastYear: 1,
        mmrc: 2,
      });

      expect(res.grade).toBe('GOLD 3');
      expect(res.group).toBe('E');
      expect(res.groupDescriptionVi).toContain('Nhóm E');
    });

    // Ca 4: GOLD 4 Nhóm E khi ≥ 2 đợt cấp vừa (kể cả chưa nhập mMRC/CAT vì đã đủ tiêu chuẩn Nhóm E)
    it('Ca 4: FEV1 26%, 2 đợt cấp vừa -> GOLD 4 Nhóm E', () => {
      const res = computeGold({
        fev1PredPct: 26,
        fev1FvcRatio: 0.45,
        exacerbationsPastYear: 2,
        hospitalizationsPastYear: 0,
      });

      expect(res.grade).toBe('GOLD 4');
      expect(res.group).toBe('E');
    });

    // Ca 5 (Fail-closed 1): FEV1/FVC ≥ 0.70 -> Không xác nhận tắc nghẽn cố định, grade = null & group = null
    it('Ca 5 (Fail-closed): FEV1/FVC ≥ 0.70 -> isAirflowObstructionConfirmed = false, grade = null, group = null', () => {
      const res = computeGold({
        fev1PredPct: 75,
        fev1FvcRatio: 0.74,
        exacerbationsPastYear: 0,
        hospitalizationsPastYear: 0,
        mmrc: 1,
      });

      expect(res.isAirflowObstructionConfirmed).toBe(false);
      expect(res.grade).toBeNull();
      expect(res.group).toBeNull();
      expect(res.warning).toContain('≥ 0.70');
    });

    // Ca 6 (Fail-closed 2): Thiếu cả mMRC và CAT khi chưa thuộc Nhóm E -> group = null (không gán ngầm Nhóm A)
    it('Ca 6 (Fail-closed): 0 đợt cấp nhưng thiếu cả mMRC và CAT -> giữ grade, group = null', () => {
      const res = computeGold({
        fev1PredPct: 58,
        fev1FvcRatio: 0.60,
        exacerbationsPastYear: 0,
        hospitalizationsPastYear: 0,
      });

      expect(res.isAirflowObstructionConfirmed).toBe(true);
      expect(res.grade).toBe('GOLD 2');
      expect(res.group).toBeNull();
      expect(res.warning).toContain('Fail-closed');
    });

    // Ca 7 (Fail-closed 3): Thiếu lịch sử đợt cấp khi chưa đủ điều kiện kết luận Nhóm E -> group = null (không gán ngầm ?? 0)
    it('Ca 7 (Fail-closed): Thiếu lịch sử đợt cấp -> giữ grade, group = null', () => {
      const res = computeGold({
        fev1PredPct: 48,
        fev1FvcRatio: 0.55,
        mmrc: 1,
        cat: 8,
      });

      expect(res.isAirflowObstructionConfirmed).toBe(true);
      expect(res.grade).toBe('GOLD 3');
      expect(res.group).toBeNull();
      expect(res.warning).toContain('Fail-closed');
    });
  });
});
