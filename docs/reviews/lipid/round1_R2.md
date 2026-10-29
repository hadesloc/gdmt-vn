# Báo Cáo Thẩm Định Chuyên Môn Vòng 1 – Reviewer R2 (Dược Sĩ Lâm Sàng Tim Mạch)
## Module: Rối Loạn Lipid Máu (`lipid`) – GDMT-VN

- **Reviewer**: R2 – Dược sĩ lâm sàng Tim mạch (Clinical Pharmacist - Cardiology)
- **Vòng duyệt**: Round 1
- **Ngày thực hiện**: 27/10/2026
- **Phạm vi thẩm định**:
  1. **13 tệp dữ liệu thuốc** `gdmt-vn/kb/drugs/*.json` thuộc phân hệ Lipid:
     - Nhóm Statin: `atorvastatin`, `rosuvastatin`, `simvastatin`, `pravastatin`, `pitavastatin`
     - Nhóm ức chế hấp thu cholesterol: `ezetimibe`
     - Nhóm ức chế PCSK9: `evolocumab`, `alirocumab`, `inclisiran`
     - Nhóm ức chế ATP citrate lyase: `bempedoic_acid`
     - Nhóm Fibrate: `fenofibrate`
     - Nhóm Acid béo Omega-3: `icosapent_ethyl`, `omega3`
  2. **Ma trận an toàn & bằng chứng lâm sàng**: `src/modules/lipid/matrix.ts` (Ma trận nguy cơ tim mạch `lipidMatrixRisk` và Ma trận độ lọc cầu thận `lipidMatrixEgfr`).
  3. **Hệ thống luật lâm sàng & liều lượng**: `src/modules/lipid/rules.outpatient.ts`, `src/modules/lipid/rules.inpatient.ts`.
  4. **Kiểm tra động (Dynamic Evaluation)**: Chạy `evaluate()` thực tế trên 5 Presets trong `presets.ts`, 26 ca chuẩn trong `tests/golden/lipid/*.json`, và bộ kịch bản kiểm thử độc lập viết bằng vitest trong `docs/reviews/lipid/scratch/`.
  5. **Đối chiếu tài liệu nguồn chuẩn**:
     - Nhãn thuốc chính thức của FDA / EMA trong `Medical_Library_2026/09_Nhan_Thuoc/` (Lipitor, Crestor, Zocor, Pravachol, Livalo, Zetia, Repatha, Praluent, Leqvio, Nexletol, Tricor, Vascepa, Omacor).
     - Hướng dẫn lâm sàng quốc tế: *2019 ESC/EAS Guidelines for the management of dyslipidaemias*, *2025 ESC Focused Update on Dyslipidaemias*, *2024 ESC CCS Guidelines*, *2018 AHA/ACC Cholesterol Guideline*, *2026 ACC/AHA Dyslipidemia Guideline*, *KDIGO 2024 / 2013 Lipid Management in CKD*.
     - Dược thư Quốc gia Việt Nam 2022 và Danh mục thuốc lưu hành của Cục Quản lý Dược (DAV) – Bộ Y tế Việt Nam.

---

## 1. TỔNG QUAN KẾT QUẢ THẨM ĐỊNH

| Mức độ nghiêm trọng (Severity) | Số lượng | Tóm tắt phát hiện |
|---|:---:|---|
| **CRITICAL** (Nguy cơ gây hại trực tiếp) | **1** | Bỏ sót cổng an toàn thai kỳ (Pregnancy Gate) cho Fenofibrate và quy tắc an toàn thai kỳ chỉ nhắm vào duy nhất Atorvastatin, khiến thai phụ tiếp tục dùng Fenofibrate nguy cơ quái thai |
| **MAJOR** (Sai sót liều/guideline/nhãn thuốc) | **9** | (1) Kê Fenofibrate liều đầy đủ 145–200 mg/ngày ở suy thận trung bình (CKD 3b, eGFR 30–59); (2) Bỏ sót toàn bộ khuyến cáo Class I A về thuốc ức chế PCSK9; (3) Bỏ sót phối hợp thêm Ezetimibe ở BN đang dùng statin chưa đạt đích; (4) Thiếu hoàn toàn cảnh báo tương tác Simvastatin + CYP3A4 inhibitors (Amiodarone, Diltiazem, Clarithromycin) và Statin + Colchicine; (5) Dùng nhầm % giảm LDL của PCSK9 (60%) làm ngưỡng lọc thận eGFR 60 mL/phút; (6) Ma trận lọc thận dán nhãn Rosuvastatin là Chống chỉ định (`contra`) khi lọc máu; (7) Pitavastatin cho phép liều 4 mg ở suy thận trung bình vi phạm trần liều 2 mg của FDA; (8) Bỏ trống quy tắc xử trí cho tầng nguy cơ trung bình (Moderate Risk); (9) Thiếu hành động Chuyển đổi Statin (Statin Switch) gây trùng lặp 2 statin |
| **MINOR** (Lỗi biệt dược, thiếu cảnh báo phụ) | **3** | (1) Biệt dược Mỹ không lưu hành tại VN (Zetia, Tricor, Lovaza, Pravastatina); (2) Thiếu cảnh báo đứt gân và tiền sử gút của Bempedoic acid; (3) Ma trận lọc thận thiếu 8 thuốc hạ lipid |
| **SUGGESTION** (Kiến nghị cải tiến UX/Lâm sàng) | **1** | Bổ sung tùy chọn chuyển đổi linh hoạt giữa Atorvastatin và Rosuvastatin trên giao diện khuyến cáo |
| **TỔNG CỘNG** | **14** | |

### KẾT LUẬN CUỐI VÒNG 1: **FAIL**
*(Theo quy chuẩn `docs/REVIEW_PROTOCOL.md`: Module chỉ đạt PASS khi có 0 lỗi Critical và 0 lỗi Major).*

---

## 2. BẢNG CHI TIẾT TỪNG HOẠT CHẤT (DRUGENTRY AUDIT - 13 THUỐC)

