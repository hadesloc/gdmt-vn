# Báo Cáo Thẩm Định Chuyên Khoa Thận Học & Guideline (Round 1 – R1)
## Module Bệnh Thận Mạn (CKD) – GDMT-VN

- **Reviewer:** R1 – Chuyên gia Thận học / Guideline Checker
- **Ngày thẩm định:** 27/10/2026
- **Vòng đánh giá:** Vòng 1 (Round 1)
- **Tài liệu đối chiếu gốc (mở trực tiếp từ kho `Medical_Library_2026`):**
  1. **KDIGO 2024 CKD Guideline** (`01_Noi_Khoa/Than/KDIGO_2024_CKD_Guideline.pdf`)
  2. **KDIGO 2021 Blood Pressure in CKD** (`01_Noi_Khoa/Than/KDIGO_2021_Blood_Pressure_in_CKD.pdf`)
  3. **KDIGO 2022 Diabetes Management in CKD** (`01_Noi_Khoa/Dai_Thao_Duong/KDIGO_2022_Diabetes_Management_in_CKD.pdf`)
  4. **KDIGO 2012 AKI Guideline** (`01_Noi_Khoa/Than/KDIGO_2012_AKI_Guideline.pdf`)
  5. **ESC 2026 CVD in CKD Guidelines** (`01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2026_cvd_chronic_kidney_disease.pdf`)
  6. **UKKA 2022 Treatment of Acute Hyperkalaemia in Adults** (`08_Bo_sung_ON_CALL/UKKA_2022_Treatment_Acute_Hyperkalaemia_Adults.pdf`)
  7. **Bộ Y tế QĐ 2388/QĐ-BYT 2024 Hướng dẫn chẩn đoán và điều trị BTM** (`06_Viet_Nam/BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`)
  8. **Nhãn thuốc FDA / SmPC:** Farxiga (dapagliflozin), Kerendia (finerenone), Coversyl (perindopril), Cozaar (losartan), Veltassa (patiromer), Lokelma (SZC).

---

## 1. Kết Luận Chung & Bảng Thống Kê

### Kết luận thẩm định: **FAIL** (Không đạt chuẩn thông qua Vòng 1)

> **Căn cứ theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md):**  
> Điều kiện để PASS vòng review chuyên khoa là **0 lỗi CRITICAL và 0 lỗi MAJOR**.  
> Module CKD hiện tồn tại **2 lỗi CRITICAL** (có nguy cơ trực tiếp gây hại cho người bệnh do chỉ định lọc máu cấp cứu nhầm và từ chối thuốc bảo vệ thận thiết yếu) cùng **5 lỗi MAJOR** (bỏ sót khuyến cáo Class 1B, phân độ sai AKI, trích dẫn giả mạo và bỏ sót theo dõi an toàn tăng kali máu).

### Bảng phân bố phát hiện (Findings Breakdown)

| Mức độ nghiêm trọng (Severity) | Số lượng | Tỷ lệ (%) | Ý nghĩa lâm sàng |
|---|:---:|:---:|---|
| 🔴 **CRITICAL** | **2** | 16.7% | Có thể gây hại trực tiếp cho người bệnh nếu bác sĩ thực hành theo |
| 🟠 **MAJOR** | **5** | 41.7% | Vi phạm nội dung guideline, bỏ sót khuyến cáo Class I, trích dẫn sai lệch |
| 🟡 **MINOR** | **4** | 33.3% | Thiếu kiểm tra thuốc đang dùng, hardcode số học, chưa tận dụng hết dải ngưỡng |
| 🔵 **SUGGESTION** | **1** | 8.3% | Đề xuất tối ưu hóa hiển thị mức khuyến cáo động trên UI |
| **TỔNG CỘNG** | **12** | **100%** | |

---

## 2. TOP 5 Vấn Đề Lâm Sàng Trọng Tâm Cần Xử Lý Ngay

1. **🔴 [CRITICAL] Chỉ định Lọc máu cấp cứu kích hoạt sai lệch trên Toan chuyển hóa nhẹ–vừa (HCO3⁻ < 18 mmol/L):**  
   Quy tắc nội trú `ckd.inpatient.emergency_dialysis_indication` tái sử dụng ngưỡng `ckd.acidosis.hco3_min` (18 mmol/L) làm chỉ định lọc máu khẩn cấp. Một bệnh nhân nhập viện có HCO3⁻ = 17 mmol/L (chỉ cần bù kiềm đường uống) sẽ bị hệ thống phát chuông báo động chỉ định đặt catheter lọc máu cấp cứu xâm lấn! Tương tự, ngưỡng K⁺ ≥ 6.5 mmol/L bị kích hoạt lọc máu ngay lập tức mà không phân định bệnh nhân đang lọc máu chu kỳ hay tăng kali chưa qua điều trị nội khoa ban đầu.
