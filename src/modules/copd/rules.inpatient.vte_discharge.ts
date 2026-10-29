import type { Rule, RuleContext, GateResult } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { computeCha2ds2va } from '../../engine/calculators/cha2ds2va';
import { thFor, drug, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  ANTICOAGULANT_DRUG_IDS,
  STRONG_CYP3A4_INDUCER_IDS,
  formatCopdBudesonideFormoterolDose,
  getAbgPh,
  getAbgPaco2,
  hasAnyCurrentMed,
  hasAnticholinergicContra,
  hasMilkProteinAllergy,
  hasWeakInspiratoryFlow,
  hasBreastfeeding,
  resolveEffectiveInhaler,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  isCriticallyUnstableInpatient,
} from './helpers';

function isAlreadyAnticoagulated(ctx: RuleContext): boolean {
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  return (
    hasAnyCurrentMed(ctx, ANTICOAGULANT_DRUG_IDS) !== undefined ||
    hasCondition(ctx, 'onAnticoagulant') ||
    Boolean(cond.onAnticoagulant)
  );
}

function hasBleedingContraindication(ctx: RuleContext): boolean {
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const ci = ctx.normalized.customInputs || {};
  return (
    hasCondition(ctx, 'bleedingHistory') ||
    Boolean(cond.bleedingHistory) ||
    hasCondition(ctx, 'activeBleeding') ||
    Boolean(cond.activeBleeding) ||
    Boolean(ci.activeBleeding) ||
    hasCondition(ctx, 'acuteIntracerebralHemorrhage') ||
    Boolean(cond.acuteIntracerebralHemorrhage)
  );
}

