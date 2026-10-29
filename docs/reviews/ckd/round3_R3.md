# Báo cáo Phản biện An toàn Lâm sàng Độc lập — Vòng 3 (Vai R3: Adversarial Safety Tester)
## Module: Bệnh thận mạn & Tổn thương thận cấp (`ckd`)

- **Người phản biện:** R3 – Phản biện An toàn Lâm sàng Đối nghịch (Độc lập, mù chéo với R1 & R2 Vòng 3)
- **Ngày kiểm định:** 27/10/2026
- **Bộ kịch bản thực nghiệm:** **75 ca bệnh nhân đối nghịch (`S01`–`S75`) + 8 phép mô phỏng click `ckdPresets` trên `AppShell.tsx`** (mặc định Ngoại trú SI & chuyển hệ đơn vị quy ước Mỹ `mg/dL`, `mg/g`), chạy trực tiếp qua hàm `evaluate()` thật của hệ thống (`docs/reviews/ckd/scratch/cli_runner.ts`, `run_r3_suite.ts`, `scenarios_part1.ts`, `scenarios_part2.ts`, `scenarios_part3.ts`; báo cáo xuất đầy đủ tại `docs/reviews/ckd/scratch/r3_summary_report.txt`).
- **Tài liệu chuẩn đối chiếu nguyên văn:** KDIGO 2024 CKD Guideline (`KDIGO_2024_CKD_Guideline.pdf`), ESC 2026 CVD & CKD Guideline (`ESC_2026_cvd_chronic_kidney_disease.pdf`), Quyết định 2388/QĐ-BYT 2024 Hướng dẫn chẩn đoán và điều trị Bệnh thận mạn (`BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`), UKKA 2022 Hyperkalaemia Guideline, KDIGO 2012 AKI Guideline, ADA 2026 Ch. 11, và Nhãn thuốc FDA (`FDA_label_losartan.pdf`, Kerendia, Ozempic, Forxiga, Lokelma, Veltassa).

---

## 1. Tổng hợp Kết quả Kiểm định Hồi quy Vòng 2 (42 hạng mục) & Kịch bản Đa bệnh lý

Qua 75 ca kiểm thử đối nghịch bao phủ đầy đủ tổ hợp 7 chuyên khoa (`['ckd', 'hf', 'dm2', 'htn', 'gout', 'lipid', 'af']`), giá trị biên (`eGFR`, `K+`, `UACR`, `HCO3-`, `SBP`), thiếu dữ liệu đầu vào, đơn vị `mg/dL` vs `µmol/L`, và chuyển đổi `INTL` / `VN` / `US`:

### 1.1. Các hạng mục Vòng 2 đã khắc phục tốt (Verified PASS trên `evaluate()`)
1. **Chặn Finerenone trên bệnh nhân lọc máu chu kỳ (`CKD-R2-R3-01` — `S26`, `S27`):** `finerenone.json`, `gates.ts` và `reviewMeds.ts` đã phát lệnh `[STOP]` + cảnh báo chống chỉ định chính xác ngay cả khi Creatinin sau lọc máu cho ra `eGFR >= 15`.
2. **Rà soát NSAID, Indomethacin, Torsemide & Bộ ba độc thận (`CKD-R2-R3-02` — `S45`–`S48`):** Đã bắt đầy đủ `indomethacin`, sửa lỗi chính tả `torsemide`, nâng lên `[STOP]` khi có Triple Whammy hoặc đợt cấp AKI, và nhận diện cả cờ `customInputs.takingNsaid = true`.
3. **Thai kỳ (`CKD-R2-R3-05` nhánh thai kỳ — `S49`, `S50`):** Đã chặn hoàn toàn lệnh ép hạ `SBP < 120 mmHg` trên thai phụ và phát `[STOP]` / `[AVOID]` đầy đủ cho RASi, SGLT2i, Finerenone, Statin.
4. **Suy tim HFrEF `LVEF <= 40%` (`CKD-R2-R3-07` — `S16`, `S51`):** `ckd.outpatient.finerenone_indication` đã kiểm tra `lvef <= 40` để nhường trụ cột MRA steroid giảm tử vong cho HFrEF kể cả khi chỉ bật `['ckd']`.
5. **Hòa giải xung đột nhóm thuốc đa module (`CKD-R2-R3-08` — `S51`, `S52`, `S54`, `S55`):** Không còn biến `Jardiance (empagliflozin)` đang uống thành `[AVOID]`, không còn tự ý `SWITCH` `Losartan` sang `Sacubitril/Valsartan` ở HFpEF (`LVEF = 55%`), không còn sinh thẻ rác `[AVOID]` cho thuốc bệnh nhân chưa từng uống, và module `lipid` đã chặn khởi trị Statin mới trên bệnh nhân đang chạy thận (`onDialysis = true`).
6. **Phân tầng khởi trị RASi ở CKD không ĐTĐ, HA bình thường, albumin niệu A2 (`CKD-R2-R3-09` — `S22`, `S23`):** Đã hạ xuống `[CONSIDER]` (KDIGO 2024 Rec 3.6.2, 2C) thay vì `[START]` bắt buộc mang nhầm trích dẫn A3.
7. **Quy đổi liều cách ngày `q48h` (`parseCurrentDailyDoseMg` — `S29`), tạm ngừng chất gắn kali khi hạ kali `K+ < 3.5 mmol/L` (`S39`), tạm ngừng `NaHCO3` khi kiềm chuyển hóa `HCO3- > 26 mmol/L` (`S43`), chuyển đổi nhựa gắn kali `Kalimate` (`VN`) vs `Patiromer` (`INTL/US`) kèm cảnh báo uống cách 3 giờ (`S38`, `S62`), và xử trí lợi tiểu quai nội viện theo huyết động/sung huyết trong AKI (`S30`–`S32`):** Tất cả hoạt động chính xác.

### 1.2. Các lỗi nghiêm trọng phát hiện mới hoặc hồi quy từ bản sửa Vòng 2
Tổng cộng phát hiện **9 vấn đề có bằng chứng thực nghiệm rõ ràng**: **4 `critical`**, **3 `major`**, **2 `minor`** (0 phóng đại mức độ).

