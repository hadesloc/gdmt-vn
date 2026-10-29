/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc An toàn Bình hít Đơn độc (SABA / LABA / LAMA không kèm ICS)
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation } from '../../engine/types';
import { cypControllerBridge } from './helpers.cyp3a4';
import { resolveKbDrugId } from '../../engine/safety/drugClassify';
import { hasCondition } from '../../engine/types';
import {
  COMBO_ICS_CONTROLLER_DRUGS,
  ICS_CONTAINING_DRUGS,
  LABA_WITHOUT_ICS_DRUGS,
  LAMA_WITHOUT_ICS_DRUGS,
  SABA_DRUGS,
  asthmaGate,
  asthmaRule,
  evaluateAcuteAsthma,
  isAdultOrAdolescent,
  isMartOveruse
} from './helpers';

const sabaMonoStopRules: Rule[] = Array.from(SABA_DRUGS).map((sabaId) =>
  asthmaRule({
    id: `asthma.safety.no_saba_monotherapy_${sabaId}`,
    setting: 'outpatient',
    nameVi: `Chống chỉ định điều trị hen đơn thuần bằng SABA (${sabaId})`,
    citationIds: [
      'gina.asthma.2026.never_saba_alone',
      'gina.asthma.2026.saba_regular_adverse',
      'byt.asthma.2020.no_saba_monotherapy'
    ],
    when: (ctx) => {
      const bridge = cypControllerBridge(ctx);
      if (bridge && !bridge.blocked && bridge.rescueId === resolveKbDrugId(sabaId)) return false;
      if (!isAdultOrAdolescent(ctx) || evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const hasThisSaba = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === sabaId);
      if (!hasThisSaba) return false;
      return !ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
    },
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === sabaId);
      const firstSaba = ctx.patient.currentMeds.find((m) => SABA_DRUGS.has(m.drugId.toLowerCase()));
      const isFirst = firstSaba?.drugId.toLowerCase() === sabaId;
      return {
        id: isFirst ? 'rec_asthma_no_saba_monotherapy' : `rec_asthma_no_saba_monotherapy_${sabaId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 98, // qa-allow: index - độ ưu tiên an toàn
        action: 'STOP',
        drugId: med?.drugId ?? sabaId,
        dose: undefined,
        title: `NGỪNG phác đồ chỉ dùng SABA đơn độc (${med?.name || sabaId}) — Không điều trị hen mà không có ICS`,
        rationale:
          'Theo GINA 2026 (Chứng cứ A) và Bộ Y tế QĐ 1851/2020, tuyệt đối không điều trị hen phế quản ở người lớn và thanh thiếu niên chỉ bằng SABA đơn thuần. Dùng SABA thường xuyên làm giảm điều hòa thụ thể beta-2, tăng viêm đường thở và tăng nguy cơ đợt cấp nặng cũng như tử vong do hen; bắt buộc chuyển sang phác đồ chứa ICS (ưu tiên ICS-formoterol Track 1).',
        gates: [asthmaGate('sabaOnly', false, `Đang dùng SABA (${sabaId}) không kèm thuốc kiểm soát chứa ICS`)],
        citationIds: [
          'gina.asthma.2026.never_saba_alone',
          'gina.asthma.2026.saba_regular_adverse',
          'byt.asthma.2020.no_saba_monotherapy'
        ]
      };
    }
  })
);

const track1SeparateSabaStopRules: Rule[] = Array.from(SABA_DRUGS).map((sabaId) =>
  asthmaRule({
    id: `asthma.safety.mart_stop_separate_saba_${sabaId}`,
    setting: 'outpatient',
    nameVi: `Ngừng bình SABA cắt cơn riêng lẻ khi áp dụng phác đồ Track 1 AIR/MART (${sabaId})`,
    citationIds: ['gina.asthma.2026.mart_saba_not_needed', 'gina.asthma.2026.track1_preferred'],
    when: (ctx) => {
      const bridge = cypControllerBridge(ctx);
      if (bridge && !bridge.blocked && bridge.rescueId === resolveKbDrugId(sabaId)) return false;
      if (!isAdultOrAdolescent(ctx) || evaluateAcuteAsthma(ctx).hasAcuteAttack || isMartOveruse(ctx)) {
        return false;
      }
      if (ctx.patient.selectedModules.includes('copd') || hasCondition(ctx, 'copd')) return false;
      const ci = ctx.patient.customInputs ?? {};
      if (ci.currentTrack === 'track2') return false;
      const hasThisSaba = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === sabaId);
      if (!hasThisSaba) return false;
      return ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
    },
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === sabaId);
      const medLabel = med?.name || sabaId;
      return {
        id: `rec_asthma_mart_stop_separate_saba_${sabaId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 94, // qa-allow: index - độ ưu tiên dọn đơn SABA dư thừa trên Track 1
        action: 'STOP',
        drugId: med?.drugId ?? sabaId,
        dose: undefined,
        title: `NGỪNG bình cắt cơn SABA riêng lẻ (${medLabel}) khi điều trị theo Track 1 (AIR/MART)`,
        rationale:
          'Theo GINA 2026 (Box 4-8), khi áp dụng Track 1 (dùng ICS-formoterol làm thuốc cắt cơn chống viêm ở mọi bậc AIR/MART), người bệnh KHÔNG dùng thêm bình xịt SABA riêng lẻ làm thuốc cắt cơn thường quy để tránh lạm dụng SABA không kèm ICS bảo vệ.',
        gates: [asthmaGate('currentTrack', false, `Đang giữ song song bình SABA (${sabaId}) trong Track 1`)],
        citationIds: ['gina.asthma.2026.mart_saba_not_needed', 'gina.asthma.2026.track1_preferred']
      };
    }
  })
);