2. **🔴 [CRITICAL] Cổng an toàn Huyết áp chặn đứng thuốc bảo vệ thận RASi ở bệnh nhân có HA bình thường (SBP 100–119 mmHg):**  
   Quy tắc ngoại trú `ckd.outpatient.rasi_initiate` và `ckd.outpatient.rasi_uptitrate` đã nhầm lẫn lấy ngưỡng huyết áp mục tiêu (target SBP < 120 mmHg) làm cổng an toàn tối thiểu (`passedSbp = sbp >= 120`). Bệnh nhân CKD có albumin niệu tăng nặng (A3) nhưng huyết áp tối ưu 110–118 mmHg bị hệ thống từ chối khởi trị (`DEFER`) vì cảnh báo sai là "nguy cơ tụt HA tư thế"!
3. **🟠 [MAJOR] Bỏ sót Khuyến cáo Class 1B của KDIGO 2024 về Statin cho CKD giai đoạn G1–G2 từ 50 tuổi trở lên:**  
   Quy tắc `ckd.outpatient.statin_indication` đặt điều kiện cứng `egfr < 60`, loại bỏ toàn bộ bệnh nhân từ 50 tuổi trở lên mắc CKD giai đoạn G1–G2 (eGFR ≥ 60 mL/phút/1.73m² có kèm albumin niệu), vi phạm trực tiếp Khuyến cáo 3.15.1.2 (Class 1B) của KDIGO 2024.
4. **🟠 [MAJOR] Phân độ AKI Stage 3 sai tiêu chuẩn KDIGO đối với bệnh nhân có Creatinin nền cao:**  
   Quy tắc `ckd.inpatient.aki_staging` tự động phân loại AKI Giai đoạn 3 khi `currentScr >= 353.6 µmol/L` (hardcode literal) mà bỏ qua điều kiện tiên quyết của KDIGO 2012: phải có mức tăng cấp tính ít nhất ≥ 44.2 µmol/L (0.5 mg/dL). Bệnh nhân CKD giai đoạn 4/5 có Creatinin nền 340 µmol/L tăng nhẹ lên 355 µmol/L (+15 µmol/L) bị xếp sai thành tổn thương thận cấp nguy kịch Stage 3.
5. **🟠 [MAJOR] Trích dẫn giả mạo (Citation Mismatch) và phóng đại khuyến cáo cấm NSAID:**  
   Quy tắc `ckd.outpatient.avoid_nsaids` gắn citation `kdigo.ckd.2024.fig_48_referral_criteria` (vốn là Hình 48 về tiêu chí chuyển khám chuyên khoa Thận, hoàn toàn không nhắc đến NSAID). Đồng thời, quy tắc gắn nhãn chống chỉ định tuyệt đối (STOP, priority 100) cho mọi trường hợp CKD kể cả dùng ngắn ngày ở G1/G2, phóng đại mức độ so với KDIGO Bảng 31 và Thực hành lâm sàng.

---

## 3. Đối Chiếu Chi Tiết Từng Luật & Hạng Mục Lâm Sàng

### 3.1. Thuốc ức chế SGLT2 (SGLT2i)
- **Cơ sở guideline:** KDIGO 2024 Rec 3.7.1 (1A cho T2D + eGFR ≥ 20), Rec 3.7.2 (1A cho CKD + ACR ≥ 200 mg/g hoặc kèm Suy tim), Rec 3.7.3 (2B cho eGFR 20–45 kèm ACR < 200 mg/g), PP 3.7.1 (tiếp tục duy trì khi eGFR < 20 cho tới khi lọc máu).
- **Đánh giá logic:**
  - Logic khởi trị `ckd.outpatient.sglt2i_initiate` bao phủ đầy đủ các phân nhóm bệnh nhân theo KDIGO 2024 và thử nghiệm EMPA-KIDNEY / DAPA-CKD.
  - Quy tắc duy trì `ckd.outpatient.sglt2i_continue_below_20` kích hoạt chính xác khi `eGFR < 20 && eGFR > 0` và bệnh nhân chưa lọc máu.
  - **Điểm cần lưu ý (Finding CKD-R1-12):** Trong rationale của `ckd.outpatient.sglt2i_initiate`, chuỗi text mặc định ghi "Khuyến cáo nhóm 1A (KDIGO 2024)..." ngay cả khi bệnh nhân chỉ đủ điều kiện theo nhánh Rec 3.7.3 (eGFR 20–45, không ĐTĐ, không suy tim, ACR < 200 mg/g), vốn chỉ là mức khuyến nghị **2B**.

