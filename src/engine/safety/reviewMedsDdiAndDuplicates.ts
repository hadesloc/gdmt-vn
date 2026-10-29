/**
 * GDMT-VN Safety - Fail-Closed Dose Cap & Multi-Drug Duplicate Class Stop Helpers
 * Phân quyền: Agent B
 */

import type { Patient, CurrentMed, Recommendation, ModuleId } from '../types';
import {
  parseDailyDoseMg,
  parseComponentDailyDoseMg
} from '../doseParser';
import { expandDrugComponents, isFdcDrug } from './fdcMap';
import {
  resolveKbDrugId,
  getNormalizedDrugClasses,
  STATIN_POTENCY_RANK,
  isOphthalmicBetaBlocker
} from './drugClassify';

/**
 * Tương thích ngược với `parseDoseMg`:
 * - Nếu truyền `CurrentMed`, sử dụng bộ phân tích liều hàng ngày fail-closed (`parseDailyDoseMg`).
 * - Nếu truyền `string | number`, chỉ trích xuất khi không chứa đơn vị đếm mơ hồ (`viên`, `ống`, `nhát`, `gói`, `bút`).
 */
export function parseDoseMg(medOrDose?: CurrentMed | string | number): number | undefined {
  if (medOrDose === undefined || medOrDose === null) return undefined;
  if (typeof medOrDose === 'object') {
    return parseDailyDoseMg(medOrDose);
  }
  if (typeof medOrDose === 'number') {
    return Number.isFinite(medOrDose) && medOrDose > 0 ? medOrDose : undefined;
  }
  const s = String(medOrDose).trim();
  if (!s) return undefined;
  if (/(?:viên|vien|tab|tablet|caps|ống|ong|amp|vial|bút|but|pen|nhát|nhat|puff|gói|goi)/i.test(s) && !/\b(?:mg|mcg|µg|ug|g)\b/i.test(s)) {
    return undefined;
  }
  return parseDailyDoseMg({ drugId: '', dose: s });
}

function isLowDoseAspirinMed(med: CurrentMed): boolean {
  const resolved = resolveKbDrugId(med.drugId);
  if (resolved !== 'aspirin' && resolved !== 'acetylsalicylic_acid') return false;
  const daily = parseDailyDoseMg(med);
  if (daily !== undefined) return daily <= 162;
  const raw = `${med.dose || ''} ${med.name || ''}`;
  const m = raw.match(/(\d+(?:[.,]\d+)?)\s*mg/i);
  if (m) return parseFloat(m[1].replace(',', '.')) <= 162;
  return true;
}

interface ExclusiveDuplicateGroupSpec {
  key: string;
  module: ModuleId;
  tier: string;
  titleGroupVi: string;
  rationaleVi: string;
  citationIds: string[];
  matchMed: (med: CurrentMed, resolvedId: string, classes: Set<string>) => boolean;
  scoreMed?: (med: CurrentMed, resolvedId: string) => number;
}

