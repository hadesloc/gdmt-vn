import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  need,
  needCondition,
  hasCondition,
  missingInputRec,
  resetWarnedFieldsForTest,
  resetWarnedConditionsForTest
} from '../../src/engine/require';
import { mergeRecommendations } from '../../src/engine/merge';
import type { RuleContext, Recommendation } from '../../src/engine/types';

describe('Engine - Clinical Requirements & Fail-Closed Helper', () => {
  const dummyCtx: RuleContext = {
    patient: {
      age: 65,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { dm: true }
    },
    normalized: {
      age: 65,
      k: 4.8,
      sbp: 135,
      currentMeds: [],
      selectedModules: ['ckd'],
      conditions: { dm: true }
    },
    derived: {
      egfr: 42,
      bmi: 26.5
    },
    settings: {
      setting: 'outpatient',
      profile: 'INTL',
      units: {
        cr: 'umol_L',
        glucose: 'mmol_L',
        lipid: 'mmol_L',
        urat: 'umol_L',
        uacr: 'mg_mmol',
        hba1c: 'pct'
      },
      score2Region: 'high',
      fontScale: 'normal',
      theme: 'light',
      onlyReviewed: false
    }
  };

  beforeEach(() => {
    resetWarnedFieldsForTest();
    resetWarnedConditionsForTest();
  });

  it('correctly extracts present clinical fields via need()', () => {
    expect(need(dummyCtx, 'k')).toBe(4.8);
    expect(need(dummyCtx, 'egfr')).toBe(42);
    expect(need(dummyCtx, 'bmi')).toBe(26.5);
    expect(need(dummyCtx, 'sbp')).toBe(135);
    expect(need(dummyCtx, 'age')).toBe(65);
  });

  it('returns undefined for missing fields (never fallback to dangerous optimistic numbers)', () => {
    expect(need(dummyCtx, 'lvef')).toBeUndefined();
    expect(need(dummyCtx, 'uacr')).toBeUndefined();
    expect(need(dummyCtx, 'hba1c')).toBeUndefined();
    expect(need(dummyCtx, 'uricAcid')).toBeUndefined();
  });

  it('reads customInputs seamlessly with or without customInputs. prefix, even if top-level field is undefined', () => {
    const ctxWithCustom: RuleContext = {
      ...dummyCtx,
      patient: {
        ...dummyCtx.patient,
        mmrc: undefined,
        customInputs: {
          priorFlaresLifetime: 3,
          fev1FvcRatio: 0.62,
          mmrc: 2
        }
      },
      normalized: {
        ...dummyCtx.normalized,
        mmrc: undefined,
        customInputs: {
          priorFlaresLifetime: 3,
          fev1FvcRatio: 0.62,
          mmrc: 2
        }
      }
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(need(ctxWithCustom, 'customInputs.priorFlaresLifetime')).toBe(3);
    expect(need(ctxWithCustom, 'priorFlaresLifetime')).toBe(3);
    expect(need(ctxWithCustom, 'customInputs.fev1FvcRatio')).toBe(0.62);
    expect(need(ctxWithCustom, 'fev1FvcRatio')).toBe(0.62);
    expect(need(ctxWithCustom, 'mmrc')).toBe(2);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('deduplicates console.warn for unknown fields (warns at most once across repeated calls)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 50; i++) {
      need(dummyCtx, 'totally_unknown_field_xyz');
    }
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('correctly checks conditions and clinical synonyms via hasCondition() & needCondition()', () => {
    expect(needCondition(dummyCtx, 'dm')).toBe(true);
    expect(hasCondition(dummyCtx, 'diabetes')).toBe(true);
    expect(needCondition(dummyCtx, 'hf')).toBeUndefined();

    const synonymCtx: RuleContext = {
      ...dummyCtx,
      patient: {
        ...dummyCtx.patient,
        rhythm: 'afib',
        conditions: {
          pregnancy: true,
          cad: true,
          cirrhosis: true,
          stroke: true
        }
      },
      normalized: {
        ...dummyCtx.normalized,
        rhythm: 'afib',
        conditions: {
          pregnancy: true,
          cad: true,
          cirrhosis: true,
          stroke: true
        }
      }
    };

    // pregnant <-> pregnancy
    expect(hasCondition(synonymCtx, 'pregnant')).toBe(true);
    expect(hasCondition(synonymCtx, 'pregnancy')).toBe(true);

    // ascvd <-> vascularDisease <-> cad
    expect(hasCondition(synonymCtx, 'ascvd')).toBe(true);
    expect(hasCondition(synonymCtx, 'vascularDisease')).toBe(true);
    expect(hasCondition(synonymCtx, 'cad')).toBe(true);

    // liverDisease <-> cirrhosis
    expect(hasCondition(synonymCtx, 'liverDisease')).toBe(true);
    expect(hasCondition(synonymCtx, 'cirrhosis')).toBe(true);

    // strokeOrTia <-> stroke
    expect(hasCondition(synonymCtx, 'strokeOrTia')).toBe(true);

    // af <-> afib (via rhythm === 'afib')
    expect(hasCondition(synonymCtx, 'af')).toBe(true);
    expect(hasCondition(synonymCtx, 'afib')).toBe(true);
  });

  it('deduplicates console.warn for unknown condition keys (warns at most once)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 30; i++) {
      hasCondition(dummyCtx, 'unknown_cond_abc');
    }
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('generates a well-formed CONSIDER recommendation for missing input', () => {
    const rec = missingInputRec('ckd', 'k', 'chỉ định MRA và RASi', ['kdigo2024']);
    expect(rec.id).toBe('missing_input_k');
    expect(rec.action).toBe('CONSIDER');
    expect(rec.title).toContain('Kali máu (K⁺)');
    expect(rec.rationale).toContain('chỉ định MRA và RASi');
    expect(rec.citationIds).toContain('kdigo2024');
  });

  it('deduplicates missing input recommendations across multiple modules in mergeRecommendations()', () => {
    const rec1: Recommendation = missingInputRec('hf', 'k', 'chỉ định MRA (Spironolactone)');
    const rec2: Recommendation = missingInputRec('ckd', 'k', 'chỉ định Finerenone');

    const merged = mergeRecommendations([rec1, rec2]);
    expect(merged.length).toBe(1);
    expect(merged[0].id).toBe('missing_input_k');
    expect(merged[0].action).toBe('CONSIDER');
    expect(merged[0].rationale).toContain('chỉ định MRA (Spironolactone)');
    expect(merged[0].rationale).toContain('chỉ định Finerenone');
    expect(merged[0].benefitsAlso).toContain('ckd');
  });

  it('CKD-R2-R3-16: recognizes critical life-safety flags passed strictly as boolean true in customInputs when conditions omits them', () => {
    const customSafetyCtx: RuleContext = {
      ...dummyCtx,
      patient: {
        age: 34,
        currentMeds: [],
        selectedModules: ['ckd', 'dm2'],
        conditions: {},
        customInputs: {
          pregnant: true,
          onDialysis: true,
          priorAngioedema: true,
          frailty: true,
          limitedLifespan: true,
          plannedSurgery: true,
          dm: true // non-safety standard condition should NOT leak via customInputs fallback
        }
      },
      normalized: {
        age: 34,
        currentMeds: [],
        selectedModules: ['ckd', 'dm2'],
        conditions: {},
        customInputs: {
          pregnant: true,
          onDialysis: true,
          priorAngioedema: true,
          frailty: true,
          limitedLifespan: true,
          plannedSurgery: true,
          dm: true
        }
      }
    };

    expect(hasCondition(customSafetyCtx, 'pregnant')).toBe(true);
    expect(hasCondition(customSafetyCtx, 'pregnancy')).toBe(true);
    expect(needCondition(customSafetyCtx, 'pregnant')).toBe(true);
    expect(hasCondition(customSafetyCtx, 'onDialysis')).toBe(true);
    expect(hasCondition(customSafetyCtx, 'priorAngioedema')).toBe(true);
    expect(hasCondition(customSafetyCtx, 'frailty')).toBe(true);
    expect(hasCondition(customSafetyCtx, 'limitedLifespan')).toBe(true);
    expect(hasCondition(customSafetyCtx, 'plannedSurgery')).toBe(true);

    // Non-critical condition in customInputs must still require patient.conditions
    expect(hasCondition(customSafetyCtx, 'dm')).toBe(false);

    // Falsy or non-boolean values in customInputs must NOT activate life-safety flags
    const falsyCtx: RuleContext = {
      ...dummyCtx,
      patient: {
        age: 34,
        currentMeds: [],
        selectedModules: ['ckd'],
        conditions: {},
        customInputs: { pregnant: false, plannedSurgery: 0 }
      },
      normalized: {
        age: 34,
        currentMeds: [],
        selectedModules: ['ckd'],
        conditions: {},
        customInputs: { pregnant: false, plannedSurgery: 0 }
      }
    };
    expect(hasCondition(falsyCtx, 'pregnant')).toBe(false);
    expect(hasCondition(falsyCtx, 'plannedSurgery')).toBe(false);
  });

  it('CKD-R3-R3-08: localizes sex, age, weight, height, alt, ck, childPugh and strips conditions. prefix in missingInputRec()', () => {
    const sexRec = missingInputRec('ckd', 'sex', 'ước tính mức lọc cầu thận CKD-EPI 2021', ['kdigo2024']);
    expect(sexRec.title).toBe('Cần nhập giới tính để đánh giá');
    expect(sexRec.title.toLowerCase()).not.toContain('sex');
    expect(sexRec.rationale).toContain('giới tính');
    expect(sexRec.rationale.toLowerCase()).not.toContain('sex');

    const altRec = missingInputRec('lipid', 'altUlnTimes', 'an toàn gan trước khởi trị Statin');
    expect(altRec.title).toContain('Mức tăng men gan ALT');

    const condRec = missingInputRec('ckd', 'conditions.pregnant', 'loại trừ thai kỳ trước khi dùng RASi');
    expect(condRec.title).toContain('tình trạng mang thai');
    expect(condRec.title).not.toContain('conditions.');
  });
});
