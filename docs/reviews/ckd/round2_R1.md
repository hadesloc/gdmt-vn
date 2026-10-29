# Báo Cáo Kiểm Định Độc Lập Vòng 2 – Reviewer R1 (Chuyên Gia Thận Học & Guideline Checker)
## Module Bệnh Thận Mạn (`ckd`) – Hệ Thống GDMT-VN

- **Vai trò**: Reviewer R1 – Chuyên gia Thận học & Kiểm định Guideline Độc lập (Vòng 2)
- **Ngày kiểm định**: 27/10/2026
- **Tính độc lập**: Tuân thủ tuyệt đối `docs/REVIEW_PROTOCOL.md` — **không đọc** bất kỳ tệp `round2_R2*` hay `round2_R3*`; **không chỉnh sửa** bất kỳ tệp mã nguồn (`src/**`), cơ sở tri thức (`kb/**`) hay kiểm thử (`tests/**`).
- **Tệp dữ liệu cấu trúc đi kèm**: `docs/reviews/ckd/round2_R1.json`
- **Kịch bản kiểm định tự động độc lập**:
  - `docs/reviews/ckd/scratch/r2_round2_r1_pdf_audit.ts` (Đối chiếu nguyên văn 70/70 trích dẫn với cache văn bản PDF gốc)
  - `docs/reviews/ckd/scratch/r2_round2_r1_eval_audit.ts` & `docs/reviews/ckd/scratch/r2_round2_r1_eval_extra.ts` (Thực thi trực tiếp `evaluate()` và `ckdMatrix` trên các ca lâm sàng biên, đơn vị `mg/dL` vs `µmol/L`, đa bệnh Thận–Tim–Đái tháo đường, và mô phỏng luồng nạp Preset thực tế của `AppShell.tsx`)

---

## TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

| Hạng mục kiểm định | Kết quả kiểm chứng thực tế |
|---|---|
| **Linter & Kiến trúc KB (`npm run verify:kb`)** | **0 lỗi, 0 cảnh báo** trên module `ckd` (`64/64` ngưỡng có `quantity` chuẩn QA-10; `18/18` thuốc đủ `pregnancy`, `classes`, `gates`) |
| **Bộ kiểm thử hiện hữu (`vitest`)** | **131 / 131 PASS** (49 Golden Cases + 3 Suite Invariants/Fail-Closed/Matrix) |
| **Đối chiếu nguyên văn PDF gốc (`kb/citations/ckd.json`)** | **70 / 70 trích dẫn khớp nguyên văn ký tự & đúng số trang PDF** (`fail = 0, warn = 0`), có 1 lỗi dịch thiếu chủ ngữ quan trọng ở `quoteVi` (`CKD-R2-R1-04`) |
| **Hậu kiểm 43 phát hiện Vòng 1 + Phụ lục HF (44 mục)** | **35/44 mục khắc phục triệt để**; **9/44 mục khắc phục một phần, hồi quy, hoặc báo cáo sai lệch với mã nguồn thực tế trong `round1_RESPONSE.md`** |
| **Tổng số phát hiện mới / tồn đọng tại Vòng 2** | **12 phát hiện**: **2 Critical**, **5 Major**, **4 Minor**, **1 Suggestion** |
| **KẾT LUẬN VÒNG 2 (VERDICT)** | ❌ **FAIL** *(Cần khắc phục dứt điểm 2 lỗi Critical và 5 lỗi Major trước khi cấp chứng nhận PASS)* |

### Tài liệu Guideline & Nhãn Thuốc Gốc Đã Mở Đối Chiếu Trực Tiếp Từng Trang PDF
1. **KDIGO 2024 CKD Guideline** (`KDIGO_2024_CKD_Guideline.pdf`, tr. 22, 36, 41–51, 102–113, 132)
2. **KDIGO 2025 Commentary on GLP-1 RAs / Incretins in CKD** (`KDIGO_2025_Commentary_GLP1_Incretins_in_CKD.pdf`, tr. 1–5 — thử nghiệm FLOW, SELECT, SMART)
3. **ESC 2026 Guidelines on Cardiovascular Disease and Chronic Kidney Disease** (`ESC_2026_cvd_chronic_kidney_disease.pdf`, tr. 25, 29–32, 36)
4. **2025 AHA/ACC Multisociety High Blood Pressure Guideline** (`AHA_ACC_2025_High_Blood_Pressure_Guideline.pdf`, tr. 6, 36–39, 54–55 — Section 5.3.8 CKD)
5. **KDIGO 2012 AKI Guideline** (`KDIGO_2012_AKI_Guideline.pdf`, tr. 11, 13, 19–25, 92–93)
6. **UKKA 2022 Clinical Practice Guideline: Treatment of Acute Hyperkalaemia in Adults** (`UKKA_2022_Treatment_Acute_Hyperkalaemia_Adults.pdf`, tr. 7–16, 104–108, 113–116)
7. **Hướng dẫn Chẩn đoán và Điều trị Bệnh thận mạn và một số bệnh lý thận – Bộ Y tế 2024** (`BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`, tr. 31–40, 53, 61, 66–71)
8. **Nhãn FDA Kerendia (Finerenone) cập nhật 09/2026** (`FDA_label_finerenone.pdf`, tr. 1–5 — CKD in T2D & HF with LVEF ≥ 40%)

---

## PHẦN 1. HẬU KIỂM TOÀN BỘ 43 PHÁT HIỆN VÒNG 1 + PHỤ LỤC SUY TIM (POST-ROUND-1 VERIFICATION)

Mọi tuyên bố trong `docs/reviews/ckd/round1_RESPONSE.md` đã được kiểm chứng chéo trực tiếp với mã nguồn TypeScript (`src/modules/ckd/*.ts`), cơ sở tri thức (`kb/`), và kết quả chạy `evaluate()` thực tế.

### 1.1. Hậu kiểm 12 phát hiện của Reviewer R1 Vòng 1 (`round1_R1.json`)

