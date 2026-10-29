import type { Rule } from '../../engine/types';
import { drug, dose, fmtDose, hasDrug } from '../../kb-types';
import {
  COPD_PROFILES,
  getInhalerProfile,
  formatCopdBudesonideFormoterolDose,
  formatCopdBeclometasoneFormoterolDose,
  formatCopdTiotropiumDose,
  hasConfirmedCopdSpirometry,
  hasOutpatientAcuteRespiratoryFailure,
  hasAnticholinergicContra,
  hasWeakInspiratoryFlow,
  hasMilkProteinAllergy,
  getStrongCyp3a4InhibitorMed,
  getLamaWarnings,
  getHepaticTripleWarnings,
  getActiveDpiInhalerMed,
  getAllActiveDpiInhalerMeds,
  getAllActiveCyp3a4SensitiveInhalerMeds,
  getDualFormLactoseDeviceWarningMed,
  getDpiSwitchTargetDrugId,
  getCyp3a4SafeSwitchTargetDrugId,
  getLamaContraAlternativeTargetDrugId,
  getPlannedTherapeuticInhalerChangeDrugId,
  getSupersededInhalersToStop,
} from './helpers';

function makeDpiMilkAllergyStopWithoutSpiroRule(slotIndex: number): Rule {
  return {
    id:
      slotIndex === 0
        ? 'copd.safety.dpi_milk_allergy_stop_without_spiro'
        : `copd.safety.dpi_milk_allergy_stop_without_spiro_${slotIndex}`,
    module: 'copd',
    nameVi: 'Ngừng khẩn mọi bình bột khô DPI chứa lactose khi có dị ứng nặng đạm sữa bò (chưa đủ hô hấp ký)',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.dpi_inspiratory_flow_switch',
      'ema.ultibro.lactose_excipient_contra',
      'byt.copd.2026.discharge_checklist',
    ],
    when: (ctx) =>
      !hasConfirmedCopdSpirometry(ctx) &&
      hasMilkProteinAllergy(ctx) &&
      getAllActiveDpiInhalerMeds(ctx).length > slotIndex,
    produce: (ctx) => {
      const oldDpi = getAllActiveDpiInhalerMeds(ctx)[slotIndex]!;
      const oldName = oldDpi.name || (hasDrug(oldDpi.drugId) ? drug(oldDpi.drugId).nameVi : oldDpi.drugId);
      return {
        id:
          slotIndex === 0
            ? 'rec_copd_stop_dpi_milk_allergy'
            : `rec_copd_stop_dpi_milk_allergy_${slotIndex}`,
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'STOP',
        drugId: oldDpi.drugId,
        drugNameVi: oldName,
        dose: undefined,
        title: `NGỪNG KHẨN ${oldName} (bình bột khô DPI chứa lactose) do tiền sử dị ứng nặng / phản vệ đạm sữa bò`,
        rationale:
          'Bình bột khô hít (DPI) chứa tá dược lactose monohydrate có thể lẫn vết protein sữa bò gây sốc phản vệ và co thắt phế quản cấp đe dọa tính mạng ở người dị ứng nặng đạm sữa bò. Bắt buộc ngừng ngay toàn bộ bình DPI đang dùng và hoàn tất đo chức năng hô hấp để chọn thiết bị pMDI/SMI không chứa lactose phù hợp.',
        gates: [],
        citationIds: [
          'gold.copd.2026.dpi_inspiratory_flow_switch',
          'ema.ultibro.lactose_excipient_contra',
          'byt.copd.2026.discharge_checklist',
        ],
        priority: 99,
      };
    },
  };
}

