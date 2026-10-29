/**
 * GDMT-VN Citation Verification Engine
 *
 * Ported and adapted from: on-call/tools/m12/citations.ts
 *
 * Nhiệm vụ:
 * 1. Chuẩn hóa chuỗi so khớp (NFC, unicode hyphens, quotes, whitespace).
 * 2. Trích xuất text PDF theo trang và cache nhiều tầng:
 *    - gdmt-vn/tools/kb/.cache
 *    - on-call/tools/m12/.cache
 *    - Medical_Library_2026/00_INDEX/_text_cache
 * 3. Hỗ trợ trích xuất text HTML (nhãn thuốc FDA DailyMed / EMA).
 * 4. So khớp nguyên văn (verbatim quote):
 *    - Khớp đúng pdfPage -> OK.
 *    - Khớp ở trang lân cận (pdfPage ± 1) -> Warning WARN_PAGE_TOLERANCE.
 *    - Không khớp hoặc sai trang xa -> Error.
 * 5. Hỗ trợ kiểm tra sự hiện diện của giá trị số (orphan number check).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Citation, Source } from '../../src/kb-types/index';

const here = dirname(fileURLToPath(import.meta.url));

export const LIBRARY_ROOT =
  process.env.GDMT_LIBRARY ??
  process.env.ONCALL_LIBRARY ??
  'C:\\Users\\hades\\OneDrive\\Desktop\\Medical_Library_2026';

const PRIMARY_CACHE = join(here, '.cache');
const FALLBACK_CACHE_ONCALL = resolve(here, '../../../on-call/tools/m12/.cache');
const FALLBACK_CACHE_LIBRARY = join(LIBRARY_ROOT, '00_INDEX', '_text_cache');

/**
 * Chuẩn hóa chuỗi để so khớp: NFC, chữ thường, bỏ toàn bộ khoảng trắng, thống nhất gạch nối & nháy.
 */
export function normalizeForMatch(s: string): string {
  if (!s) return '';
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
    .replace(/\s+/g, '');
}

/**
 * Loại bỏ tag HTML, script, style và giải mã các thực thể HTML cơ bản
 */
export function citationHtmlText(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const value = code.startsWith('x') ? parseInt(code.slice(1), 16) : Number(code);
      return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : '';
    })
    .replace(
      /&(nbsp|amp|lt|gt|quot|apos|ndash|mdash|le|ge|ge;|le;);/gi,
      (_, name: string) =>
        ({
          nbsp: ' ',
          amp: '&',
          lt: '<',
          gt: '>',
          quot: '"',
          apos: "'",
          ndash: '–',
          mdash: '—',
          le: '≤',
          ge: '≥',
        }[name.toLowerCase().replace(';', '')] ?? '')
    );
}

// In-memory page cache cho tiến trình hiện tại
const pageCache = new Map<string, string[]>();

/**
 * Lấy các trang text của file PDF, tận dụng cache nhiều tầng
 */
