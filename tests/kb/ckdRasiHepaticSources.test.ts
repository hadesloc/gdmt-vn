import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { Citation, Source } from '../../src/kb-types';
import { getPdfPages, LIBRARY_ROOT, normalizeForMatch, verifyCitation } from '../../tools/kb/citations';
import { computeContentHash } from '../../src/kb-types/node';
import { evaluate } from '../../src/engine/evaluate';
import type { Patient, Settings } from '../../src/engine/types';

const sources: Source[]=JSON.parse(readFileSync('kb/sources.json','utf8'));
const citations: Citation[]=JSON.parse(readFileSync('kb/citations/ckd.json','utf8'));
const thresholds=JSON.parse(readFileSync('kb/thresholds/ckd.json','utf8'));
const settings: Settings={setting:'outpatient',profile:'VN',units:{cr:'umol_L',glucose:'mmol_L',lipid:'mmol_L',urat:'umol_L',uacr:'mg_mmol',hba1c:'pct'},score2Region:'high',fontScale:'normal',theme:'light',onlyReviewed:false};
const forbidden=['fda.losartan.hepatic_impairment','fda.sacubitril_valsartan.hepatic_child_pugh_c','byt.ckd.2024.table_12_telmisartan_valsartan'];
describe('CKD-R5-R1-06: hepatic claims require the actual drug label',()=>{
  it('supports the hepatic telmisartan cap with a telmisartan hepatic statement',()=>{
    const cap=thresholds.find((t:any)=>t.id==='ckd.rasi.telmisartan_hepatic_max_dose');
    expect(cap.citationIds.some((id:string)=>{
      const c=citations.find((c)=>c.id===id); const s=sources.find((s)=>s.id===c?.sourceId);
      return /telmisartan|micardis/i.test(s?.title??'') && /hepatic/i.test(c?.quote??'') && /40\s*mg/i.test(c?.quote??'');
    })).toBe(true);
  });
  it('uses a candesartan label for candesartan hepatic metadata',()=>{
    const kb=JSON.parse(readFileSync('kb/drugs/candesartan.json','utf8'));
    expect(kb.hepatic.citationIds.length).toBeGreaterThan(0);
    for(const id of kb.hepatic.citationIds){
      const c=citations.find((c)=>c.id===id)!;
      expect(sources.find((s)=>s.id===c.sourceId)?.title).toMatch(/candesartan|atacand/i);
    }
  });
  it.each([{drugId:'candesartan',childPugh:'C',dose:8},{drugId:'telmisartan',childPugh:'B',dose:80}])('does not cite another drug or renal table for the hepatic action: %j',({drugId,childPugh,dose})=>{
    const p:Patient={age:62,sex:'male',egfr:45,sbp:132,k:4.3,uacr:50,conditions:{ckd:true,dm:true},selectedModules:['ckd'],
      customInputs:{childPugh},currentMeds:[{drugId,dose,unit:'mg',freq:'qd'}]};
    const rec=evaluate(p,settings).recommendations.find((r)=>r.drugId===drugId);
    expect(rec).toBeDefined(); expect(rec?.action).toBe(childPugh==='C'?'STOP':'REDUCE');
    expect(rec?.citationIds.filter((id)=>forbidden.includes(id))).toEqual([]);
  });
  it.each(['ema_micardis_20260417','uk_candesartan_viatris_202606'])('%s is a hash-verified local primary label snapshot',(id)=>{
    const s=sources.find((s)=>s.id===id)!;
    expect(createHash('sha256').update(readFileSync(resolve(LIBRARY_ROOT,s.localPath!))).digest('hex')).toBe(s.sha256);
  });
  it.each(['ema.telmisartan.hepatic_max_40','ema.telmisartan.hepatic_biliary_contra',
    'uk.candesartan.hepatic_cholestasis_contra','fda.candesartan.severe_hepatic_no_dosing'])('%s matches its original source location',(id)=>{
    const c=citations.find((c)=>c.id===id)!;const s=sources.find((s)=>s.id===c.sourceId)!;
    const result=verifyCitation(c,s);
    expect(result.ok,id).toBe(true); expect(result.findings.filter((f)=>f.level!=='info')).toEqual([]);
    if(c.pdfPage)expect(result.foundPages).toContain(c.pdfPage);
  });
  it('verifies the hepatic qualifier around the cap, not just a number anywhere in the label',()=>{
    const s=sources.find((s)=>s.id==='ema_micardis_20260417')!;
    const page=normalizeForMatch(getPdfPages(resolve(LIBRARY_ROOT,s.localPath!))[2]);
    expect(page).toContain(normalizeForMatch('In patients with mild to moderate hepatic impairment, the posology should not exceed 40 mg once daily'));
    const uk=sources.find((s)=>s.id==='uk_candesartan_viatris_202606')!;
    expect(uk.org).toContain('UK'); expect(uk.org).not.toBe('EMA');
    expect(uk.version).toContain('Text revision 06/2026');
  });
  it.each(['telmisartan','candesartan','ckd.rasi.telmisartan_hepatic_max_dose'])('invalidates prior review after changing %s hepatic claims',(id)=>{
    const entry=id.startsWith('ckd.')?thresholds.find((t:any)=>t.id===id):JSON.parse(readFileSync(`kb/drugs/${id}.json`,'utf8'));
    const state=JSON.parse(readFileSync(`kb/review/${id}.json`,'utf8'));
    expect(state.status).toBe('draft'); expect(state.contentHash).toBe(computeContentHash(entry)); expect(state.reports).toEqual([]);
  });
});
