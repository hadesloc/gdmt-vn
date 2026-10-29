# Báo Cáo Khắc Phục Toàn Diện Round 4 – Module Bệnh Thận Mạn (`ckd`)

- **Phụ trách khắc phục:** Agent E5 (CKD Remediation Engineer) phối hợp đồng bộ hạ tầng dùng chung từ Agent B5 (`src/engine/**`, `src/ui/**`, `kb/interactions/**`).
- **Ngày hoàn tất:** 28/10/2026
- **Phạm vi bao phủ:** 100% phát hiện từ cả 3 hội đồng phản biện độc lập:
  - `docs/reviews/ckd/round4_R1.json` (`CKD-R4-R1-01` → `CKD-R4-R1-09`: 2 Critical, 4 Major, 2 Minor, 1 Suggestion)
  - `docs/reviews/ckd/round4_R2.json` (`CKD-R4-R2-01` → `CKD-R4-R2-10`: 2 Critical, 5 Major, 2 Minor, 1 Suggestion)
  - `docs/reviews/ckd/round4_R3.json` (`CKD-R4-R3-01` → `CKD-R4-R3-12`: 4 Critical, 6 Major, 2 Minor)
- **Tuân thủ giới hạn dung lượng `< 20 KB` (`< 20,480` bytes):** 100% đạt trên toàn bộ **30 tệp `.ts`** trong `src/modules/ckd/` và **4 tệp `.ts`** trong `tests/modules/ckd/` (khóa cứng bằng kiểm thử tự động trong `tests/modules/ckd/invariants.regressions.test.ts`).

---

## Phần I. Giải Trình Chi Tiết Hội Đồng R1 (`round4_R1.json`)

### 1. `CKD-R4-R1-01` (Critical) — Bỏ qua `med.freq` trong `parseCurrentDailyDoseMg` gây sai tổng liều mg/ngày
- **Nguyên nhân gốc:** `parseCurrentDailyDoseMg` cũ trả thẳng `med.dose` kiểu `number` mà không nhân hệ số tần suất từ `med.freq`, dẫn đến đọc nhầm Captopril `50 mg x 3 lần/ngày` thành `50 mg/ngày`, Valsartan `160 mg x 2 lần/ngày` thành `160 mg/ngày`, Perindopril `2.5 mg cách ngày` thành `2.5 mg/ngày`, và Natri Bicarbonat `1000 mg x 4 lần/ngày` thành `1000 mg/ngày`.
- ** Khắc phục mã nguồn:**
  - `src/modules/ckd/helpers.ts:27-88` (`parseCurrentDailyDoseMg`): Tích hợp trực tiếp với bộ phân tích chuẩn hóa cấp Engine `src/engine/doseParser.ts` (`parseDailyDoseMg`, `parseComponentDailyDoseMg`, `parseFrequencyPerDay`), nhân chính xác tần suất đa lần/ngày (`2–4 lần/ngày`, `BID`/`TID`/`QID`, `q6h`/`q8h`/`q12h`), `cách ngày`/`q48h` (`0.5`), `1 lần/tuần` (`1/7`), `ngày lọc máu`, và bóc tách liều hoạt chất thành phần trong viên phối hợp FDC; trả về `undefined` (Fail-Closed) khi chuỗi tự do không định lượng được (như `'1 viên'`).
  - `src/modules/ckd/helpers.drugs.ts:190-212` (`formatCurrentMedDose`): Giữ nguyên đơn vị và tần suất gốc (`2.5 mg cách ngày`, `50 mg, 3 lần/ngày`) thay vì nối cứng `mg/ngày`.
  - `src/modules/ckd/rules.outpatient.acidosis.ts:182-221` & `src/modules/ckd/rules.outpatient.finerenone.ts:276-310`: Nhận diện chính xác trần `Natri Bicarbonat 4000 mg/ngày` -> `MONITOR` và `RASi` đa liều đạt đích -> mở cổng `START Finerenone` (hoặc `DEFER` Fail-Closed nếu liều không đọc được).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (suite `R4-R1-01 & R2-02`) và Golden Case `tests/golden/ckd/ckd_73_multi_daily_bicarb_qid_and_enalapril_bid_dose_parser.json`.