| Mã Vòng 1 | Mức độ R1 | Trạng thái hậu kiểm thực tế | Nhận xét đối chiếu mã nguồn & `evaluate()` |
|---|:---:|:---:|---|
| **CKD-R1-01** | Critical | ⚠️ **MỘT PHẦN (SAI LỆCH GIẢI TRÌNH)** | Đã sửa đúng ngưỡng toan chuyển hóa lọc máu cấp thành `HCO3⁻ < 8 mmol/L`. **Tuy nhiên**, trái ngược với giải trình tại `round1_RESPONSE.md` dòng 38, code `rules.inpatient.ts:370` vẫn viết `const refractoryK = k !== undefined && k >= 6.5;` **không hề kiểm tra** điều kiện kháng trị nội khoa hay đang lọc máu chu kỳ, khiến mọi BN nội viện không lọc máu có `K⁺ = 6.5` nhận lệnh đặt catheter lọc máu cấp cứu ngay lập tức (Xem **`CKD-R2-R1-04`**). |
| **CKD-R1-02** | Critical | ✅ **ĐÃ KHẮC PHỤC** | Đã tách `ckd.rasi.sbp_initiate_min = 100 mmHg` khỏi đích điều trị `120 mmHg`; BN đạm niệu A3 có `SBP = 112 mmHg` được khởi trị RASi chuẩn xác. |
| **CKD-R1-03** | Major | ✅ **ĐÃ KHẮC PHỤC** | Quy tắc `statin_indication` đã bao phủ đầy đủ BN ≥ 50 tuổi ở cả `eGFR < 60` (1A) và `eGFR ≥ 60` (1B), cùng BN 18–49 tuổi có ĐTĐ/ASCVD (2A). |
| **CKD-R1-04** | Major | ⚠️ **ĐÚNG Ở `µmol/L`, LỖI NẶNG Ở `mg/dL`** | Logic yêu cầu tăng cấp `≥ 26.5 µmol/L` hoặc `≥ 3.0x` nền khi `SCr ≥ 353.6 µmol/L` hoàn toàn chính xác theo KDIGO 2012 (PDF tr. 24). Tuy nhiên do quên chuẩn hóa đơn vị `customInputs.baselineScr` khi `units.cr === 'mg_dL'`, mọi BN ổn định nhập `mg/dL` bị gán nhầm AKI Giai đoạn 3 (Xem **`CKD-R2-R1-01`**). |
| **CKD-R1-05** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã thay đúng trích dẫn trang 132 KDIGO 2024 + BYT 2024 và phân tầng chuẩn `STOP` (`eGFR < 30`, AKI, Triple Whammy) so với `AVOID` (`eGFR ≥ 30`). |
| **CKD-R1-06** | Major | ✅ **ĐÃ KHẮC PHỤC LOGIC** *(còn lỗi chuỗi UI)* | Đã bổ sung `HOLD` khi `5.5 < K⁺ < 6.0`, `REFER` cấp cứu khi `K⁺ ≥ 6.0`, khóa hẹn xét nghiệm thường quy 2–4 tuần. Còn lỗi hiển thị `(, )` khi `CurrentMed.name` trống (**`CKD-R2-R1-08`**). |
| **CKD-R1-07** | Major | ✅ **ĐÃ KHẮC PHỤC CHO CKD ĐƠN THUẦN** | Đã thêm `finerenone_uptitrate` (`10 -> 20 mg` khi `K⁺ ≤ 4.8`) và tách ngưỡng chuẩn độ RASi `K⁺ ≤ 5.0`. Riêng trường hợp đồng mắc `HFpEF (LVEF ≥ 40%, eGFR ≥ 60)` chưa hỗ trợ đích `40 mg` (**`CKD-R2-R1-05`**). |
| **CKD-R1-08** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã chuyển sang `UPTITRATE` khi BN đang dùng sẵn `sodium_bicarbonate` mà `HCO3⁻ < 18 mmol/L`. |
| **CKD-R1-09** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã bổ sung đầy đủ `profileDiff` (`INTL`, `VN`, `US`) và đọc ngưỡng qua `thFor('k', 'ckd.rasi.k_initiate_max')`. |
| **CKD-R1-10** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã tách ngưỡng độc lập `ckd.contrast.egfr_risk_threshold = 60`. |
| **CKD-R1-11** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã tích hợp `computeKfre` và bổ sung quy tắc `consider_nephrology_referral_kfre` cho dải `3% ≤ KFRE 5 năm < 5%`. |
| **CKD-R1-12** | Suggestion | ✅ **ĐÃ KHẮC PHỤC** | Đã phân nhánh động mức khuyến cáo `1A` (T2D / HF / `UACR ≥ 20`) và `2B (Rec 3.7.3)` (`eGFR 20–45`, `UACR < 20`, không ĐTĐ). |

### 1.2. Hậu kiểm 16 phát hiện của Reviewer R2 Vòng 1 + Phụ lục Suy tim (`round1_R2.json`)

| Mã Vòng 1 | Mức độ R2 | Trạng thái hậu kiểm thực tế | Nhận xét đối chiếu mã nguồn & KB |
|---|:---:|:---:|---|
| **CKD-R2-01** | Critical | ✅ **ĐÃ KHẮC PHỤC** | Đã sửa ngưỡng `ckd.dialysis.hco3_emergency_max = 8 mmol/L`. |
| **CKD-R2-02** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã xóa `Resonium A` khỏi `calcium_polystyrene_sulfonate.json`, đổi sang `Kalimate`, `K-Pion`, `Calcium Resonium` *(lưu ý nhỏ: thông báo chung trong `src/engine/safety/interactions.ts` của core vẫn còn chữ `(Resonium)`)*. |
| **CKD-R2-03** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã sửa đơn vị liều duy trì SZC thành `"5 g cách ngày đến 15 g/ngày"`. |
| **CKD-R2-04** | Major | ✅ **ĐÃ KHẮC PHỤC CHO 14 THUỐC `akiHoldIds`** | Cột AKI của 14 thuốc SGLT2i/RASi/Finerenone đã thống nhất `contra`. Tuy nhiên 4 thuốc còn lại bị gán mặc định `rec` kể cả Kalimate (**`CKD-R2-R1-10`**). |
| **CKD-R2-05** | Major | ✅ **ĐÃ KHẮC PHỤC** | Ô G4 của 3 SGLT2i và Finerenone đã chuyển sang `initiate: 'caution'` kèm ghi chú giải thích rõ điểm cắt `eGFR ≥ 20` và `≥ 25`. |
| **CKD-R2-06** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã bổ sung quy tắc `ckd.outpatient.sglt2i_continue` khi `eGFR ≥ 20`. |
| **CKD-R2-07** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã đặt `vnBrands: []` cho `canagliflozin` và `patiromer`. |
| **CKD-R2-08** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã chuẩn hóa số học liều khởi đầu `sodium_bicarbonate` (`500 mg x 2–3 lần/ngày`, tổng `1–2 g/ngày`). |
| **CKD-R2-09** | Major | ✅ **ĐÃ KHẮC PHỤC** | Cả 5 thuốc ACEi đã có cảnh báo bắt buộc washout ≥ 36 giờ trước khi dùng ARNI. |
| **CKD-R2-10** | Major | ✅ **ĐÃ KHẮC PHỤC** | Toàn bộ 10 thuốc ACEi/ARB có `pregnancy.status = 'contra'` và gate thai kỳ; 18/18 thuốc sở hữu đầy đủ metadata thai kỳ/cho con bú. |
| **CKD-R2-11** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã thay phép nhân `* 2` bằng `thFor('egfr', 'ckd.contrast.egfr_risk_threshold')`. |
| **CKD-R2-12** | Minor | ❌ **HỒI QUY (REGRESSED)** | Sau khi cập nhật `finerenone.json` cho Phụ lục HF, `rules.outpatient.ts:685, 760` gọi thẳng `fmtDose(dose('finerenone', 'start'|'target'))` làm tiêu đề bị phình lại câu mô tả dài 35 từ (**`CKD-R2-R1-05`**). |
| **CKD-R2-13** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã thay `Vasotec`, `Prinivil`, `Altace` bằng các biệt dược lưu hành thực tế tại Việt Nam. |
| **CKD-R2-14** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã bổ sung cảnh báo ngưng `canagliflozin` ít nhất 3 ngày trước đại phẫu. |
| **CKD-R2-15** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã bổ sung cảnh báo theo dõi hạ magie máu vào `patiromer.json`. |
| **CKD-R2-16** | Suggestion | ✅ **ĐÃ KHẮC PHỤC** | `ckdMatrix` đã mở rộng đầy đủ 18/18 thuốc sở hữu. |
| **R2-HF-SYNC** | Addendum | ⚠️ **MỘT PHẦN** | Đã cập nhật chuẩn `kb/drugs/finerenone.json` (hàm lượng 40 mg, trích dẫn ESC 2026 HF & FDA 09/2026), nhưng chưa cập nhật logic `finerenone_uptitrate` và tiêu đề trong `rules.outpatient.ts` (**`CKD-R2-R1-05`**). |