| STT | Hoạt chất | Phân nhóm dược lý | Liều khởi đầu | Liều đích / Tối đa | Ngưỡng thận (eGFR / CrCl) | Cổng an toàn & Tương tác chính | Biệt dược tại VN (DAV) | Đánh giá dược lâm sàng R2 |
|:---:|---|:---:|---|---|---|---|---|---|
| 1 | **Atorvastatin** | Statin (cường độ cao) | 10–20 mg/ngày (nguy cơ rất cao: 40 mg) | 80 mg/ngày (Cường độ cao) | Không cần chỉnh liều ở mọi mức độ suy thận kể cả lọc máu | Thai kỳ: Chống chỉ định tuyệt đối; ALT ≥ 3x ULN tạm hoãn; Tương tác CYP3A4, colchicine, gemfibrozil | Lipitor (10, 20, 40, 80 mg), Atorlip, Torvast, Lipistat | **ĐẠT LIỀU CHUẨN**. Đúng FDA Lipitor & ESC 2019. Cần lưu ý không nên mặc định khởi đầu ngay 80 mg cho mọi ca ngoại trú. |
| 2 | **Rosuvastatin** | Statin (cường độ cao) | 5 mg/ngày (người châu Á) | 20–40 mg/ngày (Cường độ cao) | eGFR < 30: khởi đầu 5 mg, trần liều 10 mg/ngày | Thai kỳ: Chống chỉ định; ALT ≥ 3x ULN tạm hoãn; eGFR < 30 trần liều 10 mg; Tương tác cyclosporine (max 5mg) | Crestor (5, 10, 20 mg), Roxuvas, Rosuvastatin Stella | **ĐẠT DỮ LIỆU KB**. Khởi đầu 5 mg ở người châu Á rất chuẩn xác (FDA Section 2.4). Ma trận lọc máu ghi `contra` là sai lệch. |
| 3 | **Simvastatin** | Statin (cường độ TB) | 10–20 mg/ngày (buổi tối) | 40 mg/ngày (Chống chỉ định 80 mg) | eGFR < 30: khởi đầu 5 mg/ngày (KB ghi 10 mg) | Chống chỉ định 80 mg; CYP3A4 inhibitors mạnh cấm phối hợp; Amiodarone max 20mg; Diltiazem/Verapamil max 10mg | Zocor (10, 20, 40 mg), Simvastatin Stella | **CẦN SỬA**. Chỉnh liều suy thận nặng FDA ghi 5 mg; thiếu cụ thể trần 10 mg với diltiazem/verapamil trong tương tác; thiếu alert trong engine. |
| 4 | **Pravastatin** | Statin (tan trong nước) | 10–20 mg/ngày (buổi tối) | 40–80 mg/ngày | eGFR < 30: khởi đầu 10 mg/ngày, chỉnh liều thận trọng | Tan trong nước, ít tương tác CYP450; Cyclosporine giới hạn liều 20 mg; Clarithromycin max 40 mg | Pravachol (10, 20, 40 mg), Pravastatin Stella (*bỏ Pravastatina*) | **CẦN SỬA BIỆT DƯỢC**. Bỏ "Pravastatina" (tiếng Tây Ban Nha). Bổ sung vào ma trận lọc thận. |
| 5 | **Pitavastatin** | Statin (thế hệ mới) | 1–2 mg/ngày | 2–4 mg/ngày | eGFR 15–59: Khởi đầu 1 mg, tối đa 2 mg/ngày | Chống chỉ định Cyclosporine; Chống chỉ định Gemfibrozil; Ít ảnh hưởng đường huyết | Livalo (1, 2, 4 mg) | **SAI LIỀU THẬN TRUNG BÌNH**. KB cho phép liều 4 mg ở eGFR 30–59, vi phạm trần liều 2 mg của FDA Livalo mục 2.2. |
| 6 | **Ezetimibe** | Ức chế hấp thu cholesterol | 10 mg/ngày | 10 mg/ngày | Không cần chỉnh liều ở mọi giai đoạn CKD & lọc máu | Uống cách xa resin gắn acid mật (2h trước hoặc 4h sau); Thai kỳ cấm dùng khi phối hợp statin | Ezetrol (10 mg), Ezetimibe Stella (*bỏ Zetia*) | **CẦN SỬA BIỆT DƯỢC**. Bỏ "Zetia" (tên Mỹ). Quy tắc lâm sàng bỏ sót add-on ezetimibe khi LDL < 3.0 mmol/L. |
| 7 | **Evolocumab** | Kháng thể đơn dòng PCSK9 | 140 mg q2w hoặc 420 mg qm | 140 mg q2w hoặc 420 mg qm | Không cần chỉnh liều suy thận kể cả suy thận nặng | Tiêm dưới da; Bảo quản 2–8°C; Chưa có gate thai kỳ | Repatha (140 mg/mL bút tiêm nạp sẵn) | **BỎ SÓT TRONG LUẬT**. KB định nghĩa tốt nhưng hoàn toàn không có rule nào chỉ định trong module lâm sàng! |
| 8 | **Alirocumab** | Kháng thể đơn dòng PCSK9 | 75 mg q2w (hoặc 300 mg q4w) | 150 mg q2w | Không cần chỉnh liều suy thận nhẹ và trung bình | Tiêm dưới da; Bảo quản 2–8°C; Chưa có gate thai kỳ | Praluent (75 mg, 150 mg bút tiêm) | **BỎ SÓT TRONG LUẬT**. Hoàn toàn không có rule nào chỉ định trong module lâm sàng. |
| 9 | **Inclisiran** | siRNA ức chế PCSK9 | 284 mg SC (ngày 1, tháng 3, rồi mỗi 6 tháng) | 284 mg mỗi 6 tháng | Không cần chỉnh liều suy thận | Tiêm dưới da bởi nhân viên y tế; Chưa có gate thai kỳ | Leqvio (284 mg/1.5 mL bơm tiêm nạp sẵn) | **BỎ SÓT TRONG LUẬT**. Lịch tiêm chuẩn xác (FDA/EMA), nhưng không có rule nào chỉ định trong module. |
| 10 | **Bempedoic acid** | Ức chế ATP citrate lyase | 180 mg/ngày | 180 mg/ngày | Thận trọng khi eGFR < 30; Theo dõi acid uric | Giới hạn Simvastatin max 20 mg, Pravastatin max 40 mg; Tránh Probenecid; Tăng acid uric, nguy cơ đứt gân | *Chưa lưu hành đại trà tại VN* (tên Mỹ: Nexletol) | **CẦN BỔ SUNG CẢNH BÁO**. Thiếu cảnh báo tiền sử gút và nguy cơ đứt gân Achilles; cần ghi chú tình trạng chưa lưu hành VN. |
| 11 | **Fenofibrate** | Fibrate | 145 mg hoặc 200 mg/ngày (67 mg nếu eGFR 30–59) | 200 mg/ngày | **eGFR < 30: Chống chỉ định tuyệt đối**; eGFR 30–59: giảm liều 67 mg/ngày | Chống chỉ định thai kỳ/cho bú; Tăng tác dụng Warfarin (giảm liều 30–50%); An toàn hơn gemfibrozil | Lipanthyl (145, 200 mg), Fenofibrate Stella (*bỏ Tricor*) | **LỖI NGUY HIỂM (CRITICAL & MAJOR)**. Thiếu gate thai kỳ; rule lâm sàng kê liều 145–200 mg ở suy thận trung bình (eGFR 30–59). |
| 12 | **Icosapent ethyl** | EPA tinh khiết liều cao | 2 g x 2 lần/ngày (tổng 4 g/ngày) | 4 g/ngày (chia 2 lần) cùng bữa ăn | Không cần chỉnh liều suy thận | Theo dõi khi dùng kèm thuốc chống đông do kéo dài thời gian chảy máu; Nguy cơ rung nhĩ nhẹ | *Chưa lưu hành chính thức tại VN* (tên Mỹ: Vascepa) | **CẦN SỬA BIỆT DƯỢC**. Bỏ "Vascepa" ở mục vnBrands hoặc ghi chú chưa lưu hành; phân biệt rõ với omega-3 hỗn hợp. |
| 13 | **Omega-3 acid ethyl esters** | EPA + DHA phối hợp | 2 g x 2 lần/ngày (hoặc 4 g/ngày) | 4 g/ngày cùng bữa ăn | Không cần chỉnh liều suy thận | Thành phần DHA có thể làm tăng nhẹ LDL-C; Thận trọng khi dùng kèm thuốc chống đông | Omacor (1000 mg nang mềm) (*bỏ Lovaza*) | **CẦN SỬA BIỆT DƯỢC**. Bỏ "Lovaza" (tên Mỹ). Bổ sung vào ma trận an toàn. |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC FINDING TRỌNG TÂM

