# Báo cáo Phản biện Độc lập Vòng 5 (Round 5 Audit Report) — Reviewer R1
**Phân hệ (Module):** Bệnh thận mạn & Tổn thương thận cấp (`ckd`)  
**Vai trò:** Reviewer R1 – Chuyên gia Độc lập Đối chiếu Guideline Quốc tế, Bộ Y tế & Nhãn Thuốc Gốc  
**Ngày kiểm định:** 28/10/2026  
**Phạm vi kiểm định:**
1. Hậu kiểm toàn bộ **31 cam kết khắc phục Vòng 4** (`round4_R1.json` [9 mục], `round4_R2.json` [10 mục], `round4_R3.json` [12 mục], `round4_RESPONSE.md`) và tích hợp cổng an toàn dùng chung (`src/engine/safety/**`, `src/ui/PatientForm.tsx`).
2. Đối chiếu độc lập 100% quy tắc lâm sàng (`src/modules/ckd/**` — 30 tệp), kho trích dẫn (`kb/citations/ckd.json` — 136 mục), ngưỡng định lượng (`kb/thresholds/ckd.json`), và 18 tệp thuốc sở hữu (`kb/drugs/*.json`) với tài liệu PDF gốc trong `Medical_Library_2026` (`KDIGO 2024 CKD`, `KDIGO 2022 Diabetes in CKD`, `KDIGO 2021 BP in CKD`, `KDIGO 2012 AKI`, `ESC 2026 CVD-CKD`, `ESC 2024 HTN`, `ESC 2025 Pregnancy`, `AHA/ACC 2025 HTN`, `ADA 2026 SOC 11`, `UKKA 2022 Hyperkalaemia`, `BYT 2024 QĐ 2388/QĐ-BYT` và hệ thống nhãn FDA/EMA SmPC) cùng kiểm chứng thực thi trực tiếp qua `evaluate()`.

---

## 1. Tổng quan Kết quả Kiểm định & Bảng Phân loại Mức độ

| Mức độ (Severity) | Số lượng | Mã định danh phát hiện |
| :--- | :---: | :--- |
| **Critical** | **2** | `CKD-R5-R1-01`, `CKD-R5-R1-02` |
| **Major** | **6** | `CKD-R5-R1-03`, `CKD-R5-R1-04`, `CKD-R5-R1-05`, `CKD-R5-R1-06`, `CKD-R5-R1-07`, `CKD-R5-R1-08` |
| **Minor** | **2** | `CKD-R5-R1-09`, `CKD-R5-R1-10` |
| **Suggestion** | **0** | — |
| **TỔNG CỘNG** | **10** | `docs/reviews/ckd/round5_R1.json` |

### Ghi nhận các hạng mục đạt chuẩn cao sau Vòng 4
- **So khớp nguyên văn PDF (`kb/citations/ckd.json`):** Toàn bộ **136/136 trích dẫn** trong `kb/citations/ckd.json` khớp nguyên văn 100% với trang PDF gốc trong `Medical_Library_2026` (`0` lệch trang/chữ); `npm run verify:kb` đạt `0` lỗi lint trên cả 30 tệp của module `ckd`.
- **Các lỗi trọng yếu Vòng 4 đã được khắc phục thực chất:**
  - Bộ phân tích liều hàng ngày đa tần suất / cách ngày (`parseCurrentDailyDoseMg` cho `Captopril` TID, `Valsartan` BID, `Perindopril` cách ngày, trần `Natri Bicarbonat 4000 mg/ngày` — `CKD-R4-R1-01`).
  - Cổng xác nhận tăng kali máu thực sự trước khi phát phác đồ hạ kali nội viện + chỉ định Calcium Gluconate theo biến đổi ECG (`CKD-R4-R1-02`).
  - Tách bạch mục tiêu huyết áp ở bệnh nhân lọc máu chu kỳ khỏi đích `< 120 mmHg` trên mọi hồ sơ `INTL`/`VN`/`US` (`CKD-R4-R1-03`) và phác đồ Lokelma (SZC) chỉ dùng vào ngày không lọc máu (`CKD-R4-R1-04`).
  - Tạm hoãn Finerenone khi nền ACEi đang vượt trần thận + cân nhắc theo dõi sớm K⁺ ở vùng `4.8 < K+ <= 5.0 mmol/L` (`CKD-R4-R1-05`).
  - Cổng xác nhận chẩn đoán CKD trước khi kê Statin / gán đích HA CKD ở người có `eGFR >= 60` (`CKD-R4-R1-06`), tích hợp phân tầng `KFRE 2 năm` (`10%` và `40%` — `CKD-R4-R1-07`), trần thận `Rosuvastatin <= 10 mg/ngày` khi `CrCl/eGFR < 30` chưa lọc máu, nhận diện tương tác CYP3A4 mạnh/trung bình với Finerenone và chống chỉ định phối hợp kép RAA (bao gồm FDC & Aliskiren).

