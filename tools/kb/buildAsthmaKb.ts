import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Source, Citation, Threshold, DrugEntry, ReviewState } from '../../src/kb-types/index';
import { computeContentHash } from '../../src/kb-types/index';
import { getPdfPages, LIBRARY_ROOT, normalizeForMatch, verifyCitation, quoteContainsNumber } from './citations';

const ROOT_DIR = resolve(process.cwd());
const KB_DIR = join(ROOT_DIR, 'kb');

console.log('=== XÂY DỰNG TRÍCH DẪN & NGƯỠNG LÂM SÀNG CHO MODULE HEN (ASTHMA) ===');

// Nạp sources hiện hành
const sourcesPath = join(KB_DIR, 'sources.json');
const currentSources: Source[] = JSON.parse(readFileSync(sourcesPath, 'utf8'));

// 1. Thêm sources mới nếu chưa có
const newSources: Source[] = [
  {
    id: 'gina_2026_strategy',
    org: 'GINA',
    title: 'Global Strategy for Asthma Management and Prevention (2026 Strategy Report)',
    year: 2026,
    version: '2026',
    localPath: '01_Noi_Khoa/Ho_Hap/GINA_2026_Strategy_Report.pdf',
    url: 'https://ginasthma.org/wp-content/uploads/2026/05/GINA-2026-Strategy-Report-WMS.pdf',
    jurisdiction: 'INTL',
    lang: 'en'
  },
  {
    id: 'gina_2026_summary',
    org: 'GINA',
    title: 'GINA 2026 Summary Guide for Asthma Management and Prevention',
    year: 2026,
    version: '2026',
    localPath: '01_Noi_Khoa/Ho_Hap/GINA_2026_Summary_Guide.pdf',
    url: 'https://ginasthma.org/wp-content/uploads/2026/07/GINA-Summary-Guide-2026-WEB-WMS.pdf',
    jurisdiction: 'INTL',
    lang: 'en'
  },
  {
    id: 'byt_1851_2020_asthma',
    org: 'BYT',
    title: 'Bộ Y tế QĐ 1851/QĐ-BYT 2020 Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em >= 12 tuổi',
    year: 2020,
    version: '2020',
    localPath: '06_Viet_Nam/BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf',
    url: 'https://kcb.vn',
    jurisdiction: 'VN',
    lang: 'vi'
  },
  {
    id: 'byt_5850_2021_asthma',
    org: 'BYT',
    title: 'Bộ Y tế QĐ 5850/QĐ-BYT 2021 Quy trình lâm sàng chẩn đoán và điều trị hen phế quản ở người lớn và trẻ em >= 12 tuổi',
    year: 2021,
    version: '2021',
    localPath: '06_Viet_Nam/BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf',
    url: 'https://kcb.vn',
    jurisdiction: 'VN',
    lang: 'vi'
  },
  {
    id: 'fda_label_dupilumab',
    org: 'FDA',
    title: 'DUPIXENT (dupilumab) injection prescribing information',
    year: 2024,
    version: '2024',
    localPath: '09_Nhan_Thuoc/FDA/FDA_label_dupilumab.pdf',
    url: 'https://dailymed.nlm.nih.gov',
    jurisdiction: 'LABEL',
    lang: 'en'
  }
];

for (const s of newSources) {
  if (!currentSources.some(x => x.id === s.id)) {
    currentSources.push(s);
  }
}
writeFileSync(sourcesPath, JSON.stringify(currentSources, null, 2), 'utf8');

const sourcesMap = new Map<string, Source>();
for (const s of currentSources) sourcesMap.set(s.id, s);

