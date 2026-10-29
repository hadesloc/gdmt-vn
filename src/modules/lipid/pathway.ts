/**
 * GDMT-VN Lipid Module - Interactive Clinical Pathway
 * Phân quyền: Agent I3
 */

import type { PathwayDefinition } from '../../engine/types';
import { thFor } from '../../kb-types';

function buildLipidPathway(): PathwayDefinition {
  const vhLdl = thFor('ldl', 'lipid.target.very_high_ldl');
  const recLdl = thFor('ldl', 'lipid.target.recurrent_acs_ldl');
  const highLdl = thFor('ldl', 'lipid.target.high_ldl');
  const modLdl = thFor('ldl', 'lipid.target.moderate_ldl');
  const lowLdl = thFor('ldl', 'lipid.target.low_ldl');
  const minPct = thFor('ldl_reduction_pct', 'lipid.target.percent_reduction_min');
  const lpaThresh = thFor('lpa', 'lipid.lpa.risk_enhancing_threshold');
  const lpaNmolThresh = thFor('lpanmol', 'lipid.lpa.risk_enhancing_nmol');
  const hivMinAge = thFor('age', 'lipid.hiv.primary_min_age');

  const atorvaMin = thFor('dose_mg', 'lipid.dose.atorva_high_start');
  const atorvaMax = thFor('dose_mg', 'lipid.dose.atorva_high_max');
  const rosuvaMin = thFor('dose_mg', 'lipid.dose.rosuva_high_start');
  const rosuvaMax = thFor('dose_mg', 'lipid.dose.rosuva_high_max');
  const rosuvaCkdCap = thFor('dose_mg', 'lipid.dose.rosuva_severe_ckd_max');
  const rosuvaTicagCap = thFor('dose_mg', 'lipid.dose.rosuva_ticagrelor_max');
  const egfrSevere = thFor('egfr', 'lipid.safety.egfr_severe_ckd');
  const egfrCkd = thFor('egfr', 'lipid.safety.egfr_ckd_cutoff');

  const ezeDose = thFor('dose_mg', 'lipid.dose.ezetimibe_standard');
  const comboLdlCutoff = thFor('ldl', 'lipid.combo.upfront_ldl_threshold');
  const comboPct = thFor('ldl_reduction_pct', 'lipid.reduction.statin_high_ezetimibe');

  const evoBiweekly = thFor('dose_mg', 'lipid.dose.evolocumab_biweekly');
  const bempDose = thFor('dose_mg', 'lipid.dose.bempedoic_standard');
  const triplePct = thFor('ldl_reduction_pct', 'lipid.reduction.pcsk9_high_statin_ezetimibe');

  const tgRes = thFor('tg', 'lipid.tg.residual_risk_min');
  const tgPanc = thFor('tg', 'lipid.tg.pancreatitis_risk');
  const icosapentDaily = thFor('dose_g', 'lipid.dose.icosapent_daily');
  const fenoStart = thFor('dose_mg', 'lipid.dose.fenofibrate_start_145');
  const fenoMax = thFor('dose_mg', 'lipid.dose.fenofibrate_standard');
  const fenoReduced = thFor('dose_mg', 'lipid.dose.fenofibrate_reduced');

  const minW = thFor('interval_weeks', 'lipid.monitoring.weeks_min');
  const maxW = thFor('interval_weeks', 'lipid.monitoring.weeks_max');
  const acsMinW = thFor('interval_weeks', 'lipid.monitoring.weeks_min');
  const acsMaxW = thFor('interval_weeks', 'lipid.monitoring.acs_recheck_max_weeks');
  const altUln = thFor('altulntimes', 'lipid.safety.alt_uln_elevation');
  const ckMod = thFor('ckulntimes', 'lipid.safety.ck_uln_elevation');
  const ckRhabdo = thFor('ckulntimes', 'lipid.safety.ck_uln_rhabdomyolysis');

  return {
    title: 'Lộ trình Hạ Lipid Máu Theo Đích Cá thể hóa (ESC/EAS 2019–2025 & ACC/AHA 2026)',
    steps: [
      {
        id: 'step_1_risk_stratification',
        stepNumber: 1, // qa-allow: ui-step - So thu tu buoc lo trinh UI
        title: 'Bước 1: Phân tầng nguy cơ tổng thể & Xác định mục tiêu kép LDL-C / Non-HDL-C / ApoB',
        description:
          `Đánh giá ASCVD (kể cả đa giường mạch), ĐTĐ, CKD, FH (DLCN), HA độ 3, HIV ≥ ${hivMinAge} tuổi hoặc SCORE2 (chỉ khi chưa dùng thuốc) để xác định đích LDL-C: ` +
          `Cực cao/Đa giường mạch/Tái phát < ${recLdl.toFixed(1)} mmol/L (Class IIb) | Rất cao < ${vhLdl.toFixed(1)} mmol/L (& giảm ≥ ${minPct}%) | ` +
          `Cao < ${highLdl.toFixed(1)} mmol/L (& giảm ≥ ${minPct}%) | Trung bình < ${modLdl.toFixed(1)} mmol/L | Thấp < ${lowLdl.toFixed(1)} mmol/L. ` +
          `Xét nghiệm Lp(a) ít nhất 1 lần trong đời (> ${lpaThresh} mg/dL hoặc > ${lpaNmolThresh} nmol/L làm tăng mạnh nguy cơ).`,
        status: 'completed',
        citationIds: [
          'esc.lipid.2019.target_very_high',
          'esc.lipid.2019.target_recurrent_acs',
          'esc.lipid.2025.extreme_risk_polyvascular',
          'esc.lipid.2019.target_high',
          'esc.lipid.2025.lpa_measurement_lifetime',
          'esc.lipid.2025.lpa_threshold_50mg'
        ]
      },
      {
        id: 'step_2_statin_foundation',
        stepNumber: 2, // qa-allow: ui-step - So thu tu buoc lo trinh UI
        title: 'Bước 2: Statin cường độ tối đa dung nạp (hoặc phối hợp sớm ngay từ đầu)',
        description:
          `Khởi trị Atorvastatin ${atorvaMin}–${atorvaMax} mg/ngày hoặc Rosuvastatin ${rosuvaMin}–${rosuvaMax} mg/ngày ở nhóm nguy cơ cao / rất cao (hoặc khẩn cấp trong ACS). ` +
          `Lưu ý: eGFR < ${egfrSevere} mL/phút/1.73m² ưu tiên Atorvastatin (giới hạn Rosuvastatin ≤ ${rosuvaCkdCap} mg/ngày); dùng Ticagrelor/Febuxostat giới hạn Rosuvastatin ≤ ${rosuvaTicagCap} mg/ngày. ` +
          `Nếu ACS nội viện hoặc LDL-C nền quá xa đích (≥ ${comboLdlCutoff.toFixed(1)} mmol/L ở nguy cơ rất cao), cân nhắc phối hợp sớm Ezetimibe ${ezeDose} mg/ngày ngay từ đầu.`,
        status: 'active',
        citationIds: [
          'esc.lipid.2019.statin_high_dose_rec',
          'esc.lipid.2025.acs_naive_combination',
          'fda.rosuvastatin.renal_impairment',
          'fda.rosuvastatin.ticagrelor_limit_20mg'
        ]
      },
      {
        id: 'step_3_add_ezetimibe',
        stepNumber: 3, // qa-allow: ui-step - So thu tu buoc lo trinh UI
        title: `Bước 3: Đánh giá lại sau ${minW}–${maxW} tuần & Phối hợp Ezetimibe`,
        description:
          `Kiểm tra bộ mỡ máu sau ${minW}–${maxW} tuần (${acsMinW}–${acsMaxW} tuần sau ACS). Nếu chưa đạt mục tiêu kép LDL-C (hoặc mục tiêu thứ phát Non-HDL-C / ApoB) trên liều statin tối đa an toàn, ` +
          `bổ sung Ezetimibe ${ezeDose} mg/ngày (tổng mức giảm trung bình ~${comboPct}% LDL-C). ` +
          `Nếu không dung nạp hoàn toàn với statin: phối hợp Ezetimibe ${ezeDose} mg/ngày + Bempedoic acid ${bempDose} mg/ngày (tránh nếu gút / đứt gân).`,
        status: 'upcoming',
        citationIds: [
          'esc.lipid.2019.ezetimibe_add_on',
          'esc.lipid.2025.bempedoic_statin_intolerance',
          'esc.lipid.2019.monitoring_retest_weeks',
          'esc.lipid.2019.recheck_4_to_6_weeks'
        ]
      },
      {
        id: 'step_4_pcsk9_intensification',
        stepNumber: 4, // qa-allow: ui-step - So thu tu buoc lo trinh UI
        title: 'Bước 4: Bổ sung thuốc ức chế PCSK9 & Hội chẩn kháng trị',
        description:
          `Ở bệnh nhân nguy cơ rất cao hoặc FH chưa đạt mục tiêu dù đã dùng Statin tối đa dung nạp + Ezetimibe (hoặc không dung nạp statin đã thất bại thuốc uống), ` +
          `bổ sung kháng thể đơn dòng kháng PCSK9 (Evolocumab ${evoBiweekly} mg mỗi 2 tuần hoặc Alirocumab; hoặc siRNA Inclisiran) giúp hạ ~${triplePct}% LDL-C.`,
        status: 'upcoming',
        citationIds: [
          'esc.lipid.2019.pcsk9_add_on_secondary',
          'esc.lipid.2019.pcsk9_fh_very_high',
          'fda.evolocumab.dose'
        ]
      },
      {
        id: 'step_5_tg_and_safety',
        stepNumber: 5, // qa-allow: ui-step - So thu tu buoc lo trinh UI
        title: 'Bước 5: Kiểm soát Triglyceride tồn dư / Viêm tụy cấp & Giám sát an toàn cơ – gan',
        description:
          `• Nguy cơ tồn dư (TG ${tgRes.toFixed(1)}–<${tgPanc.toFixed(1)} mmol/L trên nền Statin ở nhóm nguy cơ cao/rất cao): cân nhắc Icosapent ethyl ${icosapentDaily} g/ngày (ESC IIa-B / ACC COR 2b; lưu ý rung nhĩ & chảy máu). ` +
          `• Nguy cơ viêm tụy cấp (TG ≥ ${tgPanc.toFixed(1)} mmol/L): kiêng rượu tuyệt đối, chế độ ăn rất ít chất béo và khởi trị Fenofibrate ${fenoStart}–${fenoMax} mg/ngày (giảm từ ${fenoReduced} mg/ngày nếu eGFR ${egfrSevere}–<${egfrCkd}; chống chỉ định khi eGFR < ${egfrSevere}; tuyệt đối không phối hợp Gemfibrozil với Statin; theo dõi INR nếu dùng Warfarin). ` +
          `• An toàn: Tạm ngưng thuốc hạ lipid độc gan nếu ALT ≥ ${altUln}x ULN; ngưng Statin/Fibrate nếu CK > ${ckMod}x ULN (cấp cứu tiêu cơ vân nếu CK ≥ ${ckRhabdo}x ULN).`,
        status: 'upcoming',
        citationIds: [
          'esc.lipid.2019.htg_icosapent_ethyl',
          'acc.lipid.2026.icosapent_cor2b',
          'acc.lipid.2026.htg_fibrate_omega3_pancreatitis',
          'acc.lipid.2026.fenofibrate_renal',
          'acc.lipid.2026.gemfibrozil_statin_contra',
          'esc.lipid.2019.monitoring_alt_elevation',
          'esc.lipid.2019.monitoring_ck_10x_stop'
        ]
      }
    ]
  };
}

export const lipidPathway: PathwayDefinition = buildLipidPathway();
