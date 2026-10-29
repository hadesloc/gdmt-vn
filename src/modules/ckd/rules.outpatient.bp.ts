/**
 * GDMT-VN CKD Module - Outpatient Blood Pressure Targets (KDIGO 2024 / ESC 2024-2026 / AHA 2025 / BYT 2024)
 * Phân quyền: Agent E (Round 4 Remediation - Dialysis exclusion, Frailty/Orthostatic/Age>=85 & Confirmed CKD gate)
 * Bao phủ: CKD-R4-R1-03, CKD-R4-R1-06, CKD-R4-R3-08
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  hasCkdFlag,
  hasConfirmedCkdEvidence,
  isAkiActive,
  isOutpatientAcuteCrisis,
} from './helpers';

export const ckdOutpatientBpRules: Rule[] = [
  {
    id: 'ckd.outpatient.bp_target',
    module: 'ckd',
    nameVi: 'Đích kiểm soát huyết áp cá thể hóa trong bệnh thận mạn',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      if (!hasConfirmedCkdEvidence(ctx)) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return false;

      const dbp = need(ctx, 'dbp');
      const hasHtn = hasCondition(ctx, 'htn');
      const isLowBorderlineSbp = sbp < thFor('sbp', 'ckd.rasi.sbp_initiate_min');
      const isElevatedSbp = sbp >= thFor('sbp', 'ckd.bp.target_sbp_kdigo');
      const isElevatedDbp = dbp !== undefined && dbp >= thFor('dbp', 'ckd.bp.target_dbp_max');

      return isLowBorderlineSbp || isElevatedSbp || isElevatedDbp || hasHtn;
    },
    produce: (ctx) => {
      const sbp = need(ctx, 'sbp')!;
      const dbp = need(ctx, 'dbp');
      const egfr = need(ctx, 'egfr');
      const age = need(ctx, 'age');
      const profile = ctx.settings.profile;

      const minSafeSbp = thFor('sbp', 'ckd.rasi.sbp_initiate_min');
      const kdigoTarget = thFor('sbp', 'ckd.bp.target_sbp_kdigo');
      const escMin = thFor('sbp', 'ckd.bp.target_sbp_esc_min');
      const escMax = thFor('sbp', 'ckd.bp.target_sbp_esc_max');
      const usTargetSbp = thFor('sbp', 'ckd.bp.target_sbp_acc_aha');
      const targetDbpMax = thFor('dbp', 'ckd.bp.target_dbp_max');
      const lenientSbp = thFor('sbp', 'ckd.bp.lenient_target_sbp_max');
      const lenientDbp = thFor('dbp', 'ckd.bp.lenient_target_dbp_max');
      const veryOldAge = thFor('age', 'ckd.bp.very_old_age_min');
      const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');

      if (sbp < minSafeSbp) {
        return {
          id: 'rec_ckd_bp_target',
          module: 'ckd',
          tier: 'Kiểm soát yếu tố nguy cơ & Huyết áp',
          tierOrder: 2,
          action: 'MONITOR',
          title: `Thận trọng huyết áp tâm thu thấp (${sbp} < ${minSafeSbp} mmHg): Rà soát triệu chứng tụt HA tư thế`,
          rationale:
            `Theo KDIGO 2021 BP in CKD: Huyết áp tâm thu hiện tại ${sbp} mmHg (< ${minSafeSbp} mmHg) làm tăng nguy cơ choáng váng, tụt huyết áp tư thế và giảm tưới máu thận. Không tăng thêm liều thuốc hạ áp; cần đo HA tư thế đứng và cân nhắc giảm bớt thuốc hạ áp không thiết yếu nếu có triệu chứng.`,
          gates: [
            {
              parameter: 'SBP',
              passed: false,
              value: sbp,
              threshold: minSafeSbp,
              messageVi: `SBP ${sbp} mmHg < ${minSafeSbp}: Huyết áp thấp cần rà soát dung nạp, không tăng liều hạ áp`,
            },
          ],
          citationIds: ['kdigo.2021.bp.sbp_low_100'],
          priority: 82,
        };
      }

      const bpText = dbp !== undefined ? `${sbp}/${dbp}` : `${sbp}`;
      const onDialysis = hasCkdFlag(ctx, 'onDialysis');

      // 1. Bệnh nhân lọc máu chu kỳ (HD/PD): Tuyệt đối KHÔNG áp mục tiêu < 120 mmHg của KDIGO Rec 3.4.1 (CKD-R4-R1-03)
      if (onDialysis) {
        const isDialysisBpControlled =
          sbp < lenientSbp && (dbp === undefined || dbp < lenientDbp);
        return {
          id: 'rec_ckd_bp_target',
          module: 'ckd',
          tier: 'Kiểm soát yếu tố nguy cơ & Huyết áp',
          tierOrder: 2,
          action: isDialysisBpControlled ? 'CONTINUE' : 'UPTITRATE',
          title: `Kiểm soát huyết áp cá thể hóa trên bệnh nhân lọc máu chu kỳ (ưu tiên cân nặng khô & HA ngoài buổi lọc < ${lenientSbp}/${lenientDbp} mmHg)`,
          rationale:
            `Bệnh nhân đang lọc máu định kỳ KHÔNG thuộc đối tượng áp dụng mục tiêu hạ áp tích cực SBP < ${kdigoTarget} mmHg của KDIGO 2024 Rec 3.4.1 (nguy cơ tụt huyết áp trong buổi lọc máu, huyết khối cầu nối AVF và thiếu máu cơ tim/não). Theo ESC 2026 CVD-CKD (Bảng 9) và BYT 2024 (Bảng 11): Ưu tiên điều chỉnh cân nặng khô (dry weight), hạn chế muối-nước giữa hai kỳ lọc và theo dõi huyết áp tại nhà/giữa các kỳ lọc hướng tới < ${usTargetSbp}–${lenientSbp} / < ${targetDbpMax}–${lenientDbp} mmHg tùy khả năng dung nạp huyết động.`,
          gates: [
            {
              parameter: 'SBP',
              passed: isDialysisBpControlled,
              value: sbp,
              threshold: lenientSbp,
              messageVi: isDialysisBpControlled
                ? `Huyết áp ${bpText} mmHg trên bệnh nhân lọc máu: Đang trong vùng dung nạp an toàn, tránh hạ áp quá mức gây tụt HA trong lọc`
                : `Huyết áp ${bpText} mmHg >= ${lenientSbp}/${lenientDbp}: Ưu tiên đánh giá lại cân nặng khô và điều chỉnh thuốc hạ áp ngoài buổi lọc`,
            },
          ],
          citationIds: [
            'esc.2026.ckd.bp_target_egfr_lt_30',
            'esc.2026.ckd.bp_office_130_80',
            'byt.ckd.2024.table_11_bp_targets_esc',
            'esc.htn.2024.lenient_bp_140_90',
          ],
          profileDiff: {
            INTL: `KDIGO 2024 loại trừ bệnh nhân lọc máu khỏi đích < ${kdigoTarget} mmHg; cá thể hóa qua cân nặng khô và HA giữa kỳ lọc (< ${lenientSbp}/${lenientDbp} mmHg).`,
            US: `Cá thể hóa theo HA giữa hai kỳ lọc và dung nạp huyết động trong buổi lọc (< ${usTargetSbp}–${lenientSbp} / < ${lenientDbp} mmHg).`,
            VN: `BYT 2024 (Bảng 11) / ESC 2026 (Bảng 9): Cá thể hóa mục tiêu HA dung nạp, ưu tiên kiểm soát thể tích / cân nặng khô tránh tụt HA trong lọc.`,
          },
          priority: 82,
        };
      }

      // 2. Suy yếu (frailty), hạ HA tư thế (orthostatic hypotension), kỳ vọng sống ngắn hoặc rất cao tuổi (>= 85 tuổi) (CKD-R4-R3-08)
      const isFrailOrOrthoOrVeryOld =
        hasCondition(ctx, 'frailty') ||
        hasCondition(ctx, 'orthostaticHypotension') ||
        hasCondition(ctx, 'limitedLifespan') ||
        (age !== undefined && age >= veryOldAge);

      if (isFrailOrOrthoOrVeryOld) {
        const isLenientMet = sbp < lenientSbp && (dbp === undefined || dbp < lenientDbp);
        return {
          id: 'rec_ckd_bp_target',
          module: 'ckd',
          tier: 'Kiểm soát yếu tố nguy cơ & Huyết áp',
          tierOrder: 2,
          action: isLenientMet ? 'CONTINUE' : 'UPTITRATE',
          title: `Đích huyết áp nới lỏng cá thể hóa (< ${lenientSbp}/${lenientDbp} mmHg) do suy yếu / hạ HA tư thế / cao tuổi`,
          rationale:
            `Theo KDIGO 2024 (Practice Point 3.4.1) và ESC 2024 HTN: Ở bệnh nhân suy yếu (frailty), có hạ huyết áp tư thế triệu chứng, kỳ vọng sống hạn chế hoặc tuổi >= ${veryOldAge}, KHÔNG áp mục tiêu hạ áp tích cực < ${kdigoTarget} mmHg để phòng té ngã, ngất và tổn thương thận cấp thiếu máu cục bộ. Khuyến cáo mục tiêu nới lỏng < ${lenientSbp}/${lenientDbp} mmHg (chỉ cân nhắc hướng tới < ${usTargetSbp}/${targetDbpMax} mmHg nếu dung nạp hoàn toàn không tụt HA tư thế đứng) và bắt buộc đo huyết áp tư thế đứng mỗi lần khám.`,
          gates: [
            {
              parameter: 'SBP',
              passed: isLenientMet,
              value: sbp,
              threshold: lenientSbp,
              messageVi: isLenientMet
                ? `Huyết áp ${bpText} mmHg (< ${lenientSbp}/${lenientDbp} mmHg): Đạt mục tiêu nới lỏng an toàn, không tăng liều hạ áp tích cực`
                : `Huyết áp ${bpText} mmHg >= ${lenientSbp}/${lenientDbp} mmHg: Tăng liều hạ áp từ từ kết hợp kiểm tra HA tư thế đứng`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_3_4_1_bp_frailty_orthostatic',
            'esc.htn.2024.lenient_bp_frailty_age85',
            'esc.htn.2024.lenient_bp_140_90',
          ],
          priority: 82,
        };
      }

      // 3. Bệnh nhân CKD chưa lọc máu, không suy yếu / không tụt HA tư thế
      const isDbpMet = dbp === undefined || dbp < targetDbpMax;
      const isSevereCkdNonDialysis = egfr !== undefined && egfr < g3bMin;

      let targetTitle = '';
      let rationale = '';
      let isTargetMet = false;
      let gateThreshold = kdigoTarget;
      let cids: string[] = [];

      if (profile === 'INTL') {
        targetTitle = `Đích huyết áp tâm thu < ${kdigoTarget} mmHg (KDIGO 2021/2024)`;
        rationale = `Theo KDIGO 2021/2024 (Rec 3.4.1, 2B): Đích SBP < ${kdigoTarget} mmHg (và DBP < ${targetDbpMax} mmHg) khi dung nạp tốt, bắt buộc áp dụng kỹ thuật đo huyết áp chuẩn hóa tại phòng khám (standardized office BP) nhằm tối đa hóa bảo vệ tim mạch.`;
        isTargetMet = sbp < kdigoTarget && isDbpMet;
        gateThreshold = kdigoTarget;
        cids = [
          'kdigo.ckd.2024.rec_3_4_1_bp_target_120',
          'kdigo.2021.bp.rec_3_1_1_target_sbp_120',
          'esc.2026.ckd.bp_target_120_129',
        ];
      } else if (profile === 'US') {
        targetTitle = `Đích huyết áp < ${usTargetSbp}/${targetDbpMax} mmHg (AHA/ACC 2025 & ADA 2026)`;
        rationale = `Theo Hướng dẫn AHA/ACC 2025 (Mục 5.3.8, COR 1 LOE A) và ADA 2026 (SOC 11): Ở người trưởng thành có tăng huyết áp kèm bệnh thận mạn chưa lọc máu, khuyến cáo mục tiêu huyết áp < ${usTargetSbp}/${targetDbpMax} mmHg để giảm tử vong do mọi nguyên nhân và biến cố tim mạch.`;
        isTargetMet = sbp < usTargetSbp && isDbpMet;
        gateThreshold = usTargetSbp;
        cids = [
          'aha.acc.2025.ckd_bp_target_130_80',
          'ada.2026.soc11.bp_target_130_80',
          'kdigo.ckd.2024.rec_3_4_1_bp_target_120',
        ];
      } else if (isSevereCkdNonDialysis) {
        targetTitle = `Đích huyết áp cá thể hóa theo dung nạp < ${usTargetSbp}/${targetDbpMax} mmHg ở CKD G4–G5 chưa lọc máu (BYT 2024 / ESC 2026)`;
        rationale = `Theo ESC 2026 CVD-CKD (Bảng 9, Class I, Level C) và Hướng dẫn BYT 2024 (Bảng 11): Khi eGFR < ${g3bMin} mL/phút/1.73m², không áp cứng mục tiêu hạ áp tích cực ${escMin}–${escMax} mmHg mà khuyến cáo mục tiêu huyết áp phòng khám ban đầu < ${usTargetSbp}/${targetDbpMax} mmHg và cá thể hóa theo khả năng dung nạp để tránh tụt huyết áp và giảm tưới máu thận tồn dư.`;
        isTargetMet = sbp < usTargetSbp && isDbpMet;
        gateThreshold = usTargetSbp;
        cids = [
          'esc.2026.ckd.bp_target_egfr_lt_30',
          'esc.2026.ckd.bp_office_130_80',
          'byt.ckd.2024.table_11_bp_targets_esc',
        ];
      } else {
        targetTitle = `Đích huyết áp ${escMin}–${escMax} / < ${targetDbpMax} mmHg (BYT 2024 / ESC 2026)`;
        rationale = `Theo Hướng dẫn BYT 2024 (Bảng 11) và ESC 2026 CVD-CKD (Bảng 9, Class I, Level A): Khuyến cáo mục tiêu SBP ${escMin}–${escMax} mmHg và DBP < ${targetDbpMax} mmHg ở bệnh nhân CKD có eGFR >= ${g3bMin} mL/phút/1.73m² nếu dung nạp tốt, hạn chế nguy cơ tụt huyết áp tư thế.`;
        isTargetMet = sbp <= escMax && isDbpMet;
        gateThreshold = escMax;
        cids = [
          'esc.2026.ckd.bp_target_120_129',
          'esc.2026.ckd.bp_office_130_80',
          'byt.ckd.2024.table_11_bp_targets_esc',
        ];
      }

      if (isTargetMet) {
        rationale += ` Lưu ý: Nếu bệnh nhân còn albumin niệu A2–A3 và đang dùng RASi chưa đạt liều đích thận, vẫn chuẩn độ tăng liều RASi theo khả năng dung nạp (miễn là SBP >= ${minSafeSbp} mmHg và K⁺ cho phép) nhằm tối ưu hiệu quả giảm đạm niệu độc lập với huyết áp.`;
      }

      const gatesList = [
        {
          parameter: 'SBP',
          passed:
            profile === 'INTL'
              ? sbp < kdigoTarget
              : profile === 'US' || isSevereCkdNonDialysis
                ? sbp < usTargetSbp
                : sbp <= escMax,
          value: sbp,
          threshold: gateThreshold,
          messageVi: isTargetMet
            ? `Huyết áp hiện tại ${bpText} mmHg: Đạt mục tiêu kiểm soát`
            : `Huyết áp hiện tại ${bpText} mmHg: Chưa đạt mục tiêu, cần tối ưu hóa hạ áp`,
        },
      ];
      if (dbp !== undefined && !isDbpMet) {
        gatesList.push({
          parameter: 'DBP',
          passed: false,
          value: dbp,
          threshold: targetDbpMax,
          messageVi: `Huyết áp tâm trương ${dbp} mmHg >= ${targetDbpMax}: Tăng HA tâm trương chưa đạt mục tiêu (< ${targetDbpMax} mmHg)`,
        });
      }

      return {
        id: 'rec_ckd_bp_target',
        module: 'ckd',
        tier: 'Kiểm soát yếu tố nguy cơ & Huyết áp',
        tierOrder: 2,
        action: isTargetMet ? 'CONTINUE' : 'UPTITRATE',
        title: targetTitle,
        rationale,
        gates: gatesList,
        citationIds: cids,
        profileDiff: {
          INTL: `KDIGO 2021/2024: Đích SBP < ${kdigoTarget} mmHg (đo chuẩn hóa tại phòng khám)`,
          VN: isSevereCkdNonDialysis
            ? `BYT 2024 (Bảng 11) / ESC 2026 (Bảng 9): Cá thể hóa mục tiêu HA dung nạp (< ${usTargetSbp}/${targetDbpMax} mmHg) khi dưới ngưỡng ${g3bMin} mL/phút/1.73m²`
            : `BYT 2024 (Bảng 11) / ESC 2026 (Bảng 9): Đích SBP ${escMin}–${escMax} / < ${targetDbpMax} mmHg khi từ ${g3bMin} mL/phút/1.73m² trở lên`,
          US: `AHA/ACC 2025 & ADA 2026: Đích huyết áp < ${usTargetSbp}/${targetDbpMax} mmHg`,
        },
        priority: 82,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.rec_3_4_1_bp_target_120',
      'kdigo.ckd.2024.pp_3_4_1_bp_frailty_orthostatic',
      'aha.acc.2025.ckd_bp_target_130_80',
      'esc.2026.ckd.bp_target_120_129',
      'byt.ckd.2024.table_11_bp_targets_esc',
    ],
  },
];
