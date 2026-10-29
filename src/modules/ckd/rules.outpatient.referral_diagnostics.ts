/**
 * GDMT-VN CKD Module - Outpatient Nephrology Referral, 2-Year KFRE KRT Prep, Cystatin C & Missing-Input Rules
 * Phân quyền: Agent E (Round 4 Remediation & < 20 KB Modularization)
 * Bao phủ: CKD-R4-R1-07 (2-year KFRE >= 10% multidisciplinary care & >= 40% KRT/access/transplant prep)
 */

import type { Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  getKfre2y,
  getKfre5y,
  hasCkdFlag,
  isAkiActive,
  isOutpatientAcuteCrisis,
} from './helpers';

export const ckdOutpatientReferralDiagnosticsRules: Rule[] = [
  // 1. Tiêu chuẩn Chuyển khám Chuyên khoa Thận bắt buộc (KDIGO 2024 Fig 48)
  {
    id: 'ckd.outpatient.nephrology_referral',
    module: 'ckd',
    nameVi: 'Chỉ định chuyển khám Chuyên khoa Thận học',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;

      const egfr = need(ctx, 'egfr');
      const uacr = need(ctx, 'uacr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const hematuria = Boolean(custom?.hematuria);
      const kfre5y = getKfre5y(ctx);

      const severeEgfr = egfr !== undefined && egfr < thFor('egfr', 'ckd.referral.egfr_threshold');
      const highKfre = kfre5y !== undefined && kfre5y >= thFor('percentage', 'ckd.kfre.referral_5y_max');
      const nephriticA3 = uacr !== undefined && uacr >= thFor('uacr', 'ckd.uacr.a2_max_mgmmol') && hematuria;
      const veryHighAlbuminuria =
        uacr !== undefined && uacr > thFor('uacr', 'ckd.referral.uacr_high_threshold_mgmmol');

      return severeEgfr || highKfre || nephriticA3 || veryHighAlbuminuria;
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr');
      const uacr = need(ctx, 'uacr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const kfre5y = getKfre5y(ctx);

      const referEgfr = thFor('egfr', 'ckd.referral.egfr_threshold');
      const referKfreMax = thFor('percentage', 'ckd.kfre.referral_5y_max');
      const a2Max = thFor('uacr', 'ckd.uacr.a2_max_mgmmol');
      const uacrHigh = thFor('uacr', 'ckd.referral.uacr_high_threshold_mgmmol');

      const reasons: string[] = [];
      if (egfr !== undefined && egfr < referEgfr) {
        reasons.push(`eGFR ${egfr.toFixed(0)} mL/phút/1.73m² < ${referEgfr} (Giai đoạn G4–G5)`);
      }
      if (kfre5y !== undefined && kfre5y >= referKfreMax) {
        reasons.push(`Nguy cơ suy thận 5 năm KFRE ${kfre5y.toFixed(1)}% >= ${referKfreMax}%`);
      }
      if (uacr !== undefined && uacr >= a2Max && custom?.hematuria) {
        reasons.push('Albumin niệu tăng nặng kèm tiểu máu vi thể');
      }
      if (uacr !== undefined && uacr > uacrHigh) {
        reasons.push(`Albumin niệu rất cao UACR ${uacr.toFixed(0)} mg/mmol (> ${uacrHigh} mg/mmol)`);
      }

      return {
        id: 'rec_ckd_refer_specialist',
        module: 'ckd',
        tier: 'Chuyển khám chuyên khoa',
        tierOrder: 4,
        action: 'REFER',
        title: 'Chuyển khám Bác sĩ Chuyên khoa Thận học',
        rationale: `Theo KDIGO 2024 (Practice Point 5.1.1 & Figure 48): Bệnh nhân đạt các tiêu chí bắt buộc chuyển tuyến chuyên khoa Thận: ${reasons.join('; ')}. Cần phối hợp quản lý đa chuyên khoa, phòng ngừa biến chứng ure máu cao và lập kế hoạch chuẩn bị điều trị thay thế thận (KRT).`,
        gates: [],
        citationIds: [
          'kdigo.ckd.2024.fig_48_referral_criteria',
          'kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold',
        ],
        priority: 99,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.fig_48_referral_criteria',
      'kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold',
    ],
  },

  // 2. Phân tầng theo KFRE 2 năm: Chăm sóc đa chuyên khoa (>= 10%) & Chuẩn bị KRT / Bảo tồn tĩnh mạch (>= 40%) (CKD-R4-R1-07)
  {
    id: 'ckd.outpatient.kfre_2y_multidisciplinary_krt_prep',
    module: 'ckd',
    nameVi: 'Chăm sóc đa chuyên khoa và chuẩn bị điều trị thay thế thận theo ngưỡng KFRE 2 năm',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis') || isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) {
        return false;
      }
      const kfre2y = getKfre2y(ctx);
      if (kfre2y === undefined) return false;
      return kfre2y >= thFor('percentage', 'ckd.kfre.multidisciplinary_2y');
    },
    produce: (ctx) => {
      const kfre2y = getKfre2y(ctx)!;
      const multiMin = thFor('percentage', 'ckd.kfre.multidisciplinary_2y');
      const krtPrepMin = thFor('percentage', 'ckd.kfre.krt_prep_2y');
      const isKrtPrep = kfre2y >= krtPrepMin;

      if (isKrtPrep) {
        return {
          id: 'rec_ckd_kfre_2y_krt_prep',
          module: 'ckd',
          tier: 'Quản lý đa chuyên khoa & Chuẩn bị KRT',
          tierOrder: 4,
          action: 'MONITOR',
          title: `Chuẩn bị điều trị thay thế thận (KRT), tạo cầu nối mạch máu AVF & bảo tồn tĩnh mạch (KFRE 2 năm = ${kfre2y.toFixed(1)}%)`,
          rationale:
            `Theo KDIGO 2024 (Practice Point 2.2.2 & 2.2.3): Nguy cơ suy thận cần thay thế thận trong 2 năm theo KFRE đạt ${kfre2y.toFixed(1)}% (>= ${krtPrepMin}%). Cần lập tức triển khai tư vấn lựa chọn phương thức thay thế thận (chạy thận nhân tạo, lọc màng bụng, điều trị bảo tồn hoặc đánh giá ghép thận đón đầu), lập kế hoạch phẫu thuật cầu nối động - tĩnh mạch (AVF) và thực hiện bảo tồn hệ tĩnh mạch chi trên ("save the vein" — tránh lấy máu/đặt truyền tĩnh mạch cẳng tay không chủ ưu thế).`,
          gates: [
            {
              parameter: 'KFRE_2y',
              passed: true,
              value: kfre2y,
              threshold: krtPrepMin,
              messageVi: `KFRE 2 năm ${kfre2y.toFixed(1)}% >= ${krtPrepMin}%: Chỉ định chuẩn bị đường vào mạch máu (AVF), lọc màng bụng hoặc ghép thận`,
            },
          ],
          citationIds: [
            'kdigo.ckd.2024.pp_2_2_3_kfre_krt_prep',
            'kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold',
          ],
          priority: 82,
        };
      }

      return {
        id: 'rec_ckd_kfre_2y_multidisciplinary',
        module: 'ckd',
        tier: 'Quản lý đa chuyên khoa & Chuẩn bị KRT',
        tierOrder: 4,
        action: 'MONITOR',
        title: `Triển khai mô hình chăm sóc CKD đa chuyên khoa (KFRE 2 năm = ${kfre2y.toFixed(1)}%)`,
        rationale:
          `Theo KDIGO 2024 (Practice Point 2.2.2): Nguy cơ tiến triển đến suy thận giai đoạn cuối trong 2 năm đạt ${kfre2y.toFixed(1)}% (>= ${multiMin}%). Cần đưa bệnh nhân vào chương trình quản lý CKD đa chuyên khoa (bác sĩ thận học, dược sĩ lâm sàng, chuyên gia dinh dưỡng thận, điều dưỡng giáo dục bệnh nhân) và bắt đầu bảo vệ tĩnh mạch ngoại biên dự phòng tương lai.`,
        gates: [
          {
            parameter: 'KFRE_2y',
            passed: true,
            value: kfre2y,
            threshold: multiMin,
            messageVi: `KFRE 2 năm ${kfre2y.toFixed(1)}% >= ${multiMin}%: Bắt đầu chăm sóc CKD đa chuyên khoa`,
          },
        ],
        citationIds: ['kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold'],
        priority: 68,
      };
    },
    citationIds: [
      'kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold',
      'kdigo.ckd.2024.pp_2_2_3_kfre_krt_prep',
    ],
  },

  // 3. Cân nhắc chuyển khám Chuyên khoa Thận khi KFRE 5 năm 3%–<5%
  {
    id: 'ckd.outpatient.nephrology_referral_consider_kfre',
    module: 'ckd',
    nameVi: 'Cân nhắc chuyển khám Chuyên khoa Thận học theo ngưỡng KFRE 3%–5%',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      const egfr = need(ctx, 'egfr');
      const uacr = need(ctx, 'uacr');
      const custom = ctx.normalized.customInputs ?? ctx.patient.customInputs;
      const hematuria = Boolean(custom?.hematuria);
      const kfre5y = getKfre5y(ctx);
      if (kfre5y === undefined) return false;

      const severeEgfr = egfr !== undefined && egfr < thFor('egfr', 'ckd.referral.egfr_threshold');
      const nephriticA3 = uacr !== undefined && uacr >= thFor('uacr', 'ckd.uacr.a2_max_mgmmol') && hematuria;
      const veryHighAlbuminuria =
        uacr !== undefined && uacr > thFor('uacr', 'ckd.referral.uacr_high_threshold_mgmmol');
      if (severeEgfr || nephriticA3 || veryHighAlbuminuria) return false;

      const minKfre = thFor('percentage', 'ckd.kfre.referral_5y_min');
      const maxKfre = thFor('percentage', 'ckd.kfre.referral_5y_max');
      return kfre5y >= minKfre && kfre5y < maxKfre;
    },
    produce: (ctx) => {
      const kfre5y = getKfre5y(ctx)!;
      const minKfre = thFor('percentage', 'ckd.kfre.referral_5y_min');
      const maxKfre = thFor('percentage', 'ckd.kfre.referral_5y_max');

      return {
        id: 'rec_ckd_consider_refer_kfre',
        module: 'ckd',
        tier: 'Chuyển khám chuyên khoa',
        tierOrder: 4,
        action: 'CONSIDER',
        title: `Cân nhắc hội chẩn Chuyên khoa Thận học (KFRE 5 năm = ${kfre5y.toFixed(1)}%)`,
        rationale: `Theo KDIGO 2024 (Practice Point 2.2.1): Nguy cơ tiến triển đến suy thận cần điều trị thay thế trong 5 năm theo phương trình KFRE nằm trong ngưỡng chuyển tuyến ${minKfre}%–${maxKfre}% (hiện tại ${kfre5y.toFixed(1)}%). Cân nhắc hội chẩn bác sĩ chuyên khoa Thận tùy theo nguồn lực tại cơ sở y tế.`,
        gates: [
          {
            parameter: 'KFRE_5y',
            passed: true,
            value: kfre5y,
            threshold: minKfre,
            messageVi: `KFRE 5 năm ${kfre5y.toFixed(1)}% (trong khoảng ${minKfre}%–${maxKfre}%): Vùng cân nhắc hội chẩn chuyên khoa`,
          },
        ],
        citationIds: ['kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold'],
        priority: 65,
      };
    },
    citationIds: ['kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold'],
  },

  // 4. Gợi ý định lượng Cystatin C (eGFRcr-cys) khẳng định chẩn đoán ở nhóm ranh giới CKD G3aA1 (Grade 1C)
  {
    id: 'ckd.outpatient.cystatin_c_g3aa1_confirm',
    module: 'ckd',
    nameVi: 'Cân nhắc xét nghiệm Cystatin C (tính eGFRcr-cys) xác nhận chẩn đoán ở phân nhóm G3aA1',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      if (hasCkdFlag(ctx, 'onDialysis')) return false;
      if (isAkiActive(ctx) || isOutpatientAcuteCrisis(ctx)) return false;
      if (ctx.normalized.cystatinC !== undefined) return false;

      const egfr = need(ctx, 'egfr');
      const uacr = need(ctx, 'uacr');
      if (egfr === undefined || uacr === undefined) return false;

      const g3aMin = thFor('egfr', 'ckd.egfr.g3a_min');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const a1Max = thFor('uacr', 'ckd.uacr.a1_max_mgmmol');

      return egfr >= g3aMin && egfr < g2Min && uacr < a1Max;
    },
    produce: (ctx) => {
      const egfr = need(ctx, 'egfr')!;
      const g3aMin = thFor('egfr', 'ckd.egfr.g3a_min');
      const g2Min = thFor('egfr', 'ckd.egfr.g2_min');
      const a1Max = thFor('uacr', 'ckd.uacr.a1_max_mgmmol');

      return {
        id: 'rec_ckd_cystatin_c_confirm',
        module: 'ckd',
        tier: 'Đánh giá & Phân tầng chính xác',
        tierOrder: 3,
        action: 'CONSIDER',
        title: 'Cân nhắc định lượng thêm Cystatin C huyết thanh để tính eGFRcr-cys xác nhận phân tầng G3aA1',
        rationale:
          `Theo KDIGO 2024 (Recommendation 1.2.2.1, Grade 1C): Ở người lớn có eGFRcr trong vùng ranh giới G3a (${g3aMin}–<${g2Min} mL/phút/1.73m², hiện tại ${egfr.toFixed(0)}) kèm UACR bình thường (< ${a1Max} mg/mmol - A1) hoặc có khối cơ bất thường, định lượng kết hợp Creatinin và Cystatin C (eGFRcr-cys) giúp khẳng định chính xác chẩn đoán bệnh thận mạn và phân tầng nguy cơ.`,
        gates: [
          {
            parameter: 'eGFR',
            passed: true,
            value: egfr,
            threshold: g2Min,
            messageVi: `G3aA1 (eGFR ${egfr.toFixed(0)} mL/phút/1.73m², UACR < ${a1Max} mg/mmol): Khuyến cáo eGFRcr-cys xác nhận`,
          },
        ],
        citationIds: ['kdigo.ckd.2024.rec_1_2_2_1_cystatin_c'],
        priority: 55,
      };
    },
    citationIds: ['kdigo.ckd.2024.rec_1_2_2_1_cystatin_c'],
  },

  // 5. Các dòng CÂN NHẮC bổ sung dữ liệu đầu vào khi bị khuyết (Fail-closed QA-1)
  {
    id: 'ckd.outpatient.missing_scr_check',
    module: 'ckd',
    nameVi: 'Cân nhắc định lượng Creatinin huyết thanh nếu chưa có dữ liệu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      need(ctx, 'scr') === undefined &&
      ctx.normalized.cystatinC === undefined &&
      need(ctx, 'egfr') === undefined &&
      !hasCkdFlag(ctx, 'onDialysis'),
    produce: () =>
      missingInputRec(
        'ckd',
        'scr',
        'tính mức lọc cầu thận eGFR CKD-EPI 2021 và phân tầng giai đoạn bệnh thận mạn',
        ['kdigo.ckd.2024.table_2_gfr_categories']
      ),
    citationIds: ['kdigo.ckd.2024.table_2_gfr_categories'],
  },
  {
    id: 'ckd.outpatient.missing_k_check',
    module: 'ckd',
    nameVi: 'Cân nhắc định lượng Kali máu nếu chưa có dữ liệu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => need(ctx, 'k') === undefined,
    produce: () =>
      missingInputRec(
        'ckd',
        'k',
        'đánh giá an toàn điện giải và chỉ định thuốc bảo vệ tim-thận (RASi, nsMRA finerenone)',
        ['kdigo.ckd.2024.pp_3_6_2_rasi_monitoring']
      ),
    citationIds: ['kdigo.ckd.2024.pp_3_6_2_rasi_monitoring'],
  },
  {
    id: 'ckd.outpatient.missing_uacr_check',
    module: 'ckd',
    nameVi: 'Cân nhắc xét nghiệm UACR nếu chưa có dữ liệu',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => !hasCkdFlag(ctx, 'onDialysis') && need(ctx, 'uacr') === undefined,
    produce: () =>
      missingInputRec(
        'ckd',
        'uacr',
        'phân tầng nguy cơ tiến triển CKD (bản đồ nhiệt KDIGO) và chỉ định SGLT2i/RASi/Finerenone/GLP-1 RA',
        ['kdigo.ckd.2024.table_3_albuminuria_categories']
      ),
    citationIds: ['kdigo.ckd.2024.table_3_albuminuria_categories'],
  },
  {
    id: 'ckd.outpatient.missing_sbp_check',
    module: 'ckd',
    nameVi: 'Cân nhắc đo Huyết áp tâm thu nếu chưa có dữ liệu',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => need(ctx, 'sbp') === undefined,
    produce: () =>
      missingInputRec(
        'ckd',
        'sbp',
        'xác nhận an toàn huyết động trước khi khởi trị/chuẩn độ SGLT2i, RASi, Finerenone và đánh giá mục tiêu huyết áp CKD',
        ['kdigo.ckd.2024.rec_3_4_1_bp_target_120', 'kdigo.2021.bp.sbp_low_100']
      ),
    citationIds: ['kdigo.ckd.2024.rec_3_4_1_bp_target_120'],
  },
  {
    id: 'ckd.outpatient.missing_age_check',
    module: 'ckd',
    nameVi: 'Cân nhắc nhập Tuổi bệnh nhân nếu chưa có dữ liệu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      need(ctx, 'age') === undefined &&
      need(ctx, 'egfr') === undefined &&
      !hasCkdFlag(ctx, 'onDialysis'),
    produce: () =>
      missingInputRec(
        'ckd',
        'age',
        'tính mức lọc cầu thận eGFR (CKD-EPI 2021), nguy cơ suy thận KFRE 5 năm và chỉ định Statin theo tuổi',
        ['kdigo.ckd.2024.table_2_gfr_categories']
      ),
    citationIds: ['kdigo.ckd.2024.table_2_gfr_categories'],
  },
  {
    id: 'ckd.outpatient.missing_sex_check',
    module: 'ckd',
    nameVi: 'Cân nhắc chọn Giới tính bệnh nhân nếu chưa có dữ liệu',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      ctx.normalized.sex === undefined &&
      need(ctx, 'egfr') === undefined &&
      !hasCkdFlag(ctx, 'onDialysis'),
    produce: () =>
      missingInputRec(
        'ckd',
        'sex',
        'tính chính xác mức lọc cầu thận eGFR (CKD-EPI 2021), độ thanh thải CrCl (Cockcroft-Gault) và KFRE 5 năm',
        ['kdigo.ckd.2024.table_2_gfr_categories']
      ),
    citationIds: ['kdigo.ckd.2024.table_2_gfr_categories'],
  },
];