### 1.3. Hậu kiểm 15 phát hiện của Reviewer R3 Vòng 1 (`round1_R3.json`)

| Mã Vòng 1 | Mức độ R3 | Trạng thái hậu kiểm thực tế | Nhận xét đối chiếu mã nguồn & `evaluate()` |
|---|:---:|:---:|---|
| **R3-CKD-01** | Critical | ✅ **ĐÃ KHẮC PHỤC** | Đã khóa thai kỳ trong toàn bộ luật khởi trị/duy trì/tăng liều SGLT2i và Finerenone. |
| **R3-CKD-02** | Critical | ✅ **ĐÃ KHẮC PHỤC** | Đã bổ sung `pregnancy_stop_teratogens` phối hợp cùng `reviewCurrentMedications` phát lệnh `STOP` khẩn cho thuốc độc thai đang dùng. |
| **R3-CKD-03** | Critical | ✅ **ĐÃ KHẮC PHỤC** | Đã tách `ckd.rasi.sbp_initiate_min = 100 mmHg`. |
| **R3-CKD-04** | Critical | ⚠️ **MỘT PHẦN (SAI LỆCH GIẢI TRÌNH)** | Khi bật đồng thời `['ckd', 'hf']` hoặc đang dùng sẵn Spironolactone thì chặn được trùng MRA. **Tuy nhiên**, trái với giải trình tại `round1_RESPONSE.md` dòng 84, khi chỉ bật `['ckd']` trên BN có `HFrEF (LVEF 30%)`, `finerenone_indication` vẫn kê `START Finerenone` (**`CKD-R2-R1-05`**). |
| **R3-CKD-05** | Critical | ⚠️ **MỘT PHẦN (CÒN LỖI NẶNG)** | Đã chặn `START` SGLT2i khi `SBP = 82 mmHg`, nhưng nhánh `DEFER` bị chết (dead code), khi khuyết `sbp` lại fail-open cho `START`, và `bp_target` chấm `SBP = 82–92 mmHg` là *"Đạt mục tiêu kiểm soát"* (**`CKD-R2-R1-02`**). |
| **R3-CKD-06** | Critical | ✅ **ĐÃ KHẮC PHỤC LOGIC** | Đã xử lý đầy đủ dải `5.5 < K⁺ < 6.0` (`HOLD`) và `K⁺ ≥ 6.0` (`REFER` cấp cứu). |
| **R3-CKD-07** | Critical | ✅ **ĐÃ KHẮC PHỤC** | Đã chặn kê thêm RASi khi đang dùng ARNI, bổ sung `avoid_dual_rasi` cho cặp ACEi/ARB + ARNI, và hòa giải chuẩn khi bật `['ckd', 'hf']`. |
| **R3-CKD-08** | Major | ⚠️ **MỘT PHẦN (SAI LỆCH GIẢI TRÌNH)** | Đã sửa đúng cho `INTL` (`< 120 mmHg`), nhưng bỏ quên hoàn toàn `US` (đánh đồng `US` vào `VN` `120–129 mmHg`, mâu thuẫn với AHA/ACC 2025 `< 130/80` và với chính giải trình dòng 88 — Xem **`CKD-R2-R1-06`**). |
| **R3-CKD-09** | Major | ⚠️ **MỘT PHẦN (SAI LỆCH GIẢI TRÌNH)** | Ở G4 (`eGFR 15–29`) đã xuất đúng `"2.5 mg cách ngày"`, nhưng ở G5 (`eGFR < 15`) code KHÔNG chuyển sang Losartan như giải trình dòng 89 tuyên bố (**`CKD-R2-R1-09`**). |
| **R3-CKD-10** | Major | ✅ **ĐÃ KHẮC PHỤC `drugId`** *(còn lỗi chuỗi UI)* | Đã sinh đủ `ckd.inpatient.hold_aki_<drugId>`, còn lỗi `"TẠM NGỪNG undefined"` khi `CurrentMed.name` trống (**`CKD-R2-R1-08`**). |
| **R3-CKD-11** | Major | ✅ **ĐÃ KHẮC PHỤC** | Nhánh `AVOID` khi mang thai/phù mạch đã dùng tiêu đề `"CHỐNG CHỈ ĐỊNH..."` rõ ràng. |
| **R3-CKD-12** | Major | ✅ **ĐÃ KHẮC PHỤC** | Đã bổ sung `missing_scr_check` và khóa fail-closed khi `egfr === undefined`. |
| **R3-CKD-13** | Major | ✅ **ĐÃ KHẮC PHỤC** | Không còn cảnh báo giả *Triple Whammy* khi không có NSAID. |
| **R3-CKD-14** | Minor | ✅ **ĐÃ KHẮC PHỤC** | Đã đồng bộ tên `Calcium Polystyrene Sulfonate (Kalimate)` trong module CKD. |
| **R3-CKD-15** | Suggestion | ❌ **CHƯA THỰC HIỆN (GIẢI TRÌNH SAI)** | Luật `ckd.inpatient.hyperkalemia_severe_szc_order` được ghi trong `round1_RESPONSE.md` dòng 95 và `docs/modules/CKD.md` dòng 104 thực tế **không hề tồn tại** trong `rules.inpatient.ts` (**`CKD-R2-R1-11`**). |

---

## PHẦN 2. CHI TIẾT 12 PHÁT HIỆN KIỂM ĐỊNH ĐỘC LẬP VÒNG 2

### 2.1. Nhóm Mức Độ Nghiêm Trọng Tức Thì (`CRITICAL` — 2 Phát hiện)

