# Báo cáo Giải trình & Khắc phục Toàn diện – Vòng Phản biện Độc lập 2 (Round 2 Remediation)
**Phân hệ (Module):** Bệnh thận mạn & Tổn thương thận cấp (`ckd`)  
**Đơn vị thực hiện:** Agent E3 – Kỹ sư Khắc phục Toàn diện Phân hệ Thận học (Round 2 Remediation Engineer)  
**Ngày hoàn thành:** 27/10/2026  
**Mục tiêu chuẩn bị Vòng 3 & Vòng 4:** **0 Critical, 0 Major, 0 Minor/Suggestion tồn đọng**

---

## 1. Tổng quan Kết quả Khắc phục (Executive Summary)

Toàn bộ **42/42 phát hiện (100%)** từ ba hội đồng phản biện độc lập Vòng 2 (`docs/reviews/ckd/round2_R1.json` [12 phát hiện], `docs/reviews/ckd/round2_R2.json` [13 phát hiện], `docs/reviews/ckd/round2_R3.json` [17 phát hiện]) đã được xử lý triệt để, đối chiếu trực tiếp với kho PDF/SmPC gốc và khóa cứng bằng bộ kiểm thử bất biến + Golden Cases hồi quy:

| Hội đồng Phản biện | Critical | Major | Minor | Suggestion | Tổng cộng | Trạng thái |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Reviewer R1** (`round2_R1.json`) | 2 | 5 | 4 | 1 | **12** | **12/12 ĐÃ KHẮC PHỤC (100%)** |
| **Reviewer R2** (`round2_R2.json`) | 0 | 6 | 6 | 1 | **13** | **13/13 ĐÃ KHẮC PHỤC (100%)** |
| **Reviewer R3** (`round2_R3.json`) | 5 | 7 | 3 | 2 | **17** | **17/17 ĐÃ KHẮC PHỤC (100%)** |
| **TỔNG HỢP TOÀN VÒNG 2** | **7** | **18** | **13** | **4** | **42** | **42/42 HOÀN TẤT (100%)** |

### Khối lượng Cập nhật Kỹ thuật & Y khoa (Deliverables)
1. **Kho Trích dẫn (`kb/citations/ckd.json`):** Hiệu đính bản dịch `quoteVi` cho `ukka.2022.guideline_18_1_emergency_dialysis` và bổ sung **34 trích dẫn nguyên văn mới** đã kiểm chứng từng ký tự từ PDF/HTML gốc (KDIGO 2024 CKD, KDIGO 2025 GLP-1 Commentary / FLOW, ESC 2026 CVD-CKD, AHA/ACC 2025 High BP, UKKA 2022 Acute Hyperkalaemia, BYT 2024 Bảng 12, ACR/ESUR/KDIGO Contrast, FDA Kerendia/Cozaar/Atacand/Lokelma/Veltassa, EMA Coversyl Arginine & Calcium Resonium SmPC).
2. **Kho Ngưỡng Lâm sàng (`kb/thresholds/ckd.json`):** Bổ sung **18 ngưỡng định lượng mới** (tổng cộng **82 ngưỡng** `ckd.*`, đạt **0 hằng số trần / QA-10 = 0 warnings** trên `rulesLint.ts`).
3. **Kho Dược thư (`kb/drugs/*.json` & `kb/review/*.json`):** Cập nhật **10 hồ sơ hoạt chất sở hữu bởi CKD** (`finerenone`, `losartan`, `telmisartan`, `perindopril`, `calcium_polystyrene_sulfonate`, `patiromer`, `sodium_zirconium_cyclosilicate`, `ramipril`, `valsartan`, `candesartan`) và tái ký số toàn bộ **29 tệp `kb/review/`** thuộc phạm vi CKD (`npm run verify:kb` đạt **0 lỗi, 0 cảnh báo CKD**).
4. **Kiến trúc Luật Lâm sàng & UI Metadata (`src/modules/ckd/**`):**
   - Tái cấu trúc mô-đun dùng chung `src/modules/ckd/helpers.ts` (`fmtShortDose`, `medDisplayName`, `getBaselineScrUmol`, `hasCkdFlag`, `isAkiActive`, `isOutpatientAcuteCrisis`, truy vấn lớp thuốc chuẩn hóa `getNormalizedDrugClasses`, `parseCurrentDailyDoseMg`, `getRenalMaxDailyDoseInfo`).
   - Nâng cấp toàn diện `rules.inpatient.ts` (11 nhóm quy tắc nội viện), `rules.outpatient.ts` & `rules.outpatient.extra.ts` (32 nhóm quy tắc ngoại trú/đa bối cảnh), `matrix.ts`, `pathway.ts`, `presets.ts`, và `inputs.ts`.
5. **Kiểm thử Vàng & Bất biến Ngẫu nhiên (`tests/golden/ckd/**`, `tests/modules/ckd/invariants.test.ts`):**
   - Bổ sung **12 Golden Cases hồi quy mới** (`ckd_49` đến `ckd_60`), nâng tổng số lên **61/61 Golden Cases** vượt qua 100% (`162 assertions`).
   - Mở rộng `tests/modules/ckd/invariants.test.ts` lên **21 bất biến lâm sàng trên 10,000 bệnh nhân ngẫu nhiên** + **6,000 ca kiểm thử Fail-Closed (QA-1/QA-9)** xóa ngẫu nhiên `scr, k, sbp, uacr, age, sex` + kiểm thử trực tiếp Presets/Matrix/Pathway và hồi quy Vòng 2.

---

## 2. Giải trình Chi tiết Từng Phát hiện – Hội đồng R1 (`round2_R1.json`)

### `CKD-R2-R1-01` [Critical] — Chuẩn hóa đơn vị `customInputs.baselineScr` (`mg/dL` vs `µmol/L`)
- **Nguyên nhân gốc:** `normalizePatientUnits()` trong `src/engine/units.ts` đã tự động quy đổi `customInputs.baselineScr` từ `mg/dL` sang `µmol/L` (thông qua `BUILTIN_CUSTOM_UNIT_KEYS = { baselineScr: 'cr' }`), trong khi `rules.inpatient.ts` trước đây đọc không nhất quán hoặc nhân đôi/bỏ sót hệ số chuyển đổi.
- **Giải pháp đã thực hiện:**
  - Xây dựng hàm chuẩn hóa duy nhất `getBaselineScrUmol(ctx)` trong `src/modules/ckd/helpers.ts`, đọc trực tiếp giá trị đã chuẩn hóa `µmol/L` từ `ctx.normalized.customInputs.baselineScr` (và chỉ nhân `88.4` dự phòng nếu caller truyền `ctx` thô chưa qua `normalizePatientUnits`).
  - Dùng chung `isAkiActive(ctx)` cho cả `rules.inpatient.ts` và `rules.outpatient.ts` / `rules.outpatient.extra.ts`.
- **Kiểm chứng:** Khóa cứng bằng Golden Case `tests/golden/ckd/ckd_49_inpatient_mgdl_stable_no_false_aki.json` (`units.cr = 'mg_dL'`, `scr = 1.2`, `baselineScr = 1.2` -> 0 cảnh báo AKI giả, tiếp tục duy trì SGLT2i/RASi/Finerenone) và unit test trực tiếp trong `invariants.test.ts`.

### `CKD-R2-R1-02` [Critical] — Cổng an toàn huyết động Fail-Closed (`sglt2i_initiate`) & xử trí tụt huyết áp (`bp_target`)
- **Giải pháp đã thực hiện:**
  - Tại `ckd.outpatient.sglt2i_initiate` (`src/modules/ckd/rules.outpatient.ts`): Bỏ bộ lọc ẩn trong `when()`, sửa `const passedSbp = sbp !== undefined && sbp >= minSbp;` để thực thi nghiêm ngặt **Fail-Closed (QA-1)**: trả về `action: 'DEFER'` kèm cổng `SBP: passed=false` cả khi `sbp === undefined` lẫn khi `sbp < 100 mmHg`.
  - Bổ sung quy tắc `ckd.outpatient.missing_sbp_check` gọi `missingInputRec('ckd', 'sbp', ...)` khi thiếu số đo huyết áp.
  - Tại `ckd.outpatient.bp_target` & `ckd.outpatient.hypotension_crisis_refer`: Không bao giờ xuất `UPTITRATE` khi `sbp === undefined`; khi `sbp < 90 mmHg` phát lệnh `REFER` cấp cứu sốc/tụt huyết áp và tự động chặn mọi lệnh `START`/`UPTITRATE` thuốc mạn tính; khi `90 <= sbp < 100 mmHg` phát lệnh `REDUCE` rà soát giảm liều thuốc hạ áp thay vì báo `"Đạt mục tiêu kiểm soát"`.
