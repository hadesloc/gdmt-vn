/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Trụ cột Đồng vận GLP-1 / GIP-GLP-1 RA (ASCVD, CKD, HFpEF Béo phì)
 * Phân quyền: Agent F4
 */

import type { Rule } from '../../engine/types';
import { missingInputRec } from '../../engine/require';
import { dose, fmtDose, hasDrug, thFor } from '../../kb-types/access';
import {
  INCRETIN_RA_IDS,
  evaluateHyperglycemicCrisis,
  findActiveMedByCanonical,
  formatActiveMedDose,
  getEffectiveEgfr,
  getFdcBlockedCompanionReason,
  hasAscvd,
  hasCkd,
  hasDm2Context,
  hasDrugAllergy,
  hasObesityOrOverweight,
  isHfpefPhenotype,
  isOnDialysis,
  isOvertreatedFrailDeferral,
  isPregnant,
  isTakingCanonical,
  pickFirstNonAllergicCandidate,
  resolveDrugNameVi,
  resolveElderlyStatus
} from './helpers';
import {
  buildGlp1ExtraWarningsAndCits,
  checkGlp1BlockingGate
} from './rules.cardiorenal.glp1_gates';

export const dm2CardiorenalGlp1Rules: Rule[] = [
  {
    id: 'dm2.outpatient.cardiorenal_glp1',
    module: 'dm2',
    nameVi: 'Chỉ định đồng vận thụ thể GLP-1 / GIP-GLP-1 RA trên ASCVD, CKD, HFpEF béo phì hoặc thừa cân',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      if (crisis.isCrisis || crisis.isIsolatedKetonemia) return false;
      return (
        hasAscvd(ctx) ||
        hasCkd(ctx) ||
        hasObesityOrOverweight(ctx) ||
        (isHfpefPhenotype(ctx) && hasObesityOrOverweight(ctx))
      );
    },
    produce: (ctx) => {
      const activeGlp1Id = INCRETIN_RA_IDS.find((id) => isTakingCanonical(ctx, id) && !hasDrugAllergy(ctx, id));
      const activeGlp1Med = activeGlp1Id ? findActiveMedByCanonical(ctx, activeGlp1Id) : undefined;
      const chosenGlp1 = pickFirstNonAllergicCandidate(ctx, [
        'semaglutide',
        'tirzepatide',
        'dulaglutide',
        'liraglutide'
      ]);

      const gateResult = checkGlp1BlockingGate(ctx, activeGlp1Id, activeGlp1Med, chosenGlp1);
      if (gateResult === 'SKIP') return null;
      if (gateResult) return gateResult;

      const egfrMin = thFor('egfr', 'dm2.glp1.egfr_min');
      const egfr = getEffectiveEgfr(ctx);
      const fdcBlockedReason = activeGlp1Id
        ? getFdcBlockedCompanionReason(ctx, activeGlp1Med, activeGlp1Id)
        : undefined;
      const isExendinRenalBlocked =
        (activeGlp1Id === 'lixisenatide' || activeGlp1Id === 'exenatide') &&
        (isOnDialysis(ctx) || (egfr !== undefined && egfr <= thFor('egfr', 'dm2.metformin.egfr_contra')));

      if (egfr === undefined) {
        if (activeGlp1Id && !fdcBlockedReason && !isExendinRenalBlocked && hasDrug(activeGlp1Id)) {
          const medName = resolveDrugNameVi(activeGlp1Id, activeGlp1Med);
          const { warnings, extraCits } = buildGlp1ExtraWarningsAndCits(ctx, activeGlp1Id);
          return {
            id: 'rec_dm2_glp1_cardiorenal',
            module: 'dm2',
            tier: 'Bảo vệ tim – thận nền tảng',
            tierOrder: 2,
            action: 'CONTINUE',
            drugId: activeGlp1Id,
            drugNameVi: medName,
            dose: formatActiveMedDose(activeGlp1Med, activeGlp1Id) || fmtDose(dose(activeGlp1Id, 'target')),
            title: `Tiếp tục ${medName} bảo vệ tim mạch – chuyển hóa (Cần kiểm tra eGFR)`,
            rationale: 'Bệnh nhân đang sử dụng GLP-1 RA; cần bổ sung xét nghiệm eGFR để đánh giá mức lọc cầu thận và theo dõi tình trạng dịch.',
            gates: [],
            warnings: warnings.length > 0 ? warnings : undefined, // qa-allow: index - Kiểm tra mảng cảnh báo không rỗng
            citationIds: ['ada.dm2.2026.rec_9_7_ascvd', 'ada.dm2.2026.glp1_ckd_no_dose_adjust', ...extraCits],
            priority: 92
          };
        }
        return missingInputRec(
          'dm2',
          'egfr',
          `đánh giá cổng an toàn thận (eGFR từ ${egfrMin} mL/phút/1.73m² trở lên) trước khi khởi trị đồng vận GLP-1 RA`,
          ['ada.dm2.2026.glp1_ckd_no_dose_adjust', 'kdigo.dm2.2022.semaglutide_sc_dosing']
        );
      }

      if (activeGlp1Id && !isExendinRenalBlocked && !fdcBlockedReason) {
        const medName = resolveDrugNameVi(activeGlp1Id, activeGlp1Med);
        const { warnings, extraCits } = buildGlp1ExtraWarningsAndCits(ctx, activeGlp1Id);
        const fallbackDose = hasDrug(activeGlp1Id) ? fmtDose(dose(activeGlp1Id, 'target')) : 'Theo liều hiện dùng';
        return {
          id: 'rec_dm2_glp1_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'CONTINUE',
          drugId: activeGlp1Id,
          drugNameVi: medName,
          dose: formatActiveMedDose(activeGlp1Med, activeGlp1Id) || fallbackDose,
          title: `Tiếp tục ${medName} bảo vệ tim mạch – thận`,
          rationale:
            `ADA 2026 Ch. 9–11 & ESC 2023 (Class I): Tiếp tục duy trì ${medName} theo liều hiện tại của người bệnh; nếu dung nạp tiêu hóa tốt và cần tối ưu thêm đường huyết/cân nặng/bảo vệ tim–thận, chuẩn độ tăng bậc theo nhãn thuốc tới liều duy trì đích.`,
          gates: [
            {
              parameter: 'eGFR',
              passed: egfr >= egfrMin,
              value: egfr,
              threshold: egfrMin,
              messageVi:
                egfr >= egfrMin
                  ? `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² đạt ngưỡng an toàn thận`
                  : `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² thấp: Theo dõi sát dung nạp tiêu hóa và tình trạng dịch`
            }
          ],
          warnings: warnings.length > 0 ? warnings : undefined, // qa-allow: index - Kiểm tra mảng cảnh báo không rỗng
          citationIds: [
            'ada.dm2.2026.rec_9_7_ascvd',
            'ada.dm2.2026.glp1_ckd_no_dose_adjust',
            'esc.dm2.2023.ascvd_sglt2_glp1_class1',
            ...extraCits
          ],
          benefitsAlso: ['ckd'],
          priority: 92
        };
      }

      const targetGlp1 = chosenGlp1!;
      const chosenName = resolveDrugNameVi(targetGlp1);

      if (isOnDialysis(ctx) || egfr < egfrMin) {
        return {
          id: 'rec_dm2_glp1_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'AVOID',
          drugId: targetGlp1,
          drugNameVi: chosenName,
          title: isOnDialysis(ctx)
            ? `Tránh khởi trị thường quy ${chosenName} trên bệnh nhân lọc máu khi chưa hội chẩn chuyên khoa`
            : `Tránh khởi trị mới ${chosenName} khi suy thận giai đoạn 5 (eGFR dưới ${egfrMin} mL/phút/1.73m²)`,
          rationale:
            `KDIGO 2022 giới hạn ngưỡng khởi trị thường quy từ eGFR ${egfrMin} mL/phút/1.73m² trở lên do nguy cơ nôn/tiêu chảy gây mất dịch cấp. Lưu ý cập nhật ADA 2026 (Khuyến cáo 11.11b): Bác sĩ chuyên khoa Nội tiết – Thận có thể cân nhắc cá thể hóa GLP-1 RA người ở suy thận giai đoạn cuối / lọc máu dưới giám sát sát dung nạp tiêu hóa.`,
          gates: [
            {
              parameter: 'eGFR',
              passed: false,
              value: egfr,
              threshold: egfrMin,
              messageVi: `eGFR dưới ${egfrMin} / Lọc máu: Không khuyến cáo khởi trị thường quy ở CKD giai đoạn 5`
            }
          ],
          citationIds: ['kdigo.dm2.2022.semaglutide_sc_dosing', 'ada.dm2.2026.glp1_dialysis_rec_11_11b'],
          priority: 92
        };
      }

      const isHfpefObese = isHfpefPhenotype(ctx) && hasObesityOrOverweight(ctx);

      const isOvertreatedFrail = isOvertreatedFrailDeferral(ctx);
      if (isOvertreatedFrail || (resolveElderlyStatus(ctx) === 'very_complex' && !isHfpefObese)) {
        return {
          id: 'rec_dm2_glp1_cardiorenal',
          module: 'dm2',
          tier: 'Bảo vệ tim – thận nền tảng',
          tierOrder: 2,
          action: 'DEFER',
          drugId: isOvertreatedFrail ? targetGlp1 : undefined,
          drugNameVi: isOvertreatedFrail ? chosenName : undefined,
          title: `Tạm hoãn khởi trị mới ${chosenName} ở người cao tuổi suy yếu / điều trị quá mức`,
          rationale:
            'ADA 2026 Ch. 13: Ở người bệnh cao tuổi sức khỏe rất phức tạp, suy yếu gầy mòn hoặc đang có HbA1c thấp kèm hạ đường huyết trên nền SU/Insulin, ưu tiên ngừng/giảm thuốc gây hạ đường huyết (hoặc dùng DPP-4i an toàn thận nếu cần kiểm soát đường huyết) và tránh tác dụng phụ chán ăn, sụt cân mất khối cơ của GLP-1 RA.',
          gates: [],
          citationIds: ['ada.dm2.2026.older_deintensification', 'ada.dm2.2026.older_very_complex_goal'],
          priority: 82
        };
      }

      const vnBmiThresh = thFor('bmi', 'dm2.obesity.bmi_asian_threshold');
      const intlBmiThresh = thFor('bmi', 'hf.glp1.bmi_min');
      const { warnings, extraCits } = buildGlp1ExtraWarningsAndCits(ctx, targetGlp1);
      const startCits = isHfpefObese
        ? [
            'ada.dm2.2026.hfpef_obesity_dual_gip_glp1',
            'ada.dm2.2026.hfpef_obesity_glp1',
            'ada.dm2.2026.rec_9_7_ascvd',
            ...extraCits
          ]
        : [
            'ada.dm2.2026.rec_9_7_ascvd',
            'ada.dm2.2026.glp1_ckd_no_dose_adjust',
            'kdigo.dm2.2022.semaglutide_sc_dosing',
            'ada.dm2.2026.glp1_preferred_over_insulin',
            'esc.dm2.2023.ascvd_sglt2_glp1_class1',
            ...extraCits
          ];

      const switchNote = isExendinRenalBlocked
        ? `Chuyển đổi từ ${resolveDrugNameVi(activeGlp1Id!, activeGlp1Med)} (chống chỉ định thận) sang ${chosenName} không cần chỉnh liều thận`
        : fdcBlockedReason
          ? `Chuyển sang ${chosenName} đơn chất (Tách khỏi chế phẩm phối hợp ${resolveDrugNameVi(activeGlp1Id!, activeGlp1Med)})`
          : isHfpefObese
            ? `Khởi trị ${chosenName}${targetGlp1 === 'semaglutide' ? ' (hoặc Tirzepatide)' : ''} cho ĐTĐ típ 2 kèm HFpEF & Béo phì`
            : `Khởi trị ${chosenName} bảo vệ tim mạch – thận`;

      return {
        id: 'rec_dm2_glp1_cardiorenal',
        module: 'dm2',
        tier: 'Bảo vệ tim – thận nền tảng',
        tierOrder: 2,
        action: 'START',
        drugId: targetGlp1,
        drugNameVi:
          isHfpefObese && targetGlp1 === 'semaglutide' && !hasDrugAllergy(ctx, 'tirzepatide')
            ? `${chosenName} (hoặc Tirzepatide cho HFpEF kèm béo phì)`
            : chosenName,
        dose: `Khởi đầu ${fmtDose(dose(targetGlp1, 'start'))}`,
        title: switchNote,
        rationale: isHfpefObese
          ? 'Khuyến cáo ADA 2026 Ch. 9 (Rec 9.9a–9.9b – STEP-HFpEF DM & SUMMIT): Ở bệnh nhân ĐTĐ típ 2 có suy tim HFpEF kèm béo phì, khuyến cáo đồng vận GLP-1 (Semaglutide) hoặc đồng vận kép GIP/GLP-1 (Tirzepatide) để cải thiện triệu chứng suy tim và giảm biến cố suy tim nặng lên.'
          : 'Khuyến cáo mức 1A (ADA 2026 Ch. 9, Ch. 11 & KDIGO) ở người mắc ĐTĐ típ 2 có ASCVD, CKD hoặc thừa cân/béo phì nhằm giảm biến cố tim mạch lớn (MACE), làm chậm tiến triển bệnh thận và giảm cân hiệu quả mà không cần chỉnh liều theo eGFR.',
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: egfrMin,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² đạt ngưỡng an toàn thận (từ ${egfrMin} trở lên)`
          }
        ],
        citationIds: startCits,
        warnings: warnings.length > 0 ? warnings : undefined, // qa-allow: index - Kiểm tra mảng cảnh báo không rỗng
        benefitsAlso: ['ckd'],
        priority: 92,
        profileDiff: {
          INTL: `ADA 2026: Ưu tiên chỉ định GLP-1 RA độc lập HbA1c cho ASCVD, CKD, HFpEF béo phì hoặc BMI từ ${intlBmiThresh} kg/m².`,
          VN: `BYT 5481/2020: Nhận diện sớm thừa cân/béo phì chuẩn Châu Á (BMI từ ${vnBmiThresh} kg/m² trở lên) kết hợp bệnh lý tim mạch xơ vữa và thận mạn.`,
          US: 'ADA Standards of Care 2026 & FDA: Ưu tiên GLP-1 RA / GIP-GLP-1 RA cho ASCVD, CKD, HFpEF béo phì hoặc quản lý cân nặng.'
        }
      };
    },
    citationIds: [
      'ada.dm2.2026.rec_9_7_ascvd',
      'ada.dm2.2026.glp1_ckd_no_dose_adjust',
      'ada.dm2.2026.hfpef_obesity_dual_gip_glp1',
      'ada.dm2.2026.hfpef_obesity_glp1'
    ]
  }
];
