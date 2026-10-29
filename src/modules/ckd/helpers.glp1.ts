/** GLP-1 outcome evidence and product-specific renal assessment (CL-02c). */
import type { CurrentMed, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import { parseDailyDoseMg, parseFrequencyPerDay } from '../../engine/doseParser';
import { getMedComponents, hasCkdFlag, isGlp1RaMed } from './helpers';

export function exendinComponent(med: CurrentMed): string | undefined {
  return getMedComponents(med).find((id) => id === 'exenatide' || id === 'lixisenatide');
}

export function exenatideForm(med: CurrentMed): 'ir' | 'er' | 'unknown' {
  // Keep the original brand/formulation: the canonical ID intentionally represents the ingredient.
  const text = `${med.drugId} ${med.name ?? ''} ${med.freq ?? ''} ${med.dose ?? ''}`.toLowerCase();
  const er = /bydureon|bcise|extended.release|exenatide_er|\bweekly\b|\bqw\b|tuần/.test(text);
  const ir = /byetta|immediate.release|\bbid\b|2\s*lần\s*\/\s*ngày|twice\s*daily/.test(text);
  return er === ir ? 'unknown' : er ? 'er' : 'ir';
}

export function exendinRenalAssessment(ctx: RuleContext, med: CurrentMed): {
  action?: 'STOP' | 'DEFER'; reason: string; citationIds: string[];
} {
  const component = exendinComponent(med);
  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const ada = 'ada.dm2.2026.lixisenatide_exenatide_renal_avoid_30';
  const dialysis = hasCkdFlag(ctx, 'onDialysis');
  if (!component) return { reason: '', citationIds: [] };
  if (dialysis) return { action: 'STOP', reason: 'Đang lọc máu: không dùng exenatide/lixisenatide.',
    citationIds: ['ada.ckd.2026.exendin_dialysis_avoid'] };
  if (component === 'lixisenatide') {
    const cutoff = thFor('egfr', 'ckd.glp1.lixisenatide_ada_avoid_max');
    return { action: egfr === undefined ? 'DEFER' : egfr <= cutoff ? 'STOP' : undefined,
      reason: egfr === undefined ? 'Chưa có eGFR để đánh giá an toàn lixisenatide.'
        : `ADA khuyến cáo tránh lixisenatide khi eGFR ≤ ${cutoff} mL/phút/1.73m²; eGFR hiện tại ${egfr}. Đây là ngưỡng hướng dẫn thận trọng hơn nhãn Adlyxin.`,
      citationIds: [ada, 'fda.lixisenatide.renal_impairment'] };
  }
  const crclCutoff = thFor('crcl', 'ckd.glp1.exenatide_ir_crcl_avoid_max');
  const erCutoff = thFor('egfr', 'ckd.glp1.exenatide_er_egfr_min');
  const form = exenatideForm(med);
  if (crcl !== undefined && crcl <= crclCutoff) return { action: 'STOP',
    reason: `CrCl ${crcl} mL/phút ≤ ${crclCutoff}: tránh exenatide theo ADA. Không quy đổi eGFR thành CrCl.`,
    citationIds: [ada, 'fda.exenatide_ir.renal_impairment'] };
  if (form === 'er') return { action: egfr === undefined ? 'DEFER' : egfr < erCutoff ? 'STOP' : undefined,
    reason: egfr === undefined ? 'Chưa có eGFR để đánh giá exenatide dạng kéo dài.'
      : `Exenatide dạng kéo dài (Bydureon BCise) không được khuyến cáo khi eGFR < ${erCutoff} mL/phút/1.73m²; eGFR hiện tại ${egfr}.`,
    citationIds: ['fda.exenatide_er.renal_impairment'] };
  if (form === 'unknown') return { action: 'DEFER',
    reason: `Chưa xác định chắc chắn exenatide dạng thường hay kéo dài. Xác minh biệt dược, dạng bào chế và chức năng thận; dạng kéo dài có giới hạn eGFR < ${erCutoff}, dạng thường cần CrCl > ${crclCutoff}. Không suy CrCl từ eGFR.`,
    citationIds: [ada, 'fda.exenatide_er.renal_impairment', 'fda.exenatide_ir.renal_impairment'] };
  return { action: crcl === undefined ? 'DEFER' : undefined,
    reason: crcl === undefined ? 'Chưa có CrCl để đánh giá exenatide dạng thường; bổ sung creatinin/cân nặng hoặc xác nhận CrCl. Không suy CrCl từ eGFR.'
      : `Exenatide dạng thường: CrCl ${crcl} mL/phút > ${crclCutoff}.`,
    citationIds: [ada, 'fda.exenatide_ir.renal_impairment'] };
}

export function glp1ReplacementState(ctx: RuleContext): { med?: CurrentMed; blocked?: string } {
  const meds = ctx.patient.currentMeds.filter(isGlp1RaMed);
  if (!meds.some(exendinComponent)) return {};
  if (meds.length !== 1) return { blocked: 'Đang ghi nhận nhiều thuốc GLP-1: xác minh và xử lý trùng nhóm trước khi chọn thuốc thay thế.' };
  const med = meds[0];
  if (getMedComponents(med).length > 1) return { med,
    blocked: 'Bút phối hợp có insulin: cần bác sĩ lập phác đồ insulin đơn chất thay thế trước khi đổi thuốc. Không ngừng insulin nền hoặc quy đổi liều bút sang semaglutide.' };
  const renal = exendinRenalAssessment(ctx, med);
  if (renal.action === 'DEFER') return { med, blocked: renal.reason };
  if (parseDailyDoseMg(med) === undefined || parseFrequencyPerDay(med.freq, typeof med.dose === 'string' ? med.dose : undefined) === undefined) {
    return { med, blocked: 'Cần xác minh liều, đơn vị, tần suất, liều cuối và kế hoạch ngừng thuốc cũ trước khi đổi GLP-1; không phối hợp hai thuốc cùng nhóm.' };
  }
  return { med };
}
