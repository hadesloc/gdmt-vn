/**
 * GDMT-VN CKD Module - Outpatient NSAID Safety & Sick-Day Education Rules
 * Phân quyền: Agent E (Round 4 Remediation & < 20 KB Modularization)
 * Bao phủ: CKD-R4-R1-06 (cổng xác nhận CKD trước giáo dục ngày ốm), CKD-R4-R2-01 (FDC NSAID), CKD-R4-R2-08
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  getDrugSafe,
  getMedComponents,
  hasCkdFlag,
  hasConfirmedCkdEvidence,
  hasMetforminComponent,
  isAkiActive,
  isLoopOrThiazideDiureticMed,
  isNsaidMed,
  isOutpatientAcuteCrisis,
  isRasiOrArniMed,
  isSglt2iMed,
  medDisplayName,
  normalizeDrugId,
  NSAID_FALLBACK_IDS,
} from './helpers';

export const ckdOutpatientNsaidSickdayRules: Rule[] = [
  // 1. Chống chỉ định & Tránh NSAID ở bệnh nhân CKD
  {
    id: 'ckd.outpatient.avoid_nsaids',
    module: 'ckd',
    nameVi: 'Tránh và ngừng các thuốc giảm đau chống viêm không steroid (NSAID)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      return (
        ctx.patient.currentMeds.some((m) => isNsaidMed(m)) ||
        Boolean(custom?.takingNsaid)
      );
    },
    produce: (ctx) => {
      const nsaidMed = ctx.patient.currentMeds.find((m) => isNsaidMed(m));
      const egfr = need(ctx, 'egfr');
      const nsaidContraEgfr = thFor('egfr', 'ckd.nsaid.egfr_contra');

      const hasRasiOrArni = ctx.patient.currentMeds.some((m) => isRasiOrArniMed(m));
      const hasDiuretic = ctx.patient.currentMeds.some((m) => isLoopOrThiazideDiureticMed(m));
      const isTripleWhammy = hasRasiOrArni && hasDiuretic;
      const isAki = isAkiActive(ctx);
      const isHardStop =
        hasCkdFlag(ctx, 'onDialysis') ||
        (egfr !== undefined && egfr < nsaidContraEgfr) ||
        isTripleWhammy ||
        isAki;
      const nsaidName = nsaidMed ? medDisplayName(nsaidMed) : 'Thuốc chống viêm NSAID đang dùng';
      const targetDrugId = nsaidMed ? normalizeDrugId(nsaidMed.drugId) : undefined;

      if (isHardStop) {
        const stopReasonText = isAki
          ? 'đang có tổn thương thận cấp (AKI)'
          : isTripleWhammy
            ? 'đang phối hợp bộ ba độc thận (RASi/ARNI + Lợi tiểu + NSAID - Triple Whammy)'
            : `suy thận nặng (eGFR < ${nsaidContraEgfr} mL/phút/1.73m²)`;

        return {
          id: 'rec_ckd_stop_nsaid',
          module: 'ckd',
          tier: 'Cảnh báo an toàn thuốc',
          tierOrder: 0,
          action: 'STOP',
          drugId: targetDrugId,
          drugNameVi: targetDrugId ? nsaidName : undefined,
          dose: undefined,
          title: `NGỪNG ngay ${nsaidName} (${stopReasonText})`,
          rationale: `Theo KDIGO 2024 (Chương 4, tr. 132) và Hướng dẫn BYT 2024 (tr. 53): Bệnh nhân ${stopReasonText} chống chỉ định dùng NSAID (mức lọc cầu thận < ${nsaidContraEgfr} mL/phút/1.73m² hoặc bộ ba độc thận/AKI) do ức chế tổng hợp prostaglandin giãn mạch tại thận, gây co thắt tiểu động mạch đến, hoại tử ống thận cấp và tăng kali máu nguy hiểm.`,
          gates: [
            {
              parameter: 'nsaid_toxicity',
              passed: false,
              value: egfr,
              threshold: nsaidContraEgfr,
              messageVi: `Chống chỉ định NSAID (${stopReasonText}): Bắt buộc ngừng ngay`,
            },
          ],
          citationIds: [
            'byt.ckd.2024.nsaid_contra_egfr_30',
            'kdigo.ckd.2024.nsaid_nephrotoxicity_p132',
          ],
          priority: 105,
        };
      }

      return {
        id: 'rec_ckd_avoid_nsaid',
        module: 'ckd',
        tier: 'Cảnh báo an toàn thuốc',
        tierOrder: 0,
        action: 'AVOID',
        drugId: targetDrugId,
        drugNameVi: targetDrugId ? nsaidName : undefined,
        dose: undefined,
        title: `TRÁNH DÙNG ${nsaidName} kéo dài/tự ý; ưu tiên Paracetamol thay thế`,
        rationale: `Theo KDIGO 2024 (Chương 4, tr. 132) và BYT 2024 (tr. 53): Ở bệnh nhân CKD có eGFR ≥ ${nsaidContraEgfr} mL/phút/1.73m², cần TRÁNH sử dụng NSAID tự ý hoặc kéo dài do nguy cơ đẩy nhanh suy giảm chức năng thận và gây tổn thương thận cấp. Nếu bắt buộc phải dùng ngắn hạn, chỉ dùng liều thấp nhất có hiệu quả trong thời gian ngắn nhất dưới giám sát chức năng thận, hoặc chuyển sang giảm đau an toàn hơn như Paracetamol.`,
        gates: [
          {
            parameter: 'nsaid_caution',
            passed: false,
            value: egfr,
            threshold: nsaidContraEgfr,
            messageVi: `eGFR ≥ ${nsaidContraEgfr} mL/phút/1.73m²: Tránh dùng NSAID kéo dài/không giám sát trên nền CKD`,
          },
        ],
        citationIds: [
          'kdigo.ckd.2024.nsaid_nephrotoxicity_p132',
          'byt.ckd.2024.nsaid_contra_egfr_30',
        ],
        priority: 85,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.nsaid_nephrotoxicity_p132',
      'byt.ckd.2024.nsaid_contra_egfr_30',
    ],
  },

  // 2. Phát cảnh báo riêng cho các NSAID thứ 2+ nếu bệnh nhân dùng nhiều NSAID (kể cả viên phối hợp FDC) cùng lúc
  ...Array.from(NSAID_FALLBACK_IDS).map(
    (extraNsaidId): Rule => ({
      id: `ckd.outpatient.avoid_nsaid_extra_${extraNsaidId}`,
      module: 'ckd',
      nameVi: `Ngừng hoặc tránh dùng ${extraNsaidId} trùng lặp trên nền CKD`,
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        const nsaidMeds = ctx.patient.currentMeds.filter((m) => isNsaidMed(m));
        if (nsaidMeds.length <= 1) return false; // qa-allow: index - kiểm tra đa thuốc NSAID từ thuốc thứ 2 trở đi
        const firstComp =
          getMedComponents(nsaidMeds[0]).find(
            (id) => NSAID_FALLBACK_IDS.has(id) || getDrugSafe(id)?.class === 'NSAID'
          ) ?? normalizeDrugId(nsaidMeds[0].drugId);
        return (
          firstComp !== extraNsaidId &&
          nsaidMeds.some(
            (m) =>
              normalizeDrugId(m.drugId) === extraNsaidId ||
              getMedComponents(m).includes(extraNsaidId)
          )
        );
      },
      produce: (ctx) => {
        const targetMed = ctx.patient.currentMeds.find(
          (m) =>
            normalizeDrugId(m.drugId) === extraNsaidId ||
            getMedComponents(m).includes(extraNsaidId)
        )!;
        const nsaidName = medDisplayName(targetMed);
        const egfr = need(ctx, 'egfr');
        const nsaidContraEgfr = thFor('egfr', 'ckd.nsaid.egfr_contra');
        const isTripleWhammy =
          ctx.patient.currentMeds.some((m) => isRasiOrArniMed(m)) &&
          ctx.patient.currentMeds.some((m) => isLoopOrThiazideDiureticMed(m));
        const isHardStop =
          hasCkdFlag(ctx, 'onDialysis') ||
          (egfr !== undefined && egfr < nsaidContraEgfr) ||
          isTripleWhammy ||
          isAkiActive(ctx);
        const titleText = isHardStop
          ? `NGỪNG ngay ${nsaidName} (Phối hợp đa NSAID / nguy cơ độc thận cao)`
          : `NGỪNG / TRÁNH phối hợp trùng lặp ${nsaidName} trên nền CKD`;

        return {
          id: `rec_ckd_${isHardStop ? 'stop' : 'avoid'}_nsaid_${extraNsaidId}`,
          module: 'ckd',
          tier: 'Cảnh báo an toàn thuốc',
          tierOrder: 0,
          action: isHardStop ? 'STOP' : 'AVOID',
          drugId: normalizeDrugId(targetMed.drugId),
          drugNameVi: nsaidName,
          dose: undefined,
          title: titleText,
          rationale:
            'Bệnh nhân đang dùng đồng thời nhiều thuốc NSAID trên nền bệnh thận mạn, làm cộng hưởng nguy cơ co mạch thận cấp tính, hoại tử ống thận và xuất huyết tiêu hóa.',
          gates: [
            {
              parameter: 'nsaid_duplicate',
              passed: false,
              messageVi: `Đang dùng trùng lặp NSAID (${nsaidName}): Ngừng ngay`,
            },
          ],
          citationIds: [
            'byt.ckd.2024.nsaid_contra_egfr_30',
            'kdigo.ckd.2024.nsaid_nephrotoxicity_p132',
          ],
          priority: isHardStop ? 105 : 90,
        };
      },
      citationIds: [
        'byt.ckd.2024.nsaid_contra_egfr_30',
        'kdigo.ckd.2024.nsaid_nephrotoxicity_p132',
      ],
    })
  ),

  // 3. Hướng dẫn quy tắc ngày ốm (Sick-day rule — chỉ phát khi có bằng chứng CKD thực sự, CKD-R4-R1-06)
  {
    id: 'ckd.outpatient.sick_day_education',
    module: 'ckd',
    nameVi: 'Hướng dẫn quy tắc ngày ốm (Sick-day rules) cho bệnh nhân CKD',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      hasConfirmedCkdEvidence(ctx) && !isAkiActive(ctx) && !isOutpatientAcuteCrisis(ctx),
    produce: (ctx) => {
      const hasSadmanActive = ctx.patient.currentMeds.some(
        (m) =>
          isSglt2iMed(m) ||
          isRasiOrArniMed(m) ||
          isLoopOrThiazideDiureticMed(m) ||
          hasMetforminComponent(m) ||
          isNsaidMed(m) ||
          normalizeDrugId(m.drugId) === 'finerenone'
      );
      return {
        id: 'rec_ckd_sick_day_plan',
        module: 'ckd',
        tier: 'Giáo dục sức khỏe & Ngày ốm',
        tierOrder: 4,
        action: 'MONITOR',
        title: 'Kế hoạch xử trí ngày ốm (Tạm ngừng thuốc mất nước)',
        rationale: hasSadmanActive
          ? 'Theo KDIGO 2024 (Practice Point 3.7.2 & 4.3.3): Hướng dẫn bệnh nhân chủ động tạm ngừng các thuốc nhóm SADMAN đang dùng (SGLT2i, ACEi/ARB/ARNI, Lợi tiểu, Metformin, NSAIDs, Finerenone) khi có bệnh lý cấp tính kèm mất nước (sốt cao, nôn mửa, tiêu chảy cấp, nhịn ăn trước thủ thuật) để phòng ngừa tụt huyết áp, tổn thương thận cấp (AKI) và toan ceton/toan lactic. Dùng lại khi đã ăn uống bình thường và đủ dịch.'
          : 'Theo KDIGO 2024 (Practice Point 3.7.2 & 4.3.3): Khi kê đơn các thuốc bảo vệ tim-thận nhóm SADMAN (SGLT2i, ACEi/ARB, Lợi tiểu, Metformin, Finerenone), cần tư vấn trước quy tắc ngày ốm: tạm ngừng thuốc nếu xuất hiện sốt cao, nôn ói, tiêu chảy cấp hoặc nhịn ăn kéo dài gây mất nước, và tuyệt đối tránh tự ý dùng thuốc giảm đau NSAID.',
        gates: [],
        citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
        priority: 60,
      };
    },
    citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold'],
  },
];
