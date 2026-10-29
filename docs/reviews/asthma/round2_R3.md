# Báo Cáo Kiểm Định Độc Lập Vòng 2 – Vai R3 (Adversarial Safety Reviewer)
## Module: Hen Phế Quản Người Lớn & Thanh Thiếu Niên ≥ 12 Tuổi (`asthma`)

- **Người kiểm định**: Reviewer R3 – Chuyên gia Phản biện An toàn Đối kháng Độc lập (Vòng 2)
- **Ngày kiểm định**: 2026-10-27
- **Phạm vi kiểm định**: `src/modules/asthma/**`, tương tác thực tế qua pipeline `evaluate()` (`src/engine/**`), và cơ sở tri thức `kb/{thresholds,citations,drugs}` liên quan đến Hen phế quản.
- **Tài liệu đối chiếu chuẩn**: GINA 2026 Strategy Report, Bộ Y tế QĐ 1851/QĐ-BYT (2020), Bộ Y tế QĐ 5850/QĐ-BYT (2021), `docs/REVIEW_PROTOCOL.md`, `docs/QA_FINDINGS.md`, và kết quả hậu kiểm Vòng 1 (`round1_R1.md`, `round1_R2.md`, `round1_R3.md`, `round1_RESPONSE.md`).
- **Tính độc lập**: Tuân thủ tuyệt đối quy chế độc lập Vòng 2 (không đọc bất kỳ tài liệu nào của R1/R2 Vòng 2; không chỉnh sửa `src/**` hoặc `kb/**`).
- **Bộ kịch bản thực thi (`evaluate()` thật qua `vite-node`)**:
  - `docs/reviews/asthma/scratch/round2_r3_adversarial_runner.ts`: **5 Preset chính thức + 66 kịch bản bệnh nhân đối kháng (`R2-ADV-01` → `R2-ADV-66`)**.
  - `docs/reviews/asthma/scratch/round2_r3_deep_probes.ts`: **20 kịch bản thăm dò chuyên sâu (`R2-PROBE-01` → `R2-PROBE-20`)**.
  - **Tổng cộng**: **91 ca kiểm thử thực tế chạy qua `evaluate()`**.

---

## Tóm Tắt Điều Hành & Thống Kê Phát Hiện Vòng 2

Bản sửa lỗi sau Vòng 1 (`round1_RESPONSE.md`) đã giải quyết rất tốt nhiều lỗi cốt lõi trước đó: sửa dứt điểm lỗi nhân nhầm `pefPct` thành `64 L/phút` và lỗi xịt bình bột khô DPI qua buồng đệm ở Vùng Đỏ Action Plan; bổ sung trường `spo2` và `paco2` vào giao diện; tách riêng 4 y lệnh thuốc cấp cứu kèm báo động ICU khi cơn hen nguy kịch; chặn tuổi `< 12` và `age === undefined` ở đơn xuất viện và Action Plan; chặn hạ bậc ở phụ nữ mang thai và bệnh nhân nguy cơ đợt cấp cao; bổ sung kiểm tra LABA đơn trị, Timolol nhỏ mắt glôcôm, AERD đơn chất, và hòa giải rất tốt đồng mắc Hen – COPD (`ACO` bổ sung Tiotropium trên nền ICS-formoterol không trùng LABA).

Tuy nhiên, khi đẩy qua **91 kịch bản đối kháng thực chiến** (đặc biệt là bệnh nhân cấp cứu đã có sẵn thuốc tại nhà trong `currentMeds`, dữ liệu nội viện mâu thuẫn hoặc mặc định rỗng, thất bại điều trị sau 1 giờ `poor_response`, bệnh nhân ngoại trú Track 1 không kiểm soát kèm sai kỹ thuật hít/kém tuân thủ, và bệnh nhân dùng đồng thời ≥ 2 thuốc chống chỉ định), hệ thống bộc lộ **18 phát hiện mới**, trong đó có **6 lỗi Nghiêm trọng (`critical`)** và **7 lỗi Lớn (`major`)**:

| Mức độ (`severity`) | Số lượng | Mã phát hiện (`id`) |
|---|---:|---|
| **Critical** *(có thể gây hại trực tiếp cho BN nếu làm theo)* | **6** | `ASTHMA-R2-R3-01` → `ASTHMA-R2-R3-06` |
| **Major** *(sai guideline/liều, mất cảnh báo thận/ICU, báo giả Class III hoặc mâu thuẫn y lệnh)* | **7** | `ASTHMA-R2-R3-07` → `ASTHMA-R2-R3-13` |
| **Minor** *(sai lệch chú giải `helpVi` UI, biên fail-closed 3/4 GINA, cổng chéo AERD)* | **3** | `ASTHMA-R2-R3-14` → `ASTHMA-R2-R3-16` |
| **Suggestion** *(tối ưu đích SpO₂ thai kỳ cấp cứu & giữ ICS hiện hành ở Track 2 Bậc 2)* | **2** | `ASTHMA-R2-R3-17` → `ASTHMA-R2-R3-18` |
| **TỔNG CỘNG** | **18** | Kết luận Vòng 2: **FAIL** |

---

## Phần 1. Hậu Kiểm Toàn Diện Các Lỗi Đã Nêu Ở Vòng 1

