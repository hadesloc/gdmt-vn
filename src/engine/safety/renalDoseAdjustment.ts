/** Shared current-regimen dose limits; preserve the same message through gates/merge. */
import type { CurrentMed, Derived, Patient, Recommendation } from '../types';
import { thFor, thr } from '../../kb-types/access';
import { parseComponentDailyDoseMg, parseFrequencyPerDay } from '../doseParser';
import { expandDrugComponents, resolveCanonicalDrugId } from './fdcMap';
import { assessSglt2FdcReplacement } from './sglt2FdcReplacement';

type Adjustment = Pick<Recommendation, 'action' | 'title' | 'dose' | 'rationale' | 'gates' | 'citationIds'>;
const UGT_INDUCERS = new Set(['rifampin', 'rifampicin', 'phenytoin', 'phenobarbital', 'ritonavir']);
const UGT_BRANDS = new Set(['dilantin', 'norvir', 'rifadin']);

function componentDose(med: CurrentMed, component: string): number | undefined {
  const frequency = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  // A bare strength is not a known daily regimen.
  if (parseFrequencyPerDay(frequency, typeof med.dose === 'string' ? med.dose : undefined) === undefined) return undefined;
  return parseComponentDailyDoseMg(med, component);
}

function totalComponentDose(patient: Patient, component: string): number | undefined {
  const meds = patient.currentMeds.filter((m) => expandDrugComponents(m.drugId).includes(component));
  const values = meds.map((m) => componentDose(m, component));
  if (!values.length || values.some((v) => v === undefined)) return undefined;
  return values.reduce<number>((total, value) => total + value!, 0);
}

