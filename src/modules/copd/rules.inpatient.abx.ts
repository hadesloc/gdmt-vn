import type { Rule, RuleContext } from '../../engine/types';
import { need, hasCondition } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  COPD_PROFILES,
  QT_PROLONGING_DRUG_IDS,
  VKA_DRUG_IDS,
  getAbgPh,
  getAbgPaco2,
  getRespiratoryRate,
  findCurrentMedInSet,
  hasProlongedQtc,
  isAcuteExacerbation,
  copdMissingRec,
} from './helpers';

function hasMechanicalVentilationNeed(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  if (Boolean(ci.respiratoryArrest) || Boolean(ci.alteredMentalStatus)) return true;
  const ph = getAbgPh(ctx);
  const paco2 = getAbgPaco2(ctx);
  return (
    ph !== undefined &&
    paco2 !== undefined &&
    ph <= thFor('abgPh', 'copd.niv_ph_cutoff') &&
    paco2 >= thFor('abgPaco2', 'copd.niv_paco2_cutoff')
  );
}

function hasSecondAnthonisenOrSeveritySign(ctx: RuleContext): boolean {
  const ci = ctx.normalized.customInputs || {};
  return Boolean(ci.increasedDyspnea) || Boolean(ci.increasedSputumVolume) || Boolean(ci.fever);
}

