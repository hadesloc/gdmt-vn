# Báo Cáo Thẩm Định Lâm Sàng & Guideline (Round 1 – Reviewer R1)

**Chuyên khoa:** Hô hấp & Dị ứng – Miễn dịch lâm sàng  
**Vai trò:** R1 – Chuyên gia Hen / Guideline Checker  
**Module thẩm định:** `asthma` (Hen phế quản người lớn & ≥ 12 tuổi)  
**Tác giả module:** Agent M  
**Ngày thực hiện:** 27/10/2026  
**Tài liệu đối chiếu nền tảng:**
1. *Global Strategy for Asthma Management and Prevention (GINA 2026 Strategy Report & Summary Guide)*
2. *Bộ Y tế Việt Nam QĐ 1851/QĐ-BYT 2020: Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi*
3. *Bộ Y tế Việt Nam QĐ 5850/QĐ-BYT 2021: Quy trình lâm sàng chẩn đoán và điều trị hen phế quản ở người lớn và trẻ em ≥ 12 tuổi*
4. *Nhãn dược phẩm chính thức FDA DailyMed & Dược thư Quốc gia Việt Nam*

---

## 1. Tóm Tắt Kết Quả & Thống Kê Findings

| Mức độ nghiêm trọng | Số lượng | Mô tả trọng tâm |
|---|:---:|---|
| 🔴 **Critical** | **1** | Lỗi nhân tỷ lệ phần trăm và gán nhầm đơn vị `L/phút` trong Bản Kế hoạch hành động hen (`actionPlan.ts`), gây nguy cơ ngộ nhận vùng an toàn khi người bệnh đang suy hô hấp cấp nguy kịch. |
| 🟠 **Major** | **7** | Thiếu trường nhập liệu SpO₂; hổng Fail-Closed trong `evaluateGinaControl`; xung đột và sai bậc liều Track 2 Bậc 5; bỏ sót tiền sử đợt cấp/FEV1 khi hạ bậc; thủng chặn tuổi < 12 ở kế hoạch xuất viện; kích hoạt sai quy tắc cơn cấp nhẹ-TB khi đã hồi phục; thiếu hoàn toàn phân nhánh `profileDiff VN`. |
| 🟡 **Minor** | **2** | Câu chữ câu hỏi số 3 về thuốc cắt cơn chưa làm rõ SABA vs AIR (Track 1); hành động quá liều MART dùng `HOLD` thay vì `REFER`. |
| 🔵 **Suggestion** | **2** | Cảnh báo chống chỉ định an thần và tránh lạm dụng kháng sinh đợt cấp; bổ sung can thiệp cai thuốc lá và tiêm phòng vắc-xin cúm/phế cầu. |
| **TỔNG CỘNG** | **12** | **KẾT LUẬN: FAIL** (1 Critical, 7 Major) |

---

## 2. Bảng Tổng Hợp Findings (Chi tiết mã hóa trong `round1_R1.json`)