// 2. DANH SÁCH CITATIONS
export const asthmaCitations: Citation[] = [
  {
    id: 'gina.asthma.2026.age_12',
    sourceId: 'gina_2026_summary',
    pdfPage: 23,
    locator: 'Box 4-6 / PDF p. 23',
    quote: 'Adults & adolescents \n12+ years',
    quoteVi: 'Áp dụng cho người lớn và trẻ vị thành niên từ 12 tuổi trở lên',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.symptom_control_table_2a',
    sourceId: 'gina_2026_summary',
    pdfPage: 12,
    locator: 'Table 2A / PDF p. 12',
    quote: 'A. Assess symptom control \nIn the past 4 weeks, has the patient had:\nDaytime symptoms more than twice/week?\nAny night waking due to asthma?\nSABA* reliever needed more than twice/week?\nAny activity limitation due to asthma?\nLevel of asthma symptom control\nWell\ncontrolled\nPartly\ncontrolled\nUncontrolled\nNone\nof these\n1–2\nof these\n3–4',
    quoteVi: 'Bảng đánh giá mức độ kiểm soát triệu chứng hen theo GINA gồm 4 câu hỏi trong 4 tuần: Triệu chứng ban ngày > 2 lần/tuần, thức giấc đêm, thuốc cắt cơn > 2 lần/tuần, giới hạn hoạt động. Kiểm soát tốt: 0 tiêu chí; Kiểm soát một phần: 1-2; Không kiểm soát: 3-4.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_preferred',
    sourceId: 'gina_2026_summary',
    pdfPage: 24,
    locator: 'Track 1 Preferred / PDF p. 24',
    quote: 'Track 1 treatment options for adults and adolescents \nIn Track 1, across all steps, the reliever is low-dose ICS-formoterol. Using low-dose ICS-formoterol as reliever\nreduces the risk of severe exacerbations compared with using a SABA reliever',
    quoteVi: 'Track 1 là lựa chọn ưu tiên cho người lớn và trẻ ≥ 12 tuổi, dùng ICS-formoterol liều thấp làm thuốc cắt cơn ở mọi bậc, giúp giảm đáng kể nguy cơ đợt cấp nặng.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step1_2',
    sourceId: 'gina_2026_summary',
    pdfPage: 24,
    locator: 'Track 1 Steps 1–2 / PDF p. 24',
    quote: 'Steps 1–2: The recommended treatment is low-dose ICS-formoterol taken whenever needed to relieve asthma\nsymptoms. In clinical trials this treatment reduced the risk of severe exacerbations by about two-thirds compared with\nSABA-only treatment',
    quoteVi: 'Bậc 1–2 (Track 1): Khuyến cáo dùng ICS-formoterol liều thấp khi cần để cắt cơn (AIR-only). Giảm 2/3 nguy cơ đợt cấp nặng so với SABA đơn độc.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step3',
    sourceId: 'gina_2026_summary',
    pdfPage: 24,
    locator: 'Track 1 Step 3 / PDF p. 24',
    quote: 'Step 3: The recommended treatment is low-dose ICS-formoterol maintenance-and-reliever therapy (MART)',
    quoteVi: 'Bậc 3 (Track 1): Khuyến cáo liệu pháp duy trì và cắt cơn (MART) bằng ICS-formoterol liều thấp.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step4',
    sourceId: 'gina_2026_summary',
    pdfPage: 24,
    locator: 'Track 1 Step 4 / PDF p. 24',
    quote: 'Step 4: The recommended treatment is medium-dose ICS-formoterol MART',
    quoteVi: 'Bậc 4 (Track 1): Khuyến cáo liệu pháp duy trì và cắt cơn (MART) bằng ICS-formoterol liều trung bình.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step5_severe',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 / PDF p. 26',
    quote: 'Step 5: managing severe asthma in adults and adolescents \nIf a patient has uncontrolled symptoms and/or exacerbations despite Step 4 treatment, assess and optimize inhaler\ntechnique and adherence',
    quoteVi: 'Bậc 5 quản lý hen nặng: Đánh giá và tối ưu kỹ thuật hít, sự tuân thủ trước khi xem xét thêm thuốc sinh học hoặc LAMA.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.step5_biologics',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 Biologics / PDF p. 26',
    quote: '• Anti-immunoglobin E (subcutaneous omalizumab or biosimilar omalizumab-igec) for patients aged ≥6 years with\nsevere allergic asthma\n• Anti-interleukin 5 or anti-interleukin 5 receptor: subcutaneous mepolizumab for patients aged ≥ 6 years, and\nsubcutaneous benralizumab or depemokimab for patients aged ≥ 12 years.\n• Anti-interleukin 4 receptor alpha (subcutaneous dupilumab) for patients aged ≥6 years with severe eosinophilic\nasthma/asthma with Type 2 airway inflammation or who need maintenance oral corticosteroids\n• Anti-thymic stromal lymphopoietin (subcutaneous tezepelumab) for patients aged ≥12 years with severe asthma.',
    quoteVi: 'Các lựa chọn thuốc sinh học theo kiểu hình: Anti-IgE (omalizumab) cho hen dị ứng; Anti-IL5 / IL5R (mepolizumab, benralizumab) và Anti-IL4R (dupilumab) cho hen tăng BCAT; Anti-TSLP (tezepelumab) cho hen nặng không chọn lọc.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.step5_lama_triplet',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 LAMA / PDF p. 26',
    quote: 'including beclometasone-formoterol-glycopyrronium, fluticasone furoate-vilanterol-umeclidinium, and mometasone-indacaterol-glycopyrronium (patients ≥18 years)',
    quoteVi: 'Thêm LAMA hoặc bình hít phối hợp ba thuốc ICS-LABA-LAMA.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'gina.asthma.2026.formoterol_max_inhalations',
    sourceId: 'gina_2026_summary',
    pdfPage: 45,
    locator: 'Table 7 Formoterol Max / PDF p. 45',
    quote: 'Budesonide-formoterol DPI or pMDI 160/4.5 (200/6)\nor beclometasone-formoterol† DPI or pMDI 100/6\n(Seek medical care if >12 total inhalations needed in\na 24-hour period)',
    quoteVi: 'Liều tối đa formoterol trong MART: Seek medical care nếu cần dùng > 12 nhát hít tổng cộng trong 24 giờ cho budesonide-formoterol 160/4.5 hoặc beclometasone-formoterol 100/6.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.formoterol_max_mcg',
    sourceId: 'gina_2026_summary',
    pdfPage: 34,
    locator: 'Action Plan Formoterol Max / PDF p. 34',
    quote: 'total 12 \ninhalations of ICS-formoterol (total delivered dose of formoterol 54 mcg, metered dose 72 mcg) in a 24 hour period',
    quoteVi: 'Tổng cộng tối đa 12 nhát hít ICS-formoterol trong ngày (tương đương 54 mcg liều phân liều hoặc 72 mcg liều định liều formoterol).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.step_down_months',
    sourceId: 'gina_2026_summary',
    pdfPage: 27,
    locator: 'Step-down timing / PDF p. 27',
    quote: 'Stepping down treatment when asthma is well controlled \nWhen good asthma control has been maintained for 2–3 months, consider stepping down treatment. The aims are to find \nthe lowest treatment step that controls both symptoms and exacerbations, and to minimize side-effects.',
    quoteVi: 'Hạ bậc điều trị khi kiểm soát tốt 2-3 tháng để tìm liều thấp nhất kiểm soát bệnh và giảm tác dụng phụ.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.step_down_reduction_rate',
    sourceId: 'gina_2026_summary',
    pdfPage: 27,
    locator: 'Step-down dose rate / PDF p. 27',
    quote: 'Reduce the maintenance ICS dose by 25–50% by changing to an inhaler with a lower strength of the same ICS or by \nreducing the frequency of inhalations',
    quoteVi: 'Giảm liều ICS duy trì 25-50% bằng cách giảm hàm lượng hoặc giảm số lần hít.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'gina.asthma.2026.never_saba_alone',
    sourceId: 'gina_2026_summary',
    pdfPage: 13,
    locator: 'Never SABA Alone / PDF p. 13',
    quote: 'Explain that treatment with as-needed low-dose ICS-formoterol, as-needed low-dose ICS-SABA or daily low-dose ICS reduces the risk of severe exacerbations by\nabout half, and reduces the risk of asthma death, compared with SABA-only treatment',
    quoteVi: 'Tuyệt đối không dùng SABA đơn độc vì làm tăng gấp đôi nguy cơ đợt cấp nặng và tăng tử vong do hen.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.saba_regular_adverse',
    sourceId: 'gina_2026_summary',
    pdfPage: 27,
    locator: 'Regular SABA Harm / PDF p. 27',
    quote: 'Regular use of SABA is not recommended, because within 1–2 weeks, it increases airway hyperresponsiveness and \nairway inflammation, and decreases bronchodilator response.',
    quoteVi: 'Dùng SABA thường xuyên làm tăng phản ứng phế quản và viêm đường thở chỉ sau 1-2 tuần.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.montelukast_neuropsychiatric',
    sourceId: 'gina_2026_summary',
    pdfPage: 32,
    locator: 'Montelukast Warning / PDF p. 32',
    quote: 'risk of neuropsychiatric side effects with montelukast',
    quoteVi: 'Cảnh báo nguy cơ tác dụng phụ tâm thần kinh (ác mộng, trầm cảm, tự sát) khi dùng montelukast.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'gina.asthma.2026.table_6_budesonide',
    sourceId: 'gina_2026_summary',
    pdfPage: 44,
    locator: 'Table 6 Budesonide / PDF p. 44',
    quote: 'Budesonide (DPI or pMDI)       200–400        >400–800   >800',
    quoteVi: 'Budesonide liều định liều: Thấp 200–400 mcg, Trung bình >400–800 mcg, Cao >800 mcg/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.table_6_beclometasone_extrafine',
    sourceId: 'gina_2026_summary',
    pdfPage: 44,
    locator: 'Table 6 Beclometasone Extrafine / PDF p. 44',
    quote: 'Beclometasone dipropionate (DPI or pMDI, extrafine particle)   100–200        >200–400   >400',
    quoteVi: 'Beclometasone hạt siêu mịn: Thấp 100–200 mcg, Trung bình >200–400 mcg, Cao >400 mcg/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.table_6_fluticasone_propionate',
    sourceId: 'gina_2026_summary',
    pdfPage: 44,
    locator: 'Table 6 Fluticasone Propionate / PDF p. 44',
    quote: 'Fluticasone propionate (DPI)       100–250        >250–500   >500\nFluticasone propionate (pMDI)       100–250        >250–500    >500',
    quoteVi: 'Fluticasone propionate: Thấp 100–250 mcg, Trung bình >250–500 mcg, Cao >500 mcg/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.table_6_fluticasone_furoate',
    sourceId: 'gina_2026_summary',
    pdfPage: 44,
    locator: 'Table 6 Fluticasone Furoate / PDF p. 44',
    quote: 'Fluticasone furoate (DPI)                   100    200',
    quoteVi: 'Fluticasone furoate (DPI 1 lần/ngày): Liều thấp 100 mcg, Liều cao 200 mcg/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.table_6_ciclesonide',
    sourceId: 'gina_2026_summary',
    pdfPage: 44,
    locator: 'Table 6 Ciclesonide / PDF p. 44',
    quote: 'Ciclesonide (pMDI, extrafine particle)       80–160         >160–320   >320',
    quoteVi: 'Ciclesonide hạt siêu mịn: Thấp 80–160 mcg, Trung bình >160–320 mcg, Cao >320 mcg/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.table_6_mometasone',
    sourceId: 'gina_2026_summary',
    pdfPage: 44,
    locator: 'Table 6 Mometasone / PDF p. 44',
    quote: 'Mometasone furoate (pMDI)                   200–400      400',
    quoteVi: 'Mometasone furoate pMDI: Thấp/Trung bình 200–400 mcg, Cao 400 mcg/ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.acute_saba_puffs',
    sourceId: 'gina_2026_summary',
    pdfPage: 36,
    locator: 'Acute Salbutamol / PDF p. 36',
    quote: 'Give salbutamol 6–10 puffs by pMDI + spacer (or  \n5 mg by nebulizer), repeat if needed every 20–30 \nminutes',
    quoteVi: 'Salbutamol cơn hen cấp: 6–10 nhát xịt qua buồng đệm (hoặc 5 mg khí dung), lặp lại mỗi 20–30 phút.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.acute_ipratropium_puffs',
    sourceId: 'gina_2026_summary',
    pdfPage: 36,
    locator: 'Acute Ipratropium / PDF p. 36',
    quote: 'If ipratropium is available, give 4 puffs each time \nsalbutamol is given, for up to 3 times',
    quoteVi: 'Ipratropium phối hợp salbutamol trong cơn vừa/nặng: 4 nhát xịt mỗi lần, tối đa 3 lần.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.acute_oxygen_target',
    sourceId: 'gina_2026_summary',
    pdfPage: 36,
    locator: 'Oxygen Target / PDF p. 36',
    quote: 'Give oxygen; target saturation on oxygen 92–95%*',
    quoteVi: 'Thở oxy duy trì SpO2 đích 92–95% ở người lớn.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.acute_prednisolone_daily',
    sourceId: 'gina_2026_summary',
    pdfPage: 35,
    locator: 'Acute Prednisolone / PDF p. 35',
    quote: 'Adults: prednisolone 40–50 mg (or equivalent) once daily for 5–7 days',
    quoteVi: 'Corticoid toàn thân đợt cấp: Prednisolone 40–50 mg/ngày trong 5–7 ngày.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.acute_magnesium_iv',
    sourceId: 'gina_2026_summary',
    pdfPage: 35,
    locator: 'Acute Magnesium Sulfate / PDF p. 35',
    quote: 'Consider intravenous magnesium sulfate (2 g infusion over 20 minutes) for patients with severe exacerbations',
    quoteVi: 'Magne sulfat 2 g truyền tĩnh mạch trong 20 phút cho cơn hen cấp nặng không đáp ứng ban đầu.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'gina.asthma.2026.acute_icu_silent_chest',
    sourceId: 'gina_2026_summary',
    pdfPage: 35,
    locator: 'ICU silent chest / PDF p. 35',
    quote: 'intensive care if the patient \nis drowsy, confused, or has a silent chest',
    quoteVi: 'Chuyển hồi sức tích cực (ICU) ngay lập tức nếu bệnh nhân ngủ gà, lơ mơ hoặc lồng ngực im lặng (silent chest).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.asthma.2021.acute_classification',
    sourceId: 'byt_5850_2021_asthma',
    pdfPage: 17,
    locator: 'QĐ 5850/QĐ-BYT Bảng phân độ / PDF p. 17',
    quote: 'Cơn hen nhẹ - trung bình Cơn hen nặng Cơn hen nguy kịch \n Nói cả câu \n Ngồi dễ chịu hơn nằm \n Không co kéo cơ hô hấp \nphụ \n Nhịp thở < 25 l/p \n Nhịp tim < 120 l/p \n SpO2 (thở khí trời) > 92% \n PEF > 50% GTLT  \n Nói từng từ \n Ngồi ngả ra trước \n Hoảng hốt, lo lắng \n Co kéo cơ hô hấp phụ \n Nhịp thở > 30 l/p \n Nhịp tim > 120 l/p \n SpO2 (thở khí trời) < 90% \n PEF < 50% GTLT \nKhi có ít nhất một dấu hiệu: \n Ngủ gà, lú lẫn \n Thở chậm, có cơn ngừng \nthở \n Rối loạn nhịp tim, tụt huyết \náp, tím tái \n Lồng ngực im lặng',
    quoteVi: 'Phân loại mức độ nặng cơn hen cấp: Nhẹ - trung bình, Nặng, Nguy kịch theo QĐ 5850/BYT.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.asthma.2021.acute_hospital_treatment',
    sourceId: 'byt_5850_2021_asthma',
    pdfPage: 18,
    locator: 'QĐ 5850/QĐ-BYT Xử trí bệnh viện / PDF p. 18',
    quote: ' SABA 4-10 nhát xịt định liều \n+ buồng đệm hoặc \nsalbutamol 5mg khí dung, \nnhắc lại sau 20 phút -1 giờ  \n Prednisolon: người lớn \n1mg/kg, tối đa 50mg; trẻ em \n1-2mg/kg, tối đa 40mg  \n Thở ôxy (nếu có): đảm bảo \nSpO2 93- 95% (trẻ em 94-\n98%). \n Xem xét dùng thêm: \n- Ipratropium bromide khí dung  \n- Magne sulfate tiêm TM  \n- Corticoid liều cao tiêm TM',
    quoteVi: 'Phác đồ xử trí cơn hen cấp tại bệnh viện theo Bộ Y tế: SABA 4-10 nhát xịt hoặc 5mg khí dung, Prednisolon tối đa 50mg, Thở oxy SpO2 93-95%, Ipratropium khí dung, Magne sulfate TM.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.asthma.2021.action_plan_zones',
    sourceId: 'byt_5850_2021_asthma',
    pdfPage: 28,
    locator: 'QĐ 5850/QĐ-BYT Phụ lục 4 / PDF p. 28',
    quote: 'Phụ lục 4. BẢN KẾ HOẠCH HÀNH ĐỘNG HEN PHẾ QUẢN \n \nVÙNG MÀU \nXANH: TỐT \n Không có bất kỳ biểu hiện nàu sau đâu: ho, khò khè, nặng ngực, \nkhó thở ngày và đêm \n Có thể làm việc và sinh hoạt bình thường \n Giá tr ị lưu lư ợng đ ỉnh:  từ.... đ ến....L/p ho ặc >80% giá tr ị lý \nthuyết hoặc giá trị tốt nhất của bạn',
    quoteVi: 'Bản kế hoạch hành động hen tiếng Việt gồm 3 vùng màu: Xanh (Tốt > 80%), Vàng (Xấu đi 50-79%), Đỏ (Báo động < 50%).',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.asthma.2020.no_saba_monotherapy',
    sourceId: 'byt_1851_2020_asthma',
    pdfPage: 19,
    locator: 'QĐ 1851/QĐ-BYT Bảng 5 / PDF p. 19',
    quote: 'Bảng 5. Khuyến cáo điều trị ban đầu bằng thuốc kiểm soát hen cho người lớn và \ntrẻ ≥ 12 tuổi \nTriệu chứng hiện tại Điều trị ban đầu ƣu tiên \nTất cả bệnh nhân Không khuyến cáo dùng SABA đơn thuần (không có ICS)',
    quoteVi: 'Bộ Y tế QĐ 1851: Tất cả bệnh nhân không khuyến cáo dùng SABA đơn thuần không có ICS.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.asthma.2020.step_down_options',
    sourceId: 'byt_1851_2020_asthma',
    pdfPage: 22,
    locator: 'QĐ 1851/QĐ-BYT Bảng 8 / PDF p. 22',
    quote: 'Bảng 8. Các lựa chọn giảm bậc khi hen được kiểm soát hoàn toàn \nBậc \nhiện \ntại \n oại và liều thuốc kiểm soát \nhen hiện tại  ựa chọn giảm bậc \nBậc 5 Liều cao ICS /LABA + corticoid uống  Tiếp tục liều cao ICS/LABA + giảm liều corticoid uống \nBậc 4 \nLiều trung bình-cao ICS/LABA \nhàng ngày \n Tiếp tục ICS/LABA hàng ngày  \nvới liều ICS giảm 50%',
    quoteVi: 'Giảm bậc khi kiểm soát hoàn toàn: Tiếp tục ICS/LABA với liều ICS giảm 50%.',
    cor: '1',
    loe: 'A'
  }
];

// Kiểm tra từng citation với PDF tương ứng
let citeErrors = 0;
for (const c of asthmaCitations) {
  const s = sourcesMap.get(c.sourceId);
  if (!s) {
    console.error(`Lỗi: Không tìm thấy source ${c.sourceId} cho citation ${c.id}`);
    citeErrors++;
    continue;
  }
  const res = verifyCitation(c, s);
  for (const f of res.findings) {
    if (f.level === 'error') {
      console.error(`[FAIL CITE] ${c.id}: ${f.msg}`);
      citeErrors++;
    } else if (f.level === 'warn') {
      console.warn(`[WARN CITE] ${c.id}: ${f.msg}`);
    } else {
      console.log(`[PASS CITE] ${c.id}`);
    }
  }
}

if (citeErrors > 0) {
  console.error(`Có ${citeErrors} lỗi citation! Dừng build.`);
  process.exit(1);
}

// Ghi kb/citations/asthma.json
const citationsOutPath = join(KB_DIR, 'citations', 'asthma.json');
writeFileSync(citationsOutPath, JSON.stringify(asthmaCitations, null, 2), 'utf8');
console.log(`Đã ghi thành công ${asthmaCitations.length} citations vào ${citationsOutPath}`);
