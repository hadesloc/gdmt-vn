# Báo Cáo Thẩm Định Chuyên Môn Vòng 1 – Reviewer R2 (Dược Sĩ Lâm Sàng)
## Module: Đái Tháo Đường Típ 2 (`dm2`) – GDMT-VN

- **Reviewer**: R2 – Dược sĩ lâm sàng (Nội tiết) (Clinical Pharmacist - Endocrinology)
- **Vòng duyệt**: Round 1
- **Ngày thực hiện**: 27/10/2026
- **Phạm vi thẩm định**:
  1. **21 tệp dữ liệu thuốc** `gdmt-vn/kb/drugs/*.json` thuộc module ĐTĐ típ 2:
     - Nhóm Biguanide: `metformin`
     - Nhóm Đồng vận GLP-1 (GLP-1 RA): `semaglutide` (SC), `semaglutide_oral` (viên uống), `dulaglutide`, `liraglutide`
     - Nhóm Đồng vận kép GIP/GLP-1 RA: `tirzepatide`
     - Nhóm Ức chế DPP-4 (DPP-4i): `sitagliptin`, `linagliptin`, `vildagliptin`, `saxagliptin`
     - Nhóm Sulfonylurea (SU): `gliclazide` (MR), `glimepiride`
     - Nhóm Thiazolidinedione (TZD): `pioglitazone`
     - Nhóm Ức chế Alpha-glucosidase: `acarbose`
     - Nhóm Insulin nền (Basal / Intermediate / Ultra-long): `insulin_glargine`, `insulin_degludec`, `insulin_detemir`, `insulin_nph`
     - Nhóm Insulin bữa ăn (Prandial rapid-acting): `insulin_aspart`, `insulin_lispro`
     - Nhóm Insulin hỗn hợp (Biphasic Premix): `insulin_premix`
  2. **Ma trận an toàn thuốc**: `src/modules/dm2/matrix.ts` (Ma trận chức năng thận eGFR và Ma trận bệnh đồng mắc).
  3. **Máy tính lâm sàng**: `src/engine/calculators/insulin.ts` (Tính toán tổng liều TDD, phân bổ Basal-Bolus, nhóm nhạy cảm/đề kháng).
  4. **Liều dùng trong các luật lâm sàng**: `src/modules/dm2/rules.outpatient.ts` (11 luật ngoại trú) và `src/modules/dm2/rules.inpatient.ts` (7 luật nội viện & cấp cứu).
  5. **Ca lâm sàng thực nghiệm**:
     - Chạy đánh giá động (`evaluate()`) trên 4 ca mẫu `presets.ts`.
     - Chạy kiểm thử tự động toàn diện 34 ca chuẩn `tests/golden/dm2/*.json`.
  6. **Đối chiếu nhãn gốc chính thức**:
     - FDA DailyMed (`Medical_Library_2026/09_Nhan_Thuoc/FDA/`): Metformin, Ozempic sc, Rybelsus oral, Mounjaro, Trulicity, Victoza, Januvia, Tradjenta, Onglyza, Glimepiride, Actos, Lantus.
     - EMA SmPC (`Medical_Library_2026/09_Nhan_Thuoc/EMA/`): Diamicron MR (Gliclazide), Galvus (Vildagliptin).
     - Hướng dẫn lâm sàng quốc tế và Việt Nam: ADA Standards of Care 2026 (Ch. 6, 9, 10, 11, 13, 15, 16); Consensus Cấp cứu Tăng đường huyết Quốc tế 2024 (ADA/EASD/JBDS/AACE/DTS); KDIGO 2022/2024 Diabetes in CKD; Bộ Y tế QĐ 5481/QĐ-BYT 2020 và QĐ 1353/QĐ-BYT 2021.

---

## 1. TỔNG QUAN KẾT QUẢ THẨM ĐỊNH

| Mức độ nghiêm trọng (Severity) | Số lượng | Ghi chú tóm tắt |
|---|:---:|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **2** | 1. Ma trận & KB cho phép dùng Gliclazide MR (`caution`, 30 mg/ngày) ở suy thận nặng và lọc máu (G4, G5, Lọc máu), vi phạm chống chỉ định tuyệt đối EMA SmPC Mục 4.3 và KDIGO 2022, gây nguy cơ hạ đường huyết ác tính kéo dài đe dọa tính mạng.<br>2. Luật `dm2.outpatient.cardiorenal_glp1` thiếu cổng an toàn `eGFR ≥ 15`, dẫn đến chỉ định START Semaglutide ở bệnh nhân suy thận mạn giai đoạn 5 (eGFR 12 mL/phút ở ca dm2_06). |
| **MAJOR** (Sai sót liều / nhãn / an toàn cốt lõi) | **9** | 1. Toàn bộ 5 thuốc Incretin thiếu Cảnh báo hộp đen FDA về Ung thư tuyến giáp thể tủy (MTC), MEN 2 và Viêm tụy cấp.<br>2. Giao thức cấp cứu DKA hoãn insulin khi K⁺ < 3.5 gán nhầm `drugId: 'insulin_glargine'` thay vì Regular insulin TM; KB thiếu tệp `insulin_regular`.<br>3. Giao thức cấp cứu HHS xuất sai tiêu chuẩn giải quyết toan ceton DKA.<br>4. Ma trận chức năng thận eGFR hiển thị `no_data` ở G5/Lọc máu cho 5 thuốc Incretin và bỏ sót 7 thuốc ĐTĐ.<br>5. Phác đồ Basal-Bolus nội viện chỉ sinh 1 y lệnh Glargine, thiếu lệnh xuất kho Insulin Aspart.<br>6. Tạm ngừng SGLT2i trước mổ hardcode cố định `dapagliflozin`, bỏ sót nếu BN dùng Empagliflozin.<br>7. Xuống thang ở người già suy yếu thiếu `drugId` và tỷ lệ giảm liều insulin.<br>8. Toàn bộ 21 thuốc DM2 thiếu thông tin và Gate an toàn thai kỳ.<br>9. Vildagliptin thiếu cảnh báo và chống chỉ định suy gan (EMA SmPC Mục 4.3). |
| **MINOR** (Lỗi hiển thị UI, thiếu cảnh báo phụ) | **4** | 1. Không cảnh báo chuyển đổi liều U-100 (Lantus) sang U-300 (Toujeo).<br>2. Không phân biệt thời điểm tiêm Premix người (30 phút trước ăn) và Premix analog (ngay trước ăn).<br>3. Đích đường huyết ICU hiển thị thiếu cận dưới 140 mg/dL: `(180 mg/dL)`.<br>4. Liệt kê hàm lượng bút tiêm Trulicity 3.0/4.5 mg và Mounjaro chưa lưu hành rộng rãi tại VN. |
| **SUGGESTION** (Kiến nghị cải tiến kỹ thuật) | **1** | Hardcode literal `dosePerKg > 0.5` trong quy tắc overbasalization; mở rộng máy tính `insulin.ts` tính ISF. |
| **TỔNG CỘNG** | **16** | |