- **Kiểm chứng:** Golden Cases `ckd_50_missing_sbp_fail_closed_no_start.json` và `ckd_58_outpatient_hypotension_shock_crisis.json` + 6,000 ca fuzzing Fail-Closed.

### `CKD-R2-R1-03` [Major] — Bổ sung trụ cột thứ 4 bảo vệ tim-thận GLP-1 RA (`ckd.outpatient.glp1ra_indication`)
- **Giải pháp đã thực hiện:**
  - Bổ sung quy tắc `ckd.outpatient.glp1ra_indication` (`drugId: 'semaglutide'`, `benefitsAlso: ['dm2', 'hf']`) trong `src/modules/ckd/rules.outpatient.extra.ts` và đăng ký vào `rules.outpatient.ts`.
  - Hỗ trợ cả 2 nhánh chỉ định chuẩn y khoa:
    1. **Nhánh Bảo vệ Thận – Tim mạch độc lập HbA1c (FLOW / ESC 2026 Table 12 Class I-A / KDIGO 2025 Commentary):** T2D + CKD có `eGFR 25–49` kèm `UACR >= 10 mg/mmol` hoặc `eGFR 50–74` kèm `UACR >= 30 mg/mmol` -> `action: 'START'` (hoặc `DEFER` nếu thiếu `sbp` / `sbp < 100 mmHg`).
    2. **Nhánh Kiểm soát đường huyết / Không dùng được SGLT2i–Metformin (KDIGO 2024 Rec 3.9.1 Grade 1B / BYT 2024 Mục 4.1.2.1):** T2D + CKD có `HbA1c >= 7.0%` dù đang dùng SGLT2i/Metformin, hoặc `eGFR < 20 mL/phút/1.73m²` (không khởi trị được SGLT2i và chống chỉ định Metformin).
  - Tích hợp khóa thai kỳ (`hasCkdFlag(ctx, 'pregnant')`), khóa đợt cấp ngoại trú/AKI, và khử trùng lặp khi bệnh nhân đang dùng bất kỳ `glp1_ra` / `gip_glp1_ra` nào.
  - Bổ sung 4 citations nguyên văn (`kdigo.ckd.2024.rec_3_9_1_glp1ra`, `kdigo.ckd.2025.flow_glp1ra_fourth_pillar`, `esc.cvd_ckd.2026.table_12_semaglutide_ia`, `byt.ckd.2024.sec_4_1_2_1_glp1ra`) và cập nhật `pathway.ts` + `matrix.ts`.
- **Kiểm chứng:** Golden Case `ckd_51_t2d_ckd_glp1ra_fourth_pillar_flow.json`.

### `CKD-R2-R1-04` [Major] — Phân tầng chỉ định lọc máu cấp cứu (`ckd.inpatient.emergency_dialysis_indication`) & sửa dịch `quoteVi` UKKA 2022 18.1
- **Giải pháp đã thực hiện:**
  - Bổ sung `refractoryHyperkalemia` và `refractoryPulmonaryEdema` vào `src/modules/ckd/inputs.ts`.
  - Cập nhật `ckd.inpatient.emergency_dialysis_indication` (`src/modules/ckd/rules.inpatient.ts`): Với bệnh nhân `K+ >= 6.5 mmol/L`, chỉ phát lệnh `action: 'REFER'` (`rec_ckd_emergency_rrt` – đặt catheter/lọc máu cấp cứu ngay) khi đi kèm **ít nhất một điều kiện bắt buộc**: đang lọc máu chu kỳ (`onDialysis`), tăng kali kháng trị nội khoa (`refractoryHyperkalemia === true`), vô niệu/thiểu niệu (`anuria`/`oliguria`), suy thận nền rất nặng mất khả năng bài tiết kali (`eGFR < 30` hoặc AKI Giai đoạn 3), toan nặng (`HCO3- < 12`), phù phổi cấp kháng lợi tiểu, hoặc biến chứng urê huyết cao. Nếu `K+ >= 6.5 mmol/L` mới phát hiện lần đầu trên nền chức năng thận còn bảo tồn (`eGFR >= 30`), tiểu bình thường và chưa điều trị nội khoa, hệ thống phát `action: 'CONSIDER'` (`rec_ckd_rrt_standby_severe_k`) yêu cầu ưu tiên gói nội khoa 5 bước UKKA trước và chuẩn bị sẵn phương án RRT dự phòng.
  - Hiệu đính `quoteVi` của `ukka.2022.guideline_18_1_emergency_dialysis` trong `kb/citations/ckd.json` dịch chính xác cụm *"bệnh nhân đang lọc máu chu kỳ (haemodialysis patients)"* và bổ sung `ukka.2022.guideline_19_6_20_1_aki_rrt_refractory` + `byt.ckd.2024.acute_rrt_indications`.
- **Kiểm chứng:** Golden Case `ckd_52_inpatient_k66_medical_first_not_immediate_rrt.json`.

### `CKD-R2-R1-05` [Major] — Liên chuyên khoa Thận – Suy tim (`HFrEF` vs `HFmrEF/HFpEF` 40 mg) & tiêu đề ngắn gọn cho Finerenone
- **Giải pháp đã thực hiện:**
  - **HFrEF (`LVEF <= 40%`):** Trong `ckd.outpatient.finerenone_indication`, loại trừ tự động `START Finerenone` khi `lvef <= 40%`; đồng thời bổ sung quy tắc `ckd.outpatient.hfref_prefer_steroidal_mra` (`rules.outpatient.extra.ts`) phát thẻ `CONSIDER` hướng dẫn ưu tiên MRA steroid nhóm Class I-A (Spironolactone/Eplerenone) giảm tử vong theo ESC 2026 Sec 6.2.1.3 & KDIGO 2024 PP 3.8.5.
  - **HFmrEF/HFpEF (`LVEF > 40%` kèm `eGFR >= 60`):** Cập nhật `ckd.outpatient.finerenone_uptitrate` hỗ trợ chuẩn độ từ `20 mg/ngày` lên liều đích `40 mg/ngày` (với cổng `K+ <= 5.0 mmol/L`) theo Nhãn FDA Kerendia (09/2026) Table 3 (`fda.finerenone.table_3_hf_40mg_target`).
  - **Khử rò rỉ mô tả dài vào `title` & `dose`:** Dùng `fmtShortDose()` hiển thị gọn đúng hàm lượng dành riêng cho từng bệnh nhân (`"Khởi trị Finerenone (10 mg x 1 lần/ngày (uống))"` hoặc `"20 mg..."`), không bao giờ chèn mô tả liều 40 mg của suy tim sang bệnh nhân CKD đơn thuần.
- **Kiểm chứng:** Golden Cases `ckd_53_hfref_ckd_t2d_prefer_steroidal_mra_not_finerenone.json` và `ckd_54_hfpef_ckd_t2d_finerenone_uptitrate_40mg.json`.

