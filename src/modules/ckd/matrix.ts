/**
 * GDMT-VN CKD Module - Drug x Renal Function Evidence Matrix
 * Phân quyền: Agent E (Round 4 Remediation - SZC HD non-dialysis day dosing, Canagliflozin G4 & ARB vs ACEi HD)
 */

import type { MatrixDefinition, MatrixRowData, MatrixCellData, MatrixColumn } from '../../engine/types';
import { thFor } from '../../kb-types/access';
import type { DrugEntry, RenalBand } from '../../kb-types';
import { OWNED_CKD_DRUGS, fmtShortDose, getDrugSafe } from './helpers';

const COLUMNS: MatrixColumn[] = [
  { id: 'g1_2', label: 'G1–G2', subLabel: '≥ 60' },
  { id: 'g3a', label: 'G3a', subLabel: '45–59' },
  { id: 'g3b', label: 'G3b', subLabel: '30–44' },
  { id: 'g4', label: 'G4', subLabel: '15–29' },
  { id: 'g5', label: 'G5 (chưa lọc)', subLabel: '< 15' },
  { id: 'dialysis', label: 'Lọc máu', subLabel: 'HD/PD' },
  { id: 'aki', label: 'Đợt cấp AKI', subLabel: 'Sick-day' }
];

function matchBand(bands: RenalBand[], repEgfr: number): RenalBand | undefined {
  for (const b of bands) {
    const fromVal = b.eGFRFrom ?? b.crclFrom;
    const toVal = b.eGFRTo ?? b.crclTo;

    const okFrom = fromVal === undefined || repEgfr >= fromVal;
    const okTo = toVal === undefined || repEgfr < toVal;

    if (okFrom && okTo) {
      return b;
    }
  }
  return bands.find(
    (b) =>
      b.eGFRFrom === undefined &&
      b.eGFRTo === undefined &&
      b.crclFrom === undefined &&
      b.crclTo === undefined
  );
}

function buildSglt2iCells(entry: DrugEntry): Record<string, MatrixCellData> {
  const highBand = matchBand(entry.renal, 65); // qa-allow: index - Điểm mẫu dải G1-G2
  const g3bBand = matchBand(entry.renal, 35); // qa-allow: index - Điểm mẫu dải G3b
  const g4Band = matchBand(entry.renal, 22); // qa-allow: index - Điểm mẫu dải G4
  const lowBand = matchBand(entry.renal, 12); // qa-allow: index - Điểm mẫu dải G5
  const minInit = thFor('egfr', 'ckd.sglt2i.egfr_initiate_min');
  const canaMinInit = thFor('egfr', 'ckd.canagliflozin.egfr_initiate_min');
  const isCana = entry.id === 'canagliflozin';

  const doseHigh = fmtShortDose(highBand?.dose ?? entry.start);
  const doseG3b = fmtShortDose(g3bBand?.dose ?? highBand?.dose ?? entry.start);
  const doseG4 = fmtShortDose(g4Band?.dose ?? g3bBand?.dose ?? entry.start);
  const citeHigh = highBand?.citationIds ?? entry.citationIds;
  const citeG3b = g3bBand?.citationIds ?? citeHigh;
  const citeLow = lowBand?.citationIds ?? entry.citationIds;

  return {
    g1_2: { initiate: 'rec', continue: 'rec', dose: doseHigh, citationIds: citeHigh },
    g3a: { initiate: 'rec', continue: 'rec', dose: doseG3b, citationIds: citeG3b },
    g3b: { initiate: 'rec', continue: 'rec', dose: doseG3b, citationIds: citeG3b },
    g4: isCana
      ? {
          initiate: 'not_rec',
          continue: 'rec',
          dose: doseG4,
          note: `Nhãn FDA Invokana Bảng 1: Không khởi trị mới Canagliflozin khi eGFR < ${canaMinInit} mL/min/1.73 m2 (ưu tiên khởi trị Dapagliflozin/Empagliflozin tới ngưỡng eGFR >= ${minInit}); nếu đã dùng và có đạm niệu có thể duy trì (${doseG4}) tới khi lọc máu`,
          citationIds: ['fda.canagliflozin.table_1_renal_impairment', ...citeLow]
        }
      : {
          initiate: 'caution',
          continue: 'rec',
          dose: doseG4,
          note: `Khởi trị khi eGFR >= ${minInit}; nếu < ${minInit} không khởi trị mới nhưng tiếp tục duy trì nếu đã dùng`,
          citationIds: [...new Set([...citeHigh, ...citeLow])]
        },
    g5: {
      initiate: 'not_rec',
      continue: 'ok',
      dose: doseG4,
      note: 'Chỉ tiếp tục nếu đã dùng từ trước cho tới khi bắt đầu lọc máu định kỳ',
      citationIds: citeLow
    },
    dialysis: {
      initiate: 'contra',
      continue: 'not_rec',
      note: 'Không khởi trị và cần ngừng thuốc khi bắt đầu lọc máu định kỳ / thay thế thận',
      citationIds: citeLow
    },
    aki: {
      initiate: 'contra',
      continue: 'contra',
      note: 'Tạm ngừng ngay (Sick-day rule) để phòng giảm thể tích và toan ceton đẳng đường',
      citationIds: ['kdigo.ckd.2024.pp_3_7_2_sick_day_hold']
    }
  };
}

