/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Chống chỉ định & Dừng Thuốc Độc Thai / Hậu sản
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/require';
import { drug } from '../../kb-types';
import {
  MRA_IDS,
  RASI_IDS,
  THIAZIDE_IDS,
  getMedIds,
  isPostpartum
} from './helpers';
import {
  PREGNANCY_OTHER_UNSAFE_IDS,
  hasMethyldopaMoodOrHepaticContra
} from './rules.outpatient.special.bb_ddi';

export const htnOutpatientSpecialPregnancyStopRules: Rule[] = [
  {
    id: 'htn.outpatient.pregnancy_contraindication_rasi',
    module: 'htn',
    nameVi: 'Chống chỉ định tuyệt đối trong thai kỳ: Ngừng ngay ACEi / ARB / ARNI (độc tính thận thai nhi)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'pregnant') && getMedIds(ctx).some((id) => RASI_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const rasiList = Array.from(new Set(getMedIds(ctx).filter((id) => RASI_IDS.includes(id))));
      // Chọn phần tử đầu tiên để nếu bệnh nhân đang dùng kép 2 RASi (vd: enalapril + losartan), cả luật ban_dual_rasi (chọn ARB) và luật thai kỳ đều được giữ trọn trong merge.ts!
      const stopTarget = rasiList[0];
      return {
        id: 'rec_htn_pregnancy_stop_rasi',
        module: 'htn',
        tier: 'Chống chỉ định Tuyệt đối Thai kỳ',
        tierOrder: 0,
        action: 'STOP',
        drugId: stopTarget,
        title: `NGỪNG NGAY ${stopTarget}${rasiList.length > 1 ? ` (và toàn bộ nhóm RASi: ${rasiList.join(', ')})` : ''} — Chống chỉ định tuyệt đối trong thai kỳ`,
        rationale:
          'Chống chỉ định mức III / COR 3: Harm (ESC 2024, AHA/ACC 2025, VSH 2022): ACEi, ARB, ARNI và ức chế renin trực tiếp gây dị tật sọ mặt, thiểu ối, loạn sản ống thận thai nhi, vô niệu sơ sinh và thai lưu. Phải ngừng ngay lập tức khi phát hiện mang thai và chuyển sang thuốc an toàn thai kỳ.',
        gates: [
          {
            parameter: 'Mang thai',
            passed: false,
            messageVi: 'Độc tính bào thai nghiêm trọng: Bắt buộc ngừng toàn bộ ACEi / ARB / ARNI'
          }
        ],
        citationIds: [
          'esc.htn.2024.pregnancy_contraindication_rasi',
          'aha.acc.2025.pregnancy_contra_rec5',
          'vsh.htn.2022.pregnancy_table16_drugs_postpartum'
        ],
        priority: 100
      };
    },
    citationIds: ['esc.htn.2024.pregnancy_contraindication_rasi', 'aha.acc.2025.pregnancy_contra_rec5']
  },

  {
    id: 'htn.outpatient.pregnancy_stop_mra',
    module: 'htn',
    nameVi: 'Chống chỉ định trong thai kỳ: Ngừng ngay kháng Aldosterone (Spironolactone / Eplerenone)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'pregnant') && getMedIds(ctx).some((id) => MRA_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const target = getMedIds(ctx).find((id) => MRA_IDS.includes(id))!;
      return {
        id: 'rec_htn_pregnancy_stop_mra',
        module: 'htn',
        tier: 'Chống chỉ định Tuyệt đối Thai kỳ',
        tierOrder: 0,
        action: 'STOP',
        drugId: target,
        title: `NGỪNG NGAY ${target} trong thai kỳ (chống chỉ định MRA do nguy cơ nữ hóa thai nam & giảm tưới máu nhau thai)`,
        rationale:
          'Theo AHA/ACC 2025 (COR 3: Harm) và ESC 2024, nhóm đối kháng thụ thể mineralocorticoid (Spironolactone qua nhau thai gây kháng androgen / nữ hóa cơ quan sinh dục ngoài thai nhi nam; Eplerenone/Finerenone thiếu an toàn bào thai) bị chống chỉ định trong thai kỳ.',
        gates: [
          {
            parameter: 'Mang thai + MRA',
            passed: false,
            messageVi: 'Chống chỉ định MRA trong thai kỳ'
          }
        ],
        citationIds: ['aha.acc.2025.pregnancy_contra_rec5', 'esc.htn.2024.pregnancy_contraindication_rasi'],
        priority: 99
      };
    },
    citationIds: ['aha.acc.2025.pregnancy_contra_rec5']
  },

  {
    id: 'htn.outpatient.pregnancy_stop_thiazide',
    module: 'htn',
    nameVi: 'Thai kỳ: Ngừng/tránh lợi tiểu Thiazide & Indapamide do nguy cơ giảm thể tích tuần hoàn nhau thai và thiểu ối',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'pregnant') && getMedIds(ctx).some((id) => THIAZIDE_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const target = getMedIds(ctx).find((id) => THIAZIDE_IDS.includes(id))!;
      return {
        id: 'rec_htn_pregnancy_stop_thiazide',
        module: 'htn',
        tier: 'An toàn Thuốc Thai kỳ',
        tierOrder: 0,
        action: 'STOP',
        drugId: target,
        title: `NGỪNG ${target} trong thai kỳ (nguy cơ co giảm thể tích huyết tương mẹ, giảm tưới máu tử cung-nhau thai & thiểu ối)`,
        rationale:
          'Theo EMA SmPC Indapamide, ESC 2024 và VSH 2022, lợi tiểu Thiazide/Thiazide-like không được khuyến cáo dùng trong thai kỳ (đặc biệt tiền sản giật vốn đã cô đặc máu nội mạch) vì làm giảm tưới máu nhau thai và gây rối loạn điện giải thai nhi.',
        gates: [
          {
            parameter: 'Mang thai + Lợi tiểu Thiazide',
            passed: false,
            messageVi: 'Ngừng lợi tiểu Thiazide/Indapamide trong thai kỳ'
          }
        ],
        citationIds: ['ema.indapamide.pregnancy_lactation', 'esc.htn.2024.pregnancy_lactation_thiazide'],
        priority: 97
      };
    },
    citationIds: ['ema.indapamide.pregnancy_lactation', 'esc.htn.2024.pregnancy_lactation_thiazide']
  },

  {
    id: 'htn.outpatient.pregnancy_stop_other_unsafe',
    module: 'htn',
    nameVi: 'Thai kỳ: Ngừng Atenolol (chậm tăng trưởng trong tử cung) và các thuốc hạ áp không an toàn thai kỳ (Lercanidipine, Moxonidine)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'pregnant') && getMedIds(ctx).some((id) => PREGNANCY_OTHER_UNSAFE_IDS.includes(id)),
    produce: (ctx: RuleContext): Recommendation => {
      const target = getMedIds(ctx).find((id) => PREGNANCY_OTHER_UNSAFE_IDS.includes(id))!;
      return {
        id: 'rec_htn_pregnancy_stop_other_unsafe',
        module: 'htn',
        tier: 'Chống chỉ định Thuốc trong Thai kỳ',
        tierOrder: 0,
        action: 'STOP',
        drugId: target,
        title: `NGỪNG ${target} trong thai kỳ (${target === 'atenolol' ? 'gây thai chậm tăng trưởng trong tử cung IUGR — COR 3: Harm' : 'chống chỉ định / không an toàn trong thai kỳ'})`,
        rationale:
          target === 'atenolol'
            ? 'Theo AHA/ACC 2025 (COR 3: Harm) và ESC 2024, Atenolol bị cấm dùng trong thai kỳ vì làm giảm cung lượng tim mẹ kéo dài và gây thai nhẹ cân / chậm phát triển trong tử cung (IUGR); nếu cần chẹn beta trong thai kỳ phải chuyển sang Labetalol.'
            : `Thuốc ${target} không thuộc danh mục an toàn trong thai kỳ (Lercanidipine và Moxonidine chống chỉ định trong thai kỳ theo SmPC; cần chuyển sang Labetalol, Nifedipine phóng thích kéo dài hoặc Methyldopa).`,
        gates: [
          {
            parameter: 'An toàn thuốc thai kỳ',
            passed: false,
            messageVi: `Ngừng ${target} và chuyển sang Labetalol / Nifedipine LA / Methyldopa`
          }
        ],
        citationIds: [
          'aha.acc.2025.pregnancy_contra_rec5',
          'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa',
          'vsh.htn.2022.pregnancy_table16_drugs_postpartum'
        ],
        priority: 98
      };
    },
    citationIds: ['aha.acc.2025.pregnancy_contra_rec5', 'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa']
  },

  {
    id: 'htn.outpatient.pregnancy_avoid_methyldopa_depression',
    module: 'htn',
    nameVi: 'Thai kỳ / Hậu sản kèm Trầm cảm hoặc Bệnh gan: Chống chỉ định / Ngừng Methyldopa',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      (hasCondition(ctx, 'pregnant') || isPostpartum(ctx)) && hasMethyldopaMoodOrHepaticContra(ctx),
    produce: (ctx: RuleContext): Recommendation => {
      const medIds = getMedIds(ctx);
      const onMethyldopa = medIds.includes('methyldopa');
      const methName = drug('methyldopa').nameVi;
      return {
        id: 'rec_htn_pregnancy_avoid_methyldopa',
        module: 'htn',
        tier: 'Cảnh báo An toàn Tâm thần / Gan mật Sản khoa',
        tierOrder: 0,
        action: onMethyldopa ? 'STOP' : 'AVOID',
        drugId: 'methyldopa',
        drugNameVi: methName,
        title: `${onMethyldopa ? 'NGỪNG NGAY' : 'TRÁNH DÙNG'} ${methName} (do tiền sử trầm cảm / nguy cơ trầm cảm hậu sản hoặc bệnh gan tiến triển)`,
        rationale:
          'Methyldopa đi qua hàng rào máu não làm cạn kiệt monoamine trung ương, gây/làm nặng trầm cảm chu sinh - hậu sản và có nguy cơ gây viêm gan hoại tử miễn dịch (ESC 2024, VSH 2022 Bảng 16, FDA Label). Ưu tiên Labetalol uống hoặc Nifedipine phóng thích kéo dài.',
        gates: [
          {
            parameter: 'Trầm cảm / Bệnh gan hoạt động',
            passed: false,
            messageVi: 'Chống chỉ định Methyldopa — chọn Labetalol hoặc Nifedipine phóng thích kéo dài'
          }
        ],
        citationIds: [
          'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa',
          'vsh.htn.2022.pregnancy_table16_drugs_postpartum',
          'aha.acc.2025.table13_methyldopa'
        ],
        priority: 96
      };
    },
    citationIds: ['esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa', 'vsh.htn.2022.pregnancy_table16_drugs_postpartum']
  },

  {
    id: 'htn.outpatient.postpartum_switch_methyldopa',
    module: 'htn',
    nameVi: 'Giai đoạn hậu sản: Chuyển đổi Methyldopa sang Nifedipine LA / Amlodipine / Labetalol trong 2 ngày sau sinh',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      isPostpartum(ctx) && !hasMethyldopaMoodOrHepaticContra(ctx) && getMedIds(ctx).includes('methyldopa'),
    produce: (): Recommendation => {
      const methName = drug('methyldopa').nameVi;
      return {
        id: 'rec_htn_postpartum_switch_methyldopa',
        module: 'htn',
        tier: 'Tối ưu Thuốc Giai đoạn Hậu sản / Cho con bú',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: 'methyldopa',
        drugNameVi: methName,
        title: `Giai đoạn hậu sản: CHUYỂN ${methName} sang Nifedipine phóng thích kéo dài / Amlodipine / Labetalol (phòng trầm cảm sau sinh)`,
        rationale:
          'Theo ESC 2024 và VSH/VNHA 2022 (Bảng 16), cần ngưng và chuyển đổi Methyldopa sang thuốc hạ áp khác an toàn khi cho con bú (Nifedipine phóng thích kéo dài, Amlodipine, Labetalol hoặc Enalapril hậu sản) trong vòng 2 ngày sau sinh do nguy cơ khởi phát trầm cảm hậu sản cao.',
        gates: [
          {
            parameter: 'Giai đoạn hậu sản (Postpartum)',
            passed: false,
            messageVi: 'Chuyển đổi Methyldopa sau sinh để dự phòng trầm cảm hậu sản'
          }
        ],
        citationIds: [
          'esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa',
          'vsh.htn.2022.pregnancy_table16_drugs_postpartum'
        ],
        priority: 90
      };
    },
    citationIds: ['esc.htn.2024.pregnancy_aspirin_atenolol_methyldopa', 'vsh.htn.2022.pregnancy_table16_drugs_postpartum']
  }
];