| Nhóm lỗi Vòng 1 (R1/R2/R3) | Trạng thái hậu kiểm thực nghiệm trên `evaluate()` | Nhận xét độc lập Vòng 2 |
|---|---|---|
| **R3-01 / R1-02 / R2-01**: Cơn hen nguy kịch (`silentChest`, `drowsy_confused`, `unable`, `PaCO₂ > 45`) thiếu ICU / gộp thuốc | **ĐẠT ở BN chưa có thuốc nền** (`R2-ADV-17..21`), **NHƯNG LỖI MỚI khi có `currentMeds` hoặc `good_response` cũ** | Khi `currentMeds` rỗng, xuất đủ `REFER` ICU + 4 y lệnh `START` (`salbutamol`, `ipratropium`, `methylprednisolone`, `magnesium_sulfate`) và ẩn Action Plan. Tuy nhiên nếu `currentMeds` có sẵn `salbutamol`/`methylprednisolone` tại nhà, `merge.ts` ghi đè mất sạch liều cấp cứu (`ASTHMA-R2-R3-01`); nếu chọn nhầm `good_response`, hệ thống cho xuất viện BN đang lồng ngực câm (`ASTHMA-R2-R3-02`). |
| **R3-02 / R3-12**: Thiếu `spo2`, `paco2` trên UI; ngưỡng `pefPct < 50` bỏ sót `50%` | **ĐÃ KHẮC PHỤC TỐT** (`R2-ADV-19, 20, 28`) | Đã có `spo2`, `paco2` trong `inputs.ts`; `pefOrFev1 <= 50%` và `paco2 > 45 mmHg` hoạt động chính xác (`PaCO₂ = 46` kích hoạt ICU, `PEF = 50%` kích hoạt cơn nặng). |
| **R3-03**: Bỏ lọt LABA đơn trị / LABA-LAMA không kèm ICS | **ĐÃ KHẮC PHỤC** (`R2-ADV-44, 45`), **CÒN LỖI `.find()` & `setting`** | Đã `STOP` khi có 1 LABA/LABA-LAMA đơn độc ngoại trú; nhưng dùng `.find()` nên bỏ sót thuốc thứ 2 (`ASTHMA-R2-R3-06`) và chưa chạy ở nội viện ổn định (`ASTHMA-R2-R3-12`). |
| **R3-04 / R1-06**: Trẻ `< 12` tuổi hoặc `age === undefined` lọt đơn xuất viện & Action Plan | **ĐÃ KHẮC PHỤC ĐƠN THUỐC** (`R2-ADV-01..08`), **LƯU Ý BÁO ĐỘNG ICU** | Chặn 100% đơn thuốc người lớn & Action Plan cho trẻ `< 12` tuổi và `age === undefined`. Tuy nhiên ở BN cấp cứu nguy kịch chưa kịp nhập tuổi (`R2-PROBE-15a`), khóa luôn cả cảnh báo phi-dược-lý `REFER` ICU (`ASTHMA-R2-R3-13`). |
| **R3-05 / R1-03**: GINA 0–3/4 câu hỏi chưa trả lời đủ nhưng tự điền `false` | **ĐÃ KHẮC PHỤC 95%** (`R2-ADV-09..15`) | 0/4, 1/4, 2/4 và 3/4 câu (khi `< 3` câu dương tính) đều fail-closed chuẩn xác; chỉ còn nhánh sớm `3/4` câu đều `true` (`ASTHMA-R2-R3-15`). |
| **R3-06 / R1-01 & R3-07 / R2-02**: Nhân nhầm `pefPct` ra `64 L/phút` & lắp buồng đệm/khí dung cho DPI Turbuhaler | **ĐÃ KHẮC PHỤC HOÀN TOÀN** (`R2-ADV-65`) | Đơn vị `%` vs `L/phút` chuẩn xác tuyệt đối; Vùng Đỏ Track 1 cấm lắp buồng đệm cho DPI và giới hạn an toàn `1–2 nhát` trước khi gọi 115. |
| **R3-08 / R3-13**: Suy tim gợi ý Carvedilol trên BN hen; bỏ sót Timolol nhỏ mắt glôcôm | **ĐÃ KHẮC PHỤC** (`R2-ADV-46, 47, 54, 55`), **CÒN LỖI `.find()`** | Module `hf` đã ẩn Carvedilol khi có hen; Timolol nhỏ mắt bị chặn khi dùng đơn lẻ, nhưng bị bỏ lọt nếu đi kèm 1 BB đường uống đứng trước trong `currentMeds` (`ASTHMA-R2-R3-06`). |
| **R3-09 / R3-15**: Bậc 5 đánh rơi thuốc nền ICS-LABA; bỏ sót `patient.eos` & `FeNO` | **ĐÃ KHẮC PHỤC KHI KHÔNG KIỂM SOÁT** (`Preset 3`, `R2-ADV-66`), **PHÁT SINH MÂU THUẪN KHI ỔN ĐỊNH** | Khi Bậc 5 không kiểm soát, giữ `CONTINUE`/`UPTITRATE` ICS-LABA + `REFER` LAMA/Biologic rất tốt. Nhưng khi Bậc 5 đã kiểm soát tốt 6 tháng (`R2-ADV-62`), Rule 21B vẫn nổ mâu thuẫn với lệnh hạ bậc (`ASTHMA-R2-R3-10`). |
| **R3-10 / R1-16**: Thiếu cảnh báo thai kỳ & nguy cơ tự ý hạ bậc trong thai kỳ | **ĐÃ KHẮC PHỤC RẤT TỐT** (`R2-ADV-56, 57`, `R2-PROBE-11`) | Thai phụ Bậc 3–4 ổn định được giữ `CONTINUE`, có khuyến cáo thai kỳ riêng, chặn hoàn toàn hạ bậc (`REDUCE`), nhưng vẫn cho phép tăng bậc (`UPTITRATE`) nếu hen không kiểm soát. |
| **R3-11 / R1-05**: Mâu thuẫn hạ bậc `CONTINUE` vs `CONSIDER` & hạ bậc khi `FEV₁ < 60%` / có đợt cấp | **ĐÃ KHẮC PHỤC CHẶN NGUY CƠ** (`R2-ADV-63`) | Đã chặn hạ bậc khi `exacerbationsLastYear > 0` hoặc `fev1Pct < 60%`; Track 1 Bậc 3–4 đổi sang `REDUCE` khớp liều, nhưng Track 2 Bậc 3–4 và Bậc 5 quên giảm chuỗi `dose` (`ASTHMA-R2-R3-10`). |
| **R3-14 / R1-15**: Thiếu cảnh báo trùng 2 LABA & AERD | **ĐÃ BỔ SUNG** (`R2-ADV-36, 37, 50, 51`), **CÒN LỖI TRIPLE & `.find()`** | Đã bắt trùng 2 LABA đôi và AERD 1 thuốc; nhưng `LABA_ALL_DRUGS` quên bình hít bộ ba Triple (`ASTHMA-R2-R3-12`) và `aerd_nsaid_contra` dùng `.find()` bỏ lọt NSAID thứ 2 (`ASTHMA-R2-R3-06`). |
| **R2-03**: Nội viện luôn kê Prednisolone + SABA cho BN hen ổn định mổ chương trình | **ĐẠT khi `isAcuteExacerbation = false`** (`R2-ADV-31`), **LỖI khi dùng Fentanyl hoặc chưa gạt cờ** | Khi `isAcuteExacerbation = false` không kê nhầm Prednisolone/SABA; nhưng lại báo giả cấm Fentanyl trong cơn hen cấp (`ASTHMA-R2-R3-09`), và nếu nhập viện vì Suy tim (`SpO₂ 98%, RR 16`) chưa gạt cờ thì vẫn kê nhầm Prednisolone 50 mg (`ASTHMA-R2-R3-05`). |

---

## Phần 2. Phân Tích Chi Tiết 18 Phát Hiện Mới Tại Vòng 2

### A. Nhóm Mức Độ CRITICAL (6 Phát Hiện)

#### 1. `[ASTHMA-R2-R3-01]` [CRITICAL] [ASTHMA + ENGINE] `merge.ts` ghi đè xóa sạch liều cấp cứu sinh tử (Salbutamol khí dung + Oxy, Methylprednisolone 40 mg TM) và liều nâng bậc MART xuất viện khi bệnh nhân có sẵn thuốc trùng tên tại nhà
- **Vị trí lỗi**: `src/engine/merge.ts` (dòng 509–520) tương tác trực tiếp với `src/modules/asthma/rules.ts` (`asthma.acute.severe_bundle`, `asthma.acute.severe_steroid_iv`, `asthma.acute.mild_moderate`, `asthma.inpatient.discharge_plan`).
- **Cơ chế gây hại**: Hầu hết bệnh nhân hen nhập Cấp cứu đều đang có sẵn bình xịt `salbutamol` (`100 mcg 1-2 nhát khi cần`) trong danh sách thuốc đang dùng (`currentMeds`), hoặc đang uống `methylprednisolone` liều thấp (`4 mg`), hoặc dùng `budesonide_formoterol` khi cần (`AIR`). Tại Bước 1 của `mergeRecommendations()`, hễ thấy `r.action === 'START'` trùng `drugId` với `currentMeds`, Engine tự động đổi `action` thành `'CONTINUE'`, **xóa toàn bộ `r.dose` và `r.title` cấp cứu** để chèn `curMed.dose` cũ vào!
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **Ca `R2-ADV-22`** (`setting: 'inpatient'`, lồng ngực câm `silentChest: true, spo2: 81%, paco2: 56 mmHg`, `currentMeds`: Salbutamol `100 mcg 1-2 nhát khi cần` + Methylprednisolone `4 mg uống hàng ngày`):
    - Đầu ra thực tế:
      - `[CONTINUE:salbutamol] (rec_asthma_acute_severe_bundle) TIẾP TỤC DUY TRÌ Salbutamol (Albuterol) [Liều hiện tại: 100 mcg 1-2 nhát khi cần] | Dose=100 mcg 1-2 nhát khi cần` *(mất hoàn toàn khí dung liên tục 5 mg + thở oxy đích SpO₂ 93–95%!)*
      - `[CONTINUE:methylprednisolone] (rec_asthma_acute_severe_steroid_iv) TIẾP TỤC DUY TRÌ Methylprednisolone [Liều hiện tại: 4 mg uống hàng ngày] | Dose=4 mg uống hàng ngày` *(mất hoàn toàn liều tiêm tĩnh mạch 40 mg cấp cứu!)*
  - **Ca `R2-ADV-35`** (`setting: 'inpatient'`, hồi phục xuất viện `good_response`, ở nhà đang dùng Symbicort `160/4.5 mcg 1 nhát khi cần`):
    - Đầu ra thực tế: `[CONTINUE:budesonide_formoterol] (rec_asthma_discharge_plan) ... | Dose=160/4.5 mcg 1 nhát khi cần` *(mất hoàn toàn chỉ định nâng bậc lên MART duy trì `1–2 nhát x 2 lần/ngày` sau đợt cấp theo GINA 2026!)*.