### 3.2. Thuốc ức chế hệ Renin-Angiotensin (RASi: ACEi / ARB)
- **Cơ sở guideline:** KDIGO 2024 Rec 3.6.1 (1B cho không ĐTĐ + A3), Rec 3.6.2 (2C cho không ĐTĐ + A2), Rec 3.6.3 (1B cho ĐTĐ + A2/A3), Rec 3.6.4 (1B cấm phối hợp kép ACEi + ARB + DRI), PP 3.6.1 (chuẩn độ liều tối đa dung nạp), PP 3.6.4 (chấp nhận Creatinin tăng ≤ 30%).
- **Đánh giá logic:**
  - **Lỗi nghiêm trọng (Finding CKD-R1-02):** Biến `passedSbp` tại dòng 225 được tính bằng `sbp >= th('ckd.bp.target_sbp_kdigo')` (120 mmHg). Đây là lỗi nhầm lẫn giữa **Đích hạ áp** và **Cổng an toàn huyết động**. Bệnh nhân có huyết áp hoàn toàn bình thường (ví dụ 105–118 mmHg) nhưng có tổn thương thận nặng (A3) bị hệ thống chặn không cho dùng RASi!
  - Quy tắc cấm phối hợp kép `ckd.outpatient.avoid_dual_rasi` hoạt động rất tốt, gắn cờ `STOP` chuẩn xác cho thuốc ARB khi phát hiện đang dùng đồng thời cả hai nhóm.
  - Quy tắc theo dõi `ckd.outpatient.rasi_monitoring` ghi nhận đúng mức tăng Creatinin chấp nhận được ≤ 30% theo KDIGO PP 3.6.4.

### 3.3. Finerenone (MRA không steroid)
- **Cơ sở guideline:** KDIGO 2024 Rec 3.8.1 (2A cho ĐTĐ2 + eGFR > 25 + K⁺ bình thường + albumin niệu > 30 mg/g dù đã dùng RASi tối đa), FDA Kerendia Table 1 & Table 2.
- **Đánh giá logic:**
  - Tiêu chí khởi trị `ckd.outpatient.finerenone_indication` kiểm tra chuẩn xác bệnh nền ĐTĐ2, eGFR ≥ 25, UACR ≥ 3 mg/mmol và đang có RASi. Liều khởi đầu tự động phân tầng 10 mg (eGFR 25–59) và 20 mg (eGFR ≥ 60) khớp 100% nhãn FDA.
  - **Lỗi thiếu sót (Finding CKD-R1-07):** Module đã định nghĩa threshold `ckd.finerenone.k_uptitrate_max = 4.8` mmol/L nhưng **quên không viết quy tắc chuẩn độ Finerenone** (`ckd.outpatient.finerenone_uptitrate`). Bệnh nhân khởi đầu 10 mg không bao giờ được hệ thống hướng dẫn tăng lên liều đích 20 mg. Ngược lại, ngưỡng 4.8 mmol/L này lại bị đem dùng nhầm sang quy tắc chuẩn độ của thuốc ACEi/ARB!

### 3.4. Statin phòng ngừa biến cố tim mạch
- **Cơ sở guideline:** KDIGO 2024 Rec 3.15.1.1 (1A cho tuổi ≥ 50, eGFR < 60 mL/min/1.73m²), Rec 3.15.1.2 (1B cho tuổi ≥ 50, eGFR ≥ 60 mL/min/1.73m²), Rec 3.15.1.3 (không khởi trị mới ở bệnh nhân lọc máu chu kỳ).
- **Đánh giá logic:**
  - **Lỗi bỏ sót Class I (Finding CKD-R1-03):** Logic tại dòng 772 `rules.outpatient.ts` chỉ cho phép khởi trị statin ở bệnh nhân ≥ 50 tuổi nếu `egfr < 60`. Những bệnh nhân CKD giai đoạn G1–G2 (eGFR ≥ 60 kèm albumin niệu hoặc tổn thương cấu trúc thận kéo dài ≥ 3 tháng) bị tước bỏ chỉ định statin Class 1B.