| Mã lỗi | Mức độ | Phân loại | Hạng mục (`itemId`) | Tóm tắt ngắn gọn |
|---|---|---|---|---|
| **CKD-R3-R3-01** | **CRITICAL** | `rule` | `egfr.ckdEpi2012Cys` | Hồi quy từ bản sửa `CKD-R2-R3-10`: Sai số mũ `-0.432` (đúng là `-1.328`) trong công thức CKD-EPI 2012 Cystatin C làm thổi phồng eGFR gấp 2,4–3,8 lần (biến suy thận G5 `13.3` thành G3a `49.9`), khiến engine kê mới `Finerenone`, `Dapagliflozin`, `Metformin`, `Perindopril` liều cao cho bệnh nhân suy thận giai đoạn cuối. |
| **CKD-R3-R3-02** | **CRITICAL** | `ui` | `ckdPresets` | `AppShell.tsx` bỏ qua `preset.setting` (chưa thực thi cam kết `CKD-R2-R1-07`) khiến BN 4 (`K+ = 6.8` + biến đổi ECG) và BN 3 (AKI độ 2 nội trú) chạy như Ngoại trú, làm **mất trắng phác đồ tiêm TM Calcium Gluconate + Insulin-Glucose cứu mạng**; đồng thời click preset khi đang chọn đơn vị `mg/dL` làm sập `eGFR` cả 4 ca mẫu xuống `0.1–0.2 mL/phút/1.73m²`. |
| **CKD-R3-R3-03** | **CRITICAL** | `rule` | `safety.gates_and_merge_acute_crisis_fail_closed` | Cổng cấp cứu ngoại trú chỉ cài cục bộ trong `ckd` mà thiếu ở `gates.ts` và `merge.ts` cho phép `START` ghi đè `DEFER`: giữa đợt AKI cấp ngoại trú, sốc `SBP = 78`, `K+ = 6.4` hoặc thiếu `SBP` (`sbp = undefined`), các module đồng mắc vẫn phát `[START] Amlodipine`, `[START] Dapagliflozin`, `[START] Apixaban` hoặc xóa bỏ cổng Fail-Closed `[DEFER]`. |
| **CKD-R3-R3-04** | **CRITICAL** | `rule` | `ckd.outpatient.glp1ra_indication` | Module `ckd` độc lập bỏ lọt Cảnh báo Hộp đen FDA (MTC / MEN 2) ở bệnh nhân đang dùng sẵn `Semaglutide` (0 lệnh `STOP`, 0 `alert`), vẫn phát `[START] Semaglutide` khi có tiền sử viêm tụy cấp (`historyPancreatitis = true`), và `ckdInputs` không có ô nhập MTC/MEN2 hay viêm tụy trên giao diện. |
| **CKD-R3-R3-05** | **MAJOR** | `drug` | `rasi_renal_dosing_arb_vs_acei` | Nghịch lý chỉnh liều thận RASi: ép `[REDUCE]` sai hướng dẫn đối với ARB thải qua mật/gan (`Losartan 100 -> 25–50 mg`, `Valsartan 320 -> 40–160 mg`) ở CKD G4 trái nhãn FDA & BYT 2024 Bảng 12; ngược lại bỏ lọt hoàn toàn quá liều gấp 8–16 lần `Perindopril 10 mg` / `Lisinopril 40 mg` trên bệnh nhân đang chạy thận (`onDialysis = true`), và in câu `"2.5 mg vào ngày lọc máu"` cho BN G5 chưa lọc máu. |
| **CKD-R3-R3-06** | **MAJOR** | `rule` | `ckd.outpatient.glp1ra_indication_eligibility` | Luật `Semaglutide` của module `ckd` dùng phép so sánh nghiêm ngặt `>` làm trượt biên ESC 2026 Table 12 (Class I-A) tại `UACR = 10.0` và `30.0 mg/mmol`, đồng thời bỏ sót hoàn toàn nhóm ĐTĐ2 + CKD G4 `15 <= eGFR < 20` (không dùng được Metformin & SGLT2i) có `HbA1c <= 7.0%` hoặc chưa nhập `HbA1c` (KDIGO 2024 Rec 3.9.1 - 1B & BYT 2024 Bảng 45). |
| **CKD-R3-R3-07** | **MAJOR** | `threshold` | `ckd.acidosis.hco3_outpatient_emergency_and_ci_aki_hydration` | (1) Ngoại trú toan chuyển hóa nặng `HCO3- = 10.0–11.9 mmol/L` không được chuyển cấp cứu nội viện (trái BYT 2024 `<= 10` và cam kết `< 12` ở `round2_RESPONSE.md`) mà bị kê viên uống `NaHCO3` kèm `[START] Dapagliflozin`; (2) Nội viện CI-AKI viết nhầm `egfr < g3aMin (45)` thay vì `g3bMin (30)`, bắt truyền NaCl 0.9% tĩnh mạch thường quy cho cả G3b chụp CT đường tĩnh mạch. |
| **CKD-R3-R3-08** | **MINOR** | `rule` | `reviewMeds.checkEmergencyRedFlags_and_duplicate_refer` | Bệnh nhân đã nằm nội viện (`inpatient`) vẫn bị `checkEmergencyRedFlags` gắn thẻ `[REFER] "CHUYỂN CẤP CỨU KHẨN CẤP... chuyển ngay tới cơ sở cấp cứu"`; bệnh nhân ngoại trú cấp cứu bị bắn trùng 3 thẻ `[REFER]` cùng lúc (kèm gán nhầm `module: 'hf'` ở `emergency_shock_hypotension`). |
| **CKD-R3-R3-09** | **MINOR** | `ui` | `ckd.missing_input_sex_and_preset2_description` | (1) Thẻ nhắc thiếu giới tính hiển thị tiếng Anh thô `"Cần nhập sex để đánh giá"` do `FIELD_LABELS` thiếu key `sex`; (2) Lời mô tả Preset BN 2 ghi `"tiếp tục RASi"` trong khi output thực tế phát `[REDUCE] Coversyl 2.5 mg cách ngày`. |