### `CKD-R2-R1-06` [Major] — Tách bạch 3 hồ sơ `INTL` / `US` / `VN`, kiểm tra `DBP` và phân tầng `G4–G5` trong `ckd.outpatient.bp_target`
- **Giải pháp đã thực hiện:**
  - Tách rõ 3 nhánh độc lập trong `ckd.outpatient.bp_target` (`src/modules/ckd/rules.outpatient.ts`):
    1. **`INTL` (KDIGO 2021/2024):** Đích `SBP < 120 mmHg` (đo huyết áp chuẩn hóa).
    2. **`US` (AHA/ACC 2025 Section 5.3.8 COR 1 LOE A):** Đích `< 130/80 mmHg` — kiểm tra đồng thời `sbp < 130` VÀ `(dbp === undefined || dbp < 80)` kèm trích dẫn `aha_acc.htn.2025.sec_5_3_8_ckd_bp_target`.
    3. **`VN` (BYT 2024 / ESC 2026 Table 11):** Khi `eGFR > 30` (G1–G3b): đích `120–129 / < 80 mmHg`; khi `eGFR <= 30` (G4–G5) hoặc đang lọc máu: cá thể hóa mục tiêu theo khả năng dung nạp (`< 130–139 / < 80 mmHg`), tuyệt đối không gắn nhầm lý giải của nhóm `eGFR >= 30`.
- **Kiểm chứng:** Golden Case `ckd_55_bp_target_us_profile_isolated_diastolic_htn.json` (`124/88 mmHg`, `profile: 'US'` -> `UPTITRATE`).

### `CKD-R2-R1-07` [Major] — Đồng bộ bối cảnh `setting: 'inpatient'` & `uacr: undefined` cho Presets BN 3 & BN 4
- **Giải pháp đã thực hiện:**
  - Trong `src/modules/ckd/presets.ts`: Khai báo tường minh `setting: 'outpatient'` cho BN 1–2 và `setting: 'inpatient'` + `uacr: undefined` cho BN 3 (`ckd_preset_3_inpatient_aki_stage2`) & BN 4 (`ckd_preset_4_severe_hyperkalemia_emergency`) (phối hợp với cơ chế đọc `preset.setting` của `AppShell.tsx` từ Agent B3).
- **Kiểm chứng:** Bộ kiểm thử Preset tự động trong `tests/modules/ckd/invariants.test.ts` xác nhận BN 3 kích hoạt AKI Stage 2 + HOLD thuốc và BN 4 kích hoạt gói cấp cứu tăng Kali máu nặng 5 bước UKKA + SZC.

### `CKD-R2-R1-08` [Minor] — Triệt tiêu lỗi hiển thị chuỗi rỗng / `"undefined"` khi `CurrentMed.name` bị khuyết
- **Giải pháp đã thực hiện:**
  - Viết hàm `medDisplayName(m)` trong `src/modules/ckd/helpers.ts` (`m.name?.trim() || drug(m.drugId).nameVi || m.drugId`) và thay thế 100% truy cập trực tiếp `.name` trong `rules.inpatient.ts`, `rules.outpatient.ts` và `rules.outpatient.extra.ts`.
- **Kiểm chứng:** Bất biến #19 trong `invariants.test.ts` quét 10,000 ca ngẫu nhiên (kể cả `CurrentMed` không có `name`) đảm bảo `0` chuỗi `"undefined"`, `"NaN"` hoặc `": , "`.

### `CKD-R2-R1-09` [Minor] — Lựa chọn hoạt chất RASi & liều thận của Perindopril ở CKD G4–G5 (`VN` vs `INTL`/`US`)
- **Giải pháp đã thực hiện:**
  - Trong `ckd.outpatient.rasi_initiate`: Xóa bỏ phép kẹp giả `Math.max(egfr, g4Min)`. Ở hồ sơ `profile === 'VN'` khi `eGFR < 30 mL/phút/1.73m²` (theo BYT 2024 Bảng 12 tr. 38: *"Perindopril: Không sử dụng khi CrCl < 30 ml/phút"*) hoặc khi `eGFR < 15` (CKD G5 chưa lọc máu ở mọi profile), hệ thống chuyển sang `losartan` liều thận khởi đầu `25 mg/ngày` (và ở G5 chưa lọc máu chỉ phát mức `CONSIDER` thận trọng thay vì `START` 1B).
  - Trong `kb/drugs/perindopril.json` và `src/modules/ckd/matrix.ts`: Tách bạch rõ ghi chú G5 chưa lọc máu (`2.5 mg cách ngày` / BYT 2024 khuyến cáo tránh dùng khi `CrCl < 30`) với cột `Lọc máu (HD/PD)` (`2.5 mg vào ngày lọc máu`).

### `CKD-R2-R1-10` [Minor] — Phân tầng cột `AKI` trong `src/modules/ckd/matrix.ts` theo UKKA 2022 & FDA
- **Giải pháp đã thực hiện:**
  - Cập nhật `getAkiCell()` trong `src/modules/ckd/matrix.ts`:
    - `sodium_zirconium_cyclosilicate`: `initiate: 'rec', continue: 'rec'` (ưu tiên khi có tăng K+ cấp tính nhờ khởi phát sau 1 giờ – UKKA 2022 16.6.1).
    - `patiromer`: `initiate: 'ok', continue: 'ok'` (khởi phát chậm 4–7 giờ, không dùng đơn độc thay thuốc cấp cứu – FDA Veltassa Limitation of Use).
    - `calcium_polystyrene_sulfonate`: `initiate: 'caution', continue: 'caution'` (không dùng cấp cứu tăng K+ nặng đe dọa tính mạng theo UKKA 2022 16.6.3; nguy cơ hoại tử ruột).
    - `sodium_bicarbonate`: `initiate: 'caution', continue: 'ok'` (chỉ dùng khi kèm toan chuyển hóa; toan nặng `pH < 7.1` / `HCO3- < 12` cần bù tĩnh mạch hoặc RRT).

### `CKD-R2-R1-11` [Minor] — Hiện thực hóa quy tắc `ckd.inpatient.hyperkalemia_severe_szc_order`
- **Giải pháp đã thực hiện:**
  - Bổ sung quy tắc độc lập `ckd.inpatient.hyperkalemia_severe_szc_order` (`action: 'START'`, `drugId: 'sodium_zirconium_cyclosilicate'`, liều tấn công `10 g x 3 lần/ngày tối đa 72 giờ`) trong `src/modules/ckd/rules.inpatient.ts` đi kèm `profileDiff` (`VN` vs `INTL`/`US`). Nhờ gán `drugId` tường minh, bộ kiểm tra tương tác thuốc tự động (`ix.szc_binder_separation` cách liều uống ≥ 2 giờ) và đối chiếu chống chỉ định được kích hoạt đầy đủ trong nội viện.

### `CKD-R2-R1-12` [Suggestion] — Cập nhật mô hình 4 trụ cột trong `ckdPathway` & gợi ý Cystatin C ở G3aA1
- **Giải pháp đã thực hiện:**
  - Cập nhật `src/modules/ckd/pathway.ts` phản ánh đầy đủ mô hình **4 trụ cột làm chậm tiến triển bệnh thận đái tháo đường** (RASi + SGLT2i + nsMRA Finerenone + GLP-1 RA Semaglutide) và nhắc định lượng `eGFRcr-cys` ở bước tầm soát.
  - Bổ sung quy tắc `ckd.outpatient.cystatin_c_g3aa1_confirm` (`src/modules/ckd/rules.outpatient.extra.ts`) phát gợi ý `CONSIDER` định lượng Cystatin C kết hợp (`eGFRcr-cys`) khi bệnh nhân ở phân tầng ranh giới `G3aA1` (`45 <= eGFR < 60` và `UACR < 3 mg/mmol`) và `cystatinC === undefined` theo KDIGO 2024 Rec 1.2.1 (1B).

---

## 3. Giải trình Chi tiết Từng Phát hiện – Hội đồng R2 (`round2_R2.json`)

