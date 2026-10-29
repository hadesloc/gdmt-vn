/**
 * GDMT-VN Shared Fail-Closed Dose & Frequency Parser
 * Phân quyền: Agent B
 *
 * Nguyên tắc Fail-Closed (QA-1):
 * - Nếu `unit` là đơn vị đếm ('viên', 'ống', 'bút', 'nhát', 'gói') mà `med.name` KHÔNG chứa
 *   hàm lượng đơn chất rõ ràng (mg/mcg/g), BẮT BUỘC trả về `undefined` — TUYỆT ĐỐI KHÔNG trả `1` thành `1 mg`.
 * - Nếu thuốc là viên phối hợp đa thành phần (FDC có dấu `/` như `Synjardy 12.5/1000mg`),
 *   `extractStrengthFromNameMg` và `parseDailyDoseMg` trả về `undefined` cho viên gộp;
 *   muốn lấy liều từng hoạt chất thành phần phải gọi `parseComponentDailyDoseMg(med, componentId)`.
 */

import type { CurrentMed } from './types';
import { expandDrugComponents, isFdcDrug, resolveCanonicalDrugId } from './safety/fdcMap';

const COUNT_UNITS = new Set<string>([
  'viên',
  'vien',
  'v',
  'tab',
  'tablet',
  'tablets',
  'cap',
  'caps',
  'capsule',
  'vỉ',
  'ống',
  'ong',
  'amp',
  'lọ',
  'lo',
  'vial',
  'bút',
  'but',
  'pen',
  'nhát',
  'nhat',
  'puff',
  'puffs',
  'liều xịt',
  'gói',
  'goi',
  'sachet'
]);

const NON_MASS_UNITS = new Set<string>([
  'iu',
  'ui',
  'đv',
  'đơn vị',
  'don vi',
  'unit',
  'units',
  'ml',
  'l',
  '%',
  'giọt'
]);

const COUNT_WORD_REGEX = /\b(viên|vien|tablet|tab|cap|caps|ống|ong|lọ|bút|but|nhát|nhat|puff|puffs|gói|goi|sachet)\b/i;
const NON_MASS_WORD_REGEX = /\b(iu|ui|đv|đơn\s*vị|don\s*vi|units?)\b/i;

function toMassMg(val: number, unitRaw: string): number | undefined {
  if (!Number.isFinite(val) || val <= 0) return undefined;
  const u = unitRaw.trim().toLowerCase();
  if (u === 'mg' || u === 'miligam') return val;
  if (u === 'mcg' || u === 'µg' || u === 'ug' || u === 'μg' || u === 'microgam') {
    return Number((val / 1000).toFixed(6));
  }
  if (u === 'g' || u === 'gam' || u === 'gram') {
    return Number((val * 1000).toFixed(4));
  }
  return undefined;
}

/**
 * Trích xuất hàm lượng mg từ tên thuốc CHỈ KHI thuốc là đơn chất và có duy nhất một hàm lượng rõ ràng
 * (vd: `'Simvastatin 40mg'` -> `40`, `'Digoxin 250 mcg'` -> `0.25`, `'Metformin 1g'` -> `1000`).
 * Viên phối hợp kiểu `'Synjardy 12.5/1000mg'` hoặc `'Coveram 5/10mg'` trả về `undefined`.
 */
export function extractStrengthFromNameMg(name?: string): number | undefined {
  if (!name || typeof name !== 'string') return undefined;
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  // Từ chối FDC theo tên hoặc chuỗi hàm lượng phân tách bằng dấu gạch chéo / dấu cộng
  if (isFdcDrug(trimmed)) return undefined;
  if (/\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|ug|μg|g)?\s*\/\s*\d+(?:[.,]\d+)?/i.test(trimmed)) {
    return undefined;
  }
  if (/[a-zA-ZÀ-ỹ]+\s*(?:\/|\+)\s*[a-zA-ZÀ-ỹ]+/.test(trimmed) && !/mg\s*\/\s*ml/i.test(trimmed)) {
    return undefined;
  }
  if (/mg\s*\/\s*ml/i.test(trimmed) || NON_MASS_WORD_REGEX.test(trimmed)) {
    return undefined;
  }

  const massMatches = Array.from(
    trimmed.matchAll(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|μg|g|gam|gram)\b/gi)
  );
  if (massMatches.length !== 1) {
    return undefined;
  }

  const rawNum = parseFloat(massMatches[0][1].replace(',', '.'));
  const rawUnit = massMatches[0][2];
  return toMassMg(rawNum, rawUnit);
}

