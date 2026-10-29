/**
 * GDMT-VN Gout Module - NSAID/COX-2i Safety Gates & Steroid Clinical Warnings
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  NSAID_DRUG_IDS,
  NON_GOUT_CONTINUABLE_NSAID_IDS,
  SYSTEMIC_STEROID_IDS,
  P2Y12_DRUG_IDS,
  isOnMed,
  findMed,
  findAllMeds,
  parseMedDailyDoseMg,
  isPregnant,
  getChildPughGrade,
  hasHepaticImpairment,
  isAcuteGoutFlare,
  isUnableToTakeOral,
  isNsaidHardContraindicated,
  isNsaidAvoidedInGout,
  hasPepticUlcerOrBleed,
  isOnAnticoagulant,
  hasHeartFailure
} from './helpers';
import { goutColchicineSafetyRules } from './rules.safety.colchicine';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';

export function getSteroidClinicalWarnings(ctx: RuleContext): string[] {
  const warnings: string[] = [
    'Bắt buộc loại trừ viêm khớp nhiễm khuẩn hoặc nhiễm trùng toàn thân tiến triển trước khi dùng Corticosteroid.'
  ];
  const glucose = need(ctx, 'glucose');
  const hba1c = need(ctx, 'hba1c');
  const highGlucose = thFor('glucose', 'dm2.early_insulin.glucose_mmol');
  const dmHba1c = thFor('hba1c', 'dm2.hba1c.target_standard');

  if (
    hasCondition(ctx, 'dm') ||
    (glucose !== undefined && glucose >= highGlucose) ||
    (hba1c !== undefined && hba1c >= dmHba1c)
  ) {
    warnings.push(
      'Bệnh nhân ĐTĐ / tăng đường huyết: Theo dõi sát đường huyết mao mạch 4 lần/ngày và chủ động hiệu chỉnh tăng liều Insulin/thuốc hạ đường huyết trong đợt dùng Corticosteroid.'
    );
  }
  if (hasCondition(ctx, 'htn') || hasHeartFailure(ctx)) {
    warnings.push('Theo dõi sát huyết áp và dấu hiệu giữ muối – nước trong thời gian dùng Corticosteroid.');
  }
  if (hasPepticUlcerOrBleed(ctx) || isOnAnticoagulant(ctx)) {
    warnings.push(
      'Phối hợp thuốc ức chế bơm proton (PPI) bảo vệ niêm mạc dạ dày – tá tràng khi có tiền sử loét tiêu hóa hoặc đang dùng thuốc chống đông.'
    );
  }
  return warnings;
}

export function shouldStopActiveNsaid(
  ctx: RuleContext,
  nsaidId: string
): { stop: boolean; reasonVi: string; citationIds: string[] } {
  const lowerId = nsaidId.toLowerCase();
  const hard = isNsaidHardContraindicated(ctx, lowerId);
  if (hard.contra) {
    return { stop: true, reasonVi: hard.reasonsVi.join('; '), citationIds: hard.citationIds };
  }
  if (NON_GOUT_CONTINUABLE_NSAID_IDS.includes(lowerId)) {
    return {
      stop: true,
      reasonVi:
        lowerId === 'ketorolac'
          ? 'Ketorolac bị giới hạn nghiêm ngặt ≤ 5 ngày do nguy cơ xuất huyết/thủng dạ dày và suy thận cấp nặng (FDA Boxed Warning), không tiếp tục dùng để điều trị hay dự phòng gút'
          : 'Parecoxib dạng tiêm ngắn hạn chu phẫu không dùng duy trì điều trị hay dự phòng gút ngoại trú',
      citationIds: ['byt.gout.2014.nsaid_contra_p198', 'fda.celecoxib.boxed_contra_cv_gi']
    };
  }
  if (lowerId === 'etoricoxib' && isAcuteGoutFlare(ctx) && hasHepaticImpairment(ctx)) {
    const cpAMax = thFor('dose_mg', 'gout.etoricoxib.hepatic_child_pugh_a_max');
    const cpBMax = thFor('dose_mg', 'gout.etoricoxib.hepatic_child_pugh_b_max');
    const etoriFlare = thFor('dose_mg', 'gout.etoricoxib.flare_dose');
    return {
      stop: true,
      reasonVi: `Bệnh gan / xơ gan (EMA Arcoxia SmPC giới hạn tối đa ${cpAMax} mg/ngày ở Child-Pugh A và ${cpBMax} mg/ngày ở Child-Pugh B, không được dùng liều cắt cơn gút cấp ${etoriFlare} mg/ngày)`,
      citationIds: ['ema.arcoxia.hepatic_renal_posology', 'ema.arcoxia.gout_posology_120mg_8d']
    };
  }
  const egfr = need(ctx, 'egfr');
  const egfrCaution = thFor('egfr', 'gout.nsaid.egfr_caution_min');
  if (egfr !== undefined && egfr < egfrCaution) {
    return {
      stop: true,
      reasonVi: `Bệnh thận mạn giai đoạn ≥ 3 (eGFR < ${egfrCaution} mL/phút/1.73m²): Ngừng NSAID để bảo vệ thận và tránh xuất huyết tiêu hóa khi chuyển sang Corticosteroid`,
      citationIds: ['kdigo.gout.2024.acute_flare_ckd', 'byt.ckd.2024.gout_flare_table22']
    };
  }
  if (isOnMed(ctx, SYSTEMIC_STEROID_IDS)) {
    return {
      stop: true,
      reasonVi: 'Đang dùng Corticosteroid toàn thân đồng thời: Ngừng NSAID để tránh cộng hưởng xuất huyết tiêu hóa nặng',
      citationIds: ['eular.gout.2016.flare_combination_severe', 'byt.gout.2014.nsaid_contra_p198']
    };
  }
  if (isOnMed(ctx, P2Y12_DRUG_IDS)) {
    return {
      stop: true,
      reasonVi: 'Đang dùng kháng kết tập tiểu cầu P2Y12: Ngừng NSAID do nguy cơ xuất huyết nặng và biến cố huyết khối tim mạch',
      citationIds: ['byt.gout.2014.nsaid_cv_aspirin_p199', 'fda.celecoxib.boxed_contra_cv_gi']
    };
  }
  if (isAcuteGoutFlare(ctx) && isUnableToTakeOral(ctx)) {
    return {
      stop: true,
      reasonVi: 'Bệnh nhân không uống được (NPO) chuyển sang Corticosteroid đường tiêm: Ngừng NSAID đường uống',
      citationIds: ['acr.gout.2020.npo_parenteral_steroid', 'byt.gout.2014.nsaid_contra_p198']
    };
  }
  const activeNsaids = findAllMeds(ctx, NSAID_DRUG_IDS);
  if (activeNsaids.length > 1) {
    const keepable = activeNsaids.find((m) => !NON_GOUT_CONTINUABLE_NSAID_IDS.includes((m.drugId || '').toLowerCase()));
    const firstId = (keepable?.drugId || activeNsaids[0]?.drugId || '').toLowerCase();
    if (firstId && firstId !== lowerId) {
      return {
        stop: true,
        reasonVi: 'Đang dùng trùng lặp nhiều thuốc NSAID/COX-2i đường toàn thân đồng thời: Bắt buộc ngừng thuốc trùng lặp',
        citationIds: ['byt.gout.2014.nsaid_contra_p198', 'fda.celecoxib.boxed_contra_cv_gi']
      };
    }
  }
  return { stop: false, reasonVi: '', citationIds: [] };
}

const perDrugNsaidStopRules: Rule[] = NSAID_DRUG_IDS.map((nsaidId) =>
  goutRule({
    id: `gout.safety.nsaid_stop_${nsaidId}`,
    nameVi: `An toàn NSAID: Ngừng ${nsaidId} khi có chống chỉ định hoặc trùng lặp`,
    citationIds: [
      'byt.ckd.2024.gout_flare_table22',
      'eular.gout.2016.colchicine_nsaid_contra',
      'byt.gout.2014.nsaid_contra_p198',
      'fda.celecoxib.boxed_contra_cv_gi'
    ],
    when: (ctx) => !isPregnant(ctx) && isOnMed(ctx, [nsaidId]) && shouldStopActiveNsaid(ctx, nsaidId).stop,
    produce: (ctx): Recommendation => {
      const check = shouldStopActiveNsaid(ctx, nsaidId);
      return goutRec({
        id: `rec_gout_nsaid_stop_${nsaidId}`,
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn
        action: 'STOP',
        drugId: nsaidId,
        title: `NGỪNG ${nsaidId.toUpperCase()} do chống chỉ định / nguy cơ độc tính thận – tim mạch – tiêu hóa`,
        rationale: `${check.reasonVi}. Cần ngừng ngay thuốc kháng viêm không steroid đang dùng.`,
        citationIds: check.citationIds
      });
    }
  })
);

export const goutAntiinflamSafetyRules: Rule[] = [
  ...perDrugNsaidStopRules,

  goutRule({
    id: 'gout.safety.etoricoxib_hepatic_reduce',
    nameVi: 'Giảm liều Etoricoxib theo phân độ xơ gan Child-Pugh A/B (EMA Arcoxia SmPC Mục 4.2)',
    citationIds: ['ema.arcoxia.hepatic_renal_posology'],
    when: (ctx) => {
      if (isPregnant(ctx) || !isOnMed(ctx, ['etoricoxib']) || shouldStopActiveNsaid(ctx, 'etoricoxib').stop) return false;
      const cp = getChildPughGrade(ctx);
      if (cp !== 'A' && cp !== 'B' && !hasHepaticImpairment(ctx)) return false;
      const maxAllowed =
        cp === 'B'
          ? thFor('dose_mg', 'gout.etoricoxib.hepatic_child_pugh_b_max')
          : thFor('dose_mg', 'gout.etoricoxib.hepatic_child_pugh_a_max');
      const curDose = parseMedDailyDoseMg(findMed(ctx, ['etoricoxib']));
      return curDose === undefined || curDose > maxAllowed;
    },
    produce: (ctx): Recommendation => {
      const cp = getChildPughGrade(ctx);
      const cpAMax = thFor('dose_mg', 'gout.etoricoxib.hepatic_child_pugh_a_max');
      const cpBMax = thFor('dose_mg', 'gout.etoricoxib.hepatic_child_pugh_b_max');
      const maxAllowed = cp === 'B' ? cpBMax : cpAMax;
      return goutRec({
        id: 'rec_gout_etoricoxib_hepatic_reduce',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên an toàn gan
        action: 'REDUCE',
        drugId: 'etoricoxib',
        dose: `Tối đa ≤ ${maxAllowed} mg x 1 lần/ngày`,
        title: `GIẢM LIỀU Etoricoxib xuống tối đa ≤ ${maxAllowed} mg/ngày do suy giảm chức năng gan`,
        rationale:
          `Theo Tờ thông tin sản phẩm EMA Arcoxia (Mục 4.2), bất kể chỉ định điều trị, bệnh nhân suy gan nhẹ (Child-Pugh A) không được vượt quá ${cpAMax} mg/ngày và suy gan vừa (Child-Pugh B) không được vượt quá ${cpBMax} mg/ngày.`,
        citationIds: ['ema.arcoxia.hepatic_renal_posology']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.celecoxib_hepatic_cyp2c9_reduce',
    nameVi: 'Giảm 50% liều Celecoxib ở bệnh nhân xơ gan Child-Pugh B hoặc đang dùng Fluconazole (ức chế CYP2C9)',
    citationIds: ['fda.celecoxib.hepatic_cyp2c9'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isOnMed(ctx, ['celecoxib']) &&
      !shouldStopActiveNsaid(ctx, 'celecoxib').stop &&
      (getChildPughGrade(ctx) === 'B' || isOnMed(ctx, ['fluconazole'])),
    produce: () => {
      const pct = 50; // qa-allow: unit-conversion - tỷ lệ giảm 50% theo nhãn FDA Celebrex
      return goutRec({
        id: 'rec_gout_celecoxib_reduce_50pct',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 94, // qa-allow: index - độ ưu tiên an toàn
        action: 'REDUCE',
        drugId: 'celecoxib',
        dose: `Giảm ${pct}% liều khuyến cáo hàng ngày`,
        title: `GIẢM ${pct}% LIỀU Celecoxib do suy gan vừa (Child-Pugh B) hoặc tương tác Fluconazole (CYP2C9)`,
        rationale:
          'Theo nhãn FDA Celebrex (Mục 2.7, 7 & 8.6), phơi nhiễm Celecoxib tăng gấp đôi ở bệnh nhân suy gan vừa Child-Pugh B hoặc khi phối hợp thuốc ức chế CYP2C9 mạnh như Fluconazole; bắt buộc giảm một nửa liều dùng hàng ngày.',
        citationIds: ['fda.celecoxib.hepatic_cyp2c9']
      });
    }
  }),

  goutRule({
    id: 'gout.safety.nsaid_avoid',
    nameVi: 'Tránh khởi trị NSAID khi có CKD, bệnh tim mạch, loét tiêu hóa, chống đông, AERD hoặc Triple Whammy',
    citationIds: [
      'kdigo.gout.2024.acute_flare_ckd',
      'byt.ckd.2024.gout_flare_table22',
      'eular.gout.2016.colchicine_nsaid_contra',
      'byt.gout.2014.nsaid_contra_p198'
    ],
    when: (ctx) =>
      !isPregnant(ctx) &&
      isAcuteGoutFlare(ctx) &&
      !isOnMed(ctx, NSAID_DRUG_IDS) &&
      isNsaidAvoidedInGout(ctx).avoid,
    produce: (ctx): Recommendation => {
      const check = isNsaidAvoidedInGout(ctx);
      return goutRec({
        id: 'rec_gout_nsaid_avoid',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 92, // qa-allow: index - độ ưu tiên an toàn
        action: 'AVOID',
        drugId: 'naproxen',
        title: 'Tránh dùng nhóm NSAID / COX-2i trong cơn gút cấp',
        rationale: `Không chỉ định nhóm NSAID do: ${check.reasonsVi.join('; ')}. Ưu tiên Corticosteroid hoặc Colchicine liều thấp nếu chức năng thận – tương tác thuốc cho phép.`,
        citationIds: check.citationIds
      });
    }
  }),

  ...goutColchicineSafetyRules
];