### `CKD-R2-R2-01` [Major] — Phối hợp ARB + Lợi tiểu giữ Kali / MRA (`ix.rasi_mra_potassium_sparing` & chặn `UPTITRATE`)
- **Giải pháp đã thực hiện:**
  - **Trong phạm vi `ckd` (`src/modules/ckd/rules.outpatient.ts`):** Bổ sung điều kiện chặn cứng trong `ckd.outpatient.rasi_uptitrate`: không bao giờ phát `UPTITRATE` RASi khi bệnh nhân đang dùng đồng thời thuốc lợi tiểu giữ kali (`amiloride`, `triamterene`) hoặc nhóm MRA (`spironolactone`, `eplerenone`) có nguy cơ tăng kali máu cộng gộp; đồng thời bổ sung trích dẫn nhãn FDA Atacand Section 7.1 (`fda.candesartan.sec_7_1_hyperkalemia_agents`) vào `kb/citations/ckd.json` & `kb/drugs/candesartan.json`.
  - **Phối hợp liên Agent (`kb/interactions/renal_rasi.json` – Agent C3):** Đã xác minh cả 5 ARB (`losartan`, `valsartan`, `telmisartan`, `irbesartan`, `candesartan`) đã được bổ sung đầy đủ vào `ix.rasi_mra_potassium_sparing`, `ix.triple_whammy`, `ix.rasi_mra_k_supplements`, và `ix.rasi_lithium`.

### `CKD-R2-R2-02` [Major] — Tôn trọng trần chỉnh liều thận (`renalBand`) trong `ckd.outpatient.rasi_uptitrate` & giảm liều khi vượt trần
- **Giải pháp đã thực hiện:**
  - Xây dựng bộ phân tích liều hàng ngày thực tế `parseCurrentDailyDoseMg(med)` (hỗ trợ cả tần suất `"cách ngày"` / `"q48h"` / `"ngày lọc máu"` nhân hệ số `0.5`) và `getRenalMaxDailyDoseInfo(ctx, drugId)` trong `src/modules/ckd/helpers.ts` tra cứu trực tiếp `renalBand(drugId, metric, metricType)` theo `CrCl` (cho `perindopril`, dự phòng `egfr` khi thiếu cân nặng) hoặc `eGFR`.
  - Cập nhật `ckd.outpatient.rasi_uptitrate` (`rules.outpatient.ts`): Chỉ phát `UPTITRATE` khi `currentDailyMg < effectiveCeilingMg` (`Math.min(standardTargetMg, renalMaxDailyMg)`).
  - Bổ sung quy tắc mới `ckd.outpatient.rasi_renal_dose_reduce` (`rules.outpatient.extra.ts`): Khi bệnh nhân đang dùng ACEi thải qua thận vượt quá trần liều thận cho phép (ví dụ Perindopril `5 mg/ngày` hoặc `2.5 mg/ngày` ở `CrCl 15–29 mL/phút` khi trần SmPC là `2.5 mg cách ngày = 1.25 mg/ngày`), hệ thống tự động phát khuyến cáo `action: 'REDUCE'` yêu cầu chỉnh giảm về đúng liều thận SmPC/FDA.
- **Kiểm chứng:** Golden Case `ckd_56_perindopril_g4_renal_ceiling_reduce_not_uptitrate.json`.

### `CKD-R2-R2-03` [Major] — Rà soát `STOP`/`HOLD` chất gắn Kali khi hạ kali máu & chuẩn hóa ngưỡng chống chỉ định CPS `K+ < 5.0 mmol/L`
- **Giải pháp đã thực hiện:**
  - Cập nhật `kb/drugs/calcium_polystyrene_sulfonate.json`: Sửa `contraindications` và `gate_cps_k_low` từ ngưỡng sai `4.0` thành **`K+ < 5.0 mmol/L`** theo đúng EMA/MHRA SmPC Calcium Resonium Section 4.3 (`ema.calcium_resonium.sec_4_3_contraindications`).
  - Bổ sung bộ quy tắc đa bối cảnh (`setting: 'both'`) `ckd.both.kbinder_low_k_<drugId>` trong `src/modules/ckd/rules.outpatient.extra.ts` cho cả 3 chất gắn kali (`calcium_polystyrene_sulfonate`, `sodium_zirconium_cyclosilicate`, `patiromer`):
    - Khi `K+ < 3.5 mmol/L` (hạ kali máu thực sự): phát `action: 'STOP'` khẩn cấp cho mọi K-binder.
    - Khi `K+ < 5.0 mmol/L` đối với `calcium_polystyrene_sulfonate`: phát `action: 'STOP'` do rơi vào vùng chống chỉ định nhãn SmPC (`< 5.0 mmol/L`).
    - Khi `3.5 <= K+ < 4.0 mmol/L` đối với `SZC` / `Patiromer`: phát `action: 'HOLD'` tạm ngừng/giảm liều dự phòng hạ kali máu theo nhãn FDA Lokelma/Veltassa.
- **Kiểm chứng:** Golden Case `ckd_57_cps_hypokalemia_stop_binder.json`.

### `CKD-R2-R2-04` [Major] — Giới hạn `START` thường quy RASi ở G1–G4 và áp dụng đúng dải liều thận Losartan ở G4–G5
- **Giải pháp đã thực hiện:**
  - Trong `ckd.outpatient.rasi_initiate` (`src/modules/ckd/rules.outpatient.ts`): Giới hạn khuyến cáo `START` thường quy (Grade 1B / 2C theo KDIGO 2024 Rec 3.6.1–3.6.3) cho nhóm **G1–G4 (`eGFR >= 15 mL/phút/1.73m²`)**. Khi `eGFR < 15` chưa lọc máu (CKD G5), chuyển sang `action: 'CONSIDER'` thận trọng cá thể hóa với `losartan 25 mg/ngày` (không tự động kê Perindopril hay gán mác 1B).
  - Ở bệnh nhân CKD G4 (`15 <= eGFR < 30`) khởi trị `losartan`, đọc trực tiếp dải liều thận từ `renalBand('losartan', egfr, 'egfr')` (`25–50 mg/ngày`, khởi đầu `25 mg/ngày`) thay vì áp cứng liều `50 mg/ngày`.

### `CKD-R2-R2-05` [Major] — Chuẩn hóa cột `AKI` của `ckdMatrix` cho CPS, Patiromer, SZC và NaHCO3
- **Giải pháp đã thực hiện:** Đã khắc phục đồng bộ cùng `CKD-R2-R1-10` tại `getAkiCell()` trong `src/modules/ckd/matrix.ts` kèm kiểm thử khóa cứng trong `tests/modules/ckd/invariants.test.ts` (`expect(cps.aki.initiate).toBe('caution')`, `expect(patiromer.aki.initiate).toBe('ok')`).

### `CKD-R2-R2-06` [Major] — Sửa khoảng thời gian giãn cách thuốc uống dùng kèm của Calcium Polystyrene Sulfonate thành `≥ 3 giờ`
- **Giải pháp đã thực hiện:**
  - Cập nhật `kb/drugs/calcium_polystyrene_sulfonate.json` (và `patiromer.json`, `sodium_zirconium_cyclosilicate.json`) ghi rõ hướng dẫn: *"Uống cách xa các thuốc uống khác ít nhất 3 giờ trước hoặc sau (cân nhắc 6 giờ nếu có liệt dạ dày)"* theo EMA/MHRA SmPC Calcium Resonium Section 4.2 & 4.4 (`ema.calcium_resonium.sec_4_2_separation_3h`), đồng bộ cùng quy tắc tương tác của Agent C3.

### `CKD-R2-R2-07` [Minor] — Loại bỏ rò rỉ mô tả liều 40 mg của HFmrEF/HFpEF vào `title` & `dose` trên bệnh nhân CKD thuần túy
- **Giải pháp đã thực hiện:** Đã khắc phục triệt để bằng hàm `fmtShortDose()` trong `src/modules/ckd/helpers.ts` áp dụng cho toàn bộ `finerenone_indication`, `finerenone_uptitrate`, `sglt2i_initiate`, `rasi_initiate`, `statin_indication`, và `glp1ra_indication`.

