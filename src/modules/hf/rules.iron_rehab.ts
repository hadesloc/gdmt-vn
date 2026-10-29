import type { Action, Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  getCongestionStatus,
  getCustomInput,
  getDrugDisplayVi,
  hasAcuteBronchospasm,
  hasAcuteKidneyInjury,
  hasExtraCondition,
  hasHfContext,
  isAcutelyDecompensated,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  IV_IRON_IDS,
} from './helpers';

export const hfIronRehabRules: Rule[] = [
  {
    id: 'hf.amt.iv_iron',
    module: 'hf',
    nameVi: 'Tầm soát thiếu sắt & Bù sắt tĩnh mạch (FCM / Ferric derisomaltose)',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: [
      'esc.hf.2026.iron_screening',
      'esc.hf.2026.iron_definition',
      'esc.hf.2026.iron_rec',
      'aha.hf.2022.iron_cor2a',
      'esc.hf.2026.fair_hf2_fcm_500_2000',
    ],
    when: (ctx) => hasHfContext(ctx) && need(ctx, 'lvef') !== undefined,
    produce: (ctx) => {
      const lvef = need(ctx, 'lvef');
      if (lvef === undefined) return null;
      const nyha = need(ctx, 'nyha');
      if (nyha !== undefined && nyha < 2) return null;

      const activeIron = findCurrentMed(ctx, IV_IRON_IDS);
      if (activeIron) {
        return {
          id: 'rec_hf_iv_iron_monitor',
          module: 'hf',
          tier: 'Theo dõi điều trị sắt tĩnh mạch',
          tierOrder: 3,
          action: 'MONITOR',
          drugId: activeIron.drugId,
          drugNameVi: getDrugDisplayVi(activeIron.drugId, activeIron),
          title: `Đang điều trị ${getDrugDisplayVi(activeIron.drugId, activeIron)}: Đánh giá lại Hb, Ferritin & TSAT sau 3–6 tháng`,
          rationale: 'Không truyền sắt tĩnh mạch lặp lại sớm khi chưa kiểm tra lại dự trữ sắt sau 3–6 tháng và theo dõi sát phospho máu (nguy cơ hạ phospho máu sau truyền FCM).',
          gates: [],
          citationIds: ['esc.hf.2026.iron_screening', 'esc.hf.2026.fair_hf2_fcm_500_2000'],
          priority: 66,
        };
      }

      const ferritin = need(ctx, 'ferritin');
      const tsat = need(ctx, 'tsat');
      const ferAbs = thFor('ferritin', 'hf.iron.ferritin_abs_max');
      const ferFunc = thFor('ferritin', 'hf.iron.ferritin_func_max');
      const tsatMax = thFor('tsat', 'hf.iron.tsat_max');
      const tsatOverload = 45; // qa-allow: ui-step - ngưỡng quá tải sắt TSAT >= 45%
      const hbContra = 15; // qa-allow: ui-step - không truyền FCM khi Hb > 15 g/dL
      const efEsc = thFor('lvef', 'hf.iron.ef_max_intl');
      const efUsVn = thFor('lvef', 'hf.iron.ef_max');

      if (ferritin === undefined || (ferritin >= ferAbs && ferritin <= ferFunc && tsat === undefined)) {
        return {
          id: 'rec_hf_iron_screening',
          module: 'hf',
          tier: 'Tầm soát bệnh đồng mắc (Class I)',
          tierOrder: 3,
          action: 'CONSIDER',
          title: 'Tầm soát định kỳ bilan sắt huyết thanh (Ferritin & TSAT) và công thức máu (Hb)',
          rationale: `ESC 2026 khuyến cáo Class I-C kiểm tra định kỳ thiếu máu và thiếu sắt (Ferritin < ${ferAbs} ng/mL hoặc ${ferAbs}–${ferFunc} ng/mL kèm TSAT < ${tsatMax}%) cho mọi bệnh nhân suy tim có triệu chứng.`,
          gates: [],
          citationIds: ['esc.hf.2026.iron_screening', 'esc.hf.2026.iron_definition'],
          priority: 65,
        };
      }

      const isIronDeficient = ferritin < ferAbs || (ferritin <= ferFunc && tsat !== undefined && tsat < tsatMax);
      const efEligible = ctx.settings.profile === 'INTL' ? lvef < efEsc : lvef <= efUsVn;
      if (!isIronDeficient || !efEligible) return null;

      const hb = need(ctx, 'hb');
      if ((hb !== undefined && hb > hbContra) || (tsat !== undefined && tsat >= tsatOverload)) {
        return {
          id: 'rec_hf_iv_iron_start',
          module: 'hf',
          tier: 'An toàn bù sắt tĩnh mạch',
          tierOrder: 2,
          action: 'AVOID',
          drugId: 'ferric_carboxymaltose',
          drugNameVi: getDrugDisplayVi('ferric_carboxymaltose'),
          title: `Không truyền sắt tĩnh mạch khi Hb > ${hbContra} g/dL hoặc có dấu hiệu quá tải sắt (TSAT >= ${tsatOverload}%)`,
          rationale: `Theo thực hành truyền Ferric carboxymaltose ở suy tim, không chỉ định bù sắt đường tĩnh mạch khi Hemoglobin > ${hbContra} g/dL hoặc quá tải sắt.`,
          gates: [{ parameter: 'Hb / TSAT', passed: false, messageVi: `Hb > ${hbContra} g/dL hoặc TSAT >= ${tsatOverload}%` }],
          citationIds: ['esc.hf.2026.fair_hf2_fcm_500_2000', 'esc.hf.2026.iron_definition'],
          priority: 82,
        };
      }

      const hasInfection = hasExtraCondition(ctx, 'activeInfection');
      if (isShockOrInotrope(ctx) || hasInfection || (isPregnant(ctx) && getCustomInput(ctx, 'trimester') === 1)) {
        return {
          id: 'rec_hf_iv_iron_start',
          module: 'hf',
          tier: 'Điều trị thiếu sắt đường tĩnh mạch',
          tierOrder: 2,
          action: 'DEFER',
          drugId: 'ferric_carboxymaltose',
          drugNameVi: getDrugDisplayVi('ferric_carboxymaltose'),
          title: 'Trì hoãn truyền sắt tĩnh mạch cho tới khi hết sốc tim / nhiễm trùng cấp tính (hoặc qua tam cá nguyệt 1)',
          rationale: 'Tránh truyền sắt tĩnh mạch khi đang nhiễm khuẩn huyết tiến triển, sốc tim chưa ổn định hoặc 3 tháng đầu thai kỳ.',
          gates: [],
          citationIds: ['esc.preg.2025.hf_iron_pregnancy', 'esc.hf.2026.iron_definition'],
          priority: 78,
        };
      }

      const weight = need(ctx, 'weight');
      const wCut = 70; // qa-allow: ui-step - mốc cân nặng 70 kg bảng liều FCM
      let fcmDoseText = '500–1000 mg truyền tĩnh mạch liều nạp theo cân nặng & Hb (tối đa 1000 mg sắt/lần truyền mỗi tuần); đánh giá lại sau 3–6 tháng'; // qa-allow: ui-step - liều nạp chuẩn FCM 500-1000 mg
      if (weight !== undefined && hb !== undefined) {
        if (weight >= wCut && hb < 10) {
          fcmDoseText = 'Tổng liều 2000 mg truyền TM chia 2 lần (1000 mg ngày 1 + 1000 mg sau >= 1 tuần; tối đa 1000 mg/tuần)'; // qa-allow: ui-step - bảng liều FCM cân nặng >=70kg Hb <10
        } else if (weight >= wCut && hb <= 14) {
          fcmDoseText = 'Tổng liều 1500 mg truyền TM chia 2 lần (1000 mg ngày 1 + 500 mg sau >= 1 tuần)'; // qa-allow: ui-step - bảng liều FCM cân nặng >=70kg Hb 10-14
        } else if (weight < wCut && hb < 10) {
          fcmDoseText = 'Tổng liều 1500 mg truyền TM chia 2 lần (1000 mg ngày 1 + 500 mg sau >= 1 tuần)'; // qa-allow: ui-step - bảng liều FCM cân nặng <70kg Hb <10
        } else if (hb > 14) {
          fcmDoseText = '500 mg truyền tĩnh mạch 1 liều duy nhất (Hb 14–15 g/dL)'; // qa-allow: ui-step - bảng liều FCM Hb 14-15
        } else {
          fcmDoseText = '1000 mg truyền tĩnh mạch liều duy nhất (cân nặng < 70 kg, Hb 10–14 g/dL)'; // qa-allow: ui-step - bảng liều FCM <70kg Hb 10-14
        }
      }

      const actIron: Action = ctx.settings.profile === 'US' ? 'CONSIDER' : 'START';
      return {
        id: 'rec_hf_iv_iron_start',
        module: 'hf',
        tier: ctx.settings.profile === 'US' ? 'Điều trị thiếu sắt đường tĩnh mạch (COR 2a)' : 'Điều trị thiếu sắt đường tĩnh mạch (Class I / IIa)',
        tierOrder: 2,
        action: actIron,
        drugId: 'ferric_carboxymaltose',
        drugNameVi: `${getDrugDisplayVi('ferric_carboxymaltose')} (hoặc Ferric derisomaltose TM)`,
        dose: fcmDoseText,
        title: 'Bù sắt đường tĩnh mạch: Ferric carboxymaltose (hoặc Ferric derisomaltose)',
        rationale: `Bệnh nhân suy tim có thiếu sắt đã xác định (Ferritin ${ferritin} ng/mL${tsat !== undefined ? `, TSAT ${tsat}%` : ''}): ESC 2026 khuyến cáo bù sắt tĩnh mạch mức Class I, Level B1 để cải thiện triệu chứng & chất lượng sống và mức Class IIa, Level B1 để giảm nhập viện suy tim (không dùng sắt đường uống do kém hấp thu trong IRONOUT-HF).`,
        gates: [{ parameter: 'Bilan sắt', passed: true, value: ferritin, threshold: `< ${ferAbs} hoặc TSAT < ${tsatMax}%`, messageVi: 'Đủ tiêu chuẩn thiếu sắt ở suy tim' }],
        profileDiff: {
          INTL: `ESC 2026 áp dụng cho HFrEF (LVEF dưới ${efEsc}%): Class I-B1 cải thiện triệu chứng/QoL và Class IIa-B1 giảm nhập viện suy tim.`,
          US: `AHA/ACC/HFSA 2022 xếp mức COR 2a, LOE B-R ở HFrEF (LVEF từ ${efUsVn}% trở xuống) kèm thiếu sắt.`,
          VN: 'BYT QĐ 1857/2022 khuyến cáo bù sắt tĩnh mạch (FCM) cho suy tim kèm thiếu sắt.',
        },
        citationIds: ['esc.hf.2026.iron_definition', 'esc.hf.2026.iron_rec', 'aha.hf.2022.iron_cor2a', 'esc.hf.2026.fair_hf2_fcm_500_2000'],
        priority: 84,
      };
    },
  },
  {
    id: 'hf.gdit.teer',
    module: 'hf',
    nameVi: 'Sửa van hai lá qua ống thông bờ-đối-bờ (M-TEER)',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.teer_indication', 'esc.hf.2026.teer_table19_criteria'],
    when: (ctx) => {
      if (!hasHfContext(ctx) || isOutpatientDecompensatedCrisis(ctx)) return false;
      if (!Boolean(getCustomInput(ctx, 'severeSecondaryMr'))) return false;
      const lvef = need(ctx, 'lvef');
      if (lvef === undefined) return false;
      return lvef >= thFor('lvef', 'hf.teer.ef_min') && lvef <= thFor('lvef', 'hf.teer.ef_max');
    },
    produce: (ctx) => {
      const nyha = need(ctx, 'nyha'), sbp = need(ctx, 'sbp');
      if ((nyha !== undefined && nyha < 2) || (sbp !== undefined && sbp < thFor('sbp', 'hf.acute.shock_sbp'))) return null;
      return {
        id: 'rec_hf_teer',
        module: 'hf',
        tier: 'Can thiệp van tim qua ống thông (Class I - ESC 2026)',
        tierOrder: 3,
        action: 'CONSIDER',
        title: 'Hội chẩn Tim mạch (Heart Team) xem xét sửa van 2 lá qua ống thông (M-TEER)',
        rationale: `Ở bệnh nhân suy tim LVEF ${thFor('lvef', 'hf.teer.ef_min')}–${thFor('lvef', 'hf.teer.ef_max')}% còn hở van hai lá thứ phát mức độ nặng dai dẳng và có triệu chứng dù đã tối ưu FMT (kèm CRT nếu có chỉ định, sPAP <= ${thFor('spap', 'hf.teer.spap_max')} mmHg), ESC 2026 nâng M-TEER lên khuyến cáo Class I, Level B1 (Mỹ COR 2a, B-R) để giảm nhập viện suy tim và tử vong tim mạch.`,
        gates: [],
        citationIds: ['esc.hf.2026.teer_indication', 'esc.hf.2026.teer_table19_criteria'],
        priority: 78,
      };
    },
  },
  {
    id: 'hf.gdit.cardiac_rehab',
    module: 'hf',
    nameVi: 'Phục hồi chức năng tim mạch dựa trên vận động thể lực',
    setting: 'outpatient',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.rehab_indication'],
    when: (ctx) => {
      if (
        !hasHfContext(ctx) ||
        isAcutelyDecompensated(ctx) ||
        isOutpatientDecompensatedCrisis(ctx) ||
        hasAcuteKidneyInjury(ctx) ||
        hasAcuteBronchospasm(ctx) ||
        getCongestionStatus(ctx) === 'overt'
      ) {
        return false;
      }
      if (need(ctx, 'lvef') === undefined) return false;
      const sbp = need(ctx, 'sbp'), hr = need(ctx, 'hr'), k = need(ctx, 'k'), nyha = need(ctx, 'nyha');
      if (sbp === undefined || sbp < thFor('sbp', 'hf.sglt2i.sbp_caution_min')) return false;
      if (hr !== undefined && hr < thFor('hr', 'hf.bb.hr_min_start')) return false;
      if (k !== undefined && k >= thFor('k', 'hf.mra.k_stop')) return false;
      if (nyha === 4) return false;
      return true;
    },
    produce: () => ({
      id: 'rec_hf_cardiac_rehab',
      module: 'hf',
      tier: 'Chăm sóc đa chuyên khoa & Phục hồi chức năng (Class I)',
      tierOrder: 4,
      action: 'START',
      title: 'Tham gia chương trình phục hồi chức năng tim mạch và tập luyện thể lực có giám sát',
      rationale: 'Tập luyện phục hồi chức năng tim mạch (ESC 2026 Class I, Level B1) giúp cải thiện khả năng gắng sức, chất lượng cuộc sống và giảm nguy cơ nhập viện suy tim cho bệnh nhân suy tim mạn ổn định.',
      gates: [],
      profileDiff: {
        INTL: 'ESC 2026 khuyến cáo mức Class I, Level B1.',
        US: 'AHA/ACC/HFSA 2022 khuyến cáo mức COR 1, LOE A.',
        VN: 'BYT QĐ 1857/2022 khuyến cáo Class I cho mọi bệnh nhân suy tim mạn ổn định.',
      },
      citationIds: ['esc.hf.2026.rehab_indication'],
      priority: 64,
    }),
  },
];
