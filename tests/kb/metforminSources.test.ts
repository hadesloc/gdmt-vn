import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { Citation, Source } from '../../src/kb-types';
import { getPdfPages, LIBRARY_ROOT, normalizeForMatch, verifyCitation } from '../../tools/kb/citations';

const sources: Source[] = JSON.parse(readFileSync('kb/sources.json', 'utf8'));
const citations: Citation[] = ['dm2', 'ckd', 'interactions'].flatMap((name) => JSON.parse(readFileSync(`kb/citations/${name}.json`, 'utf8')));
const migratedIds = ['fda.metformin.egfr_bands', 'fda.metformin.hepatic_contra', 'fda.dm2.metformin.contrast_60_48h', 'fda.metformin.contrast_discontinue', 'fda.metformin.iodinated_contrast_precaution'];
const renalCitation = () => citations.find((c) => c.id === migratedIds[0])!;
const monoSource = () => sources.find((s) => s.id === renalCitation().sourceId)!;

describe('SRC-01b actual metformin source form and claims', () => {
  it('citations for metformin monotherapy use an actual monotherapy PI', () => {
    const front = normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT, monoSource().localPath!))[0]);
    expect(front).toContain('metforminhydrochloridetablets');
    expect(front).not.toContain('pioglitazone');
    expect(monoSource().id).not.toBe('fda_label_metformin');
  });

  it('new monotherapy snapshot has exact identity, publisher URL and file hash', () => {
    const source = monoSource();
    expect(source.year).toBe(2026);
    expect(source.version).toMatch(/2026/);
    expect(source.url).toContain('fc466c46-abaa-4675-aef2-4b1a1adfd912');
    expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT, source.localPath!))).digest('hex')).toBe(source.sha256);
  });

  it('keeps the legacy combination PDF unchanged and labels its true ingredients', () => {
    const legacy = sources.find((s) => s.id === 'fda_label_metformin')!;
    expect(legacy.title.toLowerCase()).toContain('pioglitazone');
    expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT, legacy.localPath!))).digest('hex'))
      .toBe('aba614c7f07c5ddeda38280a0b2a86f219d3ec73db5c64366d83f285a24fe310');
    expect(citations.filter((c) => c.sourceId === legacy.id)).toHaveLength(0);
  });

  it.each(migratedIds)('%s points to monotherapy and matches its exact declared page', (id) => {
    const citation = citations.find((c) => c.id === id)!;
    const source = sources.find((s) => s.id === citation.sourceId)!;
    expect(source.id).toBe(monoSource().id);
    expect(citation.quote.toLowerCase()).not.toContain('pioglitazone');
    const result = verifyCitation(citation, source);
    expect(result.ok, id).toBe(true);
    expect(result.foundPages).toContain(citation.pdfPage);
    expect(result.findings.filter((f) => f.level === 'warn')).toEqual([]);
  });

  it('renal/acidosis contraindication is supported directly instead of a contrast-only passage', () => {
    const citation = citations.find((c) => c.id === 'fda.metformin.contra_renal_acidosis');
    expect(citation).toBeDefined();
    expect(citation!.quote.toLowerCase()).toContain('metabolic acidosis');
    expect(citation!.quote.toLowerCase()).toContain('30');
    expect(verifyCitation(citation!, monoSource()).foundPages).toContain(citation!.pdfPage);
  });
});
