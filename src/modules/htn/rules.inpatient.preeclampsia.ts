/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Tiền sản giật Nặng / Sản giật & Cấp cứu Sản khoa
 * Phân quyền: Agent H (Tim mạch / THA)
 *
 * Bao hàm đầy đủ cổng an toàn ASTHMA-R4-R2-03, R2-R1-HTN-01, R2-R1-HTN-02, HTN-R2-R2-02, HTN-R2-R2-12, HTN-R2-R3-02:
 * - Gắn drugId: 'magnesium_sulfate' giúp hợp nhất liên phân hệ (HTN × Asthma) và ưu tiên AVOID khi chống chỉ định.
 * - Fail-closed khi thiếu SBP; chặn [AVOID] khi nhược cơ (Myasthenia gravis) hoặc block nhĩ thất độ 2–3 chưa đặt máy tạo nhịp.
 * - Cảnh báo suy thận nặng (eGFR/CrCl < 30 mL/phút, lọc máu hoặc thiểu niệu): chỉ nạp 4 g IV chậm, KHÔNG truyền duy trì mù 1 g/giờ.
 * - Phân tách tiền sản giật nặng/sản giật xác định (START) vs THA thai kỳ nặng đơn thuần chưa rõ dấu hiệu nặng (CONSIDER).
 * - Tránh khởi trị hạ áp Nitroglycerin ở thai phụ huyết áp bình thường; tránh Nicardipine khi hẹp khít van ĐMC nặng (dùng Hydralazine IV).
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import {
  th,
  thFor,
  drug,
  dose,
  fmtDose
} from '../../kb-types';
import {
  NDHP_CCB_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  hasPde5i,
  isHfrEf,
  isPregnantSevereCrisis,
  isSevereAorticStenosis
} from './helpers';
import { fmtInpatientIvDose } from './rules.inpatient.stroke';

