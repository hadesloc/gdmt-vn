# BÁO CÁO PHẢN BIỆN AN TOÀN (ADVERSARIAL REVIEW – R3)
## MODULE HEN PHẾ QUẢN (`asthma`) – VÒNG 1
**Reviewer:** R3 – Phản biện an toàn & Thử nghiệm đối nghịch (Adversarial Reviewer)  
**Thời điểm thực hiện:** 2026-10-27  
**Quy trình áp dụng:** `docs/REVIEW_PROTOCOL.md`  
**Mã kiểm thử thực thi:** `docs/reviews/asthma/scratch/adversarial_runner.ts`  
**Dữ liệu bằng chứng:** `docs/reviews/asthma/scratch/adversarial_results.json` & `docs/reviews/asthma/round1_R3.json`

---

## 1. TỔNG QUAN KẾT QUẢ ĐÁNH GIÁ

| Chỉ số kiểm định | Số lượng | Ghi chú |
|---|:---:|---|
| **Tổng số ca bệnh đối nghịch đã chạy** | **52 ca** | Bao quát 9 nhóm kịch bản lâm sàng phức tạp và giá trị biên |
| **Số ca phát hiện vi phạm bất biến an toàn** | **13 ca** | Vi phạm an toàn nghiêm trọng trên lâm sàng |
| **Tổng số phát hiện (Findings)** | **18 lỗi** | 9 Critical · 5 Major · 3 Minor · 1 Suggestion |
| **Kết luận vòng 1** | **FAIL** | Cần sửa 9 lỗi Critical và 5 lỗi Major trước vòng 2 |

### Bảng phân bố phát hiện theo mức độ nghiêm trọng:
- 🔴 **Critical (9 lỗi):** Nguy hiểm tính mạng, bỏ sót thuốc hồi sức cấp cứu khi phổi im lặng/hôn mê, bỏ lọt LABA đơn độc, kê nhầm phác đồ người lớn cho trẻ em 11 tuổi, thủng fail-closed kiểm soát triệu chứng, lỗi đơn vị PEF làm sai lệch ranh giới cấp cứu, hướng dẫn dùng thuốc sai cơ học/quá liều trong Vùng Đỏ, và module HF gợi ý Carvedilol cho người bệnh hen.
- 🟠 **Major (5 lỗi):** Mâu thuẫn lâm sàng (vừa tiếp tục duy trì vừa hạ bậc), bỏ qua yếu tố nguy cơ đợt cấp và FEV₁ < 60%, thiếu trường SpO₂, thiếu luật trùng lặp nhóm LABA khi phối hợp Hen - COPD (ACO), và bỏ quên hoàn toàn tư vấn thai kỳ/thuốc lá.
- 🟡 **Minor (3 lỗi):** Thiếu phân biệt profile INTL vs VN vs US, sinh kế hoạch hành động ngoại trú trong ICU, ngưỡng tối thiểu 2 tháng hạ bậc là code chết.
- ⚪ **Suggestion (1 lỗi):** Nhãn trường PEF gây nhầm lẫn giữa % và L/phút.

---

## 2. TOP 5 LỖ HỔNG AN TOÀN NGUY HIỂM NHẤT (TOP 5 CRITICAL VULNERABILITIES)

### 1. Phổi im lặng (Silent Chest) & Rối loạn tri giác chỉ sinh REFER ICU mà BỎ RƠI toàn bộ thuốc hồi sức cấp cứu
- **Vị trí:** `src/modules/asthma/rules.ts` dòng 338–359 (`asthma.inpatient.severe_exacerbation`).
- **Nguyên nhân:** Lệnh `if (silentChest || drowsy) return { id: 'rec_asthma_acute_life_threatening_icu', action: 'REFER', ... }` làm thoát hàm sớm (early return), khiến toàn bộ gói thuốc cấp cứu `rec_asthma_acute_severe_bundle` (Salbutamol khí dung liên tục, Ipratropium, Corticoid tiêm tĩnh mạch, Oxy liệu pháp) không được sản sinh.
- **Hậu quả:** Một bệnh nhân đang ngừng thở sắp xảy ra tại khoa Cấp cứu chỉ nhận được một lời khuyên "Báo động ICU", trong khi không có bất kỳ y lệnh thuốc giãn phế quản hay corticoid nào được sinh ra trên bệnh án điện tử.

