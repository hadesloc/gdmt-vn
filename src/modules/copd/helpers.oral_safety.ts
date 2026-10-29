import type { RuleContext } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor, hasDrug, drug } from '../../kb-types';
import {
  QT_PROLONGING_DRUG_IDS,
  STRONG_CYP3A4_INDUCER_IDS,
  ROFLUMILAST_CONTRA_CYP_INHIBITOR_IDS,
  ROFLUMILAST_CAUTION_CYP_INHIBITOR_IDS,
  VKA_DRUG_IDS,
} from './helpers.constants';
import {
  hasCurrentMed,
  hasAnyCurrentMed,
  findAllCurrentMedsInSet,
  getSmokingStatus,
  getQtcMs,
  hasProlongedQtc,
  hasBreastfeeding,
} from './helpers.clinical';

export function hasChildPughAMildHepatic(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  const cp = String(ci.childPugh ?? '').toUpperCase();
  if (cp !== 'A') return false;
  if (hasCondition(ctx, 'decompensatedCirrhosis') || Boolean(ci.moderateSevereHepaticImpairment)) {
    return false;
  }
  return true;
}

export interface OralContraInfo {
  reasons: string[];
  citationIds: string[];
}

export interface OralCautionInfo {
  warnings: string[];
  citationIds: string[];
}

export function getRoflumilastContraInfo(ctx: RuleContext): OralContraInfo {
  const reasons: string[] = [];
  const citationSet = new Set<string>(['gold.copd.2026.followup_roflumilast']);
  const ci = ctx.normalized.customInputs || {};
  const cond = ctx.patient.conditions || {};
  const childPugh = String(ci.childPugh ?? '').toUpperCase();
  const isExplicitMildChildPughA = hasChildPughAMildHepatic(ctx);

  if (
    !isExplicitMildChildPughA &&
    (Boolean(cond.liverDisease) ||
      hasCondition(ctx, 'liverDisease') ||
      hasCondition(ctx, 'cirrhosis') ||
      hasCondition(ctx, 'decompensatedCirrhosis') ||
      childPugh === 'B' ||
      childPugh === 'C' ||
      Boolean(ci.moderateSevereHepaticImpairment))
  ) {
    reasons.push('Suy gan vừa–nặng (Child-Pugh B/C) hoặc bệnh gan mạn / xơ gan chưa phân loại nhẹ');
    citationSet.add('fda.copd.roflumilast_contra_liver');
  }

  const w = ctx.normalized.weight;
  const h = ctx.normalized.height;
  const exactBmi =
    typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0
      ? w / Math.pow(h / 100, 2) // qa-allow: unit-conversion - tính BMI từ cm sang m
      : undefined;
  const bmi = exactBmi ?? ctx.derived.bmi;
  const bmiCutoff = thFor('bmi', 'copd.roflumilast_underweight_bmi');
  if (
    (bmi !== undefined && bmi < bmiCutoff) ||
    Boolean(ci.unexplainedWeightLoss) ||
    Boolean(ci.underweight)
  ) {
    reasons.push(
      bmi !== undefined && bmi < bmiCutoff
        ? `Nhẹ cân / suy kiệt (BMI ${Number(bmi.toFixed(2))} < ${bmiCutoff} kg/m²)`
        : 'Sụt cân chưa rõ nguyên nhân hoặc suy kiệt'
    );
    citationSet.add('gold.copd.2026.roflumilast_weight_depression');
    citationSet.add('byt.copd.2026.underweight_bmi_18_5');
    citationSet.add('fda.copd.roflumilast_psychiatric_weight');
  }

  if (
    Boolean(cond.depression) ||
    hasCondition(ctx, 'depression') ||
    Boolean(ci.severeDepression) ||
    Boolean(ci.suicidalIdeation)
  ) {
    reasons.push('Trầm cảm nặng hoặc tiền sử ý nghĩ / hành vi tự sát');
    citationSet.add('gold.copd.2026.roflumilast_weight_depression');
    citationSet.add('fda.copd.roflumilast_psychiatric_weight');
  }

  if (Boolean(cond.pregnant) || hasCondition(ctx, 'pregnant')) {
    reasons.push('Phụ nữ đang mang thai');
    citationSet.add('fda.copd.roflumilast_pregnancy');
  }

  if (hasBreastfeeding(ctx)) {
    reasons.push('Phụ nữ đang cho con bú (Roflumilast bài tiết qua sữa, không khuyến cáo dùng)');
    citationSet.add('fda.copd.roflumilast_lactation');
  }

  if (hasCurrentMed(ctx, 'theophylline') || hasCurrentMed(ctx, 'aminophylline')) {
    reasons.push(
      'Đang dùng Theophylline / Aminophylline (làm tăng phơi nhiễm Roflumilast và độc tính toàn thân, không dùng đồng thời)'
    );
    citationSet.add('gold.copd.2026.roflumilast_weight_depression');
    citationSet.add('fda.copd.roflumilast_theophylline_prohibited');
  }

  const cypInducer = hasAnyCurrentMed(ctx, STRONG_CYP3A4_INDUCER_IDS);
  if (cypInducer) {
    reasons.push(
      `Đang dùng thuốc cảm ứng mạnh CYP3A4 (${cypInducer}) làm giảm mạnh nồng độ và mất hiệu lực điều trị của Roflumilast`
    );
    citationSet.add('fda.copd.roflumilast_dose');
  }

  const dualCypInhibitor = hasAnyCurrentMed(ctx, ROFLUMILAST_CONTRA_CYP_INHIBITOR_IDS);
  if (dualCypInhibitor) {
    reasons.push(
      `Đang dùng chất ức chế mạnh CYP1A2/CYP3A4 (${dualCypInhibitor}) làm tăng vọt phơi nhiễm toàn thân và độc tính tâm thần kinh – tiêu hóa của Roflumilast`
    );
    citationSet.add('fda.copd.roflumilast_cyp_inhibitors');
  }

  return { reasons, citationIds: Array.from(citationSet) };
}

