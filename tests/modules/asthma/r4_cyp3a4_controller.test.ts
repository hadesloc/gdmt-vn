import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

const settings: Settings = {
  setting: 'outpatient', profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false,
};
const active = new Set(['START', 'CONTINUE', 'UPTITRATE', 'SWITCH', 'REDUCE']);
const sensitive = new Set(['budesonide_formoterol', 'fluticasone_salmeterol', 'fluticasone_vilanterol',
  'mometasone_formoterol', 'fluticasone_umeclidinium_vilanterol', 'budesonide',
  'fluticasone_propionate', 'fluticasone_furoate', 'mometasone']);

function patient(age: number, track: string, step: number, inhibitor = 'ritonavir', controller?: string): Patient {
  return {
    id: 'asthma-r4-cyp3a4', age, sex: 'female', weight: 60, sbp: 125, dbp: 75,
    hr: 75, spo2: 98, scr: 70, k: 4.2, selectedModules: ['asthma'], conditions: { asthma: true },
    currentMeds: [{ drugId: inhibitor }, ...(controller ? [{ drugId: controller }] : [])],
    customInputs: { currentTrack: track, currentStep: step, isAcuteExacerbation: false,
      daytimeSymptomsMoreThanTwiceWeek: false, nightWakingDueToAsthma: false,
      relieverNeededMoreThanTwiceWeek: false, activityLimitationDueToAsthma: false,
      exacerbationsLastYear: 0 },
  };
}

function assertSafeController(p: Patient, s = settings) {
  const plan = evaluate(p, s);
  const treatments = plan.recommendations.filter((r) => active.has(r.action));
  expect(treatments.filter((r) => r.drugId && sensitive.has(r.drugId)).map((r) => `${r.drugId}/${r.action}`)).toEqual([]);
  expect(treatments.some((r) => ['beclometasone', 'beclometasone_formoterol', 'beclometasone_glycopyrronium_formoterol'].includes(r.drugId ?? ''))).toBe(true);
  if ((p.age ?? 0) < 18) expect(treatments.some((r) => r.drugId === 'beclometasone_formoterol')).toBe(false);
  return plan;
}