### 2. Lỗi trích xuất Key `need(ctx, 'customInputs.respiratoryRate')` hạ cấp Cơn hen nặng thành Cơn nhẹ - trung bình
- **Vị trí:** `src/modules/asthma/rules.ts` dòng 296, 411 và `src/engine/require.ts` dòng 72.
- **Nguyên nhân:** `rules.ts` gọi `need(ctx, 'customInputs.respiratoryRate')`. Tuy nhiên, UI `PatientForm.tsx` lưu key vào `customInputs` mà không có tiền tố (chỉ là `'respiratoryRate'`). Do đó `need()` luôn trả về `undefined`.
- **Hậu quả:** Bệnh nhân thở nhanh 31–38 lần/phút (tiêu chuẩn cơn hen nặng) không được nhận diện, bị rơi vào Rule 7 (Cơn hen nhẹ - trung bình) và chỉ được kê đơn Salbutamol xịt buồng đệm kèm Prednisolone uống tại nhà thay vì hồi sức cấp cứu tại viện.

### 3. Bỏ lọt hoàn toàn LABA đơn độc không kèm ICS (Salmeterol / Formoterol monotherapy)
- **Vị trí:** `src/modules/asthma/rules.ts` dòng 114–121 (`asthma.safety.saba_only_prohibited`).
- **Nguyên nhân:** Luật chỉ kiểm tra SABA (`salbutamol`, `terbutaline`). Hoàn toàn không kiểm tra các thuốc LABA (`salmeterol`, `formoterol`, `indacaterol`, `vilanterol`).
- **Hậu quả:** Bệnh nhân hen đang dùng LABA đơn độc (Salmeterol 50 mcg hoặc Foradil 12 mcg) không nhận được bất kỳ cảnh báo nào từ engine. Điều này vi phạm cảnh báo hộp đen (FDA Boxed Warning) và làm tăng gấp nhiều lần nguy cơ tử vong do hen (thử nghiệm SMART).

### 4. Thủng Fail-Closed: Trả lời 1 câu hỏi False biến bệnh nhân thành "Kiểm soát tốt"
- **Vị trí:** `src/modules/asthma/rules.ts` dòng 47–48 (`evaluateGinaControl`).
- **Nguyên nhân:** Hàm kiểm tra `if (positive === 0) return { level: 'well_controlled' }` mà không kiểm tra `answeredCount === 4`. Nếu người dùng chỉ trả lời 1 câu là False và bỏ trống 3 câu còn lại, hệ thống coi là 0 tiêu chí và kết luận bệnh nhân "Kiểm soát tốt".
- **Hậu quả:** Bỏ qua hoàn toàn dữ liệu lâm sàng thiếu hụt, tự động khởi trị Track 1 Bậc 1–2 (AIR-only, không thuốc duy trì) hoặc thậm chí kích hoạt hạ bậc thuốc trên bệnh nhân thực chất chưa được đánh giá đầy đủ.

### 5. Lỗi đổi đơn vị PEF % thành L/phút trong Kế hoạch hành động hen: Bệnh nhân tắc nghẽn nặng tưởng nhầm an toàn
- **Vị trí:** `src/modules/asthma/actionPlan.ts` dòng 22–27 (`generateAsthmaActionPlanVi`).
- **Nguyên nhân:** Lấy giá trị % của trường `customInputs.pefPct` (ví dụ 80%) gắn nhãn thành `80 L/phút` và nhân 0.8 để tính ngưỡng Vùng Xanh `> 64 L/phút` (chuẩn người lớn bình thường là 400–600 L/phút).
- **Hậu quả:** Khi bệnh nhân người lớn đo PEF tại nhà được 250 L/phút (đang tắc nghẽn phế quản nặng đe dọa tính mạng), đối chiếu với bản kế hoạch thấy 250 > 64 L/phút nên tưởng mình ở Vùng Xanh (An toàn), dẫn tới trì hoãn cấp cứu và tử vong tại nhà.

---

## 3. DANH SÁCH CHI TIẾT 18 PHÁT HIỆN KIỂM ĐỊNH

### 🔴 NHÓM CRITICAL (9 PHÁT HIỆN)