| Mã Finding | Mức độ | Loại mục | Vị trí (`itemId`) | Tóm tắt lỗi lâm sàng / guideline |
|---|:---:|:---:|---|---|
| **R1-ASTHMA-01** | 🔴 Critical | `rule` / `ui` | `asthma.action_plan.generate` | Lấy `pefPct` (%) nhân 0.8 rồi gán đơn vị `L/phút` tạo ngưỡng vùng Xanh/Vàng/Đỏ sai nghiêm trọng (Vùng Xanh > 64 L/phút trong khi bình thường là 400–600 L/phút). |
| **R1-ASTHMA-02** | 🟠 Major | `ui` / `rule` | `asthma.inputs.missing_spo2` | `rules.ts` đọc `customInputs.spo2` nhưng `inputs.ts` không hề khai báo trường này, vô hiệu hóa phân loại Cơn hen nặng qua SpO₂ trên UI. |
| **R1-ASTHMA-03** | 🟠 Major | `rule` | `asthma.outpatient.evaluateGinaControl_fail_closed` | Trả lời 1 câu hỏi (q1 = false) và bỏ trống 3 câu còn lại sẽ bị kết luận sai thành `well_controlled` (Kiểm soát tốt), vi phạm QA-1 Fail-Closed. |
| **R1-ASTHMA-04** | 🟠 Major | `rule` | `asthma.outpatient.track2_step5_conflict` | Track 2 Bậc 5 vừa bị rule 15 gán nhãn "Track 1 Bậc 5", vừa bị rule 16 hạ xuống ghi "Track 2 Bậc 4 liều trung bình" thay vì liều cao ICS-LABA. |
| **R1-ASTHMA-05** | 🟠 Major | `rule` | `asthma.outpatient.step_down_stable` | Hạ bậc điều trị bỏ qua tiền sử đợt cấp (`exacerbationsLastYear`) và `fev1Pct < 60%`, vi phạm an toàn GINA Box 2-2B và BYT 1851 Bảng 3B. |
| **R1-ASTHMA-06** | 🟠 Major | `rule` | `asthma.inpatient.discharge_plan` | Rule kế hoạch xuất viện thiếu kiểm tra chặn tuổi (`age < 12`), có thể kê đơn người lớn (160/4.5 mcg tối đa 12 nhát/ngày) cho trẻ em. |
| **R1-ASTHMA-07** | 🟠 Major | `rule` | `asthma.inpatient.mild_moderate_exacerbation` | Rule cơn nhẹ-TB kích hoạt trên mọi BN nội trú khi `!isSevere`, kể cả BN đã đáp ứng tốt sau 1h (`acuteResponseAfter1h === 'good_response'`). |
| **R1-ASTHMA-08** | 🟠 Major | `rule` / `missing` | `asthma.rules.profileDiff_vietnam` | 0 dòng code kiểm tra `ctx.profile`; bỏ sót các đặc thù lâm sàng của Bộ Y tế Việt Nam (BYT 1851 Bảng 5 & 7 về thuốc BHYT cơ sở; danh mục sinh học). |
| **R1-ASTHMA-09** | 🟡 Minor | `ui` | `customInputs.relieverNeededMoreThanTwiceWeek` | Chưa làm rõ câu hỏi số 3 chỉ áp dụng cho thuốc cắt cơn SABA; không tính thuốc cắt cơn ICS-formoterol trong Track 1 theo GINA Table 2A. |
| **R1-ASTHMA-10** | 🟡 Minor | `rule` | `asthma.safety.mart_max_overuse` | Quá liều MART (> 12 nhát/ngày) dùng `action: 'HOLD'` có thể khiến bệnh nhân bỏ thuốc cắt cơn khi đang khó thở kịch phát; nên dùng `REFER`. |
| **R1-ASTHMA-11** | 🔵 Suggestion | `missing` | `asthma.rules.acute_sedatives_antibiotics_warning` | Bổ sung cảnh báo an toàn Class III: Chống chỉ định dùng thuốc an thần và tránh lạm dụng kháng sinh thường quy trong cơn hen cấp. |
| **R1-ASTHMA-12** | 🔵 Suggestion | `missing` | `asthma.rules.non_pharm_smoking_vaccine` | Bổ sung khuyến cáo can thiệp không dùng thuốc Class I: Cai thuốc lá khi đang hút và tiêm chủng cúm hàng năm / phế cầu. |

---

## 3. Phân Tích Chi Tiết Từng Vấn Đề Lâm Sàng Đối Chiếu Guideline

### 3.1. [CRITICAL] Lỗi Tính Toán & Đơn Vị Trong Bản Kế Hoạch Hành Động Hen (`actionPlan.ts`)

