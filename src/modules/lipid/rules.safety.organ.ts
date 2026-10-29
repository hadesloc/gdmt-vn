/**
 * GDMT-VN Lipid Module - Hepatic & Gallbladder Organ Safety Rules
 * Phân quyền: Agent I3 / Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { thFor } from '../../kb-types';
import {
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  findRawMedsWithComponent,
  getActiveFibrateMatches,
  getActiveStatin,
  hasMed
} from './helpers';

export const lipidOrganSafetyRules: Rule[] = [
  {
    id: 'lipid.safety.alt_elevation',
    module: 'lipid',
    nameVi: 'Tăng ALT ≥ 3x ULN / bệnh gan cấp / Child-Pugh B–C: Tạm ngưng hoặc tránh Statin',
    citationIds: [
      'esc.lipid.2019.monitoring_alt_elevation',
      'esc.lipid.2019.pregnancy_all_llt_contra',
      'acc.lipid.2026.chronic_stable_liver_cor2a'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && safety.hasSevereAlt;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const activeStatin = getActiveStatin(ctx);
      const altLimit = thFor('altulntimes', 'lipid.safety.alt_uln_elevation');
      const recheckMinW = thFor('interval_weeks', 'lipid.monitoring.weeks_min');
      const recheckMaxW = thFor('interval_weeks', 'lipid.monitoring.alt_recheck_max_weeks');
      let unbundle = '';
      if (activeStatin?.isFdc) {
        const matches = findRawMedsWithComponent(ctx, activeStatin.drugId);
        if (matches[0]) {
          unbundle = ` ${buildFdcUnbundleGuidanceVi(matches[0], new Set([activeStatin.drugId, 'ezetimibe', 'bempedoic_acid', 'fenofibrate']))}`;
        }
      }
      return {
        id: activeStatin ? 'rec_lipid_alt_hold' : 'rec_lipid_alt_avoid',
        module: 'lipid',
        tier: 'An toàn gan mật',
        tierOrder: 1,
        action: activeStatin ? 'HOLD' : 'AVOID',
        drugId: activeStatin ? activeStatin.rawDrugId : 'atorvastatin',
        drugNameVi: activeStatin?.displayName,
        title: activeStatin
          ? `Tạm ngưng ${activeStatin.displayName} do ALT ≥ ${altLimit}x ULN hoặc suy gan mất bù (Child-Pugh B–C / bệnh gan cấp)`
          : `Chống chỉ định / Hoãn khởi trị Statin do ALT ≥ ${altLimit}x ULN hoặc suy gan mất bù (Child-Pugh B–C / bệnh gan cấp)`,
        rationale:
          `ALT ≥ ${altLimit}x ULN, bệnh gan hoạt động tiến triển hoặc xơ gan mất bù (Child-Pugh B–C) yêu cầu tạm ngưng hoặc không khởi trị statin; kiểm tra lại men gan sau ${recheckMinW}–${recheckMaxW} tuần và tìm nguyên nhân gan mật.${unbundle}`,
        gates: [
          {
            parameter: 'altUlnTimes',
            passed: false,
            action: activeStatin ? 'hold' : 'contra',
            value: safety.altUln ?? safety.childPughClass ?? undefined,
            threshold: altLimit,
            messageVi: `ALT ≥ ${altLimit}x ULN hoặc suy gan tiến triển / Child-Pugh B–C`
          }
        ],
        citationIds: [
          'esc.lipid.2019.monitoring_alt_elevation',
          'esc.lipid.2019.pregnancy_all_llt_contra',
          'acc.lipid.2026.chronic_stable_liver_cor2a'
        ],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.alt_hold_fenofibrate',
    module: 'lipid',
    nameVi: 'Tăng ALT ≥ 3x ULN / bệnh gan / xơ gan mọi mức độ: Ngưng Fibrate',
    citationIds: ['acc.lipid.2026.fenofibrate_renal', 'esc.lipid.2019.monitoring_alt_elevation'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || getActiveFibrateMatches(ctx).length === 0) return false;
      if (safety.onDialysis || safety.hasSevereCkd) return false;
      return safety.hasSevereAlt || safety.hasCirrhosisAny;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const fibMatch = getActiveFibrateMatches(ctx)[0]; // qa-allow: index - Thuoc fibrate dau tien dang dung
      if (!fibMatch) return null;
      const altLimit = thFor('altulntimes', 'lipid.safety.alt_uln_elevation');
      const unbundle = buildFdcUnbundleGuidanceVi(fibMatch, new Set(['fenofibrate', 'gemfibrozil']));
      return {
        id: 'rec_lipid_alt_hold_fenofibrate',
        module: 'lipid',
        tier: 'An toàn gan mật',
        tierOrder: 1,
        action: 'STOP',
        drugId: fibMatch.rawDrugId,
        drugNameVi: fibMatch.displayName,
        title: `Ngừng ${fibMatch.displayName} do bệnh gan, xơ gan hoặc ALT ≥ ${altLimit}x ULN`,
        rationale:
          `Nhóm Fibrate chống chỉ định ở mọi mức độ xơ gan (kể cả Child-Pugh A/B/C), bệnh gan hoạt động hoặc tăng transaminase (ALT ≥ ${altLimit}x ULN); bắt buộc ngưng thuốc và đánh giá gan mật.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'altUlnTimes',
            passed: false,
            action: 'contra',
            value: safety.altUln ?? safety.childPughClass ?? undefined,
            threshold: altLimit,
            messageVi: `Bệnh gan / xơ gan hoặc ALT ≥ ${altLimit}x ULN: ngưng ${fibMatch.displayName}`
          }
        ],
        citationIds: ['acc.lipid.2026.fenofibrate_renal', 'esc.lipid.2019.monitoring_alt_elevation'],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.gallbladder_stop_fibrate',
    module: 'lipid',
    nameVi: 'Bệnh túi mật / sỏi mật đã biết: Chống chỉ định và ngừng Fibrate',
    citationIds: [
      'acc.lipid.2026.fibrate_gallbladder_contra',
      'fda.ezetimibe.fenofibrate_cholelithiasis'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.onDialysis || safety.hasSevereCkd) return false;
      if (safety.hasSevereAlt || safety.hasCirrhosisAny) return false;
      return safety.hasGallbladderContra && getActiveFibrateMatches(ctx).length > 0;
    },
    produce: (ctx) => {
      const fibMatch = getActiveFibrateMatches(ctx)[0]; // qa-allow: index - Thuoc fibrate dau tien dang dung
      if (!fibMatch) return null;
      const unbundle = buildFdcUnbundleGuidanceVi(fibMatch, new Set(['fenofibrate', 'gemfibrozil']));
      return {
        id: 'rec_lipid_gallbladder_stop_fibrate',
        module: 'lipid',
        tier: 'An toàn gan mật',
        tierOrder: 0,
        action: 'STOP',
        drugId: fibMatch.rawDrugId,
        drugNameVi: fibMatch.displayName,
        title: `Ngừng ngay ${fibMatch.displayName} do chống chỉ định ở bệnh nhân có bệnh túi mật / sỏi mật`,
        rationale:
          `Fibrate làm tăng bài tiết cholesterol vào dịch mật gây sỏi mật và viêm túi mật cấp, chống chỉ định tuyệt đối ở bệnh nhân đã có bệnh túi mật hoặc sỏi mật; ưu tiên chuyển sang Omega-3 liều cao nếu cần hạ TG.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'gallbladderDisease',
            passed: false,
            action: 'contra',
            messageVi: 'Sỏi mật / bệnh túi mật đã biết: chống chỉ định Fibrate'
          }
        ],
        citationIds: [
          'acc.lipid.2026.fibrate_gallbladder_contra',
          'fda.ezetimibe.fenofibrate_cholelithiasis'
        ],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.alt_hold_ezetimibe',
    module: 'lipid',
    nameVi: 'Tăng ALT ≥ 3x ULN / suy gan Child-Pugh B–C: Tạm ngưng Ezetimibe',
    citationIds: [
      'fda.ezetimibe.hepatic_child_pugh',
      'acc.lipid.2026.ezetimibe_hepatic_avoid',
      'esc.lipid.2019.monitoring_alt_elevation'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || !safety.hasSevereAlt || !hasMed(ctx, 'ezetimibe')) return false;
      const ezeMatches = findRawMedsWithComponent(ctx, 'ezetimibe');
      const activeStatin = getActiveStatin(ctx);
      return ezeMatches.some((m) => m.rawDrugId !== activeStatin?.rawDrugId);
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const activeStatin = getActiveStatin(ctx);
      const ezeMatch = findRawMedsWithComponent(ctx, 'ezetimibe').find(
        (m) => m.rawDrugId !== activeStatin?.rawDrugId
      );
      if (!ezeMatch) return null;
      const altLimit = thFor('altulntimes', 'lipid.safety.alt_uln_elevation');
      return {
        id: 'rec_lipid_alt_hold_ezetimibe',
        module: 'lipid',
        tier: 'An toàn gan mật',
        tierOrder: 1,
        action: 'HOLD',
        drugId: ezeMatch.rawDrugId,
        drugNameVi: ezeMatch.displayName,
        title: `Tạm ngưng ${ezeMatch.displayName} do ALT ≥ ${altLimit}x ULN hoặc suy gan vừa – nặng (Child-Pugh B–C)`,
        rationale:
          `Ezetimibe không được khuyến cáo ở suy gan vừa – nặng (Child-Pugh B–C) hoặc tăng men gan cấp ALT ≥ ${altLimit}x ULN do tăng phơi nhiễm toàn thân.`,
        gates: [
          {
            parameter: 'altUlnTimes',
            passed: false,
            action: 'hold',
            value: safety.altUln ?? safety.childPughClass ?? undefined,
            threshold: altLimit,
            messageVi: `Suy gan Child-Pugh B–C hoặc ALT ≥ ${altLimit}x ULN: tạm ngưng Ezetimibe`
          }
        ],
        citationIds: [
          'fda.ezetimibe.hepatic_child_pugh',
          'acc.lipid.2026.ezetimibe_hepatic_avoid',
          'esc.lipid.2019.monitoring_alt_elevation'
        ],
        priority: 97
      };
    }
  },

  {
    id: 'lipid.safety.alt_hold_bempedoic',
    module: 'lipid',
    nameVi: 'Tăng ALT ≥ 3x ULN / suy gan Child-Pugh B–C: Tạm ngưng Bempedoic acid',
    citationIds: ['esc.lipid.2019.monitoring_alt_elevation', 'fda.bempedoic.dose'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && safety.hasSevereAlt && hasMed(ctx, 'bempedoic_acid');
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0]; // qa-allow: index - Thuoc bempedoic dau tien dang dung
      const altLimit = thFor('altulntimes', 'lipid.safety.alt_uln_elevation');
      const targetId = bempMatch ? bempMatch.rawDrugId : 'bempedoic_acid';
      const disp = bempMatch ? bempMatch.displayName : 'Bempedoic acid';
      return {
        id: 'rec_lipid_alt_hold_bempedoic',
        module: 'lipid',
        tier: 'An toàn gan mật',
        tierOrder: 1,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: disp,
        title: `Tạm ngưng ${disp} do ALT ≥ ${altLimit}x ULN hoặc suy gan mất bù (Child-Pugh B–C)`,
        rationale: `Tạm ngưng ${disp} khi men gan tăng ≥ ${altLimit}x ULN hoặc suy gan vừa – nặng (Child-Pugh B–C) do thuốc hoạt hóa qua gan và chưa được kiểm định an toàn ở suy gan nặng.`,
        gates: [
          {
            parameter: 'altUlnTimes',
            passed: false,
            action: 'hold',
            value: safety.altUln ?? safety.childPughClass ?? undefined,
            threshold: altLimit,
            messageVi: `ALT ≥ ${altLimit}x ULN hoặc Child-Pugh B–C: tạm ngưng ${disp}`
          }
        ],
        citationIds: ['esc.lipid.2019.monitoring_alt_elevation', 'fda.bempedoic.dose'],
        priority: 97
      };
    }
  }
];