export const copdSafetyInhalerDeviceRules: Rule[] = [
  {
    id: 'copd.safety.lama_contra_alternative',
    module: 'copd',
    nameVi: 'Phác đồ giãn phế quản thay thế không chứa LAMA khi có glôcôm góc đóng / bí tiểu',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.initial_group_a',
      'gold.copd.2026.concurrent_asthma',
      'gold.copd.2026.lama_glaucoma_caution',
      'gina.copd.2026.lama_urinary_retention',
      'byt.copd.2026.budesonide_formoterol_dose',
      'ema.fostair.beclometasone_esterase_cyp3a',
    ],
    when: (ctx) => getLamaContraAlternativeTargetDrugId(ctx) !== undefined,
    produce: (ctx) => {
      const altId = getLamaContraAlternativeTargetDrugId(ctx)!;
      const altDrug = drug(altId);
      const requireLactoseFree = hasMilkProteinAllergy(ctx) || hasWeakInspiratoryFlow(ctx);
      const startDose =
        altId === 'budesonide_formoterol'
          ? formatCopdBudesonideFormoterolDose(requireLactoseFree)
          : altId === 'beclometasone_formoterol'
            ? formatCopdBeclometasoneFormoterolDose(requireLactoseFree)
            : fmtDose(dose(altId, 'start'));
      const oldMedToSwitch = ctx.normalized.currentMeds.find((m) => {
        const p = getInhalerProfile(m.drugId);
        return Boolean(p && (p.lama || p.laba || p.ics) && p.canonicalId !== altId);
      });

      return {
        id: 'rec_copd_lama_contra_alternative',
        module: 'copd',
        tier: 'Thuốc nền tảng (Không kháng cholinergic)',
        tierOrder: 1,
        action: oldMedToSwitch ? 'SWITCH' : 'START',
        drugId: altId,
        switchFrom: oldMedToSwitch?.drugId,
        drugNameVi: altDrug.nameVi,
        dose: startDose,
        title: `Lựa chọn giãn phế quản thay thế không chứa LAMA: ${altDrug.nameVi} (tránh glôcôm góc đóng / bí tiểu)`,
        rationale:
          altId === 'budesonide_formoterol' || altId === 'beclometasone_formoterol'
            ? 'Do người bệnh có chống chỉ định dùng nhóm kháng muscarinic LAMA (glôcôm góc đóng / bí tiểu) kèm chỉ định cần thành phần ICS (Nhóm E tăng bạch cầu ái toan hoặc đồng mắc Hen), lựa chọn phối hợp ICS + LABA ở liều duy trì cố định chuẩn cho COPD theo BYT QĐ 2131/2026 (không tự dùng chế độ cắt cơn MART nếu không có Hen đồng mắc).'
            : 'Do người bệnh có glôcôm góc đóng hoặc bí tiểu nặng (chống chỉ định dùng nhóm kháng muscarinic LAMA), lựa chọn LABA phun hạt mịn không chứa LAMA (Olodaterol Respimat) để kiểm soát triệu chứng an toàn.',
        gates: [],
        citationIds: [
          'gold.copd.2026.initial_group_a',
          'gold.copd.2026.concurrent_asthma',
          'gold.copd.2026.lama_glaucoma_caution',
          'gina.copd.2026.lama_urinary_retention',
          'byt.copd.2026.budesonide_formoterol_dose',
          'ema.fostair.beclometasone_esterase_cyp3a',
        ],
        priority: 82,
      };
    },
  },

  makeDpiMilkAllergyStopWithoutSpiroRule(0),
  makeDpiMilkAllergyStopWithoutSpiroRule(1), // qa-allow: index - khe dừng bình DPI chứa lactose thứ 2
  makeDpiMilkAllergyStopWithoutSpiroRule(2), // qa-allow: index - khe dừng bình DPI chứa lactose thứ 3
  makeDpiMilkAllergyStopWithoutSpiroRule(3), // qa-allow: index - khe dừng bình DPI chứa lactose thứ 4

  {
    id: 'copd.safety.cyp3a4_inhaler_switch',
    module: 'copd',
    nameVi: 'Chuyển đổi bình hít chứa Salmeterol / Vilanterol / Fluticasone khi dùng thuốc ức chế mạnh CYP3A4',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'byt.copd.2026.salmeterol_cyp3a4_contra',
      'ema.fostair.beclometasone_esterase_cyp3a',
      'byt.copd.2026.olodaterol_tiotropium_dose',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.tiotropium_dose',
    ],
    when: (ctx) =>
      getPlannedTherapeuticInhalerChangeDrugId(ctx) === undefined &&
      getLamaContraAlternativeTargetDrugId(ctx) === undefined &&
      getCyp3a4SafeSwitchTargetDrugId(ctx) !== undefined,
    produce: (ctx) => {
      const targetId = getCyp3a4SafeSwitchTargetDrugId(ctx)!;
      const sensitiveMeds = getAllActiveCyp3a4SensitiveInhalerMeds(ctx);
      const oldMed = sensitiveMeds[0]!;
      const oldNames = sensitiveMeds
        .map((m) => m.name || (hasDrug(m.drugId) ? drug(m.drugId).nameVi : m.drugId))
        .join(' + ');
      const inhibitorMed = getStrongCyp3a4InhibitorMed(ctx);
      const inhibitorName = inhibitorMed?.name || inhibitorMed?.drugId || 'thuốc ức chế mạnh CYP3A4';
      const targetDrug = drug(targetId);
      const avoidDpi = hasMilkProteinAllergy(ctx) || hasWeakInspiratoryFlow(ctx);
      const startDose =
        targetId === 'tiotropium'
          ? formatCopdTiotropiumDose(avoidDpi)
          : targetId === 'beclometasone_formoterol'
            ? formatCopdBeclometasoneFormoterolDose(avoidDpi)
            : fmtDose(dose(targetId, 'start'));
      const hasLama = Boolean(getInhalerProfile(targetId)?.lama);
      const warnings = [
        ...(hasLama ? getLamaWarnings(ctx, targetId) : []),
        ...getHepaticTripleWarnings(ctx, targetId),
      ];

      return {
        id: 'rec_copd_switch_cyp3a4_inhaler',
        module: 'copd',
        tier: 'An toàn thuốc bắt buộc',
        tierOrder: 0,
        action: 'SWITCH',
        drugId: targetId,
        switchFrom: oldMed.drugId,
        drugNameVi: targetDrug.nameVi,
        dose: startDose,
        title: `CHUYỂN ĐỔI từ ${oldNames} sang ${targetDrug.nameVi} do tương tác chống chỉ định / nghiêm trọng với ${inhibitorName} (ức chế mạnh CYP3A4)`,
        rationale: `Người bệnh đang dùng ${inhibitorName} (thuốc ức chế mạnh enzym CYP3A4 như ritonavir, cobicistat, itraconazole, ketoconazole, voriconazole, clarithromycin). Phối hợp với ${oldNames} làm ức chế chuyển hóa qua gan của Salmeterol/Vilanterol (gây kéo dài khoảng QT, loạn nhịp thất – chống chỉ định theo Phụ lục 11 QĐ 2131/QĐ-BYT 2026) và/hoặc làm tăng vọt nồng độ toàn thân của Fluticasone (gây hội chứng Cushing, suy thượng thận cấp). Khuyến cáo chuyển sang ${targetDrug.nameVi} (chuyển hóa qua esterase / không phụ thuộc mạnh CYP3A4).`,
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: [
          'byt.copd.2026.salmeterol_cyp3a4_contra',
          'ema.fostair.beclometasone_esterase_cyp3a',
          'byt.copd.2026.olodaterol_tiotropium_dose',
          'byt.copd.2026.triple_therapy_indication',
          'byt.copd.2026.tiotropium_dose',
        ],
        priority: 95,
      };
    },
  },

  {
    id: 'copd.safety.dpi_inhaler_switch',
    module: 'copd',
    nameVi: 'Chuyển đổi từ bình bột khô (DPI) sang phun sương mịn (SMI) / pMDI + buồng đệm',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.followup_dyspnea_switch_device',
      'gold.copd.2026.dpi_inspiratory_flow_switch',
      'byt.copd.2026.olodaterol_tiotropium_dose',
      'byt.copd.2026.triple_therapy_indication',
      'byt.copd.2026.tiotropium_dose',
      'byt.copd.2026.budesonide_formoterol_dose',
      'ema.fostair.beclometasone_esterase_cyp3a',
    ],
    when: (ctx) =>
      getPlannedTherapeuticInhalerChangeDrugId(ctx) === undefined &&
      getLamaContraAlternativeTargetDrugId(ctx) === undefined &&
      getCyp3a4SafeSwitchTargetDrugId(ctx) === undefined &&
      getDpiSwitchTargetDrugId(ctx) !== undefined,
    produce: (ctx) => {
      const targetId = getDpiSwitchTargetDrugId(ctx)!;
      const allDpis = getAllActiveDpiInhalerMeds(ctx);
      const oldDpi = allDpis[0]!;
      const allOldNames = allDpis
        .map((m) => m.name || (hasDrug(m.drugId) ? drug(m.drugId).nameVi : m.drugId))
        .join(' + ');
      const targetDrug = drug(targetId);
      const startDose =
        targetId === 'tiotropium'
          ? formatCopdTiotropiumDose(true)
          : targetId === 'budesonide_formoterol'
            ? formatCopdBudesonideFormoterolDose(true)
            : targetId === 'beclometasone_formoterol'
              ? formatCopdBeclometasoneFormoterolDose(true)
              : fmtDose(dose(targetId, 'start'));
      const milkAllergy = hasMilkProteinAllergy(ctx);
      const weakFlow = hasWeakInspiratoryFlow(ctx);
      const reasonText =
        milkAllergy && weakFlow
          ? 'dị ứng nặng đạm sữa bò (cấm dùng DPI chứa lactose) kèm lưu lượng đỉnh hít vào yếu'
          : milkAllergy
            ? 'tiền sử dị ứng nặng/phản vệ với đạm sữa bò (chống chỉ định tuyệt đối các bình bột khô DPI chứa tá dược lactose)'
            : 'lưu lượng đỉnh hít vào yếu làm bột khô không phân tách đủ vào đường thở nhỏ';
      const hasLama = Boolean(getInhalerProfile(targetId)?.lama);
      const warnings = [
        ...(hasLama ? getLamaWarnings(ctx, targetId) : []),
        ...getHepaticTripleWarnings(ctx, targetId),
      ];

      return {
        id: 'rec_copd_switch_dpi_inhaler',
        module: 'copd',
        tier: 'Tối ưu hóa thiết bị & An toàn thuốc',
        tierOrder: 1,
        action: 'SWITCH',
        drugId: targetId,
        switchFrom: oldDpi.drugId,
        drugNameVi: targetDrug.nameVi,
        dose: startDose,
        title: `CHUYỂN ĐỔI thiết bị hít từ ${allOldNames} (DPI) sang ${targetDrug.nameVi} (không phụ thuộc lực hít / không chứa lactose)`,
        rationale: `Người bệnh có ${reasonText}. Cần chuyển đổi toàn bộ bình bột khô DPI đang dùng (${allOldNames}) sang chế phẩm phun sương hạt mịn SMI (Respimat) hoặc bình xịt định liều pMDI phối hợp buồng đệm có van (${targetDrug.nameVi}) để bảo đảm phân bố thuốc tối ưu tới phổi và an toàn dị ứng.`,
        warnings: warnings.length > 0 ? warnings : undefined,
        gates: [],
        citationIds: [
          'gold.copd.2026.followup_dyspnea_switch_device',
          'gold.copd.2026.dpi_inspiratory_flow_switch',
          'byt.copd.2026.olodaterol_tiotropium_dose',
          'byt.copd.2026.triple_therapy_indication',
          'byt.copd.2026.tiotropium_dose',
          'byt.copd.2026.budesonide_formoterol_dose',
          'ema.fostair.beclometasone_esterase_cyp3a',
        ],
        priority: 86,
      };
    },
  },

  {
    id: 'copd.safety.dual_form_device_warning',
    module: 'copd',
    nameVi: 'Chỉ định bắt buộc dạng bào chế pMDI + buồng đệm / SMI không chứa lactose cho thuốc đa dạng bào chế',
    setting: 'both',
    profiles: COPD_PROFILES,
    citationIds: [
      'gold.copd.2026.dpi_inspiratory_flow_switch',
      'byt.copd.2026.discharge_checklist',
    ],
    when: (ctx) => {
      if (hasOutpatientAcuteRespiratoryFailure(ctx)) return false;
      const dualMed = getDualFormLactoseDeviceWarningMed(ctx);
      if (!dualMed) return false;
      const medId = dualMed.drugId?.trim().toLowerCase();
      if (!medId) return false;
      if (hasAnticholinergicContra(ctx) && Boolean(getInhalerProfile(medId)?.lama)) return false;
      if (getCyp3a4SafeSwitchTargetDrugId(ctx) !== undefined) return false;
      const activeDpi = getActiveDpiInhalerMed(ctx);
      if (activeDpi && activeDpi.drugId?.trim().toLowerCase() === medId && getDpiSwitchTargetDrugId(ctx) !== undefined) {
        return false;
      }
      const supStopped = getSupersededInhalersToStop(ctx).some(
        (s) => s.med.drugId?.trim().toLowerCase() === medId
      );
      return !supStopped;
    },
    produce: (ctx) => {
      const dualMed = getDualFormLactoseDeviceWarningMed(ctx)!;
      const medId = dualMed.drugId.trim().toLowerCase();
      const medName = dualMed.name || (hasDrug(medId) ? drug(medId).nameVi : dualMed.drugId);
      const safeDeviceLabel =
        medId === 'tiotropium' || medId === 'spiriva'
          ? 'Spiriva Respimat (phun hạt mịn SMI – tuyệt đối KHÔNG cấp phát HandiHaler DPI)'
          : medId === 'budesonide_formoterol' || medId === 'symbicort'
            ? 'Symbicort Rapihaler pMDI kèm buồng đệm (tuyệt đối KHÔNG cấp phát Symbicort Turbuhaler DPI)'
            : medId === 'beclometasone_formoterol' || medId === 'foster'
              ? 'Foster pMDI kèm buồng đệm (tuyệt đối KHÔNG cấp phát Foster Nexthaler DPI)'
              : medId === 'beclometasone_glycopyrronium_formoterol' || medId === 'trimbow'
                ? 'Trimbow pMDI kèm buồng đệm (tuyệt đối KHÔNG cấp phát Trimbow Nexthaler DPI)'
                : 'dạng bình xịt định liều pMDI (Evohaler) kèm buồng đệm có van (tuyệt đối KHÔNG cấp phát Accuhaler/Diskus DPI)';
      return {
        id: 'rec_copd_dual_form_lactose_free_device',
        module: 'copd',
        tier: 'Tối ưu hóa thiết bị & An toàn thuốc',
        tierOrder: 1,
        action: 'MONITOR',
        title: `Kiểm soát dạng bào chế ${medName}: Bắt buộc cấp phát ${safeDeviceLabel}`,
        rationale:
          'Hoạt chất này lưu hành trên thị trường dưới cả hai dạng: bình bột khô DPI chứa tá dược lactose và bình xịt pMDI/SMI không chứa lactose. Trên người bệnh có dị ứng nặng đạm sữa bò hoặc lưu lượng đỉnh hít vào yếu, phải ghi rõ tên dạng bào chế pMDI + buồng đệm / SMI trên đơn thuốc để tránh cấp nhầm bình bột khô DPI gây phản vệ hoặc thất bại điều trị.',
        gates: [],
        citationIds: [
          'gold.copd.2026.dpi_inspiratory_flow_switch',
          'byt.copd.2026.discharge_checklist',
        ],
        priority: 85,
      };
    },
  },
];
