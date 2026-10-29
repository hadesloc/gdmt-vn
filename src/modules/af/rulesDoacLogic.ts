/**
 * Bộ phân giải liều DOAC hợp nhất (`computeDoacDose` + FDA US / ESC-BYT INTL-VN + tương tác CYP3A4/P-gp + `doseParser`)
 */

import type { Action, CurrentMed, Profile, RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { computeDoacDose } from '../../engine/calculators/doacDose';
import type { DoacDrug as DoacDrugId } from '../../engine/calculators/types';
import { parseDailyDoseMg, parseFrequencyPerDay, parseSingleDoseMg } from '../../engine/doseParser';
import { thFor } from '../../kb-types/access';
import {
  DABIGATRAN_PGP_CONTRA_IDS,
  EDOXABAN_PGP_INHIBITOR_IDS,
  STRONG_CYP3A4_PGP_INDUCER_IDS,
  STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS,
  getChildPugh,
  hasActiveMajorBleed,
  hasAps,
  hasCurrentMed,
  hasHepaticContraForAllDoacs,
  hasUnspecifiedLiverDisease,
  hasValvularAf,
  isAfActive,
  isAllergicToDrug
} from './rulesHelpers';

export interface AfDoacResolution {
  isContraindicated: boolean;
  isDoseReduced: boolean;
  recommendedDose?: string;
  rationaleVi: string;
  reductionCriteriaMet: string[];
}

export function isNonValvularEligibleForDoacFlow(ctx: RuleContext): boolean {
  return (
    isAfActive(ctx) &&
    !hasActiveMajorBleed(ctx) &&
    !hasValvularAf(ctx) &&
    !hasAps(ctx) &&
    !hasCondition(ctx, 'pregnant') &&
    !hasCondition(ctx, 'breastfeeding') &&
    !hasHepaticContraForAllDoacs(ctx) &&
    !hasUnspecifiedLiverDisease(ctx) &&
    !hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS)
  );
}

export function buildObesityAndHeightWarnings(ctx: RuleContext): string[] {
  const warnings: string[] = [];
  const weight = need(ctx, 'weight');
  const height = need(ctx, 'height');
  const bmi = typeof ctx.derived?.bmi === 'number' ? ctx.derived.bmi : undefined;
  if (height === undefined && weight !== undefined) {
    warnings.push('Chưa nhập chiều cao: CrCl hiện tính theo cân nặng thực tế (chưa hiệu chỉnh cân nặng ABW nếu béo phì).');
  }
  if ((bmi !== undefined && bmi >= 40) || (weight !== undefined && weight >= 120)) { // qa-allow: index - Ngưỡng béo phì độ III BMI >= 40 hoặc cân nặng >= 120 kg
    warnings.push(
      'Béo phì nặng (BMI ≥ 40 kg/m² hoặc cân nặng ≥ 120 kg): CrCl theo cân nặng thực tế có thể cao hơn đáng kể so với CrCl_ABW; ưu tiên Apixaban hoặc Rivaroxaban liều chuẩn và đối chiếu thêm CrCl_ABW.'
    );
  }
  if (ctx.derived?.crclWarning) {
    warnings.push(ctx.derived.crclWarning);
  }
  return warnings;
}