---

## 2. Chi tiết Các Phát hiện & Bằng chứng Kiểm chứng

### [CKD-R3-R3-01] CRITICAL — Sai số mũ `-0.432` (thay vì `-1.328`) trong công thức CKD-EPI 2012 Cystatin C làm thổi phồng eGFR gấp 2,4–3,8 lần ở suy thận nặng G4–G5
- **Loại / Định danh:** `rule` | `egfr.ckdEpi2012Cys` (`src/engine/calculators/egfr.ts:62-69` & `src/engine/derive.ts:52`)
- **Phân tích lâm sàng & kỹ thuật:**
  Trong Vòng 2 (`CKD-R2-R3-10`), `src/engine/derive.ts` (dòng 46–57) được nối trực tiếp vào hàm `calculateEgfrCys(patient.cystatinC, patient.age, patient.sex)` để tính `derived.egfr` cho bệnh nhân chỉ định lượng Cystatin C (cắt cụt chi, liệt tủy sống, teo cơ nặng, suy dinh dưỡng, xơ gan). Tuy nhiên, tại `src/engine/calculators/egfr.ts` dòng 62–69:
  ```ts
  ckdEpi2012Cys: {
    baseConstant: 133,
    cysCutoff: 0.8,
    cysLowExponent: -0.499,
    cysHighExponent: -0.432, // <-- SAI NGHIÊM TRỌNG! Chuẩn gốc là -1.328
    ageExponent: 0.996,
    femaleMultiplier: 0.932,
  },
  ```
  Theo phương trình gốc **CKD-EPI 2012 Cystatin C** của Inker LA, Schmid CH, Tighiouart H, et al. (*N Engl J Med.* 2012;367:20–29, được KDIGO 2024 dẫn chiếu tại **Bảng 14, tr. S190 / PDF tr. 74** và **Tài liệu tham khảo 148, PDF tr. 183**):
  $$\text{eGFR}_{\text{cys}} = 133 \times \min(S_{\text{cys}}/0.8, 1)^{-0.499} \times \max(S_{\text{cys}}/0.8, 1)^{-1.328} \times 0.996^{\text{Age}} \times [0.932 \text{ nếu nữ}]$$
  Bộ kiểm thử cũ `tests/calculators/egfr.test.ts` (dòng 81) chỉ kiểm thử duy nhất 1 giá trị gần bình thường `cystatinC = 0.9 mg/L` (`> 80`) nên không phát hiện lỗi số mũ ở miền suy thận (`Scys > 0.8 mg/L`).
- **Bằng chứng thực nghiệm trên `evaluate()` (`docs/reviews/ckd/scratch/r3_summary_report.txt`):**
  1. **Ca `S66` (dòng 870–883):** Nữ 68 tuổi cụt 2 chi dưới kèm ĐTĐ2 + THA, `scr = undefined`, `cystatinC = 3.5 mg/L`, `k = 4.7 mmol/L`, `uacr = 60 mg/mmol`.
     - **eGFR thực tế theo CKD-EPI 2012 Cystatin C:** $133 \times (3.5/0.8)^{-1.328} \times 0.996^{68} \times 0.932 = \mathbf{13.3\text{ mL/phút/1.73m}^2}$ (**CKD G5 — Suy thận giai đoạn cuối!**).
     - **Output thực tế của `evaluate()`:** Tính ra `eGFR = 49.9 mL/phút/1.73m²` (**G3a** — sai lệch **+275%**) và phát y lệnh **`[START] Khởi trị Dapagliflozin 10 mg`** (chống chỉ định khởi trị `< 20`) + **`[START] Khởi trị Finerenone 10 mg`** (chống chỉ định khởi trị `< 25` và tuyệt đối `< 15`, nguy cơ tăng kali máu ác tính gây ngừng tim trên nền G5!).
  2. **Ca `S06` (dòng 61–73):** Nam 66 tuổi, `scr = undefined`, `cystatinC = 2.1 mg/L` (**eGFR thực tế = `28.3` — CKD G4**), đang dùng `Perindopril 5 mg/ngày`.
     - **Output thực tế của `evaluate()`:** Tính ra `eGFR = 67.3 mL/phút/1.73m²` (**G2**), phát lệnh **`[START] Finerenone 20 mg/ngày`** (quá liều gấp đôi liều khởi trị G3b/G4!), **`[UPTITRATE] Tăng liều Perindopril (5–10 mg/ngày)`** (vượt gấp 4–8 lần trần thận EMA `2.5 mg cách ngày` ở G4!) và khi bật kèm `dm2` còn phát **`[START] Metformin 500–2000 mg/ngày`** (chống chỉ định tuyệt đối `< 30`, nguy cơ toan lactic tử vong!).
  3. **Ca `S67` (dòng 885–887):** Nam 66 tuổi có cả `scr = 190 µmol/L` và `cystatinC = 2.4 mg/L` -> đối tượng `derived` trả ra song song `egfr = 27.6 (G4)` nhưng `egfrCys = 63.5` (lệch hơn gấp đôi ngay trên thanh thông số phái sinh).
- **Hướng khắc phục đề xuất:**
  1. Tại `src/engine/calculators/egfr.ts:66`, sửa `cysHighExponent: -0.432` thành `cysHighExponent: -1.328`.
  2. Bổ sung unit test đối chiếu giá trị tính tay chuẩn trong `tests/calculators/egfr.test.ts` ở mức `cystatinC = 2.1 mg/L` và `3.5 mg/L` cho cả nam và nữ.
  3. Với các luật chỉnh liều thuốc thải qua thận (như `ckd.outpatient.rasi_renal_dose_reduce` và `reviewMeds.ts`), khi `crcl === undefined` (bệnh nhân chỉ có `cystatinC`, không có `scr`), cần fallback sang `derived.egfr` thay vì bỏ qua kiểm tra liều trần thận.

---