### Finding LIPID-R2-01 (CRITICAL): Bỏ Sót Cổng An Toàn Thai Kỳ (Pregnancy Gate) Cho Fenofibrate Và Thiếu Phủ Rộng Trong Quy Tắc Lâm Sàng
- **Vị trí**: `kb/drugs/fenofibrate.json` (dòng 68–81), `src/modules/lipid/rules.outpatient.ts` (dòng 12–45), `rules.inpatient.ts` (dòng 12–44).
- **Phân tích cơ chế & Dược lâm sàng**:
  - Khi kiểm tra tệp dữ liệu `fenofibrate.json`, mảng `gates: []` chỉ có duy nhất cổng `gate_feno_severe_ckd` (eGFR < 30 mL/phút), **hoàn toàn không có cổng an toàn thai kỳ (`pregnancy`)**.
  - Đồng thời, trong hệ thống quy tắc `lipid.safety.pregnancy`, hàm `produce()` chỉ sinh duy nhất 1 Recommendation gắn với `drugId: 'atorvastatin'`.
  - **Kiểm chứng thực nghiệm**: Reviewer đã thiết lập ca bệnh kiểm thử đối nghịch (`test_pregnancy.test.ts`): Bệnh nhân nữ 28 tuổi, mang thai tam cá nguyệt đầu (`pregnant: true`), đang dùng Fenofibrate 145 mg/ngày do tiền sử tăng triglycerid. Kết quả thực thi từ `evaluate()`:
    - Sinh `[AVOID] Atorvastatin` (dù bệnh nhân không uống atorvastatin!).
    - **Hoàn toàn KHÔNG sinh lệnh [AVOID] Fenofibrate**!
    - **Hoàn toàn KHÔNG có Safety Alert nào về Fenofibrate**!
    - Thuốc Fenofibrate vẫn hiển thị bình thường trong đơn và không hề bị hệ thống chặn lại!
  - **Hậu quả lâm sàng**: Fenofibrate là dẫn xuất acid fibric qua được hàng rào nhau thai. Theo nhãn FDA Tricor Section 8.1, SmPC Lipanthyl mục 4.6 và Dược thư Quốc gia Việt Nam 2022: Fenofibrate chống chỉ định tuyệt đối trong thai kỳ và cho con bú vì gây độc tính phôi thai, chậm cốt hóa xương và dị tật xương chi trong các nghiên cứu tiền lâm sàng. Việc phần mềm cho phép thai phụ tiếp tục dùng Fenofibrate đe dọa trực tiếp sự an toàn của thai nhi.
- **Hành động khắc phục**:
  1. Thêm ngay `gate_feno_pregnancy` vào `kb/drugs/fenofibrate.json`:
     ```json
     {
       "id": "gate_feno_pregnancy",
       "parameter": "pregnancy",
       "operator": "==",
       "threshold": 1,
       "action": "contra",
       "messageVi": "Chống chỉ định tuyệt đối Fenofibrate trong thai kỳ và thời kỳ cho con bú (Dược thư QG VN / FDA)",
       "citationIds": ["esc.lipid.2024.ccs_pregnancy"]
     }
     ```
  2. Cập nhật rule `lipid.safety.pregnancy` để quét qua danh sách `currentMeds` của bệnh nhân và sinh lệnh `AVOID` tương ứng cho bất kỳ statin hoặc fibrate nào bệnh nhân đang dùng.

---

### Finding LIPID-R2-02 (MAJOR): Kê Đơn Fenofibrate Liều Đầy Đủ (145–200 mg/ngày) Ở Bệnh Nhân Suy Thận Trung Bình (CKD G3a/G3b, eGFR 30–59 mL/phút) Do Bỏ Qua Nấc Giảm Liều
- **Vị trí**: `src/modules/lipid/rules.outpatient.ts` (dòng 157–228, rule `lipid.tg.severe_pancreatitis_prevention`) và `rules.inpatient.ts` (dòng 136–206, rule `lipid.inpatient.severe_tg_pancreatitis`).
- **Phân tích cơ chế & Dược lâm sàng**:
  - Quy tắc chỉ định Fenofibrate phòng viêm tụy cấp khi TG ≥ 5.6 mmol/L kiểm tra:
    ```typescript
    const isEgfrContra = egfr !== undefined && egfr < egfrContra; // egfrContra = 30
    ```
    Nếu `egfr < 30`, rule phát lệnh `AVOID`. Nhưng nếu `egfr >= 30` (ví dụ eGFR = 35 mL/phút, CKD G3b), rule lập tức chạy xuống nhánh sinh lệnh `START` với:
    ```typescript
    dose: fmtDose(dose('fenofibrate', 'start')) // hoặc target = 200 mg ở nội viện
    ```
    tương đương **145 mg hoặc 200 mg/ngày**!
  - **Kiểm chứng thực nghiệm**: Chạy thử nghiệm `test_feno_ckd.test.ts` trên bệnh nhân nam 60 tuổi có Creatinin 180 µmol/L (eGFR tính theo CKD-EPI là ~36 mL/phút/1.73m², thuộc nhóm suy thận trung bình nặng G3b) và TG 7.2 mmol/L. Kết quả engine sinh:
    `[START] Khởi trị Fenofibrate phòng viêm tụy cấp | dose: 145 mg x 1 lần/ngày (uống) - 145 mg hoặc 200 mg uống 1 lần/ngày cùng bữa ăn`.
  - **Cơ sở khoa học**:
    - `fenofibrate.json` dòng 46–54 đã quy định: `eGFR 30–60: Giảm liều: 67–100 mg 1 lần/ngày; Suy thận trung bình: giảm liều và theo dõi nồng độ creatinin huyết thanh`.
    - Nhãn FDA Tricor Section 2.4: *"In patients with mild to moderate renal impairment, treatment with TRICOR should be initiated at a dose of 48 to 54 mg/day [hoặc 67 mg viên vi hạt], and should only be increased after evaluation of the effects on renal function and lipid levels at this dose."*
    - Fenofibrate thải trừ chủ yếu qua thận (khoảng 60% bài tiết qua nước tiểu dưới dạng liên hợp glucuronid của acid fenofibric). Khi eGFR giảm xuống 30–59 mL/phút, độ thanh thải fenofibric acid giảm hơn 50%, nồng độ đỉnh và diện tích dưới đường cong (AUC) tăng gấp đôi. Kê liều đầy đủ 145–200 mg sẽ gây độc tính thận cấp (tăng vọt creatinin) và nguy cơ tiêu cơ vân cấp dẫn tới suy thận cấp vô niệu.
- **Hành động khắc phục**:
  Bổ sung nấc kiểm tra chức năng thận trong rule ngoại trú và nội viện:
  ```typescript
  const isModerateCkd = egfr !== undefined && egfr >= 30 && egfr < 60;
  // Nếu isModerateCkd: chỉ định Fenofibrate 67 mg/ngày (hoặc 100 mg), không dùng liều 145–200 mg; bổ sung ghi chú theo dõi sát Creatinin sau 2–4 tuần.
  ```

---

### Finding LIPID-R2-03 (MAJOR): Bỏ Sót Hoàn Toàn Khuyến Cáo Class I A Của ESC/EAS Về Thuốc Ức Chế PCSK9 (Evolocumab / Alirocumab / Inclisiran)
- **Vị trí**: Toàn bộ `src/modules/lipid/rules.outpatient.ts` và `rules.inpatient.ts`.
- **Phân tích cơ chế & Dược lâm sàng**:
  - Phân hệ `lipid` đã tạo đầy đủ 3 file KB thuốc: `evolocumab.json`, `alirocumab.json`, `inclisiran.json`. Ma trận `matrix.ts` có hàng dành riêng cho PCSK9i. Tài liệu đặc tả `LIPID.md` nêu rõ PCSK9i là "Bước 3" trong bậc thang điều trị.
  - Tuy nhiên, khi duyệt toàn bộ mã nguồn của các quy tắc (`rules.outpatient.ts`, `rules.inpatient.ts`), **KHÔNG CÓ BẤT KỲ MỘT DÒNG CODE NÀO SINH KHUYẾN CÁO VỀ THUỐC ỨC CHẾ PCSK9**!
  - **Khuyến cáo y khoa nền tảng**:
    - *2019 ESC/EAS Guidelines for the management of dyslipidaemias* (Mục 7.1.3 & Recommendations for pharmacological LDL-C lowering, trang 139):
      > *"For secondary prevention, in patients at very-high risk not at goal on a maximally tolerated dose of a statin and ezetimibe, a combination with a PCSK9 inhibitor is recommended (Class I, Level A)."*
      > *"For very-high-risk FH patients with ASCVD or another major risk factor not at goal on a maximally tolerated dose of a statin and ezetimibe, a combination with a PCSK9 inhibitor is recommended (Class I, Level C)."*
    - *2025 ESC Focused Update on Dyslipidaemias*: Bổ sung Inclisiran (siRNA ức chế tổng hợp PCSK9, tiêm dưới da liều đầu, sau 3 tháng rồi mỗi 6 tháng) là giải pháp thay thế tương đương mAb PCSK9 giúp tăng tuân thủ điều trị.
  - Việc bỏ sót hoàn toàn khuyến cáo Class I A này khiến bệnh nhân có nguy cơ tim mạch cực kỳ cao (bệnh mạch vành tái phát nhiều lần, tăng cholesterol gia đình dị hợp tử) không được tiếp cận phác đồ chuẩn khi statin + ezetimibe thất bại.
