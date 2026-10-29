import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';
import { mergeRecommendations } from '../../../src/engine/merge';
import type { Recommendation } from '../../../src/engine/types';

const settings: Settings = { setting: 'outpatient', profile: 'VN',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false };
function patient(drugId = 'exenatide', egfr = 20): Patient {
  return { age: 62, sex: 'male', egfr, sbp: 128, dbp: 78, hr: 72, k: 4.3, uacr: 55, hba1c: 7.6,
    conditions: { ckd: true, dm: true }, selectedModules: ['ckd'],
    currentMeds: [{ drugId, dose: 10, unit: 'mcg', freq: 'bid' }], customInputs: { crcl: egfr } };
}

describe('CKD-R5-R1-05: GLP-1 agents have distinct renal safety and outcome evidence', () => {
  it('stops exenatide at eGFR 20 through the full pipeline', () => {
    const plan = evaluate(patient(), settings);
    expect(plan.recommendations.some((r) => r.drugId === 'exenatide' && r.action === 'STOP')).toBe(true);
  });
  it('offers replacement, never add-on, of lixisenatide for CKD protection', () => {
    const plan = evaluate(patient('lixisenatide', 40), settings);
    const rec = plan.recommendations.find((r) => r.drugId === 'semaglutide');
    expect(rec?.action).toBe('SWITCH');
    expect(rec?.switchFrom).toBe('lixisenatide');
  });
  it.each(['INTL', 'VN', 'US'] as const)('preserves replacement and removes contradictory continuation with DM2 in %s', (profile) => {
    const p = patient('lixisenatide',40); p.selectedModules = ['ckd','dm2'];
    const plan = evaluate(p,{...settings,profile});
    const rec = plan.recommendations.find((r) => r.drugId === 'semaglutide');
    expect(rec?.action).toBe('SWITCH'); expect(rec?.switchFrom).toBe('lixisenatide');
    expect(rec?.dose).toContain('0.25'); expect(rec?.rationale).toContain('không dùng đồng thời');
    expect(plan.recommendations.some((r) => r.drugId === 'lixisenatide' && ['CONTINUE','UPTITRATE'].includes(r.action))).toBe(false);
    expect(plan.noteText).toContain('CHUYỂN ĐỔI THUỐC');
    expect(plan.noteText).toContain(rec!.dose!);
    expect(plan.noteText).toContain('thay lixisenatide');
  });
  it.each([29.9,30,30.1])('uses CrCl, not eGFR, for immediate-release exenatide (%s)', (crcl) => {
    const p=patient('byetta',50); p.customInputs={crcl};
    const rec=evaluate(p,settings).recommendations.find((r)=>r.id==='rec_ckd_glp1_renal_exenatide');
    if(crcl<=30) { expect(rec?.action).toBe('STOP'); expect(rec?.rationale).toContain('CrCl'); }
    else expect(rec).toBeUndefined();
  });
  it.each([44.9,45,45.1])('uses the ER label eGFR boundary, not the IR CrCl boundary (%s)', (egfr) => {
    const p=patient('bydureon_bcise',egfr); p.currentMeds[0]={drugId:'bydureon_bcise',dose:2,unit:'mg',freq:'weekly'}; p.customInputs={crcl:60};
    const rec=evaluate(p,settings).recommendations.find((r)=>r.id==='rec_ckd_glp1_renal_exenatide');
    if(egfr<45) { expect(rec?.action).toBe('STOP'); expect(rec?.citationIds).toContain('fda.exenatide_er.renal_impairment'); }
    else expect(rec).toBeUndefined();
  });
  it.each([14.9,15,29.9,30,30.1])('uses ADA lixisenatide safety guidance, with no invented label contraindication (%s)', (egfr) => {
    const p=patient('adlyxin',egfr);
    const rec=evaluate(p,settings).recommendations.find((r)=>r.drugId==='lixisenatide');
    if(egfr<=30) { expect(rec?.action).toBe('STOP'); expect(rec?.rationale).toContain('thận trọng hơn nhãn'); }
    else expect(rec?.action).not.toBe('STOP');
  });
  it.each(['exenatide','lixisenatide','soliqua'])('stops renal-cleared product on dialysis without needing an eGFR: %s', (id) => {
    const p=patient(id); p.egfr=undefined; p.conditions.onDialysis=true;
    const rec=evaluate(p,settings).recommendations.find((r)=>r.action==='STOP' && r.id.startsWith('rec_ckd_glp1_renal'));
    expect(rec).toBeDefined(); expect(rec?.dose).toBeUndefined();
    expect(rec?.citationIds).toContain('ada.ckd.2026.exendin_dialysis_avoid');
    expect(evaluate(p,settings).recommendations.some((r)=>r.drugId==='semaglutide' && r.action==='SWITCH')).toBe(false);
  });
  it.each([
    { id:'exenatide',freq:'bid',egfr:20,crcl:undefined },
    { id:'exenatide',freq:undefined,egfr:40,crcl:60 },
    { id:'bydureon',freq:'bid',egfr:40,crcl:60 }, // conflicting brand and dosing
    { id:'bydureon',freq:'weekly',egfr:undefined,crcl:60 },
    { id:'lixisenatide',freq:'qd',egfr:undefined,crcl:60 },
  ])('defers unresolved renal measurement/formulation instead of claiming safety: %j', ({id,freq,egfr,crcl}) => {
    const p=patient(id); p.egfr=egfr; p.customInputs={crcl}; p.currentMeds[0].freq=freq;
    const plan=evaluate(p,settings);
    expect(plan.recommendations.some((r)=>r.id.startsWith('rec_ckd_glp1_renal') && r.action==='DEFER' && !r.dose)).toBe(true);
    expect(plan.recommendations.some((r)=>r.drugId==='semaglutide' && ['SWITCH','START'].includes(r.action))).toBe(false);
  });
  it.each(['soliqua','insulin_glargine_lixisenatide'])('requires an insulin plan before replacing the fixed-ratio pen: %s', (id) => {
    const p=patient(id,40); p.currentMeds[0].unit='units';
    const plan=evaluate(p,settings); const rec=plan.recommendations.find((r)=>r.drugId==='semaglutide');
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined(); expect(rec?.switchFrom).toBeUndefined();
    expect(rec?.rationale).toContain('insulin');
  });
  it('does not interrupt basal insulin without a replacement plan when stopping an unsafe pen', () => {
    const p=patient('soliqua',20);
    const rec=evaluate(p,settings).recommendations.find((r)=>r.drugId==='insulin_glargine_lixisenatide');
    expect(rec?.action).toBe('STOP'); expect(rec?.rationale).toContain('không để gián đoạn insulin nền');
  });
  it.each(['semaglutide_oral','dulaglutide','liraglutide','tirzepatide','semaglutide'])('describes actual evidence without an automatic additional GLP-1: %s', (id) => {
    const p=patient(id,40); const plan=evaluate(p,settings);
    expect(plan.recommendations.some((r)=>r.drugId==='semaglutide' && ['SWITCH','START'].includes(r.action))).toBe(false);
    const rec=plan.recommendations.find((r)=>r.id==='rec_ckd_glp1_outcome_evidence');
    expect(rec?.action).toBe('MONITOR'); expect(rec?.drugId).toBeUndefined(); expect(rec?.dose).toBeUndefined();
    if(id==='semaglutide_oral') expect(rec?.rationale).toContain('không đồng nhất');
    if(id==='tirzepatide') expect(rec?.rationale).toContain('hậu kiểm');
    if(id==='dulaglutide'||id==='liraglutide') expect(rec?.rationale).toContain('albumin niệu');
  });
  it.each([
    { sbp:undefined }, { sbp:80 }, { conditions:{pregnant:true} }, { conditions:{breastfeeding:true} },
    { conditions:{akiSuspected:true} }, { customInputs:{historyMtcOrMen2:true} },
    { customInputs:{historyPancreatitis:true} }, { conditions:{allergy_semaglutide:true} },
  ])('retains safety barriers for replacement: %j', (patch) => {
    const p={...patient('lixisenatide',40),...patch,conditions:{...patient().conditions,...patch.conditions},
      customInputs:{...patient().customInputs,...patch.customInputs}};
    const plan=evaluate(p,settings);
    expect(plan.recommendations.some((r)=>r.drugId==='semaglutide' && ['SWITCH','START','CONTINUE','UPTITRATE'].includes(r.action))).toBe(false);
  });
  it('does not add semaglutide to two current GLP-1 agents', () => {
    const p=patient('lixisenatide',40); p.currentMeds.push({drugId:'dulaglutide'});
    const rec=evaluate(p,settings).recommendations.find((r)=>r.drugId==='semaglutide');
    expect(rec?.action).toBe('DEFER'); expect(rec?.rationale).toContain('nhiều thuốc');
  });
  it.each(['bid',undefined])('prioritizes an unsafe ER product after a safe or unresolved first exenatide: %s',(freq)=>{
    const p=patient('exenatide',40); p.customInputs={crcl:60}; p.currentMeds[0].freq=freq;
    p.currentMeds.push({drugId:'bydureon',dose:2,unit:'mg',freq:'weekly'});
    const plan=evaluate(p,settings);
    const rec=plan.recommendations.find((r)=>r.id==='rec_ckd_glp1_renal_exenatide');
    expect(rec?.action).toBe('STOP'); expect(rec?.rationale).toContain('dạng kéo dài');
    expect(plan.recommendations.every((r)=>typeof r.action==='string')).toBe(true);
  });
  it.each([undefined,'không rõ','1 bút'])('requires the previous dose before actionable replacement: %s',(dose)=>{
    const p=patient('lixisenatide',40); p.currentMeds[0].dose=dose;
    const rec=evaluate(p,settings).recommendations.find((r)=>r.drugId==='semaglutide');
    expect(rec?.action).toBe('DEFER'); expect(rec?.dose).toBeUndefined(); expect(rec?.switchFrom).toBeUndefined();
  });
  it('requires a parseable schedule, not just nonempty frequency',()=>{
    const p=patient('lixisenatide',40); p.currentMeds[0].freq='theo toa cũ';
    expect(evaluate(p,settings).recommendations.find((r)=>r.drugId==='semaglutide')?.action).toBe('DEFER');
  });
});