### KẾT LUẬN CUỐI VÒNG 1: **FAIL**
*(Theo quy chuẩn `docs/REVIEW_PROTOCOL.md`: Module chỉ đạt PASS khi có 0 lỗi Critical và 0 lỗi Major).*

---

## 2. BẢNG KIỂM TRA CHI TIẾT 21 DƯỢC CHẤT (`kb/drugs/`)

| STT | Hoạt chất | Nhóm dược lý | Liều khởi đầu | Liều đích / Tối đa | Ngưỡng thận (eGFR/CrCl) | Biệt dược tại VN | Đánh giá dược lâm sàng R2 |
|:---:|---|:---:|---|---|---|---|---|
| 1 | **Metformin** | Biguanide | 500 mg x 1–2 lần/ngày sau ăn | 2000 mg/ngày (chia 2 lần hoặc XR tối) | eGFR ≥ 45: 500–2000 mg<br>30–44: Không khởi mới; đang dùng max 1000 mg<br>**< 30: Chống chỉ định** | Glucophage, Panfor SR | **ĐẠT LIỀU CHUẨN**. Đúng FDA 2016 & ADA 2026. Lỗi nhỏ: 'MetforMIN' viết hoa bất thường. Thiếu Gate thai kỳ. |
| 2 | **Semaglutide (SC)** | GLP-1 RA | 0.25 mg/tuần x 4 tuần | Đích 1.0 mg/tuần (Max 2.0 mg/tuần) | eGFR ≥ 15: Không chỉnh liều<br>**< 15: Thiếu dải KB (hiện no_data)** | Ozempic (bút 2 mg/1.5 mL, 4 mg/3 mL) | **NGUY CƠ AN TOÀN**. Thiếu cổng chặn khởi mới khi eGFR < 15. Thiếu Cảnh báo hộp đen FDA về MTC/MEN 2. |
| 3 | **Semaglutide (Uống)** | GLP-1 RA uống | 3 mg/ngày bụng đói x 30 ngày | 7–14 mg/ngày | eGFR ≥ 15: Không chỉnh liều<br>**< 15: Thiếu dải KB** | Rybelsus (3, 7, 14 mg) | **CẦN BỔ SUNG**. Hướng dẫn uống bụng đói chuẩn xác. Thiếu dải eGFR < 15. Thiếu Cảnh báo hộp đen MTC/MEN 2. Chưa có BHYT tại VN. |
| 4 | **Tirzepatide** | Dual GIP/GLP-1 RA | 2.5 mg/tuần x 4 tuần | Đích 5 mg/tuần (Max 15 mg/tuần) | eGFR ≥ 15: Không chỉnh liều<br>**< 15: Thiếu dải KB** | Mounjaro (2.5, 5, 7.5, 10, 12.5, 15 mg) | **CẦN BỔ SUNG**. Liều chuẩn FDA SURPASS. Thiếu dải eGFR < 15. Thiếu Cảnh báo hộp đen MTC/MEN 2. Chưa lưu hành phổ biến tại BV công VN. |
| 5 | **Dulaglutide** | GLP-1 RA | 0.75 mg/tuần | Đích 1.5 mg/tuần (Max FDA 4.5 mg) | eGFR ≥ 15: Không chỉnh liều<br>**< 15: Thiếu dải KB** | Trulicity (0.75, 1.5 mg) | **CẦN SỬA**. Liệt kê hàm lượng 3.0 và 4.5 mg không có ở VN. Thiếu dải eGFR < 15. Thiếu Cảnh báo hộp đen MTC/MEN 2. |
| 6 | **Liraglutide** | GLP-1 RA | 0.6 mg/ngày trong 1 tuần | Đích 1.2 mg/ngày (Max 1.8 mg/ngày) | eGFR ≥ 15: Không chỉnh liều<br>**< 15: Thiếu dải KB** | Victoza (bút 6 mg/mL - 3 mL) | **ĐẠT LIỀU CHUẨN**. Đúng nghiên cứu LEADER. Thiếu dải eGFR < 15. Thiếu Cảnh báo hộp đen MTC/MEN 2. |
| 7 | **Sitagliptin** | DPP-4i | 100 mg 1 lần/ngày | 100 mg 1 lần/ngày | eGFR ≥ 45: 100 mg<br>30–44: 50 mg<br>**< 30 (kể cả lọc máu): 25 mg** | Januvia (25, 50, 100 mg) | **XUẤT SẮC**. Khớp hoàn toàn FDA Januvia và KDIGO 2022. Chặn đúng phối hợp GLP-1 RA. Thiếu Gate thai kỳ. |
| 8 | **Linagliptin** | DPP-4i | 5 mg 1 lần/ngày | 5 mg 1 lần/ngày | **Không chỉnh liều ở mọi giai đoạn suy thận & lọc máu** (thải mật > 80%) | Trajenta (5 mg) | **XUẤT SẮC**. Khớp hoàn toàn FDA Tradjenta và CARMELINA. Thiếu Gate thai kỳ. |
| 9 | **Vildagliptin** | DPP-4i | 50 mg x 2 lần/ngày (sáng/tối) | 50 mg x 2 lần/ngày | eGFR ≥ 50: 100 mg (chia 2)<br>**< 50: 50 mg x 1 lần/ngày buổi sáng** | Galvus (50 mg) | **THIẾU CẢNH BÁO GAN**. Đúng liều thận EMA SmPC. Bỏ sót hoàn toàn chống chỉ định suy gan và theo dõi ALT/AST định kỳ. |
| 10 | **Saxagliptin** | DPP-4i | 5 mg 1 lần/ngày | 5 mg 1 lần/ngày | eGFR ≥ 45: 5 mg<br>**< 45: 2.5 mg 1 lần/ngày** | Onglyza (2.5, 5 mg) | **ĐẠT AN TOÀN TIM**. Chặn đúng ở suy tim (SAVOR-TIMI 53). FDA quy định giảm liều khi CrCl ≤ 50 mL/min. Thiếu tương tác ức chế CYP3A4. |
| 11 | **Gliclazide MR** | Sulfonylurea | 30 mg 1 lần/ngày bữa sáng | 60–120 mg/ngày | eGFR ≥ 30: 30–120 mg<br>**< 30: KB ghi caution 30 mg (SAI TRẦM TRỌNG)** | Diamicron MR, Predian MR (30, 60 mg) | **SAI CHỐNG CHỈ ĐỊNH (CRITICAL)**. EMA SmPC 4.3 chống chỉ định ở suy thận nặng/lọc máu; KB lại cho dùng 30 mg gây nguy cơ hạ đường huyết ác tính. |
| 12 | **Glimepiride** | Sulfonylurea | 1 mg 1 lần/ngày bữa sáng | 4 mg/ngày (Max 8 mg) | eGFR ≥ 60: 1–4 mg<br>30–59: Khởi đầu 1 mg<br>**< 30: Tránh dùng (KDIGO 2022)** | Amaryl, Diapride (1, 2, 4 mg) | **ĐẠT LIỀU CHUẨN**. Gating người cao tuổi bắt đầu 1 mg chuẩn xác. Khuyến cáo tránh dùng khi eGFR < 30. |
| 13 | **Pioglitazone** | TZD | 15 mg 1 lần/ngày | 30–45 mg/ngày | eGFR ≥ 15: 15–45 mg (không chỉnh thận)<br>< 15: Thận trọng giữ nước | Actos, Pionorm (15, 30, 45 mg) | **ĐẠT CẢNH BÁO SUY TIM**. Chặn đúng ở suy tim (Boxed Warning). Thiếu cảnh báo ung thư bàng quang của FDA. |
| 14 | **Acarbose** | Alpha-glucosidase inh. | 50 mg x 3 lần/ngày nhai cơm đầu | 100 mg x 3 lần/ngày (Max 300 mg) | eGFR ≥ 30: 50–100 mg x 3<br>**< 30: Chống chỉ định** | Glucobay (50, 100 mg) | **BỎ SÓT MA TRẬN**. Liều và dải thận trong KB chuẩn; tương tác dùng dextrose xử trí hạ ĐH rất tốt. Nhưng bị bỏ sót hoàn toàn khỏi ma trận thận. |
| 15 | **Insulin Glargine** | Basal Insulin analog | 10 U hoặc 0.1–0.2 U/kg/ngày | 20 U hoặc chuẩn độ theo FPG | eGFR 30–60: Giảm 10–25%<br>< 30: Giảm 25–50% liều | Lantus, Toujeo | **CẦN SỬA**. Gán sai drugId cho cấp cứu DKA hoãn insulin. Thiếu ghi chú chuyển đổi liều U-100 (Lantus) sang U-300 (Toujeo). |
| 16 | **Insulin Degludec** | Ultra-long Basal | 10 U hoặc 0.1–0.2 U/kg/ngày | Chuẩn độ theo FPG | eGFR ≥ 15: Giảm liều theo dõi<br>**< 15: Thiếu dải KB** | Tresiba (bút FlexTouch 100 U/mL) | **BỎ SÓT MA TRẬN**. Tác dụng kéo dài > 42h, ít hạ đường huyết đêm. Bị bỏ sót khỏi danh sách thuốc ma trận thận. |
| 17 | **Insulin Detemir** | Basal Insulin | 10 U hoặc 0.1–0.2 U/kg 1–2 lần/ngày | Chuẩn độ theo FPG | eGFR ≥ 15: Giảm liều theo dõi<br>**< 15: Thiếu dải KB** | Levemir (FlexPen 100 U/mL) | **BỎ SÓT MA TRẬN**. Toàn cầu và VN đang thu hẹp lưu hành Levemir. Bị bỏ sót khỏi ma trận thận. |
| 18 | **Insulin NPH** | Intermediate Insulin | 10 U trước ngủ (hoặc sáng cùng steroid) | Chuẩn độ theo glucose | eGFR ≥ 15: Giảm liều theo dõi<br>**< 15: Thiếu dải KB** | Insulatard, Humulin N | **BỎ SÓT MA TRẬN**. Thuốc số 1 cho tăng đường huyết do Glucocorticoid. Thiếu dải eGFR < 15. Bị bỏ sót khỏi ma trận thận. |
| 19 | **Insulin Aspart** | Rapid Prandial analog | 4 U (hoặc 10% basal) trước ăn 0–15' | Chuẩn độ theo glucose sau ăn | eGFR ≥ 15: Chỉnh liều theo dõi<br>**< 15: Thiếu dải KB** | NovoRapid, Fiasp | **BỎ SÓT MA TRẬN & Y LỆNH**. Bị bỏ sót khỏi y lệnh xuất Basal-Bolus nội trú. Bị bỏ sót khỏi ma trận thận. |
| 20 | **Insulin Lispro** | Rapid Prandial analog | 4 U trước ăn 0–15 phút | Chuẩn độ theo bữa ăn | eGFR ≥ 15: Chỉnh liều theo dõi<br>**< 15: Thiếu dải KB** | Humalog (KwikPen 100 U/mL) | **BỎ SÓT MA TRẬN**. Gating NPO tạm hoãn bolus tốt. Bị bỏ sót khỏi ma trận thận. |
| 21 | **Insulin Premix** | Biphasic hỗn hợp | 10–20 U chia 2/3 sáng, 1/3 chiều | Chuẩn độ theo glucose | eGFR ≥ 15: Giảm liều theo dõi<br>**< 15: Thiếu dải KB** | Mixtard 30, Novomix 30, Humalog Mix | **BỎ SÓT MA TRẬN**. Không phân biệt thời điểm tiêm Premix người (trước 30 phút) và Premix analog (ngay trước ăn). Bỏ sót khỏi ma trận. |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC PHÁT HIỆN TRỌNG TÂM (CRITICAL & MAJOR FINDINGS)

