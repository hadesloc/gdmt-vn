import type { Rule } from '../../engine/types';
import { thFor, thr, drug, dose, fmtDose } from '../../kb-types';
import {
  COPD_PROFILES,
  getBloodEos,
  hasConfirmedStableCopd,
  hasConcurrentAsthma,
  hasAnticholinergicContra,
  getLamaWarnings,
  getHepaticTripleWarnings,
  selectTripleInhaler,
  resolveEffectiveInhaler,
  isHighSymptomsConfirmed,
  isGroupEConfirmed,
  isLowExacerbationConfirmed,
  isInappropriateIcsDeEscalationCandidate,
  copdMissingRec,
} from './helpers';

export const copdFollowupStepupBronchRules: Rule[] = [
  {
    id: 'copd.followup.dyspnea_step_up',
    module: 'copd',
    nameVi: 'Theo dõi nhánh khó thở: Nâng từ đơn trị LAMA/LABA lên LABA + LAMA',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama', 'byt.copd.2026.olodaterol_tiotropium_dose'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff !== 'lama_mono' && eff !== 'laba_mono') return false;
      if (!isLowExacerbationConfirmed(ctx)) return false;
      return isHighSymptomsConfirmed(ctx);
    },
    produce: (ctx) => {
      const d = drug('tiotropium_olodaterol');
      const startDoseText = fmtDose(dose('tiotropium_olodaterol', 'start'));
      const mmrcCut = thFor('mmrc', 'copd.mmrc_high');
      const catCut = thFor('cat', 'copd.cat_high');
      return {
        id: 'rec_copd_followup_dyspnea_step_up',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'SWITCH',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: 'Nâng bậc lên LABA + LAMA do khó thở dai dẳng trên đơn trị liệu',
        rationale: `Bệnh nhân đang dùng đơn trị liệu LAMA hoặc LABA nhưng vẫn còn khó thở dai dẳng (mMRC ≥ ${mmrcCut} hoặc CAT ≥ ${catCut}): Khuyến cáo kiểm tra kỹ thuật hít và nâng bậc chuyển sang phối hợp đôi LABA + LAMA.`,
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: ['gold.copd.2026.followup_dyspnea_laba_lama', 'byt.copd.2026.olodaterol_tiotropium_dose'],
        priority: 75,
      };
    },
  },

  {
    id: 'copd.followup.lama_contra_dyspnea_stepup',
    module: 'copd',
    nameVi: 'Theo dõi khó thở khi chống chỉ định LAMA (glôcôm góc đóng / bí tiểu)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_dyspnea_switch_device',
      'gold.copd.2026.dyspnea_ensifentrine',
      'gold.copd.2026.lama_glaucoma_caution',
      'gold.copd.2026.pulmonary_rehab_essential',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (!hasAnticholinergicContra(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff !== 'laba_mono' && eff !== 'ics_laba') return false;
      return isHighSymptomsConfirmed(ctx);
    },
    produce: (ctx) => {
      const eff = resolveEffectiveInhaler(ctx);
      const isAlreadyOnIcsLaba = eff === 'ics_laba';
      return {
        id: 'rec_copd_lama_contra_dyspnea_rehab',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'MONITOR',
        title:
          'Khó thở dai dẳng khi chống chỉ định LAMA: Tối ưu kỹ thuật bình hít, phục hồi chức năng hô hấp & tầm soát căn nguyên ngoài COPD',
        rationale: isAlreadyOnIcsLaba
          ? 'Người bệnh đang dùng phối hợp ICS + LABA nhưng có chống chỉ định kháng muscarinic (glôcôm góc đóng / bí tiểu) nên không thể phối hợp thêm LAMA. Cần kiểm tra kỹ thuật sử dụng bình hít, chuyển sang pMDI + buồng đệm nếu lực hít yếu, chỉ định phục hồi chức năng hô hấp tích cực và tầm soát suy tim, tăng áp phổi, bệnh mạch vành hoặc thiếu máu.'
          : 'Người bệnh đang dùng LABA đơn trị và có chống chỉ định kháng muscarinic (glôcôm góc đóng / bí tiểu) nên không thể phối hợp thêm LAMA; đồng thời theo GOLD 2026 không bổ sung ICS chỉ vì khó thở đơn thuần khi không có chỉ định đợt cấp tăng BCAT. Cần kiểm tra kỹ thuật sử dụng bình hít, chuyển sang SMI/pMDI + buồng đệm nếu lực hít yếu, chỉ định phục hồi chức năng hô hấp tích cực và tầm soát căn nguyên khó thở ngoài COPD.',
        profileDiff: {
          INTL: 'GOLD 2026 khuyến cáo xem xét bổ sung khí dung Ensifentrine (ức chế kép PDE3/PDE4) nếu sẵn có khi còn khó thở dai dẳng.',
          VN: 'Ensifentrine chưa được cấp phép lưu hành và chưa có trong BYT QĐ 2131/2026 tại Việt Nam; tập trung tối ưu hóa thiết bị hít, phục hồi chức năng hô hấp và điều trị bệnh đồng mắc.',
          US: 'FDA phê duyệt khí dung Ohtuvayre (ensifentrine) như liệu pháp duy trì bổ trợ giảm khó thở ở người lớn mắc COPD.',
        },
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_dyspnea_switch_device',
          'gold.copd.2026.dyspnea_ensifentrine',
          'gold.copd.2026.lama_glaucoma_caution',
          'gold.copd.2026.pulmonary_rehab_essential',
        ],
        priority: 69,
      };
    },
  },

  {
    id: 'copd.followup.dyspnea_on_laba_lama',
    module: 'copd',
    nameVi: 'Theo dõi nhánh khó thở: Khó thở dai dẳng trên LABA + LAMA hoặc Bộ ba ICS + LAMA + LABA',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_dyspnea_switch_device',
      'gold.copd.2026.dyspnea_ensifentrine',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (!isHighSymptomsConfirmed(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff === 'laba_lama') {
        return isLowExacerbationConfirmed(ctx);
      }
      if (eff === 'triple') {
        if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return false;
        if (isInappropriateIcsDeEscalationCandidate(ctx)) return false;
        return isLowExacerbationConfirmed(ctx) || isGroupEConfirmed(ctx);
      }
      return false;
    },
    produce: (ctx) => {
      const eff = resolveEffectiveInhaler(ctx);
      const baseLabel = eff === 'triple' ? 'phác đồ ba thuốc (ICS + LAMA + LABA)' : 'LABA + LAMA';
      return {
        id: 'rec_copd_dyspnea_switch_device_rehab',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 3,
        action: 'MONITOR',
        title: `Khó thở dai dẳng trên ${baseLabel}: Rà soát kỹ thuật/thiết bị hít, phục hồi chức năng hô hấp và tầm soát nguyên nhân ngoài COPD`,
        rationale:
          eff === 'triple'
            ? 'Theo GOLD 2026 (lưu đồ theo dõi khó thở): Khi người bệnh vẫn còn khó thở dai dẳng dù đã dùng đủ ba thành phần ICS + LAMA + LABA, cần kiểm tra trực tiếp kỹ thuật hít và lưu lượng đỉnh hít vào, cân nhắc đổi dụng cụ hít (từ DPI sang SMI/pMDI + buồng đệm nếu lực hít yếu) hoặc đổi phân tử hoạt chất, đẩy mạnh phục hồi chức năng hô hấp, xem xét khí dung Ensifentrine (nếu sẵn có) và bắt buộc tầm soát các nguyên nhân gây khó thở ngoài COPD (suy tim, bệnh mạch vành, tăng áp phổi, thiếu máu, thuyên tắc phổi).'
            : 'Theo GOLD 2026 (lưu đồ theo dõi khó thở): Không thêm ICS chỉ vì triệu chứng khó thở đơn thuần. Khi phối hợp đôi LABA + LAMA chưa cải thiện đủ triệu chứng, cần kiểm tra kỹ thuật hít/tuân thủ, cân nhắc đổi loại bình hít (ví dụ từ DPI sang SMI Respimat nếu lưu lượng hít yếu) hoặc đổi phân tử hoạt chất, xem xét bổ sung khí dung Ensifentrine (nếu sẵn có), chỉ định phục hồi chức năng hô hấp và tầm soát nguyên nhân khó thở ngoài COPD (suy tim, tăng áp phổi, thiếu máu).',
        profileDiff: {
          INTL: 'GOLD 2026 bổ sung lựa chọn xem xét khí dung Ensifentrine (ức chế kép PDE3/PDE4) nếu sẵn có cho khó thở dai dẳng.',
          VN: 'Ensifentrine hiện chưa lưu hành và chưa có trong hướng dẫn BYT QĐ 2131/2026 tại Việt Nam; ưu tiên đổi dụng cụ hít phù hợp, phục hồi chức năng hô hấp và xử trí bệnh đồng mắc tim mạch.',
          US: 'FDA phê duyệt khí dung Ohtuvayre (ensifentrine 3 mg x 2 lần/ngày) giúp cải thiện chức năng phổi và giảm khó thở trên nền giãn phế quản.',
        },
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_dyspnea_switch_device',
          'gold.copd.2026.dyspnea_ensifentrine',
        ],
        priority: 68,
      };
    },
  },

  {
    id: 'copd.followup.exac_eos_required',
    module: 'copd',
    nameVi: 'Yêu cầu Bạch cầu ái toan máu (Blood Eosinophils) để quyết định thêm/rút ICS khi theo dõi',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.followup_exac_eos_100_300', 'byt.copd.2026.triple_therapy_indication'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return false;
      if (getBloodEos(ctx) !== undefined) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff === 'none') return false;
      if (eff === 'ics_laba' && isHighSymptomsConfirmed(ctx)) return true;
      return (
        isGroupEConfirmed(ctx) &&
        (eff === 'lama_mono' || eff === 'laba_mono' || eff === 'laba_lama' || eff === 'ics_laba')
      );
    },
    produce: () =>
      copdMissingRec(
        'bloodEos',
        'Số lượng Bạch cầu ái toan máu ngoại vi (Blood Eosinophils – tế bào/µL)',
        `quyết định thêm ICS lên phác đồ ba thuốc (ngưỡng BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_low')} hoặc ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} tế bào/µL) hay chuyển về LABA + LAMA`,
        thr('copd.eosinophils_low').citationIds
      ),
  },

  {
    id: 'copd.followup.mono_exac_step_up_laba_lama',
    module: 'copd',
    nameVi: 'Theo dõi nhánh đợt cấp: Nâng từ đơn trị lên LABA + LAMA (BCAT < 300 /µL hoặc tiền sử viêm phổi)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_dyspnea_laba_lama',
      'gold.copd.2026.initial_group_e',
      'byt.copd.2026.olodaterol_tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff !== 'lama_mono' && eff !== 'laba_mono') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      const eos = getBloodEos(ctx);
      if (eos === undefined) return false;
      const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
      return priorPneum || eos < thFor('bloodEos', 'copd.eosinophils_high');
    },
    produce: (ctx) => {
      const d = drug('tiotropium_olodaterol');
      const startDoseText = fmtDose(dose('tiotropium_olodaterol', 'start'));
      const eos = getBloodEos(ctx)!;
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
      const reasonDetail = priorPneum
        ? 'có tiền sử viêm phổi tái diễn cần tránh thêm ICS'
        : `BCAT máu ${eos} < ${eosHigh} tế bào/µL`;
      return {
        id: 'rec_copd_mono_exac_laba_lama',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'SWITCH',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Nâng bậc từ đơn trị liệu lên phối hợp đôi LABA + LAMA do xuất hiện đợt cấp (${reasonDetail})`,
        rationale: `Bệnh nhân đang dùng đơn trị liệu LAMA hoặc LABA xuất hiện đợt cấp (${reasonDetail}): Theo lưu đồ theo dõi GOLD 2026, khuyến cáo nâng bậc lên phối hợp 2 thuốc giãn phế quản tác dụng kéo dài LABA + LAMA.`,
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_dyspnea_laba_lama',
          'gold.copd.2026.initial_group_e',
          'byt.copd.2026.olodaterol_tiotropium_dose',
        ],
        priority: 80,
      };
    },
  },

  {
    id: 'copd.followup.mono_exac_step_up_triple',
    module: 'copd',
    nameVi: 'Theo dõi nhánh đợt cấp: Nâng từ đơn trị lên phác đồ ba thuốc khi BCAT ≥ 300 /µL',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.initial_group_e_triple_eos300',
      'byt.copd.2026.triple_therapy_indication',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff !== 'lama_mono' && eff !== 'laba_mono') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      const eos = getBloodEos(ctx);
      return eos !== undefined && eos >= thFor('bloodEos', 'copd.eosinophils_high');
    },
    produce: (ctx) => {
      const tripleId = selectTripleInhaler(ctx);
      const d = drug(tripleId);
      const startDoseText = fmtDose(dose(tripleId, 'start'));
      const eos = getBloodEos(ctx)!;
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      return {
        id: 'rec_copd_mono_exac_triple',
        module: 'copd',
        tier: 'Theo dõi & Chuẩn độ',
        tierOrder: 2,
        action: 'SWITCH',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDoseText,
        title: `Nâng từ đơn trị lên phác đồ ba thuốc (${d.nameVi}) khi BCAT ${eos} ≥ ${eosHigh} /µL`,
        rationale: `Bệnh nhân đang dùng đơn trị liệu LAMA hoặc LABA xuất hiện đợt cấp kèm BCAT máu ${eos} ≥ ${eosHigh} tế bào/µL: Theo GOLD 2026, khuyến cáo nâng thẳng lên liệu pháp ba thuốc trong một dụng cụ hít phù hợp (ICS + LAMA + LABA) để ngăn ngừa tối đa đợt cấp tái phát.`,
        warnings: [...getLamaWarnings(ctx, tripleId), ...getHepaticTripleWarnings(ctx, tripleId)],
        gates: [],
        citationIds: [
          'gold.copd.2026.initial_group_e_triple_eos300',
          'byt.copd.2026.triple_therapy_indication',
        ],
        priority: 85,
      };
    },
  },
];
