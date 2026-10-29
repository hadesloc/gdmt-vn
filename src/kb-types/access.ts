/**
 * GDMT-VN Knowledge Base Accessor (QA-8 Central Access API)
 * Phân quyền: Agent C
 *
 * Điểm truy cập duy nhất cho các quy tắc lâm sàng, ma trận và UI:
 * - th(id): Lấy giá trị số (number) của Threshold (throw Error nếu ID không tồn tại).
 * - thr(id): Lấy toàn bộ đối tượng Threshold (value, unit, citationIds) để gắn trích dẫn.
 * - drug(drugId): Lấy thông tin đối tượng DrugEntry.
 * - dose(drugId, kind): Lấy liều khởi đầu, đích, bước chuẩn độ, hoặc liều tối đa.
 * - renalBand(drugId, val, kind): Lấy dải liều theo chức năng thận eGFR hoặc CrCl.
 * - fmtDose(dose): Định dạng chuỗi liều tiếng Việt chuẩn mực.
 *
 * THUẦN TRÌNH DUYỆT 100% (Browser-safe, không kéo node:* module để Vite build sạch).
 * Nạp tĩnh toàn bộ JSON qua Vite `import.meta.glob` eager.
 */

import type { Threshold, DrugEntry, Dose, RenalBand, ThresholdQuantity, InteractionRule } from './index';

// Khởi tạo các Map lưu trữ
const thresholdsMap = new Map<string, Threshold>();
const drugsMap = new Map<string, DrugEntry>();
const interactionsMap = new Map<string, InteractionRule>();
let isLoaded = false;

/**
 * Trích xuất mảng item từ module import
 */
function extractItems<T>(mod: unknown): T[] {
  if (!mod) return [];
  if (Array.isArray(mod)) return mod as T[];
  if (typeof mod === 'object') {
    const obj = mod as Record<string, unknown>;
    if (Array.isArray(obj.default)) return obj.default as T[];
    if (obj.default && typeof obj.default === 'object') return [obj.default as T];
    return [obj as unknown as T];
  }
  return [];
}

/**
 * Kiểm tra đường dẫn có phải file mẫu (_*.json) hoặc index.json cần bỏ qua khi nạp danh mục thật
 */
function shouldSkipKbPath(filePath: string, skipIndex = false): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const baseName = normalized.slice(normalized.lastIndexOf('/') + 1);
  if (baseName.startsWith('_')) return true;
  if (skipIndex && baseName.toLowerCase() === 'index.json') return true;
  return false;
}

/**
 * Nạp dữ liệu tĩnh qua Vite `import.meta.glob` (chạy trong Browser client và Vitest)
 */
export function ensureLoaded(): void {
  if (isLoaded) return;

  try {
    const threshModules = (import.meta as unknown as { glob: Function }).glob('../../kb/thresholds/**/*.json', { eager: true }) as Record<string, unknown>;
    for (const [filePath, raw] of Object.entries(threshModules)) {
      if (shouldSkipKbPath(filePath)) continue;
      const list = extractItems<Threshold>(raw);
      for (const t of list) {
        if (t && t.id) thresholdsMap.set(t.id, t);
      }
    }

    const drugModules = (import.meta as unknown as { glob: Function }).glob('../../kb/drugs/**/*.json', { eager: true }) as Record<string, unknown>;
    for (const [filePath, raw] of Object.entries(drugModules)) {
      if (shouldSkipKbPath(filePath)) continue;
      const list = extractItems<DrugEntry>(raw);
      for (const d of list) {
        if (d && d.id) drugsMap.set(d.id, d);
      }
    }

    const interactionModules = (import.meta as unknown as { glob: Function }).glob('../../kb/interactions/**/*.json', { eager: true }) as Record<string, unknown>;
    for (const [filePath, raw] of Object.entries(interactionModules)) {
      if (shouldSkipKbPath(filePath, true)) continue;
      const list = extractItems<InteractionRule>(raw);
      for (const ix of list) {
        if (ix && ix.id) interactionsMap.set(ix.id, ix);
      }
    }
  } catch (err) {
    // Chế độ thuần Node/CLI: bỏ qua vì các tools Node sẽ dùng setCustomKbData()
  }

  isLoaded = true;
}

