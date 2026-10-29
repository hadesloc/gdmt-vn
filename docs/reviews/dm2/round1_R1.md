# Báo Cáo Thẩm Định Chuyên Khoa Nội Tiết & Guideline (Round 1 – R1)
## Module Đái Tháo Đường Típ 2 (DM2) – GDMT-VN

- **Reviewer:** R1 – Chuyên gia Nội tiết / Guideline Checker
- **Ngày thẩm định:** 27/10/2026
- **Vòng đánh giá:** Vòng 1 (Round 1)
- **Tài liệu đối chiếu gốc (kiểm tra trực tiếp từ thư viện `Medical_Library_2026` và text cache):**
  1. **ADA Standards of Care in Diabetes—2026:**
     - *Ch. 6: Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_6_...pdf`)
     - *Ch. 9: Pharmacologic Approaches to Glycemic Treatment* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_9_...pdf`)
     - *Ch. 10: Cardiovascular Disease and Risk Management* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_10_...pdf`)
     - *Ch. 11: Chronic Kidney Disease and Risk Management* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_11_...pdf`)
     - *Ch. 12: Retinopathy, Neuropathy, and Foot Care* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_12_...pdf`)
     - *Ch. 13: Older Adults* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_13_...pdf`)
     - *Ch. 16: Diabetes Care in the Hospital* (`01_Noi_Khoa/Dai_Thao_Duong/ADA_2026_SOC_16_...pdf`)
  2. **International Consensus Report on Hyperglycemic Crises in Adults With Diabetes 2024** (ADA/EASD/JBDS/AACE/DTS, *Diabetes Care* 2024;47(8):1257–1275; `01_Noi_Khoa/Dai_Thao_Duong/ADA_2024_Hyperglycaemic_Crises_Consensus.pdf`).
  3. **KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD** & **KDIGO 2025 Focused Commentary on GLP-1 RAs** (`01_Noi_Khoa/Dai_Thao_Duong/KDIGO_2022_Diabetes_Management_in_CKD.pdf`).
  4. **2023 ESC Guidelines for the Management of Cardiovascular Disease in Patients with Diabetes** (Eur Heart J 2023; `01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2023_Diabetes_and_CVD_Guideline.pdf`).
  5. **Bộ Y tế QĐ 5481/QĐ-BYT 2020:** Hướng dẫn chẩn đoán và điều trị đái tháo đường típ 2 (`06_Viet_Nam/BYT_5481_2020_Dai_Thao_Duong_Tip_2.pdf`).
  6. **Bộ Y tế QĐ 1353/QĐ-BYT 2021:** Sửa đổi, bổ sung Hướng dẫn chẩn đoán và điều trị đái tháo đường típ 2 nội trú (`06_Viet_Nam/BYT_1353_2021_Sua_doi_bo_sung_HD_DTD.pdf`).
  7. **Nhãn thuốc chính thức FDA DailyMed & EMA SmPC:** 21 thuốc ĐTĐ sở hữu trong `kb/drugs/`.

---

## 1. Kết Luận Chung & Bảng Thống Kê

### Kết luận thẩm định: **FAIL** (Không đạt chuẩn thông qua Vòng 1)

> [!IMPORTANT]
> **Căn cứ theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md):**  
> Điều kiện bắt buộc để PASS vòng review chuyên khoa là **0 lỗi CRITICAL và 0 lỗi MAJOR**.  
> Module ĐTĐ típ 2 (`dm2`) của Agent F hiện tồn tại **3 lỗi CRITICAL** (đe dọa trực tiếp tính mạng người bệnh: bỏ sót cấp cứu toan ceton đường huyết bình thường euglycemic DKA, tụt liều insulin nền nguy kịch 71% trên BN đang dùng insulin, tiêm đồng thời phác đồ basal-bolus dưới da cho BN cấp cứu HHS tại ICU đang truyền insulin TM) và **6 lỗi MAJOR** (ngưỡng áp lực thẩm thấu HHS sai lệch, bỏ sót chỉ định GLP-1 RA Class 1A trong CKD có albumin niệu theo thử nghiệm FLOW, thiếu tạm ngừng Sulfonylurea và SGLT2i nội viện khi mắc bệnh cấp, bỏ sót cảnh báo overbasalization khi kê khai insulin trong currentMeds, citation mismatch nghiêm trọng ở thuốc acarbose/premix, và bỏ quên hoàn toàn QĐ BYT 1353/2021 trong profileDiff VN).

### Bảng phân bố phát hiện (Findings Breakdown)

