/**
 * GDMT-VN Engine - Recommendation Merger & Conflict Resolver (KB Data-Driven)
 * Phân quyền: Agent B
 */

import type { Recommendation, ModuleId, Patient, CurrentMed } from './types';
import { hasCondition } from './types';
import { resolveKbDrugId } from './safety/drugClassify';
import {
  hasBlockedDrugOrFdcComponent,
  isParenteralCurrentMed,
  isParenteralEmergencyRec
} from './routeGuard';
import {
  ACTION_PRIORITY,
  getEffectiveActionPriority,
  resolveActionConflict,
  formatCurrentMedDose,
  isAcuteOrEscalatedStart,
  resolveMedDisplayName,
  resolveRecDrugDisplayName,
  buildAceiArniWashoutNote,
  CLASS_CONFLICT_GROUPS,
  isDrugInConflictGroup,
  isSuperiorStepUp,
  type ClassConflictGroup
} from './mergeConflictGroups';
import { resolveClassConflicts } from './mergeClassResolver';

export {
  ACTION_PRIORITY,
  getEffectiveActionPriority,
  resolveActionConflict,
  CLASS_CONFLICT_GROUPS,
  isDrugInConflictGroup,
  type ClassConflictGroup
};

const NO_DOSE_ACTIONS = new Set<Recommendation['action']>(['STOP', 'AVOID', 'HOLD', 'DEFER']);

function sanitizeActionDose(rec: Recommendation): Recommendation {
  if (NO_DOSE_ACTIONS.has(rec.action) && rec.dose !== undefined) {
    return { ...rec, dose: undefined };
  }
  return rec;
}