- **Hành động khắc phục**:
  Xây dựng quy tắc `lipid.pcsk9.step3_indicated`: Kích hoạt khi bệnh nhân thuộc tầng rất cao đang dùng Statin cường độ cao + Ezetimibe mà LDL-C vẫn chưa đạt đích (< 1.4 mmol/L) hoặc giảm chưa đủ 50%, phát lệnh `CONSIDER` (hoặc `START`) phối hợp Evolocumab 140 mg tiêm dưới da mỗi 2 tuần (hoặc 420 mg mỗi tháng) hoặc Inclisiran 284 mg SC theo lịch tiêm định kỳ; kèm `profileDiff.VN` ghi rõ thuốc chưa được BHYT chi trả đại trà tại Việt Nam.

---

### Finding LIPID-R2-04 (MAJOR): Bỏ Sót Chỉ Định Phối Hợp Thêm Ezetimibe (Add-On Ezetimibe) Ở Bệnh Nhân Đang Dùng Statin Chưa Đạt Đích LDL-C (Nếu LDL < 3.0 mmol/L)
- **Vị trí**: `src/modules/lipid/rules.outpatient.ts` (dòng 337–389, rule `lipid.combo.upfront_very_high_far_from_target`).
- **Phân tích cơ chế & Dược lâm sàng**:
  - Rule `lipid.combo.upfront_very_high_far_from_target` được thiết kế chỉ để phối hợp ngay từ đầu (Upfront Combination) và đặt điều kiện:
    ```typescript
    const lowTarget = th('lipid.target.low_ldl'); // 3.0 mmol/L
    return isVeryHigh && ldl >= lowTarget;
    ```
  - **Kiểm chứng thực nghiệm**: Reviewer chạy thử nghiệm `test_titration.test.ts`: Bệnh nhân ASCVD (nguy cơ rất cao, đích LDL < 1.4 mmol/L) đang dùng sẵn Atorvastatin 40 mg/ngày, xét nghiệm LDL-C hiện tại là **2.2 mmol/L**.
    - Vì LDL-C = 2.2 < 3.0 mmol/L, rule phối hợp sớm không kích hoạt.
    - Rule duy nhất kích hoạt là `rec_lipid_statin_high_init` khuyên dùng Atorvastatin 80 mg.
    - **Hệ thống hoàn toàn KHÔNG khuyến cáo bổ sung Ezetimibe 10 mg**!
    - Nếu bệnh nhân đã dùng Atorvastatin 80 mg từ trước thì hệ thống hoàn toàn bế tắc (0 khuyến cáo điều trị hạ lipid tiếp theo!).
  - **Cơ sở khoa học**: Theo ESC/EAS 2019 (Table 7 & p. 138, Class I B): Nếu bệnh nhân chưa đạt đích điều trị với liều statin dung nạp tối đa, bắt buộc phải phối hợp thêm Ezetimibe 10 mg/ngày. Việc chỉ xét phối hợp khi LDL ≥ 3.0 mmol/L đã bỏ sót toàn bộ phân khúc bệnh nhân có LDL trong khoảng 1.4 – 2.9 mmol/L đang dùng statin dở dang.
- **Hành động khắc phục**:
  Tạo quy tắc mới `lipid.statin_plus_ezetimibe_stepup`: Nếu bệnh nhân nguy cơ rất cao đang dùng statin mà LDL-C > 1.4 mmol/L (hoặc nguy cơ cao mà LDL-C > 1.8 mmol/L), khuyến cáo bổ sung ngay Ezetimibe 10 mg/ngày (Class I B).

---

### Finding LIPID-R2-05 (MAJOR): Thiếu Cảnh Báo Tương Tác Thuốc Nghiêm Trọng Simvastatin + Thuốc Ức Chế CYP3A4 (Clarithromycin, Amiodarone, Diltiazem) Và Statin + Colchicine
- **Vị trí**: `src/engine/safety/interactions.ts` (dòng 19–111).
- **Phân tích cơ chế & Dược lâm sàng**:
  - Khi chạy thử nghiệm lâm sàng `test_interactions.test.ts`:
    1. Ca bệnh 1: Bệnh nhân dùng Simvastatin 40 mg/ngày kết hợp Amiodarone 200 mg và Diltiazem 60 mg -> Engine xuất **0 cảnh báo tương tác thuốc** (chỉ có 1 cảnh báo trùng lặp statin do rule đề xuất thêm atorvastatin).
    2. Ca bệnh 2: Bệnh nhân dùng Atorvastatin 40 mg kết hợp Colchicine 1 mg -> Engine xuất **0 cảnh báo**!
  - **Cơ sở y văn & Nhãn FDA**:
    - **Simvastatin** chuyển hóa gần như hoàn toàn qua enzym CYP3A4 gan và ruột. Nồng độ sinh khả dụng ban đầu rất thấp (< 5%). Khi dùng chung với chất ức chế CYP3A4, AUC của simvastatin tăng vọt từ 5 đến 20 lần:
      - *Amiodarone*: ức chế CYP3A4 làm tăng nồng độ simvastatin gấp nhiều lần. Nhãn FDA Zocor quy định rõ: **Không dùng Simvastatin vượt quá 20 mg/ngày khi dùng cùng Amiodarone hoặc Amlodipine**. Dùng liều 40 mg làm tăng vọt nguy cơ tiêu cơ vân.
      - *Diltiazem / Verapamil*: ức chế CYP3A4 mức độ vừa. Nhãn FDA Zocor quy định: **Không dùng Simvastatin vượt quá 10 mg/ngày khi phối hợp Diltiazem hoặc Verapamil**.
      - *Kháng sinh Macrolid (Clarithromycin, Erythromycin)* và *Kháng nấm Azole (Itraconazole, Ketoconazole)*: **Chống chỉ định tuyệt đối phối hợp với Simvastatin**.
    - **Colchicine + Statin**: Cả Colchicine và Statin đều gây độc tính trên cơ vân (myopathy). Đã có hàng trăm báo cáo postmarketing gửi về FDA AERS về các ca tiêu cơ vân cấp kèm suy thận cấp dẫn đến tử vong khi phối hợp statin liều cao với colchicine, đặc biệt ở bệnh nhân cao tuổi có suy giảm chức năng thận.
  - Tệp `interactions.ts` hiện tại chỉ có duy nhất quy tắc `ix.statin_fibrate_myopathy` (Statin + Gemfibrozil), bỏ sót hoàn toàn các tương tác thuốc tim mạch cực kỳ phổ biến kể trên.
