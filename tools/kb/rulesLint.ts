/**
 * GDMT-VN Rules Linting & Clinical Data Safety Linter (QA-1, QA-7 & QA-8)
 * Phân quyền: Agent C
 *
 * Kiểm tra tĩnh mã nguồn trong `src/modules/**`:
 * 1. CLINICAL_DEFAULT_NUMBER (LỖI QA-1): Dùng `?? <số>` hoặc `|| <số>` trên dữ liệu lâm sàng (trừ whitelist hợp lệ).
 * 2. LITERAL_CLINICAL_THRESHOLD (CẢNH BÁO QA-1): Dùng số literal trong biểu thức so sánh (`< 30`, `>= 5.5`...) thay vì hằng số Threshold.
 * 3. WARN_LITERAL_IN_TEXT (CẢNH BÁO QA-7): Chuỗi literal trong `dose`, `title`, `rationale`, `doseText`, ô ma trận, bước lộ trình chứa số lâm sàng thay vì nội suy từ Threshold/DrugEntry.
 * 4. WARN_DOSE_NOT_IN_CITATION (CẢNH BÁO QA-7): Liều X hiển thị trong khuyến cáo/ma trận có gắn citationIds nhưng không citation nào chứa X.
 * 5. MODULE_CONST_CLINICAL_NUMBERS (LỖI QA-8): File trong `src/modules/**` khai báo const/object chứa số lâm sàng (vd. *_THRESHOLDS = { x: 7.0 }).
 * 6. INVALID_QA_ALLOW_CATEGORY (LỖI QA-8): `qa-allow` không thuộc 3 loại cho phép: `ui-step | index | unit-conversion` kèm lý do.
 * 7. CALL_MISSING_THRESHOLD_ID (LỖI QA-8): Lời gọi `th('id')` hoặc `thr('id')` tham chiếu ID không tồn tại trong KB.
 * 8. CALL_MISSING_DRUG_ID (LỖI QA-8): Lời gọi `dose('drugId')` tham chiếu drugId không tồn tại trong KB.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Citation } from '../../src/kb-types/index';
import { hasThreshold, hasDrug, setCustomKbData, getAllThresholds, thr } from '../../src/kb-types/access';
import { loadKbDataFromFs } from '../../src/kb-types/node';
import { quoteContainsNumber } from './citations';

export type LintCode =
  | 'CLINICAL_DEFAULT_NUMBER'
  | 'LITERAL_CLINICAL_THRESHOLD'
  | 'WARN_LITERAL_IN_TEXT'
  | 'WARN_DOSE_NOT_IN_CITATION'
  | 'MODULE_CONST_CLINICAL_NUMBERS'
  | 'INVALID_QA_ALLOW_CATEGORY'
  | 'CALL_MISSING_THRESHOLD_ID'
  | 'CALL_MISSING_DRUG_ID'
  | 'CALL_MISSING_CITATION_ID'
  | 'QA10_QUANTITY_MISMATCH';

export interface RuleLintFinding {
  level: 'error' | 'warn';
  code: LintCode;
  file: string;
  module: string;
  line: number;
  snippet: string;
  msg: string;
}

export interface ModuleLintStats {
  module: string;
  filesScanned: number;
  defaultNumberErrors: number;
  moduleConstErrors: number;
  invalidQaAllowErrors: number;
  missingCallIdErrors: number;
  missingCitationIdWarnings: number;
  qa10QuantityMismatchErrors: number;
  literalThresholdWarnings: number;
  literalInTextWarnings: number;
  doseNotInCitationWarnings: number;
  qaAllowValidCount: number;
  qaAllowInvalidCount: number;
}

export interface RuleLintReport {
  totalFilesScanned: number;
  totalErrors: number;
  totalWarnings: number;
  byModule: Record<string, ModuleLintStats>;
  findings: RuleLintFinding[];
}

export const VALID_QA_ALLOW_CATEGORIES = ['ui-step', 'index', 'unit-conversion'];

/**
 * Quét đệ quy tất cả các file .ts trong thư mục modules
 */
