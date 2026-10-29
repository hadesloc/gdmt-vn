/**
 * GDMT-VN Cross-Module Safety Invariants (Property-Based & Fuzz Testing)
 * Phân quyền: Agent B
 *
 * Kiểm thử bất biến an toàn toàn hệ thống trên 10.000 ca ngẫu nhiên:
 * 1. Bất biến 1: KHÔNG BAO GIỜ có 2 START cùng nhóm loại trừ (RASi/ARNI, MRA, Anticoagulant, Incretin, SGLT2i, Statin, BB, Inhalers).
 * 2. Bất biến 2: KHÔNG BAO GIỜ có START / UPTITRATE / CONTINUE thuốc chống chỉ định/tránh dùng trong thai kỳ khi bệnh nhân mang thai (pregnant / pregnancy).
 * 3. Bất biến 3: Mọi thuốc đang dùng (currentMeds) bị chống chỉ định (thai kỳ, K+ >= 6.0, eGFR < 30) LUÔN CÓ STOP / HOLD / AVOID tương ứng.
 * 4. Bất biến 4: Không có START cho chính thuốc BN đang dùng.
 * 5. Bất biến 5: Red Flag cấp cứu nguy kịch luôn sinh REFER cấp cứu.
 * 6. Bất biến 6: Không có cảnh báo an toàn nào chứa chuỗi giữ chỗ `TODO:`.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/evaluate';
import { derivePatientData } from '../../src/engine/derive';
import { CLASS_CONFLICT_GROUPS, isDrugInConflictGroup } from '../../src/engine/merge';
import { isPregnancyContraindicated } from '../../src/engine/safety/gates';
import type { Patient, Settings, CurrentMed, ModuleId } from '../../src/engine/types';

function createSeededRandom(seed = 123456789) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const defaultSettings: Settings = {
  setting: 'outpatient',
  profile: 'INTL',
  units: {
    cr: 'umol_L',
    glucose: 'mmol_L',
    lipid: 'mmol_L',
    urat: 'umol_L',
    uacr: 'mg_mmol',
    hba1c: 'pct'
  },
  score2Region: 'high',
  fontScale: 'normal',
  theme: 'light',
  onlyReviewed: false
};

const SAMPLE_DRUG_POOL = [
  'perindopril', 'enalapril', 'losartan', 'valsartan', 'sacubitril_valsartan',
  'spironolactone', 'finerenone',
  'dapagliflozin', 'empagliflozin',
  'metformin', 'sitagliptin', 'saxagliptin', 'semaglutide',
  'atorvastatin', 'rosuvastatin', 'simvastatin',
  'bisoprolol', 'carvedilol',
  'apixaban', 'rivaroxaban', 'warfarin',
  'ibuprofen', 'celecoxib',
  'furosemide', 'amlodipine',
  'allopurinol', 'colchicine',
  'tiotropium_olodaterol', 'budesonide_formoterol'
];

const MODULE_POOL: ModuleId[] = ['ckd', 'dm2', 'hf', 'htn', 'gout', 'af', 'lipid', 'copd', 'asthma', '_demo'];

describe('Cross-Module Safety Invariants (10.000 randomized cases)', () => {
  const rand = createSeededRandom(42);

  function generateRandomPatient(index: number): Patient {
    const isFemale = rand() > 0.5;
    const isPregnant = isFemale && rand() < 0.25;
    const hasPriorAngioedema = rand() < 0.08;

    const numModules = Math.floor(rand() * 4) + 2;
    const selectedModules: ModuleId[] = [];
    while (selectedModules.length < numModules) {
      const m = MODULE_POOL[Math.floor(rand() * MODULE_POOL.length)];
      if (!selectedModules.includes(m)) selectedModules.push(m);
    }

    const numMeds = Math.floor(rand() * 5);
    const currentMeds: CurrentMed[] = [];
    for (let i = 0; i < numMeds; i++) {
      const drugId = SAMPLE_DRUG_POOL[Math.floor(rand() * SAMPLE_DRUG_POOL.length)];
      if (!currentMeds.some((m) => m.drugId === drugId)) {
        currentMeds.push({ drugId, name: drugId });
      }
    }

    return {
      id: `fuzz_${index}`,
      age: Math.floor(rand() * 70) + 20,
      sex: isFemale ? 'female' : 'male',
      weight: Math.floor(rand() * 80) + 40,
      height: Math.floor(rand() * 50) + 145,
      sbp: Math.floor(rand() * 120) + 80,
      dbp: Math.floor(rand() * 70) + 50,
      hr: Math.floor(rand() * 90) + 45,
      scr: rand() > 0.05 ? Math.floor(rand() * 450) + 50 : undefined,
      k: rand() > 0.05 ? Number((rand() * 4.2 + 3.0).toFixed(1)) : undefined,
      uacr: rand() > 0.1 ? Number((rand() * 150 + 1).toFixed(1)) : undefined,
      lvef: rand() > 0.2 ? Math.floor(rand() * 55) + 15 : undefined,
      glucose: rand() > 0.2 ? Number((rand() * 15 + 4).toFixed(1)) : undefined,
      hba1c: rand() > 0.2 ? Number((rand() * 8 + 5).toFixed(1)) : undefined,
      ldl: rand() > 0.2 ? Number((rand() * 4 + 1.2).toFixed(1)) : undefined,
      uricAcid: rand() > 0.3 ? Math.floor(rand() * 400) + 250 : undefined,
      fev1Pct: rand() > 0.4 ? Math.floor(rand() * 70) + 25 : undefined,
      selectedModules,
      conditions: {
        pregnant: isPregnant,
        priorAngioedema: hasPriorAngioedema,
        hf: rand() < 0.4,
        dm: rand() < 0.45,
        ckd: rand() < 0.45,
        htn: rand() < 0.5
      },
      currentMeds
    };
  }

  it('runs 10.000 randomized cases with 0 invariant violations', () => {
    const TOTAL_CASES = 10000;
    let violationCount = 0;
    const violations: string[] = [];

    for (let i = 0; i < TOTAL_CASES; i++) {
      const patient = generateRandomPatient(i);
      const derived = derivePatientData(patient, defaultSettings);
      const plan = evaluate(patient, defaultSettings);

      const starts = plan.recommendations.filter((r) => r.action === 'START');
      const activePrescriptions = plan.recommendations.filter(
        (r) => r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE'
      );

      // ----------------------------------------------------
      // BẤT BIẾN 1: Không có 2 START trong cùng nhóm loại trừ
      // ----------------------------------------------------
      for (const group of Object.values(CLASS_CONFLICT_GROUPS)) {
        const matchingStarts = starts.filter(
          (r) => r.drugId && isDrugInConflictGroup(r.drugId, group)
        );

        if (matchingStarts.length > 1) {
          violationCount++;
          if (violations.length < 5) {
            violations.push(
              `Ca #${i}: Nhóm ${group.nameVi} có ${matchingStarts.length} thuốc START đồng thời: ${matchingStarts.map((s) => s.drugId).join(', ')}`
            );
          }
        }
      }

      // ----------------------------------------------------
      // BẤT BIẾN 2: Thai phụ KHÔNG BAO GIỜ nhận START/UPTITRATE/CONTINUE thuốc độc phôi thai
      // ----------------------------------------------------
      if (patient.conditions?.pregnant) {
        for (const r of activePrescriptions) {
          if (r.drugId && isPregnancyContraindicated(r.drugId)) {
            violationCount++;
            if (violations.length < 5) {
              violations.push(
                `Ca #${i} (Mang thai): Thuốc chống chỉ định thai kỳ ${r.drugId} có hành động ${r.action}`
              );
            }
          }
        }
      }

      // ----------------------------------------------------
      // BẤT BIẾN 3: Thuốc đang dùng bị chống chỉ định luôn có STOP/HOLD/AVOID
      // ----------------------------------------------------
      if (patient.conditions?.pregnant) {
        for (const med of patient.currentMeds) {
          if (med.drugId && isPregnancyContraindicated(med.drugId)) {
            const hasStop = plan.recommendations.some(
              (r) =>
                r.drugId?.toLowerCase() === med.drugId?.toLowerCase() &&
                (r.action === 'STOP' || r.action === 'AVOID')
            );
            if (!hasStop) {
              violationCount++;
              if (violations.length < 5) {
                violations.push(
                  `Ca #${i} (Mang thai): Đang dùng ${med.drugId} nhưng không có khuyến cáo STOP/AVOID`
                );
              }
            }
          }
        }
      }

      if (patient.k !== undefined && patient.k >= 6.0) {
        const kSensitivePool = [
          'spironolactone', 'eplerenone', 'finerenone',
          'sacubitril_valsartan', 'enalapril', 'perindopril', 'losartan', 'valsartan'
        ];
        for (const med of patient.currentMeds) {
          if (med.drugId && kSensitivePool.includes(med.drugId.toLowerCase())) {
            const hasStopOrHold = plan.recommendations.some(
              (r) =>
                r.drugId?.toLowerCase() === med.drugId?.toLowerCase() &&
                (r.action === 'STOP' || r.action === 'HOLD' || r.action === 'AVOID')
            );
            if (!hasStopOrHold) {
              violationCount++;
              if (violations.length < 5) {
                violations.push(
                  `Ca #${i} (K+ = ${patient.k}): Đang dùng ${med.drugId} nhưng không có khuyến cáo STOP/HOLD`
                );
              }
            }
          }
        }
      }

      if (
        patient.currentMeds.some((m) => m.drugId?.toLowerCase() === 'metformin') &&
        derived.egfr !== undefined &&
        derived.egfr < 30
      ) {
        const hasMetforminStop = plan.recommendations.some(
          (r) => r.drugId?.toLowerCase() === 'metformin' && (r.action === 'STOP' || r.action === 'AVOID')
        );
        if (!hasMetforminStop) {
          violationCount++;
          if (violations.length < 5) {
            violations.push(`Ca #${i} (eGFR = ${derived.egfr}): Đang dùng metformin nhưng không STOP`);
          }
        }
      }

      // ----------------------------------------------------
      // BẤT BIẾN 4: Không có START cho chính thuốc BN đang dùng
      // ----------------------------------------------------
      for (const r of starts) {
        if (r.drugId && patient.currentMeds.some((m) => m.drugId.toLowerCase() === r.drugId!.toLowerCase())) {
          violationCount++;
          if (violations.length < 5) {
            violations.push(`Ca #${i}: Đang dùng ${r.drugId} nhưng hệ thống lại sinh khuyến cáo START`);
          }
        }
      }

      // ----------------------------------------------------
      // BẤT BIẾN 5: Red Flag cấp cứu nguy kịch (K+ >= 6.5 hoặc SBP < 80)
      // ----------------------------------------------------
      if ((patient.k !== undefined && patient.k >= 6.5) || (patient.sbp !== undefined && patient.sbp < 80)) {
        const hasEmergencyRefer = plan.recommendations.some(
          (r) => r.action === 'REFER' && (r.title.includes('CẤP CỨU') || r.tier.includes('CẤP CỨU'))
        );
        if (!hasEmergencyRefer) {
          violationCount++;
          if (violations.length < 5) {
            violations.push(`Ca #${i}: Sinh hiệu/điện giải nguy kịch (K=${patient.k}, SBP=${patient.sbp}) nhưng thiếu REFER cấp cứu`);
          }
        }
      }

      // ----------------------------------------------------
      // BẤT BIẾN 6: Không có cảnh báo an toàn (alerts) hay khuyến cáo _demo/med_review/emergency nào chứa TODO:
      // ----------------------------------------------------
      for (const alert of plan.alerts) {
        if (alert.citationIds?.some((c) => c.startsWith('TODO:'))) {
          violationCount++;
          if (violations.length < 5) {
            violations.push(`Ca #${i}: Alert ${alert.id} chứa TODO citation`);
          }
        }
      }
      for (const rec of plan.recommendations) {
        if (
          (rec.module === '_demo' || rec.id.startsWith('med_review_') || rec.id.startsWith('emergency_')) &&
          rec.citationIds.some((c) => c.startsWith('TODO:'))
        ) {
          violationCount++;
          if (violations.length < 5) {
            violations.push(`Ca #${i}: Recommendation ${rec.id} chứa TODO citation`);
          }
        }
      }
    }

    if (violationCount > 0) {
      console.error('Các vi phạm mẫu:', violations);
    }

    expect(violationCount).toBe(0);
  });
});
