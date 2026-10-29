/**
 * GDMT-VN Module Tăng huyết áp (htn) - Ngoại trú: Cổng An toàn Phù mạch, Kali, Hẹp ĐM Thận, Lercanidipine & Moxonidine
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ACEI_IDS,
  ARNI_IDS,
  LERCANIDIPINE_CONTRA_DDI_IDS,
  RASI_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  hasBilateralRenalArteryStenosis,
  isHfrEf
} from './helpers';

export const htnOutpatientSafetyGuards2Rules: Rule[] = [
  {
    id: 'htn.outpatient.prior_angioedema_avoid_acei',
    module: 'htn',
    nameVi: 'Tiền sử phù mạch: Chống chỉ định tuyệt đối ACEi và Sacubitril/Valsartan',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => hasCondition(ctx, 'priorAngioedema'),
    produce: (ctx: RuleContext): Recommendation => {
      const medIds = getMedIds(ctx);
      const activeArni = medIds.find((id) => ARNI_IDS.includes(id));
      const activeAcei = medIds.find((id) => ACEI_IDS.includes(id));
      const stopDrug = activeArni || activeAcei;

      if (stopDrug) {
        return {
          id: 'rec_htn_angioedema_stop_acei',
          module: 'htn',
          tier: 'Cảnh báo Phù mạch Tử vong',
          tierOrder: 0,
          action: 'STOP',
          drugId: stopDrug,
          title: `NGỪNG NGAY LẬP TỨC ${stopDrug} do tiền sử phù mạch (Angioedema) — Chống chỉ định tuyệt đối`,
          rationale:
            'Khuyến cáo nhóm III: Harm (AHA/ACC 2025 / ESC 2024 / VSH 2022): Tiền sử phù mạch là chống chỉ định tuyệt đối với mọi thuốc ức chế men chuyển (ACEi) và ARNI (Sacubitril/Valsartan) do nguy cơ phù thanh quản ngạt thở tử vong. Theo AHA/ACC 2025 Table 18, nếu cần đổi sang ARB (như Losartan), nên chờ khoảng 6 tuần sau khi ngừng ACEi.',
          gates: [
            {
              parameter: 'Tiền sử phù mạch',
              passed: false,
              messageVi: 'Chống chỉ định tuyệt đối ACEi và Sacubitril/Valsartan'
            }
          ],
          citationIds: ['aha.acc.2025.acei_angioedema_contra', 'aha.acc.2025.arb_angioedema_6wk'],
          priority: 100
        };
      }

      return {
        id: 'rec_htn_angioedema_avoid_acei',
        module: 'htn',
        tier: 'Cổng An toàn Dị ứng / Phù mạch',
        tierOrder: 0,
        action: 'AVOID',
        drugId: 'perindopril',
        drugNameVi: 'Nhóm thuốc ức chế men chuyển ACEi (Perindopril / Enalapril) & ARNI',
        title: 'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI nhóm ACEi (Perindopril) và ARNI do tiền sử phù mạch',
        rationale:
          'Theo AHA/ACC 2025 (COR 3: Harm) và VSH 2022 (Bảng 11), tuyệt đối không kê bất kỳ thuốc ACEi hay Sacubitril/Valsartan nào cho bệnh nhân có tiền sử phù mạch. Có thể cân nhắc ARB (Losartan) thận trọng (cách tối thiểu 6 tuần kể từ khi ngừng ACEi theo AHA/ACC 2025 Table 18).',
        gates: [],
        citationIds: ['aha.acc.2025.acei_angioedema_contra', 'aha.acc.2025.arb_angioedema_6wk'],
        priority: 98
      };
    },
    citationIds: ['aha.acc.2025.acei_angioedema_contra', 'aha.acc.2025.arb_angioedema_6wk']
  },

  {
    id: 'htn.outpatient.hyperkalemia_or_ras_avoid_rasi',
    module: 'htn',
    nameVi: 'Tăng kali máu hoặc Hẹp động mạch thận hai bên: Ngừng / Tránh khởi trị thuốc ức chế hệ RAS',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (hasBilateralRenalArteryStenosis(ctx)) return true;
      const k = need(ctx, 'k');
      const kInitMax = thFor('k', 'htn.rasi.k_initiate_max'); // 5.0
      const kStopMax = thFor('k', 'htn.rasi.k_max_initiate'); // 5.5
      if (k === undefined) return false;
      const onRasi = getMedIds(ctx).some((id) => RASI_IDS.includes(id));
      return onRasi ? k > kStopMax : k > kInitMax;
    },
    produce: (ctx: RuleContext): Recommendation => {
      const k = need(ctx, 'k');
      const kInitMax = thFor('k', 'htn.rasi.k_initiate_max');
      const kStopMax = thFor('k', 'htn.rasi.k_max_initiate');
      const hasRas = hasBilateralRenalArteryStenosis(ctx);
      const activeRasi = getMedIds(ctx).find((id) => RASI_IDS.includes(id));

      if (activeRasi) {
        return {
          id: 'rec_htn_stop_rasi_contra',
          module: 'htn',
          tier: 'Cảnh báo An toàn Thận - Điện giải',
          tierOrder: 0,
          action: 'STOP',
          drugId: activeRasi,
          title: hasRas
            ? `NGỪNG NGAY ${activeRasi} do Hẹp động mạch thận hai bên / trên thận độc nhất`
            : `NGỪNG/TẠM HOÃN ${activeRasi} do tăng kali máu nặng (K⁺ = ${k} > ${kStopMax} mmol/L)`,
          rationale: hasRas
            ? 'Chống chỉ định bắt buộc (VSH 2022 Bảng 11 / ESC 2024): Ức chế hệ RAS làm mất trương lực tiểu động mạch đi cầu thận, gây suy thận cấp vô niệu trên bệnh nhân hẹp động mạch thận hai bên.'
            : `Nồng độ Kali máu ${k} mmol/L vượt ngưỡng an toàn ${kStopMax} mmol/L; bắt buộc ngừng thuốc ức chế hệ RAS và xử trí hạ kali máu khẩn cấp.`,
          gates: [],
          citationIds: ['vsh.htn.2022.bb_contraindications_table11', 'aha.acc.2025.table18_k50'],
          priority: 100
        };
      }

      return {
        id: 'rec_htn_avoid_rasi_contra',
        module: 'htn',
        tier: 'Cổng An toàn Thận - Điện giải',
        tierOrder: 0,
        action: 'AVOID',
        drugId: 'perindopril',
        drugNameVi: 'Nhóm thuốc ức chế hệ RAS (ACEi / ARB / ARNI)',
        title: hasRas
          ? 'CHỐNG CHỈ ĐỊNH khởi trị ACEi/ARB (Perindopril/Losartan) do Hẹp động mạch thận hai bên'
          : `TRÁNH KHỞI TRỊ mới ACEi/ARB do Kali máu tăng (K⁺ = ${k} > ${kInitMax} mmol/L)`,
        rationale: hasRas
          ? 'Hẹp động mạch thận hai bên hoặc trên thận độc nhất là chống chỉ định tuyệt đối của ACEi/ARB; kiểm soát huyết áp bằng CCB và/hoặc lợi tiểu.'
          : `Theo VSH 2022 (Hình 4) và AHA/ACC 2025 (Table 18), không khởi trị mới thuốc ức chế hệ RAS khi Kali máu nền > ${kInitMax} mmol/L (tuyệt đối chống chỉ định khi > ${kStopMax} mmol/L); ưu tiên khởi trị nhóm CCB (Amlodipine).`,
        gates: [],
        citationIds: ['vsh.htn.2022.resistant_k5', 'aha.acc.2025.table18_k50'],
        priority: 98
      };
    },
    citationIds: ['vsh.htn.2022.resistant_k5', 'aha.acc.2025.table18_k50']
  },

  // -------------------------------------------------------------------------
  // 5. AN TOÀN THUỐC ĐẶC THÙ: LERCANIDIPINE, MOXONIDINE, INDAPAMIDE/HCTZ SUY THẬN,
  //    HẠ KALI MÁU, BLOCK NHĨ THẤT, CLONIDINE DDI, GÚT & HẠ HA TƯ THẾ
  // -------------------------------------------------------------------------
  {
    id: 'htn.outpatient.lercanidipine_safety',
    module: 'htn',
    nameVi: 'Cổng an toàn Lercanidipine: Chống chỉ định ở suy thận nặng hoặc dùng kèm ức chế mạnh CYP3A4 / Ciclosporin',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      const meds = getMedIds(ctx);
      if (!meds.includes('lercanidipine')) return false;
      const egfr = need(ctx, 'egfr');
      const egfrMin = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      return (egfr !== undefined && egfr < egfrMin) || meds.some((id) => LERCANIDIPINE_CONTRA_DDI_IDS.includes(id));
    },
    produce: (ctx: RuleContext): Recommendation => {
      const meds = getMedIds(ctx);
      const egfr = need(ctx, 'egfr');
      const egfrMin = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      const ddiMed = meds.find((id) => LERCANIDIPINE_CONTRA_DDI_IDS.includes(id));
      return {
        id: 'rec_htn_stop_lercanidipine_contra',
        module: 'htn',
        tier: 'Cảnh báo Chống chỉ định Dược lý',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'lercanidipine',
        title: ddiMed
          ? `NGỪNG NGAY Lercanidipine do chống chỉ định phối hợp với ${ddiMed} (ức chế mạnh CYP3A4 / Ciclosporin)`
          : `NGỪNG NGAY Lercanidipine do suy thận nặng (eGFR < ${egfrMin} mL/min/1.73m²) — Đổi sang Amlodipine`,
        rationale: ddiMed
          ? `Lercanidipine chuyển hóa hoàn toàn qua CYP3A4; phối hợp với ${ddiMed} làm tăng diện tích dưới đường cong (AUC) lên gấp hàng chục lần gây tụt huyết áp sốc. Đổi sang Amlodipine liều thấp.`
          : `Khác với Amlodipine, nhãn thuốc EMA/VSH chống chỉ định Lercanidipine khi eGFR < ${egfrMin} mL/min/1.73m² (hiện tại ${egfr?.toFixed(0)} mL/min/1.73m²). Cần ngừng Lercanidipine và chuyển sang Amlodipine.`,
        gates: [],
        citationIds: ['vsh.htn.2022.drugs_table_rasi_bb'],
        priority: 99
      };
    },
    citationIds: ['vsh.htn.2022.drugs_table_rasi_bb']
  },

  {
    id: 'htn.outpatient.moxonidine_safety',
    module: 'htn',
    nameVi: 'Cổng an toàn Moxonidine: Chống chỉ định trong Suy tim (MOXCON), suy thận nặng và nhịp chậm',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) => {
      if (!getMedIds(ctx).includes('moxonidine')) return false;
      const egfr = need(ctx, 'egfr');
      const hr = need(ctx, 'hr');
      const egfrMin = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');
      return (
        hasCondition(ctx, 'hf') ||
        isHfrEf(ctx) ||
        hasAvBlockOrSssWithoutPacer(ctx) ||
        (egfr !== undefined && egfr < egfrMin) ||
        (hr !== undefined && hr < hrMin)
      );
    },
    produce: (): Recommendation => {
      const egfrMin = thFor('egfr', 'htn.diuretic.egfr_loop_switch');
      return {
        id: 'rec_htn_stop_moxonidine_contra',
        module: 'htn',
        tier: 'Cảnh báo Chống chỉ định Tuyệt đối (Moxonidine)',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'moxonidine',
        title: `NGỪNG Moxonidine (giảm liều dần): Chống chỉ định trong Suy tim, Suy thận nặng (eGFR < ${egfrMin}) hoặc Nhịp chậm / Block AV`,
        rationale: `Theo ESC 2024 và dữ liệu thử nghiệm MOXCON, thuốc chủ vận imidazoline trung ương Moxonidine làm TĂNG TỬ VONG ở bệnh nhân suy tim và chống chỉ định khi eGFR < ${egfrMin} mL/min/1.73m² hoặc nhịp chậm/block nhĩ thất. Giảm liều ngừng dần trong 2 tuần để tránh tăng huyết áp dội ngược.`,
        gates: [],
        citationIds: ['esc.htn.2024.resistant_alternatives', 'esc.hf.2026.moxonidine_contra'],
        priority: 99
      };
    },
    citationIds: ['esc.htn.2024.resistant_alternatives', 'esc.hf.2026.moxonidine_contra']
  }
];
