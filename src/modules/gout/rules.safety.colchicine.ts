/**
 * GDMT-VN Gout Module - Colchicine Active Medication Safety Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  goutMissing,
  isOnMed,
  findMed,
  parseMedDailyDoseMg,
  hasAmbiguousCountMedDose,
  isPregnant,
  hasHepaticImpairment,
  isAcuteGoutFlare,
  isTakingModerateCyp3a4,
  isOnDialysis,
  checkColchicineSafety
} from './helpers';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';

export const goutColchicineSafetyRules: Rule[] = [
  goutRule({
    id: 'gout.safety.colchicine_missing_renal',
    nameVi: 'Yêu cầu eGFR bắt buộc để rà soát an toàn Colchicine đang dùng',
    citationIds: ['fda.colchicine.renal_and_cyp3a4', 'eular.gout.2016.colchicine_nsaid_contra'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isOnMed(ctx, ['colchicine']) &&
      !checkColchicineSafety(ctx).contraindicated &&
      need(ctx, 'egfr') === undefined &&
      !isOnDialysis(ctx),
    produce: () =>
      goutMissing(
        'egfr',
        'Bệnh nhân đang dùng Colchicine: Bắt buộc cần Creatinin/eGFR để loại trừ nguy cơ tích lũy ngộ độc tủy xương – thần kinh cơ.',
        ['fda.colchicine.renal_and_cyp3a4', 'eular.gout.2016.colchicine_nsaid_contra']
      )
  }),

  goutRule({
    id: 'gout.safety.colchicine_contra',
    nameVi: 'Chống chỉ định / tránh dùng Colchicine khi có tương tác CYP3A4/P-gp, suy thận/gan nặng hoặc dị ứng',
    citationIds: [
      'fda.colchicine.renal_and_cyp3a4',
      'fda.colchicine.cyp3a4_agents',
      'eular.gout.2016.colchicine_nsaid_contra',
      'byt.ckd.2024.gout_flare_table22'
    ],
    when: (ctx) => {
      if (isPregnant(ctx)) return false;
      const safety = checkColchicineSafety(ctx);
      if (isOnMed(ctx, ['colchicine'])) {
        return safety.contraindicated || safety.avoidProphylaxis;
      }
      return isAcuteGoutFlare(ctx) && safety.contraindicated;
    },
    produce: (ctx): Recommendation => {
      const safety = checkColchicineSafety(ctx);
      const onColch = isOnMed(ctx, ['colchicine']);
      return goutRec({
        id: onColch ? 'rec_gout_colchicine_stop_contra' : 'rec_gout_colchicine_avoid_contra',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: onColch ? 'STOP' : 'AVOID',
        drugId: 'colchicine',
        title: onColch
          ? 'NGỪNG KHẨN CẤP Colchicine do chống chỉ định / nguy cơ ngộ độc nặng'
          : 'Chống chỉ định / Tránh dùng Colchicine',
        rationale:
          safety.reasonVi ??
          'Chống chỉ định phối hợp Colchicine trên nền suy thận/gan nặng hoặc thuốc ức chế CYP3A4/P-gp do nguy cơ ức chế tủy xương và tiêu cơ vân tử vong.',
        citationIds: safety.citationIds
      });
    }
  }),

  goutRule({
    id: 'gout.safety.colchicine_ambiguous_dose',
    nameVi: 'Xác nhận hàm lượng mg viên Colchicine đang dùng khi chỉ nhập đơn vị đếm viên (QA-1 Fail-closed)',
    citationIds: ['fda.colchicine.prophylaxis_dosage', 'byt.gout.2014.colchicine_dosing'],
    when: (ctx) => {
      if (isPregnant(ctx) || !isOnMed(ctx, ['colchicine'])) return false;
      const safety = checkColchicineSafety(ctx);
      if (safety.contraindicated || safety.avoidProphylaxis) return false;
      if (isAcuteGoutFlare(ctx) && !safety.avoidFlare) return false;
      return hasAmbiguousCountMedDose(findMed(ctx, ['colchicine']));
    },
    produce: () => {
      const eularMin = thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_min');
      const fdaSingle = thFor('dose_mg', 'gout.colchicine.prophylaxis_fda_single_dose');
      const eularMax = thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_max');
      return goutRec({
        id: 'rec_gout_colchicine_confirm_strength',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 91, // qa-allow: index - độ ưu tiên an toàn
        action: 'CONSIDER',
        drugId: 'colchicine',
        title: `Xác nhận hàm lượng mg viên Colchicine đang dùng (${eularMin} mg, ${fdaSingle} mg hay ${eularMax} mg/viên)`,
        rationale:
          'Đơn thuốc hiện chỉ ghi số lượng "viên" mà chưa rõ hàm lượng miligam. Do cửa sổ điều trị của Colchicine rất hẹp, cần xác nhận chính xác hàm lượng viên thuốc trước khi duyệt liều theo chức năng thận – gan.',
        citationIds: ['fda.colchicine.prophylaxis_dosage', 'byt.gout.2014.colchicine_dosing']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.colchicine_reduce_active',
    nameVi: 'Giảm liều Colchicine đang dùng khi vượt trần dự phòng hàng ngày, suy thận/gan hoặc CYP3A4 vừa',
    citationIds: [
      'eular.gout.2016.flare_prophylaxis',
      'byt.gout.2014.colchicine_dosing',
      'fda.colchicine.prophylaxis_dosage',
      'fda.colchicine.severe_renal_prophylaxis',
      'fda.colchicine.moderate_cyp3a4',
      'fda.colchicine.hepatic_impairment_dosing'
    ],
    when: (ctx) => {
      if (isPregnant(ctx) || !isOnMed(ctx, ['colchicine'])) return false;
      const safety = checkColchicineSafety(ctx);
      if (safety.contraindicated || safety.avoidProphylaxis) return false;
      const curDose = parseMedDailyDoseMg(findMed(ctx, ['colchicine']));
      if (curDose === undefined) return false;

      if (isAcuteGoutFlare(ctx) && !safety.avoidFlare) {
        const maxFlareDay1 =
          thFor('dose_mg', 'gout.colchicine.flare_initial_dose') +
          thFor('dose_mg', 'gout.colchicine.flare_second_dose');
        return curDose > maxFlareDay1;
      }

      const egfr = need(ctx, 'egfr');
      const age = need(ctx, 'age');
      const severeMin = thFor('egfr', 'gout.colchicine.egfr_severe_renal_min');
      const ckdMin = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
      const elderlyMin = thFor('age', 'gout.colchicine.elderly_age_min');

      if (egfr !== undefined && egfr < severeMin) {
        return curDose > thFor('dose_mg', 'gout.colchicine.severe_renal_start_dose');
      }
      const reducedCap =
        ctx.settings.profile === 'US'
          ? thFor('dose_mg', 'gout.colchicine.prophylaxis_fda_single_dose')
          : thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_min');
      if (isTakingModerateCyp3a4(ctx) || hasHepaticImpairment(ctx)) return curDose > reducedCap;
      if ((egfr !== undefined && egfr < ckdMin) || (age !== undefined && age > elderlyMin)) return curDose > reducedCap;

      const maxDailyProph =
        ctx.settings.profile === 'US'
          ? thFor('dose_mg', 'gout.colchicine.prophylaxis_fda_max')
          : thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_max');
      return curDose > maxDailyProph;
    },
    produce: (ctx): Recommendation => {
      const egfr = need(ctx, 'egfr');
      const age = need(ctx, 'age');
      const severeMin = thFor('egfr', 'gout.colchicine.egfr_severe_renal_min');
      const ckdMin = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
      const elderlyMin = thFor('age', 'gout.colchicine.elderly_age_min');
      const fdaSevere = thFor('dose_mg', 'gout.colchicine.severe_renal_start_dose');
      const fdaMod = thFor('dose_mg', 'gout.colchicine.moderate_cyp3a4_prophylaxis_dose');
      const eularHalf = thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_min');
      const eularMax = thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_max');
      const fdaSingle = thFor('dose_mg', 'gout.colchicine.prophylaxis_fda_single_dose');
      const fdaMax = thFor('dose_mg', 'gout.colchicine.prophylaxis_fda_max');

      let targetDose = `${eularHalf} mg x 1 lần/ngày`;
      let cites = ['eular.gout.2016.flare_prophylaxis', 'byt.gout.2014.colchicine_dosing'];

      const needsLowCap =
        isTakingModerateCyp3a4(ctx) ||
        hasHepaticImpairment(ctx) ||
        (egfr !== undefined && egfr < ckdMin) ||
        (age !== undefined && age > elderlyMin);

      if (egfr !== undefined && egfr < severeMin && ctx.settings.profile === 'US') {
        targetDose = `${fdaSevere} mg x 1 lần/ngày`;
        cites = ['fda.colchicine.severe_renal_prophylaxis'];
      } else if (isTakingModerateCyp3a4(ctx)) {
        targetDose =
          ctx.settings.profile === 'US'
            ? `${fdaMod} mg x 1–2 lần/ngày (tối đa ${fdaSingle} mg/ngày)`
            : `${eularHalf} mg uống cách ngày (với viên ${eularMax} mg)`;
        cites = ['fda.colchicine.moderate_cyp3a4', 'byt.gout.2014.colchicine_dosing'];
      } else if (hasHepaticImpairment(ctx)) {
        targetDose =
          ctx.settings.profile === 'US'
            ? `${fdaSingle} mg x 1 lần/ngày`
            : `${eularHalf} mg x 1 lần/ngày`;
        cites = ['fda.colchicine.hepatic_impairment_dosing', 'fda.colchicine.prophylaxis_dosage', 'byt.gout.2014.colchicine_dosing'];
      } else if (!needsLowCap) {
        targetDose =
          ctx.settings.profile === 'US'
            ? `${fdaSingle} mg x 1–2 lần/ngày (tối đa ${fdaMax} mg/ngày)`
            : `${eularHalf}–${eularMax} mg/ngày`;
        cites = ['fda.colchicine.prophylaxis_dosage', 'eular.gout.2016.flare_prophylaxis', 'byt.gout.2014.colchicine_dosing'];
      } else if (ctx.settings.profile === 'US') {
        targetDose = `${fdaSingle} mg x 1 lần/ngày`;
        cites = ['fda.colchicine.prophylaxis_dosage', 'eular.gout.2016.flare_prophylaxis'];
      }

      return goutRec({
        id: 'rec_gout_colchicine_reduce_active',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên an toàn
        action: 'REDUCE',
        drugId: 'colchicine',
        dose: targetDose,
        title: `GIẢM LIỀU Colchicine đang dùng xuống ${targetDose}`,
        rationale:
          'Liều Colchicine duy trì hiện tại vượt ngưỡng tối đa an toàn hàng ngày hoặc vượt trần theo chức năng thận, bệnh gan, tuổi cao / tương tác CYP3A4 vừa. Bắt buộc giảm liều ngay để phòng ngộ độc tiêu hóa, suy tủy xương và bệnh cơ thần kinh.',
        citationIds: cites
      });
    }
  })
];
