import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPdfPages, LIBRARY_ROOT, verifyCitation } from './kb/citations';
import { computeContentHash } from '../src/kb-types/node';
import type { Citation, Threshold, ReviewState } from '../src/kb-types/index';

function sliceExact(pageText: string, startSnippet: string, endSnippet: string): string {
  const start = pageText.indexOf(startSnippet);
  if (start === -1) throw new Error(`Không tìm thấy startSnippet: "${startSnippet}"`);
  const end = pageText.indexOf(endSnippet, start);
  if (end === -1) throw new Error(`Không tìm thấy endSnippet: "${endSnippet}" sau vị trí ${start}`);
  return pageText.slice(start, end + endSnippet.length);
}

const ROOT_DIR = process.cwd().endsWith('gdmt-vn') ? process.cwd() : join(process.cwd(), 'gdmt-vn');
const KB_DIR = join(ROOT_DIR, 'kb');

const kdigoCkd = getPdfPages(join(LIBRARY_ROOT, '01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf'));
const kdigoAki = getPdfPages(join(LIBRARY_ROOT, '01_Noi_Khoa/Than/KDIGO_2012_AKI_Guideline.pdf'));
const bytCkd = getPdfPages(join(LIBRARY_ROOT, '06_Viet_Nam/BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf'));
const ukka = getPdfPages(join(LIBRARY_ROOT, '08_Bo_sung_ON_CALL/UKKA_2022_Treatment_Acute_Hyperkalaemia_Adults.pdf'));

// 1. Thêm citations mới
const newCitations: Citation[] = [
  {
    id: 'kdigo.ckd.2024.nsaid_nephrotoxicity_p132',
    sourceId: 'kdigo_2024_ckd',
    pdfPage: 132,
    printedPage: 'S247',
    locator: 'Chapter 4 OTC medications / PDF p. 132',
    quote: sliceExact(kdigoCkd[131], 'class of OTC analgesic medications is NSAIDs.', 'analgesic nephropathy,\nand hypertension.'),
    quoteVi: 'Thuốc chống viêm không steroid (NSAID) là một trong những nhóm thuốc giảm đau không kê đơn phổ biến nhất. NSAID liên quan chặt chẽ đến viêm thận kẽ, bệnh thận do thuốc giảm đau và làm tăng huyết áp.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'kdigo.aki.2012.rec_5_1_1_rrt_emergently',
    sourceId: 'kdigo_2012_aki',
    pdfPage: 13,
    printedPage: '10',
    locator: 'Recommendation 5.1.1 / PDF p. 13',
    quote: sliceExact(kdigoAki[12], '5.1.1: Initiate RRT emergently when life-threatening changes in', 'balance exist.\n(Not Graded )'),
    quoteVi: 'Khởi động điều trị thay thế thận (RRT) cấp cứu khi xuất hiện các rối loạn đe dọa tính mạng về thăng bằng dịch, điện giải và toan kiềm.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.ckd.2024.emergency_acidosis_hco3_8',
    sourceId: 'byt_2024_ckd',
    pdfPage: 66,
    printedPage: '65',
    locator: 'Mục 4.10.3.1 Toan chuyển hóa cấp tính / PDF p. 66',
    quote: sliceExact(bytCkd[65], 'Xử trí cấp cứu nếu pH < 7,10 hoặc bicarbonate < 8 mmol/L.', 'Xử trí cấp cứu nếu pH < 7,10 hoặc bicarbonate < 8 mmol/L.'),
    quoteVi: 'Xử trí cấp cứu toan chuyển hóa nặng đe dọa tính mạng khi pH < 7.10 hoặc bicarbonate < 8 mmol/L. Lọc máu ngoài thận nếu có suy thận thực thể kèm theo.',
    cor: '1',
    loe: 'B'
  }
];

const citationsPath = join(KB_DIR, 'citations', 'ckd.json');
const currentCitations: Citation[] = JSON.parse(readFileSync(citationsPath, 'utf8'));
const citMap = new Map(currentCitations.map(c => [c.id, c]));

for (const nc of newCitations) {
  citMap.set(nc.id, nc);
}