#### 🔴 `CKD-R2-R1-01` [CRITICAL] — Không chuẩn hóa đơn vị `customInputs.baselineScr` (`mg/dL` vs `µmol/L`) gây chẩn đoán giả AKI Giai đoạn 3 và phát lệnh `HOLD` khẩn cấp toàn bộ thuốc bảo vệ tim-thận ở bệnh nhân nội viện ổn định
- **Hạng mục**: `rule` / `ckd.inpatient.aki_staging` & `isAkiActive` (`src/modules/ckd/rules.inpatient.ts:32-39, 55-56`; liên đới `src/modules/ckd/inputs.ts:45-53` và `src/engine/units.ts:125`)
- **Cơ chế lỗi**:
  1. Trong `src/modules/ckd/inputs.ts:45-53`, trường `customInputs.baselineScr` khai báo `unitKey: 'cr'`. Do đó khi người dùng chọn đơn vị Creatinin là `mg/dL` (`settings.units.cr === 'mg_dL'`, mặc định cho hồ sơ Hoa Kỳ hoặc các bệnh viện trả kết quả `mg/dL`), giao diện `PatientForm.tsx` hiển thị nhãn đơn vị `mg/dL` và bác sĩ nhập `baselineScr = 1.2` (`mg/dL`).
  2. Hàm `normalizePatientUnits()` (`src/engine/units.ts:125`) nhân hệ số `88.4` cho `patient.scr` (`1.2 mg/dL -> 106.08 µmol/L`), **nhưng không chuẩn hóa `customInputs.baselineScr`**.
  3. Tại `src/modules/ckd/rules.inpatient.ts:32-39` và `55-56`, cả `isAkiActive(ctx)` lẫn `aki_staging` lấy `ctx.normalized.scr` (`106.08 µmol/L`) so sánh trực tiếp với `ctx.patient.customInputs?.baselineScr` (`1.2`), tính ra tỷ lệ tăng **`88.4 lần` (`>= 3.0`)** và độ tăng tuyệt đối **`+104.88 µmol/L` (`>= 26.5`)**!
- **Bằng chứng chạy `evaluate()` thực tế (`r2_round2_r1_eval_audit.ts` – Case `BUG-1A`)**:
  - **Đầu vào**: Bệnh nhân nam 65 tuổi nội viện hoàn toàn ổn định (`scr: 1.2 mg/dL`, `baselineScr: 1.2 mg/dL`, `akiSuspected: false`, `urineOutputRate: 'normal'`, `eGFR = 67 mL/phút/1.73m²`, đang dùng Dapagliflozin 10 mg, Losartan 100 mg, Finerenone 10 mg; `units.cr: 'mg_dL'`).
  - **Đầu ra sai nguy hiểm**:
    1. `[MONITOR] rec_ckd_aki_stage_alert`: *"TỔN THƯƠNG THẬN CẤP TRÊN NỀN MẠN: Giai đoạn 3 (Creatinin tăng >= 3 lần nền...)"*
    2. `[HOLD] rec_ckd_hold_sick_day` (`dapagliflozin`): *"TẠM NGỪNG khẩn cấp thuốc ngày ốm"*
    3. `[HOLD] rec_ckd_hold_aki_losartan` (`losartan`): *"TẠM NGỪNG ... trong đợt cấp AKI"*
    4. `[HOLD] rec_ckd_hold_aki_finerenone` (`finerenone`): *"TẠM NGỪNG ... trong đợt cấp AKI"*
  - Cùng bệnh nhân đó khi đổi sang `106.1 µmol/L` (`BUG-1B`) trả về **0 cảnh báo AKI**.
- **Hậu quả lâm sàng**: Ngừng oan đồng loạt 3 trụ cột điều trị ở bệnh nhân suy tim/CKD nội viện có chức năng thận bình thường/ổn định, làm tăng nguy cơ mất bù cấp tim mạch – thận (KDIGO 2024 PP 3.6.3 & 3.7.2, PDF tr. 44).
- **Khuyến nghị sửa**: Tạo hàm `getNormalizedBaselineScr(ctx)` trong `rules.inpatient.ts` (hoặc chuẩn hóa trong `normalizePatientUnits`) nhân `88.4` khi `ctx.settings.units.cr === 'mg_dL'`; bổ sung Golden Case hồi quy cho đơn vị `mg_dL`.

---

#### 🔴 `CKD-R2-R1-02` [CRITICAL] — Lỗi Fail-Open cổng huyết áp khi khuyết `sbp` (`START` SGLT2i & `UPTITRATE` hạ áp mù quáng) và báo *"Đạt mục tiêu kiểm soát (`CONTINUE`)"* ngay khi bệnh nhân đang tụt huyết áp (`SBP = 82–92 mmHg`)
- **Hạng mục**: `rule` / `ckd.outpatient.sglt2i_initiate` & `ckd.outpatient.bp_target` (`src/modules/ckd/rules.outpatient.ts:58, 103, 113, 136, 932, 944-965`)
- **Bằng chứng mã nguồn & `evaluate()` thực tế (`r2_round2_r1_eval_extra.ts` – Case 6)**:
  1. **Khi khuyết số đo huyết áp (`sbp === undefined`)**:
     - `sglt2i_initiate` dòng 103 viết `const passedSbp = sbp === undefined || sbp >= minSbp;` — **fail-open trực tiếp**, vi phạm `docs/QA_FINDINGS.md` QA-1 Luật #2 (*"Gate an toàn thiếu dữ liệu = không đạt (fail-closed), không phải đạt"*). Trên cùng một bệnh nhân (`eGFR = 50.3`), `rec_ckd_rasi_start` trả về `[DEFER]` (`SBP:FAIL - Không đạt cổng an toàn (Fail-closed)`), trong khi `rec_ckd_sglt2i_start` lại trả về **`[START] Khởi trị Dapagliflozin 10 mg`** với `SBP:PASS (msg="Chưa có số đo HA")`!
     - Đồng thời `bp_target` dòng 944–953 tính `isTargetMet = false` khi `sbp === undefined`, nên xuất lệnh **`[UPTITRATE] Đích huyết áp tâm thu 120–129 mmHg`** (khuyến cáo tăng liều thuốc hạ áp trong khi chưa hề đo huyết áp!).
  2. **Khi bệnh nhân tụt huyết áp thực sự (`SBP = 82` hoặc `92 mmHg`)**:
     - Trong `bp_target` dòng 932, biến `escMin = thFor('sbp', 'ckd.bp.target_sbp_esc_min')` (`120 mmHg`) được lấy ra nhưng **bỏ quên không kiểm tra chặn dưới** (`isTargetMet = sbp !== undefined && sbp <= escMax`). Kết quả khi `sbp = 92 mmHg`, engine xuất **`[CONTINUE] rec_ckd_bp_target`** với `SBP:PASS(val=92, th=129, msg="Huyết áp hiện tại 92 mmHg: Đạt mục tiêu kiểm soát")`!
     - Đồng thời trong `sglt2i_initiate`, vì `when()` dòng 58 trả về `false` khi `sbp < 100`, toàn bộ nhánh `DEFER` cảnh báo nguy cơ giảm thể tích ở dòng 113 & 136 trở thành **dead code không thể chạm tới** (trái với giải trình tại `round1_RESPONSE.md` dòng 85).
