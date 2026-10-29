import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { resolveKbDrugId } from '../../../src/engine/safety/drugClassify';
import type { Patient, Settings } from '../../../src/engine/types';

const settings: Settings = {
  setting: 'outpatient', profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false,
};
const breztri = 'budesonide_glycopyrronium_formoterol';
const trimbow = 'beclometasone_glycopyrronium_formoterol';
const active = new Set(['START', 'CONTINUE', 'UPTITRATE', 'SWITCH', 'REDUCE']);
function patient(age: number | undefined, drugId: string): Patient {
  return { id: 'synthetic-triple-age', age, sex: 'female', weight: 60, sbp: 125, dbp: 75,
    hr: 75, spo2: 98, scr: 70, k: 4.2, selectedModules: ['asthma'], conditions: { asthma: true },
    currentMeds: [{ drugId, name: drugId === breztri ? 'Breztri Aerosphere' : drugId,
      dose: '2 nhát x 2 lần/ngày', freq: '2 lần/ngày' }],
    customInputs: { currentTrack: 'track2', currentStep: 5, isAcuteExacerbation: false,
      daytimeSymptomsMoreThanTwiceWeek: false, nightWakingDueToAsthma: false,
      relieverNeededMoreThanTwiceWeek: false, activityLimitationDueToAsthma: false,
      exacerbationsLastYear: 0 } };
}
function forDrug(p: Patient, id: string, s = settings) {
  return evaluate(p, s).recommendations.filter((r) => r.drugId && resolveKbDrugId(r.drugId) === id);
}

describe('ASTHMA-R4-R1-03: tuổi của từng bình ba thuốc', () => {
  it.each([12, 14, 17, 18])('Breztri đang dùng được tiếp nối ở tuổi %i', (age) => {
    const recs = forDrug(patient(age, breztri), breztri);
    expect(recs.some((r) => r.action === 'CONTINUE')).toBe(true);
    expect(recs.some((r) => ['STOP', 'AVOID'].includes(r.action))).toBe(false);
  });
  it.each(['breztri', 'breztri_aerosphere', 'budesonide_formoterol_glycopyrronium'])('alias %s giữ cùng giới hạn tuổi', (id) => {
    expect(forDrug(patient(14, id), breztri).some((r) => r.action === 'CONTINUE')).toBe(true);
  });
  it.each([11, undefined])('không kê Breztri khi tuổi ngoài phạm vi/chưa biết (%s)', (age) => {
    expect(forDrug(patient(age, breztri), breztri).some((r) => active.has(r.action))).toBe(false);
  });
  it.each([12, 17])('Trimbow ở tuổi %i bị chặn và vẫn có controller thay thế', (age) => {
    const p = patient(age, trimbow);
    expect(forDrug(p, trimbow).some((r) => active.has(r.action))).toBe(false);
    expect(evaluate(p, settings).recommendations.some((r) => active.has(r.action) && r.drugId === 'fluticasone_salmeterol')).toBe(true);
  });
  it('Trimbow từ 18 tuổi được tiếp nối', () => {
    expect(forDrug(patient(18, trimbow), trimbow).some((r) => r.action === 'CONTINUE')).toBe(true);
  });
  it.each(['trimbow', 'beclometasone_formoterol_glycopyrronium', 'trelegy', 'enerzair'])('bình chỉ dành người lớn %s không được tiếp nối ở 17 tuổi', (id) => {
    const plan = evaluate(patient(17, id), settings);
    expect(plan.recommendations.some((r) => r.drugId && resolveKbDrugId(r.drugId) === resolveKbDrugId(id) && active.has(r.action))).toBe(false);
  });
  it.each(['US', 'INTL', 'VN'] as const)('profile %s không áp lại chặn 18+ cho Breztri đang dùng', (profile) => {
    expect(forDrug(patient(14, breztri), breztri, { ...settings, profile }).some((r) => r.action === 'CONTINUE')).toBe(true);
  });
  it('chuẩn hóa alias vẫn phải chặn CYP, không đưa thuốc tương tác vào handout', () => {
    const p = patient(14, 'breztri_aerosphere');
    p.currentMeds.push({ drugId: 'ritonavir' });
    expect(forDrug(p, breztri).filter((r) => active.has(r.action)).map((r) => ({ id: r.id, drugId: r.drugId, action: r.action }))).toEqual([]);
    const bridge = evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_cyp_controller_bridge');
    expect(bridge?.drugId).toBe('beclometasone');
    expect(bridge?.action).toBe('SWITCH');
    expect(evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_action_plan_doc')?.rationale).not.toContain('breztri_aerosphere');
  });
  it('alias đã trùng controller mục tiêu không bị bắt đầu lại ở luật Track 1 thường', () => {
    const p = patient(14, 'symbicort');
    p.customInputs = { ...p.customInputs, currentTrack: 'track1', currentStep: 3 };
    const recs = forDrug(p, 'budesonide_formoterol');
    expect(recs.some((r) => r.action === 'CONTINUE')).toBe(true);
    expect(recs.some((r) => r.action === 'START')).toBe(false);
  });
  it('nội trú hen ổn định tiếp nối Breztri tuổi 14', () => {
    expect(forDrug(patient(14, breztri), breztri, { ...settings, setting: 'inpatient' }).some((r) => r.action === 'CONTINUE')).toBe(true);
  });
  it.each(['outpatient', 'inpatient'] as const)('đồng chọn COPD ở %s vẫn giữ controller của hen hợp tuổi', (setting) => {
    const p = patient(14, breztri);
    p.selectedModules = ['asthma', 'copd'];
    p.conditions = { asthma: true, copd: true };
    p.customInputs = { ...p.customInputs, fev1FvcRatio: 0.55, fev1PredPct: 65,
      mmrc: 1, cat: 5, moderateExacerbations: 0, hospitalizations: 0,
      bloodEos: 200, currentInhaler: 'triple', acuteExacerbation: false };
    expect(forDrug(p, breztri, { ...settings, setting }).some((r) => r.action === 'CONTINUE')).toBe(true);
  });
  it('xuất viện sau cơn hen tiếp nối Breztri tuổi 14', () => {
    const p = patient(14, breztri);
    p.customInputs = { ...p.customInputs, isAcuteExacerbation: true,
      acuteResponseAfter1h: 'good_response', pefPct: 85, respiratoryRate: 16, spo2: 98 };
    expect(forDrug(p, breztri, { ...settings, setting: 'inpatient' }).some((r) => r.action === 'CONTINUE')).toBe(true);
  });
  it('kế hoạch cá nhân giữ Breztri đang dùng thay vì tự đổi về ICS/LABA', () => {
    const plan = evaluate(patient(14, breztri), settings);
    expect(plan.recommendations.find((r) => r.id === 'rec_asthma_action_plan_doc')?.rationale).toContain('Breztri Aerosphere');
  });
  it('tư vấn bậc 5 không tuyên bố Breztri cấm dưới 18 tuổi', () => {
    const p = patient(14, 'budesonide_formoterol');
    const rec = evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_track1_step5_lama_biologic');
    expect(rec?.rationale).toContain('Breztri');
    expect(rec?.rationale).not.toContain('Trelegy, Trimbow, Breztri, Enerzair');
  });
});
