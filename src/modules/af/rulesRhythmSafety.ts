/**
 * Quy tắc An toàn & Chống chỉ định Thuốc Chống Loạn Nhịp (AAD) [R] – Module Rung nhĩ (AF)
 * Bao phủ: Nhóm IC (Flecainide & Propafenone per-drug STOP ở CAD thực sự, HCM, HFrEF, rung nhĩ vĩnh viễn, CrCl < 35, suy gan/hen với Propafenone),
 * Dronedarone STOP (rung nhĩ vĩnh viễn, HFrEF/NYHA III–IV, bệnh gan, thai kỳ/cho con bú, tương tác Dabigatran/CYP3A4 mạnh),
 * Sotalol STOP (CrCl < 40, HFrEF, hen phế quản, rung nhĩ vĩnh viễn), QTc > 500 ms STOP, Hạ Kali máu HOLD, và Cường giáp STOP Amiodarone.
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  CLASS_IC_IDS,
  CLASS_III_AAD_IDS,
  DRONEDARONE_CYP3A4_CONTRA_IDS,
  getChildPugh,
  hasConductionBlockNoPacer,
  hasCurrentMed,
  hasHcm,
  hasHyperthyroidism,
  hasTrueCad,
  hasWpw,
  isAfActive
} from './rulesHelpers';

const TIER_R_RHYTHM = 'AF-CARE · [R] Kiểm soát nhịp';

const perDrugClassIcStopRules: Rule[] = CLASS_IC_IDS.map((icId) => ({
  id: `af.rhythm.stop_${icId}_contra`,
  module: 'af',
  nameVi: `AF-CARE [R]: Dừng khẩn cấp ${drug(icId).nameVi} khi có chống chỉ định tim mạch, thận, gan hoặc hô hấp`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!isAfActive(ctx) || !hasCurrentMed(ctx, [icId])) return false;
    const ef = need(ctx, 'lvef');
    const crcl = need(ctx, 'crcl');
    const isHfRef = ef !== undefined && ef <= thFor('lvef', 'af.rate.lvef_cutoff');
    const isPermanent = ctx.patient.customInputs?.afType === 'permanent';
    const isFlecRenal = icId === 'flecainide' && crcl !== undefined && crcl < thFor('crcl', 'af.flecainide.contra_crcl_min');
    const isPropLiverOrAsthma =
      icId === 'propafenone' &&
      (hasCondition(ctx, 'liverDisease') || getChildPugh(ctx) !== undefined || hasCondition(ctx, 'asthma'));
    return (
      hasTrueCad(ctx) ||
      hasHcm(ctx) ||
      isHfRef ||
      isPermanent ||
      isFlecRenal ||
      isPropLiverOrAsthma ||
      hasConductionBlockNoPacer(ctx)
    );
  },
  produce: (ctx): Recommendation => {
    const crcl = need(ctx, 'crcl');
    const flecMin = thFor('crcl', 'af.flecainide.contra_crcl_min');
    const isRenalReason = icId === 'flecainide' && crcl !== undefined && crcl < flecMin && !hasTrueCad(ctx);
    const isPropExtra =
      icId === 'propafenone' &&
      !hasTrueCad(ctx) &&
      (hasCondition(ctx, 'liverDisease') || getChildPugh(ctx) !== undefined || hasCondition(ctx, 'asthma'));

    return {
      id: icId === 'flecainide' ? 'rec_af_stop_class_ic_cad_hfref' : 'rec_af_stop_propafenone_contra',
      module: 'af',
      tier: TIER_R_RHYTHM,
      tierOrder: 3,
      action: 'STOP',
      drugId: icId,
      drugNameVi: drug(icId).nameVi,
      dose: undefined,
      title: isRenalReason
        ? `DỪNG NGAY Flecainide: Chống chỉ định khi độ thanh thải CrCl dưới ${flecMin} mL/phút`
        : isPropExtra
        ? 'DỪNG NGAY Propafenone: Chống chỉ định ở bệnh nhân suy gan hoặc co thắt phế quản / hen'
        : `DỪNG NGAY ${drug(icId).nameVi}: Chống chỉ định ở Bệnh mạch vành, Bệnh tim cấu trúc, Block dẫn truyền hoặc Rung nhĩ vĩnh viễn`,
      rationale: isPropExtra
        ? 'ACC/AHA 2023 (Table 23) & ESC 2024: Propafenone chuyển hóa qua gan và có hoạt tính chẹn beta giao cảm nhẹ; chống chỉ định khi có bệnh gan đáng kể hoặc hen phế quản co thắt.'
        : `Khuyến cáo Class III (ESC 2024 Rec Table 18 & Thử nghiệm CAST): Thuốc chống loạn nhịp nhóm IC gây loạn nhịp thất tử vong ở bệnh mạch vành, suy tim HFrEF, bệnh cơ tim phì đại, block dẫn truyền hoặc CrCl < ${flecMin} mL/phút (với Flecainide), và cấm duy trì khi đã chuyển sang rung nhĩ vĩnh viễn.`,
      gates: [
        {
          parameter: isRenalReason ? 'CrCl' : 'Chống chỉ định nhóm IC',
          passed: false,
          action: 'contra',
          value: isRenalReason && crcl !== undefined ? Number(crcl.toFixed(1)) : undefined,
          threshold: isRenalReason ? flecMin : undefined,
          messageVi: `Chống chỉ định tuyệt đối ${drug(icId).nameVi}`
        }
      ],
      citationIds: isPropExtra
        ? ['acc.af.2023.table23_propafenone_liver', 'esc.af.2024.aad_flecainide_propafenone']
        : ['esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.flecainide_crcl_35'],
      priority: 103
    };
  },
  citationIds: ['esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.flecainide_crcl_35', 'acc.af.2023.table23_propafenone_liver']
}));

const perDrugQtcAndHypokalemiaRules: Rule[] = CLASS_III_AAD_IDS.map((aadId) => ({
  id: `af.rhythm.qtc_k_safety_${aadId}`,
  module: 'af',
  nameVi: `AF-CARE [R]: Ngừng / Tạm ngưng ${drug(aadId).nameVi} khi kéo dài QTc > 500 ms hoặc hạ Kali máu`,
  setting: 'both',
  profiles: ['INTL', 'VN', 'US'],
  when: (ctx) => {
    if (!isAfActive(ctx) || hasWpw(ctx) || !hasCurrentMed(ctx, [aadId])) return false;
    const qtc = ctx.normalized.qtc ?? ctx.patient.qtc;
    const k = need(ctx, 'k');
    const qtcMax = thFor('qtc', 'af.aad.qtc_contra_max');
    const kMin = thFor('k', 'hf.digoxin.k_min');
    return (qtc !== undefined && qtc > qtcMax) || (k !== undefined && k < kMin);
  },
  produce: (ctx): Recommendation => {
    const qtc = ctx.normalized.qtc ?? ctx.patient.qtc;
    const k = need(ctx, 'k');
    const qtcMax = thFor('qtc', 'af.aad.qtc_contra_max');
    const kMin = thFor('k', 'hf.digoxin.k_min');
    const isQtc = qtc !== undefined && qtc > qtcMax;

    return {
      id: isQtc ? `rec_af_stop_${aadId}_qtc500` : `rec_af_hold_${aadId}_hypokalemia`,
      module: 'af',
      tier: TIER_R_RHYTHM,
      tierOrder: 3,
      action: isQtc ? 'STOP' : 'HOLD',
      drugId: aadId,
      drugNameVi: drug(aadId).nameVi,
      dose: undefined,
      title: isQtc
        ? `DỪNG NGAY ${drug(aadId).nameVi}: Khoảng QTc kéo dài nguy hiểm (${qtc} > ${qtcMax} ms — nguy cơ Xoắn đỉnh)`
        : `TẠM NGƯNG ${drug(aadId).nameVi}: Hạ Kali máu (K+ ${k} < ${kMin} mmol/L — nguy cơ Xoắn đỉnh)`,
      rationale: isQtc
        ? `ESC 2024 (Table 13) & Nhãn FDA: Khi khoảng QTc vượt quá ${qtcMax} ms, nguy cơ xoắn đỉnh (Torsades de Pointes) và rung thất tăng vọt; bắt buộc ngừng ngay thuốc chống loạn nhịp nhóm III và kiểm tra điện giải (K+, Mg2+).`
        : `ESC 2024 & ACC/AHA 2023: Hạ Kali máu làm tăng mạnh nguy cơ xoắn đỉnh do ${drug(aadId).nameVi}; bắt buộc tạm ngưng thuốc và bù Kali/Magnesi ngay.`,
      gates: [
        {
          parameter: isQtc ? 'QTc' : 'Kali máu',
          passed: false,
          action: isQtc ? 'contra' : 'hold',
          value: isQtc ? qtc : k,
          threshold: isQtc ? qtcMax : kMin,
          messageVi: isQtc ? `QTc ${qtc} > ${qtcMax} ms` : `K+ ${k} < ${kMin} mmol/L`
        }
      ],
      citationIds: ['esc.af.2024.qtc_500_conduction_contra', 'fda.dronedarone.contra_qtc500_hepatic'],
      priority: 105
    };
  },
  citationIds: ['esc.af.2024.qtc_500_conduction_contra', 'fda.dronedarone.contra_qtc500_hepatic']
}));

export const afRhythmSafetyRules: Rule[] = [
  ...perDrugClassIcStopRules,
  ...perDrugQtcAndHypokalemiaRules,

  // Dronedarone STOP (PALLAS, ANDROMEDA, suy gan, thai kỳ/cho con bú, tương tác mạnh CYP3A4 / Dabigatran)
  {
    id: 'af.rhythm.stop_dronedarone_contra',
    module: 'af',
    nameVi: 'AF-CARE [R]: Dừng khẩn cấp Dronedarone khi rung nhĩ vĩnh viễn, HFrEF/NYHA III–IV, bệnh gan, thai kỳ/cho con bú hoặc tương tác thuốc',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || !hasCurrentMed(ctx, ['dronedarone'])) return false;
      const ef = need(ctx, 'lvef');
      const isPermanent = ctx.patient.customInputs?.afType === 'permanent';
      const isHfRef = ef !== undefined && ef <= thFor('lvef', 'af.rate.lvef_cutoff');
      const isSevereNyha = ctx.normalized.nyha === 3 || ctx.normalized.nyha === 4;
      const hasLiver = hasCondition(ctx, 'liverDisease') || getChildPugh(ctx) !== undefined;
      const isPregOrLac = hasCondition(ctx, 'pregnant') || hasCondition(ctx, 'breastfeeding');
      const hasCypContra = hasCurrentMed(ctx, DRONEDARONE_CYP3A4_CONTRA_IDS);
      const hasDabiContra = hasCurrentMed(ctx, ['dabigatran']) && (ctx.settings?.profile ?? 'INTL') !== 'US';
      return isPermanent || isHfRef || isSevereNyha || hasLiver || isPregOrLac || hasCypContra || hasDabiContra;
    },
    produce: (ctx): Recommendation => {
      const isPermanent = ctx.patient.customInputs?.afType === 'permanent';
      const isPregOrLac = hasCondition(ctx, 'pregnant') || hasCondition(ctx, 'breastfeeding');
      const isDdi = hasCurrentMed(ctx, [...DRONEDARONE_CYP3A4_CONTRA_IDS, 'dabigatran']);

      return {
        id: 'rec_af_stop_dronedarone_contra',
        module: 'af',
        tier: TIER_R_RHYTHM,
        tierOrder: 3,
        action: 'STOP',
        drugId: 'dronedarone',
        drugNameVi: drug('dronedarone').nameVi,
        dose: undefined,
        title: isPermanent
          ? 'DỪNG NGAY Dronedarone: Chống chỉ định tuyệt đối trong Rung nhĩ vĩnh viễn (PALLAS)'
          : isPregOrLac
          ? 'DỪNG NGAY Dronedarone: Chống chỉ định trong thai kỳ và thời kỳ cho con bú'
          : isDdi
          ? 'DỪNG NGAY Dronedarone: Tương tác chống chỉ định với thuốc ức chế mạnh CYP3A4 hoặc Dabigatran'
          : 'DỪNG NGAY Dronedarone: Chống chỉ định ở suy tim HFrEF / NYHA III–IV hoặc bệnh gan (ANDROMEDA)',
        rationale:
          'Khuyến cáo Class III (ESC 2024 Section 7.1.3, ACC/AHA 2023 & Nhãn FDA Multaq): Dronedarone làm tăng gấp đôi tử vong và đột quỵ ở rung nhĩ vĩnh viễn (PALLAS), tăng tử vong ở suy tim HFrEF/NYHA III–IV (ANDROMEDA), gây suy gan cấp, chống chỉ định trong thai kỳ/cho con bú và cấm phối hợp chất ức chế mạnh CYP3A4 hoặc Dabigatran.',
        gates: [{ parameter: 'Chống chỉ định Dronedarone', passed: false, action: 'contra', messageVi: 'Chống chỉ định tuyệt đối Dronedarone' }],
        citationIds: [
          'esc.af.2024.dronedarone_permanent_af_contra',
          'acc.af.2023.dronedarone_hf_contra',
          'fda.dronedarone.contra_qtc500_hepatic',
          'fda.dronedarone.lactation_avoid'
        ],
        priority: 103
      };
    },
    citationIds: ['esc.af.2024.dronedarone_permanent_af_contra', 'acc.af.2023.dronedarone_hf_contra']
  },

  // Sotalol STOP (CrCl < 40, HFrEF, hen phế quản, rung nhĩ vĩnh viễn — giữ af_42)
  {
    id: 'af.rhythm.stop_sotalol_contra',
    module: 'af',
    nameVi: 'AF-CARE [R]: Dừng khẩn cấp Sotalol khi suy thận độ thanh thải thấp, HFrEF, hen phế quản hoặc rung nhĩ vĩnh viễn',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || !hasCurrentMed(ctx, ['sotalol'])) return false;
      const ef = need(ctx, 'lvef');
      const crcl = need(ctx, 'crcl');
      const isRenal = crcl !== undefined && crcl < thFor('crcl', 'af.sotalol.contra_crcl_min');
      const isHfRef = ef !== undefined && ef <= thFor('lvef', 'af.rate.lvef_cutoff');
      const hasAsthma = hasCondition(ctx, 'asthma');
      const isPermanent = ctx.patient.customInputs?.afType === 'permanent';
      return isRenal || isHfRef || hasAsthma || isPermanent;
    },
    produce: (ctx): Recommendation => {
      const crcl = need(ctx, 'crcl');
      const sotalolMin = thFor('crcl', 'af.sotalol.contra_crcl_min');
      const isRenal = crcl !== undefined && crcl < sotalolMin;
      return {
        id: 'rec_af_stop_sotalol_contra',
        module: 'af',
        tier: TIER_R_RHYTHM,
        tierOrder: 3,
        action: 'STOP',
        drugId: 'sotalol',
        drugNameVi: drug('sotalol').nameVi,
        dose: undefined,
        title: isRenal
          ? `DỪNG NGAY Sotalol: Chống chỉ định trong rung nhĩ khi CrCl dưới ${sotalolMin} mL/phút (nguy cơ xoắn đỉnh)`
          : 'DỪNG NGAY Sotalol: Chống chỉ định ở suy tim HFrEF, hen phế quản hoặc rung nhĩ vĩnh viễn',
        rationale: `ACC/AHA 2023 (Table 23) & ESC 2024: Sotalol thải trừ qua thận và có hoạt tính chẹn beta không chọn lọc kèm kéo dài QT; chống chỉ định khi CrCl < ${sotalolMin} mL/phút, LVEF ≤ ${thFor('lvef', 'af.rate.lvef_cutoff')}%, co thắt phế quản hoặc rung nhĩ vĩnh viễn.`,
        gates: [
          {
            parameter: isRenal ? 'CrCl' : 'Chống chỉ định Sotalol',
            passed: false,
            action: 'contra',
            value: isRenal && crcl !== undefined ? Number(crcl.toFixed(1)) : undefined,
            threshold: isRenal ? sotalolMin : undefined,
            messageVi: 'Chống chỉ định Sotalol'
          }
        ],
        citationIds: ['acc.af.2023.sotalol_renal_40', 'acc.af.2023.table23_sotalol_bronchospasm', 'esc.af.2024.aad_sotalol_rec'],
        priority: 103
      };
    },
    citationIds: ['acc.af.2023.sotalol_renal_40', 'esc.af.2024.aad_sotalol_rec']
  },

  // Amiodarone STOP trong thai kỳ, cho con bú hoặc cường giáp (nhiễm độc giáp)
  {
    id: 'af.rhythm.stop_amiodarone_contra',
    module: 'af',
    nameVi: 'AF-CARE [R]: Ngừng Amiodarone trong thai kỳ, thời kỳ cho con bú hoặc cường giáp chưa kiểm soát',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      isAfActive(ctx) &&
      !hasWpw(ctx) &&
      hasCurrentMed(ctx, ['amiodarone']) &&
      (hasCondition(ctx, 'pregnant') || hasCondition(ctx, 'breastfeeding') || hasHyperthyroidism(ctx)),
    produce: (ctx): Recommendation => {
      const isThyroid = hasHyperthyroidism(ctx) && !hasCondition(ctx, 'pregnant');
      return {
        id: 'rec_af_stop_amiodarone_contra',
        module: 'af',
        tier: TIER_R_RHYTHM,
        tierOrder: 3,
        action: 'STOP',
        drugId: 'amiodarone',
        drugNameVi: drug('amiodarone').nameVi,
        dose: undefined,
        title: isThyroid
          ? 'DỪNG NGAY Amiodarone: Chống chỉ định khi đang có Cường giáp / Nhiễm độc giáp (nguy cơ bão giáp)'
          : 'DỪNG NGAY Amiodarone: Chống chỉ định trong thai kỳ và thời kỳ cho con bú',
        rationale: isThyroid
          ? 'ESC 2024: Amiodarone chứa hàm lượng iod rất cao làm trầm trọng nhiễm độc giáp cấp (AIT); cần ngừng Amiodarone và kiểm soát chức năng tuyến giáp.'
          : 'ESC 2025 Pregnancy: Amiodarone qua nhau thai và bài tiết nhiều qua sữa mẹ gây suy giáp bẩm sinh, bướu giáp và chậm phát triển thần kinh thai nhi/trẻ sơ sinh.',
        gates: [{ parameter: isThyroid ? 'Cường giáp' : 'Thai kỳ / Cho con bú', passed: false, action: 'contra', messageVi: 'Chống chỉ định Amiodarone' }],
        citationIds: isThyroid
          ? ['esc.af.2024.hyperthyroidism_af']
          : ['esc.preg.2025.amiodarone_contra', 'esc.preg.2025.amiodarone_dronedarone_avoid'],
        priority: 104
      };
    },
    citationIds: ['esc.preg.2025.amiodarone_contra', 'esc.af.2024.hyperthyroidism_af']
  }
];
