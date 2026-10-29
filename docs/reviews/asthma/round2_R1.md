# Báo cáo Duyệt Lâm sàng & Guideline Độc lập – VÒNG 2 (Round 2)
## Module: Hen phế quản ở Người lớn và Thanh thiếu niên ≥ 12 tuổi (`asthma`)

- **Người duyệt:** Reviewer R1 – Chuyên gia Hô hấp & Kiểm định Guideline Độc lập (Hội đồng Duyệt GDMT-VN)
- **Ngày duyệt:** 27/10/2026
- **Phạm vi kiểm định:**
  - Mã nguồn: `src/modules/asthma/{index,inputs,rules,matrices,pathways,presets,actionPlan}.ts`
  - Cơ sở tri thức (KB): `kb/citations/asthma.json` (52 trích dẫn), `kb/thresholds/asthma.json` (60 ngưỡng QA-10), 21 hồ sơ thuốc thuộc phân hệ Hen trong `kb/drugs/*.json`
  - Bộ kiểm thử: `tests/modules/asthma/golden.test.ts` (38 ca chuẩn, 79 assertions), `tests/modules/asthma/invariants.test.ts` (17.000 ca bất biến ngẫu nhiên & fail-closed)
  - Tài liệu chuẩn đối chiếu nguyên bản (`Medical_Library_2026`):
    1. **GINA 2026 Strategy Report** (*Global Strategy for Asthma Management and Prevention*, 298 trang PDF)
    2. **GINA 2026 Summary Guide** (47 trang PDF)
    3. **Bộ Y tế QĐ 1851/QĐ-BYT (24/04/2020)** – *Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* (48 trang PDF)
    4. **Bộ Y tế QĐ 5850/QĐ-BYT (24/12/2021)** – *Quy trình lâm sàng chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥ 12 tuổi* (28 trang PDF)

---

## 1. Tóm tắt Kết quả Kiểm định Tự động & Cơ sở Tri thức (KB)

| Hạng mục kiểm tra | Kết quả thực chạy | Đánh giá |
| :--- | :--- | :--- |
| **Xác minh trích dẫn nguyên văn (`52/52` mục trong `kb/citations/asthma.json`)** | **52/52 khớp chính xác (`exact=52, tolerance=0, fail=0`)** đúng từng chữ và đúng số trang PDF khai báo trên cả 4 nguồn (GINA 2026 Report, GINA 2026 Summary, BYT 1851/2020, BYT 5850/2021) | **ĐẠT 100%** |
| **Xác minh ngưỡng lâm sàng QA-10 (`60/60` mục trong `kb/thresholds/asthma.json`)** | **60/60 ngưỡng** có đầy đủ `quantity`, `unit`, `citationIds`; `0` số mồ côi, `0` vi phạm QA-1/7/8/10 trên `npm run verify:kb` | **ĐẠT 100%** |
| **Xác minh 21 hồ sơ thuốc Hen (`kb/drugs/*.json`)** | **21/21 thuốc** có đủ `pregnancy`, `lactation`, `classes`, `renal`, `contraindications`, `citationIds`; đã sửa chuẩn xác `vnBrands` (loại bỏ `Pulmicort Respules` khỏi `beclometasone`, tách liều DPI Accuhaler vs pMDI Evohaler trong `fluticasone_salmeterol`, bổ sung cổng `totalDailyPuffs > 12` cho `beclometasone_formoterol`, cổng SABA đơn trị cho `terbutaline`) | **ĐẠT 100%** |
| **Kiểm thử 38 Golden Cases (`golden.test.ts`)** | **79/79 tests PASS** | **ĐẠT** |
| **Kiểm thử Bất biến An toàn (`invariants.test.ts`)** | **12.000 ca Suite 1 + 5.000 ca Suite 2 = 17.000 ca PASS (`0` vi phạm)** | **ĐẠT** |
| **Thực nghiệm độc lập `evaluate()` Vòng 2 (`docs/reviews/asthma/scratch/`)** | Phát hiện **2 lỗi `critical`**, **3 lỗi `major`**, **2 lỗi `minor`**, **1 `suggestion`** ở các tình huống lâm sàng sát sườn chưa được bao phủ bởi 14 bất biến hiện có | **CHƯA ĐẠT (Cần vá Vòng 2)** |

