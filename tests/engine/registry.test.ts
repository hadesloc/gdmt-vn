import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllModules,
  getModule,
  getActiveModules,
  setDemoEnabled,
  isDemoEnabled
} from '../../src/modules/registry';

describe('Module Registry', () => {
  beforeEach(() => {
    setDemoEnabled(null);
  });

  it('filters out _demo by default when demo is not enabled', () => {
    setDemoEnabled(false);
    expect(isDemoEnabled()).toBe(false);

    const modules = getAllModules();
    expect(modules.some((m) => m.id === '_demo')).toBe(false);
    expect(getModule('_demo')).toBeUndefined();
  });

  it('includes _demo when demo is explicitly enabled', () => {
    setDemoEnabled(true);
    expect(isDemoEnabled()).toBe(true);

    const modules = getAllModules();
    expect(modules.some((m) => m.id === '_demo')).toBe(true);

    const demo = getModule('_demo');
    expect(demo).toBeDefined();
    expect(demo?.id).toBe('_demo');
  });

  it('retrieves active modules matching selected IDs', () => {
    setDemoEnabled(true);
    const active = getActiveModules(['_demo']);
    expect(active.length).toBeGreaterThanOrEqual(1);
    expect(active.some((m) => m.id === '_demo')).toBe(true);
  });
});