export function currentRenalDoseAdjustment(rec: Recommendation, patient: Patient, derived: Derived): Adjustment | undefined {
  const switchEgfr = derived.egfr ?? derived.egfrCr;
  if (rec.action === 'SWITCH' && rec.drugId && rec.switchFrom && switchEgfr !== undefined && switchEgfr < thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')) {
    const component = resolveCanonicalDrugId(rec.drugId);
    const fdc = patient.currentMeds.find((m) => resolveCanonicalDrugId(m.drugId) === resolveCanonicalDrugId(rec.switchFrom!));
    const parts = fdc ? expandDrugComponents(fdc.drugId) : [];
    if (fdc && parts.includes('metformin') && parts.includes(component) &&
      ['empagliflozin', 'dapagliflozin', 'canagliflozin'].includes(component)) {
      const assessment = assessSglt2FdcReplacement(patient, fdc, component);
      const citationIds = ['kdigo.ckd.2024.pp_3_7_1_continue_below_20', sglt2iLabelCitation(component)];
      if (component === 'canagliflozin') citationIds.push('fda.canagliflozin.table_1_renal_impairment', 'fda.canagliflozin.ugt_inducer_renal_dosing');
      if (assessment.needsVerification) return {
        action: 'DEFER', title: `XÁC MINH chuyển sang ${rec.drugNameVi || component} đơn chất`, dose: undefined,
        rationale: assessment.reason,
        gates: [{ parameter: 'fdc_continuation', passed: false, action: 'hold', messageVi: assessment.reason }],
        citationIds,
      };
    }
  }
  if (!rec.drugId || !['CONTINUE', 'REDUCE', 'UPTITRATE'].includes(rec.action)) return undefined;
  const id = resolveCanonicalDrugId(rec.drugId);
  const components = expandDrugComponents(id);
  const exactCurrent = patient.currentMeds.find((m) => resolveCanonicalDrugId(m.drugId) === id);
  const componentCurrent = rec.action === 'UPTITRATE' ? patient.currentMeds.find((m) =>
    expandDrugComponents(m.drugId).some((c) => components.includes(c))) : undefined;
  const current = exactCurrent || componentCurrent;
  const ambiguousReplacement = !exactCurrent && Boolean(componentCurrent);
  const egfr = derived.egfr ?? derived.egfrCr;
  if (!current || egfr === undefined) return undefined;
  const canaCutoff = thFor('egfr', 'ckd.canagliflozin.renal_dose_cutoff');
  const metCutoff = thFor('egfr', 'dm2.metformin.egfr_dose_reduction');
  const metContra = thFor('egfr', 'dm2.metformin.egfr_contra');
  // Absolute metformin contraindication is handled by the existing STOP/AVOID gate.
  if (components.includes('metformin') && egfr < metContra) return undefined;
  const limits: { component: string; name: string; maximum: number; total?: number; citationIds: string[] }[] = [];
  if (components.includes('canagliflozin') && egfr < canaCutoff) {
    const hasUgtInducer = patient.currentMeds.some((m) =>
      expandDrugComponents(m.drugId).some((c) => UGT_INDUCERS.has(c)) || UGT_BRANDS.has(m.drugId.toLowerCase()) ||
      /\b(rifampin|rifampicin|phenytoin|phenobarbital|ritonavir|dilantin|norvir|rifadin)\b/i.test(m.name || ''));
    if (hasUgtInducer) {
      return {
        action: 'DEFER', title: `XÁC MINH LIỀU ${rec.drugNameVi || rec.drugId} (Chất cảm ứng UGT)`, dose: undefined,
        rationale: 'Nhãn Invokana có điều chỉnh liều riêng khi dùng chất cảm ứng UGT; cần xác nhận thuốc phối hợp, liều đã dung nạp và chỉ định trước khi duy trì hoặc chỉnh liều. Không tự áp trần liều thông thường hoặc tự tăng liều.',
        gates: [{ parameter: 'renal_dose', passed: false, action: 'hold', messageVi: 'Chất cảm ứng UGT: cần xác nhận liều canagliflozin theo nhãn.' }],
        citationIds: ['fda.canagliflozin.ugt_inducer_renal_dosing'],
      };
    }
    limits.push({ component: 'canagliflozin', name: 'Canagliflozin', maximum: thFor('dose_mg', 'ckd.canagliflozin.renal_standard_max'),
      total: totalComponentDose(patient, 'canagliflozin'), citationIds: ['fda.canagliflozin.table_1_renal_impairment'] });
  }
  if (components.includes('metformin') && egfr < metCutoff) {
    limits.push({ component: 'metformin', name: 'Metformin', maximum: thFor('dose_mg', 'dm2.metformin.dose_reduced_max'),
      total: totalComponentDose(patient, 'metformin'), citationIds: thr('dm2.metformin.dose_reduced_max').citationIds });
  }
  if (!limits.length) return undefined;
  const exceeds = limits.some((l) => l.total !== undefined && l.total > l.maximum);
  const unknown = limits.some((l) => l.total === undefined);
  // UPTITRATE also needs the proposed total verified, not just the current regimen.
  const unsafeEscalation = rec.action === 'UPTITRATE' && (ambiguousReplacement || limits.some((l) => {
    const proposed = componentDose({ drugId: id, dose: rec.dose }, l.component);
    const replaced = componentDose(current, l.component);
    return proposed === undefined || replaced === undefined || l.total === undefined ||
      proposed + l.total - replaced > l.maximum;
  }));
  if (!exceeds && !unknown && !unsafeEscalation) return undefined;
  const limitText = limits.map((l) => `${l.name} ≤ ${l.maximum} mg/ngày`).join('; ');
  const action = exceeds && !ambiguousReplacement ? 'REDUCE' : 'DEFER';
  const name = rec.drugNameVi || rec.drugId;
  const totalText = limits.map((l) => `${l.name}: ${l.total === undefined ? 'chưa xác định tổng liều/ngày' : `${l.total} mg/ngày`}`).join('; ');
  const singleCana = components.length === 1 && limits[0].component === 'canagliflozin' &&
    patient.currentMeds.filter((m) => expandDrugComponents(m.drugId).includes('canagliflozin')).length === 1;
  const reducedDose = singleCana ? `${limits[0].maximum} mg 1 lần/ngày` : `Tổng liều từ mọi thuốc: ${limitText}. Xác nhận hàm lượng/dạng thuốc hoặc tách viên trước khi cấp liều mới.`;
  const lowCanaNote = components.includes('canagliflozin') && egfr < thFor('egfr', 'ckd.canagliflozin.egfr_initiate_min')
    ? ' Khi eGFR dưới ngưỡng khởi trị, cần đối chiếu chỉ định duy trì theo KDIGO và điều kiện albumin niệu trên nhãn Invokana; UACR không tự chứng minh lượng albumin niệu theo ngày.' : '';
  return {
    action, title: `${action === 'REDUCE' ? 'GIẢM LIỀU' : 'XÁC MINH LIỀU'} ${name} (${limitText})`,
    dose: action === 'DEFER' ? undefined : reducedDose,
    rationale: `${ambiguousReplacement ? 'Đang có hoạt chất trong viên phối hợp: cần xác nhận thay viên phối hợp hay thêm đơn chất; không tự giả định thuốc cũ đã ngừng. ' : ''}eGFR ${egfr.toFixed(1)} mL/phút/1.73m²: ${totalText}. Giới hạn áp dụng cho tổng phác đồ: ${limitText}. Không tiếp tục liều cũ hoặc tự tăng liều; xác nhận tổng liều, tần suất và chức năng thận. Với viên phối hợp cần chọn hàm lượng phù hợp hoặc tách các thành phần, không tự giảm cả hai thành phần theo cùng tỷ lệ.${lowCanaNote}`,
    gates: [{ parameter: 'renal_dose', passed: false, action: action === 'REDUCE' ? 'reduce' : 'hold', value: egfr, messageVi: `Chưa đạt cổng liều theo thận: ${limitText}.` }],
    citationIds: Array.from(new Set(limits.flatMap((l) => l.citationIds))),
  };
}

export function withCurrentRenalDoseSafety(rec: Recommendation, patient: Patient, derived: Derived): Recommendation {
  const adjustment = currentRenalDoseAdjustment(rec, patient, derived);
  return adjustment ? { ...rec, ...adjustment,
    gates: [...rec.gates.filter((g) => g.parameter !== 'renal_dose' && !(g.parameter === 'eGFR' && g.passed)), ...adjustment.gates],
    citationIds: Array.from(new Set([...rec.citationIds, ...adjustment.citationIds])) } : rec;
}

export function sglt2iLabelCitation(component: string): string {
  return `fda.${component}.ckd_dose`;
}