export function getPdfPages(pdfAbsPath: string): string[] {
  const normalizedPath = resolve(pdfAbsPath);
  if (pageCache.has(normalizedPath)) {
    return pageCache.get(normalizedPath)!;
  }

  if (!existsSync(normalizedPath)) {
    throw new Error(`File PDF không tồn tại: ${normalizedPath}`);
  }

  mkdirSync(PRIMARY_CACHE, { recursive: true });
  const hash = createHash('sha1').update(normalizedPath).digest('hex').slice(0, 16);
  const primaryJson = join(PRIMARY_CACHE, `${hash}.json`);

  // 1. Kiểm tra cache chính
  if (existsSync(primaryJson)) {
    try {
      const data = JSON.parse(readFileSync(primaryJson, 'utf8')) as { pages: string[] };
      if (Array.isArray(data.pages)) {
        pageCache.set(normalizedPath, data.pages);
        return data.pages;
      }
    } catch {
      /* Cache hỏng -> thử fallback */
    }
  }

  // 2. Kiểm tra cache từ on-call nếu có
  const oncallJson = join(FALLBACK_CACHE_ONCALL, `${hash}.json`);
  if (existsSync(oncallJson)) {
    try {
      const content = readFileSync(oncallJson, 'utf8');
      const data = JSON.parse(content) as { pages: string[] };
      if (Array.isArray(data.pages)) {
        writeFileSync(primaryJson, content, 'utf8'); // copy vào local cache
        pageCache.set(normalizedPath, data.pages);
        return data.pages;
      }
    } catch {
      /* Bỏ qua */
    }
  }

  // 3. Kiểm tra cache thư viện
  const libraryJson = join(FALLBACK_CACHE_LIBRARY, `${hash}.json`);
  if (existsSync(libraryJson)) {
    try {
      const content = readFileSync(libraryJson, 'utf8');
      const data = JSON.parse(content) as { pages: string[] };
      if (Array.isArray(data.pages)) {
        writeFileSync(primaryJson, content, 'utf8');
        pageCache.set(normalizedPath, data.pages);
        return data.pages;
      }
    } catch {
      /* Bỏ qua */
    }
  }

  // 4. Trích xuất mới bằng pdf_text.py
  const pythonBin = process.env.PYTHON ?? 'python';
  const scriptPath = join(here, 'pdf_text.py');
  try {
    execFileSync(pythonBin, [scriptPath, normalizedPath, primaryJson], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    const data = JSON.parse(readFileSync(primaryJson, 'utf8')) as { pages: string[] };
    pageCache.set(normalizedPath, data.pages);
    return data.pages;
  } catch (err) {
    throw new Error(`Không thể trích xuất PDF (${normalizedPath}): ${(err as Error).message}`);
  }
}

export interface CitationVerificationFinding {
  level: 'info' | 'warn' | 'error';
  code:
    | 'CITE_OK'
    | 'WARN_PAGE_TOLERANCE'
    | 'CITE_WRONG_PAGE'
    | 'CITE_NOT_FOUND'
    | 'CITE_FILE_MISSING'
    | 'CITE_EXTRACT_ERROR'
    | 'CITE_HTML_OK'
    | 'CITE_HTML_NOT_FOUND';
  msg: string;
}

export interface CitationVerificationResult {
  citationId: string;
  sourceId: string;
  ok: boolean;
  expectedPage?: number;
  foundPages: number[];
  findings: CitationVerificationFinding[];
  detail: string;
}

/**
 * Kiểm tra một Citation đối chiếu với Source tương ứng
 */
export function verifyCitation(citation: Citation, source: Source): CitationVerificationResult {
  const findings: CitationVerificationFinding[] = [];
  const needle = normalizeForMatch(citation.quote);

  if (!needle) {
    findings.push({
      level: 'error',
      code: 'CITE_NOT_FOUND',
      msg: `Citation ${citation.id}: quote rỗng`,
    });
    return {
      citationId: citation.id,
      sourceId: source.id,
      ok: false,
      expectedPage: citation.pdfPage,
      foundPages: [],
      findings,
      detail: 'Quote rỗng',
    };
  }

  // Nếu source có localPath (PDF hoặc HTML)
  if (source.localPath) {
    const absPath = resolve(LIBRARY_ROOT, source.localPath);
    if (!existsSync(absPath)) {
      findings.push({
        level: 'error',
        code: 'CITE_FILE_MISSING',
        msg: `Source ${source.id}: không tìm thấy file local tại ${source.localPath} (LIBRARY_ROOT: ${LIBRARY_ROOT})`,
      });
      return {
        citationId: citation.id,
        sourceId: source.id,
        ok: false,
        expectedPage: citation.pdfPage,
        foundPages: [],
        findings,
        detail: 'File không tồn tại',
      };
    }

    const isPdf = absPath.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      let pages: string[] = [];
      try {
        pages = getPdfPages(absPath);
      } catch (err) {
        findings.push({
          level: 'error',
          code: 'CITE_EXTRACT_ERROR',
          msg: `Citation ${citation.id}: Lỗi trích xuất PDF: ${(err as Error).message}`,
        });
        return {
          citationId: citation.id,
          sourceId: source.id,
          ok: false,
          expectedPage: citation.pdfPage,
          foundPages: [],
          findings,
          detail: 'Lỗi đọc PDF',
        };
      }

      // Tìm kiếm chuỗi needle trong các trang (1-based index)
      const foundPages: number[] = [];
      pages.forEach((pageText, idx) => {
        if (normalizeForMatch(pageText).includes(needle)) {
          foundPages.push(idx + 1);
        }
      });

      const exp = citation.pdfPage;

      if (foundPages.length === 0) {
        findings.push({
          level: 'error',
          code: 'CITE_NOT_FOUND',
          msg: `Citation ${citation.id}: KHÔNG tìm thấy trích dẫn nguyên văn "${citation.quote.slice(0, 70)}..." trong ${source.localPath}`,
        });
        return {
          citationId: citation.id,
          sourceId: source.id,
          ok: false,
          expectedPage: exp,
          foundPages: [],
          findings,
          detail: 'Không tìm thấy trong PDF',
        };
      }

      // Đã tìm thấy ở ít nhất 1 trang
      if (exp !== undefined) {
        if (foundPages.includes(exp)) {
          findings.push({
            level: 'info',
            code: 'CITE_OK',
            msg: `Citation ${citation.id}: Khớp nguyên văn tại trang ${exp}`,
          });
          return {
            citationId: citation.id,
            sourceId: source.id,
            ok: true,
            expectedPage: exp,
            foundPages,
            findings,
            detail: `Khớp nguyên văn tại trang ${exp}`,
          };
        } else if (foundPages.includes(exp - 1) || foundPages.includes(exp + 1)) {
          // Dung sai ±1 trang
          const nearbyPage = foundPages.find((p) => p === exp - 1 || p === exp + 1);
          findings.push({
            level: 'warn',
            code: 'WARN_PAGE_TOLERANCE',
            msg: `Citation ${citation.id}: Khớp ở trang lân cận p.${nearbyPage} (khai báo p.${exp}, dung sai ±1)`,
          });
          return {
            citationId: citation.id,
            sourceId: source.id,
            ok: true,
            expectedPage: exp,
            foundPages,
            findings,
            detail: `Khớp trang lân cận p.${nearbyPage}`,
          };
        } else {
          // Khớp ở trang xa
          findings.push({
            level: 'error',
            code: 'CITE_WRONG_PAGE',
            msg: `Citation ${citation.id}: Trích dẫn nằm ở trang ${foundPages.join(', ')} chứ không phải p.${exp}`,
          });
          return {
            citationId: citation.id,
            sourceId: source.id,
            ok: false,
            expectedPage: exp,
            foundPages,
            findings,
            detail: `Sai trang: tìm thấy ở p.${foundPages.join(', ')} khác p.${exp}`,
          };
        }
      } else {
        // Không chỉ định pdfPage
        findings.push({
          level: 'info',
          code: 'CITE_OK',
          msg: `Citation ${citation.id}: Khớp nguyên văn tại trang ${foundPages.join(', ')} (chưa ghi pdfPage)`,
        });
        return {
          citationId: citation.id,
          sourceId: source.id,
          ok: true,
          expectedPage: undefined,
          foundPages,
          findings,
          detail: `Khớp tại trang ${foundPages.join(', ')}`,
        };
      }
    } else {
      // Nguồn HTML (nhãn thuốc)
      const rawHtml = readFileSync(absPath, 'utf8');
      const text = citationHtmlText(rawHtml);
      const matched = normalizeForMatch(text).includes(needle);
      if (matched) {
        findings.push({
          level: 'info',
          code: 'CITE_HTML_OK',
          msg: `Citation ${citation.id}: Khớp nguyên văn trong tài liệu HTML ${source.localPath}`,
        });
        return {
          citationId: citation.id,
          sourceId: source.id,
          ok: true,
          foundPages: [1],
          findings,
          detail: 'Khớp trong HTML',
        };
      } else {
        findings.push({
          level: 'error',
          code: 'CITE_HTML_NOT_FOUND',
          msg: `Citation ${citation.id}: KHÔNG tìm thấy trích dẫn trong file HTML ${source.localPath}`,
        });
        return {
          citationId: citation.id,
          sourceId: source.id,
          ok: false,
          foundPages: [],
          findings,
          detail: 'Không tìm thấy trong HTML',
        };
      }
    }
  }

  // Nguồn chỉ có URL (chưa tải offline) -> cảnh báo
  findings.push({
    level: 'warn',
    code: 'WARN_PAGE_TOLERANCE',
    msg: `Citation ${citation.id}: Nguồn ${source.id} chỉ có URL trực tuyến (${source.url}), chưa có localPath`,
  });
  return {
    citationId: citation.id,
    sourceId: source.id,
    ok: true,
    foundPages: [],
    findings,
    detail: 'Nguồn trực tuyến (bỏ qua kiểm tra offline)',
  };
}