### 3.5. Đích Huyết áp (Blood Pressure Target)
- **Cơ sở guideline:** KDIGO 2021/2024 (< 120 mmHg standardized office BP), ESC 2026 CVD-CKD (120–129 mmHg nếu eGFR ≥ 30 và dung nạp), BYT 2024 QĐ 2388 (120–129/70–79 mmHg theo VSH/VNHA 2022).
- **Đánh giá logic:**
  - Quy tắc `ckd.outpatient.bp_target` thể hiện sự khác biệt quốc tế rất xuất sắc qua cấu trúc `profileDiff`. Khi ở profile INTL, đích hiển thị < 120 mmHg; ở profile VN, đích hiển thị 120–129 mmHg.
  - Trích dẫn ESC 2026 Mục 5.2.1 và BYT 2024 Bảng 11 trang 36–37 hoàn toàn khớp với văn bản gốc.

### 3.6. Ngưỡng chuyển khám chuyên khoa Thận & Phương trình KFRE
- **Cơ sở guideline:** KDIGO 2024 Practice Point 2.2.1–2.2.3, Figure 48 (trang 51 & 166).
- **Đánh giá logic:**
  - Quy tắc `ckd.outpatient.nephrology_referral` tổng hợp đa tiêu chí: eGFR < 30 (G4/G5), KFRE 5 năm ≥ 5%, UACR > 70 mg/mmol, hoặc albumin niệu A3 kèm tiểu máu vi thể.
  - **Điểm cần hoàn thiện (Finding CKD-R1-11):** KDIGO PP 2.2.1 xác định khoảng nguy cơ 3%–5% 5 năm là vùng cân nhắc chuyển tuyến; hiện tại quy tắc chỉ bắt ngưỡng cứng 5%.

### 3.7. Toan chuyển hóa & Natri Bicarbonat
- **Cơ sở guideline:** KDIGO 2024 PP 3.10.1 (ngưỡng khởi trị < 18 mmol/L), BYT 2024 Mục 3.2 (trang 32: bù natri bicarbonate khi HCO3⁻ < 18, đích > 22 mmol/L; trang 61: liều uống 2–4 g/ngày).
- **Đánh giá logic:**
  - Ngưỡng 18 mmol/L và liều uống 1–2 g x 2–3 lần/ngày trong `sodium_bicarbonate.json` phản ánh chính xác các cập nhật từ thử nghiệm BiCARB và BYT 2024.
  - **Lỗi nhỏ (Finding CKD-R1-08):** Chưa kiểm tra bệnh nhân đã đang dùng natri bicarbonat hay chưa; nếu đã dùng mà HCO3⁻ vẫn < 18 thì cần hướng dẫn tăng liều (`UPTITRATE`) thay vì ghi `START`.

### 3.8. Chất gắn Kali (Potassium Binders)
- **Cơ sở guideline:** KDIGO 2024 PP 3.6.3 (dùng chất gắn kali để tiếp tục duy trì RASi), UKKA 2022 (ưu tiên SZC/Patiromer, hạn chế Resonium trong cấp cứu), BYT 2024 Mục 4.10 (Resonium 10–15 g x 2–3 lần/ngày trong tăng kali mạn).
- **Đánh giá logic:**
  - Phân nhánh thuốc theo profile VN (Resonium / Calcium Polystyrene Sulfonate) và INTL (Patiromer) rất thực tế với danh mục BHYT Việt Nam.
  - **Lỗi an toàn ngoại trú (Finding CKD-R1-06):** Quy tắc chỉ chạy khi K⁺ từ 5.1 đến 5.5 mmol/L. Khi K⁺ > 5.5 mmol/L ở ngoại trú, không có quy tắc nào hướng dẫn tạm ngừng thuốc hay xử trí.

### 3.9. Đánh giá Khuyến cáo NSAID
- **Vấn đề được đặt hàng kiểm tra:** "Mức độ khuyến cáo NSAID có bị phóng đại không?"
- **Kết luận của R1:** **CÓ, BỊ PHÓNG ĐẠI VÀ GÁN SAI TRÍCH DẪN (Finding CKD-R1-05).**
  - Trích dẫn `fig_48_referral_criteria` không liên quan đến NSAID.
  - Phân loại `STOP` với độ ưu tiên tuyệt đối 100 cho mọi ca CKD (kể cả bệnh nhân G1–G2 dùng 1 liều giảm đau cấp, không dùng kèm RASi hay lợi tiểu) là phóng đại quá mức. Cần phân định rõ: chống chỉ định mạnh/ngừng khẩn cấp khi eGFR < 30 hoặc phối hợp bộ ba "triple whammy" (RASi + Lợi tiểu + NSAID); cảnh báo thận trọng và ưu tiên thuốc thay thế không độc thận khi eGFR ≥ 30.