- **Vị trí code:** `gdmt-vn/src/modules/asthma/actionPlan.ts` (dòng 20–28) và `rules.ts` (dòng 938).
- **Thực trạng code:**
  - `inputs.ts` khai báo: `id: 'customInputs.pefPct', labelVi: 'Lưu lượng đỉnh (PEF) % giá trị dự đoán hoặc tốt nhất', unit: '%'`. Người dùng nhập một số tỷ lệ phần trăm (ví dụ: `80` tương ứng 80%).
  - `rules.ts` truyền trực tiếp giá trị này: `pefBest: pef`.
  - Trong `actionPlan.ts`:
    ```typescript
    const pefBestText = params.pefBest ? `${params.pefBest} L/phút` : 'chưa đo (tính theo triệu chứng)';
    const greenPef = params.pefBest ? `> ${(params.pefBest * 0.8).toFixed(0)} L/phút (>80%)` : '> 80% giá trị dự đoán';
    const yellowPef = params.pefBest
      ? `${(params.pefBest * 0.5).toFixed(0)} – ${(params.pefBest * 0.8).toFixed(0)} L/phút (50–79%)`
      : '50% – 79% giá trị dự đoán';
    const redPef = params.pefBest ? `< ${(params.pefBest * 0.5).toFixed(0)} L/phút (<50%)` : '< 50% giá trị dự đoán';
    ```
- **Hậu quả lâm sàng nghiêm trọng:**
  - Giá trị lưu lượng đỉnh (PEF) thực tế của một người trưởng thành khỏe mạnh thường dao động từ **400 đến 650 L/phút** (theo Bảng chỉ số PEF chuẩn Bộ Y tế QĐ 5850/2021 Phụ lục 1, trang 20).
  - Khi người dùng nhập `pefPct = 80`, hệ thống tính ra:
    - 🟢 Vùng Xanh: `> 64 L/phút`
    - 🟡 Vùng Vàng: `40 – 64 L/phút`
    - 🔴 Vùng Đỏ: `< 40 L/phút`
  - Nếu người bệnh lên cơn hen kịch phát nặng tại nhà, đo lưu lượng đỉnh tụt thảm hại xuống **200 L/phút** (giảm hơn 50% so với giá trị nền 500 L/phút – tức đang ở **VÙNG ĐỎ nguy kịch** cần cấp cứu 115 ngay lập tức), nhưng khi nhìn vào Bản kế hoạch hành động do GDMT in ra, thấy ghi `Vùng Xanh: > 64 L/phút`, bệnh nhân thấy 200 > 64 nên yên tâm tưởng mình đang ở Vùng Xanh an toàn! Sự ngộ nhận này trì hoãn cấp cứu và có thể gây tử vong do ngạt thở cấp.
- **Đối chiếu Guideline:**
  - *Bộ Y tế QĐ 5850/2021 Phụ lục 4 (trang 28):* Vùng Xanh là `> 80% giá trị lý thuyết hoặc giá trị tốt nhất của bạn` (tính bằng L/phút tuyệt đối).
  - *GINA 2026 Strategy Report Box 9-2 & Summary Guide p. 34.*
- **Đề xuất khắc phục:** Tách bạch rõ 2 cách hiển thị: Nếu chỉ có `pefPct` (%), chỉ hiển thị phần trăm chuẩn: `🟢 VÙNG XANH: PEF > 80% giá trị tốt nhất cá nhân`. Nếu muốn hiển thị số lít/phút, phải có trường nhập `pefBestLMin` (ví dụ 500 L/phút), khi đó 80% mới là `> 400 L/phút` và 50% mới là `250 L/phút`. Tuyệt đối không lấy % nhân với 0.8 rồi gán nhãn `L/phút`.

---

### 3.2. [MAJOR] Thiếu Trường Nhập Liệu SpO₂ Trong `inputs.ts`

- **Vị trí code:** `gdmt-vn/src/modules/asthma/inputs.ts` (nhóm `asthma_inpatient_acute_group`) và `rules.ts` (dòng 298, 312).
- **Thực trạng code:**
  - Trong `rules.ts`:
    ```typescript
    const spo2 = need(ctx, 'customInputs.spo2');
    // ...
    (spo2 !== undefined && spo2 < th('asthma.acute.severe_spo2_threshold'))
    ```
  - Trong `inputs.ts`: Hoàn toàn không có trường nào khai báo `id: 'customInputs.spo2'`.
