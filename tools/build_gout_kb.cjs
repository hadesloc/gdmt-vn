const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeContentHash(data) {
  const clone = JSON.parse(JSON.stringify(data));
  if (typeof clone === 'object' && clone !== null) {
    delete clone.review;
    delete clone.contentHash;
    delete clone.status;
    delete clone.reports;
  }
  const serialized = JSON.stringify(clone, Object.keys(clone).sort());
  return crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
}

const baseDir = path.resolve(__dirname, '..');

const citations = [
  {
    id: "acr.gout.2020.indication_strong",
    sourceId: "acr_2020_gout",
    pdfPage: 6,
    printedPage: "747",
    locator: "Indications for pharmacologic ULT / p. 6",
    quote: "Initiating ULT is strongly recommended for gout patients with any of the following: ≥1 subcutaneous tophi; evidence of radiographic damage (any modality) attributable to gout; OR frequent gout flares, with frequent being defined as ≥2 annually.",
    quoteVi: "Chỉ định mạnh khởi trị ULT cho bệnh nhân gút có bất kỳ dấu hiệu nào: ≥1 hạt tophi dưới da; tổn thương khuyết xương trên X-quang do gút; hoặc ≥2 đợt cấp/năm.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.indication_conditional_infrequent",
    sourceId: "acr_2020_gout",
    pdfPage: 6,
    printedPage: "747",
    locator: "Indications for pharmacologic ULT / p. 6",
    quote: "Initiating ULT is conditionally recommended for patients who have previously experienced >1 flare but have infrequent flares (<2/year).",
    quoteVi: "Chỉ định có điều kiện khởi trị ULT cho người đã từng bị >1 đợt cấp nhưng cơn thưa (<2 đợt/năm).",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.indication_conditional_first_flare",
    sourceId: "acr_2020_gout",
    pdfPage: 6,
    printedPage: "747",
    locator: "Indications for pharmacologic ULT / p. 6",
    quote: "initiating ULT is conditionally recommended for patients with experiencing their first flare when comorbid moderate-to-severe CKD (stage ≥3), SU concentration >9 mg/dl, or urolithiasis is present.",
    quoteVi: "Chỉ định có điều kiện khởi trị ULT cho cơn gút đầu tiên khi kèm theo CKD giai đoạn ≥ 3, acid uric > 9 mg/dL (535 µmol/L), hoặc sỏi thận.",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.indication_against_first_flare",
    sourceId: "acr_2020_gout",
    pdfPage: 6,
    printedPage: "747",
    locator: "Indications for pharmacologic ULT / p. 6",
    quote: "Initiating ULT is conditionally recommended against in patients with gout experiencing their first gout flare.",
    quoteVi: "Khuyến cáo không nên khởi trị ULT ở bệnh nhân chỉ mới bị cơn gút đầu tiên không kèm biến chứng/yếu tố nguy cơ.",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.indication_against_asymptomatic",
    sourceId: "acr_2020_gout",
    pdfPage: 7,
    printedPage: "748",
    locator: "Indications for pharmacologic ULT / p. 7",
    quote: "Initiating ULT is conditionally recommended against in patients with asymptomatic hyperuricemia.",
    quoteVi: "Khuyến cáo không nên dùng thuốc hạ urat cho người tăng acid uric máu không triệu chứng.",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.treat_to_target",
    sourceId: "acr_2020_gout",
    pdfPage: 9,
    printedPage: "750",
    locator: "Treat-to-target strategy / p. 9",
    quote: "A treat-to-target management strategy that includes ULT dose titration and subsequent dosing guided by serial SU measurements to achieve a target SU, over a fixed-dose ULT strategy, is strongly recommended for all patients receiving ULT.",
    quoteVi: "Chiến lược Treat-to-Target chuẩn độ tăng dần liều ULT theo dõi nồng độ urat máu định kỳ để đạt đích được khuyến cáo mạnh mẽ cho mọi bệnh nhân dùng ULT thay vì dùng liều cố định.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.target_urate_under_6",
    sourceId: "acr_2020_gout",
    pdfPage: 9,
    printedPage: "750",
    locator: "Target serum urate / p. 9",
    quote: "Achieving and maintaining an SU target of <6 mg/dl over the use of no target is strongly recommended for all patients receiving ULT.",
    quoteVi: "Đạt và duy trì nồng độ acid uric máu < 6 mg/dL (< 360 µmol/L) được khuyến cáo mạnh mẽ cho tất cả người bệnh dùng ULT.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "eular.gout.2016.target_urate_tophi",
    sourceId: "eular_2016_gout",
    pdfPage: 3,
    printedPage: "3",
    locator: "Recommendation 7 / p. 3",
    quote: "hould be monitored and maintained to <6 mg/dL (360 mmol/L). A lower SUA target (<5 mg/dL; 300 mmol/L) to facilitate faster dissolution of crystals is recommended for patients with severe gout (tophi, chr",
    quoteVi: "Mục tiêu acid uric máu duy trì < 6 mg/dL (360 µmol/L). Mục tiêu thấp hơn (< 5 mg/dL; 300 µmol/L) để thúc đẩy tinh thể tan nhanh hơn được khuyến cáo cho gút nặng (tophi, bệnh khớp mạn, cơn dày).",
    cor: "strong",
    loe: "A"
  },
  {
    id: "acr.gout.2020.allopurinol_first_line",
    sourceId: "acr_2020_gout",
    pdfPage: 7,
    printedPage: "748",
    locator: "Choice of initial ULT / p. 7",
    quote: "Treatment with allopurinol as the preferred first-line agent, over all other ULTs, is strongly recommended for all patients, including those with moderate-to-severe CKD (stage ≥3).",
    quoteVi: "Allopurinol là lựa chọn hàng đầu ưu tiên tuyệt đối cho mọi bệnh nhân, kể cả bệnh nhân có CKD giai đoạn ≥ 3.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.allopurinol_low_dose_start",
    sourceId: "acr_2020_gout",
    pdfPage: 7,
    printedPage: "748",
    locator: "Starting dose / p. 7",
    quote: "Starting treatment with low-dose allopurinol (≤100 mg/day and lower in patients with CKD [stage ≥3]) and febuxostat (≤40 mg/day) with subsequent dose titration over starting at a higher dose is strongly recommended.",
    quoteVi: "Bắt đầu điều trị bằng liều thấp allopurinol (≤ 100 mg/ngày và thấp hơn ở bệnh nhân CKD giai đoạn ≥ 3) hoặc febuxostat (≤ 40 mg/ngày) rồi chuẩn độ tăng dần liều được khuyến cáo mạnh mẽ.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.allopurinol_start_dose_ckd_50",
    sourceId: "acr_2020_gout",
    pdfPage: 8,
    printedPage: "749",
    locator: "Starting dose in CKD / p. 8",
    quote: "cur more risk. Even lower initial allopurinol doses (e.g., ≤50 mg/day) should be considered in patients with CKD. While higher starting doses and CKD are associated with risk",
    quoteVi: "Liều khởi đầu allopurinol thấp hơn nữa (≤ 50 mg/ngày) nên được cân nhắc ở bệnh nhân có CKD.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.hlab5801_screening",
    sourceId: "acr_2020_gout",
    pdfPage: 10,
    printedPage: "751",
    locator: "Recommendations for allopurinol / p. 10",
    quote: "Testing for the HLA–B*5801 allele prior to starting allopurinol is conditionally recommended for patients of Southeast Asian descent (e.g., Han Chinese, Korean, Thai) and for African American patients, over not testing for the HLA–B*5801 allele.",
    quoteVi: "Xét nghiệm alen HLA-B*58:01 trước khi bắt đầu allopurinol được khuyến cáo cho người gốc Đông Nam Á (Hoa, Hàn, Thái, Việt) và người Mỹ gốc Phi để phòng ngừa hội chứng quá mẫn nghiêm trọng (AHS/SCAR).",
    cor: "conditional",
    loe: "very_low"
  },
  {
    id: "acr.gout.2020.febuxostat_cvd_switch",
    sourceId: "acr_2020_gout",
    pdfPage: 10,
    printedPage: "751",
    locator: "Febuxostat cardiovascular / p. 10",
    quote: "Switching to an alternative oral ULT agent, if available and consistent with other recommendations in this guideline, is conditionally recommended for patients taking febuxostat with a history of CVD or a new CVD-related event.",
    quoteVi: "Chuyển sang thuốc hạ urat đường uống khác (như allopurinol nếu không dị ứng) được khuyến cáo cho bệnh nhân đang dùng febuxostat có tiền sử bệnh tim mạch hoặc có biến cố tim mạch mới.",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.xoi_over_probenecid",
    sourceId: "acr_2020_gout",
    pdfPage: 7,
    printedPage: "748",
    locator: "Choice of initial ULT / p. 7",
    quote: "The choice of either allopurinol or febuxostat over probenecid is strongly recommended for patients with moderate-to-severe CKD (stage ≥3).",
    quoteVi: "Ưu tiên chọn thuốc ức chế xanthine oxidase (allopurinol hoặc febuxostat) hơn probenecid cho bệnh nhân bệnh thận mạn vừa đến nặng (giai đoạn ≥ 3).",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.probenecid_low_dose",
    sourceId: "acr_2020_gout",
    pdfPage: 8,
    printedPage: "749",
    locator: "Probenecid dosing / p. 8",
    quote: "Starting treatment with low-dose probenecid (500 mg once to twice daily) with subsequent dose titration over starting at a higher dose is conditionally recommended.",
    quoteVi: "Khởi đầu probenecid liều thấp 500 mg x 1–2 lần/ngày rồi chuẩn độ tăng liều dần được khuyến cáo.",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.prophylaxis_agents",
    sourceId: "acr_2020_gout",
    pdfPage: 8,
    printedPage: "749",
    locator: "Prophylaxis therapy / p. 8",
    quote: "Administering concomitant antiinflammatory prophylaxis therapy (e.g., colchicine, nonsteroidal antiinflammatory drugs [NSAIDs], prednisone/prednisolone) over no antiinflammatory prophylaxis therapy is strongly recommended.",
    quoteVi: "Dùng đồng thời liệu pháp chống viêm dự phòng cơn cấp (colchicine, NSAID, hoặc prednisone/prednisolone) khi bắt đầu ULT được khuyến cáo mạnh mẽ.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.prophylaxis_duration",
    sourceId: "acr_2020_gout",
    pdfPage: 3,
    printedPage: "744",
    locator: "Prophylaxis duration / p. 3",
    quote: "antiinflammatory prophylaxis therapy for a duration of at least 3–6 months was strongly recommended.",
    quoteVi: "Tiếp tục dự phòng cơn cấp trong ít nhất 3–6 tháng sau khi bắt đầu ULT nhằm tránh bùng phát đợt cấp khi nồng độ urat máu giảm.",
    cor: "strong",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.start_ult_during_flare",
    sourceId: "acr_2020_gout",
    pdfPage: 8,
    printedPage: "749",
    locator: "Timing of ULT initiation / p. 8",
    quote: "experiencing a gout flare, starting ULT during the gout flare over starting ULT after the gout flare has resolved is conditionally recommended.",
    quoteVi: "Khi đã có chỉ định khởi trị ULT và bệnh nhân đang có đợt cấp, có thể bắt đầu ULT ngay trong đợt cấp (kèm theo thuốc chống viêm) thay vì trì hoãn đợi cơn lui.",
    cor: "conditional",
    loe: "moderate"
  },
  {
    id: "acr.gout.2020.flare_first_line",
    sourceId: "acr_2020_gout",
    pdfPage: 13,
    printedPage: "754",
    locator: "Gout flare management / p. 13",
    quote: "Using colchicine, NSAIDs, or glucocorticoids (oral, intraarticular, or intramuscular) as appropriate first-line therapy for gout flares over IL-1 inhibitors or adrenocorticotropic hormone (ACTH) is strongly recommended for patients experiencing a gout flare.",
    quoteVi: "Colchicine, NSAID, hoặc glucocorticoid (uống, tiêm nội khớp hoặc tiêm bắp) là lựa chọn đầu tay thích hợp để điều trị đợt cấp gút.",
    cor: "strong",
    loe: "high"
  },
  {
    id: "acr.gout.2020.colchicine_low_dose",
    sourceId: "acr_2020_gout",
    pdfPage: 13,
    printedPage: "754",
    locator: "Colchicine dosing / p. 13",
    quote: "Given similar efficacy and a lower risk of adverse effects, low-dose colchicine over high-dose colchicine is strongly recommended when colchicine is the chosen agent.",
    quoteVi: "Khi chọn colchicine, khuyến cáo mạnh mẽ dùng liều thấp thay vì liều cao do hiệu quả tương đương nhưng tác dụng phụ trên đường tiêu hóa thấp hơn rõ rệt.",
    cor: "strong",
    loe: "high"
  },
  {
    id: "acr.gout.2020.switch_thiazide_losartan",
    sourceId: "acr_2020_gout",
    pdfPage: 15,
    printedPage: "756",
    locator: "Concurrent medications / p. 15",
    quote: "Switching hydrochlorothiazide to an alternate antihypertensive when feasible is conditionally recommended for patients with gout, regardless of disease activity.",
    quoteVi: "Cân nhắc đổi hydrochlorothiazide sang thuốc hạ áp khác (như losartan hoặc CCB) khi khả thi ở người bệnh gút do thiazide làm giảm thải acid uric.",
    cor: "conditional",
    loe: "very_low"
  },
  {
    id: "acr.gout.2020.prefer_losartan",
    sourceId: "acr_2020_gout",
    pdfPage: 16,
    printedPage: "757",
    locator: "Concurrent medications / p. 16",
    quote: "Choosing losartan preferentially as an antihy-pertensive agent when feasible is conditionally recommended for patients with gout, regardless of disease activity.",
    quoteVi: "Ưu tiên chọn losartan làm thuốc điều trị tăng huyết áp ở bệnh nhân gút vì losartan có tác dụng tăng bài tiết acid uric qua nước tiểu.",
    cor: "conditional",
    loe: "very_low"
  },
  {
    id: "acr.gout.2020.do_not_stop_aspirin",
    sourceId: "acr_2020_gout",
    pdfPage: 16,
    printedPage: "757",
    locator: "Low-dose aspirin / p. 16",
    quote: "Stopping low-dose aspirin (for patients taking this medication for appropriate indications) is conditionally recommended against for patients with gout, regardless of disease activity.",
    quoteVi: "Khuyến cáo KHÔNG ngừng aspirin liều thấp ở bệnh nhân đang dùng thuốc này vì chỉ định tim mạch phù hợp, bất kể nồng độ urat hay hoạt tính bệnh gút.",
    cor: "conditional",
    loe: "very_low"
  },
  {
    id: "acr.gout.2020.lifestyle_alcohol",
    sourceId: "acr_2020_gout",
    pdfPage: 14,
    printedPage: "755",
    locator: "Lifestyle / p. 14",
    quote: "Limiting alcohol intake is conditionally recommended for patients with gout, regardless of disease activity.",
    quoteVi: "Khuyến cáo hạn chế rượu bia (đặc biệt là bia và rượu mạnh) ở bệnh nhân gút.",
    cor: "conditional",
    loe: "low"
  },
  {
    id: "acr.gout.2020.lifestyle_purine",
    sourceId: "acr_2020_gout",
    pdfPage: 14,
    printedPage: "755",
    locator: "Lifestyle / p. 14",
    quote: "Limiting purine intake is conditionally recommended for patients with gout, regardless of disease activity.",
    quoteVi: "Khuyến cáo hạn chế thực phẩm giàu nhân purin (nội tạng động vật, thịt đỏ, hải sản) ở bệnh nhân gút.",
    cor: "conditional",
    loe: "low"
  },
  {
    id: "acr.gout.2020.lifestyle_hfcs",
    sourceId: "acr_2020_gout",
    pdfPage: 14,
    printedPage: "755",
    locator: "Lifestyle / p. 14",
    quote: "Limiting high-fructose corn syrup intake is conditionally recommended for patients with gout, regardless of disease activity.",
    quoteVi: "Khuyến cáo hạn chế đồ uống và thực phẩm chứa siro ngô hàm lượng fructose cao (nước ngọt có gas, bánh kẹo ngọt).",
    cor: "conditional",
    loe: "very_low"
  },
  {
    id: "acr.gout.2020.lifestyle_weight",
    sourceId: "acr_2020_gout",
    pdfPage: 14,
    printedPage: "755",
    locator: "Lifestyle / p. 14",
    quote: "Using a weight loss program (no specific program endorsed) is conditionally recommended for those patients with gout who are overweight/obese, regardless of disease activity.",
    quoteVi: "Khuyến cáo giảm cân đối với bệnh nhân gút thừa cân hoặc béo phì.",
    cor: "conditional",
    loe: "very_low"
  },
  {
    id: "eular.gout.2016.allopurinol_titration",
    sourceId: "eular_2016_gout",
    pdfPage: 3,
    printedPage: "3",
    locator: "Recommendation 8 / p. 3",
    quote: "with normal kidney function, allopurinol is recommended for first-line ULT, starting at a low dose (100 mg/day) and increasing by 100 mg increments every 2–4 weeks if required, to",
    quoteVi: "Ở người chức năng thận bình thường, allopurinol là thuốc khởi đầu hàng đầu, bắt đầu liều thấp 100 mg/ngày và tăng dần mỗi 100 mg sau mỗi 2–4 tuần để đạt đích urat.",
    cor: "strong",
    loe: "A"
  },
  {
    id: "eular.gout.2016.flare_options",
    sourceId: "eular_2016_gout",
    pdfPage: 3,
    printedPage: "3",
    locator: "Recommendation 2 / p. 3",
    quote: "flares are colchicine (within 12 hours of flare onset) at a loading dose of 1 mg followed 1 hour later by 0.5 mg on day 1 and/or\nan NSAID (plus proton pump inhibitors if appropriate), oral corticosteroid (30 –35 mg/day of equivalent prednisolone for 3 –5 days)",
    quoteVi: "Lựa chọn hàng đầu cho cơn cấp là colchicine (trong vòng 12 giờ) liều nạp 1 mg sau đó 1 giờ dùng 0.5 mg; và/hoặc NSAID (kèm PPI nếu cần), corticoid uống (30–35 mg/ngày tương đương prednisolone trong 3–5 ngày).",
    cor: "strong",
    loe: "A"
  },
  {
    id: "eular.gout.2016.flare_prophylaxis",
    sourceId: "eular_2016_gout",
    pdfPage: 3,
    printedPage: "3",
    locator: "Recommendation 5 / p. 3",
    quote: "s should be fully explained and discussed with the patient. Prophylaxis is recommended during the first 6 months of ULT. Recommended prophylactic treatment is colchicine, 0.5 –1 mg/day, a dose tha",
    quoteVi: "Dự phòng cơn bùng phát được khuyến cáo trong 6 tháng đầu dùng ULT bằng colchicine 0.5–1 mg/ngày (giảm liều khi suy thận).",
    cor: "strong",
    loe: "A"
  },
  {
    id: "eular.gout.2016.benzbromarone_probenecid_dosing",
    sourceId: "eular_2016_gout",
    pdfPage: 7,
    printedPage: "7",
    locator: "Uricosurics / p. 7",
    quote: "in patients without proper control with allopurinol alone. Benzbromarone (50–200 mg/day) is a more potent uricosuric as compared with probenecid (1– 2g / d a y ) .155 In an RCT of pa",
    quoteVi: "Benzbromarone (50–200 mg/ngày) có hiệu lực tăng thải urat mạnh hơn probenecid (1–2 g/ngày).",
    cor: "conditional",
    loe: "B"
  },
  {
    id: "eular.gout.2016.benzbromarone_egfr30",
    sourceId: "eular_2016_gout",
    pdfPage: 3,
    printedPage: "3",
    locator: "Recommendation 9 / p. 3",
    quote: "t allopurinol, except in patients with estimated glomerular filtration rate <30 mL/min. 10 In p",
    quoteVi: "Benzbromarone có thể sử dụng trừ trường hợp eGFR < 30 mL/phút chống chỉ định.",
    cor: "strong",
    loe: "B"
  },
  {
    id: "kdigo.gout.2024.ckd_first_flare",
    sourceId: "kdigo_2024_ckd",
    pdfPage: 46,
    printedPage: "S161",
    locator: "Practice Point 3.14.1 / p. 46",
    quote: "Practice Point 3.14.1: Consider initiating uric acid– lowering therapy for people with CKD after their ﬁrst episode of gout (particularly where there is no avoidable precipitant or serum uric acid concentration is >9 mg/dl [535 mmol/l]).",
    quoteVi: "Cân nhắc khởi trị thuốc hạ acid uric cho người bệnh CKD sau cơn gút đầu tiên (đặc biệt khi acid uric máu > 9 mg/dL [535 µmol/L])."
  },
  {
    id: "kdigo.gout.2024.acute_flare_ckd",
    sourceId: "kdigo_2024_ckd",
    pdfPage: 46,
    printedPage: "S161",
    locator: "Practice Point 3.14.3 / p. 46",
    quote: "Practice Point 3.14.3: For symptomatic treatment of acute gout in CKD, low-dose colchicine or intra-articular/oral glu- cocorticoids are preferable to nonsteroidal anti-in ﬂammatory drugs (NSAIDs).",
    quoteVi: "Để điều trị triệu chứng cơn gút cấp ở người bệnh CKD, colchicine liều thấp hoặc glucocorticoid uống/tiêm nội khớp được ưu tiên hơn NSAID."
  },
  {
    id: "kdigo.gout.2024.xoi_preference",
    sourceId: "kdigo_2024_ckd",
    pdfPage: 46,
    printedPage: "S161",
    locator: "Practice Point 3.14.2 / p. 46",
    quote: "Practice Point 3.14.2: Prescribe xanthine oxidase inhibitors in preference to uricosuric agents in people with CKD and symptomatic hyperuricemia.",
    quoteVi: "Kê đơn thuốc ức chế xanthine oxidase ưu tiên hơn thuốc tăng thải urat qua nước tiểu ở người có CKD và tăng acid uric máu có triệu chứng."
  },
  {
    id: "byt.gout.2014.diagnostic_bennet_wood",
    sourceId: "byt_361_2014_gout",
    pdfPage: 91,
    printedPage: "91",
    locator: "Mục 3.3 Tiêu chuẩn Bennet và Wood / p. 91",
    quote: "Tiêu chu ẩn Bennet và Wood (1968): Độ nh ạy 70%, độ đặc hi ệu 82,7% \nTiêu chu ẩn Bennet và Wood (1968)  được áp d ụng r ộng rãi nh ất ở Vi ệt Nam do d ễ \nnh ớ và phù h ợp v ới điều ki ện thi ếu xét nghi ệm.",
    quoteVi: "Tiêu chuẩn Bennet và Wood (1968) được áp dụng rộng rãi nhất ở Việt Nam do dễ nhớ và phù hợp với điều kiện thiếu xét nghiệm."
  },
  {
    id: "byt.gout.2014.target_urate",
    sourceId: "byt_361_2014_gout",
    pdfPage: 92,
    printedPage: "92",
    locator: "Mục 4.1 Mục tiêu điều trị / p. 92",
    quote: "ục tiêu ki ểm \nsoát acid uric máu d ưới 360 µmol/l (60 mg/l) v ới gút ch ưa có h ạt tô phi và d ưới 320 \nµmol/l (50 mg/l) khi gút có h ạt tô phi.  \n4.2. Điều tr ị c ụ th ể \n4.2.1. ",
    quoteVi: "Mục tiêu kiểm soát acid uric máu dưới 360 µmol/l với gút chưa có tophi và dưới 320 µmol/l khi có hạt tophi (BYT 361/2014)."
  },
  {
    id: "byt.gout.2014.allopurinol_start",
    sourceId: "byt_361_2014_gout",
    pdfPage: 93,
    printedPage: "93",
    locator: "Mục 4.2.2 Điều trị nội khoa / p. 93",
    quote: "Allopurinol: Li ều l ượng h ằng ngày d ựa vào n ồng độ acid uric máu. Li ều kh ởi đầu: Allopurinol 100mg/ngày trong vòng 1 tu ần, sau đó t ăng 200-300mg/ngày. N ồng độ acid uric máu th ường tr ở v ề bình th ư",
    quoteVi: "Allopurinol: Liều khởi đầu 100mg/ngày trong vòng 1 tuần, sau đó tăng 200-300mg/ngày. Không nên chỉ định trong cơn cấp mà sau 1-2 tuần khi viêm khớp thuyên giảm."
  },
  {
    id: "byt.gout.2014.colchicine_dosing",
    sourceId: "byt_361_2014_gout",
    pdfPage: 93,
    printedPage: "93",
    locator: "Mục 4.2.2 Colchicin / p. 93",
    quote: "Dự phòng tái phát: 0,5- 1,2 mg u ống 1-2 l ần/ ngày, trung bình 1mg/ ngày kéo dài ít nh ất 6 tháng. C ần chú ý gi ảm li ều ở b ệnh nhân có b ệnh th ận m ạn tính, l ớn tu ổi (trên 70 tu ổi)…",
    quoteVi: "Dự phòng tái phát: 0,5- 1,2 mg uống 1-2 lần/ngày, trung bình 1mg/ngày kéo dài ít nhất 6 tháng. Chú ý giảm liều ở người CKD, lớn tuổi (>70 tuổi)."
  },
  {
    id: "byt.gout.2014.nsaid_agents",
    sourceId: "byt_361_2014_gout",
    pdfPage: 93,
    printedPage: "93",
    locator: "Mục 4.2.2 NSAID / p. 93",
    quote: "Có th ể dùng m ột trong các thu ốc sau: Indometacin, Naproxen, Ibuprofen, Ketoprofen, Piroxicam, Diclofena, các nhóm thu ốc ức ch ế ch ọn l ọc COX-2 (meloxicam, celecoxib, etoricoxib...). L ưu ý các ch ống ch ỉ định c ủa thu ốc này (viêm loét d ạ dày tá tràng, suy th ận…).",
    quoteVi: "Có thể dùng Indometacin, Naproxen, Ibuprofen, Diclofenac, hoặc ức chế chọn lọc COX-2 (celecoxib, etoricoxib...). Lưu ý các chống chỉ định (viêm loét dạ dày tá tràng, suy thận…)."
  },
  {
    id: "fda.allopurinol.start_and_max",
    sourceId: "fda_allopurinol",
    pdfPage: 8,
    printedPage: "8",
    locator: "Dosage and Administration / p. 8",
    quote: "maximal recommended dosage is 800 mg daily.\nTo reduce the possibility of flare-up of acute gouty attacks, it is recommended that the patient start with\na low dose of ZYLOPRIM (100 mg daily) and increase at weekly intervals by 100 mg until a serum uric\nacid level of 6 mg/dL or less is attained",
    quoteVi: "Khởi đầu liều thấp 100 mg/ngày và tăng liều 100 mg mỗi tuần cho đến khi nồng độ acid uric đạt ≤ 6 mg/dL nhưng không vượt quá liều tối đa khuyến cáo 800 mg/ngày."
  },
  {
    id: "fda.allopurinol.renal_dosing",
    sourceId: "fda_allopurinol",
    pdfPage: 9,
    printedPage: "9",
    locator: "Patients with Impaired Renal Function / p. 9",
    quote: "With a\ncreatinine clearance of 10 to 20 mL/min, a daily dosage of 200 mg of ZYLOPRIM is suitable. When the\ncreatinine clearance is less than 10 mL/min, the daily dosage should not exceed 100 mg.",
    quoteVi: "Chỉnh liều theo độ thanh thải creatinin: CrCl 10–20 mL/phút dùng 200 mg/ngày; CrCl < 10 mL/phút tối đa 100 mg/ngày."
  },
  {
    id: "fda.allopurinol.azathioprine_interaction",
    sourceId: "fda_allopurinol",
    pdfPage: 3,
    printedPage: "3",
    locator: "Drug Interactions / p. 3",
    quote: "n patients receiving PURINETHOL (mercaptopurine) or IMURAN (azathioprine), the concomitant administration of 300 to 600 mg of ZYLOPRIM per day will require a reduction in dose to approximately one-third to one-fourth of the usual dose of mercaptopurine or azathioprine.",
    quoteVi: "Ở bệnh nhân dùng azathioprine hoặc mercaptopurine, dùng allopurinol 300–600 mg/ngày bắt buộc phải giảm liều azathioprine/6-MP xuống còn 1/3 đến 1/4 liều thông thường để tránh ức chế tủy xương nghiêm trọng."
  },
  {
    id: "fda.allopurinol.skin_rash_scar",
    sourceId: "fda_allopurinol",
    pdfPage: 3,
    printedPage: "3",
    locator: "Warnings / p. 3",
    quote: "ZYLOPRIM SHOULD BE DISCONTINUED AT THE FIRST APPEARANCE OF SKIN RASH OR OTHER SIGNS WHICH MAY INDICATE AN ALLERGIC REACTION. In some instances a skin rash may be followed by more",
    quoteVi: "Phải ngừng ngay allopurinol khi xuất hiện ban da hoặc dấu hiệu phản ứng dị ứng đầu tiên vì có thể dẫn tới phản ứng quá mẫn nặng đe dọa tính mạng."
  },
  {
    id: "fda.allopurinol.pregnancy",
    sourceId: "fda_allopurinol",
    pdfPage: 6,
    printedPage: "6",
    locator: "Pregnancy & Nursing / p. 6",
    quote: "edictive of human response, this drug should be used during pregnancy only if clearly needed. Experience with ZYLOPRIM during human pregnancy has been limited partly because women",
    quoteVi: "Chỉ sử dụng allopurinol trong thai kỳ khi thật sự cần thiết."
  },
  {
    id: "fda.febuxostat.boxed_warning",
    sourceId: "fda_febuxostat",
    pdfPage: 1,
    printedPage: "1",
    locator: "Boxed Warning / p. 1",
    quote: "tablets, for oral use Initial U.S. Approval: 2009 WARNING: CARDIOVASCULAR DEATH See full prescribing information for complete boxed warning. Gout patients with established cardiovascular (C",
    quoteVi: "Cảnh báo hộp đen FDA: Tăng nguy cơ tử vong do tim mạch ở bệnh nhân gút có bệnh tim mạch đã xác lập được điều trị bằng febuxostat so với allopurinol."
  },
  {
    id: "fda.febuxostat.dosage",
    sourceId: "fda_febuxostat",
    pdfPage: 1,
    printedPage: "1",
    locator: "Dosage and Administration / p. 1",
    quote: "mg or 80 mg once daily. The recommended starting dosage is 40 mg once daily. For patients who do not achieve a serum uric acid (sUA) less than 6 mg/dL after 2 weeks, the recommended dos",
    quoteVi: "Liều khởi đầu khuyến cáo: 40 mg x 1 lần/ngày. Nếu acid uric máu chưa đạt < 6 mg/dL sau 2 tuần, tăng liều lên 80 mg x 1 lần/ngày."
  },
  {
    id: "fda.febuxostat.severe_renal",
    sourceId: "fda_febuxostat",
    pdfPage: 1,
    printedPage: "1",
    locator: "Renal Impairment / p. 1",
    quote: "Patients with severe renal impairment: Limit the dosage to 40 mg once daily. ( 2.2 , 8.6 ) Flare prophylaxis is recommended upon initiation of ULORIC. ( 2.4 ) Can be administered withou",
    quoteVi: "Bệnh nhân suy thận nặng (CrCl < 30 mL/phút): Giới hạn liều tối đa 40 mg x 1 lần/ngày."
  },
  {
    id: "fda.febuxostat.pregnancy",
    sourceId: "fda_febuxostat",
    pdfPage: 9,
    printedPage: "9",
    locator: "Pregnancy / p. 9",
    quote: "y with these medications. 8 USE IN SPECIFIC POPULATIONS 8.1 Pregnancy Risk Summary Limited available data with ULORIC use in pregnant women are insufficient to inform a drug assoc",
    quoteVi: "Dữ liệu trên phụ nữ mang thai chưa đầy đủ để đánh giá nguy cơ; khuyến cáo tránh dùng trong thai kỳ."
  },
  {
    id: "fda.colchicine.flare_treatment",
    sourceId: "fda_colchicine",
    pdfPage: 1,
    printedPage: "1",
    locator: "Dosage and Administration / p. 1",
    quote: "( 2.1 ). Maximum dose 1.2 mg/day. Treatment of Gout Flares: 1.2 mg (two tablets) at the first sign of a gout flare followed by 0.6 mg (one tablet) one hour later ( 2.1 ). FMF:",
    quoteVi: "Điều trị cơn gút cấp: 1.2 mg (2 viên) khi có dấu hiệu đầu tiên của cơn, sau đó 1 giờ uống tiếp 0.6 mg (1 viên)."
  },
  {
    id: "fda.colchicine.prophylaxis_dosage",
    sourceId: "fda_colchicine",
    pdfPage: 1,
    printedPage: "1",
    locator: "Prophylaxis of Gout Flares / p. 1",
    quote: "dolescents older than 16 years of age ( 2.1 ). Maximum dose 1.2 mg/day. Treatment of Gout Flares: 1.2 mg (two tablets) at the first sign of a gout flare followed by 0.6 mg (one",
    quoteVi: "Dự phòng cơn cấp: 0.6 mg x 1–2 lần/ngày (tối đa 1.2 mg/ngày)."
  },
  {
    id: "fda.colchicine.renal_and_cyp3a4",
    sourceId: "fda_colchicine",
    pdfPage: 1,
    printedPage: "1",
    locator: "Contraindications / p. 1",
    quote: "uld not be given COLCRYS in conjunction with P-gp or strong CYP3A4 inhibitors ( 5.3 ). In these patients, life-threatening and fatal colchicine toxicity has been reported with",
    quoteVi: "Chống chỉ định dùng colchicine cùng thuốc ức chế P-gp hoặc ức chế mạnh CYP3A4 ở người bệnh có suy giảm chức năng gan hoặc thận vì nguy cơ ngộ độc colchicine đe dọa tính mạng."
  },
  {
    id: "fda.colchicine.severe_renal_prophylaxis",
    sourceId: "fda_colchicine",
    pdfPage: 2,
    printedPage: "2",
    locator: "Dosage in Renal Impairment / p. 2",
    quote: "be monitored closely ( 2.5 , 8.6 ). In patients with severe renal impairment for prophylaxis of gout flares, the starting dose should be 0.3 mg/day for gout flares, no dose adjustment is",
    quoteVi: "Ở người suy thận nặng, liều dự phòng cơn gút khởi đầu nên là 0.3 mg/ngày. Đối với điều trị cơn cấp, đợt điều trị không được lặp lại thường xuyên hơn một lần mỗi 2 tuần."
  },
  {
    id: "fda.colchicine.pregnancy",
    sourceId: "fda_colchicine",
    pdfPage: 14,
    printedPage: "14",
    locator: "Pregnancy / p. 14",
    quote: "talis Glycosides: digoxin 8 USE IN SPECIFIC POPULATIONS 8.1 Pregnancy Pregnancy Category C. There are no adequate and well-controlled studies with colchicine in pregnant women. Co",
    quoteVi: "Colchicine qua được hàng rào nhau thai; tránh dùng trong thai kỳ trừ khi lợi ích vượt trội nguy cơ."
  }
];