- **Hành động khắc phục**:
  Bổ sung 3 quy tắc tương tác vào `INTERACTION_RULES` trong `src/engine/safety/interactions.ts`:
  1. `ix.simvastatin_cyp3a4_contra`: Simvastatin + Clarithromycin / Erythromycin / Itraconazole / Ketoconazole (Mức `critical` - Chống chỉ định).
  2. `ix.simvastatin_dose_cap`: Simvastatin liều > 20 mg khi dùng cùng Amiodarone, hoặc > 10 mg khi dùng cùng Diltiazem / Verapamil (Mức `critical` / `warning`).
  3. `ix.statin_colchicine_myopathy`: Statin + Colchicine (Mức `warning` - Theo dõi sát men cơ CK, đau cơ và chức năng thận).

---

### Finding LIPID-R2-06 (MAJOR): Dùng Sai Bản Chất Thứ Nguyên Y Khoa: Lấy Phần Trăm Giảm LDL Của PCSK9 (60 %) Làm Mốc Lọc Thận eGFR 60 mL/phút/1.73m²
- **Vị trí**: `src/modules/lipid/rules.outpatient.ts` (dòng 413).
- **Phân tích cơ chế & Bằng chứng**:
  - Dòng 413 trong file quy tắc ngoại trú viết:
    ```typescript
    const isModerateCkd = ctx.derived.kdigoG === 'G3a' || ctx.derived.kdigoG === 'G3b' || (egfr !== undefined && egfr >= th('lipid.safety.egfr_severe_ckd') && egfr < th('lipid.reduction.pcsk9_alone'));
    ```
  - Tra cứu biến `lipid.reduction.pcsk9_alone` trong `kb/thresholds/lipid.json` (dòng 141–148):
    ```json
    {
      "id": "lipid.reduction.pcsk9_alone",
      "value": 60,
      "unit": "%",
      "citationIds": ["esc.lipid.2019.therapy_reductions"],
      "descriptionVi": "Mức giảm LDL-C dự kiến của thuốc ức chế PCSK9 đơn độc (~60%) (ESC/EAS 2019)"
    }
    ```
  - **Bản chất lỗi**: Kỹ sư phần mềm đã lấy một hằng số biểu thị **% giảm LDL của thuốc PCSK9i** (60%) đem so sánh trực tiếp với **độ lọc cầu thận eGFR** (mL/phút/1.73m²) chỉ vì hai đại lượng này có cùng con số 60!
  - Lỗi này vi phạm nghiêm trọng tính toàn vẹn của cơ sở tri thức (Semantic Integrity) và quy tắc QA-8. Khi hệ thống sinh bằng chứng giải trình (Audit Trail/Citation Trace), việc phân loại suy thận của bệnh nhân lại trích dẫn nghiên cứu về thuốc ức chế PCSK9!
- **Hành động khắc phục**:
  Tạo ngay hằng số ngưỡng y khoa chuẩn xác trong `kb/thresholds/lipid.json`:
  ```json
  {
    "id": "lipid.safety.egfr_moderate_ckd_max",
    "value": 60,
    "unit": "mL/min/1.73m2",
    "citationIds": ["esc.lipid.2019.target_high"],
    "descriptionVi": "Ngưỡng trên eGFR định nghĩa suy thận mạn giai đoạn 3 (30–59 mL/phút/1.73m²)"
  }
  ```
  và thay thế vào dòng 413 của `rules.outpatient.ts`.

---

### Finding LIPID-R2-07 (MAJOR): Ma Trận Lọc Thận (`lipidMatrixEgfr`) Ghi Rosuvastatin Là Chống Chỉ Định (`contra`) Khi Lọc Máu Trong Khi Atorvastatin Là `caution`
- **Vị trí**: `src/modules/lipid/matrix.ts` (dòng 259–263, ô `rosuvastatin.dialysis`).
- **Phân tích cơ chế & Bằng chứng**:
  - Trong ma trận lọc thận `lipidMatrixEgfr`:
    - Ô Atorvastatin trên bệnh nhân lọc máu ghi: `initiate: 'caution', continue: 'ok'`.
    - Nhưng ô Rosuvastatin trên bệnh nhân lọc máu lại ghi: `initiate: 'contra', continue: 'caution', note: 'Chống chỉ định khởi trị liều cao trên bệnh nhân lọc máu'`.
  - **Cơ sở dược lâm sàng**:
    - Thử nghiệm lâm sàng ngẫu nhiên mù đôi **AURORA** (*N Engl J Med 2009; 360:1395-1407*) nghiên cứu Rosuvastatin 10 mg/ngày trên 2.776 bệnh nhân chạy thận nhân tạo định kỳ: Rosuvastatin dung nạp rất tốt, tỷ lệ tác dụng phụ trên gan và cơ tương đương giả dược (không có trường hợp tiêu cơ vân nào liên quan đến thuốc). Mặc dù thuốc không giảm tiêu chí gộp tử vong tim mạch (do cơ chế tử vong ở lọc máu chủ yếu là đột tử do rối loạn nhịp và suy tim không do xơ vữa), thuốc hoàn toàn an toàn.
    - Hướng dẫn **KDIGO 2013 / KDIGO 2024** (Khuyến cáo 2A & 2C): Cả Atorvastatin (thử nghiệm 4D) và Rosuvastatin (thử nghiệm AURORA) đều có chung một mức khuyến cáo: **Không khuyến cáo khởi trị mới ở bệnh nhân lọc máu chu kỳ** (`not_rec`), nhưng **nếu bệnh nhân đã dùng trước khi lọc máu thì tiếp tục duy trì** (`ok` hoặc `rec`).
    - Nhãn FDA chính thức của Crestor mục 4 (Contraindications): Chống chỉ định chỉ bao gồm suy gan cấp, xơ gan mất bù và quá mẫn; **hoàn toàn KHÔNG chống chỉ định chạy thận nhân tạo**. Mục 2.5 và 8.6 của FDA chỉ ghi: *"Steady-state plasma concentrations of rosuvastatin in patients on chronic hemodialysis were approximately 50% greater compared with healthy volunteer subjects"*.
  - Việc ma trận dán nhãn `contra` cho Rosuvastatin và `caution` cho Atorvastatin là thiếu nhất quán, tạo hiểu nhầm cho bác sĩ lâm sàng rằng Rosuvastatin gây độc tính đe dọa tính mạng ở bệnh nhân lọc máu.
- **Hành động khắc phục**:
  Chỉnh sửa ô `rosuvastatin.dialysis` thành `initiate: 'not_rec'`, `continue: 'ok'` (hoặc `caution`), đồng bộ với Atorvastatin và chuẩn mực KDIGO 2024.

---

### Finding LIPID-R2-08 (MAJOR): Dữ Liệu Thuốc Pitavastatin Cho Phép Dùng Liều Tối Đa 4 mg/ngày Ở Bệnh Nhân Suy Thận Trung Bình (eGFR 30–59 mL/phút) Vi Phạm Nhãn FDA
- **Vị trí**: `kb/drugs/pitavastatin.json` (dòng 34–56).
- **Phân tích cơ chế & Bằng chứng**:
  - Tệp `pitavastatin.json` chia dải lọc thận thành:
    - `eGFRFrom: 30`: Liều `2–4 mg 1 lần/ngày`.
    - `eGFRFrom: 0, eGFRTo: 30`: Liều `Khởi đầu 1 mg 1 lần/ngày; tối đa 2 mg 1 lần/ngày`.
  - **Đối chiếu nhãn FDA Livalo** (Section 2.2 - Recommended Dosage in Patients with Renal Impairment):
    > *"In patients with moderate and severe renal impairment (estimated glomerular filtration rate 30 to 59 mL/min/1.73 m² and 15 to 29 mL/min/1.73 m², respectively) not receiving hemodialysis, as well as end-stage renal disease receiving hemodialysis, the recommended starting dose is 1 mg once daily and the maximum dose is 2 mg once daily."*
  - Nhãn FDA quy định trần liều **2 mg/ngày** áp dụng cho cả suy thận **trung bình (eGFR 30–59)**! Việc `pitavastatin.json` xếp eGFR 30–59 vào dải dùng tới 4 mg/ngày là vượt quá liều tối đa cho phép của FDA, làm tăng nguy cơ quá liều tích lũy và độc tính cơ ở bệnh nhân CKD giai đoạn 3.