---

## 2. Hậu kiểm 100% Phát hiện Vòng 1 (`round1_R1`, `round1_R2`, `round1_R3`)

Qua kiểm tra mã nguồn và chạy trực tiếp `evaluate()`, đội phát triển (Agent K, Agent M, Agent B) đã khắc phục triệt để **46/47 mục** của Vòng 1 (1 mục còn lại là hiển thị chuỗi tên thuốc chéo trong module `hf` thuộc Agent G):

### 2.1. Nhóm phát hiện của Reviewer R1 Vòng 1 (`R1-ASTHMA-01` → `R1-ASTHMA-12`)
1. **`R1-ASTHMA-01` (Critical – Đơn vị PEF L/phút vs % trong `actionPlan.ts`):** **ĐÃ KHẮC PHỤC TRIỆT ĐỂ.** Tách rõ `pefBestLMin` (nhân 0.8 / 0.5 ra L/phút, ví dụ 500 → `> 400`, `250 – 395`, `< 250 L/phút`) và `pefPct` (giữ nguyên `> 80%`, `50% – 79%`, `< 50%`, tuyệt đối không nhân ra `64 L/phút`).
2. **`R1-ASTHMA-02` (Major – Thiếu trường `spo2` trên UI `inputs.ts`):** **ĐÃ KHẮC PHỤC.** Đã thêm `customInputs.spo2` và `customInputs.paco2` trong `inputs.ts`.
3. **`R1-ASTHMA-03` (Major – Lỗ hổng Fail-Closed trong `evaluateGinaControl`):** **ĐÃ KHẮC PHỤC.** Chỉ kết luận `well_controlled` hoặc `partly_controlled` khi `answered === 4`; nếu `< 4` và `positive < 3` trả về `missing` và kích hoạt `missingInputRec`.
4. **`R1-ASTHMA-04` (Major – Bậc 5 mất thuốc kiểm soát nền ICS-LABA):** **ĐÃ KHẮC PHỤC.** Bổ sung `asthma.outpatient.step5_controller_continue` giữ đơn ICS-LABA nền song song với `REFER` chuyên khoa LAMA + thuốc sinh học.
5. **`R1-ASTHMA-05` (Major – Hạ bậc thiếu kiểm tra đợt cấp năm qua & mốc 2–3 tháng):** **ĐÃ KHẮC PHỤC.** Chặn hạ bậc khi `exacerbationsLastYear > 0`, `fev1Pct < 60%`, hoặc mang thai; hạ ngưỡng ổn định về `2–3` tháng theo GINA 2026.
6. **`R1-ASTHMA-06` (Major – Thai kỳ thiếu khuyến cáo duy trì ICS):** **ĐÃ KHẮC PHỤC.** Bổ sung `asthma.safety.pregnancy_ics_continuation` (`MONITOR`) và chặn hạ bậc trong thai kỳ.
7. **`R1-ASTHMA-07` (Major – Cơn hen nhẹ-trung bình thiếu Prednisolone uống):** **ĐÃ KHẮC PHỤC.** Bổ sung `asthma.inpatient.mild_moderate_prednisolone` (`40–50 mg/ngày × 5–7 ngày`, không cần giảm liều dần).
8. **`R1-ASTHMA-08` (Minor – Liều Mometasone trong `matrices.ts` & KB):** **ĐÃ KHẮC PHỤC.** Chuẩn hóa theo GINA 2026 Table 6 (`200–400` / `400` mcg pMDI, chú thích rõ dạng DPI `200` / `400` mcg).
9. **`R1-ASTHMA-09` (Minor – Thiếu `profileDiff` VN vs INTL vs US):** **ĐÃ KHẮC PHỤC.** Bổ sung `profileDiff` trên các rule Track 1 và rule `asthma.profile_diff.vietnam`.
10. **`R1-ASTHMA-10` (Minor – Quá liều MART > 12 nhát thiếu `REFER` cấp cứu):** **ĐÃ KHẮC PHỤC** cho Symbicort (`HOLD` + `REFER`), *nhưng còn lỗi khi bệnh nhân dùng Foster (`beclometasone_formoterol`) — xem `R1-ASTHMA-V2-01` bên dưới*.
11. **`R1-ASTHMA-11` (Minor – Chống chỉ định thuốc an thần trong cơn hen cấp):** **ĐÃ KHẮC PHỤC.** Bổ sung `asthma.safety.acute_sedatives_contra` (`AVOID` Benzodiazepine/Opioid/Z-drugs trong đợt cấp).
12. **`R1-ASTHMA-12` (Suggestion – Tư vấn cai thuốc lá & tiêm vắc-xin cúm/phế cầu):** **ĐÃ KHẮC PHỤC.** Đã thêm 2 rule `asthma.lifestyle.smoking_cessation` và `asthma.prevention.vaccination`.

