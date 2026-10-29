import type { Rule, RuleContext, CurrentMed } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor, drug, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  METHYLXANTHINE_IDS,
  THEOPHYLLINE_CYP1A2_INHIBITOR_IDS,
  CNS_DEPRESSANT_IDS,
  GABAPENTINOID_IDS,
  SYSTEMIC_STEROID_IDS,
  findCurrentMedInSet,
  findAllCurrentMedsInSet,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  getAbgPh,
  getAbgPaco2,
  getRestingSpo2,
} from './helpers';

function parseDailyMedMg(med: CurrentMed): number | undefined {
  let perAdminMg: number | undefined;
  let freqMultiplier = 1; // qa-allow: unit-conversion - hệ số số lần dùng mặc định 1 lần/ngày nếu không ghi tần suất

  if (typeof med.dose === 'number' && Number.isFinite(med.dose) && med.dose > 0) {
    perAdminMg = med.dose;
  } else if (typeof med.dose === 'string') {
    const str = med.dose.toLowerCase();
    const multMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:mg)?\s*[x×*]\s*(\d+)/);
    if (multMatch) {
      perAdminMg = parseFloat(multMatch[1]);
      freqMultiplier = parseInt(multMatch[2], 10);
    } else {
      const numMatch = str.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) perAdminMg = parseFloat(numMatch[1]);
    }
  }
  if (perAdminMg === undefined || !Number.isFinite(perAdminMg) || perAdminMg <= 0) return undefined;

  const freqStr = `${med.freq || ''} ${typeof med.dose === 'string' ? med.dose : ''}`.toLowerCase();
  if (freqMultiplier === 1) { // qa-allow: unit-conversion - chỉ phân tích freq khi chuỗi dose chưa chứa xN
    const xTimes = freqStr.match(/(\d+)\s*lần\s*\/\s*ngày/);
    if (xTimes) {
      freqMultiplier = parseInt(xTimes[1], 10);
    } else if (/\b(qid|q6h)\b/.test(freqStr)) {
      freqMultiplier = 4; // qa-allow: unit-conversion - quy đổi qid/q6h = 4 lần/ngày
    } else if (/\b(tid|q8h)\b/.test(freqStr)) {
      freqMultiplier = 3; // qa-allow: unit-conversion - quy đổi tid/q8h = 3 lần/ngày
    } else if (/\b(bid|q12h)\b/.test(freqStr)) {
      freqMultiplier = 2; // qa-allow: unit-conversion - quy đổi bid/q12h = 2 lần/ngày
    }
  }
  return perAdminMg * freqMultiplier;
}

function makeMethylxanthineAcuteStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.methylxanthine_acute_stop'
        : `copd.safety.methylxanthine_acute_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng nhóm Methylxanthine (Theophylline / Aminophylline) trong đợt cấp COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.exac_no_iv_methylxanthines',
      'gold.copd.2026.theophylline_arrhythmia_seizure',
    ],
    when: (ctx) =>
      (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) &&
      findAllCurrentMedsInSet(ctx, METHYLXANTHINE_IDS).length > slotIndex,
    produce: (ctx) => {
      const med = findAllCurrentMedsInSet(ctx, METHYLXANTHINE_IDS)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_methylxanthine_acute'
            : `rec_copd_stop_methylxanthine_acute_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG ${medName} (Methylxanthine) trong đợt cấp COPD do nguy cơ loạn nhịp thất & co giật`,
        rationale:
          'GOLD 2026 (Evidence B) khẳng định không khuyến cáo dùng nhóm methylxanthine (theophylline, aminophylline tĩnh mạch/uống) trong đợt cấp COPD do cửa sổ điều trị rất hẹp, không cải thiện thêm chức năng hô hấp trên nền SABA/SAMA nhưng làm tăng đáng kể nguy cơ rối loạn nhịp nhĩ/thất đe dọa tính mạng, tụt huyết áp, nôn ói và co giật động kinh (đặc biệt khi dùng kèm macrolide/quinolone hoặc giảm oxy máu).',
        gates: [],
        citationIds: [
          'gold.copd.2026.exac_no_iv_methylxanthines',
          'gold.copd.2026.theophylline_arrhythmia_seizure',
        ],
        priority: 98,
      };
    },
  };
}

function hasHypercapniaOrAcuteRiskForCns(ctx: RuleContext): boolean {
  if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return true;
  const paco2 = getAbgPaco2(ctx);
  const ph = getAbgPh(ctx);
  const spo2 = getRestingSpo2(ctx);
  return (
    (paco2 !== undefined && paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff')) ||
    (ph !== undefined && ph <= thFor('abgPh', 'copd.niv_ph_cutoff')) ||
    (spo2 !== undefined && spo2 < thFor('restingSpo2', 'copd.outpatient_acute_spo2_cutoff'))
  );
}

function makeCnsDepressantStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.cns_depressant_hypercapnia_stop'
        : `copd.safety.cns_depressant_hypercapnia_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Chống chỉ định / Ngừng thuốc an thần gây ngủ & opioid khi đợt cấp hoặc suy hô hấp tăng CO₂ máu',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.sedatives_hypercapnia'],
    when: (ctx) =>
      hasHypercapniaOrAcuteRiskForCns(ctx) &&
      findAllCurrentMedsInSet(ctx, CNS_DEPRESSANT_IDS).length > slotIndex,
    produce: (ctx) => {
      const med = findAllCurrentMedsInSet(ctx, CNS_DEPRESSANT_IDS)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_cns_depressant_hypercapnia'
            : `rec_copd_stop_cns_depressant_hypercapnia_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `TRÁNH / NGỪNG ${medName} (thuốc ức chế thần kinh trung ương) do nguy cơ ức chế hô hấp và hôn mê tăng CO₂ máu`,
        rationale:
          'GOLD 2026 cảnh báo nhóm benzodiazepine, thuốc ngủ an thần (Z-drugs), barbiturate và opioid làm suy giảm trực tiếp trung tâm điều hòa thông khí hành não, làm nặng nhanh tình trạng giảm thông khí phế nang, ứ CO₂ máu, toan hô hấp cấp và tử vong ở bệnh nhân COPD nặng hoặc đang trong đợt cấp.',
        gates: [],
        citationIds: ['gold.copd.2026.sedatives_hypercapnia'],
        priority: 99,
      };
    },
  };
}

export const copdSafetySystemicRules: Rule[] = [
  makeMethylxanthineAcuteStopRule(0),
  makeMethylxanthineAcuteStopRule(1), // qa-allow: index - khe dừng methylxanthine thứ 2 trong đợt cấp
  makeMethylxanthineAcuteStopRule(2), // qa-allow: index - khe dừng methylxanthine thứ 3 trong đợt cấp

  {
    id: 'copd.safety.theophylline_chronic_review',
    module: 'copd',
    nameVi: 'Cảnh báo độc tính cửa sổ điều trị hẹp, quá liều mg/kg & tương tác CYP1A2 của Theophylline duy trì',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.theophylline_narrow_toxicity',
      'gold.copd.2026.theophylline_arrhythmia_seizure',
      'byt.copd.2026.theophylline_dose_max10',
      'byt.copd.2026.risk_elderly_65',
    ],
    when: (ctx) =>
      !isAcuteExacerbation(ctx) &&
      !hasOutpatientAcuteRespiratoryFailure(ctx) &&
      findCurrentMedInSet(ctx, METHYLXANTHINE_IDS) !== undefined,
    produce: (ctx) => {
      const allXanthines = findAllCurrentMedsInSet(ctx, METHYLXANTHINE_IDS);
      const med = allXanthines[0]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      const age = need(ctx, 'age');
      const weight = need(ctx, 'weight');
      const elderlyAge = thFor('age', 'copd.theophylline_elderly_age');
      const maxMgKg = thFor('dose_mg_kg', 'copd.theophylline_max_mg_kg_day');
      const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;

      let totalDailyMg = 0;
      let hasParsedDose = false;
      for (const xm of allXanthines) {
        const parsed = parseDailyMedMg(xm);
        if (parsed !== undefined) {
          totalDailyMg += parsed;
          hasParsedDose = true;
        }
      }
      const mgPerKg =
        hasParsedDose && weight !== undefined && weight > 0
          ? Number((totalDailyMg / weight).toFixed(1)) // qa-allow: unit-conversion - tính liều mg/kg/ngày
          : undefined;
      const isOverMaxDose = mgPerKg !== undefined && mgPerKg > maxMgKg;

      const cypInhibitors = findAllCurrentMedsInSet(ctx, THEOPHYLLINE_CYP1A2_INHIBITOR_IDS);
      const cypNames = cypInhibitors.map((m) => m.name || m.drugId).join(', ');
      const hasMajorDdi = cypInhibitors.length > 0;

      const hasReducedClearance =
        hasCondition(ctx, 'liverDisease') ||
        hasCondition(ctx, 'cirrhosis') ||
        Boolean(cond.liverDisease) ||
        hasCondition(ctx, 'hf') ||
        Boolean(cond.hf) ||
        (age !== undefined && age >= elderlyAge);

      if (isOverMaxDose || hasMajorDdi) {
        const dangerReasons: string[] = [];
        if (isOverMaxDose) {
          dangerReasons.push(
            `tổng liều ${totalDailyMg} mg/ngày (~${mgPerKg} mg/kg/ngày) vượt ngưỡng tối đa ${maxMgKg} mg/kg/ngày của Bộ Y tế`
          );
        }
        if (hasMajorDdi) {
          dangerReasons.push(
            `đang phối hợp chất ức chế mạnh CYP1A2 / macrolide / quinolone (${cypNames}) làm tăng vọt nồng độ theophylline gây ngộ độc`
          );
        }
        return {
          id: 'rec_copd_review_theophylline',
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 0,
          action: 'STOP',
          drugId: med.drugId,
          drugNameVi: medName,
          dose: undefined,
          title: `NGỪNG KHẨN / ĐỔI PHÁC ĐỒ ${medName}: Nguy cơ ngộ độc tim mạch – thần kinh cấp tính (${dangerReasons.join('; ')})`,
          rationale: `Theo Phụ lục 1 BYT QĐ 2131/2026 (tổng liều nhóm methylxanthine ≤ ${maxMgKg} mg/kg/ngày, cấm phối hợp macrolide) và GOLD 2026, bệnh nhân có ${dangerReasons.join(' và ')}. Cần ngừng ${medName}, định lượng nồng độ theophylline huyết thanh/điện tâm đồ nếu có triệu chứng tim nhanh, buồn nôn, run tay và chuyển hoàn toàn sang thuốc giãn phế quản hít LAMA/LABA.`,
          gates: [],
          citationIds: [
            'byt.copd.2026.theophylline_dose_max10',
            'gold.copd.2026.theophylline_narrow_toxicity',
            'gold.copd.2026.theophylline_arrhythmia_seizure',
          ],
          priority: 96,
        };
      }

      return {
        id: 'rec_copd_review_theophylline',
        module: 'copd',
        tier: hasReducedClearance ? 'An toàn thuốc bắt buộc' : 'Tối ưu hóa thiết bị & An toàn thuốc',
        tierOrder: hasReducedClearance ? 0 : 1,
        action: hasReducedClearance ? 'REDUCE' : 'CONSIDER',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: hasReducedClearance
          ? `GIẢM LIỀU / CÂN NHẮC NGỪNG ${medName}: Nguy cơ ngộ độc Theophylline cao do giảm thanh thải (bệnh gan / suy tim / ≥ ${elderlyAge} tuổi)`
          : `Rà soát ngừng ${medName} để ưu tiên thuốc giãn phế quản hít LABA/LAMA an toàn hơn (theo dõi sát độc tính)`,
        rationale: `Theo GOLD 2026 và BYT QĐ 2131/2026 (liều tối đa ≤ ${maxMgKg} mg/kg/ngày), Theophylline chỉ có tác dụng giãn phế quản khiêm tốn nhưng độc tính phụ thuộc liều rất nặng (loạn nhịp nhĩ và thất, co giật cơn lớn) và tương tác mạnh với macrolide/fluoroquinolone. Ở người cao tuổi (≥ ${elderlyAge} tuổi), suy gan/xơ gan hoặc suy tim, độ thanh thải thuốc giảm mạnh gây tích lũy ngộ độc; ưu tiên chuyển hoàn toàn sang phác đồ hít LAMA/LABA.`,
        gates: [],
        citationIds: [
          'gold.copd.2026.theophylline_narrow_toxicity',
          'gold.copd.2026.theophylline_arrhythmia_seizure',
          'byt.copd.2026.theophylline_dose_max10',
          'byt.copd.2026.risk_elderly_65',
        ],
        priority: hasReducedClearance ? 91 : 72,
      };
    },
  },

  makeCnsDepressantStopRule(0),
  makeCnsDepressantStopRule(1), // qa-allow: index - khe dừng thuốc ức chế TKTW thứ 2
  makeCnsDepressantStopRule(2), // qa-allow: index - khe dừng thuốc ức chế TKTW thứ 3
  makeCnsDepressantStopRule(3), // qa-allow: index - khe dừng thuốc ức chế TKTW thứ 4

  {
    id: 'copd.safety.gabapentinoid_respiratory_caution',
    module: 'copd',
    nameVi: 'Cảnh báo suy hô hấp khi dùng Gabapentin / Pregabalin ở người bệnh COPD nặng hoặc phối hợp Opioid',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.sedatives_hypercapnia'],
    when: (ctx) => {
      if (findCurrentMedInSet(ctx, GABAPENTINOID_IDS) === undefined) return false;
      return hasHypercapniaOrAcuteRiskForCns(ctx) || findCurrentMedInSet(ctx, CNS_DEPRESSANT_IDS) !== undefined;
    },
    produce: (ctx) => {
      const gabaMeds = findAllCurrentMedsInSet(ctx, GABAPENTINOID_IDS);
      const med = gabaMeds[0]!;
      const names = gabaMeds
        .map((m) => m.name || (hasDrug(m.drugId) ? drug(m.drugId).nameVi : m.drugId))
        .join(' + ');
      return {
        id: 'rec_copd_gabapentinoid_respiratory_caution',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'REDUCE',
        drugId: med.drugId,
        drugNameVi: names,
        dose: undefined,
        title: `GIẢM LIỀU / GIÁM SÁT HÔ HẤP chặt chẽ ${names} (nhóm Gabapentinoid) do nguy cơ ức chế hô hấp trên nền COPD`,
        rationale:
          'Nhóm gabapentinoid (gabapentin, pregabalin) làm tăng nguy cơ suy hô hấp nặng và ngủ gà tăng CO₂ máu ở người bệnh COPD (đặc biệt khi đợt cấp, suy thận, người cao tuổi hoặc phối hợp opioid/benzodiazepine). Cần rà soát giảm về liều thấp nhất có hiệu quả theo chức năng thận và tránh cắt đột ngột ở bệnh nhân động kinh.',
        gates: [],
        citationIds: ['gold.copd.2026.sedatives_hypercapnia'],
        priority: 92,
      };
    },
  },

  {
    id: 'copd.safety.chronic_oral_steroid_taper',
    module: 'copd',
    nameVi: 'Không duy trì Corticosteroid đường uống dài ngày trong COPD ổn định (giảm liều dần để ngừng)',
    setting: 'outpatient',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.oral_glucocorticoids_chronic_harm'],
    when: (ctx) => {
      if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
      if (ctx.normalized.selectedModules.includes('asthma')) return false;
      return findCurrentMedInSet(ctx, SYSTEMIC_STEROID_IDS) !== undefined;
    },
    produce: (ctx) => {
      const ocsMed = findCurrentMedInSet(ctx, SYSTEMIC_STEROID_IDS)!;
      const medName = ocsMed.name || (hasDrug(ocsMed.drugId) ? drug(ocsMed.drugId).nameVi : ocsMed.drugId);
      return {
        id: 'rec_copd_taper_chronic_oral_steroid',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'REDUCE',
        drugId: ocsMed.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `GIẢM LIỀU DẦN ĐỂ NGỪNG ${medName} đường toàn thân: Không có chỉ định duy trì dài hạn trong COPD ổn định`,
        rationale:
          'GOLD 2026 (Evidence A) khẳng định corticosteroid đường uống dùng kéo dài hàng ngày trong COPD giai đoạn ổn định không đem lại lợi ích lâm sàng nhưng gây nhiều biến chứng nặng (bệnh cơ do steroid làm yếu cơ hô hấp dẫn tới suy hô hấp mạn tính, suy thượng thận thứ phát, loãng xương gãy đốt sống, tăng đường huyết, viêm phổi). Không cắt đột ngột nếu đã dùng kéo dài > 2–3 tuần; cần giảm liều từ từ có kiểm soát trục hạ đồi – tuyến yên – thượng thận đồng thời tối ưu hóa thuốc hít duy trì.',
        gates: [],
        citationIds: ['gold.copd.2026.oral_glucocorticoids_chronic_harm'],
        priority: 93,
      };
    },
  },

  {
    id: 'copd.safety.saba_overuse_warning',
    module: 'copd',
    nameVi: 'Cảnh báo lạm dụng thuốc cắt cơn SABA (> 2 lần/tuần hoặc ≥ 3 bình/năm)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gina.copd.2026.saba_overuse_twice_weekly',
      'gina.copd.2026.saba_overuse_3_canisters',
      'gold.copd.2026.followup_dyspnea_switch_device',
    ],
    when: (ctx) => {
      if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
      const ci = ctx.normalized.customInputs || {};
      const patRec = ctx.patient as unknown as Record<string, unknown>;
      const sabaWeek =
        typeof ci.sabaUsePerWeek === 'number'
          ? ci.sabaUsePerWeek
          : typeof patRec.sabaUsePerWeek === 'number'
            ? patRec.sabaUsePerWeek
            : undefined;
      const sabaCanisters = typeof ci.sabaCanistersPerYear === 'number' ? ci.sabaCanistersPerYear : undefined;
      const weekMax = thFor('sabaUsePerWeek', 'copd.saba_overuse_per_week');
      const canMax = thFor('sabaCanistersPerYear', 'copd.saba_overuse_canisters_year');
      return (
        (sabaWeek !== undefined && sabaWeek > weekMax) ||
        (sabaCanisters !== undefined && sabaCanisters >= canMax)
      );
    },
    produce: (ctx) => {
      const ci = ctx.normalized.customInputs || {};
      const patRec = ctx.patient as unknown as Record<string, unknown>;
      const sabaWeek =
        typeof ci.sabaUsePerWeek === 'number'
          ? ci.sabaUsePerWeek
          : typeof patRec.sabaUsePerWeek === 'number'
            ? patRec.sabaUsePerWeek
            : undefined;
      const sabaCanisters = typeof ci.sabaCanistersPerYear === 'number' ? ci.sabaCanistersPerYear : undefined;
      const weekMax = thFor('sabaUsePerWeek', 'copd.saba_overuse_per_week');
      const canMax = thFor('sabaCanistersPerYear', 'copd.saba_overuse_canisters_year');
      const detail =
        sabaWeek !== undefined && sabaWeek > weekMax
          ? `${sabaWeek} lần/tuần (> ${weekMax} lần/tuần)`
          : `${sabaCanisters} bình/năm (≥ ${canMax} bình/năm)`;
      return {
        id: 'rec_copd_saba_overuse_warning',
        module: 'copd',
        tier: 'Tối ưu hóa thiết bị & An toàn thuốc',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Lạm dụng thuốc cắt cơn SABA (${detail}): Kiểm tra kỹ thuật hít và tối ưu hóa thuốc giãn phế quản duy trì`,
        rationale: `Việc phải dùng thuốc cắt cơn SABA thường xuyên (> ${weekMax} lần/tuần hoặc ≥ ${canMax} bình xịt/năm) phản ánh tình trạng tắc nghẽn đường thở chưa được kiểm soát, làm tăng nguy cơ đợt cấp nhập viện và tác dụng phụ tim mạch (nhịp nhanh, hạ kali máu). Không dùng SABA định kỳ dài hạn; cần kiểm tra tuân thủ, kỹ thuật sử dụng bình hít và nâng bậc thuốc duy trì LABA + LAMA / phác đồ ba thuốc.`,
        gates: [],
        citationIds: [
          'gina.copd.2026.saba_overuse_twice_weekly',
          'gina.copd.2026.saba_overuse_3_canisters',
          'gold.copd.2026.followup_dyspnea_switch_device',
        ],
        priority: 76,
      };
    },
  },
];