- **Hành động khắc phục**:
  Tách dải thận trong `pitavastatin.json` thành 3 bậc:
  1. `eGFRFrom: 60`: Liều 2–4 mg/ngày.
  2. `eGFRFrom: 30, eGFRTo: 60`: Khởi đầu 1 mg/ngày; tối đa 2 mg/ngày.
  3. `eGFRFrom: 0, eGFRTo: 30`: Khởi đầu 1 mg/ngày; tối đa 2 mg/ngày.

---

### Finding LIPID-R2-09 (MAJOR): Bỏ Trống Quy Tắc Xử Trí Hạ Lipid Cho Tầng Nguy Cơ Trung Bình (Moderate Risk) Có LDL-C Chưa Đạt Đích
- **Vị trí**: `src/modules/lipid/rules.outpatient.ts`.
- **Phân tích cơ chế & Bằng chứng**:
  - Khi chạy thử nghiệm trên Preset 5 (`lipid_preset_5_primary_prevention_moderate` - BN nữ 54 tuổi, nguy cơ tim mạch trung bình SCORE2 4.2%, LDL-C 3.4 mmol/L, đích khuyến cáo < 2.6 mmol/L):
    - Hệ thống chỉ sinh duy nhất 2 khuyến cáo theo dõi: `rec_lipid_lpa_screen` (đo Lp(a)) và `rec_lipid_retest_schedule` (tái khám sau 8 tuần).
    - **Hoàn toàn KHÔNG có bất kỳ khuyến cáo điều trị hạ lipid nào**!
  - **Guideline ESC/EAS 2019** (Table 5 - Intervention strategies as a function of total cardiovascular risk and LDL-C level & Mục 7.1, trang 138):
    - Ở bệnh nhân nguy cơ trung bình có LDL-C ≥ 2.6 mmol/L (≥ 100 mg/dL): Khuyến cáo can thiệp lối sống tích cực (Class I, LOE A).
    - Nếu sau thay đổi lối sống không đạt đích, hoặc nếu LDL-C ban đầu ≥ 2.6 mmol/L: Khuyến cáo can thiệp dược lý bằng Statin cường độ trung bình (Atorvastatin 10–20 mg, Rosuvastatin 5–10 mg, Simvastatin 20–40 mg, Pravastatin 40–80 mg) với mức khuyến cáo **Class IIa, LOE A**.
  - Việc bỏ trống toàn bộ tầng nguy cơ trung bình khiến nhóm đối tượng phòng ngừa tiên phát lớn nhất trong cộng đồng không nhận được bất kỳ chỉ dẫn dược lý nào.
- **Hành động khắc phục**:
  Xây dựng quy tắc `lipid.statin.moderate_risk_initiate`: Khi bệnh nhân thuộc tầng nguy cơ trung bình có LDL-C > 2.6 mmol/L, đưa ra khuyến cáo tư vấn lối sống và cân nhắc khởi trị Statin cường độ trung bình (Atorvastatin 10–20 mg hoặc Rosuvastatin 5–10 mg/ngày) nếu không đạt đích.

---

### Finding LIPID-R2-10 (MAJOR): Thiếu Hành Động Chuyển Đổi Statin (Statin Switch) Khi Bệnh Nhân Đang Dùng Statin Cường Độ Trung Bình Chưa Đạt Đích
- **Vị trí**: `src/modules/lipid/rules.outpatient.ts` (dòng 283–335, rule `lipid.statin.very_high_risk_initiate`).
- **Phân tích cơ chế & Bằng chứng**:
  - Chạy thực nghiệm trên Golden Case 26 (`lipid_26_outpatient_simva_contra_80.json`): Bệnh nhân ASCVD đang uống Simvastatin 40 mg, xét nghiệm LDL-C là 2.8 mmol/L (chưa đạt đích < 1.4 mmol/L).
  - Kết quả engine sinh:
    - `[START] Khởi trị Atorvastatin liều cao đạt đích LDL-C < 1.4 mmol/L (80 mg/ngày)`.
    - Kèm theo cảnh báo `[warning] Trùng lặp 2 thuốc nhóm Statin`!
  - **Về mặt lâm sàng**: Bác sĩ không thể "START" thêm một statin mới song song với statin cũ. Hành động chuẩn mực phải là **CHUYỂN ĐỔI (SWITCH)**: Ngừng Simvastatin 40 mg và chuyển đổi sang Statin cường độ cao (Atorvastatin 40–80 mg hoặc Rosuvastatin 20–40 mg). Việc sinh lệnh `START` thô bạo dễ khiến người bệnh uống cùng lúc cả hai loại statin dẫn tới tiêu cơ vân kịch phát.
- **Hành động khắc phục**:
  Trong quy tắc khởi trị statin liều cao: kiểm tra xem bệnh nhân có đang dùng một statin khác không. Nếu có, đổi tiêu đề và nội dung khuyến cáo thành "Chuyển đổi sang Statin cường độ cao (Ngừng [statin cũ] và chuyển sang Atorvastatin 40–80 mg hoặc Rosuvastatin 20–40 mg)".

---

### Finding LIPID-R2-11 (MINOR): Biệt Dược Nước Ngoài Không Lưu Hành Tại Việt Nam Trong Trường `vnBrands` Của 5 Thuốc Hạ Lipid
- **Vị trí**: `kb/drugs/ezetimibe.json`, `fenofibrate.json`, `pravastatin.json`, `omega3.json`, `bempedoic_acid.json`, `icosapent_ethyl.json`.
- **Phân tích chi tiết**:
  1. `ezetimibe.json`: Chứa `vnBrands: ["Zetia"]`. "Zetia" là tên biệt dược độc quyền tại Mỹ của Schering-Plough/Merck. Tại Việt Nam, MSD phân phối chính hãng dưới tên **Ezetrol** (10 mg). Tên Zetia không có số đăng ký tại Việt Nam.
  2. `fenofibrate.json`: Chứa `vnBrands: ["Tricor"]`. "Tricor" là tên biệt dược tại Mỹ của AbbVie. Tại Việt Nam, biệt dược gốc phổ biến nhất là **Lipanthyl** (145 mg, 200M) của Abbott/Fournier, cùng các thuốc generic trong nước (Fenofibrate Stella, Fenostad). Tricor không lưu hành tại VN.
  3. `pravastatin.json`: Chứa `vnBrands: ["Pravastatina"]`. Đây là tên thuốc tiếng Tây Ban Nha/Ý. Tại Việt Nam lưu hành dưới tên **Pravachol** (10, 20, 40 mg) hoặc Pravastatin Stella.
  4. `omega3.json`: Chứa `vnBrands: ["Lovaza"]`. "Lovaza" là tên biệt dược tại Mỹ của GSK. Tại Việt Nam, sản phẩm duy nhất có số đăng ký thuốc là **Omacor** (nang mềm 1000 mg) của Abbott.
  5. `bempedoic_acid.json` và `icosapent_ethyl.json`: Ghi `vnBrands: ["Nexletol"]` và `["Vascepa"]` mà không có chú thích là thuốc chưa có số đăng ký lưu hành đại trà tại Việt Nam.