export function mergeRecommendations(recs: Recommendation[], patient?: Patient): Recommendation[] {
  const currentMedIds = new Set<string>();
  const currentMedMap = new Map<string, CurrentMed>();
  if (Array.isArray(patient?.currentMeds)) {
    for (const m of patient.currentMeds) {
      if (m?.drugId) {
        const idLower = m.drugId.toLowerCase();
        currentMedIds.add(idLower);
        currentMedMap.set(idLower, m);
      }
    }
  }

  const findMatchingCurrentMedId = (drugId?: string): string | undefined => {
    const raw = (drugId || '').trim().toLowerCase();
    if (!raw) return undefined;
    if (currentMedIds.has(raw)) return raw;
    const canonical = resolveKbDrugId(raw);
    for (const cid of currentMedIds) {
      if (resolveKbDrugId(cid) === canonical) return cid;
    }
    return undefined;
  };

  const hardSafetyBlockedDrugs = new Set<string>();
  const allSafetyBlockedDrugs = new Set<string>();
  for (const r of recs) {
    if (r.drugId) {
      const idLower = r.drugId.toLowerCase();
      const canonical = resolveKbDrugId(idLower);
      if (r.action === 'STOP' || r.action === 'AVOID') {
        hardSafetyBlockedDrugs.add(idLower);
        hardSafetyBlockedDrugs.add(canonical);
        allSafetyBlockedDrugs.add(idLower);
        allSafetyBlockedDrugs.add(canonical);
      } else if (r.action === 'HOLD') {
        allSafetyBlockedDrugs.add(idLower);
        allSafetyBlockedDrugs.add(canonical);
      }
    }
  }

  const normalizedRecs: Recommendation[] = [];
  for (const rawRec of recs) {
    const r = sanitizeActionDose(rawRec);
    if (!r.drugId) {
      normalizedRecs.push(r);
      continue;
    }
    const matchedCurId = findMatchingCurrentMedId(r.drugId);
    if (matchedCurId && r.action === 'START') {
      const curMed = currentMedMap.get(matchedCurId);
      const curMedName = resolveMedDisplayName(curMed, matchedCurId);
      const curDoseFormatted = formatCurrentMedDose(curMed, matchedCurId);

      // Không gộp vào FDC đang bị chặn thành phần
      if (hasBlockedDrugOrFdcComponent(matchedCurId, allSafetyBlockedDrugs, curMed)) {
        normalizedRecs.push(r);
        continue;
      }

      // HF-R2-R3-10: Thuốc đường tĩnh mạch cấp cứu (vd: Furosemide IV, Labetalol IV) KHÔNG bị ghi đè thành CONTINUE của viên uống tại nhà
      if (isParenteralEmergencyRec(r) && !isParenteralCurrentMed(curMed)) {
        normalizedRecs.push({
          ...r,
          action: 'START',
          rationale: `${r.rationale} (Lưu ý: Phác đồ đường tĩnh mạch cấp tính tại viện thay thế/nâng bậc cho ${curMedName}${curDoseFormatted ? ` ${curDoseFormatted}` : ''} đường uống đang dùng tại nhà).`
        });
        continue;
      }

      if (isAcuteOrEscalatedStart(r, curMed)) {
        normalizedRecs.push({
          ...r,
          action: 'CONTINUE',
          drugNameVi: r.drugNameVi || curMedName,
          dose: r.dose,
          title: curDoseFormatted ? `${r.title} [Đang dùng nền: ${curDoseFormatted}]` : r.title,
          rationale: `Bệnh nhân đang có ${curMedName}${curDoseFormatted ? ` (${curDoseFormatted})` : ''} trong phác đồ nền; điều chỉnh/tăng cường theo liều chỉ định đợt này (${r.dose || 'theo chỉ định'}). ${r.rationale}`,
          priority: Math.max(r.priority, 95)
        });
      } else {
        const displayDose = curDoseFormatted || r.dose;
        normalizedRecs.push({
          ...r,
          action: 'CONTINUE',
          drugNameVi: r.drugNameVi || curMedName,
          dose: displayDose,
          title: `TIẾP TỤC DUY TRÌ ${r.drugNameVi || curMedName} [Liều hiện tại: ${displayDose || 'Đang dùng'}]`,
          rationale: `Bệnh nhân đang sử dụng ${curMedName}. Tiếp tục duy trì phác đồ theo mục tiêu điều trị (không khởi trị lại từ đầu). ${r.rationale}`
        });
      }
      continue;
    }
    normalizedRecs.push(r);
  }

  const mergedMap = new Map<string, Recommendation>();
  const mergedMissingInputsMap = new Map<string, Recommendation>();
  const otherNonDrugRecs: Recommendation[] = [];

  for (const rec of normalizedRecs) {
    if (!rec.drugId) {
      if (rec.id.startsWith('missing_input_')) {
        const existing = mergedMissingInputsMap.get(rec.id);
        if (!existing) {
          mergedMissingInputsMap.set(rec.id, {
            ...rec,
            citationIds: [...rec.citationIds],
            benefitsAlso: rec.benefitsAlso ? [...rec.benefitsAlso] : []
          });
        } else {
          const combinedCitationIds = Array.from(new Set([...existing.citationIds, ...rec.citationIds]));
          const combinedBenefits = new Set<ModuleId>(existing.benefitsAlso || []);
          if (rec.module !== existing.module) combinedBenefits.add(rec.module);
          if (rec.benefitsAlso) {
            for (const b of rec.benefitsAlso) combinedBenefits.add(b);
          }

          const extractReason = (rat: string) => {
            const parts = rat.split('đánh giá:');
            if (parts.length > 1) return parts[1].replace(/\.$/, '').trim();
            const parts2 = rat.split('để đánh giá');
            if (parts2.length > 1) return parts2[1].replace(/\.$/, '').trim();
            return rat;
          };
          const reason1 = extractReason(existing.rationale);
          const reason2 = extractReason(rec.rationale);
          const reasons = Array.from(new Set([reason1, reason2].filter(Boolean)));
          const baseField = existing.title.replace('Cần nhập ', '').replace(' để đánh giá', '');

          mergedMissingInputsMap.set(rec.id, {
            ...existing,
            rationale: `Chưa có thông số ${baseField}. Cần nhập liệu để đánh giá: ${reasons.join(' · ')}.`,
            citationIds: combinedCitationIds,
            benefitsAlso: Array.from(combinedBenefits)
          });
        }
      } else {
        otherNonDrugRecs.push(rec);
      }
      continue;
    }

    const baseKey = resolveKbDrugId(rec.drugId) || rec.drugId.toLowerCase();
    const key = isParenteralEmergencyRec(rec) ? `${baseKey}::iv` : baseKey;
    const existing = mergedMap.get(key);

    if (!existing) {
      mergedMap.set(key, {
        ...rec,
        dose: NO_DOSE_ACTIONS.has(rec.action) ? undefined : rec.dose,
        benefitsAlso: rec.benefitsAlso ? [...rec.benefitsAlso] : [],
        citationIds: [...rec.citationIds],
        gates: [...rec.gates],
        warnings: rec.warnings ? [...rec.warnings] : []
      });
      continue;
    }

    const isInCur = Boolean(findMatchingCurrentMedId(rec.drugId));
    const resolvedAction = resolveActionConflict(existing.action, rec.action, isInCur);
    const pRec = getEffectiveActionPriority(rec.action, isInCur);
    const pEx = getEffectiveActionPriority(existing.action, isInCur);
    const recWins = pRec > pEx;

    const primary = recWins ? rec : existing;
    const secondary = recWins ? existing : rec;

    const benefitsAlsoSet = new Set<ModuleId>(primary.benefitsAlso || []);
    if (secondary.module !== primary.module) {
      benefitsAlsoSet.add(secondary.module);
    }
    if (secondary.benefitsAlso) {
      for (const m of secondary.benefitsAlso) {
        if (m !== primary.module) benefitsAlsoSet.add(m);
      }
    }

    const citationSet = new Set<string>([...existing.citationIds, ...rec.citationIds]);
    const mergedGates = [...primary.gates];
    for (const g of secondary.gates) {
      if (!mergedGates.some((eg) => eg.parameter === g.parameter && eg.passed === g.passed)) {
        mergedGates.push(g);
      }
    }

    const warningSet = new Set<string>([...(existing.warnings || []), ...(rec.warnings || [])]);

    let chosenRationale: string;
    const isPrimaryHardStop = NO_DOSE_ACTIONS.has(primary.action);
    const shouldMergeStopRationale =
      secondary.action === 'SWITCH' ||
      (primary.action === 'STOP' && (secondary.action === 'AVOID' || secondary.action === 'STOP'));
    if (isPrimaryHardStop && shouldMergeStopRationale && secondary.rationale) {
      chosenRationale = primary.rationale.includes(secondary.rationale)
        ? primary.rationale
        : `${primary.rationale} (${secondary.rationale})`;
    } else if (isPrimaryHardStop) {
      chosenRationale = primary.rationale;
    } else {
      chosenRationale =
        secondary.module !== primary.module
          ? `${primary.rationale} (Đồng thời được chỉ định trong ${secondary.module.toUpperCase()})`
          : primary.rationale;
    }

    const resolvedDose = NO_DOSE_ACTIONS.has(resolvedAction)
      ? undefined
      : primary.dose || secondary.dose;

    mergedMap.set(key, {
      ...primary,
      action: resolvedAction,
      title: primary.title,
      rationale: chosenRationale,
      dose: resolvedDose,
      benefitsAlso: Array.from(benefitsAlsoSet),
      citationIds: Array.from(citationSet),
      gates: mergedGates,
      warnings: Array.from(warningSet),
      priority: Math.max(existing.priority, rec.priority)
    });
  }

  const initialMerged = [
    ...Array.from(mergedMap.values()),
    ...Array.from(mergedMissingInputsMap.values()),
    ...otherNonDrugRecs
  ];

  const resolvedClassRecs = resolveClassConflicts(
    initialMerged,
    patient,
    currentMedIds,
    currentMedMap,
    allSafetyBlockedDrugs
  );

  const hasHfForPillar = Boolean(
    (patient?.lvef !== undefined && patient.lvef < 50) ||
    (patient && hasCondition({ normalized: patient }, 'hf') && (patient.lvef === undefined || patient.lvef < 50))
  );

  const byDrugAfterResolve = new Map<string, number>();
  for (let i = 0; i < resolvedClassRecs.length; i++) {
    const dId = resolvedClassRecs[i].drugId?.toLowerCase();
    if (dId && !isParenteralEmergencyRec(resolvedClassRecs[i])) {
      byDrugAfterResolve.set(dId, i);
      byDrugAfterResolve.set(resolveKbDrugId(dId), i);
    }
  }

  const extraSwitchRecs: Recommendation[] = [];

  for (const r of resolvedClassRecs) {
    if (!r.drugId || r.action !== 'START') continue;
    // R2-R1-HTN-03: Không sinh thẻ SWITCH ngoại trú cho thuốc truyền tĩnh mạch cấp cứu nội viện
    if (isParenteralEmergencyRec(r) && !['methylprednisolone', 'hydrocortisone', 'dexamethasone'].includes(resolveKbDrugId(r.drugId))) {
      continue;
    }

    const newDrugLower = r.drugId.toLowerCase();
    const newDrugCanonical = resolveKbDrugId(newDrugLower);
    const newDrugName = resolveRecDrugDisplayName(r);

    for (const group of Object.values(CLASS_CONFLICT_GROUPS)) {
      if (!isDrugInConflictGroup(newDrugLower, group)) continue;

      for (const curId of currentMedIds) {
        if (
          curId === newDrugLower ||
          resolveKbDrugId(curId) === newDrugCanonical ||
          !isDrugInConflictGroup(curId, group)
        ) {
          continue;
        }

        const oldMed = currentMedMap.get(curId);
        if (group.id !== 'systemic_steroid' && isParenteralCurrentMed(oldMed)) {
          continue;
        }

        const oldName = resolveMedDisplayName(oldMed, curId);
        const washoutNote =
          group.id === 'rasi_arni' ? buildAceiArniWashoutNote(curId, newDrugCanonical) : '';

        const existingOldIdx =
          byDrugAfterResolve.get(curId) ?? byDrugAfterResolve.get(resolveKbDrugId(curId));
        if (existingOldIdx !== undefined) {
          const existingOld = resolvedClassRecs[existingOldIdx];
          if (
            existingOld.action === 'STOP' ||
            existingOld.action === 'AVOID' ||
            existingOld.action === 'HOLD' ||
            hardSafetyBlockedDrugs.has(curId)
          ) {
            const appendNote = `Thuốc thay thế cùng nhóm (${group.nameVi}): ${newDrugName}.${washoutNote}`;
            if (!existingOld.rationale.includes(newDrugName)) {
              resolvedClassRecs[existingOldIdx] = {
                ...existingOld,
                dose: undefined,
                rationale: `${existingOld.rationale} (${appendNote})`,
                citationIds: Array.from(new Set([...existingOld.citationIds, ...r.citationIds]))
              };
            }
            continue;
          }
          if (
            existingOld.id.startsWith('med_review_') &&
            existingOld.action === 'REDUCE' &&
            isSuperiorStepUp(group.id, curId, r, oldMed, hasHfForPillar)
          ) {
            resolvedClassRecs[existingOldIdx] = {
              ...existingOld,
              id: `switch_old_${curId}_for_${newDrugLower}`,
              module: r.module,
              tier: 'Chuyển đổi phác đồ',
              tierOrder: 1,
              action: 'SWITCH',
              drugId: oldMed?.drugId || curId,
              drugNameVi: oldName,
              dose: undefined,
              title: `CHUYỂN ĐỔI: Ngừng ${oldName} để thay bằng ${newDrugName}`,
              rationale: `Khuyến cáo chỉ định ${newDrugName}. Bắt buộc ngừng hoặc thay thế thuốc cũ ${oldName} (cùng nhóm loại trừ ${group.nameVi}).${washoutNote}`,
              citationIds: Array.from(new Set([...existingOld.citationIds, ...r.citationIds])),
              priority: 92
            };
          }
          continue;
        }

        const isCurBlocked = hasBlockedDrugOrFdcComponent(curId, allSafetyBlockedDrugs, oldMed);
        if (!isCurBlocked && !isSuperiorStepUp(group.id, curId, r, oldMed, hasHfForPillar)) {
          continue;
        }

        if (!extraSwitchRecs.some((sw) => sw.drugId?.toLowerCase() === curId)) {
          extraSwitchRecs.push({
            id: `switch_old_${curId}_for_${newDrugLower}`,
            module: r.module,
            tier: 'Chuyển đổi phác đồ',
            tierOrder: 1,
            action: 'SWITCH',
            drugId: oldMed?.drugId || curId,
            drugNameVi: oldName,
            dose: undefined,
            title: `CHUYỂN ĐỔI: Ngừng ${oldName} để thay bằng ${newDrugName}`,
            rationale: `Khuyến cáo chỉ định ${newDrugName}. Bắt buộc ngừng hoặc thay thế thuốc cũ ${oldName} (cùng nhóm loại trừ ${group.nameVi}).${washoutNote}`,
            gates: [],
            citationIds: [...r.citationIds],
            priority: 92
          });
        }
      }
    }
  }

  const finalRecs = [...resolvedClassRecs, ...extraSwitchRecs].map(sanitizeActionDose);
  // An executable, explicit replacement must not coexist with another module's
  // instruction to continue/escalate the old ingredient. Retain all safety stops.
  const explicitReplacements = new Set(finalRecs
    .filter((r) => r.action === 'SWITCH' && r.drugId && r.switchFrom &&
      resolveKbDrugId(r.drugId) !== resolveKbDrugId(r.switchFrom))
    .map((r) => resolveKbDrugId(r.switchFrom!)));
  return sortRecommendations(finalRecs.filter((r) => !r.drugId ||
    !explicitReplacements.has(resolveKbDrugId(r.drugId)) ||
    !['START', 'CONTINUE', 'UPTITRATE', 'REDUCE'].includes(r.action)));
}

export function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort((a, b) => {
    const prioA = ACTION_PRIORITY[a.action] || 0;
    const prioB = ACTION_PRIORITY[b.action] || 0;

    const isCriticalA = prioA >= 80;
    const isCriticalB = prioB >= 80;
    if (isCriticalA && !isCriticalB) return -1;
    if (!isCriticalA && isCriticalB) return 1;

    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return prioB - prioA;
  });
}
