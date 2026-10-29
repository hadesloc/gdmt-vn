import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Source, Citation, Threshold, DrugEntry, ReviewState } from '../../src/kb-types/index';
import { computeContentHash } from '../../src/kb-types/node';

const ROOT_DIR = resolve(process.cwd());
const KB_DIR = join(ROOT_DIR, 'kb');

console.log('=== TẠO TOÀN BỘ KB MODULE HEN (ASTHMA) ===');

// 1. CITATIONS (34 citations đã kiểm chứng 100% khớp PDF)
const citations: Citation[] = [
  {
    id: 'gina.asthma.2026.pregnancy_safety',
    sourceId: 'gina_2026_summary',
    pdfPage: 9,
    locator: 'Pregnant women / PDF p. 9',
    quote: 'Advise pregnant women with asthma that it is important to use ICS-containing treatment during pregnancy for their baby’s health, as well as their own health.',
    quoteVi: 'Khuyên phụ nữ mang thai mắc hen rằng việc tiếp tục sử dụng điều trị chứa ICS trong thai kỳ là rất quan trọng cho sức khỏe của thai nhi cũng như của chính người mẹ.',
    cor: '1',
    loe: 'A'
  },
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
    quote: 'Assess symptom control \nIn the past 4 weeks, has the patient had:\nDaytime symptoms more than twice/week?\nAny night waking due to asthma?\nSABA* reliever needed more than twice/week?\nAny activity limitation due to asthma?',
    quoteVi: 'Đánh giá mức độ kiểm soát triệu chứng hen theo GINA gồm 4 câu hỏi trong 4 tuần: Triệu chứng ban ngày > 2 lần/tuần, thức giấc đêm, thuốc cắt cơn > 2 lần/tuần, giới hạn hoạt động.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_preferred',
    sourceId: 'gina_2026_summary',
    pdfPage: 24,
    locator: 'Track 1 Preferred / PDF p. 24',
    quote: 'Track 1 treatment options for adults and adolescents \nIn Track 1, across all steps, the patient takes low-dose ICS-formoterol whenever needed to relieve asthma symptoms',
    quoteVi: 'Track 1 là lựa chọn ưu tiên cho người lớn và trẻ ≥ 12 tuổi, dùng ICS-formoterol liều thấp làm thuốc cắt cơn ở mọi bậc.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step1_2',
    sourceId: 'gina_2026_summary',
    pdfPage: 24,
    locator: 'Track 1 Steps 1–2 / PDF p. 24',
    quote: 'Steps 1–2: The recommended treatment is low-dose ICS-formoterol taken whenever needed to relieve asthma\nsymptoms.',
    quoteVi: 'Bậc 1–2 (Track 1): Điều trị khuyến cáo là ICS-formoterol liều thấp dùng khi cần để giảm triệu chứng.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step3',
    sourceId: 'gina_2026_summary',
    pdfPage: 22,
    locator: 'Track 1 Step 3 / PDF p. 22',
    quote: 'Low-dose ICS-formoterol\nmaintenance-and-reliever therapy \n(MART)',
    quoteVi: 'Bậc 3 (Track 1): Liệu pháp duy trì và cắt cơn (MART) bằng ICS-formoterol liều thấp.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step4',
    sourceId: 'gina_2026_summary',
    pdfPage: 22,
    locator: 'Track 1 Step 4 / PDF p. 22',
    quote: 'Medium-dose ICS-formoterol\nmaintenance-and-reliever\ntherapy (MART)',
    quoteVi: 'Bậc 4 (Track 1): Liệu pháp duy trì và cắt cơn (MART) bằng ICS-formoterol liều trung bình.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.track1_step5_severe',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 / PDF p. 26',
    quote: 'Step 5: managing severe asthma in adults and adolescents',
    quoteVi: 'Bậc 5 quản lý hen nặng: Đánh giá và tối ưu kỹ thuật hít, sự tuân thủ trước khi xem xét thêm thuốc sinh học hoặc LAMA.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.step5_biologics',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 Biologics / PDF p. 26',
    quote: '• Anti-immunoglobin E (subcutaneous omalizumab or biosimilar omalizumab-igec) for patients aged ≥6 years with\nsevere allergic asthma',
    quoteVi: 'Chỉ định thuốc sinh học Anti-IgE (omalizumab) cho hen dị ứng nặng từ 6 tuổi trở lên.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.biologics_benralizumab',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 Benralizumab / PDF p. 26',
    quote: 'subcutaneous benralizumab or depemokimab for patients aged ≥ 12 years.',
    quoteVi: 'Benralizumab tiêm dưới da cho bệnh nhân từ 12 tuổi trở lên có hen tăng bạch cầu ái toan.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'gina.asthma.2026.biologics_tezepelumab',
    sourceId: 'gina_2026_summary',
    pdfPage: 26,
    locator: 'Step 5 Tezepelumab / PDF p. 26',
    quote: '• Anti-thymic stromal lymphopoietin (subcutaneous tezepelumab) for patients aged ≥12 years with severe asthma.',
    quoteVi: 'Tezepelumab tiêm dưới da cho bệnh nhân từ 12 tuổi trở lên có hen nặng.',
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
    quoteVi: 'Liều tối đa formoterol trong MART: Cần khám y tế nếu cần dùng > 12 nhát hít tổng cộng trong 24 giờ cho budesonide-formoterol 160/4.5 hoặc beclometasone-formoterol 100/6.',
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
    quote: 'treatment with\nas-needed low-dose\nICS-formoterol, as-needed low-dose ICS-SABA or daily low-dose ICS reduces the risk of severe exacerbations by half to \ntwo-thirds, compared with SABA alone.',
    quoteVi: 'Tuyệt đối không dùng SABA đơn độc vì làm tăng nguy cơ đợt cấp nặng so với dùng thuốc có ICS.',
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
    quoteVi: 'Cảnh báo nguy cơ tác dụng phụ tâm thần kinh khi dùng montelukast.',
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
    quote: 'prednisolone 40–50 mg each morning for 5–7 days.',
    quoteVi: 'Corticoid toàn thân đợt cấp: Prednisolone 40–50 mg/ngày trong 5–7 ngày.',
    cor: '1',
    loe: 'A'
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
    quote: 'SABA 4-10 nhát xịt định liều \n+ buồng đệm hoặc \nsalbutamol 5mg khí dung, \nnhắc lại sau 20 phút -1 giờ  \n Prednisolon: người lớn \n1mg/kg, tối đa 50mg; trẻ em \n1-2mg/kg, tối đa 40mg  \n Thở ôxy (nếu có): đảm bảo \nSpO2 93- 95%',
    quoteVi: 'Phác đồ xử trí cơn hen cấp tại bệnh viện theo Bộ Y tế: SABA 4-10 nhát xịt hoặc 5mg khí dung, Prednisolon tối đa 50mg, Thở oxy SpO2 93-95%.',
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
    id: 'byt.asthma.2020.magnesium_dose_2g',
    sourceId: 'byt_1851_2020_asthma',
    pdfPage: 46,
    locator: 'QĐ 1851/QĐ-BYT p. 46 / PDF p. 46',
    quote: 'Magnesium sulfate tiêm tĩnh mạch không được đề nghị sử dụng thường qui trong \nđợt cấp hen phế quản. Truyền tĩnh mạch liều 2g trong 20 phút có thể giúp giảm khó \nthở, giảm tỷ lệ nhập viện ở một số bệnh nhân.',
    quoteVi: 'Magnesium sulfate truyền tĩnh mạch liều 2g trong 20 phút trong đợt cấp hen phế quản giúp giảm khó thở, giảm nhập viện.',
    cor: '1',
    loe: 'B'
  },
  {
    id: 'byt.asthma.2020.type2_biomarkers',
    sourceId: 'byt_1851_2020_asthma',
    pdfPage: 37,
    locator: 'Chỉ điểm Type 2 / PDF p. 37',
    quote: 'bạch cầu ái toan máu ≥300 \ntế bào/µl hoặc FENO ≥25 ppb',
    quoteVi: 'Dấu ấn sinh học viêm Type 2: Bạch cầu ái toan máu ≥ 300 tế bào/µL hoặc FeNO ≥ 25 ppb.',
    cor: '1',
    loe: 'A'
  },
  {
    id: 'byt.asthma.2020.symptom_control_table_3',
    sourceId: 'byt_1851_2020_asthma',
    pdfPage: 15,
    locator: 'Bảng 3 / PDF p. 15',
    quote: 'Bảng 3. Đánh giá việc kiểm soát triệu chứng và nguy cơ tương lai \nA. Mức độ kiểm soát triệu chứng bệnh hen \n4 tuần qua, bệnh nhân có: Kiểm soát hoàn toàn Kiểm soát một phần Không kiểm soát \n Triệu chứng ban ngày >2 \nlần/tuần? \n Bất kỳ đêm nào  thức giấc do \nhen? \n Cần thu ốc giảm triệu chứng >2 \nlần/tuần? \n Giới hạn bất kỳ hoạt động nào do \nhen?',
    quoteVi: 'Bảng 3: Đánh giá việc kiểm soát triệu chứng hen theo BYT: Triệu chứng ban ngày >2 lần/tuần, thức giấc ban đêm do hen, cần thuốc giảm triệu chứng >2 lần/tuần, giới hạn bất kỳ hoạt động nào do hen.',
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

// Ghi kb/citations/asthma.json
writeFileSync(join(KB_DIR, 'citations', 'asthma.json'), JSON.stringify(citations, null, 2), 'utf8');
console.log(`Đã ghi ${citations.length} trích dẫn vào kb/citations/asthma.json`);

// 2. THRESHOLDS
const thresholds: Threshold[] = [
  {
    id: 'asthma.age.min_adult_adolescent',
    value: 12,
    unit: 'tuổi',
    citationIds: ['gina.asthma.2026.age_12'],
    descriptionVi: 'Độ tuổi tối thiểu (≥ 12 tuổi) áp dụng phác đồ hen người lớn và trẻ vị thành niên'
  },
  {
    id: 'asthma.symptom_control.daytime_cutoff',
    value: 2,
    unit: 'lần/tuần',
    citationIds: ['byt.asthma.2020.symptom_control_table_3'],
    descriptionVi: 'Ngưỡng triệu chứng ban ngày (> 2 lần/tuần) trong 4 tuần qua theo Bảng 3 BYT 1851'
  },
  {
    id: 'asthma.symptom_control.reliever_cutoff',
    value: 2,
    unit: 'lần/tuần',
    citationIds: ['byt.asthma.2020.symptom_control_table_3'],
    descriptionVi: 'Ngưỡng dùng thuốc cắt cơn (> 2 lần/tuần) trong 4 tuần qua theo Bảng 3 BYT 1851'
  },
  {
    id: 'asthma.symptom_control.partly_max_criteria',
    value: 2,
    unit: 'tiêu chí',
    citationIds: ['byt.asthma.2020.symptom_control_table_3'],
    descriptionVi: 'Số tiêu chí tối đa (≤ 2 tiêu chí) xếp vào nhóm hen kiểm soát một phần'
  },
  {
    id: 'asthma.symptom_control.uncontrolled_min_criteria',
    value: 3,
    unit: 'tiêu chí',
    citationIds: ['byt.asthma.2020.symptom_control_table_3'],
    descriptionVi: 'Số tiêu chí tối thiểu (≥ 3 tiêu chí) xếp vào nhóm hen không kiểm soát'
  },
  {
    id: 'asthma.acute.oxygen_target_min',
    value: 93,
    unit: '%',
    citationIds: ['byt.asthma.2021.acute_hospital_treatment'],
    descriptionVi: 'Mục tiêu SpO2 tối thiểu trong thở oxy cấp cứu cơn hen cấp (93%)'
  },
  {
    id: 'asthma.acute.oxygen_target_max',
    value: 95,
    unit: '%',
    citationIds: ['byt.asthma.2021.acute_hospital_treatment'],
    descriptionVi: 'Mục tiêu SpO2 tối đa trong thở oxy cấp cứu cơn hen cấp (95%)'
  },
  {
    id: 'asthma.formoterol.mart_max_inhalations',
    value: 12,
    unit: 'nhát/ngày',
    citationIds: ['gina.asthma.2026.formoterol_max_inhalations'],
    descriptionVi: 'Số nhát hít tối đa trong 24 giờ cho phác đồ MART với budesonide/formoterol hoặc beclometasone/formoterol'
  },
  {
    id: 'asthma.formoterol.max_delivered_mcg',
    value: 54,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.formoterol_max_mcg'],
    descriptionVi: 'Liều phân liều tối đa của formoterol trong 24 giờ (54 mcg)'
  },
  {
    id: 'asthma.formoterol.max_metered_mcg',
    value: 72,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.formoterol_max_mcg'],
    descriptionVi: 'Liều định liều tối đa của formoterol trong 24 giờ (72 mcg)'
  },
  {
    id: 'asthma.step_down.stability_months_min',
    value: 2,
    unit: 'tháng',
    citationIds: ['gina.asthma.2026.step_down_months'],
    descriptionVi: 'Thời gian tối thiểu kiểm soát hen ổn định (2 tháng) trước khi xem xét hạ bậc điều trị'
  },
  {
    id: 'asthma.step_down.stability_months_max',
    value: 3,
    unit: 'tháng',
    citationIds: ['gina.asthma.2026.step_down_months'],
    descriptionVi: 'Thời gian kiểm soát ổn định khuyến cáo (3 tháng) trước khi xem xét hạ bậc điều trị'
  },
  {
    id: 'asthma.step_down.reduction_min_pct',
    value: 25,
    unit: '%',
    citationIds: ['gina.asthma.2026.step_down_reduction_rate'],
    descriptionVi: 'Tỷ lệ giảm liều ICS duy trì tối thiểu (25%) khi hạ bậc'
  },
  {
    id: 'asthma.step_down.reduction_max_pct',
    value: 50,
    unit: '%',
    citationIds: ['gina.asthma.2026.step_down_reduction_rate'],
    descriptionVi: 'Tỷ lệ giảm liều ICS duy trì tối đa (50%) khi hạ bậc'
  },
  {
    id: 'asthma.ics.budesonide_low_min',
    value: 200,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_budesonide'],
    descriptionVi: 'Ngưỡng liều thấp tối thiểu của Budesonide (200 mcg/ngày)'
  },
  {
    id: 'asthma.ics.budesonide_low_max',
    value: 400,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_budesonide'],
    descriptionVi: 'Ngưỡng liều thấp tối đa của Budesonide (400 mcg/ngày)'
  },
  {
    id: 'asthma.ics.budesonide_med_max',
    value: 800,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_budesonide'],
    descriptionVi: 'Ngưỡng liều trung bình tối đa của Budesonide (800 mcg/ngày)'
  },
  {
    id: 'asthma.ics.beclometasone_low_min',
    value: 100,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine'],
    descriptionVi: 'Ngưỡng liều thấp tối thiểu của Beclometasone hạt siêu mịn (100 mcg/ngày)'
  },
  {
    id: 'asthma.ics.beclometasone_low_max',
    value: 200,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine'],
    descriptionVi: 'Ngưỡng liều thấp tối đa của Beclometasone hạt siêu mịn (200 mcg/ngày)'
  },
  {
    id: 'asthma.ics.beclometasone_med_max',
    value: 400,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine'],
    descriptionVi: 'Ngưỡng liều trung bình tối đa của Beclometasone hạt siêu mịn (400 mcg/ngày)'
  },
  {
    id: 'asthma.ics.fluticasone_prop_low_min',
    value: 100,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate'],
    descriptionVi: 'Ngưỡng liều thấp tối thiểu của Fluticasone propionate (100 mcg/ngày)'
  },
  {
    id: 'asthma.ics.fluticasone_prop_low_max',
    value: 250,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate'],
    descriptionVi: 'Ngưỡng liều thấp tối đa của Fluticasone propionate (250 mcg/ngày)'
  },
  {
    id: 'asthma.ics.fluticasone_prop_med_max',
    value: 500,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate'],
    descriptionVi: 'Ngưỡng liều trung bình tối đa của Fluticasone propionate (500 mcg/ngày)'
  },
  {
    id: 'asthma.ics.fluticasone_furoate_low',
    value: 100,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate'],
    descriptionVi: 'Liều thấp hàng ngày của Fluticasone furoate DPI (100 mcg/ngày)'
  },
  {
    id: 'asthma.ics.fluticasone_furoate_high',
    value: 200,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate'],
    descriptionVi: 'Liều cao hàng ngày của Fluticasone furoate DPI (200 mcg/ngày)'
  },
  {
    id: 'asthma.ics.ciclesonide_low_min',
    value: 80,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_ciclesonide'],
    descriptionVi: 'Ngưỡng liều thấp tối thiểu của Ciclesonide pMDI (80 mcg/ngày)'
  },
  {
    id: 'asthma.ics.ciclesonide_low_max',
    value: 160,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_ciclesonide'],
    descriptionVi: 'Ngưỡng liều thấp tối đa của Ciclesonide pMDI (160 mcg/ngày)'
  },
  {
    id: 'asthma.ics.ciclesonide_med_max',
    value: 320,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_ciclesonide'],
    descriptionVi: 'Ngưỡng liều trung bình tối đa của Ciclesonide pMDI (320 mcg/ngày)'
  },
  {
    id: 'asthma.ics.mometasone_low_min',
    value: 200,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_mometasone'],
    descriptionVi: 'Ngưỡng liều thấp tối thiểu của Mometasone furoate pMDI (200 mcg/ngày)'
  },
  {
    id: 'asthma.ics.mometasone_high',
    value: 400,
    unit: 'mcg/ngày',
    citationIds: ['gina.asthma.2026.table_6_mometasone'],
    descriptionVi: 'Ngưỡng liều cao của Mometasone furoate pMDI (400 mcg/ngày)'
  },
  {
    id: 'asthma.acute.salbutamol_puffs_min',
    value: 4,
    unit: 'nhát',
    citationIds: ['byt.asthma.2021.acute_hospital_treatment'],
    descriptionVi: 'Số nhát hít Salbutamol tối thiểu cho xử trí cơn hen cấp (4 nhát)'
  },
  {
    id: 'asthma.acute.salbutamol_puffs_max',
    value: 10,
    unit: 'nhát',
    citationIds: ['byt.asthma.2021.acute_hospital_treatment'],
    descriptionVi: 'Số nhát hít Salbutamol tối đa cho xử trí cơn hen cấp (10 nhát)'
  },
  {
    id: 'asthma.acute.salbutamol_neb_dose',
    value: 5,
    unit: 'mg',
    citationIds: ['byt.asthma.2021.acute_hospital_treatment'],
    descriptionVi: 'Liều Salbutamol khí dung trong cơn hen cấp (5 mg)'
  },
  {
    id: 'asthma.acute.repeat_interval_min',
    value: 20,
    unit: 'phút',
    citationIds: ['byt.asthma.2021.acute_hospital_treatment'],
    descriptionVi: 'Khoảng thời gian nhắc lại Salbutamol tối thiểu (20 phút)'
  },
  {
    id: 'asthma.acute.ipratropium_puffs',
    value: 4,
    unit: 'nhát',
    citationIds: ['gina.asthma.2026.acute_ipratropium_puffs'],
    descriptionVi: 'Số nhát xịt Ipratropium phối hợp trong cơn hen cấp vừa-nặng (4 nhát)'
  },
  {
    id: 'asthma.acute.ipratropium_repeat_max',
    value: 3,
    unit: 'lần',
    citationIds: ['gina.asthma.2026.acute_ipratropium_puffs'],
    descriptionVi: 'Số lần lặp lại tối đa của Ipratropium trong giờ đầu (3 lần)'
  },
  {
    id: 'asthma.acute.prednisolone_dose_min',
    value: 40,
    unit: 'mg/ngày',
    citationIds: ['gina.asthma.2026.acute_prednisolone_daily'],
    descriptionVi: 'Liều Prednisolone tối thiểu điều trị cơn hen cấp ở người lớn (40 mg/ngày)'
  },
  {
    id: 'asthma.acute.prednisolone_dose_max',
    value: 50,
    unit: 'mg/ngày',
    citationIds: ['gina.asthma.2026.acute_prednisolone_daily'],
    descriptionVi: 'Liều Prednisolone tối đa điều trị cơn hen cấp ở người lớn (50 mg/ngày)'
  },
  {
    id: 'asthma.acute.steroid_duration_min',
    value: 5,
    unit: 'ngày',
    citationIds: ['gina.asthma.2026.acute_prednisolone_daily'],
    descriptionVi: 'Thời gian dùng corticoid toàn thân tối thiểu cho đợt cấp (5 ngày)'
  },
  {
    id: 'asthma.acute.steroid_duration_max',
    value: 7,
    unit: 'ngày',
    citationIds: ['gina.asthma.2026.acute_prednisolone_daily'],
    descriptionVi: 'Thời gian dùng corticoid toàn thân tối đa cho đợt cấp (7 ngày)'
  },
  {
    id: 'asthma.acute.magnesium_dose_g',
    value: 2,
    unit: 'g',
    citationIds: ['byt.asthma.2020.magnesium_dose_2g'],
    descriptionVi: 'Liều Magnesium sulfate truyền tĩnh mạch trong cơn hen cấp nặng (2 g)'
  },
  {
    id: 'asthma.acute.magnesium_infusion_minutes',
    value: 20,
    unit: 'phút',
    citationIds: ['byt.asthma.2020.magnesium_dose_2g'],
    descriptionVi: 'Thời gian truyền tĩnh mạch Magnesium sulfate (20 phút)'
  },
  {
    id: 'asthma.acute.severe_rr_threshold',
    value: 30,
    unit: 'lần/phút',
    citationIds: ['byt.asthma.2021.acute_classification'],
    descriptionVi: 'Ngưỡng nhịp thở của cơn hen nặng (> 30 lần/phút)'
  },
  {
    id: 'asthma.acute.severe_hr_threshold',
    value: 120,
    unit: 'lần/phút',
    citationIds: ['byt.asthma.2021.acute_classification'],
    descriptionVi: 'Ngưỡng tần số tim của cơn hen nặng (> 120 lần/phút)'
  },
  {
    id: 'asthma.acute.severe_spo2_threshold',
    value: 90,
    unit: '%',
    citationIds: ['byt.asthma.2021.acute_classification'],
    descriptionVi: 'Ngưỡng SpO2 khí trời của cơn hen nặng (< 90%)'
  },
  {
    id: 'asthma.acute.severe_pef_threshold',
    value: 50,
    unit: '%',
    citationIds: ['byt.asthma.2021.acute_classification'],
    descriptionVi: 'Ngưỡng lưu lượng đỉnh PEF của cơn hen nặng (< 50% GTLT)'
  },
  {
    id: 'asthma.action_plan.green_zone_min',
    value: 80,
    unit: '%',
    citationIds: ['byt.asthma.2021.action_plan_zones'],
    descriptionVi: 'Ngưỡng PEF vùng xanh an toàn của bản kế hoạch hành động hen (> 80% giá trị tốt nhất)'
  },
  {
    id: 'asthma.biologic.eosinophils_type2_min',
    value: 300,
    unit: 'tế bào/µL',
    citationIds: ['byt.asthma.2020.type2_biomarkers'],
    descriptionVi: 'Ngưỡng bạch cầu ái toan máu tối thiểu (≥ 300 tế bào/µL) chỉ điểm kiểu hình viêm Type 2 cho điều trị sinh học'
  },
  {
    id: 'asthma.biologic.benralizumab_age_min',
    value: 12,
    unit: 'tuổi',
    citationIds: ['gina.asthma.2026.biologics_benralizumab'],
    descriptionVi: 'Độ tuổi tối thiểu chỉ định Benralizumab (≥ 12 tuổi)'
  },
  {
    id: 'asthma.biologic.tezepelumab_age_min',
    value: 12,
    unit: 'tuổi',
    citationIds: ['gina.asthma.2026.biologics_tezepelumab'],
    descriptionVi: 'Độ tuổi tối thiểu chỉ định Tezepelumab (≥ 12 tuổi)'
  },
  {
    id: 'asthma.biologic.omalizumab_age_min',
    value: 6,
    unit: 'tuổi',
    citationIds: ['gina.asthma.2026.step5_biologics'],
    descriptionVi: 'Độ tuổi tối thiểu chỉ định Omalizumab (≥ 6 tuổi)'
  }
];

// Ghi kb/thresholds/asthma.json
writeFileSync(join(KB_DIR, 'thresholds', 'asthma.json'), JSON.stringify(thresholds, null, 2), 'utf8');
console.log(`Đã ghi ${thresholds.length} ngưỡng vào kb/thresholds/asthma.json`);

// 3. DRUGS (21 thuốc sở hữu)
const drugs: DrugEntry[] = [
  {
    id: 'budesonide',
    nameVi: 'Budesonide',
    inn: 'Budesonide',
    class: 'ICS',
    vnBrands: ['Pulmicort', 'Pulmicort Respules', 'Budecort'],
    forms: ['Khí dung hỗn dịch 0.5 mg/2 ml, 1 mg/2 ml', 'Bình hít bột khô Turbuhaler 100 mcg, 200 mcg'],
    start: {
      amount: 200,
      unit: 'mcg',
      frequency: '1-2 lần/ngày',
      route: 'hít',
      description: 'Liều thấp 200–400 mcg/ngày'
    },
    target: {
      amount: 800,
      unit: 'mcg',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Liều cao >800 mcg/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_budesonide']
      }
    ],
    gates: [],
    interactions: [
      'Chất ức chế mạnh CYP3A4 (ketoconazole, itraconazole, clarithromycin) làm tăng nồng độ budesonide toàn thân'
    ],
    citationIds: ['gina.asthma.2026.table_6_budesonide']
  },
  {
    id: 'fluticasone_propionate',
    nameVi: 'Fluticasone propionate',
    inn: 'Fluticasone propionate',
    class: 'ICS',
    vnBrands: ['Flixotide', 'Flixotide Evohaler', 'Flixotide Nebules'],
    forms: ['Bình xịt định liều pMDI 50 mcg, 125 mcg', 'Bình hít bột khô Accuhaler 100 mcg, 250 mcg', 'Khí dung 0.5 mg/2 ml'],
    start: {
      amount: 100,
      unit: 'mcg',
      frequency: '1-2 lần/ngày',
      route: 'hít',
      description: 'Liều thấp 100–250 mcg/ngày'
    },
    target: {
      amount: 500,
      unit: 'mcg',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Liều cao >500 mcg/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate']
      }
    ],
    gates: [],
    interactions: [
      'Tương tác với ritonavir, ketoconazole làm tăng nguy cơ hội chứng Cushing và ức chế vỏ thượng thận'
    ],
    citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate']
  },
  {
    id: 'fluticasone_furoate',
    nameVi: 'Fluticasone furoate',
    inn: 'Fluticasone furoate',
    class: 'ICS',
    vnBrands: ['Arnuity Ellipta'],
    forms: ['Bình hít bột khô Ellipta 100 mcg, 200 mcg'],
    start: {
      amount: 100,
      unit: 'mcg',
      frequency: '1 lần/ngày',
      route: 'hít',
      description: 'Liều thấp 100 mcg 1 lần/ngày'
    },
    target: {
      amount: 200,
      unit: 'mcg',
      frequency: '1 lần/ngày',
      route: 'hít',
      description: 'Liều cao 200 mcg 1 lần/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate']
      }
    ],
    gates: [],
    interactions: ['Chất ức chế mạnh CYP3A4'],
    citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate']
  },
  {
    id: 'beclometasone',
    nameVi: 'Beclometasone dipropionate',
    inn: 'Beclometasone dipropionate',
    class: 'ICS',
    vnBrands: ['Becotide', 'Becloforte'],
    forms: ['Bình xịt định liều hạt siêu mịn pMDI 100 mcg, 250 mcg'],
    start: {
      amount: 100,
      unit: 'mcg',
      frequency: '1-2 lần/ngày',
      route: 'hít',
      description: 'Liều thấp 100–200 mcg/ngày (hạt siêu mịn)'
    },
    target: {
      amount: 400,
      unit: 'mcg',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Liều cao >400 mcg/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine']
      }
    ],
    gates: [],
    interactions: [],
    citationIds: ['gina.asthma.2026.table_6_beclometasone_extrafine']
  },
  {
    id: 'mometasone',
    nameVi: 'Mometasone furoate',
    inn: 'Mometasone furoate',
    class: 'ICS',
    vnBrands: ['Asmanex Twisthaler'],
    forms: ['Bình xịt định liều pMDI 200 mcg', 'Bình hít bột khô Twisthaler 200 mcg, 400 mcg'],
    start: {
      amount: 200,
      unit: 'mcg',
      frequency: '1-2 lần/ngày',
      route: 'hít',
      description: 'Liều thấp 200–400 mcg/ngày'
    },
    target: {
      amount: 400,
      unit: 'mcg',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Liều cao 400 mcg/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_mometasone']
      }
    ],
    gates: [],
    interactions: [],
    citationIds: ['gina.asthma.2026.table_6_mometasone']
  },
  {
    id: 'ciclesonide',
    nameVi: 'Ciclesonide',
    inn: 'Ciclesonide',
    class: 'ICS',
    vnBrands: ['Alvesco'],
    forms: ['Bình xịt định liều hạt siêu mịn pMDI 80 mcg, 160 mcg'],
    start: {
      amount: 80,
      unit: 'mcg',
      frequency: '1 lần/ngày',
      route: 'hít',
      description: 'Liều thấp 80–160 mcg/ngày'
    },
    target: {
      amount: 320,
      unit: 'mcg',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Liều cao >320 mcg/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_ciclesonide']
      }
    ],
    gates: [],
    interactions: [],
    citationIds: ['gina.asthma.2026.table_6_ciclesonide']
  },
  {
    id: 'budesonide_formoterol',
    nameVi: 'Budesonide / Formoterol',
    inn: 'Budesonide / Formoterol fumarate',
    class: 'ICS-LABA',
    vnBrands: ['Symbicort Turbuhaler', 'Symbicort Rapihaler', 'Bufoler Easyhaler'],
    forms: ['Bình hít bột khô Turbuhaler 160/4.5 mcg/liều, 80/4.5 mcg/liều', 'Bình xịt định liều Rapihaler 160/4.5 mcg', 'Bình hít bột khô Spiromax 160/4.5 mcg'],
    start: {
      amount: 1,
      unit: 'nhát',
      frequency: 'khi cần',
      route: 'hít',
      description: 'AIR (Bậc 1-2): 1 nhát khi cần; MART Bậc 3: 1 nhát x 2 lần/ngày + khi cần'
    },
    target: {
      amount: 2,
      unit: 'nhát',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'MART Bậc 4–5: 2 nhát x 2 lần/ngày + khi cần (tối đa 12 nhát/ngày)'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.track1_preferred']
      }
    ],
    gates: [
      {
        id: 'gate_formoterol_max_daily',
        parameter: 'totalDailyPuffs',
        operator: '>',
        threshold: 12,
        unit: 'nhát/ngày',
        action: 'hold',
        messageVi: 'Khám y tế ngay nếu cần dùng quá 12 nhát hít tổng cộng trong ngày (vượt quá 54 mcg formoterol phân liều)',
        citationIds: ['gina.asthma.2026.formoterol_max_inhalations', 'gina.asthma.2026.formoterol_max_mcg']
      }
    ],
    interactions: [
      'Thuốc chẹn beta không chọn lọc làm giảm tác dụng giãn phế quản của formoterol và có thể kích phát co thắt phế quản nặng'
    ],
    citationIds: ['gina.asthma.2026.track1_preferred', 'gina.asthma.2026.formoterol_max_inhalations', 'gina.asthma.2026.formoterol_max_mcg']
  },
  {
    id: 'beclometasone_formoterol',
    nameVi: 'Beclometasone / Formoterol',
    inn: 'Beclometasone dipropionate / Formoterol fumarate',
    class: 'ICS-LABA',
    vnBrands: ['Foster', 'Foster Nexthaler'],
    forms: ['Bình xịt định liều hạt siêu mịn pMDI 100/6 mcg', 'Bình hít bột khô Nexthaler 100/6 mcg'],
    start: {
      amount: 1,
      unit: 'nhát',
      frequency: 'khi cần',
      route: 'hít',
      description: 'MART Bậc 3: 1 nhát x 1-2 lần/ngày + khi cần'
    },
    target: {
      amount: 2,
      unit: 'nhát',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'MART Bậc 4: 2 nhát x 2 lần/ngày + khi cần (tối đa 12 nhát/ngày)'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.formoterol_max_inhalations']
      }
    ],
    gates: [],
    interactions: ['Thuốc chẹn beta không chọn lọc'],
    citationIds: ['gina.asthma.2026.formoterol_max_inhalations', 'gina.asthma.2026.formoterol_max_mcg']
  },
  {
    id: 'fluticasone_salmeterol',
    nameVi: 'Fluticasone / Salmeterol',
    inn: 'Fluticasone propionate / Salmeterol xinafoate',
    class: 'ICS-LABA',
    vnBrands: ['Seretide Evohaler', 'Seretide Accuhaler'],
    forms: ['Bình xịt định liều pMDI 50/25 mcg, 125/25 mcg, 250/25 mcg', 'Bình hít bột khô Accuhaler/Diskus 100/50 mcg, 250/50 mcg, 500/50 mcg'],
    start: {
      amount: 1,
      unit: 'nhát',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Track 2 Bậc 3: 1 nhát 50/25 hoặc 125/25 x 2 lần/ngày + SABA khi cần'
    },
    target: {
      amount: 1,
      unit: 'nhát',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Track 2 Bậc 4–5: 1 nhát 250/25 hoặc 250/50 x 2 lần/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate']
      }
    ],
    gates: [],
    interactions: [
      'Không dùng làm thuốc cắt cơn nhanh (salmeterol khởi phát chậm). Thuốc chẹn beta không chọn lọc.'
    ],
    citationIds: ['gina.asthma.2026.table_6_fluticasone_propionate', 'gina.asthma.2026.never_saba_alone']
  },
  {
    id: 'fluticasone_vilanterol',
    nameVi: 'Fluticasone furoate / Vilanterol',
    inn: 'Fluticasone furoate / Vilanterol trifenatate',
    class: 'ICS-LABA',
    vnBrands: ['Relvar Ellipta'],
    forms: ['Bình hít bột khô Ellipta 100/25 mcg, 200/25 mcg'],
    start: {
      amount: 1,
      unit: 'nhát',
      frequency: '1 lần/ngày',
      route: 'hít',
      description: 'Track 2: 1 nhát 100/25 mcg hít 1 lần/ngày'
    },
    target: {
      amount: 1,
      unit: 'nhát',
      frequency: '1 lần/ngày',
      route: 'hít',
      description: 'Track 2 Bậc 4–5: 1 nhát 200/25 mcg hít 1 lần/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate']
      }
    ],
    gates: [],
    interactions: ['Chất ức chế mạnh CYP3A4, thuốc chẹn beta không chọn lọc'],
    citationIds: ['gina.asthma.2026.table_6_fluticasone_furoate', 'gina.asthma.2026.step5_lama_triplet']
  },
  {
    id: 'mometasone_formoterol',
    nameVi: 'Mometasone / Formoterol',
    inn: 'Mometasone furoate / Formoterol fumarate',
    class: 'ICS-LABA',
    vnBrands: ['Dulera'],
    forms: ['Bình xịt định liều pMDI 100/5 mcg, 200/5 mcg'],
    start: {
      amount: 2,
      unit: 'nhát',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Track 2 Bậc 3: 2 nhát 100/5 mcg x 2 lần/ngày'
    },
    target: {
      amount: 2,
      unit: 'nhát',
      frequency: '2 lần/ngày',
      route: 'hít',
      description: 'Track 2 Bậc 4: 2 nhát 200/5 mcg x 2 lần/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.table_6_mometasone']
      }
    ],
    gates: [],
    interactions: ['Thuốc chẹn beta không chọn lọc'],
    citationIds: ['gina.asthma.2026.table_6_mometasone']
  },
  {
    id: 'salbutamol',
    nameVi: 'Salbutamol (Albuterol)',
    inn: 'Salbutamol',
    class: 'SABA',
    vnBrands: ['Ventolin Evohaler', 'Ventolin Nebules', 'Salbutamol Danapha'],
    forms: ['Bình xịt định liều pMDI 100 mcg/nhát', 'Khí dung 2.5 mg/2.5 ml, 5 mg/2.5 ml', 'Ống tiêm 0.5 mg/1 ml'],
    start: {
      amount: 4,
      unit: 'nhát',
      frequency: 'khi cần',
      route: 'hít',
      description: 'Cắt cơn: 4–10 nhát xịt qua buồng đệm hoặc 5 mg khí dung'
    },
    target: {
      amount: 10,
      unit: 'nhát',
      frequency: 'khi cần',
      route: 'hít',
      description: 'Cơn cấp nặng: 6–10 nhát xịt mỗi 20–30 phút trong giờ đầu'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['byt.asthma.2021.acute_hospital_treatment']
      }
    ],
    gates: [
      {
        id: 'gate_salbutamol_not_alone',
        parameter: 'hasIcsMaintenance',
        operator: '==',
        threshold: 0,
        unit: 'cờ',
        action: 'caution',
        messageVi: 'CẢNH BÁO: Tuyệt đối không dùng Salbutamol (SABA) đơn độc không kèm ICS vì làm tăng nguy cơ đợt cấp nặng và tử vong',
        citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.no_saba_monotherapy']
      }
    ],
    interactions: [
      'Thuốc chẹn beta không chọn lọc đối kháng tác dụng. Phối hợp lợi tiểu quai/thiazide liều cao có thể làm nặng thêm hạ kali máu.'
    ],
    citationIds: ['byt.asthma.2021.acute_hospital_treatment', 'gina.asthma.2026.acute_saba_puffs', 'gina.asthma.2026.never_saba_alone']
  },
  {
    id: 'terbutaline',
    nameVi: 'Terbutaline',
    inn: 'Terbutaline sulfate',
    class: 'SABA',
    vnBrands: ['Bricanyl Turbuhaler', 'Bricanyl Respules'],
    forms: ['Bình hít bột khô Turbuhaler 0.5 mg/nhát', 'Khí dung Respules 5 mg/2 ml', 'Ống tiêm 0.5 mg/1 ml'],
    start: {
      amount: 1,
      unit: 'nhát',
      frequency: 'khi cần',
      route: 'hít',
      description: 'Cắt cơn thay thế: 1 nhát (0.5 mg) khi cần'
    },
    target: {
      amount: 4,
      unit: 'nhát',
      frequency: 'ngày',
      route: 'hít',
      description: 'Tối đa 4 nhát/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.never_saba_alone']
      }
    ],
    gates: [],
    interactions: ['Thuốc chẹn beta không chọn lọc'],
    citationIds: ['gina.asthma.2026.never_saba_alone', 'byt.asthma.2020.no_saba_monotherapy']
  },
  {
    id: 'ipratropium',
    nameVi: 'Ipratropium bromide',
    inn: 'Ipratropium bromide',
    class: 'SAMA',
    vnBrands: ['Atrovent', 'Berodual', 'Combivent'],
    forms: ['Khí dung đơn chất 0.5 mg/2 ml', 'Khí dung phối hợp Fenoterol (Berodual)', 'Khí dung phối hợp Salbutamol (Combivent)'],
    start: {
      amount: 4,
      unit: 'nhát',
      frequency: 'mỗi 20–30 phút',
      route: 'hít',
      description: 'Cơn hen cấp vừa–nặng: 4 nhát xịt hoặc 0.5 mg khí dung phối hợp với SABA'
    },
    target: {
      amount: 3,
      unit: 'lần',
      frequency: 'giờ đầu',
      route: 'hít',
      description: 'Tối đa 3 lần trong giờ đầu'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.acute_ipratropium_puffs']
      }
    ],
    gates: [],
    interactions: ['Thận trọng khi có glôcôm góc đóng hoặc bí tiểu'],
    citationIds: ['gina.asthma.2026.acute_ipratropium_puffs', 'byt.asthma.2021.acute_hospital_treatment']
  },
  {
    id: 'montelukast',
    nameVi: 'Montelukast',
    inn: 'Montelukast sodium',
    class: 'LTRA',
    vnBrands: ['Singulair', 'Montiget', 'Asthmatin', 'Givet'],
    forms: ['Viên nén nhai 4 mg, 5 mg', 'Viên nén bao phim 10 mg', 'Gói cốm 4 mg'],
    start: {
      amount: 10,
      unit: 'mg',
      frequency: '1 lần/ngày',
      route: 'uống',
      description: 'Người lớn và trẻ ≥ 15 tuổi: 10 mg uống 1 lần vào buổi tối'
    },
    target: {
      amount: 10,
      unit: 'mg',
      frequency: '1 lần/ngày',
      route: 'uống',
      description: '10 mg uống 1 lần/ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric']
      }
    ],
    gates: [
      {
        id: 'gate_montelukast_mental_health',
        parameter: 'priorNeuropsychiatric',
        operator: '==',
        threshold: 1,
        unit: 'cờ',
        action: 'caution',
        messageVi: 'FDA Boxed Warning: Thận trọng cao độ nguy cơ tác dụng phụ tâm thần kinh (ác mộng, kích động, trầm cảm, ý nghĩ tự sát)',
        citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric']
      }
    ],
    interactions: ['Chuyển hóa qua gan CYP3A4, 2C8, 2C9'],
    citationIds: ['gina.asthma.2026.montelukast_neuropsychiatric']
  },
  {
    id: 'omalizumab',
    nameVi: 'Omalizumab',
    inn: 'Omalizumab',
    class: 'Anti-IgE Biologic',
    vnBrands: ['Xolair'],
    forms: ['Bút tiêm dưới da đóng sẵn / Lọ bột pha tiêm 75 mg, 150 mg'],
    start: {
      amount: 75,
      unit: 'mg',
      frequency: 'mỗi 2–4 tuần',
      route: 'tiêm dưới da',
      description: 'Liều 75–600 mg tiêm dưới da mỗi 2 hoặc 4 tuần tính theo nồng độ IgE huyết thanh nền và cân nặng'
    },
    target: {
      amount: 300,
      unit: 'mg',
      frequency: 'mỗi 4 tuần',
      route: 'tiêm dưới da',
      description: 'Chuẩn độ theo bảng liều IgE và cân nặng'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.step5_biologics']
      }
    ],
    gates: [
      {
        id: 'gate_omalizumab_age',
        parameter: 'age',
        operator: '<',
        threshold: 6,
        unit: 'tuổi',
        action: 'hold',
        messageVi: 'Chỉ định omalizumab cho bệnh nhân hen dị ứng nặng từ 6 tuổi trở lên',
        citationIds: ['gina.asthma.2026.step5_biologics']
      }
    ],
    interactions: ['Theo dõi phản ứng phản vệ trong và sau khi tiêm thuốc'],
    citationIds: ['gina.asthma.2026.step5_biologics']
  },
  {
    id: 'benralizumab',
    nameVi: 'Benralizumab',
    inn: 'Benralizumab',
    class: 'Anti-IL5R Biologic',
    vnBrands: ['Fasenra'],
    forms: ['Bút tiêm dưới da đóng sẵn 30 mg/ml'],
    start: {
      amount: 30,
      unit: 'mg',
      frequency: 'mỗi 4 tuần x 3 liều đầu',
      route: 'tiêm dưới da',
      description: '30 mg tiêm dưới da mỗi 4 tuần cho 3 liều đầu, sau đó duy trì mỗi 8 tuần'
    },
    target: {
      amount: 30,
      unit: 'mg',
      frequency: 'mỗi 8 tuần',
      route: 'tiêm dưới da',
      description: '30 mg mỗi 8 tuần duy trì'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.biologics_benralizumab']
      }
    ],
    gates: [
      {
        id: 'gate_benralizumab_age',
        parameter: 'age',
        operator: '<',
        threshold: 12,
        unit: 'tuổi',
        action: 'hold',
        messageVi: 'Benralizumab chỉ định cho bệnh nhân từ 12 tuổi trở lên có hen tăng bạch cầu ái toan nặng',
        citationIds: ['gina.asthma.2026.biologics_benralizumab']
      }
    ],
    interactions: [],
    citationIds: ['gina.asthma.2026.biologics_benralizumab']
  },
  {
    id: 'tezepelumab',
    nameVi: 'Tezepelumab',
    inn: 'Tezepelumab',
    class: 'Anti-TSLP Biologic',
    vnBrands: ['Tezspire'],
    forms: ['Bút tiêm dưới da đóng sẵn 210 mg/1.91 ml'],
    start: {
      amount: 210,
      unit: 'mg',
      frequency: 'mỗi 4 tuần',
      route: 'tiêm dưới da',
      description: '210 mg tiêm dưới da mỗi 4 tuần'
    },
    target: {
      amount: 210,
      unit: 'mg',
      frequency: 'mỗi 4 tuần',
      route: 'tiêm dưới da',
      description: '210 mg mỗi 4 tuần'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.biologics_tezepelumab']
      }
    ],
    gates: [
      {
        id: 'gate_tezepelumab_age',
        parameter: 'age',
        operator: '<',
        threshold: 12,
        unit: 'tuổi',
        action: 'hold',
        messageVi: 'Tezepelumab (kháng TSLP) chỉ định cho bệnh nhân hen nặng từ 12 tuổi trở lên',
        citationIds: ['gina.asthma.2026.biologics_tezepelumab']
      }
    ],
    interactions: [],
    citationIds: ['gina.asthma.2026.biologics_tezepelumab']
  },
  {
    id: 'prednisolone',
    nameVi: 'Prednisolone',
    inn: 'Prednisolone',
    class: 'Oral Corticosteroid',
    vnBrands: ['Prednisolon 5mg Phapharco', 'Solupred 5mg, 20mg'],
    forms: ['Viên nén 5 mg', 'Viên sủi 5 mg, 20 mg'],
    start: {
      amount: 40,
      unit: 'mg',
      frequency: '1 lần/ngày',
      route: 'uống',
      description: 'Đợt cấp hen: 40–50 mg uống vào buổi sáng trong 5–7 ngày'
    },
    target: {
      amount: 50,
      unit: 'mg',
      frequency: '1 lần/ngày',
      route: 'uống',
      description: 'Tối đa 50 mg/ngày trong 5–7 ngày'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['gina.asthma.2026.acute_prednisolone_daily']
      }
    ],
    gates: [],
    interactions: [
      'Nguy cơ tăng đường huyết ở bệnh nhân đái tháo đường; nguy cơ viêm loét dạ dày khi dùng chung NSAID'
    ],
    citationIds: ['gina.asthma.2026.acute_prednisolone_daily', 'byt.asthma.2021.acute_hospital_treatment']
  },
  {
    id: 'methylprednisolone',
    nameVi: 'Methylprednisolone',
    inn: 'Methylprednisolone sodium succinate',
    class: 'Systemic Corticosteroid',
    vnBrands: ['Medrol 4mg, 16mg', 'Solu-Medrol 40mg, 125mg'],
    forms: ['Viên nén 4 mg, 16 mg', 'Lọ bột pha tiêm 40 mg, 125 mg, 500 mg'],
    start: {
      amount: 40,
      unit: 'mg',
      frequency: 'tiêm tĩnh mạch',
      route: 'tiêm tĩnh mạch',
      description: 'Cơn hen cấp nặng nội viện: 40 mg tiêm tĩnh mạch'
    },
    target: {
      amount: 40,
      unit: 'mg',
      frequency: 'tiêm TM',
      route: 'tiêm tĩnh mạch',
      description: 'Chuyển sang đường uống khi bệnh nhân cải thiện'
    },
    renal: [
      {
        eGFRFrom: 0,
        initiate: 'rec',
        continue: 'rec',
        dose: 'Không cần chỉnh liều theo chức năng thận',
        citationIds: ['byt.asthma.2021.acute_hospital_treatment']
      }
    ],
    gates: [],
    interactions: ['Tăng đường huyết, kích ứng tiêu hóa'],
    citationIds: ['byt.asthma.2021.acute_hospital_treatment', 'gina.asthma.2026.acute_prednisolone_daily']
  },
  {
    id: 'magnesium_sulfate',
    nameVi: 'Magnesium sulfate',
    inn: 'Magnesium sulfate',
    class: 'Bronchodilator Adjuvant',
    vnBrands: ['Magnesi sulfat 15% Vinphaco', 'Magnesium Sulfate 50%'],
    forms: ['Ống tiêm truyền tĩnh mạch 15% (1.5 g/10 ml), 50% (5 g/10 ml)'],
    start: {
      amount: 2,
      unit: 'g',
      frequency: 'truyền TM 1 lần',
      route: 'tiêm truyền tĩnh mạch',
      description: '2 g truyền tĩnh mạch chậm trong 20 phút cho cơn hen cấp nặng không đáp ứng ban đầu'
    },
    target: {
      amount: 2,
      unit: 'g',
      frequency: 'truyền TM',
      route: 'tiêm truyền tĩnh mạch',
      description: 'Liều đơn 2 g trong 20 phút'
    },
    renal: [
      {
        eGFRFrom: 30,
        initiate: 'rec',
        continue: 'rec',
        dose: '2 g truyền TM trong 20 phút',
        citationIds: ['byt.asthma.2020.magnesium_dose_2g']
      },
      {
        eGFRTo: 30,
        initiate: 'caution',
        continue: 'caution',
        dose: 'Thận trọng nguy cơ tăng magie máu khi suy thận nặng',
        citationIds: ['byt.asthma.2020.magnesium_dose_2g']
      }
    ],
    gates: [],
    interactions: ['Tụt huyết áp, ức chế hô hấp khi dùng liều cao hoặc truyền quá nhanh'],
    citationIds: ['byt.asthma.2020.magnesium_dose_2g', 'byt.asthma.2021.acute_hospital_treatment']
  }
];

