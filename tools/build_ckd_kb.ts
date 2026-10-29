import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getPdfPages, LIBRARY_ROOT, verifyCitation } from './kb/citations';
import { computeContentHash, type Citation, type Threshold, type DrugEntry, type ReviewState } from '../../src/kb-types/index';

const ROOT_DIR = process.cwd().endsWith('gdmt-vn') ? process.cwd() : join(process.cwd(), 'gdmt-vn');
const KB_DIR = join(ROOT_DIR, 'kb');

// Nạp các file PDF cần thiết
const kdigoCkd = getPdfPages(join(LIBRARY_ROOT, '01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf'));
const kdigoBp = getPdfPages(join(LIBRARY_ROOT, '01_Noi_Khoa/Than/KDIGO_2021_Blood_Pressure_in_CKD.pdf'));
const kdigoAki = getPdfPages(join(LIBRARY_ROOT, '01_Noi_Khoa/Than/KDIGO_2012_AKI_Guideline.pdf'));
const escCkd = getPdfPages(join(LIBRARY_ROOT, '01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2026_cvd_chronic_kidney_disease.pdf'));
const ukka = getPdfPages(join(LIBRARY_ROOT, '08_Bo_sung_ON_CALL/UKKA_2022_Treatment_Acute_Hyperkalaemia_Adults.pdf'));
const bytCkd = getPdfPages(join(LIBRARY_ROOT, '06_Viet_Nam/BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf'));
const fdaDapa = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_dapagliflozin.pdf'));
const fdaEmpa = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_empagliflozin.pdf'));
const fdaCana = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_canagliflozin.pdf'));
const fdaFine = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_finerenone.pdf'));
const fdaLos = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_losartan.pdf'));
const emaPeri = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/EMA/perindopril_Coversyl_SmPC.pdf'));
const fdaPati = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_patiromer.pdf'));
const fdaSzc = getPdfPages(join(LIBRARY_ROOT, '09_Nhan_Thuoc/FDA/FDA_label_sodium_zirconium_cyclosilicate.pdf'));

function sliceExact(pageText: string, startSnippet: string, endSnippet: string): string {
  const start = pageText.indexOf(startSnippet);
  if (start === -1) throw new Error(`Không tìm thấy startSnippet: "${startSnippet}"`);
  const end = pageText.indexOf(endSnippet, start);
  if (end === -1) throw new Error(`Không tìm thấy endSnippet: "${endSnippet}" sau vị trí ${start}`);
  return pageText.slice(start, end + endSnippet.length);
}