- **Khuyến nghị sửa**:
  1. Trong `sglt2i_initiate`: Bỏ điều kiện lọc `sbp < 100` ở `when()`, sửa dòng 103 thành `const passedSbp = sbp !== undefined && sbp >= minSbp;` để phát `DEFER` tường minh cả khi thiếu `sbp` lẫn khi `sbp < 100 mmHg`.
  2. Trong `bp_target`: Khi `sbp === undefined`, trả về `MONITOR` yêu cầu đo huyết áp (không `UPTITRATE`); khi `sbp < 100 mmHg`, phát cảnh báo `HOLD` / `REDUCE` rà soát giảm/tạm ngưng thuốc hạ áp do huyết áp thấp (KDIGO 2024 PP 3.4.2; ESC 2026 Table 11 tr. 29).

---

### 2.2. Nhóm Sai Lệch Guideline & Thiếu Khuyến Cáo Trụ Cột Class I (`MAJOR` — 5 Phát hiện)

#### 🟠 `CKD-R2-R1-03` [MAJOR] — Bỏ sót hoàn toàn trụ cột thứ 4 bảo vệ tim-thận **GLP-1 RA (Semaglutide tiêm dưới da)** cho bệnh nhân ĐTĐ típ 2 kèm CKD (KDIGO 2024 Grade 1B / KDIGO 2025 FLOW / ESC 2026 Class I-A / BYT 2024)
- **Hạng mục**: `missing` / `ckd.outpatient.glp1ra_indication`
- **Bằng chứng Guideline gốc**:
  - **KDIGO 2024 CKD Guideline – Recommendation 3.9.1** (`KDIGO_2024_CKD_Guideline.pdf`, tr. 45 & 106, **Grade 1B**):
    > *"Recommendation 3.9.1: In adults with T2D and CKD who have not achieved individualized glycemic targets despite use of metformin and SGLT2 inhibitor treatment, or who are unable to use those medications, we recommend a long-acting GLP-1 RA (1B)."*
  - **KDIGO 2025 Commentary on GLP-1 RAs in CKD** (`KDIGO_2025_Commentary_GLP1_Incretins_in_CKD.pdf`, tr. 1–4): Khẳng định thử nghiệm **FLOW** (semaglutide `1.0 mg` tiêm dưới da hàng tuần trên 3.533 BN T2D + CKD giảm **24%** biến cố gộp thận chính, HR 0.76; giảm 18% MACE và 20% tử vong do mọi nguyên nhân) định vị GLP-1 RA là trụ cột thứ 4 bảo vệ tim-thận bên cạnh RASi, SGLT2i và Finerenone.
  - **ESC 2026 Guidelines on CVD and CKD – Recommendation Table 12** (`ESC_2026_cvd_chronic_kidney_disease.pdf`, tr. 31, **Class I, Level A**):
    > *"A GLP-1RA (subcutaneous semaglutide 1.0 mg/week after dose titration) is recommended in patients with CKD who have type 2 diabetes with eGFR 25–49 mL/min/1.73 m2 and uACR ≥10 mg/mmol (≥100 mg/g) or eGFR 50–74 mL/min/1.73 m2 and uACR ≥30 mg/mmol (≥300 mg/g) to reduce the risk of CKD progression and cardiovascular events, irrespective of glycaemic control. (I A)"*
  - **BYT 2024 Bệnh thận mạn – Mục 4.1.2.1** (`BYT_2024_Benh_Than_Man_va_Benh_Ly_Than.pdf`, tr. 31): Khuyến cáo bổ sung chất đồng vận thụ thể GLP-1 tác dụng kéo dài ở BN ĐTĐ típ 2 kèm CKD để kiểm soát đường huyết, dự phòng albumin niệu đại thể và làm chậm tiến triển bệnh thận.
- **Bằng chứng `evaluate()` thực tế (`r2_round2_r1_eval_audit.ts` – Case `BUG-2A` & `BUG-2B`)**:
  - Khi bác sĩ chuyên khoa Thận chạy module `ckd` (`selectedModules: ['ckd']`):
    - **Ca `BUG-2A`**: Nam 62T, T2D + CKD G3bA3 (`eGFR = 35`, `UACR = 45 mg/mmol`, `HbA1c = 8.2%`) đang dùng đủ Dapagliflozin 10 mg + Metformin 1000 mg + Losartan 100 mg + Finerenone 20 mg -> **0 khuyến cáo GLP-1 RA / Semaglutide**.
    - **Ca `BUG-2B`**: Nữ 66T, T2D + CKD G4A3 (`eGFR = 17 mL/phút/1.73m² < 20` — không khởi trị mới được SGLT2i và chống chỉ định tuyệt đối Metformin, `HbA1c = 8.0%`) -> **0 khuyến cáo GLP-1 RA** (dù `kb/drugs/semaglutide.json` đã có sẵn trong KB!).
- **Khuyến nghị sửa**: Bổ sung quy tắc `ckd.outpatient.glp1ra_indication` (`drugId: 'semaglutide'`, `benefitsAlso: ['dm2', 'hf']`) vào `rules.outpatient.ts` bao phủ cả hai nhánh: (1) ESC 2026 Class I-A bất kể HbA1c ở nhóm nguy cơ thận cao theo tiêu chuẩn FLOW, và (2) KDIGO 2024 Rec 3.9.1 (1B) khi chưa đạt mục tiêu HbA1c dù đã dùng SGLT2i/Metformin hoặc không thể dùng SGLT2i/Metformin (`eGFR 15–19` hoặc chống chỉ định).

---

#### 🟠 `CKD-R2-R1-04` [MAJOR] — Phát hiện Critical Vòng 1 (`CKD-R1-01`) mới sửa một nửa & giải trình sai trong `round1_RESPONSE.md`: Vẫn chỉ định đặt catheter & lọc máu cấp cứu tức thì cho mọi BN nội viện không lọc máu có `K⁺ ≥ 6.5 mmol/L` chưa qua điều trị nội khoa + Dịch thiếu chủ ngữ trong `quoteVi`
- **Hạng mục**: `rule` / `ckd.inpatient.emergency_dialysis_indication` (`src/modules/ckd/rules.inpatient.ts:370`) & `citation` / `ukka.2022.guideline_18_1_emergency_dialysis` (`kb/citations/ckd.json:415-416`)
- **Đối chiếu giải trình vs mã nguồn thực tế**:
  - `round1_RESPONSE.md` dòng 38 khẳng định: *"Chỉ kích hoạt `rec_ckd_emergency_rrt` khi `hco3 < 8`, hoặc `k >= 6.5` kháng trị nội khoa / trên BN đang lọc máu chu kỳ (UKKA 2022 Rec 18.1)"*.
  - Thực tế tại `rules.inpatient.ts:370`: `const refractoryK = k !== undefined && k >= thFor('k', 'ckd.dialysis.k_emergency_refractory');` — **chỉ đặt tên biến là `refractoryK` nhưng hoàn toàn không kiểm tra điều kiện kháng trị nội khoa hay `onDialysis`**!
  - Đồng thời tại `kb/citations/ckd.json:415-416`, câu gốc của UKKA 2022 Guideline 18.1 là:
    > *"We recommend that **haemodialysis patients** with severe hyperkalaemia (serum K+ >= 6.5 mmol/L) receive dialysis treatment urgently. (1A)"* (`UKKA_2022_Treatment_Acute_Hyperkalaemia_Adults.pdf`, tr. 14 & 105)
    nhưng `quoteVi` lại dịch thành *"Chúng tôi khuyến cáo bệnh nhân có tăng kali máu nặng (K+ huyết thanh >= 6.5 mmol/L) cần được điều trị lọc máu khẩn cấp"* — làm mất hoàn toàn chủ ngữ giới hạn **bệnh nhân đang chạy thận nhân tạo chu kỳ**!
