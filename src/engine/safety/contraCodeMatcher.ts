/**
 * GDMT-VN Safety - Structured Contraindication Code Dispatcher, Conduction & WPW Gates
 * Phân quyền: Agent B
 */

import type { Patient, Derived, Action } from '../types';
import { hasCondition } from '../types';
import { expandDrugComponents, resolveCanonicalDrugId } from './fdcMap';
import {
  getNormalizedDrugClasses,
  hasSevereMilkProteinAllergy,
  hasNarrowAngleGlaucoma,
  hasUrinaryRetentionCondition,
  hasMtcOrMen2History,
  hasPancreatitisHistory,
  hasAcuteBronchospasmOrRespFailure,
  isOphthalmicBetaBlocker
} from './drugClassify';
import { isCardiogenicShockOrVasopressor } from './clinicalStates';

export const ACUTE_ASTHMA_EXEMPT_DRUG_IDS = new Set<string>([
  'budesonide_formoterol',
  'beclometasone_formoterol',
  'mometasone_formoterol',
  'salbutamol',
  'ipratropium',
  'ipratropium_salbutamol',
  'ipratropium_fenoterol',
  'salbutamol_ipratropium',
  'combivent',
  'berodual',
  'terbutaline',
  'prednisolone',
  'prednisone',
  'methylprednisolone',
  'hydrocortisone',
  'dexamethasone',
  'magnesium_sulfate'
]);

export interface ConductionOrWpwVerdict {
  blocked: true;
  parameter: 'conduction_block' | 'wpw_pre_excited_af';
  actionForCurrent: 'STOP' | 'HOLD';
  messageVi: string;
  citationIds: string[];
}

const CONDUCTION_DEPRESSING_IDS = new Set<string>([
  'bisoprolol',
  'metoprolol_succinate',
  'metoprolol_tartrate',
  'metoprolol',
  'carvedilol',
  'nebivolol',
  'atenolol',
  'propranolol',
  'nadolol',
  'timolol',
  'labetalol',
  'esmolol',
  'landiolol',
  'celiprolol',
  'betaxolol',
  'acebutolol',
  'pindolol',
  'sotalol',
  'ivabradine',
  'diltiazem',
  'verapamil',
  'digoxin',
  'amiodarone',
  'dronedarone',
  'flecainide',
  'propafenone',
  'clonidine',
  'magnesium_sulfate',
  'adenosine'
]);

const WPW_AV_NODAL_BLOCKER_IDS = new Set<string>([
  'bisoprolol',
  'metoprolol_succinate',
  'metoprolol_tartrate',
  'metoprolol',
  'carvedilol',
  'nebivolol',
  'atenolol',
  'propranolol',
  'nadolol',
  'timolol',
  'labetalol',
  'esmolol',
  'landiolol',
  'celiprolol',
  'betaxolol',
  'acebutolol',
  'pindolol',
  'sotalol',
  'diltiazem',
  'verapamil',
  'digoxin',
  'amiodarone',
  'dronedarone',
  'adenosine',
  'ivabradine'
]);

export function hasFunctioningPacemaker(patient: Patient): boolean {
  return hasCondition({ normalized: patient, patient }, 'pacemaker');
}

export function hasHighGradeConductionDiseaseWithoutPacemaker(patient: Patient): {
  matched: boolean;
  reasonVi?: string;
} {
  if (hasFunctioningPacemaker(patient)) return { matched: false };
  const hasAvBlock = hasCondition({ normalized: patient, patient }, 'avBlock2Or3');
  const hasSss = hasCondition({ normalized: patient, patient }, 'sickSinusSyndrome');
  if (hasAvBlock) {
    return {
      matched: true,
      reasonVi: 'Bloc nhĩ thất độ II hoặc độ III chưa đặt máy tạo nhịp'
    };
  }
  if (hasSss) {
    return {
      matched: true,
      reasonVi: 'Hội chứng suy nút xoang chưa đặt máy tạo nhịp'
    };
  }
  return { matched: false };
}

export function hasWpwOrPreExcitedAf(patient: Patient): boolean {
  return (
    hasCondition({ normalized: patient, patient }, 'wpw') ||
    hasCondition({ normalized: patient, patient }, 'preExcitedAf')
  );
}

/**
 * Đánh giá chống chỉ định trên hệ dẫn truyền (AV block độ 2–3, suy nút xoang chưa đặt máy tạo nhịp)
 * và hội chứng Wolff-Parkinson-White (WPW / rung nhĩ tiền kích thích).
 */