#### 1. `ASTHMA-R3-01`: Cơn hen nguy kịch có lồng ngực im lặng/rối loạn tri giác bị bỏ rơi toàn bộ thuốc cấp cứu
- **Hạng mục:** Rule (`asthma.inpatient.severe_exacerbation`)
- **Bằng chứng thực nghiệm:** Chạy ca `ADV-ACUTE-08` (`silentChest: true`, SpO₂ 84%, RR 36) và `ADV-ACUTE-09` (`mentalStatus: 'drowsy_confused'`):
  - **Output engine:** Duy nhất 1 khuyến cáo: `[REFER] rec_asthma_acute_life_threatening_icu`.
  - **Thiếu sót:** 0 Salbutamol, 0 Ipratropium, 0 Corticoid tiêm, 0 Oxy.
- **Y văn đối chiếu:** GINA 2026 Box 9-3, BYT QĐ 5850/QĐ-BYT (2021) Phụ lục 3.
- **Đề xuất khắc phục:** Bỏ lệnh `return` sớm. Xuất đồng thời `rec_asthma_acute_life_threatening_icu` VÀ `rec_asthma_acute_severe_bundle`.

#### 2. `ASTHMA-R3-02`: Lỗi trích xuất key `need()` làm tê liệt nhận diện nhịp thở nhanh > 30 lần/phút
- **Hạng mục:** Rule (`asthma.inpatient.severe_exacerbation` / `asthma.inpatient.mild_moderate_exacerbation`)
- **Bằng chứng thực nghiệm:** Ca `ADV-ACUTE-03` nhập `customInputs.respiratoryRate = 31`.
  - `rules.ts` gọi `need(ctx, 'customInputs.respiratoryRate')` -> trả về `undefined`.
  - **Output engine:** Kích hoạt `[START] rec_asthma_acute_mild_moderate` (Salbutamol xịt 4–10 nhát + Prednisolone uống).
  - Bệnh nhân cơn nặng bị xử trí như cơn nhẹ - trung bình.
- **Đề xuất khắc phục:** Sửa `rules.ts` thành `const rr = ctx.patient.customInputs?.respiratoryRate !== undefined ? Number(ctx.patient.customInputs.respiratoryRate) : undefined;` hoặc cập nhật `src/engine/require.ts`.

#### 3. `ASTHMA-R3-03`: Bỏ lọt hoàn toàn LABA đơn độc không kèm ICS (Salmeterol/Formoterol monotherapy)
- **Hạng mục:** Rule (`asthma.safety.saba_only_prohibited`)
- **Bằng chứng thực nghiệm:** Ca `ADV-MED-03` (`currentMeds: [{ drugId: 'salmeterol' }]`) và `ADV-MED-04` (`currentMeds: [{ drugId: 'formoterol' }]`):
  - **Output engine:** 0 cảnh báo, 0 lệnh STOP, kế hoạch hoàn toàn im lặng trước phác đồ chết người.
- **Y văn đối chiếu:** FDA Boxed Warning, GINA 2026 Ch. 3, BYT 1851/2020.
- **Đề xuất khắc phục:** Bổ sung luật cấm LABA đơn độc `asthma.safety.laba_only_prohibited`.

#### 4. `ASTHMA-R3-04`: Kế hoạch xuất viện nội viện (Rule 8) kê đơn MART người lớn cho trẻ em 11 tuổi
- **Hạng mục:** Rule (`asthma.inpatient.discharge_plan`)
- **Bằng chứng thực nghiệm:** Ca `ADV-AGE-02` (Bé 11 tuổi, nội viện, `acuteResponseAfter1h = 'good_response'`):
  - **Output engine:** `[START] Budesonide / Formoterol (Chuyển sang Track 1 MART)`.
  - Không có bất kỳ rào chắn tuổi nào tại Rule 8.
- **Y văn đối chiếu:** GINA 2026 Box 3-5 (Trẻ 6–11 tuổi có phác đồ riêng, không dùng Track 1 MART người lớn).
- **Đề xuất khắc phục:** Thêm kiểm tra `age < 12` chặn Rule 8.

#### 5. `ASTHMA-R3-05`: Thủng Fail-Closed trong đánh giá kiểm soát triệu chứng GINA 4 tuần
- **Hạng mục:** Rule (`evaluateGinaControl` / `asthma.outpatient.missing_control_data`)
- **Bằng chứng thực nghiệm:** Ca `ADV-CTRL-11` (chỉ trả lời Q1 = false, 3 câu còn lại undefined):
  - `evaluateGinaControl` trả về `well_controlled`.
  - **Output engine:** Kích hoạt `[START] rec_asthma_track1_step1_2`.