- **Hậu quả lâm sàng:** Bác sĩ cấp cứu mở app không thấy ô nhập SpO₂ khí trời. Khi chạy engine, `spo2` luôn trả về `undefined`. Một bệnh nhân tím tái, thở co kéo có SpO₂ 85% sẽ không được hệ thống tính điểm giảm oxy máu để xếp vào Cơn hen cấp nặng nếu thiếu các thông số khác.
- **Đối chiếu Guideline:**
  - *Bộ Y tế QĐ 5850/2021 Bảng phân độ cơn hen cấp (trang 17):* Cơn hen nặng có `SpO2 (thở khí trời) < 90%`.
  - *GINA 2026 Summary Guide Figure 9 (trang 36):* Severe presentation: `O2 saturation (room air) < 92%`.
- **Đề xuất khắc phục:** Bổ sung ngay trường `customInputs.spo2` vào `inputs.ts`: type `number`, min 50, max 100, unit `%`.

---

### 3.3. [MAJOR] Hổng Fail-Closed Trong Đánh Giá Kiểm Soát Hen (`evaluateGinaControl`)

- **Vị trí code:** `gdmt-vn/src/modules/asthma/rules.ts` (dòng 42–54).
- **Thực trạng code:**
  ```typescript
  if (answered === 0) {
    return { answeredCount: 0, positiveCount: 0, level: 'missing' };
  }
  if (positive === 0) {
    return { answeredCount: answered, positiveCount: positive, level: 'well_controlled' };
  }
  ```
  Nếu người dùng chỉ trả lời duy nhất 1 câu hỏi (ví dụ q1: Triệu chứng ban ngày = Không) và bỏ trống 3 câu còn lại (q2: Thức giấc đêm, q3: Thuốc cắt cơn, q4: Giới hạn vận động):
  - `answered = 1`
  - `positive = 0`
  - Hàm lập tức trả về `level: 'well_controlled'`!
- **Hậu quả lâm sàng:** Người bệnh chưa được đánh giá 3/4 câu hỏi cốt lõi nhưng hệ thống đã coi là "Kiểm soát tốt hoàn toàn", bỏ qua rule `asthma.outpatient.missing_control_data`, và có thể kích hoạt khuyến cáo hạ bậc (`step_down_stable`) giảm liều ICS duy trì.
- **Đối chiếu Guideline:**
  - *GINA 2026 Table 2A (trang 12 Summary Guide):* Đánh giá kiểm soát triệu chứng hen bắt buộc gồm cả 4 câu hỏi trong 4 tuần. Tiêu chuẩn "Well controlled" là "None of these" (Không có bất kỳ triệu chứng nào trong 4 triệu chứng).
  - *Bộ Y tế QĐ 1851/2020 Bảng 3 (trang 15):* "Kiểm soát hoàn toàn: Không có tiêu chí nào".
- **Đề xuất khắc phục:** Chỉ trả về `well_controlled` khi `answered === 4 && positive === 0`. Nếu `answered < 4` và `positive < 3`, bắt buộc phải trả về `level: 'missing'` để kích hoạt `missingInputRec()`.

---

### 3.4. [MAJOR] Mâu Thuẫn Phân Nhánh & Sai Bậc Liều Ở Track 2 Bậc 5

