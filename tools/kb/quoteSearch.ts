/**
 * GDMT-VN Verbatim Quote Search Tool
 *
 * Ported and adapted from: on-call/tools/m12/quoteSearch.ts
 *
 * Mục đích:
 * Tìm kiếm các câu trích dẫn nguyên văn từ kho tài liệu Medical_Library_2026
 * để phục vụ việc soạn thảo Source / Citation / Threshold / DrugEntry.
 *
 * Cách dùng:
 *   npx tsx tools/kb/quoteSearch.ts --list
 *   npx tsx tools/kb/quoteSearch.ts --pdf "01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf" --query "SGLT2" [--max 10] [--context 60]
 *   npx tsx tools/kb/quoteSearch.ts --all --query "eGFR < 20" [--max 20]
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { LIBRARY_ROOT, getPdfPages, normalizeForMatch } from './citations';

function walkPdfs(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      out.push(...walkPdfs(full));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      out.push(relative(LIBRARY_ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

export interface QuoteSearchResult {
  localPath: string;
  pdfPage: number;
  locator: string;
  snippet: string;
  verified: boolean;
}

export function searchPdfFile(
  relPath: string,
  query: string,
  maxHits = 10,
  contextChars = 60
): QuoteSearchResult[] {
  const absPath = resolve(LIBRARY_ROOT, relPath);
  if (!existsSync(absPath)) {
    throw new Error(`File không tồn tại: ${absPath}`);
  }

  const results: QuoteSearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  const pages = getPdfPages(absPath);

  let hits = 0;
  for (let i = 0; i < pages.length; i++) {
    const raw = pages[i].replace(/\s+/g, ' ').trim();
    const lower = raw.toLowerCase();
    let pos = lower.indexOf(lowerQuery);

    while (pos !== -1 && hits < maxHits) {
      const start = Math.max(0, pos - contextChars);
      const end = Math.min(raw.length, pos + lowerQuery.length + contextChars + 50);
      const snippet = raw.slice(start, end).trim();
      const verified = normalizeForMatch(pages[i]).includes(normalizeForMatch(snippet));

      results.push({
        localPath: relPath,
        pdfPage: i + 1,
        locator: `p. ${i + 1}`,
        snippet,
        verified,
      });

      hits++;
      pos = lower.indexOf(lowerQuery, pos + lowerQuery.length + 30);
    }

    if (hits >= maxHits) break;
  }

  return results;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log(`\n=== DANH MỤC TÀI LIỆU PDF TRONG THƯ VIỆN (${LIBRARY_ROOT}) ===\n`);
    const list = walkPdfs(LIBRARY_ROOT);
    list.forEach((p, idx) => console.log(`[${idx + 1}] ${p}`));
    console.log(`\nTổng cộng: ${list.length} tài liệu PDF.\n`);
    return;
  }

  const queryIdx = args.indexOf('--query');
  if (queryIdx < 0 || !args[queryIdx + 1]) {
    console.error(`
Cú pháp sử dụng:
  npx tsx tools/kb/quoteSearch.ts --list
  npx tsx tools/kb/quoteSearch.ts --pdf "<đường_dẫn_tương_đối>" --query "<từ_khóa>" [--max 10] [--context 60]
  npx tsx tools/kb/quoteSearch.ts --all --query "<từ_khóa>" [--max 20]
    `);
    process.exit(1);
  }

  const query = args[queryIdx + 1];
  const maxIdx = args.indexOf('--max');
  const maxHits = maxIdx >= 0 && args[maxIdx + 1] ? Number(args[maxIdx + 1]) : 10;
  const contextIdx = args.indexOf('--context');
  const contextChars = contextIdx >= 0 && args[contextIdx + 1] ? Number(args[contextIdx + 1]) : 60;
  const isJson = args.includes('--json');

  if (args.includes('--all')) {
    console.log(`\n[QuoteSearch] Đang tìm kiếm "${query}" trên TOÀN THƯ VIỆN...`);
    const allPdfs = walkPdfs(LIBRARY_ROOT);
    let totalHits = 0;
    const allResults: QuoteSearchResult[] = [];

    for (const rel of allPdfs) {
      try {
        const hits = searchPdfFile(rel, query, Math.max(1, maxHits - totalHits), contextChars);
        if (hits.length > 0) {
          allResults.push(...hits);
          totalHits += hits.length;
          if (totalHits >= maxHits) break;
        }
      } catch {
        /* Bỏ qua file lỗi */
      }
    }

    if (isJson) {
      console.log(JSON.stringify(allResults, null, 2));
    } else {
      console.log(`Tìm thấy ${allResults.length} kết quả:\n`);
      for (const r of allResults) {
        console.log(`------------------------------------------------------------`);
        console.log(`File:    ${r.localPath}`);
        console.log(`Trang:   p. ${r.pdfPage} (locator: "${r.locator}")`);
        console.log(`Khớp:    ${r.verified ? '✔ CHÍNH XÁC (verbatim match)' : '✖ LỖI SO KHỚP'}`);
        console.log(`Snippet: "${r.snippet}"`);
      }
      console.log(`------------------------------------------------------------\n`);
    }
    return;
  }

  const pdfIdx = args.indexOf('--pdf');
  if (pdfIdx < 0 || !args[pdfIdx + 1]) {
    console.error('Thiếu cờ --pdf hoặc --all. Dùng --help để xem hướng dẫn.');
    process.exit(1);
  }

  const relPdf = args[pdfIdx + 1];
  console.log(`\n[QuoteSearch] Tìm kiếm "${query}" trong: ${relPdf}`);

  try {
    const hits = searchPdfFile(relPdf, query, maxHits, contextChars);
    if (isJson) {
      console.log(JSON.stringify(hits, null, 2));
    } else {
      console.log(`Tìm thấy ${hits.length} kết quả:\n`);
      for (const r of hits) {
        console.log(`------------------------------------------------------------`);
        console.log(`Trang:   p. ${r.pdfPage}`);
        console.log(`Khớp:    ${r.verified ? '✔ CHÍNH XÁC' : '✖ KHÔNG KHỚP'}`);
        console.log(`Snippet: "${r.snippet}"`);
      }
      console.log(`------------------------------------------------------------\n`);
    }
  } catch (err) {
    console.error(`Lỗi: ${(err as Error).message}`);
    process.exit(1);
  }
}

// Chạy trực tiếp qua CLI
if (process.argv[1] && process.argv[1].endsWith('quoteSearch.ts')) {
  main();
}