const EXCLUSIVE_ACTIVE_MED_GROUPS: ExclusiveDuplicateGroupSpec[] = [
  {
    key: 'duplicate_statin',
    module: 'lipid',
    tier: 'Chống trùng lặp nhóm Statin',
    titleGroupVi: 'nhóm Statin',
    rationaleVi:
      'Phối hợp đồng thời ≥ 2 thuốc nhóm Statin làm tăng vọt nguy cơ bệnh cơ và tiêu cơ vân cấp tính mà không tăng thêm hiệu quả hạ LDL-C.',
    citationIds: ['esc.lipid.2019.statin_high_dose_rec', 'esc.lipid.2019.ezetimibe_add_on'],
    matchMed: (_m, _r, cls) => cls.has('statin'),
    scoreMed: (m, resolved) => {
      const comps = expandDrugComponents(resolved);
      const statinComp = comps.find((c) => STATIN_POTENCY_RANK[c] !== undefined) || resolved;
      const potency = STATIN_POTENCY_RANK[statinComp] ?? 0;
      const mg = parseComponentDailyDoseMg(m, statinComp) ?? parseDailyDoseMg(m) ?? 0;
      return potency * 1000 + mg;
    }
  },
  {
    key: 'duplicate_respiratory_biologic',
    module: 'copd',
    tier: 'Chống trùng lặp thuốc sinh học hô hấp',
    titleGroupVi: 'thuốc sinh học kháng thể đơn dòng đường hô hấp',
    rationaleVi:
      'Không phối hợp đồng thời ≥ 2 kháng thể đơn dòng đường hô hấp (Dupilumab, Mepolizumab, Benralizumab, Omalizumab, Tezepelumab) do thiếu dữ liệu an toàn và nguy cơ ức chế miễn dịch chồng chéo.',
    citationIds: ['gold.copd.2026.biologics_dupilumab_mepolizumab', 'gina.asthma.2026.step5_biologics'],
    matchMed: (_m, resolved, cls) =>
      cls.has('respiratory_biologic') ||
      ['dupilumab', 'mepolizumab', 'benralizumab', 'omalizumab', 'tezepelumab'].includes(resolved)
  },
  {
    key: 'duplicate_nsaid',
    module: 'gout',
    tier: 'Chống trùng lặp nhóm NSAID',
    titleGroupVi: 'thuốc kháng viêm không steroid (NSAID)',
    rationaleVi:
      'Chống chỉ định dùng đồng thời ≥ 2 thuốc NSAID (kể cả NSAID cổ điển phối hợp COX-2i) do tăng gấp bội nguy cơ xuất huyết tiêu hóa, suy thận cấp và biến cố tim mạch.',
    citationIds: ['kdigo.ckd.2024.nsaid_nephrotoxicity_p132', 'eular.gout.2016.colchicine_nsaid_contra'],
    matchMed: (m, _r, cls) => cls.has('nsaid') && !isLowDoseAspirinMed(m)
  },
  {
    key: 'duplicate_xoi',
    module: 'gout',
    tier: 'Chống trùng lặp ức chế Xanthine Oxidase',
    titleGroupVi: 'thuốc ức chế Xanthine Oxidase (Allopurinol / Febuxostat)',
    rationaleVi:
      'Chống chỉ định phối hợp đồng thời Allopurinol và Febuxostat do trùng cơ chế ức chế xanthine oxidase và tăng nguy cơ độc tính nặng.',
    citationIds: ['acr.gout.2020.switch_second_xoi', 'acr.gout.2020.allopurinol_first_line'],
    matchMed: (_m, _r, cls) => cls.has('xoi')
  },
  {
    key: 'duplicate_uricosuric',
    module: 'gout',
    tier: 'Chống trùng lặp nhóm Uricosuric',
    titleGroupVi: 'thuốc tăng thải acid uric niệu (Uricosuric)',
    rationaleVi:
      'Không phối hợp đồng thời ≥ 2 thuốc nhóm uricosuric (Probenecid + Benzbromarone) do nguy cơ kết tinh sỏi urat cấp tính và suy thận cấp.',
    citationIds: ['acr.gout.2020.allopurinol_first_line', 'eular.gout.2016.benzbromarone_hepatic_spc'],
    matchMed: (_m, _r, cls) => cls.has('uricosuric')
  },
  {
    key: 'duplicate_fibrate',
    module: 'lipid',
    tier: 'Chống trùng lặp nhóm Fibrate',
    titleGroupVi: 'nhóm Fibrate',
    rationaleVi:
      'Chống chỉ định dùng đồng thời ≥ 2 thuốc nhóm Fibrate do tăng mạnh nguy cơ tiêu cơ vân cấp, độc tính gan và sỏi mật.',
    citationIds: ['acc.lipid.2026.fenofibrate_dose_range'],
    matchMed: (_m, _r, cls) => cls.has('fibrate')
  },
  {
    key: 'duplicate_pcsk9',
    module: 'lipid',
    tier: 'Chống trùng lặp thuốc nhắm đích PCSK9',
    titleGroupVi: 'thuốc ức chế / bất hoạt PCSK9',
    rationaleVi:
      'Không phối hợp đồng thời ≥ 2 thuốc nhắm đích PCSK9 (Evolocumab, Alirocumab, Inclisiran).',
    citationIds: ['esc.lipid.2019.pcsk9_add_on_secondary'],
    matchMed: (_m, _r, cls) => cls.has('pcsk9')
  }
];

/**
 * LIPID-R3-R3-03 & HTN-R2-R3-08:
 * Quét các nhóm thuốc uống/tiêm loại trừ lẫn nhau trong `currentMeds`.
 * Tôn trọng các lệnh `STOP`/`HOLD` đã được module chuyên khoa phát trước đó để KHÔNG BAO GIỜ ngừng nhầm thuốc sống sót cuối cùng (để lại 0 thuốc),
 * đồng thời ngừng đầy đủ thuốc thứ 2, thứ 3... nếu bệnh nhân đang dùng ≥ 2–3 thuốc trùng nhóm.
 */
