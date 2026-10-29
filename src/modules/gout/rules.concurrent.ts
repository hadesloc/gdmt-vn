/**
 * GDMT-VN Gout Module - Concurrent Comorbidity Medication Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  THIAZIDE_DRUG_IDS,
  LOOP_DIURETIC_DRUG_IDS,
  RASI_ARNI_DRUG_IDS,
  STATIN_DRUG_IDS,
  FIBRATE_DRUG_IDS,
  getExpandedMedComponentIds,
  isFdcMed,
  isOnMed,
  findMed,
  parseMedDailyDoseMg,
  isPregnant,
  hasHepaticImpairment,
  hasHeartFailure,
  isFebuxostatBeingStopped,
  selectUltInitDrug,
  isOnDialysis
} from './helpers';
import { goutAspirinAndLifestyleRules } from './rules.lifestyle';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_COMORBID = 'Tối ưu thuốc đồng mắc & Lối sống';

export const goutConcurrentAndLifestyleRules: Rule[] = [
  goutRule({
    id: 'gout.concurrent.switch_thiazide',
    nameVi: 'Tối ưu thuốc hạ áp đồng mắc: Đổi lợi tiểu Thiazide (bao gồm viên phối hợp FDC) sang Losartan hoặc Chẹn kênh Canxi (CCB)',
    citationIds: [
      'acr.gout.2020.switch_thiazide_losartan',
      'acr.gout.2020.prefer_losartan',
      'eular.gout.2016.comorbid_meds_losartan_ccb',
      'kdigo.gout.2024.hyperkalemia_k_5_0'
    ],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !hasHeartFailure(ctx) &&
      (isOnMed(ctx, THIAZIDE_DRUG_IDS) || Boolean(ctx.normalized.customInputs?.takingThiazide)),
    produce: (ctx): Recommendation => {
      const k = need(ctx, 'k');
      const sbp = need(ctx, 'sbp');
      const egfr = need(ctx, 'egfr');
      const kMax = thFor('k', 'gout.concurrent.losartan_k_max');
      const sbpMin = thFor('sbp', 'gout.concurrent.sbp_hypotension_min');
      const egfrDialysis = thFor('egfr', 'gout.colchicine.egfr_dialysis_min');

      const rawNorm = ctx.normalized as unknown as {
        renalBruit?: boolean;
        allergyAceiArb?: boolean;
        priorAngioedema?: boolean;
      };

      const thzMed = findMed(ctx, THIAZIDE_DRUG_IDS);
      const thzComps = getExpandedMedComponentIds(thzMed?.drugId);
      const thzIsFdc = isFdcMed(thzMed);
      const fdcContainsLosartan = thzComps.includes('losartan');
      const nonLosartanRasi = RASI_ARNI_DRUG_IDS.filter((d) => d !== 'losartan');
      const onBlockingRasi = fdcContainsLosartan ? isOnMed(ctx, nonLosartanRasi) : isOnMed(ctx, RASI_ARNI_DRUG_IDS);

      const losartanBlocked = Boolean(
        onBlockingRasi ||
          hasCondition(ctx, 'renalBruit') ||
          hasCondition(ctx, 'allergyAceiArb') ||
          hasCondition(ctx, 'priorAngioedema') ||
          ctx.normalized.conditions?.hyperkalemia ||
          ctx.normalized.conditions?.bilateralRenalArteryStenosis ||
          isOnDialysis(ctx) ||
          rawNorm.renalBruit ||
          rawNorm.allergyAceiArb ||
          rawNorm.priorAngioedema ||
          (k !== undefined && k > kMax) ||
          (sbp !== undefined && sbp < sbpMin) ||
          (egfr !== undefined && egfr < egfrDialysis)
      );

      if (losartanBlocked) {
        const alreadyOnCcb = isOnMed(ctx, ['amlodipine', 'nifedipine', 'felodipine', 'lercanidipine']);
        if (thzIsFdc && alreadyOnCcb && thzMed?.drugId) {
          return goutRec({
            id: 'rec_gout_switch_thiazide_ccb',
            tier: TIER_COMORBID,
            tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
            priority: 72, // qa-allow: index - độ ưu tiên thuốc đồng mắc
            action: 'CONSIDER',
            drugId: thzMed.drugId,
            title: `Tách bỏ thành phần Thiazide khỏi viên phối hợp ${thzMed.drugId} (chuyển sang phối hợp đôi RASi + CCB không lợi tiểu)`,
            rationale:
              'Viên phối hợp hiện tại chứa thành phần lợi tiểu Thiazide làm giảm bài xuất urat qua ống thận. Khuyến cáo đổi sang viên phối hợp đôi ức chế trục RAA + Chẹn kênh Canxi (không chứa Hydrochlorothiazide/Indapamide) để duy trì kiểm soát huyết áp – bảo vệ thận và giảm tăng acid uric máu.',
            citationIds: [
              'acr.gout.2020.switch_thiazide_losartan',
              'eular.gout.2016.comorbid_meds_losartan_ccb'
            ]
          });
        }

        return goutRec({
          id: 'rec_gout_switch_thiazide_ccb',
          tier: TIER_COMORBID,
          tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 72, // qa-allow: index - độ ưu tiên thuốc đồng mắc
          action: 'SWITCH',
          drugId: 'amlodipine',
          switchFrom: thzMed?.drugId,
          title: thzIsFdc
            ? `Tách viên phối hợp ${thzMed?.drugId}: Giữ thuốc ức chế hệ RAA đơn chất và đổi thành phần Thiazide sang Amlodipine`
            : 'Cân nhắc đổi lợi tiểu Thiazide sang Chẹn kênh Canxi (Amlodipine) để giảm tăng acid uric máu',
          rationale: thzIsFdc
            ? 'Thành phần Thiazide/Indapamide trong viên phối hợp cố định làm giảm bài xuất urat qua ống thận. Khuyến cáo tách bỏ thành phần lợi tiểu Thiazide: duy trì thuốc ức chế trục RAA đơn chất đang dùng (hoặc đổi sang Losartan đơn chất nếu phù hợp) và phối hợp Chẹn kênh Canxi (Amlodipine) theo EULAR 2016 (Khuyến cáo 11).'
            : 'Lợi tiểu nhóm Thiazide làm giảm bài xuất urat qua ống thận. Do bệnh nhân đã đang dùng thuốc ức chế trục RAA hoặc có tăng Kali máu / chống chỉ định ARB, EULAR 2016 (Khuyến cáo 11) khuyến cáo đổi Thiazide sang Chẹn kênh Canxi (Amlodipine) an toàn với Kali máu và có lợi cho chuyển hóa urat.',
          citationIds: [
            'acr.gout.2020.switch_thiazide_losartan',
            'eular.gout.2016.comorbid_meds_losartan_ccb',
            'kdigo.gout.2024.hyperkalemia_k_5_0'
          ]
        });
      }

      const warns =
        k === undefined && (hasCondition(ctx, 'ckd') || (egfr !== undefined && egfr < thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold')))
          ? ['Bệnh nhân CKD chưa có xét nghiệm Kali máu gần đây: Kiểm tra Kali và Creatinin huyết thanh trước và sau 1–2 tuần chuyển sang Losartan.']
          : undefined;

      return goutRec({
        id: 'rec_gout_switch_thiazide_losartan',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 73, // qa-allow: index - độ ưu tiên thuốc đồng mắc
        action: 'SWITCH',
        drugId: 'losartan',
        switchFrom: thzMed?.drugId,
        title: fdcContainsLosartan
          ? `Đổi viên phối hợp ${thzMed?.drugId} sang Losartan đơn chất (bỏ thành phần Hydrochlorothiazide; phối hợp CCB nếu cần)`
          : 'Cân nhắc đổi lợi tiểu Thiazide sang Losartan (vừa kiểm soát huyết áp vừa tăng thải acid uric niệu)',
        rationale:
          'ACR 2020 (Table 8, PICO 47) và EULAR 2016 (Rec 11) khuyến cáo đổi Hydrochlorothiazide/Thiazide sang thuốc hạ áp khác khi khả thi và ưu tiên chọn Losartan nhờ tác dụng ức chế URAT1 tăng bài tiết acid uric qua nước tiểu.',
        warnings: warns,
        citationIds: ['acr.gout.2020.switch_thiazide_losartan', 'acr.gout.2020.prefer_losartan', 'eular.gout.2016.comorbid_meds_losartan_ccb']
      });
    }
  }),

  goutRule({
    id: 'gout.concurrent.review_loop_diuretic',
    nameVi: 'Rà soát chỉ định lợi tiểu quai ở bệnh nhân Gút không kèm suy tim hoặc quá tải dịch (EULAR 2016 Rec 11)',
    citationIds: ['eular.gout.2016.comorbid_meds_losartan_ccb', 'acr.gout.2020.switch_thiazide_losartan'],
    when: (ctx) => {
      if (isPregnant(ctx) || !isOnMed(ctx, LOOP_DIURETIC_DRUG_IDS)) return false;
      if (hasHeartFailure(ctx) || isOnDialysis(ctx) || hasHepaticImpairment(ctx)) return false;
      const egfr = need(ctx, 'egfr');
      const egfrSevere = thFor('egfr', 'gout.nsaid.egfr_contra_min');
      return egfr === undefined || egfr >= egfrSevere;
    },
    produce: (ctx): Recommendation => {
      const loopMed = findMed(ctx, LOOP_DIURETIC_DRUG_IDS);
      const egfrSevere = thFor('egfr', 'gout.nsaid.egfr_contra_min');
      return goutRec({
        id: 'rec_gout_review_loop_diuretic',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 66, // qa-allow: index - độ ưu tiên thuốc đồng mắc
        action: 'CONSIDER',
        drugId: loopMed?.drugId,
        title: `Rà soát chỉ định lợi tiểu quai (${loopMed?.drugId ?? 'Furosemide'}): Đổi sang Losartan hoặc CCB nếu chỉ dùng hạ áp đơn thuần`,
        rationale:
          `Theo EULAR 2016 (Khuyến cáo 11), lợi tiểu quai làm tăng mạnh tái hấp thu urat ở ống lượn gần và kích phát cơn gút cấp. Ở bệnh nhân không có suy tim, không xơ gan cổ trướng và eGFR ≥ ${egfrSevere} mL/phút, nếu lợi tiểu quai chỉ đang dùng để hạ huyết áp thì cân nhắc đổi sang Losartan hoặc Chẹn kênh Canxi (giữ nguyên nếu đang có chỉ định chống phù / quá tải thể tích thực sự).`,
        citationIds: ['eular.gout.2016.comorbid_meds_losartan_ccb', 'acr.gout.2020.switch_thiazide_losartan']
      });
    }
  }),

  goutRule({
    id: 'gout.concurrent.rosuvastatin_febuxostat_cap',
    nameVi: 'Giới hạn liều Rosuvastatin tối đa ≤ 20 mg/ngày khi dùng đồng thời với Febuxostat (ức chế BCRP)',
    citationIds: ['fda.rosuvastatin.febuxostat_max_20mg'],
    when: (ctx) => {
      if (isPregnant(ctx) || !isOnMed(ctx, ['rosuvastatin'])) return false;
      const onOrStartingFeb =
        (isOnMed(ctx, ['febuxostat']) && !isFebuxostatBeingStopped(ctx)) ||
        selectUltInitDrug(ctx) === 'febuxostat';
      if (!onOrStartingFeb) return false;
      const rosuDose = parseMedDailyDoseMg(findMed(ctx, ['rosuvastatin']));
      const maxRosu = thFor('dose_mg', 'gout.rosuvastatin.febuxostat_max_dose');
      return rosuDose === undefined || rosuDose > maxRosu;
    },
    produce: (ctx): Recommendation => {
      const rosuDose = parseMedDailyDoseMg(findMed(ctx, ['rosuvastatin']));
      const maxRosu = thFor('dose_mg', 'gout.rosuvastatin.febuxostat_max_dose');
      const exceeds = rosuDose !== undefined && rosuDose > maxRosu;
      return goutRec({
        id: 'rec_gout_rosuvastatin_febuxostat_cap',
        tier: exceeds ? TIER_SAFETY : TIER_COMORBID,
        tierOrder: exceeds ? 1 : 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: exceeds ? 93 : 68, // qa-allow: index - độ ưu tiên tương tác BCRP
        action: exceeds ? 'REDUCE' : 'MONITOR',
        drugId: 'rosuvastatin',
        dose: `Tối đa ≤ ${maxRosu} mg x 1 lần/ngày`,
        title: exceeds
          ? `GIẢM LIỀU Rosuvastatin xuống ≤ ${maxRosu} mg/ngày do tương tác ức chế BCRP với Febuxostat`
          : `Lưu ý giới hạn liều Rosuvastatin tối đa ≤ ${maxRosu} mg/ngày khi phối hợp Febuxostat`,
        rationale:
          `Febuxostat ức chế protein vận chuyển BCRP làm tăng gấp đôi diện tích dưới đường cong (AUC) của Rosuvastatin và tăng nguy cơ bệnh cơ / tiêu cơ vân. Theo nhãn FDA Crestor (Mục 2.5 & 7), không vượt quá ${maxRosu} mg Rosuvastatin x 1 lần/ngày khi dùng kèm Febuxostat.`,
        citationIds: ['fda.rosuvastatin.febuxostat_max_20mg']
      });
    }
  }),

  goutRule({
    id: 'gout.concurrent.prefer_losartan_htn',
    nameVi: 'Tăng huyết áp kèm Gút: Ưu tiên lựa chọn hoặc tối ưu sang Losartan khi phù hợp',
    citationIds: ['acr.gout.2020.prefer_losartan', 'eular.gout.2016.comorbid_meds_losartan_ccb'],
    when: (ctx) => {
      if (isPregnant(ctx) || !hasCondition(ctx, 'htn') || hasHeartFailure(ctx)) return false;
      if (isOnMed(ctx, THIAZIDE_DRUG_IDS) || Boolean(ctx.normalized.customInputs?.takingThiazide)) return false;
      if (isOnMed(ctx, ['losartan', 'sacubitril_valsartan'])) return false;
      const k = need(ctx, 'k');
      const kMax = thFor('k', 'gout.concurrent.losartan_k_max');
      return !isOnDialysis(ctx) && (k === undefined || k <= kMax);
    },
    produce: () =>
      goutRec({
        id: 'rec_gout_prefer_losartan_htn',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 62, // qa-allow: index - độ ưu tiên thuốc đồng mắc
        action: 'CONSIDER',
        title: 'Tối ưu điều trị Tăng huyết áp kèm Gút: Cân nhắc ưu tiên Losartan hoặc Chẹn kênh Canxi khi khả thi',
        rationale:
          'Theo ACR 2020 (PICO 47) và EULAR 2016 (Rec 11), ở bệnh nhân gút kèm tăng huyết áp, cân nhắc ưu tiên Losartan (hoặc đổi từ ACEi/ARB khác sang Losartan nếu phù hợp lâm sàng) nhờ hiệu ứng tăng thải acid uric qua thận phụ trợ.',
        citationIds: ['acr.gout.2020.prefer_losartan', 'eular.gout.2016.comorbid_meds_losartan_ccb']
      })
  }),

  goutRule({
    id: 'gout.concurrent.fenofibrate',
    nameVi: 'Rối loạn lipid máu kèm Gút: Không tự ý thêm hoặc đổi sang Fenofibrate chỉ để hạ acid uric máu',
    citationIds: ['acr.gout.2020.against_fenofibrate_switch', 'eular.gout.2016.comorbid_meds_losartan_ccb'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      (hasCondition(ctx, 'familialHypercholesterolemia') ||
        Boolean(ctx.normalized.conditions?.dyslipidemia) ||
        isOnMed(ctx, STATIN_DRUG_IDS) ||
        isOnMed(ctx, FIBRATE_DRUG_IDS)),
    produce: () =>
      goutRec({
        id: 'rec_gout_concurrent_fenofibrate_note',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 60, // qa-allow: index - độ ưu tiên thuốc đồng mắc
        action: 'MONITOR',
        title: 'Quản lý mỡ máu đồng mắc: Không tự ý đổi Statin sang Fenofibrate chỉ vì mục đích hạ acid uric',
        rationale:
          'ACR 2020 (Table 8, PICO 47) khuyến cáo có điều kiện KHÔNG thêm hoặc chuyển thuốc hạ lipid máu sang Fenofibrate đơn thuần để hạ urat do nguy cơ tác dụng phụ thận – cơ vượt trội lợi ích hạ urat nhẹ.',
        profileDiff: {
          US: 'ACR 2020: Khuyến cáo không thêm/đổi sang Fenofibrate chỉ để hạ acid uric máu; giữ nguyên Statin bảo vệ tim mạch.',
          INTL: 'EULAR 2016 Rec 11: Nếu có tăng Triglycerid máu thực sự cần dùng Fibrate, Fenofibrate có lợi thế tăng thải urat phụ trợ.'
        },
        citationIds: ['acr.gout.2020.against_fenofibrate_switch', 'eular.gout.2016.comorbid_meds_losartan_ccb']
      })
  }),

  goutRule({
    id: 'gout.concurrent.sglt2i_benefit',
    nameVi: 'Đồng lợi ích Tim – Thận – Chuyển hóa: Ghi nhận tác dụng giảm acid uric và biến cố gút của nhóm SGLT2i',
    citationIds: ['kdigo.gout.2024.sglt2i_urate_benefit'],
    when: (ctx) =>
      !isPregnant(ctx) &&
      !isOnDialysis(ctx) &&
      (hasCondition(ctx, 'dm') || hasCondition(ctx, 'ckd') || hasHeartFailure(ctx)),
    produce: () =>
      goutRec({
        id: 'rec_gout_sglt2i_cobeneft_note',
        tier: TIER_COMORBID,
        tierOrder: 7, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 58, // qa-allow: index - độ ưu tiên đồng lợi ích
        action: 'MONITOR',
        title: 'Liên kết Tim – Thận – Chuyển hóa: Nhóm ức chế SGLT2 mang lại đồng lợi ích giảm acid uric máu và cơn gút cấp',
        rationale:
          'Theo KDIGO 2024 (Mục 3.14), ở người bệnh kèm ĐTĐ típ 2, CKD hoặc Suy tim có chỉ định dùng SGLT2i, nhóm thuốc này giúp tăng thải glucose – urat qua ống thận, giảm nồng độ acid uric máu và giảm tần suất đợt gút cấp.',
        citationIds: ['kdigo.gout.2024.sglt2i_urate_benefit']
      })
  }),

  ...goutAspirinAndLifestyleRules
];
