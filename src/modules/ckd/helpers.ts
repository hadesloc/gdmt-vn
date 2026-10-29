/**
 * GDMT-VN CKD Module - Shared Clinical Helpers & Fail-Closed Dose Parsing (< 20 KB)
 * Phân quyền: Agent E (Round 4 Remediation - Integrated with Engine doseParser & fdcMap)
 */

import type { CurrentMed } from '../../engine/types';
import type { DrugEntry, RenalBand } from '../../kb-types';
import { thFor } from '../../kb-types/access';
import {
  parseComponentDailyDoseMg,
  parseDailyDoseMg,
  parseFrequencyPerDay,
} from '../../engine/doseParser';
import {
  ARB_SET,
  extractRasiComponentId,
  fmtShortDose,
  getDrugSafe,
  getMedComponents,
  isFdcMed,
  normalizeDrugId,
} from './helpers.drugs';

export * from './helpers.drugs';
export * from './helpers.conditions';

function normalizeMedUnitForParser(med: CurrentMed): { normalizedMed: CurrentMed; unitImpliesDaily: boolean } {
  const rawUnit = (med.unit ?? '').trim();
  const dailyUnitMatch = rawUnit.match(/^(mg|mcg|µg|ug|μg|g)\s*\/\s*(?:ngày|day)$/i);
  if (dailyUnitMatch) {
    return {
      normalizedMed: { ...med, unit: dailyUnitMatch[1] },
      unitImpliesDaily: !med.freq,
    };
  }
  return { normalizedMed: med, unitImpliesDaily: false };
}

function hasDialysisDayFrequency(med: CurrentMed): boolean {
  const doseText = typeof med.dose === 'string' ? med.dose : '';
  const freqText = med.freq ?? '';
  return /ngày\s*lọc\s*máu/i.test(doseText) || /ngày\s*lọc\s*máu/i.test(freqText);
}

/**
 * Phân tích tổng liều hàng ngày (mg/ngày) theo chuẩn Fail-Closed toàn hệ thống (CKD-R4-R1-01, CKD-R4-R2-02).
 * Nếu `med` là viên phối hợp (FDC) có `componentHint`, tự động bóc tách liều hoạt chất thành phần.
 */
export function parseCurrentDailyDoseMg(
  med: CurrentMed | undefined,
  componentHint?: string
): number | undefined {
  if (!med) return undefined;
  if (componentHint || isFdcMed(med)) {
    const targetComp = componentHint ?? extractRasiComponentId(med);
    if (!targetComp) return undefined;
    return parseCurrentComponentDailyDoseMg(med, targetComp);
  }
  const { normalizedMed, unitImpliesDaily } = normalizeMedUnitForParser(med);
  const parsed = parseDailyDoseMg(normalizedMed);
  if (parsed === undefined) return undefined;

  if (!unitImpliesDaily && hasDialysisDayFrequency(med)) {
    const parsedFreq = parseFrequencyPerDay(
      med.freq,
      typeof med.dose === 'string' ? med.dose : undefined
    );
    if (parsedFreq === undefined || parsedFreq === 1) {
      return Number((parsed * 0.5).toFixed(6)); // qa-allow: unit-conversion - quy đổi ngày lọc máu (~cách ngày)
    }
  }
  return parsed;
}

export function parseCurrentComponentDailyDoseMg(
  med: CurrentMed | undefined,
  componentId: string
): number | undefined {
  if (!med || !componentId) return undefined;
  const { normalizedMed } = normalizeMedUnitForParser(med);
  return parseComponentDailyDoseMg(normalizedMed, componentId);
}

function parseMaxFrequencyPerDay(freq: string | undefined): number {
  if (!freq) return 1;
  const low = freq.toLowerCase();
  if (low.includes('cách ngày') || low.includes('48')) return 0.5;
  const rangeMatch = low.match(/(\d+)\s*[–-]\s*(\d+)\s*lần/);
  if (rangeMatch) return parseInt(rangeMatch[2], 10);
  const singleMatch = low.match(/(\d+)\s*lần/);
  if (singleMatch) return parseInt(singleMatch[1], 10);
  return 1;
}

