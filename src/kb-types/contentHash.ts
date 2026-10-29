/** Shared, synchronous and browser-safe review fingerprint. No node:* imports. */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export const CONTENT_HASH_VERSION = 'sha256-json-v2' as const;
const ROOT_REVIEW_FIELDS = new Set(['review', 'contentHash', 'status', 'reports']);

/** JSON semantics (including toJSON); sorted keys at every depth, ordered arrays.
 * Only the four historical ROOT review fields are excluded. Nested names are data.
 * Unsupported JSON roots, circular values and BigInt throw rather than hash silently.
 */
export function canonicalContent(data: unknown): string {
  const json = JSON.stringify(data);
  if (json === undefined) throw new TypeError('KB content must be JSON serializable');
  const normalized: unknown = JSON.parse(json);
  function serialize(value: unknown, root = false): string {
    if (Array.isArray(value)) return `[${value.map((item) => serialize(item)).join(',')}]`;
    if (value !== null && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record).filter((key) => !root || !ROOT_REVIEW_FIELDS.has(key))
        .sort().map((key) => `${JSON.stringify(key)}:${serialize(record[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }
  return serialize(normalized, true);
}

export function computeContentHash(data: unknown): string {
  return bytesToHex(sha256(utf8ToBytes(`${CONTENT_HASH_VERSION}\n${canonicalContent(data)}`)));
}