### [CKD-R3-R3-02] CRITICAL — `AppShell.tsx` bỏ qua `preset.setting` làm mất trắng phác đồ cấp cứu Tăng Kali máu có biến đổi ECG ở BN 4, và nhân nhầm đơn vị `mg/dL` làm sập eGFR cả 4 ca mẫu xuống `0.1–0.2`
- **Loại / Định danh:** `ui` | `ckdPresets` (`src/ui/AppShell.tsx:510-513`, `src/engine/types.ts:669-674`, `src/modules/ckd/presets.ts`)
- **Phân tích & Bằng chứng:**
  1. **Hồi quy / Chưa thực thi cam kết sửa `CKD-R2-R1-07`:** Trong `docs/reviews/ckd/round2_RESPONSE.md` (dòng 83), tác giả module ghi rằng đã thêm `setting: 'inpatient'` vào BN 3, BN 4 và `AppShell.tsx` sẽ đọc trường này. Thực tế kiểm tra mã nguồn:
     - `src/engine/types.ts` (dòng 669–674): Interface `PresetPatient` **không hề có thuộc tính `setting`**.
     - `src/ui/AppShell.tsx` (dòng 510–513):
       ```tsx
       onClick={() =>
         setPatient((prev) => buildPatientFromPreset(p, prev.selectedModules))
       }
       ```
       Hoàn toàn không cập nhật `settings.setting`!
     - **Thực nghiệm mô phỏng click `AppShell` (`r3_summary_report.txt` dòng 1007–1025):**
       - Khi click **BN 4 (`Cấp cứu Nội viện - Tăng Kali máu nặng có biến đổi ECG`, `K+ = 6.8 mmol/L` + sóng T nhọn/QRS giãn)** ở giao diện mặc định (`outpatient`), kết quả trả về chỉ có `[STOP Cozaar, REFER chuyển cấp cứu x2, REFER chuyển khám chuyên khoa Thận, CONSIDER Cần nhập UACR]` — **mất trắng hoàn toàn thẻ sống còn `rec_ckd_hyperkalemia_severe_bundle` (tiêm TM chậm Calcium Gluconate 10% 30 mL bảo vệ cơ tim + truyền Insulin 10 IU / Glucose 25 g + khí dung Salbutamol) và `rec_ckd_hyperkalemia_severe_szc_order` (`SZC 10g x 3 lần/ngày`)**!
       - Khi click **BN 3 (`Nội trú - Tổn thương thận cấp AKI Giai đoạn 2`, `SCr 130 -> 280 µmol/L`)**, hệ thống chạy luật ngoại trú (`rec_dm2_screening_checklist` khám mắt/bàn chân định kỳ, `missing_input_uacr`) thay vì phác đồ phân độ AKI nội viện và mục tiêu đường huyết nội viện.
  2. **Lỗi hỏng dữ liệu đơn vị khi click Preset ở chế độ `mg/dL` (`r3_summary_report.txt` dòng 999–1025):** Toàn bộ 4 preset BN 1–4 ghi cứng giá trị hệ SI (`scr = 165, 210, 280, 260`; `uacr = 45, 18`). Nếu người dùng đã chuyển `Settings` sang đơn vị quy ước Mỹ (`cr: 'mg_dL'`, `uacr: 'mg_g'`) trước khi bấm chọn ca mẫu, `normalizePatientUnits` nhân `scr` thêm `88.4` lần (`165 -> 14.586 µmol/L`), đánh sập `eGFR` của cả 4 ca mẫu từ `39.8 / 21.7 / 20.2 / 22.9` xuống còn **`0.1–0.2 mL/phút/1.73m²` (G5)**!
- **Hướng khắc phục đề xuất:**
  1. Khai báo `setting?: Setting` trong `PresetPatient` (`src/engine/types.ts:669`).
  2. Tại `src/ui/AppShell.tsx:510-513`, khi click preset: đồng bộ `setSettings((prev) => ({ ...prev, setting: p.setting ?? prev.setting }))`, đồng thời quy đổi các trường có đơn vị của `p.patient` từ hệ SI gốc sang `settings.units` hiện hành (hoặc reset `units` về chuẩn SI của preset).

---

### [CKD-R3-R3-03] CRITICAL — Lỗ hổng liên module: Khởi trị mới thuốc hạ áp / SGLT2i / chống đông ngay giữa đợt AKI cấp hoặc Cấp cứu ngoại trú, và `merge.ts` cho phép `START` xóa bỏ cổng Fail-Closed `DEFER`
- **Loại / Định danh:** `rule` | `safety.gates_and_merge_acute_crisis_fail_closed` (`src/engine/safety/gates.ts`, `src/engine/merge.ts:21-47`)
- **Phân tích & Bằng chứng:**
  1. **Thiếu rào chắn cấp cứu / AKI ngoại trú toàn cục tại `gates.ts`:** Các hàm `isAkiActive(ctx)` và `isOutpatientAcuteCrisis(ctx)` chỉ được gắn trong `src/modules/ckd/helpers.ts` mà không được kiểm tra ở tầng `evaluateSafetyGates` (`src/engine/safety/gates.ts`). Do đó, khi bệnh nhân đa bệnh lý rơi vào biến cố cấp tính tại phòng khám ngoại trú:
     - **Ca `S03` (`r3_summary_report.txt` dòng 24–35 — Ngoại trú đợt cấp AKI trên nền CKD, `SCr` tăng vọt từ `baselineScr = 120` lên `195 µmol/L`, bật `['ckd', 'dm2', 'htn']`):** Trong khi `ckd` phát `[HOLD] Losartan`, `[HOLD] Metformin` và `[REFER] PHÁT HIỆN ĐỢT CẤP TỔN THƯƠNG THẬN CẤP`, module `htn` vẫn phát **`[START] Phối hợp thêm Amlodipine 5 mg/ngày`** (và module `dm2` trước khi sửa song song còn phát **`[START] Dapagliflozin 10 mg/ngày`** — chính thuốc nhóm SADMAN thúc đẩy AKI giảm thể tích!).
     - **Ca `S53` (Ngoại trú 7 module đang sốc tụt huyết áp `SBP = 78 mmHg` + `K+ = 6.4 mmol/L` + `HCO3- = 8.5 mmol/L`):** Bên cạnh các thẻ `REFER` cấp cứu ngừng tim/sốc, module `af` vẫn phát **`[START] Khởi trị Apixaban 5 mg x 2 lần/ngày`**.
  2. **`merge.ts` để `START (60)` ghi đè lên `DEFER (20)` bất chấp cổng an toàn trượt (`passed: false`):**
     - Tại `src/engine/merge.ts` dòng 27–31 và 43–47: `ACTION_PRIORITY['START'] = 60` cao hơn `ACTION_PRIORITY['DEFER'] = 20`. Khi module `ckd` tuân thủ đúng bất biến Fail-Closed (ví dụ thiếu số đo huyết áp `sbp = undefined` ở `S04` -> hạ `dapagliflozin`, `finerenone`, `semaglutide` xuống `action: 'DEFER'` với `gates: [{ parameter: 'SBP', passed: false }]`), bất kỳ module đồng mắc nào (`dm2`, `hf`) phát `action: 'START'` cho cùng `drugId` đó mà không kiểm `sbp !== undefined` sẽ thắng `resolveActionConflict('DEFER', 'START') => 'START'`, biến một y lệnh bị chặn Fail-Closed thành y lệnh `[START]`!