### `CKD-R2-R2-08` [Minor] — Đồng bộ cột `G4`, `G5 (< 15)` và `Lọc máu (HD/PD)` trong `ckdMatrix` và KB RASi
- **Giải pháp đã thực hiện:**
  1. Tách riêng hàm `getG5Cell()` và `getDialysisCell()` trong `src/modules/ckd/matrix.ts` để `perindopril` ở cột G5 chưa lọc máu hiển thị `"2.5 mg cách ngày (thận trọng cao; BYT 2024 tránh dùng khi CrCl < 30)"`, còn cột `dialysis` hiển thị `"2.5 mg vào ngày lọc máu"`.
  2. Tách dải thận `< 30` thành 2 dải `15–30` và `< 15` (`initiate: 'caution', continue: 'caution'`) trong `kb/drugs/ramipril.json`, `kb/drugs/valsartan.json`, và `kb/drugs/candesartan.json` đồng bộ hoàn toàn với `enalapril`, `lisinopril`, `losartan`.
  3. Tại `getG4Cell()` trong `src/modules/ckd/matrix.ts`, tính điểm giữa chuẩn từ `(th('ckd.egfr.g4_min') + th('ckd.egfr.g3b_min')) / 2` (`22.5`) thay vì mượn ngưỡng của SGLT2i.

### `CKD-R2-R2-09` [Minor] — Ghi rõ dạng muối Perindopril arginine vs Perindopril erbumine trong `kb/drugs/perindopril.json`
- **Giải pháp đã thực hiện:** Cập nhật `forms` và ghi chú liều trong `kb/drugs/perindopril.json` nêu rõ hàm lượng `2.5 mg / 5 mg / 10 mg` tính theo muối **Perindopril arginine** (tương đương sinh học `2 mg / 4 mg / 8 mg` muối **Perindopril erbumine / tert-butylamine**) kèm trích dẫn `ema.perindopril.posology_salt_equivalence`.

### `CKD-R2-R2-10` [Minor] — Bổ sung cấu trúc chỉnh liều/chống chỉ định suy gan (`hepatic`) cho `finerenone`, `losartan`, `telmisartan`
- **Giải pháp đã thực hiện:**
  - Bổ sung đầy đủ trường cấu trúc `hepatic` (`childPughA`, `childPughB`, `childPughC`, `citationIds`) cho:
    - `kb/drugs/finerenone.json` (Child-Pugh A: bình thường; Child-Pugh B: theo dõi thêm K+; Child-Pugh C: tránh dùng – FDA Kerendia Sec 8.6 `fda.finerenone.sec_8_6_hepatic`).
    - `kb/drugs/losartan.json` (Suy gan nhẹ–vừa khởi đầu `25 mg/ngày`; tránh dùng/thận trọng tối đa ở suy gan nặng – FDA Cozaar Sec 2.4 & 8.8 `fda.losartan.sec_2_4_8_8_hepatic`).
    - `kb/drugs/telmisartan.json` (Tối đa `40 mg/ngày` ở suy gan nhẹ–vừa; chống chỉ định `biliary_obstruction` và `severe_hepatic_impairment` – BYT 2024 Bảng 12 `byt.ckd.2024.table_12_telmisartan_biliary_hepatic`).

### `CKD-R2-R2-11` [Minor] — Chuẩn hóa `lactation` và chống chỉ định `obstructive_bowel_disease` của `calcium_polystyrene_sulfonate.json`
- **Giải pháp đã thực hiện:** Cập nhật `kb/drugs/calcium_polystyrene_sulfonate.json`: chuyển `lactation.status` từ `'compatible'` sang `'caution'` theo EMA SmPC Section 4.6 (`ema.calcium_resonium.sec_4_6_pregnancy_lactation`) và bổ sung chống chỉ định `obstructive_bowel_disease` theo Section 4.3 (`ema.calcium_resonium.sec_4_3_contraindications`). (Cảnh báo trùng SZC trong `kb/interactions/` đã được Agent C3 đồng bộ).

### `CKD-R2-R2-12` [Minor] — Gắn `drugId`, `dose` và `profileDiff` cho `ckd.inpatient.hyperkalemia_moderate` + đồng bộ tài liệu
- **Giải pháp đã thực hiện:**
  - Cập nhật `ckd.inpatient.hyperkalemia_moderate` (`src/modules/ckd/rules.inpatient.ts`) chọn hoạt chất theo hồ sơ (`VN`: `calcium_polystyrene_sulfonate` / Kalimate hoặc Lokelma nếu sẵn có; `INTL`/`US`: ưu tiên `sodium_zirconium_cyclosilicate` / Lokelma `10 g x 3 lần/ngày` theo UKKA 2022 Guideline 10.2), gán đầy đủ `drugId`, `dose`, `profileDiff`, và đồng bộ chính xác với `docs/modules/CKD.md` v3.0.

### `CKD-R2-R2-13` [Suggestion] — Bổ sung quy tắc tạm ngừng/giảm liều Natri Bicarbonat khi `HCO3- > 26 mmol/L`
- **Giải pháp đã thực hiện:**
  - Bổ sung quy tắc `ckd.outpatient.metabolic_alkalosis_hold_bicarb` (`setting: 'both'` trong `src/modules/ckd/rules.outpatient.extra.ts`): Khi bệnh nhân đang dùng `sodium_bicarbonate` mà `HCO3- > thFor('hco3', 'ckd.acidosis.hco3_target_max')` (`26 mmol/L`), phát lệnh `HOLD` (nếu `HCO3- > 28`) hoặc `REDUCE` (nếu `26 < HCO3- <= 28`) để phòng ngừa nhiễm kiềm chuyển hóa và vôi hóa mạch máu (KDIGO 2024 PP 3.10.2 / BYT 2024).

---

## 4. Giải trình Chi tiết Từng Phát hiện – Hội đồng R3 (`round2_R3.json`)

### `CKD-R2-R3-01` [Critical] — Ngừng ngay (`STOP`) Finerenone ở bệnh nhân đang lọc máu định kỳ (`onDialysis = true`) bất kể eGFR sau lọc
- **Giải pháp đã thực hiện:**
  1. Bổ sung chống chỉ định cấu trúc `{"code": "dialysis", ...}` vào `kb/drugs/finerenone.json`.
  2. Bổ sung quy tắc an toàn hai lớp `ckd.both.finerenone_stop_dialysis` (`setting: 'both'`, `action: 'STOP'`, `priority: 98`) trong `src/modules/ckd/rules.outpatient.extra.ts`: Bắt trực tiếp `hasCkdFlag(ctx, 'onDialysis')` (hoặc `eGFR < 15`) khi bệnh nhân đang có `finerenone` trong `currentMeds`, đảm bảo phát lệnh `[STOP] NGỪNG NGAY Finerenone` kể cả khi Creatinin lấy ngay sau buổi chạy thận cho ra `eGFR >= 15–30 mL/phút/1.73m²`.
- **Kiểm chứng:** Golden Case `ckd_59_dialysis_post_hd_egfr_stop_finerenone_continue_statin.json` và Bất biến #20 trong `invariants.test.ts`.

### `CKD-R2-R3-02` [Critical] — Chặn toàn diện nhóm NSAID (bao gồm `indomethacin`, `torsemide`, AKI qua `baselineScr`, và cờ `takingNsaid`)
- **Giải pháp đã thực hiện:**
  - Trong `src/modules/ckd/helpers.ts`: Viết các hàm nhận diện theo lớp thuốc chuẩn hóa từ KB (`isNsaidDrug` qua `getNormalizedDrugClasses(id).has('nsaid')` bắt trọn `indomethacin`, `ibuprofen`, `naproxen`, `meloxicam`, `diclofenac`, `celecoxib`, `etoricoxib`, `piroxicam`, `ketoprofen`, `ketorolac`; `isDiureticDrug` sửa đúng chính tả `'torsemide'` đồng thời bắt cả lớp `'loop_diuretic'` & `'thiazide_diuretic'`).
  - Trong `ckd.outpatient.avoid_nsaids` (`setting: 'both'`, `rules.outpatient.ts`):
    - Xử lý cả NSAID kê trong `currentMeds` (tạo thẻ riêng theo từng hoạt chất để nâng lên `[STOP]`) lẫn trường hợp bệnh nhân chỉ tích cờ tự dùng `customInputs.takingNsaid === true`.
    - Nâng cấp lên lệnh **`[STOP]`** trong **mọi** tình huống nguy hiểm: `eGFR < 30`, đang phối hợp Bộ ba độc thận (`RASi/ARNI + Lợi tiểu` kể cả `torsemide`), đang dùng `RASi + NSAID` ở G3b, hoặc đang trong đợt cấp AKI (sử dụng hàm chung `isAkiActive(ctx)` bắt cả `scr - baselineScr >= 26.5 µmol/L` và `scr / baselineScr >= 1.5` ngay cả khi chưa tích tay `akiSuspected`).
    - Đồng thời trong đợt AKI cấp ngoại trú (`ckd.outpatient.aki_detected_refer` & `ckd.outpatient.aki_hold_<id>`), hệ thống chặn toàn bộ lệnh `START`/`UPTITRATE` thuốc mạn tính và phát lệnh `REFER` + `HOLD` ngay lập tức.