export const copdInpatientAbxRules: Rule[] = [
  {
    id: 'copd.inpatient.antibiotics',
    module: 'copd',
    nameVi: 'Kháng sinh đợt cấp theo tiêu chuẩn Anthonisen (≥ 2 triệu chứng có đờm mủ) hoặc thông khí cơ học',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.exac_antibiotics_5d',
      'gold.copd.2026.exac_anthonisen_criteria',
      'byt.copd.2026.antibiotics_outpatient_5_7d',
      'byt.copd.2026.antibiotics_inpatient_7_10d',
      'byt.copd.2026.antibiotics_pseudomonas',
      'byt.copd.2026.quinolone_elderly_tendon',
      'byt.copd.2026.abx_renal_cipro_30_50',
      'byt.copd.2026.abx_renal_levo_20_49',
    ],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      const isPurulent = Boolean(ctx.normalized.customInputs?.purulentSputum);
      if (hasMechanicalVentilationNeed(ctx)) return true;
      return isPurulent && hasSecondAnthonisenOrSeveritySign(ctx);
    },
    produce: (ctx) => {
      const abxGoldDays = thFor('duration_days', 'copd.exac_antibiotics_duration_days');
      const abxOutMax = thFor('duration_days', 'copd.exac_abx_outpatient_max_days');
      const abxInMin = thFor('duration_days', 'copd.exac_abx_inpatient_min_days');
      const abxInMax = thFor('duration_days', 'copd.exac_abx_inpatient_max_days');
      const isInpatient = ctx.settings.setting === 'inpatient';
      const isVn = ctx.settings.profile === 'VN';

      const egfr = need(ctx, 'egfr');
      const crcl = need(ctx, 'crcl');
      const age = need(ctx, 'age');
      const egfr30 = thFor('egfr', 'copd.egfr_vte_lmwh_caution');
      const abxRenalEgfrCut = thFor('egfr', 'copd.abx_renal_egfr_cutoff');
      const abxRenalCrclCut = thFor('crcl', 'copd.abx_renal_crcl_cutoff');
      const fqAgeCut = thFor('age', 'copd.fq_elderly_age_cutoff');

      const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
      const onDialysis =
        Boolean(cond.dialysis) || hasCondition(ctx, 'onDialysis') || Boolean(cond.onDialysis);
      const severeRenal =
        onDialysis || (egfr !== undefined && egfr < egfr30) || (crcl !== undefined && crcl < egfr30);
      const moderateOrSevereRenal =
        severeRenal ||
        (egfr !== undefined && egfr < abxRenalEgfrCut) ||
        (crcl !== undefined && crcl < abxRenalCrclCut);

      const qtProlonged = hasProlongedQtc(ctx);
      const qtMed = ctx.normalized.currentMeds.find((m) =>
        QT_PROLONGING_DRUG_IDS.has((m.drugId || '').trim().toLowerCase())
      );
      const vkaMed = findCurrentMedInSet(ctx, VKA_DRUG_IDS);

      const warnings: string[] = [];
      if (severeRenal) {
        warnings.push(
          `Suy thận nặng (eGFR/CrCl < ${egfr30} mL/phút hoặc lọc máu): Bắt buộc hiệu chỉnh giảm liều theo độ thanh thải thận cho cả nhóm Beta-lactam (Amoxicillin-clavulanate, Ceftazidime, Cefepime, Piperacillin-tazobactam, Carbapenem) và Fluoroquinolone (Levofloxacin, Ciprofloxacin).`
        );
      } else if (moderateOrSevereRenal) {
        warnings.push(
          `Suy thận mức độ vừa (eGFR/CrCl ${egfr30}–${abxRenalEgfrCut} mL/phút): Bắt buộc hiệu chỉnh giảm liều nếu lựa chọn Levofloxacin (giảm nửa liều duy trì khi CrCl < ${abxRenalCrclCut} mL/phút) hoặc Ciprofloxacin (chỉnh liều khi CrCl ${egfr30}–${abxRenalCrclCut} mL/phút theo Bảng 3.5 BYT QĐ 2131/2026); kiểm tra ngưỡng chỉnh liều từng Beta-lactam.`
        );
      }

      if (qtProlonged || qtMed) {
        warnings.push(
          `Nguy cơ kéo dài khoảng QT / xoắn đỉnh (${qtProlonged ? 'QTc kéo dài' : `đang dùng ${qtMed!.name || qtMed!.drugId}`}): Tránh phối hợp Fluoroquinolone hô hấp (Levofloxacin, Moxifloxacin, Ciprofloxacin) hoặc Macrolide; ưu tiên nhóm Beta-lactam phù hợp kháng sinh đồ.`
        );
      }

      const isElderly = age !== undefined && age >= fqAgeCut;
      warnings.push(
        `Cảnh báo an toàn Fluoroquinolone khi phối hợp Corticoid toàn thân đợt cấp${isElderly ? ` (đặc biệt bệnh nhân ≥ ${fqAgeCut} tuổi)` : ''}: Làm tăng mạnh nguy cơ viêm gân / đứt gân gót Achilles, phình/bóc tách động mạch chủ, rối loạn đường huyết và sảng/lú lẫn (BYT QĐ 2131/2026); chỉ dùng khi nghi ngờ Pseudomonas aeruginosa hoặc dị ứng/thất bại Beta-lactam, dặn ngừng ngay nếu đau sưng gân.`
      );

      if (vkaMed) {
        warnings.push(
          `Tương tác thuốc kháng đông kháng Vitamin K (${vkaMed.name || vkaMed.drugId}): Kháng sinh đợt cấp (Macrolide, Fluoroquinolone, Amoxicillin-clavulanate, Cephalosporin) làm tăng mạnh INR và nguy cơ xuất huyết nặng; bắt buộc kiểm tra lại PT/INR sau 48–72 giờ và hiệu chỉnh liều.`
        );
      }

      const durationLabel = isVn
        ? isInpatient
          ? `${abxInMin}–${abxInMax} ngày (đợt cấp nặng nội trú theo BYT)`
          : `${abxGoldDays}–${abxOutMax} ngày (ngoại trú theo BYT)`
        : `${abxGoldDays} ngày (≤ ${abxGoldDays} ngày theo GOLD 2026)`;

      return {
        id: 'rec_copd_inpatient_antibiotics',
        module: 'copd',
        tier: 'Xử trí đợt cấp cấp cứu',
        tierOrder: 1,
        action: 'START',
        dose: `Kháng sinh đường uống hoặc tiêm truyền trong ${durationLabel} (phân tầng nguy cơ Pseudomonas aeruginosa)`,
        title: `Kháng sinh điều trị đợt cấp (${durationLabel}) khi thỏa tiêu chuẩn Anthonisen có đờm mủ hoặc cần thở máy`,
        rationale: `Theo GOLD 2026 (PDF p. 115) và BYT QĐ 2131/2026: Chỉ định kháng sinh khi người bệnh có ≥ 2 triệu chứng chính Anthonisen (tăng khó thở, tăng lượng đờm, sốt, tăng đờm mủ) trong đó bắt buộc có tăng đờm mủ (Type I/II), hoặc suy hô hấp cấp cần thông khí cơ học (NIV/IMV). Không dùng kháng sinh cho Type III đơn độc 1 triệu chứng nhằm tránh kháng thuốc và viêm đại tràng do C. difficile.`,
        profileDiff: {
          INTL: `GOLD 2026 khuyến cáo aminopenicillin + clavulanic acid, macrolide hoặc tetracycline với thời gian điều trị ≤ ${abxGoldDays} ngày; cấy đờm khi thất bại hoặc nghi vi khuẩn kháng thuốc.`,
          VN: `BYT QĐ 2131/2026 quy định thời gian kháng sinh ${abxGoldDays}–${abxOutMax} ngày ở ngoại trú (Hình 3.1) và thường ${abxInMin}–${abxInMax} ngày ở đợt cấp nặng nhập viện (Mục 3.4.4d), phân tầng rõ nguy cơ nhiễm Pseudomonas aeruginosa (Bảng 3.4: Ceftazidime, Cefepime, Piperacillin-Tazobactam, Ciprofloxacin hoặc Carbapenem).`,
          US: `GOLD 2026 khuyến cáo liệu trình kháng sinh ngắn ≤ ${abxGoldDays} ngày khi thỏa tiêu chuẩn Anthonisen có đờm mủ hoặc cần thở máy.`,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: [
          'gold.copd.2026.exac_antibiotics_5d',
          'gold.copd.2026.exac_anthonisen_criteria',
          'byt.copd.2026.antibiotics_outpatient_5_7d',
          'byt.copd.2026.antibiotics_inpatient_7_10d',
          'byt.copd.2026.antibiotics_pseudomonas',
          'byt.copd.2026.quinolone_elderly_tendon',
          ...(moderateOrSevereRenal
            ? ['byt.copd.2026.abx_renal_cipro_30_50', 'byt.copd.2026.abx_renal_levo_20_49']
            : []),
        ],
        priority: 90,
      };
    },
  },

  {
    id: 'copd.inpatient.antibiotics_anthonisen_clarify',
    module: 'copd',
    nameVi: 'Yêu cầu xác nhận các triệu chứng đi kèm tiêu chuẩn Anthonisen khi có đờm mủ',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.exac_anthonisen_criteria'],
    when: (ctx) => {
      if (!isAcuteExacerbation(ctx)) return false;
      if (hasMechanicalVentilationNeed(ctx)) return false;
      const ci = ctx.normalized.customInputs || {};
      if (!Boolean(ci.purulentSputum)) return false;
      if (hasSecondAnthonisenOrSeveritySign(ctx)) return false;
      return ci.increasedDyspnea === undefined && ci.increasedSputumVolume === undefined && ci.fever === undefined;
    },
    produce: (ctx) => {
      const rr = getRespiratoryRate(ctx);
      const rrNote = rr !== undefined ? ` (nhịp thở hiện tại ${rr} lần/phút)` : '';
      return copdMissingRec(
        'increasedDyspnea',
        'Triệu chứng đi kèm tiêu chuẩn Anthonisen (tăng khó thở cấp tính / tăng thể tích đờm / sốt)',
        `xác nhận đủ ≥ 2 triệu chứng chính (trong đó có đờm mủ) trước khi kê kháng sinh đợt cấp theo GOLD 2026 & BYT QĐ 2131/2026${rrNote}`,
        ['gold.copd.2026.exac_anthonisen_criteria']
      );
    },
  },
];
