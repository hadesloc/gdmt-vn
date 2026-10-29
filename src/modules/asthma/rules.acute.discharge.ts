/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Cơn hen Nhẹ-Trung bình, Xuất viện & Duy trì Nội viện Không cấp
 * Phân quyền: Agent M
 */

import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import type { Rule, Recommendation } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ADULT_18_ONLY_DRUGS,
  CYP3A4_SENSITIVE_ICS_LABA_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  ICS_CONTAINING_DRUGS,
  TRIPLE_INHALER_DRUGS,
  asDose,
  asthmaGate,
  asthmaRule,
  evaluateAcuteAsthma,
  getMartMaxDailyPuffs,
  hasSevereMilkProteinAllergy,
  hasStrongCyp3a4Inhibitor,
  isAdultOrAdolescent,
  isAllergicToDrug,
  isMartOveruse,
  isUsingRapihaler80,
  resolveAcuteMedAction,
  resolveControllerAction,
  resolveTrack1MartDrugId,
  shouldDeferTripleInhalerToCopd
} from './helpers';

export const asthmaAcuteDischargeAndMildRules: Rule[] = [
  asthmaRule({
    id: 'asthma.acute.missing_triage_data',
    setting: 'inpatient',
    nameVi: 'Yêu cầu bổ sung thông số sinh hiệu tối thiểu (SpO2 & Nhịp thở) để phân tầng cơn hen cấp',
    citationIds: ['gina.asthma.2026.acute_oxygen_target', 'byt.asthma.2021.acute_classification'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && !acute.isLifeThreatening && !acute.isSevere && !acute.hasMinVitals;
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const missingField = acute.missingVitalField ?? 'spo2';
      return missingInputRec(
        'asthma',
        missingField,
        'phân loại chính xác mức độ nặng cơn hen cấp (SpO₂ khí trời và nhịp thở thực tế) trước khi chỉ định phác đồ cấp cứu nội viện',
        ['gina.asthma.2026.acute_oxygen_target', 'byt.asthma.2021.acute_classification']
      );
    }
  }),

  asthmaRule({
    id: 'asthma.acute.mild_moderate_saba',
    setting: 'inpatient',
    nameVi: 'Cơn hen cấp nhẹ – trung bình: Thuốc giãn phế quản SABA qua buồng đệm & Oxy mục tiêu',
    citationIds: [
      'gina.asthma.2026.acute_saba_puffs',
      'byt.asthma.2021.acute_hospital_treatment',
      'gina.asthma.2026.acute_oxygen_target'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && !acute.isLifeThreatening && !acute.isSevere && acute.hasMinVitals;
    },
    produce: (ctx): Recommendation => {
      const acute = evaluateAcuteAsthma(ctx);
      const minPuffs = thFor('puffs_dose', 'asthma.acute.salbutamol_puffs_min');
      const maxPuffs = thFor('puffs_dose', 'asthma.acute.salbutamol_puffs_max');
      const nebDose = thFor('dose_mg', 'asthma.acute.salbutamol_neb_dose');
      const nebInterval = thFor('duration_min', 'asthma.acute.repeat_interval_min');
      const useTerbutaline = isAllergicToDrug(ctx, 'salbutamol') && !isAllergicToDrug(ctx, 'terbutaline');
      const sabaId = useTerbutaline ? 'terbutaline' : 'salbutamol';
      const sabaAction = resolveAcuteMedAction(ctx, sabaId);

      const o2TargetStr = acute.isPregnancyTarget
        ? `≥ ${acute.oxygenTargetMin}% (thai kỳ)`
        : `${acute.oxygenTargetMin}–${acute.oxygenTargetMax}%${acute.isCopdHypercapnicTarget ? ' (đồng mắc COPD)' : ''}`;
      const citationIds = acute.isPregnancyTarget
        ? [
            'gina.asthma.2026.acute_saba_puffs',
            'byt.asthma.2021.acute_hospital_treatment',
            'gina.asthma.2026.oxygen_target_revised_95',
            'gina.asthma.2026.pregnancy_acute_fetal_hypoxia'
          ]
        : [
            'gina.asthma.2026.acute_saba_puffs',
            'byt.asthma.2021.acute_hospital_treatment',
            'gina.asthma.2026.acute_oxygen_target'
          ];

      return {
        id: 'rec_asthma_acute_mild_moderate_saba',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 92, // qa-allow: index - độ ưu tiên cấp cứu
        action: sabaAction,
        drugId: sabaId,
        dose: useTerbutaline
          ? asDose(`Phun khí dung Terbutaline ${nebDose} mg mỗi ${nebInterval} phút trong 1 giờ đầu; thở oxy nếu cần đạt SpO₂ ${o2TargetStr}`)
          : asDose(
              `Xịt ${minPuffs}–${maxPuffs} nhát pMDI (100 mcg/nhát) qua buồng đệm mỗi ${nebInterval} phút trong 1 giờ đầu; bổ sung oxy nếu cần đạt SpO₂ ${o2TargetStr}`
            ),
        title: `Cơn hen cấp nhẹ – trung bình: Xịt ${useTerbutaline ? 'Terbutaline' : 'Salbutamol'} qua buồng đệm & Theo dõi đáp ứng sau 1 giờ`,
        rationale:
          'Trong cơn hen cấp nhẹ – trung bình, dùng bình xịt định liều SABA qua buồng đệm có ống ngậm miệng mang lại hiệu quả giãn phế quản tương đương máy phun khí dung và giảm phát tán giọt bắn. Đánh giá lại lâm sàng, SpO₂ và PEF sau 1 giờ.',
        gates: [],
        citationIds
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.mild_moderate_ocs',
    setting: 'inpatient',
    nameVi: 'Cơn hen cấp nhẹ – trung bình: Prednisolone đường uống ngắn ngày',
    citationIds: ['gina.asthma.2026.acute_prednisolone_daily', 'byt.asthma.2021.acute_hospital_treatment'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      return acute.hasAcuteAttack && !acute.isLifeThreatening && !acute.isSevere && acute.hasMinVitals;
    },
    produce: (ctx): Recommendation => {
      const predMin = thFor('dose_mg', 'asthma.acute.prednisolone_dose_min');
      const predMax = thFor('dose_mg', 'asthma.acute.prednisolone_dose_max');
      const mpDose = thFor('dose_mg', 'asthma.acute.methylprednisolone_iv_mg');
      const minDays = thFor('duration_days', 'asthma.acute.steroid_duration_min');
      const maxDays = thFor('duration_days', 'asthma.acute.steroid_duration_max');
      const useMethyl = isAllergicToDrug(ctx, 'prednisolone') && !isAllergicToDrug(ctx, 'methylprednisolone');
      const steroidId = useMethyl ? 'methylprednisolone' : 'prednisolone';
      const predAction = resolveAcuteMedAction(ctx, steroidId);

      return {
        id: 'rec_asthma_acute_mild_moderate_ocs',
        module: 'asthma',
        tier: 'Cấp cứu Cơn hen cấp',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên cấp cứu
        action: predAction,
        drugId: steroidId,
        dose: useMethyl
          ? asDose(`Uống hoặc tiêm tĩnh mạch ${mpDose} mg/ngày trong ${minDays}–${maxDays} ngày`)
          : asDose(
              `Uống ${predMin}–${predMax} mg/ngày vào buổi sáng trong ${minDays}–${maxDays} ngày (không cần giảm liều dần nếu dùng dưới 2 tuần)`
            ),
        title: `Dùng Corticosteroid đường uống ngắn ngày (${useMethyl ? 'Methylprednisolone' : 'Prednisolone'}) kiểm soát viêm đường thở cấp`,
        rationale:
          'Corticosteroid đường uống hấp thu nhanh và hiệu quả tương đương đường tĩnh mạch ở người bệnh tỉnh táo, nuốt được, giúp rút ngắn thời gian đợt cấp và ngăn ngừa tái phát sớm sau xuất viện.',
        gates: [],
        citationIds: ['gina.asthma.2026.acute_prednisolone_daily', 'byt.asthma.2021.acute_hospital_treatment']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.discharge_plan',
    setting: 'inpatient',
    nameVi: 'Kế hoạch ra viện sau đợt cấp hen: Khởi trị / Tăng bậc ICS-formoterol (MART) hoặc giữ phác đồ Bậc 5 & Hẹn tái khám 2–7 ngày',
    citationIds: [
      'gina.asthma.2026.discharge_box_9_7_mart_ocs',
      'byt.asthma.2020.discharge_followup_2_7_days',
      'byt.asthma.2021.discharge_criteria_pef_60_80_spo2_94'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      return evaluateAcuteAsthma(ctx).isDischargeReady;
    },
    produce: (ctx): Recommendation => {
      const fupMin = thFor('duration_days', 'asthma.discharge.followup_days_min');
      const fupMax = thFor('duration_days', 'asthma.discharge.followup_days_max');
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const age = need(ctx, 'age');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const isRap80 = isUsingRapihaler80(ctx);

      const safeExistingTriple = ctx.patient.currentMeds.find((m) => {
        const id = resolveKbDrugId(m.drugId);
        if (!TRIPLE_INHALER_DRUGS.has(id)) return false;
        if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
        if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
        if (hasStrongCyp3a4Inhibitor(ctx) && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
        if (isAllergicToDrug(ctx, id)) return false;
        return true;
      });

      if (safeExistingTriple) {
        const curTripleDose = safeExistingTriple.dose
          ? String(safeExistingTriple.dose)
          : 'Liều chuẩn Bậc 5 hàng ngày';
        return {
          id: 'rec_asthma_discharge_plan',
          module: 'asthma',
          tier: 'Ra viện & Dự phòng tái phát',
          tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 95, // qa-allow: index - độ ưu tiên kế hoạch ra viện
          action: 'CONTINUE',
          drugId: safeExistingTriple.drugId,
          dose: asDose(
            `${curTripleDose} + hẹn tái khám chuyên khoa Hô hấp trong ${fupMin}–${fupMax} ngày để đánh giá chỉ định thuốc sinh học`
          ),
          title: `Xuất viện trên nền Hen Bậc 5: Tiếp tục bình 3 thành phần (${safeExistingTriple.name || safeExistingTriple.drugId}) & Tái khám sau ${fupMin}–${fupMax} ngày`,
          rationale: `Người bệnh đã ở Bậc 5 (ICS-LABA-LAMA) nhập viện vì đợt cấp: KHÔNG bỏ LAMA khi ra viện; duy trì đủ phác đồ Bậc 5, hoàn thành đợt OCS ngắn ngày và hẹn tái khám chuyên khoa trong ${fupMin}–${fupMax} ngày đánh giá thuốc sinh học.`,
          gates: [asthmaGate('acuteResponseAfter1h', true, 'Đủ tiêu chuẩn an toàn xuất viện trên nền Bậc 5')],
          citationIds: [
            'gina.asthma.2026.discharge_box_9_7_mart_ocs',
            'gina.asthma.2026.step5_lama_triplet',
            'byt.asthma.2020.discharge_followup_2_7_days'
          ]
        };
      }

      const martDrugId = resolveTrack1MartDrugId(ctx);
      const isFost = martDrugId === 'beclometasone_formoterol';
      const hasAddOnTiotropium = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'tiotropium');
      const { action: ctrlAction, switchFrom } = resolveControllerAction(ctx, martDrugId, 'UPTITRATE');

      let deviceLabel: string;
      let step4DoseStr: string;
      if (isFost) {
        deviceLabel = milkAllergy ? 'Foster pMDI 100/6 mcg (kèm buồng đệm — không chứa lactose)' : 'Foster 100/6 mcg';
        step4DoseStr = `2 nhát x 2 lần/ngày (MART Bậc 4) + xịt thêm 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else if (milkAllergy || isRap80) {
        const puffsMaint = isRap80 ? 4 : 2; // qa-allow: unit-conversion - Rapihaler 80/2.25 nhân đôi thành 4 nhát x 2 lần/ngày
        const puffsRel = isRap80 ? 2 : 1; // qa-allow: unit-conversion - Rapihaler 80/2.25 cắt cơn 2 nhát/lần
        const strengthText = isRap80 ? '80/2.25 mcg' : '160/4.5 mcg';
        deviceLabel = `Symbicort Rapihaler pMDI ${strengthText} (qua buồng đệm — không chứa lactose)`;
        step4DoseStr = `${puffsMaint} nhát x 2 lần/ngày (MART Bậc 4) + xịt thêm ${puffsRel} nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      } else {
        deviceLabel = 'Budesonide/formoterol 160/4.5 mcg';
        step4DoseStr = `2 nhát x 2 lần/ngày (MART Bậc 4) + hít thêm 1 nhát khi cần cắt cơn (tối đa ${maxPuffs} nhát/ngày)`;
      }

      const tiotropiumKeepNote = hasAddOnTiotropium
        ? '; ĐỒNG THỜI TIẾP TỤC bình rời Tiotropium Respimat đang dùng ở Bậc 5'
        : '';

      return {
        id: 'rec_asthma_discharge_plan',
        module: 'asthma',
        tier: 'Ra viện & Dự phòng tái phát',
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên kế hoạch ra viện
        action: ctrlAction,
        drugId: martDrugId,
        switchFrom,
        dose: asDose(`${deviceLabel}: ${step4DoseStr}${tiotropiumKeepNote}`),
        title: `Đơn thuốc kiểm soát nền khi ra viện: Khởi trị / Nâng bậc lên Track 1 MART Bậc 4 (${isFost ? 'Beclometasone/formoterol' : 'Budesonide/formoterol'}) & Hẹn tái khám sau ${fupMin}–${fupMax} ngày`,
        rationale: `Theo GINA 2026 (Box 9-7) và Bộ Y tế QĐ 5850/2021, bệnh nhân xuất viện sau cơn hen cấp (SpO₂ ổn định, PEF/FEV₁ > 60%) bắt buộc khởi trị/nâng bậc thuốc kiểm soát chứa ICS (ưu tiên MART Bậc 4 trong 2–4 tuần), kiểm tra kỹ thuật hít, cấp Kế hoạch hành động và tái khám trong ${fupMin}–${fupMax} ngày.`,
        gates: [
          asthmaGate('acuteResponseAfter1h', true, 'Đáp ứng tốt sau xử trí cấp cứu và đạt ngưỡng sinh hiệu xuất viện an toàn')
        ],
        citationIds: [
          'gina.asthma.2026.discharge_box_9_7_mart_ocs',
          'byt.asthma.2020.discharge_followup_2_7_days',
          'byt.asthma.2021.discharge_criteria_pef_60_80_spo2_94'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.discharge_ocs',
    setting: 'inpatient',
    nameVi: 'Đơn ra viện sau đợt cấp hen: Hoàn thành liệu trình Corticosteroid đường uống 5–7 ngày',
    citationIds: [
      'gina.asthma.2026.acute_prednisolone_daily',
      'gina.asthma.2026.discharge_box_9_7_mart_ocs',
      'byt.asthma.2020.discharge_followup_2_7_days'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      return evaluateAcuteAsthma(ctx).isDischargeReady;
    },
    produce: (ctx): Recommendation => {
      const predMin = thFor('dose_mg', 'asthma.acute.prednisolone_dose_min');
      const predMax = thFor('dose_mg', 'asthma.acute.prednisolone_dose_max');
      const mpDose = thFor('dose_mg', 'asthma.acute.methylprednisolone_iv_mg');
      const minDays = thFor('duration_days', 'asthma.acute.steroid_duration_min');
      const maxDays = thFor('duration_days', 'asthma.acute.steroid_duration_max');
      const useMethyl = isAllergicToDrug(ctx, 'prednisolone') && !isAllergicToDrug(ctx, 'methylprednisolone');
      const steroidId = useMethyl ? 'methylprednisolone' : 'prednisolone';
      const predAction = resolveAcuteMedAction(ctx, steroidId);

      return {
        id: 'rec_asthma_discharge_ocs',
        module: 'asthma',
        tier: 'Ra viện & Dự phòng tái phát',
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 93, // qa-allow: index - độ ưu tiên đơn ra viện
        action: predAction,
        drugId: steroidId,
        dose: useMethyl
          ? asDose(`Uống ${mpDose} mg/ngày vào buổi sáng sau ăn đủ ${minDays}–${maxDays} ngày`)
          : asDose(
              `Uống ${predMin}–${predMax} mg/ngày vào buổi sáng sau ăn đủ ${minDays}–${maxDays} ngày (không cần giảm liều dần nếu tổng thời gian dưới 2 tuần và đã dùng ICS nền)`
            ),
        title: `Hoàn thành liệu trình ${useMethyl ? 'Methylprednisolone' : 'Prednisolone'} đường uống ${minDays}–${maxDays} ngày khi xuất viện`,
        rationale: `Theo GINA 2026 (Box 9-7) và Bộ Y tế, đơn ra viện sau cơn hen cấp bắt buộc hoàn thành đủ đợt Corticosteroid uống (${minDays}–${maxDays} ngày ở người lớn) song song với bình hít kiểm soát ICS-formoterol/ICS-LABA để ngừa tái phát sớm.`,
        gates: [asthmaGate('acuteResponseAfter1h', true, 'Hoàn thành liệu trình OCS ngắn ngày sau cơn cấp')],
        citationIds: [
          'gina.asthma.2026.acute_prednisolone_daily',
          'gina.asthma.2026.discharge_box_9_7_mart_ocs',
          'byt.asthma.2020.discharge_followup_2_7_days'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.acute.non_acute_inpatient_controller_continue',
    setting: 'inpatient',
    nameVi: 'Nội viện ngoài đợt cấp hen (mổ phiên / bệnh nội khoa khác): Duy trì liên tục bình hít kiểm soát nền',
    citationIds: ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.never_saba_alone'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      if (acute.hasAcuteAttack || acute.isDischargeReady) return false;
      const age = need(ctx, 'age');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const strongCyp = hasStrongCyp3a4Inhibitor(ctx);

      return ctx.patient.currentMeds.some((m) => {
        const id = resolveKbDrugId(m.drugId);
        if (!ICS_CONTAINING_DRUGS.has(id)) return false;
        if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
        if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
        if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
        if (isAllergicToDrug(ctx, id)) return false;
        return true;
      });
    },
    produce: (ctx): Recommendation | null => {
      const age = need(ctx, 'age');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const strongCyp = hasStrongCyp3a4Inhibitor(ctx);

      const ctrl = ctx.patient.currentMeds.find((m) => {
        const id = resolveKbDrugId(m.drugId);
        if (!ICS_CONTAINING_DRUGS.has(id)) return false;
        if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
        if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
        if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
        if (isAllergicToDrug(ctx, id)) return false;
        return true;
      });
      if (!ctrl) return null;

      return {
        id: 'rec_asthma_inpatient_non_acute_controller_continue',
        module: 'asthma',
        tier: 'Điều trị Kiểm soát nền (Track 1 / Track 2)',
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 85, // qa-allow: index - độ ưu tiên duy trì thuốc nền chu phẫu / nội viện
        action: 'CONTINUE',
        drugId: ctrl.drugId,
        dose: ctrl.dose ? asDose(String(ctrl.dose)) : asDose('Tiếp tục đúng liều duy trì ngoại trú hàng ngày'),
        title: `Nội viện ổn định ngoài đợt cấp hen: Tiếp tục duy trì bình kiểm soát nền (${ctrl.name || ctrl.drugId})`,
        rationale:
          'Khi người bệnh hen ổn định nhập viện vì bệnh lý khác hoặc phẫu thuật chương trình (isAcuteExacerbation = false), cần duy trì liên tục bình hít chứa ICS/ICS-LABA hàng ngày để phòng co thắt phế quản chu phẫu và đợt cấp nội viện.',
        gates: [asthmaGate('isAcuteExacerbation', true, 'Nhập viện ngoài đợt cấp hen')],
        citationIds: ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.never_saba_alone']
      };
    }
  })
];
