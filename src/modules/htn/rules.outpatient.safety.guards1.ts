/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Phân luồng Cấp cứu, Cấm Trùng Nhóm & Tụt HA
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ACEI_IDS,
  ALPHA1_IDS,
  ARB_IDS,
  ARNI_IDS,
  CCB_IDS,
  LOOP_IDS,
  RASI_IDS,
  THIAZIDE_IDS,
  getMedIds,
  hasAnyAcuteHmod,
  isPregnantSevereCrisis
} from './helpers';

export const htnOutpatientTriageRule: Rule = {
    id: 'htn.outpatient.triage_hypertensive_crisis',
    module: 'htn',
    nameVi: 'Phân luồng Cấp cứu ngoại trú: Cơn tăng huyết áp kịch phát hoặc có HMOD cấp / cấp cứu sản khoa',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasAnyAcuteHmod(ctx) || isPregnantSevereCrisis(ctx)) return true;
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const sbpCrisis = thFor('sbp', 'htn.emergency.sbp_crisis');
      const dbpCrisis = thFor('dbp', 'htn.emergency.dbp_crisis');
      return (sbp !== undefined && sbp >= sbpCrisis) || (dbp !== undefined && dbp >= dbpCrisis);
    },
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const sbpCrisis = thFor('sbp', 'htn.emergency.sbp_crisis');
      const dbpCrisis = thFor('dbp', 'htn.emergency.dbp_crisis');
      const sevPregSbp = thFor('sbp', 'htn.pregnancy.severe_sbp');
      const sevPregDbp = thFor('dbp', 'htn.pregnancy.severe_dbp');

      if (hasAnyAcuteHmod(ctx) || isPregnantSevereCrisis(ctx)) {
        const bpStr = sbp !== undefined && dbp !== undefined ? ` (HA hiện tại ${sbp}/${dbp} mmHg)` : '';
        return {
          id: 'rec_htn_outpatient_emergency_refer',
          module: 'htn',
          tier: 'Cấp cứu Tối khẩn — Chuyển viện Cấp cứu ngay',
          tierOrder: 0,
          action: 'REFER',
          title: `CHUYỂN CẤP CỨU NỘI VIỆN NGAY LẬP TỨC: Phát hiện dấu hiệu HMOD cấp hoặc Cấp cứu sản khoa${bpStr}`,
          rationale: `Bệnh nhân tại phòng khám có dấu hiệu tổn thương cơ quan đích cấp tính hoặc tăng huyết áp thai kỳ mức độ nặng (≥ ${sevPregSbp}/${sevPregDbp} mmHg). BẮT BUỘC chuyển ngay vào Khoa Cấp cứu / Hồi sức hoặc Cấp cứu Sản khoa để theo dõi liên tục và xử trí chuyên biệt. TUYỆT ĐỐI KHÔNG kê đơn cho về nhà và KHÔNG nhỏ Nifedipine tác dụng nhanh dưới lưỡi.`,
          gates: [
            {
              parameter: 'Cấp cứu ngoại trú',
              passed: false,
              messageVi: 'Có HMOD cấp hoặc HA thai kỳ ≥ 160/110 mmHg: Chuyển Cấp cứu nội viện ngay'
            }
          ],
          citationIds: [
            'aha.acc.2025.emergency_compelling_rec2',
            'esc.htn.2024.pregnancy_severe_rec22',
            'aha.acc.2025.nifedipine_no_sublingual'
          ],
          priority: 100
        };
      }

      if (sbp === undefined || dbp === undefined) return null;
      if (sbp < sbpCrisis && dbp < dbpCrisis) return null;

      return {
        id: 'rec_htn_outpatient_crisis_triage',
        module: 'htn',
        tier: 'Tầm soát Khẩn cấp Cơn Tăng huyết áp Nặng',
        tierOrder: 0,
        action: 'REFER',
        title: `CƠN TĂNG HUYẾT ÁP NẶNG (${sbp}/${dbp} ≥ ${sbpCrisis}/${dbpCrisis} mmHg): Loại trừ ngay HMOD cấp trước khi xử trí ngoại trú`,
        rationale: `Huyết áp phòng khám tăng rất cao (${sbp}/${dbp} mmHg). Cần khám lâm sàng, soi đáy mắt, đo ECG 12 chuyển đạo và xét nghiệm nhanh để loại trừ tổn thương cơ quan đích cấp tính (đau ngực, khó thở phù phổi, dấu thần kinh khu trú, lú lẫn, nhìn mờ). Nếu CÓ triệu chứng HMOD: chuyển Khoa Cấp cứu ngay. Nếu hoàn toàn KHÔNG có triệu chứng HMOD: theo AHA/ACC 2025 (Take-Home Message 10), khởi trị lại hoặc tối ưu thuốc uống tác dụng kéo dài ngoại trú và hẹn tái khám sát; TUYỆT ĐỐI CẤM dùng Nifedipine ngậm dưới lưỡi.`,
        gates: [
          {
            parameter: 'Huyết áp phòng khám',
            passed: false,
            value: sbp,
            threshold: sbpCrisis,
            messageVi: `HA ${sbp}/${dbp} ≥ ${sbpCrisis}/${dbpCrisis} mmHg: Phải loại trừ HMOD cấp trước khi kê đơn ngoại trú`
          }
        ],
        citationIds: [
          'aha.acc.2025.severe_outpatient_msg10',
          'vsh.htn.2022.emergency_malignant',
          'aha.acc.2025.nifedipine_no_sublingual'
        ],
        priority: 100
      };
    },
    citationIds: ['aha.acc.2025.severe_outpatient_msg10', 'aha.acc.2025.nifedipine_no_sublingual']
  };

