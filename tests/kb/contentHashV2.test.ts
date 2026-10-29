import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { canonicalContent, computeContentHash, CONTENT_HASH_VERSION } from '../../src/kb-types/contentHash';
import { computeContentHash as nodeHash, loadKbDataFromFs } from '../../src/kb-types/node';

describe('KB-HASH-01 canonical JSON v2', () => {
  it('agrees with independent node:crypto SHA256 and UTF-8 encoding', () => {
    const data = { name: 'Thuốc – thận 🩺', dose: { unit: 'mg', amount: 10 }, nil: null };
    const canonical = '{"dose":{"amount":10,"unit":"mg"},"name":"Thuốc – thận 🩺","nil":null}';
    expect(canonicalContent(data)).toBe(canonical);
    const expected = createHash('sha256').update(`${CONTENT_HASH_VERSION}\n${canonical}`).digest('hex');
    expect(computeContentHash(data)).toBe(expected);
    expect(nodeHash(data)).toBe(expected);
  });
  it('sorts nested objects inside arrays without reordering the arrays', () => {
    const before = { bands: [{ min: 10, max: 20 }, { min: 20, max: 30 }] };
    const reorderedKeys = { bands: [{ max: 20, min: 10 }, { max: 30, min: 20 }] };
    expect(nodeHash(before)).toBe(nodeHash(reorderedKeys));
    expect(nodeHash(before)).not.toBe(nodeHash({ bands: [...before.bands].reverse() }));
  });
  it.each(['review', 'contentHash', 'status', 'reports'])('ignores only root %s, preserves nested occurrences', (key) => {
    const data = { id: 'drug', clinical: { [key]: 'old' } };
    expect(nodeHash({ ...data, [key]: 'new metadata' })).toBe(nodeHash(data));
    expect(nodeHash({ ...data, clinical: { [key]: 'new clinical data' } })).not.toBe(nodeHash(data));
  });
  it('preserves scalar JSON values, array order and JSON normalization semantics', () => {
    expect(canonicalContent([null, true, '10', 10, false])).toBe('[null,true,"10",10,false]');
    expect(nodeHash([1, 2])).not.toBe(nodeHash([2, 1]));
    expect(nodeHash({ a: undefined, b: NaN })).toBe(nodeHash({ b: null }));
    expect(nodeHash([undefined, Infinity])).toBe(nodeHash([null, null]));
    expect(nodeHash('10')).not.toBe(nodeHash(10));
    expect(nodeHash({ timestamp: new Date('2026-10-29T00:00:00Z') }))
      .toBe(nodeHash({ timestamp: '2026-10-29T00:00:00.000Z' }));
  });
  it('sorts numeric-looking keys lexically and handles __proto__ as ordinary JSON data', () => {
    expect(canonicalContent(JSON.parse('{"2":"b","10":"a","__proto__":{"z":1,"a":2}}')))
      .toBe('{"10":"a","2":"b","__proto__":{"a":2,"z":1}}');
  });
  it('rejects unsupported root values, BigInt and cycles', () => {
    expect(() => nodeHash(undefined)).toThrow();
    expect(() => nodeHash(() => 1)).toThrow();
    expect(() => nodeHash({ amount: 1n })).toThrow();
    const circular: { self?: unknown } = {}; circular.self = circular;
    expect(() => nodeHash(circular)).toThrow();
  });
  it('does not mutate frozen input objects', () => {
    const data = Object.freeze({ id: 'x', status: 'metadata', renal: Object.freeze([Object.freeze({ min: 10 })]) });
    nodeHash(data);
    expect(data.status).toBe('metadata'); expect(data.renal[0].min).toBe(10);
  });
  it('detects nested clinical changes across every current drug and interaction', () => {
    const kb = loadKbDataFromFs(process.cwd());
    for (const item of [...kb.drugs.values(), ...kb.interactions.values()]) {
      const original = structuredClone(item);
      const mutated = { ...original, clinicalMutationProbe: { amount: 10 } };
      expect(nodeHash(mutated), item.id).not.toBe(nodeHash({ ...mutated, clinicalMutationProbe: { amount: 20 } }));
    }
  });
});
