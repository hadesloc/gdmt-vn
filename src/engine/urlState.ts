/**
 * GDMT-VN URL State Serializer / Deserializer
 * Phân quyền: Agent B
 * 
 * Lưu trữ trạng thái phiên làm việc vào URL hash (không qua server, bảo mật dữ liệu BN).
 * Hỗ trợ versioning, an toàn với UTF-8 tiếng Việt, zero-dependency.
 */

import type { Patient, Settings } from './types';
import { isRecord, isWorkspacePatient, isWorkspaceSettings } from './workspaceState';

export const URL_STATE_VERSION = 1;

export interface AppState {
  version: number;
  patient: Partial<Patient>;
  settings?: Partial<Settings>;
}

/**
 * Base64URL encoding an toàn với Unicode / Tiếng Việt
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decoding an toàn với Unicode / Tiếng Việt
 */
function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Mã hóa toàn bộ trạng thái vào hash URL
 */
export function encodeStateToHash(patient: Partial<Patient>, settings?: Partial<Settings>): string {
  const payload: AppState = {
    version: URL_STATE_VERSION,
    patient,
    settings
  };

  try {
    const jsonStr = JSON.stringify(payload);
    return `v${URL_STATE_VERSION}=${toBase64Url(jsonStr)}`;
  } catch (err) {
    console.error('Lỗi mã hóa URL state:', err);
    return '';
  }
}

/**
 * Giải mã trạng thái từ chuỗi hash URL
 */
export function decodeStateFromHash(hashStr: string): AppState | null {
  if (!hashStr) return null;

  const cleanHash = hashStr.startsWith('#') ? hashStr.slice(1) : hashStr;
  if (!cleanHash) return null;

  try {
    // Định dạng: v1=<base64url>
    const match = cleanHash.match(/^v(\d+)=(.*)$/);
    if (!match) {
      // Thử decode trực tiếp nếu không có tiền tố version
      const jsonStr = fromBase64Url(cleanHash);
      const parsed: unknown = JSON.parse(jsonStr);
      return validState(parsed) ? parsed : null;
    }

    const version = parseInt(match[1], 10);
    const dataPart = match[2];
    const jsonStr = fromBase64Url(dataPart);
    const parsed: unknown = JSON.parse(jsonStr);
    return version === URL_STATE_VERSION && validState(parsed) && parsed.version === version ? parsed : null;
  } catch (err) {
    console.warn('Không thể giải mã trạng thái URL hash:', err);
    return null;
  }
}

function validState(value: unknown): value is AppState {
  return isRecord(value) && value.version === URL_STATE_VERSION && isWorkspacePatient(value.patient) &&
    (value.settings === undefined || isWorkspaceSettings(value.settings));
}
