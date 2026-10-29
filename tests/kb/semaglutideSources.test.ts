import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { Source, Citation } from '../../src/kb-types';
import { getPdfPages, LIBRARY_ROOT, normalizeForMatch, verifyCitation } from '../../tools/kb/citations';

const sources: Source[] = JSON.parse(readFileSync(resolve('kb/sources.json'), 'utf8'));
const citations: Citation[] = ['dm2', 'interactions_lipid'].flatMap((name) =>
  JSON.parse(readFileSync(resolve(`kb/citations/${name}.json`), 'utf8')));
const source = (id: string) => {
  const entry = sources.find((s) => s.id === id);
  if (!entry?.localPath) throw new Error(`Missing source/localPath: ${id}`);
  return entry;
};
const scSource = () => {
  const cite = citations.find((c) => c.id === 'fda.semaglutide.pancreatitis');
  if (!cite) throw new Error('Missing SC citation');
  return source(cite.sourceId);
};

describe('Semaglutide source identity (actual local label)', () => {
  it('nguồn Ozempic dùng cho SC thực sự là nhãn tiêm dưới da', () => {
    const sc = scSource();
    const front = normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT, sc.localPath!))[0]);
    expect(front).toMatch(/semaglutide.*injection,forsubcutaneoususe/);
    expect(front).not.toContain('ozempictablets');
  });

  it('nguồn Rybelsus giữ đúng dạng viên uống, khác PDF tiêm', () => {
    const oral = source('fda_label_semaglutide_rybelsus');
    const sc = scSource();
    const oralFront = normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT, oral.localPath!))[0]);
    const scFront = normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT, sc.localPath!))[0]);
    expect(oralFront).toContain('tablets,fororaluse');
    expect(scFront).not.toBe(oralFront);
  });

  it('snapshot hai dạng có URL chính xác và hash khớp file thực tế', () => {
    for (const entry of [scSource(), source('fda_label_semaglutide_rybelsus')]) {
      expect(entry.url).not.toBe('https://dailymed.nlm.nih.gov');
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT, entry.localPath!))).digest('hex')).toBe(entry.sha256);
    }
  });

  it('mọi trích dẫn FDA semaglutide khớp đúng trang, không dùng dung sai ±1', () => {
    const ids = new Set([scSource().id, 'fda_label_semaglutide_rybelsus']);
    const selected = citations.filter((c) => ids.has(c.sourceId));
    expect(selected).toHaveLength(12);
    for (const cite of selected) {
      const result = verifyCitation(cite, source(cite.sourceId));
      expect(result.ok, cite.id).toBe(true);
      expect(result.foundPages, cite.id).toContain(cite.pdfPage);
      expect(result.findings.some((f) => f.level === 'warn'), cite.id).toBe(false);
    }
  });

  it('SC không trích nhãn tablet và nhãn uống không trích injection', () => {
    for (const cite of citations.filter((c) => c.sourceId === scSource().id)) {
      expect(cite.quote.toLowerCase(), cite.id).not.toMatch(/rybelsus|ozempic tablets/);
    }
    for (const cite of citations.filter((c) => c.id.startsWith('fda.semaglutide_rybelsus.'))) {
      expect(cite.sourceId).toBe('fda_label_semaglutide_rybelsus');
    }
  });
});