| Mức độ nghiêm trọng (Severity) | Số lượng | Tỷ lệ (%) | Ý nghĩa lâm sàng |
|---|:---:|:---:|---|
| 🔴 **CRITICAL** | **3** | 20.0% | Có thể gây tử vong hoặc biến cố đe dọa tính mạng người bệnh nếu thực hành theo |
| 🟠 **MAJOR** | **6** | 40.0% | Vi phạm tiêu chuẩn chẩn đoán/khuyến cáo Class 1A, trích dẫn sai nội dung, thiếu quy tắc an toàn cốt lõi |
| 🟡 **MINOR** | **5** | 33.3% | Lỗi hiển thị giao diện UI, dải ma trận chưa tối ưu, thiếu cảnh báo tương tác đặc thù (acarbose) |
| 🔵 **SUGGESTION** | **1** | 6.7% | Đề xuất bổ sung ngưỡng béo phì chuẩn Châu Á (BMI ≥ 25 kg/m²) cho người Việt Nam |
| **TỔNG CỘNG** | **15** | **100%** | |

---

## 2. TOP 5 Vấn Đề Lâm Sàng Trọng Tâm Cần Xử Lý Ngay

1. **🔴 [CRITICAL] Bỏ sót cấp cứu Toan ceton ĐTĐ đường huyết bình thường (Euglycemic DKA) do áp đặt điều kiện Glucose ≥ 11.1 mmol/L (Finding DM2-R1-01):**  
   Quy tắc nội viện `dm2.inpatient.dka_hhs_emergency` áp đặt biến `isDka` bắt buộc phải có `glucose >= 11.1 mmol/L` (200 mg/dL). Khi một bệnh nhân đang dùng SGLT2i bị biến chứng toan ceton đường huyết bình thường (euglycemic DKA) nhập viện với Glucose = 9.8 mmol/L, Ceton máu = 4.2 mmol/L, pH = 7.18, HCO₃⁻ = 11 mmol/L: hệ thống đánh giá `isDka = false` và không hề phát phác đồ cấp cứu bù dịch - insulin TM! Điều này vi phạm trực tiếp Đồng thuận Quốc tế 2024 (*Diabetes Care* 2024;47(8):1257–1275, Figure 2A): tiêu chuẩn đường huyết chỉ cần "Glucose ≥ 200 mg/dL OR prior history of diabetes".

2. **🔴 [CRITICAL] Khởi trị Insulin sớm tái áp đặt liều 10 đơn vị/ngày cho bệnh nhân ĐANG DÙNG insulin liều cao ngoại trú (Finding DM2-R1-02):**  
   Quy tắc ngoại trú `dm2.outpatient.early_insulin` hoàn toàn không kiểm tra `currentMeds`. Một bệnh nhân đang tiêm Insulin Glargine 35 đơn vị/ngày nhưng đường huyết tái khám vẫn cao (Glucose 18.0 mmol/L, HbA1c 10.8%) bị hệ thống phát lệnh `action: 'START'`, `dose: 'Khởi đầu 10 đơn vị/ngày'`. Lệnh này làm tụt liều insulin của người bệnh từ 35 đơn vị xuống 10 đơn vị (giảm 71% liều), dẫn đến mất bù chuyển hóa toan ceton hoặc HHS nguy kịch.

3. **🔴 [CRITICAL] Kích hoạt đồng thời tiêm dưới da Basal-Bolus cho bệnh nhân Cấp cứu HHS tại ICU đang truyền Insulin tĩnh mạch (Finding DM2-R1-03):**  
   Quy tắc `dm2.inpatient.basal_bolus_regimen` chỉ loại trừ DKA (`!isDka`) mà không loại trừ HHS hoặc bệnh nhân ICU. Khi bệnh nhân HHS cấp cứu vào ICU (Glucose 36 mmol/L, ALTT 335 mOsm/kg), hệ thống đồng thời sản sinh 2 khuyến cáo mâu thuẫn: truyền tĩnh mạch liên tục Regular insulin VÀ tiêm dưới da Basal-Bolus (Glargine + Aspart theo cân nặng), gây nguy cơ chồng chéo liều (insulin stacking) và tụt đường huyết tử vong khi bù đủ dịch.

4. **🟠 [MAJOR] Tiêu chuẩn chẩn đoán HHS sai lệch: Lấy ngưỡng ALTT toàn phần (> 320 mOsm/kg) áp cho ALTT hiệu dụng (> 300 mOsm/kg) (Finding DM2-R1-04):**  
   Đồng thuận Quốc tế 2024 quy định: Áp lực thẩm thấu hiệu dụng (Effective osmolality = 2×Na⁺ + Glucose) chỉ cần **> 300 mOsm/kg** (hoặc ALTT toàn phần kèm Urea > 320 mOsm/kg). Tại `inputs.ts`, trường nhập liệu ghi rõ "Áp lực thẩm thấu hiệu dụng" nhưng lại so sánh với ngưỡng `dm2.hhs.osmolality_threshold` = 320 mOsm/kg. Bệnh nhân có ALTT hiệu dụng 310 mOsm/kg (đã vào HHS nguy hiểm) bị hệ thống đánh trượt chẩn đoán.

