/**
 * GDMT-VN CKD Module - Inpatient AKI Staging, FDC-Aware Sick-Day Medication Hold & Diuretic Stewardship Rules
 * Phân quyền: Agent E (Round 4 Remediation - FDC/DRI-aware Sick-day HOLD & dose: undefined)
 * Bao phủ: CKD-R4-R2-01, CKD-R4-R3-05
 */

import type { CurrentMed, Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  getBaselineScrUmol,
  hasMetforminComponent,
  isAkiActive,
  isDriMed,
  isKSparingOrSteroidalMraMed,
  isLoopOrThiazideDiureticMed,
  isRasiOrArniMed,
  isSglt2iMed,
  medDisplayName,
  normalizeDrugId,
} from './helpers';

const SECONDARY_SICK_DAY_SLOTS = [0, 1, 2, 3, 4] as const; // qa-allow: index - chỉ số thuốc ngày ốm đi kèm trong AKI nội viện
const DIURETIC_SLOTS = [0, 1, 2] as const; // qa-allow: index - chỉ số thuốc lợi tiểu trong AKI nội viện

function isInpatientSickDayMed(med: CurrentMed): boolean {
  return (
    isSglt2iMed(med) ||
    isRasiOrArniMed(med) ||
    isDriMed(med) ||
    isKSparingOrSteroidalMraMed(med) ||
    normalizeDrugId(med.drugId) === 'finerenone' ||
    hasMetforminComponent(med)
  );
}

function pickPrimarySickDayMed(heldMeds: CurrentMed[]): CurrentMed | undefined {
  return heldMeds.find((m) => isSglt2iMed(m)) ?? heldMeds[0];
}

