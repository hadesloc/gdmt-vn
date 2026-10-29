# Báo cáo Phản biện Độc lập Vòng 2 – Module Đái tháo đường típ 2 (`dm2`)
**Vai trò:** Reviewer R1 – Chuyên gia Nội tiết Độc lập & Kiểm định Hướng dẫn Điều trị (Guideline Checker)  
**Vòng đánh giá:** Round 2 (Độc lập – Không đọc báo cáo của R2/R3 cùng vòng)  
**Ngày thực hiện:** 2026-10-27  
**Phạm vi kiểm định:**
- Mã nguồn module: [`src/modules/dm2/index.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/index.ts), [`inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts), [`rules.inpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts), [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts), [`matrix.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/matrix.ts), [`pathway.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/pathway.ts), [`presets.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/presets.ts)
- Cơ sở tri thức (KB): [`kb/citations/dm2.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/dm2.json) (94 trích dẫn), [`kb/thresholds/dm2.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/dm2.json) (81 ngưỡng), 22 thuốc sở hữu bởi `dm2` (+ 3 thuốc SGLT2i dùng chung) trong `kb/drugs/*.json`, [`kb/interactions/diabetes_respiratory.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/interactions/diabetes_respiratory.json)
- Đối chiếu nguyên văn PDF gốc trong `Medical_Library_2026`: ADA Standards of Care 2026 (Ch. 6, 9, 10, 11, 12, 13, 15, 16), Đồng thuận Quốc tế DKA/HHS 2024 (ADA/EASD/JBDS/AACE/DTS), KDIGO 2022 Diabetes in CKD & KDIGO 2025 GLP-1 Commentary, ESC 2023 Diabetes & CVD, Bộ Y tế QĐ 5481/QĐ-BYT (2020) & QĐ 1353/QĐ-BYT (2021), cùng nhãn FDA/EMA chính thức.
- Kiểm định thực nghiệm động: Chạy trực tiếp `evaluate(patient, settings)` qua 3 script kiểm định độc lập trong `docs/reviews/dm2/scratch/` (`round2_r1_kb_audit.ts`, `round2_r1_pdf_guidelines.ts`, `round2_r1_evaluate_audit.ts`, `round2_r1_scr_and_pdfs.ts`).

---

## 1. Tóm tắt Điều hành & Chỉ số Kiểm định Định lượng

| Hạng mục kiểm định | Kết quả định lượng | Đánh giá |
|---|---|---|
| **Kiểm tra tĩnh QA-8 / QA-10 (`rulesLint` + `thFor`)** | `0` lỗi lint trên cả 7 tệp TypeScript; `81/81` ngưỡng có trường `quantity` hợp lệ | Đạt chuẩn kỹ thuật |
| **Đối chiếu chữ-đối-chữ 94 trích dẫn (`kb/citations/dm2.json`)** | `94/94` khớp nguyên văn chính xác trang PDF (`exact=94, ±1page=0, failed=0`) | Đạt khớp chuỗi ký tự, **nhưng phát hiện 5 ngưỡng và 13 thuốc trích dẫn sai ngữ cảnh y khoa** (`DM2-R1-213`, `DM2-R1-214`) |
| **Xác minh 48 lỗi Vòng 1 (`R1`: 15, `R2`: 16, `R3`: 17)** | **39/48 ĐÃ KHẮC PHỤC TRIỆT ĐỂ (`FIXED`)**, **9/48 KHẮC PHỤC MỘT PHẦN (`PARTIALLY FIXED`)** | Có tiến bộ rất lớn sau Vòng 1, nhưng một số bản vá sinh ra lỗ hổng biên mới |
| **Phát hiện mới / tồn đọng Vòng 2 (`round2_R1.json`)** | **18 phát hiện:** **`5 critical`**, **`9 major`**, **`3 minor`**, **`1 suggestion`** | **Chưa đạt chuẩn an toàn lâm sàng (`FAIL`)** |

### Điểm sáng ghi nhận sau đợt sửa Vòng 1
1. Đã khắc phục dứt điểm lỗi nguy hiểm đặt lại liều `START 10 đơn vị/ngày` ở bệnh nhân ngoại trú đang tiêm sẵn insulin liều cao (`extractBasalInsulinInfo` chuyển sang `UPTITRATE` hoặc gợi ý phối hợp bolus/GLP-1 RA khi quá ngưỡng `0.5 U/kg/ngày`).
2. Đã bổ sung dược chất `insulin_regular` vào KB và gắn cổng an toàn fail-closed `HOLD insulin_regular` khi thiếu `K⁺` hoặc `K⁺ < 3.5 mmol/L` trong nội viện, đồng thời sửa tiêu đề Kali động khi `K⁺ > 5.0 mmol/L`.
3. Đã sinh tự động đầy đủ quy tắc an toàn cá thể hóa từng hoạt chất cho **Thai kỳ** (14 thuốc viên/tiêm không phải insulin + khởi trị Insulin đầu tay), **Cảnh báo hộp đen MTC/MEN 2** (cả 5 thuốc incretin), **Suy tim** (tách độc lập `STOP` Pioglitazone và `STOP` Saxagliptin), **Hạ đường huyết cấp `< 3.9 mmol/L`** (tạm ngừng SU/Insulin + cảnh báo dùng Glucose đơn phân tử khi đang uống Acarbose), **Chu phẫu SGLT2i** (`setting: 'both'` cho cả 3 hoạt chất), và **Chống chỉ định gan Vildagliptin** (`ALT/AST > 3× ULN`).
4. Đã bổ sung `profileDiff` thực chất giữa `VN` và `INTL` (ngưỡng BMI Châu Á `25 kg/m²`, đích HA `< 140/90` vs `< 130/80 mmHg` ở ĐTĐ chưa biến chứng, ưu tiên bậc 1 Metformin theo QĐ 5481/QĐ-BYT).

### Các lỗ hổng an toàn người bệnh nghiêm trọng (`Critical` & `Major`) buộc phải xử lý trước khi nghiệm thu
1. **`DM2-R1-201` (`critical` – Vùng chết Boolean bỏ sót DKA/HHS hỗn hợp & truyền thiếu 50% liều insulin):** Bệnh nhân nội trú có `glucose >= 33.3 mmol/L` + `effectiveOsmolality > 300 mOsm/kg` **kèm toan chuyển hóa** (`pH < 7.30` hoặc `HCO₃⁻ < 18`) nhưng chưa có `bloodKetones >= 3.0` bị cả `isDka` lẫn `isHhs` trả về `false` -> bỏ sót hoàn toàn cấp cứu và bị kê tiêm dưới da Glargine + Aspart thường quy! Kể cả khi gán `dkaSuspected: true`, biến `isHhsPure` bỏ qua `pH`/`HCO₃⁻`, chỉ định nhầm nửa liều `0.05 U/kg/h` thay vì `0.1 U/kg/h`.
2. **`DM2-R1-202` (`critical` – Euglycemic DKA truyền `0.1 U/kg/h` Regular insulin + NaCl 0.9% đơn thuần không có Dextrose 5–10% ngay từ đầu):** Khi `glucose < 11.1 mmol/L` (vd `8.5 mmol/L`), phác đồ vẫn dặn *"Khởi đầu NaCl đẳng trương... khi glucose giảm < 13.9 mmol/L mới thêm Dextrose"* trong khi truyền ngay `7.0 U/h` Regular insulin -> gây hạ đường huyết nặng cấp tính (vi phạm Fig. 4 & Table 4 Đồng thuận 2024).
3. **`DM2-R1-203` (`critical` – Tăng ceton máu đơn độc không kèm toan chuyển hóa vẫn truyền Regular insulin TM `0.1 U/kg/h`):** Biến `hasSevereKetonemia` (`BOHB >= 3.0`) đi tắt qua điều kiện toan chuyển hóa, khiến bệnh nhân nhịn đói (`glucose = 5.2 mmol/L`, `pH = 7.41`, `HCO₃⁻ = 24`) vẫn bị bơm Regular insulin TM `7.0 U/h`.
4. **`DM2-R1-204` (`critical` – Cơn DKA/HHS ở chế độ Ngoại trú, bao gồm chính Ca mẫu số 4 trên UI, phát lệnh `START Insulin Glargine` khi `K⁺ = 3.1 mmol/L` + `START Dapagliflozin` + `START Metformin`):** Các luật ngoại trú không chặn `isHyperglycemicCrisis(ctx)` và thiếu luật `REFER` cấp cứu ngoại trú.
5. **`DM2-R1-205` (`critical` – Bỏ qua trường chuẩn `Patient.na` và `Patient.hco3` khiến ca sốc HHS chuẩn `icu_hhs_hyperosmolar_0210.json` bị bỏ sót và kê insulin tiêm dưới da):** Không tính `2 × Na⁺ + glucose` và không fallback `ctx.normalized.hco3`.
6. **9 lỗi `major` (`DM2-R1-206` đến `DM2-R1-214`):** Kê NPH `0.2 U/kg` cho người không tăng đường huyết / đang NPO và triệt tiêu insulin nền nội trú khi dùng corticoid (`206`); tùy chọn nuôi ăn sonde liên tục `'tube_feeding'` bị rơi vào nhánh tiêm Aspart 3 bữa ăn chính (`207`); không dùng `hasCondition` làm mất hoàn toàn GLP-1 RA / SGLT2i / Statin cao / Aspirin ở bệnh nhân đột quỵ `strokeOrTia: true` (`208`); thiếu hoàn toàn quy tắc phối hợp thuốc bậc 2 khi `HbA1c 7.0–9.9%` trên nền Metformin ở ĐTĐ2 thể gầy không biến cố tim-thận (`209`); thiếu `unitKey: 'glucose'` và tiêu đề tự mâu thuẫn `0.27 U/kg/ngày (> 0.5 U/kg/ngày)` ở `overbasalization` (`210`); khuyến cáo Statin thường quy cho người `< 40` tuổi và ghi nhầm Rec 10.20 (`211`); không thực thi chống chỉ định viêm tụy cấp với 9 thuốc incretin/DPP-4i (`212`); 5 ngưỡng trích dẫn sai ngữ cảnh như lấy bảng tăng cân thai kỳ làm chuẩn BMI Châu Á (`213`); và 13 tệp thuốc gắn trích dẫn chống chỉ định sai chuyên mục (`214`).

---

## 2. Bảng Kiểm chứng 100% Khắc phục Vòng 1 (48/48 Mục)

### 2.1. Đối chiếu 15 phát hiện của R1 Vòng 1 (`round1_R1.md`)

| Mã Vòng 1 | Nội dung tóm tắt | Trạng thái Vòng 2 | Bằng chứng xác minh trên code & `evaluate()` |
|---|---|---|---|
| `DM2-R1-01` | Bỏ sót Euglycemic DKA khi `glucose < 11.1 mmol/L` | **PARTIALLY FIXED** | Đã nhận diện chẩn đoán euDKA qua `isDm`, **nhưng** y lệnh truyền dịch chưa thêm ngay Dextrose 5–10% từ đầu (`-> DM2-R1-202`) và `ketones >= 3.0` kích hoạt nhầm khi không toan (`-> DM2-R1-203`). |
| `DM2-R1-02` | `early_insulin` reset bệnh nhân đang tiêm insulin về `START 10 U` | **FIXED** | `extractBasalInsulinInfo()` nhận diện đúng liều nền đang dùng, phát `UPTITRATE` từ `30 U` hoặc `CONSIDER` thêm bolus/GLP-1 RA khi `> 0.5 U/kg`. |
| `DM2-R1-03` | Kê Basal-Bolus tiêm dưới da chồng lên DKA/HHS/ICU | **PARTIALLY FIXED** | Đã chặn khi `isHyperglycemicCrisis(ctx) \|\| isIcuSetting(ctx)`, **nhưng** vùng chết Mixed DKA/HHS và thiếu `2*Na + glucose` vẫn để lọt ca cấp cứu tại khoa thường (`-> DM2-R1-201`, `DM2-R1-205`). |
| `DM2-R1-04` | Thiếu cổng fail-closed `K⁺` trước truyền insulin DKA | **FIXED** (Nội viện) | `k === undefined` phát `HOLD insulin_regular` (`rec_dm2_dka_need_k_before_insulin`); lưu ý lỗ hổng khi ở chế độ ngoại trú (`-> DM2-R1-204`). |
| `DM2-R1-05` | `cardiorenal_glp1` bỏ sót CKD có albumin niệu (`UACR >= 3`) | **FIXED** | `hasGlp1CardiorenalIndication()` đã kiểm tra `uacr >= thFor('uacr', 'ckd.uacr.a1_max_mgmmol')`. |
| `DM2-R1-06` | Không tạm ngừng SGLT2i và Sulfonylurea khi nhập viện cấp | **FIXED** | `inpatientAcuteSglt2iHoldRules` và `inpatientAcuteSuHoldRules` phát `HOLD` đầy đủ. |
| `DM2-R1-07` | `overbasalization` không đọc liều insulin từ `currentMeds` | **PARTIALLY FIXED** | Đã đọc `currentMeds`, **nhưng** `bedtimeToMorningDiff` thiếu quy đổi `mg/dL` và in tiêu đề mâu thuẫn `0.27 > 0.5` (`-> DM2-R1-210`). |
| `DM2-R1-08` | Tiêu chuẩn HHS dùng tổng ALTT `> 320` thay vì hiệu dụng `> 300` & tốc độ `0.05 U/kg/h` | **PARTIALLY FIXED** | Đã thêm ngưỡng `> 300` và tốc độ `0.05 U/kg/h`, **nhưng** `isHhsPure` phân loại nhầm DKA/HHS hỗn hợp có toan chuyển hóa (`-> DM2-R1-201`). |
| `DM2-R1-09` | Vi phạm QA-10 dùng `th()` trần thay vì `thFor(quantity, id)` | **FIXED** | `81/81` ngưỡng có `quantity`; `rulesLint` báo `0` vi phạm. |
| `DM2-R1-10` | Đích đường huyết ICU thiếu dải chuẩn `7.8–10.0 mmol/L (140–180 mg/dL)` | **FIXED** | `dm2.inpatient.glycemic_target` hiển thị chính xác `7.8 – 10.0 mmol/L (140–180 mg/dL)` khi `isIcuSetting(ctx) === true`. |
| `DM2-R1-11` | Trích dẫn sai ngữ cảnh (Pioglitazone HF, Sitagliptin thận) | **PARTIALLY FIXED** | Hai trích dẫn cụ thể đó đã sửa, **nhưng** rà soát toàn bộ PDF phát hiện 5 ngưỡng và 13 tệp thuốc vẫn gắn trích dẫn sai ngữ cảnh (`-> DM2-R1-213`, `DM2-R1-214`). |
| `DM2-R1-12` | Gộp chung HA, Statin và Aspirin vào một luật duy nhất | **FIXED** | Đã tách thành 3 luật độc lập (`comprehensive_care`, `statin_prevention`, `aspirin_secondary`); cần sửa thêm phân tầng tuổi `< 40` của Statin (`-> DM2-R1-211`). |
| `DM2-R1-13` | Cấp cứu hạ đường huyết khi dùng Acarbose không cấm đường mía (sucrose) | **FIXED** | `hypoglycemia_protocol` phát cảnh báo đỏ bắt buộc dùng Glucose/Dextrose đơn phân tử. |
| `DM2-R1-14` | Chưa trích dẫn Quyết định `1353/QĐ-BYT` (2021) | **FIXED** | Đã bổ sung `byt.dm2.2021.inpatient_insulin_1353` vào KB và gắn vào `basal_bolus_regimen` + `matrix.ts`. |
| `DM2-R1-15` | Không có bất kỳ `profileDiff` nào giữa `VN` và `INTL` | **FIXED** | Đã triển khai `profileDiff` và thay đổi hành vi thực tế theo chuẩn Châu Á / Bộ Y tế ở 5 luật cốt lõi. |

### 2.2. Đối chiếu 16 phát hiện của R2 Vòng 1 (`round1_R2.md`)

| Mã Vòng 1 | Nội dung tóm tắt | Trạng thái Vòng 2 | Bằng chứng xác minh trên code & `evaluate()` |
|---|---|---|---|
| `DM2-R2-01` | Bổ sung luật `STOP` Gliclazide, Glimepiride, Acarbose khi `eGFR < 30` | **FIXED** | `severeRenalStopRules` phát `[STOP]` chính xác cho cả 3 thuốc (lưu ý sửa trích dẫn AGI trên SU ở `DM2-R1-214`). |
| `DM2-R2-02` | Bổ sung cổng thận `eGFR >= 15` cho GLP-1 RA | **PARTIALLY FIXED** | Đã chặn khởi trị mới khi `eGFR < 15`, **nhưng** trích dẫn `ada.dm2.2026.flow_egfr_15` là định nghĩa kết cục nghiên cứu chứ không phải khuyến cáo kê đơn (`-> DM2-R1-213`). |
| `DM2-R2-03` | Chặn tuyệt đối MTC/MEN 2 (`STOP` & `AVOID`) cho cả 5 thuốc incretin | **FIXED** | `mtcMen2StopRules` + `cardiorenal_glp1` hoạt động chính xác trên cả `evaluate()` ngoại trú và nội viện. |
| `DM2-R2-04` | Tạo `kb/drugs/insulin_regular.json` và gắn `drugId` cho DKA/HHS | **FIXED** | Đã tạo tệp thuốc chuẩn và gắn `drugId: 'insulin_regular'`. |
| `DM2-R2-05` | Tách tốc độ insulin và tiêu chuẩn lui bệnh HHS vs DKA | **PARTIALLY FIXED** | Tách đúng ở ca đơn thuần, **nhưng** lỗi `isHhsPure` ở ca DKA/HHS hỗn hợp (`-> DM2-R1-201`). |
| `DM2-R2-06` | Chuẩn hóa `gliclazide.json` sang dạng phóng thích có kiểm soát MR 30–120 mg | **FIXED** | Đã loại bỏ hàm lượng IR 80–320 mg gây nhầm lẫn. |
| `DM2-R2-07` | Tách riêng y lệnh bolus bữa ăn `insulin_aspart` khỏi `insulin_glargine` nội viện | **FIXED** | Đã tách thành `prandial_bolus_regimen` (lưu ý bổ sung nhánh `'tube_feeding'` ở `DM2-R1-207`). |
| `DM2-R2-08` | Mở rộng tạm ngừng SGLT2i chu phẫu cho cả 3 thuốc & tiền phẫu ngoại trú | **FIXED** | `perioperativeSglt2iHoldRules` (`setting: 'both'`) hoạt động đúng. |
| `DM2-R2-09` | Trì hoãn thêm GLP-1 RA mới & xuống thang cụ thể ở người cao tuổi suy yếu | **FIXED** | `isOvertreatedFrailDeferral()` phát `DEFER`; `deintensification` giảm liều đích danh từng thuốc. |
| `DM2-R2-10` | Phủ kín quy tắc `STOP` thai kỳ cho mọi thuốc viên/GLP-1 RA + khởi trị Insulin | **FIXED** | `pregnancyStopRules` (14 thuốc) + `pregnancy_insulin` hoạt động đầy đủ. |
| `DM2-R2-11` | Bổ sung chống chỉ định suy gan / `ALT > 3× ULN` cho Vildagliptin | **FIXED** | `dm2.safety.vildagliptin_hepatic_stop` + `customInputs.altUlnTimes` hoạt động chính xác. |
| `DM2-R2-12` | Sửa ngưỡng giảm liều thận Saxagliptin thành `eGFR <= 45` (`2.5 mg/ngày`) | **FIXED** | Đã cập nhật chính xác trong `kb/drugs/saxagliptin.json` theo nhãn FDA Onglyza. |
| `DM2-R2-13` | Sinh tự động Ma trận thận cho đủ 22 thuốc ĐTĐ từ `DrugEntry.renal` | **FIXED** | `DM2_MATRIX_DRUG_IDS` (22 thuốc) sinh tự động qua `renalBand()`. |
| `DM2-R2-14` | Đồng bộ quy đổi `mmol/L` và `mg/dL` trong đích đường huyết nội viện | **FIXED** | Nội suy đồng bộ hoàn toàn từ `kb/thresholds/dm2.json`. |
| `DM2-R2-15` | Bổ sung tương tác thuốc ĐTĐ trọng yếu vào `diabetes_respiratory.json` | **FIXED** | Đã có đủ 6 cặp tương tác lâm sàng cốt lõi của ĐTĐ. |
| `DM2-R2-16` | Xóa số cứng (magic numbers) trong chuỗi hiển thị của module | **FIXED** | `0` lỗi trên trình kiểm tra tĩnh `rulesLint`. |

### 2.3. Đối chiếu 17 phát hiện của R3 Vòng 1 (`round1_R3.md`)

| Mã Vòng 1 | Nội dung tóm tắt | Trạng thái Vòng 2 | Bằng chứng xác minh trên code & `evaluate()` |
|---|---|---|---|
| `R3-DM2-01` | Chặn `START` và phát `STOP` GLP-1/GIP-GLP-1 RA khi có MTC/MEN 2 | **FIXED** | Đã xác minh qua kịch bản `R1-CHECK-D`. |
| `R3-DM2-02` | Phát `STOP` toàn bộ thuốc hạ đường huyết không phải insulin khi mang thai | **FIXED** | Đã xác minh qua kịch bản `R1-CHECK-E`. |
| `R3-DM2-03` | Khởi trị/duy trì Insulin đầu tay + đích HbA1c thai kỳ `< 6.5%` | **FIXED** | Đã xác minh qua kịch bản `R1-CHECK-E`. |
| `R3-DM2-04` | Tạm ngừng khẩn cấp SU & Insulin đang dùng khi hạ ĐH cấp `< 3.9 mmol/L` | **FIXED** | `acuteHypoHoldRules` phát `HOLD` ưu tiên `100` (`R1-CHECK-F`). |
| `R3-DM2-05` | Không phát `START 10 U` đè lên bệnh nhân đã dùng insulin | **FIXED** | Đã xác minh qua kịch bản `R1-CHECK-A`. |
| `R3-DM2-06` | Tách độc lập luật `STOP` Pioglitazone và `STOP` Saxagliptin ở suy tim | **FIXED** | Khi dùng đồng thời cả hai thuốc, cả hai đều nhận lệnh `STOP` (`R1-CHECK-G`). |
| `R3-DM2-07` | Tự động `STOP` DPP-4i ngay cả khi engine mới phát lệnh `START` GLP-1 RA | **FIXED** | `willStartOrContinueGlp1()` bắt chính xác cả hai chiều. |
| `R3-DM2-08` | Chặn Basal-Bolus dưới da khi đang DKA/HHS hoặc nằm ICU | **PARTIALLY FIXED** | Đã chặn ở ICU và DKA/HHS điển hình; còn lọt Mixed DKA/HHS và `Patient.na`/`hco3` (`-> DM2-R1-201`, `DM2-R1-205`). |
| `R3-DM2-09` | Fail-closed `HOLD insulin_regular` khi DKA chưa có kết quả `K⁺` | **FIXED** | Đã xác minh qua kịch bản `R1-CHECK-C`. |
| `R3-DM2-10` | Không ghi `"Bù Kali"` trên tiêu đề DKA khi `K⁺ > 5.0 mmol/L` | **FIXED** | Hiển thị `"Chưa bù Kali (K⁺ > 5.0)"` (`R1-CHECK-C3`). |
| `R3-DM2-11` | Tạm ngừng SGLT2i trước mổ chạy ở cả chế độ ngoại trú tiền phẫu | **FIXED** | Đã xác minh qua kịch bản `R1-CHECK-H`. |
| `R3-DM2-12` | Mở rộng phác đồ NPH do steroid sang cả ngoại trú (`setting: 'both'`) | **PARTIALLY FIXED** | Đã chạy ở cả 2 bối cảnh, **nhưng** thiếu điều kiện tăng đường huyết, chạy cả khi NPO và triệt tiêu nền nội trú (`-> DM2-R1-206`). |
| `R3-DM2-13` | Tạm ngừng truyền Regular insulin TM nếu hạ ĐH `< 3.9 mmol/L` trong DKA | **FIXED** | `rec_dm2_dka_hold_insulin_hypoglycemia` (dòng 613–637) hoạt động đúng. |
| `R3-DM2-14` | Xuống thang đích danh hoạt chất và liều cụ thể cho SU + Insulin | **FIXED** | Đã xác minh trên `Preset 3` (`REDUCE` nửa liều Glimepiride + giảm 20% Glargine từ 28 U -> ~22 U). |
| `R3-DM2-15` | Phát hiện điều trị quá mức (`HbA1c < 6.5%`) ở người `>= 65` tuổi dùng SU/Insulin | **FIXED** | Biến `isElderlyOvertreated` (dòng 1339–1343) hoạt động đúng. |
| `R3-DM2-16` | Rút gọn tiêu đề SGLT2i / GLP-1 RA không lặp lại mô tả liều dài dòng | **FIXED** | Tiêu đề ngắn gọn, rõ ràng. |
| `R3-DM2-17` | Tạo khác biệt lâm sàng thực sự khi chuyển đổi Profile `VN` vs `INTL` | **FIXED** | Đã xác minh qua kịch bản `BUG-9` (BMI 25.7 kích hoạt GLP-1 RA ở `VN`, đích HA `< 140/90`, ưu tiên Metformin `96`). |

---

## 3. Chi tiết Các Phát hiện Vòng 2 (`DM2-R1-201` – `DM2-R1-218`)

### Nhóm `CRITICAL` (5 phát hiện – Nguy cơ gây hại trực tiếp cho bệnh nhân nếu làm theo)

#### `[DM2-R1-201]` (CRITICAL | `rule` | `dm2.inpatient.dka_hhs_emergency`) — Vùng chết Boolean bỏ sót hoàn toàn thể hỗn hợp DKA/HHS (Mixed DKA/HHS) VÀ truyền thiếu 50% liều Regular insulin (`0.05` thay vì `0.1 U/kg/h`)
- **Vị trí mã nguồn:** [`evaluateHyperglycemicCrisis`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L54-L79) và [`dka_hhs_emergency`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L605-L724).
- **Phân tích lâm sàng & kỹ thuật:**
  1. **Vùng chết Boolean (`isCrisis === false`):** `isDka` bắt buộc `ketones >= 3.0 mmol/L`, trong khi `isHhs` (dòng 68–69) lại bắt buộc `(ph === undefined || ph >= 7.3) && (bicarb === undefined || bicarb >= 18)`. Khi bệnh nhân vào viện với `glucose >= 33.3 mmol/L`, `effectiveOsmolality > 300 mOsm/kg` **kèm toan chuyển hóa** (`venousPh < 7.30` hoặc `serumBicarb < 18 mmol/L`), nhưng chưa có kết quả `bloodKetones` (hoặc cơ sở chỉ làm ceton niệu `≥ 2+`, hoặc `bloodKetones = 2.2 mmol/L` kèm toan lactic), **cả `isDka` lẫn `isHhs` đều bằng `false`**. Tại khoa thường, bệnh nhân DKA/HHS hỗn hợp (tỷ lệ tử vong cao nhất 8–25%) bị bỏ sót cấp cứu hoàn toàn và bị kê tiêm dưới da `Insulin Glargine` + `Insulin Aspart` thường quy!
  2. **Truyền thiếu 50% liều insulin và sai tiêu chuẩn lui bệnh (`isHhsPure`):** Kể cả khi gán `dkaSuspected: true`, biến `isHhsPure` (`osmolality > 300 && (ketones === undefined || ketones < 3.0)`, dòng 605–608) bỏ qua hoàn toàn `pH < 7.30` và `HCO₃⁻ < 18`, phân loại nhầm ca toan nặng thành `"HHS đơn thuần"`, chỉ định tốc độ `0.05 U/kg/h` thay vì `0.1 U/kg/h` và bỏ qua tiêu chuẩn hết toan khi chuyển sang tiêm dưới da.
- **Bằng chứng gốc:**
  - *ADA/EASD/JBDS/AACE/DTS 2024 Hyperglycemic Crises Consensus Report* (`ADA_2024_Hyperglycaemic_Crises_Consensus.pdf`, tr. 1266 / PDF tr. 10):
    > *"If HHS is present in a person with ... effective serum osmolality >300 mOsm/kg ... and without acidosis (pH ≥7.3 and bicarbonate ≥18 mmol/L), then a fixed-rate intravenous insulin infusion should be started at 0.05 units/kg/h. If significant ketonemia is present (i.e., β-hydroxybutyrate ≥3.0 mmol/L, ketonuria ≥2+, pH <7.30, or bicarbonate <18 mmol/L), which represents mixed DKA/HHS, then a fixed-rate intravenous insulin infusion should be started at 0.1 units/kg/h."*
  - **Kết quả chạy `evaluate()` thực tế:** Input nội viện khoa thường `{ glucose: 40.0, k: 4.5, weight: 70, customInputs: { effectiveOsmolality: 330, venousPh: 7.18, serumBicarb: 12 } }` -> không phát `dka_hhs_emergency`, phát `[START] insulin_glargine (11 U)` + `[START] insulin_aspart (3 U × 3 bữa)`. Khi thêm `dkaSuspected: true` -> phát `Phác đồ Cấp cứu HHS` tốc độ sai `3.5 U/h (0.05 U/kg/h)`.
- **Hướng khắc phục:** Tách `isPureHhs` (`!hasAcidosis && !hasKetonemia`) và `isMixedDkaHhs` (`hasAcidosis || hasKetonemia`); đưa cả hai vào `isCrisis` và sửa `isHhsPure` yêu cầu bắt buộc `!hasAcidosis && !hasKetonemia`.

---

#### `[DM2-R1-202]` (CRITICAL | `rule` | `dm2.inpatient.dka_hhs_emergency`) — Euglycemic DKA (`glucose < 11.1 mmol/L`) vẫn chỉ định truyền Regular insulin `0.1 U/kg/h` với NaCl đẳng trương đơn thuần mà không truyền song song ngay Dextrose 5%–10% từ phút đầu
- **Vị trí mã nguồn:** [`dka_hhs_emergency.produce`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L693-L710) và [dòng 758–760](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L758-L760).
- **Phân tích lâm sàng:** Ở bệnh nhân Euglycemic DKA do SGLT2i (vd `glucose = 8.5 mmol/L` [153 mg/dL], `BOHB = 4.2`, `pH = 7.18`, `HCO₃⁻ = 11`, `K⁺ = 4.2`), đường huyết ban đầu **đã thấp hơn cả ngưỡng `11.1 mmol/L` lẫn `13.9 mmol/L`**. Thế nhưng phác đồ vẫn phát nguyên văn y lệnh của DKA tăng đường huyết: truyền Regular insulin `7.0 U/h (0.1 U/kg/h)` kèm *"Khởi đầu NaCl đẳng trương... khi glucose giảm < 13.9 mmol/L (250 mg/dL), THÊM Dextrose"*. Truyền `7.0 U/h` insulin tĩnh mạch với NaCl 0.9% đơn thuần vào bệnh nhân có đường huyết `6.0–8.5 mmol/L` sẽ gây tụt đường huyết thảm khốc ngay trong giờ đầu tiên.
- **Bằng chứng gốc:**
  - *ADA 2024 Hyperglycemic Crises Consensus Report*, Fig. 4 (tr. 1264 / PDF tr. 8) & Table 4 (tr. 1270 / PDF tr. 14):
    > *"In euglycemic DKA (glucose <200 mg/dL and positive BOHB), 5% or 10% dextrose needs to be started alongside 0.9% NaCl/crystalloid at the start of the insulin treatment."*
- **Hướng khắc phục:** Khi `glucose !== undefined && glucose < thFor('glucose', 'dm2.dka.dextrose_glucose_threshold_mmol')` (đặc biệt `< 11.1 mmol/L` – Euglycemic DKA), đổi ngay tiêu đề, `dose` và `fluidAdvice` sang **BẮT BUỘC truyền song song ngay từ đầu Dextrose 5%–10% cùng dịch tinh thể đẳng trương ngay thời điểm khởi động bơm tiêm điện Regular insulin** (và cân nhắc tốc độ insulin `0.05–0.1 U/kg/h` theo đáp ứng đường huyết).

---

#### `[DM2-R1-203]` (CRITICAL | `rule` | `dm2.inpatient.dka_hhs_emergency`) — Tăng ceton máu đơn độc (`bloodKetones >= 3.0 mmol/L`) không kèm toan chuyển hóa (`pH >= 7.30` và `HCO₃⁻ >= 18`) vẫn kích hoạt bơm tiêm điện Regular insulin `0.1 U/kg/h`
- **Vị trí mã nguồn:** [`evaluateHyperglycemicCrisis`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L71-L78) và [`dka_hhs_emergency.when`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L590-L592).
- **Phân tích lâm sàng:** Biến `hasSevereKetonemia` (`ketones >= 3.0`) đi tắt qua `isDka`, bỏ qua hoàn toàn điều kiện bắt buộc phải có toan chuyển hóa (`hasAcidosis`). Bệnh nhân nhiễm ceton do nhịn đói hoặc ăn kiêng ketogenic có `glucose = 5.2 mmol/L`, `venousPh = 7.41`, `serumBicarb = 24 mmol/L`, `bloodKetones = 3.2 mmol/L` bị chẩn đoán nhầm là DKA và nhận lệnh `[START] Regular insulin 7.0 U/h (0.1 U/kg/h)`.
- **Bằng chứng gốc:**
  - *ADA 2024 Hyperglycemic Crises Consensus Report* (tr. 1262 / PDF tr. 6) & *ADA 2026 SOC 16* (tr. S347 / PDF tr. 9):
    > *"All three components must be present to make this diagnosis. ... Hyperglycemia and/or diabetes must be accompanied by two additional criteria—elevated ketones and metabolic acidosis—for the diagnosis of DKA to be established."*
- **Hướng khắc phục:** Xóa bỏ nhánh kích hoạt truyền insulin DKA khi đã có bằng chứng không toan chuyển hóa (`ph >= 7.30 && bicarb >= 18`); nếu `ketones >= 3.0` nhưng chưa nhập `venousPh` và `serumBicarb`, phát khuyến cáo fail-closed yêu cầu xét nghiệm khẩn khí máu tĩnh mạch và điện giải đồ trước khi truyền insulin liều DKA.

---

#### `[DM2-R1-204]` (CRITICAL | `rule` | `dm2.outpatient.early_insulin`) — Bệnh nhân đang DKA/HHS ở chế độ Ngoại trú (kể cả khi bấm chọn chính Ca mẫu số 4 `dm2_preset_inpatient_dka_emergency` trên UI!) bị chỉ định `START Insulin Glargine` khi `K⁺ = 3.1 mmol/L` + `START Dapagliflozin` + `START Metformin` thay vì `REFER` cấp cứu
- **Vị trí mã nguồn:** [`presets.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/presets.ts#L132-L163), [`AppShell.tsx`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/ui/AppShell.tsx#L43-L58), và các luật mạn tính trong [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L687-L1272).
- **Phân tích lâm sàng:** `AppShell` khởi tạo mặc định `setting: 'outpatient'` và không chuyển sang `'inpatient'` khi chọn Preset 4. Trong khi đó, `dka_hhs_emergency` chỉ chạy ở `'inpatient'`, còn cả 4 luật khởi trị mạn tính ngoại trú (`early_insulin`, `cardiorenal_sglt2i`, `cardiorenal_glp1`, `metformin`) đều không kiểm tra `isHyperglycemicCrisis(ctx)`. Do đó, khi bác sĩ phòng khám nhập một ca DKA/HHS cấp hoặc bấm chọn chính Ca mẫu 4 (`glucose = 23.5, pH = 7.18, HCO₃⁻ = 11, BOHB = 4.2, K⁺ = 3.1 mmol/L`), giao diện phát đồng thời:
  - `[START] Insulin Glargine 10 đơn vị/ngày` ngay khi **`K⁺ = 3.1 mmol/L < 3.5`** (vi phạm trực tiếp bất biến sống còn hoãn insulin khi hạ kali máu!);
  - `[START] Dapagliflozin 10 mg/ngày` ngay giữa cơn toan ceton (thúc đẩy DKA nặng thêm!);
  - `[START] Metformin 500 mg` ngay giữa cơn toan chuyển hóa nặng (`pH = 7.18, HCO₃⁻ = 11`, HA `96/60`);
  - `[START] Semaglutide 0.25 mg`, và **không có lệnh `REFER` chuyển Cấp cứu/ICU**.
- **Hướng khắc phục:** (1) Bổ sung luật `dm2.outpatient.hyperglycemic_crisis_refer` (`setting: 'outpatient'`, `priority: 100`) phát `[REFER]` chuyển Cấp cứu ngay + `HOLD` SGLT2i/Metformin/SU + cảnh báo cấm tiêm insulin khi chưa biết `K⁺ >= 3.5 mmol/L`; (2) Thêm `if (isHyperglycemicCrisis(ctx)) return false;` vào cả 4 luật khởi trị mạn tính ngoại trú; (3) Hỗ trợ tự chuyển `setting: 'inpatient'` cho Preset nội viện.

---

#### `[DM2-R1-205]` (CRITICAL | `rule` | `dm2.inpatient.dka_hhs_emergency`) — Bỏ qua hai trường xét nghiệm chuẩn `Patient.na` và `Patient.hco3`, làm bỏ sót hoàn toàn ca sốc HHS chuẩn `icu_hhs_hyperosmolar_0210.json` và kê nhầm insulin tiêm dưới da
- **Vị trí mã nguồn:** [`evaluateHyperglycemicCrisis`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L40-L45) và [`dka_hhs_emergency.produce`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L595-L598).
- **Phân tích lâm sàng:** Engine định nghĩa chuẩn `Patient.na` và `Patient.hco3` ([`src/engine/types.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L464-L465)), nhưng `evaluateHyperglycemicCrisis` chỉ đọc `customInputs.serumBicarb` và `customInputs.effectiveOsmolality` mà không fallback `need(ctx, 'hco3')` và không tính công thức chuẩn `2 × Na⁺ + glucose` (mmol/L) theo Fig. 2B Đồng thuận 2024. Khi chạy `evaluate()` trên ca chuẩn [`tests/golden/_from_oncall/icu_hhs_hyperosmolar_0210.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/tests/golden/_from_oncall/icu_hhs_hyperosmolar_0210.json) (`SBP = 84/50 mmHg, glucose = 38 mmol/L, na = 148 mmol/L -> ALTT hiệu dụng = 334 mOsm/kg > 300`), engine trả về `isCrisis = false` và kê tiêm dưới da `Insulin Glargine (8 U)` + `Insulin Aspart (3 U × 3 bữa)` cho bệnh nhân đang sốc HHS!
- **Hướng khắc phục:** Đọc `bicarb = need(ctx, 'serumBicarb') ?? need(ctx, 'hco3')` và tính `osmolality = need(ctx, 'effectiveOsmolality') ?? (na !== undefined && glucose !== undefined ? 2 * na + glucose : undefined)`.

---

### Nhóm `MAJOR` (9 phát hiện – Sai lệch hướng dẫn điều trị/liều, bỏ sót khuyến cáo Class I Mức A, hoặc sai ngữ cảnh trích dẫn)

#### `[DM2-R1-206]` (MAJOR | `rule` | `dm2.inpatient.steroid_induced_hyperglycemia`) — Khởi trị Insulin NPH `0.2 U/kg` cả khi không tăng đường huyết / không ĐTĐ, giữ nguyên liều NPH khi NPO, và triệt tiêu cứng insulin nền nội viện khi dùng steroid
- **Vị trí mã nguồn:** [`basal_bolus_regimen`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L272) và [`steroid_induced_hyperglycemia`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L473-L518).
- **Bằng chứng:** (1) `when(ctx)` chỉ kiểm tra `onSteroidTherapy` -> bệnh nhân có `glucose = 4.8 mmol/L, hba1c = 5.7%, dm = false` vẫn nhận `[START] Insulin NPH ~14 U (0.2 U/kg)`. (2) Khi `inpatientEating = 'npo'`, vẫn kê nguyên `14 U` NPH buổi sáng. (3) Dòng 272 (`if (onSteroidTherapy) return false;`) tắt hoàn toàn `basal_bolus_regimen` nội viện, trái với *ADA 2026 SOC 16* (tr. S346 / PDF tr. 8): *"NPH may be administered in addition to daily basal-bolus insulin... For long-acting glucocorticoids such as dexamethasone and multidose or continuous glucocorticoid use, long-acting basal insulin may be required."*

#### `[DM2-R1-207]` (MAJOR | `rule` | `dm2.inpatient.prandial_bolus_regimen`) — Tùy chọn nuôi ăn sonde liên tục `'tube_feeding'` không được xử lý trong luật, dẫn tới chỉ định tiêm nhanh Insulin Aspart `3 bữa ăn chính`
- **Vị trí mã nguồn:** [`inputs.ts` dòng 123](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts#L123) và [`prandial_bolus_regimen`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.inpatient.ts#L368-L428).
- **Bằng chứng:** Chạy `evaluate()` nội viện với `inpatientEating: 'tube_feeding'` xuất `[START] Chỉ định Insulin Aspart trước bữa ăn (5 đơn vị x 3 bữa chính)`. Theo *ADA 2026 SOC 16* (tr. S345 / PDF tr. 7), nuôi dưỡng liên tục qua ống thông không có 3 bữa chính mà phải chia Regular insulin mỗi 6 giờ (hoặc insulin nhanh mỗi 4 giờ / NPH mỗi 8–12 giờ) kèm cảnh báo truyền tĩnh mạch Dextrose ngay nếu gián đoạn nuôi ăn qua sonde.

#### `[DM2-R1-208]` (MAJOR | `rule` | `dm2.outpatient.cardiorenal_glp1`) — Không sử dụng `hasCondition(ctx, ...)` theo `MODULE_CONTRACT.md` §1.1 làm bỏ sót hoàn toàn GLP-1 RA (Class I, LOE A), SGLT2i, Statin cường độ cao và Aspirin ở bệnh nhân ĐTĐ có tiền sử Đột quỵ / TIA (`strokeOrTia: true`)
- **Vị trí mã nguồn:** Toàn bộ truy cập `ctx.patient.conditions?.ascvd` trong [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L191) (dòng 191, 630, 709, 1108, 1618, 1672, 1702).
- **Bằng chứng:** `CONDITION_SYNONYM_GROUPS.ascvd` trong [`src/engine/types.ts` dòng 381](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/engine/types.ts#L381) ánh xạ `strokeOrTia`, `stroke`, `tia`, `stroke_tia` vào `'ascvd'`. Tuy nhiên khi chạy `evaluate()` với `conditions: { dm: true, strokeOrTia: true }` (`BMI 22.0, eGFR 92, UACR 1.2`), module `dm2` bỏ sót hoàn toàn cả 4 khuyến cáo dự phòng thứ phát sau đột quỵ (`cardiorenal_glp1`, `cardiorenal_sglt2i`, Statin cường độ cao, `aspirin_secondary`).

#### `[DM2-R1-209]` (MAJOR | `missing` | `dm2.outpatient.glycemic_intensification`) — Thiếu hoàn toàn quy tắc phối hợp leo thang thuốc hạ đường huyết bậc 2–3 khi `HbA1c` vượt đích (`7.0%–9.9%`) trên nền Metformin ở bệnh nhân ĐTĐ típ 2 không kèm ASCVD/HF/CKD/béo phì
- **Vị trí mã nguồn:** [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts) đối chiếu với Bước 4 của [`pathway.ts` dòng 44–47](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/pathway.ts#L44-L47).
- **Bằng chứng:** Chạy `evaluate()` cho bệnh nhân ĐTĐ típ 2 thể gầy điển hình tại Việt Nam (`54 tuổi, BMI = 22.0 kg/m², eGFR = 98, UACR = 1.0, HbA1c = 8.8%`, đang uống `Metformin 2000 mg/ngày`) chỉ xuất `[CONTINUE] Tiếp tục duy trì Metformin` và `[MONITOR] Mục tiêu HbA1c < 7.0%` mà không đề xuất bất kỳ thuốc phối hợp bậc 2 nào (vi phạm trực tiếp *ADA 2026 SOC 9 Rec 9.15 [Grade A]* chống sức ỳ điều trị, *Rec 9.21 [Grade A]* và *QĐ 5481/QĐ-BYT Mục 3.4*).

#### `[DM2-R1-210]` (MAJOR | `rule` | `dm2.outpatient.overbasalization`) — Trường `bedtimeToMorningDiff` thiếu `unitKey: 'glucose'` (gây báo động giả ở chế độ `mg/dL`) VÀ tiêu đề hiển thị tự mâu thuẫn toán học `0.27 U/kg/ngày (> 0.5 U/kg/ngày)`
- **Vị trí mã nguồn:** [`inputs.ts` dòng 89–97](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts#L89-L97) và [`overbasalization`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1281-L1302).
- **Bằng chứng:** Chạy `evaluate()` với `weight: 75, Glargine 20 U, units.glucose = 'mg_dL', bedtimeToMorningDiff: 30` (30 mg/dL = 1.67 mmol/L bình thường, thấp hơn ngưỡng 50 mg/dL) vẫn kích hoạt sai `rec_dm2_overbasalization` và in tiêu đề phi lý: `"Cảnh báo quá liều insulin nền (Overbasalization): 0.27 U/kg/ngày (> 0.5 U/kg/ngày)"`.

#### `[DM2-R1-211]` (MAJOR | `rule` | `dm2.outpatient.statin_prevention`) — Khuyến cáo Statin dự phòng tiên phát không phân tầng tuổi `< 40` và ghi sai số hiệu khuyến cáo ADA 2026 (nhầm Rec 10.20 với dự phòng thứ phát ASCVD)
- **Vị trí mã nguồn:** [`statin_prevention`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts#L1664-L1693).
- **Bằng chứng:** Theo *ADA 2026 SOC 10* (tr. S218 / PDF tr. 8): *Rec 10.18 (Grade A)* áp dụng cho tuổi **40–75** không ASCVD; tuổi **20–39** (*Rec 10.19, Grade C*) chỉ *"may be reasonable"* khi có thêm yếu tố nguy cơ ASCVD; còn *Rec 10.20* là dự phòng tiên phát nguy cơ cao tuổi 40–75 (dự phòng thứ phát ASCVD là *Rec 10.22–10.23*). Hiện tại bệnh nhân 26 tuổi không yếu tố nguy cơ vẫn nhận khuyến cáo duy trì Statin trung bình–cao gắn trích dẫn thứ phát `ada.dm2.2026.statin_secondary`.

#### `[DM2-R1-212]` (MAJOR | `rule` | `dm2.safety.acute_pancreatitis_incretin`) — Đã khai báo `acute_pancreatitis` trong 9 tệp thuốc GLP-1/GIP-GLP-1 RA & DPP-4i nhưng không có trường nhập và không có quy tắc `STOP`/`AVOID` thực thi
- **Vị trí mã nguồn:** `kb/drugs/{semaglutide,semaglutide_oral,dulaglutide,liraglutide,tirzepatide,sitagliptin,linagliptin,vildagliptin,saxagliptin}.json`, [`inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts), [`rules.outpatient.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/rules.outpatient.ts).
- **Bằng chứng:** Bệnh nhân có `acute_pancreatitis: true` đang tiêm `semaglutide` vẫn nhận lệnh `[CONTINUE] Tiếp tục Semaglutide (SC)` trái với *ADA 2026 SOC 9 Table 9.2* (tr. S194 / PDF tr. 12: *"do not initiate if at high risk for pancreatitis, and discontinue if pancreatitis is suspected"*).

#### `[DM2-R1-213]` (MAJOR | `citation` | `byt.dm2.2020.obesity_asian_bmi25` & 4 trích dẫn ngưỡng khác) — Năm cặp ngưỡng/quy tắc trích dẫn văn bản PDF khớp con số nhưng sai hoàn toàn ngữ cảnh y khoa ("Contains-Number" Fallacy)
- **Vị trí KB:** [`kb/thresholds/dm2.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/thresholds/dm2.json) và [`kb/citations/dm2.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/kb/citations/dm2.json):
  1. `dm2.obesity.bmi_asian_threshold` (`25 kg/m²`) -> `byt.dm2.2020.obesity_asian_bmi25` trích **bảng mức tăng cân thai kỳ theo BMI phương Tây** (trang 58 QĐ 5481: thừa cân 25–29.9, béo phì ≥ 30) thay vì chuẩn BMI Châu Á ở **trang 11 QĐ 5481** (`BMI ≥ 23 kg/m²`).
  2. `dm2.glp1.egfr_min` (`15`) -> `ada.dm2.2026.flow_egfr_15` trích **định nghĩa tiêu chí kết cục suy thận đầu ra của FLOW** (`persistent eGFR <15`, ADA SOC 11 trang 8) thay vì ngưỡng kê đơn (thực tế ADA 2026 Rec 9.11 & 11.11b cho phép dùng GLP-1 RA tới lọc máu, còn ngưỡng không khuyến cáo khi `eGFR < 15` thuộc về **QĐ 5481 trang 64**!).
  3. `dm2.overbasal.dose_per_kg_max` (`0.5 U/kg/ngày`) -> `ada.dm2.2026.basal_half_tdd_05` trích **tổng liều khởi đầu của ĐTĐ típ 1** (ADA SOC 9 trang 3) cho ngưỡng overbasalization của ĐTĐ típ 2.
  4. `dm2.glucose.inpatient_target_min` (`140 mg/dL`) -> `byt.dm2.2020.inpatient_target_140` trích **ngưỡng mở lại truyền insulin 30 phút sau hạ đường huyết** (trang 39) thay vì câu khuyến cáo Mức A đích đường huyết nội trú ngay tại **trang 38 QĐ 5481** (`"Mục tiêu glucose máu từ 7,8 – 10,0 mmol/L (140 – 180 mg/dL) được khuyến cáo cho đa số BN (A)"`).
  5. `dm2.metformin.dose_reduced_max` (`1000 mg`) -> `byt.dm2.2020.metformin_formulations_p68` trích **hàm lượng viên thuốc thương mại** (`Viên 500-850-1000mg`, trang 68) thay vì giới hạn liều ở suy thận vừa.

#### `[DM2-R1-214]` (MAJOR | `drug` | `semaglutide` & 12 tệp thuốc ĐTĐ khác) — 13/22 tệp thuốc ĐTĐ gắn `citationIds` sai chuyên mục cho các mục chống chỉ định (`DrugEntry.contraindications`)
- **Chi tiết đối chiếu:**
  - 5 thuốc incretin (`semaglutide`, `semaglutide_oral`, `dulaglutide`, `liraglutide`, `tirzepatide`): mục `acute_pancreatitis` gắn `ada.dm2.2026.glp1_preferred_over_insulin` (Rec 9.21 ưu tiên GLP-1 hơn insulin, không có chữ nào về tụy); 4 thuốc sau mượn nhãn của Ozempic (`fda.semaglutide.boxed_warning_mtc`) thay vì trích nhãn FDA chính chủ đã có trong `kb/sources.json`.
  - 4 thuốc DPP-4i (`sitagliptin`, `linagliptin`, `vildagliptin`, `saxagliptin`): mục `acute_pancreatitis` gắn `ada.dm2.2026.pregnancy_noninsulin` (thai kỳ Ch. 15).
  - `pioglitazone.json`: mục `severe_hepatic_impairment` (`ALT > 2.5× ULN`) gắn `fda.pioglitazone.heart_failure_contra` (cảnh báo suy tim).
  - `metformin.json`: mục `severe_hepatic_impairment` gắn `fda.metformin.egfr_bands` (bảng eGFR thận).
  - `glimepiride.json` (và `rules.outpatient.ts` dòng 434): mục `dialysis` gắn `kdigo.dm2.2022.agi_avoid_severe_ckd` (chú thích của thuốc ức chế alpha-glucosidase Acarbose!) và mục `severe_hepatic_impairment` gắn `fda.glimepiride.hypo_elderly_renal`.

---

### Nhóm `MINOR` & `SUGGESTION` (4 phát hiện – Hoàn thiện độ bao phủ liên chuyên khoa, trải nghiệm người dùng và siêu dữ liệu)

- **`[DM2-R1-215]` (MINOR | `missing` | `dm2.outpatient.ckd_finerenone_hfpef_incretin`):** Khi chỉ bật module `dm2` trên bệnh nhân ĐTĐ2 có CKD kèm albumin niệu (`UACR >= 3 mg/mmol, eGFR >= 25`), nên phát nhắc nhở đánh giá **Finerenone (nsMRA)** hoặc gợi ý bật kèm module `ckd` theo *ADA 2026 SOC 11 Rec 11.8 (Grade A)*; đồng thời nêu rõ lợi ích mức A của Tirzepatide/Semaglutide ở phân nhóm **HFpEF + béo phì** theo *ADA 2026 SOC 9 Rec 9.9a/9.9b*.
- **`[DM2-R1-216]` (MINOR | `rule` | `dm2.inpatient.basal_bolus_regimen`):** Bổ sung hướng dẫn tạm ngừng thuốc viên sáng ngày mổ + giảm 20–25% liều insulin nền tối trước mổ khi `plannedSurgery: true` ở ngoại trú (*ADA 2026 SOC 16 tr. S346*); đồng thời đồng bộ liều khi bệnh nhân nội trú đã dùng sẵn Glargine liều cao tại nhà (tránh tiêu đề ghi `[Đang dùng nền: 36 U]` nhưng dòng `dose` bên dưới ghi `16 đơn vị`).
- **`[DM2-R1-217]` (MINOR | `ui` | `customInputs.dkaSuspected`):** Khai báo bổ sung ô tích chọn `customInputs.dkaSuspected` (Lâm sàng nghi ngờ DKA/HHS hoặc Ceton niệu `≥ 2+`) vào [`src/modules/dm2/inputs.ts`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/src/modules/dm2/inputs.ts) để khớp với logic sẵn có trong `rules.inpatient.ts` và thực tế tuyến cơ sở tại Việt Nam.
- **`[DM2-R1-218]` (SUGGESTION | `citation` | `kb/citations/dm2.json`):** Bổ sung trích dẫn từ 2 nguồn đã đăng ký trong `SOURCES_STATUS.md` (`ESC 2023 Diabetes & CVD` và `KDIGO 2025 GLP-1 Commentary`), thêm khóa `US` vào `profileDiff`, và điền `classOfRec` / `levelOfEvidence` cho 94 trích dẫn trong `kb/citations/dm2.json`.

---

## 4. Kết luận Cuối cùng (Final Verdict)

- **Tổng hợp mức độ nghiêm trọng Vòng 2:** `5 critical`, `9 major`, `3 minor`, `1 suggestion` (chi tiết đầy đủ trong [`round2_R1.json`](file:///C:/Users/hades/OneDrive/Desktop/New%20folder%20(4)/gdmt-vn/docs/reviews/dm2/round2_R1.json)).
- **Kết luận nghiệm thu:** **FAIL**
