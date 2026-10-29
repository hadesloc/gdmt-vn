import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

vi.mock('../../src/kb-types/access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/kb-types/access')>();
  return {
    ...actual,
    tryGetDrug:
      (actual as Record<string, unknown>).tryGetDrug ??
      ((id: string) => (actual.hasDrug(id) ? actual.drug(id) : undefined)),
  };
});
import {
  validateInteractionRule,
  validateCitation,
  validateSource,
  validateReviewState,
  validateThreshold,
  validateDrugEntry,
  type InteractionRule,
  type Citation,
  type Source,
  type ReviewState,
  type Threshold,
  type DrugEntry,
} from '../../src/kb-types/index';
import {
  interaction,
  hasInteraction,
  getAllInteractions,
  hasThreshold,
  hasDrug,
  drug,
} from '../../src/kb-types/access';
import { computeContentHash, loadKbDataFromFs } from '../../src/kb-types/node';
import { verifyCitation, LIBRARY_ROOT } from '../../tools/kb/citations';
import { checkInteractions } from '../../src/engine/safety/interactions';
import type { Patient } from '../../src/engine/types';

const KB_DIR = existsSync(resolve(process.cwd(), 'kb'))
  ? resolve(process.cwd(), 'kb')
  : resolve(process.cwd(), 'gdmt-vn', 'kb');

function loadGlobalCitationsMap(): Map<string, Citation> {
  const map = new Map<string, Citation>();
  const citDir = join(KB_DIR, 'citations');
  for (const fname of readdirSync(citDir)) {
    if (!fname.endsWith('.json') || fname.startsWith('_')) continue;
    const list: Citation[] = JSON.parse(readFileSync(join(citDir, fname), 'utf8'));
    for (const c of list) {
      map.set(c.id, c);
    }
  }
  return map;
}

