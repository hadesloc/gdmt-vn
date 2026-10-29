/**
 * GDMT-VN Safety - Perioperative SGLT2i, Acute AKI, Outpatient Crisis & Hypoglycemia Gates
 * Phân quyền: Agent B
 */

import type { Patient, Settings, Recommendation, Action } from '../types';
import { hasCondition } from '../types';
import type { DrugEntry } from '../../kb-types';
import { isSglt2iOrComboDrug } from './drugClassify';
import {
  isNephrotoxicOrHemodynamicInAki,
  detectAcuteAki,
  isOutpatientAcuteCrisis,
  isEmergencyOrRescueTherapy
} from './clinicalStates';
import { mergeCleanCitations, type MutableGateState } from './organAndCrisisGates';

export function applyPerioperativeAkiAndHypoGates(
  rec: Recommendation,
  patient: Patient,
  settings: Settings | undefined,
  drugId: string,
  resolvedKbId: string,
  kbDrug: DrugEntry | undefined,
  drugClasses: Set<string>,
  isPrescribingAction: boolean,
  isDrugInCurrentMeds: boolean,
  isOngoingCurrentAction: boolean,
  displayDrug: string,
  state: MutableGateState
): void {
  // 4. Cổng chu phẫu SGLT2i toàn cục — phòng nhiễm toan ceton đẳng đường (euDKA)
  const isSglt2iOrCombo = isSglt2iOrComboDrug(drugId, resolvedKbId, drugClasses, kbDrug);
  if (
    isSglt2iOrCombo &&
    hasCondition({ normalized: patient, patient }, 'plannedSurgery') &&
    (rec.action === 'START' || rec.action === 'UPTITRATE' || rec.action === 'CONTINUE' || rec.action === 'SWITCH') &&
    state.updatedAction !== 'AVOID' &&
    state.updatedAction !== 'STOP' &&
    state.updatedAction !== 'HOLD'
  ) {
    const withholdDays =
      drugId.includes('ertugliflozin') || drugId === 'steglatro' || drugId === 'segluromet' ? 4 : 3;

    if (!state.gates.some((g) => g.parameter === 'plannedSurgery' && !g.passed)) {
      state.gates.push({
        parameter: 'plannedSurgery',
        passed: false,
        action: isDrugInCurrentMeds ? 'hold' : 'defer',
        messageVi: isDrugInCurrentMeds
          ? `Chuẩn bị phẫu thuật: Tạm ngưng SGLT2i ít nhất ${withholdDays} ngày trước mổ (3 ngày với dapa/empa/cana, 4 ngày với ertugliflozin) để phòng nhiễm toan ceton đẳng đường chu phẫu (euDKA)`
          : `Chuẩn bị phẫu thuật: Trì hoãn khởi trị/tăng liều SGLT2i cho tới sau mổ khi ăn uống ổn định để phòng nhiễm toan ceton đẳng đường chu phẫu (euDKA)`
      });
    }
    state.citationIds = mergeCleanCitations(state.citationIds, [
      'ada.dm2.2026.sglt2i_withhold_surgery',
      'ada.dm2.2026.sglt2i_avoid_severe_illness'
    ]);
    state.updatedAction = isDrugInCurrentMeds ? 'HOLD' : 'DEFER';
    state.updatedTitle = isDrugInCurrentMeds
      ? `TẠM NGƯNG TRƯỚC MỔ ${withholdDays} NGÀY: ${displayDrug} (Phòng euDKA chu phẫu)`
      : `TRÌ HOÃN SAU PHẪU THUẬT: ${displayDrug} (Phòng euDKA chu phẫu)`;
    state.updatedRationale = isDrugInCurrentMeds
      ? `Bệnh nhân có lịch phẫu thuật: Bắt buộc tạm ngưng thuốc ức chế SGLT2 ít nhất ${withholdDays} ngày trước mổ theo khuyến cáo FDA & ADA 2026 để phòng biến chứng nhiễm toan ceton đẳng đường huyết (euDKA). ${state.updatedRationale}`
      : `Bệnh nhân chuẩn bị phẫu thuật: Trì hoãn khởi trị hoặc tăng liều SGLT2i cho tới sau mổ khi huyết động ổn định và ăn uống bình thường trở lại để tránh nhiễm toan ceton đẳng đường huyết (euDKA). ${state.updatedRationale}`;
    state.isBlocked = true;
    state.blockReason = 'Chuẩn bị phẫu thuật — phòng nhiễm toan ceton đẳng đường (euDKA)';
    return;
  }

  // 5. HF-R2-R3-04 & HTN-R2-R3-03: Cổng Tổn thương thận cấp (AKI) — Bắt buộc HOLD cả lệnh CONTINUE/UPTITRATE của thuốc độc thận / huyết động cầu thận
  const akiInfo = detectAcuteAki(patient);
  if (
    akiInfo.isAki &&
    isPrescribingAction &&
    isNephrotoxicOrHemodynamicInAki(drugId) &&
    state.updatedAction !== 'AVOID' &&
    state.updatedAction !== 'STOP' &&
    !isEmergencyOrRescueTherapy(rec, patient, settings)
  ) {
    const reasonText = akiInfo.reasonVi || 'Đang trong đợt tổn thương thận cấp (AKI)';
    const isNsaid = drugClasses.has('nsaid');
    const nextAction: Action = isNsaid
      ? isOngoingCurrentAction
        ? 'STOP'
        : 'AVOID'
      : isOngoingCurrentAction || isDrugInCurrentMeds
        ? 'HOLD'
        : 'DEFER';
    if (!state.gates.some((g) => g.parameter === 'AKI' && !g.passed)) {
      state.gates.push({
        parameter: 'AKI',
        passed: false,
        action: nextAction === 'HOLD' ? 'hold' : nextAction === 'DEFER' ? 'defer' : 'contra',
        messageVi: `${reasonText}: ${nextAction === 'HOLD' ? 'Tạm ngưng (HOLD)' : nextAction === 'DEFER' ? 'Trì hoãn khởi trị' : 'Chống chỉ định / Ngừng ngay'} ${displayDrug} cho tới khi chức năng thận hồi phục ổn định`
      });
    }
    state.citationIds = mergeCleanCitations(state.citationIds, [
      'kdigo.aki.2012.table_2_staging',
      'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
      'byt.ckd.2024.aki_on_ckd_definition'
    ]);
    state.updatedAction = nextAction;
    state.updatedTitle =
      nextAction === 'HOLD'
        ? `TẠM NGƯNG ${displayDrug} (Đang tổn thương thận cấp AKI)`
        : nextAction === 'STOP'
          ? `NGỪNG NGAY ${displayDrug} (Đang tổn thương thận cấp AKI)`
          : nextAction === 'AVOID'
            ? `CHỐNG CHỈ ĐỊNH ${displayDrug} (Đang tổn thương thận cấp AKI)`
            : `TRÌ HOÃN ${displayDrug} (Đang có tổn thương thận cấp AKI)`;
    state.updatedRationale = `${reasonText}: Bắt buộc ${nextAction === 'HOLD' ? 'tạm ngưng duy trì' : 'tránh / ngừng'} các thuốc tác động huyết động cầu thận hoặc thải trừ thận (${displayDrug}) trong giai đoạn AKI tiến triển; đánh giá lại khi tưới máu thận và Creatinin hồi phục. ${state.updatedRationale}`;
    state.isBlocked = true;
    state.blockReason = reasonText;
    return;
  }

  // 5b. Cổng AKI (cho thuốc mạn tính khác) & Cấp cứu Ngoại trú — chuyển các lệnh khởi trị / tăng liều mạn tính sang DEFER
  const crisisInfo = isOutpatientAcuteCrisis(patient, settings);
  if (
    (akiInfo.isAki || crisisInfo.isCrisis) &&
    (rec.action === 'START' || rec.action === 'UPTITRATE') &&
    state.updatedAction !== 'AVOID' &&
    state.updatedAction !== 'STOP' &&
    !isEmergencyOrRescueTherapy(rec, patient, settings)
  ) {
    if (!(isDrugInCurrentMeds && state.updatedAction === 'HOLD')) {
      const reasonText = akiInfo.reasonVi || crisisInfo.reasonVi || 'Bệnh cảnh cấp tính chưa ổn định';
      const gateParam = akiInfo.isAki ? 'AKI' : 'OutpatientCrisis';
      if (!state.gates.some((g) => g.parameter === gateParam && !g.passed)) {
        state.gates.push({
          parameter: gateParam,
          passed: false,
          action: 'defer',
          messageVi: `${reasonText}: Trì hoãn khởi trị/tăng liều thuốc điều trị mạn tính thường quy cho tới khi ổn định huyết động, điện giải và chức năng thận`
        });
      }
      state.citationIds = mergeCleanCitations(
        state.citationIds,
        akiInfo.isAki
          ? ['kdigo.aki.2012.table_2_staging', 'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop']
          : ['ukka.2022.guideline_16_2_calcium_salts', 'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop']
      );
      state.updatedAction = 'DEFER';
      state.updatedTitle = `TRÌ HOÃN ${displayDrug} (${akiInfo.isAki ? 'Đang có tổn thương thận cấp AKI' : 'Ưu tiên xử trí cấp cứu trước'})`;
      state.updatedRationale = `${reasonText}: Không khởi trị mới hoặc tăng liều thuốc dự phòng mạn tính trong giai đoạn cấp; đánh giá lại sau khi tình trạng cấp tính và chức năng thận ổn định. ${state.updatedRationale}`;
      state.isBlocked = true;
      state.blockReason = reasonText;
      return;
    }
  }

  // 6. Cổng hạ đường huyết cấp toàn cục (glucose < 3.9 mmol/L) — trì hoãn START/UPTITRATE thuốc mạn tính
  const glucose = patient.glucose;
  if (
    glucose !== undefined &&
    glucose < 3.9 &&
    (rec.action === 'START' || rec.action === 'UPTITRATE') &&
    state.updatedAction !== 'AVOID' &&
    state.updatedAction !== 'STOP' &&
    state.updatedAction !== 'HOLD' &&
    state.updatedAction !== 'DEFER'
  ) {
    const isGlucoseLowering =
      isSglt2iOrCombo ||
      drugClasses.has('glp1ra') ||
      drugClasses.has('dpp4i') ||
      drugClasses.has('biguanide') ||
      drugClasses.has('su') ||
      drugClasses.has('meglitinide') ||
      drugClasses.has('tzd') ||
      drugClasses.has('insulin') ||
      drugId.includes('insulin') ||
      ['metformin', 'acarbose', 'gliclazide', 'glimepiride', 'glibenclamide', 'glyburide', 'glipizide', 'pioglitazone'].includes(drugId);

    const isAcuteHypoOrEmergencyRescue =
      [
        'dextrose', 'dextrose_iv', 'glucose', 'glucose_iv', 'glucagon',
        'calcium_gluconate', 'calcium_chloride', 'sodium_zirconium_cyclosilicate', 'patiromer', 'sodium_polystyrene_sulfonate',
        'salbutamol', 'ipratropium', 'ipratropium_salbutamol', 'ipratropium_fenoterol', 'salbutamol_ipratropium',
        'epinephrine', 'norepinephrine', 'dobutamine', 'dopamine',
        'magnesium_sulfate', 'methylprednisolone', 'hydrocortisone', 'dexamethasone', 'prednisolone',
        'heparin', 'enoxaparin', 'fondaparinux', 'amiodarone', 'adenosine', 'atropine', 'oxygen'
      ].includes(drugId) ||
      drugClasses.has('ics') ||
      drugClasses.has('ics_laba') ||
      drugClasses.has('ics_lama_laba') ||
      drugClasses.has('laba_lama') ||
      drugClasses.has('lama') ||
      drugClasses.has('saba') ||
      drugClasses.has('sama') ||
      rec.id.toLowerCase().includes('hypo') ||
      rec.id.toLowerCase().includes('hyperk') ||
      (!isGlucoseLowering &&
        /tiêm tĩnh mạch|truyền tĩnh mạch|khí dung|cấp cứu/i.test(
          `${rec.tier || ''} ${rec.title || ''} ${rec.dose || ''}`
        ));

    if (!isAcuteHypoOrEmergencyRescue) {
      const isSevereHypo = glucose < 3.0;
      const bbMaskNote = drugClasses.has('beta_blocker')
        ? ' Lưu ý chẹn beta giao cảm có thể che lấp triệu chứng cảnh báo giao cảm (nhịp nhanh, run tay) và làm kéo dài cơn hạ đường huyết.'
        : '';
      if (!state.gates.some((g) => g.parameter === 'glucose' && !g.passed)) {
        state.gates.push({
          parameter: 'glucose',
          passed: false,
          action: 'defer',
          value: glucose,
          threshold: 3.9,
          messageVi: `Đang hạ đường huyết ${isSevereHypo ? 'nặng mức độ 2/3 (< 3.0 mmol/L)' : 'cấp (< 3.9 mmol/L)'} (Glucose = ${glucose.toFixed(1)} mmol/L): Trì hoãn khởi trị/tăng liều thuốc dự phòng mạn tính cho tới khi xử trí ổn định đường huyết.${bbMaskNote}`
        });
      }
      state.citationIds = mergeCleanCitations(
        state.citationIds,
        isSevereHypo
          ? ['ada.dm2.2026.hypo_rule_of_15', 'ada.dm2.2026.hypo_level2_3mmol']
          : ['ada.dm2.2026.hypo_rule_of_15']
      );
      state.updatedAction = 'DEFER';
      state.updatedTitle = `TRÌ HOÃN ${displayDrug} (Đang hạ đường huyết cấp ${glucose.toFixed(1)} mmol/L)`;
      state.updatedRationale = `Bệnh nhân đang trong cơn hạ đường huyết cấp (Glucose = ${glucose.toFixed(1)} mmol/L < 3.9 mmol/L): Ưu tiên xử trí cấp cứu nâng đường huyết và tìm nguyên nhân trước khi khởi trị/tăng liều thuốc điều trị mạn tính.${bbMaskNote} ${state.updatedRationale}`;
      state.isBlocked = true;
      state.blockReason = `Đang hạ đường huyết cấp (Glucose ${glucose.toFixed(1)} mmol/L < 3.9 mmol/L)`;
    }
  }
}
