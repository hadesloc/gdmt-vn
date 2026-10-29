import { describe, it, expect } from 'vitest';
import { mergeRecommendations, resolveActionConflict } from '../../src/engine/merge';
import type { Recommendation } from '../../src/engine/types';

describe('Engine - Recommendation Merge & Conflict Resolution', () => {
  it('correctly resolves action conflicts with safety precedence', () => {
    // AVOID is higher than START
    expect(resolveActionConflict('START', 'AVOID')).toBe('AVOID');
    expect(resolveActionConflict('AVOID', 'START')).toBe('AVOID');

    // STOP is higher than CONTINUE
    expect(resolveActionConflict('CONTINUE', 'STOP')).toBe('STOP');

    // HOLD is higher than START
    expect(resolveActionConflict('START', 'HOLD')).toBe('HOLD');

    // REDUCE is higher than UPTITRATE
    expect(resolveActionConflict('UPTITRATE', 'REDUCE')).toBe('REDUCE');
  });

  it('merges identical drug recommended across multiple modules with benefitsAlso', () => {
    const rec1: Recommendation = {
      id: 'rec_ckd_dapa',
      module: 'ckd',
      tier: 'Bảo vệ thận',
      action: 'START',
      drugId: 'dapagliflozin',
      drugNameVi: 'Dapagliflozin',
      dose: '10 mg/ngày',
      title: 'Khởi trị Dapagliflozin cho CKD',
      rationale: 'Bảo tồn chức năng lọc thận ở bệnh nhân CKD',
      gates: [{ parameter: 'eGFR', passed: true, messageVi: 'eGFR >= 20' }],
      citationIds: ['kdigo2024_ckd'],
      priority: 80
    };

    const rec2: Recommendation = {
      id: 'rec_dm2_dapa',
      module: 'dm2',
      tier: 'Bảo vệ tim-thận',
      action: 'START',
      drugId: 'dapagliflozin',
      drugNameVi: 'Dapagliflozin',
      dose: '10 mg/ngày',
      title: 'Khởi trị Dapagliflozin cho ĐTĐ',
      rationale: 'Hạ đường huyết và giảm tỷ lệ tử vong tim mạch',
      gates: [{ parameter: 'eGFR', passed: true, messageVi: 'eGFR >= 20' }],
      citationIds: ['ada2026_sglt2i'],
      priority: 90
    };

    const merged = mergeRecommendations([rec1, rec2]);

    // Must be merged to 1 recommendation
    expect(merged.length).toBe(1);
    const dapa = merged[0];
    expect(dapa.drugId).toBe('dapagliflozin');
    expect(dapa.benefitsAlso).toContain('dm2');
    expect(dapa.citationIds).toContain('kdigo2024_ckd');
    expect(dapa.citationIds).toContain('ada2026_sglt2i');
    expect(dapa.priority).toBe(90);
  });

  it('overrides START with AVOID when safety gate fails on one module', () => {
    const recStart: Recommendation = {
      id: 'rec_dm2_met',
      module: 'dm2',
      tier: 'Kiểm soát đường huyết',
      action: 'START',
      drugId: 'metformin',
      title: 'Dùng Metformin',
      rationale: 'Hạ đường huyết',
      gates: [],
      citationIds: ['ada2026'],
      priority: 70
    };

    const recAvoid: Recommendation = {
      id: 'rec_ckd_met_avoid',
      module: 'ckd',
      tier: 'An toàn thận',
      action: 'AVOID',
      drugId: 'metformin',
      title: 'Chống chỉ định Metformin',
      rationale: 'eGFR < 30',
      gates: [{ parameter: 'eGFR', passed: false, messageVi: 'eGFR < 30 chống chỉ định' }],
      citationIds: ['kdigo2024'],
      priority: 85
    };

    const merged = mergeRecommendations([recStart, recAvoid]);
    expect(merged.length).toBe(1);
    expect(merged[0].action).toBe('AVOID');
  });

  it('resolves Dual MRA conflict: Spironolactone (HF) vs Finerenone (CKD) in HFrEF patient', () => {
    const spiroRec: Recommendation = {
      id: 'rec_hf_spiro',
      module: 'hf',
      tier: 'Tứ trụ suy tim',
      action: 'START',
      drugId: 'spironolactone',
      drugNameVi: 'Spironolactone',
      title: 'Khởi trị Spironolactone',
      rationale: 'Trụ cột MRA giảm tử vong trong HFrEF',
      gates: [],
      citationIds: ['esc2026_hf_mra'],
      priority: 92
    };

    const finerenoneRec: Recommendation = {
      id: 'rec_ckd_finerenone',
      module: 'ckd',
      tier: 'Bảo vệ thận',
      action: 'START',
      drugId: 'finerenone',
      drugNameVi: 'Finerenone',
      title: 'Khởi trị Finerenone',
      rationale: 'Bảo vệ thận và tim mạch trong CKD ĐTĐ2',
      gates: [],
      citationIds: ['kdigo2024_finerenone'],
      priority: 88
    };

    // Patient with HFrEF
    const hfPatient = {
      conditions: { hf: true },
      lvef: 30,
      currentMeds: [],
      selectedModules: ['ckd', 'hf']
    };

    const merged = mergeRecommendations([spiroRec, finerenoneRec], hfPatient as any);

    // Should NOT have 2 START MRA!
    const starts = merged.filter((r) => r.action === 'START');
    expect(starts.length).toBe(1);
    expect(starts[0].drugId).toBe('spironolactone');
    expect(starts[0].benefitsAlso).toContain('ckd');

    // Finerenone should be transformed into AVOID with explicit explanation
    const avoidedFinerenone = merged.find((r) => r.drugId === 'finerenone');
    expect(avoidedFinerenone).toBeDefined();
    expect(avoidedFinerenone?.action).toBe('AVOID');
    expect(avoidedFinerenone?.title).toContain('CHỐNG CHỈ ĐỊNH PHỐI HỢP');
    expect(avoidedFinerenone?.rationale).toContain('Spironolactone');
  });

  it('resolves ACEi vs ARNI conflict: Perindopril (CKD) vs Sacubitril/Valsartan (HF) in HFrEF', () => {
    const periRec: Recommendation = {
      id: 'rec_ckd_peri',
      module: 'ckd',
      tier: 'Bảo vệ thận',
      action: 'START',
      drugId: 'perindopril',
      drugNameVi: 'Perindopril',
      title: 'Khởi trị Perindopril',
      rationale: 'Bảo vệ thận trong CKD',
      gates: [],
      citationIds: ['kdigo2024_rasi'],
      priority: 85
    };

    const arniRec: Recommendation = {
      id: 'rec_hf_arni',
      module: 'hf',
      tier: 'Tứ trụ suy tim',
      action: 'START',
      drugId: 'sacubitril_valsartan',
      drugNameVi: 'Sacubitril / Valsartan',
      title: 'Khởi trị ARNI',
      rationale: 'Trụ cột HFrEF',
      gates: [],
      citationIds: ['esc2026_arni'],
      priority: 95
    };

    const hfPatient = {
      conditions: { hf: true },
      lvef: 32,
      currentMeds: [],
      selectedModules: ['ckd', 'hf']
    };

    const merged = mergeRecommendations([periRec, arniRec], hfPatient as any);

    const starts = merged.filter((r) => r.action === 'START');
    expect(starts.length).toBe(1);
    expect(starts[0].drugId).toBe('sacubitril_valsartan');
    expect(starts[0].benefitsAlso).toContain('ckd');

    const avoidedPeri = merged.find((r) => r.drugId === 'perindopril');
    expect(avoidedPeri).toBeDefined();
    expect(avoidedPeri?.action).toBe('AVOID');
    expect(avoidedPeri?.title).toContain('CHỐNG CHỈ ĐỊNH PHỐI HỢP');
  });

  it('resolves Incretin conflict: DPP-4i vs GLP-1 RA (GLP-1 RA wins)', () => {
    const dpp4Rec: Recommendation = {
      id: 'rec_dm2_dpp4',
      module: 'dm2',
      tier: 'Hạ đường huyết',
      action: 'START',
      drugId: 'sitagliptin',
      drugNameVi: 'Sitagliptin',
      title: 'Dùng Sitagliptin',
      rationale: 'Hạ glucose',
      gates: [],
      citationIds: ['ada2026'],
      priority: 70
    };

    const glp1Rec: Recommendation = {
      id: 'rec_dm2_glp1',
      module: 'dm2',
      tier: 'Bảo vệ tim-thận',
      action: 'START',
      drugId: 'semaglutide',
      drugNameVi: 'Semaglutide',
      title: 'Khởi trị Semaglutide',
      rationale: 'Bảo vệ tim mạch',
      gates: [],
      citationIds: ['ada2026_glp1'],
      priority: 90
    };

    const merged = mergeRecommendations([dpp4Rec, glp1Rec]);

    expect(merged.length).toBe(1);
    const starts = merged.filter((r) => r.action === 'START');
    expect(starts.length).toBe(1);
    expect(starts[0].drugId).toBe('semaglutide');
    expect(starts[0].citationIds).toContain('ada2026');
    expect(starts[0].citationIds).toContain('ada2026_glp1');

    // CKD-R2-R3-08: Sitagliptin was NOT in currentMeds -> must NOT emit bogus [AVOID] card!
    const avoidedDpp4 = merged.find((r) => r.drugId === 'sitagliptin');
    expect(avoidedDpp4).toBeUndefined();
  });

  it('NEVER downgrades a safety STOP recommendation (e.g. Saxagliptin in HF) to SWITCH during currentMeds reconciliation', () => {
    const stopSaxa: Recommendation = {
      id: 'rec_dm2_stop_saxa_hf',
      module: 'dm2',
      tier: 'Cảnh báo an toàn suy tim',
      action: 'STOP',
      drugId: 'saxagliptin',
      drugNameVi: 'Saxagliptin',
      title: 'NGỪNG Saxagliptin do tăng nguy cơ nhập viện vì suy tim',
      rationale: 'Thử nghiệm SAVOR-TIMI 53 cho thấy Saxagliptin làm tăng tỷ lệ nhập viện vì suy tim.',
      gates: [],
      citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'],
      priority: 90
    };

    const startSema: Recommendation = {
      id: 'rec_dm2_start_sema',
      module: 'dm2',
      tier: 'Bảo vệ tim-thận',
      action: 'START',
      drugId: 'semaglutide',
      drugNameVi: 'Semaglutide',
      title: 'Khởi trị Semaglutide',
      rationale: 'Giảm biến cố tim mạch xơ vữa và kiểm soát đường huyết.',
      gates: [],
      citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'],
      priority: 92
    };

    const patient = {
      conditions: { hf: true, dm: true },
      lvef: 35,
      currentMeds: [{ drugId: 'saxagliptin', name: 'Saxagliptin 5 mg' }],
      selectedModules: ['dm2', 'hf']
    };

    const merged = mergeRecommendations([startSema, stopSaxa], patient as any);
    const saxaRec = merged.find((r) => r.drugId === 'saxagliptin');

    expect(saxaRec).toBeDefined();
    expect(saxaRec?.action).toBe('STOP');
    expect(saxaRec?.title).toContain('NGỪNG Saxagliptin');
    expect(saxaRec?.rationale).toContain('SAVOR-TIMI 53');
    expect(saxaRec?.rationale).toContain('Semaglutide');
  });

  it('resolves FDC inhaler component conflicts via KB classes/components without emitting duplicate rows', () => {
    const tripleRec: Recommendation = {
      id: 'rec_copd_triple',
      module: 'copd',
      tier: 'Phác đồ 3 thuốc hít',
      action: 'START',
      drugId: 'fluticasone_furoate_umeclidinium_vilanterol',
      drugNameVi: 'Trelegy Ellipta',
      title: 'Khởi trị ICS + LAMA + LABA',
      rationale: 'COPD nhóm E kèm bạch cầu ái toan máu cao.',
      gates: [],
      citationIds: ['byt.copd.2026.triple_therapy_indication'],
      priority: 94
    };

    const icsLabaRec: Recommendation = {
      id: 'rec_asthma_mart',
      module: 'asthma',
      tier: 'Track 1 MART',
      action: 'START',
      drugId: 'budesonide_formoterol',
      drugNameVi: 'Budesonide/Formoterol',
      title: 'Khởi trị ICS-Formoterol',
      rationale: 'Kiểm soát hen nền tảng.',
      gates: [],
      citationIds: ['gina.asthma.2026.track1_preferred'],
      priority: 88
    };

    const merged = mergeRecommendations([tripleRec, icsLabaRec]);

    // CKD-R2-R3-08 & COPD-R1V2-02: Chỉ giữ đúng 1 dòng START cho Trelegy (gộp benefitsAlso + citations), KHÔNG sinh thẻ [AVOID] giả cho thuốc BN không uống
    expect(merged.length).toBe(1);
    const starts = merged.filter((r) => r.action === 'START');
    expect(starts.length).toBe(1);
    expect(starts[0].drugId).toBe('fluticasone_furoate_umeclidinium_vilanterol');
    expect(starts[0].benefitsAlso).toContain('asthma');
    expect(starts[0].citationIds).toContain('gina.asthma.2026.track1_preferred');

    const avoided = merged.find((r) => r.drugId === 'budesonide_formoterol');
    expect(avoided).toBeUndefined();
  });

  it('R3-HF-06: preserves ARNI (sacubitril_valsartan) and Spironolactone in HFrEF currentMeds without downgrading to SWITCH for Perindopril or Finerenone', () => {
    const arniContinue: Recommendation = {
      id: 'rec_hf_arni_cont',
      module: 'hf',
      tier: 'Tứ trụ suy tim',
      action: 'START',
      drugId: 'sacubitril_valsartan',
      drugNameVi: 'Sacubitril/Valsartan',
      title: 'Sacubitril/Valsartan',
      rationale: 'Trụ cột ARNI ở HFrEF.',
      gates: [],
      citationIds: ['esc.hf.2026.sacubitril_valsartan_dose'],
      priority: 95
    };
    const spiroContinue: Recommendation = {
      id: 'rec_hf_spiro_cont',
      module: 'hf',
      tier: 'Tứ trụ suy tim',
      action: 'START',
      drugId: 'spironolactone',
      drugNameVi: 'Spironolactone',
      title: 'Spironolactone',
      rationale: 'Trụ cột MRA ở HFrEF.',
      gates: [],
      citationIds: ['esc.hf.2026.mra_doses'],
      priority: 92
    };
    const periStart: Recommendation = {
      id: 'rec_htn_peri',
      module: 'htn',
      tier: 'Kiểm soát huyết áp',
      action: 'START',
      drugId: 'perindopril',
      drugNameVi: 'Perindopril',
      title: 'Khởi trị Perindopril',
      rationale: 'Kiểm soát HA và bảo vệ thận.',
      gates: [],
      citationIds: ['esc.htn.2024.ban_dual_rasi'],
      priority: 85
    };
    const finerenoneStart: Recommendation = {
      id: 'rec_ckd_fine',
      module: 'ckd',
      tier: 'Bảo vệ thận',
      action: 'START',
      drugId: 'finerenone',
      drugNameVi: 'Finerenone',
      title: 'Khởi trị Finerenone',
      rationale: 'Giảm tiến triển CKD ở ĐTĐ2.',
      gates: [],
      citationIds: ['fda.finerenone.table_1_starting_dose'],
      priority: 88
    };

    const hfCkdHtnPatient = {
      lvef: 28,
      conditions: { hf: true, ckd: true, htn: true, dm: true },
      currentMeds: [
        { drugId: 'sacubitril_valsartan', dose: '100 mg x 2' },
        { drugId: 'spironolactone', dose: '25 mg' }
      ],
      selectedModules: ['hf', 'ckd', 'htn', 'dm2']
    };

    const merged = mergeRecommendations(
      [arniContinue, spiroContinue, periStart, finerenoneStart],
      hfCkdHtnPatient as any
    );

    const arni = merged.find((r) => r.drugId === 'sacubitril_valsartan');
    const spiro = merged.find((r) => r.drugId === 'spironolactone');
    const peri = merged.find((r) => r.drugId === 'perindopril');
    const fine = merged.find((r) => r.drugId === 'finerenone');

    expect(arni?.action).toBe('CONTINUE');
    expect(arni?.benefitsAlso).toContain('htn');
    expect(spiro?.action).toBe('CONTINUE');
    expect(spiro?.benefitsAlso).toContain('ckd');
    expect(peri).toBeUndefined();
    expect(fine).toBeUndefined();
    expect(merged.some((r) => r.action === 'SWITCH')).toBe(false);
  });

  it('R1: resolves med.name fallback from KB when med.name is undefined and enforces 36h washout ONLY for ACEi -> ARNI (not ARB -> ARNI)', () => {
    const startArni: Recommendation = {
      id: 'rec_hf_arni',
      module: 'hf',
      tier: 'Tứ trụ suy tim',
      action: 'START',
      drugId: 'sacubitril_valsartan',
      drugNameVi: 'Sacubitril/Valsartan',
      title: 'Khởi trị Sacubitril/Valsartan',
      rationale: 'Ưu tiên ARNI ở HFrEF.',
      gates: [],
      citationIds: ['esc.hf.2026.washout_acei_arni_36h'],
      priority: 95
    };

    // Case 1: ACEi (enalapril) with name: undefined -> must resolve drug name and show 36h washout
    const mergedAcei = mergeRecommendations([startArni], {
      lvef: 30,
      conditions: { hf: true },
      currentMeds: [{ drugId: 'enalapril' } as any],
      selectedModules: ['hf']
    } as any);

    const swAcei = mergedAcei.find((r) => r.drugId === 'enalapril');
    expect(swAcei?.action).toBe('SWITCH');
    expect(swAcei?.title).not.toContain('undefined');
    expect(swAcei?.rationale).not.toContain('undefined');
    expect(swAcei?.title.toLowerCase()).toContain('enalapril');
    expect(swAcei?.rationale).toContain('36 GIỜ');
    expect(swAcei?.rationale).toContain('washout 36h');

    // Case 2: ARB (valsartan) with name: undefined -> must resolve drug name and NOT require 36h ACEi washout
    const mergedArb = mergeRecommendations([startArni], {
      lvef: 30,
      conditions: { hf: true },
      currentMeds: [{ drugId: 'valsartan' } as any],
      selectedModules: ['hf']
    } as any);

    const swArb = mergedArb.find((r) => r.drugId === 'valsartan');
    expect(swArb?.action).toBe('SWITCH');
    expect(swArb?.title).not.toContain('undefined');
    expect(swArb?.title.toLowerCase()).toContain('valsartan');
    expect(swArb?.rationale).not.toContain('washout 36h');
  });

  it('CKD-R2-R3-12: STOP beats AVOID when drugId is in active currentMeds, preserving merged citations and rationale', () => {
    expect(resolveActionConflict('STOP', 'AVOID', true)).toBe('STOP');
    expect(resolveActionConflict('AVOID', 'STOP', true)).toBe('STOP');
    expect(resolveActionConflict('STOP', 'AVOID', false)).toBe('AVOID');

    const avoidRec: Recommendation = {
      id: 'rec_avoid_ibuprofen',
      module: 'gout',
      tier: 'Cảnh báo',
      action: 'AVOID',
      drugId: 'ibuprofen',
      drugNameVi: 'Ibuprofen',
      title: 'TRÁNH dùng Ibuprofen ở CKD nặng',
      rationale: 'NSAID gây co tiểu động mạch đến làm nặng suy thận.',
      gates: [],
      citationIds: ['acr.gout.2020.nsaid_ckd_avoid'],
      priority: 88
    };
    const stopRec: Recommendation = {
      id: 'med_review_nsaid_stop',
      module: 'ckd',
      tier: 'Rà soát an toàn',
      action: 'STOP',
      drugId: 'ibuprofen',
      drugNameVi: 'Ibuprofen',
      title: 'NGỪNG NGAY Ibuprofen đang uống',
      rationale: 'Bệnh nhân đang dùng NSAID trên nền eGFR < 30.',
      gates: [],
      citationIds: ['kdigo.ckd.2024.avoid_nsaids'],
      priority: 95
    };

    const mergedActive = mergeRecommendations([avoidRec, stopRec], {
      currentMeds: [{ drugId: 'ibuprofen', dose: 400, unit: 'mg' }],
      conditions: { ckd: true },
      selectedModules: ['ckd', 'gout']
    } as any);

    expect(mergedActive.length).toBe(1);
    expect(mergedActive[0].action).toBe('STOP');
    expect(mergedActive[0].citationIds).toContain('acr.gout.2020.nsaid_ckd_avoid');
    expect(mergedActive[0].citationIds).toContain('kdigo.ckd.2024.avoid_nsaids');
    expect(mergedActive[0].rationale).toContain('NSAID gây co tiểu động mạch đến');
  });

  it('CKD-R2-R3-08 & COPD-R1V2-02: respects stable SGLT2i (Jardiance) and Triple Inhalers in currentMeds without bogus AVOID or downgrade SWITCH', () => {
    // 1. Empagliflozin (Jardiance) in currentMeds + START Dapagliflozin -> CONTINUE Empagliflozin
    const dapaStart: Recommendation = {
      id: 'rec_ckd_dapa',
      module: 'ckd',
      tier: 'Bảo vệ thận',
      action: 'START',
      drugId: 'dapagliflozin',
      drugNameVi: 'Dapagliflozin',
      dose: '10 mg/ngày',
      title: 'Khởi trị Dapagliflozin',
      rationale: 'Giảm tiến triển CKD.',
      gates: [],
      citationIds: ['kdigo2024_sglt2i'],
      priority: 90
    };
    const sgltMerged = mergeRecommendations([dapaStart], {
      currentMeds: [{ drugId: 'empagliflozin', name: 'Jardiance', dose: 10, unit: 'mg' }],
      conditions: { ckd: true, dm: true },
      selectedModules: ['ckd', 'dm2']
    } as any);

    expect(sgltMerged.length).toBe(1);
    expect(sgltMerged[0].drugId).toBe('empagliflozin');
    expect(sgltMerged[0].action).toBe('CONTINUE');
    expect(sgltMerged[0].dose).toBe('10 mg');
    expect(sgltMerged.some((r) => r.action === 'AVOID' || r.action === 'SWITCH')).toBe(false);

    // 2. Triple inhaler (fluticasone_umeclidinium_vilanterol / breztri) in currentMeds + START budesonide_formoterol -> CONTINUE Triple
    const asthmaMartStart: Recommendation = {
      id: 'rec_asthma_mart',
      module: 'asthma',
      tier: 'MART',
      action: 'START',
      drugId: 'budesonide_formoterol',
      drugNameVi: 'Budesonide/Formoterol',
      title: 'Khởi trị MART',
      rationale: 'Kiểm soát hen đồng mắc.',
      gates: [],
      citationIds: ['gina.asthma.2026.track1_preferred'],
      priority: 88
    };
    const tripleMerged = mergeRecommendations([asthmaMartStart], {
      currentMeds: [
        { drugId: 'fluticasone_umeclidinium_vilanterol', name: 'Trelegy Ellipta', dose: '100/62.5/25 mcg' }
      ],
      conditions: { copd: true, asthma: true },
      selectedModules: ['copd', 'asthma']
    } as any);

    expect(tripleMerged.length).toBe(1);
    expect(tripleMerged[0].action).toBe('CONTINUE');
    expect(tripleMerged[0].drugId).toBe('fluticasone_umeclidinium_vilanterol');
    expect(tripleMerged.some((r) => r.action === 'SWITCH' || r.action === 'AVOID')).toBe(false);
  });

  it('R3-GOUT-01 & R3-R2-COPD-05: resolves XOI (Allopurinol vs Febuxostat) and Systemic Steroid (oral Prednisolone vs IV Methylprednisolone) conflicts cleanly', () => {
    // XOI conflict
    const alloStart: Recommendation = {
      id: 'rec_allo',
      module: 'gout',
      tier: 'ULT',
      action: 'START',
      drugId: 'allopurinol',
      drugNameVi: 'Allopurinol',
      title: 'Khởi trị Allopurinol',
      rationale: 'Đầu tay hạ acid uric.',
      gates: [],
      citationIds: ['acr.gout.2020.allopurinol_first_line'],
      priority: 92
    };
    const febuStart: Recommendation = {
      id: 'rec_febu',
      module: 'ckd',
      tier: 'ULT',
      action: 'START',
      drugId: 'febuxostat',
      drugNameVi: 'Febuxostat',
      title: 'Khởi trị Febuxostat',
      rationale: 'Thay thế ở CKD.',
      gates: [],
      citationIds: ['acr.gout.2020.xoi_ckd'],
      priority: 84
    };
    const xoiMerged = mergeRecommendations([alloStart, febuStart]);
    expect(xoiMerged.length).toBe(1);
    expect(xoiMerged[0].drugId).toBe('allopurinol');
    expect(xoiMerged[0].benefitsAlso).toContain('ckd');

    // Inpatient COPD + Asthma systemic steroid conflict -> IV Methylprednisolone wins, 0 duplicate oral steroid
    const copdOralPred: Recommendation = {
      id: 'rec_copd_pred',
      module: 'copd',
      tier: 'Xử trí đợt cấp cấp cứu',
      action: 'START',
      drugId: 'prednisolone',
      drugNameVi: 'Prednisolone',
      dose: 'Prednisolone 40 mg uống/ngày trong 5 ngày',
      title: 'Corticoid toàn thân trong 5 ngày',
      rationale: 'Đợt cấp COPD.',
      gates: [],
      citationIds: ['gold.copd.2026.exac_systemic_steroid_40mg_5d'],
      priority: 95
    };
    const asthmaIvMp: Recommendation = {
      id: 'rec_asthma_mp_iv',
      module: 'asthma',
      tier: 'Xử trí cơn hen cấp nặng nội viện',
      action: 'START',
      drugId: 'methylprednisolone',
      drugNameVi: 'Methylprednisolone',
      dose: '40 mg tiêm tĩnh mạch ngay lập tức',
      title: 'Corticoid toàn thân cấp cứu: Methylprednisolone 40 mg tiêm tĩnh mạch ngay trong giờ đầu',
      rationale: 'Cơn hen cấp nặng.',
      gates: [],
      citationIds: ['byt.asthma.2021.acute_iv_steroid_ipratropium'],
      priority: 94
    };
    const steroidMerged = mergeRecommendations([copdOralPred, asthmaIvMp]);
    expect(steroidMerged.length).toBe(1);
    expect(steroidMerged[0].drugId).toBe('methylprednisolone');
    expect(steroidMerged[0].benefitsAlso).toContain('copd');
    expect(steroidMerged[0].citationIds).toContain('gold.copd.2026.exac_systemic_steroid_40mg_5d');
  });

  it('COPD-R1V2-03 & R3-GOUT-05: preserves acute/escalated target doses AND formats bare numeric CONTINUE doses with units', () => {
    // 1. Acute Prednisolone 35 mg on top of chronic 5 mg background -> keeps 35 mg!
    const acutePred: Recommendation = {
      id: 'rec_gout_pred_flare',
      module: 'gout',
      tier: 'Cắt cơn gút cấp',
      action: 'START',
      drugId: 'prednisolone',
      drugNameVi: 'Prednisolone',
      dose: '30–35 mg uống/ngày trong 5 ngày',
      title: 'Khởi trị Prednisolone cắt cơn gút cấp',
      rationale: 'Liều kháng viêm cắt cơn cấp.',
      gates: [],
      citationIds: ['eular.gout.2016.prednisolone_flare'],
      priority: 90
    };
    const predMerged = mergeRecommendations([acutePred], {
      currentMeds: [{ drugId: 'prednisolone', dose: '5', unit: 'mg' }],
      conditions: { gout: true },
      selectedModules: ['gout']
    } as any);
    expect(predMerged[0].dose).toBe('30–35 mg uống/ngày trong 5 ngày');
    expect(predMerged[0].title).toContain('[Đang dùng nền: 5 mg]');

    // 2. Acute nebulized Salbutamol 2.5-5 mg on top of chronic pMDI 100 mcg -> keeps nebulized dose!
    const acuteNebSaba: Recommendation = {
      id: 'rec_copd_neb_saba',
      module: 'copd',
      tier: 'Xử trí đợt cấp cấp cứu',
      action: 'START',
      drugId: 'salbutamol',
      drugNameVi: 'Salbutamol',
      dose: '2.5–5 mg phun khí dung mỗi 20 phút x 3 liều',
      title: 'Khí dung Salbutamol cắt cơn cấp',
      rationale: 'Giãn phế quản cấp cứu.',
      gates: [],
      citationIds: ['gold.copd.2026.exac_saba'],
      priority: 96
    };
    const sabaMerged = mergeRecommendations([acuteNebSaba], {
      currentMeds: [{ drugId: 'salbutamol', dose: '100 mcg' }],
      conditions: { copd: true },
      selectedModules: ['copd']
    } as any);
    expect(sabaMerged[0].dose).toBe('2.5–5 mg phun khí dung mỗi 20 phút x 3 liều');

    // 3. Routine Bisoprolol CONTINUE with bare numeric dose: '5', unit: 'mg' -> '5 mg' (never bare '5')
    const routineBiso: Recommendation = {
      id: 'rec_hf_biso',
      module: 'hf',
      tier: 'Tứ trụ suy tim',
      action: 'START',
      drugId: 'bisoprolol',
      drugNameVi: 'Bisoprolol',
      dose: '1.25 mg/ngày',
      title: 'Khởi trị Bisoprolol',
      rationale: 'Trụ cột chẹn beta.',
      gates: [],
      citationIds: ['esc.hf.2026.bb'],
      priority: 90
    };
    const bisoMerged = mergeRecommendations([routineBiso], {
      currentMeds: [{ drugId: 'bisoprolol', dose: '5', unit: 'mg' }],
      conditions: { hf: true },
      selectedModules: ['hf']
    } as any);
    expect(bisoMerged[0].action).toBe('CONTINUE');
    expect(bisoMerged[0].dose).toBe('5 mg');
    expect(bisoMerged[0].title).toContain('5 mg');
  });

  it('R3-R2-DM2-12 & R3-R2-DM2-08: preserves morning NPH alongside evening Glargine for steroid hyperglycemia while resolving true long-acting basal & SU duplicates', () => {
    // 1. Morning START insulin_nph + evening insulin_glargine in currentMeds -> BOTH preserved!
    const morningNphRec: Recommendation = {
      id: 'rec_dm2_steroid_nph',
      module: 'dm2',
      tier: 'Tăng đường huyết do Corticoid',
      action: 'START',
      drugId: 'insulin_nph',
      drugNameVi: 'Insulin NPH',
      dose: '0.2 đơn vị/kg tiêm dưới da buổi sáng cùng liều Prednisolone',
      title: 'Khởi trị Insulin NPH buổi sáng phủ đỉnh đường huyết Corticoid',
      rationale: 'ADA khuyến cáo bổ sung NPH buổi sáng song song với insulin nền buổi tối.',
      gates: [],
      citationIds: ['ada.dm2.2026.steroid_nph'],
      priority: 92
    };
    const contGlargineRec: Recommendation = {
      id: 'rec_dm2_cont_glargine',
      module: 'dm2',
      tier: 'Insulin nền',
      action: 'CONTINUE',
      drugId: 'insulin_glargine',
      drugNameVi: 'Insulin Glargine',
      dose: '18 đơn vị buổi tối',
      title: 'Duy trì Insulin Glargine buổi tối',
      rationale: 'Giữ nền qua đêm.',
      gates: [],
      citationIds: ['ada.dm2.2026.basal_start_and_titration'],
      priority: 88
    };

    const steroidPatient = {
      currentMeds: [
        { drugId: 'insulin_glargine', dose: '18 đơn vị' },
        { drugId: 'prednisolone', dose: '30 mg' }
      ],
      conditions: { dm: true, copd: true },
      selectedModules: ['dm2', 'copd']
    };

    const steroidMerged = mergeRecommendations([morningNphRec, contGlargineRec], steroidPatient as any);
    const nphOut = steroidMerged.find((r) => r.drugId === 'insulin_nph');
    const glargineOut = steroidMerged.find((r) => r.drugId === 'insulin_glargine');
    expect(nphOut?.action).toBe('START');
    expect(glargineOut?.action).toBe('CONTINUE');

    // 2. True duplicate long-acting basal insulins (Glargine + Degludec) -> resolves to 1 START
    const startGlargine: Recommendation = {
      id: 'rec_glargine',
      module: 'dm2',
      tier: 'Insulin nền',
      action: 'START',
      drugId: 'insulin_glargine',
      title: 'Khởi trị Glargine',
      rationale: 'Test',
      gates: [],
      citationIds: ['ada.dm2.2026.basal_start_and_titration'],
      priority: 85
    };
    const startDegludec: Recommendation = {
      id: 'rec_degludec',
      module: 'dm2',
      tier: 'Insulin nền',
      action: 'START',
      drugId: 'insulin_degludec',
      title: 'Khởi trị Degludec',
      rationale: 'Test',
      gates: [],
      citationIds: ['ada.dm2.2026.basal_start_and_titration'],
      priority: 90
    };
    const basalMerged = mergeRecommendations([startGlargine, startDegludec]);
    expect(basalMerged.filter((r) => r.action === 'START').length).toBe(1);
    expect(basalMerged[0].drugId).toBe('insulin_degludec');

    // 3. Duplicate Sulfonylurea recommendations (Gliclazide + Glimepiride) -> resolves to 1 START
    const startGliclazide: Recommendation = {
      id: 'rec_gliclazide',
      module: 'dm2',
      tier: 'Hạ đường huyết uống',
      action: 'START',
      drugId: 'gliclazide',
      title: 'Khởi trị Gliclazide MR',
      rationale: 'Test',
      gates: [],
      citationIds: ['ema.gliclazide.dosing_renal'],
      priority: 82
    };
    const startGlimepiride: Recommendation = {
      id: 'rec_glimepiride',
      module: 'dm2',
      tier: 'Hạ đường huyết uống',
      action: 'START',
      drugId: 'glimepiride',
      title: 'Khởi trị Glimepiride',
      rationale: 'Test',
      gates: [],
      citationIds: ['fda.glimepiride.hypo_elderly_renal'],
      priority: 76
    };
    const suMerged = mergeRecommendations([startGliclazide, startGlimepiride]);
    expect(suMerged.filter((r) => r.action === 'START').length).toBe(1);
    expect(suMerged[0].drugId).toBe('gliclazide');
  });

  it('CKD-R3-R3-03 & CKD-R3-R2-06: enforces DEFER > START priority, class-wide fail-closed DEFER protection, and converts med_review REDUCE to SWITCH on superior step-up', () => {
    // 1. DEFER beats START / UPTITRATE / CONTINUE / CONSIDER in ACTION_PRIORITY and same-drug merge
    expect(resolveActionConflict('START', 'DEFER')).toBe('DEFER');
    expect(resolveActionConflict('DEFER', 'UPTITRATE')).toBe('DEFER');

    const ckdDeferLisi: Recommendation = {
      id: 'rec_ckd_rasi_defer_missing_k',
      module: 'ckd',
      tier: 'Cổng an toàn điện giải',
      action: 'DEFER',
      drugId: 'lisinopril',
      drugNameVi: 'Lisinopril',
      title: 'TRÌ HOÃN khởi trị RASi (Chưa có Kali máu)',
      rationale: 'Chưa có xét nghiệm Kali máu (K+) nền, trì hoãn khởi trị ức chế hệ RAA.',
      gates: [{ parameter: 'K+', passed: false, action: 'defer', messageVi: 'Thiếu Kali máu nền' }],
      citationIds: ['kdigo.ckd.2024.pp_3_6_1_rasi_monitoring_2_4w'],
      priority: 90
    };
    const htnStartPerindopril: Recommendation = {
      id: 'rec_htn_start_perindopril',
      module: 'htn',
      tier: 'Kiểm soát huyết áp',
      action: 'START',
      drugId: 'perindopril',
      drugNameVi: 'Perindopril',
      title: 'Khởi trị Perindopril',
      rationale: 'Hạ áp ban đầu.',
      gates: [],
      citationIds: ['esc.htn.2024.ban_dual_rasi'],
      priority: 85
    };

    // Class-wide fail-closed DEFER on lisinopril MUST prevent perindopril START from bypassing the safety block!
    const classProtected = mergeRecommendations([ckdDeferLisi, htnStartPerindopril]);
    expect(classProtected.some((r) => r.action === 'START')).toBe(false);
    expect(classProtected.find((r) => r.action === 'DEFER')).toBeDefined();

    // Conversely, drug-specific CYP3A4 DDI DEFER on atorvastatin MUST still allow CONSIDER rosuvastatin (Golden lipid_30)
    const cypDeferAtorva: Recommendation = {
      id: 'rec_lipid_ddi_cyp3a4_defer',
      module: 'lipid',
      tier: 'Tương tác CYP3A4',
      action: 'DEFER',
      drugId: 'atorvastatin',
      title: 'Tạm hoãn Atorvastatin trong đợt Clarithromycin',
      rationale: 'Clarithromycin ức chế mạnh CYP3A4.',
      gates: [{ parameter: 'CYP3A4', passed: false, action: 'defer', messageVi: 'Tương tác CYP3A4' }],
      citationIds: ['fda.atorvastatin.clarithromycin_limit_20mg'],
      priority: 88
    };
    const considerRosuva: Recommendation = {
      id: 'rec_lipid_consider_rosuva',
      module: 'lipid',
      tier: 'Thay thế không qua CYP3A4',
      action: 'CONSIDER',
      drugId: 'rosuvastatin',
      title: 'Cân nhắc Rosuvastatin',
      rationale: 'Rosuvastatin không chuyển hóa qua CYP3A4.',
      gates: [],
      citationIds: ['acc.lipid.2026.rosuva_cyp3a4'],
      priority: 80
    };
    const cypMerged = mergeRecommendations([cypDeferAtorva, considerRosuva]);
    expect(cypMerged.find((r) => r.drugId === 'atorvastatin')?.action).toBe('DEFER');
    expect(cypMerged.find((r) => r.drugId === 'rosuvastatin')?.action).toBe('CONSIDER');

    // 2. CKD-R3-R2-06: Baseline Simvastatin 40 mg with med_review REDUCE + Atorvastatin high-intensity START -> converts REDUCE to SWITCH
    const simvaReduce: Recommendation = {
      id: 'med_review_simvastatin_amlodipine_limit',
      module: 'lipid',
      tier: 'Giới hạn liều do tương tác',
      action: 'REDUCE',
      drugId: 'simvastatin',
      drugNameVi: 'Simvastatin',
      dose: 'Tối đa 20 mg/ngày',
      title: 'GIẢM LIỀU Simvastatin <= 20 mg/ngày',
      rationale: 'Tương tác Amlodipine.',
      gates: [],
      citationIds: ['fda.amlodipine.simvastatin_limit_20mg'],
      priority: 90
    };
    const atorvaHighStart: Recommendation = {
      id: 'rec_lipid_atorva_high',
      module: 'lipid',
      tier: 'Hạ lipid cường độ cao',
      action: 'START',
      drugId: 'atorvastatin',
      drugNameVi: 'Atorvastatin',
      dose: '40 mg/ngày',
      title: 'Khởi trị Atorvastatin 40 mg/ngày (cường độ cao)',
      rationale: 'ASCVD nguy cơ rất cao.',
      gates: [],
      citationIds: ['esc.lipid.2025.very_high_risk'],
      priority: 94
    };
    const stepUpMerged = mergeRecommendations([simvaReduce, atorvaHighStart], {
      age: 64,
      currentMeds: [
        { drugId: 'simvastatin', dose: 40, unit: 'mg' },
        { drugId: 'amlodipine', dose: 5, unit: 'mg' }
      ],
      selectedModules: ['lipid'],
      conditions: { ascvd: true }
    });
    expect(stepUpMerged.some((r) => r.drugId === 'simvastatin' && r.action === 'REDUCE')).toBe(false);
    expect(stepUpMerged.find((r) => r.drugId === 'simvastatin')?.action).toBe('SWITCH');
    expect(stepUpMerged.find((r) => r.drugId === 'atorvastatin')?.action).toBe('START');
  });

  it('ASTHMA-R3-R1-02: preserves START budesonide_formoterol alongside STOP non-ICS bronchodilators (glycopyrronium_indacaterol, indacaterol_glycopyrronium, ultibro, tiotropium, salmeterol) in currentMeds', () => {
    for (const nonIcsBaselineId of [
      'glycopyrronium_indacaterol',
      'indacaterol_glycopyrronium',
      'ultibro',
      'tiotropium_olodaterol',
      'umeclidinium_vilanterol',
      'salmeterol',
      'tiotropium'
    ]) {
      const stopNonIcs: Recommendation = {
        id: `rec_asthma_stop_${nonIcsBaselineId}`,
        module: 'asthma',
        tier: 'An toàn GINA: Ngừng giãn phế quản đơn thuần không kèm ICS',
        action: 'STOP',
        drugId: nonIcsBaselineId,
        drugNameVi: nonIcsBaselineId,
        title: `NGỪNG ${nonIcsBaselineId} (không dùng LABA/LAMA không kèm ICS ở hen phế quản)`,
        rationale: 'GINA 2026 chống chỉ định điều trị hen bằng LABA/LAMA đơn thuần không kèm ICS.',
        gates: [],
        citationIds: ['gina.asthma.2026.track1_preferred'],
        priority: 98
      };
      const startMart: Recommendation = {
        id: 'rec_asthma_start_mart',
        module: 'asthma',
        tier: 'Track 1 GINA (MART)',
        action: 'START',
        drugId: 'budesonide_formoterol',
        drugNameVi: 'Budesonide/Formoterol',
        dose: '160/4.5 mcg, 1–2 nhát khi cần (hoặc duy trì + cắt cơn)',
        title: 'Khởi trị ICS-formoterol (Budesonide/Formoterol - MART)',
        rationale: 'Phác đồ ưu tiên Track 1 theo GINA 2026.',
        gates: [],
        citationIds: ['gina.asthma.2026.track1_preferred'],
        priority: 95
      };

      const merged = mergeRecommendations([stopNonIcs, startMart], {
        age: 42,
        currentMeds: [{ drugId: nonIcsBaselineId, name: nonIcsBaselineId }],
        conditions: { asthma: true },
        selectedModules: ['asthma']
      } as any);

      const stopOut = merged.find((r) => r.drugId === nonIcsBaselineId && r.action === 'STOP');
      const startOut = merged.find((r) => r.drugId === 'budesonide_formoterol' && r.action === 'START');
      expect(stopOut).toBeDefined();
      expect(startOut).toBeDefined();
      expect(merged.some((r) => r.drugId === nonIcsBaselineId && r.action === 'CONTINUE')).toBe(false);
    }
  });
});
