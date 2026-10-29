import type { Action, GateResult, Rule } from '../../engine/types';
import { missingInputRec, need } from '../../engine/require';
import { dose, thFor } from '../../kb-types/access';
import {
  findCurrentMed,
  formatCurrentMedDoseVi,
  formatHfDose,
  getChildPugh,
  getCongestionStatus,
  getCustomInput,
  getDrugDisplayVi,
  getHfPhenotype,
  hasAcuteBronchospasm,
  hasHfContext,
  hasStableAsthmaHistory,
  hasUnpacedConductionBlock,
  HF_BB_IDS,
  HF_SELECTIVE_BB_IDS,
  isAcutelyDecompensated,
  isAtOrAboveTargetDose,
  isLactating,
  isOutpatientDecompensatedCrisis,
  isPregnant,
  isShockOrInotrope,
  NON_HF_BB_IDS,
  resolveMatchedComponentId,
} from './helpers';

const ALL_ORAL_BB_IDS = [...HF_BB_IDS, ...NON_HF_BB_IDS] as const;

export const hfrefBbRules: Rule[] = [
  {
    id: 'hf.fmt.bb',
    module: 'hf',
    nameVi: 'Trụ cột Chẹn beta bằng chứng ở HFrEF & HFimpEF',
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    citationIds: ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6', 'esc.hf.2026.bb_table_s6_asthma_contra'],
    when: (ctx) => {
      if (!hasHfContext(ctx)) return false;
      const anyBb = findCurrentMed(ctx, ALL_ORAL_BB_IDS);
      if (ctx.settings.setting === 'inpatient' && Boolean(anyBb)) return false;
      if (need(ctx, 'lvef') === undefined) return true;
      const p = getHfPhenotype(ctx);
      return p === 'hfref' || (p === 'hfimpef' && Boolean(anyBb));
    },
    produce: (ctx) => {
      const cits = ['esc.hf.2026.bb_doses', 'esc.hf.2026.bb_guidance_table_s6', 'esc.hf.2026.bb_table_s6_asthma_contra'];
      const activeHfBb = findCurrentMed(ctx, HF_BB_IDS);
      const activeNonHfBb = !activeHfBb ? findCurrentMed(ctx, NON_HF_BB_IDS) : undefined;
      const anyActiveBb = activeHfBb ?? activeNonHfBb;
      const matchedHfBbId = resolveMatchedComponentId(activeHfBb, HF_BB_IDS);
      const currentDrugId = anyActiveBb?.drugId ?? 'bisoprolol';

      if (hasUnpacedConductionBlock(ctx)) {
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: anyActiveBb ? 'STOP' : 'AVOID',
          drugId: currentDrugId,
          drugNameVi: getDrugDisplayVi(currentDrugId, anyActiveBb),
          title: `${anyActiveBb ? 'Ngưng ngay' : 'Chống chỉ định'} chẹn beta do block nhĩ-thất độ II–III / hội chứng suy nút xoang chưa đặt máy tạo nhịp`,
          rationale: 'Chống chỉ định tuyệt đối chẹn beta khi có block nhĩ-thất độ II–III hoặc hội chứng suy nút xoang chưa được bảo vệ bằng máy tạo nhịp vĩnh viễn.',
          gates: [{ parameter: 'Dẫn truyền nhĩ-thất', passed: false, messageVi: 'Block AV độ II–III / SSS chưa có máy tạo nhịp' }],
          citationIds: cits,
          priority: 97,
        };
      }

      if (hasAcuteBronchospasm(ctx)) {
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'An toàn hô hấp cấp (Cơn hen cấp / Co thắt phế quản cấp)',
          tierOrder: 1,
          action: anyActiveBb ? 'HOLD' : 'DEFER',
          drugId: currentDrugId,
          drugNameVi: getDrugDisplayVi(currentDrugId, anyActiveBb),
          title: anyActiveBb
            ? `Tạm ngưng ngay ${getDrugDisplayVi(currentDrugId, anyActiveBb)} trong cơn co thắt phế quản / đợt cấp hen phế quản`
            : 'Trì hoãn khởi trị chẹn beta do đang có co thắt phế quản cấp / cơn hen cấp',
          rationale: 'Trong cơn co thắt phế quản cấp hoặc đợt cấp hen phế quản giảm oxy máu, bắt buộc tạm ngưng cả chẹn beta chọn lọc beta-1 để không cản trở đáp ứng thuốc giãn phế quản SABA cứu nguy.',
          gates: [{ parameter: 'Co thắt phế quản cấp', passed: false, messageVi: 'Đang cơn hen cấp / co thắt phế quản cấp' }],
          citationIds: cits,
          priority: 97,
        };
      }

      if (isShockOrInotrope(ctx)) {
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: currentDrugId,
          drugNameVi: getDrugDisplayVi(currentDrugId, anyActiveBb),
          title: `Tạm hoãn ${getDrugDisplayVi(currentDrugId, anyActiveBb)} do sốc tim / giảm tưới máu`,
          rationale: 'Không dùng hoặc phải tạm ngưng chẹn beta khi đang sốc tim hoặc phụ thuộc thuốc vận mạch/tăng co bóp.',
          gates: [{ parameter: 'Huyết động', passed: false, messageVi: 'Sốc tim / đang truyền vận mạch' }],
          citationIds: ['esc.hf.2026.acute_bb_hypoperfusion', ...cits],
          priority: 95,
        };
      }

      const hr = need(ctx, 'hr');
      if (hr === undefined) return missingInputRec('hf', 'hr', 'kiểm tra tần số tim trước khi kê hoặc tăng liều chẹn beta', cits);
      const sbp = need(ctx, 'sbp');
      if (sbp === undefined) return missingInputRec('hf', 'sbp', 'kiểm tra SBP trước khi kê hoặc tăng liều chẹn beta', cits);
      if (need(ctx, 'lvef') === undefined) return null;

      const hrMinInit = thFor('hr', 'hf.bb.hr_min_start');
      const hrMinActive = thFor('hr', 'hf.digoxin.hr_min');
      const sbpMin = thFor('sbp', 'hf.bb.sbp_min_start');
      const minHrGate = anyActiveBb ? hrMinActive : hrMinInit;
      const gates: GateResult[] = [
        { parameter: 'HR', passed: hr >= minHrGate, value: hr, threshold: `>= ${minHrGate}`, messageVi: `HR >= ${minHrGate} bpm` },
        { parameter: 'SBP', passed: sbp >= sbpMin, value: sbp, threshold: `>= ${sbpMin}`, messageVi: `SBP >= ${sbpMin} mmHg` },
      ];

      if (sbp < sbpMin || hr < minHrGate) {
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'HOLD',
          drugId: currentDrugId,
          drugNameVi: getDrugDisplayVi(currentDrugId, anyActiveBb),
          title: `Tạm hoãn ${getDrugDisplayVi(currentDrugId, anyActiveBb)} do huyết áp thấp hoặc nhịp tim chậm`,
          rationale: `Không khởi trị hoặc duy trì liều hiện tại của chẹn beta khi SBP dưới ${sbpMin} mmHg hoặc nhịp tim dưới ${minHrGate} chu kỳ/phút.`,
          gates,
          citationIds: ['esc.hf.2026.low_hr_50_digoxin_review', ...cits],
          priority: 92,
        };
      }

      const overtDecomp = getCongestionStatus(ctx) === 'overt' || isAcutelyDecompensated(ctx) || isOutpatientDecompensatedCrisis(ctx);
      if (!anyActiveBb && overtDecomp) {
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'DEFER',
          drugId: 'bisoprolol',
          drugNameVi: getDrugDisplayVi('bisoprolol'),
          title: 'Trì hoãn khởi trị mới chẹn beta cho tới khi giải quyết sung huyết cấp',
          rationale: 'Chống chỉ định khởi trị mới chẹn beta khi đang phù phổi hoặc sung huyết rõ; chỉ khởi đầu liều thấp sau khi đã giải áp dịch đạt đẳng dịch.',
          gates,
          citationIds: cits,
          priority: 90,
        };
      }

      const childPugh = getChildPugh(ctx);
      if ((childPugh === 'B' || childPugh === 'C') && (matchedHfBbId === 'carvedilol' || matchedHfBbId === 'nebivolol')) {
        const bisoStart = formatHfDose(dose('bisoprolol', 'start'));
        const bisoTarget = formatHfDose(dose('bisoprolol', 'target'));
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (An toàn gan Child-Pugh)',
          tierOrder: 1,
          action: childPugh === 'C' && overtDecomp ? 'STOP' : 'SWITCH',
          drugId: childPugh === 'C' && overtDecomp ? currentDrugId : 'bisoprolol',
          switchFrom: childPugh === 'C' && overtDecomp ? undefined : currentDrugId,
          drugNameVi: childPugh === 'C' && overtDecomp ? getDrugDisplayVi(currentDrugId, anyActiveBb) : getDrugDisplayVi('bisoprolol'),
          dose: childPugh === 'C' && overtDecomp ? undefined : bisoStart,
          title: `Ngưng ${getDrugDisplayVi(currentDrugId, anyActiveBb)} ở xơ gan Child-Pugh ${childPugh} và chuyển sang Bisoprolol liều thấp`,
          rationale: `Carvedilol và Nebivolol chuyển hóa mạnh qua gan (nồng độ tăng gấp nhiều lần ở xơ gan) và chống chỉ định ở suy gan nặng; chuyển sang Bisoprolol khởi đầu ${bisoStart} (tối đa ${bisoTarget} nếu dung nạp).`,
          gates,
          citationIds: ['fda.hf.carvedilol_hepatic_contra', 'ema.hf.bisoprolol_contra_hepatic', ...cits],
          priority: 94,
        };
      }

      const preferLactationBb = isLactating(ctx);
      // ASTHMA-R2-208: ở người bệnh hen, không liệt kê Carvedilol (chẹn beta không chọn lọc) trong các lựa chọn chuyển đổi.
      const asthmaHx = hasStableAsthmaHistory(ctx);
      const provenBbListVi = asthmaHx
        ? 'Bisoprolol hoặc Metoprolol succinate – chẹn beta chọn lọc beta-1 do có hen phế quản'
        : 'Bisoprolol, Metoprolol succinate hoặc Carvedilol';
      if (activeNonHfBb) {
        const targetBb = preferLactationBb ? 'metoprolol_succinate' : 'bisoprolol';
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: targetBb,
          switchFrom: activeNonHfBb.drugId,
          drugNameVi: getDrugDisplayVi(targetBb),
          dose: `${formatHfDose(dose(targetBb, 'start'))}; đích ${formatHfDose(dose(targetBb, 'target'))}`,
          title: `Chuyển từ ${getDrugDisplayVi(activeNonHfBb.drugId, activeNonHfBb)} sang chẹn beta chứng minh giảm tử vong suy tim (${getDrugDisplayVi(targetBb)})`,
          rationale: `${getDrugDisplayVi(activeNonHfBb.drugId, activeNonHfBb)} không có bằng chứng giảm tử vong ở HFrEF; khuyến cáo chuyển sang chẹn beta bằng chứng (${provenBbListVi}).`,
          gates,
          citationIds: ['aha.hf.2022.bb_3_mortality_proven', ...cits],
          priority: 93,
        };
      }

      if (ctx.settings.profile === 'US' && matchedHfBbId === 'nebivolol' && activeHfBb) {
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (COR 1 - US)',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: 'bisoprolol',
          switchFrom: activeHfBb.drugId,
          drugNameVi: getDrugDisplayVi('bisoprolol'),
          dose: `${formatHfDose(dose('bisoprolol', 'start'))}; đích ${formatHfDose(dose('bisoprolol', 'target'))}`,
          title: `Chuyển từ Nebivolol sang chẹn beta chứng minh giảm tử vong (${provenBbListVi})`,
          rationale: asthmaHx
            ? 'Theo AHA/ACC/HFSA 2022, chỉ 3 chẹn beta chứng minh giảm tử vong ở HFrEF (Nebivolol không được FDA phê duyệt cho suy tim); do có hen phế quản, chỉ chọn Bisoprolol hoặc Metoprolol succinate (chọn lọc beta-1).'
            : 'Theo AHA/ACC/HFSA 2022, chỉ Bisoprolol, Carvedilol và Metoprolol succinate chứng minh giảm tử vong ở HFrEF (Nebivolol không được FDA phê duyệt cho suy tim).',
          gates,
          profileDiff: {
            INTL: 'ESC 2026 liệt kê Nebivolol là lựa chọn ở người cao tuổi (thử nghiệm SENIORS) nhưng lưu ý thuốc không giảm tử vong độc lập.',
            US: 'AHA/ACC/HFSA 2022 (COR 1-A) chỉ khuyến cáo Bisoprolol, Carvedilol hoặc Metoprolol succinate.',
            VN: 'BYT QĐ 1857/2022 bao gồm 4 thuốc với ưu tiên nhóm giảm tử vong.',
          },
          citationIds: ['aha.hf.2022.bb_3_mortality_proven', 'esc.hf.2026.nebivolol_seniors_mortality'],
          priority: 92,
        };
      }

      if (preferLactationBb) {
        const onSafeLactBb = matchedHfBbId === 'metoprolol_succinate' || matchedHfBbId === 'bisoprolol';
        const chosenLactBb = onSafeLactBb && matchedHfBbId ? matchedHfBbId : 'metoprolol_succinate';
        const actLact: Action = activeHfBb
          ? onSafeLactBb
            ? isAtOrAboveTargetDose(ctx, activeHfBb, chosenLactBb) || overtDecomp || hr < hrMinInit
              ? 'CONTINUE'
              : 'UPTITRATE'
            : 'SWITCH'
          : 'START';
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (An toàn cho con bú)',
          tierOrder: 1,
          action: actLact,
          drugId: chosenLactBb,
          switchFrom: actLact === 'SWITCH' ? activeHfBb?.drugId : undefined,
          drugNameVi: getDrugDisplayVi(chosenLactBb),
          dose: actLact === 'CONTINUE'
            ? formatCurrentMedDoseVi(activeHfBb, chosenLactBb)
            : `${formatHfDose(dose(chosenLactBb, 'start'))}; đích ${formatHfDose(dose(chosenLactBb, 'target'))}`,
          title: `${actLact === 'SWITCH' ? 'Chuyển sang' : actLact === 'START' ? 'Khởi trị' : 'Duy trì'} ${getDrugDisplayVi(chosenLactBb)} trong giai đoạn cho con bú`,
          rationale: 'Theo ESC 2025, Metoprolol succinate bài tiết qua sữa mẹ rất thấp và được ưu tiên hàng đầu khi cho con bú.',
          gates,
          citationIds: ['esc.preg.2025.lactation_metoprolol_bb', ...cits],
          priority: 92,
        };
      }

      const stableAsthma = hasStableAsthmaHistory(ctx);
      const preg = isPregnant(ctx);
      const pheno = getHfPhenotype(ctx);
      if (stableAsthma || preg) {
        const nonSel = activeHfBb && matchedHfBbId && !(HF_SELECTIVE_BB_IDS as readonly string[]).includes(matchedHfBbId);
        const selId = activeHfBb && matchedHfBbId && !nonSel ? matchedHfBbId : 'bisoprolol';
        const holdTitrate = isAtOrAboveTargetDose(ctx, activeHfBb, selId) || overtDecomp || pheno === 'hfimpef' || hr < hrMinInit;
        const act: Action = nonSel
          ? 'SWITCH'
          : activeHfBb
            ? holdTitrate
              ? 'CONTINUE'
              : 'UPTITRATE'
            : stableAsthma
              ? 'CONSIDER'
              : 'START';
        return {
          id: 'rec_hf_bb',
          module: 'hf',
          tier: 'Trụ cột FMT (Class I)',
          tierOrder: 1,
          action: act,
          drugId: selId,
          switchFrom: nonSel ? activeHfBb?.drugId : undefined,
          drugNameVi: 'Bisoprolol (hoặc Metoprolol succinate - chẹn beta chọn lọc beta-1)',
          dose: act === 'CONTINUE'
            ? formatCurrentMedDoseVi(activeHfBb, selId)
            : `${formatHfDose(dose(selId, 'start'))}; đích ${formatHfDose(dose(selId, 'target'))}`,
          title: stableAsthma
            ? 'Thận trọng cân nhắc chẹn beta chọn lọc beta-1 (Bisoprolol / Metoprolol succinate) khi hen đã kiểm soát ổn định'
            : 'Ưu tiên chẹn beta chọn lọc beta-1 (Bisoprolol / Metoprolol succinate) trong thai kỳ',
          rationale: stableAsthma
            ? 'Ở bệnh nhân tiền sử hen ổn định (không có co thắt phế quản cấp), chống chỉ định chẹn beta không chọn lọc (chẹn cả beta-2, nhóm chẹn alpha-beta); chỉ cân nhắc Bisoprolol hoặc Metoprolol succinate liều thấp dưới giám sát chuyên khoa.'
            : 'Trong thai kỳ, ưu tiên chẹn beta chọn lọc beta-1 (Bisoprolol hoặc Metoprolol succinate) và theo dõi tăng trưởng thai nhi (Class I-C).',
          gates,
          citationIds: ['esc.hf.2026.pregnancy_bb_switch', ...cits],
          priority: 91,
        };
      }

      const bbId = matchedHfBbId ?? 'bisoprolol';
      const atTarget = isAtOrAboveTargetDose(ctx, activeHfBb, bbId);
      const maxTol = Boolean(getCustomInput(ctx, 'bbMaxTolerated'));
      const act: Action = !activeHfBb
        ? 'START'
        : atTarget || maxTol || overtDecomp || pheno === 'hfimpef' || hr < hrMinInit
          ? 'CONTINUE'
          : 'UPTITRATE';

      const weight = need(ctx, 'weight');
      const highCarvCut = thFor('weight', 'hf.bb.carvedilol_weight_high_dose');
      const highCarvSingle = thFor('dose_mg', 'hf.bb.carvedilol_high_target_dose_mg');
      const efEsc = thFor('lvef', 'hf.ef.hfref_max_esc2026');
      const targetStr =
        bbId === 'carvedilol' && weight !== undefined && weight > highCarvCut
          ? `${highCarvSingle} mg x 2 lần/ngày (cân nặng > ${highCarvCut} kg)`
          : formatHfDose(dose(bbId, 'target'));

      return {
        id: 'rec_hf_bb',
        module: 'hf',
        tier: 'Trụ cột FMT (Class I)',
        tierOrder: 1,
        action: act,
        drugId: activeHfBb ? activeHfBb.drugId : bbId,
        drugNameVi: activeHfBb ? getDrugDisplayVi(activeHfBb.drugId, activeHfBb) : 'Bisoprolol (hoặc Carvedilol / Metoprolol succinate)',
        dose: act === 'CONTINUE'
          ? formatCurrentMedDoseVi(activeHfBb, bbId)
          : act === 'UPTITRATE'
            ? `Đang dùng: ${formatCurrentMedDoseVi(activeHfBb) ?? 'chưa rõ liều'}; đích ${targetStr}`
            : `${formatHfDose(dose(bbId, 'start'))}; đích ${targetStr}`,
        title: act === 'START'
          ? 'Khởi trị trụ cột Chẹn beta suy tim: Bisoprolol'
          : act === 'UPTITRATE'
            ? `Chuẩn độ tăng liều ${getDrugDisplayVi(bbId)} tới liều đích`
            : `Tiếp tục duy trì ${getDrugDisplayVi(activeHfBb?.drugId ?? bbId, activeHfBb)}`,
        rationale: 'Chẹn beta bằng chứng ở HFrEF (Class I-A: Bisoprolol, Carvedilol, Metoprolol succinate) giúp giảm tử vong toàn bộ, đột tử do tim và nhập viện suy tim.',
        gates,
        profileDiff: {
          INTL: `ESC 2026 khuyến cáo Class I-A cho toàn bộ HFrEF (LVEF dưới ${efEsc}%); Nebivolol chỉ giảm tiêu chí gộp ở người cao tuổi (SENIORS).`,
          US: 'AHA/ACC/HFSA 2022 (COR 1-A) giới hạn ở 3 thuốc chứng minh giảm tử vong: Bisoprolol, Carvedilol, Metoprolol succinate.',
          VN: 'BYT QĐ 1857/2022 khuyến cáo Class I-A ở HFrEF.',
        },
        citationIds: ['aha.hf.2022.bb_3_mortality_proven', 'esc.hf.2026.nebivolol_seniors_mortality', ...cits],
        priority: 94,
      };
    },
  },
];
