import type { Rule } from '../../engine/types';
import { drug, dose, fmtDose, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  formatCopdBudesonideFormoterolDose,
  formatCopdBeclometasoneFormoterolDose,
  formatCopdTiotropiumDose,
  getInhalerProfile,
  getBloodEos,
  hasConfirmedStableCopd,
  hasAnticholinergicContra,
  hasConcurrentAsthma,
  hasWeakInspiratoryFlow,
  hasMilkProteinAllergy,
  getLamaWarnings,
  getHepaticTripleWarnings,
  getAsthmaPrescribedIcsLabaId,
  getAsthmaPrescribedMonoIcsId,
  selectTripleInhaler,
  resolveEffectiveInhaler,
  isHighSymptomsConfirmed,
  isGroupEConfirmed,
  getPlannedCopdInhalerChangeDrugId,
  getRetainedBaselineMaintenanceInhalers,
} from './helpers';

function formatContinuedInhalerDose(
  canonical: string,
  hasKb: boolean,
  avoidDpi: boolean,
  coSelectedAsthma: boolean,
  hasAsthmaHistory: boolean
): string | undefined {
  if (canonical === 'budesonide_formoterol') {
    if (!hasAsthmaHistory) {
      return formatCopdBudesonideFormoterolDose(avoidDpi);
    }
    if (!coSelectedAsthma && avoidDpi) {
      return `${fmtDose(dose(canonical, 'target'))} – Bắt buộc dùng dạng bình xịt pMDI không chứa lactose (Symbicort Rapihaler + buồng đệm), tuyệt đối tránh Symbicort Turbuhaler DPI`;
    }
    return fmtDose(dose(canonical, 'target'));
  }
  if (canonical === 'beclometasone_formoterol') {
    if (!hasAsthmaHistory || avoidDpi) {
      return formatCopdBeclometasoneFormoterolDose(avoidDpi);
    }
    return fmtDose(dose(canonical, 'target'));
  }
  if (canonical === 'tiotropium') {
    return formatCopdTiotropiumDose(avoidDpi);
  }
  return hasKb ? fmtDose(dose(canonical, 'target')) : undefined;
}

function makeContinueControlledInhalerRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.followup.continue_controlled_inhaler'
        : `copd.followup.continue_controlled_inhaler_${slotIndex}`,
    module: 'copd',
    nameVi: 'Duy trì thuốc hít nền tảng hiện tại khi không có chỉ định đổi sang bình hít khác',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_dyspnea_laba_lama',
      'gold.copd.2026.followup_ics_laba_continue',
      'byt.copd.2026.tiotropium_dose',
      'byt.copd.2026.budesonide_formoterol_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      const eff = resolveEffectiveInhaler(ctx);
      if (eff === 'none' || eff === 'triple') return false;
      return getRetainedBaselineMaintenanceInhalers(ctx).length > slotIndex;
    },
    produce: (ctx) => {
      const med = getRetainedBaselineMaintenanceInhalers(ctx)[slotIndex]!;
      const prof = getInhalerProfile(med.drugId)!;
      const canonical = prof.canonicalId;
      const hasKb = hasDrug(canonical);
      const medName = med.name || (hasKb ? drug(canonical).nameVi : med.drugId);
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const coSelectedAsthma = ctx.normalized.selectedModules.includes('asthma');
      const hasAsthma = hasConcurrentAsthma(ctx);
      const doseText = formatContinuedInhalerDose(
        canonical,
        hasKb,
        avoidDpi,
        coSelectedAsthma,
        hasAsthma
      );
      const warnings = prof.lama ? getLamaWarnings(ctx, canonical) : undefined;

      const highSymp = isHighSymptomsConfirmed(ctx);
      const groupE = isGroupEConfirmed(ctx);
      const eosMissing = getBloodEos(ctx) === undefined;
      const lamaContra = hasAnticholinergicContra(ctx);
      const isPendingOrUncontrolled = highSymp || groupE;

      const title = isPendingOrUncontrolled
        ? `Duy trì nền tảng thuốc hít hiện tại (${medName}) kết hợp tối ưu hóa điều trị bổ trợ / hoàn tất đánh giá`
        : `Tiếp tục duy trì phác đồ thuốc hít nền tảng hiện tại (${medName})`;

      let rationale: string;
      if (isPendingOrUncontrolled) {
        if (eosMissing && groupE) {
          rationale = `Người bệnh còn đợt cấp nhưng chưa có kết quả Bạch cầu ái toan máu (Blood Eosinophils): Tạm thời duy trì đều đặn ${medName} hiện tại, kiểm tra kỹ thuật sử dụng bình hít và bổ sung ngay xét nghiệm BCAT máu để quyết định chỉ định nâng bậc ICS theo lưu đồ GOLD 2026.`;
        } else if (lamaContra) {
          rationale = `Người bệnh còn triệu chứng/đợt cấp nhưng có chống chỉ định kháng muscarinic (glôcôm góc đóng / bí tiểu) nên không thể phối hợp LAMA: Tiếp tục duy trì nền tảng không kháng cholinergic (${medName}), kiểm tra kỹ thuật hít và phối hợp phục hồi chức năng hô hấp / thuốc bổ trợ đường uống hoặc sinh học nếu đủ tiêu chuẩn.`;
        } else if (groupE) {
          rationale = `Người bệnh còn đợt cấp nhưng không có chỉ định thêm ICS (BCAT thấp hoặc tiền sử viêm phổi tái diễn): Tiếp tục duy trì nền tảng giãn phế quản kép (${medName}), kiểm tra tuân thủ/kỹ thuật hít và xem xét bổ sung thuốc dự phòng đợt cấp đường uống (Roflumilast hoặc Azithromycin) theo kiểu hình.`;
        } else {
          rationale = `Người bệnh còn khó thở dai dẳng trên nền ${medName} (không thêm ICS chỉ vì khó thở đơn thuần theo GOLD 2026): Tiếp tục duy trì thuốc giãn phế quản nền tảng, kiểm tra kỹ thuật hít/lưu lượng đỉnh hít vào, chỉ định phục hồi chức năng hô hấp và tầm soát nguyên nhân khó thở ngoài COPD.`;
        }
      } else if (prof.ics && prof.laba) {
        rationale =
          'Theo GOLD 2026: Người bệnh đang kiểm soát triệu chứng và đợt cấp trên phác đồ ICS + LABA (không có biến chứng viêm phổi tái diễn và không thuộc diện rút ICS) được khuyến cáo tiếp tục duy trì đều đặn và kiểm tra kỹ thuật hít mỗi lần tái khám.';
      } else {
        rationale =
          'Người bệnh đang kiểm soát ổn định triệu chứng và không có đợt cấp trên thuốc giãn phế quản tác dụng kéo dài hiện tại: Tiếp tục duy trì đều đặn hằng ngày, kiểm tra kỹ thuật sử dụng bình hít và mức độ tuân thủ định kỳ.';
      }

      return {
        id:
          slotIndex === 0
            ? 'rec_copd_continue_maintenance'
            : `rec_copd_continue_maintenance_${slotIndex}`,
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: hasKb ? canonical : med.drugId,
        drugNameVi: medName,
        dose: doseText,
        title,
        rationale,
        warnings,
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_dyspnea_laba_lama',
          'gold.copd.2026.followup_ics_laba_continue',
          'byt.copd.2026.tiotropium_dose',
          'byt.copd.2026.budesonide_formoterol_dose',
        ],
        priority: 83,
      };
    },
  };
}

