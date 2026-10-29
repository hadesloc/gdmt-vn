/**
 * GDMT-VN Module Tăng huyết áp (htn) - Nội viện: Đột quỵ Nhồi máu Não Cấp (rtPA / EVT / Không tái tưới máu)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import type { Rule, Recommendation, RuleContext } from '../../engine/types';
import { need, hasCondition, missingInputRec } from '../../engine/require';
import {
  th,
  thFor,
  drug,
  dose,
  fmtDose
} from '../../kb-types';
import {
  NDHP_CCB_IDS,
  getMedIds,
  hasAvBlockOrSssWithoutPacer,
  isHfrEf,
  isPostEvt,
  isSevereAorticStenosis
} from './helpers';

export function selectIvAgentAvoidingSevereAs(ctx: RuleContext): {
  drugId: 'nicardipine' | 'labetalol' | 'urapidil';
  citationId: string;
} {
  if (!isSevereAorticStenosis(ctx)) {
    return { drugId: 'nicardipine', citationId: 'aha.acc.2025.iv_nicardipine' };
  }
  const hr = need(ctx, 'hr');
  const hrMin = thFor('hr', 'htn.bb.hr_min_initiate');
  const medIds = getMedIds(ctx);
  const canUseLabetalol =
    hr !== undefined &&
    hr >= hrMin &&
    !hasCondition(ctx, 'asthma') &&
    !hasCondition(ctx, 'copd') &&
    !hasCondition(ctx, 'acutePulmonaryEdema') &&
    !hasCondition(ctx, 'hf') &&
    !isHfrEf(ctx) &&
    !hasAvBlockOrSssWithoutPacer(ctx) &&
    !medIds.some((id) => NDHP_CCB_IDS.includes(id));

  if (canUseLabetalol) {
    return { drugId: 'labetalol', citationId: 'aha.acc.2025.iv_labetalol' };
  }
  return { drugId: 'urapidil', citationId: 'esc.htn.2025.urapidil_iv' };
}

export function fmtInpatientIvDose(drugId: string): string {
  if (drugId === 'labetalol') {
    const bolusMax = th('htn.labetalol_iv.dose_bolus_max');
    const max24h = th('htn.labetalol_iv.dose_max_24h');
    return `Tiêm tĩnh mạch chậm (tối đa ${bolusMax} mg liều đầu) hoặc truyền liên tục (tổng liều tích lũy ≤ ${max24h} mg/24 giờ)`;
  }
  return fmtDose(dose(drugId, 'start'));
}

export const htnInpatientStrokeRules: Rule[] = [
  {
    id: 'htn.inpatient.stroke_thrombolysis',
    module: 'htn',
    nameVi: 'Đột quỵ nhồi máu não cấp có tiêu sợi huyết rtPA / sau lấy huyết khối cơ học (EVT)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'acuteIschemicStroke') && (hasCondition(ctx, 'thrombolysisEligible') || isPostEvt(ctx)),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'kiểm soát huyết áp trước và sau tái tưới máu đột quỵ nhồi máu não', [
          'aha.acc.2025.ais_rec2_rtpa'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'kiểm soát huyết áp trước và sau tái tưới máu đột quỵ nhồi máu não', [
          'aha.acc.2025.ais_rec2_rtpa'
        ]);
      }

      const sbpHypo = thFor('sbp', 'htn.safety.sbp_hypotension');
      const sbpPre = thFor('sbp', 'htn.emergency.stroke_thrombolysis_sbp');
      const dbpPre = thFor('dbp', 'htn.emergency.stroke_thrombolysis_dbp');
      const sbpPost24 = thFor('sbp', 'htn.emergency.stroke_post_rtpa_sbp_24h');
      const dbpPost24 = thFor('dbp', 'htn.emergency.stroke_post_rtpa_dbp_24h');
      const sbpEvtHarm = thFor('sbp', 'htn.emergency.stroke_evt_harm_sbp');

      if (sbp < sbpHypo) {
        return {
          id: 'rec_htn_emergency_stroke_rtpa',
          module: 'htn',
          tier: 'Đột quỵ Nhồi máu não (Cảnh báo Tụt huyết áp)',
          tierOrder: 0,
          action: 'HOLD',
          title: `TẠM NGỪNG thuốc hạ áp do tụt huyết áp (SBP = ${sbp} < ${sbpHypo} mmHg) gây giảm tưới máu vùng tranh tối tranh sáng`,
          rationale: `SBP ${sbp} mmHg (< ${sbpHypo} mmHg) làm lan rộng vùng nhồi máu não; cần ngừng ngay thuốc hạ áp và tìm nguyên nhân tụt áp.`,
          gates: [],
          citationIds: ['aha.acc.2025.ais_rec2_rtpa', 'vsh.htn.2022.emergency_stroke_thrombolysis'],
          priority: 100
        };
      }

      if (isPostEvt(ctx) && sbp < sbpEvtHarm) {
        return {
          id: 'rec_htn_emergency_stroke_evt_harm',
          module: 'htn',
          tier: 'An toàn Sau Tái thông Nội mạch (EVT)',
          tierOrder: 0,
          action: 'HOLD',
          title: `CẤM HẠ ÁP TÍCH CỰC dưới ${sbpEvtHarm} mmHg sau tái thông EVT thành công (hiện SBP = ${sbp} mmHg)`,
          rationale: `Theo AHA/ACC 2025 (Section 5.5 / Section 6.2 Rec 6, COR 3: Harm, LOE A), hạ huyết áp tâm thu tích cực xuống < ${sbpEvtHarm} mmHg trong 24–72 giờ đầu sau lấy huyết khối cơ học (EVT) tái thông thành công làm xấu kết cục chức năng thần kinh. Phải ngừng/giảm ngay thuốc hạ áp đang truyền.`,
          gates: [],
          citationIds: ['aha.acc.2025.ais_rec6_evt_harm'],
          priority: 100
        };
      }

      const activeSbpCutoff = isPostEvt(ctx) && !hasCondition(ctx, 'thrombolysisEligible') ? sbpPost24 : sbpPre;
      const activeDbpCutoff = isPostEvt(ctx) && !hasCondition(ctx, 'thrombolysisEligible') ? dbpPost24 : dbpPre;

      if (sbp <= activeSbpCutoff && dbp <= activeDbpCutoff) {
        return {
          id: 'rec_htn_emergency_stroke_rtpa',
          module: 'htn',
          tier: 'Đột quỵ Nhồi máu não (Tái tưới máu)',
          tierOrder: 1,
          action: 'MONITOR',
          title: `HA đạt ngưỡng an toàn tiêu sợi huyết (< ${sbpPre}/${dbpPre} mmHg, hiện ${sbp}/${dbp}): Duy trì < ${sbpPost24}/${dbpPost24} mmHg trong 24 giờ sau rtPA`,
          rationale: `Theo AHA/ACC 2025 (COR 1) và ESC 2024 / VSH 2022, huyết áp cần đạt < ${sbpPre}/${dbpPre} mmHg trước tiêm rtPA và duy trì nghiêm ngặt < ${sbpPost24}/${dbpPost24} mmHg trong suốt 24 giờ sau tiêu sợi huyết để phòng xuất huyết chuyển dạng.${isPostEvt(ctx) ? ` Đã tái thông EVT: tuyệt đối tránh hạ tích cực SBP < ${sbpEvtHarm} mmHg (COR 3: Harm).` : ''}`,
          gates: [],
          citationIds: [
            'aha.acc.2025.ais_rec2_rtpa',
            'vsh.htn.2022.emergency_stroke_thrombolysis',
            ...(isPostEvt(ctx) ? ['aha.acc.2025.ais_rec6_evt_harm'] : [])
          ],
          priority: 90
        };
      }

      const chosen = selectIvAgentAvoidingSevereAs(ctx);
      const chosenName = drug(chosen.drugId).nameVi;
      const chosenDoseText = fmtInpatientIvDose(chosen.drugId);
      const asNote = isSevereAorticStenosis(ctx)
        ? ` Do bệnh nhân có hẹp van động mạch chủ khít nặng, chống chỉ định Nicardipine; chuyển sang ${chosenName}.`
        : '';
      const evtNote = isPostEvt(ctx)
        ? ` Đã tái thông nội mạch EVT: tuyệt đối không hạ tích cực SBP xuống < ${sbpEvtHarm} mmHg (COR 3: Harm).`
        : '';

      return {
        id: 'rec_htn_emergency_stroke_rtpa',
        module: 'htn',
        tier: 'Đột quỵ Nhồi máu não có Tiêu sợi huyết (rtPA)',
        tierOrder: 0,
        action: 'START',
        drugId: chosen.drugId,
        drugNameVi: chosenName,
        dose: chosenDoseText,
        title: `Hạ áp cấp cứu trước rtPA bằng ${chosenName}: Đạt < ${sbpPre}/${dbpPre} mmHg, duy trì < ${sbpPost24}/${dbpPost24} mmHg suốt 24h`,
        rationale: `Khuyến cáo loại I (AHA/ACC 2025 / ESC 2024 / VSH 2022): Khi có chỉ định tiêu sợi huyết tĩnh mạch mà HA > ${sbpPre}/${dbpPre} mmHg (hiện ${sbp}/${dbp} mmHg), truyền ${chosenName} để đưa HA xuống < ${sbpPre}/${dbpPre} mmHg trước khi bolus rtPA và duy trì < ${sbpPost24}/${dbpPost24} mmHg trong 24 giờ đầu nhằm ngăn biến chứng xuất huyết não.${asNote}${evtNote}`,
        gates: [],
        citationIds: [
          'aha.acc.2025.ais_rec2_rtpa',
          'vsh.htn.2022.emergency_stroke_thrombolysis',
          chosen.citationId,
          ...(isPostEvt(ctx) ? ['aha.acc.2025.ais_rec6_evt_harm'] : [])
        ],
        priority: 99
      };
    },
    citationIds: ['aha.acc.2025.ais_rec2_rtpa', 'vsh.htn.2022.emergency_stroke_thrombolysis']
  },

  // -------------------------------------------------------------------------
  // 5B. ĐỘT QUỴ NHỒI MÁU NÃO CẤP KHÔNG TIÊU SỢI HUYẾT (PERMISSIVE HYPERTENSION)
  // -------------------------------------------------------------------------
  {
    id: 'htn.inpatient.stroke_no_thrombolysis',
    module: 'htn',
    nameVi: 'Đột quỵ nhồi máu não cấp không tiêu sợi huyết: Bảo tồn tưới máu não (chỉ hạ khi cực cao)',
    setting: 'inpatient',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx: RuleContext) =>
      hasCondition(ctx, 'acuteIschemicStroke') && !hasCondition(ctx, 'thrombolysisEligible') && !isPostEvt(ctx),
    produce: (ctx: RuleContext): Recommendation | null => {
      const sbp = need(ctx, 'sbp');
      const dbp = need(ctx, 'dbp');

      if (sbp === undefined) {
        return missingInputRec('htn', 'sbp', 'quyết định ngưỡng cho phép tăng huyết áp trong nhồi máu não cấp', [
          'vsh.htn.2022.emergency_stroke_no_thrombolysis'
        ]);
      }
      if (dbp === undefined) {
        return missingInputRec('htn', 'dbp', 'quyết định ngưỡng cho phép tăng huyết áp trong nhồi máu não cấp', [
          'vsh.htn.2022.emergency_stroke_no_thrombolysis'
        ]);
      }

      const profile = ctx.settings.profile;
      const sbpExtreme = thFor('sbp', 'htn.emergency.stroke_no_thrombolysis_sbp');
      const dbpExtreme =
        profile === 'INTL'
          ? thFor('dbp', 'htn.emergency.stroke_no_rtpa_dbp_esc')
          : thFor('dbp', 'htn.emergency.stroke_no_thrombolysis_dbp');
      const dropPct = thFor('percentage', 'htn.emergency.stroke_map_reduction_pct');
      const windowH = th('htn.emergency.stroke_no_rtpa_window_h');

      const isExtremeStrokeBp =
        profile === 'VN'
          ? sbp > sbpExtreme || dbp > dbpExtreme
          : sbp >= sbpExtreme || dbp >= dbpExtreme;

      if (!isExtremeStrokeBp) {
        return {
          id: 'rec_htn_stroke_no_thrombolysis_hold',
          module: 'htn',
          tier: 'Bảo vệ Vùng tranh tối tranh sáng (Penumbra)',
          tierOrder: 0,
          action: 'HOLD',
          title: `TRÌ HOÃN hạ áp tích cực trong Nhồi máu não không tiêu sợi huyết (HA ${sbp}/${dbp} dưới ngưỡng ${sbpExtreme}/${dbpExtreme} mmHg)`,
          rationale: `Theo ESC 2024 (Class III), AHA/ACC 2025 (COR 3: No Benefit) và VSH 2022, ở đột quỵ thiếu máu não cấp không tái tưới máu và không có HMOD cấp khác, hạ áp thường quy khi HA < ${sbpExtreme}/${dbpExtreme} mmHg không mang lại lợi ích và làm giảm tưới máu vùng penumbra trong 48–72 giờ đầu.`,
          gates: [
            {
              parameter: 'Ngưỡng Permissive Hypertension',
              passed: true,
              value: sbp,
              threshold: sbpExtreme,
              messageVi: `HA ${sbp}/${dbp} chưa vượt ngưỡng cực cao ${sbpExtreme}/${dbpExtreme} mmHg: Trì hoãn hạ áp cấp`
            }
          ],
          citationIds: [
            'esc.htn.2024.stroke_no_rtpa_rec32',
            'aha.acc.2025.ais_rec4_no_rtpa',
            'vsh.htn.2022.emergency_stroke_no_thrombolysis'
          ],
          priority: 98
        };
      }

      const chosen = selectIvAgentAvoidingSevereAs(ctx);
      const chosenName = drug(chosen.drugId).nameVi;
      const chosenDoseText = fmtInpatientIvDose(chosen.drugId);

      return {
        id: 'rec_htn_emergency_stroke_extreme',
        module: 'htn',
        tier: 'Đột quỵ Nhồi máu não HA Cực cao',
        tierOrder: 0,
        action: 'START',
        drugId: chosen.drugId,
        drugNameVi: chosenName,
        dose: chosenDoseText,
        title: `Hạ áp thận trọng khoảng ${dropPct}% trong ${windowH} giờ đầu bằng ${chosenName} (HA cực cao ${sbp}/${dbp} mmHg)`,
        rationale: `Huyết áp vượt ngưỡng cực cao (${sbp}/${dbp} ≥ ${sbpExtreme}/${dbpExtreme} mmHg) ở đột quỵ nhồi máu não không tiêu sợi huyết. Theo ESC 2024 (Class IIb) và AHA/ACC 2025 (COR 2b), chỉ hạ áp từ từ có kiểm soát khoảng ${dropPct}% trong ${windowH} giờ đầu (VSH 2022: giảm 15% MAP trong giờ đầu) bằng ${chosenName}; tránh tụt áp đột ngột.`,
        gates: [],
        citationIds: [
          'esc.htn.2024.stroke_no_rtpa_rec32',
          'aha.acc.2025.ais_rec4_no_rtpa',
          'vsh.htn.2022.emergency_stroke_no_thrombolysis',
          chosen.citationId
        ],
        profileDiff: {
          INTL: `ESC 2024: cân nhắc hạ khoảng ${dropPct}% trong ${windowH} giờ khi HA ≥ ${sbpExtreme}/${thFor('dbp', 'htn.emergency.stroke_no_rtpa_dbp_esc')} mmHg`,
          US: `AHA/ACC 2025: cân nhắc hạ ${dropPct}% trong ${windowH} giờ khi HA ≥ ${sbpExtreme}/${thFor('dbp', 'htn.emergency.stroke_no_thrombolysis_dbp')} mmHg`,
          VN: `VSH 2022: hạ thận trọng khoảng ${dropPct}% MAP khi HA > ${sbpExtreme}/${thFor('dbp', 'htn.emergency.stroke_no_thrombolysis_dbp')} mmHg`
        },
        priority: 99
      };
    },
    citationIds: ['esc.htn.2024.stroke_no_rtpa_rec32', 'aha.acc.2025.ais_rec4_no_rtpa']
  },

  // -------------------------------------------------------------------------
  // 6. ĐỘT QUỴ XUẤT HUYẾT NÃO CẤP (ICH) — ĐÍCH PHÂN NHÁNH THEO PROFILE (ESC / US / VN)
  // -------------------------------------------------------------------------
];