5. **🟠 [MAJOR] Bỏ sót Khuyến cáo Class 1A của ADA 2026 & KDIGO 2025 về chỉ định GLP-1 RA trên BN ĐTĐ2 có CKD có Albumin niệu (FLOW trial) (Finding DM2-R1-05):**  
   Quy tắc `dm2.outpatient.cardiorenal_glp1` chỉ kiểm tra `egfr < 60`, hoàn toàn không kiểm tra `uacr`. Bệnh nhân ĐTĐ típ 2 có tổn thương thận do đái tháo đường biểu hiện bằng albumin niệu nặng A3 (UACR ≥ 30 mg/g / ≥ 3 mg/mmol) nhưng eGFR còn bảo tồn (eGFR ≥ 60 mL/phút/1.73m²) bị tước đoạt chỉ định bảo vệ thận Class 1A của GLP-1 RA (Semaglutide 1.0 mg/tuần).

---

## 3. Đối Chiếu Chi Tiết Từng Hạng Mục & Luật Lâm Sàng

### 3.1. Mục tiêu HbA1c cá thể hóa (ADA 2026 Ch. 6, Ch. 13 & BYT 5481)
- **Đích chuẩn:** `< 7.0% (< 53 mmol/mol)` cho đa số người trưởng thành không mang thai (ADA SOC 6 Table 6.3 & BYT 5481 Bảng 4).
- **Người trẻ tuổi, mới chẩn đoán, nguy cơ hạ đường huyết thấp:** `< 6.5% (< 48 mmol/mol)` (BYT 5481 Bảng 4 Ghi chú / ADA Rec 6.6). Tuy nhiên tại `rules.outpatient.ts` dòng 38, lập trình viên hardcode điều kiện `age < th('dm2.elderly.age_threshold') - 20` (tức `< 45` tuổi), đây là phép tính số học chưa được chuẩn hóa thành threshold.
- **Người cao tuổi (≥ 65 tuổi theo ADA Ch. 13 Table 13.2 & BYT 5481 Bảng 5):**
  - Nhóm 1: Khỏe mạnh, ít bệnh kèm, nhận thức nguyên vẹn -> Đích `< 7.0 – 7.5%` (ADA Table 13.2 / BYT `< 7.5%`).
  - Nhóm 2: Phức tạp/trung bình (nhiều bệnh kèm, suy giảm nhẹ ADL/nhận thức) -> Đích `< 8.0%` (ADA Table 13.2 / BYT `< 8.0%`).
  - Nhóm 3: Rất phức tạp / sức khỏe kém / giai đoạn cuối -> "Tránh dựa vào HbA1c; ưu tiên tránh hạ đường huyết và tránh tăng ĐH có triệu chứng" (ADA Table 13.2 / BYT `< 8.5%`).
- **Đánh giá:** Logic phân tầng mục tiêu HbA1c thể hiện rất sát khuyến cáo ADA Ch. 13 và BYT 5481, có ghi rõ `profileDiff`.

### 3.2. Thuốc bảo vệ tim–thận độc lập HbA1c (ADA Ch. 9, 10, 11, KDIGO 2022/2025, ESC 2023)
- **Thuốc ức chế SGLT2 (SGLT2i):**
  - Chỉ định Class 1A (ADA Rec 9.8, 9.10, KDIGO 1A, ESC Class I): Bệnh nhân ĐTĐ típ 2 kèm Suy tim (bất kể LVEF), Bệnh thận mạn (eGFR 20–60 hoặc UACR ≥ 3 mg/mmol), hoặc ASCVD.
  - Cổng an toàn: eGFR ≥ 20 mL/phút/1.73m² để khởi trị mới; nếu đang dùng được phép duy trì cho đến khi lọc máu. Quy tắc `dm2.outpatient.cardiorenal_sglt2i` vận hành chuẩn xác.
- **Đồng vận GLP-1 RA & Dual GIP/GLP-1 RA (Tirzepatide):**
  - Chỉ định Class 1A (ADA Rec 9.7, 9.9a, 9.10, KDIGO 1A): Bệnh nhân ĐTĐ típ 2 kèm ASCVD, Bệnh thận mạn, hoặc Thừa cân/Béo phì.
  - **Lỗi bỏ sót (Finding DM2-R1-05):** Quy tắc `dm2.outpatient.cardiorenal_glp1` bỏ quên albumin niệu (`uacr`), loại trừ bệnh nhân CKD giai đoạn sớm có albumin niệu nặng A3 khỏi chỉ định GLP-1 RA bảo vệ thận.
