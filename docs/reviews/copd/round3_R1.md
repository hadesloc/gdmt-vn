# Báo cáo Kiểm định Lâm sàng & Guideline Độc lập – Vòng 3 (Round 3 – R1)
## Phân hệ: Bệnh Phổi Tắc Nghẽn Mạn Tính (`copd`)

- **Vai trò kiểm định:** Reviewer R1 – Chuyên gia Hô hấp & Kiểm định Guideline (Độc lập hoàn toàn – không đọc bất kỳ tệp `round3_R2*` hay `round3_R3*`)
- **Ngày kiểm định:** 27/10/2026
- **Phạm vi kiểm định:**
  - Mã nguồn phân hệ `src/modules/copd/` (toàn bộ 12 tệp: `index.ts`, `inputs.ts`, `helpers.ts`, `rules.ts`, `rules.safety.ts`, `rules.initial.ts`, `rules.followup.ts`, `rules.escalation.ts`, `rules.inpatient.ts`, `matrices.ts`, `pathways.ts`, `presets.ts`)
  - Tầng suy diễn & an toàn trung tâm: `src/engine/calculators/gold.ts`, `src/engine/derive.ts`, `src/engine/evaluate.ts`, `src/engine/merge.ts`, `src/engine/safety/gates.ts`, `src/engine/safety/duplicates.ts`, `src/engine/safety/interactions.ts`, `src/engine/safety/reviewMeds.ts`
  - Phối hợp đa phân hệ: `['copd', 'hf']`, `['copd', 'asthma']`, `['copd', 'ckd']`, cùng giao diện `src/ui/PlanRow.tsx`, `src/ui/PatientForm.tsx`
  - Cơ sở tri thức (KB): `kb/thresholds/copd.json` (52 ngưỡng), `kb/citations/copd.json` (74 trích dẫn), `kb/interactions/*.json` và toàn bộ 19 tệp thuốc thuộc sở hữu COPD trong `kb/drugs/*.json`
- **Tài liệu nguồn nguyên bản đã đối chiếu trực tiếp trên PDF (`Medical_Library_2026`):**
  1. **GOLD 2026 Report** (*Global Strategy for Prevention, Diagnosis and Management of COPD, 2026 Report*, `01_Noi_Khoa/Ho_Hap/GOLD_2026_Report.pdf`, 248 trang)
  2. **Bộ Y tế Việt Nam – Quyết định 2131/QĐ-BYT ngày 14/07/2026** (*Hướng dẫn chẩn đoán và điều trị Bệnh phổi tắc nghẽn mạn tính*, `08_Bo_sung_ON_CALL/BYT_2131_COPD_2026.pdf`, 130 trang) & QĐ 2767/QĐ-BYT năm 2023
  3. **GINA 2026 Strategy** (`gina_2026_strategy`), **ESC 2026 Heart Failure** (`esc_2026_hf`)
  4. **Nhãn thuốc FDA / SmPC:** Daliresp (`roflumilast`), Dupixent (`dupilumab`), Zithromax (`azithromycin`), Coreg (`carvedilol`), Spiriva / Spiolto / Trelegy / Breztri / Seretide / Symbicort

---

## Tóm tắt Kết quả Kiểm định & Phán quyết (Final Verdict)

| Mức độ nghiêm trọng (Severity) | Số lượng phát hiện | Ý nghĩa theo `REVIEW_PROTOCOL.md` |
| :--- | :---: | :--- |
| **Critical (`critical`)** | **3** | Nguy cơ gây hại trực tiếp cho người bệnh, triệt tiêu thuốc cứu sống suy tim, trùng lặp corticoid toàn thân hoặc kê sai liều Hen PRN cho COPD nặng |
| **Major (`major`)** | **9** | Sai lệch phác đồ guideline GOLD 2026 / BYT 2131/2026, đánh rơi thuốc duy trì nền tảng, thiếu trụ cột phục hồi chức năng hô hấp, bỏ sót điều kiện an toàn Home NIV / NIV / Anthonisen / UI |
| **Minor (`minor`)** | **5** | Chưa chuẩn xác chi tiết `profileDiff.VN`, gán sai ngữ cảnh trích dẫn ở KB thuốc, thiếu câu quote mốc 100 /µL, gán nhầm nguồn BYT 2131 cho thuốc sinh học trong ma trận |
| **Suggestion (`suggestion`)** | **1** | Đề xuất khai thác `packYears` cho tầm soát ung thư phổi LDCT, sàng lọc thiếu hụt Alpha-1 Antitrypsin và cảnh giác nguy cơ tim mạch sau đợt cấp |
| **Tổng cộng** | **18** | Danh sách chi tiết chuẩn hóa trong `docs/reviews/copd/round3_R1.json` |

### PHÁN QUYẾT VÒNG 3 (R1): **`FAIL`** (`3 critical, 9 major, 5 minor, 1 suggestion`)

> Module `copd` đã có bước tiến rất lớn sau Vòng 2 (toàn bộ 59/59 kiểm thử bất biến cũ vượt qua, 74/74 trích dẫn trong `kb/citations/copd.json` khớp nguyên văn tài liệu PDF nguồn, cập nhật chuẩn ngưỡng Nhóm E `≥ 1` đợt cấp vừa trong `copd/helpers.ts` & `gold.ts`, cập nhật đúng Mepolizumab `"with and without chronic bronchitis"`, chặn Roflumilast khi BMI `< 18.5` và Azithromycin khi `GFR < 10 mL/phút`). Tuy nhiên, kiểm định độc lập chuyên sâu bằng chạy thực nghiệm 31 kịch bản lâm sàng qua toàn bộ pipeline động (`derive` -> `rules` -> `reviewMeds` -> `gates` -> `merge` -> `duplicates/interactions`) đã phát hiện **3 lỗi mức `critical`** và **9 lỗi mức `major`** (trong đó có 5 cam kết trong `round2_RESPONSE.md` chưa được hiện thực hóa đầy đủ trong mã nguồn thực tế), bắt buộc phải khắc phục trước khi đóng vòng kiểm định.

---

## Phần 1. Hậu kiểm Độc lập Vòng 2 (`round2_R1` & Đối chiếu `round2_RESPONSE.md` với Mã nguồn Thực tế)