/**
 * Cho phép CLI / Node tools nạp hoặc bổ sung dữ liệu vào Accessor Map khi chạy ngoài môi trường Vite
 */
export function setCustomKbData(
  customThresholds?: Map<string, Threshold> | Threshold[],
  customDrugs?: Map<string, DrugEntry> | DrugEntry[],
  customInteractions?: Map<string, InteractionRule> | InteractionRule[]
): void {
  if (customThresholds) {
    if (Array.isArray(customThresholds)) {
      for (const t of customThresholds) if (t && t.id) thresholdsMap.set(t.id, t);
    } else {
      for (const [k, v] of customThresholds.entries()) thresholdsMap.set(k, v);
    }
  }
  if (customDrugs) {
    if (Array.isArray(customDrugs)) {
      for (const d of customDrugs) if (d && d.id) drugsMap.set(d.id, d);
    } else {
      for (const [k, v] of customDrugs.entries()) drugsMap.set(k, v);
    }
  }
  if (customInteractions) {
    if (Array.isArray(customInteractions)) {
      for (const ix of customInteractions) if (ix && ix.id) interactionsMap.set(ix.id, ix);
    } else {
      for (const [k, v] of customInteractions.entries()) interactionsMap.set(k, v);
    }
  }
  isLoaded = true;
}

// Tự động kích hoạt nạp lần đầu
ensureLoaded();

// ==========================================
// CÁC HÀM TRUY CẬP CHÍNH (ACCESSOR API)
// ==========================================

/**
 * Lấy giá trị số (number) của một Threshold theo ID.
 * NẾU ID KHÔNG TỒN TẠI -> THROW ERROR NGAY LẬP TỨC ĐỂ BẮT LỖI Ở BUILD/TEST!
 *
 * @example
 * const egfrMin = th('ckd.sglt2i.egfr_initiate_min'); // 20
 */
export function th(id: string): number {
  ensureLoaded();
  const item = thresholdsMap.get(id);
  if (!item) {
    throw new Error(
      `[KB Access Error] Không tìm thấy Threshold với ID: "${id}". Vui lòng khai báo trong kb/thresholds/!`
    );
  }
  return item.value;
}

/**
 * Lấy giá trị số (number) của một Threshold với kiểm tra ĐÚNG ĐẠI LƯỢNG LÂM SÀNG (QA-10 Type-Safe Accessor).
 * Ném lỗi nếu ID không tồn tại HOẶC Threshold có `quantity` không khớp với `expectedQuantity`.
 *
 * @example
 * const minEgfr = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min'); // 20
 * thFor('egfr', 'lipid.reduction.pcsk9_alone'); // THROW ERROR: Mismatch quantity!
 */
export function thFor(expectedQuantity: ThresholdQuantity, id: string): number {
  ensureLoaded();
  const item = thr(id);
  if (!item.quantity) {
    throw new Error(
      `[QA-10 Missing Quantity] Threshold '${id}' chưa khai báo trường 'quantity' trong KB! Không thể đảm bảo an toàn kiểu đại lượng.`
    );
  }
  if (item.quantity.toLowerCase() !== expectedQuantity.toLowerCase()) {
    throw new Error(
      `[QA-10 Quantity Mismatch] Lỗi dùng nhầm ngưỡng lâm sàng! ` +
      `Kỳ vọng đại lượng '${expectedQuantity}' nhưng Threshold '${id}' mang đại lượng '${item.quantity}' (giá trị: ${item.value} ${item.unit}).`
    );
  }
  return item.value;
}

/**
 * Lấy toàn bộ đối tượng Threshold (gồm value, unit, citationIds, descriptionVi)
 * Dùng khi UI cần hiển thị đơn vị hoặc cần lấy citationIds để gán vào Recommendation.
 *
 * @example
 * const t = thr('ckd.sglt2i.egfr_initiate_min');
 * // t.value = 20, t.unit = 'mL/min/1.73m2', t.citationIds = [...]
 */
export function thr(id: string): Threshold {
  ensureLoaded();
  const item = thresholdsMap.get(id);
  if (!item) {
    throw new Error(
      `[KB Access Error] Không tìm thấy Threshold với ID: "${id}". Vui lòng khai báo trong kb/thresholds/!`
    );
  }
  return item;
}

/**
 * Kiểm tra Threshold có tồn tại trong Knowledge Base không
 */