### 2.2. Nhóm phát hiện của Reviewer R2 & R3 Vòng 1 (`R2-01..17` & `R3-01..18`)
- **Cơn hen nguy kịch đe dọa tính mạng (`R2-01`, `R2-05`, `R3-01`, `R3-02`):** Đã phát đồng thời `REFER` ICU (`priority 100`) **cùng đầy đủ 4 y lệnh thuốc cấp cứu độc lập** (`START salbutamol`, `START ipratropium`, `START methylprednisolone`, `START magnesium_sulfate`), có xét tiêu chuẩn tăng thán khí `PaCO₂ > 45 mmHg`.
- **An toàn thiết bị DPI trong Vùng Đỏ Action Plan (`R2-02`, `R3-07`):** Đã sửa hoàn toàn, hướng dẫn hít trực tiếp 1–2 nhát từ bình hít (tuyệt đối không dùng qua buồng đệm, không đổ vào máy khí dung, không hít dồn 4–6 nhát Formoterol).
- **Nội viện không có cơn cấp (`R2-03`):** Khi `isAcuteExacerbation === false`, trả về `[]` (không kê nhầm OCS/SABA cấp cứu).
- **Cấm SABA đơn trị cho cả Terbutaline (`R2-12`) & cấm LABA / LABA-LAMA không kèm ICS (`R3-03`):** Đã quét động toàn bộ `SABA_DRUGS` (`salbutamol`, `terbutaline`) và `LABA_CONTAINING_DRUGS` không kèm ICS → phát `STOP` (`priority 99–100`).
- **Chẹn beta không chọn lọc & Timolol nhỏ mắt (`R2-13`):** Đã phát `AVOID` cho cả viên uống (`carvedilol`, `propranolol`, `nadolol`, `sotalol`, `labetalol`) và thuốc nhỏ mắt `timolol`.
- **Montelukast FDA Boxed Warning (`R2-09`):** Đã sửa toán tử thành `&&` (chỉ cảnh báo khi đang dùng `montelukast` VÀ có tiền sử/nguy cơ tâm thần).
- **Chặn độ tuổi `< 12` & Fail-closed khi thiếu `age` (`R2-07`, `R3-09`, `ADV-AGE-05`):** Đã chặn cả ở ngoại trú lẫn `discharge_plan`, và sinh `missing_input_age` khi `age === undefined`.
- **Hạ bậc chuyển sang `REDUCE` thay vì mâu thuẫn `CONTINUE` vs `CONSIDER` (`R3-10`, `R3-17`):** Đã sửa sang `REDUCE` và chặn hạ bậc khi `FEV₁ < 60%`.
- **Phát hiện trùng lặp bình hít đa chuyên khoa (`R3-13`):** Agent B đã bổ sung `dup.laba`, `dup.lama`, `dup.ics` trong `src/engine/safety/duplicates.ts`.
- **Lưu ý chéo còn tồn đọng ngoài phạm vi module `asthma` (`R3-08`):** Trong `src/modules/hf/rules.ts` line 455 (thuộc Agent G), dù `drugId` đã chọn đúng `'bisoprolol'`, trường `drugNameVi` vẫn giữ chuỗi cố định `"Bisoprolol (hoặc Carvedilol, Metoprolol succinate)"` khi bệnh nhân đồng mắc hen (đã ghi nhận tại mục góp ý `R1-ASTHMA-V2-08`).

---

## 3. Các Phát hiện Mới trong Kiểm định Độc lập Vòng 2

### 3.1. Bảng Tổng hợp Phát hiện Vòng 2

