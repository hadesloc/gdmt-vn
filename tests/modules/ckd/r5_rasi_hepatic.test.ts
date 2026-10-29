import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { evaluateHepaticSafety } from '../../../src/engine/safety/hepaticSafety';
import { drug } from '../../../src/kb-types/access';
import type { Patient, Settings, CurrentMed } from '../../../src/engine/types';

const settings:Settings={setting:'outpatient',profile:'VN',units:{cr:'umol_L',glucose:'mmol_L',lipid:'mmol_L',urat:'umol_L',uacr:'mg_mmol',hba1c:'pct'},score2Region:'high',fontScale:'normal',theme:'light',onlyReviewed:false};
function patient(med:CurrentMed,childPugh='C'):Patient{return {age:62,sex:'male',egfr:45,sbp:132,dbp:78,hr:72,k:4.3,uacr:50,
  conditions:{ckd:true,dm:true},selectedModules:['ckd'],customInputs:{childPugh},currentMeds:[med]};}
const wrong=['fda.losartan.hepatic_impairment','fda.sacubitril_valsartan.hepatic_child_pugh_c','byt.ckd.2024.table_12_telmisartan_valsartan'];
describe('CKD-R5-R1-06: same-drug hepatic provenance through the pipeline',()=>{
  for(const profile of ['INTL','VN','US'] as const)for(const setting of ['outpatient','inpatient'] as const){
    it(`${profile}/${setting}: candesartan severe liver action has UK+FDA distinction`,()=>{
      const plan=evaluate(patient({drugId:'candesartan',dose:8,unit:'mg',freq:'qd'}),{...settings,profile,setting});
      const r=plan.recommendations.find((r)=>r.drugId==='candesartan');
      expect(r?.action).toBe('STOP');expect(r?.dose).toBeUndefined();
      expect(r?.citationIds).toContain('uk.candesartan.hepatic_cholestasis_contra');
      expect(r?.citationIds.filter((id)=>wrong.includes(id))).toEqual([]);
      expect(r?.rationale).toContain('FDA');expect(r?.rationale).toContain('SmPC Anh');
      expect(plan.noteText).toContain('SmPC Anh');
    });
    it(`${profile}/${setting}: telmisartan severe liver action cites EMA`,()=>{
      const plan=evaluate(patient({drugId:'telmisartan',dose:40,unit:'mg',freq:'qd'}),{...settings,profile,setting});
      const r=plan.recommendations.find((r)=>r.drugId==='telmisartan');
      expect(r?.action).toBe('STOP');expect(r?.citationIds).toContain('ema.telmisartan.hepatic_biliary_contra');
      expect(r?.citationIds.filter((id)=>wrong.includes(id))).toEqual([]);expect(r?.rationale).toContain('EMA');
    });
  }
  it.each(['A','B'])('uses the hepatic cap for mild/moderate disease and keeps its source: %s',(cp)=>{
    const p=patient({drugId:'telmisartan',dose:80,unit:'mg',freq:'qd'},cp);
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId==='telmisartan');
    expect(r?.action).toBe('REDUCE');expect(r?.dose).toContain('40');expect(r?.rationale).toContain('SmPC EMA');
    expect(r?.rationale).not.toContain('tắc mật nhẹ');expect(r?.citationIds).toContain('ema.telmisartan.hepatic_max_40');
    expect(r?.citationIds.filter((id)=>wrong.includes(id))).toEqual([]);
  });
  it('does not lower the normal-liver target from 80 to 40',()=>{
    const p=patient({drugId:'telmisartan',dose:40,unit:'mg',freq:'qd'},'');
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId==='telmisartan');
    expect(r?.action).toBe('UPTITRATE');expect(r?.dose).toContain('80');
  });
  it.each(['liverDisease','cirrhosis'])('does not claim confirmed A/B when only %s is entered',(flag)=>{
    const p=patient({drugId:'telmisartan',dose:80,unit:'mg',freq:'qd'},'');p.conditions[flag]=true;
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId==='telmisartan');
    expect(r?.action).toBe('REDUCE');expect(r?.rationale).toContain('chưa rõ mức độ');
    expect(r?.rationale).toContain('không xác nhận');expect(r?.title).not.toContain('Child-Pugh A/B');
  });
  it('the lower hepatic titration target has its own cap citation',()=>{
    const p=patient({drugId:'telmisartan',dose:20,unit:'mg',freq:'qd'},'B');
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId==='telmisartan');
    expect(r?.action).toBe('UPTITRATE');expect(r?.dose).toContain('40');
    expect(r?.citationIds).toContain('ema.telmisartan.hepatic_max_40');expect(r?.rationale).toContain('không coi là trần liều FDA');
  });
  it('does not create a candesartan 16 mg maintenance ceiling in Child-Pugh B',()=>{
    const p=patient({drugId:'candesartan',dose:16,unit:'mg',freq:'qd'},'B');
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId==='candesartan');
    expect(r?.action).toBe('UPTITRATE');expect(r?.dose).toContain('32');
    expect(r?.citationIds).toContain('fda.candesartan.moderate_hepatic_start');
  });
  it.each(['telmisartan','candesartan','telmisartan_hctz','candesartan_hctz'])('cholestasis is a safety stop with the correct label for %s',(id)=>{
    const p=patient({drugId:id,dose:id.endsWith('_hctz')?'40/12.5':40,unit:'mg',freq:'qd'},'');p.conditions.cholestasis=true;
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId===id);
    expect(r?.action).toBe('STOP');expect(r?.dose).toBeUndefined();
    expect(r?.citationIds).toContain(id.startsWith('telmisartan')?'ema.telmisartan.hepatic_biliary_contra':'uk.candesartan.hepatic_cholestasis_contra');
    expect(r?.citationIds.filter((id)=>wrong.includes(id))).toEqual([]);
  });
  it('preserves the separate Entresto source for ARNI instead of replacing it with an ARB source',()=>{
    const p=patient({drugId:'sacubitril_valsartan',dose:'49/51',unit:'mg',freq:'bid'});
    const r=evaluate(p,settings).recommendations.find((r)=>r.drugId==='sacubitril_valsartan');
    expect(r?.action).toBe('STOP');expect(r?.citationIds).toContain('fda.sacubitril_valsartan.hepatic_child_pugh_c');
    expect(r?.citationIds).not.toContain('ema.telmisartan.hepatic_biliary_contra');
  });
  it('a generic hepatic contraindication never borrows the telmisartan renal table as a fallback',()=>{
    const entry={...drug('telmisartan'),id:'unrelated_drug',hepatic:{status:'contra' as const,note:'Product-specific hepatic restriction',citationIds:[]}};
    const p=patient({drugId:'unrelated_drug'},'B');
    const result=evaluateHepaticSafety('unrelated_drug','unrelated_drug',new Set(),entry,p);
    expect(result?.actionForCurrent).toBe('STOP');expect(result?.citationIds).toEqual([]);
  });
});