- **Kiểm chứng:** Golden Case `ckd_60_triple_whammy_indomethacin_torsemide_stop.json` và Bất biến #12 trong `invariants.test.ts`.

### `CKD-R2-R3-03` [Critical] — Bất biến Fail-Closed khi thiếu `sbp` ở `sglt2i_initiate` & bổ sung `missing_sbp_check`
- **Giải pháp đã thực hiện:** Đã khắc phục đồng bộ cùng `CKD-R2-R1-02`: `passedSbp = sbp !== undefined && sbp >= minSbp` (`action: 'DEFER'` khi `sbp === undefined`) + bổ sung quy tắc `ckd.outpatient.missing_sbp_check` gọi `missingInputRec('ckd', 'sbp', ...)`. Khóa cứng bằng `ckd_50` và 6,000 ca fuzzing Fail-Closed.

### `CKD-R2-R3-04` [Critical] — Red Flag chuyển Cấp cứu ngoại trú khi toan chuyển hóa mất bù (`HCO3- < 12 mmol/L`) & khóa khởi trị SGLT2i/chuẩn độ
- **Giải pháp đã thực hiện:**
  - Bổ sung quy tắc `ckd.outpatient.metabolic_acidosis_emergency_refer` (`action: 'REFER'`, `priority: 100`) trong `src/modules/ckd/rules.outpatient.extra.ts` khi `hco3 < thFor('hco3', 'ckd.dialysis.hco3_emergency_max')` (`12 mmol/L`), đồng thời chặn không kê đơn viên uống Natri Bicarbonat đơn thuần về nhà ở mức `< 12 mmol/L`.
  - Bổ sung hàm `isOutpatientAcuteCrisis(ctx)` (`sbp < 90 || k >= 6.0 || hco3 < 12 || isAkiActive(ctx)`) khóa cứng mọi quy tắc khởi trị/tăng liều mạn tính ngoại trú (`sglt2i_initiate`, `rasi_initiate`, `rasi_uptitrate`, `finerenone_indication`, `finerenone_uptitrate`, `glp1ra_indication`, `statin_indication`).
- **Kiểm chứng:** Bất biến #17 trong `invariants.test.ts` (10,000 ca ngẫu nhiên) + unit test hồi quy `HCO3- = 7 mmol/L`.

### `CKD-R2-R3-05` [Critical] — Chặn ép hạ HA `< 120 mmHg` trên thai phụ (`pregnant = true`) & chặn kê thuốc mạn tính khi đang sốc tụt HA / cấp cứu K+
- **Giải pháp đã thực hiện:**
  - Tại `ckd.outpatient.bp_target` (`rules.outpatient.ts`): Thêm `if (hasCkdFlag(ctx, 'pregnant')) return false;` (loại trừ thai phụ khỏi mục tiêu hạ áp tích cực `< 120 mmHg` của KDIGO/SPRINT) và xử lý phân tầng huyết động thấp (`sbp < 90`: nhường chỗ cho thẻ `REFER` cấp cứu sốc `hypotension_crisis_refer`; `90 <= sbp < 100`: phát `REDUCE` rà soát giảm thuốc hạ áp, tuyệt đối không báo `"Đạt mục tiêu kiểm soát"`).
  - Hàng rào `isOutpatientAcuteCrisis(ctx)` chặn hoàn toàn việc phát `START`/`UPTITRATE` cho Dapagliflozin, Atorvastatin, Losartan, Finerenone, Semaglutide khi bệnh nhân đang tụt HA (`sbp < 90`), tăng kali đe dọa tính mạng (`k >= 6.0`), toan nặng (`hco3 < 12`), hoặc AKI cấp.
- **Kiểm chứng:** Golden Case `ckd_58_outpatient_hypotension_shock_crisis.json` và Bất biến #1, #16, #17, #18 trong `invariants.test.ts`.

### `CKD-R2-R3-06` [Major] — Kiểm tra `need(ctx, 'egfr')` (Fail-Closed khi thiếu tuổi/giới) & đối chiếu trần liều thận trong `rasi_uptitrate`
- **Giải pháp đã thực hiện:**
  - Tại `ckd.outpatient.rasi_uptitrate`: Bắt buộc kiểm tra `const egfr = need(ctx, 'egfr'); if (egfr === undefined) return false;` (Fail-Closed tuyệt đối khi thiếu `scr`, `age` hoặc `sex`) và đối chiếu trần liều thận qua `getRenalMaxDailyDoseInfo(ctx, rasiId)` (đã giải trình chi tiết tại `CKD-R2-R2-02`).

### `CKD-R2-R3-07` [Major] — Không kê `START Finerenone` trên bệnh nhân HFrEF (`LVEF <= 40%`) khi chạy CKD đơn lẻ hoặc CKD + DM2
- **Giải pháp đã thực hiện:** Đã khắc phục đồng bộ cùng `CKD-R2-R1-05` (`if (lvef !== undefined && lvef <= hfrefMax) return false;` trong `finerenone_indication` + thẻ hướng dẫn ưu tiên MRA steroid `hfref_prefer_steroidal_mra`). Khóa cứng bằng Golden Case `ckd_53` và Bất biến #21 trong `invariants.test.ts`.

### `CKD-R2-R3-08` [Major] — Hòa giải xung đột nhóm thuốc đa module (`merge.resolveClassConflicts`)
- **Giải pháp đã thực hiện:**
  - Xác minh cơ chế hòa giải nhóm thuốc trong `src/engine/merge.ts` & `src/engine/safety/duplicates.ts` (được thực hiện bởi Agent B3 phụ trách Engine) đã ưu tiên giữ hoạt chất bệnh nhân đang dùng hợp lệ trong `currentMeds` (ví dụ `empagliflozin` / Jardiance), triệt tiêu các thẻ `[AVOID] CHỐNG CHỈ ĐỊNH PHỐI HỢP` rác cho thuốc bệnh nhân chưa từng uống, và đồng bộ quy tắc không khởi trị Statin mới trên bệnh nhân đang lọc máu định kỳ.

### `CKD-R2-R3-09` [Major] — Phân nhánh chính xác KDIGO 2024 Rec 3.6.1 / 3.6.2 / 3.6.3 cho CKD không ĐTĐ, không THA có A2 (`UACR 3–30 mg/mmol`)
- **Giải pháp đã thực hiện:**
  - Tại `ckd.outpatient.rasi_initiate` (`src/modules/ckd/rules.outpatient.ts`): Tách bạch chính xác 3 nhóm chỉ định và gắn đúng mã trích dẫn tương ứng:
    1. **Có ĐTĐ kèm A2 hoặc A3 (`UACR >= 3`):** `action: 'START'` – KDIGO 2024 Rec 3.6.3 (1B) (`kdigo.ckd.2024.rec_3_6_3_rasi_dm`).
    2. **Không ĐTĐ có A3 (`UACR >= 30`):** `action: 'START'` – KDIGO 2024 Rec 3.6.1 (1B) (`kdigo.ckd.2024.rec_3_6_1_rasi_a3_nondm`).
    3. **Không ĐTĐ chỉ có A2 (`3 <= UACR < 30`):** Chỉ phát `action: 'START'` (KDIGO 2024 Rec 3.6.2 – 2C, trích dẫn `kdigo.ckd.2024.rec_3_6_2_rasi_a2_nondm`) khi bệnh nhân **có tăng huyết áp** (`hasCondition(ctx, 'htn')` hoặc `SBP >= 130` hoặc `DBP >= 80`); nếu huyết áp bình thường và không có tiền sử THA (`SBP = 118/74 mmHg`), chỉ phát mức **`CONSIDER`** cá thể hóa, tuyệt đối không phát `START` bắt buộc hay gắn nhầm trích dẫn A3.