/**
 * Phân tích tần suất dùng thuốc trong ngày (`lần/ngày`) từ `freq` hoặc chuỗi `dose`.
 */
export function parseFrequencyPerDay(freq?: string, doseStr?: string): number | undefined {
  const candidates = [freq, doseStr].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  if (candidates.length === 0) return undefined;

  for (const raw of candidates) {
    const text = raw.trim().toLowerCase();

    // 1. Theo tuần / cách ngày
    if (/(?:1\s*lần\s*\/\s*tuần|mỗi\s*tuần|hàng\s*tuần|1\s*tuần\s*\/\s*lần|\bq1w\b|\bqw\b|\bonce\s+weekly\b|\bweekly\b)/i.test(text)) {
      return 1 / 7;
    }
    if (/(?:mỗi\s*2\s*tuần|2\s*tuần\s*\/\s*lần|\bq2w\b)/i.test(text)) {
      return 1 / 14;
    }
    if (/(?:cách\s*ngày|mỗi\s*48\s*(?:giờ|h)|\bq48h\b|\bqod\b|\bevery\s+other\s+day\b)/i.test(text)) {
      return 0.5;
    }

    // 2. N lần/ngày hoặc ngày N lần
    const explicitTimesPerDay =
      text.match(/(\d+(?:[.,]\d+)?)\s*lần\s*(?:\/\s*ngày|mỗi\s*ngày|1\s*ngày|trong\s*ngày)/i) ||
      text.match(/ngày\s*(?:uống\s*|tiêm\s*|xịt\s*|hít\s*)?(\d+(?:[.,]\d+)?)\s*lần/i);
    if (explicitTimesPerDay) {
      const n = parseFloat(explicitTimesPerDay[1].replace(',', '.'));
      if (Number.isFinite(n) && n > 0) return n;
    }

    // 3. Ký hiệu lâm sàng chuẩn & cụm buổi trong ngày
    if (/(\bqid\b|\bq6h\b|mỗi\s*6\s*(?:giờ|h))/i.test(text)) return 4;
    if (
      /(\btid\b|\bq8h\b|mỗi\s*8\s*(?:giờ|h)|sáng\s*[-–,+/&]\s*trưa\s*[-–,+/&]\s*(?:tối|chiều))/i.test(text)
    ) {
      return 3;
    }
    if (
      /(\bbid\b|\bq12h\b|mỗi\s*12\s*(?:giờ|h)|sáng\s*[-–,+/&]\s*(?:tối|chiều)|sáng\s+(?:và\s+)?(?:tối|chiều)|trưa\s*[-–,+/&]\s*tối)/i.test(text)
    ) {
      return 2;
    }

    // Mẫu "x 2", "× 2 lần", "x 3"
    const multMatch = text.match(/(?:^|\s|[0-9a-z])(?:x|×)\s*([1-6])(?:\s*lần(?:\s*\/\s*ngày)?)?(?:\s|$)/i);
    if (multMatch) {
      const n = parseInt(multMatch[1], 10);
      if (n >= 1 && n <= 6) return n;
    }

    if (
      /(\bqd\b|\bod\b|\bq24h\b|mỗi\s*24\s*(?:giờ|h)|mỗi\s*ngày|hàng\s*ngày|\/\s*ngày\b)/i.test(text)
    ) {
      return 1;
    }

    // Buổi đơn lẻ trong `freq` (vd: 'sáng', 'tối', 'buổi tối')
    if (
      raw === freq &&
      /^(?:buổi\s*)?(?:sáng|trưa|chiều|tối)(?:\s+trước\s+ăn|\s+sau\s+ăn|\s+khi\s+ngủ)?$/i.test(text)
    ) {
      return 1;
    }
  }

  return undefined;
}