export function hasThreshold(id: string): boolean {
  ensureLoaded();
  return thresholdsMap.has(id);
}

/**
 * Lấy đối tượng DrugEntry đầy đủ từ từ điển thuốc
 * NẾU KHÔNG CÓ -> THROW ERROR
 *
 * @example
 * const d = drug('dapagliflozin');
 */
export function drug(drugId: string): DrugEntry {
  ensureLoaded();
  const item = drugsMap.get(drugId);
  if (!item) {
    throw new Error(
      `[KB Access Error] Không tìm thấy DrugEntry với ID: "${drugId}". Vui lòng khai báo trong kb/drugs/!`
    );
  }
  return item;
}

/**
 * Kiểm tra thuốc có tồn tại trong Knowledge Base không
 */
export function hasDrug(drugId: string): boolean {
  ensureLoaded();
  return drugsMap.has(drugId);
}

/**
 * Lấy liều dùng của một thuốc (start, target, step, max)
 *
 * @example
 * const start = dose('dapagliflozin', 'start');
 * const max = dose('metformin', 'max');
 */
export function dose(
  drugId: string,
  kind: 'start' | 'target' | 'step' | 'max'
): Dose | string | undefined {
  const d = drug(drugId);
  switch (kind) {
    case 'start':
      return d.start;
    case 'target':
      return d.target;
    case 'step':
      return d.titration?.step;
    case 'max':
      return d.titration?.maxDose;
    default:
      return undefined;
  }
}

/**
 * Tìm dải chỉnh liều theo chức năng thận (Renal Band) của một thuốc
 *
 * @example
 * const band = renalBand('dapagliflozin', 42); // tìm band chứa eGFR 42
 */
export function renalBand(
  drugId: string,
  value: number,
  kind: 'egfr' | 'crcl' = 'egfr'
): RenalBand | undefined {
  const d = drug(drugId);
  if (!Array.isArray(d.renal) || d.renal.length === 0) {
    return undefined;
  }

  return d.renal.find((b) => {
    if (kind === 'egfr') {
      const from = b.eGFRFrom ?? 0;
      const to = b.eGFRTo ?? 999;
      return value >= from && value < to;
    } else {
      const from = b.crclFrom ?? 0;
      const to = b.crclTo ?? 999;
      return value >= from && value < to;
    }
  });
}

/**
 * Định dạng đối tượng Dose hoặc chuỗi liều sang văn bản tiếng Việt chuẩn mực
 *
 * @example
 * fmtDose({ amount: 10, unit: 'mg', frequency: '1 lần/ngày', route: 'uống' })
 * // => "10 mg x 1 lần/ngày (uống)"
 */
export function fmtDose(d: Dose | string | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') return d;

  const parts: string[] = [`${d.amount} ${d.unit}`];
  if (d.frequency) parts.push(`x ${d.frequency}`);
  if (d.route) parts.push(`(${d.route})`);
  if (d.description) parts.push(`- ${d.description}`);

  return parts.join(' ');
}

/**
 * Lấy danh sách toàn bộ Thresholds đã nạp
 */
export function getAllThresholds(): Threshold[] {
  ensureLoaded();
  return Array.from(thresholdsMap.values());
}

/**
 * Lấy danh sách toàn bộ DrugEntry đã nạp
 */
export function getAllDrugs(): DrugEntry[] {
  ensureLoaded();
  return Array.from(drugsMap.values());
}

/**
 * Lấy đối tượng InteractionRule theo ID (ví dụ: 'ix.statin_clarithromycin')
 * NẾU KHÔNG CÓ -> THROW ERROR
 */
export function interaction(id: string): InteractionRule {
  ensureLoaded();
  const item = interactionsMap.get(id);
  if (!item) {
    throw new Error(
      `[KB Access Error] Không tìm thấy InteractionRule với ID: "${id}". Vui lòng khai báo trong kb/interactions/!`
    );
  }
  return item;
}

/**
 * Kiểm tra InteractionRule có tồn tại trong Knowledge Base không
 */
export function hasInteraction(id: string): boolean {
  ensureLoaded();
  return interactionsMap.has(id);
}

/**
 * Lấy danh sách toàn bộ InteractionRule đã nạp
 */
export function getAllInteractions(): InteractionRule[] {
  ensureLoaded();
  return Array.from(interactionsMap.values());
}