- **Hướng khắc phục đề xuất:**
  1. Tại `src/engine/safety/gates.ts`, bổ sung rào chắn toàn cục cho bối cảnh `outpatient` đang có biến cố cấp tính (AKI cấp với `SCr - baselineScr >= 26.5 µmol/L` hoặc `SCr / baselineScr >= 1.5` hoặc `akiSuspected === true`, `SBP < 90 mmHg`, `K+ >= 6.0 mmol/L`, `HCO3- <= 10–12 mmol/L`): tự động chuyển mọi hành động khởi trị / tăng liều thuốc mạn tính đường uống (`START`, `UPTITRATE`) sang `DEFER` kèm gate giải thích phải xử trí ổn định đợt cấp trước.
  2. Tại `src/engine/merge.ts`, sửa logic hợp nhất cùng hoạt chất / cùng nhóm: nếu bất kỳ bản ghi thành phần nào mang `action === 'DEFER'` (hoặc `HOLD`/`AVOID`/`STOP`) kèm ít nhất một cổng an toàn không đạt (`gates.some(g => !g.passed)`), bắt buộc giữ nguyên trạng thái chặn/hoãn an toàn đó, không cho phép `START`/`UPTITRATE` ghi đè.

---

### [CKD-R3-R3-04] CRITICAL — Module `ckd` độc lập bỏ lọt Cảnh báo Hộp đen FDA (MTC / MEN 2) ở bệnh nhân đang dùng `Semaglutide`, vẫn kê mới `Semaglutide` khi có tiền sử viêm tụy cấp, và thiếu hoàn toàn trường nhập trên UI
- **Loại / Định danh:** `rule` | `ckd.outpatient.glp1ra_indication` (`src/modules/ckd/rules.outpatient.extra.ts:81-156`, `src/modules/ckd/inputs.ts`, `src/engine/safety/gates.ts:926-986`, `src/engine/safety/reviewMeds.ts`)
- **Phân tích & Bằng chứng:**
  Module `ckd` đã được bổ sung luật tự khởi trị `Semaglutide (SC)` như trụ cột thứ 4 bảo vệ thận (`ckd.outpatient.glp1ra_indication`), nhưng hệ thống kiểm soát chống chỉ định đi kèm có 3 lỗ hổng nghiêm trọng khi bác sĩ chuyên khoa Thận chỉ chọn `selectedModules: ['ckd']`:
  1. **Ca `S69` (`r3_summary_report.txt` dòng 909–920 — Bỏ lọt FDA Boxed Warning trên thuốc đang dùng):** Bệnh nhân nữ 59 tuổi đang tiêm sẵn `Ozempic (semaglutide) 0.5 mg/tuần` có tiền sử `historyMtcOrMen2: true` (`mtc: true`). Kết quả `evaluate()`: **0 lệnh `STOP`/`AVOID` và 0 `SafetyAlert`**! Nguyên nhân: `ckd.outpatient.glp1ra_indication` thoát sớm ở dòng 81 (`if (ctx.patient.currentMeds.some((m) => isGlp1RaMed(m))) return false;`) trước khi kịp kiểm tra `hasMtcOrMen2` ở dòng 124; đồng thời vòng lặp kiểm tra `kbDrug.contraindications` tại `src/engine/safety/gates.ts:931-967` và `reviewMeds.ts` bỏ qua hoàn toàn các mã `'mtc'`, `'men2'` và `'acute_pancreatitis'` đã khai báo trong `kb/drugs/semaglutide.json`.
  2. **Ca `S68` (`r3_summary_report.txt` dòng 896–908 — Kê mới `Semaglutide` bất chấp tiền sử viêm tụy cấp):** Nam 61 tuổi (`selectedModules: ['ckd']`, `eGFR = 40.5`, `UACR = 45`, `HbA1c = 7.9%`, `customInputs: { historyPancreatitis: true }`) vẫn nhận lệnh trực tiếp **`[ckd|START|p=87] Khởi trị Semaglutide (SC)`** không một dòng cảnh báo.
  3. **Mù thông tin trên UI (`src/modules/ckd/inputs.ts`):** `ckdInputs` không khai báo trường nhập `historyMtcOrMen2` lẫn `historyPancreatitis`, khiến trên giao diện thực tế bác sĩ dùng module `ckd` không có chỗ tích chọn 2 chống chỉ định này.
- **Hướng khắc phục đề xuất:**
  1. Bổ sung 2 trường boolean `customInputs.historyMtcOrMen2` và `customInputs.historyPancreatitis` vào `src/modules/ckd/inputs.ts` (dùng đúng key của `dm2Inputs` để tự động dùng chung dữ liệu).
  2. Bổ sung xử lý toàn cục cho `contra.code === 'mtc' | 'men2'` và `'acute_pancreatitis'` trong cả `src/engine/safety/gates.ts` (dòng 931–968) lẫn `src/engine/safety/reviewMeds.ts`, đồng thời chặn trong `ckd.outpatient.glp1ra_indication`.