function parsePillFraction(str: string): number | undefined {
  const frac = str.match(/^(\d+)\s*\/\s*(\d+)/);
  if (frac) {
    const num = parseFloat(frac[1]);
    const den = parseFloat(frac[2]);
    if (den > 0) return num / den;
  }
  const numMatch = str.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) return undefined;
  const val = parseFloat(numMatch[1].replace(',', '.'));
  return Number.isFinite(val) && val > 0 ? val : undefined;
}

/**
 * Phân tích liều 1 lần dùng (mg) của một thuốc đơn chất theo nguyên tắc Fail-Closed.
 */
export function parseSingleDoseMg(med: CurrentMed): number | undefined {
  if (!med) return undefined;
  if (isFdcDrug(med.drugId) || (med.name && isFdcDrug(med.name))) {
    return undefined;
  }

  const unitNorm = (med.unit || '').trim().toLowerCase();
  const isCountUnit = COUNT_UNITS.has(unitNorm);
  const isNonMassUnit = NON_MASS_UNITS.has(unitNorm);

  if (isNonMassUnit) return undefined;

  if (typeof med.dose === 'number') {
    if (!Number.isFinite(med.dose) || med.dose <= 0) return undefined;
    if (isCountUnit) {
      const strengthMg = extractStrengthFromNameMg(med.name);
      return strengthMg !== undefined ? Number((med.dose * strengthMg).toFixed(6)) : undefined;
    }
    if (!unitNorm || unitNorm === 'mg' || unitNorm === 'miligam') {
      return med.dose;
    }
    return toMassMg(med.dose, unitNorm);
  }

  if (typeof med.dose === 'string' && med.dose.trim().length > 0) {
    const doseText = med.dose.trim();

    // Viên phối hợp dạng '12.5/1000 mg' hoặc nồng độ dung dịch 'mg/mL' -> không phải liều đơn chất cố định
    if (/\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|ug|μg|g)?\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|ug|μg|g|ml)/i.test(doseText)) {
      return undefined;
    }
    if (NON_MASS_WORD_REGEX.test(doseText)) {
      return undefined;
    }

    // Cắt bỏ phần nhân tần suất phía sau (vd: "500 mg x 2 lần/ngày" -> lấy "500 mg")
    const beforeFreq = doseText.split(/(?:\bx\b|×|\b\d+\s*lần|\bbid\b|\btid\b|\bqid\b|\bqd\b|\bod\b|\bq\d+h\b)/i)[0] || doseText;

    const massMatch = beforeFreq.match(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|μg|g|gam|gram)\b/i);
    if (massMatch) {
      const val = parseFloat(massMatch[1].replace(',', '.'));
      return toMassMg(val, massMatch[2]);
    }

    if (isCountUnit || COUNT_WORD_REGEX.test(beforeFreq)) {
      const count = parsePillFraction(beforeFreq);
      const strengthMg = extractStrengthFromNameMg(med.name);
      if (count !== undefined && strengthMg !== undefined) {
        return Number((count * strengthMg).toFixed(6));
      }
      return undefined;
    }

    // Chuỗi số trần (vd: dose: '40', unit: 'mg' hoặc unit rỗng)
    if (/^\d+(?:[.,]\d+)?$/.test(beforeFreq.trim())) {
      const num = parseFloat(beforeFreq.trim().replace(',', '.'));
      if (!Number.isFinite(num) || num <= 0) return undefined;
      if (!unitNorm || unitNorm === 'mg') return num;
      return toMassMg(num, unitNorm);
    }

    return undefined;
  }

  // Không có trường `dose`: chỉ suy ra từ `name` nếu không phải đơn vị đếm mơ hồ và hàm lượng đơn chất rõ ràng
  if (!isCountUnit && med.name) {
    return extractStrengthFromNameMg(med.name);
  }

  return undefined;
}

