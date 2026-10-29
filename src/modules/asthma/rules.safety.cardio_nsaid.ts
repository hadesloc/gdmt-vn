/**
 * GDMT-VN Module Hen phế quản (Asthma) - Quy tắc An toàn Chẹn Beta & Cơ địa nhạy cảm Aspirin/NSAID (AERD)
 * Phân quyền: Agent M
 */

import type { Rule, Recommendation, CurrentMed } from '../../engine/types';
import { hasCondition } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  AERD_COX1_NSAID_DRUGS,
  AERD_SELECTIVE_COX2_DRUGS,
  NON_SELECTIVE_BB_DRUGS,
  SYSTEMIC_NON_SELECTIVE_BB_DRUGS,
  asDose,
  asthmaGate,
  asthmaRule,
  evaluateAcuteAsthma,
  hasCustomCond,
  hasPatientAerd,
  isAdultOrAdolescent,
  isAllergicToDrug,
  isMedOffendingBetaBlocker,
  isPatientPregnant
} from './helpers';

function getCustomTimololMeds(ctx: Parameters<Rule['when']>[0]): CurrentMed[] {
  const seen = new Set<string>();
  const out: CurrentMed[] = [];
  for (const m of ctx.patient.currentMeds) {
    const id = m.drugId.toLowerCase();
    if (NON_SELECTIVE_BB_DRUGS.has(id)) continue;
    if (isMedOffendingBetaBlocker(m) && !seen.has(id)) {
      seen.add(id);
      out.push(m);
    }
  }
  return out;
}

