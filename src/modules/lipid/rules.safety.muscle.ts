/**
 * GDMT-VN Lipid Module - Muscle, Tendon & Acute Gout Safety Rules
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
  hasLipidFlag,
  hasMed
} from './helpers';

export const lipidMuscleSafetyRules: Rule[] = [
  {
    id: 'lipid.safety.ck_rhabdomyolysis_risk',
    module: 'lipid',
    nameVi: 'CK ≥ 10x ULN (nghi tiêu cơ vân): Ngừng khẩn cấp hoặc tránh Statin',
    citationIds: ['esc.lipid.2019.monitoring_ck_10x_stop'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && safety.hasRhabdoRiskCk;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const activeStatin = getActiveStatin(ctx);
      const ckRhabdo = thFor('ckulntimes', 'lipid.safety.ck_uln_rhabdomyolysis');
      const recheckWeeks = thFor('interval_weeks', 'lipid.monitoring.ck_rhabdo_weeks');
      let unbundle = '';
      if (activeStatin?.isFdc) {
        const m = findRawMedsWithComponent(ctx, activeStatin.drugId)[0]; // qa-allow: index - Lay FDC chua statin
        if (m) {
          unbundle = ` ${buildFdcUnbundleGuidanceVi(m, new Set([activeStatin.drugId, 'fenofibrate']))}`;
        }
      }
      return {
        id: activeStatin ? 'rec_lipid_ck_rhabdo_stop' : 'rec_lipid_ck_rhabdo_avoid',
        module: 'lipid',
        tier: 'Cảnh báo tiêu cơ vân',
        tierOrder: 0,
        action: activeStatin ? 'STOP' : 'AVOID',
        drugId: activeStatin ? activeStatin.rawDrugId : 'atorvastatin',
        drugNameVi: activeStatin?.displayName,
        title: activeStatin
          ? `Ngừng ngay ${activeStatin.displayName} do CK ≥ ${ckRhabdo}x ULN (nguy cơ tiêu cơ vân cấp)`
          : `Chống chỉ định khởi trị Statin do CK ≥ ${ckRhabdo}x ULN`,
        rationale:
          `CK ≥ ${ckRhabdo}x ULN báo động nguy cơ tiêu cơ vân và suy thận cấp; ngừng ngay statin, bù dịch và theo dõi CK mỗi ${recheckWeeks} tuần.${unbundle}`,
        gates: [
          {
            parameter: 'ckUlnTimes',
            passed: false,
            action: 'contra',
            value: safety.ckUln,
            threshold: ckRhabdo,
            messageVi: `CK ≥ ${ckRhabdo}x ULN: nguy cơ tiêu cơ vân cấp`
          }
        ],
        citationIds: ['esc.lipid.2019.monitoring_ck_10x_stop'],
        priority: 99
      };
    }
  },

  {
    id: 'lipid.safety.ck_rhabdomyolysis_stop_fenofibrate',
    module: 'lipid',
    nameVi: 'CK ≥ 10x ULN (nghi tiêu cơ vân): Ngừng khẩn cấp Fibrate',
    citationIds: ['esc.lipid.2019.monitoring_ck_10x_stop', 'acc.lipid.2026.fenofibrate_renal'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return (
        !safety.isReproContra &&
        safety.hasRhabdoRiskCk &&
        getActiveFibrateMatches(ctx).length > 0
      );
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const fibMatch = getActiveFibrateMatches(ctx)[0]; // qa-allow: index - Thuoc fibrate dau tien dang dung
      if (!fibMatch) return null;
      const ckRhabdo = thFor('ckulntimes', 'lipid.safety.ck_uln_rhabdomyolysis');
      const unbundle = buildFdcUnbundleGuidanceVi(fibMatch, new Set(['fenofibrate', 'gemfibrozil', 'pravastatin', 'simvastatin']));
      return {
        id: 'rec_lipid_ck_rhabdo_stop_feno',
        module: 'lipid',
        tier: 'Cảnh báo tiêu cơ vân',
        tierOrder: 0,
        action: 'STOP',
        drugId: fibMatch.rawDrugId,
        drugNameVi: fibMatch.displayName,
        title: `Ngừng ngay ${fibMatch.displayName} do CK ≥ ${ckRhabdo}x ULN (nguy cơ tiêu cơ vân cấp)`,
        rationale:
          `Khi CK ≥ ${ckRhabdo}x ULN, bắt buộc ngừng ngay ${fibMatch.displayName} và kiểm tra chức năng thận khẩn cấp.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'ckUlnTimes',
            passed: false,
            action: 'contra',
            value: safety.ckUln,
            threshold: ckRhabdo,
            messageVi: `CK ≥ ${ckRhabdo}x ULN: ngừng ngay ${fibMatch.displayName}`
          }
        ],
        citationIds: ['esc.lipid.2019.monitoring_ck_10x_stop', 'acc.lipid.2026.fenofibrate_renal'],
        priority: 99
      };
    }
  },

  {
    id: 'lipid.safety.ck_rhabdomyolysis_refer',
    module: 'lipid',
    nameVi: 'CK ≥ 10x ULN: Chuyển cấp cứu bù dịch và bảo vệ thận',
    citationIds: ['esc.lipid.2019.monitoring_ck_10x_stop'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      return !safety.isReproContra && safety.hasRhabdoRiskCk;
    },
    produce: () => {
      const ckRhabdo = thFor('ckulntimes', 'lipid.safety.ck_uln_rhabdomyolysis');
      const recheckWeeks = thFor('interval_weeks', 'lipid.monitoring.ck_rhabdo_weeks');
      return {
        id: 'rec_lipid_ck_rhabdo_refer',
        module: 'lipid',
        tier: 'Xử trí cấp cứu tiêu cơ vân',
        tierOrder: 0,
        action: 'REFER',
        title: `Đánh giá cấp cứu tiêu cơ vân, bù dịch và theo dõi chức năng thận (CK ≥ ${ckRhabdo}x ULN)`,
        rationale:
          `Khi CK ≥ ${ckRhabdo}x ULN, đánh giá khẩn myoglobin niệu, điện giải đồ, creatinine huyết thanh, bù dịch tích cực và kiểm tra lại CK mỗi ${recheckWeeks} tuần.`,
        gates: [],
        citationIds: ['esc.lipid.2019.monitoring_ck_10x_stop'],
        priority: 99
      };
    }
  },

  {
    id: 'lipid.safety.ck_moderate_elevation',
    module: 'lipid',
    nameVi: 'CK > 4x đến < 10x ULN: Tạm ngưng hoặc hoãn Statin',
    citationIds: ['esc.lipid.2019.monitoring_ck_high'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || !safety.hasModerateCk) return false;
      return getActiveStatin(ctx) !== null || getActiveFibrateMatches(ctx).length === 0;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const activeStatin = getActiveStatin(ctx);
      const ckMod = thFor('ckulntimes', 'lipid.safety.ck_uln_elevation');
      const ckRhabdo = thFor('ckulntimes', 'lipid.safety.ck_uln_rhabdomyolysis');
      const minW = thFor('interval_weeks', 'lipid.monitoring.ck_rhabdo_weeks');
      const maxW = thFor('interval_weeks', 'lipid.monitoring.alt_recheck_max_weeks');
      let unbundle = '';
      if (activeStatin?.isFdc) {
        const m = findRawMedsWithComponent(ctx, activeStatin.drugId)[0]; // qa-allow: index - Lay FDC chua statin
        if (m) {
          unbundle = ` ${buildFdcUnbundleGuidanceVi(m, new Set([activeStatin.drugId, 'fenofibrate']))}`;
        }
      }
      return {
        id: activeStatin ? 'rec_lipid_ck_mod_hold' : 'rec_lipid_ck_mod_defer',
        module: 'lipid',
        tier: 'An toàn cơ xương',
        tierOrder: 1,
        action: activeStatin ? 'HOLD' : 'DEFER',
        drugId: activeStatin ? activeStatin.rawDrugId : 'atorvastatin',
        drugNameVi: activeStatin?.displayName,
        title: activeStatin
          ? `Tạm ngưng ${activeStatin.displayName} do CK > ${ckMod}x ULN (chưa tới ${ckRhabdo}x ULN)`
          : `Trì hoãn khởi trị Statin do CK > ${ckMod}x ULN`,
        rationale:
          `CK > ${ckMod}x ULN yêu cầu hoãn/tạm ngưng statin, loại trừ vận động nặng hoặc suy giáp và xét nghiệm lại CK sau ${minW}–${maxW} tuần.${unbundle}`,
        gates: [
          {
            parameter: 'ckUlnTimes',
            passed: false,
            action: 'hold',
            value: safety.ckUln,
            threshold: ckMod,
            messageVi: `CK > ${ckMod}x ULN: tạm ngưng / trì hoãn statin`
          }
        ],
        citationIds: ['esc.lipid.2019.monitoring_ck_high'],
        priority: 95
      };
    }
  },

  {
    id: 'lipid.safety.ck_hold_fenofibrate',
    module: 'lipid',
    nameVi: 'CK > 4x đến < 10x ULN: Tạm ngưng Fibrate',
    citationIds: ['esc.lipid.2019.monitoring_ck_high', 'acc.lipid.2026.fenofibrate_renal'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || getActiveFibrateMatches(ctx).length === 0) return false;
      return !(safety.onDialysis || safety.hasSevereCkd) && safety.hasModerateCk;
    },
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const fibMatch = getActiveFibrateMatches(ctx)[0]; // qa-allow: index - Thuoc fibrate dau tien dang dung
      if (!fibMatch) return null;
      const ckMod = thFor('ckulntimes', 'lipid.safety.ck_uln_elevation');
      const minW = thFor('interval_weeks', 'lipid.monitoring.ck_rhabdo_weeks');
      const maxW = thFor('interval_weeks', 'lipid.monitoring.alt_recheck_max_weeks');
      return {
        id: 'rec_lipid_ck_mod_hold_feno',
        module: 'lipid',
        tier: 'An toàn cơ xương',
        tierOrder: 1,
        action: 'HOLD',
        drugId: fibMatch.rawDrugId,
        drugNameVi: fibMatch.displayName,
        title: `Tạm ngưng ${fibMatch.displayName} do tăng men cơ CK > ${ckMod}x ULN`,
        rationale:
          `${fibMatch.displayName} trực tiếp gây nguy cơ bệnh cơ và tiêu cơ vân; khi CK > ${ckMod}x ULN, tạm ngưng thuốc, kiểm tra chức năng thận, TSH và xét nghiệm lại CK sau ${minW}–${maxW} tuần.`,
        gates: [
          {
            parameter: 'ckUlnTimes',
            passed: false,
            action: 'hold',
            value: safety.ckUln,
            threshold: ckMod,
            messageVi: `CK > ${ckMod}x ULN: tạm ngưng ${fibMatch.displayName}`
          }
        ],
        citationIds: ['esc.lipid.2019.monitoring_ck_high', 'acc.lipid.2026.fenofibrate_renal'],
        priority: 96
      };
    }
  },

  {
    id: 'lipid.safety.bempedoic_tendon_stop',
    module: 'lipid',
    nameVi: 'Đứt gân hoặc tiền sử tổn thương gân: Ngừng ngay Bempedoic acid',
    citationIds: ['fda.bempedoic.tendon_rupture', 'esc.lipid.2025.bempedoic_statin_intolerance'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasSevereAlt) return false;
      return hasLipidFlag(ctx, 'tendonRuptureHistory') && hasMed(ctx, 'bempedoic_acid');
    },
    produce: (ctx) => {
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0]; // qa-allow: index - Thuoc bempedoic dau tien dang dung
      const targetId = bempMatch ? bempMatch.rawDrugId : 'bempedoic_acid';
      const disp = bempMatch ? bempMatch.displayName : 'Bempedoic acid';
      const unbundle = bempMatch ? buildFdcUnbundleGuidanceVi(bempMatch, new Set(['bempedoic_acid'])) : '';
      return {
        id: 'rec_lipid_bempedoic_tendon_stop',
        module: 'lipid',
        tier: 'An toàn cơ xương – gân',
        tierOrder: 0,
        action: 'STOP',
        drugId: targetId,
        drugNameVi: disp,
        title: `Ngừng ngay ${disp} do đứt gân hoặc tiền sử tổn thương gân`,
        rationale:
          `Bempedoic acid liên quan đến nguy cơ đứt gân (gân Achille, chóp xoay vai, cơ nhị đầu); bắt buộc ngừng ngay lập tức khi có tổn thương/đứt gân hoặc tránh tiếp tục ở người có tiền sử đứt gân và chuyển sang Ezetimibe / thuốc ức chế PCSK9.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'tendonRuptureHistory',
            passed: false,
            action: 'contra',
            messageVi: 'Đứt gân / tiền sử bệnh lý gân nặng: ngừng ngay Bempedoic acid'
          }
        ],
        citationIds: ['fda.bempedoic.tendon_rupture', 'esc.lipid.2025.bempedoic_statin_intolerance'],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.bempedoic_gout_hold',
    module: 'lipid',
    nameVi: 'Bệnh gút / cơn gút cấp đang dùng Bempedoic acid: Tạm hoãn hoặc đổi thuốc',
    citationIds: ['fda.bempedoic.hyperuricemia', 'fda.bempedoic.gout_risk'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (safety.isReproContra || safety.hasSevereAlt || hasLipidFlag(ctx, 'tendonRuptureHistory')) {
        return false;
      }
      return hasLipidFlag(ctx, 'gout') && hasMed(ctx, 'bempedoic_acid');
    },
    produce: (ctx) => {
      const bempMatch = findRawMedsWithComponent(ctx, 'bempedoic_acid')[0]; // qa-allow: index - Thuoc bempedoic dau tien dang dung
      const targetId = bempMatch ? bempMatch.rawDrugId : 'bempedoic_acid';
      const disp = bempMatch ? bempMatch.displayName : 'Bempedoic acid';
      const unbundle = bempMatch ? buildFdcUnbundleGuidanceVi(bempMatch, new Set(['bempedoic_acid'])) : '';
      return {
        id: 'rec_lipid_bempedoic_gout_hold',
        module: 'lipid',
        tier: 'An toàn chuyển hóa – Gút',
        tierOrder: 1,
        action: 'HOLD',
        drugId: targetId,
        drugNameVi: disp,
        title: `Tạm ngưng / Cân nhắc đổi ${disp} do bệnh nhân có bệnh Gút (nguy cơ tăng acid uric và bùng phát gút cấp)`,
        rationale:
          `Bempedoic acid ức chế OAT2 tại ống thận làm tăng nồng độ acid uric máu và thúc đẩy cơn gút cấp; khuyến cáo tạm ngưng khi bùng phát gút cấp, kiểm tra acid uric máu và ưu tiên chuyển sang Ezetimibe đơn chất hoặc thuốc ức chế PCSK9.` +
          (unbundle ? ` ${unbundle}` : ''),
        gates: [
          {
            parameter: 'gout',
            passed: false,
            action: 'hold',
            messageVi: 'Tiền sử / cơn Gút: Bempedoic acid làm tăng acid uric và khởi phát gút cấp'
          }
        ],
        citationIds: ['fda.bempedoic.hyperuricemia', 'fda.bempedoic.gout_risk'],
        priority: 94
      };
    }
  }
];
