import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor, thr } from '../../kb-types';
import {
  COPD_PROFILES,
  getFev1FvcRatio,
  getFev1PredPct,
  getModExac,
  getHospExac,
  getAbgPh,
  getAbgPaco2,
  getRestingSpo2,
  getRespiratoryRate,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  hasConfirmedStableCopd,
  hasConcurrentAsthma,
  resolveEffectiveInhaler,
  isGroupEConfirmed,
  copdMissingRec,
} from './helpers';

export const copdDiagnosisRules: Rule[] = [
  // =========================================================================
  // 0. HÀNG RÀO PHÂN LOẠI CẤP CỨU NGOẠI TRÚ (OUTPATIENT ACUTE RESPIRATORY FAILURE)
  // =========================================================================
  {
    id: 'copd.outpatient.acute_respiratory_failure_refer',
    module: 'copd',
    nameVi: 'Cấp cứu tối khẩn ngoại trú: Suy hô hấp cấp / Toan hô hấp mất bù / Rối loạn tri giác – Chuyển Cấp cứu / ICU ngay',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.hospital_admission_criteria',
      'gold.copd.2026.exac_hospitalization_assessment',
      'byt.copd.2026.niv_indications',
      'byt.copd.2026.oxygen_target_88_92',
    ],
    when: (ctx) => hasOutpatientAcuteRespiratoryFailure(ctx),
    produce: (ctx) => {
      const spo2 = getRestingSpo2(ctx);
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      const rr = getRespiratoryRate(ctx);
      const o2Min = thFor('restingSpo2', 'copd.oxygen_target_spo2_min');
      const o2Max = thFor('restingSpo2', 'copd.oxygen_target_spo2_max');
      const signs: string[] = [];
      if (Boolean(ctx.normalized.customInputs?.respiratoryArrest)) signs.push('ngừng thở / đe dọa ngừng thở');
      if (Boolean(ctx.normalized.customInputs?.alteredMentalStatus)) signs.push('rối loạn tri giác');
      if (Boolean(ctx.normalized.customInputs?.accessoryMuscleUse)) signs.push('co kéo cơ hô hấp phụ');
      if (ph !== undefined && ph <= thFor('abgPh', 'copd.niv_ph_cutoff')) signs.push(`toan máu cấp pH ${ph}`);
      if (paco2 !== undefined && paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff')) signs.push(`PaCO₂ ${paco2} mmHg`);
      if (spo2 !== undefined && spo2 < thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff')) signs.push(`SpO₂ ${spo2}%`);
      if (rr !== undefined && rr > thFor('respiratoryRate', 'copd.exac_rr_non_rf_max')) signs.push(`nhịp thở ${rr} lần/phút`);

      return {
        id: 'rec_copd_outpatient_emergency_refer',
        module: 'copd',
        tier: 'CẤP CỨU TỐI KHẨN (CHUYỂN VIỆN NGAY)',
        tierOrder: 0,
        action: 'REFER',
        title: `CHUYỂN NGAY KHOA CẤP CỨU / HỒI SỨC TÍCH CỰC (ICU): Suy hô hấp cấp trên bệnh nhân ngoại trú (${signs.join(', ')})`,
        rationale: `Người bệnh đang ở bối cảnh khám ngoại trú nhưng có dấu hiệu suy hô hấp cấp đe dọa tính mạng (${signs.join(', ')}). Theo GOLD 2026 và BYT QĐ 2131/2026 (Tiêu chuẩn nhập viện cấp cứu), TUYỆT ĐỐI KHÔNG kê đơn ngoại trú cho về hoặc khởi trị LTOT/NIV tại nhà trong giai đoạn mất bù cấp; phải chuyển ngay vào Khoa Cấp cứu / ICU bằng xe cứu thương có kiểm soát oxy (mặt nạ Venturi giữ đích SpO₂ ${o2Min}–${o2Max}%), khí dung SABA bằng khí nén và chuẩn bị hỗ trợ thông khí nhân tạo (NIV / đặt nội khí quản IMV nếu rối loạn ý thức hoặc ngừng thở).`,
        gates: [],
        citationIds: [
          'byt.copd.2026.hospital_admission_criteria',
          'gold.copd.2026.exac_hospitalization_assessment',
          'byt.copd.2026.niv_indications',
          'byt.copd.2026.oxygen_target_88_92',
        ],
        priority: 108,
      };
    },
  },

  // =========================================================================
  // 1. CHẨN ĐOÁN XÁC ĐỊNH & FAIL-CLOSED HÔ HẤP KÝ (QA-1 & QA-9)
  // =========================================================================
  {
    id: 'copd.diagnosis.spirometry_required',
    module: 'copd',
    nameVi: 'Yêu cầu đo chức năng hô hấp sau giãn phế quản để xác nhận chẩn đoán COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.fev1_fvc_0_7', 'byt.copd.2026.gold_classification'],
    when: (ctx) => {
      if (isAcuteExacerbation(ctx)) return false;
      const fev1Fvc = getFev1FvcRatio(ctx);
      const fev1Pct = getFev1PredPct(ctx);
      return fev1Fvc === undefined || fev1Pct === undefined;
    },
    produce: (ctx) => {
      const fev1Fvc = getFev1FvcRatio(ctx);
      if (fev1Fvc === undefined) {
        return copdMissingRec(
          'fev1FvcRatio',
          'Tỷ số FEV₁/FVC và FEV₁ (% trị số dự đoán) sau test giãn phế quản',
          `xác nhận giới hạn luồng khí thở không hồi phục hoàn toàn (FEV₁/FVC < ${thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic')}) và phân mức độ tắc nghẽn GOLD 1–4 trước khi chỉ định phác đồ duy trì`,
          thr('copd.fev1_fvc_diagnostic').citationIds
        );
      }
      return copdMissingRec(
        'fev1PredPct',
        'FEV₁ (% trị số dự đoán) sau test giãn phế quản',
        `phân mức độ tắc nghẽn luồng khí GOLD 1–4 và xác định chỉ định thuốc chuyên biệt trước khi kê phác đồ duy trì`,
        thr('copd.fev1_fvc_diagnostic').citationIds
      );
    },
  },

  {
    id: 'copd.diagnosis.normal_spirometry_warning',
    module: 'copd',
    nameVi: 'Cảnh báo FEV₁/FVC ≥ 0.70 chưa đủ tiêu chuẩn chẩn đoán COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.fev1_fvc_0_7', 'byt.copd.2026.diag_criteria'],
    when: (ctx) => {
      if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
      const fev1Fvc = getFev1FvcRatio(ctx);
      if (fev1Fvc === undefined) return false;
      return fev1Fvc >= thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic');
    },
    produce: (ctx) => {
      const fev1Fvc = getFev1FvcRatio(ctx)!;
      const cutoff = thFor('fev1FvcRatio', 'copd.fev1_fvc_diagnostic');
      return {
        id: 'rec_copd_diag_normal_ratio',
        module: 'copd',
        tier: 'Chẩn đoán & Phân tầng',
        tierOrder: 1,
        action: 'CONSIDER',
        title: `Chưa đủ tiêu chuẩn hô hấp ký chẩn đoán COPD (FEV₁/FVC = ${fev1Fvc} ≥ ${cutoff}) – Rà soát chẩn đoán phân biệt`,
        rationale: `Tỷ số FEV₁/FVC sau giãn phế quản hiện là ${fev1Fvc} (không nhỏ hơn ngưỡng ${cutoff} theo GOLD 2026 & BYT 2131/2026). Không khởi trị hoặc leo thang thuốc duy trì COPD; cần loại trừ các chẩn đoán phân biệt (hen phế quản, giãn phế quản, suy tim, lao phổi, PRISm/tiền COPD) và lặp lại hô hấp ký nếu nằm vùng ranh giới 0.60–0.80.`,
        gates: [],
        citationIds: ['gold.copd.2026.fev1_fvc_0_7', 'byt.copd.2026.diag_criteria'],
        priority: 95,
      };
    },
  },

  {
    id: 'copd.diagnosis.gold_grade_staging',
    module: 'copd',
    nameVi: 'Phân loại mức độ tắc nghẽn luồng khí thở GOLD 1–4',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.gold_classification'],
    when: (ctx) => hasConfirmedStableCopd(ctx),
    produce: (ctx) => {
      const fev1Pct = getFev1PredPct(ctx)!;
      const g1 = thFor('fev1PredPct', 'copd.gold1_fev1_min');
      const g2 = thFor('fev1PredPct', 'copd.gold2_fev1_min');
      const g3 = thFor('fev1PredPct', 'copd.gold3_fev1_min');

      let gradeLabel = 'GOLD 4 – Tắc nghẽn rất nặng';
      let rangeDesc = `< ${g3}%`;
      if (fev1Pct >= g1) {
        gradeLabel = 'GOLD 1 – Tắc nghẽn nhẹ';
        rangeDesc = `≥ ${g1}%`;
      } else if (fev1Pct >= g2) {
        gradeLabel = 'GOLD 2 – Tắc nghẽn trung bình';
        rangeDesc = `${g2}–79%`;
      } else if (fev1Pct >= g3) {
        gradeLabel = 'GOLD 3 – Tắc nghẽn nặng';
        rangeDesc = `${g3}–49%`;
      }

      return {
        id: 'rec_copd_gold_grade',
        module: 'copd',
        tier: 'Chẩn đoán & Phân tầng',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Phân độ tắc nghẽn luồng khí: ${gradeLabel} (FEV₁ = ${fev1Pct}% dự đoán, ngưỡng ${rangeDesc})`,
        rationale:
          'Mức độ giảm FEV₁ phản ánh độ nặng giới hạn luồng khí thở giúp tiên lượng, chỉ định phục hồi chức năng hô hấp, xét Roflumilast hoặc can thiệp giảm thể tích phổi; quyết định chọn thuốc hít khởi đầu dựa vào phân nhóm triệu chứng và đợt cấp (A / B / E).',
        gates: [],
        citationIds: ['byt.copd.2026.gold_classification'],
        priority: 35,
      };
    },
  },

  {
    id: 'copd.diagnosis.symptoms_required',
    module: 'copd',
    nameVi: 'Yêu cầu bổ sung thang điểm khó thở mMRC và CAT để phân nhóm A / B',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['byt.copd.2026.mmrc_cat_cutoff', 'byt.copd.2026.abe_groups'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff !== 'none') return false;
      if (isGroupEConfirmed(ctx)) return false;
      const mmrc = need(ctx, 'mmrc');
      const cat = need(ctx, 'cat');
      const mmrcHigh = mmrc !== undefined && mmrc >= thFor('mmrc', 'copd.mmrc_high');
      const catHigh = cat !== undefined && cat >= thFor('cat', 'copd.cat_high');
      if (mmrcHigh || catHigh) return false;
      return mmrc === undefined || cat === undefined;
    },
    produce: (ctx) => {
      const mmrc = need(ctx, 'mmrc');
      const missingName =
        mmrc === undefined && need(ctx, 'cat') === undefined
          ? 'Thang điểm khó thở mMRC và Điểm đánh giá triệu chứng CAT'
          : mmrc === undefined
            ? 'Thang điểm khó thở mMRC'
            : 'Điểm đánh giá triệu chứng CAT';
      return copdMissingRec(
        'symptoms_abe',
        missingName,
        `phân biệt chính xác Nhóm A (cả mMRC < ${thFor('mmrc', 'copd.mmrc_high')} VÀ CAT < ${thFor('cat', 'copd.cat_high')}) với Nhóm B (mMRC ≥ ${thFor('mmrc', 'copd.mmrc_high')} hoặc CAT ≥ ${thFor('cat', 'copd.cat_high')})`,
        ['byt.copd.2026.mmrc_cat_cutoff', 'byt.copd.2026.abe_groups']
      );
    },
  },

  {
    id: 'copd.diagnosis.exacerbation_history_required',
    module: 'copd',
    nameVi: 'Yêu cầu bổ sung tiền sử đợt cấp 12 tháng qua để phân nhóm nguy cơ E',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.group_e_definition', 'byt.copd.2026.abe_groups'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (isGroupEConfirmed(ctx)) return false;
      const modExac = getModExac(ctx);
      const hosp = getHospExac(ctx);
      return modExac === undefined || hosp === undefined;
    },
    produce: () =>
      copdMissingRec(
        'exacerbation_history',
        'Số đợt cấp trung bình và số đợt cấp nhập viện trong 12 tháng qua',
        `xác định phân nhóm nguy cơ cao Nhóm E (chỉ cần ≥ ${thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')} đợt cấp trung bình hoặc ≥ ${thFor('hospitalizations', 'copd.exacerbation_high_risk')} đợt nhập viện theo GOLD 2026 & BYT 2131/2026)`,
        ['gold.copd.2026.group_e_definition', 'byt.copd.2026.abe_groups']
      ),
  },
];