---

### [CKD-R3-R3-05] MAJOR — Nghịch lý chỉnh liều thận nhóm RASi: Ép giảm liều sai hướng dẫn đối với ARB thải qua gan/mật (`Losartan`, `Valsartan`) ở CKD G4, nhưng bỏ lọt hoàn toàn quá liều gấp 8–16 lần ACEi thải qua thận trên bệnh nhân lọc máu
- **Loại / Định danh:** `drug` | `rasi_renal_dosing_arb_vs_acei` (`kb/drugs/losartan.json`, `kb/drugs/valsartan.json`, `src/modules/ckd/rules.outpatient.extra.ts:255-350`)
- **Bằng chứng đối chiếu tài liệu gốc & `evaluate()`:**
  1. **Ép giảm liều sai hướng dẫn đối với `Losartan` và `Valsartan` ở CKD G4 ổn định:**
     - **Nhãn FDA Cozaar (`FDA_label_losartan.pdf`, Section 8.7 Renal Impairment, tr. 12):** *"No dose adjustment is necessary in patients with renal impairment unless a patient with renal impairment is also volume depleted."*
     - **Hướng dẫn BYT 2024 (`BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`, Bảng 12, tr. 39):** `Losartan` (khởi đầu 50 mg, tối đa 100 mg): *"Không cần điều chỉnh liều lượng"*; `Valsartan` (khởi đầu 80 mg, tối đa 320 mg): *"Không có điều chỉnh liều lượng cho CrCl < 30ml/phút"*.
     - **KDIGO 2024 PP 3.6.1 & 3.6.7:** Khuyến cáo duy trì RASi ở liều đích tối đa dung nạp được phê duyệt để bảo vệ thận, chỉ giảm liều/ngừng khi hạ huyết áp có triệu chứng hoặc tăng kali máu không kiểm soát được.
     - **Output sai của `evaluate()`:** Do `losartan.json` đặt trần giả tạo `25–50 mg/ngày` ở eGFR 15–30 và `valsartan.json` đặt trần `40–160 mg/ngày` ở eGFR 15–30, ở ca **`S28`** (`eGFR = 23.4`, `K+ = 4.4`, `HA = 136/80`, đang dùng `Losartan 100 mg/ngày`) và ca **`S73`** (`r3_summary_report.txt` dòng 954–964, `eGFR = 22.8`, `K+ = 4.5`, `HA = 138/82`, đang dùng `Valsartan 320 mg/ngày`), hệ thống ép **`[REDUCE] Giảm liều Losartan về 25–50 mg/ngày`** và **`[REDUCE] Giảm liều Valsartan về 40–160 mg/ngày`**, làm mất hiệu lực giảm đạm niệu tối ưu ở CKD G4A3!
  2. **Bỏ lọt quá liều gấp 8–16 lần ACEi thải qua thận ở bệnh nhân đang chạy thận (`onDialysis = true`):**
     - Luật `ckd.outpatient.rasi_renal_dose_reduce` (`src/modules/ckd/rules.outpatient.extra.ts:270`) có `if (hasCkdFlag(ctx, 'onDialysis')) return false;`, còn `reviewMeds.ts` không có logic kiểm trần liều thận cho ACEi. Do đó ở ca **`S26`** (chạy thận nhân tạo đang uống `Perindopril 10 mg/ngày` — gấp 8 lần liều lọc máu EMA `2.5 mg sau buổi lọc`!) và ca **`S27`** (chạy thận đang uống `Lisinopril 40 mg/ngày` — gấp 8–16 lần trần thận!), hệ thống phát **0 cảnh báo giảm liều**!
  3. **Sai câu chữ và trái BYT 2024 ở bệnh nhân CKD G5 chưa lọc máu (`onDialysis = false`):**
     - Ca **`S25`** (`onDialysis = false`, `CrCl = 11.2 mL/phút`, đang uống `Perindopril 5 mg/ngày`): hệ thống in ra câu mâu thuẫn **`"Giảm liều Perindopril về mức tối đa theo chức năng thận (2.5 mg vào ngày lọc máu)"`** cho bệnh nhân chưa hề lọc máu, đồng thời bỏ qua quy định trong chính `kb/citations/ckd.json` dòng 1119 (`byt.ckd.2024.table_12_perindopril_crcl_30`, BYT 2024 Bảng 12 tr. 38): *"Perindopril: Không sử dụng khi CrCl <30 ml/phút"*.
- **Hướng khắc phục đề xuất:**
  1. Gỡ bỏ giới hạn trần giả tạo ở dải `eGFR 15–30` trong `kb/drugs/losartan.json` (cho phép liều đích tối đa `100 mg/ngày`, lưu ý khởi đầu `25 mg` nếu thiếu dịch) và `kb/drugs/valsartan.json` (cho phép tới `320 mg/ngày` theo BYT 2024 Bảng 12 & FDA).
  2. Cho phép `ckd.outpatient.rasi_renal_dose_reduce` kiểm tra quá liều các ACEi thải qua thận ngay cả khi `onDialysis === true`.
  3. Phân nhánh thông báo ở `CrCl < 15` theo `onDialysis`: chỉ ghi `"vào ngày lọc máu"` khi `onDialysis === true`; khi `onDialysis === false`, hướng dẫn liều cách ngày hoặc chuyển sang ARB thải qua gan/mật (đặc biệt ở `profile === 'VN'` theo BYT 2024 Bảng 12).

---

