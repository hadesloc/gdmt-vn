/**
 * Quy tắc Lựa chọn Thuốc Chống Loạn Nhịp (AAD) Duy trì Nhịp Xoang theo Bệnh tim cấu trúc [R]
 * Bất biến an toàn: Mọi khuyến cáo STOP / AVOID / HOLD / DEFER đều có `dose: undefined`.
 */

import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { parseFrequencyPerDay } from '../../engine/doseParser';
import { missingInputRec, need } from '../../engine/require';
import { drug, thFor } from '../../kb-types/access';
import {
  AAD_IDS,
  BB_IDS,
  DRONEDARONE_CYP3A4_CONTRA_IDS,
  NON_DHP_CCB_IDS,
  findCurrentMed,
  formatCurrentMedDose,
  getChildPugh,
  getCleanStartDose,
  getEhraNumeric,
  getRenalDose,
  hasCurrentMed,
  hasHcm,
  hasHyperthyroidism,
  hasTrueCad,
  hasWpw,
  isAfActive,
  isAllergicToDrug,
  isUnstableHemodynamics
} from './rulesHelpers';

const TIER_R_RHYTHM = 'AF-CARE · [R] Kiểm soát nhịp';

function isDronedaroneEligible(ctx: Parameters<Rule['produce']>[0]): boolean {
  const ef = need(ctx, 'lvef');
  const qtc = ctx.normalized.qtc ?? ctx.patient.qtc;
  if (ef !== undefined && ef <= thFor('lvef', 'af.rate.lvef_cutoff')) return false;
  if (ctx.normalized.nyha === 3 || ctx.normalized.nyha === 4) return false;
  if (hasCondition(ctx, 'liverDisease') || getChildPugh(ctx) !== undefined) return false;
  if (hasCondition(ctx, 'pregnant') || hasCondition(ctx, 'breastfeeding')) return false;
  if (qtc !== undefined && qtc > thFor('qtc', 'af.aad.qtc_contra_max')) return false;
  if (hasCurrentMed(ctx, DRONEDARONE_CYP3A4_CONTRA_IDS)) return false;
  if (hasCurrentMed(ctx, ['dabigatran']) && (ctx.settings?.profile ?? 'INTL') !== 'US') return false;
  return !isAllergicToDrug(ctx, 'dronedarone');
}

