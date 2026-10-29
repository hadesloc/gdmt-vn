import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation, Source } from '../../src/kb-types';
import { getPdfPages, LIBRARY_ROOT, normalizeForMatch, verifyCitation } from '../../tools/kb/citations';

const sources: Source[] = JSON.parse(readFileSync('kb/sources.json', 'utf8'));
const citations: Citation[] = JSON.parse(readFileSync('kb/citations/ckd.json', 'utf8'));

describe('CL-01 renal dose source identity and exact pages', () => {
  it.each(['fda_canagliflozin', 'kdigo_2022_diabetes'])('source %s has a matching local snapshot hash', (id) => {
    const source = sources.find((s) => s.id === id)!;
    expect(source.localPath).toBeTruthy();
    expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT, source.localPath!))).digest('hex')).toBe(source.sha256);
  });

  it.each(['fda.canagliflozin.table_1_renal_impairment', 'fda.canagliflozin.ugt_inducer_renal_dosing', 'kdigo.dm2.2022.metformin_adjust_below_45', 'kdigo.dm2.2022.metformin_discontinue_below_30'])('citation %s matches its declared page', (id) => {
    const citation = citations.find((c) => c.id === id)!;
    const source = sources.find((s) => s.id === citation.sourceId)!;
    const result = verifyCitation(citation, source);
    expect(result.ok, id).toBe(true);
    expect(result.foundPages, id).toContain(citation.pdfPage);
    expect(result.findings.filter((f) => f.level === 'warn'), id).toEqual([]);
  });

  it('the actual Invokana renal page includes both the standard 100 mg limit and the UGT exception', () => {
    const source = sources.find((s) => s.id === 'fda_canagliflozin')!;
    const text = normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT, source.localPath!))[4]);
    expect(text).toContain('maximumrecommendeddosageis100mgorallyoncedaily');
    expect(text).toContain('maximumrecommendeddosageof200mgorallyoncedaily');
    expect(text).toContain('rifampin,phenytoin,phenobarbital,ritonavir');
    expect(source.year).toBe(2026);
  });
});