export function getTargetMaxDailyDoseMg(entry: DrugEntry | undefined): number | undefined {
  if (!entry) return undefined;
  if (entry.target && typeof entry.target === 'object' && typeof entry.target.amount === 'number') {
    const unitFactor = entry.target.unit.toLowerCase() === 'g' ? 1000 : 1; // qa-allow: unit-conversion - đổi g sang mg
    if (entry.id === 'enalapril') {
      return entry.target.amount * unitFactor;
    }
    const maxFreq = parseMaxFrequencyPerDay(entry.target.frequency);
    return entry.target.amount * unitFactor * maxFreq;
  }
  return getAbsoluteMaxDailyDoseMg(entry);
}

export function getAbsoluteMaxDailyDoseMg(entry: DrugEntry | undefined): number | undefined {
  if (!entry) return undefined;
  const maxD = entry.titration?.maxDose;
  if (maxD && typeof maxD === 'object' && typeof maxD.amount === 'number') {
    const factor = maxD.unit.toLowerCase() === 'g' ? 1000 : 1; // qa-allow: unit-conversion - đổi g sang mg
    return maxD.amount * factor * parseMaxFrequencyPerDay(maxD.frequency);
  }
  if (typeof maxD === 'string') {
    const gMatch = maxD.match(/(\d+(?:\.\d+)?)\s*g\b/i);
    if (gMatch) return parseFloat(gMatch[1]) * 1000; // qa-allow: unit-conversion - đổi g sang mg
    const mgMatch = maxD.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
    if (mgMatch) return parseFloat(mgMatch[1]);
  }
  return undefined;
}

export interface RenalMaxDailyDoseInfo {
  maxDailyMg: number;
  bandDoseText: string;
  citationIds: string[];
  note?: string;
}