- **Y văn đối chiếu:** GINA 2026 Table 2A, BYT 1851 Bảng 3.
- **Đề xuất khắc phục:** Yêu cầu bắt buộc `answeredCount === 4`; nếu `< 4` trả về `missing` và kích hoạt `missingInputRec`.

#### 6. `ASTHMA-R3-06`: Lỗi đổi đơn vị PEF % thành L/phút trong Kế hoạch hành động hen
- **Hạng mục:** UI / Rule (`generateAsthmaActionPlanVi`)
- **Bằng chứng thực nghiệm:** Ca `ADV-PLAN-01` (`pefPct = 80`):
  - **Output văn bản kế hoạch:** `Lưu lượng đỉnh (PEF) cá nhân tốt nhất: 80 L/phút. Vùng màu xanh: > 64 L/phút (>80%)`.
- **Hậu quả:** Bệnh nhân hiểu sai hoàn toàn ngưỡng an toàn cá nhân, đe dọa tính mạng.
- **Đề xuất khắc phục:** Hiển thị rõ đơn vị % nếu là `pefPct`, không tự ý gắn `L/phút`.

#### 7. `ASTHMA-R3-07`: Hướng dẫn Vùng Đỏ Track 1 nguy hiểm và bất khả thi
- **Hạng mục:** Rule (`generateAsthmaActionPlanVi`)
- **Bằng chứng thực nghiệm:** Ca `ADV-PLAN-02`:
  - Văn bản: `Xịt ngay 4–6 nhát Budesonide/formoterol 160/4.5 mcg qua buồng đệm (hoặc khí dung nếu có máy)`.
  - DPI Turbuhaler không thể dùng trong máy khí dung. Xịt liền 6 nhát đưa vào 27 mcg formoterol gây quá liều cấp tính.
- **Y văn đối chiếu:** GINA 2026 Box 4-4, Box 9-2.
- **Đề xuất khắc phục:** Sửa thành: Hít 1–2 nhát Budesonide/formoterol hoặc Salbutamol 4–6 nhát qua buồng đệm, liên hệ cấp cứu 115.

#### 8. `ASTHMA-R3-08`: Module HF gợi ý Carvedilol cho bệnh nhân Hen phế quản
- **Hạng mục:** Rule (`src/modules/hf/rules.ts` dòng 382)
- **Bằng chứng thực nghiệm:** Ca `ADV-SPEC-04` (kết hợp `asthma` + `hf`):
  - **Output engine:** Khuyến cáo chẹn beta của HF mang tiêu đề `Bisoprolol (hoặc Carvedilol, Metoprolol succinate)`.
  - Carvedilol là chẹn beta không chọn lọc, chống chỉ định tuyệt đối trên bệnh nhân hen.
- **Đề xuất khắc phục:** Module HF phải loại bỏ Carvedilol khỏi tiêu đề và chỉ định Bisoprolol/Metoprolol khi bệnh nhân có hen.

#### 9. `ASTHMA-R3-09`: Lỗi trích xuất key `need()` làm tê liệt chỉ định thuốc sinh học đích Bậc 5
- **Hạng mục:** Rule (`asthma.outpatient.track1_step5_severe`)
- **Bằng chứng thực nghiệm:** Ca `ADV-BIO-03` (`bloodEosinophils = 300`) và `ADV-BIO-04` (`bloodEosinophils = 450`):
  - `rules.ts` gọi `need(ctx, 'customInputs.bloodEosinophils')` -> `undefined`.
  - **Output engine:** Chỉ sinh câu chung chung "Đánh giá kiểu hình viêm (đo BCAT máu, FeNO...)", hoàn toàn không gợi ý Benralizumab hay Dupilumab dù BCAT đã được nhập rất cao.
- **Đề xuất khắc phục:** Đọc trực tiếp `ctx.patient.customInputs?.bloodEosinophils ?? ctx.patient.eos`.

---

### 🟠 NHÓM MAJOR (5 PHÁT HIỆN)

