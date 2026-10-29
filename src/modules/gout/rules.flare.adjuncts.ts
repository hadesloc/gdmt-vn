/**
 * GDMT-VN Gout Module - Acute Flare Adjuncts (Polyarticular Combo, PPI Protection, Ice & Continue-ULT)
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  NSAID_DRUG_IDS,
  NON_GOUT_CONTINUABLE_NSAID_IDS,
  PPI_DRUG_IDS,
  LOW_DOSE_ASPIRIN_IDS,
  ULT_DRUG_IDS,
  isOnMed,
  findMed,
  findAllMeds,
  hasAmbiguousCountMedDose,
  isPregnant,
  isAcuteGoutFlare,
  isSeverePolyarticularFlare,
  isMonoarthritisLargeJoint,
  isUnableToTakeOral,
  isSepticArthritisOrFeverRedFlag,
  hasSevereUncontrolledHyperglycemia,
  isSteroidContraindicated,
  isDkaSuspected,
  isOnDialysis,
  isNsaidAvoidedInGout,
  checkColchicineSafety,
  isAllopurinolBeingStopped,
  isFebuxostatBeingStopped,
  isProbenecidContraindicated,
  isBenzbromaroneContraindicated,
  doesUltExceedSafetyCap,
  isUltNewlyStartedOrUptitrated
} from './helpers';
import { shouldStopActiveNsaid } from './rules.safety.antiinflam';

const TIER_FLARE = 'Xử trí cơn gút cấp';

export function isLateFlarePresentation(ctx: RuleContext): boolean {
  const onsetHours = ctx.normalized.customInputs?.flareHoursSinceOnset;
  const earlyColchHours = thFor('duration_hours', 'gout.flare.colchicine_early_hours');
  return typeof onsetHours === 'number' && onsetHours > earlyColchHours * 3; // qa-allow: unit-conversion - quá 36h (3 x 12h)
}

function isUltSafeToContinueAtCurrentDoseDuringFlare(ctx: RuleContext, ultId: string): boolean {
  const id = ultId.toLowerCase();
  if (!isOnMed(ctx, [id])) return false;
  if (doesUltExceedSafetyCap(ctx, id)) return false;
  if (hasAmbiguousCountMedDose(findMed(ctx, [id]))) return false;
  if (id === 'allopurinol') return !isAllopurinolBeingStopped(ctx);
  if (id === 'febuxostat') return !isFebuxostatBeingStopped(ctx);
  if (id === 'probenecid') return !isProbenecidContraindicated(ctx);
  if (id === 'benzbromarone') return ctx.settings.profile !== 'US' && !isBenzbromaroneContraindicated(ctx);
  return false;
}

const perDrugContinueUltDuringFlareRules: Rule[] = ULT_DRUG_IDS.map((ultId) =>
  goutRule({
    id: `gout.acute_flare.continue_ult_${ultId}`,
    nameVi: `Nguyên tắc vàng: Tiếp tục duy trì ${ultId} an toàn đang dùng trong cơn gút cấp`,
    citationIds: ['acr.gout.2020.start_ult_during_flare', 'eular.gout.2016.allopurinol_titration'],
    when: (ctx) =>
      isAcuteGoutFlare(ctx) &&
      !isPregnant(ctx) &&
      isUltSafeToContinueAtCurrentDoseDuringFlare(ctx, ultId),
    produce: (ctx): Recommendation | null => {
      const med = findMed(ctx, [ultId]);
      if (!med?.drugId) return null;
      const allSafeUlts = ULT_DRUG_IDS.filter((u) => isUltSafeToContinueAtCurrentDoseDuringFlare(ctx, u));
      const isPrimaryUlt = allSafeUlts[0] === ultId;
      const doseUnit = med.unit ? med.unit : 'mg';
      const doseDisplay =
        med.dose !== undefined && med.dose !== null && String(med.dose).trim() !== ''
          ? /\b(mg|g|mcg)\b/i.test(String(med.dose))
            ? String(med.dose).trim()
            : `${med.dose} ${doseUnit}`.trim()
          : undefined;

      return goutRec({
        id: isPrimaryUlt ? 'rec_gout_continue_ult_during_flare' : `rec_gout_continue_ult_during_flare_${ultId}`,
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 89, // qa-allow: index - độ ưu tiên duy trì ULT
        action: 'CONTINUE',
        drugId: ultId,
        dose: doseDisplay,
        title: `TIẾP TỤC ${ultId} ở liều an toàn hiện tại (KHÔNG tự ý ngừng thuốc hạ urat trong cơn gút cấp)`,
        rationale:
          'Ngừng đột ngột thuốc hạ acid uric máu đang dung nạp an toàn làm nồng độ urat huyết thanh dao động mạnh, khiến cơn gút cấp kéo dài hơn hoặc bùng phát lan sang các khớp khác.',
        citationIds: ['acr.gout.2020.start_ult_during_flare', 'eular.gout.2016.allopurinol_titration']
      });
    }
  })
);

export const goutFlareAdjunctRules: Rule[] = [
  goutRule({
    id: 'gout.acute_flare.severe_polyarticular_combo',
    nameVi: 'Hướng dẫn phối hợp thuốc chống viêm trong cơn gút cấp đặc biệt nặng hoặc viêm đa khớp (EULAR 2016 Rec 2)',
    citationIds: ['eular.gout.2016.flare_combination_severe', 'acr.gout.2020.flare_first_line'],
    when: (ctx) =>
      isAcuteGoutFlare(ctx) &&
      isSeverePolyarticularFlare(ctx) &&
      !isPregnant(ctx) &&
      !isSepticArthritisOrFeverRedFlag(ctx) &&
      (need(ctx, 'egfr') !== undefined || isOnDialysis(ctx)),
    produce: (ctx): Recommendation => {
      const colchOk = !checkColchicineSafety(ctx).avoidFlare && !isLateFlarePresentation(ctx);
      const nsaidOk = !isNsaidAvoidedInGout(ctx).avoid;
      const steroidOk =
        !isSteroidContraindicated(ctx) && !isDkaSuspected(ctx) && !hasSevereUncontrolledHyperglycemia(ctx);

      if (colchOk && (nsaidOk || steroidOk)) {
        const pairText =
          steroidOk && !nsaidOk
            ? 'Colchicine liều thấp + Corticosteroid đường uống/tiêm nội khớp'
            : 'Colchicine liều thấp + NSAID hoặc Colchicine liều thấp + Corticosteroid đường uống';
        return goutRec({
          id: 'rec_gout_polyarticular_combination_note',
          tier: TIER_FLARE,
          tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 84, // qa-allow: index - độ ưu tiên đa khớp
          action: 'CONSIDER',
          title: `Cơn gút cấp nặng / viêm đa khớp: Cân nhắc phác đồ phối hợp sớm (${pairText})`,
          rationale:
            'Theo EULAR 2016 (Khuyến cáo 2), ở bệnh nhân cơn gút cấp đau dữ dội hoặc tổn thương đa khớp / nhiều khớp lớn, có thể phối hợp ngay từ đầu Colchicine liều thấp với NSAID hoặc Colchicine liều thấp với Corticosteroid khi từng thuốc không có chống chỉ định. CẢNH BÁO AN TOÀN: TUYỆT ĐỐI KHÔNG phối hợp NSAID + Corticosteroid đường toàn thân do tăng vọt độc tính loét – xuất huyết tiêu hóa.',
          citationIds: ['eular.gout.2016.flare_combination_severe', 'acr.gout.2020.flare_first_line']
        });
      }

      return goutRec({
        id: 'rec_gout_polyarticular_no_nsaid_steroid_combo',
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 84, // qa-allow: index - độ ưu tiên đa khớp
        action: 'MONITOR',
        title: 'Cơn gút đa khớp nặng trên nền chống chỉ định Colchicine: KHÔNG phối hợp NSAID + Corticosteroid toàn thân',
        rationale:
          'Do Colchicine không dùng được trong đợt cấp này, cần lưu ý EULAR 2016 khuyến cáo KHÔNG phối hợp đồng thời NSAID với Corticosteroid đường toàn thân vì nguy cơ xuất huyết tiêu hóa cộng hưởng. Ưu tiên tối ưu đơn trị Corticosteroid (có thể giảm liều dần 7–10 ngày kèm tiêm nội khớp các khớp lớn sưng nhiều) hoặc hội chẩn chuyên khoa xét ức chế IL-1 nếu kháng trị.',
        citationIds: ['eular.gout.2016.flare_combination_severe', 'acr.gout.2020.il1_inhibitor_flare']
      });
    }
  }),

  goutRule({
    id: 'gout.acute_flare.ppi_gastroprotection',
    nameVi: 'Phối hợp thuốc ức chế bơm proton (PPI) bảo vệ dạ dày khi dùng NSAID ở người ≥ 65 tuổi hoặc kèm Aspirin liều thấp',
    citationIds: ['byt.gout.2014.nsaid_ppi_gastroprotection_p199', 'byt.gout.2014.nsaid_gi_risk_age65_p200'],
    when: (ctx) => {
      if (isPregnant(ctx) || isOnMed(ctx, PPI_DRUG_IDS)) return false;
      const age = need(ctx, 'age');
      const giRiskAge = thFor('age', 'gout.nsaid.gi_risk_elderly_age_min');
      const hasGiRisk =
        (age !== undefined && age >= giRiskAge) ||
        isOnMed(ctx, LOW_DOSE_ASPIRIN_IDS) ||
        Boolean(ctx.normalized.customInputs?.takingLowDoseAspirin);
      if (!hasGiRisk) return false;

      if (isNsaidAvoidedInGout(ctx).avoid) return false;
      const activeContinuableNsaid = findAllMeds(ctx, NSAID_DRUG_IDS).some(
        (m) =>
          m.drugId &&
          !NON_GOUT_CONTINUABLE_NSAID_IDS.includes(m.drugId.toLowerCase()) &&
          !shouldStopActiveNsaid(ctx, m.drugId).stop
      );
      const flarePrescribesNsaid =
        isAcuteGoutFlare(ctx) &&
        !isSepticArthritisOrFeverRedFlag(ctx) &&
        !isUnableToTakeOral(ctx) &&
        !(isMonoarthritisLargeJoint(ctx) && !isSeverePolyarticularFlare(ctx) && !isSteroidContraindicated(ctx)) &&
        (checkColchicineSafety(ctx).avoidFlare || isLateFlarePresentation(ctx) || activeContinuableNsaid);
      const prophPrescribesNsaid =
        isUltNewlyStartedOrUptitrated(ctx) &&
        !isOnMed(ctx, ['colchicine']) &&
        checkColchicineSafety(ctx).avoidProphylaxis;

      return activeContinuableNsaid || flarePrescribesNsaid || prophPrescribesNsaid;
    },
    produce: () => {
      const ppiDose = thFor('dose_mg', 'gout.nsaid.ppi_omeprazole_dose_mg');
      return goutRec({
        id: 'rec_gout_ppi_gastroprotection',
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 74, // qa-allow: index - độ ưu tiên bảo vệ tiêu hóa
        action: 'CONSIDER',
        drugId: 'omeprazole',
        dose: `${ppiDose} mg x 1 lần/ngày`,
        title: `Phối hợp PPI bảo vệ dạ dày – tá tràng (Omeprazole / Esomeprazole ${ppiDose} mg/ngày) khi dùng NSAID`,
        rationale:
          'Theo Bộ Y tế QĐ 361/QĐ-BYT (tr. 199–200) và EULAR 2016, bệnh nhân cao tuổi (≥ 65 tuổi) hoặc đang dùng đồng thời Aspirin liều thấp có nguy cơ cao tổn thương loét – xuất huyết tiêu hóa khi dùng NSAID; khuyến cáo phối hợp thuốc ức chế bơm proton (PPI) trong suốt đợt dùng NSAID.',
        citationIds: ['byt.gout.2014.nsaid_ppi_gastroprotection_p199', 'byt.gout.2014.nsaid_gi_risk_age65_p200']
      });
    }
  }),

  goutRule({
    id: 'gout.acute_flare.topical_ice',
    nameVi: 'Chườm đá lạnh tại chỗ bổ trợ giảm đau – sưng khớp trong cơn gút cấp',
    citationIds: ['acr.gout.2020.topical_ice_flare'],
    when: (ctx) => isAcuteGoutFlare(ctx),
    produce: () =>
      goutRec({
        id: 'rec_gout_topical_ice_flare',
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 65, // qa-allow: index - độ ưu tiên bổ trợ
        action: 'CONSIDER',
        title: 'Biện pháp bổ trợ tại chỗ: Chườm đá lạnh và nghỉ ngơi khớp đang viêm cấp',
        rationale:
          'ACR 2020 (Table 6, PICO 31) khuyến cáo có điều kiện chườm đá lạnh tại chỗ làm biện pháp bổ trợ an toàn giúp giảm đau và sưng nóng khớp đang bùng phát cơn gút cấp.',
        citationIds: ['acr.gout.2020.topical_ice_flare']
      })
  }),

  ...perDrugContinueUltDuringFlareRules
];
