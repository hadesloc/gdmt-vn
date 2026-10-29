import type { Rule, RuleContext, CurrentMed } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor, drug, dose, fmtDose, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  NON_SELECTIVE_BB_IDS,
  OPHTHALMIC_BB_IDS,
  SELECTIVE_BB_IDS,
  hasAnyCurrentMed,
  hasConcurrentAsthma,
  hasCompellingBbIndication,
  hasSupplementalOxygen,
  isAcuteExacerbation,
  hasOutpatientAcuteRespiratoryFailure,
  getRestingSpo2,
} from './helpers';

function isOphthalmicBbMed(med: CurrentMed): boolean {
  const id = med.drugId?.trim().toLowerCase();
  if (!id) return false;
  if (OPHTHALMIC_BB_IDS.has(id)) return true;
  const routeLower = (med.route || '').toLowerCase();
  const nameLower = (med.name || '').toLowerCase();
  const unitLower = (med.unit || '').toLowerCase();
  if (routeLower.includes('ophth') || routeLower.includes('mắt') || routeLower.includes('eye')) {
    return NON_SELECTIVE_BB_IDS.has(id) || SELECTIVE_BB_IDS.has(id);
  }
  if (
    (id === 'timolol' || id === 'betaxolol') &&
    (nameLower.includes('nhỏ mắt') ||
      nameLower.includes('ophth') ||
      nameLower.includes('eye') ||
      nameLower.includes('timoptic') ||
      unitLower.includes('giọt'))
  ) {
    return true;
  }
  return false;
}

function getOphthalmicBbMedsInCopd(ctx: RuleContext): CurrentMed[] {
  if (ctx.normalized.selectedModules.includes('asthma')) return [];
  return ctx.normalized.currentMeds.filter((m) => isOphthalmicBbMed(m));
}

function getSystemicNonSelectiveBbMedsInCopd(ctx: RuleContext): CurrentMed[] {
  if (ctx.normalized.selectedModules.includes('asthma')) return [];
  return ctx.normalized.currentMeds.filter((m) => {
    const id = m.drugId?.trim().toLowerCase();
    return Boolean(id && NON_SELECTIVE_BB_IDS.has(id) && !isOphthalmicBbMed(m));
  });
}

function getBbHemodynamicConductionHoldReason(ctx: RuleContext): string | undefined {
  const sbp = need(ctx, 'sbp');
  const hr = need(ctx, 'hr');
  const sbpCut = thFor('sbp', 'copd.hypotension_sbp_cutoff');
  const hrCut = thFor('hr', 'copd.bb_bradycardia_hr_cutoff');
  const cond = (ctx.patient.conditions || {}) as Record<string, unknown>;
  const ci = ctx.normalized.customInputs || {};

  if (sbp !== undefined && sbp < sbpCut) {
    return `tụt huyết áp tâm thu (SBP ${sbp} < ${sbpCut} mmHg)`;
  }
  if (hr !== undefined && hr < hrCut) {
    return `nhịp tim chậm rõ rệt (HR ${hr} < ${hrCut} chu kỳ/phút)`;
  }
  if (
    Boolean(
      cond.avBlock2Or3 ||
        cond.secondOrThirdDegreeAvBlock ||
        cond.highGradeAvBlock ||
        ci.avBlock2Or3 ||
        ci.secondOrThirdDegreeAvBlock
    )
  ) {
    return 'block nhĩ thất độ II/III chưa có máy tạo nhịp';
  }
  if (Boolean(cond.cardiogenicShock || cond.acuteDecompensatedHf || ci.cardiogenicShock)) {
    return 'sốc tim hoặc suy tim mất bù cấp tính';
  }
  return undefined;
}