### Finding DM2-R2-01 (CRITICAL): Ma Trận và KB Cho Phép Dùng Gliclazide MR ở Bệnh Nhân Suy Thận Nặng (G4, G5, Lọc Máu)
- **Vị trí**: `kb/drugs/gliclazide.json` (dòng 47–53) & `src/modules/dm2/matrix.ts` (dòng 82, hàm `buildDrugRow`).
- **Phân tích cơ chế & dược lý lâm sàng**:
  - `Gliclazide` là sulfonylurea thế hệ 2 kích thích tế bào beta tụy tiết insulin liên tục, độc lập với nồng độ glucose máu.
  - Khi chức năng thận suy giảm nặng (eGFR < 30 mL/phút/1.73m²), khả năng tân tạo glucose của vỏ thận (chiếm tới 20–40% tổng tân tạo đường của cơ thể trong trạng thái đói) bị suy giảm nghiêm trọng. Đồng thời, độ thanh thải thuốc và các chất chuyển hóa giảm làm kéo dài thời gian bán thải sinh học.
  - Theo **EMA SmPC chính thức của Diamicron MR** (`gliclazide_MR_Diamicron_SmPC.pdf` Mục 4.3 CONTRAINDICATIONS, trang 2):
    > *"This medicine is contraindicated in the following cases:... Severe renal or hepatic insufficiency: in these cases the use of insulin is recommended"*.
  - Theo **Hướng dẫn chẩn đoán và điều trị ĐTĐ típ 2 của Bộ Y tế** (QĐ 5481/QĐ-BYT 2020) và **KDIGO 2022 Diabetes in CKD**: Nhóm Sulfonylurea chống chỉ định khi suy thận nặng (eGFR < 30 mL/phút/1.73m²).
  - Trái lại, trong `kb/drugs/gliclazide.json`, dải thận eGFR < 30 lại ghi:
    ```json
    {
      "eGFRTo": 30,
      "initiate": "caution",
      "continue": "caution",
      "dose": "30 mg/ngày",
      "note": "Thận trọng tối đa và theo dõi sát đường huyết khi suy thận nặng"
    }
    ```
  - Hậu quả trực tiếp trên giao diện ma trận: Tại cột **G4 (eGFR 15–29)**, cột **G5 (eGFR < 15)** và cột **Lọc máu (HD/PD)**, ma trận GDMT-VN đều hiển thị ô màu vàng `caution / caution: 30 mg/ngày`. Bác sĩ xem ma trận sẽ hiểu rằng người bệnh chạy thận nhân tạo chu kỳ vẫn được phép khởi trị mới hoặc duy trì Gliclazide MR 30 mg/ngày.
