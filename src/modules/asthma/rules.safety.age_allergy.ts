/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc An toàn theo Tuổi, Dị ứng thuốc, Đạm sữa bò & Cho con bú
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation, CurrentMed } from '../../engine/types';
import { need, missingInputRec } from '../../engine/require';
import { thFor, drug } from '../../kb-types';
import {
  ADULT_18_ONLY_DRUGS,
  DPI_ONLY_LACTOSE_DRUGS,
  DUAL_FORMULATION_INHALER_DRUGS,
  LACTATION_CAUTION_ASTHMA_DRUGS,
  asthmaGate,
  asthmaRule,
  getPatientAllergies,
  hasSevereMilkProteinAllergy,
  isAdult18OrOlder,
  isAdultOrAdolescent,
  isAllergicToDrug,
  isMedDpiDevice,
  isPatientBreastfeeding
} from './helpers';

function getUniqueAllergicCurrentMeds(ctx: Parameters<Rule['when']>[0]): CurrentMed[] {
  const seen = new Set<string>();
  const out: CurrentMed[] = [];
  for (const m of ctx.patient.currentMeds) {
    const id = m.drugId.toLowerCase();
    if (seen.has(id)) continue;
    if (isAllergicToDrug(ctx, m.drugId)) {
      seen.add(id);
      out.push(m);
    }
  }
  return out;
}

function getUniqueLactoseDpiCurrentMeds(ctx: Parameters<Rule['when']>[0]): CurrentMed[] {
  if (!hasSevereMilkProteinAllergy(ctx)) return [];
  const seen = new Set<string>();
  const out: CurrentMed[] = [];
  for (const m of ctx.patient.currentMeds) {
    const id = m.drugId.toLowerCase();
    if (seen.has(id)) continue;
    if (DPI_ONLY_LACTOSE_DRUGS.has(id)) {
      seen.add(id);
      out.push(m);
    }
  }
  return out;
}

