/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Đánh giá Phân loại HA, HBPM/ABPM & Đích Điều trị
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  getUncontrolledBpCutoffs,
  hasHighCvRiskComorbidity,
  needsLenientTarget
} from './helpers';

export const htnOutpatientBpEvalRules: Rule[] = [
  {
    id: 'htn.outpatient.eval_bp_target',
    module: 'htn',
    nameVi: 'Xác định phân loại huyết áp, đối chiếu HBPM/ABPM và đích điều trị cá thể hóa',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: () => true,
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'phân loại mức độ tăng huyết áp và xác định đích điều trị', [
          'esc.htn.2024.definition_classes'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'phân loại mức độ tăng huyết áp và xác định đích điều trị', [
          'esc.htn.2024.definition_classes'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_bp_target_evaluation',
          module: 'htn',
          tier: 'Cảnh báo Tụt huyết áp Nguy kịch',
          tierOrder: 0,
          action: 'CONSIDER',
          title: `CẢNH BÁO TỤT HUYẾT ÁP (HA ${sbp}/${dbp} mmHg, SBP < ${sbpHypo} mmHg) — KHÔNG PHẢI ĐẠT ĐÍCH`,
          rationale: `Huyết áp tâm thu ${sbp} mmHg thấp hơn ngưỡng an toàn ${sbpHypo} mmHg. Cần đánh giá ngay tưới máu tạng, mất dịch, nhiễm trùng, biến cố tim mạch cấp hoặc quá liều thuốc hạ áp và tạm ngừng toàn bộ thuốc hạ áp đang dùng.`,
          gates: [
            {
              parameter: 'SBP',
              passed: false,
              value: sbp,
              threshold: sbpHypo,
              messageVi: `SBP ${sbp} < ${sbpHypo} mmHg: Tụt huyết áp nguy kịch`
            }
          ],
          citationIds: ['esc.htn.2024.bp_target_general'],
          priority: 99
        };
      }

      const profile = ctx.settings.profile;
      const homeSbp = need(ctx, 'customInputs.homeSbp');
      const homeDbp = need(ctx, 'customInputs.homeDbp');
      const abpmSbp = need(ctx, 'customInputs.abpm24hSbp');
      const abpmDbp = need(ctx, 'customInputs.abpm24hDbp');
      const hbpmSbpTh = thFor('sbp', 'htn.hbpm.sbp_threshold');
      const hbpmDbpTh = thFor('dbp', 'htn.hbpm.dbp_threshold');
      const abpmSbpTh = thFor('sbp', 'htn.abpm.sbp_24h_threshold');
      const abpmDbpTh = thFor('dbp', 'htn.abpm.dbp_24h_threshold');
      const sbpHtn = thFor('sbp', 'htn.bp.sbp_hypertension');
      const dbpHtn = thFor('dbp', 'htn.bp.dbp_hypertension');

      let outOfOfficeNote = '';
      const hasHbpm = homeSbp !== undefined && homeDbp !== undefined;
      const hasAbpm = abpmSbp !== undefined && abpmDbp !== undefined;
      if (hasHbpm || hasAbpm) {
        const outElevated =
          (hasHbpm && (homeSbp >= hbpmSbpTh || homeDbp >= hbpmDbpTh)) ||
          (hasAbpm && (abpmSbp >= abpmSbpTh || abpmDbp >= abpmDbpTh));
        const officeElevated = sbp >= sbpHtn || dbp >= dbpHtn;
        if (officeElevated && !outElevated) {
          outOfOfficeNote =
            ' Gợi ý TĂNG HUYẾT ÁP ÁO CHOÀNG TRẮNG (HA phòng khám tăng nhưng HBPM/ABPM bình thường): ưu tiên thay đổi lối sống và theo dõi ngoại viện trước khi tăng thuốc nếu chưa có HMOD.';
        } else if (!officeElevated && outElevated) {
          outOfOfficeNote =
            ' Phát hiện TĂNG HUYẾT ÁP ẨN GIẤU (Masked Hypertension — HA phòng khám bình thường nhưng HBPM ≥ 135/85 hoặc ABPM 24h ≥ 130/80 mmHg): nguy cơ tim mạch tương đương THA thực sự, cần tối ưu điều trị.';
        }
      }

      // 1A. THAI KỲ: Luôn ưu tiên đích thai kỳ, không bao giờ áp đích KDIGO < 120 mmHg
      if (hasCondition(ctx, 'pregnant')) {
        const pregSbp = thFor('sbp', 'htn.pregnancy.sbp_target');
        const pregDbp =
          profile === 'VN'
            ? thFor('dbp', 'htn.pregnancy.dbp_target_vn')
            : thFor('dbp', 'htn.pregnancy.dbp_target');
        const pregDbpMinEsc = thFor('dbp', 'htn.pregnancy.dbp_min_esc');
        const pregSbpMinVn = thFor('sbp', 'htn.pregnancy.sbp_min_vn');
        const floorText =
          profile === 'VN'
            ? `không hạ SBP < ${pregSbpMinVn} mmHg`
            : `tránh hạ DBP < ${pregDbpMinEsc} mmHg`;

        return {
          id: 'rec_htn_bp_target_evaluation',
          module: 'htn',
          tier: 'Phân tầng & Đích Huyết áp Thai kỳ',
          tierOrder: 2,
          action: 'CONSIDER',
          title: `Thai kỳ (HA hiện tại ${sbp}/${dbp} mmHg): Đích điều trị < ${pregSbp}/${pregDbp} mmHg (${floorText})`,
          rationale: `Ở phụ nữ mang thai, đích huyết áp an toàn cho cả mẹ và tưới máu bánh nhau là < ${pregSbp}/${pregDbp} mmHg (${floorText} để tránh giảm tưới máu tử cung - nhau thai gây thai chậm tăng trưởng). Không áp dụng đích hạ áp sâu của dân số chung hay CKD cho thai phụ.`,
          gates: [],
          citationIds: [
            'esc.htn.2024.pregnancy_targets_rec22',
            'aha.acc.2025.pregnancy_recs',
            'vsh.htn.2022.pregnancy_table16_targets'
          ],
          profileDiff: {
            INTL: `ESC 2024: Khởi trị khi ≥ ${pregSbp}/${thFor('dbp', 'htn.pregnancy.dbp_target')} mmHg, đích < ${pregSbp}/${thFor('dbp', 'htn.pregnancy.dbp_target')} mmHg (giữ DBP ≥ ${pregDbpMinEsc} mmHg)`,
            US: `AHA/ACC 2025: Đích < ${pregSbp}/${thFor('dbp', 'htn.pregnancy.dbp_target')} mmHg cho thai phụ THA mạn (COR 1, LOE B-R)`,
            VN: `VSH 2022 Bảng 16: Đích SBP ${pregSbpMinVn}–${pregSbp} mmHg và DBP quanh ${thFor('dbp', 'htn.pregnancy.dbp_target_vn')} mmHg`
          },
          priority: 65
        };
      }

      // 1B. NGƯỜI RẤT CAO TUỔI (≥ 85t) / SUY YẾU / HẠ HA TƯ THẾ / KỲ VỌNG SỐNG < 3 NĂM (ĐỒNG NHẤT TRÊN CẢ 3 PROFILE!)
      if (needsLenientTarget(ctx)) {
        const sbpLenient = thFor('sbp', 'htn.bp.sbp_target_lenient');
        return {
          id: 'rec_htn_bp_target_evaluation',
          module: 'htn',
          tier: 'Đích Huyết áp Cá thể hóa Nới lỏng',
          tierOrder: 2,
          action: 'CONSIDER',
          title: `Cá thể hóa nới lỏng (suy yếu / rất cao tuổi / hạ HA tư thế): Đích SBP < ${sbpLenient}/${dbpHtn} mmHg nếu dung nạp`,
          rationale: `Bệnh nhân thuộc nhóm tuổi ≥ ${thFor('age', 'htn.age.very_elderly')}, suy yếu lâm sàng vừa-nặng, hạ huyết áp tư thế có triệu chứng hoặc kỳ vọng sống giới hạn. Cả ESC 2024, AHA/ACC 2025 và VSH 2022 đều khuyến cáo nới lỏng đích huyết áp (< ${sbpLenient}/${dbpHtn} mmHg theo khả năng dung nạp, nguyên tắc ALARA an toàn), tránh hạ áp tích cực gây té ngã, lú lẫn và tổn thương thận cấp.${outOfOfficeNote}`,
          gates: [],
          citationIds: [
            'esc.htn.2024.bp_target_general',
            'vsh.htn.2022.targets_age_dbp80',
            'aha.acc.2025.stage1_mono_rec2'
          ],
          priority: 65
        };
      }

      // 1C. PHÂN LOẠI CHUẨN XÁC THEO TỪNG HƯỚNG DẪN (KHÔNG TRỘN LẪN GRADE 1-3 VÀO ESC HAY GRADE 3 VÀO VSH!)
      const cutoffs = getUncontrolledBpCutoffs(ctx);
      const egfr = need(ctx, 'egfr');
      const egfrLoop = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      const sbpKdigo = thFor('sbp', 'htn.bp.sbp_target_kdigo');
      const sbpStdMin = thFor('sbp', 'htn.bp.sbp_target_standard_min');
      const sbpStdMax = thFor('sbp', 'htn.bp.sbp_target_standard_max');
      const dbpStdMin = thFor('dbp', 'htn.bp.dbp_target_standard_min');
      const dbpStdMax = thFor('dbp', 'htn.bp.dbp_target_standard_max');
      const sbpGrade2 = thFor('sbp', 'htn.bp.sbp_grade2');
      const dbpGrade2 = thFor('dbp', 'htn.bp.dbp_grade2');
      const sbpStage1Us = thFor('sbp', 'htn.bp.sbp_stage1_us');
      const dbpStage1Us = thFor('dbp', 'htn.bp.dbp_stage1_us');
      const dbpHighNormVn = thFor('dbp', 'htn.bp.dbp_high_normal_vn');

      let classLabel = '';
      let targetLabel = '';
      const citations = ['esc.htn.2024.definition_classes', 'esc.htn.2024.bp_target_general'];

      if (profile === 'INTL') {
        // ESC 2024 chỉ có 3 phân nhóm: Không tăng (<120/70), Huyết áp tăng (120-139/70-89), Tăng huyết áp (>=140/90)
        if (sbp >= sbpHtn || dbp >= dbpHtn) {
          classLabel = 'Tăng huyết áp (ESC 2024: ≥ 140/90 mmHg)';
        } else if (sbp >= sbpStdMin || dbp >= dbpStdMin) {
          classLabel = 'Huyết áp tăng (Elevated BP ESC 2024: 120–139/70–89 mmHg)';
        } else {
          classLabel = 'Huyết áp không tăng (ESC 2024: < 120/70 mmHg)';
        }
        if (hasCondition(ctx, 'ckd')) {
          targetLabel =
            egfr === undefined || egfr > egfrLoop
              ? `SBP ${sbpStdMin}–${sbpStdMax} mmHg (CKD có eGFR > ${egfrLoop} mL/min/1.73m²; đo HA chuẩn hóa theo KDIGO)`
              : `Cá thể hóa thận trọng theo dung nạp (CKD nặng eGFR ≤ ${egfrLoop} mL/min/1.73m²)`;
          citations.push('esc.htn.2024.ckd_rec26', 'kdigo.bp.2021.pp_3_1_1_standardized_bp');
        } else {
          targetLabel = `${sbpStdMin}–${sbpStdMax}/${dbpStdMin}–${dbpStdMax} mmHg nếu dung nạp tốt`;
        }
      } else if (profile === 'US') {
        if (sbp >= sbpHtn || dbp >= dbpHtn) {
          classLabel = 'THA Giai đoạn 2 (AHA/ACC 2025: ≥ 140/90 mmHg)';
        } else if (sbp >= sbpStage1Us || dbp >= dbpStage1Us) {
          classLabel = 'THA Giai đoạn 1 (AHA/ACC 2025: 130–139/80–89 mmHg)';
        } else if (sbp >= sbpStdMin && dbp < dbpStage1Us) {
          classLabel = 'Huyết áp tăng (Elevated BP AHA/ACC 2025: 120–129/<80 mmHg)';
        } else {
          classLabel = 'Huyết áp bình thường (AHA/ACC 2025: < 120/80 mmHg)';
        }
        targetLabel = hasCondition(ctx, 'ckd')
          ? `< ${sbpStage1Us}/${dbpStage1Us} mmHg (cân nhắc SBP < ${sbpKdigo} mmHg theo KDIGO CHỈ KHI đo HA phòng khám chuẩn hóa, tránh áp vào đo thường quy)`
          : `< ${sbpStage1Us}/${dbpStage1Us} mmHg`;
        citations.push('aha.acc.2025.stage1_prevent_75', 'kdigo.bp.2021.pp_3_1_1_standardized_bp');
      } else {
        // VSH/VNHA 2022: Tối ưu/Bình thường, Bình thường-cao (130-139/85-89), THA Độ 1 (140-159/90-99), THA Độ 2 (>=160/100) — không có Độ 3!
        if (sbp >= sbpGrade2 || dbp >= dbpGrade2) {
          classLabel = 'THA Độ 2 (VSH/VNHA 2022: ≥ 160/100 mmHg)';
        } else if (sbp >= sbpHtn || dbp >= dbpHtn) {
          classLabel = 'THA Độ 1 (VSH/VNHA 2022: 140–159/90–99 mmHg)';
        } else if (sbp >= sbpStage1Us || dbp >= dbpHighNormVn) {
          classLabel = 'Huyết áp bình thường - cao (VSH/VNHA 2022: 130–139/85–89 mmHg)';
        } else {
          classLabel = 'Huyết áp bình thường / tối ưu (VSH/VNHA 2022: < 130/85 mmHg)';
        }
        targetLabel = `< ${cutoffs.sbp}/${cutoffs.dbp} mmHg`;
        citations.push('vsh.htn.2022.targets_age_dbp80');
      }

      const isControlled = sbp < cutoffs.sbp && dbp < cutoffs.dbp;

      return {
        id: 'rec_htn_bp_target_evaluation',
        module: 'htn',
        tier: 'Phân loại & Đích Huyết áp Cá thể hóa',
        tierOrder: 2,
        action: 'CONSIDER',
        title: `${classLabel} — Đích cần đạt: ${targetLabel} (${isControlled ? 'Đã đạt đích' : 'Chưa đạt đích'})`,
        rationale: `Huyết áp phòng khám hiện tại: ${sbp}/${dbp} mmHg (${hasHighCvRiskComorbidity(ctx) ? 'Có bệnh đồng mắc tim-thận-mạch nguy cơ cao' : 'Chưa ghi nhận bệnh đồng mắc xơ vữa/thận'}). Khuyến cáo kết hợp theo dõi huyết áp tại nhà (HBPM < ${hbpmSbpTh}/${hbpmDbpTh} mmHg) hoặc ABPM 24 giờ (< ${abpmSbpTh}/${abpmDbpTh} mmHg) để xác nhận kiểm soát huyết áp bền vững.${outOfOfficeNote}`,
        gates: [],
        citationIds: citations,
        profileDiff: {
          INTL: `ESC 2024: 3 mức phân loại; đích chuẩn ${sbpStdMin}–${sbpStdMax}/${dbpStdMin}–${dbpStdMax} mmHg nếu dung nạp`,
          US: `AHA/ACC 2025: Giai đoạn 1 từ ${sbpStage1Us}/${dbpStage1Us} mmHg; đích chuẩn < ${sbpStage1Us}/${dbpStage1Us} mmHg`,
          VN: `VSH/VNHA 2022: Đích < ${sbpStage1Us}/${dbpStage1Us} mmHg (nguy cơ cao < 70t) hoặc < ${sbpHtn}/${thFor('dbp', 'htn.bp.dbp_target_vietnam_vsh')} mmHg (chung)`
        },
        priority: 60
      };
    },
    citationIds: ['esc.htn.2024.definition_classes', 'esc.htn.2024.bp_target_general', 'vsh.htn.2022.targets_age_dbp80']
  },

  // -------------------------------------------------------------------------
  // 2. CẤM TRÙNG LẶP NHÓM THUỐC (2 RASi/ARNI, 2 CCB, 2 LỢI TIỂU THIAZIDE/QUAI)
  // -------------------------------------------------------------------------
];