| Mã phát hiện | Mức độ | Phân loại | Thành phần (`itemId`) | Tóm tắt vấn đề cốt lõi |
| :--- | :---: | :---: | :--- | :--- |
| **`R1-ASTHMA-V2-01`** | **CRITICAL** | `rule` | `track1_step1_2..step5` & `mart_max_overuse` | Bệnh nhân dùng Foster (`beclometasone_formoterol` 100/6) bị kê chồng `budesonide_formoterol`: khi quá liều MART (`> 12` nhát/24h) hệ thống vừa `HOLD` Foster vừa `UPTITRATE` Symbicort (bơm thêm Formoterol trên nền ngộ độc cấp); khi khám thường quy gây trùng lặp 2 LABA (`ALERT [critical] dup.laba`). |
| **`R1-ASTHMA-V2-02`** | **CRITICAL** | `rule` | `evaluateAcuteAsthma` & `missing_triage_data` | Vi phạm QA-1 Fail-Closed nội viện: tích `isAcuteExacerbation = true` nhưng bỏ trống toàn bộ sinh hiệu/dấu hiệu nặng (`spo2`, `speechAbility`, `rr`, `pefPct`, `hr`) → hệ thống mặc định coi là cơn hen **Nhẹ – Trung bình**, kê `Salbutamol` pMDI + `Prednisolone` uống và bỏ qua cảnh báo thiếu dữ liệu phân tầng cấp cứu. |
| **`R1-ASTHMA-V2-03`** | **MAJOR** | `rule` | `asthma.safety.aerd_nsaid_contra` | Trái trực tiếp GINA 2026 Section 6 (PDF p. 139, Evidence B): xếp nhầm thuốc ức chế chọn lọc COX-2 (`celecoxib`, `etoricoxib`) vào nhóm "NSAID ức chế COX-1" và phát lệnh `STOP` chống chỉ định tuyệt đối ở bệnh nhân AERD thay vì `MONITOR` (giám sát liều đầu ≥ 2 giờ). |
| **`R1-ASTHMA-V2-04`** | **MAJOR** | `rule` | `track1_step3`, `track1_step4` & `preset_2` | Phát `UPTITRATE budesonide_formoterol` cho bệnh nhân chưa từng dùng hoạt chất này (đang dùng `budesonide` đơn chất hoặc `fluticasone_salmeterol`) mà không phát lệnh `STOP`/`SWITCH` bình hít cũ → nổ cảnh báo trùng lặp ICS ngay trên **Ca mẫu số 2 (`preset_asthma_uncontrolled_step2`)** hoặc trùng lặp 2 LABA. |
| **`R1-ASTHMA-V2-05`** | **MAJOR** | `rule` | `track1_step1_2..step4` & `track2_regimen` | Bệnh nhân Hen **Kiểm soát một phần** (`1–2/4` tiêu chí GINA) dù tuân thủ tốt, kỹ thuật đúng — kể cả ở Bậc 3–4 kèm `≥ 1` đợt cấp nặng năm qua và `FEV₁ < 60%` — chỉ nhận lệnh `CONTINUE` thụ động mà không có khuyến cáo `CONSIDER` nâng bậc theo GINA 2026 & BYT QĐ 1851/2020 (trang 21, 23). |
| **`R1-ASTHMA-V2-06`** | **MINOR** | `rule` | `asthma.inpatient.discharge_plan` | Đơn xuất viện lấy cố định `budForm.forms[1]` (`Rapihaler` pMDI), bỏ sót dạng `Turbuhaler` DPI (`forms[0]`) phổ biến nhất tại Việt Nam. |
| **`R1-ASTHMA-V2-07`** | **MINOR** | `ui` | `asthma.action_plan.generate` | Bản Kế hoạch hành động truyền tĩnh tên thuốc Symbicort và liều chung `"1–2 nhát x 2 lần/ngày"`, chưa cá thể hóa khi bệnh nhân dùng Foster 100/6 hoặc ở Bậc 1–2 AIR-only / Bậc 4. |
| **`R1-ASTHMA-V2-08`** | **SUGGESTION** | `citation` | `kb/citations/asthma.json` & liên module `hf`/`duplicates` | Ghi chú chuẩn hóa trường `cor` cho tài liệu GINA/BYT và chuyển tiếp 2 lưu ý chéo cho Agent G (`hf.fmt.bb` `drugNameVi`) & Agent B (`duplicates.ts` xử lý `SWITCH`). |

