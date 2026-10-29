import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation, Source } from '../../src/kb-types';
import { getPdfPages, LIBRARY_ROOT, normalizeForMatch, verifyCitation } from '../../tools/kb/citations';

const sources: Source[] = JSON.parse(readFileSync('kb/sources.json', 'utf8'));
const citations: Citation[] = JSON.parse(readFileSync('kb/citations/ckd.json', 'utf8'));

describe('CL-02b: actual RASi tolerance and candesartan label source', () => {
  it('registers the existing local Atacand PDF with its actual hash and revision', () => {
    const source = sources.find((s) => s.id === 'fda_candesartan_atacand')!;
    expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT, source.localPath!))).digest('hex')).toBe(source.sha256);
    expect(source.year).toBe(2025); expect(source.version).toContain('07/2025');
    expect(source.url).toContain('94a59260-d2b6-464a-b5b9-bbc599e57e10');
  });

  it.each(['fda.candesartan.adult_dose_range', 'fda.candesartan.moderate_hepatic_start',
    'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop', 'kdigo.ckd.2024.rec_3_8_1_finerenone_indication'])('%s matches its physical PDF page', (id) => {
    const citation = citations.find((c) => c.id === id)!;
    const source = sources.find((s) => s.id === citation.sourceId)!;
    const result = verifyCitation(citation, source);
    expect(result.ok, id).toBe(true); expect(result.foundPages, id).toContain(citation.pdfPage);
    expect(result.findings.filter((f) => f.level === 'warn'), id).toEqual([]);
  });

  it('distinguishes the 8 mg hepatic starting dose from the 8–32 mg/day dose range on the same page', () => {
    const source = sources.find((s) => s.id === 'fda_candesartan_atacand')!;
    const page = normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT, source.localPath!))[3]);
    expect(page).toContain('totaldailydosesrangingfrom8mgto32mg');
    expect(page).toContain('initiatewith8mgatacandinpatientswithmoderatehepaticinsufficiency');
  });
});
