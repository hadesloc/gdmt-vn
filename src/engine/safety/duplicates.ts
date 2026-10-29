/**
 * GDMT-VN Safety - Duplicates & Class Redundancy Checker (KB Data-Driven)
 * Phân quyền: Agent B
 */

import type { Recommendation, SafetyAlert, CurrentMed } from '../types';
import { parseDailyDoseMg } from '../doseParser';
import { hasBlockedDrugOrFdcComponent } from '../routeGuard';
import { resolveKbDrugId, isOphthalmicBetaBlocker } from './drugClassify';
import { expandDrugComponents } from './fdcMap';
import {
  INHALER_COMBINATIONS,
  SINGLE_INHALERS,
  DUPLICATE_CLASS_RULES,
  getExpandedDuplicateClasses,
  isMaintenanceInhalerClasses,
  matchesDuplicateRule,
  type InhalerDecomposition,
  type DuplicateRule
} from './duplicateRules';

export {
  INHALER_COMBINATIONS,
  SINGLE_INHALERS,
  DUPLICATE_CLASS_RULES,
  getExpandedDuplicateClasses,
  type InhalerDecomposition,
  type DuplicateRule
};

/**
 * Xác định tập thuốc nền trong `currentMeds` đã bị thay thế/ngừng bởi lệnh `SWITCH`.
 * Dùng thống nhất cho `evaluate.ts`, `duplicates.ts` và `interactions.ts`.
 */
export function getReplacedBaselineDrugIds(
  currentMeds: CurrentMed[],
  recommendations: Recommendation[]
): Set<string> {
  const safeMeds = Array.isArray(currentMeds) ? currentMeds : [];
  const replaced = new Set<string>();
  const baselineDrugs = new Set<string>();
  for (const m of safeMeds) {
    if (m?.drugId && m.drugId.trim()) {
      baselineDrugs.add(m.drugId.trim().toLowerCase());
    }
  }
  if (baselineDrugs.size === 0) return replaced;

  const findMatchingBaseline = (candidateId: string): string | undefined => {
    const cLower = candidateId.trim().toLowerCase();
    if (!cLower) return undefined;
    if (baselineDrugs.has(cLower)) return cLower;
    const cResolved = resolveKbDrugId(cLower);
    for (const bId of baselineDrugs) {
      if (resolveKbDrugId(bId) === cResolved) return bId;
    }
    return undefined;
  };

  const stoppedOrHeldIds = new Set<string>();
  const explicitlyContinuedIds = new Set<string>();
  const untargetedSwitchTargetIds: string[] = [];

  for (const r of recommendations) {
    if (r.switchFrom && r.switchFrom.trim()) {
      const sfLower = r.switchFrom.trim().toLowerCase();
      replaced.add(sfLower);
      const matchedBase = findMatchingBaseline(sfLower);
      if (matchedBase) replaced.add(matchedBase);
    }
    if (!r.drugId) continue;
    const dId = r.drugId.trim().toLowerCase();
    if (!dId) continue;

    if (r.action === 'STOP' || r.action === 'HOLD' || r.action === 'AVOID') {
      stoppedOrHeldIds.add(dId);
      stoppedOrHeldIds.add(resolveKbDrugId(dId));
      const matchedBase = findMatchingBaseline(dId);
      if (matchedBase) stoppedOrHeldIds.add(matchedBase);
    } else if (r.action === 'SWITCH') {
      const matchedBase = findMatchingBaseline(dId);
      if (matchedBase) {
        replaced.add(dId);
        replaced.add(matchedBase);
      } else if (!r.switchFrom) {
        untargetedSwitchTargetIds.push(dId);
      }
    } else if (r.action === 'CONTINUE' || r.action === 'UPTITRATE') {
      explicitlyContinuedIds.add(dId);
      const matchedBase = findMatchingBaseline(dId);
      if (matchedBase) explicitlyContinuedIds.add(matchedBase);
    }
  }

  if (untargetedSwitchTargetIds.length === 0) {
    return replaced;
  }

  const switchedTargetInfos = untargetedSwitchTargetIds.map((id) => ({
    id,
    ...getExpandedDuplicateClasses(id)
  }));
  const hasInhalerSwitch = switchedTargetInfos.some((info) =>
    isMaintenanceInhalerClasses(info.classes)
  );

  // R3-R2-COPD-01: Chỉ tự động thay thế 1-1 bình hít khi BN chỉ có đúng 1 bình hít duy trì nền duy nhất chưa bị STOP/HOLD
  const unstoppedBaselineInhalers = Array.from(baselineDrugs).filter((id) => {
    if (
      hasBlockedDrugOrFdcComponent(id, stoppedOrHeldIds) ||
      explicitlyContinuedIds.has(id) ||
      replaced.has(id)
    ) {
      return false;
    }
    return isMaintenanceInhalerClasses(getExpandedDuplicateClasses(id).classes);
  });

  const nonInhalerRules = DUPLICATE_CLASS_RULES.filter(
    (rule) => rule.id !== 'dup.laba' && rule.id !== 'dup.lama' && rule.id !== 'dup.ics'
  );

  for (const baseId of baselineDrugs) {
    if (
      hasBlockedDrugOrFdcComponent(baseId, stoppedOrHeldIds) ||
      explicitlyContinuedIds.has(baseId) ||
      replaced.has(baseId)
    ) {
      continue;
    }
    const baseInfo = getExpandedDuplicateClasses(baseId);
    if (hasInhalerSwitch && isMaintenanceInhalerClasses(baseInfo.classes)) {
      if (unstoppedBaselineInhalers.length === 1) {
        replaced.add(baseId);
      }
    } else {
      const replacedBySameNonInhalerRule = nonInhalerRules.some((rule) => {
        if (!matchesDuplicateRule(baseId, baseInfo.classes, rule)) return false;
        const matchingSw = switchedTargetInfos.filter((sw) =>
          matchesDuplicateRule(sw.id, sw.classes, rule)
        );
        if (matchingSw.length === 0) return false;
        if (rule.requiresAnyOf && rule.requiresAnyOf.length > 0) {
          const anchorHit = [baseId, ...matchingSw.map((s) => s.id)].some((cid) => {
            const res = resolveKbDrugId(cid);
            const cls = getExpandedDuplicateClasses(cid).classes;
            return rule.requiresAnyOf!.some((a) => cid === a || res === a || cls.has(a));
          });
          if (!anchorHit) return false;
        }
        const unstoppedInRule = Array.from(baselineDrugs).filter(
          (id) =>
            !hasBlockedDrugOrFdcComponent(id, stoppedOrHeldIds) &&
            !explicitlyContinuedIds.has(id) &&
            matchesDuplicateRule(id, getExpandedDuplicateClasses(id).classes, rule)
        );
        return unstoppedInRule.length === 1;
      });
      if (replacedBySameNonInhalerRule) {
        replaced.add(baseId);
      }
    }
  }

  return replaced;
}

