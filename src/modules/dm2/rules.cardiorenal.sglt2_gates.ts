/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Cổng Chặn An toàn & Chu phẫu cho Trụ cột SGLT2i
 * Phân quyền: Agent F4
 */

import type { CurrentMed, Recommendation, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, hasDrug, thFor } from '../../kb-types/access';
import {
  hasDrugAllergy,
  hasHepaticImpairment,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isOnDialysis,
  resolveDrugNameVi,
  resolveTargetRecDrug
} from './helpers';

export function checkSglt2BlockingGate(
  ctx: RuleContext,
  activeSglt2Id: string | undefined,
  activeSglt2Med: CurrentMed | undefined,
  chosenSglt2: string | undefined,
  fdcBlockedReason: string | undefined
): Recommendation | 'SKIP' | null {
  const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');

  if (isBreastfeeding(ctx)) {
    if (activeSglt2Id) return 'SKIP';
    return {
      id: 'rec_dm2_sglt2i_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'dapagliflozin',
      drugNameVi: drug('dapagliflozin').nameVi,
      title: 'Tránh khởi trị nhóm ức chế SGLT2 trong thời kỳ cho con bú',
      rationale:
        'ADA 2026 Ch. 15 & Nhãn FDA Mục 8.2 (Farxiga/Jardiance): Không khuyến cáo sử dụng thuốc ức chế SGLT2 khi đang cho con bú do nguy cơ tiềm ẩn ảnh hưởng đến sự trưởng thành thận của trẻ nhũ nhi; ưu tiên Insulin và/hoặc Metformin.',
      gates: [{ parameter: 'breastfeeding', passed: false, threshold: 1, messageVi: 'Đang cho con bú: Tránh SGLT2i' }],
      citationIds: ['ada.dm2.2026.pregnancy_noninsulin', 'ada.dm2.2026.pregnancy_insulin'],
      priority: 99
    };
  }

  if (isActivelyHypoglycemic(ctx)) {
    if (
      !activeSglt2Id &&
      (ctx.patient.selectedModules.includes('hf') || ctx.patient.selectedModules.includes('ckd'))
    ) {
      return {
        id: 'rec_dm2_sglt2i_cardiorenal',
        module: 'dm2',
        tier: 'Cấp cứu & Xử trí biến cố cấp',
        tierOrder: 0,
        action: 'HOLD',
        drugId: 'dapagliflozin',
        drugNameVi: drug('dapagliflozin').nameVi,
        title: 'Tạm hoãn khởi trị SGLT2i trong giai đoạn cấp cứu hạ đường huyết',
        rationale:
          'ADA 2026 Ch. 6: Trong cơn hạ đường huyết cấp, ưu tiên tuyệt đối bù Glucose cấp cứu và rà soát nguyên nhân trước khi khởi trị thêm bất kỳ thuốc mạn tính nào.',
        gates: [],
        citationIds: ['ada.dm2.2026.hypo_rule_of_15'],
        priority: 99
      };
    }
    return 'SKIP';
  }

  if (isOnDialysis(ctx)) {
    if (activeSglt2Id) return 'SKIP';
    return {
      id: 'rec_dm2_sglt2i_cardiorenal',
      module: 'dm2',
      tier: 'Bảo vệ tim – thận nền tảng',
      tierOrder: 1,
      action: 'AVOID',
      drugId: 'dapagliflozin',
      drugNameVi: drug('dapagliflozin').nameVi,
      title: 'Tránh khởi trị SGLT2i ở bệnh nhân đang lọc máu chu kỳ (Dialysis)',
      rationale:
        'ADA 2026 Ch. 11: Không khởi trị mới và cần ngừng SGLT2i khi bệnh nhân đã bước vào lọc máu chu kỳ (ngay cả khi creatinin máu sau buổi lọc thận giảm giả tạo).',
      gates: [{ parameter: 'dialysis', passed: false, threshold: minEgfr, messageVi: 'Đang lọc máu: Không khởi trị SGLT2i' }],
      citationIds: ['ada.dm2.2026.sglt2_stop_kidney_failure'],
      priority: 99
    };
  }

  if (hasHepaticImpairment(ctx)) {
    if (activeSglt2Id) {
      const target = resolveTargetRecDrug(activeSglt2Id, activeSglt2Med);
      return {
        id: 'rec_dm2_sglt2i_cardiorenal',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Ngừng ${target.drugNameVi} ở bệnh nhân suy gan mất bù / bệnh gan tiến triển`,
        rationale:
          'ADA 2026 Ch. 4 & Ch. 9: Không khuyến cáo tiếp tục SGLT2i ở bệnh nhân xơ gan mất bù (Child-Pugh B/C) hoặc suy gan nặng do tăng phơi nhiễm thuốc, mất dịch và nguy cơ nhiễm toan chuyển hóa; ưu tiên chuyển sang Insulin chuẩn độ thận trọng.',
        gates: [{ parameter: 'hepatic', passed: false, threshold: 1, messageVi: 'Suy gan mất bù: Ngừng SGLT2i' }],
        citationIds: ['ada.dm2.2026.decompensated_cirrhosis_insulin', 'ada.dm2.2026.sglt2i_avoid_severe_illness'],
        priority: 97
      };
    }
    return {
      id: 'rec_dm2_sglt2i_cardiorenal',
      module: 'dm2',
      tier: 'Bảo vệ tim – thận nền tảng',
      tierOrder: 1,
      action: 'AVOID',
      drugId: 'dapagliflozin',
      drugNameVi: drug('dapagliflozin').nameVi,
      title: 'Tránh khởi trị mới SGLT2i ở bệnh nhân suy gan mất bù (Child-Pugh B/C) / bệnh gan cấp',
      rationale:
        'ADA 2026 Ch. 4 & Ch. 9: Trong khi xơ gan còn bù Child-Pugh A vẫn sử dụng an toàn, không khuyến cáo khởi trị SGLT2i ở suy gan nặng / xơ gan mất bù Child-Pugh B–C do nguy cơ mất dịch, suy thận trước thận và toan ceton.',
      gates: [{ parameter: 'hepatic', passed: false, threshold: 1, messageVi: 'Suy gan mất bù: Tránh khởi trị SGLT2i' }],
      citationIds: ['ada.dm2.2026.decompensated_cirrhosis_insulin', 'ada.dm2.2026.sglt2i_avoid_severe_illness'],
      priority: 96
    };
  }

  if (activeSglt2Id && hasDrugAllergy(ctx, activeSglt2Id)) {
    return 'SKIP';
  }

  if (hasPlannedSurgery(ctx)) {
    const withholdDays = thFor('duration_days', 'dm2.sglt2i.surgery_withhold_days');
    if (activeSglt2Id) {
      if (fdcBlockedReason && chosenSglt2) {
        const fdcName = resolveDrugNameVi(activeSglt2Id, activeSglt2Med);
        const standaloneId =
          hasDrug(activeSglt2Id) && !hasDrugAllergy(ctx, activeSglt2Id) ? activeSglt2Id : chosenSglt2;
        const standaloneName = resolveDrugNameVi(standaloneId);
        return {
          id: 'rec_dm2_sglt2i_cardiorenal',
          module: 'dm2',
          tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
          tierOrder: 1,
          action: 'DEFER',
          drugId: standaloneId,
          drugNameVi: standaloneName,
          title: `Trì hoãn chuyển sang ${standaloneName} đơn chất cho tới sau phẫu thuật (Tuyệt đối không dùng lại viên phối hợp ${fdcName})`,
          rationale:
            `ADA 2026 Ch. 16: Viên phối hợp ${fdcName} đã bị ngừng do ${fdcBlockedReason}; đồng thời bệnh nhân sắp phẫu thuật chương trình (cần ngừng SGLT2i tối thiểu ${withholdDays} ngày trước mổ). Chỉ khởi trị lại viên ${standaloneName} đơn chất sau mổ khi ăn uống và huyết động ổn định.`,
          gates: [{ parameter: 'plannedSurgery', passed: false, threshold: withholdDays, messageVi: 'Chờ sau phẫu thuật mới dùng lại viên đơn chất' }],
          citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery', 'ada.dm2.2026.rec_9_8_hf'],
          priority: 94
        };
      }
      return 'SKIP';
    }
    return {
      id: 'rec_dm2_sglt2i_cardiorenal',
      module: 'dm2',
      tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
      tierOrder: 1,
      action: 'HOLD',
      drugId: chosenSglt2 || 'dapagliflozin',
      drugNameVi: drug(chosenSglt2 || 'dapagliflozin').nameVi,
      title: 'Trì hoãn khởi trị mới SGLT2i do bệnh nhân chuẩn bị phẫu thuật chương trình',
      rationale:
        `ADA 2026 Ch. 16: Không khởi trị mới SGLT2i ngay trước phẫu thuật chương trình (yêu cầu ngừng SGLT2i ít nhất ${withholdDays} ngày trước mổ) nhằm phòng ngừa euglycemic DKA; chỉ khởi trị sau mổ khi ăn uống ổn định.`,
      gates: [{ parameter: 'plannedSurgery', passed: false, threshold: withholdDays, messageVi: 'Sắp phẫu thuật: Hoãn khởi trị SGLT2i' }],
      citationIds: ['ada.dm2.2026.sglt2i_withhold_surgery'],
      priority: 98
    };
  }

  if (!activeSglt2Id && !chosenSglt2) {
    return {
      id: 'rec_dm2_sglt2i_cardiorenal',
      module: 'dm2',
      tier: 'Cảnh báo an toàn & Chống chỉ định',
      tierOrder: 0,
      action: 'AVOID',
      drugId: 'dapagliflozin',
      drugNameVi: 'Nhóm ức chế SGLT2 (Dapagliflozin / Empagliflozin)',
      title: 'Tránh khởi trị nhóm ức chế SGLT2 do tiền sử dị ứng / quá mẫn',
      rationale:
        'Ghi nhận tiền sử dị ứng hoặc phản ứng quá mẫn nghiêm trọng với tất cả các hoạt chất ức chế SGLT2 khả dụng; ưu tiên trụ cột đồng vận GLP-1 RA để bảo vệ tim – thận.',
      gates: [{ parameter: 'allergy', passed: false, threshold: 1, messageVi: 'Dị ứng nhóm SGLT2i' }],
      citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.rec_9_7_ascvd'],
      priority: 98
    };
  }

  const ketones = need(ctx, 'bloodKetones');
  const ketoneSafeMax = thFor('blood_ketones', 'dm2.dka.resolution_ketone_mmol');
  if (
    !activeSglt2Id &&
    Boolean(ctx.patient.customInputs?.catabolicSymptoms) &&
    ketones !== undefined &&
    ketones >= ketoneSafeMax
  ) {
    return {
      id: 'rec_dm2_sglt2i_cardiorenal',
      module: 'dm2',
      tier: 'Bảo vệ tim – thận nền tảng',
      tierOrder: 1,
      action: 'HOLD',
      drugId: chosenSglt2 || 'dapagliflozin',
      drugNameVi: drug(chosenSglt2 || 'dapagliflozin').nameVi,
      title: 'Tạm hoãn khởi trị SGLT2i do đang dị hóa kèm tăng ceton máu (Nguy cơ thúc đẩy DKA)',
      rationale:
        `ADA 2026 Ch. 9 & Ch. 16: Ở bệnh nhân thiếu hụt insulin nặng có sụt cân dị hóa kèm tăng ceton máu (${ketones.toFixed(1)} mmol/L), khởi trị SGLT2i ngay có thể kích phát cấp tính toan ceton (DKA). Cần khởi trị và ổn định bằng Insulin trước.`,
      gates: [{ parameter: 'ketones_catabolic', passed: false, threshold: ketoneSafeMax, messageVi: 'Đang dị hóa/tăng ceton: Bù Insulin trước' }],
      citationIds: ['ada.dm2.2026.sglt2i_avoid_severe_illness', 'ada.dm2.2026.early_insulin_severe'],
      priority: 96
    };
  }

  return null;
}
