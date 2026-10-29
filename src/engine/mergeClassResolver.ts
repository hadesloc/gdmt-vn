/**
 * GDMT-VN Engine - Therapeutic Class Conflict Resolver
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
  formatCurrentMedDose,
  resolveMedDisplayName,
  resolveRecDrugDisplayName,
  buildAceiArniWashoutNote,
  CLASS_CONFLICT_GROUPS,
  normalizeConflictDrugId,
  isDrugInConflictGroup,
  getInhalerComponentCount,
  isGlp1Drug,
  isSteroidalMraDrug,
  isDedicatedIvSteroidRec,
  isSuperiorStepUp,
  pickPreferredCurrentMedId,
  isClassWideSafetyDefer
} from './mergeConflictGroups';

export function resolveClassConflicts(
  recs: Recommendation[],
  patient: Patient | undefined,
  currentMedIds: Set<string>,
  currentMedMap: Map<string, CurrentMed>,
  blockedCurrentMedIds: Set<string>
): Recommendation[] {
  const working: Recommendation[] = recs.map((r) => ({
    ...r,
    benefitsAlso: r.benefitsAlso ? [...r.benefitsAlso] : [],
    citationIds: [...r.citationIds],
    gates: [...r.gates],
    warnings: r.warnings ? [...r.warnings] : undefined
  }));

  const removedIndices = new Set<number>();

  const hasHfForPillar = Boolean(
    (patient?.lvef !== undefined && patient.lvef < 50) ||
    (patient && hasCondition({ normalized: patient }, 'hf') && (patient.lvef === undefined || patient.lvef < 50))
  );

  const isDrugInActiveCurrentMeds = (drugId?: string): string | undefined => {
    const raw = (drugId || '').trim().toLowerCase();
    if (!raw) return undefined;
    if (currentMedIds.has(raw)) return raw;
    const canonical = normalizeConflictDrugId(raw);
    for (const cid of currentMedIds) {
      if (normalizeConflictDrugId(cid) === canonical) return cid;
    }
    return undefined;
  };

  // Mở rộng tập thuốc nền / thành phần FDC đã bị STOP / AVOID / HOLD / SWITCH
  const effectiveBlockedCurIds = new Set<string>(blockedCurrentMedIds);
  for (const bId of blockedCurrentMedIds) {
    effectiveBlockedCurIds.add(resolveKbDrugId(bId));
    effectiveBlockedCurIds.add(normalizeConflictDrugId(bId));
  }
  for (const r of working) {
    if (
      r.action === 'STOP' ||
      r.action === 'AVOID' ||
      r.action === 'HOLD' ||
      r.action === 'SWITCH'
    ) {
      if (r.drugId) {
        const lower = r.drugId.trim().toLowerCase();
        effectiveBlockedCurIds.add(lower);
        effectiveBlockedCurIds.add(resolveKbDrugId(lower));
        effectiveBlockedCurIds.add(normalizeConflictDrugId(lower));
      }
      if (typeof r.switchFrom === 'string' && r.switchFrom.trim()) {
        const swLower = r.switchFrom.trim().toLowerCase();
        effectiveBlockedCurIds.add(swLower);
        effectiveBlockedCurIds.add(resolveKbDrugId(swLower));
        effectiveBlockedCurIds.add(normalizeConflictDrugId(swLower));
      }
    }
  }

  for (const group of Object.values(CLASS_CONFLICT_GROUPS)) {
    const protectParenteralRoute = group.id !== 'systemic_steroid';

    const classDeferIndices: number[] = [];
    for (let i = 0; i < working.length; i++) {
      if (removedIndices.has(i)) continue;
      const r = working[i];
      if (r.drugId && isDrugInConflictGroup(r.drugId, group) && isClassWideSafetyDefer(r)) {
        classDeferIndices.push(i);
      }
    }

    if (classDeferIndices.length > 0) {
      const deferAnchorIdx = classDeferIndices[0];
      const deferAnchor = working[deferAnchorIdx];
      const deferBenefits = new Set<ModuleId>(deferAnchor.benefitsAlso || []);
      const deferCitations = new Set<string>(deferAnchor.citationIds);

      for (let i = 0; i < working.length; i++) {
        if (i === deferAnchorIdx || removedIndices.has(i)) continue;
        const r = working[i];
        if (!r.drugId || !isDrugInConflictGroup(r.drugId, group)) continue;
        if (protectParenteralRoute && isParenteralEmergencyRec(r)) continue;
        if (
          (r.action === 'START' || r.action === 'UPTITRATE' || isClassWideSafetyDefer(r)) &&
          !isDrugInActiveCurrentMeds(r.drugId)
        ) {
          if (r.module !== deferAnchor.module) deferBenefits.add(r.module);
          for (const b of r.benefitsAlso || []) {
            if (b !== deferAnchor.module) deferBenefits.add(b);
          }
          for (const cid of r.citationIds) deferCitations.add(cid);
          removedIndices.add(i);
        }
      }

      working[deferAnchorIdx] = {
        ...deferAnchor,
        dose: undefined,
        benefitsAlso: Array.from(deferBenefits),
        citationIds: Array.from(deferCitations)
      };
      continue;
    }

    const matchingIndices: number[] = [];
    for (let i = 0; i < working.length; i++) {
      if (removedIndices.has(i)) continue;
      const r = working[i];
      if (!r.drugId || !isDrugInConflictGroup(r.drugId, group)) continue;
      if (
        r.action !== 'START' &&
        r.action !== 'UPTITRATE' &&
        r.action !== 'CONTINUE'
      ) {
        continue;
      }
      // R2-R1-HTN-03: Bảo vệ tuyệt đối thuốc truyền/tiêm tĩnh mạch cấp cứu nội viện khỏi bị gộp vào viên uống cùng nhóm
      if (protectParenteralRoute && isParenteralEmergencyRec(r)) {
        continue;
      }
      matchingIndices.push(i);
    }

    if (matchingIndices.length === 0) continue;

    // Loại trừ thuốc nền nếu bản thân nó hoặc BẤT KỲ thành phần FDC nào của nó bị chặn an toàn, hoặc khác đường dùng tiêm cấp cứu
    const unblockedCurIds = Array.from(currentMedIds).filter((id) => {
      const med = currentMedMap.get(id);
      if (protectParenteralRoute && isParenteralCurrentMed(med)) return false;
      if (
        hasBlockedDrugOrFdcComponent(id, effectiveBlockedCurIds, med) ||
        effectiveBlockedCurIds.has(normalizeConflictDrugId(id))
      ) {
        return false;
      }
      return isDrugInConflictGroup(id, group);
    });

    if (unblockedCurIds.length > 0) {
      const preferredCurId = pickPreferredCurrentMedId(group.id, unblockedCurIds, hasHfForPillar);
      const preferredCurMed = currentMedMap.get(preferredCurId);
      const hasSuperiorCandidate = matchingIndices.some(
        (idx) =>
          (working[idx].action === 'START' || working[idx].action === 'UPTITRATE') &&
          isSuperiorStepUp(group.id, preferredCurId, working[idx], preferredCurMed, hasHfForPillar)
      );

      if (!hasSuperiorCandidate) {
        const mergedBenefits = new Set<ModuleId>();
        const mergedCitations = new Set<string>();
        for (const idx of matchingIndices) {
          mergedBenefits.add(working[idx].module);
          for (const b of working[idx].benefitsAlso || []) mergedBenefits.add(b);
          for (const cid of working[idx].citationIds) mergedCitations.add(cid);
        }

        const curRecIdx = matchingIndices.find(
          (idx) =>
            working[idx].drugId?.toLowerCase() === preferredCurId ||
            resolveKbDrugId(working[idx].drugId) === resolveKbDrugId(preferredCurId)
        );

        if (curRecIdx !== undefined) {
          const curWinner = working[curRecIdx];
          mergedBenefits.delete(curWinner.module);
          working[curRecIdx] = {
            ...curWinner,
            benefitsAlso: Array.from(mergedBenefits),
            citationIds: Array.from(mergedCitations)
          };
          for (const idx of matchingIndices) {
            if (idx === curRecIdx) continue;
            if (!isDrugInActiveCurrentMeds(working[idx].drugId)) {
              removedIndices.add(idx);
            }
          }
          continue;
        } else {
          const anchorIdx = matchingIndices[0];
          const anchor = working[anchorIdx];
          const curMedName = resolveMedDisplayName(preferredCurMed, preferredCurId);
          const curDose = formatCurrentMedDose(preferredCurMed, preferredCurId);
          mergedBenefits.delete(anchor.module);
          working[anchorIdx] = {
            ...anchor,
            action: 'CONTINUE',
            drugId: preferredCurMed?.drugId || preferredCurId,
            drugNameVi: curMedName,
            dose: curDose || undefined,
            title: `TIẾP TỤC DUY TRÌ ${curMedName}${curDose ? ` [Liều hiện tại: ${curDose}]` : ' [Đang dùng]'}`,
            rationale: `Bệnh nhân đang sử dụng ${curMedName} (cùng nhóm ${group.nameVi}); tiếp tục duy trì phác đồ hiện tại thay vì khởi trị trùng lặp ${resolveRecDrugDisplayName(anchor)}. ${anchor.rationale}`,
            benefitsAlso: Array.from(mergedBenefits),
            citationIds: Array.from(mergedCitations)
          };
          for (let k = 1; k < matchingIndices.length; k++) {
            removedIndices.add(matchingIndices[k]);
          }
          continue;
        }
      }
    }

    if (matchingIndices.length <= 1) {
      continue;
    }

    let winnerIndex = matchingIndices[0];

    const pickByPriority = (indices: number[]): number => {
      const sorted = [...indices].sort((ia, ib) => working[ib].priority - working[ia].priority);
      return sorted[0];
    };

    if (group.id === 'rasi_arni') {
      const arniMatch = matchingIndices.find(
        (i) => resolveKbDrugId(working[i].drugId) === 'sacubitril_valsartan'
      );
      winnerIndex = hasHfForPillar && arniMatch !== undefined ? arniMatch : pickByPriority(matchingIndices);
    } else if (group.id === 'mra') {
      const steroidalMatch = matchingIndices.find((i) => isSteroidalMraDrug(working[i].drugId || ''));
      if (hasHfForPillar && steroidalMatch !== undefined) {
        winnerIndex = steroidalMatch;
      } else {
        const finerenoneMatch = matchingIndices.find(
          (i) => resolveKbDrugId(working[i].drugId) === 'finerenone'
        );
        winnerIndex = finerenoneMatch !== undefined ? finerenoneMatch : pickByPriority(matchingIndices);
      }
    } else if (group.id === 'incretins') {
      const glp1Match = matchingIndices.find((i) => isGlp1Drug(working[i].drugId || ''));
      winnerIndex = glp1Match !== undefined ? glp1Match : pickByPriority(matchingIndices);
    } else if (group.id === 'systemic_steroid') {
      const ivMatch = matchingIndices.find((i) => isDedicatedIvSteroidRec(working[i]));
      winnerIndex = ivMatch !== undefined ? ivMatch : pickByPriority(matchingIndices);
    } else if (group.id.startsWith('inhaler_')) {
      const sortedInhalers = [...matchingIndices].sort((ia, ib) => {
        const compDiff =
          getInhalerComponentCount(working[ib].drugId || '') -
          getInhalerComponentCount(working[ia].drugId || '');
        if (compDiff !== 0) return compDiff;
        return working[ib].priority - working[ia].priority;
      });
      winnerIndex = sortedInhalers[0];
    } else {
      winnerIndex = pickByPriority(matchingIndices);
    }

    const winner = working[winnerIndex];
    const winnerName = resolveRecDrugDisplayName(winner);
    const winnerDrugId = resolveKbDrugId(winner.drugId);
    const winnerBenefits = new Set<ModuleId>(winner.benefitsAlso || []);
    const winnerCitations = new Set<string>(winner.citationIds);

    for (const i of matchingIndices) {
      if (i === winnerIndex) continue;
      const loser = working[i];
      const loserRawId = (loser.drugId || '').toLowerCase();
      const loserCanonicalId = resolveKbDrugId(loserRawId);
      const matchedCurId = isDrugInActiveCurrentMeds(loserRawId);

      if (loser.module !== winner.module) {
        winnerBenefits.add(loser.module);
      }
      if (loser.benefitsAlso) {
        for (const b of loser.benefitsAlso) {
          if (b !== winner.module) winnerBenefits.add(b);
        }
      }
      for (const cid of loser.citationIds) {
        winnerCitations.add(cid);
      }

      if (matchedCurId && winner.action === 'START') {
        const oldMed = currentMedMap.get(matchedCurId);
        const oldName = resolveMedDisplayName(oldMed, matchedCurId);
        const washoutNote =
          group.id === 'rasi_arni' ? buildAceiArniWashoutNote(matchedCurId, winnerDrugId) : '';
        working[i] = {
          ...loser,
          module: winner.module,
          tier: 'Chuyển đổi phác đồ',
          tierOrder: 1,
          action: 'SWITCH',
          drugId: oldMed?.drugId || matchedCurId,
          drugNameVi: oldName,
          dose: undefined,
          title: `CHUYỂN ĐỔI: Ngừng ${oldName} để thay bằng ${winnerName}`,
          rationale: `Khuyến cáo chỉ định ${winnerName}. Bắt buộc ngừng hoặc thay thế thuốc cũ ${oldName} (cùng nhóm loại trừ ${group.nameVi}).${washoutNote}`,
          citationIds: Array.from(new Set([...loser.citationIds, ...winner.citationIds])),
          priority: 92
        };
      } else if (
        hasHfForPillar &&
        winner.action === 'START' &&
        loser.action === 'START' &&
        ((group.id === 'rasi_arni' && winnerDrugId === 'sacubitril_valsartan') ||
          (group.id === 'mra' && isSteroidalMraDrug(winnerDrugId) && loserCanonicalId === 'finerenone'))
      ) {
        const reasonVi =
          group.id === 'rasi_arni'
            ? `Đã ưu tiên ${winnerName} (trụ cột bảo vệ tim - thận; chống chỉ định phối hợp đồng thời ACEi/ARB + ARNI)`
            : `Đã thay bằng ${winnerName} (ưu tiên giảm tử vong tim mạch trong suy tim HFrEF; chống chỉ định phối hợp đồng thời 2 thuốc MRA do nguy cơ tăng kali máu ác tính)`;
        working[i] = {
          ...loser,
          action: 'AVOID',
          dose: undefined,
          title: `CHỐNG CHỈ ĐỊNH PHỐI HỢP: ${resolveRecDrugDisplayName(loser)}`,
          rationale: reasonVi,
          priority: 85
        };
      } else {
        removedIndices.add(i);
      }
    }

    working[winnerIndex] = {
      ...winner,
      benefitsAlso: Array.from(winnerBenefits),
      citationIds: Array.from(winnerCitations)
    };
  }

  return working.filter((_, idx) => !removedIndices.has(idx));
}