describe('explicit switch merge contract',()=>{
  const rec=(patch:Partial<Recommendation>):Recommendation=>({id:'test',module:'ckd',tier:'test',action:'CONTINUE',title:'test',rationale:'test',gates:[],citationIds:[],priority:60,...patch});
  it('preserves continuation if the proposed switch was deferred or blocked',()=>{
    for(const action of ['DEFER','AVOID'] as const) {
      const out=mergeRecommendations([rec({drugId:'lixisenatide'}),rec({id:'target',drugId:'semaglutide',switchFrom:'lixisenatide',action})],patient('lixisenatide',40));
      expect(out.some((r)=>r.drugId==='lixisenatide'&&r.action==='CONTINUE')).toBe(true);
    }
  });
  it('preserves safety stops while removing continuation of the explicitly replaced brand',()=>{
    const out=mergeRecommendations([rec({drugId:'adlyxin'}),rec({id:'stop',drugId:'lixisenatide',action:'STOP'}),
      rec({id:'target',drugId:'semaglutide',switchFrom:'adlyxin',action:'SWITCH'})],patient('adlyxin',40));
    expect(out.some((r)=>r.drugId==='lixisenatide'&&r.action==='STOP')).toBe(true);
    expect(out.some((r)=>r.drugId==='adlyxin'&&r.action==='CONTINUE')).toBe(false);
  });
});
