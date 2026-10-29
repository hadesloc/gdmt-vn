import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';
const settings: Settings = { setting: 'inpatient', profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false };
function patient(): Patient {
  return { id: 'synthetic-mg', age: 45, sex: 'female', weight: 60, sbp: 125, hr: 120, spo2: 85,
    scr: 65, k: 4.2, selectedModules: ['asthma'], currentMeds: [], conditions: { asthma: true },
    customInputs: { isAcuteExacerbation: true, silentChest: true, respiratoryRate: 34,
      fev1Pct: 25, acuteResponseAfter1h: 'poor_response' } };
}
function magnesium(p: Patient) { return evaluate(p, settings).recommendations.find((r) => r.drugId === 'magnesium_sulfate'); }
describe('ASTHMA-R4-R1-06 / R3-03: Magnesium sulfate', () => {
  it('chặn MgSO4 khi HR49 dù huyết áp ổn định và cơn hen nguy kịch', () => {
    const p = patient(); p.hr = 49;
    expect(magnesium(p)?.action).toBe('AVOID'); expect(magnesium(p)?.dose).toBeUndefined();
    expect(evaluate(p, settings).recommendations.some((r) => r.drugId === 'salbutamol' && r.action === 'START')).toBe(true);
  });
  it.each(['sickSinusSyndrome', 'avBlock2Or3', 'myastheniaGravis', 'myasthenia_gravis', 'dehydration'])('chặn cờ bệnh %s', (flag) => {
    const p = patient(); p.conditions = { ...p.conditions, [flag]: true };
    expect(magnesium(p)?.action).toBe('AVOID'); expect(magnesium(p)?.dose).toBeUndefined();
  });
  it('suy thận không tự gán giảm liều 1 g', () => {
    const p = patient(); p.scr = 300;
    expect(magnesium(p)?.action).toBe('DEFER'); expect(magnesium(p)?.dose).toBeUndefined();
    expect(magnesium(p)?.rationale).not.toContain('còn 1 g');
  });
  it.each(['onDialysis', 'aki', 'oliguria', 'anuria'])('cờ thận %s không tự kê liều', (flag) => {
    const p = patient(); p.conditions = { ...p.conditions, [flag]: true };
    expect(magnesium(p)?.action).toBe('DEFER'); expect(magnesium(p)?.dose).toBeUndefined();
  });
  it.each(['scr', 'sbp', 'hr'] as const)('thiếu %s không tự kê MgSO4', (field) => {
    const p = patient(); delete p[field];
    expect(magnesium(p)?.action).toBe('DEFER'); expect(magnesium(p)?.dose).toBeUndefined();
  });
  it('trường hợp đáp ứng kém có đủ dữ liệu an toàn vẫn dùng liều chuẩn có nguồn', () => {
    const rec = magnesium(patient());
    expect(rec?.action).toBe('START'); expect(rec?.dose).toContain('2 g'); expect(rec?.dose).toContain('20');
  });
  it('cơn nặng đơn thuần chưa có tiêu chí cân nhắc Mg không tự START', () => {
    const p = patient(); p.customInputs = { isAcuteExacerbation: true, respiratoryRate: 34, fev1Pct: 45 };
    const rec = magnesium(p);
    expect(rec?.action).toBe('CONSIDER'); expect(rec?.dose).toBeUndefined();
  });
  it('liều MgSO4 trong hen không dùng trích dẫn varenicline hoặc aminoglycoside', () => {
    const rec = magnesium(patient());
    expect(rec?.citationIds).not.toContain('byt.copd.2023.severe_renal_crcl30');
    expect(rec?.citationIds).not.toContain('kdigo.aki.2012.myasthenia_neuromuscular');
  });
  it('không tự truyền thêm khi đã dùng MgSO4', () => {
    const p = patient(); p.currentMeds = [{ drugId: 'magnesium_sulfate', dose: '2 g TM' }];
    expect(magnesium(p)?.action).toBe('DEFER'); expect(magnesium(p)?.dose).toBeUndefined();
  });
  it('đáp ứng kém nhưng không còn giảm oxy hoặc FEV1 rất thấp: đánh giá, không tự START', () => {
    const p = patient(); p.spo2 = 98; p.customInputs = { ...p.customInputs, fev1Pct: 45 };
    expect(magnesium(p)?.action).toBe('CONSIDER'); expect(magnesium(p)?.dose).toBeUndefined();
  });
  it('đáp ứng kém sau giờ đầu và còn giảm oxy có chỉ định dù FEV1 không dưới 30', () => {
    const p = patient(); p.customInputs = { ...p.customInputs, fev1Pct: 45 };
    expect(magnesium(p)?.action).toBe('START'); expect(magnesium(p)?.dose).toContain('2 g');
  });
  it.each([false, true])('cơn hen thực sự + sản giật: giữ một lệnh sản khoa khi không có chống chỉ định (nhược cơ=%s)', (myasthenia) => {
    const p = patient(); p.sbp = 178; p.dbp = 114; p.selectedModules = ['htn', 'asthma'];
    p.conditions = { ...p.conditions, pregnant: true, severePreeclampsiaEclampsia: true, myastheniaGravis: myasthenia };
    const recs = evaluate(p, settings).recommendations.filter((r) => r.drugId === 'magnesium_sulfate');
    expect(recs).toHaveLength(1);
    expect(recs[0].action).toBe(myasthenia ? 'AVOID' : 'START');
    if (!myasthenia) expect(recs[0].dose).toContain('4 g');
    else expect(recs[0].dose).toBeUndefined();
  });
});
