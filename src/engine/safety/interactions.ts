/**
 * GDMT-VN Safety - Drug-Drug & Drug-Disease Interactions Checker (KB Data-Driven)
 * Phân quyền: Agent B
 *
 * Sử dụng trực tiếp `getAllInteractions()` từ `@/kb-types` kết hợp tập luật lâm sàng bổ trợ,
 * phân rã viên phối hợp FDC và bộ phân tích liều hàng ngày fail-closed (`doseParser`).
 */

import type { Patient, Derived, Recommendation, SafetyAlert } from '../types';
import { hasCondition } from '../types';
import {
  getAllInteractions,
  getAllDrugs,
  hasDrug,
  drug,
  type InteractionRule as KbInteractionRule,
  type InteractionTarget
} from '../../kb-types';
import { parseDailyDoseMg, parseComponentDailyDoseMg } from '../doseParser';
import { expandDrugComponents } from './fdcMap';
import {
  getNormalizedDrugClasses,
  getExpandedDrugIds,
  resolveKbDrugId,
  isGlp1OrGipDrug,
  hasMtcOrMen2History,
  hasAerdCondition,
  isCox1NsaidOrSalicylate,
  isOphthalmicBetaBlocker
} from './gates';
import { getReplacedBaselineDrugIds } from './duplicates';
import {
  INTERACTION_RULES,
  type EngineInteractionRule,
  type InteractionRule
} from './engineInteractionRules';

export { INTERACTION_RULES, type EngineInteractionRule, type InteractionRule };

export const KB_INTERACTION_RULES: KbInteractionRule[] = getAllInteractions();

const KB_CLASS_MEMBER_MAP: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const d of getAllDrugs()) {
    const id = d.id.toLowerCase();
    for (const cls of getNormalizedDrugClasses(id)) {
      if (!map.has(cls)) map.set(cls, new Set());
      map.get(cls)!.add(id);
    }
  }
  return map;
})();

function isClassWideTarget(cls: string, explicitDrugIds: Set<string>): boolean {
  if (explicitDrugIds.size === 0) return true;
  const kbMembers = KB_CLASS_MEMBER_MAP.get(cls);
  if (!kbMembers || kbMembers.size === 0) return true;
  let covered = 0;
  for (const m of kbMembers) {
    if (explicitDrugIds.has(m)) covered++;
  }
  return covered / kbMembers.size >= 0.6;
}

const ORAL_MED_CACHE = new Map<string, boolean>();

function isOralMedication(drugId: string): boolean {
  const id = drugId.toLowerCase();
  const cached = ORAL_MED_CACHE.get(id);
  if (cached !== undefined) return cached;

  let res = true;
  if (['patiromer', 'sodium_zirconium_cyclosilicate', 'calcium_polystyrene_sulfonate'].includes(id)) {
    res = false;
  } else if (hasDrug(id)) {
    const d = drug(id);
    const startObj = typeof d.start === 'object' && d.start ? d.start : undefined;
    if (startObj?.route) {
      const r = startObj.route.toLowerCase();
      if (r.includes('hít') || r.includes('tiêm')) {
        ORAL_MED_CACHE.set(id, false);
        return false;
      }
      if (r.includes('uống')) {
        ORAL_MED_CACHE.set(id, true);
        return true;
      }
    }
    const formsJoined = (d.forms || []).join(' ').toLowerCase();
    if (formsJoined.includes('viên') || formsJoined.includes('gói') || formsJoined.includes('hỗn dịch uống')) {
      ORAL_MED_CACHE.set(id, true);
      return true;
    }
    if (formsJoined.includes('bình hít') || formsJoined.includes('bút tiêm') || formsJoined.includes('ống tiêm')) {
      ORAL_MED_CACHE.set(id, false);
      return false;
    }
  } else if (id.startsWith('insulin_')) {
    res = false;
  }
  ORAL_MED_CACHE.set(id, res);
  return res;
}

interface CompiledTarget {
  targetIds: Set<string>;
  targetClasses: Set<string>;
  wideDrugClasses: string[];
  nsaidClassWide: boolean;
}

const COMPILED_TARGET_CACHE = new WeakMap<InteractionTarget, CompiledTarget>();