| Mã Vòng 2 / Mục `round2_RESPONSE.md` | Nội dung cam kết khắc phục sau Vòng 2 | Kết quả hậu kiểm trên mã nguồn thực tế (Vòng 3) | Đánh giá |
| :--- | :--- | :--- | :---: |
| **`COPD-R1V2-01` (`derive.ts` & Nhóm E GOLD 2026 `≥ 1` đợt cấp vừa)** | Cam kết đồng bộ ngưỡng Nhóm E `≥ 1` đợt cấp trung bình trên cả `copd` lẫn `src/engine/derive.ts` và tuân thủ Fail-closed khi thiếu `fev1FvcRatio`. | `gold.ts` và `copd/helpers.ts` đã sửa sang `>= 1`, **NHƯNG `src/engine/derive.ts` dòng 160 vẫn giữ cứng `modExac >= 2`**, và dòng 139 vẫn viết `postBdrRatio === undefined \|\| postBdrRatio < 0.7` (gán sai `goldGrade`/`goldGroup` khi chưa có FEV₁/FVC!). | **CHƯA ĐẠT** (`COPD-R3-R1-06`) |
| **`COPD-R1V2-02` (Mepolizumab có và không có viêm phế quản mạn)** | Cho phép Mepolizumab ở `BCAT ≥ 300 /µL` cả có và không có viêm phế quản mạn theo GOLD 2026 p. 77. | Đã sửa chính xác trong `copd.followup.mepolizumab_indication` (`rules.escalation.ts:358–407`). Tuy nhiên `matrices.ts:228,263` lại ghi nhầm `"theo GOLD 2026 & BYT 2131/2026"` dù BYT 2131 không hề có thuốc sinh học. | **Đạt logic / Lỗi minor ma trận** (`COPD-R3-R1-17`) |
| **`COPD-R1V2-03` (Đồng mắc Hen – COPD đa phân hệ `['copd', 'asthma']`)** | Điều phối ngoại trú GINA Track 1 MART / Track 2 ICS đơn chất không trùng lặp ICS/LABA; xử lý an toàn đợt cấp. | Ngoại trú điều phối rất tốt, **NHƯNG nội viện đợt cấp (`['copd', 'asthma']`)** khi có sẵn `prednisolone` trong `currentMeds` lại phát đồng thời **CẢ `prednisolone` LẪN `methylprednisolone`** (nổ `dup.systemic_steroid` critical!) và đè mất liều SABA 20 phút giờ đầu của Hen! | **FAIL NỘI VIỆN** (`COPD-R3-R1-02`) |
| **`COPD-R1V2-04` (`carvedilol` ở HFrEF + COPD ổn định)** | `round2_RESPONSE.md` dòng 226 cam kết rõ: *"(không gắn chống chỉ định giả cho `carvedilol` đang ổn định ở HFrEF)"*. | **Mâu thuẫn trực tiếp với code:** `'carvedilol'` vẫn nằm trong `NON_SELECTIVE_BB_IDS` (`helpers.ts:173`), khiến `copd.safety.non_selective_bb_stop` phát lệnh `STOP carvedilol` xóa trắng trụ cột chẹn beta của phân hệ `hf`! | **FAIL CRITICAL** (`COPD-R3-R1-01`) |
| **`COPD-R1V2-05` (`DPI_INHALER_IDS` & Dị ứng đạm sữa bò)** | `round2_RESPONSE.md` dòng 195 tuyên bố bao phủ `Seretide Accuhaler`, `Ellipta`, `Breezhaler`. | **Chưa đúng thực tế:** `DPI_INHALER_IDS` (`helpers.ts:116–131`) bỏ sót `fluticasone_salmeterol` (`Seretide`), `salmeterol` (`Serevent`), `budesonide_formoterol` (`Symbicort`), phát **0 cảnh báo** khi bệnh nhân dị ứng nặng đạm sữa dùng Seretide! | **CHƯA ĐẠT** (`COPD-R3-R1-08`) |
| **`COPD-R1V2-06` (`CONTINUE` thuốc duy trì & thuốc leo thang)** | `round2_RESPONSE.md` §3.3 tuyên bố đã thêm `copd.followup.continue_triple`, `roflumilast_continue`, **`azithromycin_continue`** và **`biologic_continue`**. | **2/4 quy tắc không tồn tại trong code (`azithromycin_continue`, `biologic_continue` hoàn toàn vắng mặt)**; `LAMA`, `LABA+LAMA`, `ICS+LABA` kiểm soát ổn định đều nhận 0 thẻ `CONTINUE`; bộ ba mở `[budesonide_formoterol, tiotropium]` chỉ `CONTINUE` mỗi `tiotropium` làm rơi mất `budesonide_formoterol`! | **FAIL MAJOR** (`COPD-R3-R1-04`) |
| **`COPD-R1V2-08` (Chống chỉ định Roflumilast & Azithromycin)** | Chặn Roflumilast ở Child-Pugh B/C, BMI `< 18.5`, trầm cảm, theophylline, CYP3A4 inducer; chặn Azithromycin ở hút thuốc, QTc kéo dài, `GFR < 10`, giảm thính lực, NTM. | Logic chặn hoạt động tốt! Tuy nhiên khi chỉ bị chặn bởi `theophylline` (`C10`), `roflumilast_contra` vẫn gắn trích dẫn/mở đầu suy gan Child-Pugh B/C; nhãn UI `qtcProlonged` lệch giới tính so với BYT 2131 (`> 450 ms`). | **Đạt cốt lõi / Cần tinh chỉnh** (`COPD-R3-R1-11`, `12`) |
| **`COPD-R1V2-09` (NIV chống chỉ định sốc / rối loạn ý thức -> IMV & VTE eGFR < 30 / xuất huyết)** | Chuyển sang `AVOID` NIV + đặt nội khí quản IMV khi sốc/rối loạn tri giác; chuyển LMWH sang UFH khi eGFR `< 30` và IPC khi xuất huyết. | Đã hiện thực hóa tốt các cổng an toàn này! Tuy nhiên `niv_bipap` bỏ quên `accessoryMuscleUse` (tiêu chuẩn 1 của NIV) và `vte_prophylaxis` thiếu `drugId`/`dose`. | **Đạt cổng chặn / Thiếu nhánh chỉ định** (`COPD-R3-R1-09`) |
| **`COPD-R1V2-10` (Chống chỉ định kháng cholinergic LAMA: glôcôm / bí tiểu)** | Bổ sung quy tắc thay thế khi chống chỉ định LAMA (`copd.safety.lama_anticholinergic_caution`). | **Phát sinh lỗi Critical mới:** Gắn cứng `contraindications` vào 10 thuốc LAMA làm `gates.ts` chặn sạch LAMA, và ở Nhóm E `BCAT ≥ 300`, quy tắc thay thế kê `budesonide_formoterol` liều **Hen PRN AIR (`1 nhát x khi cần`)** hoàn toàn sai chỉ định cho COPD! | **FAIL CRITICAL** (`COPD-R3-R1-03`) |

---

## Phần 2. Chi tiết Các Phát hiện Kiểm định Vòng 3 (`Round 3 – R1`)

### A. Nhóm Mức độ Nghiêm trọng Tối khẩn (`CRITICAL` – 3 phát hiện)

---

#### `[COPD-R3-R1-01]` `CRITICAL` — Lệnh `STOP carvedilol` giả tạo ở bệnh nhân HFrEF ổn định đồng mắc COPD đơn thuần làm sụp đổ trụ cột Chẹn Beta của suy tim mà không có thuốc thay thế
- **Phân loại:** `rule` | **Định danh:** `copd.safety.non_selective_bb_stop` (`src/modules/copd/helpers.ts:166–175`, `src/modules/copd/rules.safety.ts:151–196`)
- **Tái hiện động trên Pipeline (`C04_HFrEF_plus_COPD_on_Carvedilol`):**
  - **Đầu vào:** Nam 66 tuổi, `selectedModules: ['copd', 'hf']`, `conditions: { copd: true, hf: true }` (KHÔNG có hen phế quản), HFrEF ổn định (`lvef: 32%`, `nyha: 2`, `sbp: 118`, `hr: 68`), đang dùng đủ 4 trụ cột GDMT suy tim (`sacubitril_valsartan`, `carvedilol 12.5 mg BID`, `dapagliflozin`, `spironolactone`) + `tiotropium_olodaterol`.
  - **Đầu ra thực tế:**
    - `rec_copd_stop_non_selective_bb`: `action: "STOP"`, `drugId: "carvedilol"`, `priority: 97` (*"NGỪNG thuốc chẹn beta không chọn lọc (carvedilol) do nguy cơ co thắt phế quản"*).
    - Trong `mergeRecommendations()`, lệnh `STOP carvedilol` triệt tiêu khuyến cáo duy trì/tối ưu chẹn beta của phân hệ `hf`, và **KHÔNG có bất kỳ lệnh `START` hay `SWITCH` sang `bisoprolol`/`metoprolol_succinate`/`nebivolol`** nào trong kế hoạch đầu ra! Bệnh nhân HFrEF LVEF 32% bị tước bỏ hoàn toàn nhóm thuốc chẹn beta cứu sống!