- **Nonsteroidal MRA (Finerenone):**
  - ADA 2026 Rec 11.6 & KDIGO 2022 Rec 1.4.1 (1A): Finerenone được khuyến cáo ở BN ĐTĐ2 có CKD có albumin niệu (UACR ≥ 30 mg/g) đang dùng ACEi/ARB liều tối đa. Thuốc do Agent E (CKD) sở hữu; tuy nhiên trong module `dm2`, bước 2 của Pathway và Matrix 2 chưa có ghi chú liên kết chuyển tiếp sang Finerenone khi BN ĐTĐ2 có biến chứng thận.

### 3.3. Metformin theo dải eGFR & Chống chỉ định
- Quy tắc `dm2.outpatient.metformin` kiểm soát hoàn hảo theo dải thận FDA & BYT 5481:
  - eGFR ≥ 45: Khởi trị 500–2000 mg/ngày (`START` hoặc `CONTINUE`).
  - eGFR 30–44: Không khởi trị mới (`DEFER`); nếu đang dùng giảm liều tối đa 1000 mg/ngày (`REDUCE`).
  - eGFR < 30: Chống chỉ định tuyệt đối (`STOP` nếu đang dùng, `AVOID` nếu chưa dùng) do nguy cơ toan acid lactic.
- Cơ chế Fail-closed: Thiếu eGFR và đang dùng -> `HOLD`; thiếu eGFR và chưa dùng -> `missingInputRec`.

### 3.4. Tiêu chí khởi trị Insulin sớm & Chuẩn độ insulin nền
- **Tiêu chí khởi trị sớm:** Glucose máu ≥ 16.7 mmol/L (300 mg/dL), hoặc HbA1c ≥ 10.0%, hoặc có triệu chứng dị hóa cấp tính (sụt cân nhanh, khát nhiều, ceton) (ADA 2026 Rec 9.20 & BYT 5481 p. 25).
- **Lỗi nguy kịch (Finding DM2-R1-02):** Quy tắc `dm2.outpatient.early_insulin` áp đặt liều khởi đầu `10 đơn vị/ngày` cho mọi đối tượng, kể cả bệnh nhân đang dùng liều cao ngoại trú (ví dụ Glargine 35 U), gây tụt liều nghiêm trọng.

### 3.5. Cảnh báo quá liều insulin nền (Overbasalization)
- **Tiêu chuẩn ADA 2026 Ch. 9:** Liều nền > 0.5 U/kg/ngày HOẶC chênh lệch đường huyết trước ngủ - sáng sớm ≥ 2.8 mmol/L (50 mg/dL).
- **Lỗi logic (Finding DM2-R1-07):** Quy tắc chỉ đọc từ `customInputs.currentBasalDoseUnits`, không tự động bóc tách từ `currentMeds`, khiến BN đang dùng insulin liều quá tải kê khai thường quy bị bỏ sót cảnh báo.

### 3.6. Xuống thang điều trị (Deintensification / Deprescribing)
- ADA 2026 Rec 13.14a: Chủ động giảm thang thuốc gây hạ đường huyết (SU, insulin) ở người cao tuổi (≥ 75 tuổi), suy yếu, hoặc sau biến cố hạ đường huyết gần đây.
- **Điểm yếu (Finding DM2-R1-12):** Khuyến cáo `rec_dm2_deintensification` không có `drugId` cụ thể, không nêu rõ thứ tự ưu tiên ngừng SU trước hay giảm liều insulin trước theo thuật toán Figure 13.1 của ADA.

### 3.7. Mục tiêu Huyết áp, Statin và Kháng tiểu cầu đi kèm
- ADA 2026 Ch. 10 & ESC 2023:
  - Huyết áp: Đích < 130/80 mmHg (nếu an toàn).
  - Statin: Tuổi 40–75 phòng ngừa tiên phát dùng statin vừa-cao; có ASCVD dùng statin cường độ cao (đích LDL < 1.4 mmol/L / < 55 mg/dL).
  - Aspirin: 75–162 mg/ngày dự phòng thứ phát cho BN có ASCVD; không khuyến cáo thường quy cho nguy cơ tim mạch thấp do nguy cơ xuất huyết tiêu hóa.
- **Hạn chế:** Quy tắc `dm2.outpatient.comprehensive_care` gom cả 3 vấn đề vào một chuỗi text duy nhất, thiếu sự tách biệt rõ ràng theo từng nhóm thuốc.