---

### 3.2. Phân tích Lâm sàng & Bằng chứng Chi tiết Từng Phát hiện

#### [CRITICAL] `R1-ASTHMA-V2-01` — Mâu thuẫn y lệnh nguy hiểm (`HOLD` Foster + `UPTITRATE` Symbicort) khi ngộ độc liều MART và trùng lặp 2 LABA ở bệnh nhân dùng Foster (`beclometasone_formoterol`)
- **Vị trí mã nguồn:** `src/modules/asthma/rules.ts` (lines 467–470, 1312, 1413, 1499, 1598).
- **Cơ chế lỗi & Tái hiện trên `evaluate()`:**
  - Rule `asthma.safety.mart_max_overuse` (lines 467–470) đã được cập nhật để nhận diện bệnh nhân đang dùng `beclometasone_formoterol` (Foster 100/6 mcg) và phát lệnh `HOLD` với `drugId: 'beclometasone_formoterol'`.
  - Tuy nhiên, toàn bộ 4 rule phác đồ ngoại trú Track 1 (`track1_step1_2`, `track1_step3`, `track1_step4`, `step5_controller_continue`) đều **gán cứng `drugId: 'budesonide_formoterol'`** và **không có điều kiện chặn khi `totalDailyPuffsUsed > 12`**.
  - **Tình huống 1 (Quá liều cấp tính Formoterol – `totalDailyPuffsUsed = 14` nhát Foster = 84 mcg Formoterol định liều/24h):** Chạy `evaluate()` sinh ra đồng thời:
    1. `[99] REFER rec_asthma_mart_overuse_refer`: Báo động chuyển Cấp cứu ngay.
    2. `[98] HOLD beclometasone_formoterol`: Tạm ngưng hít Foster vượt trần.
    3. **`[86] UPTITRATE budesonide_formoterol` (`160/4.5 mcg: 2 nhát x 2 lần/ngày duy trì + 1 nhát khi cần cắt cơn`)**!
    Do `merge.ts` chỉ gộp theo từng `drugId` riêng rẽ, lệnh `HOLD` trên `beclometasone_formoterol` không triệt tiêu lệnh `UPTITRATE` trên `budesonide_formoterol`, dẫn đến chỉ định kê thêm Formoterol ngay trên bệnh nhân đang quá liều Formoterol cấp (nguy cơ hạ kali máu và loạn nhịp thất).
  - **Tình huống 2 (Khám ngoại trú thường quy – `totalDailyPuffsUsed <= 12`):** Mọi bệnh nhân Track 1 đang dùng `beclometasone_formoterol` (Foster 100/6 mcg — chế phẩm MART hợp lệ theo GINA 2026 Summary Guide Table 7 p. 45 và BYT QĐ 1851/2020 p. 25) đều bị hệ thống kê chồng `budesonide_formoterol` mà không ngừng Foster, làm nổ **`ALERT [critical] dup.laba: Trùng lặp thành phần LABA giữa các bình hít`**.
- **Hướng xử lý đề xuất:**
  1. Thêm điều kiện chặn trong `when()` của các rule kiểm soát ngoại trú Track 1: nếu `totalDailyPuffsUsed > thFor('inhalations_count', 'asthma.formoterol.mart_max_inhalations')` thì `return false` (nhường quyền tuyệt đối cho `HOLD` + `REFER` cấp cứu).
  2. Ở Bậc 3–5 Track 1, nếu bệnh nhân đang duy trì `beclometasone_formoterol` (mà không dùng `budesonide_formoterol`), giữ nguyên `drugId: 'beclometasone_formoterol'` (`100/6 mcg`, 1 nhát × 2 lần/ngày + PRN ở Bậc 3; 2 nhát × 2 lần/ngày + PRN ở Bậc 4–5, tối đa 12 nhát/ngày).

---

