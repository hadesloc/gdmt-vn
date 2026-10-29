/**
 * GDMT-VN CKD Module - Pillar 3a: Finerenone Initiation Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation & Modularization)
 * Bao phủ: CKD-R4-R1-05, CKD-R4-R2-03/04/05/08, CKD-R4-R3-04/06/09/10/12
 */

import type { Rule } from '../../engine/types';
import { finerenoneRasiBarrier } from './helpers.rasiOptimization';
import { hasCondition, need } from '../../engine/require';
import { dose, drug, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  getMedComponents,
  hasAdrenalInsufficiency,
  hasBilateralRenalArteryStenosis,
  hasCkdDrugAllergy,
  hasCkdFlag,
  isAkiActive,
  isBreastfeedingCkd,
  isChildPughB,
  isChildPughC,
  isDriMed,
  isKSparingOrSteroidalMraMed,
  isModerateOrWeakCyp3a4InhibitorMed,
  isOutpatientAcuteCrisis,
  isRasiOrArniMed,
  normalizeDrugId,
} from './helpers';

const STRONG_CYP3A4_SET = new Set<string>([
  'itraconazole',
  'ketoconazole',
  'clarithromycin',
  'ritonavir',
  'cobicistat',
  'voriconazole',
  'posaconazole',
  'nefazodone',
]);

function hasStrongCyp3a4Inhibitor(ctx: Parameters<Rule['when']>[0]): boolean {
  return ctx.patient.currentMeds.some((m) =>
    getMedComponents(m).some((id) => STRONG_CYP3A4_SET.has(id))
  );
}