#### 10. `ASTHMA-R3-10`: Mâu thuẫn lâm sàng: CONTINUE Duy trì Bậc 3 song song CONSIDER Xem xét hạ bậc
- **Hạng mục:** Rule (`asthma.outpatient.step_down_stable` & `asthma.outpatient.track1_step3`)
- **Bằng chứng thực nghiệm:** Ca `ADV-STEP-02` (Bậc 3 ổn định 3 tháng):
  - **Output engine:** Đồng thời xuất hiện `[CONTINUE] Duy trì Track 1 Bậc 3 MART (1 nhát x 2 lần/ngày)` VÀ `[CONSIDER] Xem xét hạ bậc giảm liều ICS 25–50%`.
- **Đề xuất khắc phục:** Chuyển action thành `REDUCE` hoặc cung cấp phác đồ hạ bậc cụ thể.

#### 11. `ASTHMA-R3-11`: Bỏ qua tiền sử đợt cấp (exacerbationsLastYear) và FEV₁ < 60% ở ngoại trú
- **Hạng mục:** Rule (`asthma.outpatient.track1_step1_2`)
- **Bằng chứng thực nghiệm:** Ca `ADV-EXAC-03` (2 đợt cấp nặng/năm, FEV₁ 59% nhưng triệu chứng 4 tuần qua 0/4):
  - **Output engine:** Kê đơn Track 1 Bậc 1–2 (AIR-only, không thuốc duy trì).
  - Để bệnh nhân nguy cơ đợt cấp rất cao không có thuốc ngừa cơn hàng ngày.
- **Đề xuất khắc phục:** Bắt buộc có thuốc duy trì (tối thiểu Bậc 3) nếu có tiền sử đợt cấp hoặc FEV₁ < 60%.

#### 12. `ASTHMA-R3-12`: Thiếu trường nhập SpO₂ trong Input Schema và bỏ lỡ cơn hen nặng do thiếu oxy
- **Hạng mục:** Missing / UI (`src/modules/asthma/inputs.ts`)
- **Bằng chứng thực nghiệm:** `inputs.ts` không hề khai báo trường `spo2`. Ca `ADV-ACUTE-06` có SpO₂ 89% bị bỏ qua và xếp vào cơn nhẹ - trung bình.
- **Đề xuất khắc phục:** Bổ sung `customInputs.spo2` vào schema `inputs.ts`.

#### 13. `ASTHMA-R3-13`: Thiếu luật kiểm tra trùng lặp nhóm thuốc giãn phế quản (LABA, LAMA) khi phối hợp Hen - COPD
- **Hạng mục:** Rule (`src/engine/safety/duplicates.ts`)
- **Bằng chứng thực nghiệm:** Ca `ADV-OVL-01` (Hen + COPD):
  - Module Hen kê đơn `budesonide_formoterol` (LABA formoterol).
  - Module COPD kê đơn `glycopyrronium_indacaterol` (LABA indacaterol).
  - Bệnh nhân nhận 2 thuốc LABA cùng lúc nhưng hệ thống an toàn không cảnh báo.
- **Đề xuất khắc phục:** Thêm `dup.laba` và `dup.lama` vào `DUPLICATE_CLASS_RULES`.

#### 14. `ASTHMA-R3-14`: Bỏ quên hoàn toàn tư vấn thai kỳ và cai thuốc lá trong toàn bộ rules.ts
- **Hạng mục:** Rule (`conditions.pregnancy` & `customInputs.smokingStatus`)
- **Bằng chứng thực nghiệm:** Ca `ADV-SPEC-01` (thai kỳ) và `ADV-SPEC-02` (hút thuốc lá):
  - `rules.ts` hoàn toàn không có bất kỳ dòng lệnh nào kiểm tra 2 trường này.
- **Đề xuất khắc phục:** Thêm luật tư vấn an toàn duy trì ICS trong thai kỳ và luật cai thuốc lá / nguy cơ kháng ICS.

---

### 🟡 NHÓM MINOR (3 PHÁT HIỆN)

#### 15. `ASTHMA-R3-15`: Thiếu hoàn toàn phân biệt Profile INTL vs VN vs US
- **Hạng mục:** Rule (`profiles` / `profileDiff`)
- **Bằng chứng:** Ca `ADV-OVL-02` và `ADV-OVL-03`: 100% khuyến cáo trả về giống nhau khi đổi giữa INTL, VN và US. Chưa phản ánh hạn chế BHYT của BYT 1851 hay thuật ngữ SMART của EPR-4 Hoa Kỳ.
- **Đề xuất khắc phục:** Khai báo `profileDiff` cụ thể cho từng profile.

