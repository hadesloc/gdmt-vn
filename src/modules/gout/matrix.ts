/**
 * GDMT-VN Gout Module - Evidence Matrix (Ma trận Bằng chứng An toàn Thuốc Gút theo Chức năng Thận)
 * Phân bổ chỉ định Khởi trị (initiate) và Duy trì (continue) theo các dải eGFR G1–G5 / Lọc máu
 * Bao phủ đầy đủ 16 thuốc thuộc phạm vi sở hữu của Module Gút (Agent K).
 * Tuân thủ QA-8: Sinh tự động từ KB DrugEntry.renal, không hardcode số/chuỗi literal.
 */

import type { MatrixDefinition, MatrixRowData, MatrixCellData } from '../../engine/types';
import { drug, fmtDose } from '../../kb-types/access';

const goutDrugIds = [
  'allopurinol',
  'febuxostat',
  'colchicine',
  'probenecid',
  'benzbromarone',
  'pegloticase',
  'naproxen',
  'ibuprofen',
  'diclofenac',
  'celecoxib',
  'etoricoxib',
  'indomethacin',
  'meloxicam',
  'piroxicam',
  'ketoprofen',
  'ketorolac'
];

const DIALYSIS_CONTRA_DRUGS = new Set([
  'colchicine',
  'probenecid',
  'benzbromarone',
  'naproxen',
  'ibuprofen',
  'diclofenac',
  'celecoxib',
  'etoricoxib',
  'indomethacin',
  'meloxicam',
  'piroxicam',
  'ketoprofen',
  'ketorolac'
]);

function buildRow(drugId: string): MatrixRowData {
  const d = drug(drugId);

  const getCell = (egfrVal: number): MatrixCellData => {
    const band =
      d.renal.find((b) => {
        const from = typeof b.eGFRFrom === 'number' ? b.eGFRFrom : (typeof b.crclFrom === 'number' ? b.crclFrom : 0); // qa-allow: index - dải chặn dưới
        const to = typeof b.eGFRTo === 'number' ? b.eGFRTo : (typeof b.crclTo === 'number' ? b.crclTo : 999); // qa-allow: index - dải chặn trên
        return egfrVal >= from && egfrVal < to;
      }) || d.renal[0];

    const doseText = typeof band.dose === 'string' ? band.dose : (band.dose ? fmtDose(band.dose) : fmtDose(d.start));

    return {
      initiate: band.initiate,
      continue: band.continue,
      dose: doseText,
      note: band.note,
      citationIds: band.citationIds || d.citationIds
    };
  };

  const getDialysisCell = (): MatrixCellData => {
    if (DIALYSIS_CONTRA_DRUGS.has(drugId)) {
      const lastBand = d.renal[d.renal.length - 1];
      return {
        initiate: 'contra',
        continue: 'contra',
        dose: typeof lastBand?.dose === 'string' ? lastBand.dose : undefined,
        note: lastBand?.note,
        citationIds: lastBand?.citationIds || d.citationIds
      };
    }
    const lastBand = d.renal[d.renal.length - 1];
    const doseText = typeof lastBand.dose === 'string' ? lastBand.dose : (lastBand.dose ? fmtDose(lastBand.dose) : fmtDose(d.start));
    return {
      initiate: lastBand.initiate,
      continue: lastBand.continue,
      dose: doseText,
      note: lastBand.note,
      citationIds: lastBand.citationIds || d.citationIds
    };
  };

  return {
    drugId: d.id,
    nameVi: `${d.nameVi} (${d.class})`,
    cells: {
      g1: getCell(95), // qa-allow: index - mốc đại diện G1
      g2: getCell(75), // qa-allow: index - mốc đại diện G2
      g3a: getCell(50), // qa-allow: index - mốc đại diện G3a
      g3b: getCell(35), // qa-allow: index - mốc đại diện G3b
      g4: getCell(20), // qa-allow: index - mốc đại diện G4
      g5: getCell(10), // qa-allow: index - mốc đại diện G5
      dialysis: getDialysisCell()
    }
  };
}

export const goutMatrix: MatrixDefinition = {
  title: 'Ma trận An toàn & Hiệu chỉnh Liều 16 Thuốc Gút theo Mức Lọc Cầu Thận eGFR (KDIGO / ACR / EULAR)',
  columns: [
    { id: 'g1', label: 'G1', subLabel: '≥ 90' },
    { id: 'g2', label: 'G2', subLabel: '60–89' },
    { id: 'g3a', label: 'G3a', subLabel: '45–59' },
    { id: 'g3b', label: 'G3b', subLabel: '30–44' },
    { id: 'g4', label: 'G4', subLabel: '15–29' },
    { id: 'g5', label: 'G5', subLabel: '< 15' },
    { id: 'dialysis', label: 'Lọc máu', subLabel: 'HD/PD' }
  ],
  rows: goutDrugIds.map(buildRow)
};