- **Vị trí code:** `gdmt-vn/src/modules/asthma/rules.ts` (dòng 804–864 và dòng 870–920).
- **Thực trạng code:**
  - Bệnh nhân chọn `Track 2` và `currentStep = 5`:
    1. Kích hoạt Rule 15 (`asthma.outpatient.track1_step5_severe`) vì rule này kiểm tra `currentStep === 5` mà không loại trừ Track 2, sinh khuyến cáo có tiêu đề: `"Track 1 Bậc 5: Quản lý Hen nặng..."`.
    2. Đồng thời kích hoạt Rule 16 (`asthma.outpatient.track2_management`), trong đó dòng 897 kiểm tra `else if (currentStep === 4 || currentStep === 5)` và gán tiêu đề: `"Track 2 Bậc 4: Fluticasone/salmeterol 250/25 mcg liều trung bình + Salbutamol khi cần"`.
- **Hậu quả lâm sàng:** Người bệnh nhận 2 khuyến cáo mâu thuẫn: vừa bảo đang ở Track 1 Bậc 5, vừa bảo đang ở Track 2 Bậc 4; đồng thời ở Bậc 5 Track 2 lại bị kê đơn liều trung bình (250/25 mcg) thay vì liều cao ICS-LABA.
- **Đối chiếu Guideline:**
  - *GINA 2026 Strategy Report Box 4-6 (trang 83) & Summary Guide Figure 7:* Bậc 5 Track 2 là **High-dose ICS-LABA** (ví dụ Fluticasone/salmeterol 500/50 mcg x 2 lần/ngày) phối hợp thêm LAMA và đánh giá kiểu hình sinh học.
  - *Bộ Y tế QĐ 1851/2020 Bảng 7 (trang 20):* Bậc 5 là `Liều cao ICS/LABA + Chuyển tuyến trên đánh giá kiểu hình ± Tiotropium, anti-IgE, anti-IL5...`.
- **Đề xuất khắc phục:** Quy hoạch lại Rule 15 thành quản lý Hen nặng Bậc 5 chung cho cả hai Track (như GINA 2026 trang 84: "In Step 5, treatment options for Tracks 1 and 2 are similar"). Trong Rule 16, khi `currentStep === 5`, phải ghi rõ `Track 2 Bậc 5: Liều cao ICS-LABA (Fluticasone/salmeterol 500/50 mcg x 2 lần/ngày) + phối hợp LAMA + chuyển chuyên khoa`.

---

### 3.5. [MAJOR] Bỏ Sót Tiền Sử Đợt Cấp & FEV1 Khi Xem Xét Hạ Bậc (`step_down_stable`)

- **Vị trí code:** `gdmt-vn/src/modules/asthma/rules.ts` (dòng 579–635).
- **Thực trạng code:** Rule `asthma.outpatient.step_down_stable` chỉ kiểm tra `wellControlledMonths >= 3` và `score.level === 'well_controlled'`. Hoàn toàn không kiểm tra `exacerbationsLastYear` hay `fev1Pct`.
- **Hậu quả lâm sàng:** Bệnh nhân có tiền sử 2 đợt cấp nặng phải nằm viện hoặc FEV1 < 60% trong năm qua, chỉ cần gần đây kiểm soát tốt 3 tháng là hệ thống lập tức khuyên hạ bậc giảm 25–50% liều ICS. Đây là đối tượng nguy cơ kịch phát tái phát rất cao, hạ bậc vội vã có thể đẩy bệnh nhân vào đợt cấp nguy kịch.
- **Đối chiếu Guideline:**
  - *GINA 2026 Strategy Report Box 2-2B (trang 42) & trang 37:* Tiền sử ≥ 1 đợt cấp trong 12 tháng qua là yếu tố dự báo độc lập mạnh nhất cho đợt cấp tương lai. "If the patient has risk factors for asthma exacerbations (Box 2-2B), step down treatment only with close supervision."
  - *GINA 2026 Summary Guide trang 27:* "Assess risk factors for exacerbation, including history of previous exacerbations or emergency department visits for asthma, and low lung function... before stepping down."
  - *Bộ Y tế QĐ 1851/2020 Bảng 3B (trang 15).*