function getCompiledTarget(target: InteractionTarget): CompiledTarget {
  let c = COMPILED_TARGET_CACHE.get(target);
  if (c) return c;
  const targetIds = new Set((target.drugIds || []).map((d) => d.toLowerCase()));
  const targetClasses = new Set((target.classes || []).map((cl) => cl.toLowerCase()));
  const wideDrugClasses: string[] = [];
  for (const tc of targetClasses) {
    if (
      tc !== 'hfref_condition' &&
      tc !== 'asthma_condition' &&
      tc !== 'iodinated_contrast' &&
      tc !== 'oral_medication' &&
      isClassWideTarget(tc, targetIds)
    ) {
      wideDrugClasses.push(tc);
    }
  }
  c = {
    targetIds,
    targetClasses,
    wideDrugClasses,
    nsaidClassWide: targetClasses.has('nsaid') && isClassWideTarget('nsaid', targetIds)
  };
  COMPILED_TARGET_CACHE.set(target, c);
  return c;
}

function matchTarget(
  target: InteractionTarget,
  activeDrugIds: Set<string>,
  patient: Patient
): string[] {
  const matched = new Set<string>();
  const { targetIds, targetClasses, wideDrugClasses, nsaidClassWide } = getCompiledTarget(target);

  if (targetClasses.has('hfref_condition')) {
    const isHfRef =
      (patient.lvef !== undefined && patient.lvef <= 40) ||
      (hasCondition({ normalized: patient, patient }, 'hf') &&
        (patient.lvef === undefined || patient.lvef <= 40));
    if (isHfRef) matched.add('hfref_condition');
  }
  if (targetClasses.has('asthma_condition')) {
    if (hasCondition({ normalized: patient, patient }, 'asthma')) {
      matched.add('asthma_condition');
    }
  }
  if (targetClasses.has('iodinated_contrast')) {
    if (Boolean(patient.customInputs?.iodinatedContrast || patient.customInputs?.contrastPlanned)) {
      matched.add('iodinated_contrast');
    }
  }
  if (targetClasses.has('oral_medication')) {
    for (const activeId of activeDrugIds) {
      if (isOralMedication(activeId)) {
        matched.add(activeId);
      }
    }
  }

  for (const activeId of activeDrugIds) {
    const expanded = getExpandedDrugIds(activeId);
    if (targetIds.size > 0 && expanded.some((id) => targetIds.has(id))) {
      matched.add(activeId);
      continue;
    }
    if (wideDrugClasses.length > 0) {
      const classes = getNormalizedDrugClasses(activeId);
      for (const tc of wideDrugClasses) {
        if (classes.has(tc)) {
          matched.add(activeId);
          break;
        }
      }
    }
  }

  if (matched.size === 0) {
    if (nsaidClassWide && Boolean(patient.customInputs?.takingNsaid)) {
      matched.add('nsaid');
    }
    if (targetIds.has('azathioprine') && Boolean(patient.customInputs?.takingAzathioprine)) {
      matched.add('azathioprine');
    }
  }

  return Array.from(matched);
}

function mapKbSeverity(
  sev: KbInteractionRule['severity'],
  doseExceeded: boolean
): SafetyAlert['severity'] {
  if (doseExceeded) return 'critical';
  if (sev === 'contraindicated' || sev === 'major') return 'critical';
  return 'warning';
}

