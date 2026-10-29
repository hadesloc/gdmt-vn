/**
 * GDMT-VN Knowledge Base Type System & Runtime Validators
 * Phân quyền: Agent C
 * Không sử dụng thư viện bên ngoài (zero-dependency runtime validator).
 * Thuần trình duyệt (Browser-safe 100%, không kéo node:* modules).
 */

// --- CÁC KIỂU CƠ BẢN ---

export type Jurisdiction = 'INTL' | 'VN' | 'VN_SOCIETY' | 'US' | 'LABEL';
export type Lang = 'en' | 'vi';
export type Action =
  | 'START'
  | 'UPTITRATE'
  | 'CONTINUE'
  | 'REDUCE'
  | 'SWITCH'
  | 'HOLD'
  | 'STOP'
  | 'AVOID'
  | 'CONSIDER'
  | 'DEFER'
  | 'MONITOR'
  | 'REFER';

export type RenalStatus = 'rec' | 'ok' | 'caution' | 'not_rec' | 'contra' | 'no_data';
export type GateAction = 'hold' | 'contra' | 'caution' | 'reduce' | 'avoid' | 'stop';
export type GateOperator = '<' | '<=' | '>' | '>=' | '==' | '!=';

export type ReviewStatus = 'draft' | 'auto_checked' | 'ai_cross_checked' | 'ai_multi_reviewed';
export type ReviewSeverity = 'critical' | 'major' | 'minor';
export type ReviewVerdict = 'pass' | 'concerns' | 'fail' | 'uncertain';

// --- LIỀU DÙNG (DOSE) ---

export interface Dose {
  amount: number | string;
  unit: string;
  frequency?: string;
  route?: string;
  description?: string;
}

// --- NGUỒN TÀI LIỆU (SOURCE) ---

export interface Source {
  id: string;
  org: string;
  title: string;
  year: number;
  version?: string;
  url?: string;
  localPath?: string;
  sha256?: string;
  jurisdiction: Jurisdiction;
  lang: Lang;
}

// --- TRÍCH DẪN NGUYÊN VĂN (CITATION) ---

export interface Citation {
  id: string;
  sourceId: string;
  pdfPage?: number;
  printedPage?: string;
  locator: string; // vd: "Rec 1.3.1", "Table 4", "p. 23"
  quote: string; // NGUYÊN VĂN ngôn ngữ gốc, dùng cho máy kiểm chứng
  quoteVi?: string; // Dịch tham khảo tiếng Việt
  cor?: 'I' | 'IIa' | 'IIb' | 'III' | '1' | '2' | 'strong' | 'conditional';
  loe?: string; // vd: "A", "B", "C", "Level 1"
}

// --- ĐẠI LƯỢNG LÂM SÀNG & NGƯỠNG LÂM SÀNG (THRESHOLD & QUANTITY QA-10) ---

export type ThresholdQuantity =
  // Khớp chính xác tên field của need(ctx, '...')
  | 'egfr'
  | 'crcl'
  | 'k'
  | 'sbp'
  | 'dbp'
  | 'hr'
  | 'lvef'
  | 'uacr'
  | 'hba1c'
  | 'glucose'
  | 'ldl'
  | 'tg'
  | 'tc'
  | 'hdl'
  | 'urate'
  | 'fev1'
  | 'fev1_pct'
  | 'fev1_fvc'
  | 'eos'
  | 'mmrc'
  | 'cat'
  | 'exacerbation_count'
  | 'asthma_exacerbations'
  | 'copd_exacerbations'
  | 'gout_flares'
  | 'age'
  | 'weight'
  | 'height'
  | 'bmi'
  | 'bsa'
  | 'map'
  | 'na'
  | 'hco3'
  | 'hb'
  | 'nyha'
  | 'dose_mg'
  // Các đại lượng phi-bệnh nhân / mục tiêu / khoảng thời gian
  | 'ldl_reduction_pct'
  | 'duration_days'
  | 'interval_weeks'
  | 'qrs_duration'
  | 'cha2ds2va_score'
  | 'percentage'
  | 'ratio'
  | 'count'
  | string;

export interface Threshold {
  id: string; // Quy ước: <module>.<topic>.<parameter>_<subtopic> (vd: ckd.sglt2i.egfr_initiate_min)
  value: number;
  unit: string; // Bắt buộc
  quantity?: ThresholdQuantity; // Đại lượng chuẩn hoá máy đọc (QA-10)
  citationIds: string[];
  descriptionVi?: string;
}