export function evaluateConductionAndWpwSafety(
  drugIdOrName: string,
  patient: Patient,
  routeHint?: string
): ConductionOrWpwVerdict | null {
  if (isOphthalmicBetaBlocker(drugIdOrName, routeHint)) return null;

  const canonical = resolveCanonicalDrugId(drugIdOrName);
  const components = expandDrugComponents(canonical);
  const classes = getNormalizedDrugClasses(canonical);

  // 1. WPW / Rung nhĩ tiền kích thích: Cấm tuyệt đối thuốc ức chế nút nhĩ thất (nguy cơ rung thất đột tử)
  if (hasWpwOrPreExcitedAf(patient)) {
    const isAvNodalBlocker =
      classes.has('beta_blocker') ||
      classes.has('bb_selective') ||
      classes.has('bb_nonselective') ||
      classes.has('ndhp_ccb') ||
      components.some((c) => WPW_AV_NODAL_BLOCKER_IDS.has(c));

    if (isAvNodalBlocker) {
      return {
        blocked: true,
        parameter: 'wpw_pre_excited_af',
        actionForCurrent: 'STOP',
        messageVi:
          'Hội chứng Wolff-Parkinson-White (WPW) / Rung nhĩ tiền kích thích: Chống chỉ định tuyệt đối các thuốc ức chế nút nhĩ thất (chẹn beta, diltiazem, verapamil, digoxin, amiodarone, adenosine, ivabradine) do tăng dẫn truyền qua đường phụ gây rung thất và ngừng tim',
        citationIds: ['fda.hf.digoxin_wpw_af', 'fda.diltiazem.beta_blocker_additive_conduction']
      };
    }
  }

  // 2. Bloc nhĩ thất độ 2–3 hoặc Suy nút xoang chưa đặt máy tạo nhịp
  const condCheck = hasHighGradeConductionDiseaseWithoutPacemaker(patient);
  if (condCheck.matched) {
    const isConductionDepressant =
      classes.has('beta_blocker') ||
      classes.has('bb_selective') ||
      classes.has('bb_nonselective') ||
      classes.has('ndhp_ccb') ||
      components.some((c) => CONDUCTION_DEPRESSING_IDS.has(c));

    if (isConductionDepressant) {
      return {
        blocked: true,
        parameter: 'conduction_block',
        actionForCurrent: 'STOP',
        messageVi: `${condCheck.reasonVi}: Chống chỉ định các thuốc ức chế nút xoang / dẫn truyền nhĩ thất (chẹn beta, ivabradine, diltiazem, verapamil, digoxin, chống loạn nhịp nhóm IC/III) do nguy cơ vô tâm thu và ngất`,
        citationIds: [
          'fda.hf.carvedilol_contra',
          'fda.hf.ivabradine_contra',
          'fda.diltiazem.beta_blocker_additive_conduction'
        ]
      };
    }
  }

  return null;
}

/**
 * Bộ khớp mã chống chỉ định máy đọc (`DrugEntry.contraindications[].code`) dùng chung cho `gates.ts` và `reviewMeds.ts`.
 */