### 2. `CKD-R4-R1-02` (Critical) — Kích hoạt mù phác đồ hạ kali cấp cứu khi thiếu `K⁺` / `K⁺` bình thường và tiêm Canxi thường quy không có biến đổi ECG
- **Nguyên nhân gốc:** Phép tuyển `(k >= 6.5) || ecgChanges` không chặn cận dưới `K⁺`, vi phạm Fail-Closed khi `k === undefined` hoặc `k <= 5.0` (nguy cơ hạ kali y sinh gây rung thất trên bệnh nhân STEMI tối cấp sóng T cao), đồng thời chỉ định tiêm thường quy Calcium Gluconate ở `K⁺ 6.5–7.0` dù `ecgHyperkalemia === false`.
- **Khắc phục mã nguồn & KB:**
  - `src/modules/ckd/rules.inpatient.hyperkalemia.ts:24-215`:
    1. Bổ sung luật `ckd.inpatient.hyperkalemia_ecg_missing_k` (`rec_ckd_hyperkalemia_ecg_missing_k`, hành động `DEFER`): Khi `ecgChanges === true` nhưng `k === undefined`, yêu cầu xét nghiệm khẩn Kali máu trên máy khí máu tại giường (POC blood gas trong 5 phút theo UKKA 12.1/13.1), tuyệt đối không phát Insulin-Glucose/Salbutamol/SZC mù.
    2. Bổ sung luật `ckd.inpatient.hyperkalemia_ecg_normokalemia_alert` (`rec_ckd_hyperkalemia_ecg_normokalemia_alert`, hành động `MONITOR`): Khi `ecgChanges === true` nhưng `k <= 5.0 mmol/L`, cảnh báo loại trừ nhồi máu cơ tim tối cấp (hyperacute STEMI), thiếu máu cơ tim hoặc hội chứng tái cực sớm; khóa hoàn toàn Insulin/Salbutamol/SZC.
    3. Khóa điều kiện `ckd.inpatient.hyperkalemia_severe` và `hyperkalemia_severe_szc_order` chỉ kích hoạt khi `k !== undefined && (k >= 6.5 || (k > 5.0 && ecgChanges))`.
    4. Phân nhánh Bước 1 (Calcium Gluconate 10% 30 mL): Chỉ tiêm tĩnh mạch ngay khi `ecgChanges === true` (hoặc `profile === 'VN'` và `k > 7.0 mmol/L` theo BYT 2024 Mục 4.9.3.1, kèm lưu ý ngộ độc Digoxin); nếu `ecgChanges === false` ở `K⁺ 6.5–7.0`, hướng dẫn mắc monitor điện tim liên tục và chỉ tiêm ngay khi xuất hiện biến đổi ECG độc tính tim (chuẩn UKKA 2022 Guideline 16.2).
  - `kb/citations/ckd.json` & `kb/thresholds/ckd.json`: Bổ sung trích dẫn nguyên văn `ukka.2022.guideline_12_1_ecg_threshold`, `ukka.2022.guideline_13_1_poc_blood_gas`, `byt.ckd.2024.calcium_k_gt_7` và ngưỡng `ckd.hyperkalemia.vn_calcium_no_ecg_min` (`7.0 mmol/L`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-02 & R3-02`), Golden Cases `ckd_74_inpatient_ecg_hyperkalemia_missing_k_poc_defer.json` và `ckd_75_inpatient_ecg_hyperkalemia_normokalemia_stemi_alert.json`.

### 3. `CKD-R4-R1-03` (Major) — Áp nhầm mục tiêu huyết áp `< 120 mmHg` cho bệnh nhân đang lọc máu chu kỳ ở hồ sơ `INTL` / `US`
- **Nguyên nhân gốc:** Nhánh `if (profile === 'INTL')` chạy trước nhánh kiểm tra `onDialysis`, gán nhầm mục tiêu SPRINT `< 120 mmHg` (vốn loại trừ lọc máu) cho bệnh nhân thận nhân tạo.
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/rules.outpatient.bp.ts:85-122`: Đưa nhánh `if (onDialysis)` lên đầu tiên trước mọi hồ sơ (`INTL`, `US`, `VN`), loại trừ hoàn toàn trích dẫn KDIGO `< 120 mmHg`, hướng dẫn kiểm soát cân nặng khô và HA ngoài buổi lọc cá thể hóa (`< 130–140 / < 80–90 mmHg`, `CONTINUE` khi `< 140/90`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-03`) và Golden Case `ckd_77_hemodialysis_lenient_bp_and_szc_non_dialysis_day_5g.json`.

### 4. `CKD-R4-R1-04` (Major) — Sai liều Lokelma (`sodium_zirconium_cyclosilicate`) trên bệnh nhân thận nhân tạo chu kỳ
- **Nguyên nhân gốc:** Áp chung liều nạp `10 g x 3 lần/ngày` (chứa 2.400 mg Na⁺/ngày) cho cả bệnh nhân chạy thận nhân tạo chu kỳ ngoại trú thay vì phác đồ ngày không lọc máu theo nhãn FDA Lokelma Section 2.2.
- **Khắc phục mã nguồn & KB:**
  - `kb/citations/ckd.json` & `kb/thresholds/ckd.json`: Bổ sung `fda.szc.hemodialysis_dosing` (FDA Lokelma Section 2.2) và các ngưỡng `ckd.k_binder.szc_hd_start_dose_g` (`5 g`), `ckd.k_binder.szc_hd_high_k_start_dose_g` (`10 g`), `ckd.k_binder.szc_hd_max_dose_g` (`15 g`).
  - `kb/drugs/sodium_zirconium_cyclosilicate.json`, `src/modules/ckd/matrix.ts:285-296` & `src/modules/ckd/rules.outpatient.kbinders.ts:84-160`: Khi `onDialysis === true`, chỉ định **5 g uống 1 lần/ngày chỉ vào NGÀY KHÔNG LỌC MÁU** (cân nhắc 10 g x 1 lần/ngày không lọc máu nếu K⁺ trước lọc > 6.5 mmol/L; duy trì 5–15 g ngày không lọc máu; cảnh báo hàm lượng natri ~400 mg Na⁺ mỗi 5 g).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-04`), `invariants.regressions.test.ts` và Golden Case `ckd_77_hemodialysis_lenient_bp_and_szc_non_dialysis_day_5g.json`.

### 5. `CKD-R4-R1-05` (Major) — Khởi trị Finerenone đồng thời khi RASi đang quá liều thận/gan và chưa phân tầng vùng ranh giới `4.8 < K⁺ ≤ 5.0 mmol/L`
- **Nguyên nhân gốc:** Phép so sánh `currentRasiMg < effectiveCeiling` trả `false` khi RASi đang vượt trần thận (`currentRasiMg > renalCeiling`), làm hệ thống tưởng RASi đã ổn định; đồng thời phát `START` cứng ở `K⁺ = 4.9–5.0`.
- **Khắc phục mã nguồn & KB:**
  - `src/modules/ckd/rules.outpatient.finerenone.ts:272-365`:
    1. Bổ sung kiểm tra `isBlockedVnPeri`, `currentRasiMg > renalCeiling.maxDailyMg`, `currentRasiMg > telmiHepMax`, và `hasExcessiveRasiCreatinineRise(ctx)` -> chuyển Finerenone sang `DEFER` (`dose: undefined`) để hiệu chỉnh ổn định RASi và kiểm tra lại K⁺/SCr sau 2–4 tuần trước.
    2. Khi `4.8 < k <= 5.0 mmol/L` (`isBorderlineK`), hạ mức hành động từ `START` xuống `CONSIDER` theo đúng nhãn FDA Kerendia Section 2.2 (`fda.finerenone.borderline_k_4_8_5_0`) & KDIGO 2024 Figure 26, yêu cầu xét nghiệm K⁺ sớm trong vòng 4 tuần đầu.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-05`) và Golden Case `ckd_82_finerenone_borderline_k49_consider_and_telmisartan_hepatic_reduce.json`.

### 6. `CKD-R4-R1-06` (Major) — Kê nhầm Statin, ép HA `< 120` và phát Sick-day trên ca tầm soát G1–G2 A1 bình thường
- **Nguyên nhân gốc:** Thiếu vị từ xác nhận bằng chứng tổn thương thận khi `eGFR ≥ 60 mL/phút/1.73m²` và `UACR < 3 mg/mmol` (hoặc `uacr === undefined` không có chẩn đoán CKD).
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/helpers.conditions.ts:46-75` (`hasConfirmedCkdEvidence`): Chỉ xác nhận CKD khi `eGFR < 60`, `UACR ≥ 3 mg/mmol`, đang lọc máu, ghép thận, đái máu cầu thận, bệnh thận cấu trúc (`ADPKD`, cầu thận, ống kẽ thận), và chặn trường hợp `eGFR ≥ 60` kèm `UACR < 3` (hoặc thiếu `UACR` mà không có `conditions.ckd`).
  - Áp cổng `hasConfirmedCkdEvidence(ctx)` vào `src/modules/ckd/rules.outpatient.statin.ts:66`, `src/modules/ckd/rules.outpatient.bp.ts:26`, và `src/modules/ckd/rules.outpatient.nsaid_sickday.ts:202` (kèm yêu cầu có CKD hoặc đang dùng thuốc nhóm SADMAN).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-06`), `invariants.random.test.ts` và Golden Case `ckd_79_normal_g1a1_screening_no_false_statin_or_bp120.json`.

### 7. `CKD-R4-R1-07` (Minor) — Tích hợp ngưỡng KFRE 2 năm (`> 10%` & `> 40%`) và hướng dẫn bảo tồn tĩnh mạch AVF
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/helpers.conditions.ts:95-115` (`getKfre2y`, `getKfre5y`): Gọi trực tiếp `computeKfre()` tính cả nguy cơ suy thận 2 năm và 5 năm.
  - `src/modules/ckd/rules.outpatient.referral_diagnostics.ts:25-135`: Sử dụng đầy đủ `ckd.kfre.multidisciplinary_2y` (`10%`), `ckd.kfre.krt_prep_2y` (`40%`) và trích dẫn `kdigo.ckd.2024.pp_2_2_3_kfre_krt_prep`, hiển thị rõ `KFRE 2 năm` và hướng dẫn bảo tồn mạng tĩnh mạch chi trên ("save the vein") để lập kế hoạch cầu nối AVF / tư vấn ghép thận đón đầu.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-07`).

### 8. `CKD-R4-R1-08` (Minor) — Làm sạch trường `cor` / `loe` sai lệch trên Practice Points, bảng phân độ và khuyến cáo `(Not Graded)`
- **Khắc phục KB:**
  - `kb/citations/ckd.json`: Đã rà soát toàn bộ và lược bỏ `cor`/`loe` trên `kdigo.aki.2012.rec_5_1_1_rrt_emergently` (`Not Graded`), các bảng phân giai đoạn (`table_2_gfr_categories`, `table_3_albuminuria_categories`), đoạn mô tả bệnh học và toàn bộ KDIGO 2024 Practice Points (`pp_*`), chỉ giữ `cor`/`loe` cho các khuyến cáo thực sự có phân hạng GRADE/ESC/AHA/ADA. Đồng bộ 100% hash trong `kb/review/ckd.*.json`.
- **Kiểm thử xác minh:** `npm run verify:kb` (`0` lỗi, `0` cảnh báo).

### 9. `CKD-R4-R1-09` (Suggestion) — Hiển thị đơn vị/tần suất trên danh sách thuốc UI & bổ sung phối hợp `Statin + Ezetimibe` ở G3a–G5
- **Khắc phục mã nguồn:**
  - `src/ui/PatientForm.tsx` (đồng bộ bởi Agent B5): Hiển thị đầy đủ đơn vị và tần suất thuốc đang dùng.
  - `src/modules/ckd/rules.outpatient.statin.ts:304-316`: Cập nhật `rationale` ở nhóm `G3a–G5 (eGFR < 60)` ≥ 50 tuổi nêu rõ chiến lược điều trị bằng **statin hoặc phối hợp statin + ezetimibe** (ví dụ Atorvastatin 20 mg ± Ezetimibe 10 mg) theo đúng nguyên văn KDIGO 2024 Rec 3.15.1.1 (1A) & ESC 2026 CVD-CKD.

---

## Phần II. Giải Trình Chi Tiết Hội Đồng R2 (`round4_R2.json`)

### 10. `CKD-R4-R2-01` (Critical) — Phân rã viên phối hợp liều cố định (FDC) ở toàn bộ các cổng an toàn thận, thai kỳ, AKI, K⁺ và tránh kê chồng
- **Khắc phục mã nguồn:**
  - Tích hợp bản đồ phân rã `src/engine/safety/fdcMap.ts` (Agent B5) vào `src/modules/ckd/helpers.drugs.ts:62-182` (`getMedComponents`, `hasMetforminComponent`, `extractSglt2iComponentId`, `extractRasiComponentId`, `extractStatinComponentId`, `isSglt2iMed`, `isRasiOrArniMed`, `isDiureticMed`, `isStatinMed`).
  - `src/modules/ckd/rules.outpatient.safety_extra.ts:24-152`: Phát y lệnh `[STOP]` cho viên phối hợp chứa `Metformin` khi `eGFR < 30` hoặc lọc máu (chống MALA) và cảnh báo `[REDUCE]` tối đa `≤ 1000 mg Metformin/ngày` khi `eGFR 30–44`.
  - `src/modules/ckd/rules.outpatient.sglt2i.ts:45-120`: Khi bệnh nhân `CKD G4` đang dùng `empagliflozin_metformin` / `dapagliflozin_metformin`, phát đồng thời `[STOP]` viên FDC chứa Metformin và cầu nối `[START]` SGLT2i đơn chất (`empagliflozin` / `dapagliflozin`) — không bao giờ phát `[CONTINUE]` viên FDC chứa Metformin ở `eGFR < 30`.
  - Mở rộng quét thành phần FDC cho thai kỳ (`rules.outpatient.safety.ts`), AKI (`rules.inpatient.aki.ts` & `rules.outpatient.safety.ts`), tăng kali máu và phối hợp kép hệ RAA (`rules.outpatient.rasi_safety.ts`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R2-01`) và Golden Case `ckd_80_fdc_empagliflozin_metformin_g4_stop_and_single_sglt2_bridge.json`.