Tuy nhiên, quá trình kiểm định độc lập bằng `evaluate()` và đối chiếu chéo mã nguồn với `round4_RESPONSE.md` phát hiện **2 lỗi an toàn liều thận mức Critical**, **6 lỗi logic thuật toán / bỏ sót cầu nối SGLT2i / trích dẫn sai nghĩa lâm sàng mức Major** (trong đó có các cam kết trong `round4_RESPONSE.md` chưa được áp vào mã nguồn thực tế), và **2 lỗi Minor**.

---

## 2. Chi tiết Các Phát hiện Kiểm định (Findings)

### 2.1. Nhóm Mức độ Nghiêm trọng Tối đa (`Critical`)

#### `CKD-R5-R1-01` [Critical] — Duy trì quá liều gấp 3 lần trần thận của `Canagliflozin` (`300 mg/ngày` thay vì tối đa `100 mg/ngày`) ở CKD G3a–G5 (`eGFR < 60 mL/phút/1.73m²`) & gắn nhầm trích dẫn Farxiga
- **Vị trí:** `src/modules/ckd/rules.outpatient.sglt2i.ts:248-252, 283-318, 328-367` và `src/engine/safety/vitalAndRenalGates.ts:141-176`.
- **Phân tích lâm sàng & kỹ thuật:**
  - Theo nhãn FDA Invokana chính thức (*Section 2.3 Table 1*, `FDA_label_canagliflozin.pdf`, tr. 5) và `kb/drugs/canagliflozin.json:45-66`, khi **`eGFR 30 đến < 60 mL/phút/1.73m²`**, liều khuyến cáo tối đa của Canagliflozin là **`100 mg uống 1 lần/ngày`** (do liều 300 mg làm tăng rõ rệt tỷ lệ tụt thể tích tuần hoàn, hạ huyết áp và suy thận cấp — *Table 5, Section 6.1*, tr. 12); khi **`eGFR < 30 mL/phút/1.73m²`**, chỉ được tiếp tục duy trì ở mức **`100 mg 1 lần/ngày`**.
  - Tuy nhiên, cả `ckd.outpatient.sglt2i_continue` và `ckd.outpatient.sglt2i_continue_below_20` đều sao chép nguyên xi `formatCurrentMedDose(activeSglt2i)` vào `dose` với hành động `'CONTINUE'`, còn `vitalAndRenalGates.ts` chỉ kiểm tra `statusToCheck === 'contra'` mà bỏ qua `maxDose: "100 mg"`.
  - Đồng thời, `sglt2i_initiate` (dòng 250) và `sglt2i_continue` (dòng 314) gắn cứng `'fda.dapagliflozin.ckd_dose'` (Farxiga) ngay cả khi kê/duy trì `canagliflozin` hoặc `empagliflozin`.
- **Kiểm chứng `evaluate()`:**
  - Bệnh nhân ĐTĐ2 + CKD G3b (`egfr: 38`, `uacr: 45`, `k: 4.2`) đang uống `Canagliflozin 300 mg 1 lần/ngày` $\rightarrow$ phát **`[CONTINUE] rec_ckd_sglt2i_continue_standard | dose="300 mg (1 lần/ngày)" | title="Tiếp tục duy trì Canagliflozin" | cites=...,fda.dapagliflozin.ckd_dose`**.
  - Cùng bệnh nhân ở `egfr: 18` $\rightarrow$ phát **`[CONTINUE] rec_ckd_sglt2i_continue | dose="300 mg (1 lần/ngày)" | title="Tiếp tục duy trì Canagliflozin dù eGFR < 20"`**.
- **Hướng xử lý:** Kiểm tra khi hoạt chất là `canagliflozin`, `egfr < 60` và tổng liều ngày `> 100 mg` để phát **`[REDUCE]`** hạ về `100 mg 1 lần/ngày` (cả ở module `ckd` và cổng thận dùng chung), đồng thời ánh xạ động trích dẫn FDA theo đúng hoạt chất SGLT2i.

