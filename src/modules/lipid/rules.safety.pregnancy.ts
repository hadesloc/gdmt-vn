/**
 * GDMT-VN Lipid Module - Pregnancy, Lactation & Preconception Safety Rules
 * Phân quyền: Agent I5 (Round 3 Remediation — split from rules.safety.organ.ts)
 */

import type { Rule } from '../../engine/types';
import { need } from '../../engine/require';
import { thFor } from '../../kb-types';
import {
  ALL_LIPID_COMPONENT_IDS,
  BILE_ACID_SEQUESTRANT_IDS,
  assessStatinSafety,
  buildFdcUnbundleGuidanceVi,
  expandLipidMedComponents,
  formatTg,
  getLipidDrugDisplayName,
  hasAscvdEquivalent,
  hasClinicalFh,
  type RawMedMatch
} from './helpers';

interface ReproBlockedEntry {
  rawDrugId: string;
  displayName: string;
  comps: string[];
  unbundleNote: string;
}

function getReproBlockedActiveMeds(ctx: Parameters<Rule['when']>[0]): ReproBlockedEntry[] {
  const out: ReproBlockedEntry[] = [];
  const blockedSet = new Set(
    Array.from(ALL_LIPID_COMPONENT_IDS).filter((c) => !BILE_ACID_SEQUESTRANT_IDS.has(c))
  );

  for (const med of ctx.patient.currentMeds || []) {
    if (!med) continue;
    const comps = expandLipidMedComponents(med);
    const unsafe = comps.filter((c) => blockedSet.has(c));
    if (unsafe.length === 0) continue;
    const rawDrugId = (med.drugId || '').trim().toLowerCase() || unsafe[0];
    if (out.some((x) => x.rawDrugId === rawDrugId)) continue;
    const displayName = getLipidDrugDisplayName(rawDrugId, med.name);
    const matchObj: RawMedMatch = {
      med,
      rawDrugId,
      canonicalDrugId: rawDrugId,
      componentId: unsafe[0],
      displayName,
      isFdc: comps.length > 1,
      allComponents: comps,
      safeCompanions: comps.filter((c) => !blockedSet.has(c))
    };
    out.push({
      rawDrugId,
      displayName,
      comps,
      unbundleNote: buildFdcUnbundleGuidanceVi(matchObj, blockedSet)
    });
  }
  return out;
}