function buildFinerenoneCells(entry: DrugEntry): Record<string, MatrixCellData> {
  const b60 = matchBand(entry.renal, 65); // qa-allow: index - Điểm mẫu dải G1-G2
  const b30 = matchBand(entry.renal, 40); // qa-allow: index - Điểm mẫu dải G3
  const b20 = matchBand(entry.renal, 20); // qa-allow: index - Điểm mẫu dải G4 dưới 25
  const b10 = matchBand(entry.renal, 10); // qa-allow: index - Điểm mẫu dải G5
  const minFine = thFor('egfr', 'ckd.finerenone.egfr_initiate_min');
  const g5Cutoff = thFor('egfr', 'ckd.egfr.g4_min');
  const g4Top = thFor('egfr', 'ckd.egfr.g3b_min') - 1;
  const kInitMax = thFor('k', 'ckd.finerenone.k_initiate_max');
  const kHoldMax = thFor('k', 'ckd.finerenone.k_hold_threshold');
  const lowDoseMg = thFor('dose_mg', 'ckd.finerenone.start_dose_low');
  const targetDoseMg = thFor('dose_mg', 'ckd.finerenone.target_dose');

  return {
    g1_2: {
      initiate: 'rec',
      continue: 'rec',
      dose: fmtShortDose(b60?.dose),
      note: `Yêu cầu K+ <= ${kInitMax.toFixed(1)} mmol/L`,
      citationIds: b60?.citationIds ?? entry.citationIds
    },
    g3a: {
      initiate: 'rec',
      continue: 'rec',
      dose: fmtShortDose(b30?.dose),
      note: `Khởi đầu ${lowDoseMg} mg, tăng lên ${targetDoseMg} mg sau 4 tuần nếu K+ cho phép`,
      citationIds: b30?.citationIds ?? entry.citationIds
    },
    g3b: {
      initiate: 'rec',
      continue: 'rec',
      dose: fmtShortDose(b30?.dose),
      note: 'Theo dõi K+ sau 4 tuần',
      citationIds: b30?.citationIds ?? entry.citationIds
    },
    g4: {
      initiate: 'caution',
      continue: 'rec',
      dose: `${lowDoseMg} mg 1 lần/ngày (chỉ khởi trị khi eGFR ${minFine}–${g4Top}; không khởi trị mới khi eGFR < ${minFine})`,
      note: `Chỉ khởi trị khi eGFR >= ${minFine} và K+ <= ${kInitMax.toFixed(1)} mmol/L; nếu đã dùng trước đó có thể tiếp tục thận trọng liều ${lowDoseMg} mg ở eGFR ${g5Cutoff}–${minFine - 1}`,
      citationIds: [...new Set([...(b30?.citationIds ?? []), ...(b20?.citationIds ?? [])])]
    },
    g5: {
      initiate: b10?.initiate ?? 'contra',
      continue: b10?.continue ?? 'not_rec',
      dose: fmtShortDose(b10?.dose),
      note: `Ngừng Finerenone khi eGFR < ${g5Cutoff} (CKD G5) do thiếu dữ liệu an toàn và nguy cơ tăng K+ nặng`,
      citationIds: b10?.citationIds ?? entry.citationIds
    },
    dialysis: {
      initiate: 'contra',
      continue: 'contra',
      note: 'Chống chỉ định / bắt buộc ngừng ở bệnh nhân lọc máu định kỳ (nguy cơ tăng K+ tử vong)',
      citationIds: b10?.citationIds ?? entry.citationIds
    },
    aki: {
      initiate: 'contra',
      continue: 'contra',
      note: `Tạm ngừng khẩn cấp trong đợt AKI hoặc K+ > ${kHoldMax} mmol/L`,
      citationIds: ['fda.finerenone.table_2_dose_adjustment']
    }
  };
}

