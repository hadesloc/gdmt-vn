/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Chống chỉ định Suy gan (Child-Pugh B/C, ALT cao) & Suy tim (TZD, Saxagliptin)
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import {
  SU_IDS,
  findActiveMedByCanonical,
  hasCirrhosis,
  hasHepaticImpairment,
  hasHf,
  hasPioglitazoneHepaticContra,
  isActivelyHypoglycemic,
  isBreastfeeding,
  isPregnant,
  isTakingCanonical,
  resolveDrugNameVi,
  resolveTargetRecDrug
} from './helpers';

export const dm2SafetyHepaticAndHfRules: Rule[] = [
  {
    id: 'dm2.safety.vildagliptin_hepatic_stop',
    module: 'dm2',
    nameVi: 'Chống chỉ định Vildagliptin ở bệnh nhân suy gan hoặc tăng men gan nặng',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isBreastfeeding(ctx) &&
      (hasHepaticImpairment(ctx) || hasCirrhosis(ctx)) &&
      isTakingCanonical(ctx, 'vildagliptin'),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'vildagliptin');
      const target = resolveTargetRecDrug('vildagliptin', med);
      const maxUln = thFor('alt_uln', 'dm2.vildagliptin.alt_uln_max');
      return {
        id: 'rec_dm2_vildagliptin_hepatic_stop',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} (Chống chỉ định khi suy gan hoặc ALT/AST vượt ${maxUln} lần ULN)`,
        rationale:
          `EMA SmPC Galvus: Không sử dụng Vildagliptin ở người bệnh suy gan hoặc có men gan ALT/AST vượt ${maxUln} lần giới hạn trên bình thường do nguy cơ độc tính gan.`,
        gates: [{ parameter: 'hepatic', passed: false, threshold: maxUln, messageVi: 'Suy gan: Ngừng Vildagliptin' }],
        citationIds: ['ema.vildagliptin.hepatic_contra'],
        priority: 99
      };
    },
    citationIds: ['ema.vildagliptin.hepatic_contra']
  },
  {
    id: 'dm2.safety.pioglitazone_hepatic_stop',
    module: 'dm2',
    nameVi: 'Ngừng Pioglitazone khi bệnh gan hoạt động hoặc ALT vượt 2.5 lần ULN',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isBreastfeeding(ctx) &&
      !hasHf(ctx) &&
      hasPioglitazoneHepaticContra(ctx) &&
      isTakingCanonical(ctx, 'pioglitazone'),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'pioglitazone');
      const target = resolveTargetRecDrug('pioglitazone', med);
      const maxUln = thFor('alt_uln', 'dm2.pioglitazone.alt_uln_max');
      return {
        id: 'rec_dm2_pioglitazone_hepatic_stop',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} do bệnh gan hoạt động / tăng men gan (ALT > ${maxUln}× ULN)`,
        rationale:
          `Nhãn FDA Actos & BYT 5481/2020: Không khởi trị hoặc tiếp tục dùng Pioglitazone ở bệnh nhân có bệnh gan hoạt động hoặc men gan ALT vượt ${maxUln} lần giới hạn trên bình thường do nguy cơ tổn thương gan nặng.`,
        gates: [{ parameter: 'hepatic', passed: false, threshold: maxUln, messageVi: `Bệnh gan / ALT > ${maxUln}× ULN: Ngừng Pioglitazone` }],
        citationIds: ['fda.pioglitazone.hepatic_injury', 'fda.pioglitazone.hepatic_alt_2_5', 'byt.dm2.2020.pioglitazone_contra_alt_2_5'],
        priority: 99
      };
    },
    citationIds: ['fda.pioglitazone.hepatic_injury', 'fda.pioglitazone.hepatic_alt_2_5', 'byt.dm2.2020.pioglitazone_contra_alt_2_5']
  },
  {
    id: 'dm2.safety.metformin_hepatic_stop',
    module: 'dm2',
    nameVi: 'Ngừng Metformin ở bệnh nhân suy gan / xơ gan mất bù (Nguy cơ toan acid lactic)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => !isPregnant(ctx) && hasHepaticImpairment(ctx) && isTakingCanonical(ctx, 'metformin'),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'metformin');
      const target = resolveTargetRecDrug('metformin', med);
      const fdcNote = target.isFdc
        ? ' Do đây là viên phối hợp chứa Metformin, bắt buộc ngừng viên phối hợp này.'
        : '';
      return {
        id: 'rec_dm2_metformin_hepatic_stop',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} do Suy gan / Xơ gan mất bù (Phòng ngừa toan acid lactic)`,
        rationale:
          `Nhãn FDA Glucophage & BYT 5481/2020: Suy chức năng gan mất bù (Child-Pugh B/C, bệnh gan hoạt động) làm giảm nghiêm trọng khả năng thanh thải lactat tại gan và gắn liền với biến chứng toan acid lactic do Metformin; bắt buộc ngừng thuốc.${fdcNote}`,
        gates: [{ parameter: 'hepatic', passed: false, threshold: 1, messageVi: 'Suy gan: Ngừng Metformin' }],
        citationIds: ['fda.metformin.hepatic_contra'],
        priority: 99
      };
    },
    citationIds: ['fda.metformin.hepatic_contra']
  },
  ...SU_IDS.map((suId): Rule => ({
    id: `dm2.safety.su_hepatic_stop_${suId}`,
    module: 'dm2',
    nameVi: `Ngừng ${resolveDrugNameVi(suId)} ở bệnh nhân suy gan nặng`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isBreastfeeding(ctx) &&
      !isActivelyHypoglycemic(ctx) &&
      hasHepaticImpairment(ctx) &&
      isTakingCanonical(ctx, suId),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, suId);
      const target = resolveTargetRecDrug(suId, med);
      const cits = suId === 'gliclazide' ? ['ema.gliclazide.severe_renal_contra'] : ['fda.glimepiride.hepatic_impairment'];
      return {
        id: `rec_dm2_su_hepatic_stop_${suId}`,
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} do Suy gan / Xơ gan mất bù (Nguy cơ hạ đường huyết nặng)`,
        rationale:
          `EMA/FDA Label: Suy gan làm chậm chuyển hóa ${target.drugNameVi} và suy giảm tân tạo đường tại gan gây hạ đường huyết sâu kéo dài; chống chỉ định trong suy gan nặng.`,
        gates: [{ parameter: 'hepatic', passed: false, threshold: 1, messageVi: `Suy gan: Ngừng ${target.drugNameVi}` }],
        citationIds: cits,
        priority: 98
      };
    },
    citationIds: suId === 'gliclazide' ? ['ema.gliclazide.severe_renal_contra'] : ['fda.glimepiride.hepatic_impairment']
  })),
  {
    id: 'dm2.outpatient.pioglitazone_hf',
    module: 'dm2',
    nameVi: 'Chống chỉ định Pioglitazone (TZD) ở bệnh nhân suy tim',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => !isPregnant(ctx) && !isBreastfeeding(ctx) && hasHf(ctx) && isTakingCanonical(ctx, 'pioglitazone'),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'pioglitazone');
      const target = resolveTargetRecDrug('pioglitazone', med);
      const fdcNote = target.isFdc
        ? ' Do đang dùng viên phối hợp cố định chứa Pioglitazone (vd: Actoplus Met), phải ngừng ngay viên phối hợp này và chuyển sang Metformin đơn chất (nếu chức năng thận cho phép).'
        : '';
      return {
        id: 'rec_dm2_stop_pioglitazone_hf',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `NGỪNG ${target.drugNameVi} ở bệnh nhân Suy tim`,
        rationale:
          `Cảnh báo hộp đen FDA: Pioglitazone gây giữ muối nước và làm khởi phát hoặc nặng thêm suy tim sung huyết; chống chỉ định tuyệt đối ở người bệnh suy tim.${fdcNote}`,
        gates: [{ parameter: 'heart_failure', passed: false, threshold: 1, messageVi: 'Suy tim: Chống chỉ định Pioglitazone' }],
        citationIds: ['fda.pioglitazone.heart_failure_contra'],
        priority: 99
      };
    },
    citationIds: ['fda.pioglitazone.heart_failure_contra']
  },
  {
    id: 'dm2.outpatient.saxagliptin_hf',
    module: 'dm2',
    nameVi: 'Ngừng Saxagliptin ở bệnh nhân suy tim (SAVOR-TIMI 53)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => !isPregnant(ctx) && !isBreastfeeding(ctx) && hasHf(ctx) && isTakingCanonical(ctx, 'saxagliptin'),
    produce: (ctx) => {
      const med = findActiveMedByCanonical(ctx, 'saxagliptin');
      const target = resolveTargetRecDrug('saxagliptin', med);
      const fdcNote = target.isFdc
        ? ' Do đang dùng viên phối hợp chứa Saxagliptin (vd: Qtern = Dapagliflozin + Saxagliptin hoặc Kombiglyze), bắt buộc ngừng viên phối hợp này và chuyển sang Dapagliflozin hoặc Metformin đơn chất.'
        : '';
      return {
        id: 'rec_dm2_stop_saxagliptin_hf',
        module: 'dm2',
        tier: 'Cảnh báo an toàn & Chống chỉ định',
        tierOrder: 0,
        action: 'STOP',
        drugId: target.drugId,
        drugNameVi: target.drugNameVi,
        title: `Ngừng ${target.drugNameVi} ở bệnh nhân Suy tim (SAVOR-TIMI 53)`,
        rationale:
          `Nghiên cứu SAVOR-TIMI 53 & ADA 2026 Ch. 10: Saxagliptin làm tăng có ý nghĩa thống kê tỷ lệ nhập viện vì suy tim; bắt buộc ngừng và chuyển sang thuốc an toàn trên suy tim.${fdcNote}`,
        gates: [{ parameter: 'heart_failure', passed: false, threshold: 1, messageVi: 'Suy tim: Ngừng Saxagliptin' }],
        citationIds: ['ada.dm2.2026.saxagliptin_heart_failure'],
        priority: 99
      };
    },
    citationIds: ['ada.dm2.2026.saxagliptin_heart_failure']
  }
];