function getPlatelets(ctx: RuleContext): number | undefined {
  const candidates = [
    ctx.normalized?.customInputs?.platelets,
    ctx.patient?.customInputs?.platelets,
    (ctx.normalized as unknown as Record<string, unknown>)?.platelets,
    (ctx.patient as unknown as Record<string, unknown>)?.platelets,
  ];
  for (const val of candidates) {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function hasHitContraindication(ctx: RuleContext): boolean {
  const bags = [
    ctx.patient.conditions as Record<string, unknown> | undefined,
    ctx.normalized.conditions as Record<string, unknown> | undefined,
    ctx.normalized.customInputs,
    ctx.patient.customInputs,
  ];
  const hitKeys = ['hit', 'heparinInducedThrombocytopenia', 'heparin_induced_thrombocytopenia'];
  if (bags.some((b) => b !== undefined && hitKeys.some((k) => Boolean(b[k])))) return true;
  return (ctx.patient.allergies || []).some((a) => {
    const s = a.trim().toLowerCase();
    return s.includes('heparin') || s.includes('enoxaparin') || s.includes('lmwh');
  });
}

/**
 * Kiểm tra xem module Rung nhĩ (`af`) được đồng chọn có tự động phát lệnh START thuốc chống đông
 * điều trị liều đầy đủ (DOAC hoặc VKA) hay không để tránh kê trùng thêm Heparin dự phòng VTE.
 */
function willCoSelectedAfPrescribeOac(ctx: RuleContext): boolean {
  if (!ctx.normalized.selectedModules.includes('af')) return false;
  const afActive =
    hasCondition(ctx, 'af') ||
    ctx.normalized.rhythm === 'afib' ||
    Boolean(ctx.patient.selectedModules?.includes('af'));
  if (!afActive) return false;

  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const nCond = (ctx.normalized.conditions || {}) as Record<string, unknown>;
  const ci = ctx.normalized.customInputs || {};
  const pltMin = thFor('platelets', 'copd.vte_platelets_min');
  const plt = getPlatelets(ctx);
  if (
    hasBleedingContraindication(ctx) ||
    hasCondition(ctx, 'pregnant') ||
    Boolean(cond.pregnant) ||
    (plt !== undefined && plt < pltMin)
  ) {
    return false;
  }

  const hasValvularOrAps =
    hasCondition(ctx, 'mechanicalValve') ||
    Boolean(cond.mechanicalValve) ||
    hasCondition(ctx, 'mitralStenosis') ||
    Boolean(cond.mitralStenosis) ||
    Boolean(cond.antiphospholipidSyndrome) ||
    Boolean(cond.aps) ||
    Boolean(nCond.antiphospholipidSyndrome) ||
    Boolean(nCond.aps);
  if (hasValvularOrAps) return true;

  if (hasBreastfeeding(ctx)) return true;

  const cp = String(ci.childPugh ?? '').toUpperCase();
  const hasContraHepatic =
    cp === 'C' ||
    hasCondition(ctx, 'decompensatedCirrhosis') ||
    (cp === '' && (Boolean(cond.liverDisease) || hasCondition(ctx, 'liverDisease')));
  if (hasContraHepatic) return false;

  const onDialysis =
    Boolean(cond.dialysis) || hasCondition(ctx, 'onDialysis') || Boolean(cond.onDialysis);
  const crcl = need(ctx, 'crcl');
  const scr = need(ctx, 'scr');
  const age = need(ctx, 'age');
  const sex = ctx.normalized.sex;
  const weight = need(ctx, 'weight');
  const contraCrclMin = thFor('crcl', 'af.doac.contra_crcl_min');

  if (hasAnyCurrentMed(ctx, STRONG_CYP3A4_INDUCER_IDS)) {
    if (onDialysis && ctx.settings.profile !== 'US') return false;
    if (!onDialysis && crcl !== undefined && crcl < contraCrclMin) return false;
    return true;
  }

  const sbp = need(ctx, 'sbp');
  const sbpShock = thFor('sbp', 'copd.hypotension_sbp_cutoff');
  const unstableHemo =
    (sbp !== undefined && sbp < sbpShock) ||
    hasCondition(ctx, 'cardiogenicShock') ||
    hasCondition(ctx, 'acutePulmonaryEdema') ||
    ci.hemodynamicStability === 'unstable';
  if (unstableHemo || onDialysis) return false;

  if (age === undefined || sex === undefined || weight === undefined || scr === undefined || crcl === undefined) {
    return false;
  }
  if (crcl < contraCrclMin) return false;

  if (
    hasCondition(ctx, 'hypertrophicCardiomyopathy') ||
    Boolean(cond.hcm) ||
    hasCondition(ctx, 'cardiacAmyloidosis') ||
    Boolean(cond.amyloidosis)
  ) {
    return true;
  }

  const cha = computeCha2ds2va({
    age,
    sex,
    chf: hasCondition(ctx, 'heartFailure') || hasCondition(ctx, 'hf'),
    hypertension: hasCondition(ctx, 'hypertension') || hasCondition(ctx, 'htn'),
    diabetes: hasCondition(ctx, 'diabetes') || hasCondition(ctx, 'dm') || Boolean(cond.dm2),
    strokeOrTia:
      hasCondition(ctx, 'strokeOrTia') || Boolean(cond.priorStroke) || Boolean(cond.priorTia),
    vascularDisease:
      hasCondition(ctx, 'vascularDisease') ||
      hasCondition(ctx, 'cad') ||
      hasCondition(ctx, 'mi') ||
      Boolean(cond.priorMi) ||
      hasCondition(ctx, 'pad'),
  });

  if (ctx.settings.profile === 'US') {
    const vasc = cha.scoreVasc ?? cha.scoreVa;
    return sex === 'female'
      ? vasc >= thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_female_high')
      : vasc >= thFor('cha2ds2vasc_score', 'af.cha2ds2vasc.us_male_high');
  }
  return cha.scoreVa >= thFor('cha2ds2va_score', 'af.cha2ds2va.high_risk');
}

export const copdInpatientVteDischargeRules: Rule[] = [
  {
    id: 'copd.inpatient.vte_prophylaxis',
    module: 'copd',
    nameVi: 'Dự phòng thuyên tắc huyết khối tĩnh mạch (VTE) có kiểm soát chức năng thận, tiểu cầu, HIT & nguy cơ chảy máu',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.vte_prophylaxis',
      'byt.vte.2023.enoxaparin_renal_crcl15',
      'byt.copd.2023.vte_hit_contra',
      'byt.copd.2023.vte_platelets_lt_50',
    ],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx) || ctx.settings.setting !== 'inpatient') return false;
      if (isAlreadyAnticoagulated(ctx) || willCoSelectedAfPrescribeOac(ctx)) return false;
      return true;
    },
    produce: (ctx) => {
      const plt = getPlatelets(ctx);
      const pltMin = thFor('platelets', 'copd.vte_platelets_min');
      const hasHit = hasHitContraindication(ctx);
      const hasLowPlt = plt !== undefined && plt < pltMin;
      const hasBleed = hasBleedingContraindication(ctx);

      if (hasHit || hasLowPlt || hasBleed) {
        const contraDetail = hasHit
          ? 'tiền sử/đang bị giảm tiểu cầu miễn dịch do Heparin (HIT)'
          : hasLowPlt
            ? `giảm tiểu cầu nặng (${plt} < ${pltMin} G/L)`
            : 'đang xuất huyết hoặc tiền sử xuất huyết nặng';
        return {
          id: 'rec_copd_vte_prophylaxis',
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 1,
          action: 'AVOID',
          drugId: 'enoxaparin',
          drugNameVi: hasDrug('enoxaparin') ? drug('enoxaparin').nameVi : 'Enoxaparin',
          dose: undefined,
          title: hasHit
            ? 'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI Heparin (LMWH/UFH) do tiền sử giảm tiểu cầu do Heparin (HIT) – Dùng dự phòng VTE cơ học (IPC)'
            : hasLowPlt
              ? `TRÁNH DÙNG chống đông dược lý (LMWH/UFH) do giảm tiểu cầu nặng (${plt} < ${pltMin} G/L) – Dùng dự phòng VTE cơ học (IPC)`
              : 'TRÁNH DÙNG chống đông dược lý (LMWH/UFH) do nguy cơ/tiền sử xuất huyết – Dùng dự phòng VTE cơ học (IPC)',
          rationale: `Người bệnh đợt cấp COPD nhập viện có chống chỉ định dùng Heparin dự phòng do ${contraDetail}: Tuyệt đối tránh tiêm LMWH/UFH; chuyển sang biện pháp dự phòng huyết khối cơ học (bơm ép hơi ngắt quãng IPC, tất áp lực y khoa và vận động sớm tại giường${hasHit ? '; hội chẩn huyết học nếu bắt buộc dùng chống đông không phải heparin' : ''}).`,
          gates: [],
          citationIds: [
            'byt.copd.2026.vte_prophylaxis',
            ...(hasHit ? ['byt.copd.2023.vte_hit_contra'] : []),
            ...(hasLowPlt ? ['byt.copd.2023.vte_platelets_lt_50'] : []),
          ],
          priority: 86,
        };
      }

      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const egfrCaution = thFor('egfr', 'copd.egfr_vte_lmwh_caution');
      const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
      const onDialysis =
        Boolean(cond.dialysis) || hasCondition(ctx, 'onDialysis') || Boolean(cond.onDialysis);
      const severeRenal =
        onDialysis ||
        (egfr !== undefined && egfr < egfrCaution) ||
        (crcl !== undefined && crcl < egfrCaution);

      if (severeRenal) {
        const gates: GateResult[] = [
          {
            parameter: 'egfr',
            passed: false,
            action: 'reduce',
            messageVi: `Suy thận nặng (${onDialysis ? 'đang lọc máu' : `eGFR/CrCl < ${egfrCaution} mL/phút`}): Tránh LMWH liều chuẩn chưa chỉnh liều; ưu tiên Heparin không phân đoạn (UFH) dưới da hoặc giảm liều LMWH theo mức lọc cầu thận`,
            value: egfr ?? crcl,
            threshold: egfrCaution,
          },
        ];
        return {
          id: 'rec_copd_vte_prophylaxis',
          module: 'copd',
          tier: 'Xử trí đợt cấp cấp cứu',
          tierOrder: 2,
          action: 'START',
          drugId: 'heparin',
          drugNameVi: hasDrug('heparin') ? drug('heparin').nameVi : 'Heparin không phân đoạn (UFH)',
          dose: 'Heparin không phân đoạn (UFH) tiêm dưới da (hoặc Enoxaparin hiệu chỉnh giảm liều suy thận nặng)',
          title:
            'Dự phòng VTE trên nền suy thận nặng / lọc máu: Ưu tiên Heparin không phân đoạn (UFH) dưới da thay LMWH liều chuẩn',
          rationale: `Bệnh nhân đợt cấp COPD nhập viện kèm suy thận nặng (eGFR/CrCl < ${egfrCaution} mL/phút hoặc đang lọc máu) có nguy cơ tích lũy Heparin trọng lượng phân tử thấp (LMWH) gây xuất huyết nặng. Ưu tiên dự phòng VTE bằng Heparin không phân đoạn (UFH) tiêm dưới da, đồng thời kiểm tra tiểu cầu trước và trong điều trị.`,
          warnings: [
            `Suy thận nặng (eGFR/CrCl < ${egfrCaution} mL/phút / lọc máu): Không dùng LMWH liều chuẩn chưa chỉnh liều thận; kiểm tra số lượng tiểu cầu (≥ ${pltMin} G/L) phòng HIT.`,
          ],
          gates,
          citationIds: ['byt.copd.2026.vte_prophylaxis', 'byt.vte.2023.enoxaparin_renal_crcl15'],
          priority: 85,
        };
      }

      const warnings: string[] = [
        `Kiểm tra công thức máu (tiểu cầu ≥ ${pltMin} G/L) và loại trừ chống chỉ định chảy máu / tiền sử giảm tiểu cầu do Heparin (HIT) trước khi tiêm.`,
      ];
      if (egfr === undefined && crcl === undefined) {
        warnings.unshift(
          `Chưa có Creatinin / eGFR: Cần đối chiếu mức lọc cầu thận (nếu eGFR/CrCl < ${egfrCaution} mL/phút phải chuyển sang UFH dưới da hoặc giảm liều LMWH).`
        );
      }

      return {
        id: 'rec_copd_vte_prophylaxis',
        module: 'copd',
        tier: 'Xử trí đợt cấp cấp cứu',
        tierOrder: 2,
        action: 'START',
        drugId: 'enoxaparin',
        drugNameVi: hasDrug('enoxaparin') ? drug('enoxaparin').nameVi : 'Enoxaparin',
        dose: 'Heparin trọng lượng phân tử thấp (LMWH – ví dụ Enoxaparin tiêm dưới da liều dự phòng huyết khối 1 lần/ngày)',
        title: 'Dự phòng thuyên tắc huyết khối tĩnh mạch (VTE) bằng Heparin trọng lượng phân tử thấp',
        rationale:
          'BYT QĐ 2131/2026 (Mục 3.4.4e) và GOLD 2026: Bệnh nhân đợt cấp COPD nhập viện hạn chế vận động có nguy cơ cao huyết khối tĩnh mạch sâu và thuyên tắc phổi; chỉ định Heparin trọng lượng phân tử thấp tiêm dưới da dự phòng khi không có chống chỉ định chảy máu, HIT hoặc giảm tiểu cầu nặng.',
        warnings,
        gates: [],
        citationIds: ['byt.copd.2026.vte_prophylaxis'],
        priority: 85,
      };
    },
  },

  {
    id: 'copd.inpatient.discharge_criteria',
    module: 'copd',
    nameVi: 'Checklist xuất viện, tối ưu hóa phác đồ duy trì, phục hồi chức năng sớm & giám sát tim mạch sau đợt cấp',
    setting: 'inpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.discharge_checklist',
      'gold.copd.2026.pulmonary_rehab_post_discharge',
      'byt.copd.2026.cv_risk_post_exacerbation',
      'gold.copd.2026.exac_continue_labd',
    ],
    when: (ctx) => {
      if (ctx.settings.setting !== 'inpatient' || !isAcuteExacerbation(ctx)) return false;
      if (isCriticallyUnstableInpatient(ctx)) return false;
      const ph = getAbgPh(ctx);
      const paco2 = getAbgPaco2(ctx);
      if (
        ph !== undefined &&
        paco2 !== undefined &&
        ph <= thFor('abgPh', 'copd.niv_ph_cutoff') &&
        paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff')
      ) {
        return false;
      }
      return true;
    },
    produce: (ctx) => {
      const rehabWeeks = thFor('duration_weeks', 'copd.rehab_post_discharge_weeks');
      const antiCholContra = hasAnticholinergicContra(ctx);
      const nonLamaGuide = antiCholContra
        ? ` LƯU Ý CHỐNG CHỈ ĐỊNH LAMA (glôcôm góc đóng / bí tiểu): Khi kê đơn duy trì ra viện, tuyệt đối tránh LAMA; sử dụng LABA phun sương mịn (Olodaterol Respimat) hoặc phối hợp cố định ICS + LABA chuẩn COPD (${formatCopdBudesonideFormoterolDose(hasMilkProteinAllergy(ctx) || hasWeakInspiratoryFlow(ctx))}) nếu thuộc Nhóm E tăng bạch cầu ái toan / đồng mắc Hen.`
        : '';

      return {
        id: 'rec_copd_discharge_checklist',
        module: 'copd',
        tier: 'Kế hoạch ra viện & Tái khám',
        tierOrder: 5,
        action: 'MONITOR',
        title: `Checklist đánh giá trước khi xuất viện, phục hồi chức năng sớm (< ${rehabWeeks} tuần) & giám sát tim mạch sau đợt cấp`,
        rationale: `Trước khi xuất viện sau đợt cấp: 1) Ổn định lâm sàng ≥ 24 giờ và khởi động/duy trì đầy đủ thuốc hít giãn phế quản tác dụng kéo dài (LABA + LAMA hoặc bộ ba ICS + LAMA + LABA); 2) Kiểm tra kỹ thuật sử dụng bình hít (chuyển sang SMI/pMDI + buồng đệm nếu lực hít yếu hoặc dị ứng đạm sữa); 3) Chuyển chương trình Phục hồi chức năng hô hấp sớm trong vòng ${rehabWeeks} tuần sau xuất viện (GOLD 2026 Evidence A); 4) Tư vấn cai thuốc lá & rà soát tiêm chủng (Cúm, Phế cầu, RSV, Tdap, COVID-19, Zona tái tổ hợp) khi ổn định; 5) Hẹn tái khám 1–4 tuần, kiểm tra lại khí máu nếu tăng CO₂ máu và cảnh giác cao biến cố tim mạch cấp (nhồi máu cơ tim, suy tim mất bù, rung nhĩ, thuyên tắc phổi) tăng cao trong 30 ngày đầu sau đợt cấp nhập viện.${nonLamaGuide}`,
        gates: [],
        citationIds: [
          'byt.copd.2026.discharge_checklist',
          'gold.copd.2026.pulmonary_rehab_post_discharge',
          'byt.copd.2026.cv_risk_post_exacerbation',
          'gold.copd.2026.exac_continue_labd',
          ...(antiCholContra ? ['byt.copd.2026.budesonide_formoterol_dose', 'gold.copd.2026.lama_glaucoma_caution'] : []),
        ],
        priority: 40,
      };
    },
  },

  {
    id: 'copd.outpatient.post_exacerbation_followup',
    module: 'copd',
    nameVi: 'Hẹn tái khám sớm 1–4 tuần và khởi động/tối ưu thuốc hít duy trì sau đợt cấp ngoại trú',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.exac_continue_labd',
      'byt.copd.2026.discharge_checklist',
      'byt.copd.2026.cv_risk_post_exacerbation',
    ],
    when: (ctx) =>
      ctx.settings.setting === 'outpatient' &&
      isAcuteExacerbation(ctx) &&
      !hasOutpatientAcuteRespiratoryFailure(ctx),
    produce: (ctx) => {
      const tier = resolveEffectiveInhaler(ctx);
      const antiCholContra = hasAnticholinergicContra(ctx);
      const needsInitOrStepUp = tier === 'none' || tier === 'lama_mono' || tier === 'laba_mono';
      const labdPlanNote = needsInitOrStepUp
        ? antiCholContra
          ? ` Người bệnh hiện chưa có phác đồ giãn phế quản dài hạn tối ưu và có chống chỉ định kháng cholinergic: Ngay khi qua giai đoạn cấp, khởi động/tối ưu thuốc hít duy trì không chứa LAMA (Olodaterol Respimat hoặc ICS + LABA chuẩn COPD nếu tăng bạch cầu ái toan / đồng mắc Hen).`
          : ' Người bệnh hiện chưa có phác đồ giãn phế quản dài hạn đôi/ba tối ưu: Theo GOLD 2026, cần khởi động hoặc nâng bậc thuốc hít giãn phế quản tác dụng kéo dài nền tảng (ưu tiên LABA + LAMA cho phân nhóm đợt cấp, hoặc ICS + LAMA + LABA nếu Eos ≥ 300 tế bào/µL) ngay khi đợt cấp ổn định.'
        : ' Tiếp tục duy trì đều đặn thuốc hít giãn phế quản dài hạn nền và đánh giá lại nhu cầu nâng bậc dự phòng đợt cấp tiếp theo.';

      return {
        id: 'rec_copd_outpatient_post_exac_followup',
        module: 'copd',
        tier: 'Kế hoạch ra viện & Tái khám',
        tierOrder: 5,
        action: 'MONITOR',
        title: 'Hẹn tái khám sau 1–4 tuần (hoặc khám cấp cứu ngay nếu nặng lên) & tối ưu hóa phác đồ hít duy trì sau đợt cấp ngoại trú',
        rationale: `Sau khi kê đơn điều trị đợt cấp COPD ngoại trú: 1) Hướng dẫn dấu hiệu cảnh báo cần nhập viện ngay (khó thở tăng nhanh khi nghỉ, tím môi, lơ mơ, co kéo cơ hô hấp phụ, SpO₂ < ${thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff')}%); 2) Bắt buộc hẹn tái khám sau 1–4 tuần để đánh giá đáp ứng triệu chứng (mMRC/CAT), kiểm tra trực tiếp kỹ thuật hít, xét nghiệm bạch cầu ái toan máu và đo lại hô hấp ký khi ổn định; 3) Giám sát nguy cơ biến cố tim mạch tăng cao sau đợt cấp.${labdPlanNote}`,
        gates: [],
        citationIds: [
          'gold.copd.2026.exac_continue_labd',
          'byt.copd.2026.discharge_checklist',
          'byt.copd.2026.cv_risk_post_exacerbation',
        ],
        priority: 42,
      };
    },
  },
];
