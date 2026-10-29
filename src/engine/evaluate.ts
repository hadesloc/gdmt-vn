/**
 * GDMT-VN Core Evaluation Pipeline
 * Phân quyền: Agent B
 */

import type {
  Patient,
  Settings,
  Derived,
  Plan,
  PlanSummary,
  Recommendation,
  RuleContext,
  ModuleDefinition,
  ModuleInputField,
  Action,
  SafetyAlert
} from './types';
import { normalizePatientUnits } from './units';
import { derivePatientData } from './derive';
import { registerValidFields } from './require';
import { evaluateSafetyGates, resolveKbDrugId } from './safety/gates';
import { checkDuplicates, getReplacedBaselineDrugIds } from './safety/duplicates';
import { checkInteractions } from './safety/interactions';
import { reviewCurrentMedications, checkEmergencyRedFlags } from './safety/reviewMeds';
import { mergeRecommendations, sortRecommendations } from './merge';
import { generateClinicalNote } from './note';
import { getActiveModules, getAllModules } from '../modules/registry';

export interface EvaluateOptions {
  modules?: ModuleDefinition[];
}

export function evaluate(
  rawPatient: Patient,
  settings: Settings,
  options?: EvaluateOptions
): Plan {
  // 1. Thu thập schema trường nhập liệu (unitKey) & chuẩn hóa đơn vị về SI
  const safeSelected = Array.isArray(rawPatient.selectedModules) ? rawPatient.selectedModules : [];
  const activeModules = options?.modules || getActiveModules(safeSelected);
  const allModulesForUnits = [...getAllModules(true), ...activeModules];
  const allInputFields: ModuleInputField[] = [];
  for (const mod of allModulesForUnits) {
    if (mod.inputs?.groups) {
      for (const grp of mod.inputs.groups) {
        allInputFields.push(...grp.fields);
      }
    }
  }
  const normalized = normalizePatientUnits(rawPatient, settings.units, allInputFields);

  // 2. Tính toán các chỉ số phái sinh
  const derived: Derived = derivePatientData(normalized, settings);

  // 3. Khởi tạo context cho các luật
  const ctx: RuleContext = {
    patient: normalized,
    normalized,
    derived,
    settings
  };

  // 4. Kích hoạt các luật từ các module được chọn
  for (const mod of activeModules) {
    if (mod.inputs?.groups) {
      for (const grp of mod.inputs.groups) {
        registerValidFields(grp.fields.map((f) => f.id));
      }
    }
  }
  const rawRecs: Recommendation[] = [];

  for (const mod of activeModules) {
    const isSelected = normalized.selectedModules.includes(mod.id);
    if (!isSelected) continue;

    for (const rule of mod.rules) {
      try {
        if (rule.setting && rule.setting !== 'both' && rule.setting !== settings.setting) {
          continue;
        }
        const allowedProfiles = Array.isArray(rule.profiles)
          ? rule.profiles
          : ['INTL', 'VN', 'US'];
        if (!allowedProfiles.includes(settings.profile)) {
          continue;
        }
        if (rule.when(ctx)) {
          const produced = rule.produce(ctx);
          if (produced) {
            rawRecs.push(produced);
          }
        }
      } catch (err) {
        console.error(`Lỗi thực thi luật ${rule.id}:`, err);
      }
    }
  }

  // 4b. Rà soát an toàn thuốc đang dùng (Medication Safety Review) + khử xung đột với SWITCH
  const replacedByModuleSwitch = getReplacedBaselineDrugIds(normalized.currentMeds, rawRecs);
  const medReviewRecs = reviewCurrentMedications(normalized, derived, settings, rawRecs);
  for (const medRec of medReviewRecs) {
    const medDrugLower = medRec.drugId?.trim().toLowerCase();
    const medDrugCanonical = medDrugLower ? resolveKbDrugId(medDrugLower) : undefined;

    // CKD-R3-R2-06: Không phát thẻ [REDUCE] rà liều (vd: Simvastatin <= 20 mg) khi module đã phát lệnh [SWITCH] thay thế thuốc đó
    if (
      medDrugLower &&
      medRec.action === 'REDUCE' &&
      (replacedByModuleSwitch.has(medDrugLower) ||
        (medDrugCanonical !== undefined && replacedByModuleSwitch.has(medDrugCanonical)))
    ) {
      continue;
    }

    // Khử trùng lặp thẻ STOP / HOLD / REDUCE của medReview nếu module đã sinh sẵn khuyến cáo cùng thuốc & mức chặn tương đương/cao hơn
    if (
      medDrugCanonical &&
      (medRec.action === 'STOP' || medRec.action === 'HOLD' || medRec.action === 'REDUCE')
    ) {
      const existingSameOrStronger = rawRecs.find((r) => {
        if (!r.drugId || resolveKbDrugId(r.drugId) !== medDrugCanonical) return false;
        if (medRec.action === 'STOP') return r.action === 'STOP';
        if (medRec.action === 'HOLD') return r.action === 'STOP' || r.action === 'HOLD' || r.action === 'AVOID';
        if (medRec.action === 'REDUCE') return r.action === 'STOP' || r.action === 'HOLD' || r.action === 'REDUCE';
        return false;
      });
      if (existingSameOrStronger) {
        existingSameOrStronger.citationIds = Array.from(
          new Set([...existingSameOrStronger.citationIds, ...medRec.citationIds])
        );
        continue;
      }
    }

    rawRecs.push(medRec);
  }

  // 4c. Quét Red Flags cấp cứu nguy kịch (phân biệt ngôn ngữ Nội viện vs Ngoại trú & tránh trùng lặp)
  const redFlags = checkEmergencyRedFlags(normalized, derived, settings, rawRecs);
  rawRecs.push(...redFlags);

  // 5. Kiểm tra cổng an toàn cho từng khuyến cáo (truyền kèm settings để nhận diện Cấp cứu Ngoại trú)
  const gatedRecs: Recommendation[] = [];
  for (const rec of rawRecs) {
    const { updatedRec } = evaluateSafetyGates(rec, normalized, derived, settings);
    gatedRecs.push(updatedRec);
  }

  // 6. Gộp thuốc đa bệnh và giải quyết xung đột cùng nhóm
  const mergedRecs = mergeRecommendations(gatedRecs, normalized);
  const postMergeReplacedIds = getReplacedBaselineDrugIds(normalized.currentMeds, mergedRecs);
  const cleanedMergedRecs = mergedRecs.filter((r) => {
    if (r.id.startsWith('med_review_') && r.action === 'REDUCE' && r.drugId) {
      const dLower = r.drugId.trim().toLowerCase();
      if (postMergeReplacedIds.has(dLower) || postMergeReplacedIds.has(resolveKbDrugId(dLower))) {
        return false;
      }
    }
    return true;
  });
  const sortedRecs = sortRecommendations(cleanedMergedRecs);

  // 7. Kiểm tra trùng lặp nhóm và tương tác chéo
  const duplicateAlerts = checkDuplicates(normalized.currentMeds, sortedRecs);
  const interactionAlerts = checkInteractions(normalized, derived, sortedRecs);
  const allAlerts: SafetyAlert[] = [...duplicateAlerts, ...interactionAlerts];

  // 8. Thống kê tóm tắt
  const byAction: Record<Action, number> = {
    START: 0,
    UPTITRATE: 0,
    CONTINUE: 0,
    REDUCE: 0,
    SWITCH: 0,
    HOLD: 0,
    STOP: 0,
    AVOID: 0,
    CONSIDER: 0,
    DEFER: 0,
    MONITOR: 0,
    REFER: 0
  };

  for (const r of sortedRecs) {
    if (byAction[r.action] !== undefined) {
      byAction[r.action]++;
    }
  }

  const summary: PlanSummary = {
    total: sortedRecs.length,
    byAction,
    activeModules: normalized.selectedModules
  };

  // 9. Sinh ghi chú bệnh án
  const interimPlan: Plan = {
    recommendations: sortedRecs,
    alerts: allAlerts,
    summary,
    noteText: ''
  };

  interimPlan.noteText = generateClinicalNote(normalized, derived, interimPlan, settings);

  return interimPlan;
}