function isLowDoseCardioprotectiveAspirin(med?: CurrentMed, recDose?: string): boolean {
  if (med) {
    const dailyMg = parseDailyDoseMg(med);
    if (dailyMg !== undefined) return dailyMg <= 162;
    const raw = `${med.dose || ''} ${med.name || ''}`;
    const numMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*mg/i);
    if (numMatch) return parseFloat(numMatch[1].replace(',', '.')) <= 162;
    return true; // Aspirin tim mạch mặc định 75–100 mg nếu không ghi liều giảm đau cao (>= 300 mg)
  }
  if (recDose) {
    const numMatch = recDose.match(/(\d+(?:[.,]\d+)?)\s*mg/i);
    if (numMatch) return parseFloat(numMatch[1].replace(',', '.')) <= 162;
  }
  return true;
}

export function checkDuplicates(
  currentMeds: CurrentMed[],
  recommendations: Recommendation[]
): SafetyAlert[] {
  const safeMeds = Array.isArray(currentMeds) ? currentMeds : [];
  const safeRecs = Array.isArray(recommendations) ? recommendations : [];
  const alerts: SafetyAlert[] = [];

  const baselineDrugs = new Set<string>();
  const baselineMedMap = new Map<string, CurrentMed>();
  for (const m of safeMeds) {
    if (isOphthalmicBetaBlocker(`${m?.drugId || ''} ${m?.name || ''}`, m?.route)) continue;
    if (m?.drugId && m.drugId.trim()) {
      const low = m.drugId.trim().toLowerCase();
      baselineDrugs.add(low);
      baselineMedMap.set(low, m);
    }
  }

  const stoppedOrHeldIds = new Set<string>();
  for (const r of safeRecs) {
    if (r.drugId && (r.action === 'STOP' || r.action === 'HOLD' || r.action === 'AVOID')) {
      const dId = r.drugId.trim().toLowerCase();
      if (dId) {
        stoppedOrHeldIds.add(dId);
        stoppedOrHeldIds.add(resolveKbDrugId(dId));
      }
    }
  }

  const replacedBaselineIds = getReplacedBaselineDrugIds(safeMeds, safeRecs);

  const effectiveActiveDrugs = new Set<string>();
  const activeDoseMap = new Map<string, string | undefined>();
  for (const baseId of baselineDrugs) {
    const baseMed = baselineMedMap.get(baseId);
    if (
      hasBlockedDrugOrFdcComponent(baseId, stoppedOrHeldIds, baseMed) ||
      replacedBaselineIds.has(baseId)
    ) {
      continue;
    }
    effectiveActiveDrugs.add(baseId);
  }

  for (const r of safeRecs) {
    if (!r.drugId) continue;
    const dId = r.drugId.trim().toLowerCase();
    if (!dId) continue;

    if (r.action === 'SWITCH' && replacedBaselineIds.has(dId)) {
      continue;
    }

    // Bỏ qua insulin_regular đường tĩnh mạch cấp cứu hạ kali máu
    if (resolveKbDrugId(dId) === 'insulin_regular' && r.id.toLowerCase().includes('hyperk')) {
      continue;
    }

    if (
      r.action === 'START' ||
      r.action === 'UPTITRATE' ||
      r.action === 'CONTINUE' ||
      r.action === 'SWITCH'
    ) {
      effectiveActiveDrugs.add(dId);
      if (r.dose) activeDoseMap.set(dId, r.dose);
    }
  }

  const hasAnchorMatch = (matchedIds: Iterable<string>, anchors?: string[]): boolean => {
    if (!anchors || anchors.length === 0) return true;
    for (const id of matchedIds) {
      const resolved = resolveKbDrugId(id);
      const cls = getExpandedDuplicateClasses(id).classes;
      const comps = expandDrugComponents(id);
      if (anchors.some((a) => id === a || resolved === a || cls.has(a) || comps.includes(a))) {
        return true;
      }
    }
    return false;
  };

  const hasAllRequiredClasses = (matchedIds: Iterable<string>, reqClasses?: string[]): boolean => {
    if (!reqClasses || reqClasses.length === 0) return true;
    const union = new Set<string>();
    for (const id of matchedIds) {
      for (const c of getExpandedDuplicateClasses(id).classes) union.add(c);
    }
    return reqClasses.every((rc) => union.has(rc));
  };

  for (const rule of DUPLICATE_CLASS_RULES) {
    const collectMatches = (drugSet: Set<string>): Map<string, string> => {
      const m = new Map<string, string>();
      for (const activeId of drugSet) {
        const resolved = resolveKbDrugId(activeId);
        if (
          rule.id === 'dup.nsaid' &&
          (resolved === 'aspirin' || resolved === 'acetylsalicylic_acid') &&
          isLowDoseCardioprotectiveAspirin(baselineMedMap.get(activeId), activeDoseMap.get(activeId))
        ) {
          continue;
        }
        const info = getExpandedDuplicateClasses(activeId);
        if (matchesDuplicateRule(activeId, info.classes, rule)) {
          m.set(activeId, info.label);
        }
      }
      if (m.size > 0 && !hasAnchorMatch(m.keys(), rule.requiresAnyOf)) {
        m.clear();
      }
      if (m.size > 0 && !hasAllRequiredClasses(m.keys(), rule.requiresAllClasses)) {
        m.clear();
      }
      return m;
    };

    const effectiveMatches = collectMatches(effectiveActiveDrugs);

    // Bảo toàn cảnh báo washout 36 giờ sống còn khi khởi trị/chuyển sang ARNI trên nền ACEi hoặc SPC chứa ACEi chưa bị STOP/HOLD
    if (effectiveMatches.size < 2 && rule.id === 'dup.rasi_arni') {
      const hasRecommendedArni = safeRecs.some(
        (r) =>
          (r.action === 'START' ||
            r.action === 'SWITCH' ||
            r.action === 'UPTITRATE' ||
            (r.action === 'HOLD' &&
              (r.gates?.some((g) => g.parameter === 'acei_arni_washout_36h') ||
                /washout/i.test(r.title)))) &&
          resolveKbDrugId(r.drugId) === 'sacubitril_valsartan'
      );
      if (hasRecommendedArni) {
        for (const baseId of baselineDrugs) {
          const baseMed = baselineMedMap.get(baseId);
          if (hasBlockedDrugOrFdcComponent(baseId, stoppedOrHeldIds, baseMed)) continue;
          const baseInfo = getExpandedDuplicateClasses(baseId);
          if (baseInfo.classes.has('acei')) {
            effectiveMatches.set(baseId, baseInfo.label);
            effectiveMatches.set(
              'sacubitril_valsartan',
              getExpandedDuplicateClasses('sacubitril_valsartan').label
            );
          }
        }
      }
    }

    // Asthma R2-17: Tuyệt đối KHÔNG fallback về `baselineDrugs` chứa thuốc đã bị STOP / HOLD!
    if (effectiveMatches.size >= 2) {
      const matchedIds = Array.from(effectiveMatches.keys());
      const matchedLabels = Array.from(effectiveMatches.values());
      alerts.push({
        id: rule.id,
        type: 'duplicate',
        severity: rule.severity,
        title: rule.titleVi,
        messageVi: `${rule.messageVi} (Phát hiện: ${matchedLabels.join(' + ')})`,
        drugIds: matchedIds,
        citationIds: rule.citationIds
      });
    }
  }

  return alerts;
}