---

#### `CKD-R5-R1-02` [Critical] — Thẻ khuyến cáo tự mâu thuẫn trên viên phối hợp FDC `SGLT2i + Metformin` liều cao ở `eGFR 30–44 mL/phút/1.73m²`: gắn nhãn `[REDUCE]` nhưng tiêu đề giữ `"Tiếp tục duy trì Synjardy"` và kê nguyên liều `2000 mg/ngày` Metformin
- **Vị trí:** `src/engine/safety/vitalAndRenalGates.ts:120-130`, `src/engine/safety/gates.ts`, và `src/modules/ckd/rules.outpatient.sglt2i.ts:283-318`.
- **Phân tích lâm sàng & kỹ thuật:**
  - Ở bệnh nhân CKD G3b (`30 <= eGFR < 45`, ví dụ `eGFR = 38`) đang dùng `Synjardy 12.5/1000 mg x 2 lần/ngày` (= **2000 mg Metformin/ngày**, gấp đôi trần an toàn `<= 1000 mg/ngày` theo KDIGO 2024 Figure 28 / BYT 2024 Bảng 44), `sglt2i_continue` tạo thẻ `CONTINUE` với `dose: "12.5/1000 (2 lần/ngày)"` và `title: "Tiếp tục duy trì Synjardy"`.
  - Sau đó, `vitalAndRenalGates.ts:129` đổi `state.updatedAction = 'REDUCE'` nhưng **không cập nhật `state.updatedTitle`, không sửa/xóa `rec.dose` và không cập nhật `state.updatedRationale`**.
- **Kiểm chứng `evaluate()`:**
  - Input: `egfr: 38`, `Synjardy 12.5/1000 mg x 2 lần/ngày`.
  - Output: `action: "REDUCE"`, **`title: "Tiếp tục duy trì Synjardy"`**, **`dose: "12.5/1000 (2 lần/ngày)"`**, **`rationale: "Bệnh nhân đang dung nạp tốt SGLT2i và có eGFR 38 mL/phút/1.73m² ≥ 20. Tiếp tục duy trì..."`**.
- **Hướng xử lý:** Cập nhật đồng bộ `updatedTitle`, `rec.dose` và `updatedRationale` trong cả `vitalAndRenalGates.ts:120-130` lẫn `sglt2i_continue` để chỉ rõ yêu cầu giảm thành phần Metformin xuống `<= 1000 mg/ngày` (đổi hàm lượng `500 mg x 2` hoặc tách viên SGLT2i đơn chất).

---

### 2.2. Nhóm Mức độ Lớn (`Major`)

#### `CKD-R5-R1-03` [Major] — Đứt gãy cầu nối chuyển đổi viên đơn chất SGLT2i khi ngừng FDC `Synjardy` / `Xigduo` / `Invokamet` ở `eGFR < 20 mL/phút/1.73m²` chưa lọc máu (`CKD-R4-R2-01` / `R3-03` khắc phục dở dang)
- **Vị trí:** `src/modules/ckd/rules.outpatient.safety_extra.ts:58-64` đối chiếu `src/modules/ckd/rules.outpatient.sglt2i.ts:33, 53, 336`.
- **Phân tích:** Khi bệnh nhân đang ổn định với `Synjardy` có eGFR giảm xuống `18 mL/phút/1.73m²` (chưa lọc máu), `safety_extra.ts` phát `[STOP] Synjardy` và viết trong `rationale`: *"chuyển sang viên đơn chất Empagliflozin (duy trì được tới trước khi lọc máu theo KDIGO 2024 Rec 3.7.1 & PP 3.7.1 nếu đã dùng SGLT2i từ trước)"*. Thế nhưng `sglt2i_initiate` chặn `egfr < 20`, còn `sglt2i_continue_below_20` lại chặn `!hasMetforminComponent(med)` $\rightarrow$ xuất **0 thẻ SGLT2i đơn chất**, làm đứt gãy điều trị SGLT2i trái với KDIGO 2024 PP 3.7.1 (trong khi ở `eGFR = 24` hệ thống vẫn phát `[START] Empagliflozin 10 mg`).

---