const betaBlockerStopRules: Rule[] = Array.from(NON_SELECTIVE_BB_DRUGS).map((bbId) =>
  asthmaRule({
    id: `asthma.safety.non_selective_betablocker_${bbId}`,
    setting: 'both',
    nameVi: `Cảnh báo thuốc chẹn beta không chọn lọc / nhỏ mắt (${bbId})`,
    citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm'],
    when: (ctx) => ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === bbId),
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === bbId);
      const firstBb = ctx.patient.currentMeds.find((m) => isMedOffendingBetaBlocker(m));
      const isFirst = firstBb?.drugId.toLowerCase() === bbId;
      const isEyeDrop = bbId.includes('timolol') || bbId === 'carteolol' || bbId === 'levobunolol';

      return {
        id: isFirst ? 'rec_asthma_nonselective_bb_contra' : `rec_asthma_nonselective_bb_contra_${bbId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 96, // qa-allow: index - độ ưu tiên an toàn
        action: 'STOP',
        drugId: med?.drugId ?? bbId,
        dose: undefined,
        title: `NGỪNG thuốc chẹn beta không chọn lọc (${med?.name || bbId}) — Nguy cơ co thắt phế quản cấp`,
        rationale: isEyeDrop
          ? `Thuốc nhỏ mắt chứa chẹn beta không chọn lọc (${med?.name || bbId}) hấp thu trực tiếp qua ống lệ mũi vào tuần hoàn hệ thống, có thể gây co thắt phế quản cấp nặng và mất tác dụng thuốc cắt cơn. Cần ngừng và hội chẩn Nhãn khoa đổi sang nhóm hạ nhãn áp khác (Latanoprost đơn chất, Brimonidine hoặc Dorzolamide đơn chất).`
          : `Thuốc chẹn beta không chọn lọc (${med?.name || bbId}) ức chế thụ thể beta-2 phế quản, có thể khởi phát co thắt phế quản cấp đe dọa tính mạng. Nếu có chỉ định HFrEF bắt buộc khi hen đã ổn định, hội chẩn Tim mạch chuyển sang chẹn beta-1 chọn lọc cao (Bisoprolol, Metoprolol succinate hoặc Nebivolol) liều thấp dưới giám sát chặt chẽ.`,
        gates: [asthmaGate('currentMeds', false, `Đang dùng ${med?.name || bbId} trên bệnh nhân hen phế quản`)],
        citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm']
      };
    }
  })
);

const customNamedTimololStopRules: Rule[] = [0, 1, 2].map((slotIdx) =>
  asthmaRule({
    id: `asthma.safety.non_selective_betablocker_custom_timolol_${slotIdx}`,
    setting: 'both',
    nameVi: `Cảnh báo thuốc nhỏ mắt/phối hợp chứa Timolol (#${slotIdx + 1})`, // qa-allow: index - đánh số rule timolol tùy chỉnh
    citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm'],
    when: (ctx) => slotIdx < getCustomTimololMeds(ctx).length,
    produce: (ctx): Recommendation | null => {
      const customMed = getCustomTimololMeds(ctx)[slotIdx];
      if (!customMed) return null;
      const anyStandardBb = ctx.patient.currentMeds.some((m) => NON_SELECTIVE_BB_DRUGS.has(m.drugId.toLowerCase()));
      const isFirstOverall = !anyStandardBb && slotIdx === 0;
      return {
        id: isFirstOverall
          ? 'rec_asthma_nonselective_bb_contra'
          : `rec_asthma_nonselective_bb_contra_custom_${slotIdx}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 96, // qa-allow: index - độ ưu tiên an toàn
        action: 'STOP',
        drugId: customMed.drugId,
        dose: undefined,
        title: `NGỪNG thuốc chứa Timolol (${customMed.name || customMed.drugId}) — Nguy cơ co thắt phế quản cấp`,
        rationale:
          'Chế phẩm chứa Timolol hấp thu qua niêm mạc lệ mũi vào tuần hoàn chung gây ức chế thụ thể beta-2 phế quản và khởi phát cơn hen cấp nặng. Cần ngừng ngay và đổi sang thuốc hạ nhãn áp không chứa chẹn beta.',
        gates: [asthmaGate('currentMeds', false, `Đang dùng ${customMed.name || customMed.drugId} trên bệnh nhân hen`)],
        citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm']
      };
    }
  })
);

const aerdCox1StopRules: Rule[] = Array.from(AERD_COX1_NSAID_DRUGS).map((nsaidId) =>
  asthmaRule({
    id: `asthma.safety.aerd_nsaid_contra_${nsaidId}`,
    setting: 'both',
    nameVi: `Chống chỉ định Aspirin / NSAID ức chế COX-1 ở bệnh nhân AERD (${nsaidId})`,
    citationIds: ['gina.asthma.2026.aerd_avoid_nsaid'],
    when: (ctx) =>
      hasPatientAerd(ctx) && ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === nsaidId),
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === nsaidId);
      const firstNsaid = ctx.patient.currentMeds.find((m) =>
        AERD_COX1_NSAID_DRUGS.has(m.drugId.toLowerCase())
      );
      const isFirst = firstNsaid?.drugId.toLowerCase() === nsaidId;

      return {
        id: isFirst ? 'rec_asthma_aerd_nsaid_contra' : `rec_asthma_aerd_nsaid_contra_${nsaidId}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 99, // qa-allow: index - độ ưu tiên an toàn tuyệt đối
        action: 'STOP',
        drugId: med?.drugId ?? nsaidId,
        dose: undefined,
        title: `NGỪNG KHẨN CẤP ${med?.name || nsaidId}: Chống chỉ định tuyệt đối NSAID ức chế COX-1 ở bệnh nhân AERD`,
        rationale:
          'Ở người bệnh hen phế quản mẫn cảm Aspirin/NSAID (AERD / Tam chứng Samter), Aspirin và các NSAID ức chế COX-1 gây tổng hợp ồ ạt leukotriene dẫn tới co thắt phế quản cấp nguy kịch. Phải ngừng ngay; dùng Paracetamol (≤ 1000 mg/lần) hoặc đánh giá thận trọng Celecoxib chọn lọc COX-2 dưới giám sát y tế.',
        gates: [asthmaGate('aerd', false, `Đang dùng ${med?.name || nsaidId} trên nền AERD`)],
        citationIds: ['gina.asthma.2026.aerd_avoid_nsaid']
      };
    }
  })
);

const aerdCox2MonitorRules: Rule[] = Array.from(AERD_SELECTIVE_COX2_DRUGS).map((cox2Id) =>
  asthmaRule({
    id: `asthma.safety.aerd_cox2_monitor_${cox2Id}`,
    setting: 'both',
    nameVi: `Thận trọng theo dõi thuốc ức chế chọn lọc COX-2 trên nền AERD (${cox2Id})`,
    citationIds: ['gina.asthma.2026.aerd_cox2_observation'],
    when: (ctx) =>
      hasPatientAerd(ctx) && ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === cox2Id),
    produce: (ctx): Recommendation => {
      const med = ctx.patient.currentMeds.find((m) => m.drugId.toLowerCase() === cox2Id);
      return {
        id: `rec_asthma_aerd_cox2_monitor_${cox2Id}`,
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 88, // qa-allow: index - độ ưu tiên theo dõi
        action: 'MONITOR',
        drugId: med?.drugId ?? cox2Id,
        title: `Theo dõi đáp ứng với thuốc ức chế chọn lọc COX-2 (${med?.name || cox2Id}) ở bệnh nhân AERD`,
        rationale:
          'Theo GINA 2026, thuốc ức chế chọn lọc COX-2 (như Celecoxib) thường dung nạp tốt ở đa số bệnh nhân AERD; tuy nhiên liều đầu tiên vẫn cần theo dõi sát tại cơ sở y tế tối thiểu 2 giờ để loại trừ phản ứng chéo hiếm gặp.',
        gates: [asthmaGate('aerd', true, `Theo dõi dung nạp COX-2 chọn lọc (${cox2Id})`)],
        citationIds: ['gina.asthma.2026.aerd_cox2_observation']
      };
    }
  })
);

