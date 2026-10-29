/** Preserve an established SGLT2 component when renal safety stops its metformin FDC. */
import type { Rule, RuleContext } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import { sglt2iLabelCitation } from '../../engine/safety/renalDoseAdjustment';
import { assessSglt2FdcReplacement } from '../../engine/safety/sglt2FdcReplacement';
import {
  extractSglt2iComponentId, hasCkdDrugAllergy, hasCkdFlag,
  hasMetforminComponent, isAkiActive, isBreastfeedingCkd, isChildPughC,
  isOutpatientAcuteCrisis, isSglt2iMed, medDisplayName, normalizeDrugId,
} from './helpers';

function currentFdc(ctx: RuleContext) {
  return ctx.patient.currentMeds.filter((m) => isSglt2iMed(m) && hasMetforminComponent(m));
}

export const ckdOutpatientSglt2iFdcBridgeRules: Rule[] = [{
  id: 'ckd.outpatient.sglt2i_fdc_continue_below_20',
  module: 'ckd',
  nameVi: 'Giữ hoạt chất SGLT2i đã dùng khi ngừng viên phối hợp Metformin',
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    const egfr = need(ctx, 'egfr');
    if (egfr === undefined || egfr <= 0 || egfr >= thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')) return false;
    if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant') || isBreastfeedingCkd(ctx) ||
      isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx) || hasCondition(ctx, 'plannedSurgery')) return false;
    // A single agent already in the regimen has its own continuation/safety review.
    if (ctx.patient.currentMeds.some((m) => isSglt2iMed(m) && !hasMetforminComponent(m) && !hasCkdDrugAllergy(ctx, m.drugId))) return false;
    const component = extractSglt2iComponentId(currentFdc(ctx)[0]);
    if (!component || !['empagliflozin', 'dapagliflozin', 'canagliflozin'].includes(component)) return false;
    return !hasCkdDrugAllergy(ctx, component) && !(component === 'canagliflozin' && isChildPughC(ctx));
  },
  produce: (ctx) => {
    const fdcs = currentFdc(ctx);
    const fdc = fdcs[0];
    const component = extractSglt2iComponentId(fdc)!;
    const name = drug(component).nameVi;
    const { needsVerification, reason, dose: singleDose } = assessSglt2FdcReplacement(ctx.patient, fdc, component);
    const citationIds = ['kdigo.ckd.2024.pp_3_7_1_continue_below_20', sglt2iLabelCitation(component)];
    if (component === 'canagliflozin') citationIds.push('fda.canagliflozin.table_1_renal_impairment', 'fda.canagliflozin.ugt_inducer_renal_dosing');
    const metforminFloor = thFor('egfr', 'ckd.egfr.g3b_min');
    const initiationFloor = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
    return {
      id: `rec_ckd_sglt2i_fdc_bridge_${component}`,
      module: 'ckd', tier: 'Duy trì bảo vệ tim–thận sau tách viên phối hợp', tierOrder: 1,
      action: needsVerification ? 'DEFER' : 'SWITCH',
      drugId: component, drugNameVi: name,
      switchFrom: needsVerification ? undefined : normalizeDrugId(fdc.drugId),
      dose: needsVerification ? undefined : singleDose,
      title: needsVerification ? `XÁC MINH chuyển ${medDisplayName(fdc)} sang ${name} đơn chất`
        : `CHUYỂN ${medDisplayName(fdc)} sang ${name} đơn chất ${singleDose}`,
      rationale: `Ngừng viên phối hợp chứa Metformin do eGFR < ${metforminFloor}. KDIGO 2024 PP 3.7.1 cho phép duy trì SGLT2i đã khởi trị khi eGFR giảm dưới ${initiationFloor} nếu dung nạp và chưa điều trị thay thế thận. ${needsVerification ? reason : `Giữ đúng hoạt chất ${name} đã có trong viên phối hợp, không thêm SGLT2i mới; ngừng hoàn toàn ${medDisplayName(fdc)}, không dùng đồng thời viên cũ và đơn chất. Liều đơn chất không vượt tổng liều hoạt chất đã dùng. Xác nhận dung nạp, tình trạng dịch và chức năng thận khi chuyển.`}`,
      gates: [{ parameter: 'fdc_continuation', passed: !needsVerification,
        messageVi: needsVerification ? reason : 'Đã có cùng hoạt chất trong viên phối hợp; thay viên cũ, không khởi trị mới dưới ngưỡng.' }],
      citationIds,
      priority: 85,
    };
  },
  citationIds: ['kdigo.ckd.2024.pp_3_7_1_continue_below_20'],
}];
