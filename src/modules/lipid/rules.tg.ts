/**
 * GDMT-VN Lipid Module - Outpatient Severe HTG Prevention & Residual Icosapent Ethyl Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types';
import { CHOL_CONVERSION_FACTOR, TG_CONVERSION_FACTOR } from '../../engine/units';
import {
  assessStatinSafety,
  buildCommonLipidWarnings,
  evaluateLdlTargetForPatient,
  formatTg,
  getActiveFibrateMatches,
  getActiveStatin,
  hasAscvdEquivalent,
  hasIsolatedHfWithoutStatinIndication,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export const lipidTgRules: Rule[] = [
  {
    id: 'lipid.tg.severe_pancreatitis_prevention',
    module: 'lipid',
    nameVi: 'Tăng Triglyceride rất nặng (≥ 5.6 mmol/L): Khởi trị Fenofibrate / Omega-3 dự phòng viêm tụy cấp',
    citationIds: [
      'acc.lipid.2026.fenofibrate_renal',
      'acc.lipid.2026.fibrate_gallbladder_contra',
      'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
      'esc.lipid.2019.htg_fenofibrate_pancreatitis',
      'acc.lipid.2026.fenofibrate_dose_range',
      'byt.lipid.2020.fenofibrate_145_200',
      'byt.ckd.2024.htg_500_1000_fibrate',
      'byt.ckd.2024.fenofibrate_creatinine_monitor',
      'byt.ckd.2024.fibrate_warfarin_cyclosporine_ddi'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasAcutePancreatitis) return false;
      if (getActiveFibrateMatches(ctx).length > 0) return false;
      if (safety.hasRhabdoRiskCk || safety.hasModerateCk) return false;
      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      const tgPancreatitis = thFor('tg', 'lipid.tg.pancreatitis_risk');
      const tgElevated = thFor('tg', 'lipid.tg.elevated_cv_risk');
      return (
        tg >= tgPancreatitis ||
        (hasLipidFlag(ctx, 'historyPancreatitis') && tg >= tgElevated)
      );
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      if (tg === undefined) return null;
      const egfr = need(ctx, 'egfr');
      const safety = assessStatinSafety(ctx);
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const egfrCkd = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
      const fenoStart = thFor('dose_mg', 'lipid.dose.fenofibrate_start_145');
      const fenoMax = thFor('dose_mg', 'lipid.dose.fenofibrate_standard');
      const fenoReduced = thFor('dose_mg', 'lipid.dose.fenofibrate_reduced');
      const omegaMin = thFor('dose_g', 'lipid.dose.omega3_min');
      const omegaMax = thFor('dose_g', 'lipid.dose.omega3_max');
      const tgDisplay = formatTg(tg, ctx);

      if (
        safety.hasGallbladderContra ||
        safety.hasSevereAlt ||
        safety.hasCirrhosisAny ||
        hasLipidDrugAllergy(ctx, 'fenofibrate')
      ) {
        return {
          id: 'rec_lipid_severe_htg_gallbladder_hepatic_avoid_feno',
          module: 'lipid',
          tier: 'Dự phòng viêm tụy cấp (Chống chỉ định Fibrate)',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'fenofibrate',
          title: `Chống chỉ định Fenofibrate (bệnh túi mật/sỏi mật, bệnh gan/xơ gan hoặc dị ứng) — Ưu tiên Omega-3 kê đơn (${omegaMin}–${omegaMax} g/ngày)`,
          rationale:
            `TG tăng rất cao (${tgDisplay}) có nguy cơ viêm tụy cấp, nhưng Fenofibrate chống chỉ định khi có bệnh túi mật / sỏi mật, bệnh gan hoạt động / xơ gan hoặc tiền sử quá mẫn; áp dụng chế độ ăn rất ít chất béo, kiêng rượu tuyệt đối và dùng Omega-3 kê đơn (${omegaMin}–${omegaMax} g/ngày).`,
          gates: [
            {
              parameter: safety.hasGallbladderContra ? 'gallbladderDisease' : 'hepatic_or_allergy',
              passed: false,
              action: 'contra',
              messageVi: 'Bệnh túi mật / sỏi mật, bệnh gan hoặc dị ứng Fibrate: chống chỉ định Fenofibrate'
            }
          ],
          citationIds: [
            'acc.lipid.2026.fibrate_gallbladder_contra',
            'esc.lipid.2019.htg_fenofibrate_pancreatitis',
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
          ],
          priority: 93
        };
      }

      if (safety.onDialysis || (egfr !== undefined && egfr < egfrSevere)) {
        return {
          id: 'rec_lipid_severe_htg_ckd_avoid_feno',
          module: 'lipid',
          tier: 'Dự phòng viêm tụy cấp (Có suy thận nặng)',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'fenofibrate',
          title: `Chống chỉ định Fenofibrate do eGFR < ${egfrSevere} mL/phút/1.73m² — Chuyển sang Omega-3 liều cao (${omegaMin}–${omegaMax} g/ngày)`,
          rationale:
            `TG tăng rất cao (${tgDisplay}) có nguy cơ viêm tụy cấp, nhưng Fenofibrate chống chỉ định tuyệt đối khi eGFR < ${egfrSevere} mL/phút/1.73m² hoặc đang lọc máu; ưu tiên chế độ ăn hạn chế tối đa chất béo, kiêng rượu tuyệt đối và dùng Omega-3 (${omegaMin}–${omegaMax} g/ngày).`,
          gates: [
            {
              parameter: 'egfr',
              passed: false,
              action: 'contra',
              value: egfr,
              threshold: egfrSevere,
              messageVi: `eGFR < ${egfrSevere} mL/phút/1.73m²: chống chỉ định Fenofibrate`
            }
          ],
          citationIds: [
            'acc.lipid.2026.fenofibrate_renal',
            'esc.lipid.2019.htg_fenofibrate_pancreatitis',
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
          ],
          priority: 93
        };
      }

      if (egfr === undefined) {
        return missingInputRec(
          'lipid',
          'egfr',
          `loại trừ suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m² chống chỉ định Fenofibrate) và hiệu chỉnh liều trước khi khởi trị Fenofibrate ở bệnh nhân tăng Triglyceride nặng (${tgDisplay}); trong khi chờ kết quả Creatinin/eGFR cần tiết chế nghiêm ngặt chất béo, kiêng rượu bia tuyệt đối, tầm soát nguyên nhân thứ phát và cân nhắc Omega-3 (${omegaMin}–${omegaMax} g/ngày)`,
          [
            'acc.lipid.2026.fenofibrate_renal',
            'esc.lipid.2019.htg_fenofibrate_pancreatitis',
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
            'byt.ckd.2024.fenofibrate_creatinine_monitor'
          ]
        );
      }

      const isModerateCkd = egfr < egfrCkd;
      const onStatin = getActiveStatin(ctx) !== null;
      const warnings: string[] = [
        'Không dùng Gemfibrozil phối hợp Statin; kiểm tra chức năng thận trước và sau khi khởi trị Fenofibrate.',
        ...buildCommonLipidWarnings(ctx, { isStatin: false, drugId: 'fenofibrate' })
      ];
      const cids = [
        'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
        'esc.lipid.2019.htg_fenofibrate_pancreatitis',
        'acc.lipid.2026.fenofibrate_dose_range',
        'byt.lipid.2020.fenofibrate_145_200',
        'byt.ckd.2024.htg_500_1000_fibrate',
        'byt.ckd.2024.fenofibrate_creatinine_monitor'
      ];

      if (isModerateCkd) {
        cids.push('acc.lipid.2026.fenofibrate_renal');
        warnings.push(
          `CKD mức độ vừa (eGFR ${egfrSevere}–<${egfrCkd}): bắt buộc khởi đầu Fenofibrate liều thấp (từ ${fenoReduced} mg/ngày) và theo dõi sát creatinine huyết thanh.`
        );
      }
      if (onStatin || safety.hasColchicine) {
        warnings.push(
          'Phối hợp Fenofibrate với Statin hoặc Colchicine làm tăng nguy cơ bệnh cơ và tăng creatinine hồi phục; theo dõi sát CK và chức năng thận.'
        );
      }
      if (safety.hasVka) {
        warnings.push(
          'Đang dùng thuốc kháng vitamin K (Warfarin/Acenocoumarol): Fenofibrate làm tăng mạnh INR và nguy cơ xuất huyết; cần theo dõi sát PT/INR và giảm liều kháng đông.'
        );
        cids.push('byt.ckd.2024.fibrate_warfarin_cyclosporine_ddi');
      }

      return {
        id: 'rec_lipid_severe_htg_fenofibrate',
        module: 'lipid',
        tier: 'Dự phòng viêm tụy cấp do tăng Triglyceride nặng',
        tierOrder: 1,
        action: 'START',
        drugId: 'fenofibrate',
        dose: isModerateCkd
          ? `Khởi đầu giảm liều từ ${fenoReduced} mg 1 lần/ngày (theo chế phẩm hàm lượng thấp)`
          : `${fenoStart}–${fenoMax} mg uống 1 lần/ngày`,
        title: `Khởi trị Fenofibrate dự phòng viêm tụy cấp do tăng Triglyceride nặng (${tgDisplay})`,
        rationale:
          `Triglyceride ${tgDisplay} vượt ngưỡng báo động viêm tụy cấp. Cần tiết chế nghiêm ngặt mỡ bão hòa, kiêng tuyệt đối rượu bia, kiểm soát đường huyết và khởi trị Fenofibrate (phối hợp thêm Omega-3 ${omegaMin}–${omegaMax} g/ngày nếu TG vẫn cao).`,
        gates: [],
        warnings,
        citationIds: dedupCitations(cids),
        priority: 91
      };
    }
  },

  {
    id: 'lipid.tg.severe_omega3_alternative',
    module: 'lipid',
    nameVi: 'Tăng Triglyceride rất nặng có chống chỉ định Fenofibrate: Khởi trị Omega-3 kê đơn 2–4 g/ngày',
    citationIds: [
      'esc.lipid.2019.htg_fenofibrate_pancreatitis',
      'acc.lipid.2026.omega3_dose_4g',
      'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasAcutePancreatitis) return false;
      if (hasMed(ctx, 'omega3') || hasMed(ctx, 'icosapent_ethyl') || hasLipidDrugAllergy(ctx, 'omega3')) {
        return false;
      }
      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      const tgPancreatitis = thFor('tg', 'lipid.tg.pancreatitis_risk');
      const tgElevated = thFor('tg', 'lipid.tg.elevated_cv_risk');
      const severeHtg =
        tg >= tgPancreatitis ||
        (hasLipidFlag(ctx, 'historyPancreatitis') && tg >= tgElevated);
      if (!severeHtg) return false;
      const egfr = need(ctx, 'egfr');
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      return (
        safety.onDialysis ||
        (egfr !== undefined && egfr < egfrSevere) ||
        safety.hasGallbladderContra ||
        safety.hasCirrhosisAny ||
        hasLipidDrugAllergy(ctx, 'fenofibrate')
      );
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      if (tg === undefined) return null;
      const omegaMin = thFor('dose_g', 'lipid.dose.omega3_min');
      const omegaMax = thFor('dose_g', 'lipid.dose.omega3_max');
      const tgDisplay = formatTg(tg, ctx);
      return {
        id: 'rec_lipid_severe_htg_start_omega3',
        module: 'lipid',
        tier: 'Dự phòng viêm tụy cấp — Liệu pháp thay thế khi chống chỉ định Fibrate',
        tierOrder: 2,
        action: 'START',
        drugId: 'omega3',
        dose: `${omegaMin}–${omegaMax} g/ngày uống cùng bữa ăn`,
        title: `Khởi trị acid béo Omega-3 kê đơn (${omegaMin}–${omegaMax} g/ngày) hạ Triglyceride nặng (${tgDisplay})`,
        rationale: `Do chống chỉ định với nhóm Fibrate, khởi trị Omega-3 kê đơn liều cao (${omegaMin}–${omegaMax} g/ngày) kết hợp tiết chế nghiêm ngặt chất béo và kiêng rượu tuyệt đối để giảm nguy cơ viêm tụy cấp.`,
        gates: [],
        citationIds: [
          'esc.lipid.2019.htg_fenofibrate_pancreatitis',
          'acc.lipid.2026.omega3_dose_4g',
          'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
        ],
        priority: 90
      };
    }
  },

  {
    id: 'lipid.tg.residual_icosapent_ethyl',
    module: 'lipid',
    nameVi: 'Tăng Triglyceride tồn dư trên nền Statin: Cân nhắc Icosapent ethyl 4 g/ngày',
    citationIds: [
      'esc.lipid.2019.htg_icosapent_ethyl',
      'acc.lipid.2026.icosapent_cor2b',
      'acc.lipid.2026.icosapent_age50_tg150',
      'acc.lipid.2026.icosapent_af_bleeding'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasIsolatedHfWithoutStatinIndication(ctx)) return false;
      const safety = assessStatinSafety(ctx);
      if (
        safety.isReproContra ||
        safety.hasSevereAlt ||
        safety.hasRhabdoRiskCk ||
        safety.hasModerateCk ||
        safety.hasAcutePancreatitis
      ) {
        return false;
      }
      if (safety.onDialysis && !hasAscvdEquivalent(ctx)) return false;
      const activeStatin = getActiveStatin(ctx);
      if (
        !activeStatin ||
        activeStatin.hasDoseViolation ||
        hasMed(ctx, 'icosapent_ethyl') ||
        hasMed(ctx, 'omega3') ||
        hasLipidDrugAllergy(ctx, 'icosapent_ethyl')
      ) {
        return false;
      }

      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      const tgPancreatitis = thFor('tg', 'lipid.tg.pancreatitis_risk');
      if (tg >= tgPancreatitis) return false;

      if (ctx.settings.profile === 'US') {
        const age = need(ctx, 'age');
        const ldl = need(ctx, 'ldl');
        const accMinAge = thFor('age', 'lipid.icosapent.acc_min_age');
        const accTgMmol = thFor('tg', 'lipid.tg.acc_icosapent_min');
        const accTgMgDl = thFor('tg_mgdl', 'lipid.tg.acc_icosapent_min_mgdl');
        const modLdlMmol = thFor('ldl', 'lipid.target.moderate_ldl');
        const modLdlMgDl = thFor('ldl_mgdl', 'lipid.target.moderate_ldl_mgdl');

        if (age === undefined || age < accMinAge) return false;
        if (!hasAscvdEquivalent(ctx) && !hasLipidFlag(ctx, 'dm')) return false;

        const tgEligible =
          ctx.settings.units.lipid === 'mg_dL'
            ? Math.round(tg * TG_CONVERSION_FACTOR) >= accTgMgDl
            : tg >= accTgMmol;
        if (!tgEligible) return false;

        if (ldl === undefined) return false;
        const ldlControlled =
          ctx.settings.units.lipid === 'mg_dL'
            ? Math.round(ldl * CHOL_CONVERSION_FACTOR) < modLdlMgDl
            : ldl < modLdlMmol;
        if (!ldlControlled) return false;
      } else {
        const tgMin = thFor('tg', 'lipid.tg.residual_risk_min');
        if (tg < tgMin) return false;
      }

      const targetInfo = evaluateLdlTargetForPatient(ctx);
      if (!targetInfo) return false;
      return (
        targetInfo.riskTier === 'extreme' ||
        targetInfo.riskTier === 'very_high' ||
        targetInfo.riskTier === 'high'
      );
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      if (tg === undefined) return null;
      const safety = assessStatinSafety(ctx);
      const icosapentBid = thFor('dose_g', 'lipid.dose.icosapent_bid');
      const icosapentDaily = thFor('dose_g', 'lipid.dose.icosapent_daily');
      const modLdlMgDl = thFor('ldl_mgdl', 'lipid.target.moderate_ldl_mgdl');
      const accMinAge = thFor('age', 'lipid.icosapent.acc_min_age');
      const accTgMgDl = thFor('tg_mgdl', 'lipid.tg.acc_icosapent_min_mgdl');
      const tgDisplay = formatTg(tg, ctx);
      const hasAfHistory = hasLipidFlag(ctx, 'af');
      const hasOac = safety.hasAnyOac;

      const warnings: string[] = [
        'Tăng nhẹ nguy cơ rung nhĩ/cuồng nhĩ phải nhập viện và nguy cơ chảy máu trên nền thuốc chống đông/kháng kết tập tiểu cầu.'
      ];
      let personalizedNote = '';
      if (hasAfHistory && hasOac) {
        personalizedNote =
          ' CẢNH BÁO CÁ THỂ HÓA: Bệnh nhân đã có rung nhĩ và đang dùng thuốc chống đông — cần cân nhắc rất kỹ nguy cơ tái phát rung nhĩ và xuất huyết nặng trước khi kê đơn.';
      } else if (hasAfHistory) {
        personalizedNote =
          ' LƯU Ý CÁ THỂ HÓA: Bệnh nhân có tiền sử rung nhĩ — theo dõi sát triệu chứng loạn nhịp khi dùng Icosapent ethyl.';
      } else if (hasOac) {
        personalizedNote =
          ' LƯU Ý CÁ THỂ HÓA: Bệnh nhân đang dùng thuốc chống đông đường uống — theo dõi sát biến cố xuất huyết nếu phối hợp Icosapent ethyl.';
      }

      return {
        id: 'rec_lipid_residual_tg_icosapent',
        module: 'lipid',
        tier: 'Giảm nguy cơ tim mạch tồn dư do tăng Triglyceride',
        tierOrder: 3,
        action: 'CONSIDER',
        drugId: 'icosapent_ethyl',
        dose: `${icosapentBid} g x 2 lần/ngày uống trong bữa ăn (tổng ${icosapentDaily} g/ngày)`,
        title: `Cân nhắc bổ sung Icosapent ethyl (${icosapentDaily} g/ngày) giảm nguy cơ tim mạch tồn dư trên nền Statin`,
        rationale:
          `Bệnh nhân nguy cơ cao / rất cao đang điều trị Statin nhưng TG vẫn còn cao (${tgDisplay}). ` +
          `Bổ sung EPA tinh khiết liều cao (Icosapent ethyl ${icosapentBid} g x 2 lần/ngày — thử nghiệm REDUCE-IT, ESC 2025 Class IIa-B) giúp giảm biến cố tim mạch thiếu máu cục bộ (không thay thế bằng viên dầu cá EPA+DHA hỗn hợp thông thường).${personalizedNote}`,
        gates: [],
        warnings,
        profileDiff: {
          VN: 'Tại Việt Nam: chỉ dùng chế phẩm Icosapent ethyl tinh khiết nếu sẵn có; không thay bằng thực phẩm chức năng dầu cá hỗn hợp.',
          US: `ACC/AHA 2026 xếp Icosapent ethyl ở mức COR 2b, LOE B-R (cân nhắc ở người ≥ ${accMinAge} tuổi có ASCVD hoặc ĐTĐ đang dùng statin tối đa dung nạp với TG ≥ ${accTgMgDl} mg/dL và LDL-C < ${modLdlMgDl} mg/dL do cân đối nguy cơ rung nhĩ và chảy máu).`
        },
        citationIds: [
          'esc.lipid.2019.htg_icosapent_ethyl',
          'acc.lipid.2026.icosapent_cor2b',
          'acc.lipid.2026.icosapent_age50_tg150',
          'acc.lipid.2026.icosapent_af_bleeding'
        ],
        priority: 75
      };
    }
  }
];
