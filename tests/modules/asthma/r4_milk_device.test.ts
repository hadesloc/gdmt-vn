import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import type { Patient, Settings } from '../../../src/engine/types';
import { isMedDpiDevice } from '../../../src/modules/asthma/helpers';

const settings: Settings = {
  setting: 'outpatient', profile: 'INTL',
  units: { cr: 'umol_L', glucose: 'mmol_L', lipid: 'mmol_L', urat: 'umol_L', uacr: 'mg_mmol', hba1c: 'pct' },
  score2Region: 'high', fontScale: 'normal', theme: 'light', onlyReviewed: false,
};

function patient(step: number, name = 'Seretide Evohaler pMDI'): Patient {
  return {
    id: 'asthma-r4-milk-device', age: 45, sex: 'female', weight: 60, height: 160,
    sbp: 125, dbp: 75, hr: 75, spo2: 98, scr: 70, k: 4.2,
    selectedModules: ['asthma'], conditions: { asthma: true },
    currentMeds: [{ drugId: 'fluticasone_salmeterol', name, dose: '2 nhát x 2 lần/ngày' }],
    customInputs: {
      severeMilkProteinAllergy: true, currentTrack: 'track2', currentStep: step,
      isAcuteExacerbation: false, daytimeSymptomsMoreThanTwiceWeek: false,
      nightWakingDueToAsthma: false, relieverNeededMoreThanTwiceWeek: false,
      activityLimitationDueToAsthma: false, exacerbationsLastYear: 0,
    },
  };
}

describe('ASTHMA-R4-R1-02: dị ứng protein sữa phụ thuộc thiết bị hít', () => {
  it.each([3, 4, 5])('giữ Seretide pMDI ở Track 2 bậc %i, không chặn theo thành phần salmeterol', (step) => {
    const plan = evaluate(patient(step), settings);
    const recs = plan.recommendations.filter((r) => r.drugId === 'fluticasone_salmeterol');
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => ['CONTINUE', 'UPTITRATE', 'REDUCE'].includes(r.action))).toBe(true);
    expect(recs.some((r) => ['STOP', 'AVOID', 'HOLD', 'DEFER'].includes(r.action))).toBe(false);
    const dose = recs.map((r) => String(r.dose ?? '')).join(' ');
    expect(dose).toContain('pMDI');
    expect(dose).toContain('không chứa lactose');
    expect(dose).toContain('buồng đệm');
  });

  it('vẫn cảnh báo đổi thiết bị khi Seretide là Accuhaler', () => {
    const plan = evaluate(patient(3, 'Seretide Accuhaler DPI'), settings);
    const guard = plan.recommendations.find((r) => r.id === 'rec_asthma_milk_allergy_pmdi_guard');
    expect(guard?.title).toContain('ĐỔI NGAY THIẾT BỊ');
    expect(guard?.title).toContain('Seretide Accuhaler');
  });

  it('phân biệt Serevent Evohaler và Accuhaler thay vì coi mọi salmeterol là DPI', () => {
    expect(isMedDpiDevice({ drugId: 'salmeterol', name: 'Serevent Evohaler pMDI' })).toBe(false);
    expect(isMedDpiDevice({ drugId: 'salmeterol', name: 'Serevent Accuhaler DPI' })).toBe(true);
  });

  it('vẫn chặn thuốc chỉ có dạng DPI chứa lactose', () => {
    const p = patient(3);
    p.currentMeds = [{ drugId: 'fluticasone_vilanterol', name: 'Relvar Ellipta' }];
    const plan = evaluate(p, settings);
    const recs = plan.recommendations.filter((r) => r.drugId === 'fluticasone_vilanterol');
    expect(recs.some((r) => r.action === 'STOP')).toBe(true);
    expect(recs.some((r) => ['START', 'CONTINUE', 'UPTITRATE'].includes(r.action))).toBe(false);
  });

  it('cảnh báo đổi Serevent Accuhaler nhưng không báo nhầm Serevent Evohaler', () => {
    for (const device of ['Evohaler pMDI', 'Accuhaler DPI']) {
      const p = patient(3);
      p.currentMeds.push({ drugId: 'salmeterol', name: `Serevent ${device}` });
      const guard = evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_milk_allergy_pmdi_guard');
      expect(guard?.title.includes('ĐỔI NGAY THIẾT BỊ')).toBe(device === 'Accuhaler DPI');
    }
  });

  it('yêu cầu xác minh khi salmeterol chưa ghi rõ thiết bị', () => {
    const p = patient(3);
    p.currentMeds.push({ drugId: 'salmeterol', name: 'Salmeterol' });
    const guard = evaluate(p, settings).recommendations.find((r) => r.id === 'rec_asthma_milk_allergy_pmdi_guard');
    expect(guard?.title).toContain('XÁC MINH THIẾT BỊ');
    expect(guard?.rationale).toContain('trước khi dùng/cấp phát');
  });
});