/**
 * Tính tổng liều dùng mỗi ngày (mg/ngày) cho thuốc đơn chất.
 */
export function parseDailyDoseMg(med: CurrentMed): number | undefined {
  const singleMg = parseSingleDoseMg(med);
  if (singleMg === undefined) return undefined;
  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  const freq = parseFrequencyPerDay(rawFreq, typeof med.dose === 'string' ? med.dose : undefined) ?? 1;
  return Number((singleMg * freq).toFixed(6));
}

function extractSlashStrengthsMg(source?: string): number[] | undefined {
  if (!source) return undefined;
  // Khớp dạng "12.5/1000 mg", "12.5mg/1000mg", "5/10mg", "100/62.5/25 mcg"
  const slashMatch = source.match(
    /(\d+(?:[.,]\d+)?(?:\s*(?:mg|mcg|µg|ug|μg|g))?(?:\s*\/\s*\d+(?:[.,]\d+)?(?:\s*(?:mg|mcg|µg|ug|μg|g))?)+)\s*(mg|mcg|µg|ug|μg|g)?/i
  );
  if (!slashMatch) return undefined;

  const fullSegment = slashMatch[1];
  const trailingUnit = slashMatch[2] || 'mg';
  const parts = fullSegment.split('/').map((p) => p.trim());
  const values: number[] = [];

  for (const part of parts) {
    const m = part.match(/^(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|μg|g)?$/i);
    if (!m) return undefined;
    const rawVal = parseFloat(m[1].replace(',', '.'));
    const unit = m[2] || trailingUnit;
    const mg = toMassMg(rawVal, unit);
    if (mg === undefined) return undefined;
    values.push(mg);
  }

  return values.length >= 2 ? values : undefined;
}

/**
 * Tính tổng liều mỗi ngày (mg/ngày) của một hoạt chất thành phần `componentId`
 * bên trong cả viên đơn chất lẫn viên phối hợp cố định (FDC).
 */
export function parseComponentDailyDoseMg(med: CurrentMed, componentId: string): number | undefined {
  if (!med || !componentId) return undefined;
  const compsFromId = expandDrugComponents(med.drugId || '');
  const comps =
    compsFromId.length > 1
      ? compsFromId
      : med.name
        ? (() => {
            const fromName = expandDrugComponents(med.name);
            return fromName.length > 1 ? fromName : compsFromId;
          })()
        : compsFromId;

  const targetCanon = resolveCanonicalDrugId(componentId);
  if (comps.length === 1 && (comps[0] === componentId || resolveCanonicalDrugId(comps[0]) === targetCanon)) {
    return parseDailyDoseMg(med);
  }

  const idx = comps.findIndex(
    (c) =>
      c === componentId ||
      resolveCanonicalDrugId(c) === targetCanon ||
      (targetCanon === 'fluticasone' && c.startsWith('fluticasone'))
  );
  if (idx === -1) return undefined;

  const doseStr = typeof med.dose === 'string' ? med.dose : undefined;
  const slashFromDose = extractSlashStrengthsMg(doseStr);
  const slashFromName = extractSlashStrengthsMg(med.name);
  const strengths = slashFromDose || slashFromName;

  if (!strengths || strengths.length !== comps.length) {
    return undefined;
  }

  let pillCount = 1;
  if (!slashFromDose) {
    if (typeof med.dose === 'number' && Number.isFinite(med.dose) && med.dose > 0) {
      pillCount = med.dose;
    } else if (doseStr) {
      const beforeFreq = doseStr.split(/(?:\bx\b|×|\b\d+\s*lần|\bbid\b|\btid\b|\bqid\b|\bqd\b|\bod\b|\bq\d+h\b)/i)[0] || doseStr;
      const parsedCount = parsePillFraction(beforeFreq);
      if (parsedCount !== undefined) pillCount = parsedCount;
    }
  }

  const rawFreq = med.freq || (med as CurrentMed & { frequency?: string }).frequency;
  const freq = parseFrequencyPerDay(rawFreq, doseStr) ?? 1;
  return Number((strengths[idx] * pillCount * freq).toFixed(6));
}