function canAutoSwitchToSelectiveBb(ctx: RuleContext): boolean {
  if (hasConcurrentAsthma(ctx)) return false;
  if (!hasCompellingBbIndication(ctx)) return false;
  if (isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
  if (hasAnyCurrentMed(ctx, SELECTIVE_BB_IDS) !== undefined) return false;
  if (getBbHemodynamicConductionBbHoldReasonWrapper(ctx) !== undefined) return false;
  return true;
}

function getBbHemodynamicConductionBbHoldReasonWrapper(ctx: RuleContext): string | undefined {
  return getBbHemodynamicConductionHoldReason(ctx);
}

function makeOphthalmicBbStopRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.ophthalmic_bb_stop'
        : `copd.safety.ophthalmic_bb_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng thuốc nhỏ mắt chẹn beta (Timolol) gây co thắt phế quản toàn thân & hội chẩn chuyên khoa Mắt',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.selective_beta1_blockers',
      'fda.copd.carvedilol_contra_asthma',
    ],
    when: (ctx) => getOphthalmicBbMedsInCopd(ctx).length > slotIndex,
    produce: (ctx) => {
      const med = getOphthalmicBbMedsInCopd(ctx)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_ophthalmic_bb'
            : `rec_copd_stop_ophthalmic_bb_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: `NGỪNG ${medName} (thuốc nhỏ mắt chẹn beta) và đổi sang thuốc hạ nhãn áp tại chỗ không chẹn beta`,
        rationale:
          'Thuốc nhỏ mắt chẹn beta không chọn lọc (như Timolol nhỏ mắt) hấp thu trực tiếp qua ống lệ mũi vào tuần hoàn hệ thống mà không qua chuyển hóa bước đầu tại gan, có thể gây co thắt phế quản nặng, suy hô hấp và nhịp tim chậm ở người bệnh COPD/Hen. Tuyệt đối KHÔNG chuyển thuốc nhỏ mắt glôcôm sang Bisoprolol uống; cần hội chẩn chuyên khoa Mắt đổi sang thuốc nhỏ mắt nhóm tương tự prostaglandin (latanoprost, travoprost), ức chế carbonic anhydrase tại chỗ (dorzolamide, brinzolamide) hoặc brimonidine.',
        gates: [],
        citationIds: [
          'gold.copd.2026.selective_beta1_blockers',
          'fda.copd.carvedilol_contra_asthma',
        ],
        priority: 98,
      };
    },
  };
}

function makeNonSelectiveBbSafetyRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.non_selective_bb_stop'
        : `copd.safety.non_selective_bb_stop_${slotIndex}`,
    module: 'copd',
    nameVi: 'Xử trí an toàn thuốc chẹn beta không chọn lọc đường toàn thân ở bệnh nhân COPD',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.selective_beta1_blockers',
      'gold.copd.2026.bb_cvd_indication',
      'fda.copd.carvedilol_contra_asthma',
      'fda.copd.carvedilol_no_abrupt_stop',
      'esc.hf.2026.bb_guidance_table_s6',
    ],
    when: (ctx) => getSystemicNonSelectiveBbMedsInCopd(ctx).length > slotIndex,
    produce: (ctx) => {
      const med = getSystemicNonSelectiveBbMedsInCopd(ctx)[slotIndex]!;
      const medName = med.name || (hasDrug(med.drugId) ? drug(med.drugId).nameVi : med.drugId);
      const holdReason = getBbHemodynamicConductionHoldReason(ctx);
      const hasCvdInd = hasCompellingBbIndication(ctx);
      const hasAsthma = hasConcurrentAsthma(ctx);
      const inAcute = isAcuteExacerbation(ctx) || hasOutpatientAcuteRespiratoryFailure(ctx);
      const switchingToBisoprolol = slotIndex === 0 && canAutoSwitchToSelectiveBb(ctx);

      if (holdReason) {
        return {
          id:
            slotIndex === 0
              ? 'rec_copd_hold_non_selective_bb'
              : `rec_copd_hold_non_selective_bb_${slotIndex}`,
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 0,
          action: 'HOLD',
          drugId: med.drugId,
          drugNameVi: medName,
          dose: undefined,
          title: `TẠM NGƯNG (HOLD) ${medName} do ${holdReason} (chưa khởi trị Bisoprolol khi huyết động/dẫn truyền chưa ổn định)`,
          rationale: `Người bệnh đang dùng chẹn beta không chọn lọc (${medName}) kèm ${holdReason}. Cần tạm ngưng chẹn beta và trì hoãn chuyển đổi sang Bisoprolol cho đến khi huyết áp, tần số tim và dẫn truyền nhĩ thất hồi phục an toàn; hội chẩn Tim mạch đánh giá lại trước xuất viện.`,
          gates: [],
          citationIds: [
            'esc.hf.2026.bb_guidance_table_s6',
            'fda.copd.carvedilol_no_abrupt_stop',
            'gold.copd.2026.selective_beta1_blockers',
          ],
          priority: 99,
        };
      }

      if (inAcute && hasCvdInd && !hasAsthma) {
        return {
          id:
            slotIndex === 0
              ? 'rec_copd_reduce_non_selective_bb_acute_cvd'
              : `rec_copd_reduce_non_selective_bb_acute_cvd_${slotIndex}`,
          module: 'copd',
          tier: 'An toàn thuốc bắt buộc',
          tierOrder: 0,
          action: 'REDUCE',
          drugId: med.drugId,
          drugNameVi: medName,
          dose: undefined,
          title: `KHÔNG NGỪNG ĐỘT NGỘT ${medName} trong đợt cấp trên nền bệnh tim mạch: Giảm liều tạm thời nếu co thắt phế quản nặng & chuyển sang Bisoprolol khi ổn định`,
          rationale: `Người bệnh có bệnh lý tim mạch bắt buộc dùng chẹn beta (suy tim phân suất tống máu giảm / bệnh mạch vành / rung nhĩ) đang trong đợt cấp COPD trên nền ${medName}. Theo cảnh báo FDA và ESC/GOLD 2026, cắt đột ngột chẹn beta toàn thân không có thuốc thay thế gây nguy cơ thiếu máu cơ tim bật lại, nhồi máu cơ tim, loạn nhịp thất nhanh hoặc mất bù suy tim cấp. Cần giảm liều tạm thời nếu co thắt phế quản nặng và chuyển đổi chéo (cross-titrate) sang chẹn beta-1 chọn lọc tim (Bisoprolol) ngay khi ổn định hô hấp trước xuất viện.`,
          warnings: [
            'Tuyệt đối không cắt bỏ đột ngột chẹn beta trên nền bệnh mạch vành hoặc suy tim HFrEF khi huyết động còn ổn định (FDA Warning).',
          ],
          gates: [],
          citationIds: [
            'fda.copd.carvedilol_no_abrupt_stop',
            'gold.copd.2026.selective_beta1_blockers',
            'gold.copd.2026.bb_cvd_indication',
          ],
          priority: 97,
        };
      }

      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_non_selective_bb'
            : `rec_copd_stop_non_selective_bb_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: med.drugId,
        drugNameVi: medName,
        dose: undefined,
        title: switchingToBisoprolol
          ? `NGỪNG ${medName} (chẹn beta không chọn lọc) để CHUYỂN ĐỔI sang chẹn beta-1 chọn lọc tim (Bisoprolol)`
          : hasAsthma
            ? `NGỪNG ${medName} (chẹn beta không chọn lọc) trên nền đồng mắc Hen – COPD (hội chẩn Tim mạch – Hô hấp)`
            : `NGỪNG ${medName} (chẹn beta không chọn lọc) do nguy cơ co thắt phế quản (giảm liều từ từ, tránh cắt đột ngột)`,
        rationale: switchingToBisoprolol
          ? `Thuốc chẹn beta không chọn lọc (${medName}) phong bế thụ thể beta-2 phế quản gây co thắt phế quản và đối kháng trực tiếp tác dụng giãn phế quản của SABA/LABA. Vì người bệnh đồng mắc bệnh lý tim mạch có chỉ định bắt buộc chẹn beta (suy tim / bệnh mạch vành / rung nhĩ), tuyệt đối không cắt bỏ nhóm chẹn beta mà thực hiện chuyển đổi trực tiếp sang thuốc chẹn beta-1 chọn lọc tim (Bisoprolol) theo GOLD 2026 và ESC.`
          : hasAsthma
            ? `Người bệnh có đồng mắc hoặc tiền sử Hen phế quản đang dùng chẹn beta không chọn lọc (${medName} – chống chỉ định do nguy cơ co thắt phế quản nặng đe dọa tính mạng theo nhãn FDA). Cần ngừng ${medName} theo lộ trình giảm liều an toàn và hội chẩn chuyên khoa Tim mạch – Hô hấp nếu có suy tim phân suất tống máu giảm đi kèm.`
            : 'Thuốc chẹn beta không chọn lọc ức chế thụ thể beta-2 phế quản gây co thắt phế quản và làm mất hiệu lực của thuốc giãn phế quản SABA/LABA. Lưu ý giảm liều từ từ trong 1–2 tuần (tuyệt đối tránh ngừng đột ngột ở người có bệnh mạch vành tiềm ẩn để phòng thiếu máu cơ tim bật lại hoặc loạn nhịp).',
        warnings: [
          'Không ngừng thuốc chẹn beta đột ngột ở bệnh nhân có bệnh mạch vành hoặc suy tim vì nguy cơ đau thắt ngực nặng lên, nhồi máu cơ tim hoặc loạn nhịp thất (FDA Warning).',
        ],
        gates: [],
        citationIds: [
          'gold.copd.2026.selective_beta1_blockers',
          'gold.copd.2026.bb_cvd_indication',
          'fda.copd.carvedilol_contra_asthma',
          'fda.copd.carvedilol_no_abrupt_stop',
        ],
        priority: 97,
      };
    },
  };
}

export const copdSafetyCardioRules: Rule[] = [
  makeOphthalmicBbStopRule(0),
  makeOphthalmicBbStopRule(1), // qa-allow: index - khe dừng thuốc nhỏ mắt chẹn beta thứ 2

  {
    id: 'copd.safety.ophthalmic_bb_refer',
    module: 'copd',
    nameVi: 'Hội chẩn chuyên khoa Mắt đổi thuốc hạ nhãn áp không chẹn beta cho bệnh nhân glôcôm',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: ['gold.copd.2026.selective_beta1_blockers'],
    when: (ctx) => getOphthalmicBbMedsInCopd(ctx).length > 0,
    produce: () => ({
      id: 'rec_copd_ophthalmic_bb_refer',
      module: 'copd',
      tier: 'Tối ưu hóa Tim mạch – Hô hấp',
      tierOrder: 1,
      action: 'REFER',
      title: 'Hội chẩn chuyên khoa Mắt: Thay thế thuốc nhỏ mắt chẹn beta bằng thuốc hạ nhãn áp không gây co thắt phế quản',
      rationale:
        'Khi ngừng thuốc nhỏ mắt chẹn beta (Timolol) để bảo vệ đường thở, bắt buộc hội chẩn chuyên khoa Mắt để kê ngay thuốc nhỏ mắt hạ nhãn áp thay thế (prostaglandin tại chỗ, dorzolamide/brinzolamide hoặc brimonidine) nhằm ngăn ngừa tăng nhãn áp mất kiểm soát gây tổn thương thị thần kinh.',
      gates: [],
      citationIds: ['gold.copd.2026.selective_beta1_blockers'],
      priority: 90,
    }),
  },

  makeNonSelectiveBbSafetyRule(0),
  makeNonSelectiveBbSafetyRule(1), // qa-allow: index - khe xử trí chẹn beta không chọn lọc thứ 2
  makeNonSelectiveBbSafetyRule(2), // qa-allow: index - khe xử trí chẹn beta không chọn lọc thứ 3
  makeNonSelectiveBbSafetyRule(3), // qa-allow: index - khe xử trí chẹn beta không chọn lọc thứ 4

  {
    id: 'copd.safety.non_selective_bb_switch_selective',
    module: 'copd',
    nameVi: 'Chuyển đổi sang thuốc chẹn beta-1 chọn lọc tim (Bisoprolol) khi COPD đồng mắc suy tim / mạch vành / rung nhĩ',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.selective_beta1_blockers',
      'gold.copd.2026.bb_cvd_indication',
      'esc.copd.2026.hfref_lvef_40',
      'fda.copd.carvedilol_no_abrupt_stop',
      'byt.copd.2026.bb_oxygen_dependent_caution',
    ],
    when: (ctx) => getSystemicNonSelectiveBbMedsInCopd(ctx).length > 0 && canAutoSwitchToSelectiveBb(ctx),
    produce: (ctx) => {
      const oldBbs = getSystemicNonSelectiveBbMedsInCopd(ctx);
      const oldBb = oldBbs[0]!;
      const oldNames = oldBbs
        .map((m) => m.name || (hasDrug(m.drugId) ? drug(m.drugId).nameVi : m.drugId))
        .join(' + ');
      const dBiso = drug('bisoprolol');
      const startDose = fmtDose(dose('bisoprolol', 'start'));
      const spo2 = getRestingSpo2(ctx);
      const ltotSpo2 = thFor('restingSpo2', 'copd.ltot_spo2_cutoff');
      const isOxygenDepOrHypoxemic =
        hasSupplementalOxygen(ctx) || (spo2 !== undefined && spo2 <= ltotSpo2);

      return {
        id: 'rec_copd_switch_selective_bb',
        module: 'copd',
        tier: 'Tối ưu hóa Tim mạch – Hô hấp',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: dBiso.id,
        switchFrom: oldBb.drugId,
        drugNameVi: dBiso.nameVi,
        dose: startDose,
        title: `CHUYỂN ĐỔI từ ${oldNames} sang chẹn beta-1 chọn lọc tim ${dBiso.nameVi} bảo vệ tim mạch trên nền COPD`,
        rationale:
          'Theo GOLD 2026 và ESC Suy tim 2026, bệnh nhân COPD có chỉ định tim mạch bắt buộc (suy tim phân suất tống máu giảm, bệnh mạch vành sau nhồi máu cơ tim, kiểm soát tần số thất trong rung nhĩ) được hưởng lợi giảm tử vong rõ rệt từ nhóm chẹn beta-1 chọn lọc cao trên tim (Bisoprolol, Metoprolol succinate hoặc Nebivolol) mà không làm mất tác dụng giãn phế quản của LABA/SABA.',
        warnings: [
          'Khởi đầu liều thấp và chuẩn độ tăng dần mỗi 2–4 tuần theo đáp ứng nhịp tim, huyết áp và triệu chứng hô hấp.',
          ...(isOxygenDepOrHypoxemic
            ? [
                'Thận trọng đặc biệt theo BYT QĐ 2131/2026 (Chương 5): Trên người bệnh COPD giảm oxy máu nặng / phụ thuộc oxy dài hạn, chỉ duy trì chẹn beta-1 chọn lọc khi có chỉ định tim mạch bắt buộc (như HFrEF/sau NMCT) và giám sát chặt SpO₂, nhịp tim, huyết áp.',
              ]
            : []),
        ],
        gates: [],
        citationIds: [
          'gold.copd.2026.selective_beta1_blockers',
          'gold.copd.2026.bb_cvd_indication',
          'esc.copd.2026.hfref_lvef_40',
          'fda.copd.carvedilol_no_abrupt_stop',
          ...(isOxygenDepOrHypoxemic ? ['byt.copd.2026.bb_oxygen_dependent_caution'] : []),
        ],
        priority: 96,
      };
    },
  },
];