const labaMonoStopRules: Rule[] = Array.from(LABA_WITHOUT_ICS_DRUGS).map((labaId) =>
  asthmaRule({
    id: `asthma.safety.no_laba_monotherapy_${labaId}`,
    setting: 'both',
    nameVi: `Chống chỉ định tuyệt đối LABA hoặc LABA/LAMA không kèm ICS (${labaId})`,
    citationIds: ['gina.asthma.2026.laba_without_ics_contra', 'gina.asthma.2026.laba_lama_without_ics_contra'],
    when: (ctx) => {
      const hasThisLaba = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === labaId);
      if (!hasThisLaba) return false;
      return !ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
    },
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === labaId);
      const firstLaba = ctx.patient.currentMeds.find((m) => LABA_WITHOUT_ICS_DRUGS.has(m.drugId.toLowerCase()));
      const isFirst = firstLaba?.drugId.toLowerCase() === labaId;
      return {
        id: isFirst ? 'rec_asthma_no_laba_monotherapy' : `rec_asthma_no_laba_monotherapy_${labaId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 100, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'STOP',
        drugId: med?.drugId ?? labaId,
        dose: undefined,
        title: `NGỪNG KHẨN CẤP ${med?.name || labaId}: Chống chỉ định tuyệt đối dùng LABA / LABA-LAMA không kèm ICS ở bệnh nhân hen`,
        rationale:
          'Chống chỉ định an toàn cấp cao nhất của GINA 2026, FDA Boxed Warning và Bộ Y tế QĐ 1851/2020: Tuyệt đối không sử dụng LABA hoặc phối hợp LABA-LAMA (Salmeterol, Formoterol, Indacaterol/Glycopyrronium, Umeclidinium/Vilanterol, Tiotropium/Olodaterol) mà không có ICS ở bệnh nhân hen phế quản (kể cả khi chồng lấp COPD), do làm tăng mạnh nguy cơ cơn hen ác tính gây tử vong.',
        gates: [asthmaGate('currentMeds', false, `Phát hiện ${med?.name || labaId} không kèm ICS`)],
        citationIds: ['gina.asthma.2026.laba_without_ics_contra', 'gina.asthma.2026.laba_lama_without_ics_contra']
      };
    }
  })
);

const lamaWithoutIcsStopRules: Rule[] = Array.from(LAMA_WITHOUT_ICS_DRUGS).map((lamaId) =>
  asthmaRule({
    id: `asthma.safety.no_lama_without_ics_${lamaId}`,
    setting: 'both',
    nameVi: `Chống chỉ định dùng LAMA đơn độc hoặc thiếu nền ICS-LABA (${lamaId})`,
    citationIds: ['gina.asthma.2026.lama_without_ics_contra', 'gina.asthma.2026.step5_lama_triplet'],
    when: (ctx) => {
      const hasThisLama = ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === lamaId);
      if (!hasThisLama) return false;
      const hasAnyIcs = ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
      if (!hasAnyIcs) return true;
      if (ctx.patient.selectedModules.includes('copd') || hasCondition(ctx, 'copd')) return false;
      const hasComboIcsLaba = ctx.patient.currentMeds.some((m) =>
        COMBO_ICS_CONTROLLER_DRUGS.has(m.drugId.toLowerCase())
      );
      if (!hasComboIcsLaba) return true;
      return lamaId !== 'tiotropium';
    },
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === lamaId);
      const hasAnyIcs = ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
      const medLabel = med?.name || lamaId;

      return {
        id: `rec_asthma_no_lama_without_ics_${lamaId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'STOP',
        drugId: med?.drugId ?? lamaId,
        dose: undefined,
        title: !hasAnyIcs
          ? `NGỪNG KHẨN CẤP ${medLabel}: Chống chỉ định dùng LAMA đơn độc không kèm ICS ở bệnh nhân hen`
          : `NGỪNG ${medLabel} rời: Trong hen phế quản, LAMA chỉ phối hợp ở Bậc 4–5 trên nền ICS-LABA (bình rời chỉ dùng Tiotropium Respimat)`,
        rationale: !hasAnyIcs
          ? 'Theo GINA 2026 (Chương 4 & Chương 7), tuyệt đối không điều trị bệnh nhân hen phế quản bằng LAMA (Tiotropium, Umeclidinium, Glycopyrronium, Aclidinium) mà không có ICS, vì làm tăng nguy cơ đợt cấp nặng đe dọa tính mạng.'
          : 'Theo GINA 2026 (Box 4-6 / Box 4-10), không cộng thêm LAMA đơn lẻ vào ICS đơn trị (phải ưu tiên ICS-LABA trước), và với dạng bình rời cộng thêm trên nền ICS-LABA chỉ có Tiotropium Respimat được phê duyệt cho hen.',
        gates: [
          asthmaGate(
            'currentMeds',
            false,
            !hasAnyIcs ? `Đang dùng LAMA (${lamaId}) không kèm ICS` : `Đang dùng ${lamaId} rời không đúng bậc hen`
          )
        ],
        citationIds: ['gina.asthma.2026.lama_without_ics_contra', 'gina.asthma.2026.step5_lama_triplet']
      };
    }
  })
);

