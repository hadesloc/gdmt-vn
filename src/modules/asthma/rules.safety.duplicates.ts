/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc Chống trùng lặp ICS/LABA & Cảnh báo Quá liều MART
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation, CurrentMed } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  COMBO_ICS_CONTROLLER_DRUGS,
  ICS_CONTAINING_DRUGS,
  LABA_ALL_DRUGS,
  LABA_WITHOUT_ICS_DRUGS,
  MART_ICS_FORMOTEROL_DRUGS,
  MONO_ICS_DRUGS,
  TRIPLE_INHALER_DRUGS,
  asthmaGate,
  asthmaRule,
  getEffectiveDailyMartPuffs,
  getMartMaxDailyPuffs,
  isAdultOrAdolescent,
  isMartOveruse,
  isUsingRapihaler80
} from './helpers';

function getOrderedDuplicateLabaExtras(ctx: Parameters<Rule['when']>[0]): {
  kept?: CurrentMed;
  extras: CurrentMed[];
} {
  const labaMeds = ctx.patient.currentMeds.filter((m) => LABA_ALL_DRUGS.has(m.drugId.toLowerCase()));
  if (labaMeds.length < 2) return { extras: [] }; // qa-allow: index - trùng lặp khi có từ 2 thuốc chứa LABA trở lên

  const rankMed = (m: CurrentMed): number => {
    const id = m.drugId.toLowerCase();
    if (TRIPLE_INHALER_DRUGS.has(id)) return 1; // qa-allow: index - ưu tiên giữ bình 3 thành phần
    if (MART_ICS_FORMOTEROL_DRUGS.has(id)) return 2; // qa-allow: index - ưu tiên giữ bình MART
    if (ICS_CONTAINING_DRUGS.has(id)) return 3; // qa-allow: index - ưu tiên giữ bình ICS-LABA
    return 4; // qa-allow: index - LABA không ICS phải loại bỏ trước
  };

  const sorted = [...labaMeds].sort((a, b) => rankMed(a) - rankMed(b));
  return { kept: sorted[0], extras: sorted.slice(1) };
}

const redundantMonoIcsStopRules: Rule[] = Array.from(MONO_ICS_DRUGS).map((monoIcsId) =>
  asthmaRule({
    id: `asthma.safety.redundant_mono_ics_${monoIcsId}`,
    setting: 'both',
    nameVi: `Ngừng bình ICS đơn chất dư thừa khi đã có bình phối hợp ICS-LABA/Triple (${monoIcsId})`,
    citationIds: ['gina.asthma.2026.track1_step3', 'gina.asthma.2026.step5_lama_triplet'],
    when: (ctx) => {
      const hasThisMono = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === monoIcsId);
      if (!hasThisMono) return false;
      return ctx.patient.currentMeds.some((m) => COMBO_ICS_CONTROLLER_DRUGS.has(m.drugId.toLowerCase()));
    },
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === monoIcsId);
      const comboMed = ctx.patient.currentMeds.find((m) =>
        COMBO_ICS_CONTROLLER_DRUGS.has(m.drugId.toLowerCase())
      );
      const medLabel = med?.name || monoIcsId;
      const comboLabel = comboMed?.name || comboMed?.drugId || 'ICS-LABA';

      return {
        id: `rec_asthma_redundant_mono_ics_${monoIcsId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên chống trùng lặp corticoid hít
        action: 'STOP',
        drugId: med?.drugId ?? monoIcsId,
        dose: undefined,
        title: `NGỪNG bình ICS đơn chất trùng lặp (${medLabel}) vì đã dùng bình phối hợp ${comboLabel}`,
        rationale: `Người bệnh đang dùng đồng thời bình ICS đơn chất (${medLabel}) và bình phối hợp chứa ICS (${comboLabel}), gây chồng liều Corticosteroid hít không cần thiết (nấm họng, khàn tiếng, ức chế trục thượng thận). Cần ngừng bình ICS đơn chất rời và chuẩn độ liều ICS ngay trên một bình phối hợp duy nhất.`,
        gates: [asthmaGate('currentMeds', false, `Trùng lặp ICS đơn chất (${monoIcsId}) với ${comboLabel}`)],
        citationIds: ['gina.asthma.2026.track1_step3', 'gina.asthma.2026.step5_lama_triplet']
      };
    }
  })
);

const duplicateLabaExtraStopRules: Rule[] = [1, 2].map((extraIdx) =>
  asthmaRule({
    id: `asthma.safety.duplicate_laba_extra_stop_${extraIdx}`,
    setting: 'both',
    nameVi: `Ngừng bình chứa LABA trùng lặp thứ ${extraIdx + 2}`, // qa-allow: index - đánh số bình LABA dư thứ 3+
    citationIds: ['gina.asthma.2026.laba_without_ics_contra'],
    when: (ctx) => {
      const { extras } = getOrderedDuplicateLabaExtras(ctx);
      const target = extras[extraIdx];
      if (!target) return false;
      const hasAnyIcs = ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
      if (!hasAnyIcs && LABA_WITHOUT_ICS_DRUGS.has(target.drugId.toLowerCase())) return false;
      return true;
    },
    produce: (ctx): Recommendation | null => {
      const { kept, extras } = getOrderedDuplicateLabaExtras(ctx);
      const target = extras[extraIdx];
      if (!target) return null;
      return {
        id: `rec_asthma_duplicate_laba_stop_extra_${extraIdx}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 97, // qa-allow: index - độ ưu tiên ngừng LABA trùng thứ 3+
        action: 'STOP',
        drugId: target.drugId,
        dose: undefined,
        title: `NGỪNG KHẨN CẤP ${target.name || target.drugId}: Trùng lặp nhiều thuốc giãn phế quản LABA cùng lúc`,
        rationale: `Đơn thuốc hiện có từ 3 thuốc chứa LABA trở lên (đã giữ ${kept?.name || kept?.drugId}). Phối hợp chồng chéo nhiều LABA gây kích thích giao cảm quá mức, nhịp nhanh thất, kéo dài QTc và hạ kali máu nghiêm trọng; bắt buộc ngừng ngay ${target.name || target.drugId}.`,
        gates: [asthmaGate('currentMeds', false, `Trùng lặp LABA (${target.drugId})`)],
        citationIds: ['gina.asthma.2026.laba_without_ics_contra']
      };
    }
  })
);