export const lipidPregnancySafetyRules: Rule[] = [
  {
    id: 'lipid.safety.pregnancy',
    module: 'lipid',
    nameVi: 'Thai kỳ / cho con bú / dự định mang thai: Ngừng và tránh thuốc hạ lipid máu',
    citationIds: [
      'esc.lipid.2019.pregnancy_all_llt_contra',
      'esc.lipid.2024.ccs_pregnancy',
      'acc.lipid.2026.pregnancy_stop_1_2_months',
      'acc.lipid.2026.pregnancy_hofh_apheresis',
      'acc.lipid.2026.pregnancy_htg_fibrate_t2',
      'acc.lipid.2026.lactation_fibrate_5days',
      'acc.lipid.2026.bas_safe_pregnancy_lactation',
      'acc.lipid.2026.bas_tg_300_contra'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => assessStatinSafety(ctx).isReproContra,
    produce: (ctx) => {
      const safety = assessStatinSafety(ctx);
      const activeBlocked = getReproBlockedActiveMeds(ctx);
      const firstEntry = activeBlocked[0]; // qa-allow: index - Phan tu dau tien trong danh sach thuoc ha lipid can ngung
      const isStopping = Boolean(firstEntry);
      const primaryDrug = firstEntry ? firstEntry.rawDrugId : 'atorvastatin';
      const label = firstEntry ? firstEntry.displayName : 'Statin / thuốc hạ lipid đường uống';
      const washoutDays = thFor('interval_days', 'lipid.lactation.fibrate_washout_days');
      const stopMinM = thFor('interval_months', 'lipid.pregnancy.preconception_stop_min_months');
      const stopMaxM = thFor('interval_months', 'lipid.pregnancy.preconception_stop_max_months');
      const tg = need(ctx, 'tg');
      const tgBasLimit = thFor('tg', 'lipid.tg.bas_caution');
      const tgHighForBas = tg !== undefined && tg >= tgBasLimit;

      const stateLabel = safety.isPregnant
        ? 'đang mang thai'
        : safety.isBreastfeeding
          ? 'đang cho con bú'
          : `dự định mang thai trong ${stopMinM}–${stopMaxM} tháng tới`;

      const basGuidance = tgHighForBas
        ? `Lưu ý TG hiện tại (${formatTg(tg, ctx)}) vượt ngưỡng an toàn nên KHÔNG dùng nhựa gắn acid mật do nguy cơ làm tăng vọt TG và viêm tụy cấp.`
        : 'Nếu cần kiểm soát tăng LDL-C nặng trong thai kỳ/cho con bú và TG không tăng cao, nhựa gắn acid mật (như colesevelam) không hấp thu toàn thân có thể cân nhắc dưới giám sát chuyên khoa.';

      return {
        id: isStopping ? `rec_lipid_pregnancy_stop_${primaryDrug}` : 'rec_lipid_pregnancy_contra',
        module: 'lipid',
        tier: 'An toàn thai kỳ & Cho con bú',
        tierOrder: 0,
        action: isStopping ? 'STOP' : 'AVOID',
        drugId: primaryDrug,
        drugNameVi: firstEntry?.displayName,
        title: isStopping
          ? `Ngừng ngay ${label} do bệnh nhân ${stateLabel}`
          : `Chống chỉ định khởi trị Statin và thuốc hạ lipid chuẩn khi ${stateLabel}`,
        rationale:
          `Statin, ezetimibe, bempedoic acid, fibrate, icosapent ethyl và thuốc nhắm đích PCSK9 chống chỉ định hoặc phải ngừng trước tối thiểu ${stopMinM}–${stopMaxM} tháng khi dự định mang thai, ngừng ngay khi phát hiện có thai và tránh dùng trong thời kỳ cho con bú ` +
          `(nếu có dùng fibrate, không cho con bú trong suốt thời gian điều trị và tối thiểu ${washoutDays} ngày sau liều cuối). ${basGuidance}` +
          (firstEntry?.unbundleNote ? ` ${firstEntry.unbundleNote}` : ''),
        gates: [
          {
            parameter: safety.isPregnant
              ? 'pregnant'
              : safety.isBreastfeeding
                ? 'breastfeeding'
                : 'planningPregnancy',
            passed: false,
            action: 'contra',
            messageVi: `Bệnh nhân ${stateLabel}: chống chỉ định thuốc hạ lipid chuẩn`
          }
        ],
        citationIds: [
          'esc.lipid.2019.pregnancy_all_llt_contra',
          'esc.lipid.2024.ccs_pregnancy',
          'acc.lipid.2026.pregnancy_stop_1_2_months',
          'acc.lipid.2026.lactation_fibrate_5days',
          'acc.lipid.2026.bas_safe_pregnancy_lactation',
          'acc.lipid.2026.bas_tg_300_contra'
        ],
        priority: 100
      };
    }
  },

  ...[1, 2, 3].map(
    (slotIdx): Rule => ({
      id: `lipid.safety.pregnancy_extra_${slotIdx}`,
      module: 'lipid',
      nameVi: `Thai kỳ / cho con bú: Ngừng thuốc hạ lipid phối hợp thứ ${slotIdx + 1}`,
      citationIds: [
        'esc.lipid.2019.pregnancy_all_llt_contra',
        'esc.lipid.2024.ccs_pregnancy',
        'acc.lipid.2026.pregnancy_stop_1_2_months',
        'acc.lipid.2026.lactation_fibrate_5days'
      ],
      setting: 'both',
      profiles: ['INTL', 'VN', 'US'],
      when: (ctx) =>
        assessStatinSafety(ctx).isReproContra && getReproBlockedActiveMeds(ctx).length > slotIdx,
      produce: (ctx) => {
        const safety = assessStatinSafety(ctx);
        const entry = getReproBlockedActiveMeds(ctx)[slotIdx];
        if (!entry) return null;
        const washoutDays = thFor('interval_days', 'lipid.lactation.fibrate_washout_days');
        const hasFibrateComp = entry.comps.includes('fenofibrate') || entry.comps.includes('gemfibrozil');
        const stateLabel = safety.isPregnant
          ? 'đang mang thai'
          : safety.isBreastfeeding
            ? 'đang cho con bú'
            : 'dự định mang thai';

        return {
          id: `rec_lipid_pregnancy_stop_${entry.rawDrugId}`,
          module: 'lipid',
          tier: 'An toàn thai kỳ & Cho con bú',
          tierOrder: 0,
          action: 'STOP',
          drugId: entry.rawDrugId,
          drugNameVi: entry.displayName,
          title: `Ngừng ngay ${entry.displayName} do bệnh nhân ${stateLabel}`,
          rationale:
            (hasFibrateComp
              ? `Ngừng ngay ${entry.displayName} khi ${stateLabel}; nếu đang nuôi con bằng sữa mẹ, chỉ cho trẻ bú lại sau tối thiểu ${washoutDays} ngày kể từ liều fibrate cuối cùng.`
              : `Ngừng ngay thuốc hạ lipid máu đang dùng (${entry.displayName}) khi ${stateLabel}.`) +
            (entry.unbundleNote ? ` ${entry.unbundleNote}` : ''),
          gates: [
            {
              parameter: safety.isPregnant ? 'pregnant' : 'breastfeeding',
              passed: false,
              action: 'contra',
              messageVi: `Bắt buộc ngừng ${entry.displayName}`
            }
          ],
          citationIds: [
            'esc.lipid.2019.pregnancy_all_llt_contra',
            'esc.lipid.2024.ccs_pregnancy',
            'acc.lipid.2026.pregnancy_stop_1_2_months',
            'acc.lipid.2026.lactation_fibrate_5days'
          ],
          priority: 100
        };
      }
    })
  ),

  {
    id: 'lipid.safety.pregnancy_refer_hofh_ascvd',
    module: 'lipid',
    nameVi: 'Thai kỳ kèm HoFH / FH / ASCVD nguy cơ rất cao: Chuyển chuyên khoa Tim mạch - Sản khoa',
    citationIds: [
      'acc.lipid.2026.pregnancy_hofh_apheresis',
      'acc.lipid.2026.bas_safe_pregnancy_lactation',
      'acc.lipid.2026.bas_tg_300_contra'
    ],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (!safety.isPregnant && !safety.isBreastfeeding) return false;
      const ldl = need(ctx, 'ldl');
      const ldlSevere = thFor('ldl', 'lipid.target.ldl_severe_elevation');
      return (
        hasAscvdEquivalent(ctx) ||
        hasClinicalFh(ctx) ||
        (ldl !== undefined && ldl >= ldlSevere)
      );
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg');
      const tgBasLimit = thFor('tg', 'lipid.tg.bas_caution');
      const canConsiderBas = tg === undefined || tg < tgBasLimit;
      return {
        id: 'rec_lipid_pregnancy_refer_hofh_ascvd',
        module: 'lipid',
        tier: 'Hội chẩn chuyên khoa Thai kỳ nguy cơ cao',
        tierOrder: 0,
        action: 'REFER',
        title: 'Chuyển hội chẩn chuyên khoa Tim mạch – Sản khoa / Mỡ máu (ASCVD hoặc FH trong thai kỳ / cho con bú)',
        rationale:
          'Bệnh nhân mang thai hoặc cho con bú kèm ASCVD hoặc tăng cholesterol máu gia đình (FH/HoFH) cần quản lý đa chuyên khoa: cân nhắc lọc lipoprotein apheresis ở HoFH/ASCVD rất nặng' +
          (canConsiderBas
            ? ' hoặc cân nhắc nhựa gắn acid mật (colesevelam) nếu TG dưới ngưỡng chống chỉ định và theo dõi sát hấp thu vitamin tan trong dầu (vitamin K / INR).'
            : '; tránh dùng nhựa gắn acid mật do TG hiện tại đã tăng cao.'),
        gates: [],
        citationIds: [
          'acc.lipid.2026.pregnancy_hofh_apheresis',
          'acc.lipid.2026.bas_safe_pregnancy_lactation',
          'acc.lipid.2026.bas_tg_300_contra'
        ],
        priority: 99
      };
    }
  },

  {
    id: 'lipid.safety.pregnancy_refer_severe_htg',
    module: 'lipid',
    nameVi: 'Thai kỳ kèm tăng Triglyceride rất nặng: Chuyển chuyên khoa phòng ngừa viêm tụy cấp thai kỳ',
    citationIds: ['acc.lipid.2026.pregnancy_htg_fibrate_t2', 'acc.lipid.2026.lactation_fibrate_5days'],
    setting: 'both',
    profiles: ['INTL', 'VN', 'US'],
    when: (ctx) => {
      const safety = assessStatinSafety(ctx);
      if (!safety.isPregnant) return false;
      const tg = need(ctx, 'tg');
      const tgPanc = thFor('tg', 'lipid.tg.pancreatitis_risk');
      return tg !== undefined && tg >= tgPanc;
    },
    produce: (ctx) => {
      const tg = need(ctx, 'tg')!;
      const washoutDays = thFor('interval_days', 'lipid.lactation.fibrate_washout_days');
      return {
        id: 'rec_lipid_pregnancy_refer_htg',
        module: 'lipid',
        tier: 'Hội chẩn chuyên khoa Thai kỳ nguy cơ cao',
        tierOrder: 0,
        action: 'REFER',
        title: `Chuyển hội chẩn chuyên khoa khẩn do tăng Triglyceride rất nặng trong thai kỳ (${formatTg(tg, ctx)})`,
        rationale:
          `Tăng TG rất cao trong thai kỳ làm tăng vọt nguy cơ viêm tụy cấp đe dọa tính mạng mẹ và thai: cần chế độ ăn tiết chế mỡ nghiêm ngặt, axit béo omega-3 tinh khiết, hội chẩn chuyên khoa cân nhắc fenofibrate từ sau tam cá nguyệt thứ 2 nếu lợi ích vượt nguy cơ (ngừng cho con bú tối thiểu ${washoutDays} ngày sau liều cuối) hoặc lọc huyết tương nếu dọa viêm tụy cấp.`,
        gates: [],
        citationIds: ['acc.lipid.2026.pregnancy_htg_fibrate_t2', 'acc.lipid.2026.lactation_fibrate_5days'],
        priority: 99
      };
    }
  }
];
