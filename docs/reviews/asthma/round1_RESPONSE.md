# Báo Cáo Khắc Phục Toàn Diện Sau Thẩm Định Vòng 1 (Round 1 Remediation & QA-10)
## Module: Hen Phế Quản Người Lớn & ≥ 12 Tuổi (`asthma`)

- **Tác giả thực hiện:** Agent M2 (Chuyên trách Module `asthma` & 21 hoạt chất Hen phế quản)
- **Ngày hoàn thành:** 27/10/2026
- **Đối chiếu thẩm định:**
  - `docs/reviews/asthma/round1_R1.{md,json}` — **12 phát hiện** (1 Critical, 7 Major, 2 Minor, 2 Suggestion)
  - `docs/reviews/asthma/round1_R2.{md,json}` — **17 phát hiện** (2 Critical, 10 Major, 4 Minor, 1 Suggestion)
  - `docs/reviews/asthma/round1_R3.{md,json}` — **18 phát hiện** (9 Critical, 5 Major, 3 Minor, 1 Suggestion)
  - Các yêu cầu an toàn y khoa bổ sung (AERD + Aspirin/NSAID, nhỏ mắt Timolol, Thai kỳ duy trì ICS & cấm hạ bậc, Tăng thán khí `PaCO₂ > 45 mmHg`, QA-10 `thFor(quantity, id)`, hoàn thiện metadata 21 thuốc).

---

## 1. Tổng Quan Kết Quả Khắc Phục

| Hạng mục kiểm định | Trước khắc phục | Sau khắc phục (Round 1 Response) |
|---|---|---|
| **Findings R1 (12 mục)** | 1 Critical, 7 Major, 2 Minor, 2 Suggestion | **12/12 ĐÃ KHẮC PHỤC TRIỆT ĐỂ (100%)** |
| **Findings R2 (17 mục)** | 2 Critical, 10 Major, 4 Minor, 1 Suggestion | **16/17 ĐÃ KHẮC PHỤC TRONG PHẠM VI** + 1 mục thư viện PDF (`R2-16`) ghi nhận chuyển cấp hệ thống |
| **Findings R3 (18 mục)** | 9 Critical, 5 Major, 3 Minor, 1 Suggestion | **16/18 ĐÃ KHẮC PHỤC TRONG MODULE `asthma`** + 2 mục liên module (`R3-08` module `hf`, `R3-13` engine `duplicates.ts`) đã bọc phòng thủ tại `asthma` và bàn giao |
| **Trích dẫn nguyên văn (`kb/citations/asthma.json`)** | 38 trích dẫn | **52 trích dẫn nguyên văn** đối chiếu trực tiếp PDF offline (0 cảnh báo lệch trang) |
| **Ngưỡng lâm sàng QA-10 (`kb/thresholds/asthma.json`)** | 51 ngưỡng | **60 ngưỡng** khai báo 100% trường `quantity` (`ThresholdQuantity`) |
| **Truy xuất ngưỡng trong `src/modules/asthma/**`** | Dùng `th(id)` | **100% dùng `thFor(expectedQuantity, id)`** (0 `th(id)` trần, 0 số literal, 0 `?? <số>`) |
| **21 tệp thuốc sở hữu (`kb/drugs/*.json`)** | Thiếu một số cổng/nhãn VN/`qtRisk` | **21/21 hoàn chỉnh 100%** `pregnancy`, `lactation`, `contraindications`, `classes`, `components` (5 FDC), `qtRisk`, hướng dẫn súc miệng ICS |
| **Ca chuẩn (`tests/golden/asthma/*.json`)** | 29 ca | **38 ca chuẩn (PASS 100%)** bao phủ toàn bộ R1/R2/R3 & an toàn đặc biệt |
| **Kiểm thử bất biến (`tests/modules/asthma/invariants.test.ts`)** | 2 lỗi TS `r.ruleId` | **0 lỗi TS; 17.000 ca ngẫu nhiên (12.000 Suite 1 + 5.000 Suite 2) — 0 vi phạm** |
| **`npm run verify:kb` & `rulesLint`** | Có cảnh báo | **0 lỗi, 0 cảnh báo trên toàn bộ module `asthma` và 21 thuốc sở hữu** |