export const copdFollowupContinueRules: Rule[] = [
  {
    id: 'copd.followup.continue_triple',
    module: 'copd',
    nameVi: 'Duy trì nền tảng ba thuốc (ICS + LAMA + LABA) khi không có chỉ định rút ICS',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.ics_withdrawal',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.tiotropium_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'triple') return false;
      return getPlannedCopdInhalerChangeDrugId(ctx) === undefined;
    },
    produce: (ctx) => {
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const activeSingleTriple = ctx.normalized.currentMeds.find((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.ics && p.lama && p.laba);
      });
      const activeOpenLama = ctx.normalized.currentMeds.find((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.lama && !p.ics);
      });

      const isOpenTriple = !activeSingleTriple && Boolean(activeOpenLama);
      const targetId = activeSingleTriple
        ? getInhalerProfile(activeSingleTriple.drugId)!.canonicalId
        : activeOpenLama
          ? getInhalerProfile(activeOpenLama.drugId)!.canonicalId
          : selectTripleInhaler(ctx);
      const d = drug(targetId);
      const doseText =
        targetId === 'tiotropium'
          ? formatCopdTiotropiumDose(avoidDpi)
          : fmtDose(dose(targetId, 'target'));
      const priorPneum = Boolean(ctx.normalized.customInputs?.priorPneumonia);
      const hasResidualBurden = isGroupEConfirmed(ctx) || isHighSymptomsConfirmed(ctx);
      const warnings = [
        ...getLamaWarnings(ctx, targetId),
        ...getHepaticTripleWarnings(ctx, targetId),
        ...(priorPneum && hasConcurrentAsthma(ctx)
          ? [
              'Tiền sử viêm phổi tái diễn trên nền đồng mắc Hen – COPD: Không tự ý cắt bỏ hoàn toàn ICS vì nguy cơ cơn hen kịch phát; cần cân nhắc dùng liều ICS thấp nhất có hiệu quả, súc miệng kỹ sau hít và tiêm phòng phế cầu/cúm/RSV đầy đủ.',
            ]
          : []),
      ];

      const title = isOpenTriple
        ? `Tiếp tục duy trì thành phần LAMA (${d.nameVi}) trong phác đồ bộ ba mở (ICS + LABA + LAMA)`
        : hasResidualBurden
          ? `Duy trì nền tảng ba thuốc hít (${d.nameVi}) kết hợp đánh giá leo thang theo kiểu hình & phục hồi chức năng hô hấp`
          : `Tiếp tục duy trì phác đồ ba thành phần (ICS + LAMA + LABA – ${d.nameVi})`;

      const rationale = hasResidualBurden
        ? 'Theo GOLD 2026 (PDF p. 77 / trang in 66) và BYT QĐ 2131/2026: Ở người bệnh vẫn còn triệu chứng khó thở hoặc đợt cấp trên nền ba thuốc (ICS + LAMA + LABA), cần tiếp tục duy trì đầy đủ nền tảng 3 thành phần hít, kiểm tra chặt chẽ kỹ thuật hít/tuân thủ, phối hợp phục hồi chức năng hô hấp và đánh giá chỉ định thuốc bổ trợ chuyên biệt (sinh học Dupilumab/Mepolizumab, Roflumilast hoặc Azithromycin).'
        : 'Theo GOLD 2026 (PDF p. 77 / trang in 66) và BYT QĐ 2131/2026: Người bệnh đang đáp ứng ổn định trên phác đồ ba thuốc ICS + LAMA + LABA (bao gồm đồng mắc Hen – COPD) cần tiếp tục duy trì đủ cả 3 thành phần, kiểm tra kỹ thuật sử dụng bình hít định kỳ.';

      return {
        id: 'rec_copd_continue_triple',
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: d.id,
        drugNameVi: d.nameVi,
        dose: doseText,
        title,
        rationale,
        warnings,
        gates: [],
        citationIds: [
          'gold.copd.2026.ics_withdrawal',
          'byt.copd.2026.triple_therapy_indication',
          'byt.copd.2026.tiotropium_dose',
        ],
        priority: 89,
      };
    },
  },

  {
    id: 'copd.followup.continue_open_triple_ics_laba',
    module: 'copd',
    nameVi: 'Duy trì đồng thời thành phần ICS + LABA trong phác đồ bộ ba mở (2 bình hít)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.ics_withdrawal',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.budesonide_formoterol_dose',
    ],
    when: (ctx) => {
      if (!hasConfirmedStableCopd(ctx)) return false;
      if (hasAnticholinergicContra(ctx)) return false;
      if (resolveEffectiveInhaler(ctx) !== 'triple') return false;
      if (getPlannedCopdInhalerChangeDrugId(ctx) === undefined) {
        if (getAsthmaPrescribedIcsLabaId(ctx) !== undefined) return false;
        if (getAsthmaPrescribedMonoIcsId(ctx) !== undefined) return false;
        const hasSingleTriple = ctx.normalized.currentMeds.some((m) => {
          const p = getInhalerProfile(m.drugId);
          return Boolean(p && p.ics && p.lama && p.laba);
        });
        if (hasSingleTriple) return false;
        return ctx.normalized.currentMeds.some((m) => {
          const p = getInhalerProfile(m.drugId);
          return Boolean(p && p.ics && p.laba && !p.lama);
        });
      }
      return false;
    },
    produce: (ctx) => {
      const openIcsLaba = ctx.normalized.currentMeds.find((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && p.ics && p.laba && !p.lama);
      })!;
      const canonical = getInhalerProfile(openIcsLaba.drugId)!.canonicalId;
      const hasKb = hasDrug(canonical);
      const medName = openIcsLaba.name || (hasKb ? drug(canonical).nameVi : openIcsLaba.drugId);
      const avoidDpi = hasWeakInspiratoryFlow(ctx) || hasMilkProteinAllergy(ctx);
      const doseText = formatContinuedInhalerDose(
        canonical,
        hasKb,
        avoidDpi,
        ctx.normalized.selectedModules.includes('asthma'),
        hasConcurrentAsthma(ctx)
      );
      return {
        id: 'rec_copd_continue_open_triple_ics_laba',
        module: 'copd',
        tier: 'Duy trì phác đồ nền tảng',
        tierOrder: 1,
        action: 'CONTINUE',
        drugId: hasKb ? canonical : openIcsLaba.drugId,
        drugNameVi: medName,
        dose: doseText,
        title: `Tiếp tục duy trì thành phần ICS + LABA (${medName}) song song với LAMA trong phác đồ bộ ba mở`,
        rationale:
          'Bệnh nhân đang sử dụng phác đồ bộ ba mở gồm 2 bình hít (ICS + LABA phối hợp cùng LAMA): Cần ghi nhận duy trì đầy đủ cả bình ICS + LABA và bình LAMA trên đơn thuốc để tránh bỏ sót thành phần điều trị nền; có thể cân nhắc gộp sang 1 bình hít ba thành phần duy nhất nếu phù hợp điều kiện chi trả để tăng tuân thủ.',
        gates: [],
        citationIds: [
          'gold.copd.2026.ics_withdrawal',
          'byt.copd.2026.triple_therapy_indication',
          'byt.copd.2026.budesonide_formoterol_dose',
        ],
        priority: 88,
      };
    },
  },

  makeContinueControlledInhalerRule(0),
  makeContinueControlledInhalerRule(1), // qa-allow: index - khe duy trì bình hít thứ 2 trong phác đồ đôi mở
];
