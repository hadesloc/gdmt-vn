import type { Recommendation, Rule } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import { hasHighGradeConductionDiseaseWithoutPacemaker } from '../../engine/safety/contraCodeMatcher';
import { asDose, asthmaGate, asthmaRule, evaluateAcuteAsthma, hasConcurrentPreeclampsiaMgso4,
  hasCustomCond, hasMyastheniaOrHeartBlock, isAdultOrAdolescent, isAllergicToDrug,
  resolveAcuteMedAction } from './helpers';

const efficacy = ['gina.asthma.2026.acute_magnesium_fev1_30', 'byt.asthma.2020.magnesium_dose_2g'];
const safety = ['who.mgso4.contra_brady_conduction_renal', 'who.mgso4.renal_caution_monitoring',
  'who.mgso4.monitoring_reflex_resp_urine', 'aha.2025.bradycardia_hr_50'];
const base = { id: 'rec_asthma_acute_severe_mgso4', module: 'asthma' as const,
  tier: 'Cấp cứu Cơn hen cấp', tierOrder: 1, priority: 94, drugId: 'magnesium_sulfate', // qa-allow: index - tầng và ưu tiên hồi sức
  gates: [], citationIds: [...efficacy, ...safety] };

export const asthmaMagnesiumRules: Rule[] = [asthmaRule({
  id: 'asthma.acute.severe_magnesium_sulfate', setting: 'inpatient',
  nameVi: 'MgSO4 bổ trợ có chỉ định và kiểm tra huyết động, dẫn truyền, thận',
  citationIds: [...efficacy, ...safety],
  when: (ctx) => {
    if (!isAdultOrAdolescent(ctx)) return false;
    const acute = evaluateAcuteAsthma(ctx);
    return acute.hasAcuteAttack && (acute.isLifeThreatening || acute.isSevere);
  },
  produce: (ctx): Recommendation => {
    const sbp = need(ctx, 'sbp'), hr = need(ctx, 'hr'), egfr = need(ctx, 'egfr');
    const sbpMin = thFor('sbp', 'asthma.acute.magnesium_sbp_caution_min');
    const hrMin = thFor('hr', 'asthma.acute.magnesium_brady_hr_min');
    const renalReviewMin = thFor('egfr', 'asthma.acute.magnesium_renal_review_egfr_min');
    const reasons: string[] = [];
    if (isAllergicToDrug(ctx, 'magnesium_sulfate')) reasons.push('tiền sử dị ứng MgSO4');
    if (sbp !== undefined && sbp < sbpMin) reasons.push(`tụt huyết áp (SBP ${sbp} < ${sbpMin} mmHg)`);
    if (hr !== undefined && hr < hrMin) reasons.push(`nhịp chậm rõ (HR ${hr} < ${hrMin} lần/phút)`);
    if (hasCustomCond(ctx, 'dehydration') || hasCustomCond(ctx, 'hypovolemia')) reasons.push('mất nước/giảm thể tích tuần hoàn');
    if (hasMyastheniaOrHeartBlock(ctx) || hasCustomCond(ctx, 'myasthenia_gravis') ||
        hasHighGradeConductionDiseaseWithoutPacemaker(ctx.patient).matched) {
      reasons.push('nhược cơ hoặc rối loạn dẫn truyền tim');
    }
    if (reasons.length) return { ...base, action: 'AVOID', dose: undefined,
      title: `TRÁNH MgSO4 bổ trợ cho hen: ${reasons.join(' · ')}`,
      rationale: 'Ưu tiên hồi sức, thuốc giãn phế quản hít và corticosteroid; hội chẩn Hồi sức/Sản khoa khi cần. Không truyền MgSO4 bổ trợ cho hen khi có chống chỉ định hoặc huyết động chưa ổn định. Lệnh này không thay thế đánh giá phác đồ sản khoa đang có.',
      gates: [asthmaGate('magnesiumSafety', false, reasons.join('; '))] };

    // Do not turn the obstetric loading order into AVOID merely to suppress an extra asthma bolus.
    if (hasConcurrentPreeclampsiaMgso4(ctx)) return { ...base, id: 'rec_asthma_mg_obstetric_no_extra',
      drugId: undefined, action: 'MONITOR', dose: undefined,
      title: 'Không truyền thêm liều MgSO4 bổ trợ hen lên phác đồ sản khoa',
      rationale: 'Phác đồ MgSO4 sản khoa do Sản khoa/Hồi sức quyết định và theo dõi riêng. Xác nhận tổng liều đã/đang truyền, chức năng thận và dấu hiệu độc tính; không cộng thêm liều đơn điều trị hen.' };

    const missing = [sbp === undefined ? 'huyết áp' : '', hr === undefined ? 'nhịp tim' : '',
      egfr === undefined ? 'chức năng thận' : ''].filter(Boolean);
    const renalFlags = ['aki', 'onDialysis'].some((key) => hasCondition(ctx, key)) ||
      ['aki', 'acuteKidneyInjury', 'dialysis', 'oliguria', 'anuria', 'ckd'].some((key) => hasCustomCond(ctx, key));
    if (missing.length || renalFlags || (egfr !== undefined && egfr < renalReviewMin)) return {
      ...base, action: 'DEFER', dose: undefined,
      title: 'Cần bác sĩ Hồi sức xác nhận liều MgSO4 bổ trợ — không tự suy ra liều giảm',
      rationale: missing.length ? `Chưa đủ ${missing.join(', ')} để tự kê MgSO4 bổ trợ. Đo và đánh giá ngay; không trì hoãn các thuốc hồi sức đầu tay.`
        : 'Chức năng thận giảm, tổn thương thận cấp, thiểu/vô niệu hoặc lọc máu làm tăng nguy cơ tích lũy Mg²⁺. Cần bác sĩ Hồi sức xác nhận lợi ích/nguy cơ và liều cá thể hóa; không tự tính liều giảm. Theo dõi nước tiểu, Mg²⁺ máu, phản xạ gân xương, ECG và hô hấp.',
      gates: [asthmaGate('magnesiumRenalReview', false, missing.length ? `Thiếu ${missing.join(', ')}` : 'Cần xác nhận liều theo thận')],
      citationIds: [...base.citationIds, 'kdigo.ckd.2024.table_2_gfr_categories'] };

    if (ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'magnesium_sulfate')) return {
      ...base, action: 'DEFER', dose: undefined, title: 'Đã ghi nhận dùng MgSO4: xác nhận liều đã truyền trước khi chỉ định thêm',
      rationale: 'Phác đồ bổ trợ hen dùng một liều đơn; không tự tăng liều hoặc truyền chồng khi chưa rõ tổng liều, thời điểm đã dùng và Mg²⁺ máu.' };
    const acute = evaluateAcuteAsthma(ctx);
    const fev1 = need(ctx, 'fev1Pct');
    const fev1Min = thFor('fev1_pct', 'asthma.acute.magnesium_fev1_pct_cutoff');
    const hasIndication = (ctx.patient.customInputs?.acuteResponseAfter1h === 'poor_response' &&
      acute.spo2 !== undefined && acute.spo2 < acute.oxygenTargetMin) ||
      (fev1 !== undefined && fev1 < fev1Min);
    if (!hasIndication) return { ...base, action: 'CONSIDER', dose: undefined,
      title: 'Đánh giá chỉ định MgSO4 sau điều trị ban đầu, không dùng thường quy',
      rationale: 'Cơn hen nặng/nguy kịch cần hồi sức ngay; mức độ nặng đơn thuần không đủ để tự kê MgSO4. Xác nhận không đáp ứng điều trị ban đầu kèm giảm oxy kéo dài hoặc chức năng phổi rất thấp theo GINA trước khi dùng.' };
    const amount = thFor('dose_g', 'asthma.acute.magnesium_dose_g');
    const minutes = thFor('duration_min', 'asthma.acute.magnesium_infusion_minutes');
    return { ...base, action: resolveAcuteMedAction(ctx, 'magnesium_sulfate'),
      title: 'MgSO4 bổ trợ cơn hen có chỉ định — liều đơn, theo dõi tại Hồi sức',
      dose: asDose(`Truyền tĩnh mạch chậm ${amount} g trong ${minutes} phút (liều duy nhất, không tự truyền lặp)`),
      rationale: `Theo GINA/BYT, liều đơn ${amount} g trong ${minutes} phút có thể giúp người bệnh không đáp ứng điều trị ban đầu hoặc FEV₁ rất thấp. Theo dõi tim mạch, hô hấp, phản xạ gân xương, nước tiểu và Mg²⁺; chuẩn bị calcium gluconate xử trí độc tính.` };
  }
})];