export function matchesContraindicationCode(
  code: string,
  patient: Patient,
  _derived?: Derived,
  recAction?: Action,
  targetDrugId?: string
): { matched: boolean; parameter: string } {
  const c = code.trim().toLowerCase();
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const isInitiatingOrEscalating =
    recAction === undefined ||
    recAction === 'START' ||
    recAction === 'CONSIDER' ||
    recAction === 'UPTITRATE' ||
    recAction === 'SWITCH';

  switch (c) {
    case 'hla_b5801': {
      const hla = ci.hlab5801 ?? ci.hlaB5801 ?? cond.hlaB5801;
      return { matched: hla === 'positive' || hla === true, parameter: 'HLA-B*5801' };
    }
    case 'dialysis':
      return {
        matched: hasCondition({ normalized: patient, patient }, 'onDialysis'),
        parameter: 'dialysis'
      };
    case 'mechanical_valve':
    case 'mechanical_heart_valve':
      return {
        matched: hasCondition({ normalized: patient, patient }, 'mechanicalValve'),
        parameter: 'mechanicalValve'
      };
    case 'rheumatic_mitral_stenosis':
    case 'moderate_severe_mitral_stenosis':
      return {
        matched: hasCondition({ normalized: patient, patient }, 'mitralStenosis'),
        parameter: 'mitralStenosis'
      };
    case 'antiphospholipid_syndrome':
      return {
        matched: Boolean(
          cond.antiphospholipidSyndrome === true ||
            ci.antiphospholipidSyndrome === true ||
            ci.aps === true
        ),
        parameter: 'antiphospholipid_syndrome'
      };
    case 'reduced_lvef':
    case 'hfref':
      return {
        matched: patient.lvef !== undefined && patient.lvef <= 40,
        parameter: 'LVEF'
      };
    case 'heart_failure':
      return {
        matched:
          hasCondition({ normalized: patient, patient }, 'hf') ||
          (patient.lvef !== undefined && patient.lvef < 50),
        parameter: 'heart_failure'
      };
    case 'reactive_airway_disease':
    case 'asthma':
      return {
        matched: hasCondition({ normalized: patient, patient }, 'asthma'),
        parameter: 'asthma'
      };
    case 'acute_asthma':
    case 'acute_bronchospasm':
    case 'status_asthmaticus': {
      const canonTarget = targetDrugId ? resolveCanonicalDrugId(targetDrugId) : '';
      if (
        (targetDrugId && ACUTE_ASTHMA_EXEMPT_DRUG_IDS.has(targetDrugId.trim().toLowerCase())) ||
        (canonTarget && ACUTE_ASTHMA_EXEMPT_DRUG_IDS.has(canonTarget))
      ) {
        return { matched: false, parameter: 'acute_bronchospasm' };
      }
      return {
        matched: hasAcuteBronchospasmOrRespFailure(patient),
        parameter: 'acute_bronchospasm'
      };
    }
    case 'severe_milk_protein_allergy':
      return {
        matched: hasSevereMilkProteinAllergy(patient),
        parameter: 'severe_milk_protein_allergy'
      };
    case 'narrow_angle_glaucoma':
      return {
        matched: hasNarrowAngleGlaucoma(patient) && isInitiatingOrEscalating,
        parameter: 'narrow_angle_glaucoma'
      };
    case 'urinary_retention':
      return {
        matched: hasUrinaryRetentionCondition(patient) && isInitiatingOrEscalating,
        parameter: 'urinary_retention'
      };
    case 'narrow_angle_glaucoma_or_urinary_retention': {
      const isG = hasNarrowAngleGlaucoma(patient);
      const isU = hasUrinaryRetentionCondition(patient);
      return {
        matched: (isG || isU) && isInitiatingOrEscalating,
        parameter: isG ? 'narrow_angle_glaucoma' : 'urinary_retention'
      };
    }
    case 'av_block_2_3':
    case 'second_or_third_degree_av_block':
      return {
        matched:
          !hasFunctioningPacemaker(patient) &&
          hasCondition({ normalized: patient, patient }, 'avBlock2Or3'),
        parameter: 'av_block_2_3'
      };
    case 'sick_sinus_syndrome':
      return {
        matched:
          !hasFunctioningPacemaker(patient) &&
          hasCondition({ normalized: patient, patient }, 'sickSinusSyndrome'),
        parameter: 'sick_sinus_syndrome'
      };
    case 'severe_bradycardia':
      return {
        matched:
          !hasFunctioningPacemaker(patient) && patient.hr !== undefined && patient.hr < 50,
        parameter: 'HR'
      };
    case 'cardiogenic_shock':
      return {
        matched: isCardiogenicShockOrVasopressor(patient),
        parameter: 'cardiogenic_shock'
      };
    case 'acute_decompensated_hf':
      return {
        matched: Boolean(
          cond.acuteDecompensatedHf === true ||
            ci.acuteDecompensatedHf === true ||
            isCardiogenicShockOrVasopressor(patient)
        ),
        parameter: 'acute_decompensated_hf'
      };
    case 'severe_hypotension':
      return {
        matched: patient.sbp !== undefined && patient.sbp < 90,
        parameter: 'SBP'
      };
    case 'severe_aortic_stenosis':
      return {
        matched: Boolean(cond.severeAorticStenosis === true || ci.severeAorticStenosis === true),
        parameter: 'severe_aortic_stenosis'
      };
    case 'myasthenia_gravis':
      return {
        matched: Boolean(cond.myastheniaGravis === true || ci.myastheniaGravis === true ||
          cond.myasthenia_gravis === true || ci.myasthenia_gravis === true),
        parameter: 'myasthenia_gravis'
      };
    case 'angioedema_history':
    case 'hereditary_angioedema':
      return {
        matched: hasCondition({ normalized: patient, patient }, 'priorAngioedema'),
        parameter: 'angioedema'
      };
    case 'bilateral_renal_artery_stenosis':
      return {
        matched: Boolean(
          cond.bilateralRenalArteryStenosis === true ||
            ci.bilateralRenalArteryStenosis === true ||
            cond.renalArteryStenosis === true ||
            ci.renalArteryStenosis === true
        ),
        parameter: 'bilateral_renal_artery_stenosis'
      };
    case 'wpw_afib':
    case 'pre_excited_af':
      return {
        matched: hasWpwOrPreExcitedAf(patient),
        parameter: 'wpw_pre_excited_af'
      };
    case 'child_pugh_c':
    case 'decompensated_cirrhosis':
      return {
        matched:
          hasCondition({ normalized: patient, patient }, 'decompensatedCirrhosis') ||
          String(ci.childPugh ?? ci.childPughClass ?? '').trim().toUpperCase() === 'C',
        parameter: 'hepatic'
      };
    case 'severe_hepatic_impairment': {
      const cp = String(ci.childPugh ?? ci.childPughClass ?? '').trim().toUpperCase();
      return {
        matched:
          cp === 'C' ||
          hasCondition({ normalized: patient, patient }, 'decompensatedCirrhosis'),
        parameter: 'hepatic'
      };
    }
    case 'moderate_to_severe_hepatic_impairment': {
      const cp = String(ci.childPugh ?? ci.childPughClass ?? '').trim().toUpperCase();
      return {
        matched:
          cp === 'B' ||
          cp === 'C' ||
          hasCondition({ normalized: patient, patient }, 'decompensatedCirrhosis'),
        parameter: 'hepatic'
      };
    }
    case 'active_liver_disease':
      return {
        matched: hasCondition({ normalized: patient, patient }, 'activeLiverDisease'),
        parameter: 'hepatic'
      };
    case 'biliary_obstruction':
      return {
        matched: Boolean(
          cond.biliaryObstruction === true ||
            ci.biliaryObstruction === true ||
            cond.cholestasis === true ||
            ci.cholestasis === true
        ),
        parameter: 'biliary_obstruction'
      };
    case 'cholelithiasis':
    case 'gallbladder_disease':
      return {
        matched: Boolean(
          cond.cholelithiasis === true ||
            ci.cholelithiasis === true ||
            cond.gallbladderDisease === true ||
            ci.gallbladderDisease === true
        ),
        parameter: 'cholelithiasis'
      };
    case 'obstructive_bowel_disease':
      return {
        matched: Boolean(
          cond.obstructiveBowelDisease === true ||
            ci.obstructiveBowelDisease === true ||
            ci.bowelObstruction === true
        ),
        parameter: 'obstructive_bowel_disease'
      };
    case 'adrenal_insufficiency':
      return {
        matched: Boolean(cond.adrenalInsufficiency === true || ci.adrenalInsufficiency === true),
        parameter: 'adrenal_insufficiency'
      };
    case 'active_bleeding':
    case 'acute_ich':
    case 'active_peptic_ulcer':
      return {
        matched:
          hasCondition({ normalized: patient, patient }, 'activeBleeding') ||
          hasCondition({ normalized: patient, patient }, 'acuteIntracerebralHemorrhage') ||
          Boolean(cond.activePepticUlcer === true || ci.activePepticUlcer === true),
        parameter: 'active_bleeding'
      };
    case 'mtc_men2':
      return {
        matched: hasMtcOrMen2History(patient),
        parameter: 'MTC_MEN2'
      };
    case 'pancreatitis_history':
    case 'acute_pancreatitis':
      return {
        matched: hasPancreatitisHistory(patient),
        parameter: 'pancreatitis'
      };
    case 'urolithiasis':
    case 'nephrolithiasis':
      return {
        matched: Boolean(
          cond.urolithiasis === true ||
            ci.urolithiasis === true ||
            cond.nephrolithiasis === true ||
            ci.nephrolithiasis === true ||
            ci.kidneyStones === true
        ),
        parameter: 'urolithiasis'
      };
    case 'soy_egg_allergy':
      return {
        matched: Boolean(
          cond.soyEggAllergy === true ||
            ci.soyEggAllergy === true ||
            ci.soyAllergy === true ||
            ci.eggAllergy === true
        ),
        parameter: 'soy_egg_allergy'
      };
    case 'severe_hypertriglyceridemia':
      // Clevidipine chống chỉ định khi rối loạn chuyển hóa lipid nặng / TG >= 5.65 mmol/L (500 mg/dL)
      return {
        matched:
          Boolean(cond.defectiveLipidMetabolism === true || ci.defectiveLipidMetabolism === true) ||
          (patient.tg !== undefined && patient.tg >= 5.65 && Boolean(ci.lipidNephrosis || ci.hyperlipidemicPancreatitis)),
        parameter: 'severe_hypertriglyceridemia'
      };
    case 'sulfonamide_allergy':
      return {
        matched: Boolean(cond.sulfonamideAllergy === true || ci.sulfonamideAllergy === true),
        parameter: 'sulfonamide_allergy'
      };
    default:
      return { matched: false, parameter: code };
  }
}
