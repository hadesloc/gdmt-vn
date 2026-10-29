/**
 * Quy tắc An toàn Thận, Xơ gan Child-Pugh & Tương tác Thuốc CYP3A4/P-gp cho DOAC [A]
 * Bao phủ: Lọc máu & CrCl < 15, Dabigatran CrCl < 30, Edoxaban CrCl > 95 (US),
 * Xơ gan Child-Pugh A/B/C, cảm ứng & ức chế mạnh CYP3A4/P-gp, và chuyển đổi thuốc thay thế an toàn.
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  DABIGATRAN_PGP_CONTRA_IDS,
  DOAC_IDS,
  STRONG_CYP3A4_PGP_INDUCER_IDS,
  STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS,
  getChildPugh,
  getCleanStartDose,
  hasActiveMajorBleed,
  hasAps,
  hasCurrentMed,
  hasHepaticContraForAllDoacs,
  hasUnspecifiedLiverDisease,
  hasValvularAf,
  isAfActive,
  isAllergicToDrug
} from './rulesHelpers';
import { resolveAfDoacDose, selectSafeDoac } from './rulesDoacLogic';

const TIER_A = 'AF-CARE · [A] Dự phòng đột quỵ';

const perDrugSevereRenalStopDoacRules: Rule[] = DOAC_IDS.map((doacId) => ({
  id: `af.oac.renal_stop_${doacId}`,
  module: 'af',
  nameVi: `AF-CARE [A]: Ngừng ${drug(doacId).nameVi} khi lọc máu hoặc CrCl ngoài ngưỡng an toàn`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!isAfActive(ctx) || hasActiveMajorBleed(ctx) || hasValvularAf(ctx) || hasAps(ctx) || hasCondition(ctx, 'pregnant')) {
      return false;
    }
    if (!hasCurrentMed(ctx, [doacId])) return false;
    const profile = ctx.settings?.profile ?? 'INTL';
    const onDialysis = hasCondition(ctx, 'onDialysis');
    const crcl = need(ctx, 'crcl');
    const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');

    if (onDialysis) {
      return !(profile === 'US' && doacId === 'apixaban');
    }
    if (crcl !== undefined && crcl < contraMin) return true;
    if (doacId === 'dabigatran' && crcl !== undefined && crcl < thFor('crcl', 'af.dabigatran.crcl_contra')) {
      return profile !== 'US' || hasCurrentMed(ctx, DABIGATRAN_PGP_CONTRA_IDS);
    }
    if (doacId === 'edoxaban' && profile === 'US' && crcl !== undefined && crcl > thFor('crcl', 'af.edoxaban.high_crcl_limit')) {
      return true;
    }
    return false;
  },
  produce: (ctx): Recommendation => {
    const crcl = need(ctx, 'crcl');
    const onDialysis = hasCondition(ctx, 'onDialysis');
    const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');
    const dabiContra = thFor('crcl', 'af.dabigatran.crcl_contra');
    const edoxHigh = thFor('crcl', 'af.edoxaban.high_crcl_limit');
    const isUsEdoxHigh = doacId === 'edoxaban' && (ctx.settings?.profile ?? 'INTL') === 'US' && crcl !== undefined && crcl > edoxHigh;
    const isDabi15To29 = doacId === 'dabigatran' && !onDialysis && crcl !== undefined && crcl >= contraMin && crcl < dabiContra;

    if (isUsEdoxHigh) {
      return {
        id: 'rec_af_us_stop_edoxaban_high_crcl',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'STOP',
        drugId: 'edoxaban',
        drugNameVi: drug('edoxaban').nameVi,
        dose: undefined,
        title: `Ngừng Edoxaban (Nhãn hộp đen FDA Hoa Kỳ): Chống chỉ định khi CrCl trên ${edoxHigh} mL/phút`,
        rationale: `Cảnh báo hộp đen FDA Savaysa: Không dùng Edoxaban khi CrCl ${crcl!.toFixed(1)} > ${edoxHigh} mL/phút do giảm hiệu lực ngừa đột quỵ thiếu máu não; chuyển sang Apixaban hoặc Rivaroxaban.`,
        gates: [{ parameter: 'CrCl', passed: false, action: 'contra', value: Number(crcl!.toFixed(1)), threshold: edoxHigh, messageVi: `CrCl > ${edoxHigh} mL/phút` }],
        citationIds: ['fda.edoxaban.af_dose'],
        priority: 102
      };
    }

    if (isDabi15To29) {
      return {
        id: 'rec_af_dabigatran_contra_crcl',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'STOP',
        drugId: 'dabigatran',
        drugNameVi: drug('dabigatran').nameVi,
        dose: undefined,
        title: `Ngừng ngay Dabigatran: Chống chỉ định khi độ thanh thải CrCl dưới ${dabiContra} mL/phút`,
        rationale: `ESC 2024 (Section 6.2.1 & Table 11): Dabigatran thải trừ chủ yếu qua thận; khi CrCl ${crcl!.toFixed(1)} < ${dabiContra} mL/phút (hoặc kèm ức chế P-gp), nguy cơ tích lũy xuất huyết đe dọa tính mạng rất cao.`,
        gates: [{ parameter: 'CrCl', passed: false, action: 'contra', value: Number(crcl!.toFixed(1)), threshold: dabiContra, messageVi: `CrCl < ${dabiContra} mL/phút` }],
        citationIds: ['esc.af.2024.dabigatran_crcl_contra', 'esc.af.2024.table11_doac_dosing'],
        priority: 102
      };
    }

    return {
      id: `rec_af_stop_doac_crcl_lt15_${doacId}`,
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'STOP',
      drugId: doacId,
      drugNameVi: drug(doacId).nameVi,
      dose: undefined,
      title: onDialysis
        ? `DỪNG NGAY ${drug(doacId).nameVi}: Chống chỉ định ở bệnh nhân đang lọc máu chu kỳ`
        : `DỪNG NGAY ${drug(doacId).nameVi}: Chống chỉ định khi độ thanh thải CrCl dưới ${contraMin} mL/phút`,
      rationale: `ESC 2024 (Table 11): Khi ${onDialysis ? 'đang chạy thận nhân tạo' : `CrCl ${crcl!.toFixed(1)} < ${contraMin} mL/phút`}, ${drug(doacId).nameVi} tích lũy gây nguy cơ xuất huyết nặng; cân nhắc kháng Vitamin K theo dõi sát INR.`,
      gates: [{ parameter: onDialysis ? 'Lọc máu' : 'CrCl', passed: false, action: 'contra', value: crcl !== undefined ? Number(crcl.toFixed(1)) : undefined, threshold: contraMin, messageVi: `Chống chỉ định ${drug(doacId).nameVi}` }],
      citationIds: ['esc.af.2024.table11_doac_dosing', 'acc.af.2023.esrd_dialysis_apixaban'],
      priority: 103
    };
  },
  citationIds: ['esc.af.2024.table11_doac_dosing', 'esc.af.2024.dabigatran_crcl_contra']
}));

const perDrugHepaticAndDdiStopDoacRules: Rule[] = DOAC_IDS.map((doacId) => ({
  id: `af.oac.hepatic_ddi_stop_${doacId}`,
  module: 'af',
  nameVi: `AF-CARE [A]: Ngừng ${drug(doacId).nameVi} khi xơ gan chống chỉ định hoặc tương tác mạnh CYP3A4 / P-gp`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!isAfActive(ctx) || hasActiveMajorBleed(ctx) || hasValvularAf(ctx) || hasAps(ctx) || hasCondition(ctx, 'pregnant')) {
      return false;
    }
    if (!hasCurrentMed(ctx, [doacId])) return false;
    const cp = getChildPugh(ctx);
    if (cp === 'C') return true;
    if (doacId === 'rivaroxaban' && (cp === 'B' || hasUnspecifiedLiverDisease(ctx))) return true;
    if (hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS)) return true;
    if (doacId === 'rivaroxaban' && hasCurrentMed(ctx, STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS)) return true;
    if (doacId === 'apixaban' && hasCurrentMed(ctx, STRONG_DUAL_CYP3A4_PGP_INHIBITOR_IDS)) {
      return resolveAfDoacDose(ctx, 'apixaban').isContraindicated;
    }
    if (doacId === 'dabigatran' && hasCurrentMed(ctx, DABIGATRAN_PGP_CONTRA_IDS)) {
      return resolveAfDoacDose(ctx, 'dabigatran').isContraindicated;
    }
    return false;
  },
  produce: (ctx): Recommendation => {
    const cp = getChildPugh(ctx);
    const isHepatic = cp === 'C' || (doacId === 'rivaroxaban' && (cp === 'B' || hasUnspecifiedLiverDisease(ctx)));
    const isInducer = hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS);

    if (isHepatic) {
      return {
        id: doacId === 'rivaroxaban' ? 'rec_af_hepatic_stop_rivaroxaban' : `rec_af_hepatic_stop_${doacId}`,
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'STOP',
        drugId: doacId,
        drugNameVi: drug(doacId).nameVi,
        dose: undefined,
        title:
          cp === 'C'
            ? `DỪNG NGAY ${drug(doacId).nameVi}: Chống chỉ định tuyệt đối ở xơ gan mất bù Child-Pugh C`
            : 'DỪNG NGAY Rivaroxaban: Chống chỉ định ở suy gan Child-Pugh B–C hoặc bệnh gan có rối loạn đông máu',
        rationale:
          cp === 'C'
            ? 'ESC 2024 & Nhãn FDA/EMA: Mọi thuốc DOAC đều chống chỉ định ở xơ gan nặng Child-Pugh C do rối loạn đông máu nội sinh và tăng phơi nhiễm thuốc.'
            : 'Nhãn FDA Xarelto & ESC 2024: Rivaroxaban chống chỉ định từ mức suy gan vừa (Child-Pugh B) trở lên do AUC tăng gấp > 2 lần kèm rối loạn đông máu.',
        gates: [{ parameter: 'Child-Pugh', passed: false, action: 'contra', messageVi: `Chống chỉ định ${drug(doacId).nameVi}` }],
        citationIds: ['fda.rivaroxaban.hepatic_contra'],
        priority: 104
      };
    }

    if (isInducer) {
      return {
        id: `rec_af_inducer_stop_${doacId}`,
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'STOP',
        drugId: doacId,
        drugNameVi: drug(doacId).nameVi,
        dose: undefined,
        title: `DỪNG ${drug(doacId).nameVi}: Đang dùng chất cảm ứng mạnh CYP3A4 / P-gp làm mất hiệu lực chống đông`,
        rationale:
          'ACC/AHA 2023 & ESC 2024: Rifampin, Carbamazepine, Phenytoin, Phenobarbital và St. John’s wort làm giảm mạnh nồng độ huyết tương của mọi DOAC; cần chuyển sang kháng Vitamin K theo dõi sát INR.',
        gates: [{ parameter: 'Tương tác cảm ứng CYP3A4/P-gp', passed: false, action: 'contra', messageVi: 'Giảm mạnh nồng độ DOAC' }],
        citationIds: ['acc.af.2023.doac_strong_cyp3a4_pgp_inducers'],
        priority: 103
      };
    }

    return {
      id: `rec_af_ddi_inhibitor_stop_${doacId}`,
      module: 'af',
      tier: TIER_A,
      tierOrder: 2,
      action: 'STOP',
      drugId: doacId,
      drugNameVi: drug(doacId).nameVi,
      dose: undefined,
      title: `DỪNG ${drug(doacId).nameVi}: Tương tác thuốc ức chế mạnh P-gp / CYP3A4 gây quá liều xuất huyết`,
      rationale:
        doacId === 'dabigatran'
          ? 'ESC 2024 & ACC/AHA 2023: Chống chỉ định phối hợp Dabigatran với chất ức chế mạnh P-gp (Dronedarone, Ketoconazole, Itraconazole, Cyclosporine, Tacrolimus).'
          : 'Nhãn FDA & ACC/AHA 2023: Tránh phối hợp Rivaroxaban (hoặc Apixaban ở bệnh nhân vốn đã thuộc diện giảm liều) với thuốc ức chế mạnh kép CYP3A4 và P-gp (Ketoconazole, Itraconazole, Ritonavir).',
      gates: [{ parameter: 'Tương tác ức chế CYP3A4/P-gp', passed: false, action: 'contra', messageVi: `Chống chỉ định ${drug(doacId).nameVi}` }],
      citationIds:
        doacId === 'dabigatran'
          ? ['acc.af.2023.dabigatran_dronedarone_ketoconazole_75mg', 'esc.af.2024.table11_doac_dosing']
          : ['fda.apixaban.dual_cyp3a4_pgp_inhibitors'],
      priority: 103
    };
  },
  citationIds: ['fda.rivaroxaban.hepatic_contra', 'acc.af.2023.doac_strong_cyp3a4_pgp_inducers', 'fda.apixaban.dual_cyp3a4_pgp_inhibitors']
}));

export const afOacRenalHepaticDdiRules: Rule[] = [
  ...perDrugSevereRenalStopDoacRules,
  ...perDrugHepaticAndDdiStopDoacRules,

  {
    id: 'af.oac.contra_doac_replacement',
    module: 'af',
    nameVi: 'AF-CARE [A]: Chuyển sang thuốc chống đông thay thế an toàn sau khi ngừng DOAC bị chống chỉ định',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasActiveMajorBleed(ctx) || hasValvularAf(ctx) || hasAps(ctx)) return false;
      if (hasCondition(ctx, 'pregnant') || hasCondition(ctx, 'breastfeeding')) return false;
      if (!hasCurrentMed(ctx, DOAC_IDS) && !hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS)) return false;
      if (hasHepaticContraForAllDoacs(ctx) || hasUnspecifiedLiverDisease(ctx)) return false;
      const crcl = need(ctx, 'crcl');
      const contraMin = thFor('crcl', 'af.doac.contra_crcl_min');
      if (hasCondition(ctx, 'onDialysis') && (ctx.settings?.profile ?? 'INTL') !== 'US') return false;
      if (!hasCondition(ctx, 'onDialysis') && crcl !== undefined && crcl < contraMin) return false;
      return (
        hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS) ||
        DOAC_IDS.some((d) => hasCurrentMed(ctx, [d]) && resolveAfDoacDose(ctx, d).isContraindicated)
      );
    },
    produce: (ctx): Recommendation | null => {
      if (hasCurrentMed(ctx, STRONG_CYP3A4_PGP_INDUCER_IDS)) {
        const chosenVka = isAllergicToDrug(ctx, 'warfarin') ? 'acenocoumarol' : 'warfarin';
        if (isAllergicToDrug(ctx, chosenVka)) return null;
        const inrMin = thFor('inr', 'af.vka.target_inr_min').toFixed(1);
        const inrMax = thFor('inr', 'af.vka.target_inr_max').toFixed(1);
        return {
          id: 'rec_af_inducer_vka_switch',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'START',
          drugId: chosenVka,
          drugNameVi: drug(chosenVka).nameVi,
          dose: `${getCleanStartDose(chosenVka)} — chỉnh liều sát đạt INR ${inrMin}–${inrMax}`,
          title: `Chỉ định ${drug(chosenVka).nameVi} (khi bắt buộc dùng thuốc cảm ứng mạnh CYP3A4 / P-gp, cấm mọi DOAC)`,
          rationale:
            'ACC/AHA 2023: Do tất cả DOAC đều bị giảm mạnh nồng độ bởi chất cảm ứng mạnh P-gp/CYP3A4 (Rifampin, Phenytoin, Carbamazepine, Phenobarbital), kháng Vitamin K theo dõi INR là lựa chọn chống đông khả thi.',
          gates: [],
          citationIds: ['acc.af.2023.doac_strong_cyp3a4_pgp_inducers', 'esc.af.2024.vka_target_inr'],
          priority: 96
        };
      }

      const badDoac = DOAC_IDS.find((d) => hasCurrentMed(ctx, [d]) && resolveAfDoacDose(ctx, d).isContraindicated);
      if (!badDoac) return null;
      const alt = selectSafeDoac(ctx);
      if (!alt || alt.drugId === badDoac) return null;
      return {
        id: `rec_af_replace_contra_doac_${alt.drugId}`,
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: 'START',
        drugId: alt.drugId,
        drugNameVi: drug(alt.drugId).nameVi,
        dose: alt.resolution.recommendedDose,
        title: `Khởi trị thay thế ${drug(alt.drugId).nameVi} (sau khi ngừng ${drug(badDoac).nameVi})`,
        rationale: `${alt.resolution.rationaleVi} Uống liều ${drug(alt.drugId).nameVi} đầu tiên tại thời điểm lẽ ra dùng liều kế tiếp của ${drug(badDoac).nameVi} để không chồng liều.`,
        gates: [],
        citationIds: ['esc.af.2024.table11_doac_dosing', 'esc.af.2024.doac_preferred_over_vka'],
        priority: 95
      };
    },
    citationIds: ['esc.af.2024.table11_doac_dosing', 'acc.af.2023.doac_strong_cyp3a4_pgp_inducers']
  },

  {
    id: 'af.oac.hepatic_guidance',
    module: 'af',
    nameVi: 'AF-CARE [A]: Phân tầng chống đông ở bệnh gan mạn / xơ gan theo Child-Pugh A, B, C',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasActiveMajorBleed(ctx) &&
      !hasValvularAf(ctx) &&
      !hasAps(ctx) &&
      !hasCondition(ctx, 'pregnant') &&
      (hasHepaticContraForAllDoacs(ctx) || hasUnspecifiedLiverDisease(ctx)),
    produce: (ctx): Recommendation => {
      if (hasHepaticContraForAllDoacs(ctx)) {
        return {
          id: 'rec_af_hepatic_child_pugh_c_contra',
          module: 'af',
          tier: TIER_A,
          tierOrder: 2,
          action: 'AVOID',
          dose: undefined,
          title: 'Xơ gan nặng Child-Pugh C: Chống chỉ định tất cả các thuốc DOAC (Apixaban, Rivaroxaban, Dabigatran, Edoxaban)',
          rationale:
            'ESC 2024 & Nhãn FDA/EMA: Chống chỉ định mọi DOAC ở Child-Pugh C; hội chẩn chuyên khoa Tiêu hóa – Gan mật và Tim mạch để cá thể hóa nguy cơ huyết khối – xuất huyết.',
          gates: [{ parameter: 'Child-Pugh C', passed: false, action: 'contra', messageVi: 'Chống chỉ định mọi DOAC' }],
          citationIds: ['fda.rivaroxaban.hepatic_contra'],
          priority: 99
        };
      }
      const onNonRivaDoac = hasCurrentMed(ctx, ['apixaban', 'dabigatran', 'edoxaban']);
      return {
        id: onNonRivaDoac ? 'rec_af_hepatic_monitor_doac' : 'rec_af_hepatic_defer_oac',
        module: 'af',
        tier: TIER_A,
        tierOrder: 2,
        action: onNonRivaDoac ? 'MONITOR' : 'DEFER',
        dose: undefined,
        title: 'Bệnh gan chưa rõ phân độ: Cần đánh giá thang điểm Child-Pugh (Bilirubin, Albumin, INR, Cổ trướng) trước khi quyết định DOAC',
        rationale:
          'ESC 2024 & Nhãn FDA: Child-Pugh A dùng được mọi DOAC; Child-Pugh B chống chỉ định Rivaroxaban nhưng có thể thận trọng dùng Apixaban/Dabigatran/Edoxaban; Child-Pugh C chống chỉ định toàn bộ DOAC.',
        gates: [{ parameter: 'Phân độ Child-Pugh', passed: false, messageVi: 'Cần xác định Child-Pugh A / B / C' }],
        citationIds: ['fda.rivaroxaban.hepatic_contra'],
        priority: 92
      };
    },
    citationIds: ['fda.rivaroxaban.hepatic_contra']
  }
];