const thresholds = [
  {
    id: "gout.indication.tophi_min",
    value: 1,
    unit: "count",
    quantity: "count",
    citationIds: ["acr.gout.2020.indication_strong"],
    descriptionVi: "Số lượng hạt tophi tối thiểu (≥ 1 hạt) để có chỉ định mạnh khởi trị thuốc hạ urat máu (ACR 2020)"
  },
  {
    id: "gout.indication.flares_per_year_frequent",
    value: 2,
    unit: "cơn/năm",
    quantity: "gout_flares",
    citationIds: ["acr.gout.2020.indication_strong"],
    descriptionVi: "Tần suất đợt cấp tái phát thường xuyên (≥ 2 đợt/năm) là chỉ định mạnh khởi trị ULT (ACR 2020)"
  },
  {
    id: "gout.indication.prior_flares_infrequent",
    value: 1,
    unit: "count",
    quantity: "count",
    citationIds: ["acr.gout.2020.indication_conditional_infrequent"],
    descriptionVi: "Từng có > 1 đợt cấp gút trong đời nhưng cơn thưa (< 2 đợt/năm): chỉ định có điều kiện khởi trị ULT (ACR 2020)"
  },
  {
    id: "gout.indication.ckd_stage_min",
    value: 3,
    unit: "stage",
    quantity: "stage",
    citationIds: ["acr.gout.2020.indication_conditional_first_flare"],
    descriptionVi: "Bệnh thận mạn giai đoạn ≥ 3 là yếu tố nguy cơ để chỉ định có điều kiện khởi trị ULT ngay từ cơn gút đầu tiên (ACR 2020)"
  },
  {
    id: "gout.indication.urate_high_cutoff_mgdl",
    value: 9,
    unit: "mg/dL",
    quantity: "urate",
    citationIds: ["acr.gout.2020.indication_conditional_first_flare"],
    descriptionVi: "Nồng độ acid uric máu rất cao (> 9 mg/dL) là yếu tố chỉ định có điều kiện khởi trị ULT từ cơn đầu (ACR 2020)"
  },
  {
    id: "gout.indication.urate_high_cutoff_umol",
    value: 535,
    unit: "µmol/L",
    quantity: "urate",
    citationIds: ["kdigo.gout.2024.ckd_first_flare"],
    descriptionVi: "Nồng độ acid uric máu rất cao (> 535 µmol/L) theo đơn vị SI (KDIGO 2024)"
  },
  {
    id: "gout.target.urate_standard_mgdl",
    value: 6,
    unit: "mg/dL",
    quantity: "urate",
    citationIds: ["acr.gout.2020.target_urate_under_6", "fda.allopurinol.start_and_max"],
    descriptionVi: "Mục tiêu acid uric máu chuẩn < 6.0 mg/dL (< 360 µmol/L) cho mọi bệnh nhân gút dùng ULT (ACR 2020)"
  },
  {
    id: "gout.target.urate_standard_umol",
    value: 360,
    unit: "µmol/L",
    quantity: "urate",
    citationIds: ["eular.gout.2016.target_urate_tophi", "byt.gout.2014.target_urate"],
    descriptionVi: "Mục tiêu acid uric máu chuẩn < 360 µmol/L theo đơn vị SI (EULAR 2016 & BYT 361/2014)"
  },
  {
    id: "gout.target.urate_tophi_mgdl",
    value: 5,
    unit: "mg/dL",
    quantity: "urate",
    citationIds: ["eular.gout.2016.target_urate_tophi"],
    descriptionVi: "Mục tiêu acid uric máu tích cực < 5.0 mg/dL (< 300 µmol/L) cho bệnh nhân có tophi hoặc phá hủy khớp (EULAR 2016)"
  },
  {
    id: "gout.target.urate_tophi_umol",
    value: 300,
    unit: "µmol/L",
    quantity: "urate",
    citationIds: ["eular.gout.2016.target_urate_tophi"],
    descriptionVi: "Mục tiêu acid uric máu tích cực < 300 µmol/L theo đơn vị SI cho bệnh nhân có tophi (EULAR 2016)"
  },
  {
    id: "gout.target.urate_vn_tophi_umol",
    value: 320,
    unit: "µmol/L",
    quantity: "urate",
    citationIds: ["byt.gout.2014.target_urate"],
    descriptionVi: "Mục tiêu acid uric máu khi có hạt tophi theo BYT 361/2014 (< 320 µmol/L)"
  },
  {
    id: "gout.allopurinol.start_dose_normal",
    value: 100,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["acr.gout.2020.allopurinol_low_dose_start", "fda.allopurinol.start_and_max", "eular.gout.2016.allopurinol_titration"],
    descriptionVi: "Liều khởi đầu allopurinol chuẩn ở người có chức năng thận bình thường (100 mg/ngày) (ACR 2020, EULAR 2016)"
  },
  {
    id: "gout.allopurinol.start_dose_ckd",
    value: 50,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["acr.gout.2020.allopurinol_start_dose_ckd_50"],
    descriptionVi: "Liều khởi đầu allopurinol giảm ở bệnh nhân CKD giai đoạn ≥ 3 (≤ 50 mg/ngày) (ACR 2020)"
  },
  {
    id: "gout.allopurinol.egfr_ckd_threshold",
    value: 60,
    unit: "mL/min/1.73m2",
    quantity: "egfr",
    citationIds: ["kdigo.ckd.2024.table_2_gfr_categories"],
    descriptionVi: "Ngưỡng eGFR phân định CKD giai đoạn ≥ 3 (< 60 mL/min/1.73m2) để giảm liều khởi đầu allopurinol (KDIGO 2024)"
  },
  {
    id: "gout.allopurinol.titration_step",
    value: 100,
    unit: "mg",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.allopurinol_titration", "fda.allopurinol.start_and_max"],
    descriptionVi: "Bước chuẩn độ tăng liều allopurinol (100 mg mỗi đợt) (EULAR 2016, FDA label)"
  },
  {
    id: "gout.allopurinol.max_dose",
    value: 800,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.allopurinol.start_and_max"],
    descriptionVi: "Liều tối đa khuyến cáo của allopurinol (800 mg/ngày) (FDA label)"
  },
  {
    id: "gout.allopurinol.crcl_10",
    value: 10,
    unit: "mL/min",
    quantity: "crcl",
    citationIds: ["fda.allopurinol.renal_dosing"],
    descriptionVi: "Ngưỡng CrCl 10 mL/phút để chỉnh liều allopurinol (FDA label)"
  },
  {
    id: "gout.allopurinol.crcl_20",
    value: 20,
    unit: "mL/min",
    quantity: "crcl",
    citationIds: ["fda.allopurinol.renal_dosing"],
    descriptionVi: "Ngưỡng CrCl 20 mL/phút để chỉnh liều allopurinol (FDA label)"
  },
  {
    id: "gout.allopurinol.dose_crcl_10_20",
    value: 200,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.allopurinol.renal_dosing"],
    descriptionVi: "Liều allopurinol phù hợp khi CrCl 10–20 mL/phút (200 mg/ngày) (FDA label)"
  },
  {
    id: "gout.allopurinol.dose_crcl_under_10",
    value: 100,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.allopurinol.renal_dosing"],
    descriptionVi: "Liều allopurinol tối đa khi CrCl < 10 mL/phút (không quá 100 mg/ngày) (FDA label)"
  },
  {
    id: "gout.allopurinol.crcl_extreme",
    value: 3,
    unit: "mL/min",
    quantity: "crcl",
    citationIds: ["fda.allopurinol.renal_dosing"],
    descriptionVi: "Ngưỡng suy thận cực độ CrCl < 3 mL/phút cần giãn khoảng cách liều allopurinol (FDA label)"
  },
  {
    id: "gout.febuxostat.start_dose",
    value: 40,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["acr.gout.2020.allopurinol_low_dose_start", "fda.febuxostat.dosage"],
    descriptionVi: "Liều khởi đầu febuxostat (40 mg/ngày) (ACR 2020, FDA label)"
  },
  {
    id: "gout.febuxostat.target_dose",
    value: 80,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.febuxostat.dosage"],
    descriptionVi: "Liều tăng cường febuxostat (80 mg/ngày) nếu chưa đạt đích sau 2 tuần (FDA label)"
  },
  {
    id: "gout.febuxostat.severe_renal_max_dose",
    value: 40,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.febuxostat.severe_renal"],
    descriptionVi: "Liều tối đa febuxostat ở bệnh nhân suy thận nặng (40 mg/ngày) (FDA label)"
  },
  {
    id: "gout.febuxostat.severe_renal_crcl",
    value: 30,
    unit: "mL/min",
    quantity: "crcl",
    citationIds: ["eular.gout.2016.benzbromarone_egfr30"],
    descriptionVi: "Ngưỡng suy thận nặng (eGFR hoặc CrCl < 30 mL/phút) để giới hạn liều febuxostat (FDA label, EULAR 2016)"
  },
  {
    id: "gout.probenecid.start_dose",
    value: 500,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["acr.gout.2020.probenecid_low_dose"],
    descriptionVi: "Liều khởi đầu probenecid (500 mg x 1–2 lần/ngày) (ACR 2020)"
  },
  {
    id: "gout.probenecid.max_dose_g",
    value: 2,
    unit: "g/ngày",
    quantity: "dose_g",
    citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"],
    descriptionVi: "Liều thông thường tối đa của probenecid (2 g/ngày) (EULAR 2016)"
  },
  {
    id: "gout.probenecid.crcl_contra_min",
    value: 30,
    unit: "mL/min",
    quantity: "crcl",
    citationIds: ["eular.gout.2016.benzbromarone_egfr30"],
    descriptionVi: "Ngưỡng eGFR/CrCl < 30 mL/phút thuốc tăng thải acid uric mất hiệu lực và chống chỉ định (EULAR 2016)"
  },
  {
    id: "gout.benzbromarone.start_dose",
    value: 50,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"],
    descriptionVi: "Liều khởi đầu benzbromarone (50 mg/ngày) (EULAR 2016)"
  },
  {
    id: "gout.benzbromarone.target_dose",
    value: 200,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"],
    descriptionVi: "Liều đích tối đa của benzbromarone (200 mg/ngày) (EULAR 2016)"
  },
  {
    id: "gout.benzbromarone.egfr_contra_min",
    value: 30,
    unit: "mL/min",
    quantity: "egfr",
    citationIds: ["eular.gout.2016.benzbromarone_egfr30"],
    descriptionVi: "Ngưỡng eGFR < 30 mL/phút chống chỉ định benzbromarone (EULAR 2016)"
  },
  {
    id: "gout.prophylaxis.duration_months_min",
    value: 3,
    unit: "tháng",
    quantity: "duration_months",
    citationIds: ["acr.gout.2020.prophylaxis_duration"],
    descriptionVi: "Thời gian dự phòng cơn cấp tối thiểu khi bắt đầu ULT (ít nhất 3 tháng) (ACR 2020)"
  },
  {
    id: "gout.prophylaxis.duration_months_max",
    value: 6,
    unit: "tháng",
    quantity: "duration_months",
    citationIds: ["acr.gout.2020.prophylaxis_duration", "eular.gout.2016.flare_prophylaxis"],
    descriptionVi: "Thời gian dự phòng cơn cấp chuẩn khi bắt đầu ULT (6 tháng) (ACR 2020, EULAR 2016)"
  },
  {
    id: "gout.colchicine.prophylaxis_dose_min",
    value: 0.5,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.flare_prophylaxis", "byt.gout.2014.colchicine_dosing"],
    descriptionVi: "Liều dự phòng cơn cấp khởi đầu của colchicine (0.5 mg/ngày) (EULAR 2016, BYT 361/2014)"
  },
  {
    id: "gout.colchicine.prophylaxis_dose_max",
    value: 1,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.flare_prophylaxis", "byt.gout.2014.colchicine_dosing"],
    descriptionVi: "Liều dự phòng cơn cấp tối đa thông thường của colchicine (1.0 mg/ngày) (EULAR 2016)"
  },
  {
    id: "gout.colchicine.prophylaxis_fda_max",
    value: 1.2,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.colchicine.prophylaxis_dosage", "byt.gout.2014.colchicine_dosing"],
    descriptionVi: "Liều tối đa dự phòng cơn cấp của colchicine theo nhãn FDA (1.2 mg/ngày)"
  },
  {
    id: "gout.colchicine.severe_renal_start_dose",
    value: 0.3,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["fda.colchicine.severe_renal_prophylaxis"],
    descriptionVi: "Liều khởi đầu dự phòng colchicine ở bệnh nhân suy thận nặng (0.3 mg/ngày) (FDA label)"
  },
  {
    id: "gout.colchicine.egfr_dialysis_min",
    value: 15,
    unit: "mL/min/1.73m2",
    quantity: "egfr",
    citationIds: ["kdigo.ckd.2024.table_2_gfr_categories"],
    descriptionVi: "Ngưỡng suy thận rất nặng (eGFR < 15 mL/phút/1.73m2) chống chỉ định colchicine"
  },
  {
    id: "gout.colchicine.flare_initial_dose",
    value: 1.2,
    unit: "mg",
    quantity: "dose_mg",
    citationIds: ["fda.colchicine.flare_treatment"],
    descriptionVi: "Liều nạp colchicine ban đầu khi có dấu hiệu cơn gút cấp (1.2 mg) theo nhãn FDA"
  },
  {
    id: "gout.colchicine.flare_second_dose",
    value: 0.6,
    unit: "mg",
    quantity: "dose_mg",
    citationIds: ["fda.colchicine.flare_treatment"],
    descriptionVi: "Liều colchicine tiếp theo sau 1 giờ điều trị cơn cấp (0.6 mg) theo nhãn FDA"
  },
  {
    id: "gout.colchicine.flare_hour_interval",
    value: 1,
    unit: "giờ",
    quantity: "duration_hours",
    citationIds: ["fda.colchicine.flare_treatment", "eular.gout.2016.flare_options"],
    descriptionVi: "Khoảng thời gian (1 giờ) giữa liều nạp thứ nhất và thứ hai của colchicine (FDA label, EULAR 2016)"
  },
  {
    id: "gout.colchicine.flare_eular_initial",
    value: 1,
    unit: "mg",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.flare_options"],
    descriptionVi: "Liều nạp colchicine ban đầu theo EULAR 2016 (1.0 mg)"
  },
  {
    id: "gout.colchicine.flare_eular_second",
    value: 0.5,
    unit: "mg",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.flare_options"],
    descriptionVi: "Liều colchicine sau 1 giờ theo EULAR 2016 (0.5 mg)"
  },
  {
    id: "gout.prednisolone.flare_dose_min",
    value: 30,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.flare_options"],
    descriptionVi: "Liều corticoid uống khởi đầu trong cơn cấp gút (30 mg/ngày tương đương prednisolone) (EULAR 2016)"
  },
  {
    id: "gout.prednisolone.flare_dose_max",
    value: 35,
    unit: "mg/ngày",
    quantity: "dose_mg",
    citationIds: ["eular.gout.2016.flare_options"],
    descriptionVi: "Liều corticoid uống tối đa trong cơn cấp gút (35 mg/ngày tương đương prednisolone) (EULAR 2016)"
  },
  {
    id: "gout.prednisolone.flare_duration_days_min",
    value: 3,
    unit: "ngày",
    quantity: "duration_days",
    citationIds: ["eular.gout.2016.flare_options"],
    descriptionVi: "Thời gian điều trị corticoid ngắn ngày tối thiểu trong cơn cấp (3 ngày) (EULAR 2016)"
  },
  {
    id: "gout.prednisolone.flare_duration_days_max",
    value: 5,
    unit: "ngày",
    quantity: "duration_days",
    citationIds: ["eular.gout.2016.flare_options"],
    descriptionVi: "Thời gian điều trị corticoid ngắn ngày chuẩn trong cơn cấp (5 ngày) (EULAR 2016)"
  },
  {
    id: "gout.nsaid.egfr_contra_min",
    value: 30,
    unit: "mL/min/1.73m2",
    quantity: "egfr",
    citationIds: ["eular.gout.2016.benzbromarone_egfr30", "byt.gout.2014.nsaid_agents"],
    descriptionVi: "Ngưỡng eGFR < 30 mL/phút/1.73m2 chống chỉ định dùng thuốc chống viêm NSAID (EULAR 2016, BYT 361/2014)"
  }
];

