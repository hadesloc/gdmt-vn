/**
 * GDMT-VN Module Rối loạn Lipid Máu (`lipid`) - Property-Based Safety Invariants Test (Random >= 15,000 Cases)
 * Phân quyền: Agent I2 / Agent I5 (Round 3 Remediation — split < 20 KB)
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { derivePatientData } from '../../../src/engine/derive';
import type { Patient, Settings } from '../../../src/engine/types';
import {
  ALL_LIPID_DRUGS,
  LDL_LOWERING_DRUGS,
  STATIN_IDS,
  defaultSettings,
  generateRandomLipidPatient,
  randInt
} from './_fixtures';

describe('lipid_invariants_random: Kiểm thử bất biến an toàn module lipid trên >= 15.000 ca ngẫu nhiên (QA-1 & QA-9)', () => {
  it(
    'lipid suite 1: Chạy 10.000 ca ngẫu nhiên đầy đủ (ngoại trú & nội trú ACS) và đảm bảo 0 vi phạm bất biến an toàn',
    () => {
      const TOTAL_CASES = 10000;
      let violations = 0;
      const violationLog: string[] = [];

      const recordViolation = (msg: string) => {
        violations++;
        if (violationLog.length < 10) {
          violationLog.push(msg);
        }
      };

      for (let i = 0; i < TOTAL_CASES; i++) {
        const patient = generateRandomLipidPatient(i);
        const isOutpatient = Math.random() < 0.65;
        const settings: Settings = {
          ...defaultSettings,
          setting: isOutpatient ? 'outpatient' : 'inpatient'
        };

        const plan = evaluate(patient, settings);
        const derived = derivePatientData(patient, settings);
        const egfr = derived.egfr;
        const altUln = Number(patient.customInputs?.altUlnTimes ?? 0);
        const ckUln = Number(patient.customInputs?.ckUlnTimes ?? 0);

        // 1. Bất biến thai kỳ
        if (patient.conditions.pregnant) {
          const startInPregnancy = plan.recommendations.find(
            (r) =>
              ALL_LIPID_DRUGS.includes(r.drugId ?? '') &&
              (r.action === 'START' ||
                r.action === 'UPTITRATE' ||
                r.action === 'SWITCH' ||
                r.action === 'CONTINUE')
          );
          if (startInPregnancy) {
            recordViolation(
              `[Ca #${i}] Thai kỳ nhưng vẫn sinh ${startInPregnancy.action} ${startInPregnancy.drugId}!`
            );
          }

          for (const med of patient.currentMeds) {
            if (ALL_LIPID_DRUGS.includes(med.drugId)) {
              const stopped = plan.recommendations.some(
                (r) => r.drugId === med.drugId && r.action === 'STOP'
              );
              if (!stopped) {
                recordViolation(
                  `[Ca #${i}] Thai kỳ đang dùng ${med.drugId} nhưng không phát lệnh STOP!`
                );
              }
            }
          }
        }

        // 2. Bất biến tổn thương gan (ALT >= 3x ULN hoặc bệnh gan cấp)
        if (altUln >= 3 || patient.conditions.liverDisease) {
          const hepatotoxicStart = plan.recommendations.find(
            (r) =>
              (STATIN_IDS.includes(r.drugId ?? '') || r.drugId === 'fenofibrate') &&
              (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'SWITCH')
          );
          if (hepatotoxicStart) {
            recordViolation(
              `[Ca #${i}] ALT=${altUln}x ULN / liverDisease=${Boolean(patient.conditions.liverDisease)} nhưng vẫn sinh ${hepatotoxicStart.action} ${hepatotoxicStart.drugId}!`
            );
          }
        }

        // 3. Bất biến độc tính cơ (CK > 4x ULN & tiêu cơ vân CK >= 10x ULN)
        if (ckUln > 4) {
          const myotoxicStart = plan.recommendations.find(
            (r) =>
              (STATIN_IDS.includes(r.drugId ?? '') || r.drugId === 'fenofibrate') &&
              (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'SWITCH')
          );
          if (myotoxicStart) {
            recordViolation(
              `[Ca #${i}] CK=${ckUln}x ULN (> 4x) nhưng vẫn sinh ${myotoxicStart.action} ${myotoxicStart.drugId}!`
            );
          }
        }
        if (!patient.conditions.pregnant && ckUln >= 10) {
          const hasRhabdoRefer = plan.recommendations.some(
            (r) => r.id === 'rec_lipid_ck_rhabdo_refer' && r.action === 'REFER'
          );
          if (!hasRhabdoRefer) {
            recordViolation(
              `[Ca #${i}] CK=${ckUln}x ULN (>= 10x) nhưng thiếu lệnh REFER cấp cứu tiêu cơ vân!`
            );
          }
        }

        // 4. Bất biến không dung nạp statin
        if (patient.conditions.statinIntolerance) {
          const statinRec = plan.recommendations.find(
            (r) =>
              STATIN_IDS.includes(r.drugId ?? '') &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          );
          if (statinRec) {
            recordViolation(
              `[Ca #${i}] Không dung nạp statin nhưng vẫn sinh ${statinRec.action} ${statinRec.drugId}!`
            );
          }
        }

        // 5. Bất biến Gút / Acid uric > 420 µmol/L hoặc lọc máu đối với Bempedoic acid
        if (
          patient.conditions.gout ||
          patient.conditions.onDialysis ||
          (patient.uricAcid !== undefined && patient.uricAcid > 420)
        ) {
          const bempStart = plan.recommendations.find(
            (r) =>
              r.drugId === 'bempedoic_acid' &&
              (r.action === 'START' || r.action === 'CONTINUE')
          );
          if (bempStart) {
            recordViolation(
              `[Ca #${i}] Gút / Acid uric=${patient.uricAcid} / dialysis=${Boolean(patient.conditions.onDialysis)} nhưng vẫn sinh ${bempStart.action} bempedoic_acid!`
            );
          }
        }

        // 6. Bất biến suy thận nặng (eGFR < 30 hoặc lọc máu) với Fenofibrate
        if ((egfr !== undefined && egfr < 30) || patient.conditions.onDialysis) {
          const fenoBad = plan.recommendations.find(
            (r) =>
              r.drugId === 'fenofibrate' &&
              (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE')
          );
          if (fenoBad) {
            recordViolation(
              `[Ca #${i}] eGFR=${egfr} / dialysis=${Boolean(patient.conditions.onDialysis)} nhưng vẫn sinh ${fenoBad.action} fenofibrate!`
            );
          }

          if (patient.currentMeds.some((m) => m.drugId === 'fenofibrate')) {
            const fenoStopped = plan.recommendations.some(
              (r) => r.drugId === 'fenofibrate' && r.action === 'STOP'
            );
            if (!fenoStopped) {
              recordViolation(
                `[Ca #${i}] Đang dùng fenofibrate khi eGFR < 30 / lọc máu nhưng không phát lệnh STOP!`
              );
            }
          }
        }

        // 7. Bất biến Rosuvastatin ở eGFR < 30 / lọc máu: Không kê > 10 mg và không gợi ý Rosuvastatin 20–40 mg
        if ((egfr !== undefined && egfr < 30) || patient.conditions.onDialysis) {
          const rosuvaRec = plan.recommendations.find(
            (r) =>
              r.drugId === 'rosuvastatin' &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          );
          if (rosuvaRec && typeof rosuvaRec.dose === 'string') {
            if (rosuvaRec.dose.includes('20') || rosuvaRec.dose.includes('40')) {
              recordViolation(
                `[Ca #${i}] Kê Rosuvastatin (${rosuvaRec.dose}) vượt trần 10 mg khi eGFR=${egfr}!`
              );
            }
          }
          const badRationale = plan.recommendations.find(
            (r) =>
              r.module === 'lipid' &&
              (r.action === 'START' || r.action === 'UPTITRATE') &&
              /Rosuvastatin\s+20[–-]40\s*mg/i.test(r.rationale)
          );
          if (badRationale) {
            recordViolation(
              `[Ca #${i}] Rationale gợi ý Rosuvastatin 20–40 mg trên bệnh nhân eGFR=${egfr} < 30 / lọc máu!`
            );
          }
        }

        // 8. Bất biến tương tác thuốc (Clarithromycin / Cyclosporine / Gemfibrozil): Không START/UPTITRATE Atorvastatin 40–80 mg
        const hasStrongDdi = patient.currentMeds.some((m) =>
          ['clarithromycin', 'cyclosporine', 'gemfibrozil'].includes(m.drugId)
        );
        if (hasStrongDdi) {
          const highAtorvaStart = plan.recommendations.find(
            (r) =>
              r.drugId === 'atorvastatin' &&
              (r.action === 'START' || r.action === 'UPTITRATE') &&
              typeof r.dose === 'string' &&
              (r.dose.includes('40') || r.dose.includes('80'))
          );
          if (highAtorvaStart) {
            recordViolation(
              `[Ca #${i}] Đang có tương tác mạnh (Clarithromycin/Cyclosporine/Gemfibrozil) nhưng vẫn START Atorvastatin liều cao (${highAtorvaStart.dose})!`
            );
          }
        }

        // 9. Không bao giờ START Gemfibrozil hoặc nâng/khởi trị Simvastatin 80 mg
        const gemStart = plan.recommendations.find(
          (r) => r.drugId === 'gemfibrozil' && r.action === 'START'
        );
        if (gemStart) {
          recordViolation(`[Ca #${i}] Sinh START gemfibrozil!`);
        }
        const simva80 = plan.recommendations.find(
          (r) =>
            r.drugId === 'simvastatin' &&
            (r.action === 'START' || r.action === 'UPTITRATE') &&
            typeof r.dose === 'string' &&
            r.dose.includes('80')
        );
        if (simva80) {
          recordViolation(`[Ca #${i}] Kê/tăng liều Simvastatin 80 mg chống chỉ định!`);
        }
      }

      if (violations > 0) {
        console.error(
          `Phát hiện ${violations} vi phạm bất biến an toàn:\n`,
          violationLog.join('\n')
        );
      }
      expect(violations).toBe(0);
    },
    180_000
  );

  it(
    'lipid suite 2 (QA-1 & QA-9 fail-closed): Xóa ngẫu nhiên các trường lâm sàng bắt buộc trên 5.000 ca -> 0 vi phạm',
    () => {
      const CASES = 5000;
      let failClosedViolations = 0;
      const failClosedLogs: string[] = [];

      const fieldKeys: (keyof Patient)[] = [
        'ldl',
        'tg',
        'tc',
        'hdl',
        'scr',
        'age',
        'sex',
        'sbp',
        'dbp',
        'hr'
      ];

      for (let i = 0; i < CASES; i++) {
        const patient = generateRandomLipidPatient(i);

        const fieldsToDropCount = randInt(1, 5);
        for (let f = 0; f < fieldsToDropCount; f++) {
          const key = fieldKeys[randInt(0, fieldKeys.length - 1)];
          delete (patient as unknown as Record<string, unknown>)[key];
        }

        const isOutpatient = Math.random() < 0.7;
        const settings: Settings = {
          ...defaultSettings,
          setting: isOutpatient ? 'outpatient' : 'inpatient'
        };

        const plan = evaluate(patient, settings);
        const derived = derivePatientData(patient, settings);
        const egfr = derived.egfr;
        const isAcuteAcsInpt = !isOutpatient && Boolean(patient.conditions.acuteAcsWithin24h);

        if (patient.ldl === undefined && !isAcuteAcsInpt) {
          const badLdlRec = plan.recommendations.find(
            (r) =>
              r.module === 'lipid' &&
              LDL_LOWERING_DRUGS.includes(r.drugId ?? '') &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          );
          if (badLdlRec) {
            failClosedViolations++;
            if (failClosedLogs.length < 5) {
              failClosedLogs.push(
                `[Ca #${i}] Thiếu LDL-C nhưng vẫn sinh ${badLdlRec.action} ${badLdlRec.drugId} (${badLdlRec.id})!`
              );
            }
          }
        }

        if (
          egfr === undefined &&
          !patient.conditions.onDialysis &&
          patient.tg !== undefined &&
          patient.tg >= 5.6
        ) {
          const fenoStartRec = plan.recommendations.find(
            (r) =>
              r.drugId === 'fenofibrate' &&
              (r.action === 'START' || r.action === 'UPTITRATE')
          );
          if (fenoStartRec) {
            failClosedViolations++;
            if (failClosedLogs.length < 5) {
              failClosedLogs.push(
                `[Ca #${i}] Thiếu eGFR ở TG=${patient.tg} nhưng vẫn sinh ${fenoStartRec.action} fenofibrate!`
              );
            }
          }
        }
      }

      if (failClosedViolations > 0) {
        console.error(
          `Phát hiện ${failClosedViolations} vi phạm fail-closed:\n`,
          failClosedLogs.join('\n')
        );
      }
      expect(failClosedViolations).toBe(0);
    },
    180_000
  );
});
