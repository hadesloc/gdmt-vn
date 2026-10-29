import type { Rule } from '../../engine/types';
import { drug, dose, fmtDose } from '../../kb-types';
import {
  COPD_PROFILES,
  formatCopdTiotropiumDose,
  getInhalerProfile,
  hasConfirmedCopdSpirometry,
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
} from './helpers';

export const copdFollowupAcoRules: Rule[] = [
  {
    id: 'copd.followup.aco_missing_ics_switch',
    module: 'copd',
    nameVi: 'Theo dõi đồng mắc Hen – COPD: Chuyển ngay sang phác đồ chứa ICS nếu đang dùng giãn phế quản đơn thuần',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.concurrent_asthma',
      'gold.copd.2026.initial_group_e_triple_eos300',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedCopdSpirometry(ctx)) return false;
      if (!hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (getAsthmaPrescribedMonoIcsId(ctx) !== undefined && eff === 'laba_lama') {
        return false;
      }
      return eff === 'lama_mono' || eff === 'laba_mono' || eff === 'laba_lama';
    },
    produce: (ctx) => {
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
      if (asthmaMonoIcsId) {
        const dDual = drug('tiotropium_olodaterol');
        const monoIcsName = drug(asthmaMonoIcsId).nameVi;
        return {
          id: 'rec_copd_aco_followup_laba_lama',
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: dDual.id,
          drugNameVi: dDual.nameVi,
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          title: `Đồng mắc Hen – COPD: Chuyển sang LABA + LAMA (${dDual.nameVi}) phối hợp cùng ICS đơn chất (${monoIcsName})`,
          rationale: `Bệnh nhân đồng mắc Hen – COPD ở GINA Track 2 Bậc 1–2 đang được chỉ định ICS đơn chất (${monoIcsName}): Phối hợp LABA + LAMA (${dDual.nameVi}) đảm bảo đủ bộ ba ICS + LABA + LAMA mà không trùng lặp 2 ICS.`,
          warnings: getLamaWarnings(ctx, dDual.id),
          gates: [],
          citationIds: ['gold.copd.2026.concurrent_asthma', 'byt.copd.2026.olodaterol_tiotropium_dose'],
          priority: 94,
        };
      }

      const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx);
      if (asthmaIcsLabaId) {
        const dLama = drug('tiotropium');
        const asthmaControllerName = drug(asthmaIcsLabaId).nameVi;
        return {
          id: 'rec_copd_aco_followup_lama',
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: dLama.id,
          drugNameVi: dLama.nameVi,
          dose: formatCopdTiotropiumDose(avoidDpi),
          title: `Đồng mắc Hen – COPD: Phối hợp LAMA đơn chất (${dLama.nameVi}) trên nền ICS+LABA (${asthmaControllerName}) của Hen`,
          rationale: `Bệnh nhân có tiền sử Hen đang dùng thuốc giãn phế quản thiếu ICS: Cần phối hợp LAMA (${dLama.nameVi}) cùng bình ${asthmaControllerName} của phác đồ Hen để đảm bảo đủ bộ ba ICS + LABA + LAMA mà không trùng lặp 2 LABA.`,
          warnings: getLamaWarnings(ctx, dLama.id),
          gates: [],
          citationIds: ['gold.copd.2026.concurrent_asthma', 'byt.copd.2026.tiotropium_dose'],
          priority: 94,
        };
      }

      const tripleId = selectTripleInhaler(ctx);
      const d = drug(tripleId);
      return {
        id: 'rec_copd_aco_followup_triple',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: fmtDose(dose(tripleId, 'start')),
        title: `Đồng mắc Hen – COPD: Chuyển sang phác đồ ba thuốc có chứa ICS (${d.nameVi} – cấm dùng LAMA/LABA thiếu ICS)`,
        rationale:
          'Bệnh nhân đồng mắc Hen phế quản không được duy trì bằng LAMA hoặc LABA+LAMA đơn thuần thiếu ICS do nguy cơ cơn hen kịch phát đe dọa tính mạng. Khuyến cáo chuyển sang phác đồ ba thuốc ICS + LAMA + LABA phù hợp.',
        warnings: [...getLamaWarnings(ctx, tripleId), ...getHepaticTripleWarnings(ctx, tripleId)],
        gates: [],
        citationIds: [
          'gold.copd.2026.concurrent_asthma',
          'gold.copd.2026.initial_group_e_triple_eos300',
          'byt.copd.2026.triple_therapy_indication',
        ],
        priority: 94,
      };
    },
  },

  {
    id: 'copd.followup.aco_preserve_bronchodilators',
    module: 'copd',
    nameVi: 'Đồng mắc Hen – COPD: Bảo toàn thành phần LAMA/LABA khi phân hệ Hen chuyển sang MART hoặc ICS đơn chất',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.concurrent_asthma',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.tiotropium_dose',
      'byt.copd.2026.olodaterol_tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (!hasConcurrentAsthma(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;

      const eff = resolveEffectiveInhaler(ctx);
      const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
      if (asthmaMonoIcsId && (eff === 'ics_laba' || eff === 'triple')) {
        return true;
      }

      const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx);
      if (asthmaIcsLabaId && eff === 'triple') {
        return ctx.normalized.currentMeds.some((m) => {
          const p = getInhalerProfile(m.drugId);
          return Boolean(p && p.ics && p.lama && p.laba);
        });
      }
      return false;
    },
    produce: (ctx) => {
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const asthmaMonoIcsId = getAsthmaPrescribedMonoIcsId(ctx);
      if (asthmaMonoIcsId) {
        const dDual = drug('tiotropium_olodaterol');
        const monoName = drug(asthmaMonoIcsId).nameVi;
        return {
          id: 'rec_copd_aco_preserve_laba_lama',
          module: 'copd',
          tier: 'Duy trì phác đồ nền tảng',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: dDual.id,
          drugNameVi: dDual.nameVi,
          dose: fmtDose(dose('tiotropium_olodaterol', 'start')),
          title: `Bảo toàn giãn phế quản kép LABA + LAMA (${dDual.nameVi}) song song với ${monoName} của phác đồ Hen`,
          rationale: `Khi phân hệ Hen chuyển sang ICS đơn chất (${monoName}) ở GINA Track 2 Bậc 1–2, module COPD đồng thời duy trì ${dDual.nameVi} để bảo toàn đủ bộ ba ICS + LABA + LAMA và tránh trùng lặp 2 ICS.`,
          warnings: getLamaWarnings(ctx, dDual.id),
          gates: [],
          citationIds: ['gold.copd.2026.concurrent_asthma', 'byt.copd.2026.olodaterol_tiotropium_dose'],
          priority: 91,
        };
      }

      const asthmaIcsLabaId = getAsthmaPrescribedIcsLabaId(ctx)!;
      const dLama = drug('tiotropium');
      const martName = drug(asthmaIcsLabaId).nameVi;
      return {
        id: 'rec_copd_aco_preserve_lama',
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 1,
        action: 'START',
        drugId: dLama.id,
        drugNameVi: dLama.nameVi,
        dose: formatCopdTiotropiumDose(avoidDpi),
        title: `Bảo toàn thành phần LAMA (${dLama.nameVi}) khi chuyển sang phác đồ ${martName} (đủ bộ ba ICS + LABA + LAMA)`,
        rationale: `Bệnh nhân đồng mắc Hen – COPD đang điều trị phác đồ ba thuốc được chuyển sang nền tảng ${martName} theo bậc kiểm soát Hen: Bắt buộc bổ sung đồng thời LAMA đơn chất (${dLama.nameVi}) và ngừng bình bộ ba cũ để không đánh mất thành phần LAMA và không trùng lặp 2 ICS/2 LABA.`,
        warnings: getLamaWarnings(ctx, dLama.id),
        gates: [],
        citationIds: [
          'gold.copd.2026.concurrent_asthma',
          'byt.copd.2026.triple_therapy_indication',
          'byt.copd.2026.tiotropium_dose',
        ],
        priority: 91,
      };
    },
  },
];