- **Đề xuất khắc phục**:
  1. Tại `src/modules/asthma/rules.ts`: ở các luật xử trí đợt cấp nội viện và `discharge_plan`, kiểm tra nếu `drugId` đã tồn tại trong `ctx.patient.currentMeds` thì phát `action: 'UPTITRATE'` thay vì `'START'` (vì `merge.ts` giữ nguyên 100% `title` và `dose` đối với `'UPTITRATE'`).
  2. Tại `src/engine/merge.ts` (dòng 509): không ghi đè `r.dose` và `r.title` bằng liều ngoại trú cũ khi `setting === 'inpatient'` hoặc khi y lệnh mới là phác đồ cấp cứu nội viện.

---

#### 2. `[ASTHMA-R2-R3-02]` [CRITICAL] [ASTHMA MODULE] Cho xuất viện bệnh nhân đang trong cơn hen nguy kịch (`silentChest = true, SpO₂ = 82%, PaCO₂ = 56 mmHg`) khi cờ `acuteResponseAfter1h = 'good_response'` bị chọn nhầm hoặc lưu trạng thái cũ
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 226 trong `evaluateAcuteAsthma()` và dòng 1004 trong `asthma.inpatient.discharge_plan`).
- **Cơ chế gây hại**: Dòng đầu tiên của `evaluateAcuteAsthma()` kiểm tra `if (ci.acuteResponseAfter1h === 'good_response') return { hasAcuteAttack: false, isSevere: false, isLifeThreatening: false };` **trước khi** xét `isLifeThreatening` và `isSevere`. Nếu bác sĩ nhập sinh hiệu xấu đi sau đó hoặc chọn nhầm dropdown `good_response` trên một bệnh nhân đang lồng ngực im lặng, lơ mơ, `SpO₂ = 82%`, `PaCO₂ = 56 mmHg`, hệ thống tắt sạch báo động ICU và phát lệnh cho bệnh nhân xuất viện về nhà!
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **Ca `R2-ADV-23`**: Input `silentChest: true, mentalStatus: 'drowsy_confused', spo2: 82, paco2: 56, acuteResponseAfter1h: 'good_response'` → Output: `RECS(2): [START:budesonide_formoterol] (rec_asthma_discharge_plan) Kế hoạch xuất viện... ;; [MONITOR] (rec_asthma_action_plan_doc)` — **0 cảnh báo ICU, 0 thuốc cấp cứu**.
- **Đề xuất khắc phục**: Đưa toàn bộ khối kiểm tra `isLifeThreatening` và các dấu hiệu sinh tồn nặng hiện hành (`silentChest`, `drowsy_confused`, `speech === 'unable' | 'words'`, `paco2 > 45`, `spo2 < 90`, `rr > 30`, `pefPct <= 50`, `accessoryMuscleUse`) lên **trước** nhánh `good_response`, đồng thời khóa `discharge_plan` nếu bất kỳ dấu hiệu nguy kịch/nặng nào đang dương tính (hoặc `spo2 < 94%`).

---

#### 3. `[ASTHMA-R2-R3-03]` [CRITICAL] [ASTHMA MODULE] "Hố đen điều trị" đánh rơi mất sạch 100% thuốc kiểm soát ICS-formoterol ở bệnh nhân Hen KHÔNG KIỂM SOÁT thuộc Track 1 (Bậc 2, 3, 4) khi sai kỹ thuật hít hoặc kém tuân thủ
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` — `asthma.outpatient.track1_step1_2` (dòng 1299), `track1_step3` (dòng 1372), `track1_step4` (dòng 1472).
- **Cơ chế gây hại**: Khi bệnh nhân hen không kiểm soát (`score.level === 'uncontrolled'`) kèm `inhalerTechniqueCorrect === false` hoặc `goodAdherence === false`:
  - Nhánh tăng bậc yêu cầu `techniqueOk && adherenceOk` → `false` (đúng, chưa tăng bậc vội).
  - Nhưng nhánh duy trì bậc hiện tại (`currentStep === 2`, `3`, `4`) lại viết `score.level !== 'uncontrolled'` → cũng trả về `false`!
  - Kết quả: Trong khi Track 2 (`R2-PROBE-01`, `03`) và Bậc 5 vẫn giữ `CONTINUE` thuốc nền đúng chuẩn GINA, thì **toàn bộ bệnh nhân Track 1 (nhánh ưu tiên số 1 của GINA!) ở Bậc 2, Bậc 3 và Bậc 4 bị mất trắng 100% thuốc kiểm soát ICS-formoterol** trong kế hoạch điều trị!
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **Ca `R2-ADV-58`** (Track 1 Bậc 3, 4/4 GINA dương tính `uncontrolled`, `inhalerTechniqueCorrect: false`, đang dùng Symbicort 160/4.5): Output chỉ còn `RECS(2): [MONITOR] (rec_asthma_check_technique_first) ;; [MONITOR] (rec_asthma_action_plan_doc)` — **0 thuốc điều trị hen!**
  - **Ca `R2-ADV-59`** (Track 1 Bậc 4, `uncontrolled`, `goodAdherence: false`): Output y hệt — **0 thuốc điều trị hen!**
- **Đề xuất khắc phục**: Ở cả 3 luật `track1_step1_2`, `track1_step3`, `track1_step4`, sửa điều kiện giữ bậc hiện tại thành `(currentStep === N && (score.level !== 'uncontrolled' || !techniqueOk || !adherenceOk))`, và đảm bảo `isSteppingUp = false` khi `!techniqueOk || !adherenceOk` để phát lệnh `CONTINUE` (hoặc `START` nếu chưa có thuốc trong `currentMeds`) ở đúng bậc hiện tại song song với khuyến cáo sửa kỹ thuật hít.

---

#### 4. `[ASTHMA-R2-R3-04]` [CRITICAL] [ASTHMA MODULE] Bỏ sót hoàn toàn biến cố thất bại điều trị sau 1 giờ (`acuteResponseAfter1h === 'poor_response'`), làm liệt nhánh `START` Magnesium sulfate 2 g TM và gói Cơn hen nặng
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` — `evaluateAcuteAsthma()` (dòng 224–282) và `asthma.acute.severe_magnesium` (dòng 949–960).
- **Cơ chế gây hại**: Trong `produce()` của Rule 11D (`severe_magnesium_sulfate`, dòng 958), tác giả viết `const isPoorResponse = ci.acuteResponseAfter1h === 'poor_response'` nhằm chuyển `magnesium_sulfate` sang `START` khi bệnh nhân không đáp ứng sau 1 giờ (`PEF < 50%`, khó thở tăng, kiệt sức). Thế nhưng `when()` của Rule 11A–11D đều gọi `evaluateAcuteAsthma(ctx).isSevere`, mà hàm `evaluateAcuteAsthma()` **không hề đọc `ci.acuteResponseAfter1h === 'poor_response'`**!
  - Hệ quả 1 (`R2-ADV-25`): Bệnh nhân vào viện mức nhẹ-vừa ban đầu (`RR 24, SpO₂ 93%, PEF 60%`) nhưng sau 1 giờ xấu đi (`poor_response`) vẫn bị kẹt ở phác đồ nhẹ-vừa (Prednisolone uống + Salbutamol xịt), mất hoàn toàn Oxy, Ipratropium, Methylprednisolone TM và MgSO₄ 2 g TM!
  - Hệ quả 2 (`R2-ADV-26`): Nếu bác sĩ chỉ nhập `acuteResponseAfter1h = 'poor_response'` mà chưa nhập sinh hiệu ban đầu, `missing_triage_data` cũng trả về `false` (vì dòng 338 kiểm tra `ci.acuteResponseAfter1h === undefined`), tạo ra **0 khuyến cáo (`NONE`)**!
