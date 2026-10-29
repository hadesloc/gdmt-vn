import type { Rule, RuleContext } from '../../engine/types';
import { drug, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  SAMA_CONTAINING_IDS,
  getInhalerProfile,
  findAllCurrentMedsInSet,
  hasConfirmedCopdSpirometry,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  hasConcurrentAsthma,
  hasAnticholinergicContra,
  getPlannedCopdInhalerChangeDrugId,
  getDuplicateBaselineInhalersToStop,
  getSupersededInhalersToStop,
} from './helpers';

function makeDuplicateInhalerStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.duplicate_inhaler_stop'
        : `copd.safety.duplicate_inhaler_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Cảnh báo trùng lặp bình hít duy trì: Ngừng bình hít dư thừa cùng nhóm dược lý',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gold.copd.2026.initial_group_b'],
    when: (ctx) => getDuplicateBaselineInhalersToStop(ctx).length > slotIndex,
    produce: (ctx) => {
      const item = getDuplicateBaselineInhalersToStop(ctx)[slotIndex]!;
      const medName = item.med.name || (hasDrug(item.med.drugId) ? drug(item.med.drugId).nameVi : item.med.drugId);
      const compLabel =
        item.duplicateComponent === 'lama'
          ? 'LAMA'
          : item.duplicateComponent === 'laba'
            ? 'LABA'
            : 'ICS';
      const recId =
        slotIndex === 0
          ? item.duplicateComponent === 'lama'
            ? 'rec_copd_stop_duplicate_lama'
            : item.duplicateComponent === 'laba'
              ? 'rec_copd_stop_duplicate_laba'
              : 'rec_copd_stop_duplicate_ics'
          : `rec_copd_stop_duplicate_${item.duplicateComponent}_${slotIndex}`;

      return {
        id: recId,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: item.med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG ${medName} do trùng lặp nhiều bình hít cùng chứa thành phần ${compLabel}`,
        rationale:
          item.duplicateComponent === 'lama'
            ? 'Phối hợp đồng thời hai thuốc kháng muscarinic tác dụng kéo dài (LAMA) không làm tăng hiệu quả giãn phế quản nhưng làm tăng mạnh độc tính kháng cholinergic (bí tiểu cấp trên nền phì đại tiền liệt tuyến, khởi phát tăng nhãn áp góc đóng cấp, khô miệng nặng và loạn nhịp nhanh).'
            : item.duplicateComponent === 'laba'
              ? 'Dùng đồng thời hai thuốc cường beta-2 tác dụng kéo dài (LABA) gây quá liều giao cảm, tăng nguy cơ nhịp nhanh xoang, ngoại tâm thu thất, hạ kali máu và run cơ mà không tăng hiệu quả lâm sàng.'
              : 'Dùng song song hai bình hít chứa corticosteroid (ICS) gây quá liều steroid tại chỗ và toàn thân, làm tăng mạnh nguy cơ viêm phổi nặng và nhiễm nấm hầu họng.',
        gates: [],
        citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gold.copd.2026.initial_group_b'],
        priority: 99,
      };
    },
  };
}

function makeStopSupersededInhalerRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.stop_superseded_inhaler'
        : `copd.safety.stop_superseded_inhaler_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng bình hít duy trì cũ khi chuyển đổi nâng/hạ bậc sang bình hít phối hợp mới',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama', 'gold.copd.2026.lama_glaucoma_caution'],
    when: (ctx) => getSupersededInhalersToStop(ctx).length > slotIndex,
    produce: (ctx) => {
      const sup = getSupersededInhalersToStop(ctx)[slotIndex]!;
      const oldName = sup.med.name || (hasDrug(sup.med.drugId) ? drug(sup.med.drugId).nameVi : sup.med.drugId);
      const newDrug = drug(sup.targetDrugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_superseded_inhaler'
            : `rec_copd_stop_superseded_inhaler_${slotIndex}`,
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'STOP',
        drugId: sup.med.drugId,
        drugNameVi: oldName,
        dose: undefined,
        title: `Ngừng bình hít cũ (${oldName}) khi chuyển sang ${newDrug.nameVi}`,
        rationale: `Khi nâng bậc hoặc chuyển đổi phác đồ sang ${newDrug.nameVi}, bắt buộc hướng dẫn người bệnh ngừng hẳn bình hít ${oldName} cũ để tránh dùng song song gây trùng lặp hoạt chất LAMA/LABA/ICS.`,
        gates: [],
        citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama', 'gold.copd.2026.lama_glaucoma_caution'],
        priority: 74,
      };
    },
  };
}

function getActiveLamaMedsToStopForContra(ctx: RuleContext) {
  if (!hasAnticholinergicContra(ctx)) return [];
  return ctx.normalized.currentMeds.filter((m) => Boolean(getInhalerProfile(m.drugId)?.lama));
}

function makeLamaContraStopRule(slotIndex: number): Rule {
  return {
    id: slotIndex === 0 ? 'copd.safety.lama_contra_stop' : `copd.safety.lama_contra_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng thuốc kháng muscarinic (LAMA) khi có glôcôm góc đóng hoặc bí tiểu cấp',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
    when: (ctx) => getActiveLamaMedsToStopForContra(ctx).length > slotIndex,
    produce: (ctx) => {
      const med = getActiveLamaMedsToStopForContra(ctx)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      return {
        id: slotIndex === 0 ? 'rec_copd_stop_lama_contra' : `rec_copd_stop_lama_contra_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG ${medName} do chống chỉ định kháng cholinergic (glôcôm góc đóng / bí tiểu)`,
        rationale:
          'Thuốc kháng muscarinic tác dụng kéo dài (LAMA) có thể khởi phát cơn tăng nhãn áp góc đóng cấp hoặc làm trầm trọng bí tiểu cấp trên nền tắc nghẽn cổ bàng quang. Cần ngừng bình hít chứa LAMA và chuyển sang phác đồ giãn phế quản không kháng cholinergic.',
        gates: [],
        citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
        priority: 99,
      };
    },
  };
}

function getSamaMedsToStopOnLamaOrContra(ctx: RuleContext) {
  if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return [];
  const samaMeds = findAllCurrentMedsInSet(ctx, SAMA_CONTAINING_IDS);
  if (samaMeds.length === 0) return [];
  const hasActiveOrPlannedLama =
    ctx.normalized.currentMeds.some((m) => Boolean(getInhalerProfile(m.drugId)?.lama)) ||
    Boolean(getInhalerProfile(getPlannedCopdInhalerChangeDrugId(ctx))?.lama);
  return hasActiveOrPlannedLama || hasAnticholinergicContra(ctx) ? samaMeds : [];
}

function makeSamaOnLamaStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.sama_on_lama_stop'
        : `copd.safety.sama_on_lama_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng phối hợp thường quy chế phẩm chứa SAMA (Ipratropium / Berodual / Combivent) trên nền LAMA hoặc chống chỉ định',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
    when: (ctx) => getSamaMedsToStopOnLamaOrContra(ctx).length > slotIndex,
    produce: (ctx) => {
      const samaMed = getSamaMedsToStopOnLamaOrContra(ctx)[slotIndex]!;
      const medName =
        samaMed.name || (hasDrug(samaMed.drugId) ? drug(samaMed.drugId).nameVi : samaMed.drugId);
      const isContra = hasAnticholinergicContra(ctx);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_sama_on_lama'
            : `rec_copd_stop_sama_on_lama_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: samaMed.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: isContra
          ? `NGỪNG ${medName} (chứa SAMA Ipratropium) do chống chỉ định kháng cholinergic (glôcôm góc đóng / bí tiểu)`
          : `NGỪNG ${medName} (chứa SAMA Ipratropium) dùng song song với LAMA duy trì để tránh quá liều kháng cholinergic`,
        rationale: isContra
          ? 'Chế phẩm chứa kháng muscarinic tác dụng ngắn (Ipratropium đơn chất hoặc phối hợp SABA+SAMA như Berodual/Combivent) có nguy cơ khởi phát glôcôm góc đóng cấp hoặc bí tiểu cấp; chỉ dùng SABA đơn thuần (Salbutamol/Fenoterol) để cắt cơn.'
          : 'Không phối hợp thường quy chế phẩm chứa kháng muscarinic tác dụng ngắn (Ipratropium đơn chất hoặc phối hợp SABA+SAMA như Berodual/Combivent) trên nền người bệnh đang duy trì LAMA ngoài đợt cấp vì cạnh tranh cùng thụ thể muscarinic M3, không tăng thêm hiệu quả giãn phế quản nhưng làm tăng mạnh nguy cơ bí tiểu cấp, glôcôm góc đóng, khô miệng và nhịp nhanh; chuyển thuốc cắt cơn khi cần về SABA đơn thuần.',
        gates: [],
        citationIds: ['gold.copd.2026.lama_glaucoma_caution', 'gina.copd.2026.lama_urinary_retention'],
        priority: 98,
      };
    },
  };
}

