/**
 * GDMT-VN Gout Module - Primary Acute Flare Anti-inflammatory Treatment Rule
 * Phân quyền: Agent K
 */

import type { Rule, Recommendation } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  goutRule,
  goutRec,
  NSAID_DRUG_IDS,
  NON_GOUT_CONTINUABLE_NSAID_IDS,
  findAllMeds,
  isAcuteGoutFlare,
  isSeverePolyarticularFlare,
  isTakingModerateCyp3a4,
  isNsaidAvoidedInGout,
  checkColchicineSafety
} from './helpers';
import { getSteroidClinicalWarnings, shouldStopActiveNsaid } from './rules.safety.antiinflam';
import { goutFlareAdjunctRules, isLateFlarePresentation } from './rules.flare.adjuncts';
import { resolveSpecialFlareBranch } from './rules.flare.special';

const TIER_FLARE = 'Xử trí cơn gút cấp';

export const goutFlareRules: Rule[] = [
  goutRule({
    id: 'gout.acute_flare.treatment',
    nameVi: 'Phác đồ chống viêm cắt cơn gút cấp cá thể hóa (ưu tiên sàng lọc viêm khớp nhiễm khuẩn)',
    citationIds: [
      'byt.gout.2014.septic_arthritis_exclude_p93',
      'byt.gout.2014.septic_arthritis_urgent_workup_p96',
      'acr.gout.2020.flare_first_line',
      'acr.gout.2020.colchicine_low_dose',
      'acr.gout.2020.npo_parenteral_steroid',
      'acr.gout.2020.il1_inhibitor_flare',
      'acr.gout.2020.medication_in_pocket',
      'eular.gout.2016.flare_options',
      'eular.gout.2016.pill_in_pocket',
      'eular.gout.2016.il1_blockers_flare',
      'fda.colchicine.flare_during_prophylaxis_wait12h',
      'kdigo.gout.2024.acute_flare_ckd'
    ],
    when: (ctx) => isAcuteGoutFlare(ctx),
    produce: (ctx): Recommendation => {
      const specialRec = resolveSpecialFlareBranch(ctx);
      if (specialRec) return specialRec;

      const egfr = need(ctx, 'egfr');
      const predMin = thFor('dose_mg', 'gout.prednisolone.flare_dose_min');
      const predMax = thFor('dose_mg', 'gout.prednisolone.flare_dose_max');
      const predDaysMin = thFor('duration_days', 'gout.prednisolone.flare_duration_days_min');
      const predDaysMax = thFor('duration_days', 'gout.prednisolone.flare_duration_days_max');

      const colchSafety = checkColchicineSafety(ctx);
      const nsaidCheck = isNsaidAvoidedInGout(ctx);
      const earlyColchHours = thFor('duration_hours', 'gout.flare.colchicine_early_hours');
      const latePresentation = isLateFlarePresentation(ctx);

      if (!colchSafety.avoidFlare && !latePresentation) {
        if (colchSafety.needsReducedDose && isTakingModerateCyp3a4(ctx)) {
          const modDose = thFor('dose_mg', 'gout.colchicine.moderate_cyp3a4_flare_dose');
          const eularInit = thFor('dose_mg', 'gout.colchicine.flare_eular_initial');
          const repeatDays = thFor('duration_days', 'gout.colchicine.moderate_cyp3a4_repeat_days');
          const doseText =
            ctx.settings.profile === 'VN'
              ? `${eularInit} mg × 1 liều duy nhất, không lặp lại sớm hơn ${repeatDays} ngày`
              : `${modDose} mg × 1 liều duy nhất, không lặp lại sớm hơn ${repeatDays} ngày`;
          const warns = [
            `Đang dùng thuốc ức chế vừa CYP3A4: Chỉ uống 1 liều duy nhất, không uống liều thứ hai sau 1 giờ và không lặp lại sớm hơn ${repeatDays} ngày.`,
            'Tư vấn chiến lược mang sẵn thuốc bên người (“pill-in-the-pocket”) cho các đợt sau để tự uống sớm ngay khi có triệu chứng báo hiệu đầu tiên.'
          ];
          if (colchSafety.statinWarning) {
            warns.push('Đang dùng kèm Statin/Fibrate: Theo dõi sát đau cơ, yếu cơ để phát hiện sớm tiêu cơ vân.');
          }
          return goutRec({
            id: 'rec_gout_colchicine_acute_flare_reduced',
            tier: TIER_FLARE,
            tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
            priority: 88, // qa-allow: index - độ ưu tiên cắt cơn
            action: 'START',
            drugId: 'colchicine',
            dose: doseText,
            title: `Colchicine cắt cơn giảm liều do tương tác CYP3A4 vừa (${doseText})`,
            rationale:
              'Theo nhãn FDA Colcrys (Bảng 1), khi phối hợp chất ức chế vừa CYP3A4 trên người chưa dùng Colchicine dự phòng và có chức năng thận – gan bình thường, phác đồ cắt cơn phải giảm còn 1 liều nạp duy nhất và không lặp lại sớm hơn 3 ngày.',
            warnings: warns,
            citationIds: ['fda.colchicine.moderate_cyp3a4', 'acr.gout.2020.colchicine_low_dose', 'eular.gout.2016.pill_in_pocket']
          });
        }

        const fdaInit = thFor('dose_mg', 'gout.colchicine.flare_initial_dose');
        const fdaSec = thFor('dose_mg', 'gout.colchicine.flare_second_dose');
        const eularInit = thFor('dose_mg', 'gout.colchicine.flare_eular_initial');
        const eularSec = thFor('dose_mg', 'gout.colchicine.flare_eular_second');
        const hourInt = thFor('duration_hours', 'gout.colchicine.flare_hour_interval');
        const waitHours = thFor('duration_hours', 'gout.colchicine.prophylaxis_resume_wait_hours');

        const baseDoseStr =
          ctx.settings.profile === 'VN'
            ? `${eularInit} mg ngay khi khởi phát cơn, sau đó ${eularSec} mg sau ${hourInt} giờ`
            : `${fdaInit} mg ngay khi khởi phát cơn, sau đó ${fdaSec} mg sau ${hourInt} giờ`;

        const doseStr = colchSafety.alreadyOnProphylaxis
          ? `${baseDoseStr}; sau đó TẠM NGỪNG liều dự phòng trong ${waitHours} giờ rồi mới nối lại liều dự phòng hàng ngày`
          : baseDoseStr;

        const warns = [
          `Hiệu quả tối ưu khi uống sớm trong vòng ${earlyColchHours} giờ đầu (“pill-in-the-pocket” / “medication-in-pocket” ngay khi chớm đau khớp); tuyệt đối KHÔNG dùng phác đồ Colchicine liều cao kiểu cũ.`
        ];
        if (colchSafety.alreadyOnProphylaxis) {
          warns.unshift(
            `Bệnh nhân đang uống sẵn Colchicine dự phòng (thận – gan bình thường, không dùng CYP3A4i): Theo nhãn FDA Colcrys (Mục 2.1), sau khi uống liều cắt cơn BẮT BUỘC tạm nghỉ ${waitHours} giờ rồi mới uống lại liều dự phòng thường ngày.`
          );
        }
        if (colchSafety.statinWarning) {
          warns.push('Đang dùng kèm Statin/Fibrate: Cảnh báo bệnh nhân theo dõi đau cơ, yếu cơ hoặc nước tiểu sẫm màu (nguy cơ bệnh cơ/tiêu cơ vân).');
        }
        if (egfr !== undefined && egfr < thFor('egfr', 'gout.allopurinol.egfr_ckd_threshold')) {
          warns.push('Suy thận mức độ vừa (CKD giai đoạn 3): Theo dõi sát tiêu chảy và không lặp lại đợt cắt cơn Colchicine trong vòng 14 ngày.');
        }

        return goutRec({
          id: 'rec_gout_colchicine_acute_flare',
          tier: TIER_FLARE,
          tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 88, // qa-allow: index - độ ưu tiên cắt cơn
          action: 'START',
          drugId: 'colchicine',
          dose: doseStr,
          title: 'Cắt cơn gút cấp bằng Colchicine phác đồ liều thấp (Low-dose)',
          rationale:
            'ACR 2020 và EULAR 2016 khuyến cáo mạnh dùng Colchicine liều thấp thay vì liều cao do hiệu quả giảm đau tương đương nhưng giảm rõ rệt độc tính tiêu hóa; giáo dục bệnh nhân chuẩn bị sẵn thuốc bên người (“pill-in-the-pocket”) để uống ngay từ triệu chứng cảnh báo đầu tiên.',
          warnings: warns,
          profileDiff: {
            US: `FDA / ACR 2020: ${fdaInit} mg khởi đầu, sau đó ${fdaSec} mg sau ${hourInt} giờ (tổng ${fdaInit + fdaSec} mg ngày 1; nếu đang dùng dự phòng thì nghỉ ${waitHours} giờ trước khi uống lại liều dự phòng).`,
            INTL: `EULAR 2016: ${eularInit} mg khởi đầu, sau đó ${eularSec} mg sau ${hourInt} giờ trong vòng ${earlyColchHours} giờ đầu (“pill-in-the-pocket”).`,
            VN: `Thực hành tại Việt Nam (viên ${eularInit} mg): ${eularInit} mg khởi đầu, sau đó ${eularSec} mg sau ${hourInt} giờ.`
          },
          citationIds: [
            'acr.gout.2020.colchicine_low_dose',
            'acr.gout.2020.medication_in_pocket',
            'fda.colchicine.flare_treatment',
            'fda.colchicine.flare_during_prophylaxis_wait12h',
            'eular.gout.2016.flare_options',
            'eular.gout.2016.pill_in_pocket',
            'fda.colchicine.statin_fibrate_myopathy'
          ]
        });
      }

      if (!nsaidCheck.avoid) {
        const activeSafeNsaid = findAllMeds(ctx, NSAID_DRUG_IDS).find(
          (m) =>
            m.drugId &&
            !NON_GOUT_CONTINUABLE_NSAID_IDS.includes(m.drugId.toLowerCase()) &&
            !shouldStopActiveNsaid(ctx, m.drugId).stop
        );
        if (activeSafeNsaid?.drugId) {
          return goutRec({
            id: 'rec_gout_nsaid_continue_flare',
            tier: TIER_FLARE,
            tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
            priority: 86, // qa-allow: index - độ ưu tiên cắt cơn
            action: 'CONTINUE',
            drugId: activeSafeNsaid.drugId,
            title: `Tiếp tục NSAID đang dùng (${activeSafeNsaid.drugId}) đủ liều kháng viêm ngắn ngày, KHÔNG kê chồng thêm NSAID thứ hai`,
            rationale:
              'Bệnh nhân đã đang dùng một thuốc NSAID hợp lệ và không có chống chỉ định. Tuyệt đối không kê chồng thêm Naproxen hay NSAID thứ hai; nếu không đáp ứng sau 48–72 giờ, ngừng NSAID cũ trước khi đổi sang Corticosteroid.',
            citationIds: ['acr.gout.2020.flare_first_line', 'eular.gout.2016.flare_options', 'byt.gout.2014.nsaid_dosing_p201']
          });
        }

        const napDose = thFor('dose_mg', 'gout.naproxen.flare_dose');
        const napDays = thFor('duration_days', 'gout.naproxen.flare_duration_days');
        return goutRec({
          id: 'rec_gout_nsaid_acute_flare',
          tier: TIER_FLARE,
          tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
          priority: 86, // qa-allow: index - độ ưu tiên cắt cơn
          action: 'START',
          drugId: 'naproxen',
          dose: `${napDose} mg x 2 lần/ngày sau ăn trong ${napDays} ngày`,
          title: 'Cắt cơn gút cấp bằng NSAID ngắn ngày (Naproxen)',
          rationale:
            'Khi Colchicine không phù hợp nhưng chức năng thận bảo tồn và không có bệnh tim mạch/tiêu hóa/chống đông/AERD, NSAID liều kháng viêm ngắn ngày là lựa chọn đầu tay hiệu quả.',
          warnings: [
            'Uống sau ăn no; nếu đang dùng Aspirin liều thấp, uống Aspirin trước Naproxen ít nhất 2 giờ (BYT 361/2014 tr. 199) và phối hợp PPI bảo vệ dạ dày.',
            'Giáo dục người bệnh chuẩn bị sẵn thuốc cắt cơn tại nhà (“medication-in-pocket”) để xử trí sớm ngay khi có dấu hiệu báo trước đợt sau.'
          ],
          citationIds: [
            'acr.gout.2020.flare_first_line',
            'acr.gout.2020.medication_in_pocket',
            'eular.gout.2016.naproxen_flare',
            'byt.gout.2014.nsaid_cv_aspirin_p199'
          ]
        });
      }

      const steroidWarnings = [...getSteroidClinicalWarnings(ctx)];
      if (isSeverePolyarticularFlare(ctx)) {
        steroidWarnings.push(
          'Cơn viêm đa khớp nặng / dễ tái bùng phát: Cân nhắc phác đồ dùng liều đủ 2–5 ngày đầu sau đó giảm liều dần trong 7–10 ngày (theo ACR 2020) để tránh cơn gút bật lại (rebound flare).'
        );
      }

      return goutRec({
        id: 'rec_gout_oral_corticosteroid_flare',
        tier: TIER_FLARE,
        tierOrder: 2, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 86, // qa-allow: index - độ ưu tiên cắt cơn
        action: 'START',
        drugId: 'prednisolone',
        dose: `${predMin}–${predMax} mg/ngày uống buổi sáng sau ăn trong ${predDaysMin}–${predDaysMax} ngày`,
        title: 'Cắt cơn gút cấp bằng Corticosteroid đường uống (Prednisolone)',
        rationale:
          'Khi cả Colchicine và NSAID đều cần tránh (suy thận mạn kèm tương tác thuốc/đang uống Colchicine dự phòng, bệnh tim mạch, loét tiêu hóa, chống đông hoặc AERD), Glucocorticoid đường uống ngắn ngày là phác đồ đầu tay an toàn theo KDIGO 2024, EULAR 2016 và ACR 2020.',
        warnings: steroidWarnings,
        profileDiff: {
          INTL: `EULAR 2016: Prednisolone ${predMin}–${predMax} mg/ngày trong ${predDaysMin}–${predDaysMax} ngày; hướng dẫn người bệnh chiến lược “pill-in-the-pocket”.`,
          US: 'ACR 2020: Prednisone/Prednisolone khởi đầu liều kháng viêm 2–5 ngày đầu hoặc giảm liều dần 7–10 ngày để tránh cơn bật lại.',
          VN: 'BYT 2024 CKD Bảng 22: Ưu tiên Glucocorticoid ở bệnh nhân bệnh thận mạn giai đoạn nặng khi chống chỉ định Colchicine và NSAID.'
        },
        citationIds: [
          'eular.gout.2016.flare_options',
          'acr.gout.2020.flare_first_line',
          'acr.gout.2020.medication_in_pocket',
          'kdigo.gout.2024.acute_flare_ckd',
          'byt.ckd.2024.gout_flare_table22'
        ]
      });
    }
  }),

  ...goutFlareAdjunctRules
];
