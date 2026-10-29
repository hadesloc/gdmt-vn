/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Dự phòng & Cắt cơn Sản giật (Magnesium Sulfate) & Cấm Nitroprusside
 * Phân quyền: Agent H (Tim mạch / THA)
 *
 * Khắc phục toàn diện ASTHMA-R4-R2-03, R2-R1-HTN-01, HTN-R2-R2-02, HTN-R2-R3-02.
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { th, thFor, drug } from '../../kb-types';
import {
  CCB_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  hasCustomOrCondFlag,
  isPregnantSevereCrisis
} from './helpers';

export const htnInpatientPreeclampsiaMgso4Rules: Rule[] = [
  {
    id: 'htn.inpatient.preeclampsia_mgso4',
    module: 'htn',
    nameVi: 'Tiền sản giật nặng / Sản giật: Truyền Magnesium sulfate dự phòng và cắt cơn co giật qua cổng an toàn thần kinh-cơ & thận',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!hasCondition(ctx, 'severePreeclampsiaEclampsia') && !isPregnantSevereCrisis(ctx)) return false;
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      return sbp === undefined || sbp >= sbpHypo;
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) {
        return missingInputRec(
          'htn',
          'sbp',
          'đánh giá huyết động trước khi chỉ định truyền Magnesium sulfate trong tiền sản giật nặng / sản giật',
          ['esc.htn.2024.preeclampsia_mgso4', 'vsh.htn.2022.emergency_preeclampsia']
        );
      }

      const mgName = drug('magnesium_sulfate').nameVi;
      const mgLoad = th('htn.emergency.mgso4_load_g');
      const mgMaint = th('htn.emergency.mgso4_maint_g_h');
      const hasMyasthenia = hasCustomOrCondFlag(ctx, 'myastheniaGravis', 'myasthenia_gravis');
      const hasHeartBlock = hasAvBlockOrSssWithoutPacer(ctx);

      if (hasMyasthenia || hasHeartBlock) {
        const reasonVi = hasMyasthenia
          ? 'bệnh nhược cơ (Myasthenia gravis — nguy cơ liệt cơ hô hấp tối cấp do ức chế giải phóng acetylcholine tiền synap)'
          : 'block nhĩ thất độ 2–3 / suy nút xoang chưa đặt máy tạo nhịp (nguy cơ vô tâm thu)';
        return {
          id: 'rec_htn_preeclampsia_mgso4',
          module: 'htn',
          tier: 'Cảnh báo Chống chỉ định Magnesium Sulfate',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'magnesium_sulfate',
          drugNameVi: mgName,
          title: `CHỐNG CHỈ ĐỊNH ${mgName} tĩnh mạch do ${hasMyasthenia ? 'bệnh nhược cơ (Myasthenia gravis)' : 'block nhĩ thất cao độ chưa có máy tạo nhịp'}`,
          rationale: `Tuyệt đối tránh truyền ${mgName} trên bệnh nhân có ${reasonVi}. Hội chẩn Sản khoa - Thần kinh - Hồi sức ngay để dự phòng/xử trí co giật sản giật bằng thuốc chống co giật thay thế an toàn (như Levetiracetam hoặc Phenytoin; Benzodiazepine cắt cơn cấp).`,
          gates: [
            {
              parameter: hasMyasthenia ? 'Nhược cơ (Myasthenia gravis)' : 'Dẫn truyền nhĩ thất',
              passed: false,
              messageVi: `Chống chỉ định ${mgName}: chuyển phác đồ chống co giật thay thế`
            }
          ],
          citationIds: ['esc.htn.2024.preeclampsia_mgso4', 'vsh.htn.2022.emergency_preeclampsia'],
          priority: 100
        };
      }

      // Nếu chỉ tăng HA thai kỳ nặng (>= 160/110) nhưng chưa xác nhận tiền sản giật có dấu hiệu nặng / sản giật -> CONSIDER đánh giá ngay
      if (!hasCondition(ctx, 'severePreeclampsiaEclampsia')) {
        return {
          id: 'rec_htn_preeclampsia_mgso4',
          module: 'htn',
          tier: 'Đánh giá Dự phòng Sản giật (Magnesium Sulfate)',
          tierOrder: 1,
          action: 'CONSIDER',
          drugId: 'magnesium_sulfate',
          drugNameVi: mgName,
          title: `THA thai kỳ mức độ nặng: Đánh giá ngay đạm niệu, triệu chứng thần kinh và HELLP để quyết định truyền ${mgName}`,
          rationale: `Theo ESC 2024 và AHA/ACC 2025, ${mgName} (nạp ${mgLoad} g IV chậm, duy trì ${mgMaint} g/giờ) được chỉ định bắt buộc khi có tiền sản giật kèm dấu hiệu nặng (đau đầu dữ dội, nhìn mờ, tăng phản xạ gân xương, đau thượng vị/hạ sườn phải, tiểu cầu giảm, tăng men gan, suy thận, phù phổi) hoặc sản giật.`,
          gates: [],
          citationIds: ['esc.htn.2024.preeclampsia_mgso4', 'esc.htn.2024.pregnancy_severe_rec22'],
          priority: 86
        };
      }

      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const egfrCutoff = thFor('egfr', 'htn.ckd.egfr_severe_cutoff');
      const crclCutoff = thFor('crcl', 'htn.indapamide.crcl_contra');
      const hasOliguria = hasCustomOrCondFlag(ctx, 'oliguria');
      const isDialysis = hasCondition(ctx, 'onDialysis');
      const isSevereRenal =
        isDialysis ||
        hasOliguria ||
        (egfr !== undefined && egfr < egfrCutoff) ||
        (egfr === undefined && crcl !== undefined && crcl < crclCutoff);

      const medIds = getMedIds(ctx);
      const onCcb = medIds.some((id) => CCB_IDS.includes(id) || id === 'nicardipine');
      const ccbWarn = onCcb
        ? ' LƯU Ý TƯƠNG TÁC: Đang dùng/phối hợp thuốc chẹn kênh canxi (Nifedipine/Nicardipine) — theo dõi sát huyết áp và sức cơ do nguy cơ cộng hưởng tụt huyết áp và ức chế thần kinh-cơ.'
        : '';

      if (isSevereRenal) {
        return {
          id: 'rec_htn_preeclampsia_mgso4',
          module: 'htn',
          tier: 'Dự phòng & Xử trí Sản giật — Chỉnh liều Suy thận Nặng / Thiểu niệu',
          tierOrder: 0,
          action: 'START',
          drugId: 'magnesium_sulfate',
          drugNameVi: mgName,
          dose: `Liều nạp ${mgLoad} g IV chậm trong 15–20 phút; TẠM NGỪNG truyền duy trì thường quy ${mgMaint} g/giờ (hoặc giảm ≥ 50% liều duy trì chỉ khi có định lượng Mg²⁺ máu mỗi 4–6 giờ)`,
          title: `Tiền sản giật nặng kèm Suy thận nặng / Thiểu niệu: Chỉ nạp ${mgLoad} g ${mgName} IV chậm, KHÔNG truyền duy trì mù ${mgMaint} g/giờ`,
          rationale: `Magnesium thải trừ hoàn toàn qua thận; ở bệnh nhân có eGFR/CrCl < ${egfrCutoff} mL/phút, lọc máu hoặc thiểu niệu, truyền duy trì chuẩn ${mgMaint} g/giờ gây ngộ độc Mg²⁺ tử vong (mất phản xạ bánh chè, ngưng thở, ngừng tim). Chỉ dùng liều nạp ${mgLoad} g IV chậm, định lượng Mg²⁺ huyết thanh mỗi 4–6 giờ, kiểm tra phản xạ gân xương, nhịp thở và chuẩn bị sẵn Calcium gluconate 10% (10 mL IV chậm) đối kháng tại giường.${ccbWarn}`,
          warnings: [
            `Suy thận nặng / thiểu niệu: Cấm truyền duy trì mù ${mgMaint} g/giờ; chuẩn bị sẵn Calcium gluconate 10% tại giường.`
          ],
          gates: [
            {
              parameter: 'An toàn thải trừ thận MgSO4',
              passed: false,
              value: egfr ?? crcl,
              threshold: egfrCutoff,
              messageVi: `Suy thận nặng / Thiểu niệu: Chỉ dùng liều nạp ${mgLoad} g IV, giữ/giảm truyền duy trì theo Mg²⁺ máu`
            }
          ],
          citationIds: ['esc.htn.2024.preeclampsia_mgso4', 'vsh.htn.2022.emergency_preeclampsia'],
          priority: 98
        };
      }

      const scrNote =
        egfr === undefined && crcl === undefined
          ? ' Cần kiểm tra ngay Creatinin huyết thanh và lưu lượng nước tiểu (≥ 25–30 mL/giờ) trước khi duy trì truyền liên tục.'
          : '';

      return {
        id: 'rec_htn_preeclampsia_mgso4',
        module: 'htn',
        tier: 'Dự phòng & Xử trí Sản giật (Magnesium Sulfate)',
        tierOrder: 0,
        action: 'START',
        drugId: 'magnesium_sulfate',
        drugNameVi: mgName,
        dose: `Liều nạp ${mgLoad} g IV chậm trong 15–20 phút, sau đó truyền duy trì ${mgMaint} g/giờ`,
        title: `Truyền ${mgName} tĩnh mạch dự phòng/cắt cơn sản giật (liều nạp ${mgLoad} g IV, duy trì ${mgMaint} g/giờ)`,
        rationale: `Khuyến cáo loại I (ESC 2024 / VSH 2022): Bắt buộc truyền ${mgName} đường tĩnh mạch (liều nạp ${mgLoad} g IV chậm, sau đó duy trì ${mgMaint} g/giờ) để dự phòng sản giật và bảo vệ thần kinh; theo dõi phản xạ gân xương bánh chè, nhịp thở, lượng nước tiểu mỗi giờ và chuẩn bị sẵn Calcium gluconate 10% tại giường.${scrNote}${ccbWarn}`,
        gates: [],
        citationIds: ['esc.htn.2024.preeclampsia_mgso4', 'vsh.htn.2022.emergency_preeclampsia'],
        priority: 97
      };
    },
    citationIds: ['esc.htn.2024.preeclampsia_mgso4', 'vsh.htn.2022.emergency_preeclampsia']
  },

  {
    id: 'htn.inpatient.preeclampsia_avoid_nitroprusside',
    module: 'htn',
    nameVi: 'Thai kỳ cấp cứu: Chống chỉ định tuyệt đối Sodium nitroprusside',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'pregnant') || hasCondition(ctx, 'severePreeclampsiaEclampsia'),
    produce: (ctx: RuleContext): Recommendation => {
      const medIds = getMedIds(ctx);
      const isTaking = medIds.includes('sodium_nitroprusside');
      return {
        id: 'rec_htn_pregnancy_contra_nitroprusside',
        module: 'htn',
        tier: 'Cảnh báo Độc tính Thai nhi',
        tierOrder: 0,
        action: isTaking ? 'STOP' : 'AVOID',
        drugId: 'sodium_nitroprusside',
        drugNameVi: drug('sodium_nitroprusside').nameVi,
        title: `${isTaking ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH'} Sodium nitroprusside trong thai kỳ (ngộ độc cyanide thai nhi)`,
        rationale:
          'Khuyến cáo nhóm III: Harm (AHA/ACC 2025 Section 5.5.1 Rec 5 / VSH 2022): Sodium nitroprusside gây tích lũy cyanide và thiocyanate gây tử vong thai nhi.',
        gates: [],
        citationIds: ['aha.acc.2025.pregnancy_contra_rec5', 'aha.acc.2025.iv_nitroprusside'],
        priority: isTaking ? 100 : 94
      };
    },
    citationIds: ['aha.acc.2025.pregnancy_contra_rec5']
  }
];