### 3.8. Chăm Sóc Nội Viện & Cấp Cứu Tăng Đường Huyết
- **Đích đường huyết nội viện (ADA Ch. 16 Rec 16.5):**
  - ICU: 7.8–10.0 mmol/L (140–180 mg/dL).
  - Khoa phòng thường (Non-ICU): 5.6–10.0 mmol/L (100–180 mg/dL).
  - *Lỗi UI (Finding DM2-R1-10):* Chuỗi hiển thị ICU bị mất cận dưới 140 mg/dL, in ra `7.8 – 10.0 mmol/L (180 mg/dL)`.
- **Phác đồ Basal-Bolus theo cân nặng:**
  - ADA Ch. 16 Rec 16.7: Khuyến cáo mạnh mẽ chống lại việc dùng thang trượt (sliding scale) đơn độc. Gọi máy tính chuẩn `computeInsulin` phân bổ 50% Basal + 50% Bolus bữa ăn.
  - *Lỗi nguy kịch (Finding DM2-R1-03):* Kích hoạt đồng thời phác đồ tiêm dưới da này trên bệnh nhân cấp cứu HHS tại ICU đang truyền insulin tĩnh mạch.
- **Tạm ngừng thuốc uống nội viện:**
  - Tạm ngừng Metformin trong bệnh cấp tính hoặc chụp cản quang: Đạt.
  - Tạm ngừng SGLT2i ít nhất 3 ngày trước mổ: Đạt.
  - *Lỗi thiếu quy tắc (Finding DM2-R1-06):* Không có quy tắc tạm ngừng Sulfonylurea khi nhập viện và không tạm ngừng SGLT2i khi nhập viện nội khoa cấp tính không phẫu thuật.
- **Tăng đường huyết do Steroid (Glucocorticoids):**
  - Phác đồ NPH buổi sáng đối ứng đỉnh tăng đường huyết do Prednisone/Prednisolone: Đạt chuẩn ADA Ch. 16.
- **Hạ đường huyết nội viện (Quy tắc 15 gam):**
  - Đạt chuẩn ADA Ch. 6. Cần bổ sung cảnh báo đặc thù cho Acarbose (bắt buộc dùng Dextrose nguyên chất).
- **Cấp cứu DKA và HHS (Đồng thuận Quốc tế 2024):**
  - Bù Kali trước tiên khi K⁺ < 3.5 mmol/L (hoãn insulin): Đạt chuẩn sống còn tuyệt đối (Fail-closed).
  - *Lỗi nguy kịch (Finding DM2-R1-01):* Bỏ sót chẩn đoán Euglycemic DKA do ép điều kiện Glucose ≥ 11.1 mmol/L.
  - *Lỗi tiêu chuẩn chẩn đoán (Finding DM2-R1-04):* Nhầm lẫn ALTT hiệu dụng > 300 với ALTT toàn phần > 320 mOsm/kg.
  - Gối insulin dưới da 1–2 giờ trước khi ngừng truyền tĩnh mạch: Đạt chuẩn.

### 3.9. Đối Chiếu Danh Mục 21 Thuốc (`kb/drugs/`)
- Cấu trúc liều dùng, chỉnh liều thận của các thuốc nhìn chung được thiết kế rất công phu và chi tiết.
- Tuy nhiên tồn tại các lỗi trích dẫn giả mạo (Citation Mismatch) nghiêm trọng tại `acarbose.json` (dẫn chiếu trích dẫn của Metformin) và `insulin_premix.json` (dẫn chiếu trích dẫn bảng mục tiêu HbA1c) (Finding DM2-R1-08).

### 3.10. Đối Chiếu ProfileDiff VN & Khuyến Cáo Bị Bỏ Sót
- Toàn bộ module không có bất kỳ trích dẫn hay áp dụng nào cho Quyết định Bộ Y tế số 1353/QĐ-BYT năm 2021 về việc cho phép sử dụng insulin trộn hỗn hợp (premixed) ở bệnh phòng thường không nguy kịch (Finding DM2-R1-09).

---

## 4. Bảng Chi Tiết Toàn Bộ Các Finding Thẩm Định

