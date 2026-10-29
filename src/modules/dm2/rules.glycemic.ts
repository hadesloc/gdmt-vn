/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Metformin Nền tảng & Tách Viên Phối hợp (FDC)
 * Phân quyền: Agent F4
 */

import type { Recommendation, Rule } from '../../engine/types';
import { need, missingInputRec } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  ALL_INSULIN_IDS,
  INCRETIN_RA_IDS,
  NON_INSULIN_DM2_IDS,
  SGLT2_IDS,
  computeIndividualizedHba1cTarget,
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
  hasPlannedContrast,
  hasPlannedSurgery,
  isActivelyHypoglycemic,
  isOnDialysis,
  isOvertreatedFrailDeferral,
  isPregnant,
  isTakingAnyCanonical,
  isTakingCanonical,
  parseMedDailyDoseMg,
  pickFirstNonAllergicCandidate,
  resolveDrugNameVi,
  resolveElderlyStatus,
  resolveTargetRecDrug,
  willStartOrContinueGlp1
} from './helpers';

export const dm2GlycemicRules: Rule[] = [
  {
    id: 'dm2.outpatient.metformin',
    module: 'dm2',
    nameVi: 'Kiểm soát đường huyết nền tảng với Metformin theo chức năng thận, gan và cản quang iod',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!hasDm2Context(ctx) || isPregnant(ctx)) return false;
      const crisis = evaluateHyperglycemicCrisis(ctx);
      return !crisis.isCrisis && !crisis.isIsolatedKetonemia;
    },
    produce: (ctx) => {
      const isTaking = isTakingCanonical(ctx, 'metformin');
      const activeMed = findActiveMedByCanonical(ctx, 'metformin');
      const targetDrug = resolveTargetRecDrug('metformin', activeMed);
      const egfr = getEffectiveEgfr(ctx);
      const egfrContra = thFor('egfr', 'dm2.metformin.egfr_contra');
      const egfrCaution = thFor('egfr', 'dm2.metformin.egfr_caution');
      const doseStart = thFor('dose_mg', 'dm2.metformin.dose_start');
      const doseMax = thFor('dose_mg', 'dm2.metformin.dose_max');
      const doseReduced = thFor('dose_mg', 'dm2.metformin.dose_reduced_max');

      if (isActivelyHypoglycemic(ctx)) {
        if (!isTaking) return null;
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: 'Cấp cứu & Xử trí biến cố cấp',
          tierOrder: 0,
          action: 'HOLD',
          drugId: targetDrug.drugId,
          drugNameVi: targetDrug.drugNameVi,
          title: `Tạm hoãn ${targetDrug.drugNameVi} trong giai đoạn xử trí hạ đường huyết cấp`,
          rationale: 'Đang có biến cố hạ đường huyết cấp tính: ưu tiên hồi phục đường huyết ổn định trước khi dùng lại thuốc uống.',
          gates: [],
          citationIds: ['ada.dm2.2026.hypo_rule_of_15'],
          priority: 88
        };
      }

      if (hasDrugAllergy(ctx, 'metformin')) {
        if (isTaking) return null;
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: 'Cảnh báo an toàn & Chống chỉ định',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'metformin',
          drugNameVi: 'Metformin',
          title: 'Tránh khởi trị Metformin do tiền sử dị ứng thuốc',
          rationale: 'Ghi nhận tiền sử dị ứng hoặc quá mẫn nghiêm trọng với Metformin.',
          gates: [{ parameter: 'allergy', passed: false, threshold: 1, messageVi: 'Dị ứng Metformin' }],
          citationIds: ['fda.metformin.egfr_bands'],
          priority: 99
        };
      }

      if (hasHepaticImpairment(ctx)) {
        if (isTaking) return null;
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: 'Cảnh báo an toàn & Chống chỉ định',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'metformin',
          drugNameVi: 'Metformin',
          title: 'Chống chỉ định Metformin do bệnh gan / suy giảm chức năng gan (Nguy cơ toan acid lactic)',
          rationale:
            'Nhãn FDA Glucophage & BYT 5481/2020: Tránh dùng Metformin ở bệnh nhân suy gan mất bù (Child-Pugh B/C) hoặc bệnh gan hoạt động do giảm thanh thải lactat tại gan làm tăng nguy cơ nhiễm toan lactic.',
          gates: [{ parameter: 'hepatic', passed: false, threshold: 1, messageVi: 'Suy gan: Chống chỉ định Metformin' }],
          citationIds: ['fda.metformin.hepatic_contra'],
          priority: 95
        };
      }

      if (isOnDialysis(ctx) || (egfr !== undefined && egfr < egfrContra)) {
        const effVal = egfr ?? egfrContra - 15; // qa-allow: unit-conversion - Giá trị đại diện khi lọc máu
        const isFdc = targetDrug.drugId !== 'metformin';
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: isTaking ? 'Cảnh báo an toàn & Chống chỉ định' : 'Kiểm soát đường huyết',
          tierOrder: isTaking ? 0 : 3,
          action: isTaking ? 'STOP' : 'AVOID',
          drugId: isTaking ? targetDrug.drugId : 'metformin',
          drugNameVi: isTaking ? targetDrug.drugNameVi : 'Metformin',
          title: isTaking
            ? isFdc
              ? `NGỪNG HẲN viên phối hợp ${targetDrug.drugNameVi} do thành phần Metformin chống chỉ định khi eGFR dưới ${egfrContra} mL/phút/1.73m²`
              : `Ngừng Metformin do suy thận nặng / lọc máu (eGFR dưới ${egfrContra} mL/phút/1.73m²)`
            : `Chống chỉ định Metformin (eGFR dưới ${egfrContra} mL/phút/1.73m² hoặc đang lọc máu)`,
          rationale: isFdc
            ? `Chống chỉ định tuyệt đối thành phần Metformin trong viên phối hợp ${targetDrug.drugNameVi} ở eGFR dưới ${egfrContra} mL/phút/1.73m² do nguy cơ nhiễm toan acid lactic; tuyệt đối không dùng lại viên phối hợp này (chuyển sang viên đơn chất cho thành phần còn lại nếu có chỉ định).`
            : 'Chống chỉ định tuyệt đối do suy giảm đào thải thuốc qua thận, dẫn đến tích lũy Metformin và nguy cơ toan acid lactic đe dọa tính mạng.',
          gates: [{ parameter: 'eGFR', passed: false, value: effVal, threshold: egfrContra, messageVi: `eGFR dưới ${egfrContra} / Lọc máu: Chống chỉ định Metformin` }],
          citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra'],
          priority: 98
        };
      }

      const fdcBlockedReason = isTaking
        ? getFdcBlockedCompanionReason(ctx, activeMed, 'metformin')
        : undefined;
      const cleanTaking = isTaking && !fdcBlockedReason;

      if (hasPlannedSurgery(ctx)) {
        if (cleanTaking) return null;
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: 'An toàn Chu phẫu & Điều chỉnh thuốc trước mổ',
          tierOrder: 2,
          action: 'DEFER',
          drugId: 'metformin',
          drugNameVi: 'Metformin',
          title: 'Trì hoãn khởi trị Metformin trước phẫu thuật chương trình',
          rationale:
            'ADA 2026 Ch. 16: Không khởi trị mới Metformin ngay trước phẫu thuật (cần tạm ngừng vào ngày mổ); chỉ bắt đầu sau mổ khi ăn lại đường miệng và huyết động/eGFR ổn định.',
          gates: [],
          citationIds: ['ada.dm2.2026.perioperative_oral_basal_25'],
          priority: 86
        };
      }

      const contrastCut = thFor('egfr', 'dm2.contrast.metformin_egfr_cutoff');
      const recheckHours = thFor('duration_hours', 'dm2.contrast.recheck_hours');
      if (hasPlannedContrast(ctx) && (egfr === undefined || egfr <= contrastCut || hasHf(ctx))) {
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: 'Cảnh báo an toàn & Chống chỉ định',
          tierOrder: 1,
          action: cleanTaking ? 'HOLD' : 'DEFER',
          drugId: cleanTaking ? targetDrug.drugId : 'metformin',
          drugNameVi: cleanTaking ? targetDrug.drugNameVi : 'Metformin',
          title: cleanTaking
            ? `Tạm ngừng ${targetDrug.drugNameVi} trước thủ thuật thuốc cản quang chứa iod (Đánh giá lại eGFR sau ${recheckHours} giờ)`
            : 'Trì hoãn khởi trị Metformin do chuẩn bị tiêm thuốc cản quang chứa iod',
          rationale:
            `Cảnh báo Hộp đen FDA (Mục 2.6 & 5.2): Ở bệnh nhân có eGFR từ ${egfrContra}–${contrastCut} mL/phút/1.73m² hoặc kèm suy tim/bệnh gan chuẩn bị tiêm thuốc cản quang chứa iod, bắt buộc tạm ngừng Metformin và đánh giá lại eGFR sau ${recheckHours} giờ; chỉ dùng lại khi chức năng thận ổn định để phòng nhiễm toan lactic (MALA).`,
          gates: [{ parameter: 'iodinated_contrast', passed: false, value: egfr, threshold: contrastCut, messageVi: `Cản quang iod: Ngừng/Hoãn Metformin, kiểm tra lại eGFR sau ${recheckHours} giờ` }],
          citationIds: ['fda.dm2.metformin.contrast_60_48h', 'fda.metformin.egfr_bands'],
          priority: 97
        };
      }

      if (egfr === undefined) {
        if (isTaking) {
          return {
            id: 'rec_dm2_metformin',
            module: 'dm2',
            tier: 'Kiểm soát đường huyết',
            tierOrder: 3,
            action: 'HOLD',
            drugId: fdcBlockedReason ? 'metformin' : targetDrug.drugId,
            drugNameVi: fdcBlockedReason ? 'Metformin' : targetDrug.drugNameVi,
            title: 'Tạm hoãn điều chỉnh Metformin (Cần xét nghiệm eGFR)',
            rationale: `Bệnh nhân đang dùng Metformin nhưng chưa có kết quả eGFR. Cần kiểm tra chức năng thận để loại trừ chống chỉ định suy thận nặng (eGFR dưới ${egfrContra}).`,
            gates: [],
            citationIds: ['fda.metformin.egfr_bands'],
            priority: 85
          };
        }
        return missingInputRec('dm2', 'egfr', 'đánh giá an toàn và chỉnh liều Metformin theo chức năng thận', ['fda.metformin.egfr_bands']);
      }

      const hba1c = need(ctx, 'hba1c');
      const glucose = need(ctx, 'glucose');
      const hasCardiorenal = hasAscvd(ctx) || hasHf(ctx) || hasCkd(ctx);
      const dailyMg = isTaking ? parseMedDailyDoseMg(activeMed, 'metformin') : undefined;

      // Trường hợp đang uống Metformin trong viên phối hợp có thành phần đi kèm bị chặn (vd: Actoplus Met ở HF, Janumet + GLP-1, Qtern/Synjardy...)
      if (isTaking && fdcBlockedReason) {
        const fdcName = resolveDrugNameVi('metformin', activeMed);
        const safeStandAloneMg =
          egfr < egfrCaution
            ? dailyMg !== undefined && dailyMg > 0 && dailyMg <= doseReduced
              ? dailyMg
              : doseReduced
            : dailyMg !== undefined && dailyMg > 0
              ? Math.min(dailyMg, doseMax)
              : doseStart;
        return {
          id: 'rec_dm2_metformin',
          module: 'dm2',
          tier: 'Kiểm soát đường huyết',
          tierOrder: 3,
          action: 'START',
          drugId: 'metformin',
          drugNameVi: 'Metformin',
          dose:
            egfr < egfrCaution
              ? `${safeStandAloneMg} mg/ngày dạng viên đơn chất (tối đa không quá ${doseReduced} mg/ngày ở CKD G3b)`
              : `${safeStandAloneMg} mg/ngày dạng viên Metformin đơn chất sau ăn`,
          title: `Chuyển sang Metformin đơn chất (Tách khỏi viên phối hợp ${fdcName})`,
          rationale:
            `Viên phối hợp ${fdcName} bắt buộc ngừng do ${fdcBlockedReason}; kê riêng viên Metformin đơn chất ở liều phù hợp chức năng thận (eGFR ${egfr.toFixed(0)} mL/phút/1.73m²) để tiếp tục duy trì kiểm soát đường huyết nền tảng.`,
          gates: [
            {
              parameter: 'eGFR',
              passed: true,
              value: egfr,
              threshold: egfrContra,
              messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² đạt ngưỡng cho phép dùng Metformin đơn chất`
            }
          ],
          citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra', 'kdigo.dm2.2022.metformin_halve_30_44'],
          priority: 89
        };
      }

      let action: Recommendation['action'] = 'START';
      let doseText: string | undefined = `${doseStart} mg x 1–2 lần/ngày sau ăn (chuẩn độ tăng dần tới ${doseMax} mg/ngày)`;
      let title = 'Khởi trị Metformin kiểm soát đường huyết nền tảng';
      let rationale =
        'Thuốc nền tảng kiểm soát đường huyết đầu tay, cải thiện nhạy cảm insulin, không gây hạ đường huyết đơn trị và chi phí thấp.';

      if (egfr < egfrCaution) {
        if (isTaking) {
          if (dailyMg !== undefined && dailyMg > 0 && dailyMg <= doseReduced) {
            action = 'CONTINUE';
            doseText = `${formatActiveMedDose(activeMed, 'metformin') || `${dailyMg} mg/ngày`} (duy trì không vượt quá ${doseReduced} mg/ngày ở CKD G3b)`;
            title = `Tiếp tục duy trì Metformin liều thận trọng (${dailyMg} mg/ngày) phù hợp CKD G3b`;
            rationale = `KDIGO 2022 & FDA: Liều Metformin hiện tại (${dailyMg} mg/ngày) đã nằm trong giới hạn an toàn cho dải eGFR ${egfrContra}–${egfrCaution} mL/phút/1.73m² (tối đa ${doseReduced} mg/ngày); tiếp tục duy trì và theo dõi eGFR định kỳ.`;
          } else {
            action = 'REDUCE';
            doseText = `Tối đa ${doseReduced} mg/ngày`;
            title = 'Giảm liều Metformin khi suy thận mức độ vừa (CKD G3b)';
            rationale = `Chức năng thận suy giảm mức độ vừa (G3b): Giảm liều tối đa không quá ${doseReduced} mg/ngày và theo dõi eGFR định kỳ.`;
          }
        } else {
          action = 'DEFER';
          doseText = undefined;
          title = `Không khởi trị mới Metformin khi eGFR dưới ${egfrCaution} mL/phút/1.73m²`;
          rationale = 'Không khuyến cáo bắt đầu mới Metformin khi eGFR dưới ngưỡng cho phép khởi trị theo nhãn FDA và Bộ Y tế.';
        }
      } else if (isTaking) {
        action = 'CONTINUE';
        title = 'Tiếp tục duy trì Metformin';
        doseText = formatActiveMedDose(activeMed, 'metformin') || `${doseStart}–${doseMax} mg/ngày theo khả năng dung nạp`;
      } else if (
        isOvertreatedFrailDeferral(ctx) ||
        (resolveElderlyStatus(ctx) !== 'not_elderly' &&
          hba1c !== undefined &&
          hba1c < thFor('hba1c', 'dm2.hba1c.target_young'))
      ) {
        action = 'DEFER';
        doseText = undefined;
        title = 'Trì hoãn khởi trị mới Metformin ở người cao tuổi suy yếu / HbA1c đã thấp';
        rationale =
          'ADA 2026 Ch. 13: Ở người cao tuổi suy yếu/kỳ vọng sống hạn chế hoặc có HbA1c đã rất thấp, không cần khởi trị thêm thuốc hạ đường huyết mới.';
      } else {
        // Bệnh nhân chưa dùng thuốc (drug-naive), không có bệnh tim-thận và HbA1c đã dưới 6.5% -> CONSIDER thay đổi lối sống / Metformin tùy cá thể (B15)
        const hasAnyDmMed = isTakingAnyCanonical(ctx, [...NON_INSULIN_DM2_IDS, ...ALL_INSULIN_IDS]);
        const youngGoal = thFor('hba1c', 'dm2.hba1c.target_young');
        const fpgGoalMax = thFor('glucose', 'dm2.glucose.fpg_target_max_mmol');
        const willNewlyStartSglt2 =
          !isTakingAnyCanonical(ctx, SGLT2_IDS) &&
          hasCardiorenal &&
          !hasActiveFootUlcer(ctx) &&
          !(resolveElderlyStatus(ctx) === 'very_complex' && !hasHf(ctx)) &&
          egfr >= thFor('egfr', 'ckd.sglt2i.egfr_initiate_min') &&
          Boolean(pickFirstNonAllergicCandidate(ctx, ['dapagliflozin', 'empagliflozin']));
        const willNewlyStartGlp1 =
          !isTakingAnyCanonical(ctx, INCRETIN_RA_IDS) && willStartOrContinueGlp1(ctx);
        const target = computeIndividualizedHba1cTarget(ctx);
        const comboDelta = thFor('hba1c', 'dm2.hba1c.combo_delta');

        if (
          !hasAnyDmMed &&
          !hasCardiorenal &&
          hba1c !== undefined &&
          hba1c < youngGoal &&
          (glucose === undefined || glucose <= fpgGoalMax)
        ) {
          action = 'CONSIDER';
          doseText = `Cân nhắc ${doseStart} mg/ngày sau ăn tối nếu cần hỗ trợ duy trì đường huyết bên cạnh can thiệp lối sống`;
          title = `Ưu tiên điều chỉnh lối sống tích cực; cân nhắc Metformin cá thể hóa (HbA1c hiện ${hba1c.toFixed(1)}% đã dưới ${youngGoal.toFixed(1)}%)`;
          rationale =
            'ADA 2026 Ch. 9 & BYT 5481/2020: Ở bệnh nhân ĐTĐ típ 2 chưa dùng thuốc có HbA1c đã đạt dưới ngưỡng chặt chẽ và chưa có bệnh lý tim – thận, can thiệp dinh dưỡng – vận động là nền tảng đầu tiên; chỉ cân nhắc khởi trị Metformin theo đánh giá cá thể hóa của bác sĩ.';
        } else if (
          hasAnyDmMed &&
          (willNewlyStartSglt2 || willNewlyStartGlp1) &&
          hba1c !== undefined &&
          hba1c < target + comboDelta
        ) {
          // Đã có thuốc hạ ĐH nền + vừa khởi mới SGLT2i/GLP-1 RA ở lần khám này (vd Preset 2 HbA1c 7.9%) -> tránh khởi đồng loạt 3 thuốc hạ ĐH mới
          action = 'CONSIDER';
          doseText = `Cân nhắc phối hợp thêm ${doseStart} mg x 1–2 lần/ngày ở lần tái khám tiếp theo nếu HbA1c chưa đạt đích`;
          title = 'Cân nhắc bổ sung Metformin ở bước tái khám sau khi ổn định trụ cột bảo vệ tim – thận';
          rationale =
            'ADA 2026 Ch. 9: Khi bệnh nhân đã đang dùng thuốc hạ đường huyết và vừa khởi trị trụ cột SGLT2i và/hoặc GLP-1 RA bảo vệ cơ quan đích với HbA1c chưa vượt quá xa mục tiêu, nên tránh khởi đầu đồng loạt quá nhiều thuốc mới trong cùng một lần khám để đảm bảo dung nạp và tuân thủ.';
        }
      }

      const effectivePriority = ctx.settings.profile === 'VN' && !hasCardiorenal ? 96 : 85;

      return {
        id: 'rec_dm2_metformin',
        module: 'dm2',
        tier: 'Kiểm soát đường huyết',
        tierOrder: 3,
        action,
        drugId: 'metformin',
        drugNameVi: 'Metformin',
        dose: doseText,
        title,
        rationale,
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: egfrContra,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² đạt ngưỡng cho phép sử dụng`
          }
        ],
        citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra', 'kdigo.dm2.2022.metformin_halve_30_44'],
        priority: effectivePriority,
        profileDiff: {
          INTL: 'ADA 2026: Metformin là thành phần kiểm soát đường huyết chủ lực, phối hợp song song hoặc sau trụ cột SGLT2i/GLP-1 RA.',
          VN: 'BYT 5481/2020: Metformin được ưu tiên làm thuốc nền tảng đầu tay cho bệnh nhân ĐTĐ típ 2 nếu không chống chỉ định.',
          US: 'ADA Standards of Care 2026 & FDA Label: Metformin hiệu quả cao, an toàn theo dải eGFR và kết hợp linh hoạt cùng thuốc bảo vệ tim-thận.'
        }
      };
    },
    citationIds: ['fda.metformin.egfr_bands', 'byt.dm2.2020.metformin_renal_contra']
  }
];