- **Hệ quả trên thực tế điều trị**:
  Bệnh nhân suy thận mạn giai đoạn cuối dùng Gliclazide sẽ phải đối mặt với các cơn hạ đường huyết ác tính, kéo dài nhiều ngày (refractory hypoglycemia) không đáp ứng với truyền đường thông thường, có thể dẫn tới hôn mê hạ đường huyết không hồi phục, tổn thương não vĩnh viễn và tử vong.
- **Hành động khắc phục**:
  Sửa ngay dải `eGFRTo: 30` trong `gliclazide.json`: đổi `initiate` thành `"contra"`, `continue` thành `"contra"`, liều: `"Chống chỉ định tuyệt đối khi eGFR < 30 mL/phút; ưu tiên chuyển sang Insulin"`.

---

### Finding DM2-R2-02 (CRITICAL): Khởi Trị Semaglutide SC ở Suy Thận Mạn Giai Đoạn 5 (eGFR < 15 mL/phút) Do Thiếu Cổng An Toàn Thận
- **Vị trí**: `src/modules/dm2/rules.outpatient.ts` (dòng 170–223, rule `dm2.outpatient.cardiorenal_glp1`).
- **Phân tích cơ chế & dược lý lâm sàng**:
  - Hướng dẫn lâm sàng quốc tế KDIGO 2024 (*Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease*, Recommendation 1.3) và ADA 2026 Ch. 11 khuyến cáo chỉ định GLP-1 RA bảo vệ tim–thận ở người bệnh ĐTĐ típ 2 có kèm bệnh thận mạn (CKD) khi **eGFR ≥ 15 mL/phút/1.73m²**.
  - Các thử nghiệm lâm sàng ngẫu nhiên bước ngoặt đánh giá biến cố tim mạch và thận của Semaglutide (FLOW, SUSTAIN-6) và Tirzepatide (SURPASS-4) đều đặt tiêu chí loại trừ chặt chẽ: **Không tuyển bệnh nhân có eGFR < 15 mL/phút/1.73m² hoặc đang lọc máu**. Hiện nay chưa có dữ liệu lâm sàng ngẫu nhiên chứng minh tính an toàn và hiệu quả khi bắt đầu dùng mới GLP-1 RA ở bệnh nhân CKD giai đoạn 5 chưa lọc máu hoặc đang lọc máu.
  - Nhãn FDA Ozempic (Mục 5.4 Acute Kidney Injury) cảnh báo: Tác dụng phụ trên đường tiêu hóa (buồn nôn, nôn mửa dữ dội, tiêu chảy) xảy ra ở 15–20% bệnh nhân mới dùng GLP-1 RA. Ở bệnh nhân suy thận nặng (eGFR < 15), mất nước cấp tính sẽ đẩy nhanh người bệnh vào suy thận tận không hồi phục hoặc sốc giảm thể tích.
  - Tuy nhiên, trong `rules.outpatient.ts`:
    ```typescript
    const hasCkd = Boolean(ctx.patient.conditions?.ckd || (egfr !== undefined && egfr < th('dm2.ckd.egfr_threshold')));
    ...
    const action = isTakingGlp1 ? 'CONTINUE' : 'START';
    return {
      id: 'rec_dm2_glp1_cardiorenal',
      action,
      gates: [], // HOÀN TOÀN KHÔNG CÓ CỔNG AN TOÀN eGFR!
    };
    ```
- **Hệ quả trên ca bệnh thực tế**:
  Khi chạy `evaluate()` trên ca chuẩn `dm2_06_metformin_contra_g5.json` (bệnh nhân nam 68 tuổi, creatinin 450 µmol/L, eGFR tính toán là **12 mL/phút/1.73m²** – suy thận mạn giai đoạn 5), engine đưa ra y lệnh:
  `[START] rec_dm2_glp1_cardiorenal: Khởi trị Semaglutide (SC) (0.25 mg x 1 lần/tuần...)`.
  Đây là một chỉ định khởi mới vượt ngoài chỉ định nhãn thuốc và ngoài vùng khuyến cáo an toàn của KDIGO 2024 / ADA 2026.
- **Hành động khắc phục**:
  Bổ sung cổng an toàn `eGFR >= 15` vào luật `dm2.outpatient.cardiorenal_glp1`:
  ```typescript
  if (egfr !== undefined && egfr < 15 && !isTakingGlp1) {
    action = 'AVOID'; // hoặc 'DEFER'
  }
  ```
  Gắn kèm đối tượng GateResult giải thích rõ: `eGFR < 15 mL/phút/1.73m²: Chưa có đủ bằng chứng an toàn để khởi trị mới GLP-1 RA ở CKD giai đoạn 5`.

---

### Finding DM2-R2-03 (MAJOR): Thiếu Cảnh Báo Hộp Đen FDA về Ung Thư Tuyến Giáp Thể Tủy (MTC) và MEN 2 ở 5 Thuốc Incretin
- **Vị trí**: `kb/drugs/semaglutide.json`, `semaglutide_oral.json`, `tirzepatide.json`, `dulaglutide.json`, `liraglutide.json`.
- **Phân tích dược lý**:
  - Toàn bộ thuốc chủ vận thụ thể GLP-1 (Semaglutide, Dulaglutide, Liraglutide) và đồng vận kép GIP/GLP-1 (Tirzepatide) đều mang **Cảnh báo hộp đen bắt buộc (FDA BOXED WARNING)** và chống chỉ định tuyệt đối trên toàn cầu đối với:
    1. Bệnh nhân có tiền sử bản thân hoặc gia đình mắc **Ung thư biểu mô tuyến giáp thể tủy (Medullary Thyroid Carcinoma - MTC)**.
    2. Bệnh nhân mắc **Hội chứng đa u tuyến nội tiết típ 2 (Multiple Endocrine Neoplasia syndrome type 2 - MEN 2)**.
  - Cơ chế: Thuốc kích hoạt thụ thể GLP-1 trên tế bào C của tuyến giáp, gây tăng sinh tế bào C và phát triển khối u tuyến giáp thể tủy quan sát thấy trên mô hình động vật gặm nhấm.
  - Kiểm tra 5 file JSON trong KB cho thấy mảng `gates` và `contraindications` hoàn toàn không có bất kỳ thông tin nào về MTC hay MEN 2.
- **Hành động khắc phục**:
  Thêm `gate_glp1_mtc_men2_contra` vào cả 5 tệp thuốc Incretin, đồng thời bổ sung kiểm tra cờ tiền sử `ctx.patient.customInputs?.mtcMen2History` trong luật lâm sàng.

---

