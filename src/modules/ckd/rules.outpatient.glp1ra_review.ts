import type { Rule } from '../../engine/types';
import { exendinComponent, exendinRenalAssessment } from './helpers.glp1';
import { getMedComponents, isGlp1RaMed, medDisplayName, normalizeDrugId } from './helpers';

const exendinRenalRules: Rule[] = ['exenatide', 'lixisenatide', 'insulin_glargine_lixisenatide'].map((target) => ({
  id: `ckd.glp1.renal_${target}`, module: 'ckd', setting: 'both', profiles: ['INTL', 'VN', 'US'],
  nameVi: 'Đánh giá an toàn thận của từng dạng exenatide/lixisenatide',
  when: (ctx) => ctx.patient.currentMeds.some((m) => normalizeDrugId(m.drugId) === target && exendinRenalAssessment(ctx,m).action !== undefined),
  produce: (ctx) => {
    const candidates = ctx.patient.currentMeds.filter((m) => normalizeDrugId(m.drugId) === target && exendinRenalAssessment(ctx,m).action !== undefined);
    const med = candidates.find((m) => exendinRenalAssessment(ctx,m).action === 'STOP') ?? candidates[0];
    const assessment = exendinRenalAssessment(ctx,med);
    const fdc = getMedComponents(med).length > 1;
    const fdcNote = fdc ? ' Bút phối hợp có insulin: khi ngừng bút, phải lập ngay phác đồ insulin đơn chất thay thế và theo dõi đường huyết; không để gián đoạn insulin nền. Không tự suy ra liều insulin từ liều bút chưa xác minh.' : '';
    return { id: `rec_ckd_glp1_renal_${target}`, module: 'ckd', tier: 'An toàn thuốc theo chức năng thận', tierOrder: 0,
      action: assessment.action!, drugId: target, drugNameVi: medDisplayName(med),
      title: `${assessment.action === 'STOP' ? 'NGỪNG' : 'Xác minh trước khi tiếp tục'} ${medDisplayName(med)}: an toàn thận`,
      rationale: assessment.reason + fdcNote,
      gates: [{ parameter: 'GLP1_Renal_Safety', passed: false, messageVi: assessment.reason }],
      citationIds: assessment.citationIds, priority: 103 };
  },
  citationIds: ['ada.dm2.2026.lixisenatide_exenatide_renal_avoid_30', 'fda.exenatide_ir.renal_impairment',
    'fda.exenatide_er.renal_impairment', 'fda.lixisenatide.renal_impairment'],
}));

export const ckdGlp1ReviewRules: Rule[] = [...exendinRenalRules, {
  id: 'ckd.glp1.outcome_evidence', module: 'ckd', setting: 'outpatient', profiles: ['INTL', 'VN', 'US'],
  nameVi: 'Phân biệt bằng chứng tim mạch và kết cục thận theo hoạt chất GLP-1',
  when: (ctx) => ctx.patient.currentMeds.some((m) => isGlp1RaMed(m) && !exendinComponent(m)),
  produce: (ctx) => {
    const meds = ctx.patient.currentMeds.filter((m) => isGlp1RaMed(m) && !exendinComponent(m));
    const ids = new Set(meds.flatMap(getMedComponents));
    const details = [
      ids.has('semaglutide') ? 'Semaglutide tiêm dưới da: có thử nghiệm FLOW về tiến triển CKD; không tự suy liều hiện tại đã đạt đích hoặc tối đa dung nạp.' : '',
      ids.has('semaglutide_oral') ? 'Semaglutide uống có lợi ích tim mạch; không đồng nhất bằng chứng kết cục thận với semaglutide tiêm trong FLOW. Cân nhắc mục tiêu thận, dung nạp và lựa chọn của người bệnh trước khi đổi dạng.' : '',
      ids.has('dulaglutide') || ids.has('liraglutide') ? 'Dulaglutide/liraglutide có lợi ích tim mạch và tín hiệu thận chủ yếu qua albumin niệu; không coi tương đương thử nghiệm kết cục thận chuyên biệt FLOW.' : '',
      ids.has('tirzepatide') ? 'Tirzepatide: bằng chứng thận trong tài liệu hiện hành chủ yếu từ phân tích hậu kiểm; không coi đã có thử nghiệm kết cục thận chuyên biệt tương đương FLOW.' : '',
    ].filter(Boolean);
    return { id: 'rec_ckd_glp1_outcome_evidence', module: 'ckd', action: 'MONITOR', tier: 'Rà soát mục tiêu bảo vệ tim - thận', tierOrder: 2,
      title: 'Đối chiếu lợi ích thận theo hoạt chất và dạng GLP-1 đang dùng',
      rationale: `${meds.map(medDisplayName).join(', ')}. ${details.join(' ')} Không thêm GLP-1 thứ hai hoặc tự chuyển thuốc chỉ vì cùng nhóm.`,
      gates: [], citationIds: ['ada.ckd.2026.glp1_agent_kidney_evidence', 'ada.ckd.2026.glp1_outcome_table'], priority: 65 };
  },
  citationIds: ['ada.ckd.2026.glp1_agent_kidney_evidence', 'ada.ckd.2026.glp1_outcome_table'],
}];
