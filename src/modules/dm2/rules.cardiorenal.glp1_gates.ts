/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Cổng Chặn An toàn & Cảnh báo cho Trụ cột GLP-1 / GIP-GLP-1 RA
 * Phân quyền: Agent F4
 */

import type { CurrentMed, Recommendation, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  DPP4_IDS,
  hasAcuteCatabolicKetosis,
  hasDiabeticRetinopathy,
  hasDrugAllergy,
  hasMtcOrMen2,
  hasPancreatitis,
  hasPlannedSurgery,
  hasSevereGastroparesis,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isTakingAnyCanonical,
  isUsingOralContraceptive,
  resolveTargetRecDrug
} from './helpers';

export function checkGlp1BlockingGate(
  ctx: RuleContext,
  activeGlp1Id: string | undefined,
  activeGlp1Med: CurrentMed | undefined,
  chosenGlp1: string | undefined
): Recommendation | 'SKIP' | null {
  if (isBreastfeeding(ctx)) {
    if (activeGlp1Id) return 'SKIP';
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'semaglutide',
      drugNameVi: drug('semaglutide').nameVi,
      title: 'Tránh khởi trị nhóm đồng vận GLP-1 / GIP-GLP-1 RA trong thời kỳ cho con bú',
      rationale:
        'ADA 2026 Ch. 15 & Nhãn FDA Mục 8.2: Thiếu dữ liệu an toàn ở trẻ bú mẹ (đặc biệt Rybelsus có chất tăng hấp thu SNAC bài tiết qua sữa); ưu tiên sử dụng Insulin và/hoặc Metformin trong giai đoạn cho con bú.',
      gates: [{ parameter: 'breastfeeding', passed: false, threshold: 1, messageVi: 'Đang cho con bú: Tránh GLP-1 RA' }],
      citationIds: ['ada.dm2.2026.pregnancy_glp1', 'ada.dm2.2026.pregnancy_insulin'],
      priority: 99
    };
  }

  if (isActivelyHypoglycemic(ctx)) {
    if (
      !activeGlp1Id &&
      (ctx.patient.selectedModules.includes('hf') || ctx.patient.selectedModules.includes('ckd'))
    ) {
      return {
        id: 'rec_dm2_glp1_cardiorenal',
        module: 'dm2',
        tier: 'Cấp cứu & Xử trí biến cố cấp',
        tierOrder: 0,
        action: 'HOLD',
        drugId: 'semaglutide',
        drugNameVi: drug('semaglutide').nameVi,
        title: 'Tạm hoãn khởi trị GLP-1 RA trong giai đoạn cấp cứu hạ đường huyết',
        rationale:
          'ADA 2026 Ch. 6: Trong cơn hạ đường huyết cấp, ưu tiên bù Glucose và ổn định đường huyết trước khi khởi trị thêm thuốc mạn tính.',
        gates: [],
        citationIds: ['ada.dm2.2026.hypo_rule_of_15'],
        priority: 99
      };
    }
    return 'SKIP';
  }

  if (hasMtcOrMen2(ctx)) {
    if (activeGlp1Id) return 'SKIP';
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'semaglutide',
      drugNameVi: drug('semaglutide').nameVi,
      title: 'CHỐNG CHỈ ĐỊNH nhóm đồng vận GLP-1 / GIP-GLP-1 RA (Tiền sử MTC / MEN 2)',
      rationale:
        'Cảnh báo hộp đen FDA & ADA 2026 Ch. 9: Tuyệt đối không kê đơn Semaglutide, Tirzepatide hay bất kỳ thuốc đồng vận GLP-1 RA nào ở bệnh nhân có tiền sử bản thân hoặc gia đình mắc Ung thư tuyến giáp thể tủy (MTC) hoặc Hội chứng MEN 2.',
      gates: [{ parameter: 'mtc_men2', passed: false, threshold: 1, messageVi: 'Tiền sử MTC/MEN 2: Chống chỉ định tuyệt đối GLP-1 RA' }],
      citationIds: ['fda.semaglutide.boxed_warning_mtc', 'fda.tirzepatide.boxed_warning_mtc'],
      priority: 100
    };
  }

  if (hasPancreatitis(ctx)) {
    if (activeGlp1Id) return 'SKIP';
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'semaglutide',
      drugNameVi: drug('semaglutide').nameVi,
      title: 'Tránh khởi trị nhóm GLP-1 / GIP-GLP-1 RA do tiền sử Viêm tụy',
      rationale:
        'ADA 2026 Ch. 9 & Nhãn FDA: Không khởi trị các thuốc tác động trục Incretin (GLP-1 RA, GIP/GLP-1 RA) ở người bệnh có tiền sử hoặc đang nghi ngờ viêm tụy cấp.',
      gates: [{ parameter: 'pancreatitis', passed: false, threshold: 1, messageVi: 'Tiền sử viêm tụy: Tránh GLP-1 RA' }],
      citationIds: ['ada.dm2.2026.incretin_pancreatitis', 'fda.semaglutide.pancreatitis'],
      priority: 99
    };
  }

  if (hasSevereGastroparesis(ctx)) {
    const gastroCits = ['fda.semaglutide.gastroparesis_avoid', 'ada.dm2.2026.glp1_gastroparesis_table92'];
    if (activeGlp1Id) {
      const target = resolveTargetRecDrug(activeGlp1Id, activeGlp1Med);
      return {
        id: 'rec_dm2_glp1_cardiorenal',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Ngừng ${target.drugNameVi} do Liệt dạ dày nặng (Severe Gastroparesis)`,
        rationale:
          'ADA 2026 Ch. 9 (Bảng 9.2) & Nhãn FDA: Nhóm GLP-1 / GIP-GLP-1 RA làm chậm làm rỗng dạ dày, không khuyến cáo sử dụng và cần ngừng khi bệnh nhân có liệt dạ dày nặng gây nôn ói kéo dài, mất nước.',
        gates: [{ parameter: 'severeGastroparesis', passed: false, threshold: 1, messageVi: 'Liệt dạ dày nặng: Ngừng GLP-1 RA' }],
        citationIds: gastroCits,
        priority: 98
      };
    }
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'semaglutide',
      drugNameVi: drug('semaglutide').nameVi,
      title: 'Tránh khởi trị nhóm GLP-1 / GIP-GLP-1 RA do Liệt dạ dày nặng (Severe Gastroparesis)',
      rationale:
        'ADA 2026 Ch. 9 (Bảng 9.2) & Nhãn FDA: Không khuyến cáo khởi trị đồng vận GLP-1 / GIP-GLP-1 RA ở người bệnh có liệt dạ dày nặng do làm trầm trọng thêm tình trạng ứ đọng dạ dày và nôn ói.',
      gates: [{ parameter: 'severeGastroparesis', passed: false, threshold: 1, messageVi: 'Liệt dạ dày nặng: Tránh GLP-1 RA' }],
      citationIds: gastroCits,
      priority: 98
    };
  }

  if (hasPlannedSurgery(ctx)) {
    if (activeGlp1Id) return 'SKIP';
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
      tierOrder: 1,
      action: 'DEFER',
      drugId: 'semaglutide',
      drugNameVi: drug('semaglutide').nameVi,
      title: 'Trì hoãn khởi trị mới GLP-1 / GIP-GLP-1 RA trước phẫu thuật chương trình (Phòng nguy cơ hít sặc gây mê)',
      rationale:
        'ADA 2026 Ch. 16 & Đồng thuận Chu phẫu: Tuyệt đối không khởi trị mới GLP-1 / GIP-GLP-1 RA ngay trước phẫu thuật vì giai đoạn dò liều đầu có tỷ lệ chậm làm rỗng dạ dày, buồn nôn và tồn lưu thức ăn cao nhất, làm tăng nguy cơ trào ngược hít sặc phổi khi gây mê. Chỉ khởi trị sau mổ khi ăn uống ổn định.',
      gates: [{ parameter: 'plannedSurgery', passed: false, threshold: 1, messageVi: 'Sắp phẫu thuật: Hoãn khởi trị mới GLP-1 RA' }],
      citationIds: ['ada.dm2.2026.periop_glp1_aspiration'],
      priority: 97
    };
  }

  if (activeGlp1Id && hasDrugAllergy(ctx, activeGlp1Id)) {
    return 'SKIP';
  }

  if (!activeGlp1Id && !chosenGlp1) {
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'semaglutide',
      drugNameVi: 'Nhóm đồng vận GLP-1 / GIP-GLP-1 RA',
      title: 'Tránh khởi trị nhóm GLP-1 / GIP-GLP-1 RA do tiền sử dị ứng / quá mẫn',
      rationale:
        'Ghi nhận tiền sử dị ứng hoặc phản ứng quá mẫn nghiêm trọng với tất cả các hoạt chất đồng vận GLP-1 / GIP-GLP-1 RA trong danh mục.',
      gates: [{ parameter: 'allergy', passed: false, threshold: 1, messageVi: 'Dị ứng nhóm GLP-1 RA' }],
      citationIds: ['ada.dm2.2026.rec_9_7_ascvd'],
      priority: 98
    };
  }

  if (!activeGlp1Id && hasAcuteCatabolicKetosis(ctx)) {
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      module: 'dm2',
      tier: 'Bảo vệ tim – thận nền tảng',
      tierOrder: 2,
      action: 'DEFER',
      drugId: chosenGlp1 || 'semaglutide',
      drugNameVi: drug(chosenGlp1 || 'semaglutide').nameVi,
      title: 'Trì hoãn khởi trị GLP-1 RA do đang dị hóa cấp / nhẹ cân kèm tăng ceton máu',
      rationale:
        'ADA 2026 Ch. 9: Ở bệnh nhân thiếu hụt insulin nặng biểu hiện sụt cân dị hóa cấp hoặc tăng ceton máu, bắt buộc khởi trị Insulin trước để đảo ngược dị hóa; chỉ xem xét phối hợp GLP-1 RA sau khi ổn định chuyển hóa.',
      gates: [],
      citationIds: ['ada.dm2.2026.early_insulin_severe'],
      priority: 86
    };
  }

  return null;
}

export function buildGlp1ExtraWarningsAndCits(
  ctx: RuleContext,
  drugKey: string
): { warnings: string[]; extraCits: string[] } {
  const hba1c = need(ctx, 'hba1c');
  const age = need(ctx, 'age');
  const hasRetinopathyCaution =
    hasDiabeticRetinopathy(ctx) ||
    (hba1c !== undefined && hba1c >= thFor('hba1c', 'dm2.early_insulin.hba1c'));

  const warnings: string[] = [];
  const extraCits: string[] = [];

  if (isTakingAnyCanonical(ctx, DPP4_IDS)) {
    warnings.push('Bệnh nhân đang dùng thuốc ức chế DPP-4: Bắt buộc NGỪNG DPP-4i do trùng lặp trục incretin.');
  }
  if (hasRetinopathyCaution) {
    warnings.push(
      'Lưu ý bệnh võng mạc ĐTĐ (SUSTAIN-6 / ADA 2026): Hạ đường huyết nhanh trên nền bệnh võng mạc ĐTĐ hoặc HbA1c rất cao có thể làm nặng tạm thời biến chứng đáy mắt; cần khám mắt giãn đồng tử và theo dõi sát thị lực.'
    );
    extraCits.push('ada.dm2.2026.glp1_retinopathy_monitor');
  }
  if (
    drugKey === 'tirzepatide' &&
    (isUsingOralContraceptive(ctx) ||
      (ctx.patient.sex === 'female' && age !== undefined && age < thFor('age', 'dm2.elderly.age_threshold') - 15)) // qa-allow: index - Độ tuổi sinh sản nữ dưới 50 tuổi
  ) {
    warnings.push(
      'Tương tác thuốc tránh thai đường uống (Nhãn FDA Mounjaro): Tirzepatide làm giảm hấp thu thuốc tránh thai uống; khuyến cáo đổi sang biện pháp tránh thai không qua đường uống hoặc bổ sung màng chắn trong 4 tuần sau khi khởi trị và sau mỗi bậc tăng liều.'
    );
    extraCits.push('fda.tirzepatide.oral_contraceptive_4wk');
  }
  return { warnings, extraCits };
}