- **Bằng chứng Guideline & Nhãn thuốc nguyên văn:**
  - **GOLD 2026 Report, Chapter 2 (PDF p. 53):** *"Importantly, patients with COPD should not be denied β-blocker use if there is a CVD indication."*
  - **GOLD 2026 Report, Chapter 5 (PDF p. 127–128):** *"Treatment with β1-blockers improves survival in heart failure and is recommended in patients who also have COPD... There is no contraindication to any specific rate or rhythm control medication or strategy in patients with COPD, including beta-blockers."*
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026, Chương 4 (PDF tr. 53 / trang in 43):** *"Điều trị chẹn beta ở người bệnh tim mạch có chỉ định là 1 điều trị an toàn (ngoại trừ trường hợp sử dụng propranolol làm giảm FEV1) và liên quan đến hiệu quả lợi ích tương tự dân số chung."*
  - **FDA Coreg (`carvedilol`) Label** & chính `src/engine/safety/reviewMeds.ts:480` chỉ chống chỉ định tuyệt đối ở *hen phế quản hoặc tình trạng co thắt phế quản kiểu hen*. Ngừng đột ngột `carvedilol` đang ổn định ở bệnh nhân HFrEF không kèm chuyển đổi ngang sang chẹn β₁ chọn lọc gây dội ngược giao cảm, suy tim mất bù cấp, loạn nhịp thất và tử vong.
- **Hướng khắc phục đề xuất:**
  1. Loại `'carvedilol'` khỏi lệnh `STOP` đơn độc khi bệnh nhân **không có hen đồng mắc** (`!hasConcurrentAsthma(ctx)`) và đang có chỉ định suy tim / bệnh mạch vành (`hf`, `lvef <= 40`, `cad`, `mi`): thay bằng khuyến cáo `SWITCH` tường minh sang chẹn β₁ chọn lọc trên tim (`bisoprolol` / `metoprolol_succinate` / `nebivolol`) phối hợp cùng bác sĩ Tim mạch, hoặc `MONITOR` chức năng hô hấp nếu bệnh nhân đang dung nạp ổn định.
  2. Giữ lệnh `STOP` tuyệt đối với `propranolol`, `nadolol`, `timolol`, `pindolol`, `sotalol` (hoặc `carvedilol` khi có hen đồng mắc / đang co thắt phế quản cấp nặng).

---

#### `[COPD-R3-R1-02]` `CRITICAL` — Chạy đa phân hệ `['copd', 'asthma']` trong đợt cấp nội viện phát đồng thời 2 thuốc Corticoid toàn thân (`dup.systemic_steroid` Critical), đè mất liều SABA cấp cứu giờ đầu và xung đột đích Oxy khi SpO₂ 91%
- **Phân loại:** `rule` | **Định danh:** `copd.inpatient.systemic_steroid`, `copd.inpatient.short_acting_bronchodilators`, `copd.inpatient.controlled_oxygen` (`src/modules/copd/rules.inpatient.ts:55–165, 209–244`)
- **Tái hiện động trên Pipeline (`S6`, `C13`, `C14`):**
  1. **Trùng lặp 2 Corticoid toàn thân (`S6_copd_asthma_inpatient_with_prednisolone_currentMed`):** Khi bệnh nhân đồng mắc Hen + COPD đang uống `prednisolone 5 mg/ngày` vào đợt cấp nặng (`acuteExacerbation: true`, `acuteAttackSeverity: 'severe'`), `copd` sinh `UPTITRATE prednisolone` (`40 mg uống/ngày`) còn `asthma` sinh `START methylprednisolone` (`40 mg TM`). `mergeRecommendations()` giữ **CẢ HAI** y lệnh (`rec_copd_inpatient_steroid` + `rec_asthma_acute_severe_steroid`) và nổ cảnh báo **`alerts: [{ id: "dup.systemic_steroid", severity: "critical", title: "Trùng lặp 2 thuốc Corticosteroid đường toàn thân", drugIds: ["prednisolone", "methylprednisolone"] }]`**!
  2. **Đè mất liều SABA giờ đầu trong cơn co thắt phế quản nguy kịch (`C13` & `S6`):** `rec_copd_inpatient_saba_sama` (`drugId: 'salbutamol'`, `priority: 105`, liều *"Salbutamol 2.5 mg... lặp lại mỗi 4–6 giờ"*) có `priority` cao hơn `rec_asthma_acute_severe_saba` (`priority: 94`, *"Khí dung 5 mg mỗi 20 phút trong giờ đầu"*), khiến `merge.ts` xóa mất phác đồ SABA mỗi 20 phút giờ đầu (trong khi vẫn giữ `rec_asthma_acute_severe_ipratropium` mỗi 20 phút × 3 lần!). Ngay cả với COPD đơn thuần, GOLD 2026 cũng khuyến cáo mỗi 1 giờ × 2–3 liều đầu chứ không phải giãn cách ngay 4–6 giờ từ phút đầu cấp cứu!
  3. **Xung đột đích Oxy ở vùng `SpO₂ = 91%` (`C14`):** Ở bệnh nhân đồng mắc Hen + COPD cơn cấp có `SpO₂ = 91%` khí phòng (chưa tăng CO₂ máu), `rec_copd_inpatient_oxygen` phát `MONITOR`: *"không thở thêm oxy khi khí phòng đã đạt đích SpO₂ 88–92%"*, đi ngược lại GINA 2026 (cơn hen cấp có `SpO₂ < 92%` là dấu hiệu thiếu oxy máu nặng cần thở oxy kiểm soát).
- **Bằng chứng Guideline nguyên văn:**
  - **GOLD 2026 Report, Chapter 3 (PDF p. 76):** *"If patients with COPD have concomitant asthma they should be treated like patients with asthma."*
  - **GOLD 2026 Report, Chapter 4 (PDF p. 114):** *"Patients can receive one dose of nebulized medication every hour for 2-3 doses or use a pMDI one or two puffs every one hour for two or three doses and then every 2-4 hours based on the patient’s response."*
- **Hướng khắc phục đề xuất:**
  1. Đồng bộ hóa cấp cứu giữa `copd` và `asthma`: khi cả hai cùng kích hoạt đợt cấp, chỉ xuất **duy nhất 1 y lệnh corticosteroid toàn thân** (ưu tiên `methylprednisolone` TM ở cơn nặng/nguy kịch hoặc `prednisolone` uống 40 mg/ngày × 5 ngày ở cơn trung bình uống được), bất kể `prednisolone` có sẵn trong `currentMeds` hay không.
  2. Cập nhật liều khởi đầu giờ đầu của `copd.inpatient.short_acting_bronchodilators` sát GOLD 2026 p. 114 (*mỗi 1 giờ × 2–3 liều đầu, sau đó mỗi 2–4–6 giờ tùy đáp ứng*), và khi đồng mắc cơn hen cấp nặng thì bảo toàn phác đồ cắt cơn tích cực giờ đầu kèm theo dõi sát ECG/Kali.
  3. Khi đồng mắc Hen + COPD có `SpO₂ 88–92%` chưa có khí máu: yêu cầu làm ngay KMĐM cấp cứu và thở oxy kiểm soát thận trọng nếu `PaCO₂ < 45 mmHg` thay vì khẳng định không cần oxy.

---