export const asthmaCardioAndAerdSafetyRules: Rule[] = [
  ...betaBlockerStopRules,
  ...customNamedTimololStopRules,

  asthmaRule({
    id: 'asthma.safety.inpatient_hf_selective_bb_switch',
    setting: 'inpatient',
    nameVi: 'Nội viện có HFrEF ổn định: Chuyển chẹn beta không chọn lọc sang Bisoprolol chọn lọc beta-1',
    citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm', 'esc.hf.2026.lvef_phenotypes'],
    when: (ctx) => {
      if (!isAdultOrAdolescent(ctx) || evaluateAcuteAsthma(ctx).hasAcuteAttack) return false;
      if (isAllergicToDrug(ctx, 'bisoprolol')) return false;
      if (ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'bisoprolol')) return false;
      const lvef = need(ctx, 'lvef');
      const hfrefMax = thFor('lvef', 'hf.ef.hfref_max');
      const hasHfref =
        hasCondition(ctx, 'hf') ||
        ctx.patient.selectedModules.includes('hf') ||
        (lvef !== undefined && lvef <= hfrefMax);
      if (!hasHfref) return false;
      const hasSystemicNonSelBb = ctx.patient.currentMeds.some((m) =>
        SYSTEMIC_NON_SELECTIVE_BB_DRUGS.has(m.drugId.toLowerCase())
      );
      if (!hasSystemicNonSelBb) return false;
      const sbp = need(ctx, 'sbp');
      const hr = need(ctx, 'hr');
      const minSbp = thFor('sbp', 'asthma.acute.magnesium_sbp_caution_min');
      const minHr = thFor('hr', 'af.rate.bradycardia_hr_min');
      if (sbp !== undefined && sbp < minSbp) return false;
      if (hr !== undefined && hr <= minHr) return false;
      return true;
    },
    produce: (ctx): Recommendation | null => {
      const bbMed = ctx.patient.currentMeds.find((m) =>
        SYSTEMIC_NON_SELECTIVE_BB_DRUGS.has(m.drugId.toLowerCase())
      );
      if (!bbMed) return null;
      const startDose = '1.25'; // qa-allow: unit-conversion - liều khởi đầu Bisoprolol chuẩn HFrEF
      return {
        id: 'rec_asthma_inpatient_hf_switch_bisoprolol',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 89, // qa-allow: index - độ ưu tiên chuyển đổi an toàn HFrEF nội viện
        action: 'SWITCH',
        drugId: 'bisoprolol',
        switchFrom: bbMed.drugId,
        dose: asDose(
          `${startDose} mg uống 1 lần/ngày (khởi đầu liều thấp nội viện thay thế ${bbMed.name || bbMed.drugId} dưới giám sát hô hấp)`
        ),
        title: `Chuyển đổi nội viện sang Bisoprolol (chọn lọc beta-1 cao) thay cho ${bbMed.name || bbMed.drugId} ở bệnh nhân HFrEF ổn định`,
        rationale:
          'Ở bệnh nhân HFrEF đồng mắc hen đang ổn định ngoài cơn co thắt phế quản cấp, ngừng hoàn toàn chẹn beta đột ngột có thể gây nhịp nhanh phản xạ và mất bù suy tim. Hội chẩn Tim mạch - Hô hấp chuyển từ chẹn beta không chọn lọc sang Bisoprolol chọn lọc beta-1 liều thấp nhất dưới theo dõi sát nghe phổi và SpO2 nội viện.',
        gates: [asthmaGate('lvef', true, 'HFrEF ổn định ngoài cơn hen cấp')],
        citationIds: ['gina.asthma.2026.beta_blocker_bronchospasm', 'esc.hf.2026.lvef_phenotypes']
      };
    }
  }),

  ...aerdCox1StopRules,

  asthmaRule({
    id: 'asthma.safety.aerd_nsaid_preventive_avoid',
    setting: 'both',
    nameVi: 'Cảnh báo dự phòng tránh kê đơn Aspirin / NSAID COX-1 ở bệnh nhân AERD',
    citationIds: ['gina.asthma.2026.aerd_avoid_nsaid'],
    when: (ctx) =>
      hasPatientAerd(ctx) &&
      !ctx.patient.currentMeds.some((m) => AERD_COX1_NSAID_DRUGS.has(m.drugId.toLowerCase())),
    produce: (ctx): Recommendation => {
      const isPregHtn =
        isPatientPregnant(ctx) &&
        (hasCondition(ctx, 'htn') ||
          hasCustomCond(ctx, 'chronicHypertension') ||
          ctx.patient.selectedModules.includes('htn'));
      const pregDesensNote = isPregHtn
        ? ' Lưu ý thai kỳ nguy cơ tiền sản giật cao: KHÔNG tự ý uống Aspirin liều thấp tại nhà trên nền AERD; bắt buộc hội chẩn Dị ứng – Miễn dịch lâm sàng & Sản khoa để đánh giá giải mẫn cảm Aspirin nội viện có kiểm soát nếu có chỉ định.'
        : '';

      return {
        id: 'rec_asthma_aerd_nsaid_contra',
        module: 'asthma',
        tier: 'An toàn & Cảnh báo',
        tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
        priority: 95, // qa-allow: index - độ ưu tiên an toàn
        action: 'AVOID',
        drugId: 'aspirin',
        dose: undefined,
        title: 'TRÁNH TUYỆT ĐỐI Aspirin và mọi thuốc kháng viêm NSAID ức chế COX-1 (cơ địa AERD)',
        rationale: `Người bệnh có tiền sử Hen phế quản nhạy cảm Aspirin/NSAID (AERD). Tuyệt đối tránh kê đơn Aspirin, Ibuprofen, Naproxen, Diclofenac, Ketorolac, Meloxicam, Piroxicam, Indomethacin vì nguy cơ co thắt phế quản ác tính. Giảm đau/hạ sốt an toàn bằng Paracetamol liều thấp-trung bình.${pregDesensNote}`,
        gates: [asthmaGate('aerd', false, 'Tiền sử AERD')],
        citationIds: ['gina.asthma.2026.aerd_avoid_nsaid']
      };
    }
  }),

  asthmaRule({
    id: 'asthma.safety.aerd_cross_module_gout_naproxen_block',
    setting: 'both',
    nameVi: 'Chặn kê đơn Naproxen điều trị Gút trên bệnh nhân hen nhạy cảm Aspirin/NSAID (AERD)',
    citationIds: ['gina.asthma.2026.aerd_avoid_nsaid'],
    when: (ctx) =>
      hasPatientAerd(ctx) &&
      (ctx.patient.selectedModules.includes('gout') || hasCondition(ctx, 'gout')) &&
      !ctx.patient.currentMeds.some((m) => m.drugId.toLowerCase() === 'naproxen'),
    produce: (): Recommendation => ({
      id: 'rec_asthma_aerd_block_gout_naproxen',
      module: 'asthma',
      tier: 'An toàn & Cảnh báo',
      tierOrder: 1, // qa-allow: ui-step - thứ tự tầng hiển thị
      priority: 99, // qa-allow: index - độ ưu tiên chặn kê nhầm NSAID chéo module
      action: 'AVOID',
      drugId: 'naproxen',
      dose: undefined,
      title: 'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI Naproxen điều trị Gút trên bệnh nhân Hen mẫn cảm Aspirin/NSAID (AERD)',
      rationale:
        'Naproxen là NSAID ức chế mạnh COX-1 có tỷ lệ phản ứng chéo gần như 100% ở bệnh nhân AERD, gây co thắt phế quản ác tính đe dọa tính mạng. Khi không dùng được Colchicine ở bệnh nhân gút kèm AERD, bắt buộc thay thế bằng Prednisolone uống ngắn ngày hoặc tiêm Corticosteroid nội khớp.',
      gates: [asthmaGate('aerd', false, 'Chống chỉ định Naproxen trên nền AERD + Gút')],
      citationIds: ['gina.asthma.2026.aerd_avoid_nsaid']
    })
  }),

  ...aerdCox2MonitorRules
];