- **Đề xuất khắc phục:** Trong `when()` của rule `step_down_stable`, nếu `ci.exacerbationsLastYear > 0` hoặc `ctx.patient.fev1Pct < 60`, không cho phép tự động hạ bậc, hoặc phải sinh khuyến cáo cảnh báo nguy cơ cao (CAUTION), yêu cầu giữ nguyên bậc điều trị.

---

### 3.6. [MAJOR] Thủng Chặn Độ Tuổi < 12 Ở Kế Hoạch Xuất Viện Nội Viện (`discharge_plan`)

- **Vị trí code:** `gdmt-vn/src/modules/asthma/rules.ts` (dòng 464–497).
- **Thực trạng code:** Trong khi các rule khác đều có `if (age !== undefined && age < th('asthma.age.min_adult_adolescent')) return false;`, rule `asthma.inpatient.discharge_plan` hoàn toàn không kiểm tra `age`.
- **Hậu quả lâm sàng:** Bệnh nhi 6–11 tuổi vào viện vì cơn hen cấp, sau khi đáp ứng tốt sau 1 giờ (`acuteResponseAfter1h === 'good_response'`), sẽ được xuất viện với đơn thuốc người lớn: `Budesonide/formoterol 160/4.5 mcg vừa duy trì vừa cắt cơn (tối đa 12 nhát/ngày)`.
- **Đối chiếu Guideline:**
  - *GINA 2026 Summary Guide Table 7 (trang 45):* Trẻ 6–11 tuổi trong phác đồ MART chỉ dùng liều nhi khoa **Budesonide/formoterol 80/4.5 mcg**, tối đa không quá 8 nhát/ngày; không khuyến cáo MART ở Bậc 5 cho trẻ em.
- **Đề xuất khắc phục:** Thêm kiểm tra `age >= 12` vào rule `asthma.inpatient.discharge_plan`.

---

### 3.7. [MAJOR] Rule Cơn Nhẹ - Trung Bình Kích Hoạt Sai Trên Bệnh Nhân Đang Hồi Phục Xuất Viện

- **Vị trí code:** `gdmt-vn/src/modules/asthma/rules.ts` (dòng 400–459).
- **Thực trạng code:** `when()` của rule `asthma.inpatient.mild_moderate_exacerbation` chỉ kiểm tra `return !isSevere;`. Không kiểm tra xem bệnh nhân có đang trong cơn cấp hay không, và không loại trừ `acuteResponseAfter1h === 'good_response'`.
- **Hậu quả lâm sàng:** Khi bệnh nhân hồi phục hoàn toàn sau xử trí cấp cứu và chuẩn bị xuất viện (Rule 8), hệ thống vẫn tiếp tục sinh Rule 7 yêu cầu "Khởi trị Cơn hen cấp nhẹ - trung bình: Salbutamol 4–10 nhát xịt + Prednisolone 40–50 mg/ngày x 5–7 ngày".
- **Đề xuất khắc phục:** Thêm điều kiện `if (ci.acuteResponseAfter1h === 'good_response') return false;` vào rule này.

---

### 3.8. [MAJOR] Thiếu Phân Nhánh `profileDiff VN` Giữa Hướng Dẫn Quốc Tế & Bộ Y Tế

- **Vị trí code:** Toàn bộ `rules.ts`.
- **Thực trạng code:** Cả 17 rule đều ghi `profiles: ['INTL', 'VN', 'US']`, nhưng trong thân hàm không có bất kỳ logic nào kiểm tra `ctx.profile`.
- **Đối chiếu Guideline:**
  1. *Tính sẵn có của thuốc & BHYT cơ sở:* Theo BYT 1851 Bảng 5 & Bảng 7, tại tuyến y tế cơ sở/huyện chưa có sẵn bình hít ICS-formoterol hoặc chưa được BHYT thanh toán cho hen nhẹ, BYT cho phép dùng ICS liều thấp hàng ngày + SABA khi cần, hoặc LTRA (Montelukast uống) + SABA khi cần. Profile VN cần phản ánh lựa chọn thực tế này trong Track 2.
  2. *Danh mục thuốc sinh học:* BYT 1851 (trang 16 & 20) phê duyệt Omalizumab, Mepolizumab, Benralizumab, Dupilumab. Tezepelumab chưa được cấp phép hoặc bảo hiểm chi trả rộng rãi tại VN.
  3. *Liều Salbutamol khởi đầu cơn cấp:* BYT 5850 khuyến cáo 4–10 nhát xịt định liều (GINA khuyến cáo 6–10 nhát cho cơn nặng).