### Finding DM2-R2-04 (MAJOR): Gán Sai `drugId: 'insulin_glargine'` Cho Khuyến Cáo Hoãn Insulin Cấp Cứu DKA Khi Hạ Kali Máu
- **Vị trí**: `src/modules/dm2/rules.inpatient.ts` (dòng 289 & 314).
- **Phân tích dược lý & lâm sàng**:
  - Trong cấp cứu Toan ceton đái tháo đường (DKA) và Tăng áp lực thẩm thấu máu (HHS), loại insulin dùng để truyền tĩnh mạch liên tục là **Insulin Regular (Insulin người tác dụng ngắn, ví dụ Actrapid, Humulin R lọ 100 U/mL 10 mL)**.
  - Khi Kali máu < 3.5 mmol/L (hoặc chưa có kết quả K⁺), bất biến an toàn sống còn bắt buộc là: **HOÃN KHỞI ĐẦU HOẶC NGỪNG TRUYỀN TĨNH MẠCH REGULAR INSULIN**, vì insulin thúc đẩy đồng vận chuyển Na+/K+ ATPase đưa kali ồ ạt vào nội bào, làm kali máu tụt dốc gây rung thất, vô tâm thu và tử vong.
  - Tuy nhiên, trong `rules.inpatient.ts`:
    - Dòng 289 (chưa có K+): `drugId: 'insulin_glargine'`
    - Dòng 314 (K+ < 3.5): `drugId: 'insulin_glargine'`
  - Insulin Glargine là insulin nền analog tiêm dưới da (subcutaneous), không bao giờ được dùng để tiêm/truyền tĩnh mạch cấp cứu DKA.
  - Nguyên nhân sâu xa: Trong danh mục 21 thuốc ĐTĐ của KB (`kb/drugs/`), tác giả hoàn toàn quên không tạo tệp hoạt chất `insulin_regular.json` nên đã dùng tạm `insulin_glargine` để "thế chỗ".
- **Hệ quả trên ca bệnh thực tế**:
  Trên ca BN 4 (`dm2_preset_inpatient_dka_emergency`, K⁺ = 3.1 mmol/L), hệ thống xuất ra:
  `[HOLD] drugId=insulin_glargine: NGUY CẤP: HOÃN INSULIN NGAY – BÙ KALI TĨNH MẠCH (K⁺ = 3.1 mmol/L < 3.5)`.
  Bác sĩ trẻ hoặc điều dưỡng trực đọc lệnh có thể nhầm là chỉ hoãn bút tiêm Glargine dưới da, trong khi y lệnh truyền bơm tiêm điện Regular insulin TM vẫn tiếp tục chạy, gây nguy cơ tử vong do loạn nhịp tim hạ kali máu kịch phát.
- **Hành động khắc phục**:
  Tạo tệp `kb/drugs/insulin_regular.json` (Actrapid / Humulin R lọ 10 mL 100 U/mL). Sửa `drugId` trong luật DKA/HHS thành `insulin_regular` (hoặc `undefined` nếu là giao thức cấp cứu tổng hợp).

---

### Finding DM2-R2-05 (MAJOR): Giao Thức Cấp Cứu HHS Xuất Nhầm Tiêu Chuẩn Giải Quyết Của Toan Ceton (DKA)
- **Vị trí**: `src/modules/dm2/rules.inpatient.ts` (dòng 342, rule `dm2.inpatient.dka_hhs_emergency`).
- **Phân tích cơ chế**:
  - DKA và HHS là hai hội chứng cấp cứu tăng đường huyết với cơ chế sinh bệnh học và tiêu chuẩn lui bệnh hoàn toàn khác nhau:
    - **DKA (Toan ceton)**: Tiêu chuẩn giải quyết là hết toan chuyển hóa và hết ceton máu: Beta-hydroxybutyrate < 0.6 mmol/L, pH tĩnh mạch ≥ 7.30, HCO₃⁻ ≥ 18 mmol/L.
    - **HHS (Tăng áp lực thẩm thấu)**: Vốn dĩ không có toan máu (ngay lúc nhập viện pH thường > 7.30 và HCO₃⁻ > 18 mmol/L). Tiêu chuẩn lui bệnh của HHS theo Đồng thuận Quốc tế 2024 (*ADA/EASD/JBDS/AACE Consensus 2024*, trang 8) bắt buộc phải là: **Áp lực thẩm thấu máu hiệu dụng giảm xuống dưới 300 mOsm/kg, glucose máu ≤ 13.9 mmol/L (250 mg/dL), lượng nước tiểu ≥ 0.5 mL/kg/h và người bệnh phục hồi tri giác hoàn toàn**.
  - Trong `rules.inpatient.ts`: Biến `transitionAdvice` tại dòng 342 được gán cứng cho cả DKA lẫn HHS:
    ```typescript
    const transitionAdvice = 'Chuyển tiêm dưới da: Khi DKA giải quyết (Beta-hydroxybutyrate < 0.6 mmol/L, pH ≥ 7.30, HCO₃⁻ ≥ 18 mmol/L, ăn được), TIÊM INSULIN DƯỚI DA 1–2 GIỜ TRƯỚC KHI NGỪNG TRUYỀN TĨNH MẠCH để tránh tái phát toan ceton.';
    ```
- **Hệ quả trên ca bệnh thực tế**:
  Khi chạy trên ca `dm2_33_icu_hhs_hyperosmolar.json` (bệnh nhân HHS nặng, glucose 38 mmol/L, áp lực thẩm thấu máu hiệu dụng 335 mOsm/kg, ceton 0.4 mmol/L), khuyến cáo hướng dẫn: *"Khi DKA giải quyết (Beta-hydroxybutyrate < 0.6, pH ≥ 7.30, HCO3 ≥ 18) thì chuyển tiêm dưới da"*. Bệnh nhân HHS vốn đã có ceton < 0.6 và pH ≥ 7.30 từ đầu, nếu nhân viên y tế làm theo sẽ cắt dịch truyền tĩnh mạch và ngừng insulin ngay lập tức khi áp lực thẩm thấu máu vẫn còn 330 mOsm/kg, khiến bệnh nhân tiếp tục hôn mê và tắc mạch do tăng đông.
- **Hành động khắc phục**:
  Tách riêng văn bản chuyển tiếp:
  ```typescript
  const transitionAdvice = isHhsPure
    ? 'Chuyển tiêm dưới da: Khi HHS giải quyết (Áp lực thẩm thấu máu hiệu dụng < 300 mOsm/kg, Glucose ≤ 13.9 mmol/L, tri giác tỉnh táo, nước tiểu ≥ 0.5 mL/kg/h, ăn uống được), tiêm insulin dưới da 1–2 giờ trước khi ngừng truyền tĩnh mạch.'
    : 'Chuyển tiêm dưới da: Khi DKA giải quyết (Beta-hydroxybutyrate < 0.6 mmol/L, pH ≥ 7.30, HCO₃⁻ ≥ 18 mmol/L, ăn được), tiêm insulin dưới da 1–2 giờ trước khi ngừng truyền tĩnh mạch.';
  ```

---