| ID | Mức độ | Hạng mục | Item ID | Mô tả phát hiện lâm sàng | Bằng chứng kiểm chứng | Đề xuất khắc phục |
|---|:---:|---|---|---|---|---|
| **DM2-R1-01** | 🔴 **CRITICAL** | `rule` | `dm2.inpatient.dka_hhs_emergency` | Bỏ sót chẩn đoán cấp cứu Toan ceton đái tháo đường đường huyết bình thường (Euglycemic DKA) do áp đặt điều kiện Glucose ≥ 11.1 mmol/L. | `rules.inpatient.ts` (L262): Ép buộc `glucose >= 11.1` khi chưa tích `dkaSuspected`. Đồng thuận Quốc tế 2024 (Fig 2A, p. 6) quy định: "Glucose ≥ 200 mg/dL OR prior history of diabetes". Thực nghiệm Scenario 1: BN euglycemic DKA bị bỏ rơi hoàn toàn. | Đối với BN đã có tiền sử ĐTĐ, tiêu chuẩn đường huyết tự động đạt; chỉ cần Ceton ≥ 3.0 và pH < 7.30 / HCO₃⁻ < 18 là kích hoạt ngay phác đồ DKA. |
| **DM2-R1-02** | 🔴 **CRITICAL** | `rule` | `dm2.outpatient.early_insulin` | Khởi trị Insulin sớm tái áp đặt liều khởi đầu 10 đơn vị/ngày cho BN ĐANG DÙNG insulin nền liều cao, nguy cơ gây tụt liều đột ngột và mất bù toan ceton/HHS. | `rules.outpatient.ts` (L341-363): Không kiểm tra `currentMeds`. BN đang dùng Glargine 35 U có Glucose 18 mmol/L bị phát lệnh `START 10 U` (giảm 71% liều). Thực nghiệm Scenario 2 đã chứng minh vi phạm. ADA 2026 Ch. 9 yêu cầu chuẩn độ tăng liều hoặc thêm bolus. | Kiểm tra `currentMeds`: Nếu đã có insulin nền, chuyển hành động thành `UPTITRATE` hoặc `CONSIDER` thêm GLP-1 RA / bolus; chỉ phát `START 10 U` khi chưa từng tiêm insulin. |
| **DM2-R1-03** | 🔴 **CRITICAL** | `rule` | `dm2.inpatient.basal_bolus_regimen` | Kích hoạt đồng thời tiêm dưới da Basal-Bolus cho BN cấp cứu HHS tại ICU đang truyền Insulin tĩnh mạch liên tục. | `rules.inpatient.ts` (L56-62): Chỉ loại trừ DKA (`!isDka`), không loại trừ HHS hay ICU. BN HHS ở ICU nhận cùng lúc phác đồ truyền TM và phác đồ tiêm dưới da. Thực nghiệm Scenario 3 đã chứng minh nguy cơ chồng chéo liều. | Thêm điều kiện loại trừ: Không kích hoạt phác đồ tiêm dưới da khi đang có khủng hoảng tăng ĐH cấp (`isDka || isHhs || inpatientUnit === 'icu'`). |
| **DM2-R1-04** | 🟠 **MAJOR** | `threshold` | `dm2.hhs.osmolality_threshold` | Tiêu chuẩn chẩn đoán HHS sai lệch: Lấy ngưỡng ALTT toàn phần (> 320 mOsm/kg) áp cho ALTT hiệu dụng (> 300 mOsm/kg), gây bỏ sót chẩn đoán. | Đồng thuận 2024 (Fig 2B, p. 6): Effective osmolality > 300 mOsm/kg. Ngưỡng trong KB là 320. `inputs.ts` (L156-163) ghi nhãn ALTT hiệu dụng nhưng so sánh > 320. Thực nghiệm Scenario 4: BN có ALTT hiệu dụng 310 mOsm/kg bị bỏ sót HHS. | Sửa giá trị ngưỡng `dm2.hhs.osmolality_threshold` thành 300 mOsm/kg theo đúng tiêu chuẩn Effective Osmolality. |
| **DM2-R1-05** | 🟠 **MAJOR** | `rule` | `dm2.outpatient.cardiorenal_glp1` | Bỏ sót Khuyến cáo Class 1A của ADA 2026 & KDIGO 2025 về chỉ định GLP-1 RA trên BN ĐTĐ2 có CKD có Albumin niệu (FLOW trial). | ADA 2026 Rec 9.10, 11.5a & FLOW trial (NEJM 2024). `rules.outpatient.ts` (L181) chỉ kiểm tra `egfr < 60`, bỏ qua `uacr`. Thực nghiệm Scenario 5: BN CKD A3 eGFR 75 bị mất chỉ định GLP-1 RA. | Bổ sung kiểm tra `uacr >= th('ckd.uacr.a1_max_mgmmol')` vào biến `hasCkd` trong quy tắc `cardiorenal_glp1`. |
| **DM2-R1-06** | 🟠 **MAJOR** | `missing` | `dm2.inpatient.hold_oral_meds_acute` | Thiếu hoàn toàn quy tắc Tạm ngừng Sulfonylurea (Gliclazide, Glimepiride) và SGLT2i khi bệnh nhân nhập viện vì bệnh nội khoa cấp tính không phẫu thuật. | ADA 2026 Ch. 16 (p. 5-6) & BYT 5481 (p. 36): SU và SGLT2i phải tạm ngừng khi nhập viện cấp tính. Trong code, `hold_sglt2i_surgery` chỉ chạy khi có phẫu thuật; hoàn toàn không có quy tắc ngừng SU nội viện. | Tạo quy tắc `dm2.inpatient.hold_su_and_sglt2i_acute`: Phát lệnh `HOLD` cho SU và SGLT2i khi nhập viện có bệnh cấp tính hoặc nằm ICU. |
| **DM2-R1-07** | 🟠 **MAJOR** | `rule` | `dm2.outpatient.overbasalization` | Bỏ sót cảnh báo Overbasalization khi bác sĩ nhập liều insulin nền trong danh mục thuốc thường quy (`currentMeds`). | `rules.outpatient.ts` (L376-379): Chỉ đọc từ `customInputs.currentBasalDoseUnits`. Nếu BN đang dùng Glargine 45 U/ngày kê khai trong `currentMeds`, hệ thống tính liều/kg = 0 và im lặng bỏ qua quá liều nền. | Bổ sung logic tự động trích xuất liều insulin nền từ `ctx.patient.currentMeds` nếu trường tùy biến chưa được điền. |
| **DM2-R1-08** | 🟠 **MAJOR** | `citation` | `kb/drugs/acarbose.json` & `insulin_premix.json` | Trích dẫn sai lệch nội dung (Citation Mismatch) nghiêm trọng trong Danh mục thuốc. | `acarbose.json` dẫn chiếu citation của Metformin (`metformin_renal_contra`). `insulin_premix.json` dẫn chiếu citation Bảng 4 mục tiêu HbA1c (`hba1c_goals`). `insulin_aspart` dẫn chiếu đích glucose 140-180 mg/dL (`inpatient_target`) cho liều bolus và cổng NPO. | Tạo các citation chuẩn xác: `byt.dm2.2020.acarbose_renal` (Trang 66), `byt.dm2.2020.premix_dosing` (Trang 25-28), và `ada.dm2.2026.prandial_npo_hold` (Ch. 16 Rec 16.7). |
| **DM2-R1-09** | 🟠 **MAJOR** | `rule` | `dm2.inpatient.basal_bolus_regimen` | Bỏ sót hoàn toàn khuyến cáo của Quyết định Bộ Y tế số 1353/QĐ-BYT năm 2021 về lựa chọn phác đồ insulin trộn hỗn hợp (premixed) nội trú trong profileDiff VN. | Docs tuyên bố dùng BYT 1353/2021 nhưng mã nguồn không có bất kỳ dòng nào. QĐ 1353/2021 sửa đổi điểm b mục 3 trang 37 cho phép dùng insulin trộn hỗn hợp ở bệnh nặng không nguy kịch. Code thiếu `profileDiff.VN`. | Bổ sung citation `byt.dm2.2021.inpatient_insulin_1353` và cập nhật `profileDiff.VN` trong `dm2.inpatient.basal_bolus_regimen`. |
| **DM2-R1-10** | 🟡 **MINOR** | `ui` | `dm2.inpatient.glycemic_target` | Lỗi hiển thị giao diện và thiếu Threshold: Mục tiêu Glucose ICU hiển thị thiếu cận dưới mg/dL (`7.8 – 10.0 mmol/L (180 mg/dL)`). | `rules.inpatient.ts` (L29): Chuỗi nội suy thiếu cận dưới 140 mg/dL do thiếu threshold `dm2.glucose.icu_target_min` trong `thresholds/dm2.json`. | Thêm threshold `dm2.glucose.icu_target_min` (140 mg/dL) và sửa chuỗi hiển thị thành `140–180 mg/dL`. |
| **DM2-R1-11** | 🟡 **MINOR** | `matrix` | `kb/drugs/gliclazide.json` | Khai báo sai mức độ khuyến nghị Sulfonylurea trong Ma trận dải lọc thận: Gliclazide được gán `initiate: 'rec'` ở dải eGFR ≥ 30 mL/phút. | `gliclazide.json` (L34): Gán `initiate: 'rec'`, làm Gliclazide hiện màu xanh ưu tiên trong Ma trận 1 cho G1–G3a, trái ngược với ADA/KDIGO (chỉ xếp SU ở mức cân nhắc do nguy cơ hạ ĐH). | Sửa `initiate` của Gliclazide ở dải eGFR ≥ 30 thành `'ok'` hoặc `'caution'`. |
| **DM2-R1-12** | 🟡 **MINOR** | `rule` | `dm2.outpatient.comprehensive_care` | Quy tắc Điều trị toàn diện gom chung Huyết áp + Statin + Aspirin thành một khuyến cáo duy nhất không có `drugId` cụ thể. | `rules.outpatient.ts` (L540-579): Trả về `UPTITRATE` chung chung khi HA chưa đạt đích, không phân tầng statin trung bình vs cao, không cảnh báo xuất huyết cho aspirin tiên phát. | Tách biệt các khuyến cáo hoặc chỉ định rõ nhóm thuốc ưu tiên hạ áp (ACEi/ARB khi có albumin niệu) và phân tầng statin chuẩn theo ADA SOC 10. |
| **DM2-R1-13** | 🟡 **MINOR** | `rule` | `dm2.inpatient.hypoglycemia_protocol` | Thiếu cảnh báo bắt buộc dùng Glucose đơn đường (Dextrose) thay vì đường ăn (Sucrose) trong giao thức hạ đường huyết khi bệnh nhân đang dùng Acarbose. | `rules.inpatient.ts` (L238): Khuyên uống nước trái cây hoặc viên ngậm đường chung chung. Acarbose ức chế enzym alpha-glucosidase khiến đường đôi sucrose không thể thủy phân kịp. | Thêm kiểm tra `acarbose` trong `currentMeds`: Bắt buộc chỉ sử dụng viên Glucose/Dextrose nguyên chất hoặc tiêm tĩnh mạch. |
| **DM2-R1-14** | 🟡 **MINOR** | `citation` | `ada.dm2.2026.elderly_age_75` | Citation `ada.dm2.2026.elderly_age_75` trích dẫn Danh mục tài liệu tham khảo (Reference 115) thay vì nội dung khuyến cáo chính. | `kb/citations/dm2.json`: Trích dẫn trúng dòng Reference 115 ở trang 19 ("adults aged 75 to 79 years..."), đây là lỗi trích dẫn hình thức vào danh mục tài liệu tham khảo. | Thay bằng đoạn văn khuyến cáo chính thức trong Section "Pharmacotherapy in Older Adults" hoặc Rec 13.14a. |
| **DM2-R1-15** | 🔵 **SUGGESTION** | `threshold` | `dm2.obesity.bmi_asian_threshold` | Bổ sung ngưỡng phân loại Béo phì chuẩn Châu Á (BMI ≥ 25 kg/m² theo IDI-WPRO / Bộ Y tế 5481) vào hệ thống ngưỡng. | `DM2.md` ghi nhận chuẩn béo phì Châu Á BMI ≥ 25 kg/m², nhưng hệ thống hiện chỉ dùng ngưỡng phương Tây 30 kg/m². BN Việt Nam BMI 25–29 kg/m² bị bỏ sót nếu không tích chọn thủ công. | Tạo threshold `dm2.obesity.bmi_asian_threshold` (giá trị 25 kg/m²) để tối ưu hóa nhận diện chỉ định GLP-1 RA tại Việt Nam. |

