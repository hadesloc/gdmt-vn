/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Chuyển tuyến Cấp cứu Tăng Đường huyết Ngoại trú & Cảnh báo Ceton
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  INCRETIN_RA_IDS,
  SGLT2_IDS,
  evaluateHyperglycemicCrisis,
  isActivelyHypoglycemic,
  isTakingAnyCanonical
} from './helpers';

const crossModuleCrisisShieldRules: Rule[] = (['dapagliflozin', 'empagliflozin'] as const).map((sglt2Id) => ({
  id: `dm2.outpatient.crisis_block_cross_${sglt2Id}`,
  module: 'dm2',
  nameVi: `Chặn khởi trị ${sglt2Id} liên chuyên khoa trong cơn cấp cứu tăng đường huyết ngoại trú`,
  setting: 'outpatient',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (isActivelyHypoglycemic(ctx)) return false;
    if (isTakingAnyCanonical(ctx, SGLT2_IDS)) return false;
    if (!ctx.patient.selectedModules.includes('ckd') && !ctx.patient.selectedModules.includes('hf')) {
      return false;
    }
    const crisis = evaluateHyperglycemicCrisis(ctx);
    return crisis.isCrisis || crisis.isIsolatedKetonemia;
  },
  produce: () => ({
    id: `rec_dm2_crisis_block_${sglt2Id}`,
    module: 'dm2',
    tier: 'Cảnh báo An toàn Đỏ',
    tierOrder: 0,
    action: 'AVOID',
    drugId: sglt2Id,
    drugNameVi: sglt2Id === 'dapagliflozin' ? 'Dapagliflozin' : 'Empagliflozin',
    title: `TRÁNH KHỞI TRỊ ${sglt2Id === 'dapagliflozin' ? 'Dapagliflozin' : 'Empagliflozin'} – Đang có cơn cấp cứu tăng đường huyết (DKA / HHS)`,
    rationale:
      'Đồng thuận Quốc tế ADA/EASD 2024: Trong cơn cấp cứu tăng đường huyết (DKA, Euglycemic DKA hoặc HHS), tuyệt đối không khởi trị thuốc ức chế SGLT2 ngoại trú do làm nặng thêm mất nước thẩm thấu và nhiễm toan ceton; ưu tiên chuyển cấp cứu hồi sức dịch và insulin tĩnh mạch.',
    gates: [],
    citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.hhs_criteria', 'ada.dm2.2024.dka_sglt2i_stop_permanent'],
    priority: 99
  }),
  citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.hhs_criteria', 'ada.dm2.2024.dka_sglt2i_stop_permanent']
}));