/**
 * Kiểm tra xem một đoạn trích dẫn (quote) có chứa giá trị số mục tiêu hay không.
 * Xử lý linh hoạt dấu thập phân ('.' hoặc ','), các toán tử (≥, ≤, >, <, =) và khoảng trắng.
 */
export function quoteContainsNumber(quote: string, targetValue: number): boolean {
  if (typeof targetValue !== 'number' || !Number.isFinite(targetValue)) return false;

  // 1. Chuẩn hóa chuỗi text cơ bản
  const normalized = quote
    .normalize('NFC')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[≥]/g, '>=')
    .replace(/[≤]/g, '<=');

  // Chuỗi số cần tìm (ví dụ 20 hoặc 3.5)
  const valStr = String(targetValue);
  const commaValStr = valStr.replace('.', ',');

  // Regex tìm số: đứng độc lập hoặc sau toán tử
  // Cho phép tiền tố như >=, <=, >, <, =, :, khoảng trắng
  const escapedVal = valStr.replace('.', '\\.');
  const escapedComma = commaValStr.replace(',', '\\,');

  const pattern = new RegExp(
    `(^|[^0-9a-zA-Z_])(?:>=|<=|>|<|=|≥|≤|\\+|-)?\\s*(?:${escapedVal}|${escapedComma})(?![0-9])`,
    'i'
  );

  if (pattern.test(normalized)) return true;

  // Hỗ trợ từ ngữ định lượng y khoa trong tiếng Anh: 2 -> "twice", 1 -> "once"
  if (targetValue === 2 && /\btwice\b/i.test(quote)) return true;
  if (targetValue === 1 && /\bonce\b/i.test(quote)) return true;

  return false;
}