// --- LUẬT CỔNG AN TOÀN (GATE RULE) ---

export interface GateRule {
  id: string;
  parameter: string; // vd: "eGFR", "K", "SBP", "HR", "pregnancy", "allergy"
  operator: GateOperator;
  threshold: number;
  unit?: string;
  action: GateAction;
  messageVi: string;
  citationIds: string[];
}

// --- AN TOÀN THAI KỲ & CHO CON BÚ (PREGNANCY & LACTATION SAFETY) ---

export type PregnancyStatus = 'contra' | 'avoid' | 'caution' | 'compatible' | 'no_data';
export type LactationStatus = 'contra' | 'avoid' | 'caution' | 'compatible' | 'no_data';

export interface PregnancySafetyInfo {
  status: PregnancyStatus;
  citationIds: string[];
  notesVi?: string;
}

export interface LactationSafetyInfo {
  status: LactationStatus;
  citationIds: string[];
  notesVi?: string;
}

// --- MÃ CHỐNG CHỈ ĐỊNH MÁY ĐỌC (MACHINE-READABLE CONTRAINDICATION) ---

export type ContraindicationCode =
  | 'pregnancy'
  | 'angioedema_history'
  | 'mechanical_valve'
  | 'hla_b5801'
  | 'severe_hypotension'
  | 'cardiogenic_shock'
  | 'bilateral_renal_artery_stenosis'
  | 'hyperkalemia'
  | 'acute_pancreatitis'
  | 'severe_hepatic_impairment'
  | 'dialysis'
  | string;

export interface DrugContraindication {
  code: ContraindicationCode;
  messageVi?: string;
  citationIds: string[];
}

// --- MÃ PHÂN LOẠI NHÓM THUỐC CHUẨN HOÁ & NGUY CƠ KÉO DÀI KHOẢNG QT ---

export type DrugStandardClass =
  | 'acei'
  | 'arb'
  | 'arni'
  | 'mra_steroidal'
  | 'mra_nonsteroidal'
  | 'sglt2i'
  | 'glp1ra'
  | 'dpp4i'
  | 'su'
  | 'tzd'
  | 'ag_inhibitor'
  | 'insulin'
  | 'lama'
  | 'laba'
  | 'ics'
  | 'saba'
  | 'sama'
  | 'bb_selective'
  | 'bb_nonselective'
  | 'ndhp_ccb'
  | 'dhp_ccb'
  | 'doac'
  | 'vka'
  | 'statin'
  | 'cholesterol_absorption_inhibitor'
  | 'pcsk9i'
  | 'fibrate'
  | 'urate_lowering'
  | 'anti_gout'
  | 'loop_diuretic'
  | 'thiazide_diuretic'
  | 'potassium_binder'
  | string;

export type QtProlongationRisk = 'known' | 'possible' | 'conditional';

// --- DẢI CHỨC NĂNG THẬN (RENAL BAND) ---

export interface RenalBand {
  eGFRFrom?: number;
  eGFRTo?: number;
  crclFrom?: number;
  crclTo?: number;
  initiate: RenalStatus;
  continue: RenalStatus;
  dose?: Dose | string;
  citationIds: string[];
  note?: string;
}

// --- TỪ ĐIỂN THUỐC (DRUG ENTRY) ---

export interface DrugEntry {
  id: string; // Quy ước: inn viết thường không dấu (vd: dapagliflozin, empagliflozin)
  nameVi: string;
  inn: string;
  class: string;
  classes?: DrugStandardClass[]; // Mã nhóm chuẩn máy đọc (phát hiện trùng lặp nhóm thuốc, trùng phối hợp)
  components?: string[]; // Danh sách drugId thành phần cho thuốc phối hợp (FDC)
  qtRisk?: QtProlongationRisk; // Nguy cơ kéo dài khoảng QT theo CredibleMeds / nhãn
  vnBrands: string[];
  forms: string[];
  start?: Dose | string;
  target?: Dose | string;
  titration?: {
    step: Dose | string;
    intervalDays: number;
    maxDose?: Dose | string;
  };
  renal: RenalBand[];
  gates: GateRule[];
  pregnancy?: PregnancySafetyInfo; // Chuẩn bắt buộc theo QA-8/R3 (optional trong giai đoạn refactor)
  lactation?: LactationSafetyInfo; // Tùy chọn
  contraindications?: DrugContraindication[]; // Mã chống chỉ định máy đọc
  interactions: string[];
  citationIds: string[];
}