#### 16. `ASTHMA-R3-16`: Kế hoạch hành động ngoại trú sinh không phù hợp trong bối cảnh hồi sức ICU
- **Hạng mục:** Rule (`asthma.action_plan.generate`)
- **Bằng chứng:** Ca `ADV-PLAN-03` đang nằm cấp cứu hồi sức trong ICU (setting: inpatient), engine vẫn xuất ra bản Kế hoạch hành động hen ngoại trú.
- **Đề xuất khắc phục:** Giới hạn Rule 17 cho `setting: 'outpatient'`.

#### 17. `ASTHMA-R3-17`: Ngưỡng `asthma.step_down.stability_months_min` (2 tháng) là code chết
- **Hạng mục:** Threshold (`kb/thresholds/asthma.json`)
- **Bằng chứng:** Ca `ADV-STEP-01` (ổn định 2 tháng) không kích hoạt hạ bậc vì Rule 11 chỉ so sánh với ngưỡng max 3 tháng. Ngưỡng min 2 tháng không bao giờ được dùng.
- **Đề xuất khắc phục:** Cho phép kích hoạt xem xét hạ bậc từ 2 tháng theo hướng dẫn GINA.

---

### ⚪ NHÓM SUGGESTION (1 PHÁT HIỆN)

#### 18. `ASTHMA-R3-18`: Nhãn trường PEF trong `inputs.ts` gây nhầm lẫn giữa % và L/phút
- **Hạng mục:** UI (`inputs.ts` dòng 79)
- **Bằng chứng:** `labelVi: 'Lưu lượng đỉnh (PEF) % giá trị dự đoán hoặc tốt nhất'`, `unit: '%'`.
- **Đề xuất khắc phục:** Tách thành 2 trường độc lập: `pefAbsolute` (L/phút) và `pefPctPredicted` (%).

---

## 4. BẢNG TỔNG HỢP 52 CA BỆNH ĐỐI NGHỊCH ĐÃ THỰC THI

