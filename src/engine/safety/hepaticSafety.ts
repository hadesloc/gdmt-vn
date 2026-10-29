/**
 * GDMT-VN Safety - Hepatic Child-Pugh A / B / C & Cholelithiasis Safety Evaluator
 * Phân quyền: Agent B
 */

import type { Patient } from '../types';
import { hasCondition } from '../types';
import { hasDrug, drug, thFor, type DrugEntry } from '../../kb-types';
import { expandDrugComponents } from './fdcMap';
import {
  resolveKbDrugId,
  getNormalizedDrugClasses,
  DOAC_DRUG_IDS
} from './drugClassify';

interface KbHepaticField {
  status?: string;
  note?: string;
  notesVi?: string;
  citationIds?: string[];
}

type DrugEntryWithHepatic = DrugEntry & { hepatic?: KbHepaticField };

export interface HepaticSafetyVerdict {
  actionForStart: 'AVOID' | 'REDUCE';
  actionForCurrent: 'STOP' | 'HOLD' | 'REDUCE';
  maxDailyDoseMg?: number;
  parameter: 'hepatic';
  messageVi: string;
  citationIds: string[];
}

function evaluateSingleDrugHepaticSafety(
  canonical: string,
  drugClasses: Set<string>,
  kbDrug: DrugEntry | undefined,
  patient: Patient,
  dailyDoseMg?: number
): HepaticSafetyVerdict | null {
  const ci = (patient.customInputs || {}) as Record<string, unknown>;
  const cond = (patient.conditions || {}) as Record<string, unknown>;
  const rawCp = String(ci.childPugh ?? ci.childPughClass ?? '').trim().toUpperCase();
  const altUln =
    typeof ci.altUlnTimes === 'number' && Number.isFinite(ci.altUlnTimes)
      ? ci.altUlnTimes
      : typeof ci.altUlnTimes === 'string' &&
          ci.altUlnTimes.trim() !== '' &&
          Number.isFinite(Number(ci.altUlnTimes))
        ? Number(ci.altUlnTimes)
        : undefined;

  const hasActiveLiver = hasCondition({ normalized: patient, patient }, 'activeLiverDisease');
  const hasDecomp =
    hasCondition({ normalized: patient, patient }, 'decompensatedCirrhosis') || rawCp === 'C';
  const hasLiverCond =
    hasCondition({ normalized: patient, patient }, 'liverDisease') ||
    hasCondition({ normalized: patient, patient }, 'cirrhosis');
  const hasBiliaryObstruction = Boolean(
    cond.biliaryObstruction === true ||
      ci.biliaryObstruction === true ||
      cond.cholestasis === true ||
      ci.cholestasis === true
  );
  const hasCholelithiasis = Boolean(
    cond.cholelithiasis === true ||
      ci.cholelithiasis === true ||
      cond.gallbladderDisease === true ||
      ci.gallbladderDisease === true
  );

  // 0a. Fibrate (Fenofibrate / Gemfibrozil): chống chỉ định ở MỌI mức độ xơ gan / bệnh gan (kể cả Child-Pugh A) và bệnh túi mật / sỏi mật
  if (
    drugClasses.has('fibrate') ||
    canonical === 'fenofibrate' ||
    canonical === 'gemfibrozil'
  ) {
    if (
      hasCholelithiasis ||
      hasBiliaryObstruction ||
      hasActiveLiver ||
      hasDecomp ||
      hasLiverCond ||
      rawCp === 'A' ||
      rawCp === 'B' ||
      rawCp === 'C' ||
      (altUln !== undefined && altUln >= 3)
    ) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi:
          hasCholelithiasis || hasBiliaryObstruction
            ? 'Chống chỉ định Fibrate (Fenofibrate/Gemfibrozil) ở bệnh nhân sỏi mật, bệnh túi mật hoặc tắc mật'
            : 'Chống chỉ định Fibrate (Fenofibrate/Gemfibrozil) ở bệnh nhân bệnh gan hoạt động hoặc xơ gan (kể cả Child-Pugh A/B/C)',
        citationIds: [
          'fda.ezetimibe.fenofibrate_cholelithiasis',
          'esc.lipid.2019.monitoring_alt_elevation'
        ]
      };
    }
    return null;
  }

  // 0b. Telmisartan: chống chỉ định ở tắc mật hoặc suy gan nặng (Child-Pugh C); giới hạn tối đa <= 40 mg/ngày ở suy gan nhẹ–vừa (Child-Pugh A/B)
  if (canonical === 'telmisartan') {
    if (hasBiliaryObstruction || hasDecomp || rawCp === 'C') {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi:
          'Không dùng Telmisartan theo SmPC EMA khi ứ mật, tắc mật hoặc suy gan nặng / xơ gan mất bù (Child-Pugh C). GDMT-VN áp dụng cổng thận trọng này cho cả ba profile; không gán cho FDA.',
        citationIds: ['ema.telmisartan.hepatic_biliary_contra']
      };
    }
    if (rawCp === 'A' || rawCp === 'B' || hasLiverCond) {
      const maxHepaticMg = thFor('dose_mg', 'ckd.rasi.telmisartan_hepatic_max_dose');
      if (dailyDoseMg !== undefined && dailyDoseMg > maxHepaticMg) {
        return {
          actionForStart: 'REDUCE',
          actionForCurrent: 'REDUCE',
          maxDailyDoseMg: maxHepaticMg,
          parameter: 'hepatic',
          messageVi:
            `${rawCp === 'A' || rawCp === 'B' ? 'Suy gan nhẹ–vừa (Child-Pugh A/B)' : 'Bệnh gan chưa rõ mức độ: cần đánh giá phân độ; tạm áp dụng giới hạn thận trọng, không suy là Child-Pugh A/B'}: Telmisartan không quá ${maxHepaticMg} mg/ngày theo giới hạn SmPC EMA cho suy gan nhẹ–vừa. GDMT-VN áp dụng thận trọng cho cả ba profile; không coi đây là trần liều FDA.`,
          citationIds: ['ema.telmisartan.hepatic_max_40']
        };
      }
      return null;
    }
    return null;
  }

  // 0c. Candesartan: chống chỉ định ở suy gan nặng / ứ mật (Child-Pugh C)
  if (canonical === 'candesartan') {
    if (hasBiliaryObstruction || hasDecomp || rawCp === 'C') {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi:
          'Chống chỉ định Candesartan theo SmPC Anh/Viatris khi suy gan nặng hoặc ứ mật. FDA Atacand không đưa khuyến cáo liều cho suy gan nặng. GDMT-VN áp dụng cổng thận trọng SmPC Anh cho cả ba profile.',
        citationIds: ['uk.candesartan.hepatic_cholestasis_contra', 'fda.candesartan.severe_hepatic_no_dosing']
      };
    }
    return null;
  }

  // Bảo vệ xơ gan còn bù nhẹ Child-Pugh A (không có bệnh gan hoạt động, không tắc mật, ALT < 3x ULN)
  if (
    rawCp === 'A' &&
    !hasDecomp &&
    !hasActiveLiver &&
    !hasBiliaryObstruction &&
    !(altUln !== undefined && altUln >= 3)
  ) {
    return null;
  }

  const isModOrUnspecifiedLiver =
    rawCp === 'B' ||
    rawCp === 'C' ||
    hasDecomp ||
    hasActiveLiver ||
    hasBiliaryObstruction ||
    (rawCp !== 'A' && hasLiverCond);

  const hepaticMeta = (kbDrug as DrugEntryWithHepatic | undefined)?.hepatic;

  // 1. Nhóm Statin
  if (drugClasses.has('statin')) {
    if (hasActiveLiver || hasDecomp || rawCp === 'C' || hasBiliaryObstruction) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi:
          'Chống chỉ định Statin trong bệnh gan hoạt động tiến triển, ứ mật hoặc xơ gan mất bù (Child-Pugh C)',
        citationIds: ['esc.lipid.2019.monitoring_alt_elevation']
      };
    }
    if (altUln !== undefined && altUln >= 3) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'HOLD',
        parameter: 'hepatic',
        messageVi: `Tăng men gan ALT ${altUln}x ULN (≥ 3x ULN): Không khởi trị mới và tạm hoãn Statin đang dùng để đánh giá nguyên nhân tổn thương gan`,
        citationIds: ['esc.lipid.2019.monitoring_alt_elevation']
      };
    }
    return null;
  }

  // 1b. Ezetimibe
  if (canonical === 'ezetimibe') {
    if (rawCp === 'B' || rawCp === 'C' || hasDecomp || hasActiveLiver) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi:
          'Không khuyến cáo Ezetimibe ở bệnh nhân suy gan trung bình – nặng (Child-Pugh B/C) do tăng phơi nhiễm toàn thân 3–6 lần',
        citationIds: ['fda.ezetimibe.hepatic_child_pugh', 'acc.lipid.2026.ezetimibe_hepatic_avoid']
      };
    }
    if (altUln !== undefined && altUln >= 3) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'HOLD',
        parameter: 'hepatic',
        messageVi: `Tăng men gan ALT ${altUln}x ULN (≥ 3x ULN): Tạm hoãn Ezetimibe để đánh giá chức năng gan`,
        citationIds: ['esc.lipid.2019.monitoring_alt_elevation', 'fda.ezetimibe.hepatic_child_pugh']
      };
    }
    return null;
  }

  // 2. Vildagliptin
  if (canonical === 'vildagliptin' && (isModOrUnspecifiedLiver || (altUln !== undefined && altUln >= 3))) {
    return {
      actionForStart: 'AVOID',
      actionForCurrent: 'STOP',
      parameter: 'hepatic',
      messageVi:
        hepaticMeta?.note ||
        'Chống chỉ định Vildagliptin ở bệnh nhân suy gan hoặc tăng men gan ALT/AST ≥ 3x ULN',
      citationIds: hepaticMeta?.citationIds?.length
        ? hepaticMeta.citationIds
        : ['esc.lipid.2019.monitoring_alt_elevation']
    };
  }

  // 3. Roflumilast (Child-Pugh B / C)
  if (canonical === 'roflumilast' && (rawCp === 'B' || rawCp === 'C' || hasDecomp || hasActiveLiver)) {
    return {
      actionForStart: 'AVOID',
      actionForCurrent: 'STOP',
      parameter: 'hepatic',
      messageVi:
        hepaticMeta?.note ||
        'Chống chỉ định Roflumilast ở bệnh nhân suy gan trung bình – nặng (Child-Pugh B hoặc C)',
      citationIds: hepaticMeta?.citationIds?.length
        ? hepaticMeta.citationIds
        : ['fda.copd.roflumilast_contra_liver']
    };
  }

  // 4. Rivaroxaban (Child-Pugh B/C) & Toàn bộ DOAC (Child-Pugh C)
  if (canonical === 'rivaroxaban' && (rawCp === 'B' || rawCp === 'C' || hasDecomp || hasActiveLiver)) {
    return {
      actionForStart: 'AVOID',
      actionForCurrent: 'STOP',
      parameter: 'hepatic',
      messageVi:
        hepaticMeta?.note ||
        'Chống chỉ định Rivaroxaban ở bệnh gan kèm rối loạn đông máu hoặc xơ gan Child-Pugh B/C',
      citationIds: hepaticMeta?.citationIds?.length
        ? hepaticMeta.citationIds
        : ['fda.rivaroxaban.hepatic_contra', 'acc.af.2023.doac_child_pugh']
    };
  }
  if ((DOAC_DRUG_IDS.has(canonical) || drugClasses.has('doac')) && (hasDecomp || rawCp === 'C')) {
    return {
      actionForStart: 'AVOID',
      actionForCurrent: 'STOP',
      parameter: 'hepatic',
      messageVi: `Chống chỉ định thuốc chống đông đường uống DOAC (${kbDrug?.nameVi || canonical}) ở xơ gan mất bù nặng (Child-Pugh C)`,
      citationIds: ['acc.af.2023.doac_child_pugh']
    };
  }

  // 5. Benzbromarone
  if (canonical === 'benzbromarone' && (isModOrUnspecifiedLiver || (altUln !== undefined && altUln >= 3))) {
    return {
      actionForStart: 'AVOID',
      actionForCurrent: 'STOP',
      parameter: 'hepatic',
      messageVi:
        hepaticMeta?.note ||
        'Chống chỉ định Benzbromarone ở bệnh nhân bệnh gan mạn tính / suy gan do nguy cơ độc tính gan tối cấp',
      citationIds: hepaticMeta?.citationIds?.length
        ? hepaticMeta.citationIds
        : ['esc.lipid.2019.monitoring_alt_elevation']
    };
  }

  // 6. Các thuốc có hepatic.status === 'contra' trong KB
  if (hepaticMeta?.status === 'contra' && isModOrUnspecifiedLiver) {
    return {
      actionForStart: 'AVOID',
      actionForCurrent: 'STOP',
      parameter: 'hepatic',
      messageVi:
        hepaticMeta.note ||
        `Chống chỉ định ${kbDrug?.nameVi || canonical} ở bệnh nhân suy gan / tắc mật hoặc bệnh gan tiến triển`,
      citationIds: hepaticMeta.citationIds?.length
        ? hepaticMeta.citationIds
        : []
    };
  }

  // 7. Suy gan nặng / Xơ gan mất bù Child-Pugh C (Empagliflozin được phép theo FDA Jardiance §8.7)
  if (hasDecomp || rawCp === 'C' || (canonical === 'metformin' && hasActiveLiver)) {
    const cpCMap: Record<string, { msg: string; cits: string[] }> = {
      metformin: {
        msg: 'Chống chỉ định / Tránh dùng Metformin ở xơ gan mất bù nặng (Child-Pugh C) hoặc suy gan cấp do nguy cơ nhiễm toan acid lactic',
        cits: ['fda.metformin.hepatic_contra']
      },
      finerenone: {
        msg: 'Tránh dùng Finerenone ở bệnh nhân suy gan nặng (Child-Pugh C)',
        cits: ['fda.finerenone.hepatic_impairment']
      },
      sacubitril_valsartan: {
        msg: 'Không khuyến cáo / Chống chỉ định Sacubitril/Valsartan (ARNI) ở bệnh nhân suy gan nặng (Child-Pugh C)',
        cits: ['fda.hf.sacubitril_lactation_hepatic']
      },
      carvedilol: {
        msg: 'Chống chỉ định Carvedilol ở bệnh nhân suy gan nặng / xơ gan mất bù (Child-Pugh C)',
        cits: ['fda.hf.carvedilol_contra']
      },
      vericiguat: {
        msg: 'Không khuyến cáo Vericiguat ở bệnh nhân xơ gan mất bù nặng (Child-Pugh C)',
        cits: ['fda.hf.vericiguat_renal_hepatic']
      },
      ivabradine: {
        msg: 'Chống chỉ định Ivabradine ở bệnh nhân suy gan nặng (Child-Pugh C)',
        cits: ['fda.hf.ivabradine_contra']
      },
      colchicine: {
        msg: 'Tránh dùng / Ngừng Colchicine ở bệnh nhân xơ gan mất bù nặng (Child-Pugh C) do giảm thanh thải mật và nguy cơ độc tính tủy xương / thần kinh cơ',
        cits: ['fda.colchicine.contraindication_renal_hepatic']
      }
    };

    if (cpCMap[canonical]) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi: hepaticMeta?.note || cpCMap[canonical].msg,
        citationIds: hepaticMeta?.citationIds?.length
          ? hepaticMeta.citationIds
          : cpCMap[canonical].cits
      };
    }

    if (
      canonical !== 'empagliflozin' &&
      (hepaticMeta?.status === 'avoid' ||
        [
          'canagliflozin',
          'ertugliflozin',
          'sodium_nitroprusside',
          'pioglitazone',
          'rosiglitazone'
        ].includes(canonical))
    ) {
      return {
        actionForStart: 'AVOID',
        actionForCurrent: 'STOP',
        parameter: 'hepatic',
        messageVi:
          hepaticMeta?.note ||
          `Tránh dùng / Ngừng ${kbDrug?.nameVi || canonical} ở xơ gan mất bù nặng (Child-Pugh C) do nguy cơ tích lũy thuốc và biến chứng chuyển hóa`,
        citationIds: hepaticMeta?.citationIds?.length
          ? hepaticMeta.citationIds
          : ['esc.lipid.2019.monitoring_alt_elevation']
      };
    }
  }

  return null;
}

export function evaluateHepaticSafety(
  drugId: string,
  resolvedKbId: string,
  drugClasses: Set<string>,
  kbDrug: DrugEntry | undefined,
  patient: Patient,
  dailyDoseMg?: number
): HepaticSafetyVerdict | null {
  const canonical = resolvedKbId || resolveKbDrugId(drugId);
  const direct = evaluateSingleDrugHepaticSafety(canonical, drugClasses, kbDrug, patient, dailyDoseMg);
  if (direct && direct.actionForCurrent === 'STOP') return direct;

  const components = expandDrugComponents(canonical);
  let fallbackVerdict: HepaticSafetyVerdict | null = direct;
  for (const comp of components) {
    if (comp === canonical) continue;
    const compDrug = hasDrug(comp) ? drug(comp) : undefined;
    const compClasses = getNormalizedDrugClasses(comp);
    const v = evaluateSingleDrugHepaticSafety(comp, compClasses, compDrug, patient, undefined);
    if (v) {
      if (v.actionForCurrent === 'STOP') return v;
      if (!fallbackVerdict) fallbackVerdict = v;
    }
  }
  return fallbackVerdict;
}
