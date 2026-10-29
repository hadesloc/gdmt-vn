/**
 * GDMT-VN Module Tăng huyết áp (htn) - Property-Based Safety Invariants (Suite 1: 15.000 Ca)
 * Phân quyền: Agent H (Tim mạch / THA)
 */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../../src/engine/evaluate';
import { normalizePatientUnits } from '../../../src/engine/units';
import { derivePatientData } from '../../../src/engine/derive';
import { htnModule } from '../../../src/modules/htn';
import type { Settings } from '../../../src/engine/types';
import {
  PROFILES,
  defaultSettings,
  generateRandomHtnPatient,
  mulberry32
} from './invariants.helpers';

describe('GDMT-VN Module THA (htn) - Property-Based Safety Invariants Suite 1', () => {
  it(
    'Suite 1: Chạy 15.000 ca ngẫu nhiên đầy đủ trên cả 3 profile và đảm bảo 0 vi phạm bất biến an toàn',
    () => {
      const TOTAL_CASES = 15000;
      const rng = mulberry32(20261027);
      let violations = 0;
      const violationLog: string[] = [];

      const aceiDrugs = ['perindopril', 'enalapril', 'lisinopril', 'ramipril', 'captopril'];
      const arbDrugs = ['losartan', 'valsartan', 'telmisartan', 'irbesartan', 'candesartan'];
      const rasiDrugs = [...aceiDrugs, ...arbDrugs, 'sacubitril_valsartan'];
      const allAntihypertensives = [
        ...rasiDrugs,
        'amlodipine',
        'nifedipine',
        'felodipine',
        'lercanidipine',
        'indapamide',
        'hydrochlorothiazide',
        'chlorthalidone',
        'furosemide',
        'spironolactone',
        'doxazosin',
        'methyldopa',
        'clonidine',
        'moxonidine',
        'bisoprolol',
        'nicardipine',
        'labetalol',
        'nitroglycerin',
        'urapidil',
        'esmolol',
        'sodium_nitroprusside',
        'clevidipine'
      ];

      for (let i = 0; i < TOTAL_CASES; i++) {
        const patient = generateRandomHtnPatient(i, rng);
        const isPregnantSevereCrisis = Boolean(
          patient.conditions?.pregnant && ((patient.sbp ?? 0) >= 160 || (patient.dbp ?? 0) >= 110)
        );
        const isEmergencyCondition = Boolean(
          patient.conditions?.aorticDissection ||
            patient.conditions?.acutePulmonaryEdema ||
            patient.conditions?.acuteAcsWithin24h ||
            patient.conditions?.acuteIschemicStroke ||
            patient.conditions?.acuteIntracerebralHemorrhage ||
            patient.conditions?.severePreeclampsiaEclampsia ||
            isPregnantSevereCrisis ||
            patient.conditions?.hypertensiveEncephalopathy ||
            patient.conditions?.malignantHypertension ||
            patient.conditions?.perioperativeHypertension
        );

        const currentSetting = isEmergencyCondition || rng() < 0.3 ? 'inpatient' : 'outpatient';
        const profile = PROFILES[i % PROFILES.length];
        const settings: Settings = { ...defaultSettings, setting: currentSetting, profile };

        const normalized = normalizePatientUnits(patient, settings.units);
        const derived = derivePatientData(normalized, settings);
        const egfrVal = derived.egfr ?? derived.egfrCr;

        const plan = evaluate(patient, settings, { modules: [htnModule] });
        const medIds = patient.currentMeds.map((m) => m.drugId);
        const hasAcei = medIds.some((id) => aceiDrugs.includes(id));
        const hasArb = medIds.some((id) => arbDrugs.includes(id));

        // 1. BẤT BIẾN 1: CẤM PHỐI HỢP ĐỒNG THỜI ACEi + ARB
        if (hasAcei && hasArb) {
          const banRasiRec = plan.recommendations.find((r) => r.id === 'rec_htn_ban_dual_rasi');
          if (!banRasiRec || banRasiRec.action !== 'STOP') {
            violations++;
            violationLog.push(`Ca ${i}: Đang dùng cả ACEi và ARB nhưng không có rec_htn_ban_dual_rasi STOP!`);
          }
        }

        // 2. BẤT BIẾN 2: THAI KỲ KHÔNG BAO GIỜ START/UPTITRATE/CONTINUE THUỐC ĐỘC THAI (RASi / MRA / THIAZIDE / ATENOLOL / NITROPRUSSIDE)
        if (patient.conditions?.pregnant) {
          const pregnancyForbidden = [
            ...rasiDrugs,
            'spironolactone',
            'eplerenone',
            'indapamide',
            'hydrochlorothiazide',
            'chlorthalidone',
            'atenolol',
            'lercanidipine',
            'moxonidine'
          ];
          const activeTeratogenRec = plan.recommendations.find(
            (r) =>
              r.drugId &&
              pregnancyForbidden.includes(r.drugId) &&
              (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE')
          );
          if (activeTeratogenRec) {
            violations++;
            violationLog.push(
              `Ca ${i}: Phụ nữ mang thai nhưng được chỉ định ${activeTeratogenRec.action} ${activeTeratogenRec.drugId}!`
            );
          }

          const ntpRec = plan.recommendations.find(
            (r) => r.drugId === 'sodium_nitroprusside' && r.action === 'START'
          );
          if (ntpRec) {
            violations++;
            violationLog.push(`Ca ${i}: Phụ nữ có thai nhưng được START Sodium nitroprusside IV!`);
          }
        }

        // 3. BẤT BIẾN 3: KHÔNG BAO GIỜ START SPIRONOLACTONE KHI K+ > 4.5 HOẶC eGFR DƯỚI NGƯỠNG THEO PROFILE (US < 45; INTL/VN < 30)
        const spiroStartRec = plan.recommendations.find(
          (r) => r.drugId === 'spironolactone' && r.action === 'START'
        );
        if (spiroStartRec) {
          if (patient.k !== undefined && patient.k > 4.5) {
            violations++;
            violationLog.push(`Ca ${i}: Spironolactone được START khi K+ = ${patient.k} > 4.5!`);
          }
          const minSpiroEgfr = profile === 'US' ? 45 : 30;
          if (egfrVal !== undefined && egfrVal < minSpiroEgfr) {
            violations++;
            violationLog.push(
              `Ca ${i} [${profile}]: Spironolactone được START khi eGFR = ${egfrVal.toFixed(1)} < ${minSpiroEgfr}!`
            );
          }
        }

        // 4. BẤT BIẾN 4: TIỀN SỬ PHÙ MẠCH KHÔNG START ACEi; K+ > 5.5 KHÔNG START RASi
        if (patient.conditions?.priorAngioedema) {
          const aceiStart = plan.recommendations.find(
            (r) =>
              r.drugId &&
              aceiDrugs.includes(r.drugId) &&
              (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE')
          );
          if (aceiStart) {
            violations++;
            violationLog.push(`Ca ${i}: Tiền sử phù mạch nhưng vẫn ${aceiStart.action} ${aceiStart.drugId}!`);
          }
        }
        if (patient.k !== undefined && patient.k > 5.5) {
          const rasiStart = plan.recommendations.find(
            (r) => r.drugId && rasiDrugs.includes(r.drugId) && (r.action === 'START' || r.action === 'UPTITRATE')
          );
          if (rasiStart) {
            violations++;
            violationLog.push(`Ca ${i}: K+ = ${patient.k} > 5.5 nhưng vẫn ${rasiStart.action} ${rasiStart.drugId}!`);
          }
        }

        // 5. BẤT BIẾN 5: KHÔNG HẠ ÁP TĨNH MẠCH TRONG CƠN THA KHẨN CẤP (URGENCY KHÔNG HMOD)
        if (
          settings.setting === 'inpatient' &&
          ((patient.sbp ?? 0) >= 180 || (patient.dbp ?? 0) >= 120) &&
          !isEmergencyCondition
        ) {
          const ivStart = plan.recommendations.find(
            (r) =>
              r.drugId &&
              ['nicardipine', 'sodium_nitroprusside', 'clevidipine', 'esmolol', 'nitroglycerin', 'labetalol', 'urapidil'].includes(
                r.drugId
              ) &&
              r.action === 'START'
          );
          if (ivStart) {
            violations++;
            violationLog.push(`Ca ${i}: THA khẩn cấp (Urgency) nhưng bị START thuốc tĩnh mạch ${ivStart.drugId}!`);
          }
        }

        // 6. BẤT BIẾN 6: ĐỘT QUỴ THIẾU MÁU NÃO ĐƠN THUẦN KHÔNG TIÊU SỢI HUYẾT DƯỚI NGƯỠNG PERMISSIVE THEO PROFILE: KHÔNG HẠ ÁP IV
        const hasOtherAcuteHmod = Boolean(
          patient.conditions?.aorticDissection ||
            patient.conditions?.acutePulmonaryEdema ||
            patient.conditions?.acuteAcsWithin24h ||
            patient.conditions?.acuteIntracerebralHemorrhage ||
            patient.conditions?.severePreeclampsiaEclampsia ||
            isPregnantSevereCrisis ||
            patient.conditions?.hypertensiveEncephalopathy ||
            patient.conditions?.malignantHypertension ||
            patient.conditions?.perioperativeHypertension
        );
        const underStrokeSbp = profile === 'VN' ? (patient.sbp ?? 0) <= 220 : (patient.sbp ?? 0) < 220;
        const underStrokeDbp =
          profile === 'INTL'
            ? (patient.dbp ?? 0) < 110
            : profile === 'VN'
              ? (patient.dbp ?? 0) <= 120
              : (patient.dbp ?? 0) < 120;
        if (
          settings.setting === 'inpatient' &&
          patient.conditions?.acuteIschemicStroke &&
          !patient.conditions?.thrombolysisEligible &&
          !hasOtherAcuteHmod &&
          underStrokeSbp &&
          underStrokeDbp
        ) {
          const activeLowering = plan.recommendations.find(
            (r) => r.drugId === 'nicardipine' && r.action === 'START'
          );
          if (activeLowering) {
            violations++;
            violationLog.push(
              `Ca ${i} [${profile}]: Đột quỵ thiếu máu não HA ${patient.sbp}/${patient.dbp} dưới ngưỡng permissive bị START Nicardipine IV!`
            );
          }
        }

        // 7. BẤT BIẾN 7: BÓC TÁCH ĐMC CẤP (SBP >= 120 & HR >= 60, không phù phổi cấp) BẮT BUỘC START ESMOLOL; PHÙ PHỔI CẤP CẤM START BB
        if (
          settings.setting === 'inpatient' &&
          patient.conditions?.aorticDissection &&
          !patient.conditions?.acutePulmonaryEdema &&
          (patient.sbp ?? 0) >= 120 &&
          (patient.hr ?? 0) >= 60
        ) {
          const esmololRec = plan.recommendations.find((r) => r.drugId === 'esmolol' && r.action === 'START');
          if (!esmololRec) {
            violations++;
            violationLog.push(
              `Ca ${i}: Bóc tách ĐMC cấp (SBP=${patient.sbp}, HR=${patient.hr}) nhưng không có START Esmolol!`
            );
          }
        }
        if (settings.setting === 'inpatient' && patient.conditions?.acutePulmonaryEdema) {
          const bbStart = plan.recommendations.find(
            (r) =>
              r.drugId &&
              ['bisoprolol', 'esmolol', 'labetalol', 'metoprolol_succinate', 'carvedilol'].includes(r.drugId) &&
              r.action === 'START'
          );
          if (bbStart) {
            violations++;
            violationLog.push(`Ca ${i}: Phù phổi cấp nhưng bị START chẹn beta ${bbStart.drugId}!`);
          }
        }

        // 8. BẤT BIẾN 8: TỤT HUYẾT ÁP (SBP < 90 mmHg) TUYỆT ĐỐI KHÔNG START THUỐC HẠ ÁP
        if (patient.sbp !== undefined && patient.sbp < 90) {
          const anyBpStart = plan.recommendations.find(
            (r) => r.drugId && allAntihypertensives.includes(r.drugId) && r.action === 'START'
          );
          if (anyBpStart) {
            violations++;
            violationLog.push(
              `Ca ${i}: Bệnh nhân tụt huyết áp (SBP=${patient.sbp} < 90) nhưng vẫn START ${anyBpStart.drugId}!`
            );
          }
        }

        // 9. BẤT BIẾN 9: SUY THẬN NẶNG (eGFR < 30) KHÔNG BAO GIỜ START INDAPAMIDE / HCTZ / LERCANIDIPINE / MOXONIDINE; SUY TIM CẤM MOXONIDINE
        if (egfrVal !== undefined && egfrVal < 30) {
          const renalForbiddenStart = plan.recommendations.find(
            (r) =>
              r.drugId &&
              ['indapamide', 'hydrochlorothiazide', 'lercanidipine', 'moxonidine'].includes(r.drugId) &&
              (r.action === 'START' || r.action === 'UPTITRATE' || r.action === 'CONTINUE')
          );
          if (renalForbiddenStart) {
            violations++;
            violationLog.push(
              `Ca ${i}: eGFR = ${egfrVal.toFixed(1)} < 30 nhưng vẫn ${renalForbiddenStart.action} ${renalForbiddenStart.drugId}!`
            );
          }
        }
        if (patient.conditions?.hf) {
          const moxRec = plan.recommendations.find(
            (r) => r.drugId === 'moxonidine' && (r.action === 'START' || r.action === 'CONTINUE')
          );
          if (moxRec) {
            violations++;
            violationLog.push(`Ca ${i}: Suy tim nhưng vẫn ${moxRec.action} Moxonidine (chống chỉ định MOXCON)!`);
          }
        }

        // 10. BẤT BIẾN 10: ĐANG DÙNG PDE-5i (SILDENAFIL/TADALAFIL/VARDENAFIL) TUYỆT ĐỐI KHÔNG START NITROGLYCERIN
        if (medIds.some((id) => ['sildenafil', 'tadalafil', 'vardenafil', 'avanafil'].includes(id))) {
          const ntgStart = plan.recommendations.find(
            (r) => r.drugId === 'nitroglycerin' && r.action === 'START'
          );
          if (ntgStart) {
            violations++;
            violationLog.push(`Ca ${i}: Đang dùng PDE-5i nhưng vẫn START Nitroglycerin!`);
          }
        }
      }

      if (violations > 0) {
        console.error(`Phát hiện ${violations} vi phạm bất biến:\n` + violationLog.slice(0, 15).join('\n'));
      }

      expect(violations).toBe(0);
    },
    60000
  );
});
