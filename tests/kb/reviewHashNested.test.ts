import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { computeContentHash } from '../../src/kb-types/node';

describe('KB-HASH-01 nested clinical content regression', () => {
  it('detects a hepatic instruction change in the real telmisartan item', () => {
    const original = JSON.parse(readFileSync('kb/drugs/telmisartan.json', 'utf8'));
    const changed = structuredClone(original);
    changed.hepatic.note = 'Changed clinical instruction';
    expect(computeContentHash(changed)).not.toBe(computeContentHash(original));
  });
  it.each([
    ['dose', { start: { amount: 10 } }, { start: { amount: 20 } }],
    ['renal band', { renal: [{ eGFRFrom: 15 }] }, { renal: [{ eGFRFrom: 30 }] }],
    ['nested status', { pregnancy: { status: 'caution' } }, { pregnancy: { status: 'contra' } }],
  ])('detects changed %s', (_label, original, changed) => {
    expect(computeContentHash(changed)).not.toBe(computeContentHash(original));
  });
  it('does not depend on nested object key insertion order', () => {
    expect(computeContentHash({ start: { amount: 10, unit: 'mg' } }))
      .toBe(computeContentHash({ start: { unit: 'mg', amount: 10 } }));
  });
});