#### `[COPD-R3-R1-03]` `CRITICAL` — Gắn cứng chống chỉ định tuyệt đối `narrow_angle_glaucoma_or_urinary_retention` trên 10 thuốc LAMA và kê sai phác đồ Hen PRN AIR (`Budesonide/Formoterol 1 nhát khi cần`) cho bệnh nhân COPD Nhóm E
- **Phân loại:** `drug` / `rule` | **Định danh:** `narrow_angle_glaucoma_or_urinary_retention` (`kb/drugs/*.json` × 10 thuốc LAMA, `src/engine/safety/gates.ts:960`, `src/modules/copd/rules.safety.ts:242–298`)
- **Tái hiện động trên Pipeline (`C15.groupE_eos350`):**
  - **Đầu vào:** Bệnh nhân COPD Nhóm E nặng (`FEV₁/FVC 0.50`, `FEV₁ 42%`, `2` đợt cấp vừa + `1` đợt nhập viện năm qua, `bloodEos: 350 /µL`, không có hen), tiền sử bí tiểu do BPH (`urinaryRetention: true`).
  - **Đầu ra thực tế:**
    1. Cả 10 tệp thuốc KB chứa LAMA đều đặt `"code": "narrow_angle_glaucoma_or_urinary_retention"` trong mảng `contraindications` (dù chính `messageVi` của chúng ghi *"Thận trọng tối đa / tránh để thuốc tiếp xúc mắt..."*), khiến `gates.ts` biến phác đồ chuẩn thành `AVOID`.
    2. Quy tắc thay thế `copd.safety.lama_anticholinergic_caution` (`rules.safety.ts:264`) gọi `fmtDose(dose('budesonide_formoterol', 'start'))` và xuất y lệnh cho bệnh nhân COPD Nhóm E:
       > **`action: "START"`, `drugId: "budesonide_formoterol"`, `dose: "1 nhát x khi cần (hít) - Với hàm lượng 160/4.5 mcg: AIR (Bậc 1–2) 1 nhát khi cần; MART Bậc 3: duy trì 1 nhát x 2 lần/ngày..."`**
  - **Mức độ nguy hiểm:** Chế độ `1 nhát khi cần (AIR)` là phác đồ riêng của **Hen nhẹ GINA Bậc 1–2**, hoàn toàn **KHÔNG được phê duyệt và KHÔNG có tác dụng dự phòng đợt cấp ở COPD Nhóm E**! Hậu quả là bệnh nhân COPD Nhóm E nguy cơ cao không có liều thuốc duy trì cố định hàng ngày!
- **Bằng chứng Guideline nguyên văn:**
  - **GOLD 2026 Report, Appendix 3 (PDF p. 157):** *"Inhaled anticholinergic drugs are poorly absorbed which limits the troublesome systemic effects observed with atropine... Extensive use of this class of agents in a wide range of doses and clinical settings has shown them to be very safe... Although occasional urinary symptoms have been reported, there are no data to prove a true causal relationship... Use of solutions with a facemask can precipitate acute glaucoma, probably as a direct result of the contact between the solution and the eye."*
  - **GOLD 2026 Report, Chapter 3 (PDF p. 75):** *"Use of LABA+ICS in COPD is not encouraged."* (Và khi bắt buộc dùng ICS+LABA do không thể dùng LAMA, liều phê duyệt COPD của Symbicort là liều cố định 2 lần/ngày `160/4.5 mcg × 2 nhát × 2 lần/ngày` hoặc `320/9 mcg × 1 nhát × 2 lần/ngày`, tuyệt đối không dùng PRN AIR).
- **Hướng khắc phục đề xuất:**
  1. Tách riêng chống chỉ định tuyệt đối thực sự (`untreated_acute_narrow_angle_glaucoma` / `unrelieved_acute_urinary_retention` / quá mẫn atropine) khỏi tình trạng tăng sinh tuyến tiền liệt / glôcôm đã kiểm soát (chỉ gắn cảnh báo thận trọng, tránh xịt sương vào mắt, dùng ống ngậm miệng thay mặt nạ khí dung).
  2. Trong `copd.safety.lama_anticholinergic_caution`, thay `dose('budesonide_formoterol', 'start')` bằng chuỗi liều duy trì cố định chuẩn COPD (`Budesonide/Formoterol 160/4.5 mcg: hít 2 nhát × 2 lần/ngày` hoặc `320/9 mcg: hít 1 nhát × 2 lần/ngày`, súc họng sau hít).

---

### B. Nhóm Sai lệch Lâm sàng & Guideline Quan trọng (`MAJOR` – 9 phát hiện)

---

#### `[COPD-R3-R1-04]` `MAJOR` — Đánh rơi âm thầm thuốc duy trì đang hiệu quả (`LAMA`, `LABA`, `LABA+LAMA`, `ICS+LABA`), làm rơi bình `ICS+LABA` trong bộ ba mở, và thiếu hẳn quy tắc `CONTINUE` cho `Azithromycin` / `Dupilumab` / `Mepolizumab` đã cam kết ở Vòng 2
- **Phân loại:** `rule` | **Định danh:** `copd.followup.continue_triple` (`src/modules/copd/rules.followup.ts:203–257`), `src/modules/copd/rules.escalation.ts`, `src/modules/copd/rules.inpatient.ts`
- **Tái hiện động trên Pipeline (`C05`, `C06`, `C07`, `C09`, `C20`, `S4`, `copd_preset_followup_roflumilast`):**
  1. **Mất trắng thuốc hít duy trì khi bệnh nhân đã đạt mục tiêu kiểm soát:**
     - `C05` (đang ổn định trên `tiotropium`), `C06` (đang ổn định trên `tiotropium_olodaterol`), `C07` & `S4` (đang ổn định trên `budesonide_formoterol` / `fluticasone_salmeterol` với `mMRC 1, CAT 6–8, 0 đợt cấp, BCAT 180–350`): đầu ra phát **0 khuyến cáo thuốc (`0 CONTINUE`)**! Ngay cả preset mẫu `copd_preset_followup_roflumilast` (`src/modules/copd/presets.ts`) cũng chỉ hiện `CONSIDER Roflumilast` + `CONSIDER Azithromycin` mà **đánh rơi hoàn toàn bình `LABA+LAMA` nền**!
  2. **Rơi bình `ICS + LABA` và gán nhãn sai trong phác đồ bộ ba mở 2 bình (`C20_open_triple_Symbicort_plus_Spiriva`):**
     - Khi `currentMeds` gồm `[budesonide_formoterol, tiotropium]`, `copd.followup.continue_triple` (`rules.followup.ts:229–245`) chỉ lấy `activeOpenLama` (`tiotropium`) và xuất duy nhất 1 thẻ:
       > `action: "CONTINUE"`, `drugId: "tiotropium"`, `title: "Tiếp tục duy trì phác đồ ba thành phần (ICS + LAMA + LABA – Tiotropium)"`
     - Hậu quả: bình `budesonide_formoterol` (`ICS + LABA`) biến mất khỏi đơn thuốc, trong khi đơn chất `Tiotropium` bị gọi sai là phác đồ 3 thành phần `ICS + LAMA + LABA`!
  3. **Hai quy tắc `azithromycin_continue` và `biologic_continue` được tuyên bố trong `round2_RESPONSE.md` (§3.3) thực tế KHÔNG tồn tại trong mã nguồn (`C09`):**
     - Khi bệnh nhân đang dùng `azithromycin` dự phòng hoặc `dupilumab`/`mepolizumab`, tái khám phát **0 thẻ `CONTINUE`/`MONITOR`**, bỏ quên yêu cầu bắt buộc đánh giá lại lợi ích–nguy cơ của Azithromycin sau 1 năm, kiểm tra thính lực và ECG QTc định kỳ!
  4. **Đợt cấp nội viện (`rules.inpatient.ts`):** Thuốc hít duy trì dài hạn (`LABA+LAMA` / `Triple`) đang dùng cũng biến mất hoàn toàn khỏi kế hoạch nội viện.
