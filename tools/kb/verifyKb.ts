/**
 * GDMT-VN Knowledge Base Verification Pipeline
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  type Source,
  type Citation,
  type DrugEntry,
  type Threshold,
  type ReviewState,
  type InteractionRule,
  validateSource,
  validateCitation,
  validateDrugEntry,
  validateThreshold,
  validateReviewState,
  validateInteractionRule,
} from '../../src/kb-types/index';
import { computeContentHash } from '../../src/kb-types/node';
import { CONTENT_HASH_VERSION } from '../../src/kb-types/contentHash';
import { setCustomKbData } from '../../src/kb-types/access';
import { verifyCitation, quoteContainsNumber, LIBRARY_ROOT } from './citations';
import { scanModulesLint } from './rulesLint';

const ROOT_DIR = resolve(process.cwd(), 'gdmt-vn');
const KB_DIR = existsSync(join(ROOT_DIR, 'kb')) ? join(ROOT_DIR, 'kb') : resolve(process.cwd(), 'kb');
const REPORTS_DIR = existsSync(join(ROOT_DIR, 'reports', 'kb'))
  ? join(ROOT_DIR, 'reports', 'kb')
  : resolve(process.cwd(), 'reports', 'kb');

export interface KbFinding {
  level: 'info' | 'warn' | 'error';
  code: string;
  itemId: string;
  msg: string;
}

export interface KbVerifyReport {
  timestamp: string;
  totalSources: number;
  totalCitations: number;
  totalThresholds: number;
  totalDrugs: number;
  totalInteractions: number;
  totalReviews: number;
  errors: KbFinding[];
  warnings: KbFinding[];
  passed: boolean;
}

const DRUG_OWNER_MAP: Record<string, string[]> = {
  'Agent E (CKD)': ['canagliflozin', 'dapagliflozin', 'empagliflozin', 'captopril', 'enalapril', 'lisinopril', 'perindopril', 'ramipril', 'candesartan', 'irbesartan', 'losartan', 'telmisartan', 'valsartan', 'finerenone', 'calcium_polystyrene_sulfonate', 'patiromer', 'sodium_zirconium_cyclosilicate', 'sodium_bicarbonate', 'natri_bicarbonat'],
  'Agent F (DM2)': ['metformin', 'dulaglutide', 'liraglutide', 'semaglutide', 'semaglutide_oral', 'tirzepatide', 'linagliptin', 'saxagliptin', 'sitagliptin', 'vildagliptin', 'gliclazide', 'glimepiride', 'pioglitazone', 'acarbose', 'insulin_aspart', 'insulin_degludec', 'insulin_detemir', 'insulin_glargine', 'insulin_lispro', 'insulin_nph', 'insulin_premix'],
  'Agent G (HF)': ['sacubitril_valsartan', 'bisoprolol', 'carvedilol', 'metoprolol_succinate', 'nebivolol', 'eplerenone', 'spironolactone', 'ivabradine', 'vericiguat', 'digoxin', 'bumetanide', 'furosemide', 'torsemide', 'hydralazine', 'isosorbide_dinitrate', 'ferric_carboxymaltose', 'ferric_derisomaltose'],
  'Agent H (HTN)': ['amlodipine', 'felodipine', 'lercanidipine', 'nicardipine', 'nifedipine', 'chlorthalidone', 'hydrochlorothiazide', 'indapamide', 'clonidine', 'doxazosin', 'methyldopa', 'moxonidine', 'clevidipine', 'esmolol', 'labetalol', 'nitroglycerin', 'sodium_nitroprusside', 'urapidil'],
  'Agent I (Lipid)': ['atorvastatin', 'pitavastatin', 'pravastatin', 'rosuvastatin', 'simvastatin', 'lovastatin', 'fluvastatin', 'ezetimibe', 'alirocumab', 'evolocumab', 'inclisiran', 'bempedoic_acid', 'fenofibrate', 'icosapent_ethyl', 'omega3', 'cholestyramine', 'colesevelam'],
  'Agent J (AF)': ['apixaban', 'dabigatran', 'edoxaban', 'rivaroxaban', 'warfarin', 'acenocoumarol', 'enoxaparin', 'heparin', 'amiodarone', 'dronedarone', 'flecainide', 'propafenone', 'sotalol', 'diltiazem', 'verapamil'],
  'Agent K (Gout)': ['allopurinol', 'febuxostat', 'colchicine', 'probenecid', 'benzbromarone', 'naproxen', 'ibuprofen', 'diclofenac', 'etoricoxib', 'celecoxib', 'indomethacin'],
  'Agent L (COPD)': ['aclidinium', 'glycopyrronium', 'tiotropium', 'umeclidinium', 'indacaterol', 'olodaterol', 'salmeterol', 'vilanterol', 'formoterol', 'glycopyrronium_indacaterol', 'tiotropium_olodaterol', 'umeclidinium_vilanterol', 'beclometasone_glycopyrronium_formoterol', 'budesonide_glycopyrronium_formoterol', 'fluticasone_furoate_umeclidinium_vilanterol', 'ipratropium_salbutamol', 'ipratropium_fenoterol', 'ensifentrine', 'roflumilast', 'azithromycin', 'dupilumab', 'mepolizumab', 'theophylline'],
  'Agent M (Asthma)': ['beclometasone', 'budesonide', 'ciclesonide', 'fluticasone_furoate', 'fluticasone_propionate', 'mometasone', 'beclometasone_formoterol', 'budesonide_formoterol', 'fluticasone_salmeterol', 'fluticasone_vilanterol', 'mometasone_formoterol', 'salbutamol', 'terbutaline', 'ipratropium', 'montelukast', 'benralizumab', 'omalizumab', 'tezepelumab', 'prednisolone', 'methylprednisolone', 'hydrocortisone', 'magnesium_sulfate', 'propranolol'],
};

function readJsonFiles<T>(dir: string, mode: 'real_only' | 'samples_only' | 'all' = 'real_only'): { path: string; data: T }[] {
  const results: { path: string; data: T }[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (mode === 'real_only' && entry.name.startsWith('_')) continue;
      results.push(...readJsonFiles<T>(fullPath, mode));
    } else if (entry.name.endsWith('.json')) {
      const isSample = entry.name.startsWith('_');
      if ((mode === 'real_only' && isSample) || (mode === 'samples_only' && !isSample)) continue;
      try {
        results.push({ path: fullPath, data: JSON.parse(readFileSync(fullPath, 'utf8')) });
      } catch (err) {
        console.error(`[Error] Không đọc được JSON tại ${fullPath}: ${(err as Error).message}`);
      }
    }
  }
  return results;
}

function getDrugOwnerAgent(drugId: string): string {
  const id = drugId.toLowerCase();
  for (const [owner, list] of Object.entries(DRUG_OWNER_MAP)) if (list.includes(id)) return owner;
  return 'Chưa phân công';
}

function getThresholdOwnerAgent(thresholdId: string): string {
  const id = thresholdId.toLowerCase();
  const prefixes: [string, string][] = [
    ['ckd.', 'Agent E (CKD)'], ['dm2.', 'Agent F (DM2)'], ['hf.', 'Agent G (HF)'],
    ['htn.', 'Agent H (HTN)'], ['lipid.', 'Agent I (Lipid)'], ['af.', 'Agent J (AF)'],
    ['gout.', 'Agent K (Gout)'], ['copd.', 'Agent L (COPD)'], ['asthma.', 'Agent M (Asthma)'],
  ];
  for (const [p, owner] of prefixes) if (id.startsWith(p)) return owner;
  return 'Chung / Chưa phân công';
}

function scanTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scanTsFiles(full));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function printOwnerTable(title: string, colTitle: string, map: Record<string, string[]>, maxItems: number): void {
  console.log(title);
  console.log(`AGENT SỞ HỮU                | ${colTitle.padEnd(14)} | DANH SÁCH`);
  console.log('----------------------------+----------------+-------------------------------------------------------------');
  for (const [owner, list] of Object.entries(map)) {
    const preview = list.slice(0, maxItems).join(', ') + (list.length > maxItems ? ` ... (+${list.length - maxItems})` : '');
    console.log(`${owner.padEnd(27)} | ${String(list.length).padStart(14)} | ${preview}`);
  }
  console.log('------------------------------------------------------------');
}

export async function verifyKb(): Promise<KbVerifyReport> {
  const findings: KbFinding[] = [];
  const addFinding = (level: KbFinding['level'], code: string, itemId: string, msg: string) => {
    findings.push({ level, code, itemId, msg });
  };

  const sourcesMap = new Map<string, Source>();
  const citationsMap = new Map<string, Citation>();
  const thresholdsMap = new Map<string, Threshold>();
  const drugsMap = new Map<string, DrugEntry>();
  const interactionsMap = new Map<string, InteractionRule>();
  const reviewMap = new Map<string, ReviewState>();

  const sourcesSinglePath = join(KB_DIR, 'sources.json');
  if (existsSync(sourcesSinglePath)) {
    try {
      const list = JSON.parse(readFileSync(sourcesSinglePath, 'utf8'));
      if (Array.isArray(list)) for (const s of list) sourcesMap.set(s.id, s);
    } catch (err) {
      addFinding('error', 'PARSE_ERROR', 'sources.json', `Lỗi đọc sources.json: ${(err as Error).message}`);
    }
  }
  for (const item of readJsonFiles<Source | Source[]>(join(KB_DIR, 'sources'))) {
    for (const s of Array.isArray(item.data) ? item.data : [item.data]) if (s?.id) sourcesMap.set(s.id, s);
  }

  const citationsDir = join(KB_DIR, 'citations');
  for (const item of readJsonFiles<Citation | Citation[]>(citationsDir, 'real_only')) {
    for (const c of Array.isArray(item.data) ? item.data : [item.data]) if (c?.id) citationsMap.set(c.id, c);
  }
  for (const item of readJsonFiles<Citation | Citation[]>(citationsDir, 'samples_only')) {
    for (const c of Array.isArray(item.data) ? item.data : [item.data]) {
      if (c?.id && !citationsMap.has(c.id)) citationsMap.set(c.id, c);
    }
  }

  const thresholdsDir = join(KB_DIR, 'thresholds');
  for (const item of readJsonFiles<Threshold | Threshold[]>(thresholdsDir)) {
    for (const t of Array.isArray(item.data) ? item.data : [item.data]) if (t?.id) thresholdsMap.set(t.id, t);
  }

  const drugsDir = join(KB_DIR, 'drugs');
  for (const item of readJsonFiles<DrugEntry | DrugEntry[]>(drugsDir)) {
    for (const d of Array.isArray(item.data) ? item.data : [item.data]) if (d?.id) drugsMap.set(d.id, d);
  }

  const interactionsDir = join(KB_DIR, 'interactions');
  for (const item of readJsonFiles<InteractionRule | InteractionRule[]>(interactionsDir)) {
    if (item.path.replace(/\\/g, '/').toLowerCase().endsWith('/index.json')) continue;
    for (const ix of Array.isArray(item.data) ? item.data : [item.data]) {
      if (ix?.id) {
        if (interactionsMap.has(ix.id)) {
          addFinding('error', 'DUPLICATE_INTERACTION_ID', ix.id, `InteractionRule ${ix.id} bị định nghĩa trùng lặp tại ${item.path}`);
        }
        interactionsMap.set(ix.id, ix);
      }
    }
  }

  setCustomKbData(thresholdsMap, drugsMap, interactionsMap);

  const reviewDir = join(KB_DIR, 'review');
  for (const item of readJsonFiles<ReviewState | ReviewState[]>(reviewDir)) {
    for (const r of Array.isArray(item.data) ? item.data : [item.data]) if (r?.itemId) reviewMap.set(r.itemId, r);
  }

  // 2. SCHEMA & SAMPLE VALIDATION
  for (const s of sourcesMap.values()) {
    const val = validateSource(s);
    if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_SOURCE', s.id, e));
  }
  for (const c of citationsMap.values()) {
    const val = validateCitation(c);
    if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_CITATION', c.id, e));
  }
  for (const t of thresholdsMap.values()) {
    const val = validateThreshold(t);
    if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_THRESHOLD', t.id, e));
  }
  for (const d of drugsMap.values()) {
    const val = validateDrugEntry(d);
    if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_DRUG', d.id, e));
  }
  for (const ix of interactionsMap.values()) {
    const val = validateInteractionRule(ix);
    if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_INTERACTION', ix.id ?? '?', e));
  }
  for (const r of reviewMap.values()) {
    const val = validateReviewState(r);
    if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_REVIEW', r.itemId, e));
  }

  for (const item of readJsonFiles<Threshold | Threshold[]>(thresholdsDir, 'samples_only')) {
    for (const t of Array.isArray(item.data) ? item.data : [item.data]) {
      const val = validateThreshold(t);
      if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_SAMPLE_THRESHOLD', `_sample:${t.id ?? '?'}`, e));
      else if (!t.quantity?.trim()) addFinding('warn', 'WARN_SAMPLE_THRESHOLD_MISSING_QUANTITY', `_sample:${t.id}`, `Sample Threshold ${t.id} thiếu trường 'quantity' (QA-10).`);
    }
  }
  for (const item of readJsonFiles<DrugEntry | DrugEntry[]>(drugsDir, 'samples_only')) {
    for (const d of Array.isArray(item.data) ? item.data : [item.data]) {
      const val = validateDrugEntry(d);
      if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_SAMPLE_DRUG', `_sample:${d.id ?? '?'}`, e));
      else {
        if (!d.pregnancy?.status) addFinding('warn', 'WARN_SAMPLE_DRUG_MISSING_PREGNANCY', `_sample:${d.id}`, `Sample Drug ${d.id} thiếu trường 'pregnancy'.`);
        if (!Array.isArray(d.classes) || d.classes.length === 0) addFinding('warn', 'WARN_SAMPLE_DRUG_MISSING_CLASSES', `_sample:${d.id}`, `Sample Drug ${d.id} thiếu trường 'classes'.`);
      }
    }
  }
  for (const item of readJsonFiles<ReviewState | ReviewState[]>(reviewDir, 'samples_only')) {
    for (const r of Array.isArray(item.data) ? item.data : [item.data]) {
      const val = validateReviewState(r);
      if (!val.valid) val.errors.forEach((e) => addFinding('error', 'SCHEMA_SAMPLE_REVIEW', `_sample:${r.itemId ?? '?'}`, e));
    }
  }

  // 3. ID INTEGRITY (Source -> Citation -> Threshold, Drug [all sub-blocks], InteractionRule)
  const checkCitationRefs = (itemId: string, label: string, cids?: readonly string[]) => {
    for (const cid of cids ?? []) {
      if (!citationsMap.has(cid)) {
        addFinding('error', 'MISSING_CITATION_REF', itemId, `${label}: citationId "${cid}" không tồn tại trong citations`);
      }
    }
  };

  for (const c of citationsMap.values()) {
    if (!sourcesMap.has(c.sourceId)) {
      addFinding('error', 'MISSING_SOURCE_REF', c.id, `Citation ${c.id}: sourceId "${c.sourceId}" không tồn tại trong sources`);
    }
  }
  for (const t of thresholdsMap.values()) checkCitationRefs(t.id, `Threshold ${t.id}`, t.citationIds);
  for (const d of drugsMap.values()) {
    checkCitationRefs(d.id, `Drug ${d.id}`, d.citationIds);
    for (const r of d.renal ?? []) checkCitationRefs(d.id, `Drug ${d.id} (renal band)`, r.citationIds);
    for (const g of d.gates ?? []) checkCitationRefs(d.id, `Drug ${d.id} (gate ${g.id})`, g.citationIds);
    for (const ct of d.contraindications ?? []) checkCitationRefs(d.id, `Drug ${d.id} (contra ${ct.code})`, ct.citationIds);
    if (d.pregnancy?.citationIds) checkCitationRefs(d.id, `Drug ${d.id} (pregnancy)`, d.pregnancy.citationIds);
    if (d.lactation?.citationIds) checkCitationRefs(d.id, `Drug ${d.id} (lactation)`, d.lactation.citationIds);
  }
  for (const ix of interactionsMap.values()) {
    if (!Array.isArray(ix.citationIds) || ix.citationIds.length === 0) {
      addFinding('error', 'MISSING_CITATION_REF', ix.id, `InteractionRule ${ix.id}: thiếu mảng citationIds hợp lệ`);
    } else {
      checkCitationRefs(ix.id, `InteractionRule ${ix.id}`, ix.citationIds);
    }
    if (ix.doseLimit?.thresholdId && !thresholdsMap.has(ix.doseLimit.thresholdId)) {
      addFinding('error', 'MISSING_THRESHOLD_REF', ix.id, `InteractionRule ${ix.id}: doseLimit.thresholdId "${ix.doseLimit.thresholdId}" không tồn tại trong thresholds`);
    }
  }

  // 4. VERBATIM QUOTE & 5. ORPHAN NUMBER
  if (existsSync(LIBRARY_ROOT)) {
    for (const c of citationsMap.values()) {
      const s = sourcesMap.get(c.sourceId);
      if (!s) continue;
      for (const f of verifyCitation(c, s).findings) {
        if (f.level === 'error' || f.level === 'warn') addFinding(f.level, f.code, c.id, f.msg);
      }
    }
  }
  for (const t of thresholdsMap.values()) {
    const foundNumber = (t.citationIds ?? []).some((cid) => {
      const cite = citationsMap.get(cid);
      return Boolean(cite && quoteContainsNumber(cite.quote, t.value));
    });
    if (!foundNumber) {
      addFinding('error', 'ORPHAN_NUMBER', t.id, `Ngưỡng số ${t.value} ${t.unit} của Threshold ${t.id} KHÔNG xuất hiện trong trích dẫn [${(t.citationIds ?? []).join(', ')}]`);
    }
  }

  // 6. CONTENT HASH ↔ REVIEW STATE
  const checkableItems = [
    ...[...drugsMap.values()].map((d) => ({ id: d.id, type: 'drug', data: d })),
    ...[...thresholdsMap.values()].map((t) => ({ id: t.id, type: 'threshold', data: t })),
    ...[...interactionsMap.values()].map((ix) => ({ id: ix.id, type: 'interaction', data: ix })),
    ...[...citationsMap.values()].filter((c) => reviewMap.has(c.id)).map((c) => ({ id: c.id, type: 'citation', data: c })),
  ];
  for (const item of checkableItems) {
    const review = reviewMap.get(item.id);
    const computedHash = computeContentHash(item.data);
    if (!review) {
      addFinding('warn', 'MISSING_REVIEW_STATE', item.id, `${item.type} ${item.id}: Chưa có ReviewState (hash: ${computedHash})`);
    } else if (review.hashVersion !== CONTENT_HASH_VERSION) {
      addFinding(review.status === 'draft' ? 'warn' : 'error', 'LEGACY_REVIEW_HASH', item.id,
        `${item.type} ${item.id}: Review chưa dùng ${CONTENT_HASH_VERSION}; không được tái dùng trạng thái "${review.status}".`);
    } else if (review.contentHash !== computedHash) {
      if (review.status !== 'draft') {
        addFinding('error', 'STALE_REVIEW_HASH', item.id, `${item.type} ${item.id}: Nội dung đã sửa đổi (${computedHash} != ${review.contentHash}) ở trạng thái "${review.status}".`);
      } else {
        addFinding('warn', 'HASH_MISMATCH_DRAFT', item.id, `${item.type} ${item.id}: Hash thay đổi (${computedHash} != ${review.contentHash}) ở trạng thái "${review.status}".`);
      }
    }
  }

  // 7. RENAL BANDS OVERLAP & GAP CHECK
  for (const d of drugsMap.values()) {
    if (!Array.isArray(d.renal) || d.renal.length <= 1) continue;
    const egfrBands = d.renal
      .filter((b) => b.eGFRFrom !== undefined || b.eGFRTo !== undefined)
      .map((b, idx) => ({ index: idx, from: b.eGFRFrom ?? 0, to: b.eGFRTo ?? 150 }));
    if (egfrBands.length <= 1) continue;

    for (let i = 0; i < egfrBands.length; i++) {
      for (let j = i + 1; j < egfrBands.length; j++) {
        const a = egfrBands[i];
        const b = egfrBands[j];
        const overlapStart = Math.max(a.from, b.from);
        const overlapEnd = Math.min(a.to, b.to);
        if (overlapEnd > overlapStart) {
          addFinding('error', 'RENAL_BAND_OVERLAP', d.id, `Thuốc ${d.id}: Dải thận #${a.index + 1} [${a.from}–${a.to}] và #${b.index + 1} [${b.from}–${b.to}] chồng lấn ở eGFR ${overlapStart}–${overlapEnd}`);
        }
      }
    }
    const sorted = [...egfrBands].sort((a, b) => a.from - b.from);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].from > sorted[i].to) {
        addFinding('warn', 'RENAL_BAND_GAP', d.id, `Thuốc ${d.id}: Dải thận eGFR bị hở đoạn từ ${sorted[i].to} đến ${sorted[i + 1].from}`);
      }
    }
  }

  // 8–10. PREGNANCY, CLASSES & THRESHOLD QUANTITY CHECKS
  const missingPregnancyByAgent: Record<string, string[]> = {};
  const missingClassesByAgent: Record<string, string[]> = {};
  const missingQuantityByAgent: Record<string, string[]> = {};

  for (const d of drugsMap.values()) {
    const owner = getDrugOwnerAgent(d.id);
    if (!d.pregnancy?.status) {
      (missingPregnancyByAgent[owner] ??= []).push(d.id);
      addFinding('warn', 'WARN_DRUG_MISSING_PREGNANCY', d.id, `Thuốc ${d.id} (${owner}) thiếu trường 'pregnancy'.`);
    }
    if (!Array.isArray(d.classes) || d.classes.length === 0) {
      (missingClassesByAgent[owner] ??= []).push(d.id);
      addFinding('warn', 'WARN_DRUG_MISSING_CLASSES', d.id, `Thuốc ${d.id} (${owner}) thiếu trường 'classes'.`);
    }
  }
  for (const t of thresholdsMap.values()) {
    if (!t.quantity?.trim()) {
      const owner = getThresholdOwnerAgent(t.id);
      (missingQuantityByAgent[owner] ??= []).push(t.id);
      addFinding('warn', 'WARN_THRESHOLD_MISSING_QUANTITY', t.id, `Threshold ${t.id} (${owner}) thiếu trường 'quantity' (QA-10).`);
    }
  }

  // 11. RULE & ENGINE CITATION IDS CHECK
  const srcRoot = existsSync(join(ROOT_DIR, 'src')) ? join(ROOT_DIR, 'src') : resolve(process.cwd(), 'src');
  for (const sub of ['modules', 'engine']) {
    for (const f of scanTsFiles(join(srcRoot, sub))) {
      const content = readFileSync(f, 'utf8');
      const relPath = f.replace(/.*src[\\/]/, '');
      const regex = /citationIds\s*:\s*\[([\s\S]*?)\]/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        for (const rawId of match[1].match(/['"]([^'"]+)['"]/g) || []) {
          const id = rawId.replace(/['"]/g, '').trim();
          if (!id) continue;
          if (id.startsWith('TODO:')) addFinding('warn', 'WARN_RULE_TODO_CITATION', relPath, `Rule trong ${relPath} dùng citation nháp "${id}"`);
          else if (!citationsMap.has(id)) addFinding('error', 'RULE_MISSING_CITATION_REF', relPath, `Mã nguồn ${relPath} tham chiếu citationId "${id}" không tồn tại trong KB!`);
        }
      }
    }
  }

  // 12. STATIC LINT QA-1, QA-7 & QA-8
  const isStrictQa = process.argv.includes('--strict-qa');
  const lintReport = scanModulesLint(ROOT_DIR, citationsMap);
  for (const item of lintReport.findings) {
    const loc = `${item.file}:${item.line}`;
    if (item.code === 'CLINICAL_DEFAULT_NUMBER') {
      addFinding(isStrictQa ? 'error' : 'warn', isStrictQa ? 'QA1_CLINICAL_DEFAULT' : 'REPORT_QA1_CLINICAL_DEFAULT', loc, `${isStrictQa ? '' : '[QA-1 CẦN REFACTOR] '}${item.snippet} -> ${item.msg}`);
    } else if (item.code === 'MODULE_CONST_CLINICAL_NUMBERS') {
      addFinding(isStrictQa ? 'error' : 'warn', isStrictQa ? 'QA8_MODULE_CONST_NUMBERS' : 'REPORT_QA8_MODULE_CONST', loc, item.msg);
    } else if (item.code === 'INVALID_QA_ALLOW_CATEGORY') {
      addFinding(isStrictQa ? 'error' : 'warn', isStrictQa ? 'QA8_INVALID_QA_ALLOW' : 'REPORT_QA8_INVALID_QA_ALLOW', loc, item.msg);
    } else if (item.code === 'CALL_MISSING_THRESHOLD_ID' || item.code === 'CALL_MISSING_DRUG_ID' || item.code === 'CALL_MISSING_CITATION_ID') {
      addFinding(isStrictQa ? 'error' : 'warn', isStrictQa ? item.code : `REPORT_${item.code}`, loc, `${isStrictQa ? '' : '[QA-8 CẦN BỔ SUNG KB] '}${item.msg}`);
    } else if (item.code === 'LITERAL_CLINICAL_THRESHOLD') {
      addFinding('warn', 'WARN_LITERAL_THRESHOLD', loc, `${item.snippet} -> ${item.msg}`);
    } else if (item.code === 'WARN_LITERAL_IN_TEXT' || item.code === 'WARN_DOSE_NOT_IN_CITATION') {
      addFinding('warn', item.code, loc, `${item.snippet} -> ${item.msg}`);
    }
  }

  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warn');
  const report: KbVerifyReport = {
    timestamp: new Date().toISOString(),
    totalSources: sourcesMap.size,
    totalCitations: citationsMap.size,
    totalThresholds: thresholdsMap.size,
    totalDrugs: drugsMap.size,
    totalInteractions: interactionsMap.size,
    totalReviews: reviewMap.size,
    errors,
    warnings,
    passed: errors.length === 0,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, `verify_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n============================================================');
  console.log('              GDMT-VN KNOWLEDGE BASE VERIFICATION           ');
  console.log('============================================================');
  console.log(`Sources: ${sourcesMap.size} | Citations: ${citationsMap.size} | Thresholds: ${thresholdsMap.size} | Drugs: ${drugsMap.size} | Interactions: ${interactionsMap.size} | Reviews: ${reviewMap.size}`);
  console.log(`QA Lint: ${lintReport.totalFilesScanned} files (${lintReport.totalErrors} lỗi; ${lintReport.totalWarnings} cảnh báo)`);
  console.log('------------------------------------------------------------');
  for (const [mod, s] of Object.entries(lintReport.byModule)) {
    const errSum = s.defaultNumberErrors + s.moduleConstErrors + s.invalidQaAllowErrors + s.missingCallIdErrors;
    console.log(`${mod.padEnd(11)} | files:${String(s.filesScanned).padStart(3)} | err:${String(errSum).padStart(4)} | qaOk:${String(s.qaAllowValidCount).padStart(4)} | litWarn:${String(s.literalThresholdWarnings).padStart(4)}`);
  }
  console.log('------------------------------------------------------------');
  printOwnerTable('THUỐC THIẾU PREGNANCY:', 'SỐ THUỐC THIẾU', missingPregnancyByAgent, 5);
  printOwnerTable('THUỐC THIẾU CLASSES:', 'SỐ THUỐC THIẾU', missingClassesByAgent, 5);
  printOwnerTable('THRESHOLD THIẾU QUANTITY:', 'SỐ THRESHOLD', missingQuantityByAgent, 4);

  if (warnings.length > 0) {
    console.log(`\n⚠ CẢNH BÁO (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  [${w.code}] ${w.itemId}: ${w.msg}`));
  }
  if (errors.length > 0) {
    console.log(`\n✖ LỖI PHÁT HIỆN (${errors.length}):`);
    errors.forEach((e) => console.log(`  [${e.code}] ${e.itemId}: ${e.msg}`));
    console.log(`❌ KẾT QUẢ: THẤT BẠI (${errors.length} lỗi). Chi tiết tại: ${reportPath}\n`);
  } else {
    console.log(`✔ KẾT QUẢ: ĐẠT YÊU CẦU 100% (0 lỗi). Báo cáo tại: ${reportPath}\n`);
  }

  return report;
}

if (process.argv[1] && process.argv[1].endsWith('verifyKb.ts')) {
  verifyKb().then((rep) => {
    if (!rep.passed) process.exit(1);
  });
}
