/**
 * GDMT-VN Safety - Vital Signs, Electrolyte, QTc, Renal & Pregnancy Gates
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Recommendation } from '../types';
import { hasCondition } from '../types';
import { renalBand, hasDrug, drug, type DrugEntry } from '../../kb-types';
import { currentRenalDoseAdjustment } from './renalDoseAdjustment';
import { expandDrugComponents } from './fdcMap';
import {
  DOAC_DRUG_IDS,
  isPregnancyContraindicated,
  getNormalizedDrugClasses
} from './drugClassify';
import { detectAcuteAki } from './clinicalStates';
import { evaluateElectrolyteAndQtSafety } from './electrolyteAndQtGates';
import { mergeCleanCitations, type MutableGateState } from './organAndCrisisGates';

export function applyVitalAndRenalGates(
  rec: Recommendation,
  patient: Patient,
  derived: Derived,
  drugId: string | undefined,
  resolvedKbId: string | undefined,
  kbDrug: DrugEntry | undefined,
  drugClasses: Set<string>,
  isPrescribingAction: boolean,
  state: MutableGateState
): void {
  const components = resolvedKbId ? expandDrugComponents(resolvedKbId) : drugId ? expandDrugComponents(drugId) : [];
  const isOngoing =
    rec.action === 'CONTINUE' || rec.action === 'REDUCE' || rec.action === 'UPTITRATE';

  // 1. Gating Thận (eGFR / CrCl) kết hợp dữ liệu KB renalBand (bao gồm cả thành phần viên phối hợp FDC)
  const egfr = derived.egfr ?? derived.egfrCr;
  if (drugId && (egfr !== undefined || derived.crcl !== undefined)) {
    const hasMetformin = components.includes('metformin') || drugClasses.has('biguanide');
    const hasSglt2i =
      drugClasses.has('sglt2i') ||
      components.some((c) => getNormalizedDrugClasses(c).has('sglt2i'));

    if (hasMetformin && egfr !== undefined && egfr < 30) {
      state.gates.push({
        parameter: 'eGFR',
        passed: false,
        action: 'contra',
        value: egfr,
        threshold: 30,
        messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m²: Chống chỉ định Metformin (kể cả viên phối hợp FDC) do nguy cơ nhiễm toan lactic (< 30 mL/phút/1.73m²)`
      });
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'kdigo.dm2.2022.metformin_discontinue_below_30',
        'byt.dm2.2020.metformin_renal_contra'
      ]);
      state.updatedAction = rec.action === 'CONTINUE' || rec.action === 'REDUCE' ? 'STOP' : 'AVOID';
      state.updatedTitle = `CHỐNG CHỈ ĐỊNH / NGỪNG ${rec.drugNameVi || kbDrug?.nameVi || 'Metformin'} (eGFR < 30)`;
      state.isBlocked = true;
      state.blockReason = 'Chống chỉ định Metformin do eGFR < 30 mL/min/1.73m²';
    } else if (hasSglt2i && egfr !== undefined && (rec.action === 'START' || rec.action === 'CONSIDER') && egfr < 20) {
      state.gates.push({
        parameter: 'eGFR',
        passed: false,
        action: 'contra',
        value: egfr,
        threshold: 20,
        messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² dưới ngưỡng khởi trị an toàn SGLT2i (yêu cầu ≥ 20 mL/phút/1.73m²)`
      });
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d',
        'kdigo.ckd.2024.pp_3_7_1_continue_below_20'
      ]);
      state.updatedAction = 'AVOID';
      state.updatedTitle = `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (eGFR < 20)`;
      state.isBlocked = true;
      state.blockReason = 'eGFR dưới ngưỡng khởi trị SGLT2i (< 20 mL/min/1.73m²)';
    } else if (hasMetformin && egfr !== undefined && egfr < 45) {
      state.citationIds = mergeCleanCitations(state.citationIds, ['kdigo.dm2.2022.metformin_halve_30_44']);
      if (state.updatedAction === 'START') {
        if (!detectAcuteAki(patient).isAki) {
          state.gates.push({
            parameter: 'eGFR',
            passed: false,
            action: 'contra',
            value: egfr,
            threshold: 45,
            messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² (30–44): Không khởi trị mới Metformin theo KDIGO 2024 & nhãn FDA`
          });
          state.updatedAction = 'AVOID';
          state.updatedTitle = `KHÔNG KHỞI TRỊ MỚI ${rec.drugNameVi || kbDrug?.nameVi || 'Metformin'} (eGFR 30–44 mL/phút/1.73m²)`;
          state.isBlocked = true;
          state.blockReason = 'Không khởi trị mới Metformin khi eGFR 30–44 mL/min/1.73m²';
        }
      } else {
        state.gates.push({ parameter: 'eGFR', passed: true, action: 'caution', value: egfr,
          messageVi: 'Metformin ở CKD G3b cần xác nhận tổng liều theo KDIGO; cổng liều kiểm riêng bên dưới.' });
      }
    } else if (isPrescribingAction) {
      const checkIds = Array.from(new Set([resolvedKbId, ...components].filter((x): x is string => Boolean(x))));
      let contraFound = false;
      for (const cid of checkIds) {
        if (!hasDrug(cid)) continue;
        const cDrug = drug(cid);
        const isDoac = DOAC_DRUG_IDS.has(cid) || getNormalizedDrugClasses(cid).has('doac');
        const useCrcl = isDoac && derived.crcl !== undefined;
        const primaryRenalVal = useCrcl ? derived.crcl : egfr;
        if (primaryRenalVal === undefined) continue;
        const band = renalBand(cid, primaryRenalVal, useCrcl ? 'crcl' : 'egfr');
        if (!band) continue;
        const statusToCheck =
          rec.action === 'START' || rec.action === 'CONSIDER' ? band.initiate : band.continue;
        if (statusToCheck === 'contra') {
          const paramLabel = useCrcl ? 'CrCl' : 'eGFR';
          const cutoff = band.crclTo ?? band.eGFRTo;
          state.gates.push({
            parameter: paramLabel,
            passed: false,
            action: 'contra',
            value: Number(primaryRenalVal.toFixed(1)),
            threshold: cutoff,
            messageVi:
              band.note ||
              `${paramLabel} ${primaryRenalVal.toFixed(0)} mL/phút: Chống chỉ định ${cDrug.nameVi} do suy giảm chức năng thận nặng`
          });
          state.citationIds = mergeCleanCitations(state.citationIds, band.citationIds);
          state.updatedAction = rec.action === 'CONTINUE' || rec.action === 'REDUCE' ? 'STOP' : 'AVOID';
          state.updatedTitle = `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG ${rec.drugNameVi || kbDrug?.nameVi || cDrug.nameVi} (${paramLabel}${cutoff ? ` < ${cutoff}` : ' suy thận nặng'})`;
          state.isBlocked = true;
          state.blockReason = band.note || `Chống chỉ định thận đối với ${cDrug.nameVi}`;
          contraFound = true;
          break;
        }
      }
      if (!contraFound && (hasSglt2i || hasMetformin) && egfr !== undefined && !state.gates.some((g) => g.parameter === 'eGFR')) {
        state.gates.push({
          parameter: 'eGFR',
          passed: true,
          value: egfr,
          messageVi: `eGFR ${egfr.toFixed(0)} mL/phút/1.73m² cho phép sử dụng`
        });
      }
    }
  }

  const renalDose = !state.isBlocked ? currentRenalDoseAdjustment(rec, patient, derived) : undefined;
  if (renalDose) {
    state.updatedAction = renalDose.action;
    state.updatedTitle = renalDose.title;
    state.updatedRationale = renalDose.rationale;
    state.updatedDose = renalDose.dose;
    state.gates = state.gates.filter((g) => g.parameter !== 'renal_dose' && !(g.parameter === 'eGFR' && g.passed));
    state.gates.push(...renalDose.gates);
    state.citationIds = mergeCleanCitations(state.citationIds, renalDose.citationIds);
    state.isBlocked = true;
    state.blockReason = renalDose.rationale;
  }

  // 2. Gating Kali máu (K+)
  const k = patient.k;
  if (k !== undefined && drugId) {
    const isMRA =
      drugClasses.has('mra') ||
      drugClasses.has('mra_steroidal') ||
      drugClasses.has('mra_nonsteroidal') ||
      components.some((c) => ['spironolactone', 'eplerenone', 'finerenone'].includes(c));
    const isRASi =
      drugClasses.has('rasi') ||
      drugClasses.has('acei') ||
      drugClasses.has('arb') ||
      drugClasses.has('arni') ||
      drugClasses.has('renin_inhibitor');

    if (isMRA && isPrescribingAction) {
      if (k >= 6.0) {
        state.gates.push({
          parameter: 'K+',
          passed: false,
          action: 'contra',
          value: k,
          threshold: 6.0,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L ≥ 6.0 mmol/L: Tăng kali máu nặng, ngừng/tránh tuyệt đối MRA`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'ukka.2022.guideline_16_2_calcium_salts',
          'esc.hf.2026.mra_guidance_table_s8'
        ]);
        state.updatedAction = isOngoing ? 'STOP' : 'HOLD';
        state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG KHẨN CẤP' : 'TẠM HOÃN'} ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (K⁺ = ${k.toFixed(1)} ≥ 6.0 mmol/L)`;
        state.isBlocked = true;
        state.blockReason = 'Tăng kali máu nặng (K+ >= 6.0 mmol/L)';
      } else if (k > 5.0 && (rec.action === 'START' || rec.action === 'CONSIDER')) {
        state.gates.push({
          parameter: 'K+',
          passed: false,
          action: 'hold',
          value: k,
          threshold: 5.0,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L > 5.0 mmol/L: Tạm hoãn khởi trị MRA cho đến khi kiểm soát được kali máu`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'esc.hf.2026.mra_guidance_table_s8',
          'fda.finerenone.table_1_starting_dose'
        ]);
        state.updatedAction = 'HOLD';
        state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (K⁺ = ${k.toFixed(1)} > 5.0 mmol/L)`;
        state.isBlocked = true;
        state.blockReason = 'Tăng kali máu (K+ > 5.0 mmol/L)';
      } else if (k >= 5.5) {
        state.gates.push({
          parameter: 'K+',
          passed: false,
          action: 'hold',
          value: k,
          threshold: 5.5,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L ≥ 5.5 mmol/L: Giảm liều hoặc tạm ngừng MRA, kiểm tra lại điện giải`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'esc.hf.2026.mra_guidance_table_s8',
          'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'
        ]);
        state.updatedAction = 'HOLD';
        state.updatedTitle = `TẠM HOÃN / GIẢM LIỀU ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (K⁺ = ${k.toFixed(1)} ≥ 5.5 mmol/L)`;
        state.isBlocked = true;
        state.blockReason = 'Kali máu tăng cao (K+ >= 5.5 mmol/L)';
      } else if (!state.gates.some((g) => g.parameter === 'K+')) {
        state.gates.push({
          parameter: 'K+',
          passed: true,
          value: k,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L trong giới hạn cho phép sử dụng MRA`
        });
      }
    } else if (isRASi && isPrescribingAction) {
      if (k >= 6.0) {
        state.gates.push({
          parameter: 'K+',
          passed: false,
          action: 'contra',
          value: k,
          threshold: 6.0,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L ≥ 6.0 mmol/L: Ngừng khẩn cấp thuốc ức chế RAA/ARNI do nguy cơ loạn nhịp tim`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'ukka.2022.guideline_16_2_calcium_salts',
          'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'
        ]);
        state.updatedAction = isOngoing ? 'STOP' : 'HOLD';
        state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG KHẨN CẤP' : 'TẠM HOÃN'} ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (K⁺ = ${k.toFixed(1)} ≥ 6.0 mmol/L)`;
        state.isBlocked = true;
        state.blockReason = 'Tăng kali máu nặng (K+ >= 6.0 mmol/L)';
      } else if (k > 5.5) {
        state.gates.push({
          parameter: 'K+',
          passed: false,
          action: 'hold',
          value: k,
          threshold: 5.5,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L > 5.5 mmol/L: Tạm ngưng/giảm liều ức chế hệ RAA, tầm soát nguyên nhân tăng kali`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
          'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'
        ]);
        state.updatedAction = 'HOLD';
        state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (K⁺ = ${k.toFixed(1)} > 5.5 mmol/L)`;
        state.isBlocked = true;
        state.blockReason = 'Tăng kali máu (K+ > 5.5 mmol/L)';
      } else if (!state.gates.some((g) => g.parameter === 'K+')) {
        state.gates.push({
          parameter: 'K+',
          passed: true,
          value: k,
          messageVi: `K⁺ ${k.toFixed(1)} mmol/L an toàn để dùng RASi`
        });
      }
    }
  } else if (k === undefined && drugId) {
    const isKSensitive = ['spironolactone', 'eplerenone', 'finerenone', 'sacubitril_valsartan'].includes(drugId);
    if (isKSensitive && isPrescribingAction && !state.gates.some((g) => g.parameter === 'K+')) {
      state.gates.push({
        parameter: 'K+',
        passed: false,
        action: 'caution',
        messageVi: 'Chưa có xét nghiệm K⁺ máu: Cần định lượng kali máu trước khi khởi trị thuốc giữ kali'
      });
    }
  }

  // 2b. Gating Hạ Natri máu (Na+ < 130 / < 125), QTc > 500 ms, Hạ Kali máu nguy hiểm & DrugEntry.gates
  if (drugId && isPrescribingAction && state.updatedAction !== 'AVOID' && state.updatedAction !== 'STOP') {
    const elQtVerdict = evaluateElectrolyteAndQtSafety(
      drugId,
      kbDrug,
      patient,
      derived,
      rec.action,
      `${rec.id} ${rec.title} ${rec.dose || ''}`
    );
    if (elQtVerdict) {
      const nextAct = isOngoing ? elQtVerdict.actionForActive : elQtVerdict.actionForNew;
      if (!state.gates.some((g) => g.parameter === elQtVerdict.parameter && !g.passed)) {
        state.gates.push({
          parameter: elQtVerdict.parameter,
          passed: false,
          action: nextAct === 'HOLD' ? 'hold' : 'contra',
          value: elQtVerdict.value,
          threshold: elQtVerdict.threshold,
          messageVi: elQtVerdict.messageVi
        });
      }
      state.citationIds = mergeCleanCitations(state.citationIds, elQtVerdict.citationIds);
      state.updatedAction = nextAct;
      state.updatedTitle = `${nextAct === 'STOP' ? 'NGỪNG NGAY' : nextAct === 'HOLD' ? 'TẠM HOÃN' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (${elQtVerdict.parameter})`;
      if (!state.updatedRationale.includes(elQtVerdict.messageVi)) {
        state.updatedRationale = `${elQtVerdict.messageVi}. ${state.updatedRationale}`;
      }
      state.isBlocked = true;
      state.blockReason = elQtVerdict.messageVi;
    }
  }

  // 3. Gating Huyết áp tâm thu (SBP)
  const sbp = patient.sbp;
  if (sbp !== undefined && drugId && isPrescribingAction && state.updatedAction !== 'AVOID' && state.updatedAction !== 'STOP') {
    const isHemodynamicMed =
      drugClasses.has('rasi') ||
      drugClasses.has('acei') ||
      drugClasses.has('arb') ||
      drugClasses.has('arni') ||
      drugClasses.has('renin_inhibitor') ||
      drugClasses.has('beta_blocker') ||
      drugClasses.has('dhp_ccb') ||
      drugClasses.has('ndhp_ccb') ||
      drugClasses.has('sglt2i') ||
      drugClasses.has('mra') ||
      drugClasses.has('mra_steroidal') ||
      drugClasses.has('mra_nonsteroidal') ||
      drugClasses.has('diuretic') ||
      drugClasses.has('loop_diuretic') ||
      drugClasses.has('thiazide_diuretic') ||
      drugClasses.has('nitrate') ||
      drugClasses.has('vasodilator') ||
      [
        'sacubitril_valsartan', 'vericiguat', 'hydralazine', 'isosorbide_dinitrate',
        'isosorbide_mononitrate', 'nitroglycerin', 'urapidil', 'nicardipine', 'clevidipine'
      ].includes(drugId);

    const isRoutineChronicPreventiveOral =
      drugClasses.has('statin') ||
      drugClasses.has('biguanide') ||
      drugClasses.has('glp1ra') ||
      drugClasses.has('sglt2i') ||
      drugClasses.has('mra_nonsteroidal') ||
      components.some((c) => ['ezetimibe', 'metformin', 'finerenone'].includes(c));

    if (sbp < 90 && isHemodynamicMed) {
      state.gates.push({
        parameter: 'SBP',
        passed: false,
        action: 'hold',
        value: sbp,
        threshold: 90,
        messageVi: `Huyết áp tâm thu ${sbp} mmHg < 90 mmHg: Tạm hoãn các thuốc hạ áp, giãn mạch, lợi tiểu, SGLT2i, MRA hoặc Vericiguat do tụt huyết áp`
      });
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'esc.hf.2026.acute_bb_hypoperfusion',
        'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'
      ]);
      state.updatedAction = 'HOLD';
      state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Tụt huyết áp SBP = ${sbp} < 90 mmHg)`;
      state.isBlocked = true;
      state.blockReason = 'Huyết áp tâm thu < 90 mmHg';
    } else if (
      sbp < 90 &&
      isRoutineChronicPreventiveOral &&
      (rec.action === 'START' || rec.action === 'UPTITRATE' || rec.action === 'CONSIDER' || components.includes('metformin'))
    ) {
      state.gates.push({
        parameter: 'SBP',
        passed: false,
        action: 'hold',
        value: sbp,
        threshold: 90,
        messageVi: `Huyết áp tâm thu ${sbp} mmHg < 90 mmHg (tụt huyết áp/sốc): Tạm hoãn khởi trị thuốc dự phòng mạn tính đường uống thường quy cho tới khi huyết động ổn định`
      });
      state.citationIds = mergeCleanCitations(state.citationIds, [
        'esc.hf.2026.acute_bb_hypoperfusion',
        'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop'
      ]);
      state.updatedAction = 'HOLD';
      state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Huyết động chưa ổn định SBP = ${sbp} < 90 mmHg)`;
      state.isBlocked = true;
      state.blockReason = 'Tụt huyết áp / sốc (SBP < 90 mmHg) - trì hoãn khởi trị thuốc dự phòng mạn tính';
    } else if (
      drugId === 'sacubitril_valsartan' &&
      sbp < 100 &&
      (rec.action === 'START' || rec.action === 'UPTITRATE' || rec.action === 'CONSIDER')
    ) {
      state.gates.push({
        parameter: 'SBP',
        passed: false,
        action: 'hold',
        value: sbp,
        threshold: 100,
        messageVi: `Huyết áp tâm thu ${sbp} mmHg < 100 mmHg: Không đủ điều kiện khởi trị/tăng liều ARNI (nguy cơ tụt HA triệu chứng)`
      });
      state.citationIds = mergeCleanCitations(state.citationIds, ['esc.hf.2026.arni_sbp_100_egfr_30']);
      state.updatedAction = 'HOLD';
      state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (SBP < 100 mmHg)`;
      state.isBlocked = true;
      state.blockReason = 'Huyết áp tâm thu < 100 mmHg';
    } else if (
      drugClasses.has('sglt2i') &&
      sbp < 95 &&
      (rec.action === 'START' || rec.action === 'UPTITRATE' || rec.action === 'CONSIDER')
    ) {
      state.gates.push({
        parameter: 'SBP',
        passed: false,
        action: 'hold',
        value: sbp,
        threshold: 95,
        messageVi: `Huyết áp tâm thu ${sbp} mmHg < 95 mmHg: Tạm hoãn khởi trị SGLT2i do nguy cơ tụt huyết áp và giảm lưu lượng lọc thận`
      });
      state.citationIds = mergeCleanCitations(state.citationIds, ['esc.hf.2026.acute_bb_hypoperfusion']);
      state.updatedAction = 'HOLD';
      state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Tụt huyết áp SBP < 95 mmHg)`;
      state.isBlocked = true;
      state.blockReason = 'Huyết áp tâm thu < 95 mmHg';
    }
  }

  // 4. Gating Tần số tim (HR)
  const hr = patient.hr;
  if (hr !== undefined && drugId && state.updatedAction !== 'AVOID' && state.updatedAction !== 'STOP') {
    const isBradyMed =
      drugClasses.has('beta_blocker') ||
      drugClasses.has('ndhp_ccb') ||
      components.some((c) => ['ivabradine', 'digoxin', 'diltiazem', 'verapamil'].includes(c));
    if (isBradyMed) {
      if (hr < 50 && isPrescribingAction && !hasCondition({ normalized: patient, patient }, 'pacemaker')) {
        state.gates.push({
          parameter: 'HR',
          passed: false,
          action: 'hold',
          value: hr,
          threshold: 50,
          messageVi: `Nhịp tim ${hr} bpm < 50 bpm: Chống chỉ định/tạm hoãn thuốc làm chậm nhịp tim theo chuẩn ESC`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, ['esc.hf.2026.bb_guidance_table_s6']);
        state.updatedAction = 'HOLD';
        state.updatedTitle = `TẠM HOÃN ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Nhịp tim < 50 bpm)`;
        state.isBlocked = true;
        state.blockReason = 'Nhịp tim chậm (< 50 bpm)';
      } else if (!state.gates.some((g) => g.parameter === 'HR')) {
        state.gates.push({
          parameter: 'HR',
          passed: true,
          value: hr,
          messageVi: `Nhịp tim ${hr} bpm trong giới hạn an toàn`
        });
      }
    }
  }

  // 5. Gating Thai kỳ (Pregnancy)
  const isPregnant = hasCondition({ normalized: patient, patient }, 'pregnant');
  if (isPregnant && drugId && isPregnancyContraindicated(drugId, `${rec.title} ${rec.dose || ''}`)) {
    const pregInfo = kbDrug?.pregnancy;
    const pregCitations =
      pregInfo?.citationIds && pregInfo.citationIds.length > 0
        ? pregInfo.citationIds
        : ['esc.hf.2026.pregnancy_contra', 'esc.htn.2024.pregnancy_contraindication_rasi'];
    const pregNote =
      pregInfo?.notesVi ||
      'Chống chỉ định hoặc tránh dùng trong thai kỳ do nguy cơ độc tính phôi thai, dị tật bẩm sinh và suy thận sơ sinh.';

    if (!state.gates.some((g) => g.parameter === 'pregnancy' && !g.passed)) {
      state.gates.push({
        parameter: 'pregnancy',
        passed: false,
        action: 'contra',
        messageVi: `Đang mang thai: ${pregNote}`
      });
    }
    state.citationIds = mergeCleanCitations(state.citationIds, pregCitations);
    state.updatedAction = 'AVOID';
    state.updatedTitle = `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Thai kỳ)`;
    state.updatedRationale = `${pregNote} ${rec.rationale}`;
    state.isBlocked = true;
    state.blockReason = 'Chống chỉ định hoặc tránh dùng trong thai kỳ';
  }
}