export const ckdInpatientAkiRules: Rule[] = [
  // 1. Phân độ Tổn thương thận cấp trên nền mạn (AKI on CKD)
  {
    id: 'ckd.inpatient.aki_staging',
    module: 'ckd',
    nameVi: 'Chẩn đoán và phân độ tổn thương thận cấp trên nền CKD',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => isAkiActive(ctx),
    produce: (ctx) => {
      const currentScr = ctx.normalized.scr;
      const baselineScr = getBaselineScrUmol(ctx);
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const urineRate = (custom?.urineOutputRate as string) || 'normal';

      const scrIncStage1 = thFor('scr', 'ckd.aki.scr_increase_stage1');
      const scrAbsStage3 = thFor('scr', 'ckd.aki.stage3_scr_abs');
      const ratioStage1 = thFor('ratio', 'ckd.aki.scr_ratio_stage1');
      const ratioStage2 = thFor('ratio', 'ckd.aki.scr_ratio_stage2');
      const ratioStage3 = thFor('ratio', 'ckd.aki.scr_ratio_stage3');

      let stage = 1; // qa-allow: index - phân độ KDIGO AKI 1..3
      let stageDesc = `Giai đoạn 1 (Tăng Creatinin >= ${scrIncStage1} µmol/L hoặc >= ${ratioStage1} lần nền, hoặc thiểu niệu 6–12h)`;

      if (currentScr !== undefined && baselineScr !== undefined && baselineScr > 0) {
        const ratio = currentScr / baselineScr;
        const absRise = currentScr - baselineScr;
        const isStage3ByAbs = currentScr >= scrAbsStage3 && absRise >= scrIncStage1;
        if (ratio >= ratioStage3 || isStage3ByAbs || urineRate === 'anuria_12h') {
          stage = 3; // qa-allow: index - phân độ KDIGO AKI 3
          stageDesc = `Giai đoạn 3 (Creatinin tăng >= ${ratioStage3} lần nền hoặc >= ${scrAbsStage3} µmol/L có tăng cấp tính >= ${scrIncStage1} µmol/L, hoặc vô niệu >= 12h)`;
        } else if (ratio >= ratioStage2 || urineRate === 'oliguria_12h') {
          stage = 2; // qa-allow: index - phân độ KDIGO AKI 2
          stageDesc = `Giai đoạn 2 (Creatinin tăng >= ${ratioStage2} lần nền, hoặc thiểu niệu kéo dài >= 12h)`;
        }
      } else if (urineRate === 'anuria_12h') {
        stage = 3; // qa-allow: index - phân độ KDIGO AKI 3
        stageDesc = 'Giai đoạn 3 (Vô niệu hoàn toàn kéo dài >= 12h)';
      } else if (urineRate === 'oliguria_12h') {
        stage = 2; // qa-allow: index - phân độ KDIGO AKI 2
        stageDesc = 'Giai đoạn 2 (Thiểu niệu kéo dài >= 12h)';
      }

      return {
        id: 'rec_ckd_aki_stage_alert',
        module: 'ckd',
        tier: 'Cấp cứu & Tổn thương thận cấp (AKI)',
        tierOrder: 0,
        action: 'MONITOR',
        title: `TỔN THƯƠNG THẬN CẤP TRÊN NỀN MẠN: ${stageDesc}`,
        rationale: `Theo KDIGO 2012 AKI (Bảng 2) và Hướng dẫn Bộ Y tế 2024: Xác định đợt cấp suy thận (AKI trên nền CKD) mức độ ${stage}. Cần nhanh chóng tìm nguyên nhân có thể hồi phục (thiếu dịch thể tích, sốc, nhiễm trùng huyết, tắc nghẽn đường tiểu, thuốc độc thận), theo dõi sát lượng nước tiểu từng giờ và cân bằng dịch-điện giải.`,
        gates: [
          {
            parameter: 'AKI_Stage',
            passed: true,
            value: `Giai đoạn ${stage}`,
            messageVi: `Phân độ KDIGO AKI Giai đoạn ${stage}`,
          },
        ],
        citationIds: ['kdigo.aki.2012.table_2_staging', 'byt.ckd.2024.aki_on_ckd_definition'],
        priority: 100,
      };
    },
    citationIds: ['kdigo.aki.2012.table_2_staging', 'byt.ckd.2024.aki_on_ckd_definition'],
  },

  // 2a. Tạm ngừng thuốc ngày ốm chính khi có AKI nội viện (giữ ruleId rec_ckd_hold_sick_day, nhận diện cả FDC & Aliskiren)
  {
    id: 'ckd.inpatient.hold_sick_day_meds',
    module: 'ckd',
    nameVi: 'Tạm ngừng các thuốc độc thận và nhóm ngày ốm khi có AKI nội viện',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAkiActive(ctx)) return false;
      return ctx.patient.currentMeds.some((m) => isInpatientSickDayMed(m));
    },
    produce: (ctx) => {
      const heldMeds = ctx.patient.currentMeds.filter((m) => isInpatientSickDayMed(m));
      const primaryHeld = pickPrimarySickDayMed(heldMeds)!;
      const primaryName = medDisplayName(primaryHeld);
      const medNames = heldMeds.map((m) => medDisplayName(m)).join(', ');

      return {
        id: 'rec_ckd_hold_sick_day',
        module: 'ckd',
        tier: 'Cảnh báo an toàn nội viện',
        tierOrder: 0,
        action: 'HOLD',
        drugId: normalizeDrugId(primaryHeld.drugId),
        drugNameVi: primaryName,
        dose: undefined,
        title: `TẠM NGỪNG khẩn cấp thuốc ngày ốm: ${medNames}`,
        rationale:
          'Theo KDIGO 2024 (Practice Point 3.7.2 & 4.3.3): Bệnh nhân nội viện có tổn thương thận cấp hoặc huyết động không ổn định bắt buộc phải TẠM NGỪNG ngay thuốc ức chế SGLT2 (nguy cơ toan ceton euglycemic), thuốc ức chế hệ RAS/ARNI/DRI/MRA (tránh tụt lọc cầu thận huyết động và tăng kali), Metformin (nguy cơ toan lactic) — bao gồm cả các viên phối hợp cố định liều (FDC). Tiêu chí dùng lại: Khi bệnh nhân hồi phục huyết động ổn định, ăn uống đủ dịch và chức năng thận trở về gần mức nền.',
        gates: [
          {
            parameter: 'hemodynamics',
            passed: false,
            messageVi: 'Đang có tổn thương thận cấp AKI nội viện: Bắt buộc tạm ngừng nhóm thuốc ngày ốm',
          },
        ],
        citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
        priority: 98,
      };
    },
    citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
  },

  // 2b. Phát lệnh HOLD có drugId độc lập cho từng thuốc ngày ốm đi kèm (nhận diện cả FDC)
  ...SECONDARY_SICK_DAY_SLOTS.map(
    (slotIdx): Rule => ({
      id: `ckd.inpatient.hold_aki_secondary_${slotIdx}`,
      module: 'ckd',
      nameVi: `Tạm ngừng thuốc ngày ốm đi kèm (vị trí ${slotIdx}) trong đợt AKI nội viện`,
      setting: 'inpatient',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        if (!isAkiActive(ctx)) return false;
        const heldMeds = ctx.patient.currentMeds.filter((m) => isInpatientSickDayMed(m));
        const primaryHeld = pickPrimarySickDayMed(heldMeds);
        const secondary = heldMeds.filter((m) => m !== primaryHeld);
        return slotIdx < secondary.length;
      },
      produce: (ctx) => {
        const heldMeds = ctx.patient.currentMeds.filter((m) => isInpatientSickDayMed(m));
        const primaryHeld = pickPrimarySickDayMed(heldMeds);
        const secondary = heldMeds.filter((m) => m !== primaryHeld);
        const targetMed = secondary[slotIdx];
        if (!targetMed) return null;

        const targetId = normalizeDrugId(targetMed.drugId);
        const targetName = medDisplayName(targetMed);
        const isMetformin = hasMetforminComponent(targetMed);
        const isMra =
          isKSparingOrSteroidalMraMed(targetMed) || targetId === 'finerenone';
        const titleText = isMetformin
          ? `TẠM NGỪNG ${targetName} trong đợt cấp AKI (phòng toan lactic)`
          : `TẠM NGỪNG ${targetName} trong đợt cấp AKI`;
        const rationaleText = isMetformin
          ? 'Theo KDIGO 2024 (PP 3.7.2): Bắt buộc tạm ngừng Metformin (và viên phối hợp chứa Metformin) ngay trong đợt tổn thương thận cấp nội viện do nguy cơ tích lũy thuốc gây nhiễm toan lactic nguy kịch. Chỉ dùng lại khi chức năng thận hồi phục ổn định.'
          : isMra
            ? 'Theo KDIGO 2024 (PP 3.7.2): Tạm ngừng thuốc đối kháng thụ thể mineralocorticoid / lợi tiểu giữ kali trong đợt AKI nội viện để ngăn tăng kali máu đe dọa tính mạng. Chỉ dùng lại khi chức năng thận và điện giải hồi phục.'
            : 'Theo KDIGO 2024 (PP 3.7.2 & 3.6.5): Tạm ngừng thuốc ngày ốm (ức chế hệ RAS/ARNI/Aliskiren hoặc SGLT2i, kể cả viên phối hợp cố định liều) trong đợt tổn thương thận cấp để phục hồi áp lực tưới máu cầu thận, tránh tăng kali máu và toan ceton.';

        return {
          id: `rec_ckd_hold_aki_${targetId}`,
          module: 'ckd',
          tier: 'Cảnh báo an toàn nội viện',
          tierOrder: 0,
          action: 'HOLD',
          drugId: targetId,
          drugNameVi: targetName,
          dose: undefined,
          title: titleText,
          rationale: rationaleText,
          gates: [
            {
              parameter: 'AKI',
              passed: false,
              messageVi: `Đợt cấp AKI: Tạm ngừng ${targetName}`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
            'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
          ],
          priority: 97,
        };
      },
      citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
    })
  ),

  // 2c. Rà soát thuốc lợi tiểu quai / thiazide đơn chất hoặc không thuộc FDC đã tạm ngừng trong đợt AKI nội viện
  ...DIURETIC_SLOTS.map(
    (slotIdx): Rule => ({
      id: `ckd.inpatient.aki_diuretic_review_${slotIdx}`,
      module: 'ckd',
      nameVi: `Rà soát lợi tiểu (vị trí ${slotIdx}) trong đợt cấp AKI nội viện`,
      setting: 'inpatient',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        if (!isAkiActive(ctx)) return false;
        const diurMeds = ctx.patient.currentMeds.filter(
          (m) => isLoopOrThiazideDiureticMed(m) && !isInpatientSickDayMed(m)
        );
        return slotIdx < diurMeds.length;
      },
      produce: (ctx) => {
        const diurMeds = ctx.patient.currentMeds.filter(
          (m) => isLoopOrThiazideDiureticMed(m) && !isInpatientSickDayMed(m)
        );
        const diurMed = diurMeds[slotIdx];
        if (!diurMed) return null;

        const targetDiureticId = normalizeDrugId(diurMed.drugId);
        const diurName = medDisplayName(diurMed);
        const sbp = need(ctx, 'sbp');
        const minSbp = thFor('sbp', 'ckd.rasi.sbp_initiate_min');
        const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
        const hasVolumeOverload =
          hasCondition(ctx, 'acutePulmonaryEdema') ||
          Boolean(custom?.refractoryPulmonaryEdema) ||
          Boolean(custom?.congestion) ||
          Boolean(custom?.volumeOverload);
        const isHypotensive = sbp !== undefined && sbp < minSbp;

        if (!hasVolumeOverload || isHypotensive) {
          return {
            id: `rec_ckd_aki_hold_diuretic_${targetDiureticId}`,
            module: 'ckd',
            tier: 'Cảnh báo an toàn nội viện',
            tierOrder: 0,
            action: 'HOLD',
            drugId: targetDiureticId,
            drugNameVi: diurName,
            dose: undefined,
            title: `TẠM NGỪNG ${diurName} trong đợt AKI chưa có quá tải thể tích / tụt huyết áp`,
            rationale:
              `Theo KDIGO 2012 AKI (Khuyến cáo 3.4.1 & 3.4.2) và KDIGO 2024 (PP 3.7.2): Không sử dụng thuốc lợi tiểu để dự phòng hay điều trị AKI khi không có quá tải thể tích tuần hoàn${isHypotensive ? ` (đặc biệt khi SBP < ${minSbp} mmHg)` : ''}, vì lợi tiểu làm nặng thêm giảm thể tích lòng mạch và giảm tưới máu thận (đặc biệt khi phối hợp RASi/NSAID - Triple Whammy). Chỉ cân nhắc dùng lại nếu xuất hiện sung huyết phổi hoặc quá tải dịch rõ.`,
            gates: [
              {
                parameter: 'AKI_Volume',
                passed: false,
                messageVi: `AKI không kèm quá tải dịch / huyết áp thấp: Tạm ngừng ${diurName}`,
              },
            ],
            citationIds: [
              'kdigo.aki.2012.rec_3_4_diuretics_volume_overload',
              'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
            ],
            priority: 96,
          };
        }

        return {
          id: `rec_ckd_aki_monitor_diuretic_${targetDiureticId}`,
          module: 'ckd',
          tier: 'Cảnh báo an toàn nội viện',
          tierOrder: 1,
          action: 'MONITOR',
          drugId: targetDiureticId,
          drugNameVi: diurName,
          title: `Theo dõi sát thể tích & điện giải khi duy trì ${diurName} kiểm soát quá tải dịch trong AKI`,
          rationale:
            'Theo KDIGO 2012 AKI (Khuyến cáo 3.4.2): Thuốc lợi tiểu quai chỉ được phép sử dụng trong AKI nhằm mục đích kiểm soát quá tải thể tích tuần hoàn / phù phổi cấp, không làm cải thiện tiên lượng phục hồi thận; nếu thiểu/vô niệu kháng lợi tiểu cần chuyển siêu lọc / lọc máu cấp cứu sớm.',
          gates: [
            {
              parameter: 'AKI_Volume',
              passed: true,
              messageVi: 'Có quá tải thể tích tuần hoàn: Chỉ dùng lợi tiểu kiểm soát sung huyết và theo dõi đáp ứng nước tiểu',
            },
          ],
          citationIds: ['kdigo.aki.2012.rec_3_4_diuretics_volume_overload'],
          priority: 82,
        };
      },
      citationIds: ['kdigo.aki.2012.rec_3_4_diuretics_volume_overload'],
    })
  ),
];