// --- TRẠNG THÁI KIỂM DUYỆT (REVIEW STATE) ---

export interface ReviewIssue {
  severity: ReviewSeverity;
  problem: string;
  target?: string;
  suggestedFix?: string;
}

export interface ReviewReportRecord {
  round?: number;
  reviewedAt: string;
  role?: string;
  verdict: ReviewVerdict;
  issues: ReviewIssue[];
  summary?: string;
}

export interface ReviewState {
  itemId: string;
  contentHash: string;
  /** Absent means legacy v1; it must never authorize current content. */
  hashVersion?: 'sha256-json-v2';
  status: ReviewStatus;
  reports: ReviewReportRecord[];
  lastReviewedAt?: string;
  history?: ReviewRevision[];
}

export interface ReviewRevision extends Omit<ReviewState, 'history'> {
  invalidatedAt: string;
  invalidationReason: 'hash_version_changed' | 'content_changed';
}

// --- KẾT QUẢ XÁC THỰC (VALIDATION RESULT) ---

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export * from './goldenCase';
export * from './access';
export * from './interactions';
export { computeContentHash, CONTENT_HASH_VERSION } from './contentHash';

// --- RUNTIME VALIDATORS (KHÔNG PHỤ THUỘC THƯ VIỆN NGOÀI) ---