- **Đề xuất khắc phục:** Hiện thực hóa phân nhánh khi `ctx.profile === 'VN'`.

---

## 4. Kiểm Tra Chi Tiết Toàn Bộ 21 Thuốc Hen Trong `kb/drugs/`

Toàn bộ 21 file thuốc Hen thuộc quyền sở hữu của Agent M đã được rà soát đối chiếu với nhãn thuốc FDA và Dược thư Quốc gia Việt Nam:

1. `budesonide.json`: Liều thấp 200–400 mcg, TB >400–800 mcg, Cao >800 mcg. Khớp GINA Table 6.
2. `fluticasone_propionate.json`: Liều thấp 100–250 mcg, TB >250–500 mcg, Cao >500 mcg. Tương tác ritonavir. Khớp GINA Table 6.
3. `fluticasone_furoate.json`: Liều thấp 100 mcg, Cao 200 mcg (hít 1 lần/ngày). Khớp GINA Table 6.
4. `beclometasone.json`: Extrafine liều thấp 100–200 mcg, TB >200–400 mcg, Cao >400 mcg. Khớp GINA Table 6.
5. `mometasone.json`: pMDI liều thấp 200–400 mcg, Cao 400 mcg. Khớp GINA Table 6.
6. `ciclesonide.json`: Extrafine liều thấp 80–160 mcg, TB >160–320 mcg, Cao >320 mcg. Khớp GINA Table 6.
7. `budesonide_formoterol.json`: Symbicort 160/4.5 mcg. Gate tối đa 12 nhát/ngày (54 mcg delivered / 72 mcg metered). Khớp GINA Table 7.
8. `beclometasone_formoterol.json`: Foster 100/6 mcg. Tối đa 12 nhát/ngày. Khớp GINA Table 7.
9. `fluticasone_salmeterol.json`: Seretide 125/25, 250/25, 500/50. Cảnh báo không dùng cắt cơn nhanh. Khớp GINA Track 2.
10. `fluticasone_vilanterol.json`: Relvar Ellipta 100/25, 200/25 mcg (1 lần/ngày). Khớp GINA Track 2.
11. `mometasone_formoterol.json`: Dulera 100/5, 200/5 mcg (2 nhát x 2 lần/ngày). Khớp GINA Track 2.
12. `salbutamol.json`: Ventolin 100 mcg, khí dung 2.5/5 mg. Gate cấm dùng đơn độc không có ICS. Khớp GINA/BYT.
13. `terbutaline.json`: Bricanyl Turbuhaler 0.5 mg, Respules 5 mg. Cắt cơn có kèm ICS. Khớp GINA/BYT.
14. `ipratropium.json`: Khí dung 0.5 mg, xịt 20 mcg. Cơn cấp 4 nhát x 3 lần giờ đầu. Khớp GINA Summary Guide p. 36.
15. `montelukast.json`: Singulair 10 mg. Cảnh báo FDA Boxed Warning tâm thần kinh. Khớp FDA label.
16. `omalizumab.json`: Xolair 75–600 mg SC mỗi 2–4 tuần theo bảng IgE & cân nặng (≥ 6 tuổi). Khớp GINA Box 4-6.
17. `benralizumab.json`: Fasenra 30 mg SC mỗi 4 tuần x 3 liều, sau đó mỗi 8 tuần (≥ 12 tuổi). Khớp GINA Box 4-6.
18. `tezepelumab.json`: Tezspire 210 mg SC mỗi 4 tuần (≥ 12 tuổi). Khớp GINA Box 4-6.
19. `prednisolone.json`: Đợt cấp 40–50 mg/ngày x 5–7 ngày. Không cần giảm liều nếu ≤ 14 ngày. Khớp GINA Summary Guide p. 35.
20. `methylprednisolone.json`: Cơn cấp nặng 40 mg tiêm TM mỗi 12h trong 24–48h đầu. Khớp BYT 5850.
21. `magnesium_sulfate.json`: Cơn cấp nặng 2 g truyền TM trong 20 phút. Khớp BYT 1851 p. 46 & GINA 2026.

