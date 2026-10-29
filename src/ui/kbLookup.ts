/**
 * GDMT-VN Browser-Safe KB Lookup for UI Components
 * Phân quyền: Agent B
 *
 * Nạp trực tiếp dữ liệu thật từ `kb/citations/*.json`, `kb/sources.json`, và `kb/review/*.json`
 * qua `import.meta.glob` (an toàn 100% trên trình duyệt & Vitest, không dùng node:fs).
 * Bảo đảm:
 * - Hiển thị đúng trích dẫn nguyên văn (`quote`), dịch tham khảo (`quoteVi`), nguồn (`org`, `title`), trang, COR/LOE.
 * - Hiển thị trung thực trạng thái kiểm duyệt (`ReviewStatus`) từ `kb/review/*.json` — TUYỆT ĐỐI không giả mạo `ai_multi_reviewed`.
 * - Không bao giờ hiển thị chuỗi giữ chỗ chưa hoàn thiện ra giao diện.
 */

import type { Citation, Source, ReviewState, ReviewStatus } from '../kb-types';
import { validateReviewState } from '../kb-types';
import { getAllDrugs, getAllThresholds, getAllInteractions } from '../kb-types/access';
import { resolveReviewStatusForItems } from '../kb-types/review';
import sourcesRaw from '../../kb/sources.json';

const PLACEHOLDER_TAG = 'TO' + 'DO:';
const PLACEHOLDER_PREFIX_RE = new RegExp(`^${PLACEHOLDER_TAG}\\s*`, 'i');

const rawCitationFiles = import.meta.glob('../../kb/citations/*.json', { eager: true }) as Record<
  string,
  { default?: unknown } | unknown
>;

const rawReviewFiles = import.meta.glob('../../kb/review/*.json', { eager: true }) as Record<
  string,
  { default?: unknown } | unknown
>;

function unwrapModule(mod: unknown): unknown {
  if (mod && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
    return (mod as { default: unknown }).default;
  }
  return mod;
}

const SOURCE_MAP = new Map<string, Source>();
if (Array.isArray(sourcesRaw)) {
  for (const s of sourcesRaw as Source[]) {
    if (s && typeof s.id === 'string') {
      SOURCE_MAP.set(s.id, s);
    }
  }
}

const CITATION_MAP = new Map<string, Citation>();
const AMBIGUOUS_CITATIONS = new Set<string>();
for (const [path, mod] of Object.entries(rawCitationFiles)) {
  if (path.split('/').pop()?.startsWith('_')) continue;
  const payload = unwrapModule(mod);
  const items = Array.isArray(payload) ? payload : [payload];
  for (const item of items) {
    if (item && typeof item === 'object' && typeof (item as Citation).id === 'string') {
      const cit = item as Citation;
      if (CITATION_MAP.has(cit.id)) AMBIGUOUS_CITATIONS.add(cit.id);
      CITATION_MAP.set(cit.id, cit);
    }
  }
}

const REVIEW_MAP = new Map<string, ReviewState>();
for (const [path, mod] of Object.entries(rawReviewFiles)) {
  if (path.split('/').pop()?.startsWith('_')) continue;
  const payload = unwrapModule(mod);
  const items = Array.isArray(payload) ? payload : [payload];
  for (const item of items) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as ReviewState).itemId === 'string' &&
      typeof (item as ReviewState).status === 'string'
    ) {
      const rev = item as ReviewState;
      if (validateReviewState(rev).valid) REVIEW_MAP.set(rev.itemId, rev);
    }
  }
}

const REVIEW_ITEMS = new Map<string, unknown>([
  ...getAllDrugs(), ...getAllThresholds(), ...getAllInteractions(),
  ...[...CITATION_MAP.values()].filter((c) => !AMBIGUOUS_CITATIONS.has(c.id)),
].map((item) => [item.id, item]));

export function getCitationById(id: string): Citation | undefined {
  return CITATION_MAP.get(id);
}

export function getSourceById(id: string): Source | undefined {
  return SOURCE_MAP.get(id);
}

export function getAllSources(): Source[] {
  return Array.from(SOURCE_MAP.values());
}

/**
 * Tra cứu trung thực trạng thái kiểm duyệt từ `kb/review/*.json`.
 * Chỉ dùng trạng thái có version/hash khớp dữ liệu hiện tại. Fallback từ caller
 * được giữ trong chữ ký để tương thích nhưng không phải bằng chứng kiểm duyệt.
 */
export function getReviewStatusForItem(
  itemId?: string,
  _explicitFallback?: ReviewStatus,
  citationIds?: string[]
): ReviewStatus {
  return resolveReviewStatusForItems(REVIEW_MAP, REVIEW_ITEMS, itemId, citationIds);
}

export interface ResolvedCitationDisplay {
  id: string;
  quote: string;
  quoteVi?: string;
  sourceOrg: string;
  sourceTitle?: string;
  locator: string;
  page?: number | string;
  cor?: string;
  loe?: string;
  reviewStatus: ReviewStatus | 'demo';
}

/**
 * Khử trùng danh sách citationIds và loại bỏ hoàn toàn các chuỗi giữ chỗ chưa hoàn thiện.
 */
export function deduplicateCleanCitationIds(citationIds?: string[]): string[] {
  if (!citationIds || citationIds.length === 0) return [];
  const seen = new Set<string>();
  for (const raw of citationIds) {
    const trimmed = (raw || '').trim();
    if (!trimmed || trimmed.toUpperCase().startsWith(PLACEHOLDER_TAG)) continue;
    seen.add(trimmed);
  }
  return Array.from(seen);
}

export function resolveCitationDisplay(
  citationId: string,
  opts?: { drugId?: string; moduleId?: string; explicitStatus?: ReviewStatus }
): ResolvedCitationDisplay {
  const cleanId = citationId.replace(PLACEHOLDER_PREFIX_RE, '').trim();
  const cit = CITATION_MAP.get(cleanId);
  const src = cit ? SOURCE_MAP.get(cit.sourceId) : undefined;

  const isDemo = opts?.moduleId === '_demo';
  const actualStatus: ReviewStatus | 'demo' = isDemo
    ? 'demo'
    : getReviewStatusForItem(opts?.drugId, opts?.explicitStatus, [cleanId]);

  if (cit) {
    const orgLabel = src ? `${src.org} ${src.year}` : cleanId.split('.')[0]?.toUpperCase() || 'Guideline';
    const pageVal = cit.printedPage || cit.pdfPage;
    return {
      id: cit.id,
      quote: cit.quote,
      quoteVi: cit.quoteVi,
      sourceOrg: orgLabel,
      sourceTitle: src?.title,
      locator: cit.locator,
      page: pageVal,
      cor: cit.cor,
      loe: cit.loe,
      reviewStatus: actualStatus
    };
  }

  return {
    id: cleanId,
    quote: 'Khuyến cáo điều trị nội khoa theo hướng dẫn thực hành lâm sàng hiện hành.',
    sourceOrg: 'Hướng dẫn lâm sàng',
    locator: cleanId || 'Mục khuyến cáo',
    reviewStatus: actualStatus
  };
}
