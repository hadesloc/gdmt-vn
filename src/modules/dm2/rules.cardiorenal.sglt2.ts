/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Trụ cột SGLT2i Bảo vệ Tim–Thận (Độc lập HbA1c)
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { missingInputRec } from '../../engine/require';
import { dose, fmtDose, hasDrug, thFor } from '../../kb-types/access';
import {
  SGLT2_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  formatActiveMedDose,
  getEffectiveEgfr,
  getFdcBlockedCompanionReason,
  hasActiveFootUlcer,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasDrugAllergy,
  hasHepaticImpairment,
  hasHf,
  isOvertreatedFrailDeferral,
  isPregnant,
  isTakingCanonical,
  pickFirstNonAllergicCandidate,
  resolveDrugNameVi,
  resolveElderlyStatus
} from './helpers';
import { checkSglt2BlockingGate } from './rules.cardiorenal.sglt2_gates';

export const dm2CardiorenalSglt2Rules: Rule[] = [
  {
    id: 'dm2.outpatient.cardiorenal_sglt2i',
    module: 'dm2',
    nameVi: 'Chỉ định ức chế SGLT2 bảo vệ tim – thận độc lập với mức HbA1c',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isCrisis || crisis.isIsolatedKetonemia) return false;
      const hasHepaticStopTarget =
        hasHepaticImpairment(ctx) &&
        SGLT2_IDS.some((id) => isTakingCanonical(ctx, id) && !hasDrugAllergy(ctx, id));
      return hasHf(ctx) || hasCkd(ctx) || hasAscvd(ctx) || hasHepaticStopTarget;
    },
    produce: (ctx) => {
      const activeSglt2Id = SGLT2_IDS.find((id) => isTakingCanonical(ctx, id) && !hasDrugAllergy(ctx, id));
      const activeSglt2Med = activeSglt2Id ? findActiveMedByCanonical(ctx, activeSglt2Id) : undefined;
      const chosenSglt2 = pickFirstNonAllergicCandidate(ctx, ['dapagliflozin', 'empagliflozin']);
      const fdcBlockedReason = activeSglt2Id
        ? getFdcBlockedCompanionReason(ctx, activeSglt2Med, activeSglt2Id)
        : undefined;

      const gateResult = checkSglt2BlockingGate(
        ctx,
        activeSglt2Id,
        activeSglt2Med,
        chosenSglt2,
        fdcBlockedReason
      );
      if (gateResult === 'SKIP') return null;
      if (gateResult) return gateResult;

      const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
      const egfr = getEffectiveEgfr(ctx);
      const footRisk = hasActiveFootUlcer(ctx);
      const footWarning =
        'Bệnh nhân có loét bàn chân ĐTĐ hoạt động / nguy cơ cắt cụt chi: TRÁNH TUYỆT ĐỐI Canagliflozin; khám mạch máu ngoại biên, chăm sóc ổ loét tích cực và theo dõi sát chi dưới!';

      if (egfr === undefined) {
        if (activeSglt2Id && !fdcBlockedReason && !(footRisk && activeSglt2Id === 'canagliflozin')) {
          const medName = resolveDrugNameVi(activeSglt2Id, activeSglt2Med);
          return {
            id: 'rec_dm2_sglt2i_cardiorenal',
            module: 'dm2',
            tier: 'Bảo vệ tim – thận nền tảng',
            tierOrder: 2,
            action: 'CONTINUE',
            drugId: activeSglt2Id,
            drugNameVi: medName,
            dose: formatActiveMedDose(activeSglt2Med, activeSglt2Id) || fmtDose(dose(activeSglt2Id, 'target')),
            title: `Tiếp tục ${medName} bảo vệ tim – thận (Cần kiểm tra eGFR)`,
            rationale: 'Bệnh nhân đang dùng SGLT2i; cần bổ sung xét nghiệm eGFR để đánh giá an toàn chức năng thận định kỳ.',
            gates: [],
            warnings: footRisk ? [footWarning] : undefined,
            citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.rec_9_7_ascvd'],
            benefitsAlso: ['ckd', 'hf'],
            priority: 95
          };
        }
        return missingInputRec('dm2', 'egfr', 'đánh giá chỉ định và an toàn chức năng thận cho thuốc ức chế SGLT2', ['ada.dm2.2026.rec_9_8_hf']);
      }

      if (activeSglt2Id) {
        if (footRisk && activeSglt2Id === 'canagliflozin') {
          return null;
        }

        if (fdcBlockedReason) {
          if (footRisk || !chosenSglt2) return null;
          const standaloneId =
            hasDrug(activeSglt2Id) && !hasDrugAllergy(ctx, activeSglt2Id) && activeSglt2Id !== 'ertugliflozin'
              ? activeSglt2Id
              : chosenSglt2;
          const standaloneName = resolveDrugNameVi(standaloneId);
          const fdcName = resolveDrugNameVi(activeSglt2Id, activeSglt2Med);
          const continuingBelowFloor = standaloneId === activeSglt2Id && egfr < minEgfr;
          return {
            id: 'rec_dm2_sglt2i_cardiorenal',
            module: 'dm2',
            tier: 'Bảo vệ tim – thận nền tảng',
            tierOrder: 2,
            action: continuingBelowFloor ? 'SWITCH' : 'START',
            switchFrom: continuingBelowFloor ? activeSglt2Med?.drugId : undefined,
            drugId: standaloneId,
            drugNameVi: standaloneName,
            dose: fmtDose(dose(standaloneId, 'start')),
            title: `Chuyển sang ${standaloneName} đơn chất bảo vệ tim – thận (Tách khỏi viên phối hợp ${fdcName})`,
            rationale:
              `ADA 2026 Ch. 9–11: Viên phối hợp ${fdcName} bắt buộc ngừng do ${fdcBlockedReason}. Tuy nhiên người bệnh đang dung nạp thành phần SGLT2i nên cần kê riêng viên đơn chất ${standaloneName} để duy trì liên tục lợi ích bảo vệ tim – thận cho tới khi lọc máu.`,
            gates: [
              {
                parameter: 'eGFR',
                passed: true,
                value: egfr,
                threshold: minEgfr,
                messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m²: Duy trì thành phần SGLT2i ở dạng viên đơn chất`
              }
            ],
            citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.sglt2_stop_kidney_failure'],
            benefitsAlso: ['ckd', 'hf'],
            priority: 95
          };
        }

        const medName = resolveDrugNameVi(activeSglt2Id, activeSglt2Med);
        const recentHypoWarn = Boolean(ctx.patient.customInputs?.recentHypo)
          ? ['Bệnh nhân có tiền sử hạ đường huyết gần đây: Cần đồng thời ngừng/giảm liều Sulfonylurea hoặc Insulin nền khi duy trì SGLT2i.']
          : [];
        const allWarnings = [...(footRisk ? [footWarning] : []), ...recentHypoWarn];

        return {
          id: 'rec_dm2_sglt2i_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'CONTINUE',
          drugId: activeSglt2Id,
          drugNameVi: medName,
          dose: formatActiveMedDose(activeSglt2Med, activeSglt2Id) || fmtDose(dose(activeSglt2Id, 'target')),
          title: `Tiếp tục ${medName} bảo vệ tim – thận`,
          rationale:
            egfr < minEgfr
              ? `ADA 2026 Ch. 11 (Khuyến cáo 11.11a): Dù eGFR hiện giảm còn ${egfr.toFixed(0)} mL/phút/1.73m², người bệnh đã dung nạp ${medName} vẫn được tiếp tục duy trì để bảo vệ tim–thận cho tới khi lọc máu.`
              : `ADA 2026 Ch. 9–11 & ESC 2023 (Class I): Tiếp tục duy trì ${medName} nhằm giảm nhập viện suy tim, biến cố tim mạch và làm chậm tiến triển bệnh thận mạn (độc lập mức HbA1c).`,
          gates: [
            {
              parameter: 'eGFR',
              passed: true,
              value: egfr,
              threshold: minEgfr,
              messageVi:
                egfr >= minEgfr
                  ? `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² đạt ngưỡng an toàn`
                  : `eGFR ${egfr.toFixed(0)} mL/phút/1.73m²: Được phép tiếp tục duy trì đến khi lọc máu`
            }
          ],
          warnings: allWarnings.length > 0 ? allWarnings : undefined, // qa-allow: index - Kiểm tra mảng cảnh báo không rỗng
          citationIds: footRisk
            ? ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.sglt2_stop_kidney_failure', 'ada.dm2.2026.sglt2i_foot_ulcer_caution']
            : ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.rec_9_7_ascvd', 'ada.dm2.2026.sglt2_stop_kidney_failure'],
          benefitsAlso: ['ckd', 'hf'],
          priority: 95
        };
      }

      const targetSglt2 = chosenSglt2!;
      const chosenName = resolveDrugNameVi(targetSglt2);

      if (egfr < minEgfr) {
        return {
          id: 'rec_dm2_sglt2i_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'AVOID',
          drugId: targetSglt2,
          drugNameVi: chosenName,
          title: `Không khởi trị mới ${chosenName} (eGFR dưới ${minEgfr} mL/phút/1.73m²)`,
          rationale:
            `ADA 2026 Ch. 11 & KDIGO: Không khuyến cáo khởi trị mới thuốc ức chế SGLT2 khi eGFR dưới ${minEgfr} mL/phút/1.73m².`,
          gates: [{ parameter: 'eGFR', passed: false, value: egfr, threshold: minEgfr, messageVi: `eGFR ${egfr.toFixed(0)} dưới ${minEgfr}: Dưới ngưỡng khởi trị mới` }],
          citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.sglt2_stop_kidney_failure'],
          benefitsAlso: ['ckd', 'hf'],
          priority: 92
        };
      }

      if (footRisk) {
        return {
          id: 'rec_dm2_sglt2i_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'HOLD',
          drugId: targetSglt2,
          drugNameVi: chosenName,
          title: 'Tạm hoãn khởi trị mới SGLT2i do Loét bàn chân ĐTĐ hoạt động / Nguy cơ cắt cụt chi',
          rationale:
            'ADA 2026 Ch. 9 & Ch. 12: Ở bệnh nhân có loét bàn chân ĐTĐ tiến triển, nhiễm trùng cấp hoặc thiếu máu chi nặng, tránh tuyệt đối Canagliflozin và tạm hoãn khởi trị SGLT2i (ưu tiên GLP-1 RA bảo vệ tim mạch như Semaglutide) cho đến khi kiểm soát ổ loét và mạch máu chi dưới ổn định.',
          gates: [{ parameter: 'activeFootUlcer', passed: false, threshold: 1, messageVi: 'Loét bàn chân hoạt động: Tạm hoãn SGLT2i, tránh Canagliflozin' }],
          warnings: [footWarning],
          citationIds: ['ada.dm2.2026.sglt2i_foot_ulcer_caution', 'ada.dm2.2026.foot_exam_annual'],
          priority: 96
        };
      }

      if (resolveElderlyStatus(ctx) === 'very_complex' && !hasHf(ctx)) {
        return {
          id: 'rec_dm2_sglt2i_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'DEFER',
          drugId: targetSglt2,
          drugNameVi: chosenName,
          title: `Cân nhắc trì hoãn khởi mới ${chosenName} ở người cao tuổi sức khỏe rất kém / suy kiệt`,
          rationale:
            'ADA 2026 Ch. 13: Ở người cao tuổi sức khỏe rất phức tạp hoặc kỳ vọng sống hạn chế không kèm suy tim sung huyết, ưu tiên đơn giản hóa phác đồ và tránh mất dịch, hạ huyết áp tư thế hoặc nhiễm nấm sinh dục.',
          gates: [],
          citationIds: ['ada.dm2.2026.older_very_complex_goal', 'ada.dm2.2026.older_deintensification'],
          priority: 82
        };
      }

      const recentHypoWarning =
        Boolean(ctx.patient.customInputs?.recentHypo) || isOvertreatedFrailDeferral(ctx)
          ? ['Bệnh nhân có nguy cơ hạ đường huyết: Cần đồng thời ngừng/giảm liều Sulfonylurea hoặc Insulin nền khi bổ sung SGLT2i.']
          : undefined;

      return {
        id: 'rec_dm2_sglt2i_cardiorenal',
        module: 'dm2',
        tier: 'Bảo vệ tim – thận nền tảng',
        tierOrder: 2,
        action: 'START',
        drugId: targetSglt2,
        drugNameVi: chosenName,
        dose: fmtDose(dose(targetSglt2, 'start')),
        title: `Khởi trị ${chosenName} bảo vệ tim – thận`,
        rationale:
          'Khuyến cáo mức 1A (ADA 2026 Ch. 9–11 & ESC 2023 Class I) cho bệnh nhân ĐTĐ típ 2 có suy tim, bệnh thận mạn hoặc ASCVD nhằm giảm tử vong tim mạch, nhập viện suy tim và làm chậm tiến triển suy thận, độc lập với mức HbA1c.',
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: minEgfr,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² đạt ngưỡng khởi trị an toàn (từ ${minEgfr} trở lên)`
          }
        ],
        warnings: recentHypoWarning,
        citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.rec_9_7_ascvd', 'esc.dm2.2023.ascvd_sglt2_glp1_class1'],
        benefitsAlso: ['ckd', 'hf'],
        priority: 95,
        profileDiff: {
          INTL: 'ADA 2026: Ưu tiên khởi đầu SGLT2i ngay từ đầu bất kể HbA1c và bất kể có dùng Metformin hay chưa.',
          VN: 'BYT 5481/2020: Ưu tiên phối hợp SGLT2i sớm cho bệnh nhân ĐTĐ típ 2 có suy tim, bệnh thận mạn hoặc bệnh tim mạch xơ vữa.',
          US: 'ADA Standards of Care 2026 & FDA: Ưu tiên khởi đầu SGLT2i độc lập HbA1c và Metformin cho suy tim, CKD và ASCVD.'
        }
      };
    },
    citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.rec_9_7_ascvd', 'esc.dm2.2023.ascvd_sglt2_glp1_class1']
  }
];
