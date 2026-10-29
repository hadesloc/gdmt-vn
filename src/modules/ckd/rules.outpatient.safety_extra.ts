/**
 * GDMT-VN CKD Module - Extended Cross-Setting Medication Reconciliation Safety Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Metformin/FDC Renal Contra, Lactation STOP, Bilateral RAS STOP, Allergy/Angioedema STOP & CPS Contra)
 * Bao phủ: CKD-R4-R2-01, CKD-R4-R2-03, CKD-R4-R2-04, CKD-R4-R2-06, CKD-R4-R3-03, CKD-R4-R3-04, CKD-R4-R3-09
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  extractSglt2iComponentId,
  hasBilateralRenalArteryStenosis,
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasCpsContraindication,
  hasMetforminComponent,
  isAkiActive,
  isBreastfeedingCkd,
  isCkdLactationUnsafe,
  isDriMed,
  isRasiOrArniMed,
  isSglt2iMed,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

const EXTRA_SLOTS = [0, 1, 2, 3] as const; // qa-allow: index - chỉ số rà soát thuốc chống chỉ định đang dùng

export const ckdOutpatientSafetyExtraRules: Rule[] = [
  // 1. Chống chỉ định Metformin & viên phối hợp FDC chứa Metformin khi eGFR < 30 mL/phút/1.73m² hoặc đang lọc máu (CKD-R4-R2-01, CKD-R4-R3-03)
  ...EXTRA_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.safety.metformin_renal_contra_${slotIdx}`,
    module: 'ckd',
    nameVi: `Ngừng thuốc chứa Metformin (vị trí ${slotIdx}) khi suy thận nặng hoặc lọc máu`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || isAkiActive(ctx)) return false;
      const onDialysis = hasCkdFlag(ctx, 'onDialysis');
      const egfr = need(ctx, 'egfr');
      const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');
      if (!onDialysis && (egfr === undefined || egfr >= g3bMin)) return false;
      const metMeds = ctx.patient.currentMeds.filter((m) => hasMetforminComponent(m));
      return slotIdx < metMeds.length;
    },
    produce: (ctx) => {
      const metMeds = ctx.patient.currentMeds.filter((m) => hasMetforminComponent(m));
      const targetMed = metMeds[slotIdx];
      if (!targetMed) return null;

      const onDialysis = hasCkdFlag(ctx, 'onDialysis');
      const egfr = need(ctx, 'egfr');
      const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');
      const sglt2Min = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const normId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      const sglt2Comp = extractSglt2iComponentId(targetMed);
      const canBridgeSingleSglt2 =
        !onDialysis && isSglt2iMed(targetMed) && sglt2Comp !== undefined && egfr !== undefined && egfr > 0;
      const sglt2CompName = sglt2Comp ? drug(sglt2Comp).nameVi : 'SGLT2i đơn chất';

      const switchGuidance = canBridgeSingleSglt2
        ? ` Do ${medName} là viên phối hợp chứa cả SGLT2i và Metformin, bắt buộc NGỪNG viên phối hợp này. Đánh giá riêng khả năng duy trì ${sglt2CompName} đơn chất theo KDIGO 2024 PP 3.7.1${egfr < sglt2Min ? ' vì đã có hoạt chất SGLT2i trong phác đồ' : ''}; chỉ chuyển khi xác nhận liều, dung nạp và không có cổng an toàn chặn. Không tự tiếp tục SGLT2i nếu có chống chỉ định hoặc cần tạm ngưng.`
        : '';

      return {
        id: `rec_ckd_stop_metformin_renal_${normId}_${slotIdx}`,
        module: 'ckd',
        tier: 'Cảnh báo an toàn thận nghiêm trọng',
        tierOrder: 0,
        action: 'STOP',
        drugId: normId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG NGAY ${medName}: Chống chỉ định thành phần Metformin khi ${onDialysis ? 'đang lọc máu' : `eGFR < ${g3bMin} mL/phút/1.73m²`}`,
        rationale:
          `Theo nhãn FDA Metformin (Cảnh báo Hộp đen về nhiễm toan lactic) và KDIGO 2024: Metformin chống chỉ định tuyệt đối khi ${onDialysis ? 'đang lọc máu định kỳ' : `eGFR = ${egfr!.toFixed(0)} < ${g3bMin} mL/phút/1.73m²`} do tích lũy thuốc gây nhiễm toan lactic tử vong (MALA).${switchGuidance}`,
        gates: [
          {
            parameter: onDialysis ? 'dialysis' : 'eGFR',
            passed: false,
            value: onDialysis ? 'HD/PD' : egfr,
            threshold: g3bMin,
            messageVi: `Chống chỉ định Metformin khi ${onDialysis ? 'lọc máu' : `eGFR < ${g3bMin}`}: Ngừng ngay ${medName}`,
          },
        ],
        citationIds: [
          'fda.metformin.contra_renal_acidosis',
          'kdigo.ckd.2024.pp_3_7_1_continue_below_20',
        ],
        priority: 104,
      };
    },
    citationIds: ['fda.metformin.contra_renal_acidosis'],
  })),

  // 2. Ngừng ngay ACEi / ARB / ARNI / Aliskiren đang dùng nếu phát hiện hẹp động mạch thận hai bên (CKD-R4-R3-04)
  ...EXTRA_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.safety.bilateral_ras_stop_${slotIdx}`,
    module: 'ckd',
    nameVi: `Ngừng thuốc ức chế hệ RAA (vị trí ${slotIdx}) khi có hẹp động mạch thận hai bên`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant') || !hasBilateralRenalArteryStenosis(ctx)) return false;
      const rasiMeds = ctx.patient.currentMeds.filter((m) => isRasiOrArniMed(m) || isDriMed(m));
      return slotIdx < rasiMeds.length;
    },
    produce: (ctx) => {
      const rasiMeds = ctx.patient.currentMeds.filter((m) => isRasiOrArniMed(m) || isDriMed(m));
      const targetMed = rasiMeds[slotIdx];
      if (!targetMed) return null;

      const normId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      return {
        id: `rec_ckd_stop_bilateral_ras_${normId}_${slotIdx}`,
        module: 'ckd',
        tier: 'Cảnh báo an toàn nghiêm trọng',
        tierOrder: 0,
        action: 'STOP',
        drugId: normId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG NGAY ${medName}: Chống chỉ định ở hẹp động mạch thận hai bên / thận độc nhất`,
        rationale:
          `Theo KDIGO 2024 (Figure 24) và nhãn thuốc: Ở bệnh nhân hẹp động mạch thận hai bên có ý nghĩa huyết động (hoặc hẹp động mạch trên thận độc nhất), tưới máu cầu thận phụ thuộc hoàn toàn vào trương lực co tiểu động mạch đi của Angiotensin II; dùng ${medName} gây tụt áp lực lọc đột ngột và suy thận cấp thiếu máu cục bộ. Bắt buộc ngừng thuốc và hội chẩn chuyên khoa Thận - Mạch máu.`,
        gates: [
          {
            parameter: 'Renal_Artery_Stenosis',
            passed: false,
            messageVi: `Hẹp động mạch thận hai bên: Ngừng ngay ${medName}`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.fig_24_consider_ras_stenosis',
          'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
        ],
        priority: 104,
      };
    },
    citationIds: ['kdigo.ckd.2024.fig_24_consider_ras_stenosis'],
  })),

  // 3. Ngừng ngay thuốc đang dùng nếu bệnh nhân có tiền sử dị ứng đặc hiệu / phù mạch liên quan thuốc đó (CKD-R4-R2-04)
  ...EXTRA_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.safety.active_allergy_stop_${slotIdx}`,
    module: 'ckd',
    nameVi: `Ngừng thuốc đang dùng có tiền sử dị ứng / phù mạch (vị trí ${slotIdx})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) return false;
      const allergicMeds = ctx.patient.currentMeds.filter((m) => hasCkdDrugAllergy(ctx, m.drugId));
      return slotIdx < allergicMeds.length;
    },
    produce: (ctx) => {
      const allergicMeds = ctx.patient.currentMeds.filter((m) => hasCkdDrugAllergy(ctx, m.drugId));
      const targetMed = allergicMeds[slotIdx];
      if (!targetMed) return null;

      const normId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      return {
        id: `rec_ckd_stop_allergy_${normId}_${slotIdx}`,
        module: 'ckd',
        tier: 'Cảnh báo dị ứng & Phù mạch',
        tierOrder: 0,
        action: 'STOP',
        drugId: normId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG KHẨN CẤP ${medName}: Chống chỉ định do tiền sử dị ứng thuốc / phù mạch`,
        rationale:
          `Bệnh nhân có tiền sử dị ứng đặc hiệu hoặc phù mạch chống chỉ định với hoạt chất trong ${medName}. Bắt buộc ngừng ngay lập tức để phòng phản vệ hoặc phù mạch thanh quản đe dọa tính mạng.`,
        gates: [
          {
            parameter: 'allergy',
            passed: false,
            messageVi: `Tiền sử dị ứng / phù mạch: Bắt buộc ngừng ${medName}`,
          },
        ],
        citationIds: ['ema.perindopril.pregnancy', 'kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm'],
        priority: 105,
      };
    },
    citationIds: ['ema.perindopril.pregnancy'],
  })),

  // 4. Ngừng / chuyển đổi thuốc không an toàn đang dùng ở phụ nữ đang cho con bú (CKD-R4-R2-03, CKD-R4-R3-09)
  ...EXTRA_SLOTS.map((slotIdx): Rule => ({
    id: `ckd.safety.lactation_stop_${slotIdx}`,
    module: 'ckd',
    nameVi: `Ngừng thuốc chống chỉ định / tránh dùng khi cho con bú (vị trí ${slotIdx})`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isBreastfeedingCkd(ctx)) return false;
      const unsafeMeds = ctx.patient.currentMeds.filter((m) => isCkdLactationUnsafe(ctx, m.drugId));
      return slotIdx < unsafeMeds.length;
    },
    produce: (ctx) => {
      const unsafeMeds = ctx.patient.currentMeds.filter((m) => isCkdLactationUnsafe(ctx, m.drugId));
      const targetMed = unsafeMeds[slotIdx];
      if (!targetMed) return null;

      const normId = normalizeDrugId(targetMed.drugId);
      const medName = medDisplayName(targetMed);
      const isRasi = isRasiOrArniMed(targetMed) || isDriMed(targetMed);
      const switchNote = isRasi
        ? ' Nếu có chỉ định ức chế hệ RAS bảo vệ thận/hạ áp hậu sản, khuyến cáo chuyển sang Enalapril hoặc Captopril (tương thích an toàn khi cho con bú ở trẻ đủ tháng theo ESC 2025).'
        : '';

      return {
        id: `rec_ckd_stop_lactation_${normId}_${slotIdx}`,
        module: 'ckd',
        tier: 'Cảnh báo an toàn thời kỳ cho con bú',
        tierOrder: 0,
        action: 'STOP',
        drugId: normId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG / CHUYỂN ĐỔI ${medName} trong thời kỳ đang cho con bú`,
        rationale:
          `Theo Hướng dẫn ESC 2025 (Pregnancy & Lactation) và nhãn FDA/SmPC: Tránh sử dụng ${medName} khi đang cho con bú do nguy cơ bài tiết qua sữa mẹ hoặc độc tính trên thận/chuyển hóa của trẻ nhũ nhi.${switchNote}`,
        gates: [
          {
            parameter: 'lactation',
            passed: false,
            messageVi: `Đang cho con bú: Ngừng/tránh dùng ${medName}`,
          },
        ],
        citationIds: [
          'esc.2025.pregnancy.rasi_lactation',
          'fda.losartan.lactation_8_2',
          'ema.perindopril.lactation_4_6',
        ],
        priority: 103,
      };
    },
    citationIds: ['esc.2025.pregnancy.rasi_lactation'],
  })),

  // 5. Ngừng ngay Calcium Polystyrene Sulfonate nếu có tắc ruột / liệt ruột / tăng canxi máu (CKD-R4-R2-06)
  {
    id: 'ckd.safety.cps_bowel_hyperca_stop',
    module: 'ckd',
    nameVi: 'Ngừng Calcium Polystyrene Sulfonate khi có tắc/liệt ruột hoặc tăng canxi máu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      hasCpsContraindication(ctx) &&
      ctx.patient.currentMeds.some(
        (m) => normalizeDrugId(m.drugId) === 'calcium_polystyrene_sulfonate'
      ),
    produce: (ctx) => {
      const cpsMed = ctx.patient.currentMeds.find(
        (m) => normalizeDrugId(m.drugId) === 'calcium_polystyrene_sulfonate'
      )!;
      const cpsName = medDisplayName(cpsMed);
      return {
        id: 'rec_ckd_stop_cps_contra',
        module: 'ckd',
        tier: 'Cảnh báo an toàn tiêu hóa & điện giải',
        tierOrder: 0,
        action: 'STOP',
        drugId: 'calcium_polystyrene_sulfonate',
        drugNameVi: cpsName,
        dose: undefined,
        title: `NGỪNG NGAY ${cpsName}: Chống chỉ định ở tắc ruột / liệt ruột / tăng canxi máu`,
        rationale:
          'Theo UKKA 2022 (Appendix 3F) và SmPC Calcium Resonium: Chống chỉ định tuyệt đối nhựa trao đổi ion Calcium Polystyrene Sulfonate trên bệnh nhân tắc ruột, liệt ruột sau mổ hoặc tăng canxi máu do nguy cơ thủng/hoại tử đại tràng tử vong.',
        gates: [
          {
            parameter: 'CPS_Contra',
            passed: false,
            messageVi: `Tắc/liệt ruột hoặc tăng canxi máu: Bắt buộc ngừng ${cpsName}`,
          },
        ],
        citationIds: ['ukka.2022.appendix_3f_cps_contra_bowel'],
        priority: 104,
      };
    },
    citationIds: ['ukka.2022.appendix_3f_cps_contra_bowel'],
  },
];
