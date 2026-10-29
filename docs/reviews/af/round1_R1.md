# Báo Cáo Thẩm Định Chuyên Khoa Nhịp Học & Guideline (Round 1 – R1)
## Module Rung Nhĩ (`af`) – Hệ Thống Khuyến Cáo Lâm Sàng GDMT-VN

- **Reviewer:** R1 – Chuyên gia Nhịp học / Guideline Checker
- **Ngày thẩm định:** 27/10/2026
- **Vòng đánh giá:** Vòng 1 (Round 1)
- **Tài liệu đối chiếu gốc (mở trực tiếp từ kho `Medical_Library_2026`):**
  1. **ESC 2024 Guidelines for the management of atrial fibrillation (AF-CARE)** (`01_Noi_Khoa/Tim_Mach/ESC_Guidelines/ESC_2024_atrial_fibrillation.pdf`)
  2. **2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation** (`01_Noi_Khoa/Tim_Mach/ACC_AHA_2023_Atrial_Fibrillation_Guideline.pdf`)
  3. **Khuyến cáo Hội Tim mạch học Việt Nam / Phân hội Nhịp tim Việt Nam 2022 (VNHA/VNHRS)**
  4. **Nhãn thuốc chính thức US FDA & EMA SmPC:**
     - Apixaban (Eliquis) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_apixaban.pdf`)
     - Rivaroxaban (Xarelto) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_rivaroxaban.pdf`)
     - Dabigatran (Pradaxa) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_dabigatran.pdf`)
     - Edoxaban (Savaysa / Lixiana) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_edoxaban.pdf`)
     - Warfarin (Coumadin) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_warfarin.pdf`)
     - Amiodarone (Cordarone) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_amiodarone.pdf`)
     - Diltiazem (Cardizem) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_diltiazem.pdf`)
     - Digoxin (Lanoxin) FDA Label (`09_Nhan_Thuoc/FDA/FDA_label_digoxin.pdf`)

---

## 1. Kết Luận Chung & Bảng Thống Kê Phát Hiện

### Kết luận thẩm định: **FAIL** (Không đạt chuẩn thông qua Vòng 1)

> **Căn cứ theo [REVIEW_PROTOCOL.md](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/REVIEW_PROTOCOL.md):**  
> Điều kiện để PASS vòng review chuyên khoa là **0 lỗi CRITICAL và 0 lỗi MAJOR**.  
> Module Rung nhĩ (`af`) hiện tồn tại **3 lỗi CRITICAL** (có nguy cơ trực tiếp gây tử vong/tàn phế cho người bệnh do chỉ định Diltiazem IV mù khi chưa rõ LVEF, bỏ sót lệnh dừng khẩn cấp Flecainide ở bệnh nhân CAD/HFrEF, và cấm dùng thuốc chống đông ở bệnh nhân rung nhĩ có bệnh cơ tim phì đại) cùng **7 lỗi MAJOR** (ngắt sớm quy tắc kiểm soát tần số tim ở HFrEF bỏ rơi bệnh nhân không có thuốc, vô hiệu hóa hoàn toàn profile US, khẳng định sai lệch về nhãn FDA cho apixaban ở ESRD/lọc máu, 2 lỗi trích dẫn giả mạo/sai lệch, bỏ sót khuyến cáo Class I chuyển đổi Warfarin sang DOAC khi TTR < 70%, và bỏ sót cảnh báo Hộp đen Edoxaban khi CrCl > 95 mL/min trong ma trận).

### Bảng phân bố phát hiện (Findings Breakdown)

| Mức độ nghiêm trọng (Severity) | Số lượng | Tỷ lệ (%) | Ý nghĩa lâm sàng |
|---|:---:|:---:|---|
| 🔴 **CRITICAL** | **3** | 23.1% | Có nguy cơ trực tiếp gây tử vong, sốc tim hoặc đột quỵ tàn phế nếu làm theo |
| 🟠 **MAJOR** | **7** | 53.8% | Sai lệch nội dung guideline/FDA, bỏ sót khuyến cáo Class I, trích dẫn giả mạo |
| 🟡 **MINOR** | **2** | 15.4% | Hardcode số literal trong gate, mô tả liều gộp uống/tĩnh mạch gây rối mắt UI |
| 🔵 **SUGGESTION** | **1** | 7.7% | Đề xuất bổ sung chỉ định Siêu âm tim qua thành ngực (TTE) Class I mới phát hiện |
| **TỔNG CỘNG** | **13** | **100%** | |

---

## 2. TOP 5 Vấn Đề Lâm Sàng Trọng Tâm Cần Xử Lý Ngay

1. **🔴 [CRITICAL] Cấp cứu RVR tự động chỉ định Diltiazem IV khi chưa có LVEF (`lvef === undefined`): Nguy cơ tụt huyết áp, sốc tim và ngưng tim nếu bệnh nhân có HFrEF tiềm ẩn (Vi phạm QA-1 Fail-Closed):**  
   Tại quy tắc nội viện `af.inpatient.rvr_acute_rate_control` (L793–830), code kiểm tra `const isHfRef = ef !== undefined && ef <= th('af.rate.lvef_cutoff');`. Khi bệnh nhân vào cấp cứu vì rung nhĩ đáp ứng thất nhanh mà chưa kịp làm siêu âm tim (`ef === undefined`), biến `isHfRef` đánh giá thành `false`. Logic rơi tự do xuống nhánh mặc định: **Khởi trị Diltiazem IV 0.25 mg/kg bolus**. Nếu bệnh nhân này bị suy tim HFrEF tiềm ẩn (ví dụ LVEF 25%) hoặc suy tim mất bù, việc tiêm bolus thuốc chẹn kênh canxi Non-DHP (ức chế co bóp cơ tim âm tính mạnh) có thể lập tức gây trụy tim mạch, sốc tim và ngưng tim! ESC 2024 (Table 14 & tr. 40) và ACC/AHA 2023 (Section 7.1) nhấn mạnh: Non-DHP CCB chống chỉ định tuyệt đối khi có suy tim mất bù hoặc LVEF giảm; khi chưa rõ LVEF, chỉ có chẹn beta hoặc amiodarone/digoxin tĩnh mạch kèm theo dõi huyết động sát mới là giải pháp an toàn.

2. **🔴 [CRITICAL] Bỏ sót hoàn toàn lệnh STOP thuốc chống loạn nhịp nhóm IC (Flecainide, Propafenone) khi người bệnh có Bệnh mạch vành (CAD) hoặc Suy tim (HFrEF):**  
   Tại quy tắc `af.rhythm.aad_selection` (L598–675), khi bệnh nhân rung nhĩ có HFrEF (`ef <= 40`) hoặc CAD (`vascularDisease: true`), hệ thống chỉ sinh khuyến cáo `CONSIDER` Amiodarone hoặc Dronedarone. Hệ thống **hoàn toàn không kiểm tra và không ra lệnh STOP** nếu bệnh nhân đang dùng Flecainide hoặc Propafenone. Theo thử nghiệm kinh điển CAST (Cardiac Arrhythmia Suppression Trial) và ESC 2024 Rec Table 18 (PDF p. 45), Flecainide và Propafenone làm tăng gấp đôi tỷ lệ tử vong do loạn nhịp thất chết người (xoắn đỉnh, rung thất, đột tử) ở bệnh nhân có tổn thương cơ tim thiếu máu hoặc suy tim giảm EF. Người bệnh đang uống Flecainide nhập viện nếu không bị chặn dừng sẽ tiếp tục uống thuốc và đối mặt với nguy cơ đột tử.

3. **🔴 [CRITICAL] Bỏ sót Khuyến cáo Class I (Level B) của ESC 2024: Bắt buộc chỉ định chống đông ở bệnh nhân Rung nhĩ có Bệnh cơ tim phì đại (HCM) hoặc Bệnh thoái hóa dạng bột tim (Cardiac Amyloidosis) BẤT KỂ ĐIỂM CHA₂DS₂-VA; hệ thống thậm chí còn ra lệnh cấm dùng (AVOID) nếu điểm bằng 0:**  
   ESC 2024 Recommendation Table 6 (PDF p. 29 & tr. 3342): *"Oral anticoagulation is recommended in all patients with AF and hypertrophic cardiomyopathy or cardiac amyloidosis, regardless of CHA2DS2-VA score, to prevent ischaemic stroke and thromboembolism. (Class I, Level B)"*. Module `af` hiện không có trường dữ liệu HCM/Amyloidosis. Bệnh nhân trẻ tuổi (ví dụ 40 tuổi) mắc HCM có rung nhĩ kịch phát sẽ có điểm CHA₂DS₂-VA = 0, và quy tắc `af.oac.risk_stratification` (L335) sẽ phát lệnh `AVOID` ("Không chỉ định thuốc chống đông hoặc kháng tiểu cầu")! Lệnh AVOID này tước đoạt chỉ định chống đông sống còn Class I, đẩy bệnh nhân HCM (vốn có nguy cơ huyết khối buồng nhĩ cực cao do rối loạn đổ đầy thất và giãn nhĩ) vào thảm họa đột quỵ nhồi máu não diện rộng.

4. **🟠 [MAJOR] Ngắt sớm quy tắc kiểm soát tần số ở HFrEF khi phát hiện Non-DHP CCB, khiến bệnh nhân bị dừng Diltiazem nhưng KHÔNG ĐƯỢC CHỈ ĐỊNH thuốc thay thế (Chẹn beta / Digoxin):**  
   Tại quy tắc `af.rate.reduced_lvef` (L536–588), khi phát hiện bệnh nhân HFrEF đang dùng Diltiazem/Verapamil, nhánh `if (onNonDhp)` thực hiện `return rec_af_contra_non_dhp_hfref;` (lệnh STOP). Lệnh `return` này khiến rule kết thúc ngay lập tức, triệt tiêu hoàn toàn khuyến cáo `rec_af_rate_reduced_ef_bb` (L564) phía sau. Bệnh nhân bị dừng Diltiazem nhưng bác sĩ không hề nhận được khuyến cáo bắt đầu dùng Chẹn beta suy tim (Bisoprolol/Carvedilol/Metoprolol succinate) hoặc Digoxin. Bệnh nhân bị bỏ rơi trong tình trạng nhịp thất nhanh không có thuốc hạ nhịp. Nếu bệnh nhân đang dùng kết hợp Diltiazem + Bisoprolol, khuyến cáo duy trì Bisoprolol cũng bị xóa sổ!

5. **🟠 [MAJOR] Tuyên bố hỗ trợ profile US (ACC/AHA 2023 CHA₂DS₂-VASc) nhưng code hoàn toàn hardcode CHA₂DS₂-VA của ESC 2024, biến ctx.settings.profile thành vô nghĩa:**  
   Trong tài liệu `docs/modules/AF.md` và comment code tuyên bố module hỗ trợ cả `INTL`, `VN` và `US`. Hàm `computeCha2ds2va` cũng đã tính sẵn cả `scoreVa` và `scoreVasc`. Tuy nhiên, trong `src/modules/af/rules.ts`, biến `ctx.settings` hoặc `ctx.settings.profile` có số lần xuất hiện là **0**. Logic chỉ định chống đông (L213–297) chỉ đọc `scoreVa` và so sánh với threshold `af.cha2ds2va.high_risk`. Khi người dùng chuyển sang profile US, hệ thống vẫn áp dụng thang điểm Châu Âu CHA₂DS₂-VA, hiển thị toàn bộ Titles và Gates ghi cứng "CHA₂DS₂-VA". Bệnh nhân nữ có 1 yếu tố nguy cơ (CHA₂DS₂-VASc = 2 điểm, chỉ định Class 2a trong ACC/AHA 2023) bị đánh giá sai lệch trên giao diện US.

---

## 3. Đối Chiếu Chi Tiết Từng Trụ Cột Lâm Sàng AF-CARE

### 3.1. AF-CARE [C]: Quản Lý Bệnh Đồng Mắc & Lối Sống
- **Cơ sở guideline:** ESC 2024 Rec Table 5 (tr. 26 & 3339: Khuyến cáo quản lý THA đích < 130/80 mmHg, giảm cân ≥ 10% nếu BMI ≥ 27 kg/m², điều trị ĐTĐ bằng thuốc bảo vệ tim-thận, hạn chế rượu < 3 đơn vị/tuần, CPAP nếu có ngưng thở khi ngủ OSA).
- **Đánh giá logic:**
  - Quy tắc `af.care.comorbidities` phát hiện tốt các bệnh đồng mắc (htn, dm, hf, ckd) và đưa ra các định hướng thay đổi lối sống toàn diện.
  - **Điểm thiếu sót Class I (Finding AF-R1-13 - Suggestion):** ESC 2024 Rec Table 3 (PDF p. 15, tr. 3328) quy định rõ: *"A transthoracic echocardiogram is recommended in patients with an AF diagnosis where this will guide treatment decisions. (Class I, Level C)"*. Khi bệnh nhân có `afType === 'first_diagnosed'`, quy tắc nên sinh khuyến cáo chỉ định Siêu âm tim qua thành ngực (TTE) thường quy.

### 3.2. AF-CARE [A]: Dự Phòng Đột Quỵ Bằng Thuốc Chống Đông (OAC)
- **Cơ sở guideline:** ESC 2024 Section 6.1 & 6.2, Rec Table 6 & 7; ACC/AHA 2023 Section 6.1 & 6.3; Bảng giảm liều DOAC Table 11.
- **Đánh giá logic:**
  - **Van cơ học & Hẹp hai lá vừa–nặng (Finding AF-R1-09):** Quy tắc `af.oac.mechanical_mitral_vka` hoạt động xuất sắc, chặn tuyệt đối DOAC và chỉ định bắt buộc Warfarin duy trì INR 2.0–3.0 hoặc 2.5–3.5 theo đúng thử nghiệm RE-ALIGN và INVICTUS.
  - **Chống chỉ định Kháng tiểu cầu đơn độc:** Quy tắc `af.oac.antiplatelet_contra` cảnh báo chuẩn xác khuyến cáo Class III (Mức A) của ESC 2024 / ACC 2023 khi bệnh nhân rung nhĩ chỉ dùng Aspirin hoặc Clopidogrel đơn thuần.
  - **Lỗi Bỏ sót Class I Bệnh cơ tim phì đại / Amyloidosis (Finding AF-R1-03 - Critical):** Đã phân tích tại Mục 2. Bệnh nhân có HCM/Amyloidosis bắt buộc dùng OAC bất kể điểm CHA₂DS₂-VA.
  - **Lỗi Profile US (Finding AF-R1-05 - Major):** Code không sử dụng `ctx.settings.profile`, khiến profile US bị tê liệt.
  - **Lỗi Chống chỉ định DOAC ở CrCl < 15 / Lọc máu (Finding AF-R1-06 - Major):** Code ghi chung chung "Class III (ESC 2024 / FDA)", trong khi nhãn FDA và ACC/AHA 2023 (Rec 3, Class 2b) chính thức cho phép Apixaban ở bệnh nhân lọc máu chu kỳ. Cần phân định bằng `profileDiff`.
  - **Lỗi Bỏ sót Class I chuyển đổi Warfarin sang DOAC (Finding AF-R1-09 - Major):** Khi bệnh nhân đang dùng Warfarin không đạt TTR ≥ 70%, ESC 2024 (Rec Table 7) khuyến cáo Class I, Level B phải chuyển sang DOAC. Code hiện tại gặp `warfarin` là `return null` ngay lập tức.
  - **Tiêu chuẩn giảm liều DOAC:** Hàm `computeDoacDose` tính toán rất chính xác tiêu chuẩn 2/3 của Apixaban (tuổi ≥ 80, cân nặng ≤ 60kg, Cr ≥ 133 µmol/L), dải CrCl 15–49 của Rivaroxaban, CrCl 15–50 của Edoxaban, và chống chỉ định Dabigatran khi CrCl < 30 mL/min.
  - **Lỗi Cảnh báo Hộp đen Edoxaban (Finding AF-R1-10 - Major):** Ma trận `afMatrixDoacCrCl` để ô CrCl ≥ 50 của Edoxaban ở trạng thái `rec` mà không có cảnh báo CrCl > 95 mL/min (Black Box Warning FDA / ESC 2024).

### 3.3. AF-CARE [R]: Kiểm Soát Tần Số Tim (Rate Control)
- **Cơ sở guideline:** ESC 2024 Section 7.1, Rec Table 14; ACC/AHA 2023 Section 7.1.
- **Đánh giá logic:**
  - **Phân tầng theo LVEF:** Ngưỡng 40% được chọn chính xác. LVEF > 40% cho phép Chẹn beta hoặc Non-DHP CCB (Diltiazem, Verapamil). LVEF ≤ 40% bắt buộc dùng Chẹn beta suy tim và/hoặc Digoxin, cấm Non-DHP CCB.
  - **Lỗi ngắt sớm quy tắc HFrEF (Finding AF-R1-04 - Major):** Đã phân tích tại Mục 2. Nhánh `if (onNonDhp) return STOP;` làm triệt tiêu khuyến cáo khởi trị hoặc duy trì Chẹn beta suy tim / Digoxin.
  - **Đích kiểm soát tần số:** Ngưỡng nhịp lỏng ban đầu `af.rate.lenient_hr_target = 110` bpm phản ánh chuẩn xác thử nghiệm RACE II và ESC 2024 Rec Table 14.

### 3.4. AF-CARE [R]: Kiểm Soát Nhịp (Rhythm Control) & Thuốc Chống Loạn Nhịp (AAD)
- **Cơ sở guideline:** ESC 2024 Section 7.2, Rec Table 18 & 19; ACC/AHA 2023 Section 7.2.
- **Đánh giá logic:**
  - **Lỗi bỏ sót lệnh STOP thuốc nhóm IC (Finding AF-R1-02 - Critical):** Đã phân tích tại Mục 2. Không ra lệnh dừng khẩn cấp Flecainide/Propafenone khi có CAD hoặc HFrEF (vi phạm an toàn CAST trial).
  - **Triệt đốt rung nhĩ qua ống thông (Catheter Ablation):** Quy tắc `af.rhythm.catheter_ablation` tích hợp xuất sắc khuyến cáo Class I cho HFrEF nghi ngờ bệnh cơ tim do nhịp nhanh (thử nghiệm CASTLE-AF) và khuyến cáo Class I hàng đầu cho rung nhĩ kịch phát có triệu chứng.

### 3.5. Bối Cảnh Cấp Cứu Nội Viện & Chuyển Nhịp Quanh Mốc 24 Giờ
- **Cơ sở guideline:** ESC 2024 Section 7.2, Rec Table 15 & 16; Figure 12.
- **Đánh giá logic:**
  - **Lỗi chỉ định Diltiazem IV khi chưa rõ LVEF (Finding AF-R1-01 - Critical):** Đã phân tích tại Mục 2. Nguy cơ sốc tim khi bệnh nhân suy tim tiềm ẩn bị tiêm bolus Diltiazem IV.
  - **Sốc điện cấp cứu khi mất ổn định huyết động:** Quy tắc `af.inpatient.unstable_cardioversion` kích hoạt chuẩn xác khuyến cáo Class I (Level C) khi huyết động không ổn định hoặc SBP < 90 mmHg.
  - **Mốc thời gian 24 giờ quanh chuyển nhịp:** Module đã cập nhật rất tiến bộ mốc **24 giờ** của ESC 2024 (thay cho mốc 48 giờ trước đây): Khởi phát < 24 giờ cho phép dùng liều chống đông đầu tiên và chuyển nhịp sớm; khởi phát ≥ 24 giờ bắt buộc TEE loại trừ huyết khối hoặc dùng chống đông đủ ≥ 3 tuần.
  - **Lỗi Hardcode Literal Gates (Finding AF-R1-11 - Minor):** Hardcode số 12 và 48 vào gate.
  - **Lỗi Chuỗi Liều Dược Thư (Finding AF-R1-12 - Minor):** Chuỗi liều của Amiodarone và Diltiazem trộn lẫn phác đồ uống 4 tuần với phác đồ cấp cứu tiêm tĩnh mạch.

### 3.6. AF-CARE [E]: Đánh Giá Lại Định Kỳ & Theo Dõi Thận Động
- **Cơ sở guideline:** ESC 2024 Section 6.1 & 6.2; Công thức vàng tính khoảng cách kiểm tra thận: $T \text{ (tháng)} = \text{CrCl} / 10$.
- **Đánh giá logic:**
  - Quy tắc `af.care.evaluation_followup` triển khai xuất sắc công thức tính khoảng cách xét nghiệm chức năng thận định kỳ theo độ thanh thải CrCl chia 10 (tối thiểu 3 tháng, tối đa 12 tháng), giúp bác sĩ phát hiện kịp thời suy giảm chức năng thận để chỉnh liều DOAC.

---

## 4. Thẩm Định Hồ Sơ Dược Thư (`kb/drugs/`) & Trích Dẫn (`kb/citations/`)

### 4.1. 12 Hồ sơ Dược thư sở hữu bởi Agent J
- `apixaban.json`: Đầy đủ liều 5mg, 2.5mg, dải thận, tương tác CYP3A4/P-gp. Cần bổ sung ghi chú nhãn US FDA về lọc máu chu kỳ.
- `rivaroxaban.json`: Rất tốt; nhấn mạnh uống cùng bữa ăn tối để đạt sinh khả dụng tối đa.
- `dabigatran.json`: Rất tốt; chống chỉ định CrCl < 30 mL/min, giảm liều khi kèm Verapamil, cấm mở viên nang.
- `edoxaban.json`: Đầy đủ liều 60mg, 30mg; cần đưa cảnh báo CrCl > 95 mL/min lên Gate chính của thuốc.
- `warfarin.json`: Chuẩn mực; khoảng INR 2.0–3.0 và 2.5–3.5 cho van cơ học hai lá.
- `amiodarone.json`: Cần tách riêng liều cấp cứu TM và liều nạp/duy trì đường uống.
- `dronedarone.json`: Chống chỉ định HFrEF chuẩn xác; chú ý tương tác tăng nồng độ Dabigatran/Edoxaban.
- `flecainide.json` & `propafenone.json`: Có gate chống chỉ định CAD, nhưng trong `rules.ts` thiếu logic sinh lệnh STOP khi bệnh nhân đang dùng thuốc.
- `sotalol.json`: Rất tốt; cảnh báo theo dõi khoảng QT và thanh thải thận.
- `diltiazem.json` & `verapamil.json`: Có gate LVEF ≤ 40% chuẩn xác. Cần tách chuỗi liều IV cấp cứu trong `diltiazem.json`.

### 4.2. Kiểm định trích dẫn nguyên văn (Citations Audit)
- **Lỗi Trích dẫn giả mạo `esc.af.2024.cha2ds2va_score_0` (Finding AF-R1-07 - Major):** Dẫn chiếu Hình 12 về chuyển nhịp để chứng minh cho việc không dùng chống đông ở CHA₂DS₂-VA = 0 ngoại trú. Phải sửa lại nguồn Recommendation Table 6.
- **Lỗi Trích dẫn sai nội dung `esc.af.2024.non_dhp_ccb_contra_lvef40` (Finding AF-R1-08 - Major):** Dẫn chiếu liều dùng thông thường của Diltiazem và ghi Class I để chứng minh cho lệnh cấm dùng Class III. Phải sửa trích dẫn bảng Calcium channel antagonists trang 40.
- Các trích dẫn còn lại (`cha2ds2va_rec_class1`, `vka_only_mechanical_mitral`, `table11_doac_dosing`, `rate_control_lvef_preserved`, `emergency_electrical_cardioversion`, `cardioversion_anticoag_3weeks`, `catheter_ablation_hfref`) đều được đối chiếu trực tiếp qua công cụ `kb:search` và khớp 100% với file PDF gốc trong thư viện `Medical_Library_2026`.

---

## 5. Bảng Tổng Hợp 13 Phát Hiện Thẩm Định (Review Findings)

| ID | Mức độ | Hạng mục | Item ID | Phát hiện lâm sàng tóm tắt | Đề xuất giải pháp (Suggested Fix) |
|---|:---:|:---:|---|---|---|
| **AF-R1-01** | 🔴 **CRITICAL** | `rule` | `af.inpatient.rvr_acute_rate_control` | Tự động chỉ định Diltiazem IV khi chưa có LVEF (`ef === undefined`), nguy cơ sốc tim nếu HFrEF tiềm ẩn. | Khi `ef === undefined`, tuyệt đối KHÔNG chỉ định Non-DHP CCB IV; yêu cầu siêu âm tim khẩn và dùng thuốc an toàn. |
| **AF-R1-02** | 🔴 **CRITICAL** | `rule` | `af.rhythm.aad_selection` | Bỏ sót lệnh STOP Flecainide/Propafenone ở bệnh nhân CAD hoặc HFrEF (nguy cơ tử vong loạn nhịp thất CAST trial). | Kiểm tra `onIc`, sinh khuyến cáo action: 'STOP', priority: 100 đối với Flecainide/Propafenone khi có CAD hoặc LVEF ≤ 40%. |
| **AF-R1-03** | 🔴 **CRITICAL** | `missing` | `af.oac.risk_stratification` | Bỏ sót Class I ESC 2024: Phải dùng OAC ở bệnh nhân HCM hoặc Amyloidosis bất kể điểm CHA₂DS₂-VA; hiện phát lệnh AVOID nếu điểm = 0. | Thêm kiểm tra điều kiện HCM/Amyloidosis, phân tầng trực tiếp vào chỉ định OAC Class I ngay cả khi điểm bằng 0. |
| **AF-R1-04** | 🟠 **MAJOR** | `rule` | `af.rate.reduced_lvef` | Ngắt sớm khi phát hiện Non-DHP CCB khiến bệnh nhân bị dừng Diltiazem nhưng không được khuyến cáo Chẹn beta / Digoxin thay thế. | Tách lệnh STOP CCB thành rule riêng hoặc cho phép sinh đồng thời lệnh STOP CCB và START/CONTINUE Chẹn beta / Digoxin. |
| **AF-R1-05** | 🟠 **MAJOR** | `rule` | `af.oac.risk_stratification` | Tuyên bố hỗ trợ profile US nhưng code hoàn toàn hardcode CHA₂DS₂-VA của ESC, không kiểm tra `ctx.settings.profile`. | Kiểm tra `ctx.settings?.profile`, chuyển sang CHA₂DS₂-VASc và phân tầng ngưỡng Nam ≥ 2/Nữ ≥ 3 khi ở profile US. |
| **AF-R1-06** | 🟠 **MAJOR** | `rule` | `af.oac.risk_stratification` | Khẳng định sai lệch DOAC bị Class III theo FDA ở CrCl < 15 / lọc máu; bỏ sót nhãn FDA Apixaban và ACC 2023 Class 2b. | Bổ sung `profileDiff`: INTL/VN theo ESC cấm DOAC < 15; US theo ACC/FDA cho phép cân nhắc Apixaban ở lọc máu chu kỳ. |
| **AF-R1-07** | 🟠 **MAJOR** | `citation` | `esc.af.2024.cha2ds2va_score_0` | Gán trích dẫn giả mạo tại ngưỡng điểm 0: Dẫn chiếu Figure 12 (chống đông sau sốc điện) thay vì Rec Table 6 Class III. | Thay bằng trích dẫn chuẩn xác từ ESC 2024 Recommendation Table 6 (PDF p. 29) về điểm CHA₂DS₂-VA = 0. |
| **AF-R1-08** | 🟠 **MAJOR** | `citation` | `esc.af.2024.non_dhp_ccb_contra_lvef40` | Trích dẫn sai nội dung cấm Non-DHP CCB: Dẫn chiếu liều dùng thông thường và ghi Class I thay vì câu cấm Class III trang 40. | Sửa quote thành `"Contraindicated if LVEF ≤40%."`, sửa class thành 'III' từ Section 7.1 PDF trang 40. |
| **AF-R1-09** | 🟠 **MAJOR** | `missing` | `af.oac.risk_stratification` | Bỏ sót Class I ESC 2024: Khuyến cáo chuyển đổi từ Warfarin sang DOAC khi TTR < 70%. | Bổ sung kiểm tra TTR/INR không ổn định ở bệnh nhân dùng Warfarin không có van cơ học, sinh action: 'SWITCH' sang DOAC. |
| **AF-R1-10** | 🟠 **MAJOR** | `matrix` | `afMatrixDoacCrCl` | Bỏ sót Cảnh báo Hộp đen (Black Box Warning) của FDA và ESC 2024 cho Edoxaban khi CrCl > 95 mL/phút trong Ma trận DOAC. | Thêm ghi chú cảnh báo hộp đen tại ô CrCl ≥ 50 của Edoxaban hoặc tách riêng cột phân tầng CrCl > 95 mL/phút. |
| **AF-R1-11** | 🟡 **MINOR** | `rule` | `af.inpatient.cardioversion_anticoag_timing` | Hardcode các số literal giả định (12, 48, 0, 1) trong các cổng an toàn của rule chuyển nhịp tim, vi phạm QA-8. | Thiết kế lại Gate logic tường minh theo biến enum hoặc threshold chuẩn, loại bỏ hoàn toàn các số literal giả định. |
| **AF-R1-12** | 🟡 **MINOR** | `drug` | `amiodarone`, `diltiazem` | Chuỗi liều khởi đầu trộn lẫn phác đồ uống 4 tuần với phác đồ tiêm truyền cấp cứu tĩnh mạch, gây rối mắt trên UI cấp cứu. | Phân tách riêng `start.iv` cho cấp cứu nội viện và `start.oral` cho ngoại trú trong DrugEntry của Amiodarone và Diltiazem. |
| **AF-R1-13** | 🔵 **SUGGESTION** | `rule` | `af.care.comorbidities` | Đề xuất bổ sung chỉ định Siêu âm tim qua thành ngực (TTE) thường quy cho mọi ca rung nhĩ mới chẩn đoán (ESC 2024 Class I). | Khi `afType === 'first_diagnosed'`, sinh khuyến cáo action: 'CONSIDER' chỉ định TTE theo ESC Rec Table 3. |

---

## 6. Kiến Nghị Lộ Trình Sửa Đổi Cho Module Owner (Agent J)

Để module Rung nhĩ (`af`) đạt chuẩn an toàn y khoa và thông qua Vòng 2 của Hội đồng Thẩm định:

1. **Xử lý dứt điểm 3 lỗi CRITICAL trước tiên:**
   - Trong `af.inpatient.rvr_acute_rate_control`: Không bao giờ giả định LVEF bình thường khi `ef === undefined`. Cảnh báo hoãn thuốc ức chế cơ tim cho tới khi xác định LVEF.
   - Trong `af.rhythm.aad_selection`: Bổ sung kiểm tra `hasCurrentMed(ctx, ['flecainide', 'propafenone'])` khi có CAD hoặc HFrEF và phát ngay lệnh `STOP` khẩn cấp.
   - Trong `af.oac.risk_stratification`: Bổ sung điều kiện bệnh cơ tim phì đại / amyloidosis để chỉ định OAC nhóm 1B bất kể điểm số.
2. **Khắc phục 7 lỗi MAJOR:**
   - Sửa nhánh `onNonDhp` trong `af.rate.reduced_lvef` để không làm mất chỉ định Chẹn beta suy tim.
   - Tích hợp kiểm tra `ctx.settings?.profile` để chuyển đổi thang điểm sang CHA₂DS₂-VASc khi chạy profile US.
   - Bổ sung `profileDiff` chuẩn xác cho chỉ định DOAC ở CrCl < 15 / lọc máu (phân định ESC vs FDA).
   - Sửa 2 trích dẫn giả mạo/sai lệch (`cha2ds2va_score_0` và `non_dhp_ccb_contra_lvef40`).
   - Thêm quy tắc chuyển đổi Warfarin sang DOAC khi TTR < 70% (Class I).
   - Bổ sung cảnh báo Hộp đen Edoxaban CrCl > 95 mL/min trong ma trận và rules.
3. **Hoàn thiện các lỗi MINOR & SUGGESTION:**
   - Xóa các số literal dummy (12, 48) trong Gates.
   - Tách chuỗi liều tiêm tĩnh mạch cấp cứu của Amiodarone và Diltiazem.
   - Bổ sung chỉ định Siêu âm tim qua thành ngực (TTE) cho rung nhĩ mới phát hiện.