- **Kiểm chứng:** Unit test hồi quy trực tiếp trong `tests/modules/ckd/invariants.test.ts` (`Non-DM, normotensive (118/74), A2 (UACR 15) -> CONSIDER (Rec 3.6.2 2C), NOT mandatory 1B START`).

### `CKD-R2-R3-10` [Major] — Fail-Closed `statin_indication` khi `egfr === undefined` & bổ sung `missingInputRec` cho `age` / `sex`
- **Giải pháp đã thực hiện:**
  - Tại `ckd.outpatient.statin_indication` (`rules.outpatient.ts`): Bắt buộc kiểm tra `if (egfr === undefined) return false;` — không bao giờ phát `START Atorvastatin` hay gán cứng nhãn `1A (KDIGO 2024 Rec 3.15.1.1)` khi chưa tính được eGFR.
  - Bổ sung 2 quy tắc `ckd.outpatient.missing_age_for_egfr` và `ckd.outpatient.missing_sex_for_egfr` gọi `missingInputRec('ckd', 'age' | 'sex', ...)` khi đã nhập `scr` nhưng khuyết tuổi hoặc giới tính.
  - (Đồng thời tại `src/engine/derive.ts`, Agent B3 đã bổ sung tính `calculateEgfrCys` độc lập khi chỉ nhập `cystatinC` mà chưa có `scr`).
- **Kiểm chứng:** 6,000 ca kiểm thử Fail-Closed xóa ngẫu nhiên `scr, k, sbp, uacr, age, sex` trong `invariants.test.ts` đạt **0 vi phạm**.

### `CKD-R2-R3-11` [Major] — Rà soát lợi tiểu trong AKI nội viện, xử trí tăng Kali nhẹ `5.1–5.9 mmol/L` nội viện & sửa câu cổng ECG
- **Giải pháp đã thực hiện:**
  1. **Rà soát Lợi tiểu trong AKI nội viện:** Bổ sung mảng quy tắc `ckd.inpatient.aki_diuretic_review_<drugId>` trong `src/modules/ckd/rules.inpatient.ts`: Khi bệnh nhân nội viện đang AKI và dùng lợi tiểu quai/thiazide (`furosemide`, `torsemide`, `bumetanide`, `hydrochlorothiazide`, `indapamide`, `chlorthalidone`), nếu không có phù phổi cấp kháng trị (`!refractoryPulmonaryEdema`) mà huyết áp thấp (`SBP < 100`), thiếu dịch/thiểu niệu hoặc dính Bộ ba độc thận -> phát lệnh **`action: 'HOLD'`** (`priority: 99`, chặn đứng lệnh `[CONTINUE]` mù quáng từ module khác); nếu huyết động ổn định -> phát thẻ rà soát thể tích tuần hoàn chặt chẽ.
  2. **Tăng Kali nhẹ–vừa nội viện (`5.0–5.9 mmol/L`):** Bổ sung quy tắc `ckd.inpatient.hyperkalemia_mild` (`5.0 < K+ < 6.0 mmol/L`) hướng dẫn rà soát/giảm liều hoặc tạm hoãn thuốc giữ kali (RASi/MRA), chế độ ăn hạn chế kali, xét nghiệm lại K+ sau 4–6h và cân nhắc chất gắn kali đường uống.
  3. **Sửa câu cổng ECG khi `K+ < 6.5 mmol/L`:** Tại `ckd.inpatient.hyperkalemia_severe_emergency`, tách rõ thông điệp cổng `K+` khi `k >= 6.5` so với khi kích hoạt do `ecgChanges === true` ở `K+ < 6.5` (`"K+ 5.2 mmol/L kèm biến đổi điện tâm đồ cấp tính: Nguy cơ rung thất và vô tâm thu"` — không còn in sai toán học `"5.2 >= 6.5"`).

### `CKD-R2-R3-12` [Major] — Ưu tiên `STOP` > `AVOID` đối với thuốc đang uống (`currentMeds`) & khử cảnh báo tương tác giả
- **Giải pháp đã thực hiện:**
  - Trong `src/modules/ckd/rules.outpatient.ts`: Đặt nhóm quy tắc `ckd.outpatient.pregnancy_stop_<drugId>` (`action: 'STOP'`, `priority: 100`) lên vị trí đầu tiên (Rule 0) để luôn giữ vững hành động `STOP` và ID chuẩn trên mọi thuốc độc phôi thai đang uống.
  - Phối hợp kiểm chứng với `src/engine/merge.ts` & `src/engine/safety/interactions.ts` (Agent B3): `ACTION_PRIORITY['STOP'] (105) > ACTION_PRIORITY['AVOID'] (100)` đã được cập nhật, đảm bảo thuốc trong `currentMeds` luôn mang lệnh `STOP` thay vì bị hạ xuống `AVOID`.

### `CKD-R2-R3-13` [Minor] — Tách thẻ `HOLD` tăng Kali ngoại trú theo từng hoạt chất & loại bỏ thẻ tổng hợp/REFER trùng lặp
- **Giải pháp đã thực hiện:**
  1. Thay quy tắc gộp `hyperkalemia_hold_rasi_mra` bằng mảng quy tắc theo từng hoạt chất `ckd.outpatient.hyperkalemia_hold_<drugId>` (`rules.outpatient.ts`) để mỗi thuốc giữ kali đang uống (`perindopril`, `finerenone`, ...) nhận đúng 1 thẻ `HOLD` mang `drugId` và tên riêng của thuốc đó.
  2. Tách bạch `pregnancy_stop_<drugId>` (cho thuốc đang uống trong `currentMeds`) với thẻ dự phòng `pregnancy_avoid_teratogens` (chỉ sinh ra khi thai phụ **chưa** uống thuốc độc phôi thai nào), triệt tiêu hoàn toàn hiện tượng trùng thẻ.
  3. Loại bỏ thẻ `rec_ckd_outpatient_emergency_refer` bị trùng với `emergency_hyperkalemia_critical` của `redFlags.ts` khi `K+ >= 6.0 mmol/L`.

### `CKD-R2-R3-14` [Minor] — Nhãn `profile === 'US'` cho `bp_target`, giải thích tăng liều RASi vì đạm niệu, và bổ sung `finerenone_continue` + `statin_continue_dialysis`
- **Giải pháp đã thực hiện:**
  1. Tiêu đề `rec_ckd_bp_target` khi `profile === 'US'` hiển thị chuẩn `"Đích huyết áp < 130/80 mmHg (AHA/ACC 2025)"`.
  2. Trong `ckd.outpatient.rasi_uptitrate`: Khi huyết áp bệnh nhân đã đạt mục tiêu kiểm soát nhưng vẫn còn albumin niệu (`UACR >= 3 mg/mmol`), `rationale` giải thích tường minh việc tăng liều RASi đến liều dung nạp tối đa nhằm **giảm đạm niệu và bảo vệ cầu thận độc lập với huyết áp** (kèm theo dõi sát tránh hạ HA tư thế).
  3. Bổ sung 2 quy tắc duy trì mới trong `src/modules/ckd/rules.outpatient.extra.ts`:
     - `ckd.outpatient.finerenone_continue` (`action: 'CONTINUE'` khi đang dùng Finerenone ổn định ở `eGFR >= 15`, chưa lọc máu, `K+ <= 5.5` và đã đạt liều đích hoặc đang giữ liều 10 mg hợp lệ).
     - `ckd.outpatient.statin_continue_dialysis` (`action: 'CONTINUE'` cho bệnh nhân đang dùng sẵn Statin khi bước vào lọc máu định kỳ theo KDIGO 2024 Rec 3.15.3 – Grade 2C).
- **Kiểm chứng:** Golden Case `ckd_59_dialysis_post_hd_egfr_stop_finerenone_continue_statin.json`.