export function resolveAfDoacDose(ctx: RuleContext, drugId: DoacDrugId): AfDoacResolution {
  const profile: Profile = ctx.settings?.profile ?? 'INTL';
  const age = need(ctx, 'age');
  const weight = need(ctx, 'weight');
  const scr = need(ctx, 'scr');
  const crcl = need(ctx, 'crcl');
  const onDialysis = hasCondition(ctx, 'onDialysis');

  // Truy vết ngưỡng tiêu chí Apixaban trong KB
  void thFor('age', 'af.apixaban.criteria_age');
  void thFor('weight', 'af.apixaban.criteria_weight');
  void thFor('scr', 'af.apixaban.criteria_scr_umol');
  void thFor('scr_mgdl', 'af.apixaban.criteria_scr_mgdl');

  if (age === undefined || weight === undefined || (scr === undefined && !onDialysis) || (crcl === undefined && !onDialysis)) {
    return {
      isContraindicated: false,
      isDoseReduced: false,
      recommendedDose: undefined,
      rationaleVi: 'Thiếu thông số tuổi, cân nặng hoặc chức năng thận để tính liều DOAC.',
      reductionCriteriaMet: []
    };
  }

  if (hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS)) {
    return {
      isContraindicated: true,
      isDoseReduced: false,
      rationaleVi: 'Chống chỉ định phối hợp DOAC với chất cảm ứng mạnh P-gp/CYP3A4.',
      reductionCriteriaMet: []
    };
  }

  const cp = getChildPugh(ctx);
  if (cp === 'C' || (drugId === 'rivaroxaban' && (cp === 'B' || hasUnspecifiedLiverDisease(ctx)))) {
    return {
      isContraindicated: true,
      isDoseReduced: false,
      rationaleVi:
        cp === 'C'
          ? 'Chống chỉ định mọi DOAC ở xơ gan mất bù nặng Child-Pugh C.'
          : 'Chống chỉ định Rivaroxaban từ mức suy gan trung bình (Child-Pugh B) trở lên.',
      reductionCriteriaMet: []
    };
  }

  const onDualCypPgpInhib = hasCurrentMed(ctx, STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS);
  const onDabiPgpContra = hasCurrentMed(ctx, DABIGATRAN_PGP_CONTRA_IDS);
  const onEdoxPgpInhib = hasCurrentMed(ctx, EDOXABAN_PGP_INHIBITOR_IDS);

  if (drugId === 'rivaroxaban' && onDualCypPgpInhib) {
    return {
      isContraindicated: true,
      isDoseReduced: false,
      rationaleVi: 'Chống chỉ định Rivaroxaban khi dùng kèm thuốc ức chế mạnh kép CYP3A4 và P-gp.',
      reductionCriteriaMet: []
    };
  }

  if (drugId === 'dabigatran') {
    if (profile !== 'US' && onDabiPgpContra) {
      return {
        isContraindicated: true,
        isDoseReduced: false,
        rationaleVi: 'Chống chỉ định Dabigatran khi dùng kèm chất ức chế mạnh P-gp (dronedarone, ketoconazole, itraconazole, cyclosporine, tacrolimus).',
        reductionCriteriaMet: []
      };
    }
    if (profile === 'US') {
      const usRedMg = thFor('dose_mg', 'af.dabigatran.us_reduced_dose');
      const stdMg = thFor('dose_mg', 'af.dabigatran.standard_dose');
      const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');
      const dabi30 = thFor('crcl', 'af.dabigatran.crcl_contra');
      const mod50 = thFor('crcl', 'af.crcl.moderate_impairment_50');
      if (onDialysis || crcl === undefined || crcl < contraMin) {
        return { isContraindicated: true, isDoseReduced: false, rationaleVi: `Chống chỉ định Dabigatran khi CrCl dưới ${contraMin} mL/phút hoặc lọc máu.`, reductionCriteriaMet: [] };
      }
      if (hasCurrentMed(ctx, ['cyclosporine', 'itraconazole', 'tacrolimus'])) {
        return { isContraindicated: true, isDoseReduced: false, rationaleVi: 'Tránh phối hợp Dabigatran với cyclosporine/itraconazole/tacrolimus.', reductionCriteriaMet: [] };
      }
      if (crcl < dabi30) {
        if (onDabiPgpContra) {
          return { isContraindicated: true, isDoseReduced: false, rationaleVi: `Chống chỉ định Dabigatran khi CrCl dưới ${dabi30} mL/phút kèm thuốc ức chế P-gp.`, reductionCriteriaMet: [] };
        }
        return {
          isContraindicated: false,
          isDoseReduced: true,
          recommendedDose: `${usRedMg} mg x 2 lần/ngày`,
          rationaleVi: `Nhãn FDA Hoa Kỳ (ACC/AHA 2023 Table 13): Giảm liều Dabigatran ${usRedMg} mg x 2 lần/ngày cho CrCl ${contraMin}–${dabi30} mL/phút.`,
          reductionCriteriaMet: [`CrCl ${crcl.toFixed(1)} mL/phút (${contraMin}–${dabi30} mL/phút theo FDA)`]
        };
      }
      if (crcl <= mod50 && hasCurrentMed(ctx, ['dronedarone', 'ketoconazole'])) {
        return {
          isContraindicated: false,
          isDoseReduced: true,
          recommendedDose: `${usRedMg} mg x 2 lần/ngày`,
          rationaleVi: `Nhãn FDA Hoa Kỳ: Giảm liều Dabigatran ${usRedMg} mg x 2 lần/ngày khi CrCl ${dabi30}–${mod50} mL/phút kèm dronedarone hoặc ketoconazole.`,
          reductionCriteriaMet: [`CrCl ${crcl.toFixed(1)} mL/phút kèm Dronedarone/Ketoconazole`]
        };
      }
      return {
        isContraindicated: false,
        isDoseReduced: false,
        recommendedDose: `${stdMg} mg x 2 lần/ngày`,
        rationaleVi: `Nhãn FDA Hoa Kỳ: Dùng liều chuẩn ${stdMg} mg x 2 lần/ngày (hàm lượng 110 mg không được FDA phê duyệt cho rung nhĩ).`,
        reductionCriteriaMet: []
      };
    }
  }

  if (drugId === 'edoxaban' && crcl !== undefined && profile === 'US' && crcl > thFor('crcl', 'af.edoxaban.high_crcl_limit')) {
    const edoxMax = thFor('crcl', 'af.edoxaban.high_crcl_limit');
    return {
      isContraindicated: true,
      isDoseReduced: false,
      rationaleVi: `Cảnh báo hộp đen FDA Hoa Kỳ: Chống chỉ định Edoxaban khi CrCl trên ${edoxMax} mL/phút.`,
      reductionCriteriaMet: []
    };
  }

  const base = computeDoacDose({
    drug: drugId,
    age,
    weight,
    scr: scr ?? 0, // qa-allow: unit-conversion - Khi onDialysis=true không phụ thuộc scr đơn lẻ để phân tầng CrCl
    scrUnit: 'umol/L',
    crcl: crcl ?? 0, // qa-allow: unit-conversion - Khi onDialysis=true computeDoacDose rẽ nhánh theo onDialysis trước khi đọc crcl
    onDialysis,
    profile,
    verapamil: hasCurrentMed(ctx, ['verapamil']),
    potentPgpInhibitor: profile === 'US' && drugId === 'edoxaban' ? false : onEdoxPgpInhib,
    highBleedingRisk: hasCondition(ctx, 'bleedingHistory')
  });

  if (base.contraindicated) {
    return {
      isContraindicated: true,
      isDoseReduced: false,
      recommendedDose: undefined,
      rationaleVi: base.warning ?? 'Chống chỉ định sử dụng DOAC theo chức năng thận.',
      reductionCriteriaMet: base.reductionCriteriaMet
    };
  }

  if (drugId === 'rivaroxaban' && profile === 'US' && crcl !== undefined && crcl === thFor('crcl', 'af.crcl.moderate_impairment_50')) {
    const rivaRed = thFor('dose_mg', 'af.rivaroxaban.reduced_dose');
    return {
      isContraindicated: false,
      isDoseReduced: true,
      recommendedDose: `${rivaRed} mg x 1 lần/ngày (uống cùng bữa ăn tối)`,
      rationaleVi: `Nhãn FDA Xarelto: Giảm liều ${rivaRed} mg x 1 lần/ngày khi CrCl ≤ ${thFor('crcl', 'af.crcl.moderate_impairment_50')} mL/phút.`,
      reductionCriteriaMet: [`CrCl ${crcl.toFixed(1)} mL/phút ≤ ${thFor('crcl', 'af.crcl.moderate_impairment_50')} mL/phút (FDA)`]
    };
  }

  if (drugId === 'apixaban' && onDualCypPgpInhib) {
    if (base.isDoseReduced) {
      return {
        isContraindicated: true,
        isDoseReduced: false,
        rationaleVi: 'Tránh phối hợp Apixaban với chất ức chế mạnh kép CYP3A4/P-gp ở bệnh nhân vốn đã thuộc diện giảm liều 2.5 mg x 2 lần/ngày.',
        reductionCriteriaMet: base.reductionCriteriaMet
      };
    }
    const apixRed = thFor('dose_mg', 'af.apixaban.reduced_dose');
    return {
      isContraindicated: false,
      isDoseReduced: true,
      recommendedDose: `${apixRed} mg x 2 lần/ngày`,
      rationaleVi: `Nhãn FDA Eliquis: Giảm 50% liều Apixaban xuống ${apixRed} mg x 2 lần/ngày khi dùng kèm thuốc ức chế mạnh kép CYP3A4 và P-gp.`,
      reductionCriteriaMet: ['Đang dùng kèm thuốc ức chế mạnh kép CYP3A4 và P-gp (ketoconazole/itraconazole/ritonavir)']
    };
  }

  return {
    isContraindicated: false,
    isDoseReduced: base.isDoseReduced,
    recommendedDose: base.recommendedDose,
    rationaleVi: base.warning ?? `Phân liều chuẩn hóa theo ${base.source}.`,
    reductionCriteriaMet: base.reductionCriteriaMet
  };
}