// 1. BIÊN SOẠN CITATIONS
const citations: Citation[] = [
  // --- KDIGO 2024 CKD Guideline ---
  {
    id: 'kdigo.ckd.2024.table_2_gfr_categories',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 22,
    printedPage: 'S137',
    locator: 'Table 2 / PDF p. 22',
    quote: sliceExact(kdigoCkd[21], 'Table 2 | GFR categories in CKD', 'G5 <15 Kidney failure'),
    quoteVi: 'Bảng 2: Phân loại GFR trong CKD: G1 >= 90 (Bình thường hoặc cao), G2 60–89 (Giảm nhẹ), G3a 45–59 (Giảm nhẹ đến vừa), G3b 30–44 (Giảm vừa đến nặng), G4 15–29 (Giảm nặng), G5 < 15 (Suy thận giai đoạn cuối).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.table_3_albuminuria_categories',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 22,
    printedPage: 'S137',
    locator: 'Table 3 / PDF p. 22',
    quote: sliceExact(kdigoCkd[21], 'Table 3 | Albuminuria categories in chronic kidney disease', 'A3 >300 >30 >300 Severely increased'),
    quoteVi: 'Bảng 3: Phân loại Albumin niệu trong CKD: A1 < 30 mg/g (< 3 mg/mmol) Bình thường đến tăng nhẹ; A2 30–300 mg/g (3–30 mg/mmol) Tăng vừa; A3 > 300 mg/g (> 30 mg/mmol) Tăng nặng.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.rec_2_2_1_kfre_risk_prediction',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 41,
    printedPage: 'S156',
    locator: 'Recommendation 2.2.1 / PDF p. 41',
    quote: sliceExact(kdigoCkd[40], 'Recommendation 2.2.1: In people with CKD G3– G5, we recommend using an externally validated risk equation', 'absolute risk of kidney failure (1A).'),
    quoteVi: 'Ở người bệnh CKD giai đoạn G3–G5, khuyến cáo sử dụng phương trình dự báo nguy cơ đã được kiểm định độc lập (như KFRE) để ước tính nguy cơ suy thận tuyệt đối (1A).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.pp_2_2_1_kfre_referral_threshold',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 41,
    printedPage: 'S156',
    locator: 'Practice Point 2.2.1 & 2.2.2 / PDF p. 41',
    quote: sliceExact(kdigoCkd[40], 'Practice Point 2.2.1: A 5-year kidney failure risk of 3% –5% can be used to determine need for nephrology referral', 'criteria and other clinical considerations.'),
    quoteVi: 'Nguy cơ suy thận 5 năm 3%–5% được dùng để xác định chỉ định chuyển khám chuyên khoa thận. Nguy cơ 2 năm > 10% dùng để bắt đầu chăm sóc đa chuyên khoa.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_2_2_3_kfre_krt_prep',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 41,
    printedPage: 'S156',
    locator: 'Practice Point 2.2.3 / PDF p. 41',
    quote: sliceExact(kdigoCkd[40], 'Practice Point 2.2.3: A 2-year kidney failure risk threshold of >40%', 'and other clinical considerations.'),
    quoteVi: 'Ngưỡng nguy cơ suy thận 2 năm > 40% được sử dụng để tư vấn phương thức và chuẩn bị điều trị thay thế thận (tạo đường vào mạch máu hoặc đăng ký ghép thận).',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_4_1_bp_target_120',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 43,
    printedPage: 'S158',
    locator: 'Recommendation 3.4.1 / PDF p. 43',
    quote: sliceExact(kdigoCkd[42], 'Recommendation 3.4.1: We suggest that adults with high BP and CKD be treated with a target systolic blood pressure', 'standardized ofﬁce BP measurement(2B).'),
    quoteVi: 'Khuyến nghị người lớn tăng huyết áp kèm CKD được điều trị với huyết áp tâm thu mục tiêu < 120 mmHg khi dung nạp, đo huyết áp phòng khám chuẩn hóa (2B).',
    cor: '2',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 43,
    printedPage: 'S158',
    locator: 'Recommendation 3.6.1 / PDF p. 43',
    quote: sliceExact(kdigoCkd[42], 'Recommendation 3.6.1: We recommend starting renin-angiotensin-system inhibitors', 'without diabetes (1B).'),
    quoteVi: 'Khuyến cáo khởi trị ức chế hệ renin-angiotensin (ACEi hoặc ARB) cho người bệnh CKD kèm albumin niệu tăng nặng (G1–G4, A3) không mắc đái tháo đường (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_6_2_rasi_a2_nondm',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 43,
    printedPage: 'S158',
    locator: 'Recommendation 3.6.2 / PDF p. 43',
    quote: sliceExact(kdigoCkd[42], 'Recommendation 3.6.2: We suggest starting RASi (ACEi or ARB) for people with CKD and moderately increased', 'without diabetes (2C).'),
    quoteVi: 'Khuyến nghị khởi trị RASi (ACEi hoặc ARB) cho người bệnh CKD kèm albumin niệu tăng vừa (G1–G4, A2) không mắc đái tháo đường (2C).',
    cor: '2',
    loe: 'C'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_6_3_rasi_dm',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 43,
    printedPage: 'S158',
    locator: 'Recommendation 3.6.3 / PDF p. 43',
    quote: sliceExact(kdigoCkd[42], 'Recommendation 3.6.3: We recommend starting RASi (ACEi or ARB) for people with CKD and moderately-to-', 'with diabetes (1B).'),
    quoteVi: 'Khuyến cáo khởi trị RASi (ACEi hoặc ARB) cho người bệnh CKD kèm albumin niệu tăng vừa đến nặng (G1–G4, A2 và A3) có đái tháo đường (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_6_4_avoid_dual_rasi',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 43,
    printedPage: 'S158',
    locator: 'Recommendation 3.6.4 / PDF p. 43',
    quote: sliceExact(kdigoCkd[42], 'Recommendation 3.6.4: We recommend avoiding any combination of ACEi, ARB, and direct renin inhibitor', 'with or without diabetes (1B).'),
    quoteVi: 'Khuyến cáo tránh phối hợp bất kỳ thuốc ức chế men chuyển (ACEi), ức chế thụ thể (ARB) hoặc ức chế renin trực tiếp (DRI) ở người bệnh CKD (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_6_1_rasi_max_dose',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.6.1 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.6.1: RASi (ACEi or ARB) should be administered using the highest approved dose that is tolerated', 'trials using these doses.'),
    quoteVi: 'RASi (ACEi hoặc ARB) nên được dùng ở liều tối đa được phê duyệt mà bệnh nhân dung nạp được vì lợi ích chứng minh đạt được ở các mức liều này.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_6_2_rasi_monitoring',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.6.2 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.6.2: Changes in BP, serum creatinine, and serum potassium should be checked within 2 –4 weeks', 'current GFR and serum potassium.'),
    quoteVi: 'Huyết áp, creatinin huyết thanh và kali máu cần được kiểm tra trong vòng 2–4 tuần sau khởi trị hoặc tăng liều RASi.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_6_3_hyperkalemia_k_binders',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.6.3 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.6.3: Hyperkalemia associated with use of RASi can often be managed by measures to reduce the serum', 'stopping RASi.'),
    quoteVi: 'Tăng kali máu liên quan đến RASi thường có thể xử trí bằng các biện pháp hạ kali máu (như chất gắn kali) thay vì giảm liều hoặc ngừng thuốc RASi.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_6_4_creatinine_rise_30pct',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.6.4 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.6.4: Continue ACEi or ARB therapy unless serum creatinine rises by more than 30%', 'increase in dose.'),
    quoteVi: 'Tiếp tục duy trì ACEi hoặc ARB trừ khi creatinin huyết thanh tăng > 30% trong vòng 4 tuần sau khi khởi trị hoặc tăng liều.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_6_5_rasi_reduce_stop',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.6.5 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.6.5: Consider reducing the dose or discontinuing ACEi or ARB in the setting of either symptomatic hy-', 'eGFR] <15 ml/min per 1.73 m 2).'),
    quoteVi: 'Cân nhắc giảm liều hoặc ngừng ACEi/ARB khi tụt huyết áp có triệu chứng hoặc tăng kali máu không kiểm soát được dù đã can thiệp, hoặc giảm triệu chứng ure máu cao khi eGFR < 15.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_6_7_continue_egfr_below_30',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.6.7 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.6.7: Continue ACEi or ARB in people with CKD even when the eGFR falls below 30 ml/min per 1.73 m 2.', 'below 30 ml/min per 1.73 m 2.'),
    quoteVi: 'Tiếp tục duy trì ACEi hoặc ARB ở người bệnh CKD ngay cả khi eGFR giảm xuống dưới 30 mL/min/1.73m2.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_7_1_sglt2i_t2d',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Recommendation 3.7.1 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Recommendation 3.7.1: We recommend treating patients with type 2 diabetes (T2D), CKD, and an eGFR ‡20 ml/', 'with an SGLT2i (1A).'),
    quoteVi: 'Khuyến cáo điều trị người bệnh đái tháo đường típ 2 kèm CKD có eGFR >= 20 mL/min/1.73m2 bằng thuốc ức chế SGLT2 (1A).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_7_1_continue_below_20',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.7.1 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.7.1: Once an SGLT2i is initiated, it is reasonable to continue an SGLT2i even if the eGFR falls below', 'KRT is initiated.'),
    quoteVi: 'Khi đã bắt đầu SGLT2i, hợp lý khi tiếp tục dùng ngay cả khi eGFR giảm dưới 20 mL/min/1.73m2, trừ khi không dung nạp hoặc bắt đầu lọc máu/ghép thận.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_7_2_sick_day_hold',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Practice Point 3.7.2 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Practice Point 3.7.2: It is reasonable to withhold SGLT2i during times of prolonged fasting, surgery, or critical medical', 'greater risk for ketosis).'),
    quoteVi: 'Hợp lý khi tạm ngừng SGLT2i trong thời gian nhịn ăn kéo dài, phẫu thuật, hoặc bệnh nội khoa nguy kịch (nguy cơ toan ceton).',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_7_2_sglt2i_ckd_hf',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Recommendation 3.7.2 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Recommendation 3.7.2: We recommend treating adults with CKD with an SGLT2i for the following (1A):', 'irrespective of level of albuminuria.'),
    quoteVi: 'Khuyến cáo dùng SGLT2i cho người lớn CKD trong các trường hợp: eGFR >= 20 kèm ACR >= 200 mg/g (>= 20 mg/mmol), hoặc kèm suy tim bất kể mức albumin niệu (1A).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_7_3_sglt2i_egfr_20_45',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Recommendation 3.7.3 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Recommendation 3.7.3: We suggest treating adults with eGFR 20 to 45 ml/min per 1.73 m 2 with urine ACR', 'with an SGLT2i (2B).'),
    quoteVi: 'Khuyến nghị điều trị người lớn có eGFR 20 đến 45 mL/min/1.73m2 kèm ACR < 200 mg/g (< 20 mg/mmol) bằng thuốc ức chế SGLT2 (2B).',
    cor: '2',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_8_1_finerenone_indication',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 44,
    printedPage: 'S159',
    locator: 'Recommendation 3.8.1 / PDF p. 44',
    quote: sliceExact(kdigoCkd[43], 'Recommendation 3.8.1: We suggest a nonsteroidal mineralocorticoid receptor antagonist with proven kidney', 'RAS inhibitor (RASi) (2A).'),
    quoteVi: 'Khuyến nghị dùng thuốc đối kháng thụ thể mineralocorticoid không steroid (finerenone) cho người lớn mắc ĐTĐ2, eGFR > 25, kali máu bình thường, và albumin niệu > 30 mg/g (> 3 mg/mmol) dù đã dùng liều dung nạp tối đa RASi (2A).',
    cor: '2',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_8_2_finerenone_add_on',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 45,
    printedPage: 'S160',
    locator: 'Practice Point 3.8.2 / PDF p. 45',
    quote: sliceExact(kdigoCkd[44], 'Practice Point 3.8.2: A nonsteroidal MRA may be added to a RASi and an SGLT2i for treatment of T2D and CKD in adults.', 'T2D and CKD in adults.'),
    quoteVi: 'Thuốc đối kháng mineralocorticoid không steroid có thể phối hợp thêm vào phác đồ cùng với RASi và SGLT2i trong điều trị người lớn ĐTĐ2 và CKD.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.pp_3_10_1_acidosis_bicarbonate',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 45,
    printedPage: 'S160',
    locator: 'Practice Point 3.10.1 / PDF p. 45',
    quote: sliceExact(kdigoCkd[44], 'Practice Point 3.10.1: In people with CKD, consider use of pharmacological treatment with or without dietary', 'bicarbonate <18 mmol/l in adults).'),
    quoteVi: 'Ở người bệnh CKD, cân nhắc dùng thuốc (natri bicarbonat) để phòng ngừa toan hóa máu khi bicarbonat huyết thanh < 18 mmol/L ở người trưởng thành.',
    cor: 'conditional',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_15_1_1_statin_egfr_below_60',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 47,
    printedPage: 'S162',
    locator: 'Recommendation 3.15.1.1 / PDF p. 47',
    quote: sliceExact(kdigoCkd[46], 'Recommendation 3.15.1.1: In adults aged ‡50 years with eGFR <60 ml/min per 1.73 m 2 but not treated with', 'combination (1A).'),
    quoteVi: 'Ở người lớn >= 50 tuổi có eGFR < 60 mL/min/1.73m2 chưa lọc máu hoặc ghép thận (G3a–G5), khuyến cáo điều trị bằng statin hoặc phối hợp statin/ezetimibe (1A).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.ckd.2024.rec_3_15_1_2_statin_egfr_ge_60',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 47,
    printedPage: 'S162',
    locator: 'Recommendation 3.15.1.2 / PDF p. 47',
    quote: sliceExact(kdigoCkd[46], 'Recommendation 3.15.1.2: In adults aged ‡50 years with CKD and eGFR ‡60 ml/min per 1.73 m 2', 'statin (1B).'),
    quoteVi: 'Ở người lớn >= 50 tuổi mắc CKD và eGFR >= 60 mL/min/1.73m2 (G1–G2), khuyến cáo điều trị bằng statin (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'kdigo.ckd.2024.fig_48_referral_criteria',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 51,
    printedPage: 'S166',
    locator: 'Figure 48 / PDF p. 51',
    quote: sliceExact(kdigoCkd[50], '•  A >3%–5% 5-year risk of requiring KRT measured', '•  Acidosis'),
    quoteVi: 'Tiêu chuẩn chuyển khám chuyên khoa thận: Nguy cơ thay thế thận 5 năm > 3%–5%, eGFR < 30 mL/min/1.73m2, eGFR giảm nhanh > 20%–30%, ACR >= 300 mg/g kèm tiểu máu, hoặc ACR > 700 mg/g, tăng huyết áp kháng trị (>= 4 thuốc), toan máu hoặc bất thường kali kéo dài.',
    cor: 'conditional',
    loe: 'A'
  },

  // --- KDIGO 2021 Blood Pressure in CKD ---
  {
    id: 'kdigo.2021.bp.rec_3_1_1_target_sbp_120',
    sourceId: 'kdigo_2021_bp',
    pdfPage: 29,
    printedPage: 'S28',
    locator: 'Recommendation 3.1.1 / PDF p. 29',
    quote: sliceExact(kdigoBp[28], 'Recommendation 3.1.1: We suggest that adults with high BP and CKD be treated with a target systolic blood pressure', 'standardized ofﬁce BP measurement (2B).'),
    quoteVi: 'Khuyến nghị người lớn tăng huyết áp kèm bệnh thận mạn được điều trị tới huyết áp tâm thu mục tiêu < 120 mmHg khi dung nạp, đo bằng phương pháp chuẩn hóa tại phòng khám (2B).',
    cor: '2',
    loe: 'B'
  },

  // --- ESC 2026 CVD-CKD ---
  {
    id: 'esc.2026.ckd.bp_target_120_129',
    sourceId: 'esc_2026_cvd_ckd',
    pdfPage: 25,
    printedPage: '25',
    locator: 'Section 5.2.1 / PDF p. 25',
    quote: sliceExact(escCkd[24], 'systolic blood \npressure should be targeted to 120–129 mmHg', 'if tolerated.'),
    quoteVi: 'Dựa trên bằng chứng hiện tại, khuyến cáo huyết áp tâm thu nên được nhắm tới đích 120–129 mmHg ở bệnh nhân CKD có eGFR >= 30 mL/min/1.73m2 nếu dung nạp tốt (Khác biệt so với KDIGO < 120 mmHg).',
    cor: 'I',
    loe: 'A'
  },

  // --- KDIGO 2012 AKI Guideline ---
  {
    id: 'kdigo.aki.2012.table_2_staging',
    sourceId: 'kdigo_2012_aki',
    pdfPage: 11,
    printedPage: '8',
    locator: 'Table 2: Staging of AKI / PDF p. 11',
    quote: sliceExact(kdigoAki[10], 'Table 2 | Staging of AKI', 'Anuria for X12 hours'),
    quoteVi: 'Bảng 2: Phân độ tổn thương thận cấp (AKI): Giai đoạn 1: Creatinin tăng 1.5–1.9 lần nền hoặc tăng >= 0.3 mg/dL (>= 26.5 µmol/L); Giai đoạn 2: Tăng 2.0–2.9 lần nền; Giai đoạn 3: Tăng >= 3.0 lần nền hoặc Creatinin >= 4.0 mg/dL (>= 353.6 µmol/L) hoặc bắt đầu lọc máu RRT hoặc vô niệu >= 12h.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.aki.2012.ci_aki_iso_low_osmolar',
    sourceId: 'kdigo_2012_aki',
    pdfPage: 13,
    printedPage: '10',
    locator: 'Recommendation 4.3.2 / PDF p. 13',
    quote: sliceExact(kdigoAki[12], '4.3.2: W e recommend using either iso-osmolar or low-osmolar iodinated contrast media', 'patients at increased risk of CI-AKI. ( 1B)'),
    quoteVi: 'Khuyến cáo sử dụng thuốc cản quang iod đẳng trương hoặc áp lực thẩm thấu thấp ở bệnh nhân có nguy cơ cao tổn thương thận cấp do cản quang (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'kdigo.aki.2012.ci_aki_volume_expansion',
    sourceId: 'kdigo_2012_aki',
    pdfPage: 13,
    printedPage: '10',
    locator: 'Recommendation 4.4.1 / PDF p. 13',
    quote: sliceExact(kdigoAki[12], '4.4.1: W e recommend i.v. volume expansion with either isotonic sodium chloride or sodium bicarbonate solutions', 'increased risk for CI-AKI. ( 1A)'),
    quoteVi: 'Khuyến cáo bù dịch tĩnh mạch bằng dung dịch natri clorid đẳng trương 0.9% hoặc natri bicarbonat để phòng ngừa tổn thương thận cấp do thuốc cản quang (1A).',
    cor: '1',
    loe: 'A'
  },

  // --- UKKA 2022 Hyperkalaemia ---
  {
    id: 'ukka.2022.guideline_16_2_calcium_salts',
    sourceId: 'ukka_2022_hyperkalaemia',
    pdfPage: 13,
    printedPage: '13',
    locator: 'Guideline 16.2 / PDF p. 13',
    quote: sliceExact(ukka[12], 'Guideline 16.2 – Hyperkalaemia: STEP 1 - Protect the heart; intravenous calcium salts', 'evidence of hyperkalaemia. (1C)'),
    quoteVi: 'BƯỚC 1 - Bảo vệ cơ tim: Khuyến cáo dùng calcium chloride hoặc calcium gluconate tĩnh mạch liều tương đương 6.8 mmol (30 mL calci gluconat 10%) cho bệnh nhân tăng kali máu có biến đổi điện tâm đồ (1C).',
    cor: '1',
    loe: 'C'
  },
  {
    id: 'ukka.2022.guideline_16_3_1_insulin_glucose_severe',
    sourceId: 'ukka_2022_hyperkalaemia',
    pdfPage: 13,
    printedPage: '13',
    locator: 'Guideline 16.3.1 / PDF p. 13',
    quote: sliceExact(ukka[12], 'Guideline 16.3.1 – Hyperkalaemia: STEP 2 - Shift K+ into cells; insulin-glucose infusion', 'severe hyperkalaemia (K+ ≥ 6.5 mmol/l). (1B)'),
    quoteVi: 'BƯỚC 2 - Chuyển kali vào tế bào: Khuyến cáo truyền tĩnh mạch insulin-glucose (10 đơn vị insulin tác dụng nhanh trong 25g glucose) để điều trị tăng kali máu nặng (K+ >= 6.5 mmol/L) (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'ukka.2022.guideline_16_3_2_insulin_glucose_moderate',
    sourceId: 'ukka_2022_hyperkalaemia',
    pdfPage: 13,
    printedPage: '13',
    locator: 'Guideline 16.3.2 / PDF p. 13',
    quote: sliceExact(ukka[12], 'Guideline 16.3.2 – Hyperkalaemia: STEP 2 - Shift K+ into cells; insulin-glucose infusion', 'moderate hyperkalaemia (K+ 6.0 – 6.4 mmol/l). (2C)'),
    quoteVi: 'Khuyến nghị truyền tĩnh mạch insulin-glucose (10 đơn vị insulin trong 25g glucose) điều trị tăng kali máu mức độ trung bình (K+ 6.0–6.4 mmol/L) (2C).',
    cor: '2',
    loe: 'C'
  },
  {
    id: 'ukka.2022.guideline_16_4_1_salbutamol_nebulised',
    sourceId: 'ukka_2022_hyperkalaemia',
    pdfPage: 13,
    printedPage: '13',
    locator: 'Guideline 16.4.1 / PDF p. 13',
    quote: sliceExact(ukka[12], 'Guideline 16.4.1 – Hyperkalaemia: STEP 2 – Shift K+ into cells; Salbutamol', 'hyperkalaemia. (1B)'),
    quoteVi: 'Khuyến cáo phối hợp khí dung salbutamol 10–20 mg như một liệu pháp hỗ trợ chuyển kali vào tế bào trong tăng kali máu nặng (1B).',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'ukka.2022.guideline_17_2_glucose_monitoring',
    sourceId: 'ukka_2022_hyperkalaemia',
    pdfPage: 14,
    printedPage: '14',
    locator: 'Guideline 17.2 / PDF p. 14',
    quote: sliceExact(ukka[13], 'Guideline 17.2 – Hyperkalaemia: STEP 4 - Blood monitoring; blood glucose', 'all \npatients with hyperkalaemia. (1C)'),
    quoteVi: 'BƯỚC 4 - Theo dõi: Khuyến cáo theo dõi đường huyết tại các mốc (0, 15, 30, 60, 90, 120, 180, 240, 360 phút) sau khi truyền insulin-glucose để phòng ngừa hạ đường huyết (1C).',
    cor: '1',
    loe: 'C'
  },
  {
    id: 'ukka.2022.guideline_18_1_emergency_dialysis',
    sourceId: 'ukka_2022_hyperkalaemia',
    pdfPage: 14,
    printedPage: '14',
    locator: 'Guideline 18.1 / PDF p. 14',
    quote: sliceExact(ukka[13], 'Guideline 18.1 - Hyperkalaemia: Treatment in haemodialysis patients', 'dialysis treatment urgently. (1A)'),
    quoteVi: 'BƯỚC 5 - Đào thải: Bệnh nhân tăng kali máu nặng (K+ >= 6.5 mmol/L) hoặc kháng trị với các biện pháp nội khoa cần được chỉ định lọc máu cấp cứu khẩn cấp (1A).',
    cor: '1',
    loe: 'A'
  },

  // --- Bộ Y tế Việt Nam 2024 ---
  {
    id: 'byt.ckd.2024.acidosis_bicarbonate_target',
    sourceId: 'byt_2024_ckd',
    pdfPage: 32,
    printedPage: '32',
    locator: 'Mục 3.2 Toan chuyển hóa / PDF p. 32',
    quote: sliceExact(bytCkd[31], 'natri bicarbonate u ống khi bicarbonate', 'HCO3 mục tiêu >22mmol/L'),
    quoteVi: 'Điều trị toan chuyển hóa bằng natri bicarbonate uống khi bicarbonate máu < 18 mmol/L. Mục tiêu duy trì HCO3- > 22 mmol/L.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'byt.ckd.2024.acidosis_bicarbonate_oral_dose',
    sourceId: 'byt_2024_ckd',
    pdfPage: 61,
    printedPage: '61',
    locator: 'Mục Điều chỉnh toan chuyển hóa / PDF p. 61',
    quote: sliceExact(bytCkd[60], 'natri bicarbonate uống 2-4 g/ngày', 'natri bicarbonate uống 2-4 g/ngày'),
    quoteVi: 'Điều chỉnh toan chuyển hóa trung bình trong CKD bằng natri bicarbonate uống liều 2–4 g/ngày.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'byt.ckd.2024.potassium_resine_dose',
    sourceId: 'byt_2024_ckd',
    pdfPage: 61,
    printedPage: '61',
    locator: 'Mục Tăng kali máu mạn tính / PDF p. 61',
    quote: sliceExact(bytCkd[60], 'calcium polystyrene sulfonate', '10-15g \nx 2 - 3 lần/ngày'),
    quoteVi: 'Tăng kali máu mạn tính trong suy thận: Resine trao đổi ion như calcium polystyrene sulfonate (Resonium) liều 10–15 g x 2–3 lần/ngày.',
    cor: '2',
    loe: 'C'
  },
  {
    id: 'byt.ckd.2024.aki_on_ckd_definition',
    sourceId: 'byt_2024_ckd',
    pdfPage: 67,
    printedPage: '67',
    locator: 'Mục 4.11.1 / PDF p. 67',
    quote: sliceExact(bytCkd[66], 'Tiêu chuẩn chẩn đoán TTTC trên BN bị BTM', 'trong 6 giờ.'),
    quoteVi: 'Tiêu chuẩn chẩn đoán tổn thương thận cấp trên nền CKD: Tăng Creatinine máu trên 0,3 mg/dL (26,5 μmol/L) trong vòng 48 giờ; hoặc tăng trên 50% trong vòng 7 ngày; hoặc lưu lượng nước tiểu < 0,5 mL/kg/h trong 6 giờ.',
    cor: '1',
    loe: 'A'
  },

  // --- Nhãn thuốc FDA / EMA ---
  {
    id: 'fda.dapagliflozin.ckd_dose',
    sourceId: 'fda_dapagliflozin',
    pdfPage: 4,
    printedPage: '4',
    locator: 'Section 2.3 / PDF p. 4',
    quote: sliceExact(fdaDapa[3], '2.3 Recommended Dosage for Other Indications in Adults', '10 mg orally once daily in adults for the\nfollowing indications:'),
    quoteVi: 'Liều khuyến cáo của Farxiga (dapagliflozin) cho các chỉ định khác ở người lớn (bao gồm CKD và suy tim) là 10 mg uống 1 lần/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.empagliflozin.ckd_dose',
    sourceId: 'fda_empagliflozin',
    pdfPage: 4,
    printedPage: '4',
    locator: 'Table Dosage in Adults / PDF p. 4',
    quote: sliceExact(fdaEmpa[3], 'Reduce the risk of\nsustained decline in\neGFR, end-stage kidney', '10 mg orally once daily in the morning,\ntaken with or without food.'),
    quoteVi: 'Liều khuyến cáo của Jardiance (empagliflozin) để giảm nguy cơ suy giảm eGFR và suy thận giai đoạn cuối ở người lớn CKD là 10 mg uống 1 lần/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.canagliflozin.ckd_dose',
    sourceId: 'fda_canagliflozin',
    pdfPage: 1,
    printedPage: '1',
    locator: 'Dosage and Administration / PDF p. 1',
    quote: sliceExact(fdaCana[0], 'For all other indications in adults, the recommended dosage of INVOKANA is', '100 mg orally once daily'),
    quoteVi: 'Liều khuyến cáo của Invokana (canagliflozin) cho bệnh thận đái tháo đường có albumin niệu là 100 mg uống 1 lần/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.finerenone.table_1_starting_dose',
    sourceId: 'fda_finerenone',
    pdfPage: 3,
    printedPage: '3',
    locator: 'Table 1: Recommended Starting Dosage / PDF p. 3',
    quote: sliceExact(fdaFine[2], 'Table 1: Recommended Starting\nDosage', 'Initiation is not\nrecommended'),
    quoteVi: 'Liều khởi đầu của Kerendia (finerenone): eGFR >= 60 mL/min: 20 mg/ngày; eGFR 25 đến < 60 mL/min: 10 mg/ngày; eGFR < 25: không khuyến cáo khởi trị mới.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.finerenone.table_2_dose_adjustment',
    sourceId: 'fda_finerenone',
    pdfPage: 4,
    printedPage: '4',
    locator: 'Table 2: Dose Adjustment Based on Potassium / PDF p. 4',
    quote: sliceExact(fdaFine[3], 'Table 2: Dose Adjustment Based on Current Serum Potassium', 'potassium ≤ 5.0\nmEq/L.'),
    quoteVi: 'Chuẩn độ finerenone theo nồng độ kali huyết thanh: K+ <= 4.8 mEq/L: tăng lên 20 mg/ngày; K+ 4.8–5.5: duy trì liều hiện tại; K+ > 5.5: tạm ngừng Kerendia, dùng lại 10 mg khi K+ <= 5.0.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.losartan.diabetic_nephropathy_dose',
    sourceId: 'fda_losartan',
    pdfPage: 1,
    printedPage: '1',
    locator: 'Nephropathy in Type 2 Diabetic Patients / PDF p. 1',
    quote: sliceExact(fdaLos[0], 'Nephropathy in Type 2 Diabetic Patients\nUsual dose: 50 mg once daily.', 'Increase dose to 100 mg once daily if further blood pressure response is needed.'),
    quoteVi: 'Liều điều trị bệnh thận đái tháo đường của Cozaar (losartan): khởi đầu thông thường 50 mg x 1 lần/ngày, tăng lên liều đích 100 mg x 1 lần/ngày nếu dung nạp.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'ema.perindopril.table_1_renal_adjustment',
    sourceId: 'ema_perindopril',
    pdfPage: 2,
    printedPage: '2',
    locator: 'Table 1: dosage adjustment in renal impairment / PDF p. 2',
    quote: sliceExact(emaPeri[1], 'Table 1: dosage adjustment in renal impairment', '2.5 mg on the day of dialysis'),
    quoteVi: 'Chỉnh liều perindopril theo độ thanh thải creatinin (CrCl): ClCr >= 60: 5 mg/ngày; 30–60: 2.5 mg/ngày; 15–30: 2.5 mg cách ngày; < 15 hoặc lọc máu: 2.5 mg vào ngày lọc máu.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.patiromer.starting_dose',
    sourceId: 'fda_patiromer',
    pdfPage: 1,
    printedPage: '1',
    locator: 'Dosage and Administration / PDF p. 1',
    quote: sliceExact(fdaPati[0], 'For adults, the recommended starting dose of Veltassa is 8.4 grams administered orally once daily.', 'intervals to obtain desired serum\npotassium target range.'),
    quoteVi: 'Liều khởi đầu khuyến cáo của Veltassa (patiromer) ở người lớn là 8.4 g uống 1 lần/ngày. Chuẩn độ tăng từng nấc 8.4 g sau mỗi tuần nếu cần kiểm soát kali máu.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'fda.szc.starting_dose',
    sourceId: 'fda_szc',
    pdfPage: 1,
    printedPage: '1',
    locator: 'Dosage and Administration / PDF p. 1',
    quote: sliceExact(fdaSzc[0], 'Recommended starting dose is 10 g administered three times a d', 'For maintenance treatment, recommended dose is 10 g once daily.'),
    quoteVi: 'Liều khởi đầu của Lokelma (sodium zirconium cyclosilicate - SZC): 10 g x 3 lần/ngày trong tối đa 48 giờ. Liều duy trì khuyến cáo: 10 g x 1 lần/ngày.',
    cor: '1',
    loe: 'A'
  }
];

// Test verify citations
const sources = JSON.parse(readFileSync(join(KB_DIR, 'sources.json'), 'utf8'));
const srcMap = new Map(sources.map((s: { id: string }) => [s.id, s]));

let failCount = 0;
for (const c of citations) {
  const s = srcMap.get(c.sourceId);
  if (!s) {
    console.error('MISSING SOURCE:', c.id, c.sourceId);
    failCount++;
    continue;
  }
  const res = verifyCitation(c, s);
  if (!res.ok) {
    console.error('VERIFY FAIL:', c.id, res.findings);
    failCount++;
  }
}

if (failCount > 0) {
  console.error(`Có ${failCount} citations lỗi! Dừng lại không ghi file.`);
  process.exit(1);
}

console.log(`Tất cả ${citations.length} citations CKD đều KHỚP NGUYÊN VĂN 100%!`);
mkdirSync(join(KB_DIR, 'citations'), { recursive: true });
writeFileSync(join(KB_DIR, 'citations', 'ckd.json'), JSON.stringify(citations, null, 2), 'utf8');
console.log('Đã ghi kb/citations/ckd.json');
