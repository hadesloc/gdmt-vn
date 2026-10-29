/** Direct tests for asthma-wide parser, allergy and inhalation safety standards. */
import { describe, it, expect, vi } from 'vitest';
vi.mock('../../../src/modules/registry', async () => {
  const { asthmaModule } = await import('../../../src/modules/asthma/index');
  return {
    setDemoEnabled: () => {},
    isDemoEnabled: () => false,
    getAllModules: () => [asthmaModule],
    getModule: (id: string) => (id === 'asthma' ? asthmaModule : undefined),
    getActiveModules: (ids: string[]) => (ids.includes('asthma') ? [asthmaModule] : [])
  };
});

import { evaluate } from '../../../src/engine/evaluate';
import type { Patient } from '../../../src/engine/types';
import { defaultSettings } from './invariants.fixtures';
import { parseFreqMultiplier, parseDailyInhalationsFromMed } from '../../../src/modules/asthma/helpers.dosing';

describe('GDMT-VN Module Hen (asthma) - Global Safety Standards', () => {
  describe('Suite 3: Kiểm thử đơn vị 5 Tiêu chuẩn An toàn Toàn cục (Parser tần suất, Dị ứng, Rapihaler 80/2.25)', () => {
    it('parseFreqMultiplier & parseDailyInhalationsFromMed nhân chính xác với freq và fail-closed khi mơ hồ', () => {
      expect(parseFreqMultiplier('Sáng - tối')).toBe(2);
      expect(parseFreqMultiplier('2 lần/ngày')).toBe(2);
      expect(parseFreqMultiplier('BID')).toBe(2);
      expect(parseFreqMultiplier('TID')).toBe(3);
      expect(parseFreqMultiplier('QID')).toBe(4);
      expect(parseFreqMultiplier('mỗi 6 giờ')).toBe(4);
      expect(parseFreqMultiplier('khi cần')).toBeUndefined();
      expect(parseFreqMultiplier('')).toBeUndefined();

      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '2 nhát', freq: 'Sáng - tối' })).toBe(4);
      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '4 xịt', freq: '4 lần/ngày' })).toBe(16);
      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '2 puffs', freq: 'BID' })).toBe(4);
      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '6 nhát/ngày' })).toBe(6);
      // Fail-closed khi thiếu đơn vị nhát/xịt/puff hoặc thiếu tần suất
      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '320 mcg', freq: '2 lần/ngày' })).toBeUndefined();
      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '2 nhát', freq: 'khi cần' })).toBeUndefined();
      expect(parseDailyInhalationsFromMed({ drugId: 'budesonide_formoterol', dose: '2 nhát' })).toBeUndefined();
    });

    it('Rapihaler 80/2.25 mcg (2.25 mcg formoterol/nhát) nâng trần an toàn lên 24 nhát/ngày (16 nhát không báo giả, 25 nhát phát HOLD + REFER)', () => {
      const basePt: Patient = {
        id: 'pt_rap80_test',
        name: 'Nữ 34 tuổi',
        age: 34,
        sex: 'female',
        sbp: 118,
        dbp: 74,
        hr: 82,
        rhythm: 'sinus',
        conditions: { asthma: true },
        selectedModules: ['asthma'],
        currentMeds: [
          { drugId: 'budesonide_formoterol', name: 'Symbicort Rapihaler 80/2.25 mcg', dose: '4 nhát', freq: '2 lần/ngày' }
        ],
        customInputs: {
          currentTrack: 'track1',
          currentStep: 4,
          totalDailyPuffsUsed: 16,
          daytimeSymptomsMoreThanTwiceWeek: false,
          nightWakingDueToAsthma: false,
          relieverNeededMoreThanTwiceWeek: false,
          activityLimitationDueToAsthma: false
        }
      };

      const plan16 = evaluate(basePt, defaultSettings);
      expect(plan16.recommendations.find((r) => r.id === 'rec_asthma_mart_overuse_refer')).toBeUndefined();

      const plan25 = evaluate(
        {
          ...basePt,
          customInputs: { ...basePt.customInputs, totalDailyPuffsUsed: 25 }
        },
        defaultSettings
      );
      expect(plan25.recommendations.find((r) => r.drugId === 'budesonide_formoterol')?.action).toBe('HOLD');
      expect(plan25.recommendations.find((r) => r.id === 'rec_asthma_mart_overuse_refer')?.action).toBe('REFER');
    });

    it('Dị ứng budesonide ở người lớn ≥ 18 tuổi tự động chuyển sang Beclometasone/formoterol (Foster) và không bao giờ kê Budesonide', () => {
      const allergyPt = {
        id: 'pt_allergy_bud',
        name: 'Nam 32 tuổi',
        age: 32,
        sex: 'male',
        sbp: 120,
        dbp: 76,
        hr: 76,
        rhythm: 'sinus',
        allergies: ['budesonide'],
        conditions: { asthma: true },
        selectedModules: ['asthma'],
        currentMeds: [],
        customInputs: {
          currentTrack: 'track1',
          currentStep: 1,
          daytimeSymptomsMoreThanTwiceWeek: true,
          nightWakingDueToAsthma: false,
          relieverNeededMoreThanTwiceWeek: false,
          activityLimitationDueToAsthma: false
        }
      } as unknown as Patient;

      const plan = evaluate(allergyPt, defaultSettings);
      expect(plan.recommendations.find((r) => r.drugId === 'beclometasone_formoterol')?.action).toBe('START');
      expect(plan.recommendations.find((r) => r.drugId === 'budesonide_formoterol')).toBeUndefined();
    });
  });
});
