/** 12,000 randomized outpatient and inpatient asthma safety cases. */
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
import { thFor } from '../../../src/kb-types';
import { defaultSettings, generateRandomAsthmaPatient } from './invariants.fixtures';
import { verifyRandomInpatientCase } from './invariants.random-inpatient';

describe('GDMT-VN Module Hen (asthma) - Randomized Safety Invariants', () => {
  it('Suite 1: Đảm bảo 0 vi phạm trên 17 bất biến an toàn lâm sàng & 5 tiêu chuẩn toàn cục qua 12.000 ca ngẫu nhiên', () => {
    const TOTAL_CASES = 12000;
    let violations = 0;
    const violationLog: string[] = [];

    const ageMin = thFor('age', 'asthma.age.min_adult_adolescent');
    const ageAdult18 = thFor('age', 'asthma.age.min_adult_18');
    const maxPuffs = thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations');
    const lowFev1 = thFor('fev1_pct', 'asthma.risk.low_fev1_pct');
    const paco2Max = thFor('paco2', 'asthma.acute.life_threatening_paco2_mmhg');

    for (let i = 0; i < TOTAL_CASES; i++) {
      const patient = generateRandomAsthmaPatient(i);
      const isUnder12 = (patient.age ?? 0) < ageMin;
      const isAdolescent12To17 = (patient.age ?? 0) >= ageMin && (patient.age ?? 0) < ageAdult18;
      const hasMartInMeds = patient.currentMeds.some(
        (m) => m.drugId === 'budesonide_formoterol' || m.drugId === 'beclometasone_formoterol'
      );
      const isTrack2WithoutMart = patient.customInputs?.currentTrack === 'track2' && !hasMartInMeds;
      const isOverusedPuffs =
        !isTrack2WithoutMart && Number(patient.customInputs?.totalDailyPuffsUsed ?? 0) > maxPuffs;
      const hasCarvedilol = patient.currentMeds.some((m) => m.drugId === 'carvedilol');
      const hasTimolol = patient.currentMeds.some((m) => m.drugId === 'timolol');
      const hasAspirin = patient.currentMeds.some((m) => m.drugId === 'aspirin');
      const hasAerd = Boolean(patient.conditions?.aerd);
      const isPregnant = Boolean(patient.conditions?.pregnant || patient.customInputs?.isPregnant);
      const sabaMed = patient.currentMeds.find((m) => m.drugId === 'salbutamol' || m.drugId === 'terbutaline');
      const hasIcsMed = patient.currentMeds.some(
        (m) =>
          m.drugId.includes('budesonide') ||
          m.drugId.includes('fluticasone') ||
          m.drugId.includes('beclometasone') ||
          m.drugId.includes('mometasone')
      );
      const hasSalmeterolMono = patient.currentMeds.some((m) => m.drugId === 'salmeterol') && !hasIcsMed;
      const hasUmeclidiniumMono = patient.currentMeds.some((m) => m.drugId === 'umeclidinium') && !hasIcsMed;
      const hasDupLaba =
        patient.currentMeds.some((m) => m.drugId === 'budesonide_formoterol') &&
        patient.currentMeds.some((m) => m.drugId === 'indacaterol');
      const takingMontelukast = patient.currentMeds.some((m) => m.drugId === 'montelukast');
      const hasPsychRisk = Boolean(patient.customInputs?.priorNeuropsychiatric || patient.conditions?.depression);
      const hasFosterInMeds = patient.currentMeds.some((m) => m.drugId === 'beclometasone_formoterol');
      const hasTheophylline = patient.currentMeds.some((m) => m.drugId === 'theophylline');

      // Đánh giá Ngoại trú
      const planOut = evaluate(patient, defaultSettings);
      const hasOutpatientAcuteAttack = planOut.recommendations.some(
        (r) => r.id === 'rec_asthma_outpatient_acute_refer' || r.id === 'rec_asthma_acute_life_threatening_icu'
      );

      // 0. Tiêu chuẩn toàn cục #4: Mọi khuyến cáo STOP / AVOID / HOLD ngoại trú có dose === undefined
      for (const r of planOut.recommendations) {
        if ((r.action === 'STOP' || r.action === 'AVOID' || r.action === 'HOLD') && r.dose !== undefined) {
          violations++;
          violationLog.push(`[Ca #${i}] Ngoại trú ${r.id} (${r.action}) còn dính dose="${r.dose}"`);
        }
      }

      // 1. Trẻ < 12 tuổi không được sinh START/UPTITRATE/SWITCH phác đồ người lớn
      if (isUnder12) {
        const adultStart = planOut.recommendations.find(
          (r) =>
            [
              'budesonide_formoterol',
              'beclometasone_formoterol',
              'fluticasone_salmeterol',
              'fluticasone_vilanterol',
              'mometasone_formoterol',
              'fluticasone_propionate'
            ].includes(r.drugId ?? '') && ['START', 'UPTITRATE', 'SWITCH'].includes(r.action)
        );
        if (adultStart) {
          violations++;
          violationLog.push(`[Ca #${i}] Trẻ ${patient.age}t < 12t nhưng sinh ${adultStart.action} ${adultStart.drugId}`);
        }
      }

      // 2. Ngoại trú ngoài cơn cấp không bao giờ SABA đơn độc khởi trị mà không có ICS
      if (!isUnder12 && !hasOutpatientAcuteAttack) {
        const sabaStart = planOut.recommendations.find(
          (r) => (r.drugId === 'salbutamol' || r.drugId === 'terbutaline') && r.action === 'START'
        );
        if (sabaStart) {
          const hasIcs =
            planOut.recommendations.some((r) =>
              [
                'budesonide',
                'fluticasone_propionate',
                'fluticasone_salmeterol',
                'fluticasone_vilanterol',
                'mometasone_formoterol',
                'budesonide_formoterol',
                'beclometasone_formoterol'
              ].includes(r.drugId ?? '')
            ) || hasIcsMed;
          if (!hasIcs) {
            violations++;
            violationLog.push(`[Ca #${i}] Ngoại trú mạn tính sinh SABA đơn độc không có ICS`);
          }
        }
      }

      // 3. SABA đơn độc ngoài cơn cấp luôn bị STOP (R2-12)
      if (!isUnder12 && !hasOutpatientAcuteAttack && sabaMed && !hasIcsMed) {
        const stopSaba = planOut.recommendations.find(
          (r) => r.drugId === sabaMed.drugId && (r.action === 'STOP' || r.action === 'AVOID')
        );
        if (!stopSaba) {
          violations++;
          violationLog.push(`[Ca #${i}] SABA đơn độc (${sabaMed.drugId}) ngoài cơn cấp nhưng không có STOP`);
        }
      }

      // 4. LABA đơn độc và LAMA đơn độc không kèm ICS luôn bị STOP (R3-03, ASTHMA-R3-R1-02)
      if (hasSalmeterolMono) {
        const stopLaba = planOut.recommendations.find(
          (r) => r.drugId === 'salmeterol' && (r.action === 'STOP' || r.action === 'AVOID')
        );
        if (!stopLaba) {
          violations++;
          violationLog.push(`[Ca #${i}] LABA đơn độc không có ICS nhưng không có STOP`);
        }
      }
      if (hasUmeclidiniumMono) {
        const stopLama = planOut.recommendations.find(
          (r) => r.drugId === 'umeclidinium' && (r.action === 'STOP' || r.action === 'AVOID')
        );
        if (!stopLama) {
          violations++;
          violationLog.push(`[Ca #${i}] LAMA đơn độc (umeclidinium) không có ICS nhưng không có STOP`);
        }
      }

      // 5. Trùng lặp 2 LABA trong currentMeds luôn có cảnh báo AVOID (R3-13)
      if (hasDupLaba) {
        const dupWarn = planOut.recommendations.find(
          (r) => r.id === 'rec_asthma_duplicate_laba_warning' || (r.drugId === 'indacaterol' && r.action === 'AVOID')
        );
        if (!dupWarn) {
          violations++;
          violationLog.push(`[Ca #${i}] Trùng lặp 2 LABA nhưng không có cảnh báo AVOID`);
        }
      }

      // 6. Quá liều formoterol (> 12 nhát) luôn bị HOLD/STOP, có REFER cấp cứu và không sinh START/UPTITRATE
      if (isOverusedPuffs && !isUnder12) {
        const holdRec = planOut.recommendations.find(
          (r) =>
            (r.drugId === 'budesonide_formoterol' || r.drugId === 'beclometasone_formoterol') &&
            (r.action === 'HOLD' || r.action === 'STOP' || r.action === 'AVOID')
        );
        const referRec = planOut.recommendations.find(
          (r) => r.id === 'rec_asthma_mart_overuse_refer' && r.action === 'REFER'
        );
        const conflictingMartStart = planOut.recommendations.find(
          (r) =>
            (r.drugId === 'budesonide_formoterol' || r.drugId === 'beclometasone_formoterol') &&
            ['START', 'UPTITRATE', 'CONTINUE', 'SWITCH'].includes(r.action)
        );
        if (!holdRec || !referRec || conflictingMartStart) {
          violations++;
          violationLog.push(
            `[Ca #${i}] Dùng > 12 nhát MART lỗi: HOLD=${Boolean(holdRec)}, REFER=${Boolean(referRec)}, conflict=${conflictingMartStart?.action}`
          );
        }
      }

      // 7. Mọi chẹn beta không chọn lọc (Carvedilol) VÀ nhỏ mắt Timolol đều phải bị STOP
      if (hasCarvedilol) {
        const stopBb = planOut.recommendations.find((r) => r.drugId === 'carvedilol' && r.action === 'STOP');
        if (!stopBb) {
          violations++;
          violationLog.push(`[Ca #${i}] Dùng Carvedilol nhưng không có STOP`);
        }
      }
      if (hasTimolol) {
        const stopTimolol = planOut.recommendations.find((r) => r.drugId === 'timolol' && r.action === 'STOP');
        if (!stopTimolol) {
          violations++;
          violationLog.push(`[Ca #${i}] Dùng thuốc nhỏ mắt Timolol nhưng không có STOP`);
        }
      }

      // 8. Cơ địa AERD: Aspirin đang dùng -> STOP; chưa dùng -> AVOID
      if (hasAerd) {
        if (hasAspirin) {
          const stopAspirin = planOut.recommendations.find(
            (r) => r.drugId === 'aspirin' && r.action === 'STOP'
          );
          if (!stopAspirin) {
            violations++;
            violationLog.push(`[Ca #${i}] Bệnh nhân AERD đang dùng Aspirin nhưng không có STOP`);
          }
        } else {
          const avoidAspirin = planOut.recommendations.find(
            (r) => r.drugId === 'aspirin' && r.action === 'AVOID'
          );
          if (!avoidAspirin) {
            violations++;
            violationLog.push(`[Ca #${i}] Bệnh nhân AERD nhưng không có cảnh báo AVOID Aspirin/NSAID`);
          }
        }
      }

      // 9. Montelukast phân tầng 3 mức (ASTHMA-R3-R2-08 & ASTHMA-R3-R3-16)
      const montRec = planOut.recommendations.find((r) => r.drugId === 'montelukast');
      if (takingMontelukast && !isUnder12) {
        if (hasPsychRisk) {
          if (!montRec || montRec.action !== 'STOP' || montRec.id !== 'rec_asthma_montelukast_psych_warning') {
            violations++;
            violationLog.push(`[Ca #${i}] Montelukast có nguy cơ tâm thần kinh nhưng không phát STOP (got=${montRec?.action})`);
          }
        } else if ((patient.age ?? 0) <= 14) {
          if (!montRec || montRec.action !== 'REDUCE') {
            violations++;
            violationLog.push(`[Ca #${i}] Montelukast 10 mg ở tuổi ${patient.age} (12–14t) nhưng không phát REDUCE về 5 mg`);
          }
        } else {
          if (!montRec || montRec.action !== 'MONITOR' || montRec.id !== 'rec_asthma_montelukast_boxed_warning_counsel') {
            violations++;
            violationLog.push(`[Ca #${i}] Montelukast ≥ 15t không nguy cơ tâm thần nhưng thiếu MONITOR Boxed Warning`);
          }
        }
      } else if (!takingMontelukast && montRec) {
        violations++;
        violationLog.push(`[Ca #${i}] Không dùng Montelukast nhưng kích hoạt nhầm khuyến cáo ${montRec.id}`);
      }

      // 10. Phụ nữ mang thai (≥ 12t): luôn có MONITOR duy trì ICS và KHÔNG BAO GIỜ hạ bậc
      if (!isUnder12 && isPregnant) {
        const pregRec = planOut.recommendations.find((r) => r.id === 'rec_asthma_pregnancy_ics_safety');
        const stepDownWhenPreg = planOut.recommendations.find((r) => r.id === 'rec_asthma_step_down_consider');
        if (!pregRec || stepDownWhenPreg) {
          violations++;
          violationLog.push(
            `[Ca #${i}] Thai kỳ vi phạm bảo vệ ICS (pregRec: ${Boolean(pregRec)}, stepDown: ${Boolean(stepDownWhenPreg)})`
          );
        }
      }

      // 11. Hạ bậc không mâu thuẫn CONTINUE vs CONSIDER và không hạ bậc khi FEV1 < 60% hoặc có đợt cấp
      const stepDownRec = planOut.recommendations.find((r) => r.id === 'rec_asthma_step_down_consider');
      if (stepDownRec) {
        if ((patient.fev1Pct ?? 100) < lowFev1 || Number(patient.customInputs?.exacerbationsLastYear ?? 0) > 0) {
          violations++;
          violationLog.push(`[Ca #${i}] Sinh hạ bậc dù FEV1=${patient.fev1Pct}% hoặc có đợt cấp năm qua`);
        }
        const contradictoryContinue = planOut.recommendations.find(
          (r) =>
            [
              'budesonide_formoterol',
              'beclometasone_formoterol',
              'fluticasone_salmeterol',
              'fluticasone_vilanterol',
              'mometasone_formoterol',
              'fluticasone_propionate'
            ].includes(r.drugId ?? '') && r.action === 'CONTINUE'
        );
        if (contradictoryContinue) {
          violations++;
          violationLog.push(`[Ca #${i}] Mâu thuẫn hạ bậc (CONSIDER) nhưng thuốc nền vẫn mang action CONTINUE thay vì REDUCE (${contradictoryContinue.id} / ${contradictoryContinue.drugId}) meds=${JSON.stringify(patient.currentMeds?.map((m) => m.drugId))}`);
        }
      }

      // 12. Bậc 5 (ngoài cơn cấp) luôn duy trì thuốc nền ICS-LABA song song với REFER chuyên khoa
      const step5Refer = planOut.recommendations.find((r) => r.id === 'rec_asthma_track1_step5_lama_biologic');
      if (step5Refer && !isOverusedPuffs && !hasOutpatientAcuteAttack) {
        const hasControllerRec = planOut.recommendations.some(
          (r) =>
            [
              'budesonide_formoterol',
              'beclometasone_formoterol',
              'fluticasone_salmeterol',
              'fluticasone_vilanterol',
              'mometasone_formoterol'
            ].includes(r.drugId ?? '') && ['START', 'CONTINUE', 'UPTITRATE', 'REDUCE', 'SWITCH'].includes(r.action)
        );
        if (!hasControllerRec) {
          violations++;
          violationLog.push(`[Ca #${i}] Bậc 5 có REFER chuyên khoa nhưng bị rớt mất thuốc kiểm soát nền ICS-LABA`);
        }
      }

      // 15. Thanh thiếu niên 12–17 tuổi (< 18t) đang dùng Foster (beclometasone_formoterol) luôn bị STOP và không bao giờ được kê Foster (ASTHMA-R3-R1-04)
      if (isAdolescent12To17) {
        const wrongFosterPrescribed = planOut.recommendations.find(
          (r) =>
            r.drugId === 'beclometasone_formoterol' &&
            ['START', 'UPTITRATE', 'CONTINUE', 'SWITCH', 'REDUCE'].includes(r.action)
        );
        if (wrongFosterPrescribed) {
          violations++;
          violationLog.push(`[Ca #${i}] Thanh thiếu niên ${patient.age}t (< 18t) bị kê nhầm Foster (${wrongFosterPrescribed.action})`);
        }
        if (hasFosterInMeds) {
          const stopFoster = planOut.recommendations.find(
            (r) => r.drugId === 'beclometasone_formoterol' && (r.action === 'STOP' || r.action === 'HOLD')
          );
          if (!stopFoster) {
            violations++;
            violationLog.push(`[Ca #${i}] Thanh thiếu niên ${patient.age}t đang dùng Foster nhưng không có STOP`);
          }
        }
      }

      // 16. Theophylline luôn bị STOP (ASTHMA-R3-R1-05)
      if (hasTheophylline) {
        const stopTheo = planOut.recommendations.find((r) => r.drugId === 'theophylline' && r.action === 'STOP');
        if (!stopTheo) {
          violations++;
          violationLog.push(`[Ca #${i}] Đang dùng Theophylline nhưng không có STOP`);
        }
      }

      const inpatientResult = verifyRandomInpatientCase(patient, defaultSettings, isUnder12, paco2Max, i);
      violations += inpatientResult.count;
      violationLog.push(...inpatientResult.log);
    }

    if (violations > 0) {
      console.error('Báo cáo vi phạm an toàn Suite 1:', violationLog.slice(0, 10));
    }
    expect(violations).toBe(0);
  }, 120_000);
});