---

## 5. Kiểm Tra 37 Trích Dẫn Citations & Ngưỡng Lâm Sàng Thresholds

Script kiểm tra đối chiếu nguyên văn `docs/reviews/asthma/scratch/check_citations.ts` đã chạy và xác nhận:
- **37/37 trích dẫn** trong `kb/citations/asthma.json` đều **khớp chính xác 100% (EXACT MATCH)** với từng trang PDF trong kho tài liệu `Medical_Library_2026`:
  - `GINA_2026_Summary_Guide.pdf`: 27 citations (trang 12, 13, 22, 23, 24, 26, 27, 32, 34, 35, 36, 44, 45).
  - `BYT_1851_2020_Hen_phe_quan_NL_va_TE_ge12.pdf`: 5 citations (trang 15, 19, 22, 37, 46).
  - `BYT_5850_2021_Quy_trinh_hen_phe_quan.pdf`: 3 citations (trang 17, 18, 28).
- Không có trích dẫn mồ côi (orphan citation) hoặc locator bị lệch trang.

---

## 6. Kết Luận & Khuyến Nghị Vòng 1

### Kết luận thẩm định: **FAIL**
- Số lỗi Critical: **1** (Lỗi tính toán và gán sai đơn vị L/phút trong Kế hoạch hành động hen, đe dọa an toàn người bệnh).
- Số lỗi Major: **7** (Thiếu trường SpO2; hổng Fail-closed; xung đột Track 2 Bậc 5; bỏ sót tiền sử đợt cấp khi hạ bậc; thủng chặn tuổi nhi khoa ở kế hoạch xuất viện; kích hoạt sai quy tắc cơn cấp nhẹ-TB khi xuất viện; thiếu profileDiff VN).
- Số lỗi Minor: **2**.
- Số góp ý cải tiến (Suggestion): **2**.

### 5 Vấn đề ưu tiên hàng đầu cần khắc phục ngay (Top 5):
1. **Sửa lỗi công thức tính và đơn vị trong `actionPlan.ts`:** Không lấy tỷ lệ phần trăm `pefPct` nhân 0.8 rồi gán đuôi `L/phút` gây ngộ nhận vùng an toàn; phân định rành mạch giữa PEF tuyệt đối (L/phút) và phần trăm (%).
2. **Bổ sung trường nhập liệu `customInputs.spo2` vào `inputs.ts`:** Khôi phục tính năng phân tầng Cơn hen cấp nặng qua SpO₂ trên UI.
3. **Vá lỗ hổng Fail-Closed trong `evaluateGinaControl`:** Bắt buộc người dùng trả lời đủ cả 4 câu hỏi kiểm soát trước khi kết luận `well_controlled`.
4. **Chuẩn hóa logic Track 2 Bậc 5:** Tránh kích hoạt đồng thời Rule 15 (Track 1) và Rule 16 (Track 2); kê đúng liều cao ICS-LABA ở Bậc 5 Track 2.
5. **Siết chặt điều kiện hạ bậc điều trị (`step_down_stable`) và kế hoạch xuất viện:** Chặn hạ bậc khi có đợt cấp trong vòng 12 tháng hoặc FEV1 < 60%; bổ sung chặn tuổi < 12 ở `discharge_plan`.