- **Bằng chứng thực nghiệm (`evaluate()`)**:
  - **Ca `R2-ADV-25`**: Output chỉ có `rec_asthma_acute_mild_moderate` + `rec_asthma_acute_mild_moderate_ocs`.
  - **Ca `R2-ADV-26`**: Output `RECS(0): NONE`.
- **Đề xuất khắc phục**: Bổ sung `const poorAfter1h = ci.acuteResponseAfter1h === 'poor_response'` vào `evaluateAcuteAsthma()`, đưa vào cả `hasExplicitAcuteData` lẫn `isSevere`.

---

#### 5. `[ASTHMA-R2-R3-05]` [CRITICAL] [ASTHMA MODULE] Vi phạm Fail-Closed (QA-9) khi thiếu sinh hiệu phân độ nội viện VÀ kê nhầm Prednisolone 40–50 mg/ngày cho bệnh nhân nội viện đồng mắc ổn định (như Suy tim cấp)
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 259–281) & `src/modules/asthma/inputs.ts` (dòng 264, 299).
- **Cơ chế gây hại**:
  1. **Fail-open khi chưa nhập bất kỳ sinh hiệu nào (`R2-ADV-24`, `R2-PROBE-14`)**: Trên UI nội viện, `isAcuteExacerbation` có `defaultValue: true` và `speechAbility` có `defaultValue: 'sentences'`. Ngay khi mở form mà bác sĩ chưa nhập `spo2`, `respiratoryRate` hay `pefPct`, `hasExplicitAcuteData` đã bằng `true`, vượt qua chốt `missing_triage_data` và gán mặc định `isSevere = false` → kê ngay gói nhẹ-vừa cho một bệnh nhân cấp cứu chưa hề được đo SpO₂ hay đếm nhịp thở!
  2. **Kê oan Prednisolone 50 mg cho bệnh nhân Suy tim cấp có tiền sử hen ổn định (`R2-ADV-33`)**: Ở bệnh nhân đồng mắc `['asthma', 'hf']` nhập viện vì suy tim cấp (`LVEF 35%, NYHA III`), bác sĩ nhập sinh hiệu hô hấp hoàn toàn bình thường (`spo2: 98%, respiratoryRate: 16`) nhưng chưa gạt tay `isAcuteExacerbation = false`. Do dòng 262–263 viết `rr !== undefined || spo2 !== undefined`, hàm `evaluateAcuteAsthma()` kết luận bệnh nhân đang lên cơn hen cấp và kê **Prednisolone 40–50 mg/ngày × 5–7 ngày + Salbutamol 4–10 nhát**, gây giữ natri/nước làm nặng suy tim cấp và tăng nhịp thất!
- **Bằng chứng thực nghiệm (`evaluate()`)**: Xem kết quả nguyên văn `R2-ADV-24`, `R2-PROBE-14` và `R2-ADV-33`.
- **Đề xuất khắc phục**: (1) Xóa `defaultValue: true` của `isAcuteExacerbation` và `defaultValue: 'sentences'` của `speechAbility` trong `inputs.ts`; (2) Không bao giờ suy diễn `hasAcuteAttack = true` từ các chỉ số sinh tồn bình thường (`spo2 >= 95%, rr <= 20, speech === 'sentences'`) khi `isAcuteExacerbation !== true`; (3) Khi `isAcuteExacerbation === true` nhưng thiếu cả `spo2` lẫn `respiratoryRate` (và chưa có dấu hiệu nặng/nguy kịch), bắt buộc fail-closed qua `missing_triage_data`.

---

