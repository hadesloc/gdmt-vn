/**
 * GDMT-VN Module Đái tháo đường típ 2 (DM2) - Ma trận Bằng chứng Lâm sàng
 * Phân quyền: Agent F4
 *
 * Tuân thủ QA-8: Ma trận dải thận sinh tự động từ DrugEntry.renal qua accessor KB (bao gồm cả nhóm SGLT2i cốt lõi).
 */

import type { MatrixDefinition, MatrixRowData, MatrixCellData } from '../../engine/types';
import { drug, renalBand, fmtDose } from '../../kb-types/access';

// Danh sách đầy đủ 24 thuốc cốt lõi trong điều trị ĐTĐ típ 2 (22 dược chất DM2 + 2 SGLT2i chủ lực)
export const DM2_MATRIX_DRUG_IDS = [
  'metformin',
  'dapagliflozin',
  'empagliflozin',
  'semaglutide',
  'semaglutide_oral',
  'dulaglutide',
  'liraglutide',
  'tirzepatide',
  'sitagliptin',
  'linagliptin',
  'vildagliptin',
  'saxagliptin',
  'gliclazide',
  'glimepiride',
  'pioglitazone',
  'acarbose',
  'insulin_glargine',
  'insulin_degludec',
  'insulin_detemir',
  'insulin_nph',
  'insulin_aspart',
  'insulin_lispro',
  'insulin_premix',
  'insulin_regular'
];

// 7 cột dải lọc thận tương ứng với các giá trị eGFR mẫu
const SAMPLE_EGFR_POINTS: { id: string; egfr: number }[] = [
  { id: 'g1', egfr: 100 }, // qa-allow: index - Điểm mẫu dải eGFR G1
  { id: 'g2', egfr: 75 },  // qa-allow: index - Điểm mẫu dải eGFR G2
  { id: 'g3a', egfr: 50 }, // qa-allow: index - Điểm mẫu dải eGFR G3a
  { id: 'g3b', egfr: 35 }, // qa-allow: index - Điểm mẫu dải eGFR G3b
  { id: 'g4', egfr: 20 },  // qa-allow: index - Điểm mẫu dải eGFR G4
  { id: 'g5', egfr: 10 },  // qa-allow: index - Điểm mẫu dải eGFR G5
  { id: 'dialysis', egfr: 5 } // qa-allow: index - Điểm mẫu lọc máu
];

function buildDrugRow(drugId: string): MatrixRowData {
  const d = drug(drugId);
  const cells: Record<string, MatrixCellData> = {};

  for (const col of SAMPLE_EGFR_POINTS) {
    const band = renalBand(drugId, col.egfr, 'egfr');
    if (band) {
      cells[col.id] = {
        initiate: band.initiate,
        continue: band.continue,
        dose: typeof band.dose === 'string' ? band.dose : fmtDose(band.dose),
        note: band.note,
        citationIds: [...band.citationIds]
      };
    } else {
      cells[col.id] = {
        initiate: 'no_data',
        continue: 'no_data',
        citationIds: [...d.citationIds]
      };
    }
  }

  return {
    drugId: d.id,
    nameVi: d.nameVi,
    cells
  };
}

// MA TRẬN 1: THUỐC × DẢI CHỨC NĂNG THẬN (SINH TỰ ĐỘNG TỪ DRUGENTRY.RENAL)
export const dm2MatrixEgfr: MatrixDefinition = {
  title: 'Ma trận An toàn & Liều dùng Thuốc ĐTĐ típ 2 theo dải eGFR (Sinh tự động từ KB DrugEntry.renal)',
  columns: [
    { id: 'g1', label: 'G1', subLabel: '≥ 90' },
    { id: 'g2', label: 'G2', subLabel: '60–89' },
    { id: 'g3a', label: 'G3a', subLabel: '45–59' },
    { id: 'g3b', label: 'G3b', subLabel: '30–44' },
    { id: 'g4', label: 'G4', subLabel: '15–29' },
    { id: 'g5', label: 'G5', subLabel: '< 15' },
    { id: 'dialysis', label: 'Lọc máu', subLabel: 'HD/PD' }
  ],
  rows: DM2_MATRIX_DRUG_IDS.map(buildDrugRow)
};