### 3.10. Xử trí Tăng Kali Máu Cấp Cứu Nội Viện
- **Cơ sở guideline:** UKKA 2022 Guidelines 16.1–16.6, 17.2, 18.1.
- **Đánh giá logic:**
  - Gói cấp cứu 5 bước trong `ckd.inpatient.hyperkalemia_severe` (Canxi gluconat 10% 30 mL, Insulin 10 IU trong Glucose 25 g, Salbutamol 10–20 mg khí dung, theo dõi glucose 6 giờ, SZC 10 g) thể hiện xuất sắc và bám sát từng câu chữ của UKKA 2022.

### 3.11. Chỉ định Lọc Máu Cấp Cứu
- **Cơ sở guideline:** KDIGO 2012 AKI, UKKA 2022 Guideline 18.1.
- **Kết luận của R1:** **PHÁT HIỆN LỖI CRITICAL (Finding CKD-R1-01).**
  - Ngưỡng kích hoạt lọc máu khẩn cấp bị cài nhầm ở HCO3⁻ < 18 mmol/L và K⁺ ≥ 6.5 mmol/L chưa phân loại. Đây là sai sót nguy hiểm cần sửa ngay lập tức.

### 3.12. Phân độ AKI trên nền CKD
- **Cơ sở guideline:** KDIGO 2012 AKI Table 2 (trang 11), BYT 2024 Mục 4.11.1 (trang 67).
- **Kết luận của R1:** **PHÁT HIỆN LỖI MAJOR (Finding CKD-R1-04).**
  - Phân độ Stage 3 bỏ qua yêu cầu tăng cấp tính ≥ 44.2 µmol/L khi nồng độ Creatinin chạm mốc 353.6 µmol/L.

---

## 4. Danh Sách Chi Tiết 12 Findings (Khớp File JSON)

