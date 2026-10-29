/**
 * GDMT-VN Gout Module - Inpatient Reconciliation & Monitoring Rules
 * Phân quyền: Agent K
 *
 * Tuân thủ QA-1 Fail-Closed (R3-GOUT-04):
 * - Bệnh nhân nội trú có tiền sử gút ổn định (acuteFlare !== true) TUYỆT ĐỐI KHÔNG tự động kích hoạt
 *   phác đồ cắt cơn cấp; đối chiếu toàn bộ thuốc ULT nền an toàn (kể cả phác đồ phối hợp đôi XOI + Uricosuric)
 *   và giám sát các yếu tố thúc đẩy cơn cấp nội viện.
 */

import type { Rule, Recommendation } from '../../engine/types';
import {
  goutRule,
  goutRec,
  ULT_DRUG_IDS,
  findAllMeds,
  hasAmbiguousCountMedDose,
  isPregnant,
  isAcuteGoutFlare,
  hasActiveValidUlt,
  doesUltExceedSafetyCap,
  isAllopurinolBeingStopped,
  isFebuxostatBeingStopped,
  isProbenecidContraindicated,
  isBenzbromaroneContraindicated
} from './helpers';

const TIER_INPATIENT = 'Quản lý nội trú & Đối chiếu thuốc';

export const goutInpatientRules: Rule[] = [
  goutRule({
    id: 'gout.inpatient.ult_reconciliation',
    nameVi: 'Đối chiếu thuốc nội trú: Duy trì toàn bộ ULT nền an toàn và giám sát yếu tố kích phát cơn gút nội viện',
    setting: 'inpatient',
    citationIds: ['acr.gout.2020.start_ult_during_flare', 'kdigo.gout.2024.acute_flare_ckd'],
    when: (ctx) => !isPregnant(ctx) && !isAcuteGoutFlare(ctx) && hasActiveValidUlt(ctx),
    produce: (ctx): Recommendation | null => {
      const safeUltIds = Array.from(
        new Set(
          findAllMeds(ctx, ULT_DRUG_IDS)
            .filter((m) => {
              const id = m.drugId?.toLowerCase();
              if (!id || doesUltExceedSafetyCap(ctx, id) || hasAmbiguousCountMedDose(m)) return false;
              if (id === 'allopurinol') return !isAllopurinolBeingStopped(ctx);
              if (id === 'febuxostat') return !isFebuxostatBeingStopped(ctx);
              if (id === 'probenecid') return !isProbenecidContraindicated(ctx);
              if (id === 'benzbromarone') return ctx.settings.profile !== 'US' && !isBenzbromaroneContraindicated(ctx);
              return false;
            })
            .map((m) => m.drugId)
            .filter((id): id is string => Boolean(id))
        )
      );
      if (safeUltIds.length === 0) return null;

      const joinedNames = safeUltIds.join(' + ');
      return goutRec({
        id: 'rec_gout_inpatient_ult_reconciliation',
        tier: TIER_INPATIENT,
        tierOrder: 6, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 72, // qa-allow: index - độ ưu tiên nội trú
        action: 'MONITOR',
        title: `Đối chiếu nội trú: Không tự ý ngừng ${joinedNames} nền khi nhập viện vì bệnh lý cấp tính khác`,
        rationale:
          'Ở bệnh nhân nội trú có tiền sử gút ổn định (hiện không có cơn viêm khớp cấp), không tự ý cắt bỏ thuốc hạ urat nền (bao gồm phác đồ phối hợp đôi XOI + Uricosuric) nếu chức năng thận – gan ổn định và không phát sinh tương tác chống chỉ định, nhằm phòng ngừa cơn gút cấp thứ phát trong thời gian nằm viện (đặc biệt khi dùng lợi tiểu quai tĩnh mạch).',
        citationIds: ['acr.gout.2020.start_ult_during_flare', 'kdigo.gout.2024.acute_flare_ckd']
      });
    }
  }),

  goutRule({
    id: 'gout.inpatient.acute_flare_monitoring',
    nameVi: 'Giám sát nội trú trong cơn gút cấp: Theo dõi chức năng thận, đường huyết và loại trừ nhiễm khuẩn khớp',
    setting: 'inpatient',
    citationIds: [
      'byt.gout.2014.septic_arthritis_exclude_p93',
      'kdigo.gout.2024.acute_flare_ckd',
      'eular.gout.2016.il1_blockers_flare'
    ],
    when: (ctx) => isAcuteGoutFlare(ctx),
    produce: () =>
      goutRec({
        id: 'rec_gout_inpatient_flare_monitoring',
        tier: TIER_INPATIENT,
        tierOrder: 6, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 64, // qa-allow: index - độ ưu tiên nội trú
        action: 'MONITOR',
        title: 'Theo dõi nội trú cơn gút cấp: Kiểm tra Creatinin, đường huyết mao mạch và dấu hiệu nhiễm trùng khớp',
        rationale:
          'Bệnh nhân nội trú bùng phát cơn gút cấp thường kèm đa bệnh lý (suy tim cấp, CKD cấp trên nền mạn, nhiễm trùng, ĐTĐ): cần theo dõi sát biến thiên eGFR hàng ngày, kiểm soát đường huyết khi dùng Corticosteroid và chọc dịch khớp soi tinh thể / nhuộm Gram / cấy vi khuẩn khẩn nếu sốt cao hoặc nghi ngờ viêm khớp nhiễm khuẩn.',
        citationIds: [
          'byt.gout.2014.septic_arthritis_exclude_p93',
          'kdigo.gout.2024.acute_flare_ckd',
          'eular.gout.2016.il1_blockers_flare'
        ]
      })
  })
];
