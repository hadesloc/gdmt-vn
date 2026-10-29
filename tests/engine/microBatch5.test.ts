import { describe, it, expect } from 'vitest';
import { derivePatientData } from '../../src/engine/derive';
import { missingInputRec } from '../../src/engine/require';
import { checkEmergencyRedFlags, reviewCurrentMedications } from '../../src/engine/safety/reviewMeds';
import { evaluateSafetyGates } from '../../src/engine/safety/gates';
import { checkInteractions } from '../../src/engine/safety/interactions';
import { checkDuplicates } from '../../src/engine/safety/duplicates';
import { interaction } from '../../src/kb-types/access';
import { lintRuleContent } from '../../tools/kb/rulesLint';
import type { Patient, Recommendation, Settings } from '../../src/engine/types';
import type { Citation } from '../../src/kb-types';

const defaultSettings: Settings = {
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
};

describe('Engine Micro-Batch #5 & Citation Linter', () => {
  it('COPD-R3-R1-06 & COPD-R3-R3-11 (derive.ts): assigns GOLD Group E at >= 1 moderate exacerbation and requires postBdrRatio < 0.7 before assigning GOLD Grade/Group', () => {
    // 1. Confirmed COPD (fev1FvcRatio = 0.62) with 1 moderate exacerbation (0/undefined hospitalizations) -> Group E (GOLD 2026)
    const mod1Derived = derivePatientData(
      {
        age: 66,
        sex: 'male',
        currentMeds: [],
        selectedModules: ['copd'],
        conditions: { copd: true },
        customInputs: {
          fev1FvcRatio: 0.62,
          fev1Pct: 58,
          mmrc: 1,
          cat: 8,
          exacerbationsLastYear: 1
        }
      },
      defaultSettings
    );
    expect(mod1Derived.goldGrade).toBe('GOLD 2');
    expect(mod1Derived.goldGroup).toBe('E');

    // 2. Confirmed COPD with 0 exacerbations, low symptoms -> Group A; high symptoms -> Group B
    const mod0GroupA = derivePatientData(
      {
        age: 64,
        sex: 'male',
        currentMeds: [],
        selectedModules: ['copd'],
        conditions: { copd: true },
        customInputs: {
          fev1FvcRatio: 0.64,
          fev1Pct: 82,
          mmrc: 1,
          cat: 7,
          exacerbationsLastYear: 0,
          hospitalizationsLastYear: 0
        }
      },
      defaultSettings
    );
    expect(mod0GroupA.goldGrade).toBe('GOLD 1');
    expect(mod0GroupA.goldGroup).toBe('A');

    // 3. Missing post-bronchodilator FEV1/FVC ratio -> MUST NOT assign goldGrade or goldGroup even if fev1Pct/mmrc/exac are provided
    const missingRatioDerived = derivePatientData(
      {
        age: 66,
        sex: 'male',
        currentMeds: [],
        selectedModules: ['copd'],
        conditions: { copd: true },
        customInputs: {
          fev1Pct: 45,
          mmrc: 3,
          exacerbationsLastYear: 2
        }
      },
      defaultSettings
    );
    expect(missingRatioDerived.goldGrade).toBeUndefined();
    expect(missingRatioDerived.goldGroup).toBeUndefined();

    // 4. Non-obstructive FEV1/FVC >= 0.70 -> MUST NOT assign goldGrade or goldGroup
    const nonObstructiveDerived = derivePatientData(
      {
        age: 66,
        sex: 'male',
        currentMeds: [],
        selectedModules: ['copd'],
        conditions: { copd: true },
        customInputs: {
          fev1FvcRatio: 0.74,
          fev1Pct: 65,
          mmrc: 2,
          exacerbationsLastYear: 1
        }
      },
      defaultSettings
    );
    expect(nonObstructiveDerived.goldGrade).toBeUndefined();
    expect(nonObstructiveDerived.goldGroup).toBeUndefined();
  });

  it('R3-R2-COPD-16 & ASTHMA-R3-R1-09 (require.ts): translates all respiratory GINA/GOLD custom fields to Vietnamese without camelCase leaks', () => {
    const respFields = [
      'daytimeSymptomsMoreThanTwiceWeek',
      'nightWakingDueToAsthma',
      'relieverNeededMoreThanTwiceWeek',
      'activityLimitationDueToAsthma',
      'bcat',
      'catScore',
      'mmrcScore',
      'inhalerTechniqueChecked',
      'adherenceGood',
      'pifLMin',
      'peakInspiratoryFlow',
      'priorSevereExacerbation',
      'severeExacerbationLastYear',
      'icuAdmissionHistory',
      'silentChest',
      'respiratoryArrest'
    ];

    for (const field of respFields) {
      const rec = missingInputRec('asthma', field, 'Cần đánh giá kiểm soát hen theo GINA 2026.', [
        'gina.asthma.2026.track1_preferred'
      ]);
      expect(rec.title).not.toContain(field);
      expect(rec.rationale).not.toContain(field);
      expect(rec.title).toContain('Cần nhập');
    }
  });

  it('COPD-R3-R3-01 & ASTHMA-R3-R1-01 (reviewMedsSpecialized.ts): emits setting-aware life-threatening acute respiratory failure red flag with smart deduplication', () => {
    const baseRespPatient: Patient = {
      age: 58,
      sex: 'male',
      sbp: 128,
      dbp: 78,
      hr: 112,
      currentMeds: [],
      selectedModules: ['asthma'],
      conditions: { asthma: true }
    };

    // 1. Outpatient silentChest -> CHUYỂN CẤP CỨU KHẨN CẤP
    const outptSilentFlags = checkEmergencyRedFlags(
      { ...baseRespPatient, customInputs: { silentChest: true } },
      {},
      defaultSettings
    );
    const outptCard = outptSilentFlags.find((r) => r.id === 'emergency_respiratory_failure_critical');
    expect(outptCard).toBeDefined();
    expect(outptCard?.action).toBe('REFER');
    expect(outptCard?.title).toContain('CHUYỂN CẤP CỨU KHẨN CẤP: Dấu hiệu suy hô hấp cấp đe dọa tính mạng');
    expect(outptCard?.citationIds).toEqual(
      expect.arrayContaining([
        'gold.copd.2026.exac_ventilatory_failure_rome',
        'gina.asthma.2026.acute_icu_silent_chest',
        'byt.copd.2026.niv_contraindications_imv'
      ])
    );

    // 2. Outpatient restingSpo2 < 85 -> triggers outpatient red flag, but NOT inpatient when acute spo2 is normal/absent
    const outptRestingFlags = checkEmergencyRedFlags(
      { ...baseRespPatient, customInputs: { restingSpo2: 83 } },
      {},
      defaultSettings
    );
    expect(outptRestingFlags.some((r) => r.id === 'emergency_respiratory_failure_critical')).toBe(true);

    const inptSettings: Settings = { ...defaultSettings, setting: 'inpatient' };
    const inptRestingOnlyFlags = checkEmergencyRedFlags(
      { ...baseRespPatient, customInputs: { restingSpo2: 83 } },
      {},
      inptSettings
    );
    expect(inptRestingOnlyFlags.some((r) => r.id === 'emergency_respiratory_failure_critical')).toBe(false);

    // 3. Inpatient abgPh < 7.30 & spo2 < 85 -> CẤP CỨU NỘI VIỆN KHẨN CẤP
    const inptAcidosisFlags = checkEmergencyRedFlags(
      { ...baseRespPatient, customInputs: { abgPh: 7.24, spo2: 82 } },
      {},
      inptSettings
    );
    const inptCard = inptAcidosisFlags.find((r) => r.id === 'emergency_respiratory_failure_critical');
    expect(inptCard).toBeDefined();
    expect(inptCard?.title).toContain(
      'CẤP CỨU NỘI VIỆN KHẨN CẤP — xử trí hồi sức hô hấp tại chỗ & hội chẩn ICU'
    );
    expect(inptCard?.rationale).not.toContain('chuyển ngay tới khoa Cấp cứu');

    // 4. Smart deduplication when inpatient module already emitted NIV / IMV / ICU protocol
    const existingNivRec: Recommendation = {
      id: 'rec_copd_inpatient_imv_icu',
      module: 'copd',
      tier: 'Hồi sức hô hấp',
      action: 'REFER',
      title: 'Chỉ định đặt nội khí quản / thở máy xâm nhập và chuyển ICU',
      rationale: 'pH < 7.25 kèm suy hô hấp nguy kịch.',
      gates: [],
      citationIds: ['byt.copd.2026.niv_contraindications_imv'],
      priority: 100
    };
    const dedupedInptFlags = checkEmergencyRedFlags(
      { ...baseRespPatient, customInputs: { abgPh: 7.24, spo2: 82 } },
      {},
      inptSettings,
      [existingNivRec]
    );
    expect(dedupedInptFlags.some((r) => r.id === 'emergency_respiratory_failure_critical')).toBe(false);
  });

  it('Part C (rulesLint.ts): emits CALL_MISSING_CITATION_ID warnings for missing citationIds literals, ternaries, resolveCitationDisplay, and local citation arrays', () => {
    const mockCitations = new Map<string, Citation>([
      [
        'valid.cite.1',
        {
          id: 'valid.cite.1',
          sourceId: 'src_1',
          locator: 'p. 1',
          quote: 'Valid quote 10 mg'
        }
      ]
    ]);

    const sampleModuleCode = `
      const displayCitations: string[] = [];
      displayCitations.push('valid.cite.1');
      displayCitations.push('ghost.cite.pushed');
      const altCids = cond ? ['valid.cite.1'] : ['ghost.cite.ternary_var'];
      const label = resolveCitationDisplay('ghost.cite.display');
      const rec1 = {
        id: 'r1',
        citationIds: ['valid.cite.1', 'ghost.cite.direct']
      };
      const rec2 = {
        id: 'r2',
        citationIds: isVn ? ['ghost.cite.vn'] : ['valid.cite.1']
      };
      const rec3 = {
        id: 'r3',
        citationIds: displayCitations
      };
      const rec4 = {
        id: 'r4',
        citationIds: altCids
      };
      const miss = missingInputRec('ckd', 'sbp', 'Need SBP', ['ghost.cite.missing_input']);
    `;

    const findings = lintRuleContent(sampleModuleCode, 'modules/ckd/rules.outpatient.ts', mockCitations);
    const missingCiteFindings = findings.filter((f) => f.code === 'CALL_MISSING_CITATION_ID');
    const flaggedMessages = missingCiteFindings.map((f) => f.msg).join('\n');

    expect(missingCiteFindings.every((f) => f.level === 'warn')).toBe(true);
    expect(flaggedMessages).toContain('ghost.cite.direct');
    expect(flaggedMessages).toContain('ghost.cite.vn');
    expect(flaggedMessages).toContain('ghost.cite.display');
    expect(flaggedMessages).toContain('ghost.cite.pushed');
    expect(flaggedMessages).toContain('ghost.cite.ternary_var');
    expect(flaggedMessages).toContain('ghost.cite.missing_input');
    expect(flaggedMessages).not.toContain("'valid.cite.1'");
  });

  it('AF-R2-R1-04 (derive.ts & crcl.ts): computes Cockcroft-Gault CrCl using actual body weight without fabricating height = 165', () => {
    const noHeightPatient: Patient = {
      age: 62,
      sex: 'male',
      weight: 105,
      scr: 85,
      currentMeds: [],
      selectedModules: ['af'],
      conditions: { af: true }
    };
    const d1 = derivePatientData(noHeightPatient, defaultSettings);
    // Actual body weight CG: ((140 - 62) * 105) / (0.814 * 85) = 8190 / 69.19 ≈ 118.4 mL/min (> 95 mL/min!)
    expect(d1.crcl).toBeGreaterThan(115);
    expect(d1.crclAbw).toBeUndefined();

    // Even when height is provided (170 cm -> IBW ~66 kg, obese > 1.2 * IBW), derived.crcl stays actual-weight CG for DOAC trials, while crclAbw holds adjusted-weight CrCl
    const withHeightDerived = derivePatientData({ ...noHeightPatient, height: 170 }, defaultSettings);
    expect(withHeightDerived.crcl).toBe(d1.crcl);
    expect(withHeightDerived.crclAbw).toBeDefined();
    expect(withHeightDerived.crclAbw!).toBeLessThan(withHeightDerived.crcl!);
  });

  it('ASTHMA-R3-R3-02, ASTHMA-R3-R3-01, COPD-R3-R3-09 & COPD-R3-R3-17: enforces AERD COX-1 NSAID block, acute bronchospasm BB deferral, respiratory biologic duplication, and dynamic reviewMeds module', () => {
    // 1. ASTHMA-R3-R3-02: AERD blocks COX-1 NSAIDs & Aspirin (STOP/AVOID + critical alert) while sparing selective COX-2 (celecoxib)
    const aerdPatient: Patient = {
      age: 44,
      sex: 'female',
      sbp: 124,
      currentMeds: [
        { drugId: 'naproxen', name: 'Naproxen 500 mg' },
        { drugId: 'celecoxib', name: 'Celecoxib 200 mg' }
      ],
      selectedModules: ['asthma', 'gout'],
      conditions: { asthma: true, aerd: true }
    };
    const aerdReviews = reviewCurrentMedications(aerdPatient, { egfr: 92 }, defaultSettings);
    const naproxenStop = aerdReviews.find((r) => r.drugId === 'naproxen');
    expect(naproxenStop?.action).toBe('STOP');
    expect(naproxenStop?.citationIds).toContain('gina.asthma.2026.aerd_avoid_nsaid');
    expect(aerdReviews.some((r) => r.drugId === 'celecoxib' && r.action === 'STOP')).toBe(false);

    const startIbu: Recommendation = {
      id: 'gout_ibu',
      module: 'gout',
      tier: 'Cắt cơn cấp',
      action: 'START',
      drugId: 'ibuprofen',
      title: 'Khởi trị Ibuprofen',
      rationale: 'Test',
      gates: [],
      citationIds: ['acr.gout.2020.flare_firstline'],
      priority: 85
    };
    expect(evaluateSafetyGates(startIbu, aerdPatient, { egfr: 92 }, defaultSettings).updatedRec.action).toBe('AVOID');

    const monitorCelecoxib: Recommendation = {
      id: 'asthma_cox2',
      module: 'asthma',
      tier: 'Thay thế giảm đau',
      action: 'MONITOR',
      drugId: 'celecoxib',
      title: 'Theo dõi liều đầu Celecoxib tại cơ sở y tế',
      rationale: 'Test',
      gates: [],
      citationIds: ['gina.asthma.2026.aerd_avoid_nsaid'],
      priority: 70
    };
    expect(evaluateSafetyGates(monitorCelecoxib, aerdPatient, { egfr: 92 }, defaultSettings).updatedRec.action).toBe(
      'MONITOR'
    );

    const aerdAlerts = checkInteractions(aerdPatient, { egfr: 92 }, [startIbu]);
    const aerdContraAlert = aerdAlerts.find((a) => a.id === 'alert.aerd_nsaid_contra');
    expect(aerdContraAlert).toBeDefined();
    expect(aerdContraAlert?.severity).toBe('critical');
    expect(aerdContraAlert?.drugIds).toEqual(expect.arrayContaining(['naproxen', 'ibuprofen']));
    expect(aerdContraAlert?.drugIds).not.toContain('celecoxib');

    // 2. ASTHMA-R3-R3-01: Acute bronchospasm / hypoxemia / respiratory acidosis defers new beta-blocker initiation to DEFER
    const acuteAsthmaHf: Patient = {
      age: 56,
      sbp: 132,
      hr: 104,
      lvef: 36,
      currentMeds: [],
      selectedModules: ['asthma', 'hf'],
      conditions: { asthma: true, hf: true },
      customInputs: { isAcuteExacerbation: true, spo2: 89 }
    };
    const startBiso: Recommendation = {
      id: 'hf_start_biso',
      module: 'hf',
      tier: 'Tứ trụ',
      action: 'START',
      drugId: 'bisoprolol',
      title: 'Khởi trị Bisoprolol 1.25 mg',
      rationale: 'Test',
      gates: [],
      citationIds: ['esc.hf.2026.bb_doses'],
      priority: 90
    };
    const gatedBiso = evaluateSafetyGates(startBiso, acuteAsthmaHf, { egfr: 75 }, defaultSettings);
    expect(gatedBiso.updatedRec.action).toBe('AVOID');
    expect(gatedBiso.updatedRec.citationIds).toContain('gina.asthma.2026.beta_blocker_bronchospasm');

    // 3. COPD-R3-R3-09 mục 4: dup.respiratory_biologic critical alert on >= 2 monoclonal biologics
    const bioDups = checkDuplicates(
      [{ drugId: 'dupilumab', name: 'Dupixent' }],
      [
        {
          id: 'start_mepo',
          module: 'asthma',
          tier: 'Sinh học Bậc 5',
          action: 'START',
          drugId: 'mepolizumab',
          title: 'Khởi trị Mepolizumab',
          rationale: 'Test',
          gates: [],
          citationIds: ['gina.asthma.2026.step5_biologics'],
          priority: 80
        }
      ]
    );
    expect(bioDups.some((a) => a.id === 'dup.respiratory_biologic' && a.severity === 'critical')).toBe(true);

    // 4. COPD-R3-R3-17: Dynamic module inference in reviewMeds (never hardcoded 'ckd' when only ['copd'] is selected)
    const copdMilkAllergyPt: Patient = {
      age: 64,
      sex: 'male',
      currentMeds: [{ drugId: 'fluticasone_furoate_umeclidinium_vilanterol', name: 'Trelegy Ellipta' }],
      selectedModules: ['copd'],
      conditions: { copd: true },
      customInputs: { severeMilkProteinAllergy: true }
    };
    const copdReviews = reviewCurrentMedications(copdMilkAllergyPt, { egfr: 80 }, defaultSettings);
    const trelegyStop = copdReviews.find((r) => r.drugId === 'fluticasone_furoate_umeclidinium_vilanterol');
    expect(trelegyStop?.action).toBe('STOP');
    expect(trelegyStop?.module).toBe('copd');
  });

  it('Part B (kb/interactions/*.json): verifies AF, CKD, COPD, and Lipid R2/R3 interaction fixes & expansions', () => {
    const makePt = (meds: Array<{ drugId: string; dose?: number | string }>): Patient => ({
      age: 65,
      currentMeds: meds,
      selectedModules: ['lipid', 'af', 'ckd', 'dm2', 'copd'],
      conditions: {}
    });

    // 1. AF-R2-R1-11: Edoxaban + Verapamil does NOT trigger 30 mg cap, while Edoxaban + Dronedarone DOES
    expect(
      checkInteractions(makePt([{ drugId: 'edoxaban', dose: 60 }, { drugId: 'verapamil' }]), {}, []).some(
        (a) => a.id === 'ix.edoxaban_p_gp_inhibitors'
      )
    ).toBe(false);
    const edoxDrone = checkInteractions(
      makePt([{ drugId: 'edoxaban', dose: 60 }, { drugId: 'dronedarone' }]),
      {},
      []
    ).find((a) => a.id === 'ix.edoxaban_p_gp_inhibitors');
    expect(edoxDrone?.severity).toBe('critical');

    // 2. CKD-R3-R2-02 & CKD-R3-R2-09 & CKD-R3-R2-06:
    expect(interaction('ix.finerenone_moderate_cyp3a4').doseLimit).toBeUndefined();
    const fineDilt = checkInteractions(
      makePt([{ drugId: 'finerenone', dose: 20 }, { drugId: 'diltiazem' }]),
      {},
      []
    ).find((a) => a.id === 'ix.finerenone_moderate_cyp3a4');
    expect(fineDilt?.severity).toBe('warning');

    const fineSpiroAlerts = checkInteractions(makePt([{ drugId: 'finerenone' }, { drugId: 'spironolactone' }]), {}, []);
    expect(fineSpiroAlerts.some((a) => a.id === 'ix.dual_mra')).toBe(true);
    expect(fineSpiroAlerts.some((a) => a.id === 'ix.finerenone_k_sparing_diuretics')).toBe(false);
    expect(
      checkInteractions(makePt([{ drugId: 'finerenone' }, { drugId: 'amiloride' }]), {}, []).some(
        (a) => a.id === 'ix.finerenone_k_sparing_diuretics'
      )
    ).toBe(true);

    expect(
      checkInteractions(makePt([{ drugId: 'semaglutide' }, { drugId: 'gliclazide' }]), {}, []).some(
        (a) => a.id === 'ix.glp1ra_insulin_su' && a.severity === 'warning'
      )
    ).toBe(true);

    // 3. COPD-R3-R2-03: Salmeterol + Erythromycin & Umeclidinium/Vilanterol + Nirmatrelvir/ritonavir trigger ix.ics_laba_strong_cyp3a4, while Tiotropium does NOT
    expect(
      checkInteractions(makePt([{ drugId: 'salmeterol' }, { drugId: 'erythromycin' }]), {}, []).some(
        (a) => a.id === 'ix.ics_laba_strong_cyp3a4'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'umeclidinium_vilanterol' }, { drugId: 'nirmatrelvir_ritonavir' }]), {}, []).some(
        (a) => a.id === 'ix.ics_laba_strong_cyp3a4'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'tiotropium' }, { drugId: 'clarithromycin' }]), {}, []).some(
        (a) => a.id === 'ix.ics_laba_strong_cyp3a4'
      )
    ).toBe(false);

    // 4. Lipid R2/R3: Pravastatin + Bempedoic (40 mg cap) vs Simvastatin + Bempedoic (20 mg cap), plus new Lipid DDIs
    const pravaBempAlerts = checkInteractions(
      makePt([{ drugId: 'pravastatin', dose: 80 }, { drugId: 'bempedoic_acid' }]),
      {},
      []
    );
    expect(pravaBempAlerts.some((a) => a.id === 'ix.pravastatin_bempedoic')).toBe(true);
    expect(pravaBempAlerts.some((a) => a.id === 'ix.statin_bempedoic')).toBe(false);
    expect(interaction('ix.pravastatin_bempedoic').doseLimit?.maxDose).toBe(40);
    expect(interaction('ix.statin_bempedoic').doseLimit?.maxDose).toBe(20);

    expect(
      checkInteractions(makePt([{ drugId: 'pravastatin', dose: 80 }, { drugId: 'clarithromycin' }]), {}, []).some(
        (a) => a.id === 'ix.pravastatin_clarithromycin'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'simvastatin', dose: 20 }, { drugId: 'dronedarone' }]), {}, []).some(
        (a) => a.id === 'ix.simvastatin_dronedarone'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'simvastatin', dose: 40 }, { drugId: 'ranolazine' }]), {}, []).some(
        (a) => a.id === 'ix.simvastatin_ranolazine'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'rosuvastatin', dose: 40 }, { drugId: 'ticagrelor' }]), {}, []).some(
        (a) => a.id === 'ix.rosuvastatin_ticagrelor_febuxostat'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'rosuvastatin', dose: 40 }, { drugId: 'febuxostat' }]), {}, []).some(
        (a) => a.id === 'ix.rosuvastatin_ticagrelor_febuxostat'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'fenofibrate' }, { drugId: 'warfarin' }]), {}, []).some(
        (a) => a.id === 'ix.fibrate_warfarin' && a.severity === 'critical'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'rosuvastatin' }, { drugId: 'warfarin' }]), {}, []).some(
        (a) => a.id === 'ix.rosuvastatin_warfarin' && a.severity === 'warning'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'fenofibrate' }, { drugId: 'rosuvastatin' }]), {}, []).some(
        (a) => a.id === 'ix.fenofibrate_statin' && a.severity === 'warning'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'fenofibrate' }, { drugId: 'colchicine' }]), {}, []).some(
        (a) => a.id === 'ix.fenofibrate_colchicine' && a.severity === 'critical'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'ezetimibe' }, { drugId: 'cyclosporine' }]), {}, []).some(
        (a) => a.id === 'ix.ezetimibe_cyclosporine' && a.severity === 'critical'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'ezetimibe' }, { drugId: 'cholestyramine' }]), {}, []).some(
        (a) => a.id === 'ix.ezetimibe_bile_acid_resin' && a.severity === 'warning'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'pitavastatin' }, { drugId: 'cyclosporine' }]), {}, []).some(
        (a) => a.id === 'ix.statin_cyclosporine'
      )
    ).toBe(true);
    expect(
      checkInteractions(makePt([{ drugId: 'atorvastatin' }, { drugId: 'nirmatrelvir_ritonavir' }]), {}, []).some(
        (a) => a.id === 'ix.statin_itraconazole'
      )
    ).toBe(true);
  });

  it('8. DM2-R3-R1-09 & DM2-R3-R1-03: preserves CONTINUE Metformin <= 1000 mg/day in CKD G3b, blocks new START as AVOID, and detects Premix + Basal/Bolus stacking without flagging Basal-Bolus', () => {
    const baseMetRec = (action: Recommendation['action'], dose?: string): Recommendation => ({
      id: 'rec_dm2_metformin',
      module: 'dm2',
      tier: 'Kiểm soát đường huyết',
      action,
      drugId: 'metformin',
      dose,
      title: 'Metformin',
      rationale: 'Test',
      gates: [],
      citationIds: ['fda.metformin.egfr_bands'],
      priority: 85
    });

    const lowDosePt: Patient = {
      age: 65,
      sex: 'male',
      scr: 160,
      conditions: { dm: true },
      // Known 500 mg/day regimen; a missing frequency is tested separately as DEFER.
      currentMeds: [{ drugId: 'metformin', dose: 500, unit: 'mg', freq: 'qd' }],
      selectedModules: ['dm2']
    };
    expect(evaluateSafetyGates(baseMetRec('CONTINUE', '500 mg/ngày'), lowDosePt, { egfr: 38 }, defaultSettings).updatedRec.action).toBe('CONTINUE');

    const highDosePt: Patient = {
      ...lowDosePt,
      currentMeds: [{ drugId: 'metformin', dose: 850, unit: 'mg', freq: '2 lần/ngày' }]
    };
    expect(evaluateSafetyGates(baseMetRec('CONTINUE'), highDosePt, { egfr: 38 }, defaultSettings).updatedRec.action).toBe('REDUCE');

    const naivePt: Patient = { ...lowDosePt, currentMeds: [] };
    expect(evaluateSafetyGates(baseMetRec('START'), naivePt, { egfr: 38 }, defaultSettings).updatedRec.action).toBe('AVOID');

    // DM2-R3-R1-03: Valid Basal-Bolus does NOT trigger dup.premix_basal_bolus
    expect(
      checkDuplicates([{ drugId: 'insulin_glargine' }, { drugId: 'insulin_aspart' }], []).some(
        (a) => a.id === 'dup.premix_basal_bolus'
      )
    ).toBe(false);

    // Premix + Basal, Premix + Bolus, and Triple-Insulin Stacking DO trigger dup.premix_basal_bolus
    expect(
      checkDuplicates([{ drugId: 'mixtard' }, { drugId: 'insulin_glargine' }], []).some(
        (a) => a.id === 'dup.premix_basal_bolus' && a.severity === 'critical'
      )
    ).toBe(true);
    expect(
      checkDuplicates([{ drugId: 'insulin_premix' }, { drugId: 'insulin_aspart' }], []).some(
        (a) => a.id === 'dup.premix_basal_bolus'
      )
    ).toBe(true);
    expect(
      checkDuplicates([{ drugId: 'novomix' }, { drugId: 'insulin_glargine' }, { drugId: 'insulin_lispro' }], []).some(
        (a) => a.id === 'dup.premix_basal_bolus' && a.drugIds?.length === 3
      )
    ).toBe(true);
  });
});