function buildRasiCells(entry: DrugEntry): Record<string, MatrixCellData> {
  const b75 = matchBand(entry.renal, 75); // qa-allow: index - Điểm mẫu G2
  const b50 = matchBand(entry.renal, 50); // qa-allow: index - Điểm mẫu G3a
  const b35 = matchBand(entry.renal, 35); // qa-allow: index - Điểm mẫu G3b
  const b20 = matchBand(entry.renal, 20); // qa-allow: index - Điểm mẫu G4
  const b10 = matchBand(entry.renal, 10); // qa-allow: index - Điểm mẫu G5
  const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min');

  const isPerindopril = entry.id === 'perindopril';
  const isArb = entry.class === 'ARB';
  const periLowAmt =
    typeof entry.start === 'object' && typeof entry.start.amount === 'number'
      ? entry.start.amount
      : '';

  return {
    g1_2: {
      initiate: b75?.initiate ?? 'rec',
      continue: b75?.continue ?? 'rec',
      dose: fmtShortDose(b75?.dose ?? entry.start),
      citationIds: b75?.citationIds ?? entry.citationIds
    },
    g3a: {
      initiate: b50?.initiate ?? 'rec',
      continue: b50?.continue ?? 'rec',
      dose: fmtShortDose(b50?.dose ?? entry.start),
      citationIds: b50?.citationIds ?? entry.citationIds
    },
    g3b: {
      initiate: b35?.initiate ?? 'rec',
      continue: b35?.continue ?? 'rec',
      dose: fmtShortDose(b35?.dose ?? entry.start),
      citationIds: b35?.citationIds ?? entry.citationIds
    },
    g4: {
      initiate: b20?.initiate ?? 'ok',
      continue: b20?.continue ?? 'rec',
      dose: fmtShortDose(b20?.dose),
      note: isPerindopril
        ? `SmPC EMA: ${fmtShortDose(b20?.dose)} (lưu ý BYT 2024 Bảng 12 khuyến cáo tránh Perindopril khi CrCl < ${g3bMin} mL/phút)`
        : `Không tự ý ngừng thường quy khi eGFR < ${g3bMin} (KDIGO PP 3.6.7); khởi đầu thấp và chuẩn độ tới liều đích dung nạp theo HA, K+`,
      citationIds: b20?.citationIds ?? entry.citationIds
    },
    g5: {
      initiate: isPerindopril ? 'not_rec' : b10?.initiate ?? 'caution',
      continue: b10?.continue ?? 'caution',
      dose: isPerindopril
        ? `${periLowAmt} mg cách ngày (chưa lọc máu, thận trọng cao)`
        : fmtShortDose(b10?.dose),
      note: isPerindopril
        ? 'Bệnh nhân G5 chưa lọc máu: không khuyến cáo khởi trị mới (ưu tiên chuyển sang ARB thải trừ qua gan-mật như Losartan theo BYT 2024)'
        : 'Thận trọng cao ở G5 chưa lọc máu; theo dõi sát kali máu và triệu chứng hội chứng urê huyết',
      citationIds: b10?.citationIds ?? entry.citationIds
    },
    dialysis: {
      initiate: 'caution',
      continue: 'ok',
      dose: isPerindopril ? `${periLowAmt} mg vào ngày lọc máu` : fmtShortDose(b10?.dose),
      note: isPerindopril
        ? `Uống ${periLowAmt} mg vào ngày lọc máu sau buổi chạy thận nhân tạo (EMA SmPC Coversyl)`
        : isArb
          ? 'Không đào thải đáng kể qua màng lọc thận nhân tạo nên không cần liều bù sau buổi lọc máu; theo dõi sát huyết áp và kali máu trước lọc'
          : 'Điều chỉnh theo huyết áp và kali trước buổi lọc máu; uống sau buổi lọc với ACEi thải qua màng lọc',
      citationIds: b10?.citationIds ?? entry.citationIds
    },
    aki: {
      initiate: 'contra',
      continue: 'contra',
      note: 'Tạm ngừng trong đợt AKI / tụt huyết áp / giảm thể tích tuần hoàn',
      citationIds: [
        'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
        'kdigo.ckd.2024.pp_3_6_4_creatinine_rise_30pct'
      ]
    }
  };
}