export const dm2CrisisRules: Rule[] = [
  // 1. CHUYỂN CẤP CỨU / ICU KHẨN CẤP KHI BỆNH NHÂN NGOẠI TRÚ CÓ DKA / EUGLYCEMIC DKA / HHS / CETON MÁU CAO
  {
    id: 'dm2.outpatient.hyperglycemic_crisis_refer',
    module: 'dm2',
    nameVi: 'Chuyển cấp cứu khẩn cấp khi phát hiện DKA, Euglycemic DKA hoặc HHS tại phòng khám ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      return crisis.isCrisis || crisis.isIsolatedKetonemia;
    },
    produce: (ctx) => {
      const crisis = evaluateHyperglycemicCrisis(ctx);
      const glucose = need(ctx, 'glucose');
      const ketones = need(ctx, 'bloodKetones');
      const ph = need(ctx, 'venousPh');
      const bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3');
      const bhbThresh = thFor('blood_ketones', 'dm2.dka.bhb_threshold');
      const osmThresh = thFor('effective_osmolality', 'dm2.hhs.effective_osmolality_threshold');

      const syndromeLabel = crisis.isMixedDkaHhs
        ? 'Hội chứng hỗn hợp DKA–HHS'
        : crisis.isEuDka
          ? 'Toan ceton đường huyết bình thường (Euglycemic DKA)'
          : crisis.isDka
            ? 'Toan ceton đái tháo đường (DKA)'
            : crisis.isPureHhs
              ? 'Tăng áp lực thẩm thấu máu do tăng đường huyết (HHS)'
              : crisis.isSuspected
                ? 'Nghi ngờ Toan ceton / Tăng áp lực thẩm thấu cấp'
                : 'Tăng ceton máu nặng có nguy cơ chuyển sang DKA';

      const labParts: string[] = [];
      if (glucose !== undefined) labParts.push(`Glucose ${glucose.toFixed(1)} mmol/L`);
      if (ketones !== undefined) {
        const bhbSuffix = ketones >= bhbThresh ? ` (≥ ${bhbThresh.toFixed(1)})` : '';
        labParts.push(`BHB ${ketones.toFixed(1)} mmol/L${bhbSuffix}`);
      }
      if (ph !== undefined) labParts.push(`pH ${ph.toFixed(2)}`);
      if (bicarb !== undefined) labParts.push(`HCO₃⁻ ${bicarb.toFixed(0)} mmol/L`);
      if (crisis.effectiveOsmolality !== undefined && crisis.effectiveOsmolality > osmThresh) {
        labParts.push(`ALTT hiệu dụng ${crisis.effectiveOsmolality.toFixed(0)} mOsm/kg (> ${osmThresh})`);
      }
      const labSummary = labParts.length > 0 ? ` (${labParts.join(', ')})` : ''; // qa-allow: index - Kiểm tra danh sách nhãn xét nghiệm không rỗng

      return {
        id: 'rec_dm2_outpatient_crisis_refer',
        module: 'dm2',
        tier: 'Cấp cứu & Chuyển tuyến khẩn cấp',
        tierOrder: 0,
        action: 'REFER',
        title: `CHUYỂN KHOA CẤP CỨU / ICU NGAY LẬP TỨC: ${syndromeLabel}${labSummary}`,
        rationale:
          `Đồng thuận Quốc tế ADA/EASD/JBDS/AACE 2024: Người bệnh ngoại trú có biểu hiện ${syndromeLabel}${labSummary} là tình trạng đe dọa tính mạng cấp tính. Bắt buộc chuyển ngay vào Khoa Cấp cứu / Hồi sức tích cực để bù dịch tinh thể tĩnh mạch, kiểm tra điện giải đồ (đặc biệt K⁺ máu trước khi truyền Regular insulin tĩnh mạch) và theo dõi sát; TUYỆT ĐỐI KHÔNG kê đơn thuốc viên hạ đường huyết mới hoặc chỉ tiêm insulin nền ngoại trú cho về nhà.`,
        gates: [],
        warnings: [
          'Cấp cứu nội khoa tối khẩn: Chặn toàn bộ chỉ định khởi trị thuốc mạn tính ngoại trú (Metformin, SGLT2i, GLP-1 RA, SU) và chuyển viện cấp cứu ngay!'
        ],
        citationIds: [
          'ada.dm2.2024.dka_criteria',
          'ada.dm2.2024.hhs_criteria',
          'ada.dm2.2024.dka_potassium_hold_insulin'
        ],
        priority: 100
      };
    },
    citationIds: [
      'ada.dm2.2024.dka_criteria',
      'ada.dm2.2024.hhs_criteria',
      'ada.dm2.2024.dka_potassium_hold_insulin'
    ]
  },

  ...crossModuleCrisisShieldRules,

  {
    id: 'dm2.outpatient.crisis_block_cross_semaglutide',
    module: 'dm2',
    nameVi: 'Tạm hoãn khởi trị Semaglutide liên chuyên khoa trong cơn cấp cứu tăng đường huyết ngoại trú',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx)) return false;
      if (isTakingAnyCanonical(ctx, INCRETIN_RA_IDS)) return false;
      if (!ctx.patient.selectedModules.includes('ckd') && !ctx.patient.selectedModules.includes('hf')) {
        return false;
      }
      const crisis = evaluateHyperglycemicCrisis(ctx);
      return crisis.isCrisis || crisis.isIsolatedKetonemia;
    },
    produce: () => ({
      id: 'rec_dm2_crisis_defer_semaglutide',
      module: 'dm2',
      tier: 'Cảnh báo An toàn Đỏ',
      tierOrder: 0,
      action: 'DEFER',
      drugId: 'semaglutide',
      drugNameVi: 'Semaglutide (Tiêm dưới da)',
      title: 'TẠM HOÃN khởi trị Semaglutide – Ưu tiên chuyển cấp cứu xử trí DKA / HHS trước',
      rationale:
        'Trong biến cố tăng đường huyết cấp cứu (DKA/HHS), không khởi trị đồng vận GLP-1 ngoại trú do nguy cơ nôn ói làm nặng thêm mất nước và rối loạn điện giải; chỉ xem xét sau khi xuất viện ổn định.',
      gates: [],
      citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.hhs_criteria'],
      priority: 98
    }),
    citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.hhs_criteria']
  },

  // 2. TẦM SOÁT CETON MÁU KHI NGOẠI TRÚ CÓ TOAN CHUYỂN HÓA (HCO3 THẤP) CHƯA ĐO BHB (S23)
  {
    id: 'dm2.outpatient.acidosis_ketone_check',
    module: 'dm2',
    nameVi: 'Chỉ định định lượng β-hydroxybutyrate máu khi ngoại trú có giảm HCO₃⁻ kèm tăng đường huyết hoặc đang dùng SGLT2i',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isActivelyHypoglycemic(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isCrisis || crisis.isIsolatedKetonemia) return false;
      if (need(ctx, 'bloodKetones') !== undefined) return false;
      const ph = need(ctx, 'venousPh');
      const bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3');
      const hasAcidosis =
        (ph !== undefined && ph < thFor('venous_ph', 'dm2.dka.ph_threshold')) ||
        (bicarb !== undefined && bicarb < thFor('serum_bicarb', 'dm2.dka.bicarb_threshold'));
      if (!hasAcidosis) return false;
      const glucose = need(ctx, 'glucose');
      return (
        (glucose !== undefined && glucose >= thFor('glucose', 'dm2.dka.glucose_mmol')) ||
        isTakingAnyCanonical(ctx, SGLT2_IDS)
      );
    },
    produce: (ctx) => {
      const bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3');
      const bicarbThresh = thFor('serum_bicarb', 'dm2.dka.bicarb_threshold');
      const bhbThresh = thFor('blood_ketones', 'dm2.dka.bhb_threshold');
      return {
        id: 'rec_dm2_outpatient_acidosis_ketone_check',
        module: 'dm2',
        tier: 'Theo dõi & Tầm soát Biến chứng',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Xét nghiệm ngay β-hydroxybutyrate máu (HCO₃⁻ ${bicarb !== undefined ? `${bicarb} < ${bicarbThresh}` : 'thấp'} mmol/L) để loại trừ DKA / euDKA`,
        rationale:
          `Đồng thuận Quốc tế 2024: Bệnh nhân có nhiễm toan chuyển hóa (HCO₃⁻ dưới ${bicarbThresh} mmol/L) kèm tăng đường huyết hoặc đang dùng SGLT2i nhưng chưa có ceton máu. Cần định lượng ngay β-hydroxybutyrate máu (ngưỡng chẩn đoán DKA từ ${bhbThresh.toFixed(1)} mmol/L) để phân biệt toan chuyển hóa do bệnh thận mạn (CKD) với toan ceton đái tháo đường tiềm ẩn.`,
        gates: [],
        citationIds: ['ada.dm2.2024.dka_criteria'],
        priority: 88
      };
    },
    citationIds: ['ada.dm2.2024.dka_criteria']
  },

  // 3. ĐÁNH GIÁ TĂNG CETON MÁU ĐƠN ĐỘC CHƯA KÈM TOAN CHUYỂN HÓA NẶNG
  {
    id: 'dm2.inpatient.isolated_ketonemia_workup',
    module: 'dm2',
    nameVi: 'Đánh giá khẩn khí máu & bù dịch khi tăng ceton máu chưa kèm toan chuyển hóa xác định',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => !isActivelyHypoglycemic(ctx) && evaluateHyperglycemicCrisis(ctx).isIsolatedKetonemia,
    produce: (ctx) => {
      const ketones = need(ctx, 'bloodKetones')!;
      const ph = need(ctx, 'venousPh');
      const bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3');
      const bhbThresh = thFor('blood_ketones', 'dm2.dka.bhb_threshold');
      const phThresh = thFor('venous_ph', 'dm2.dka.ph_threshold');
      const bicarbThresh = thFor('serum_bicarb', 'dm2.dka.bicarb_threshold');

      const acidBaseStatus =
        ph !== undefined && bicarb !== undefined && ph >= phThresh && bicarb >= bicarbThresh
          ? `pH tĩnh mạch (${ph.toFixed(2)} ≥ ${phThresh.toFixed(2)}) và HCO₃⁻ (${bicarb.toFixed(0)} ≥ ${bicarbThresh} mmol/L) hiện chưa có toan chuyển hóa (cần phân biệt ceton máu do nhịn đói kéo dài hoặc giai đoạn tiền DKA do SGLT2i)`
          : 'chưa có đủ khí máu tĩnh mạch (pH, HCO₃⁻, khoảng trống anion) để xác định mức độ toan chuyển hóa';

      return {
        id: 'rec_dm2_isolated_ketonemia_workup',
        module: 'dm2',
        tier: 'Cấp cứu & Xử trí biến cố cấp',
        tierOrder: 0,
        action: 'MONITOR',
        title: `CẢNH BÁO TĂNG CETON MÁU NẶNG (BHB ${ketones.toFixed(1)} ≥ ${bhbThresh.toFixed(1)} mmol/L): Xét nghiệm khí máu, K⁺ & bù dịch khẩn`,
        rationale:
          `Đồng thuận Quốc tế 2024 (ADA/EASD/JBDS/AACE): Beta-hydroxybutyrate máu tăng cao (${ketones.toFixed(1)} mmol/L), nhưng ${acidBaseStatus}. Chưa áp đặt truyền insulin tĩnh mạch liều DKA mù quáng khi pH/HCO₃⁻ bình thường; cần làm ngay khí máu tĩnh mạch, khoảng trống anion, điện giải đồ (K⁺), bù dịch + carbohydrate nếu ceton do nhịn đói, ngừng vĩnh viễn SGLT2i (nếu đang dùng) và theo dõi sát để chuyển sang phác đồ DKA ngay nếu xuất hiện toan hóa máu.`,
        gates: [],
        citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.dka_sglt2i_stop_permanent'],
        priority: 98
      };
    },
    citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.dka_sglt2i_stop_permanent']
  }
];
