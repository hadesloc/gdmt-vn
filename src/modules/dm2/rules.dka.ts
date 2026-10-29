/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Phác đồ Cấp cứu Nội viện DKA / euDKA / HHS / Hỗn hợp DKA–HHS
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  evaluateHyperglycemicCrisis,
  isActivelyHypoglycemic,
  isTakingCanonical
} from './helpers';

export const dm2DkaRules: Rule[] = [
  // 1. TẦM SOÁT KHẨN (STAT WORKUP) KHI NGHI NGỜ DKA/HHS HOẶC TOAN CHUYỂN HÓA CHƯA CÓ BHB TẠI NỘI VIỆN (B2, B3)
  {
    id: 'dm2.inpatient.dka_suspected_workup',
    module: 'dm2',
    nameVi: 'Chỉ định xét nghiệm khẩn cấp β-hydroxybutyrate, khí máu, lactate & điện giải đồ khi nghi ngờ DKA/HHS chưa đủ tiêu chuẩn xác định',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => !isActivelyHypoglycemic(ctx) && evaluateHyperglycemicCrisis(ctx).isSuspectedUnconfirmed,
    produce: (ctx) => {
      const glucose = need(ctx, 'glucose');
      const ph = need(ctx, 'venousPh');
      const bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3');
      const bhbMin = thFor('blood_ketones', 'dm2.dka.bhb_threshold');
      const phMin = thFor('venous_ph', 'dm2.dka.ph_threshold');
      const bicarbMin = thFor('serum_bicarb', 'dm2.dka.bicarb_threshold');
      const kHold = thFor('k', 'dm2.dka.k_hold_insulin');

      const contextDesc =
        ph !== undefined || bicarb !== undefined
          ? `tăng đường huyết${glucose !== undefined ? ` (${glucose.toFixed(1)} mmol/L)` : ''} kèm nhiễm toan chuyển hóa nhưng CHƯA CÓ kết quả β-hydroxybutyrate máu`
          : 'lâm sàng nghi ngờ DKA/HHS cấp nhưng chưa có đủ xét nghiệm β-hydroxybutyrate máu, khí máu tĩnh mạch và áp lực thẩm thấu';

      return {
        id: 'rec_dm2_dka_suspected_workup',
        module: 'dm2',
        tier: 'Cấp cứu Toan ceton & Tăng ALTT (DKA / HHS)',
        tierOrder: 0,
        action: 'MONITOR',
        title: 'NGHI NGỜ DKA / TOAN CHUYỂN HÓA CẤP: Xét nghiệm KHẨN (STAT) β-hydroxybutyrate, khí máu, Lactate, K⁺ & bù dịch đẳng trương',
        rationale:
          `Đồng thuận Quốc tế ADA/EASD/JBDS/AACE 2024: Người bệnh nội viện có ${contextDesc}. Chẩn đoán xác định DKA đòi hỏi ĐỒNG THỜI đủ 3 tiêu chuẩn (Đái tháo đường/Glucose ≥ ${thFor('glucose', 'dm2.dka.glucose_mmol')} mmol/L + Ceton máu BHB ≥ ${bhbMin.toFixed(1)} mmol/L + Toan hóa pH < ${phMin} hoặc HCO₃⁻ < ${bicarbMin} mmol/L) để tránh nhầm với nhiễm toan lactic do nhiễm khuẩn huyết/sốc hoặc toan chuyển hóa do suy thận.\n` +
          `• Chỉ định STAT ngay: β-hydroxybutyrate máu, khí máu tĩnh mạch (pH, HCO₃⁻), khoảng trống anion, Lactate máu, điện giải đồ (K⁺, Na⁺) và áp lực thẩm thấu máu.\n` +
          `• Khởi đầu bù dịch tinh thể đẳng trương ngay lập tức; CHƯA truyền mù quáng Regular insulin tĩnh mạch tốc độ cố định DKA trước khi xác nhận ceton máu và bảo đảm K⁺ ≥ ${kHold.toFixed(1)} mmol/L.`,
        gates: [],
        citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.dka_potassium_hold_insulin', 'ada.dm2.2024.dka_fluids'],
        priority: 100
      };
    },
    citationIds: ['ada.dm2.2024.dka_criteria', 'ada.dm2.2024.dka_potassium_hold_insulin', 'ada.dm2.2024.dka_fluids']
  },

  // 2. PHÁC ĐỒ ĐIỀU TRỊ CẤP CỨU KHI ĐÃ XÁC ĐỊNH DKA / EUGLYCEMIC DKA / ĐANG THOÁT DKA / HHS / HỖN HỢP DKA–HHS
  {
    id: 'dm2.inpatient.dka_hhs_emergency',
    module: 'dm2',
    nameVi: 'Phác đồ cấp cứu Toan ceton (DKA / Euglycemic DKA) và Tăng áp lực thẩm thấu (HHS) theo Đồng thuận Quốc tế 2024',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => evaluateHyperglycemicCrisis(ctx).isConfirmedCrisis,
    produce: (ctx) => {
      const crisis = evaluateHyperglycemicCrisis(ctx);
      const k = need(ctx, 'k');
      const weight = need(ctx, 'weight');
      const glucose = need(ctx, 'glucose');
      const kHold = thFor('k', 'dm2.dka.k_hold_insulin');
      const kReplRate = thFor('infusion_rate_mmol_h', 'dm2.dka.k_replacement_rate');
      const kMaint = thFor('k', 'dm2.dka.k_maintenance_threshold');
      const effOsmThresh = thFor('effective_osmolality', 'dm2.hhs.effective_osmolality_threshold');
      const hypoThresh = thFor('glucose', 'dm2.hypo.threshold_level1_mmol');

      const dkaProfileDiff = {
        VN: 'QĐ 5481/QĐ-BYT (2020) quy định hoãn insulin khi K⁺ < 3.3 mmol/L và tiêu chuẩn HHS khi ALTT hiệu dụng > 320 mOsm/kg; hệ thống áp dụng ngưỡng an toàn sớm hơn theo Đồng thuận Quốc tế 2024 (hoãn insulin khi K⁺ < 3.5 mmol/L; HHS khi ALTT hiệu dụng > 300 mOsm/kg).',
        INTL: 'Đồng thuận Quốc tế ADA/EASD/JBDS/AACE 2024: Hoãn insulin tĩnh mạch khi K⁺ < 3.5 mmol/L; chẩn đoán HHS khi glucose ≥ 33.3 mmol/L và ALTT hiệu dụng > 300 mOsm/kg.',
        US: 'ADA/AACE Consensus 2024: Trì hoãn insulin khi K⁺ < 3.5 mmol/L; tiêu chuẩn HHS khi ALTT hiệu dụng > 300 mOsm/kg.'
      };

      // BẤT BIẾN AN TOÀN 0: Đang hạ đường huyết cấp (< 3.9 mmol/L) -> Tạm ngừng truyền Regular insulin TM
      if (glucose !== undefined && glucose < hypoThresh) {
        return {
          id: 'rec_dm2_dka_hold_insulin_hypoglycemia',
          module: 'dm2',
          tier: 'Cấp cứu Toan ceton & Tăng ALTT (DKA / HHS)',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'insulin_regular',
          drugNameVi: 'Insulin Regular (Truyền tĩnh mạch)',
          title: `NGUY CẤP: TẠM NGỪNG TRUYỀN REGULAR INSULIN TM DO HẠ ĐƯỜNG HUYẾT (${glucose.toFixed(1)} mmol/L) – BÙ DEXTROSE TM NGAY`,
          rationale:
            `ĐỒNG THUẬN QUỐC TẾ 2024 (ADA/EASD/JBDS/AACE): Đường huyết hiện tại ${glucose.toFixed(1)} mmol/L (< ${hypoThresh.toFixed(1)} mmol/L). Bắt buộc tạm ngừng bơm tiêm điện Regular insulin ngay lập tức và truyền tĩnh mạch dung dịch Glucose/Dextrose ưu trương để bảo vệ não; chỉ khởi động lại truyền insulin tốc độ ${thFor('rate', 'dm2.dka.resolving_insulin_rate')} U/kg/h cùng Dextrose khi đường huyết vượt ngưỡng an toàn để tiếp tục xóa ceton máu.`,
          gates: [
            {
              parameter: 'Glucose',
              passed: false,
              value: glucose,
              threshold: hypoThresh,
              messageVi: `Glucose ${glucose.toFixed(1)} mmol/L < ${hypoThresh.toFixed(1)}: Bắt buộc tạm ngừng truyền insulin TM và bù Dextrose`
            }
          ],
          profileDiff: dkaProfileDiff,
          citationIds: ['ada.dm2.2024.dka_dextrose_add', 'ada.dm2.2026.hypo_rule_of_15'],
          priority: 100
        };
      }

      // BẤT BIẾN AN TOÀN 1 (FAIL-CLOSED): Thiếu K+ -> Bắt buộc hoãn truyền Regular insulin TM
      if (k === undefined) {
        return {
          id: 'rec_dm2_dka_need_k_before_insulin',
          module: 'dm2',
          tier: 'Cấp cứu Toan ceton & Tăng ALTT (DKA / HHS)',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'insulin_regular',
          drugNameVi: 'Insulin Regular (Truyền tĩnh mạch)',
          title: 'NGUY CẤP: HOÃN TRUYỀN INSULIN TĨNH MẠCH – CẦN ĐỊNH LƯỢNG KALI MÁU (K⁺) TRƯỚC TIÊN',
          rationale:
            `ĐỒNG THUẬN QUỐC TẾ 2024 (ADA/EASD/JBDS/AACE): Tuyệt đối không được khởi đầu truyền tĩnh mạch Regular insulin khi chưa có kết quả K⁺ máu. Bệnh nhân DKA/HHS thiếu hụt kali toàn cơ thể nghiêm trọng; nếu K⁺ < ${kHold.toFixed(1)} mmol/L mà truyền insulin sẽ gây hạ kali máu kịch phát, ngừng tim và tử vong. Khởi đầu bù dịch đẳng trương ngay và lấy máu xét nghiệm điện giải khẩn.`,
          gates: [
            {
              parameter: 'K+',
              passed: false,
              threshold: kHold,
              messageVi: 'Chưa có kết quả xét nghiệm K⁺ máu: Bắt buộc hoãn truyền Regular insulin và định lượng kali khẩn cấp'
            }
          ],
          profileDiff: dkaProfileDiff,
          citationIds: ['ada.dm2.2024.dka_potassium_hold_insulin'],
          priority: 100
        };
      }

      // BẤT BIẾN AN TOÀN 2: K+ < 3.5 mmol/L -> Bắt buộc hoãn Regular insulin TM và bù kali trước
      if (k < kHold) {
        return {
          id: 'rec_dm2_dka_hold_insulin_hypokalemia',
          module: 'dm2',
          tier: 'Cấp cứu Toan ceton & Tăng ALTT (DKA / HHS)',
          tierOrder: 0,
          action: 'HOLD',
          drugId: 'insulin_regular',
          drugNameVi: 'Insulin Regular (Truyền tĩnh mạch)',
          title: `NGUY CẤP: HOÃN REGULAR INSULIN TM NGAY – BÙ KALI TĨNH MẠCH (K⁺ = ${k.toFixed(1)} mmol/L < ${kHold.toFixed(1)})`,
          rationale:
            `ĐỒNG THUẬN QUỐC TẾ 2024 (ADA/EASD/JBDS/AACE): Khi kali máu < ${kHold.toFixed(1)} mmol/L, BẮT BUỘC TRÌ HOÃN KHỞI ĐẦU HOẶC TẠM NGỪNG TRUYỀN REGULAR INSULIN TĨNH MẠCH. Truyền insulin lúc này đẩy kali ồ ạt vào nội bào gây loạn nhịp thất tử vong và liệt cơ hô hấp. Bù kali tĩnh mạch ngay (khởi đầu ≥ ${kReplRate} mmol/h) và chỉ truyền insulin khi K⁺ ≥ ${kHold.toFixed(1)} mmol/L.`,
          gates: [
            {
              parameter: 'K+',
              passed: false,
              value: k,
              threshold: kHold,
              messageVi: `K⁺ ${k.toFixed(1)} mmol/L < ${kHold.toFixed(1)}: Bắt buộc trì hoãn Regular insulin TM và bù kali trước`
            }
          ],
          profileDiff: dkaProfileDiff,
          citationIds: ['ada.dm2.2024.dka_potassium_hold_insulin'],
          priority: 100
        };
      }

      const dkaRate = thFor('rate', 'dm2.dka.insulin_infusion_rate');
      const resolvingRate = thFor('rate', 'dm2.dka.resolving_insulin_rate');
      const hhsRate = thFor('rate', 'dm2.hhs.insulin_infusion_rate');
      const chosenRatePerKg = crisis.isPureHhs
        ? hhsRate
        : crisis.isResolvingDka && crisis.needsImmediateDextrose
          ? resolvingRate
          : dkaRate;
      const insulinRateDisplay = weight !== undefined
        ? `${(weight * chosenRatePerKg).toFixed(1)} U/h`
        : `${chosenRatePerKg} U/kg/h`;

      const dexThreshMmol = thFor('glucose', 'dm2.dka.dextrose_glucose_threshold_mmol');
      const dexThreshMgdl = thFor('glucose', 'dm2.dka.dextrose_glucose_threshold_mgdl');
      const resKetone = thFor('blood_ketones', 'dm2.dka.resolution_ketone_mmol');
      const resPh = thFor('venous_ph', 'dm2.dka.ph_threshold');
      const resBicarb = thFor('serum_bicarb', 'dm2.dka.bicarb_threshold');
      const resUrine = thFor('urine_output', 'dm2.hhs.resolution_urine_output_ml_kg_h');
      const overlapMin = thFor('duration_hours', 'dm2.dka.subq_overlap_min_hours');
      const overlapMax = thFor('duration_hours', 'dm2.dka.subq_overlap_max_hours');

      const fluidAdvice = crisis.isEuDka
        ? `Bù dịch & Dextrose 5–10% ngay từ đầu (Euglycemic DKA, glucose ${glucose!.toFixed(1)} < ${thFor('glucose', 'dm2.dka.glucose_mmol')} mmol/L): BẮT BUỘC truyền ngay dung dịch Dextrose song song với dịch tinh thể cân bằng ngay khi bắt đầu Regular insulin TM (${chosenRatePerKg} U/kg/h) để xóa ceton máu an toàn.`
        : crisis.needsImmediateDextrose
          ? `Bù dịch & Bổ sung ngay Dextrose 5–10%: Do glucose hiện tại ${glucose!.toFixed(1)} mmol/L đã dưới ngưỡng ${dexThreshMmol.toFixed(1)} mmol/L (${dexThreshMgdl} mg/dL) nhưng ceton/toan máu chưa hết, BẮT BUỘC phối hợp ngay dung dịch Dextrose tĩnh mạch song song truyền Regular insulin TM (${chosenRatePerKg} U/kg/h) cho tới khi xóa sạch ceton máu (< ${resKetone} mmol/L).`
          : `Bù dịch: Khởi đầu NaCl đẳng trương hoặc dung dịch tinh thể cân bằng tốc độ cao trong những giờ đầu; khi glucose giảm < ${dexThreshMmol.toFixed(1)} mmol/L (${dexThreshMgdl} mg/dL), THÊM Dextrose 5–10% vào dịch truyền và giảm tốc độ insulin xuống ${resolvingRate} U/kg/h để ngừa hạ đường huyết.`;

      const needsKMaintenance = k <= kMaint;
      const kTitleSegment = needsKMaintenance
        ? 'Bù Kali duy trì'
        : `Chưa bù Kali (K⁺ > ${kMaint.toFixed(1)})`;
      const kAdvice = needsKMaintenance
        ? `Bù Kali duy trì: K⁺ = ${k.toFixed(1)} mmol/L (≤ ${kMaint.toFixed(1)} mmol/L) -> Pha thêm kali vào dịch truyền tĩnh mạch để giữ K⁺ mục tiêu ổn định.`
        : `Tăng Kali máu (K⁺ = ${k.toFixed(1)} mmol/L > ${kMaint.toFixed(1)} mmol/L): TUYỆT ĐỐI CHƯA PHA KALI vào dịch truyền hiện tại; kiểm tra lại điện giải đồ mỗi ${overlapMax} giờ.`;

      const syndromeLabel = crisis.isMixedDkaHhs
        ? 'Hỗn hợp DKA–HHS'
        : crisis.isEuDka
          ? 'Euglycemic DKA'
          : crisis.isResolvingDka
            ? 'DKA đang thoái lui (chưa hết toan ceton)'
            : crisis.isPureHhs
              ? 'HHS'
              : 'DKA';

      const dexTitleSegment = crisis.needsImmediateDextrose ? 'Dextrose TM ngay' : 'Dextrose gối';

      const transitionAdvice = crisis.isMixedDkaHhs
        ? `Chuyển tiêm dưới da khi ĐỒNG THỜI giải quyết cả DKA lẫn HHS: Beta-hydroxybutyrate < ${resKetone} mmol/L, pH tĩnh mạch ≥ ${resPh.toFixed(2)}, HCO₃⁻ ≥ ${resBicarb} mmol/L VÀ áp lực thẩm thấu hiệu dụng < ${effOsmThresh} mOsm/kg, lượng nước tiểu > ${resUrine} mL/kg/h, bệnh nhân tỉnh táo ăn được -> Tiêm insulin dưới da gối đầu ${overlapMin}–${overlapMax} giờ trước khi ngừng bơm tiêm điện.`
        : crisis.isPureHhs
          ? `Chuyển tiêm dưới da khi HHS giải quyết: Áp lực thẩm thấu máu hiệu dụng < ${effOsmThresh} mOsm/kg, glucose máu < ${dexThreshMmol.toFixed(1)} mmol/L (${dexThreshMgdl} mg/dL), lượng nước tiểu > ${resUrine} mL/kg/h và bệnh nhân tỉnh táo hoàn toàn -> Tiêm insulin dưới da gối đầu ${overlapMin}–${overlapMax} giờ trước khi ngừng truyền tĩnh mạch.`
          : `Chuyển tiêm dưới da khi DKA giải quyết: Beta-hydroxybutyrate máu < ${resKetone} mmol/L, pH tĩnh mạch ≥ ${resPh.toFixed(2)}, HCO₃⁻ ≥ ${resBicarb} mmol/L và bệnh nhân ăn uống được -> Tiêm insulin dưới da gối đầu ${overlapMin}–${overlapMax} giờ trước khi ngừng truyền tĩnh mạch để tránh tái phát toan ceton.`;

      const isAlreadyTakingRegular = isTakingCanonical(ctx, 'insulin_regular');

      const citations = crisis.isPureHhs
        ? [
            'ada.dm2.2024.hhs_criteria',
            'ada.dm2.2024.hhs_effective_osmolality_300',
            'ada.dm2.2024.dka_fluids',
            'ada.dm2.2024.hhs_insulin_rate_005',
            'ada.dm2.2024.dka_potassium_maintenance',
            'ada.dm2.2024.hhs_resolution',
            'ada.dm2.2024.dka_subq_transition'
          ]
        : [
            'ada.dm2.2024.dka_criteria',
            'ada.dm2.2024.dka_history_diabetes',
            'ada.dm2.2024.dka_fluids',
            'ada.dm2.2024.dka_insulin_rate',
            'ada.dm2.2024.dka_potassium_maintenance',
            'ada.dm2.2024.dka_dextrose_add',
            'ada.dm2.2024.dka_resolution_criteria',
            'ada.dm2.2024.dka_subq_transition',
            ...(crisis.isEuDka ? ['ada.dm2.2024.eudka_dextrose_start'] : []),
            ...(crisis.isMixedDkaHhs
              ? [
                  'ada.dm2.2024.mixed_dka_hhs_insulin',
                  'ada.dm2.2024.hhs_effective_osmolality_300',
                  'ada.dm2.2024.hhs_resolution'
                ]
              : [])
          ];

      return {
        id: 'rec_dm2_dka_active_management',
        module: 'dm2',
        tier: 'Cấp cứu Toan ceton & Tăng ALTT (DKA / HHS)',
        tierOrder: 0,
        action: isAlreadyTakingRegular ? 'CONTINUE' : 'START',
        drugId: 'insulin_regular',
        drugNameVi: 'Insulin Regular (Truyền tĩnh mạch liên tục)',
        dose: crisis.needsImmediateDextrose
          ? `Truyền tĩnh mạch Regular insulin tốc độ ${insulinRateDisplay} (${chosenRatePerKg} U/kg/h) song song dung dịch Dextrose 5–10% ngay từ đầu`
          : `Truyền tĩnh mạch Regular insulin tốc độ ${insulinRateDisplay} (${chosenRatePerKg} U/kg/h)`,
        title: `Phác đồ Cấp cứu ${syndromeLabel}: Bù dịch · Insulin TM (${insulinRateDisplay}) · ${kTitleSegment} · ${dexTitleSegment}`,
        rationale: `Đồng thuận Quốc tế 2024 (ADA/EASD/JBDS/AACE):\n1. ${fluidAdvice}\n2. Insulin: Truyền tĩnh mạch liên tục Regular insulin tốc độ ${insulinRateDisplay} (${chosenRatePerKg} U/kg/h cho ${syndromeLabel}).\n3. ${kAdvice}\n4. ${transitionAdvice}`,
        gates: [
          {
            parameter: 'K+',
            passed: true,
            value: k,
            threshold: kHold,
            messageVi: `K⁺ ${k.toFixed(1)} mmol/L ≥ ${kHold.toFixed(1)}: Đạt điều kiện an toàn để khởi đầu/duy trì truyền Regular insulin tĩnh mạch`
          }
        ],
        profileDiff: dkaProfileDiff,
        citationIds: citations,
        priority: 99
      };
    },
    citationIds: [
      'ada.dm2.2024.dka_criteria',
      'ada.dm2.2024.dka_history_diabetes',
      'ada.dm2.2024.hhs_effective_osmolality_300',
      'ada.dm2.2024.dka_fluids',
      'ada.dm2.2024.dka_insulin_rate',
      'ada.dm2.2024.hhs_insulin_rate_005',
      'ada.dm2.2024.dka_potassium_hold_insulin',
      'ada.dm2.2024.dka_potassium_maintenance',
      'ada.dm2.2024.dka_dextrose_add',
      'ada.dm2.2024.eudka_dextrose_start',
      'ada.dm2.2024.mixed_dka_hhs_insulin',
      'ada.dm2.2024.hhs_resolution',
      'ada.dm2.2024.dka_subq_transition'
    ]
  }
];