export function checkInteractions(
  patient: Patient,
  derived: Derived,
  recommendations: Recommendation[]
): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const emittedIds = new Set<string>();
  const effectiveDrugIds = new Set<string>();
  const baselineDrugIds = new Set<string>();
  const washoutDrugIds = new Set<string>();
  const activeDoseMap = new Map<string, number>();
  const currentMeds = Array.isArray(patient.currentMeds) ? patient.currentMeds : [];

  const stoppedOrHeldIds = new Set<string>();
  for (const r of recommendations) {
    if (r.drugId && (r.action === 'STOP' || r.action === 'HOLD')) {
      const dLower = r.drugId.trim().toLowerCase();
      stoppedOrHeldIds.add(dLower);
      stoppedOrHeldIds.add(resolveKbDrugId(dLower));
      if (
        r.action === 'HOLD' &&
        r.gates?.some((g) => g.parameter === 'acei_arni_washout_36h' && !g.passed)
      ) {
        washoutDrugIds.add(resolveKbDrugId(dLower));
      }
    }
  }
  const replacedBaselineIds = getReplacedBaselineDrugIds(currentMeds, recommendations);

  for (const m of currentMeds) {
    if (!m?.drugId) continue;
    const rawId = m.drugId.trim().toLowerCase();
    if (!rawId) continue;
    const isOphthalmicBb = isOphthalmicBetaBlocker(`${m.drugId} ${m.name || ''}`, m.route);
    const id = isOphthalmicBb && rawId === 'timolol' ? 'timolol_ophthalmic' : rawId;
    baselineDrugIds.add(id);
    if (!isOphthalmicBb && getNormalizedDrugClasses(id).has('acei')) {
      washoutDrugIds.add(id);
    }

    const isExcluded =
      stoppedOrHeldIds.has(id) ||
      stoppedOrHeldIds.has(resolveKbDrugId(id)) ||
      replacedBaselineIds.has(id);

    if (!isExcluded) {
      effectiveDrugIds.add(id);
      const dailyMg = parseDailyDoseMg(m);
      if (dailyMg !== undefined) {
        activeDoseMap.set(id, dailyMg);
        activeDoseMap.set(resolveKbDrugId(id), dailyMg);
      }
      for (const comp of expandDrugComponents(id)) {
        const compMg = parseComponentDailyDoseMg(m, comp);
        if (compMg !== undefined) activeDoseMap.set(comp, compMg);
      }
    }
  }

  for (const r of recommendations) {
    const isOldSwitchDiscontinue =
      r.action === 'SWITCH' &&
      (r.id.startsWith('switch_old_') ||
        (r.drugId &&
          (baselineDrugIds.has(r.drugId.toLowerCase()) ||
            replacedBaselineIds.has(r.drugId.toLowerCase()))));
    if (isOldSwitchDiscontinue) continue;

    const isInteractionRelevantAction =
      r.action === 'START' ||
      r.action === 'UPTITRATE' ||
      r.action === 'CONTINUE' ||
      r.action === 'CONSIDER' ||
      r.action === 'SWITCH' ||
      (r.action === 'AVOID' &&
        Boolean(
          r.gates?.some(
            (g) =>
              g.parameter === 'PDE5i_Nitrate_SGC' ||
              g.parameter === 'CYP3A4_contra' ||
              g.parameter === 'ivabradine_ndhp_ccb_contra'
          )
        ));
    if (r.drugId && isInteractionRelevantAction) {
      const id = r.drugId.trim().toLowerCase();
      if (!id || stoppedOrHeldIds.has(id) || stoppedOrHeldIds.has(resolveKbDrugId(id))) continue;
      effectiveDrugIds.add(id);
      if (r.dose) {
        const dNum = parseDailyDoseMg({ drugId: id, dose: r.dose });
        if (dNum !== undefined) {
          activeDoseMap.set(id, dNum);
          activeDoseMap.set(resolveKbDrugId(id), dNum);
        }
      }
    }
  }

  // CKD-R3-R2-03 & CKD-R3-R3-04: FDA Boxed Warning khi có tiền sử MTC / MEN 2 và có mặt GLP-1 / GIP-GLP-1 RA
  if (hasMtcOrMen2History(patient)) {
    const glp1Detected = new Set<string>();
    for (const bId of baselineDrugIds) {
      if (isGlp1OrGipDrug(bId)) glp1Detected.add(bId);
    }
    for (const r of recommendations) {
      if (r.drugId && isGlp1OrGipDrug(r.drugId)) {
        glp1Detected.add(r.drugId.trim().toLowerCase());
      }
    }
    if (glp1Detected.size > 0) {
      alerts.push({
        id: 'alert.glp1_boxed_mtc_men2',
        type: 'contraindication',
        severity: 'critical',
        title:
          'Cảnh báo hộp đen (FDA Boxed Warning): Chống chỉ định tuyệt đối GLP-1 / GIP-GLP-1 RA ở tiền sử MTC / MEN 2',
        messageVi: `Bệnh nhân có tiền sử bản thân hoặc gia đình mắc ung thư tuyến giáp thể tủy (MTC) hoặc hội chứng đa u tuyến nội tiết típ 2 (MEN 2). Chống chỉ định tuyệt đối khởi trị hoặc duy trì nhóm đồng vận thụ thể GLP-1 / GIP-GLP-1 (Phát hiện: ${Array.from(glp1Detected).join(', ')}).`,
        drugIds: Array.from(glp1Detected),
        citationIds: ['fda.semaglutide.boxed_warning_mtc']
      });
      emittedIds.add('alert.glp1_boxed_mtc_men2');
    }
  }

  // ASTHMA-R3-R3-02: Cảnh báo critical khi phát hiện NSAID ức chế COX-1 hoặc Aspirin trên bệnh nhân AERD
  if (hasAerdCondition(patient)) {
    const aerdNsaids = new Set<string>();
    for (const bId of baselineDrugIds) {
      if (isCox1NsaidOrSalicylate(bId)) aerdNsaids.add(bId);
    }
    for (const r of recommendations) {
      if (r.drugId && isCox1NsaidOrSalicylate(r.drugId)) {
        aerdNsaids.add(r.drugId.trim().toLowerCase());
      }
    }
    if (aerdNsaids.size > 0) {
      alerts.push({
        id: 'alert.aerd_nsaid_contra',
        type: 'contraindication',
        severity: 'critical',
        title: 'Chống chỉ định tuyệt đối Aspirin & NSAID ức chế COX-1 ở bệnh nhân AERD (Tam chứng Samter)',
        messageVi: `Bệnh nhân mắc bệnh hô hấp kịch phát do aspirin/NSAID (AERD): Chống chỉ định tuyệt đối aspirin và các thuốc kháng viêm không steroid ức chế COX-1 do nguy cơ khởi phát co thắt phế quản cấp đe dọa tính mạng (Phát hiện: ${Array.from(aerdNsaids).join(', ')}).`,
        drugIds: Array.from(aerdNsaids),
        citationIds: ['gina.asthma.2026.aerd_avoid_nsaid']
      });
      emittedIds.add('alert.aerd_nsaid_contra');
    }
  }

  const effectivePatient: Patient = {
    ...patient,
    currentMeds: currentMeds.filter((m) => {
      if (!m?.drugId) return true;
      const idLower = m.drugId.trim().toLowerCase();
      return (
        !stoppedOrHeldIds.has(idLower) &&
        !stoppedOrHeldIds.has(resolveKbDrugId(idLower)) &&
        !replacedBaselineIds.has(idLower)
      );
    })
  };

  const kbRules = KB_INTERACTION_RULES;

  const evaluateKbRuleOnSet = (
    kbRule: KbInteractionRule,
    drugSet: Set<string>,
    pt: Patient
  ): { isMatched: boolean; triggeredDrugs: string[] } => {
    if (kbRule.a && kbRule.b) {
      let mA = matchTarget(kbRule.a, drugSet, pt);
      if (kbRule.id === 'ix.potassium_binder_drug_binding') {
        mA = mA.filter((id) => id !== 'sodium_zirconium_cyclosilicate');
      }
      if (mA.length === 0) return { isMatched: false, triggeredDrugs: [] };
      const mB = matchTarget(kbRule.b, drugSet, pt);
      if (mA.length > 0 && mB.length > 0) {
        const distinct = Array.from(new Set([...mA, ...mB]));
        if (distinct.length >= 2) {
          return {
            isMatched: true,
            triggeredDrugs: distinct.filter(
              (x) => !['hfref_condition', 'asthma_condition', 'iodinated_contrast'].includes(x)
            )
          };
        }
      }
    } else if (kbRule.members && kbRule.members.length > 0) {
      if (kbRule.minCount !== undefined && kbRule.members.length === 1) {
        const mAll = matchTarget(kbRule.members[0], drugSet, pt);
        if (mAll.length >= kbRule.minCount) {
          return { isMatched: true, triggeredDrugs: mAll };
        }
      } else {
        const requiredGroups = kbRule.minCount ?? kbRule.members.length;
        let matchedGroupCount = 0;
        const collected = new Set<string>();
        for (const memberTarget of kbRule.members) {
          const m = matchTarget(memberTarget, drugSet, pt);
          if (m.length > 0) {
            matchedGroupCount++;
            for (const d of m) collected.add(d);
          }
        }
        if (matchedGroupCount >= requiredGroups && collected.size >= requiredGroups) {
          return { isMatched: true, triggeredDrugs: Array.from(collected) };
        }
      }
    }
    return { isMatched: false, triggeredDrugs: [] };
  };

  // 1. Đánh giá tập luật tương tác KB (`kb/interactions/*.json`)
  for (const kbRule of kbRules) {
    let { isMatched, triggeredDrugs } = evaluateKbRuleOnSet(kbRule, effectiveDrugIds, effectivePatient);

    if (!isMatched && kbRule.severity === 'contraindicated' && baselineDrugIds.size >= 1) {
      const baseRes = evaluateKbRuleOnSet(kbRule, baselineDrugIds, patient);
      if (baseRes.isMatched) {
        isMatched = true;
        triggeredDrugs = baseRes.triggeredDrugs;
      }
    }

    if (!isMatched && kbRule.id === 'ix.acei_arni_washout' && washoutDrugIds.size >= 2) {
      const washRes = evaluateKbRuleOnSet(kbRule, washoutDrugIds, patient);
      if (washRes.isMatched) {
        isMatched = true;
        triggeredDrugs = washRes.triggeredDrugs;
      }
    }

    if (!isMatched) continue;

    let doseExceeded = false;
    let doseLimitNote = '';
    if (kbRule.doseLimit) {
      const limitDrug = kbRule.doseLimit.drugId.toLowerCase();
      const actualDose = activeDoseMap.get(limitDrug);
      if (actualDose !== undefined && actualDose > kbRule.doseLimit.maxDose) {
        doseExceeded = true;
        doseLimitNote = ` [CẢNH BÁO QUÁ LIỀU TRẦN: Liều ${limitDrug} hiện tại ${actualDose} ${kbRule.doseLimit.unit} vượt mức tối đa cho phép ${kbRule.doseLimit.maxDose} ${kbRule.doseLimit.unit}]`;
      } else {
        doseLimitNote = ` [Giới hạn liều tối đa ${limitDrug}: ≤ ${kbRule.doseLimit.maxDose} ${kbRule.doseLimit.unit}${kbRule.doseLimit.frequency ? ` ${kbRule.doseLimit.frequency}` : ''}]`;
      }
    }

    const isDrugDiseaseRule =
      kbRule.id === 'ix.ccb_non_dhp_hfref' || kbRule.id === 'ix.bb_non_selective_asthma';

    alerts.push({
      id: kbRule.id,
      type: isDrugDiseaseRule ? 'contraindication' : 'interaction',
      title: kbRule.titleVi,
      messageVi: `${kbRule.mechanismVi} ${kbRule.effectVi} Xử trí: ${kbRule.managementVi}${doseLimitNote} (Phát hiện: ${triggeredDrugs.join(', ')})`,
      severity: mapKbSeverity(kbRule.severity, doseExceeded),
      drugIds: triggeredDrugs,
      citationIds: kbRule.citationIds
    });
    emittedIds.add(kbRule.id);
  }

  // 2. Đánh giá tập luật bổ trợ Engine (bỏ qua nếu đã phát bởi KB)
  for (const rule of INTERACTION_RULES) {
    if (emittedIds.has(rule.id)) continue;

    const matchedA = Array.from(effectiveDrugIds).filter((id) => {
      const expanded = getExpandedDrugIds(id);
      if (rule.drugA.some((d) => expanded.includes(d.toLowerCase()))) return true;
      if (rule.classesA) {
        const cls = getNormalizedDrugClasses(id);
        return rule.classesA.some((c) => cls.has(c));
      }
      return false;
    });
    if (matchedA.length === 0) continue;

    if (rule.drugB || rule.classesB) {
      const matchedB = Array.from(effectiveDrugIds).filter((id) => {
        if (matchedA.includes(id) && matchedA.length === 1) return false;
        const expanded = getExpandedDrugIds(id);
        if (rule.drugB?.some((d) => expanded.includes(d.toLowerCase()))) return true;
        if (rule.classesB) {
          const cls = getNormalizedDrugClasses(id);
          return rule.classesB.some((c) => cls.has(c));
        }
        return false;
      });
      if (matchedB.length > 0) {
        if (!rule.condition || rule.condition(effectivePatient, derived)) {
          const combined = Array.from(new Set([...matchedA, ...matchedB]));
          alerts.push({
            id: rule.id,
            type: 'interaction',
            title: rule.titleVi,
            messageVi: `${rule.messageVi} (Phát hiện: ${matchedA.join(', ')} + ${matchedB.join(', ')})`,
            severity: rule.severity,
            drugIds: combined,
            citationIds: rule.citationIds
          });
        }
      }
    } else if (rule.condition && rule.condition(effectivePatient, derived)) {
      alerts.push({
        id: rule.id,
        type: 'contraindication',
        title: rule.titleVi,
        messageVi: `${rule.messageVi} (Phát hiện: ${matchedA.join(', ')})`,
        severity: rule.severity,
        drugIds: matchedA,
        citationIds: rule.citationIds
      });
    }
  }

  return alerts;
}