export const copdSafetyInhalerStopRules: Rule[] = [
  {
    id: 'copd.safety.ics_monotherapy_stop',
    module: 'copd',
    nameVi: 'Cảnh báo an toàn: Ngừng đơn trị liệu ICS trong COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.no_ics_monotherapy', 'gold.copd.2026.followup_eos_less_100_pneumonia'],
    when: (ctx) => {
      if (!hasConfirmedCopdSpirometry(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      const hasIcsMono = ctx.normalized.currentMeds.some((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.ics && !p.lama && !p.laba);
      });
      const hasAnyLaba = ctx.normalized.currentMeds.some((m) => Boolean(getInhalerProfile(m.drugId)?.laba));
      return hasIcsMono && !hasAnyLaba;
    },
    produce: (ctx) => {
      const icsMed = ctx.normalized.currentMeds.find((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.ics && !p.lama && !p.laba);
      })!;
      const drugName = icsMed.name || icsMed.drugId;
      return {
        id: 'rec_copd_stop_ics_monotherapy',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: icsMed.drugId,
        drugNameVi: `${drugName} (ICS đơn trị)`,
        dose: undefined,
        title: `NGỪNG đơn trị liệu ICS (${drugName}) – Không có chỉ định đơn độc trong COPD`,
        rationale:
          'Theo GOLD 2026, điều trị duy trì bằng corticosteroid hít (ICS) đơn độc trong COPD không làm chậm tốc độ suy giảm FEV₁ dài hạn, không giảm tỷ lệ tử vong nhưng làm tăng đáng kể nguy cơ viêm phổi, nhiễm nấm hầu họng và lao phổi. Cần ngừng ICS đơn độc và chuyển sang thuốc giãn phế quản tác dụng kéo dài phù hợp theo phân nhóm.',
        gates: [],
        citationIds: ['gold.copd.2026.no_ics_monotherapy', 'gold.copd.2026.followup_eos_less_100_pneumonia'],
        priority: 99,
      };
    },
  },

  makeDuplicateInhalerStopRule(0),
  makeDuplicateInhalerStopRule(1), // qa-allow: index - khe dừng bình hít trùng lặp thứ 2
  makeDuplicateInhalerStopRule(2), // qa-allow: index - khe dừng bình hít trùng lặp thứ 3
  makeDuplicateInhalerStopRule(3), // qa-allow: index - khe dừng bình hít trùng lặp thứ 4

  makeStopSupersededInhalerRule(0),
  makeStopSupersededInhalerRule(1), // qa-allow: index - khe dừng bình hít cũ thứ 2 khi đổi phác đồ mở
  makeStopSupersededInhalerRule(2), // qa-allow: index - khe dừng bình hít cũ thứ 3 khi đổi phác đồ mở
  makeStopSupersededInhalerRule(3), // qa-allow: index - khe dừng bình hít cũ thứ 4 khi đổi phác đồ mở

  makeSamaOnLamaStopRule(0),
  makeSamaOnLamaStopRule(1), // qa-allow: index - khe dừng SAMA thứ 2
  makeSamaOnLamaStopRule(2), // qa-allow: index - khe dừng SAMA thứ 3
  makeSamaOnLamaStopRule(3), // qa-allow: index - khe dừng SAMA thứ 4

  makeLamaContraStopRule(0),
  makeLamaContraStopRule(1), // qa-allow: index - khe dừng thuốc LAMA thứ 2 khi chống chỉ định
  makeLamaContraStopRule(2), // qa-allow: index - khe dừng thuốc LAMA thứ 3 khi chống chỉ định
  makeLamaContraStopRule(3), // qa-allow: index - khe dừng thuốc LAMA thứ 4 khi chống chỉ định
];