export function getRenalMaxDailyDoseInfo(
  rawDrugId: string,
  egfrVal: number | undefined,
  crclVal: number | undefined,
  onDialysis = false
): RenalMaxDailyDoseInfo | undefined {
  const rasiComp = getMedComponents(rawDrugId).find(
    (c) => ARB_SET.has(c) || ['perindopril', 'ramipril', 'captopril', 'lisinopril', 'enalapril'].includes(c)
  );
  const idLow = rasiComp ?? normalizeDrugId(rawDrugId);
  const entry = getDrugSafe(idLow);
  if (!entry) return undefined;

  const effectiveClearance = crclVal ?? egfrVal;
  if (!onDialysis && effectiveClearance === undefined) return undefined;

  const g5Max = thFor('egfr', 'ckd.egfr.g4_min');
  const g4Max = thFor('egfr', 'ckd.egfr.g3b_min');
  const g3aMax = thFor('egfr', 'ckd.egfr.g2_min');
  const ramiprilCutoff = thFor('crcl', 'ckd.rasi.ramipril_crcl_ceiling_cutoff');

  if (ARB_SET.has(idLow)) {
    const adultMax = getAbsoluteMaxDailyDoseMg(entry) ?? getTargetMaxDailyDoseMg(entry);
    if (adultMax === undefined) return undefined;
    return {
      maxDailyMg: adultMax,
      bandDoseText: `tối đa ${adultMax} mg/ngày`,
      citationIds: entry.citationIds,
    };
  }

  if (idLow === 'perindopril') {
    const startAmt =
      typeof entry.start === 'object' && typeof entry.start.amount === 'number'
        ? entry.start.amount
        : undefined;
    if (startAmt === undefined) return undefined;
    const qodMax = startAmt / 2;
    const lowBand = entry.renal.find((b: RenalBand) => b.crclTo === g5Max);
    const g4Band = entry.renal.find((b: RenalBand) => b.crclFrom === g5Max && b.crclTo === g4Max);
    const g3Band = entry.renal.find((b: RenalBand) => b.crclFrom === g4Max && b.crclTo === g3aMax);

    if (onDialysis) {
      return {
        maxDailyMg: qodMax,
        bandDoseText: `${startAmt} mg vào ngày lọc máu`,
        citationIds: lowBand?.citationIds ?? entry.citationIds,
        note: lowBand?.note,
      };
    }
    if (effectiveClearance !== undefined && effectiveClearance < g5Max) {
      return {
        maxDailyMg: qodMax,
        bandDoseText: `${startAmt} mg cách ngày (chưa lọc máu, thận trọng cao; ưu tiên chuyển sang ARB thải trừ qua gan-mật như Losartan)`,
        citationIds: lowBand?.citationIds ?? entry.citationIds,
        note: lowBand?.note,
      };
    }
    if (effectiveClearance !== undefined && effectiveClearance < g4Max) {
      return {
        maxDailyMg: qodMax,
        bandDoseText: fmtShortDose(g4Band?.dose) || `${startAmt} mg cách ngày`,
        citationIds: g4Band?.citationIds ?? entry.citationIds,
        note: g4Band?.note,
      };
    }
    if (effectiveClearance !== undefined && effectiveClearance < g3aMax) {
      return {
        maxDailyMg: startAmt,
        bandDoseText: fmtShortDose(g3Band?.dose) || `${startAmt} mg/ngày`,
        citationIds: g3Band?.citationIds ?? entry.citationIds,
        note: g3Band?.note,
      };
    }
  }

  if (idLow === 'ramipril') {
    const adultMax = getAbsoluteMaxDailyDoseMg(entry);
    if (adultMax === undefined) return undefined;
    const renalMax = adultMax / 2;
    const startLow =
      typeof entry.start === 'object' && typeof entry.start.amount === 'number'
        ? entry.start.amount / 2
        : renalMax;
    const lowBand = entry.renal.find((b: RenalBand) => b.eGFRTo === g5Max);
    if (onDialysis || (effectiveClearance !== undefined && effectiveClearance < ramiprilCutoff)) {
      return {
        maxDailyMg: renalMax,
        bandDoseText: `${startLow}–${renalMax} mg/ngày (tối đa ${renalMax} mg/ngày khi CrCl < ${ramiprilCutoff} mL/phút)`,
        citationIds: lowBand?.citationIds ?? entry.citationIds,
        note: lowBand?.note,
      };
    }
  }

  if (idLow === 'captopril') {
    const adultMax = getAbsoluteMaxDailyDoseMg(entry);
    if (adultMax === undefined) return undefined;
    const lowBand = entry.renal.find((b: RenalBand) => b.eGFRTo === g5Max);
    const g4Band = entry.renal.find((b: RenalBand) => b.eGFRFrom === g5Max && b.eGFRTo === g4Max);
    if (onDialysis) {
      const hdMax = adultMax * 0.5;
      return {
        maxDailyMg: hdMax,
        bandDoseText: `tối đa ${hdMax} mg/ngày (mỗi 24 giờ, uống sau buổi lọc máu)`,
        citationIds: lowBand?.citationIds ?? entry.citationIds,
        note: lowBand?.note,
      };
    }
    if (effectiveClearance !== undefined && effectiveClearance < g5Max) {
      const g5CapMax = adultMax * 0.5;
      return {
        maxDailyMg: g5CapMax,
        bandDoseText: `tối đa ${g5CapMax} mg/ngày (giãn mỗi 24 giờ ở CKD G5)`,
        citationIds: lowBand?.citationIds ?? entry.citationIds,
        note: lowBand?.note,
      };
    }
    if (effectiveClearance !== undefined && effectiveClearance < g4Max) {
      const g4CapMax = adultMax * 0.75;
      return {
        maxDailyMg: g4CapMax,
        bandDoseText: `tối đa ${g4CapMax} mg/ngày (cách mỗi 12–18 giờ ở CKD G4)`,
        citationIds: g4Band?.citationIds ?? entry.citationIds,
        note: g4Band?.note,
      };
    }
  }

  if (idLow === 'lisinopril' || idLow === 'enalapril') {
    const adultMax = getAbsoluteMaxDailyDoseMg(entry);
    const stdTarget =
      typeof entry.target === 'object' && typeof entry.target.amount === 'number'
        ? entry.target.amount
        : adultMax;
    const lowBand = entry.renal.find((b: RenalBand) => b.eGFRTo === g5Max);
    const startLow =
      typeof entry.start === 'object' && typeof entry.start.amount === 'number'
        ? entry.start.amount / 2
        : stdTarget;
    if (onDialysis && stdTarget !== undefined) {
      return {
        maxDailyMg: stdTarget,
        bandDoseText: `khởi đầu ${startLow} mg, duy trì lọc máu chu kỳ ≤ ${stdTarget} mg/ngày theo huyết áp`,
        citationIds: lowBand?.citationIds ?? entry.citationIds,
        note: lowBand?.note,
      };
    }
    if (adultMax !== undefined) {
      return {
        maxDailyMg: adultMax,
        bandDoseText: `tối đa ${adultMax} mg/ngày`,
        citationIds: entry.citationIds,
      };
    }
  }

  return undefined;
}