- **Bằng chứng Guideline nguyên văn:**
  - **GOLD 2026 Report (PDF p. 75, 76, 80, 114):** *"This should be continued if benefit is documented"* (p. 75); *"If response to initial treatment is appropriate, maintain it"* (p. 76); *"continuation with LABA+ICS is an option"* (p. 80); *"we recommend continuing these treatments [inhaled LABDs with or without ICS] during the exacerbation or to start these medications as soon as possible before hospital discharge"* (p. 114).
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026 (PDF tr. 25 & tr. 40):** Azithromycin *"Chưa có dữ liệu nghiên cứu dùng kéo dài trên 1 năm về hiệu quả và độ an toàn"*; ưu tiên gộp bộ ba trong 1 dụng cụ hít duy nhất.
- **Hướng khắc phục đề xuất:** Bổ sung đầy đủ các quy tắc `CONTINUE` cho `LAMA`/`LABA`, `LABA+LAMA`, `ICS+LABA` (khi kiểm soát tốt và không thuộc diện rút ICS sai chỉ định), sửa `continue_triple` cho bộ ba mở (hoặc `CONTINUE` đủ cả 2 bình hoặc gợi ý `SWITCH` sang bộ ba 1 bình hít SITT), hiện thực hóa thực sự `azithromycin_continue` (kèm nhắc mốc 1 năm, ECG QTc, thính lực) và `biologic_continue`, đồng thời duy trì/khởi động lại thuốc hít nền trước xuất viện đợt cấp.

---

#### `[COPD-R3-R1-05]` `MAJOR` — Quy tắc theo dõi `ICS + LABA` tự động rút ICS (`SWITCH` sang `LABA + LAMA`) ở bệnh nhân còn khó thở có 0 đợt cấp năm qua ngay cả khi `BCAT ≥ 300 tế bào/µL`
- **Phân loại:** `rule` | **Định danh:** `copd.followup.ics_laba_step_up_or_switch` (`src/modules/copd/rules.followup.ts:527–623`, `src/modules/copd/helpers.ts:1000–1008`)
- **Tái hiện động trên Pipeline (`S3_followup_ics_laba_eos350_dyspnea`):**
  - **Đầu vào:** Bệnh nhân đang dùng `fluticasone_salmeterol` (`Seretide`), hiện còn khó thở (`mmrc: 2, cat: 16`), 12 tháng qua đạt `0` đợt cấp, **`bloodEos = 350 tế bào/µL` (`≥ 300`)**.
  - **Đầu ra thực tế:** Dòng 580–582 (`shouldSwitchToLabaLama = !hasAsthma && ((isGroupEConfirmed(ctx) && eos < 100) || !isGroupEConfirmed(ctx))`) ép rút ICS (`STOP fluticasone_salmeterol` + `SWITCH tiotropium_olodaterol`) cho mọi trường hợp `!isGroupEConfirmed(ctx)`, bất chấp `bloodEos = 350 /µL`!
- **Bằng chứng Guideline nguyên văn:**
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026, Biểu đồ 2.2 (PDF tr. 25 / trang in 15):** *"Nếu chỉ định ICS + LABA trước đó phù hợp, NB hiện không còn đợt cấp (gợi ý có đáp ứng về đợt cấp với điều trị ICS + LABA): NB hiện ít triệu chứng thì tiếp tục ICS + LABA; **NB hiện nhiều triệu chứng (vẫn còn khó thở) thì xem xét nâng bậc lên ICS + LABA + LAMA. Lưu ý ở người bệnh có BCAT/máu ≥ 300 tế bào/µL, nếu ngừng ICS có thể có nhiều đợt cấp hơn.**"*
  - **GOLD 2026 Report (PDF p. 77 & p. 80):** *"If blood eosinophils are ≥ 300 cells/µL de-escalation is more likely to be associated with the development of exacerbations"* (p. 77); *"Major symptoms: change to LABA+LAMA or LABA+LAMA+ICS depending on previous treatment response to ICS (Figure 3.12)"* (p. 80).
- **Hướng khắc phục đề xuất:** Ở nhánh `ICS + LABA` còn triệu chứng khó thở nhưng `0` đợt cấp năm qua: nếu `bloodEos ≥ 300 /µL` (hoặc có tiền sử khởi trị ICS đúng chỉ định / đáp ứng giảm đợt cấp với ICS và `bloodEos ≥ 100 /µL`), nâng bậc lên bộ ba `ICS + LAMA + LABA` thay vì rút bỏ ICS; chỉ chuyển ngang sang `LABA + LAMA` khi ICS trước đó kê không đúng chỉ định / không đáp ứng và `bloodEos < 300 /µL` (nhất là `< 100 /µL`).

---

#### `[COPD-R3-R1-06]` `MAJOR` — `src/engine/derive.ts` chưa sửa triệt để lỗi Vòng 2 `[COPD-R1V2-07]`: vẫn giữ ngưỡng cũ `modExac >= 2` của GOLD 2023 và vi phạm Fail-closed khi thiếu `fev1FvcRatio`
- **Phân loại:** `rule` | **Định danh:** `derivePatientData` (`src/engine/derive.ts:138–175`), `computeGold` (`src/engine/calculators/gold.ts:95`)
- **Tái hiện động trên Pipeline (`C01` & `C02`):**
  1. **`C01` (`moderateExacerbations: 1`, `hospitalizations: undefined`):** Tại `src/engine/derive.ts` dòng 158–160:
     ```ts
     const confirmedHighExac =
       (hospExac !== undefined && hospExac >= 1) ||
       (modExac !== undefined && modExac >= 2);
     ```
     Do vẫn viết cứng `modExac >= 2` (ngưỡng cũ GOLD 2023), `derived.goldGroup` trả về **`undefined`** thay vì **`"E"`**, trong khi chính các quy tắc trong `copd` đã xếp bệnh nhân vào Nhóm E (`≥ 1` đợt cấp trung bình)!
  2. **`C02` (`fev1FvcRatio: undefined`, `fev1PredPct: 62`, `mmrc: 2, cat: 14, modExac: 0, hosp: 0`):** Tại `derive.ts:139` (`if (postBdrRatio === undefined || postBdrRatio < 0.7)`), hệ thống vẫn gán `derived.goldGrade = "GOLD 2"` và `derived.goldGroup = "B"` trên hồ sơ bệnh án dù **chưa hề có chỉ số `FEV₁/FVC < 0.70` sau giãn phế quản để xác nhận COPD**, đồng thời 3 quy tắc không dùng thuốc của COPD (`vaccinations`, `weak_inspiratory_flow_device`, `smoking_cessation`) vẫn phát khuyến cáo mang nhãn COPD!
- **Bằng chứng Guideline nguyên văn:**
  - **GOLD 2026 Report, Chapter 2 (PDF p. 54):** *"Consequently, Group E has been modified to include individuals with one moderate exacerbation in the previous year."*
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026, Bảng 1.4 (PDF tr. 18):** *"BPTNMT nhóm E - Nguy cơ cao: có từ 1 đợt cấp mức độ trung bình hoặc nặng trong năm trước."*
- **Hướng khắc phục đề xuất:** Sửa `modExac >= 2` thành `modExac >= 1` (dùng `thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')`) tại `src/engine/derive.ts:160`; bắt buộc `postBdrRatio !== undefined && postBdrRatio < 0.7` mới gán `derived.goldGrade` / `derived.goldGroup` trong `derive.ts` & `gold.ts`; chặn các quy tắc `copd.nonpharm.*` bằng `hasConfirmedCopdSpirometry(ctx) || isAcuteExacerbation(ctx)`.

---