### Finding DM2-R2-06 (MAJOR): Ma Trận Thận Trả Về `no_data` ở Dải G5/Lọc Máu Đối Với 5 Thuốc Incretin và Bỏ Sót 7 Thuốc ĐTĐ
- **Vị trí**: `src/modules/dm2/matrix.ts` (mảng `DM2_MATRIX_DRUG_IDS` và các tệp JSON incretin).
- **Phân tích cơ chế**:
  - Trong `kb/drugs/` của 5 thuốc Incretin (`semaglutide`, `semaglutide_oral`, `tirzepatide`, `dulaglutide`, `liraglutide`), mảng `renal` chỉ khai báo 1 dải duy nhất: `eGFRFrom: 15`.
  - Hàm tìm kiếm `renalBand(drugId, egfr)` trong `src/kb-types/access.ts` (dòng 212–222) kiểm tra điều kiện `value >= from && value < to`. Khi ma trận gọi điểm mẫu cột G5 (eGFR = 10) hoặc Lọc máu (eGFR = 5), hàm không tìm thấy dải nào và trả về `undefined`. Kết quả là ô ma trận bị gán giá trị mặc định:
    `cells[col.id] = { initiate: 'no_data', continue: 'no_data', dose: 'N/A' }`.
  - Trên giao diện ma trận dược lý, người dùng sẽ thấy toàn bộ ô G5 và Lọc máu của Ozempic, Rybelsus, Mounjaro, Trulicity, Victoza đều hiển thị màu xám `no_data`, tạo cảm giác hệ thống bị lỗi dữ liệu.
  - Về mặt lâm sàng: Ở eGFR < 15 hoặc lọc máu, nhãn FDA và hướng dẫn KDIGO 2024 nêu rõ: Dữ liệu lâm sàng rất hạn chế, không khuyến cáo khởi trị mới (`initiate: 'not_rec'`), nếu đang dùng cần theo dõi sát nguy cơ mất nước (`continue: 'caution'`).
  - Ngoài ra, danh sách `DM2_MATRIX_DRUG_IDS` chỉ có 14 thuốc, thiếu hẳn 7 thuốc:
    1. `acarbose` (thuốc chỉnh liều thận rất quan trọng, chống chỉ định khi eGFR < 30).
    2. 6 chế phẩm insulin: `insulin_degludec`, `insulin_detemir`, `insulin_nph`, `insulin_aspart`, `insulin_lispro`, `insulin_premix`.
- **Hành động khắc phục**:
  Bổ sung dải `eGFRTo: 15` vào 5 tệp JSON Incretin. Mở rộng `DM2_MATRIX_DRUG_IDS` bao gồm cả Acarbose và các loại Insulin để đảm bảo tính đầy đủ của ma trận.

---

### Finding DM2-R2-07 (MAJOR): Phác Đồ Basal-Bolus Nội Viện Gộp Chung 1 Khuyến Cáo, Thiếu Y Lệnh Cho Insulin Bữa Ăn (Bolus)
- **Vị trí**: `src/modules/dm2/rules.inpatient.ts` (dòng 102–105, rule `dm2.inpatient.basal_bolus_regimen`).
- **Phân tích dược lâm sàng**:
  - Khuyến cáo `rec_dm2_inpatient_basal_bolus` có cấu trúc:
    `action: 'START'`, `drugId: 'insulin_glargine'`, `drugNameVi: 'Insulin Glargine + Insulin Aspart (Basal-Bolus)'`, `dose: dosePlan`.
  - Trong thực hành kê đơn bệnh viện (CPOE/HIS), mỗi y lệnh dược bắt buộc phải gắn với một mã thuốc (drugId) cụ thể để điều dưỡng thực hiện rút thuốc và khoa dược duyệt cấp phát từ tủ trực:
    - Insulin nền: `insulin_glargine` (hoặc NPH) tiêm 1 lần/ngày.
    - Insulin bữa ăn: `insulin_aspart` (hoặc Lispro) tiêm 3 lần/ngày trước 3 bữa ăn chính.
  - Việc gộp cả hai hoạt chất vào duy nhất một `drugId: 'insulin_glargine'` khiến cho hệ thống thông tin bệnh viện chỉ nhận diện được y lệnh cấp phát Insulin Glargine, còn Insulin Aspart bị "chìm" trong chuỗi văn bản mô tả, dẫn đến việc người bệnh không được tiêm insulin bữa ăn.
- **Hành động khắc phục**:
  Tách quy tắc thành 2 khuyến cáo đồng thời:
  1. `[START] drugId: 'insulin_glargine'` với liều Basal (`bb.basalUnits`).
  2. `[START] drugId: 'insulin_aspart'` với liều Bolus mỗi bữa ăn (`bb.bolusEachMealUnits` x 3 bữa, kèm điều kiện nếu NPO thì tạm hoãn).

---

### Finding DM2-R2-08 (MAJOR): Luật Tạm Ngừng SGLT2i Trước Mổ Hardcode Cố Định `drugId: 'dapagliflozin'`
- **Vị trí**: `src/modules/dm2/rules.inpatient.ts` (dòng 165–167, rule `dm2.inpatient.hold_sglt2i_surgery`).
- **Phân tích dược lý**:
  - Điều kiện kích hoạt luật: Kiểm tra bệnh nhân có dùng bất kỳ thuốc nào trong 3 thuốc: `['dapagliflozin', 'empagliflozin', 'canagliflozin']`.
  - Nhưng phần xuất y lệnh lại hardcode cố định:
    `action: 'HOLD'`, `drugId: 'dapagliflozin'`, `drugNameVi: 'Thuốc ức chế SGLT2 (Dapagliflozin / Empagliflozin)'`.
  - Nếu bệnh nhân đang dùng **Jardiance (Empagliflozin)** hoặc **Invokana (Canagliflozin)**, hệ thống sẽ phát y lệnh `[HOLD] dapagliflozin`. Dược sĩ kiểm tra danh mục thuốc thấy bệnh nhân không có Dapagliflozin trong đơn nên sẽ bỏ qua y lệnh. Hậu quả là Empagliflozin tiếp tục được uống sát ngày phẫu thuật, làm tăng nguy cơ toan ceton đái tháo đường đường huyết bình thường (euglycemic DKA) quanh phẫu thuật.
- **Hành động khắc phục**:
  Lấy động hoạt chất thuốc bệnh nhân thực tế đang dùng từ `currentMeds` để gán vào `drugId` và `drugNameVi`.

---

### Finding DM2-R2-09 (MAJOR): Khuyến Cáo Xuống Thang Ở Người Cao Tuổi Trả Về `drugId: undefined` và `dose: undefined`
- **Vị trí**: `src/modules/dm2/rules.outpatient.ts` (dòng 433–443, rule `dm2.outpatient.deintensification`).
- **Phân tích dược lý lâm sàng**:
  - Khi bệnh nhân là người cao tuổi (≥ 75 tuổi), sức khỏe phức tạp hoặc có hạ đường huyết gần đây đang dùng Sulfonylurea hoặc Insulin (như Preset 3: nam 79 tuổi, HbA1c 6.3%, hạ đường huyết tuần trước, đang dùng Glargine 28 U + Glimepiride 4 mg):
    Hệ thống phát khuyến cáo:
    `[REDUCE] drugId=undefined, dose=undefined, title: Chủ động giảm liều / Xuống thang thuốc nguy cơ hạ đường huyết (SU / Insulin)`.
  - Cùng lúc đó, hệ thống lại chỉ định khởi trị mới: `[START] dapagliflozin` và `[START] semaglutide`.
  - Theo ADA 2026 Ch. 13 (Khuyến cáo 13.14a, 13.14b & 13.15): Xuống thang điều trị (de-intensification) ở người cao tuổi bắt buộc phải có hành động cụ thể:
    1. **Ngừng hoàn toàn Sulfonylurea (Glimepiride/Gliclazide)** để loại trừ nguy cơ hạ đường huyết kéo dài.
    2. Hoặc **giảm 20% liều insulin nền** (giảm Glargine từ 28 đơn vị xuống 22 đơn vị).
  - Đưa ra một khuyến cáo chung chung không có mã thuốc, không có liều lượng cụ thể, trong khi lại thêm 2 thuốc mới là tiềm ẩn nguy cơ gây hạ đường huyết nghiêm trọng cho người bệnh cao tuổi.
