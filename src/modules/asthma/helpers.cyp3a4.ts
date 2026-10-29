import type { RuleContext } from '../../engine/types';
import { dose, drug, thFor } from '../../kb-types';
import { need } from '../../engine/require';
import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import { formatCurrentMedDose } from '../../engine/mergeConflictGroups';
import { TRIPLE_INHALER_DRUGS } from './helpers.constants';
import { evaluateAcuteAsthma, evaluateGinaControl, computeEffectiveTrack1Step, computeEffectiveTrack2Step, isAdultOrAdolescent } from './helpers.clinical';
import { hasStrongCyp3a4Inhibitor, hasSevereMilkProteinAllergy, isAllergicToDrug, isMartOveruse, isMedDpiDevice, resolveControllerAction } from './helpers.dosing';

/** One selection drives the replacement order, rescue order and patient handout. */
export function cypControllerBridge(ctx: RuleContext) {
  if (!hasStrongCyp3a4Inhibitor(ctx) || !isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return undefined;
  const acute = evaluateAcuteAsthma(ctx);
  if (acute.hasAcuteAttack && !acute.isDischargeReady) return undefined;
  if (!acute.isDischargeReady && evaluateGinaControl(ctx).level === 'missing') return undefined;
  const age = need(ctx, 'age');
  if (age === undefined) return undefined;
  const adult = age >= thFor('age', 'asthma.age.min_adult_18');
  const track2 = ctx.patient.customInputs?.currentTrack === 'track2';
  const step = acute.isDischargeReady ? 4 : track2 ? computeEffectiveTrack2Step(ctx) : computeEffectiveTrack1Step(ctx); // qa-allow: ui-step - discharge controller step
  const previousTriple = ctx.patient.currentMeds.some((m) => TRIPLE_INHALER_DRUGS.has(resolveKbDrugId(m.drugId)));
  const tripleId = 'beclometasone_glycopyrronium_formoterol';
  const useTriple = adult && previousTriple && !isAllergicToDrug(ctx, tripleId);
  const useCombo = useTriple || (adult && step >= 3 && !isAllergicToDrug(ctx, 'beclometasone_formoterol')); // qa-allow: ui-step - combination controller from step 3
  // Adult Track 1 already selects beclometasone/formoterol MART. Keep that established path.
  if (adult && !track2 && ctx.settings.setting === 'outpatient' && useCombo && !previousTriple) return undefined;
  const drugId = useTriple ? tripleId : useCombo ? 'beclometasone_formoterol' : 'beclometasone';
  const blocked = isAllergicToDrug(ctx, drugId);
  const recordedTarget = ctx.patient.currentMeds.find((m) => resolveKbDrugId(m.drugId) === drugId);
  const recordedPmdi = recordedTarget && /\bpmdi\b|evohaler|rapihaler|\bhfa\b/i.test(`${recordedTarget.name ?? ''} ${recordedTarget.dose ?? ''}`) && !isMedDpiDevice(recordedTarget);
  const needsDeviceSwitch = Boolean(recordedTarget && hasSevereMilkProteinAllergy(ctx) && !recordedPmdi);
  const currentTarget = needsDeviceSwitch ? undefined : recordedTarget;
  const action = needsDeviceSwitch ? { action: 'SWITCH' as const, switchFrom: recordedTarget?.name || recordedTarget?.drugId }
    : currentTarget ? { action: 'CONTINUE' as const, switchFrom: undefined } : resolveControllerAction(ctx, drugId, 'CONTINUE');
  const lowMin = thFor('dose_daily', 'asthma.ics.beclometasone_low_min');
  const lowMax = thFor('dose_daily', 'asthma.ics.beclometasone_low_max');
  const medMax = thFor('dose_daily', 'asthma.ics.beclometasone_med_max');
  const monoRange = step >= 4 ? `>${medMax}` : step >= 3 ? `>${lowMax}–${medMax}` : `${lowMin}–${lowMax}`; // qa-allow: ui-step - ICS band by treatment step
  const comboDose = useTriple || step >= 4 ? dose(drugId, 'target') : dose(drugId, 'start'); // qa-allow: ui-step - fixed maintenance step
  const comboTarget = dose(drugId, 'target');
  if (useCombo && (!comboDose || typeof comboDose === 'string' || !comboTarget || typeof comboTarget === 'string')) return undefined;
  const comboPuffs = comboDose && typeof comboDose !== 'string' ? comboDose.amount : undefined;
  const comboFrequency = comboTarget && typeof comboTarget !== 'string' ? comboTarget.frequency : undefined;
  const rescueId = !isAllergicToDrug(ctx, 'salbutamol') ? 'salbutamol'
    : !isAllergicToDrug(ctx, 'terbutaline') && !hasSevereMilkProteinAllergy(ctx) ? 'terbutaline' : undefined;
  const rescueNote = rescueId ? `${drug(rescueId).nameVi} riêng khi cần theo đúng thiết bị được kê` : 'Chưa có thuốc cắt cơn phù hợp: cần hội chẩn khẩn để chọn thuốc, không tự dùng SABA gây dị ứng';
  const proposedMaintenance = useCombo
    ? `${drug(drugId).forms.find((f) => /pmdi/i.test(f))}: ${comboPuffs} nhát x ${comboFrequency} qua buồng đệm; ${rescueNote} (không dùng chế độ MART trong cầu nối này)`
    : `Beclometasone pMDI HFA hạt siêu mịn không chứa lactose: ${monoRange} mcg/ngày theo liều ICS tương đương do bác sĩ xác nhận, không tự hạ liều; ${rescueNote}`;
  const currentDose = formatCurrentMedDose(currentTarget);
  const confirmedDose = !currentTarget || Boolean(currentDose && (currentTarget.freq || /lần|ngày|daily|bid|tid|qid/i.test(currentDose)));
  const deviceLabel = currentTarget && isMedDpiDevice(currentTarget) ? 'DPI theo đúng thiết bị hiện tại'
    : currentTarget && !recordedPmdi ? 'thiết bị hiện tại cần xác minh' : 'pMDI không chứa lactose';
  const maintenance = currentTarget
    ? `Duy trì ${currentDose || 'liều hiện tại cần bổ sung chính xác'}${currentTarget.freq && !currentDose?.includes(currentTarget.freq) ? `; tần suất ${currentTarget.freq}` : ''}; ${drug(drugId).nameVi} dạng ${deviceLabel}, không tự thay đổi liều; ${rescueNote}`
    : proposedMaintenance;
  return { drugId, blocked, adult, step, maintenance, rescueId, previousTriple, confirmedDose, deviceLabel, ...action };
}