export const asthmaInhalerSafetyRules: Rule[] = [
  ...sabaMonoStopRules,

  asthmaRule({
    id: 'asthma.safety.no_saba_monotherapy_flag_fallback',
    setting: 'outpatient',
    nameVi: 'Chống chỉ định điều trị hen đơn thuần bằng SABA (theo cờ lâm sàng)',
    citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.no_saba_monotherapy'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      const ci = ctx.patient.customInputs ?? {};
      const hasSabaInMeds = ctx.patient.currentMeds.some((m) => SABA_DRUGS.has(m.drugId.toLowerCase()));
      if (hasSabaInMeds) return false;
      const hasAnyIcs = ctx.patient.currentMeds.some((m) => ICS_CONTAINING_DRUGS.has(m.drugId.toLowerCase()));
      return Boolean(ci.sabaOnly) && !hasAnyIcs;
    },
    produce: (): Recommendation => ({
      id: 'rec_asthma_no_saba_monotherapy',
      module: 'asthma',
      tier: 'An toàn & Cảnh báo',
      tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 98, // qa-allow: index - độ ưu tiên an toàn
      action: 'STOP',
      drugId: 'salbutamol',
      dose: undefined,
      title: 'NGỪNG phác đồ chỉ dùng SABA đơn độc — Không điều trị hen mà không có ICS',
      rationale:
        'Theo GINA 2026 (Chứng cứ A) và Bộ Y tế QĐ 1851/2020, tuyệt đối không điều trị hen phế quản ở người lớn và thanh thiếu niên chỉ bằng SABA đơn thuần; bắt buộc chuyển sang phác đồ chứa ICS (ưu tiên ICS-formoterol Track 1).',
      gates: [asthmaGate('sabaOnly', false, 'Đang dùng SABA đơn độc không kèm ICS')],
      citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.no_saba_monotherapy']
    })
  }),

  ...track1SeparateSabaStopRules,
  ...labaMonoStopRules,
  ...lamaWithoutIcsStopRules
];