export const htnOutpatientSafetyGuards1Rules: Rule[] = [
  {
    id: 'htn.outpatient.ban_dual_rasi',
    module: 'htn',
    nameVi: 'Cấm tuyệt đối phối hợp cùng lúc hai thuốc ức chế hệ RAS (2 ACEi, 2 ARB, ACEi+ARB hoặc +ARNI)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const medIds = getMedIds(ctx);
      const uniqueRasi = new Set(medIds.filter((id) => RASI_IDS.includes(id)));
      return uniqueRasi.size >= 2;
    },
    produce: (ctx: RuleContext): Recommendation => {
      const medIds = getMedIds(ctx);
      const rasiList = Array.from(new Set(medIds.filter((id) => RASI_IDS.includes(id))));
      const hasArni = rasiList.some((id) => ARNI_IDS.includes(id));
      const activeAceis = rasiList.filter((id) => ACEI_IDS.includes(id));
      const activeArbs = rasiList.filter((id) => ARB_IDS.includes(id));

      let targetStopDrug = rasiList[rasiList.length - 1];
      if (hasArni && activeAceis.length > 0) {
        targetStopDrug = activeAceis[0];
      } else if (activeAceis.length > 0 && activeArbs.length > 0) {
        targetStopDrug = activeArbs[0];
      }

      return {
        id: 'rec_htn_ban_dual_rasi',
        module: 'htn',
        tier: 'Cảnh báo An toàn Tối cấp',
        tierOrder: 0,
        action: 'STOP',
        drugId: targetStopDrug,
        title: `NGỪNG NGAY ${targetStopDrug}: Cấm phối hợp đồng thời hai thuốc ức chế hệ RAS (ACEi / ARB / ARNI)`,
        rationale:
          'Chống chỉ định nhóm III mức A (ESC 2024 / AHA/ACC 2025 / VSH 2022): Dùng đồng thời ≥ 2 thuốc tác động hệ renin-angiotensin (kể cả 2 ACEi, 2 ARB, ACEi + ARB hoặc phối hợp với Sacubitril/Valsartan) gây tăng kali máu đe dọa tính mạng, tụt huyết áp và suy thận cấp (riêng ARNI + ACEi gây phù mạch thanh quản tử vong, cần washout 36 giờ).',
        gates: [
          {
            parameter: 'Phối hợp kép RASi',
            passed: false,
            messageVi: 'Vi phạm an toàn nhóm III: Đang dùng ≥ 2 thuốc thuộc hệ RAS'
          }
        ],
        citationIds: ['esc.htn.2024.ban_dual_rasi', 'aha.acc.2025.acei_angioedema_contra'],
        priority: 100
      };
    },
    citationIds: ['esc.htn.2024.ban_dual_rasi']
  },

  {
    id: 'htn.outpatient.ban_duplicate_ccb',
    module: 'htn',
    nameVi: 'Ngừng thuốc chẹn kênh canxi trùng nhóm',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => new Set(getMedIds(ctx).filter((id) => CCB_IDS.includes(id))).size >= 2,
    produce: (ctx: RuleContext): Recommendation => {
      const ccbs = Array.from(new Set(getMedIds(ctx).filter((id) => CCB_IDS.includes(id))));
      const stopId = ccbs[ccbs.length - 1];
      return {
        id: 'rec_htn_ban_duplicate_ccb',
        module: 'htn',
        tier: 'Cảnh báo Trùng lặp Nhóm thuốc',
        tierOrder: 0,
        action: 'STOP',
        drugId: stopId,
        title: `NGỪNG ${stopId}: Không dùng trùng lặp đồng thời hai thuốc chẹn kênh canxi (${ccbs.join(' + ')})`,
        rationale:
          'Phối hợp trùng hai thuốc chẹn kênh canxi làm tăng mạnh nguy cơ tụt huyết áp, phù mắt cá chân nặng, đỏ bừng mặt hoặc rối loạn dẫn truyền nhĩ thất mà không mang lại lợi ích bảo vệ tim mạch cộng thêm.',
        gates: [],
        citationIds: ['esc.htn.2024.first_line_classes'],
        priority: 98
      };
    },
    citationIds: ['esc.htn.2024.first_line_classes']
  },

  {
    id: 'htn.outpatient.ban_duplicate_diuretic',
    module: 'htn',
    nameVi: 'Ngừng thuốc lợi tiểu trùng phân nhóm (2 Thiazide hoặc 2 Lợi tiểu quai)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const meds = getMedIds(ctx);
      const thz = new Set(meds.filter((id) => THIAZIDE_IDS.includes(id)));
      const loops = new Set(meds.filter((id) => LOOP_IDS.includes(id)));
      return thz.size >= 2 || loops.size >= 2;
    },
    produce: (ctx: RuleContext): Recommendation => {
      const meds = getMedIds(ctx);
      const thz = Array.from(new Set(meds.filter((id) => THIAZIDE_IDS.includes(id))));
      const loops = Array.from(new Set(meds.filter((id) => LOOP_IDS.includes(id))));
      const dupList = thz.length >= 2 ? thz : loops;
      const stopId = dupList[dupList.length - 1];
      return {
        id: 'rec_htn_ban_duplicate_diuretic',
        module: 'htn',
        tier: 'Cảnh báo Trùng lặp Nhóm thuốc',
        tierOrder: 0,
        action: 'STOP',
        drugId: stopId,
        title: `NGỪNG ${stopId}: Không dùng trùng lặp hai thuốc lợi tiểu cùng phân nhóm (${dupList.join(' + ')})`,
        rationale:
          'Dùng trùng hai lợi tiểu Thiazide/Thiazide-like hoặc hai lợi tiểu quai gây mất nước, hạ kali máu, hạ natri máu nặng và tổn thương thận cấp trước thận.',
        gates: [],
        citationIds: ['esc.htn.2024.first_line_classes'],
        priority: 98
      };
    },
    citationIds: ['esc.htn.2024.first_line_classes']
  },

  // -------------------------------------------------------------------------
  // 3. TỤT HUYẾT ÁP SBP < 90 mmHg: TẠM NGỪNG CÁC NHÓM HẠ ÁP ĐẶC THÙ (ALPHA-1, TRUNG ƯƠNG)
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.hypotension_hold_alpha1',
    module: 'htn',
    nameVi: 'Tụt huyết áp: Tạm ngừng thuốc chẹn alpha-1 đang dùng',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      return sbp !== undefined && sbp < sbpHypo && getMedIds(ctx).some((id) => ALPHA1_IDS.includes(id));
    },
    produce: (ctx: RuleContext): Recommendation => {
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const medId = getMedIds(ctx).find((id) => ALPHA1_IDS.includes(id)) || 'doxazosin';
      return {
        id: 'rec_htn_hypotension_hold_alpha1',
        module: 'htn',
        tier: 'Cảnh báo Tụt huyết áp',
        tierOrder: 0,
        action: 'HOLD',
        drugId: medId,
        title: `TẠM NGỪNG ${medId} ngay do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg)`,
        rationale: `Thuốc chẹn alpha-1 (${medId}) gây giãn tĩnh mạch và tụt huyết áp tư thế nặng; bắt buộc tạm ngừng ngay khi SBP < ${sbpHypo} mmHg.`,
        gates: [],
        citationIds: ['aha.acc.2025.table13_alpha1'],
        priority: 100
      };
    },
    citationIds: ['aha.acc.2025.table13_alpha1']
  },

  {
    id: 'htn.outpatient.hypotension_hold_methyldopa',
    module: 'htn',
    nameVi: 'Tụt huyết áp: Tạm ngừng Methyldopa đang dùng',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      return sbp !== undefined && sbp < sbpHypo && getMedIds(ctx).includes('methyldopa');
    },
    produce: (ctx: RuleContext): Recommendation => {
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      return {
        id: 'rec_htn_hypotension_hold_methyldopa',
        module: 'htn',
        tier: 'Cảnh báo Tụt huyết áp',
        tierOrder: 0,
        action: 'HOLD',
        drugId: 'methyldopa',
        title: `TẠM NGỪNG Methyldopa ngay do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg)`,
        rationale: `Huyết áp tâm thu ${sbp} mmHg (< ${sbpHypo} mmHg): bắt buộc tạm ngừng Methyldopa và đánh giá nguyên nhân tụt huyết áp.`,
        gates: [],
        citationIds: ['vsh.htn.2022.drugs_table_other'],
        priority: 100
      };
    },
    citationIds: ['vsh.htn.2022.drugs_table_other']
  },

  {
    id: 'htn.outpatient.hypotension_hold_clonidine_moxonidine',
    module: 'htn',
    nameVi: 'Tụt huyết áp: Tạm ngừng/giảm liều thuốc giao cảm trung ương dưới giám sát',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      return (
        sbp !== undefined &&
        sbp < sbpHypo &&
        getMedIds(ctx).some((id) => id === 'clonidine' || id === 'moxonidine')
      );
    },
    produce: (ctx: RuleContext): Recommendation => {
      const sbp = need(ctx, 'sbp');
      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const medId = getMedIds(ctx).find((id) => id === 'clonidine' || id === 'moxonidine') || 'clonidine';
      return {
        id: 'rec_htn_hypotension_hold_central',
        module: 'htn',
        tier: 'Cảnh báo Tụt huyết áp',
        tierOrder: 0,
        action: 'HOLD',
        drugId: medId,
        title: `TẠM HOÃN liều ${medId} do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg) — Theo dõi dội ngược huyết áp`,
        rationale: `SBP ${sbp} < ${sbpHypo} mmHg bắt buộc hoãn liều ${medId} kế tiếp và hồi sức huyết động; lưu ý theo dõi sát hiện tượng tăng huyết áp dội ngược khi giảm/ngừng Clonidine.`,
        gates: [],
        citationIds: ['aha.acc.2025.table13_central_clonidine'],
        priority: 100
      };
    },
    citationIds: ['aha.acc.2025.table13_central_clonidine']
  },

  // -------------------------------------------------------------------------
  // 4. TIỀN SỬ PHÙ MẠCH, HẸP ĐM THẬN HAI BÊN & TĂNG KALI MÁU
  // -------------------------------------------------------------------------
];