// MA TRẬN 2: THUỐC × BỆNH ĐỒNG MẮC / ƯU TIÊN LÂM SÀNG (Dùng drugId đại diện chuẩn trong KB để tra cứu Drawer)
export const dm2MatrixComorbidities: MatrixDefinition = {
  title: 'Ma trận Định hướng Chọn Thuốc theo Bệnh đồng mắc & Ưu tiên Lâm sàng (ADA 2026 Ch. 9 & KDIGO)',
  columns: [
    { id: 'ascvd', label: 'ASCVD / Nguy cơ cao', subLabel: 'Biến cố xơ vữa' },
    { id: 'hf', label: 'Suy tim (HF)', subLabel: 'Bất kể EF' },
    { id: 'ckd', label: 'Bệnh thận mạn (CKD)', subLabel: 'eGFR / Albumin niệu' },
    { id: 'obesity', label: 'Béo phì / Cân nặng', subLabel: 'BMI cao' },
    { id: 'hypo_risk', label: 'Tránh hạ đường huyết', subLabel: 'Ưu tiên an toàn' },
    { id: 'cost', label: 'Chi phí thấp', subLabel: 'Tiếp cận BHYT' }
  ],
  rows: [
    {
      drugId: 'dapagliflozin',
      nameVi: 'Ức chế SGLT2 (Dapagliflozin / Empagliflozin)',
      cells: {
        ascvd: { initiate: 'rec', continue: 'rec', note: 'Giảm biến cố tim mạch và tử vong (Class I ESC 2023 / ADA 2026)', citationIds: ['ada.dm2.2026.rec_9_7_ascvd', 'esc.dm2.2023.ascvd_sglt2_glp1_class1'] },
        hf: { initiate: 'rec', continue: 'rec', note: 'Trụ cột số 1 giảm nhập viện suy tim', citationIds: ['ada.dm2.2026.rec_9_8_hf'] },
        ckd: { initiate: 'rec', continue: 'rec', note: 'Trụ cột làm chậm tiến triển suy thận; xem xét thêm Finerenone nếu còn albumin niệu', citationIds: ['ada.dm2.2026.rec_9_8_hf', 'ada.dm2.2026.finerenone_rec_11_8'] },
        obesity: { initiate: 'rec', continue: 'rec', note: 'Hỗ trợ giảm cân nhẹ', citationIds: ['ada.dm2.2026.rec_9_7_ascvd'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Nguy cơ hạ đường huyết rất thấp', citationIds: ['ada.dm2.2026.rec_9_7_ascvd'] },
        cost: { initiate: 'caution', continue: 'caution', note: 'Chi phí cao hơn SU hoặc metformin', citationIds: ['ada.dm2.2026.rec_9_7_ascvd'] }
      }
    },
    {
      drugId: 'semaglutide',
      nameVi: 'Đồng vận GLP-1 (Semaglutide / Dulaglutide / Liraglutide)',
      cells: {
        ascvd: { initiate: 'rec', continue: 'rec', note: 'Ưu tiên số 1 giảm biến cố MACE và đột quỵ', citationIds: ['ada.dm2.2026.rec_9_7_ascvd', 'esc.dm2.2023.ascvd_sglt2_glp1_class1'] },
        hf: { initiate: 'ok', continue: 'ok', note: 'Trung tính ở HFrEF; khuyến cáo loại A cho HFpEF kèm béo phì (Semaglutide)', citationIds: ['ada.dm2.2026.hfpef_obesity_glp1'] },
        ckd: { initiate: 'rec', continue: 'rec', note: 'Bảo vệ thận và giảm biến cố thận - tim mạch (FLOW / KDIGO; không cần chỉnh liều thận với semaglutide, dulaglutide, liraglutide)', citationIds: ['ada.dm2.2026.glp1_ckd_no_dose_adjust', 'kdigo.dm2.2022.semaglutide_sc_dosing'] },
        obesity: { initiate: 'rec', continue: 'rec', note: 'Hiệu quả giảm cân mạnh mẽ', citationIds: ['ada.dm2.2026.rec_9_7_ascvd'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Nguy cơ hạ đường huyết rất thấp', citationIds: ['ada.dm2.2026.rec_9_7_ascvd'] },
        cost: { initiate: 'caution', continue: 'caution', note: 'Chi phí cao', citationIds: ['ada.dm2.2026.rec_9_7_ascvd'] }
      }
    },
    {
      drugId: 'tirzepatide',
      nameVi: 'Dual GIP/GLP-1 RA (Tirzepatide)',
      cells: {
        ascvd: { initiate: 'rec', continue: 'rec', note: 'Hiệu quả tim mạch - chuyển hóa vượt trội', citationIds: ['fda.tirzepatide.dosing'] },
        hf: { initiate: 'rec', continue: 'rec', note: 'Khuyến cáo loại A cải thiện triệu chứng & biến cố HFpEF kèm béo phì (Rec 9.9a)', citationIds: ['ada.dm2.2026.hfpef_obesity_dual_gip_glp1'] },
        ckd: { initiate: 'rec', continue: 'rec', note: 'Bảo vệ chức năng thận và giảm cân', citationIds: ['fda.tirzepatide.dosing'] },
        obesity: { initiate: 'rec', continue: 'rec', note: 'Hiệu quả giảm cân mạnh nhất hiện nay', citationIds: ['fda.tirzepatide.dosing'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Nguy cơ hạ đường huyết rất thấp', citationIds: ['fda.tirzepatide.dosing'] },
        cost: { initiate: 'caution', continue: 'caution', note: 'Chi phí cao, kiểm tra cung ứng tại cơ sở y tế', citationIds: ['fda.tirzepatide.dosing'] }
      }
    },
    {
      drugId: 'metformin',
      nameVi: 'Metformin',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'Lợi ích tiềm năng trên tim mạch', citationIds: ['byt.dm2.2020.metformin_renal_contra'] },
        hf: { initiate: 'ok', continue: 'ok', note: 'An toàn ở suy tim ổn định huyết động', citationIds: ['byt.dm2.2020.metformin_renal_contra'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Chỉnh liều theo mức lọc cầu thận; chống chỉ định khi suy thận nặng hoặc lọc máu', citationIds: ['fda.metformin.egfr_bands'] },
        obesity: { initiate: 'ok', continue: 'ok', note: 'Trung tính hoặc giảm nhẹ cân', citationIds: ['byt.dm2.2020.metformin_renal_contra'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Không gây hạ đường huyết đơn trị', citationIds: ['byt.dm2.2020.metformin_renal_contra'] },
        cost: { initiate: 'rec', continue: 'rec', note: 'Chi phí rất thấp, BHYT chi trả hoàn toàn', citationIds: ['byt.dm2.2020.metformin_renal_contra'] }
      }
    },
    {
      drugId: 'linagliptin',
      nameVi: 'Ức chế DPP-4 an toàn tim mạch (Linagliptin / Sitagliptin / Vildagliptin)',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'An toàn tim mạch trung tính (CARMELINA / TECOS)', citationIds: ['fda.linagliptin.no_renal_adj'] },
        hf: { initiate: 'ok', continue: 'ok', note: 'Linagliptin và Sitagliptin trung tính trên nhập viện suy tim; không dùng Saxagliptin', citationIds: ['ada.dm2.2026.saxagliptin_heart_failure'] },
        ckd: { initiate: 'ok', continue: 'ok', note: 'Linagliptin không cần chỉnh liều ở mọi giai đoạn CKD/lọc máu; Sitagliptin/Vildagliptin chỉnh liều theo thận', citationIds: ['fda.linagliptin.no_renal_adj'] },
        obesity: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên cân nặng; không phối hợp chung GLP-1 RA', citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Không gây hạ đường huyết đơn trị', citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'] },
        cost: { initiate: 'ok', continue: 'ok', note: 'Chi phí trung bình', citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'] }
      }
    },
    {
      drugId: 'saxagliptin',
      nameVi: 'Saxagliptin (DPP-4i cần tránh ở Suy tim)',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên MACE nhưng tăng nguy cơ suy tim', citationIds: ['ada.dm2.2026.saxagliptin_heart_failure'] },
        hf: { initiate: 'not_rec', continue: 'not_rec', note: 'TRÁNH DÙNG ở bệnh nhân suy tim do tăng nhập viện vì suy tim (SAVOR-TIMI 53)', citationIds: ['ada.dm2.2026.saxagliptin_heart_failure'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Bắt buộc giảm một nửa liều khi suy thận mức độ vừa đến nặng', citationIds: ['fda.saxagliptin.renal_dose'] },
        obesity: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên cân nặng', citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Không gây hạ đường huyết đơn trị', citationIds: ['ada.dm2.2026.no_dpp4_plus_glp1'] },
        cost: { initiate: 'ok', continue: 'ok', note: 'Chi phí trung bình', citationIds: ['ada.dm2.2026.saxagliptin_heart_failure'] }
      }
    },
    {
      drugId: 'pioglitazone',
      nameVi: 'Pioglitazone (TZD)',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'Có thể giảm tái phát biến cố mạch máu não khi không có suy tim', citationIds: ['fda.pioglitazone.heart_failure_contra'] },
        hf: { initiate: 'contra', continue: 'contra', note: 'Chống chỉ định tuyệt đối do giữ nước làm khởi phát/nặng suy tim', citationIds: ['fda.pioglitazone.heart_failure_contra'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Không chỉnh liều thận nhưng thận trọng giữ nước và nguy cơ gãy xương', citationIds: ['fda.pioglitazone.heart_failure_contra', 'ada.dm2.2026.pioglitazone_hf_fracture_bladder'] },
        obesity: { initiate: 'not_rec', continue: 'not_rec', note: 'Tăng cân và giữ nước', citationIds: ['fda.pioglitazone.heart_failure_contra'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Không gây hạ đường huyết đơn trị', citationIds: ['fda.pioglitazone.heart_failure_contra'] },
        cost: { initiate: 'rec', continue: 'rec', note: 'Chi phí thấp', citationIds: ['fda.pioglitazone.heart_failure_contra'] }
      }
    },
    {
      drugId: 'acarbose',
      nameVi: 'Acarbose (Ức chế Alpha-glucosidase)',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên tim mạch, giảm đỉnh đường huyết sau ăn', citationIds: ['byt.dm2.2020.acarbose_dosing'] },
        hf: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên suy tim', citationIds: ['byt.dm2.2020.acarbose_dosing'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Tránh dùng khi suy thận nặng hoặc lọc máu; chống chỉ định xơ gan', citationIds: ['kdigo.dm2.2022.agi_avoid_severe_ckd', 'ada.dm2.2026.decompensated_cirrhosis_insulin'] },
        obesity: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên cân nặng', citationIds: ['byt.dm2.2020.acarbose_dosing'] },
        hypo_risk: { initiate: 'rec', continue: 'rec', note: 'Không gây hạ đường huyết đơn trị (nếu phối hợp SU/Insulin phải cấp cứu bằng Glucose nguyên chất)', citationIds: ['byt.dm2.2020.acarbose_mechanism_monosaccharide'] },
        cost: { initiate: 'rec', continue: 'rec', note: 'Chi phí thấp, phù hợp khẩu phần giàu tinh bột', citationIds: ['byt.dm2.2020.acarbose_dosing'] }
      }
    },
    {
      drugId: 'gliclazide',
      nameVi: 'Sulfonylurea (Gliclazide MR / Glimepiride)',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên biến cố tim mạch', citationIds: ['ema.gliclazide.dosing_renal'] },
        hf: { initiate: 'ok', continue: 'ok', note: 'Trung tính trên suy tim', citationIds: ['ema.gliclazide.dosing_renal'] },
        ckd: { initiate: 'caution', continue: 'caution', note: 'Chống chỉ định khi suy thận nặng hoặc lọc máu do nguy cơ hạ đường huyết kéo dài', citationIds: ['ema.gliclazide.severe_renal_contra', 'kdigo.dm2.2022.su_avoid_low_egfr'] },
        obesity: { initiate: 'not_rec', continue: 'not_rec', note: 'Có thể gây tăng cân nhẹ', citationIds: ['ema.gliclazide.dosing_renal'] },
        hypo_risk: { initiate: 'not_rec', continue: 'not_rec', note: 'Nguy cơ hạ đường huyết cao ở người cao tuổi hoặc suy thận', citationIds: ['ada.dm2.2026.older_deintensification'] },
        cost: { initiate: 'rec', continue: 'rec', note: 'Chi phí rất thấp, phổ biến rộng rãi', citationIds: ['ema.gliclazide.dosing_renal'] }
      }
    },
    {
      drugId: 'insulin_glargine',
      nameVi: 'Insulin nền & bữa ăn (Glargine / Degludec / NPH / Aspart)',
      cells: {
        ascvd: { initiate: 'ok', continue: 'ok', note: 'An toàn tim mạch trung tính (ORIGIN / DEVOTE)', citationIds: ['fda.insulin_glargine.dosing'] },
        hf: { initiate: 'ok', continue: 'ok', note: 'Kiểm soát đường huyết hiệu quả ở suy tim', citationIds: ['fda.insulin_glargine.dosing'] },
        ckd: { initiate: 'ok', continue: 'ok', note: 'Dùng được ở mọi giai đoạn suy thận & lọc máu (cần giảm liều theo dõi do giảm thanh thải)', citationIds: ['ada.dm2.2026.kidney_failure_hypo_clearance'] },
        obesity: { initiate: 'not_rec', continue: 'not_rec', note: 'Gây tăng cân; ưu tiên phối hợp GLP-1 RA trước khi chưa có dị hóa cấp', citationIds: ['ada.dm2.2026.glp1_preferred_over_insulin'] },
        hypo_risk: { initiate: 'not_rec', continue: 'not_rec', note: 'Nguy cơ hạ đường huyết cao nhất; ưu tiên analog nền thế hệ mới', citationIds: ['ada.dm2.2026.older_deintensification'] },
        cost: { initiate: 'ok', continue: 'ok', note: 'Insulin người (NPH, Regular, Premix) chi phí thấp và sẵn có BHYT', citationIds: ['byt.dm2.2021.inpatient_insulin_1353'] }
      }
    }
  ]
};
