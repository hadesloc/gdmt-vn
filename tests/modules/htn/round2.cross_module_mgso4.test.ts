/**
 * Kiểm thử Hồi quy Vòng 2 (ASTHMA-R4-R2-03 + R2-R1-HTN-01 + R2-R1-HTN-02 + HTN-R2-R2-12 + SPC):
 * Hợp nhất an toàn liên phân hệ Magnesium sulfate (HTN × Asthma), cổng chống chỉ định Nhược cơ / Suy thận nặng,
 * và giải rã viên phối hợp cố định (SPC) trong helpers.ts.
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { htnModule } from '../../../src/modules/htn';
import { asthmaModule } from '../../../src/modules/asthma';
import type { Patient, Settings } from '../../../src/engine/types';

const inpatientSettings: Settings = {
  setting: 'inpatient',
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

describe('Round 2 Remediation: Preeclampsia MgSO4 Cross-Module Safety & SPC Expansion', () => {
  it('ASTHMA-R4-R2-03: Chặn [AVOID] Magnesium sulfate trên cả HTN + Asthma khi kèm Nhược cơ (Myasthenia gravis)', () => {
    const patient: Patient = {
      id: 'r2_mgso4_myasthenia',
      age: 29,
      sex: 'female',
      weight: 64,
      height: 160,
      sbp: 182,
      dbp: 116,
      hr: 108,
      spo2: 91,
      scr: 72,
      k: 4.1,
      conditions: {
        pregnant: true,
        severePreeclampsiaEclampsia: true,
        asthma: true,
        myastheniaGravis: true
      },
      customInputs: {
        acuteAsthma: true,
        asthmaSeverity: 'life_threatening',
        fev1PctPredicted: 24
      },
      currentMeds: [],
      selectedModules: ['htn', 'asthma']
    };

    const plan = evaluate(patient, inpatientSettings, { modules: [htnModule, asthmaModule] });
    const mgRecs = plan.recommendations.filter((r) => r.drugId === 'magnesium_sulfate');

    expect(mgRecs.length).toBe(1);
    expect(mgRecs[0].action).toBe('AVOID');
    expect(plan.recommendations.some((r) => r.drugId === 'magnesium_sulfate' && r.action === 'START')).toBe(false);
    // Đang có hen phế quản -> Labetalol bị chặn, chuyển sang Nicardipine
    expect(plan.recommendations.some((r) => r.drugId === 'nicardipine' && r.action === 'START')).toBe(true);
  });

  it('ASTHMA-R4-R2-03: Gộp duy nhất 1 y lệnh Magnesium sulfate khi đồng mắc Tiền sản giật nặng + Cơn hen nguy kịch (không nhược cơ)', () => {
    const patient: Patient = {
      id: 'r2_mgso4_dedup',
      age: 31,
      sex: 'female',
      weight: 65,
      height: 158,
      sbp: 178,
      dbp: 114,
      hr: 104,
      spo2: 93,
      scr: 68,
      k: 4.0,
      conditions: {
        pregnant: true,
        severePreeclampsiaEclampsia: true,
        asthma: true
      },
      customInputs: {
        acuteAsthma: true,
        asthmaSeverity: 'severe',
        initialResponse1h: 'poor_response',
        fev1PctPredicted: 28
      },
      currentMeds: [],
      selectedModules: ['htn', 'asthma']
    };

    const plan = evaluate(patient, inpatientSettings, { modules: [htnModule, asthmaModule] });
    const mgRecs = plan.recommendations.filter((r) => r.drugId === 'magnesium_sulfate');
    expect(mgRecs.length).toBe(1);
    expect(mgRecs[0].action).toBe('START');
  });

  it('R2-R1-HTN-01 / HTN-R2-R2-02: Tiền sản giật nặng kèm Suy thận nặng (eGFR < 30) hoặc thiểu niệu -> cấm truyền duy trì mù 1 g/giờ & fail-closed khi thiếu SBP', () => {
    const renalPatient: Patient = {
      id: 'r2_mgso4_renal',
      age: 34,
      sex: 'female',
      sbp: 176,
      dbp: 112,
      hr: 88,
      scr: 260,
      k: 4.6,
      conditions: {
        pregnant: true,
        severePreeclampsiaEclampsia: true
      },
      currentMeds: [],
      selectedModules: ['htn']
    };

    const planRenal = evaluate(renalPatient, inpatientSettings, { modules: [htnModule] });
    const mgRenal = planRenal.recommendations.find((r) => r.drugId === 'magnesium_sulfate');
    expect(mgRenal).toBeDefined();
    expect(mgRenal?.action).toBe('START');
    expect(mgRenal?.dose).toContain('TẠM NGỪNG truyền duy trì thường quy');

    const missingSbpPatient: Patient = {
      ...renalPatient,
      id: 'r2_mgso4_no_sbp',
      sbp: undefined
    };
    const planNoSbp = evaluate(missingSbpPatient, inpatientSettings, { modules: [htnModule] });
    expect(planNoSbp.recommendations.some((r) => r.drugId === 'magnesium_sulfate' && r.action === 'START')).toBe(false);
    expect(planNoSbp.recommendations.some((r) => r.id === 'missing_input_sbp')).toBe(true);
  });

  it('R2-R1-HTN-02 & HTN-R2-R2-12: Tiền sản giật kèm phù phổi cấp HA bình thường không truyền hạ áp tích cực; hẹp khít van ĐMC nặng + hen chuyển Hydralazine IV', () => {
    const normoPulmPatient: Patient = {
      id: 'r2_preecl_normo_pulm',
      age: 28,
      sex: 'female',
      sbp: 118,
      dbp: 74,
      hr: 96,
      scr: 70,
      conditions: {
        pregnant: true,
        severePreeclampsiaEclampsia: true,
        acutePulmonaryEdema: true
      },
      currentMeds: [],
      selectedModules: ['htn']
    };
    const planNormo = evaluate(normoPulmPatient, inpatientSettings, { modules: [htnModule] });
    expect(planNormo.recommendations.some((r) => r.drugId === 'nitroglycerin' && r.action === 'START')).toBe(false);

    const asAsthmaPatient: Patient = {
      id: 'r2_preecl_as_asthma',
      age: 32,
      sex: 'female',
      sbp: 180,
      dbp: 114,
      hr: 92,
      scr: 70,
      conditions: {
        pregnant: true,
        severePreeclampsiaEclampsia: true,
        asthma: true
      },
      customInputs: {
        severeAorticStenosis: true
      },
      currentMeds: [],
      selectedModules: ['htn']
    };
    const planAs = evaluate(asAsthmaPatient, inpatientSettings, { modules: [htnModule] });
    expect(planAs.recommendations.some((r) => r.drugId === 'nicardipine' && r.action === 'START')).toBe(false);
    expect(planAs.recommendations.some((r) => r.drugId === 'hydralazine' && r.action === 'START')).toBe(true);
  });

  it('R2-R1-HTN-03: Giải rã viên phối hợp cố định (SPC Triplixam) nhận diện đủ 3 nhóm nền ngoại trú và phát hiện trùng RASi', () => {
    const spcPatient: Patient = {
      id: 'r2_spc_triplixam',
      age: 58,
      sex: 'male',
      sbp: 152,
      dbp: 94,
      hr: 72,
      scr: 88,
      k: 4.1,
      conditions: { htn: true },
      currentMeds: [
        { drugId: 'perindopril_indapamide_amlodipine', name: 'Triplixam' },
        { drugId: 'losartan', name: 'Cozaar', dose: 50, unit: 'mg' }
      ],
      selectedModules: ['htn']
    };
    const planSpc = evaluate(spcPatient, { ...inpatientSettings, setting: 'outpatient' }, { modules: [htnModule] });
    expect(planSpc.recommendations.some((r) => r.id === 'rec_htn_ban_dual_rasi' && r.action === 'STOP')).toBe(true);
  });
});
