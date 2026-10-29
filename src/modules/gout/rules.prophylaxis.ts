/**
 * GDMT-VN Gout Module - Pregnancy Safety & Flare Prophylaxis (3–6 Months) Rules
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  goutMissing,
  ULT_DRUG_IDS,
  NSAID_DRUG_IDS,
  SYSTEMIC_STEROID_IDS,
  isOnMed,
  findMed,
  isPregnant,
  isAcuteGoutFlare,
  isSepticArthritisOrFeverRedFlag,
  hasActiveInfection,
  isDkaSuspected,
  hasSevereUncontrolledHyperglycemia,
  isSteroidContraindicated,
  isTakingModerateCyp3a4,
  isOnDialysis,
  checkColchicineSafety,
  isNsaidAvoidedInGout,
  selectUltInitDrug,
  isUltNewlyStartedOrUptitrated
} from './helpers';
import { getSteroidClinicalWarnings } from './rules.safety.antiinflam';

const TIER_SAFETY = 'An toàn thuốc & Chống chỉ định';
const TIER_PROPH = 'Dự phòng cơn bùng phát khi dùng ULT';

const pregnancyUltStopRules: Rule[] = ULT_DRUG_IDS.map((ultId) =>
  goutRule({
    id: `gout.safety.pregnancy_stop_${ultId}`,
    nameVi: `Thai kỳ: Tạm ngừng ${ultId} đang dùng`,
    citationIds: [
      'fda.allopurinol.pregnancy',
      'fda.febuxostat.pregnancy',
      'eular.gout.2016.benzbromarone_hepatic_spc'
    ],
    when: (ctx) => isPregnant(ctx) && isOnMed(ctx, [ultId]),
    produce: () =>
      goutRec({
        id: `rec_gout_pregnancy_stop_${ultId}`,
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn thai kỳ
        action: 'STOP',
        drugId: ultId,
        title: `TẠM NGỪNG ${ultId.toUpperCase()} trong thai kỳ`,
        rationale:
          'Bệnh gút mạn tính không cấp thiết hơn an toàn thai nhi (dữ liệu thai kỳ hạn chế / qua nhau thai; Benzbromarone chống chỉ định trong thai kỳ). Khuyến cáo tạm ngừng thuốc hạ urat cho tới sau sinh và sau thời kỳ cho con bú.',
        citationIds: [
          'fda.allopurinol.pregnancy',
          'fda.febuxostat.pregnancy',
          'eular.gout.2016.benzbromarone_hepatic_spc'
        ]
      })
  })
);

const pregnancyNsaidStopRules: Rule[] = NSAID_DRUG_IDS.map((nsaidId) =>
  goutRule({
    id: `gout.safety.pregnancy_stop_nsaid_${nsaidId}`,
    nameVi: `Thai kỳ: Ngừng ngay NSAID ${nsaidId}`,
    citationIds: ['fda.celecoxib.fetal_toxicity_pregnancy', 'byt.gout.2014.nsaid_contra_p198'],
    when: (ctx) => isPregnant(ctx) && isOnMed(ctx, [nsaidId]),
    produce: () =>
      goutRec({
        id: `rec_gout_pregnancy_stop_nsaid_${nsaidId}`,
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn thai kỳ
        action: 'STOP',
        drugId: nsaidId,
        title: `NGỪNG KHẨN CẤP ${nsaidId.toUpperCase()} trong thai kỳ`,
        rationale:
          'Nhóm NSAID/COX-2i gây suy chức năng thận thai nhi dẫn đến thiểu ối (từ tuần 20) và đóng sớm ống động mạch thai nhi (từ tuần 30); chống chỉ định trong thai kỳ.',
        citationIds: ['fda.celecoxib.fetal_toxicity_pregnancy', 'byt.gout.2014.nsaid_contra_p198']
      })
  })
);

export const goutProphylaxisRules: Rule[] = [
  ...pregnancyUltStopRules,
  ...pregnancyNsaidStopRules,

  goutRule({
    id: 'gout.safety.pregnancy_ult_defer',
    nameVi: 'Thai kỳ: Trì hoãn khởi trị mới thuốc hạ acid uric máu cho tới sau sinh',
    citationIds: ['fda.allopurinol.pregnancy', 'fda.febuxostat.pregnancy'],
    when: (ctx) => isPregnant(ctx) && !isOnMed(ctx, ULT_DRUG_IDS),
    produce: () =>
      goutRec({
        id: 'rec_gout_pregnancy_ult_defer',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 90, // qa-allow: index - độ ưu tiên thai kỳ
        action: 'DEFER',
        title: 'Trì hoãn khởi trị thuốc hạ acid uric máu (ULT) trong thai kỳ',
        rationale:
          'Dữ liệu an toàn của thuốc hạ urat trên thai nhi còn hạn chế; trì hoãn khởi trị ULT cho tới sau khi sinh và ưu tiên xử trí triệu chứng bằng Corticosteroid ngắn ngày nếu có cơn cấp.',
        citationIds: ['fda.allopurinol.pregnancy', 'fda.febuxostat.pregnancy']
      })
  }),

  goutRule({
    id: 'gout.safety.pregnancy_colchicine',
    nameVi: 'Thai kỳ: Ngừng / Tránh dùng Colchicine điều trị gút',
    citationIds: ['fda.colchicine.pregnancy'],
    when: (ctx) => isPregnant(ctx) && isOnMed(ctx, ['colchicine']),
    produce: () =>
      goutRec({
        id: 'rec_gout_pregnancy_stop_colchicine',
        tier: TIER_SAFETY,
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên thai kỳ
        action: 'STOP',
        drugId: 'colchicine',
        title: 'NGỪNG Colchicine trong thai kỳ (ưu tiên Prednisolone ngắn ngày nếu có cơn gút cấp)',
        rationale:
          'Colchicine đi qua nhau thai (FDA Category C); đối với bệnh gút trong thai kỳ, ngừng Colchicine và ưu tiên Corticosteroid ngắn ngày hoặc tiêm nội khớp khi có cơn cấp.',
        citationIds: ['fda.colchicine.pregnancy']
      })
  }),

  goutRule({
    id: 'gout.prophylaxis.transition_after_flare',
    nameVi: 'Chuyển tiếp nối tiếp sang dự phòng chống viêm 3–6 tháng sau khi hoàn tất phác đồ cắt cơn cấp',
    citationIds: [
      'acr.gout.2020.start_ult_during_flare',
      'acr.gout.2020.prophylaxis_agents',
      'acr.gout.2020.prophylaxis_duration'
    ],
    when: (ctx) =>
      isAcuteGoutFlare(ctx) &&
      !isPregnant(ctx) &&
      !isSepticArthritisOrFeverRedFlag(ctx) &&
      selectUltInitDrug(ctx) !== 'none',
    produce: () => {
      const prophMin = thFor('duration_months', 'gout.prophylaxis.duration_months_min');
      const prophMax = thFor('duration_months', 'gout.prophylaxis.duration_months_max');
      return goutRec({
        id: 'rec_gout_prophylaxis_transition_after_flare',
        tier: TIER_PROPH,
        tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 80, // qa-allow: index - độ ưu tiên chuyển tiếp dự phòng
        action: 'MONITOR',
        title: `Lộ trình dự phòng nối tiếp: Chuyển sang dự phòng chống viêm liều thấp liên tục ${prophMin}–${prophMax} tháng ngay sau khi hết liều cắt cơn cấp`,
        rationale:
          `Khi khởi trị ULT ngay trong đợt gút cấp theo ACR 2020, chính phác đồ kháng viêm cắt cơn cấp đóng vai trò che chắn ban đầu (không kê chồng đồng thời 2 thuốc chống viêm cắt cơn + dự phòng cùng lúc). Ngay khi kết thúc liệu trình cắt cơn cấp, BẮT BUỘC nối tiếp bằng thuốc dự phòng liều thấp (Colchicine, NSAID hoặc Prednisolone liều thấp đã hiệu chỉnh theo eGFR và tương tác thuốc/Statin) duy trì đủ ${prophMin}–${prophMax} tháng.`,
        citationIds: [
          'acr.gout.2020.start_ult_during_flare',
          'acr.gout.2020.prophylaxis_agents',
          'acr.gout.2020.prophylaxis_duration'
        ]
      });
    }
  }),

  goutRule({
    id: 'gout.prophylaxis.flare',
    nameVi: 'Dự phòng chống viêm cơn gút bùng phát trong 3–6 tháng đầu khi khởi trị hoặc tăng liều ULT',
    citationIds: [
      'acr.gout.2020.prophylaxis_agents',
      'acr.gout.2020.prophylaxis_duration',
      'eular.gout.2016.flare_prophylaxis',
      'eular.gout.2016.colchicine_gfr30_avoid',
      'fda.colchicine.prophylaxis_dosage',
      'fda.colchicine.severe_renal_prophylaxis',
      'fda.colchicine.moderate_cyp3a4',
      'byt.gout.2014.colchicine_dosing'
    ],
    when: (ctx) => isUltNewlyStartedOrUptitrated(ctx) && !isOnMed(ctx, ['colchicine']),
    produce: (ctx): Recommendation => {
      const egfr = need(ctx, 'egfr');
      if (egfr === undefined && !isOnDialysis(ctx)) {
        return goutMissing('egfr', 'Cần eGFR để lựa chọn và chỉnh liều thuốc dự phòng cơn gút bùng phát khi dùng ULT.', [
          'eular.gout.2016.flare_prophylaxis'
        ]);
      }

      const prophMin = thFor('duration_months', 'gout.prophylaxis.duration_months_min');
      const prophMax = thFor('duration_months', 'gout.prophylaxis.duration_months_max');
      const severeMin = thFor('egfr', 'gout.colchicine.egfr_severe_renal_min');
      const colchSafety = checkColchicineSafety(ctx);

      if (!colchSafety.avoidProphylaxis) {
        const age = need(ctx, 'age');
        const ckdMin = thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold');
        const elderlyMin = thFor('age', 'gout.colchicine.elderly_age_min');

        const fdaSevere = thFor('dose_mg', 'gout.colchicine.severe_renal_start_dose');
        const fdaMod = thFor('dose_mg', 'gout.colchicine.moderate_cyp3a4_prophylaxis_dose');
        const fdaSingle = thFor('dose_mg', 'gout.colchicine.prophylaxis_fda_single_dose');
        const eularMin = thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_min');
        const eularMax = thFor('dose_mg', 'gout.colchicine.prophylaxis_dose_max');

        let doseStr: string;
        const warns: string[] = [
          `Duy trì dự phòng liên tục trong ${prophMin}–${prophMax} tháng (tiếp tục kéo dài hơn nếu bệnh nhân vẫn còn đợt gút cấp hoặc còn hạt tophi đang tan theo ACR 2020).`
        ];
        if (colchSafety.statinWarning) {
          warns.push('Đang dùng kèm Statin/Fibrate: Theo dõi sát đau cơ, yếu cơ để phát hiện sớm bệnh cơ thần kinh – tiêu cơ vân.');
        }

        if (egfr !== undefined && egfr < severeMin && ctx.settings.profile === 'US') {
          doseStr = `${fdaSevere} mg x 1 lần/ngày trong ${prophMin}–${prophMax} tháng (giảm liều do suy thận nặng)`;
          warns.push(`Suy thận nặng (GFR < ${severeMin} mL/phút): Theo dõi sát công thức máu, tiêu chảy và triệu chứng thần kinh – cơ.`);
        } else if (isTakingModerateCyp3a4(ctx)) {
          doseStr =
            ctx.settings.profile === 'US'
              ? `${fdaMod} mg x 1–2 lần/ngày (hoặc ${fdaSingle} mg x 1 lần/ngày) trong ${prophMin}–${prophMax} tháng`
              : `${eularMin} mg uống cách ngày (1/2 viên ${eularMax} mg mỗi 48 giờ) trong ${prophMin}–${prophMax} tháng`;
          warns.push('Đang dùng thuốc ức chế vừa CYP3A4: Bắt buộc giảm liều dự phòng Colchicine để tránh tích lũy độc tính.');
        } else if ((egfr !== undefined && egfr < ckdMin) || (age !== undefined && age > elderlyMin)) {
          if (ctx.settings.profile === 'US') {
            doseStr = `${fdaSingle} mg x 1 lần/ngày trong ${prophMin}–${prophMax} tháng`;
            warns.push(
              `CKD giai đoạn 3 hoặc người > ${elderlyMin} tuổi: Dùng ${fdaSingle} mg x 1 lần/ngày (không tăng lên 2 lần/ngày; giảm xuống ${fdaSevere} mg/ngày nếu kém dung nạp).`
            );
          } else {
            doseStr = `${eularMin} mg x 1 lần/ngày trong ${prophMin}–${prophMax} tháng`;
            warns.push(
              `CKD giai đoạn 3 hoặc người > ${elderlyMin} tuổi: Giới hạn liều dự phòng tối đa ${eularMin} mg/ngày (không tăng lên ${eularMax} mg/ngày).`
            );
          }
        } else {
          doseStr =
            ctx.settings.profile === 'US'
              ? `${fdaSingle} mg x 1–2 lần/ngày trong ${prophMin}–${prophMax} tháng`
              : `${eularMin}–${eularMax} mg/ngày trong ${prophMin}–${prophMax} tháng`;
        }

        return goutRec({
          id: 'rec_gout_colchicine_prophylaxis',
          tier: TIER_PROPH,
          tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 82, // qa-allow: index - độ ưu tiên dự phòng
          action: 'START',
          drugId: 'colchicine',
          dose: doseStr,
          title: `Dự phòng cơn gút bùng phát bằng Colchicine liều thấp (${doseStr})`,
          rationale:
            `ACR 2020 và EULAR 2016 khuyến cáo mạnh phối hợp thuốc chống viêm dự phòng trong ${prophMin}–${prophMax} tháng đầu khi khởi trị hoặc chuẩn độ tăng liều ULT nhằm ngăn ngừa cơn gút cấp do huy động tinh thể urat.`,
          warnings: warns,
          profileDiff: {
            US: `FDA / ACR 2020: Viên ${fdaSingle} mg x 1–2 lần/ngày (suy thận nặng CrCl < ${severeMin} mL/phút khởi đầu ${fdaSevere} mg/ngày).`,
            INTL: `EULAR 2016: ${eularMin}–${eularMax} mg/ngày (CKD G3 giảm còn ${eularMin} mg/ngày; GFR < ${severeMin} mL/phút tránh Colchicine, chuyển sang Prednisolone liều thấp).`,
            VN: `BYT 361/2014 (viên ${eularMax} mg): ${eularMin}–${eularMax} mg/ngày; CKD G3 hoặc > ${elderlyMin} tuổi dùng ${eularMin} mg/ngày; GFR < ${severeMin} mL/phút ưu tiên Prednisolone liều thấp.`
          },
          citationIds: [
            'acr.gout.2020.prophylaxis_agents',
            'acr.gout.2020.prophylaxis_duration',
            'eular.gout.2016.flare_prophylaxis',
            'fda.colchicine.prophylaxis_dosage',
            'fda.colchicine.severe_renal_prophylaxis',
            'fda.colchicine.moderate_cyp3a4',
            'byt.gout.2014.colchicine_dosing'
          ]
        });
      }

      if (!isNsaidAvoidedInGout(ctx).avoid && !isOnMed(ctx, NSAID_DRUG_IDS)) {
        const napProph = thFor('dose_mg', 'gout.naproxen.prophylaxis_dose');
        return goutRec({
          id: 'rec_gout_nsaid_prophylaxis',
          tier: TIER_PROPH,
          tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 81, // qa-allow: index - độ ưu tiên dự phòng
          action: 'START',
          drugId: 'naproxen',
          dose: `${napProph} mg x 2 lần/ngày sau ăn trong ${prophMin}–${prophMax} tháng (kèm PPI nếu có nguy cơ tiêu hóa)`,
          title: 'Dự phòng cơn bùng phát bằng NSAID liều thấp (Naproxen) do không dùng được Colchicine',
          rationale:
            'Khi Colchicine chống chỉ định nhưng chức năng thận bảo tồn và không có bệnh tim mạch/loét tiêu hóa/chống đông/AERD, NSAID liều thấp là lựa chọn dự phòng thay thế hiệu quả theo ACR 2020 và EULAR 2016.',
          citationIds: ['acr.gout.2020.prophylaxis_agents', 'acr.gout.2020.prophylaxis_duration', 'eular.gout.2016.naproxen_prophylaxis']
        });
      }

      if (
        isSteroidContraindicated(ctx) ||
        hasActiveInfection(ctx) ||
        isDkaSuspected(ctx) ||
        hasSevereUncontrolledHyperglycemia(ctx)
      ) {
        return goutRec({
          id: 'rec_gout_prophylaxis_all_contra_refer',
          tier: TIER_PROPH,
          tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 82, // qa-allow: index - độ ưu tiên an toàn dự phòng
          action: 'REFER',
          title: 'Hội chẩn chuyên khoa Cơ xương khớp: Chống chỉ định cả 3 nhóm dự phòng cơn bùng phát (Colchicine, NSAID & Corticosteroid)',
          rationale:
            'Bệnh nhân hiện chống chỉ định/cần tránh cả Colchicine, NSAID lẫn Corticosteroid đường toàn thân (nhiễm trùng tiến triển, dị ứng steroid hoặc mất bù đường huyết nặng/DKA). Khuyến cáo tạm hoãn tăng bậc ULT có chọn lọc cho tới khi kiểm soát ổn định chống chỉ định, hoặc hội chẩn chuyên khoa Cơ xương khớp (cân nhắc ức chế IL-1 dự phòng ở gút nặng sau khi đã loại trừ nhiễm trùng).',
          citationIds: [
            'acr.gout.2020.prophylaxis_agents',
            'acr.gout.2020.il1_inhibitor_flare',
            'eular.gout.2016.il1_blockers_flare'
          ]
        });
      }

      const existingSteroid = findMed(ctx, SYSTEMIC_STEROID_IDS);
      if (existingSteroid?.drugId) {
        return goutRec({
          id: 'rec_gout_steroid_prophylaxis_existing',
          tier: TIER_PROPH,
          tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 81, // qa-allow: index - độ ưu tiên dự phòng
          action: 'CONTINUE',
          drugId: existingSteroid.drugId,
          title: `Sử dụng chính ${existingSteroid.drugId} đang dùng làm nền dự phòng cơn gút bùng phát (KHÔNG kê chồng thêm Prednisolone)`,
          rationale:
            'Bệnh nhân đã đang dùng Corticosteroid đường toàn thân và chống chỉ định cả Colchicine lẫn NSAID; tuyệt đối không kê chồng thêm một Corticosteroid thứ hai.',
          warnings: getSteroidClinicalWarnings(ctx),
          citationIds: ['acr.gout.2020.prophylaxis_agents', 'acr.gout.2020.prophylaxis_duration']
        });
      }

      return goutRec({
        id: 'rec_gout_steroid_prophylaxis',
        tier: TIER_PROPH,
        tierOrder: 5, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 81, // qa-allow: index - độ ưu tiên dự phòng
        action: 'START',
        drugId: 'prednisolone',
        dose: `Liều thấp tối thiểu hiệu quả uống buổi sáng sau ăn trong ${prophMin}–${prophMax} tháng (giảm liều dần khi ngừng)`,
        title: 'Dự phòng cơn gút bùng phát bằng Prednisolone liều thấp (do chống chỉ định/tránh cả Colchicine và NSAID)',
        rationale:
          `Ở bệnh nhân suy thận nặng (eGFR < ${severeMin} mL/phút trên hồ sơ INTL/VN, hoặc lọc máu) hoặc đang dùng Statin/CYP3A4i kèm CKD/CVD/AERD khiến cả Colchicine và NSAID đều cần tránh, ACR 2020 khuyến cáo dùng Prednisolone/Prednisone liều thấp tối thiểu kiểm soát được cơn trong ${prophMin}–${prophMax} tháng.`,
        warnings: [
          ...getSteroidClinicalWarnings(ctx),
          'Đánh giá định kỳ để giảm liều dần và ngừng sớm ngay khi đạt đích urat ổn định không còn cơn cấp nhằm hạn chế tác dụng phụ Cushing, loãng xương và tăng đường huyết.'
        ],
        citationIds: ['acr.gout.2020.prophylaxis_agents', 'acr.gout.2020.prophylaxis_duration', 'eular.gout.2016.colchicine_gfr30_avoid']
      });
    }
  })
];
