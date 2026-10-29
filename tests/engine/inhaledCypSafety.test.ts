import { describe, expect, it } from 'vitest';
import { evaluateSafetyGates } from '../../src/engine/safety/gates';
import { derivePatientData } from '../../src/engine/derive';
import { STRONG_CYP3A4_INHIBITOR_IDS } from '../../src/engine/safety/drugClassify';
import { hasRespiratoryCyp3a4Inhibitor } from '../../src/engine/safety/inhaledCypSafety';
import type { Patient, Recommendation, Settings } from '../../src/engine/types';

const settings: Settings = {
  setting: 'outpatient', profile: 'INTL', units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false,
};
const p: Patient = { id: 'cyp-engine', age: 45, sex: 'female', weight: 60, sbp: 125, hr: 75,
  scr: 70, k: 4.2, selectedModules: ['asthma'], conditions: { asthma: true }, currentMeds: [{ drugId: 'paxlovid' }] };

function candidate(drugId: string): Recommendation {
  return { id: `candidate_${drugId}`, module: 'asthma', action: 'START', drugId,
    tier: 'Controller', tierOrder: 1, priority: 90, title: drugId, rationale: 'candidate', dose: 'test-dose', gates: [],
    citationIds: ['gina.asthma.2026.cyp3a4_ics_laba_interaction'] };
}

describe('Cổng CYP3A4 cho thuốc hít và thành phần phối hợp', () => {
  it.each(['fluticasone_propionate', 'fluticasone_furoate', 'salmeterol', 'vilanterol', 'mometasone',
    'seretide', 'symbicort', 'trelegy'])('chặn cả thuốc mới/alias %s', (id) => {
    const result = evaluateSafetyGates(candidate(id), p, derivePatientData(p, settings), settings);
    expect(result.updatedRec.gates.some((g) => g.parameter === 'inhaled_cyp3a4' && !g.passed)).toBe(true);
    expect(result.updatedRec.action).toBe('AVOID');
    expect(result.updatedRec.dose).toBeUndefined();
  });
  it.each(['beclometasone', 'beclometasone_formoterol', 'beclometasone_glycopyrronium_formoterol'])('không áp cổng tương tác này cho %s', (id) => {
    const result = evaluateSafetyGates(candidate(id), p, derivePatientData(p, settings), settings);
    expect(result.updatedRec.gates.some((g) => g.parameter === 'inhaled_cyp3a4')).toBe(false);
  });
  it('erythromycin được nhận diện cho hô hấp mà không bị đổi thành strong inhibitor toàn thân', () => {
    expect(hasRespiratoryCyp3a4Inhibitor({ ...p, currentMeds: [{ drugId: 'erythromycin' }] })).toBe(true);
    expect(STRONG_CYP3A4_INHIBITOR_IDS.has('erythromycin')).toBe(false);
  });
  it('không chặn nếu không có thuốc gây tương tác', () => {
    const normal = { ...p, currentMeds: [{ drugId: 'amoxicillin' }] };
    const result = evaluateSafetyGates(candidate('fluticasone_salmeterol'), normal, derivePatientData(normal, settings), settings);
    expect(result.updatedRec.gates.some((g) => g.parameter === 'inhaled_cyp3a4')).toBe(false);
  });
  it('dị ứng sữa: Trimbow pMDI không bị nhận nhầm lactose từ glycopyrronium DPI đơn chất', () => {
    const allergic = { ...p, conditions: { asthma: true, severeMilkProteinAllergy: true } };
    const rec = { ...candidate('beclometasone_glycopyrronium_formoterol'), dose: 'Trimbow pMDI qua buồng đệm' };
    const result = evaluateSafetyGates(rec, allergic, derivePatientData(allergic, settings), settings);
    expect(result.updatedRec.gates.some((g) => g.parameter === 'severe_milk_protein_allergy' && !g.passed)).toBe(false);
    expect(result.updatedRec.citationIds).toContain('ema.trimbow.pmdi_excipients');
  });
  it('vẫn chặn Glycopyrronium DPI chứa lactose và không áp ngoại lệ cho Trimbow chưa rõ thiết bị', () => {
    const allergic = { ...p, conditions: { asthma: true, severeMilkProteinAllergy: true } };
    for (const id of ['glycopyrronium', 'beclometasone_glycopyrronium_formoterol']) {
      const result = evaluateSafetyGates(candidate(id), allergic, derivePatientData(allergic, settings), settings);
      expect(result.updatedRec.gates.some((g) => g.parameter === 'severe_milk_protein_allergy' && !g.passed)).toBe(true);
    }
  });
});