#### `CKD-R5-R1-04` [Major] — Hai bế tắc thuật toán (deadlock) giữa `rasi_uptitrate` và `finerenone_indication` ở bệnh nhân hạ huyết áp tư thế (`orthostaticHypotension`) và suy gan `Child-Pugh B` dùng `Candesartan 16 mg` (kèm báo cáo sai thực tế trong `round4_RESPONSE.md`)
- **Vị trí:** `src/modules/ckd/rules.outpatient.rasi_titration.ts:55, 106-114`, `src/modules/ckd/rules.outpatient.finerenone.ts:278-310`, `src/modules/ckd/rules.outpatient.rasi.ts:210-279`.
- **Phân tích:**
  1. **`orthostaticHypotension` (hồi quy từ `CKD-R4-R3-08`):** `rasi_titration.ts:55` chặn tăng liều RASi khi có hạ HA tư thế, nhưng `finerenone.ts:291-310` không kiểm tra `orthostaticHypotension`, dẫn tới phát `[DEFER] Finerenone ("Losartan hiện mới ở liều 50 mg/ngày (< liều đích dung nạp 100 mg/ngày)")` — vừa khuyên tăng liều RASi bất chấp hạ HA tư thế, vừa khóa oan Finerenone.
  2. **`Child-Pugh B` + `Candesartan 16 mg/ngày`:** `round4_RESPONSE.md` (dòng 116, 219) và `docs/modules/CKD.md` (dòng 23) tuyên bố `rasi.ts` khởi trị `Candesartan 8 mg/ngày` ở suy gan nhẹ–vừa, nhưng `candesartan` hoàn toàn không có mặt trong `candidatePool` của `rasi.ts`. Hơn nữa, `rasi_titration.ts:106-114` khóa tăng liều Candesartan ở `16 mg/ngày` khi Child-Pugh B (hiểu nhầm liều khởi đầu 8 mg trong nhãn FDA Atacand Mục 2.1 thành trần tối đa duy trì), trong khi `finerenone.ts` vẫn giữ trần `32 mg/ngày` $\rightarrow$ tại `Candesartan 16 mg/ngày`, `rasi_uptitrate` im lặng còn `finerenone_indication` phát `[DEFER]` đòi tăng Candesartan lên `32 mg/ngày`!

---

#### `CKD-R5-R1-05` [Major] — Trụ cột 4 GLP-1 RA bị vô hiệu hóa bởi các thuốc không có bằng chứng bảo vệ thận (`exenatide`, `lixisenatide`) và bỏ lọt chống chỉ định thận của `exenatide` (`eGFR < 30`) / `lixisenatide` (`eGFR < 15`)
- **Vị trí:** `src/modules/ckd/rules.outpatient.glp1ra.ts:110` và `src/modules/ckd/helpers.drugs.ts:50-57, 102`.
- **Phân tích:** `glp1ra_indication` thoát sớm hễ thấy bất kỳ thuốc nào thuộc `GLP1RA_SET`. Khi bệnh nhân ĐTĐ2 + CKD G4 (`eGFR = 20`, `UACR = 55`) đang dùng `exenatide` (thải qua thận, chống chỉ định/không khuyến cáo khi `eGFR < 30` do tích lũy và nguy cơ AKI) hoặc `lixisenatide` (không có lợi ích tim–thận trong ELIXA, không khuyến cáo khi `eGFR < 15` theo BYT 2024 Bảng 45 tr. 135), hệ thống xuất **0 cảnh báo an toàn thận** và **0 khuyến cáo chuyển đổi sang `Semaglutide (SC)`** (Class I, Level A theo ESC 2026 Bảng 12; Level A theo ADA 2026 Rec 11.7b; 1B theo KDIGO 2024 Rec 3.9.1).

---

#### `CKD-R5-R1-06` [Major] — Chưa khắc phục lỗi trích dẫn sai nghĩa ở cụm suy gan `Telmisartan` & `Candesartan` (`CKD-R4-R2-09`): dùng bảng chỉnh liều thận BYT và nhãn Entresto/Cozaar cho chống chỉ định gan của Telmisartan/Candesartan
- **Vị trí:** `kb/thresholds/ckd.json:1022-1030`, `src/modules/ckd/rules.outpatient.rasi_safety.ts:61-65, 97-100, 148-158`, `src/engine/safety/hepaticSafety.ts:115, 127, 144, 299`, `kb/drugs/telmisartan.json`, `kb/drugs/candesartan.json`.
- **Phân tích:** Trái với `round4_RESPONSE.md` (dòng 112, 139–140), mục `fda.candesartan.hepatic_impairment` chưa hề được tạo trong `kb/citations/`. Ngưỡng `ckd.rasi.telmisartan_hepatic_max_dose` (`40 mg`) dẫn duy nhất `byt.ckd.2024.table_12_telmisartan_valsartan` (câu trích dẫn hoàn toàn nói về lọc thận nhân tạo, không có một từ nào về gan/mật!), còn các quy tắc và tệp thuốc `candesartan`/`telmisartan` dẫn nhãn `fda.sacubitril_valsartan.hepatic_child_pugh_c` (Entresto) và `fda.losartan.hepatic_impairment` (Cozaar), mặc dù `FDA_label_candesartan.pdf` (Mục 2.1 tr. 4 & Mục 12.3 tr. 15) đã có sẵn trong `Medical_Library_2026`.