- **Đối chiếu Guideline cho bệnh nhân chưa lọc máu chu kỳ**:
  - **UKKA 2022 Guideline 19.6 & 20.1** (PDF tr. 15): Chỉ định chuyển lọc máu cấp ở BN tăng kali cấp tính khi **kháng trị với điều trị nội khoa ban đầu** (*"hyperkalaemia is resistant to initial medical therapy"* / *"cannot be controlled below 6.5 mmol/L using medical measures"*).
  - **KDIGO 2012 AKI Section 5.1.1** (PDF tr. 92) & **BYT 2024** (PDF tr. 70–71): Chỉ định lọc máu cấp khi *"Tăng kali máu > 6,5 mmol/L, khi điều trị nội khoa không hiệu quả"*.
- **Khuyến nghị sửa**: Bổ sung `customInputs.refractoryHyperkalemia` vào `inputs.ts`; chỉ phát lệnh đặt catheter lọc máu cấp cứu (`REFER`) khi `k >= 6.5` kèm `hasCondition(ctx, 'onDialysis') || refractoryHyperkalemia === true` (hoặc kèm vô niệu/quá tải dịch/urê huyết cao); sửa lại `quoteVi` của `ukka.2022.guideline_18_1_emergency_dialysis`.

---

#### 🟠 `CKD-R2-R1-05` [MAJOR] — Khởi trị sai Finerenone cho bệnh nhân Suy tim phân suất tống máu giảm (`HFrEF`, `LVEF ≤ 40%`), thiếu chuẩn độ lên liều đích `40 mg` khi đồng mắc `HFmrEF/HFpEF (LVEF ≥ 40%, eGFR ≥ 60)`, và hồi quy lỗi tiêu đề `CKD-R2-12`
- **Hạng mục**: `rule` / `ckd.outpatient.finerenone_indication` & `ckd.outpatient.finerenone_uptitrate` (`src/modules/ckd/rules.outpatient.ts:624-785`)
- **Bằng chứng 3 điểm lỗi**:
  1. **Kê Finerenone cho HFrEF (`LVEF ≤ 40%`) khi chạy module `ckd` đơn lẻ**: Trái với giải trình tại `round1_RESPONSE.md` dòng 84, `finerenone_indication` không hề kiểm tra `lvef <= 40`. Trên BN nam 64T có `HFrEF (LVEF = 30%) + CKD G3aA3 + T2D` (`selectedModules: ['ckd']`), engine xuất `[START] Khởi trị Finerenone 10 mg`. Theo **ESC 2026 CVD-CKD Section 6.2.1.3 & 6.2.2.1** (PDF tr. 36) và **KDIGO 2024 PP 3.8.5** (PDF tr. 45), HFrEF (`LVEF ≤ 40%`, `eGFR > 30`) bắt buộc ưu tiên **MRA steroid** (Spironolactone/Eplerenone — Class I-A giảm tử vong), còn Finerenone chỉ có chỉ định suy tim ở **`LVEF ≥ 40%`** (Nhãn FDA Kerendia 09/2026 Section 1, PDF tr. 1).
  2. **Thiếu chuẩn độ lên `40 mg/ngày` ở BN đồng mắc `CKD + T2D + HFmrEF/HFpEF (LVEF ≥ 40%)` có `eGFR ≥ 60`**: Dù `kb/drugs/finerenone.json` đã cập nhật liều đích `40 mg/ngày` (FDA Kerendia 09/2026 Section 2.3 Table 3, PDF tr. 3: khởi đầu `20 mg` -> tăng lên `40 mg` sau 4 tuần khi `eGFR ≥ 60` và `K⁺ < 5.0 mmol/L`), `finerenone_uptitrate` vẫn khóa cứng `targetDose = 20 mg`, nên BN `LVEF = 52%, eGFR = 80.1` đang dùng `Finerenone 20 mg` không được tăng lên liều đích `40 mg`.
  3. **Hồi quy lỗi tiêu đề `CKD-R2-12`**: Dòng 685 & 760 nhúng nguyên văn `fmtDose(...)` vào `title`, sinh ra tiêu đề dài 35 từ rất rối mắt trên thẻ khuyến cáo: `"Khởi trị Finerenone (10 mg x 1 lần/ngày (uống) - khởi đầu khi eGFR 25–59 mL/phút/1.73m² (CKD & HFmrEF/HFpEF); khởi đầu 20 mg/ngày khi eGFR >= 60 mL/phút/1.73m²)"`.
- **Khuyến nghị sửa**: Chặn tự động `START Finerenone` khi `hasCondition(ctx, 'hf') && lvef !== undefined && lvef <= 40` (hướng dẫn ưu tiên MRA steroid Class I HFrEF / bật module `hf`); bổ sung nhánh đích `40 mg` (`K⁺ < 5.0`) khi `hasCondition(ctx, 'hf') && lvef >= 40 && egfr >= 60`; rút gọn `title` theo đúng liều cá thể hóa của từng bệnh nhân (`10 mg`, `20 mg`, hoặc `40 mg`).

---

#### 🟠 `CKD-R2-R1-06` [MAJOR] — `bp_target` xử lý sai hoàn toàn hồ sơ Hoa Kỳ (`US` bị gán nhầm hướng dẫn Việt Nam/Châu Âu `120–129 mmHg` trái với AHA/ACC 2025 `< 130/80 mmHg`), bỏ qua `DBP ≥ 80 mmHg`, và in cứng lý giải `eGFR ≥ 30` cho cả CKD G4–G5
- **Hạng mục**: `rule` / `ckd.outpatient.bp_target` (`src/modules/ckd/rules.outpatient.ts:929-976`)
- **Bằng chứng mã nguồn, `evaluate()` & PDF gốc**:
  1. Dòng 929 viết `const isIntl = ctx.settings.profile === 'INTL';`, đẩy toàn bộ `profile === 'US'` vào nhánh `VN` (`"Đích huyết áp tâm thu 120–129 mmHg (BYT 2024 / ESC 2026)"`), tự mâu thuẫn với chính `profileDiff.US` bên dưới (`"ACC/AHA: Đích huyết áp < 130/80 mmHg"`), mâu thuẫn với giải trình dòng 88 của `round1_RESPONSE.md`, và sai lệch với **2025 AHA/ACC High Blood Pressure Guideline Section 5.3.8** (`AHA_ACC_2025_High_Blood_Pressure_Guideline.pdf`, tr. 6 & tr. 54, **COR 1, LOE A**: mục tiêu `< 130/80 mmHg` cho người lớn THA kèm CKD).
  2. Không kiểm tra `dbp`: BN có HA `124/88 mmHg` ở hồ sơ `US`/`VN` vẫn nhận `CONTINUE: "Đạt mục tiêu kiểm soát"`.
  3. Tại CKD G4–G5 (`eGFR = 11` hoặc `21 mL/phút/1.73m²`), `rationale` vẫn in cứng *"mục tiêu SBP 120–129 mmHg ở bệnh nhân có eGFR ≥ 30 mL/phút/1.73m²"*, trong khi **ESC 2026 CVD-CKD Rec Table 11** (PDF tr. 29) giới hạn mục tiêu `120–129 mmHg` (Class I-A) cho `eGFR > 30` và quy định mục tiêu SBP cá thể hóa theo dung nạp (Class I-C) khi `eGFR ≤ 30`.
