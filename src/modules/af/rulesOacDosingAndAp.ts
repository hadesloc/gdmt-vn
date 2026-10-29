/**
 * Quy tắc Hiệu chỉnh Liều DOAC đang dùng & Quản lý Kháng tiểu cầu (ACS/PCI vs CCS ổn định) [A]
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  ALL_ANTICOAG_IDS,
  ANTIPLATELET_IDS,
  DOAC_IDS,
  type DoacDrugId,
  computeAfStrokeScore,
  findCurrentMed,
  getDrugDisplayNameVi,
  hasActiveMajorBleed,
  hasCardiacAmyloidosis,
  hasCurrentMed,
  hasHcm,
  isAfActive
} from './rulesHelpers';
import {
  buildObesityAndHeightWarnings,
  isNonValvularEligibleForDoacFlow,
  resolveAfDoacDose,
  resolveDoacCurrentAction
} from './rulesDoacLogic';

const TIER_A = 'AF-CARE · [A] Dự phòng đột quỵ';

const perDrugAntiplateletStopRules: Rule[] = ANTIPLATELET_IDS.map((apId) => {
  const apName = getDrugDisplayNameVi(apId);
  return {
    id: `af.oac.stop_${apId}_with_oac`,
    module: 'af',
    nameVi: `AF-CARE [A]: Ngừng ${apName} khi đang dùng chống đông và không có hội chứng vành cấp / PCI gần đây`,
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasCondition(ctx, 'recentAcs') &&
      !hasCondition(ctx, 'acuteAcsWithin24h') &&
      hasCurrentMed(ctx, [apId]) &&
      hasCurrentMed(ctx, ALL_ANTICOAG_IDS),
    produce: (): Recommendation => ({
      id: apId === 'aspirin' ? 'rec_af_stop_antiplatelet_with_oac' : `rec_af_stop_${apId}_with_oac`,
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'STOP',
      drugId: apId,
      drugNameVi: apName,
      dose: undefined,
      title: `Ngừng ${apName}: Không phối hợp kháng tiểu cầu với thuốc chống đông khi không có biến cố mạch vành cấp / PCI gần đây`,
      rationale:
        'Khuyến cáo Class III (ESC 2024 Rec Table 8 & CCS > 12 tháng): Phối hợp thêm thuốc chống kết tập tiểu cầu vào thuốc chống đông đường uống ở bệnh mạch vành mạn ổn định làm tăng mạnh xuất huyết nặng mà không giảm thêm huyết khối.',
      gates: [],
      citationIds: ['esc.af.2024.rec_antiplatelet_oac_harm', 'esc.af.2024.ccs_stop_antiplatelet_12m', 'esc.af.2024.aspirin_stop_when_oac'],
      priority: 92
    }),
    citationIds: ['esc.af.2024.rec_antiplatelet_oac_harm', 'esc.af.2024.ccs_stop_antiplatelet_12m']
  };
});

export const afOacDosingAndApRules: Rule[] = [
  // 1. Hiệu chỉnh liều chuẩn vs liều giảm cho DOAC đang dùng hợp lệ
  {
    id: 'af.oac.doac_dose_adjustment',
    module: 'af',
    nameVi: 'AF-CARE [A]: Hiệu chỉnh liều chuẩn vs giảm liều của thuốc DOAC đang dùng theo chức năng thận, tuổi, cân nặng và tương tác',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isNonValvularEligibleForDoacFlow(ctx)) return false;
      const procRisk = String(ctx.patient.customInputs?.plannedProcedureRisk ?? '');
      if (['low', 'low_risk', 'high', 'high_risk'].includes(procRisk)) return false;
      const activeMed = findCurrentMed(ctx, DOAC_IDS);
      if (!activeMed) return false;
      const chosen = activeMed.drugId.toLowerCase() as DoacDrugId;
      if (resolveAfDoacDose(ctx, chosen).isContraindicated) return false;

      const age = need(ctx, 'age');
      if (age !== undefined && ctx.normalized.sex !== undefined && !hasHcm(ctx) && !hasCardiacAmyloidosis(ctx) && !ctx.patient.customInputs?.afOnset) {
        const cha = computeAfStrokeScore(ctx, age);
        const isUs = (ctx.settings?.profile ?? 'INTL') === 'US';
        const isFem = ctx.normalized.sex === 'female';
        const isLow = isUs
          ? (!isFem && (cha.scoreVasc ?? cha.scoreVa) === 0) ||
            (isFem && (cha.scoreVasc ?? cha.scoreVa) <= thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_intermediate'))
          : cha.scoreVa === 0;
        if (isLow) return false;
      }
      return true;
    },
    produce: (ctx): Recommendation | null => {
      const age = need(ctx, 'age');
      const scr = need(ctx, 'scr');
      const weight = need(ctx, 'weight');
      const crcl = need(ctx, 'crcl');
      const onDialysis = hasCondition(ctx, 'onDialysis');
      if (age === undefined || ctx.normalized.sex === undefined || weight === undefined || (scr === undefined && !onDialysis) || (crcl === undefined && !onDialysis)) {
        return null;
      }

      const activeMed = findCurrentMed(ctx, DOAC_IDS)!;
      const chosenDrug = activeMed.drugId.toLowerCase() as DoacDrugId;
      const doacRes = resolveAfDoacDose(ctx, chosenDrug);
      if (doacRes.isContraindicated || !doacRes.recommendedDose) return null;

      const drugInfo = drug(chosenDrug);
      const { action, ambiguousTabletUnit } = resolveDoacCurrentAction(chosenDrug, doacRes, activeMed);
      const edoxLimit = thFor('crcl', 'af.edoxaban.high_crcl_limit');
      const isEdoxHighIntl = chosenDrug === 'edoxaban' && crcl !== undefined && crcl > edoxLimit && (ctx.settings?.profile ?? 'INTL') !== 'US';
      const blackBoxWarnMsg = isEdoxHighIntl
        ? `CẢNH BÁO HỘP ĐEN FDA: CrCl ${crcl!.toFixed(1)} mL/phút > ${edoxLimit} mL/phút làm tăng thanh thải Edoxaban, giảm hiệu lực phòng ngừa đột quỵ so với Warfarin; cân nhắc chuyển sang Apixaban hoặc Rivaroxaban.`
        : '';

      const warnings = buildObesityAndHeightWarnings(ctx);
      if (isEdoxHighIntl) warnings.unshift(blackBoxWarnMsg);
      if (ambiguousTabletUnit) {
        warnings.push(
          `Đơn thuốc hiện ghi theo đơn vị '${activeMed.unit}' chưa rõ hàm lượng mg mỗi viên: Cần đối chiếu hàm lượng viên thực tế trên vỉ thuốc để tránh quá liều hoặc thiếu liều.`
        );
      }

      const criteriaStr =
        doacRes.reductionCriteriaMet.length > 0
          ? `Tiêu chuẩn giảm liều thỏa mãn: ${doacRes.reductionCriteriaMet.join(' · ')}.`
          : 'Người bệnh không thỏa tiêu chuẩn giảm liều; bắt buộc dùng liều chuẩn đầy đủ để đạt hiệu quả ngừa đột quỵ tối ưu.';

      const titlePrefix =
        action === 'REDUCE'
          ? `Chỉ định giảm liều ${drugInfo.nameVi}`
          : action === 'UPTITRATE'
          ? `Tăng lên liều chuẩn đầy đủ ${drugInfo.nameVi}`
          : doacRes.isDoseReduced
          ? `Duy trì liều giảm hợp lý ${drugInfo.nameVi}`
          : `Chỉ định liều chuẩn ${drugInfo.nameVi}`;

      const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');
      const profile = ctx.settings?.profile ?? 'INTL';

      return {
        id: `rec_af_doac_dosing_${chosenDrug}`,
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action,
        drugId: chosenDrug,
        drugNameVi: drugInfo.nameVi,
        dose: doacRes.recommendedDose,
        title: `${titlePrefix}: ${doacRes.recommendedDose}${isEdoxHighIntl ? ' [CẢNH BÁO HỘP ĐEN]' : ''}`,
        rationale: `${doacRes.rationaleVi} ${criteriaStr}${isEdoxHighIntl ? ` ${blackBoxWarnMsg}` : ''} Tuyệt đối tránh giảm liều không đúng tiêu chuẩn vì làm tăng nguy cơ đột quỵ mà không giảm xuất huyết.`,
        warnings: warnings.length > 0 ? warnings : undefined,
        gates:
          crcl !== undefined
            ? [{ parameter: 'CrCl', passed: crcl >= contraMin, value: Number(crcl.toFixed(1)), threshold: contraMin, messageVi: `CrCl ${crcl.toFixed(1)} mL/phút` }]
            : [],
        citationIds: isEdoxHighIntl
          ? ['esc.af.2024.table11_doac_dosing', 'esc.af.2024.doac_avoid_inappropriate_reduction', 'fda.edoxaban.af_dose']
          : profile === 'US' && chosenDrug === 'dabigatran'
          ? ['acc.af.2023.table13_dabigatran_us_75mg', 'acc.af.2023.dabigatran_dronedarone_ketoconazole_75mg', 'esc.af.2024.doac_avoid_inappropriate_reduction']
          : ['esc.af.2024.table11_doac_dosing', 'esc.af.2024.doac_avoid_inappropriate_reduction'],
        priority: 90,
        profileDiff:
          chosenDrug === 'dabigatran'
            ? {
                INTL: `ESC 2024: Giảm liều ${thFor('dose_mg', 'af.dabigatran.reduced_dose')} mg x 2 lần/ngày khi ≥ ${thFor('age', 'af.apixaban.criteria_age')} tuổi, kèm Verapamil hoặc nguy cơ chảy máu cao; chống chỉ định khi CrCl < ${thFor('crcl', 'af.dabigatran.crcl_contra')} mL/phút.`,
                VN: `Việt Nam: Lưu hành viên ${thFor('dose_mg', 'af.dabigatran.standard_dose')} mg và ${thFor('dose_mg', 'af.dabigatran.reduced_dose')} mg; chống chỉ định khi CrCl < ${thFor('crcl', 'af.dabigatran.crcl_contra')} mL/phút.`,
                US: `FDA Hoa Kỳ: Không có viên ${thFor('dose_mg', 'af.dabigatran.reduced_dose')} mg cho rung nhĩ; dùng ${thFor('dose_mg', 'af.dabigatran.standard_dose')} mg x 2 lần/ngày (hoặc ${thFor('dose_mg', 'af.dabigatran.us_reduced_dose')} mg x 2 lần/ngày khi CrCl ${contraMin}–${thFor('crcl', 'af.dabigatran.crcl_contra')} mL/phút).`
              }
            : undefined
      };
    },
    citationIds: ['esc.af.2024.table11_doac_dosing', 'esc.af.2024.doac_avoid_inappropriate_reduction']
  },

  // 2. Cảnh báo Class III: Không dùng kháng tiểu cầu đơn trị thay chống đông khi chưa dùng OAC
  {
    id: 'af.oac.antiplatelet_monotherapy_avoid',
    module: 'af',
    nameVi: 'AF-CARE [A]: Chống chỉ định dùng thuốc kháng tiểu cầu đơn độc để dự phòng đột quỵ rung nhĩ',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasCondition(ctx, 'recentAcs') &&
      !hasCondition(ctx, 'acuteAcsWithin24h') &&
      hasCurrentMed(ctx, ANTIPLATELET_IDS) &&
      !hasCurrentMed(ctx, ALL_ANTICOAG_IDS),
    produce: (): Recommendation => ({
      id: 'rec_af_antiplatelet_warning',
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'AVOID',
      dose: undefined,
      title: 'Không dùng thuốc kháng tiểu cầu (Aspirin / Clopidogrel / P2Y12) đơn độc để dự phòng đột quỵ do rung nhĩ',
      rationale:
        'Khuyến cáo Class III, Mức A (ESC 2024 Rec Table 6 & ACC/AHA 2023): Thuốc chống kết tập tiểu cầu không hiệu quả trong dự phòng đột quỵ do rung nhĩ nhưng vẫn gây xuất huyết nội sọ tương đương chống đông; cần ngừng kháng tiểu cầu nếu không có chỉ định mạch máu cấp và đánh giá khởi trị OAC.',
      gates: [],
      citationIds: ['esc.af.2024.antiplatelet_not_rec', 'esc.af.2024.rec_antiplatelet_oac_harm'],
      priority: 95
    }),
    citationIds: ['esc.af.2024.antiplatelet_not_rec']
  },

  // 3. Phác đồ phối hợp OAC + Clopidogrel khi có Hội chứng vành cấp / PCI gần đây
  {
    id: 'af.oac.acs_pci_dual_therapy',
    module: 'af',
    nameVi: 'AF-CARE [A]: Phác đồ kép DOAC + Clopidogrel và ngừng sớm Aspirin sau Hội chứng vành cấp / PCI',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasActiveMajorBleed(ctx) &&
      (hasCondition(ctx, 'recentAcs') || hasCondition(ctx, 'acuteAcsWithin24h')),
    produce: (ctx): Recommendation => {
      const onPotentP2y12 = hasCurrentMed(ctx, ['ticagrelor', 'prasugrel']);
      return {
        id: 'rec_af_acs_pci_dual_therapy',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: onPotentP2y12 ? 'SWITCH' : 'CONSIDER',
        drugId: onPotentP2y12 ? 'clopidogrel' : undefined,
        drugNameVi: onPotentP2y12 ? getDrugDisplayNameVi('clopidogrel') : undefined,
        switchFrom: onPotentP2y12 ? findCurrentMed(ctx, ['ticagrelor', 'prasugrel'])?.drugId.toLowerCase() : undefined,
        dose: undefined,
        title: onPotentP2y12
          ? 'Hội chứng vành cấp / PCI kèm Rung nhĩ: Hạ bậc Ticagrelor/Prasugrel sang Clopidogrel phối hợp DOAC'
          : 'Hội chứng vành cấp / PCI kèm Rung nhĩ: Ngừng sớm Aspirin, duy trì phác đồ kép DOAC + Clopidogrel (Class I-A)',
        rationale:
          'Khuyến cáo Class I, Mức A (ESC 2024 Rec Table 8 & ACC/AHA 2023): Sau PCI hoặc ACS ở bệnh nhân rung nhĩ có chỉ định chống đông, khuyến cáo ngừng sớm Aspirin (≤ 1 tuần theo ESC hoặc 1–4 tuần theo ACC/AHA) và duy trì phác đồ kép DOAC + Clopidogrel (tránh Ticagrelor/Prasugrel); sau 12 tháng ổn định thì ngừng kháng tiểu cầu và chỉ duy trì OAC đơn trị.',
        gates: [],
        citationIds: ['esc.af.2024.acs_pci_dual_therapy', 'esc.af.2024.ccs_stop_antiplatelet_12m'],
        priority: 94,
        profileDiff: {
          INTL: 'ESC 2024 (Class I-A): Ngừng Aspirin sau ≤ 1 tuần PCI không biến chứng và duy trì DOAC + Clopidogrel tới 6–12 tháng.',
          US: 'ACC/AHA 2023: Ngừng Aspirin sau 1–4 tuần sau PCI và tiếp tục DOAC + Clopidogrel.'
        }
      };
    },
    citationIds: ['esc.af.2024.acs_pci_dual_therapy', 'esc.af.2024.ccs_stop_antiplatelet_12m']
  },

  ...perDrugAntiplateletStopRules
];