### [CKD-R3-R3-06] MAJOR — Luật `Semaglutide` của module `ckd` trượt giá trị biên `>=` của ESC 2026 Table 12 (Class I-A) và bỏ sót bệnh nhân ĐTĐ2 + CKD G4 `eGFR 15–19` không dùng được Metformin & SGLT2i (KDIGO 2024 Rec 3.9.1 - 1B)
- **Loại / Định danh:** `rule` | `ckd.outpatient.glp1ra_indication_eligibility` (`src/modules/ckd/rules.outpatient.extra.ts:97-111, 167-169`)
- **Bằng chứng:**
  1. **Trượt điểm cắt biên `>=` của thử nghiệm FLOW / ESC 2026 CVD-CKD Table 12 (Class I, Level A):**
     - Tiêu chí nhận bệnh FLOW và ESC 2026 Table 12 quy định: `eGFR 25–49` kèm **`uACR >= 10 mg/mmol`** (`>= 100 mg/g`) hoặc `eGFR 50–75` kèm **`uACR >= 30 mg/mmol`** (`>= 300 mg/g`).
     - Tại `rules.outpatient.extra.ts` dòng 101 & 106, code viết `uacr > flowMidUacr` và `uacr > flowHighUacr`. Thực nghiệm với `selectedModules: ['ckd']`: ca **`S70`** (`eGFR = 40.6`, `UACR = 10.0 mg/mmol`, `HbA1c = 6.6%`, `r3_summary_report.txt` dòng 921–931) và ca **`S71`** (`eGFR = 56.3`, `UACR = 30.0 mg/mmol`, `HbA1c = 6.7%`, dòng 933–942) đều bị **bỏ lọt hoàn toàn** (0 khuyến cáo Semaglutide).
  2. **Bỏ sót bệnh nhân ĐTĐ2 + CKD G4 (`15 <= eGFR < 20`) không thể dùng Metformin và SGLT2i:**
     - Theo **KDIGO 2024 Rec 3.9.1 (1B)** và **BYT 2024 Bảng 45 tr. 135** (`kb/citations/ckd.json:1108`, `byt.ckd.2024.table_45_glp1ra_egfr_15`): *"Khuyến cáo bổ sung thuốc đồng vận thụ thể GLP-1 tác dụng kéo dài nếu đường máu không đạt mục tiêu đã xác định cho cá thể với Metformin và SGLT2i, **hoặc nếu BN không thể dùng 2 thuốc này**."*
     - Ở dải `15 <= eGFR < 20 mL/phút/1.73m²`, bệnh nhân chống chỉ định tuyệt đối Metformin và không còn chỉ định khởi trị mới SGLT2i. Tuy nhiên tại dòng 97–111, nếu `HbA1c <= 7.0%` (hoặc bác sĩ chưa nhập `HbA1c`) và chưa có biến cố ASCVD, cả 3 nhánh `isFlowCardiorenalEligible`, `hasUnmetGlycemicGoal`, `hasHighAscvdCkdRisk` đều `false`! Thực nghiệm ca **`S72`** (`r3_summary_report.txt` dòng 944–952: ĐTĐ2 + CKD G4 `eGFR = 18.9`, `UACR = 65 mg/mmol`, `HbA1c = 7.0%`, đang dùng `Irbesartan 300 mg`): **0 khuyến cáo Semaglutide**.
- **Hướng khắc phục đề xuất:**
  1. Đổi `uacr > flowMidUacr` thành `uacr >= flowMidUacr` và `uacr > flowHighUacr` thành `uacr >= flowHighUacr` tại dòng 101, 106, 168, 169.
  2. Bổ sung điều kiện `const cannotUseMetforminAndSglt2i = egfr < thFor('egfr', 'ckd.sglt2i.egfr_initiate_min') && !ctx.patient.currentMeds.some((m) => isSglt2iMed(m));` (hoặc có chống chỉ định/không dung nạp SGLT2i) để phát khuyến cáo GLP-1 RA ở nhóm `15 <= eGFR < 20` đúng KDIGO 2024 Rec 3.9.1 & BYT 2024 Bảng 45.

---

### [CKD-R3-R3-07] MAJOR — Sai lệch ngưỡng chuyển cấp cứu Toan chuyển hóa ngoại trú (`HCO3- = 10.0–11.9 mmol/L` vẫn kê SGLT2i + Bicarbonat uống) và nhầm hằng số `g3aMin (45)` thay vì `g3bMin (30)` trong dự phòng CI-AKI nội viện
- **Loại / Định danh:** `threshold` | `ckd.acidosis.hco3_outpatient_emergency_and_ci_aki_hydration` (`kb/thresholds/ckd.json:189`, `src/modules/ckd/rules.outpatient.extra.ts:723`, `src/modules/ckd/rules.inpatient.ts:796`)
- **Bằng chứng:**
  1. **Toan chuyển hóa nặng ngoại trú (`HCO3- = 10.0–11.9 mmol/L`):**
     - Chính trích dẫn `byt.ckd.2024.acute_acidosis_target_10` trong `kb/citations/ckd.json` (dòng 1152–1153, BYT 2024 Mục 4.10.3.1 tr. 66) ghi rõ: *"Trong toan chuyển hóa nặng cấp tính (**HCO3- <= 10 mmol/L**), cần xử trí nội viện truyền tĩnh mạch natri bicarbonate để nâng nhanh pH > 7,20 và bicarbonate > 10 mmol/L"*, và ngưỡng lọc máu cấp cứu nội viện của chính module là `ckd.dialysis.hco3_emergency_max = 12 mmol/L` (trong `round2_RESPONSE.md` dòng 204 tác giả cũng ghi đã chặn ở `< 12 mmol/L`).
     - Thế nhưng `ckd.acidosis.hco3_outpatient_emergency` lại đặt bằng `10` kèm phép so sánh nghiêm ngặt `hco3 < 10`. Hậu quả ở ca **`S42`** (`HCO3- = 10.0 mmol/L`) và ca **`S74`** (`r3_summary_report.txt` dòng 966–976, `HCO3- = 11.0 mmol/L`, `eGFR = 20.8`): bệnh nhân không nhận được cảnh báo chuyển cấp cứu mà được kê đơn về nhà `Natri Bicarbonat 500 mg uống` kèm **`[START] Khởi trị Dapagliflozin 10 mg`** (nguy cơ thúc đẩy toan ceton đẳng đường huyết chồng lên nền toan nặng `HCO3- = 10–11 mmol/L`!).
  2. **Nhầm biến `g3aMin (45)` thay vì `g3bMin (30)` trong luật cản quang nội viện (`src/modules/ckd/rules.inpatient.ts:796`):**
     - Dòng 788–796 viết:
       ```ts
       const g3aMin = thFor('egfr', 'ckd.egfr.g3a_min'); // 45
       const g3bMin = thFor('egfr', 'ckd.egfr.g3b_min'); // 30
       ...
       const isHighRiskStart = egfr < g3aMin || intraArterial; // <-- egfr < 45!
       ```
       Ngay bên dưới (dòng 805), câu `rationale` tự mâu thuẫn khi in ra: *"ESC 2026 khuyến cáo Class I khi eGFR < 30 mL/phút/1.73m²"*. Thực nghiệm ca **`S44`** (`eGFR = 38.4`, chụp CT cản quang **tĩnh mạch**, `contrastRouteIntraArterial = false`) vẫn bị phát lệnh `[START]` truyền NaCl 0.9% tĩnh mạch bắt buộc thay vì `[CONSIDER]` cá thể hóa theo **ESC 2026 CVD-CKD tr. 65 & Table 30**.