---

## 5. Kết Luận & Hướng Dẫn Cho Vòng Khắc Phục (Next Steps)

1. **Module `dm2` CHƯA ĐẠT CHUẨN THÔNG QUA VÒNG 1 (Verdict: FAIL).**
2. Cần điều phối chuyển giao danh sách 15 phát hiện sang Agent F (Module Owner ĐTĐ2) để chỉnh sửa mã nguồn và KB theo đúng khuyến nghị:
   - Ưu tiên số 1: Xử lý triệt để 3 lỗi **CRITICAL** (sửa điều kiện DKA bao phủ Euglycemic DKA; kiểm tra `currentMeds` trong khởi trị insulin sớm để tránh tụt liều nguy hại; loại trừ HHS và ICU khỏi phác đồ tiêm dưới da basal-bolus).
   - Ưu tiên số 2: Sửa 6 lỗi **MAJOR** (ngưỡng ALTT hiệu dụng HHS thành 300; bổ sung `uacr` cho GLP-1 RA trong CKD; xây dựng quy tắc tạm ngừng SU và SGLT2i nội viện cấp tính; trích xuất liều nền từ `currentMeds` cho overbasalization; sửa các citation mismatch; tích hợp QĐ 1353/2021 vào `profileDiff.VN`).
3. Toàn bộ 15 phát hiện đều đã được lưu trữ dưới định dạng máy đọc tại [`docs/reviews/dm2/round1_R1.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/round1_R1.json) và kiểm chứng thực nghiệm bằng test script tự động tại [`docs/reviews/dm2/scratch/eval_findings.test.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/scratch/eval_findings.test.ts).