### `CKD-R2-R3-15` [Minor] — Phân tầng ngưỡng truyền dịch dự phòng AKI do thuốc cản quang (`ckd.inpatient.contrast_aki_prevention`)
- **Giải pháp đã thực hiện:**
  - Bổ sung trường `contrastRouteIntraArterial` (Tiêm cản quang đường động mạch / qua thận lần đầu) vào `src/modules/ckd/inputs.ts` và ngưỡng `ckd.contrast.egfr_high_risk_iv = 30`, `ckd.contrast.egfr_moderate_risk_iv = 45` vào `kb/thresholds/ckd.json` kèm trích dẫn `acr_esur.contrast.2024.iv_prophylaxis_egfr30`.
  - Phân tầng trong `ckd.inpatient.contrast_aki_prevention` (`src/modules/ckd/rules.inpatient.ts`):
    - **`action: 'START'` (Truyền NaCl 0.9% dự phòng bắt buộc + tạm ngừng Metformin 48h):** Khi `eGFR < 30` (đường tĩnh mạch), hoặc `eGFR < 45` kèm tiêm cản quang đường động mạch / AKI cấp.
    - **`action: 'CONSIDER'` (Cá thể hóa theo thể tích dịch & yếu tố nguy cơ, tránh quá tải dịch thường quy):** Khi `30 <= eGFR < 45` chụp cản quang đường tĩnh mạch (hoặc `45 <= eGFR < 60` đường động mạch); không còn ra lệnh truyền dịch 24h tràn lan cho mọi ca CT tĩnh mạch ở CKD G3a (`eGFR 45–59`).

### `CKD-R2-R3-16` [Suggestion] — Đọc dự phòng `customInputs.pregnant` / `customInputs.onDialysis`
- **Giải pháp đã thực hiện:**
  - Xây dựng hàm `hasCkdFlag(ctx, key)` trong `src/modules/ckd/helpers.ts` kiểm tra đồng thời `hasCondition(ctx, key) || Boolean(ctx.patient.customInputs?.[key]) || Boolean(ctx.normalized.customInputs?.[key])` và áp dụng xuyên suốt toàn bộ quy tắc CKD cho các cờ sống còn (`pregnant`, `onDialysis`, `breastfeeding`, `priorAngioedema`, `bilateralRenalArteryStenosis`), bảo vệ an toàn tuyệt đối ngay cả khi tích hợp bên ngoài truyền nhầm vào `customInputs`.

### `CKD-R2-R3-17` [Suggestion] — Tinh gọn tiêu đề khuyến cáo (`fmtDose_title_verbosity`)
- **Giải pháp đã thực hiện:**
  - Hàm `fmtShortDose(d, overrideAmount)` trong `src/modules/ckd/helpers.ts` chỉ kết xuất phần định lượng ngắn gọn `${amount} ${unit} x ${frequency} (${route})` cho `title` và `dose`, giữ toàn bộ tiêu đề khuyến cáo CKD ngắn gọn, súc tích (`< 65 ký tự`), trong khi phần giải thích lâm sàng chi tiết được đặt đúng chỗ tại `rationale` và `monitoring`.

---

## 5. Danh mục 12 Golden Cases Hồi quy Mới (`ckd_49` – `ckd_60`)

| Mã Golden Case | Tệp JSON (`tests/golden/ckd/`) | Phát hiện Khóa Hồi quy |
| :--- | :--- | :--- |
| `ckd_49` | `ckd_49_inpatient_mgdl_stable_no_false_aki.json` | `CKD-R2-R1-01` (Nội viện nhập `mg/dL` ổn định -> 0 cảnh báo AKI giả) |
| `ckd_50` | `ckd_50_missing_sbp_fail_closed_no_start.json` | `CKD-R2-R1-02`, `CKD-R2-R3-03` (Thiếu `sbp` -> Fail-Closed `DEFER` + `missingInputRec`) |
| `ckd_51` | `ckd_51_t2d_ckd_glp1ra_fourth_pillar_flow.json` | `CKD-R2-R1-03`, `CKD-R2-R1-12` (Trụ cột thứ 4 Semaglutide SC theo FLOW / ESC 2026) |
| `ckd_52` | `ckd_52_inpatient_k66_medical_first_not_immediate_rrt.json` | `CKD-R2-R1-04`, `CKD-R2-R1-11` (`K+ = 6.6` chưa lọc máu, tiểu bình thường -> Nội khoa 5 bước + SZC trước, RRT dự phòng `CONSIDER`) |
| `ckd_53` | `ckd_53_hfref_ckd_t2d_prefer_steroidal_mra_not_finerenone.json` | `CKD-R2-R1-05`, `CKD-R2-R3-07` (`HFrEF LVEF 30%` -> Không `START` Finerenone, ưu tiên MRA steroid) |
| `ckd_54` | `ckd_54_hfpef_ckd_t2d_finerenone_uptitrate_40mg.json` | `CKD-R2-R1-05`, `CKD-R2-R2-07` (`HFpEF LVEF 52% + eGFR >= 60` đang dùng Finerenone 20 mg -> `UPTITRATE` 40 mg) |
| `ckd_55` | `ckd_55_bp_target_us_profile_isolated_diastolic_htn.json` | `CKD-R2-R1-06`, `CKD-R2-R3-14` (`profile: 'US'`, HA `124/88 mmHg` -> `UPTITRATE` đích `< 130/80 mmHg`) |
| `ckd_56` | `ckd_56_perindopril_g4_renal_ceiling_reduce_not_uptitrate.json` | `CKD-R2-R2-02`, `CKD-R2-R3-06` (Perindopril `2.5 mg/ngày` ở `CrCl 16.5` -> `REDUCE` về `2.5 mg cách ngày`, cấm `UPTITRATE`) |
| `ckd_57` | `ckd_57_cps_hypokalemia_stop_binder.json` | `CKD-R2-R2-03` (Đang uống CPS khi `K+ = 3.6 mmol/L` -> `STOP` khẩn cấp) |
| `ckd_58` | `ckd_58_outpatient_hypotension_shock_crisis.json` | `CKD-R2-R1-02`, `CKD-R2-R3-05` (Ngoại trú sốc `SBP = 78 mmHg` -> `REFER` cấp cứu, 0 `START`/`UPTITRATE`, không báo đạt đích HA) |
| `ckd_59` | `ckd_59_dialysis_post_hd_egfr_stop_finerenone_continue_statin.json` | `CKD-R2-R3-01`, `CKD-R2-R3-14` (`onDialysis = true` có SCr sau lọc -> `STOP` Finerenone + `CONTINUE` Atorvastatin) |
| `ckd_60` | `ckd_60_triple_whammy_indomethacin_torsemide_stop.json` | `CKD-R2-R3-02` (Losartan + Torsemide + Indomethacin -> `STOP` Indomethacin + cảnh báo `ix.triple_whammy`) |

---

## 6. Kết quả Kiểm chứng Tự động (Mandatory Verification Gates)

1. **TypeScript Typecheck (`npx tsc --noEmit`):** **0 lỗi** trên toàn bộ `src/modules/ckd/**` và `tests/modules/ckd/**`.
2. **Unit & Property-Based Invariant Tests (`npx vitest run tests/modules/ckd/`):** **PASS 100%** (10,000 ca bất biến ngẫu nhiên + 6,000 ca Fail-Closed + kiểm thử Matrix/Presets/Pathway + kiểm thử hồi quy Vòng 2).
3. **Golden Suite (`npx vitest run tests/golden/_runner.test.ts -t "ckd"`):** **PASS 100%** (**61/61 Golden Cases**, `162 passed | 0 failed`).
4. **Rules Lint QA-10 (`npx tsx tools/kb/rulesLint.ts`):** **0 errors, 0 warnings** trên toàn bộ `src/modules/ckd/**`.
5. **KB Schema, Citation & Hash Integrity (`npm run verify:kb`):** **PASS (`0 lỗi`, 0 cảnh báo thuộc phạm vi `ckd` và 18 thuốc sở hữu)**.