const patientAllergyStopRules: Rule[] = [0, 1, 2, 3, 4].map((slotIdx) =>
  asthmaRule({
    id: `asthma.safety.patient_allergy_stop_${slotIdx}`,
    setting: 'both',
    nameVi: `Chống chỉ định tiền sử dị ứng thuốc (#${slotIdx + 1})`, // qa-allow: index - đánh số thứ tự rule dị ứng
    citationIds: ['gina.asthma.2026.never_saba_alone'],
    when: (ctx) => slotIdx < getUniqueAllergicCurrentMeds(ctx).length,
    produce: (ctx): Recommendation | null => {
      const med = getUniqueAllergicCurrentMeds(ctx)[slotIdx];
      if (!med) return null;
      const medLabel = med.name || med.drugId;
      return {
        id: slotIdx === 0 ? 'rec_asthma_drug_allergy_stop' : `rec_asthma_drug_allergy_stop_${slotIdx}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 100, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'STOP',
        drugId: med.drugId,
        dose: undefined,
        title: `NGỪNG KHẨN CẤP ${medLabel}: Chống chỉ định tuyệt đối do tiền sử dị ứng thuốc`,
        rationale: `Hồ sơ bệnh nhân ghi nhận tiền sử dị ứng với ${getPatientAllergies(ctx).join(', ')}, đối khớp trực tiếp với hoạt chất/thành phần của ${medLabel}. Bắt buộc ngừng ngay thuốc gây dị ứng và chuyển sang hoạt chất thay thế không phản ứng chéo.`,
        gates: [asthmaGate('allergy', false, `Tiền sử dị ứng với ${medLabel}`)],
        citationIds: ['gina.asthma.2026.never_saba_alone']
      };
    }
  })
);

const adolescentAdultOnlyStopRules: Rule[] = Array.from(ADULT_18_ONLY_DRUGS).map((adultDrugId) =>
  asthmaRule({
    id: `asthma.safety.adolescent_adult_only_stop_${adultDrugId}`,
    setting: 'both',
    nameVi: `Cảnh báo vượt trần tuổi thanh thiếu niên (< 18 tuổi): ${adultDrugId}`,
    citationIds: ['gina.asthma.2026.foster_age_18', 'gina.asthma.2026.triple_tiotropium_age_limits'],
    when: (ctx) =>
      isAdultOrAdolescent(ctx) &&
      !isAdult18OrOlder(ctx) &&
      ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === adultDrugId),
    produce: (ctx): Recommendation => {
      const age = need(ctx, 'age');
      const minAdult18 = thFor('age', 'asthma.age.min_adult_18');
      const minAdol = thFor('age', 'asthma.age.min_adult_adolescent');
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === adultDrugId);
      const medLabel = med?.name || adultDrugId;
      const isBdpForm = adultDrugId === 'beclometasone_formoterol' || adultDrugId === 'foster';

      return {
        id: `rec_asthma_adolescent_adult_only_${adultDrugId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn tuổi phê duyệt
        action: 'STOP',
        drugId: med?.drugId ?? adultDrugId,
        dose: undefined,
        title: `NGỪNG ${medLabel} ở bệnh nhân ${age} tuổi: Chỉ được phê duyệt cho người lớn ≥ ${minAdult18} tuổi`,
        rationale: isBdpForm
          ? `Theo GINA 2026 (Box 4-8) và nhãn phê duyệt, Beclometasone/formoterol (Foster) chỉ cấp phép cho người lớn ≥ ${minAdult18} tuổi. Ở thanh thiếu niên ${minAdol}–${minAdult18 - 1} tuổi, bắt buộc chuyển sang Budesonide/formoterol (Symbicort, được phê duyệt cho lứa tuổi ≥ ${minAdol} tuổi).` // qa-allow: unit-conversion - cận trên thanh thiếu niên 17 = 18 - 1
          : `Theo GINA 2026 (Box 4-6 / Box 4-10), các bình hít 3 thành phần cố định ICS-LABA-LAMA (Trelegy Ellipta, Trimbow, Enerzair) chỉ cấp phép cho người lớn ≥ ${minAdult18} tuổi. Riêng Budesonide/Glycopyrronium/Formoterol (Breztri) có chỉ định hen từ ≥ ${minAdol} tuổi theo FDA/GINA 2026. Ở thanh thiếu niên ${minAdol}–${minAdult18 - 1} tuổi ở Bậc 5, bắt buộc chuyển về ICS-LABA hợp tuổi (Budesonide/formoterol hoặc Fluticasone/salmeterol) phối hợp bình rời Tiotropium Respimat (phê duyệt ≥ 6 tuổi).`, // qa-allow: unit-conversion - cận trên thanh thiếu niên 17 = 18 - 1
        gates: [asthmaGate('age', false, `Bệnh nhân ${age} tuổi (< ${minAdult18} tuổi)`, age, minAdult18)],
        citationIds: isBdpForm
          ? ['gina.asthma.2026.foster_age_18']
          : ['gina.asthma.2026.triple_tiotropium_age_limits']
      };
    }
  })
);

const milkAllergyDpiOnlyStopRules: Rule[] = [0, 1, 2, 3].map((slotIdx) =>
  asthmaRule({
    id: `asthma.safety.milk_allergy_dpi_stop_${slotIdx}`,
    setting: 'both',
    nameVi: `Chống chỉ định bình bột khô DPI chứa lactose trên nền dị ứng nặng đạm sữa bò (#${slotIdx + 1})`, // qa-allow: index - đánh số thứ tự rule DPI
    citationIds: ['gina.asthma.2026.spacer_no_facemask_eye_protection'],
    when: (ctx) => slotIdx < getUniqueLactoseDpiCurrentMeds(ctx).length,
    produce: (ctx): Recommendation | null => {
      const med = getUniqueLactoseDpiCurrentMeds(ctx)[slotIdx];
      if (!med) return null;
      const medLabel = med.name || med.drugId;
      return {
        id: slotIdx === 0 ? 'rec_asthma_milk_allergy_dpi_contra' : `rec_asthma_milk_allergy_dpi_contra_${slotIdx}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 100, // qa-allow: index - độ ưu tiên chống chỉ định phản vệ
        action: 'STOP',
        drugId: med.drugId,
        dose: undefined,
        title: `NGỪNG KHẨN CẤP ${medLabel}: Chống chỉ định bình hít bột khô (DPI) chứa lactose ở bệnh nhân dị ứng nặng đạm sữa bò`,
        rationale: `${medLabel} chỉ lưu hành dạng bình hít bột khô (Ellipta / Breezhaler / Diskus / HandiHaler) chứa tá dược lactose monohydrate có thể mang vết protein sữa bò gây sốc phản vệ và co thắt phế quản cấp nguy kịch. Bắt buộc đổi sang bình xịt định liều pMDI không chứa lactose (Symbicort Rapihaler pMDI, Foster pMDI, Seretide Evohaler pMDI hoặc Ventolin Evohaler pMDI) dùng kèm buồng đệm.`,
        gates: [asthmaGate('severeMilkProteinAllergy', false, 'Dị ứng nặng đạm sữa bò — chống chỉ định mọi bình bột khô DPI chứa lactose')],
        citationIds: ['gina.asthma.2026.spacer_no_facemask_eye_protection']
      };
    }
  })
);

export const asthmaAgeAndAllergySafetyRules: Rule[] = [
  asthmaRule({
    id: 'asthma.safety.missing_age_fail_closed',
    setting: 'both',
    nameVi: 'Yêu cầu nhập tuổi để xác minh phạm vi người lớn & thanh thiếu niên (≥ 12 tuổi)',
    citationIds: ['gina.asthma.2026.age_12', 'byt.asthma.2020.symptom_control_table_3'],
    when: (ctx) => need(ctx, 'age') === undefined,
    produce: () =>
      missingInputRec(
        'asthma',
        'age',
        'xác minh phạm vi áp dụng phác đồ hen người lớn & thanh thiếu niên (≥ 12 tuổi) trước khi chỉ định liều ICS-formoterol/MART hoặc liều cấp cứu người lớn',
        ['gina.asthma.2026.age_12', 'byt.asthma.2020.symptom_control_table_3']
      )
  }),

  asthmaRule({
    id: 'asthma.safety.age_under_12_guard',
    setting: 'both',
    nameVi: 'Cảnh báo giới hạn độ tuổi (< 12 tuổi)',
    citationIds: ['gina.asthma.2026.age_12', 'byt.asthma.2020.symptom_control_table_3'],
    when: (ctx) => {
      const age = need(ctx, 'age');
      const minAge = thFor('age', 'asthma.age.min_adult_adolescent');
      return age !== undefined && age < minAge;
    },
    produce: (ctx): Recommendation => {
      const age = need(ctx, 'age');
      const minAge = thFor('age', 'asthma.age.min_adult_adolescent');
      return {
        id: 'rec_asthma_age_under_12',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 100, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'CONSIDER',
        title: `Không áp dụng phác đồ người lớn cho bệnh nhi dưới ${minAge} tuổi`,
        rationale: `Bệnh nhân hiện ${age ?? '< 12'} tuổi. Module Hen phế quản GDMT-VN chỉ được thiết kế và thẩm định theo phác đồ GINA 2026 và Bộ Y tế QĐ 1851/2020 dành cho người lớn và thanh thiếu niên ≥ ${minAge} tuổi. Trẻ em từ 6–11 tuổi và ≤ 5 tuổi có bậc điều trị, liều ICS và chọn lựa bình hít riêng biệt. Vui lòng hội chẩn chuyên khoa Nhi Hô hấp.`,
        gates: [asthmaGate('age', false, `Tuổi < ${minAge}`, age, minAge)],
        citationIds: ['gina.asthma.2026.age_12', 'byt.asthma.2020.symptom_control_table_3']
      };
    }
  }),

  ...patientAllergyStopRules,
  ...adolescentAdultOnlyStopRules,
  ...milkAllergyDpiOnlyStopRules,

  asthmaRule({
    id: 'asthma.safety.milk_allergy_pmdi_device_guard',
    setting: 'both',
    nameVi: 'Cảnh báo bắt buộc chọn dạng bào chế pMDI không chứa lactose khi dị ứng nặng đạm sữa bò',
    citationIds: ['gsk.serevent_evohaler.excipients', 'gsk.serevent_accuhaler.excipients', 'gsk.seretide_evohaler.excipients'],
    when: (ctx) => isAdultOrAdolescent(ctx) && hasSevereMilkProteinAllergy(ctx),
    produce: (ctx): Recommendation => {
      const dualDpiMeds = ctx.patient.currentMeds.filter(
        (m) => DUAL_FORMULATION_INHALER_DRUGS.has(m.drugId.toLowerCase()) && isMedDpiDevice(m)
      );
      const hasDualDpi = dualDpiMeds.length > 0;
      const offendingNames = dualDpiMeds.map((m) => m.name || m.drugId).join(', ');
      const unconfirmedSalmeterol = ctx.patient.currentMeds.some(
        (m) => ['salmeterol', 'serevent'].includes(m.drugId.toLowerCase()) &&
          !isMedDpiDevice(m) && !/evohaler|pmdi|\bmdi\b|\bhfa\b/i.test(`${m.name ?? ''} ${m.dose ?? ''}`)
      );

      return {
        id: 'rec_asthma_milk_allergy_pmdi_guard',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên cảnh báo thiết bị phản vệ
        action: 'MONITOR',
        title: hasDualDpi
          ? `ĐỔI NGAY THIẾT BỊ HÍT (${offendingNames}): Cấm dùng bình bột khô DPI chứa lactose trên nền dị ứng nặng đạm sữa bò`
          : unconfirmedSalmeterol
            ? 'XÁC MINH THIẾT BỊ SALMETEROL trước khi dùng/cấp phát: Chỉ dùng pMDI không chứa lactose; tránh Accuhaler/Diskus'
            : 'Dị ứng nặng đạm sữa bò: Bắt buộc kê bình xịt định liều pMDI không chứa lactose (tránh bình bột khô DPI chứa lactose)',
        rationale: hasDualDpi
          ? `Bệnh nhân dị ứng nặng đạm sữa bò nhưng đang dùng thiết bị bột khô (${offendingNames}) chứa tá dược lactose mang vết protein sữa bò, có nguy cơ gây sốc phản vệ đường thở tức thì. Bắt buộc đổi sang đúng dạng bình xịt định liều pMDI đẩy bằng HFA không chứa lactose (Symbicort Rapihaler pMDI, Foster pMDI, Seretide Evohaler pMDI, Flixotide Evohaler pMDI) kết hợp buồng đệm.`
          : 'Phải kiểm tra tên thiết bị và tá dược trước khi dùng/cấp phát. Serevent Accuhaler chứa lactose mang protein sữa; Serevent Evohaler và Seretide Evohaler dùng chất đẩy HFA, không chứa lactose. Không suy ra loại thiết bị chỉ từ tên hoạt chất salmeterol. Chỉ kê dạng pMDI không chứa lactose, dùng qua buồng đệm có ống ngậm miệng.',
        gates: [asthmaGate('severeMilkProteinAllergy', false, 'Bắt buộc dùng thiết bị pMDI không chứa lactose')],
        citationIds: ['gsk.serevent_evohaler.excipients', 'gsk.serevent_accuhaler.excipients', 'gsk.seretide_evohaler.excipients']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.safety.breastfeeding_counseling',
    setting: 'both',
    nameVi: 'Tư vấn an toàn thuốc điều trị hen trong thời kỳ cho con bú (Lactation)',
    citationIds: ['gina.asthma.2026.pregnancy_safety'],
    when: (ctx) => isAdultOrAdolescent(ctx) && isPatientBreastfeeding(ctx),
    produce: (ctx): Recommendation => {
      const cautionNotes: string[] = [];
      for (const m of ctx.patient.currentMeds) {
        const id = m.drugId.toLowerCase();
        if (!LACTATION_CAUTION_ASTHMA_DRUGS.has(id)) continue;
        try {
          const entry = drug(id);
          if (entry.lactation) cautionNotes.push(`${entry.nameVi}: ${entry.lactation}`);
        } catch {
          cautionNotes.push(`${m.name || m.drugId}: Cần theo dõi trẻ bú mẹ.`);
        }
      }
      const extraNote =
        cautionNotes.length > 0 ? ` Thuốc đang dùng cần lưu ý khi cho con bú: ${cautionNotes.join(' · ')}.` : '';

      return {
        id: 'rec_asthma_breastfeeding_safety',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 82, // qa-allow: index - độ ưu tiên tư vấn cho con bú
        action: 'MONITOR',
        title: 'Đang cho con bú: Duy trì bình hít ICS / ICS-formoterol an toàn & lưu ý thuốc toàn thân qua sữa mẹ',
        rationale: `Corticosteroid dạng hít (Budesonide, Beclometasone, Fluticasone) và thuốc giãn phế quản hít bài tiết vào sữa mẹ ở nồng độ cực thấp, an toàn cho trẻ bú mẹ. Nếu phải dùng Prednisolone/Methylprednisolone đường toàn thân liều cao, cân nhắc cho trẻ bú cách xa thời điểm uống thuốc 3–4 giờ; tránh Theophylline do gây kích thích và nhịp nhanh ở trẻ nhũ nhi.${extraNote}`,
        gates: [asthmaGate('breastfeeding', true, 'Đang cho con bú')],
        citationIds: ['gina.asthma.2026.pregnancy_safety']
      };
    }
  })
];