### 11. `CKD-R4-R2-02` (Critical) — Khắc phục triệt để `parseCurrentDailyDoseMg` & `formatCurrentMedDose` cho thuốc đa liều/cách ngày
- **Khắc phục mã nguồn:** Giải quyết đồng bộ cùng `CKD-R4-R1-01` tại `src/modules/ckd/helpers.ts:27-88` và `src/modules/ckd/helpers.drugs.ts:190-212`. Đã kiểm chứng toàn bộ các ca Captopril TID ở G4/G5, Enalapril BID trên lọc máu, Valsartan 160 mg BID, Perindopril 2.5 mg cách ngày và Natri Bicarbonat 1000 mg QID.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` và Golden Case `ckd_73_multi_daily_bicarb_qid_and_enalapril_bid_dose_parser.json`.

### 12. `CKD-R4-R2-03` (Major) — Bổ sung cổng an toàn Phụ nữ đang cho con bú (`breastfeeding` / `lactation`)
- **Khắc phục mã nguồn & KB:**
  - Tích hợp `src/engine/safety/lactationAndAllergyGates.ts` vào `src/modules/ckd/helpers.conditions.ts:171-180` (`isBreastfeedingCkd`, `isCkdLactationUnsafe`).
  - `src/modules/ckd/rules.outpatient.safety_extra.ts:154-230`: Phát `[STOP]` cho các thuốc chống chỉ định/tránh dùng khi đang cho con bú trong `currentMeds` (`Statin`, `SGLT2i`, `Finerenone`, `ARB`, `Semaglutide`).
  - `src/modules/ckd/rules.outpatient.sglt2i.ts`, `finerenone.ts`, `glp1ra.ts`, `statin.ts`: Chuyển khởi trị sang `[AVOID]` (`dose: undefined`) khi `isBreastfeedingCkd(ctx) === true`.
  - `src/modules/ckd/rules.outpatient.rasi.ts:145-190`: Khi phụ nữ cho con bú có chỉ định ức chế hệ RAA bảo vệ thận/hạ áp, tự động ưu tiên khởi trị **Enalapril** (hoặc Captopril — tiết qua sữa mẹ cực thấp, tương thích cho trẻ đủ tháng bú mẹ) thay vì ARB.
  - `kb/citations/ckd.json` & `kb/drugs/*.json`: Bổ sung các trích dẫn nguyên văn Section 8.2 Lactation (`fda.losartan.lactation`, `fda.enalapril.lactation`, `fda.dapagliflozin.lactation`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R2-03`) và Golden Case `ckd_81_breastfeeding_ckd_enalapril_safe_and_avoid_sglt2i_statin.json`.

### 13. `CKD-R4-R2-04` (Major) — Kiểm soát toàn diện Dị ứng thuốc (`allergyAceiArb` trên thuốc đang dùng & dị ứng hoạt chất/nhóm đặc hiệu)
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/helpers.conditions.ts:182-201` (`hasCkdDrugAllergy`): Kết hợp `evaluateAllergySafety` của Engine với kiểm tra `patient.allergies`, `customInputs.allergies` và `conditions.allergy_<drug/class>`.
  - `src/modules/ckd/rules.outpatient.safety_extra.ts:232-320`: Phát `[STOP]` ngay lập tức khi bệnh nhân có `allergyAceiArb = true` đang dùng ACEi/ARB/ARNI, khi có `priorAngioedema = true` đang dùng ACEi/ARNI, hoặc khi đang dùng bất kỳ hoạt chất nào trùng khớp tiền sử dị ứng/phản vệ.
  - `src/modules/ckd/rules.outpatient.rasi.ts:82-144` & `finerenone.ts:82-87`: Gán `drugId` đại diện trên thẻ `[AVOID]` để khóa nhóm xung đột đa module, tách bạch `priorAngioedema` (cấm tuyệt đối ACEi/ARNI; cho phép cân nhắc thận trọng ARB kèm giám sát) với `allergyAceiArb`, và không yêu cầu chuẩn độ RASi trước Finerenone nếu bệnh nhân chống chỉ định với RASi.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R2-04`).

### 14. `CKD-R4-R2-05` (Major) — Chuẩn hóa dược động học suy gan Child-Pugh A/B/C cho `Candesartan`, `Telmisartan` và `Empagliflozin`
- **Khắc phục mã nguồn & KB:**
  - `kb/drugs/telmisartan.json` & `kb/drugs/candesartan.json` + `kb/citations/ckd.json`: Đổi `telmisartan.hepatic.status` sang `'caution'` (chỉ chống chỉ định ở suy gan nặng `Child-Pugh C` hoặc tắc mật; ở `Child-Pugh A/B` dùng tối đa `≤ 40 mg/ngày`); cập nhật trích dẫn nguyên văn `fda.candesartan.hepatic_impairment` cho `candesartan.json`.
  - `src/modules/ckd/rules.outpatient.rasi_safety.ts:40-159`:
    1. Phát `[STOP]` ở `Child-Pugh C` cho cả `Telmisartan`, `Candesartan` và `Sacubitril/Valsartan` (không phát `[STOP]` nhầm cho `Empagliflozin` hay `Telmisartan ≤ 40 mg` ở `Child-Pugh B`).
    2. Phát `[REDUCE]` về `≤ 40 mg/ngày` khi dùng `Telmisartan > 40 mg/ngày` ở `Child-Pugh A/B`, và nhận diện `40 mg/ngày` đã đạt trần gan trong `finerenone.ts:278-298`.
  - `src/modules/ckd/rules.outpatient.rasi.ts:210-235`: Hỗ trợ giảm liều khởi đầu cho cả `Losartan` (`25 mg/ngày`) và `Candesartan` (`8 mg/ngày`) ở suy gan nhẹ–vừa.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R2-05`) và Golden Case `ckd_82_finerenone_borderline_k49_consider_and_telmisartan_hepatic_reduce.json`.

### 15. `CKD-R4-R2-06` (Major) — Chặn kê Statin khi đang dùng `Gemfibrozil`/`Cyclosporine`, chặn `CPS` khi tắc ruột/tăng canxi máu & phát thẻ `[HOLD] Metformin` trước cản quang
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/rules.outpatient.statin.ts:175-215`: Khi bệnh nhân đang dùng `Gemfibrozil` (hoặc `Cyclosporine` liều ức chế miễn dịch mạnh), chuyển khởi trị Statin sang `[AVOID]` (`dose: undefined`) tránh mâu thuẫn với cảnh báo tương tác đỏ `ix.statin_gemfibrozil`.
  - `src/modules/ckd/rules.outpatient.kbinders.ts:62-118` & `rules.inpatient.hyperkalemia_moderate.ts`: Kiểm tra `hasCpsContraindication(ctx)` (`bowelObstruction`, `obstructiveBowelDisease`, `ileus`, `hypercalcemia`) — cấm kê `Calcium Polystyrene Sulfonate` và tự động chuyển hướng sang `SZC` (hoặc cảnh báo `[AVOID]` nếu tắc ruột cấp).
  - `src/modules/ckd/rules.inpatient.rrt_contrast.ts:128-283`: Mở rộng điều kiện `when` cho cả `contrastRouteIntraArterial === true` (bất kể eGFR) và bổ sung cụm luật `ckd.contrast_hold_metformin_*` phát thẻ `[HOLD]` độc lập (`priority: 96`, `dose: undefined`) cho `Metformin` và mọi viên phối hợp chứa `Metformin` theo nhãn FDA Glucophage (`fda.metformin.contrast_discontinue`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R2-06`) và Golden Case `ckd_84_outpatient_contrast_hold_fdc_metformin_and_ci_aki_bundle.json`.

### 16. `CKD-R4-R2-07` (Major) — Chuẩn hóa ngưỡng khởi trị mới `eGFR ≥ 30` của `Canagliflozin` theo nhãn FDA Invokana Bảng 1
- **Khắc phục mã nguồn & KB:**
  - `kb/citations/ckd.json` & `kb/drugs/canagliflozin.json`: Bổ sung trích dẫn nguyên văn `fda.canagliflozin.table_1_renal_impairment` (FDA Invokana Section 2.3 Table 1), tách rõ dải `eGFR 30–<60` (`initiate: "rec"`, tối đa `100 mg/ngày`), `eGFR 20–<30` (`initiate: "not_rec"` trên nhãn FDA — ưu tiên Dapagliflozin/Empagliflozin để khởi trị mới; `continue: "rec"` `100 mg/ngày` nếu đã dùng ở ĐTĐ2 có albumin niệu `> 300 mg/ngày`), và cập nhật `gate_cana_egfr_min` (`threshold: 30`).
  - `src/modules/ckd/matrix.ts:44-66`: Cập nhật ô `g4` của `canagliflozin` phản ánh trung thực sự khác biệt giữa nhãn FDA Invokana (`không khởi trị mới < 30`) và nhóm Dapagliflozin/Empagliflozin (`khởi trị đến eGFR ≥ 20`).
- **Kiểm thử xác minh:** `npm run verify:kb` và `tests/modules/ckd/invariants.regressions.test.ts`.

### 17. `CKD-R4-R2-08` (Minor) — Xóa triệt để huy hiệu liều (`dose: undefined`) và sửa tiêu đề ngược nghĩa trên thẻ `AVOID` / `STOP` / `HOLD` / `DEFER` / `REFER`
- **Khắc phục mã nguồn:**
  - Rà soát toàn bộ 30 tệp trong `src/modules/ckd/` (đặc biệt `rules.outpatient.finerenone.ts:326-380`, `sglt2i.ts`, `rasi.ts`, `glp1ra.ts`, `statin.ts`, `safety.ts`), đặt `dose: canStart ? startDose : undefined` và cập nhật `title` theo đúng lý do tạm hoãn (`Tạm hoãn khởi trị Finerenone: Kiểm soát Kali máu <= 5.0 mmol/L trước...`), đồng bộ với `gates.ts` / `merge.ts` của Engine.
- **Kiểm thử xác minh:** Bất biến số 23 trong `tests/modules/ckd/invariants.random.test.ts:311-314` khóa cứng `r.dose === undefined` cho mọi hành động `STOP`/`AVOID`/`HOLD`/`DEFER`/`REFER` trên **10.000 ca ngẫu nhiên** (`0` vi phạm).

### 18. `CKD-R4-R2-09` (Minor) — Khắc phục gán nhầm trích dẫn suy gan / cho con bú trên các thuốc ARB và làm sạch `quoteVi` Bảng 12 BYT 2024
- **Khắc phục KB:**
  - `kb/citations/ckd.json`: Xóa nội dung diễn giải suy gan/tắc mật ngoài văn bản gốc khỏi `quoteVi` của `byt.ckd.2024.table_12_telmisartan_valsartan`; bổ sung `fda.candesartan.hepatic_impairment` (từ `FDA_label_candesartan.pdf` Section 2.1) và `fda.losartan.lactation` (từ `FDA_label_losartan.pdf` Section 8.2).
  - `kb/drugs/candesartan.json`, `losartan.json`, `valsartan.json`, `telmisartan.json`, `irbesartan.json`: Gắn đúng `fda.candesartan.hepatic_impairment` cho mục suy gan của Candesartan và `fda.losartan.lactation` cho mục `lactation` của nhóm ARB (không còn dẫn nhầm `fda.losartan.boxed_pregnancy`).
- **Kiểm thử xác minh:** `npm run verify:kb` (`0` lỗi, `0` cảnh báo).

### 19. `CKD-R4-R2-10` (Suggestion) — Tách ghi chú lọc máu riêng cho nhóm ARB vs ACEi trong `ckdMatrix` & khử trùng lặp cảnh báo tương tác giữ Kali
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/matrix.ts:126-152`: Tách riêng ghi chú cột `dialysis` cho 5 thuốc **ARB** (`Không đào thải qua màng lọc thận nhân tạo nên không cần uống bù sau buổi lọc; theo dõi sát huyết áp và kali máu trước lọc`) và 5 thuốc **ACEi** (`Uống sau buổi chạy thận nhân tạo đối với các ACEi thải qua màng lọc như Enalapril, Lisinopril, Perindopril, Captopril`).
  - `kb/interactions/cardiovascular.json` (đồng bộ bởi Agent B5): Khử trùng lặp giữa `ix.rasi_mra_potassium_sparing` và `ix.finerenone_k_sparing_diuretics`.

---

## Phần III. Giải Trình Chi Tiết Hội Đồng R3 (`round4_R3.json`)

### 20. `CKD-R4-R3-01` (Critical) — Lấp toàn bộ khoảng trống an toàn Toan chuyển hóa nặng (`HCO₃⁻ < 12 mmol/L` & nội viện `HCO₃⁻ 8.0–17.9 mmol/L`)
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/rules.outpatient.acidosis.ts:82-158`: Bổ sung cụm luật `ckd.acidosis.severe_hold_med_*` (`setting: 'both'`, `priority: 98`) tự động phát lệnh `[HOLD]` khẩn cấp cho mọi thuốc **SGLT2i** và **Metformin** (bao gồm cả viên phối hợp FDC) ngay khi `HCO₃⁻ < 12 mmol/L` hoặc nghi ngờ DKA (`isDkaSuspected`), ngăn chặn tuyệt đối `[CONTINUE]` thuốc gây euDKA / MALA; đồng bộ với `isOutpatientAcuteCrisis` toàn cục của Engine (Agent B5).
  - `src/modules/ckd/rules.inpatient.acidosis.ts:18-146`: Bổ sung tệp luật mới `ckd.inpatient.metabolic_acidosis` xử trí trọn vẹn dải `HCO₃⁻ < 18 mmol/L` nội viện: phân tầng `HCO₃⁻ < 12 mmol/L` (`START` đánh giá bù Natri Bicarbonat đẳng trương tĩnh mạch khi `HCO₃⁻ ≤ 10 mmol/L` theo BYT 2024 Mục 4.10.3.1, làm khí máu động mạch, khoảng trống anion, lactat/ceton) và `12 ≤ HCO₃⁻ < 18 mmol/L` (`CONSIDER`/`MONITOR` bù kiềm theo thể tích tuần hoàn).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R3-01`).

### 21. `CKD-R4-R3-02` (Critical) — Xử trí cấp cứu ngoại trú khi Tăng kali máu (`K⁺ 5.1–5.9 mmol/L`) kèm biến đổi điện tâm đồ (`ecgHyperkalemia = true`)
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/helpers.conditions.ts:203-245` (`hasHyperkalemicEcg`, `isOutpatientAcuteCrisis`): Nhận diện `hasHyperkalemicEcg(ctx) && (k === undefined || k > 5.0)` là tình trạng cấp cứu ngoại trú.
  - `src/modules/ckd/rules.outpatient.safety.ts:120-260`: Mở rộng `ckd.outpatient.hyperkalemia_emergency_refer` phát thẻ `[REFER]` cấp cứu nội viện khẩn cấp để tiêm IV Calcium Gluconate bảo vệ cơ tim ngay khi `k >= 6.0` HOẶC `(k > 5.0 && hasHyperkalemicEcg(ctx))`; đồng thời mở rộng `ckd.outpatient.hyperkalemia_hold_*` phát lệnh `[HOLD]` toàn bộ thuốc giữ kali (RASi, ARNI, Finerenone, sMRA, lợi tiểu giữ K⁺), khóa `[CONTINUE]` Finerenone (`finerenone_safety.ts`) và chặn kê K-binder ngoại trú (`kbinders.ts`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-02`) và Golden Case `ckd_76_outpatient_k54_ecg_changes_emergency_refer_and_hold_rasi.json`.

### 22. `CKD-R4-R3-03` (Critical) — Phân rã FDC trong suy thận nặng, lọc máu, AKI và tăng kali máu
- **Khắc phục mã nguồn:** Giải quyết triệt để cùng `CKD-R4-R2-01` thông qua `fdcMap.ts`, `helpers.drugs.ts`, `rules.outpatient.safety_extra.ts`, `rules.outpatient.sglt2i.ts`, `rules.outpatient.safety.ts`, `rules.outpatient.rasi_safety.ts` và `rules.inpatient.aki.ts`.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` và Golden Case `ckd_80_fdc_empagliflozin_metformin_g4_stop_and_single_sglt2_bridge.json`.

### 23. `CKD-R4-R3-04` (Critical) — Chống chỉ định `allergyAceiArb`, suy tuyến thượng thận (`adrenalInsufficiency`) với Finerenone, và tiếng thổi / hẹp động mạch thận (`renalBruit`)
- **Khắc phục mã nguồn & KB:**
  - `allergyAceiArb` & `priorAngioedema`: Đã xử lý đầy đủ cả chiều `[STOP]` thuốc đang dùng (`safety_extra.ts`), `[AVOID]` có `drugId` đại diện khóa nhóm xung đột (`rasi.ts`), và mở cổng Finerenone không bắt chuẩn độ RASi (`finerenone.ts`).
  - **Suy tuyến thượng thận (`adrenalInsufficiency` / Bệnh Addison):** Khai báo trường đầu vào trong `src/modules/ckd/inputs.ts`, phát `[STOP]` khi đang dùng Finerenone (`src/modules/ckd/rules.outpatient.finerenone_safety.ts:35-82`) và `[AVOID]` khi chưa dùng (`src/modules/ckd/rules.outpatient.finerenone.ts:137-160`) theo FDA Kerendia Section 4 (`fda.finerenone.contraindications`).
  - **Hẹp động mạch thận / Tiếng thổi ĐM thận (`bilateralRenalArteryStenosis` / `renalBruit`):** Phát `[STOP]` RASi nếu đang dùng trên nền hẹp ĐM thận hai bên xác định (`rules.outpatient.rasi_safety.ts:161-210`), `[AVOID]` khởi trị RASi nếu hẹp ĐM thận hai bên xác định, và `[DEFER]` yêu cầu siêu âm Doppler ĐM thận loại trừ hẹp khít hai bên / thận độc nhất khi có `renalBruit = true` (`rules.outpatient.rasi.ts:112-144`, trích dẫn `byt.ckd.2024.renal_artery_stenosis_contra`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R4-R1-05` & `R3-04`).

### 24. `CKD-R4-R3-05` (Major) — Bổ sung chất ức chế trực tiếp Renin (`Aliskiren`) vào quy tắc cấm phong bế kép hệ RAA
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/helpers.drugs.ts:30, 148-154` (`DRI_SET`, `isDriMed`): Nhận diện `aliskiren` và nhóm `DRI` / `renin_inhibitor`.
  - `src/modules/ckd/rules.outpatient.rasi_safety.ts:212-268`, `rasi.ts` & `rasi_titration.ts`: Khi dùng đồng thời `Aliskiren` với `ACEi`/`ARB`/`ARNI` (hoặc dùng `Aliskiren` trên nền ĐTĐ/eGFR < 60), phát lệnh `[STOP] Aliskiren` (`priority: 105`, trích dẫn `kdigo.ckd.2024.rec_3_6_4_avoid_dual_rasi`) và khóa hoàn toàn `[UPTITRATE]` RASi.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts`.

### 25. `CKD-R4-R3-06` (Major) — Thi hành ngưỡng an toàn tăng Creatinin huyết thanh `> 30%` sau dùng RASi
- **Khắc phục mã nguồn & KB:**
  - `kb/citations/ckd.json`: Bổ sung trích dẫn nguyên văn `kdigo.ckd.2024.fig_24_creatinine_rise_30pct` (KDIGO 2024 Figure 24 / PP 3.6.3).
  - `src/modules/ckd/helpers.conditions.ts:80-93` (`getScrRisePct`, `hasExcessiveRasiCreatinineRise`): Tính chính xác `((scr - baseScr) / baseScr) * 100 > thFor('percentage', 'ckd.rasi.creatinine_rise_max_pct')` (`30%`) ngay cả khi mức tăng tuyệt đối `< 26.5 µmol/L` và tỷ lệ `< 1.5x` (chưa chạm ngưỡng AKI).
  - `src/modules/ckd/rules.outpatient.rasi_safety.ts:212-268`, `rasi_titration.ts:53`, `finerenone.ts:266` & `finerenone_titration.ts`: Phát thẻ `[HOLD]` RASi hướng dẫn đánh giá giảm thể tích, ngừng NSAID/giảm lợi tiểu, tầm soát hẹp ĐM thận; khóa tuyệt đối `[UPTITRATE]` RASi và chuyển Finerenone sang `[DEFER]`.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-06`) và Golden Case `ckd_83_scr_rise_gt30_hold_rasi_defer_finerenone_and_rosuvastatin_g4_cap.json`.

### 26. `CKD-R4-R3-07` (Major) — Áp trần liều thận `Rosuvastatin ≤ 10 mg/ngày` ở `CKD G4–G5` và trên bệnh nhân lọc máu chu kỳ
- **Khắc phục mã nguồn & KB:**
  - `kb/citations/ckd.json` & `kb/thresholds/ckd.json`: Bổ sung `fda.rosuvastatin.severe_ckd_max_10mg` và các ngưỡng `ckd.statin.rosuvastatin_severe_ckd_egfr_cutoff` (`30`), `ckd.statin.rosuvastatin_severe_ckd_crcl_cutoff` (`30`), `ckd.statin.rosuvastatin_severe_ckd_max_dose` (`10 mg`).
  - `src/modules/ckd/rules.outpatient.statin.ts:35-53, 355-465`: Bổ sung luật `ckd.outpatient.statin_renal_dose_cap` phát lệnh `[REDUCE]` về `tối đa 10 mg x 1 lần/ngày` (hoặc cân nhắc chuyển sang Atorvastatin) khi bệnh nhân có `eGFR < 30`, `CrCl < 30` hoặc `onDialysis === true` đang dùng `Rosuvastatin > 10 mg/ngày` (`20 mg` hoặc `40 mg`); đồng thời chặn `statin_continue_dialysis` không bao giờ phát `[CONTINUE]` liều vượt trần thận.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-07`).

### 27. `CKD-R4-R3-08` (Major) — Mục tiêu huyết áp nới lỏng cho người suy yếu / hạ HA tư thế / `≥ 85 tuổi` & sửa `Telmisartan` ở `Child-Pugh B`
- **Khắc phục mã nguồn & KB:**
  - `kb/citations/ckd.json` & `kb/thresholds/ckd.json`: Bổ sung `kdigo.ckd.2024.pp_3_4_1_bp_frailty_orthostatic`, `esc.htn.2024.lenient_bp_frailty_age85`, `esc.htn.2024.lenient_bp_140_90` và ngưỡng `ckd.bp.lenient_target_sbp_max` (`140`), `ckd.bp.lenient_target_dbp_max` (`90`), `ckd.bp.very_old_age_min` (`85`).
  - `src/modules/ckd/rules.outpatient.bp.ts:124-160` & `rasi_titration.ts:55`: Khi có `frailty`, `orthostaticHypotension`, `limitedLifespan` hoặc `age >= 85`, áp mục tiêu nới lỏng `< 140/90 mmHg` (`CONTINUE` khi đạt, không ép `< 120 mmHg`) và chặn chuẩn độ tăng liều RASi khi đang có hạ huyết áp tư thế.
  - Phần `Telmisartan` ở `Child-Pugh B`: Đã giải quyết đồng bộ cùng `CKD-R4-R2-05`.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-08`) và Golden Cases `ckd_78_frail_88yo_lenient_bp_target_continue.json`, `ckd_82_finerenone_borderline_k49_consider_and_telmisartan_hepatic_reduce.json`.

### 28. `CKD-R4-R3-09` (Major) — Thực thi cổng an toàn Cho con bú (`DrugEntry.lactation`) và tách checkbox Mang thai / Cho con bú trên UI
- **Khắc phục mã nguồn:** Giải quyết đồng bộ cùng `CKD-R4-R2-03` tại `src/modules/ckd/**`, `src/engine/safety/lactationAndAllergyGates.ts` và `src/ui/PatientForm.tsx` (tách riêng 2 ô chọn độc lập `Đang mang thai` và `Đang cho con bú`).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` và Golden Case `ckd_81_breastfeeding_ckd_enalapril_safe_and_avoid_sglt2i_statin.json`.

### 29. `CKD-R4-R3-10` (Major) — Mở rộng dự phòng bệnh thận do thuốc cản quang (`CI-AKI`) sang ngoại trú, `HOLD Metformin` và `DEFER` khởi trị mới SGLT2i/RASi/Finerenone quanh thủ thuật
- **Khắc phục mã nguồn:**
  - `src/modules/ckd/rules.inpatient.rrt_contrast.ts:128-283`: Chuyển `ckd.inpatient.contrast_aki_prevention` sang `setting: 'both'` và bổ sung cụm luật `ckd.contrast_hold_metformin_*` (`setting: 'both'`) phát lệnh `[HOLD]` Metformin/FDC trước cản quang.
  - `src/modules/ckd/rules.outpatient.sglt2i.ts`, `rasi.ts` & `finerenone.ts`: Khi `contrastPlanned === true` kèm `contrastRouteIntraArterial === true` hoặc `eGFR < 45` (`ckd.contrast.defer_gdmt_egfr_cutoff`), tự động chuyển khởi trị mới SGLT2i / RASi / Finerenone sang `[DEFER]` (`dose: undefined`) để thực hiện sau thủ thuật 48–72 giờ khi chức năng thận ổn định.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-10`) và Golden Case `ckd_84_outpatient_contrast_hold_fdc_metformin_and_ci_aki_bundle.json`.

### 30. `CKD-R4-R3-11` (Minor) — Bổ sung tiêu chí nguy cơ biến cố mạch vành 10 năm `> 10%` và bệnh nhân ghép thận vào quy tắc Statin người trẻ `18–49 tuổi`
- **Khắc phục mã nguồn & KB:**
  - `kb/citations/ckd.json` & `kb/thresholds/ckd.json`: Bổ sung `kdigo.ckd.2024.rec_3_15_1_3_statin_10pct_risk`, `esc.2026.ckd.table_10_statin_transplant` và ngưỡng `ckd.statin.young_cv_risk_10y_min` (`10%`), `ckd.statin.adult_age_min` (`18`).
  - `src/modules/ckd/inputs.ts` & `src/modules/ckd/rules.outpatient.statin.ts:28-33, 73-89, 270-335`: Đọc `derived.cvRisk10y` / `customInputs.statin10yCvRiskPct` / `score2RiskPct` (`> 10%` -> `START` Statin theo KDIGO 2024 Rec 3.15.1.3) và `kidneyTransplant` (`CONSIDER` Statin liều thấp kèm cảnh báo tương tác Cyclosporine/Tacrolimus theo ESC 2026 Bảng 10).
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-11`).

### 31. `CKD-R4-R3-12` (Minor) — Đồng bộ liều khởi đầu `Candesartan` ở suy gan nhẹ–vừa và cảnh báo theo dõi `K⁺` khi phối hợp `Finerenone` với chất ức chế CYP3A4 vừa
- **Khắc phục mã nguồn & KB:**
  - `src/modules/ckd/rules.outpatient.rasi.ts:210-235` & `docs/modules/CKD.md`: Đồng bộ hướng dẫn giảm liều khởi đầu `Candesartan` (`8 mg x 1 lần/ngày`) và `Losartan` (`25 mg x 1 lần/ngày`) ở suy gan nhẹ–trung bình (`Child-Pugh A/B`).
  - `kb/citations/ckd.json`: Bổ sung trích dẫn nguyên văn `fda.finerenone.moderate_cyp3a4_monitoring` (FDA Kerendia Section 7.1).
  - `src/modules/ckd/rules.outpatient.finerenone.ts:340-415` & `src/modules/ckd/rules.outpatient.finerenone_titration.ts:105-165`: Khi phát hiện đang dùng kèm chất ức chế CYP3A4 trung bình/yếu (`Diltiazem`, `Verapamil`, `Erythromycin`, `Fluconazole`, `Amiodarone`), đính kèm cảnh báo trực tiếp vào `rationale` và `warnings` của cả thẻ khởi trị lẫn thẻ tăng liều `UPTITRATE` Finerenone yêu cầu kiểm tra sát Kali máu trong vòng 4 tuần.
- **Kiểm thử xác minh:** `tests/modules/ckd/invariants.round4.test.ts` (`R3-12`) và Golden Case `ckd_82_finerenone_borderline_k49_consider_and_telmisartan_hepatic_reduce.json`.

---

## Phần IV. Kết Quả Cổng Kiểm Định Bắt Buộc

1. **Giới hạn dung lượng tệp (`< 20,480` bytes):** `0` tệp vượt ngưỡng trên toàn bộ 30 tệp `src/modules/ckd/*.ts` và 4 tệp `tests/modules/ckd/*.ts`.
2. **TypeScript (`npx tsc --noEmit`):** `0` lỗi trong `src/modules/ckd/**` và `tests/modules/ckd/**`.
3. **Kiểm định Tri thức & Trích dẫn (`npm run verify:kb`):** `ckd | files: 30 | err: 0 | qaOk: 71 | litWarn: 0` (`0` lỗi, `0` cảnh báo).
4. **Kiểm thử Đơn vị, Bất biến Ngẫu nhiên & Golden Cases (`vitest`):**
   - `tests/modules/ckd/invariants.round4.test.ts`: **PASS 100%**
   - `tests/modules/ckd/invariants.regressions.test.ts`: **PASS 100%**
   - `tests/modules/ckd/invariants.random.test.ts`: **PASS 100%** (`0` vi phạm / `10.000` ca ngẫu nhiên, 23 bất biến)
   - `tests/modules/ckd/invariants.failclosed.test.ts`: **PASS 100%** (`0` vi phạm / `6.000` ca thiếu đầu vào)
   - `tests/golden/_runner.test.ts` (`ckd_01` .. `ckd_84` + `sample`): **PASS 100% (`85/85` ca chuẩn)**
