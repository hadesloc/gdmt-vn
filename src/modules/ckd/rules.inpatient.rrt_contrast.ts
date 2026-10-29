/**
 * GDMT-VN CKD Module - Emergency Dialysis (RRT) & Contrast-Induced AKI Prevention + Peri-Contrast Metformin HOLD
 * Phân quyền: Agent E (Round 4 Remediation - Outpatient & Inpatient Contrast CI-AKI + Metformin/FDC HOLD)
 * Bao phủ: CKD-R4-R2-06, CKD-R4-R3-10
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  hasCkdFlag,
  hasHyperkalemicEcg,
  hasMetforminComponent,
  hasMildModerateHepaticImpairment,
  isChildPughC,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

const CONTRAST_MET_SLOTS = [0, 1] as const; // qa-allow: index - chỉ số thuốc chứa Metformin quanh thủ thuật cản quang

export const ckdInpatientRrtContrastRules: Rule[] = [
  // 1. Chỉ định Lọc máu cấp cứu (RRT) khẩn cấp
  {
    id: 'ckd.inpatient.emergency_dialysis_indication',
    module: 'ckd',
    nameVi: 'Chỉ định lọc máu cấp cứu (Thận nhân tạo / CRRT)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const k = need(ctx, 'k');
      const hco3 = need(ctx, 'hco3');
      const egfr = need(ctx, 'egfr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const urineRate = custom?.urineOutputRate as string | undefined;

      const onDialysis = hasCkdFlag(ctx, 'onDialysis');
      const refractoryHyperK = Boolean(custom?.refractoryHyperkalemia);
      const refractoryPulmonaryEdema = Boolean(custom?.refractoryPulmonaryEdema);
      const ecgChanges = hasHyperkalemicEcg(ctx);
      const prolongedAnuria = urineRate === 'anuria_12h';
      const severeAcidosis =
        hco3 !== undefined && hco3 < thFor('hco3', 'ckd.dialysis.hco3_emergency_max');
      const advancedRenalFailureToxicEcg =
        egfr !== undefined && egfr < thFor('egfr', 'ckd.egfr.g4_min') && ecgChanges;

      const rrtForHyperK =
        k !== undefined &&
        k >= thFor('k', 'ckd.dialysis.k_emergency_refractory') &&
        (onDialysis || refractoryHyperK || prolongedAnuria || advancedRenalFailureToxicEcg);

      return rrtForHyperK || severeAcidosis || prolongedAnuria || refractoryPulmonaryEdema;
    },
    produce: (ctx) => {
      const k = need(ctx, 'k');
      const hco3 = need(ctx, 'hco3');
      const egfr = need(ctx, 'egfr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const kRefractory = thFor('k', 'ckd.dialysis.k_emergency_refractory');
      const hco3Max = thFor('hco3', 'ckd.dialysis.hco3_emergency_max');
      const g4Min = thFor('egfr', 'ckd.egfr.g4_min');

      const onDialysis = hasCkdFlag(ctx, 'onDialysis');
      const refractoryHyperK = Boolean(custom?.refractoryHyperkalemia);
      const refractoryPulmonaryEdema = Boolean(custom?.refractoryPulmonaryEdema);
      const ecgChanges = hasHyperkalemicEcg(ctx);
      const prolongedAnuria = custom?.urineOutputRate === 'anuria_12h';

      const reasons: string[] = [];
      if (k !== undefined && k >= kRefractory) {
        if (onDialysis) {
          reasons.push(
            `Tăng kali máu nguy kịch (K+ ${k} >= ${kRefractory} mmol/L) trên bệnh nhân lọc máu chu kỳ (UKKA 2022 18.1)`
          );
        } else if (refractoryHyperK) {
          reasons.push(
            `Tăng kali máu đe dọa tính mạng kháng trị với điều trị nội khoa ban đầu (K+ ${k} >= ${kRefractory} mmol/L - UKKA 2022 19.6)`
          );
        } else if (prolongedAnuria || (egfr !== undefined && egfr < g4Min && ecgChanges)) {
          reasons.push(
            `Tăng kali máu nguy kịch có độc tính điện tâm đồ trên nền suy thận rất nặng / vô niệu (K+ ${k} >= ${kRefractory} mmol/L - BYT 2024 & UKKA 20.1)`
          );
        }
      }
      if (hco3 !== undefined && hco3 < hco3Max) {
        reasons.push(`Toan chuyển hóa nặng mất bù (HCO3- ${hco3} mmol/L < ${hco3Max} mmol/L)`);
      }
      if (prolongedAnuria) {
        reasons.push('Vô niệu kéo dài >= 12 giờ');
      }
      if (refractoryPulmonaryEdema) {
        reasons.push('Quá tải thể tích tuần hoàn / phù phổi cấp kháng lợi tiểu');
      }

      return {
        id: 'rec_ckd_emergency_rrt',
        module: 'ckd',
        tier: 'Điều trị thay thế thận cấp cứu',
        tierOrder: 0,
        action: 'REFER',
        dose: undefined,
        title: 'CHỈ ĐỊNH LỌC MÁU CẤP CỨU (Thận nhân tạo ngắt quãng HD / CRRT)',
        rationale:
          `Theo KDIGO 2012 AKI (Khuyến cáo 5.1.1), UKKA 2022 (Guideline 18.1, 19.6 & 20.1) và Hướng dẫn BYT 2024: Bệnh nhân có chỉ định lọc máu cấp cứu khẩn cấp do rối loạn nội môi đe dọa tính mạng: ${reasons.join('; ')}. Cần hội chẩn khẩn chuyên khoa Thận nhân tạo / Hồi sức tích cực để tiến hành lọc máu ngoài thận kịp thời (song song với điều trị nội khoa bảo vệ cơ tim).`,
        gates: [],
        citationIds: [
          'kdigo.aki.2012.rec_5_1_1_rrt_emergently',
          'byt.ckd.2024.emergency_acidosis_hco3_8',
          'byt.ckd.2024.rrt_anuric_hyperkalemia',
          'ukka.2022.guideline_18_1_emergency_dialysis',
          'ukka.2022.guideline_19_6_rrt_resistant',
          'ukka.2022.guideline_20_1_rrt_uncontrolled',
        ],
        priority: 100,
      };
    },
    citationIds: [
      'kdigo.aki.2012.rec_5_1_1_rrt_emergently',
      'byt.ckd.2024.emergency_acidosis_hco3_8',
      'byt.ckd.2024.rrt_anuric_hyperkalemia',
      'ukka.2022.guideline_18_1_emergency_dialysis',
      'ukka.2022.guideline_19_6_rrt_resistant',
    ],
  },

  // 2. Dự phòng Tổn thương thận cấp do thuốc cản quang (CI-AKI) cho CẢ Nội viện & Ngoại trú (CKD-R4-R2-06, CKD-R4-R3-10)
  {
    id: 'ckd.inpatient.contrast_aki_prevention',
    module: 'ckd',
    nameVi: 'Dự phòng tổn thương thận cấp do thuốc cản quang (CI-AKI)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const contrastPlanned = Boolean(custom?.contrastPlanned);
      const egfr = need(ctx, 'egfr');
      const intraArterial =
        Boolean(custom?.contrastRouteIntraArterial) ||
        String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
      if (!contrastPlanned || hasCkdFlag(ctx, 'onDialysis')) return false;
      if (egfr === undefined) return intraArterial;
      return egfr < thFor('egfr', 'ckd.contrast.egfr_risk_threshold') || intraArterial;
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const riskEgfr = thFor('egfr', 'ckd.contrast.egfr_risk_threshold');
      const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');
      const intraArterial =
        Boolean(custom?.contrastRouteIntraArterial) ||
        String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
      const isOutpatient = ctx.settings.setting === 'outpatient';
      const hasCongestionRisk =
        hasCondition(ctx, 'hf') ||
        hasCondition(ctx, 'acutePulmonaryEdema') ||
        Boolean(custom?.refractoryPulmonaryEdema) ||
        Boolean(custom?.volumeOverload);

      const isHighRiskStart = (egfr !== undefined && egfr < g3bMin) || intraArterial;
      const actionType = isHighRiskStart ? 'START' : 'CONSIDER';
      const titleText = isHighRiskStart
        ? `Phác đồ dự phòng tổn thương thận cấp do thuốc cản quang iod (Nguy cơ cao: ${egfr !== undefined && egfr < g3bMin ? `eGFR < ${g3bMin} mL/phút/1.73m²` : 'đường động mạch'})`
        : 'Cân nhắc dự phòng tổn thương thận do thuốc cản quang iod cá thể hóa (CKD G3a–G3b chụp tĩnh mạch)';

      const hydrationLine = hasCongestionRisk
        ? `1. Bù dịch tĩnh mạch thận trọng theo LVEDP / tình trạng dịch: Bệnh nhân có suy tim hoặc quá tải tuần hoàn — đánh giá kỹ áp lực đổ đầy trước truyền NaCl 0.9%, giảm tốc độ truyền và theo dõi sát dấu hiệu phù phổi (ESC 2026 Bảng 30 — bù dịch tĩnh mạch quanh thủ thuật ở eGFR < ${g3bMin} mL/phút/1.73m² là khuyến cáo Class IIb, Level C).`
        : isHighRiskStart
          ? `1. Bù dịch đẳng trương quanh thủ thuật${isOutpatient ? ' (cần bố trí truyền tại đơn vị thủ thuật/nhập viện ngắn hạn)' : ''}: Truyền NaCl 0.9% tốc độ 1 mL/kg/h trước và sau thủ thuật khi không có quá tải dịch (theo ESC 2026 CVD-CKD Bảng 30: bù dịch tĩnh mạch ở CKD nặng eGFR < ${g3bMin} mL/phút/1.73m² có mức chứng cứ Class IIb, Level C; sử dụng cản quang đẳng/thẩm thấu thấp thể tích tối thiểu trong chụp mạch xâm lấn là Class I, Level A).`
          : `1. Cá thể hóa bù dịch theo đường dùng cản quang: Ở giai đoạn G3a–G3b (eGFR ${g3bMin}–<${riskEgfr} mL/phút/1.73m²) chụp CT tiêm cản quang tĩnh mạch thường quy có nguy cơ CA-AKI thấp — không bắt buộc truyền NaCl 0.9% nội viện thường quy (ưu tiên uống đủ nước trước và sau chụp; chỉ truyền NaCl 0.9% tĩnh mạch nếu bệnh nhân thiếu dịch hoặc chuyển sang thủ thuật động mạch).`;

      const egfrDesc = egfr !== undefined ? `eGFR ${egfr.toFixed(0)} mL/phút/1.73m²` : 'chưa có eGFR nền (cần đo SCr trước thủ thuật)';
      const rationaleText =
        `Bệnh nhân (${egfrDesc}) có kế hoạch dùng thuốc cản quang iod. Theo ESC 2026 CVD-CKD (Bảng 30) và KDIGO 2012 AKI:\n` +
        `${hydrationLine}\n` +
        '2. Lựa chọn thuốc cản quang: Sử dụng thuốc cản quang đẳng trương (iso-osmolar) hoặc áp lực thẩm thấu thấp (low-osmolar) với thể tích tối thiểu cần thiết (ESC 2026 Class I, Level A).\n' +
        `3. Rà soát thuốc quanh thủ thuật: Tạm ngừng NSAID, kháng sinh độc thận; tạm ngừng Metformin (và viên phối hợp chứa Metformin) tại/trước thời điểm tiêm cản quang theo nhãn FDA và kiểm tra lại eGFR/SCr sau 48–72 giờ trước khi dùng lại.`;

      return {
        id: 'rec_ckd_ci_aki_bundle',
        module: 'ckd',
        tier: isOutpatient ? 'Dự phòng biến chứng thủ thuật cản quang' : 'Dự phòng biến chứng nội viện',
        tierOrder: 2,
        action: actionType,
        title: titleText,
        rationale: rationaleText,
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: isHighRiskStart ? g3bMin : riskEgfr,
            messageVi: isHighRiskStart
              ? `${egfrDesc}${intraArterial ? ' + đường động mạch' : ''}: Nguy cơ cao CI-AKI — áp dụng gói dự phòng`
              : `${egfrDesc} (G3a–G3b đường tĩnh mạch): Cá thể hóa dự phòng CI-AKI`,
          },
        ],
        citationIds: [
          'esc.2026.ckd.table_30_ci_aki_hydration',
          'esc.2026.ckd.ci_aki_hydration_egfr_30',
          'kdigo.aki.2012.ci_aki_iso_low_osmolar',
          'kdigo.aki.2012.ci_aki_volume_expansion',
          'fda.metformin.contrast_discontinue',
        ],
        priority: isHighRiskStart ? 85 : 65,
      };
    },
    citationIds: [
      'esc.2026.ckd.table_30_ci_aki_hydration',
      'esc.2026.ckd.ci_aki_hydration_egfr_30',
      'kdigo.aki.2012.ci_aki_iso_low_osmolar',
      'kdigo.aki.2012.ci_aki_volume_expansion',
    ],
  },

  // 3. Y lệnh độc lập TẠM NGỪNG Metformin / viên phối hợp FDC chứa Metformin trước/tại thời điểm tiêm cản quang iod (CKD-R4-R2-06, CKD-R4-R3-10)
  ...CONTRAST_MET_SLOTS.map(
    (slotIdx): Rule => ({
      id: `ckd.contrast_hold_metformin_${slotIdx}`,
      module: 'ckd',
      nameVi: `Tạm ngừng thuốc chứa Metformin (vị trí ${slotIdx}) quanh thủ thuật cản quang iod`,
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
        if (!Boolean(custom?.contrastPlanned)) return false;
        const egfr = need(ctx, 'egfr');
        const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');
        const riskEgfr = thFor('egfr', 'ckd.contrast.egfr_risk_threshold');
        if (hasCkdFlag(ctx, 'onDialysis') || (egfr !== undefined && egfr < g3bMin)) {
          return false;
        }
        const intraArterial =
          Boolean(custom?.contrastRouteIntraArterial) ||
          String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
        const hasRiskFactor =
          egfr === undefined ||
          egfr < riskEgfr ||
          intraArterial ||
          hasCondition(ctx, 'hf') ||
          hasMildModerateHepaticImpairment(ctx) ||
          isChildPughC(ctx);
        if (!hasRiskFactor) return false;
        const metMeds = ctx.patient.currentMeds.filter((m) => hasMetforminComponent(m));
        return slotIdx < metMeds.length;
      },
      produce: (ctx) => {
        const metMeds = ctx.patient.currentMeds.filter((m) => hasMetforminComponent(m));
        const targetMed = metMeds[slotIdx];
        if (!targetMed) return null;

        const egfr = need(ctx, 'egfr');
        const riskEgfr = thFor('egfr', 'ckd.contrast.egfr_risk_threshold');
        const medName = medDisplayName(targetMed);
        const normId = normalizeDrugId(targetMed.drugId);

        return {
          id: `rec_ckd_contrast_hold_metformin_${normId}_${slotIdx}`,
          module: 'ckd',
          tier: 'Cảnh báo an toàn thủ thuật cản quang',
          tierOrder: 1,
          action: 'HOLD',
          drugId: normId,
          drugNameVi: medName,
          dose: undefined,
          title: `TẠM NGỪNG ${medName} tại/trước thời điểm tiêm thuốc cản quang iod — đánh giá lại eGFR sau 48 giờ`,
          rationale:
            `Theo nhãn FDA Metformin (Glucophage Section 2.4 & Cảnh báo Hộp đen về nhiễm toan lactic): Ở bệnh nhân có eGFR ${egfr !== undefined ? `${egfr.toFixed(0)} mL/phút/1.73m² (30–<${riskEgfr})` : 'chưa xác định'} hoặc có tiền sử suy gan, suy tim hoặc chụp/can thiệp cản quang iod đường động mạch, bắt buộc TẠM NGỪNG ${medName} tại hoặc trước thời điểm thực hiện thủ thuật cản quang iod. Đánh giá lại eGFR 48 giờ sau thủ thuật và chỉ khởi trị lại khi xác nhận chức năng thận ổn định.`,
          gates: [
            {
              parameter: 'Contrast_Metformin',
              passed: false,
              value: egfr,
              threshold: riskEgfr,
              messageVi: `Thủ thuật cản quang iod: Tạm ngừng ${medName}, kiểm tra lại eGFR sau 48 giờ`,
            },
          ],
          citationIds: ['fda.metformin.contrast_discontinue'],
          priority: 96,
        };
      },
      citationIds: ['fda.metformin.contrast_discontinue'],
    })
  ),
];