function buildSupportiveCells(entry: DrugEntry): Record<string, MatrixCellData> {
  const b = entry.renal[0]; // qa-allow: index - Phần tử dải thận mặc định
  const doseStr = fmtShortDose(b?.dose ?? entry.start);
  const cites = b?.citationIds ?? entry.citationIds;

  const baseCell: MatrixCellData = {
    initiate: b?.initiate ?? 'rec',
    continue: b?.continue ?? 'rec',
    dose: doseStr,
    note: b?.note,
    citationIds: cites
  };

  let dialysisCell: MatrixCellData = baseCell;
  if (entry.id === 'sodium_zirconium_cyclosilicate') {
    const hdStart = thFor('dose_g', 'ckd.szc.hd_start_dose');
    const hdHighStart = thFor('dose_g', 'ckd.szc.hd_high_k_start_dose');
    const hdMax = thFor('dose_g', 'ckd.szc.hd_max_dose');
    const hdK = thFor('k', 'ckd.szc.hd_high_k_threshold');
    const naMg = thFor('dose_mg', 'ckd.szc.sodium_per_5g_mg');
    dialysisCell = {
      initiate: 'rec',
      continue: 'rec',
      dose: `Chỉ uống NGÀY KHÔNG LỌC MÁU: khởi đầu ${hdStart} g x 1 lần/ngày (${hdHighStart} g nếu K+ > ${hdK} mEq/L); duy trì ${hdStart}–${hdMax} g/ngày không lọc máu`,
      note: `Nhãn FDA Lokelma §2.2: KHÔNG dùng liều nạp 3 lần/ngày ở bệnh nhân lọc máu chu kỳ (chỉ dùng vào ngày không lọc máu, tối đa ${hdMax} g/ngày không lọc máu; mỗi gói ${hdStart} g chứa ~${naMg} mg Na+)`,
      citationIds: [
        'fda.szc.hemodialysis_dosing',
        'fda.szc.hemodialysis_maintenance_sodium',
        'fda.szc.edema_sodium_400mg'
      ]
    };
  } else if (entry.id === 'sodium_bicarbonate') {
    dialysisCell = {
      initiate: 'caution',
      continue: 'ok',
      dose: doseStr,
      note: 'Thường hiệu chỉnh kiềm qua dịch lọc bicarbonat; chỉ bù uống nếu còn toan giữa các kỳ lọc',
      citationIds: cites
    };
  }

  let akiCell: MatrixCellData;
  if (entry.id === 'sodium_zirconium_cyclosilicate') {
    akiCell = {
      initiate: 'rec',
      continue: 'rec',
      dose: fmtShortDose(entry.start),
      note: 'Ưu tiên hàng đầu phối hợp xử trí tăng kali máu cấp tính kèm AKI (UKKA 2022 Guideline 16.6.1)',
      citationIds: ['ukka.2022.guideline_16_6_1_szc_emergency', ...cites]
    };
  } else if (entry.id === 'patiromer') {
    akiCell = {
      initiate: 'ok',
      continue: 'ok',
      dose: doseStr,
      note: 'Khởi phát tác dụng chậm; chỉ dùng kiểm soát tăng kali bán cấp/duy trì, không thay thế thuốc cấp cứu (FDA Box)',
      citationIds: ['fda.patiromer.not_emergency', ...cites]
    };
  } else if (entry.id === 'calcium_polystyrene_sulfonate') {
    akiCell = {
      initiate: 'caution',
      continue: 'caution',
      dose: doseStr,
      note: 'Không dùng cho cấp cứu tăng kali máu cấp; chống chỉ định khi liệt ruột/sau mổ/kèm sorbitol do nguy cơ hoại tử đại tràng (UKKA 2022)',
      citationIds: ['ukka.2022.guideline_16_6_3_cps_not_emergency', 'ukka.2022.appendix_3f_cps_contra_bowel']
    };
  } else {
    akiCell = {
      initiate: 'caution',
      continue: 'caution',
      dose: doseStr,
      note: 'Trong AKI nội viện ưu tiên đánh giá khí máu động mạch và truyền Natri Bicarbonat đẳng trương tĩnh mạch nếu toan nặng; thận trọng quá tải natri/thể tích',
      citationIds: ['byt.ckd.2024.acute_acidosis_iv_bicarb_10', ...cites]
    };
  }

  return {
    g1_2: baseCell,
    g3a: baseCell,
    g3b: baseCell,
    g4: baseCell,
    g5: baseCell,
    dialysis: dialysisCell,
    aki: akiCell
  };
}

function buildRows(): MatrixRowData[] {
  const rows: MatrixRowData[] = [];

  for (const drugId of OWNED_CKD_DRUGS) {
    const entry = getDrugSafe(drugId);
    if (!entry) continue;

    let cells: Record<string, MatrixCellData>;
    if (entry.class === 'SGLT2i') {
      cells = buildSglt2iCells(entry);
    } else if (entry.id === 'finerenone') {
      cells = buildFinerenoneCells(entry);
    } else if (entry.class === 'ACEi' || entry.class === 'ARB') {
      cells = buildRasiCells(entry);
    } else {
      cells = buildSupportiveCells(entry);
    }

    rows.push({
      drugId: entry.id,
      nameVi: entry.nameVi,
      cells
    });
  }

  return rows;
}

export const ckdMatrix: MatrixDefinition = {
  title: 'Ma trận Bằng chứng & Chỉnh liều 18 Thuốc Thận học theo dải eGFR / Lọc máu / AKI (KDIGO 2024 & BYT 2024)',
  columns: COLUMNS,
  rows: buildRows()
};
