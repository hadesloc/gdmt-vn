/**
 * GDMT-VN Route & Combination Safety Guard for Merge Pipeline
 * Phân quyền: Agent B
 *
 * Bảo vệ hai bất biến lâm sàng sống còn trong `merge.ts` và `mergeClassResolver.ts`:
 * 1. Không bao giờ gộp/ghi đè thuốc tiêm/truyền tĩnh mạch cấp cứu nội viện (`esmolol`, `nicardipine`,
 *    `clevidipine`, `labetalol` IV, `furosemide` IV, `enoxaparin`, `heparin`, v.v.) thành `[CONTINUE]`
 *    của một viên thuốc uống mạn tính tại nhà (hoặc ngược lại).
 * 2. Không bao giờ gộp một khuyến cáo `[START]` sang viên phối hợp cố định (FDC / bình hít) đang dùng
 *    nếu BẤT KỲ hoạt chất thành phần nào của viên phối hợp đó đang bị chặn an toàn (`STOP`/`HOLD`/`AVOID`).
 */

import type { Recommendation, CurrentMed } from './types';
import { expandDrugComponents, resolveCanonicalDrugId } from './safety/fdcMap';

/**
 * Các hoạt chất luôn dùng đường tĩnh mạch / tiêm chống đông / truyền nội viện (không có dạng viên uống ngoại trú thông thường).
 */
export const DEDICATED_PARENTERAL_DRUG_IDS = new Set<string>([
  'esmolol',
  'nicardipine',
  'clevidipine',
  'sodium_nitroprusside',
  'dobutamine',
  'dopamine',
  'norepinephrine',
  'epinephrine',
  'milrinone',
  'levosimendan',
  'magnesium_sulfate',
  'calcium_gluconate',
  'calcium_chloride',
  'adenosine',
  'ibutilide',
  'vernakalant',
  'enoxaparin',
  'heparin',
  'dalteparin',
  'nadroparin',
  'tinzaparin',
  'fondaparinux',
  'ferric_carboxymaltose',
  'ferric_derisomaltose',
  'iron_sucrose',
  'pegloticase',
  'alteplase',
  'tenecteplase'
]);

/**
 * Các hoạt chất có cả dạng uống lẫn dạng tiêm tĩnh mạch cấp cứu nội viện.
 */
const DUAL_ROUTE_ACUTE_DRUG_IDS = new Set<string>([
  'labetalol',
  'urapidil',
  'nitroglycerin',
  'hydralazine',
  'furosemide',
  'torsemide',
  'bumetanide',
  'insulin_regular',
  'methylprednisolone',
  'hydrocortisone',
  'dexamethasone',
  'amiodarone',
  'diltiazem',
  'verapamil',
  'metoprolol',
  'metoprolol_tartrate',
  'propranolol',
  'digoxin',
  'colchicine'
]);

const IV_TEXT_REGEX =
  /tĩnh\s*mạch|tiêm\s*truyền|truyền\s*liên\s*tục|bơm\s*tiêm\s*điện|bolus\s*tĩnh\s*mạch|\biv\b|\bi\.v\.\b|\btm\b/i;

const ORAL_TEXT_REGEX = /\buống\b|đường\s*uống|\boral\b|\bpo\b|viên\s*nén|viên\s*nang/i;

/**
 * Nhận diện khuyến cáo thuốc đường tĩnh mạch / tiêm chống đông cấp tính không được phép gộp vào thuốc uống nền.
 */
export function isParenteralEmergencyRec(rec: Recommendation): boolean {
  const rawId = (rec.drugId || '').trim().toLowerCase();
  if (!rawId) return false;
  const canonical = resolveCanonicalDrugId(rawId);

  if (DEDICATED_PARENTERAL_DRUG_IDS.has(rawId) || DEDICATED_PARENTERAL_DRUG_IDS.has(canonical)) {
    return true;
  }

  const text = `${rec.dose || ''} ${rec.title || ''}`;
  const recId = (rec.id || '').toLowerCase();

  if (IV_TEXT_REGEX.test(text)) {
    return true;
  }

  if (
    /(?:^|_)(?:iv|infusion|bolus|parenteral)(?:_|$)/i.test(recId) &&
    !ORAL_TEXT_REGEX.test(text)
  ) {
    return true;
  }

  if (
    (DUAL_ROUTE_ACUTE_DRUG_IDS.has(rawId) || DUAL_ROUTE_ACUTE_DRUG_IDS.has(canonical)) &&
    /(?:emergency|hypertensive_emergency|acute_iv|inpatient_iv)/i.test(recId) &&
    !ORAL_TEXT_REGEX.test(text)
  ) {
    return true;
  }

  return false;
}

export const isParenteralRecommendation = isParenteralEmergencyRec;

/**
 * Kiểm tra một thuốc trong `currentMeds` có đang dùng đường tĩnh mạch / tiêm chống đông hay không.
 */
export function isParenteralCurrentMed(med?: CurrentMed): boolean {
  if (!med) return false;
  const rawId = (med.drugId || '').trim().toLowerCase();
  const canonical = resolveCanonicalDrugId(rawId);
  if (DEDICATED_PARENTERAL_DRUG_IDS.has(rawId) || DEDICATED_PARENTERAL_DRUG_IDS.has(canonical)) {
    return true;
  }
  const text = `${med.route || ''} ${med.name || ''} ${med.dose || ''} ${med.unit || ''}`;
  return IV_TEXT_REGEX.test(text);
}

/**
 * Kiểm tra xem thuốc nền `curDrugId` (hoặc bất kỳ hoạt chất thành phần nào nếu là viên phối hợp FDC/bình hít)
 * có nằm trong tập bị chặn an toàn (`STOP` / `HOLD` / `AVOID` / `SWITCH`) hay không.
 */
export function hasBlockedDrugOrFdcComponent(
  curDrugId: string,
  blockedIds: Set<string>,
  curMed?: CurrentMed
): boolean {
  const raw = curDrugId.trim().toLowerCase();
  if (!raw) return false;
  const canonical = resolveCanonicalDrugId(raw);
  if (blockedIds.has(raw) || blockedIds.has(canonical)) return true;

  const comps = expandDrugComponents(raw);
  for (const comp of comps) {
    if (blockedIds.has(comp) || blockedIds.has(resolveCanonicalDrugId(comp))) {
      return true;
    }
  }

  if (curMed?.name) {
    const nameComps = expandDrugComponents(curMed.name);
    for (const comp of nameComps) {
      if (blockedIds.has(comp) || blockedIds.has(resolveCanonicalDrugId(comp))) {
        return true;
      }
    }
  }

  return false;
}