const JURISDICTIONS: Set<string> = new Set(['INTL', 'VN', 'VN_SOCIETY', 'US', 'LABEL']);
const LANGS: Set<string> = new Set(['en', 'vi']);
const COR_SET: Set<string> = new Set(['I', 'IIa', 'IIb', 'III', '1', '2', 'strong', 'conditional']);
const RENAL_STATUS_SET: Set<string> = new Set(['rec', 'ok', 'caution', 'not_rec', 'contra', 'no_data']);
const GATE_ACTIONS: Set<string> = new Set(['hold', 'contra', 'caution', 'reduce', 'avoid', 'stop']);
const GATE_OPERATORS: Set<string> = new Set(['<', '<=', '>', '>=', '==', '!=']);
const PREGNANCY_STATUS_SET: Set<string> = new Set(['contra', 'avoid', 'caution', 'compatible', 'no_data']);
const QT_RISK_SET: Set<string> = new Set(['known', 'possible', 'conditional']);
const REVIEW_STATUSES: Set<string> = new Set(['draft', 'auto_checked', 'ai_cross_checked', 'ai_multi_reviewed']);
const REVIEW_VERDICTS: Set<string> = new Set(['pass', 'concerns', 'fail', 'uncertain']);
const REVIEW_SEVERITIES: Set<string> = new Set(['critical', 'major', 'minor']);

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function validateSource(s: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(s)) return { valid: false, errors: ['Source phải là một object'] };

  if (typeof s.id !== 'string' || !s.id.trim()) errors.push('Source.id bắt buộc và phải là chuỗi không rỗng');
  if (typeof s.org !== 'string' || !s.org.trim()) errors.push(`Source ${s.id ?? '?'}: org bắt buộc`);
  if (typeof s.title !== 'string' || !s.title.trim()) errors.push(`Source ${s.id ?? '?'}: title bắt buộc`);
  if (typeof s.year !== 'number' || s.year < 1990 || s.year > 2050) errors.push(`Source ${s.id ?? '?'}: year không hợp lệ (1990-2050)`);
  if (typeof s.jurisdiction !== 'string' || !JURISDICTIONS.has(s.jurisdiction)) {
    errors.push(`Source ${s.id ?? '?'}: jurisdiction phải thuộc [INTL, VN, VN_SOCIETY, US, LABEL]`);
  }
  if (typeof s.lang !== 'string' || !LANGS.has(s.lang)) {
    errors.push(`Source ${s.id ?? '?'}: lang phải là 'en' hoặc 'vi'`);
  }
  if (!s.url && !s.localPath) {
    errors.push(`Source ${s.id ?? '?'}: phải có ít nhất một trong hai trường url hoặc localPath`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateCitation(c: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(c)) return { valid: false, errors: ['Citation phải là một object'] };

  if (typeof c.id !== 'string' || !c.id.trim()) errors.push('Citation.id bắt buộc và phải là chuỗi không rỗng');
  if (typeof c.sourceId !== 'string' || !c.sourceId.trim()) errors.push(`Citation ${c.id ?? '?'}: sourceId bắt buộc`);
  if (typeof c.locator !== 'string' || !c.locator.trim()) errors.push(`Citation ${c.id ?? '?'}: locator bắt buộc`);
  if (typeof c.quote !== 'string' || !c.quote.trim()) errors.push(`Citation ${c.id ?? '?'}: quote bắt buộc`);

  if (c.pdfPage !== undefined && (typeof c.pdfPage !== 'number' || c.pdfPage < 1)) {
    errors.push(`Citation ${c.id ?? '?'}: pdfPage phải là số nguyên dương`);
  }
  if (c.cor !== undefined && (typeof c.cor !== 'string' || !COR_SET.has(c.cor))) {
    errors.push(`Citation ${c.id ?? '?'}: cor phải thuộc [I, IIa, IIb, III, 1, 2, strong, conditional]`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateThreshold(t: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(t)) return { valid: false, errors: ['Threshold phải là một object'] };

  if (typeof t.id !== 'string' || !t.id.trim()) errors.push('Threshold.id bắt buộc và phải là chuỗi không rỗng');
  if (typeof t.value !== 'number' || !Number.isFinite(t.value)) errors.push(`Threshold ${t.id ?? '?'}: value phải là số hữu hạn`);
  if (typeof t.unit !== 'string' || !t.unit.trim()) errors.push(`Threshold ${t.id ?? '?'}: unit bắt buộc`);
  if (t.quantity !== undefined && (typeof t.quantity !== 'string' || !t.quantity.trim())) {
    errors.push(`Threshold ${t.id ?? '?'}: quantity phải là chuỗi định danh đại lượng lâm sàng hợp lệ`);
  }
  if (!Array.isArray(t.citationIds) || t.citationIds.length === 0) {
    errors.push(`Threshold ${t.id ?? '?'}: citationIds bắt buộc và phải có ít nhất 1 citation`);
  } else {
    for (const cid of t.citationIds) {
      if (typeof cid !== 'string' || !cid.trim()) {
        errors.push(`Threshold ${t.id ?? '?'}: citationId phải là chuỗi không rỗng`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateDrugEntry(d: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(d)) return { valid: false, errors: ['DrugEntry phải là một object'] };

  if (typeof d.id !== 'string' || !d.id.trim()) errors.push('DrugEntry.id bắt buộc và phải là chuỗi không rỗng');
  if (typeof d.nameVi !== 'string' || !d.nameVi.trim()) errors.push(`Drug ${d.id ?? '?'}: nameVi bắt buộc`);
  if (typeof d.inn !== 'string' || !d.inn.trim()) errors.push(`Drug ${d.id ?? '?'}: inn bắt buộc`);
  if (typeof d.class !== 'string' || !d.class.trim()) errors.push(`Drug ${d.id ?? '?'}: class bắt buộc`);
  if (!Array.isArray(d.vnBrands)) errors.push(`Drug ${d.id ?? '?'}: vnBrands phải là mảng chuỗi`);
  if (!Array.isArray(d.forms) || d.forms.length === 0) errors.push(`Drug ${d.id ?? '?'}: forms phải có ít nhất 1 dạng bào chế`);
  if (!Array.isArray(d.citationIds) || d.citationIds.length === 0) {
    errors.push(`Drug ${d.id ?? '?'}: citationIds bắt buộc và phải có ít nhất 1 citation`);
  }

  if (Array.isArray(d.renal)) {
    d.renal.forEach((r, idx) => {
      if (!isObject(r)) {
        errors.push(`Drug ${d.id ?? '?'}: renal[${idx}] phải là object`);
        return;
      }
      if (typeof r.initiate !== 'string' || !RENAL_STATUS_SET.has(r.initiate)) {
        errors.push(`Drug ${d.id ?? '?'}: renal[${idx}].initiate không hợp lệ`);
      }
      if (typeof r.continue !== 'string' || !RENAL_STATUS_SET.has(r.continue)) {
        errors.push(`Drug ${d.id ?? '?'}: renal[${idx}].continue không hợp lệ`);
      }
      if (!Array.isArray(r.citationIds) || r.citationIds.length === 0) {
        errors.push(`Drug ${d.id ?? '?'}: renal[${idx}].citationIds phải có ít nhất 1 citation`);
      }
    });
  } else {
    errors.push(`Drug ${d.id ?? '?'}: renal phải là một mảng`);
  }

  if (Array.isArray(d.gates)) {
    d.gates.forEach((g, idx) => {
      if (!isObject(g)) {
        errors.push(`Drug ${d.id ?? '?'}: gates[${idx}] phải là object`);
        return;
      }
      if (typeof g.id !== 'string') errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].id bắt buộc`);
      if (typeof g.parameter !== 'string') errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].parameter bắt buộc`);
      if (typeof g.operator !== 'string' || !GATE_OPERATORS.has(g.operator)) {
        errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].operator không hợp lệ`);
      }
      if (typeof g.threshold !== 'number' || !Number.isFinite(g.threshold)) {
        errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].threshold phải là số hữu hạn`);
      }
      if (typeof g.action !== 'string' || !GATE_ACTIONS.has(g.action)) {
        errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].action không hợp lệ`);
      }
      if (typeof g.messageVi !== 'string' || !g.messageVi.trim()) {
        errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].messageVi bắt buộc`);
      }
      if (!Array.isArray(g.citationIds) || g.citationIds.length === 0) {
        errors.push(`Drug ${d.id ?? '?'}: gates[${idx}].citationIds phải có ít nhất 1 citation`);
      }
    });
  }

  // Kiểm tra an toàn thai kỳ (pregnancy) nếu được khai báo
  if (d.pregnancy !== undefined) {
    if (!isObject(d.pregnancy)) {
      errors.push(`Drug ${d.id ?? '?'}: pregnancy phải là object`);
    } else {
      if (typeof d.pregnancy.status !== 'string' || !PREGNANCY_STATUS_SET.has(d.pregnancy.status)) {
        errors.push(`Drug ${d.id ?? '?'}: pregnancy.status không hợp lệ ('contra'|'avoid'|'caution'|'compatible'|'no_data')`);
      }
      if (!Array.isArray(d.pregnancy.citationIds) || d.pregnancy.citationIds.length === 0) {
        errors.push(`Drug ${d.id ?? '?'}: pregnancy.citationIds phải có ít nhất 1 citation`);
      }
    }
  }

  // Kiểm tra an toàn cho con bú (lactation) nếu được khai báo
  if (d.lactation !== undefined) {
    if (!isObject(d.lactation)) {
      errors.push(`Drug ${d.id ?? '?'}: lactation phải là object`);
    } else {
      if (typeof d.lactation.status !== 'string' || !PREGNANCY_STATUS_SET.has(d.lactation.status)) {
        errors.push(`Drug ${d.id ?? '?'}: lactation.status không hợp lệ ('contra'|'avoid'|'caution'|'compatible'|'no_data')`);
      }
      if (!Array.isArray(d.lactation.citationIds) || d.lactation.citationIds.length === 0) {
        errors.push(`Drug ${d.id ?? '?'}: lactation.citationIds phải có ít nhất 1 citation`);
      }
    }
  }

  // Kiểm tra danh sách chống chỉ định máy đọc (contraindications) nếu có
  if (d.contraindications !== undefined) {
    if (!Array.isArray(d.contraindications)) {
      errors.push(`Drug ${d.id ?? '?'}: contraindications phải là mảng`);
    } else {
      d.contraindications.forEach((c, idx) => {
        if (!isObject(c)) {
          errors.push(`Drug ${d.id ?? '?'}: contraindications[${idx}] phải là object`);
          return;
        }
        if (typeof c.code !== 'string' || !c.code.trim()) {
          errors.push(`Drug ${d.id ?? '?'}: contraindications[${idx}].code bắt buộc`);
        }
        if (!Array.isArray(c.citationIds) || c.citationIds.length === 0) {
          errors.push(`Drug ${d.id ?? '?'}: contraindications[${idx}].citationIds phải có ít nhất 1 citation`);
        }
      });
    }
  }

  // Kiểm tra mã nhóm chuẩn hoá máy đọc (classes) nếu có
  if (d.classes !== undefined) {
    if (!Array.isArray(d.classes)) {
      errors.push(`Drug ${d.id ?? '?'}: classes phải là mảng chuỗi`);
    } else {
      d.classes.forEach((cls, idx) => {
        if (typeof cls !== 'string' || !cls.trim()) {
          errors.push(`Drug ${d.id ?? '?'}: classes[${idx}] phải là chuỗi không rỗng`);
        }
      });
    }
  }

  // Kiểm tra danh sách drugId thành phần (components) cho thuốc phối hợp nếu có
  if (d.components !== undefined) {
    if (!Array.isArray(d.components)) {
      errors.push(`Drug ${d.id ?? '?'}: components phải là mảng chuỗi`);
    } else {
      d.components.forEach((cmp, idx) => {
        if (typeof cmp !== 'string' || !cmp.trim()) {
          errors.push(`Drug ${d.id ?? '?'}: components[${idx}] phải là chuỗi không rỗng`);
        }
      });
    }
  }

  // Kiểm tra nguy cơ kéo dài khoảng QT (qtRisk) nếu có
  if (d.qtRisk !== undefined) {
    if (typeof d.qtRisk !== 'string' || !QT_RISK_SET.has(d.qtRisk)) {
      errors.push(`Drug ${d.id ?? '?'}: qtRisk không hợp lệ ('known'|'possible'|'conditional')`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateReviewState(r: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(r)) return { valid: false, errors: ['ReviewState phải là một object'] };

  if (typeof r.itemId !== 'string' || !r.itemId.trim()) errors.push('ReviewState.itemId bắt buộc');
  if (typeof r.contentHash !== 'string' || !/^[a-f0-9]{16,64}$/.test(r.contentHash)) {
    errors.push(`ReviewState ${r.itemId ?? '?'}: contentHash phải là chuỗi hex sha256`);
  }
  if (r.hashVersion !== undefined && r.hashVersion !== 'sha256-json-v2') {
    errors.push(`ReviewState ${r.itemId ?? '?'}: hashVersion không được hỗ trợ`);
  }
  if (r.hashVersion === 'sha256-json-v2' && !/^[a-f0-9]{64}$/.test(String(r.contentHash))) {
    errors.push(`ReviewState ${r.itemId ?? '?'}: hash v2 phải đủ 64 ký tự hex`);
  }
  if (r.history !== undefined) {
    if (!Array.isArray(r.history)) errors.push(`ReviewState ${r.itemId ?? '?'}: history phải là mảng`);
    else for (const revision of r.history) {
      if (!isObject(revision) || revision.history !== undefined ||
          revision.itemId !== r.itemId || typeof revision.invalidatedAt !== 'string' ||
          !['hash_version_changed', 'content_changed'].includes(String(revision.invalidationReason))) {
        errors.push(`ReviewState ${r.itemId ?? '?'}: history revision không hợp lệ`);
      } else {
        const historical = validateReviewState(revision);
        errors.push(...historical.errors);
      }
    }
  }
  if (typeof r.status !== 'string' || !REVIEW_STATUSES.has(r.status)) {
    errors.push(`ReviewState ${r.itemId ?? '?'}: status phải thuộc [draft, auto_checked, ai_cross_checked, ai_multi_reviewed]`);
  }
  if (!Array.isArray(r.reports)) {
    errors.push(`ReviewState ${r.itemId ?? '?'}: reports phải là một mảng`);
  } else {
    r.reports.forEach((rep, idx) => {
      if (!isObject(rep)) {
        errors.push(`ReviewState ${r.itemId ?? '?'}: reports[${idx}] phải là object`);
        return;
      }
      if (typeof rep.reviewedAt !== 'string') {
        errors.push(`ReviewState ${r.itemId ?? '?'}: reports[${idx}].reviewedAt bắt buộc`);
      }
      if (typeof rep.verdict !== 'string' || !REVIEW_VERDICTS.has(rep.verdict)) {
        errors.push(`ReviewState ${r.itemId ?? '?'}: reports[${idx}].verdict không hợp lệ`);
      }
      if (!Array.isArray(rep.issues)) {
        errors.push(`ReviewState ${r.itemId ?? '?'}: reports[${idx}].issues phải là mảng`);
      } else {
        rep.issues.forEach((iss, issIdx) => {
          if (!isObject(iss) || typeof iss.severity !== 'string' || !REVIEW_SEVERITIES.has(iss.severity)) {
            errors.push(`ReviewState ${r.itemId ?? '?'}: reports[${idx}].issues[${issIdx}].severity không hợp lệ`);
          }
          if (!isObject(iss) || typeof iss.problem !== 'string' || !iss.problem.trim()) {
            errors.push(`ReviewState ${r.itemId ?? '?'}: reports[${idx}].issues[${issIdx}].problem bắt buộc`);
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export * from './interactions';