#### 6. `[ASTHMA-R2-R3-06]` [CRITICAL] [ASTHMA MODULE] Dùng `.find()` thay vì `.filter()` trong cả 4 luật chống chỉ định thuốc nền, bỏ lọt hoàn toàn thuốc chống chỉ định thứ 2 (Ibuprofen ở AERD, Timolol nhỏ mắt glôcôm, Diazepam trong cơn cấp)
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` — dòng 417 (`laba_only_prohibited`), dòng 553 (`beta_blocker_contra`), dòng 598 (`aerd_nsaid_contra`), dòng 1887 (`acute_sedatives_contra`).
- **Cơ chế gây hại**: Cả 4 hàm `produce()` đều lấy `const med = ctx.patient.currentMeds.find(...)!` và trả về 1 `Recommendation` duy nhất gắn với `med.drugId`. Khi bệnh nhân dùng ≥ 2 thuốc vi phạm:
  - **Ca `R2-ADV-52`** (AERD dùng `aspirin` 81 mg tim mạch + `ibuprofen` 400 mg giảm đau khớp): Hệ thống chỉ phát `[STOP:aspirin]`, **không phát bất kỳ lệnh `STOP` hay `AVOID` nào cho `ibuprofen`**!
  - **Ca `R2-PROBE-04`** (Dùng `propranolol` uống + `timolol_ophthalmic` nhỏ mắt glôcôm): Hệ thống chỉ phát `[AVOID:propranolol]`, **bỏ lọt hoàn toàn lọ thuốc nhỏ mắt Timolol 0.5%** (vì `interactions.ts` ở tầng Engine cũng không có `timolol_ophthalmic`)!
  - **Ca `R2-PROBE-06`** (Cơn hen cấp nặng đang có `morphine` + `diazepam`): Hệ thống chỉ phát `[AVOID:morphine]`, **bỏ lọt hoàn toàn `diazepam`**!
- **Đề xuất khắc phục**: Duyệt toàn bộ danh sách vi phạm bằng `.filter()` (kết hợp bổ sung quy tắc vào `src/engine/safety/reviewMeds.ts` & `interactions.ts` cho mọi NSAID trên nền `conditions.aerd`, mọi chẹn beta nhỏ mắt `timolol_ophthalmic`/`carteolol`/`levobunolol`, mọi LABA đơn trị và mọi thuốc an thần trong cơn hen cấp) để mỗi `drugId` nguy hiểm đều nhận lệnh `STOP`/`AVOID` tường minh.

---

### B. Nhóm Mức Độ MAJOR (7 Phát Hiện)

#### 7. `[ASTHMA-R2-R3-07]` [MAJOR] [ASTHMA + ENGINE] Gán sai `UPTITRATE:budesonide_formoterol` khi đổi từ hoạt chất khác (`budesonide` hoặc `beclometasone_formoterol` Foster), làm mất lệnh `SWITCH` và nổ cảnh báo giả `dup.ics` / `dup.laba` CRITICAL ngay trên Preset chính thức số 2
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 1391, 1488) & thứ tự gọi `checkDuplicates` trong `src/engine/evaluate.ts`.
- **Bằng chứng thực nghiệm**:
  - **Preset chính thức số 2 (`preset_asthma_uncontrolled_step2` / `R2-ADV-60`)**: Bệnh nhân đang dùng `budesonide` đơn trị, tăng lên Track 1 Bậc 3 → phát `[UPTITRATE:budesonide_formoterol]` (không có `SWITCH` ngừng `budesonide` vì `merge.ts` chỉ sinh `SWITCH` khi `action === 'START'`) + nổ `[ALERT:warning:dup.ics] (budesonide, budesonide_formoterol)`.
  - **Ca `R2-ADV-61`**: Bệnh nhân đang dùng **Foster (`beclometasone_formoterol` 100/6 MART Bậc 3)** không kiểm soát tăng lên Bậc 4 → phát `[UPTITRATE:budesonide_formoterol]` mà không ngừng Foster, gây nổ **`[ALERT:critical:dup.laba] Trùng lặp thành phần LABA giữa các bình hít (beclometasone_formoterol, budesonide_formoterol)`**!
- **Đề xuất khắc phục**: Giữ nguyên `beclometasone_formoterol` khi bệnh nhân đang dùng Foster trong Track 1; chỉ dùng `UPTITRATE` khi `currentMeds` đã có đúng `drugId` đích, còn nếu đổi từ hoạt chất khác sang phải dùng `START` để kích hoạt `SWITCH`; đồng thời loại trừ các thuốc đã bị `STOP`/`SWITCH` khỏi `checkDuplicates`.

#### 8. `[ASTHMA-R2-R3-08]` [MAJOR] [ASTHMA MODULE] Bỏ sót tiêu chuẩn "Kích động, hoảng hốt, vật vã" (`mentalStatus === 'anxious'`) trong phân tầng Cơn hen cấp nặng
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 238, 273–280).
- **Bằng chứng thực nghiệm**: Ca `R2-ADV-27` (`mentalStatus: 'anxious', speechAbility: 'phrases', respiratoryRate: 28, spo2: 91`) bị xếp vào **Cơn nhẹ - trung bình**, trái với GINA 2026 Box 9-3 (*"Severe: Usually agitated"*) và BYT QĐ 5850/2021 (*"Cơn hen nặng: Tri giác thường kích thích"*). Ngoài ra ở `SpO₂ = 91%` (`R2-PROBE-13`, thấp hơn đích 93–95%), tiêu đề/liều gói nhẹ-vừa không hiển thị rõ chỉ định thở oxy.
- **Đề xuất khắc phục**: Đưa `ci.mentalStatus === 'anxious'` vào `isSevere` (và `hasExplicitAcuteData`) trong `evaluateAcuteAsthma()`, và bổ sung y lệnh thở oxy khi `spo2 < 93%`.

#### 9. `[ASTHMA-R2-R3-09]` [MAJOR] [ASTHMA MODULE] Báo động giả Class III "CHỐNG CHỈ ĐỊNH trong cơn hen cấp" đối với thuốc giảm đau hậu phẫu (`fentanyl`/`morphine`) ở bệnh nhân hen ổn định mổ chương trình (`isAcuteExacerbation === false`)
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 1885 — `asthma.acute.sedatives_contra`).
- **Bằng chứng thực nghiệm**: Ca `R2-ADV-32` (`setting: 'inpatient', isAcuteExacerbation: false, spo2: 98, respiratoryRate: 16`, `currentMeds: [budesonide_formoterol, fentanyl]`) → Output: `[AVOID:fentanyl] CHỐNG CHỈ ĐỊNH: Tránh tuyệt đối Fentanyl giảm đau sau mổ trong cơn hen cấp`.
- **Đề xuất khắc phục**: Bổ sung `evaluateAcuteAsthma(ctx).hasAcuteAttack &&` vào hàm `when` của `asthma.acute.sedatives_contra`.

#### 10. `[ASTHMA-R2-R3-10]` [MAJOR] [ASTHMA MODULE] Mâu thuẫn trực tiếp ở Bậc 5 khi đã kiểm soát tốt 6 tháng (vừa khuyên `REDUCE` hạ bậc vừa báo "hen không kiểm soát ở Bậc 5, thêm LAMA + sinh học") và lỗi giữ nguyên chuỗi `dose` chưa giảm khi `REDUCE`
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 1647–1775 & dòng 1825–1850).
- **Bằng chứng thực nghiệm**:
  - **Ca `R2-ADV-62`** (Track 1 Bậc 5, `0/4` triệu chứng suốt 6 tháng, `0` đợt cấp, `FEV₁ 82%`): Phát đồng thời `[REDUCE:budesonide_formoterol]` (nhưng `dose` vẫn giữ `160/4.5 mcg: 2 nhát x 2 lần/ngày`), `[CONSIDER] Xem xét hạ bậc giảm liều ICS 25–50%`, **VÀ** `[REFER] (rec_asthma_track1_step5_lama_biologic)` với `rationale` ghi *"Bệnh nhân hen không kiểm soát ở mức Bậc 5"*!
  - **Ca `R2-PROBE-17a` & `17b`** (Track 2 Bậc 3 & Bậc 4 ổn định 6 tháng): Phát `[REDUCE:fluticasone_salmeterol]` với tiêu đề hạ bậc nhưng chuỗi `dose` vẫn giữ nguyên liều cao chưa giảm (`Accuhaler 250/50 mcg: hít 1 liều x 2 lần/ngày`).
- **Đề xuất khắc phục**: Khóa Rule 21B (`step5_severe_management`) khi `score.level === 'well_controlled'` (hoặc `isStepDownEligible(ctx) === true`); cập nhật chuỗi `dose` tương ứng mức giảm 25–50% khi `reducing === true` ở cả Rule 21A và `track2_alternative`.

#### 11. `[ASTHMA-R2-R3-11]` [MAJOR] [ASTHMA + ENGINE/KB] Thiếu hoàn toàn cổng cảnh báo Suy thận (`Renal Gate`) khi truyền `magnesium_sulfate` 2 g TM trên bệnh nhân suy thận giai đoạn cuối (`eGFR < 10 mL/phút`)
- **Vị trí lỗi**: `src/engine/safety/gates.ts`, `src/modules/asthma/rules.ts` (dòng 949–995) đối chiếu `kb/drugs/magnesium_sulfate.json`.
- **Bằng chứng thực nghiệm**: Ca `R2-ADV-30` (`scr: 550 µmol/L`, `eGFR ≈ 8 mL/phút/1.73m²`, cơn hen nguy kịch): Phát `[START:magnesium_sulfate] 2 g pha truyền tĩnh mạch chậm trong 20 phút` với `gates: []` (trống) và không có bất kỳ cảnh báo nguy cơ tăng magie máu liệt cơ hô hấp / giảm liều thận nào.
- **Đề xuất khắc phục**: Bổ sung cổng thận khi `eGFR < 30 mL/phút/1.73m²` cho `magnesium_sulfate` (cảnh báo nguy cơ ngộ độc magie gây mất phản xạ gân xương, liệt hô hấp, block nhĩ thất; cân nhắc giảm 50% liều và theo dõi sát `Mg²⁺` máu tại ICU).

#### 12. `[ASTHMA-R2-R3-12]` [MAJOR] [ASTHMA MODULE] `ICS_CONTAINING_DRUGS` & `LABA_ALL_DRUGS` bỏ sót toàn bộ bình hít bộ ba cố định (Triple Therapy) và `saba_only_prohibited` bỏ lọt bệnh nhân nội viện ổn định
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 30–69 & dòng 357).
- **Bằng chứng thực nghiệm**:
  - **Ca `R2-ADV-38`** (`fluticasone_furoate_umeclidinium_vilanterol` Trelegy + `budesonide_formoterol` Symbicort): `rec_asthma_duplicate_laba_warning` không kích hoạt.
  - **Ca `R2-ADV-43`** (`setting: 'inpatient', isAcuteExacerbation: false`, `currentMeds: [salbutamol]`): Output `RECS(0): NONE`, không cảnh báo ngưng SABA đơn trị.
- **Đề xuất khắc phục**: Đồng bộ các `drugId` bộ ba ICS+LABA+LAMA vào `ICS_CONTAINING_DRUGS` và `LABA_ALL_DRUGS`; đổi `saba_only_prohibited` và `laba_only_prohibited` sang `setting: 'both'` (chỉ chạy ở nội viện khi `!evaluateAcuteAsthma(ctx).hasAcuteAttack`).

#### 13. `[ASTHMA-R2-R3-13]` [MAJOR] [ASTHMA MODULE] Ẩn mất Báo động Đỏ ICU (`REFER`) trên bệnh nhân cấp cứu suy hô hấp nguy kịch (`silentChest = true, SpO₂ = 80%, PaCO₂ = 58 mmHg`) khi chưa kịp nhập Tuổi (`age === undefined`) hoặc trẻ `< 12` tuổi
- **Vị trí lỗi**: `src/modules/asthma/rules.ts` (dòng 289–325 & dòng 800–845).
- **Bằng chứng thực nghiệm**: Ca `R2-PROBE-15a` (`age: undefined, silentChest: true, spo2: 80, paco2: 58`) chỉ trả về `[CONSIDER] Cần nhập Tuổi để đánh giá`; Ca `R2-PROBE-15b` (`age: 11`) chỉ trả về `[CONSIDER] Ngoài phạm vi module Hen người lớn`, ẩn mất cảnh báo gọi đội Hồi sức cấp cứu / chuẩn bị đặt NKQ ngay lập tức.
- **Đề xuất khắc phục**: Vẫn chặn 100% đơn thuốc mg người lớn khi thiếu tuổi hoặc `< 12` tuổi, nhưng cho phép luật cảnh báo sinh tồn phi-dược-lý `asthma.acute.life_threatening` (`action: 'REFER'`) kích hoạt bất kể tuổi khi `isLifeThreatening === true`.

---

### C. Nhóm Mức Độ MINOR (3 Phát Hiện) & SUGGESTION (2 Phát Hiện)

- **`[ASTHMA-R2-R3-14]` (`minor`, `ui`, `inputs.ts:276, 300`)**: `speechAbility.helpVi` ghi sai *"Nói từng từ hoặc cụm từ là tiêu chuẩn cơn hen cấp nặng"* (theo GINA 2026 & BYT 5850, nói cụm từ thuộc Nhẹ - Trung bình, chỉ nói từng từ mới là Nặng); `spo2.helpVi` ghi `< 92% (GINA 2026)` (ngưỡng trẻ nhỏ) trong khi người lớn ≥ 12 tuổi và code `rules.ts` đều dùng `< 90%`.
- **`[ASTHMA-R2-R3-15]` (`minor`, `rule`, `src/engine/calculators/gina.ts:36-45`)**: Khi trả lời `3/4` câu GINA đều `true` và câu 4 `undefined` (`R2-ADV-16` / `R2-PROBE-16`), hàm trả về sớm `'uncontrolled'` và kê đơn thay vì yêu cầu điền đủ câu 4 (`activityLimitationDueToAsthma`).
- **`[ASTHMA-R2-R3-16]` (`minor`, `missing`, `src/engine/safety/gates.ts & reviewMeds.ts`)**: Chưa có cổng chặn chéo `conditions.aerd` ở tầng Engine đối với các NSAID khác `aspirin` khi một module đồng mắc phát lệnh `START` NSAID mới.
- **`[ASTHMA-R2-R3-17]` (`suggestion`, `rule`, `rules.ts:865-905`)**: Bổ sung lưu ý nâng mục tiêu thở oxy lên `SpO₂ ≥ 95%` và theo dõi tim thai liên tục khi xử trí cơn hen cấp trên phụ nữ mang thai (`R2-PROBE-12`).
- **`[ASTHMA-R2-R3-18]` (`suggestion`, `rule`, `rules.ts:1798-1865`)**: Ở Track 2 Bậc 1–2, giữ nguyên ICS đơn chất hợp lệ hiện hành (như `budesonide` Pulmicort ở `R2-PROBE-02`) với `CONTINUE` thay vì ép `SWITCH` sang `fluticasone_propionate`.

---

## Phần 3. Bảng Kết Quả Thực Thi Toàn Bộ 91 Kịch Bản Kiểm Thử (`evaluate()`)

### 3.1. Chạy 5 Preset Chính Thức (`asthmaPresets`)
| Preset ID | Mô tả lâm sàng | Kết quả trên `evaluate()` | Đánh giá R3 |
|---|---|---|---|
| `preset_asthma_new_mild` | Hen mới chẩn đoán nhẹ (Track 1 Bậc 1–2) | `START:budesonide_formoterol` AIR + `MONITOR` Action Plan | **PASS** |
| `preset_asthma_uncontrolled_step2` | Đang dùng Budesonide Bậc 2, tăng lên Bậc 3 MART | `UPTITRATE:budesonide_formoterol` (thiếu `SWITCH:budesonide`) + nổ cảnh báo giả `ALERT:warning:dup.ics` | **FAIL** (`ASTHMA-R2-R3-07`) |
| `preset_asthma_severe_step5_eosinophilic` | Hen nặng Bậc 5, Eos cao → LAMA + Sinh học | `CONTINUE:budesonide_formoterol` + `REFER` LAMA/Biologic + Action Plan | **PASS** |
| `preset_asthma_step_down_candidate` | Hen Bậc 3 ổn định 6 tháng → Hạ bậc | `REDUCE:budesonide_formoterol` (giảm liều chuẩn) + `CONSIDER` step-down + Action Plan | **PASS** |
| `preset_asthma_acute_severe_er` | Cơn hen cấp nặng tại Cấp cứu (`er_asthma_0218`) | Đủ 4 thuốc cấp cứu (`START` SABA+Oxy, Ipratropium, Methylpred TM; `CONSIDER` MgSO₄), ẩn Action Plan | **PASS** |

### 3.2. Chạy 66 Kịch Bản Đối Kháng Chính (`R2-ADV-01` → `R2-ADV-66`)
| Mã KB | Nhóm kiểm thử & Tình huống đối kháng | Kết quả | Tham chiếu lỗi |
|---|---|---|---|
| `R2-ADV-01` | Trẻ 6 tuổi ngoại trú -> chặn an toàn, 0 đơn người lớn, 0 Action Plan | **PASS** | — |
| `R2-ADV-02` | Trẻ 11 tuổi ngoại trú Bậc 3 MART -> chặn an toàn, 0 đơn người lớn | **PASS** | — |
| `R2-ADV-03` | Trẻ 11 tuổi nội viện cơn hen cấp nặng (`SpO₂ 86%, RR 36`) -> chặn liều mg người lớn | **PASS** | Xem thêm `PROBE-15b` |
| `R2-ADV-04` | Trẻ 11 tuổi nội viện xuất viện (`good_response`) -> chặn đơn MART người lớn & Action Plan | **PASS** | Hậu kiểm R1-06/R3-04 |
| `R2-ADV-05` | Biên dưới hợp lệ: Đúng 12 tuổi ngoại trú khởi trị -> cho phép Track 1 Bậc 1–2 AIR | **PASS** | — |
| `R2-ADV-06` | Thiếu tuổi (`age = undefined`) ngoại trú -> fail-closed `missing_input_age`, 0 đơn thuốc | **PASS** | — |
| `R2-ADV-07` | Thiếu tuổi (`age = undefined`) nội viện cơn nguy kịch -> chặn liều mg người lớn | **PASS*** | *Ẩn báo động ICU (`R3-13`) |
| `R2-ADV-08` | Thiếu tuổi (`age = undefined`) nội viện xuất viện (`good_response`) -> fail-closed | **PASS** | — |
| `R2-ADV-09` | 0/4 câu GINA (bỏ trống toàn bộ) -> fail-closed `missingInputRec`, 0 đơn thuốc | **PASS** | — |
| `R2-ADV-10` | 1/4 câu GINA (`Q1=false`, 3 câu thiếu, ổn định 6 tháng) -> fail-closed, chặn hạ bậc | **PASS** | Hậu kiểm R1-03/R3-05 |
| `R2-ADV-11` | 1/4 câu GINA (`Q1=true`, 3 câu thiếu) -> fail-closed `missingInputRec` | **PASS** | — |
| `R2-ADV-12` | 2/4 câu GINA (`Q1=false, Q2=false`, 2 câu thiếu) -> fail-closed `missingInputRec` | **PASS** | — |
| `R2-ADV-13` | 2/4 câu GINA (`Q1=true, Q2=true`, 2 câu thiếu) -> fail-closed `missingInputRec` | **PASS** | — |
| `R2-ADV-14` | 3/4 câu GINA (`Q1=false, Q2=false, Q3=false`, Q4 thiếu) -> fail-closed `missingInputRec` | **PASS** | — |
| `R2-ADV-15` | 3/4 câu GINA (`Q1=true, Q2=true, Q3=false`, Q4 thiếu) -> fail-closed `missingInputRec` | **PASS** | — |
| `R2-ADV-16` | 3/4 câu GINA nhưng cả 3 câu Dương tính (`Q1=Q2=Q3=true`, Q4 thiếu) | **NOTE** | Kê sớm Bậc 3 (`ASTHMA-R2-R3-15`) |
| `R2-ADV-17` | Cơn hen nguy kịch: Lồng ngực câm (`silentChest=true, SpO₂ 84%`) -> Đủ 4 thuốc START + ICU & ẩn Action Plan | **PASS** | Hậu kiểm R3-01 |
| `R2-ADV-18` | Cơn hen nguy kịch: Lơ mơ / Ngủ gà (`drowsy_confused`) -> Đủ 4 thuốc START + ICU & ẩn Action Plan | **PASS** | — |
| `R2-ADV-19` | Cơn hen nguy kịch: Tăng CO₂ máu (`PaCO₂ = 52 mmHg`) -> Đủ 4 thuốc START + ICU & ẩn Action Plan | **PASS** | Hậu kiểm R1-02/R3-02 |
| `R2-ADV-20` | Giá trị biên `PaCO₂ = 46 mmHg` (>45 -> ICU) vs `PaCO₂ = 45 mmHg` (không báo giả ICU) | **PASS** | — |
| `R2-ADV-21` | Cơn hen nguy kịch: Không nói được (`speechAbility = unable`) -> Đủ 4 thuốc START + ICU & ẩn Action Plan | **PASS** | — |
| `R2-ADV-22` | Cơn hen nguy kịch trên BN có sẵn `salbutamol` xịt & `methylprednisolone` uống tại nhà | **FAIL** | `ASTHMA-R2-R3-01` (Critical) |
| `R2-ADV-23` | Cơn hen nguy kịch (`silentChest=true, SpO₂ 82%, PaCO₂ 56`) kèm cờ `good_response` mâu thuẫn | **FAIL** | `ASTHMA-R2-R3-02` (Critical) |
| `R2-ADV-24` | Nội viện chỉ có `isAcuteExacerbation=true`, thiếu sạch mọi sinh hiệu phân độ | **FAIL** | `ASTHMA-R2-R3-05` (Critical) |
| `R2-ADV-25` | Cơn ban đầu nhẹ-vừa nhưng sau 1h xấu đi (`acuteResponseAfter1h = poor_response`) | **FAIL** | `ASTHMA-R2-R3-04` (Critical) |
| `R2-ADV-26` | Nội viện chỉ nhập `acuteResponseAfter1h = poor_response` -> rơi vào hố đen 0 khuyến cáo | **FAIL** | `ASTHMA-R2-R3-04` (Critical) |
| `R2-ADV-27` | Cơn hen cấp có Kích động / vật vã (`mentalStatus = anxious`) -> bị xếp nhầm Nhẹ - vừa | **FAIL** | `ASTHMA-R2-R3-08` (Major) |
| `R2-ADV-28` | Giá trị biên Cơn nặng: `RR=31`, `SpO₂=89%`, `PEF=50%` -> đều kích hoạt gói Cơn nặng | **PASS** | Hậu kiểm R3-12 |
| `R2-ADV-29` | Cơn hen cấp đang dùng `diazepam` -> cảnh báo `AVOID` Class III | **PASS** | Hậu kiểm R1-11 |
| `R2-ADV-30` | Cơn hen nguy kịch kèm Suy thận mạn giai đoạn 5 (`SCr 550 µmol/L`, truyền MgSO₄ 2 g TM) | **FAIL** | `ASTHMA-R2-R3-11` (Major) |
| `R2-ADV-31` | BN hen ổn định vào viện mổ chương trình (`isAcuteExacerbation = false`) -> 0 Prednisolone/SABA | **PASS** | Hậu kiểm R2-03 |
| `R2-ADV-32` | BN hen ổn định mổ chương trình (`isAcuteExacerbation = false`) có giảm đau `fentanyl` | **FAIL** | `ASTHMA-R2-R3-09` (Major) |
| `R2-ADV-33` | Đồng mắc `[asthma, hf]` nhập viện vì Suy tim (`SpO₂ 98%, RR 16`, chưa gạt cờ hen cấp) | **FAIL** | `ASTHMA-R2-R3-05` (Critical) |
| `R2-ADV-34` | Nội viện hồi phục tốt sau 1h (`good_response`, 30 tuổi) -> Kê đơn xuất viện MART + Action Plan | **PASS** | Hậu kiểm R1-07 |
| `R2-ADV-35` | Xuất viện (`good_response`) trên BN ở nhà vốn dùng Symbicort AIR `1 nhát khi cần` | **FAIL** | `ASTHMA-R2-R3-01` (Critical) |
| `R2-ADV-36` | Trùng 2 LABA trong `currentMeds` (`budesonide_formoterol` + `salmeterol`) | **PASS** | Hậu kiểm R3-14 |
| `R2-ADV-37` | Trùng 2 LABA trong `currentMeds` (`fluticasone_salmeterol` + `glycopyrronium_indacaterol`) | **PASS** | — |
| `R2-ADV-38` | Trùng LABA qua bình hít bộ ba (`fluticasone_furoate_umeclidinium_vilanterol` + Symbicort) | **FAIL** | `ASTHMA-R2-R3-12` (Major) |
| `R2-ADV-39` | Đồng mắc `[asthma, copd]` (ACO) Eos thấp (`100`) -> giữ ICS-formoterol + thêm Tiotropium | **PASS** | Hòa giải đa bệnh tốt |
| `R2-ADV-40` | Đồng mắc `[asthma, copd]` Eos cao (`380`, 2 đợt cấp) -> hòa giải không trùng 2 LABA | **PASS** | — |
| `R2-ADV-41` | SABA đơn trị (`salbutamol` ngoại trú không có ICS) -> `STOP` SABA + `START` ICS-formoterol | **PASS** | — |
| `R2-ADV-42` | SABA đơn trị với `terbutaline` (Bricanyl) -> `STOP` đúng `drugId = terbutaline` | **PASS** | Hậu kiểm R2-12 |
| `R2-ADV-43` | SABA đơn trị ở BN nội viện ổn định (`isAcuteExacerbation = false`, `currentMeds: [salbutamol]`) | **FAIL** | `ASTHMA-R2-R3-12` (Major) |
| `R2-ADV-44` | LABA đơn trị (`salmeterol` không kèm ICS) -> `STOP` ngay (FDA Boxed Warning) | **PASS** | Hậu kiểm R3-03 |
| `R2-ADV-45` | LABA+LAMA không kèm ICS (`umeclidinium_vilanterol` Anoro) trên BN Hen -> `STOP` ngay | **PASS** | Hậu kiểm R3-03 |
| `R2-ADV-46` | Đồng mắc `[asthma, hf]` (HFrEF `LVEF 32%`) -> khởi trị Bisoprolol, ẩn Carvedilol | **PASS** | Hậu kiểm R3-08 |
| `R2-ADV-47` | Đồng mắc `[asthma, hf]` quên tích `conditions.asthma` đang uống Carvedilol -> chặn Carvedilol | **PASS** | — |
| `R2-ADV-48` | Đồng mắc `[asthma, af]` (Rung nhĩ đáp ứng thất nhanh `HR 118`) -> không dùng BB không chọn lọc | **PASS** | — |
| `R2-ADV-49` | Quá liều MART (`totalDailyPuffsUsed = 14 > 12`) -> vừa `HOLD` vượt trần vừa `REFER` cấp cứu | **PASS** | Hậu kiểm R1-10 |
| `R2-ADV-50` | AERD đang dùng đơn lẻ `ibuprofen` -> `STOP` khẩn cấp Ibuprofen | **PASS** | Hậu kiểm R1-15 |
| `R2-ADV-51` | AERD đang dùng đơn lẻ `aspirin` -> `STOP` khẩn cấp Aspirin | **PASS** | — |
| `R2-ADV-52` | AERD đang dùng ĐỒNG THỜI `aspirin` 81 mg + `ibuprofen` 400 mg -> bỏ lọt Ibuprofen! | **FAIL** | `ASTHMA-R2-R3-06` (Critical) |
| `R2-ADV-53` | Đồng mắc `[asthma, gout]` trên nền AERD -> kiểm tra an toàn NSAID | **PASS*** | *Xem `ASTHMA-R2-R3-16` |
| `R2-ADV-54` | Glôcôm nhỏ mắt `timolol_ophthalmic` đơn lẻ -> `AVOID` nguy cơ co thắt phế quản | **PASS** | Hậu kiểm R3-13 |
| `R2-ADV-55` | Glôcôm nhỏ mắt Timolol với `drugId` lạ (`timolol_eye_drops`) -> bắt qua tên `timolol` | **PASS** | — |
| `R2-ADV-56` | Phụ nữ mang thai hen Bậc 3 ổn định 6 tháng -> `CONTINUE`, TUYỆT ĐỐI KHÔNG hạ bậc | **PASS** | Hậu kiểm R1-16/R3-10 |
| `R2-ADV-57` | Phụ nữ mang thai hen Bậc 4 ổn định 8 tháng -> `CONTINUE`, TUYỆT ĐỐI KHÔNG hạ bậc | **PASS** | — |
| `R2-ADV-58` | Hen KHÔNG KIỂM SOÁT ở Track 1 Bậc 3 + sai kỹ thuật hít -> rơi mất sạch ICS-LABA! | **FAIL** | `ASTHMA-R2-R3-03` (Critical) |
| `R2-ADV-59` | Hen KHÔNG KIỂM SOÁT ở Track 1 Bậc 4 + kém tuân thủ -> rơi mất sạch ICS-LABA! | **FAIL** | `ASTHMA-R2-R3-03` (Critical) |
| `R2-ADV-60` | Preset 2 (đang dùng Budesonide Bậc 2 tăng lên Bậc 3) -> thiếu `SWITCH` + báo giả `dup.ics` | **FAIL** | `ASTHMA-R2-R3-07` (Major) |
| `R2-ADV-61` | Đang dùng Foster (`beclometasone_formoterol` Bậc 3) tăng Bậc 4 -> nổ `dup.laba` CRITICAL! | **FAIL** | `ASTHMA-R2-R3-07` (Major) |
| `R2-ADV-62` | Bậc 5 đã kiểm soát tốt 6 tháng (`FEV₁ 82%`) -> vừa khuyên hạ bậc vừa báo "không kiểm soát"! | **FAIL** | `ASTHMA-R2-R3-10` (Major) |
| `R2-ADV-63` | Chặn hạ bậc khi `exacerbationsLastYear = 2` hoặc `fev1Pct = 55%` dù 0/4 triệu chứng | **PASS** | Hậu kiểm R1-05/R3-11 |
| `R2-ADV-64` | Trầm cảm KHÔNG dùng Montelukast -> không báo giả Boxed Warning | **PASS** | Hậu kiểm R2-09 |
| `R2-ADV-65` | Action Plan Track 1 với `pefPct = 80%` -> giữ `%`, không ra `64 L/phút`, DPI cấm buồng đệm | **PASS** | Hậu kiểm R1-01/R2-02 |
| `R2-ADV-66` | Đổi Profile `VN` ở Track 2 Bậc 5 -> Seretide `500/50`, Benralizumab/Omalizumab & `profileDiff` | **PASS** | Hậu kiểm R1-04/R1-08 |

### 3.3. Tóm Tắt 20 Kịch Bản Thăm Dò Chuyên Sâu (`R2-PROBE-01` → `R2-PROBE-20`)
- **`R2-PROBE-01` & `03`** (Track 2 Bậc 3 & Bậc 4 không kiểm soát + sai kỹ thuật/kém tuân thủ): **PASS** — giữ đúng `CONTINUE:fluticasone_salmeterol` (chứng minh lỗi mất thuốc ở `R2-ADV-58/59` nằm đặc hiệu tại Track 1).
- **`R2-PROBE-02`** (Track 2 Bậc 2 đang dùng `budesonide` Pulmicort): Phát hiện ép `SWITCH` sang `fluticasone_propionate` + `dup.ics` (`ASTHMA-R2-R3-18`).
- **`R2-PROBE-04`, `05`, `06`** (Dùng đồng thời `propranolol + timolol_ophthalmic`, `salmeterol + indacaterol`, `morphine + diazepam`): **FAIL** — xác nhận lỗi `.find()` bỏ lọt thuốc chống chỉ định thứ 2 (`ASTHMA-R2-R3-06`).
- **`R2-PROBE-07` & `08`** (ACO `[asthma, copd]` nhóm E Eos thấp & nhóm B 0 đợt cấp): **PASS** — COPD tự động nhường nền ICS-formoterol và chỉ cộng thêm `START:tiotropium` (không bao giờ đè mất ICS của bệnh nhân Hen).
- **`R2-PROBE-09`** (`[asthma, hf]` chưa dùng thuốc, quên tích `conditions.asthma`): **PASS** — chọn Bisoprolol an toàn.
- **`R2-PROBE-10` & `19`** (`[asthma, gout]` & AERD dự phòng): Xác nhận `AVOID:aspirin` chỉ neo vào `aspirin`, kiến nghị thêm cổng Engine (`ASTHMA-R2-R3-16`).
- **`R2-PROBE-11`** (Thai phụ Bậc 3 KHÔNG kiểm soát, đúng kỹ thuật & tuân thủ): **PASS** — cho phép `UPTITRATE` lên Bậc 4 an toàn.
- **`R2-PROBE-12`** (Thai phụ cơn hen nguy kịch): Giữ đủ 4 thuốc cấp cứu + ICU; kiến nghị nâng đích `SpO₂ ≥ 95%` cho thai kỳ (`ASTHMA-R2-R3-17`).
- **`R2-PROBE-13`** (Cơn cấp `SpO₂ = 91%`, `speech = phrases`): Đối chiếu sai lệch `helpVi` (`ASTHMA-R2-R3-14`) và thiếu nhấn mạnh thở oxy ở mức 90–92% (`ASTHMA-R2-R3-08`).
- **`R2-PROBE-14`** (Mô phỏng nguyên trạng `defaultValue` của UI nội viện khi bác sĩ chưa gõ chữ số nào): **FAIL** — tự động kê ngay Prednisolone 40–50 mg + Salbutamol (`ASTHMA-R2-R3-05`).
- **`R2-PROBE-15a` & `15b`** (Bệnh nhân cấp cứu `silentChest = true, SpO₂ = 80%, PaCO₂ = 58` thiếu tuổi hoặc 11 tuổi): **FAIL** — ẩn mất báo động đỏ `REFER` ICU (`ASTHMA-R2-R3-13`).
- **`R2-PROBE-16`** (3/4 GINA đều `true`, Q4 `undefined`): Kê đơn sớm khi thiếu câu 4 (`ASTHMA-R2-R3-15`).
- **`R2-PROBE-17a` & `17b`** (Hạ bậc ở Track 2 Bậc 3 & Bậc 4): **FAIL** — phát `REDUCE` nhưng giữ nguyên chuỗi `dose` bậc cũ chưa giảm (`ASTHMA-R2-R3-10`).
- **`R2-PROBE-18` & `20`** (Track 1 Bậc 2 ổn định 6 tháng trên AIR & Track 2 Bậc 1 khởi trị): **PASS**.

---

## Kết Luận Kiểm Định Vòng 2 (Vai R3)

Căn cứ `docs/REVIEW_PROTOCOL.md` (yêu cầu đạt `0 critical, 0 major` mới được thông qua), với **6 phát hiện `critical`** và **7 phát hiện `major`** có bằng chứng thực nghiệm rõ ràng qua `evaluate()`:

**KẾT LUẬN CUỐI CÙNG: FAIL**