- **Hướng khắc phục đề xuất:**
  1. Nâng `ckd.acidosis.hco3_outpatient_emergency` lên `12 mmol/L` (đồng bộ với `ckd.dialysis.hco3_emergency_max = 12` và cam kết `round2_RESPONSE.md`, hoặc tối thiểu dùng `<= 10` và `DEFER` khởi trị mới SGLT2i khi `HCO3- < 12–15 mmol/L`).
  2. Tại `src/modules/ckd/rules.inpatient.ts:796` (và dòng 827), sửa `g3aMin` thành `g3bMin` (`const isHighRiskStart = egfr < g3bMin || intraArterial;`).

---

### [CKD-R3-R3-08] MINOR — `checkEmergencyRedFlags` phát thẻ `"CHUYỂN CẤP CỨU KHẨN CẤP"` cho bệnh nhân đã nằm nội viện và bắn trùng 3 thẻ `[REFER]` ở ngoại trú
- **Loại / Định danh:** `rule` | `reviewMeds.checkEmergencyRedFlags_and_duplicate_refer` (`src/engine/safety/reviewMeds.ts:46-88`, `src/modules/ckd/rules.outpatient.ts`)
- **Bằng chứng:**
  1. Ở bệnh nhân **nội viện (`setting = 'inpatient'`)** bị tăng kali máu nặng (`S33`, `S64` / Preset BN 4 với `K+ = 6.8 mmol/L`, `r3_summary_report.txt` dòng 1078), `noteText` và danh sách khuyến cáo vẫn xuất thẻ `[REFER]`: *"CHUYỂN CẤP CỨU KHẨN CẤP... chuyển ngay tới cơ sở cấp cứu"* ngay bên dưới y lệnh tiêm TM Calcium Gluconate nội viện.
  2. Ở bệnh nhân **ngoại trú** tụt huyết áp `SBP = 78 mmHg` chỉ chọn `['ckd']` (`S75`, dòng 978–986), hệ thống bắn cùng lúc **3 thẻ `REFER`**: `emergency_shock_hypotension` (bị gán cứng `module: 'hf'` dù không chọn module HF!), `rec_ckd_outpatient_hypotension_refer`, và thẻ chuyển khám phòng khám thường quy `rec_ckd_refer_specialist` (tương tự `S37` ở `K+ = 6.2 mmol/L`).
- **Hướng khắc phục đề xuất:** Truyền `settings.setting` vào `checkEmergencyRedFlags` để tắt thẻ `"chuyển ngay tới cơ sở cấp cứu"` khi `setting === 'inpatient'`, khử trùng lặp với thẻ cấp cứu ngoại trú của module `ckd`, và tạm ẩn thẻ chuyển khám thường quy `rec_ckd_refer_specialist` khi `isOutpatientAcuteCrisis(ctx) === true`.

---

### [CKD-R3-R3-09] MINOR — Lỗi hiển thị từ tiếng Anh thô `"Cần nhập sex để đánh giá"` và mô tả Preset BN 2 không khớp phác đồ đầu ra
- **Loại / Định danh:** `ui` | `ckd.missing_input_sex_and_preset2_description` (`src/engine/require.ts:45`, `src/modules/ckd/presets.ts:36`)
- **Bằng chứng:**
  1. **Ca `S07` (`r3_summary_report.txt` dòng 83 — `scr = 180`, `age = undefined`, `sex = undefined`):** Thẻ `missing_input_sex` in tiêu đề **`"Cần nhập sex để đánh giá"`** vì hằng số `FIELD_LABELS` trong `src/engine/require.ts` (dòng 17–60) có `age: 'Tuổi'` nhưng thiếu `sex: 'Giới tính'`.
  2. **Preset BN 2 (`src/modules/ckd/presets.ts:36` & `r3_summary_report.txt` dòng 1003):** `descriptionVi` ghi *"...khởi trị chất gắn kali để tiếp tục RASi/SGLT2i"*, trong khi BN 2 đang uống `Coversyl (Perindopril) 5 mg/ngày` ở `eGFR = 21.7` nên kết quả thực tế phát lệnh **`[REDUCE] Giảm liều Coversyl về mức tối đa theo chức năng thận (2.5 mg cách ngày)`**.
- **Hướng khắc phục đề xuất:** Thêm `sex: 'Giới tính'` vào `FIELD_LABELS` tại `src/engine/require.ts:45` và cập nhật `descriptionVi` của BN 2 tại `src/modules/ckd/presets.ts:36` phản ánh đúng việc giảm liều `Perindopril` theo mức lọc cầu thận.

---

## 3. Kết luận Kiểm định Vòng 3 (Vai R3)

- Tổng số lỗi phát hiện: **4 `critical`, 3 `major`, 2 `minor`, 0 `suggestion`**.
- **Kết luận cuối cùng:** **FAIL**
