import type { Rule } from '../../engine/types';
import { thFor, thr, drug, dose, fmtDose } from '../../kb-types';
import {
  COPD_PROFILES,
  formatCopdTiotropiumDose,
  getBloodEos,
  hasConfirmedStableCopd,
  hasConcurrentAsthma,
  hasAnticholinergicContra,
  hasWeakInspiratoryFlow,
  hasMilkProteinAllergy,
  getLamaWarnings,
  getHepaticTripleWarnings,
  getAsthmaPrescribedIcsLabaId,
  getAsthmaPrescribedMonoIcsId,
  selectTripleInhaler,
  resolveEffectiveInhaler,
  isHighSymptomsConfirmed,
  isLowSymptomsConfirmed,
  isGroupEConfirmed,
  isLowExacerbationConfirmed,
  copdMissingRec,
} from './helpers';
import { copdDiagnosisRules } from './rules.diagnosis';

export const copdInitialTherapyRules: Rule[] = [
  {
    id: 'copd.initial.aco_asthma_overlap',
    module: 'copd',
    nameVi: 'Đồng mắc COPD – Hen phế quản: Bắt buộc phác đồ nền có ICS',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.concurrent_asthma',
      'gold.copd.2026.initial_group_e_triple_eos300',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      return hasConcurrentAsthma(ctx) && resolveEffectiveInhaler(ctx) === 'none';
    },
    produce: (ctx) => {
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
      if (asthmaMonoIcsId) {
        const dDual = drug('tiotropium_olodaterol');
        const monoIcsName = drug(asthmaMonoIcsId).nameVi;
        return {
          id: 'rec_copd_aco_add_laba_lama',
          module: 'copd',
          tier: 'Thuốc nền tảng (Đồng mắc Hen – COPD)',
          tierOrder: 1,
          action: 'START',
          drugId: dDual.id,
          drugNameVi: dDual.nameVi,
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          title: `Đồng mắc COPD – Hen (GINA Track 2 Bậc 1–2): Phối hợp LABA + LAMA (${dDual.nameVi}) trên nền ICS đơn chất (${monoIcsName})`,
          rationale: `Phân hệ Hen đang chỉ định ICS đơn chất (${monoIcsName}) ở Track 2 Bậc 1–2. Để kiểm soát giới hạn luồng khí COPD tối ưu mà không gây trùng lặp hai bình chứa ICS, phối hợp thêm bình giãn phế quản kép LABA + LAMA (${dDual.nameVi}) tạo thành phác đồ bộ ba mở (ICS + LABA + LAMA) an toàn.`,
          warnings: getLamaWarnings(ctx, dDual.id),
          gates: [],
          citationIds: [
            'gold.copd.2026.concurrent_asthma',
            'byt.copd.2026.olodaterol_tiotropium_dose',
          ],
          priority: 92,
        };
      }

      const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx);
      if (asthmaIcsLabaId) {
        const dLama = drug('tiotropium');
        const asthmaControllerName = drug(asthmaIcsLabaId).nameVi;
        return {
          id: 'rec_copd_aco_add_lama',
          module: 'copd',
          tier: 'Thuốc nền tảng (Đồng mắc Hen – COPD)',
          tierOrder: 1,
          action: 'START',
          drugId: dLama.id,
          drugNameVi: dLama.nameVi,
          dose: formatCopdTiotropiumDose(avoidDpi),
          title: `Đồng mắc COPD – Hen: Bổ sung LAMA (${dLama.nameVi}) phối hợp trên nền ICS+LABA (${asthmaControllerName}) của phác đồ Hen`,
          rationale: `Người bệnh đồng thời kích hoạt phân hệ Hen phế quản (đã có chỉ định nền ICS+LABA bằng ${asthmaControllerName}). Để tối ưu giãn phế quản cho COPD mà tránh trùng lặp hai bình chứa ICS/LABA, bổ sung thêm LAMA đơn chất (${dLama.nameVi}) tạo thành phác đồ bộ ba mở (ICS + LABA + LAMA) an toàn.`,
          warnings: getLamaWarnings(ctx, dLama.id),
          gates: [],
          citationIds: ['gold.copd.2026.concurrent_asthma', 'byt.copd.2026.tiotropium_dose'],
          priority: 92,
        };
      }

      const tripleId = selectTripleInhaler(ctx);
      const d = drug(tripleId);
      const startDose = fmtDose(dose(tripleId, 'start'));
      return {
        id: 'rec_copd_aco_triple',
        module: 'copd',
        tier: 'Thuốc nền tảng (Đồng mắc Hen – COPD)',
        tierOrder: 1,
        action: 'START',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDose,
        title: `Đồng mắc COPD – Hen phế quản: Khởi trị phác đồ có chứa ICS (${d.nameVi})`,
        rationale:
          'GOLD 2026 quy định nếu bệnh nhân COPD có đồng mắc hoặc tiền sử Hen phế quản, việc điều trị phải tuân theo phác đồ Hen và BẮT BUỘC phải bao gồm thành phần corticosteroid hít (ICS); tuyệt đối tránh dùng LABA/LAMA đơn thuần không kèm ICS do nguy cơ đợt cấp nặng và tử vong.',
        warnings: [...getLamaWarnings(ctx, tripleId), ...getHepaticTripleWarnings(ctx, tripleId)],
        gates: [],
        citationIds: [
          'gold.copd.2026.concurrent_asthma',
          'byt.copd.2026.triple_therapy_indication',
        ],
        priority: 92,
      };
    },
  },

  {
    id: 'copd.initial.group_a',
    module: 'copd',
    nameVi: 'Khởi trị COPD Nhóm A: Một thuốc giãn phế quản (ưu tiên LAMA)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.initial_group_a', 'byt.copd.2026.tiotropium_dose'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'none') return false;
      return isLowExacerbationConfirmed(ctx) && isLowSymptomsConfirmed(ctx);
    },
    produce: (ctx) => {
      const d = drug('tiotropium');
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const startDose = formatCopdTiotropiumDose(avoidDpi);
      return {
        id: 'rec_copd_init_group_a',
        module: 'copd',
        tier: 'Thuốc nền tảng (Nhóm A)',
        tierOrder: 1,
        action: 'START',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDose,
        title: `Khởi trị COPD Nhóm A: Thuốc giãn phế quản tác dụng kéo dài (${d.nameVi})`,
        rationale:
          'Bệnh nhân COPD Nhóm A (ít triệu chứng mMRC 0–1 & CAT < 10, không có đợt cấp trong năm): Khởi đầu bằng một thuốc giãn phế quản; ưu tiên nhóm tác dụng kéo dài LAMA (hoặc LABA) hơn thuốc tác dụng ngắn để kiểm soát khó thở bền vững.',
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: ['gold.copd.2026.initial_group_a', 'byt.copd.2026.tiotropium_dose'],
        priority: 80,
      };
    },
  },

  {
    id: 'copd.initial.group_b',
    module: 'copd',
    nameVi: 'Khởi trị COPD Nhóm B: Phối hợp đôi LABA + LAMA',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.initial_group_b',
      'byt.copd.2026.abe_groups',
      'byt.copd.2026.olodaterol_tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'none') return false;
      return isLowExacerbationConfirmed(ctx) && isHighSymptomsConfirmed(ctx);
    },
    produce: (ctx) => {
      const d = drug('tiotropium_olodaterol');
      const startDose = fmtDose(dose('tiotropium_olodaterol', 'start'));
      return {
        id: 'rec_copd_init_group_b',
        module: 'copd',
        tier: 'Thuốc nền tảng (Nhóm B)',
        tierOrder: 1,
        action: 'START',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDose,
        title: `Khởi trị COPD Nhóm B: Phối hợp đôi LABA + LAMA (${d.nameVi})`,
        rationale:
          'Bệnh nhân COPD Nhóm B (nhiều triệu chứng khó thở mMRC ≥ 2 hoặc CAT ≥ 10, nguy cơ đợt cấp thấp): Phối hợp đôi LABA + LAMA trong cùng một bình hít cải thiện FEV₁ và giảm triệu chứng vượt trội so với đơn trị liệu mà không tăng tác dụng phụ.',
        profileDiff: {
          INTL: 'GOLD 2026 khuyến cáo khởi đầu ngay phối hợp LABA + LAMA cho tất cả bệnh nhân Nhóm B.',
          VN: 'BYT QĐ 2131/2026 ưu tiên khởi đầu LABA + LAMA; chỉ tại trạm y tế xã/phường chưa sẵn thuốc phối hợp mới tạm dùng đơn trị LAMA hoặc LABA.',
          US: 'GOLD 2026 khuyến cáo khởi đầu phối hợp đôi LABA + LAMA (ưu tiên bình hít đơn).',
        },
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: [
          'gold.copd.2026.initial_group_b',
          'byt.copd.2026.abe_groups',
          'byt.copd.2026.olodaterol_tiotropium_dose',
        ],
        priority: 85,
      };
    },
  },

  {
    id: 'copd.initial.group_e_eos_required',
    module: 'copd',
    nameVi: 'Yêu cầu xét nghiệm Bạch cầu ái toan máu (Blood Eosinophils) ở Nhóm E',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.initial_group_e_triple_eos300', 'byt.copd.2026.triple_therapy_indication'],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'none') return false;
      return isGroupEConfirmed(ctx) && getBloodEos(ctx) === undefined;
    },
    produce: () =>
      copdMissingRec(
        'bloodEos',
        'Số lượng Bạch cầu ái toan máu ngoại vi (Blood Eosinophils – tế bào/µL)',
        `quyết định lựa chọn giữa khởi đầu LABA + LAMA hay phác đồ ba thuốc ICS + LAMA + LABA ở bệnh nhân COPD Nhóm E (ngưỡng BCAT ≥ ${thFor('bloodEos', 'copd.eosinophils_high')} tế bào/µL)`,
        thr('copd.eosinophils_high').citationIds
      ),
  },

  {
    id: 'copd.initial.group_e_laba_lama',
    module: 'copd',
    nameVi: 'Khởi trị COPD Nhóm E (BCAT < 300 /µL hoặc tiền sử viêm phổi): Phối hợp đôi LABA + LAMA',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.initial_group_e',
      'gold.copd.2026.followup_eos_less_100_pneumonia',
      'byt.copd.2026.olodaterol_tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'none') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      const eos = getBloodEos(ctx);
      if (eos === undefined) return false;
      const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
      return eos < thFor('bloodEos', 'copd.eosinophils_high') || priorPneum;
    },
    produce: (ctx) => {
      const eos = getBloodEos(ctx)!;
      const d = drug('tiotropium_olodaterol');
      const startDose = fmtDose(dose('tiotropium_olodaterol', 'start'));
      const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
      const eosLow = thFor('bloodEos', 'copd.eosinophils_low');
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');

      const eosContext = priorPneum
        ? `tiền sử viêm phổi nặng/tái diễn (tránh khởi trị ICS đầu tay dù BCAT = ${eos} /µL)`
        : eos < eosLow
          ? `BCAT thấp (${eos} < ${eosLow} tế bào/µL – ít đáp ứng ICS và nguy cơ cao viêm phổi)`
          : `BCAT trung bình (${eos} tế bào/µL < ${eosHigh} tế bào/µL)`;

      return {
        id: 'rec_copd_init_group_e_laba_lama',
        module: 'copd',
        tier: 'Thuốc nền tảng (Nhóm E)',
        tierOrder: 1,
        action: 'START',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDose,
        title: `Khởi trị COPD Nhóm E: Phối hợp đôi LABA + LAMA (${d.nameVi})`,
        rationale: `Bệnh nhân COPD Nhóm E (có ≥ ${thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')} đợt cấp trung bình hoặc nhập viện trong 12 tháng qua) kèm ${eosContext}: Phối hợp đôi LABA + LAMA là lựa chọn khởi đầu ưu tiên hàng đầu giúp dự phòng đợt cấp hiệu quả và tránh phơi nhiễm ICS không cần thiết.`,
        warnings: getLamaWarnings(ctx, d.id),
        gates: [],
        citationIds: [
          'gold.copd.2026.initial_group_e',
          'gold.copd.2026.followup_eos_less_100_pneumonia',
          'byt.copd.2026.olodaterol_tiotropium_dose',
        ],
        priority: 88,
      };
    },
  },

  {
    id: 'copd.initial.group_e_triple',
    module: 'copd',
    nameVi: 'Khởi trị COPD Nhóm E có BCAT ≥ 300 tế bào/µL: Liệu pháp ba thuốc ICS + LAMA + LABA',
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
      if (resolveEffectiveInhaler(ctx) !== 'none') return false;
      if (!isGroupEConfirmed(ctx)) return false;
      if (Boolean(ctx.normalized.customInputs?.priorPneumonia)) return false;
      const eos = getBloodEos(ctx);
      if (eos === undefined) return false;
      return eos >= thFor('bloodEos', 'copd.eosinophils_high');
    },
    produce: (ctx) => {
      const eos = getBloodEos(ctx)!;
      const eosHigh = thFor('bloodEos', 'copd.eosinophils_high');
      const tripleId = selectTripleInhaler(ctx);
      const d = drug(tripleId);
      const startDose = fmtDose(dose(tripleId, 'start'));
      return {
        id: 'rec_copd_init_group_e_triple',
        module: 'copd',
        tier: 'Thuốc nền tảng (Nhóm E – BCAT cao)',
        tierOrder: 1,
        action: 'START',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: startDose,
        title: `Khởi trị COPD Nhóm E (BCAT ${eos} ≥ ${eosHigh} /µL): Phác đồ ba thuốc ICS + LAMA + LABA (${d.nameVi})`,
        rationale: `Bệnh nhân COPD Nhóm E có tăng bạch cầu ái toan máu rõ rệt (${eos} ≥ ${eosHigh} tế bào/µL) và không có tiền sử viêm phổi tái diễn: Cân nhắc khởi trị ngay phác đồ ba thuốc trong một bình hít duy nhất giúp giảm mạnh tần suất đợt cấp trung bình–nặng và giảm tử vong do mọi nguyên nhân.`,
        warnings: [
          ...getLamaWarnings(ctx, tripleId),
          ...getHepaticTripleWarnings(ctx, tripleId),
          'Theo dõi dấu hiệu viêm phổi mới xuất hiện hoặc nhiễm nấm Candida hầu họng (súc miệng sạch bằng nước sau mỗi lần hít ICS).',
        ],
        gates: [],
        citationIds: [
          'gold.copd.2026.initial_group_e_triple_eos300',
          'byt.copd.2026.triple_therapy_indication',
        ],
        priority: 90,
      };
    },
  },
];

export const copdInitialRules: Rule[] = [
  ...copdDiagnosisRules,
  ...copdInitialTherapyRules,
];