---

#### `CKD-R5-R1-07` [Major] — Lỗi gắn nhầm trích dẫn diện rộng ở quy tắc Cho con bú (`Lactation`) và Dị ứng / Phù mạch (`Allergy`) (`CKD-R4-R2-03` khắc phục chưa triệt để)
- **Vị trí:** `src/modules/ckd/rules.outpatient.safety_extra.ts:183, 187, 233-237`, `finerenone.ts:210`, `rasi.ts:143`, `glp1ra.ts:252`, và `kb/drugs/{losartan,perindopril,finerenone,dapagliflozin,...}.json`.
- **Phân tích:**
  1. Thẻ `[STOP] Dapagliflozin`, `[STOP] Atorvastatin`, `[STOP] Finerenone` khi cho con bú (`ckd.safety.lactation_stop_*`) bị gắn cứng 3 trích dẫn thuốc hạ áp RASi (`esc.2025.pregnancy.rasi_lactation`, `fda.losartan.lactation_8_2`, `ema.perindopril.lactation_4_6`).
  2. `rec_ckd_finerenone_avoid_lactation` nêu rõ *"Theo nhãn FDA Kerendia (Mục 8.2)... ít nhất 1 ngày sau liều cuối"* nhưng lại gắn `fda.finerenone.pregnancy` (chỉ trích Mục 8.1 Thai kỳ; câu nguyên văn Mục 8.2 nằm ở `FDA_label_finerenone.pdf` tr. 23).
  3. Trái với `round4_RESPONSE.md:100`, `kb/drugs/losartan.json:130-132` vẫn dẫn `fda.losartan.boxed_pregnancy` và `kb/drugs/perindopril.json:130-132` vẫn dẫn `ema.perindopril.pregnancy` cho trường `lactation` dù `fda.losartan.lactation_8_2` và `ema.perindopril.lactation_4_6` đã có trong `kb/citations/ckd.json`.
  4. Thẻ `[STOP]` do dị ứng thuốc (`ckd.safety.active_allergy_stop_*`, ví dụ dị ứng `Dapagliflozin`) gắn `ema.perindopril.pregnancy` (cảnh báo thai kỳ Perindopril!), còn `rec_ckd_glp1ra_contra_allergy` gắn `fda.semaglutide.boxed_warning_mtc` (ung thư giáp thể tủy MTC thay vì quá mẫn Mục 4).

---

#### `CKD-R5-R1-08` [Major] — Quy tắc chống chỉ định Metformin ở `eGFR < 30` / toan chuyển hóa nặng (`HCO3- < 12`) và chống chỉ định RASi ở hẹp động mạch thận hai bên gắn trích dẫn lệch nội dung
- **Vị trí:** `src/modules/ckd/rules.outpatient.safety_extra.ts:88-94, 136-142`, `src/modules/ckd/rules.outpatient.acidosis.ts:143`, `src/modules/ckd/rules.outpatient.rasi.ts:104-114`.
- **Phân tích:**
  1. Cả quy tắc ngừng Metformin khi `eGFR < 30` / lọc máu (viện dẫn Cảnh báo Hộp đen MALA) lẫn quy tắc tạm ngưng Metformin khi `HCO3- < 12 mmol/L` đều dẫn `'fda.metformin.contrast_discontinue'` (chỉ nói về ngừng trước chụp cản quang iod ở `eGFR 30–60`), trong khi `FDA_label_metformin.pdf` Mục 4 tr. 8 có nguyên văn cả hai chống chỉ định `"Severe renal impairment (eGFR below 30 mL/min)"` và `"Acute or chronic metabolic acidosis, including diabetic ketoacidosis"`.
  2. Cả hai quy tắc chống chỉ định RASi ở hẹp động mạch thận hai bên tuyên bố *"Theo KDIGO 2024 (Figure 24): Chống chỉ định..."* nhưng Figure 24 (`kdigo.ckd.2024.fig_24_consider_ras_stenosis`) chỉ ghi gạch đầu dòng chẩn đoán `"Consider renal artery stenosis"` khi SCr tăng > 30%. Trích dẫn chống chỉ định chính tắc nằm sẵn trong `perindopril_Coversyl_SmPC.pdf` Mục 4.3 tr. 2 và `AHA_ACC_2025_High_Blood_Pressure_Guideline.pdf` Bảng 18 tr. 40.

