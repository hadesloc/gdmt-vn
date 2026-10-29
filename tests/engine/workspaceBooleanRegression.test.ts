import { it, expect } from 'vitest';
import { parseCaseFile } from '../../src/engine/workspaceState';
import { decodeStateFromHash } from '../../src/engine/urlState';
it('rejects a string false in patient.tophi before gout evaluation', () => {
  expect(() => parseCaseFile(JSON.stringify({ format: 'gdmt-vn-case', version: 1, patient: { tophi: 'false' }, settings: {} }))).toThrow();
});
it('rejects the same wrong boolean in a share URL and preserves real false/true', () => {
  const payload = { version: 1, patient: { tophi: 'false' } };
  expect(decodeStateFromHash('#v1=' + Buffer.from(JSON.stringify(payload)).toString('base64url'))).toBeNull();
  for (const tophi of [false, true]) {
    expect(parseCaseFile(JSON.stringify({ format: 'gdmt-vn-case', version: 1, patient: { tophi }, settings: {} })).patient.tophi).toBe(tophi);
  }
});