export const htnInpatientPreeclampsiaRules: Rule[] = [
  {
    id: 'htn.inpatient.preeclampsia_emergency',
    module: 'htn',
    nameVi: 'Cấp cứu Tiền sản giật nặng / Sản giật / THA thai kỳ nặng: Kiểm soát huyết áp khẩn cấp',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'severePreeclampsiaEclampsia') || isPregnantSevereCrisis(ctx),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const hr = need(ctx, 'hr');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'xử trí cấp cứu tiền sản giật nặng / tăng huyết áp thai kỳ nặng', [
          'vsh.htn.2022.emergency_preeclampsia'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'xử trí cấp cứu tiền sản giật nặng / tăng huyết áp thai kỳ nặng', [
          'vsh.htn.2022.emergency_preeclampsia'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpTarget = thFor('sbp', 'htn.emergency.preeclampsia_sbp');
      const dbpTarget = thFor('dbp', 'htn.emergency.preeclampsia_dbp');
      const sbpPulmEdema = thFor('sbp', 'htn.emergency.pulmonary_edema_sbp');
      const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');

      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_emergency_preeclampsia',
          module: 'htn',
          tier: 'Cấp cứu Sản khoa (Tụt huyết áp)',
          tierOrder: 0,
          action: 'HOLD',
          title: `TẠM HOÃN thuốc hạ áp tĩnh mạch do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg) — Đánh giá băng huyết / ngộ độc MgSO4`,
          rationale: `SBP ${sbp} mmHg (< ${sbpHypo} mmHg) ở thai phụ cần loại trừ ngay xuất huyết sản khoa, vỡ bao gan HELLP hoặc quá liều Magnesium sulfate.`,
          gates: [],
          citationIds: ['vsh.htn.2022.emergency_preeclampsia'],
          priority: 100
        };
      }

      // Tiền sản giật biến chứng Phù phổi cấp (ESC 2024 Class I / VSH 2022): chỉ truyền Nitroglycerin khi HA đủ ngưỡng an toàn (SBP >= 140 hoặc DBP >= 105)
      if (hasCondition(ctx, 'acutePulmonaryEdema')) {
        if (sbp < sbpPulmEdema && dbp < dbpTarget) {
          return {
            id: 'rec_htn_emergency_preeclampsia',
            module: 'htn',
            tier: 'Theo dõi Huyết động Tiền sản giật kèm Phù phổi cấp',
            tierOrder: 1,
            action: 'MONITOR',
            title: `Tiền sản giật kèm Phù phổi cấp có HA không tăng cao (${sbp}/${dbp} mmHg): Tránh truyền hạ áp tích cực gây tụt áp nhau thai`,
            rationale: `Huyết áp hiện tại (${sbp}/${dbp} mmHg) thấp hơn ngưỡng hạ áp tĩnh mạch (${sbpPulmEdema}/${dbpTarget} mmHg). Ưu tiên thở oxy/thông khí hỗ trợ và lợi tiểu quai theo cân bằng dịch; chỉ chuẩn độ Nitroglycerin liều thấp nếu huyết áp tăng cao để tránh tụt huyết áp tưới máu tử cung - nhau thai.`,
            gates: [],
            citationIds: ['esc.htn.2024.preeclampsia_pulm_edema_rec33', 'vsh.htn.2022.emergency_preeclampsia'],
            priority: 90
          };
        }

        if (!hasPde5i(ctx)) {
          const ntgName = drug('nitroglycerin').nameVi;
          const ntgDose = dose('nitroglycerin', 'start');
          return {
            id: 'rec_htn_emergency_preeclampsia',
            module: 'htn',
            tier: 'Tiền sản giật biến chứng Phù phổi cấp',
            tierOrder: 0,
            action: 'START',
            drugId: 'nitroglycerin',
            drugNameVi: ntgName,
            dose: fmtDose(ntgDose),
            title: `Tiền sản giật biến chứng Phù phổi cấp: Truyền ${ntgName} tĩnh mạch (Đích < ${sbpPulmEdema} mmHg)`,
            rationale: `Khuyến cáo loại I mức B (ESC 2024 Section 10.3 / VSH 2022 Bảng 14): Khi tiền sản giật nặng biến chứng phù phổi cấp kèm tăng huyết áp (${sbp}/${dbp} mmHg), ${ntgName} truyền tĩnh mạch là thuốc lựa chọn hàng đầu; tuyệt đối tránh Labetalol do ức chế co bóp cơ tim.`,
            gates: [],
            citationIds: [
              'esc.htn.2024.preeclampsia_pulm_edema_rec33',
              'vsh.htn.2022.emergency_preeclampsia',
              'aha.acc.2025.iv_nitroglycerin'
            ],
            priority: 100
          };
        }
      }

      if (sbp < sbpTarget && dbp < dbpTarget) {
        return {
          id: 'rec_htn_emergency_preeclampsia',
          module: 'htn',
          tier: 'Theo dõi Tiền sản giật nặng',
          tierOrder: 1,
          action: 'MONITOR',
          title: `HA sản khoa hiện tại ${sbp}/${dbp} < ${sbpTarget}/${dbpTarget} mmHg: Duy trì thuốc uống an toàn (Labetalol / Nifedipine LA / Methyldopa)`,
          rationale: `Huyết áp hiện tại dưới ngưỡng cấp cứu tĩnh mạch (< ${sbpTarget}/${dbpTarget} mmHg); duy trì thuốc uống an toàn thai kỳ để giữ HA < ${thFor('sbp', 'htn.pregnancy.sbp_target')}/${thFor('dbp', 'htn.pregnancy.dbp_target')} mmHg và theo dõi sát mẹ - thai.`,
          gates: [],
          citationIds: ['esc.htn.2024.pregnancy_targets_rec22', 'vsh.htn.2022.emergency_preeclampsia'],
          priority: 88
        };
      }

      const medIds = getMedIds(ctx);
      const contraLabetalol =
        hasCondition(ctx, 'asthma') ||
        hasCondition(ctx, 'copd') ||
        hasCondition(ctx, 'acutePulmonaryEdema') ||
        hasCondition(ctx, 'hf') ||
        isHfrEf(ctx) ||
        hasAvBlockOrSssWithoutPacer(ctx) ||
        medIds.some((id) => NDHP_CCB_IDS.includes(id)) ||
        (hr !== undefined && hr < hrMin);

      if (contraLabetalol) {
        if (isSevereAorticStenosis(ctx)) {
          const hydName = drug('hydralazine').nameVi;
          const hydStart = th('htn.hydralazine_iv.dose_preg_start');
          const hydRepMax = th('htn.hydralazine_iv.dose_preg_max_bolus');
          const hydMax = th('htn.hydralazine_iv.dose_preg_max_cum');
          return {
            id: 'rec_htn_emergency_preeclampsia',
            module: 'htn',
            tier: 'Cấp cứu Tiền sản giật nặng (Chống chỉ định Labetalol & Nicardipine)',
            tierOrder: 0,
            action: 'START',
            drugId: 'hydralazine',
            drugNameVi: hydName,
            dose: `Tiêm tĩnh mạch chậm ${hydStart} mg, lặp lại ${hydStart}–${hydRepMax} mg mỗi 20–30 phút nếu cần (tối đa ${hydMax} mg) dưới giám sát huyết động xâm lấn`,
            title: `Hạ áp cấp cứu sản khoa bằng ${hydName} tĩnh mạch thận trọng (do chống chỉ định Labetalol và hẹp khít van ĐMC nặng chống chỉ định Nicardipine)`,
            rationale: `Thai phụ vừa có chống chỉ định Labetalol vừa có hẹp khít van động mạch chủ nặng (chống chỉ định Nicardipine giãn mạch mạnh). Sử dụng ${hydName} tĩnh mạch liều nhỏ chuẩn độ tại ICU có theo dõi huyết áp động mạch xâm lấn và hội chẩn Tim mạch - Sản khoa tối khẩn.`,
            gates: [],
            citationIds: [
              'esc.htn.2024.pregnancy_severe_rec22',
              'aha.acc.2025.pregnancy_iv_hydralazine',
              'vsh.htn.2022.emergency_preeclampsia'
            ],
            priority: 99
          };
        }

        const nicarName = drug('nicardipine').nameVi;
        const nicarDose = dose('nicardipine', 'start');
        return {
          id: 'rec_htn_emergency_preeclampsia',
          module: 'htn',
          tier: 'Cấp cứu Tiền sản giật nặng / Sản giật',
          tierOrder: 0,
          action: 'START',
          drugId: 'nicardipine',
          drugNameVi: nicarName,
          dose: fmtDose(nicarDose),
          title: `Hạ áp cấp cứu sản khoa bằng ${nicarName} tĩnh mạch (thay Labetalol do chống chỉ định): Đích < ${sbpTarget}/${dbpTarget} mmHg`,
          rationale: `Bệnh nhân có chống chỉ định dùng Labetalol tĩnh mạch (hen phế quản/COPD, suy tim, block nhĩ thất, đang dùng non-DHP CCB hoặc nhịp tim < ${hrMin} bpm); chuyển sang truyền ${nicarName} (hoặc Nifedipine phóng thích kéo dài uống nếu chưa có đường truyền) để đưa HA xuống < ${sbpTarget}/${dbpTarget} mmHg. Cấm tuyệt đối RASi và Sodium nitroprusside.`,
          gates: [],
          citationIds: [
            'vsh.htn.2022.emergency_preeclampsia',
            'aha.acc.2025.iv_nicardipine',
            'aha.acc.2025.pregnancy_contra_rec5'
          ],
          priority: 99
        };
      }

      if (hr === undefined) {
        return missingInputRec('htn', 'hr', 'kiểm tra tần số tim trước khi tiêm Labetalol tĩnh mạch trong cấp cứu sản khoa', [
          'aha.acc.2025.iv_labetalol'
        ]);
      }

      const labetalolName = drug('labetalol').nameVi;
      return {
        id: 'rec_htn_emergency_preeclampsia',
        module: 'htn',
        tier: 'Cấp cứu Tiền sản giật nặng / Sản giật',
        tierOrder: 0,
        action: 'START',
        drugId: 'labetalol',
        drugNameVi: labetalolName,
        dose: fmtInpatientIvDose('labetalol'),
        title: `Hạ áp cấp cứu sản khoa bằng ${labetalolName} tĩnh mạch: Đích SBP < ${sbpTarget} và DBP < ${dbpTarget} mmHg`,
        rationale: `Khuyến cáo loại I (ESC 2024 / AHA/ACC 2025 / VSH 2022): Khi huyết áp thai kỳ tăng nặng (${sbp}/${dbp} mmHg), hạ áp khẩn cấp bằng ${labetalolName} tĩnh mạch (hoặc Nicardipine tĩnh mạch / Nifedipine uống) đưa HA xuống < ${sbpTarget}/${dbpTarget} mmHg nhằm phòng xuất huyết não mẹ. CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI nhóm RASi và Sodium nitroprusside.`,
        gates: [],
        citationIds: [
          'esc.htn.2024.pregnancy_severe_rec22',
          'vsh.htn.2022.emergency_preeclampsia',
          'aha.acc.2025.iv_labetalol',
          'aha.acc.2025.pregnancy_contra_rec5'
        ],
        priority: 99
      };
    },
    citationIds: ['esc.htn.2024.pregnancy_severe_rec22', 'vsh.htn.2022.emergency_preeclampsia']
  }
];