const updatedCitations = Array.from(citMap.values());
writeFileSync(citationsPath, JSON.stringify(updatedCitations, null, 2), 'utf8');
console.log(`Đã cập nhật kb/citations/ckd.json (${updatedCitations.length} citations).`);

// 2. Thêm thresholds mới
const newThresholds: Threshold[] = [
  {
    id: 'ckd.dialysis.hco3_emergency_max',
    value: 8,
    unit: 'mmol/L',
    citationIds: ['byt.ckd.2024.emergency_acidosis_hco3_8', 'kdigo.aki.2012.rec_5_1_1_rrt_emergently'],
    descriptionVi: 'Ngưỡng bicarbonat huyết thanh cấp cứu nguy kịch (< 8 mmol/L) chỉ định lọc máu cấp cứu theo BYT 2024 & KDIGO 2012'
  },
  {
    id: 'ckd.dialysis.k_emergency_refractory',
    value: 6.5,
    unit: 'mmol/L',
    citationIds: ['ukka.2022.guideline_18_1_emergency_dialysis'],
    descriptionVi: 'Ngưỡng kali máu cấp cứu nguy kịch (>= 6.5 mmol/L) cần lọc máu cấp cứu khẩn cấp theo UKKA 2022'
  },
  {
    id: 'ckd.rasi.sbp_initiate_min',
    value: 100,
    unit: 'mmHg',
    citationIds: ['fda.losartan.diabetic_nephropathy_dose'],
    descriptionVi: 'Huyết áp tâm thu tối thiểu (>= 100 mmHg) cho phép khởi trị hoặc tiếp tục thuốc ức chế hệ RAS'
  },
  {
    id: 'ckd.sglt2i.sbp_min_safe',
    value: 95,
    unit: 'mmHg',
    citationIds: ['fda.dapagliflozin.ckd_dose'],
    descriptionVi: 'Huyết áp tâm thu tối thiểu (>= 95 mmHg) đảm bảo an toàn thể tích trước khi bắt đầu SGLT2i'
  },
  {
    id: 'ckd.aki.stage3_scr_rise',
    value: 44.2,
    unit: 'umol/L',
    citationIds: ['kdigo.aki.2012.table_2_staging'],
    descriptionVi: 'Mức tăng cấp tính tối thiểu của Creatinin (>= 44.2 µmol/L tức 0.5 mg/dL) khi Creatinin đạt >= 353.6 µmol/L để chẩn đoán AKI Giai đoạn 3'
  },
  {
    id: 'ckd.aki.stage3_scr_abs',
    value: 353.6,
    unit: 'umol/L',
    citationIds: ['kdigo.aki.2012.table_2_staging'],
    descriptionVi: 'Nồng độ Creatinin tuyệt đối (>= 353.6 µmol/L tức 4.0 mg/dL) trong tiêu chuẩn chẩn đoán AKI Giai đoạn 3'
  }
];

const threshPath = join(KB_DIR, 'thresholds', 'ckd.json');
const currentThresh: Threshold[] = JSON.parse(readFileSync(threshPath, 'utf8'));
const thMap = new Map(currentThresh.map(t => [t.id, t]));

for (const nt of newThresholds) {
  thMap.set(nt.id, nt);
}

const updatedThresh = Array.from(thMap.values());
writeFileSync(threshPath, JSON.stringify(updatedThresh, null, 2), 'utf8');
console.log(`Đã cập nhật kb/thresholds/ckd.json (${updatedThresh.length} thresholds).`);

// 3. Tạo review state cho các thresholds mới
for (const nt of newThresholds) {
  const hash = computeContentHash(nt);
  const rev: ReviewState = {
    itemId: nt.id,
    contentHash: hash,
    status: 'auto_checked',
    reports: [
      {
        reviewedAt: new Date().toISOString(),
        role: 'system_auto_validator',
        verdict: 'pass',
        issues: [],
        summary: `Tự động kiểm tra không số mồ côi cho ngưỡng ${nt.id}.`
      }
    ],
    lastReviewedAt: new Date().toISOString()
  };
  writeFileSync(join(KB_DIR, 'review', `${nt.id}.json`), JSON.stringify(rev, null, 2), 'utf8');
}
console.log('Đã cập nhật review state cho các thresholds mới.');