- **Hành động khắc phục**:
  Phát khuyến cáo xuống thang có đối tượng thuốc cụ thể:
  - Nếu có SU -> `[STOP] drugId: 'glimepiride' | 'gliclazide': Ngừng Sulfonylurea để loại trừ nguy cơ hạ đường huyết`.
  - Nếu có Insulin -> `[REDUCE] drugId: 'insulin_glargine': Giảm 20% tổng liều insulin nền`.

---

### Finding DM2-R2-10 (MAJOR): Toàn Bộ 21 Thuốc ĐTĐ Thiếu Thông Tin và Cổng Kiểm Soát An Toàn Thai Kỳ
- **Vị trí**: 21 tệp JSON trong `gdmt-vn/kb/drugs/`.
- **Phân tích dược lý**:
  - Hướng dẫn ADA 2026 Ch. 15 (*Management of Diabetes in Pregnancy*):
    - **Insulin** là liệu pháp duy nhất được khuyến cáo đầu tay và an toàn trong thai kỳ (ĐTĐ thai kỳ GDM, ĐTĐ típ 1 và ĐTĐ típ 2 mang thai) vì insulin không qua hàng rào nhau thai với lượng có ý nghĩa lâm sàng.
    - **Metformin** và **Glyburide/SU** qua được nhau thai; metformin liên quan đến tăng tỷ lệ trẻ sơ sinh nhẹ cân so với tuổi thai và béo phì ở trẻ sau này.
    - Các thuốc thế hệ mới: **SGLT2i, GLP-1 RA, Tirzepatide, DPP-4i, TZD** đều chống chỉ định hoặc khuyến cáo ngừng ngay trước khi mang thai hoặc ngay khi phát hiện có thai do thiếu dữ liệu an toàn trên người và nguy cơ độc tính phát triển phôi thai ghi nhận trên động vật.
  - Toàn bộ 21 tệp thuốc DM2 đều thiếu trường `pregnancy` và Gate kiểm tra thai kỳ. Nếu người dùng nhập bệnh nhân nữ trong thai kỳ, hệ thống sẽ khuyến cáo START các thuốc chống chỉ định như Semaglutide hay Metformin mà không hề chặn lại.
- **Hành động khắc phục**:
  Bổ sung trường dữ liệu `pregnancy` và Gate kiểm soát thai kỳ cho tất cả các thuốc không phải insulin trong `kb/drugs/`.

---

### Finding DM2-R2-11 (MAJOR): Vildagliptin Thiếu Cảnh Báo và Chống Chỉ Định Suy Gan
- **Vị trí**: `kb/drugs/vildagliptin.json`.
- **Phân tích dược lý**:
  - Theo **EMA SmPC Galvus (Vildagliptin)** Mục 4.3 CONTRAINDICATIONS & 4.4 SPECIAL WARNINGS:
    Vildagliptin chống chỉ định ở bệnh nhân suy gan, bao gồm những bệnh nhân có nồng độ ALT hoặc AST trước điều trị vượt quá 3 lần giới hạn trên bình thường (> 3x ULN). Bắt buộc phải làm xét nghiệm chức năng gan trước khi bắt đầu dùng Galvus và theo dõi định kỳ 3 tháng một lần trong năm đầu tiên.
  - Vildagliptin là thuốc duy nhất trong nhóm DPP-4i có báo cáo viêm gan và tổn thương tế bào gan trong các thử nghiệm lâm sàng và giám sát hậu mãi.
  - Tệp `vildagliptin.json` hiện bỏ trống hoàn toàn trường `hepaticAdjustment` và không có Gate kiểm tra chức năng gan.
- **Hành động khắc phục**:
  Bổ sung `hepaticAdjustment` và `gate_vildagliptin_hepatic_contra` vào `vildagliptin.json`.

---

## 4. PHÂN TÍCH CÁC PHÁT HIỆN MINOR & KIẾN NGHỊ CẢI TIẾN (MINOR & SUGGESTION)

### Finding DM2-R2-12 (MINOR): Thiếu Cảnh Báo Chuyển Đổi Liều Giữa Insulin Glargine U-100 (Lantus) và U-300 (Toujeo)
- **Vị trí**: `kb/drugs/insulin_glargine.json`.
- **Phân tích**: Toujeo là insulin glargine nồng độ cao (300 U/mL), có dược động học giải phóng chậm hơn Lantus (100 U/mL). Nhãn FDA Toujeo quy định: Chuyển đổi từ Lantus U-100 sang Toujeo U-300 cần liều Toujeo cao hơn khoảng 10–20% để duy trì cùng mức kiểm soát đường huyết; ngược lại, chuyển từ Toujeo sang Lantus cần giảm 20% liều Lantus để phòng tránh hạ đường huyết. Cần bổ sung lưu ý này vào trường `cautions`.

### Finding DM2-R2-13 (MINOR): Thiếu Phân Biệt Thời Điểm Tiêm Premix Người và Premix Analog
- **Vị trí**: `kb/drugs/insulin_premix.json` (dòng 281).
- **Phân tích**: `insulin_premix.json` gộp chung Mixtard 30 (premix người) và Novomix 30 / Humalog Mix (premix analog) với cùng hướng dẫn chia liều 2/3 sáng, 1/3 chiều. Dược lý lâm sàng yêu cầu: Mixtard 30 chứa Regular insulin nên phải tiêm trước bữa ăn 30 phút để đỉnh tác dụng khớp với hấp thu thức ăn; trong khi Novomix 30 chứa Aspart nhanh nên phải tiêm ngay trước bữa ăn (0–10 phút). Tiêm sai thời điểm sẽ gây hạ đường huyết trước ăn hoặc tăng đường huyết sau ăn dữ dội.

### Finding DM2-R2-14 (MINOR): Chuỗi Hiển Thị Đích Đường Huyết ICU Bị Thiếu Ngưỡng Tối Thiểu 140 mg/dL
- **Vị trí**: `src/modules/dm2/rules.inpatient.ts` (dòng 29).
- **Phân tích**: Text hiển thị trên UI cho ca ICU là `Mục tiêu glucose máu nội viện: 7.8 – 10.0 mmol/L (180 mg/dL)`, thiếu mất giá trị dưới 140 mg/dL. Cần sửa thành `7.8 – 10.0 mmol/L (140–180 mg/dL)`.