describe('ASTHMA-R4-R2-02 / R3-02: controller với CYP3A4', () => {
  it.each([3, 4, 5])('người lớn Track 2 bậc %i có controller thay thế, không kê ICS-LABA tương tác', (step) => {
    assertSafeController(patient(45, 'track2', step));
  });
  it('đổi khỏi Seretide đang dùng thay vì chỉ xóa controller', () => {
    assertSafeController(patient(45, 'track2', 4, 'itraconazole', 'fluticasone_salmeterol'));
  });
  it('đổi khỏi Trelegy ở bậc 5', () => {
    const plan = assertSafeController(patient(45, 'track2', 5, 'ritonavir', 'fluticasone_umeclidinium_vilanterol'));
    expect(plan.recommendations.some((r) => r.drugId === 'beclometasone_glycopyrronium_formoterol' && active.has(r.action))).toBe(true);
  });
  it.each(['track1', 'track2'])('tuổi 14 %s dùng ICS đơn phù hợp tuổi và có thuốc cắt cơn', (track) => {
    const plan = assertSafeController(patient(14, track, 3, 'clarithromycin', 'budesonide_formoterol'));
    expect(plan.recommendations.some((r) => r.drugId === 'salbutamol' && active.has(r.action))).toBe(true);
  });
  it.each(['erythromycin', 'atazanavir', 'darunavir', 'indinavir', 'nelfinavir', 'saquinavir'])('nhận diện thuốc tương tác %s', (id) => {
    assertSafeController(patient(45, 'track1', 3, id));
  });
  it.each(['paxlovid', 'nirmatrelvir/ritonavir', 'darunavir/cobicistat'])('nhận diện tên thương mại/phối hợp %s', (id) => {
    assertSafeController(patient(45, 'track2', 3, id));
  });
  it('không suy ra đơn mới khi nội trú ổn định còn thiếu đánh giá', () => {
    const p = patient(45, 'track2', 3);
    p.customInputs = { isAcuteExacerbation: false };
    const plan = evaluate(p, { ...settings, setting: 'inpatient' });
    expect(plan.recommendations.some((r) => r.id === 'rec_asthma_cyp_controller_bridge')).toBe(false);
  });
  it.each([1, 2])('người lớn Track 2 bậc %i không bị tự nâng sang ICS-LABA', (step) => {
    const plan = assertSafeController(patient(45, 'track2', step));
    expect(plan.recommendations.some((r) => r.drugId === 'beclometasone_formoterol' && active.has(r.action))).toBe(false);
  });
  it('dị ứng Salbutamol: dùng thuốc cắt cơn thay thế dung nạp, không nhắc dùng Salbutamol trong controller', () => {
    const p = patient(14, 'track1', 3);
    p.allergies = ['salbutamol'];
    const plan = assertSafeController(p);
    expect(plan.recommendations.some((r) => r.drugId === 'terbutaline' && active.has(r.action))).toBe(true);
    expect(String(plan.recommendations.find((r) => r.id === 'rec_asthma_cyp_controller_bridge')?.dose)).not.toContain('Salbutamol');
    expect(plan.recommendations.some((r) => r.id === 'rec_asthma_action_plan_doc')).toBe(false);
  });
  it('Ventolin đang dùng được tiếp tục cùng ICS cầu nối, không bị STOP theo Track 1 cũ', () => {
    const p = patient(14, 'track1', 3, 'ritonavir', 'budesonide_formoterol');
    p.currentMeds.push({ drugId: 'ventolin', name: 'Ventolin' });
    const plan = assertSafeController(p);
    expect(plan.recommendations.some((r) => ['ventolin', 'salbutamol'].includes(r.drugId ?? '') && r.action === 'CONTINUE'),
      JSON.stringify(plan.recommendations.map((r) => [r.id, r.drugId, r.action, r.title]))).toBe(true);
    expect(plan.recommendations.some((r) => r.drugId === 'salbutamol' && r.action === 'START')).toBe(false);
  });
  it('không gán nhầm dị ứng sữa vào tờ kế hoạch', () => {
    const doc = assertSafeController(patient(14, 'track2', 3)).recommendations.find((r) => r.id === 'rec_asthma_action_plan_doc');
    expect(doc?.rationale).not.toContain('CẢNH BÁO DỊ ỨNG ĐẠM SỮA BÒ NẶNG');
  });
  it('giữ nguyên liều controller cầu nối an toàn đã dùng, không thay bằng liều mặc định', () => {
    const p = patient(45, 'track2', 5);
    p.currentMeds.push({ drugId: 'beclometasone_formoterol', dose: '1 nhát', freq: '2 lần/ngày' });
    const rec = assertSafeController(p).recommendations.find((r) => r.id === 'rec_asthma_cyp_controller_bridge');
    expect(rec?.action).toBe('CONTINUE');
    expect(rec?.dose).toContain('1 nhát');
    expect(rec?.dose).not.toContain('2 nhát');
  });
  it('controller đang dùng chưa rõ liều: không tự điền liều hay xuất tài liệu liều suy diễn', () => {
    const p = patient(45, 'track2', 3, 'ritonavir', 'beclometasone_formoterol');
    const plan = assertSafeController(p);
    const rec = plan.recommendations.find((r) => r.id === 'rec_asthma_cyp_controller_bridge');
    expect(rec?.dose).toContain('cần bổ sung chính xác');
    expect(plan.recommendations.some((r) => r.id === 'rec_asthma_action_plan_doc')).toBe(false);
  });
  it('dị ứng cả hai SABA không tạo hướng dẫn dùng thuốc gây dị ứng', () => {
    const p = patient(14, 'track1', 3);
    p.allergies = ['salbutamol', 'terbutaline'];
    const plan = assertSafeController(p);
    expect(plan.recommendations.some((r) => r.id === 'rec_asthma_cyp_rescue_bridge')).toBe(false);
    expect(plan.recommendations.some((r) => r.id === 'rec_asthma_cyp_bridge_review' && r.title.includes('khẩn'))).toBe(true);
  });
  it.each(['INTL', 'VN', 'US'] as const)('xuất viện hồ sơ %s có controller và SABA cầu nối', (profile) => {
    const p = patient(14, 'track1', 3, 'ritonavir', 'budesonide_formoterol');
    p.customInputs = { isAcuteExacerbation: true, acuteResponseAfter1h: 'good_response', pefPct: 85, respiratoryRate: 16, spo2: 98 };
    assertSafeController(p, { ...settings, setting: 'inpatient', profile });
  });
  it.each(['foster', 'beclometasone_formoterol'])('dị ứng sữa đang dùng %s Nexthaler: đổi thiết bị pMDI, không ghi CONTINUE DPI', (id) => {
    const p = patient(45, 'track2', 3);
    p.customInputs = { ...p.customInputs, severeMilkProteinAllergy: true };
    p.currentMeds.push({ drugId: id, name: 'Foster Nexthaler DPI', dose: '1 nhát x 2 lần/ngày' });
    const rec = evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_cyp_controller_bridge');
    expect(rec?.action).toBe('SWITCH');
    expect(rec?.dose).toContain('pMDI');
  });
  it('dị ứng sữa và Trelegy: vẫn có controller pMDI thay thế, không mất ICS qua gate thành phần', () => {
    const p = patient(45, 'track2', 5, 'ritonavir', 'fluticasone_umeclidinium_vilanterol');
    p.customInputs = { ...p.customInputs, severeMilkProteinAllergy: true };
    assertSafeController(p);
  });
  it('dị ứng sữa chưa rõ thiết bị Foster: phải xác định chuyển sang pMDI, không coi thiết bị cũ đã an toàn', () => {
    const p = patient(45, 'track2', 3, 'ritonavir', 'beclometasone_formoterol');
    p.customInputs = { ...p.customInputs, severeMilkProteinAllergy: true };
    const rec = evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_cyp_controller_bridge');
    expect(rec?.action).toBe('SWITCH');
    expect(rec?.dose).toContain('pMDI');
  });
});