export const ckdOutpatientFinerenoneRules: Rule[] = [
  {
    id: 'ckd.outpatient.finerenone_indication',
    module: 'ckd',
    nameVi: 'Chỉ định Finerenone (MRA không steroid) ở ĐTĐ2 có CKD',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || hasCkdFlag(ctx, 'pregnant')) return false;
      if (!hasCondition(ctx, 'dm')) return false;
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      if (custom?.diabetesType === 't1dm') return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      if (
        ctx.patient.currentMeds.some(
          (m) => normalizeDrugId(m.drugId) === 'finerenone' || isKSparingOrSteroidalMraMed(m)
        )
      ) {
        return false;
      }

      const egfr = need(ctx, 'egfr');
      const uacr = need(ctx, 'uacr');
      if (egfr === undefined || uacr === undefined) return false;

      const hasAlbuminuria = uacr >= thFor('uacr', 'ckd.finerenone.uacr_initiate_min_mgmmol');
      const hasRasiOrArni = ctx.patient.currentMeds.some((m) => isRasiOrArniMed(m));
      const isRasiContra =
        hasCkdFlag(ctx, 'priorAngioedema') ||
        Boolean(ctx.patient.conditions?.allergyAceiArb) ||
        hasBilateralRenalArteryStenosis(ctx) ||
        (hasCkdDrugAllergy(ctx, 'losartan') && hasCkdDrugAllergy(ctx, 'perindopril'));

      return (
        hasAlbuminuria &&
        egfr >= thFor('egfr', 'ckd.finerenone.egfr_initiate_min') &&
        (hasRasiOrArni || isRasiContra)
      );
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr')!;
      const k = need(ctx, 'k');
      const sbp = need(ctx, 'sbp');
      const lvef = need(ctx, 'lvef');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const fineName = drug('finerenone').nameVi;
      const hfrefMax = thFor('lvef', 'ckd.hfref.lvef_max');

      const hasExplicitHfref = Boolean(
        (ctx.patient.conditions as Record<string, unknown> | undefined)?.hfref
      );
      if ((lvef !== undefined && lvef <= hfrefMax) || hasExplicitHfref) {
        return {
          id: 'rec_ckd_finerenone_avoid_hfref',
          module: 'ckd',
          tier: 'Phối hợp Tim mạch - Thận học',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'finerenone',
          drugNameVi: fineName,
          dose: undefined,
          title: `TRÁNH khởi trị ${fineName} khi có suy tim HFrEF (Ưu tiên Spironolactone / Eplerenone)`,
          rationale:
            `Theo KDIGO 2024 (PP 3.8.5) và ESC 2026: Suy tim HFrEF${lvef !== undefined ? ` (LVEF ${lvef}% <= ${hfrefMax}%)` : ''} cần ưu tiên MRA steroid (Class I-A giảm tử vong); không phối hợp hai MRA.`,
          gates: [
            {
              parameter: 'LVEF',
              passed: false,
              value: lvef,
              threshold: hfrefMax,
              messageVi: `HFrEF${lvef !== undefined ? ` (LVEF ${lvef}% <= ${hfrefMax}%)` : ''}: Ưu tiên MRA steroid`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_3_8_5_steroidal_mra_hf',
            'esc.2026.ckd.hfref_steroidal_vs_nonsteroidal_mra',
          ],
          priority: 90,
        };
      }

      if (hasAdrenalInsufficiency(ctx)) {
        return {
          id: 'rec_ckd_finerenone_avoid_adrenal',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'finerenone',
          drugNameVi: fineName,
          dose: undefined,
          title: `CHỐNG CHỈ ĐỊNH ${fineName} trên bệnh nhân suy tuyến thượng thận`,
          rationale:
            'Theo nhãn FDA Kerendia (Mục 4): Chống chỉ định tuyệt đối Finerenone ở suy tuyến thượng thận do nguy cơ tăng kali máu và suy thượng thận cấp.',
          gates: [
            {
              parameter: 'Adrenal_Insufficiency',
              passed: false,
              messageVi: 'Suy tuyến thượng thận: Chống chỉ định Finerenone',
            },
          ],
          citationIds: ['fda.finerenone.contraindications'],
          priority: 98,
        };
      }

      if (hasCkdDrugAllergy(ctx, 'finerenone') || hasStrongCyp3a4Inhibitor(ctx)) {
        const isCyp = hasStrongCyp3a4Inhibitor(ctx);
        return {
          id: isCyp ? 'rec_ckd_finerenone_avoid_cyp3a4' : 'rec_ckd_finerenone_avoid_allergy',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'finerenone',
          drugNameVi: fineName,
          dose: undefined,
          title: isCyp
            ? `CHỐNG CHỈ ĐỊNH ${fineName} khi đang dùng thuốc ức chế CYP3A4 mạnh`
            : `CHỐNG CHỈ ĐỊNH ${fineName} do tiền sử quá mẫn / dị ứng thuốc`,
          rationale: isCyp
            ? 'Theo nhãn FDA Kerendia (Mục 4): Chống chỉ định phối hợp Finerenone với thuốc ức chế mạnh CYP3A4 (itraconazole, ketoconazole, clarithromycin, ritonavir, cobicistat) do tăng vọt phơi nhiễm và tăng kali máu nặng.'
            : 'Theo nhãn FDA Kerendia (Mục 4): Chống chỉ định Finerenone khi quá mẫn với thuốc.',
          gates: [
            {
              parameter: isCyp ? 'Strong_CYP3A4_Inhibitor' : 'Allergy',
              passed: false,
              messageVi: isCyp
                ? 'Đang dùng ức chế CYP3A4 mạnh: Chống chỉ định Finerenone'
                : 'Tiền sử dị ứng Finerenone: Chống chỉ định',
            },
          ],
          citationIds: ['fda.finerenone.contraindications'],
          priority: 98,
        };
      }

      if (isBreastfeedingCkd(ctx)) {
        return {
          id: 'rec_ckd_finerenone_avoid_lactation',
          module: 'ckd',
          tier: 'Cảnh báo an toàn thai kỳ & cho con bú',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'finerenone',
          drugNameVi: fineName,
          dose: undefined,
          title: `TRÁNH khởi trị ${fineName} trong thời kỳ đang cho con bú`,
          rationale:
            'Theo nhãn FDA Kerendia (Mục 8.2): Không khuyến cáo cho con bú khi dùng Finerenone và ít nhất 1 ngày sau liều cuối do nguy cơ tăng kali máu, hạ huyết áp ở trẻ bú mẹ.',
          gates: [
            {
              parameter: 'lactation',
              passed: false,
              messageVi: 'Đang cho con bú: Không khuyến cáo dùng Finerenone',
            },
          ],
          citationIds: ['fda.finerenone.pregnancy'],
          priority: 96,
        };
      }

      if (isChildPughC(ctx)) {
        return {
          id: 'rec_ckd_finerenone_avoid_hepatic',
          module: 'ckd',
          tier: 'Cảnh báo an toàn gan - thận',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'finerenone',
          drugNameVi: fineName,
          dose: undefined,
          title: `TRÁNH khởi trị ${fineName} trên bệnh nhân suy gan nặng (Child-Pugh C)`,
          rationale:
            'Theo nhãn FDA Kerendia (Mục 8.6): Tránh sử dụng Finerenone ở suy gan nặng (Child-Pugh C) do tăng phơi nhiễm hoạt chất.',
          gates: [
            {
              parameter: 'Child_Pugh',
              passed: false,
              value: 'C',
              messageVi: 'Child-Pugh C: Tránh sử dụng Finerenone',
            },
          ],
          citationIds: ['fda.finerenone.hepatic_impairment'],
          priority: 95,
        };
      }

      const fineMinEgfr = thFor('egfr', 'ckd.finerenone.egfr_initiate_min');
      const fineMaxK = thFor('k', 'ckd.finerenone.k_initiate_max');
      const kBorderlineMin = thFor('k', 'ckd.finerenone.k_uptitrate_max');
      const minSbp = thFor('sbp', 'ckd.rasi.sbp_initiate_min');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const targetDoseMg = thFor('dose_mg', 'ckd.finerenone.target_dose');
      const lowDoseMg = thFor('dose_mg', 'ckd.finerenone.start_dose_low');
      const contrastDeferEgfr = thFor('egfr', 'ckd.contrast.defer_gdmt_egfr_cutoff');

      const passedEgfr = egfr >= fineMinEgfr;
      const passedK = k !== undefined && k <= fineMaxK;
      const passedSbp = sbp !== undefined && sbp >= minSbp;

      const raaMeds = ctx.patient.currentMeds.filter((m) => isRasiOrArniMed(m) || isDriMed(m));
      const rasiBarrierReason = finerenoneRasiBarrier(ctx);

      const intraArterial =
        Boolean(custom?.contrastRouteIntraArterial) ||
        String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
      const contrastBarrier =
        Boolean(custom?.contrastPlanned) && (intraArterial || egfr < contrastDeferEgfr);

      const startDoseNum = egfr >= g2Min ? targetDoseMg : lowDoseMg;
      const fineDose =
        startDoseNum === targetDoseMg
          ? fmtShortDose(dose('finerenone', 'target'))
          : fmtShortDose(dose('finerenone', 'start'));

      const canStart =
        passedEgfr && passedK && passedSbp && !rasiBarrierReason && !contrastBarrier;
      const isBorderlineK = k !== undefined && k > kBorderlineMin && k <= fineMaxK;
      const action = !canStart ? 'DEFER' : isBorderlineK ? 'CONSIDER' : 'START';

      const cids = [
        'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
        'kdigo.ckd.2024.pp_3_8_2_finerenone_add_on',
        'fda.finerenone.table_1_starting_dose',
        'fda.finerenone.table_2_dose_adjustment',
      ];
      if (hasCondition(ctx, 'orthostaticHypotension')) cids.push('kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop');

      let rationale =
        'Khuyến cáo mức 2A (KDIGO 2024 Rec 3.8.1 & PP 3.8.2): Finerenone giảm tiến triển CKD và biến cố tim mạch ở ĐTĐ típ 2 còn albumin niệu dù đã tối ưu hoặc không dung nạp RASi.';
      if (raaMeds.length === 0) { // qa-allow: index - bệnh nhân chống chỉ định RASi
        rationale += ' Bệnh nhân chống chỉ định ACEi/ARB nên Finerenone là trụ cột giảm đạm niệu quan trọng.';
      }
      if (rasiBarrierReason) {
        rationale += ` TẠM HOÃN khởi trị đồng thời: ${rasiBarrierReason}. Cần ổn định RASi trước và kiểm tra lại K⁺, eGFR sau 2–4 tuần.`;
      }
      if (contrastBarrier) {
        rationale += ' TẠM HOÃN trước thủ thuật cản quang iod nguy cơ cao; bắt đầu sau thủ thuật 48–72h khi chức năng thận ổn định.';
        cids.push('kdigo.aki.2012.ci_aki_volume_expansion');
      }
      if (k === undefined) {
        rationale += ` Chưa có K+ máu: Cần xét nghiệm K+ (<= ${fineMaxK} mmol/L) trước khởi trị.`;
      } else if (k > fineMaxK) {
        rationale += ` Hiện K+ ${k} mmol/L > ${fineMaxK}: Tạm hoãn cho tới khi K+ <= ${fineMaxK} mmol/L.`;
      } else if (isBorderlineK && canStart) {
        rationale += ` LƯU Ý KALI DẢI RANH GIỚI (K⁺ = ${k} mmol/L, > ${kBorderlineMin}–${fineMaxK} mmol/L — FDA Kerendia Mục 2.2): Nguy cơ tăng kali máu cao hơn; cân nhắc khởi trị kèm xét nghiệm lại K+ sớm trong 2–4 tuần đầu.`;
        cids.push('fda.finerenone.k_borderline_4_8_to_5_0');
      }
      if (sbp === undefined) {
        rationale += ' Chưa có số đo SBP: Cần xác nhận huyết động ổn định trước khởi trị.';
      } else if (sbp < minSbp) {
        rationale += ` SBP ${sbp} mmHg < ${minSbp} mmHg: Tạm hoãn khởi trị.`;
      }
      if (ctx.patient.currentMeds.some((m) => isModerateOrWeakCyp3a4InhibitorMed(m))) {
        rationale +=
          ' CẢNH BÁO TƯƠNG TÁC CYP3A4 (FDA Mục 7.1): Đang dùng ức chế CYP3A4 vừa/yếu (diltiazem, verapamil, amiodarone, fluconazole, erythromycin) làm tăng phơi nhiễm Finerenone — theo dõi sát K+ trong 4 tuần đầu và sau chỉnh liều.';
        cids.push('fda.finerenone.cyp3a4_moderate_weak');
      }
      if (isChildPughB(ctx)) {
        rationale += ' Suy gan trung bình (Child-Pugh B — FDA Mục 8.6): Không cần giảm liều khởi đầu nhưng theo dõi sát K+ máu.';
        cids.push('fda.finerenone.hepatic_impairment');
      }

      const titleText = !canStart
        ? rasiBarrierReason
          ? `Tạm hoãn khởi trị ${fineName}: Ưu tiên hiệu chỉnh ổn định phác đồ RASi trước`
          : `Tạm hoãn khởi trị ${fineName}: Chờ hoàn tất cổng an toàn`
        : isBorderlineK
          ? `Cân nhắc khởi trị ${fineName} (${fineDose}) kèm kiểm tra sớm Kali máu (K⁺ dải ranh giới)`
          : `Khởi trị ${fineName} (${fineDose})`;

      const gates = [
        {
          parameter: 'eGFR',
          passed: passedEgfr,
          value: egfr,
          threshold: fineMinEgfr,
          messageVi: passedEgfr
            ? `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² >= ${fineMinEgfr}: Đủ điều kiện khởi trị`
            : `eGFR ${egfr.toFixed(0)} < ${fineMinEgfr}: Dưới ngưỡng khuyến cáo nhãn`,
        },
        {
          parameter: 'K+',
          passed: passedK,
          value: k,
          threshold: fineMaxK,
          messageVi: passedK
            ? isBorderlineK
              ? `Kali máu ${k} mmol/L (> ${kBorderlineMin}–${fineMaxK}): Dải ranh giới, cân nhắc khởi trị kèm xét nghiệm sớm K+`
              : `Kali máu ${k} mmol/L <= ${kBorderlineMin}: An toàn bắt đầu`
            : k === undefined
              ? 'Chưa có xét nghiệm Kali máu: Không đạt cổng an toàn (Fail-closed)'
              : `Kali máu ${k} mmol/L > ${fineMaxK}: Nguy cơ tăng kali máu, tạm hoãn`,
        },
        {
          parameter: 'SBP',
          passed: passedSbp,
          value: sbp,
          threshold: minSbp,
          messageVi: passedSbp
            ? `Huyết áp tâm thu ${sbp} mmHg >= ${minSbp}: Huyết động ổn định`
            : sbp === undefined
              ? 'Chưa có số đo Huyết áp tâm thu: Không đạt cổng an toàn (Fail-closed)'
              : `Huyết áp tâm thu ${sbp} mmHg < ${minSbp}: Tạm hoãn khởi trị`,
        },
      ];

      if (rasiBarrierReason) {
        gates.push({
          parameter: 'RASi_Max_Tolerated',
          passed: false,
          value: 0, // qa-allow: index - trạng thái nhị phân chưa ổn định liều RASi
          threshold: 1, // qa-allow: index - yêu cầu ổn định liều RASi tối đa dung nạp
          messageVi: rasiBarrierReason,
        });
      }

      return {
        id: 'rec_ckd_finerenone_start',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action,
        drugId: 'finerenone',
        drugNameVi: fineName,
        dose: canStart ? fineDose : undefined,
        title: titleText,
        rationale,
        gates,
        citationIds: Array.from(new Set(cids)),
        priority: 90,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
      'fda.finerenone.table_1_starting_dose',
    ],
  },
];