| Mã ca | Danh mục | Đặc điểm đối nghịch | Kết quả kiểm định |
|---|---|---|---|
| `ADV-AGE-01` | Tuổi biên | 11 tuổi khám ngoại trú | Chặn thành công (rec_asthma_age_under_12) |
| `ADV-AGE-02` | Tuổi biên | 11 tuổi nội viện đáp ứng tốt 1h | ❌ **FAIL (Kê đơn MART người lớn cho trẻ em)** |
| `ADV-AGE-03` | Tuổi biên | 12 tuổi (ngưỡng tối thiểu) | PASS |
| `ADV-AGE-04` | Tuổi biên | 13 tuổi (Bậc 3 MART) | PASS |
| `ADV-AGE-05` | Tuổi biên | Thiếu trường tuổi (undefined) | Thiếu fail-closed tuổi |
| `ADV-CTRL-01` | GINA 4 câu | 0/4 tiêu chí dương tính | PASS (well_controlled) |
| `ADV-CTRL-02` | GINA 4 câu | 1/4 tiêu chí dương tính | PASS (partly_controlled) |
| `ADV-CTRL-03` | GINA 4 câu | 2/4 tiêu chí dương tính (ngưỡng trên) | PASS (partly_controlled) |
| `ADV-CTRL-04` | GINA 4 câu | 3/4 tiêu chí dương tính (ngưỡng không kiểm soát) | PASS (uncontrolled) |
| `ADV-CTRL-05` | GINA 4 câu | 4/4 tiêu chí dương tính | PASS (uncontrolled) |
| `ADV-CTRL-06` | GINA thiếu câu | Thiếu Q1 (3 câu còn lại False) | Đánh giá non (coi là well_controlled) |
| `ADV-CTRL-07` | GINA thiếu câu | Thiếu Q2 (Q1=True, 2 câu False) | Đánh giá non |
| `ADV-CTRL-08` | GINA thiếu câu | Thiếu Q3 (2 câu True, 1 câu False) | Đánh giá non |
| `ADV-CTRL-09` | GINA thiếu câu | Thiếu Q4 (3 câu False) | Đánh giá non |
| `ADV-CTRL-10` | GINA thiếu câu | Thiếu cả 4 câu | PASS (fail-closed missing input) |
| `ADV-CTRL-11` | GINA thiếu câu | Chỉ trả lời 1 câu False, 3 câu thiếu | ❌ **FAIL (Thủng fail-closed, ngộ nhận kiểm soát tốt)** |
| `ADV-EXAC-01` | Nguy cơ tương lai | 0 đợt cấp, FEV₁ 80% | PASS |
| `ADV-EXAC-02` | Nguy cơ tương lai | 1 đợt cấp, FEV₁ 60% | Bỏ qua yếu tố nguy cơ |
| `ADV-EXAC-03` | Nguy cơ tương lai | 2 đợt cấp, FEV₁ 59% (<60%), triệu chứng 0/4 | ❌ **FAIL (Để BN nguy cơ cao ở Bậc 1–2 AIR-only)** |
| `ADV-BIO-01` | Type 2 Biomarkers | BCAT 149 tế bào/µL (<150) | PASS |
| `ADV-BIO-02` | Type 2 Biomarkers | BCAT 150 tế bào/µL | PASS |
| `ADV-BIO-03` | Type 2 Biomarkers | BCAT 300 tế bào/µL (ngưỡng anti-IL5) | ❌ **FAIL (Lỗi key need làm tê liệt chỉ định sinh học)** |
| `ADV-BIO-04` | Type 2 Biomarkers | FeNO 65 ppb + BCAT 450 | FeNO bị bỏ qua hoàn toàn |
| `ADV-MED-01` | An toàn thuốc | SABA đơn độc qua currentMeds | PASS (STOP salbutamol) |
| `ADV-MED-02` | An toàn thuốc | SABA đơn độc qua cờ sabaOnly | PASS (STOP salbutamol) |
| `ADV-MED-03` | An toàn thuốc | LABA đơn độc (Salmeterol monotherapy) | ❌ **FAIL (Bỏ lọt LABA đơn độc tăng tử vong)** |
| `ADV-MED-04` | An toàn thuốc | Formoterol đơn độc | ❌ **FAIL (Bỏ lọt LABA đơn độc tăng tử vong)** |
| `ADV-MED-05` | An toàn thuốc | MART overuse 13 nhát/ngày (>12) | PASS (HOLD budesonide_formoterol) |
| `ADV-MED-06` | An toàn thuốc | MART đúng 12 nhát/ngày (ngưỡng max) | PASS (Không báo quá liều sai) |
| `ADV-STEP-01` | Hạ bậc điều trị | Ổn định 2 tháng | Bỏ qua mốc 2 tháng của GINA |
| `ADV-STEP-02` | Hạ bậc điều trị | Ổn định 3 tháng tại Bậc 3 | ❌ **FAIL (Mâu thuẫn CONTINUE và CONSIDER)** |
| `ADV-STEP-03` | Hạ bậc điều trị | Ổn định 6 tháng tại Bậc 4 | Thiếu phác đồ hạ bậc cụ thể |
| `ADV-SPEC-01` | Nhóm đặc biệt | Bệnh nhân mang thai | Bỏ quên hoàn toàn tư vấn thai kỳ |
| `ADV-SPEC-02` | Nhóm đặc biệt | Đang hút thuốc lá | Bỏ quên hoàn toàn can thiệp thuốc lá |
| `ADV-SPEC-03` | Tương tác thuốc | Đang dùng Propranolol | PASS (AVOID propranolol) |
| `ADV-SPEC-04` | Đa bệnh | Suy tim HFrEF + Hen (module HF + asthma) | ❌ **FAIL (HF gợi ý Carvedilol cho người bệnh hen)** |
| `ADV-ACUTE-01` | Cơn cấp nội viện | Nhẹ - trung bình: Nói cả câu, RR 24, HR 96 | PASS |
| `ADV-ACUTE-02` | Cơn cấp nội viện | RR = 30 lần/phút (ngưỡng ranh giới) | PASS (Xếp nhẹ - trung bình) |
| `ADV-ACUTE-03` | Cơn cấp nội viện | RR = 31 lần/phút (>30 tiêu chuẩn nặng) | ❌ **FAIL (Lỗi key need hạ cấp thành cơn nhẹ-tb)** |
| `ADV-ACUTE-04` | Cơn cấp nội viện | HR = 120 bpm (ngưỡng ranh giới) | PASS |
| `ADV-ACUTE-05` | Cơn cấp nội viện | HR = 121 bpm (>120 tiêu chuẩn nặng) | PASS (Xếp cơn nặng do HR nằm trên Patient) |
| `ADV-ACUTE-06` | Cơn cấp nội viện | SpO₂ = 89% (<90% suy hô hấp) | ❌ **FAIL (SpO2 thiếu trường và bị bỏ qua)** |
| `ADV-ACUTE-07` | Cơn cấp nội viện | Chỉ nói từng từ (speech: words) | PASS (Xếp cơn nặng) |
| `ADV-ACUTE-08` | Nguy kịch | Lồng ngực im lặng (Silent Chest) | ❌ **FAIL (Early return bỏ rơi toàn bộ thuốc cấp cứu)** |
| `ADV-ACUTE-09` | Nguy kịch | Rối loạn tri giác (Ngủ gà, lơ mơ) | ❌ **FAIL (Early return bỏ rơi toàn bộ thuốc cấp cứu)** |
| `ADV-ACUTE-10` | Cơn cấp nội viện | Đánh giá sau 1h: Đáp ứng tốt | PASS (Kế hoạch xuất viện) |
| `ADV-OVL-01` | Chồng lấp bệnh | Chồng lấp Hen - COPD (ACO) | Thiếu luật trùng lặp nhóm LABA |
| `ADV-OVL-02` | Đổi Profile | Profile VN trên Bậc 2 | profileDiff trống rỗng |
| `ADV-OVL-03` | Đổi Profile | Profile US trên Bậc 1 | profileDiff trống rỗng |
| `ADV-PLAN-01` | Kế hoạch hành động | Nhập pefPct = 80 (%) | ❌ **FAIL (Lỗi đổi đơn vị 80 L/phút & Vùng xanh >64)** |
| `ADV-PLAN-02` | Kế hoạch hành động | Hướng dẫn xử trí Vùng Đỏ Track 1 | ❌ **FAIL (Bảo xịt 4-6 nhát Symbicort / khí dung DPI)** |
| `ADV-PLAN-03` | Kế hoạch hành động | Bệnh nhân đang nằm cấp cứu ICU | Sinh kế hoạch hành động ngoại trú không phù hợp |