export const afRhythmStrategyRules: Rule[] = [
  {
    id: 'af.rhythm.aad_selection',
    module: 'af',
    nameVi: 'AF-CARE [R]: Chiến lược duy trì nhịp xoang bằng thuốc chống loạn nhịp theo bệnh tim cấu trúc',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (!isAfActive(ctx) || hasWpw(ctx) || isUnstableHemodynamics(ctx)) return false;
      if (ctx.patient.customInputs?.afType === 'permanent') return false;
      const ehra = getEhraNumeric(ctx);
      const isSymptomatic = ehra !== undefined && ehra >= 2; // qa-allow: index - EHRA >= 2 chỉ định xem xét kiểm soát nhịp
      const onAad = hasCurrentMed(ctx, AAD_IDS);
      return isSymptomatic || onAad;
    },
    produce: (ctx): Recommendation | null => {
      const ef = need(ctx, 'lvef');
      const crcl = need(ctx, 'crcl');
      const qtc = ctx.normalized.qtc ?? ctx.patient.qtc;
      const qtcMax = thFor('qtc', 'af.aad.qtc_contra_max');
      const isPregnant = hasCondition(ctx, 'pregnant');

      if (ef === undefined) {
        return missingInputRec(
          'af',
          'lvef',
          'đánh giá chức năng thất trái trước khi chọn thuốc chống loạn nhịp duy trì nhịp xoang (tránh độc tính nhóm IC/III ở HFrEF)',
          ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.aad_flecainide_propafenone']
        );
      }

      if (qtc !== undefined && qtc > qtcMax) return null;

      const efCutoff = thFor('lvef', 'af.rate.lvef_cutoff');
      const flecMin = thFor('crcl', 'af.flecainide.contra_crcl_min');
      const isHfRef = ef <= efCutoff;
      const cad = hasTrueCad(ctx);
      const hcm = hasHcm(ctx);

      if (isPregnant) {
        if (isHfRef || cad || hcm || (crcl !== undefined && crcl < flecMin)) {
          return {
            id: 'rec_af_aad_pregnancy_specialist',
            module: 'af',
            tier: TIER_R_RHYTHM,
            tierOrder: 3,
            action: 'REFER',
            dose: undefined,
            title: 'Hội chẩn Tim mạch – Sản khoa kiểm soát nhịp trong thai kỳ (Chống chỉ định Amiodarone & Dronedarone)',
            rationale:
              'ESC 2025 Pregnancy & ESC 2024 AF: Amiodarone và Dronedarone chống chỉ định trong thai kỳ; Flecainide/Propafenone chống chỉ định khi có bệnh tim cấu trúc, HFrEF hoặc suy thận nặng. Ưu tiên kiểm soát tần số hoặc sốc điện đồng bộ dưới theo dõi tim thai.',
            gates: [],
            citationIds: ['esc.preg.2025.amiodarone_contra', 'esc.preg.2025.amiodarone_dronedarone_avoid'],
            priority: 85
          };
        }
        // Fail-closed khi thiếu SCr/CrCl trước khi gợi ý Flecainide ở thai phụ
        if (crcl === undefined) {
          return missingInputRec(
            'af',
            'scr',
            `xác định độ thanh thải thận CrCl ≥ ${flecMin} mL/phút trước khi cân nhắc Flecainide trong thai kỳ`,
            ['esc.af.2024.flecainide_crcl_35', 'esc.af.2024.pregnancy_rhythm_flec_prop']
          );
        }
        return {
          id: 'rec_af_aad_pregnancy_flecainide',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: 'CONSIDER',
          drugId: 'flecainide',
          drugNameVi: drug('flecainide').nameVi,
          dose: getCleanStartDose('flecainide'),
          title: 'Kiểm soát nhịp trong thai kỳ (khi thật sự cần thiết): Cân nhắc Flecainide kèm chẹn beta chọn lọc',
          rationale:
            'ESC 2024 AF (Class IIb) & ESC 2025 Pregnancy: Khi không có bệnh tim cấu trúc và CrCl bảo tồn, có thể cân nhắc Flecainide dưới giám sát chuyên khoa; tuyệt đối cấm Amiodarone và Dronedarone.',
          gates: [],
          citationIds: ['esc.af.2024.pregnancy_rhythm_flec_prop', 'esc.preg.2025.flecainide_sotalol_propafenone'],
          priority: 78
        };
      }

      if (isHfRef) {
        if (hasHyperthyroidism(ctx) || hasCondition(ctx, 'breastfeeding') || isAllergicToDrug(ctx, 'amiodarone')) {
          return null;
        }
        const amioMed = findCurrentMed(ctx, ['amiodarone']);
        return {
          id: 'rec_af_aad_hfref',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: amioMed ? 'CONTINUE' : 'CONSIDER',
          drugId: 'amiodarone',
          drugNameVi: drug('amiodarone').nameVi,
          dose: amioMed ? formatCurrentMedDose(amioMed, 'amiodarone') : getCleanStartDose('amiodarone'),
          title: 'Kiểm soát nhịp ở HFrEF: Amiodarone là thuốc chống loạn nhịp duy nhất an toàn',
          rationale: `Khuyến cáo Class I, Mức A (ESC 2024 Rec Table 18): Ở LVEF ${ef}% ≤ ${efCutoff}%, Amiodarone là thuốc chống loạn nhịp duy nhất không làm tăng tử vong; chống chỉ định Flecainide, Propafenone, Dronedarone và Sotalol.`,
          gates: [{ parameter: 'LVEF', passed: true, value: ef, threshold: efCutoff, messageVi: `LVEF ${ef}% ≤ ${efCutoff}%` }],
          citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.amiodarone_dose_regimen'],
          priority: 85
        };
      }

      if (hcm) {
        const sotalolOk =
          !hasCondition(ctx, 'asthma') &&
          crcl !== undefined &&
          crcl >= thFor('crcl', 'af.sotalol.contra_crcl_min') &&
          !isAllergicToDrug(ctx, 'sotalol');
        const chosenHcm = hasHyperthyroidism(ctx) || hasCondition(ctx, 'breastfeeding') || isAllergicToDrug(ctx, 'amiodarone')
          ? sotalolOk
            ? 'sotalol'
            : null
          : 'amiodarone';
        if (!chosenHcm) return null;
        const activeHcmMed = findCurrentMed(ctx, [chosenHcm]);
        return {
          id: 'rec_af_aad_hcm',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: activeHcmMed ? 'CONTINUE' : 'CONSIDER',
          drugId: chosenHcm,
          drugNameVi: drug(chosenHcm).nameVi,
          dose: activeHcmMed ? formatCurrentMedDose(activeHcmMed, chosenHcm) : getCleanStartDose(chosenHcm),
          title: `Kiểm soát nhịp ở Bệnh cơ tim phì đại (HCM): Cân nhắc ${drug(chosenHcm).nameVi} (CẤM Flecainide, Propafenone & tránh Dronedarone)`,
          rationale:
            'ESC 2024 & ACC/AHA 2023: Ở bệnh cơ tim phì đại (dày thất trái nặng), thuốc nhóm IC và Dronedarone không an toàn do nguy cơ tiền loạn nhịp thất; Amiodarone (hoặc Sotalol theo dõi sát QTc) là lựa chọn phù hợp.',
          gates: [],
          citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.aad_sotalol_rec'],
          priority: 85
        };
      }

      if (cad) {
        const chosenCadDrug = isDronedaroneEligible(ctx)
          ? 'dronedarone'
          : !hasHyperthyroidism(ctx) && !hasCondition(ctx, 'breastfeeding') && !isAllergicToDrug(ctx, 'amiodarone')
          ? 'amiodarone'
          : null;
        if (!chosenCadDrug) return null;
        const activeCadMed = findCurrentMed(ctx, [chosenCadDrug]);
        return {
          id: 'rec_af_aad_cad',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: activeCadMed ? 'CONTINUE' : 'CONSIDER',
          drugId: chosenCadDrug,
          drugNameVi: drug(chosenCadDrug).nameVi,
          dose: activeCadMed ? formatCurrentMedDose(activeCadMed, chosenCadDrug) : getCleanStartDose(chosenCadDrug),
          title: `Kiểm soát nhịp ở Bệnh động mạch vành: Cân nhắc ${drug(chosenCadDrug).nameVi} (CẤM Flecainide & Propafenone)`,
          rationale:
            'Khuyến cáo Class I, Mức A (ESC 2024 Rec Table 18): Bệnh nhân bệnh động mạch vành chống chỉ định tuyệt đối thuốc nhóm IC (CAST); lựa chọn đầu tay là Dronedarone (hoặc Amiodarone khi chống chỉ định Dronedarone).',
          gates: [],
          citationIds: ['esc.af.2024.aad_dronedarone_rec', 'esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.amiodarone_dose_regimen'],
          priority: 85
        };
      }

      if (crcl !== undefined && crcl < flecMin) {
        const chosenRenalDrug = isDronedaroneEligible(ctx) ? 'dronedarone' : 'amiodarone';
        if (chosenRenalDrug === 'amiodarone' && (hasHyperthyroidism(ctx) || hasCondition(ctx, 'breastfeeding'))) return null;
        const activeRenalMed = findCurrentMed(ctx, [chosenRenalDrug]);
        return {
          id: 'rec_af_aad_renal_contra_flec',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: activeRenalMed ? 'CONTINUE' : 'CONSIDER',
          drugId: chosenRenalDrug,
          drugNameVi: drug(chosenRenalDrug).nameVi,
          dose: activeRenalMed ? formatCurrentMedDose(activeRenalMed, chosenRenalDrug) : getCleanStartDose(chosenRenalDrug),
          title: `Kiểm soát nhịp khi suy thận nặng (CrCl dưới ${flecMin} mL/phút): Cân nhắc ${drug(chosenRenalDrug).nameVi} (CẤM Flecainide & Sotalol)`,
          rationale: `ESC 2024 Table 13 & ACC 2023: Flecainide chống chỉ định khi CrCl < ${flecMin} mL/phút và Sotalol chống chỉ định khi CrCl < ${thFor('crcl', 'af.sotalol.contra_crcl_min')} mL/phút; lựa chọn an toàn hơn về thận là ${drug(chosenRenalDrug).nameVi}.`,
          gates: [{ parameter: 'CrCl', passed: false, value: Number(crcl.toFixed(1)), threshold: flecMin, messageVi: `CrCl ${crcl.toFixed(1)} < ${flecMin} mL/phút` }],
          citationIds: ['esc.af.2024.flecainide_crcl_35', 'esc.af.2024.aad_dronedarone_rec', 'acc.af.2023.sotalol_renal_40'],
          priority: 82
        };
      }

      const sotalolMin = thFor('crcl', 'af.sotalol.contra_crcl_min');
      const sotalolMax = thFor('crcl', 'af.sotalol.reduce_crcl_max');
      const sotalolMed = findCurrentMed(ctx, ['sotalol']);
      if (sotalolMed && !hasCondition(ctx, 'asthma') && crcl !== undefined && crcl >= sotalolMin && crcl <= sotalolMax) {
        const sotalolFreq = parseFrequencyPerDay(sotalolMed.freq);
        const alreadyQd = sotalolFreq === 1;
        return {
          id: 'rec_af_sotalol_renal_adjust',
          module: 'af',
          tier: TIER_R_RHYTHM,
          tierOrder: 3,
          action: alreadyQd ? 'CONTINUE' : 'REDUCE',
          drugId: 'sotalol',
          drugNameVi: drug('sotalol').nameVi,
          dose: alreadyQd ? formatCurrentMedDose(sotalolMed, 'sotalol') : getRenalDose('sotalol', 1), // qa-allow: index - Dải thận CrCl 40-60 mL/phút của Sotalol
          title: alreadyQd
            ? `Duy trì Sotalol 1 lần/ngày phù hợp chức năng thận (CrCl ${crcl.toFixed(1)} mL/phút) và theo dõi sát QTc`
            : `Giảm tần suất Sotalol xuống 1 lần/ngày do suy giảm thanh thải thận (CrCl ${crcl.toFixed(1)} ≤ ${sotalolMax} mL/phút)`,
          rationale: `ACC/AHA 2023 (Table 23): Ở dải CrCl ${sotalolMin}–${sotalolMax} mL/phút, bắt buộc dùng Sotalol 1 lần/ngày và kiểm tra khoảng QTc định kỳ để phòng xoắn đỉnh.`,
          gates: [],
          citationIds: ['acc.af.2023.sotalol_renal_40', 'esc.af.2024.aad_sotalol_rec', 'esc.af.2024.table13_dronedarone_sotalol'],
          priority: 88
        };
      }

      const activeOtherSafeAad = findCurrentMed(ctx, ['dronedarone', 'amiodarone', 'sotalol', 'propafenone']);
      if (activeOtherSafeAad) {
        const aadId = activeOtherSafeAad.drugId.toLowerCase();
        const safeEnough =
          (aadId === 'dronedarone' && isDronedaroneEligible(ctx)) ||
          (aadId === 'amiodarone' && !hasHyperthyroidism(ctx) && !hasCondition(ctx, 'breastfeeding')) ||
          (aadId === 'sotalol' && !hasCondition(ctx, 'asthma') && (crcl === undefined || crcl > sotalolMax)) ||
          (aadId === 'propafenone' && !hasCondition(ctx, 'liverDisease') && getChildPugh(ctx) === undefined && !hasCondition(ctx, 'asthma'));
        if (safeEnough) {
          return {
            id: `rec_af_aad_continue_${aadId}`,
            module: 'af',
            tier: TIER_R_RHYTHM,
            tierOrder: 3,
            action: 'CONTINUE',
            drugId: aadId,
            drugNameVi: drug(aadId).nameVi,
            dose: formatCurrentMedDose(activeOtherSafeAad, aadId),
            title: `Duy trì ${drug(aadId).nameVi} kiểm soát nhịp xoang và theo dõi ECG định kỳ`,
            rationale:
              'ESC 2024 (Section 7.3): Duy trì đơn trị liệu thuốc chống loạn nhịp đang dung nạp tốt, tránh phối hợp hai thuốc chống loạn nhịp cùng lúc do nguy cơ kéo dài QTc và tiền loạn nhịp.',
            gates: [],
            citationIds: ['esc.af.2024.aad_dronedarone_rec', 'esc.af.2024.aad_flecainide_propafenone'],
            priority: 82
          };
        }
      }

      if (isAllergicToDrug(ctx, 'flecainide')) return null;

      const onAvBlocker = hasCurrentMed(ctx, [...BB_IDS, ...NON_DHP_CCB_IDS]);
      const avBlockerNote = !onAvBlocker
        ? ' [LƯU Ý BẮT BUỘC]: Phối hợp đồng thời thuốc ức chế dẫn truyền nút nhĩ thất (Chẹn beta hoặc Diltiazem/Verapamil) khi dùng Flecainide/Propafenone để phòng cuồng nhĩ dẫn truyền 1:1 (ESC 2024 Class IIa).'
        : '';
      const warnings: string[] = [];
      if (hasCurrentMed(ctx, ['flecainide', 'propafenone']) && !onAvBlocker) {
        warnings.push('Đang dùng thuốc nhóm IC đơn độc chưa có thuốc ức chế nút nhĩ thất đi kèm — nguy cơ cuồng nhĩ dẫn truyền 1:1!');
      }
      if (crcl === undefined) {
        warnings.push(`Cần kiểm tra Creatinin máu đảm bảo CrCl ≥ ${flecMin} mL/phút trước khi cấp phát Flecainide.`);
      }

      const flecMed = findCurrentMed(ctx, ['flecainide']);
      return {
        id: 'rec_af_aad_no_shd',
        module: 'af',
        tier: TIER_R_RHYTHM,
        tierOrder: 3,
        action: flecMed && onAvBlocker ? 'CONTINUE' : 'CONSIDER',
        drugId: 'flecainide',
        drugNameVi: drug('flecainide').nameVi,
        dose: flecMed ? formatCurrentMedDose(flecMed, 'flecainide') : getCleanStartDose('flecainide'),
        title: !onAvBlocker
          ? 'Kiểm soát nhịp: Flecainide (hoặc Propafenone) — BẮT BUỘC KÈM THUỐC CHẸN NÚT AV'
          : 'Kiểm soát nhịp khi không có bệnh tim cấu trúc: Flecainide (hoặc Propafenone)',
        rationale: `Khuyến cáo Class I, Mức A (ESC 2024 Rec Table 18): Ở bệnh nhân không có suy tim và không có bệnh mạch vành, thuốc chống loạn nhịp nhóm IC là lựa chọn hàng đầu duy trì nhịp xoang.${avBlockerNote}`,
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: ['esc.af.2024.aad_flecainide_propafenone', 'esc.af.2024.table13_flecainide', 'esc.af.2024.aad_av_node_blocker'],
        priority: 80
      };
    },
    citationIds: ['esc.af.2024.aad_amiodarone_hfref', 'esc.af.2024.aad_dronedarone_rec', 'esc.af.2024.aad_flecainide_propafenone']
  }
];