#### `[COPD-R3-R1-07]` `MAJOR` — Bỏ sót hoàn toàn khuyến cáo độc lập về Phục hồi chức năng hô hấp (Pulmonary Rehabilitation) cho tất cả bệnh nhân Nhóm B, Nhóm E và sau đợt cấp nhập viện
- **Phân loại:** `missing` | **Định danh:** `copd.nonpharm.pulmonary_rehabilitation` (`src/modules/copd/rules.escalation.ts`, `src/modules/copd/rules.inpatient.ts`)
- **Tái hiện động trên Pipeline (`C11`, `C12`, `copd_preset_group_b`, `copd_preset_group_e_triple`, `copd_preset_inpatient_exac_0245`):** Không một ca bệnh Nhóm B, Nhóm E hay đợt cấp nhập viện nào nhận được khuyến cáo Phục hồi chức năng hô hấp!
- **Bằng chứng Guideline nguyên văn:**
  - **GOLD 2026 Report, Chapter 3 (PDF p. 61, Figure 3.2, p. 86) & Chapter 4 (PDF p. 120):** *"Pulmonary rehabilitation, including exercise training combined with disease-specific education, improves exercise capacity, symptoms, and quality of life across all grades of COPD severity"* (Essential treatment cho **Group B & Group E**, Evidence A); *"Early rehabilitation post hospital discharge (i.e., < 4 weeks) is associated with improved quality of life and increased exercise capacity and may be associated with decreased readmission rate and improved survival."*
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026 (Chương 2 mục 2.2.4, Chương 4 PDF tr. 50 & Chương 5):** Phục hồi chức năng hô hấp là trụ cột điều trị không dùng thuốc bắt buộc ở Nhóm B, Nhóm E và sau đợt cấp.
- **Hướng khắc phục đề xuất:** Bổ sung quy tắc độc lập `copd.nonpharm.pulmonary_rehabilitation` (`action: 'REFER'`, `tier: 'Điều trị không dùng thuốc'`) cho mọi bệnh nhân COPD xác nhận thuộc Nhóm B hoặc Nhóm E (`isHighSymptomsConfirmed(ctx) || isGroupEConfirmed(ctx)`) và cho bệnh nhân đợt cấp nhập viện (khởi động trong vòng `< 4 tuần` sau xuất viện).

---

#### `[COPD-R3-R1-08]` `MAJOR` — `DPI_INHALER_IDS` bỏ sót `fluticasone_salmeterol` (`Seretide Accuhaler`), `salmeterol` (`Serevent Accuhaler`), `budesonide_formoterol` (`Symbicort Turbuhaler`) khiến dị ứng nặng đạm sữa bò và lực hít yếu không được cảnh báo
- **Phân loại:** `rule` | **Định danh:** `DPI_INHALER_IDS` (`src/modules/copd/helpers.ts:116–131`), `copd.safety.milk_protein_dpi_contra` (`src/modules/copd/rules.safety.ts:328–383`)
- **Tái hiện động trên Pipeline (`C16.onSeretide`):** Bệnh nhân có `severeMilkProteinAllergy: true` đang dùng `fluticasone_salmeterol` (`Seretide Accuhaler 50/500`): hệ thống phát **0 cảnh báo `STOP`/`SWITCH`** (dù `salmeterol.json` trong KB có khai báo `severe_milk_protein_allergy` và `round2_RESPONSE.md` dòng 195 tuyên bố đã bao phủ Seretide Accuhaler)!
- **Hướng khắc phục đề xuất:** Bổ sung `salmeterol`, `serevent`, `fluticasone_salmeterol`, `seretide`, `advair` và xử lý rõ dạng bào chế của `budesonide_formoterol` / `budesonide` trong `DPI_INHALER_IDS`.

---

#### `[COPD-R3-R1-09]` `MAJOR` — Xử trí đợt cấp nội viện bỏ quên 2 trường lâm sàng trên UI (`increasedSputumVolume`, `accessoryMuscleUse`), áp sai tiêu chuẩn kháng sinh Anthonisen & chỉ định NIV, và bỏ trống `drugId`/liều ở dự phòng VTE
- **Phân loại:** `rule` | **Định danh:** `copd.inpatient.antibiotics`, `copd.inpatient.niv_bipap`, `copd.inpatient.vte_prophylaxis` (`src/modules/copd/rules.inpatient.ts:247–350, 502–571`)
- **Chi tiết 3 lỗi logic đã kiểm chứng động (`S5a`, `S5b`):**
  1. **Kháng sinh đợt cấp (`rules.inpatient.ts:256–265`):** Chỉ kiểm tra `Boolean(purulentSputum)` (1 triệu chứng đơn độc) và **không hề đọc `customInputs.increasedSputumVolume`** (`inputs.ts:298`) hay tăng khó thở / sốt. Theo **GOLD 2026 (PDF p. 115)** (*"Have these at least two of these symptoms: increase in dyspnea, fever, sputum volume, and sputum purulence, if increased purulence of sputum is one of these symptoms"*) và **BYT QĐ 2131/2026 (PDF tr. 36)**, bắt buộc có **≥ 2 triệu chứng chính** (trong đó có đờm mủ) hoặc cần thông khí cơ học mới chỉ định kháng sinh.
  2. **Thở máy không xâm nhập NIV (`rules.inpatient.ts:301–311`):** Chỉ kiểm tra `pH ≤ 7.35 && PaCO₂ ≥ 45` mà **không hề đọc `customInputs.accessoryMuscleUse`** (`inputs.ts:304`: *"Co kéo cơ hô hấp phụ / Thở ngực bụng nghịch thường"*) hay giảm oxy máu kháng trị. Theo **BYT QĐ 2131/2026 (PDF tr. 42)** và **GOLD 2026 Figure 4.8 (p. 118)**, NIV được chỉ định khi có **ít nhất 1 trong 3 tiêu chuẩn** (1: khó thở nặng mệt cơ hô hấp / thở bụng-ngực nghịch thường; 2: `pH ≤ 7.35` và `PaCO₂ ≥ 45`; 3: giảm oxy máu không đáp ứng oxy liệu pháp).
  3. **Dự phòng VTE (`rules.inpatient.ts:540–569`):** Phát `action: 'START'` nhưng không truyền `drugId` (`enoxaparin` / `heparin`) và `dose`, làm vô hiệu hóa cổng kiểm tra an toàn tự động `evaluateSafetyGates()`.
- **Hướng khắc phục đề xuất:** Kết nối `increasedSputumVolume` + bổ sung `increasedDyspnea`/`fever` vào tiêu chuẩn kháng sinh Anthonisen (`≥ 2` triệu chứng có đờm mủ); kết nối `accessoryMuscleUse` + tần số thở + giảm oxy máu kháng trị vào `copd.inpatient.niv_bipap`; gắn `drugId` và liều chuẩn cho `vte_prophylaxis`.

---

#### `[COPD-R3-R1-10]` `MAJOR` — `copd.outpatient.home_niv` phát gợi ý thở máy tại nhà ngay cả khi bệnh nhân ngoại trú đang toan hô hấp cấp mất bù (`pH = 7.29`) không cảnh báo nhập viện cấp cứu, và khi không có tiền sử nhập viện (`hospitalizations = 0`)
- **Phân loại:** `rule` | **Định danh:** `copd.outpatient.home_niv` (`src/modules/copd/rules.escalation.ts:413–449`)
- **Tái hiện động trên Pipeline (`S8a` & `S8c`):**
  - `S8c` (ngoại trú, `abgPh: 7.29, abgPaco2: 58`, chưa bật cờ `acuteExacerbation`): hệ thống phát **0 cảnh báo đỏ chuyển cấp cứu**, mà lại gợi ý `CONSIDER` **Home NIV tại nhà**! Toan hô hấp cấp mất bù `pH ≤ 7.35` là tình trạng cấp cứu nội viện bắt buộc!
  - `S8a` (`hospitalizations: 0`, `abgPaco2: 55`): vẫn gợi ý Home NIV dù **BYT QĐ 2131/2026 (PDF tr. 27)** quy định rõ *"Tăng CO2 ban ngày kéo dài (PaCO2 ≥ 53 mmHg) **và có tiền sử nhập viện gần đây**"* (tương ứng tiêu chuẩn HOT-HMV đánh giá sau 2–4 tuần xuất viện trong **GOLD 2026 PDF p. 61, 89**).
