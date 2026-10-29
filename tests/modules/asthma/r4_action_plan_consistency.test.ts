import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';

const settings: Settings = {
  setting: 'outpatient', profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false,
};

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'asthma-r4-action-plan', age: 45, sex: 'female', weight: 60,
    sbp: 125, dbp: 75, hr: 75, spo2: 98, scr: 70, k: 4.2,
    selectedModules: ['asthma'], conditions: { asthma: true }, currentMeds: [],
    customInputs: {
      currentTrack: 'track1', currentStep: 5, isAcuteExacerbation: false,
      daytimeSymptomsMoreThanTwiceWeek: false, nightWakingDueToAsthma: false,
      relieverNeededMoreThanTwiceWeek: false, activityLimitationDueToAsthma: false,
      exacerbationsLastYear: 0,
    },
    ...overrides,
  };
}

const documentFor = (p: Patient, s = settings) => evaluate(p, s).recommendations
  .find((r) => r.id === 'rec_asthma_action_plan_doc');

describe('ASTHMA-R4-R3-07: kế hoạch hành động khớp thuốc kiểm soát an toàn', () => {
  it('không tự sinh đơn và liều khi ngoại trú còn thiếu toàn bộ câu hỏi GINA', () => {
    const p = patient({ customInputs: { currentTrack: 'track1', currentStep: 0, isAcuteExacerbation: false } });
    const plan = evaluate(p, settings);
    expect(plan.recommendations.some((r) => r.id === 'missing_input_daytimeSymptomsMoreThanTwiceWeek')).toBe(true);
    expect(documentFor(p)).toBeUndefined();
  });

  it('không in Trelegy bị tránh do ritonavir; Track 1 có thể in controller thay thế hợp lệ', () => {
    const p = patient({ currentMeds: [
      { drugId: 'fluticasone_umeclidinium_vilanterol', name: 'Trelegy Ellipta' },
      { drugId: 'ritonavir', name: 'Ritonavir' },
    ] });
    const doc = documentFor(p);
    expect(doc).toBeDefined();
    expect(doc?.rationale).not.toContain('Trelegy');
    expect(doc?.rationale).toMatch(/Beclometasone\s*\/\s*(Glycopyrronium\s*\/\s*)?Formoterol/i);
  });

  it('không in Trelegy khi bệnh nhân dị ứng thành phần fluticasone', () => {
    const p = patient({ allergies: ['fluticasone'], currentMeds: [
      { drugId: 'fluticasone_umeclidinium_vilanterol', name: 'Trelegy Ellipta' },
    ] });
    const doc = documentFor(p);
    expect(doc).toBeDefined();
    expect(doc?.rationale).not.toContain('Trelegy');
  });

  it('Track 2 có tương tác: chỉ xuất kế hoạch khi đã chọn được controller cầu nối an toàn', () => {
    const p = patient({ currentMeds: [{ drugId: 'ritonavir' }] });
    p.customInputs = { ...p.customInputs, currentTrack: 'track2', currentStep: 3 };
    expect(documentFor(p)?.rationale).toMatch(/Beclometasone\s*\/\s*Formoterol/i);
    expect(documentFor(p)?.rationale).not.toContain('Fluticasone');
  });

  it('tuổi 14 dùng ritonavir: kế hoạch theo ICS đơn cầu nối, không kê MART chưa phù hợp', () => {
    const p = patient({ age: 14, currentMeds: [{ drugId: 'ritonavir' }] });
    expect(documentFor(p)?.rationale).toContain('Beclometasone dipropionate');
    expect(documentFor(p)?.rationale).not.toContain('Budesonide/formoterol');
  });

  it('vẫn xuất kế hoạch cho bệnh nhân ổn định đã đủ đánh giá', () => {
    expect(documentFor(patient())).toBeDefined();
  });

  it('giữ tên bình ba thuốc khi không có tương tác hay dị ứng', () => {
    const p = patient({ currentMeds: [
      { drugId: 'fluticasone_umeclidinium_vilanterol', name: 'Trelegy Ellipta' },
    ] });
    expect(documentFor(p)?.rationale).toContain('Trelegy Ellipta');
  });

  it('không xuất kế hoạch khi cả hai lựa chọn MART đều bị dị ứng', () => {
    const p = patient({ allergies: ['budesonide', 'beclometasone'] });
    expect(documentFor(p)).toBeUndefined();
  });

  it('xuất viện sau cơn cấp: kế hoạch loại Trelegy tương tác nhưng vẫn dùng đánh giá xuất viện', () => {
    const p = patient({ currentMeds: [
      { drugId: 'fluticasone_umeclidinium_vilanterol', name: 'Trelegy Ellipta' },
      { drugId: 'ritonavir' },
    ], customInputs: {
      isAcuteExacerbation: true, acuteResponseAfter1h: 'good_response',
      respiratoryRate: 16, pefPct: 85, spo2: 98,
    } });
    const doc = documentFor(p, { ...settings, setting: 'inpatient' });
    expect(doc).toBeDefined();
    expect(doc?.rationale).not.toContain('Trelegy');
    expect(doc?.rationale).toMatch(/Beclometasone\s*\/\s*(Glycopyrronium\s*\/\s*)?Formoterol/i);
  });
});