Tệp JSON chi tiết đã được xuất tại: [`docs/reviews/ckd/round1_R1.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/ckd/round1_R1.json)

| ID | Mức độ | Loại mục | Mã định danh (`itemId`) | Nội dung tóm tắt phát hiện |
|---|:---:|:---:|---|---|
| **CKD-R1-01** | 🔴 Critical | rule | `ckd.inpatient.emergency_dialysis_indication` | Chỉ định lọc máu cấp cứu kích hoạt sai lầm trên toan chuyển hóa nhẹ–vừa (HCO3⁻ < 18) và tăng K⁺ chưa triệt để nội khoa. |
| **CKD-R1-02** | 🔴 Critical | rule | `ckd.outpatient.rasi_initiate` | Cổng an toàn SBP lấy nhầm đích 120 mmHg khiến BN có HA bình thường (100–119) bị hoãn dùng RASi bảo vệ thận. |
| **CKD-R1-03** | 🟠 Major | missing | `ckd.outpatient.statin_indication` | Bỏ sót khuyến cáo Class 1B của KDIGO 2024 về Statin cho BN CKD từ 50 tuổi trở lên có eGFR ≥ 60 (giai đoạn G1–G2). |
| **CKD-R1-04** | 🟠 Major | rule | `ckd.inpatient.aki_staging` | Phân độ AKI Stage 3 sai tiêu chuẩn KDIGO khi tự động xếp Stage 3 cho Creatinin ≥ 353.6 mà không kiểm tra tăng cấp tính ≥ 44.2 µmol/L. |
| **CKD-R1-05** | 🟠 Major | citation | `ckd.outpatient.avoid_nsaids` | Gán trích dẫn sai lệch (`fig_48_referral_criteria`) và phóng đại mức độ khuyến cáo cấm NSAID thành chống chỉ định tuyệt đối cho mọi giai đoạn CKD. |
| **CKD-R1-06** | 🟠 Major | missing | `ckd.outpatient.chronic_hyperkalemia_binders` | Thiếu hoàn toàn quy tắc cảnh báo và tạm ngừng thuốc (HOLD) ngoại trú khi BN đang dùng RASi/Finerenone có K⁺ > 5.5 mmol/L. |
| **CKD-R1-07** | 🟠 Major | missing | `ckd.outpatient.finerenone_uptitrate` | Bỏ sót quy tắc chuẩn độ Finerenone lên 20 mg/ngày; lấy nhầm ngưỡng chuẩn độ finerenone sang quy tắc tăng liều RASi. |
| **CKD-R1-08** | 🟡 Minor | rule | `ckd.outpatient.metabolic_acidosis` | Luôn phát sinh hành động START natri bicarbonat ngay cả khi bệnh nhân đã đang sử dụng thuốc này. |
| **CKD-R1-09** | 🟡 Minor | rule | `ckd.outpatient.chronic_hyperkalemia_binders` | Thiếu thuộc tính `profileDiff` trong recommendation và hardcode giá trị cổng an toàn 5.0. |
| **CKD-R1-10** | 🟡 Minor | rule | `ckd.inpatient.contrast_aki_prevention` | Sử dụng phép nhân số học trên threshold (`th * 2`) và hardcode số literal 60 trong cổng an toàn. |
| **CKD-R1-11** | 🟡 Minor | rule | `ckd.outpatient.nephrology_referral` | Chưa khai thác ngưỡng chuyển tuyến KFRE 5 năm mức tối thiểu 3% được định nghĩa trong KDIGO Practice Point 2.2.1. |
| **CKD-R1-12** | 🔵 Suggestion | ui | `ckd.outpatient.sglt2i_initiate` | Rationale mặc định ghi 'Khuyến cáo nhóm 1A' cho mọi trường hợp, chưa phân biệt phân nhóm eGFR 20–45 kèm UACR < 20 mg/mmol (mức 2B). |

---

## 5. Hướng Dẫn Sửa Lỗi Cho Tác Giả Module (Module Owner) Cho Vòng 2

1. **Khắc phục lỗi Critical CKD-R1-01:**  
   - Thêm threshold mới vào `kb/thresholds/ckd.json`:
     - `ckd.dialysis.hco3_emergency_max`: `10` mmol/L, trích dẫn KDIGO 2012 AKI Section 5.
     - `ckd.dialysis.k_emergency_refractory`: `7.0` mmol/L, trích dẫn UKKA 2022 Guideline 18.1.
   - Sửa `rules.inpatient.ts`: Chỉ kích hoạt `rec_ckd_emergency_rrt` khi `hco3 < 10` hoặc `k >= 7.0` hoặc vô niệu kéo dài ≥ 12h.
2. **Khắc phục lỗi Critical CKD-R1-02:**  
   - Thêm threshold mới: `ckd.rasi.sbp_initiate_min`: `100` mmHg, trích dẫn KDIGO 2024 Practice Point 3.6.5.
   - Sửa `rules.outpatient.ts`: Cổng an toàn `passedSbp` kiểm tra `sbp >= th('ckd.rasi.sbp_initiate_min')`.
3. **Khắc phục lỗi Major CKD-R1-03:**  
   - Trong `ckd.outpatient.statin_indication`: Đổi điều kiện thành `age >= 50` kèm chẩn đoán CKD bất kể eGFR. Cập nhật rationale hiển thị mức 1A (nếu eGFR < 60) hoặc 1B (nếu eGFR ≥ 60).
4. **Khắc phục lỗi Major CKD-R1-04:**  
   - Thêm thresholds: `ckd.aki.stage3_scr_abs = 353.6` và `ckd.aki.stage3_scr_rise = 44.2`.
   - Trong `ckd.inpatient.aki_staging`: Kiểm tra `(ratio >= 3.0 || (currentScr >= 353.6 && currentScr - baselineScr >= 44.2) || urineRate === 'anuria_12h')`.
5. **Khắc phục lỗi Major CKD-R1-05:**  
   - Thêm trích dẫn KDIGO 2024 Table 31 (trang 132) cho NSAID. Cập nhật mức độ cảnh báo phù hợp với từng giai đoạn chức năng thận.
6. **Khắc phục lỗi Major CKD-R1-06 & CKD-R1-07:**  
   - Thêm quy tắc `ckd.outpatient.hyperkalemia_hold_rasi_mra` cho K⁺ > 5.5 ngoại trú.
   - Thêm quy tắc `ckd.outpatient.finerenone_uptitrate` cho Finerenone khi K⁺ ≤ 4.8. Gỡ ngưỡng finerenone khỏi quy tắc chuẩn độ RASi.

---
*Báo cáo được hoàn thành bởi Reviewer R1 độc lập theo Quy trình Kiểm duyệt GDMT-VN.*