export const asthmaDuplicateAndOveruseSafetyRules: Rule[] = [
  ...redundantMonoIcsStopRules,

  asthmaRule({
    id: 'asthma.safety.duplicate_laba_guard',
    setting: 'both',
    nameVi: 'Cảnh báo trùng lặp nhiều thuốc giãn phế quản LABA cùng lúc',
    citationIds: ['gina.asthma.2026.laba_without_ics_contra'],
    when: (ctx) => {
      const { extras } = getOrderedDuplicateLabaExtras(ctx);
      if (extras.length === 0) return false;
      const hasAnyIcs = ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
      if (!hasAnyIcs && LABA_WITHOUT_ICS_DRUGS.has(extras[0].drugId.toLowerCase())) return false;
      return true;
    },
    produce: (ctx): Recommendation => {
      const { kept, extras } = getOrderedDuplicateLabaExtras(ctx);
      const firstExtra = extras[0];
      const names = [kept, ...extras]
        .filter((m): m is CurrentMed => Boolean(m))
        .map((m) => m.name || m.drugId)
        .join(' + ');
      return {
        id: 'rec_asthma_duplicate_laba_warning',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 97, // qa-allow: index - độ ưu tiên an toàn
        action: 'AVOID',
        drugId: firstExtra.drugId,
        dose: undefined,
        title: `TRÁNH / NGỪNG phối hợp trùng lặp hai thuốc chứa LABA (${names})`,
        rationale:
          'Bệnh nhân đang có từ 2 bình hít chứa hoạt chất cường beta-2 tác dụng dài (LABA) trở lên. Phối hợp trùng lặp LABA không tăng hiệu quả giãn phế quản nhưng làm tăng mạnh nguy cơ loạn nhịp thất, kéo dài QTc, run cơ và hạ kali máu. Chỉ duy trì duy nhất một bình hít chứa LABA.',
        gates: [asthmaGate('currentMeds', false, `Trùng lặp LABA: ${names}`)],
        citationIds: ['gina.asthma.2026.laba_without_ics_contra']
      };
    }
  }),

  ...duplicateLabaExtraStopRules,

  asthmaRule({
    id: 'asthma.safety.mart_overuse_budesonide_formoterol',
    setting: 'both',
    nameVi: 'Cảnh báo vượt trần liều tối đa hàng ngày Budesonide/formoterol (MART)',
    citationIds: [
      'gina.asthma.2026.formoterol_max_inhalations',
      'gina.asthma.2026.formoterol_max_mcg',
      'gina.asthma.2026.rapihaler_80_225_double_actuations'
    ],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || !isMartOveruse(ctx)) return false;
      const hasFost = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'beclometasone_formoterol');
      const hasBudForm = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'budesonide_formoterol');
      return hasBudForm || !hasFost;
    },
    produce: (ctx): Recommendation => {
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const used = getEffectiveDailyMartPuffs(ctx) ?? 0; // qa-allow: index - fallback hiển thị sau khi isMartOveruse xác nhận
      const maxMcg = thFor('dose_mcg', 'asthma.formoterol.max_metered_mcg');
      const isRap80 = isUsingRapihaler80(ctx);
      return {
        id: 'rec_asthma_mart_overuse',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'HOLD',
        drugId: 'budesonide_formoterol',
        dose: undefined,
        title: `VƯỢT TRẦN AN TOÀN MART (${used}/${maxPuffs} nhát/ngày${isRap80 ? ' Rapihaler 80/2.25 mcg' : ''}): TẠM NGỪNG hít thêm Budesonide/formoterol`,
        rationale: `Người bệnh đã dùng ${used} nhát trong 24 giờ qua, vượt trần an toàn tối đa ${maxPuffs} nhát/ngày${isRap80 ? ' đối với bình xịt Symbicort Rapihaler 80/2.25 mcg' : ' đối với hàm lượng chuẩn 160/4.5 mcg'} (tương đương ${maxMcg} mcg formoterol metered / 54 mcg delivered theo GINA 2026 và BYT QĐ 1851/2020). Tiếp tục hít thêm gây nguy cơ ngộ độc Formoterol cấp (nhịp nhanh thất, kéo dài QTc, hạ kali máu nặng) và phản ánh cơn hen cấp thất bại điều trị ngoại trú.`,
        gates: [asthmaGate('totalDailyPuffsUsed', false, `Đã hít ${used} nhát > trần ${maxPuffs} nhát/ngày`, used, maxPuffs)],
        citationIds: [
          'gina.asthma.2026.formoterol_max_inhalations',
          'gina.asthma.2026.formoterol_max_mcg',
          'gina.asthma.2026.rapihaler_80_225_double_actuations'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.safety.mart_overuse_beclometasone_formoterol',
    setting: 'both',
    nameVi: 'Cảnh báo vượt trần liều tối đa hàng ngày Beclometasone/formoterol (Foster MART)',
    citationIds: [
      'gina.asthma.2026.beclometasone_formoterol_mart_12_puffs',
      'gina.asthma.2026.beclometasone_formoterol_max_72_vs_48'
    ],
    when: (ctx) =>
      isAdultOrAdolescent(ctx) &&
      isMartOveruse(ctx) &&
      ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'beclometasone_formoterol'),
    produce: (ctx): Recommendation => {
      const maxPuffs = thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations');
      const used = getEffectiveDailyMartPuffs(ctx) ?? 0; // qa-allow: index - fallback hiển thị sau khi isMartOveruse xác nhận
      const maxMcg = thFor('dose_mcg', 'asthma.formoterol.max_metered_mcg');
      return {
        id: 'rec_asthma_mart_overuse_foster',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'HOLD',
        drugId: 'beclometasone_formoterol',
        dose: undefined,
        title: `VƯỢT TRẦN AN TOÀN MART (${used}/${maxPuffs} nhát/ngày): TẠM NGỪNG hít thêm Beclometasone/formoterol (Foster)`,
        rationale: `Người bệnh đã hít ${used} nhát Foster 100/6 mcg trong 24 giờ qua, vượt giới hạn tối đa an toàn ${maxPuffs} nhát/ngày (${maxMcg} mcg formoterol metered). Bắt buộc tạm ngừng hít thêm Foster để tránh ngộ độc cường giao cảm cấp (loạn nhịp thất, hạ kali máu) và đánh giá cấp cứu ngay.`,
        gates: [asthmaGate('totalDailyPuffsUsed', false, `Đã hít ${used} nhát > trần ${maxPuffs} nhát/ngày`, used, maxPuffs)],
        citationIds: [
          'gina.asthma.2026.beclometasone_formoterol_mart_12_puffs',
          'gina.asthma.2026.beclometasone_formoterol_max_72_vs_48'
        ]
      };
    }
  }),

  asthmaRule({
    id: 'asthma.safety.mart_overuse_urgent_refer',
    setting: 'both',
    nameVi: 'Chuyển khám cấp cứu khẩn cấp khi vượt trần ICS-formoterol hàng ngày',
    citationIds: ['gina.asthma.2026.formoterol_max_inhalations', 'gina.asthma.2026.formoterol_max_mcg'],
    when: (ctx) => isAdultOrAdolescent(ctx) && isMartOveruse(ctx),
    produce: (ctx): Recommendation => {
      const maxPuffs = getMartMaxDailyPuffs(ctx);
      const used = getEffectiveDailyMartPuffs(ctx) ?? 0; // qa-allow: index - fallback hiển thị sau khi isMartOveruse xác nhận
      return {
        id: 'rec_asthma_mart_overuse_refer',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên cấp cứu
        action: 'REFER',
        title: `CHUYỂN CẤP CỨU NGAY: Đã dùng ${used} nhát ICS-formoterol/24h (nguy cơ cơn hen cấp nặng & ngộ độc Formoterol)`,
        rationale: `Việc phải dùng vượt quá ${maxPuffs} nhát ICS-formoterol/ngày chứng tỏ đường thở đang tắc nghẽn-viêm cấp nặng không đáp ứng điều trị ngoại trú. Cần đưa bệnh nhân đến Khoa Cấp cứu ngay để thở oxy, theo dõi điện tâm đồ/kali máu và dùng Corticosteroid toàn thân.`,
        gates: [asthmaGate('totalDailyPuffsUsed', false, `Vượt trần ${maxPuffs} nhát/ngày`, used, maxPuffs)],
        citationIds: ['gina.asthma.2026.formoterol_max_inhalations', 'gina.asthma.2026.formoterol_max_mcg']
      };
    }
  })
];