- **Hướng khắc phục đề xuất:** Bổ sung cảnh báo đỏ chuyển cấp cứu nội viện ngay khi ngoại trú có `abgPh ≤ 7.35` (hoặc `SpO₂ < 88%` cấp / rối loạn tri giác); chặn `copd.outpatient.home_niv` khi `abgPh ≤ 7.35` và yêu cầu `hospitalizations ≥ 1`.

---

#### `[COPD-R3-R1-11]` `MAJOR` — Thiếu quy tắc an toàn chặn Methylxanthine (`theophylline`/`aminophylline`) và thuốc an thần/opioid ức chế hô hấp trong đợt cấp tăng CO₂ máu + sai trích dẫn/giải thích của `roflumilast_contra` khi dùng kèm `theophylline`
- **Phân loại:** `missing` / `rule` | **Định danh:** `rules.safety.ts`, `rules.inpatient.ts`, `copd.escalation.roflumilast_contra`
- **Tái hiện động trên Pipeline (`S7` & `C10`):**
  - Trong `S7` (đợt cấp suy hô hấp toan tăng CO₂ `pH 7.29, PaCO₂ 58 mmHg`, đang có `theophylline`, `diazepam`, `morphine` trong `currentMeds`): phân hệ `copd` phát **0 cảnh báo `STOP`/`AVOID`**!
  - Trong `C10` (chức năng gan bình thường nhưng đang uống `theophylline`): `copd.escalation.roflumilast_contra` vẫn trích dẫn `fda.copd.roflumilast_contra_liver` và mở đầu giải thích bằng chống chỉ định suy gan Child-Pugh B/C!
- **Bằng chứng Guideline nguyên văn:**
  - **GOLD 2026 Report (PDF p. 103 & p. 114):** *"Intravenous methylxanthines (theophylline or aminophylline) are not recommended in these patients due to significant side effects."*
  - **Bộ Y tế QĐ 2131/QĐ-BYT 2026 (PDF tr. 30, 39):** Thuốc an thần/gây ngủ làm ức chế trung tâm hô hấp thúc đẩy toan tăng CO₂; methylxanthine nhiều tác dụng phụ và tương tác thuốc.
- **Hướng khắc phục đề xuất:** Thêm quy tắc cảnh báo `STOP`/`AVOID` methylxanthine trong đợt cấp (và cân nhắc ngừng/đổi sang giãn phế quản hít ở giai đoạn ổn định), cảnh báo `STOP`/`AVOID` benzodiazepine/opioid gây ức chế hô hấp khi tăng CO₂ máu/toan hô hấp, và tách động `citationIds`/giải thích của `roflumilast_contra` theo đúng nguyên nhân chặn.

---

#### `[COPD-R3-R1-12]` `MAJOR` — Thiếu trường nhập liệu trên UI (`src/modules/copd/inputs.ts`) làm tê liệt nhiều quy tắc an toàn/độ nặng (`narrowAngleGlaucoma`, `urinaryRetention`, `sabaUsePerWeek`, `respiratoryRate`, `increasedDyspnea`), cộng với nhãn `qtcProlonged` lệch chuẩn BYT 2131/2026
- **Phân loại:** `ui` | **Định danh:** `copdInputs` (`src/modules/copd/inputs.ts:1–319`)
- **Chi tiết:**
  - Các quy tắc `copd.safety.lama_anticholinergic_caution` (cần `narrowAngleGlaucoma` / `urinaryRetention`) và `copd.safety.saba_overuse` (cần `sabaUsePerWeek`) không có bất kỳ ô nhập liệu nào trên giao diện COPD độc lập!
  - Nhóm nội viện thiếu `respiratoryRate` (tần số thở ≥ 24 / > 30 lần/phút theo Rome GOLD 2026 & Bảng 3.2/3.3 BYT 2131/2026) và `increasedDyspnea` / `fever`.
  - Nhãn `customInputs.qtcProlonged` (`inputs.ts:176`) ghi `(> 450 ms nam / > 470 ms nữ)` mâu thuẫn với `helpers.ts:749` và **BYT QĐ 2131/2026 (PDF tr. 25)** quy định chống chỉ định Azithromycin ở mốc chung `QTc > 450 ms`.
- **Hướng khắc phục đề xuất:** Bổ sung đầy đủ các trường nhập liệu còn thiếu vào `src/modules/copd/inputs.ts` và đồng bộ nhãn `qtcProlonged` theo mốc `QTc > 450 ms` của BYT QĐ 2131/2026.

---

### C. Nhóm Tinh chỉnh Guideline, Trích dẫn & Ma trận (`MINOR` – 5 phát hiện)

---

#### `[COPD-R3-R1-13]` `MINOR` — Chưa phản ánh đầy đủ khác biệt giữa GOLD 2026 (`INTL`) và Bộ Y tế QĐ 2131/QĐ-BYT 2026 (`VN`) về thời gian kháng sinh đợt cấp (`5–7` / `7–10 ngày`), dải liều corticoid TM (`40–80 mg/ngày`) và tiêu chuẩn mở rộng LTOT (thiếu `tăng áp động mạch phổi`, lệch `SaO₂ ≤ 88%` vs `89%`)
- **Định danh:** `rules.inpatient.ts:234–238, 275–282`, `rules.escalation.ts:502–558`, `inputs.ts:244`
- **Bằng chứng BYT 2131/2026 & GOLD 2026:** BYT QĐ 2131/2026 quy định kháng sinh ngoại trú `5–7 ngày` (Biểu đồ 3.1, tr. 37), nội trú nặng `thường 7–10 ngày` (Biểu đồ 3.2, tr. 41); methylprednisolon TM `1–2 mg/kg/ngày (40–80 mg/ngày)` (tr. 38); LTOT mở rộng ở `PaO₂ 56–59 mmHg hoặc SaO₂ ≤ 88%` kèm suy tim phải, đa hồng cầu (`Hct > 55%`) **hoặc tăng áp động mạch phổi** (tr. 26; trùng khớp GOLD 2026 PDF p. 87).

#### `[COPD-R3-R1-14]` `MINOR` — Gán sai ngữ cảnh trích dẫn `gold.copd.2026.initial_group_a` cho liều thận và chống chỉ định trong 4 tệp thuốc KB (`umeclidinium.json`, `aclidinium.json`, `salmeterol.json`, `theophylline.json`)
- **Chi tiết:** `gold.copd.2026.initial_group_a` chỉ nói về khởi trị giãn phế quản cho Nhóm A, hoàn toàn không chứa dữ liệu dược động học suy thận (`eGFR ≥ 15` / `< 15`), dị ứng đạm sữa bò, đơn trị LABA ở hen hay co giật/loạn nhịp do theophylline. Cần thay bằng trích dẫn nhãn FDA/SmPC tương ứng và `gold.copd.2026.concurrent_asthma`.