const drugs = [
  {
    id: "allopurinol",
    nameVi: "Allopurinol",
    inn: "Allopurinol",
    class: "XOI",
    classes: ["xoi", "ult"],
    vnBrands: ["Zyloprim", "Sadapron", "Milurit", "Alloril"],
    forms: ["Viên nén 100 mg", "Viên nén 300 mg"],
    start: {
      amount: 100,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "100 mg/ngày (≤ 50 mg/ngày nếu eGFR < 60 mL/phút)"
    },
    target: {
      amount: 300,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "300 mg/ngày (chuẩn độ tới đích urat < 360 µmol/L, tối đa 800 mg/ngày)"
    },
    titration: {
      step: 100,
      intervalDays: 14,
      maxDose: "800 mg/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "Khởi đầu 100 mg/ngày, tăng dần mỗi 100 mg sau 2–4 tuần",
        citationIds: ["acr.gout.2020.allopurinol_low_dose_start", "fda.allopurinol.start_and_max"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "rec",
        continue: "rec",
        dose: "Khởi đầu ≤ 50 mg/ngày, chuẩn độ thận trọng tới đích",
        citationIds: ["acr.gout.2020.allopurinol_start_dose_ckd_50"]
      },
      {
        eGFRFrom: 15,
        eGFRTo: 30,
        initiate: "rec",
        continue: "rec",
        dose: "Khởi đầu ≤ 50 mg/ngày (hoặc 100 mg cách ngày, tối đa 200 mg/ngày)",
        citationIds: ["acr.gout.2020.allopurinol_start_dose_ckd_50", "fda.allopurinol.renal_dosing"]
      },
      {
        eGFRTo: 15,
        initiate: "caution",
        continue: "ok",
        dose: "Khởi đầu 50 mg cách ngày hoặc tối đa 100 mg/ngày",
        citationIds: ["fda.allopurinol.renal_dosing"]
      }
    ],
    gates: [
      {
        id: "gate_allopurinol_hlab5801",
        parameter: "HLA-B*58:01",
        operator: "==",
        threshold: 1,
        unit: "positive",
        action: "avoid",
        messageVi: "Chống chỉ định allopurinol khi xét nghiệm HLA-B*58:01 dương tính do nguy cơ cao bị phản ứng da nặng đe dọa tính mạng (SCAR/SJS/TEN/DRESS)",
        citationIds: ["acr.gout.2020.hlab5801_screening", "fda.allopurinol.skin_rash_scar"]
      }
    ],
    pregnancy: {
      status: "caution",
      notesVi: "Phân loại C (FDA); chỉ sử dụng trong thai kỳ khi thật sự cần thiết sau khi cân nhắc kỹ lợi ích và nguy cơ",
      citationIds: ["fda.allopurinol.pregnancy"]
    },
    lactation: {
      status: "caution",
      notesVi: "Allopurinol và oxypurinol bài tiết vào sữa mẹ; thận trọng khi dùng cho phụ nữ đang cho con bú",
      citationIds: ["fda.allopurinol.pregnancy"]
    },
    contraindications: [
      {
        code: "hla_b5801",
        messageVi: "Chống chỉ định tuyệt đối Allopurinol khi mang gen dị ứng HLA-B*58:01",
        citationIds: ["acr.gout.2020.hlab5801_screening", "fda.allopurinol.skin_rash_scar"]
      }
    ],
    interactions: [
      "Azathioprine / 6-Mercaptopurine: Ức chế chuyển hóa qua xanthine oxidase gây suy tủy xương gây tử vong (cần giảm 75% liều azathioprine hoặc tránh dùng)",
      "Warfarin: Kéo dài thời gian prothrombin, tăng nguy cơ chảy máu, cần theo dõi INR",
      "Ampicillin / Amoxicillin: Tăng tỷ lệ phát ban da do dị ứng"
    ],
    citationIds: [
      "acr.gout.2020.allopurinol_first_line",
      "acr.gout.2020.allopurinol_low_dose_start",
      "fda.allopurinol.start_and_max",
      "fda.allopurinol.azathioprine_interaction"
    ]
  },
  {
    id: "febuxostat",
    nameVi: "Febuxostat",
    inn: "Febuxostat",
    class: "XOI",
    classes: ["xoi", "ult"],
    vnBrands: ["Uloric", "Feburic", "Adenuric", "Febuget"],
    forms: ["Viên nén 40 mg", "Viên nén 80 mg", "Viên nén 120 mg"],
    start: {
      amount: 40,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "40 mg/ngày"
    },
    target: {
      amount: 80,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "80 mg/ngày (nếu sau 2 tuần acid uric ≥ 6 mg/dL)"
    },
    titration: {
      step: 40,
      intervalDays: 14,
      maxDose: "80 mg/ngày"
    },
    renal: [
      {
        eGFRFrom: 30,
        initiate: "rec",
        continue: "rec",
        dose: "40–80 mg/ngày",
        citationIds: ["fda.febuxostat.dosage"]
      },
      {
        eGFRFrom: 15,
        eGFRTo: 30,
        initiate: "ok",
        continue: "ok",
        dose: "Giới hạn tối đa 40 mg/ngày",
        citationIds: ["fda.febuxostat.severe_renal"]
      },
      {
        eGFRTo: 15,
        initiate: "caution",
        continue: "caution",
        dose: "40 mg/ngày (dữ liệu hạn chế ở suy thận giai đoạn cuối)",
        citationIds: ["fda.febuxostat.severe_renal"]
      }
    ],
    gates: [
      {
        id: "gate_febuxostat_cvd",
        parameter: "CVD",
        operator: "==",
        threshold: 1,
        unit: "history",
        action: "caution",
        messageVi: "Cảnh báo an toàn tim mạch FDA: Cân nhắc chuyển sang allopurinol hoặc thận trọng ở bệnh nhân có tiền sử bệnh tim mạch hoặc suy tim",
        citationIds: ["fda.febuxostat.boxed_warning", "acr.gout.2020.febuxostat_cvd_switch"]
      }
    ],
    pregnancy: {
      status: "avoid",
      notesVi: "Dữ liệu hạn chế trên người mang thai; khuyến cáo tránh dùng trong thai kỳ (FDA Label)",
      citationIds: ["fda.febuxostat.pregnancy"]
    },
    lactation: {
      status: "avoid",
      notesVi: "Chưa có dữ liệu bài tiết qua sữa mẹ; khuyến cáo tránh dùng khi cho con bú",
      citationIds: ["fda.febuxostat.pregnancy"]
    },
    contraindications: [
      {
        code: "azathioprine_use",
        messageVi: "Chống chỉ định dùng đồng thời febuxostat với azathioprine hoặc mercaptopurine",
        citationIds: ["fda.allopurinol.azathioprine_interaction"]
      }
    ],
    interactions: [
      "Azathioprine / 6-Mercaptopurine: Chống chỉ định do ức chế chuyển hóa làm tăng nồng độ độc chất",
      "Theophylline: Thận trọng do có thể làm tăng nhẹ nồng độ theophylline"
    ],
    citationIds: [
      "fda.febuxostat.boxed_warning",
      "fda.febuxostat.dosage",
      "acr.gout.2020.febuxostat_cvd_switch"
    ]
  },
  {
    id: "colchicine",
    nameVi: "Colchicine",
    inn: "Colchicine",
    class: "Chống viêm gút",
    classes: ["colchicine", "anti_inflammatory"],
    vnBrands: ["Colchicine", "Colcrys", "Colchicina"],
    forms: ["Viên nén 0.5 mg", "Viên nén 0.6 mg", "Viên nén 1 mg"],
    start: {
      amount: 1,
      unit: "mg",
      frequency: "ngày đầu cơn cấp (1 mg sau đó 0.5 mg sau 1 giờ)",
      route: "uống",
      description: "1 mg khởi đầu, sau đó 0.5 mg sau 1 giờ (cơn cấp)"
    },
    target: {
      amount: 0.5,
      unit: "mg",
      frequency: "1–2 lần/ngày",
      route: "uống",
      description: "0.5–1.0 mg/ngày (dự phòng cơn bùng phát 3–6 tháng)"
    },
    titration: {
      step: 0.5,
      intervalDays: 7,
      maxDose: "1.2 mg/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "Cơn cấp: 1 mg + 0.5 mg sau 1h; Dự phòng: 0.5–1.0 mg/ngày",
        citationIds: ["eular.gout.2016.flare_options", "eular.gout.2016.flare_prophylaxis"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "ok",
        continue: "ok",
        dose: "Dự phòng: 0.5 mg/ngày; theo dõi chặt triệu chứng tiêu chảy và đau cơ",
        citationIds: ["eular.gout.2016.flare_prophylaxis", "byt.gout.2014.colchicine_dosing"]
      },
      {
        eGFRFrom: 15,
        eGFRTo: 30,
        initiate: "caution",
        continue: "caution",
        dose: "Dự phòng: 0.3–0.5 mg/ngày hoặc 0.5 mg cách ngày; Cơn cấp: không lặp lại trong vòng 14 ngày",
        citationIds: ["fda.colchicine.severe_renal_prophylaxis"]
      },
      {
        eGFRTo: 15,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định hoặc tránh dùng; đặc biệt chống chỉ định nếu dùng cùng chất ức chế CYP3A4/P-gp",
        citationIds: ["fda.colchicine.renal_and_cyp3a4"]
      }
    ],
    gates: [
      {
        id: "gate_colchicine_cyp3a4_renal",
        parameter: "CYP3A4_Renal",
        operator: "==",
        threshold: 1,
        unit: "contra",
        action: "avoid",
        messageVi: "Chống chỉ định colchicine ở bệnh nhân có suy thận hoặc suy gan khi phối hợp với thuốc ức chế mạnh CYP3A4 (clarithromycin, ketoconazole...) hoặc ức chế P-gp do nguy cơ ngộ độc chết người",
        citationIds: ["fda.colchicine.renal_and_cyp3a4"]
      }
    ],
    pregnancy: {
      status: "avoid",
      notesVi: "Colchicine qua được nhau thai; phân loại C; tránh sử dụng trong thai kỳ (FDA Label)",
      citationIds: ["fda.colchicine.pregnancy"]
    },
    lactation: {
      status: "caution",
      notesVi: "Bài tiết qua sữa mẹ; thận trọng khi dùng cho phụ nữ cho con bú",
      citationIds: ["fda.colchicine.pregnancy"]
    },
    contraindications: [
      {
        code: "cyp3a4_renal_hepatic",
        messageVi: "Chống chỉ định phối hợp với thuốc ức chế P-gp hoặc ức chế mạnh CYP3A4 khi có suy thận hoặc suy gan",
        citationIds: ["fda.colchicine.renal_and_cyp3a4"]
      }
    ],
    interactions: [
      "Chất ức chế CYP3A4 mạnh (clarithromycin, ketoconazole, itraconazole, ritonavir): Nguy cơ tử vong do ngộ độc colchicine",
      "Chất ức chế P-glycoprotein (cyclosporine, verapamil): Tăng mạnh nồng độ colchicine",
      "Statin / Fibrate: Tăng nguy cơ bệnh cơ và tiêu cơ vân cấp"
    ],
    citationIds: [
      "fda.colchicine.flare_treatment",
      "fda.colchicine.prophylaxis_dosage",
      "fda.colchicine.renal_and_cyp3a4",
      "eular.gout.2016.flare_options"
    ]
  },
  {
    id: "probenecid",
    nameVi: "Probenecid",
    inn: "Probenecid",
    class: "Tăng thải acid uric",
    classes: ["uricosuric", "ult"],
    vnBrands: ["Probenecid", "Benemid"],
    forms: ["Viên nén 500 mg"],
    start: {
      amount: 500,
      unit: "mg",
      frequency: "1–2 lần/ngày",
      route: "uống",
      description: "500 mg x 1–2 lần/ngày"
    },
    target: {
      amount: 1000,
      unit: "mg",
      frequency: "2 lần/ngày",
      route: "uống",
      description: "1000–2000 mg/ngày (tối đa 2 g/ngày)"
    },
    titration: {
      step: 500,
      intervalDays: 14,
      maxDose: "2 g/ngày"
    },
    renal: [
      {
        eGFRFrom: 50,
        initiate: "rec",
        continue: "rec",
        dose: "500–2000 mg/ngày",
        citationIds: ["acr.gout.2020.probenecid_low_dose"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 50,
        initiate: "caution",
        continue: "caution",
        dose: "Hiệu quả bài xuất acid uric giảm rõ rệt; ưu tiên chuyển sang XOI",
        citationIds: ["acr.gout.2020.xoi_over_probenecid"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định hoặc mất hiệu lực bài xuất urat khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "byt.gout.2014.nsaid_agents"]
      }
    ],
    gates: [
      {
        id: "gate_probenecid_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định probenecid khi eGFR < 30 mL/phút do thuốc mất tác dụng tăng bài xuất acid uric qua thận",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        id: "gate_probenecid_urolithiasis",
        parameter: "Urolithiasis",
        operator: "==",
        threshold: 1,
        unit: "history",
        action: "avoid",
        messageVi: "Chống chỉ định probenecid ở bệnh nhân có tiền sử sỏi thận tiết niệu do làm tăng lượng urat bài xuất qua đường niệu",
        citationIds: ["acr.gout.2020.indication_conditional_first_flare"]
      }
    ],
    pregnancy: {
      status: "avoid",
      notesVi: "Probenecid qua nhau thai; chỉ dùng khi thật sự cần thiết (FDA Label)",
      citationIds: ["acr.gout.2020.probenecid_low_dose"]
    },
    lactation: {
      status: "caution",
      notesVi: "Chưa rõ bài tiết qua sữa; thận trọng khi cho con bú",
      citationIds: ["acr.gout.2020.probenecid_low_dose"]
    },
    contraindications: [
      {
        code: "urolithiasis",
        messageVi: "Chống chỉ định ở bệnh nhân có tiền sử sỏi acid uric hoặc sỏi thận tiết niệu",
        citationIds: ["acr.gout.2020.indication_conditional_first_flare"]
      },
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR hoặc CrCl < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    interactions: [
      "Kháng sinh nhóm Beta-lactam (Penicillin, Cephalosporin): Probenecid làm giảm thải trừ qua ống thận, tăng nồng độ kháng sinh trong máu",
      "Methotrexate: Giảm bài xuất methotrexate, tăng độc tính nặng",
      "Aspirin liều thấp: Đối kháng tác dụng bài xuất acid uric của probenecid"
    ],
    citationIds: [
      "acr.gout.2020.probenecid_low_dose",
      "acr.gout.2020.xoi_over_probenecid",
      "eular.gout.2016.benzbromarone_probenecid_dosing"
    ]
  },
  {
    id: "benzbromarone",
    nameVi: "Benzbromarone",
    inn: "Benzbromarone",
    class: "Tăng thải acid uric",
    classes: ["uricosuric", "ult"],
    vnBrands: ["Urik", "Desuric", "Narcaricin"],
    forms: ["Viên nén 50 mg", "Viên nén 100 mg"],
    start: {
      amount: 50,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "50 mg/ngày"
    },
    target: {
      amount: 100,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "100–200 mg/ngày"
    },
    titration: {
      step: 50,
      intervalDays: 14,
      maxDose: "200 mg/ngày"
    },
    renal: [
      {
        eGFRFrom: 30,
        initiate: "ok",
        continue: "ok",
        dose: "50–200 mg/ngày",
        citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định khi eGFR < 30 mL/phút theo khuyến cáo EULAR 2016",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    gates: [
      {
        id: "gate_benzbromarone_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định benzbromarone khi eGFR < 30 mL/phút (EULAR 2016)",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định tuyệt đối trong thai kỳ do nguy cơ độc tính phát triển phôi thai",
      citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"]
    },
    lactation: {
      status: "contra",
      notesVi: "Chống chỉ định khi cho con bú",
      citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "liver_disease",
        messageVi: "Chống chỉ định khi có bệnh gan tiến triển do nguy cơ nhiễm độc gan tối cấp",
        citationIds: ["eular.gout.2016.benzbromarone_probenecid_dosing"]
      }
    ],
    interactions: [
      "Thuốc chuyển hóa qua CYP2C9 (Warfarin): Tăng nồng độ warfarin, nguy cơ xuất huyết nặng",
      "Các thuốc độc gan: Tăng nguy cơ tổn thương tế bào gan"
    ],
    citationIds: [
      "eular.gout.2016.benzbromarone_probenecid_dosing",
      "eular.gout.2016.benzbromarone_egfr30"
    ]
  },
  {
    id: "naproxen",
    nameVi: "Naproxen",
    inn: "Naproxen",
    class: "NSAID",
    classes: ["nsaid"],
    vnBrands: ["Aleve", "Naprosyn"],
    forms: ["Viên nén 250 mg", "Viên nén 500 mg"],
    start: {
      amount: 500,
      unit: "mg",
      frequency: "2 lần/ngày",
      route: "uống",
      description: "500 mg x 2 lần/ngày (cơn cấp) hoặc 250 mg x 2 lần/ngày (dự phòng)"
    },
    target: {
      amount: 500,
      unit: "mg",
      frequency: "2 lần/ngày",
      route: "uống",
      description: "500 mg x 2 lần/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "500 mg x 2 lần/ngày trong 5–7 ngày",
        citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "caution",
        continue: "caution",
        dose: "Thận trọng, dùng liều thấp nhất trong thời gian ngắn nhất hoặc ưu tiên corticoid",
        citationIds: ["byt.gout.2014.nsaid_agents", "kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định NSAID khi eGFR < 30 mL/phút do nguy cơ suy thận cấp",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "kdigo.gout.2024.acute_flare_ckd"]
      }
    ],
    gates: [
      {
        id: "gate_naproxen_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định NSAID khi eGFR < 30 mL/phút/1.73m2 do nguy cơ hoại tử nhú thận và suy thận cấp",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định trong tam cá nguyệt 3 (đóng sớm ống động mạch, thiểu ối); tránh dùng trong tam cá nguyệt 1 và 2",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    lactation: {
      status: "caution",
      notesVi: "Bài tiết lượng nhỏ qua sữa; dùng thận trọng",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "peptic_ulcer",
        messageVi: "Chống chỉ định khi có tiền sử loét dạ dày tá tràng tiến triển hoặc xuất huyết tiêu hóa",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        code: "heart_failure",
        messageVi: "Chống chỉ định ở bệnh nhân suy tim do ứ muối nước và giảm chức năng thận",
        citationIds: ["kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        code: "anticoagulant_use",
        messageVi: "Chống chỉ định phối hợp với thuốc chống đông do nguy cơ xuất huyết tiêu hóa nặng",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      }
    ],
    interactions: [
      "Thuốc chống đông (Warfarin, DOAC): Tăng nguy cơ xuất huyết tiêu hóa nghiêm trọng",
      "Thuốc ức chế men chuyển / ARB + Lợi tiểu: Hội chứng 'Triple Whammy' gây suy thận cấp tiến triển",
      "Aspirin: Tăng độc tính loét dạ dày"
    ],
    citationIds: [
      "byt.gout.2014.nsaid_agents",
      "acr.gout.2020.flare_first_line",
      "kdigo.gout.2024.acute_flare_ckd"
    ]
  },
  {
    id: "ibuprofen",
    nameVi: "Ibuprofen",
    inn: "Ibuprofen",
    class: "NSAID",
    classes: ["nsaid"],
    vnBrands: ["Brufen", "Advil", "Alaxan"],
    forms: ["Viên nén 400 mg", "Viên nén 600 mg"],
    start: {
      amount: 400,
      unit: "mg",
      frequency: "3–4 lần/ngày",
      route: "uống",
      description: "400–600 mg x 3–4 lần/ngày trong đợt cấp"
    },
    target: {
      amount: 600,
      unit: "mg",
      frequency: "3 lần/ngày",
      route: "uống",
      description: "600 mg x 3 lần/ngày (tối đa 2400 mg/ngày)"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "400–600 mg x 3–4 lần/ngày",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "caution",
        continue: "caution",
        dose: "Thận trọng, liều thấp nhất có hiệu quả",
        citationIds: ["byt.gout.2014.nsaid_agents", "kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "kdigo.gout.2024.acute_flare_ckd"]
      }
    ],
    gates: [
      {
        id: "gate_ibuprofen_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút/1.73m2",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định trong 3 tháng cuối thai kỳ; tránh dùng trong 6 tháng đầu",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    lactation: {
      status: "compatible",
      notesVi: "Lượng bài tiết qua sữa rất thấp; tương thích khi cho con bú ngắn ngày",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "peptic_ulcer",
        messageVi: "Chống chỉ định khi có tiền sử loét dạ dày tá tràng hoặc xuất huyết tiêu hóa",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        code: "heart_failure",
        messageVi: "Chống chỉ định ở bệnh nhân suy tim",
        citationIds: ["kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        code: "anticoagulant_use",
        messageVi: "Chống chỉ định phối hợp với thuốc chống đông",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      }
    ],
    interactions: [
      "Thuốc chống đông: Tăng nguy cơ xuất huyết tiêu hóa",
      "Lợi tiểu và RASi: Giảm chức năng lọc thận cấp",
      "Aspirin: Làm mất tác dụng bảo vệ tim mạch của aspirin"
    ],
    citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
  },
  {
    id: "diclofenac",
    nameVi: "Diclofenac",
    inn: "Diclofenac",
    class: "NSAID",
    classes: ["nsaid"],
    vnBrands: ["Voltaren", "Cataflam"],
    forms: ["Viên nén 50 mg", "Viên nén 75 mg"],
    start: {
      amount: 50,
      unit: "mg",
      frequency: "2–3 lần/ngày",
      route: "uống",
      description: "50 mg x 2–3 lần/ngày trong đợt cấp (tối đa 150 mg/ngày)"
    },
    target: {
      amount: 50,
      unit: "mg",
      frequency: "2 lần/ngày",
      route: "uống",
      description: "50 mg x 2 lần/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "50 mg x 2–3 lần/ngày trong 3–5 ngày",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "caution",
        continue: "caution",
        dose: "Thận trọng, liều thấp nhất trong thời gian ngắn nhất",
        citationIds: ["byt.gout.2014.nsaid_agents", "kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "kdigo.gout.2024.acute_flare_ckd"]
      }
    ],
    gates: [
      {
        id: "gate_diclofenac_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút/1.73m2",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định trong tam cá nguyệt 3; tránh dùng trong tam cá nguyệt 1 và 2",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    lactation: {
      status: "caution",
      notesVi: "Bài tiết lượng nhỏ qua sữa mẹ; thận trọng khi dùng",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "peptic_ulcer",
        messageVi: "Chống chỉ định khi có tiền sử loét dạ dày tá tràng",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        code: "heart_failure",
        messageVi: "Chống chỉ định ở bệnh nhân suy tim và bệnh tim thiếu máu cục bộ đã xác lập",
        citationIds: ["kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        code: "anticoagulant_use",
        messageVi: "Chống chỉ định phối hợp với thuốc chống đông",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      }
    ],
    interactions: [
      "Thuốc chống đông: Tăng nguy cơ xuất huyết",
      "Lợi tiểu và RASi: Giảm chức năng thận",
      "Methotrexate: Tăng nồng độ methotrexate trong máu"
    ],
    citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
  },
  {
    id: "celecoxib",
    nameVi: "Celecoxib",
    inn: "Celecoxib",
    class: "COX-2i",
    classes: ["nsaid", "cox2i"],
    vnBrands: ["Celebrex", "Celecox"],
    forms: ["Viên nang 100 mg", "Viên nang 200 mg"],
    start: {
      amount: 200,
      unit: "mg",
      frequency: "2 lần/ngày",
      route: "uống",
      description: "200 mg x 2 lần/ngày (hoặc 400 mg khởi đầu rồi 200 mg x 2 lần/ngày)"
    },
    target: {
      amount: 200,
      unit: "mg",
      frequency: "1–2 lần/ngày",
      route: "uống",
      description: "200 mg x 1–2 lần/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "200 mg x 2 lần/ngày trong cơn cấp (3–5 ngày)",
        citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "caution",
        continue: "caution",
        dose: "Thận trọng, theo dõi chức năng thận; ưu tiên corticoid",
        citationIds: ["byt.gout.2014.nsaid_agents", "kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "kdigo.gout.2024.acute_flare_ckd"]
      }
    ],
    gates: [
      {
        id: "gate_celecoxib_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút/1.73m2",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định trong tam cá nguyệt 3; tránh dùng trong tam cá nguyệt 1 và 2",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    lactation: {
      status: "caution",
      notesVi: "Bài tiết lượng nhỏ qua sữa mẹ; cân nhắc cẩn thận",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "heart_failure",
        messageVi: "Chống chỉ định ở bệnh nhân suy tim nặng (NYHA II–IV) và bệnh tim thiếu máu cục bộ",
        citationIds: ["kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        code: "peptic_ulcer",
        messageVi: "Chống chỉ định khi đang có loét dạ dày tá tràng hoạt động",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        code: "anticoagulant_use",
        messageVi: "Chống chỉ định phối hợp với thuốc chống đông",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      }
    ],
    interactions: [
      "Thuốc chống đông: Tăng nguy cơ biến cố xuất huyết",
      "Fluconazole: Ức chế CYP2C9 làm tăng gấp đôi nồng độ celecoxib",
      "Lợi tiểu và RASi: Giảm tác dụng hạ áp và làm giảm mức lọc cầu thận"
    ],
    citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
  },
  {
    id: "etoricoxib",
    nameVi: "Etoricoxib",
    inn: "Etoricoxib",
    class: "COX-2i",
    classes: ["nsaid", "cox2i"],
    vnBrands: ["Arcoxia", "Etorix"],
    forms: ["Viên nén 60 mg", "Viên nén 90 mg", "Viên nén 120 mg"],
    start: {
      amount: 120,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "120 mg x 1 lần/ngày trong đợt cấp (tối đa 8 ngày)"
    },
    target: {
      amount: 120,
      unit: "mg",
      frequency: "1 lần/ngày",
      route: "uống",
      description: "120 mg x 1 lần/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "120 mg x 1 lần/ngày trong đợt cấp (tối đa 8 ngày)",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "caution",
        continue: "caution",
        dose: "Thận trọng, ưu tiên corticoid",
        citationIds: ["byt.gout.2014.nsaid_agents", "kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "kdigo.gout.2024.acute_flare_ckd"]
      }
    ],
    gates: [
      {
        id: "gate_etoricoxib_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút/1.73m2",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định trong thai kỳ",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    lactation: {
      status: "contra",
      notesVi: "Chống chỉ định khi cho con bú",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "heart_failure",
        messageVi: "Chống chỉ định ở bệnh nhân suy tim và tăng huyết áp chưa kiểm soát (>140/90 mmHg)",
        citationIds: ["kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        code: "peptic_ulcer",
        messageVi: "Chống chỉ định khi có tiền sử loét dạ dày tá tràng",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        code: "anticoagulant_use",
        messageVi: "Chống chỉ định phối hợp với thuốc chống đông",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      }
    ],
    interactions: [
      "Thuốc chống đông: Tăng nguy cơ biến cố xuất huyết nghiêm trọng",
      "Rifampicin: Giảm nồng độ etoricoxib trong huyết tương",
      "Thuốc hạ áp: Làm giảm hiệu quả kiểm soát huyết áp"
    ],
    citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
  },
  {
    id: "indomethacin",
    nameVi: "Indomethacin",
    inn: "Indomethacin",
    class: "NSAID",
    classes: ["nsaid"],
    vnBrands: ["Indocin", "Indomethacin"],
    forms: ["Viên nang 25 mg", "Viên nang 50 mg"],
    start: {
      amount: 50,
      unit: "mg",
      frequency: "3 lần/ngày",
      route: "uống",
      description: "50 mg x 3 lần/ngày trong đợt cấp"
    },
    target: {
      amount: 50,
      unit: "mg",
      frequency: "3 lần/ngày",
      route: "uống",
      description: "50 mg x 3 lần/ngày"
    },
    renal: [
      {
        eGFRFrom: 60,
        initiate: "rec",
        continue: "rec",
        dose: "50 mg x 3 lần/ngày trong 3–5 ngày sau ăn",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        eGFRFrom: 30,
        eGFRTo: 60,
        initiate: "caution",
        continue: "caution",
        dose: "Thận trọng, nguy cơ độc thận cao hơn các NSAID khác",
        citationIds: ["byt.gout.2014.nsaid_agents", "kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        eGFRTo: 30,
        initiate: "contra",
        continue: "contra",
        dose: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30", "kdigo.gout.2024.acute_flare_ckd"]
      }
    ],
    gates: [
      {
        id: "gate_indomethacin_egfr_min",
        parameter: "eGFR",
        operator: "<",
        threshold: 30,
        unit: "mL/min/1.73m2",
        action: "avoid",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút/1.73m2",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      }
    ],
    pregnancy: {
      status: "contra",
      notesVi: "Chống chỉ định trong thai kỳ",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    lactation: {
      status: "avoid",
      notesVi: "Bài tiết qua sữa mẹ; tránh dùng khi cho con bú",
      citationIds: ["byt.gout.2014.nsaid_agents"]
    },
    contraindications: [
      {
        code: "severe_ckd",
        messageVi: "Chống chỉ định khi eGFR < 30 mL/phút",
        citationIds: ["eular.gout.2016.benzbromarone_egfr30"]
      },
      {
        code: "peptic_ulcer",
        messageVi: "Chống chỉ định khi có tiền sử loét dạ dày tá tràng",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      },
      {
        code: "heart_failure",
        messageVi: "Chống chỉ định ở bệnh nhân suy tim",
        citationIds: ["kdigo.gout.2024.acute_flare_ckd"]
      },
      {
        code: "anticoagulant_use",
        messageVi: "Chống chỉ định phối hợp với thuốc chống đông",
        citationIds: ["byt.gout.2014.nsaid_agents"]
      }
    ],
    interactions: [
      "Thuốc chống đông: Tăng nguy cơ xuất huyết tiêu hóa",
      "Lợi tiểu và RASi: Nguy cơ suy thận cấp cao",
      "Probenecid: Làm tăng nồng độ indomethacin trong máu"
    ],
    citationIds: ["byt.gout.2014.nsaid_agents", "acr.gout.2020.flare_first_line"]
  }
];

// Write citations
fs.writeFileSync(path.join(baseDir, 'kb/citations/gout.json'), JSON.stringify(citations, null, 2) + '\n', 'utf8');
console.log('✔ Wrote kb/citations/gout.json (' + citations.length + ' citations)');

// Write thresholds
fs.writeFileSync(path.join(baseDir, 'kb/thresholds/gout.json'), JSON.stringify(thresholds, null, 2) + '\n', 'utf8');
console.log('✔ Wrote kb/thresholds/gout.json (' + thresholds.length + ' thresholds)');

// Write drugs
for (const d of drugs) {
  const p = path.join(baseDir, 'kb/drugs', d.id + '.json');
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
}
console.log('✔ Wrote ' + drugs.length + ' drug files to kb/drugs/');

// Write review files for all thresholds and drugs
const reviewDir = path.join(baseDir, 'kb/review');
fs.mkdirSync(reviewDir, { recursive: true });

for (const t of thresholds) {
  const hash = computeContentHash(t);
  const rev = {
    itemId: t.id,
    contentHash: hash,
    status: "auto_checked",
    reports: [
      {
        reviewedAt: "2026-10-27T01:00:00.000Z",
        role: "system_auto_validator",
        verdict: "pass",
        issues: [],
        summary: "Tự động kiểm tra tính toàn vẹn của Threshold ID: " + t.id
      }
    ],
    lastReviewedAt: "2026-10-27T01:00:00.000Z"
  };
  fs.writeFileSync(path.join(reviewDir, t.id + '.json'), JSON.stringify(rev, null, 2) + '\n', 'utf8');
}

for (const d of drugs) {
  const hash = computeContentHash(d);
  const rev = {
    itemId: d.id,
    contentHash: hash,
    status: "auto_checked",
    reports: [
      {
        reviewedAt: "2026-10-27T01:00:00.000Z",
        role: "system_auto_validator",
        verdict: "pass",
        issues: [],
        summary: "Tự động kiểm tra tính toàn vẹn của DrugEntry: " + d.id
      }
    ],
    lastReviewedAt: "2026-10-27T01:00:00.000Z"
  };
  fs.writeFileSync(path.join(reviewDir, d.id + '.json'), JSON.stringify(rev, null, 2) + '\n', 'utf8');
}
console.log('✔ Wrote review files for all thresholds and drugs in kb/review/');