#### [CRITICAL] `R1-ASTHMA-V2-02` — Lỗ hổng Fail-Closed (QA-1) trong phân tầng đợt cấp nội viện: Mặc định coi là cơn hen "Nhẹ – Trung bình" khi bỏ trống toàn bộ sinh hiệu cấp cứu
- **Vị trí mã nguồn:** `src/modules/asthma/rules.ts` (`evaluateAcuteAsthma` lines 259–282; `asthma.inpatient.missing_triage_data` lines 984–1004; `mild_moderate_exacerbation` lines 1010–1019).
- **Cơ chế lỗi & Tái hiện trên `evaluate()`:**
  - Trong `evaluateAcuteAsthma(ctx)`, biến `hasExplicitAcuteData` (line 260) trả về `true` ngay khi bác sĩ tích chọn ô `isAcuteExacerbation === true`, dù **toàn bộ các thông số đánh giá mức độ nặng** (`speechAbility`, `spo2`, `respiratoryRate`, `hr`, `pefPct`, `fev1Pct`, `paco2`, `mentalStatus`, `silentChest`, `accessoryMuscleUse`) đều đang `undefined`.
  - Khi các thông số này đều `undefined`, biểu thức `isSevere` (lines 273–279) trả về `false`. Hệ quả là `missing_triage_data` (`!triage.hasAcuteAttack`) bị tắt hoàn toàn, và hệ thống lập tức phát phác đồ **Cơn hen cấp nhẹ – trung bình** (`START salbutamol` 4–10 nhát pMDI + `START prednisolone` uống) mà không có bất kỳ cảnh báo thiếu `SpO₂` hay `speechAbility` nào!
  - **Nguy cơ lâm sàng:** Trên giao diện thực tế, ngay khoảnh khắc bác sĩ cấp cứu tích chọn *"Đang trong đợt cấp hen phế quản"* (hoặc bệnh án thiếu dữ liệu sinh hiệu), hệ thống kết luận mù là cơn hen nhẹ - trung bình thay vì yêu cầu nhập `SpO₂` / khả năng nói / nhịp thở để loại trừ suy hô hấp cấp nặng (cần thở oxy, khí dung Salbutamol + Ipratropium, Methylprednisolone tĩnh mạch, MgSO₄ và hồi sức ICU theo BYT QĐ 5850/2021 trang 17).
- **Hướng xử lý đề xuất:**
  - Khi `!isLifeThreatening` và `ci.isAcuteExacerbation !== false`, bắt buộc phải có dữ liệu lâm sàng phân tầng thực tế (ít nhất `spo2 !== undefined` hoặc `speech !== undefined` — khuyến nghị yêu cầu tối thiểu `spo2` và `speechAbility` qua `missingInputRec`) trước khi cho phép kết luận `isSevere === false` để kê phác đồ Nhẹ – Trung bình. (Cả 6 ca golden nội viện cấp `16, 17, 18, 26, 29, 33` đều đã khai báo đầy đủ `speechAbility`, `respiratoryRate` và `spo2`, đảm bảo không gây hồi quy test).

---

#### [MAJOR] `R1-ASTHMA-V2-03` — Sai lệch trực tiếp GINA 2026 (Section 6 – AERD, PDF p. 139): Cấm tuyệt đối (`STOP`) thuốc ức chế chọn lọc COX-2 (`celecoxib`, `etoricoxib`) và gọi nhầm là chất ức chế COX-1
- **Vị trí mã nguồn:** `src/modules/asthma/rules.ts` (lines 84–95 và lines 591–625).
- **Đối chiếu nguyên văn GINA 2026 Strategy Report (Section 6, PDF trang 139 / trang in 138):**
  > *"Patients with AERD should avoid aspirin or NSAID-containing products and other medications that inhibit cyclooxygenase-1 (COX-1), but this does not prevent progression of the disease. **Where an NSAID is indicated for other medical conditions, a COX-2 inhibitor (e.g., celecoxib or etoricoxib), or paracetamol (acetaminophen), may be considered, with appropriate healthcare provider supervision and observation for at least 2 hours after administration (Evidence B).**"*