---

## 2. Đối Chiếu Chi Tiết Từng Finding Của Reviewer R1 (`round1_R1`)

| Mã Finding | Mức độ | Trạng thái | Tệp sửa đổi & Giải pháp kỹ thuật / lâm sàng | Ca kiểm thử xác nhận |
|---|:---:|:---:|---|---|
| **R1-ASTHMA-01** | 🔴 Critical | **ĐÃ SỬA** | `src/modules/asthma/actionPlan.ts`, `inputs.ts`, `rules.ts`: Tách bạch hoàn toàn `pefBestLMin` (`L/phút` tuyệt đối, tính `Math.round(bestLMin * 0.8)` và `0.5–0.79`) với `pefPct` (`%` dự đoán, giữ nguyên hiển thị `> 80%`, `50% – 79%`, `< 50%`, tuyệt đối không nhân `0.8` rồi gắn nhãn `L/phút`). | `asthma_22`, `asthma_27`, Unit test `golden.test.ts` |
| **R1-ASTHMA-02** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/inputs.ts`, `rules.ts`: Khai báo đầy đủ `customInputs.spo2` (50–100%) và `customInputs.paco2` (15–120 mmHg) trong nhóm cấp cứu nội viện; đọc chuẩn qua `getCustomNum(ctx, 'spo2')`. | `asthma_17`, `asthma_33`, Suite 1 Invariant #13 |
| **R1-ASTHMA-03** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`evaluateGinaControl`): Chỉ kết luận `well_controlled` hoặc `partly_controlled` khi `answered === 4` đủ cả 4 câu hỏi GINA; nếu `answered < 4` và `positive < 3` bắt buộc trả về `missing` và kích hoạt `missingInputRec()`. | `asthma_24`, Suite 2 Fail-Closed (5.000 ca) |
| **R1-ASTHMA-04** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (Rule 21A, 21B, 22): Bậc 5 phân nhánh rõ `Track 1 Bậc 5` vs `Track 2 Bậc 5`; Track 2 Bậc 5 kê đúng `fluticasone_salmeterol` liều cao (`Accuhaler 500/50 mcg: 1 liều x 2 lần/ngày`) không còn xung đột với Bậc 4. | `asthma_35_track2_step5_high_dose_seretide.json` |
| **R1-ASTHMA-05** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`hasHighExacerbationRisk`, `isStepDownEligible`): Chặn hoàn toàn hạ bậc khi `exacerbationsLastYear > 0` hoặc `fev1Pct < 60%` (`asthma.risk.low_fev1_pct`) hoặc đang mang thai. | `asthma_25`, `asthma_32`, Suite 1 Invariant #11 |
| **R1-ASTHMA-06** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`asthma.inpatient.discharge_plan`): Bổ sung cổng `!isAdultOrAdolescent(ctx)` chặn tuyệt đối kê đơn xuất viện người lớn cho trẻ `< 12` tuổi; đồng thời fail-closed khi thiếu tuổi (`asthma.age_limit.missing_age`). | `asthma_36_inpatient_discharge_under_12_blocked.json`, Suite 1 #1 |
| **R1-ASTHMA-07** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`evaluateAcuteAsthma`): Trả về `hasAcuteAttack: false` ngay khi `acuteResponseAfter1h === 'good_response'` hoặc `isAcuteExacerbation === false`. | `asthma_19`, `asthma_37`, Suite 2 Fail-Closed |
| **R1-ASTHMA-08** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts`: Bổ sung đối tượng `profileDiff` (`INTL`, `VN`, `US`) trên toàn bộ các luật điều trị ngoại trú (Track 1, Track 2, Bậc 5) kèm luật chuyên biệt `asthma.profile_diff.vietnam` đối chiếu QĐ 1851/2020 & QĐ 5850/2021. | `asthma_28_profile_diff_vietnam.json`, `asthma_35` |
| **R1-ASTHMA-09** | 🟡 Minor | **ĐÃ SỬA** | `src/modules/asthma/inputs.ts`: Cập nhật nhãn và `helpVi` của câu hỏi số 3 nêu rõ chỉ tính thuốc cắt cơn SABA > 2 lần/tuần (không tính bình hít cắt cơn chống viêm ICS-formoterol trong Track 1 AIR/MART theo GINA 2026 Table 2A). | Kiểm tra schema `inputs.ts` |
| **R1-ASTHMA-10** | 🟡 Minor | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (Rule 4A & 4B): Khi dùng `> 12` nhát MART/ngày, vừa sinh `HOLD` chặn vượt trần độc tính Formoterol, vừa sinh đồng thời `rec_asthma_mart_overuse_refer` (`REFER` đến cơ sở cấp cứu ngay). | `asthma_21_mart_overuse_warning.json`, Suite 1 #6 |
| **R1-ASTHMA-11** | 🔵 Suggestion | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (Rule 10 & Rule 24) + `kb/citations/asthma.json`: Thêm luật `AVOID` chống chỉ định tuyệt đối thuốc an thần/gây ngủ trong cơn hen cấp (`gina.asthma.2026.acute_sedatives_avoid`) và khuyến cáo `MONITOR` không kê kháng sinh thường quy (`gina.asthma.2026.acute_antibiotics_not_routine`). | `asthma_29_inpatient_sedative_contraindicated.json`, Suite 1 #14 |
| **R1-ASTHMA-12** | 🔵 Suggestion | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (Rule 25 & Rule 26) + `kb/citations/asthma.json`: Thêm luật tư vấn cai thuốc lá / thuốc lá điện tử (`gina.asthma.2026.smoking_cessation`) và tiêm phòng vắc-xin cúm mùa/phế cầu/RSV/COVID-19 (`gina.asthma.2026.vaccination_influenza`). | `rulesLint` & `verify:kb` PASS |

