/** Dose verification shared by module and final safety review of SGLT2/metformin replacement. */
import type { CurrentMed, Patient } from '../types';
import { dose, fmtDose } from '../../kb-types/access';
import { parseComponentDailyDoseMg, parseFrequencyPerDay } from '../doseParser';
import { expandDrugComponents, resolveCanonicalDrugId } from './fdcMap';
import { evaluateAllergySafety } from './lactationAndAllergyGates';

export function assessSglt2FdcReplacement(patient: Patient, fdc: CurrentMed, component: string) {
  const target = dose(component, 'start');
  const targetMg = typeof target === 'object' && typeof target.amount === 'number' ? target.amount : undefined;
  const frequency = parseFrequencyPerDay(fdc.freq, typeof fdc.dose === 'string' ? fdc.dose : undefined);
  const currentMg = frequency === undefined ? undefined : parseComponentDailyDoseMg(fdc, component);
  const sglt2Meds = patient.currentMeds.filter((m) => expandDrugComponents(m.drugId)
    .some((c) => ['empagliflozin', 'dapagliflozin', 'canagliflozin', 'ertugliflozin', 'sotagliflozin'].includes(c)));
  const fdcAllergy = evaluateAllergySafety(fdc.drugId, patient) !== null || Boolean(patient.allergies?.some(
    (a) => resolveCanonicalDrugId(a) === resolveCanonicalDrugId(fdc.drugId)));
  const needsVerification = fdcAllergy || sglt2Meds.length !== 1 || currentMg === undefined || targetMg === undefined ||
    currentMg < targetMg || component === 'canagliflozin';
  const reason = fdcAllergy
    ? 'Có tiền sử dị ứng với viên phối hợp hoặc thành phần của viên: cần xác định hoạt chất gây dị ứng trước khi tách sang SGLT2i đơn chất; không tự coi hoạt chất còn lại đã dung nạp.'
    : component === 'canagliflozin'
    ? 'Cần xác nhận điều kiện duy trì trên nhãn Invokana (albumin niệu theo ngày), liều đã dung nạp và thuốc cảm ứng UGT; UACR không tự chứng minh albumin niệu theo ngày. Không tự cấp liều canagliflozin.'
    : 'Cần đối chiếu hàm lượng, tần suất và số thuốc phối hợp để xác nhận tổng liều SGLT2i đã dùng; không tự tăng liều hoặc cấp trùng hoạt chất.';
  return { needsVerification, reason, dose: fmtDose(target) };
}
