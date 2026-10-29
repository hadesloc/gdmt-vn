/**
 * GDMT-VN Lipid Module - Acute HTG Pancreatitis Crisis & Inpatient Severe HTG Rules
 * Phân quyền: Agent I5 (Round 3 Remediation — split from rules.tg.ts & rules.inpatient.other.ts)
 */

import type { Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  formatTg,
  getActiveFibrateMatches,
  getActiveLipidMeds,
  hasLipidDrugAllergy
} from './helpers';

function dedupCitations(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export const lipidHtgCrisisRules: Rule[] = [
  {
    id: 'lipid.tg.outpatient_acute_pancreatitis_refer',
    module: 'lipid',
    nameVi: 'Ngoại trú có viêm tụy cấp kèm tăng Triglyceride: Chuyển nhập viện cấp cứu / Hồi sức ngay',
    citationIds: [
      'esc.lipid.2019.htg_pancreatitis_10mmol',
      'esc.lipid.2019.plasmapheresis_acute_htg',
      'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
    ],
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && safety.hasAcutePancreatitis;
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      const tgSevere10 = thFor('tg', 'lipid.tg.severe_pancreatitis_10');
      const tgText = tg !== undefined ? ` (TG ${formatTg(tg, ctx)})` : '';
      return {
        id: 'rec_lipid_outpt_acute_pancreatitis_refer',
        module: 'lipid',
        tier: 'Cấp cứu Nội khoa — Viêm tụy cấp do tăng Triglyceride',
        tierOrder: 1,
        action: 'REFER',
        title: `Chuyển nhập viện Cấp cứu / Hồi sức tích cực ngay lập tức để xử trí viêm tụy cấp${tgText}`,
        rationale:
          `Bệnh nhân có biểu hiện viêm tụy cấp${tgText}: tạm nhịn ăn đường miệng (NPO), tạm hoãn các thuốc hạ lipid đường uống cho đến khi hết liệt ruột, truyền dịch tinh thể tích cực, truyền insulin tĩnh mạch (đặc biệt khi tăng đường huyết) và đánh giá lọc huyết tương / thay huyết tương (plasmapheresis) nếu TG tăng rất cao (≥ ${tgSevere10} mmol/L).`,
        gates: [
          {
            parameter: 'acutePancreatitis',
            passed: false,
            action: 'contra',
            messageVi: 'Viêm tụy cấp: chuyển nhập viện cấp cứu / ICU ngay'
          }
        ],
        citationIds: [
          'esc.lipid.2019.htg_pancreatitis_10mmol',
          'esc.lipid.2019.plasmapheresis_acute_htg',
          'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
        ],
        priority: 100
      };
    }
  },

  {
    id: 'lipid.inpatient.acute_pancreatitis_icu_protocol',
    module: 'lipid',
    nameVi: 'Nội viện viêm tụy cấp do tăng Triglyceride: Phác đồ cấp cứu NPO + Bù dịch + Insulin tĩnh mạch ± Lọc huyết tương',
    citationIds: [
      'esc.lipid.2019.htg_pancreatitis_10mmol',
      'esc.lipid.2019.plasmapheresis_acute_htg',
      'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
      'esc.lipid.2019.htg_fenofibrate_pancreatitis'
    ],
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && safety.hasAcutePancreatitis;
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      const tgSevere10 = thFor('tg', 'lipid.tg.severe_pancreatitis_10');
      const omegaMin = thFor('dose_g', 'lipid.dose.omega3_min');
      const omegaMax = thFor('dose_g', 'lipid.dose.omega3_max');
      const tgText = tg !== undefined ? ` (TG ${formatTg(tg, ctx)})` : '';
      const isCriticalTg = tg !== undefined && tg >= tgSevere10;
      const hasOralMeds = getActiveLipidMeds(ctx).length > 0;

      const warnings: string[] = [
        'Tạm ngưng các thuốc hạ lipid đường uống (Statin / Fibrate / Ezetimibe) trong giai đoạn nhịn ăn đường miệng (NPO) hoặc liệt ruột cơ năng; khởi động/dùng lại Fenofibrate (hiệu chỉnh theo eGFR, tránh nếu bệnh túi mật/xơ gan) ± Omega-3 ngay khi dung nạp đường miệng.'
      ];

      return {
        id: 'rec_lipid_inpt_acute_pancreatitis_icu_protocol',
        module: 'lipid',
        tier: 'Hồi sức Cấp cứu Nội viện — Viêm tụy cấp do tăng Triglyceride máu',
        tierOrder: 1,
        action: 'REFER',
        title: `Phác đồ cấp cứu Viêm tụy cấp${tgText}: Nhịn ăn (NPO), bù dịch, Insulin tĩnh mạch${isCriticalTg ? ' và hội chẩn lọc huyết tương (Plasmapheresis)' : ''}`,
        rationale:
          `Bệnh nhân nội viện đang trong đợt viêm tụy cấp${tgText}: (1) Nhịn ăn đường miệng hoàn toàn (NPO) và bù dịch tinh thể tích cực; ` +
          `${hasOralMeds ? '(2) Tạm hoãn thuốc hạ lipid đường uống hiện có trong thời gian NPO; ' : '(2) Chưa dùng thuốc uống khi đang NPO; '}` +
          `(3) Truyền insulin tĩnh mạch liên tục (kèm theo dõi sát đường huyết/kali máu) để hoạt hóa lipoprotein lipase hạ nhanh chylomicron; ` +
          `(4) Hội chẩn Hồi sức tích cực cân nhắc thay huyết tương / lọc huyết tương (plasmapheresis) nếu TG tăng rất cao (≥ ${tgSevere10} mmol/L) kèm suy tạng hoặc toan chuyển hóa; ` +
          `(5) Khi hết đau bụng và ăn lại được: chế độ ăn rất ít mỡ, kiêng rượu tuyệt đối và dùng Fenofibrate ± Omega-3 (${omegaMin}–${omegaMax} g/ngày).`,
        gates: [
          {
            parameter: 'acutePancreatitis',
            passed: false,
            action: 'contra',
            value: tg,
            threshold: tgSevere10,
            messageVi: 'Viêm tụy cấp nội viện: ưu tiên NPO + dịch truyền + Insulin IV ± Plasmapheresis'
          }
        ],
        warnings,
        citationIds: [
          'esc.lipid.2019.htg_pancreatitis_10mmol',
          'esc.lipid.2019.plasmapheresis_acute_htg',
          'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
          'esc.lipid.2019.htg_fenofibrate_pancreatitis'
        ],
        priority: 99
      };
    }
  },

  {
    id: 'lipid.inpatient.severe_tg_pancreatitis',
    module: 'lipid',
    nameVi: 'Nội viện tăng Triglyceride rất nặng (≥ 5.6 mmol/L): Xử trí khẩn phòng viêm tụy cấp',
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
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasAcutePancreatitis) return false;
      if (getActiveFibrateMatches(ctx).length > 0) return false;
      if (safety.hasRhabdoRiskCk || safety.hasModerateCk) return false;
      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      return tg >= thFor('tg', 'lipid.tg.pancreatitis_risk');
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      if (tg === undefined) return null;
      const egfr = need(ctx, 'egfr');
      const safety = assessStatinSafety(ctx);
      const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
      const egfrCkd = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');
      const tgSevere10 = thFor('tg', 'lipid.tg.severe_pancreatitis_10');
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
          id: 'rec_lipid_inpt_tg_crisis_gallbladder_avoid_feno',
          module: 'lipid',
          tier: 'Cấp cứu Nội viện — Tăng Triglyceride rất nặng có chống chỉ định Fibrate',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'fenofibrate',
          title: `Chống chỉ định Fenofibrate (bệnh túi mật/sỏi mật, bệnh gan/xơ gan hoặc dị ứng) — Xử trí bằng tiết chế mỡ, kiểm soát đường huyết và Omega-3 (${omegaMin}–${omegaMax} g/ngày)`,
          rationale:
            `TG ${tgDisplay} gây nguy cơ cao viêm tụy cấp, nhưng Fenofibrate chống chỉ định do bệnh lý túi mật / gan mật hoặc dị ứng. Ưu tiên tiết chế tuyệt đối chất béo, kiểm soát đường huyết tích cực và dùng Omega-3 (${omegaMin}–${omegaMax} g/ngày).`,
          gates: [
            {
              parameter: 'gallbladder_or_hepatic',
              passed: false,
              action: 'contra',
              messageVi: 'Chống chỉ định Fenofibrate do bệnh túi mật / bệnh gan / dị ứng'
            }
          ],
          citationIds: [
            'acc.lipid.2026.fibrate_gallbladder_contra',
            'esc.lipid.2019.htg_fenofibrate_pancreatitis',
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis'
          ],
          priority: 96
        };
      }

      if (safety.onDialysis || (egfr !== undefined && egfr < egfrSevere)) {
        return {
          id: 'rec_lipid_inpt_tg_crisis_ckd_avoid_feno',
          module: 'lipid',
          tier: 'Cấp cứu Nội viện — Tăng Triglyceride rất nặng kèm Suy thận nặng',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'fenofibrate',
          title: `Chống chỉ định Fenofibrate do eGFR < ${egfrSevere} mL/phút/1.73m² — Xử trí bằng nhịn ăn, truyền dịch, Insulin tĩnh mạch (nếu tăng đường huyết) và Omega-3`,
          rationale:
            `TG ${tgDisplay} gây nguy cơ cao viêm tụy cấp, nhưng Fenofibrate chống chỉ định khi eGFR < ${egfrSevere} mL/phút/1.73m² hoặc đang lọc máu. Xử trí nội viện bằng tiết chế tuyệt đối chất béo, kiểm soát đường huyết bằng insulin và dùng Omega-3 (${omegaMin}–${omegaMax} g/ngày).`,
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
          priority: 96
        };
      }

      if (egfr === undefined) {
        return missingInputRec(
          'lipid',
          'egfr',
          `loại trừ suy thận nặng (eGFR < ${egfrSevere} mL/phút/1.73m² chống chỉ định Fenofibrate) và hiệu chỉnh liều trước khi khởi trị Fenofibrate nội viện ở bệnh nhân tăng Triglyceride nặng (${tgDisplay}); xử trí ban đầu bằng tiết chế mỡ, bù dịch, kiểm soát đường huyết và cân nhắc Omega-3 (${omegaMin}–${omegaMax} g/ngày)`,
          [
            'acc.lipid.2026.fenofibrate_renal',
            'esc.lipid.2019.htg_fenofibrate_pancreatitis',
            'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
            'byt.ckd.2024.fenofibrate_creatinine_monitor'
          ]
        );
      }

      const isVerySevere = tg >= tgSevere10;
      const isModerateCkd = egfr < egfrCkd;
      const warnings: string[] = [
        'Theo dõi sát amylase/lipase, đau bụng thượng vị, creatinine huyết thanh và CK; không dùng Gemfibrozil phối hợp Statin.'
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
          `CKD mức độ vừa (eGFR ${egfrSevere}–<${egfrCkd}): bắt buộc khởi đầu Fenofibrate liều thấp (từ ${fenoReduced} mg/ngày).`
        );
      }
      if (safety.hasVka) {
        warnings.push(
          'Đang dùng thuốc kháng vitamin K (Warfarin/Acenocoumarol): Fenofibrate làm tăng mạnh INR và nguy cơ xuất huyết; cần theo dõi sát PT/INR và giảm liều kháng đông.'
        );
        cids.push('byt.ckd.2024.fibrate_warfarin_cyclosporine_ddi');
      }

      return {
        id: 'rec_lipid_inpt_tg_crisis_fenofibrate',
        module: 'lipid',
        tier: 'Nội viện — Xử trí tăng Triglyceride cấp nguy cơ viêm tụy',
        tierOrder: 1,
        action: 'START',
        drugId: 'fenofibrate',
        dose: isModerateCkd
          ? `Khởi đầu giảm liều từ ${fenoReduced} mg 1 lần/ngày (khi dung nạp đường uống)`
          : `${fenoStart}–${fenoMax} mg uống 1 lần/ngày (khi dung nạp đường uống)`,
        title: `Xử trí tăng Triglyceride nặng nội viện (${tgDisplay}) và khởi trị Fenofibrate phòng viêm tụy cấp`,
        rationale:
          `Triglyceride tăng rất cao (${tgDisplay}${
            isVerySevere ? `, vượt ngưỡng nguy kịch ≥ ${formatTg(tgSevere10, ctx)}` : ''
          }). Áp dụng chế độ ăn rất ít mỡ, kiêng rượu tuyệt đối, kiểm soát đường huyết tích cực và bắt đầu Fenofibrate ± Omega-3 (${omegaMin}–${omegaMax} g/ngày).`,
        gates: [],
        warnings,
        citationIds: dedupCitations(cids),
        priority: 94
      };
    }
  }
];
