/**
 * GDMT-VN Module Dynamic Registry
 * Phân quyền: Agent B
 * 
 * Tự động quét và nạp mọi module từ `src/modules/[module]/index.ts` qua Vite `import.meta.glob`.
 * Module `_demo` chỉ được kích hoạt khi URL có tham số `?demo=1` hoặc khi được bật rõ ràng.
 */

import type { ModuleDefinition, ModuleId } from '../engine/types';

// Biến cờ cho phép kích hoạt thủ công trong unit test
let demoForceEnabled: boolean | null = null;

export function setDemoEnabled(enabled: boolean | null): void {
  demoForceEnabled = enabled;
}

export function isDemoEnabled(): boolean {
  if (demoForceEnabled !== null) {
    return demoForceEnabled;
  }
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('demo') === '1' || params.get('demo') === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

// Nạp tất cả index.ts trong các thư mục con của src/modules/
const moduleFiles = import.meta.glob<{
  default?: ModuleDefinition;
  demoModule?: ModuleDefinition;
  [key: string]: unknown;
}>('./*/index.ts', { eager: true });

function extractModule(mod: unknown): ModuleDefinition | null {
  if (!mod || typeof mod !== 'object') return null;
  const m = mod as Record<string, unknown>;

  // Tìm đối tượng có cấu trúc ModuleDefinition (có id và rules)
  if (m.default && typeof m.default === 'object' && 'id' in m.default && 'rules' in m.default) {
    return m.default as ModuleDefinition;
  }
  for (const val of Object.values(m)) {
    if (val && typeof val === 'object' && 'id' in val && 'rules' in val) {
      return val as ModuleDefinition;
    }
  }
  return null;
}

const registeredModulesMap = new Map<string, ModuleDefinition>();

for (const [path, exported] of Object.entries(moduleFiles)) {
  const modDef = extractModule(exported);
  if (modDef && modDef.id) {
    registeredModulesMap.set(modDef.id, modDef);
  } else {
    console.warn(`[Registry] Không tìm thấy ModuleDefinition hợp lệ tại ${path}`);
  }
}

/**
 * Lấy danh sách tất cả các module đã đăng ký trong hệ thống.
 * Mặc định loại bỏ module `_demo` trừ khi `isDemoEnabled()` = true hoặc `includeDemo` = true.
 */
export function getAllModules(includeDemo?: boolean): ModuleDefinition[] {
  const allowDemo = includeDemo !== undefined ? includeDemo : isDemoEnabled();
  const list: ModuleDefinition[] = [];

  for (const mod of registeredModulesMap.values()) {
    if (mod.id === '_demo' && !allowDemo) {
      continue;
    }
    list.push(mod);
  }

  return list;
}

/**
 * Lấy module theo ID.
 */
export function getModule(id: ModuleId | string): ModuleDefinition | undefined {
  const mod = registeredModulesMap.get(id);
  if (!mod) return undefined;
  if (mod.id === '_demo' && !isDemoEnabled()) {
    return undefined;
  }
  return mod;
}

/**
 * Lấy danh sách module hoạt động dựa trên các bệnh lý đã chọn của bệnh nhân.
 */
export function getActiveModules(
  selectedIds: (ModuleId | string)[],
  includeDemo?: boolean
): ModuleDefinition[] {
  const allowDemo = includeDemo !== undefined ? includeDemo : (isDemoEnabled() || selectedIds.includes('_demo'));
  const active: ModuleDefinition[] = [];

  for (const id of selectedIds) {
    if (id === '_demo' && !allowDemo) continue;
    const mod = registeredModulesMap.get(id);
    if (mod) {
      active.push(mod);
    }
  }

  // Nếu bật demo và _demo chưa được thêm thì thêm vào danh sách kích hoạt
  if (allowDemo) {
    const demoMod = registeredModulesMap.get('_demo');
    if (demoMod && !active.some((m) => m.id === '_demo')) {
      active.push(demoMod);
    }
  }

  return active;
}

/**
 * Lấy danh sách toàn bộ ID của các module lâm sàng chính thức (không kèm demo).
 */
export function getOfficialModuleIds(): ModuleId[] {
  return getAllModules(false).map((m) => m.id);
}
