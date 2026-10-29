import type { Action, GateResult, Recommendation, RuleContext } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getDrugDisplayVi,
  hasAcuteKidneyInjury,
  hasDrugAllergy,
  hasType1Diabetes,
  isCombinationMed,
  isLactating,
  isOnDialysis,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  resolveMatchedComponentId,
  SGLT2I_IDS,
} from './helpers';

export function evaluateHfSglt2i(
  ctx: RuleContext,
  tier: string,
  rationalePrefixVi: string,
  extraCitations: string[] = []
): Recommendation | null {
  const activeMed = findCurrentMed(ctx, SGLT2I_IDS);
  const matchedSglt2Id = resolveMatchedComponentId(activeMed, SGLT2I_IDS) ?? 'dapagliflozin';
  const isMetforminFdc =
    Boolean(activeMed) &&
    isCombinationMed(activeMed) &&
    `${activeMed?.drugId ?? ''} ${activeMed?.name ?? ''}`.toLowerCase().includes('metformin');

  const baseCits = Array.from(
    new Set([
      'esc.hf.2026.sglt2i_all_lvef',
      'esc.hf.2026.sglt2i_doses_table11',
      'esc.hf.2026.sglt2i_table_s9',
      'fda.hf.dapagliflozin_withhold_3days',
      'kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf',
      ...extraCitations,
    ])
  );

  if (isPregnant(ctx) || isLactating(ctx)) {
    const why = isPregnant(ctx) ? 'đang mang thai' : 'đang cho con bú';
    const targetDrugId = activeMed?.drugId ?? matchedSglt2Id;
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: activeMed ? 'STOP' : 'AVOID',
      drugId: targetDrugId,
      drugNameVi: getDrugDisplayVi(targetDrugId, activeMed),
      title: `${activeMed ? 'Ngưng ngay' : 'Chống chỉ định'} ${getDrugDisplayVi(targetDrugId, activeMed)} (SGLT2i) khi ${why}`,
      rationale: `Phải ngưng và tránh dùng nhóm SGLT2i khi ${why} do nguy cơ độc tính trên sự trưởng thành thận của thai nhi và trẻ bú mẹ.`,
      gates: [{ parameter: 'Thai kỳ / Cho con bú', passed: false, messageVi: `Không dùng SGLT2i khi ${why}` }],
      citationIds: ['esc.hf.2026.pregnancy_contra', 'esc.preg.2025.sglt2i_stop_preg_lact', 'fda.hf.dapagliflozin_lactation', ...baseCits],
      priority: 96,
    };
  }

  const allergicDapa = hasDrugAllergy(ctx, ['dapagliflozin', 'farxiga', 'forxiga']);
  const allergicEmpa = hasDrugAllergy(ctx, ['empagliflozin', 'jardiance']);
  const allergicClass = hasDrugAllergy(ctx, ['sglt2', 'gliflozin']) || (allergicDapa && allergicEmpa);

  if (hasType1Diabetes(ctx) || isOnDialysis(ctx) || allergicClass) {
    const reason = allergicClass
      ? 'Tiền sử dị ứng quá mẫn với nhóm SGLT2i'
      : hasType1Diabetes(ctx)
        ? 'Đái tháo đường típ 1 (nguy cơ nhiễm toan ceton đẳng đường huyết cao)'
        : 'Đang lọc máu chu kỳ (ngưng SGLT2i khi bắt đầu lọc máu)';
    const targetDrugId = activeMed?.drugId ?? matchedSglt2Id;
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: activeMed ? 'STOP' : 'AVOID',
      drugId: targetDrugId,
      drugNameVi: getDrugDisplayVi(targetDrugId, activeMed),
      title: `${activeMed ? 'Ngưng' : 'Tránh khởi trị'} ${getDrugDisplayVi(targetDrugId, activeMed)} (SGLT2i)`,
      rationale: `Không sử dụng SGLT2i do: ${reason}.`,
      gates: [{ parameter: 'Chống chỉ định SGLT2i', passed: false, messageVi: reason }],
      citationIds: baseCits,
      priority: 94,
    };
  }

  if (isShockOrInotrope(ctx) || hasAcuteKidneyInjury(ctx)) {
    const why = isShockOrInotrope(ctx)
      ? 'sốc tim / đang truyền vận mạch hoặc giảm tưới máu'
      : 'đang trong đợt tổn thương thận cấp (AKI)';
    const targetDrugId = activeMed?.drugId ?? matchedSglt2Id;
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: 'HOLD',
      drugId: targetDrugId,
      drugNameVi: getDrugDisplayVi(targetDrugId, activeMed),
      title: `Tạm hoãn ${getDrugDisplayVi(targetDrugId, activeMed)} do ${why}`,
      rationale: `Cần tạm ngưng SGLT2i khi ${why} (nguy cơ mất dịch và nhiễm toan ceton đẳng đường huyết); đánh giá khởi động lại khi huyết động và thận hồi phục ổn định.`,
      gates: [{ parameter: 'Huyết động / AKI', passed: false, messageVi: why }],
      citationIds: ['esc.hf.2026.rasi_arni_aki_egfr15_k', ...baseCits],
      priority: 93,
    };
  }

  if (!activeMed && isOutpatientDecompensatedCrisis(ctx)) {
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: 'DEFER',
      drugId: matchedSglt2Id,
      drugNameVi: getDrugDisplayVi(matchedSglt2Id),
      title: 'Trì hoãn khởi trị mới SGLT2i ngoại trú cho tới khi nhập viện ổn định đợt mất bù cấp',
      rationale: 'Bệnh nhân NYHA IV kèm sung huyết phổi/ngoại biên rõ tại phòng khám cần chuyển nhập viện xử trí cấp trước khi khởi trị thuốc mạn.',
      gates: [{ parameter: 'Đợt mất bù cấp ngoại trú', passed: false, messageVi: 'Chuyển nhập viện ổn định trước' }],
      citationIds: baseCits,
      priority: 85,
    };
  }

  const egfr = need(ctx, 'egfr');
  if (egfr === undefined) {
    return missingInputRec('hf', 'egfr', 'xác nhận độ lọc cầu thận trước khi chỉ định SGLT2i ở suy tim', baseCits);
  }
  const sbp = need(ctx, 'sbp');
  if (sbp === undefined) {
    return missingInputRec('hf', 'sbp', 'kiểm tra huyết áp tâm thu trước khi chỉ định SGLT2i ở suy tim', baseCits);
  }
  if (need(ctx, 'lvef') === undefined) return null;

  const sbpShock = thFor('sbp', 'hf.acute.shock_sbp');
  const sbpCaution = thFor('sbp', 'hf.sglt2i.sbp_caution_min');
  const egfrMinEsc = thFor('egfr', 'hf.sglt2i.egfr_initiate_min');
  const egfrMinUsDapa = thFor('egfr', 'hf.sglt2i.egfr_initiate_min_us');
  const egfrMetFdcMin = thFor('egfr', 'hf.sglt2i.egfr_metformin_fdc_min');
  const withholdDays = thFor('duration_days', 'hf.sglt2i.surgery_withhold_days');

  const minSbpGate = activeMed ? sbpShock : sbpCaution;
  const gates: GateResult[] = [
    { parameter: 'SBP', passed: sbp >= minSbpGate, value: sbp, threshold: `>= ${minSbpGate}`, messageVi: `SBP >= ${minSbpGate} mmHg` },
    { parameter: 'eGFR', passed: Boolean(activeMed) || egfr >= egfrMinEsc, value: egfr, threshold: `>= ${egfrMinEsc}`, messageVi: `eGFR khởi trị >= ${egfrMinEsc} mL/phút/1,73m²` },
  ];

  if (sbp < minSbpGate) {
    const targetDrugId = activeMed?.drugId ?? matchedSglt2Id;
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: 'HOLD',
      drugId: targetDrugId,
      drugNameVi: getDrugDisplayVi(targetDrugId, activeMed),
      title: `Tạm hoãn ${getDrugDisplayVi(targetDrugId, activeMed)} do huyết áp tâm thu thấp (${sbp} mmHg)`,
      rationale: `Huyết áp tâm thu hiện tại (${sbp} mmHg) dưới ngưỡng an toàn ${minSbpGate} mmHg; tạm hoãn khởi trị/duy trì SGLT2i và đánh giá thể tích tuần hoàn.`,
      gates,
      citationIds: baseCits,
      priority: 88,
    };
  }

  if (!activeMed && egfr < egfrMinEsc) {
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: 'DEFER',
      drugId: matchedSglt2Id,
      drugNameVi: getDrugDisplayVi(matchedSglt2Id),
      title: `Trì hoãn khởi trị mới ${getDrugDisplayVi(matchedSglt2Id)} do eGFR dưới ${egfrMinEsc} mL/phút/1,73m²`,
      rationale: `eGFR hiện tại (${egfr} mL/phút/1,73m²) thấp hơn ngưỡng khởi trị ${egfrMinEsc} mL/phút/1,73m² theo ESC 2026 và nhãn thuốc.`,
      gates,
      citationIds: baseCits,
      priority: 75,
    };
  }

  if (isMetforminFdc && egfr < egfrMetFdcMin && activeMed) {
    const singleDose = formatHfDose(dose(matchedSglt2Id, 'start'));
    return {
      id: 'rec_hf_sglt2i',
      module: 'hf',
      tier,
      tierOrder: 1,
      action: 'SWITCH',
      drugId: matchedSglt2Id,
      switchFrom: activeMed.drugId,
      drugNameVi: getDrugDisplayVi(matchedSglt2Id),
      dose: singleDose,
      title: `Tách viên phối hợp ${getDrugDisplayVi(activeMed.drugId, activeMed)}: Ngưng Metformin (eGFR < ${egfrMetFdcMin}) và chuyển sang ${getDrugDisplayVi(matchedSglt2Id)} đơn chất`,
      rationale: `Khi eGFR giảm dưới ${egfrMetFdcMin} mL/phút/1,73m², chống chỉ định thành phần Metformin do nguy cơ nhiễm toan lactic; tách sang ${getDrugDisplayVi(matchedSglt2Id)} đơn chất ${singleDose} để tiếp tục bảo vệ tim-thận tới khi lọc máu.`,
      gates,
      citationIds: ['esc.hf.2026.metformin_egfr30_hf', ...baseCits],
      priority: 95,
    };
  }

  let chosenId = matchedSglt2Id;
  if (!activeMed) {
    if (allergicDapa) chosenId = 'empagliflozin';
    else if (allergicEmpa) chosenId = 'dapagliflozin';
    else if (ctx.settings.profile === 'US' && egfr < egfrMinUsDapa) chosenId = 'empagliflozin';
  }

  const action: Action = activeMed ? 'CONTINUE' : 'START';
  const outDrugId = activeMed ? activeMed.drugId : chosenId;
  const doseText =
    activeMed && isCombinationMed(activeMed)
      ? formatCurrentMedDoseVi(activeMed, chosenId)
      : formatHfDose(dose(chosenId, 'start'));

  const warnings: string[] = [
    `Ngưng tạm thời SGLT2i ít nhất ${withholdDays} ngày trước đại phẫu hoặc thủ thuật nhịn ăn kéo dài và khi bệnh cấp tính mất nước (sick-day rule) để phòng nhiễm toan ceton đẳng đường huyết.`,
  ];
  if (sbp < sbpCaution) {
    warnings.push(`Thận trọng theo dõi thể tích tuần hoàn và huyết áp khi SBP dưới ${sbpCaution} mmHg.`);
  }

  return {
    id: 'rec_hf_sglt2i',
    module: 'hf',
    tier,
    tierOrder: 1,
    action,
    drugId: outDrugId,
    drugNameVi: activeMed ? getDrugDisplayVi(outDrugId, activeMed) : `${getDrugDisplayVi(chosenId)} (hoặc ${chosenId === 'empagliflozin' ? 'Dapagliflozin' : 'Empagliflozin'})`,
    dose: doseText,
    title: `${action === 'CONTINUE' ? 'Tiếp tục duy trì' : 'Khởi trị trụ cột SGLT2i:'} ${getDrugDisplayVi(outDrugId, activeMed)}`,
    rationale: `${rationalePrefixVi}${egfr < egfrMinEsc ? ` Bệnh nhân đang dùng trước đó được tiếp tục duy trì dù eGFR giảm dưới ${egfrMinEsc} mL/phút/1,73m² cho đến khi bắt đầu lọc máu.` : ''}`,
    gates,
    warnings,
    profileDiff: {
      INTL: `ESC 2026 khuyến cáo Class I-A SGLT2i xuyên suốt mọi phân suất tống máu từ ngưỡng eGFR >= ${egfrMinEsc} mL/phút/1,73m².`,
      US: `FDA phê duyệt Empagliflozin khởi trị từ eGFR >= ${egfrMinEsc} và Dapagliflozin khởi trị mới từ eGFR >= ${egfrMinUsDapa} mL/phút/1,73m² (duy trì nếu giảm dưới ${egfrMinUsDapa}).`,
      VN: 'BYT QĐ 1857/2022 khuyến cáo Class I-A cho HFrEF và Class IIa cho HFmrEF/HFpEF.',
    },
    benefitsAlso: ['ckd', 'dm2'],
    citationIds: ctx.settings.profile === 'US' ? ['fda.hf.dapagliflozin_egfr25', ...baseCits] : baseCits,
    priority: 94,
  };
}