---

## 5. KẾT LUẬN & KIẾN NGHỊ ĐIỀU PHỐI (REVIEW CONCLUSION)

- **Kết luận:** **FAIL (KHÔNG ĐẠT)**  
  Module Hen phế quản (`asthma`) có cấu trúc khung tốt và bao quát được lộ trình Track 1 MART của GINA 2026, nhưng đang tồn tại **9 lỗi Critical** có thể dẫn tới hậu quả lâm sàng nghiêm trọng (ngộ độc thuốc, bỏ rơi cấp cứu, điều trị sai liều cho trẻ em, và trì hoãn cấp cứu do kế hoạch hành động sai lệch) cùng **5 lỗi Major**.
- **Yêu cầu đối với Module Owner (Agent M):**
  1. Xóa bỏ ngay lệnh return sớm tại Rule 6 khi có silent chest/drowsy, đảm bảo gói thuốc cấp cứu luôn được kích hoạt.
  2. Sửa toàn bộ các hàm đọc `need(ctx, 'customInputs.xxx')` trong `rules.ts` để đọc đúng cấu trúc key của UI form (`respiratoryRate`, `bloodEosinophils`, `pefPct`, `spo2`).
  3. Bổ sung luật cấm LABA đơn độc không kèm ICS.
  4. Bổ sung điều kiện chặn tuổi `< 12` cho Rule 8 (kế hoạch xuất viện).
  5. Sửa `evaluateGinaControl` bắt buộc đủ 4 câu hỏi mới kết luận kiểm soát tốt.
  6. Viết lại toán học và logic Vùng Đỏ trong `actionPlan.ts`.
  7. Phối hợp với Agent HF loại bỏ Carvedilol khỏi gợi ý điều trị cho bệnh nhân có bệnh nền Hen.

Sau khi Agent M hoàn thành bản vá, Review Board sẽ tiến hành tái thẩm định độc lập tại Vòng 2.
