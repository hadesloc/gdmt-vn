import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Citation, Source } from '../../src/kb-types';
import { LIBRARY_ROOT, verifyCitation } from '../../tools/kb/citations';

const sources: Source[]=JSON.parse(readFileSync('kb/sources.json','utf8'));
const citations: Citation[]=JSON.parse(readFileSync('kb/citations/ckd.json','utf8'));
describe('CL-02c source identity and exact-page evidence',()=>{
  it.each(['fda_byetta_20261029','fda_bydureon_bcise_20261029','fda_adlyxin_20261029','ada_2026_soc_9','ada_2026_soc_11'])('%s has an immutable, hash-verified local snapshot',(id)=>{
    const s=sources.find((s)=>s.id===id)!;
    expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT,s.localPath!))).digest('hex')).toBe(s.sha256);
  });
  it.each(['fda.exenatide_ir.renal_impairment','fda.exenatide_er.renal_impairment','fda.lixisenatide.renal_impairment',
    'ada.ckd.2026.exendin_dialysis_avoid','ada.ckd.2026.glp1_agent_kidney_evidence','ada.ckd.2026.glp1_outcome_table',
    'kdigo.dm2.2022.glp1_preferred_agents'])('%s matches its exact physical PDF page',(id)=>{
    const c=citations.find((c)=>c.id===id)!; const s=sources.find((s)=>s.id===c.sourceId)!;
    const result=verifyCitation(c,s); expect(result.ok,id).toBe(true); expect(result.foundPages).toContain(c.pdfPage);
    expect(result.findings.filter((f)=>f.level==='warn')).toEqual([]);
  });
  it('keeps the source quantities and products distinct',()=>{
    const ir=citations.find((c)=>c.id==='fda.exenatide_ir.renal_impairment')!;
    const er=citations.find((c)=>c.id==='fda.exenatide_er.renal_impairment')!;
    expect(ir.quote).toContain('creatinine clearance <30'); expect(er.quote).toContain('below 45');
    expect(ir.sourceId).not.toBe(er.sourceId);
  });
});
