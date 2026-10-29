# Báo Cáo Giải Trình & Khắc Phục Thẩm Định Vòng 1 & QA-10 – Module COPD (`copd`)
## Kính gửi Hội đồng Thẩm định (R1 – Hô hấp/Guideline, R2 – Dược sĩ lâm sàng, R3 – Phản biện an toàn) & Điều phối viên

- **Tác giả:** Agent L (Chuyên gia Hô hấp kiêm Kỹ sư Module COPD GDMT-VN)
- **Ngày hoàn thiện:** 27/10/2026
- **Văn bản giải trình:** Round 1 & Post-Round-1 QA-10 Audit Response (`round1_RESPONSE.md`)

---

## 1. TỔNG HỢP KẾT QUẢ KHẮC PHỤC TOÀN DIỆN CÁC PHÁT HIỆN (R1, R2, R3 & QA-9/QA-10)

| Reviewer | Mã Finding | Mức độ | Vấn đề ban đầu | Biện pháp khắc phục triệt để đã thực hiện | Trạng thái |
|:---:|:---:|:---:|---|---|:---:|
| **R1 / R2** | **COPD-R1-01 / R2-05** | 🔴 **CRITICAL** | Bỏ sót thuốc giãn phế quản tác dụng ngắn (SABA ± SAMA) trong đợt cấp; sai citation `2.5 mg` Salbutamol | Đã bổ sung quy tắc `copd.inpatient.short_acting_bronchodilators` (`salbutamol` 2.5–5 mg ± phối hợp Ipratropium khí dung bằng máy nén khí mỗi 4–6 giờ) và trích dẫn nguyên văn `byt.copd.2026.salbutamol_neb_dose` (BYT 2131/2026 tr. 36: `"1 ống 2,5mg/2,5ml"`). Ca chuẩn khóa lỗi: `copd_28`. | **ĐÃ GIẢI QUYẾT** |
| **R3** | **R3-COPD-01** | 🔴 **CRITICAL** | Kê LAMA hoặc LABA không kèm ICS cho bệnh nhân đồng mắc Hen / ACO (kể cả Nhóm A/B và khi đang dùng sẵn LAMA/LABA) | Chặn tuyệt đối LAMA/LABA không ICS khi có `priorAsthma`/`asthma`; bổ sung `copd.outpatient.initial_aco_asthma_overlap` và `copd.followup.aco_missing_ics_switch`, đồng thời điều phối liên module `['copd', 'asthma']` qua `willAsthmaModulePrescribeIcsLaba()` (thêm `tiotropium` trên nền `budesonide_formoterol` không trùng LABA/ICS). Ca chuẩn khóa lỗi: `copd_33`. | **ĐÃ GIẢI QUYẾT** |
| **R3** | **R3-COPD-02** | 🔴 **CRITICAL** | Kê nhầm Corticoid toàn thân, Oxy cấp cứu và checklist đợt cấp khi bệnh nhân nhập viện vì lý do khác (`acuteExacerbation: false`) | Đã siết chặt toàn bộ gói đợt cấp (`short_acting_bronchodilators`, `controlled_oxygen`, `systemic_steroid`, `antibiotics`, `niv_bipap`, `vte_prophylaxis`, `discharge_criteria`) chỉ chạy khi `acuteExacerbation === true`; khi `acuteExacerbation === false` (kể cả `inpatient`) chỉ đánh giá phác đồ duy trì mạn tính. Ca chuẩn khóa lỗi: `copd_34`. | **ĐÃ GIẢI QUYẾT** |
| **R2** | **COPD-R2-01** | 🔴 **CRITICAL** | Cấu hình liều Breztri và Trimbow dễ gây hiểu nhầm dùng thiếu 50% liều (1 nhát thay vì 2 nhát x 2 lần/ngày) | Đã chuẩn hóa cấu trúc liều `amount: 2, unit: "nhát", frequency: "2 lần/ngày"` cho cả `budesonide_glycopyrronium_formoterol` và `beclometasone_glycopyrronium_formoterol`. | **ĐÃ GIẢI QUYẾT** |
| **R2 / R3** | **COPD-R2-02 / R3-04** | 🔴 **CRITICAL** | Kê Roflumilast ở bệnh nhân xơ gan / suy gan Child-Pugh B–C, suy kiệt sụt cân, trầm cảm / ý định tự sát | Đã bổ sung quy tắc an toàn `copd.safety.roflumilast_contraindicated` (`AVOID` hoặc `STOP` nếu đang dùng trong `currentMeds`) chặn `liverDisease`/`cirrhosis`/`childPugh B-C`, `unexplainedWeightLoss`/`underweight`, `depression`/`suicidalIdeation`, `pregnant`; đồng thời cập nhật `contraindications` máy đọc trong `kb/drugs/roflumilast.json` kèm trích dẫn `fda.copd.roflumilast_psychiatric_weight` & `gold.copd.2026.roflumilast_weight_depression`. Ca chuẩn khóa lỗi: `copd_35`. | **ĐÃ GIẢI QUYẾT** |
| **R3** | **R3-COPD-03 / R3-11** | 🔴 **CRITICAL** | Nguy cơ còn tồn tại ICS đơn trị hoặc trùng lặp ≥ 2 thuốc chứa LAMA / ≥ 2 thuốc chứa LABA trong `currentMeds` hoặc khi nâng bậc | Bổ sung bộ 4 quy tắc an toàn tự động: `copd.safety.ics_monotherapy_stop`, `copd.safety.duplicate_lama_stop`, `copd.safety.duplicate_laba_stop`, và `copd.safety.stop_superseded_inhaler` đảm bảo phác đồ sau xử lý có **0 ICS đơn trị, tối đa 1 LAMA và tối đa 1 LABA**. Ca chuẩn khóa lỗi: `copd_29`, `copd_37`, `copd_38`. | **ĐÃ GIẢI QUYẾT** |
| **R3** | **R3-COPD-05 / R2-12** | 🟠 **MAJOR** | Kê Azithromycin dự phòng dài hạn trên nền thuốc kéo dài khoảng QT (`amiodarone`, `sotalol`...), QTc kéo dài, giảm thính lực hoặc nhiễm NTM | Bổ sung quy tắc `copd.safety.azithromycin_contraindicated` (`AVOID` hoặc `STOP`) quét danh sách thuốc kéo dài QT (`QT_PROLONGING_DRUG_IDS`), `qtcProlonged`, `hearingImpairment`, `ntmInfection`; cập nhật `qtRisk: 'known'` và `contraindications` trong `kb/drugs/azithromycin.json`. Ca chuẩn khóa lỗi: `copd_36`. | **ĐÃ GIẢI QUYẾT** |
| **R1** | **COPD-R1-02** | 🟠 **MAJOR** | Mượn nhầm ngưỡng `copd.mmrc_high` (= 2) cho đợt cấp vừa Nhóm E và văn bản hướng dẫn cũ ghi `"≥ 2 đợt cấp vừa"` | Đã dùng `thFor('moderateExacerbations', 'copd.exacerbation_moderate_group_e')` (= 1) và cập nhật toàn bộ `inputs.ts`, `pathways.ts`, `COPD.md`: **≥ 1 đợt cấp vừa hoặc ≥ 1 đợt nhập viện trong 12 tháng qua → Nhóm E** (GOLD 2026 & BYT QĐ 2131/2026). Ca chuẩn khóa lỗi: `copd_27`. | **ĐÃ GIẢI QUYẾT** |
| **R1** | **COPD-R1-03** | 🟠 **MAJOR** | Bế tắc theo dõi khi đang dùng đơn trị LAMA/LABA hoặc ICS+LABA xuất hiện đợt cấp; thiếu nhánh khó thở trên LABA+LAMA | Đã bổ sung đầy đủ các quy tắc theo dõi: `mono_exac_step_up_laba_lama`, `mono_exac_step_up_triple`, `ics_laba_step_up_or_switch` (BYT Biểu đồ 0.2), và `dyspnea_on_laba_lama` (đổi thiết bị/phân tử + phục hồi chức năng hô hấp). Ca chuẩn khóa lỗi: `copd_29`. | **ĐÃ GIẢI QUYẾT** |
| **R1 / R2 / R3** | **COPD-R1-04 / R2-03 / R3-09** | 🟠 **MAJOR** | Kê kháng sinh đợt cấp sai tiêu chuẩn Anthonisen khi chỉ tăng đờm trong không mủ | Đã sửa `copd.inpatient.antibiotics`: chỉ `START` kháng sinh khi có đờm mủ (`purulentSputum === true`) hoặc suy hô hấp toan hô hấp cấp cần thở máy (`pH ≤ 7.35` VÀ `PaCO₂ ≥ 45 mmHg`); bổ sung `profileDiff` phân tầng nguy cơ *Pseudomonas aeruginosa* theo BYT 2131/2026 tr. 40 (`byt.copd.2026.antibiotics_pseudomonas`). Ca chuẩn khóa lỗi: `copd_30`. | **ĐÃ GIẢI QUYẾT** |
| **R1 / R2** | **COPD-R1-05 / R1-13 / R2-06 / R2-14** | 🟠 **MAJOR** | Khóa sai chỉ định Mepolizumab khi có viêm phế quản mạn; ẩn Mepolizumab ở profile VN và thiếu dòng Mepolizumab trong ma trận | Đã gỡ bỏ điều kiện `!chronicBronchitis`, mở `profiles: ['INTL', 'VN']` kèm `profileDiff` nêu rõ tình trạng đăng ký chỉ định COPD & BHYT tại VN, và thêm dòng `mepolizumab` vào `copdMatrixTherapy`. Ca chuẩn khóa lỗi: `copd_31`. | **ĐÃ GIẢI QUYẾT** |
| **R1** | **COPD-R1-06** | 🟠 **MAJOR** | Bỏ sót thông khí nhân tạo không xâm nhập tại nhà (Home NIV) | Bổ sung quy tắc `copd.outpatient.home_niv` khi PaCO₂ ban ngày > 53 mmHg ổn định sau đợt cấp (GOLD 2026 tr. 89). Ca chuẩn khóa lỗi: `copd_32`. | **ĐÃ GIẢI QUYẾT** |
| **R1** | **COPD-R1-07** | 🟠 **MAJOR** | Bỏ sót kết luận phân độ tắc nghẽn GOLD 1–4 | Bổ sung quy tắc `copd.diagnosis.gold_grade_staging` phân độ GOLD 1–4 theo `fev1PredPct`. | **ĐÃ GIẢI QUYẾT** |
| **R1 / R3** | **COPD-R1-08 / R3-06** | 🟠 **MAJOR** | Lọt nhánh theo dõi COPD khi FEV₁/FVC ≥ 0.70 bình thường | Toàn bộ quy tắc khởi trị và theo dõi đều đi qua `hasConfirmedCopdSpirometry(ctx)` (`fev1FvcRatio < 0.70` VÀ đủ `fev1PredPct`). Ca chuẩn khóa lỗi: `copd_40`. | **ĐÃ GIẢI QUYẾT** |
| **R2** | **COPD-R2-08 / R2-10** | 🟠 **MAJOR** | Ma trận đánh dấu `initiate: 'rec'` cho thuốc leo thang (`roflumilast`, `azithromycin`, `dupilumab`); ma trận dụng cụ hít dùng dòng giả phi thuốc | Đã chuyển toàn bộ `initiate: 'not_rec'` cho `roflumilast`, `azithromycin`, `dupilumab`, `mepolizumab` trong `copdMatrixTherapy`; thiết kế lại `copdMatrixDevices` thành ma trận 5 thuốc-dụng cụ thật lưu hành tại VN (Spiriva Respimat SMI, Spiolto Respimat SMI, Ultibro Breezhaler DPI, Trelegy Ellipta DPI, Breztri Aerosphere pMDI) theo lực hít và khả năng phối hợp. | **ĐÃ GIẢI QUYẾT** |
| **R1 / R3** | **COPD-R1-09 / R3-08** | 🟡 **MINOR** | Bỏ sót SpO₂ = 89% kèm tâm phế mạn / đa hồng cầu trong chỉ định LTOT; nguy cơ thở oxy quá liều khi SpO₂ > 92% trong đợt cấp | Bổ sung ngưỡng `copd.ltot_cor_pulmonale_spo2_upper = 90` (`restingSpo2 < 90%` tức ≤ 89% kèm tâm phế mạn/đa hồng cầu → `START` LTOT) kèm trích dẫn `byt.copd.2026.ltot_target_spo2_90_92`; bổ sung `copd.inpatient.avoid_hyperoxia` cảnh báo giảm/ngừng oxy khi `restingSpo2 > 92%` trong đợt cấp. Ca chuẩn khóa lỗi: `copd_39`. | **ĐÃ GIẢI QUYẾT** |
| **R1 / R2** | **COPD-R1-10 / R1-11 / R1-12 / R2-09 / R2-11 / R2-13** | 🟡 **MINOR** | Azithromycin cho phép cả `former` & `never` smoker (fail-closed khi thiếu `smokingStatus`); Roflumilast `CONSIDER`; dự phòng VTE nội viện; chống chỉ định glaucoma góc đóng/bí tiểu cho 10 thuốc LAMA; cảnh báo TDM Theophylline; cập nhật `vnBrands` | Đã hoàn tất 100% trong `src/modules/copd/rules.ts` và 19 tệp thuốc `kb/drugs/*.json`. | **ĐÃ GIẢI QUYẾT** |
| **QA-9 & QA-10** | **QA-9 / QA-10** | 🔴 **BẮT BUỘC** | Chuẩn hóa đại lượng `quantity` (`ThresholdQuantity`) và `thFor(quantity, id)`; chuẩn hóa metadata thai kỳ/cho con bú/nhóm thuốc/hash review | 45/45 Thresholds trong `kb/thresholds/copd.json` có `quantity` chuẩn và truy xuất qua `thFor(quantity, id)`; 19/19 thuốc sở hữu có đầy đủ `pregnancy`, `lactation`, `contraindications`, `classes`, `components`, `qtRisk`; đồng bộ 64 tệp `kb/review/` ở mức `auto_checked` (tuyệt đối không tự nâng `ai_multi_reviewed`). | **ĐÃ GIẢI QUYẾT** |

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & BẢO ĐẢM CHẤT LƯỢNG

