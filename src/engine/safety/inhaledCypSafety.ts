/** Respiratory interaction policy; erythromycin is not reclassified as a strong systemic inhibitor. */
import type { Patient } from '../types';
import { getExpandedDrugIds, getNormalizedDrugClasses, resolveKbDrugId } from './drugClassify';

export const RESPIRATORY_CYP3A4_INHIBITOR_IDS = new Set([
  'ritonavir', 'nirmatrelvir_ritonavir', 'lopinavir_ritonavir', 'cobicistat',
  'itraconazole', 'ketoconazole', 'voriconazole', 'posaconazole',
  'clarithromycin', 'erythromycin', 'roxithromycin', 'telithromycin', 'nefazodone',
  'atazanavir', 'darunavir', 'indinavir', 'nelfinavir', 'saquinavir', 'paxlovid'
]);

const SENSITIVE_INHALED_COMPONENTS = new Set([
  'budesonide', 'fluticasone_propionate', 'fluticasone_furoate', 'mometasone',
  'ciclesonide', 'salmeterol', 'vilanterol'
]);

export function hasRespiratoryCyp3a4Inhibitor(patient: Patient): boolean {
  return patient.currentMeds.some((med) => {
    const raw = med.drugId.trim().toLowerCase().replace(/[+ /-]+/g, '_');
    return getExpandedDrugIds(raw).some((id) => RESPIRATORY_CYP3A4_INHIBITOR_IDS.has(id)) ||
      raw.split('_').some((id) => id === 'ritonavir' || id === 'cobicistat') ||
      getNormalizedDrugClasses(resolveKbDrugId(raw)).has('strong_cyp3a4_inhibitor');
  });
}

export function isCypSensitiveInhaler(drugId: string): boolean {
  return getExpandedDrugIds(drugId.trim().toLowerCase()).some((id) => SENSITIVE_INHALED_COMPONENTS.has(id));
}