export function getRoflumilastContraReasons(ctx: RuleContext): string[] {
  return getRoflumilastContraInfo(ctx).reasons;
}

export function getRoflumilastCautionInfo(ctx: RuleContext): OralCautionInfo {
  const warnings: string[] = [];
  const citationSet = new Set<string>();
  const cpAAucPct = thFor('auc_increase_pct', 'copd.roflumilast_child_pugh_a_auc_pct');
  if (hasChildPughAMildHepatic(ctx)) {
    warnings.push(
      `Suy gan nhẹ (Child-Pugh A): Không chống chỉ định nhưng phơi nhiễm Roflumilast tăng khoảng ${cpAAucPct}% theo nhãn FDA; cân nhắc kỹ lợi ích – nguy cơ và theo dõi sát sụt cân, tiêu chảy, mất ngủ/trầm cảm.`
    );
    citationSet.add('fda.copd.roflumilast_child_pugh_a_auc51');
  }

  const cypCautionMeds = findAllCurrentMedsInSet(ctx, ROFLUMILAST_CAUTION_CYP_INHIBITOR_IDS);
  if (cypCautionMeds.length > 0) {
    const names = cypCautionMeds.map((m) => m.name || m.drugId).join(', ');
    warnings.push(
      `Tương tác dược động học (${names}): Thuốc ức chế CYP3A4 / CYP1A2 hoặc thuốc tránh thai chứa ethinyl estradiol làm tăng phơi nhiễm Roflumilast toàn thân; cần cân nhắc kỹ lợi ích – nguy cơ và giám sát chặt sụt cân, tiêu chảy, rối loạn giấc ngủ/khí sắc.`
    );
    citationSet.add('fda.copd.roflumilast_cyp_inhibitors');
  }

  return { warnings, citationIds: Array.from(citationSet) };
}

export function getAzithromycinContraInfo(ctx: RuleContext): OralContraInfo {
  const reasons: string[] = [];
  const citationSet = new Set<string>([
    'gold.copd.2026.azithromycin_safety',
    'byt.copd.2026.azithromycin_renal_contra_gfr10',
  ]);
  const ci = ctx.normalized.customInputs || {};
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const smoke = getSmokingStatus(ctx);
  const qtcMax = thFor('qtc', 'copd.qtc_azithromycin_max_ms');

  if (smoke === 'current') {
    reasons.push('Bệnh nhân vẫn đang hút thuốc lá (hiệu quả dự phòng đợt cấp kém trên thử nghiệm lâm sàng)');
    citationSet.add('gold.copd.2026.followup_azithromycin');
  }

  if (hasProlongedQtc(ctx)) {
    const qtcVal = getQtcMs(ctx);
    reasons.push(
      qtcVal !== undefined && qtcVal > qtcMax
        ? `Khoảng QTc kéo dài trên điện tâm đồ (${qtcVal} > ${qtcMax} ms)`
        : `Khoảng QTc kéo dài trên điện tâm đồ (> ${qtcMax} ms)`
    );
  }

  const qtMeds = ctx.normalized.currentMeds.filter((m) => {
    const id = m.drugId?.trim().toLowerCase();
    if (!id || id === 'azithromycin') return false;
    if (QT_PROLONGING_DRUG_IDS.has(id)) return true;
    if (hasDrug(id)) {
      const kbEntry = drug(id);
      return kbEntry.qtRisk === 'known' || kbEntry.qtRisk === 'possible';
    }
    return false;
  });
  if (qtMeds.length > 0) {
    const qtNames = qtMeds.map((m) => m.name || m.drugId).join(', ');
    reasons.push(`Đang dùng kèm thuốc kéo dài khoảng QT (${qtNames}) gây nguy cơ xoắn đỉnh`);
    if (qtMeds.some((m) => m.drugId?.trim().toLowerCase() === 'domperidone')) {
      citationSet.add('byt.copd.2026.macrolide_domperidone_contra');
    }
  }

  const cp = String(ci.childPugh ?? '').toUpperCase();
  if (
    Boolean(
      ci.azithromycinCholestaticJaundice ||
        ci.cholestaticJaundice ||
        cond.cholestaticJaundice ||
        cond.azithromycinCholestaticJaundice
    ) ||
    hasCondition(ctx, 'decompensatedCirrhosis') ||
    cp === 'C'
  ) {
    reasons.push(
      'Tiền sử vàng da ứ mật / rối loạn chức năng gan liên quan Azithromycin hoặc xơ gan mất bù nặng (Child-Pugh C)'
    );
    citationSet.add('fda.copd.azithromycin_contra_cholestatic');
  }

  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const gfrMin = thFor('egfr', 'copd.azithromycin_contra_gfr_min');
  const crclMin = thFor('crcl', 'copd.azithromycin_contra_crcl_min');
  if (
    hasCondition(ctx, 'onDialysis') ||
    Boolean(cond.onDialysis) ||
    Boolean(cond.dialysis) ||
    (egfr !== undefined && egfr < gfrMin) ||
    (crcl !== undefined && crcl < crclMin)
  ) {
    reasons.push(
      `Suy thận rất nặng (GFR < ${gfrMin} mL/phút hoặc đang lọc máu) theo chống chỉ định của Bộ Y tế QĐ 2131/2026`
    );
    citationSet.add('fda.copd.azithromycin_renal_gfr10');
  }

  if (Boolean(ci.hearingImpairment) || Boolean(ci.tinnitus)) {
    reasons.push('Giảm thính lực hoặc ù tai (nguy cơ độc tính tai của macrolide dài ngày)');
  }
  if (Boolean(ci.ntmInfection)) {
    reasons.push('Đang nhiễm hoặc chưa loại trừ vi khuẩn lao không điển hình (NTM – nguy cơ kháng macrolide)');
  }

  return { reasons, citationIds: Array.from(citationSet) };
}