export function selectSafeDoac(ctx: RuleContext): { drugId: DoacDrugId; resolution: AfDoacResolution } | null {
  const cp = getChildPugh(ctx);
  if (cp === 'C' || hasCondition(ctx, 'breastfeeding')) return null;

  const candidates: DoacDrugId[] =
    cp === 'B' ? ['apixaban', 'dabigatran', 'edoxaban'] : ['apixaban', 'edoxaban', 'rivaroxaban', 'dabigatran'];

  for (const id of candidates) {
    if (isAllergicToDrug(ctx, id)) continue;
    const res = resolveAfDoacDose(ctx, id);
    if (!res.isContraindicated && res.recommendedDose) {
      return { drugId: id, resolution: res };
    }
  }
  return null;
}

export function resolveDoacCurrentAction(
  drugId: DoacDrugId,
  target: AfDoacResolution,
  currentMed: CurrentMed
): { action: Action; ambiguousTabletUnit: boolean } {
  const singleMg = parseSingleDoseMg(currentMed);
  const explicitFreq = parseFrequencyPerDay(
    currentMed.freq,
    typeof currentMed.dose === 'string' ? currentMed.dose : undefined
  );
  const dailyMg = explicitFreq !== undefined ? parseDailyDoseMg(currentMed) : undefined;

  if (singleMg === undefined && dailyMg === undefined) {
    const unitLower = (currentMed.unit ?? '').trim().toLowerCase();
    const isAmbiguous = unitLower.includes('viên') || unitLower.includes('vien') || unitLower.includes('tab');
    return {
      action: target.isDoseReduced ? 'REDUCE' : 'CONTINUE',
      ambiguousTabletUnit: isAmbiguous
    };
  }

  const isBidDrug = drugId === 'apixaban' || drugId === 'dabigatran';
  const expectedDaily =
    drugId === 'apixaban'
      ? (target.isDoseReduced ? thFor('dose_mg', 'af.apixaban.reduced_dose') : thFor('dose_mg', 'af.apixaban.standard_dose')) * 2
      : drugId === 'rivaroxaban'
      ? target.isDoseReduced
        ? thFor('dose_mg', 'af.rivaroxaban.reduced_dose')
        : thFor('dose_mg', 'af.rivaroxaban.standard_dose')
      : drugId === 'edoxaban'
      ? target.isDoseReduced
        ? thFor('dose_mg', 'af.edoxaban.reduced_dose')
        : thFor('dose_mg', 'af.edoxaban.standard_dose')
      : (target.recommendedDose?.startsWith(String(thFor('dose_mg', 'af.dabigatran.us_reduced_dose')))
          ? thFor('dose_mg', 'af.dabigatran.us_reduced_dose')
          : target.isDoseReduced
          ? thFor('dose_mg', 'af.dabigatran.reduced_dose')
          : thFor('dose_mg', 'af.dabigatran.standard_dose')) * 2;

  const expectedSingle = isBidDrug ? expectedDaily / 2 : expectedDaily;
  const actualComparable = dailyMg !== undefined ? dailyMg : singleMg!;
  const targetComparable = dailyMg !== undefined ? expectedDaily : expectedSingle;

  if (isBidDrug && explicitFreq === 1 && singleMg !== undefined && Math.abs(singleMg - expectedSingle) < 0.01) {
    return { action: 'UPTITRATE', ambiguousTabletUnit: false };
  }
  if (Math.abs(actualComparable - targetComparable) < 0.05) {
    return { action: 'CONTINUE', ambiguousTabletUnit: false };
  }
  return {
    action: actualComparable > targetComparable ? 'REDUCE' : 'UPTITRATE',
    ambiguousTabletUnit: false
  };
}
