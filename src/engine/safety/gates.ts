/**
 * GDMT-VN Safety - Clinical Safety Gates (KB Data-Driven)
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Settings, Recommendation, Action } from '../types';
import { hasCondition } from '../types';
import { hasDrug, drug, type DrugEntry } from '../../kb-types';
import { expandDrugComponents } from './fdcMap';
import {
  PREGNANCY_CONTRAINDICATED_DRUGS,
  KB_DRUG_ALIASES,
  resolveKbDrugId,
  isPregnancyContraindicated,
  getNormalizedDrugClasses,
  getExpandedDrugIds,
  DOAC_DRUG_IDS,
  PDE5I_DRUG_IDS,
  NITRATE_OR_SGC_DRUG_IDS,
  STRONG_CYP3A4_INHIBITOR_IDS,
  GLP1_GIP_RA_IDS,
  STATIN_POTENCY_RANK,
  isGlp1OrGipDrug,
  isSglt2iOrComboDrug,
  hasSevereMilkProteinAllergy,
  hasNarrowAngleGlaucoma,
  hasUrinaryRetentionCondition,
  hasMtcOrMen2History,
  hasPancreatitisHistory,
  hasAcutePancreatitis,
  hasAerdCondition,
  isCox1NsaidOrSalicylate,
  hasAcuteBronchospasmOrRespFailure,
  isOphthalmicBetaBlocker,
  inferReviewModule
} from './drugClassify';
import {
  evaluateHepaticSafety,
  isCardiogenicShockOrVasopressor,
  isNephrotoxicOrHemodynamicInAki,
  detectAcuteAki,
  isOutpatientAcuteCrisis,
  isEmergencyOrRescueTherapy
} from './clinicalStates';
import {
  isBreastfeeding,
  evaluateLactationSafety,
  evaluateAllergySafety
} from './lactationAndAllergyGates';
import {
  evaluateConductionAndWpwSafety,
  matchesContraindicationCode
} from './contraCodeMatcher';
import {
  mergeCleanCitations,
  applyOrganAndCrisisSafetyGates,
  type MutableGateState
} from './organAndCrisisGates';
import { applyVitalAndRenalGates } from './vitalAndRenalGates';
import { hasRespiratoryCyp3a4Inhibitor, isCypSensitiveInhaler } from './inhaledCypSafety';

export {
  PREGNANCY_CONTRAINDICATED_DRUGS,
  KB_DRUG_ALIASES,
  resolveKbDrugId,
  isPregnancyContraindicated,
  getNormalizedDrugClasses,
  getExpandedDrugIds,
  DOAC_DRUG_IDS,
  PDE5I_DRUG_IDS,
  NITRATE_OR_SGC_DRUG_IDS,
  STRONG_CYP3A4_INHIBITOR_IDS,
  GLP1_GIP_RA_IDS,
  STATIN_POTENCY_RANK,
  isGlp1OrGipDrug,
  isSglt2iOrComboDrug,
  hasSevereMilkProteinAllergy,
  hasNarrowAngleGlaucoma,
  hasUrinaryRetentionCondition,
  hasMtcOrMen2History,
  hasPancreatitisHistory,
  hasAcutePancreatitis,
  hasAerdCondition,
  isCox1NsaidOrSalicylate,
  hasAcuteBronchospasmOrRespFailure,
  isOphthalmicBetaBlocker,
  inferReviewModule,
  evaluateHepaticSafety,
  isCardiogenicShockOrVasopressor,
  isNephrotoxicOrHemodynamicInAki,
  detectAcuteAki,
  isOutpatientAcuteCrisis,
  isEmergencyOrRescueTherapy,
  isBreastfeeding,
  evaluateLactationSafety,
  evaluateAllergySafety,
  evaluateConductionAndWpwSafety,
  matchesContraindicationCode
};

export interface GateEvaluationResult {
  updatedRec: Recommendation;
  allPassed: boolean;
  blockReason?: string;
}

export function evaluateSafetyGates(
  rec: Recommendation,
  patient: Patient,
  derived: Derived,
  settings?: Settings
): GateEvaluationResult {
  if (rec.action === 'STOP' || rec.action === 'AVOID') {
    const cleanedCitations = mergeCleanCitations([], rec.citationIds || []);
    return {
      updatedRec: {
        ...rec,
        dose: undefined,
        citationIds: cleanedCitations.length > 0 ? cleanedCitations : rec.citationIds
      },
      allPassed: false,
      blockReason: rec.rationale
    };
  }

  const state: MutableGateState = {
    gates: [...(rec.gates || [])],
    citationIds: [...(rec.citationIds || [])],
    isBlocked: false,
    blockReason: '',
    updatedAction: rec.action as Action,
    updatedTitle: rec.title,
    updatedRationale: rec.rationale,
    updatedDose: rec.dose
  };

  const isPrescribingAction =
    rec.action === 'START' ||
    rec.action === 'UPTITRATE' ||
    rec.action === 'CONTINUE' ||
    rec.action === 'CONSIDER' ||
    rec.action === 'REDUCE' ||
    rec.action === 'SWITCH';
  const isOngoing =
    rec.action === 'CONTINUE' || rec.action === 'REDUCE';

  const drugId = rec.drugId?.toLowerCase();
  const resolvedKbId = drugId ? resolveKbDrugId(drugId) : undefined;
  const kbDrug = resolvedKbId && hasDrug(resolvedKbId) ? drug(resolvedKbId) : undefined;
  const drugClasses = resolvedKbId ? getNormalizedDrugClasses(resolvedKbId) : new Set<string>();
  const routeHint = `${rec.title} ${rec.dose || ''}`;

  applyVitalAndRenalGates(
    rec,
    patient,
    derived,
    drugId,
    resolvedKbId,
    kbDrug,
    drugClasses,
    isPrescribingAction,
    state
  );

  if (drugId && resolvedKbId) {
    // 1. Cho con bú (Breastfeeding / Lactation)
    if (isPrescribingAction) {
      const lactVerdict = evaluateLactationSafety(drugId, patient, routeHint);
      if (lactVerdict) {
        if (!state.gates.some((g) => g.parameter === 'lactation' && !g.passed)) {
          state.gates.push({
            parameter: 'lactation',
            passed: false,
            action: 'contra',
            messageVi: lactVerdict.messageVi
          });
        }
        state.citationIds = mergeCleanCitations(state.citationIds, lactVerdict.citationIds);
        state.updatedAction = isOngoing ? 'STOP' : 'AVOID';
        state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Đang cho con bú)`;
        if (!state.updatedRationale.includes(lactVerdict.messageVi)) {
          state.updatedRationale = `${lactVerdict.messageVi}. ${state.updatedRationale}`;
        }
        state.isBlocked = true;
        state.blockReason = lactVerdict.messageVi;
      }
    }

    // 2. Dị ứng thuốc / Dị ứng chéo nhóm & Tiền sử Phù mạch (Angioedema)
    if (isPrescribingAction) {
      const allergyVerdict = evaluateAllergySafety(drugId, patient);
      if (allergyVerdict) {
        if (!state.gates.some((g) => g.parameter === allergyVerdict.parameter && !g.passed)) {
          state.gates.push({
            parameter: allergyVerdict.parameter,
            passed: false,
            action: 'contra',
            messageVi: allergyVerdict.messageVi
          });
        }
        state.citationIds = mergeCleanCitations(state.citationIds, allergyVerdict.citationIds);
        state.updatedAction = isOngoing ? 'STOP' : 'AVOID';
        state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Dị ứng / Phù mạch)`;
        if (!state.updatedRationale.includes(allergyVerdict.messageVi)) {
          state.updatedRationale = `${allergyVerdict.messageVi}. ${state.updatedRationale}`;
        }
        state.isBlocked = true;
        state.blockReason = allergyVerdict.messageVi;
      }
    }

    // 3. Hệ dẫn truyền (AV block 2–3, suy nút xoang chưa đặt máy tạo nhịp) & WPW / Rung nhĩ tiền kích thích
    if (isPrescribingAction) {
      const condWpwVerdict = evaluateConductionAndWpwSafety(drugId, patient, routeHint);
      if (condWpwVerdict) {
        if (!state.gates.some((g) => g.parameter === condWpwVerdict.parameter && !g.passed)) {
          state.gates.push({
            parameter: condWpwVerdict.parameter,
            passed: false,
            action: 'contra',
            messageVi: condWpwVerdict.messageVi
          });
        }
        state.citationIds = mergeCleanCitations(state.citationIds, condWpwVerdict.citationIds);
        state.updatedAction = isOngoing ? condWpwVerdict.actionForCurrent : 'AVOID';
        state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI'} ${rec.drugNameVi || kbDrug?.nameVi || rec.title}`;
        if (!state.updatedRationale.includes(condWpwVerdict.messageVi)) {
          state.updatedRationale = `${condWpwVerdict.messageVi}. ${state.updatedRationale}`;
        }
        state.isBlocked = true;
        state.blockReason = condWpwVerdict.messageVi;
      }
    }

    // 4. HF-R2-R3-16: Bắt buộc washout 36 giờ khi chuyển từ bất kỳ ACEi hoặc viên phối hợp chứa ACEi (Coveram/Preterax/Triplixam) sang ARNI
    if (
      resolvedKbId === 'sacubitril_valsartan' &&
      (rec.action === 'START' || rec.action === 'SWITCH' || rec.action === 'CONSIDER') &&
      state.updatedAction !== 'AVOID' &&
      state.updatedAction !== 'STOP'
    ) {
      const activeAceiMed = (patient.currentMeds || []).find((m) => {
        if (!m.drugId || isOphthalmicBetaBlocker(m.drugId, m.route)) return false;
        return getNormalizedDrugClasses(m.drugId).has('acei');
      });
      if (activeAceiMed || Boolean(patient.customInputs?.takingAcei)) {
        const aceiLabel = activeAceiMed?.name || activeAceiMed?.drugId || 'ACEi';
        if (!state.gates.some((g) => g.parameter === 'acei_arni_washout_36h' && !g.passed)) {
          state.gates.push({
            parameter: 'acei_arni_washout_36h',
            passed: false,
            action: 'hold',
            messageVi: `Đang dùng ${aceiLabel} (chứa ACEi): Bắt buộc ngừng ACEi tối thiểu 36 giờ (washout) trước khi uống liều đầu tiên Sacubitril/valsartan để phòng phù mạch`
          });
        }
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'fda.entresto.acei_36h_washout',
          'esc.hf.2026.washout_acei_arni_36h'
        ]);
        state.updatedAction = 'HOLD';
        state.updatedTitle = 'Tạm hoãn Sacubitril/valsartan chờ đủ 36 giờ washout ACEi';
        state.updatedRationale = `Bắt buộc ngừng ${aceiLabel} tối thiểu 36 giờ trước khi khởi trị Sacubitril/valsartan (ARNI) do nguy cơ phù mạch đe dọa tính mạng (FDA Boxed / ESC HF 2026). ${state.updatedRationale}`;
        state.isBlocked = true;
        state.blockReason = 'Cần ngừng ACEi tối thiểu 36 giờ trước khi dùng ARNI';
      }
    }

    if (isPrescribingAction) {
      const currentMedIdsLower = new Set<string>();
      for (const m of patient.currentMeds || []) {
        if (!m?.drugId) continue;
        const low = m.drugId.trim().toLowerCase();
        if (!low) continue;
        currentMedIdsLower.add(low);
        for (const comp of expandDrugComponents(low)) currentMedIdsLower.add(comp);
      }
      const patientOnPde5i = Array.from(currentMedIdsLower).some(
        (id) => PDE5I_DRUG_IDS.has(id) || getNormalizedDrugClasses(id).has('pde5i')
      );
      const patientOnNitrateOrSgc = Array.from(currentMedIdsLower).some(
        (id) => NITRATE_OR_SGC_DRUG_IDS.has(id) || getNormalizedDrugClasses(id).has('nitrate')
      );
      const isTargetNitrateOrSgc = NITRATE_OR_SGC_DRUG_IDS.has(drugId) || drugClasses.has('nitrate');
      const isTargetPde5i = PDE5I_DRUG_IDS.has(drugId) || drugClasses.has('pde5i');

      if ((isTargetNitrateOrSgc && patientOnPde5i) || (isTargetPde5i && patientOnNitrateOrSgc)) {
        state.gates.push({
          parameter: 'PDE5i_Nitrate_SGC',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định tuyệt đối phối hợp PDE-5i (sildenafil/tadalafil/vardenafil) với Nitrat hoặc Vericiguat do tụt huyết áp sâu đe dọa tính mạng'
        });
        state.citationIds = mergeCleanCitations(state.citationIds, ['esc.hf.2026.vericiguat_rec', 'esc.hf.2026.acute_vasodilators']);
        state.updatedAction = 'AVOID';
        state.updatedTitle = `CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Tương tác PDE-5i gây tụt HA tử vong)`;
        state.isBlocked = true;
        state.blockReason = 'Chống chỉ định phối hợp PDE-5i với Nitrat / Vericiguat';
      }

      const patientOnStrongCyp3a4 = Array.from(currentMedIdsLower).some(
        (id) =>
          STRONG_CYP3A4_INHIBITOR_IDS.has(id) ||
          getNormalizedDrugClasses(id).has('strong_cyp3a4_inhibitor') ||
          getNormalizedDrugClasses(id).has('strong_cyp3a4_pgp_inhibitor')
      );
      const components = expandDrugComponents(resolvedKbId);
      const egfrVal = derived.egfr ?? derived.egfrCr;
      const colchicineRenalHepaticContra =
        components.includes('colchicine') &&
        ((egfrVal !== undefined && egfrVal < 60) ||
          hasCondition({ normalized: patient, patient }, 'liverDisease') ||
          Boolean(patient.customInputs?.childPugh));

      if (
        patientOnStrongCyp3a4 &&
        (components.some((c) => ['eplerenone', 'finerenone', 'ivabradine', 'simvastatin', 'lovastatin'].includes(c)) ||
          colchicineRenalHepaticContra)
      ) {
        const cypCitations = colchicineRenalHepaticContra
          ? ['fda.colchicine.contraindication_renal_hepatic', 'fda.colchicine.strong_cyp3a4_table1']
          : components.includes('ivabradine')
            ? ['fda.ivabradine.contraindication_strong_cyp3a4']
            : components.includes('simvastatin') || components.includes('lovastatin')
              ? ['fda.atorvastatin.itraconazole_limit_20mg']
              : ['fda.finerenone.strong_cyp3a4_contraindicated', 'esc.hf.2026.mra_guidance_table_s8'];
        state.gates.push({
          parameter: 'CYP3A4_contra',
          passed: false,
          action: 'contra',
          messageVi: `Chống chỉ định tuyệt đối phối hợp ${rec.drugNameVi || kbDrug?.nameVi || drugId} với thuốc ức chế mạnh CYP3A4/P-gp (clarithromycin/ketoconazole/itraconazole/ritonavir/cyclosporine)`
        });
        state.citationIds = mergeCleanCitations(state.citationIds, cypCitations);
        state.updatedAction = 'AVOID';
        state.updatedTitle = `CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Đang dùng chất ức chế mạnh CYP3A4/P-gp)`;
        state.isBlocked = true;
        state.blockReason = 'Chống chỉ định phối hợp với chất ức chế mạnh CYP3A4/P-gp';
      }

      if (
        (components.includes('ivabradine') &&
          (currentMedIdsLower.has('diltiazem') || currentMedIdsLower.has('verapamil'))) ||
        ((components.includes('diltiazem') || components.includes('verapamil')) &&
          currentMedIdsLower.has('ivabradine'))
      ) {
        state.gates.push({
          parameter: 'ivabradine_ndhp_ccb_contra',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định phối hợp Ivabradine với Diltiazem hoặc Verapamil (tăng 2–3 lần nồng độ Ivabradine và cộng hưởng ức chế nút xoang)'
        });
        state.citationIds = mergeCleanCitations(state.citationIds, ['fda.ivabradine.verapamil_diltiazem_avoid']);
        state.updatedAction = 'AVOID';
        state.updatedTitle = `CHỐNG CHỈ ĐỊNH PHỐI HỢP ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Ivabradine + Diltiazem/Verapamil)`;
        state.isBlocked = true;
        state.blockReason = 'Chống chỉ định phối hợp Ivabradine với Diltiazem / Verapamil';
      }

      const rhythmStr = patient.rhythm as string | undefined;
      const hasAf =
        rhythmStr === 'afib' ||
        rhythmStr === 'af' ||
        rhythmStr === 'flutter' ||
        hasCondition({ normalized: patient, patient }, 'af');
      if (resolvedKbId === 'ivabradine' && hasAf) {
        state.gates.push({
          parameter: 'rhythm',
          passed: false,
          action: 'contra',
          messageVi: 'Ivabradine chỉ tác dụng trên kênh If nút xoang, không chỉ định và cần ngừng ở bệnh nhân rung nhĩ'
        });
        state.citationIds = mergeCleanCitations(state.citationIds, ['esc.hf.2026.ivabradine_rec']);
        state.updatedAction = 'AVOID';
        state.updatedTitle = `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG Ivabradine (Bệnh nhân có Rung nhĩ)`;
        state.isBlocked = true;
        state.blockReason = 'Ivabradine chỉ có chỉ định ở nhịp xoang';
      }

      const isNonSelectiveBb =
        !isOphthalmicBetaBlocker(drugId, routeHint) &&
        (drugClasses.has('bb_nonselective') ||
          ['carvedilol', 'propranolol', 'nadolol', 'timolol', 'sotalol', 'labetalol', 'pindolol'].includes(resolvedKbId));
      if (isNonSelectiveBb && hasCondition({ normalized: patient, patient }, 'asthma')) {
        state.gates.push({
          parameter: 'asthma',
          passed: false,
          action: 'contra',
          messageVi: 'Chống chỉ định thuốc chẹn beta không chọn lọc ở bệnh nhân hen phế quản do nguy cơ co thắt phế quản cấp'
        });
        state.citationIds = mergeCleanCitations(state.citationIds, [
          'fda.carvedilol.contraindication_asthma',
          'gina.asthma.2026.beta_blocker_bronchospasm'
        ]);
        state.updatedAction = 'AVOID';
        state.updatedTitle = `CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Hen phế quản)`;
        state.isBlocked = true;
        state.blockReason = 'Chống chỉ định chẹn beta không chọn lọc ở hen phế quản';
      }

      const hasHfReduced =
        (patient.lvef !== undefined && patient.lvef <= 40) ||
        (hasCondition({ normalized: patient, patient }, 'hf') && (patient.lvef === undefined || patient.lvef < 50));
      if (hasHfReduced) {
        if (['diltiazem', 'verapamil'].includes(resolvedKbId) || drugClasses.has('ndhp_ccb')) {
          state.gates.push({
            parameter: 'HFrEF',
            passed: false,
            action: 'contra',
            messageVi: 'Chống chỉ định CCB Non-DHP (Diltiazem/Verapamil) ở suy tim HFrEF do ức chế co bóp cơ tim'
          });
          state.citationIds = mergeCleanCitations(state.citationIds, ['esc.hf.2026.non_dhp_ccb_contraindicated']);
          state.updatedAction = 'AVOID';
          state.updatedTitle = `CHỐNG CHỈ ĐỊNH ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Suy tim HFrEF)`;
          state.isBlocked = true;
          state.blockReason = 'Chống chỉ định CCB Non-DHP ở HFrEF';
        } else if (['flecainide', 'propafenone', 'dronedarone'].includes(resolvedKbId)) {
          state.gates.push({
            parameter: 'HFrEF',
            passed: false,
            action: 'contra',
            messageVi: 'Chống chỉ định thuốc chống loạn nhịp nhóm IC (Flecainide/Propafenone) và Dronedarone ở HFrEF do tăng tử vong'
          });
          state.citationIds = mergeCleanCitations(state.citationIds, [
            'acc.af.2023.dronedarone_hf_contra',
            'esc.af.2024.aad_flecainide_propafenone'
          ]);
          state.updatedAction = 'AVOID';
          state.updatedTitle = `CHỐNG CHỈ ĐỊNH ${rec.drugNameVi || kbDrug?.nameVi || rec.title} (Suy tim HFrEF)`;
          state.isBlocked = true;
          state.blockReason = 'Chống chỉ định thuốc chống loạn nhịp nhóm IC / Dronedarone ở HFrEF';
        }
      }
    }

    // 5. Thực thi toàn cục các mã chống chỉ định máy đọc (`DrugEntry.contraindications[].code`) cho cả thuốc đơn & thành phần FDC
    if (isPrescribingAction) {
      const kbEntries: DrugEntry[] = [];
      if (kbDrug) kbEntries.push(kbDrug);
      for (const comp of expandDrugComponents(resolvedKbId)) {
        if (comp !== kbDrug?.id && hasDrug(comp)) kbEntries.push(drug(comp));
      }
      for (const entry of kbEntries) {
        for (const contra of entry.contraindications || []) {
          if (contra.code === 'pregnancy') continue; // Đã xử lý ở cổng thai kỳ chuyên biệt
          // The lactose warning on Seebri DPI is an excipient warning, not an allergy to glycopyrronium.
          // Apply this exception only to the explicitly identified lactose-free Trimbow pMDI formulation.
          if (contra.code === 'severe_milk_protein_allergy' && entry.id === 'glycopyrronium' &&
              resolvedKbId === 'beclometasone_glycopyrronium_formoterol' && /\bpmdi\b/i.test(routeHint) &&
              !/\bdpi\b|nexthaler|bột/i.test(routeHint)) {
            state.citationIds = mergeCleanCitations(state.citationIds, ['ema.trimbow.pmdi_excipients']);
            continue;
          }
          const { matched, parameter: paramName } = matchesContraindicationCode(
            contra.code,
            patient,
            derived,
            rec.action,
            resolvedKbId
          );
          if (matched && !state.gates.some((g) => g.parameter === paramName && !g.passed)) {
            state.gates.push({
              parameter: paramName,
              passed: false,
              action: 'contra',
              messageVi: contra.messageVi || `Chống chỉ định ${entry.nameVi} (${contra.code})`
            });
            state.citationIds = mergeCleanCitations(state.citationIds, contra.citationIds);
            state.updatedAction = isOngoing ? 'STOP' : 'AVOID';
            state.updatedTitle = `${state.updatedAction === 'STOP' ? 'NGỪNG NGAY' : 'CHỐNG CHỈ ĐỊNH / TRÁNH DÙNG'} ${rec.drugNameVi || kbDrug?.nameVi || entry.nameVi}`;
            if (contra.messageVi && !state.updatedRationale.includes(contra.messageVi)) {
              state.updatedRationale = `${contra.messageVi}. ${state.updatedRationale}`;
            }
            state.isBlocked = true;
            state.blockReason = contra.messageVi || `Chống chỉ định ${contra.code}`;
          }
        }
      }
    }

    applyOrganAndCrisisSafetyGates(
      rec,
      patient,
      settings,
      drugId,
      resolvedKbId,
      kbDrug,
      drugClasses,
      isPrescribingAction,
      state
    );
  }

  if (resolvedKbId && isPrescribingAction && isCypSensitiveInhaler(resolvedKbId) && hasRespiratoryCyp3a4Inhibitor(patient)) {
    state.updatedAction = isOngoing ? 'STOP' : 'AVOID';
    state.updatedDose = undefined;
    state.isBlocked = true;
    state.blockReason = 'Tương tác CYP3A4 với thuốc hít: cần đổi controller an toàn, không để gián đoạn ICS';
    state.updatedTitle = `TRÁNH PHỐI HỢP ${rec.drugNameVi || kbDrug?.nameVi || resolvedKbId}: Tương tác CYP3A4`;
    state.updatedRationale = `${state.blockReason}. Hội chẩn để thay thuốc hít hoặc thuốc gây tương tác; không tự ngừng ICS kéo dài. ${rec.rationale}`;
    state.gates.push({ parameter: 'inhaled_cyp3a4', passed: false, action: 'contra', messageVi: state.blockReason });
    state.citationIds = mergeCleanCitations(state.citationIds, ['gina.asthma.2026.cyp3a4_ics_laba_interaction']);
  }

  const shouldClearDose =
    state.updatedAction === 'STOP' ||
    state.updatedAction === 'AVOID' ||
    state.updatedAction === 'HOLD' ||
    state.updatedAction === 'DEFER';

  return {
    updatedRec: {
      ...rec,
      action: state.updatedAction,
      switchFrom: rec.action === 'SWITCH' && shouldClearDose ? undefined : rec.switchFrom,
      dose: shouldClearDose ? undefined : state.updatedDose,
      title: state.updatedTitle,
      rationale: state.updatedRationale,
      gates: state.gates,
      citationIds: state.citationIds
    },
    allPassed: !state.isBlocked,
    blockReason: state.isBlocked ? state.blockReason : undefined
  };
}