export function buildDuplicateClassStopIdsAndRecs(
  patient: Patient,
  moduleRecs?: readonly Recommendation[]
): {
  stoppedRedundantIds: Set<string>;
  recs: Recommendation[];
} {
  const stoppedRedundantIds = new Set<string>();
  const recs: Recommendation[] = [];

  const alreadyStoppedByModule = new Set<string>();
  for (const r of moduleRecs || []) {
    if (r.drugId && (r.action === 'STOP' || r.action === 'HOLD')) {
      const low = r.drugId.trim().toLowerCase();
      alreadyStoppedByModule.add(low);
      alreadyStoppedByModule.add(resolveKbDrugId(low));
    }
  }

  for (const spec of EXCLUSIVE_ACTIVE_MED_GROUPS) {
    const entries: Array<{
      rawId: string;
      resolvedId: string;
      name: string;
      score: number;
      alreadyStopped: boolean;
    }> = [];

    for (const m of patient.currentMeds || []) {
      if (!m?.drugId || isOphthalmicBetaBlocker(`${m.drugId} ${m.name || ''}`, m.route)) continue;
      const rawId = m.drugId.trim().toLowerCase();
      if (!rawId || stoppedRedundantIds.has(rawId)) continue;
      if (entries.some((e) => e.rawId === rawId)) continue;
      const resolvedId = resolveKbDrugId(rawId);
      const cls = getNormalizedDrugClasses(resolvedId);
      if (!spec.matchMed(m, resolvedId, cls)) continue;

      const alreadyStopped =
        alreadyStoppedByModule.has(rawId) || alreadyStoppedByModule.has(resolvedId);
      const baseScore = spec.scoreMed ? spec.scoreMed(m, resolvedId) : 100;
      // Ưu tiên giữ lại thuốc chưa bị module STOP; nếu bằng điểm giữ thuốc xuất hiện trước
      const score = (alreadyStopped ? -1_000_000 : 0) + baseScore - entries.length * 0.01;
      entries.push({
        rawId,
        resolvedId,
        name: m.name || m.drugId,
        score,
        alreadyStopped
      });
    }

    if (entries.length >= 2) {
      const unstopped = entries.filter((e) => !e.alreadyStopped);
      // Nếu module chuyên khoa đã tự STOP hết chỉ chừa lại <= 1 thuốc an toàn thì không phát thêm STOP chồng chéo
      if (unstopped.length <= 1) continue;

      const sorted = [...unstopped].sort((a, b) => b.score - a.score);
      const keeper = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const loser = sorted[i];
        stoppedRedundantIds.add(loser.rawId);
        recs.push({
          id: `med_review_${spec.key}_stop_${loser.rawId}`,
          module: spec.module,
          tier: spec.tier,
          tierOrder: 0,
          action: 'STOP',
          drugId: loser.rawId,
          drugNameVi: loser.name,
          title: `NGỪNG ${loser.name} (Đang dùng trùng lặp ≥ 2 thuốc ${spec.titleGroupVi})`,
          rationale: `Bệnh nhân đang dùng đồng thời nhiều thuốc ${spec.titleGroupVi} (${entries.map((s) => s.name).join(' + ')}). ${spec.rationaleVi} Bắt buộc ngừng ${loser.name} và chỉ duy trì tối đa 1 thuốc phù hợp (${keeper.name}).`,
          gates: [
            {
              parameter: spec.key,
              passed: false,
              action: 'contra',
              messageVi: `Trùng lặp ${spec.titleGroupVi}: Ngừng ${loser.name}`
            }
          ],
          citationIds: spec.citationIds,
          priority: 98
        });
      }
    }
  }

  return { stoppedRedundantIds, recs };
}

export function buildDuplicateStatinStopIdsAndRecs(
  patient: Patient,
  moduleRecs?: readonly Recommendation[]
): {
  stoppedRedundantStatinIds: Set<string>;
  recs: Recommendation[];
} {
  const { stoppedRedundantIds, recs } = buildDuplicateClassStopIdsAndRecs(patient, moduleRecs);
  return { stoppedRedundantStatinIds: stoppedRedundantIds, recs };
}

