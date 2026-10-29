/**
 * GDMT-VN DOAC Cartesian Product Exhaustive Verification Test
 * Phân quyền: Agent C
 *
 * Kiểm tra TÍCH DESCARTES ĐẦY ĐỦ 28,672 TỔ HỢP giữa Engine và Oracle độc lập
 * Lưới thông số ranh giới theo chỉ đạo Ban Điều Phối:
 * - Tuổi: {64, 65, 74, 75, 79, 80, 81}
 * - Cân nặng: {50, 60, 61, 80}
 * - SCr: {100, 132, 133, 160} µmol/L (ngưỡng 133 µmol/L ~ 1.5 mg/dL)
 * - CrCl: {14, 15, 29, 30, 49, 50, 95, 96} mL/min
 * - Verapamil: {false, true}
 * - PotentPgpInhibitor: {false, true}
 * - HighBleedingRisk: {false, true}
 * - 4 thuốc DOAC: apixaban, rivaroxaban, dabigatran, edoxaban
 */

import { describe, it, expect } from 'vitest';
import { computeDoacDose } from '../../src/engine/calculators/doacDose';
import { doacGroundTruthOracle } from './oracles/doacOracle';

describe('DOAC 28,672 Cartesian Product Exhaustive Verification (Engine vs Independent Oracle)', () => {
  const ages = [64, 65, 74, 75, 79, 80, 81];
  const weights = [50, 60, 61, 80];
  const scrs = [100, 132, 133, 160];
  const crcls = [14, 15, 29, 30, 49, 50, 95, 96];
  const verapamils = [false, true];
  const pgpInhibitors = [false, true];
  const bleedingRisks = [false, true];
  const drugs: ('apixaban' | 'rivaroxaban' | 'dabigatran' | 'edoxaban')[] = [
    'apixaban',
    'rivaroxaban',
    'dabigatran',
    'edoxaban',
  ];

  it('chạy tích Descartes 28,672 tổ hợp và đảm bảo Engine khớp 100% với Oracle độc lập', () => {
    let testedCombos = 0;
    let mismatchCount = 0;
    let firstMismatch = '';

    for (const drug of drugs) {
      for (const age of ages) {
        for (const weight of weights) {
          for (const scr of scrs) {
            for (const crcl of crcls) {
              for (const verapamil of verapamils) {
                for (const potentPgpInhibitor of pgpInhibitors) {
                  for (const highBleedingRisk of bleedingRisks) {
                    testedCombos++;

                    // 1. Chạy Oracle độc lập
                    const oracle = doacGroundTruthOracle({
                      drug,
                      age,
                      weight,
                      scrUmol: scr,
                      crcl,
                      verapamil,
                      potentPgpInhibitor,
                      highBleedingRisk,
                    });

                    // 2. Chạy Engine
                    const engine = computeDoacDose({
                      drug,
                      age,
                      weight,
                      scr,
                      scrUnit: 'umol/L',
                      crcl,
                      verapamil,
                      potentPgpInhibitor,
                      highBleedingRisk,
                    });

                    // 3. So khớp tuyệt đối
                    const contraMatch = engine.contraindicated === oracle.contraindicated;
                    const doseMatch = engine.recommendedDose === oracle.recommendedDose;
                    const reducedMatch = engine.isDoseReduced === oracle.isDoseReduced;
                    const warningMatch =
                      drug !== 'edoxaban' ||
                      (crcl > 95 ? Boolean(engine.warning) === oracle.hasBlackBoxWarning : true);

                    if (!contraMatch || !doseMatch || !reducedMatch || !warningMatch) {
                      mismatchCount++;
                      if (!firstMismatch) {
                        firstMismatch = `Mismatch at ${drug} [age=${age}, wt=${weight}, scr=${scr}, crcl=${crcl}, vera=${verapamil}, pgp=${potentPgpInhibitor}, bleed=${highBleedingRisk}]:\n  Engine: contra=${engine.contraindicated}, red=${engine.isDoseReduced}, dose="${engine.recommendedDose}", warn=${Boolean(engine.warning)}\n  Oracle: contra=${oracle.contraindicated}, red=${oracle.isDoseReduced}, dose="${oracle.recommendedDose}", warn=${oracle.hasBlackBoxWarning}`;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (mismatchCount > 0) {
      throw new Error(`Phát hiện ${mismatchCount}/${testedCombos} tổ hợp không khớp giữa Engine và Oracle!\nChi tiết lỗi đầu tiên:\n${firstMismatch}`);
    }

    expect(testedCombos).toBe(28672);
    expect(mismatchCount).toBe(0);
    console.log(`✔ Đã hoàn thành kiểm thử VÉT CẠN thành công 28,672/28,672 tổ hợp DOAC (0 lệch)!`);
  });
});