### Finding DM2-R2-15 (MINOR): Liệt Kê Dạng Bút Tiêm Chưa Có Hoặc Không Lưu Hành Đại Trà Tại Việt Nam
- **Vị trí**: `kb/drugs/dulaglutide.json` & `tirzepatide.json`.
- **Phân tích**: Trulicity tại Việt Nam chỉ lưu hành 2 hàm lượng 0.75 mg và 1.5 mg; hàm lượng 3.0 mg và 4.5 mg không có số đăng ký lưu hành. Mounjaro (Tirzepatide) chưa được cấp phép lưu hành BHYT đại trà tại các bệnh viện Việt Nam. Cần ghi chú rõ tình trạng lưu hành thực tế để bác sĩ và dược sĩ không kê đơn nhầm dạng thuốc không tồn tại ở kho dược.

### Finding DM2-R2-16 (SUGGESTION): Hardcode Literal `dosePerKg > 0.5` Trong Luật Overbasalization và Mở Rộng Máy Tính Insulin
- **Vị trí**: `src/modules/dm2/rules.outpatient.ts` (dòng 379) & `src/engine/calculators/insulin.ts`.
- **Phân tích**: Số `0.5` (U/kg/ngày) bị hardcode trần trong mã nguồn thay vì gọi qua `th('dm2.overbasal.dose_per_kg_max')`. Máy tính `insulin.ts` hiện tại mới tính được liều khởi đầu tĩnh; nên bổ sung tính hệ số nhạy cảm ISF (Quy tắc 1800/TDD) để xuất thang tiêm insulin hiệu chỉnh (Correction Scale) trước ăn theo chuẩn ADA 2026 Ch. 16.

---

## 5. ĐỐI CHIẾU NGUYÊN VĂN BẰNG CHỨNG GUIDELINE & NHÃN THUỐC

```carousel
<!-- slide -->
### 1. EMA SmPC – Diamicron MR (Gliclazide) p. 2 (Mục 4.3 Chống Chỉ Định)
> *"4.3. Contraindications*  
> *This medicine is contraindicated in the following cases:*  
> *• Hypersensitivity to gliclazide or to any of the excipients...*  
> *• Type 1 diabetes,*  
> *• Diabetic pre-coma and coma, diabetic keto-acidosis,*  
> *• **Severe renal or hepatic insufficiency: in these cases the use of insulin is recommended**,..."*  
*(Nguồn: Medical_Library_2026/09_Nhan_Thuoc/EMA/gliclazide_MR_Diamicron_SmPC.pdf, p. 2)*
<!-- slide -->
### 2. FDA DailyMed – Ozempic (Semaglutide SC) p. 1 & 7 (Cảnh Báo Hộp Đen)
> *"WARNING: RISK OF THYROID C-CELL TUMORS*  
> *In rodents, semaglutide causes dose-dependent and treatment-duration-dependent thyroid C-cell tumors at clinically relevant exposures. It is unknown whether OZEMPIC causes thyroid C-cell tumors, including medullary thyroid carcinoma (MTC), in humans...*  
> ***OZEMPIC is contraindicated in patients with a personal or family history of MTC or in patients with Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)**."*  
*(Nguồn: Medical_Library_2026/09_Nhan_Thuoc/FDA/FDA_label_semaglutide_ozempic.pdf, p. 1 & 7)*
<!-- slide -->
### 3. Đồng Thuận Quốc Tế 2024 – Cấp Cứu Tăng Đường Huyết (ADA/EASD/JBDS/AACE) p. 8
> *"Definitions of resolution (use clinical judgment and do not delay discharge or level of care if these are not met):*  
> *› **DKA**: Venous pH > 7.3 or bicarbonate > 18 mmol/L and plasma/capillary ketones < 0.6 mmol/L*  
> *› **HHS**: Calculated serum osmolality falls below 300 mOsm/kg, blood glucose is ≤ 250 mg/dL (13.9 mmol/L), urine output is ≥ 0.5 mL/kg/h, and patient has regained premorbid mental alertness."*  
*(Nguồn: Medical_Library_2026/01_Noi_Khoa/Dai_Thao_Duong/ADA_2024_Hyperglycaemic_Crises_Consensus.pdf, p. 8)*
<!-- slide -->
### 4. EMA SmPC – Galvus (Vildagliptin) p. 3 (Mục 4.3 & 4.4 Suy Gan)
> *"4.3 Contraindications*  
> *Hypersensitivity to the active substance or to any of the excipients...*  
> ***Galvus should not be used in patients with hepatic impairment, including patients with pre-treatment alanine aminotransferase (ALT) or aspartate aminotransferase (AST) > 3x the upper limit of normal (ULN)**.*  
> *4.4 Special warnings and precautions for use*  
> *Liver function tests should be performed prior to the initiation of treatment with Galvus in order to know the patient's baseline value... and monitored during treatment at three-month intervals for the first year and periodically thereafter."*  
*(Nguồn: Medical_Library_2026/09_Nhan_Thuoc/EMA/vildagliptin_Galvus_EMA_SmPC.pdf, p. 3)*
```

---

## 6. KẾT LUẬN & KIẾN NGHỊ ĐIỀU PHỐI (BOARD RECOMMENDATIONS)

- **Đánh giá tổng quát**: Module `dm2` sở hữu kiến trúc phân tầng rất bài bản, bao quát xuất sắc các khuyến cáo cập nhật nhất của ADA 2026, KDIGO 2022/2024 và Đồng thuận Quốc tế 2024. Bất biến an toàn sống còn hoãn insulin khi hạ kali máu trong DKA được triển khai nghiêm ngặt.
- **Tuy nhiên**, từ góc nhìn chuyên môn Dược lâm sàng, module còn tồn tại **2 lỗi nghiêm trọng (Critical)** đe dọa an toàn người bệnh:
  1. Cho phép dùng Sulfonylurea (Gliclazide MR) ở bệnh nhân suy thận nặng và chạy thận nhân tạo (vi phạm chống chỉ định SmPC).
  2. Khởi mới Semaglutide SC ở bệnh nhân suy thận mạn giai đoạn 5 (eGFR 12 mL/phút) do thiếu cổng kiểm soát an toàn thận eGFR ≥ 15.
- Cùng với **9 lỗi Major** liên quan đến Cảnh báo hộp đen ung thư giáp của Incretin, sai lệch định danh thuốc cấp cứu DKA, nhầm lẫn tiêu chuẩn lui bệnh HHS, ma trận thận hiển thị `no_data`, thiếu lệnh bolus nội trú và thiếu trường an toàn thai kỳ cho toàn bộ 21 thuốc.
- **Quyết định thẩm định Vòng 1**: **FAIL**.
- **Đề xuất Ban Điều Phối**: Chuyển toàn bộ 16 phát hiện sang Agent F (Chuyên gia Nội tiết kiêm Kỹ sư module DM2) để tiến hành khắc phục trước khi bước vào Vòng duyệt 2.