- **Hành động khắc phục**:
  Xóa Zetia, Tricor, Pravastatina, Lovaza khỏi `vnBrands` của các file tương ứng; thay bằng các biệt dược chuẩn lưu hành tại VN (Ezetrol, Lipanthyl, Pravachol, Omacor). Bổ sung ghi chú rõ ràng về tình trạng chưa lưu hành cho Nexletol và Vascepa.

---

### Finding LIPID-R2-12 (MINOR): Thiếu Cảnh Báo Nguy Cơ Đứt Gân (Tendon Rupture) Và Chưa Kiểm Tra Tiền Sử Gút Đối Với Bempedoic Acid
- **Vị trí**: `kb/drugs/bempedoic_acid.json` (dòng 39–52) và `rules.outpatient.ts`.
- **Phân tích chi tiết**:
  - Trong `bempedoic_acid.json`, mảng `gates: []` chỉ có cổng kiểm tra nồng độ acid uric ≥ 600 µmol/L.
  - Theo nhãn FDA Nexletol Section 5.1 & 5.2:
    - *Tăng acid uric và Gút*: Bempedoic acid làm tăng acid uric huyết thanh trung bình 0.8 mg/dL (47.6 µmol/L) do ức chế chất vận chuyển OAT2 ở thận. Cơn gút cấp xảy ra ở **11.2% bệnh nhân có tiền sử gút** (so với 2.1% ở nhóm giả dược). Cần cảnh báo thận trọng đặc biệt khi bệnh nhân có tiền sử gút (`conditions.gout: true`).
    - *Đứt gân*: Bempedoic acid làm tăng nguy cơ đứt gân hoặc chấn thương gân (chiếm 0.5% ở gân gót Achilles, cơ nhị đầu hoặc chóp xoay vai, tăng cao ở người > 60 tuổi, suy thận, hoặc dùng corticoid đồng thời). Cảnh báo này chưa được đề cập.
- **Hành động khắc phục**:
  Bổ sung cổng kiểm tra tiền sử gút (`conditions.gout: true`) và đưa cảnh báo nguy cơ đứt gân vào `bempedoic_acid.json` và rule `lipid.statin_intolerance.bempedoic`.

---

### Finding LIPID-R2-13 (MINOR): Ma Trận Lọc Thận (`lipidMatrixEgfr`) Thiếu 8 Thuốc Trong Tổng Số 13 Thuốc Hạ Lipid Của Phân Hệ
- **Vị trí**: `src/modules/lipid/matrix.ts` (dòng 198–361).
- **Phân tích chi tiết**:
  - Bảng `lipidMatrixEgfr` hiện chỉ liệt kê 5 thuốc: Atorvastatin, Rosuvastatin, Ezetimibe, Bempedoic acid, Fenofibrate.
  - 8 thuốc còn lại: Simvastatin, Pravastatin, Pitavastatin, Evolocumab, Alirocumab, Inclisiran, Icosapent ethyl, Omega-3 hoàn toàn không có hàng trên ma trận lọc thận.
  - Trong thực hành lâm sàng, Simvastatin, Pravastatin, Pitavastatin đều là các thuốc statin rất thông dụng và có hướng dẫn chỉnh liều theo chức năng thận (ví dụ Pitavastatin trần liều 2 mg khi suy thận, Simvastatin khởi đầu 5 mg khi eGFR < 30). Việc thiếu vắng trên ma trận làm giảm giá trị tra cứu nhanh của hệ thống.
- **Hành động khắc phục**:
  Mở rộng `lipidMatrixEgfr` để hiển thị đầy đủ các statin còn lại (Simvastatin, Pravastatin, Pitavastatin) và các thuốc sinh học (Evolocumab, Inclisiran).

---

### Finding LIPID-R2-14 (SUGGESTION): Bổ Sung Tùy Chọn Chuyển Đổi Linh Hoạt Giữa Atorvastatin Và Rosuvastatin Trên Giao Diện UI
- **Vị trí**: `src/modules/lipid/rules.outpatient.ts` và `rules.inpatient.ts`.
- **Nội dung kiến nghị**:
  - Hiện tại, tất cả các khuyến cáo điều trị hạ lipid liều cao đều hardcode `drugId: 'atorvastatin'`. Mặc dù phần rationale có nhắc tới Rosuvastatin, trên giao diện người dùng chỉ hiển thị hộp thuốc Atorvastatin 80 mg.
  - Trong thực tế tại Việt Nam, Rosuvastatin (Crestor, Roxuvas) được kê đơn rất phổ biến tại các khoa Tim mạch do hiệu lực hạ LDL-C rất mạnh ở liều thấp (10–20 mg) và ít tương tác qua CYP3A4 hơn atorvastatin.
  - Kiến nghị hỗ trợ hiển thị song song hoặc cho phép bác sĩ bấm chuyển đổi giữa Atorvastatin (40–80 mg) và Rosuvastatin (20–40 mg, khởi đầu 5 mg ở người châu Á) trên cùng một thẻ can thiệp.

---

## 4. THẨM ĐỊNH ĐÍCH LDL-C VÀ PHẦN TRĂM GIẢM DỰ KIẾN (ESC/EAS 2019 TABLE 7)

Module `lipid` và công cụ tính toán `ldlTarget.ts` đã cài đặt rất chuẩn xác các mốc nồng độ đích kép theo ESC/EAS 2019 và ESC 2025:

| Tầng nguy cơ tim mạch | Tiêu chuẩn lâm sàng | Đích tuyệt đối LDL-C | Yêu cầu % giảm từ baseline | Dự kiến phác đồ đạt đích | Đánh giá dược lâm sàng R2 |
|---|---|:---:|:---:|---|---|
| **Cực cao (Tái phát ACS)** | ASCVD tái phát biến cố thứ 2 trong vòng 2 năm | **< 1.0 mmol/L** (< 40 mg/dL) | ≥ 50% | Statin cường độ cao + Ezetimibe + PCSK9i (~85%) | **XUẤT SẮC**. Đúng khuyến cáo Class IIb B của ESC 2019 Section 6.1.1. |
| **Rất cao (Very High Risk)** | ASCVD rõ, ĐTĐ có tổn thương cơ quan đích, CKD nặng (eGFR < 30), SCORE2 ≥ 20% | **< 1.4 mmol/L** (< 55 mg/dL) | **≥ 50%** | Statin cường độ cao (~50%) + Ezetimibe (~65%) | **CHUẨN XÁC**. Đúng Class I A của ESC 2019. Cần bổ sung rule PCSK9i khi chưa đạt đích. |
| **Cao (High Risk)** | TC > 8 hoặc LDL ≥ 4.9 mmol/L, ĐTĐ ≥ 10 năm, CKD trung bình (eGFR 30–59), SCORE2 10–19% | **< 1.8 mmol/L** (< 70 mg/dL) | **≥ 50%** | Statin cường độ cao hoặc trung bình dung nạp tối đa | **CHUẨN XÁC**. Đúng Class I A của ESC 2019. |
| **Trung bình (Moderate Risk)** | ĐTĐ trẻ tuổi < 10 năm không YTNC, SCORE2 2–9% | **< 2.6 mmol/L** (< 100 mg/dL) | Không bắt buộc 50% | Can thiệp lối sống; Statin cường độ trung bình (~30%) | **THIẾU LUẬT**. Đích đặt đúng trong KB nhưng `rules.outpatient.ts` bỏ trống quy tắc kê đơn. |
| **Thấp (Low Risk)** | SCORE2 < 2% | **< 3.0 mmol/L** (< 116 mg/dL) | Không bắt buộc 50% | Thay đổi lối sống | **ĐẠT CHUẨN**. Đúng ESC 2019 Class IIb A. |