describe('validateInteractionRule', () => {
  it('chấp nhận InteractionRule cặp (a + b) có doseLimit hợp lệ', () => {
    const res = validateInteractionRule({
      id: 'ix.statin_clarithromycin',
      titleVi: 'Tương tác Statin + Clarithromycin',
      severity: 'major',
      a: { drugIds: ['atorvastatin', 'simvastatin'], classes: ['statin'] },
      b: { drugIds: ['clarithromycin'], classes: ['macrolide'] },
      mechanismVi: 'Ức chế mạnh CYP3A4 làm tăng AUC statin.',
      effectVi: 'Tăng nguy cơ tiêu cơ vân cấp.',
      managementVi: 'Giới hạn liều atorvastatin tối đa 20 mg/ngày.',
      doseLimit: {
        drugId: 'atorvastatin',
        maxDose: 20,
        unit: 'mg',
        frequency: '1 lần/ngày',
      },
      citationIds: ['fda.atorvastatin.clarithromycin_dose_cap'],
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('chấp nhận InteractionRule đa thành phần (members + minCount)', () => {
    const res = validateInteractionRule({
      id: 'ix.qt_multi_drug_pool',
      titleVi: 'Cảnh báo phối hợp >= 2 thuốc kéo dài khoảng QT',
      severity: 'major',
      members: [{ drugIds: ['amiodarone', 'sotalol', 'azithromycin'], classes: ['qt_known'] }],
      minCount: 2,
      mechanismVi: 'Cộng dồn ức chế dòng kali I_Kr.',
      effectVi: 'Xoắn đỉnh (Torsades de Pointes).',
      managementVi: 'Tránh phối hợp và theo dõi điện tâm đồ QTc.',
      citationIds: ['fda.amiodarone.qt_prolonging_drugs_avoid'],
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('từ chối khi id không bắt đầu bằng ix., severity sai, hoặc thiếu target/citationIds', () => {
    const res = validateInteractionRule({
      id: 'statin_clarithromycin',
      titleVi: 'Thiếu tiền tố ix.',
      severity: 'critical',
      a: {},
      b: { drugIds: [] },
      mechanismVi: '',
      effectVi: 'Tiêu cơ vân',
      managementVi: 'Ngừng thuốc',
      doseLimit: { drugId: '', maxDose: -5, unit: '' },
      citationIds: [],
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('bắt đầu bằng "ix."'))).toBe(true);
    expect(res.errors.some((e) => e.includes('severity'))).toBe(true);
    expect(res.errors.some((e) => e.includes('mechanismVi'))).toBe(true);
    expect(res.errors.some((e) => e.includes('citationIds'))).toBe(true);
  });
});

describe('Interactions Knowledge Base (kb/interactions/*.json & citations & reviews)', () => {
  const categoryFiles = [
    'statin.json',
    'lipid_ddi.json',
    'anticoagulant.json',
    'cardiovascular.json',
    'qt_prolongation.json',
    'renal_rasi.json',
    'gout_metabolic.json',
    'diabetes_respiratory.json',
    'respiratory.json',
    'endocrine_ddi.json',
  ];

  it('nạp đầy đủ >= 100 luật tương tác thuốc qua cả Vite accessor và Node FS loader', () => {
    const viaAccess = getAllInteractions();
    const { interactions: viaFs } = loadKbDataFromFs(resolve(KB_DIR, '..'));

    expect(viaAccess.length).toBeGreaterThanOrEqual(100);
    expect(viaFs.size).toBe(viaAccess.length);
    expect(hasInteraction('ix.statin_clarithromycin')).toBe(true);
    expect(hasInteraction('ix.triple_whammy')).toBe(true);
    expect(hasInteraction('ix.ivabradine_diltiazem_verapamil')).toBe(true);
    expect(hasInteraction('ix.ivabradine_non_dhp_ccb')).toBe(false);
    expect(interaction('ix.statin_clarithromycin').doseLimit?.maxDose).toBe(20);
    expect(() => interaction('ix.non_existent_rule')).toThrow(/Không tìm thấy InteractionRule/);
  });

  it('mọi luật trong toàn bộ 10 tệp chuyên đề đều hợp lệ schema, không trùng ID, 0 citation treo & ReviewState khớp hash', () => {
    const sources: Source[] = JSON.parse(readFileSync(join(KB_DIR, 'sources.json'), 'utf8'));
    const sourcesMap = new Map(sources.map((s) => [s.id, s]));

    for (const citFile of ['interactions.json', 'interactions_lipid.json']) {
      const ixCitations: Citation[] = JSON.parse(
        readFileSync(join(KB_DIR, 'citations', citFile), 'utf8')
      );
      for (const c of ixCitations) {
        const cVal = validateCitation(c);
        expect(cVal.valid, `Citation ${c.id} lỗi: ${cVal.errors.join('; ')}`).toBe(true);
        expect(c.quote.includes('\f'), `Citation ${c.id} còn chứa ký tự form-feed \\f`).toBe(false);
        const src = sourcesMap.get(c.sourceId);
        expect(src, `Citation ${c.id} thiếu sourceId ${c.sourceId} trong kb/sources.json`).toBeDefined();
        expect(validateSource(src).valid).toBe(true);
      }
    }

    const citationsMap = loadGlobalCitationsMap();
    const seenRuleIds = new Set<string>();
    let totalRules = 0;

    for (const fileName of categoryFiles) {
      const fullPath = join(KB_DIR, 'interactions', fileName);
      expect(existsSync(fullPath), `Thiếu tệp kb/interactions/${fileName}`).toBe(true);
      const rules: InteractionRule[] = JSON.parse(readFileSync(fullPath, 'utf8'));
      expect(rules.length).toBeGreaterThan(0);

      for (const rule of rules) {
        totalRules++;
        expect(seenRuleIds.has(rule.id), `Trùng lặp rule ID: ${rule.id}`).toBe(false);
        seenRuleIds.add(rule.id);

        const rVal = validateInteractionRule(rule);
        expect(rVal.valid, `Rule ${rule.id} lỗi schema: ${rVal.errors.join('; ')}`).toBe(true);

        for (const cid of rule.citationIds) {
          expect(
            citationsMap.has(cid),
            `Rule ${rule.id} (${fileName}) tham chiếu citationId "${cid}" không tồn tại trong kb/citations/*.json`
          ).toBe(true);
        }

        const reviewPath = join(KB_DIR, 'review', `${rule.id}.json`);
        expect(existsSync(reviewPath), `Thiếu ReviewState tại kb/review/${rule.id}.json`).toBe(true);
        const rev: ReviewState = JSON.parse(readFileSync(reviewPath, 'utf8'));
        expect(validateReviewState(rev).valid).toBe(true);
        expect(rev.hashVersion).toBe('sha256-json-v2');
        expect(rev.contentHash).toBe(computeContentHash(rule));
      }
    }

    expect(totalRules).toBeGreaterThanOrEqual(100);
  });
});

describe('QA-10 _sample.json compliance & sample exclusion', () => {
  it('kb/thresholds/_sample.json có đầy đủ quantity và hợp lệ schema', () => {
    const sampleThresholds: Threshold[] = JSON.parse(
      readFileSync(join(KB_DIR, 'thresholds', '_sample.json'), 'utf8')
    );
    expect(sampleThresholds.length).toBeGreaterThan(0);
    for (const t of sampleThresholds) {
      expect(validateThreshold(t).valid).toBe(true);
      expect(typeof t.quantity).toBe('string');
      expect(t.quantity!.trim().length).toBeGreaterThan(0);
    }
  });

  it('kb/drugs/_sample.json có đầy đủ pregnancy + classes và hợp lệ schema', () => {
    const sampleDrugs: DrugEntry[] = JSON.parse(
      readFileSync(join(KB_DIR, 'drugs', '_sample.json'), 'utf8')
    );
    expect(sampleDrugs.length).toBeGreaterThan(0);
    for (const d of sampleDrugs) {
      expect(validateDrugEntry(d).valid).toBe(true);
      expect(d.pregnancy?.status).toBeDefined();
      expect(Array.isArray(d.classes)).toBe(true);
      expect(d.classes!.length).toBeGreaterThan(0);
    }
  });

  it('bỏ qua các tệp mẫu _*.json khi nạp danh mục thật trong access.ts và node.ts (không ghi đè trên NTFS)', () => {
    expect(hasThreshold('hf.sglt2i.target_dose')).toBe(false);
    const { thresholds, drugs } = loadKbDataFromFs(resolve(KB_DIR, '..'));
    expect(thresholds.has('hf.sglt2i.target_dose')).toBe(false);
    expect(hasThreshold('ckd.sglt2i.egfr_initiate_min')).toBe(true);
    expect(drugs.has('dapagliflozin')).toBe(true);
    expect(drug('dapagliflozin').id).toBe('dapagliflozin');
  });
});

describe('Vòng 2 Tinh chỉnh Interactions (CKD-R2-R2-01, CKD-R2-R2-06, COPD-R2-202, HTN-R2-09)', () => {
  const makePatient = (drugIds: string[]): Patient => ({
    currentMeds: drugIds.map((drugId) => ({ drugId })),
    selectedModules: [],
    conditions: {},
  });

  it('CKD-R2-R2-01: phủ đầy đủ 6 ACEi và 6 ARB trong ix.rasi_mra_potassium_sparing và kích hoạt checkInteractions thực tế', () => {
    const rule = interaction('ix.rasi_mra_potassium_sparing');
    const expectedAceis = ['captopril', 'enalapril', 'imidapril', 'lisinopril', 'perindopril', 'ramipril'];
    const expectedArbs = ['candesartan', 'irbesartan', 'losartan', 'olmesartan', 'telmisartan', 'valsartan'];

    for (const id of [...expectedAceis, ...expectedArbs]) {
      expect(rule.a?.drugIds).toContain(id);
    }

    for (const rasiId of ['telmisartan', 'irbesartan', 'candesartan', 'olmesartan', 'imidapril']) {
      const alerts = checkInteractions(makePatient([rasiId, 'amiloride']), {}, []);
      expect(
        alerts.some((a) => a.id === 'ix.rasi_mra_potassium_sparing'),
        `Thiếu cảnh báo ix.rasi_mra_potassium_sparing cho ${rasiId} + amiloride`
      ).toBe(true);
    }
  });

  it('CKD-R2-R2-06: ix.potassium_binder_drug_binding phân tầng rõ SZC >= 2h, Patiromer >= 3h và CPS >= 3h (6h khi liệt dạ dày)', () => {
    const rule = interaction('ix.potassium_binder_drug_binding');
    expect(rule.a?.drugIds).toEqual(
      expect.arrayContaining(['sodium_zirconium_cyclosilicate', 'patiromer', 'calcium_polystyrene_sulfonate'])
    );
    expect(rule.managementVi).toContain('2 giờ');
    expect(rule.managementVi).toContain('3 giờ');
    expect(rule.managementVi).toContain('6 giờ');
    expect(rule.citationIds).toEqual(
      expect.arrayContaining([
        'fda.szc.separation_2_hours',
        'fda.patiromer.separation_3_hours',
        'ukka.2022.cps_separation_3h_6h_gastroparesis',
        'kdigo.ckd.2024.polystyrene_sulfonate_separation_3h_6h',
      ])
    );

    const cpsAlerts = checkInteractions(makePatient(['calcium_polystyrene_sulfonate', 'amlodipine']), {}, []);
    expect(cpsAlerts.some((a) => a.id === 'ix.potassium_binder_drug_binding')).toBe(true);
  });

  it('COPD-R2-202: sửa trích dẫn nguyên văn fda.roflumilast.concomitant_theophylline và bổ sung CYP3A4 inducers / CYP inhibitors', () => {
    const ixCitations: Citation[] = JSON.parse(
      readFileSync(join(KB_DIR, 'citations', 'interactions.json'), 'utf8')
    );
    const theoCite = ixCitations.find((c) => c.id === 'fda.roflumilast.concomitant_theophylline');
    expect(theoCite).toBeDefined();
    expect(theoCite!.pdfPage).toBe(16);
    expect(theoCite!.quote).toBe(
      'The use of long-acting beta agonists, long-acting anti-muscarinics, and theophylline were prohibited.'
    );

    expect(interaction('ix.roflumilast_theophylline').severity).toBe('major');
    expect(interaction('ix.roflumilast_cyp3a4_inducers').severity).toBe('contraindicated');
    expect(interaction('ix.roflumilast_cyp_inhibitors').severity).toBe('major');

    const rifAlerts = checkInteractions(makePatient(['roflumilast', 'rifampicin']), {}, []);
    expect(rifAlerts.some((a) => a.id === 'ix.roflumilast_cyp3a4_inducers' && a.severity === 'critical')).toBe(true);

    const eryAlerts = checkInteractions(makePatient(['roflumilast', 'erythromycin']), {}, []);
    expect(eryAlerts.some((a) => a.id === 'ix.roflumilast_cyp_inhibitors')).toBe(true);
  });

  it('HTN-R2-09: hoạt động chính xác 4 nhóm tương tác tăng huyết áp mà không báo dương tính giả trên amlodipine/methyldopa', () => {
    const lercAlerts = checkInteractions(makePatient(['lercanidipine', 'cyclosporine']), {}, []);
    expect(lercAlerts.some((a) => a.id === 'ix.lercanidipine_cyp3a4_cyclosporine' && a.severity === 'critical')).toBe(
      true
    );
    const amloAlerts = checkInteractions(makePatient(['amlodipine', 'cyclosporine']), {}, []);
    expect(amloAlerts.some((a) => a.id === 'ix.lercanidipine_cyp3a4_cyclosporine')).toBe(false);

    const clonBbAlerts = checkInteractions(makePatient(['clonidine', 'bisoprolol']), {}, []);
    expect(clonBbAlerts.some((a) => a.id === 'ix.alpha2_agonist_beta_blocker_rebound')).toBe(true);
    const methBbAlerts = checkInteractions(makePatient(['methyldopa', 'labetalol']), {}, []);
    expect(methBbAlerts.some((a) => a.id === 'ix.alpha2_agonist_beta_blocker_rebound')).toBe(false);

    const snpAlerts = checkInteractions(makePatient(['sodium_nitroprusside', 'sildenafil']), {}, []);
    expect(snpAlerts.some((a) => a.id === 'ix.nitroprusside_pde5i' && a.severity === 'critical')).toBe(true);

    const labDiltAlerts = checkInteractions(makePatient(['labetalol', 'diltiazem']), {}, []);
    expect(labDiltAlerts.some((a) => a.id === 'ix.bb_non_dhp_ccb')).toBe(true);
    const esmVerAlerts = checkInteractions(makePatient(['esmolol', 'verapamil']), {}, []);
    expect(esmVerAlerts.some((a) => a.id === 'ix.bb_non_dhp_ccb')).toBe(true);
    const clonDiltAlerts = checkInteractions(makePatient(['clonidine', 'diltiazem']), {}, []);
    expect(clonDiltAlerts.some((a) => a.id === 'ix.clonidine_non_dhp_ccb')).toBe(true);
  });

  it('ASTHMA-R2-207 (B5 Esterase update), DM2-R2-R2-04, ASTHMA-R2-203 & Insulin sync: loại trừ Beclometasone khỏi CYP3A4 mạnh, Saxagliptin trần 2.5 mg, Timolol nhỏ mắt và insulin_regular', () => {
    // 1. ASTHMA-R2-207 + B5: Fluticasone / Budesonide / Mometasone bị chặn với CYP3A4 mạnh, nhưng Beclometasone (chuyển hóa qua esterase) KHÔNG bị bắt nhầm
    const icsCypRule = interaction('ix.ics_laba_strong_cyp3a4');
    expect(icsCypRule.severity).toBe('major');
    expect(icsCypRule.a?.classes).toBeUndefined();
    for (const d of [
      'fluticasone_propionate',
      'fluticasone_salmeterol',
      'fluticasone_vilanterol',
      'fluticasone_umeclidinium_vilanterol',
      'budesonide',
      'budesonide_formoterol',
      'budesonide_glycopyrronium_formoterol',
      'mometasone',
    ]) {
      expect(icsCypRule.a?.drugIds).toContain(d);
    }
    for (const becloId of [
      'beclometasone',
      'beclometasone_formoterol',
      'beclometasone_formoterol_glycopyrronium',
      'beclometasone_glycopyrronium_formoterol',
    ]) {
      expect(icsCypRule.a?.drugIds).not.toContain(becloId);
    }

    const flutRitoAlerts = checkInteractions(makePatient(['fluticasone_salmeterol', 'ritonavir']), {}, []);
    expect(flutRitoAlerts.some((a) => a.id === 'ix.ics_laba_strong_cyp3a4')).toBe(true);

    const fosterClariAlerts = checkInteractions(makePatient(['beclometasone_formoterol', 'clarithromycin']), {}, []);
    expect(fosterClariAlerts.some((a) => a.id === 'ix.ics_laba_strong_cyp3a4')).toBe(false);

    // 2. DM2-R2-R2-04: Saxagliptin + Strong CYP3A4/5 -> giới hạn tối đa 2.5 mg/ngày
    const saxRule = interaction('ix.saxagliptin_strong_cyp3a4');
    expect(saxRule.doseLimit?.drugId).toBe('saxagliptin');
    expect(saxRule.doseLimit?.maxDose).toBe(2.5);
    const saxAlerts = checkInteractions(
      {
        currentMeds: [{ drugId: 'saxagliptin', dose: '5 mg' }, { drugId: 'clarithromycin' }],
        selectedModules: [],
        conditions: {},
      },
      {},
      []
    );
    const saxAlert = saxAlerts.find((a) => a.id === 'ix.saxagliptin_strong_cyp3a4');
    expect(saxAlert).toBeDefined();
    expect(saxAlert!.severity).toBe('critical');
    expect(saxAlert!.messageVi).toContain('2.5 mg');

    const sitaAlerts = checkInteractions(makePatient(['sitagliptin', 'clarithromycin']), {}, []);
    expect(sitaAlerts.some((a) => a.id === 'ix.saxagliptin_strong_cyp3a4')).toBe(false);

    // 3. Đồng bộ insulin_regular trên cả 3 rule tương tác insulin
    for (const ruleId of ['ix.su_fluoroquinolones', 'ix.pioglitazone_insulin_hf', 'ix.sglt2i_su_insulin_hypoglycemia']) {
      const r = interaction(ruleId);
      const allIds = [...(r.a?.drugIds || []), ...(r.b?.drugIds || [])];
      expect(allIds).toContain('insulin_regular');
    }

    // 4. ASTHMA-R2-203: Cả timolol và timolol_ophthalmic đều có mặt trong chẹn beta không chọn lọc gây co thắt phế quản
    for (const ruleId of ['ix.bb_non_selective_asthma', 'ix.bb_beta2_agonist']) {
      const r = interaction(ruleId);
      expect(r.a?.drugIds).toEqual(expect.arrayContaining(['timolol', 'timolol_ophthalmic']));
    }
    const timoAsthmaAlerts = checkInteractions(
      {
        currentMeds: [{ drugId: 'timolol_ophthalmic' }],
        selectedModules: ['asthma'],
        conditions: { asthma: true },
      },
      {},
      []
    );
    expect(timoAsthmaAlerts.some((a) => a.id === 'ix.bb_non_selective_asthma')).toBe(true);

    const timoCopdAlerts = checkInteractions(makePatient(['timolol_ophthalmic', 'salbutamol']), {}, []);
    expect(timoCopdAlerts.some((a) => a.id === 'ix.bb_beta2_agonist')).toBe(true);
  });

  const hasLibrary = existsSync(LIBRARY_ROOT);
  it.runIf(hasLibrary)('xác minh 100% trích dẫn trong kb/citations/interactions.json và interactions_lipid.json khớp nguyên văn PDF đúng trang', () => {
    const sources: Source[] = JSON.parse(readFileSync(join(KB_DIR, 'sources.json'), 'utf8'));
    const sourcesMap = new Map(sources.map((s) => [s.id, s]));

    for (const citFile of ['interactions.json', 'interactions_lipid.json']) {
      const ixCitations: Citation[] = JSON.parse(
        readFileSync(join(KB_DIR, 'citations', citFile), 'utf8')
      );
      for (const cite of ixCitations) {
        const src = sourcesMap.get(cite.sourceId)!;
        const res = verifyCitation(cite, src);
        expect(res.ok, `Citation ${cite.id} (${citFile}) không khớp PDF: ${JSON.stringify(res.findings)}`).toBe(true);
      }
    }
  });
});

describe('Batch 5: 17 Thuốc dùng chung & Tương tác Lâm sàng Ưu tiên cao', () => {
  const makePatient = (drugIds: string[], asthma = false): Patient => ({
    currentMeds: drugIds.map((drugId) => ({ drugId })),
    selectedModules: asthma ? ['asthma'] : [],
    conditions: asthma ? { asthma: true } : {},
  });

  const b5DrugIds = [
    'acenocoumarol',
    'enoxaparin',
    'heparin',
    'lovastatin',
    'fluvastatin',
    'cholestyramine',
    'colesevelam',
    'formoterol',
    'ipratropium_salbutamol',
    'ipratropium_fenoterol',
    'ensifentrine',
    'hydrocortisone',
    'propranolol',
    'fluticasone_umeclidinium_vilanterol',
    'dupilumab',
    'budesonide_glycopyrronium_formoterol',
    'beclometasone_glycopyrronium_formoterol',
  ];

  it('nạp đầy đủ 17 thuốc dùng chung mới/cập nhật với schema hợp lệ, 0 citation treo và ReviewState khớp hash', () => {
    const citationsMap = loadGlobalCitationsMap();

    for (const id of b5DrugIds) {
      expect(hasDrug(id), `Thiếu thuốc ${id} trong KB accessor`).toBe(true);
      const d = drug(id);
      const val = validateDrugEntry(d);
      expect(val.valid, `Drug ${id} lỗi schema: ${val.errors.join('; ')}`).toBe(true);
      expect(d.pregnancy?.status).toBeDefined();
      expect(d.lactation?.status).toBeDefined();
      expect(d.classes && d.classes.length > 0).toBe(true);

      for (const cid of d.citationIds) {
        expect(citationsMap.has(cid), `Drug ${id} thiếu citation ${cid}`).toBe(true);
      }
      for (const rb of d.renal) {
        for (const cid of rb.citationIds) {
          expect(citationsMap.has(cid), `Drug ${id} renal thiếu citation ${cid}`).toBe(true);
        }
      }

      const revPath = join(KB_DIR, 'review', `${id}.json`);
      expect(existsSync(revPath), `Thiếu review cho ${id}`).toBe(true);
      const rev: ReviewState = JSON.parse(readFileSync(revPath, 'utf8'));
      expect(rev.contentHash).toBe(computeContentHash(d));
    }

    // Kiểm tra các cập nhật chuẩn hóa trên 3 thuốc hiện hữu + alias Trelegy
    expect(drug('dupilumab').gates?.some((g) => g.parameter === 'eos' && g.threshold === 1500)).toBe(true);
    expect(
      (drug('budesonide_glycopyrronium_formoterol').forms || []).some((f) =>
        f.toLowerCase().includes('hen')
      )
    ).toBe(true);
    expect(drug('budesonide_glycopyrronium_formoterol').gates?.some((g) => g.parameter === 'age' && g.threshold === 12)).toBe(true);
    expect(drug('beclometasone_glycopyrronium_formoterol').gates?.some((g) => g.parameter === 'age' && g.threshold === 18)).toBe(true);
    expect(drug('fluticasone_umeclidinium_vilanterol').id).toBe('fluticasone_umeclidinium_vilanterol');
  });

  it('hoạt động chuẩn xác trên toàn bộ các cặp tương tác B5 mới mà không gây dương tính giả', () => {
    // 1. Gout: Benzbromarone + VKA, Colchicine + Nirmatrelvir/ritonavir, Celecoxib + Fluconazole, Probenecid + Ketorolac & tách biệt XOI
    expect(checkInteractions(makePatient(['benzbromarone', 'acenocoumarol']), {}, []).some((a) => a.id === 'ix.benzbromarone_vka' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['colchicine', 'nirmatrelvir_ritonavir']), {}, []).some((a) => a.id === 'ix.colchicine_strong_cyp3a4' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['celecoxib', 'fluconazole']), {}, []).some((a) => a.id === 'ix.celecoxib_fluconazole')).toBe(true);
    expect(checkInteractions(makePatient(['probenecid', 'ketorolac']), {}, []).some((a) => a.id === 'ix.probenecid_ketorolac' && a.severity === 'critical')).toBe(true);
    // Febuxostat không được kích hoạt nhầm luật của Allopurinol
    expect(checkInteractions(makePatient(['febuxostat', 'amoxicillin']), {}, []).some((a) => a.id === 'ix.allopurinol_amoxicillin_ampicillin')).toBe(false);

    // 2. Anticoagulant: Clarithromycin + DOAC (moderate warning, không báo nhầm ix.doac_strong_cyp3a4_pgp_inhibitors), Strong inducers, Duplicate parenteral/VKA
    const clariApix = checkInteractions(makePatient(['apixaban', 'clarithromycin']), {}, []);
    expect(clariApix.some((a) => a.id === 'ix.clarithromycin_doac' && a.severity === 'warning')).toBe(true);
    expect(clariApix.some((a) => a.id === 'ix.doac_strong_cyp3a4_pgp_inhibitors')).toBe(false);
    expect(checkInteractions(makePatient(['apixaban', 'phenobarbital']), {}, []).some((a) => a.id === 'ix.doac_strong_inducers' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['apixaban', 'enoxaparin']), {}, []).some((a) => a.id === 'ix.duplicate_anticoagulants' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['acenocoumarol', 'metronidazole']), {}, []).some((a) => a.id === 'ix.warfarin_antibiotics')).toBe(true);

    // 3. Lipid: Rosuvastatin + Paxlovid / Darolutamide, Bile acid sequestrant + Levothyroxine / Warfarin, Fluvastatin + Fluconazole
    expect(checkInteractions(makePatient(['rosuvastatin', 'nirmatrelvir_ritonavir']), {}, []).some((a) => a.id === 'ix.rosuvastatin_oatp1b1_bcrp_inhibitors')).toBe(true);
    expect(checkInteractions(makePatient(['cholestyramine', 'levothyroxine']), {}, []).some((a) => a.id === 'ix.bile_acid_sequestrant_drug_binding')).toBe(true);
    expect(checkInteractions(makePatient(['fluvastatin', 'fluconazole']), {}, []).some((a) => a.id === 'ix.fluvastatin_clarithromycin_fluconazole')).toBe(true);

    // 4. CV & Renal: Eplerenone + Diltiazem (trần 25 mg), Ivabradine + Diltiazem, Digoxin + Dronedarone, Dronedarone + Ketoconazole, Doxazosin + Sildenafil, Methyldopa + Ferrous sulfate
    expect(checkInteractions(makePatient(['eplerenone', 'diltiazem']), {}, []).some((a) => a.id === 'ix.eplerenone_moderate_cyp3a4')).toBe(true);
    expect(checkInteractions(makePatient(['ivabradine', 'diltiazem']), {}, []).some((a) => a.id === 'ix.ivabradine_diltiazem_verapamil' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['digoxin', 'dronedarone']), {}, []).some((a) => a.id === 'ix.digoxin_pgp_inhibitors')).toBe(true);
    expect(checkInteractions(makePatient(['dronedarone', 'ketoconazole']), {}, []).some((a) => a.id === 'ix.dronedarone_strong_cyp3a4' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['doxazosin', 'sildenafil']), {}, []).some((a) => a.id === 'ix.alpha1_blocker_pde5i')).toBe(true);
    expect(checkInteractions(makePatient(['methyldopa', 'ferrous_sulfate']), {}, []).some((a) => a.id === 'ix.methyldopa_iron')).toBe(true);

    // 5. Respiratory / QT / Endocrine: LABA-LAMA không ICS ở Hen (không báo giả trên Symbicort/Seretide/Trelegy/Breztri/Trimbow/Enerzair), Domperidone + Macrolide/FQ, Tirzepatide + OCP
    expect(checkInteractions(makePatient(['glycopyrronium_indacaterol'], true), {}, []).some((a) => a.id === 'ix.laba_monotherapy_asthma' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['umeclidinium_vilanterol'], true), {}, []).some((a) => a.id === 'ix.laba_monotherapy_asthma' && a.severity === 'critical')).toBe(true);
    for (const safeAsthmaInhaler of [
      'budesonide_formoterol',
      'fluticasone_salmeterol',
      'beclometasone_formoterol',
      'fluticasone_furoate_umeclidinium_vilanterol',
      'budesonide_glycopyrronium_formoterol',
      'beclometasone_glycopyrronium_formoterol',
      'indacaterol_glycopyrronium_mometasone',
      'tiotropium',
    ]) {
      expect(
        checkInteractions(makePatient([safeAsthmaInhaler], true), {}, []).some((a) => a.id === 'ix.laba_monotherapy_asthma'),
        `Dương tính giả ix.laba_monotherapy_asthma trên ${safeAsthmaInhaler}`
      ).toBe(false);
    }

    expect(checkInteractions(makePatient(['clarithromycin', 'domperidone']), {}, []).some((a) => a.id === 'ix.qt_antibiotic_domperidone' && a.severity === 'critical')).toBe(true);
    expect(checkInteractions(makePatient(['azithromycin', 'levofloxacin']), {}, []).some((a) => a.id === 'ix.qt_macrolide_fluoroquinolone')).toBe(true);
    expect(checkInteractions(makePatient(['tirzepatide', 'ethinyl_estradiol']), {}, []).some((a) => a.id === 'ix.tirzepatide_oral_contraceptives')).toBe(true);
  });
});
