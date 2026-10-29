/**
 * GDMT-VN Lipid Module - Medication Reconciliation, Allergy, Duplicates & BAS Safety Rules
 * Phân quyền: Agent I5 (Round 3 Remediation)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  BILE_ACID_SEQUESTRANT_IDS,
  PCSK9_DRUG_IDS,
  STATIN_DRUG_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  expandLipidMedComponents,
  findRawMedsWithComponent,
  formatTg,
  getActiveFibrateMatches,
  getActiveStatin,
  getActiveStatins,
  getDuplicateStatinLosers,
  getLipidDrugDisplayName,
  hasLipidDrugAllergy,
  hasLipidFlag,
  hasMed,
  type RawMedMatch
} from './helpers';

const BAS_INTERACTING_MED_SET = new Set([
  'warfarin',
  'acenocoumarol',
  'levothyroxine',
  'digoxin',
  'furosemide',
  'hydrochlorothiazide',
  'indapamide',
  'glimepiride',
  'gliclazide',
  'glibenclamide',
  'mycophenolate',
  'ezetimibe',
  'atorvastatin',
  'rosuvastatin',
  'simvastatin',
  'pravastatin',
  'pitavastatin',
  'fluvastatin',
  'lovastatin'
]);

function getAllergicActiveLipidMeds(ctx: Parameters<Rule['when']>[0]): RawMedMatch[] {
  const out: RawMedMatch[] = [];
  for (const med of ctx.patient.currentMeds || []) {
    if (!med) continue;
    const rawDrugId = (med.drugId || '').trim().toLowerCase();
    if (!rawDrugId) continue;
    const comps = expandLipidMedComponents(med);
    const allergicComps = comps.filter((c) => hasLipidDrugAllergy(ctx, c));
    if (allergicComps.length === 0 && !hasLipidDrugAllergy(ctx, rawDrugId)) continue;
    if (out.some((x) => x.rawDrugId === rawDrugId)) continue;
    const primaryComp = allergicComps[0] || comps[0] || rawDrugId; // qa-allow: index - Thanh phan gay di ung dau tien
    out.push({
      med,
      rawDrugId,
      canonicalDrugId: rawDrugId,
      componentId: primaryComp,
      displayName: getLipidDrugDisplayName(rawDrugId, med.name),
      isFdc: comps.length > 1,
      allComponents: comps,
      safeCompanions: comps.filter((c) => !hasLipidDrugAllergy(ctx, c))
    });
  }
  return out;
}

function getActiveBasMatches(ctx: Parameters<Rule['when']>[0]): RawMedMatch[] {
  const out: RawMedMatch[] = [];
  for (const id of BILE_ACID_SEQUESTRANT_IDS) {
    for (const m of findRawMedsWithComponent(ctx, id)) {
      if (!out.some((x) => x.rawDrugId === m.rawDrugId)) out.push(m);
    }
  }
  return out;
}

function getDuplicatePcsk9Losers(ctx: Parameters<Rule['when']>[0]): RawMedMatch[] {
  const matches: RawMedMatch[] = [];
  for (const med of ctx.patient.currentMeds || []) {
    if (!med) continue;
    const comps = expandLipidMedComponents(med);
    const pcsk9Comp = comps.find((c) => PCSK9_DRUG_IDS.has(c));
    if (!pcsk9Comp) continue;
    const rawDrugId = (med.drugId || '').trim().toLowerCase() || pcsk9Comp;
    if (matches.some((x) => x.rawDrugId === rawDrugId)) continue;
    matches.push({
      med,
      rawDrugId,
      canonicalDrugId: pcsk9Comp,
      componentId: pcsk9Comp,
      displayName: getLipidDrugDisplayName(rawDrugId, med.name),
      isFdc: comps.length > 1,
      allComponents: comps,
      safeCompanions: []
    });
  }
  if (matches.length < 2) return []; // qa-allow: index - Kiem tra trung lap >= 2 thuoc PCSK9
  const sorted = [...matches].sort((a, b) => {
    const aAllergy = hasLipidDrugAllergy(ctx, a.rawDrugId) ? 1 : 0;
    const bAllergy = hasLipidDrugAllergy(ctx, b.rawDrugId) ? 1 : 0;
    return aAllergy - bAllergy;
  });
  return sorted.slice(1);
}

export const lipidReconcileSafetyRules: Rule[] = [
  ...[0, 1].map(
    (slotIdx): Rule => ({
      id: slotIdx === 0 ? 'lipid.safety.drug_allergy_stop' : `lipid.safety.drug_allergy_stop_${slotIdx}`,
      module: 'lipid',
      nameVi: 'Dị ứng / Quá mẫn thuốc đang dùng: Ngừng ngay hoạt chất hoặc viên phối hợp chứa dị nguyên',
      citationIds: ['esc.lipid.2019.monitoring_alt_elevation', 'acc.lipid.2026.ezetimibe_hepatic_avoid'],
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) =>
        !assessStatinSafety(ctx).isReproContra && getAllergicActiveLipidMeds(ctx).length > slotIdx,
      produce: (ctx) => {
        const match = getAllergicActiveLipidMeds(ctx)[slotIdx];
        if (!match) return null;
        const blocked = new Set(match.allComponents.filter((c) => hasLipidDrugAllergy(ctx, c)));
        if (blocked.size === 0) blocked.add(match.componentId);
        const unbundle = buildFdcUnbundleGuidanceVi(match, blocked);
        return {
          id: `rec_lipid_allergy_stop_${match.rawDrugId}`,
          module: 'lipid',
          tier: 'Cảnh báo Dị ứng / Quá mẫn thuốc',
          tierOrder: 0,
          action: 'STOP',
          drugId: match.rawDrugId,
          drugNameVi: match.displayName,
          title: `Ngừng ngay ${match.displayName} do tiền sử dị ứng / quá mẫn với thuốc`,
          rationale:
            `Bệnh nhân có tiền sử dị ứng đặc hiệu với ${getLipidDrugDisplayName(match.componentId)}; chống chỉ định tiếp tục sử dụng ${match.displayName} và cần chuyển sang hoạt chất hạ lipid khác nhóm an toàn.` +
            (unbundle ? ` ${unbundle}` : ''),
          gates: [
            {
              parameter: 'allergies',
              passed: false,
              action: 'contra',
              messageVi: `Tiền sử dị ứng với ${match.displayName}`
            }
          ],
          citationIds: ['esc.lipid.2019.monitoring_alt_elevation', 'acc.lipid.2026.ezetimibe_hepatic_avoid'],
          priority: 99
        };
      }
    })
  ),

  ...[0, 1].map(
    (slotIdx): Rule => ({
      id:
        slotIdx === 0
          ? 'lipid.safety.intolerance_stop_active_statin'
          : `lipid.safety.intolerance_stop_active_statin_${slotIdx}`,
      module: 'lipid',
      nameVi: 'Không dung nạp Statin hoàn toàn: Ngừng Statin (hoặc tách FDC chứa Statin) đang còn trong toa',
      citationIds: ['esc.lipid.2025.bempedoic_statin_intolerance', 'esc.lipid.2019.ezetimibe_add_on'],
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        if (!hasLipidFlag(ctx, 'statinIntolerance')) return false;
        const safety = assessStatinSafety(ctx);
        if (
          safety.isReproContra ||
          safety.hasSevereAlt ||
          safety.hasRhabdoRiskCk ||
          safety.hasModerateCk
        ) {
          return false;
        }
        return getActiveStatins(ctx).length > slotIdx;
      },
      produce: (ctx) => {
        const st = getActiveStatins(ctx)[slotIdx];
        if (!st) return null;
        let unbundle = '';
        if (st.isFdc) {
          const m = findRawMedsWithComponent(ctx, st.drugId).find((x) => x.rawDrugId === st.rawDrugId);
          if (m) unbundle = ` ${buildFdcUnbundleGuidanceVi(m, STATIN_DRUG_IDS)}`;
        }
        return {
          id:
            slotIdx === 0
              ? 'rec_lipid_intolerance_stop_statin'
              : `rec_lipid_intolerance_stop_statin_${st.rawDrugId}`,
          module: 'lipid',
          tier: 'Xử trí không dung nạp Statin',
          tierOrder: 1,
          action: 'STOP',
          drugId: st.rawDrugId,
          drugNameVi: st.displayName,
          title: `Ngừng ${st.displayName} đang còn trong đơn do đã xác nhận không dung nạp Statin hoàn toàn`,
          rationale:
            `Bệnh nhân đã được ghi nhận không dung nạp statin hoàn toàn; cần ngừng statin trong toa nền và chuyển sang phác đồ không statin (Ezetimibe, Bempedoic acid hoặc thuốc nhắm đích PCSK9).${unbundle}`,
          gates: [],
          citationIds: ['esc.lipid.2025.bempedoic_statin_intolerance', 'esc.lipid.2019.ezetimibe_add_on'],
          priority: 94
        };
      }
    })
  ),

  ...[0, 1, 2].map(
    (loserIdx): Rule => ({
      id:
        loserIdx === 0
          ? 'lipid.safety.duplicate_statin_stop'
          : `lipid.safety.duplicate_statin_stop_${loserIdx + 1}`,
      module: 'lipid',
      nameVi: 'Trùng lặp nhiều thuốc nhóm Statin: Ngừng toàn bộ Statin dư thừa',
      citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.ezetimibe_add_on'],
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) => {
        const safety = assessStatinSafety(ctx);
        if (safety.isReproContra || hasLipidFlag(ctx, 'statinIntolerance')) return false;
        return getDuplicateStatinLosers(ctx).length > loserIdx;
      },
      produce: (ctx) => {
        const keeper = getActiveStatin(ctx);
        const loser = getDuplicateStatinLosers(ctx)[loserIdx];
        if (!keeper || !loser) return null;
        let unbundle = '';
        if (loser.isFdc) {
          const m = findRawMedsWithComponent(ctx, loser.drugId).find((x) => x.rawDrugId === loser.rawDrugId);
          if (m) unbundle = ` ${buildFdcUnbundleGuidanceVi(m, STATIN_DRUG_IDS)}`;
        }
        return {
          id: `rec_lipid_duplicate_statin_stop_${loser.rawDrugId}`,
          module: 'lipid',
          tier: 'An toàn trùng lặp nhóm thuốc',
          tierOrder: 0,
          action: 'STOP',
          drugId: loser.rawDrugId,
          drugNameVi: loser.displayName,
          title: `Ngừng ngay ${loser.displayName} do trùng lặp ≥ 2 thuốc nhóm Statin trong phác đồ`,
          rationale:
            `Không phối hợp đồng thời nhiều thuốc nhóm statin do tăng vọt nguy cơ bệnh cơ và tiêu cơ vân cấp mà không tăng lợi ích lâm sàng; ngừng ${loser.displayName} và chỉ duy trì tối đa 1 statin phù hợp (${keeper.displayName}).${unbundle}`,
          gates: [],
          citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.ezetimibe_add_on'],
          priority: 98
        };
      }
    })
  ),

  ...[0, 1].map(
    (loserIdx): Rule => ({
      id:
        loserIdx === 0
          ? 'lipid.safety.duplicate_pcsk9_stop'
          : `lipid.safety.duplicate_pcsk9_stop_${loserIdx + 1}`,
      module: 'lipid',
      nameVi: 'Trùng lặp thuốc nhắm đích PCSK9: Ngừng thuốc PCSK9 dư thừa',
      citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary'],
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) =>
        !assessStatinSafety(ctx).isReproContra && getDuplicatePcsk9Losers(ctx).length > loserIdx,
      produce: (ctx) => {
        const loser = getDuplicatePcsk9Losers(ctx)[loserIdx];
        if (!loser) return null;
        return {
          id: `rec_lipid_duplicate_pcsk9_stop_${loser.rawDrugId}`,
          module: 'lipid',
          tier: 'An toàn trùng lặp nhóm thuốc',
          tierOrder: 0,
          action: 'STOP',
          drugId: loser.rawDrugId,
          drugNameVi: loser.displayName,
          title: `Ngừng ngay ${loser.displayName} do trùng lặp nhiều thuốc nhắm đích PCSK9`,
          rationale:
            'Không phối hợp đồng thời kháng thể đơn dòng PCSK9 (Evolocumab/Alirocumab) với nhau hoặc với siRNA PCSK9 (Inclisiran) do trùng cơ chế sinh học và không có lợi ích cộng thêm.',
          gates: [],
          citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary'],
          priority: 98
        };
      }
    })
  ),

  {
    id: 'lipid.safety.duplicate_fibrate_stop',
    module: 'lipid',
    nameVi: 'Trùng lặp ≥ 2 thuốc nhóm Fibrate: Ngừng Fibrate dư thừa',
    citationIds: ['acc.lipid.2026.fenofibrate_dose_range'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      !assessStatinSafety(ctx).isReproContra && getActiveFibrateMatches(ctx).length >= 2, // qa-allow: index - Kiem tra trung lap >= 2 thuoc fibrate
    produce: (ctx) => {
      const fibs = getActiveFibrateMatches(ctx);
      const gem = fibs.find((f) => f.componentId === 'gemfibrozil');
      const loser = gem || fibs[1]; // qa-allow: index - Uu tien ngung gemfibrozil hoac fibrate thu 2
      if (!loser) return null;
      return {
        id: `rec_lipid_duplicate_fibrate_stop_${loser.rawDrugId}`,
        module: 'lipid',
        tier: 'An toàn trùng lặp nhóm thuốc',
        tierOrder: 0,
        action: 'STOP',
        drugId: loser.rawDrugId,
        drugNameVi: loser.displayName,
        title: `Ngừng ngay ${loser.displayName} do trùng lặp 2 thuốc nhóm Fibrate`,
        rationale:
          'Chống chỉ định dùng đồng thời 2 thuốc nhóm Fibrate do tăng mạnh nguy cơ tiêu cơ vân cấp, độc tính gan và sỏi mật.',
        gates: [],
        citationIds: ['acc.lipid.2026.fenofibrate_dose_range'],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.duplicate_omega3_stop',
    module: 'lipid',
    nameVi: 'Trùng lặp Icosapent ethyl và Omega-3 hỗn hợp: Ngừng chế phẩm Omega-3 hỗn hợp dư thừa',
    citationIds: ['esc.lipid.2019.htg_icosapent_ethyl', 'acc.lipid.2026.icosapent_dose'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) =>
      !assessStatinSafety(ctx).isReproContra &&
      hasMed(ctx, 'icosapent_ethyl') &&
      hasMed(ctx, 'omega3'),
    produce: (ctx) => {
      const om3 = findRawMedsWithComponent(ctx, 'omega3')[0]; // qa-allow: index - Che pham omega-3 hon hop can ngung
      if (!om3) return null;
      return {
        id: `rec_lipid_duplicate_omega3_stop_${om3.rawDrugId}`,
        module: 'lipid',
        tier: 'An toàn trùng lặp nhóm thuốc',
        tierOrder: 1,
        action: 'STOP',
        drugId: om3.rawDrugId,
        drugNameVi: om3.displayName,
        title: `Ngừng ${om3.displayName} do đang dùng đồng thời với Icosapent ethyl tinh khiết`,
        rationale:
          'Không phối hợp đồng thời Icosapent ethyl (EPA tinh khiết liều cao) với chế phẩm Omega-3 hỗn hợp EPA/DHA để tránh quá liều axit béo omega-3 và tăng nguy cơ rung nhĩ / chảy máu.',
        gates: [],
        citationIds: ['esc.lipid.2019.htg_icosapent_ethyl', 'acc.lipid.2026.icosapent_dose'],
        priority: 92
      };
    }
  },

  {
    id: 'lipid.safety.bas_htg_contra_stop',
    module: 'lipid',
    nameVi: 'Nhựa gắn acid mật kèm tăng Triglyceride nặng (≥ 5.6 mmol/L hoặc tiền sử viêm tụy): Ngừng ngay BAS',
    citationIds: ['acc.lipid.2026.bas_tg_300_contra'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (!safety.hasBileAcidSequestrant) return false;
      if (safety.hasAcutePancreatitis) return true;
      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      const tgPanc = thFor('tg', 'lipid.tg.pancreatitis_risk');
      const tgBas = thFor('tg', 'lipid.tg.bas_caution');
      return tg >= tgPanc || (tg >= tgBas && hasLipidFlag(ctx, 'historyPancreatitis'));
    },
    produce: (ctx) => {
      const bas = getActiveBasMatches(ctx)[0]; // qa-allow: index - Thuoc BAS dau tien dang dung
      if (!bas) return null;
      const tg = need(ctx, 'tg');
      const tgPanc = thFor('tg', 'lipid.tg.pancreatitis_risk');
      return {
        id: `rec_lipid_bas_htg_stop_${bas.rawDrugId}`,
        module: 'lipid',
        tier: 'An toàn nhựa gắn acid mật (BAS)',
        tierOrder: 0,
        action: 'STOP',
        drugId: bas.rawDrugId,
        drugNameVi: bas.displayName,
        title: `Ngừng ngay ${bas.displayName} do chống chỉ định ở tăng Triglyceride nặng / nguy cơ viêm tụy cấp`,
        rationale:
          `Nhựa gắn acid mật (cholestyramine, colesevelam, colestipol) làm tăng tổng hợp VLDL tại gan, gây tăng vọt nồng độ triglyceride và thúc đẩy viêm tụy cấp; chống chỉ định khi TG rất cao` +
          (tg !== undefined ? ` (hiện tại ${formatTg(tg, ctx)})` : '') +
          ' hoặc có tiền sử viêm tụy do tăng TG.',
        gates: [
          {
            parameter: 'tg',
            passed: false,
            action: 'contra',
            value: tg,
            threshold: tgPanc,
            messageVi: 'Tăng TG rất cao / tiền sử viêm tụy cấp: chống chỉ định nhựa gắn acid mật'
          }
        ],
        citationIds: ['acc.lipid.2026.bas_tg_300_contra'],
        priority: 98
      };
    }
  },

  {
    id: 'lipid.safety.bas_htg_moderate_hold',
    module: 'lipid',
    nameVi: 'Nhựa gắn acid mật kèm TG ≥ 3.4 mmol/L (≥ 300 mg/dL): Tạm ngưng / tránh dùng BAS',
    citationIds: ['acc.lipid.2026.bas_tg_300_contra'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (!safety.hasBileAcidSequestrant || safety.hasAcutePancreatitis) return false;
      const tg = need(ctx, 'tg');
      if (tg === undefined) return false;
      const tgPanc = thFor('tg', 'lipid.tg.pancreatitis_risk');
      const tgBas = thFor('tg', 'lipid.tg.bas_caution');
      return tg >= tgBas && tg < tgPanc && !hasLipidFlag(ctx, 'historyPancreatitis');
    },
    produce: (ctx) => {
      const bas = getActiveBasMatches(ctx)[0]; // qa-allow: index - Thuoc BAS dau tien dang dung
      if (!bas) return null;
      const tg = need(ctx, 'tg')!;
      const tgBas = thFor('tg', 'lipid.tg.bas_caution');
      return {
        id: `rec_lipid_bas_htg_hold_${bas.rawDrugId}`,
        module: 'lipid',
        tier: 'An toàn nhựa gắn acid mật (BAS)',
        tierOrder: 1,
        action: 'HOLD',
        drugId: bas.rawDrugId,
        drugNameVi: bas.displayName,
        title: `Tạm ngưng / Đổi ${bas.displayName} do Triglyceride tăng cao (${formatTg(tg, ctx)})`,
        rationale:
          `Khi TG từ mức ≥ ${formatTg(tgBas, ctx)} trở lên, nhựa gắn acid mật có thể làm TG tăng nặng hơn và khởi phát viêm tụy cấp; cần tạm ngưng/tránh dùng và kiểm soát TG trước.`,
        gates: [
          {
            parameter: 'tg',
            passed: false,
            action: 'hold',
            value: tg,
            threshold: tgBas,
            messageVi: 'TG ≥ 300 mg/dL (3.4 mmol/L): thận trọng / tạm ngưng nhựa gắn acid mật'
          }
        ],
        citationIds: ['acc.lipid.2026.bas_tg_300_contra'],
        priority: 93
      };
    }
  },

  {
    id: 'lipid.safety.bas_spacing_monitor',
    module: 'lipid',
    nameVi: 'Nhựa gắn acid mật dùng kèm thuốc đường uống khác: Giãn cách giờ uống chống giảm hấp thu',
    citationIds: ['esc.lipid.2019.bas_spacing_4h_before_1h_after'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (!safety.hasBileAcidSequestrant || safety.hasAcutePancreatitis) return false;
      const tg = need(ctx, 'tg');
      const tgBas = thFor('tg', 'lipid.tg.bas_caution');
      if (tg !== undefined && tg >= tgBas) return false;
      return Array.from(BAS_INTERACTING_MED_SET).some((id) => hasMed(ctx, id));
    },
    produce: (ctx) => {
      const bas = getActiveBasMatches(ctx)[0]; // qa-allow: index - Thuoc BAS dau tien dang dung
      if (!bas) return null;
      return {
        id: 'rec_lipid_bas_absorption_spacing',
        module: 'lipid',
        tier: 'Tương tác hấp thu đường tiêu hóa',
        tierOrder: 3,
        action: 'MONITOR',
        title: `Giãn cách thời điểm uống thuốc nền với ${bas.displayName} (uống trước 4 giờ hoặc sau 1–4 giờ)`,
        rationale:
          `Nhựa gắn acid mật (${bas.displayName}) gắn kết tại ruột làm giảm mạnh hấp thu của statin, ezetimibe, levothyroxine, warfarin/acenocoumarol, digoxin, lợi tiểu thiazide/quai và sulfonylurea; hướng dẫn bệnh nhân uống các thuốc dùng kèm ít nhất 4 giờ trước hoặc 1–4 giờ sau liều nhựa gắn acid mật (và theo dõi sát INR / TSH nếu có warfarin / levothyroxine).`,
        gates: [],
        citationIds: ['esc.lipid.2019.bas_spacing_4h_before_1h_after'],
        priority: 68
      };
    }
  }
];