#### `[COPD-R3-R1-15]` `MINOR` — `gold.copd.2026.followup_exac_eos_100_300` (`kb/citations/copd.json:157–166`) thiếu câu quote nguyên văn quy định ngưỡng `≥ 100 cells/µL`
- **Chi tiết:** Quote hiện tại chỉ trích đoạn nói về mốc `≥ 300 cells/µL`, cần bổ sung câu nguyên văn tại **GOLD 2026 PDF p. 77**: *"A beneficial response after the addition of ICS may be observed at blood eosinophil counts ≥ 100 cells/µL, with a greater magnitude of response more likely with higher eosinophil counts."*

#### `[COPD-R3-R1-16]` `MINOR` — Lặp đúp mã trích dẫn `'byt.copd.2026.triple_therapy_indication'` tại 7 mảng trong `src/modules/copd/rules.followup.ts` và 32/74 mục trong `kb/citations/copd.json` dùng `"cor": "1"` không chuẩn La Mã
- **Chi tiết:** Khử trùng lặp mảng `citationIds` tại dòng 210–211, 251–252, 417–418, 439–440, 484–485, 533–534, 619 của `rules.followup.ts`, và chuẩn hóa trường `cor` trong `kb/citations/copd.json`.

#### `[COPD-R3-R1-17]` `MINOR` — `src/modules/copd/matrices.ts` (dòng 228 & 263) ghi sai rằng `Dupilumab` và `Mepolizumab` có chỉ định COPD theo `BYT 2131/2026`
- **Chi tiết:** Quét toàn bộ 130 trang PDF `BYT_2131_COPD_2026.pdf` xác nhận Bộ Y tế Việt Nam **chưa đưa `dupilumab` hay `mepolizumab` vào hướng dẫn COPD 2026** (0 lần xuất hiện). Cần sửa ghi chú tại dòng 228 & 263 thành *"theo GOLD 2026 (chưa có trong hướng dẫn BYT 2131/2026)"*.

---

### D. Nhóm Đề xuất Mở rộng Giá trị Lâm sàng (`SUGGESTION` – 1 phát hiện)

---

#### `[COPD-R3-R1-18]` `SUGGESTION` — Tận dụng trường `packYears` sẵn có để nhắc tầm soát ung thư phổi bằng CT liều thấp (LDCT), sàng lọc thiếu hụt Alpha-1 Antitrypsin (AATD) và giám sát nguy cơ tim mạch tăng vọt sau đợt cấp
- **Chi tiết:** `inputs.ts:213` đã thu thập `customInputs.packYears` nhưng chưa dùng. Có thể bổ sung nhắc nhở: (1) Chụp CT ngực liều thấp (LDCT) hàng năm cho người bệnh 50–80 tuổi hút thuốc `≥ 20 gói-năm` đang hút hoặc bỏ `< 15 năm` (**BYT QĐ 2131/2026 tr. 54**; GOLD 2026 Chapter 5); (2) Xét nghiệm sàng lọc AATD 1 lần (GOLD 2026 WHO recommendation); (3) Theo dõi tích cực biến cố tim mạch (suy tim, mạch vành, rung nhĩ) trong 30 ngày – 12 tháng sau đợt cấp (**GOLD 2026 p. 53** & **BYT QĐ 2131/2026 Chương 4.1 tr. 43–48**).

---

## Phần 3. Tổng hợp Đánh giá Toàn diện 7 Trục Kiểm định Lâm sàng

| Trục kiểm định | Điểm mạnh đã xác nhận | Điểm nghẽn cần sửa để đạt `PASS` |
| :--- | :--- | :--- |
| **1. Chẩn đoán & Phân nhóm GOLD 2026 ABE** | `copd` & `gold.ts` áp đúng `FEV₁/FVC < 0.70` và Nhóm E `≥ 1` đợt cấp vừa/nhập viện; phân độ GOLD 1–4 chuẩn. | Sửa `derive.ts:160` (`modExac >= 1` thay vì `>= 2`) và khóa Fail-closed khi thiếu `fev1FvcRatio` (`COPD-R3-R1-06`). |
| **2. Khởi trị & Theo dõi / Leo thang – Hạ bậc** | Khởi trị Nhóm A (`LAMA`), Nhóm B (`LABA+LAMA`), Nhóm E (`LABA+LAMA` vs `Triple` khi `BCAT ≥ 300`), leo thang `Roflumilast`, `Azithromycin`, `Dupilumab`, `Mepolizumab` chuẩn xác. | Bổ sung `CONTINUE` cho thuốc duy trì & thuốc leo thang (`COPD-R3-R1-04`), không rút ICS mù ở `ICS+LABA` có `BCAT ≥ 300` (`COPD-R3-R1-05`), thêm Phục hồi chức năng hô hấp (`COPD-R3-R1-07`). |
| **3. An toàn thuốc, DDI & Quần thể đặc biệt** | Chặn tốt ICS đơn trị, LABA thiếu ICS ở hen, trùng lặp bình hít đa bậc, Roflumilast (Child-Pugh B/C, BMI `< 18.5`, trầm cảm), Azithromycin (`GFR < 10`, QTc, thính lực, NTM), thai kỳ. | Không `STOP` đơn độc `carvedilol` ở HFrEF ổn định (`COPD-R3-R1-01`), sửa liều PRN AIR sai ở chống chỉ định LAMA (`COPD-R3-R1-03`), cập nhật `DPI_INHALER_IDS` (`COPD-R3-R1-08`), chặn methylxanthine & an thần/opioid khi toan CO₂ (`COPD-R3-R1-11`). |
| **4. Đợt cấp Nội viện, Oxy, NIV, VTE & LTOT** | Đích SpO₂ `88–92%`, cảnh báo quá liều oxy `> 92%`, phân biệt toan hô hấp vs toan chuyển hóa, chống chỉ định NIV sốc/hôn mê -> IMV, VTE chỉnh theo eGFR `< 30`/xuất huyết. | Sửa kháng sinh Anthonisen `≥ 2` triệu chứng, nối `accessoryMuscleUse` vào NIV, gắn `drugId` cho VTE (`COPD-R3-R1-09`), khóa an toàn `Home NIV` khi `pH ≤ 7.35` / `hosp = 0` (`COPD-R3-R1-10`). |
| **5. Phối hợp Đa phân hệ (`copd+hf`, `copd+asthma`, `copd+ckd`)** | Ngoại trú `copd+asthma` (GINA Track 1 MART + Tiotropium; Track 2 ICS đơn + Spiolto) và `copd+ckd` (Azithromycin GFR `< 10`, VTE UFH) hoạt động mượt mà. | Khử trùng lặp `dup.systemic_steroid` và giữ liều SABA cấp cứu giờ đầu ở nội viện `['copd', 'asthma']` (`COPD-R3-R1-02`); bảo vệ trụ cột chẹn beta ở `['copd', 'hf']` (`COPD-R3-R1-01`). |
| **6. Cơ sở Tri thức (19 Thuốc, 52 Ngưỡng, 74 Trích dẫn)** | 74/74 trích dẫn khớp nguyên văn PDF trong thư viện `Medical_Library_2026`; không còn dữ liệu bịa đặt. | Tách thận trọng glôcôm/BPH khỏi `contraindications` cứng (`COPD-R3-R1-03`), sửa trích dẫn mượn tạm `initial_group_a` (`COPD-R3-R1-14`), bổ sung quote mốc `100 /µL` (`COPD-R3-R1-15`), dọn trùng `citationIds` & `cor` (`COPD-R3-R1-16`). |
| **7. Giao diện UI, Presets & Ma trận** | Presets bao phủ các kịch bản cốt lõi, ma trận dụng cụ hít SMI/DPI/pMDI trực quan. | Bổ sung các trường UI còn thiếu trong `inputs.ts` (`COPD-R3-R1-12`), sửa ghi chú BYT 2131 ở hàng thuốc sinh học trong `matrices.ts` (`COPD-R3-R1-17`). |