1. **Kiểm tra Knowledge Base & Static Rules Linter (`npm run verify:kb`):**
   - Toàn cục KB: **0 lỗi**.
   - Dòng `copd` trên bảng QA Linter (6 files):
     - `LỖI (??/const)`: **0**
     - `QA-ALLOW SAI`: **0**
     - `SO SÁNH LITERAL`: **0**
     - `TEXT LITERAL LIỀU`: **0**
     - `LIỀU LỆCH CITATION`: **0**
   - `MISSING_QUANTITY` (QA-10), `WARN_DRUG_MISSING_PREGNANCY`, `WARN_DRUG_MISSING_CLASSES`, `HASH_MISMATCH_DRAFT` cho Agent L (`copd` + 19 thuốc): **0**.
2. **Kiểm thử Bất biến An toàn Tất định (`tests/modules/copd/invariants.test.ts`):**
   - **Suite 1 (12.000 ca lâm sàng ngẫu nhiên tất định – Mulberry32 PRNG):** **0 vi phạm** trên 10 bất biến cốt lõi (bao gồm `currentMeds` chứa ICS đơn trị, trùng 2 LAMA/2 LABA, đồng dùng `amiodarone`, đồng mắc `['copd', 'asthma']`, nội viện không đợt cấp, bệnh gan/trầm cảm/sụt cân).
   - **Suite 2 (10.000 ca xóa ngẫu nhiên 1–5 trường lâm sàng – QA-1 & QA-9 Fail-Closed):** **0 vi phạm** fail-closed.
   - **Suite 3 (40 Ca chuẩn Golden Cases `copd_01`..`copd_40`):** **40/40 ca chuẩn PASS 100%** (bao gồm 14 ca hồi quy mới `copd_27`..`copd_40`).

---

## 3. KẾT LUẬN

Toàn bộ phát hiện CRITICAL, MAJOR, MINOR của cả 3 Reviewer (R1, R2, R3) cùng toàn bộ tiêu chuẩn kỹ thuật QA-1, QA-7, QA-8, QA-9 và QA-10 đã được xử lý triệt để, kiểm chứng tự động trên **22.000 ca bất biến tất định** và **40 ca chuẩn lâm sàng**. Kính đề nghị Hội đồng Thẩm định phê duyệt Vòng 2 cho module **COPD (`copd`)**.