- **Thực tế trên mã nguồn & `evaluate()`:** `AERD_NSAID_DRUGS` gộp cả `'celecoxib'` và `'etoricoxib'` chung với nhóm ức chế COX-1. Khi bệnh nhân AERD đang được bác sĩ cơ xương khớp/gút kê `celecoxib 200 mg` đúng chuẩn GINA 2026 làm thuốc thay thế an toàn, `evaluate()` phát lệnh `STOP celecoxib` (`priority 100`: *"NGƯNG NGAY Celebrex: Chống chỉ định tuyệt đối ở bệnh nhân Hen nhạy cảm Aspirin (AERD)"*) và giải thích sai về mặt dược lý rằng thuốc thuộc nhóm *"NSAID ức chế COX-1"*.
- **Hướng xử lý đề xuất:** Tách `'celecoxib'` và `'etoricoxib'` ra khỏi `AERD_NSAID_DRUGS` (`STOP`). Bổ sung nhánh xử lý riêng cho nhóm coxib chọn lọc COX-2 ở bệnh nhân AERD: phát khuyến cáo `MONITOR` (hoặc `CONSIDER`) hướng dẫn chỉ sử dụng khi có chỉ định kháng viêm rõ ràng và phải giám sát y tế tối thiểu **2 giờ** sau liều đầu tiên (bổ sung citation nguyên văn GINA 2026 Strategy Report PDF p. 139, Evidence B).

---

#### [MAJOR] `R1-ASTHMA-V2-04` — Lỗi ngữ nghĩa `UPTITRATE` và bỏ sót lệnh ngừng bình hít cũ khi nâng bậc sang ICS-LABA (tái hiện trực tiếp trên Ca mẫu số 2 `preset_asthma_uncontrolled_step2`)
- **Vị trí mã nguồn:** `src/modules/asthma/rules.ts` (lines 1384–1392, 1482–1488) & `src/modules/asthma/presets.ts` (lines 50–90).
- **Thực tế khi chạy `evaluate()` trên Ca mẫu số 2 (`preset_asthma_uncontrolled_step2`):**
  - Bệnh nhân Trần Thị B (32 tuổi) đang dùng đơn chất `budesonide` (`200 mcg x 2 lần/ngày`) ở Bậc 2 không kiểm soát.
  - Rule `track1_step3` phát `UPTITRATE budesonide_formoterol` (dù bệnh nhân chưa hề dùng `budesonide_formoterol`!). Vì `merge.ts` (line 673) chỉ tự động sinh lệnh `SWITCH` thu hồi bình hít cũ khi bình hít mới mang hành động `START`, nên đơn thuốc đầu ra **không hề có lệnh `STOP` hay `SWITCH` cho `budesonide`**.
  - Kết quả là ngay trên Ca mẫu số 2 trình diễn cho bác sĩ, hệ thống báo động vàng **`ALERT [warning] dup.ics: Trùng lặp thành phần Corticoid hít (ICS) giữa các bình hít`**. Nghiêm trọng hơn, nếu bệnh nhân ở Bậc 2–3 đang dùng `fluticasone_salmeterol` (Seretide) chuyển sang Track 1 MART, `track1_step3`/`track1_step4` phát `UPTITRATE budesonide_formoterol` mà không ngừng Seretide, để lọt 2 LABA cùng lúc (`ALERT [critical] dup.laba`).
- **Hướng xử lý đề xuất:** Chỉ phát `UPTITRATE` khi bệnh nhân thực sự đang có chính `drugId` đó trong `currentMeds`; ngược lại phát `START` kèm thu hồi (`STOP`/`SWITCH`) các bình hít ICS đơn chất hoặc ICS-LABA cũ bị thay thế (đồng bộ lại kỳ vọng `action` trong `asthma_03_track1_step3_moderate.json`).

---