export function getAzithromycinContraReasons(ctx: RuleContext): string[] {
  return getAzithromycinContraInfo(ctx).reasons;
}

export function getAzithromycinCautionInfo(ctx: RuleContext): OralCautionInfo {
  const warnings: string[] = [];
  const citationSet = new Set<string>();
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const ci = ctx.normalized.customInputs || {};

  if (hasCondition(ctx, 'pregnant') || Boolean(cond.pregnant)) {
    warnings.push(
      'Thai kỳ: Cần hội chẩn Sản – Hô hấp cân nhắc kỹ lợi ích và nguy cơ kháng thuốc/QTc khi dùng macrolide dự phòng dài ngày.'
    );
  }

  const egfr = need(ctx, 'egfr');
  const crcl = need(ctx, 'crcl');
  const gfrSevere = thFor('egfr', 'copd.lama_severe_renal_egfr');
  const gfrContra = thFor('egfr', 'copd.azithromycin_contra_gfr_min');
  if (
    (egfr !== undefined && egfr >= gfrContra && egfr < gfrSevere) ||
    (crcl !== undefined && crcl >= gfrContra && crcl < gfrSevere)
  ) {
    warnings.push(
      `Suy thận nặng (eGFR/CrCl ${gfrContra}–<${gfrSevere} mL/phút): Phơi nhiễm toàn thân của Azithromycin tăng đáng kể; cần theo dõi sát điện tâm đồ (QTc) và thính lực.`
    );
    citationSet.add('fda.copd.azithromycin_renal_gfr10');
  }

  if (Boolean(cond.myastheniaGravis || ci.myastheniaGravis)) {
    warnings.push(
      'Nhược cơ (Myasthenia Gravis): Azithromycin có thể làm kịch phát yếu cơ nặng hoặc suy cơ hô hấp (FDA Section 5.7); giám sát sát triệu chứng thần kinh – cơ.'
    );
    citationSet.add('fda.copd.azithromycin_myasthenia_gravis');
  }

  const vkaMeds = findAllCurrentMedsInSet(ctx, VKA_DRUG_IDS);
  if (vkaMeds.length > 0) {
    const vkaNames = vkaMeds.map((m) => m.name || m.drugId).join(', ');
    warnings.push(
      `Đang dùng thuốc chống đông kháng vitamin K (${vkaNames}): Bắt buộc kiểm tra sát PT/INR khi khởi trị hoặc duy trì Azithromycin do nguy cơ tăng INR và xuất huyết.`
    );
    citationSet.add('fda.copd.azithromycin_warfarin_digoxin');
  }

  const pGpMeds = findAllCurrentMedsInSet(
    ctx,
    new Set(['digoxin', 'colchicine', 'phenytoin'])
  );
  if (pGpMeds.length > 0) {
    const pGpNames = pGpMeds.map((m) => m.name || m.drugId).join(', ');
    warnings.push(
      `Tương tác P-glycoprotein (${pGpNames}): Azithromycin làm tăng nồng độ huyết thanh của ${pGpNames}; cần theo dõi sát dấu hiệu ngộ độc (loạn nhịp/tiêu hóa/thần kinh) hoặc định lượng nồng độ thuốc.`
    );
    citationSet.add('fda.copd.azithromycin_warfarin_digoxin');
  }

  return { warnings, citationIds: Array.from(citationSet) };
}