---

### 2.3. Nhóm Mức độ Nhỏ (`Minor`)

#### `CKD-R5-R1-09` [Minor] — Bất đối xứng `isOutpatientAcuteCrisis` trong `rasi_initiate`, thiếu thẻ `REFER` cấp cứu khi `dkaSuspected: true` có `HCO3- >= 12 mmol/L` ở đơn module `ckd`, và gắn nhầm `ukka.2022.guideline_16_2_calcium_salts` khi Kali máu bình thường
- **Vị trí:** `src/modules/ckd/rules.outpatient.rasi.ts:34-48`, `src/modules/ckd/rules.outpatient.acidosis.ts:35`, `src/engine/safety/crisisAndHypoGates.ts:142`.
- **Phân tích:** Khi `dkaSuspected: true` kèm `hco3: 14, k: 4.3, sbp: 132`, `rasi_initiate` (trụ cột duy nhất thiếu `isOutpatientAcuteCrisis(ctx)`) phát `START Losartan` rồi bị `crisisAndHypoGates.ts` đổi thành `[DEFER] Losartan` kèm gắn cứng `ukka.2022.guideline_16_2_calcium_salts` (tiêm Canxi tĩnh mạch tăng kali!), đồng thời không có thẻ `[REFER]` cấp cứu nào được phát vì `acidosis_emergency_refer` chỉ kiểm tra `hco3 < 12` còn `nephrology_referral` tự tắt khi có crisis.

---

#### `CKD-R5-R1-10` [Minor] — 47 mục nhãn thuốc FDA/EMA, phụ lục SmPC UKKA và bảng/văn bản BYT 2024 không phân hạng trong `kb/citations/ckd.json` vẫn gắn `cor`/`loe` tự đặt + chưa cập nhật `med.unit` & `med.freq` tại `src/ui/PatientForm.tsx:579`
- **Vị trí:** `kb/citations/ckd.json` (47 mục `fda.*`, `ema.*`, `ukka.2022.appendix_3f_*`, `byt.ckd.2024.*`) và `src/ui/PatientForm.tsx:579`.
- **Phân tích:** Sau khi dọn `cor`/`loe` cho KDIGO Practice Points ở Vòng 4, vẫn còn 47 mục trích dẫn từ nhãn thuốc FDA/EMA (`fda.finerenone.pregnancy` gắn `2B`, `fda.canagliflozin.hepatic_impairment` gắn `strong / B`, 22 mục `fda.*` gắn `1A`), phụ lục SmPC UKKA và bảng/văn bản BYT 2024 mang nhãn `cor`/`loe` không tồn tại trong tài liệu gốc. Ngoài ra, `src/ui/PatientForm.tsx:579` vẫn hiển thị `💊 {med.name || med.drugId} ({med.dose})` thiếu `med.unit` và `med.freq` dù `round4_RESPONSE.md:75` báo đã sửa.

---

## 3. Kết luận Kiểm định (Final Audit Verdict)

Phân hệ `ckd` đã đạt độ phủ lâm sàng sâu rộng trên cả ngoại trú và nội trú với 100% trích dẫn khớp nguyên văn trang PDF gốc, nhưng bắt buộc phải khắc phục triệt để **2 lỗi Critical về quá liều thận / thẻ giảm liều tự mâu thuẫn** và **6 lỗi Major về bế tắc thuật toán RASi–Finerenone, đứt gãy cầu nối SGLT2i ở `eGFR < 20`, cảnh báo thận GLP-1 RA và độ trung thực ngữ nghĩa của trích dẫn an toàn** trước khi phê duyệt phát hành lâm sàng.

**`FAIL (2 critical, 6 major)`**