- **Khuyến nghị sửa**: Tách bạch 3 nhánh `INTL` (`< 120 mmHg` chuẩn hóa), `US` (`< 130/80 mmHg` kèm kiểm tra cả `sbp < 130` và `dbp < 80` + trích dẫn AHA/ACC 2025 Sec 5.3.8), và `VN` (`120–129 / 70–79 mmHg` khi `eGFR ≥ 30`; cá thể hóa khi `eGFR < 30`).

---

#### 🟠 `CKD-R2-R1-07` [MAJOR] — Hai ca bệnh nhân mẫu nội viện/cấp cứu (`ckdPresets[2]` & `ckdPresets[3]`) thiếu bối cảnh `setting: 'inpatient'` và bị gộp nhầm `uacr: 25` khi bấm chọn trên giao diện, sinh phác đồ ngoại trú nguy hiểm ngược với mô tả ca bệnh
- **Hạng mục**: `ui` / `src/modules/ckd/presets.ts:90-158` & `src/ui/AppShell.tsx:480-488`
- **Bằng chứng thực thi luồng nạp Preset thực tế (`r2_round2_r1_eval_extra.ts`)**:
  - Khi người dùng mở ứng dụng (mặc định `setting: 'outpatient'`) và bấm chọn **BN 3 (`Nội trú - Tổn thương thận cấp AKI Giai đoạn 2 trên nền CKD G3`: SCr tăng `130 -> 280 µmol/L`, thiểu niệu ≥ 6h)**: Do `PresetPatient` không có trường `setting: 'inpatient'` và `AppShell.tsx` gộp `{ ...INITIAL_PATIENT, ...preset.patient }` (thừa kế nhầm `uacr: 25`), hệ thống chạy toàn bộ luật ngoại trú và khuyên **`[CONTINUE] Tiếp tục duy trì Jardiance`**, **`[MONITOR] Định lượng lại Creatinin và Kali máu sau 2–4 tuần`**, **không hề phát lệnh `HOLD` cho Jardiance hay Renitec**!
  - Khi bấm chọn **BN 4 (`Cấp cứu Nội viện - Tăng Kali máu nặng 6.8 mmol/L có biến đổi ECG`)**: Hệ thống bỏ qua gói tiêm Canxi tĩnh mạch 5 bước UKKA nội viện và lại khuyên **`[START] Khởi trị Dapagliflozin 10 mg`**, **`[START] Khởi trị Atorvastatin 20 mg`** và **`[START] Natri Bicarbonat viên uống`**!
- **Khuyến nghị sửa**: Thêm `setting?: Setting` vào `PresetPatient` (`setting: 'inpatient'` cho BN 3 & BN 4; `'outpatient'` cho BN 1 & BN 2), đồng thời sửa `AppShell.tsx` chuyển `settings.setting` theo preset và không gộp các chỉ số xét nghiệm của `INITIAL_PATIENT` sang ca mẫu mới.

---

### 2.3. Nhóm Hoàn Thiện Hiển Thị, Dược Lâm Sàng Tinh Chỉnh & Ma Trận (`MINOR` — 4 Phát hiện, `SUGGESTION` — 1 Phát hiện)

1. **`CKD-R2-R1-08` [MINOR — `rule` / `hold_sick_day_meds`, `hold_aki_<drugId>`, `hyperkalemia_hold_rasi_mra`]**: Cả 3 quy tắc `HOLD` trong `rules.inpatient.ts` (dòng 131, 191, 205, 212) và `rules.outpatient.ts` (dòng 1291) nội suy trực tiếp `m.name` / `targetMed.name` mà không fallback về `drug(m.drugId).nameVi` khi trường tùy chọn `CurrentMed.name` bị bỏ trống, in ra giao diện các tiêu đề hỏng: `"TẠM NGỪNG khẩn cấp thuốc ngày ốm: , , "`, `"TẠM NGỪNG undefined trong đợt cấp AKI"`, và `"TẠM NGỪNG thuốc giữ Kali (, ) do K⁺ = 5.7 mmol/L"`.
2. **`CKD-R2-R1-09` [MINOR — `rule` / `ckd.outpatient.rasi_initiate` & `perindopril` G4–G5]**: Trái với giải trình tại `round1_RESPONSE.md` dòng 89, `rasi_initiate` vẫn kê khởi trị mới `Perindopril 2.5 mg cách ngày` ở BN CKD G5 chưa lọc máu (`eGFR = 11`); cột `G5 (< 15 chưa lọc máu)` của `perindopril` trong `ckdMatrix` hiển thị nhầm `"2.5 mg vào ngày lọc máu"`; và tại hồ sơ `VN`, **BYT 2024 Bảng 12 (PDF tr. 38)** ghi rõ Perindopril *"Không sử dụng khi CrCl <30 ml/phút"* nên cần ưu tiên ARB (Losartan `25 mg/ngày`) khi `eGFR/CrCl < 30 mL/phút`.
3. **`CKD-R2-R1-10` [MINOR — `matrix` / `ckd.matrix.aki_column`]**: Hàm `getAkiCell()` trong `src/modules/ckd/matrix.ts:128-133` gán cứng `initiate: 'rec', continue: 'rec'` ở cột `AKI` cho cả **`calcium_polystyrene_sulfonate` (Kalimate/Calcium Resonium)**, mâu thuẫn với **UKKA 2022 Guideline 16.6.3 (PDF tr. 14)**: *"We suggest that calcium resonium is not used in the emergency management of severe hyperkalaemia (2C)"*, đồng thời chưa phân biệt tốc độ khởi phát của SZC (`rec`) với Patiromer (`ok`) và Natri Bicarbonat viên uống (`caution`).
4. **`CKD-R2-R1-11` [MINOR — `rule` / `ckd.inpatient.hyperkalemia_severe_szc_order`]**: Quy tắc `ckd.inpatient.hyperkalemia_severe_szc_order` được nêu trong `round1_RESPONSE.md` dòng 95 và `docs/modules/CKD.md` dòng 104 thực tế không có trong `src/modules/ckd/rules.inpatient.ts`, khiến gói cấp cứu tăng kali nội viện không có `drugId` thành phần để kích hoạt kiểm tra tương tác thuốc gắn kết đường tiêu hóa (`ix.potassium_binder_drug_binding`).
5. **`CKD-R2-R1-12` [SUGGESTION — `ui` / `ckd.pathway.pillars_and_cystatin`]**: Cập nhật `ckdPathway` (`src/modules/ckd/pathway.ts`) hiển thị đủ 4 trụ cột bảo vệ thận ở ĐTĐ típ 2 (RASi + SGLT2i + Finerenone + GLP-1 RA Semaglutide) và cân nhắc thêm gợi ý định lượng Cystatin C (`eGFRcr-cys`) xác nhận chẩn đoán ở nhóm ranh giới `G3aA1` theo KDIGO 2024 Rec 1.2.1 (1B).

