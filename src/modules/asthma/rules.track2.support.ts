/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Bổ trợ, Bối cảnh Việt Nam, Bệnh đồng mắc & Kế hoạch Hành động 3 Vùng
 * Phân quyền: Agent M
 */

import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import type { Rule, Recommendation } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import { generateAsthmaActionPlanVi } from './actionPlan';
import { cypControllerBridge } from './helpers.cyp3a4';
import {
  ADULT_18_ONLY_DRUGS,
  CYP3A4_SENSITIVE_ICS_LABA_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  MONO_ICS_DRUGS,
  TRACK2_ICS_LABA_DRUGS,
  TRIPLE_INHALER_DRUGS,
  asthmaRule,
  computeEffectiveTrack1Step,
  computeEffectiveTrack2Step,
  evaluateAcuteAsthma,
  evaluateGinaControl,
  getMartMaxDailyPuffs,
  hasCustomCond,
  hasSevereMilkProteinAllergy,
  hasStrongCyp3a4Inhibitor,
  isAllergicToDrug,
  isAdultOrAdolescent,
  isMartOveruse,
  isUsingRapihaler80,
  resolveTrack1MartDrugId,
  resolveTrack2IcsLabaDrugId,
  resolveTrack2MonoIcsDrugId,
  shouldDeferTripleInhalerToCopd
} from './helpers';