/**
 * Giới hạn liều trần Statin & MRA do tương tác thuốc (bao gồm viên phối hợp FDC).
 */
export function reviewStatinDoseCaps(
  drugId: string,
  drugName: string,
  doseNum: number | undefined,
  medDoseStr: string,
  coMedIds: Set<string>,
  medObj?: CurrentMed
): Recommendation | null {
  const components = expandDrugComponents(drugId);
  const fdc = isFdcDrug(drugId);

  const getCompMg = (compId: string): number | undefined => {
    if (medObj) {
      const cMg = parseComponentDailyDoseMg(medObj, compId);
      if (cMg !== undefined) return cMg;
    }
    return fdc ? undefined : doseNum;
  };

  if (components.includes('simvastatin')) {
    const simvaMg = getCompMg('simvastatin');
    if ((!fdc && medDoseStr.includes('80')) || (simvaMg !== undefined && simvaMg >= 80)) {
      return {
        id: 'med_review_simvastatin_80mg_toxic',
        module: 'lipid',
        tier: 'Cảnh báo liều trần độc tính',
        tierOrder: 0,
        action: 'STOP',
        drugId,
        drugNameVi: drugName,
        title: `NGỪNG / CHUYỂN ĐỔI ${drugName} chứa Simvastatin 80 mg (Cảnh báo tiêu cơ vân ACC/FDA)`,
        rationale:
          'Chống chỉ định khởi trị hoặc duy trì Simvastatin 80 mg do tăng vọt nguy cơ bệnh cơ và tiêu cơ vân cấp tính. Khuyến cáo chuyển sang Atorvastatin hoặc Rosuvastatin.',
        gates: [],
        citationIds: ['acc.lipid.2026.simva_contra_80mg'],
        priority: 99
      };
    }

    const cap10Interactors = ['diltiazem', 'verapamil', 'dronedarone'].filter((id) => coMedIds.has(id));
    if (
      cap10Interactors.length > 0 &&
      (simvaMg !== undefined ? simvaMg > 10 : !fdc && /\b(20|40)\b/.test(medDoseStr))
    ) {
      const cits: string[] = [];
      if (coMedIds.has('diltiazem')) cits.push('fda.diltiazem.simvastatin_limit_10mg');
      if (coMedIds.has('verapamil')) cits.push('acc.lipid.2026.ddi_table27_verapamil_simva');
      if (coMedIds.has('dronedarone')) cits.push('acc.lipid.2026.ddi_table27_simva_dronedarone');
      if (cits.length === 0) cits.push('fda.diltiazem.simvastatin_limit_10mg');

      return {
        id: 'med_review_simvastatin_10mg_cap',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác',
        tierOrder: 1,
        action: 'REDUCE',
        drugId,
        drugNameVi: drugName,
        dose: 'Simvastatin tối đa 10 mg/ngày',
        title: `GIẢM LIỀU ${drugName} (Simvastatin ≤ 10 mg/ngày khi dùng cùng Diltiazem / Verapamil / Dronedarone)`,
        rationale: `Phối hợp Simvastatin với ${cap10Interactors.join('/')} ức chế CYP3A4 làm tăng mạnh phơi nhiễm Simvastatin và nguy cơ tiêu cơ vân. Bắt buộc giảm liều Simvastatin xuống tối đa ≤ 10 mg/ngày.`,
        gates: [
          {
            parameter: 'DDI_dose_cap',
            passed: false,
            action: 'reduce',
            value: simvaMg ?? medDoseStr,
            threshold: 10,
            messageVi: 'Simvastatin dùng cùng Diltiazem/Verapamil/Dronedarone: Tối đa ≤ 10 mg/ngày'
          }
        ],
        citationIds: cits,
        priority: 92
      };
    }

    const hasBempedoic = coMedIds.has('bempedoic_acid');
    const cap20Interactors = ['amlodipine', 'amiodarone', 'ranolazine', 'lomitapide'].filter((id) =>
      coMedIds.has(id)
    );
    if (
      (hasBempedoic || cap20Interactors.length > 0) &&
      (simvaMg !== undefined ? simvaMg > 20 : !fdc && medDoseStr.includes('40'))
    ) {
      if (hasBempedoic && cap20Interactors.length === 0) {
        return {
          id: 'med_review_simvastatin_bempedoic_limit',
          module: 'lipid',
          tier: 'Giới hạn liều do tương tác',
          tierOrder: 1,
          action: 'REDUCE',
          drugId,
          drugNameVi: drugName,
          dose: 'Tối đa 20 mg/ngày',
          title: `GIẢM LIỀU ${drugName} (Simvastatin ≤ 20 mg/ngày khi dùng cùng Acid Bempedoic)`,
          rationale:
            'Acid bempedoic ức chế OATP1B1 làm tăng nồng độ Simvastatin huyết tương ~2 lần và tăng nguy cơ bệnh cơ/tiêu cơ vân. Bắt buộc giảm liều Simvastatin xuống tối đa ≤ 20 mg/ngày.',
          gates: [
            {
              parameter: 'DDI_dose_cap',
              passed: false,
              action: 'reduce',
              value: simvaMg ?? medDoseStr,
              threshold: 20,
              messageVi: 'Simvastatin dùng cùng Bempedoic acid: Tối đa ≤ 20 mg/ngày'
            }
          ],
          citationIds: ['fda.bempedoic.simvastatin_avoid_gt_20mg'],
          priority: 90
        };
      }

      const cits: string[] = [];
      if (coMedIds.has('amlodipine')) {
        cits.push('fda.amlodipine.simvastatin_limit_20mg', 'acc.lipid.2026.simva_contra_80mg');
      }
      if (coMedIds.has('amiodarone')) cits.push('fda.amiodarone.simvastatin_dose_limit');
      if (coMedIds.has('ranolazine')) cits.push('acc.lipid.2026.ddi_table27_ranolazine_simva');
      if (hasBempedoic) cits.push('fda.bempedoic.simvastatin_avoid_gt_20mg');
      cits.push('acc.lipid.2026.simvastatin_dose');

      return {
        id: 'med_review_simvastatin_amlodipine_limit',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác',
        tierOrder: 1,
        action: 'REDUCE',
        drugId,
        drugNameVi: drugName,
        dose: 'Tối đa 20 mg/ngày',
        title: `GIẢM LIỀU ${drugName} ≤ 20 mg/ngày (Dùng cùng Amlodipine / Amiodarone / Ranolazine / Bempedoic acid)`,
        rationale:
          'Thuốc dùng kèm làm tăng nồng độ Simvastatin huyết tương và nguy cơ tiêu cơ vân. Liều Simvastatin không được vượt quá 20 mg/ngày.',
        gates: [
          {
            parameter: 'DDI_dose_cap',
            passed: false,
            action: 'reduce',
            value: simvaMg ?? medDoseStr,
            threshold: 20,
            messageVi: 'Simvastatin dùng cùng Amlodipine/Amiodarone/Ranolazine: Tối đa ≤ 20 mg/ngày'
          }
        ],
        citationIds: Array.from(new Set(cits)),
        priority: 90
      };
    }

    if (
      coMedIds.has('ticagrelor') &&
      (simvaMg !== undefined ? simvaMg > 40 : !fdc && medDoseStr.includes('80'))
    ) {
      return {
        id: 'med_review_simvastatin_ticagrelor_limit',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác',
        tierOrder: 1,
        action: 'REDUCE',
        drugId,
        drugNameVi: drugName,
        dose: 'Tối đa 40 mg/ngày',
        title: `GIẢM LIỀU ${drugName} ≤ 40 mg/ngày (Dùng cùng Ticagrelor)`,
        rationale:
          'Ticagrelor ức chế nhẹ CYP3A4 làm tăng nồng độ Simvastatin huyết tương; tránh dùng Simvastatin > 40 mg/ngày khi phối hợp Ticagrelor.',
        gates: [
          {
            parameter: 'DDI_dose_cap',
            passed: false,
            action: 'reduce',
            value: simvaMg ?? medDoseStr,
            threshold: 40,
            messageVi: 'Simvastatin dùng cùng Ticagrelor: Tối đa ≤ 40 mg/ngày'
          }
        ],
        citationIds: ['acc.lipid.2026.simva_contra_80mg'],
        priority: 89
      };
    }
  }

  // Rosuvastatin + Febuxostat -> giới hạn tối đa <= 20 mg/ngày (FDA Crestor §7)
  if (components.includes('rosuvastatin') && coMedIds.has('febuxostat')) {
    const rosuMg = getCompMg('rosuvastatin');
    if (rosuMg !== undefined ? rosuMg > 20 : !fdc && /\b40\b/.test(medDoseStr)) {
      return {
        id: 'med_review_rosuvastatin_febuxostat_limit',
        module: 'lipid',
        tier: 'Giới hạn liều do tương tác',
        tierOrder: 1,
        action: 'REDUCE',
        drugId,
        drugNameVi: drugName,
        dose: 'Tối đa 20 mg/ngày',
        title: `GIẢM LIỀU ${drugName} (Rosuvastatin ≤ 20 mg/ngày khi dùng cùng Febuxostat)`,
        rationale:
          'Febuxostat ức chế BCRP làm tăng phơi nhiễm Rosuvastatin ~2 lần và tăng nguy cơ bệnh cơ/tiêu cơ vân. Giới hạn liều tối đa Rosuvastatin không quá 20 mg/ngày khi dùng kèm Febuxostat.',
        gates: [
          {
            parameter: 'DDI_dose_cap',
            passed: false,
            action: 'reduce',
            value: rosuMg ?? medDoseStr,
            threshold: 20,
            messageVi: 'Rosuvastatin dùng cùng Febuxostat: Tối đa ≤ 20 mg/ngày'
          }
        ],
        citationIds: ['fda.rosuvastatin.febuxostat_limit_20mg'],
        priority: 90
      };
    }
  }

  if (
    components.includes('pravastatin') &&
    coMedIds.has('bempedoic_acid') &&
    ((getCompMg('pravastatin') !== undefined && getCompMg('pravastatin')! > 40) ||
      (!fdc && getCompMg('pravastatin') === undefined && medDoseStr.includes('80')))
  ) {
    return {
      id: 'med_review_pravastatin_bempedoic_limit',
      module: 'lipid',
      tier: 'Giới hạn liều do tương tác',
      tierOrder: 1,
      action: 'REDUCE',
      drugId,
      drugNameVi: drugName,
      dose: 'Tối đa 40 mg/ngày',
      title: 'GIẢM LIỀU Pravastatin ≤ 40 mg/ngày (Dùng cùng Acid Bempedoic)',
      rationale:
        'Acid bempedoic ức chế OATP1B1/1B3 làm tăng phơi nhiễm Pravastatin ~2 lần, tăng nguy cơ đau cơ và tiêu cơ vân. Không dùng Pravastatin > 40 mg/ngày khi phối hợp Acid bempedoic.',
      gates: [
        {
          parameter: 'DDI_dose_cap',
          passed: false,
          action: 'reduce',
          value: doseNum ?? medDoseStr,
          threshold: 40,
          messageVi: 'Pravastatin dùng cùng Bempedoic acid: Tối đa ≤ 40 mg/ngày'
        }
      ],
      citationIds: ['fda.bempedoic.pravastatin_avoid_gt_40mg'],
      priority: 90
    };
  }

  // HF-R2-R2-09: Eplerenone + thuốc ức chế trung bình CYP3A4 (Diltiazem / Verapamil / Erythromycin / Fluconazole) -> tối đa <= 25 mg/ngày
  if (
    drugId === 'eplerenone' &&
    ['diltiazem', 'verapamil', 'erythromycin', 'fluconazole'].some((id) => coMedIds.has(id)) &&
    (doseNum !== undefined ? doseNum > 25 : /\b50\b/.test(medDoseStr))
  ) {
    return {
      id: 'med_review_eplerenone_mod_cyp3a4_limit',
      module: 'hf',
      tier: 'Giới hạn liều do tương tác',
      tierOrder: 1,
      action: 'REDUCE',
      drugId,
      drugNameVi: drugName,
      dose: 'Tối đa 25 mg/ngày',
      title: 'GIẢM LIỀU Eplerenone ≤ 25 mg/ngày (Dùng cùng thuốc ức chế trung bình CYP3A4)',
      rationale:
        'Diltiazem, Verapamil, Erythromycin hoặc Fluconazole ức chế CYP3A4 mức độ trung bình làm tăng nồng độ Eplerenone và nguy cơ tăng kali máu nặng. Không vượt quá 25 mg/ngày.',
      gates: [
        {
          parameter: 'DDI_dose_cap',
          passed: false,
          action: 'reduce',
          value: doseNum ?? medDoseStr,
          threshold: 25,
          messageVi: 'Eplerenone dùng cùng chất ức chế trung bình CYP3A4: Tối đa ≤ 25 mg/ngày'
        }
      ],
      citationIds: ['esc.hf.2026.mra_guidance_table_s8'],
      priority: 91
    };
  }

  return null;
}