---

## PHẦN 3. GHI NHẬN CÁC ĐIỂM SÁNG Y KHOA & KỸ THUẬT ĐÃ ĐẠT CHUẨN CAO

Bên cạnh các tồn đọng nêu trên cần khóa nốt trước khi nghiệm thu, Hội đồng ghi nhận nỗ lực chuẩn hóa rất chất lượng của Module CKD sau Vòng 1 ở các khía cạnh sau:
1. **Độ trung thực trích dẫn tuyệt đối (`70/70` citations)**: Kiểm tra tự động toàn bộ 70 trích dẫn trong `kb/citations/ckd.json` đều khớp nguyên văn từng từ và đúng số trang PDF gốc của KDIGO 2024, ESC 2026, UKKA 2022, KDIGO 2012, BYT 2024 và nhãn FDA/EMA.
2. **Tuân thủ nghiêm ngặt kiến trúc QA-10 (`quantity` + `thFor`)**: Toàn bộ 64 ngưỡng trong `kb/thresholds/ckd.json` đều gắn đại lượng vật lý chuẩn xác, xóa bỏ hoàn toàn lỗi mượn ngưỡng chéo (`4.8` vs `5.0` giữa Finerenone và RASi; `30 * 2` cho thuốc cản quang).
3. **Công thức tính toán cốt lõi chuẩn xác**: CKD-EPI 2021 không hệ số chủng tộc (`eGFRcr`, `eGFRcys`, và công thức kết hợp `eGFRcr-cys`) và phương trình **KFRE 4 biến Tangri Bắc Mỹ / Non-North-American** (`kfre.ts`) kèm phân tầng chuyển tuyến `< 3%`, `3–<5%` (`CONSIDER`), `≥ 5%` (`REFER`) bám sát KDIGO 2024 Hình 48.
4. **Phân tầng Statin & NSAID & An toàn thai kỳ chuẩn mực**: Bao phủ trọn vẹn KDIGO 2024 Rec 3.15.1.1 (1A), 3.15.1.2 (1B), 3.15.1.3 (2A); phân biệt chính xác `STOP` NSAID (`eGFR < 30`/AKI/Triple Whammy) với `AVOID` (`eGFR ≥ 30`); khóa an toàn thai kỳ đầy đủ trên toàn bộ 18 hoạt chất sở hữu.
5. **Chính xác tinh tế trong tiêu chuẩn AKI Giai đoạn 3 (khi dùng `µmol/L`)**: Kiểm định trực tiếp KDIGO 2012 PDF tr. 24 xác nhận việc yêu cầu `SCr ≥ 353.6 µmol/L` đi kèm mức tăng cấp `≥ 26.5 µmol/L` (hoặc `≥ 1.5x` nền) là hoàn toàn đúng chuẩn KDIGO 2012 (thay cho ngưỡng cũ `44 µmol/L` của RIFLE/AKIN).

---

## PHẦN 4. LỘ TRÌNH KHẮC PHỤC ĐỂ ĐẠT PASS Ở VÒNG 3 & KẾT LUẬN CUỐI CÙNG

Để đạt **PASS (0 Critical, 0 Major)** ở Vòng 3, đề nghị Agent phụ trách Module CKD thực hiện dứt điểm 7 hạng mục bắt buộc sau:
1. **Chuẩn hóa đơn vị `customInputs.baselineScr`** theo `settings.units.cr` (`mg_dL` -> nhân `88.4`) trước khi phân độ AKI nội viện (`CKD-R2-R1-01`).
2. **Khóa Fail-Closed cổng `SBP` trong `sglt2i_initiate` và sửa chặn dưới/thiếu dữ liệu trong `bp_target`** để không bao giờ `START` SGLT2i hay `UPTITRATE` hạ áp khi `sbp === undefined`, và không báo `CONTINUE: Đạt mục tiêu` khi `sbp < 100 mmHg` (`CKD-R2-R1-02`).
3. **Bổ sung quy tắc trụ cột thứ 4 `ckd.outpatient.glp1ra_indication` (`semaglutide`)** cho bệnh nhân T2D + CKD theo KDIGO 2024 Rec 3.9.1 (1B), KDIGO 2025 Commentary (FLOW), ESC 2026 Table 12 (Class I-A) và BYT 2024 (`CKD-R2-R1-03`).
4. **Sửa điều kiện `refractoryK` trong `emergency_dialysis_indication`** (chỉ chỉ định đặt catheter/RRT cấp cứu vì `K⁺ ≥ 6.5` khi đang lọc máu chu kỳ `onDialysis` hoặc kháng trị nội khoa `refractoryHyperkalemia`, hoặc đi kèm vô niệu/quá tải dịch/urê huyết cao) và sửa bản dịch `quoteVi` của `ukka.2022.guideline_18_1_emergency_dialysis` (`CKD-R2-R1-04`).
5. **Hoàn thiện liên chuyên khoa Finerenone**: Không tự động khởi trị Finerenone ở BN `HFrEF (LVEF ≤ 40%)` khi chạy đơn lẻ module `ckd`; hỗ trợ chuẩn độ lên `40 mg/ngày` (`K⁺ < 5.0`) ở BN đồng mắc `HFmrEF/HFpEF (LVEF ≥ 40%, eGFR ≥ 60)`; rút gọn lại tiêu đề khuyến cáo (`CKD-R2-R1-05`).
6. **Tách riêng nhánh `profile === 'US'` trong `bp_target`** theo AHA/ACC 2025 (`< 130/80 mmHg`, kiểm tra cả `DBP < 80`) và điều chỉnh lời giải thích cho nhóm `eGFR < 30` theo ESC 2026 (`CKD-R2-R1-06`).
7. **Gắn `setting: 'inpatient'` cho Preset 3 & 4 và sửa luồng nạp Preset trong `AppShell.tsx`**, đồng thời dọn sạch lỗi fallback tên thuốc `m.name || drug(m.drugId).nameVi` (`CKD-R2-R1-07`, `CKD-R2-R1-08`) và tinh chỉnh các điểm `minor` (`CKD-R2-R1-09..11`).

### KẾT LUẬN CUỐI CÙNG (FINAL VERDICT): **FAIL**
*(Thống kê: **2 Critical, 5 Major, 4 Minor, 1 Suggestion**)*