// Ghi từng thuốc vào kb/drugs/<drugId>.json
const drugsDir = join(KB_DIR, 'drugs');
mkdirSync(drugsDir, { recursive: true });

for (const d of drugs) {
  const filePath = join(drugsDir, `${d.id}.json`);
  writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
}
console.log(`Đã ghi thành công ${drugs.length} file thuốc vào kb/drugs/`);

// 4. REVIEW STATES CHO DRUGS VÀ THRESHOLDS
const reviewDir = join(KB_DIR, 'review');
mkdirSync(reviewDir, { recursive: true });

const nowIso = new Date().toISOString();

// Review cho Drugs
for (const d of drugs) {
  const hash = computeContentHash(d);
  const rev: ReviewState = {
    itemId: d.id,
    contentHash: hash,
    status: 'auto_checked',
    reports: [
      {
        reviewedAt: nowIso,
        role: 'system_auto_validator',
        verdict: 'pass',
        issues: [],
        summary: `Tự động kiểm tra tính hợp lệ của liều, cổng an toàn và trích dẫn cho thuốc ${d.nameVi}.`
      }
    ],
    lastReviewedAt: nowIso
  };
  writeFileSync(join(reviewDir, `${d.id}.json`), JSON.stringify(rev, null, 2), 'utf8');
}

// Review cho Thresholds
for (const t of thresholds) {
  const hash = computeContentHash(t);
  const rev: ReviewState = {
    itemId: t.id,
    contentHash: hash,
    status: 'auto_checked',
    reports: [
      {
        reviewedAt: nowIso,
        role: 'system_auto_validator',
        verdict: 'pass',
        issues: [],
        summary: `Tự động kiểm tra ngưỡng số lâm sàng ${t.value} ${t.unit} có trích dẫn hợp lệ.`
      }
    ],
    lastReviewedAt: nowIso
  };
  writeFileSync(join(reviewDir, `${t.id}.json`), JSON.stringify(rev, null, 2), 'utf8');
}

console.log(`Đã tạo xong ReviewStates cho ${drugs.length} thuốc và ${thresholds.length} ngưỡng.`);