export const asthmaSupportAndActionPlanRules: Rule[] = [
  asthmaRule({
    id: 'asthma.outpatient.profile_diff_vietnam',
    setting: 'outpatient',
    nameVi: 'Lưu ý bảo hiểm y tế & chọn lựa bình hít sẵn có tại Việt Nam (Hồ sơ VN)',
    citationIds: [
      'gina.asthma.2026.track1_preferred',
      'byt.asthma.2020.ics_laba_vn_strengths',
      'byt.asthma.2020.no_saba_monotherapy'
    ],
    when: (ctx) =>
      ctx.settings.profile === 'VN' &&
      isAdultOrAdolescent(ctx) &&
      !evaluateAcuteAsthma(ctx).hasAcuteAttack,
    produce: (ctx): Recommendation => {
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      return {
        id: 'rec_asthma_profile_diff_vietnam',
        module: 'asthma',
        tier: 'Thực hành tại Việt Nam & Dự phòng',
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 75, // qa-allow: index - độ ưu tiên thông tin bổ trợ
        action: 'MONITOR',
        title: 'Thực hành tại Việt Nam (BYT QĐ 1851/2020): Lựa chọn thuốc theo tuyến BHYT & thiết bị hít',
        rationale: milkAllergy
          ? 'Tại Việt Nam, trên người bệnh dị ứng nặng đạm sữa bò, tuyệt đối tránh kê Symbicort Turbuhaler, Seretide Accuhaler hoặc Relvar Ellipta (bình bột khô chứa lactose); cần ghi rõ trên đơn thuốc dạng bình xịt định liều pMDI không chứa lactose (Symbicort Rapihaler pMDI, Foster pMDI, Seretide Evohaler pMDI, Ventolin Evohaler pMDI) kèm buồng đệm.'
          : 'Theo Quyết định 1851/QĐ-BYT (2020), Budesonide/formoterol (Symbicort Turbuhaler / Rapihaler) và Beclometasone/formoterol (Foster — người ≥ 18 tuổi) là lựa chọn ưu tiên hàng đầu cho AIR/MART. Tại tuyến y tế cơ sở nếu danh mục BHYT chưa có sẵn ICS-formoterol, tuyệt đối không để bệnh nhân chỉ dùng Salbutamol đơn thuần mà chuyển sang Track 2 (ICS đơn chất hoặc Fluticasone/salmeterol + Salbutamol kèm ICS).',
        profileDiff: {
          INTL: 'GINA 2026 ưu tiên Track 1 (ICS-formoterol làm thuốc cắt cơn ở mọi bậc 1–5) để giảm tối đa nguy cơ đợt cấp nặng.',
          VN: 'Bộ Y tế QĐ 1851/2020 đồng thuận ưu tiên ICS-formoterol từ Bậc 1; linh hoạt Track 2 (Fluticasone/salmeterol, Budesonide/Fluticasone đơn chất) theo danh mục BHYT từng hạng bệnh viện.'
        },
        gates: [],
        citationIds: [
          'gina.asthma.2026.track1_preferred',
          'byt.asthma.2020.ics_laba_vn_strengths',
          'byt.asthma.2020.no_saba_monotherapy'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.outpatient.smoking_and_vaccines',
    setting: 'outpatient',
    nameVi: 'Can thiệp không dùng thuốc: Cai thuốc lá, kiểm soát môi trường & Tiêm vắc-xin phòng bệnh hô hấp',
    citationIds: [
      'gina.asthma.2026.smoking_cessation',
      'gina.asthma.2026.vaccination_influenza',
      'byt.asthma.2021.action_plan_zones'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const ci = ctx.patient.customInputs ?? {};
      const isSmoker = ci.smokingStatus === 'current' || hasCondition(ctx, 'smoker');
      if (ctx.patient.selectedModules.includes('copd') && !isSmoker) return false;
      return true;
    },
    produce: (ctx): Recommendation => {
      const ci = ctx.patient.customInputs ?? {};
      const isSmoker = ci.smokingStatus === 'current' || hasCondition(ctx, 'smoker');
      const hasCopd = ctx.patient.selectedModules.includes('copd');

      return {
        id: 'rec_asthma_nonpharm_smoking_vaccine',
        module: 'asthma',
        tier: 'Thực hành tại Việt Nam & Dự phòng',
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 70, // qa-allow: index - độ ưu tiên dự phòng
        action: 'MONITOR',
        title: isSmoker
          ? 'Tư vấn cai thuốc lá / thuốc lào tích cực (khói thuốc gây kháng ICS) & Tiêm phòng vắc-xin hô hấp'
          : 'Dự phòng đợt cấp không dùng thuốc: Tiêm phòng Cúm hàng năm, Phế cầu, COVID-19, RSV & Tránh dị nguyên',
        rationale: `${isSmoker ? 'Hút thuốc lá/thuốc lào làm tăng viêm trung tính đường thở, gây kháng Corticosteroid hít (giảm hiệu quả ICS) và tăng tốc độ suy giảm FEV₁ — cần tư vấn cai thuốc lá kết hợp hỗ trợ dược lý tại mọi lần khám. ' : ''}${hasCopd ? 'Tránh phơi nhiễm bụi nghề nghiệp, khói sinh khối và kiểm tra vệ sinh buồng đệm định kỳ.' : 'GINA 2026 khuyến cáo tiêm vắc-xin Cúm mùa hàng năm, Phế cầu, COVID-19 và RSV (cho người lớn tuổi hoặc có bệnh đồng mắc), kết hợp súc miệng sau mỗi lần hít ICS để ngừa nấm họng.'}`,
        gates: [],
        citationIds: [
          'gina.asthma.2026.smoking_cessation',
          'gina.asthma.2026.vaccination_influenza',
          'byt.asthma.2021.action_plan_zones'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.outpatient.modifiable_comorbidities',
    setting: 'outpatient',
    nameVi: 'Tối ưu hóa điều trị bệnh đồng mắc đường hô hấp trên, GERD và béo phì để cải thiện kiểm soát hen',
    citationIds: ['gina.asthma.2026.slit_hdm_fev1_70', 'gina.asthma.2026.sustained_step_up_2_3_months'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx)) return false;
      if (evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const bmi = need(ctx, 'bmi');
      const obesityBmi = 30; // qa-allow: unit-conversion - ngưỡng BMI béo phì quốc tế 30 kg/m²
      return (
        hasCustomCond(ctx, 'allergicRhinitis') ||
        hasCustomCond(ctx, 'gerd') ||
        hasCustomCond(ctx, 'obesity') ||
        (bmi !== undefined && bmi >= obesityBmi)
      );
    },
    produce: (ctx): Recommendation => {
      const fev1 = need(ctx, 'fev1Pct');
      const slitMinFev1 = thFor('fev1_pct', 'asthma.slit.min_fev1_pct');
      const hasRhinitis = hasCustomCond(ctx, 'allergicRhinitis');
      const hasGerd = hasCustomCond(ctx, 'gerd');
      const bmi = need(ctx, 'bmi');
      const obesityBmi = 30; // qa-allow: unit-conversion - ngưỡng BMI béo phì 30 kg/m²
      const hasObesity = hasCustomCond(ctx, 'obesity') || (bmi !== undefined && bmi >= obesityBmi);

      const parts: string[] = [];
      if (hasRhinitis) {
        const slitEligible = fev1 !== undefined && fev1 > slitMinFev1;
        parts.push(
          `Viêm mũi dị ứng / viêm mũi xoang mạn: Điều trị Corticosteroid xịt mũi đều đặn để giảm triệu chứng đường thở thống nhất${slitEligible ? `; do FEV₁ > ${slitMinFev1}% dự đoán, nếu mẫn cảm mạt bụi nhà (HDM) còn triệu chứng dù đã dùng ICS có thể cân nhắc miễn dịch trị liệu dưới lưỡi (HDM-SLIT) theo GINA 2026` : fev1 !== undefined ? ` (hiện FEV₁ ≤ ${slitMinFev1}% dự đoán nên CHƯA chỉ định miễn dịch trị liệu SLIT mạt bụi nhà)` : ''}`
        );
      }
      if (hasGerd) {
        parts.push(
          'Trào ngược dạ dày - thực quản (GERD): Điều trị PPI và thay đổi lối sống (kê cao đầu giường, tránh ăn khuya) khi có triệu chứng trào ngược rõ; không dùng PPI thực nghiệm nếu hoàn toàn không có triệu chứng tiêu hóa'
        );
      }
      if (hasObesity) {
        parts.push(
          'Béo phì: Chương trình giảm 5–10% cân nặng kết hợp vận động thể lực đều đặn giúp cải thiện đáng kể kiểm soát triệu chứng hen và chức năng hô hấp'
        );
      }

      return {
        id: 'rec_asthma_comorbidities_rhinitis_gerd_obesity',
        module: 'asthma',
        tier: 'Thực hành tại Việt Nam & Dự phòng',
        tierOrder: 4, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 72, // qa-allow: index - độ ưu tiên kiểm soát bệnh đồng mắc
        action: 'CONSIDER',
        title: 'Kiểm soát tích cực bệnh lý đồng mắc (Viêm mũi dị ứng / GERD / Béo phì) để giảm gánh nặng đợt cấp hen',
        rationale: parts.join(' · ') + '.',
        gates: [],
        citationIds: ['gina.asthma.2026.slit_hdm_fev1_70', 'gina.asthma.2026.sustained_step_up_2_3_months']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.outpatient.action_plan_generator',
    setting: 'both',
    nameVi: 'Tự động cấp Bản Kế hoạch Hành động Hen phế quản Tiếng Việt cá thể hóa (Vùng Xanh – Vàng – Đỏ)',
    citationIds: ['byt.asthma.2021.action_plan_zones', 'byt.asthma.2021.action_plan_yellow_50_79'],
    when: (ctx) => {
      if (cypControllerBridge(ctx)) return false;
      if (!isAdultOrAdolescent(ctx) || isMartOveruse(ctx)) return false;
      if (shouldDeferTripleInhalerToCopd(ctx)) return false;
      const acute = evaluateAcuteAsthma(ctx);
      if (ctx.settings.setting === 'inpatient') {
        return acute.isDischargeReady;
      }
      if (evaluateGinaControl(ctx).level === 'missing') return false;
      return !acute.hasAcuteAttack;
    },
    produce: (ctx): Recommendation | null => {
      const ci = ctx.patient.customInputs ?? {};
      const isInpatientDischarge = ctx.settings.setting === 'inpatient';
      const isTrack2 = !isInpatientDischarge && ci.currentTrack === 'track2';
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const milkAllergy = hasSevereMilkProteinAllergy(ctx);
      const strongCyp = hasStrongCyp3a4Inhibitor(ctx);
      const isRap80 = isUsingRapihaler80(ctx);
      const age = need(ctx, 'age');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');

      const pefBestLMin = typeof ci.pefBestLMin === 'number' ? ci.pefBestLMin : undefined;
      const pefPct = typeof ci.pefPct === 'number' ? ci.pefPct : undefined;

      const safeTriple = ctx.patient.currentMeds.find((m) => {
        const id = resolveKbDrugId(m.drugId);
        if (!TRIPLE_INHALER_DRUGS.has(id)) return false;
        if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(id)) return false;
        if (milkAllergy && DPI_ONLY_LACTOSE_DRUGS.has(id)) return false;
        if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(id)) return false;
        if (isAllergicToDrug(ctx, id)) return false;
        return true;
      });

      let controllerDrug: string;
      let controllerDrugId: string;
      let relieverDrug: string;
      let maintDose: string;

      if (safeTriple) {
        const id = safeTriple.drugId.toLowerCase();
        controllerDrugId = id;
        const isTrimbow = id.includes('beclometasone') || id === 'trimbow';
        controllerDrug = safeTriple.name || safeTriple.drugId;
        relieverDrug = isTrack2
          ? 'Salbutamol pMDI 100 mcg (qua buồng đệm)'
          : isTrimbow
            ? 'Beclometasone/formoterol 100/6 mcg'
            : 'Budesonide/formoterol 160/4.5 mcg';
        maintDose = safeTriple.dose
          ? String(safeTriple.dose)
          : 'Liều chuẩn Bậc 5 hàng ngày theo chỉ định chuyên khoa';
      } else if (isTrack2) {
        const effStep = computeEffectiveTrack2Step(ctx);
        if (effStep <= 2) { // qa-allow: ui-step - Bậc 1–2 Track 2
          const monoId = resolveTrack2MonoIcsDrugId(ctx);
          const hasExistingLabaStepDown =
            effStep === 2 &&
            typeof ci.currentStep === 'number' &&
            ci.currentStep === 3 &&
            ctx.patient.currentMeds.some((m) => TRACK2_ICS_LABA_DRUGS.has(m.drugId.toLowerCase()));
          if (hasExistingLabaStepDown) {
            const labaId = resolveTrack2IcsLabaDrugId(ctx);
            controllerDrugId = labaId;
            controllerDrug =
              labaId === 'fluticasone_vilanterol'
                ? 'Fluticasone furoate/vilanterol (Relvar)'
                : labaId === 'mometasone_formoterol'
                  ? 'Mometasone/formoterol (Dulera pMDI)'
                  : milkAllergy
                    ? 'Seretide Evohaler pMDI (không chứa lactose)'
                    : 'Fluticasone/salmeterol (Seretide)';
            maintDose = 'Giảm 50% liều ICS-LABA hoặc dùng 1 lần/ngày (hạ bậc an toàn)';
          } else {
            controllerDrugId = monoId;
            controllerDrug =
              monoId === 'budesonide'
                ? milkAllergy
                  ? 'Budesonide pMDI (không chứa lactose)'
                  : 'Budesonide'
                : monoId === 'beclometasone'
                  ? 'Beclometasone pMDI'
                  : milkAllergy
                    ? 'Fluticasone propionate Evohaler pMDI (không chứa lactose)'
                    : 'Fluticasone propionate';
            maintDose = MONO_ICS_DRUGS.has(monoId) ? 'Liều thấp hàng ngày theo đơn bác sĩ' : 'Theo đơn bác sĩ';
          }
        } else {
          const labaId = resolveTrack2IcsLabaDrugId(ctx);
          controllerDrugId = labaId;
          if (labaId === 'fluticasone_vilanterol') {
            controllerDrug = 'Fluticasone furoate/vilanterol (Relvar Ellipta)';
            maintDose = effStep >= 5 ? '184/22 mcg x 1 nhát/ngày' : '92/22 mcg x 1 nhát/ngày'; // qa-allow: ui-step - phân biệt hàm lượng Bậc 5
          } else if (labaId === 'mometasone_formoterol') {
            controllerDrug = 'Mometasone/formoterol (Dulera pMDI)';
            maintDose = effStep >= 4 ? '200/5 mcg x 2 nhát x 2 lần/ngày' : '100/5 mcg x 2 nhát x 2 lần/ngày'; // qa-allow: ui-step - phân biệt hàm lượng Bậc 4–5
          } else {
            controllerDrug = milkAllergy
              ? 'Fluticasone/salmeterol (Seretide Evohaler pMDI — không chứa lactose)'
              : 'Fluticasone/salmeterol (Seretide)';
            maintDose =
              effStep >= 5 // qa-allow: ui-step - Bậc 5 liều cao
                ? milkAllergy
                  ? '250/25 mcg Evohaler pMDI x 2 nhát x 2 lần/ngày'
                  : '500/50 mcg x 1 nhát x 2 lần/ngày'
                : effStep === 4
                  ? milkAllergy
                    ? '125/25 mcg Evohaler pMDI x 2 nhát x 2 lần/ngày'
                    : '250/50 mcg x 1 nhát x 2 lần/ngày'
                  : '100/50 – 250/50 mcg x 1 nhát x 2 lần/ngày';
          }
        }
        relieverDrug = 'Salbutamol pMDI 100 mcg (qua buồng đệm)';
      } else {
        const martId = resolveTrack1MartDrugId(ctx);
        controllerDrugId = martId;
        const isFost = martId === 'beclometasone_formoterol';
        const effStep = isInpatientDischarge ? 4 : computeEffectiveTrack1Step(ctx);

        if (isFost) {
          controllerDrug = milkAllergy
            ? 'Beclometasone/formoterol 100/6 mcg (Foster pMDI — không chứa lactose)'
            : 'Beclometasone/formoterol 100/6 mcg (Foster)';
        } else if (milkAllergy || isRap80) {
          const strength = isRap80 ? '80/2.25 mcg' : '160/4.5 mcg';
          controllerDrug = `Budesonide/formoterol ${strength} (Symbicort Rapihaler pMDI — không chứa lactose)`;
        } else {
          controllerDrug = 'Budesonide/formoterol 160/4.5 mcg';
        }
        relieverDrug = controllerDrug;

        if (effStep <= 2) { // qa-allow: ui-step - chế độ AIR Bậc 1–2
          maintDose = isRap80
            ? 'Không dùng cố định hàng ngày (xịt 2 nhát mỗi khi có triệu chứng — chế độ AIR)'
            : 'Không dùng cố định hàng ngày (dùng 1 nhát mỗi khi có triệu chứng — chế độ AIR)';
        } else if (effStep === 3) {
          maintDose = isRap80 ? '2 nhát x 1–2 lần/ngày' : '1 nhát x 1–2 lần/ngày';
        } else {
          maintDose = isRap80 ? '4 nhát x 2 lần/ngày' : '2 nhát x 2 lần/ngày';
        }
      }

      // A patient handout must not reintroduce a controller excluded by the safety rules.
      // Selection of a replacement prescription is handled separately by controller rules.
      if (isAllergicToDrug(ctx, controllerDrugId)) return null;
      if (strongCyp && CYP3A4_SENSITIVE_ICS_LABA_DRUGS.has(controllerDrugId)) return null;
      if (age !== undefined && age < minAdult18 && ADULT_18_ONLY_DRUGS.has(controllerDrugId)) return null;

      const planText = generateAsthmaActionPlanVi({
        patientName: ctx.patient.name,
        track: isTrack2 ? 'track2' : 'track1',
        controllerDrug,
        relieverDrug,
        maintenanceDose: maintDose,
        relieverInstructions: isTrack2
          ? '2–4 nhát Salbutamol pMDI qua buồng đệm khi khó thở'
          : isRap80
            ? `2 nhát khi cần (tối đa ${maxPuffs} nhát/ngày)`
            : `1 nhát khi cần (tối đa ${maxPuffs} nhát/ngày)`,
        pefBestLMin,
        pefPct,
        lactoseFreePmdiOnly: milkAllergy,
        isRapihaler80: isRap80,
        isAcuteDischargePef: isInpatientDischarge
      });

      return {
        id: 'rec_asthma_action_plan_doc',
        module: 'asthma',
        tier: 'Kế hoạch Hành động Hen (3 Vùng màu)',
        tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 80, // qa-allow: index - độ ưu tiên bản kế hoạch hành động
        action: 'MONITOR',
        title: 'Bản Kế hoạch Hành động Hen phế quản (Vùng Xanh – Vàng – Đỏ) giao cho người bệnh',
        rationale: planText,
        gates: [],
        citationIds: ['byt.asthma.2021.action_plan_zones', 'byt.asthma.2021.action_plan_yellow_50_79']
      };
    }
  })
];