**Ước tính mức giảm LDL-C theo ESC/EAS 2019 Table 7:**
- Statin cường độ trung bình: giảm ~30%
- Statin cường độ cao: giảm ~50%
- Statin cường độ cao + Ezetimibe: giảm ~65%
- Thuốc ức chế PCSK9 đơn độc: giảm ~60%
- Thuốc ức chế PCSK9 + Statin cường độ cao: giảm ~75%
- Thuốc ức chế PCSK9 + Statin cường độ cao + Ezetimibe: giảm ~85%
- Bempedoic acid đơn độc: giảm ~15–25%
- Bempedoic acid + Ezetimibe: giảm ~35–40%

Các con số trong `COEFFICIENTS.therapyReductions` của `src/engine/calculators/ldlTarget.ts` hoàn toàn trùng khớp 100% với y văn gốc.

---

## 5. ĐỐI CHIẾU DƯỢC THƯ VÀ TÌNH HÌNH LƯU HÀNH THUỐC TẠI VIỆT NAM (DAV 2026)

| Hoạt chất | Dạng bào chế tại VN | Tên biệt dược lưu hành đại trà tại VN | Tình trạng BHYT tại Việt Nam | Khuyến nghị thực hành Dược lâm sàng |
|---|---|---|:---:|---|
| **Atorvastatin** | Viên nén bao phim 10, 20, 40, 80 mg | **Lipitor**, Atorlip, Torvast, Lipistat | Chi trả **100%** (thuốc generic & biệt dược gốc) | Thuốc lựa chọn đầu tay tại mọi tuyến bệnh viện. |
| **Rosuvastatin** | Viên nén bao phim 5, 10, 20 mg (ít có 40 mg) | **Crestor**, Roxuvas, Rosuvastatin Stella | Chi trả **100%** | Ưu tiên ở người châu Á liều 5–10 mg; an toàn hơn atorvastatin khi dùng cùng thuốc ức chế CYP3A4. |
| **Simvastatin** | Viên nén bao phim 10, 20, 40 mg | **Zocor**, Simvastatin Stella | Chi trả **100%** | Cần rà soát kỹ tương tác thuốc CYP3A4 trước khi kê đơn. Tuyệt đối không dùng liều 80 mg. |
| **Pravastatin** | Viên nén 10, 20, 40 mg | **Pravachol**, Pravastatin Stella | Chi trả **100%** | Lựa chọn tối ưu cho bệnh nhân dùng nhiều thuốc chuyển hóa qua CYP450 (kháng virus, thuốc chống loạn nhịp). |
| **Pitavastatin** | Viên nén bao phim 1, 2, 4 mg | **Livalo** | Chi trả **100%** | Lựa chọn ưu tiên cho bệnh nhân tiền đái tháo đường hoặc có nguy cơ cao đái tháo đường mới khởi phát. |
| **Ezetimibe** | Viên nén 10 mg (hoặc viên kết hợp Atorva/Eze, Rosuva/Eze) | **Ezetrol**, Ezetimibe Stella | Chi trả **100%** | Nên ưu tiên viên kết hợp liều cố định (Single-Pill Combination SPC) để tăng tuân thủ điều trị. |
| **Evolocumab** | Bút tiêm nạp sẵn 140 mg/mL | **Repatha** | **Chưa chi trả BHYT** (bệnh nhân tự chi trả ~3.5–5 triệu VNĐ/mũi) | Chỉ định ở bệnh nhân nguy cơ cực kỳ cao có khả năng tài chính hoặc có bảo hiểm tư nhân. |
| **Alirocumab** | Bút tiêm nạp sẵn 75, 150 mg/mL | **Praluent** | **Chưa chi trả BHYT** | Tương tự Evolocumab, sẵn có tại một số bệnh viện tuyến trung ương. |
| **Inclisiran** | Bơm tiêm nạp sẵn 284 mg/1.5 mL | **Leqvio** | **Chưa chi trả BHYT** (chi phí cao, tiêm 6 tháng/lần) | Giải pháp mới giúp giải quyết vấn đề tuân thủ điều trị tiêm định kỳ. |
| **Bempedoic acid** | Viên nén 180 mg | *Chưa phân phối đại trà* | **Chưa lưu hành** | Đang trong giai đoạn đăng ký; khi cần có thể nhập khẩu theo đơn thuốc cá nhân. |
| **Fenofibrate** | Viên nang vi hạt 200 mg, viên nén 145 mg, nang 67 mg | **Lipanthyl**, Fenofibrate Stella | Chi trả **100%** | Dùng hạ TG cấp phòng viêm tụy. Bắt buộc chỉnh liều xuống 67 mg khi eGFR 30–59. |
| **Icosapent ethyl** | Viên nang mềm 0.5 g, 1 g | *Chưa lưu hành chính thức* | **Chưa lưu hành** | Tạm thời tư vấn lối sống và kiểm soát tối ưu statin tại Việt Nam. |
| **Omega-3 acid ethyl esters** | Viên nang mềm 1000 mg | **Omacor** | Chi trả theo chỉ định cụ thể | Chỉ định khi triglycerid tăng nặng; lưu ý thành phần DHA có thể làm tăng nhẹ LDL-C. |

---

## 6. KẾT LUẬN & ĐỀ XUẤT HÀNH ĐỘNG CHO VÒNG 2

Bản thẩm định chuyên môn Vòng 1 của Reviewer R2 (Dược sĩ lâm sàng Tim mạch) ghi nhận module `lipid` có nền tảng lý thuyết và hệ thống tính toán đích LDL-C rất vững chắc, tuân thủ chặt chẽ ESC/EAS 2019 và ESC 2025. Tuy nhiên, ở góc độ an toàn dược lý và tuân thủ hướng dẫn điều trị, module còn tồn tại **1 lỗi Critical** và **9 lỗi Major** cần phải sửa chữa dứt điểm:

1. **Khắc phục ngay lỗi Critical LIPID-R2-01**: Bổ sung cổng an toàn thai kỳ cho Fenofibrate và mở rộng quy tắc kiểm tra thai kỳ cho toàn bộ các thuốc hạ lipid.
2. **Khắc phục lỗi liều suy thận Fenofibrate (LIPID-R2-02)**: Hạ liều xuống 67 mg/ngày cho bệnh nhân có eGFR 30–59 mL/phút.
3. **Bổ sung khuyến cáo Class I A cho PCSK9i (LIPID-R2-03) và Add-on Ezetimibe (LIPID-R2-04)**.
4. **Bổ sung cảnh báo tương tác Simvastatin và Colchicine vào `interactions.ts` (LIPID-R2-05)**.
5. **Sửa lỗi Semantic Typing mốc thận eGFR 60 mL/phút (LIPID-R2-06)**.
6. **Điều chỉnh ma trận lọc thận Rosuvastatin từ `contra` sang `not_rec` (LIPID-R2-07)**.
7. **Sửa trần liều Pitavastatin ở suy thận trung bình thành 2 mg/ngày (LIPID-R2-08)**.
8. **Bổ sung quy tắc điều trị cho tầng nguy cơ trung bình (LIPID-R2-09) và cơ chế chuyển đổi Statin Switch (LIPID-R2-10)**.
9. **Chuẩn hóa danh mục biệt dược Việt Nam (LIPID-R2-11) và bổ sung các cảnh báo phụ (LIPID-R2-12, LIPID-R2-13, LIPID-R2-14)**.

**Đánh giá chung Vòng 1: FAIL**. Đề nghị Nhóm điều phối chuyển báo cáo sang Kỹ sư Module (Agent I) để tiến hành khắc phục trước khi bước vào Vòng 2.
