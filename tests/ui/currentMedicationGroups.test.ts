import { describe, expect, it } from 'vitest';
import { getMedicationGroups } from '../../src/ui/currentMedicationGroups';
import { hasDrug } from '../../src/kb-types';

const groupsFor = (module: Parameters<typeof getMedicationGroups>[0][number]) => getMedicationGroups([module]);
const idsIn = (groups: ReturnType<typeof getMedicationGroups>, groupId: string) =>
  groups.find((group) => group.id === groupId)?.drugIds ?? [];

describe('phân nhóm thuốc đang dùng theo bệnh', () => {
  it('giữ nguyên các hàng thuốc suy tim đã tuyển chọn và thứ tự', () => {
    const groups = groupsFor('hf');
    expect(groups.slice(0, 4).map(({ id }) => id)).toEqual(['sglt2i', 'mra', 'acei_arb_arni', 'beta_blockers']);
    expect(idsIn(groups, 'sglt2i')).toEqual(['dapagliflozin', 'empagliflozin']);
    expect(idsIn(groups, 'mra')).toEqual(['spironolactone', 'eplerenone', 'finerenone']);
    expect(idsIn(groups, 'acei_arb_arni')).toEqual(['sacubitril_valsartan', 'captopril', 'enalapril', 'lisinopril', 'candesartan', 'losartan', 'valsartan']);
    expect(idsIn(groups, 'beta_blockers')).toEqual(['bisoprolol', 'carvedilol', 'metoprolol_succinate', 'nebivolol']);
  });

  it('phân nhóm cụ thể cho từng module và chỉ trả thuốc có trong KB', () => {
    const expectations = [
      { module: 'dm2' as const, groups: ['dm2_insulin_basal', 'dm2_insulin_meal', 'dm2_insulin_premix', 'dm2_glp1_gip', 'dm2_sglt2', 'dm2_dpp4', 'dm2_biguanide', 'dm2_sulfonylurea', 'dm2_tzd', 'dm2_alpha_glucosidase'], samples: ['insulin_glargine', 'insulin_aspart', 'insulin_premix', 'tirzepatide', 'dapagliflozin', 'sitagliptin', 'metformin', 'gliclazide', 'pioglitazone', 'acarbose'] },
      { module: 'htn' as const, groups: ['htn_rasi', 'htn_beta_blocker', 'htn_ccb', 'htn_diuretics', 'htn_mra', 'htn_other'], samples: ['perindopril', 'bisoprolol', 'amlodipine', 'indapamide', 'clonidine', 'spironolactone'] },
      { module: 'ckd' as const, groups: ['ckd_rasi', 'ckd_sglt2', 'ckd_ns_mra', 'ckd_k_binders', 'ckd_acidosis'], samples: ['losartan', 'empagliflozin', 'finerenone', 'patiromer', 'sodium_bicarbonate'] },
      { module: 'asthma' as const, groups: ['asthma_relievers', 'asthma_adjuvants', 'asthma_triple', 'asthma_ics_laba', 'asthma_ics', 'asthma_lama', 'asthma_other_controllers', 'asthma_biologics', 'asthma_systemic_steroids'], samples: ['salbutamol', 'magnesium_sulfate', 'budesonide_glycopyrronium_formoterol', 'budesonide_formoterol', 'budesonide', 'tiotropium', 'montelukast', 'omalizumab', 'prednisolone'] },
      { module: 'copd' as const, groups: ['copd_triple', 'copd_lama_laba', 'copd_ics_laba', 'copd_lama', 'copd_laba', 'copd_ics', 'copd_relievers', 'copd_systemic_steroids', 'copd_macrolides', 'copd_biologics', 'copd_other'], samples: ['fluticasone_furoate_umeclidinium_vilanterol', 'umeclidinium_vilanterol', 'fluticasone_salmeterol', 'tiotropium', 'salmeterol', 'fluticasone_propionate', 'salbutamol', 'roflumilast', 'prednisolone', 'azithromycin', 'dupilumab'] },
      { module: 'gout' as const, groups: ['gout_urate_lowering', 'gout_flare_prophylaxis', 'gout_steroids'], samples: ['allopurinol', 'colchicine', 'prednisolone'] },
      { module: 'lipid' as const, groups: ['lipid_statin', 'lipid_ezetimibe', 'lipid_pcsk9', 'lipid_other'], samples: ['atorvastatin', 'ezetimibe', 'evolocumab', 'fenofibrate'] },
      { module: 'af' as const, groups: ['af_doac', 'af_vka', 'af_rate_beta', 'af_rate_ccb', 'af_rate_digoxin', 'af_rhythm'], samples: ['apixaban', 'warfarin', 'bisoprolol', 'diltiazem', 'digoxin', 'amiodarone'] },
    ];

    for (const { module, groups: expectedGroups, samples } of expectations) {
      const groups = groupsFor(module);
      const ids = groups.flatMap((group) => group.drugIds);
      expect(groups.map(({ id }) => id)).toEqual(expect.arrayContaining(expectedGroups));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => hasDrug(id))).toBe(true);
      for (const sample of samples) expect(ids).toContain(sample);
    }

    expect(idsIn(groupsFor('asthma'), 'asthma_lama_laba')).toContain('umeclidinium_vilanterol');
    expect(idsIn(groupsFor('asthma'), 'asthma_lama')).not.toContain('umeclidinium_vilanterol');
    expect(groupsFor('copd').flatMap((group) => group.drugIds)).not.toContain('fluticasone_umeclidinium_vilanterol');
    expect(idsIn(groupsFor('asthma'), 'asthma_triple')).toContain('budesonide_glycopyrronium_formoterol');
    expect(idsIn(groupsFor('asthma'), 'asthma_ics_laba')).toContain('budesonide_formoterol');
    expect(idsIn(groupsFor('copd'), 'copd_lama_laba')).toContain('umeclidinium_vilanterol');
    expect(idsIn(groupsFor('copd'), 'copd_ics_laba')).toContain('fluticasone_salmeterol');
    expect(idsIn(groupsFor('htn'), 'htn_diuretics')).toEqual(expect.arrayContaining(['indapamide', 'chlorthalidone', 'torsemide']));
    expect(idsIn(groupsFor('htn'), 'htn_mra')).toEqual(expect.arrayContaining(['spironolactone', 'eplerenone', 'finerenone']));
    expect(idsIn(groupsFor('asthma'), 'asthma_relievers')).toContain('salbutamol');
    expect(idsIn(groupsFor('asthma'), 'asthma_relievers')).not.toContain('magnesium_sulfate');
    expect(idsIn(groupsFor('asthma'), 'asthma_adjuvants')).toContain('magnesium_sulfate');
    expect(idsIn(groupsFor('copd'), 'copd_systemic_steroids')).toContain('prednisolone');
    expect(idsIn(groupsFor('copd'), 'copd_macrolides')).toContain('azithromycin');
    expect(idsIn(groupsFor('copd'), 'copd_biologics')).toContain('dupilumab');
    expect(idsIn(groupsFor('gout'), 'gout_steroids')).toContain('prednisolone');
    const dm2Order = groupsFor('dm2').map(({ id }) => id);
    expect(dm2Order.indexOf('dm2_biguanide')).toBeLessThan(dm2Order.indexOf('dm2_insulin_basal'));
    expect(dm2Order.indexOf('dm2_sglt2')).toBeLessThan(dm2Order.indexOf('dm2_insulin_basal'));
    expect(dm2Order.indexOf('dm2_glp1_gip')).toBeLessThan(dm2Order.indexOf('dm2_insulin_basal'));
    expect(dm2Order.indexOf('dm2_dpp4')).toBeLessThan(dm2Order.indexOf('dm2_insulin_basal'));
  });

  it('giữ thuốc riêng còn lại khi các module đã chọn có thuốc trùng nhau', () => {
    expect(idsIn(groupsFor('ckd'), 'ckd_diuretics')).toContain('furosemide');
    const groups = getMedicationGroups(['hf', 'ckd', 'dm2', 'af', 'htn']);
    const ids = groups.flatMap((group) => group.drugIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('dapagliflozin');
    expect(ids).toContain('finerenone');
    expect(ids).toContain('metformin');
    expect(ids).toContain('apixaban');
    expect(ids).toContain('amlodipine');
    expect(groups.every((group) => group.drugIds.length > 0)).toBe(true);
  });
});