#### [MAJOR] `R1-ASTHMA-V2-05` — Thiếu khuyến cáo xem xét nâng bậc (`CONSIDER` step-up) cho bệnh nhân Hen "Kiểm soát một phần" (`1–2/4` tiêu chí GINA) hoặc còn đợt cấp nặng ở Bậc 3–4 dù tuân thủ và kỹ thuật hít tốt
- **Vị trí mã nguồn:** `src/modules/asthma/rules.ts` (lines 1297, 1372, 1472, 1664–1675).
- **Bằng chứng Guideline & Lâm sàng:**
  - Theo **Bộ Y tế QĐ 1851/2020** (trang 21 – *Tăng bậc điều trị* & trang 23 – *Bệnh nhân có ít nhất 1 đợt cấp hen trong năm qua*: *"dùng ICS/formoterol vừa duy trì vừa cắt cơn; hoặc tăng bậc điều trị nếu không có yếu tố nguy cơ có thể thay đổi được"*) và **GINA 2026 Strategy Report** (Box 2-2, Section 4 p. 111), khi bệnh nhân chỉ đạt **Kiểm soát một phần** (`1–2/4` tiêu chí, ví dụ: thức giấc ban đêm do hen + triệu chứng ban ngày > 2 lần/tuần) hoặc vẫn bị đợt cấp nặng (`exacerbationsLastYear >= 1`) ở Bậc 3–4 dù đã hít đúng kỹ thuật và tuân thủ tốt, bác sĩ cần **xem xét nâng bậc điều trị dài hạn (thử nghiệm 2–3 tháng)** sau khi rà soát bệnh đồng mắc và phơi nhiễm dị nguyên.
  - Hiện tại trên `evaluate()`, cả bệnh nhân Bậc 2 lẫn bệnh nhân Bậc 3 MART có `2/4` tiêu chí triệu chứng + `2` đợt cấp nặng/năm + `FEV₁ = 55%` (với kỹ thuật đúng và tuân thủ tốt) đều chỉ nhận duy nhất lệnh `CONTINUE` giữ nguyên phác đồ hiện tại, giống hệt một bệnh nhân kiểm soát hoàn toàn (`0/4` tiêu chí).
- **Hướng xử lý đề xuất:** Bổ sung 1 rule tư vấn lâm sàng `CONSIDER` không gắn `drugId` (ví dụ `asthma.outpatient.partly_controlled_step_up_consider`) khi `score.level === 'partly_controlled'` (hoặc `currentStep >= 3 && exacerbationsLastYear >= 1`) trên nền `inhalerTechniqueCorrect !== false && goodAdherence !== false && currentStep >= 1 && currentStep <= 4`, hướng dẫn cân nhắc nâng 1 bậc điều trị trong 2–3 tháng.

---

#### Các phát hiện mức `MINOR` & `SUGGESTION` (`R1-ASTHMA-V2-06`, `R1-ASTHMA-V2-07`, `R1-ASTHMA-V2-08`)
- **`R1-ASTHMA-V2-06` (Minor – `asthma.inpatient.discharge_plan`):** Lines 1121 & 1124 chỉ nội suy `budForm.forms[1]` (`Rapihaler` pMDI), nên bổ sung cả `Turbuhaler` DPI (`forms[0]`) vì đây là dụng cụ MART phổ biến nhất tại các bệnh viện Việt Nam.
- **`R1-ASTHMA-V2-07` (Minor – `asthma.action_plan.generate`):** Lines 1971–1986 nên nội suy động tên thuốc kiểm soát/cắt cơn (hỗ trợ cả Foster 100/6, Relvar, ICS đơn chất) và liều duy trì chính xác theo từng bậc thay vì ghi chung `"1–2 nhát x 2 lần/ngày (hoặc chỉ hít khi cần ở Bậc 1–2)"`.
- **`R1-ASTHMA-V2-08` (Suggestion – Metadata & Liên module):** (1) Trường `cor` trong `kb/citations/asthma.json` đang quy ước `"1"` / `"III"` cho văn bản GINA/BYT; (2) Chuyển tiếp cho Agent G tinh chỉnh `drugNameVi` của `hf.fmt.bb` (`src/modules/hf/rules.ts` line 455) ẩn chữ `"Carvedilol"` khi `conditions.asthma === true`, và chuyển tiếp cho Agent B tinh chỉnh `src/engine/safety/duplicates.ts` line 381 không cộng lệnh `SWITCH` mang `drugId` thuốc cũ của `merge.ts` vào tập thuốc đang dùng hiệu lực.

---

## 4. Phán quyết Kiểm định Vòng 2 (Final Verdict)

- **Tổng số phát hiện Vòng 2:** **8** (`2 critical`, `3 major`, `2 minor`, `1 suggestion`).
- Theo tiêu chuẩn bắt buộc tại `docs/REVIEW_PROTOCOL.md` (chỉ thông qua khi `0 critical` và `0 major`), kết quả kiểm định Vòng 2 của Reviewer R1 đối với module `asthma` là:

# **FAIL**
