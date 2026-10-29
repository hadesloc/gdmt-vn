/**
 * GDMT-VN CKD Module - Pillar 2a: RASi Initiation Rules (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Lactation Enalapril/Captopril, Bilateral RAS/Bruit, Allergy/Angioedema, DRI & Contrast Defer)
 * Bao phủ: CKD-R4-R2-03, CKD-R4-R2-04, CKD-R4-R2-08, CKD-R4-R3-04, CKD-R4-R3-05, CKD-R4-R3-09, CKD-R4-R3-10
 */

import type { Rule } from '../../engine/types';
import { hasCondition, need } from '../../engine/require';
import { dose, drug, renalBand, thFor } from '../../kb-types/access';
import {
  fmtShortDose,
  hasBilateralRenalArteryStenosis,
  hasCkdDrugAllergy,
  hasCkdFlag,
  hasExcessiveRasiCreatinineRise,
  hasMildModerateHepaticImpairment,
  hasSuspectedRenalArteryStenosis,
  isAkiActive,
  isBreastfeedingCkd,
  isChildPughC,
  isDriMed,
  isRasiOrArniMed,
} from './helpers';

export const ckdOutpatientRasiRules: Rule[] = [
  // RASi (ACEi / ARB): Khởi trị cho Albumin niệu hoặc Tăng huyết áp (>= 130/80 mmHg)
  {
    id: 'ckd.outpatient.rasi_initiate',
    module: 'ckd',
    nameVi: 'Khởi trị thuốc ức chế hệ RAS (ACEi hoặc ARB)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || isAkiActive(ctx)) return false;

      const k = need(ctx, 'k');
      const hco3 = need(ctx, 'hco3');
      if (k !== undefined && k >= thFor('k', 'ckd.hyperkalemia.moderate_min')) return false;
      if (hco3 !== undefined && hco3 < thFor('hco3', 'ckd.acidosis.hco3_outpatient_emergency')) return false;

      if (ctx.patient.currentMeds.some((m) => isRasiOrArniMed(m) || isDriMed(m))) return false;

      const uacr = need(ctx, 'uacr');
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const hasAlbuminuria = uacr !== undefined && uacr >= thFor('uacr', 'ckd.uacr.a1_max_mgmmol');
      const hasHtn =
        (sbp !== undefined && sbp >= thFor('sbp', 'ckd.bp.target_sbp_acc_aha')) ||
        (dbp !== undefined && dbp >= thFor('dbp', 'ckd.bp.target_dbp_max')) ||
        hasCondition(ctx, 'htn');

      if (!hasAlbuminuria && !hasHtn) return false;

      const hasContra =
        hasCkdFlag(ctx, 'pregnant') ||
        hasCkdFlag(ctx, 'priorAngioedema') ||
        Boolean(ctx.patient.conditions?.allergyAceiArb) ||
        hasBilateralRenalArteryStenosis(ctx);
      if (hasContra) return true;

      return need(ctx, 'egfr') !== undefined;
    },
    produce: (ctx) => {
      if (hasCkdFlag(ctx, 'pregnant')) {
        return {
          id: 'rec_ckd_rasi_contra_preg',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'losartan',
          drugNameVi: drug('losartan').nameVi,
          dose: undefined,
          title: 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG nhóm RASi (ACEi/ARB) trong thai kỳ',
          rationale:
            'Thuốc ức chế men chuyển và ức chế thụ thể gây độc thai nhi nghiêm trọng, giảm sản sọ và tử vong chu sinh (Boxed Warning FDA / SmPC).',
          gates: [
            {
              parameter: 'pregnancy',
              passed: false,
              messageVi: 'Bệnh nhân đang mang thai: Chống chỉ định tuyệt đối nhóm RASi',
            },
          ],
          citationIds: [
            'fda.losartan.boxed_pregnancy',
            'ema.perindopril.pregnancy',
            'kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm',
          ],
          priority: 100,
        };
      }

      if (hasBilateralRenalArteryStenosis(ctx)) {
        return {
          id: 'rec_ckd_rasi_contra_ras_stenosis',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: 'losartan',
          drugNameVi: drug('losartan').nameVi,
          dose: undefined,
          title: 'CHỐNG CHỈ ĐỊNH khởi trị ACEi/ARB do hẹp động mạch thận hai bên (hoặc thận độc nhất)',
          rationale:
            'Theo KDIGO 2024 (Figure 24): Chống chỉ định khởi trị nhóm ức chế hệ RAS ở bệnh nhân hẹp động mạch thận hai bên hoặc hẹp động mạch trên thận độc nhất do nguy cơ tụt áp lực lọc cầu thận đột ngột gây suy thận cấp thiếu máu cục bộ. Ưu tiên CCB và hội chẩn Thận - Mạch máu.',
          gates: [
            {
              parameter: 'Renal_Artery_Stenosis',
              passed: false,
              messageVi: 'Hẹp động mạch thận hai bên / thận độc nhất: Chống chỉ định ACEi/ARB',
            },
          ],
          citationIds: ['kdigo.ckd.2024.fig_24_consider_ras_stenosis'],
          priority: 100,
        };
      }

      if (Boolean(ctx.patient.conditions?.allergyAceiArb) || hasCkdFlag(ctx, 'priorAngioedema')) {
        const isBothAllergy = Boolean(ctx.patient.conditions?.allergyAceiArb);
        const repId = isBothAllergy ? 'losartan' : 'perindopril';
        return {
          id: 'rec_ckd_rasi_contra_allergy',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: repId,
          drugNameVi: drug(repId).nameVi,
          dose: undefined,
          title: isBothAllergy
            ? 'CHỐNG CHỈ ĐỊNH nhóm ACEi/ARB do tiền sử dị ứng cả hai nhóm RASi'
            : 'CHỐNG CHỈ ĐỊNH tuyệt đối ACEi/ARNI do tiền sử phù mạch (thận trọng tối đa nếu hội chẩn chuyên khoa xét ARB)',
          rationale: isBothAllergy
            ? 'Tiền sử quá mẫn với cả ACEi và ARB: Không sử dụng ACEi, ARB, ARNI hoặc Aliskiren; ưu tiên CCB và tối ưu SGLT2i / Finerenone (nếu ĐTĐ2 có đạm niệu).'
            : 'Tiền sử phù mạch liên quan ACEi hoặc phù mạch di truyền/vô căn: Chống chỉ định tuyệt đối ACEi, ARNI và Aliskiren; không tự động kê đơn RASi thường quy.',
          gates: [
            {
              parameter: 'allergy',
              passed: false,
              messageVi: 'Tiền sử phù mạch / dị ứng RASi: Chống chỉ định tự động khởi trị',
            },
          ],
          citationIds: ['ema.perindopril.pregnancy', 'kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm'],
          priority: 100,
        };
      }

      if (hasSuspectedRenalArteryStenosis(ctx)) {
        return {
          id: 'rec_ckd_rasi_defer_renal_bruit',
          module: 'ckd',
          tier: 'Kế hoạch thăm dò trước điều trị',
          tierOrder: 1,
          action: 'DEFER',
          drugId: 'losartan',
          drugNameVi: drug('losartan').nameVi,
          dose: undefined,
          title: 'Tạm hoãn khởi trị nhóm RASi: Tầm soát siêu âm Doppler động mạch thận trước do có tiếng thổi động mạch thận',
          rationale:
            'Theo KDIGO 2024 (Figure 24): Bệnh nhân có tiếng thổi động mạch thận / nghi ngờ hẹp động mạch thận xơ vữa cần được siêu âm Doppler động mạch thận loại trừ hẹp động mạch thận hai bên trước khi khởi trị ACEi/ARB.',
          gates: [
            {
              parameter: 'Renal_Bruit',
              passed: false,
              messageVi: 'Có tiếng thổi động mạch thận: Siêu âm Doppler loại trừ hẹp động mạch thận 2 bên trước khởi trị RASi',
            },
          ],
          citationIds: ['kdigo.ckd.2024.fig_24_consider_ras_stenosis'],
          priority: 92,
        };
      }

      const k = need(ctx, 'k');
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');
      const egfr = need(ctx, 'egfr')!;
      const uacr = need(ctx, 'uacr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;

      const a1Max = thFor('uacr', 'ckd.uacr.a1_max_mgmmol');
      const a2Max = thFor('uacr', 'ckd.uacr.a2_max_mgmmol');
      const isA3 = uacr !== undefined && uacr >= a2Max;
      const isA2Only = uacr !== undefined && uacr >= a1Max && uacr < a2Max;
      const hasDm = hasCondition(ctx, 'dm');
      const hasHtn =
        (sbp !== undefined && sbp >= thFor('sbp', 'ckd.bp.target_sbp_acc_aha')) ||
        (dbp !== undefined && dbp >= thFor('dbp', 'ckd.bp.target_dbp_max')) ||
        hasCondition(ctx, 'htn');

      const maxInitK = thFor('k', 'ckd.rasi.k_initiate_max');
      const minInitSbp = thFor('sbp', 'ckd.rasi.sbp_initiate_min');
      const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');
      const g4Min = thFor('egfr', 'ckd.egfr.g4_min');
      const contrastDeferCutoff = thFor('egfr', 'ckd.contrast.defer_gdmt_egfr_cutoff');

      const passedK = k !== undefined && k <= maxInitK;
      const passedSbp = sbp !== undefined && sbp >= minInitSbp;
      const contrastPlanned = Boolean(custom?.contrastPlanned);
      const intraArterial =
        Boolean(custom?.contrastRouteIntraArterial) ||
        String(custom?.contrastRoute ?? '').toLowerCase() === 'intra_arterial';
      const deferForContrast = contrastPlanned && (intraArterial || egfr < contrastDeferCutoff);

      const isG5 = egfr < g4Min;
      const isVnSevereRenal = ctx.settings.profile === 'VN' && egfr < g3bMin;
      const severeLiver = isChildPughC(ctx);
      const mildModLiver = hasMildModerateHepaticImpairment(ctx);
      const breastfeeding = isBreastfeedingCkd(ctx);

      let candidatePool: string[];
      if (breastfeeding) {
        candidatePool = severeLiver ? [] : ['enalapril', 'captopril'];
      } else if (severeLiver) {
        candidatePool = ['lisinopril'];
      } else if (hasDm || isG5 || isVnSevereRenal) {
        candidatePool = ['losartan', 'valsartan', 'enalapril', 'lisinopril'];
      } else {
        candidatePool = ['perindopril', 'enalapril', 'losartan', 'valsartan'];
      }

      const drugId = candidatePool.find((id) => !hasCkdDrugAllergy(ctx, id));
      if (!drugId) {
        return {
          id: 'rec_ckd_rasi_contra_specific_allergy',
          module: 'ckd',
          tier: 'Cảnh báo an toàn',
          tierOrder: 0,
          action: 'AVOID',
          drugId: breastfeeding ? 'enalapril' : 'losartan',
          drugNameVi: drug(breastfeeding ? 'enalapril' : 'losartan').nameVi,
          dose: undefined,
          title: breastfeeding
            ? 'TRÁNH khởi trị RASi khi đang cho con bú kèm suy gan mất bù / dị ứng Enalapril-Captopril'
            : 'CHỐNG CHỈ ĐỊNH khởi trị RASi do dị ứng các hoạt chất thay thế',
          rationale:
            'Không còn hoạt chất ức chế hệ RAS an toàn phù hợp với hồ sơ dị ứng / cho con bú / suy gan của bệnh nhân; ưu tiên lựa chọn nhóm hạ áp khác an toàn (Nifedipine phóng thích kéo dài hoặc Labetalol khi cho con bú).',
          gates: [
            {
              parameter: 'allergy_or_lactation',
              passed: false,
              messageVi: 'Dị ứng / chống chỉ định các lựa chọn RASi khả dụng',
            },
          ],
          citationIds: ['esc.2025.pregnancy.rasi_lactation'],
          priority: 98,
        };
      }

      const drugEntry = drug(drugId);
      const drugName = drugEntry.nameVi;

      let displayDose = '';
      if (drugId === 'enalapril' || drugId === 'captopril' || drugId === 'lisinopril' || drugId === 'valsartan') {
        displayDose =
          egfr < g3bMin
            ? fmtShortDose(renalBand(drugId, egfr, 'egfr')?.dose) || fmtShortDose(dose(drugId, 'start'))
            : fmtShortDose(dose(drugId, 'start'));
      } else if (drugId === 'losartan') {
        const stdLosartanStart = dose('losartan', 'start');
        const reducedHepaticAmt =
          typeof stdLosartanStart === 'object' && typeof stdLosartanStart.amount === 'number'
            ? stdLosartanStart.amount / 2
            : '';
        if (mildModLiver && reducedHepaticAmt !== '') {
          displayDose = `${reducedHepaticAmt} mg x 1 lần/ngày`;
        } else {
          displayDose =
            egfr < g3bMin
              ? fmtShortDose(renalBand('losartan', egfr, 'egfr')?.dose)
              : fmtShortDose(stdLosartanStart);
        }
      } else {
        displayDose =
          egfr < g3bMin
            ? fmtShortDose(
                renalBand('perindopril', Math.max(need(ctx, 'crcl') ?? egfr, g4Min), 'crcl')?.dose
              )
            : fmtShortDose(dose('perindopril', 'start'));
      }

      const isNormotensiveNonDmA2 = !hasDm && isA2Only && !hasHtn;
      const canInitiateNow = passedK && passedSbp && !deferForContrast && !hasExcessiveRasiCreatinineRise(ctx);
      const recommendationAction = !canInitiateNow
        ? 'DEFER'
        : isG5 || isNormotensiveNonDmA2 || severeLiver
          ? 'CONSIDER'
          : 'START';

      let rationale = '';
      if (hasDm && (isA2Only || isA3)) {
        rationale =
          'Khuyến cáo 1B (KDIGO 2024 Rec 3.6.3): Khởi trị ACEi hoặc ARB ở bệnh nhân đái tháo đường kèm CKD có albumin niệu vừa–nặng (A2–A3) nhằm giảm áp lực lọc cầu thận và làm chậm tiến triển bệnh thận.';
      } else if (!hasDm && isA3) {
        rationale =
          'Khuyến cáo 1B (KDIGO 2024 Rec 3.6.1): Khuyến cáo mạnh dùng RASi ở bệnh nhân CKD không đái tháo đường có albumin niệu tăng nặng (A3) để bảo tồn chức năng thận.';
      } else if (!hasDm && isA2Only) {
        rationale = `Khuyến cáo gợi ý 2C (KDIGO 2024 Rec 3.6.2): Cân nhắc/gợi ý dùng RASi ở bệnh nhân CKD không đái tháo đường có albumin niệu tăng vừa (A2)${hasHtn ? ' kèm tăng huyết áp' : ' huyết áp bình thường'}.`;
      } else {
        rationale =
          'Khuyến cáo (KDIGO 2021 BP / BYT 2024): Khởi trị thuốc ức chế hệ RAS làm nền tảng kiểm soát tăng huyết áp trên bệnh nhân CKD.';
      }

      if (breastfeeding) {
        rationale += ` LƯU Ý CHO CON BÚ (ESC 2025): Tránh Losartan/ARB và Perindopril do thiếu dữ liệu an toàn trên trẻ bú mẹ; ưu tiên chọn ${drugName} (tương thích an toàn ở trẻ đủ tháng; không dùng nếu trẻ sinh non hoặc suy thận sơ sinh).`;
      } else if (severeLiver) {
        rationale +=
          ' Lưu ý suy gan nặng (Child-Pugh C): Ưu tiên cân nhắc Lisinopril (hoạt chất thân nước không qua chuyển hóa tiền thuốc tại gan), khởi đầu liều thấp và theo dõi sát huyết động.';
      } else if (mildModLiver && drugId === 'losartan') {
        rationale += ` Lưu ý suy gan nhẹ–trung bình (FDA Cozaar Section 2.4): Giảm liều khởi đầu ${drugName} xuống ${displayDose}.`;
      }
      if (isVnSevereRenal && !hasDm && !isG5 && !severeLiver && !breastfeeding) {
        rationale += ` Lưu ý hồ sơ Việt Nam (BYT 2024 Bảng 12): Không sử dụng Perindopril khi CrCl/eGFR < ${g3bMin} mL/phút; ưu tiên chọn ARB (${drugName} liều thấp tăng dần).`;
      }
      if (isG5 && canInitiateNow) {
        rationale += ` Giai đoạn G5 chưa lọc máu (eGFR ${egfr.toFixed(0)} < ${g4Min}): Cân nhắc thận trọng khởi trị ${drugName} liều thấp (${displayDose}) và kiểm tra sớm K⁺, SCr sau 1–2 tuần.`;
      }
      if (deferForContrast) {
        rationale += ` TẠM HOÃN quanh thủ thuật cản quang iod: Chờ đánh giá lại SCr/eGFR 48–72 giờ sau tiêm cản quang ổn định mới bắt đầu ${drugName}.`;
      }
      if (k === undefined) {
        rationale += ' Chưa có kết quả Kali máu: Cần bổ sung xét nghiệm K+ trước khi dùng.';
      } else if (k > maxInitK) {
        rationale += ` Hiện tại K+ ${k} mmol/L > ${maxInitK} mmol/L: Cần kiểm soát kali trước khi khởi trị.`;
      }
      if (sbp === undefined) {
        rationale += ' Chưa có số đo Huyết áp tâm thu: Cần đo HA xác nhận huyết động ổn định trước khi dùng.';
      } else if (sbp < minInitSbp) {
        rationale += ` Huyết áp tâm thu ${sbp} mmHg < ${minInitSbp} mmHg: Nguy cơ tụt HA triệu chứng, tạm hoãn khởi trị.`;
      }

      const displayCitations: string[] = [];
      if (hasDm) {
        displayCitations.push('kdigo.ckd.2024.rec_3_6_3_rasi_dm', 'fda.losartan.diabetic_nephropathy_dose');
      } else if (isA3) {
        displayCitations.push('kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm');
      } else if (isA2Only) {
        displayCitations.push('kdigo.ckd.2024.rec_3_6_2_rasi_a2_nondm');
      } else {
        displayCitations.push('kdigo.2021.bp.rec_3_1_1_target_sbp_120');
      }
      if (breastfeeding) {
        displayCitations.push('esc.2025.pregnancy.rasi_lactation', 'byt.ckd.2024.table_12_acei_dosing');
      } else if (drugId === 'perindopril') {
        displayCitations.push('ema.perindopril.table_1_renal_adjustment');
      } else if (drugId === 'lisinopril' || drugId === 'enalapril' || drugId === 'captopril') {
        displayCitations.push('byt.ckd.2024.table_12_acei_dosing');
      } else if (drugId === 'losartan' && !hasDm) {
        displayCitations.push('fda.losartan.diabetic_nephropathy_dose');
      }
      if (mildModLiver && drugId === 'losartan') {
        displayCitations.push('fda.losartan.hepatic_impairment');
      }
      if (isVnSevereRenal && !hasDm && !severeLiver && !breastfeeding) {
        displayCitations.push('byt.ckd.2024.table_12_perindopril_crcl_30');
      }

      const titleText =
        recommendationAction === 'DEFER'
          ? deferForContrast
            ? `Tạm hoãn khởi trị ${drugName} đến 48–72 giờ sau thủ thuật cản quang iod`
            : `Tạm hoãn khởi trị ${drugName}: Cần đảm bảo K⁺ <= ${maxInitK} mmol/L và SBP >= ${minInitSbp} mmHg`
          : `${recommendationAction === 'CONSIDER' ? 'Cân nhắc khởi trị' : 'Khởi trị'} ${drugName} (${displayDose})`;

      return {
        id: 'rec_ckd_rasi_start',
        module: 'ckd',
        tier: 'Trụ cột bảo vệ tim - thận',
        tierOrder: 1,
        action: recommendationAction,
        drugId,
        drugNameVi: drugName,
        dose: recommendationAction === 'DEFER' ? undefined : displayDose,
        title: titleText,
        rationale,
        gates: [
          {
            parameter: 'K+',
            passed: passedK,
            value: k,
            threshold: maxInitK,
            messageVi: passedK
              ? `Kali máu ${k} mmol/L <= ${maxInitK}: Đủ điều kiện khởi trị`
              : k === undefined
                ? 'Chưa có xét nghiệm Kali máu: Không đạt cổng an toàn (Fail-closed)'
                : `Kali máu ${k} mmol/L > ${maxInitK}: Nguy cơ tăng kali máu nặng, tạm hoãn khởi trị`,
          },
          {
            parameter: 'SBP',
            passed: passedSbp && !deferForContrast,
            value: sbp,
            threshold: minInitSbp,
            messageVi: deferForContrast
              ? 'Sắp tiêm cản quang iod: Tạm hoãn khởi trị mới RASi đến sau thủ thuật 48–72h'
              : passedSbp
                ? `Huyết áp tâm thu ${sbp} mmHg >= ${minInitSbp}: Đạt yêu cầu huyết động`
                : sbp === undefined
                  ? 'Chưa có số đo Huyết áp tâm thu: Không đạt cổng an toàn (Fail-closed)'
                  : `Huyết áp tâm thu ${sbp} mmHg < ${minInitSbp}: Nguy cơ tụt HA tư thế, tạm hoãn`,
          },
        ],
        citationIds: Array.from(new Set(displayCitations)),
        priority: 92,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm',
      'kdigo.ckd.2024.rec_3_6_2_rasi_a2_nondm',
      'kdigo.ckd.2024.rec_3_6_3_rasi_dm',
      'esc.2025.pregnancy.rasi_lactation',
    ],
  },
];