export function getModuleTsFiles(modulesDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(modulesDir)) return results;

  const entries = readdirSync(modulesDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(modulesDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getModuleTsFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Trích xuất module name từ đường dẫn file
 */
export function extractModuleName(filePath: string): string {
  const norm = filePath.replace(/\\/g, '/');
  const m = norm.match(/modules\/([^/]+)/);
  return m ? m[1] : 'unknown';
}

/**
 * Trích xuất các số lâm sàng có gắn đơn vị từ chuỗi
 */
export function extractClinicalNumbersWithUnits(text: string): { value: number; unit: string; raw: string }[] {
  const results: { value: number; unit: string; raw: string }[] = [];
  const regex = /\b(\d+(?:\.\d+)?)(?:\s*[-–—]\s*(\d+(?:\.\d+)?))?\s*(mg|u(?:nits)?|u\/kg|u\/kg\/ng[àa]y|mmol(?:\/l)?|ml\/min|ml\/ph[uú]t|µmol|umol|mcg|µg|g\/ng[àa]y|%|g\/g|mg\/g|mg\/mmol)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const num1 = parseFloat(match[1]);
    const unit = match[3];
    if (!isNaN(num1)) {
      results.push({ value: num1, unit, raw: match[0] });
    }
    if (match[2]) {
      const num2 = parseFloat(match[2]);
      if (!isNaN(num2)) {
        results.push({ value: num2, unit, raw: match[0] });
      }
    }
  }
  return results;
}

/**
 * Kiểm tra xem qa-allow comment có hợp lệ theo QA-8 không
 */
export function parseQaAllow(line: string): { hasQaAllow: boolean; isValid: boolean; category?: string; reason?: string } {
  const m = line.match(/\/\/\s*qa-allow\s*:\s*([^;\n]+)/i);
  if (!m) {
    return { hasQaAllow: false, isValid: false };
  }

  const raw = m[1].trim();
  // Kiểm tra cú pháp: (ui-step|index|unit-conversion)[ -:].*
  const catMatch = raw.match(/^(ui-step|index|unit-conversion)\b(?:\s*[-:]\s*(.+))?/i);
  if (catMatch) {
    const category = catMatch[1].toLowerCase();
    const reason = catMatch[2]?.trim() || '';
    return { hasQaAllow: true, isValid: true, category, reason };
  }

  return { hasQaAllow: true, isValid: false, reason: raw };
}

/**
 * Kiểm tra tĩnh mã nguồn một file TypeScript trong modules (QA-1, QA-7 & QA-8)
 */
export function lintRuleContent(
  content: string,
  filePath = 'unknown.ts',
  citationsMap?: Map<string, Citation>
): RuleLintFinding[] {
  const findings: RuleLintFinding[] = [];
  const lines = content.split('\n');
  const moduleName = extractModuleName(filePath);

  // QA-1 Regexes
  const defaultNumberRegex = /(\?\?|\|\|)\s*[-+]?\d+(?:\.\d+)?\b/;
  const clinicalComparisonRegex = /\b(egfr|k|sbp|dbp|hr|lvef|uacr|hba1c|glucose|scr|crcl|uricAcid|fev1Pct|eos)\s*(?:<=|>=|<|>|===|==)\s*(?!0\b)[-+]?\d+(?:\.\d+)?\b/i;
  const reverseComparisonRegex = /\b(?!0\b)[-+]?\d+(?:\.\d+)?\s*(?:<=|>=|<|>|===|==)\s*(egfr|k|sbp|dbp|hr|lvef|uacr|hba1c|glucose|scr|crcl|uricAcid|fev1Pct|eos)\b/i;

  // QA-7 Regexes
  const textPropsRegex = /\b(dose|title|rationale|doseText|note|description)\s*:\s*(['"`])(.*?)\2/;

  // QA-10: Bản đồ biến lâm sàng (nhận diện các biến gán từ need(ctx, '...'))
  const varToQuantity = new Map<string, string>();
  const commonQuantities = [
    'egfr', 'crcl', 'k', 'sbp', 'dbp', 'hr', 'lvef', 'uacr', 'hba1c', 'glucose',
    'ldl', 'tg', 'tc', 'hdl', 'urate', 'bmi', 'weight', 'height', 'age', 'mmrc',
    'cat', 'eos', 'fev1_pct', 'fev1_fvc', 'exacerbation_count',
  ];
  for (const q of commonQuantities) {
    varToQuantity.set(q, q);
    varToQuantity.set(q.toUpperCase(), q);
  }

  // Quét trước các dòng khai báo gán từ need(ctx, '...') trong toàn file
  for (const line of lines) {
    const needMatch = /const\s+([A-Za-z0-9_]+)\s*=\s*need\(\s*ctx\s*,\s*['"]([A-Za-z0-9_]+)['"]\s*\)/.exec(line);
    if (needMatch) {
      varToQuantity.set(needMatch[1], needMatch[2].toLowerCase());
    }
  }

  // QA-8: Kiểm tra khai báo file hằng số lâm sàng hoặc const/object chứa số lâm sàng
  const isThresholdsFile = filePath.toLowerCase().includes('thresholds.ts');
  if (isThresholdsFile && !filePath.includes('kb/thresholds')) {
    findings.push({
      level: 'error',
      code: 'MODULE_CONST_CLINICAL_NUMBERS',
      file: filePath,
      module: moduleName,
      line: 1,
      snippet: filePath,
      msg: `[QA-8 CẤM FILE HẰNG SỐ] Cấm khai báo file hằng số lâm sàng '${filePath}' trong module. Toàn bộ ngưỡng lâm sàng bắt buộc đọc qua accessor th('id') từ KB!`,
    });
  }

  const constThresholdObjectRegex = /\bconst\s+([A-Za-z0-9_]*THRESHOLDS?|[A-Za-z0-9_]*CLINICAL[A-Za-z0-9_]*)\s*[:=]/i;

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNum = idx + 1;
    const lineText = lines[idx];
    const trimmed = lineText.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // QA-8: Kiểm tra qa-allow hợp lệ
    const qa = parseQaAllow(lineText);
    if (qa.hasQaAllow && !qa.isValid) {
      findings.push({
        level: 'error',
        code: 'INVALID_QA_ALLOW_CATEGORY',
        file: filePath,
        module: moduleName,
        line: lineNum,
        snippet: trimmed,
        msg: `[QA-8 LỖI QA-ALLOW] Chú thích qa-allow không hợp lệ ('${qa.reason}'). Chỉ chấp nhận 3 loại: 'ui-step', 'index', 'unit-conversion' kèm lý do. CẤM dùng qa-allow trên ngưỡng/liều lâm sàng!`,
      });
    }

    const isAllowed = qa.hasQaAllow && qa.isValid;

    // QA-8: Kiểm tra khai báo const *_THRESHOLDS
    if (constThresholdObjectRegex.test(lineText)) {
      findings.push({
        level: 'error',
        code: 'MODULE_CONST_CLINICAL_NUMBERS',
        file: filePath,
        module: moduleName,
        line: lineNum,
        snippet: trimmed,
        msg: `[QA-8 CẤM CONST LÂM SÀNG] Cấm khai báo const/object hằng số lâm sàng trong module. Số lâm sàng phải được lấy qua th('id')!`,
      });
    }

    // 1. QA-1: Kiểm tra ?? <số> hoặc || <số>
    if (defaultNumberRegex.test(lineText)) {
      if (!isAllowed) {
        findings.push({
          level: 'error',
          code: 'CLINICAL_DEFAULT_NUMBER',
          file: filePath,
          module: moduleName,
          line: lineNum,
          snippet: trimmed,
          msg: `Phát hiện gán giá trị mặc định cho dữ liệu lâm sàng ('?? <số>' hoặc '|| <số>'). Cần dùng need(ctx, ...) để fail-closed khi thiếu dữ liệu (hoặc gắn '// qa-allow: (ui-step|index|unit-conversion) - <lý do>' nếu hợp lệ).`,
        });
      }
    }

    // 2. QA-1: Kiểm tra số literal trong so sánh lâm sàng (khác 0)
    if (clinicalComparisonRegex.test(lineText) || reverseComparisonRegex.test(lineText)) {
      if (!isAllowed) {
        findings.push({
          level: 'warn',
          code: 'LITERAL_CLINICAL_THRESHOLD',
          file: filePath,
          module: moduleName,
          line: lineNum,
          snippet: trimmed,
          msg: `Phát hiện số literal lâm sàng trong biểu thức so sánh. Khuyến cáo nên quy về hằng số Threshold ID từ KB.`,
        });
      }
    }

    // 3. QA-7: Cảnh báo chuỗi literal trong dose, title, rationale chứa số lâm sàng
    const textMatch = textPropsRegex.exec(lineText);
    if (textMatch && !isAllowed) {
      const propName = textMatch[1];
      const stringValue = textMatch[3];

      const hasClinicalNumbers = extractClinicalNumbersWithUnits(stringValue);
      if (hasClinicalNumbers.length > 0 && !stringValue.includes('${')) {
        findings.push({
          level: 'warn',
          code: 'WARN_LITERAL_IN_TEXT',
          file: filePath,
          module: moduleName,
          line: lineNum,
          snippet: trimmed,
          msg: `Thuộc tính '${propName}' chứa số lâm sàng literal [${hasClinicalNumbers.map((n) => n.raw).join(', ')}] thay vì nội suy từ Threshold/DrugEntry.`,
        });
      }
    }

    // 4. QA-8: Kiểm tra tĩnh các lời gọi th('...'), thr('...'), dose('...'), renalBand('...')
    // Bắt th('id') hoặc thr('id')
    const thCallRegex = /\bth(?:r)?\(\s*['"]([^'"]+)['"]\s*\)/g;
    let thMatch: RegExpExecArray | null;
    while ((thMatch = thCallRegex.exec(lineText)) !== null) {
      const calledId = thMatch[1];
      if (!hasThreshold(calledId)) {
        findings.push({
          level: 'error',
          code: 'CALL_MISSING_THRESHOLD_ID',
          file: filePath,
          module: moduleName,
          line: lineNum,
          snippet: trimmed,
          msg: `[QA-8 LỖI THRESHOLD ID] Lời gọi th('${calledId}') hoặc thr('${calledId}') tham chiếu ID KHÔNG TỒN TẠI trong KB!`,
        });
      }
    }

    // Bắt dose('drugId', ...) hoặc renalBand('drugId', ...)
    const drugCallRegex = /\b(?:dose|renalBand)\(\s*['"]([^'"]+)['"]/g;
    let drugMatch: RegExpExecArray | null;
    while ((drugMatch = drugCallRegex.exec(lineText)) !== null) {
      const calledDrugId = drugMatch[1];
      if (!hasDrug(calledDrugId)) {
        findings.push({
          level: 'error',
          code: 'CALL_MISSING_DRUG_ID',
          file: filePath,
          module: moduleName,
          line: lineNum,
          snippet: trimmed,
          msg: `[QA-8 LỖI DRUG ID] Lời gọi dose('${calledDrugId}') hoặc renalBand('${calledDrugId}') tham chiếu drugId KHÔNG TỒN TẠI trong KB!`,
        });
      }
    }

    // 5. QA-10: Kiểm tra so sánh need(ctx, 'X') hoặc biến lâm sàng với th('id') mà quantity(id) !== X
    const varCompThRegex = /\b([A-Za-z0-9_]+)\s*(?:<=|>=|<|>|===|==)\s*th\(\s*['"]([^'"]+)['"]\s*\)/g;
    let vcMatch: RegExpExecArray | null;
    while ((vcMatch = varCompThRegex.exec(lineText)) !== null) {
      const varName = vcMatch[1];
      const threshId = vcMatch[2];
      const expectedQty = varToQuantity.get(varName);
      if (expectedQty && hasThreshold(threshId)) {
        try {
          const item = thr(threshId);
          if (item.quantity && item.quantity.toLowerCase() !== expectedQty.toLowerCase()) {
            findings.push({
              level: 'error',
              code: 'QA10_QUANTITY_MISMATCH',
              file: filePath,
              module: moduleName,
              line: lineNum,
              snippet: trimmed,
              msg: `[QA-10 DÙNG NHẦM NGƯỠNG] Biến lâm sàng '${varName}' (đại lượng: '${expectedQty}') đang so sánh với th('${threshId}') có đại lượng là '${item.quantity}' (giá trị: ${item.value} ${item.unit})! Khuyến cáo dùng thFor('${expectedQty}', '${threshId}').`,
            });
          }
        } catch {}
      }
    }

    const thCompVarRegex = /\bth\(\s*['"]([^'"]+)['"]\s*\)\s*(?:<=|>=|<|>|===|==)\s*([A-Za-z0-9_]+)\b/g;
    let tvMatch: RegExpExecArray | null;
    while ((tvMatch = thCompVarRegex.exec(lineText)) !== null) {
      const threshId = tvMatch[1];
      const varName = tvMatch[2];
      const expectedQty = varToQuantity.get(varName);
      if (expectedQty && hasThreshold(threshId)) {
        try {
          const item = thr(threshId);
          if (item.quantity && item.quantity.toLowerCase() !== expectedQty.toLowerCase()) {
            findings.push({
              level: 'error',
              code: 'QA10_QUANTITY_MISMATCH',
              file: filePath,
              module: moduleName,
              line: lineNum,
              snippet: trimmed,
              msg: `[QA-10 DÙNG NHẦM NGƯỠNG] Biến lâm sàng '${varName}' (đại lượng: '${expectedQty}') đang so sánh với th('${threshId}') có đại lượng là '${item.quantity}' (giá trị: ${item.value} ${item.unit})! Khuyến cáo dùng thFor('${expectedQty}', '${threshId}').`,
            });
          }
        } catch {}
      }
    }
  }

  // 6. QA-7: Kiểm tra "Citation có chứa số"
  if (citationsMap && citationsMap.size > 0) {
    const blockRegex = /\{[\s\S]*?(?:dose|note|title)\s*:\s*['"`](.*?)['"`][\s\S]*?citationIds\s*:\s*\[([\s\S]*?)\][\s\S]*?\}/g;
    let bMatch: RegExpExecArray | null;

    while ((bMatch = blockRegex.exec(content)) !== null) {
      const displayedText = bMatch[1];
      const cidsRaw = bMatch[2];
      const blockContent = bMatch[0];

      if (blockContent.includes('// qa-allow:')) continue;

      const clinicalNums = extractClinicalNumbersWithUnits(displayedText);
      if (clinicalNums.length === 0) continue;

      const rawCids = cidsRaw.match(/['"]([^'"]+)['"]/g) || [];
      const cids = rawCids.map((c) => c.replace(/['"]/g, '').trim()).filter((c) => c && !c.startsWith('TODO:'));

      if (cids.length === 0) continue;

      for (const item of clinicalNums) {
        if (item.unit === '%' || item.raw.includes('lần')) continue;

        let foundInAnyCitation = false;
        for (const cid of cids) {
          const citation = citationsMap.get(cid);
          if (citation && quoteContainsNumber(citation.quote, item.value)) {
            foundInAnyCitation = true;
            break;
          }
        }

        if (!foundInAnyCitation) {
          const lineOffset = content.substring(0, bMatch.index).split('\n').length;
          findings.push({
            level: 'warn',
            code: 'WARN_DOSE_NOT_IN_CITATION',
            file: filePath,
            module: moduleName,
            line: lineOffset,
            snippet: displayedText.slice(0, 80),
            msg: `Liều/số lâm sàng '${item.raw}' hiển thị trong văn bản nhưng KHÔNG xuất hiện trong bất kỳ trích dẫn liên kết nào [${cids.join(', ')}].`,
          });
        }
      }
    }

    // 7. QA-8/B4: CALL_MISSING_CITATION_ID (citationIds, 3 ngôi, mảng cục bộ, resolveCitationDisplay, missingInputRec)
    const stripped = content
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
    const seenCites = new Set<string>();
    const checkCite = (rawId: string, absPos: number) => {
      const cid = rawId.trim();
      if (!cid || cid.startsWith('TODO:') || cid.includes('${') || citationsMap.has(cid)) return;
      const ln = stripped.substring(0, absPos).split('\n').length;
      const key = `${ln}:${cid}`;
      if (seenCites.has(key)) return;
      seenCites.add(key);
      findings.push({
        level: 'warn',
        code: 'CALL_MISSING_CITATION_ID',
        file: filePath,
        module: moduleName,
        line: ln,
        snippet: (lines[ln - 1] ?? '').trim().slice(0, 100),
        msg: `[QA-8 CẢNH BÁO CITATION ID] Tham chiếu citationId '${cid}' KHÔNG TỒN TẠI trong KB citations!`,
      });
    };
    const scanArr = (seg: string, base: number) => {
      let am: RegExpExecArray | null;
      const ar = /\[([\s\S]*?)\]/g;
      while ((am = ar.exec(seg)) !== null) {
        let sm: RegExpExecArray | null;
        const sr = /['"]([^'"\n]+)['"]/g;
        while ((sm = sr.exec(am[1])) !== null) checkCite(sm[1], base + am.index + 1 + sm.index);
      }
    };
    const localCiteVars = new Set<string>();
    let m: RegExpExecArray | null;
    const cpRe = /\bcitationIds\s*:\s*([^;\n}]+(?:\n\s*[^;\n}:]+)*)/g;
    while ((m = cpRe.exec(stripped)) !== null) {
      scanArr(m[1], m.index + m[0].indexOf(m[1]));
      const noStr = m[1].replace(/['"][^'"\n]*['"]/g, '""');
      const dv = noStr.match(/^\s*([A-Za-z_]\w*)\s*(?:,|$)/);
      if (dv && !['true', 'false', 'undefined', 'null'].includes(dv[1])) localCiteVars.add(dv[1]);
      for (const sp of noStr.matchAll(/\.\.\.\s*([A-Za-z_]\w*)/g)) localCiteVars.add(sp[1]);
      const tv = noStr.match(/\?\s*([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)/);
      if (tv) { localCiteVars.add(tv[1]); localCiteVars.add(tv[2]); }
    }
    for (const ma of stripped.matchAll(/\bcitationIds\s*:\s*(?:[^;{}\n]*?\?\s*)?\[([\s\S]*?)\](?:\s*:\s*\[([\s\S]*?)\])?/g)) {
      scanArr(ma[0], ma.index ?? 0);
    }
    for (const rd of stripped.matchAll(/\bresolveCitationDisplay\(\s*['"]([^'"\n]+)['"]\s*\)/g)) {
      checkCite(rd[1], rd.index ?? 0);
    }
    for (const mr of stripped.matchAll(/\bmissingInputRec\([^;{}]*?,\s*(\[[\s\S]*?\])\s*\)/g)) {
      scanArr(mr[1], (mr.index ?? 0) + mr[0].lastIndexOf(mr[1]));
    }
    for (const vn of localCiteVars) {
      const esc = vn.replace(/\W/g, '\\$&');
      for (const pm of stripped.matchAll(new RegExp(`\\b${esc}\\.push\\(([\\s\\S]*?)\\)`, 'g'))) {
        const base = (pm.index ?? 0) + pm[0].indexOf(pm[1]);
        for (const sm of pm[1].matchAll(/['"]([^'"\n]+)['"]/g)) checkCite(sm[1], base + (sm.index ?? 0));
      }
      for (const am of stripped.matchAll(new RegExp(`\\b${esc}\\s*(?::[^=;]+)?=\\s*([^;]+)`, 'g'))) {
        scanArr(am[1], (am.index ?? 0) + am[0].lastIndexOf(am[1]));
      }
    }
  }

  return findings;
}

/**
 * Quét toàn bộ thư mục src/modules và lập báo cáo thống kê chi tiết theo module
 */
export function scanModulesLint(baseDir?: string, citationsMap?: Map<string, Citation>): RuleLintReport {
  const root = baseDir ?? resolve(process.cwd(), 'gdmt-vn');
  const modulesDir = existsSync(join(root, 'src', 'modules'))
    ? join(root, 'src', 'modules')
    : resolve(process.cwd(), 'src', 'modules');

  // Đảm bảo dữ liệu KB luôn được nạp đầy đủ trong mọi ngữ cảnh (Vite lẫn Node.js CLI)
  if (getAllThresholds().length === 0) {
    const kbData = loadKbDataFromFs(root);
    setCustomKbData(kbData.thresholds, kbData.drugs);
  }

  let activeCitationsMap = citationsMap;
  if (!activeCitationsMap) {
    activeCitationsMap = new Map<string, Citation>();
    const kbDir = existsSync(join(root, 'kb')) ? join(root, 'kb') : resolve(process.cwd(), 'kb');
    const citeDir = join(kbDir, 'citations');
    if (existsSync(citeDir)) {
      for (const entry of readdirSync(citeDir)) {
        if (entry.endsWith('.json')) {
          try {
            const raw = readFileSync(join(citeDir, entry), 'utf8');
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              for (const c of arr) if (c && c.id) activeCitationsMap.set(c.id, c);
            }
          } catch {
            /* bỏ qua file lỗi */
          }
        }
      }
    }
  }

  const files = getModuleTsFiles(modulesDir);
  const allFindings: RuleLintFinding[] = [];
  const byModule: Record<string, ModuleLintStats> = {};

  for (const f of files) {
    const content = readFileSync(f, 'utf8');
    const rel = f.replace(/.*src[\\/]modules[\\/]/, 'modules/');
    const mod = extractModuleName(rel);

    if (!byModule[mod]) {
      byModule[mod] = {
        module: mod,
        filesScanned: 0,
        defaultNumberErrors: 0,
        moduleConstErrors: 0,
        invalidQaAllowErrors: 0,
        missingCallIdErrors: 0,
        missingCitationIdWarnings: 0,
        qa10QuantityMismatchErrors: 0,
        literalThresholdWarnings: 0,
        literalInTextWarnings: 0,
        doseNotInCitationWarnings: 0,
        qaAllowValidCount: 0,
        qaAllowInvalidCount: 0,
      };
    }
    byModule[mod].filesScanned++;

    // Đếm qa-allow
    const lines = content.split('\n');
    for (const l of lines) {
      const qa = parseQaAllow(l);
      if (qa.hasQaAllow) {
        if (qa.isValid) byModule[mod].qaAllowValidCount++;
        else byModule[mod].qaAllowInvalidCount++;
      }
    }

    const findings = lintRuleContent(content, rel, activeCitationsMap);
    for (const item of findings) {
      if (item.code === 'CLINICAL_DEFAULT_NUMBER') byModule[mod].defaultNumberErrors++;
      if (item.code === 'MODULE_CONST_CLINICAL_NUMBERS') byModule[mod].moduleConstErrors++;
      if (item.code === 'INVALID_QA_ALLOW_CATEGORY') byModule[mod].invalidQaAllowErrors++;
      if (item.code === 'CALL_MISSING_THRESHOLD_ID' || item.code === 'CALL_MISSING_DRUG_ID') byModule[mod].missingCallIdErrors++;
      if (item.code === 'CALL_MISSING_CITATION_ID') byModule[mod].missingCitationIdWarnings++;
      if (item.code === 'QA10_QUANTITY_MISMATCH') byModule[mod].qa10QuantityMismatchErrors++;
      if (item.code === 'LITERAL_CLINICAL_THRESHOLD') byModule[mod].literalThresholdWarnings++;
      if (item.code === 'WARN_LITERAL_IN_TEXT') byModule[mod].literalInTextWarnings++;
      if (item.code === 'WARN_DOSE_NOT_IN_CITATION') byModule[mod].doseNotInCitationWarnings++;
    }

    allFindings.push(...findings);
  }

  const totalErrors = allFindings.filter((f) => f.level === 'error').length;
  const totalWarnings = allFindings.filter((f) => f.level === 'warn').length;

  return {
    totalFilesScanned: files.length,
    totalErrors,
    totalWarnings,
    byModule,
    findings: allFindings,
  };
}