---

## 3. Đối Chiếu Chi Tiết Từng Finding Của Reviewer R2 (`round1_R2`)

| Mã Finding | Mức độ | Trạng thái | Tệp sửa đổi & Giải pháp dược lâm sàng | Ca kiểm thử xác nhận |
|---|:---:|:---:|---|---|
| **ASTHMA-R2-01** | 🔴 Critical | **ĐÃ SỬA** | `src/modules/asthma/rules.ts`: Xóa hoàn toàn lệnh `return` sớm khi có `silentChest`, `drowsy`, `speech === 'unable'` hoặc `paco2 > 45`. Tách thành luật độc lập `asthma.inpatient.life_threatening_icu` (`REFER` ICU + chuẩn bị đặt NKQ) chạy **SONG SONG** với đủ 4 luật thuốc hồi sức cấp cứu. | `asthma_18`, `asthma_26`, `asthma_33`, Suite 1 #13 |
| **ASTHMA-R2-02** | 🔴 Critical | **ĐÃ SỬA** | `src/modules/asthma/actionPlan.ts`: Tách hoàn toàn xử trí Vùng Đỏ theo thiết bị/Track: Track 1 (Turbuhaler/DPI) hít trực tiếp 1 nhát, lặp lại 1 nhát nếu cần (tổng 1–2 nhát, cảnh báo rõ **KHÔNG lắp bình bột khô vào buồng đệm và KHÔNG đổ vào máy khí dung**, không hít 4–6 nhát gây ngộ độc Formoterol); Track 2 dùng 4–6 nhát Salbutamol pMDI qua buồng đệm. | Unit test `golden.test.ts` |
| **ASTHMA-R2-03** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`evaluateAcuteAsthma`): Bắt buộc xác nhận dữ liệu đợt cấp (`isAcuteExacerbation !== false` và có dấu hiệu cấp tính đặc hiệu; không dùng `hr` hay `fev1Pct` nền đơn độc), ngăn chặn kê nhầm SABA + Prednisolone cho bệnh nhân hen ổn định nằm viện mổ phiên. | `asthma_37_inpatient_stable_non_acute_no_ocs.json`, Suite 2 |
| **ASTHMA-R2-04** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (Rule 21A `asthma.outpatient.step5_controller_continue`): Luôn phát sinh khuyến cáo duy trì/tăng bậc thuốc kiểm soát nền (`budesonide_formoterol` hoặc `fluticasone_salmeterol` 500/50) song song với `REFER` chuyên khoa ở Bậc 5. | `asthma_34`, `asthma_35`, Suite 1 #12 |
| **ASTHMA-R2-05** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (Rules 11A–11D & 12A–12B): Tách gói cấp cứu thành **các y lệnh dược độc lập có `drugId` riêng** để đi qua đầy đủ cổng an toàn thận/tương tác của Engine: `salbutamol` (`START`), `ipratropium` (`START`), `methylprednisolone` (`START`), `magnesium_sulfate` (`START` ở cơn nguy kịch/kém đáp ứng, `CONSIDER` ở cơn nặng), và `prednisolone` (`START` ở cơn nhẹ–vừa). | `asthma_16`, `asthma_17`, `asthma_18`, `asthma_26`, `asthma_33` |
| **ASTHMA-R2-06** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/matrices.ts` (`icsDoseEquivalenceMatrix`): Sửa bảng Mometasone furoate đúng GINA 2026 Table 6 (Twisthaler DPI liều thấp–trung bình `200 mcg/ngày` vs cao `400 mcg/ngày`; Asmanex HFA pMDI chuẩn `200–400 mcg/ngày` vs `> 400 mcg/ngày`, hết trùng lặp). | `verify:kb` PASS |
| **ASTHMA-R2-07** | 🟠 Major | **ĐÃ SỬA** | `kb/drugs/beclometasone_formoterol.json`: Bổ sung `gate_formoterol_max_daily` (`totalDailyPuffs > 12` nhát/ngày -> `hold`) đồng bộ với Budesonide/formoterol. | `verify:kb` PASS |
| **ASTHMA-R2-08** | 🟠 Major | **ĐÃ SỬA** | `kb/drugs/terbutaline.json`: Bổ sung `gate_terbutaline_not_alone` cấm SABA đơn độc và cập nhật liều tối đa `target` lên `8` nhát/ngày (`4 mg/24 giờ`) đúng nhãn Bricanyl Turbuhaler. | `verify:kb` PASS |
| **ASTHMA-R2-09** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`asthma.safety.montelukast_neuropsych`): Đổi điều kiện thành `isTakingMontelukast && hasPsychRisk` (tuyệt đối không cảnh báo giả khi bệnh nhân trầm cảm không dùng Montelukast). | `asthma_15`, `asthma_38`, Suite 1 #9 |
| **ASTHMA-R2-10** | 🟠 Major | **ĐÃ SỬA** | `kb/drugs/fluticasone_salmeterol.json`, `src/modules/asthma/matrices.ts`, `rules.ts`: Phân biệt rõ liều theo thiết bị — **Seretide Accuhaler (DPI)** `100/50, 250/50, 500/50 mcg` hít **1 liều x 2 lần/ngày**; **Seretide Evohaler (pMDI)** `50/25, 125/25, 250/25 mcg` xịt **2 nhát x 2 lần/ngày** (đủ 50 mcg salmeterol/lần). | `asthma_35`, `verify:kb` PASS |
| **ASTHMA-R2-11** | 🟠 Major | **ĐÃ SỬA** | `kb/drugs/fluticasone_furoate.json`, `beclometasone.json`, `mometasone.json`, `mometasone_formoterol.json`, `tezepelumab.json`: Chú thích chính xác tình trạng lưu hành thực tế tại Việt Nam (chỉ có trong chế phẩm phối hợp Relvar/Foster hoặc chưa cấp SĐK đại trà tại VN). | `verify:kb` PASS |
| **ASTHMA-R2-12** | 🟠 Major | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`asthma.safety.saba_only_prohibited`): Xác định động `drugId` (`terbutaline` hoặc `salbutamol`) từ `currentMeds` thay vì gán cứng `salbutamol`. | `asthma_38`, Suite 1 #3 |
| **ASTHMA-R2-13** | 🟡 Minor | **ĐÃ SỬA** | `kb/citations/asthma.json`, `src/modules/asthma/rules.ts`: Bổ sung trích dẫn nguyên văn `gina.asthma.2026.beta_blocker_bronchospasm` (GINA 2026 p. 65 bao gồm cả chẹn beta uống và nhỏ mắt glôcôm) và gán đúng vào luật chẹn beta + Timolol. | `asthma_14`, `asthma_31`, Suite 1 #7 |
| **ASTHMA-R2-14** | 🟡 Minor | **ĐÃ SỬA** | `kb/drugs/prednisolone.json`: Bổ sung công thức tính liều theo cân nặng `1 mg/kg/ngày (tối đa 50 mg/ngày)` cho người lớn theo QĐ 5850/BYT và `1–2 mg/kg/ngày (tối đa 40 mg)` cho trẻ em. | `verify:kb` PASS |
| **ASTHMA-R2-15** | 🟡 Minor | **ĐÃ SỬA** | `src/modules/asthma/rules.ts` (`asthma.action_plan.generate`): Trong bối cảnh nội viện (`inpatient`), chỉ sinh Bản kế hoạch hành động hen khi bệnh nhân đã ổn định đủ tiêu chuẩn xuất viện (`acuteResponseAfter1h === 'good_response'`), không sinh giữa cơn nguy kịch ICU; đồng thời nhúng nội dung kế hoạch vào `rationale` (xóa trường thừa `notes`). | `asthma_18`, `asthma_26`, `asthma_33` |
| **ASTHMA-R2-16** | 🟡 Minor | **GHI NHẬN HỆ THỐNG** | Kho thư viện dùng chung `Medical_Library_2026/09_Nhan_Thuoc/` nằm ngoài phạm vi ghi của Agent M2. Toàn bộ liều/chống chỉ định của 20/21 thuốc đã được đối chiếu xác thực bằng trích dẫn nguyên văn trong `GINA_2026_Strategy_Report.pdf`, `BYT_1851_2020`, `BYT_5850_2021` và đề xuất bổ sung PDF nhãn FDA/EMA ở cấp quản trị kho tài liệu. | Báo cáo bàn giao |
| **ASTHMA-R2-17** | 🔵 Suggestion | **ĐÃ SỬA** | Toàn bộ **11/11 tệp thuốc ICS & ICS-LABA** trong `kb/drugs/*.json` đã được bổ sung hướng dẫn: *"Súc miệng kỹ bằng nước sạch và nhổ đi ngay sau khi hít thuốc để phòng ngừa nấm candida hầu họng và khản tiếng"*. | `verify:kb` PASS |

---

## 4. Đối Chiếu Chi Tiết Từng Finding Của Reviewer R3 (`round1_R3`)

| Mã Finding | Mức độ | Trạng thái | Giải pháp kỹ thuật & Phòng vệ | Ca kiểm thử xác nhận |
|---|:---:|:---:|---|---|
| **ASTHMA-R3-01** | 🔴 Critical | **ĐÃ SỬA** | Bỏ early return khi phổi im lặng/lơ mơ; phát sinh đồng thời `REFER` ICU + 4 y lệnh thuốc hồi sức (`salbutamol`, `ipratropium`, `methylprednisolone`, `magnesium_sulfate`). | `asthma_18`, `asthma_26`, `asthma_33`, Suite 1 #13 |
| **ASTHMA-R3-02** | 🔴 Critical | **ĐÃ SỬA** | Viết helper `getCustomNum(ctx, key)` đọc trực tiếp `ctx.normalized.customInputs?.[key]` kết hợp `need(ctx, key)`, nhận diện chính xác `respiratoryRate > 30` lần/phút. | `asthma_17`, `asthma_33`, Suite 1 #13 |
| **ASTHMA-R3-03** | 🔴 Critical | **ĐÃ SỬA** | Bổ sung luật `asthma.safety.laba_only_prohibited` phát lệnh `STOP` (priority 99, FDA Boxed Warning) cho mọi LABA đơn độc và phối hợp LABA-LAMA không kèm ICS (`salmeterol`, `formoterol`, `indacaterol`, `olodaterol`, `vilanterol`, `tiotropium_olodaterol`, `umeclidinium_vilanterol`, `indacaterol_glycopyrronium`...). | `asthma_23_laba_monotherapy_stopped.json`, Suite 1 #4 |
| **ASTHMA-R3-04** | 🔴 Critical | **ĐÃ SỬA** | Chặn tuổi `< 12` tại `asthma.inpatient.discharge_plan` + fail-closed khi `age === undefined`. | `asthma_36`, Suite 1 #1, Suite 2 #2C |
| **ASTHMA-R3-05** | 🔴 Critical | **ĐÃ SỬA** | `evaluateGinaControl` yêu cầu đủ `answered === 4` câu hỏi mới kết luận kiểm soát tốt/một phần; thiếu câu hỏi trả về `missing` (fail-closed). | `asthma_24`, Suite 2 #2A |
| **ASTHMA-R3-06** | 🔴 Critical | **ĐÃ SỬA** | Sửa dứt điểm đơn vị PEF (`pefBestLMin` `L/phút` vs `pefPct` `%`) trong `actionPlan.ts` và `inputs.ts`. | `asthma_27`, Unit test `golden.test.ts` |
| **ASTHMA-R3-07** | 🔴 Critical | **ĐÃ SỬA** | Sửa dứt điểm hướng dẫn Vùng Đỏ Track 1 DPI (1–2 nhát trực tiếp, cấm lắp buồng đệm/máy khí dung, cấm xịt 4–6 nhát Formoterol). | Unit test `golden.test.ts` |
| **ASTHMA-R3-08** | 🔴 Critical | **PHÒNG VỆ + BÀN GIAO AGENT G** | `src/modules/hf/rules.ts` thuộc quyền ghi của **Agent G (HF)**. Phía `asthma` đã duy trì luật `asthma.safety.beta_blocker_contra` (`AVOID` priority 97 cho `carvedilol`) và ghi nhận bàn giao cho Agent G loại chữ `(hoặc Carvedilol)` khỏi tiêu đề gợi ý BB khi bệnh nhân có đồng mắc `asthma`. | `asthma_14`, Báo cáo bàn giao |
| **ASTHMA-R3-09** | 🔴 Critical | **ĐÃ SỬA** | Luật Bậc 5 đọc đồng thời `getCustomNum(ctx, 'bloodEosinophils') ?? need(ctx, 'eos')` và `getCustomNum(ctx, 'feno')` (`≥ 25 ppb`), kích hoạt chính xác gợi ý Benralizumab / Dupilumab / Tezepelumab / Omalizumab. | `asthma_05`, `asthma_34`, `asthma_35` |
| **ASTHMA-R3-10** | 🟠 Major | **ĐÃ SỬA** | Khi `isStepDownEligible(ctx)` thỏa mãn, các luật bậc điều trị chuyển `action` của thuốc kiểm soát sang `'REDUCE'` (thay vì `'CONTINUE'`), và không sinh hạ bậc khi đã ở mức sàn Track 1 AIR-only. | `asthma_11_step_down_stable_6m.json`, Suite 1 #11 |
| **ASTHMA-R3-11** | 🟠 Major | **ĐÃ SỬA** | Bổ sung `hasHighExacerbationRisk(ctx)` (`exacerbationsLastYear > 0` hoặc `fev1Pct < 60%`): chặn Track 1 Bậc 1–2 AIR-only và chuyển thẳng lên tối thiểu Bậc 3 MART duy trì hàng ngày. | `asthma_25`, Suite 1 #11 |
| **ASTHMA-R3-12** | 🟠 Major | **ĐÃ SỬA** | Khai báo đầy đủ `customInputs.spo2` trong `inputs.ts` và tích hợp vào `evaluateAcuteAsthma`. | `asthma_17`, `asthma_33` |
| **ASTHMA-R3-13** | 🟠 Major | **PHÒNG VỆ + BÀN GIAO AGENT B** | `src/engine/safety/duplicates.ts` thuộc quyền ghi của **Agent B (Core Engine)**. Trong phạm vi `asthma`, đã bổ sung luật `asthma.safety.duplicate_laba_warning` phát hiện ≥ 2 thuốc chứa LABA trong `currentMeds` (`AVOID`), đồng thời bàn giao cho Agent B bổ sung `dup.laba` & `dup.lama` cấp liên module. | Suite 1 #5, Báo cáo bàn giao |
| **ASTHMA-R3-14** | 🟠 Major | **ĐÃ SỬA** | Bổ sung luật `asthma.safety.pregnancy_ics_continuation` (`MONITOR` duy trì ICS trong thai kỳ + chặn hạ bậc khi mang thai) và `asthma.non_pharm.smoking_cessation` (`MONITOR` cai thuốc lá/vaping). | `asthma_32_pregnancy_ics_continue_no_stepdown.json`, Suite 1 #10 |
| **ASTHMA-R3-15** | 🟡 Minor | **ĐÃ SỬA** | Bổ sung `profileDiff` (`INTL`, `VN`, `US`) chi tiết trên các luật điều trị và luật riêng cho Profile VN. | `asthma_28`, `asthma_35` |
| **ASTHMA-R3-16** | 🟡 Minor | **ĐÃ SỬA** | Chặn sinh Kế hoạch hành động ngoại trú khi bệnh nhân đang cấp cứu nội viện chưa ổn định (`inpatient` chỉ sinh khi `acuteResponseAfter1h === 'good_response'`). | `asthma_18`, `asthma_26`, `asthma_33` |
| **ASTHMA-R3-17** | 🟡 Minor | **ĐÃ SỬA** | Kích hoạt `asthma.step_down.stability_months_min` (`2` tháng) trong `isStepDownEligible(ctx)` và nêu rõ mốc chuẩn 3 tháng (`stability_months_max`) trong `rationale`. | `asthma_11`, Suite 1 #11 |
| **ASTHMA-R3-18** | ⚪ Suggestion | **ĐÃ SỬA** | Tách rõ 2 trường độc lập trong `src/modules/asthma/inputs.ts`: `customInputs.pefBestLMin` (`L/phút`) và `customInputs.pefPct` (`%`). | `asthma_22`, `asthma_27` |

---

## 5. Các Cải Tiến An Toàn Bổ Sung & Chuẩn Hóa QA-10

1. **Cơ địa Hen nhạy cảm Aspirin (AERD / Tam chứng Samter):**
   - Khai báo `conditions.aerd` trong `inputs.ts` và trích dẫn nguyên văn `gina.asthma.2026.aerd_avoid_nsaid` (GINA 2026 p. 139).
   - Luật `asthma.safety.aerd_nsaid_contra`: Nếu bệnh nhân đang dùng Aspirin hoặc NSAID ức chế COX-1 (`ibuprofen`, `naproxen`, `diclofenac`, `ketorolac`, `piroxicam`, `meloxicam`, `indomethacin`...) -> phát lệnh **`STOP` khẩn cấp** (priority 100); nếu có tiền sử AERD nhưng chưa dùng -> phát lệnh **`AVOID` `aspirin`** (chặn luôn các module khác kê nhầm Aspirin). Kiểm chứng tại `asthma_30_aerd_aspirin_stopped.json` & Invariant #8.
2. **Thuốc nhỏ mắt Timolol (Glôcôm) ở bệnh nhân Hen:**
   - Mở rộng `NON_SELECTIVE_BB_DRUGS` và bộ nhận diện tên thuốc chứa `timolol` -> phát lệnh **`AVOID`** do nguy cơ co thắt phế quản cấp tử vong qua hấp thu ống lệ mũi (`gina.asthma.2026.beta_blocker_bronchospasm`). Kiểm chứng tại `asthma_31_timolol_eyedrops_contra.json` & Invariant #7.
3. **Tăng thán khí (`PaCO₂ > 45 mmHg`) trong Cơn hen cấp:**
   - Khai báo ngưỡng `asthma.acute.life_threatening_paco2_mmhg` (`45 mmHg`, `quantity: "paco2"`, trích dẫn `gina.asthma.2026.acute_hypercapnia_paco2_45`). Bất kỳ bệnh nhân cơn hen cấp nào có `PaCO₂ > 45 mmHg` đều được phân tầng ngay vào **Cơn hen đe dọa tử vong** -> kích hoạt đồng thời `REFER` ICU + chuẩn bị đặt nội khí quản + đủ 4 thuốc hồi sức cấp cứu. Kiểm chứng tại `asthma_33_acute_life_threatening_hypercapnia_full_bundle.json` & Invariant #13.
4. **Chuẩn hóa 100% QA-10 & Metadata 21 Thuốc:**
   - Toàn bộ 60 ngưỡng trong `kb/thresholds/asthma.json` có đầy đủ `quantity` chuẩn hóa; toàn bộ mã nguồn `src/modules/asthma/*.ts` chuyển sang `thFor(expectedQuantity, id)`.
   - Toàn bộ 21 thuốc trong `kb/drugs/*.json` có đầy đủ `pregnancy`, `lactation`, `contraindications`, `classes` chuẩn (`['ics']`, `['ics', 'laba']`, `['saba']`, `['sama']`, `['ltra']`, `['biologic_asthma']`, `['systemic_corticosteroid']`), `components` cho cả 5 thuốc phối hợp ICS-LABA, và `"qtRisk": "conditional"` cho cả 7 thuốc đồng vận beta-2.
   - Đồng bộ toàn bộ 81 tệp `kb/review/` (60 ngưỡng `asthma.*` + 21 thuốc sở hữu) với `contentHash` mới nhất ở mức trần trạng thái cho phép `"status": "auto_checked"`.

---

## 6. Hạng Mục Liên Module Cần Điều Phối (Ngoài Phạm Vi Ghi Của Agent M2)

1. **`ASTHMA-R3-08` (`src/modules/hf/rules.ts` — Agent G):** Đề nghị Agent G kiểm tra `hasCondition(ctx, 'asthma')` khi sinh khuyến cáo chẹn beta cho HFrEF để chỉ hiển thị chẹn beta-1 chọn lọc (`Bisoprolol` / `Metoprolol succinate`) và ẩn gợi ý `(hoặc Carvedilol)` trong tiêu đề.
2. **`ASTHMA-R3-13` (`src/engine/safety/duplicates.ts` — Agent B):** Đề nghị Agent B bổ sung quy tắc `dup.laba` và `dup.lama` dựa trên `DrugEntry.classes` / `components` để phát hiện trùng lặp LABA/LAMA khi chạy đồng thời module `asthma` + `copd`.
3. **Lưu ý kỹ thuật cho Agent B (`src/modules/_demo/index.ts` dòng 25–31):** `src/modules/_demo/index.ts` đang gọi `thFor('ckd.sglt2i.egfr_initiate_min', 'egfr')` ngược thứ tự tham số so với chữ ký `thFor(expectedQuantity, id)` trong `src/kb-types/access.ts`. Đề nghị Agent B đảo lại thành `thFor('egfr', 'ckd.sglt2i.egfr_initiate_min')` để `registry.ts` nạp `_demo` không ném ngoại lệ.
